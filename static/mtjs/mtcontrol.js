
"use strict";

function MtControlShuttle () {

  this._valueChange = function(value) {
      console.log(value);
      this.valueElem.text(value)
  };

  this.create = function(inputName, durationSecs) {
    var momentFormat;
    if (durationSecs >= 3600) {
      momentFormat = "HH:mm:ss.S";
    } else {
      momentFormat = "mm:ss.S";
    }

    this.coarseElem = $(inputName + '_coarse');
    this.fineElem = $(inputName + '_fine');
    this.valueElem = $(inputName + '_value');

    this.fineRange = 1.0;


    var coarseOnChange = function(obj) {
        this.fineSlider.reset();
        this._valueChange(this.coarseSlider.result.from + this.fineSlider.result.from)
    };

    this.coarseElem.ionRangeSlider({
      min: 0,
      max: durationSecs,
      force_edges: true,
      from: 0,
      grid: true,
      hide_min_max: true,
      prettify: function (num) {
          var m = moment(num, "X");
          return m.format(momentFormat);
      },
      scope: this,
      step: 0.1,
      onChange: coarseOnChange
    });


    var fineOnChange = function(obj) {
        var value = obj.from;
        var truncValue = Math.trunc(value / obj.max) * obj.max;
        this._valueChange(this.coarseSlider.result.from + this.fineSlider.result.from)
    }

    var fineOnFinish = function(obj) {
        var value = obj.from;
        var truncValue = Math.trunc(value / obj.max) * obj.max;
        if (truncValue <= obj.min || truncValue >= obj.max) {
            var coarseValue = this.coarseSlider.result.from;
            this.coarseSlider.update({from: coarseValue + truncValue});
            this.fineSlider.update({from: value - truncValue});
        }
        this._valueChange(this.coarseSlider.result.from + this.fineSlider.result.from)
    }

    this.fineElem.ionRangeSlider({
      min: -this.fineRange,
      max: this.fineRange,
      from: 0,
      grid: true,
      force_edges: true,
      prettify: function (num) {
          return num.toFixed(3);
      },
      onChange: fineOnChange,
      onFinish: fineOnFinish,
      scope: this,
      step: 0.001
    });


    this.coarseSlider = this.coarseElem.data("ionRangeSlider");
    this.fineSlider = this.fineElem.data("ionRangeSlider");
  };
};
