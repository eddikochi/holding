/**
 * Import do JSON da ferramenta de campo → modelo novo. NUNCA perde dado.
 *
 * Dois formatos reais, detectados automaticamente:
 *
 *  A) "sb_masterplan_v1" (PREFERENCIAL) — ferramenta principal de campo:
 *       { ativos:[], stakeholders:[], registros:[] }
 *     Mapeamento direto: ativos→Ativo, stakeholders→Stakeholder, registros→Evidência.
 *
 *  B) "campo_hub_v1" (LEGADO) — ferramenta específica do Hub Logístico:
 *       { galpao:{}, players:[], registros:[] }  (também tolera entrevistas[])
 *     Tudo entra no pilar LOGÍSTICO:
 *       galpao  → 1 Ativo tipo 'galpao' (checklist técnico → estadoFisico/metragens)
 *       players → Stakeholder pilar 'logistico'
 *       registros/entrevistas → Evidência pilar 'logistico'
 *
 * Regra: campo de origem sem destino no modelo novo vai para
 * `origem.camposNaoMapeados` da entidade destino — jamais é descartado.
 * O import é transacional (feito pelo chamador) e mostra preview antes.
 */
import { novoId, agora } from '../lib/ids';
import type {
  Ativo,
  Stakeholder,
  Evidencia,
  Hipotese,
  ItemChecklistJuridico,
  Pilar,
  Urgencia,
  Disposicao,
  ValidacaoRegistro,
} from '../models/types';
import { ITENS_JURIDICOS } from '../models/types';

export type FormatoCampo = 'sb_masterplan_v1' | 'campo_hub_v1' | 'desconhecido';

export interface ResultadoImport {
  formato: FormatoCampo;
  ativos: Ativo[];
  stakeholders: Stakeholder[];
  evidencias: Evidencia[];
  hipoteses: Hipotese[];
  /** Mensagens não fatais (ex.: campo movido para camposNaoMapeados). */
  avisos: string[];
}

export interface PreviewImport {
  formato: FormatoCampo;
  rotuloFormato: string;
  contagens: { ativos: number; stakeholders: number; evidencias: number; hipoteses: number };
  amostra: { ativos: string[]; stakeholders: string[]; evidencias: string[] };
  avisos: string[];
}

const ROTULO_FORMATO: Record<FormatoCampo, string> = {
  sb_masterplan_v1: 'Ferramenta principal de campo (sb_masterplan_v1)',
  campo_hub_v1: 'Ferramenta do Hub Logístico (formato antigo)',
  desconhecido: 'Formato não reconhecido',
};

/** Detecta o formato pelo formato do objeto, sem adivinhação frágil. */
export function detectarFormato(dados: unknown): FormatoCampo {
  if (!dados || typeof dados !== 'object') return 'desconhecido';
  const o = dados as Record<string, unknown>;
  if (Array.isArray(o.ativos) && Array.isArray(o.stakeholders)) {
    return 'sb_masterplan_v1';
  }
  if (Array.isArray(o.players) || (o.galpao && typeof o.galpao === 'object')) {
    return 'campo_hub_v1';
  }
  return 'desconhecido';
}

function metaOrigem(ferramenta: string, extras: Record<string, unknown>) {
  const limpo: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(extras)) {
    if (v !== undefined && v !== null && v !== '') limpo[k] = v;
  }
  return {
    ferramenta,
    dataImport: agora(),
    ...(Object.keys(limpo).length ? { camposNaoMapeados: limpo } : {}),
  };
}

function checklistVazio(): ItemChecklistJuridico[] {
  return ITENS_JURIDICOS.map((i) => ({
    chave: i.chave,
    status: 'nao_iniciado' as const,
    observacao: '',
    responsavel: '',
  }));
}

const num = (v: unknown): number | undefined => {
  if (v == null || v === '') return undefined;
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'));
  return isNaN(n) ? undefined : n;
};
const str = (v: unknown): string => (v == null ? '' : String(v));

function mapUrgencia(v: unknown): Urgencia | undefined {
  const s = str(v).toLowerCase();
  if (s.startsWith('alta') || s === 'alta') return 'alta';
  if (s.startsWith('méd') || s.startsWith('med')) return 'media';
  if (s.startsWith('baix')) return 'baixa';
  return undefined;
}
function mapDisposicao(v: unknown): Disposicao | undefined {
  const s = str(v).toLowerCase();
  if (s === 'sim') return 'sim';
  if (s === 'talvez') return 'talvez';
  if (s.startsWith('não') || s === 'nao') return 'nao';
  if (s.includes('não perguntad') || s.includes('nao perguntad')) return 'nao_perguntado';
  return undefined;
}
function mapValidacao(v: unknown): ValidacaoRegistro {
  const s = str(v).toLowerCase();
  if (s === 'validado' || s === 'validada') return 'validado';
  if (s === 'parcial') return 'parcial';
  return 'nao_validado';
}

