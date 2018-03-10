
import base64
import json

def login():
    return dict(
        form=auth(),
        token_url=URL('default', 'user', 'login', extension='', scheme=True)
    )


def ytinfo():
    import metric.yt

    try:
        yt_info = metric.yt.ytinfo()
        yt_info_json = json.dumps(yt_info, separators=(',', ':'))
        yt_info_jb64 = base64.b64encode(yt_info_json)
    except Exception as e:
        message = "Failed to retrieve information from YouTube: %s" % e
        response.view = "load/retryonerror.load"
        raise HTTP(500, message)

    response.js = 'mtCallback.ytInfo("%s");' % yt_info_jb64

    response.view = "load/emptyresponse.load"

    return dict(service_name='ytinfo')
