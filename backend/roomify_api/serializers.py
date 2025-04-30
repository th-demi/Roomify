"""
Serializers for the Roomify API.
"""
from rest_framework import serializers
from .models import Room


class RoomSerializer(serializers.ModelSerializer):
    """
    Serializer for the Room model with all fields.
    """
    class Meta:
        model = Room
        fields = ('id', 'code', 'host', 'guest_can_pause',
                  'votes_to_skip', 'created_at', 'current_song')
        read_only_fields = ('id', 'code', 'host', 'created_at')


class CreateRoomSerializer(serializers.ModelSerializer):
    """
    Serializer for creating a room with minimal required fields.
    """
    class Meta:
        model = Room
        fields = ('guest_can_pause', 'votes_to_skip')


class UpdateRoomSerializer(serializers.ModelSerializer):
    """
    Serializer for updating a room's settings.
    """
    code = serializers.CharField(validators=[])

    class Meta:
        model = Room
        fields = ('code', 'guest_can_pause', 'votes_to_skip')
