
import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteConfirmDialogProps {
  isOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  itemToDelete?: string;
  isSubmitting?: boolean;
}

export function DeleteConfirmDialog({
  isOpen,
  open,
  onOpenChange,
  onClose,
  onConfirm,
  title,
  description,
  itemToDelete,
  isSubmitting = false
}: DeleteConfirmDialogProps) {
  // Use open prop if provided, otherwise use isOpen
  const isDialogOpen = open !== undefined ? open : isOpen;
  const handleOpenChange = onOpenChange || onClose;

  return (
    <AlertDialog open={isDialogOpen} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {description}
            {itemToDelete && (
              <div className="mt-2 p-2 bg-gray-100 rounded-md text-sm">
                <strong>{itemToDelete}</strong>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} disabled={isSubmitting}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm} 
            disabled={isSubmitting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isSubmitting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default DeleteConfirmDialog;
