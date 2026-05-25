import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  FileVideo,
  ImageIcon,
  Loader2,
  Plus,
  Type,
  UploadCloud,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { storiesApi } from "@/api/stories/stories.api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { StoryMediaType } from "@/types/stories/story.types";

interface CreateStoryModalProps {
  orgId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type StoryTab = "text" | "media";

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".mp4"] as const;

const BACKGROUND_PRESETS = [
  "linear-gradient(135deg, #4f46e5, #ec4899)",
  "linear-gradient(135deg, #0f172a, #334155)",
  "linear-gradient(135deg, #16a34a, #84cc16)",
  "linear-gradient(135deg, #ea580c, #facc15)",
  "linear-gradient(135deg, #9333ea, #2563eb)",
  "linear-gradient(135deg, #be123c, #fb7185)",
];

function getFileExtension(fileName: string) {
  const lastDotIndex = fileName.lastIndexOf(".");
  if (lastDotIndex === -1) return "";
  return fileName.slice(lastDotIndex).toLowerCase();
}

function getStoryMediaTypeFromFile(file: File) {
  const extension = getFileExtension(file.name);

  if (extension === ".mp4") {
    return StoryMediaType.Video;
  }

  return StoryMediaType.Image;
}

function getContentType(file: File) {
  if (file.type) return file.type;

  const extension = getFileExtension(file.name);

  if (extension === ".mp4") return "video/mp4";
  if (extension === ".png") return "image/png";

  return "image/jpeg";
}

function extractApiError(error: unknown) {
  const maybeAxiosError = error as {
    response?: {
      data?: {
        message?: string;
        errors?: Record<string, string[]>;
      };
    };
    message?: string;
  };

  const message =
    maybeAxiosError.response?.data?.message ??
    maybeAxiosError.message ??
    "Terjadi kesalahan.";

  const joinedErrors = maybeAxiosError.response?.data?.errors
    ? Object.values(maybeAxiosError.response.data.errors).flat().join(" ")
    : "";

  return joinedErrors ? `${message} ${joinedErrors}` : message;
}

function isLimitError(message: string) {
  return (
    message.toLowerCase().includes("10 story") ||
    message.toLowerCase().includes("batas maksimal")
  );
}

