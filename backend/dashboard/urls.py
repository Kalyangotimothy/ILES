from django.urls import path
from .views import (
    StudentDashboardView,
    SupervisorDashboardView,
    EvaluatorDashboardView,
    AdminDashboardView,
)

urlpatterns = [
    path('student/', StudentDashboardView.as_view(), name='student-dashboard'),
    path('supervisor/', SupervisorDashboardView.as_view(), name='supervisor-dashboard'),
    path('evaluator/', EvaluatorDashboardView.as_view(), name='evaluator-dashboard'),
    path('admin/', AdminDashboardView.as_view(), name='admin-dashboard'),
]
