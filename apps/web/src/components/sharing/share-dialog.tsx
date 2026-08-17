import * as React from 'react';
import { toast } from 'sonner';
import { Check, Copy, Globe2, Link2, Users, X } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useAddGrants, useCreateShare, useRemoveGrant, useResourceShares, useRevokeShare } from '@/hooks/use-shares';
import type { ShareResourceType } from '@/types/api';
import { initials } from '@/lib/format';
import { Spinner } from '@/components/ui/page-spinner';

const RESOURCE_LABEL: Record<ShareResourceType, string> = {
  DATA_ROOM: 'data room',
  FOLDER: 'folder',
  FILE: 'file',
};

function parseEmails(raw: string): string[] {
  return [...new Set(raw.split(/[\s,;]+/).map((e) => e.trim().toLowerCase()).filter(Boolean))];
}

export function ShareDialog({
  open,
  onOpenChange,
  resourceType,
  resourceId,
  resourceName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resourceType: ShareResourceType;
  resourceId: string;
  resourceName: string;
}) {
  const { data: shares, isLoading } = useResourceShares(resourceType, open ? resourceId : undefined);
  const createShare = useCreateShare(resourceType, resourceId);
  const revokeShare = useRevokeShare(resourceType, resourceId);
  const addGrants = useAddGrants(resourceType, resourceId);
  const removeGrant = useRemoveGrant(resourceType, resourceId);

  const publicShare = shares?.find((s) => s.mode === 'PUBLIC_LINK');
  const permissionedShare = shares?.find((s) => s.mode === 'PERMISSIONED');

  const [emailInput, setEmailInput] = React.useState('');
  const [copied, setCopied] = React.useState(false);

  const publicUrl = publicShare ? `${window.location.origin}/share/${publicShare.token}` : null;

  const handleCopy = async () => {
    if (!publicUrl) return;
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleInvite = async () => {
    const emails = parseEmails(emailInput);
    if (!emails.length) return;
    try {
      if (permissionedShare) {
        await addGrants.mutateAsync({ shareId: permissionedShare.id, emails });
      } else {
        await createShare.mutateAsync({ mode: 'PERMISSIONED', emails });
      }
      setEmailInput('');
      toast.success(`Invited ${emails.length} ${emails.length === 1 ? 'person' : 'people'}`);
    } catch {
      toast.error('Could not send invite');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Share &ldquo;{resourceName}&rdquo;</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : (
          <Tabs defaultValue="people">
            <TabsList className="mb-4">
              <TabsTrigger value="people">
                <Users className="mr-1.5 inline size-3.5" />
                People
              </TabsTrigger>
              <TabsTrigger value="link">
                <Link2 className="mr-1.5 inline size-3.5" />
                Public link
              </TabsTrigger>
            </TabsList>

            <TabsContent value="people" className="flex flex-col gap-4">
              <div className="flex gap-2">
                <Input
                  placeholder="email@company.com, another@company.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleInvite();
                    }
                  }}
                />
                <Button onClick={handleInvite} disabled={!parseEmails(emailInput).length || addGrants.isPending || createShare.isPending}>
                  {(addGrants.isPending || createShare.isPending) && <Spinner className="size-4 animate-spin" />}
                  Invite
                </Button>
              </div>

              <div className="flex flex-col gap-1">
                {permissionedShare?.grants.length ? (
                  permissionedShare.grants.map((grant) => (
                    <div key={grant.id} className="flex items-center gap-2.5 rounded-lg px-1 py-1.5">
                      <Avatar className="size-7">
                        <AvatarFallback className="text-[10px]">{initials(grant.email)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-ink-800 dark:text-ink-100">{grant.email}</p>
                      </div>
                      <span className="text-xs text-ink-400">Can view</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() => removeGrant.mutate({ shareId: permissionedShare.id, grantId: grant.id })}
                      >
                        <X className="size-3.5" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="px-1 py-2 text-sm text-ink-400">No one else has access yet.</p>
                )}
              </div>

              {permissionedShare && permissionedShare.grants.length > 0 && (
                <button
                  type="button"
                  className="w-fit text-xs font-medium text-red-600 underline-offset-2 hover:underline"
                  onClick={() => revokeShare.mutate(permissionedShare.id)}
                >
                  Revoke access for everyone
                </button>
              )}
            </TabsContent>

            <TabsContent value="link" className="flex flex-col gap-3">
              {publicShare ? (
                <>
                  <div className="flex items-center gap-2 rounded-lg border border-ink-100 bg-ink-50 p-1.5 pl-3 dark:border-ink-800 dark:bg-ink-800/50">
                    <Globe2 className="size-4 shrink-0 text-ink-400" />
                    <span className="min-w-0 flex-1 truncate text-sm text-ink-600 dark:text-ink-300">{publicUrl}</span>
                    <Button size="sm" variant="secondary" onClick={handleCopy}>
                      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                      {copied ? 'Copied' : 'Copy'}
                    </Button>
                  </div>
                  <p className="text-xs text-ink-400">Anyone with this link can view — no sign-in required.</p>
                  <button
                    type="button"
                    className="w-fit text-xs font-medium text-red-600 underline-offset-2 hover:underline"
                    onClick={() => revokeShare.mutate(publicShare.id)}
                  >
                    Revoke link
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-start gap-2">
                  <p className="text-sm text-ink-500">Create a link that gives read-only access to anyone who has it.</p>
                  <Button
                    variant="secondary"
                    onClick={() => createShare.mutate({ mode: 'PUBLIC_LINK' })}
                    disabled={createShare.isPending}
                  >
                    {createShare.isPending && <Spinner className="size-4 animate-spin" />}
                    <Link2 className="size-4" />
                    Create public link
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter>
          <p className="mr-auto text-xs text-ink-400">
            Recipients get read-only access to this {RESOURCE_LABEL[resourceType]}
            {resourceType !== 'FILE' ? ' and everything inside it' : ''}.
          </p>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
