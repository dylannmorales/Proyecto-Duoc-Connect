import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AdminDashboardPage } from '@/features/admin/pages/AdminDashboardPage';
import { GuestRoute, ProtectedRoute, AdminRoute } from '@/features/auth/components/AuthRoutes';
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';
import { ResetPasswordPage } from '@/features/auth/pages/ResetPasswordPage';
import { CompanionProfilePage } from '@/features/companions/pages/CompanionProfilePage';
import { CompanionsPage } from '@/features/companions/pages/CompanionsPage';
import { ForumPage } from '@/features/forum/pages/ForumPage';
import { QuestionDetailPage } from '@/features/forum/pages/QuestionDetailPage';
import { GroupDetailPage } from '@/features/groups/pages/GroupDetailPage';
import { GroupsPage } from '@/features/groups/pages/GroupsPage';
import { JoinByLinkPage } from '@/features/groups/pages/JoinByLinkPage';
import { HomePage } from '@/features/home/pages/HomePage';
import { InvitationsPage } from '@/features/invitations/pages/InvitationsPage';
import { NoteDetailPage } from '@/features/notes/pages/NoteDetailPage';
import { NotesPage } from '@/features/notes/pages/NotesPage';
import { ProfilePage } from '@/features/profile/pages/ProfilePage';
import { MainLayout } from '@/shared/components/layout/MainLayout';

export function AppRoutes() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route
            path="grupos"
            element={
              <ProtectedRoute>
                <GroupsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="grupos/:id"
            element={
              <ProtectedRoute>
                <GroupDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="apuntes"
            element={
              <ProtectedRoute>
                <NotesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="grupos/unirse/:codigo"
            element={
              <ProtectedRoute>
                <JoinByLinkPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="apuntes/:id"
            element={
              <ProtectedRoute>
                <NoteDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="foro"
            element={
              <ProtectedRoute>
                <ForumPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="foro/:id"
            element={
              <ProtectedRoute>
                <QuestionDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="login"
            element={
              <GuestRoute>
                <LoginPage />
              </GuestRoute>
            }
          />
          <Route
            path="registro"
            element={
              <GuestRoute>
                <RegisterPage />
              </GuestRoute>
            }
          />
          <Route
            path="olvide-contrasena"
            element={
              <GuestRoute>
                <ForgotPasswordPage />
              </GuestRoute>
            }
          />
          <Route
            path="recuperar-contrasena"
            element={
              <GuestRoute>
                <ResetPasswordPage />
              </GuestRoute>
            }
          />

          <Route
            path="companeros"
            element={
              <ProtectedRoute>
                <CompanionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="companeros/:usuarioId"
            element={
              <ProtectedRoute>
                <CompanionProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="invitaciones"
            element={
              <ProtectedRoute>
                <InvitationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="perfil"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="admin"
            element={
              <AdminRoute>
                <AdminDashboardPage />
              </AdminRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
