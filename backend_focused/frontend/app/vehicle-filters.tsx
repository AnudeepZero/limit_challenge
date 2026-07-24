'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Grid, MenuItem, TextField } from '@mui/material';
import { useOffices } from '@/lib/offices';

const ACTIVE_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
];

export default function VehicleFiltersBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: offices } = useOffices();

  const [make, setMake] = useState(searchParams.get('make') ?? '');
  const [model, setModel] = useState(searchParams.get('model') ?? '');
  const [mechanicCert, setMechanicCert] = useState(
    searchParams.get('mechanic_certification_number') ?? '',
  );

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page');
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  useEffect(() => {
    const timeout = setTimeout(() => updateParam('make', make), 350);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [make]);

  useEffect(() => {
    const timeout = setTimeout(() => updateParam('model', model), 350);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model]);

  useEffect(() => {
    const timeout = setTimeout(
      () => updateParam('mechanic_certification_number', mechanicCert),
      350,
    );
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mechanicCert]);

  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <TextField
          label="Make"
          fullWidth
          size="small"
          value={make}
          onChange={(e) => setMake(e.target.value)}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <TextField
          label="Model"
          fullWidth
          size="small"
          value={model}
          onChange={(e) => setModel(e.target.value)}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <TextField
          select
          label="Status"
          fullWidth
          size="small"
          value={searchParams.get('active') ?? ''}
          onChange={(e) => updateParam('active', e.target.value)}
        >
          {ACTIVE_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <TextField
          select
          label="Office"
          fullWidth
          size="small"
          value={searchParams.get('office') ?? ''}
          onChange={(e) => updateParam('office', e.target.value)}
        >
          <MenuItem value="">All</MenuItem>
          {offices?.map((office) => (
            <MenuItem key={office.id} value={String(office.id)}>
              {office.name}
            </MenuItem>
          ))}
        </TextField>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <TextField
          label="Maintenance from"
          type="date"
          fullWidth
          size="small"
          slotProps={{ inputLabel: { shrink: true } }}
          value={searchParams.get('maintenance_from') ?? ''}
          onChange={(e) => updateParam('maintenance_from', e.target.value)}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <TextField
          label="Maintenance to"
          type="date"
          fullWidth
          size="small"
          slotProps={{ inputLabel: { shrink: true } }}
          value={searchParams.get('maintenance_to') ?? ''}
          onChange={(e) => updateParam('maintenance_to', e.target.value)}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <TextField
          label="Mechanic Cert #"
          fullWidth
          size="small"
          value={mechanicCert}
          onChange={(e) => setMechanicCert(e.target.value)}
        />
      </Grid>
    </Grid>
  );
}
