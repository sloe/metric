
import logging
import json
import types
import uuid

from gluon import current
from gluon.http import HTTP

import metric.diag
import metric.validator

LOGGER = logging.getLogger('metric/rest')
LOGGER.setLevel(logging.DEBUG)

def rest_get_handler(name, table, field_name, *args, **vars):
    errors = []
    auth, db, response = current.auth, current.db, current.response

    row_id, array_index = metric.validator.row_id_array_index(args)

    data_row = db(table.id == row_id).select(field_name, 'f_creator', 'f_owner', 'f_session_id').first()
    if not data_row:
        http_400 = HTTP(400, "%s row id %d not found" % (name, row_id))
        LOGGER.warn(metric.diag.exception_context(http_400))
        raise http_400

    if not metric.validator.has_data_row_access(auth, 'read', table, data_row):
        raise HTTP(403, "Read access to %s row id %d disallowed" % (name, row_id))

    data_json = getattr(data_row, field_name)
    if isinstance(data_json, types.StringTypes):
        data_json = json.loads(data_json)

    data_array = data_json.get('d', None)
    if data_array is None:
        LOGGER.warn("%s: %s", metric.diag.request_context(), 'Missing d element')
        data_array = []

    if array_index is None:
        response_data = data_array
    else:
        if array_index >= len(data_array):
            http_400 = HTTP(400, "Data index %d out of range (<%d)" % (array_index, len(data_array)))
            LOGGER.warn(metric.diag.exception_context(http_400))
            raise http_400

        response_data = data_array[array_index]

    response_dict = {}
    response_dict[name] = response_data

    response.view = 'generic.json'

    return response_dict


def rest_post_put_handler(post_or_put, name, table, field_name, *args, **vars):
    auth, db, response = current.auth, current.db, current.response
    request_body = current.request.body.read()

    row_id, array_index = metric.validator.row_id_array_index(args)

    data_row = db(table.id == row_id).select(field_name, 'f_creator', 'f_owner', 'f_session_id', for_update=True).first()
    if not data_row:
        raise HTTP(400, "%s row id %d not found" % (name, row_id))

    if not metric.validator.has_data_row_access(auth, 'write', table, data_row):
        raise HTTP(403, "Write access to %s row id %d disallowed" % (name, row_id))

    data_json = getattr(data_row, field_name)
    if isinstance(data_json, types.StringTypes):
        data_json = json.loads(data_json)

    data_array = data_json.get('d', None)
    if data_array is None:
        LOGGER.warn("%s: %s", metric.diag.request_context(), 'Missing d element - creating')
        data_array = []

    try:
        post_data = json.loads(request_body)
    except Exception, e:
        LOGGER.warn("%s: %s", metric.diag.request_context(), e)
        raise HTTP(400, "Invalid JSON")

    if array_index is None:
        data_array = post_data
    elif array_index >= len(data_array):
        # This is a new row
        for i in range(1, array_index - len(data_array)):
            # Pad the array if necessary, to reach the new index
            data_array.append({})
        data_array.append(post_data)
    else:
        # This updates a current row in the JSON array
        data_array[array_index] = post_data

    data_json['d'] = data_array
    new_data_json_str = json.dumps(data_json, indent=2)

    result = db(table.id == row_id).validate_and_update(**{field_name: new_data_json_str})
    if result.errors:
        raise HTTP(500, "Update failed: %s" % result.errors)

    try:
        db.commit()
    except Exception, e:
        LOGGER.warn("%s: %s", metric.diag.request_context(), e)
        raise HTTP(500, "Failed to save")

    response.view = 'generic.json'

    reply_content = {}

    if isinstance(post_data, types.DictType) and 'id' not in post_data:
        reply_content['id'] = str(uuid.uuid4())

    return reply_content


def rest_delete_handler(name, table, field_name, *args, **vars):
    db, response = current.db, current.response

    row_id, array_index = metric.validator.row_id_array_index(args)

    data_row = db(table.id == row_id).select(field_name, for_update=True).first()
    if not data_row:
        raise HTTP(400, "%s row id %d not found" % (name, row_id))

    data_json = getattr(data_row, field_name)
    if isinstance(data_json, types.StringTypes):
        data_json = json.loads(data_json)

    data_array = data_json.get('d', None)
    if data_array is None:
        raise HTTP(500, "Invalid database content")

    if array_index is None:
        raise HTTP(400, "Array index must be specified")

    if array_index >= len(data_array):
        raise HTTP(400, "Array index %d outside of array %d" % (array_index, len(data_array)))
    else:
        del data_array[array_index]

    new_data_json_str = json.dumps(data_json, indent=2)

    result = db(table.id == row_id).validate_and_update(**{field_name: new_data_json_str})
    if result.errors:
        raise HTTP(500, "Update failed: %s" % result.errors)

    try:
        db.commit()
    except Exception, e:
        LOGGER.warn("%s: %s", metric.diag.request_context(), e)
        raise HTTP(500, "Failed to save")

    response.view = 'generic.json'

    reply_content = {}

    return reply_content


def rest_handlers(name, table, field_name):

    def __rest_get(*args, **vars):
        return rest_get_handler(name, table, field_name, *args, **vars)


    def __rest_post(*args, **vars):
        return rest_post_put_handler('post', name, table, field_name, *args, **vars)


    def __rest_put(*args, **vars):
        return rest_post_put_handler('put', name, table, field_name, *args, **vars)


    def __rest_delete(*args, **vars):
        return rest_delete_handler(name, table, field_name, *args, **vars)

    return dict(
        GET=__rest_get,
        POST=__rest_post,
        PUT=__rest_put,
        DELETE=__rest_delete
    )