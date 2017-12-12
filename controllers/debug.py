
@auth.requires_membership('admin')
def album():
    grid = SQLFORM.grid(db.t_mtalbum)
    return dict(grid=grid)


@auth.requires_membership('admin')
def dataset():
    grid = SQLFORM.grid(db.t_mtdataset)
    return dict(grid=grid)


@auth.requires_membership('admin')
def item():
    grid = SQLFORM.grid(db.t_mtitem)
    return dict(grid=grid)


@auth.requires_membership('admin')
def itemtype():
    grid = SQLFORM.grid(db.t_mtitemtype)
    return dict(grid=grid)


@auth.requires_membership('admin')
def search():
    grid = SQLFORM.grid(db.t_mtsearch)
    return dict(grid=grid)


@auth.requires_membership('admin')
def user():
    grid = SQLFORM.grid(db.t_mtuser)
    return dict(grid=grid)
