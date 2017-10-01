
"use strict";

function MtYouTubePlayer() {};

MtYouTubePlayer.prototype.create = function(mtId, alienKey, isMaster) {

    this.mtId = mtId;
    this.alienKey = alienKey;
    this.isMaster = isMaster;

    this.activeRow = null;
    this.coldTickDelay = 1000;
    this.currentTime = 0;
    this.currentProperty = 'start_time';
    this.currentPropertyName = 'Start';
    this.hotTickDelay = 100;
    this.inhibitNextChangeEvent = false;
    this.initState = 0;
    this.isReady = false;
    this.lastSeek = null;
    this.mouseOverPlayer = null;
    this.loadedFraction = 0;
    this.propertyType = 'select';
    this.sourceName = 'player';

    var elemPrefix = 'player' + mtId + '_' + this.propertyType;
    this.captionElem = $('#' + elemPrefix + '_caption');

    var playerElemId = elemPrefix + '_player';
    var playerParentElemId = elemPrefix + '_playerparent';
    this.playerElem = $('#' + playerElemId);
    this.playerElemParent = $('#' + playerParentElemId);

    this.playerElemParent.on("mouseover", null, {actualThis: this}, this.onMouseOver);
    this.playerElemParent.on("mouseout", null, {actualThis: this}, this.onMouseOut);

    this.player = new YT.Player(playerElemId, {
        height: '390',
        width: '640',
        playerVars: {color: 'red', modestbranding: 1, rel: 0, start: 0},
        videoId: alienKey,
        events: {
            'onReady': this.onPlayerReady.bind(this),
            'onStateChange': this.onPlayerStateChange.bind(this)
        }
    });

    Backbone.Mediator.subscribe('mt:intervalCollectionValueChange', this.onMtIntervalCollectionValueChange, this);
    Backbone.Mediator.subscribe('mt:selectionChange', this.onSelectionChange, this);
};


MtYouTubePlayer.prototype.onMouseOver = function(event) {
    event.data.actualThis.mouseOverPlayer = true;
}


MtYouTubePlayer.prototype.onMouseOut = function(event) {
    event.data.actualThis.mouseOverPlayer = false;
}


MtYouTubePlayer.prototype.timerTick = function() {
    if (this.initState == 0) {
        return false;
    }
    var newCurrentTime, newLoadedFraction;
    var currentTimeHasChanged = false;
    var hasChanged = false;
    var loadedFractionHasChanged = false;

    newCurrentTime = this.player.getCurrentTime();
    newLoadedFraction = this.player.getVideoLoadedFraction();
    currentTimeHasChanged = (this.currentTime !== newCurrentTime);
    loadedFractionHasChanged = (this.loadedFraction !== newLoadedFraction);
    hasChanged = (currentTimeHasChanged || loadedFractionHasChanged);

    var oldCurrentTime = this.currentTime;
    this.currentTime = newCurrentTime;
    this.loadedFraction = newLoadedFraction;

    if (hasChanged) {
        this.updateCaption();
    }
    if (currentTimeHasChanged) {
        if (this.inhibitNextChangeEvent) {
            mtlog.log('Inhibiting change from ' + oldCurrentTime + ' to ' + newCurrentTime);
            this.inhibitNextChangeEvent = false;
        } else if (!this.mouseOverPlayer && this.playerState !== YT.PlayerState.PLAYING) {
            mtlog.log('Non-mouseover change from ' + oldCurrentTime + ' to ' + newCurrentTime);
        } else {
            mtlog.log('Sending change from ' + oldCurrentTime + ' to ' + newCurrentTime);
            if (this.playerState === YT.PlayerState.PLAYING) {
                this.publishControlChangedValue();
            } else {
                this.publishControlFinish();
            }
        }
    }
    if (hasChanged) {
        mtlog.log('Tick, hasChanged=' + hasChanged);
    }
    return hasChanged;
};


MtYouTubePlayer.prototype.timerTickWrapper = function() {
    var hasChanged;
    var tickDelay = 2000; // Use if there's an exception
    try {
        hasChanged = this.timerTick();
        if (hasChanged) {
            tickDelay = this.hotTickDelay;
        } else {
            tickDelay = this.coldTickDelay;
        }
    }
    finally {
        setTimeout(this.timerTickWrapper.bind(this), tickDelay);
    }
};


MtYouTubePlayer.prototype.onMtIntervalCollectionValueChange = function(model, options) {
    if (model.collection.mtId === this.mtId && options.row === this.activeRow && model.changed) {
        if (options.source !== this.sourceName) { // Don't respond to our own events
            _.each(model.changed, function(value, property) {
                if (property === this.currentProperty) {
                    this.doSilentSeek(value);
                }
            }, this);
        }
    }
};


