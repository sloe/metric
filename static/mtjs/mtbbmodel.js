
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
        if (options.originator !== 'sync' && (_.isUndefined(options.ongoing) || !options.ongoing)) {
            var row_index = this.collection.indexOf(this);
            if (!_.isUndefined(row_index)) {
                this.save(null, {url: this.collection.url + '/' + row_index});
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
    url: '/apiv1/interval/' + 7,

    initialize: function(models, options) {
        this.mtId = options.mtId;
        this.mtParamProvider = options.mtParamProvider;
        this.on('all', this.onAll, this);
        this.on('add', this.onAdd, this);
        this.on('change', this.onChange, this);
        this.on('sync', this.onSync, this);
        Backbone.Mediator.subscribe('mt:controlChangedValue', this.onMtControlChangedValueOrFinish, this);
        Backbone.Mediator.subscribe('mt:controlFinish', this.onMtControlChangedValueOrFinish, this);
        Backbone.Mediator.subscribe('mt:intervalRowsDeleted', this.onMtIntervalRowsDeleted, this);
        Backbone.Mediator.subscribe('mt:paramCollectionValueChange', this.onMtParamCollectionValueChange, this);
    },


    makeDefault: function() {
        this.add([
            {start_time: 1, end_time: 21, num_events: 10},
            {start_time: 23, end_time: 43, num_events: 14}
        ]);
    },


    mtName: function() {
        return 'MtIntervalCollection' + this.mtId;
    },


    saveAll: function() {
        _.each(this.models, function(model, row_index) {
            model.save(null, {url: this.url + '/' + row_index});
        }, this);
    },


    onAll: function(event, model) {
        var now = new Date();
        var message = ['MtIntervalCollection.onAll: ', now.getSeconds(), ':', now.getMilliseconds(), ' [' + event + '] ', JSON.stringify(model)].join('');
        console.log(message);
    },


    onAdd: function(model, collection, options) {
        var message = ['MtIntervalCollection.onAdd ', JSON.stringify(model), JSON.stringify(collection), JSON.stringify(options)].join(', ');
        console.log(message);

        var row_index = collection.indexOf(model);
        model.save(null, {url: this.url + '/' + row_index});
    },


    onChange: function(model, options) {
        var message = ['MtIntervalCollection.onChange: ', JSON.stringify(model), JSON.stringify(options)].join(', ');
        console.log(message);

        if (!options.originator && model.changed) {
            options.originator = _.keys(model.changed)[0]
        }

        model.recalculate(options);

        Backbone.Mediator.publish('mt:intervalCollectionValueChange', model, options);
    },


    onSync: function(collection_or_model, response, options) {
        var message = ['MtIntervalCollection.onSync: ', JSON.stringify(collection_or_model), JSON.stringify(response), JSON.stringify(options)].join(', ');
        console.log(message);

        if (!options.originator) {
            options.originator = 'sync'
        }

        _.each(this.models, function(model) {
            model.recalculate(options);
        });
    },


    onMtControlChangedValueOrFinish: function(event) {
        console.log('MtIntervalCollection.onMtControlChangedValueOrFinish: ' + JSON.stringify(event));
        if (event.options.mtId === this.mtId) {
            _.each(event.changes, function(change) {
                var selectedModel = this.at(change.row);
                var setParams = {};
                setParams[change.property] = change.value;
                selectedModel.set(setParams, event.options);
                selectedModel.recalculate(event.options);
            }, this);
        }
    },


    onMtIntervalRowsDeleted: function(event) {
        console.log('MtIntervalCollection.onMtIntervalRowsDeleted: ' + JSON.stringify(event));
        if (event.mtId === this.mtId) {
            var remove_range = [];
            for (var row_index = event.index; row_index < event.index + event.amount; row_index++) {
                var model_to_destroy = this.at(row_index);
                model_to_destroy.destroy({url: this.url + '/' + row_index});
                remove_range.push(model_to_destroy);
            }

            this.remove(remove_range, {source: event.source});
        }
    },


    onMtParamCollectionValueChange: function(model, options) {
        console.log('MtIntervalCollection.onMtParamCollectionValueChange: ' + JSON.stringify(event));

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
        console.log(message);

        if (!options.originator) {
            options.originator = model.attributes.param;
        }

        model.recalculate(options);

        Backbone.Mediator.publish('mt:paramCollectionValueChange', model, options);
    },


    getParam: function(param, defaultValue) {
        var paramModel = this.findWhere({param: 'speed_factor'});
        var retVal;

        if (_.isUndefined(paramModel)) {
            retVal = defaultValue;
            var message = ['MtParamCollection.getParam: Returning default value for ', param, ': ', retValue].join('');
        } else {
            retVal = paramModel.attributes.value
            var message = ['MtParamCollection.getParam: ', param, ' returning ', retVal].join('');
        }
        console.log(message);
        return retVal;
    }
});


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

