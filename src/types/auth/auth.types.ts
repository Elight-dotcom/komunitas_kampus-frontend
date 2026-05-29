export type ApiErrors = Record<string, string[]>;

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T | null;
  errors?: ApiErrors | null;
};

export type AuthRole = "Organisasi" | "Mahasiswa" | string;

export type AuthUser = {
  accountId: string;
  username: string;
  email: string;
  role: AuthRole;
  organizationId?: string;
};

export type LoginRequest = {
  identifier: string;
  password: string;
};

export type LoginResponse = {
  accountId: string;
  username: string;
  email: string;
  role: AuthRole;
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
  tokenType: string;
  organizationId?: string;
};

export type RegisterUserRequest = {
  fullName: string;
  university: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type RegisterUserResponse = {
  accountId: string;
  userId: string;
  username: string;
  email: string;
  role: AuthRole;
  fullName: string;
  university: string;
};

export type RegisterOrganizationRequest = {
  organizationName: string;
  university: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type RegisterOrganizationResponse = {
  accountId: string;
  organizationId: string;
  username: string;
  email: string;
  role: AuthRole;
  organizationName: string;
  university: string;
  slug: string;
};

export type LogoutResponse = {
  message: string;
};

export type UsernameAvailabilityResponse = {
  username: string;
  available: boolean;
};
