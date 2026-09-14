import React from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { AlertTriangle } from "lucide-react";

export const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Delete",
  confirmVariant = "danger",
  loading = false
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 flex-shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="text-sm text-slate-600 leading-relaxed pt-1">{message}</div>
        </div>
        <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm} loading={loading}>
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
