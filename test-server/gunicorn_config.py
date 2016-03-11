
import os

bind = '0.0.0.0:%s' % os.environ.get('PORT', '5000')

accesslog = '-'
access_log_format = '%(m)s %(U)s status=%(s)s time=%(T)ss size=%(B)sb'

reload = False

workers = 3
timeout = 8
