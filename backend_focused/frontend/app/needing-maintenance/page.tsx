'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import {
  Alert,
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Pagination,
  Stack,
  Typography,
  Button,
} from '@mui/material';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useVehiclesNeedingMaintenance } from '@/lib/needing-maintenance';

const PAGE_SIZE = 10;

function daysSince(dateString: string) {
  const then = new Date(dateString).getTime();
  const now = Date.now();
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

function NeedingMaintenanceList() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const page = Number(searchParams.get('page') ?? '1');
  const { data, isPending, isError, error, refetch } = useVehiclesNeedingMaintenance(page);

  const totalPages = data ? Math.max(1, Math.ceil(data.count / PAGE_SIZE)) : 1;

  function handlePageChange(_event: React.ChangeEvent<unknown>, newPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (newPage > 1) {
      params.set('page', String(newPage));
    } else {
      params.delete('page');
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <>
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
        <Alert severity="success">Nothing overdue — every active vehicle is up to date.</Alert>
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
                        label={
                          vehicle.last_maintenance_date === null
                            ? 'Never serviced'
                            : `${daysSince(vehicle.last_maintenance_date)} days ago`
                        }
                        color="error"
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
                page={page}
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

export default function NeedingMaintenancePage() {
  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Link href="/">&larr; Back to vehicles</Link>
      <Typography variant="h4" component="h1" sx={{ mt: 2 }} gutterBottom>
        Vehicles Needing Maintenance
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Active vehicles never serviced, or last serviced more than 365 days ago.
      </Typography>
      <Suspense
        fallback={
          <Box display="flex" justifyContent="center" py={6}>
            <CircularProgress />
          </Box>
        }
      >
        <NeedingMaintenanceList />
      </Suspense>
    </Container>
  );
}
