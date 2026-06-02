export function resolveBackblazeFileUrl(fileUrl: string) {
  if (!fileUrl) return "";

  if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
    return fileUrl;
  }

  const publicBaseUrl = import.meta.env.VITE_BACKBLAZE_PUBLIC_BASE_URL as
    | string
    | undefined;

  if (!publicBaseUrl) {
    return fileUrl;
  }

  return `${publicBaseUrl.replace(/\/$/, "")}/${fileUrl.replace(/^\//, "")}`;
}

export function getBackblazeEndpoint() {
  return import.meta.env.VITE_BACKBLAZE_ENDPOINT as string | undefined;
}

export function getBackblazeBucketName() {
  return import.meta.env.VITE_BACKBLAZE_BUCKET_NAME as string | undefined;
}