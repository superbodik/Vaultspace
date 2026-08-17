import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateDataRoom } from '@/hooks/use-data-rooms';
import { Plus } from 'lucide-react';
import { Spinner } from '@/components/ui/page-spinner';

export function CreateDataRoomDialog() {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState('');
  const create = useCreateDataRoom();
  const navigate = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const room = await create.mutateAsync(name.trim());
      setOpen(false);
      setName('');
      toast.success('Data room created');
      navigate(`/rooms/${room.id}`);
    } catch {
      toast.error('Could not create data room');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          New data room
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>New data room</DialogTitle>
            <DialogDescription>Give your data room a name. You can rename it later.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="room-name">Name</Label>
            <Input
              id="room-name"
              autoFocus
              placeholder="Project Falcon — Acquisition"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || create.isPending}>
              {create.isPending && <Spinner className="size-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
