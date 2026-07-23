from datetime import date, timedelta
from decimal import Decimal

from rest_framework import status
from rest_framework.test import APITestCase

from .models import MaintenanceRecord, Mechanic, Office, Vehicle


def make_vehicle(office, vin, plate, active=True, make="Toyota", model="Camry", year=2020):
    return Vehicle.objects.create(
        vin=vin, license_plate=plate, make=make, model=model,
        year=year, office=office, active=active,
    )


class VehicleConstraintTests(APITestCase):
    def setUp(self):
        self.office = Office.objects.create(name="Main", city="Austin")

    def test_vin_must_be_globally_unique(self):
        make_vehicle(self.office, "1HGCM82633A004352", "PLATE-1")
        response = self.client.post(
            "/api/vehicles/",
            {
                "vin": "1HGCM82633A004352",
                "license_plate": "PLATE-2",
                "make": "Honda",
                "model": "Civic",
                "year": 2021,
                "office": self.office.id,
                "active": True,
            },
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("vin", response.data)

    def test_active_vehicles_cannot_share_license_plate(self):
        make_vehicle(self.office, "VIN0000000000001", "SHARED-1", active=True)
        response = self.client.post(
            "/api/vehicles/",
            {
                "vin": "VIN0000000000002",
                "license_plate": "SHARED-1",
                "make": "Honda",
                "model": "Civic",
                "year": 2021,
                "office": self.office.id,
                "active": True,
            },
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("license_plate", response.data)

    def test_inactive_vehicles_can_share_license_plate(self):
        make_vehicle(self.office, "VIN0000000000003", "SHARED-2", active=False)
        response = self.client.post(
            "/api/vehicles/",
            {
                "vin": "VIN0000000000004",
                "license_plate": "SHARED-2",
                "make": "Honda",
                "model": "Civic",
                "year": 2021,
                "office": self.office.id,
                "active": False,
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)


class OfficeSummaryTests(APITestCase):
    def setUp(self):
        self.office = Office.objects.create(name="Main", city="Austin")
        self.mechanic = Mechanic.objects.create(
            name="Jane Doe", certification_number="CERT-1")
        self.active_vehicle = make_vehicle(
            self.office, "VIN1000000000001", "P-1", active=True)
        self.inactive_vehicle = make_vehicle(
            self.office, "VIN1000000000002", "P-2", active=False)

        MaintenanceRecord.objects.create(
            vehicle=self.active_vehicle, mechanic=self.mechanic,
            maintenance_date=date.today() - timedelta(days=30),
            maintenance_type="Oil Change", cost=Decimal("100.00"),
        )
        MaintenanceRecord.objects.create(
            vehicle=self.inactive_vehicle, mechanic=self.mechanic,
            maintenance_date=date.today() - timedelta(days=800),
            maintenance_type="Oil Change", cost=Decimal("500.00"),
        )

    def test_summary_counts_and_aggregates_correctly(self):
        response = self.client.get("/api/offices/summary/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        summary = next(o for o in response.data if o["name"] == "Main")
        self.assertEqual(summary["active_vehicle_count"], 1)
        self.assertEqual(
            Decimal(summary["maintenance_cost_last_year"]), Decimal("100.00"))
        self.assertEqual(summary["last_maintenance"],
                         str(date.today() - timedelta(days=30)))

    def test_office_with_no_data_returns_zero_not_error(self):
        Office.objects.create(name="Empty", city="Nowhere")
        response = self.client.get("/api/offices/summary/")
        empty = next(o for o in response.data if o["name"] == "Empty")
        self.assertEqual(empty["active_vehicle_count"], 0)
        self.assertEqual(
            Decimal(empty["maintenance_cost_last_year"]), Decimal("0.00"))
        self.assertIsNone(empty["last_maintenance"])


class MechanicWorkloadTests(APITestCase):
    def test_only_current_year_records_are_counted(self):
        office = Office.objects.create(name="Main", city="Austin")
        mechanic = Mechanic.objects.create(
            name="Jane Doe", certification_number="CERT-1")
        vehicle = make_vehicle(office, "VIN2000000000001", "P-3")

        MaintenanceRecord.objects.create(
            vehicle=vehicle, mechanic=mechanic,
            maintenance_date=date.today(),
            maintenance_type="Oil Change", cost=Decimal("100.00"),
        )
        MaintenanceRecord.objects.create(
            vehicle=vehicle, mechanic=mechanic,
            maintenance_date=date(date.today().year - 1, 1, 1),
            maintenance_type="Oil Change", cost=Decimal("999.00"),
        )

        response = self.client.get("/api/mechanics/workload/")
        workload = next(m for m in response.data if m["name"] == "Jane Doe")
        self.assertEqual(workload["maintenance_record_count"], 1)
        self.assertEqual(
            Decimal(workload["total_maintenance_cost"]), Decimal("100.00"))


class VehiclesNeedingMaintenanceTests(APITestCase):
    def setUp(self):
        self.office = Office.objects.create(name="Main", city="Austin")
        self.mechanic = Mechanic.objects.create(
            name="Jane Doe", certification_number="CERT-1")

    def test_never_maintained_active_vehicle_is_included(self):
        vehicle = make_vehicle(
            self.office, "VIN3000000000001", "P-4", active=True)
        response = self.client.get("/api/vehicles/needing-maintenance/")
        vins = [v["vin"] for v in response.data["results"]]
        self.assertIn(vehicle.vin, vins)

    def test_overdue_vehicle_is_included(self):
        vehicle = make_vehicle(
            self.office, "VIN3000000000002", "P-5", active=True)
        MaintenanceRecord.objects.create(
            vehicle=vehicle, mechanic=self.mechanic,
            maintenance_date=date.today() - timedelta(days=400),
            maintenance_type="Oil Change", cost=Decimal("50.00"),
        )
        response = self.client.get("/api/vehicles/needing-maintenance/")
        vins = [v["vin"] for v in response.data["results"]]
        self.assertIn(vehicle.vin, vins)

    def test_recently_maintained_vehicle_is_excluded(self):
        vehicle = make_vehicle(
            self.office, "VIN3000000000003", "P-6", active=True)
        MaintenanceRecord.objects.create(
            vehicle=vehicle, mechanic=self.mechanic,
            maintenance_date=date.today() - timedelta(days=10),
            maintenance_type="Oil Change", cost=Decimal("50.00"),
        )
        response = self.client.get("/api/vehicles/needing-maintenance/")
        vins = [v["vin"] for v in response.data["results"]]
        self.assertNotIn(vehicle.vin, vins)

    def test_inactive_vehicle_is_excluded(self):
        vehicle = make_vehicle(
            self.office, "VIN3000000000004", "P-7", active=False)
        response = self.client.get("/api/vehicles/needing-maintenance/")
        vins = [v["vin"] for v in response.data["results"]]
        self.assertNotIn(vehicle.vin, vins)


class AssignVehicleTests(APITestCase):
    def setUp(self):
        self.office_a = Office.objects.create(name="A", city="Austin")
        self.office_b = Office.objects.create(name="B", city="Dallas")
        self.vehicle = make_vehicle(self.office_a, "VIN4000000000001", "P-8")

    def test_assign_moves_vehicle_to_new_office(self):
        response = self.client.post(
            f"/api/vehicles/{self.vehicle.id}/assign/", {"office": self.office_b.id}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.vehicle.refresh_from_db()
        self.assertEqual(self.vehicle.office_id, self.office_b.id)

    def test_assign_to_nonexistent_office_returns_400(self):
        response = self.client.post(
            f"/api/vehicles/{self.vehicle.id}/assign/", {"office": 999999}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class DuplicateVehicleCheckTests(APITestCase):
    def setUp(self):
        self.office = Office.objects.create(name="Main", city="Austin")
        self.vehicle = make_vehicle(
            self.office, "VIN5000000000001", "DUP-1", active=True)

    def test_no_conflicts(self):
        response = self.client.get(
            "/api/vehicles/duplicate-check/",
            {"vin": "UNUSEDVIN0000001", "license_plate": "UNUSED-1"},
        )
        self.assertEqual(response.data["conflicts"], [])

    def test_vin_conflict_only(self):
        response = self.client.get(
            "/api/vehicles/duplicate-check/",
            {"vin": self.vehicle.vin, "license_plate": "UNUSED-2"},
        )
        self.assertEqual(response.data["conflicts"], ["vin"])

    def test_excludes_given_vehicle_id(self):
        response = self.client.get(
            "/api/vehicles/duplicate-check/",
            {
                "vin": self.vehicle.vin,
                "license_plate": self.vehicle.license_plate,
                "exclude_vehicle_id": self.vehicle.id,
            },
        )
        self.assertEqual(response.data["conflicts"], [])


class DeleteProtectionTests(APITestCase):
    def test_deleting_office_with_vehicles_returns_409(self):
        office = Office.objects.create(name="Main", city="Austin")
        make_vehicle(office, "VIN6000000000001", "P-9")
        response = self.client.delete(f"/api/offices/{office.id}/")
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)

    def test_deleting_mechanic_with_records_returns_409(self):
        office = Office.objects.create(name="Main", city="Austin")
        mechanic = Mechanic.objects.create(
            name="Jane Doe", certification_number="CERT-1")
        vehicle = make_vehicle(office, "VIN6000000000002", "P-10")
        MaintenanceRecord.objects.create(
            vehicle=vehicle, mechanic=mechanic, maintenance_date=date.today(),
            maintenance_type="Oil Change", cost=Decimal("10.00"),
        )
        response = self.client.delete(f"/api/mechanics/{mechanic.id}/")
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)


class VehicleDetailQueryCountTests(APITestCase):
    def test_detail_endpoint_query_count_stays_constant(self):
        office = Office.objects.create(name="Main", city="Austin")
        vehicle = make_vehicle(office, "VIN7000000000001", "P-11")
        mechanics = [
            Mechanic.objects.create(
                name=f"Mechanic {i}", certification_number=f"CERT-{i}")
            for i in range(3)
        ]
        for i in range(15):
            MaintenanceRecord.objects.create(
                vehicle=vehicle, mechanic=mechanics[i % 3],
                maintenance_date=date.today() - timedelta(days=i),
                maintenance_type="Oil Change", cost=Decimal("10.00"),
            )

        with self.assertNumQueries(3):
            response = self.client.get(f"/api/vehicles/{vehicle.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["maintenance_records"]), 15)
