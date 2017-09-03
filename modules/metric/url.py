
from gluon.html import URL

def make_item_url(item_type, alien_key, dataset_id):
    return URL('i', item_type, args=[alien_key, dataset_id])
