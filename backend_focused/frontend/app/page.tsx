'use client';

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
import { useVehicles } from '@/lib/vehicles';

export default function HomePage() {
  const { data, isPending, isError, error } = useVehicles({});

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Fleet Vehicles
      </Typography>

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
    </Container>
  );
}
