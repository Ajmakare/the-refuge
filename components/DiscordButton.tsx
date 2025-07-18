"use client";

import { Button } from "@/components/ui/Button";
import { MessageCircle } from "lucide-react";

interface DiscordButtonProps {
  inviteUrl?: string;
  className?: string;
}

export function DiscordButton({ 
  inviteUrl = "https://discord.gg/your-server", 
  className 
}: DiscordButtonProps) {
  const handleClick = () => {
    window.open(inviteUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <Button
      variant="discord"
      size="lg"
      onClick={handleClick}
      className={className}
    >
      <MessageCircle className="w-6 h-6 mr-3" />
      Join Our Discord
    </Button>
  );
}