import os

bind = '0.0.0.0:%s' % os.environ.get('PORT', '5000')

workers = int(os.environ.get('WEB_WORKERS', 2))
timeout = int(os.environ.get('WEB_TIMEOUT', 10))

loglevel = os.environ.get('WEB_LOG_LEVEL', 'warning')
