from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Avg, Q
from django.utils import timezone
from django.views import View
from django.shortcuts import redirect

from users.models import CustomUser
from placements.models import InternshipPlacement
from logbook.models import WeeklyLog
from reviews.models import SupervisorReview
from evaluations.models import Evaluation


class RoleRedirectView(View):
    """Redirect users to their role-specific dashboard."""

    def get(self, request):
        user = request.user
        role_redirects = {
            'student': 'dashboards:student-dashboard',
            'workplace_supervisor': 'dashboards:supervisor-dashboard',
            'academic_supervisor': 'dashboards:evaluator-dashboard',
            'admin': 'dashboards:admin-dashboard',
        }
        redirect_name = role_redirects.get(user.role, 'dashboards:student-dashboard')
        return redirect(redirect_name)


class StudentDashboardView(APIView):
    """Dashboard data for student interns."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role != 'student':
            return Response({'error': 'This dashboard is for students only.'}, status=403)

        # Get active placement
        placement = InternshipPlacement.objects.filter(
            student=user,
            status='active'
        ).select_related('workplace_supervisor', 'academic_supervisor').first()

        placement_data = None
        logs_data = []
        total_logs = 0
        submitted_logs = 0
        approved_logs = 0
        pending_review = 0

        if placement:
            placement_data = {
                'id': placement.id,
                'organization': placement.organization,
                'department': placement.department,
                'position': placement.position,
                'start_date': placement.start_date,
                'end_date': placement.end_date,
                'workplace_supervisor': placement.workplace_supervisor.full_name,
                'academic_supervisor': placement.academic_supervisor.full_name,
            }

            # Get logs statistics
            logs = WeeklyLog.objects.filter(placement=placement).order_by('week_number')
            total_logs = logs.count()
            submitted_logs = logs.filter(status__in=['submitted', 'reviewed', 'approved']).count()
            approved_logs = logs.filter(status='approved').count()
            pending_review = logs.filter(status='submitted').count()

            # Get recent logs for display
            logs_data = [
                {
                    'id': log.id,
                    'week_number': log.week_number,
                    'status': log.status,
                    'submitted_at': log.submitted_at,
                    'is_late': log.is_late,
                }
                for log in logs[:10]
            ]

        # Get evaluation if exists
        evaluation = None
        if placement:
            eval_obj = Evaluation.objects.filter(placement=placement).first()
            if eval_obj:
                evaluation = {
                    'total_score': float(eval_obj.total_score),
                    'grade': eval_obj.grade,
                    'grade_display': eval_obj.get_grade_display(),
                    'submitted_at': eval_obj.submitted_at,
                }

        # Get recent reviews on student's logs
        recent_reviews = SupervisorReview.objects.filter(
            log__placement__student=user
        ).select_related('reviewer', 'log').order_by('-reviewed_at')[:5]

        reviews_data = [
            {
                'id': review.id,
                'week_number': review.log.week_number,
                'decision': review.decision,
                'score': review.score,
                'comments': review.comments[:100] if review.comments else None,
                'reviewer_name': review.reviewer.full_name,
                'reviewed_at': review.reviewed_at,
            }
            for review in recent_reviews
        ]

        return Response({
            'placement': placement_data,
            'stats': {
                'total_logs': total_logs,
                'submitted_logs': submitted_logs,
                'approved_logs': approved_logs,
                'pending_review': pending_review,
            },
            'recent_logs': logs_data,
            'evaluation': evaluation,
            'recent_reviews': reviews_data,
        })


class SupervisorDashboardView(APIView):
    """Dashboard data for workplace supervisors."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role != 'workplace_supervisor':
            return Response({'error': 'This dashboard is for workplace supervisors only.'}, status=403)

        # Get assigned interns
        placements = InternshipPlacement.objects.filter(
            workplace_supervisor=user,
            status='active'
        ).select_related('student')

        interns_count = placements.count()

        # Get pending reviews count
        pending_reviews = WeeklyLog.objects.filter(
            placement__workplace_supervisor=user,
            status='submitted'
        ).count()

        # Get reviews given
        my_reviews = SupervisorReview.objects.filter(reviewer=user)
        total_reviews = my_reviews.count()
        approved_count = my_reviews.filter(decision='approved').count()
        returned_count = my_reviews.filter(decision='returned').count()

        # Calculate average rating given
        avg_rating = my_reviews.filter(score__isnull=False).aggregate(avg=Avg('score'))['avg']

        # Reviews this week
        week_start = timezone.now().date() - timezone.timedelta(days=timezone.now().weekday())
        reviews_this_week = my_reviews.filter(reviewed_at__date__gte=week_start).count()

        # Get intern list with their log status
        interns_data = []
        for placement in placements:
            logs = WeeklyLog.objects.filter(placement=placement)
            pending = logs.filter(status='submitted').count()
            total = logs.count()
            interns_data.append({
                'id': placement.id,
                'student_name': placement.student.full_name,
                'student_number': placement.student.student_number,
                'organization': placement.organization,
                'pending_logs': pending,
                'total_logs': total,
            })

        # Recent reviews
        recent_reviews = my_reviews.select_related('log', 'log__placement__student').order_by('-reviewed_at')[:10]
        reviews_data = [
            {
                'id': review.id,
                'student_name': review.log.placement.student.full_name,
                'week_number': review.log.week_number,
                'decision': review.decision,
                'score': review.score,
                'reviewed_at': review.reviewed_at,
            }
            for review in recent_reviews
        ]

        return Response({
            'stats': {
                'assigned_interns': interns_count,
                'pending_reviews': pending_reviews,
                'total_reviews': total_reviews,
                'approved_count': approved_count,
                'returned_count': returned_count,
                'reviews_this_week': reviews_this_week,
                'average_rating': round(avg_rating, 1) if avg_rating else None,
            },
            'interns': interns_data,
            'recent_reviews': reviews_data,
        })


