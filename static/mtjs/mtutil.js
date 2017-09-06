
function MtUtil() {};

MtUtil.emulateSplice = function(index, amount /* ... */ ) {
    var args = _.toArray(arguments).slice(2).concat({at: index});
    var removed = this.models.slice(index, index + amount);
    this.remove(removed);
    this.add.apply(this, args);
    return removed;
};


