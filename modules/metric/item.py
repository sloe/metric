
from gluon import current

import metric.itemtype

def __item_query(itemtype_id, alien_key):
    db = current.db
    item_query = ((db.t_mtitem.f_itemtype == itemtype_id) & (db.t_mtitem.f_alien_key == alien_key))
    return item_query


def create_item(itemtype, alien_key):
    db = current.db
    itemtype_id = metric.itemtype.get_itemtype_id(itemtype)
    item_query = __item_query(itemtype_id, alien_key)
    item_id = db.t_mtitem.update_or_insert(item_query, f_itemtype=itemtype_id, f_alien_key=alien_key)
    return db.t_mtitem[item_id]


def get_item(itemtype, alien_key):
    db = current.db
    itemtype_id = metric.itemtype.get_itemtype_id(itemtype)
    item_query = __item_query(itemtype_id, alien_key)
    item_row = db(item_query).select().first()
    return item_row


def get_or_create_item(itemtype, alien_key):
    item_row = get_item(itemtype, alien_key)
    if not item_row:
        item_row = create_item(itemtype, alien_key)
    return item_row



