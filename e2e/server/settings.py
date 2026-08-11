
import os

DEBUG = False
SUPERDESK_TESTING = True

SERVER_NAME = os.environ.get('SERVER_NAME', 'localhost:5000')
URL_PROTOCOL = 'http'
URL_PREFIX = 'api'

CLIENT_URL = os.environ.get('CLIENT_URL', 'http://localhost:9000')

MONGO_DBNAME = os.environ.get('MONGO_DBNAME', 'superdesk_e2e')
MONGO_URI = os.environ.get('MONGO_URI', 'mongodb://localhost/%s' % MONGO_DBNAME)
ARCHIVED_DBNAME = '%s_archived' % MONGO_DBNAME
ARCHIVED_URI = os.environ.get('ARCHIVED_URI', 'mongodb://localhost/%s' % ARCHIVED_DBNAME)
LEGAL_ARCHIVE_DBNAME = '%s_legal_archive' % MONGO_DBNAME
LEGAL_ARCHIVE_URI = os.environ.get('LEGAL_ARCHIVE_URI', 'mongodb://localhost/%s' % LEGAL_ARCHIVE_DBNAME)
CONTENTAPI_MONGO_DBNAME = os.environ.get('CONTENTAPI_MONGO_DBNAME', 'contentapi_e2e')
CONTENTAPI_MONGO_URI = os.environ.get('CONTENTAPI_MONGO_URI', 'mongodb://localhost/%s' % CONTENTAPI_MONGO_DBNAME)
PUBLICAPI_MONGO_DBNAME = os.environ.get('PUBLICAPI_MONGO_DBNAME', 'publicapi_e2e')
PUBLICAPI_MONGO_URI = os.environ.get('PUBLICAPI_MONGO_URI', 'mongodb://localhost/%s' % PUBLICAPI_MONGO_DBNAME)

# Overridable independently of the mongo names: e2e slots (e2e-up.sh --slot)
# share one elasticsearch and isolate by index prefix, while their mongo
# databases keep the default names on a per-slot mongod. Mongo names cannot
# be repurposed for isolation because the snapshot restore looks dump
# folders up by database name.
ELASTICSEARCH_INDEX = os.environ.get('ELASTICSEARCH_INDEX', MONGO_DBNAME)
CONTENTAPI_ELASTICSEARCH_INDEX = os.environ.get('CONTENTAPI_ELASTICSEARCH_INDEX', CONTENTAPI_MONGO_DBNAME)

LEGAL_ARCHIVE = True

# Rendition hrefs are absolute and are stored in the database, so the committed snapshots carry
# whichever prefix the recording backend used. superdesk-core derives MEDIA_PREFIX from
# SUPERDESK_URL, which is unset in the container, so that baked-in prefix is always
# http://localhost:5000/api/upload-raw. CI serves the backend on 5000 and matches it; a local
# stack (5002) or a slot (501N) does not, and the client loads renditions straight from the href,
# so every thumbnail would point at a port nothing listens on. MEDIA_PREFIXES_TO_FIX makes the
# backend rewrite the stored prefix to the one this instance actually answers on. Snapshots must
# keep being recorded with the canonical prefix below, or they will not be rewritten.
# Lowercase so it stays a module local: only uppercase names in here become app config.
canonical_media_prefix = 'http://localhost:5000/api/upload-raw'
MEDIA_PREFIX = os.environ.get('MEDIA_PREFIX', '%s://%s/%s/upload-raw' % (URL_PROTOCOL, SERVER_NAME, URL_PREFIX))
MEDIA_PREFIXES_TO_FIX = None if MEDIA_PREFIX == canonical_media_prefix else [canonical_media_prefix]

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
