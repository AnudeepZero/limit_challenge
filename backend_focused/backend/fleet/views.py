from .filters import VehicleFilter
from rest_framework import viewsets

from .filters import VehicleFilter


from .models import MaintenanceRecord, Mechanic, Office, Vehicle
from .serializers import (
    MaintenanceRecordSerializer,
    MechanicSerializer,
    OfficeSerializer,
    VehicleDetailSerializer,
    VehicleSerializer,
)


class OfficeViewSet(viewsets.ModelViewSet):
    queryset = Office.objects.all().order_by("name")
    serializer_class = OfficeSerializer


class VehicleViewSet(viewsets.ModelViewSet):
    filterset_class = VehicleFilter

    def get_queryset(self):
        if self.action == "retrieve":
            return Vehicle.objects.select_related("office").prefetch_related(
                "maintenance_records__mechanic"
            )
        if self.action == "list":
            return Vehicle.objects.all().order_by("id").distinct()
        return Vehicle.objects.all().order_by("id")

    def get_serializer_class(self):
        if self.action == "retrieve":
            return VehicleDetailSerializer
        return VehicleSerializer


class MechanicViewSet(viewsets.ModelViewSet):
    queryset = Mechanic.objects.all().order_by("name")
    serializer_class = MechanicSerializer


class MaintenanceRecordViewSet(viewsets.ModelViewSet):
    queryset = MaintenanceRecord.objects.all()
    serializer_class = MaintenanceRecordSerializer
