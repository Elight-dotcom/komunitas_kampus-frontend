import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  FileText,
  ImageIcon,
  Loader2,
  PlayCircle,
  UploadCloud,
  X,
} from "lucide-react";
import {
  ChangeEvent,
  DragEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

import { postsApi } from "@/api/posts/posts.api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  CreatePostMediaItemPayload,
  PostMediaType,
  PostVisibility,
} from "@/types/posts/post.types";

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;
const MAX_IMAGE_COUNT = 3;

const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".mp4", ".pdf"];

interface CreatePostModalProps {
  orgId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type SelectedMedia = {
  id: string;
  file: File;
  mediaType: PostMediaType;
  previewUrl: string | null;
};

function getFileExtension(fileName: string) {
  const dotIndex = fileName.lastIndexOf(".");

  if (dotIndex < 0) {
    return "";
  }

  return fileName.slice(dotIndex).toLowerCase();
}

function getMediaTypeFromFile(file: File): PostMediaType | null {
  const extension = getFileExtension(file.name);

  if ([".jpg", ".jpeg", ".png"].includes(extension)) {
    return PostMediaType.Image;
  }

  if (extension === ".mp4") {
    return PostMediaType.Video;
  }

  if (extension === ".pdf") {
    return PostMediaType.Document;
  }

  return null;
}

function getMediaTypeLabel(mediaType: PostMediaType) {
  if (mediaType === PostMediaType.Image) return "Image";
  if (mediaType === PostMediaType.Video) return "Video";
  return "PDF";
}

function getContentType(file: File, mediaType: PostMediaType) {
  if (file.type) {
    return file.type;
  }

  if (mediaType === PostMediaType.Image) return "image/jpeg";
  if (mediaType === PostMediaType.Video) return "video/mp4";
  return "application/pdf";
}

function formatFileSize(bytes: number) {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(2)} MB`;
}

function MediaIcon({ mediaType }: { mediaType: PostMediaType }) {
  if (mediaType === PostMediaType.Image) {
    return <ImageIcon className="h-5 w-5 text-indigo-700" />;
  }

  if (mediaType === PostMediaType.Video) {
    return <PlayCircle className="h-5 w-5 text-violet-700" />;
  }

  return <FileText className="h-5 w-5 text-red-600" />;
}

export function CreatePostModal({
  orgId,
  open,
  onOpenChange,
}: CreatePostModalProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploadedBytesRef = useRef<Record<string, number>>({});

  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [visibility, setVisibility] = useState<PostVisibility>(
    PostVisibility.Internal,
  );
  const [selectedMedia, setSelectedMedia] = useState<SelectedMedia[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isPublishing, setIsPublishing] = useState(false);

  const totalUploadBytes = useMemo(() => {
    return selectedMedia.reduce((total, item) => total + item.file.size, 0);
  }, [selectedMedia]);

  const resetForm = () => {
    selectedMedia.forEach((item) => {
      if (item.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }
    });

    setTitle("");
    setCaption("");
    setVisibility(PostVisibility.Internal);
    setSelectedMedia([]);
    setError(null);
    setUploadProgress(0);
    setIsPublishing(false);
    uploadedBytesRef.current = {};

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    if (!open) {
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const validateFiles = (files: File[]) => {
    if (files.length === 0) {
      return "File belum dipilih.";
    }

    const invalidExtensionFile = files.find((file) => {
      return !ALLOWED_EXTENSIONS.includes(getFileExtension(file.name));
    });

    if (invalidExtensionFile) {
      return `File ${invalidExtensionFile.name} tidak didukung. Gunakan .jpg, .jpeg, .png, .mp4, atau .pdf.`;
    }

    const oversizedFile = files.find((file) => file.size > MAX_FILE_SIZE_BYTES);

    if (oversizedFile) {
      return `Ukuran ${oversizedFile.name} adalah ${formatFileSize(
        oversizedFile.size,
      )}. Maksimal 20MB per file.`;
    }

    const mediaTypes = new Set(files.map(getMediaTypeFromFile));

    if (mediaTypes.has(null)) {
      return "Ada file yang tidak bisa dikenali tipe medianya.";
    }

    if (mediaTypes.size > 1) {
      return "Satu postingan hanya boleh berisi satu tipe media. Jangan campur image, video, dan PDF.";
    }

    const firstMediaType = getMediaTypeFromFile(files[0]);

    if (firstMediaType !== PostMediaType.Image && files.length > 1) {
      return "Video dan PDF hanya boleh satu file dalam satu postingan.";
    }

    if (
      firstMediaType === PostMediaType.Image &&
      files.length > MAX_IMAGE_COUNT
    ) {
      return "Maksimal 3 gambar dalam satu postingan.";
    }

    return null;
  };

  const buildSelectedMedia = (files: File[]) => {
    return files.map((file) => {
      const mediaType = getMediaTypeFromFile(file)!;

      return {
        id: crypto.randomUUID(),
        file,
        mediaType,
        previewUrl:
          mediaType === PostMediaType.Image ? URL.createObjectURL(file) : null,
      };
    });
  };

  const handleFiles = (files: File[]) => {
    const validationError = validateFiles(files);

    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    selectedMedia.forEach((item) => {
      if (item.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }
    });

    setError(null);
    setUploadProgress(0);
    uploadedBytesRef.current = {};
    setSelectedMedia(buildSelectedMedia(files));
  };

  const handleInputFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFiles(Array.from(event.target.files ?? []));
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    handleFiles(Array.from(event.dataTransfer.files ?? []));
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const removeSelectedFile = (mediaId: string) => {
    setSelectedMedia((items) => {
      const removedItem = items.find((item) => item.id === mediaId);

      if (removedItem?.previewUrl) {
        URL.revokeObjectURL(removedItem.previewUrl);
      }

      return items.filter((item) => item.id !== mediaId);
    });
  };

  const updateAggregateProgress = (mediaId: string, loaded: number) => {
    uploadedBytesRef.current[mediaId] = loaded;

    const uploadedBytes = Object.values(uploadedBytesRef.current).reduce(
      (total, current) => total + current,
      0,
    );

    const nextProgress =
      totalUploadBytes > 0
        ? Math.round((uploadedBytes / totalUploadBytes) * 100)
        : 0;

    setUploadProgress(Math.min(100, nextProgress));
  };

  const handlePublish = async () => {
    if (!title.trim()) {
      setError("Judul wajib diisi.");
      toast.error("Judul wajib diisi.");
      return;
    }

    if (selectedMedia.length === 0) {
      setError("Minimal pilih satu file untuk postingan.");
      toast.error("Minimal pilih satu file untuk postingan.");
      return;
    }

    const validationError = validateFiles(
      selectedMedia.map((item) => item.file),
    );

    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    try {
      setIsPublishing(true);
      setError(null);
      setUploadProgress(0);
      uploadedBytesRef.current = {};

      const uploadedMediaItems: CreatePostMediaItemPayload[] = [];

      for (let index = 0; index < selectedMedia.length; index += 1) {
        const item = selectedMedia[index];

        let presignedUrl;

        try {
          presignedUrl = await postsApi.getPresignedUrl(
            orgId,
            item.file.name,
            item.mediaType,
            item.file.size,
          );
        } catch (presignedError) {
          throw new Error(
            `Gagal meminta presigned URL untuk ${item.file.name}. Cek token dan endpoint backend.`,
          );
        }

        try {
          await axios.put(presignedUrl.uploadUrl, item.file, {
            headers: {
              "Content-Type": getContentType(item.file, item.mediaType),
            },
            onUploadProgress: (progressEvent) => {
              updateAggregateProgress(item.id, progressEvent.loaded);
            },
          });
        } catch (uploadError) {
          throw new Error(
            `Upload ${item.file.name} ke MinIO gagal. Pastikan MinIO aktif dan CORS bucket sudah benar.`,
          );
        }

        uploadedMediaItems.push({
          fileKey: presignedUrl.fileKey,
          mediaType: item.mediaType,
          fileSize: item.file.size,
          orderIndex: index,
        });

        updateAggregateProgress(item.id, item.file.size);
      }

      try {
        await postsApi.createPost(orgId, {
          title: title.trim(),
          caption: caption.trim() ? caption.trim() : null,
          visibility,
          isPinned: false,
          pinOrder: null,
          mediaItems: uploadedMediaItems,
        });
      } catch (createError) {
        throw new Error(
          "File sudah ter-upload ke MinIO, tetapi backend gagal menyimpan post. Cek payload createPost.",
        );
      }

      await queryClient.invalidateQueries({
        queryKey: ["posts", "feed", orgId],
      });

      toast.success("Postingan berhasil dipublikasikan.");
      onOpenChange(false);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Gagal membuat postingan. Coba lagi.";

      setError(message);
      toast.error(message);
    } finally {
      setIsPublishing(false);
    }
  };

  const selectedMediaType = selectedMedia[0]?.mediaType;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Buat Postingan Baru</DialogTitle>
          <DialogDescription>
            Upload langsung ke MinIO lewat presigned URL, lalu simpan metadata
            post ke backend.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="post-title">Judul</Label>
            <Input
              id="post-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Contoh: Open Recruitment HIMIT 2026"
              disabled={isPublishing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="post-caption">Caption</Label>
            <Textarea
              id="post-caption"
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              placeholder="Tulis deskripsi singkat postingan..."
              disabled={isPublishing}
              className="min-h-28 resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label>Visibility</Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: PostVisibility.Private, label: "Private" },
                { value: PostVisibility.Internal, label: "Internal" },
                { value: PostVisibility.Public, label: "Public" },
              ].map((item) => (
                <Button
                  key={item.value}
                  type="button"
                  variant={visibility === item.value ? "default" : "outline"}
                  className="rounded-full"
                  onClick={() => setVisibility(item.value)}
                  disabled={isPublishing}
                >
                  {item.label}
                </Button>
              ))}
            </div>
            <p className="text-xs text-neutral-500">
              Default Internal: hanya anggota organisasi yang sudah accepted.
            </p>
          </div>

          <div className="space-y-3">
            <Label>Media</Label>
            <div
              role="button"
              tabIndex={0}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer rounded-2xl border-2 border-dashed border-neutral-300 bg-neutral-50 px-5 py-8 text-center transition hover:border-indigo-400 hover:bg-indigo-50/50"
            >
              <UploadCloud className="mx-auto h-10 w-10 text-indigo-700" />
              <p className="mt-3 text-sm font-semibold text-neutral-900">
                Drag & drop file di sini atau klik untuk pilih file
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                .jpg, .jpeg, .png, .mp4, .pdf — maksimal 20MB per file
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                Gambar maksimal 3 file. Video/PDF hanya 1 file.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.mp4,.pdf"
                onChange={handleInputFileChange}
                className="hidden"
                disabled={isPublishing}
              />
            </div>

            {selectedMedia.length > 0 && (
              <div className="space-y-3 rounded-2xl border bg-white p-3">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="gap-2 rounded-full">
                    <MediaIcon mediaType={selectedMediaType} />
                    {getMediaTypeLabel(selectedMediaType)}
                  </Badge>
                  <span className="text-xs text-neutral-500">
                    {selectedMedia.length} file dipilih
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {selectedMedia.map((item) => (
                    <div
                      key={item.id}
                      className="relative overflow-hidden rounded-xl border bg-neutral-50"
                    >
                      {item.mediaType === PostMediaType.Image &&
                      item.previewUrl ? (
                        <img
                          src={item.previewUrl}
                          alt={item.file.name}
                          className="aspect-square w-full object-cover"
                        />
                      ) : (
                        <div className="flex aspect-square flex-col items-center justify-center gap-2 p-4 text-center">
                          <MediaIcon mediaType={item.mediaType} />
                          <p className="line-clamp-2 text-xs font-semibold text-neutral-700">
                            {item.file.name}
                          </p>
                          <span className="text-[11px] text-neutral-500">
                            {formatFileSize(item.file.size)}
                          </span>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          removeSelectedFile(item.id);
                        }}
                        className="absolute right-2 top-2 rounded-full bg-black/65 p-1 text-white"
                        disabled={isPublishing}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isPublishing && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium text-neutral-600">
                  <span>Upload ke MinIO</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}

            {error && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPublishing}
          >
            Batal
          </Button>
          <Button
            type="button"
            onClick={handlePublish}
            disabled={
              isPublishing || !title.trim() || selectedMedia.length === 0
            }
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
