
import os

DEBUG = False
SUPERDESK_TESTING = True

SERVER_NAME = 'localhost:5000'
URL_PROTOCOL = 'http'
URL_PREFIX = 'api'

CLIENT_URL = 'http://localhost:9000'

MONGO_DBNAME = 'superdesk_e2e'
MONGO_URI = os.environ.get('MONGO_URI', 'mongodb://localhost/%s' % MONGO_DBNAME)
ARCHIVED_DBNAME = 'superdesk_e2e_archived'
ARCHIVED_URI = os.environ.get('ARCHIVED_URI', 'mongodb://localhost/%s' % ARCHIVED_DBNAME)
LEGAL_ARCHIVE_DBNAME = 'superdesk_e2e_legal_archive'
LEGAL_ARCHIVE_URI = os.environ.get('LEGAL_ARCHIVE_URI', 'mongodb://localhost/%s' % LEGAL_ARCHIVE_DBNAME)
CONTENTAPI_MONGO_DBNAME = 'contentapi_e2e'
CONTENTAPI_MONGO_URI = os.environ.get('CONTENTAPI_MONGO_URI', 'mongodb://localhost/%s' % CONTENTAPI_MONGO_DBNAME)
PUBLICAPI_MONGO_DBNAME = 'publicapi_e2e'
PUBLICAPI_MONGO_URI = os.environ.get('PUBLICAPI_MONGO_URI', 'mongodb://localhost/%s' % PUBLICAPI_MONGO_DBNAME)

ELASTICSEARCH_INDEX = MONGO_DBNAME
CONTENTAPI_ELASTICSEARCH_INDEX = CONTENTAPI_MONGO_DBNAME

LEGAL_ARCHIVE = True

DEFAULT_TIMEZONE = "Europe/London"

VALIDATOR_MEDIA_METADATA = {
    "slugline": {
        "required": False,
    },
    "headline": {
        "required": False,
    },
    "description_text": {
        "required": True,
    },
    "byline": {
        "required": False,
    },
    "copyrightnotice": {
        "required": False,
    },
}
