
"use strict";

var MtIntervalModel = Backbone.Model.extend({
    recalculate: function(options) {
        var attr = this.attributes;
        if (options.originator !== 'rate' && _.isUndefined(this.changed.rate)) {
            // num_events was changed by the user so recaculate the rate based on it
            var newRate = (attr.num_events * 60) / (attr.end_time - attr.start_time) ;
            this.set({rate: newRate}, options);
        } else if (options.originator === 'rate' && _.isUndefined(this.changed.num_events)) {
            // rate was changed by the user so recaculate the number of events based on it
            var newNumEvents = Math.round((attr.end_time - attr.start_time) * attr.rate / 60);
            this.set({num_events: newNumEvents}, options);
        }
    }
});


var MtIntervalCollection = Backbone.Collection.extend({
    model: MtIntervalModel,
    splice: MtUtil.emulateSplice,

    initialize: function(id) {
        this.id = id;
        this.on('all', this.onAll, this);
        this.on('change', this.onChange, this);
        Backbone.Mediator.subscribe('mt:controlChangedValue', this.onMtControlChangedValue, this);
    },

    makeDefault: function() {
        this.add([
            {start_time: 1, end_time: 21, num_events: 10},
            {start_time: 23, end_time: 23, num_events: 14}
        ]);
    },

    onAll: function(event, model) {
        var now = new Date();
        var message = ['MtIntervalCollection.onAll: ', now.getSeconds(), ':', now.getMilliseconds(), ' [' + event + '] ', JSON.stringify(model)].join('');
        console.log(message);
    },

    onChange: function(model, options) {
        var message = ['MtIntervalCollection.onChange: ', JSON.stringify(model), JSON.stringify(options)].join(', ');
        console.log(message);

        if (!options.originator && model.changed) {
            options.originator = _.keys(model.changed)[0]
        }

        model.recalculate(options);
    },

    onMtControlChangedValue: function(event) {
        console.log('MtIntervalCollection.onMtControlChangedValue: ' + JSON.stringify(event));
        if (event.options.id === this.id) {
            _.each(event.changes, function(change) {
                var selectedModel = this.at(change.row);
                var setParams = {};
                setParams[change.property] = change.value;
                selectedModel.set(setParams, event.options);
            }, this);
        }
    }
});

function MtInterval () {

    this.create = function(id) {
        this.id = id;
        this.containerName = 'intervaltable' + id;
        this.containerElem = document.getElementById(this.containerName);
        //addCar = document.getElementById('add_car'),
        //eventHolder = document.getElementById('example1_events'),

        this.intervals = new MtIntervalCollection(id);

        this.intervals.makeDefault();

        function makeInterval() {
            return new MtIntervalModel();
        };

        function columnFn(name) {
            return {
                data: function (interval, value) {
                    if (_.isUndefined(interval)) {
                        return name;
                    } else if (_.isUndefined(value)) {
                        return interval.get(name);
                    } else {
                        interval.set(name, value);
                    }
                },
            };
        };

        this.columnAttrs = [
            'start_time',
            'end_time',
            'num_events',
            'rate'
        ];

        this.hot = new Handsontable(this.containerElem, {
            colHeaders: ['Start', 'End', 'Number', 'Rate'],
            columns: [
                columnFn('start_time'),
                columnFn('end_time'),
                columnFn('num_events'),
                columnFn('rate')
            ],
            contextMenu: true,
            data: this.intervals,
            dataSchema: makeInterval,
            enterMoves: {col:0, row: 0},
            manualColumnResize: true,
            minSpareRows: 1,
            minSpareCols: 1,
            outsideClickDeselects : false,
            rowHeaders: true
        });

        this.hot.addHook('afterSelectionEnd', this.tableAfterSelectionEnd.bind(this));
        this.intervals.on('change', this.onValueChange, this);
    };


    this.propertyNameToColumn = function(propertyName) {
        return this.columnAttrs.indexOf(propertyName);
    };


    this.tableAfterChange = function(changes, source) {
        if (source === 'edit' || source === 'CopyPaste.paste') {
            _.each(changes, function(change) {
                var row = change[0];
                var property = change[1]();
                var value = change[3];
                Backbone.Mediator.publish('mt:valueChange', {
                    changes: [{property: property, row: row, value: value}],
                    id: this.id,
                    source: 'table'
                });
            }, this);
        } else {
            var now = new Date();
            var message = ['tableAfterChange: ', now.getSeconds(), ':', now.getMilliseconds(), ' ', source, ''];
            console.log(message.join(''));
        }
    };


    this.tableAfterSelectionEnd = function(r, c, r2, c2) {
        var selection =  {
                r: r,
                c: c,
                r2: r2,
                c2: c2
        };

        if (!_.isEqual(selection, this.lastSelection)) {

            var values = this.intervals.at(r).attributes;

            Backbone.Mediator.publish('mt:selectionChange', {
                activeRow: r,
                id: this.id,
                selection: selection,
                source: 'table',
                values: values
            });

            this.lastSelection = selection;

            var now = new Date();
            var message = ['tableAfterSelectionEnd: ', now.getSeconds(), ':', now.getMilliseconds(),
            ' (', r, ', ', c, ') to (', r2, ', ', c2, ')'];
            console.log(message.join(''));
        }
    };


    this.onValueChange = function(model, options) {
        console.log('MtInterval.onValueChange: ' + JSON.stringify(model) + JSON.stringify(options));
        if (options.id === this.id & options.source !== 'table') {
            if (options.source === 'slider' && model.changed && _.keys(model.changed).length >= 1) {
                var property = _.keys(model.changed)[0];
                var value = model.changed[property];
                var column = this.propertyNameToColumn(property);
                if (options.inProgress) {
                    // This is a slider drag so we mustn't steal the focus
                    var selection = this.hot.getSelected();
                    if (!selection || selection[0] !== options.row || selection[1] !== column) {
                        this.hot.selection.setRangeStart(new CellCoords(options.row, column));
                        this.hot.selection.setRangeEnd(new CellCoords(options.row, column));
                    }
                } else {
                    this.hot.selectCell(options.row, column, options.row, column);
                }
            }

            this.hot.render();
        }
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

