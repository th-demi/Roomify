"""
URL patterns for the Spotify API integration.
"""
from django.urls import path
from .views import (
    AuthURLView,
    SpotifyCallbackView,
    IsAuthenticatedView,
    CurrentSongView,
    PauseSongView,
    PlaySongView,
    SkipSongView
)

app_name = 'spotify_api'

urlpatterns = [
    path('get-auth-url/', AuthURLView.as_view(), name='get-auth-url'),
    path('redirect/', SpotifyCallbackView.as_view(), name='spotify-callback'),
    path('is-authenticated/', IsAuthenticatedView.as_view(),
         name='is-authenticated'),
    path('current-song/', CurrentSongView.as_view(), name='current-song'),
    path('pause/', PauseSongView.as_view(), name='pause'),
    path('play/', PlaySongView.as_view(), name='play'),
    path('skip/', SkipSongView.as_view(), name='skip'),
]
