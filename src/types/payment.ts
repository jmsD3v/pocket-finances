import { PaymentSchedule, Loan, Customer } from './database';

export type ScheduleWithDetails = PaymentSchedule & {
  loan: Loan & { customer: Customer };
};
