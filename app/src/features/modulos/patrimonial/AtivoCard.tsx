import { useState } from 'react';
import { PILARES } from '../../../models/types';
import type { Ativo, TipoAtivo, OcupacaoImovel } from '../../../models/types';

/*
 * Cartão de LEITURA de um ativo do pilar Patrimonial (piloto do padrão escaneável).
 * Só leitura — nenhum campo é editado aqui. "Editar" reabre o AtivoModal existente.
 * Não renomeia nem grava nada: apenas reorganiza a hierarquia visual em 3 camadas.
 *
 * Camada 1 (topo, nunca colapsa): badges tipo+ocupação, nome+endereço, 3 âncoras
 *   numéricas e a faixa de status de enfiteuse (sempre presente).
 * Camada 2 (inline, discreto): resumo das unidades quando subdividido.
 * Camada 3 ("Detalhes do imóvel", sanfona fechada): cadastro raro de consultar.
 */

const ROTULO_TIPO: Record<TipoAtivo, string> = {
  galpao: 'Galpão', terreno: 'Terreno', loja: 'Loja', oficina: 'Oficina', outro: 'Outro',
};

const ROTULO_OCUPACAO: Record<OcupacaoImovel, string> = {
  locado: 'Locado', vago: 'Vago', uso_proprio: 'Uso próprio', cedido: 'Cedido', irregular: 'Irregular',
};

const ROTULO_STATUS_VISITA: Record<string, string> = {
  a_visitar: 'A visitar', visitado: 'Visitado', parcial: 'Parcial',
};

/* ── Formatação de números (arredondada; sempre pt-BR) ─────────────────── */

/** "R$ 726 mil" / "R$ 1,2 mi" — curto e arredondado, para as âncoras do topo. 0 ≠ vazio (0 vira "—"). */
function reaisCurto(v: number | undefined): string | null {
  if (v == null || v === 0) return null;
  const abs = Math.abs(v);
  if (abs >= 1_000_000) {
    return `R$ ${(v / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mi`;
  }
  if (abs >= 1_000) {
    // abaixo de 10 mil, 1 casa evita distorção (R$ 8.500 → "8,5 mil", não "9 mil").
    const casas = abs < 10_000 ? 1 : 0;
    return `R$ ${(v / 1_000).toLocaleString('pt-BR', { maximumFractionDigits: casas })} mil`;
  }
  return `R$ ${Math.round(v).toLocaleString('pt-BR')}`;
}

