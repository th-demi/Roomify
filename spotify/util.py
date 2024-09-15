from .models import UserToken
from django.utils import timezone
from datetime import timedelta
from requests import post, put, get
from .credentials import CLIENT_ID, CLIENT_SECRET

BASE_URL = "https://api.spotify.com/v1/me/"

def get_user(session_id):
    return UserToken.objects.filter(user=session_id).first() # Returns the first object of the queryset containing all the user field matching the session_id

def create_or_update_spotify_user(session_id, access_token, token_type, expires_in, refresh_token):
    expires_in = timezone.now() + timedelta(seconds=expires_in)
    UserToken.objects.update_or_create(
        user=session_id,
        defaults={
            'access_token': access_token,
            'refresh_token': refresh_token,
            'expires_in': expires_in,
            'token_type': token_type
        }
    )

def is_spotify_user_authenticated(session_id):
    user = get_user(session_id)
    if user:
        expiry = user.expires_in
        if expiry <= timezone.now():
            refresh_access_token(session_id)
        return True
    return False


def refresh_access_token(session_id):
    refresh_token = get_user(session_id).refresh_token
    response = post(
        'https://accounts.spotify.com/api/token', 
        data={
            'grant_type': 'refresh_token', 
            'refresh_token': refresh_token, 
            'client_id': CLIENT_ID, 
            'client_secret': CLIENT_SECRET
        }
    ).json()

    access_token = response.get('access_token')
    token_type = response.get('token_type')
    expires_in = response.get('expires_in')

    create_or_update_spotify_user(session_id, access_token, token_type, expires_in, refresh_token)

def execute_spotify_api_request(session_id, endpoint, post_ = False, put_ = False):
    user = get_user(session_id)
    header = {'Content-Type' : 'application/json', 'Authorization' : 'Bearer ' + user.access_token}

    if post_:
        post(BASE_URL + endpoint, headers=header)
    if put_:
        put(BASE_URL + endpoint, headers=header)

    response = get(BASE_URL + endpoint, {}, headers=header)
    try:
        return response.json()
    except:
        return{'Error' : 'Issue with request'}
    
def pause_song(session_id):
    print(is_spotify_user_authenticated(session_id))
    response = execute_spotify_api_request(session_id, "player/pause", put_=True)
    print("Pause response:", response)
    return response

def play_song(session_id):
    return execute_spotify_api_request(session_id, "player/play", put_=True)

def skip_song(session_id):
    return execute_spotify_api_request(session_id, "player/next", post_=True)