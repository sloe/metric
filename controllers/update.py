
def pushevent():
    request_body = request.body.read()
    LOGGER.info("pushevent: %s", request_body)