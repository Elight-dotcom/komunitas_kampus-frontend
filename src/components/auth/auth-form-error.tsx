type AuthFormErrorProps = {
  message?: string | null;
};

export function AuthFormError({ message }: AuthFormErrorProps) {
  if (!message) return null;

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {message}
    </div>
  );
}
