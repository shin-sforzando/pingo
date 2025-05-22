import type { ReactNode } from "react";

export interface InfoCardProps {
  title: string;
  value: string;
  icon?: ReactNode;
}

export function InfoCard({ title, value, icon }: InfoCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border p-4">
      {icon && <div className="text-muted-foreground">{icon}</div>}
      <div>
        <p className="text-muted-foreground text-sm">{title}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}
