
@auth.requires_login()
def videos():
    if not auth.user:
        redirect(URL('user', 'login', vars=dict(next=URL())))

    query = ((db.t_mtdataset.f_creator == auth.user.id) &
             (db.t_mtitem.id == db.t_mtdataset.f_item) &
             (db.t_mtitemtype.id == db.t_mtitem.f_itemtype))
    fields = (db.t_mtdataset.id, db.t_mtdataset.f_creator,
              db.t_mtitem.id, db.t_mtitem.f_name, db.t_mtitem.f_alien_key, db.t_mtitem.f_alien_params,
              db.t_mtitemtype.f_key, db.t_mtitemtype.f_name)

    header_list = (
        'Dataset ID','Dataset creator',
        'Item ID', 'Item name', 'Item alien key', 'Item alien params',
        'ItemType key', 'Itemtype name'
    )

    headers = {}
    for i, field in enumerate(fields):
        headers['%s.%s' % (field.tablename, field.name)] = header_list[i]

    for field in fields:
        field.readable = field is db.t_mtdataset.id or field is db.t_mtitem.f_name or field is db.t_mtitem.f_alien_key


    def __link_url(row, suffix=[]):
        return URL('i', row.t_mtitemtype.f_key, row.t_mtitem.f_alien_key, args=[str(row.t_mtdataset.id)] + suffix)

    def __edit_link(row):
        return row.get('row.t_mtdataset') and A("Edit", _href=__link_url(row, ['edit'])) or 'No link'

    def __view_link(row):
        return row.get('row.t_mtdataset') and A("View", _href=__link_url(row)) or 'No link'

    links = [
        dict(header='View item', body=lambda row: __view_link(row)),
        dict(header='Edit item', body=lambda row: __edit_link(row))
    ]

    grid = SQLFORM.grid(
        query,
        fields=fields,
        field_id=db.t_mtdataset.id,
        headers=headers,
        links=links,
        maxtextlength=128,
        paginate=100
    )

    return dict(grid=grid)
