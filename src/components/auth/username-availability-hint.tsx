import { CheckCircle2, Loader2, XCircle, AlertCircle } from "lucide-react";
import { useUsernameAvailability } from "@/hooks/auth";

type UsernameAvailabilityHintProps = {
  username: string;
};

export function UsernameAvailabilityHint({ username }: UsernameAvailabilityHintProps) {
  const normalizedUsername = username.trim();
  const query = useUsernameAvailability(normalizedUsername);

  if (!normalizedUsername) return null;

  if (normalizedUsername.length < 3) {
    return (
      <p className="mt-2 text-xs text-slate-500">
        Username minimal 3 karakter.
      </p>
    );
  }

  if (query.isFetching) {
    return (
      <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-500">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Mengecek ketersediaan username...
      </p>
    );
  }

  if (query.data && "endpointMissing" in query.data) {
    return (
      <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-amber-600">
        <AlertCircle className="h-3.5 w-3.5" />
        Endpoint cek username belum tersedia di backend.
      </p>
    );
  }

  if (query.data?.available === true) {
    return (
      <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-emerald-600">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Username tersedia.
      </p>
    );
  }

  if (query.data?.available === false) {
    return (
      <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-red-600">
        <XCircle className="h-3.5 w-3.5" />
        Username sudah digunakan.
      </p>
    );
  }

  if (query.isError) {
    return (
      <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-amber-600">
        <AlertCircle className="h-3.5 w-3.5" />
        Gagal mengecek username.
      </p>
    );
  }

  return null;
}
