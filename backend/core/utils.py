"""
Utility functions for the Roomify application.
"""
import random
import string


def generate_unique_code(length=6):
    """
    Generate a random uppercase code of specified length.
    """
    return ''.join(random.choices(string.ascii_uppercase, k=length))
