release: python manage.py migrate
web: gunicorn project.wsgi --worker-class=sync --workers=2 --timeout=120 --keep-alive=2 --max-requests=1000 --max-requests-jitter=50 --log-file=-