class EvaluatorDashboardView(APIView):
    """Dashboard data for academic supervisors."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role != 'academic_supervisor':
            return Response({'error': 'This dashboard is for academic supervisors only.'}, status=403)

        # Get assigned placements
        placements = InternshipPlacement.objects.filter(
            academic_supervisor=user,
            status__in=['active', 'completed']
        ).select_related('student', 'workplace_supervisor')

        total_assigned = placements.count()

        # Pending log reviews (logs submitted but not yet reviewed by this academic supervisor)
        pending_reviews = WeeklyLog.objects.filter(
            placement__academic_supervisor=user,
            status='submitted'
        ).exclude(
            reviews__reviewer_type='academic'
        ).count()

        # Get reviews given by this academic supervisor
        my_reviews = SupervisorReview.objects.filter(
            reviewer=user,
            reviewer_type='academic'
        )
        total_reviews = my_reviews.count()
        approved_reviews = my_reviews.filter(decision='approved').count()
        returned_reviews = my_reviews.filter(decision='returned').count()

        # Calculate average rating given
        avg_rating = my_reviews.filter(score__isnull=False).aggregate(avg=Avg('score'))['avg']

        # Reviews this week
        week_start = timezone.now().date() - timezone.timedelta(days=timezone.now().weekday())
        reviews_this_week = my_reviews.filter(reviewed_at__date__gte=week_start).count()

        # Pending evaluations (placements without evaluation)
        pending_evaluations = placements.filter(evaluation__isnull=True).count()

        # Completed evaluations
        my_evaluations = Evaluation.objects.filter(evaluator=user)
        completed_evaluations = my_evaluations.count()

        # Average score given
        avg_score = my_evaluations.aggregate(avg=Avg('total_score'))['avg']

        # Grade distribution
        grade_dist = my_evaluations.values('grade').annotate(count=Count('id'))
        grade_distribution = {item['grade']: item['count'] for item in grade_dist}

        # Logs awaiting review (pending review by academic supervisor)
        pending_logs = WeeklyLog.objects.filter(
            placement__academic_supervisor=user,
            status='submitted'
        ).exclude(
            reviews__reviewer_type='academic'
        ).select_related('placement', 'placement__student').order_by('-submitted_at')[:5]

        pending_logs_data = [
            {
                'id': log.id,
                'week_number': log.week_number,
                'student_name': log.placement.student.full_name,
                'student_number': log.placement.student.student_number,
                'organization': log.placement.organization,
                'submitted_at': log.submitted_at,
                'is_late': log.is_late,
            }
            for log in pending_logs
        ]

        # Interns awaiting evaluation
        pending_interns = []
        for placement in placements.filter(evaluation__isnull=True):
            logs_count = placement.weekly_logs.count()
            approved_logs = placement.weekly_logs.filter(status='approved').count()
            pending_interns.append({
                'id': placement.id,
                'student_name': placement.student.full_name,
                'student_number': placement.student.student_number,
                'organization': placement.organization,
                'logs_count': logs_count,
                'approved_logs': approved_logs,
                'status': placement.status,
            })

        # Recent reviews by this academic supervisor
        recent_reviews = my_reviews.select_related(
            'log', 'log__placement__student'
        ).order_by('-reviewed_at')[:5]

        reviews_data = [
            {
                'id': review.id,
                'student_name': review.log.placement.student.full_name,
                'week_number': review.log.week_number,
                'decision': review.decision,
                'score': review.score,
                'reviewed_at': review.reviewed_at,
            }
            for review in recent_reviews
        ]

        # Recent evaluations
        recent_evaluations = my_evaluations.select_related(
            'placement', 'placement__student'
        ).order_by('-submitted_at')[:10]

        evaluations_data = [
            {
                'id': eval.id,
                'student_name': eval.placement.student.full_name,
                'organization': eval.placement.organization,
                'total_score': float(eval.total_score),
                'grade': eval.grade,
                'submitted_at': eval.submitted_at,
            }
            for eval in recent_evaluations
        ]

        return Response({
            'stats': {
                'total_assigned': total_assigned,
                'pending_reviews': pending_reviews,
                'total_reviews': total_reviews,
                'approved_reviews': approved_reviews,
                'returned_reviews': returned_reviews,
                'reviews_this_week': reviews_this_week,
                'average_rating': round(avg_rating, 1) if avg_rating else None,
                'pending_evaluations': pending_evaluations,
                'completed_evaluations': completed_evaluations,
                'average_score': round(avg_score, 1) if avg_score else None,
                'grade_distribution': grade_distribution,
            },
            'pending_logs': pending_logs_data,
            'pending_interns': pending_interns,
            'recent_reviews': reviews_data,
            'recent_evaluations': evaluations_data,
        })


class AdminDashboardView(APIView):
    """Dashboard data for administrators."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role != 'admin':
            return Response({'error': 'This dashboard is for administrators only.'}, status=403)

        # User statistics
        total_users = CustomUser.objects.count()
        users_by_role = CustomUser.objects.values('role').annotate(count=Count('id'))
        role_counts = {item['role']: item['count'] for item in users_by_role}

        total_students = role_counts.get('student', 0)
        total_supervisors = role_counts.get('workplace_supervisor', 0)
        total_academics = role_counts.get('academic_supervisor', 0)

        # Placement statistics
        total_placements = InternshipPlacement.objects.count()
        placements_by_status = InternshipPlacement.objects.values('status').annotate(count=Count('id'))
        status_counts = {item['status']: item['count'] for item in placements_by_status}

        active_placements = status_counts.get('active', 0)
        completed_placements = status_counts.get('completed', 0)
        pending_placements = status_counts.get('pending', 0)

        # Completion rate
        completion_rate = 0
        if total_placements > 0:
            completion_rate = round((completed_placements / total_placements) * 100, 1)

        # Log statistics
        total_logs = WeeklyLog.objects.count()
        logs_by_status = WeeklyLog.objects.values('status').annotate(count=Count('id'))
        log_status_counts = {item['status']: item['count'] for item in logs_by_status}

        # Evaluation statistics
        total_evaluations = Evaluation.objects.count()
        avg_score = Evaluation.objects.aggregate(avg=Avg('total_score'))['avg']

        grade_dist = Evaluation.objects.values('grade').annotate(count=Count('id'))
        grade_distribution = {item['grade']: item['count'] for item in grade_dist}

        # Recent activity
        recent_placements = InternshipPlacement.objects.select_related(
            'student', 'workplace_supervisor'
        ).order_by('-created_at')[:5]

        recent_placements_data = [
            {
                'id': p.id,
                'student_name': p.student.full_name,
                'organization': p.organization,
                'status': p.status,
                'created_at': p.created_at,
            }
            for p in recent_placements
        ]

        recent_evaluations = Evaluation.objects.select_related(
            'placement', 'placement__student', 'evaluator'
        ).order_by('-submitted_at')[:5]

        recent_evaluations_data = [
            {
                'id': e.id,
                'student_name': e.placement.student.full_name,
                'evaluator_name': e.evaluator.full_name,
                'total_score': float(e.total_score),
                'grade': e.grade,
                'submitted_at': e.submitted_at,
            }
            for e in recent_evaluations
        ]

        # Organizations list
        organizations = InternshipPlacement.objects.values('organization').annotate(
            count=Count('id')
        ).order_by('-count')[:10]

        return Response({
            'stats': {
                'total_users': total_users,
                'total_students': total_students,
                'total_supervisors': total_supervisors,
                'total_academics': total_academics,
                'total_placements': total_placements,
                'active_placements': active_placements,
                'completed_placements': completed_placements,
                'pending_placements': pending_placements,
                'completion_rate': completion_rate,
                'total_logs': total_logs,
                'log_status_counts': log_status_counts,
                'total_evaluations': total_evaluations,
                'average_score': round(avg_score, 1) if avg_score else None,
                'grade_distribution': grade_distribution,
            },
            'recent_placements': recent_placements_data,
            'recent_evaluations': recent_evaluations_data,
            'top_organizations': list(organizations),
        })
