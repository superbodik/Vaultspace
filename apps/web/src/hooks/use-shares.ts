import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Share, ShareMode, ShareResourceType } from '@/types/api';

export function useResourceShares(resourceType: ShareResourceType, resourceId: string | undefined) {
  return useQuery({
    queryKey: ['shares', resourceType, resourceId],
    queryFn: () => api.get<Share[]>(`/shares/resource?resourceType=${resourceType}&resourceId=${resourceId}`),
    enabled: !!resourceId,
  });
}

export function useCreateShare(resourceType: ShareResourceType, resourceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { mode: ShareMode; emails?: string[] }) =>
      api.post<Share>('/shares', { resourceType, resourceId, ...input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shares', resourceType, resourceId] }),
  });
}

export function useAddGrants(resourceType: ShareResourceType, resourceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { shareId: string; emails: string[] }) =>
      api.post<Share>(`/shares/${input.shareId}/grants`, { emails: input.emails }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shares', resourceType, resourceId] }),
  });
}

export function useRemoveGrant(resourceType: ShareResourceType, resourceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { shareId: string; grantId: string }) => api.delete(`/shares/${input.shareId}/grants/${input.grantId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shares', resourceType, resourceId] }),
  });
}

export function useRevokeShare(resourceType: ShareResourceType, resourceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (shareId: string) => api.delete(`/shares/${shareId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shares', resourceType, resourceId] }),
  });
}
