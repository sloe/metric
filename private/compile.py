
from pprint import pprint

import gluon.admin
result = gluon.admin.app_compile(request.application, request)

if result:
    pprint(result)
