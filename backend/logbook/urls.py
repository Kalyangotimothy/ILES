from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WeeklyLogViewSet, LogAttachmentViewSet, LogTemplateViewSet

router = DefaultRouter()
router.register('templates', LogTemplateViewSet, basename='log-templates')
router.register('', WeeklyLogViewSet, basename='weeklylog')

urlpatterns = [
    path('', include(router.urls)),
    # Attachment endpoints
    path('attachments/', LogAttachmentViewSet.as_view({
        'get': 'list',
        'post': 'create'
    }), name='log-attachments-list'),
    path('attachments/<int:pk>/', LogAttachmentViewSet.as_view({
        'get': 'retrieve',
        'delete': 'destroy'
    }), name='log-attachments-detail'),
]
