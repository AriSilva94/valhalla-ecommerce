export async function POST(request: Request): Promise<Response> {
  if (process.env.LOCAL_WEBHOOK_TUNNEL_PROXY !== "true") {
    return new Response(null, { status: 404 });
  }

  const baseUrl = (process.env.STRAPI_INTERNAL_URL || process.env.STRAPI_URL || "").trim().replace(/\/+$/, "");
  if (!baseUrl) return new Response(null, { status: 500 });

  const token = request.headers.get("asaas-access-token");
  const body = await request.text();

  const upstream = await fetch(`${baseUrl}/api/asaas/webhook`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "asaas-access-token": token } : {}),
    },
    body,
  });

  return new Response(await upstream.text(), { status: upstream.status });
}
