import { css } from "../lib/css";
import { getSiteSettings } from "../lib/strapi";

export default async function SobrePage() {
  const settings = await getSiteSettings();
  return (
    <section style={css("max-width:980px;margin:0 auto;padding:56px 24px;width:100%")}>
      <span style={css("font:700 11.5px 'Space Grotesk',sans-serif;letter-spacing:.18em;text-transform:uppercase;color:#8CFF00")}>{settings.aboutEyebrow}</span>
      <h1 style={css("margin:10px 0 16px;font:700 clamp(30px,4vw,42px)/1.1 'Space Grotesk',sans-serif")}>{settings.aboutHeadline}</h1>
      <p style={css("margin:0 0 36px;max-width:620px;font:500 15px/1.75 'Manrope',sans-serif;color:#D8D5E0")}>{settings.aboutText}</p>
      <div style={css("display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;margin-bottom:36px")}>
        {settings.aboutStats.map((s, i) => (
          <div key={i} style={css("background:#1D0333;border:1px solid #341052;border-radius:14px;padding:24px")}>
            <span style={css("font:700 30px 'Space Grotesk',sans-serif;color:#8CFF00")}>{s.value}</span>
            <p style={css("margin:6px 0 0;font:500 13px 'Manrope',sans-serif;color:#9690A3")}>{s.label}</p>
          </div>
        ))}
      </div>
      <div
        style={css(
          "aspect-ratio:21/9;background:repeating-linear-gradient(45deg,#2A0A45 0 14px,#24063C 14px 28px);border:1px solid #341052;border-radius:18px;display:flex;align-items:center;justify-content:center"
        )}
      >
        <span style={css("font:500 12px ui-monospace,monospace;color:#9690A3;background:rgba(9,5,13,.55);padding:6px 12px;border-radius:6px")}>[foto: fachada / equipe da loja]</span>
      </div>
    </section>
  );
}
