

import metric.dataset
import metric.item
import metric.url
import metric.validator

def yt():
    alien_key, dataset_id = metric.validator.item_yt_args(request.args)
    if not alien_key:
        alien_key = 'bwgCRdwWGzE';
    if not dataset_id:
        item = metric.item.get_or_create_item('yt', alien_key)
        dataset_id = metric.dataset.create_new_dataset(item.id, 'yt', alien_key)
        redirect(metric.url.make_item_url('yt', alien_key, dataset_id))


    response.view = 'i/view.html'

    return dict(
      videoId='bwgCRdwWGzE'
    )



