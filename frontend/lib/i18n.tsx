"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type Language = "en" | "ta" | "hi";
const translations: Record<Language, Record<string, string>> = {
  en: { dashboard: "Dashboard", jobs: "Jobs", profile: "Profile", payments: "Payments", invoice: "Invoices", booking: "Bookings & Tracking", reviews: "Reviews", emergency: "Emergency Service", notifications: "Notifications", messages: "Messages", settings: "Settings", availability: "Availability", passport: "Skill Passport", training: "Training & Welfare", signOut: "Sign Out", save: "Save" },
  ta: { dashboard: "முகப்பு", jobs: "வேலைகள்", profile: "சுயவிவரம்", payments: "கட்டணங்கள்", invoice: "ரசீதுகள்", booking: "முன்பதிவு மற்றும் கண்காணிப்பு", reviews: "மதிப்புரைகள்", emergency: "அவசர சேவை", notifications: "அறிவிப்புகள்", messages: "செய்திகள்", settings: "அமைப்புகள்", availability: "கிடைக்கும் நிலை", passport: "திறன் பாஸ்போர்ட்", training: "பயிற்சி மற்றும் நலன்", signOut: "வெளியேறு", save: "சேமி" },
  hi: { dashboard: "डैशबोर्ड", jobs: "काम", profile: "प्रोफ़ाइल", payments: "भुगतान", invoice: "चालान", booking: "बुकिंग और ट्रैकिंग", reviews: "समीक्षाएं", emergency: "आपातकालीन सेवा", notifications: "सूचनाएं", messages: "संदेश", settings: "सेटिंग्स", availability: "उपलब्धता", passport: "कौशल पासपोर्ट", training: "प्रशिक्षण और कल्याण", signOut: "साइन आउट", save: "सहेजें" },
};

type I18nContextValue = { language: Language; setLanguage: (language: Language) => void; t: (key: string) => string };
const I18nContext = createContext<I18nContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => { if (typeof window === "undefined") return "en"; const saved = window.localStorage.getItem("bp_language"); return saved === "ta" || saved === "hi" || saved === "en" ? saved : "en"; });
  function setLanguage(next: Language) { setLanguageState(next); window.localStorage.setItem("bp_language", next); }
  return <I18nContext.Provider value={{ language, setLanguage, t: (key) => translations[language][key] || translations.en[key] || key }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside LanguageProvider");
  return value;
}

export function LanguageSwitcher() {
  const { language, setLanguage } = useI18n();
  return <label className="inline-flex items-center gap-2 text-xs text-slate-600"><span className="sr-only">Language</span><select aria-label="Language" value={language} onChange={(event) => setLanguage(event.target.value as Language)} className="rounded-lg border bg-white px-2 py-1"><option value="en">English</option><option value="ta">தமிழ்</option><option value="hi">हिन्दी</option></select></label>;
}