/** "R$ 726.300,00" completo, para o bloco Detalhes. 0 ≠ vazio (0 vira null → "—"). */
function reaisCompleto(v: number | undefined): string | null {
  if (v == null || v === 0) return null;
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/** "656 m²" arredondado, ou null. 0/ausente → null (nunca "0 m²"). */
function areaM2(v: number | undefined): string | null {
  if (v == null || v === 0) return null;
  return `${Math.round(v).toLocaleString('pt-BR')} m²`;
}

/** Número físico/monetário só quando positivo; 0 e ausente contam como vazio. */
function positivo(v: number | undefined): number | undefined {
  return v != null && v > 0 ? v : undefined;
}

/* ── Derivações das âncoras ────────────────────────────────────────────── */

/** Área âncora contextual por tipo, com fallback para a outra métrica. */
function areaAncora(a: Ativo): { label: string; valor: number | undefined } {
  const t = positivo(a.metragens.terrenoM2);
  const c = positivo(a.metragens.construidaM2);
  // terreno/galpão priorizam terreno; loja/oficina priorizam construída; outro = o que existir.
  const preferirTerreno =
    a.tipo === 'terreno' || a.tipo === 'galpao' || (a.tipo === 'outro' && t != null);
  if (preferirTerreno) {
    if (t != null) return { label: 'Área do terreno', valor: t };
    if (c != null) return { label: 'Área construída', valor: c };
    return { label: 'Área do terreno', valor: undefined };
  }
  if (c != null) return { label: 'Área construída', valor: c };
  if (t != null) return { label: 'Área do terreno', valor: t };
  return { label: 'Área construída', valor: undefined };
}

/** Aluguel âncora: soma das unidades quando subdividido; senão o do ativo. 0 ≠ vazio. */
function aluguelAncora(a: Ativo): { label: string; valor: number | undefined } {
  if (a.ehSubdividido) {
    const us = a.unidades ?? [];
    const comValor = us.filter((u) => positivo(u.valorAluguel) != null);
    return {
      label: `Aluguel / mês (${us.length} un.)`,
      // soma ignora undefined; se nenhuma unidade tem aluguel, fica vazio (não 0).
      valor: comValor.length ? comValor.reduce((s, u) => s + (u.valorAluguel as number), 0) : undefined,
    };
  }
  return { label: 'Aluguel / mês', valor: a.valorAluguel };
}

type EstadoEnfiteuse = 'resgatada' | 'pendente' | 'nao_avaliado';

/**
 * Estado da enfiteuse lido EXCLUSIVAMENTE do campo explícito `statusDominio`.
 * Nunca inferido de texto livre (evita verde falso). undefined / 'nao_avaliada' → cinza.
 * A faixa NUNCA some: vazio = cinza, não ausência.
 */
function estadoEnfiteuse(a: Ativo): { estado: EstadoEnfiteuse; rotulo: string } {
  switch (a.statusDominio) {
    case 'resgatada':
      return { estado: 'resgatada', rotulo: 'Enfiteuse resgatada' };
    case 'pendente':
      return { estado: 'pendente', rotulo: 'Enfiteuse não resgatada · foro/laudêmio pendente' };
    default:
      return { estado: 'nao_avaliado', rotulo: 'Situação de domínio não avaliada' };
  }
}

/* ── Sub-componentes visuais ───────────────────────────────────────────── */

/** Badge genérico com tom do design system (soft bg + cor). */
function Badge({ texto, bg, cor, borda }: { texto: string; bg: string; cor: string; borda?: string }) {
  return (
    <span
      className="badge"
      style={{ background: bg, color: cor, borderColor: borda ?? 'transparent' }}
    >
      {texto}
    </span>
  );
}

function BadgeTipo({ tipo }: { tipo: TipoAtivo }) {
  return <Badge texto={ROTULO_TIPO[tipo] ?? tipo} bg="var(--blue-soft)" cor="var(--blue)" borda="var(--blue-border)" />;
}

function BadgeOcupacao({ ocupacao }: { ocupacao?: OcupacaoImovel }) {
  if (!ocupacao) return null;
  const tom =
    ocupacao === 'locado' ? { bg: 'var(--green-soft)', cor: 'var(--green)', borda: 'transparent' }
    : ocupacao === 'irregular' ? { bg: 'var(--amber-soft)', cor: 'var(--amber)', borda: 'transparent' }
    : { bg: 'var(--neutral-soft)', cor: 'var(--ink-soft)', borda: 'var(--line)' };
  return <Badge texto={ROTULO_OCUPACAO[ocupacao]} bg={tom.bg} cor={tom.cor} borda={tom.borda} />;
}

/** Uma das 3 âncoras numéricas do topo. Valor ausente → "—" atenuado (0 ≠ vazio). */
function Ancora({ label, valor }: { label: string; valor: string | null }) {
  return (
    <div style={{ minWidth: 110 }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.3px', color: 'var(--ink-soft)' }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: valor ? 'var(--ink)' : 'var(--line)', marginTop: 2 }}>
        {valor ?? '—'}
      </div>
    </div>
  );
}

/** Faixa de status de enfiteuse — sempre presente, cor conforme o estado. */
function FaixaEnfiteuse({ ativo }: { ativo: Ativo }) {
  const { estado, rotulo } = estadoEnfiteuse(ativo);
  const tom =
    estado === 'resgatada' ? { bg: 'var(--green-soft)', cor: 'var(--green)', icone: '✓' }
    : estado === 'pendente' ? { bg: 'var(--amber-soft)', cor: 'var(--amber)', icone: '▲' }
    : { bg: 'var(--neutral-soft)', cor: 'var(--ink-soft)', icone: '○' };
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: tom.bg, color: tom.cor,
        borderLeft: `3px solid ${tom.cor}`, borderRadius: 4,
        padding: '6px 10px', marginTop: 'var(--s3)', fontSize: 12.5, fontWeight: 600,
      }}
    >
      <span aria-hidden style={{ flex: 'none' }}>{tom.icone}</span>
      <span>{rotulo}</span>
    </div>
  );
}

