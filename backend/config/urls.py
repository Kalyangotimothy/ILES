"""URL configuration for ILES project."""

from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    # JWT Authentication
    path('api/v1/auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/v1/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # API endpoints
    path('api/v1/users/', include('users.urls')),
    path('api/v1/placements/', include('placements.urls')),
    path('api/v1/logs/', include('logbook.urls')),
    path('api/v1/reviews/', include('reviews.urls')),
    path('api/v1/evaluations/', include('evaluations.urls')),
    path('api/v1/dashboard/', include('dashboard.urls')),
]
