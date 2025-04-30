"""
Models for the Spotify API integration.
"""
from django.db import models
from roomify_api.models import Room


class SpotifyToken(models.Model):
    """
    Stores Spotify authentication tokens for users.
    """
    user = models.CharField(
        max_length=50, unique=True,
        help_text="Session ID of the user"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When the token was created"
    )
    access_token = models.CharField(
        max_length=255,
        help_text="Spotify access token"
    )
    refresh_token = models.CharField(
        max_length=255,
        help_text="Spotify refresh token"
    )
    token_type = models.CharField(
        max_length=50,
        help_text="Type of token (usually 'Bearer')"
    )
    expires_in = models.DateTimeField(
        help_text="When the token expires"
    )

    def __str__(self):
        return f"Token for {self.user[:8]}..."

    class Meta:
        verbose_name = 'Spotify Token'
        verbose_name_plural = 'Spotify Tokens'


class Vote(models.Model):
    """
    Tracks votes to skip songs in a room.
    """
    user = models.CharField(
        max_length=50,
        help_text="Session ID of the user who voted"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When the vote was cast"
    )
    song_id = models.CharField(
        max_length=50,
        help_text="Spotify ID of the song being voted to skip"
    )
    room = models.ForeignKey(
        Room, on_delete=models.CASCADE,
        help_text="Room where the vote was cast"
    )

    class Meta:
        # Ensure a user can only vote once per song per room
        unique_together = ('user', 'room', 'song_id')
        verbose_name = 'Vote'
        verbose_name_plural = 'Votes'
