from django.db import models
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.exceptions import PermissionDenied

from .models import InternshipPlacement, PlacementDocument
from .serializers import (
    PlacementSerializer, PlacementDocumentSerializer,
    PlacementDocumentCreateSerializer, StudentPlacementCreateSerializer
)


class PlacementViewSet(viewsets.ModelViewSet):
    """ViewSet for managing internship placements."""
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        # Students use a simplified serializer for creating placements
        if self.action == 'create' and self.request.user.role == 'student':
            return StudentPlacementCreateSerializer
        return PlacementSerializer

    def get_queryset(self):
        user = self.request.user

        if user.role == 'student':
            return InternshipPlacement.objects.filter(
                student=user
            ).select_related('student', 'workplace_supervisor', 'academic_supervisor')

        elif user.role == 'workplace_supervisor':
            return InternshipPlacement.objects.filter(
                workplace_supervisor=user
            ).select_related('student', 'workplace_supervisor', 'academic_supervisor')

        elif user.role == 'academic_supervisor':
            return InternshipPlacement.objects.filter(
                academic_supervisor=user
            ).select_related('student', 'workplace_supervisor', 'academic_supervisor')

        elif user.role == 'admin':
            return InternshipPlacement.objects.all().select_related(
                'student', 'workplace_supervisor', 'academic_supervisor'
            )

        return InternshipPlacement.objects.none()

    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get the current user's active or pending placement."""
        if request.user.role != 'student':
            return Response(
                {'error': 'This endpoint is only for students.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Return active placement first, then pending (most recent)
        placement = InternshipPlacement.objects.filter(
            student=request.user,
            status__in=['active', 'pending']
        ).select_related('student', 'workplace_supervisor', 'academic_supervisor').order_by(
            # Prioritize active over pending
            models.Case(
                models.When(status='active', then=0),
                models.When(status='pending', then=1),
                default=2,
            ),
            '-created_at'
        ).first()

        if not placement:
            return Response(
                {'error': 'No active placement found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = PlacementSerializer(placement, context={'request': request})
        return Response(serializer.data)


class PlacementDocumentViewSet(viewsets.ModelViewSet):
    """ViewSet for managing placement documents."""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_serializer_class(self):
        if self.action in ['create']:
            return PlacementDocumentCreateSerializer
        return PlacementDocumentSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = PlacementDocument.objects.all()

        # Filter by placement if specified
        placement_id = self.request.query_params.get('placement')
        if placement_id:
            queryset = queryset.filter(placement_id=placement_id)

        # Role-based filtering
        if user.role == 'student':
            queryset = queryset.filter(placement__student=user)
        elif user.role == 'workplace_supervisor':
            queryset = queryset.filter(placement__workplace_supervisor=user)
        elif user.role == 'academic_supervisor':
            queryset = queryset.filter(placement__academic_supervisor=user)

        return queryset.select_related('placement', 'uploaded_by')

    def perform_create(self, serializer):
        placement = serializer.validated_data.get('placement')
        user = self.request.user

        # Students can only upload to their own placements
        if user.role == 'student' and placement.student != user:
            raise PermissionDenied("You can only upload documents to your own placement.")

        serializer.save(uploaded_by=user)

    def perform_destroy(self, instance):
        user = self.request.user

        # Only the uploader or admin can delete
        if user.role != 'admin' and instance.uploaded_by != user:
            raise PermissionDenied("You can only delete your own documents.")

        # Delete the actual file
        if instance.file:
            instance.file.delete(save=False)
        instance.delete()
