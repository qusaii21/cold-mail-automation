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
  bodyTemplate: `Hi,

I recently came across the opening for the {job_role} position and wanted to share my profile for your consideration.

Name: {name}
Education: B.Tech in Artificial Intelligence & Data Science, VIT Pune (2026)

Experience:
• Software Engineer Intern, Rapid7 – Built LLM pipelines, Apache Airflow automation, and QA workflows.
• Junior Software Developer, DesignerNest – Developed 25+ production web applications using React, Next.js, and Firebase.

Skills:
Python, Java, SQL, LangChain, CrewAI, RAG, AI Agents, Apache Airflow, React, Next.js, Flutter, Flask, Firebase, Supabase, MongoDB, MySQL, Git, Docker, CI/CD, REST APIs

Projects:

• AI Powered WhatsApp CRM
AI-powered CRM with AI Agents, LangChain, Firebase, and WhatsApp Cloud API.
GitHub: https://github.com/qusaii21/AI-WhatsApp-CRM

• Multi Agent Vulnerability Scanner
Autonomous multi-agent security system for vulnerability analysis and remediation.
GitHub: https://github.com/qusaii21/multi-agent-vulnerability-scanner

• AI Healthcare Platform (DevClash Winner)
AI-powered platform for medical jargon clarification, prescription understanding, and health insights.
GitHub: https://github.com/qusaii21/MediClear

Professional Links:
Portfolio: https://qusai-shergardwala.vercel.app
GitHub: {github}
LinkedIn: {linkedin}
Resume: https://drive.google.com/file/d/1pc0E0QbWKqBHFW3VoJ9gy9swc_pDo3ei/view

I've built production software independently and am now looking for an opportunity to work alongside experienced engineers, contribute to impactful products, and continue growing while building scalable systems.

I've attached my resume for your reference. I would appreciate your consideration and would be happy to discuss my experience further.

Thank you for your time, and I look forward to hearing from you.

Best regards,

{name}
Phone: {phone}
Email: {email}
LinkedIn: {linkedin}
GitHub: {github}`,
  accessCode: "mail-sender-code",
};

const STORAGE_KEY = "job-email-mailer:settings";

export function loadSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
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