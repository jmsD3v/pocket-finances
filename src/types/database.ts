import { Database } from '@/integrations/supabase/types';

export type CustomerStatus = 'activo' | 'moroso' | 'inactivo';
export type LoanStatus = 'activo' | 'cancelado' | 'moroso';
export type PaymentMethod = 'efectivo' | 'transferencia' | 'tarjeta';
export type ScheduleStatus = 'pendiente' | 'pagado' | 'vencido';
export type UserRole = Database['public']['Enums']['app_role'];

export type Customer = Database['public']['Tables']['customers']['Row'];
export type CustomerInsert = Database['public']['Tables']['customers']['Insert'];
export type CustomerUpdate = Database['public']['Tables']['customers']['Update'];

export type Loan = Database['public']['Tables']['loans']['Row'];
export type LoanInsert = Database['public']['Tables']['loans']['Insert'];
export type LoanUpdate = Database['public']['Tables']['loans']['Update'];

export type Payment = Database['public']['Tables']['payments']['Row'];
export type PaymentInsert = Database['public']['Tables']['payments']['Insert'];
export type PaymentUpdate = Database['public']['Tables']['payments']['Update'];

export type PaymentSchedule = Database['public']['Tables']['payment_schedule']['Row'];
export type PaymentScheduleInsert = Database['public']['Tables']['payment_schedule']['Insert'];
export type PaymentScheduleUpdate = Database['public']['Tables']['payment_schedule']['Update'];

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type UserRoleRecord = Database['public']['Tables']['user_roles']['Row'];
