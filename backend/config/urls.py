"""
URL configuration for Roomify project.
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework.decorators import api_view
from rest_framework.response import Response


@api_view(['GET'])
def health_check(request):
    return Response({"status": "healthy"})


@api_view(['GET'])
def root(request):
    return Response({
        "message": "Welcome to Roomify API",
        "endpoints": {
            "api": "/api/",
            "spotify": "/spotify/",
            "health": "/health/",
            "admin": "/admin/"
        }
    })


urlpatterns = [
    path('', root, name='root'),
    path('admin/', admin.site.urls),
    path('api/', include('roomify_api.urls')),
    path('spotify/', include('spotify_api.urls')),
    path('health/', health_check, name='health_check'),
]
