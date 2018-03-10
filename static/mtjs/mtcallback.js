
"use strict";

function MtCallback() {};

MtCallback.prototype.create = function(gdata, youTubeHandler) {
    this.gdata = gdata;
    this.youTubeHandler = youTubeHandler;
};


MtCallback.prototype.ytInfo = function(ytInfoJB64) {
    var ytInfoJson = atob(ytInfoJB64);
    var ytInfo = JSON.parse(ytInfoJson);
    this.youTubeHandler.handleYtInfo(ytInfo);
};
