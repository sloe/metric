#
# View URL structure:
#
# /item/view -> redirect to page to choose video
# /item/view/yt/bwgCRdwWGzE -> create new base user metric URL and redirect to it
# /item/view/yt/bwgCRdwWGzE/1001 -> list metric sets for user
# /item/view/yt/bwgCRdwWGzE/1001/2002 -> working page for metric set 2002 for user 1001
#

def view():
    return dict(
      videoId='bwgCRdwWGzE'
    )



