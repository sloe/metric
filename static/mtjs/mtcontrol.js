
"use strict";

function MtControlShuttle () {

    this.onValueChange = function(event) {
        if (event.id === this.id) {
            _.each(event.changes, function(change) {
                if (change.property === 'start_time') {
                    this.valueElem.text(change.value);
                }
            }, this);

            if (event.source !== 'slider') {
                _.each(event.changes, function(change) {
                    if (change.property === 'start_time') {
                        var coarseValue = Math.floor(change.value / this.coarseStep) * this.coarseStep;
                        var fineValue = change.value - coarseValue;
                        this.coarseSlider.update({from: coarseValue});
                        this.fineSlider.update({from: fineValue});
                    }
                }, this);
            }
        }
    };

    this.publishValueChange = function(value) {
        var eventId = 'mt:valueChange';
        var value = this.coarseSlider.result.from + this.fineSlider.result.from;
        Backbone.Mediator.publish(eventId, {
            changes: [{property: 'start_time', value: value}],
            id: this.id,
            source: 'slider'
        });
    };

    this.create = function(id, durationSecs) {
        var momentFormat;
        if (durationSecs >= 3600) {
            momentFormat = "HH:mm:ss.S";
        } else {
            momentFormat = "mm:ss.S";
        }

        this.id = id;
        this.coarseElem = $('#slider' + id + '_coarse');
        this.fineElem = $('#slider' + id + '_fine');
        this.valueElem = $('#slider' + id + '_value');

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

        Backbone.Mediator.subscribe('mt:valueChange', this.onValueChange, this);
    };
};
