
@auth.requires_membership('admin')
def itemtype():
    grid = SQLFORM.grid(db.t_mtitemtype)
    return dict(grid=grid)
