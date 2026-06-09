import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

interface ContentCardProps {
  children: ReactNode;
  className?: string;
  header?: ReactNode;
}

export function ContentCard({ children, className, header }: ContentCardProps) {
  return (
    <div
      className={cn(
        "bg-white border border-[rgba(62,39,35,0.08)] rounded-[10px] shadow-[0_1px_3px_rgba(62,39,35,0.04)] hover:shadow-[0_4px_12px_rgba(62,39,35,0.06)] transition-shadow duration-200",
        className
      )}
    >
      {header && (
        <div className="bg-brown-100 px-6 py-4 rounded-t-[10px] flex items-center justify-between">
          {header}
        </div>
      )}
      <div className={cn("p-6", !header && "rounded-[10px]")}>{children}</div>
    </div>
  );
}
