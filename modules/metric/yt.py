
import json

import googleapiclient.discovery

from gluon import current

import metric.validator

def ytinfo():
    db, request = current.db, current.request
    alien_key = metric.validator.ytinfo_args(request.args)

    api_key = current.myconf.get('yt.apikey')
    service = googleapiclient.discovery.build('youtube', 'v3', cache_discovery=False, developerKey=api_key)
    result = service.videos().list(id=alien_key, part='snippet').execute()

    itemtype_row = db(db.t_mtitemtype.f_key == 'yt').select().first()
    item_row = db((db.t_mtitem.f_alien_key == alien_key) & (db.t_mtitem.f_itemtype == itemtype_row.id)).select(for_update=True).first()

    result_items = result.get('items', [])
    if len(result_items) != 1:
        raise HTTP(400, 'Item not found')

    result_item = result_items[0]
    result_snippet = result_item.get('snippet', {})
    if not result_snippet:
        raise HTTP(400, 'Snippet not returned')


    result_snippet_str = json.dumps(result_snippet, indent=2)
    result_title = result_snippet.get('title', '<Unknown>')

    if item_row and result.get('etag') != item_row.f_alien_etag:
        item_row.update_record(f_alien_etag = result.get('etag'),
                               f_alien_last_fetch_timestamp=request.utcnow,
                               f_alien_params=result_snippet_str,
                               f_name=result_title)

    return result_snippet_str
