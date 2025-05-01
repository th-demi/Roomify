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
import secrets


class AuthURLView(APIView):
    """
    Generate a Spotify authorization URL for user login.
    """

    def get(self, request):
        # Log the raw redirect URI from settings
        print("\n=== Spotify Auth URL Generation ===")
        print(f"Raw SPOTIFY_REDIRECT_URI from settings: {settings.SPOTIFY_REDIRECT_URI}")
        
        # Properly format scopes with spaces
        scopes = 'user-read-playback-state user-modify-playback-state user-read-currently-playing'
        print(f"Scopes being used: {scopes}")
        
        # Generate a random state parameter for security
        state = secrets.token_urlsafe(16)
        request.session['spotify_auth_state'] = state
        print(f"Generated state parameter: {state}")
        
        # Remove trailing slash from redirect URI
        redirect_uri = settings.SPOTIFY_REDIRECT_URI.rstrip('/')
        print(f"Redirect URI after removing trailing slash: {redirect_uri}")
        
        # Create Spotify authorization URL with proper parameters
        auth_params = {
            'scope': scopes,
            'response_type': 'code',
            'redirect_uri': redirect_uri,
            'client_id': settings.SPOTIFY_CLIENT_ID,
            'state': state,
            'show_dialog': True
        }
        print("\nAuth URL Parameters:")
        for key, value in auth_params.items():
            print(f"{key}: {value}")
        
        url = Request(
            'GET',
            'https://accounts.spotify.com/authorize',
            params=auth_params
        ).prepare().url
        
        print(f"\nFinal Auth URL: {url}")
        print("=== End Auth URL Generation ===\n")
        
        return Response({'url': url}, status=status.HTTP_200_OK)


class SpotifyCallbackView(APIView):
    """
    Handle the callback from Spotify after user authorization.
    """

    def get(self, request):
        print("\n=== Spotify Callback Received ===")
        print("Request Details:")
        print(f"Session key: {request.session.session_key}")
        print(f"Request path: {request.path}")
        print(f"Request GET parameters: {dict(request.GET)}")
        print(f"Request headers: {dict(request.headers)}")

        # Verify state parameter
        state = request.GET.get('state')
        stored_state = request.session.get('spotify_auth_state')
        print(f"\nState verification:")
        print(f"Received state: {state}")
        print(f"Stored state: {stored_state}")
        
        if state is None or state != stored_state:
            print("❌ State mismatch or missing")
            return Response(
                {'error': 'state_mismatch'},
                status=status.HTTP_400_BAD_REQUEST
            )
        print("✅ State verification passed")

        # Clear the state from session
        request.session.pop('spotify_auth_state', None)

        # Ensure session exists
        if not request.session.exists(request.session.session_key):
            print("\nCreating new session")
            request.session.create()
            print(f"New session key: {request.session.session_key}")

        # Extract authorization code
        code = request.GET.get('code')
        if not code:
            print("❌ No authorization code received")
            return Response(
                {'error': 'No authorization code received'},
                status=status.HTTP_400_BAD_REQUEST
            )
        print(f"✅ Authorization code received: {code[:10]}...")

        # Remove trailing slash from redirect URI
        redirect_uri = settings.SPOTIFY_REDIRECT_URI.rstrip('/')
        print(f"\nUsing redirect URI: {redirect_uri}")

        # Exchange code for access token
        try:
            print("\nExchanging code for tokens...")
            token_data = {
                'grant_type': 'authorization_code',
                'code': code,
                'redirect_uri': redirect_uri,
                'client_id': settings.SPOTIFY_CLIENT_ID,
                'client_secret': settings.SPOTIFY_CLIENT_SECRET
            }
            print("Token exchange parameters:")
            for key, value in token_data.items():
                if key != 'client_secret':
                    print(f"{key}: {value}")
                else:
                    print(f"{key}: [REDACTED]")

            response = post(
                'https://accounts.spotify.com/api/token',
                data=token_data,
                headers={
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            ).json()

            print("\nToken exchange response:")
            if 'error' in response:
                print(f"❌ Error in token response: {response['error']}")
                return Response(
                    {'error': response['error']},
                    status=status.HTTP_400_BAD_REQUEST
                )
            print("✅ Token exchange successful")
            print(f"Access token received: {response['access_token'][:10]}...")
            print(f"Token type: {response['token_type']}")
            print(f"Expires in: {response['expires_in']} seconds")
            print(f"Refresh token received: {response['refresh_token'][:10]}...")

            # Save tokens to database
            print("\nSaving tokens to database...")
            update_or_create_user_tokens(
                request.session.session_key,
                response['access_token'],
                response['token_type'],
                response['expires_in'],
                response['refresh_token']
            )
            print("✅ Tokens saved successfully")

            # Redirect to frontend
            frontend_url = settings.CORS_ALLOWED_ORIGINS[0]
            room_code = request.session.get('room_code')
            redirect_url = f"{frontend_url}/room/{room_code}" if room_code else frontend_url
            print(f"\nRedirecting to: {redirect_url}")
            print("=== End Callback Processing ===\n")
            
            return redirect(redirect_url)

        except Exception as e:
            print(f"\n❌ Error during token exchange: {str(e)}")
            print("=== End Callback Processing with Error ===\n")
            return Response(
                {'error': 'Failed to exchange authorization code for tokens'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


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
