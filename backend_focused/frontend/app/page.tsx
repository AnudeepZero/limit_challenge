'use client';

import { Suspense } from 'react';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Stack,
  Typography,
} from '@mui/material';
import { useSearchParams } from 'next/navigation';
import { useVehicles } from '@/lib/vehicles';
import type { VehicleFilters } from '@/lib/types';
import VehicleFiltersBar from './vehicle-filters';

function buildFilters(searchParams: URLSearchParams): VehicleFilters {
  const filters: VehicleFilters = {};
  const office = searchParams.get('office');
  const active = searchParams.get('active');
  const make = searchParams.get('make');
  const model = searchParams.get('model');
  const maintenanceFrom = searchParams.get('maintenance_from');
  const maintenanceTo = searchParams.get('maintenance_to');
  const mechanicCert = searchParams.get('mechanic_certification_number');

  if (office) filters.office = Number(office);
  if (active) filters.active = active === 'true';
  if (make) filters.make = make;
  if (model) filters.model = model;
  if (maintenanceFrom) filters.maintenance_from = maintenanceFrom;
  if (maintenanceTo) filters.maintenance_to = maintenanceTo;
  if (mechanicCert) filters.mechanic_certification_number = mechanicCert;

  return filters;
}

function VehicleList() {
  const searchParams = useSearchParams();
  const filters = buildFilters(searchParams);
  const { data, isPending, isError, error } = useVehicles(filters);

  return (
    <>
      <VehicleFiltersBar />

      {isPending && (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      )}

      {isError && (
        <Alert severity="error">
          Failed to load vehicles: {error instanceof Error ? error.message : 'Unknown error'}
        </Alert>
      )}

      {data && data.results.length === 0 && (
        <Alert severity="info">No vehicles match your search.</Alert>
      )}

      {data && data.results.length > 0 && (
        <Stack spacing={2}>
          {data.results.map((vehicle) => (
            <Card key={vehicle.id} variant="outlined">
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </Typography>
                  <Chip
                    label={vehicle.active ? 'Active' : 'Inactive'}
                    color={vehicle.active ? 'success' : 'default'}
                    size="small"
                  />
                </Stack>
                <Typography color="text.secondary">VIN: {vehicle.vin}</Typography>
                <Typography color="text.secondary">Plate: {vehicle.license_plate}</Typography>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </>
  );
}

export default function HomePage() {
  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Fleet Vehicles
      </Typography>
      <Suspense
        fallback={
          <Box display="flex" justifyContent="center" py={6}>
            <CircularProgress />
          </Box>
        }
      >
        <VehicleList />
      </Suspense>
    </Container>
  );
}
