import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db/database';
import {
  salvarBusinessCase, apagarBusinessCase, businessCaseEmBranco,
} from '../../../db/actions';
import { resumoFinanceiro, linhasSemFonte } from '../../../lib/calc/financeiro';
import { PageHeader } from '../../../components/PageHeader';
import { EmptyState } from '../../../components/EmptyState';
import { BadgeSemFonte } from '../../../components/Badge';
import { novoId } from '../../../lib/ids';
import type { BusinessCase, LinhaFinanceira, DecisaoBC } from '../../../models/types';

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const DECISOES: { v: DecisaoBC; r: string; cls: string }[] = [
  { v: 'go', r: 'Seguir (go)', cls: 'st-validada' },
  { v: 'aguardar', r: 'Aguardar', cls: 'st-parcial' },
  { v: 'no_go', r: 'Não seguir (no-go)', cls: 'st-refutada' },
];

/** Módulo 10 — lista de business cases + editor por seções. */
export function BusinessCasesView() {
  const bcs = useLiveQuery(() => db.businessCases.toArray());
  const [abrindo, setAbrindo] = useState<string | null>(null);

  if (!bcs) return <div className="panel">Carregando…</div>;
  const aberto = bcs.find((b) => b.id === abrindo);

  if (aberto) {
    return <BusinessCaseEditor bc={aberto} onVoltar={() => setAbrindo(null)} />;
  }

  return (
    <div>
      <PageHeader
        kicker="Módulo 10"
        titulo="Business Cases"
        descricao="A oportunidade se paga? Aprofunde as prioritárias com números e cada premissa à mostra. Transparência acima de sofisticação."
        acoes={<button className="btn" onClick={async () => { const bc = businessCaseEmBranco('Novo business case'); await salvarBusinessCase(bc); setAbrindo(bc.id); }}>+ Novo business case</button>}
      />

      {bcs.length === 0 ? (
        <div className="panel">
          <EmptyState titulo="Nenhum business case ainda">
            Crie um aqui, ou promova uma oportunidade priorizada (módulo 09 → "Promover a BC").
            Cada business case guia você por resumo, modelo, números e uma decisão go/no-go.
          </EmptyState>
        </div>
      ) : (
        <div className="grid-modulos">
          {bcs.map((bc) => {
            const r = resumoFinanceiro(bc);
            const dec = DECISOES.find((d) => d.v === bc.decisao);
            return (
              <div key={bc.id} className="modulo-card" style={{ cursor: 'pointer' }} onClick={() => setAbrindo(bc.id)}>
                <div className="mnome" style={{ marginBottom: 6 }}>{bc.nome}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                  CAPEX {brl(r.capexTotal)} · payback {r.paybackMeses == null ? '—' : `${Math.round(r.paybackMeses)} meses`}
                </div>
                {dec && <span className={`badge ${dec.cls}`} style={{ marginTop: 8, display: 'inline-block' }}>{dec.r}</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function BusinessCaseEditor({ bc, onVoltar }: { bc: BusinessCase; onVoltar: () => void }) {
  const [b, setB] = useState<BusinessCase>(bc);
  const r = resumoFinanceiro(b);

  async function salvar(prox: BusinessCase) {
    setB(prox);
    await salvarBusinessCase(prox);
  }
  function tabelaSetter(campo: 'capex' | 'opex' | 'receitas') {
    return {
      add: () => salvar({ ...b, [campo]: [...b[campo], { id: novoId(), descricao: '', valor: null, fontePremissa: '' } as LinhaFinanceira] }),
      upd: (id: string, patch: Partial<LinhaFinanceira>) => salvar({ ...b, [campo]: b[campo].map((l) => l.id === id ? { ...l, ...patch } : l) }),
      del: (id: string) => salvar({ ...b, [campo]: b[campo].filter((l) => l.id !== id) }),
    };
  }

  return (
    <div>
      <PageHeader
        kicker="Business case"
        titulo={b.nome}
        acoes={
          <>
            <button className="btn ghost" onClick={onVoltar}>← Voltar</button>
            <button className="btn danger" onClick={async () => { if (confirm('Apagar este business case?')) { await apagarBusinessCase(b.id); onVoltar(); } }}>Apagar</button>
          </>
        }
      />

      <div className="panel">
        <label>Nome</label>
        <input type="text" value={b.nome} onChange={(e) => setB({ ...b, nome: e.target.value })} onBlur={() => salvar(b)} />
        <label>Resumo executivo</label>
        <textarea value={b.resumoExecutivo} onChange={(e) => setB({ ...b, resumoExecutivo: e.target.value })} onBlur={() => salvar(b)} />
        <label>Modelo de negócio</label>
        <textarea value={b.modeloNegocio} onChange={(e) => setB({ ...b, modeloNegocio: e.target.value })} onBlur={() => salvar(b)} />
        <label>Premissas</label>
        <textarea value={b.premissas} onChange={(e) => setB({ ...b, premissas: e.target.value })} onBlur={() => salvar(b)} />
      </div>

      <TabelaFinanceira titulo="CAPEX (investimento inicial)" linhas={b.capex} {...tabelaSetter('capex')} />
      <TabelaFinanceira titulo="OPEX (custo mensal)" linhas={b.opex} {...tabelaSetter('opex')} />
      <TabelaFinanceira titulo="Receitas (mensal)" linhas={b.receitas} {...tabelaSetter('receitas')} />

      <div className="panel">
        <h2>Resultado</h2>
        <div className="kpi-row">
          <div className="kpi-box"><div className="n">{brl(r.capexTotal)}</div><div className="l">CAPEX total</div></div>
          <div className="kpi-box"><div className="n">{brl(r.lucroMensal)}</div><div className="l">lucro mensal (rec. − opex)</div></div>
          <div className="kpi-box"><div className="n">{r.paybackMeses == null ? '—' : `${Math.round(r.paybackMeses)}`}</div><div className="l">meses de payback</div></div>
        </div>
        {r.paybackMeses == null && (
          <p style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
            Payback fica em branco enquanto o lucro mensal não for positivo ou não houver CAPEX — não mostramos número que não se sustenta.
          </p>
        )}
      </div>

      <div className="panel">
        <h2>Cenários</h2>
        {(['pessimista', 'realista', 'otimista'] as const).map((c) => (
          <div key={c} style={{ borderTop: '1px solid var(--line)', paddingTop: 8, marginTop: 8 }}>
            <b style={{ textTransform: 'capitalize' }}>{c}</b>
            <div className="form-grid">
              <div><label>Receita anual (R$)</label>
                <input type="text" value={b.cenarios[c].receitaAnual ?? ''} onChange={(e) => { const v = e.target.value === '' ? null : parseFloat(e.target.value.replace(',', '.')); setB({ ...b, cenarios: { ...b.cenarios, [c]: { ...b.cenarios[c], receitaAnual: isNaN(v as number) ? null : v } } }); }} onBlur={() => salvar(b)} />
              </div>
              <div><label>Premissas</label>
                <input type="text" value={b.cenarios[c].premissas} onChange={(e) => setB({ ...b, cenarios: { ...b.cenarios, [c]: { ...b.cenarios[c], premissas: e.target.value } } })} onBlur={() => salvar(b)} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="panel">
        <h2>Riscos e decisão</h2>
        <label>Riscos</label>
        <textarea value={b.riscos} onChange={(e) => setB({ ...b, riscos: e.target.value })} onBlur={() => salvar(b)} />
        <label>Decisão</label>
        <select value={b.decisao ?? ''} onChange={(e) => salvar({ ...b, decisao: (e.target.value || undefined) as DecisaoBC })}>
          <option value="">— ainda não decidido —</option>
          {DECISOES.map((d) => <option key={d.v} value={d.v}>{d.r}</option>)}
        </select>
      </div>
    </div>
  );
}

function TabelaFinanceira({ titulo, linhas, add, upd, del }: {
  titulo: string;
  linhas: LinhaFinanceira[];
  add: () => void;
  upd: (id: string, patch: Partial<LinhaFinanceira>) => void;
  del: (id: string) => void;
}) {
  const total = linhas.reduce((s, l) => s + (l.valor ?? 0), 0);
  const semFonte = linhasSemFonte(linhas);
  return (
    <div className="panel">
      <div className="row-actions" style={{ justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>{titulo}</h2>
        <button className="btn small" onClick={add}>+ Linha</button>
      </div>
      {linhas.length === 0 ? (
        <p style={{ color: 'var(--ink-soft)', fontSize: 13 }}>Nenhuma linha. Cada valor precisa de uma fonte/premissa ao lado.</p>
      ) : (
        <table>
          <thead><tr><th>Descrição</th><th>Valor (R$)</th><th>Fonte / premissa</th><th></th></tr></thead>
          <tbody>
            {linhas.map((l) => (
              <tr key={l.id}>
                <td><input type="text" value={l.descricao} onChange={(e) => upd(l.id, { descricao: e.target.value })} /></td>
                <td><input type="text" value={l.valor ?? ''} onChange={(e) => { const v = e.target.value === '' ? null : parseFloat(e.target.value.replace(',', '.')); upd(l.id, { valor: isNaN(v as number) ? null : v }); }} style={{ width: 110 }} /></td>
                <td>
                  <input type="text" value={l.fontePremissa} onChange={(e) => upd(l.id, { fontePremissa: e.target.value })} placeholder="de onde vem esse número?" />
                  {l.valor != null && !l.fontePremissa.trim() && <div style={{ marginTop: 2 }}><BadgeSemFonte /></div>}
                </td>
                <td><button className="btn small danger" onClick={() => del(l.id)}>×</button></td>
              </tr>
            ))}
            <tr><td><b>Total</b></td><td><b>{brl(total)}</b></td><td>{semFonte > 0 && <span style={{ color: 'var(--amber)', fontSize: 12 }}>{semFonte} valor(es) sem fonte</span>}</td><td></td></tr>
          </tbody>
        </table>
      )}
    </div>
  );
}