/* ── Formato A: sb_masterplan_v1 ─────────────────────────────────────── */
function importarMasterplanV1(o: Record<string, unknown>): ResultadoImport {
  const avisos: string[] = [];
  const ts = agora();
  const camposConhecidosAtivo = new Set([
    'id', 'nome', 'tipo', 'endereco', 'lat', 'lng', 'terrenoM2', 'construidaM2',
    'peDireitoM', 'estadoFisico', 'situacaoJuridicaResumo',
  ]);
  const ativos: Ativo[] = (o.ativos as unknown[]).map((raw) => {
    const a = (raw ?? {}) as Record<string, unknown>;
    const extras: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(a)) {
      if (!camposConhecidosAtivo.has(k)) extras[k] = v;
    }
    const tipoRaw = str(a.tipo).toLowerCase();
    const tipo = (['galpao', 'terreno', 'loja', 'oficina'].includes(tipoRaw)
      ? tipoRaw
      : 'outro') as Ativo['tipo'];
    return {
      id: a.id ? String(a.id) : novoId(),
      createdAt: ts,
      updatedAt: ts,
      nome: str(a.nome) || '(sem nome)',
      tipo,
      endereco: str(a.endereco),
      lat: num(a.lat),
      lng: num(a.lng),
      metragens: {
        terrenoM2: num(a.terrenoM2),
        construidaM2: num(a.construidaM2),
        peDireitoM: num(a.peDireitoM),
      },
      estadoFisico: str(a.estadoFisico),
      fotos: [],
      potencialPorPilar: {},
      situacaoJuridicaResumo: str(a.situacaoJuridicaResumo),
      checklistJuridico: checklistVazio(),
      origem: metaOrigem('sb_masterplan_v1', extras),
    };
  });

  const camposConhecidosStk = new Set([
    'id', 'nome', 'pilar', 'segmento', 'contato', 'local', 'ativoId', 'dorOportunidade',
    'dor', 'urgencia', 'disposicao', 'valorCitado', 'valor', 'hipoteseId', 'validacao',
    'proximoPasso', 'data',
  ]);
  const stakeholders: Stakeholder[] = (o.stakeholders as unknown[]).map((raw) => {
    const s = (raw ?? {}) as Record<string, unknown>;
    const extras: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(s)) {
      if (!camposConhecidosStk.has(k)) extras[k] = v;
    }
    const pilarRaw = str(s.pilar).toLowerCase() as Pilar;
    const pilar: Pilar = (
      ['patrimonial', 'juridico', 'imobiliario', 'economico', 'logistico', 'agroindustrial', 'turistico']
        .includes(pilarRaw) ? pilarRaw : 'logistico'
    ) as Pilar;
    return {
      id: s.id ? String(s.id) : novoId(),
      createdAt: ts,
      updatedAt: ts,
      nome: str(s.nome) || '(sem nome)',
      pilar,
      segmento: str(s.segmento),
      contato: str(s.contato),
      local: str(s.local),
      ativoId: s.ativoId ? String(s.ativoId) : undefined,
      dorOportunidade: str(s.dorOportunidade ?? s.dor),
      urgencia: mapUrgencia(s.urgencia),
      disposicao: mapDisposicao(s.disposicao),
      valorCitado: str(s.valorCitado ?? s.valor) || undefined,
      validacao: mapValidacao(s.validacao),
      proximoPasso: str(s.proximoPasso),
      data: s.data ? String(s.data) : ts,
      origem: metaOrigem('sb_masterplan_v1', extras),
    };
  });

  const evidencias: Evidencia[] = (Array.isArray(o.registros) ? o.registros : []).map((raw) => {
    const r = (raw ?? {}) as Record<string, unknown>;
    const extras: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(r)) {
      if (!['id', 'texto', 'conteudo', 'pilar', 'data', 'ts', 'ativoId', 'stakeholderId'].includes(k)) {
        extras[k] = v;
      }
    }
    const pilarRaw = str(r.pilar).toLowerCase() as Pilar;
    const pilar: Pilar = (
      ['patrimonial', 'juridico', 'imobiliario', 'economico', 'logistico', 'agroindustrial', 'turistico']
        .includes(pilarRaw) ? pilarRaw : 'logistico'
    ) as Pilar;
    return {
      id: r.id ? String(r.id) : novoId(),
      createdAt: ts,
      updatedAt: ts,
      tipo: 'observacao',
      conteudo: str(r.conteudo ?? r.texto),
      pilar,
      fonte: 'observacao_campo',
      fonteDetalhe: 'Registro de campo',
      data: str(r.data ?? r.ts) || ts,
      ativoId: r.ativoId ? String(r.ativoId) : undefined,
      stakeholderId: r.stakeholderId ? String(r.stakeholderId) : undefined,
      confianca: 'media',
      origem: metaOrigem('sb_masterplan_v1', extras),
    };
  });

  return { formato: 'sb_masterplan_v1', ativos, stakeholders, evidencias, hipoteses: [], avisos };
}

