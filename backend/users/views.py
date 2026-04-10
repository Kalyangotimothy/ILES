from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model

from .serializers import (
    CustomTokenObtainPairSerializer,
    RegisterSerializer,
    UserSerializer
)

User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom JWT login view using student_number."""
    serializer_class = CustomTokenObtainPairSerializer


class RegisterView(generics.CreateAPIView):
    """View for user registration."""
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {
                'message': 'Registration successful',
                'user': UserSerializer(user).data
            },
            status=status.HTTP_201_CREATED
        )


class MeView(APIView):
    """View to get current authenticated user."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class UsersListView(APIView):
    """View to list users, optionally filtered by role. Admin only."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'admin':
            return Response(
                {'error': 'Only admins can access this endpoint.'},
                status=status.HTTP_403_FORBIDDEN
            )

        role = request.query_params.get('role')
        queryset = User.objects.filter(is_active=True)

        if role:
            queryset = queryset.filter(role=role)

        serializer = UserSerializer(queryset, many=True)
        return Response(serializer.data)
