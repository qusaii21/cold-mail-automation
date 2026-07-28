export type Settings = {
  name: string;
  phone: string;
  email: string;
  linkedin: string;
  github: string;
  subjectTemplate: string;
  bodyTemplate: string;
  accessCode: string; // the code the browser uses to authenticate to /api/send
};

export const DEFAULT_SETTINGS: Settings = {
  name: "Qusai Shergardwala",
  phone: "+919665153602",
  email: "qusher9953@gmail.com",
  linkedin: "https://linkedin.com/in/qusai-shergardwala-8a6404259",
  github: "https://github.com/qusaii21",
  subjectTemplate: "Application for {job_role} - {name}",
  accessCode: "mail-sender-code",
  bodyTemplate: `Hi,

I'm reaching out regarding the **{job_role}** position and would like to share my profile.

I'm a **B.Tech graduate in Artificial Intelligence & Data Science from VIT Pune (2026)** with experience building **AI applications**, **automation systems**, and **production software**.

**Experience**
• **Software Engineer Intern, Rapid7** – Built **LLM pipelines**, **Apache Airflow automation**, and **QA workflows** for production security systems.
• **Junior Software Developer, DesignerNest** – Developed and deployed **25+ production web applications** using **React, Next.js, and Firebase**.

**Technical Skills**
Python • Java • SQL • LangChain • CrewAI • AI Agents • RAG • Apache Airflow • React • Next.js • Flutter • Flask • Firebase • Supabase • MongoDB • MySQL • Git • Docker • CI/CD • REST APIs • FastAPI

**Professional Links**
Portfolio: https://qusai-shergardwala.vercel.app
GitHub: {github}
LinkedIn: {linkedin}
Resume: https://drive.google.com/file/d/1pc0E0QbWKqBHFW3VoJ9gy9swc_pDo3ei/view

I've attached my resume for your reference and would appreciate the opportunity to discuss how I can contribute to your team.

Thank you for your time. I look forward to hearing from you.

Best regards,

{name}
Phone: {phone}
Email: {email}`,
};

const STORAGE_KEY = "job-email-mailer:settings";

// Bump this whenever DEFAULT_SETTINGS (name/phone/links/template) changes.
// Without this, anyone who already has settings saved in their browser
// would keep loading their old cached copy forever -- code changes to the
// defaults would silently never reach them, which is exactly what caused
// blank Phone/Email/LinkedIn/GitHub fields and an out-of-date body
// template even after the template in this file was fixed.
const SETTINGS_VERSION = 2;
const VERSION_KEY = "job-email-mailer:settings-version";

export function loadSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const storedVersion = Number(window.localStorage.getItem(VERSION_KEY) || "0");
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw || storedVersion < SETTINGS_VERSION) {
      // Stale or missing: start from fresh defaults, but keep the access
      // code if one was already set, since that's a real secret the user
      // configured to match Vercel and shouldn't get wiped by a template
      // update.
      let accessCode = DEFAULT_SETTINGS.accessCode;
      if (raw) {
        try {
          const old = JSON.parse(raw);
          if (old.accessCode) accessCode = old.accessCode;
        } catch {
          // ignore unparsable old data
        }
      }
      const fresh = { ...DEFAULT_SETTINGS, accessCode };
      saveSettings(fresh);
      return fresh;
    }

    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  window.localStorage.setItem(VERSION_KEY, String(SETTINGS_VERSION));
}

export function resetSettingsToDefaults(): Settings {
  const fresh = { ...DEFAULT_SETTINGS };
  saveSettings(fresh);
  return fresh;
}

const PLACEHOLDER_KEYS = [
  "job_role",
  "name",
  "phone",
  "email",
  "linkedin",
  "github",
] as const;

export function fillTemplate(
  template: string,
  values: Record<string, string>
): string {
  let result = template;
  for (const key of PLACEHOLDER_KEYS) {
    result = result.split(`{${key}}`).join(values[key] ?? "");
  }
  return result;
}