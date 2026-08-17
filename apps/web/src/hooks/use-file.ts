import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { FileItem, FileVersionInfo } from '@/types/api';

export function useFile(fileId: string | undefined, shareToken?: string) {
  return useQuery({
    queryKey: ['file', fileId, shareToken],
    queryFn: () => api.get<FileItem & { accessRole: string }>(`/files/${fileId}${shareToken ? `?shareToken=${shareToken}` : ''}`),
    enabled: !!fileId,
  });
}

export function useFileVersions(fileId: string | undefined, shareToken?: string) {
  return useQuery({
    queryKey: ['file', fileId, 'versions', shareToken],
    queryFn: () => api.get<FileVersionInfo[]>(`/files/${fileId}/versions${shareToken ? `?shareToken=${shareToken}` : ''}`),
    enabled: !!fileId,
  });
}

export function useUploadNewVersion(fileId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return api.postForm<FileItem>(`/files/${fileId}/versions`, form);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['file', fileId] });
    },
  });
}
