

import metric.dataset
import metric.item
import metric.url
import metric.validator

def yt():
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

    response.view = 'i/view.html'

    return dict(
        base_url=base_url,
        dataset_id=dataset_id,
        item_row=item_row,
        mode=mode,
        requester_can_write=requester_can_write
    )
