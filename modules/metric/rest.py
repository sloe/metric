
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
            else:
                response_data = data_array[array_index]

        response_dict = {}
        response_dict[name] = response_data

        response.view = 'generic.json'

        return response_dict


    def __rest_post(tablename, **fields):
        if tablename != 'interval':
            raise HTTP(400)
        return db.person.t_mtitem(**fields)

    def __rest_put(*args, **vars):
        return dict()

    def __rest_delete(*args, **vars):
        return dict()

    return dict(
        GET=__rest_get,
        POST=__rest_post,
        put=__rest_put,
        delete=__rest_delete
    )