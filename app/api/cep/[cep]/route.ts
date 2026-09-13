type ViaCepResponse = {
  erro?: boolean;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ cep: string }> }
): Promise<Response> {
  const { cep } = await params;
  const digits = cep.replace(/\D/g, "");
  if (digits.length !== 8) {
    return Response.json({ ok: false, error: "VALIDATION_ERROR" }, { status: 400 });
  }

  let res: Response;
  try {
    res = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    return Response.json({ ok: false, error: "UPSTREAM_ERROR" }, { status: 502 });
  }

  if (!res.ok) {
    return Response.json({ ok: false, error: "UPSTREAM_ERROR" }, { status: 502 });
  }

  let body: ViaCepResponse;
  try {
    body = await res.json();
  } catch {
    return Response.json({ ok: false, error: "UPSTREAM_ERROR" }, { status: 502 });
  }

  if (body.erro) {
    return Response.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  }

  return Response.json({
    ok: true,
    data: {
      addressLine: body.logradouro ?? "",
      neighborhood: body.bairro ?? "",
      city: body.localidade ?? "",
      state: body.uf ?? "",
    },
  });
}
