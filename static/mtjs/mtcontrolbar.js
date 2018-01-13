
"use strict";

function MtControlBar() {};

MtControlBar.prototype.create = function(baseUrl) {
    this.baseUrl = baseUrl;
    this.discardElems = $('.control_bar_button_discard');
    this.editElems = $('.control_bar_button_edit');
    this.saveElems = $('.control_bar_button_save');

    this.discardElems.click(this.onClickDiscard.bind(this));
    this.editElems.click(this.onClickEdit.bind(this));
    this.saveElems.click(this.onClickSave.bind(this));
}


MtControlBar.prototype.onClickDiscard = function() {
    location.href = this.baseUrl;
}


MtControlBar.prototype.onClickEdit = function() {
    location.href = this.baseUrl + '/edit';
}


MtControlBar.prototype.onClickSave = function() {
    location.href = this.baseUrl;
}
