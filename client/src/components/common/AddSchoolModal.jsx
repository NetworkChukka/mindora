import React, { useState } from "react";
import { Modal } from "./Modal";
import { Input } from "./Input";
import { Button } from "./Button";
import { useToast } from "../../context/ToastContext";
import api from "../../services/api";
import { School, AlertCircle } from "lucide-react";

export const AddSchoolModal = ({ isOpen, onClose, onSchoolAdded }) => {
  const { success, error, warning } = useToast();
  const [schoolName, setSchoolName] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [schoolCode, setSchoolCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!schoolName.trim()) {
      error("School name is required");
      return;
    }

    setLoading(true);
    setDuplicateWarning(null);

    try {
      const res = await api.post("/schools", {
        schoolName: schoolName.trim(),
        city: city.trim(),
        district: district.trim(),
        schoolCode: schoolCode.trim()
      });

      if (res.data.success) {
        success(`✓ School "${res.data.data.schoolName}" added successfully`);
        onSchoolAdded(res.data.data);
        handleClose();
      }
    } catch (err) {
      if (err.response && err.response.status === 409 && err.response.data.data) {
        // School already exists
        const existing = err.response.data.data;
        setDuplicateWarning(existing);
        warning(err.response.data.message || "School already exists");
      } else {
        error(err.response?.data?.message || "Failed to add school");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUseExisting = (existingSchool) => {
    success(`Selected existing school "${existingSchool.schoolName}"`);
    onSchoolAdded(existingSchool);
    handleClose();
  };

  const handleClose = () => {
    setSchoolName("");
    setCity("");
    setDistrict("");
    setSchoolCode("");
    setDuplicateWarning(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add New School" maxWidth="max-w-md">
      {duplicateWarning ? (
        <div className="flex flex-col gap-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">SCHOOL ALREADY EXISTS</div>
              <div className="text-xs mt-1">
                "{duplicateWarning.schoolName}" is already registered in the central system.
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
            <div><strong>Location:</strong> {duplicateWarning.city || "N/A"}, {duplicateWarning.district || "N/A"}</div>
            {duplicateWarning.schoolCode && <div><strong>Code:</strong> {duplicateWarning.schoolCode}</div>}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t">
            <Button variant="secondary" onClick={() => setDuplicateWarning(null)}>
              Change Name
            </Button>
            <Button variant="primary" onClick={() => handleUseExisting(duplicateWarning)}>
              Use Existing School
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="School Name"
            placeholder="e.g. Royal College, Ananda College"
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
            required
            autoFocus
            icon={<School className="w-4 h-4" />}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="City"
              placeholder="e.g. Colombo, Kandy"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
            <Input
              label="District"
              placeholder="e.g. Colombo, Gampaha"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
            />
          </div>

          <Input
            label="School Code (Optional)"
            placeholder="e.g. RC-01"
            value={schoolCode}
            onChange={(e) => setSchoolCode(e.target.value)}
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="secondary" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={loading}>
              Add School
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
