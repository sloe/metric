
if request.env.HTTP_HOST.split(':')[0] in ('127.0.0.1', 'localhost'):
    # Reload changed modules in development deployments
    from gluon.custom_import import track_changes
    track_changes(True)
