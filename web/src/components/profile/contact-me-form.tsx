"use client";

import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  username: string;
};

export function ContactMeForm({ username }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          name,
          email,
          whatsapp,
          message,
        }),
      });

      const data = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        setFeedback(data.error ?? "Failed to send message.");
        return;
      }

      setFeedback(data.message ?? "Message sent.");
      setName("");
      setEmail("");
      setWhatsapp("");
      setMessage("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-zinc-900">Contact Me</h2>
        <p className="mt-1 text-sm text-zinc-600">Leave your inquiry and I will reply soon.</p>
      </div>

      <form className="space-y-3" onSubmit={submitForm}>
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Name"
          maxLength={80}
        />
        <Input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email *"
          required
        />
        <Input
          value={whatsapp}
          onChange={(event) => setWhatsapp(event.target.value)}
          placeholder="WhatsApp"
          maxLength={40}
        />
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Message"
          required
          maxLength={2000}
          className="min-h-28 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-500"
        />
        <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
          {submitting ? "Sending..." : "Send Inquiry"}
        </Button>
      </form>

      {feedback ? <p className="mt-3 text-sm text-zinc-600">{feedback}</p> : null}
    </section>
  );
}
