
"use strict";

var MtIntervalModel = Backbone.Model.extend({
    recalculate: function(options) {
        if (options.noRecalculate) {
            return;
        }
        var attr = this.attributes;
        var paramProvider = this.collection.mtParamProvider;
        var speedFactor = paramProvider.getParam('speed_factor');

        // If recalculation changes values we set them in the normal Backbone way, but we don't that set operation
        // to cause another recalculation.  We do want changes to cascade so that e.g. a change we make to end time
        // results in a change in rate, but we achienve that only by continuing through the function
        var optionsNoRecalculate = jQuery.extend({}, options);
        optionsNoRecalculate.noRecalculate = true;

        // Set default values for invalid elements
        if (!_.isFinite(parseFloat(attr.start_time))) {
            this.set({start_time: 0}, optionsNoRecalculate);
        }
        if (!_.isFinite(parseFloat(attr.end_time))) {
            this.set({end_time: 0}, optionsNoRecalculate);
        }
        if (!_.isFinite(parseFloat(attr.num_events))) {
            this.set({num_events: 1}, optionsNoRecalculate);
        }

        if (!options.ongoing && // Don't force end time >= start time during ongoing slider drags
            parseFloat(attr.end_time) < parseFloat(attr.start_time)) { // but if end time < start time
            // Don't allow end time to be before start time
            if (_.isUndefined(this.changed.end_time)) { // If end time isn't what's being dragged
                // Move end time to start time
                this.set({end_time: attr.start_time}, optionsNoRecalculate);
            } else {
                // Move start time to end time
                this.set({start_time: attr.end_time}, optionsNoRecalculate);
            }
        }

        if (options.originator === 'rate' && _.isUndefined(this.changed.num_events)) {
            // Old method: rate was changed by the user so recalculate the number of events based on it
            // Old method: var newNumEvents = Math.max(1, Math.round((attr.end_time - attr.start_time) * attr.rate / (60 * speedFactor)));
            var newEndTime = attr.start_time + attr.num_events * (60.0 / attr.rate);
            this.set({end_time: newEndTime}, optionsNoRecalculate);
        }

        if (!(options.ongoing && options.originator === 'rate')) { // Unless user is dragging the rate
            // Recalculate rate
            var newRate = (attr.num_events * speedFactor * 60) / (attr.end_time - attr.start_time);
            this.set({rate: newRate}, optionsNoRecalculate);
        }

        if (options.originator === 'fetch' || // Recalculate interval after fetch to ensure self-consistency, or
            (options.originator !== 'interval' && _.isUndefined(this.changed.interval)) // recalculate unless interval has been changed by the user
            ) {
            var newInterval = parseFloat(attr.end_time) - parseFloat(attr.start_time);
            this.set({interval: newInterval}, optionsNoRecalculate);
        } else if (options.originator === 'interval' && // User has changed the interval directly, and
            _.isUndefined(this.changed.start_time) && _.isUndefined(this.changed.end_time) // start and end times have not been changed
            ) {
            // Set the end time to the start time plus the new interval
            var newEndTime = parseFloat(attr.start_time) + parseFloat(attr.interval);
            this.set({end_time: newEndTime}, optionsNoRecalculate);
        }

        if (attr.break_before_next !== true && attr.break_before_next !== false) {
            // If break before next is not what we expect, assume no break
            attr.break_before_next = false;
        }

        var rowIndex = this.collection.indexOf(this);

        if (!attr.break_before_next && // No break before next, and
            rowIndex + 1 < this.collection.length && // there is a line after this one, and
            (options.originator === 'break_before_next' || // user has clicked the break before next checkbox, or
            !_.isUndefined(this.changed.end_time)) // end time HAS been changed by the user
            ) {
            // Set next model start time to this model end time
            var nextModel = this.collection.at(rowIndex + 1);
            var nextOptions = jQuery.extend({}, optionsNoRecalculate); // Duplicate so we don't modify the original
            nextOptions.row = rowIndex + 1;
            nextModel.set({start_time: attr.end_time}, nextOptions);
        }

        if (!_.isUndefined(this.changed.start_time) && // Start time has been changed by the user, and
            rowIndex > 0 // this is not the first row
            ) {
            var previousModel = this.collection.at(rowIndex - 1);
            if (!previousModel.attributes.break_before_next // Previous model has break before next unset
                ) {
                // Set next model end time to this model start time
                var previousOptions = jQuery.extend({}, optionsNoRecalculate); // Duplicate so we don't modify the original
                previousOptions.row = rowIndex - 1;
                previousModel.set({end_time: attr.start_time}, previousOptions);
            }
        }
    }
});


