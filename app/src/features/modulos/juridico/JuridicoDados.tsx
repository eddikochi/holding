import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db/database';
import { salvarAtivo } from '../../../db/actions';
import { EmptyState } from '../../../components/EmptyState';
import { useToast } from '../../../components/Toast';
import { fmtData } from '../../../lib/datas';
import { ITENS_JURIDICOS } from '../../../models/types';
import type { Ativo, ItemChecklistJuridico, StatusJuridico, ItemJuridicoChave } from '../../../models/types';

const STATUS: { v: StatusJuridico; r: string }[] = [
  { v: 'nao_iniciado', r: 'Não iniciado' },
  { v: 'em_andamento', r: 'Em andamento' },
  { v: 'ok', r: 'OK' },
  { v: 'pendencia', r: 'Pendência' },
  { v: 'nao_se_aplica', r: 'N/A' },
];
const ABREV: Record<StatusJuridico, string> = {
  nao_iniciado: '–', em_andamento: '⋯', ok: '✓', pendencia: '!', nao_se_aplica: 'n/a',
};
const HOLDING_NOTAS = 'juridico_holding_notas';

/** Aba "Dados" do módulo 02 Jurídico — matriz ativo × item, pendências, holding/SPE. */
export function JuridicoDados() {
  const toast = useToast();
  const ativos = useLiveQuery(() => db.ativos.toArray());
  const [edit, setEdit] = useState<{ ativo: Ativo; chave: ItemJuridicoChave } | null>(null);
  const [holdingNotas, setHoldingNotas] = useState('');

  useEffect(() => {
    db.config.get(HOLDING_NOTAS).then((c) => setHoldingNotas((c?.valor as string) ?? ''));
  }, []);

  if (!ativos) return <div className="panel">Carregando…</div>;

  function itemDe(a: Ativo, chave: ItemJuridicoChave): ItemChecklistJuridico {
    return a.checklistJuridico?.find((i) => i.chave === chave) ?? { chave, status: 'nao_iniciado', observacao: '', responsavel: '' };
  }

  const pendencias = ativos.flatMap((a) =>
    (a.checklistJuridico ?? [])
      .filter((i) => i.status === 'pendencia' || i.status === 'em_andamento')
      .map((i) => ({ ativo: a, item: i }))
  );

  return (
    <div>
      <div className="alerta">
        Este módulo organiza a informação jurídica, mas <b>não substitui o parecer de um advogado</b>.
        Use-o para saber o que perguntar e acompanhar pendências.
      </div>

      {ativos.length === 0 ? (
        <div className="panel">
          <EmptyState titulo="Cadastre ativos primeiro" acao={<span />}>
            A situação jurídica é avaliada por ativo. Vá ao módulo 01 Patrimonial e cadastre os
            imóveis (ou importe do campo); eles aparecerão aqui com o checklist dos 9 itens.
          </EmptyState>
        </div>
      ) : (
        <>
          <div className="panel">
            <h2>Matriz ativo × item jurídico</h2>
            <p style={{ color: 'var(--ink-soft)', marginTop: 0 }}>Clique numa célula para editar status, observação, responsável e prazo.</p>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Ativo</th>
                    {ITENS_JURIDICOS.map((it) => <th key={it.chave} style={{ writingMode: 'vertical-rl', height: 90 }}>{it.rotulo}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {ativos.map((a) => (
                    <tr key={a.id}>
                      <td><b>{a.nome || '(sem nome)'}</b></td>
                      {ITENS_JURIDICOS.map((it) => {
                        const item = itemDe(a, it.chave);
                        return (
                          <td key={it.chave} style={{ padding: 3 }}>
                            <div
                              className={`matriz-cell jur-${item.status}`}
                              title={`${it.rotulo}: ${STATUS.find((s) => s.v === item.status)?.r}`}
                              role="button"
                              tabIndex={0}
                              onClick={() => setEdit({ ativo: a, chave: it.chave })}
                              onKeyDown={(e) => { if (e.key === 'Enter') setEdit({ ativo: a, chave: it.chave }); }}
                            >
                              {ABREV[item.status]}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 8 }}>
              Legenda: <span className="matriz-cell jur-ok" style={{ display: 'inline-block', padding: '1px 6px' }}>✓ OK</span>{' '}
              <span className="matriz-cell jur-em_andamento" style={{ display: 'inline-block', padding: '1px 6px' }}>⋯ Em andamento</span>{' '}
              <span className="matriz-cell jur-pendencia" style={{ display: 'inline-block', padding: '1px 6px' }}>! Pendência</span>{' '}
              <span className="matriz-cell jur-nao_iniciado" style={{ display: 'inline-block', padding: '1px 6px' }}>– Não iniciado</span>
            </div>
          </div>

          <div className="panel">
            <h2>Pendências ({pendencias.length})</h2>
            {pendencias.length === 0 ? (
              <div className="alerta ok">Nenhuma pendência ou item em andamento no momento.</div>
            ) : (
              <table>
                <thead><tr><th>Ativo</th><th>Item</th><th>Status</th><th>Responsável</th><th>Prazo</th><th>Observação</th></tr></thead>
                <tbody>
                  {pendencias.map(({ ativo, item }) => (
                    <tr key={ativo.id + item.chave}>
                      <td><b>{ativo.nome}</b></td>
                      <td>{ITENS_JURIDICOS.find((i) => i.chave === item.chave)?.rotulo}</td>
                      <td><span className={`matriz-cell jur-${item.status}`} style={{ display: 'inline-block', padding: '2px 8px' }}>{STATUS.find((s) => s.v === item.status)?.r}</span></td>
                      <td>{item.responsavel || '—'}</td>
                      <td>{item.prazo ? fmtData(item.prazo) : '—'}</td>
                      <td style={{ fontSize: 12 }}>{item.observacao}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      <div className="panel">
        <h2>Holding / SPE</h2>
        <div className="form-grid">
          <div>
            <h4 style={{ marginBottom: 4 }}>A favor</h4>
            <ul style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 0 }}>
              <li>Organiza a sucessão e reduz conflito familiar</li>
              <li>Pode trazer eficiência tributária (depende do caso)</li>
              <li>Separa patrimônio pessoal do operacional</li>
            </ul>
          </div>
          <div>
            <h4 style={{ marginBottom: 4 }}>Contra / atenção</h4>
            <ul style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 0 }}>
              <li>Custo de constituição e manutenção</li>
              <li>Nem sempre vale a pena para poucos ativos</li>
              <li>Exige parecer contábil e jurídico específico</li>
            </ul>
          </div>
        </div>
        <label>Anotações da consulta com advogado / contador</label>
        <textarea
          value={holdingNotas}
          onChange={(e) => setHoldingNotas(e.target.value)}
          onBlur={async () => { await db.config.put({ chave: HOLDING_NOTAS, valor: holdingNotas }); toast('Anotações salvas'); }}
          placeholder="Registre aqui o que o profissional orientou. Este app não substitui parecer jurídico."
          style={{ minHeight: 100 }}
        />
      </div>

      {edit && <ItemModal ativo={edit.ativo} chave={edit.chave} onFechar={() => setEdit(null)} />}
    </div>
  );
}

function ItemModal({ ativo, chave, onFechar }: { ativo: Ativo; chave: ItemJuridicoChave; onFechar: () => void }) {
  const toast = useToast();
  const inicial = ativo.checklistJuridico?.find((i) => i.chave === chave) ?? { chave, status: 'nao_iniciado' as StatusJuridico, observacao: '', responsavel: '' };
  const [item, setItem] = useState<ItemChecklistJuridico>({ ...inicial });

  async function salvar() {
    const lista = ITENS_JURIDICOS.map((it) => {
      if (it.chave === chave) return item;
      return ativo.checklistJuridico?.find((i) => i.chave === it.chave) ?? { chave: it.chave, status: 'nao_iniciado' as StatusJuridico, observacao: '', responsavel: '' };
    });
    await salvarAtivo({ ...ativo, checklistJuridico: lista });
    toast('Item atualizado');
    onFechar();
  }

  return (
    <div className="modal-backdrop" onClick={onFechar}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>{ITENS_JURIDICOS.find((i) => i.chave === chave)?.rotulo} — {ativo.nome}</h3>
        <label>Status</label>
        <select value={item.status} onChange={(e) => setItem({ ...item, status: e.target.value as StatusJuridico })}>
          {STATUS.map((s) => <option key={s.v} value={s.v}>{s.r}</option>)}
        </select>
        <div className="form-grid">
          <div><label>Responsável</label><input type="text" value={item.responsavel} onChange={(e) => setItem({ ...item, responsavel: e.target.value })} /></div>
          <div><label>Prazo</label><input type="date" value={item.prazo ? item.prazo.slice(0, 10) : ''} onChange={(e) => setItem({ ...item, prazo: e.target.value ? new Date(e.target.value).toISOString() : undefined })} /></div>
        </div>
        <label>Observação</label>
        <textarea value={item.observacao} onChange={(e) => setItem({ ...item, observacao: e.target.value })} />
        <div className="row-actions" style={{ marginTop: 16 }}>
          <button className="btn" onClick={salvar}>Salvar</button>
          <button className="btn ghost" onClick={onFechar}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}
