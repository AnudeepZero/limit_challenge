'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from './api-client';
import type { Office, PaginatedResponse } from './types';

export async function fetchOffices() {
  const { data } = await apiClient.get<PaginatedResponse<Office>>('/offices/');
  return data.results;
}

export function useOffices() {
  return useQuery({
    queryKey: ['offices'],
    queryFn: fetchOffices,
  });
}
