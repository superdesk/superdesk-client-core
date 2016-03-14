
import os

bind = '0.0.0.0:%s' % os.environ.get('PORT', '5000')

reload = False

workers = 3
timeout = 8
max_requests = 500

loglevel = 'error'
