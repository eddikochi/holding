import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import {
  salvarEvidencia, apagarEvidencia, evidenciaEmBranco, vincularEvidenciaAHipotese,
} from '../../db/actions';
import { EmptyState } from '../../components/EmptyState';
import { PontoConfianca } from '../../components/Badge';
import { useToast } from '../../components/Toast';
import { fmtData } from '../../lib/datas';
import { compararCodigo } from '../../lib/ordenar';
import { vinculosDe } from '../../models/types';
import type { Evidencia, Hipotese, Pilar, FonteEvidencia, Confianca, EfeitoVinculo } from '../../models/types';

const EFEITOS: { v: EfeitoVinculo; r: string }[] = [
  { v: 'sustenta', r: 'Sustenta' }, { v: 'refuta', r: 'Refuta' }, { v: 'neutro', r: 'Neutro' },
];

const FONTES: { v: FonteEvidencia; r: string }[] = [
  { v: 'entrevista', r: 'Entrevista' },
  { v: 'observacao_campo', r: 'Observação de campo' },
  { v: 'pesquisa_desk', r: 'Pesquisa desk' },
  { v: 'dado_oficial', r: 'Dado oficial' },
];

/** Rótulo estruturado de uma hipótese para os selects de vínculo: 'HIP-n · enunciado'. */
function rotuloHipotese(h: Hipotese): string {
  const nome = h.enunciado.slice(0, 36) || '(sem enunciado)';
  return h.codigo ? `${h.codigo} · ${nome}` : nome;
}

/**
 * Painel único de Evidências de um pilar, reutilizado por TODOS os diagnósticos.
 * Campos: Conteúdo, Tipo de fonte, Fonte específica (fonteDetalhe), Confiança e
 * vínculo à hipótese (no modal e via coluna "Vinculada a" na tabela).
 *
 * `fonteDetalhePadrao` pré-preenche o rótulo de origem (ex.: "Incentivo municipal").
 * Se `separarFatoEspeculacao`, agrupa por confiança: alta/média = "com fonte",
 * baixa = "a confirmar" (fato vs. especulação da spec do módulo Econômico).
 *
 * O vínculo evidência→hipótese oferece as hipóteses deste pilar (ambas carregam
 * `pilares: Pilar[]`). Cada vínculo tem efeito (sustenta/refuta/neutro).
 */
