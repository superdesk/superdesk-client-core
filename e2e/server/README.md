
# Start recording based on e2e base dump

When running e2e server via docker you can run:

    $ docker-compose run superdesk run python manage.py storage:record -b e2e -n new

This will create new record called `new` in the records which can be used now via `/restore_record` api.

If running locally using `honcho` you can use similar command:

    $ honcho run python manage.py storage:record -b e2e -n new
