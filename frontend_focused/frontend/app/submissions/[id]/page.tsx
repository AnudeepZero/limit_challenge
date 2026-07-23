'use client';

import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  Link as MuiLink,
  Stack,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { useSubmissionDetail } from '@/lib/hooks/useSubmissions';
import { SubmissionPriority, SubmissionStatus } from '@/lib/types';

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

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function SubmissionDetailPage() {
  const params = useParams<{ id: string }>();
  const submissionId = params?.id ?? '';

  const detailQuery = useSubmissionDetail(submissionId);

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Stack spacing={3}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h4">Submission detail</Typography>
          <MuiLink component={Link} href="/submissions" underline="none">
            Back to list
          </MuiLink>
        </Box>

        {detailQuery.isPending && (
          <Stack alignItems="center" py={4}>
            <CircularProgress />
          </Stack>
        )}

        {detailQuery.isError && (
          <Alert severity="error">Failed to load submission: {detailQuery.error.message}</Alert>
        )}

        {detailQuery.isSuccess && (
          <>
            <Card variant="outlined">
              <CardContent>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  flexWrap="wrap"
                  gap={1}
                >
                  <Typography variant="h5">{detailQuery.data.company.legalName}</Typography>
                  <Stack direction="row" spacing={1}>
                    <Chip
                      label={detailQuery.data.status.replace('_', ' ')}
                      color={STATUS_COLOR[detailQuery.data.status]}
                    />
                    <Chip
                      label={detailQuery.data.priority}
                      color={PRIORITY_COLOR[detailQuery.data.priority]}
                    />
                  </Stack>
                </Stack>
                <Typography color="text.secondary" sx={{ mt: 1 }}>
                  {detailQuery.data.summary}
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  Created {formatDateTime(detailQuery.data.createdAt)} · Updated{' '}
                  {formatDateTime(detailQuery.data.updatedAt)}
                </Typography>
              </CardContent>
            </Card>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">
                      Company
                    </Typography>
                    <Typography>{detailQuery.data.company.legalName}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {detailQuery.data.company.industry} ·{' '}
                      {detailQuery.data.company.headquartersCity}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">
                      Broker
                    </Typography>
                    <Typography>{detailQuery.data.broker.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {detailQuery.data.broker.primaryContactEmail}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">
                      Owner
                    </Typography>
                    <Typography>{detailQuery.data.owner.fullName}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {detailQuery.data.owner.email}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Contacts
                </Typography>
                {detailQuery.data.contacts.length === 0 && (
                  <Typography color="text.secondary">No contacts recorded.</Typography>
                )}
                <Stack spacing={1.5}>
                  {detailQuery.data.contacts.map((contact) => (
                    <Box key={contact.id}>
                      <Typography>
                        {contact.name}{' '}
                        <Typography component="span" color="text.secondary">
                          — {contact.role}
                        </Typography>
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {contact.email} · {contact.phone}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Documents
                </Typography>
                {detailQuery.data.documents.length === 0 && (
                  <Typography color="text.secondary">No documents uploaded.</Typography>
                )}
                <Stack spacing={1.5}>
                  {detailQuery.data.documents.map((document) => (
                    <Box key={document.id}>
                      <MuiLink href={document.fileUrl} target="_blank" rel="noopener noreferrer">
                        {document.title}
                      </MuiLink>
                      <Typography variant="body2" color="text.secondary">
                        {document.docType} · uploaded {formatDateTime(document.uploadedAt)}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Notes
                </Typography>
                {detailQuery.data.notes.length === 0 && (
                  <Typography color="text.secondary">No notes yet.</Typography>
                )}
                <Stack spacing={2}>
                  {detailQuery.data.notes.map((note) => (
                    <Box key={note.id}>
                      <Typography variant="body2" color="text.secondary">
                        {note.authorName} · {formatDateTime(note.createdAt)}
                      </Typography>
                      <Typography>{note.body}</Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </>
        )}
      </Stack>
    </Container>
  );
}
