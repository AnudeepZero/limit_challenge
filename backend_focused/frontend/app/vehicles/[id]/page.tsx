'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Stack,
  Typography,
} from '@mui/material';
import { isAxiosError } from 'axios';
import { useDeleteVehicle, useVehicle } from '@/lib/vehicles';
import VehicleFormDialog from '@/app/vehicle-form-dialog';

export default function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const vehicleId = Number(id);
  const router = useRouter();
  const { data: vehicle, isPending, isError, error, refetch } = useVehicle(vehicleId);
  const deleteVehicle = useDeleteVehicle();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  function handleDelete() {
    deleteVehicle.mutate(vehicleId, {
      onSuccess: () => router.push('/'),
    });
  }

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Link href="/">&larr; Back to vehicles</Link>

      {isPending && (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      )}

      {isError && (
        <Alert
          severity="error"
          sx={{ mt: 3 }}
          action={
            isAxiosError(error) && error.response?.status === 404 ? undefined : (
              <Button color="inherit" size="small" onClick={() => refetch()}>
                Retry
              </Button>
            )
          }
        >
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
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                label={vehicle.active ? 'Active' : 'Inactive'}
                color={vehicle.active ? 'success' : 'default'}
              />
              <Button size="small" onClick={() => setEditOpen(true)}>
                Edit
              </Button>
              <Button size="small" color="error" onClick={() => setDeleteOpen(true)}>
                Delete
              </Button>
            </Stack>
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

          <VehicleFormDialog
            open={editOpen}
            onClose={() => setEditOpen(false)}
            vehicle={{
              id: vehicle.id,
              vin: vehicle.vin,
              license_plate: vehicle.license_plate,
              make: vehicle.make,
              model: vehicle.model,
              year: vehicle.year,
              office: vehicle.office.id,
              active: vehicle.active,
            }}
          />
        </>
      )}

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>Delete vehicle?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will permanently delete this vehicle and its maintenance history. This cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button color="error" onClick={handleDelete} disabled={deleteVehicle.isPending}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
