import { Link } from "react-router-dom";

type RegisterType = "user" | "organization";

type RegisterTypeToggleProps = {
  active: RegisterType;
};

const options: Array<{
  label: string;
  to: string;
  type: RegisterType;
}> = [
  {
    label: "Daftar User",
    to: "/register/user",
    type: "user",
  },
  {
    label: "Daftar Organisasi",
    to: "/register/organization",
    type: "organization",
  },
];

export function RegisterTypeToggle({ active }: RegisterTypeToggleProps) {
  return (
    <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-100 p-1">
      {options.map((option) => {
        const isActive = option.type === active;

        return (
          <Link
            key={option.type}
            to={option.to}
            aria-current={isActive ? "page" : undefined}
            className={[
              "rounded-xl px-4 py-2 text-sm font-semibold transition-all",
              isActive
                ? "bg-white text-indigo-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900",
            ].join(" ")}
          >
            {option.label}
          </Link>
        );
      })}
    </div>
  );
}
