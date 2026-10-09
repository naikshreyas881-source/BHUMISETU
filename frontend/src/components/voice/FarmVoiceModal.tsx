import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Send,
  X,
  Sparkles,
  CheckCircle2,
  Calendar,
  IndianRupee,
  Volume2,
  VolumeX,
} from 'lucide-react';
import apiClient from '../../api/client';
import { useLanguage } from '../../i18n/LanguageContext';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  data?: any;
  draftSummary?: any;
  requiresConfirmation?: boolean;
}

interface FarmVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookingSuccess?: (bookingId: number) => void;
}

export const FarmVoiceModal: React.FC<FarmVoiceModalProps> = ({
  isOpen,
  onClose,
  onBookingSuccess,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text:
        language === 'kn'
          ? 'ನಮಸ್ಕಾರ! ನಾನು ಭೂಮಿಸೇತು ಫಾರ್ಮ್‌ವಾಯ್ಸ್ ಎಐ. ನಿಮಗೆ ಯಾವ ಕೃಷಿ ಯಂತ್ರೋಪಕರಣ ಬೇಕು? ಉದಾಹರಣೆಗೆ "ನನಗೆ ಉಳುಮೆ ಮಾಡಲು ಟ್ರ್ಯಾಕ್ಟರ್ ಬೇಕು" ಎಂದು ಹೇಳಿ.'
          : 'Namaskara! I am FarmVoice AI for BHUMISETU. How can I assist your farm today? Speak or type your agricultural machinery needs.',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeDraft, setActiveDraft] = useState<any>(null);
  const [speechEnabled, setSpeechEnabled] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Speech Recognition Setup (Web Speech API)
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === 'kn' ? 'kn-IN' : 'en-IN';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setIsListening(false);
        handleSendMessage(transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [language]);

  // Text to Speech
  const speakText = (text: string) => {
    if (!speechEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'kn' ? 'kn-IN' : 'en-IN';
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please type your message.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.lang = language === 'kn' ? 'kn-IN' : 'en-IN';
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Speech recognition start failed:', err);
        setIsListening(false);
      }
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isProcessing) return;

    const userMsg: Message = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsProcessing(true);

    try {
      const res = await apiClient.post('/voice/interact', {
        message: text,
        language,
        active_draft_id: activeDraft?.draft_id || null,
      });

      const data = res.data;
      const botMsg: Message = {
        id: `assistant_${Date.now()}`,
        sender: 'assistant',
        text: data.reply_text,
        data: data.data,
        draftSummary: data.draft_summary,
        requiresConfirmation: data.requires_confirmation,
      };

      setMessages((prev) => [...prev, botMsg]);

      if (data.draft_summary) {
        setActiveDraft(data.draft_summary);
      }

      if (data.action_taken === 'BOOKING_CONFIRMED') {
        setActiveDraft(null);
        if (data.data?.booking_id && onBookingSuccess) {
          onBookingSuccess(data.data.booking_id);
        }
      }

      speakText(data.spoken_audio_transcript || data.reply_text);
    } catch (err: any) {
      console.error('Voice interaction error:', err);
      const errMsg: Message = {
        id: `err_${Date.now()}`,
        sender: 'assistant',
        text: 'Sorry, I encountered an error communicating with the agricultural engine. Please try again.',
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmDraft = async (draftId: string) => {
    setIsProcessing(true);
    try {
      const res = await apiClient.post('/voice/confirm', {
        draft_id: draftId,
        confirmation_phrase: 'confirm',
      });
      const data = res.data;
      const confMsg: Message = {
        id: `conf_${Date.now()}`,
        sender: 'assistant',
        text:
          language === 'kn'
            ? `ಬುಕಿಂಗ್ ಯಶಸ್ವಿಯಾಗಿ ದೃಢೀಕರಿಸಲಾಗಿದೆ! ಬುಕಿಂಗ್ ID #${data.booking_id}.`
            : `Booking confirmed successfully! Booking ID #${data.booking_id}.`,
        data,
      };
      setMessages((prev) => [...prev, confMsg]);
      setActiveDraft(null);
      speakText(confMsg.text);
      if (data.booking_id && onBookingSuccess) {
        onBookingSuccess(data.booking_id);
      }
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to confirm booking.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-2xl h-[650px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 px-6 bg-gradient-to-r from-forest-800 to-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <Sparkles className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-black text-base tracking-wide text-white">{t.voice.title}</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                  Gemini Live AI
                </span>
              </div>
              <p className="text-xs text-emerald-100/80">{t.tagline}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Language Switcher */}
            <div className="flex rounded-lg bg-white/10 p-0.5 text-xs">
              <button
                onClick={() => setLanguage('en')}
                className={`px-2 py-1 rounded-md font-semibold transition ${
                  language === 'en' ? 'bg-white text-forest-800 shadow-sm' : 'text-white/80 hover:text-white'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('kn')}
                className={`px-2 py-1 rounded-md font-semibold transition ${
                  language === 'kn' ? 'bg-white text-forest-800 shadow-sm' : 'text-white/80 hover:text-white'
                }`}
              >
                ಕನ್ನಡ
              </button>
            </div>

            {/* TTS Toggle */}
            <button
              onClick={() => setSpeechEnabled(!speechEnabled)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
              title={speechEnabled ? 'Mute Speech' : 'Enable Speech'}
            >
              {speechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Conversation Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/60 text-xs">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3.5 space-y-2 shadow-sm ${
                  m.sender === 'user'
                    ? 'bg-forest-700 text-white rounded-tr-none'
                    : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
                }`}
              >
                <div className="text-xs leading-relaxed whitespace-pre-wrap">{m.text}</div>

                {/* Explicit Booking Draft Confirmation Card */}
                {m.draftSummary && (
                  <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-2">
                    <div className="font-bold text-[11px] uppercase tracking-wider text-emerald-800 flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{t.voice.draftSummaryTitle}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                      <div>
                        <span className="text-gray-500">Machinery:</span>
                        <div className="font-semibold text-gray-900">{m.draftSummary.resource_name}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Operation:</span>
                        <div className="font-semibold text-gray-900">{m.draftSummary.operation}</div>
                      </div>
                      <div>
                        <span className="text-gray-500 flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>Start Time:</span>
                        </span>
                        <div className="font-semibold text-gray-900">{m.draftSummary.start_time.slice(0, 16).replace('T', ' ')}</div>
                      </div>
                      <div>
                        <span className="text-gray-500 flex items-center space-x-1">
                          <IndianRupee className="w-3 h-3" />
                          <span>Estimated Cost:</span>
                        </span>
                        <div className="font-bold text-emerald-700">₹{m.draftSummary.total_cost}</div>
                      </div>
                    </div>

                    <p className="text-[10px] text-amber-800 bg-amber-50 p-2 rounded border border-amber-200">
                      ⚠️ {t.voice.verbalConfirmationRequired}
                    </p>

                    <div className="flex space-x-2 pt-1">
                      <button
                        onClick={() => handleConfirmDraft(m.draftSummary.draft_id)}
                        disabled={isProcessing}
                        className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition shadow-sm"
                      >
                        {t.voice.confirmButton}
                      </button>
                      <button
                        onClick={() => setActiveDraft(null)}
                        className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs transition"
                      >
                        {t.voice.cancelButton}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none p-3 text-xs text-gray-400 flex items-center space-x-2 animate-pulse">
                <Sparkles className="w-4 h-4 text-emerald-600 animate-spin" />
                <span>Processing agricultural coordination request...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Listening Indicator Bar */}
        {isListening && (
          <div className="bg-emerald-50 px-4 py-2 border-t border-emerald-200 flex items-center justify-between text-xs text-emerald-800 animate-pulse">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
              <span className="font-semibold">{t.voice.listening}</span>
            </div>
            <button
              onClick={toggleListening}
              className="text-xs text-red-600 font-bold hover:underline"
            >
              Stop
            </button>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-gray-200 flex items-center space-x-2">
          {/* Mic Button */}
          <button
            onClick={toggleListening}
            className={`p-3 rounded-2xl transition shadow-sm ${
              isListening
                ? 'bg-red-500 text-white animate-bounce'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
            title={t.voice.clickToSpeak}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={t.voice.typePlaceholder}
            className="flex-1 bg-gray-50 border border-gray-300 rounded-2xl px-4 py-2.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-forest-600"
          />

          {/* Send Button */}
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || isProcessing}
            className="p-3 bg-forest-700 hover:bg-forest-800 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-2xl transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
