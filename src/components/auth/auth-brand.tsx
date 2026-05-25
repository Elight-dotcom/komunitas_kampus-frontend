import { GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";

export function AuthBrand() {
  return (
    <Link to="/" className="inline-flex items-center gap-2 text-xl font-bold text-indigo-900">
      <GraduationCap className="h-7 w-7" />
      <span>KomunitasKampus</span>
    </Link>
  );
}
