'use client';

import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { Broker, PaginatedResponse } from '@/lib/types';

async function fetchBrokers() {
  const response = await apiClient.get<PaginatedResponse<Broker>>('/brokers/');
  return response.data;
}

export function useBrokerOptions() {
  return useQuery({
    queryKey: ['brokers'],
    queryFn: fetchBrokers,
    enabled: true,
  });
}
