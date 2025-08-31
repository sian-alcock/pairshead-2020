from django.urls import path
from . import views

urlpatterns = [
    path('', views.Home.as_view(), name='home'),
    path('assets/<str:filename>', views.Assets.as_view(), name='assets'),
]
