
from superdesk.factory import get_app as superdesk_app

def get_app(config=None):
    if config is None:
        config = {}
    app = superdesk_app(config, config_object='settings')
    return app
