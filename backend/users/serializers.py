from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model

User = get_user_model()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom JWT serializer that uses student_number for authentication."""
    username_field = 'student_number'

    def validate(self, attrs):
        # Use student_number as the username field
        credentials = {
            'student_number': attrs.get('student_number'),
            'password': attrs.get('password')
        }

        user = User.objects.filter(student_number=credentials['student_number']).first()

        if user and user.check_password(credentials['password']):
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled.')

            refresh = self.get_token(user)
            data = {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
            return data

        raise serializers.ValidationError('Invalid student number or password.')


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user details."""

    class Meta:
        model = User
        fields = [
            'id', 'student_number', 'email', 'full_name', 'role',
            'phone', 'organization', 'is_active'
        ]
        read_only_fields = ['id', 'is_active']


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['student_number', 'full_name', 'email', 'password', 'password_confirm']

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({'password_confirm': 'Passwords do not match.'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')

        # Use student_number as username as well
        user = User(
            username=validated_data['student_number'],
            **validated_data
        )
        user.set_password(password)
        user.save()
        return user
