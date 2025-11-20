import { Database } from '@/integrations/supabase/types';

export type CustomerStatus = 'activo' | 'moroso' | 'inactivo';
export type UserRole = Database['public']['Enums']['app_role'];

export type Customer = Database['public']['Tables']['customers']['Row'];
export type CustomerInsert = Database['public']['Tables']['customers']['Insert'];
export type CustomerUpdate = Database['public']['Tables']['customers']['Update'];

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type UserRoleRecord = Database['public']['Tables']['user_roles']['Row'];
