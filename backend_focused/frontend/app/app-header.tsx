'use client';

import Link from 'next/link';
import { AppBar, Button, Stack, Toolbar, Typography } from '@mui/material';

export default function AppHeader() {
  return (
    <AppBar position="static" color="primary" enableColorOnDark>
      <Toolbar>
        <Typography
          variant="h6"
          component={Link}
          href="/"
          sx={{ flexGrow: 1, color: 'inherit', textDecoration: 'none' }}
        >
          Fleet Tracker
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button component={Link} href="/" color="inherit">
            Vehicles
          </Button>
          <Button component={Link} href="/needing-maintenance" color="inherit">
            Needing Maintenance
          </Button>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
