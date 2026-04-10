from django.urls import path
from .views import MeView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

urlpatterns = [
    path('me/', MeView.as_view(), name='user-me'),
]
class MeView(APIView):
    permission_classes = [IsAuthenticated] # Ensures only logged-in users enter

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