/* ── Formato B: campo_hub_v1 (tudo em Logística) ─────────────────────── */
const ROTA_PARA_PILAR: Record<string, { pilar: Pilar; detalhe: string }> = {
  'Logística': { pilar: 'logistico', detalhe: 'Registro de campo — Rota Logística' },
  'Imobiliária': { pilar: 'imobiliario', detalhe: 'Registro de campo — Rota Imobiliária' },
  'Comercial': { pilar: 'economico', detalhe: 'Registro de campo — Rota Comercial' },
};

function importarHubV1(o: Record<string, unknown>): ResultadoImport {
  const avisos: string[] = [];
  const ts = agora();
  const ativos: Ativo[] = [];
  const stakeholders: Stakeholder[] = [];
  const evidencias: Evidencia[] = [];

  // galpao{} → 1 Ativo tipo galpao. Checklist técnico vira estadoFisico + metragens.
  const g = (o.galpao ?? {}) as Record<string, unknown>;
  if (Object.keys(g).length) {
    const partesEstado: string[] = [];
    const rotulos: Record<string, string> = {
      pedireito: 'Pé direito', docas: 'Docas', rampa: 'Rampa', acessos: 'Acessos',
      eletrica: 'Elétrica', cobertura: 'Cobertura', drenagem: 'Drenagem',
      internet: 'Internet', seguranca: 'Segurança', monitoramento: 'Monitoramento',
      distanciaponte: 'Distância da ponte', acessorod: 'Acesso rodoviário',
      fluxocaminhoes: 'Fluxo de caminhões', expansao: 'Expansão', obsgerais: 'Observações',
    };
    for (const [k, rot] of Object.entries(rotulos)) {
      if (g[k]) partesEstado.push(`${rot}: ${str(g[k])}`);
    }
    ativos.push({
      id: novoId(),
      createdAt: ts,
      updatedAt: ts,
      nome: 'Galpão (importado do Hub Logístico)',
      tipo: 'galpao',
      endereco: '',
      metragens: { construidaM2: num(g.metragem), peDireitoM: num(g.pedireito) },
      estadoFisico: partesEstado.join(' · '),
      fotos: [],
      potencialPorPilar: { logistico: 'Ativo âncora do diagnóstico logístico.' },
      situacaoJuridicaResumo: '',
      checklistJuridico: checklistVazio(),
      origem: metaOrigem('campo_hub_v1', { galpao_original: g }),
    });
  }

  // players[] → Stakeholder pilar logistico
  const players = Array.isArray(o.players) ? o.players : [];
  for (const raw of players) {
    const p = (raw ?? {}) as Record<string, unknown>;
    const camposConhecidos = new Set([
      'id', 'nome', 'segmento', 'contato', 'local', 'localizacao', 'dor', 'dordetalhe',
      'urgencia', 'urg', 'pagamento', 'disposicao', 'valor', 'valorCitado', 'proximo',
      'proximoPasso', 'validacao', 'estagio', 'ts', 'data', 'freq', 'hipotese',
      'oportunidade', 'concorrentes', 'riscos',
    ]);
    const extras: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(p)) {
      if (!camposConhecidos.has(k)) extras[k] = v;
    }
    // dor: categoria + detalhe combinados sem perder nenhum
    const dorPartes = [str(p.dor), str(p.dordetalhe)].filter(Boolean);
    // campos ricos do hub que não têm slot direto: preservar em camposNaoMapeados
    for (const campo of ['oportunidade', 'concorrentes', 'riscos', 'freq', 'hipotese']) {
      if (p[campo]) extras[campo] = p[campo];
    }
    stakeholders.push({
      id: p.id ? String(p.id) : novoId(),
      createdAt: ts,
      updatedAt: ts,
      nome: str(p.nome) || '(sem nome)',
      pilar: 'logistico',
      segmento: str(p.segmento),
      contato: str(p.contato),
      local: str(p.local ?? p.localizacao),
      dorOportunidade: dorPartes.join(' — '),
      urgencia: mapUrgencia(p.urgencia ?? p.urg),
      disposicao: mapDisposicao(p.pagamento ?? p.disposicao),
      valorCitado: str(p.valor ?? p.valorCitado) || undefined,
      validacao: mapValidacao(p.validacao ?? p.estagio),
      proximoPasso: str(p.proximo ?? p.proximoPasso),
      data: str(p.ts ?? p.data) || ts,
      origem: metaOrigem('campo_hub_v1', extras),
    });
  }
  if (players.length) {
    avisos.push(
      'Campos do Hub sem lugar no modelo novo (oportunidade, concorrentes, riscos, hipótese-texto) foram preservados em "campos não mapeados" de cada stakeholder.'
    );
  }

  // registros[] → Evidência (rota → pilar, rótulo original preservado em fonteDetalhe)
  const registros = Array.isArray(o.registros) ? o.registros : [];
  for (const raw of registros) {
    const r = (raw ?? {}) as Record<string, unknown>;
    const rotaLabel = str(r.rota) || 'Logística';
    const mapa = ROTA_PARA_PILAR[rotaLabel] ?? {
      pilar: 'logistico' as Pilar,
      detalhe: `Registro de campo — ${rotaLabel}`,
    };
    evidencias.push({
      id: r.id ? String(r.id) : novoId(),
      createdAt: ts,
      updatedAt: ts,
      tipo: 'observacao',
      conteudo: str(r.texto ?? r.conteudo),
      pilar: mapa.pilar,
      fonte: 'observacao_campo',
      fonteDetalhe: mapa.detalhe,
      data: str(r.ts ?? r.data) || ts,
      confianca: 'media',
      origem: metaOrigem('campo_hub_v1', { rota_original: rotaLabel }),
    });
  }

  // entrevistas[] (opcional) → Evidência fonte 'entrevista'
  const entrevistas = Array.isArray(o.entrevistas) ? o.entrevistas : [];
  for (const raw of entrevistas) {
    const e = (raw ?? {}) as Record<string, unknown>;
    const respostas = Array.isArray(e.respostas) ? e.respostas : [];
    const conteudo = respostas
      .map((r, i) => (r ? `${i + 1}. ${str(r)}` : ''))
      .filter(Boolean)
      .join('\n');
    if (!conteudo) continue;
    evidencias.push({
      id: e.id ? String(e.id) : novoId(),
      createdAt: ts,
      updatedAt: ts,
      tipo: 'texto',
      conteudo,
      pilar: 'logistico',
      fonte: 'entrevista',
      fonteDetalhe: 'Entrevista (Hub Logístico)',
      data: str(e.ts ?? e.quando) || ts,
      stakeholderId: e.playerId ? String(e.playerId) : undefined,
      confianca: 'media',
      origem: metaOrigem('campo_hub_v1', {}),
    });
  }

  return { formato: 'campo_hub_v1', ativos, stakeholders, evidencias, hipoteses: [], avisos };
}

