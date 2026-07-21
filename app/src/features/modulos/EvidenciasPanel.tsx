import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import {
  salvarEvidencia, apagarEvidencia, evidenciaEmBranco, vincularEvidenciaAHipotese,
} from '../../db/actions';
import { EmptyState } from '../../components/EmptyState';
import { BadgeConfianca } from '../../components/Badge';
import { useToast } from '../../components/Toast';
import { fmtData } from '../../lib/datas';
import type { Evidencia, Hipotese, Pilar, FonteEvidencia, Confianca } from '../../models/types';

const FONTES: { v: FonteEvidencia; r: string }[] = [
  { v: 'entrevista', r: 'Entrevista' },
  { v: 'observacao_campo', r: 'Observação de campo' },
  { v: 'pesquisa_desk', r: 'Pesquisa desk' },
  { v: 'dado_oficial', r: 'Dado oficial' },
];

/** Rótulo curto de uma hipótese para os selects de vínculo. */
function rotuloHipotese(h: Hipotese): string {
  return h.enunciado.slice(0, 40) || '(sem enunciado)';
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
 * O vínculo evidência→hipótese é sempre do MESMO pilar: só hipóteses deste pilar
 * são oferecidas (evidência e hipótese carregam `pilar`; não há cruzamento).
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
  const evidencias = useLiveQuery(() => db.evidencias.where('pilar').equals(pilar).toArray(), [pilar]);
  const hipoteses = useLiveQuery(() => db.hipoteses.where('pilar').equals(pilar).toArray(), [pilar]);
  const [edit, setEdit] = useState<Evidencia | null>(null);

  if (!evidencias || !hipoteses) return <div className="panel">Carregando…</div>;

  function novo() {
    const e = evidenciaEmBranco(pilar);
    if (fonteDetalhePadrao) e.fonteDetalhe = fonteDetalhePadrao;
    setEdit(e);
  }

  function linha(e: Evidencia) {
    return (
      <tr key={e.id}>
        <td>{e.conteudo}<br /><span style={{ color: 'var(--ink-soft)', fontSize: 11 }}>{e.fonteDetalhe ? e.fonteDetalhe + ' · ' : ''}{fmtData(e.data)}</span></td>
        <td style={{ fontSize: 11 }}>{FONTES.find((f) => f.v === e.fonte)?.r}</td>
        <td><BadgeConfianca confianca={e.confianca} /></td>
        <td>
          <select
            value={e.hipoteseId ?? ''}
            onChange={async (ev) => { await vincularEvidenciaAHipotese(e.id, ev.target.value || undefined); toast('Vínculo atualizado'); }}
            style={{ fontSize: 12, padding: '4px 6px' }}
          >
            <option value="">— sem vínculo —</option>
            {hipoteses!.map((h) => <option key={h.id} value={h.id}>{rotuloHipotese(h)}</option>)}
          </select>
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
    return (
      <table>
        <thead><tr><th>Conteúdo</th><th>Fonte</th><th>Confiança</th><th>Vinculada a</th><th></th></tr></thead>
        <tbody>{lista.map(linha)}</tbody>
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
        <select value={e.hipoteseId ?? ''} onChange={(ev) => setE({ ...e, hipoteseId: ev.target.value || undefined })}>
          <option value="">— sem vínculo —</option>
          {hipoteses.map((h) => <option key={h.id} value={h.id}>{rotuloHipotese(h)}</option>)}
        </select>
        {erro && <div className="alerta" style={{ marginTop: 12 }}>{erro}</div>}
        <div className="row-actions" style={{ marginTop: 16 }}>
          <button className="btn" onClick={salvar}>Salvar</button>
          <button className="btn ghost" onClick={onFechar}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}
