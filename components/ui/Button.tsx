import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "discord" | "minecraft";
  size?: "sm" | "md" | "lg";
}

export function Button({ 
  children, 
  className, 
  variant = "primary", 
  size = "md",
  ...props 
}: ButtonProps) {
  const variantStyles = {
    primary: "bg-minecraft-grass border-green-800 text-white hover:bg-green-600",
    secondary: "bg-minecraft-stone border-minecraft-cobble text-white hover:bg-gray-600",
    discord: "bg-[#5865F2] border-[#4752C4] text-white hover:bg-[#4752C4]",
    minecraft: "bg-minecraft-dirt border-amber-900 text-white hover:bg-amber-800",
  };

  const sizeStyles = {
    sm: "px-3 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  return (
    <button
      className={cn(
        "border-4 shadow-minecraft font-minecraft font-bold transition-all duration-200",
        "hover:shadow-minecraft-hover hover:translate-x-1 hover:translate-y-1",
        "active:translate-x-2 active:translate-y-2 active:shadow-none",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}