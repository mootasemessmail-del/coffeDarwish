import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface TopBarProps {
  title: string;
}

export function TopBar({ title }: TopBarProps) {
  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const dateStr = dateTime.toLocaleDateString("ar-LY", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeStr = dateTime.toLocaleTimeString("ar-LY", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  return (
    <header className="h-14 bg-white border-b border-[rgba(62,39,35,0.08)] flex items-center justify-between px-8">
      <h2 className="text-lg font-semibold text-brown-900 font-cairo">{title}</h2>
      <div className="flex items-center gap-2 text-sm text-brown-500 font-cairo">
        <Clock className="w-4 h-4" />
        <span>{dateStr}</span>
        <span className="text-brown-300">|</span>
        <span>{timeStr}</span>
      </div>
    </header>
  );
}
