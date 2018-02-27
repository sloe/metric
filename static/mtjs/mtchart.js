
"use strict";

function MtChart() {};

MtChart.prototype.create = function(gdata, mtId, intervalCollection) {

    this.gdata = gdata;
    this.mtId = mtId;
    this.intervalCollection = intervalCollection;

    var elemPrefix = 'chart' + mtId;
    // this.captionElem = $('#' + elemPrefix + '_caption');

    this.propertyType = 'rate';
    this.sourceName = 'chart';
    this.lastUpdateMsec = 0;
    this.transitionMsec = 500;

    var chartElemId = elemPrefix + '_' + this.propertyType;

    this.chartElem = $('#' + chartElemId);

    this.chart = c3.generate({
        axis: {
            x: {
                label: {
                    text: 'Time (seconds)',
                    position: 'outer-center'
                },
                tick: {
                    format: d3.format('.2f')
                }
            },
            y: {
                label: {
                    text: 'Stroke rate',
                    position: 'outer-middle'
                },
                tick: {
                    format: d3.format('.0f')
                }
            }
        },
        bindto: '#' + chartElemId,
        data: {
            names: {
                rate: 'Stroke Rate',
                ratex: 'Midpoint of interval (seconds)'
            },
            columns: [
                ['rate', 0, 0]
            ],
            selection: {
                enabled: true
            },
            type: 'spline'
        },
        grid: {
            y: {
                show: true
            }
        },
        legend: {
            show: false
        },
        tooltip: {
            format: {
                title: function (d) { return 'Midpoint ' + d.toFixed(3) + 's'; },
                value: d3.format('.3f')
            }
        },
        transition: {
            duration: this.transitionMsec
        },
        zoom: {
            enabled: false // Not working
        }

    });

    Backbone.Mediator.subscribe('mt:intervalCollectionValueChange', this.onMtIntervalCollectionValueChange, this);
    Backbone.Mediator.subscribe('mt:selectionChange', this.onSelectionChange, this);
};


MtChart.prototype._dataFromModel = function(model, options) {
    var x = [];
    var y = [];

    _.each(model.collection.models, function(model) {
        var startTime = model.attributes['start_time'];
        var endTime = model.attributes['end_time'];
        var numEvents = model.attributes['num_events'];
        var rate = model.attributes['rate'];
        if (_.isFinite(startTime) && _.isFinite(endTime) && _.isFinite(rate) && startTime < endTime && numEvents === 1) {
            var intervalMidpoint = (model.attributes['start_time'] + model.attributes['end_time']) / 2;
            x.push(intervalMidpoint);
            y.push(rate);
        }
    }, this);

    return {
        rate: y,
        ratex: x
    };
}


MtChart.prototype._updateFromModel = function(model, options) {
    var data = this._dataFromModel(model, options);
    this.chart.load({
          xs: {
            'rate': 'ratex',
          },
          columns: [
            ['rate'].concat(data.rate),
            ['ratex'].concat(data.ratex),
          ]
    });

    this.lastUpdateMsec = Date.now();
}


MtChart.prototype.onMtIntervalCollectionValueChange = function(model, options) {

    if (model.collection.mtId === this.mtId && model.changed && options.source !== this.sourceName) {
        if (options.ongoing) {
            var msecSinceLast = Date.now() - this.lastUpdateMsec;
            this.chart.unselect(['rate']);
            clearTimeout(this.updateTimeout);
            var boundCall = (function(model, options) { this._updateFromModel(model, options); }).bind(this);
            var fractionOfTransitionMsec = this.transitionMsec / 2;
            if  (msecSinceLast < fractionOfTransitionMsec) {
                this.updateTimeout = setTimeout(boundCall, fractionOfTransitionMsec - msecSinceLast, model, options);
            } else {
                this._updateFromModel(model, options);
            }
        } else {
            clearTimeout(this.updateTimeout);
            this._updateFromModel(model, options);
            if (_.isFinite(this.activeRow) && !_.isUndefined(options.source) && options.source.startsWith('slider:')) {
                this.chart.select(['rate'], [this.activeRow]);
            } else {
                this.chart.unselect(['rate']);
            }
        }
    }
};


MtChart.prototype.onSelectionChange = function(event) {
    this.activeRow = event.activeRow;
    this.chart.select(['rate'], [this.activeRow], true);
};
