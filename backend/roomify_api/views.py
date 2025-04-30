"""
Views for the Roomify API.
"""
from django.http import JsonResponse
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Room
from .serializers import RoomSerializer, CreateRoomSerializer, UpdateRoomSerializer


class RoomListView(generics.ListAPIView):
    """
    List all rooms.
    """
    queryset = Room.objects.all()
    serializer_class = RoomSerializer


class CreateRoomView(APIView):
    """
    Create a new room or update an existing one if the user is already a host.
    """
    serializer_class = CreateRoomSerializer

    def post(self, request):
        try:
            # Ensure session exists
            if not request.session.exists(request.session.session_key):
                request.session.create()
                request.session.save()
                print("Newly created session key in Create Room Page:",
                      request.session.session_key)

            # Validate and process the data
            serializer = self.serializer_class(data=request.data)
            if serializer.is_valid():
                guest_can_pause = serializer.validated_data['guest_can_pause']
                votes_to_skip = serializer.validated_data['votes_to_skip']
                host = request.session.session_key

                # Try to get an existing room or create a new one
                room, created = Room.objects.update_or_create(
                    host=host,
                    defaults={
                        'guest_can_pause': guest_can_pause,
                        'votes_to_skip': votes_to_skip
                    }
                )

                # Store room code in session
                request.session['room_code'] = room.code

                # Return the room data
                return Response(
                    RoomSerializer(room).data,
                    status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
                )

            print(f"Serializer errors: {serializer.errors}")
            return Response(
                {'error': 'Invalid data', 'details': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            print(f"Error in CreateRoomView: {str(e)}")
            return Response(
                {'error': 'Internal server error', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class GetRoomView(APIView):
    """
    Get details of a specific room by code.
    """
    lookup_url_kwarg = 'code'

    def get(self, request):
        code = request.GET.get(self.lookup_url_kwarg)
        if not code:
            return Response(
                {'error': 'Room code parameter not found in request'},
                status=status.HTTP_400_BAD_REQUEST
            )

        room = Room.objects.filter(code=code).first()
        if not room:
            return Response(
                {'error': 'Room not found with the provided code'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Get room data and add is_host field
        data = RoomSerializer(room).data
        print(f"Room host: {room.host}")
        print(
            f"Session key exists: {request.session.exists(request.session.session_key)}")
        print(f"Session key: {request.session.session_key}")
        print("Room code in session:", request.session.get('room_code'))
        data['is_host'] = request.session.session_key == room.host

        return Response(data, status=status.HTTP_200_OK)


class JoinRoomView(APIView):
    """
    Join an existing room by code.
    """
    lookup_url_kwarg = 'code'

    def post(self, request):
        if not request.session.exists(request.session.session_key):
            request.session.create()

        code = request.data.get(self.lookup_url_kwarg)
        if not code:
            return Response(
                {'error': 'Room code not provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        room = Room.objects.filter(code=code).first()
        if not room:
            return Response(
                {'error': 'Room not found with the provided code'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Store room code in session
        request.session['room_code'] = code
        return Response({'message': 'Room joined successfully'}, status=status.HTTP_200_OK)


class UserInRoomView(APIView):
    """
    Check if the current user is in a room.
    """

    def get(self, request):
        try:
            print("Request headers:", dict(request.headers))
            print("Session key:", request.session.session_key)
            print("Session exists:", request.session.exists(request.session.session_key))
            
            # Ensure session exists
            if not request.session.session_key:
                request.session.create()
                request.session.save()
                print("Created new session with key:", request.session.session_key)
            
            # Get session data
            room_code = request.session.get('room_code')
            session_key = request.session.session_key
            session_exists = request.session.exists(request.session.session_key)
            
            print(f"Room code: {room_code}")
            print(f"Session key: {session_key}")
            print(f"Session exists: {session_exists}")
            
            data = {
                'code': room_code,
                'session_key': session_key,
                'session_exists': session_exists
            }
            
            print("Response data:", data)
            
            response = Response(data, status=status.HTTP_200_OK)
            response["Access-Control-Allow-Origin"] = request.headers.get('Origin', '*')
            response["Access-Control-Allow-Credentials"] = "true"
            return response
            
        except Exception as e:
            print(f"Error in UserInRoomView: {str(e)}")
            import traceback
            print("Traceback:", traceback.format_exc())
            
            response = Response(
                {
                    'error': 'Internal server error',
                    'details': str(e),
                    'traceback': traceback.format_exc()
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            response["Access-Control-Allow-Origin"] = request.headers.get('Origin', '*')
            response["Access-Control-Allow-Credentials"] = "true"
            return response


class LeaveRoomView(APIView):
    """
    Leave the current room and delete it if the user is the host.
    """

    def post(self, request):
        if 'room_code' in request.session:
            # Remove room code from session
            code = request.session.pop('room_code')

            # If user is the host, delete the room
            host_id = request.session.session_key
            room = Room.objects.filter(host=host_id).first()
            if room:
                room.delete()

        return Response({'message': 'Successfully left the room'}, status=status.HTTP_200_OK)


class UpdateRoomView(APIView):
    """
    Update room settings if the user is the host.
    """
    serializer_class = UpdateRoomSerializer

    def patch(self, request):
        if not request.session.exists(request.session.session_key):
            request.session.create()

        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            code = serializer.validated_data.get('code')
            guest_can_pause = serializer.validated_data.get('guest_can_pause')
            votes_to_skip = serializer.validated_data.get('votes_to_skip')

            # Get the room
            room = Room.objects.filter(code=code).first()
            if not room:
                return Response(
                    {'error': 'Room not found with the provided code'},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Check if user is the host
            user_id = request.session.session_key
            if room.host != user_id:
                return Response(
                    {'error': 'You are not authorized to update this room'},
                    status=status.HTTP_403_FORBIDDEN
                )

            # Update room settings
            room.guest_can_pause = guest_can_pause
            room.votes_to_skip = votes_to_skip
            room.save(update_fields=['guest_can_pause', 'votes_to_skip'])

            return Response(RoomSerializer(room).data, status=status.HTTP_200_OK)

        return Response(
            {'error': 'Invalid data', 'details': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )
