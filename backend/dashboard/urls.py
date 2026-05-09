from django.urls import path, include
from django.contrib.auth.decorators import login_required
from .views import (
    StudentDashboardView,
    SupervisorDashboardView,
    EvaluatorDashboardView,
    AdminDashboardView,
    RoleRedirectView, # New View for UX
)

# Namespace your app in a sub-app (e.g., 'dashboards:')
app_name = 'dashboards'

urlpatterns = [
    # 1. The "Smart" Entry Point
    path('', login_required(RoleRedirectView.as_view()), name='dashboard-home'),

    # 2. Role-Specific Paths
    path('student/', StudentDashboardView.as_view(), name='student-dashboard'),
    path('supervisor/', SupervisorDashboardView.as_view(), name='supervisor-dashboard'),
    path('evaluator/', EvaluatorDashboardView.as_view(), name='evaluator-dashboard'),
    
    # 3. Use 'management/' or similar for Admin to avoid conflict with Django's default /admin/
    path('management/', AdminDashboardView.as_view(), name='admin-dashboard'),
]
