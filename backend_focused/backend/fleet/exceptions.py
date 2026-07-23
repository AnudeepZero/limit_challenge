from django.db.models.deletion import ProtectedError
from django.db.utils import IntegrityError
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler


def custom_exception_handler(exc, context):
    response = drf_exception_handler(exc, context)
    if response is not None:
        return response

    if isinstance(exc, ProtectedError):
        return Response(
            {"detail": "Cannot delete this record because other records depend on it."},
            status=status.HTTP_409_CONFLICT,
        )

    if isinstance(exc, IntegrityError):
        return Response(
            {"detail": "This operation conflicts with existing data."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    return None
