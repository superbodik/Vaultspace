import { File, FileImage, FileSpreadsheet, FileText, type LucideIcon } from 'lucide-react';

export function fileIcon(mimeType: string): LucideIcon {
  if (mimeType === 'application/pdf') return FileText;
  if (mimeType.startsWith('image/')) return FileImage;
  if (mimeType.includes('spreadsheet') || mimeType.includes('csv')) return FileSpreadsheet;
  if (mimeType.startsWith('text/')) return FileText;
  return File;
}
