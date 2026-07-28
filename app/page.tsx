"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_SETTINGS,
  Settings,
  fillTemplate,
  loadSettings,
  resetSettingsToDefaults,
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

  // Optional one-off resume that replaces the default for this send only.
  // Kept purely in memory (state) -- never persisted, never uploaded until
  // Send is clicked.
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeBase64, setResumeBase64] = useState<string | null>(null);

  async function handleResumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setResumeFile(file);
    if (!file) {
      setResumeBase64(null);
      return;
    }
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
    setResumeBase64(base64);
  }

  useEffect(() => {
    setSettings(loadSettings());
    setHydrated(true);
  }, []);

  function updateSettings(partial: Partial<Settings>) {
    const next = { ...settings, ...partial };
    setSettings(next);
    saveSettings(next);
  }

  function handleResetSettings() {
    if (!confirm("Reset your name/contact info and body template back to the built-in defaults? This can't be undone.")) {
      return;
    }
    setSettings(resetSettingsToDefaults());
  }

  // Splits on commas, semicolons, or newlines so people can paste a list
  // from anywhere without worrying about the exact separator.
  function parseRecipients(raw: string): string[] {
    return Array.from(
      new Set(
        raw
          .split(/[,;\n]+/)
          .map((s) => s.trim())
          .filter(Boolean)
      )
    );
  }

  async function sendOne(to: string, subject: string, text: string) {
    const res = await fetch("/api/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to,
        subject,
        text,
        accessCode: settings.accessCode,
        ...(resumeBase64
          ? { resumeBase64, resumeFilename: resumeFile?.name }
          : {}),
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to send.");
  }

  async function handleSend() {
    const recipients = parseRecipients(recruiterEmail);

    if (recipients.length === 0 || !jobRole.trim()) {
      setSendState("error");
      setStatusMessage("At least one recruiter email and a job role are required.");
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

    // Send individually to each recipient (each gets their own email --
    // nobody sees the others in a To:/Cc: list), one at a time so the
    // status message can track progress.
    const failed: string[] = [];
    for (let i = 0; i < recipients.length; i++) {
      setStatusMessage(`Sending ${i + 1} of ${recipients.length}…`);
      try {
        await sendOne(recipients[i], subject, text);
      } catch {
        failed.push(recipients[i]);
      }
    }

    if (failed.length === 0) {
      setSendState("success");
      setStatusMessage(
        recipients.length === 1
          ? "Sent successfully."
          : `Sent successfully to all ${recipients.length} recipients.`
      );
      setRecruiterEmail("");
      setJobRole("");
    } else if (failed.length === recipients.length) {
      setSendState("error");
      setStatusMessage("Failed to send to all recipients.");
    } else {
      setSendState("error");
      setStatusMessage(
        `Sent to ${recipients.length - failed.length} of ${recipients.length}. Failed: ${failed.join(", ")}`
      );
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
            <Field label="Recruiter Email(s)">
              <textarea
                value={recruiterEmail}
                onChange={(e) => setRecruiterEmail(e.target.value)}
                placeholder="recruiter@company.com, another@company.com"
                rows={2}
                className="w-full resize-y bg-transparent py-2 font-display text-lg text-ink-900 outline-none placeholder:text-ink-700/40"
              />
            </Field>
            <p className="-mt-4 font-mono text-[11px] text-ink-400">
              Separate multiple addresses with commas, semicolons, or new lines — each recipient gets their own individual email.
            </p>

            <Field label="Job Role">
              <input
                type="text"
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                placeholder="Machine Learning Intern"
                className="w-full bg-transparent py-2 font-display text-lg text-ink-900 outline-none placeholder:text-ink-700/40"
              />
            </Field>

            <Field label="Resume (optional — replaces the default for this send only)">
              <input
                type="file"
                accept="application/pdf"
                onChange={handleResumeChange}
                className="w-full bg-transparent py-2 font-mono text-[13px] text-ink-900 outline-none file:mr-3 file:rounded-[2px] file:border-0 file:bg-ink-900 file:px-3 file:py-1.5 file:font-mono file:text-[11px] file:uppercase file:tracking-[0.1em] file:text-paper"
              />
              {resumeFile && (
                <span className="mt-1 block font-mono text-[11px] text-ink-400">
                  {resumeFile.name} will be sent instead of the default resume.{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setResumeFile(null);
                      setResumeBase64(null);
                    }}
                    className="underline hover:text-ink-900"
                  >
                    Remove
                  </button>
                </span>
              )}
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
            <SettingsPanel
              settings={settings}
              onChange={updateSettings}
              onReset={handleResetSettings}
            />
          )}
        </div>

        <p className="mt-5 px-1 text-center font-mono text-[11px] text-ink-400">
          Resume is attached automatically from the deployed bundle, unless you upload one above for this send only.
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
  onReset,
}: {
  settings: Settings;
  onChange: (partial: Partial<Settings>) => void;
  onReset: () => void;
}) {
  return (
    <div className="mt-6 space-y-6 border-t border-dashed border-ink-900/15 pt-6">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] text-ink-400">
          Info or template looking stale? Reset to what's in the deployed code.
        </p>
        <button
          type="button"
          onClick={onReset}
          className="shrink-0 rounded-[2px] border border-ink-900/20 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-700 hover:border-ink-900/40 hover:text-ink-900"
        >
          Reset to Defaults
        </button>
      </div>

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
