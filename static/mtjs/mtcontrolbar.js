
"use strict";

function MtControlBar() {};

MtControlBar.prototype.create = function(gdata, mtId, stateManager) {
    this.gdata = gdata;
    this.mtId = mtId;
    this.stateManager = stateManager;

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
        location.href = this.gdata.served.baseUrl;
    }
}


MtControlBar.prototype.onClickDuplicate = function(event) {
    location.href = this.gdata.served.baseUrl + '/edit?duplicate=1';
}


MtControlBar.prototype.onClickEdit = function(event) {
    location.href = this.gdata.served.baseUrl + '/edit';
}


MtControlBar.prototype.onClickSave = function(event) {
    try {
        stateManager.saveAll({origin: 'controlbar'});
        location.href = this.gdata.served.baseUrl;
    }
    catch (err) {
        alert(err.toString());
    }
}
