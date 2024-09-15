from django.db import models
from api.models import Room

class UserToken(models.Model):
    user = models.CharField(max_length=50, unique=True)
    created_at = models.DateField(auto_now_add=True)
    access_token = models.CharField(max_length=150)
    refresh_token = models.CharField(max_length=150)
    token_type = models.CharField(max_length=50)
    expires_in = models.DateTimeField()

class Votes(models.Model):
    user = models.CharField(max_length=50, unique=True)
    created_at = models.DateField(auto_now_add=True)
    song_id = models.CharField(max_length=50)
    room = models.ForeignKey(Room, on_delete=models.CASCADE)