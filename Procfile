release: python manage.py collectstatic --noinput --clear && python manage.py migrate
web: gunicorn project.wsgi --preload --log-file -