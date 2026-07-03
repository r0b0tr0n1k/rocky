"use client";

import { Share2 } from "lucide-react";
import { Button } from "@rocky/ui/components/button";

interface ShareButtonProps {
  title: string;
  slug?: string;
}

export function ShareButton({ title, slug }: ShareButtonProps) {
  const handleShare = async () => {
    const url = slug
      ? `${window.location.origin}/${slug}`
      : window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url,
        });
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Error sharing:", error);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
      } catch (error) {
        console.error("Failed to copy URL:", error);
      }
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleShare}
      aria-label="Share article"
    >
      <Share2 className="h-4 w-4" />
    </Button>
  );
}
