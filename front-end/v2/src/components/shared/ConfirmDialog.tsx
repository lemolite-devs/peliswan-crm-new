import type { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm" hideClose>
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogBody className="flex gap-3.5 pt-6">
          <div
            className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
              destructive
                ? 'bg-danger/10 text-danger'
                : 'bg-warning/10 text-warning'
            }`}
          >
            <AlertTriangle className="size-5" />
          </div>
          <div>
            <h3 className="font-display text-base font-semibold text-content">
              {title}
            </h3>
            {description && (
              <div className="mt-1 text-sm text-content-secondary">
                {description}
              </div>
            )}
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? 'danger' : 'primary'}
            size="sm"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
