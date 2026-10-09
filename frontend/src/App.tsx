import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './i18n/LanguageContext';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { FarmerDashboardPage } from './pages/FarmerDashboardPage';
import { OwnerDashboardPage } from './pages/OwnerDashboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { MarketplacePage } from './pages/MarketplacePage';
import { FarmsPage } from './pages/FarmsPage';
import { BookingsPage } from './pages/BookingsPage';

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <div className="flex flex-col min-h-screen bg-[#faf9f6] text-gray-900 font-sans selection:bg-leaf-200">
            {/* Header visible on every single page with BHUMISETU branding & tagline */}
            <Header />

            {/* Main content body */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/marketplace" element={<MarketplacePage />} />

                {/* Role-Specific Protected Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <FarmerDashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/owner"
                  element={
                    <ProtectedRoute allowedRoles={['resource_owner', 'service_provider', 'administrator']}>
                      <OwnerDashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['administrator']}>
                      <AdminDashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/audit"
                  element={
                    <ProtectedRoute allowedRoles={['administrator']}>
                      <AdminDashboardPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/farms"
                  element={
                    <ProtectedRoute>
                      <FarmsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/bookings"
                  element={
                    <ProtectedRoute>
                      <BookingsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Catch-all fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>

            {/* Footer visible on every single page with BHUMISETU branding & tagline */}
            <Footer />
          </div>
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;
