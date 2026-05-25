import { httpClient } from "@/api/common";
import type {
    ApiResponse,
    LoginRequest,
    LoginResponse,
    LogoutResponse,
    RegisterOrganizationRequest,
    RegisterOrganizationResponse,
    RegisterUserRequest,
    RegisterUserResponse,
    UsernameAvailabilityResponse,
} from "@/types/auth";

export const authApi = {
  async registerOrganization(payload: RegisterOrganizationRequest) {
    const response = await httpClient.post<ApiResponse<RegisterOrganizationResponse>>(
      "/api/auth/register/organization",
      payload
    );

    return response.data;
  },

  async registerUser(payload: RegisterUserRequest) {
    const response = await httpClient.post<ApiResponse<RegisterUserResponse>>(
      "/api/auth/register/user",
      payload
    );

    return response.data;
  },

  async login(payload: LoginRequest) {
    const response = await httpClient.post<ApiResponse<LoginResponse>>(
      "/api/auth/login",
      payload
    );

    return response.data;
  },

  async refresh() {
    const response = await httpClient.post<ApiResponse<LoginResponse>>(
      "/api/auth/refresh"
    );

    return response.data;
  },

  async logout() {
    const response = await httpClient.post<ApiResponse<LogoutResponse>>(
      "/api/auth/logout"
    );

    return response.data;
  },

  async checkUsernameAvailability(username: string) {
    const response = await httpClient.get<ApiResponse<UsernameAvailabilityResponse>>(
      "/api/auth/username-availability",
      {
        params: { username },
      }
    );

    return response.data;
  },
};
