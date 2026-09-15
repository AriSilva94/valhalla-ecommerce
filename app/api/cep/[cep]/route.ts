import { withJsonCache, type JsonCacheClient } from "../../../lib/content-cache";

type ViaCepResponse = {
  erro?: boolean;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
};

type CepData = {
  addressLine: string;
  neighborhood: string;
  city: string;
  state: string;
};

export type CepLookupDependencies = {
  cache?: JsonCacheClient | null;
  fetcher?: typeof fetch;
};

class CepLookupError extends Error {
  constructor(readonly kind: "NOT_FOUND" | "UPSTREAM_ERROR") {
    super(kind);
  }
}

async function fetchCep(digits: string, fetcher: typeof fetch): Promise<CepData> {
  let res: Response;
  try {
    res = await fetcher(`https://viacep.com.br/ws/${digits}/json/`, {
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    throw new CepLookupError("UPSTREAM_ERROR");
  }

  if (res.status !== 200) throw new CepLookupError("UPSTREAM_ERROR");

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    throw new CepLookupError("UPSTREAM_ERROR");
  }

  if (isViaCepNotFound(body)) throw new CepLookupError("NOT_FOUND");
  if (!isViaCepAddress(body)) throw new CepLookupError("UPSTREAM_ERROR");

  return {
    addressLine: body.logradouro ?? "",
    neighborhood: body.bairro ?? "",
    city: body.localidade ?? "",
    state: body.uf ?? "",
  };
}

function isViaCepNotFound(body: unknown): body is ViaCepResponse & { erro: true } {
  return isRecord(body) && body.erro === true;
}

function isViaCepAddress(body: unknown): body is Required<Pick<ViaCepResponse, "logradouro" | "bairro" | "localidade" | "uf">> {
  return isRecord(body)
    && typeof body.logradouro === "string"
    && typeof body.bairro === "string"
    && typeof body.localidade === "string"
    && typeof body.uf === "string";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function lookupCep(cep: string, dependencies: CepLookupDependencies = {}): Promise<Response> {
  const digits = cep.replace(/\D/g, "");
  if (digits.length !== 8) {
    return Response.json({ ok: false, error: "VALIDATION_ERROR" }, { status: 400 });
  }

  try {
    const data = await withJsonCache(
      `cep:${digits}`,
      604800,
      () => fetchCep(digits, dependencies.fetcher ?? fetch),
      dependencies.cache
    );
    return Response.json({ ok: true, data });
  } catch (error) {
    if (error instanceof CepLookupError && error.kind === "NOT_FOUND") {
      return Response.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }
    return Response.json({ ok: false, error: "UPSTREAM_ERROR" }, { status: 502 });
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ cep: string }> }
): Promise<Response> {
  const { cep } = await params;
  return lookupCep(cep);
}
