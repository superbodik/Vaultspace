import { Navigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Link2Off } from 'lucide-react';
import { Topbar } from '@/components/layout/topbar';
import { EmptyState } from '@/components/ui/empty-state';
import { PageSpinner } from '@/components/ui/page-spinner';
import { api } from '@/lib/api';
import type { PublicShareResolution } from '@/types/api';

export function PublicSharePage() {
  const { token } = useParams<{ token: string }>();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['shares', 'public', token],
    queryFn: () => api.get<PublicShareResolution>(`/shares/public/${token}`),
    enabled: !!token,
    retry: false,
  });

  if (isLoading) return <PageSpinner />;

  if (isError || !data) {
    return (
      <div className="min-h-screen">
        <Topbar />
        <main className="mx-auto max-w-md px-4 py-24 text-center">
          <EmptyState icon={Link2Off} title="This link is invalid or has been revoked" description="Ask the owner for a new link." />
        </main>
      </div>
    );
  }

  if (data.resourceType === 'FILE' && data.fileId) {
    return <Navigate to={`/files/${data.fileId}?st=${data.token}`} replace />;
  }
  if (data.resourceType === 'FOLDER' && data.folderId) {
    return <Navigate to={`/rooms/${data.dataRoomId}?folder=${data.folderId}&st=${data.token}`} replace />;
  }
  return <Navigate to={`/rooms/${data.dataRoomId}?st=${data.token}`} replace />;
}
