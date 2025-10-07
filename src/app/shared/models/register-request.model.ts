export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  birth_date: string;      // formato "YYYY-MM-DD"
  gender: string;
  plan: string;
  current_amount: number;  // requerido
  monthly_income: number | null; // opcional
}
