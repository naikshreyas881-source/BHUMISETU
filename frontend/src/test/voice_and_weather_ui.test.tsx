import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LanguageProvider } from '../i18n/LanguageContext';
import { WeatherWidget } from '../components/weather/WeatherWidget';
import { FarmVoiceModal } from '../components/voice/FarmVoiceModal';

describe('Voice & Weather UI Components Verification', () => {
  it('renders WeatherWidget with live metrics container', () => {
    render(
      <LanguageProvider>
        <WeatherWidget />
      </LanguageProvider>
    );

    expect(screen.getByText(/Loading live agricultural weather data.../i)).toBeInTheDocument();
  });

  it('renders FarmVoiceModal with Gemini Live AI badge and language controls', () => {
    render(
      <LanguageProvider>
        <FarmVoiceModal isOpen={true} onClose={() => {}} />
      </LanguageProvider>
    );

    expect(screen.getByText('FarmVoice AI Assistant')).toBeInTheDocument();
    expect(screen.getByText('Gemini Live AI')).toBeInTheDocument();
    expect(screen.getByText('EN')).toBeInTheDocument();
    expect(screen.getByText('ಕನ್ನಡ')).toBeInTheDocument();
  });
});
