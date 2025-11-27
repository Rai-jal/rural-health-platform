"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

export type Language = "English" | "Krio" | "Mende" | "Temne" | "Limba"

interface LanguageContextType {
  currentLanguage: Language
  setCurrentLanguage: (language: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// Translation object
const translations: Record<Language, Record<string, string>> = {
  English: {
    // Header
    "header.title": "HealthConnect",
    "header.online": "Online",
    "header.offline": "Offline Mode",

    // Hero Section
    "hero.title": "Healthcare Access for Every Rural Woman",
    "hero.subtitle":
      "Breaking barriers to healthcare through virtual consultations, health education, and mobile-friendly solutions designed for rural communities in Sierra Leone.",
    "hero.feature_phone": "Feature Phone Support",
    "hero.voice_nav": "Voice Navigation",
    "hero.offline": "Offline Access",
    "hero.multilingual": "Multilingual",
    "hero.book_consultation": "Book Consultation",
    "hero.health_education": "Health Education",

    // Platform Access
    "access.title": "Multiple Ways to Access Care",
    "access.smartphone": "Smartphone App",
    "access.smartphone_desc": "Full-featured mobile application with video consultations",
    "access.ussd": "Feature Phone (USSD)",
    "access.ussd_desc": "Basic phone access through USSD codes and SMS",
    "access.voice": "Voice Calls (IVR)",
    "access.voice_desc": "Interactive voice response for illiterate users",

    // Features
    "features.title": "Platform Features",
    "features.consultations": "Virtual Consultations",
    "features.consultations_desc": "Connect with healthcare providers via video, voice, or text",
    "features.education": "Health Education",
    "features.education_desc": "Audio and visual content on maternal health and wellness",
    "features.payments": "Mobile Payments",
    "features.payments_desc": "Affordable healthcare payments via mobile money",
    "features.community": "Community Support",
    "features.community_desc": "Connect with other women and health advocates",

    // Offline Section
    "offline.title": "Works Even When You're Offline",
    "offline.subtitle":
      "Access essential health information and schedule consultations even with limited internet connectivity",
    "offline.health_content": "Offline Health Content",
    "offline.sms_voice": "SMS & Voice Services",

    // Quick Actions
    "actions.title": "Get Started Today",
    "actions.book": "Book Consultation",
    "actions.book_desc": "Schedule a virtual appointment with a healthcare provider",
    "actions.learn": "Listen & Learn",
    "actions.learn_desc": "Access audio health education in your language",
    "actions.call": "Call for Help",
    "actions.call_desc": "Dial *123# from any phone for immediate assistance",
    "actions.book_now": "Book Now",
    "actions.start_learning": "Start Learning",

    // Footer
    "footer.tagline": "Bridging healthcare gaps for rural women in Sierra Leone and beyond.",
    "footer.services": "Services",
    "footer.access_methods": "Access Methods",
    "footer.emergency": "Emergency",
    "footer.emergency_line": "24/7 Emergency Line",
    "footer.copyright": "Empowering rural women through accessible healthcare.",

    // Common
    "common.back": "Back",
    "common.loading": "Loading...",
    "common.error": "Error",
  },

  Krio: {
    // Header
    "header.title": "HealthConnect",
    "header.online": "Na online",
    "header.offline": "Offline mode",

    // Hero Section
    "hero.title": "Helth kia fɔ ɔl rural uman",
    "hero.subtitle":
      "Wi de brok barera fɔ helth kia tru vaɔyal kɔnsɔlteshɔn, helth ɛdyukeshɔn, ɛn mobayl-frɛndli sɔlushɔn dɛn we wi mek fɔ rural kɔmyuniti dɛn na Siɛra Liɔn.",
    "hero.feature_phone": "Fichɔ fon sɔpot",
    "hero.voice_nav": "Vɔys navigeshɔn",
    "hero.offline": "Offline akses",
    "hero.multilingual": "Bɔku langwej",
    "hero.book_consultation": "Buk kɔnsɔlteshɔn",
    "hero.health_education": "Helth ɛdyukeshɔn",

    // Platform Access
    "access.title": "Bɔku we fɔ akses kia",
    "access.smartphone": "Smat fon app",
    "access.smartphone_desc": "Kɔmplit mobayl aplikeshɔn wit vidio kɔnsɔlteshɔn",
    "access.ussd": "Fichɔ fon (USSD)",
    "access.ussd_desc": "Besik fon akses tru USSD kod ɛn SMS",
    "access.voice": "Vɔys kɔl (IVR)",
    "access.voice_desc": "Intaraktiv vɔys rispɔns fɔ pipul we nɔ no fɔ rid",

    // Features
    "features.title": "Platfɔm fichɔ dɛn",
    "features.consultations": "Vaɔyal kɔnsɔlteshɔn",
    "features.consultations_desc": "Kɔnɛkt wit helth kia prɔvayd dɛn tru vidio, vɔys, ɔ tɛks",
    "features.education": "Helth ɛdyukeshɔn",
    "features.education_desc": "Audio ɛn vizual kɔntɛnt bɔt mata helth ɛn wɛlnɛs",
    "features.payments": "Mobayl peymɛnt",
    "features.payments_desc": "Afɔdabol helth kia peymɛnt tru mobayl mɔni",
    "features.community": "Kɔmyuniti sɔpot",
    "features.community_desc": "Kɔnɛkt wit ɔda uman ɛn helth advokat dɛn",

    // Offline Section
    "offline.title": "I de wok ivin we yu offline",
    "offline.subtitle": "Akses impɔtant helth infɔmeshɔn ɛn skɛdul kɔnsɔlteshɔn ivin we intanɛt nɔ gud",
    "offline.health_content": "Offline helth kɔntɛnt",
    "offline.sms_voice": "SMS ɛn vɔys savis dɛn",

    // Quick Actions
    "actions.title": "Stat tide",
    "actions.book": "Buk kɔnsɔlteshɔn",
    "actions.book_desc": "Skɛdul vaɔyal apɔyntmɛnt wit helth kia prɔvayd",
    "actions.learn": "Lisin ɛn lan",
    "actions.learn_desc": "Akses audio helth ɛdyukeshɔn na yu langwej",
    "actions.call": "Kɔl fɔ hɛlp",
    "actions.call_desc": "Dayal *123# frɔm ɛni fon fɔ imidet asistans",
    "actions.book_now": "Buk naw",
    "actions.start_learning": "Stat fɔ lan",

    // Footer
    "footer.tagline": "Wi de braj helth kia gap fɔ rural uman dɛn na Siɛra Liɔn ɛn biɔn.",
    "footer.services": "Savis dɛn",
    "footer.access_methods": "Akses we dɛn",
    "footer.emergency": "Emajɛnsi",
    "footer.emergency_line": "24/7 Emajɛnsi layn",
    "footer.copyright": "Wi de ɛmpawa rural uman dɛn tru akses helth kia tɛknɔlɔji.",

    // Common
    "common.back": "Go bak",
    "common.loading": "De lod...",
    "common.error": "Prɔblɛm",
  },

  Mende: {
    // Header
    "header.title": "HealthConnect",
    "header.online": "Online",
    "header.offline": "Offline mode",

    // Hero Section
    "hero.title": "Halεkpε gbua woyei nja woisia",
    "hero.subtitle":
      "Mu gboyama halεkpε nyandεmui lεkεi virtual consultation, halεkpε kpoyεngoi, li mobile-friendly solution nyamui ye Sierra Leone nja woisia ma.",
    "hero.feature_phone": "Feature phone support",
    "hero.voice_nav": "Voice navigation",
    "hero.offline": "Offline access",
    "hero.multilingual": "Kpεlε kpεlε kpele",
    "hero.book_consultation": "Consultation book kε",
    "hero.health_education": "Halεkpε kpoyεngo",

    // Platform Access
    "access.title": "Halεkpε nyandε gboyaηηa kpεlε kpεlε",
    "access.smartphone": "Smartphone app",
    "access.smartphone_desc": "Mobile application kpete ye video consultation ka",
    "access.ussd": "Feature phone (USSD)",
    "access.ussd_desc": "Phone nyande kpakala tii USSD codes li SMS",
    "access.voice": "Voice calls (IVR)",
    "voice.voice_desc": "Interactive voice response kpoya wosia ti",

    // Features
    "features.title": "Platform feature nyamui",
    "features.consultations": "Virtual consultations",
    "features.consultations_desc": "Halεkpε nyandε woisia ma kpakala video, voice, bee text tii",
    "features.education": "Halεkpε kpoyεngo",
    "features.education_desc": "Audio li visual content nya halεkpε li wellness ka",
    "features.payments": "Mobile payments",
    "features.payments_desc": "Halεkpε payment kpakala mobile money tii",
    "features.community": "Community support",
    "features.community_desc": "Woisia koηkoη li halεkpε advocate nyamui ma kpakala",

    // Offline Section
    "offline.title": "I le gbua offline haa",
    "offline.subtitle": "Halεkpε kpele nya nyande li consultation schedule kε internet ti ta haa",
    "offline.health_content": "Offline halεkpε content",
    "offline.sms_voice": "SMS li voice services",

    // Quick Actions
    "actions.title": "Loni domεi",
    "actions.book": "Consultation book kε",
    "actions.book_desc": "Virtual appointment schedule kε halεkpε provider ma",
    "actions.learn": "Gbε li kpoyε",
    "actions.learn_desc": "Audio halεkpε kpoyεngo nya wa kpele ka",
    "actions.call": "Call kε support va",
    "actions.call_desc": "*123# dial kε phone kpete ga immediate assistance va",
    "actions.book_now": "Loni book kε",
    "actions.start_learning": "Kpoyεngo domεi",

    // Footer
    "footer.tagline": "Sierra Leone nja woisia halεkpε gap kpoyama.",
    "footer.services": "Services",
    "footer.access_methods": "Access methods",
    "footer.emergency": "Emergency",
    "footer.emergency_line": "24/7 Emergency line",
    "footer.copyright": "Nja woisia empower kε accessible healthcare tii.",

    // Common
    "common.back": "Gbla ya",
    "common.loading": "Loading...",
    "common.error": "Error",
  },

  Temne: {
    // Header
    "header.title": "HealthConnect",
    "header.online": "Online",
    "header.offline": "Offline mode",

    // Hero Section
    "hero.title": "Ka-yire kur yen ka-musoe ra-yirene",
    "hero.subtitle":
      "Ka-yire kur meren virtual consultation, ka-yire karanke, ane mobile-friendly solution yo Sierra Leone ra-yirene musoe ra.",
    "hero.feature_phone": "Feature phone support",
    "hero.voice_nav": "Voice navigation",
    "hero.offline": "Offline access",
    "hero.multilingual": "K-ankampe rankampe",
    "hero.book_consultation": "Consultation book",
    "hero.health_education": "Ka-yire karanke",

    // Platform Access
    "access.title": "Ka-yire kur meren k-ala",
    "access.smartphone": "Smartphone app",
    "access.smartphone_desc": "Mobile application kemeren yo video consultation ane",
    "access.ussd": "Feature phone (USSD)",
    "access.ussd_desc": "Phone kur k-ala USSD codes ane SMS yo",
    "access.voice": "Voice calls (IVR)",
    "access.voice_desc": "Interactive voice response k-ara musoe ra",

    // Features
    "features.title": "Platform features yo",
    "features.consultations": "Virtual consultations",
    "features.consultations_desc": "Ka-yire kur musoe yo gbanka video, voice, ka text yo",
    "features.education": "Ka-yire karanke",
    "features.education_desc": "Audio ane visual content ka-yire ane wellness ka",
    "features.payments": "Mobile payments",
    "features.payments_desc": "Ka-yire payment mobile money yo",
    "features.community": "Community support",
    "features.community_desc": "Musoe fele ane ka-yire advocate yo ma gbanka",

    // Offline Section
    "offline.title": "I ra gbua offline hinta",
    "offline.subtitle": "Ka-yire information kemeren ane consultation schedule internet ka sara hinta",
    "offline.health_content": "Offline ka-yire content",
    "offline.sms_voice": "SMS ane voice services",

    // Quick Actions
    "actions.title": "Teni domisia",
    "actions.book": "Consultation book",
    "actions.book_desc": "Virtual appointment schedule ka-yire provider ma",
    "actions.learn": "Gbanka ane karan",
    "actions.learn_desc": "Audio ka-yire karanke a k-ankampe ra",
    "actions.call": "Call k-ala support",
    "actions.call_desc": "*123# dial phone kemeren ra immediate assistance",
    "actions.book_now": "Teni book",
    "actions.start_learning": "Karanke domisia",

    // Footer
    "footer.tagline": "Sierra Leone ra-yirene musoe ka-yire gap k-oyama.",
    "footer.services": "Services",
    "footer.access_methods": "Access methods",
    "footer.emergency": "Emergency",
    "footer.emergency_line": "24/7 Emergency line",
    "footer.copyright": "Ra-yirene musoe empower accessible healthcare yo.",

    // Common
    "common.back": "Gbla bu",
    "common.loading": "Loading...",
    "common.error": "Error",
  },

  Limba: {
    // Header
    "header.title": "HealthConnect",
    "header.online": "Online",
    "header.offline": "Offline mode",

    // Hero Section
    "hero.title": "Ka-hulke gbua fina ka-mase kamara",
    "hero.subtitle":
      "Ka-hulke gbua meren virtual consultation, ka-hulke koyengo, den mobile-friendly solution yo Sierra Leone kamara mase ma.",
    "hero.feature_phone": "Feature phone support",
    "hero.voice_nav": "Voice navigation",
    "hero.offline": "Offline access",
    "hero.multilingual": "Ka-lingala kpele kpele",
    "hero.book_consultation": "Consultation book ke",
    "hero.health_education": "Ka-hulke koyengo",

    // Platform Access
    "access.title": "Ka-hulke gbua meren ka-hala",
    "access.smartphone": "Smartphone app",
    "access.smartphone_desc": "Mobile application kemeren yo video consultation den",
    "access.ussd": "Feature phone (USSD)",
    "access.ussd_desc": "Phone gbua ka-hala USSD codes den SMS yo",
    "access.voice": "Voice calls (IVR)",
    "access.voice_desc": "Interactive voice response ka-ara mase ma",

    // Features
    "features.title": "Platform features yo",
    "features.consultations": "Virtual consultations",
    "features.consultations_desc": "Ka-hulke gbua mase yo gbanka video, voice, ka text yo",
    "features.education": "Ka-hulke koyengo",
    "features.education_desc": "Audio den visual content ka-hulke den wellness ka",
    "features.payments": "Mobile payments",
    "features.payments_desc": "Ka-hulke payment mobile money yo",
    "features.community": "Community support",
    "features.community_desc": "Mase folo den ka-hulke advocate yo ma gbanka",

    // Offline Section
    "offline.title": "I ra gbua offline hinta",
    "offline.subtitle": "Ka-hulke information kemeren den consultation schedule internet ka sara hinta",
    "offline.health_content": "Offline ka-hulke content",
    "offline.sms_voice": "SMS den voice services",

    // Quick Actions
    "actions.title": "Teni domisia",
    "actions.book": "Consultation book ke",
    "actions.book_desc": "Virtual appointment schedule ka-hulke provider ma",
    "actions.learn": "Gbanka den koyen",
    "actions.learn_desc": "Audio ka-hulke koyengo a ka-lingala ra",
    "actions.call": "Call ka-hala support",
    "actions.call_desc": "*123# dial phone kemeren ra immediate assistance",
    "actions.book_now": "Teni book ke",
    "actions.start_learning": "Koyengo domisia",

    // Footer
    "footer.tagline": "Sierra Leone kamara mase ka-hulke gap ka-oyama.",
    "footer.services": "Services",
    "footer.access_methods": "Access methods",
    "footer.emergency": "Emergency",
    "footer.emergency_line": "24/7 Emergency line",
    "footer.copyright": "Kamara mase empower accessible healthcare yo.",

    // Common
    "common.back": "Gbla bu",
    "common.loading": "Loading...",
    "common.error": "Error",
  },
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState<Language>("English")

  // Load saved language from localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem("selectedLanguage") as Language
    if (savedLanguage && translations[savedLanguage]) {
      setCurrentLanguage(savedLanguage)
    }
  }, [])

  // Save language to localStorage when changed
  const handleLanguageChange = (language: Language) => {
    setCurrentLanguage(language)
    localStorage.setItem("selectedLanguage", language)
  }

  // Translation function
  const t = (key: string): string => {
    return translations[currentLanguage][key] || translations["English"][key] || key
  }

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        setCurrentLanguage: handleLanguageChange,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
