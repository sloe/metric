# -*- coding: utf-8 -*-
### required - do no delete
def user(): return dict(form=auth())
def download(): return response.download(request,db)
def call(): return service()
### end requires

import re

def index():
    form = SQLFORM(
        db.t_mtsearch,
        comments=False,
        fields=['f_query'],
        formstyle='divs',
        submit_button=T('Find')
    )

    for element in form.elements('input', _type='text'):
        element.add_class('form-control')

    for element in form.elements("input", _type="submit"):
        element.add_class('btn btn-primary')


    if form.process().accepted:
        match = re.match(r'https?://youtu.be/([-_0-9A-Za-z]{6,64})', form.vars.f_query)
        if not match:
            match = re.match(r'https?://www.youtube.com/watch\?v=([-_0-9A-Za-z]{6,64})', form.vars.f_query)
        if match:
            yt_key = match.group(1)
            destination = URL('i', 'yt', args=[yt_key])
            redirect(destination)
        else:
            response.flash = 'Cannot decode URL'
    elif form.errors:
        response.flash = 'Form has errors'

    return dict(
        form=form
    )



def error():
    return dict()
