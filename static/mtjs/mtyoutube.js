
"use strict";

function MtYouTubePlayer () {

  this.createPlayer = function (divname, videoId) {
    this.player = new YT.Player(divname, {
      height: '390',
      width: '640',
      playerVars: {color: 'red', modestbranding: 1, rel: 0, start: 60},
      videoId: videoId,
      events: {
        'onReady': this.onPlayerReady,
        'onStateChange': this.onPlayerStateChange
      }
    });
  };

  this.onPlayerReady = function(event) {
    event.target.playVideo();
  };

  this.onPlayerStateChange = function(event) {

  };

  this.stopVideo = function() {
    this.player.stopVideo();
  };

  this.doPause = function() {
    this.player.pauseVideo();
  };

  this.doSeek = function(seconds) {
    this.player.seekTo(seconds);
  };

  this.setSize = function(width, height) {
    this.player.setSize(width, height);
  };

  this.doNudge = function(offset) {
    var timeNow = this.player.getCurrentTime();
    this.player.seekTo(timeNow + offset, true);
  };
};
