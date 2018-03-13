
"use strict";

function MtLog() {};


MtLog.prototype.debug = function() {
    console.debug.apply(console, arguments);
};

MtLog.prototype.error = function() {
    console.error.apply(console, arguments);
};

MtLog.prototype.log = function() {
    console.log.apply(console, arguments);
};

MtLog.prototype.warn = function() {
    console.warn.apply(console, arguments);
};


var mtlog = new MtLog();
