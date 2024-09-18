from django.shortcuts import redirect
from .credentials import CLIENT_ID, CLIENT_SECRET, REDIRECT_URI
from rest_framework.views import APIView
from requests import Request, post
from rest_framework import status
from rest_framework.response import Response
from .util import create_or_update_spotify_user, is_spotify_user_authenticated, execute_spotify_api_request, play_song, pause_song, skip_song
from api.models import Room
from .models import Votes

class AuthURL(APIView):  # creates a URL which is used to redirect the user to Spotify for logging in and authorizing our app
    def get(self, request):
        scopes = 'user-read-playback-state user-modify-playback-state user-read-currently-playing'
        url = Request('GET', 'https://accounts.spotify.com/authorize', params={
            'scope': scopes,
            'response_type': 'code',
            'redirect_uri': REDIRECT_URI,
            'client_id': CLIENT_ID
        }).prepare().url
        return Response({'url': url}, status=status.HTTP_200_OK)

def spotify_callback(request): 
    code = request.GET.get('code')  # After user logs in, they are redirected to our app with an authorization code. It is extracted
    response = post('https://accounts.spotify.com/api/token', data={
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': REDIRECT_URI,
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET
    }).json()  # Sends a POST request to Spotify's API to exchange the authorization code for an access token and saved as dict

    # Extract relevant values from the response
    access_token = response.get('access_token')
    token_type = response.get('token_type')
    refresh_token = response.get('refresh_token')
    expires_in = response.get('expires_in')

    if not request.session.exists(request.session.session_key):
        request.session.create()

    # Saves token info to the model
    create_or_update_spotify_user(
        request.session.session_key, access_token, token_type, expires_in, refresh_token
    )
    return redirect('frontend:')

class IsAuthenticated(APIView):
    def get(self, request):
        # Check if the Spotify user is authenticated
        is_authenticated = is_spotify_user_authenticated(request.session.session_key)
        return Response({'status': is_authenticated}, status=status.HTTP_200_OK)

class CurrentSong(APIView):
    def get(self, request):
        room_code = self.request.session.get('room_code')
        room = Room.objects.filter(code = room_code)

        if room.exists():
            room = room.first()
        else:
            return Response({}, status.HTTP_400_BAD_REQUEST)
        
        host = room.host
        endpoint = "player/currently-playing"
        response = execute_spotify_api_request(host, endpoint)

        if 'Error' in response or 'item' not in response:
            return Response({}, status.HTTP_204_NO_CONTENT)
        
        item = response.get('item')
        duration = item.get('duration_ms')
        progress = response.get('progress_ms')
        album_cover = item.get('album').get('images')[0].get('url')
        is_playing = response.get('is_playing')
        song_id = item.get('id')

        artist_string = "" # Adds multiple artists into a common string seperated by ,

        for i, artist in enumerate(item.get('artists')):
            if i > 0:
                artist_string += ", " # , is added for all artists except the first one
            name = artist.get('name')
            artist_string += name

        total_votes = Votes.objects.filter(room=room, song_id=song_id).count()
        
        song = {
            'title': item.get('name'),
            'artist': artist_string,
            'duration': duration,
            'time': progress,
            'image_url': album_cover,
            'is_playing': is_playing,
            'total_votes': total_votes,
            'votes_required_to_skip' : room.votes_to_skip,
            'id': song_id
        }
        self.update_room_song(room,song_id)
        return Response(song, status.HTTP_200_OK)
    
    def update_room_song(self, room, song_id):
        if room.current_song != song_id:
            room.current_song = song_id
            room.save(update_fields=['current_song'])
            Votes.objects.filter(room=room).delete() # deletes all the rows from Votes model where "room" == the room that we pass
    
class PauseSong(APIView):
    def put(self, request):
        room_code = self.request.session.get('room_code')
        room = Room.objects.filter(code = room_code).first()
        if self.request.session.session_key == room.host or room.guest_can_pause:
            pause_song(room.host)
            return Response({}, status=status.HTTP_204_NO_CONTENT)
        return Response({}, status=status.HTTP_403_FORBIDDEN)
    
class PlaySong(APIView):
    def put(self, request):
        room_code = self.request.session.get('room_code')
        room = Room.objects.filter(code = room_code).first()
        if self.request.session.session_key == room.host or room.guest_can_pause:
            play_song(room.host)
            return Response({}, status=status.HTTP_204_NO_CONTENT)
        return Response({}, status=status.HTTP_403_FORBIDDEN)
    
class SkipSong(APIView):
    def post(self, request, format=None):
        room_code = request.session.get('room_code')
        room = Room.objects.filter(code=room_code).first()

        if not room:
            return Response({'error': 'Room not found'}, status=status.HTTP_404_NOT_FOUND)

        session_key = request.session.session_key
        current_song = room.current_song
        total_votes = Votes.objects.filter(room=room, song_id=current_song).count()
        votes_needed = room.votes_to_skip

        # Check if the user has already voted
        existing_vote = Votes.objects.filter(user=session_key, room=room, song_id=current_song).first()

        if session_key == room.host or total_votes + (0 if existing_vote else 1) >= votes_needed:
            # User is the host or the number of votes required is met or exceeded
            if not existing_vote:
                # Create a new vote for the user if it doesn't exist
                Votes.objects.create(user=session_key, room=room, song_id=current_song)
            Votes.objects.filter(room=room).delete()  # Clear all votes after skipping the song
            skip_song(room.host)
        elif existing_vote:
            # User has already voted, do nothing
            return Response({'error': 'You have already voted'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            # Create a new vote for the user if it doesn't exist
            Votes.objects.create(user=session_key, room=room, song_id=current_song)

        return Response({}, status=status.HTTP_204_NO_CONTENT)
