"use client";

import { useState } from "react";

export default function ContactForm() {
  const [cName, setCName] = useState("");
  const [cMail, setCMail] = useState("");
  const [cMsg, setCMsg] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <div className="bg-vh-card border border-vh-border rounded-2xl p-6 flex flex-col gap-3">
      <span className="font-bold text-vh-15 font-space-grotesk">Prefere e-mail? Escreva aqui</span>
      <input
        className="vh-input bg-vh-bg border border-vh-border rounded-vh-10 py-3.25 px-3.75 text-white font-medium text-vh-13-5 font-manrope outline-none"
        value={cName}
        onChange={(e) => setCName(e.target.value)}
        placeholder="Seu nome"
      />
      <input
        className="vh-input bg-vh-bg border border-vh-border rounded-vh-10 py-3.25 px-3.75 text-white font-medium text-vh-13-5 font-manrope outline-none"
        value={cMail}
        onChange={(e) => setCMail(e.target.value)}
        placeholder="Seu e-mail"
      />
      <textarea
        className="vh-input bg-vh-bg border border-vh-border rounded-vh-10 py-3.25 px-3.75 text-white font-medium text-vh-13-5 font-manrope outline-none resize-y"
        value={cMsg}
        onChange={(e) => setCMsg(e.target.value)}
        placeholder="Sua mensagem"
        rows={4}
      />
      <button
        className="vh-btn-lime bg-vh-lime border-0 rounded-vh-10 p-3.5 font-bold text-vh-14 font-space-grotesk cursor-pointer text-vh-ink!"
        onClick={() => {
          setCName("");
          setCMail("");
          setCMsg("");
          setSent(true);
          setTimeout(() => setSent(false), 2600);
        }}
      >
        Enviar mensagem
      </button>
      {sent && <span className="font-semibold text-vh-12-5 font-manrope text-vh-lime">Mensagem enviada! Retornaremos em breve.</span>}
    </div>
  );
}
