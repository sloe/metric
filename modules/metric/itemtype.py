
import types

from gluon import cache
from gluon import current


def __create_default_itemtypes():
    db = current.db
    default_itemtypes = dict(
        yt=dict(f_name='YouTube')
    )
    for key, params in default_itemtypes.iteritems():
        db.t_mtitemtype.update_or_insert(
            db.t_mtitemtype.f_key == key,
            f_key=key,
            **params)
    db.commit()


def get_itemtype_id(itemtype):
    db = current.db
    if isinstance(itemtype, types.IntType):
        itemtype_query = (db.t_mtitemtype.id == itemtype)
    elif isinstance(itemtype, types.StringTypes):
        itemtype_query = (db.t_mtitemtype.f_key == itemtype)
    else:
        raise Exception("Bad itemtype: %s" % itemtype)

    itemtype_row = db(itemtype_query).select(cache=(current.cache.ram, 3600), cacheable=True).first()
    if not itemtype_row:
        itemtype_row = db(itemtype_query).select().first()
        if not itemtype_row:
            __create_default_itemtypes()
            itemtype_row = db(itemtype_query).select().first()
            if not itemtype_row:
                raise Exception("Bad itemtype: %s" % itemtype)
    return itemtype_row.id
