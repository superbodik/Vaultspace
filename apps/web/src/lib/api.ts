import type { ApiErrorBody } from '@/types/api';

export const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

export class ApiError extends Error {
  status: number;
  body: ApiErrorBody | null;

  constructor(status: number, body: ApiErrorBody | null) {
    const message = Array.isArray(body?.message) ? body.message.join(', ') : (body?.message ?? `Request failed (${status})`);
    super(message);
    this.status = status;
    this.body = body;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: init.body instanceof FormData ? undefined : { 'Content-Type': 'application/json' },
    ...init,
  });

  if (!res.ok) {
    let body: ApiErrorBody | null = null;
    try {
      body = await res.json();
    } catch {
      // no JSON body
    }
    throw new ApiError(res.status, body);
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  postForm: <T>(path: string, form: FormData) => request<T>(path, { method: 'POST', body: form }),
};

export interface UploadHandle {
  promise: Promise<unknown>;
  abort: () => void;
}

export function uploadWithProgress(
  path: string,
  formData: FormData,
  onProgress: (fraction: number) => void,
): UploadHandle {
  const xhr = new XMLHttpRequest();
  const promise = new Promise<unknown>((resolve, reject) => {
    xhr.open('POST', `${API_BASE}${path}`, true);
    xhr.withCredentials = true;

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded / e.total);
    };

    xhr.onload = () => {
      let body: unknown = null;
      try {
        body = xhr.responseText ? JSON.parse(xhr.responseText) : null;
      } catch {
        // ignore
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(1);
        resolve(body);
      } else {
        reject(new ApiError(xhr.status, body as ApiErrorBody | null));
      }
    };

    xhr.onerror = () => reject(new ApiError(0, { message: 'Network error while uploading' }));
    xhr.onabort = () => reject(new ApiError(0, { message: 'Upload cancelled' }));

    xhr.send(formData);
  });

  return { promise, abort: () => xhr.abort() };
}

export function fileUrl(fileId: string, opts: { shareToken?: string; download?: boolean; version?: number } = {}): string {
  const params = new URLSearchParams();
  if (opts.shareToken) params.set('shareToken', opts.shareToken);
  if (opts.download) params.set('download', '1');
  const suffix = opts.version !== undefined ? `/versions/${opts.version}/content` : '/content';
  const qs = params.toString();
  return `${API_BASE}/files/${fileId}${suffix}${qs ? `?${qs}` : ''}`;
}
