
function MtUtil() {};

MtUtil.emulateSplice = function(index, howMany) {
    var args = _.toArray(arguments).slice(2).concat({at: index});
    var removed = this.models.slice(index, index + howMany);
    this.remove(removed).add.apply(this, args);
    return removed;
};


