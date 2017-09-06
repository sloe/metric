
import json
import types

from gluon import current
from gluon.http import HTTP

import metric.validator

def rest_handlers(name, table, field_name):

    def __rest_get(*args, **vars):
        db, response = current.db, current.response

        row_id, array_index = metric.validator.row_id_array_index(args)

        data_row = db(table.id == row_id).select(field_name).first()
        if not data_row:
            raise HTTP(400, "%s row id %d not found" % (name, row_id))

        data_json = getattr(data_row, field_name)
        data_array = data_json.get('d', None)
        if data_array is None:
            raise HTTP(500, "Invalid database content")

        if array_index is None:
            response_data = data_array
        else:
            if array_index >= len(data_array):
                raise HTTP(400, "Data index %d out of range (<%d)" % (array_index, len(data_array)))

            response_data = data_array[array_index]

        response_dict = {}
        response_dict[name] = response_data

        response.view = 'generic.json'

        return response_dict


    def __rest_post(*args, **vars):
        db, response = current.db, current.response
        request_body = current.request.body.read()

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

        post_data = json.loads(request_body)

        if array_index >= len(data_array):
            # This is a new row
            for i in range(1, array_index - len(data_array)):
                # Pad the array if necessary, to reach the new index
                data_array.append({})
            data_array.append(post_data)
        else:
            # This updates a current row in the JSON array
            data_array[array_index] = post_data

        new_data_json_str = json.dumps(data_json)

        result = db(table.id == row_id).validate_and_update(**{field_name: new_data_json_str})
        if result.errors:
            raise HTTP(500, "Update failed: %s" % result.errors)
        db.commit()

        response.view = 'generic.json'

        return dict(id=row_id)


    def __rest_put(*args, **vars):
        return dict()

    def __rest_delete(*args, **vars):
        return dict()

    return dict(
        GET=__rest_get,
        POST=__rest_post,
        PUT=__rest_put,
        DELETE=__rest_delete
    )