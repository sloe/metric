


@request.restful()
def interval():
    def GET(*args, **vars):

        response.view = 'generic.json'

        fake_response = [
            dict(
                start_time=0,
                end_time=120,
                num_events=70
            )
        ]
        return dict(interval=fake_response)


    def POST(tablename, **fields):
        if tablename != 'interval':
            raise HTTP(400)
        return db.person.t_mtitem(**fields)

    def PUT(*args, **vars):
        return dict()

    def DELETE(*args, **vars):
        return dict()

    return locals()
