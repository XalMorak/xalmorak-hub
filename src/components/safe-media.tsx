import type { ChatMessage } from "@/lib/chat";

export const IMAGE_MAX = 350_000;
export const VIDEO_MAX = 1_500_000;

const IMAGE_DATA = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/;
const VIDEO_DATA = /^data:video\/(mp4|webm);base64,[A-Za-z0-9+/]+=*$/;
const YT = /^https:\/\/www\.youtube-nocookie\.com\/embed\/[A-Za-z0-9_-]{11}$/;
const VIMEO = /^https:\/\/player\.vimeo\.com\/video\/\d{6,12}$/;

function isHttpsMediaFile(src: string): boolean {
  try {
    const url = new URL(src);
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      /\.(mp4|webm)$/i.test(url.pathname)
    );
  } catch {
    return false;
  }
}

export function SafeMedia({ message }: { message: ChatMessage }) {
  const data = message.attachment_data;
  if (!data) return null;

  if (message.attachment_kind === "image" && IMAGE_DATA.test(data)) {
    return (
      <img
        src={data}
        alt=""
        className="mt-2 max-h-64 w-full rounded-md object-cover"
      />
    );
  }

  if (message.attachment_kind === "video" && VIDEO_DATA.test(data)) {
    return (
      <video
        src={data}
        controls
        playsInline
        className="mt-2 max-h-64 w-full rounded-md"
      />
    );
  }

  if (message.attachment_kind === "video_url") {
    if (YT.test(data) || VIMEO.test(data)) {
      return (
        <iframe
          src={data}
          title="Video"
          className="mt-2 aspect-video w-full rounded-md"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox="allow-scripts allow-same-origin allow-presentation"
        />
      );
    }
    if (isHttpsMediaFile(data)) {
      return (
        <video
          src={data}
          controls
          playsInline
          className="mt-2 max-h-64 w-full rounded-md"
        />
      );
    }
  }

  return null;
}

export function fileToDataUrl(file: File, maxBytes: number): Promise<string> {
  if (file.size > maxBytes) {
    return Promise.reject(new Error("size"));
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("read"));
    reader.readAsDataURL(file);
  });
}
