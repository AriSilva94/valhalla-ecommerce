"use client";

import { useEffect, useState } from "react";
import { css } from "../lib/css";
import { cats, db, fmt, waUrl, Product, SHOW_TOP_BAR, SHOW_FAB } from "../lib/data";
import ProductCard, { CardVM } from "./ProductCard";

interface CartItem { key: string; id: string; ci: number; vi: number; qty: number; }

export default function Store() {
  const [page, setPage] = useState("home");
  const [param, setParam] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [toast, setToast] = useState<{ msg: string; color: string } | null>(null);
  const [q, setQ] = useState("");
  const [auto, setAuto] = useState(false);
  const [selC, setSelC] = useState(0);
  const [selV, setSelV] = useState(0);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);
  const [sort, setSort] = useState("rel");
  const [brand, setBrand] = useState("Todas");
  const [name, setName] = useState("");
  const [cName, setCName] = useState("");
  const [cMail, setCMail] = useState("");
  const [cMsg, setCMsg] = useState("");
  const [faq, setFaq] = useState(0);
  const [pol, setPol] = useState(0);

  const go = (pg: string, pr: string | null = null) => {
    setPage(pg);
    setParam(pr);
    setAuto(false);
    if (pg === "product") { setSelC(0); setSelV(0); setQty(1); }
    if (pg === "category" || pg === "search") { setLoading(true); setBrand("Todas"); setSort("rel"); }
    window.scrollTo(0, 0);
  };
  const goP = (pg: string, pr?: string) => () => go(pg, pr ?? null);

  const showToast = (msg: string, color: string) => setToast({ msg, color });

  // Fake network delay so category/search views show the skeleton loader.
  useEffect(() => {
    if (page !== "category" && page !== "search") return;
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, [page, param]);

  // Auto-dismiss toast.
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const addItem = (prod: Product, ci: number, vi: number, quantity: number) => {
    const key = prod.id + "|" + ci + "|" + vi;
    setCart((c) => {
      const next = c.map((x) => ({ ...x }));
      const ex = next.find((x) => x.key === key);
      if (ex) ex.qty += quantity;
      else next.push({ key, id: prod.id, ci, vi, qty: quantity });
      return next;
    });
    showToast("Adicionado à lista de interesse!", "#8CFF00");
  };

  const buildMsg = (who: string) => {
    const rows = cart.map((it, i) => {
      const prod = db.find((x) => x.id === it.id)!;
      const v = prod.vars[it.vi];
      const c = prod.colors[it.ci];
      const unit = prod.price + v.d;
      return (i + 1) + ". " + prod.name + "\nModelo: " + v.l + "\nCor: " + c.n + "\nQuantidade: " + it.qty + "\nPreço apresentado: " + fmt(unit) + "\nLink: valhalla.tec.br/p/" + prod.id;
    }).join("\n\n");
    const total = cart.reduce((a, it) => { const prod = db.find((x) => x.id === it.id)!; return a + (prod.price + prod.vars[it.vi].d) * it.qty; }, 0);
    return "Olá, equipe Valhalla Tecnologia! Meu nome é " + (who || "[seu nome]") + ".\n\nTenho interesse nos seguintes produtos:\n\n" + rows + "\n\nValor total estimado: " + fmt(total) + "\n\nGostaria de confirmar a disponibilidade e finalizar a compra com um atendente.";
  };

  const vm = (prod: Product): CardVM => {
    const disc = prod.old ? Math.round((1 - prod.price / prod.old) * 100) : 0;
    const out = prod.stock === "out";
    return {
      name: prod.name, brand: prod.brand, priceF: fmt(prod.price), oldPriceF: prod.old ? fmt(prod.old) : null,
      badge: out ? null : (prod.old ? "-" + disc + "%" : (prod.tag || null)),
      badgeBg: prod.old ? "#8CFF00" : "#8B2CF5", badgeFg: prod.old ? "#09050D" : "#FFFFFF",
      out, canAdd: !out,
      open: () => go("product", prod.id),
      add: () => { const ci = prod.colors.findIndex((c) => c.av); const vi = prod.vars.findIndex((v) => v.av); addItem(prod, Math.max(ci, 0), Math.max(vi, 0), 1); },
    };
  };

  // ---- derived values ----
  const countIn = (id: string) => db.filter((p) => p.cat === id).length;
  const catObjs = cats.filter((c) => c.id !== "games").map((c) => ({ ...c, count: countIn(c.id), open: goP("category", c.id) }));
  const allCats = cats.map((c) => ({ ...c, count: countIn(c.id), open: goP("category", c.id) }));

  const isCat = page === "category", isSearch = page === "search";
  let base: Product[] = [];
  if (isCat) base = db.filter((p) => p.cat === param);
  if (isSearch) { const query = (param || "").toLowerCase(); base = db.filter((p) => (p.name + " " + p.brand + " " + p.cat).toLowerCase().includes(query)); }
  const brandsIn = ["Todas", ...Array.from(new Set(base.map((p) => p.brand)))];
  let list = base.filter((p) => brand === "Todas" || p.brand === brand);
  if (sort === "asc") list = [...list].sort((a, b) => a.price - b.price);
  if (sort === "desc") list = [...list].sort((a, b) => b.price - a.price);
  if (sort === "promo") list = [...list].sort((a, b) => ((b.old ? b.old - b.price : 0) - (a.old ? a.old - a.price : 0)));
  const catMeta = cats.find((c) => c.id === param);

  const p = page === "product" ? db.find((x) => x.id === param) : null;
  const is404 = page === "404" || (page === "product" && !p);

  const cartRows = cart.map((it) => {
    const cp = db.find((x) => x.id === it.id)!;
    const v = cp.vars[it.vi]; const c = cp.colors[it.ci]; const unit = cp.price + v.d;
    return {
      key: it.key, name: cp.name, variant: v.l + " · " + c.n, qty: it.qty, unitF: fmt(unit), subF: fmt(unit * it.qty),
      open: goP("product", cp.id),
      up: () => setCart((s) => s.map((x) => x.key === it.key ? { ...x, qty: Math.min(x.qty + 1, 10) } : x)),
      down: () => setCart((s) => s.map((x) => x.key === it.key ? { ...x, qty: Math.max(x.qty - 1, 1) } : x)),
      remove: () => { setCart((s) => s.filter((x) => x.key !== it.key)); showToast("Item removido da lista", "#B056FF"); },
    };
  });
  const cartTotal = cart.reduce((a, it) => { const cp = db.find((x) => x.id === it.id)!; return a + (cp.price + cp.vars[it.vi].d) * it.qty; }, 0);
  const cartCount = cart.reduce((a, it) => a + it.qty, 0);
  const waCartUrl = waUrl(buildMsg(name.trim()));

  const query = q.trim().toLowerCase();
  const suggestions = query ? db.filter((x) => (x.name + " " + x.brand).toLowerCase().includes(query)).slice(0, 5).map((x) => ({ name: x.name, priceF: fmt(x.price), open: () => go("product", x.id) })) : [];

  const faqData = [
    { q: "Como funciona a compra?", a: "Você monta sua lista de interesse no site, revisa e é redirecionado ao WhatsApp com a mensagem pronta. Um atendente confirma disponibilidade, forma de pagamento e entrega — tudo na conversa." },
    { q: "Quais formas de pagamento vocês aceitam?", a: "Pix, cartão de crédito (com parcelamento), débito e dinheiro na retirada. As condições são combinadas diretamente com o atendente." },
    { q: "Os produtos são originais e têm garantia?", a: "Sim. Trabalhamos apenas com produtos originais, lacrados e com nota fiscal. A garantia é a de fábrica de cada marca, a partir de 6 meses." },
    { q: "Vocês entregam?", a: "Fazemos retirada na loja em Macapá-AP e entregas combinadas com o atendente. Prazo e valor do frete são confirmados antes de fechar a compra." },
    { q: "Os preços do site são finais?", a: "Os preços exibidos são valores à vista de referência. O valor final, descontos e parcelamento são confirmados no atendimento." },
    { q: "Posso trocar ou devolver um produto?", a: "Sim, seguimos o Código de Defesa do Consumidor: 7 dias para arrependimento em compras remotas e troca imediata em caso de defeito de fábrica." },
  ];
  const polData = [
    { q: "Política de privacidade", a: "Usamos seu nome apenas para montar a mensagem do WhatsApp e personalizar o atendimento. Não armazenamos dados de pagamento — nenhuma transação acontece neste site. Seus dados de conversa ficam protegidos pelo WhatsApp." },
    { q: "Política de trocas e devoluções", a: "Você tem 7 dias corridos após o recebimento para desistir da compra (CDC, art. 49). Produtos com defeito de fábrica são trocados imediatamente mediante análise. O produto deve estar com a embalagem e os acessórios originais." },
    { q: "Política de garantia", a: "Todos os produtos possuem garantia de fábrica (6 a 12 meses conforme a marca). A Valhalla intermedia o acionamento da garantia junto à assistência autorizada quando necessário." },
    { q: "Política de entrega e retirada", a: "Retirada na loja com hora marcada, sem custo. Entregas em Macapá e região são combinadas com o atendente; o frete é informado antes da confirmação da compra." },
  ];
  const mkAcc = (data: { q: string; a: string }[], val: number, set: (n: number) => void) =>
    data.map((f, i) => { const open = val === i; return { ...f, open, icon: open ? "−" : "+", bc: open ? "#8B2CF5" : "#341052", toggle: () => set(open ? -1 : i) }; });

  const waDirectUrl = waUrl("Olá, equipe Valhalla Tecnologia! Gostaria de falar com um atendente.");

  const showBar = SHOW_TOP_BAR;
  const showFab = SHOW_FAB && page !== "review" && page !== "sent";
  const isHome = page === "home", isCats = page === "cats", isListing = (isCat || isSearch) && !is404;
  const isProduct = !!p, isCart = page === "list", isReview = page === "review", isSent = page === "sent";
  const isAbout = page === "about", isContact = page === "contact", isFaq = page === "faq", isPolicies = page === "policies";

  const navCats = catObjs;
  const featured = db.slice(0, 8).map(vm);
  const offers = db.filter((x) => x.old).slice(0, 4).map(vm);
  const launches = db.filter((x) => x.tag === "NOVO").slice(0, 4).map(vm);
  const brands = ["Samsung", "Apple", "Xiaomi", "Lenovo", "Acer", "JBL", "Logitech", "Baseus", "Redragon"];
  const benefits = [
    { i: "✓", t: "Produtos originais", d: "Lacrados, com nota fiscal e garantia de fábrica." },
    { i: "⚡", t: "Atendimento rápido", d: "Resposta em minutos no WhatsApp, com gente de verdade." },
    { i: "%", t: "Preço negociável", d: "Condições especiais no Pix e no combo — é só perguntar." },
    { i: "↺", t: "Troca garantida", d: "7 dias para arrependimento e troca imediata por defeito." },
  ];
  const steps = [
    { n: "01", t: "Escolha seus produtos", d: "Navegue pelo catálogo e adicione o que quiser à sua lista de interesse." },
    { n: "02", t: "Revise sua lista", d: "Confira itens, variações e quantidades, e informe seu nome." },
    { n: "03", t: "Finalize no WhatsApp", d: "Enviamos a mensagem pronta — o atendente confirma tudo e fecha com você." },
  ];
  const reviews = [
    { t: "Comprei meu S25 pelo site e em 10 minutos já estava tudo certo no WhatsApp. Atendimento nota mil.", n: "Rafael M.", c: "Macapá-AP" },
    { t: "Preço melhor que os marketplaces e ainda retirei no mesmo dia. Virei cliente.", n: "Camila S.", c: "Santana-AP" },
    { t: "Tive dúvida entre dois notebooks e o atendente me explicou tudo com paciência. Recomendo demais.", n: "João P.", c: "Macapá-AP" },
  ];

  const listingCrumb = isSearch ? "Busca" : "Categorias / " + (catMeta ? catMeta.n : "");
  const listingTitle = isSearch ? 'Resultados para "' + (param || "") + '"' : (catMeta ? catMeta.n : "");
  const brandChips = brandsIn.map((b) => { const sel = b === brand; return { n: b, bc: sel ? "#8CFF00" : "#341052", fg: sel ? "#8CFF00" : "#D8D5E0", bg: sel ? "rgba(140,255,0,.08)" : "#1D0333", pick: () => setBrand(b) }; });
  const loadingNow = loading && (isCat || isSearch);
  const listingReady = !loading && list.length > 0;
  const listingEmpty = !loading && list.length === 0;
  const emptyTitle = isSearch ? "Nenhum resultado encontrado" : "Categoria em breve";
  const emptyDesc = isSearch ? "Tente outra palavra, confira a ortografia ou fale direto com nosso atendente." : "Estamos preparando novidades para esta categoria. Enquanto isso, veja os destaques ou fale com a gente.";

  // product view-model
  const stockMap: Record<string, string[]> = {
    in: ["Em estoque", "rgba(140,255,0,.1)", "#8CFF00", "rgba(140,255,0,.4)"],
    low: ["Últimas unidades", "rgba(255,176,32,.1)", "#FFB020", "rgba(255,176,32,.4)"],
    out: ["Indisponível", "rgba(255,77,109,.1)", "#FF4D6D", "rgba(255,77,109,.4)"],
  };
  let pv: {
    pName: string; pBrand: string; pCode: string; pCatName: string; pOpenCat: () => void;
    pStockLabel: string; pStockBg: string; pStockFg: string; pStockBc: string;
    pPriceF: string; pOldPriceF: string | null; pBadge: string | null; pColorName: string;
    pColors: { hex: string; unav: boolean; op: number; cursor: string; title: string; ring: string; pick: () => void }[];
    pVarLabel: string;
    pVars: { l: string; cursor: string; deco: string; bc: string; fg: string; bg: string; pick: () => void }[];
    pVarUnavailable: boolean; pIsOut: boolean; pCanBuy: boolean; pSubtotalF: string;
    pSpecs: { k: string; v: string }[]; pDesc: string; pWarranty: string; pThumbs: string[];
    qtyUp: () => void; qtyDown: () => void; pAdd: () => void; pBuyNowUrl: string; pNotifyUrl: string;
    related: CardVM[];
  } | null = null;
  if (p) {
    const st = stockMap[p.stock];
    const selVar = p.vars[selV], selColor = p.colors[selC];
    const unit = p.price + selVar.d;
    const varBad = !selVar.av || !selColor.av;
    const out = p.stock === "out";
    pv = {
      pName: p.name, pBrand: p.brand, pCode: "VLH-" + p.id.toUpperCase(), pCatName: (cats.find((c) => c.id === p.cat) || { n: "" }).n,
      pOpenCat: goP("category", p.cat),
      pStockLabel: st[0], pStockBg: st[1], pStockFg: st[2], pStockBc: st[3],
      pPriceF: fmt(unit), pOldPriceF: p.old ? fmt(p.old + selVar.d) : null,
      pBadge: p.old ? "-" + Math.round((1 - p.price / p.old) * 100) + "% OFF" : null,
      pColorName: selColor.n,
      pColors: p.colors.map((c, i) => ({ hex: c.hex, unav: !c.av, op: c.av ? 1 : 0.45, cursor: c.av ? "pointer" : "not-allowed", title: c.n + (c.av ? "" : " (indisponível)"), ring: i === selC ? "#8CFF00" : (c.av ? "#341052" : "#22003D"), pick: () => setSelC(i) })),
      pVarLabel: p.vl,
      pVars: p.vars.map((v, i) => { const sel = i === selV; return { l: v.l + (v.d ? " · +" + fmt(v.d) : ""), cursor: v.av ? "pointer" : "not-allowed", deco: v.av ? "none" : "line-through", bc: sel ? "#8CFF00" : "#341052", fg: v.av ? (sel ? "#8CFF00" : "#FFFFFF") : "#9690A3", bg: sel ? "rgba(140,255,0,.08)" : "transparent", pick: () => setSelV(i) }; }),
      pVarUnavailable: varBad && !out,
      pIsOut: out, pCanBuy: !out && !varBad,
      pSubtotalF: fmt(unit * qty),
      pSpecs: p.specs.map((x) => ({ k: x[0], v: x[1] })),
      pDesc: p.desc, pWarranty: p.w,
      pThumbs: ["[ângulo 2]", "[ângulo 3]", "[detalhe]", "[caixa]"],
      qtyUp: () => setQty((n) => Math.min(n + 1, 10)),
      qtyDown: () => setQty((n) => Math.max(n - 1, 1)),
      pAdd: () => addItem(p, selC, selV, qty),
      pBuyNowUrl: waUrl("Olá, equipe Valhalla Tecnologia!\n\nTenho interesse neste produto:\n\n1. " + p.name + "\nModelo: " + selVar.l + "\nCor: " + selColor.n + "\nQuantidade: " + qty + "\nPreço apresentado: " + fmt(unit) + "\nLink: valhalla.tec.br/p/" + p.id + "\n\nGostaria de confirmar a disponibilidade e finalizar a compra com um atendente."),
      pNotifyUrl: waUrl('Olá! Quero ser avisado(a) quando o produto "' + p.name + '" voltar ao estoque na Valhalla Tecnologia.'),
      related: db.filter((x) => x.cat === p.cat && x.id !== p.id).slice(0, 4).map(vm),
    };
  }

  const faqs = mkAcc(faqData, faq, setFaq);
  const policies = mkAcc(polData, pol, setPol);
  const nameOk = name.trim().length > 1 && cart.length > 0;

  return (
    <div style={css("min-height:100vh;display:flex;flex-direction:column")}>
      {/* ===== HEADER ===== */}
      {showBar && (
        <div style={css("background:#8CFF00;color:#09050D;text-align:center;font:700 12px 'Space Grotesk',sans-serif;letter-spacing:.08em;text-transform:uppercase;padding:8px 16px")}>Produtos originais com garantia • Atendimento humano pelo WhatsApp</div>
      )}
      <header style={css("position:sticky;top:0;z-index:60;background:rgba(18,0,32,.94);backdrop-filter:blur(14px);border-bottom:1px solid #341052")}>
        <div style={css("max-width:1240px;margin:0 auto;padding:14px 24px;display:flex;align-items:center;gap:20px;flex-wrap:wrap")}>
          <div onClick={goP("home")} style={css("cursor:pointer;display:flex;flex-direction:column;line-height:1;user-select:none")}>
            <span style={css("font:700 24px 'Space Grotesk',sans-serif;letter-spacing:.04em;color:#FFFFFF;transform:skewX(-4deg)")}>VALHALLA</span>
            <span style={css("display:flex;align-items:center;gap:6px;margin-top:3px")}><span style={css("width:5px;height:5px;background:#8CFF00;transform:rotate(45deg)")}></span><span style={css("font:700 9.5px 'Space Grotesk',sans-serif;letter-spacing:.42em;color:#8CFF00")}>TECNOLOGIA</span><span style={css("width:5px;height:5px;background:#8CFF00;transform:rotate(45deg)")}></span></span>
          </div>
          <div style={css("flex:1;min-width:220px;position:relative")}>
            <input className="vh-input" value={q} onChange={(e) => { setQ(e.target.value); setAuto(true); }} onKeyDown={(e) => { if (e.key === "Enter" && q.trim()) go("search", q.trim()); }} onFocus={() => setAuto(true)} onBlur={() => setTimeout(() => setAuto(false), 150)} placeholder="Buscar smartphones, notebooks, fones..." style={css("width:100%;background:#1D0333;border:1px solid #341052;border-radius:10px;padding:12px 44px 12px 16px;color:#FFFFFF;font:500 13.5px 'Manrope',sans-serif;outline:none;transition:border-color .15s")} />
            <button className="vh-searchbtn" onClick={() => { if (q.trim()) go("search", q.trim()); }} title="Buscar" style={css("position:absolute;right:6px;top:6px;bottom:6px;width:34px;background:#8B2CF5;border:none;border-radius:7px;cursor:pointer;color:#fff;font:700 14px 'Space Grotesk',sans-serif;transition:background .15s")}>⌕</button>
            {auto && suggestions.length > 0 && (
              <div style={css("position:absolute;top:calc(100% + 6px);left:0;right:0;background:#1D0333;border:1px solid #8B2CF5;border-radius:12px;overflow:hidden;box-shadow:0 16px 40px rgba(9,5,13,.6);z-index:70")}>
                {suggestions.map((s, i) => (
                  <div key={i} className="vh-autorow" onMouseDown={s.open} style={css("display:flex;justify-content:space-between;align-items:center;gap:12px;padding:11px 16px;cursor:pointer;border-bottom:1px solid #2A0A45;transition:background .12s")}>
                    <span style={css("font:600 13px 'Manrope',sans-serif;color:#FFFFFF")}>{s.name}</span>
                    <span style={css("font:700 12.5px 'Space Grotesk',sans-serif;color:#8CFF00;white-space:nowrap")}>{s.priceF}</span>
                  </div>
                ))}
                <div className="vh-lime" onMouseDown={() => { if (q.trim()) go("search", q.trim()); }} style={css("padding:10px 16px;font:600 12px 'Space Grotesk',sans-serif;letter-spacing:.05em;color:#B056FF;cursor:pointer;text-transform:uppercase")}>Ver todos os resultados →</div>
              </div>
            )}
          </div>
          <button className="vh-minhalista" onClick={goP("list")} style={css("position:relative;display:flex;align-items:center;gap:9px;background:transparent;border:1px solid #341052;border-radius:10px;padding:11px 16px;cursor:pointer;color:#FFFFFF;font:600 13px 'Space Grotesk',sans-serif;transition:border-color .15s,background .15s")}>
            <span style={css("width:8px;height:8px;border:2px solid #8CFF00;border-radius:2px")}></span>Minha lista
            {cartCount > 0 && (
              <span style={css("position:absolute;top:-8px;right:-8px;min-width:20px;height:20px;background:#8CFF00;color:#09050D;border-radius:10px;font:800 11px 'Space Grotesk',sans-serif;display:flex;align-items:center;justify-content:center;padding:0 5px")}>{cartCount}</span>
            )}
          </button>
          <a className="vh-wa" href={waDirectUrl} target="_blank" style={css("display:flex;align-items:center;gap:8px;background:#25D366;border-radius:10px;padding:11px 16px;color:#062e17;font:700 13px 'Space Grotesk',sans-serif;transition:filter .15s")}>
            <span style={css("width:9px;height:9px;background:#062e17;border-radius:50%")}></span>WhatsApp
          </a>
        </div>
        <nav style={css("border-top:1px solid #22003D")}>
          <div style={css("max-width:1240px;margin:0 auto;padding:0 24px;display:flex;gap:4px;overflow-x:auto")}>
            {navCats.map((c, i) => (
              <span key={i} className="vh-navcat" onClick={c.open} style={css("padding:11px 14px;font:600 12.5px 'Space Grotesk',sans-serif;letter-spacing:.03em;color:#D8D5E0;cursor:pointer;white-space:nowrap;border-bottom:2px solid transparent;transition:color .12s,border-color .12s")}>{c.n}</span>
            ))}
            <span style={css("flex:1")}></span>
            <span className="vh-lime" onClick={goP("about")} style={css("padding:11px 12px;font:600 12.5px 'Space Grotesk',sans-serif;color:#9690A3;cursor:pointer;white-space:nowrap")}>Sobre</span>
            <span className="vh-lime" onClick={goP("faq")} style={css("padding:11px 12px;font:600 12.5px 'Space Grotesk',sans-serif;color:#9690A3;cursor:pointer;white-space:nowrap")}>FAQ</span>
            <span className="vh-lime" onClick={goP("contact")} style={css("padding:11px 12px;font:600 12.5px 'Space Grotesk',sans-serif;color:#9690A3;cursor:pointer;white-space:nowrap")}>Contato</span>
          </div>
        </nav>
      </header>

      <main style={css("flex:1")}>
        {/* ===== HOME ===== */}
        {isHome && (
          <>
            <section style={css("position:relative;overflow:hidden;background:radial-gradient(1100px 500px at 75% -10%,rgba(139,44,245,.35),transparent 65%),radial-gradient(circle at 12% 90%,rgba(140,255,0,.07),transparent 40%),#120020")}>
              <div style={css("position:absolute;inset:0;background:radial-gradient(rgba(176,86,255,.13) 1px,transparent 1.5px);background-size:20px 20px;mask-image:linear-gradient(115deg,transparent 35%,black 75%)")}></div>
              <div style={css("position:relative;max-width:1240px;margin:0 auto;padding:64px 24px 72px;display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:48px;align-items:center")}>
                <div style={css("display:flex;flex-direction:column;gap:18px")}>
                  <span style={css("align-self:flex-start;font:700 11.5px 'Space Grotesk',sans-serif;letter-spacing:.18em;text-transform:uppercase;color:#8CFF00;border:1px solid rgba(140,255,0,.4);border-radius:20px;padding:7px 14px")}>Oferta da semana</span>
                  <h1 style={css("margin:0;font:700 clamp(34px,4.5vw,56px)/1.05 'Space Grotesk',sans-serif;letter-spacing:-.01em")}><span style={css("color:#B056FF")}>GALAXY S25 ULTRA</span><br />com desconto de<br /><span style={css("color:#8CFF00")}>R$ 700 à vista</span></h1>
                  <p style={css("margin:0;max-width:440px;font:500 15.5px/1.65 'Manrope',sans-serif;color:#D8D5E0")}>Garanta o seu direto com nosso time no WhatsApp. Atendimento rápido, produto original e garantia de fábrica.</p>
                  <div style={css("display:flex;gap:12px;flex-wrap:wrap;margin-top:6px")}>
                    <button className="vh-btn-lime-lift" onClick={goP("product", "s25u")} style={css("background:#8CFF00;color:#09050D;border:none;border-radius:10px;padding:15px 28px;font:700 14.5px 'Space Grotesk',sans-serif;letter-spacing:.03em;cursor:pointer;box-shadow:0 0 28px rgba(140,255,0,.35);transition:background .15s,transform .12s")}>Garanta o seu!</button>
                    <button className="vh-ghost-violet" onClick={goP("cats")} style={css("background:transparent;color:#FFFFFF;border:1px solid #8B2CF5;border-radius:10px;padding:15px 28px;font:600 14.5px 'Space Grotesk',sans-serif;cursor:pointer;transition:background .15s")}>Explorar categorias</button>
                  </div>
                  <div style={css("display:flex;gap:22px;flex-wrap:wrap;margin-top:10px")}>
                    <span style={css("font:600 12.5px 'Manrope',sans-serif;color:#9690A3")}><span style={css("color:#8CFF00")}>✓</span> Produtos originais</span>
                    <span style={css("font:600 12.5px 'Manrope',sans-serif;color:#9690A3")}><span style={css("color:#8CFF00")}>✓</span> Garantia de fábrica</span>
                    <span style={css("font:600 12.5px 'Manrope',sans-serif;color:#9690A3")}><span style={css("color:#8CFF00")}>✓</span> Atendimento humano</span>
                  </div>
                </div>
                <div style={css("position:relative;display:flex;align-items:center;justify-content:center;min-height:340px")}>
                  <div style={css("position:absolute;bottom:8%;width:70%;height:60px;background:radial-gradient(ellipse,rgba(140,255,0,.4),transparent 70%);filter:blur(18px);animation:vh-glow 3.5s ease-in-out infinite")}></div>
                  <div style={css("position:relative;width:min(340px,80%);aspect-ratio:3/4;background:repeating-linear-gradient(45deg,#2A0A45 0 14px,#24063C 14px 28px);border:1px solid #341052;border-radius:20px;display:flex;align-items:center;justify-content:center;box-shadow:0 24px 60px rgba(9,5,13,.6)")}>
                    <span style={css("font:500 12px ui-monospace,Menlo,monospace;color:#9690A3;background:rgba(9,5,13,.55);padding:6px 12px;border-radius:6px")}>[foto: Galaxy S25 Ultra]</span>
                  </div>
                </div>
              </div>
            </section>

            <section style={css("max-width:1240px;margin:0 auto;padding:56px 24px 8px;width:100%")}>
              <div style={css("display:flex;align-items:baseline;justify-content:space-between;gap:16px;margin-bottom:22px")}>
                <h2 style={css("margin:0;font:700 26px 'Space Grotesk',sans-serif;color:#FFFFFF")}>Categorias</h2>
                <span className="vh-lime" onClick={goP("cats")} style={css("font:600 13px 'Space Grotesk',sans-serif;color:#B056FF;cursor:pointer")}>Ver todas →</span>
              </div>
              <div style={css("display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:14px")}>
                {catObjs.map((c, i) => (
                  <div key={i} className="vh-cardcat" onClick={c.open} style={css("background:linear-gradient(160deg,#22003D,#1D0333);border:1px solid #341052;border-radius:14px;padding:20px 18px;cursor:pointer;display:flex;flex-direction:column;gap:8px;transition:border-color .15s,transform .15s")}>
                    <span style={css("width:12px;height:12px;background:linear-gradient(135deg,#8B2CF5,#B056FF);transform:rotate(45deg);border-radius:3px")}></span>
                    <span style={css("font:700 15px 'Space Grotesk',sans-serif;color:#FFFFFF")}>{c.n}</span>
                    <span style={css("font:500 12px 'Manrope',sans-serif;color:#9690A3")}>{c.count} produtos</span>
                  </div>
                ))}
              </div>
            </section>

            <section style={css("max-width:1240px;margin:0 auto;padding:48px 24px 8px;width:100%")}>
              <div style={css("display:flex;align-items:baseline;justify-content:space-between;gap:16px;margin-bottom:22px")}>
                <h2 style={css("margin:0;font:700 26px 'Space Grotesk',sans-serif")}>Destaques</h2>
              </div>
              <div style={css("display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:16px")}>
                {featured.map((it, i) => (<ProductCard key={i} p={it} />))}
              </div>
            </section>

            <section style={css("background:#22003D;margin-top:56px")}>
              <div style={css("max-width:1240px;margin:0 auto;padding:48px 24px;width:100%")}>
                <div style={css("display:flex;align-items:baseline;gap:14px;margin-bottom:22px")}>
                  <h2 style={css("margin:0;font:700 26px 'Space Grotesk',sans-serif;color:#8CFF00")}>Ofertas imperdíveis</h2>
                  <span style={css("font:700 11px 'Space Grotesk',sans-serif;letter-spacing:.1em;background:#8CFF00;color:#09050D;padding:4px 9px;border-radius:6px;text-transform:uppercase")}>Por tempo limitado</span>
                </div>
                <div style={css("display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:16px")}>
                  {offers.map((it, i) => (<ProductCard key={i} p={it} />))}
                </div>
              </div>
            </section>

            <section style={css("max-width:1240px;margin:0 auto;padding:56px 24px 8px;width:100%")}>
              <h2 style={css("margin:0 0 22px;font:700 26px 'Space Grotesk',sans-serif")}>Lançamentos</h2>
              <div style={css("display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:16px")}>
                {launches.map((it, i) => (<ProductCard key={i} p={it} />))}
              </div>
            </section>

            <section style={css("max-width:1240px;margin:0 auto;padding:56px 24px 0;width:100%")}>
              <p style={css("margin:0 0 16px;font:700 12px 'Space Grotesk',sans-serif;letter-spacing:.16em;text-transform:uppercase;color:#9690A3;text-align:center")}>Marcas que você encontra aqui</p>
              <div style={css("display:flex;gap:12px;flex-wrap:wrap;justify-content:center")}>
                {brands.map((b, i) => (<span key={i} style={css("font:700 14px 'Space Grotesk',sans-serif;letter-spacing:.06em;color:#D8D5E0;background:#1D0333;border:1px solid #341052;border-radius:10px;padding:11px 22px")}>{b}</span>))}
              </div>
            </section>

            <section style={css("max-width:1240px;margin:0 auto;padding:56px 24px 0;width:100%")}>
              <div style={css("display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px")}>
                {benefits.map((b, i) => (
                  <div key={i} style={css("background:#1D0333;border:1px solid #341052;border-radius:14px;padding:22px;display:flex;flex-direction:column;gap:10px")}>
                    <span style={css("width:34px;height:34px;border-radius:10px;background:rgba(140,255,0,.12);border:1px solid rgba(140,255,0,.35);display:flex;align-items:center;justify-content:center;color:#8CFF00;font:700 15px 'Space Grotesk',sans-serif")}>{b.i}</span>
                    <span style={css("font:700 15px 'Space Grotesk',sans-serif;color:#FFFFFF")}>{b.t}</span>
                    <span style={css("font:500 13px/1.55 'Manrope',sans-serif;color:#9690A3")}>{b.d}</span>
                  </div>
                ))}
              </div>
            </section>

            <section style={css("max-width:1240px;margin:0 auto;padding:64px 24px 0;width:100%")}>
              <h2 style={css("margin:0 0 8px;font:700 26px 'Space Grotesk',sans-serif;text-align:center")}>Como comprar pelo <span style={css("color:#25D366")}>WhatsApp</span></h2>
              <p style={css("margin:0 auto 30px;max-width:520px;text-align:center;font:500 14px/1.6 'Manrope',sans-serif;color:#9690A3")}>Sem checkout, sem complicação. Você escolhe no site e finaliza com um atendente de verdade.</p>
              <div style={css("display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px")}>
                {steps.map((s, i) => (
                  <div key={i} style={css("background:linear-gradient(160deg,#22003D,#1D0333);border:1px solid #341052;border-radius:14px;padding:24px;display:flex;flex-direction:column;gap:10px")}>
                    <span style={css("font:700 30px 'Space Grotesk',sans-serif;color:#8CFF00")}>{s.n}</span>
                    <span style={css("font:700 15.5px 'Space Grotesk',sans-serif")}>{s.t}</span>
                    <span style={css("font:500 13px/1.55 'Manrope',sans-serif;color:#9690A3")}>{s.d}</span>
                  </div>
                ))}
              </div>
            </section>

            <section style={css("max-width:1240px;margin:0 auto;padding:64px 24px 0;width:100%")}>
              <h2 style={css("margin:0 0 26px;font:700 26px 'Space Grotesk',sans-serif;text-align:center")}>Quem comprou, recomenda</h2>
              <div style={css("display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px")}>
                {reviews.map((r, i) => (
                  <div key={i} style={css("background:#1D0333;border:1px solid #341052;border-radius:14px;padding:24px;display:flex;flex-direction:column;gap:12px")}>
                    <span style={css("color:#8CFF00;font:700 14px 'Space Grotesk',sans-serif;letter-spacing:.25em")}>★★★★★</span>
                    <span style={css("font:500 14px/1.6 'Manrope',sans-serif;color:#D8D5E0")}>&quot;{r.t}&quot;</span>
                    <span style={css("font:700 12.5px 'Space Grotesk',sans-serif;color:#B056FF")}>{r.n} <span style={css("color:#9690A3;font-weight:500")}>· {r.c}</span></span>
                  </div>
                ))}
              </div>
            </section>

            <section style={css("max-width:1240px;margin:64px auto 0;padding:0 24px;width:100%")}>
              <div style={css("position:relative;overflow:hidden;background:radial-gradient(700px 300px at 85% 0%,rgba(37,211,102,.22),transparent 60%),linear-gradient(160deg,#22003D,#120020);border:1px solid #341052;border-radius:20px;padding:44px 40px;display:flex;flex-wrap:wrap;gap:28px;align-items:center;justify-content:space-between")}>
                <div style={css("position:absolute;inset:0;background:radial-gradient(rgba(176,86,255,.12) 1px,transparent 1.5px);background-size:18px 18px;mask-image:linear-gradient(100deg,transparent 40%,black 90%)")}></div>
                <div style={css("position:relative;max-width:560px;display:flex;flex-direction:column;gap:10px")}>
                  <h2 style={css("margin:0;font:700 clamp(24px,3vw,34px)/1.15 'Space Grotesk',sans-serif")}><span style={css("color:#B056FF")}>SIGA NOSSO CANAL</span><br /><span style={css("color:#8CFF00")}>NO WHATSAPP!</span></h2>
                  <p style={css("margin:0;font:500 14px/1.6 'Manrope',sans-serif;color:#D8D5E0")}>Novidades em primeira mão, promoções exclusivas, dicas e tutoriais — direto no seu WhatsApp.</p>
                </div>
                <a className="vh-wa" href={waDirectUrl} target="_blank" style={css("position:relative;display:inline-flex;align-items:center;gap:10px;background:#25D366;color:#062e17;border-radius:12px;padding:16px 30px;font:700 15px 'Space Grotesk',sans-serif;box-shadow:0 0 34px rgba(37,211,102,.4);transition:filter .15s")}><span style={css("width:10px;height:10px;background:#062e17;border-radius:50%")}></span>Clique e siga nosso canal!</a>
              </div>
            </section>
          </>
        )}

        {/* ===== CATEGORIES INDEX ===== */}
        {isCats && (
          <section style={css("max-width:1240px;margin:0 auto;padding:40px 24px;width:100%")}>
            <p style={css("margin:0 0 6px;font:600 12px 'Space Grotesk',sans-serif;color:#9690A3")}><span onClick={goP("home")} style={css("cursor:pointer;color:#B056FF")}>Início</span> / Categorias</p>
            <h1 style={css("margin:0 0 26px;font:700 34px 'Space Grotesk',sans-serif")}>Todas as categorias</h1>
            <div style={css("display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px")}>
              {allCats.map((c, i) => (
                <div key={i} className="vh-cardcat" onClick={c.open} style={css("background:linear-gradient(160deg,#22003D,#1D0333);border:1px solid #341052;border-radius:16px;padding:28px 24px;cursor:pointer;display:flex;flex-direction:column;gap:10px;transition:border-color .15s,transform .15s")}>
                  <span style={css("width:14px;height:14px;background:linear-gradient(135deg,#8B2CF5,#B056FF);transform:rotate(45deg);border-radius:3px")}></span>
                  <span style={css("font:700 19px 'Space Grotesk',sans-serif")}>{c.n}</span>
                  <span style={css("font:500 13px 'Manrope',sans-serif;color:#9690A3")}>{c.d}</span>
                  <span style={css("font:700 12px 'Space Grotesk',sans-serif;color:#8CFF00")}>{c.count} produtos →</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ===== CATEGORY / SEARCH ===== */}
        {isListing && (
          <section style={css("max-width:1240px;margin:0 auto;padding:40px 24px;width:100%")}>
            <p style={css("margin:0 0 6px;font:600 12px 'Space Grotesk',sans-serif;color:#9690A3")}><span onClick={goP("home")} style={css("cursor:pointer;color:#B056FF")}>Início</span> / {listingCrumb}</p>
            <div style={css("display:flex;align-items:baseline;gap:14px;flex-wrap:wrap;margin-bottom:20px")}>
              <h1 style={css("margin:0;font:700 34px 'Space Grotesk',sans-serif")}>{listingTitle}</h1>
              <span style={css("font:500 13.5px 'Manrope',sans-serif;color:#9690A3")}>{list.length} resultado(s)</span>
            </div>
            <div style={css("display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:24px")}>
              {brandChips.map((b, i) => (
                <span key={i} className="vh-chip" onClick={b.pick} style={{ ...css("font:600 12.5px 'Space Grotesk',sans-serif;padding:8px 16px;border-radius:20px;cursor:pointer;transition:border-color .12s"), border: "1px solid " + b.bc, color: b.fg, background: b.bg }}>{b.n}</span>
              ))}
              <span style={css("flex:1")}></span>
              <select className="vh-select" value={sort} onChange={(e) => setSort(e.target.value)} style={css("background:#1D0333;border:1px solid #341052;border-radius:10px;padding:10px 14px;color:#FFFFFF;font:600 12.5px 'Space Grotesk',sans-serif;outline:none;cursor:pointer")}>
                <option value="rel">Relevância</option>
                <option value="asc">Menor preço</option>
                <option value="desc">Maior preço</option>
                <option value="promo">Maiores descontos</option>
              </select>
            </div>
            {loadingNow && (
              <div style={css("display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:16px")}>
                {[1, 2, 3, 4].map((k) => (
                  <div key={k} style={css("background:#1D0333;border:1px solid #341052;border-radius:14px;overflow:hidden")}>
                    <div style={css("aspect-ratio:1/1;background:linear-gradient(90deg,#22003D 25%,#2A0A45 50%,#22003D 75%);background-size:800px 100%;animation:vh-shimmer 1.4s linear infinite")}></div>
                    <div style={css("padding:16px;display:flex;flex-direction:column;gap:10px")}>
                      <div style={css("height:11px;width:40%;border-radius:6px;background:linear-gradient(90deg,#22003D 25%,#2A0A45 50%,#22003D 75%);background-size:800px 100%;animation:vh-shimmer 1.4s linear infinite")}></div>
                      <div style={css("height:14px;width:85%;border-radius:6px;background:linear-gradient(90deg,#22003D 25%,#2A0A45 50%,#22003D 75%);background-size:800px 100%;animation:vh-shimmer 1.4s linear infinite")}></div>
                      <div style={css("height:20px;width:55%;border-radius:6px;background:linear-gradient(90deg,#22003D 25%,#2A0A45 50%,#22003D 75%);background-size:800px 100%;animation:vh-shimmer 1.4s linear infinite")}></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!loading && listingReady && (
              <div style={css("display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:16px")}>
                {list.map((it, i) => (<ProductCard key={i} p={vm(it)} />))}
              </div>
            )}
            {!loading && listingEmpty && (
              <div style={css("text-align:center;padding:70px 24px;background:#1D0333;border:1px dashed #341052;border-radius:16px")}>
                <span style={css("display:inline-block;width:18px;height:18px;border:3px solid #8B2CF5;border-radius:50%;margin-bottom:14px")}></span>
                <h3 style={css("margin:0 0 8px;font:700 20px 'Space Grotesk',sans-serif")}>{emptyTitle}</h3>
                <p style={css("margin:0 0 20px;font:500 14px 'Manrope',sans-serif;color:#9690A3")}>{emptyDesc}</p>
                <div style={css("display:flex;gap:10px;justify-content:center;flex-wrap:wrap")}>
                  <button className="vh-btn-lime" onClick={goP("home")} style={css("background:#8CFF00;color:#09050D;border:none;border-radius:10px;padding:13px 24px;font:700 13.5px 'Space Grotesk',sans-serif;cursor:pointer")}>Ver destaques</button>
                  <a className="vh-wa" href={waDirectUrl} target="_blank" style={css("display:inline-flex;align-items:center;background:#25D366;color:#062e17;border-radius:10px;padding:13px 24px;font:700 13.5px 'Space Grotesk',sans-serif")}>Pedir ajuda no WhatsApp</a>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ===== PRODUCT ===== */}
        {isProduct && p && pv && (
          <section style={css("max-width:1240px;margin:0 auto;padding:36px 24px;width:100%")}>
            <p style={css("margin:0 0 20px;font:600 12px 'Space Grotesk',sans-serif;color:#9690A3")}><span onClick={goP("home")} style={css("cursor:pointer;color:#B056FF")}>Início</span> / <span onClick={pv.pOpenCat} style={css("cursor:pointer;color:#B056FF")}>{pv.pCatName}</span> / {pv.pName}</p>
            <div style={css("display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:44px;align-items:start")}>
              <div style={css("display:flex;flex-direction:column;gap:12px")}>
                <div style={css("position:relative;aspect-ratio:1/1;background:repeating-linear-gradient(45deg,#2A0A45 0 14px,#24063C 14px 28px);border:1px solid #341052;border-radius:18px;display:flex;align-items:center;justify-content:center")}>
                  <span style={css("font:500 12px ui-monospace,Menlo,monospace;color:#9690A3;background:rgba(9,5,13,.55);padding:6px 12px;border-radius:6px")}>[foto principal: {pv.pName}]</span>
                  {pv.pBadge && (
                    <span style={css("position:absolute;top:14px;left:14px;font:700 12px 'Space Grotesk',sans-serif;letter-spacing:.06em;text-transform:uppercase;padding:6px 11px;border-radius:7px;background:#8CFF00;color:#09050D")}>{pv.pBadge}</span>
                  )}
                </div>
                <div style={css("display:grid;grid-template-columns:repeat(4,1fr);gap:10px")}>
                  {pv.pThumbs.map((t, i) => (
                    <div key={i} className="vh-thumb" style={css("aspect-ratio:1/1;background:repeating-linear-gradient(45deg,#2A0A45 0 8px,#24063C 8px 16px);border:1px solid #341052;border-radius:10px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:border-color .12s")}><span style={css("font:500 10px ui-monospace,monospace;color:#9690A3")}>{t}</span></div>
                  ))}
                </div>
              </div>
              <div style={css("display:flex;flex-direction:column;gap:16px")}>
                <div style={css("display:flex;flex-direction:column;gap:6px")}>
                  <span style={css("font:600 11.5px 'Space Grotesk',sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#B056FF")}>{pv.pBrand}</span>
                  <h1 style={css("margin:0;font:700 clamp(24px,3vw,32px)/1.15 'Space Grotesk',sans-serif")}>{pv.pName}</h1>
                  <span style={css("font:500 12px ui-monospace,Menlo,monospace;color:#9690A3")}>Cód. {pv.pCode}</span>
                </div>
                <span style={{ ...css("align-self:flex-start;font:700 11.5px 'Space Grotesk',sans-serif;letter-spacing:.08em;text-transform:uppercase;padding:6px 12px;border-radius:20px"), background: pv.pStockBg, color: pv.pStockFg, border: "1px solid " + pv.pStockBc }}>{pv.pStockLabel}</span>
                <div style={css("background:#1D0333;border:1px solid #341052;border-radius:14px;padding:18px 20px;display:flex;flex-direction:column;gap:2px")}>
                  {pv.pOldPriceF && (
                    <span style={css("font:500 14px 'Manrope',sans-serif;color:#9690A3;text-decoration:line-through")}>{pv.pOldPriceF}</span>
                  )}
                  <span style={css("font:700 34px 'Space Grotesk',sans-serif;color:#8CFF00")}>{pv.pPriceF}</span>
                  <span style={css("font:500 12.5px 'Manrope',sans-serif;color:#9690A3")}>Preço à vista de referência · condições finais com o atendente</span>
                </div>
                <div style={css("display:flex;flex-direction:column;gap:8px")}>
                  <span style={css("font:700 12.5px 'Space Grotesk',sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#D8D5E0")}>Cor: <span style={css("color:#8CFF00")}>{pv.pColorName}</span></span>
                  <div style={css("display:flex;gap:10px;flex-wrap:wrap")}>
                    {pv.pColors.map((c, i) => (
                      <span key={i} onClick={c.pick} title={c.title} style={{ ...css("position:relative;width:34px;height:34px;border-radius:50%;transition:box-shadow .12s"), background: c.hex, cursor: c.cursor, opacity: c.op, boxShadow: "0 0 0 2px #120020,0 0 0 4px " + c.ring }}>
                        {c.unav && (<span style={css("position:absolute;left:-4px;right:-4px;top:50%;height:2px;background:#9690A3;transform:rotate(-45deg)")}></span>)}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={css("display:flex;flex-direction:column;gap:8px")}>
                  <span style={css("font:700 12.5px 'Space Grotesk',sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#D8D5E0")}>{pv.pVarLabel}</span>
                  <div style={css("display:flex;gap:10px;flex-wrap:wrap")}>
                    {pv.pVars.map((v, i) => (
                      <span key={i} onClick={v.pick} style={{ ...css("font:600 13px 'Space Grotesk',sans-serif;padding:10px 16px;border-radius:10px;transition:border-color .12s"), cursor: v.cursor, border: "1px solid " + v.bc, color: v.fg, background: v.bg, textDecoration: v.deco }}>{v.l}</span>
                    ))}
                  </div>
                  {pv.pVarUnavailable && (
                    <div style={css("display:flex;gap:10px;align-items:center;background:rgba(255,176,32,.08);border:1px solid rgba(255,176,32,.4);border-radius:10px;padding:11px 14px;font:600 12.5px 'Manrope',sans-serif;color:#FFB020")}><span style={css("width:8px;height:8px;background:#FFB020;border-radius:50%")}></span>Variação indisponível no momento — escolha outra opção ou consulte o atendente.</div>
                  )}
                </div>
                <div style={css("display:flex;gap:12px;align-items:center;flex-wrap:wrap")}>
                  <div style={css("display:flex;align-items:center;border:1px solid #341052;border-radius:10px;overflow:hidden")}>
                    <button className="vh-qty" onClick={pv.qtyDown} style={css("width:40px;height:44px;background:#1D0333;border:none;color:#FFFFFF;font:700 18px 'Space Grotesk',sans-serif;cursor:pointer")}>−</button>
                    <span style={css("width:48px;text-align:center;font:700 15px 'Space Grotesk',sans-serif")}>{qty}</span>
                    <button className="vh-qty" onClick={pv.qtyUp} style={css("width:40px;height:44px;background:#1D0333;border:none;color:#FFFFFF;font:700 18px 'Space Grotesk',sans-serif;cursor:pointer")}>+</button>
                  </div>
                  <span style={css("font:500 12.5px 'Manrope',sans-serif;color:#9690A3")}>Subtotal: <span style={css("color:#8CFF00;font:700 14px 'Space Grotesk',sans-serif")}>{pv.pSubtotalF}</span></span>
                </div>
                <div style={css("display:flex;gap:12px;flex-wrap:wrap")}>
                  {pv.pCanBuy && (
                    <>
                      <button className="vh-btn-lime" onClick={pv.pAdd} style={css("flex:1;min-width:180px;background:#8CFF00;color:#09050D;border:none;border-radius:11px;padding:16px 20px;font:700 14.5px 'Space Grotesk',sans-serif;cursor:pointer;box-shadow:0 0 24px rgba(140,255,0,.28);transition:background .15s")}>Adicionar à lista</button>
                      <a className="vh-wa" href={pv.pBuyNowUrl} target="_blank" style={css("flex:1;min-width:180px;display:inline-flex;align-items:center;justify-content:center;gap:8px;background:#25D366;color:#062e17;border-radius:11px;padding:16px 20px;font:700 14.5px 'Space Grotesk',sans-serif;transition:filter .15s")}><span style={css("width:9px;height:9px;background:#062e17;border-radius:50%")}></span>Comprar pelo WhatsApp</a>
                    </>
                  )}
                  {pv.pIsOut && (
                    <>
                      <button disabled style={css("flex:1;min-width:180px;background:#341052;color:#9690A3;border:none;border-radius:11px;padding:16px 20px;font:700 14.5px 'Space Grotesk',sans-serif;cursor:not-allowed")}>Produto indisponível</button>
                      <a className="vh-wa-outline" href={pv.pNotifyUrl} target="_blank" style={css("flex:1;min-width:180px;display:inline-flex;align-items:center;justify-content:center;background:transparent;border:1px solid #25D366;color:#25D366;border-radius:11px;padding:15px 20px;font:700 14.5px 'Space Grotesk',sans-serif")}>Avise-me quando chegar</a>
                    </>
                  )}
                </div>
                <div style={css("display:flex;flex-direction:column;gap:9px;background:#1D0333;border:1px solid #341052;border-radius:14px;padding:16px 20px")}>
                  <span style={css("font:600 13px 'Manrope',sans-serif;color:#D8D5E0")}><span style={css("color:#8CFF00")}>✓</span> Garantia: {pv.pWarranty}</span>
                  <span style={css("font:600 13px 'Manrope',sans-serif;color:#D8D5E0")}><span style={css("color:#8CFF00")}>✓</span> Retirada na loja ou entrega combinada com o atendente</span>
                  <span style={css("font:600 13px 'Manrope',sans-serif;color:#D8D5E0")}><span style={css("color:#8CFF00")}>✓</span> Produto original, lacrado e com nota fiscal</span>
                </div>
                <div style={css("display:flex;gap:10px;align-items:flex-start;background:rgba(37,211,102,.07);border:1px solid rgba(37,211,102,.35);border-radius:12px;padding:13px 16px")}>
                  <span style={css("width:9px;height:9px;margin-top:4px;background:#25D366;border-radius:50%;flex:none")}></span>
                  <span style={css("font:600 12.5px/1.55 'Manrope',sans-serif;color:#D8D5E0")}>A compra é concluída com um atendente pelo WhatsApp. Nenhum pagamento é feito neste site.</span>
                </div>
              </div>
            </div>
            <div style={css("display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:20px;margin-top:52px")}>
              <div style={css("background:#1D0333;border:1px solid #341052;border-radius:16px;padding:26px")}>
                <h3 style={css("margin:0 0 16px;font:700 17px 'Space Grotesk',sans-serif;color:#B056FF")}>Especificações técnicas</h3>
                {pv.pSpecs.map((s, i) => (
                  <div key={i} style={css("display:flex;justify-content:space-between;gap:16px;padding:10px 0;border-bottom:1px solid #22003D")}>
                    <span style={css("font:600 13px 'Manrope',sans-serif;color:#9690A3")}>{s.k}</span>
                    <span style={css("font:600 13px 'Manrope',sans-serif;color:#FFFFFF;text-align:right")}>{s.v}</span>
                  </div>
                ))}
              </div>
              <div style={css("background:#1D0333;border:1px solid #341052;border-radius:16px;padding:26px")}>
                <h3 style={css("margin:0 0 12px;font:700 17px 'Space Grotesk',sans-serif;color:#B056FF")}>Descrição</h3>
                <p style={css("margin:0;font:500 14px/1.7 'Manrope',sans-serif;color:#D8D5E0")}>{pv.pDesc}</p>
                <h3 style={css("margin:22px 0 12px;font:700 17px 'Space Grotesk',sans-serif;color:#B056FF")}>Entrega e retirada</h3>
                <p style={css("margin:0;font:500 14px/1.7 'Manrope',sans-serif;color:#D8D5E0")}>Retire na loja em Macapá-AP ou combine a entrega diretamente com o atendente. Prazos e valores de frete são confirmados no WhatsApp antes da compra.</p>
              </div>
            </div>
            <h2 style={css("margin:52px 0 20px;font:700 24px 'Space Grotesk',sans-serif")}>Produtos relacionados</h2>
            <div style={css("display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:16px")}>
              {pv.related.map((it, i) => (<ProductCard key={i} p={it} />))}
            </div>
          </section>
        )}

        {/* ===== INTEREST LIST ===== */}
        {isCart && (
          <section style={css("max-width:1240px;margin:0 auto;padding:40px 24px;width:100%")}>
            <p style={css("margin:0 0 6px;font:600 12px 'Space Grotesk',sans-serif;color:#9690A3")}><span onClick={goP("home")} style={css("cursor:pointer;color:#B056FF")}>Início</span> / Minha lista</p>
            <h1 style={css("margin:0 0 26px;font:700 34px 'Space Grotesk',sans-serif")}>Minha lista de interesse</h1>
            {cart.length === 0 && (
              <div style={css("text-align:center;padding:70px 24px;background:#1D0333;border:1px dashed #341052;border-radius:16px")}>
                <span style={css("display:inline-block;width:16px;height:16px;border:3px solid #8CFF00;border-radius:4px;margin-bottom:14px")}></span>
                <h3 style={css("margin:0 0 8px;font:700 20px 'Space Grotesk',sans-serif")}>Sua lista está vazia</h3>
                <p style={css("margin:0 0 20px;font:500 14px 'Manrope',sans-serif;color:#9690A3")}>Explore o catálogo e adicione os produtos que você quer negociar com nosso time.</p>
                <button className="vh-btn-lime" onClick={goP("home")} style={css("background:#8CFF00;color:#09050D;border:none;border-radius:10px;padding:14px 26px;font:700 14px 'Space Grotesk',sans-serif;cursor:pointer")}>Explorar produtos</button>
              </div>
            )}
            {cartCount > 0 && (
              <div style={css("display:grid;grid-template-columns:1fr;gap:28px;max-width:1100px")}>
                <div style={css("display:flex;flex-direction:column;gap:12px")}>
                  {cartRows.map((r) => (
                    <div key={r.key} style={css("display:flex;gap:16px;align-items:center;background:#1D0333;border:1px solid #341052;border-radius:14px;padding:16px;flex-wrap:wrap")}>
                      <div onClick={r.open} style={css("width:76px;height:76px;flex:none;background:repeating-linear-gradient(45deg,#2A0A45 0 8px,#24063C 8px 16px);border:1px solid #341052;border-radius:10px;display:flex;align-items:center;justify-content:center;cursor:pointer")}><span style={css("font:500 9px ui-monospace,monospace;color:#9690A3")}>[foto]</span></div>
                      <div style={css("flex:1;min-width:170px;display:flex;flex-direction:column;gap:3px")}>
                        <span className="vh-lime" onClick={r.open} style={css("font:700 14.5px 'Space Grotesk',sans-serif;cursor:pointer")}>{r.name}</span>
                        <span style={css("font:500 12px 'Manrope',sans-serif;color:#9690A3")}>{r.variant}</span>
                        <span style={css("font:600 12.5px 'Manrope',sans-serif;color:#D8D5E0")}>{r.unitF} /un.</span>
                      </div>
                      <div style={css("display:flex;align-items:center;border:1px solid #341052;border-radius:9px;overflow:hidden")}>
                        <button className="vh-qty" onClick={r.down} style={css("width:34px;height:38px;background:#22003D;border:none;color:#FFFFFF;font:700 16px 'Space Grotesk',sans-serif;cursor:pointer")}>−</button>
                        <span style={css("width:38px;text-align:center;font:700 14px 'Space Grotesk',sans-serif")}>{r.qty}</span>
                        <button className="vh-qty" onClick={r.up} style={css("width:34px;height:38px;background:#22003D;border:none;color:#FFFFFF;font:700 16px 'Space Grotesk',sans-serif;cursor:pointer")}>+</button>
                      </div>
                      <span style={css("min-width:100px;text-align:right;font:700 17px 'Space Grotesk',sans-serif;color:#8CFF00")}>{r.subF}</span>
                      <button className="vh-remove" onClick={r.remove} title="Remover" style={css("width:34px;height:34px;background:transparent;border:1px solid #341052;border-radius:9px;color:#9690A3;font:600 14px 'Space Grotesk',sans-serif;cursor:pointer;transition:border-color .12s,color .12s")}>✕</button>
                    </div>
                  ))}
                </div>
                <div style={css("background:linear-gradient(160deg,#22003D,#1D0333);border:1px solid #341052;border-radius:16px;padding:26px;display:flex;flex-wrap:wrap;gap:20px;align-items:center;justify-content:space-between")}>
                  <div style={css("display:flex;flex-direction:column;gap:4px")}>
                    <span style={css("font:600 13px 'Manrope',sans-serif;color:#9690A3")}>Valor total estimado ({cartCount} item(ns))</span>
                    <span style={css("font:700 30px 'Space Grotesk',sans-serif;color:#8CFF00")}>{fmt(cartTotal)}</span>
                    <span style={css("font:500 12px 'Manrope',sans-serif;color:#9690A3")}>Valores confirmados com o atendente no WhatsApp</span>
                  </div>
                  <div style={css("display:flex;gap:12px;flex-wrap:wrap")}>
                    <button className="vh-ghost-violet" onClick={goP("home")} style={css("background:transparent;border:1px solid #8B2CF5;color:#FFFFFF;border-radius:11px;padding:15px 24px;font:600 14px 'Space Grotesk',sans-serif;cursor:pointer")}>Continuar explorando</button>
                    <button className="vh-btn-lime" onClick={goP("review")} style={css("background:#8CFF00;color:#09050D;border:none;border-radius:11px;padding:15px 28px;font:700 14px 'Space Grotesk',sans-serif;cursor:pointer;box-shadow:0 0 24px rgba(140,255,0,.28)")}>Revisar solicitação →</button>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ===== REVIEW ===== */}
        {isReview && (
          <section style={css("max-width:860px;margin:0 auto;padding:40px 24px;width:100%")}>
            <div style={css("display:flex;gap:8px;align-items:center;justify-content:center;margin-bottom:30px;flex-wrap:wrap")}>
              <span style={css("font:700 12px 'Space Grotesk',sans-serif;color:#8CFF00")}>✓ 1. Lista</span><span style={css("width:28px;height:1px;background:#341052")}></span>
              <span style={css("font:700 12px 'Space Grotesk',sans-serif;color:#FFFFFF;background:#8B2CF5;padding:6px 12px;border-radius:16px")}>2. Revisão</span><span style={css("width:28px;height:1px;background:#341052")}></span>
              <span style={css("font:700 12px 'Space Grotesk',sans-serif;color:#9690A3")}>3. WhatsApp</span>
            </div>
            <h1 style={css("margin:0 0 8px;font:700 30px 'Space Grotesk',sans-serif;text-align:center")}>Revise sua solicitação</h1>
            <p style={css("margin:0 0 28px;font:500 14px 'Manrope',sans-serif;color:#9690A3;text-align:center")}>Confira os itens e informe seu nome — nosso atendente vai te chamar pelo nome.</p>
            <div style={css("background:#1D0333;border:1px solid #341052;border-radius:16px;padding:24px;display:flex;flex-direction:column;gap:12px;margin-bottom:18px")}>
              {cartRows.map((r) => (
                <div key={r.key} style={css("display:flex;justify-content:space-between;gap:14px;padding-bottom:12px;border-bottom:1px solid #22003D;flex-wrap:wrap")}>
                  <div style={css("display:flex;flex-direction:column;gap:2px")}>
                    <span style={css("font:700 14px 'Space Grotesk',sans-serif")}>{r.qty}× {r.name}</span>
                    <span style={css("font:500 12px 'Manrope',sans-serif;color:#9690A3")}>{r.variant}</span>
                  </div>
                  <span style={css("font:700 15px 'Space Grotesk',sans-serif;color:#8CFF00")}>{r.subF}</span>
                </div>
              ))}
              <div style={css("display:flex;justify-content:space-between;align-items:baseline")}>
                <span style={css("font:700 14px 'Space Grotesk',sans-serif;color:#D8D5E0")}>Total estimado</span>
                <span style={css("font:700 24px 'Space Grotesk',sans-serif;color:#8CFF00")}>{fmt(cartTotal)}</span>
              </div>
            </div>
            <div style={css("background:#1D0333;border:1px solid #341052;border-radius:16px;padding:24px;display:flex;flex-direction:column;gap:14px;margin-bottom:18px")}>
              <label style={css("font:700 12.5px 'Space Grotesk',sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#D8D5E0")}>Seu nome *</label>
              <input className="vh-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Como podemos te chamar?" style={css("background:#120020;border:1px solid #341052;border-radius:10px;padding:14px 16px;color:#FFFFFF;font:500 14px 'Manrope',sans-serif;outline:none;transition:border-color .15s")} />
              <span style={css("font:700 12.5px 'Space Grotesk',sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#D8D5E0;margin-top:6px")}>Prévia da mensagem</span>
              <div style={css("background:#0b141a;border-radius:14px;padding:16px;border:1px solid #1f2c34")}>
                <div style={css("background:#005c4b;border-radius:12px 12px 4px 12px;padding:14px 16px;max-width:92%;margin-left:auto")}>
                  <pre style={css("margin:0;white-space:pre-wrap;font:500 12.5px/1.6 'Manrope',sans-serif;color:#e9edef")}>{buildMsg(name.trim())}</pre>
                </div>
              </div>
            </div>
            {nameOk ? (
              <button className="vh-finalize" onClick={() => { window.open(waCartUrl, "_blank"); go("sent"); }} style={css("width:100%;display:flex;align-items:center;justify-content:center;gap:10px;background:#25D366;color:#062e17;border:none;border-radius:12px;padding:18px;font:700 16px 'Space Grotesk',sans-serif;cursor:pointer;box-shadow:0 0 34px rgba(37,211,102,.35);transition:filter .15s")}><span style={css("width:10px;height:10px;background:#062e17;border-radius:50%")}></span>Finalizar pelo WhatsApp</button>
            ) : (
              <button disabled style={css("width:100%;background:#341052;color:#9690A3;border:none;border-radius:12px;padding:18px;font:700 16px 'Space Grotesk',sans-serif;cursor:not-allowed")}>Informe seu nome para continuar</button>
            )}
            <p style={css("margin:14px 0 0;text-align:center;font:500 12px 'Manrope',sans-serif;color:#9690A3")}>Você será redirecionado ao WhatsApp com a mensagem pronta. Nenhum pagamento é feito neste site.</p>
          </section>
        )}

        {/* ===== SENT ===== */}
        {isSent && (
          <section style={css("max-width:620px;margin:0 auto;padding:80px 24px;width:100%;text-align:center")}>
            <div style={css("width:74px;height:74px;margin:0 auto 22px;border-radius:50%;background:rgba(37,211,102,.12);border:2px solid #25D366;display:flex;align-items:center;justify-content:center;font:700 32px 'Space Grotesk',sans-serif;color:#25D366;box-shadow:0 0 40px rgba(37,211,102,.3)")}>✓</div>
            <h1 style={css("margin:0 0 10px;font:700 30px 'Space Grotesk',sans-serif")}>Solicitação enviada!</h1>
            <p style={css("margin:0 0 26px;font:500 14.5px/1.7 'Manrope',sans-serif;color:#D8D5E0")}>Abrimos o WhatsApp com sua mensagem pronta. Se a janela não abriu, toque no botão abaixo — nosso time responde rapidinho.</p>
            <div style={css("display:flex;gap:12px;justify-content:center;flex-wrap:wrap")}>
              <a className="vh-wa" href={waCartUrl} target="_blank" style={css("display:inline-flex;align-items:center;gap:9px;background:#25D366;color:#062e17;border-radius:11px;padding:15px 26px;font:700 14px 'Space Grotesk',sans-serif")}><span style={css("width:9px;height:9px;background:#062e17;border-radius:50%")}></span>Abrir WhatsApp novamente</a>
              <button className="vh-ghost-violet" onClick={() => { setCart([]); setName(""); go("home"); }} style={css("background:transparent;border:1px solid #8B2CF5;color:#FFFFFF;border-radius:11px;padding:15px 26px;font:600 14px 'Space Grotesk',sans-serif;cursor:pointer")}>Voltar à loja</button>
            </div>
          </section>
        )}

        {/* ===== ABOUT ===== */}
        {isAbout && (
          <section style={css("max-width:980px;margin:0 auto;padding:56px 24px;width:100%")}>
            <span style={css("font:700 11.5px 'Space Grotesk',sans-serif;letter-spacing:.18em;text-transform:uppercase;color:#8CFF00")}>Sobre a empresa</span>
            <h1 style={css("margin:10px 0 16px;font:700 clamp(30px,4vw,42px)/1.1 'Space Grotesk',sans-serif")}>Tecnologia de verdade,<br /><span style={css("color:#B056FF")}>atendimento de gente.</span></h1>
            <p style={css("margin:0 0 36px;max-width:620px;font:500 15px/1.75 'Manrope',sans-serif;color:#D8D5E0")}>A Valhalla Tecnologia nasceu em Macapá-AP para facilitar o acesso a eletrônicos originais com preço justo. Aqui não tem robô de checkout: você escolhe no site e fecha negócio conversando com um atendente que entende do assunto.</p>
            <div style={css("display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;margin-bottom:36px")}>
              <div style={css("background:#1D0333;border:1px solid #341052;border-radius:14px;padding:24px")}><span style={css("font:700 30px 'Space Grotesk',sans-serif;color:#8CFF00")}>+5 mil</span><p style={css("margin:6px 0 0;font:500 13px 'Manrope',sans-serif;color:#9690A3")}>clientes atendidos pelo WhatsApp</p></div>
              <div style={css("background:#1D0333;border:1px solid #341052;border-radius:14px;padding:24px")}><span style={css("font:700 30px 'Space Grotesk',sans-serif;color:#8CFF00")}>100%</span><p style={css("margin:6px 0 0;font:500 13px 'Manrope',sans-serif;color:#9690A3")}>produtos originais com nota fiscal</p></div>
              <div style={css("background:#1D0333;border:1px solid #341052;border-radius:14px;padding:24px")}><span style={css("font:700 30px 'Space Grotesk',sans-serif;color:#8CFF00")}>4,9★</span><p style={css("margin:6px 0 0;font:500 13px 'Manrope',sans-serif;color:#9690A3")}>avaliação média dos clientes</p></div>
            </div>
            <div style={css("aspect-ratio:21/9;background:repeating-linear-gradient(45deg,#2A0A45 0 14px,#24063C 14px 28px);border:1px solid #341052;border-radius:18px;display:flex;align-items:center;justify-content:center")}><span style={css("font:500 12px ui-monospace,monospace;color:#9690A3;background:rgba(9,5,13,.55);padding:6px 12px;border-radius:6px")}>[foto: fachada / equipe da loja]</span></div>
          </section>
        )}

        {/* ===== CONTACT ===== */}
        {isContact && (
          <section style={css("max-width:980px;margin:0 auto;padding:48px 24px;width:100%")}>
            <h1 style={css("margin:0 0 8px;font:700 34px 'Space Grotesk',sans-serif")}>Fale com a gente</h1>
            <p style={css("margin:0 0 30px;font:500 14px 'Manrope',sans-serif;color:#9690A3")}>O WhatsApp é nosso canal mais rápido — resposta em minutos no horário comercial.</p>
            <div style={css("display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;align-items:start")}>
              <div style={css("display:flex;flex-direction:column;gap:12px")}>
                <a className="vh-contactlink" href={waDirectUrl} target="_blank" style={css("display:flex;align-items:center;gap:14px;background:rgba(37,211,102,.08);border:1px solid rgba(37,211,102,.4);border-radius:14px;padding:20px;color:#FFFFFF")}>
                  <span style={css("width:40px;height:40px;flex:none;border-radius:50%;background:#25D366;display:flex;align-items:center;justify-content:center")}><span style={css("width:12px;height:12px;background:#062e17;border-radius:50%")}></span></span>
                  <span style={css("display:flex;flex-direction:column;gap:2px")}><span style={css("font:700 15px 'Space Grotesk',sans-serif")}>WhatsApp</span><span style={css("font:600 13px 'Manrope',sans-serif;color:#25D366")}>+55 96 8423-5663 · resposta rápida</span></span>
                </a>
                <div style={css("background:#1D0333;border:1px solid #341052;border-radius:14px;padding:20px;display:flex;flex-direction:column;gap:10px")}>
                  <span style={css("font:600 13px 'Manrope',sans-serif;color:#D8D5E0")}><span style={css("color:#B056FF;font-weight:700")}>E-mail:</span> contato@valhallatecnologia.com.br</span>
                  <span style={css("font:600 13px 'Manrope',sans-serif;color:#D8D5E0")}><span style={css("color:#B056FF;font-weight:700")}>Endereço:</span> Macapá - AP (retirada com hora marcada)</span>
                  <span style={css("font:600 13px 'Manrope',sans-serif;color:#D8D5E0")}><span style={css("color:#B056FF;font-weight:700")}>Horário:</span> seg. a sáb., 9h às 19h</span>
                </div>
              </div>
              <div style={css("background:#1D0333;border:1px solid #341052;border-radius:16px;padding:24px;display:flex;flex-direction:column;gap:12px")}>
                <span style={css("font:700 15px 'Space Grotesk',sans-serif")}>Prefere e-mail? Escreva aqui</span>
                <input className="vh-input" value={cName} onChange={(e) => setCName(e.target.value)} placeholder="Seu nome" style={css("background:#120020;border:1px solid #341052;border-radius:10px;padding:13px 15px;color:#FFFFFF;font:500 13.5px 'Manrope',sans-serif;outline:none")} />
                <input className="vh-input" value={cMail} onChange={(e) => setCMail(e.target.value)} placeholder="Seu e-mail" style={css("background:#120020;border:1px solid #341052;border-radius:10px;padding:13px 15px;color:#FFFFFF;font:500 13.5px 'Manrope',sans-serif;outline:none")} />
                <textarea className="vh-input" value={cMsg} onChange={(e) => setCMsg(e.target.value)} placeholder="Sua mensagem" rows={4} style={css("background:#120020;border:1px solid #341052;border-radius:10px;padding:13px 15px;color:#FFFFFF;font:500 13.5px 'Manrope',sans-serif;outline:none;resize:vertical")} />
                <button className="vh-btn-lime" onClick={() => { setCName(""); setCMail(""); setCMsg(""); showToast("Mensagem enviada! Retornaremos em breve.", "#8CFF00"); }} style={css("background:#8CFF00;color:#09050D;border:none;border-radius:10px;padding:14px;font:700 14px 'Space Grotesk',sans-serif;cursor:pointer")}>Enviar mensagem</button>
              </div>
            </div>
          </section>
        )}

        {/* ===== FAQ ===== */}
        {isFaq && (
          <section style={css("max-width:780px;margin:0 auto;padding:48px 24px;width:100%")}>
            <h1 style={css("margin:0 0 8px;font:700 34px 'Space Grotesk',sans-serif")}>Perguntas frequentes</h1>
            <p style={css("margin:0 0 28px;font:500 14px 'Manrope',sans-serif;color:#9690A3")}>Não achou sua dúvida? <a href={waDirectUrl} target="_blank" style={css("color:#25D366;font-weight:700")}>Chama no WhatsApp</a>.</p>
            <div style={css("display:flex;flex-direction:column;gap:10px")}>
              {faqs.map((f, i) => (
                <div key={i} style={{ ...css("background:#1D0333;border-radius:14px;overflow:hidden;transition:border-color .15s"), border: "1px solid " + f.bc }}>
                  <div className="vh-accordion" onClick={f.toggle} style={css("display:flex;justify-content:space-between;align-items:center;gap:14px;padding:18px 22px;cursor:pointer")}>
                    <span style={css("font:700 14.5px 'Space Grotesk',sans-serif")}>{f.q}</span>
                    <span style={css("font:700 18px 'Space Grotesk',sans-serif;color:#8CFF00;flex:none")}>{f.icon}</span>
                  </div>
                  {f.open && (<p style={css("margin:0;padding:0 22px 18px;font:500 13.5px/1.7 'Manrope',sans-serif;color:#D8D5E0")}>{f.a}</p>)}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ===== POLICIES ===== */}
        {isPolicies && (
          <section style={css("max-width:780px;margin:0 auto;padding:48px 24px;width:100%")}>
            <h1 style={css("margin:0 0 28px;font:700 34px 'Space Grotesk',sans-serif")}>Políticas da empresa</h1>
            <div style={css("display:flex;flex-direction:column;gap:10px")}>
              {policies.map((f, i) => (
                <div key={i} style={{ ...css("background:#1D0333;border-radius:14px;overflow:hidden"), border: "1px solid " + f.bc }}>
                  <div className="vh-accordion" onClick={f.toggle} style={css("display:flex;justify-content:space-between;align-items:center;gap:14px;padding:18px 22px;cursor:pointer")}>
                    <span style={css("font:700 14.5px 'Space Grotesk',sans-serif")}>{f.q}</span>
                    <span style={css("font:700 18px 'Space Grotesk',sans-serif;color:#8CFF00;flex:none")}>{f.icon}</span>
                  </div>
                  {f.open && (<p style={css("margin:0;padding:0 22px 18px;font:500 13.5px/1.7 'Manrope',sans-serif;color:#D8D5E0")}>{f.a}</p>)}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ===== 404 ===== */}
        {is404 && (
          <section style={css("max-width:620px;margin:0 auto;padding:90px 24px;width:100%;text-align:center")}>
            <span style={css("font:700 clamp(80px,14vw,120px)/1 'Space Grotesk',sans-serif;background:linear-gradient(120deg,#8B2CF5,#B056FF);-webkit-background-clip:text;background-clip:text;color:transparent")}>404</span>
            <h1 style={css("margin:14px 0 10px;font:700 26px 'Space Grotesk',sans-serif")}>Essa página se perdeu no Valhalla</h1>
            <p style={css("margin:0 0 26px;font:500 14px/1.7 'Manrope',sans-serif;color:#9690A3")}>O endereço não existe ou o produto saiu do catálogo. Bora voltar para as ofertas?</p>
            <div style={css("display:flex;gap:12px;justify-content:center;flex-wrap:wrap")}>
              <button className="vh-btn-lime" onClick={goP("home")} style={css("background:#8CFF00;color:#09050D;border:none;border-radius:11px;padding:15px 26px;font:700 14px 'Space Grotesk',sans-serif;cursor:pointer")}>Voltar ao início</button>
              <a className="vh-wa-outline" href={waDirectUrl} target="_blank" style={css("display:inline-flex;align-items:center;background:transparent;border:1px solid #25D366;color:#25D366;border-radius:11px;padding:14px 26px;font:700 14px 'Space Grotesk',sans-serif")}>Falar com atendente</a>
            </div>
          </section>
        )}
      </main>

      {/* ===== FOOTER ===== */}
      <footer style={css("background:#09050D;border-top:1px solid #22003D;margin-top:72px")}>
        <div style={css("max-width:1240px;margin:0 auto;padding:48px 24px 24px;display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:32px")}>
          <div style={css("display:flex;flex-direction:column;gap:12px")}>
            <div style={css("display:flex;flex-direction:column;line-height:1")}>
              <span style={css("font:700 20px 'Space Grotesk',sans-serif;letter-spacing:.04em;transform:skewX(-4deg)")}>VALHALLA</span>
              <span style={css("font:700 8.5px 'Space Grotesk',sans-serif;letter-spacing:.42em;color:#8CFF00;margin-top:3px")}>TECNOLOGIA</span>
            </div>
            <p style={css("margin:0;font:500 12.5px/1.65 'Manrope',sans-serif;color:#9690A3")}>Eletrônicos originais com atendimento humano pelo WhatsApp. Macapá - AP.</p>
            <a className="vh-wa" href={waDirectUrl} target="_blank" style={css("align-self:flex-start;display:inline-flex;align-items:center;gap:8px;background:#25D366;color:#062e17;border-radius:9px;padding:10px 16px;font:700 12.5px 'Space Grotesk',sans-serif")}><span style={css("width:8px;height:8px;background:#062e17;border-radius:50%")}></span>+55 96 8423-5663</a>
          </div>
          <div style={css("display:flex;flex-direction:column;gap:9px")}>
            <span style={css("font:700 12px 'Space Grotesk',sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#B056FF;margin-bottom:4px")}>Categorias</span>
            {navCats.map((c, i) => (<span key={i} className="vh-lime" onClick={c.open} style={css("font:500 13px 'Manrope',sans-serif;color:#9690A3;cursor:pointer")}>{c.n}</span>))}
          </div>
          <div style={css("display:flex;flex-direction:column;gap:9px")}>
            <span style={css("font:700 12px 'Space Grotesk',sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#B056FF;margin-bottom:4px")}>Institucional</span>
            <span className="vh-lime" onClick={goP("about")} style={css("font:500 13px 'Manrope',sans-serif;color:#9690A3;cursor:pointer")}>Sobre a empresa</span>
            <span className="vh-lime" onClick={goP("faq")} style={css("font:500 13px 'Manrope',sans-serif;color:#9690A3;cursor:pointer")}>Perguntas frequentes</span>
            <span className="vh-lime" onClick={goP("policies")} style={css("font:500 13px 'Manrope',sans-serif;color:#9690A3;cursor:pointer")}>Políticas da empresa</span>
            <span className="vh-lime" onClick={goP("contact")} style={css("font:500 13px 'Manrope',sans-serif;color:#9690A3;cursor:pointer")}>Contato</span>
            <span className="vh-lime" onClick={goP("404")} style={css("font:500 11px 'Manrope',sans-serif;color:#4d4160;cursor:pointer")}>Página 404 (demo)</span>
          </div>
          <div style={css("display:flex;flex-direction:column;gap:9px")}>
            <span style={css("font:700 12px 'Space Grotesk',sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#B056FF;margin-bottom:4px")}>Como funciona</span>
            <p style={css("margin:0;font:500 12.5px/1.65 'Manrope',sans-serif;color:#9690A3")}>Este site é um catálogo: você monta sua lista de interesse e a compra é concluída com um atendente pelo WhatsApp. Nenhum pagamento é processado aqui.</p>
          </div>
        </div>
        <div style={css("border-top:1px solid #22003D")}>
          <p style={css("max-width:1240px;margin:0 auto;padding:16px 24px;font:500 11.5px 'Manrope',sans-serif;color:#4d4160")}>© 2026 Valhalla Tecnologia · CNPJ 00.000.000/0001-00 · Imagens meramente ilustrativas</p>
        </div>
      </footer>

      {/* ===== FLOATING WA ===== */}
      {showFab && (
        <a className="vh-fab" href={waDirectUrl} target="_blank" title="Falar no WhatsApp" style={css("position:fixed;right:22px;bottom:22px;z-index:80;display:flex;align-items:center;gap:10px;background:#25D366;color:#062e17;border-radius:30px;padding:14px 22px;font:700 13.5px 'Space Grotesk',sans-serif;box-shadow:0 10px 30px rgba(37,211,102,.4);transition:transform .15s,filter .15s")}><span style={css("width:10px;height:10px;background:#062e17;border-radius:50%")}></span>Falar no WhatsApp</a>
      )}

      {/* ===== TOAST ===== */}
      {toast && (
        <div style={{ ...css("position:fixed;bottom:26px;left:50%;transform:translateX(-50%);z-index:90;display:flex;align-items:center;gap:10px;background:#1D0333;border-radius:12px;padding:14px 22px;box-shadow:0 14px 40px rgba(9,5,13,.6);animation:vh-toast .25s ease"), border: "1px solid " + toast.color }}>
          <span style={{ ...css("width:9px;height:9px;border-radius:50%"), background: toast.color }}></span>
          <span style={css("font:700 13.5px 'Space Grotesk',sans-serif;color:#FFFFFF")}>{toast.msg}</span>
        </div>
      )}
    </div>
  );
}
