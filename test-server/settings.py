
SUPERDESK_TESTING = True

SERVER_NAME = 'localhost:5000'
URL_PROTOCOL = 'http'
URL_PREFIX = 'api'

CLIENT_URL = 'http://localhost:9090'
REDIS_URL = 'redis://localhost:6379/2'

MONGO_DBNAME = 'superdesk_e2e'
MONGO_URI = 'mongodb://localhost/%s' % MONGO_DBNAME

ARCHIVED_DBNAME = 'superdesk_e2e_archived'
ARCHIVED_URI = 'mongodb://localhost/%s' % ARCHIVED_DBNAME

LEGAL_ARCHIVE_DBNAME = 'superdesk_e2e_legal_archive'
LEGAL_ARCHIVE_URI = 'mongodb://localhost/%s' % LEGAL_ARCHIVE_DBNAME

CONTENTAPI_MONGO_DBNAME = 'contentapi_e2e'
CONTENTAPI_MONGO_URI = 'mongodb://localhost/%s' % CONTENTAPI_MONGO_DBNAME

ELASTICSEARCH_INDEX = MONGO_DBNAME
ELASTICSEARCH_BACKUPS_PATH = '/tmp/es-backups/'

CONTENTAPI_ELASTICSEARCH_INDEX = CONTENTAPI_MONGO_DBNAME

LEGAL_ARCHIVE = True
