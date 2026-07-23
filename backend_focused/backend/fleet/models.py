
from django.db import models
from django.db.models import Q


class Office(models.Model):
    name = models.CharField(max_length=150)
    city = models.CharField(max_length=100)

    def __str__(self):
        return self.name


class Vehicle(models.Model):
    vin = models.CharField(max_length=17, unique=True)
    license_plate = models.CharField(max_length=20)
    make = models.CharField(max_length=100)
    model = models.CharField(max_length=100)
    year = models.PositiveIntegerField()
    office = models.ForeignKey(
        Office, on_delete=models.PROTECT, related_name="vehicles"
    )
    active = models.BooleanField(default=True)

    class Meta:
        indexes = [
            models.Index(fields=["make"]),
            models.Index(fields=["model"]),
            models.Index(fields=["active"]),
        ]

        constraints = [
            models.UniqueConstraint(
                fields=["license_plate"],
                condition=Q(active=True),
                name="unique_active_license_plate"
            )
        ]

    def __str__(self):
        return f"{self.year} { self.make} {self.model} ({self.vin})"


class Mechanic(models.Model):
    name = models.CharField(max_length=150)
    certification_number = models.CharField(max_length=50, unique=True)
    active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class MaintenanceRecord(models.Model):
    vehicle = models.ForeignKey(
        Vehicle, on_delete=models.CASCADE, related_name="maintenance_records"
    )
    mechanic = models.ForeignKey(
        Mechanic, on_delete=models.PROTECT, related_name="maintenance_records"
    )
    maintenance_date = models.DateField()
    maintenance_type = models.CharField(max_length=100)
    cost = models.DecimalField(max_digits=10, decimal_places=2)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-maintenance_date"]
        indexes = [
            models.Index(fields=["maintenance_date"]),
        ]

    def __str__(self):
        return f"{self.vehicle} - {self.maintenance_type} on {self.maintenance_date}"
