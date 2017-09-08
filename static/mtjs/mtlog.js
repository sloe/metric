
"use strict";

function MtLog() {};

MtLog.prototype.log = function() {
    console.log.apply(console, arguments);
};

MtLog.prototype.debug = function() {
    console.debug.apply(console, arguments);
};

var mtlog = new MtLog();
