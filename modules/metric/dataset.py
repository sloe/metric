
from gluon import current

def __get_table_for_dataset_type(dataset_type):
    dataset_table = current.db.t_mtdataset
    return dataset_table


def create_dataset(dataset_type, item_id, source_dataset_row=None):
    db = current.db
    dataset_table = __get_table_for_dataset_type(dataset_type)

    if source_dataset_row:
        dataset_id = dataset_table.insert(f_data=source_dataset_row.f_data, f_item=item_id, f_param=source_dataset_row.f_param)
    else:
        dataset_id = dataset_table.insert(f_item=item_id)

    db.commit()
    return dataset_id


def get_dataset(dataset_type, dataset_id):
    db = current.db
    dataset_table = __get_table_for_dataset_type(dataset_type)
    dataset_row = db(dataset_table.id == dataset_id).select().first()
    return dataset_table, dataset_row


def requester_has_ownership(dataset_row):
    if not dataset_row:
        return False
    elif current.auth.user and dataset_row.f_creator and dataset_row.f_creator == current.auth.user.id:
        return 'creator'
    elif current.auth.user and dataset_row.f_owner and dataset_row.f_owner in current.auth.user_groups:
        return 'owner'
    elif current.response.session_id == dataset_row.f_session_id:
        return 'session'
    else:
        return False


def requester_can_write(dataset_row):
    return bool(requester_has_ownership(dataset_row))
