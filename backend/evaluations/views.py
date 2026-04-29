from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Avg, Count

from .models import EvaluationCriteria, Evaluation, EvaluationScore
from .serializers import (
    EvaluationCriteriaSerializer,
    EvaluationSerializer,
    EvaluationCreateSerializer,
    PlacementForEvaluationSerializer,
)
from placements.models import InternshipPlacement
from reviews.models import AuditLog, SupervisorReview


class EvaluationCriteriaViewSet(viewsets.ModelViewSet):
    """ViewSet for managing evaluation criteria."""
    serializer_class = EvaluationCriteriaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        # All authenticated users can view active criteria
        if self.action in ['list', 'retrieve']:
            if user.role == 'admin':
                return EvaluationCriteria.objects.all()
            return EvaluationCriteria.objects.filter(is_active=True)

        # Only admins can modify criteria
        return EvaluationCriteria.objects.all()

    def create(self, request, *args, **kwargs):
        """Only admins can create criteria."""
        if request.user.role != 'admin':
            return Response(
                {'error': 'Only administrators can create evaluation criteria.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        """Only admins can update criteria."""
        if request.user.role != 'admin':
            return Response(
                {'error': 'Only administrators can update evaluation criteria.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """Only admins can delete criteria."""
        if request.user.role != 'admin':
            return Response(
                {'error': 'Only administrators can delete evaluation criteria.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)


class EvaluationViewSet(viewsets.ModelViewSet):
    """ViewSet for managing evaluations."""
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return EvaluationCreateSerializer
        return EvaluationSerializer

    def get_queryset(self):
        user = self.request.user

        if user.role == 'academic_supervisor':
            # Academic supervisors see evaluations they've given
            return Evaluation.objects.filter(
                evaluator=user
            ).select_related(
                'placement', 'placement__student', 'evaluator'
            ).prefetch_related('criterion_scores', 'criterion_scores__criteria')

        elif user.role == 'student':
            # Students see their own evaluations
            return Evaluation.objects.filter(
                placement__student=user
            ).select_related(
                'placement', 'evaluator'
            ).prefetch_related('criterion_scores', 'criterion_scores__criteria')

        elif user.role == 'admin':
            # Admins see all evaluations
            return Evaluation.objects.all().select_related(
                'placement', 'placement__student', 'evaluator'
            ).prefetch_related('criterion_scores', 'criterion_scores__criteria')

        elif user.role == 'workplace_supervisor':
            # Workplace supervisors can see evaluations for their assigned interns
            return Evaluation.objects.filter(
                placement__workplace_supervisor=user
            ).select_related(
                'placement', 'placement__student', 'evaluator'
            ).prefetch_related('criterion_scores', 'criterion_scores__criteria')

        return Evaluation.objects.none()

    def create(self, request, *args, **kwargs):
        """Only academic supervisors can create evaluations."""
        if request.user.role != 'academic_supervisor':
            return Response(
                {'error': 'Only academic supervisors can submit evaluations.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        evaluation = serializer.save()

        # Create audit log
        AuditLog.objects.create(
            actor=request.user,
            action='evaluation_submitted',
            target_model='Evaluation',
            target_id=evaluation.id,
            new_value={
                'total_score': float(evaluation.total_score),
                'grade': evaluation.grade
            },
            details=f"Evaluation submitted for {evaluation.placement.student.full_name}"
        )

        # Return the full evaluation data
        output_serializer = EvaluationSerializer(evaluation)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        """Prevent updates to locked evaluations."""
        instance = self.get_object()
        if instance.is_locked:
            return Response(
                {'error': 'This evaluation is locked and cannot be modified.'},
                status=status.HTTP_403_FORBIDDEN
            )

        if request.user.role != 'academic_supervisor':
            return Response(
                {'error': 'Only academic supervisors can update evaluations.'},
                status=status.HTTP_403_FORBIDDEN
            )

        return super().update(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def pending_placements(self, request):
        """Get placements pending evaluation for the current academic supervisor."""
        if request.user.role != 'academic_supervisor':
            return Response(
                {'error': 'This endpoint is only for academic supervisors.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Get placements assigned to this academic supervisor that don't have evaluations
        pending = InternshipPlacement.objects.filter(
            academic_supervisor=request.user,
            status__in=['active', 'completed']
        ).exclude(
            evaluation__isnull=False
        ).select_related(
            'student', 'workplace_supervisor'
        ).prefetch_related('logs')

        serializer = PlacementForEvaluationSerializer(pending, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def my_evaluations(self, request):
        """Get all evaluations submitted by the current academic supervisor."""
        if request.user.role != 'academic_supervisor':
            return Response(
                {'error': 'This endpoint is only for academic supervisors.'},
                status=status.HTTP_403_FORBIDDEN
            )

        evaluations = Evaluation.objects.filter(
            evaluator=request.user
        ).select_related(
            'placement', 'placement__student'
        ).order_by('-submitted_at')

        serializer = EvaluationSerializer(evaluations, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get evaluation statistics for the current academic supervisor."""
        if request.user.role != 'academic_supervisor':
            return Response(
                {'error': 'This endpoint is only for academic supervisors.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Count pending evaluations
        pending_count = InternshipPlacement.objects.filter(
            academic_supervisor=request.user,
            status__in=['active', 'completed']
        ).exclude(
            evaluation__isnull=False
        ).count()

        # Get evaluations given
        evaluations = Evaluation.objects.filter(evaluator=request.user)
        completed_count = evaluations.count()

        # Calculate average score
        avg_score = evaluations.aggregate(avg=Avg('total_score'))['avg']

        # Grade distribution
        grade_dist = evaluations.values('grade').annotate(
            count=Count('id')
        ).order_by('grade')

        grade_distribution = {item['grade']: item['count'] for item in grade_dist}

        return Response({
            'pending_evaluations': pending_count,
            'completed_evaluations': completed_count,
            'average_score': round(avg_score, 2) if avg_score else None,
            'grade_distribution': grade_distribution,
        })

    @action(detail=True, methods=['post'])
    def lock(self, request, pk=None):
        """Lock an evaluation to prevent further edits."""
        evaluation = self.get_object()

        if request.user.role not in ['academic_supervisor', 'admin']:
            return Response(
                {'error': 'Only academic supervisors or admins can lock evaluations.'},
                status=status.HTTP_403_FORBIDDEN
            )

        if evaluation.is_locked:
            return Response(
                {'error': 'Evaluation is already locked.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        evaluation.is_locked = True
        evaluation.save(update_fields=['is_locked'])

        # Audit log
        AuditLog.objects.create(
            actor=request.user,
            action='evaluation_locked',
            target_model='Evaluation',
            target_id=evaluation.id,
            details=f"Evaluation locked for {evaluation.placement.student.full_name}"
        )

        serializer = EvaluationSerializer(evaluation)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def placement_details(self, request, pk=None):
        """Get detailed placement info for evaluation context."""
        evaluation = self.get_object()
        placement = evaluation.placement

        # Get all logs and their reviews
        logs_data = []
        for log in placement.weekly_logs.all().order_by('week_number'):
            log_info = {
                'id': log.id,
                'week_number': log.week_number,
                'status': log.status,
                'hours_worked': float(log.hours_worked),
                'activities': log.activities,
                'is_late': log.is_late,
                'computed_score': float(log.computed_score) if log.computed_score else None,
            }
            reviews = log.reviews.all()
            if reviews.exists():
                log_info['reviews'] = [
                    {
                        'decision': r.decision,
                        'score': float(r.score) if r.score else None,
                        'comments': r.comments,
                        'reviewer_type': r.reviewer_type,
                        'reviewed_at': r.reviewed_at.isoformat()
                    }
                    for r in reviews
                ]
            logs_data.append(log_info)

        # Calculate average logbook score
        calculated_logbook_score = SupervisorReview.calculate_placement_logbook_score(placement)

        return Response({
            'placement': {
                'id': placement.id,
                'student_name': placement.student.full_name,
                'student_number': placement.student.student_number,
                'organization': placement.organization,
                'department': placement.department,
                'position': placement.position,
                'start_date': placement.start_date,
                'end_date': placement.end_date,
                'status': placement.status,
                'workplace_supervisor': placement.workplace_supervisor.full_name if placement.workplace_supervisor else None,
            },
            'logs': logs_data,
            'total_logs': len(logs_data),
            'approved_logs': sum(1 for l in logs_data if l['status'] == 'approved'),
            'calculated_logbook_score': calculated_logbook_score,
        })

    @action(detail=False, methods=['get'], url_path='logbook-score/(?P<placement_id>[^/.]+)')
    def logbook_score(self, request, placement_id=None):
        """Get the calculated logbook score for a placement."""
        try:
            placement = InternshipPlacement.objects.get(id=placement_id)
        except InternshipPlacement.DoesNotExist:
            return Response(
                {'error': 'Placement not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check permission
        if request.user.role == 'academic_supervisor' and placement.academic_supervisor != request.user:
            return Response(
                {'error': 'You can only view scores for your assigned students.'},
                status=status.HTTP_403_FORBIDDEN
            )

        calculated_score = SupervisorReview.calculate_placement_logbook_score(placement)

        # Get individual log scores
        log_scores = []
        for log in placement.weekly_logs.filter(status='approved').order_by('week_number'):
            log_scores.append({
                'week_number': log.week_number,
                'computed_score': float(log.computed_score) if log.computed_score else None,
            })

        return Response({
            'placement_id': placement.id,
            'student_name': placement.student.full_name,
            'calculated_logbook_score': calculated_score,
            'approved_logs_count': len(log_scores),
            'log_scores': log_scores,
        })
