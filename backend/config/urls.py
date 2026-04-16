"""URL configuration for ILES project."""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView
from users.views import CustomTokenObtainPairView, RegisterView

# Define Auth Patterns separately for cleanliness
auth_patterns = [
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', RegisterView.as_view(), name='register'),
]

# Define API Version 1 patterns
v1_patterns = [
    path('auth/', include(auth_patterns)),
    path('users/', include('users.urls')),
    path('placements/', include('placements.urls')),
    path('logs/', include('logbook.urls')),
    path('reviews/', include('reviews.urls')),
    path('evaluations/', include('evaluations.urls')),
    path('dashboard/', include('dashboard.urls')),
]

urlpatterns = [
    path('admin/', admin.site.urls),
    # Grouping all v1 endpoints under a single prefix
    path('api/v1/', include(v1_patterns)),
]
