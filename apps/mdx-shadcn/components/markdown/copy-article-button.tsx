"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@rocky/ui/components/button";

export function CopyArticleButton() {
  const [hasCopied, setHasCopied] = useState(false);

  const copyArticleText = async () => {
    try {
      const article = document.querySelector("article");
      if (!article) {
        console.error("Article not found");
        return;
      }

      const text = article.innerText || article.innerText || "";

      if (!text.trim()) {
        console.error("No content to copy");
        return;
      }

      await navigator.clipboard.writeText(text);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy text: ", error);
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={copyArticleText}
      aria-label="Copy article text"
    >
      {hasCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </Button>
  );
}
