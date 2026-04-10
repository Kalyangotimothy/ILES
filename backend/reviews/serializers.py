from rest_framework import serializers
from .models import SupervisorReview, AuditLog
from logbook.models import WeeklyLog


class SupervisorReviewSerializer(serializers.ModelSerializer):
    """Serializer for SupervisorReview model."""
    reviewer_name = serializers.CharField(source='reviewer.full_name', read_only=True)
    log_week_number = serializers.IntegerField(source='log.week_number', read_only=True)
    student_name = serializers.CharField(source='log.placement.student.full_name', read_only=True)

    class Meta:
        model = SupervisorReview
        fields = [
            'id', 'log', 'reviewer', 'reviewer_name', 'decision', 'comments',
            'rating', 'reviewed_at', 'log_week_number', 'student_name'
        ]
        read_only_fields = ['id', 'reviewer', 'reviewed_at']


class SupervisorReviewCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a supervisor review."""

    class Meta:
        model = SupervisorReview
        fields = ['log', 'decision', 'comments', 'rating']

    def validate_log(self, value):
        """Validate that the log can be reviewed."""
        if value.status != 'submitted':
            raise serializers.ValidationError(
                f"Only submitted logs can be reviewed. Current status: {value.status}"
            )
        return value

    def validate_comments(self, value):
        """Comments are required when returning a log."""
        return value

    def validate(self, attrs):
        """Ensure comments are provided when returning a log."""
        if attrs.get('decision') == 'returned' and not attrs.get('comments'):
            raise serializers.ValidationError({
                'comments': 'Comments are required when returning a log for revision.'
            })

        # Validate that the reviewer is the workplace supervisor for this placement
        request = self.context.get('request')
        if request and request.user:
            log = attrs.get('log')
            if log and log.placement.workplace_supervisor != request.user:
                raise serializers.ValidationError(
                    "You can only review logs from your assigned interns."
                )

        return attrs

    def create(self, validated_data):
        """Create the review and log the audit trail."""
        request = self.context.get('request')
        validated_data['reviewer'] = request.user

        # Get old status for audit
        log = validated_data['log']
        old_status = log.status

        # Create the review (this will update the log status via model save)
        review = super().create(validated_data)

        # Create audit log
        AuditLog.objects.create(
            actor=request.user,
            action='review_submitted',
            target_model='WeeklyLog',
            target_id=log.id,
            old_value={'status': old_status},
            new_value={'status': log.status, 'decision': review.decision},
            details=f"Log reviewed with decision: {review.decision}"
        )

        return review


class PendingLogForReviewSerializer(serializers.ModelSerializer):
    """Serializer for logs pending review."""
    student_name = serializers.CharField(source='placement.student.full_name', read_only=True)
    student_number = serializers.CharField(source='placement.student.student_number', read_only=True)
    organization = serializers.CharField(source='placement.organization', read_only=True)
    reviews_count = serializers.SerializerMethodField()

    class Meta:
        model = WeeklyLog
        fields = [
            'id', 'placement', 'week_number', 'week_start_date', 'week_end_date',
            'activities', 'challenges', 'skills_learned', 'hours_worked',
            'status', 'submitted_at', 'is_late', 'student_name', 'student_number',
            'organization', 'reviews_count'
        ]

    def get_reviews_count(self, obj):
        return obj.reviews.count()


class AuditLogSerializer(serializers.ModelSerializer):
    """Serializer for AuditLog model."""
    actor_name = serializers.CharField(source='actor.full_name', read_only=True)

    class Meta:
        model = AuditLog
        fields = [
            'id', 'actor', 'actor_name', 'action', 'target_model',
            'target_id', 'old_value', 'new_value', 'details', 'timestamp'
        ]
