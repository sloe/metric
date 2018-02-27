
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
            }
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
}


MtChart.prototype.onMtIntervalCollectionValueChange = function(model, options) {
    if (model.collection.mtId === this.mtId && model.changed) {
        if (options.source !== this.sourceName) { // Don't respond to our own events
            this._updateFromModel(model, options);
        }
    }
};


MtChart.prototype.onSelectionChange = function(event) {
};