/** Ponto de entrada: recebe o objeto já parseado do JSON. */
export function importarCampo(dados: unknown): ResultadoImport {
  const formato = detectarFormato(dados);
  const o = (dados ?? {}) as Record<string, unknown>;
  if (formato === 'sb_masterplan_v1') return importarMasterplanV1(o);
  if (formato === 'campo_hub_v1') return importarHubV1(o);
  return { formato: 'desconhecido', ativos: [], stakeholders: [], evidencias: [], hipoteses: [], avisos: [] };
}

/** Preview (contagens + amostra) para exibir antes de confirmar. */
export function previewDoResultado(res: ResultadoImport): PreviewImport {
  return {
    formato: res.formato,
    rotuloFormato: ROTULO_FORMATO[res.formato],
    contagens: {
      ativos: res.ativos.length,
      stakeholders: res.stakeholders.length,
      evidencias: res.evidencias.length,
      hipoteses: res.hipoteses.length,
    },
    amostra: {
      ativos: res.ativos.slice(0, 3).map((a) => a.nome),
      stakeholders: res.stakeholders.slice(0, 3).map((s) => s.nome),
      evidencias: res.evidencias.slice(0, 3).map((e) => e.conteudo.slice(0, 60)),
    },
    avisos: res.avisos,
  };
}
