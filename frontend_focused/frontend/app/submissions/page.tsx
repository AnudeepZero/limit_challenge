'use client';

import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { useBrokerOptions } from '@/lib/hooks/useBrokerOptions';
import { useSubmissionsList } from '@/lib/hooks/useSubmissions';
import { SubmissionPriority, SubmissionStatus } from '@/lib/types';

const STATUS_OPTIONS: { label: string; value: SubmissionStatus | '' }[] = [
  { label: 'All statuses', value: '' },
  { label: 'New', value: 'new' },
  { label: 'In Review', value: 'in_review' },
  { label: 'Closed', value: 'closed' },
  { label: 'Lost', value: 'lost' },
];

const STATUS_COLOR: Record<SubmissionStatus, 'info' | 'warning' | 'success' | 'default'> = {
  new: 'info',
  in_review: 'warning',
  closed: 'success',
  lost: 'default',
};

const PRIORITY_COLOR: Record<SubmissionPriority, 'error' | 'warning' | 'default'> = {
  high: 'error',
  medium: 'warning',
  low: 'default',
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function SubmissionsPage() {
  const [status, setStatus] = useState<SubmissionStatus | ''>('');
  const [brokerId, setBrokerId] = useState('');
  const [companyQuery, setCompanyQuery] = useState('');

  const filters = useMemo(
    () => ({
      status: status || undefined,
      brokerId: brokerId || undefined,
      companySearch: companyQuery || undefined,
    }),
    [status, brokerId, companyQuery],
  );

  const submissionsQuery = useSubmissionsList(filters);
  const brokerQuery = useBrokerOptions();

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Stack spacing={4}>
        <Box>
          <Typography variant="h4" component="h1">
            Submissions
          </Typography>
          <Typography color="text.secondary">
            Filters update the query parameters and drive backend filtering.
          </Typography>
        </Box>

        <Card variant="outlined">
          <CardContent>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                select
                label="Status"
                value={status}
                onChange={(event) => setStatus(event.target.value as SubmissionStatus | '')}
                fullWidth
              >
                {STATUS_OPTIONS.map((option) => (
                  <MenuItem key={option.value || 'all'} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Broker"
                value={brokerId}
                onChange={(event) => setBrokerId(event.target.value)}
                fullWidth
              >
                <MenuItem value="">All brokers</MenuItem>
                {brokerQuery.data?.results.map((broker) => (
                  <MenuItem key={broker.id} value={String(broker.id)}>
                    {broker.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Company search"
                value={companyQuery}
                onChange={(event) => setCompanyQuery(event.target.value)}
                fullWidth
                helperText="Send as ?companySearch=..."
              />
            </Stack>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            {submissionsQuery.isPending && (
              <Stack alignItems="center" py={4}>
                <CircularProgress />
              </Stack>
            )}

            {submissionsQuery.isError && (
              <Alert severity="error">
                Failed to load submissions: {submissionsQuery.error.message}
              </Alert>
            )}

            {submissionsQuery.isSuccess && submissionsQuery.data.results.length === 0 && (
              <Alert severity="info">No submissions match these filters.</Alert>
            )}

            {submissionsQuery.isSuccess && submissionsQuery.data.results.length > 0 && (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Company</TableCell>
                      <TableCell>Broker</TableCell>
                      <TableCell>Owner</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Priority</TableCell>
                      <TableCell>Created</TableCell>
                      <TableCell align="right">Docs</TableCell>
                      <TableCell align="right">Notes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {submissionsQuery.data.results.map((submission) => (
                      <TableRow
                        key={submission.id}
                        hover
                        component={Link}
                        href={`/submissions/${submission.id}`}
                        sx={{ textDecoration: 'none', cursor: 'pointer' }}
                      >
                        <TableCell>{submission.company.legalName}</TableCell>
                        <TableCell>{submission.broker.name}</TableCell>
                        <TableCell>{submission.owner.fullName}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={submission.status.replace('_', ' ')}
                            color={STATUS_COLOR[submission.status]}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={submission.priority}
                            color={PRIORITY_COLOR[submission.priority]}
                          />
                        </TableCell>
                        <TableCell>{formatDate(submission.createdAt)}</TableCell>
                        <TableCell align="right">{submission.documentCount}</TableCell>
                        <TableCell align="right">{submission.noteCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
}
