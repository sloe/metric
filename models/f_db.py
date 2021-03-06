
import copy
import uuid

__flatnode_items = lambda: (
    Field('f_uuid', comment='Unique identifer', default=lambda: str(uuid.uuid4()), length=64, notnull=True, unique=True),
)


__treenode_items = lambda: (
    Field('f_parent_uuid', comment='Identifer of parent', length=64, notnull=False, unique=False),
    Field('f_uuid', comment='Unique identifer', default=lambda: str(uuid.uuid4()), length=64, notnull=True, unique=True)
)


db.define_table(
    't_mtuser',
    Field('f_username', comment='Username'),
    Field('f_auth_user', 'reference auth_user', comment='Mapping to web2py user', requires=IS_EMPTY_OR(IS_IN_DB(db, 'auth_user.id', '%(username)s'))),
    *__flatnode_items()
)


db.define_table(
    't_mtalbum',
    Field('f_name', comment='Name of album'),
    Field('f_owner', 'reference t_mtuser', comment='Owning user', requires=IS_IN_DB(db, 't_mtuser.id', '%(f_username)s', zero=None)),
    *__treenode_items()
)


db.define_table(
    't_mtitemtype',
    Field('f_name', comment='Name of type'),
    Field('f_key', comment='Type key, e.g. yt', unique=True)
)


db.define_table(
    't_mtitem',
    Field('f_name', comment='Name of item'),
    Field('f_album', 'reference t_mtalbum', comment='Album containing this item', requires=IS_IN_DB(db, 't_mtalbum.id', '%(f_name)s', zero=None)),
    Field('f_alien_etag', 'string', comment='Etag to manage refetch of data', default=None, length=64),
    Field('f_alien_key', 'string', comment='Identifier within the source, e.g. bwgCRdwWGzE for YouTube', length=256),
    Field('f_alien_last_fetch_timestamp', 'datetime', comment='Time that parameteres were last fetched from the alien', default=None),
    Field('f_alien_params', 'json', comment='Parameters from the alien service, e.g. YouTube', default='{}', notnull=True),
    Field('f_itemtype', 'reference t_mtitemtype', comment='Item type', requires=IS_IN_DB(db, 't_mtitemtype.id', '%(f_name)s (%(f_key)s)', zero=None)),
    *__treenode_items()
)


db.define_table(
    't_mtdataset',
    Field('f_creator', 'reference auth_user', comment='User that created this item, if any', default=lambda: auth.user and auth.user.id),
    Field('f_data', 'json', comment='Data in JSON format', default={}, notnull=True, requires=IS_JSON()),
    Field('f_item', 'reference t_mtitem', comment='Item this dataset relates to', notnull=True, requires=IS_IN_DB(db, 't_mtitem.id', '%(f_name)s (%(id)d)', zero=None)),
    Field('f_owner', 'reference auth_group', comment='Group that owns this item', default=lambda: auth.user and auth.user_group()),
    Field('f_param', 'json', comment='Parameters in JSON format', default={}, notnull=True, requires=IS_JSON()),
    Field('f_session', 'json', comment='Session parameters in JSON format', default={}, notnull=True, requires=IS_JSON()),
    Field('f_session_id', comment='Session that owns this item, if no group is present', default=lambda: response.session_id)
)


db.define_table(
    't_mtsearch',
    Field('f_query', comment='Query', label='YouTube URL'),
    Field('f_user', 'reference t_mtuser', comment='Owning user', requires=IS_IN_DB(db, 't_mtuser.id', '%(f_username)s', zero=None), writable=False)
)
