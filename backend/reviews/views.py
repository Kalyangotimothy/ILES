from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q

from .models import SupervisorReview, AuditLog
from .serializers import (
    SupervisorReviewSerializer,
    SupervisorReviewCreateSerializer,
    PendingLogForReviewSerializer,
    AuditLogSerializer
)
from logbook.models import WeeklyLog


class SupervisorReviewViewSet(viewsets.ModelViewSet):
    """ViewSet for managing supervisor reviews."""
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return SupervisorReviewCreateSerializer
        return SupervisorReviewSerializer

    def get_queryset(self):
        user = self.request.user

        if user.role == 'workplace_supervisor':
            # Workplace supervisors see reviews they've given and reviews on their assigned logs
            return SupervisorReview.objects.filter(
                Q(reviewer=user) | Q(log__placement__workplace_supervisor=user)
            ).select_related('log', 'log__placement', 'log__placement__student', 'reviewer').distinct()

        elif user.role == 'academic_supervisor':
            # Academic supervisors see reviews they've given and reviews on their assigned students' logs
            return SupervisorReview.objects.filter(
                Q(reviewer=user) | Q(log__placement__academic_supervisor=user)
            ).select_related('log', 'log__placement', 'log__placement__student', 'reviewer').distinct()

        elif user.role == 'student':
            # Students see reviews on their own logs
            return SupervisorReview.objects.filter(
                log__placement__student=user
            ).select_related('log', 'reviewer')

        elif user.role == 'admin':
            return SupervisorReview.objects.all().select_related(
                'log', 'log__placement', 'log__placement__student', 'reviewer'
            )

        return SupervisorReview.objects.none()

    def create(self, request, *args, **kwargs):
        """Create a review - workplace and academic supervisors can do this."""
        if request.user.role not in ['workplace_supervisor', 'academic_supervisor']:
            return Response(
                {'error': 'Only supervisors can submit reviews.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().create(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def pending_logs(self, request):
        """Get all logs pending review for the current supervisor."""
        user = request.user

        if user.role == 'workplace_supervisor':
            # Get logs needing workplace review
            pending_logs = WeeklyLog.objects.filter(
                placement__workplace_supervisor=user,
                status__in=['submitted', 'reviewed']
            ).exclude(
                reviews__reviewer_type='workplace'
            ).select_related(
                'placement', 'placement__student'
            ).prefetch_related('reviews').order_by('-submitted_at')

        elif user.role == 'academic_supervisor':
            # Get logs needing academic review
            pending_logs = WeeklyLog.objects.filter(
                placement__academic_supervisor=user,
                status__in=['submitted', 'reviewed']
            ).exclude(
                reviews__reviewer_type='academic'
            ).select_related(
                'placement', 'placement__student'
            ).prefetch_related('reviews').order_by('-submitted_at')

        else:
            return Response(
                {'error': 'This endpoint is only for supervisors.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = PendingLogForReviewSerializer(pending_logs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def my_reviews(self, request):
        """Get all reviews submitted by the current supervisor."""
        if request.user.role not in ['workplace_supervisor', 'academic_supervisor']:
            return Response(
                {'error': 'This endpoint is only for supervisors.'},
                status=status.HTTP_403_FORBIDDEN
            )

        reviews = SupervisorReview.objects.filter(
            reviewer=request.user
        ).select_related(
            'log', 'log__placement', 'log__placement__student'
        ).order_by('-reviewed_at')

        serializer = SupervisorReviewSerializer(reviews, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get review statistics for the current supervisor."""
        user = request.user

        if user.role == 'workplace_supervisor':
            reviewer_type = 'workplace'
            supervisor_field = 'workplace_supervisor'
        elif user.role == 'academic_supervisor':
            reviewer_type = 'academic'
            supervisor_field = 'academic_supervisor'
        else:
            return Response(
                {'error': 'This endpoint is only for supervisors.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Count pending logs (not yet reviewed by this supervisor type)
        from placements.models import InternshipPlacement
        pending_count = WeeklyLog.objects.filter(
            **{f'placement__{supervisor_field}': user},
            status__in=['submitted', 'reviewed']
        ).exclude(
            reviews__reviewer_type=reviewer_type
        ).count()

        # Count reviews given
        reviews = SupervisorReview.objects.filter(reviewer=user)
        total_reviews = reviews.count()
        approved_count = reviews.filter(decision='approved').count()
        returned_count = reviews.filter(decision='returned').count()

        # Count assigned students/interns
        students_count = InternshipPlacement.objects.filter(
            **{supervisor_field: user},
            status__in=['active', 'pending']
        ).count()

        return Response({
            'pending_reviews': pending_count,
            'total_reviews': total_reviews,
            'approved_count': approved_count,
            'returned_count': returned_count,
            'assigned_students': students_count,
        })


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing audit logs (read-only)."""
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        # Only admins can see all audit logs
        if user.role == 'admin':
            return AuditLog.objects.all().select_related('actor')

        # Others can see audit logs related to their own actions
        return AuditLog.objects.filter(actor=user).select_related('actor')
