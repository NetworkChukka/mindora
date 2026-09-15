import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { useToast } from "../context/ToastContext";
import api from "../services/api";
import { Input } from "../components/common/Input";
import { Button } from "../components/common/Button";
import { SchoolSelect } from "../components/common/SchoolSelect";
import { AddSchoolModal } from "../components/common/AddSchoolModal";
import { DuplicateModal } from "../components/common/DuplicateModal";
import {
  User,
  Phone,
  GraduationCap,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingUp,
  History
} from "lucide-react";

export const RegisterPage = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { success, error, warning } = useToast();

  // Form states
  const [visitorType, setVisitorType] = useState("student");
  const [studentName, setStudentName] = useState("");
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [grade, setGrade] = useState(10);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);

  // Success indicator banner
  const [lastRegistered, setLastRegistered] = useState(null);

  // Missing school modal
  const [isAddSchoolOpen, setIsAddSchoolOpen] = useState(false);

  // Duplicate warning modal
  const [duplicateData, setDuplicateData] = useState(null);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);

  // Data lists
  const [schools, setSchools] = useState([]);
  const [recentList, setRecentList] = useState([]);
  const [todayCounts, setTodayCounts] = useState({ total: 0, students: 0, teachers: 0, ol: 0, al: 0 });

  const nameInputRef = useRef(null);

  // Calculate Level dynamically from Grade
  const educationLevel = visitorType === "teacher" ? "Teacher" : (grade >= 12 ? "A/L" : "O/L");

  // Fetch initial schools & stats
  const fetchSchools = async () => {
    try {
      const res = await api.get("/schools");
      if (res.data.success) {
        setSchools(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load schools:", err);
    }
  };

  const fetchRecentAndCounts = async () => {
    try {
      const [recentRes, statsRes] = await Promise.allSettled([
        api.get("/registrations/recent"),
        api.get("/dashboard/stats?dateFilter=today")
      ]);

      if (recentRes.status === "fulfilled" && recentRes.value.data.success) {
        const data = recentRes.value.data.data;
        setRecentList(data.recent || []);
        if (data.activeEventDate) {
          setVisitDate(data.activeEventDate);
        }
        setTodayCounts({
          total: data.todayCount || 0,
          students: data.todayStudentCount || 0,
          teachers: data.todayTeacherCount || 0,
          ol: data.todayOlCount || 0,
          al: data.todayAlCount || 0
        });
      }

      if (statsRes.status === "fulfilled" && statsRes.value.data.success) {
        const stats = statsRes.value.data.data;
        setTodayCounts({
          total: stats.todayRegistrations || stats.totalStudents,
          students: stats.todayStudents || stats.totalStudents,
          teachers: stats.todayTeachers || 0,
          ol: stats.olStudents,
          al: stats.alStudents
        });
        if (stats.settings?.activeEventDate) {
          setVisitDate(stats.settings.activeEventDate);
        }
      }
    } catch (err) {
      console.error("Failed to load desk stats:", err);
    }
  };

  useEffect(() => {
    fetchSchools();
    fetchRecentAndCounts();

    // Focus name input on mount
    nameInputRef.current?.focus();
  }, []);

  // Socket.IO Real-time synchronization
  useEffect(() => {
    if (!socket) return;

    const handleSchoolCreated = (newSchool) => {
      if (newSchool.bulk) {
        fetchSchools();
      } else {
        setSchools((prev) => {
          if (prev.some((s) => s._id === newSchool._id || s._id === newSchool.id)) {
            return prev;
          }
          return [...prev, newSchool];
        });
      }
    };

    const handleSchoolUpdated = (updated) => {
      setSchools((prev) =>
        prev.map((s) => (s._id === updated._id || s._id === updated.id ? { ...s, ...updated } : s))
      );
    };

    const handleStudentRegistered = (reg) => {
      // Update counters in real time
      setTodayCounts((prev) => ({
        ...prev,
        total: prev.total + 1,
        students: prev.students + 1,
        ol: reg.educationLevel === "O/L" ? prev.ol + 1 : prev.ol,
        al: reg.educationLevel === "A/L" ? prev.al + 1 : prev.al
      }));
    };

    const handleTeacherRegistered = (reg) => {
      setTodayCounts((prev) => ({
        ...prev,
        total: prev.total + 1,
        teachers: prev.teachers + 1
      }));
    };

    socket.on("school:created", handleSchoolCreated);
    socket.on("school:updated", handleSchoolUpdated);
    socket.on("student:registered", handleStudentRegistered);
    socket.on("teacher:registered", handleTeacherRegistered);

    return () => {
      socket.off("school:created", handleSchoolCreated);
      socket.off("school:updated", handleSchoolUpdated);
      socket.off("student:registered", handleStudentRegistered);
      socket.off("teacher:registered", handleTeacherRegistered);
    };
  }, [socket]);

  // Handle Registration Submission
  const handleSubmit = async (e, bypassDuplicate = false) => {
    if (e) e.preventDefault();

    if (!studentName.trim()) {
      error(visitorType === "teacher" ? "Teacher name is required" : "Student name is required");
      nameInputRef.current?.focus();
      return;
    }

    if (!selectedSchoolId) {
      error("Please select or add a school");
      return;
    }
    
    if (visitorType === "teacher" && !phoneNumber.trim()) {
      error("Phone number is required for teachers");
      return;
    }

    setLoading(true);

    try {
      const endpoint = visitorType === "teacher" ? "/teachers" : "/registrations";
      const payload = {
        schoolId: selectedSchoolId,
        phoneNumber: phoneNumber.trim(),
        visitDate,
        bypassDuplicate
      };
      
      if (visitorType === "teacher") {
        payload.teacherName = studentName.trim();
      } else {
        payload.studentName = studentName.trim();
        payload.grade = parseInt(grade, 10);
      }

      const res = await api.post(endpoint, payload);

      if (res.data.success) {
        const newRecord = res.data.data;
        setLastRegistered({
          ...newRecord,
          isTeacher: visitorType === "teacher",
          displayName: newRecord.studentName || newRecord.teacherName,
          displayRegNum: newRecord.registrationNumber || newRecord.teacherRegistrationNumber
        });
        success(`✓ Registered: ${newRecord.studentName || newRecord.teacherName}`);

        // Add to recent registrations
        const mappedRecent = {
          ...newRecord,
          registrationNumber: newRecord.registrationNumber || newRecord.teacherRegistrationNumber,
          studentName: newRecord.studentName || newRecord.teacherName,
          educationLevel: visitorType === "teacher" ? "Teacher" : newRecord.educationLevel
        };
        setRecentList((prev) => [mappedRecent, ...prev.slice(0, 9)]);

        // Reset form fields
        setStudentName("");
        setPhoneNumber("");
        setIsDuplicateModalOpen(false);
        setDuplicateData(null);

        // Autofocus name input for fast turnaround
        setTimeout(() => {
          nameInputRef.current?.focus();
        }, 50);
      }
    } catch (err) {
      if (err.response && err.response.status === 409 && err.response.data.isDuplicate) {
        // Possible duplicate
        setDuplicateData(err.response.data.data);
        setIsDuplicateModalOpen(true);
      } else {
        error(err.response?.data?.message || "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSchoolAdded = (newSchool) => {
    setSelectedSchoolId(newSchool._id);
    setSelectedSchool(newSchool);
    nameInputRef.current?.focus();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Banner / Last Registered Success Alert */}
      {lastRegistered && (
        <div className="bg-emerald-500 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold tracking-wider uppercase text-emerald-100">
                ✓ REGISTERED SUCCESSFULLY
              </div>
              <div className="text-lg font-black tracking-tight">
                {lastRegistered.displayRegNum} — {lastRegistered.displayName}
              </div>
              <div className="text-xs font-medium text-emerald-100">
                {lastRegistered.schoolNameSnapshot} 
                {!lastRegistered.isTeacher && ` • Grade ${lastRegistered.grade} (${lastRegistered.educationLevel})`}
                {lastRegistered.isTeacher && ` • Teacher`}
              </div>
            </div>
          </div>
          <button
            onClick={() => setLastRegistered(null)}
            className="text-white/80 hover:text-white text-xs font-semibold px-3 py-1 bg-white/10 rounded-lg"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Registration Form (2 cols) */}
        <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between pb-5 border-b border-slate-100 mb-6">
            <div>
              <h2 className="text-xl font-extrabold text-navy-800 tracking-tight">
                Visitor Registration
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Quick entry desk form • Sri Lanka General Education
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-semibold text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>{visitDate}</span>
            </div>
          </div>

          <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-5">
            {/* Visitor Type Toggle */}
            <div className="flex p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => { setVisitorType("student"); nameInputRef.current?.focus(); }}
                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                  visitorType === "student"
                    ? "bg-white text-brand-green shadow-sm ring-1 ring-slate-200"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                STUDENT
              </button>
              <button
                type="button"
                onClick={() => { setVisitorType("teacher"); nameInputRef.current?.focus(); }}
                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                  visitorType === "teacher"
                    ? "bg-white text-purple-600 shadow-sm ring-1 ring-slate-200"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                TEACHER
              </button>
            </div>

            {/* Visitor Name */}
            <Input
              inputRef={nameInputRef}
              label={visitorType === "teacher" ? "Teacher Name" : "Student Name"}
              placeholder={visitorType === "teacher" ? "e.g. Mr. Sunil Perera" : "e.g. Kasun Perera, Anuki Silva"}
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              required
              autoFocus
              icon={<User className="w-5 h-5" />}
              className="text-lg"
            />

            {/* School Searchable Dropdown */}
            <SchoolSelect
              schools={schools}
              selectedSchoolId={selectedSchoolId}
              onChange={(id, schoolObj) => {
                setSelectedSchoolId(id);
                setSelectedSchool(schoolObj);
              }}
              onOpenAddModal={() => setIsAddSchoolOpen(true)}
            />

            {/* Grade Selection with Auto Education Level Indicator */}
            {visitorType === "student" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700 flex items-center justify-between">
                    <span>
                      Grade <span className="text-rose-500">*</span>
                    </span>
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[6, 7, 8, 9, 10, 11, 12, 13].map((g) => {
                      const isSelected = grade === g;
                      return (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setGrade(g)}
                          className={`py-2.5 rounded-xl font-extrabold text-sm transition-all ${
                            isSelected
                              ? g >= 12
                                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                                : "bg-navy-700 text-white shadow-md shadow-navy-800/20"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          {g}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Dynamic Education Level Indicator */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Calculated Education Level
                  </span>
                  <div
                    className={`flex items-center justify-between px-4 py-3 rounded-2xl border ${
                      educationLevel === "O/L"
                        ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                        : "bg-blue-50 border-blue-200 text-blue-900"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-5 h-5" />
                      <span className="text-xs font-bold uppercase">
                        {educationLevel === "O/L" ? "Ordinary Level" : "Advanced Level"}
                      </span>
                    </div>
                    <span className="text-lg font-black tracking-wider px-2.5 py-0.5 bg-white rounded-lg shadow-sm">
                      {educationLevel}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Optional Phone Number */}
            <Input
              label="Phone Number (Optional)"
              type="tel"
              placeholder="e.g. 0771234567 or +94771234567"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              helperText="Optional contact number for exhibition notifications"
              icon={<Phone className="w-4 h-4" />}
            />

            {/* Submit Button */}
            <div className="pt-3">
              <Button
                type="submit"
                variant="primary"
                size="xl"
                loading={loading}
                className="w-full text-lg shadow-lg"
                icon={<Sparkles className="w-5 h-5 text-brand-green" />}
              >
                {visitorType === "teacher" ? "Register Teacher" : "Register Student"}
              </Button>
            </div>
          </form>
        </div>

        {/* Right Sidebar: Live Counters & Recent Desk Registrations */}
        <div className="space-y-6">
          {/* Live Today's Counter Box */}
          <div className="bg-navy-700 text-white p-6 rounded-3xl shadow-sm border border-navy-800">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-brand-green" />
                <span>Today's Registrations</span>
              </div>
              <span className="inline-block w-2 h-2 rounded-full bg-brand-green animate-ping" />
            </div>

            <div className="my-4 text-center">
              <div className="text-5xl font-black tracking-tight text-white">
                {todayCounts.total.toLocaleString()}
              </div>
              <div className="text-xs text-brand-green font-bold tracking-wider uppercase mt-1">
                Total Visitors Today
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10 mb-3">
              <div className="bg-white/10 p-3 rounded-2xl text-center">
                <div className="text-xs text-slate-300 font-bold">Students</div>
                <div className="text-xl font-extrabold text-white mt-0.5">{todayCounts.students}</div>
              </div>
              <div className="bg-white/10 p-3 rounded-2xl text-center">
                <div className="text-xs text-slate-300 font-bold">Teachers</div>
                <div className="text-xl font-extrabold text-white mt-0.5">{todayCounts.teachers}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 p-2 rounded-xl text-center">
                <div className="text-[10px] text-emerald-300 font-bold">O/L</div>
                <div className="text-base font-extrabold text-white mt-0.5">{todayCounts.ol}</div>
              </div>
              <div className="bg-white/5 p-2 rounded-xl text-center">
                <div className="text-[10px] text-blue-300 font-bold">A/L</div>
                <div className="text-base font-extrabold text-white mt-0.5">{todayCounts.al}</div>
              </div>
            </div>
          </div>

          {/* Recent Registrations List */}
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-navy-800 flex items-center gap-2">
                <History className="w-4 h-4 text-slate-400" />
                Recent Desk Entries
              </h3>
              <span className="text-xs font-semibold text-slate-500">
                {recentList.length} items
              </span>
            </div>

            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto mt-2">
              {recentList.length > 0 ? (
                recentList.map((item) => (
                  <div key={item._id || item.registrationNumber} className="py-2.5 flex items-center justify-between">
                    <div className="min-w-0 pr-2">
                      <div className="text-xs font-bold text-slate-900 truncate flex items-center gap-1.5">
                        {item.educationLevel === "Teacher" && <span className="bg-purple-100 text-purple-700 text-[9px] px-1.5 rounded uppercase">Teacher</span>}
                        {item.studentName || item.teacherName}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        {item.schoolNameSnapshot} 
                        {item.educationLevel !== "Teacher" && ` • Grade ${item.grade}`}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${item.educationLevel === "Teacher" ? "bg-purple-50 text-purple-700" : "bg-navy-50 text-navy-800"}`}>
                        {item.registrationNumber || item.teacherRegistrationNumber}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {item.educationLevel}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-400 font-medium">
                  No registrations recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* In-place Add Missing School Modal */}
      <AddSchoolModal
        isOpen={isAddSchoolOpen}
        onClose={() => setIsAddSchoolOpen(false)}
        onSchoolAdded={handleSchoolAdded}
      />

      {/* Duplicate Student Confirmation Modal */}
      <DuplicateModal
        isOpen={isDuplicateModalOpen}
        onClose={() => setIsDuplicateModalOpen(false)}
        onConfirm={() => handleSubmit(null, true)}
        studentData={duplicateData}
        loading={loading}
      />
    </div>
  );
};
