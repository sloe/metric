# -*- coding: utf-8 -*-
### required - do no delete
def user(): return dict(form=auth())
def download(): return response.download(request,db)
def call(): return service()
### end requires
def index():
    return dict()

def error():
    return dict()






@request.restful()
def apiv1():

    def GET(tablename, id):
        if not tablename == 'item':
            raise HTTP(400)
        return dict(item = db.t_mtitem(id))

    def POST(tablename, **fields):
        if not tablename == 'item':
            raise HTTP(400)
        return db.person.t_mtitem(**fields)

    def PUT(*args, **vars):
        return dict()

    def DELETE(*args, **vars):
        return dict()

    return locals()
