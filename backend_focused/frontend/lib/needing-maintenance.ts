'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from './api-client';
import type { PaginatedResponse, VehicleNeedingMaintenance } from './types';

export async function fetchVehiclesNeedingMaintenance(page: number) {
  const { data } = await apiClient.get<PaginatedResponse<VehicleNeedingMaintenance>>(
    '/vehicles/needing-maintenance/',
    { params: { page } },
  );
  return data;
}

export function useVehiclesNeedingMaintenance(page: number) {
  return useQuery({
    queryKey: ['vehicles-needing-maintenance', page],
    queryFn: () => fetchVehiclesNeedingMaintenance(page),
  });
}
