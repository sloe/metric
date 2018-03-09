

@auth.jwt_handler.allows_jwt(required=False)
@request.restful()
def interval():
    import metric.rest
    return metric.rest.rest_handlers('interval', db.t_mtdataset, 'f_data')


@auth.jwt_handler.allows_jwt(required=False)
@request.restful()
def param():
    import metric.rest
    return metric.rest.rest_handlers('param', db.t_mtdataset, 'f_param')


def ytinfo():
    import metric.yt
    return PRE(metric.yt.ytinfo())
