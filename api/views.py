from .models import Room
from .serializers import ViewRoomsSerializer, CreateRoomSerializer, UpdateRoomSerializer
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.http import JsonResponse

# Create your views here.
class ViewRoomsView(generics.ListAPIView):
    queryset = Room.objects.all()
    serializer_class = ViewRoomsSerializer

class CreateRoomView(APIView):
    serializer_class = CreateRoomSerializer  # Uses CreateRoomSerializer for serialization

    def post(self, request):
        if not self.request.session.session_key: # Check if there is an existing session key; if not, create a new session
            self.request.session.create()
        serializer = self.serializer_class(data=request.data) # Create an instance of CreateRoomSerializer with the data from the request
        if serializer.is_valid(): # Validate the data provided in the request
            guest_can_pause = serializer.validated_data.get('guest_can_pause') # Using validated data from the serializer
            votes_to_skip = serializer.validated_data.get('votes_to_skip')
            host = self.request.session.session_key
            queryset = Room.objects.filter(host=host) # Check if the host already has a room
            if queryset.exists(): # If the host already has a room, update the 1st existing room's details
                room = queryset.first()
                room.guest_can_pause = guest_can_pause
                room.votes_to_skip = votes_to_skip
                room.save(update_fields=['guest_can_pause', 'votes_to_skip', 'created_at'])
                return Response(ViewRoomsSerializer(room).data, status=status.HTTP_200_OK)
            else: # If the host does not have a room, create a new room
                room = Room(host=host, guest_can_pause=guest_can_pause, votes_to_skip=votes_to_skip)
                room.save()
                self.request.session['room_code'] = room.code
                return Response(ViewRoomsSerializer(room).data, status=status.HTTP_201_CREATED)
        return Response({'Bad Request': 'Invalid data...'}, status=status.HTTP_400_BAD_REQUEST)
    
class GetRoom(APIView):
    serializer_class = ViewRoomsSerializer
    lookup_url_kwarg = 'code'

    def get(self, request):
        code = request.GET.get(self.lookup_url_kwarg)
        if code is not None:
            room = Room.objects.filter(code=code).first()  # Returns a queryset of all the rooms thst matches the code. By using .first() it return the the first room instance
            if room is not None:  # Check if room exists
                data = ViewRoomsSerializer(room).data # Returns a serialized instance of room. by using .data we get a dictionary of it
                data['is_host'] = self.request.session.session_key == room.host # checks if the session key of the current request matches the host of the room, indicating whether the current user is the host of the room
                return Response(data, status=status.HTTP_200_OK)
            return Response({'Room not found': 'Invalid Room Code'}, status=status.HTTP_404_NOT_FOUND)
        return Response({'Bad request': 'Code parameter not found in request'}, status=status.HTTP_400_BAD_REQUEST)
    
class JoinRoom(APIView):
    lookup_url_kwarg = 'code'

    def post(self, request):
        if not self.request.session.exists(self.request.session.session_key):
            self.request.session.create()
        code = request.data.get(self.lookup_url_kwarg)
        if code is not None:
            room = Room.objects.filter(code=code).first()  # gets the first room instance that matches
            if room is not None:
                self.request.session['room_code'] = code # stores the room_code in the session
                return Response({'message':'Room Joined '}, status=status.HTTP_200_OK)
            return Response({'Bad Request': 'Invalid Room Code'}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'Bad Request': 'Did not find a room code'}, status=status.HTTP_400_BAD_REQUEST)

class UserInRoom(APIView):
    def get(self, request):
        if not self.request.session.exists(self.request.session.session_key):
            self.request.session.create()
        data = {'code' : self.request.session.get('room_code')}
        return JsonResponse(data, status=status.HTTP_200_OK)
    
class LeaveRoom(APIView):
    def post(self, request):
        if 'room_code' in self.request.session:
            code = self.request.session.pop('room_code')
            host_id = self.request.session.session_key
            room = Room.objects.filter(host=host_id).first()
            if room is not None:
                room.delete()
        return Response({'message':'Success'}, status=status.HTTP_200_OK)
    
class UpdateRoom(APIView):
    serializer_class = UpdateRoomSerializer
    def patch(self, request):
        if not request.session.session_key:
            request.session.create() 
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            guest_can_pause = serializer.validated_data.get('guest_can_pause')
            votes_to_skip = serializer.validated_data.get('votes_to_skip')
            code = serializer.validated_data.get('code')
            try:
                room = Room.objects.get(code=code)
            except Room.DoesNotExist:
                return Response({'Room not found': 'Invalid Room Code'}, status=status.HTTP_404_NOT_FOUND)
            user_id = request.session.session_key
            if room.host == user_id:
                room.guest_can_pause = guest_can_pause
                room.votes_to_skip = votes_to_skip
                room.save(update_fields=['guest_can_pause', 'votes_to_skip'])
                return Response(UpdateRoomSerializer(room).data, status=status.HTTP_200_OK)
            else:
                return Response({'Access Denied': 'You are not the Host'}, status=status.HTTP_403_FORBIDDEN)