var MtIntervalCollection = Backbone.Collection.extend({
    model: MtIntervalModel,
    parse: function(response) {
        return response.interval;
    },
    splice: MtUtil.emulateSplice,

    initialize: function(models, options) {
        this.datasetId = options.datasetId;
        this.gdata = options.gdata;
        this.mtId = options.mtId;
        this.mtParamProvider = options.mtParamProvider;
        this.url = '/apiv1/interval/' + this.datasetId;
        // this.on('all', this.onAll, this);
        this.on('add', this.onAdd, this);
        this.on('change', this.onChange, this);
        Backbone.Mediator.subscribe('mt:controlChangedValue', this.onMtControlChangedValueOrFinish, this);
        Backbone.Mediator.subscribe('mt:controlFinish', this.onMtControlChangedValueOrFinish, this);
        Backbone.Mediator.subscribe('mt:intervalRowsDeleted', this.onMtIntervalRowsDeleted, this);
        Backbone.Mediator.subscribe('mt:paramCollectionValueChange', this.onMtParamCollectionValueChange, this);
    },


    mtName: function() {
        return 'MtIntervalCollection' + this.mtId;
    },


    loadInitialErrorCallback: function(collection, response, options) {
        mtlog.warn("MtIntervalCollection.loadInitialErrorCallback: collection=%s, response=%s, options=%s", collection, JSON.stringify(response), JSON.stringify(options));
    },


    loadInitialSuccessCallback: function(collection, response, options) {
        mtlog.debug("MtIntervalCollection.loadInitialSuccessCallback: collection=%s, response=%s, options=%s", collection, JSON.stringify(response), JSON.stringify(options));

        if (collection.length == 0) {
            collection.add([{}]);
        }
    },


    loadInitial: function() {
        return this.fetch({
            error: this.loadInitialErrorCallback,
            originator: 'fetch',
            source: 'model',
            success: this.loadInitialSuccessCallback
        });
    },


    recalculateAll: function(options) {
        _.each(this.models, function(model) {
            model.recalculate(options);
        });
    },


    saveAll: function() {
        Backbone.sync("create", this, {url: this.url + '?_token=' + this.gdata.served.jwtToken});
    },


    onAll: function(event, model) {
        var now = new Date();
        var message = ['MtIntervalCollection.onAll: ', now.getSeconds(), ':', now.getMilliseconds(), ' [' + event + '] ', JSON.stringify(model)].join('');
        mtlog.log(message);
    },


    onAdd: function(model, collection, options) {
        var message = ['MtIntervalCollection.onAdd ', JSON.stringify(model), JSON.stringify(collection), JSON.stringify(options)].join(', ');
        mtlog.log(message);

        if (_.isEmpty(model.attributes)) {
            // Create default values from neighbouring rows
            var rowIndex = options.at;

            if (rowIndex === 0) {
                if (collection.length > 1) {
                    var sourceModel = collection.at(1);
                    var sourceAttr = sourceModel.attributes;

                    model.set({
                        start_time: parseFloat(sourceAttr.start_time) - parseFloat(sourceAttr.interval),
                        end_time: sourceAttr.start_time,
                        interval: sourceAttr.interval,
                        num_events: sourceAttr.num_events,
                        break_before_next: sourceAttr.break_before_next
                    }, {originator: 'add_row'});
                }
            } else if (!_.isUndefined(rowIndex)) {
                var sourceModel = collection.at(rowIndex - 1);
                var sourceAttr = sourceModel.attributes;

                model.set({
                    start_time: sourceAttr.end_time,
                    end_time: parseFloat(sourceAttr.end_time) + parseFloat(sourceAttr.interval),
                    interval: sourceAttr.interval,
                    num_events: sourceAttr.num_events,
                    break_before_next: sourceAttr.break_before_next
                }, {originator: 'add_row'});
            }
        }

        model.recalculate(options);
    },


    onChange: function(model, options) {
        var message = ['MtIntervalCollection.onChange: ', JSON.stringify(model), JSON.stringify(options)].join(', ');
        var rowIndex;

        mtlog.log(message);

        if (!options.originator && model.changed) {
            options.originator = _.keys(model.changed)[0]
        }

        options.row = this.indexOf(model);

        model.recalculate(options);

        Backbone.Mediator.publish('mt:intervalCollectionValueChange', model, options);
    },


    onMtControlChangedValueOrFinish: function(event) {
        mtlog.log('MtIntervalCollection.onMtControlChangedValueOrFinish: ' + JSON.stringify(event));
        if (event.options.mtId === this.mtId) {
            _.each(event.changes, function(change) {
                var selectedModel = this.at(change.row);
                var setParamsSilent = {};
                var setParams = {};
                setParamsSilent[change.property] = change.value + 1;
                setParams[change.property] = change.value;
                // Make sure that change event is triggered if the value is unchanged (FIXME)
                selectedModel.set(setParamsSilent, {silent: true});
                selectedModel.set(setParams, event.options);
                selectedModel.recalculate(event.options);
            }, this);
        }
    },


    onMtIntervalRowsDeleted: function(event) {
        mtlog.log('MtIntervalCollection.onMtIntervalRowsDeleted: ' + JSON.stringify(event));
        if (event.mtId === this.mtId) {
            for (var rowIndex = event.index; rowIndex < event.index + event.amount; rowIndex++) {
                var model_to_destroy = this.at(rowIndex);
                model_to_destroy.destroy({source: event.source, url: this.url + '/' + rowIndex});
            }
        }
    },


    onMtParamCollectionValueChange: function(model, options) {
        mtlog.log('MtIntervalCollection.onMtParamCollectionValueChange: ' + JSON.stringify(event));

        this.recalculateAll(options);
    }
});


