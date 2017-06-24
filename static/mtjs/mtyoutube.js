
"use strict";

function MtYouTubePlayer () {

  this.createPlayer = function (divname, videoId) {
    this.player = new YT.Player(divname, {
      height: '390',
      width: '640',
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
};
