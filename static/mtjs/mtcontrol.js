
"use strict";

function MtControlShuttle () {

    this.setValue = function(value) {
        var coarseValue = Math.floor(value / this.coarseStep) * this.coarseStep;
        var fineValue = value - coarseValue;
        this.coarseSlider.update({from: coarseValue});
        this.fineSlider.update({from: fineValue});
        this.valueElem.text(value);
    };


    this.onValueChange = function(event) {
        if (event.id === this.id) {
            _.each(event.changes, function(change) {
                if (change.property === this.propertyName) {
                    this.valueElem.text(change.value);
                }
            }, this);

            if (event.source !== 'slider') { // Don't respond to our own events
                _.each(event.changes, function(change) {
                    if (change.property === this.propertyName) {
                        this.setValue(change.value);
                    }
                }, this);
            }
        }
    };


    this.onSelectionChange = function(event) {
        if (event.id === this.id && this.activeRow !== event.activeRow) {
            this.activeRow = event.activeRow;
            if (!_.isUndefined(event.values[this.propertyName])) {
                this.setValue(event.values[this.propertyName]);
            }
            console.log('MtControlShuttle.onSelectionChange: ' + JSON.stringify(event));
        }
    };


    this.publishValueChange = function(value) {
        var eventId = 'mt:valueChange';
        var value = this.coarseSlider.result.from + this.fineSlider.result.from;
        Backbone.Mediator.publish(eventId, {
            changes: [{property: this.propertyName, row: this.activeRow, value: value}],
            id: this.id,
            source: 'slider'
        });
    };


    this.create = function(id, propertyName, typeName, durationSecs) {
        this.id = id;
        this.propertyName = propertyName;
        this.typeName = typeName;

        this.activeRow = 0;
        var elemPrefix = '#slider' + id + '_' + propertyName;
        this.coarseElem = $(elemPrefix + '_coarse');
        this.fineElem = $(elemPrefix + '_fine');
        this.valueElem = $(elemPrefix + '_value');

        var momentFormat;
        if (durationSecs >= 3600) {
            momentFormat = "HH:mm:ss.S";
        } else {
            momentFormat = "mm:ss.S";
        }

        this.coarseStep = 0.1;
        this.fineRange = 1.0;

        var coarseOnChange = function(obj) {
            this.fineSlider.reset();
            this.publishValueChange();
        };

        this.coarseElem.ionRangeSlider({
            min: 0,
            max: durationSecs,
            force_edges: true,
            from: 0,
            grid: true,
            hide_min_max: true,
            prettify: function (num) {
                var m = moment(num, "X");
                return m.format(momentFormat);
            },
            scope: this,
            step: this.coarseStep,
            onChange: coarseOnChange
        });


        var fineOnChange = function(obj) {
            var value = obj.from;
            var truncValue = Math.trunc(value / obj.max) * obj.max;
            this.publishValueChange();
        };

        var fineOnFinish = function(obj) {
            var value = obj.from;
            var truncValue = Math.trunc(value / obj.max) * obj.max;
            if (truncValue <= obj.min || truncValue >= obj.max) {
                var coarseValue = this.coarseSlider.result.from;
                this.coarseSlider.update({from: coarseValue + truncValue});
                this.fineSlider.update({from: value - truncValue});
            }
            this.publishValueChange();
        };

        this.fineElem.ionRangeSlider({
            min: -this.fineRange,
            max: this.fineRange,
            from: 0,
            grid: true,
            force_edges: true,
            prettify: function (num) {
                if (num > 0) {
                    return '+' + num.toFixed(3) + 's';
                } else {
                    return num.toFixed(3) + 's';
                }
            },
            onChange: fineOnChange,
            onFinish: fineOnFinish,
            scope: this,
            step: 0.001
        });


        this.coarseSlider = this.coarseElem.data("ionRangeSlider");
        this.fineSlider = this.fineElem.data("ionRangeSlider");

        Backbone.Mediator.subscribe('mt:selectionChange', this.onSelectionChange, this);
        Backbone.Mediator.subscribe('mt:valueChange', this.onValueChange, this);

        return this;
    };
};


function MtControlInterval () {

    this.create = function(id, durationSecs) {
        this.shuttles = {
            start_time: new MtControlShuttle().create(id, 'start_time', 'duration', durationSecs),
            end_time: new MtControlShuttle().create(id, 'end_time', 'duration', durationSecs),
            num_events:  new MtControlShuttle().create(id, 'num_events', 'count', durationSecs)
        };
    };
};
