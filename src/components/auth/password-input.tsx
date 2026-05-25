import { Eye, EyeOff, Lock } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

type PasswordInputProps = {
  id: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
};

export function PasswordInput({
  id,
  value,
  placeholder = "••••••••",
  onChange,
}: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative">
      <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
      <Input
        id={id}
        type={isVisible ? "text" : "password"}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-14 rounded-xl border-slate-300 bg-white pl-12 pr-12 text-base focus-visible:ring-indigo-200"
      />
      <button
        type="button"
        onClick={() => setIsVisible((current) => !current)}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-indigo-900"
        aria-label={isVisible ? "Sembunyikan password" : "Tampilkan password"}
      >
        {isVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
      </button>
    </div>
  );
}
