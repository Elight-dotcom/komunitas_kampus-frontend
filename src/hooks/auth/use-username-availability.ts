import { authApi } from "@/api/auth";
import { useDebounce } from "@/hooks/common/use-debounce";
import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";

export function useUsernameAvailability(username: string) {
  const normalizedUsername = username.trim();
  const debouncedUsername = useDebounce(normalizedUsername, 500);

  return useQuery({
    queryKey: ["auth", "username-availability", debouncedUsername],
    enabled: debouncedUsername.length >= 3,
    retry: false,
    queryFn: async () => {
      try {
        const response = await authApi.checkUsernameAvailability(debouncedUsername);

        return response.data;
      } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 404) {
          return {
            username: debouncedUsername,
            available: null,
            endpointMissing: true,
          };
        }

        throw error;
      }
    },
  });
}
