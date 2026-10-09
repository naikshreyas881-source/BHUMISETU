import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { AuthProvider } from '../context/AuthContext';
import { LanguageProvider } from '../i18n/LanguageContext';

describe('BHUMISETU Branding & Tagline Compliance', () => {
  it('renders BHUMISETU name and tagline in Header', () => {
    render(
      <LanguageProvider>
        <AuthProvider>
          <BrowserRouter>
            <Header />
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    );

    expect(screen.getByText('BHUMISETU')).toBeInTheDocument();
    expect(screen.getByText('Bridging Farms to a Better Future')).toBeInTheDocument();
  });

  it('renders BHUMISETU name and tagline in Footer', () => {
    render(
      <LanguageProvider>
        <AuthProvider>
          <BrowserRouter>
            <Footer />
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    );

    const bhumisetuElements = screen.getAllByText(/BHUMISETU/i);
    expect(bhumisetuElements.length).toBeGreaterThan(0);

    const taglineElements = screen.getAllByText(/Bridging Farms to a Better Future/i);
    expect(taglineElements.length).toBeGreaterThan(0);
  });
});
