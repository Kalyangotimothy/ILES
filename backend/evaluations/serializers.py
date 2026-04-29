from rest_framework import serializers
from django.db.models import Avg
from .models import EvaluationCriteria, Evaluation, EvaluationScore
from reviews.models import SupervisorReview


class EvaluationCriteriaSerializer(serializers.ModelSerializer):
    """Serializer for EvaluationCriteria model."""

    class Meta:
        model = EvaluationCriteria
        fields = [
            'id', 'name', 'description', 'max_score',
            'weight_percent', 'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class EvaluationScoreSerializer(serializers.ModelSerializer):
    """Serializer for EvaluationScore model."""
    criteria_name = serializers.CharField(source='criteria.name', read_only=True)
    criteria_max_score = serializers.IntegerField(source='criteria.max_score', read_only=True)
    criteria_weight = serializers.DecimalField(
        source='criteria.weight_percent',
        max_digits=5,
        decimal_places=2,
        read_only=True
    )

    class Meta:
        model = EvaluationScore
        fields = [
            'id', 'criteria', 'criteria_name', 'criteria_max_score',
            'criteria_weight', 'score_awarded'
        ]


class EvaluationSerializer(serializers.ModelSerializer):
    """Serializer for Evaluation model (read operations)."""
    evaluator_name = serializers.CharField(source='evaluator.full_name', read_only=True)
    student_name = serializers.CharField(source='placement.student.full_name', read_only=True)
    student_number = serializers.CharField(source='placement.student.student_number', read_only=True)
    organization = serializers.CharField(source='placement.organization', read_only=True)
    criterion_scores = EvaluationScoreSerializer(many=True, read_only=True)
    grade_display = serializers.CharField(source='get_grade_display', read_only=True)

    class Meta:
        model = Evaluation
        fields = [
            'id', 'placement', 'evaluator', 'evaluator_name',
            'student_name', 'student_number', 'organization',
            'supervisor_score', 'academic_score', 'logbook_score',
            'total_score', 'grade', 'grade_display', 'comments',
            'is_locked', 'submitted_at', 'updated_at', 'criterion_scores'
        ]
        read_only_fields = [
            'id', 'evaluator', 'total_score', 'grade',
            'is_locked', 'submitted_at', 'updated_at'
        ]


class EvaluationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating evaluations."""
    criterion_scores = EvaluationScoreSerializer(many=True, required=False)

    class Meta:
        model = Evaluation
        fields = [
            'placement', 'supervisor_score', 'academic_score',
            'logbook_score', 'comments', 'criterion_scores'
        ]

    def validate_placement(self, value):
        """Validate placement can be evaluated."""
        # Check if placement is completed or active
        if value.status not in ['active', 'completed']:
            raise serializers.ValidationError(
                f"Cannot evaluate placement with status: {value.status}"
            )

        # Check if evaluation already exists
        if hasattr(value, 'evaluation'):
            raise serializers.ValidationError(
                "An evaluation already exists for this placement."
            )

        return value

    def validate(self, attrs):
        """Validate the evaluation data."""
        request = self.context.get('request')

        # Ensure evaluator is the academic supervisor for this placement
        if request and request.user:
            placement = attrs.get('placement')
            if placement and placement.academic_supervisor != request.user:
                raise serializers.ValidationError(
                    "You can only evaluate placements where you are the academic supervisor."
                )

        # Validate score ranges
        for field in ['supervisor_score', 'academic_score', 'logbook_score']:
            score = attrs.get(field)
            if score is not None and (score < 0 or score > 100):
                raise serializers.ValidationError({
                    field: "Score must be between 0 and 100."
                })

        return attrs

    def create(self, validated_data):
        """Create evaluation with criterion scores."""
        criterion_scores_data = validated_data.pop('criterion_scores', [])
        request = self.context.get('request')
        validated_data['evaluator'] = request.user

        # Create the evaluation (score calculation happens in model.save())
        evaluation = Evaluation.objects.create(**validated_data)

        # Create criterion scores if provided
        for score_data in criterion_scores_data:
            EvaluationScore.objects.create(evaluation=evaluation, **score_data)

        return evaluation


class PlacementForEvaluationSerializer(serializers.Serializer):
    """Serializer for placements pending evaluation."""
    id = serializers.IntegerField()
    student_name = serializers.CharField(source='student.full_name')
    student_number = serializers.CharField(source='student.student_number')
    organization = serializers.CharField()
    department = serializers.CharField(allow_null=True)
    position = serializers.CharField(allow_null=True)
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    status = serializers.CharField()
    workplace_supervisor_name = serializers.SerializerMethodField()
    logs_count = serializers.SerializerMethodField()
    approved_logs_count = serializers.SerializerMethodField()
    calculated_logbook_score = serializers.SerializerMethodField()

    def get_workplace_supervisor_name(self, obj):
        return obj.workplace_supervisor.full_name if obj.workplace_supervisor else None

    def get_logs_count(self, obj):
        return obj.weekly_logs.count()

    def get_approved_logs_count(self, obj):
        return obj.weekly_logs.filter(status='approved').count()

    def get_calculated_logbook_score(self, obj):
        """Calculate average logbook score from approved log reviews."""
        return SupervisorReview.calculate_placement_logbook_score(obj)


class EvaluationStatsSerializer(serializers.Serializer):
    """Serializer for evaluation statistics."""
    pending_evaluations = serializers.IntegerField()
    completed_evaluations = serializers.IntegerField()
    average_score = serializers.DecimalField(max_digits=5, decimal_places=2, allow_null=True)
    grade_distribution = serializers.DictField()
