-- Crear tabla de préstamos
CREATE TABLE public.loans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  interest_rate DECIMAL(5,2) NOT NULL,
  installments INTEGER NOT NULL,
  installment_amount DECIMAL(12,2) NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  start_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'activo',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla de pagos
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  loan_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method TEXT NOT NULL,
  installment_number INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla de cronograma de pagos
CREATE TABLE public.payment_schedule (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  loan_id UUID NOT NULL,
  installment_number INTEGER NOT NULL,
  due_date DATE NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendiente',
  paid_amount DECIMAL(12,2) DEFAULT 0,
  paid_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_schedule ENABLE ROW LEVEL SECURITY;

-- Políticas para loans
CREATE POLICY "Users can view their own loans"
ON public.loans FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own loans"
ON public.loans FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own loans"
ON public.loans FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own loans"
ON public.loans FOR DELETE
USING (auth.uid() = user_id);

-- Políticas para payments
CREATE POLICY "Users can view their own payments"
ON public.payments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payments"
ON public.payments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payments"
ON public.payments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payments"
ON public.payments FOR DELETE
USING (auth.uid() = user_id);

-- Políticas para payment_schedule
CREATE POLICY "Users can view payment schedules for their loans"
ON public.payment_schedule FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.loans
    WHERE loans.id = payment_schedule.loan_id
    AND loans.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert payment schedules for their loans"
ON public.payment_schedule FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.loans
    WHERE loans.id = payment_schedule.loan_id
    AND loans.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update payment schedules for their loans"
ON public.payment_schedule FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.loans
    WHERE loans.id = payment_schedule.loan_id
    AND loans.user_id = auth.uid()
  )
);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_loans_updated_at
BEFORE UPDATE ON public.loans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_schedule_updated_at
BEFORE UPDATE ON public.payment_schedule
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();