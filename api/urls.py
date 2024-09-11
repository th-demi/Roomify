from django.urls import path, include
from .views import ViewRoomsView, CreateRoomView, GetRoom, JoinRoom, UserInRoom, LeaveRoom, UpdateRoom

urlpatterns = [
    path('create', CreateRoomView.as_view()),
    path('view', ViewRoomsView.as_view()),
    path('get', GetRoom.as_view()),
    path('join', JoinRoom.as_view()),
    path('inroom', UserInRoom.as_view()),
    path('leave', LeaveRoom.as_view()),
    path('update', UpdateRoom.as_view())
]