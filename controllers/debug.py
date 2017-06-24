

def album():
    grid = SQLFORM.grid(db.t_mtalbum)
    return dict(grid=grid)


def item():
    grid = SQLFORM.grid(db.t_mtitem)
    return dict(grid=grid)


def user():
    grid = SQLFORM.grid(db.t_mtuser)
    return dict(grid=grid)
