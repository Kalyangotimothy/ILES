from rest_framework import serializers
from .models import Notification, NotificationPreference


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for Notification model."""
    notification_type_display = serializers.CharField(
        source='get_notification_type_display', read_only=True
    )
    time_ago = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            'id', 'notification_type', 'notification_type_display',
            'title', 'message', 'related_log', 'related_placement',
            'is_read', 'created_at', 'time_ago'
        ]
        read_only_fields = ['id', 'notification_type', 'title', 'message',
                           'related_log', 'related_placement', 'created_at']

    def get_time_ago(self, obj):
        """Return human-readable time ago string."""
        from django.utils import timezone
        from datetime import timedelta

        now = timezone.now()
        diff = now - obj.created_at

        if diff < timedelta(minutes=1):
            return "Just now"
        elif diff < timedelta(hours=1):
            minutes = int(diff.total_seconds() / 60)
            return f"{minutes}m ago"
        elif diff < timedelta(days=1):
            hours = int(diff.total_seconds() / 3600)
            return f"{hours}h ago"
        elif diff < timedelta(days=7):
            days = diff.days
            return f"{days}d ago"
        else:
            return obj.created_at.strftime("%b %d")


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    """Serializer for NotificationPreference model."""

    class Meta:
        model = NotificationPreference
        fields = [
            'email_log_submitted', 'email_log_reviewed', 'email_placement_updates',
            'inapp_log_submitted', 'inapp_log_reviewed', 'inapp_placement_updates'
        ]