MtYouTubePlayer.prototype.onSelectionChange = function(event) {
    var newValue;
    if (event.mtId === this.mtId) {
        this.activeRow = event.activeRow;
        if (event.activeProperty === 'end_time') {
            this.currentProperty = 'end_time';
            this.currentPropertyName = 'End frame';
        } else {
            this.currentProperty = 'start_time';
            this.currentPropertyName = 'Start frame';
        }
        this.updateCaption();
        newValue = event.values[this.currentProperty];
        this.doSilentSeek(newValue);
    }
};


MtYouTubePlayer.prototype.updateCaption = function() {

    var playerStateStr = 'UNKNOWN';

    if (this.playerState < 0) {
         playerStateStr = 'UNSTARTED';
    } else if (this.playerState == YT.PlayerState.ENDED) {
         playerStateStr = 'ENDED';
    } else if (this.playerState == YT.PlayerState.PLAYING) {
         playerStateStr = 'PLAYING';
    } else if (this.playerState == YT.PlayerState.PAUSED) {
         playerStateStr = 'HALTED';
    } else if (this.playerState == YT.PlayerState.BUFFERING) {
         playerStateStr = 'BUFFERING';
    } else if (this.playerState == YT.PlayerState.CUED) {
         playerStateStr = 'CUED';
    }

    var caption = this.currentPropertyName + ' (' + playerStateStr + ') ' + this.currentTime.toFixed(3) + 's';
    if (this.loadedFraction < 1.0) {
        caption += ' (loaded ' + (this.loadedFraction * 100).toFixed(0) + '%)';
    } else {
        caption += ' (loaded)';
    }
    this.captionElem.text(caption);
};


MtYouTubePlayer.prototype._paramChangeEventData = function(params, options) {
    return {
        changes: params,
        options: _.extend({
            mtId: this.mtId,
            originator: 'video_load',
            source: this.sourceName
        }, options)
    };
}


MtYouTubePlayer.prototype.publishParamChange = function(params, options) {
    var eventId = 'mt:paramChangedValue';
    Backbone.Mediator.publish(eventId, this._paramChangeEventData(params, options));
};


MtYouTubePlayer.prototype.readMetadataFromPlayer = function(event) {
    var videoDuration = this.player.getDuration();

    var params = [{
        property: 'video_duration',
        value: videoDuration
    }];

    var options = {};

    this.publishParamChange(params, options);
};


MtYouTubePlayer.prototype.onPlayerReady = function(event) {
    this.isReady = true;
    this.player.pauseVideo();
    this.player.seekTo(0);
    setTimeout(this.timerTickWrapper.bind(this), this.hotTickDelay);
};


MtYouTubePlayer.prototype.onPlayerStateChange = function(event) {
    this.playerState = event.data;
    this.updateCaption();
    if (this.initState === 0 && event.data === YT.PlayerState.PLAYING) {
        this.initState = 1;
        this.doPause();
        if (this.isMaster) {
            this.readMetadataFromPlayer();
        }
        if (!_.isNull(this.lastSeek)) {
            this.doSilentSeek(this.lastSeek);
        }
    }
};


MtYouTubePlayer.prototype.stopVideo = function() {
    this.player.stopVideo();
};


MtYouTubePlayer.prototype.doPause = function() {
    this.player.pauseVideo();
};


MtYouTubePlayer.prototype.doSeek = function(seconds) {
    this.lastSeek = seconds;
    if (this.isReady) {
        this.player.pauseVideo();
        this.player.seekTo(seconds);
    }
};


MtYouTubePlayer.prototype.doSilentSeek = function(seconds) {
    this.lastSeek = seconds;
    if (this.isReady) {
        this.player.pauseVideo();
        this.inhibitNextChangeEvent = true;
        this.player.seekTo(seconds);
    }
};


MtYouTubePlayer.prototype.setSize = function(width, height) {
    this.player.setSize(width, height);
};

MtYouTubePlayer.prototype.doNudge = function(offset) {
    var timeNow = this.player.getCurrentTime();
    this.player.seekTo(timeNow + offset, true);
};


MtYouTubePlayer.prototype._changeEventData = function(ongoing) {
    var value = this.currentTime;
    return {
        changes: [{
            property: this.currentProperty,
            row: this.activeRow,
            value: value
        }],
        options: {
            mtId: this.mtId,
            ongoing: ongoing,
            originator: this.currentProperty,
            row: this.activeRow,
            source: this.sourceName
        }
    };
}


MtYouTubePlayer.prototype.publishControlChangedValue = function() {
    if (!_.isNull(this.activeRow)) {
        var eventId = 'mt:controlChangedValue';
        Backbone.Mediator.publish(eventId, this._changeEventData(true));
    }
};


MtYouTubePlayer.prototype.publishControlFinish = function() {
    if (!_.isNull(this.activeRow)) {
        var eventId = 'mt:controlFinish';
        Backbone.Mediator.publish(eventId, this._changeEventData(false));
    }
};
