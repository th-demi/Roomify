"""
Production settings for Roomify project.
"""
from .base import *

# Security settings
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# Update ALLOWED_HOSTS for production
ALLOWED_HOSTS = [
    'roomify-backend-uowa.onrender.com',
    'localhost',
    '127.0.0.1',
    'demi-roomify.vercel.app',
]

# CORS settings
CORS_ALLOWED_ORIGINS = [
    "https://demi-roomify.vercel.app",
    "http://localhost:3000",
    "https://roomify-backend-uowa.onrender.com",
]
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]
CORS_ORIGIN_ALLOW_ALL = True  # Temporarily allow all origins for testing

# REST Framework settings
REST_FRAMEWORK = {
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
    ],
    'EXCEPTION_HANDLER': 'rest_framework.views.exception_handler',
}
