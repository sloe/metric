


@request.restful()
def interval():
    import metric.rest
    return metric.rest.rest_handlers('interval', db.t_mtdataset, 'f_data')
