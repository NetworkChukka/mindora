import React from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { AlertCircle, User, School, GraduationCap, Calendar } from "lucide-react";

export const DuplicateModal = ({ isOpen, onClose, onConfirm, studentData, loading = false }) => {
  if (!studentData) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Possible Duplicate Student" maxWidth="max-w-md">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
          <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0" />
          <div className="text-xs font-semibold">
            A registered student with the same name and school already exists in the system.
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5 text-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold border-b pb-2">
            <span>EXISTING REGISTRATION</span>
            <span className="bg-navy-100 text-navy-800 px-2 py-0.5 rounded font-mono font-bold">
              {studentData.registrationNumber}
            </span>
          </div>

          <div className="flex items-center gap-2.5 text-slate-800 font-semibold">
            <User className="w-4 h-4 text-slate-400" />
            <span>{studentData.studentName}</span>
          </div>

          <div className="flex items-center gap-2.5 text-slate-700">
            <School className="w-4 h-4 text-slate-400" />
            <span>{studentData.schoolName}</span>
          </div>

          <div className="flex items-center gap-2.5 text-slate-700">
            <GraduationCap className="w-4 h-4 text-slate-400" />
            <span>
              Grade {studentData.grade} • <span className="font-bold text-navy-700">{studentData.educationLevel}</span>
            </span>
          </div>

          <div className="flex items-center gap-2.5 text-slate-500 text-xs">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>Visit Date: {studentData.visitDate}</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>
            Register Anyway
          </Button>
        </div>
      </div>
    </Modal>
  );
};
