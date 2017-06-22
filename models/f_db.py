
g_flatnode_items = (
    Field("f_uuid", comment="Unique identifer", length=64, notnull=True, unique=True),
)

g_treenode_items = (
    Field("f_parent_uuid", comment="Unique identifer or parent", length=64, notnull=False, unique=False),
    Field("f_uuid", comment="Unique identifer", length=64, notnull=True, unique=True)
)


db.define_table(
    't_mtuser',
    Field("f_username", comment="Username"),
    Field("f_auth_user", "reference auth_user", comment="Mapping to web2py user", requires=IS_EMPTY_OR(IS_IN_DB(db, db.auth_user.id, "%(name)s"))),
    *g_flatnode_items
)

db.define_table(
    't_mtalbum',
    Field("f_name", comment="Name of album"),
    Field("f_owner", "reference t_mtuser", comment="Owning user", requires=IS_IN_DB(db, db.t_mtuser.id, "%(f_username)s", zero=None)),
    *g_treenode_items
)

