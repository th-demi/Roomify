from django.urls import path
from .views import RoomView, RoomCreate

urlpatterns = [
    path('create/', RoomCreate.as_view()),
    path('view/', RoomView.as_view())
]