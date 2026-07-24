export interface Office {
  id: number;
  name: string;
  city: string;
}

export interface Vehicle {
  id: number;
  vin: string;
  license_plate: string;
  make: string;
  model: string;
  year: number;
  office: number;
  active: boolean;
}

export interface Mechanic {
  id: number;
  name: string;
  certification_number: string;
  active: boolean;
}

export interface MaintenanceRecordDetail {
  id: number;
  mechanic: Mechanic;
  maintenance_date: string;
  maintenance_type: string;
  cost: string;
  notes: string;
}

export interface VehicleDetail extends Omit<Vehicle, 'office'> {
  office: Office;
  maintenance_records: MaintenanceRecordDetail[];
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface VehicleFilters {
  office?: number;
  active?: boolean;
  make?: string;
  model?: string;
  maintenance_from?: string;
  maintenance_to?: string;
  mechanic_certification_number?: string;
  page?: number;
}

export interface VehicleNeedingMaintenance {
  id: number;
  vin: string;
  license_plate: string;
  make: string;
  model: string;
  year: number;
  office: number;
  last_maintenance_date: string | null;
}

export interface VehicleWriteInput {
  vin: string;
  license_plate: string;
  make: string;
  model: string;
  year: number;
  office: number;
  active: boolean;
}
