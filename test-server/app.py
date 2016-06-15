
import os


if os.environ.get('NEW_RELIC_LICENSE_KEY'):
    try:
        import newrelic.agent
        newrelic.agent.initialize(os.path.abspath(os.path.join(os.path.dirname(__file__), 'newrelic.ini')))
    except ImportError:
        pass


from superdesk.factory import get_app as superdesk_app


def get_app(config=None):
    if config is None:
        config = {}
    app = superdesk_app(config, config_object='settings')
    return app