var MtParamModel = Backbone.Model.extend({
    recalculate: function(options) {
        if (options.originator !== 'fetch' && (_.isUndefined(options.ongoing) || !options.ongoing)) {
            var rowIndex = this.collection.indexOf(this);
            if (!_.isUndefined(rowIndex)) {
                if (rowIndex < 0) {
                    mtlog.log('MtIntervalModel.recalculate: Bad row index ' + rowIndex);
                } else {
                    // this.save(null, {url: this.collection.url + '/' + rowIndex});
                }
            }
        }
    }
});


var MtParamCollection = Backbone.Collection.extend({
    comparator: 'order',
    model: MtParamModel,
    parse: function(response) {
        return response.param;
    },
    splice: MtUtil.emulateSplice,


    initialize: function(models, options) {
        this.datasetId = options.datasetId;
        this.gdata = options.gdata;
        this.mtId = options.mtId;
        this.url = '/apiv1/param/' + this.datasetId;

        this.propertyDefs = {
            speed_factor: { displayName: 'Speed factor', order: 100, value: 1.0},
            video_duration: { displayName: 'Video duration', order: 200, value: null},
            privacy_status: { displayName: 'Privacy status', dropdownOptions: ['public', 'unlisted', 'private'], order: 300, value: null},
            upload_status: { displayName: 'Upload status', order: 400, value: null},
            license: { displayName: 'Licence', order: 500, value: null},
            embeddable: { displayName: 'Embeddable', order: 600, value: null},
            view_count: { displayName: 'View count', order: 700, value: null},
            video_title: { displayName: 'Video title', order: 800, value: "Not determined"},
            video_description: { displayName: 'Video description', order: 900, value: "Not determined"},
            min_rate_per_min: { displayName: 'Minimum rate supported', order: 1000, value: 10.0},
            max_rate_per_min: { displayName: 'Maximum rate supported', order: 1100, value: 60.0}
        };

        this.on('change', this.onChange, this);
        this.on('update', this.onUpdate, this);

        Backbone.Mediator.subscribe('mt:paramChangedValue', this.onMtParamChangedValue, this);
    },


    addParam: function(propertyName, value) {
        var propertyModel = this.findWhere({param: propertyName});
        if (_.isUndefined(propertyModel)) {
            var propertyDef = this.propertyDefs[propertyName]
            var addParams = _.extend(propertyDef, {
                param: propertyName,
                value: value
            });
            this.add(addParams);
        } else {
            mtlog.error('MtParamCollection.addParam double add for' + propertyName);
        }
    },


    makeDefault: function() {
        _.each(this.propertyDefs, function(v, k) {
            this.addParam(k, v.value);
        }, this);
    },


    mtName: function() {
        return 'MtParamCollection' + this.mtId;
    },


    loadInitialErrorCallback: function(collection, response, options) {
        mtlog.warn("MtParamCollection.loadInitialErrorCallback: collection=%s, response=%s, options=%s", collection, JSON.stringify(response), JSON.stringify(options));
    },


    loadInitialSuccessCallback: function(collection, response, options) {
        mtlog.debug("MtParamCollection.loadInitialSuccessCallback: collection=%s, response=%s, options=%s", collection, JSON.stringify(response), JSON.stringify(options));

        if (collection.length == 0) {
            collection.makeDefault();
        }
    },


    loadInitial: function() {
        return this.fetch({
            error: this.loadInitialErrorCallback,
            originator: 'fetch',
            success: this.loadInitialSuccessCallback
        });
    },


    onChange: function(model, options) {
        // var message = ['MtParamCollection.onChange: ', JSON.stringify(model), ', ', JSON.stringify(options)].join('');
        // mtlog.log(message);

        if (!options.originator) {
            options.originator = model.attributes.param;
        }

        model.recalculate(options);

        Backbone.Mediator.publish('mt:paramCollectionValueBroadcast', [model], options);
    },


    onUpdate: function(collection, options) {
        // var message = ['MtParamCollection.onChange: ', JSON.stringify(collection), ', ', JSON.stringify(options)].join('');
        // mtlog.log(message);

        if (!options.originator) {
            options.originator = 'update';
        }

        _.each(collection.models, function(model) {
            model.recalculate(options);
        });

        Backbone.Mediator.publish('mt:paramCollectionValueBroadcast', collection.models, options);
    },


    onMtParamChangedValue: function(event) {
        mtlog.log('MtParamCollection.onMtParamChangedValue: %s', JSON.stringify(event));

        if (_.isUndefined(event.options.mtId) || event.options.mtId === this.mtId) {
            _.each(event.changes, function(change) {
                var paramModel = this.findWhere({param: change.property});
                if (_.isUndefined(paramModel)) {
                    this.addParam(change.property, change.value);
                } else {
                    paramModel.set({value: change.value}, event.options);
                }
            }, this);
        }
    },


    getParam: function(param, defaultValue) {
        var paramModel = this.findWhere({param: param});
        var retVal;

        if (_.isUndefined(paramModel)) {
            retVal = defaultValue;
            var message = ['MtParamCollection.getParam: Returning default value for ', param, ': ', retVal].join('');
        } else {
            retVal = paramModel.attributes.value
            var message = ['MtParamCollection.getParam: ', param, ' returning ', retVal].join('');
        }
        mtlog.debug(message);
        return retVal;
    },


    saveAll: function() {
        Backbone.sync("create", this, {url: this.url + '?_token=' + this.gdata.served.jwtToken});
    },
});


function MtStateManager() {};

MtStateManager.prototype.create = function(gdata, mtId) {
    this.gdata = gdata;
    this.mtId = mtId;
    this.saveables = [];
};


MtStateManager.prototype.addSaveable = function(saveable) {
    this.saveables.push(saveable);
};


MtStateManager.prototype.saveAll = function(options) {
    _.each(this.saveables, function(saveable) {
        saveable.saveAll(options);
    }, this);
};
