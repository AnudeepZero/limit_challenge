'use client';

import { useEffect, useState } from 'react';
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material';
import { isAxiosError } from 'axios';
import { useOffices } from '@/lib/offices';
import { useCreateVehicle, useUpdateVehicle } from '@/lib/vehicles';
import type { Vehicle, VehicleWriteInput } from '@/lib/types';

type FieldErrors = Partial<Record<keyof VehicleWriteInput, string>>;

const EMPTY_FORM: VehicleWriteInput = {
  vin: '',
  license_plate: '',
  make: '',
  model: '',
  year: new Date().getFullYear(),
  office: 0,
  active: true,
};

export default function VehicleFormDialog({
  open,
  onClose,
  vehicle,
}: {
  open: boolean;
  onClose: () => void;
  vehicle?: Vehicle;
}) {
  const isEdit = Boolean(vehicle);
  const { data: offices } = useOffices();
  const createVehicle = useCreateVehicle();
  const updateVehicle = useUpdateVehicle(vehicle?.id ?? 0);
  const mutation = isEdit ? updateVehicle : createVehicle;

  const [form, setForm] = useState<VehicleWriteInput>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (open) {
      setForm(
        vehicle
          ? {
              vin: vehicle.vin,
              license_plate: vehicle.license_plate,
              make: vehicle.make,
              model: vehicle.model,
              year: vehicle.year,
              office: vehicle.office,
              active: vehicle.active,
            }
          : EMPTY_FORM,
      );
      setFieldErrors({});
    }
  }, [open, vehicle]);

  function handleChange<K extends keyof VehicleWriteInput>(key: K, value: VehicleWriteInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit() {
    setFieldErrors({});
    mutation.mutate(form, {
      onSuccess: () => onClose(),
      onError: (error) => {
        if (isAxiosError(error) && error.response?.status === 400) {
          const data = error.response.data as Record<string, string[]>;
          const errors: FieldErrors = {};
          for (const [key, messages] of Object.entries(data)) {
            errors[key as keyof VehicleWriteInput] = Array.isArray(messages)
              ? messages.join(' ')
              : String(messages);
          }
          setFieldErrors(errors);
        }
      },
    });
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? 'Edit Vehicle' : 'Add Vehicle'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="VIN"
            value={form.vin}
            onChange={(e) => handleChange('vin', e.target.value)}
            error={Boolean(fieldErrors.vin)}
            helperText={fieldErrors.vin}
            fullWidth
          />
          <TextField
            label="License Plate"
            value={form.license_plate}
            onChange={(e) => handleChange('license_plate', e.target.value)}
            error={Boolean(fieldErrors.license_plate)}
            helperText={fieldErrors.license_plate}
            fullWidth
          />
          <TextField
            label="Make"
            value={form.make}
            onChange={(e) => handleChange('make', e.target.value)}
            error={Boolean(fieldErrors.make)}
            helperText={fieldErrors.make}
            fullWidth
          />
          <TextField
            label="Model"
            value={form.model}
            onChange={(e) => handleChange('model', e.target.value)}
            error={Boolean(fieldErrors.model)}
            helperText={fieldErrors.model}
            fullWidth
          />
          <TextField
            label="Year"
            type="number"
            value={form.year}
            onChange={(e) => handleChange('year', Number(e.target.value))}
            error={Boolean(fieldErrors.year)}
            helperText={fieldErrors.year}
            fullWidth
          />
          <TextField
            select
            label="Office"
            value={form.office || ''}
            onChange={(e) => handleChange('office', Number(e.target.value))}
            error={Boolean(fieldErrors.office)}
            helperText={fieldErrors.office}
            fullWidth
          >
            {offices?.map((office) => (
              <MenuItem key={office.id} value={office.id}>
                {office.name}
              </MenuItem>
            ))}
          </TextField>
          <FormControlLabel
            control={
              <Checkbox
                checked={form.active}
                onChange={(e) => handleChange('active', e.target.checked)}
              />
            }
            label="Active"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={mutation.isPending}>
          {isEdit ? 'Save' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
