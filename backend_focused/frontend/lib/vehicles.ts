'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from './api-client';
import type { PaginatedResponse, Vehicle, VehicleDetail, VehicleFilters } from './types';

export async function fetchVehicles(filters: VehicleFilters) {
  const { data } = await apiClient.get<PaginatedResponse<Vehicle>>('/vehicles/', {
    params: filters,
  });
  return data;
}

export async function fetchVehicle(id: number) {
  const { data } = await apiClient.get<VehicleDetail>(`/vehicles/${id}/`);
  return data;
}

export function useVehicles(filters: VehicleFilters) {
  return useQuery({
    queryKey: ['vehicles', filters],
    queryFn: () => fetchVehicles(filters),
  });
}

export function useVehicle(id: number) {
  return useQuery({
    queryKey: ['vehicle', id],
    queryFn: () => fetchVehicle(id),
    enabled: Number.isFinite(id),
  });
}
