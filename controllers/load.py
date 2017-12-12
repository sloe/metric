
def login():
    return dict(
        form=auth(),
        token_url=URL('default', 'user', 'login', extension='', scheme=True)
    )