/**
 * Complete TypeScript Type Definitions
 * Untuk seluruh data struktur aplikasi pembelajaran
 */

// ==================== USER TYPES ====================

export type UserRole = "admin" | "guru" | "siswa";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar: string | null;
  avatarColor: string;
  classId?: string | null;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SignUpData {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  classId?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface UpdateUserData {
  name?: string;
  avatar?: string;
  avatarColor?: string;
  classId?: string;
  status?: string;
}

// ==================== CLASS TYPES ====================

export interface Class {
  id: string;
  name: string;
  grade: string;
  subtitle: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateClassData {
  name: string;
  grade: string;
  subject: string;
}

export interface UpdateClassData {
  name?: string;
  grade?: string;
  subtitle?: string;
}

// ==================== PEMBELAJARAN TYPES ====================

export type StepType = "materi" | "quiz";

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number; // Index of correct answer
}

export interface PembelajaranStep {
  id: string;
  type: StepType;
  title: string;
  content?: string; // HTML content untuk type "materi"
  questions?: QuizQuestion[]; // Array pertanyaan untuk type "quiz"
  passingScore?: number; // Minimal score untuk lulus quiz
  order: number;
}

export interface Pembelajaran {
  id: string;
  classId: string;
  title: string;
  description: string;
  icon: string; // Lucide icon name
  color: string; // Hex color
  steps: PembelajaranStep[];
  createdBy: string; // User ID (guru)
  createdAt: string;
  updatedAt?: string;
}

export interface CreatePembelajaranData {
  classId: string;
  title: string;
  description: string;
  icon?: string;
  color?: string;
}

export interface UpdatePembelajaranData {
  title?: string;
  description?: string;
  icon?: string;
  color?: string;
  steps?: PembelajaranStep[];
}

// ==================== PROJECT TYPES ====================

export interface ProjectSintaks {
  id: string;
  title: string;
  description: string;
  order: number;
}

export interface Project {
  id: string;
  classId: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  sintaks: ProjectSintaks[];
  createdBy: string; // User ID (guru)
  createdAt: string;
  updatedAt?: string;
}

export interface CreateProjectData {
  classId: string;
  title: string;
  description: string;
  icon?: string;
  color?: string;
}

export interface UpdateProjectData {
  title?: string;
  description?: string;
  icon?: string;
  color?: string;
  sintaks?: ProjectSintaks[];
}

// ==================== PROGRESS TYPES ====================

export interface QuizAttempt {
  score: number;
  timestamp: string;
}

export interface StepProgress {
  completed: boolean;
  completedAt?: string;
  attempts: QuizAttempt[];
}

export interface Progress {
  userId: string;
  pembelajaranId: string;
  steps: {
    [stepId: string]: StepProgress;
  };
  createdAt: string;
  updatedAt?: string;
}

export interface UpdateProgressData {
  pembelajaranId: string;
  stepId: string;
  score?: number;
  completed?: boolean;
}

// ==================== TODO TYPES ====================

export interface Todo {
  id: string;
  userId: string;
  title: string;
  completed: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateTodoData {
  title: string;
}

export interface UpdateTodoData {
  title?: string;
  completed?: boolean;
}

// ==================== SCHEDULE TYPES ====================

export type ScheduleType = "siswa" | "guru";

export interface Schedule {
  id: string;
  type: ScheduleType;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  location: string;
  description: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateScheduleData {
  type: ScheduleType;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
}

export interface UpdateScheduleData {
  title?: string;
  date?: string;
  time?: string;
  location?: string;
  description?: string;
}

// ==================== FORUM TYPES ====================

export interface ForumComment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  userAvatarColor: string;
  content: string;
  createdAt: string;
}

export interface ForumPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  userAvatarColor: string;
  userStatus: string;
  content: string;
  files: string[];
  likes: string[]; // Array of user IDs
  comments: ForumComment[];
  createdAt: string;
  updatedAt?: string;
}

export interface CreateForumPostData {
  content: string;
  files?: string[];
}

export interface CreateForumCommentData {
  content: string;
}

// ==================== FILE UPLOAD TYPES ====================

export interface UploadFileResponse {
  success: boolean;
  fileName: string;
  url: string;
}

export interface GetFileUrlResponse {
  url: string;
}

// ==================== API RESPONSE TYPES ====================

export interface AuthResponse {
  success: boolean;
  user: User;
  session?: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
  };
}

export interface GetUserResponse {
  user: User;
}

export interface GetUsersResponse {
  users: User[];
}

export interface GetClassesResponse {
  classes: Class[];
}

export interface GetClassResponse {
  class: Class;
}

export interface GetPembelajaranListResponse {
  pembelajaran: Pembelajaran[];
}

export interface GetPembelajaranResponse {
  pembelajaran: Pembelajaran;
}

export interface GetProjectsResponse {
  projects: Project[];
}

export interface GetProjectResponse {
  project: Project;
}

export interface GetProgressResponse {
  progress: Progress[];
}

export interface GetTodosResponse {
  todos: Todo[];
}

export interface GetTodoResponse {
  todo: Todo;
}

export interface GetSchedulesResponse {
  schedules: Schedule[];
}

