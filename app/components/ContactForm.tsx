"use client";

import { useState } from "react";
import { css } from "../lib/css";

export default function ContactForm() {
  const [cName, setCName] = useState("");
  const [cMail, setCMail] = useState("");
  const [cMsg, setCMsg] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <div style={css("background:#1D0333;border:1px solid #341052;border-radius:16px;padding:24px;display:flex;flex-direction:column;gap:12px")}>
      <span style={css("font:700 15px 'Space Grotesk',sans-serif")}>Prefere e-mail? Escreva aqui</span>
      <input
        className="vh-input"
        value={cName}
        onChange={(e) => setCName(e.target.value)}
        placeholder="Seu nome"
        style={css("background:#120020;border:1px solid #341052;border-radius:10px;padding:13px 15px;color:#FFFFFF;font:500 13.5px 'Manrope',sans-serif;outline:none")}
      />
      <input
        className="vh-input"
        value={cMail}
        onChange={(e) => setCMail(e.target.value)}
        placeholder="Seu e-mail"
        style={css("background:#120020;border:1px solid #341052;border-radius:10px;padding:13px 15px;color:#FFFFFF;font:500 13.5px 'Manrope',sans-serif;outline:none")}
      />
      <textarea
        className="vh-input"
        value={cMsg}
        onChange={(e) => setCMsg(e.target.value)}
        placeholder="Sua mensagem"
        rows={4}
        style={css("background:#120020;border:1px solid #341052;border-radius:10px;padding:13px 15px;color:#FFFFFF;font:500 13.5px 'Manrope',sans-serif;outline:none;resize:vertical")}
      />
      <button
        className="vh-btn-lime"
        onClick={() => {
          setCName("");
          setCMail("");
          setCMsg("");
          setSent(true);
          setTimeout(() => setSent(false), 2600);
        }}
        style={css("background:#8CFF00;color:#09050D;border:none;border-radius:10px;padding:14px;font:700 14px 'Space Grotesk',sans-serif;cursor:pointer")}
      >
        Enviar mensagem
      </button>
      {sent && <span style={css("font:600 12.5px 'Manrope',sans-serif;color:#8CFF00")}>Mensagem enviada! Retornaremos em breve.</span>}
    </div>
  );
}
