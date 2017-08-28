

"use strict";

function MtIntervalModel () {



    this.create = function(id) {
        this.containerElem = document.getElementById(id);
        //addCar = document.getElementById('add_car'),
        //eventHolder = document.getElementById('example1_events'),
        var IntervalModel = Backbone.Model.extend({});

        function emulateSplice(index, howMany) {
            var args = _.toArray(arguments).slice(2).concat({at: index});
            var removed = this.models.slice(index, index + howMany);
            this.remove(removed).add.apply(this, args);
            return removed;
        };

        var IntervalCollection = Backbone.Collection.extend({
            model: IntervalModel,
            splice: emulateSplice
        });

        this.intervals = new IntervalCollection();

        this.intervals.add([
            {start_time: 1, end_time: 21, num_events: 10}
        ]);

        function attr(attr) {
            return {data: function (interval, value) {
                if (_.isUndefined(value)) {
                    return interval.get(attr);
                }
                interval.set(attr, value);
            }};
        };

        function makeInterval() {
            return new IntervalModel();
        };

        this.hot = new Handsontable(this.containerElem, {
            data: this.intervals,
            dataSchema: makeInterval,
            contextMenu: true,
            columns: [
                attr('start_time'),
                attr('end_time'),
                attr('num_events')
            ],
            colHeaders: ['Start', 'End', 'Number']
        });
    };
};


var ItemModel = Backbone.Model.extend({
    parse: function(data) {
        return data.item;
    },
    url: '/apiv1/item/1.json',
    defaults: {
        f_name: 'defaultname',
        f_sourceid: 'defaultsourceid'
    }

});

