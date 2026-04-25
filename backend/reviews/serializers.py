from rest_framework import serializers
from .models import SupervisorReview, AuditLog
from logbook.models import WeeklyLog


class SupervisorReviewSerializer(serializers.ModelSerializer):
    """Serializer for SupervisorReview model."""
    reviewer_name = serializers.CharField(source='reviewer.full_name', read_only=True)
    reviewer_type_display = serializers.CharField(source='get_reviewer_type_display', read_only=True)
    log_week_number = serializers.IntegerField(source='log.week_number', read_only=True)
    student_name = serializers.CharField(source='log.placement.student.full_name', read_only=True)

    class Meta:
        model = SupervisorReview
        fields = [
            'id', 'log', 'reviewer', 'reviewer_name', 'reviewer_type', 'reviewer_type_display',
            'decision', 'comments', 'rating', 'reviewed_at', 'log_week_number', 'student_name'
        ]
        read_only_fields = ['id', 'reviewer', 'reviewer_type', 'reviewed_at']


class SupervisorReviewCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a supervisor review."""

    class Meta:
        model = SupervisorReview
        fields = ['log', 'decision', 'comments', 'rating']

    def validate_log(self, value):
        """Validate that the log can be reviewed."""
        request = self.context.get('request')
        user = request.user if request else None

        # Determine reviewer type
        if user and user.role == 'academic_supervisor':
            reviewer_type = 'academic'
        else:
            reviewer_type = 'workplace'

        # Check if this reviewer type has already reviewed
        existing_review = value.reviews.filter(reviewer_type=reviewer_type).exists()
        if existing_review:
            raise serializers.ValidationError(
                f"This log has already been reviewed by a {reviewer_type} supervisor."
            )

        # Log must be submitted or reviewed (waiting for second review)
        if value.status not in ['submitted', 'reviewed']:
            raise serializers.ValidationError(
                f"Only submitted or partially reviewed logs can be reviewed. Current status: {value.status}"
            )

        return value

    def validate(self, attrs):
        """Ensure comments are provided when returning a log."""
        if attrs.get('decision') == 'returned' and not attrs.get('comments'):
            raise serializers.ValidationError({
                'comments': 'Comments are required when returning a log for revision.'
            })

        # Validate that the reviewer is assigned to this placement
        request = self.context.get('request')
        if request and request.user:
            log = attrs.get('log')
            user = request.user

            if user.role == 'workplace_supervisor':
                if log and log.placement.workplace_supervisor != user:
                    raise serializers.ValidationError(
                        "You can only review logs from your assigned interns."
                    )
            elif user.role == 'academic_supervisor':
                if log and log.placement.academic_supervisor != user:
                    raise serializers.ValidationError(
                        "You can only review logs from your assigned students."
                    )

        return attrs

    def create(self, validated_data):
        """Create the review and log the audit trail."""
        request = self.context.get('request')
        user = request.user
        validated_data['reviewer'] = user

        # Set reviewer type based on user role
        if user.role == 'academic_supervisor':
            validated_data['reviewer_type'] = 'academic'
        else:
            validated_data['reviewer_type'] = 'workplace'

        # Get old status for audit
        log = validated_data['log']
        old_status = log.status

        # Create the review (this will update the log status via model save)
        review = super().create(validated_data)

        # Refresh log to get updated status
        log.refresh_from_db()

        # Create audit log
        AuditLog.objects.create(
            actor=user,
            action='review_submitted',
            target_model='WeeklyLog',
            target_id=log.id,
            old_value={'status': old_status},
            new_value={'status': log.status, 'decision': review.decision, 'reviewer_type': review.reviewer_type},
            details=f"Log reviewed by {review.get_reviewer_type_display()} with decision: {review.decision}"
        )

        return review


class PendingLogForReviewSerializer(serializers.ModelSerializer):
    """Serializer for logs pending review."""
    student_name = serializers.CharField(source='placement.student.full_name', read_only=True)
    student_number = serializers.CharField(source='placement.student.student_number', read_only=True)
    organization = serializers.CharField(source='placement.organization', read_only=True)
    reviews_count = serializers.SerializerMethodField()
    workplace_reviewed = serializers.SerializerMethodField()
    academic_reviewed = serializers.SerializerMethodField()
    reviews = SupervisorReviewSerializer(many=True, read_only=True)

    class Meta:
        model = WeeklyLog
        fields = [
            'id', 'placement', 'week_number', 'week_start_date', 'week_end_date',
            'activities', 'challenges', 'skills_learned', 'hours_worked',
            'status', 'submitted_at', 'is_late', 'student_name', 'student_number',
            'organization', 'reviews_count', 'workplace_reviewed', 'academic_reviewed',
            'reviews'
        ]

    def get_reviews_count(self, obj):
        return obj.reviews.count()

    def get_workplace_reviewed(self, obj):
        return obj.reviews.filter(reviewer_type='workplace').exists()

    def get_academic_reviewed(self, obj):
        return obj.reviews.filter(reviewer_type='academic').exists()


class AuditLogSerializer(serializers.ModelSerializer):
    """Serializer for AuditLog model."""
    actor_name = serializers.CharField(source='actor.full_name', read_only=True)

    class Meta:
        model = AuditLog
        fields = [
            'id', 'actor', 'actor_name', 'action', 'target_model',
            'target_id', 'old_value', 'new_value', 'details', 'timestamp'
        ]
