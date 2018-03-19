
"use strict";

function MtAlert() {};

MtAlert.prototype.create = function(gdata) {
    this.gdata = gdata;

    this.alerts = {};
    this.bannerElems = $('.mtalert_banner');
};


MtAlert.prototype.render = function() {
    var content = [];

    _.each(this.alerts, function(alert, key) {
        content.push('<div class="alert alert-' + alert.level + ' alert-dismissible show" role="alert">' +
            alert.message +
            '<button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
            '<span aria-hidden="true">&times;</span>' +
            '</button></div>'
        );
    }, this);

    this.bannerElems.html(content.join('\n'));
};


MtAlert.prototype.setAlert = function(key, level, message, duration) {
    this.alerts[key] = {level: level, message: message, duration: duration};
    this.render();
};
