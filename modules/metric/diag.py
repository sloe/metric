

from gluon import current


def request_context():
    req = current.request
    if req.env and req.env.request_method:
        return "%s %s" % (req.env.request_method, req.url)
    else:
        return req.url


def exception_context(exc):
    message = "%s: %s" % (request_context(), exc)
    return message
