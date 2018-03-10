

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


@auth.jwt_handler.allows_jwt(required=False)
@request.restful()
def session():
    import metric.rest
    return metric.rest.rest_handlers('session', db.t_mtdataset, 'f_session')
