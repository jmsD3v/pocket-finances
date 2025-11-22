import { Customer, Loan } from './database';
import { ScheduleWithDetails } from './payment';

export interface CustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer;
  onSaved: () => void;
}

export interface LoanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loan?: Loan;
  onSaved: () => void;
}

export interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule?: ScheduleWithDetails;
  onSaved: () => void;
}
