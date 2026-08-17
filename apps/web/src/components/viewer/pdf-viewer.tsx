export function PdfViewer({ src, title }: { src: string; title: string }) {
  return (
    <object data={src} type="application/pdf" title={title} className="h-full w-full rounded-xl border border-ink-100 dark:border-ink-800">
      <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center text-sm text-ink-400">
        <p>Your browser can&apos;t preview PDFs inline.</p>
        <a href={src} className="font-medium text-ink-900 underline underline-offset-2 dark:text-gold-300">
          Open the file instead
        </a>
      </div>
    </object>
  );
}
