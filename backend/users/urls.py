from django.urls import path
from .views import MeView, UsersListView

urlpatterns = [
    path('me/', MeView.as_view(), name='user-me'),
    path('', UsersListView.as_view(), name='users-list'),
]
