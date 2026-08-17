import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { BrowseResponse, FileItem, FolderItem, FolderStats, SearchResults } from '@/types/api';

export function browseKey(dataRoomId: string | undefined, folderId: string | null, shareToken?: string) {
  return ['browse', dataRoomId, folderId, shareToken];
}

export function useBrowse(dataRoomId: string | undefined, folderId: string | null, shareToken?: string) {
  return useQuery({
    queryKey: browseKey(dataRoomId, folderId, shareToken),
    queryFn: () => {
      const params = new URLSearchParams();
      if (folderId) params.set('folderId', folderId);
      if (shareToken) params.set('shareToken', shareToken);
      const qs = params.toString();
      return api.get<BrowseResponse>(`/data-rooms/${dataRoomId}/browse${qs ? `?${qs}` : ''}`);
    },
    enabled: !!dataRoomId,
  });
}

export function useSearch(dataRoomId: string | undefined, query: string, shareToken?: string) {
  return useQuery({
    queryKey: ['search', dataRoomId, query, shareToken],
    queryFn: () => {
      const params = new URLSearchParams({ q: query });
      if (shareToken) params.set('shareToken', shareToken);
      return api.get<SearchResults>(`/data-rooms/${dataRoomId}/search?${params.toString()}`);
    },
    enabled: !!dataRoomId && query.trim().length > 0,
  });
}

export function useFolderStats(folderId: string | undefined, shareToken?: string) {
  return useQuery({
    queryKey: ['folder', folderId, 'stats', shareToken],
    queryFn: () => api.get<FolderStats>(`/folders/${folderId}/stats${shareToken ? `?shareToken=${shareToken}` : ''}`),
    enabled: !!folderId,
  });
}

export function useCreateFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { dataRoomId: string; parentId?: string; name: string }) =>
      api.post<FolderItem>('/folders', input),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: browseKey(vars.dataRoomId, vars.parentId ?? null) });
      qc.invalidateQueries({ queryKey: ['dataRooms'] });
    },
  });
}

export function useRenameFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; name: string }) => api.patch<FolderItem>(`/folders/${input.id}/rename`, { name: input.name }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['browse'] }),
  });
}

export function useMoveFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; targetFolderId?: string; resolvedName?: string }) =>
      api.patch(`/folders/${input.id}/move`, { targetFolderId: input.targetFolderId, resolvedName: input.resolvedName }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['browse'] }),
  });
}

export function useDeleteFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/folders/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['browse'] });
      qc.invalidateQueries({ queryKey: ['dataRooms'] });
    },
  });
}

export function useRenameFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; name: string }) => api.patch<FileItem>(`/files/${input.id}/rename`, { name: input.name }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['browse'] }),
  });
}

export function useMoveFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; targetFolderId?: string; resolvedName?: string }) =>
      api.patch(`/files/${input.id}/move`, { targetFolderId: input.targetFolderId, resolvedName: input.resolvedName }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['browse'] }),
  });
}

export function useDeleteFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/files/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['browse'] });
      qc.invalidateQueries({ queryKey: ['dataRooms'] });
    },
  });
}
