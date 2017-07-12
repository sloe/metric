
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