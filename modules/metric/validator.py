
import re

from gluon import current
from gluon.http import HTTP

def has_data_row_access(auth, access_type, table, data_row):
    if access_type == 'read':
        return True
    elif access_type == 'write':
        if data_row.f_creator and auth.user and data_row.f_creator == auth.user.id:
            # User is logged in and the creator of this object
            return True
        elif data_row.f_owner and auth.user_groups and data_row.f_owner in auth.user_groups.keys():
            # User is logged in and is in the owning group of this object
            return True
        elif not data_row.f_creator and not data_row.f_owner and auth.user.session_id and data_row.f_session_id and auth.user.session_id == data_row.f_session_id:
            return True
        else:
            return False


#
# /i/yt/bwgCRdwWGzE -> create new base user metric URL and redirect to it
# /i/yt/bwgCRdwWGzE/2002 -> view page for metric set 2002, version 1
# /i/yt/bwgCRdwWGzE/2002/edit -> editing page for metric set 2002, version 1
#
def item_yt_args(request_args):
    if len(request_args) < 1:
        alien_key = None
    else:
        alien_key = request_args[0];
        if not re.match(r'[-_0-9A-Za-z]{6,64}$', alien_key):
            raise HTTP(400, 'Malformed YouTube video id in URL')

    if len(request_args) < 2:
        dataset_id = None
    else:
        if not re.match(r'[0-9]{1,12}$', request_args[1]):
            raise HTTP(400, 'Malformed dataset id in URL')
        dataset_id = int(request_args[1])

    if len(request_args) < 3:
        mode = 'view'
    else:
        if request_args[2] != 'edit':
            raise HTTP(400, 'Malformed URL (expecting edit)')
        mode = request_args[2]

    return alien_key, dataset_id, mode


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
        if (array_index > 10000):
            raise HTTP(400, "Array index %d out of range" % array_index)

    return row_id, array_index


def ytinfo_args(request_args):
    if len(request_args) < 1:
        raise HTTP(400, 'YouTube video id')
    else:
        alien_key = request_args[0];
        if not re.match(r'[-_0-9A-Za-z]{6,64}$', alien_key):
            raise HTTP(400, 'Malformed YouTube video id in URL')

    return alien_key
