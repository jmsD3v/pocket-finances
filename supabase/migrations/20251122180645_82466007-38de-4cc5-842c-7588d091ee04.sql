-- Agregar foreign keys
ALTER TABLE public.loans
ADD CONSTRAINT loans_customer_id_fkey 
FOREIGN KEY (customer_id) 
REFERENCES public.customers(id) 
ON DELETE CASCADE;

ALTER TABLE public.payments
ADD CONSTRAINT payments_loan_id_fkey 
FOREIGN KEY (loan_id) 
REFERENCES public.loans(id) 
ON DELETE CASCADE;

ALTER TABLE public.payments
ADD CONSTRAINT payments_customer_id_fkey 
FOREIGN KEY (customer_id) 
REFERENCES public.customers(id) 
ON DELETE CASCADE;

ALTER TABLE public.payment_schedule
ADD CONSTRAINT payment_schedule_loan_id_fkey 
FOREIGN KEY (loan_id) 
REFERENCES public.loans(id) 
ON DELETE CASCADE;