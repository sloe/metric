
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
        this.containerElem = $(elemPrefix + '_container');
        this.fineElem = $(elemPrefix + '_fine');
        this.fineElemRow = $(elemPrefix + '_fine_row');
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
            this.hasFine = true;

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
            this.hasFine = false;

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
        } else if (typeName === 'rate_per_min') {
            this.coarseStep = 0.1;
            this.fineRange = 1.0;
            this.hasFine = false;

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

        if (!this.hasFine) {
            this.fineElemRow.hide()
        }

        Backbone.Mediator.subscribe('mt:selectionChange', this.onMtSelectionChange, this);
        Backbone.Mediator.subscribe('mt:intervalCollectionValueChange', this.onMtCollectionValueChange, this);
        Backbone.Mediator.subscribe('mt:paramCollectionValueBroadcast', this.onMtParamCollectionValueBroadcast, this);

        this.containerElem.mousedown(this.onClickContainer.bind(this));

        return this;
    };


    this.setValue = function(value) {
        if (_.isFinite(value)) {
            var coarseValue = Math.floor(value / this.coarseStep) * this.coarseStep;
            var fineValue = value - coarseValue;
            this.coarseSlider.update({from: coarseValue});
            this.fineSlider.update({from: fineValue});

            if (this.valueElem) {
                this.valueElem.text(value);
            }
        }
    };


    this.onClickContainer = function(event) {
        Backbone.Mediator.publish('mt:setSelection', {
            changes: {
                activeProperty: this.propertyName
            },
            options: {
                mtId: this.mtId,
                source: this.sourceName
            }
        });
    }


    this.onMtCollectionValueChange = function(model, options) {
        if (model.collection.mtId === this.mtId && model.changed &&
            (_.isUndefined(options.row) || options.row === this.activeRow)) {

            if (this.valueElem) {
                _.each(model.changed, function(value, property) {
                    if (property === this.propertyName) {
                        this.valueElem.text(value);
                    }
                }, this);
            }

            if (options.source !== this.sourceName) { // Don't respond to our own events
                _.each(model.changed, function(value, property) {
                    if (property === this.propertyName) {
                        this.setValue(value);
                    }
                }, this);
            }
        }
    };


    this.onMtSelectionChange = function(event) {
        var css, opacity;
        if (event.mtId === this.mtId) {

            if (event.activeProperty === this.propertyName) {
                css = {'border-color': '#af8'} // '#af8' or '#8df'
                opacity = 1.0;
            } else {
                css = {'border-color': '#fff'}
                opacity = 1.0;
            }

            this.containerElem.fadeTo(150, opacity).css(css);

            if (this.activeRow !== event.activeRow) {
                this.activeRow = event.activeRow;
                if (!_.isUndefined(event.values[this.propertyName])) {
                    this.setValue(event.values[this.propertyName]);
                }
                mtlog.log('MtControlShuttle.onMtSelectionChange: ' + JSON.stringify(event));
            }
        }
    };


    this.onMtParamCollectionValueBroadcast = function(models, options) {
        // mtlog.log('MtControlShuttle.onMtParamCollectionValueBroadcast: ' + JSON.stringify(models) + ', ' + JSON.stringify(options));
        _.each(models, function(model, options) {
            if (model.attributes.param === 'speed_factor' && this.typeName === 'duration') {
                this.fineSlider.update({min: -Math.min(model.attributes.value), max: Math.ceil(model.attributes.value)});
            } else if (model.attributes.param === 'video_duration' && this.typeName === 'duration') {
                this.coarseSlider.update({max: Math.ceil(model.attributes.value)});
            } else if (model.attributes.param === 'min_rate_per_min' && this.typeName === 'rate_per_min') {
                this.coarseSlider.update({min: Math.floor(model.attributes.value)});
            } else if (model.attributes.param === 'max_rate_per_min' && this.typeName === 'rate_per_min') {
                this.coarseSlider.update({max: Math.ceil(model.attributes.value)});
            }
        }, this);
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
            num_events: new MtControlShuttle().create(mtId, 'num_events', 'count', 1, 200),
            rate: new MtControlShuttle().create(mtId, 'rate', 'rate_per_min', 10, 60)
        };
    };
};
