import { Link } from 'react-router-dom';
import { LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { initials } from '@/lib/format';
import { Logomark } from '@/components/layout/logomark';

export function Topbar({ children }: { children?: React.ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-4 border-b border-ink-100 bg-surface/80 px-4 backdrop-blur dark:border-ink-800 sm:px-6">
      <Link to={user ? '/dashboard' : '/login'} className="flex shrink-0 items-center gap-2">
        <Logomark className="size-6" />
        <span className="hidden text-sm font-semibold tracking-tight text-ink-900 dark:text-ink-50 sm:inline">Vaultspace</span>
      </Link>

      <div className="min-w-0 flex-1">{children}</div>

      {user ? (
        <DropdownMenu>
          <DropdownMenuTrigger className="outline-none">
            <Avatar>
              <AvatarFallback>{initials(user.name)}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel className="flex flex-col gap-0.5">
              <span className="font-medium text-ink-800 dark:text-ink-100">{user.name}</span>
              <span className="font-normal text-ink-400">{user.email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => logout()} variant="destructive">
              <LogOut className="size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <div className="flex shrink-0 items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/login">
              <UserIcon className="size-4" />
              Sign in
            </Link>
          </Button>
        </div>
      )}
    </header>
  );
}
