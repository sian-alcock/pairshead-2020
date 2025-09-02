from django.urls import path
from django.views.generic import TemplateView

# urlpatterns = [
#     path('', TemplateView.as_view(template_name='index.html'), name='home'),
# ]
from .views import health_check
urlpatterns = [
    path('', health_check),
]