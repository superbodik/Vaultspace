import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { queryClient } from '@/lib/query-client';
import { AuthProvider } from '@/hooks/use-auth';
import { UploadQueueProvider } from '@/hooks/use-upload-queue';
import { TooltipProvider } from '@/components/ui/tooltip';
import App from './App';
import '@/index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <UploadQueueProvider>
            <TooltipProvider delayDuration={300}>
              <App />
              <Toaster position="bottom-left" richColors closeButton theme="system" />
            </TooltipProvider>
          </UploadQueueProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
