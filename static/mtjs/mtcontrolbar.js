
"use strict";

function MtControlBar() {};

MtControlBar.prototype.create = function(baseUrl) {
    this.baseUrl = baseUrl;
    this.discardElems = $('.control_bar_button_discard');
    this.duplicateElems = $('.control_bar_button_duplicate');
    this.editElems = $('.control_bar_button_edit');
    this.saveElems = $('.control_bar_button_save');

    this.discardElems.click(this.onClickDiscard.bind(this));
    this.duplicateElems.click(this.onClickDuplicate.bind(this));
    this.editElems.click(this.onClickEdit.bind(this));
    this.saveElems.click(this.onClickSave.bind(this));
}


MtControlBar.prototype.onClickDiscard = function(event) {
    if (confirm("This will discard all changes since the last save.  Discard?")) {
        location.href = this.baseUrl;
    }
}


MtControlBar.prototype.onClickDuplicate = function(event) {
    location.href = this.baseUrl + '/edit?duplicate=1';
}


MtControlBar.prototype.onClickEdit = function(event) {
    location.href = this.baseUrl + '/edit';
}


MtControlBar.prototype.onClickSave = function(event) {
    location.href = this.baseUrl;
}
