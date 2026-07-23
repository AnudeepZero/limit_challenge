from datetime import timedelta
from decimal import Decimal

from django.db.models import Count, Max, Q, Sum
from django.db.models.functions import Coalesce
from django.utils import timezone

from rest_framework import viewsets

from rest_framework.decorators import action
from rest_framework.response import Response

from .filters import VehicleFilter

from .models import MaintenanceRecord, Mechanic, Office, Vehicle
from .serializers import (
    MaintenanceRecordDetailSerializer,
    MaintenanceRecordSerializer,
    MechanicSerializer,
    OfficeSerializer,
    VehicleDetailSerializer,
    VehicleSerializer,
    VehicleAssignSerializer,
    OfficeSummarySerializer,
    MechanicWorkloadSerializer,
)


class OfficeViewSet(viewsets.ModelViewSet):
    queryset = Office.objects.all().order_by("name")
    serializer_class = OfficeSerializer

    @action(detail=False, methods=["get"])
    def summary(self, request):
        one_year_ago = timezone.now().date() - timedelta(days=365)
        offices = Office.objects.annotate(
            active_vehicle_count=Count(
                "vehicles", filter=Q(vehicles__active=True), distinct=True
            ),
            maintenance_cost_last_year=Coalesce(
                Sum(
                    "vehicles__maintenance_records__cost",
                    filter=Q(
                        vehicles__maintenance_records__maintenance_date__gte=one_year_ago
                    ),
                ),
                Decimal("0.00"),
            ),
            last_maintenance=Max(
                "vehicles__maintenance_records__maintenance_date"),
        ).order_by("name")
        serializer = OfficeSummarySerializer(offices, many=True)
        return Response(serializer.data)


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
        if self.action == "assign":
            return VehicleAssignSerializer
        return VehicleSerializer

    @action(detail=True, methods=["get"], url_path="maintenance-history")
    def maintenance_history(self, request, pk=None):
        vehicle = self.get_object()
        records = vehicle.maintenance_records.select_related("mechanic").all()
        page = self.paginate_queryset(records)
        serializer = MaintenanceRecordDetailSerializer(page, many=True)
        return self.get_paginated_response(serializer.data)

    @action(detail=True, methods=["post"])
    def assign(self, request, pk=None):
        vehicle = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        vehicle.office = serializer.validated_data["office"]
        vehicle.save(update_fields=["office"])
        return Response(VehicleSerializer(vehicle).data)


class MechanicViewSet(viewsets.ModelViewSet):
    queryset = Mechanic.objects.all().order_by("name")
    serializer_class = MechanicSerializer

    @action(detail=False, methods=["get"])
    def workload(self, request):
        current_year = timezone.now().year
        mechanics = Mechanic.objects.annotate(
            maintenance_record_count=Count(
                "maintenance_records",
                filter=Q(maintenance_records__maintenance_date__year=current_year),
            ),
            total_maintenance_cost=Coalesce(
                Sum(
                    "maintenance_records__cost",
                    filter=Q(
                        maintenance_records__maintenance_date__year=current_year),
                ),
                Decimal("0.00"),
            ),
        ).order_by("-maintenance_record_count", "-total_maintenance_cost")
        serializer = MechanicWorkloadSerializer(mechanics, many=True)
        return Response(serializer.data)


class MaintenanceRecordViewSet(viewsets.ModelViewSet):
    queryset = MaintenanceRecord.objects.all()
    serializer_class = MaintenanceRecordSerializer
