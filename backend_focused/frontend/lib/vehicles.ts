'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './api-client';
import type {
  PaginatedResponse,
  Vehicle,
  VehicleDetail,
  VehicleFilters,
  VehicleWriteInput,
} from './types';

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

export async function createVehicle(payload: VehicleWriteInput) {
  const { data } = await apiClient.post<Vehicle>('/vehicles/', payload);
  return data;
}

export async function updateVehicle(id: number, payload: VehicleWriteInput) {
  const { data } = await apiClient.put<Vehicle>(`/vehicles/${id}/`, payload);
  return data;
}

export async function deleteVehicle(id: number) {
  await apiClient.delete(`/vehicles/${id}/`);
}

export function useCreateVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createVehicle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });
}

export function useUpdateVehicle(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: VehicleWriteInput) => updateVehicle(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle', id] });
    },
  });
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteVehicle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });
}
