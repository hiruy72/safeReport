export type UserRole = "VICTIM" | "POLICE" | "ADMIN";

export type UserStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "REJECTED";

export type CaseStatus =
  | "SUBMITTED"
  | "IDENTITY_VERIFIED"
  | "SENT_TO_POLICE"
  | "UNDER_REVIEW"
  | "INVESTIGATION_STARTED"
  | "EVIDENCE_COLLECTION"
  | "SUSPECT_IDENTIFIED"
  | "COURT_PROCESS"
  | "RESOLVED"
  | "CLOSED";

export const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
  SUBMITTED: "Submitted",
  IDENTITY_VERIFIED: "Identity Verified",
  SENT_TO_POLICE: "Sent to Police",
  UNDER_REVIEW: "Under Review",
  INVESTIGATION_STARTED: "Investigation Started",
  EVIDENCE_COLLECTION: "Evidence Collection",
  SUSPECT_IDENTIFIED: "Suspect Identified",
  COURT_PROCESS: "Court Process",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

export type ReportCategory =
  | "SEXUAL_HARASSMENT"
  | "DOMESTIC_VIOLENCE"
  | "PHYSICAL_ASSAULT"
  | "STALKING"
  | "ONLINE_HARASSMENT"
  | "WORKPLACE_HARASSMENT"
  | "SCHOOL_HARASSMENT"
  | "HUMAN_TRAFFICKING"
  | "OTHER";

export const REPORT_CATEGORY_LABELS: Record<ReportCategory, string> = {
  SEXUAL_HARASSMENT: "Sexual Harassment",
  DOMESTIC_VIOLENCE: "Domestic Violence",
  PHYSICAL_ASSAULT: "Physical Assault",
  STALKING: "Stalking",
  ONLINE_HARASSMENT: "Online Harassment",
  WORKPLACE_HARASSMENT: "Workplace Harassment",
  SCHOOL_HARASSMENT: "School Harassment",
  HUMAN_TRAFFICKING: "Human Trafficking",
  OTHER: "Other",
};

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface VictimRegistrationInput {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email: string;
  password: string;
  nationalIdNumber: string;
  address: string;
  regionId: string;
  cityId?: string;
}

export interface ReportInput {
  category: ReportCategory;
  incidentDate: string;
  incidentTime?: string;
  location: string;
  description: string;
  abuserKnown: boolean;
  abuserName?: string;
  abuserNickname?: string;
  abuserPhone?: string;
  abuserSocial?: string;
  abuserWorkplace?: string;
  abuserSchool?: string;
  abuserVehicle?: string;
  abuserAddress?: string;
  abuserRelation?: string;
}

export interface AnonymousVictimView {
  anonymousId: string;
  ageRange?: string;
  gender?: string;
  region?: string;
}

export interface PoliceDashboardStats {
  totalCases: number;
  pendingCases: number;
  urgentCases: number;
  underInvestigation: number;
  solvedCases: number;
  averageResponseTimeHours: number;
}

