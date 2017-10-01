
"use strict";

function MtIntervalTable () {

    this.create = function(mtId, intervalCollection) {
        this.mtId = mtId;
        this.intervalCollection = intervalCollection;

        this.containerName = 'intervaltable' + mtId;
        this.containerElem = document.getElementById(this.containerName);

        this.columnAttrs = [
            'start_time',
            'end_time',
            'interval',
            'num_events',
            'rate',
            'link_end_to_start',
            'notes'
        ];

        this.columnHeaders = [
            'Start',
            'End',
            'Interval',
            'Number',
            'Rate',
            'Link',
            'Notes'
        ];


        function makeInterval() {
            return new MtIntervalModel();
        };

        function columnFn(name, cellType, cellFormat) {
            return {
                data: function (interval, value) {
                    if (_.isUndefined(interval)) {
                        return name;
                    } else if (_.isUndefined(value)) {
                        return interval.get(name);
                    } else {
                        interval.set(name, value, {source: 'table'});
                    }
                },
                format: cellFormat,
                type: cellType
            };
        };

        this.hot = new Handsontable(this.containerElem, {
            colHeaders: this.columnHeaders,
            columns: [
                columnFn('start_time', 'numeric', '0,0.000'),
                columnFn('end_time', 'numeric', '0,0.000'),
                columnFn('interval', 'numeric', '0,0.000'),
                columnFn('num_events', 'numeric', '0,0.0'),
                columnFn('rate', 'numeric', '0,0.000'),
                columnFn('link_end_to_start', 'checkbox', null),
                columnFn('notes', null, null)
            ],
            contextMenu: true,
            data: this.intervalCollection,
            dataSchema: makeInterval,
            enterMoves: {col:0, row: 0},
            manualColumnResize: true,
            minSpareRows: 0,
            minSpareCols: 0,
            outsideClickDeselects : false,
            rowHeaders: true
        });

        // Handsontable will try to walk the datasource to derive the number of columns,
        // which doesn't work, so override it here
        this.hot.countSourceCols = function() {
            return 6;
        }

        this.intervalCollection.on('update', this.onIntervalCollectionUpdate, this);

        this.hot.addHook('beforeRemoveRow', this.tableBeforeRemoveRow.bind(this));
        this.hot.addHook('afterSelectionEnd', this.tableAfterSelectionEnd.bind(this));

        Backbone.Mediator.subscribe('mt:intervalCollectionValueChange', this.onMtCollectionValueChange, this);
        Backbone.Mediator.subscribe('mt:controlFinish', this.onMtControlFinish, this);
    };


    this.propertyNameToColumn = function(propertyName) {
        return this.columnAttrs.indexOf(propertyName);
    };


    this.onIntervalCollectionUpdate = function(collection, options) {
        mtlog.log('MtIntervalTable.onIntervalCollectionUpdate: ' + (collection.mtName && collection.mtName()) + ', ' + JSON.stringify(options));
        var selection = this.hot.getSelected();
        if (_.isUndefined(selection)) {
            this.hot.selectCell(0, 0, 0, 0, false);
        } else {
            var activeColumn = selection[1];
            var activeColumnName = this.columnHeaders[activeColumn];
            var activeProperty = this.columnAttrs[activeColumn];
            var activeRow = selection[0];

            var activeModel = this.intervalCollection.at(activeRow);
            if (!_.isUndefined(activeModel)) {
                var values = activeModel.attributes;
                Backbone.Mediator.publish('mt:selectionChange', {
                    activeColumn: activeColumn,
                    activeColumnName: activeColumnName,
                    activeProperty: activeProperty,
                    activeRow: activeRow,
                    mtId: this.mtId,
                    selection: selection,
                    source: 'table',
                    values: values
                });
            }
        }

        this.hot.render();
    };


    this.tableBeforeRemoveRow = function(index, amount) {
        var message = ['MtIntervalTable.tableBeforeRemoveRow: index=', index, ', amount=', amount];
        mtlog.log(message.join(''));

        Backbone.Mediator.publish('mt:intervalRowsDeleted', {
            amount: amount,
            index: index,
            mtId: this.mtId,
            source: 'table'
        });

        // Return false to cancel further remove actions by the table
        return false;
    };


    this.tableAfterSelectionEnd = function(r, c, r2, c2) {
        var selection =  {
                r: r,
                c: c,
                r2: r2,
                c2: c2
        };

        if (!_.isEqual(selection, this.lastSelection)) {

            var values = this.intervalCollection.at(r).attributes;

            var activeColumn = c;
            var activeColumnName = this.columnHeaders[activeColumn];
            var activeProperty = this.columnAttrs[activeColumn];
            var activeRow = r;

            Backbone.Mediator.publish('mt:selectionChange', {
                activeColumn: activeColumn,
                activeColumnName: activeColumnName,
                activeProperty: activeProperty,
                activeRow: activeRow,
                mtId: this.mtId,
                selection: selection,
                source: 'table',
                values: values
            });

            this.lastSelection = selection;

            var now = new Date();
            var message = ['MtIntervalTable.tableAfterSelectionEnd: ', now.getSeconds(), ':', now.getMilliseconds(),
            ' (', r, ', ', c, ') to (', r2, ', ', c2, ')'];
            mtlog.log(message.join(''));
        }
    };


    this.onMtCollectionValueChange = function(model, options) {
        mtlog.log('MtIntervalTable.onMtCollectionValueChange: ' + JSON.stringify(model) + JSON.stringify(options));

        if (model.collection.mtId === this.mtId && model.changed && _.keys(model.changed).length >= 1 && options.source !== 'sync' && options.source !== 'table') {
            if (_.isUndefined(options.row)) {
                mtlog.log("Error: MtIntervalTable.onMtCollectionValueChange undefined row");
            } else {
                var property = _.keys(model.changed)[0];
                var column = this.propertyNameToColumn(property);

                // This could be a slider drag so we mustn't steal the focus
                var selection = this.hot.getSelected();
                if (!selection || selection[0] !== options.row || selection[1] !== column) {
                    this.hot.selection.setRangeStartOnly(new CellCoords(options.row, column));
                    this.hot.selection.setRangeEnd(new CellCoords(options.row, column), false);
                }
            }
        }

        if (model.collection.mtId === this.mtId) {
            this.hot.render();
        }
    };

    this.onMtControlFinish = function(event) {
        mtlog.log('MtIntervalTable.onMtControlFinish: ' + JSON.stringify(event));

        var options = event.options;
        if (options.mtId === this.mtId && event.changes && _.keys(event.changes).length >= 1 && options.source !== 'table') {
            var change = event.changes[0];
            var column = this.propertyNameToColumn(change.property);
            this.hot.selectCell(options.row, column, options.row, column, false);

            this.hot.render();
        }
    };
};




