
"use strict";

function MtControlShuttle () {

    this.create = function(mtId, propertyName, typeName, minValue, maxValue) {
        this.mtId = mtId;
        this.propertyName = propertyName;
        this.typeName = typeName;

        this.activeRow = null;
        this.sourceName = 'slider:' + propertyName;

        var elemPrefix = '#slider' + mtId + '_' + propertyName;
        this.coarseElem = $(elemPrefix + '_coarse');
        this.fineElem = $(elemPrefix + '_fine');
        this.valueElem = $(elemPrefix + '_value');

        var coarsePrettify, finePrettify;
        if (typeName === 'duration') {
            var momentFormat;
            if (maxValue >= 3600) {
                momentFormat = "HH:mm:ss.S";
            } else {
                momentFormat = "mm:ss.S";
            }

            this.coarseStep = 0.1;
            this.fineRange = 1.0;

            coarsePrettify = function(num) {
                var m = moment(num, "X");
                return m.format(momentFormat);
            };
            finePrettify = function(num) {
                if (num > 0) {
                    return '+' + num.toFixed(3) + 's';
                } else {
                    return num.toFixed(3) + 's';
                }
            };
        } else if (typeName === 'count') {
            this.coarseStep = 1;
            this.fineRange = 1;
            coarsePrettify = function(num) {
                return num.toFixed(0);
            };
            finePrettify = function(num) {
                if (num > 0) {
                    return '+' + num.toFixed(3);
                } else {
                    return num.toFixed(3);
                }
            };
        } else if (typeName === 'ratepermin') {
            this.coarseStep = 0.1;
            this.fineRange = 1.0;
            coarsePrettify = function(num) {
                return num.toFixed(1);
            };
            finePrettify = function(num) {
                if (num > 0) {
                    return '+' + num.toFixed(3);
                } else {
                    return num.toFixed(3);
                }
            };
        } else {
            mtlog.log('Bad typeName ' + typeName);
        }


        var coarseOnChange = function(obj) {
            this.fineSlider.reset();
            this.publishControlChangedValue();
        };

        var coarseOnFinish = function(obj) {
            this.fineSlider.reset();
            this.publishControlChangedValue();
            this.publishControlFinish();
        };

        this.coarseElem.ionRangeSlider({
            min: minValue,
            max: maxValue,
            force_edges: true,
            from: 0,
            grid: true,
            hide_min_max: true,
            prettify: coarsePrettify,
            scope: this,
            step: this.coarseStep,
            onChange: coarseOnChange,
            onFinish: coarseOnFinish
        });


        var fineOnChange = function(obj) {
            this.publishControlChangedValue();
        };

        var fineOnFinish = function(obj) {
            // Bring fine slider back to centre if it's at the extremes
            var value = obj.from;
            var truncValue = Math.trunc(value / obj.max) * obj.max;
            if (truncValue <= obj.min || truncValue >= obj.max) {
                var coarseValue = this.coarseSlider.result.from;
                this.coarseSlider.update({from: coarseValue + truncValue});
                this.fineSlider.update({from: value - truncValue});
            }
            this.publishControlChangedValue();
            this.publishControlFinish();
        };

        this.fineElem.ionRangeSlider({
            min: -this.fineRange,
            max: this.fineRange,
            from: 0,
            grid: true,
            force_edges: true,
            prettify: finePrettify,
            onChange: fineOnChange,
            onFinish: fineOnFinish,
            scope: this,
            step: 0.001
        });


        this.coarseSlider = this.coarseElem.data("ionRangeSlider");
        this.fineSlider = this.fineElem.data("ionRangeSlider");

        Backbone.Mediator.subscribe('mt:selectionChange', this.onSelectionChange, this);
        Backbone.Mediator.subscribe('mt:intervalCollectionValueChange', this.onMtCollectionValueChange, this);

        return this;
    };


    this.setValue = function(value) {
        var coarseValue = Math.floor(value / this.coarseStep) * this.coarseStep;
        var fineValue = value - coarseValue;
        this.coarseSlider.update({from: coarseValue});
        this.fineSlider.update({from: fineValue});
        this.valueElem.text(value);
    };


    this.onMtCollectionValueChange = function(model, options) {
        if (model.collection.mtId === this.mtId && model.changed &&
            (_.isUndefined(options.row) || options.row === this.activeRow)) {
            _.each(model.changed, function(value, property) {
                if (property === this.propertyName) {
                    this.valueElem.text(value);
                }
            }, this);

            if (options.source !== this.sourceName) { // Don't respond to our own events
                _.each(model.changed, function(value, property) {
                    if (property === this.propertyName) {
                        this.setValue(value);
                    }
                }, this);
            }
        }
    };


    this.onSelectionChange = function(event) {
        if (event.mtId === this.mtId && this.activeRow !== event.activeRow) {
            this.activeRow = event.activeRow;
            if (!_.isUndefined(event.values[this.propertyName])) {
                this.setValue(event.values[this.propertyName]);
            }
            mtlog.log('MtControlShuttle.onSelectionChange: ' + JSON.stringify(event));
        }
    };


    this._changeEventData = function(ongoing) {
        var value = this.coarseSlider.result.from + this.fineSlider.result.from;
        return {
            changes: [{
                property: this.propertyName,
                row: this.activeRow,
                value: value
            }],
            options: {
                mtId: this.mtId,
                ongoing: ongoing,
                originator: this.propertyName,
                row: this.activeRow,
                source: this.sourceName
            }
        };
    }

    this.publishControlChangedValue = function() {
        var eventId = 'mt:controlChangedValue';
        Backbone.Mediator.publish(eventId, this._changeEventData(true));
    };


    this.publishControlFinish = function() {
        var eventId = 'mt:controlFinish';
        Backbone.Mediator.publish(eventId, this._changeEventData(false));
    };
};


function MtControlInterval () {

    this.create = function(mtId, durationSecs) {
        this.shuttles = {
            start_time: new MtControlShuttle().create(mtId, 'start_time', 'duration', 0, durationSecs),
            end_time: new MtControlShuttle().create(mtId, 'end_time', 'duration', 0, durationSecs),
            num_events:  new MtControlShuttle().create(mtId, 'num_events', 'count', 0, 200),
            rate:  new MtControlShuttle().create(mtId, 'rate', 'ratepermin', 10, 60)
        };
    };
};
