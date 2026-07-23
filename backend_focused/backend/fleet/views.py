from rest_framework import viewsets

from .models import MaintenanceRecord, Mechanic, Office, Vehicle
from .serializers import (
    MaintenanceRecordSerializer,
    MechanicSerializer,
    OfficeSerializer,
    VehicleSerializer,
)


class OfficeViewSet(viewsets.ModelViewSet):
    queryset = Office.objects.all().order_by("name")
    serializer_class = OfficeSerializer


class VehicleViewSet(viewsets.ModelViewSet):
    queryset = Vehicle.objects.all().order_by("id")
    serializer_class = VehicleSerializer


class MechanicViewSet(viewsets.ModelViewSet):
    queryset = Mechanic.objects.all().order_by("name")
    serializer_class = MechanicSerializer


class MaintenanceRecordViewSet(viewsets.ModelViewSet):
    queryset = MaintenanceRecord.objects.all()
    serializer_class = MaintenanceRecordSerializer
