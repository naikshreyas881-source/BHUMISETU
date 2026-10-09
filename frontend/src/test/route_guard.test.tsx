import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { AuthProvider } from '../context/AuthContext';

describe('ProtectedRoute Access Control', () => {
  it('redirects unauthenticated users to login or shows loading', () => {
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <div>Secret Farmers Content</div>
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<div>Login Page Redirect</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    // Initially loads or redirects to login
    expect(screen.queryByText('Secret Farmers Content')).not.toBeInTheDocument();
  });
});