export function EvidenciasPanel({
  pilar,
  titulo,
  ajuda,
  fonteDetalhePadrao,
  separarFatoEspeculacao = false,
  rotuloItem = 'evidência',
}: {
  pilar: Pilar;
  titulo: string;
  ajuda: string;
  fonteDetalhePadrao?: string;
  separarFatoEspeculacao?: boolean;
  rotuloItem?: string;
}) {
  const toast = useToast();
  const evidencias = useLiveQuery(() => db.evidencias.where('pilares').equals(pilar).toArray(), [pilar]);
  const hipoteses = useLiveQuery(() => db.hipoteses.where('pilares').equals(pilar).toArray(), [pilar]);
  const [edit, setEdit] = useState<Evidencia | null>(null);

  if (!evidencias || !hipoteses) return <div className="panel">Carregando…</div>;

  function novo() {
    const e = evidenciaEmBranco(pilar);
    if (fonteDetalhePadrao) e.fonteDetalhe = fonteDetalhePadrao;
    setEdit(e);
  }

  function linha(e: Evidencia) {
    const v0 = vinculosDe(e)[0];
    return (
      <tr key={e.id}>
        <td style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-soft)', whiteSpace: 'nowrap' }}>{e.codigo ?? '—'}</td>
        <td style={{ maxWidth: 380 }}>
          <div className="txt-clamp">{e.conteudo}</div>
          <span style={{ color: 'var(--ink-soft)', fontSize: 11 }}>{e.fonteDetalhe ? e.fonteDetalhe + ' · ' : ''}{fmtData(e.data)}</span>
        </td>
        <td style={{ fontSize: 11 }}>{FONTES.find((f) => f.v === e.fonte)?.r}</td>
        <td style={{ textAlign: 'center' }}><PontoConfianca confianca={e.confianca} /></td>
        <td>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              value={v0?.hipoteseId ?? ''}
              onChange={async (ev) => { await vincularEvidenciaAHipotese(e.id, ev.target.value || undefined, v0?.efeito ?? 'sustenta'); toast('Vínculo atualizado'); }}
              style={{ fontSize: 12, padding: '4px 6px' }}
            >
              <option value="">— sem vínculo —</option>
              {hipoteses!.map((h) => <option key={h.id} value={h.id}>{rotuloHipotese(h)}</option>)}
            </select>
            {v0 && (
              <select
                className={`efeito-${v0.efeito}`}
                value={v0.efeito}
                title="Efeito desta evidência sobre a hipótese"
                onChange={async (ev) => { await vincularEvidenciaAHipotese(e.id, v0.hipoteseId, ev.target.value as EfeitoVinculo); toast('Efeito atualizado'); }}
                style={{ fontSize: 12, padding: '4px 6px', fontWeight: 700 }}
              >
                {EFEITOS.map((f) => <option key={f.v} value={f.v}>{f.r}</option>)}
              </select>
            )}
          </div>
        </td>
        <td>
          <div className="row-actions">
            <button className="btn small secondary" onClick={() => setEdit(e)}>Editar</button>
            <button className="btn small danger" onClick={async () => { if (confirm('Apagar?')) { await apagarEvidencia(e.id); toast('Apagado'); } }}>×</button>
          </div>
        </td>
      </tr>
    );
  }

  function tabela(lista: Evidencia[]) {
    const ordenada = [...lista].sort((a, b) => compararCodigo(a.codigo, b.codigo));
    return (
      <table>
        <thead><tr><th>Código</th><th>Conteúdo</th><th>Fonte</th><th style={{ textAlign: 'center' }}>Confiança</th><th>Vinculada a</th><th></th></tr></thead>
        <tbody>{ordenada.map(linha)}</tbody>
      </table>
    );
  }

  const comFonte = evidencias.filter((e) => e.confianca !== 'baixa');
  const aConfirmar = evidencias.filter((e) => e.confianca === 'baixa');

  return (
    <div className="panel">
      <div className="row-actions" style={{ justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>{titulo} ({evidencias.length})</h2>
        <button className="btn small" onClick={novo}>+ Adicionar</button>
      </div>
      <p style={{ color: 'var(--ink-soft)', marginTop: 4 }}>{ajuda}</p>

      {evidencias.length === 0 ? (
        <EmptyState titulo={`Nenhum registro ainda`}>
          Adicione o primeiro {rotuloItem}. Todo dado deve ter a fonte de onde veio — sem fonte,
          é palpite, não evidência. Vincule cada uma a uma hipótese para alimentar o funil (aba Discovery).
        </EmptyState>
      ) : separarFatoEspeculacao ? (
        <>
          <h3 style={{ color: 'var(--green)' }}>Com fonte / confirmado ({comFonte.length})</h3>
          {comFonte.length === 0 ? <p style={{ color: 'var(--ink-soft)', fontSize: 13 }}>Nada aqui ainda.</p> : tabela(comFonte)}
          <h3 style={{ color: 'var(--amber)', marginTop: 16 }}>A confirmar / especulação ({aConfirmar.length})</h3>
          {aConfirmar.length === 0 ? <p style={{ color: 'var(--ink-soft)', fontSize: 13 }}>Nada aqui ainda.</p> : tabela(aConfirmar)}
        </>
      ) : (
        tabela(evidencias)
      )}

      {edit && <EvidenciaModal evidencia={edit} hipoteses={hipoteses} rotuloItem={rotuloItem} onFechar={() => setEdit(null)} />}
    </div>
  );
}

function EvidenciaModal({ evidencia, hipoteses, rotuloItem, onFechar }: { evidencia: Evidencia; hipoteses: Hipotese[]; rotuloItem: string; onFechar: () => void }) {
  const toast = useToast();
  const [e, setE] = useState<Evidencia>(evidencia);
  const [erro, setErro] = useState<string | null>(null);
  async function salvar() {
    if (!e.conteudo.trim()) { setErro('Escreva o conteúdo.'); return; }
    await salvarEvidencia(e); toast('Salvo'); onFechar();
  }
  return (
    <div className="modal-backdrop" onClick={onFechar}>
      <div className="modal" onClick={(ev) => ev.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>{evidencia.conteudo ? 'Editar' : 'Nova'} {rotuloItem}</h3>
        <label>Conteúdo</label>
        <textarea value={e.conteudo} onChange={(ev) => setE({ ...e, conteudo: ev.target.value })} />
        <label>Fonte específica (de onde veio)</label>
        <input type="text" value={e.fonteDetalhe ?? ''} onChange={(ev) => setE({ ...e, fonteDetalhe: ev.target.value })} placeholder="ex.: IBGE 2022, corretor Fulano, prefeitura" />
        <div className="form-grid">
          <div><label>Tipo de fonte</label>
            <select value={e.fonte} onChange={(ev) => setE({ ...e, fonte: ev.target.value as FonteEvidencia })}>
              {FONTES.map((f) => <option key={f.v} value={f.v}>{f.r}</option>)}
            </select>
          </div>
          <div><label>Confiança</label>
            <select value={e.confianca} onChange={(ev) => setE({ ...e, confianca: ev.target.value as Confianca })}>
              <option value="alta">Alta (dado firme)</option>
              <option value="media">Média</option>
              <option value="baixa">Baixa (especulação / a confirmar)</option>
            </select>
          </div>
        </div>
        <label>Vincular à hipótese</label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            style={{ flex: 1, minWidth: 180 }}
            value={vinculosDe(e)[0]?.hipoteseId ?? ''}
            onChange={(ev) => setE({ ...e, vinculos: ev.target.value ? [{ hipoteseId: ev.target.value, efeito: vinculosDe(e)[0]?.efeito ?? 'sustenta' }] : [] })}
          >
            <option value="">— sem vínculo —</option>
            {hipoteses.map((h) => <option key={h.id} value={h.id}>{rotuloHipotese(h)}</option>)}
          </select>
          {vinculosDe(e)[0] && (
            <select
              className={`efeito-${vinculosDe(e)[0].efeito}`}
              style={{ fontWeight: 700 }}
              value={vinculosDe(e)[0].efeito}
              title="Efeito desta evidência sobre a hipótese"
              onChange={(ev) => setE({ ...e, vinculos: [{ hipoteseId: vinculosDe(e)[0].hipoteseId, efeito: ev.target.value as EfeitoVinculo }] })}
            >
              {EFEITOS.map((f) => <option key={f.v} value={f.v}>{f.r}</option>)}
            </select>
          )}
        </div>
        {erro && <div className="alerta" style={{ marginTop: 12 }}>{erro}</div>}
        <div className="row-actions" style={{ marginTop: 16 }}>
          <button className="btn" onClick={salvar}>Salvar</button>
          <button className="btn ghost" onClick={onFechar}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}
