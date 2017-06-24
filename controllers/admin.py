

def itemtype():
    grid = SQLFORM.grid(db.t_mtitemtype)
    return dict(grid=grid)
