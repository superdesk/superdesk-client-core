import os

reload = bool(os.environ.get('WEB_RELOAD'))

bind = '0.0.0.0:%s' % os.environ.get('PORT', '5000')

workers = int(os.environ.get('WEB_WORKERS', 2))
timeout = int(os.environ.get('WEB_TIMEOUT', 10))

loglevel = os.environ.get('WEB_LOG_LEVEL', 'warning')

if bool(os.environ.get('SUPERDESK_DEBUG')):
    accesslog = '-'
    access_log_format = '%(m)s %(U)s status=%(s)s time=%(T)ss size=%(B)sb'
