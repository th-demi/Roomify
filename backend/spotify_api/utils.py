"""
Utility functions for Spotify API integration.
"""
import os
from datetime import timedelta
from django.utils import timezone
from django.conf import settings
from requests import post, put, get
from .models import SpotifyToken

BASE_URL = "https://api.spotify.com/v1/me/"


def get_user_tokens(session_id):
    """
    Get Spotify tokens for a user by session ID.
    """
    return SpotifyToken.objects.filter(user=session_id).first()


def update_or_create_user_tokens(
    session_id, access_token, token_type, expires_in, refresh_token
):
    """
    Update existing tokens or create new ones for a user.
    """
    print(f"Inside update_or_create_user_tokens: session_id={session_id}")
    tokens = get_user_tokens(session_id)
    expires_in = timezone.now() + timedelta(seconds=expires_in)

    if tokens:
        # Update existing tokens
        print("Existing token found, updating...")
        tokens.access_token = access_token
        tokens.refresh_token = refresh_token
        tokens.expires_in = expires_in
        tokens.token_type = token_type
        tokens.save(update_fields=[
            'access_token', 'refresh_token', 'expires_in', 'token_type'
        ])
    else:
        # Create new tokens
        print("Creating new token entry...")
        tokens = SpotifyToken(
            user=session_id,
            access_token=access_token,
            refresh_token=refresh_token,
            token_type=token_type,
            expires_in=expires_in
        )
        tokens.save()
    print("Token saved successfully for session:", session_id)


def is_spotify_authenticated(session_id):
    """
    Check if a user is authenticated with Spotify.
    """
    print(f"Checking Spotify authentication for session: {session_id}")
    tokens = get_user_tokens(session_id)
    if not tokens:
        print("No tokens found for session:", session_id)
        return False

    # Check if token is expired and refresh if needed
    if tokens.expires_in <= timezone.now():
        print("Token expired, refreshing...")
        refresh_spotify_token(session_id)
    else:
        print("Token valid:", tokens.access_token)

    return True


def refresh_spotify_token(session_id):
    """
    Refresh an expired Spotify access token.
    """
    tokens = get_user_tokens(session_id)
    if not tokens:
        return False

    refresh_token = tokens.refresh_token

    response = post(
        'https://accounts.spotify.com/api/token',
        data={
            'grant_type': 'refresh_token',
            'refresh_token': refresh_token,
            'client_id': settings.SPOTIFY_CLIENT_ID,
            'client_secret': settings.SPOTIFY_CLIENT_SECRET
        }
    ).json()

    # Extract new token information
    access_token = response.get('access_token')
    token_type = response.get('token_type')
    expires_in = response.get('expires_in')

    # Update tokens in database
    update_or_create_user_tokens(
        session_id, access_token, token_type, expires_in, refresh_token
    )


def execute_spotify_api_request(session_id, endpoint, post_=False, put_=False):
    """
    Execute a request to the Spotify API.
    """
    tokens = get_user_tokens(session_id)
    if not tokens:
        return {'error': 'User not authenticated with Spotify'}

    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {tokens.access_token}'
    }

    url = BASE_URL + endpoint

    # Execute the appropriate request type
    if post_:
        response = post(url, headers=headers)
    elif put_:
        response = put(url, headers=headers)
    else:
        response = get(url, headers=headers)

    try:
        return response.json()
    except ValueError:
        return {'error': 'Issue with request', 'status': response.status_code}


def play_song(session_id):
    """
    Resume playback on the user's Spotify account.
    """
    return execute_spotify_api_request(session_id, "player/play", put_=True)


def pause_song(session_id):
    """
    Pause playback on the user's Spotify account.
    """
    return execute_spotify_api_request(session_id, "player/pause", put_=True)


def skip_song(session_id):
    """
    Skip to the next song on the user's Spotify account.
    """
    return execute_spotify_api_request(session_id, "player/next", post_=True)
