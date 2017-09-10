
"use strict";

function MtYouTubePlayer() {};

MtYouTubePlayer.prototype.create = function(mtId, alienKey, isMaster) {

    this.mtId = mtId;
    this.alienKey = alienKey;
    this.isMaster = isMaster;

    this.currentProperty = 'start_time';
    this.currentPropertyName = 'Start';
    this.propertyType = 'select';
    this.sourceName = 'player';

    var elemPrefix = 'player' + mtId + '_' + this.propertyType;
    this.captionElem = $('#' + elemPrefix + '_caption');

    var playerElemId = elemPrefix + '_player';
    this.playerElem = $('#' + playerElemId);

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

    Backbone.Mediator.subscribe('mt:intervalCollectionValueChange', this.onMtCollectionValueChange, this);
    Backbone.Mediator.subscribe('mt:selectionChange', this.onSelectionChange, this);
};


MtYouTubePlayer.prototype.onMtCollectionValueChange = function(model, options) {
    if (model.collection.mtId === this.mtId && model.changed) {
        if (options.source !== this.sourceName) { // Don't respond to our own events
            _.each(model.changed, function(value, property) {
                if (property === 'start_time' || property === 'end_time') {
                    this.doSeek(value);
                }
            }, this);
        }
    }
};


MtYouTubePlayer.prototype.onSelectionChange = function(event) {
    if (event.mtId === this.mtId) {
        if (event.activeProperty === 'end_time') {
            this.currentProperty = 'end_time';
            this.currentPropertyName = 'End frame';
        } else {
            this.currentProperty = 'start_time';
            this.currentPropertyName = 'Start frame';
        }
        this.updateCaption();
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
         playerStateStr = 'PAUSED';
    } else if (this.playerState == YT.PlayerState.BUFFERING) {
         playerStateStr = 'BUFFERING';
    } else if (this.playerState == YT.PlayerState.CUED) {
         playerStateStr = 'CUED';
    }

    var caption = this.currentPropertyName + ' (' + playerStateStr + ')';
    this.captionElem.text(caption);
};


MtYouTubePlayer.prototype.onPlayerReady = function(event) {
    event.target.playVideo();
};


MtYouTubePlayer.prototype.onPlayerStateChange = function(event) {
    this.playerState = event.data;
    this.updateCaption();
};


MtYouTubePlayer.prototype.stopVideo = function() {
    this.player.stopVideo();
};


MtYouTubePlayer.prototype.doPause = function() {
    this.player.pauseVideo();
};


MtYouTubePlayer.prototype.doSeek = function(seconds) {
    this.player.pauseVideo();
    this.player.seekTo(seconds);
};

MtYouTubePlayer.prototype.setSize = function(width, height) {
    this.player.setSize(width, height);
};

MtYouTubePlayer.prototype.doNudge = function(offset) {
    var timeNow = this.player.getCurrentTime();
    this.player.seekTo(timeNow + offset, true);
};