export function CreateStoryModal({
  orgId,
  open,
  onOpenChange,
  onSuccess,
}: CreateStoryModalProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [tab, setTab] = useState<StoryTab>("text");
  const [textContent, setTextContent] = useState("");
  const [backgroundColor, setBackgroundColor] = useState(BACKGROUND_PRESETS[0]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isPublishing, setIsPublishing] = useState(false);

  const isTextInvalid =
    textContent.trim().length === 0 || textContent.length > 280;

  const mediaType = useMemo(() => {
    if (!selectedFile) return null;
    return getStoryMediaTypeFromFile(selectedFile);
  }, [selectedFile]);

  const resetForm = () => {
    setTab("text");
    setTextContent("");
    setBackgroundColor(BACKGROUND_PRESETS[0]);
    setSelectedFile(null);
    setPreviewUrl(null);
    setInlineError(null);
    setUploadProgress(0);
    setIsPublishing(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  const validateFile = (file: File) => {
    const extension = getFileExtension(file.name);

    if (!ALLOWED_EXTENSIONS.includes(extension as any)) {
      return "File story hanya boleh .jpg, .jpeg, .png, atau .mp4.";
    }

    if (file.size > MAX_FILE_SIZE) {
      return "Ukuran file story maksimal 20MB.";
    }

    return null;
  };

  const handleSelectFile = (file: File) => {
    const error = validateFile(file);

    if (error) {
      setInlineError(error);
      setSelectedFile(null);
      return;
    }

    setInlineError(null);
    setSelectedFile(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();

    const [file] = Array.from(event.dataTransfer.files);

    if (file) {
      handleSelectFile(file);
    }
  };

  const handlePublishText = async () => {
    if (isTextInvalid) {
      setInlineError("Teks story wajib diisi dan maksimal 280 karakter.");
      return;
    }

    setIsPublishing(true);
    setInlineError(null);

    try {
      await storiesApi.createStory(orgId, {
        mediaType: StoryMediaType.Text,
        textContent: textContent.trim(),
        fileKey: null,
        backgroundColor,
      });

      toast.success("Story teks berhasil dipublish.");
      await queryClient.invalidateQueries({ queryKey: ["stories", "active"] });
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      const message = extractApiError(error);
      const friendlyMessage = isLimitError(message)
        ? "Batas maksimal 10 story aktif tercapai. Tunggu story sebelumnya kedaluwarsa."
        : message;

      setInlineError(friendlyMessage);
      toast.error(friendlyMessage);
    } finally {
      setIsPublishing(false);
    }
  };

  const handlePublishMedia = async () => {
    if (!selectedFile || !mediaType) {
      setInlineError("Pilih gambar atau video terlebih dahulu.");
      return;
    }

    const validationError = validateFile(selectedFile);
    if (validationError) {
      setInlineError(validationError);
      return;
    }

    setIsPublishing(true);
    setInlineError(null);
    setUploadProgress(0);

    try {
      const presigned = await storiesApi.getPresignedUrl(
        orgId,
        selectedFile.name,
        mediaType,
        selectedFile.size,
      );

      await axios.put(presigned.uploadUrl, selectedFile, {
        headers: {
          "Content-Type": getContentType(selectedFile),
        },
        onUploadProgress: (event) => {
          if (!event.total) return;
          setUploadProgress(Math.round((event.loaded / event.total) * 100));
        },
      });

      await storiesApi.createStory(orgId, {
        mediaType,
        fileKey: presigned.fileKey,
        textContent: null,
        backgroundColor: null,
      });

      toast.success("Story media berhasil dipublish.");
      await queryClient.invalidateQueries({ queryKey: ["stories", "active"] });
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      const message = extractApiError(error);
      const friendlyMessage = isLimitError(message)
        ? "Batas maksimal 10 story aktif tercapai. Tunggu story sebelumnya kedaluwarsa."
        : message;

      setInlineError(friendlyMessage);
      toast.error(friendlyMessage);
    } finally {
      setIsPublishing(false);
    }
  };

  const handlePublish = () => {
    if (tab === "text") {
      void handlePublishText();
      return;
    }

    void handlePublishMedia();
  };

  const publishDisabled =
    isPublishing || (tab === "text" ? isTextInvalid : !selectedFile);

  const selectedFileTypeLabel =
    mediaType === StoryMediaType.Video ? "Video" : "Foto";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Buat Story Baru</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(value) => setTab(value as StoryTab)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="text" className="gap-2">
              <Type className="h-4 w-4" />
              Teks
            </TabsTrigger>
            <TabsTrigger value="media" className="gap-2">
              <ImageIcon className="h-4 w-4" />
              Media
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Textarea
                value={textContent}
                onChange={(event) => {
                  setTextContent(event.target.value);
                  setInlineError(null);
                }}
                maxLength={280}
                placeholder="Tulis pengumuman singkat..."
                className="min-h-28 resize-none"
                disabled={isPublishing}
              />
              <div
                className={`text-right text-xs ${
                  textContent.length > 280 ? "text-red-600" : "text-neutral-500"
                }`}
              >
                {textContent.length}/280
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-neutral-800">
                Pilih background
              </p>
              <div className="flex flex-wrap gap-2">
                {BACKGROUND_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setBackgroundColor(preset)}
                    className={`h-10 w-10 rounded-full ring-offset-2 transition ${
                      backgroundColor === preset
                        ? "ring-2 ring-indigo-700"
                        : "ring-1 ring-neutral-200"
                    }`}
                    style={{ background: preset }}
                    aria-label="Pilih warna background"
                  />
                ))}
              </div>
            </div>

            <div
              className="flex aspect-[9/16] max-h-[420px] w-full items-center justify-center rounded-3xl px-6 text-center shadow-inner"
              style={{ background: backgroundColor }}
            >
              <p className="whitespace-pre-line text-2xl font-extrabold leading-tight text-white">
                {textContent.trim() || "Preview story teks kamu"}
              </p>
            </div>
          </TabsContent>

          <TabsContent value="media" className="space-y-4 pt-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.mp4,image/jpeg,image/png,video/mp4"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];

                if (file) {
                  handleSelectFile(file);
                }
              }}
            />

            {!selectedFile && (
              <div
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-neutral-300 bg-neutral-50 p-8 text-center transition hover:border-indigo-300 hover:bg-indigo-50"
              >
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
                  <UploadCloud className="h-7 w-7 text-indigo-700" />
                </div>
                <p className="font-bold text-neutral-900">
                  Drag & drop foto/video di sini
                </p>
                <p className="mt-1 text-sm text-neutral-500">
                  .jpg, .jpeg, .png, .mp4 maksimal 20MB
                </p>
                <Button type="button" className="mt-5 gap-2">
                  <Plus className="h-4 w-4" />
                  Pilih File
                </Button>
              </div>
            )}

            {selectedFile && previewUrl && (
              <div className="overflow-hidden rounded-3xl border bg-white">
                <div className="flex items-center justify-between border-b px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    {mediaType === StoryMediaType.Video ? (
                      <FileVideo className="h-5 w-5 shrink-0 text-rose-600" />
                    ) : (
                      <ImageIcon className="h-5 w-5 shrink-0 text-indigo-700" />
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {selectedFileTypeLabel} ·{" "}
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setInlineError(null);
                    }}
                    disabled={isPublishing}
                    className="rounded-full p-2 hover:bg-neutral-100 disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex max-h-[420px] justify-center bg-neutral-950">
                  {mediaType === StoryMediaType.Video ? (
                    <video
                      src={previewUrl}
                      controls
                      className="max-h-[420px] w-full object-contain"
                    />
                  ) : (
                    <img
                      src={previewUrl}
                      alt="Preview story"
                      className="max-h-[420px] w-full object-contain"
                    />
                  )}
                </div>
              </div>
            )}

            {isPublishing && uploadProgress > 0 && (
              <div className="space-y-2">
                <Progress value={uploadProgress} />
                <p className="text-right text-xs font-semibold text-neutral-500">
                  Upload {uploadProgress}%
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {inlineError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {inlineError}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            disabled={isPublishing}
            onClick={() => onOpenChange(false)}
          >
            Batal
          </Button>
          <Button
            type="button"
            disabled={publishDisabled}
            onClick={handlePublish}
            className="bg-indigo-800 hover:bg-indigo-900"
          >
            {isPublishing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Publish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
