from setuptools import setup, find_packages

setup(
    name="roomify",
    version="0.1",
    packages=find_packages(),
    install_requires=[
        "Django>=4.2",
        "djangorestframework",
        "gunicorn",
        "psycopg2-binary",
        # Add any other dependencies from your requirements.txt
    ],
) 