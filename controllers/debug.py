

def album():
    grid = SQLFORM.grid(db.t_mtalbum)
    return dict(grid=grid)


def dataset():
    grid = SQLFORM.grid(db.t_mtdataset)
    return dict(grid=grid)


def item():
    grid = SQLFORM.grid(db.t_mtitem)
    return dict(grid=grid)


def itemtype():
    grid = SQLFORM.grid(db.t_mtitemtype)
    return dict(grid=grid)


def search():
    grid = SQLFORM.grid(db.t_mtsearch)
    return dict(grid=grid)


def user():
    grid = SQLFORM.grid(db.t_mtuser)
    return dict(grid=grid)
