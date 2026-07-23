import django_filters

from .models import Vehicle


class VehicleFilter(django_filters.FilterSet):
    office = django_filters.NumberFilter(field_name="office")
    active = django_filters.BooleanFilter(field_name="active")
    make = django_filters.CharFilter(
        field_name="make", lookup_expr="icontains")
    model = django_filters.CharFilter(
        field_name="model", lookup_expr="icontains")
    maintenance_from = django_filters.DateFilter(
        field_name="maintenance_records__maintenance_date", lookup_expr="gte"
    )
    maintenance_to = django_filters.DateFilter(
        field_name="maintenance_records__maintenance_date", lookup_expr="lte"
    )
    mechanic_certification_number = django_filters.CharFilter(
        field_name="maintenance_records__mechanic__certification_number",
        lookup_expr="exact",
    )

    class Meta:
        model = Vehicle
        fields = [
            "office",
            "active",
            "make",
            "model",
            "maintenance_from",
            "maintenance_to",
            "mechanic_certification_number",
        ]
