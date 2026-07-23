from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from fleet.views import (
    MaintenanceRecordViewSet,
    MechanicViewSet,
    OfficeViewSet,
    VehicleViewSet,
)

router = DefaultRouter()
router.register("offices", OfficeViewSet)
router.register("vehicles", VehicleViewSet, basename="vehicle")
router.register("mechanics", MechanicViewSet)
router.register("maintenance-records", MaintenanceRecordViewSet)


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include(router.urls)),
]
