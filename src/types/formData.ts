// Form data types for various components

export interface CustomerFormData {
  full_name: string;
  email: string;
  phone: string;
  address: string;
  identification_number: string;
  status: string;
  notes: string;
}

export interface LoanFormData {
  customer_id: string;
  amount: string;
  interest_rate: string;
  installments: string;
  start_date: string;
  status: 'activo' | 'cancelado' | 'moroso';
  notes: string;
}

export interface PaymentFormData {
  amount: string;
  payment_date: string;
  payment_method: 'efectivo' | 'transferencia' | 'tarjeta';
  notes: string;
}

export interface SignUpFormData {
  fullName: string;
  email: string;
  password: string;
}

export interface SignInFormData {
  email: string;
  password: string;
}
