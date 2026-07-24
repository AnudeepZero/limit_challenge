'use client';

import { use } from 'react';
import Link from 'next/link';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Stack,
  Typography,
} from '@mui/material';
import { isAxiosError } from 'axios';
import { useVehicle } from '@/lib/vehicles';

export default function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const vehicleId = Number(id);
  const { data: vehicle, isPending, isError, error } = useVehicle(vehicleId);

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Link href="/">&larr; Back to vehicles</Link>

      {isPending && (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      )}

      {isError && (
        <Alert severity="error" sx={{ mt: 3 }}>
          {isAxiosError(error) && error.response?.status === 404
            ? 'Vehicle not found.'
            : `Failed to load vehicle: ${error instanceof Error ? error.message : 'Unknown error'}`}
        </Alert>
      )}

      {vehicle && (
        <>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mt={3}>
            <Typography variant="h4" component="h1">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </Typography>
            <Chip
              label={vehicle.active ? 'Active' : 'Inactive'}
              color={vehicle.active ? 'success' : 'default'}
            />
          </Stack>
          <Typography color="text.secondary">VIN: {vehicle.vin}</Typography>
          <Typography color="text.secondary" gutterBottom>
            Plate: {vehicle.license_plate}
          </Typography>

          <Card variant="outlined" sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Office
              </Typography>
              <Typography>{vehicle.office.name}</Typography>
              <Typography color="text.secondary">{vehicle.office.city}</Typography>
            </CardContent>
          </Card>

          <Typography variant="h6" sx={{ mt: 4, mb: 1 }}>
            Maintenance History
          </Typography>

          {vehicle.maintenance_records.length === 0 && (
            <Alert severity="info">No maintenance records yet.</Alert>
          )}

          {vehicle.maintenance_records.length > 0 && (
            <Stack spacing={2}>
              {vehicle.maintenance_records.map((record) => (
                <Card key={record.id} variant="outlined">
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="subtitle1">{record.maintenance_type}</Typography>
                      <Typography color="text.secondary">{record.maintenance_date}</Typography>
                    </Stack>
                    <Divider sx={{ my: 1 }} />
                    <Typography>Cost: ${record.cost}</Typography>
                    <Typography color="text.secondary">
                      Mechanic: {record.mechanic.name} ({record.mechanic.certification_number})
                    </Typography>
                    {record.notes && (
                      <Typography color="text.secondary" sx={{ mt: 1 }}>
                        {record.notes}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </>
      )}
    </Container>
  );
}
