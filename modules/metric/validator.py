
import re

from gluon.http import HTTP

#
# /i/yt/bwgCRdwWGzE -> create new base user metric URL and redirect to it
# /i/yt/bwgCRdwWGzE/2002 -> working page for metric set 2002, version 1
#
def item_yt_args(request_args):
    if len(request_args) < 1:
        alien_key = None
    else:
        alien_key = request_args[0];
        if not re.match(r'[-_0-9A-Za-z]{6,64}$', alien_key):
            raise HTTP(400, 'Malformed YouTube video id')
    if len(request_args) < 2:
        dataset_id = None
    else:
        dataset_id = request_args[1];
        if not re.match(r'[0-9]{1,12}$', dataset_id):
            raise HTTP(400, 'Malformed dataset id')

    return alien_key, dataset_id


def row_id_array_index(request_args):
    if len(request_args) == 0:
        raise HTTP(400, 'No request arguments suppplied')


    if not re.match(r'[0-9]{1,10}$', request_args[0]):
        raise HTTP(400, 'Malformed row id')

    row_id = int(request_args[0])

    if len(request_args) <= 1:
        array_index = None
    else:
        if not re.match(r'[0-9]{1,10}$', request_args[1]):
            raise HTTP(400, 'Malformed array index')
        array_index = int(request_args[1])

    return row_id, array_index


