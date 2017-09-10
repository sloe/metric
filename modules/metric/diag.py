

from gluon import current


def request_context():
    return current.request.url


def exception_context(exc):
    message = "%s: %s" % (request_context(), exc)
    return message
