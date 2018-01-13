

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

    base_url = URL(args=request.args[:2])

    response.view = 'i/view.html'

    return dict(
        base_url=base_url,
        dataset_id=dataset_id,
        item_row=item_row,
        mode=mode
    )
