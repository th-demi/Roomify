"""
Models for the Roomify API.
"""
from django.db import models
from core.utils import generate_unique_code


class Room(models.Model):
    """
    Represents a music room where users can join and listen to music together.
    """
    code = models.CharField(
        max_length=8, default=generate_unique_code, unique=True,
        help_text="Unique code to identify and join the room"
    )
    host = models.CharField(
        max_length=50, unique=True,
        help_text="Session ID of the room host"
    )
    guest_can_pause = models.BooleanField(
        default=False,
        help_text="Whether guests can pause/play music"
    )
    votes_to_skip = models.IntegerField(
        default=1,
        help_text="Number of votes required to skip a song"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When the room was created"
    )
    current_song = models.CharField(
        max_length=50, null=True, blank=True,
        help_text="ID of the currently playing song"
    )

    def __str__(self):
        return f"Room {self.code} (Host: {self.host[:8]}...)"

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Room'
        verbose_name_plural = 'Rooms'
