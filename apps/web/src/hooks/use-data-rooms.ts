import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { DataRoomDetail, DataRoomListItem, DataRoomStats, SharedWithMeItem } from '@/types/api';

export function useMyDataRooms() {
  return useQuery({
    queryKey: ['dataRooms'],
    queryFn: () => api.get<DataRoomListItem[]>('/data-rooms'),
  });
}

export function useSharedWithMe() {
  return useQuery({
    queryKey: ['dataRooms', 'shared'],
    queryFn: () => api.get<SharedWithMeItem[]>('/data-rooms/shared-with-me'),
  });
}

export function useDataRoom(id: string | undefined, shareToken?: string) {
  return useQuery({
    queryKey: ['dataRoom', id, shareToken],
    queryFn: () => api.get<DataRoomDetail>(`/data-rooms/${id}${shareToken ? `?shareToken=${shareToken}` : ''}`),
    enabled: !!id,
  });
}

export function useDataRoomStats(id: string | undefined, shareToken?: string) {
  return useQuery({
    queryKey: ['dataRoom', id, 'stats', shareToken],
    queryFn: () => api.get<DataRoomStats>(`/data-rooms/${id}/stats${shareToken ? `?shareToken=${shareToken}` : ''}`),
    enabled: !!id,
  });
}

export function useCreateDataRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.post<DataRoomListItem>('/data-rooms', { name }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dataRooms'] }),
  });
}

export function useRenameDataRoom(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.patch(`/data-rooms/${id}`, { name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dataRooms'] });
      qc.invalidateQueries({ queryKey: ['dataRoom', id] });
    },
  });
}

export function useDeleteDataRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/data-rooms/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dataRooms'] }),
  });
}
