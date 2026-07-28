"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_SETTINGS,
  Settings,
  fillTemplate,
  loadSettings,
  saveSettings,
} from "./lib/settings";

type SendState = "idle" | "sending" | "success" | "error";

export default function Home() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [recruiterEmail, setRecruiterEmail] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [sendState, setSendState] = useState<SendState>("idle");
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    setSettings(loadSettings());
    setHydrated(true);
  }, []);

  function updateSettings(partial: Partial<Settings>) {
    const next = { ...settings, ...partial };
    setSettings(next);
    saveSettings(next);
  }

  async function handleSend() {
    if (!recruiterEmail.trim() || !jobRole.trim()) {
      setSendState("error");
      setStatusMessage("Recruiter email and job role are both required.");
      return;
    }

    const fillValues = {
      job_role: jobRole.trim(),
      name: settings.name,
      phone: settings.phone,
      email: settings.email,
      linkedin: settings.linkedin,
      github: settings.github,
    };
    const subject = fillTemplate(settings.subjectTemplate, fillValues);
    const text = fillTemplate(settings.bodyTemplate, fillValues);

    setSendState("sending");
    setStatusMessage("Sending…");

    try {
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: recruiterEmail.trim(),
          subject,
          text,
          accessCode: settings.accessCode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send.");

      setSendState("success");
      setStatusMessage("Sent successfully.");
      setRecruiterEmail("");
      setJobRole("");
    } catch (err: any) {
      setSendState("error");
      setStatusMessage(err.message || "Something went wrong.");
    }
  }

  if (!hydrated) return null;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="w-full max-w-xl">
        <div className="mb-6 flex items-baseline justify-between px-1">
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-200">
            Correspondence
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-400">
            No. {new Date().toISOString().slice(0, 10).replaceAll("-", ".")}
          </span>
        </div>

        <div className="deckle rounded-[2px] bg-paper px-8 py-10 sm:px-12 sm:py-12">
          <h1 className="font-display text-3xl text-ink-900">
            Send a job application
          </h1>
          <p className="mt-2 font-mono text-[13px] text-ink-700">
            Fill in the recruiter and role. Everything else is drawn from your template.
          </p>

          <div className="mt-10 space-y-7">
            <Field label="Recruiter Email">
              <input
                type="email"
                value={recruiterEmail}
                onChange={(e) => setRecruiterEmail(e.target.value)}
                placeholder="recruiter@company.com"
                className="w-full bg-transparent py-2 font-display text-lg text-ink-900 outline-none placeholder:text-ink-700/40"
              />
            </Field>

            <Field label="Job Role">
              <input
                type="text"
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                placeholder="Machine Learning Intern"
                className="w-full bg-transparent py-2 font-display text-lg text-ink-900 outline-none placeholder:text-ink-700/40"
              />
            </Field>
          </div>

          <button
            onClick={handleSend}
            disabled={sendState === "sending"}
            className="group relative mt-10 flex w-full items-center justify-center gap-3 rounded-[2px] bg-ink-900 py-3.5 font-mono text-[13px] uppercase tracking-[0.15em] text-paper transition-colors hover:bg-ink-800 disabled:opacity-60"
          >
            <SealIcon />
            {sendState === "sending" ? "Sending…" : "Send Email"}
          </button>

          {statusMessage && (
            <p
              className={`mt-4 text-center font-mono text-[13px] ${
                sendState === "error" ? "text-signal-bad" : "text-signal-good"
              }`}
            >
              {sendState === "error" ? "✕ " : sendState === "success" ? "✓ " : ""}
              {statusMessage}
            </p>
          )}

          <button
            onClick={() => setSettingsOpen((v) => !v)}
            className="mt-10 flex w-full items-center justify-between border-t border-ink-900/10 pt-5 font-mono text-[11px] uppercase tracking-[0.15em] text-ink-700 hover:text-ink-900"
          >
            <span>Settings &amp; Template</span>
            <span className="text-brass">{settingsOpen ? "−" : "+"}</span>
          </button>

          {settingsOpen && (
            <SettingsPanel settings={settings} onChange={updateSettings} />
          )}
        </div>

        <p className="mt-5 px-1 text-center font-mono text-[11px] text-ink-400">
          Resume is attached automatically from the deployed bundle.
        </p>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[11px] uppercase tracking-[0.15em] text-ink-700">
        {label}
      </span>
      <div className="field-underline">{children}</div>
    </label>
  );
}

function SealIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-brass-light">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 12l2.5 2.5L16 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SettingsPanel({
  settings,
  onChange,
}: {
  settings: Settings;
  onChange: (partial: Partial<Settings>) => void;
}) {
  return (
    <div className="mt-6 space-y-6 border-t border-dashed border-ink-900/15 pt-6">
      <Section title="Templates">
        <TextField
          label="Subject Template"
          value={settings.subjectTemplate}
          onChange={(v) => onChange({ subjectTemplate: v })}
        />
        <TextArea
          label="Body Template"
          value={settings.bodyTemplate}
          onChange={(v) => onChange({ bodyTemplate: v })}
          rows={10}
        />
        <p className="font-mono text-[11px] text-ink-400">
          Placeholders: {"{job_role} {name} {phone} {email} {linkedin} {github}"}
        </p>
      </Section>

      <Section title="Your Info">
        <TextField label="Name" value={settings.name} onChange={(v) => onChange({ name: v })} />
        <TextField label="Phone" value={settings.phone} onChange={(v) => onChange({ phone: v })} />
        <TextField label="Email" value={settings.email} onChange={(v) => onChange({ email: v })} />
        <TextField label="LinkedIn" value={settings.linkedin} onChange={(v) => onChange({ linkedin: v })} />
        <TextField label="GitHub" value={settings.github} onChange={(v) => onChange({ github: v })} />
      </Section>

      <Section title="Access">
        <TextField
          label="Access Code (must match APP_ACCESS_CODE in Vercel)"
          value={settings.accessCode}
          onChange={(v) => onChange({ accessCode: v })}
          type="password"
        />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-brass-dark">
        {title}
      </h2>
      {children}
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[11px] text-ink-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="field-underline w-full bg-transparent py-1.5 font-mono text-[13px] text-ink-900 outline-none"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows = 6,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[11px] text-ink-700">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="field-underline w-full resize-y bg-transparent py-1.5 font-mono text-[13px] leading-relaxed text-ink-900 outline-none"
      />
    </label>
  );
}
