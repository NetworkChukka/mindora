module.exports = {
  ROLES: {
    ADMIN: "admin",
    OPERATOR: "operator",
    VIEWER: "viewer"
  },
  
  EDUCATION_LEVELS: {
    OL: "O/L",
    AL: "A/L"
  },
  
  ALLOWED_GRADES: [6, 7, 8, 9, 10, 11, 12, 13],
  
  GRADE_LEVEL_MAP: {
    6: "O/L",
    7: "O/L",
    8: "O/L",
    9: "O/L",
    10: "O/L",
    11: "O/L",
    12: "A/L",
    13: "A/L"
  },
  
  calculateEducationLevel: (grade) => {
    const numGrade = parseInt(grade, 10);
    if (isNaN(numGrade)) return null;
    if (numGrade >= 6 && numGrade <= 11) return "O/L";
    if (numGrade >= 12 && numGrade <= 13) return "A/L";
    return null;
  },
  
  AUDIT_ACTIONS: {
    ADMIN_CREATED_ADMIN: "ADMIN_CREATED_ADMIN",
    ADMIN_CREATED_USER: "ADMIN_CREATED_USER",
    ADMIN_EDITED_USER: "ADMIN_EDITED_USER",
    ADMIN_RESET_PASSWORD: "ADMIN_RESET_PASSWORD",
    OPERATOR_REGISTERED_STUDENT: "OPERATOR_REGISTERED_STUDENT",
    OPERATOR_CREATED_SCHOOL: "OPERATOR_CREATED_SCHOOL",
    ADMIN_EDITED_REGISTRATION: "ADMIN_EDITED_REGISTRATION",
    ADMIN_DELETED_REGISTRATION: "ADMIN_DELETED_REGISTRATION",
    ADMIN_IMPORTED_SCHOOLS: "ADMIN_IMPORTED_SCHOOLS",
    ADMIN_EXPORTED_REPORT: "ADMIN_EXPORTED_REPORT",
    ADMIN_CREATED_BACKUP: "ADMIN_CREATED_BACKUP",
    ADMIN_RESTORED_BACKUP: "ADMIN_RESTORED_BACKUP",
    ADMIN_UPDATED_SETTINGS: "ADMIN_UPDATED_SETTINGS"
  }
};
