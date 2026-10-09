export type SupportedLanguage = 'en' | 'kn' | 'hi' | 'te' | 'ta' | 'mr';

export interface TranslationDictionary {
  brandName: string;
  tagline: string;
  nav: {
    marketplace: string;
    farms: string;
    bookings: string;
    farmVoice: string;
    dashboard: string;
    admin: string;
    login: string;
    register: string;
    logout: string;
  };
  marketplace: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    categoryAll: string;
    categoryTractor: string;
    categoryHarvester: string;
    categoryDrone: string;
    categorySprayer: string;
    categoryLabour: string;
    budgetMax: string;
    perHour: string;
    perAcre: string;
    verifiedOwner: string;
    demoTag: string;
    bookNow: string;
    viewMap: string;
    viewGrid: string;
  };
  coordination: {
    priorityTitle: string;
    urgency: string;
    weather: string;
    cropStage: string;
    acreage: string;
    conflictDetected: string;
    conflictWarning: string;
    suggestedAlternative: string;
    adoptSlot: string;
  };
  weather: {
    title: string;
    temp: string;
    humidity: string;
    rainProb: string;
    expectedRain: string;
    severeAlert: string;
    baselineNotice: string;
  };
  voice: {
    title: string;
    subtitle: string;
    listening: string;
    clickToSpeak: string;
    typePlaceholder: string;
    send: string;
    draftSummaryTitle: string;
    verbalConfirmationRequired: string;
    confirmButton: string;
    cancelButton: string;
    demoNote: string;
  };
}

