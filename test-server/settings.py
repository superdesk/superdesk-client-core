
import os

DEBUG = True
SUPERDESK_TESTING = True

SERVER_NAME = 'localhost:5000'
URL_PROTOCOL = 'http'
URL_PREFIX = 'api'

CLIENT_URL = 'http://localhost:9000'

MONGO_DBNAME = 'superdesk_e2e'
MONGO_URI = os.environ.get('MONGO_URI', 'mongodb://localhost/{}'.format(MONGO_DBNAME))

LEGAL_ARCHIVE_DBNAME = 'superdesk_e2e_legal_archive'
LEGAL_ARCHIVE_URI = os.environ.get('LEGAL_ARCHIVE_URI', 'mongodb://localhost/{}'.format(LEGAL_ARCHIVE_DBNAME))

CONTENTAPI_MONGO_DBNAME = 'contentapi_e2e'
CONTENTAPI_MONGO_URI = os.environ.get('CONTENTAPI_MONGO_URI', 'mongodb://localhost/{}'.format(CONTENTAPI_MONGO_DBNAME))

ARCHIVED_DBNAME = 'superdesk_e2e_archived'
ARCHIVED_URI = os.environ.get('ARCHIVED_URI', 'mongodb://localhost/{}'.format(ARCHIVED_DBNAME))

ELASTICSEARCH_INDEX = MONGO_DBNAME
CONTENTAPI_ELASTICSEARCH_INDEX = CONTENTAPI_MONGO_DBNAME

LEGAL_ARCHIVE = True
CELERY_TASK_ALWAYS_EAGER = True

SENTRY_DSN = os.environ.get('SENTRY_DSN')
