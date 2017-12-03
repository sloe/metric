response.title = settings.title
response.subtitle = settings.subtitle
response.meta.author = '%(author)s <%(author_email)s>' % settings
response.meta.keywords = settings.keywords
response.meta.description = settings.description
response.menu = [
    (T('Index'),URL('default','index')==URL(),URL('default','index'),[]),
    (T("Admin"), False, None, [
        (T("Item Types"), False, URL("admin", "itemtype"), [])
    ]),
    (T("Item"), False, None, [
        (T("View"), False, URL("i", "yt"), [])
    ]),
    (T("Debug"), False, None, [
        (T("Albums"), False, URL("debug", "album"), []),
        (T("Datasets"), False, URL("debug", "dataset"), []),
        (T("Items"), False, URL("debug", "item"), []),
        (T("Item types"), False, URL("debug", "itemtype"), []),
        (T("Searches"), False, URL("debug", "search"), []),
        (T("Users"), False, URL("debug", "user"), [])
    ]),
    (T('Privacy Policy'),URL('default','privacy')==URL(),URL('default','privacy'),[])
]
