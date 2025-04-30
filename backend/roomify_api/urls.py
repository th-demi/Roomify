"""
URL patterns for the Roomify API.
"""
from django.urls import path
from .views import (
    RoomListView,
    CreateRoomView,
    GetRoomView,
    JoinRoomView,
    UserInRoomView,
    LeaveRoomView,
    UpdateRoomView
)

app_name = 'roomify_api'

urlpatterns = [
    path('rooms/', RoomListView.as_view(), name='room-list'),
    path('create/', CreateRoomView.as_view(), name='create-room'),
    path('get/', GetRoomView.as_view(), name='get-room'),
    path('join/', JoinRoomView.as_view(), name='join-room'),
    path('inroom/', UserInRoomView.as_view(), name='user-in-room'),
    path('leave/', LeaveRoomView.as_view(), name='leave-room'),
    path('update/', UpdateRoomView.as_view(), name='update-room'),
]
