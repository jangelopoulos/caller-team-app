export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  Country: string;
  profile_pic: { url?: string } | null;
  supabase_uid: string | null;
  active_pay_rate_per_hour: number | null;
  onboarding_completed?: boolean;
  phone?: string;
  birthday?: string | null;
  gender?: string;
  bio?: string;
  emergency_contact_name?: string;
  emergency_contact_info?: string;
  allergies_or_illness?: string;
  account_name?: string;
  bsb?: string;
  account_number?: string;
  super_fund?: string;
  super_number?: string;
  employment_status?: string;
}

export interface Shift {
  id: string;
  date: string | null;
  employee_id: string | null;
  start_time: number | null;
  end_time: number | null;
  status: string;
  duration: number | null;
  working_duration: number | null;
  rostered_hours: number | null;
  connects: number | null;
  outbounds: number | null;
  oph: number | null;
  cph: number | null;
  connection_rate: number | null;
  temporary: boolean;
  pay: number | null;
  paid_time: number | null;
}

export interface PayRun {
  id: string;
  paid_date: string | null;
  date_from: string | null;
  date_to: string | null;
  total_pay: number;
  paid_time: number | null;
  extra_time: number | null;
  employee_id: string | null;
}

export interface HrDoc {
  id: string;
  name: string;
  description: string;
  attachment: { url?: string; filename?: string } | null;
  link: string;
  deleted: boolean;
  created_at: number;
}

export interface LeaveRequest {
  id: string;
  created_at: number;
  employee_id: string | null;
  date_from: string | null;
  date_to: string | null;
  total_hours: number;
  status: string;
  reason?: string;
  type?: string;
  approved_by?: string | null;
  approved_date?: string | null;
}

export interface Chat {
  id: string;
  created_at: number;
  employees_id: string[] | null;
  name: string;
  type: string;
  icon_name: string;
  image: { url?: string } | null;
}

export interface Message {
  id: string;
  created_at: number;
  chat_id: string | null;
  sent_id: string | null;
  message: string;
  Unseen: boolean;
}

export interface MessageRead {
  id: string;
  created_at: number;
  message_id: string | null;
  user_id: string | null;
  seen_at: number | null;
}
