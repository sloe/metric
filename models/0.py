from gluon.storage import Storage
settings = Storage()

settings.migrate = True
settings.title = 'Oarstack metrics'
settings.subtitle = 'Rowing analysis'
settings.author = 'Andy Southgate'
settings.author_email = 'andy@oarstack.com'
settings.keywords = ''
settings.description = 'A rowing site'
settings.layout_theme = 'Default'
settings.database_uri = 'postgres://postgres:postgres@localhost:5432/metrics'
settings.security_key = '84a77958-bc96-4b7e-a51f-ec45672a4a46'
settings.email_server = 'localhost'
settings.email_sender = 'you@example.com'
settings.email_login = ''
settings.login_method = 'local'
settings.login_config = ''
settings.plugins = []


