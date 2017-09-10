
"use strict";

var MtIntervalModel = Backbone.Model.extend({
    recalculate: function(options) {
        var attr = this.attributes;
        var paramProvider = this.collection.mtParamProvider;
        var speedFactor = paramProvider.getParam('speed_factor');

        if (options.originator === 'speed_factor' || options.originator === 'sync' || (options.originator !== 'rate' && _.isUndefined(this.changed.rate))) {
            // num_events or speed_factor was changed by the user so recaculate the rate based on it
            var newRate = (attr.num_events * speedFactor * 60) / (attr.end_time - attr.start_time);
            this.set({rate: newRate}, options);
        } else if (options.originator === 'rate' && _.isUndefined(this.changed.num_events)) {
            // rate was changed by the user so recaculate the number of events based on it
            var newNumEvents = Math.round((attr.end_time - attr.start_time) * attr.rate / (60 * speedFactor));
            this.set({num_events: newNumEvents}, options);
        }
        if (options.originator !== 'fetch' && options.originator !== 'sync' && (_.isUndefined(options.ongoing) || !options.ongoing)) {
            var row_index = this.collection.indexOf(this);
            if (!_.isUndefined(row_index)) {
                if (row_index < 0) {
                    mtlog.log('MtIntervalModel.recalculate: Bad row index ' + row_index);
                } else {
                    this.save(null, {url: this.collection.url + '/' + row_index});
                }
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
        this.mtId = options.mtId;
        this.mtParamProvider = options.mtParamProvider;
        this.url = '/apiv1/interval/' + this.datasetId;
        this.on('all', this.onAll, this);
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
        mtlog.debug("MtIntervalCollection.loadInitialErrorCallback: collection=%s, response=%s, options=%s", collection, JSON.stringify(response), JSON.stringify(options));
        collection.add([{notes: 'LOAD FAILED, please refresh'}]);
    },


    loadInitialSuccessCallback: function(collection, response, options) {
        mtlog.debug("MtIntervalCollection.loadInitialSuccessCallback: collection=%s, response=%s, options=%s", collection, JSON.stringify(response), JSON.stringify(options));

        if (collection.length == 0) {
            collection.add([{}]);
        }
    },


    loadInitial: function() {
        intervalCollection.fetch({
            error: this.loadInitialErrorCallback,
            originator: 'fetch',
            success: this.loadInitialSuccessCallback
        });
    },


    saveAll: function() {
        _.each(this.models, function(model, row_index) {
            model.save(null, {url: this.url + '/' + row_index});
        }, this);
    },


    onAll: function(event, model) {
        var now = new Date();
        var message = ['MtIntervalCollection.onAll: ', now.getSeconds(), ':', now.getMilliseconds(), ' [' + event + '] ', JSON.stringify(model)].join('');
        mtlog.log(message);
    },


    onAdd: function(model, collection, options) {
        var message = ['MtIntervalCollection.onAdd ', JSON.stringify(model), JSON.stringify(collection), JSON.stringify(options)].join(', ');
        mtlog.log(message);

        model.recalculate(options);
    },


    onChange: function(model, options) {
        var message = ['MtIntervalCollection.onChange: ', JSON.stringify(model), JSON.stringify(options)].join(', ');
        mtlog.log(message);

        if (!options.originator && model.changed) {
            options.originator = _.keys(model.changed)[0]
        }

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
                // Make sure that change event is triggered if the value is unchanged
                selectedModel.set(setParamsSilent, {silent: true});
                selectedModel.set(setParams, event.options);
                selectedModel.recalculate(event.options);
            }, this);
        }
    },


    onMtIntervalRowsDeleted: function(event) {
        mtlog.log('MtIntervalCollection.onMtIntervalRowsDeleted: ' + JSON.stringify(event));
        if (event.mtId === this.mtId) {
            for (var row_index = event.index; row_index < event.index + event.amount; row_index++) {
                var model_to_destroy = this.at(row_index);
                model_to_destroy.destroy({source: event.source, url: this.url + '/' + row_index});
            }
        }
    },


    onMtParamCollectionValueChange: function(model, options) {
        mtlog.log('MtIntervalCollection.onMtParamCollectionValueChange: ' + JSON.stringify(event));

        _.each(this.models, function(model) {
            model.recalculate(options);
        });
    }
});


var MtParamModel = Backbone.Model.extend({
    recalculate: function(options) {}
});


var MtParamCollection = Backbone.Collection.extend({
    model: MtParamModel,
    splice: MtUtil.emulateSplice,


    initialize: function(models, options) {
        this.datasetId = options.datasetId;
        this.mtId = options.mtId;
        this.on('change', this.onChange, this);
    },


    makeDefault: function() {
        this.add([
            {param: 'speed_factor', displayName: 'Speed factor', value: 1.0}
        ]);
    },


    mtName: function() {
        return 'MtParamCollection' + this.mtId;
    },


    onChange: function(model, options) {
        var message = ['MtParamCollection.onChange: ', JSON.stringify(model), ', ', JSON.stringify(options)].join('');
        mtlog.log(message);

        if (!options.originator) {
            options.originator = model.attributes.param;
        }

        model.recalculate(options);

        Backbone.Mediator.publish('mt:paramCollectionValueChange', model, options);
    },


    getParam: function(param, defaultValue) {
        var paramModel = this.findWhere({param: param});
        var retVal;

        if (_.isUndefined(paramModel)) {
            retVal = defaultValue;
            var message = ['MtParamCollection.getParam: Returning default value for ', param, ': ', retValue].join('');
        } else {
            retVal = paramModel.attributes.value
            var message = ['MtParamCollection.getParam: ', param, ' returning ', retVal].join('');
        }
        mtlog.debug(message);
        return retVal;
    }
});


