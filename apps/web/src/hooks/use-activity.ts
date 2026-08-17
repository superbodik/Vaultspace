import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ActivityEvent } from '@/types/api';

export function useActivity(dataRoomId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['activity', dataRoomId],
    queryFn: () => api.get<ActivityEvent[]>(`/data-rooms/${dataRoomId}/activity`),
    enabled: enabled && !!dataRoomId,
    refetchInterval: 15_000,
  });
}
