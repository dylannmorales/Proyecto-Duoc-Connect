import type { ReactNode } from 'react';
import { Button } from '@/shared/components/ui/FormControls';

interface AdminModerationCardProps {
  title: string;
  subtitle: string;
  meta?: string;
  children?: ReactNode;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDownload?: () => void;
  deleteLabel?: string;
}

export function AdminModerationCard({
  title,
  subtitle,
  meta,
  children,
  onView,
  onEdit,
  onDelete,
  onDownload,
  deleteLabel = 'Eliminar',
}: AdminModerationCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-gray-900">{title}</p>
          <p className="text-sm text-gray-600">{subtitle}</p>
          {meta && <p className="mt-1 text-xs text-gray-400">{meta}</p>}
          {children}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={onView}>
            Ver
          </Button>
          <Button variant="secondary" onClick={onEdit}>
            Editar
          </Button>
          {onDownload && (
            <Button variant="secondary" onClick={onDownload}>
              Descargar PDF
            </Button>
          )}
          <Button variant="danger" onClick={onDelete}>
            {deleteLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