/** Camada 2 — mini-linhas das unidades de um prédio subdividido. */
function UnidadesResumo({ ativo }: { ativo: Ativo }) {
  const us = ativo.unidades ?? [];
  if (us.length === 0) {
    return (
      <p style={{ color: 'var(--ink-soft)', fontSize: 12.5, margin: 'var(--s3) 0 0' }}>
        Prédio subdividido — nenhuma unidade cadastrada ainda.
      </p>
    );
  }
  return (
    <div style={{ marginTop: 'var(--s3)', display: 'flex', flexDirection: 'column', gap: 4 }}>
      {us.map((u) => {
        const partes = [
          u.nome.trim() || 'Unidade sem nome',
          u.locatario?.trim(),
          reaisCompleto(u.valorAluguel),
        ].filter(Boolean);
        return (
          <div key={u.id} style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>
            {partes.join(' · ')}
          </div>
        );
      })}
    </div>
  );
}

/** Linha de Detalhes (Camada 3). Só renderiza quando há valor. */
function DetalheLinha({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  if (children == null || children === '' || (Array.isArray(children) && children.length === 0)) return null;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: 8, padding: '4px 0', fontSize: 12.5 }}>
      <div style={{ color: 'var(--ink-soft)', fontWeight: 600 }}>{rotulo}</div>
      <div style={{ color: 'var(--ink)', minWidth: 0, wordBreak: 'break-word' }}>{children}</div>
    </div>
  );
}

/** Camada 3 — bloco colapsável "Detalhes do imóvel" (cadastro raro). */
function Detalhes({ ativo: a }: { ativo: Ativo }) {
  const [aberta, setAberta] = useState(false);
  const potenciais = PILARES.filter((p) => a.potencialPorPilar[p.chave]);
  const outraArea = areaAncora(a).label === 'Área do terreno'
    ? { rotulo: 'Área construída', valor: areaM2(a.metragens.construidaM2) }
    : { rotulo: 'Área do terreno', valor: areaM2(a.metragens.terrenoM2) };

  return (
    <div style={{ borderTop: '1px solid var(--line)', marginTop: 'var(--s3)', paddingTop: 'var(--s2)' }}>
      <button
        type="button"
        onClick={() => setAberta((v) => !v)}
        aria-expanded={aberta}
        style={{
          width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'transparent', border: 'none', padding: '4px 0', cursor: 'pointer',
          color: 'var(--ink-soft)', font: 'inherit', fontSize: 12.5, fontWeight: 600, textAlign: 'left',
        }}
      >
        <span>Detalhes do imóvel</span>
        <span aria-hidden>{aberta ? '▾' : '▸'}</span>
      </button>
      {aberta && (
        <div style={{ marginTop: 'var(--s2)' }}>
          <DetalheLinha rotulo="Endereço">{a.endereco || null}</DetalheLinha>
          <DetalheLinha rotulo="Coordenadas">{a.lat != null ? `${a.lat}, ${a.lng ?? ''}` : null}</DetalheLinha>
          <DetalheLinha rotulo="Pé direito">{positivo(a.metragens.peDireitoM) != null ? `${Math.round(a.metragens.peDireitoM as number)} m` : null}</DetalheLinha>
          <DetalheLinha rotulo={outraArea.rotulo}>{outraArea.valor}</DetalheLinha>
          <DetalheLinha rotulo="Estado físico">{a.estadoFisico || null}</DetalheLinha>
          <DetalheLinha rotulo="Status de visita">{a.statusVisita ? ROTULO_STATUS_VISITA[a.statusVisita] : null}</DetalheLinha>
          <DetalheLinha rotulo="Situação jurídica">{a.situacaoJuridicaResumo || null}</DetalheLinha>
          <DetalheLinha rotulo="Foreiro / enfiteuse">
            {a.foreiro ? (a.enfiteuta ? `Sim — senhorio: ${a.enfiteuta}` : 'Sim') : null}
          </DetalheLinha>
          <DetalheLinha rotulo="Matrícula">{a.registro?.matricula || null}</DetalheLinha>
          <DetalheLinha rotulo="Cartório / RI">{a.registro?.cartorio || null}</DetalheLinha>
          <DetalheLinha rotulo="Inscrição (IPTU)">{a.registro?.inscricaoImobiliaria || null}</DetalheLinha>
          <DetalheLinha rotulo="Avaliação fiscal">{reaisCompleto(a.valorAvaliacaoFiscal)}</DetalheLinha>
          <DetalheLinha rotulo="Valor de partilha">{reaisCompleto(a.valorPartilha)}</DetalheLinha>
          {!a.ehSubdividido && <DetalheLinha rotulo="Aluguel / mês">{reaisCompleto(a.valorAluguel)}</DetalheLinha>}
          <DetalheLinha rotulo="Fonte dos valores">{a.fonteValores || null}</DetalheLinha>
          <DetalheLinha rotulo="Proprietários">
            {a.proprietarios && a.proprietarios.length
              ? a.proprietarios.map((p) => `${p.nome}${positivo(p.percentual) != null ? ` (${p.percentual}%)` : ''}`).join(' · ')
              : null}
          </DetalheLinha>
          <DetalheLinha rotulo="Potencial por pilar">
            {potenciais.length
              ? potenciais.map((p) => `${p.rotulo}: ${a.potencialPorPilar[p.chave]}`).join(' · ')
              : null}
          </DetalheLinha>
          <DetalheLinha rotulo="Documentos">
            {a.documentos && a.documentos.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {a.documentos.map((d, i) => (
                  <a key={i} href={d.url} target="_blank" rel="noreferrer" style={{ color: 'var(--blue)' }}>
                    {d.titulo || d.url}
                  </a>
                ))}
              </div>
            ) : null}
          </DetalheLinha>
        </div>
      )}
    </div>
  );
}

