import random
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction
from faker import Faker

from fleet.models import MaintenanceRecord, Mechanic, Office, Vehicle

MAINTENANCE_TYPES = [
    "Oil Change",
    "Tire Rotation",
    "Brake Inspection",
    "Battery Replacement",
    "Engine Diagnostic",
    "Transmission Service",
    "Air Filter Replacement",
    "Coolant Flush",
    "Wheel Alignment",
    "General Inspection",
]

MAKES_MODELS = [
    ("Toyota", "Camry"),
    ("Toyota", "Corolla"),
    ("Ford", "F-150"),
    ("Ford", "Transit"),
    ("Chevrolet", "Silverado"),
    ("Honda", "Civic"),
    ("Nissan", "Altima"),
    ("Ram", "1500"),
    ("Jeep", "Cherokee"),
    ("Hyundai", "Elantra"),
]

VIN_CHARS = "ABCDEFGHJKLMNPRSTUVWXYZ0123456789"  # excludes I, O, Q like real VINs
PLATE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"


def unique_code(chars, length, used):
    while True:
        code = "".join(random.choices(chars, k=length))
        if code not in used:
            used.add(code)
            return code


class Command(BaseCommand):
    help = "Seed the database with dummy fleet data for manual testing."

    def add_arguments(self, parser):
        parser.add_argument("--offices", type=int, default=5)
        parser.add_argument("--vehicles", type=int, default=150)
        parser.add_argument("--mechanics", type=int, default=20)
        parser.add_argument("--records", type=int, default=600)
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Delete existing fleet data before seeding.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        fake = Faker()

        if options["clear"]:
            MaintenanceRecord.objects.all().delete()
            Vehicle.objects.all().delete()
            Mechanic.objects.all().delete()
            Office.objects.all().delete()
            self.stdout.write("Cleared existing fleet data.")

        offices = self._create_offices(fake, options["offices"])
        mechanics = self._create_mechanics(options["mechanics"])
        vehicles = self._create_vehicles(options["vehicles"], offices)
        self._create_maintenance_records(
            fake, options["records"], vehicles, mechanics)

        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded {len(offices)} offices, {len(mechanics)} mechanics, "
                f"{len(vehicles)} vehicles, {options['records']} maintenance records."
            )
        )

    def _create_offices(self, fake, count):
        offices = [
            Office(name=f"{fake.city()} Office", city=fake.city()) for _ in range(count)
        ]
        return Office.objects.bulk_create(offices)

    def _create_mechanics(self, count):
        mechanics = [
            Mechanic(
                name=Faker().name(),
                certification_number=f"CERT-{i:06d}",
                active=random.random() > 0.1,
            )
            for i in range(count)
        ]
        return Mechanic.objects.bulk_create(mechanics)

    def _create_vehicles(self, count, offices):
        used_vins = set()
        used_plates = set()
        vehicles = []
        for _ in range(count):
            make, model = random.choice(MAKES_MODELS)
            vehicles.append(
                Vehicle(
                    vin=unique_code(VIN_CHARS, 17, used_vins),
                    license_plate=unique_code(PLATE_CHARS, 7, used_plates),
                    make=make,
                    model=model,
                    year=random.randint(2005, 2026),
                    office=random.choice(offices),
                    active=random.random() > 0.15,
                )
            )
        return Vehicle.objects.bulk_create(vehicles)

    def _create_maintenance_records(self, fake, count, vehicles, mechanics):
        # Reserve ~10% of vehicles to never receive maintenance, so the
        # "vehicles needing maintenance" endpoint has real data to return.
        never_maintained_cutoff = max(1, len(vehicles) // 10)
        eligible_vehicles = vehicles[never_maintained_cutoff:]

        records = []
        for _ in range(count):
            records.append(
                MaintenanceRecord(
                    vehicle=random.choice(eligible_vehicles),
                    mechanic=random.choice(mechanics),
                    maintenance_date=fake.date_between(
                        start_date="-3y", end_date="today"),
                    maintenance_type=random.choice(MAINTENANCE_TYPES),
                    cost=Decimal(random.randrange(5000, 200000)) / 100,
                    notes=fake.sentence() if random.random() > 0.4 else "",
                )
            )
        MaintenanceRecord.objects.bulk_create(records)
