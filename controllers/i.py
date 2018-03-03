
import base64
import json

import metric.dataset
import metric.item
import metric.url
import metric.validator

import gluon.serializers as serializers

@auth.requires(True, requires_login=False)
def yt():
    session.test = 'hello'
    alien_key, dataset_id, mode = metric.validator.item_yt_args(request.args)
    if not alien_key:
        alien_key = 'bwgCRdwWGzE';
    if not dataset_id:
        item = metric.item.get_or_create_item('yt', alien_key)
        dataset_id = metric.dataset.create_dataset('yt', item.id)
        redirect(metric.url.make_item_url('yt', alien_key, dataset_id, 'edit'))

    item_row = metric.item.get_item('yt', alien_key)

    dataset_table, dataset_row = metric.dataset.get_dataset('yt', dataset_id)

    if mode == 'edit' and 'duplicate' in request.vars:
        new_dataset_id = metric.dataset.create_dataset('yt', item_row.id, dataset_row)
        redirect(metric.url.make_item_url('yt', alien_key, new_dataset_id, 'edit'))

    requester_can_write = metric.dataset.requester_can_write(dataset_row)
    if mode == 'edit' and not requester_can_write:
        session.flash = 'You do not have permission to edit this item'
        redirect(metric.url.make_item_url('yt', alien_key, dataset_id, 'view'))

    base_url = URL(args=request.args[:2])

    if session.auth:
        fake_user_row = Storage(as_dict=lambda: dict(id=session.auth['user']['id'], session_id=response.session_id))
        auth_session = dict(
            hmac_key=session.auth['hmac_key'],
            user_groups=session.auth['user_groups'],
            user=fake_user_row
        )
    else:
        fake_user_row = Storage(as_dict=lambda: dict(id=0, session_id=response.session_id))
        auth_session = dict(
            hmac_key='',
            user_groups=[],
            user=fake_user_row
        )

    payload = auth.jwt_handler.serialize_auth_session(auth_session)
    auth.jwt_handler.alter_payload(payload)
    jwtToken = auth.jwt_handler.generate_token(payload)

    response.view = 'i/view.html'

    gdata_served = Storage()

    gdata_served.baseUrl = base_url
    gdata_served.jwtToken = jwtToken;
    gdata_served.readOnly = (mode != 'edit')
    gdata_served_json = json.dumps(gdata_served, separators=(',', ':'))
    gdata_served_jb64 = base64.b64encode(gdata_served_json)

    return dict(
        dataset_id=dataset_id,
        gdata_served_jb64=gdata_served_jb64,
        item_row=item_row,
        mode=mode,
        requester_can_write=requester_can_write
    )
