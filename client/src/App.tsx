import { Suspense, lazy, useCallback, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Navbar } from "@/components/Navbar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ShortcutsModal } from "@/components/ShortcutsModal";
import { ScrollTopButton } from "@/components/ScrollTopButton";
import { Spinner } from "@/components/Spinner";
import { useKeyboardShortcuts } from "@/lib/useKeyboardShortcuts";
import { useAuth } from "@/store/auth";
import { useTheme } from "@/store/theme";
import { useSound } from "@/store/sound";

const HomePage = lazy(() => import("@/pages/Home").then((m) => ({ default: m.HomePage })));
const LoginPage = lazy(() => import("@/pages/Login").then((m) => ({ default: m.LoginPage })));
const ForgotPasswordPage = lazy(() => import("@/pages/ForgotPassword").then((m) => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import("@/pages/ResetPassword").then((m) => ({ default: m.ResetPasswordPage })));
const ChangePasswordPage = lazy(() => import("@/pages/ChangePassword").then((m) => ({ default: m.ChangePasswordPage })));
const CoursesPage = lazy(() => import("@/pages/Courses").then((m) => ({ default: m.CoursesPage })));
const CourseDetailPage = lazy(() => import("@/pages/CourseDetail").then((m) => ({ default: m.CourseDetailPage })));
const LessonViewPage = lazy(() => import("@/pages/LessonView").then((m) => ({ default: m.LessonViewPage })));
const QuizPage = lazy(() => import("@/pages/Quiz").then((m) => ({ default: m.QuizPage })));
const DashboardPage = lazy(() => import("@/pages/Dashboard").then((m) => ({ default: m.DashboardPage })));
const TeacherCoursesPage = lazy(() => import("@/pages/teacher/TeacherCourses").then((m) => ({ default: m.TeacherCoursesPage })));
const TeacherCourseEditPage = lazy(() => import("@/pages/teacher/TeacherCourseEdit").then((m) => ({ default: m.TeacherCourseEditPage })));
const TeacherGradingQueuePage = lazy(() => import("@/pages/teacher/TeacherGrading").then((m) => ({ default: m.TeacherGradingQueuePage })));
const TeacherGradingDetailPage = lazy(() => import("@/pages/teacher/TeacherGrading").then((m) => ({ default: m.TeacherGradingDetailPage })));
const TeacherCourseStudentsPage = lazy(() => import("@/pages/teacher/TeacherCourseStudents").then((m) => ({ default: m.TeacherCourseStudentsPage })));
const AdminUsersPage = lazy(() => import("@/pages/admin/AdminUsers").then((m) => ({ default: m.AdminUsersPage })));
const AdminReportsPage = lazy(() => import("@/pages/admin/AdminReports").then((m) => ({ default: m.AdminReportsPage })));
const AdminAuditPage = lazy(() => import("@/pages/admin/AdminAudit").then((m) => ({ default: m.AdminAuditPage })));
const ReportBugPage = lazy(() => import("@/pages/ReportBug").then((m) => ({ default: m.ReportBugPage })));
const ProfilePage = lazy(() => import("@/pages/Profile").then((m) => ({ default: m.ProfilePage })));
const BookmarksPage = lazy(() => import("@/pages/Bookmarks").then((m) => ({ default: m.BookmarksPage })));

const HomeOrCourses = () => {
  const user = useAuth((s) => s.user);
  return user ? <CoursesPage /> : <HomePage />;
};

const AppShell = ({ children }: { children: React.ReactNode }) => {
  const [helpOpen, setHelpOpen] = useState(false);
  const toggleHelp = useCallback(() => setHelpOpen((v) => !v), []);
  const closeHelp = useCallback(() => setHelpOpen(false), []);
  useKeyboardShortcuts(toggleHelp, closeHelp);

  return (
    <>
      {children}
      <ScrollTopButton />
      <ShortcutsModal open={helpOpen} onClose={closeHelp} />
    </>
  );
};

export const App = () => {
  const initAuth = useAuth((s) => s.init);
  const initTheme = useTheme((s) => s.init);
  const initSound = useSound((s) => s.init);

  useEffect(() => {
    initTheme();
    initAuth();
    initSound();
  }, [initAuth, initTheme, initSound]);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          className: "!bg-white dark:!bg-slate-800 !text-slate-900 dark:!text-white",
          style: { borderRadius: "10px", border: "1px solid rgb(226 232 240 / 0.5)" },
        }}
      />
      <AppShell>
        <Navbar />
        <Suspense fallback={<Spinner />}>
          <Routes>
            <Route path="/" element={<HomeOrCourses />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route
              path="/change-password"
              element={
                <ProtectedRoute>
                  <ChangePasswordPage />
                </ProtectedRoute>
              }
            />
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/courses/:id" element={<CourseDetailPage />} />

            <Route
              path="/courses/:courseId/lessons/:lessonId"
              element={
                <ProtectedRoute>
                  <LessonViewPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quiz/:id"
              element={
                <ProtectedRoute>
                  <QuizPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/report-bug"
              element={
                <ProtectedRoute>
                  <ReportBugPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bookmarks"
              element={
                <ProtectedRoute roles={["student"]}>
                  <BookmarksPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teach"
              element={
                <ProtectedRoute roles={["teacher"]}>
                  <TeacherCoursesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teach/courses/:id"
              element={
                <ProtectedRoute roles={["teacher"]}>
                  <TeacherCourseEditPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teach/courses/:id/students"
              element={
                <ProtectedRoute roles={["teacher"]}>
                  <TeacherCourseStudentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teach/grading"
              element={
                <ProtectedRoute roles={["teacher"]}>
                  <TeacherGradingQueuePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teach/grading/:attemptId"
              element={
                <ProtectedRoute roles={["teacher"]}>
                  <TeacherGradingDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <AdminUsersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <AdminReportsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/audit"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <AdminAuditPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Suspense>
      </AppShell>
    </BrowserRouter>
  );
};
