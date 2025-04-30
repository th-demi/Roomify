"""
Views for Spotify API integration.
"""
from django.shortcuts import redirect
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from requests import Request, post
from .utils import (
    update_or_create_user_tokens,
    is_spotify_authenticated,
    execute_spotify_api_request,
    play_song,
    pause_song,
    skip_song
)
from .models import Vote
from roomify_api.models import Room


class AuthURLView(APIView):
    """
    Generate a Spotify authorization URL for user login.
    """

    def get(self, request):
        scopes = 'user-read-playback-state user-modify-playback-state user-read-currently-playing'

        # Remove trailing slash from redirect URI if present
        redirect_uri = settings.SPOTIFY_REDIRECT_URI.rstrip('/')

        # Create Spotify authorization URL
        url = Request(
            'GET',
            'https://accounts.spotify.com/authorize',
            params={
                'scope': scopes,
                'response_type': 'code',
                'redirect_uri': redirect_uri,
                'client_id': settings.SPOTIFY_CLIENT_ID
            }
        ).prepare().url
        print("Explicit Spotify Auth URL:", url)

        return Response({'url': url}, status=status.HTTP_200_OK)


class SpotifyCallbackView(APIView):
    """
    Handle the callback from Spotify after user authorization.
    """

    def get(self, request):
        print("Entered SpotifyCallbackView")
        print("Request session key before creating/checking:", request.session.session_key)
        print("Request headers:", request.headers)
        print("Request GET parameters:", request.GET)

        # Ensure session exists
        if not request.session.exists(request.session.session_key):
            print("Created new session:", request.session.session_key)
            request.session.create()
        else:
            print("Using existing session:", request.session.session_key)

        # Extract authorization code from request
        code = request.GET.get('code')
        print("Spotify auth code received:", code)

        if not code:
            print("No code received from Spotify")
            return Response(
                {'error': 'No authorization code received'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Remove trailing slash from redirect URI if present
        redirect_uri = settings.SPOTIFY_REDIRECT_URI.rstrip('/')

        # Exchange code for access token
        response = post(
            'https://accounts.spotify.com/api/token',
            data={
                'grant_type': 'authorization_code',
                'code': code,
                'redirect_uri': redirect_uri,
                'client_id': settings.SPOTIFY_CLIENT_ID,
                'client_secret': settings.SPOTIFY_CLIENT_SECRET
            }
        ).json()

        print("Token response:", response)

        if 'error' in response:
            print("Error in token response:", response['error'])
            return Response(
                {'error': response['error']},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Extract token information
        access_token = response.get('access_token')
        token_type = response.get('token_type')
        refresh_token = response.get('refresh_token')
        expires_in = response.get('expires_in')

        # Save tokens to database
        print("Saving Spotify tokens...")
        update_or_create_user_tokens(
            request.session.session_key,
            access_token,
            token_type,
            expires_in,
            refresh_token
        )

        # Redirect to frontend
        frontend_url = settings.CORS_ALLOWED_ORIGINS[0]
        room_code = request.session.get('room_code')
        if room_code:
            return redirect(f"{frontend_url}/room/{room_code}")
        return redirect(f"{frontend_url}")


class IsAuthenticatedView(APIView):
    """
    Check if the current user is authenticated with Spotify.
    """

    def get(self, request):
        is_authenticated = is_spotify_authenticated(
            request.session.session_key)
        return Response({'status': is_authenticated}, status=status.HTTP_200_OK)


class CurrentSongView(APIView):
    """
    Get the currently playing song from Spotify.
    """

    def get(self, request):
        # Get room code from session
        room_code = request.session.get('room_code')
        if not room_code:
            return Response(
                {'error': 'Not in a room'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Get room from database
        room = Room.objects.filter(code=room_code).first()
        if not room:
            return Response(
                {'error': 'Room not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Get currently playing song from Spotify
        host = room.host
        endpoint = "player/currently-playing"
        response = execute_spotify_api_request(host, endpoint)

        print("Current song response:", response)

        # Handle error or no song playing
        if 'error' in response or 'item' not in response:
            return Response({}, status=status.HTTP_204_NO_CONTENT)

        # Extract song information
        item = response.get('item')
        duration = item.get('duration_ms')
        progress = response.get('progress_ms')
        album_cover = item.get('album').get('images')[0].get('url')
        is_playing = response.get('is_playing')
        song_id = item.get('id')

        # Format artist names
        artist_string = ", ".join([artist.get('name')
                                  for artist in item.get('artists')])

        # Count votes for this song
        votes = Vote.objects.filter(room=room, song_id=song_id).count()

        # Create song object
        song = {
            'title': item.get('name'),
            'artist': artist_string,
            'duration': duration,
            'time': progress,
            'image_url': album_cover,
            'is_playing': is_playing,
            'votes_required_to_skip': room.votes_to_skip,
            'total_votes': votes,
            'id': song_id
        }

        # Update room's current song
        self.update_room_song(room, song_id)

        return Response(song, status=status.HTTP_200_OK)

    def update_room_song(self, room, song_id):
        """
        Update the current song in the room and clear votes if song changed.
        """
        if room.current_song != song_id:
            room.current_song = song_id
            room.save(update_fields=['current_song'])
            # Clear votes when song changes
            Vote.objects.filter(room=room).delete()


class PauseSongView(APIView):
    """
    Pause the currently playing song.
    """

    def put(self, request):
        # Get room from session
        room_code = request.session.get('room_code')
        room = Room.objects.filter(code=room_code).first()

        if not room:
            return Response(
                {'error': 'Room not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check if user has permission to pause
        if request.session.session_key == room.host or room.guest_can_pause:
            pause_song(room.host)
            return Response({}, status=status.HTTP_204_NO_CONTENT)

        return Response(
            {'error': 'You do not have permission to pause'},
            status=status.HTTP_403_FORBIDDEN
        )


class PlaySongView(APIView):
    """
    Resume playback of a paused song.
    """

    def put(self, request):
        # Get room from session
        room_code = request.session.get('room_code')
        room = Room.objects.filter(code=room_code).first()

        if not room:
            return Response(
                {'error': 'Room not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check if user has permission to play
        if request.session.session_key == room.host or room.guest_can_pause:
            play_song(room.host)
            return Response({}, status=status.HTTP_204_NO_CONTENT)

        return Response(
            {'error': 'You do not have permission to play'},
            status=status.HTTP_403_FORBIDDEN
        )


class SkipSongView(APIView):
    """
    Skip to the next song or vote to skip.
    """

    def post(self, request):
        # Get room from session
        room_code = request.session.get('room_code')
        room = Room.objects.filter(code=room_code).first()

        if not room:
            return Response(
                {'error': 'Room not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Get session key and current song
        session_key = request.session.session_key
        current_song = room.current_song

        # Check if user has already voted
        existing_vote = Vote.objects.filter(
            user=session_key,
            room=room,
            song_id=current_song
        ).exists()

        # Count total votes
        votes = Vote.objects.filter(room=room, song_id=current_song).count()
        votes_needed = room.votes_to_skip

        # Skip logic
        if session_key == room.host or votes + (0 if existing_vote else 1) >= votes_needed:
            # Skip the song if host or enough votes
            if not existing_vote:
                Vote.objects.create(
                    user=session_key,
                    room=room,
                    song_id=current_song
                )

            # Clear all votes
            Vote.objects.filter(room=room).delete()

            # Skip the song
            skip_song(room.host)
            return Response({}, status=status.HTTP_204_NO_CONTENT)

        elif existing_vote:
            # User already voted
            return Response(
                {'error': 'You have already voted to skip this song'},
                status=status.HTTP_400_BAD_REQUEST
            )

        else:
            # Add vote
            Vote.objects.create(
                user=session_key,
                room=room,
                song_id=current_song
            )

            return Response({}, status=status.HTTP_204_NO_CONTENT)
