// Central ERP API Client for Patient Portal Website
// Connects to CityCare Hospital ERP Gateway securely without exposing database credentials.

const API_BASE_URL = (
  import.meta.env.VITE_ERP_API_URL || 'http://localhost:8080/api/public/irisxe/v1'
).replace(/\/+$/, '');

const API_KEY = import.meta.env.VITE_ERP_API_KEY || '';

export class ErpApiError extends Error {
  code: string;
  status: number;
  details?: unknown;

  constructor(message: string, code = 'API_ERROR', status = 500, details?: unknown) {
    super(message);
    this.name = 'ErpApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export interface ClinicInfo {
  id: string;
  name: string;
  logo_url: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  timezone: string;
  opening_time: string;
  closing_time: string;
  active_doctors_count?: number;
  active_departments_count?: number;
}

export interface ApiDepartment {
  id: string;
  code: string;
  name: string;
  description: string | null;
}

export interface ApiDoctor {
  id: string;
  code: string;
  full_name: string;
  speciality: string;
  department_id: string;
  department_name?: string;
  consultation_fee: number;
  experience_years: number;
  qualifications: string;
  photo_url: string;
}

export interface ApiSlot {
  start_at: string;
  end_at: string;
  status: 'available' | 'booked';
  appointment_id: string | null;
}

export interface BookAppointmentInput {
  doctor_id: string;
  start_at: string;
  patient_name: string;
  patient_phone: string;
  patient_email?: string;
  appointment_type?: string;
  notes?: string;
}

export interface ApiAppointment {
  id: string;
  code: string;
  clinic_id: string;
  patient_id: string;
  doctor_id: string;
  department_id: string;
  start_at: string;
  end_at: string;
  appointment_type: string;
  status: string;
  notes: string | null;
  created_at: string;
}

export interface ChatQuickReply {
  label: string;
  actionUrl?: string;
}

export interface ChatResponse {
  reply: string;
  quickReplies?: ChatQuickReply[];
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  message?: string;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && options.method && options.method !== 'GET') {
    headers.set('Content-Type', 'application/json');
  }
  if (!headers.has('X-API-Key') && API_KEY) {
    headers.set('X-API-Key', API_KEY);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data: ApiResponse<T> | null = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.error?.message || data?.message || `ERP API Error: ${response.status} ${response.statusText}`;
    throw new ErpApiError(
      errorMsg,
      data?.error?.code || 'API_ERROR',
      response.status,
      data?.error?.details
    );
  }

  return data as unknown as T;
}

export const erpApi = {
  // Fetch clinic profile
  async getClinicInfo(): Promise<ClinicInfo> {
    const res = await request<{ success: boolean; data: { clinic: ClinicInfo } }>('/clinic');
    return res.data.clinic;
  },

  // Fetch all active departments
  async getDepartments(): Promise<ApiDepartment[]> {
    const res = await request<{ success: boolean; data: { departments: ApiDepartment[] } }>('/departments');
    return res.data.departments;
  },

  // Fetch active doctors (optionally filtered by department or search query)
  async getDoctors(params?: { department_id?: string; speciality?: string; q?: string }): Promise<ApiDoctor[]> {
    const searchParams = new URLSearchParams();
    if (params?.department_id) searchParams.set('department_id', params.department_id);
    if (params?.speciality) searchParams.set('speciality', params.speciality);
    if (params?.q) searchParams.set('q', params.q);

    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const res = await request<{ success: boolean; data: { doctors: ApiDoctor[] } }>(`/doctors${query}`);
    return res.data.doctors;
  },

  // Fetch available slots for a doctor on a specific date (YYYY-MM-DD)
  async getSlots(doctorId: string, date: string): Promise<ApiSlot[]> {
    const res = await request<{
      success: boolean;
      data: {
        doctor: { id: string; code: string; full_name: string };
        date: string;
        slots: ApiSlot[];
      };
    }>(`/slots?doctor_id=${encodeURIComponent(doctorId)}&date=${encodeURIComponent(date)}`);
    return res.data.slots;
  },

  // Book an appointment via the ERP gateway
  async bookAppointment(input: BookAppointmentInput): Promise<ApiAppointment> {
    const idempotencyKey = `idemp_web_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const res = await request<{
      success: boolean;
      idempotent_replay?: boolean;
      data: {
        appointment: ApiAppointment;
      };
    }>('/appointments', {
      method: 'POST',
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        doctor_id: input.doctor_id,
        start_at: input.start_at,
        patient_name: input.patient_name,
        patient_phone: input.patient_phone,
        patient_email: input.patient_email,
        appointment_type: input.appointment_type || 'consultation',
        notes: input.notes || 'Booked online via Patient Portal Website',
      }),
    });
    return res.data.appointment;
  },

  // Query iRIS AI Chat Gateway (dynamically fetched from ERP irisxe gateway)
  async chat(message: string): Promise<ChatResponse> {
    const res = await request<{
      success: boolean;
      data: ChatResponse;
    }>('/chat', {
      method: 'POST',
      body: JSON.stringify({
        message,
        source: 'patient',
      }),
    });
    return res.data;
  },
};
