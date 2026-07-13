export function fmt(n: number): string {
  return "R$ " + n.toLocaleString("pt-BR");
}

export function waUrl(phone: string, msg: string): string {
  return "https://wa.me/" + phone.replace(/\D/g, "") + "?text=" + encodeURIComponent(msg);
}
