from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import InternshipPlacement
from .serializers import PlacementSerializer


class PlacementViewSet(viewsets.ModelViewSet):
    """ViewSet for managing internship placements."""
    serializer_class = PlacementSerializer
    permission_classes = [IsAuthenticated]

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
        """Get the current user's active placement."""
        if request.user.role != 'student':
            return Response(
                {'error': 'This endpoint is only for students.'},
                status=status.HTTP_403_FORBIDDEN
            )

        placement = InternshipPlacement.objects.filter(
            student=request.user,
            status='active'
        ).select_related('student', 'workplace_supervisor', 'academic_supervisor').first()

        if not placement:
            return Response(
                {'error': 'No active placement found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = PlacementSerializer(placement)
        return Response(serializer.data)
