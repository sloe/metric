

"use strict";

function MtGlobal() {};

MtGlobal.prototype.create = function(served_jb64) {
    var served_json = atob(served_jb64);
    this.served = JSON.parse(served_json);
}

