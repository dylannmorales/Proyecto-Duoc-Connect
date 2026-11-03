import { useEffect, useState } from 'react';

async function copyToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  // Respaldo para navegadores o contextos sin Clipboard API (http sin localhost).
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  textarea.remove();
}

interface CopyLinkButtonProps {
  link: string;
  className?: string;
}

export function CopyLinkButton({ link, className = '' }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  return (
    <button
      type="button"
      onClick={async () => {
        await copyToClipboard(link);
        setCopied(true);
      }}
      className={`inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold transition hover:bg-gray-50 ${className}`}
    >
      <span aria-hidden="true">{copied ? '✓' : '🔗'}</span>
      <span aria-live="polite">{copied ? 'Vínculo copiado' : 'Copiar vínculo'}</span>
    </button>
  );
}
