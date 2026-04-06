from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SupervisorReviewViewSet, AuditLogViewSet

router = DefaultRouter()
router.register('', SupervisorReviewViewSet, basename='review')

urlpatterns = [
    path('', include(router.urls)),
    path('audit/', AuditLogViewSet.as_view({'get': 'list'}), name='audit-list'),
]