/* ── Cartão ────────────────────────────────────────────────────────────── */

export function AtivoCard({ ativo, onEditar, onApagar }: {
  ativo: Ativo;
  onEditar: () => void;
  onApagar: () => void;
}) {
  const a = ativo;
  const area = areaAncora(a);
  const aluguel = aluguelAncora(a);

  return (
    <div
      style={{
        border: '1px solid var(--line)', borderRadius: 'var(--r-panel)',
        background: 'var(--panel-2)', padding: 'var(--s4)', marginTop: 'var(--s3)',
      }}
    >
      {/* linha de badges + ações */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--s2)', flexWrap: 'wrap' }}>
        <div className="row-actions">
          <BadgeTipo tipo={a.tipo} />
          <BadgeOcupacao ocupacao={a.ocupacao} />
        </div>
        <div className="row-actions">
          <button className="btn small secondary" onClick={onEditar}>Editar</button>
          <button className="btn small danger" onClick={onApagar} aria-label={`Apagar ${a.nome}`}>×</button>
        </div>
      </div>

      {/* nome + endereço */}
      <div style={{ marginTop: 'var(--s3)' }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink)' }}>{a.nome || '(sem nome)'}</div>
        {a.endereco && (
          <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {a.endereco}
          </div>
        )}
      </div>

      {/* 3 âncoras (empilham no mobile) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 'var(--s3)', marginTop: 'var(--s3)' }}>
        <Ancora label="Avaliação fiscal" valor={reaisCurto(a.valorAvaliacaoFiscal)} />
        <Ancora label={aluguel.label} valor={reaisCurto(aluguel.valor)} />
        <Ancora label={area.label} valor={areaM2(area.valor)} />
      </div>

      {/* faixa de enfiteuse — sempre presente */}
      <FaixaEnfiteuse ativo={a} />

      {/* Camada 2 — unidades quando subdividido */}
      {a.ehSubdividido && <UnidadesResumo ativo={a} />}

      {/* Camada 3 — Detalhes */}
      <Detalhes ativo={a} />
    </div>
  );
}
