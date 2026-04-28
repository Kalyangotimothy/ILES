from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Notification, NotificationPreference
from .serializers import NotificationSerializer, NotificationPreferenceSerializer


class NotificationViewSet(viewsets.ModelViewSet):
    """ViewSet for managing notifications."""
    permission_classes = [IsAuthenticated]
    serializer_class = NotificationSerializer

    def get_queryset(self):
        """Return notifications for the current user."""
        return Notification.objects.filter(
            recipient=self.request.user
        ).select_related('related_log', 'related_placement')

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get count of unread notifications."""
        count = Notification.objects.filter(
            recipient=request.user,
            is_read=False
        ).count()
        return Response({'count': count})

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all notifications as read."""
        Notification.objects.filter(
            recipient=request.user,
            is_read=False
        ).update(is_read=True)
        return Response({'status': 'success'})

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark a single notification as read."""
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response(NotificationSerializer(notification).data)

    @action(detail=False, methods=['get', 'patch'])
    def preferences(self, request):
        """Get or update notification preferences."""
        prefs, _ = NotificationPreference.objects.get_or_create(user=request.user)

        if request.method == 'PATCH':
            serializer = NotificationPreferenceSerializer(
                prefs, data=request.data, partial=True
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)

        return Response(NotificationPreferenceSerializer(prefs).data)

    def destroy(self, request, *args, **kwargs):
        """Delete a notification."""
        notification = self.get_object()
        if notification.recipient != request.user:
            return Response(
                {'error': 'You can only delete your own notifications.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)