function MtParamTable () {

    this.create = function(mtId, paramCollection) {
        this.mtId = mtId;
        this.paramCollection = paramCollection;

        this.containerName = 'paramtable' + mtId;
        this.containerElem = document.getElementById(this.containerName);

        function makeParam() {
            return new MtParamModel();
        };

        function columnFn(name) {
            return {
                data: function (param, value) {
                    if (_.isUndefined(param)) {
                        return name;
                    } else if (_.isUndefined(value)) {
                        return param.get(name);
                    } else {
                        param.set(name, value, {source: 'table'});
                    }
                },
            };
        };

        this.hot = new Handsontable(this.containerElem, {
            colHeaders: ['Parameter', 'Value'],
            columns: [
                columnFn('displayName'),
                columnFn('value')
            ],
            contextMenu: true,
            data: this.paramCollection,
            dataSchema: makeParam,
            enterMoves: {col:0, row: 1},
            manualColumnResize: true,
            minSpareRows: 0,
            minSpareCols: 0,
            outsideClickDeselects : true
        });

        // Handsontable will try to walk the datasource to derive the number of columns,
        // which doesn't work, so override it here
        this.hot.countSourceCols = function() {
            return 2;
        }

        this.paramCollection.on('update', this.onParamCollectionUpdate, this);
        Backbone.Mediator.subscribe('mt:paramCollectionValueBroadcast', this.onMtParamCollectionValueBroadcast, this);
    };


    this.onParamCollectionUpdate = function(collection, options) {
        // mtlog.log('MtParamTable.onParamCollectionUpdate: ' + (collection.mtName && collection.mtName()) + ', ' + JSON.stringify(options));
        this.hot.render();
    };


    this.onMtParamCollectionValueBroadcast = function(models, options) {
        // mtlog.log('MtParamTable.onMtParamCollectionValueBroadcast: ' + JSON.stringify(models) + ', ' + JSON.stringify(options));
        this.hot.render();
    };

};