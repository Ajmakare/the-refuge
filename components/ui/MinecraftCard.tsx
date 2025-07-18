import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface MinecraftCardProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "stone" | "wood" | "grass";
  hoverable?: boolean;
}

export function MinecraftCard({ 
  children, 
  className, 
  variant = "default", 
  hoverable = false 
}: MinecraftCardProps) {
  const variantStyles = {
    default: "bg-minecraft-stone border-minecraft-cobble",
    stone: "bg-minecraft-stone border-minecraft-cobble",
    wood: "bg-minecraft-wood border-amber-800",
    grass: "bg-minecraft-grass border-green-800",
  };

  return (
    <div
      className={cn(
        "border-4 shadow-minecraft p-6 transition-all duration-200",
        variantStyles[variant],
        hoverable && "hover:shadow-minecraft-hover hover:translate-x-1 hover:translate-y-1 cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
}