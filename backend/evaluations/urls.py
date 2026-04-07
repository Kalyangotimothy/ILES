from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EvaluationCriteriaViewSet, EvaluationViewSet

router = DefaultRouter()
router.register('criteria', EvaluationCriteriaViewSet, basename='criteria')
router.register('', EvaluationViewSet, basename='evaluation')

urlpatterns = [
    path('', include(router.urls)),
]
