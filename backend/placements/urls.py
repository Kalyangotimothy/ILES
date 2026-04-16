from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PlacementViewSet, PlacementDocumentViewSet

router = DefaultRouter()
router.register('', PlacementViewSet, basename='placement')

urlpatterns = [
    path('', include(router.urls)),
    # Document endpoints
    path('documents/', PlacementDocumentViewSet.as_view({
        'get': 'list',
        'post': 'create'
    }), name='placement-documents-list'),
    path('documents/<int:pk>/', PlacementDocumentViewSet.as_view({
        'get': 'retrieve',
        'delete': 'destroy'
    }), name='placement-documents-detail'),
]
