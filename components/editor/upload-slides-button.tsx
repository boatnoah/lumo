"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type ChangeEvent, type ComponentProps } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type UploadSlidesButtonProps = {
  sessionId: string | number;
  label?: string;
  variant?: ComponentProps<typeof Button>["variant"];
  size?: ComponentProps<typeof Button>["size"];
  fullWidth?: boolean;
};

type UploadResponse = {
  error?: string;
  createdSlides?: number;
};

export function UploadSlidesButton({
  sessionId,
  label = "Upload slides PDF",
  variant = "secondary",
  size,
  fullWidth = true,
}: UploadSlidesButtonProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleSelect = () => {
    inputRef.current?.click();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.type !== "application/pdf") {
      toast.error("Please select a PDF file");
      event.target.value = "";
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("sessionId", String(sessionId));
      formData.append("file", file);

      const response = await fetch("/api/slides/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const payload = (await response
          .json()
          .catch(() => ({}))) as UploadResponse;
        throw new Error(payload.error ?? "Failed to process PDF");
      }

      const payload = (await response.json()) as UploadResponse;
      toast.success(
        payload.createdSlides
          ? `Added ${payload.createdSlides} slide${
              payload.createdSlides > 1 ? "s" : ""
            }`
          : "Slides added",
      );
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to upload slides";
      toast.error(message);
    } finally {
      event.target.value = "";
      setIsUploading(false);
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="sr-only"
        onChange={handleFileChange}
        disabled={isUploading}
      />
      <Button
        className={cn(fullWidth ? "w-full justify-start" : undefined)}
        variant={variant}
        size={size}
        onClick={handleSelect}
        disabled={isUploading}
      >
        {isUploading ? "Uploading..." : label}
      </Button>
    </>
  );
}
