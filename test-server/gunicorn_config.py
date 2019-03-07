
import os

bind = '0.0.0.0:%s' % os.environ.get('PORT', '5000')

reload = False

workers = 1
timeout = 10

loglevel = 'error'
