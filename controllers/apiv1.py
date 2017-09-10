


@request.restful()
def interval():
    import metric.rest
    return metric.rest.rest_handlers('interval', db.t_mtdataset, 'f_data')


@request.restful()
def param():
    import metric.rest
    return metric.rest.rest_handlers('param', db.t_mtdataset, 'f_param')
