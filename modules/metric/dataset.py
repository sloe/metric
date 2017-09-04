
from gluon import current

def __get_table_for_dataset_type(dataset_type):
    dataset_table = current.db.t_mtdataset
    return dataset_table


def create_dataset(dataset_type, item_id):
    db = current.db
    dataset_table = __get_table_for_dataset_type(dataset_type)
    dataset_id = dataset_table.insert(f_item=item_id)
    db.commit()
    return dataset_id


def get_dataset(dataset_type, dataset_id):
    db = current.db
    dataset_table = __get_table_for_dataset_type(dataset_type)
    dataset_row = db(dataset_table.id == dataset_id).select().first()
    return dataset_table, dataset_row





