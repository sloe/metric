
from gluon.html import URL

def make_item_url(item_type, alien_key, dataset_id, mode):
    args = [alien_key, dataset_id]
    if mode == 'edit':
        args.append(mode)
    return URL('i', item_type, args=args)
