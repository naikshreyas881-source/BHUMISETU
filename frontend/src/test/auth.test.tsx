import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { AuthProvider } from '../context/AuthContext';

describe('Authentication Pages Verification', () => {
  it('renders login form with inputs, branding, and quick demo credentials', () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      </AuthProvider>
    );

    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In to BHUMISETU/i })).toBeInTheDocument();
    expect(screen.getByText(/Quick Demonstration Credentials/i)).toBeInTheDocument();
  });

  it('renders register form with roles (Farmer, Owner, Provider) and languages', () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <RegisterPage />
        </BrowserRouter>
      </AuthProvider>
    );

    expect(screen.getByText('Farmer')).toBeInTheDocument();
    expect(screen.getByText('Equipment Owner')).toBeInTheDocument();
    expect(screen.getByText('Provider')).toBeInTheDocument();
    expect(screen.getByLabelText(/Full Legal Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Preferred Language/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create BHUMISETU Account/i })).toBeInTheDocument();
  });
});
