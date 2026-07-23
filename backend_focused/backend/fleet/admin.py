from django.contrib import admin

from .models import MaintenanceRecord, Mechanic, Office, Vehicle


@admin.register(Office)
class OfficeAdmin(admin.ModelAdmin):
    list_display = ("name", "city")
    search_fields = ("name", "city")


@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = ("vin", "license_plate", "make",
                    "model", "year", "office", "active")
    list_filter = ("active", "office", "make")
    search_fields = ("vin", "license_plate", "make", "model")


@admin.register(Mechanic)
class MechanicAdmin(admin.ModelAdmin):
    list_display = ("name", "certification_number", "active")
    list_filter = ("active",)
    search_fields = ("name", "certification_number")


@admin.register(MaintenanceRecord)
class MaintenanceRecordAdmin(admin.ModelAdmin):
    list_display = ("vehicle", "mechanic", "maintenance_date",
                    "maintenance_type", "cost")
    list_filter = ("maintenance_type",)
    search_fields = ("vehicle__vin", "vehicle__license_plate",
                     "mechanic__name")
    autocomplete_fields = ("vehicle", "mechanic")