export const translations: Record<SupportedLanguage, TranslationDictionary> = {
  en: {
    brandName: 'BHUMISETU',
    tagline: 'Bridging Farms to a Better Future',
    nav: {
      marketplace: 'Marketplace',
      farms: 'My Farms',
      bookings: 'Bookings',
      farmVoice: 'FarmVoice AI',
      dashboard: 'Dashboard',
      admin: 'Admin Audit',
      login: 'Sign In',
      register: 'Register',
      logout: 'Sign Out'
    },
    marketplace: {
      title: 'Agricultural Machinery & Services',
      subtitle: 'Transparent, conflict-aware coordination of tractors, harvesters, and verified farm labour across Karnataka.',
      searchPlaceholder: 'Search by machinery name, model, or implement...',
      categoryAll: 'All Equipment',
      categoryTractor: 'Tractors',
      categoryHarvester: 'Combine Harvesters',
      categoryDrone: 'Agricultural Drones',
      categorySprayer: 'Power Sprayers',
      categoryLabour: 'Farm Labour Teams',
      budgetMax: 'Max Hourly Budget',
      perHour: '/ hour',
      perAcre: '/ acre',
      verifiedOwner: 'Verified Owner',
      demoTag: 'Demonstration Record',
      bookNow: 'Book Equipment',
      viewMap: 'Map View',
      viewGrid: 'Grid View'
    },
    coordination: {
      priorityTitle: 'Explainable Priority Score',
      urgency: 'Agronomic Urgency',
      weather: 'Precipitation Risk',
      cropStage: 'Crop Readiness',
      acreage: 'Farm Acreage',
      conflictDetected: 'Scheduling Overlap Detected',
      conflictWarning: 'This machinery has an active reservation or scheduled maintenance during your requested window.',
      suggestedAlternative: 'Suggested Open Shift',
      adoptSlot: 'Use This Slot'
    },
    weather: {
      title: 'Live Agricultural Weather',
      temp: 'Temperature',
      humidity: 'Humidity',
      rainProb: 'Rain Risk (36h)',
      expectedRain: 'Expected Rainfall',
      severeAlert: 'Severe Monsoon Rain Warning — Plan Harvesting Urgently',
      baselineNotice: 'Meteorological feed live via Open-Meteo'
    },
    voice: {
      title: 'FarmVoice AI Assistant',
      subtitle: 'Multilingual conversational AI powered by Gemini Live for Indian farmers.',
      listening: 'Listening... Speak in Kannada or English',
      clickToSpeak: 'Tap to Speak',
      typePlaceholder: 'Ask in Kannada or English (e.g. "I need a tractor for ploughing in Mandya")...',
      send: 'Send',
      draftSummaryTitle: 'Booking Request Summary for Review',
      verbalConfirmationRequired: 'Explicit Confirmation Required: Say "Confirm Booking" or click below.',
      confirmButton: 'Confirm & Submit Booking',
      cancelButton: 'Cancel Draft',
      demoNote: 'Gemini function-calling mediates all operations with zero bypass of business rules.'
    }
  },
  kn: {
    brandName: 'ಭೂಮಿಸೇತು',
    tagline: 'ಉತ್ತಮ ಭವಿಷ್ಯಕ್ಕಾಗಿ ಕೃಷಿ ಸಮನ್ವಯ',
    nav: {
      marketplace: 'ಮಾರುಕಟ್ಟೆ',
      farms: 'ನನ್ನ ಜಮೀನು',
      bookings: 'ಬುಕಿಂಗ್‌ಗಳು',
      farmVoice: 'ಫಾರ್ಮ್‌ವಾಯ್ಸ್ ಎಐ',
      dashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
      admin: 'ಆಡಳಿತ ಆಡಿಟ್',
      login: 'ಲಾಗಿನ್',
      register: 'ನೋಂದಣಿ',
      logout: 'ನಿರ್ಗಮಿಸಿ'
    },
    marketplace: {
      title: 'ಕೃಷಿ ಯಂತ್ರೋಪಕರಣ ಮತ್ತು ಸೇವೆಗಳು',
      subtitle: 'ಕರ್ನಾಟಕದಾದ್ಯಂತ ಟ್ರ್ಯಾಕ್ಟರ್, ಕೊಯ್ಲು ಯಂತ್ರ ಮತ್ತು ಕೃಷಿ ಕಾರ್ಮಿಕರ ಪಾರದರ್ಶಕ ಸಮನ್ವಯ ವೇದಿಕೆ.',
      searchPlaceholder: 'ಯಂತ್ರೋಪಕರಣ, ಮಾದರಿ ಅಥವಾ ಕೆಲಸ ಹುಡುಕಿ...',
      categoryAll: 'ಎಲ್ಲಾ ಯಂತ್ರಗಳು',
      categoryTractor: 'ಟ್ರ್ಯಾಕ್ಟರ್‌ಗಳು',
      categoryHarvester: 'ಕೊಯ್ಲು ಯಂತ್ರಗಳು',
      categoryDrone: 'ಕೃಷಿ ಡ್ರೋನ್‌ಗಳು',
      categorySprayer: 'ಸ್ಪ್ರೇಯರ್‌ಗಳು',
      categoryLabour: 'ಕೃಷಿ ಕಾರ್ಮಿಕ ತಂಡಗಳು',
      budgetMax: 'ಗರಿಷ್ಠ ಗಂಟೆಯ ಬಜೆಟ್',
      perHour: '/ ಗಂಟೆಗೆ',
      perAcre: '/ ಎಕರೆಗೆ',
      verifiedOwner: 'ಪರಿಶೀಲಿತ ಮಾಲೀಕರು',
      demoTag: 'ಡೆಮೋ ದಾಖಲೆ',
      bookNow: 'ಈಗಲೇ ಬುಕ್ ಮಾಡಿ',
      viewMap: 'ನಕ್ಷೆ ನೋಟ',
      viewGrid: 'ಗ್ರಿಡ್ ನೋಟ'
    },
    coordination: {
      priorityTitle: 'ವಿವರಿಸಬಹುದಾದ ಆದ್ಯತೆಯ ಅಂಕ',
      urgency: 'ಕೃಷಿ ತುರ್ತು',
      weather: 'ಮಳೆ ಸಂಭವನೀಯತೆ',
      cropStage: 'ಬೆಳೆ ಹಂತ',
      acreage: 'ಜಮೀನಿನ ವಿಸ್ತೀರ್ಣ',
      conflictDetected: 'ಸಮಯದ ಘರ್ಷಣೆ ಪತ್ತೆಯಾಗಿದೆ',
      conflictWarning: 'ನೀವು ಕೋರಿದ ಸಮಯದಲ್ಲಿ ಈ ಯಂತ್ರಕ್ಕೆ ಬೇರೊಂದು ಬುಕಿಂಗ್ ಅಥವಾ ನಿರ್ವಹಣಾ ಕಾರ್ಯವಿದೆ.',
      suggestedAlternative: 'ಪರ್ಯಾಯ ಮುಕ್ತ ಸಮಯ',
      adoptSlot: 'ಈ ಸಮಯ ಆಯ್ಕೆಮಾಡಿ'
    },
    weather: {
      title: 'ನೇರ ಕೃಷಿ ಹವಾಮಾನ',
      temp: 'ತಾಪಮಾನ',
      humidity: 'ತೇವಾಂಶ',
      rainProb: 'ಮಳೆ ಸಾಧ್ಯತೆ (36ಗಂ)',
      expectedRain: 'ನಿರೀಕ್ಷಿತ ಮಳೆ',
      severeAlert: 'ತೀವ್ರ ಮಳೆ ಎಚ್ಚರಿಕೆ — ತಕ್ಷಣ ಕೊಯ್ಲು ಕಾರ್ಯ ಯೋಜಿಸಿ',
      baselineNotice: 'ನೇರ ಹವಾಮಾನ ಡೇಟಾ Open-Meteo ನಿಂದ'
    },
    voice: {
      title: 'ಫಾರ್ಮ್‌ವಾಯ್ಸ್ ಎಐ ಸಹಾಯಕ',
      subtitle: 'ರೈತರಿಗಾಗಿ ಜೆಮಿನಿ ಲೈವ್ ಚಾಲಿತ ಬಹುಭಾಷಾ ಧ್ವನಿ ಸಹಾಯಕ.',
      listening: 'ಆಲಿಸುತ್ತಿದೆ... ಕನ್ನಡ ಅಥವಾ ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ಮಾತನಾಡಿ',
      clickToSpeak: 'ಮಾತನಾಡಲು ಒತ್ತಿರಿ',
      typePlaceholder: 'ಕನ್ನಡದಲ್ಲಿ ಕೇಳಿ (ಉದಾ: "ನನಗೆ ಮಂಡ್ಯದಲ್ಲಿ ಉಳುಮೆ ಮಾಡಲು ಟ್ರ್ಯಾಕ್ಟರ್ ಬೇಕು")...',
      send: 'ಕಳುಹಿಸಿ',
      draftSummaryTitle: 'ಪರಿಶೀಲನೆಗಾಗಿ ಬುಕಿಂಗ್ ವಿನಂತಿಯ ಸಾರಾಂಶ',
      verbalConfirmationRequired: 'ದೃಢೀಕರಣದ ಅಗತ್ಯವಿದೆ: "ದೃಢೀಕರಿಸಿ" ಎಂದು ಹೇಳಿ ಅಥವಾ ಕೆಳಗೆ ಒತ್ತಿರಿ.',
      confirmButton: 'ದೃಢೀಕರಿಸಿ ಮತ್ತು ಸಲ್ಲಿಸಿ',
      cancelButton: 'ರದ್ದುಗೊಳಿಸಿ',
      demoNote: 'ಜೆಮಿನಿ ಫಂಕ್ಷನ್ ಕಾಲಿಂಗ್ ಮೂಲಕ ಸುರಕ್ಷಿತ ಬುಕಿಂಗ್ ಸಮನ್ವಯ.'
    }
  },
  // Design support for other Indian languages (displayed gracefully in UI)
  hi: { ...null as any },
  te: { ...null as any },
  ta: { ...null as any },
  mr: { ...null as any }
};

// Fallback for non-verified languages to English with notice
translations.hi = { ...translations.en, brandName: 'भूमिसेतु', tagline: 'बेहतर भविष्य के लिए कृषि समन्वय' };
translations.te = { ...translations.en, brandName: 'భూమిసేతు', tagline: 'మెరుగైన భవిష్యత్తు కోసం వ్యవసాయ సమన్వయం' };
translations.ta = { ...translations.en, brandName: 'பூமிசேது', tagline: 'சிறந்த எதிர்காலத்திற்கான விவசாய ஒருங்கிணைப்பு' };
translations.mr = { ...translations.en, brandName: 'भूमीसेतू', tagline: 'उज्वल भविष्यासाठी कृषी समन्वय' };