export interface GetScheduleResponse {
  schedule: Schedule;
}

export interface GetForumPostsResponse {
  posts: ForumPost[];
}

export interface GetForumPostResponse {
  post: ForumPost;
}

export interface SuccessResponse {
  success: boolean;
  message?: string;
}

export interface ErrorResponse {
  error: string;
  details?: string;
}

// ==================== SEED DATA TYPES ====================

export interface SeedAccount {
  email: string;
  password: string;
  name: string;
}

export interface SeedResponse {
  success: boolean;
  message: string;
  accounts: {
    admin: SeedAccount;
    guru: SeedAccount;
    siswa: SeedAccount;
  };
}

// ==================== HEALTH CHECK TYPES ====================

export interface HealthCheckResponse {
  status: "ok" | "error";
  message: string;
  timestamp: string;
}

// ==================== CONTEXT TYPES ====================

export interface AuthContextType {
  user: User | null;
  session: any;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    name: string,
    role: UserRole,
    classId?: string
  ) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: UpdateUserData) => Promise<void>;
}

export interface SettingsContextType {
  theme: "light" | "dark";
  language: "id" | "en";
  soundEnabled: boolean;
  toggleTheme: () => void;
  setLanguage: (lang: "id" | "en") => void;
  toggleSound: () => void;
}

export interface PembelajaranContextType {
  pembelajaran: Pembelajaran[];
  currentPembelajaran: Pembelajaran | null;
  loading: boolean;
  fetchPembelajaran: (classId: string) => Promise<void>;
  fetchPembelajaranById: (pembelajaranId: string) => Promise<void>;
  createPembelajaran: (data: CreatePembelajaranData) => Promise<void>;
  updatePembelajaran: (
    pembelajaranId: string,
    updates: UpdatePembelajaranData
  ) => Promise<void>;
  deletePembelajaran: (pembelajaranId: string) => Promise<void>;
}

export interface ProjectContextType {
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
  fetchProjects: (classId: string) => Promise<void>;
  fetchProjectById: (projectId: string) => Promise<void>;
  createProject: (data: CreateProjectData) => Promise<void>;
  updateProject: (projectId: string, updates: UpdateProjectData) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
}

// ==================== COMPONENT PROP TYPES ====================

export interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export interface DashboardLayoutProps {
  children: React.ReactNode;
  role: UserRole;
}

export interface SidebarProps {
  role: UserRole;
  currentPath: string;
}

export interface PembelajaranCardProps {
  pembelajaran: Pembelajaran;
  onClick?: () => void;
}

export interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
}

export interface StepNavigationProps {
  steps: PembelajaranStep[];
  currentStepIndex: number;
  onStepChange: (index: number) => void;
  progress?: Progress;
}

export interface QuizProps {
  questions: QuizQuestion[];
  onSubmit: (score: number) => void;
}

export interface ForumPostCardProps {
  post: ForumPost;
  onLike: (postId: string) => void;
  onComment: (postId: string, content: string) => void;
  onDelete: (postId: string) => void;
  currentUserId: string;
}

export interface TodoItemProps {
  todo: Todo;
  onToggle: (todoId: string) => void;
  onDelete: (todoId: string) => void;
}

export interface ScheduleCardProps {
  schedule: Schedule;
  onEdit?: (schedule: Schedule) => void;
  onDelete?: (scheduleId: string) => void;
}

// ==================== FORM TYPES ====================

export interface LoginFormData {
  email: string;
  password: string;
}

export interface SignUpFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
  classId?: string;
}

export interface CreateMateriFormData {
  title: string;
  description: string;
  icon: string;
  color: string;
}

export interface CreateStepFormData {
  type: StepType;
  title: string;
  content?: string;
  questions?: QuizQuestion[];
  passingScore?: number;
}

export interface CreateProjectFormData {
  title: string;
  description: string;
  icon: string;
  color: string;
}

export interface CreateSintaksFormData {
  title: string;
  description: string;
}

export interface CreateClassFormData {
  name: string;
  grade: string;
  subject: string;
}

export interface CreateUserFormData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  classId?: string;
}

// ==================== UTILITY TYPES ====================

export type APIError = {
  message: string;
  status?: number;
  details?: any;
};

export type LoadingState = "idle" | "loading" | "success" | "error";

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface FilterOptions {
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

// ==================== CONSTANTS ====================

export const USER_ROLES: UserRole[] = ["admin", "guru", "siswa"];

export const STEP_TYPES: StepType[] = ["materi", "quiz"];

export const SCHEDULE_TYPES: ScheduleType[] = ["siswa", "guru"];

export const DEFAULT_AVATAR_COLORS = [
  "#1294f2",
  "#46bd84",
  "#ffcb14",
  "#dc2626",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
];

export const LUCIDE_ICONS = [
  "BookOpen",
  "Code",
  "Palette",
  "Database",
  "Globe",
  "Folder",
  "FileText",
  "Image",
  "Video",
  "Music",
  "ShoppingCart",
  "Users",
  "Settings",
  "Star",
  "Heart",
  "Award",
];

// ==================== EXPORT ALL ====================

