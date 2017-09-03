
import copy
import uuid

__flatnode_items = lambda: (
    Field("f_uuid", comment="Unique identifer", default=lambda: str(uuid.uuid4()), length=64, notnull=True, unique=True),
)

__treenode_items = lambda: (
    Field("f_parent_uuid", comment="Identifer of parent", length=64, notnull=False, unique=False),
    Field("f_uuid", comment="Unique identifer", default=lambda: str(uuid.uuid4()), length=64, notnull=True, unique=True)
)


db.define_table(
    't_mtuser',
    Field("f_username", comment="Username"),
    Field("f_auth_user", "reference auth_user", comment="Mapping to web2py user", requires=IS_EMPTY_OR(IS_IN_DB(db, 'auth_user.id', "%(username)s"))),
    *__flatnode_items()
)

db.define_table(
    't_mtalbum',
    Field("f_name", comment="Name of album"),
    Field("f_owner", "reference t_mtuser", comment="Owning user", requires=IS_IN_DB(db, 't_mtuser.id', "%(f_username)s", zero=None)),
    *__treenode_items()
)

db.define_table(
    't_mtitemtype',
    Field("f_name", comment="Name of type"),
    Field("f_key", comment="Type key, e.g. yt", unique=True)
)

db.define_table(
    't_mtitem',
    Field("f_name", comment="Name of item"),
    Field("f_album", "reference t_mtalbum", comment="Album containing this item", requires=IS_IN_DB(db, 't_mtalbum.id', "%(f_name)s", zero=None)),
    Field("f_alien_key", comment="Identifier within the source, e.g. bwgCRdwWGzE for YouTube"),
    Field("f_itemtype", "reference t_mtitemtype", comment="Item type", requires=IS_IN_DB(db, 't_mtitemtype.id', "%(f_name)s (%(f_key)s)", zero=None)),
    *__treenode_items()
)


db.define_table(
    't_mtdataset',
    Field("f_item", "reference t_mtitem", comment="Item", requires=IS_IN_DB(db, 't_mtitem.id', "%(f_name)s (%(f_id)d)", zero=None)),
)