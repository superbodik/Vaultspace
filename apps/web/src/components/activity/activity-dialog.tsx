import { History } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ActivityFeed } from '@/components/activity/activity-feed';
import { useActivity } from '@/hooks/use-activity';

export function ActivityDialog({
  open,
  onOpenChange,
  dataRoomId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dataRoomId: string;
}) {
  const { data: events, isLoading } = useActivity(dataRoomId, open);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-lg overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="size-4" />
            Activity
          </DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto scrollbar-thin">
          {isLoading ? (
            <div className="flex flex-col gap-3 py-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <ActivityFeed events={events ?? []} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
