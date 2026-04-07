import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import { LoginPage } from '@/pages/Login';
import { RegisterPage } from '@/pages/Register';
import { DashboardPage } from '@/pages/Dashboard';
import { MyLogsPage } from '@/pages/MyLogs';
import { MyPlacementPage } from '@/pages/MyPlacement';
import { PendingReviewsPage } from '@/pages/PendingReviews';
import { EvaluationsPage } from '@/pages/Evaluations';
import { EvaluationCriteriaPage } from '@/pages/EvaluationCriteria';
import { UnauthorizedPage } from '@/pages/Unauthorized';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Protected routes */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />

            {/* Placeholder routes - to be implemented */}
            <Route path="/logs" element={<MyLogsPage />} />
            <Route path="/placement" element={<MyPlacementPage />} />
            <Route path="/reviews" element={<PendingReviewsPage />} />
            <Route path="/evaluations" element={<PlaceholderPage title="Evaluations" />} />
            <Route path="/interns" element={<PlaceholderPage title="Interns" />} />
            <Route path="/users" element={<PlaceholderPage title="Users" />} />
            <Route path="/placements" element={<PlaceholderPage title="Placements" />} />
            <Route path="/reports" element={<PlaceholderPage title="Reports" />} />
          </Route>

          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
      <p className="text-gray-500">This page is under construction.</p>
    </div>
  );
}

export default App;
