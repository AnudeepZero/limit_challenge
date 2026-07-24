'use client';

import { Suspense, useState } from 'react';
import {
  Alert,
  Box,
  Card,
  CardContent,
  CardActionArea,
  Chip,
  CircularProgress,
  Container,
  Pagination,
  Stack,
  Typography,
  Button,
} from '@mui/material';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useVehicles } from '@/lib/vehicles';
import type { VehicleFilters } from '@/lib/types';
import VehicleFiltersBar from './vehicle-filters';
import Link from 'next/link';
import VehicleFormDialog from '@/app/vehicle-form-dialog';

// Must match REST_FRAMEWORK['PAGE_SIZE'] in backend/server/settings.py
const PAGE_SIZE = 10;

function buildFilters(searchParams: URLSearchParams): VehicleFilters {
  const filters: VehicleFilters = {};
  const office = searchParams.get('office');
  const active = searchParams.get('active');
  const make = searchParams.get('make');
  const model = searchParams.get('model');
  const maintenanceFrom = searchParams.get('maintenance_from');
  const maintenanceTo = searchParams.get('maintenance_to');
  const mechanicCert = searchParams.get('mechanic_certification_number');
  const page = searchParams.get('page');

  if (office) filters.office = Number(office);
  if (active) filters.active = active === 'true';
  if (make) filters.make = make;
  if (model) filters.model = model;
  if (maintenanceFrom) filters.maintenance_from = maintenanceFrom;
  if (maintenanceTo) filters.maintenance_to = maintenanceTo;
  if (mechanicCert) filters.mechanic_certification_number = mechanicCert;
  if (page) filters.page = Number(page);

  return filters;
}

function VehicleList() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = buildFilters(searchParams);
  const { data, isPending, isError, error, refetch } = useVehicles(filters);

  const currentPage = filters.page ?? 1;
  const totalPages = data ? Math.max(1, Math.ceil(data.count / PAGE_SIZE)) : 1;

  function handlePageChange(_event: React.ChangeEvent<unknown>, page: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (page > 1) {
      params.set('page', String(page));
    } else {
      params.delete('page');
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <>
      <VehicleFiltersBar />

      {isPending && (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      )}

      {isError && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => refetch()}>
              Retry
            </Button>
          }
        >
          Failed to load vehicles: {error instanceof Error ? error.message : 'Unknown error'}
        </Alert>
      )}

      {data && data.results.length === 0 && (
        <Alert severity="info">No vehicles match your search.</Alert>
      )}

      {data && data.results.length > 0 && (
        <>
          <Stack spacing={2}>
            {data.results.map((vehicle) => (
              <Card key={vehicle.id} variant="outlined">
                <CardActionArea component={Link} href={`/vehicles/${vehicle.id}`}>
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
                </CardActionArea>
              </Card>
            ))}
          </Stack>

          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={3}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </>
  );
}

export default function HomePage() {
  const [formOpen, setFormOpen] = useState(false);

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="h4" component="h1">
          Fleet Vehicles
        </Typography>
        <Button variant="contained" onClick={() => setFormOpen(true)}>
          + Add Vehicle
        </Button>
      </Stack>
      <Button
        component={Link}
        href="/needing-maintenance"
        color="warning"
        variant="outlined"
        sx={{ mb: 3 }}
      >
        ⚠ View vehicles needing maintenance
      </Button>
      <Suspense
        fallback={
          <Box display="flex" justifyContent="center" py={6}>
            <CircularProgress />
          </Box>
        }
      >
        <VehicleList />
      </Suspense>
      <VehicleFormDialog open={formOpen} onClose={() => setFormOpen(false)} />
    </Container>
  );
}
