from django.utils import timezone
from rest_framework import serializers

from .models import MaintenanceRecord, Mechanic, Office, Vehicle


class OfficeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Office
        fields = ["id", "name", "city"]


class VehicleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicle
        fields = ["id", "vin", "license_plate", "make",
                  "model", "year", "office", "active"]

    def validate_year(self, value):
        current_year = timezone.now().year
        if value < 1900 or value > current_year + 1:
            raise serializers.ValidationError(
                f"Year must be between 1900 and {current_year + 1}."
            )
        return value

    def validate(self, attrs):
        # The DB constraint (license plate unique among *active* vehicles)
        # is conditional, so DRF can't auto-validate it. Check here for a
        # clean 400 instead of a raw IntegrityError -> 500.
        active = attrs.get("active", getattr(self.instance, "active", True))
        license_plate = attrs.get(
            "license_plate", getattr(self.instance, "license_plate", None)
        )
        if active and license_plate:
            conflict = Vehicle.objects.filter(
                license_plate=license_plate, active=True)
            if self.instance:
                conflict = conflict.exclude(pk=self.instance.pk)
            if conflict.exists():
                raise serializers.ValidationError(
                    {"license_plate": "Another active vehicle already uses this license plate."}
                )
        return attrs


class MechanicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Mechanic
        fields = ["id", "name", "certification_number", "active"]


class MaintenanceRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = MaintenanceRecord
        fields = ["id", "vehicle", "mechanic", "maintenance_date",
                  "maintenance_type", "cost", "notes"]

    def validate_cost(self, value):
        if value < 0:
            raise serializers.ValidationError("Cost cannot be negative.")
        return value


class MaintenanceRecordDetailSerializer(serializers.ModelSerializer):
    mechanic = MechanicSerializer(read_only=True)

    class Meta:
        model = MaintenanceRecord
        fields = ["id", "mechanic", "maintenance_date",
                  "maintenance_type", "cost", "notes"]


class VehicleDetailSerializer(serializers.ModelSerializer):
    office = OfficeSerializer(read_only=True)
    maintenance_records = MaintenanceRecordDetailSerializer(
        many=True, read_only=True)

    class Meta:
        model = Vehicle
        fields = [
            "id", "vin", "license_plate", "make", "model", "year",
            "office", "active", "maintenance_records",
        ]


class VehicleAssignSerializer(serializers.Serializer):
    office = serializers.PrimaryKeyRelatedField(queryset=Office.objects.all())


class OfficeSummarySerializer(serializers.ModelSerializer):
    active_vehicle_count = serializers.IntegerField(read_only=True)
    maintenance_cost_last_year = serializers.DecimalField(
        max_digits=12, decimal_places=2, read_only=True
    )
    last_maintenance = serializers.DateField(read_only=True)

    class Meta:
        model = Office
        fields = [
            "name",
            "city",
            "active_vehicle_count",
            "maintenance_cost_last_year",
            "last_maintenance",
        ]


class MechanicWorkloadSerializer(serializers.ModelSerializer):
    maintenance_record_count = serializers.IntegerField(read_only=True)
    total_maintenance_cost = serializers.DecimalField(
        max_digits=12, decimal_places=2, read_only=True
    )

    class Meta:
        model = Mechanic
        fields = ["name", "maintenance_record_count", "total_maintenance_cost"]


class VehicleNeedingMaintenanceSerializer(serializers.ModelSerializer):
    last_maintenance_date = serializers.DateField(read_only=True)

    class Meta:
        model = Vehicle
        fields = [
            "id",
            "vin",
            "license_plate",
            "make",
            "model",
            "year",
            "office",
            "last_maintenance_date",
        ]


class DuplicateVehicleCheckSerializer(serializers.Serializer):
    vin = serializers.CharField()
    license_plate = serializers.CharField()
    exclude_vehicle_id = serializers.IntegerField(required=False)
