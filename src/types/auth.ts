export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  message: string;
  user: User;
}

export interface AuthError {
  error: string;
}