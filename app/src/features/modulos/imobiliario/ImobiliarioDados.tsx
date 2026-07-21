import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db/database';
import { salvarComparavel, apagarComparavel, comparavelEmBranco, salvarAtivo } from '../../../db/actions';
import { mediasPorTipo } from '../../../lib/calc/imobiliario';
import { EmptyState } from '../../../components/EmptyState';
import { CampoNumero } from '../../../components/CampoNumero';
import { BadgeSemFonte } from '../../../components/Badge';
import { useToast } from '../../../components/Toast';
import { fmtData } from '../../../lib/datas';
import { EvidenciasPanel } from '../EvidenciasPanel';
import type { ComparavelImobiliario, TipoAtivo, Ativo, CenariosUso } from '../../../models/types';

const TIPOS: { v: TipoAtivo; r: string }[] = [
  { v: 'galpao', r: 'Galpão' }, { v: 'terreno', r: 'Terreno' }, { v: 'loja', r: 'Loja' },
  { v: 'oficina', r: 'Oficina' }, { v: 'outro', r: 'Outro' },
];
const brl = (n: number | null) => n == null ? '—' : n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

/** Aba "Dados" do módulo 03 Imobiliário — comparáveis + R$/m² + cenários de uso. */
export function ImobiliarioDados() {
  const toast = useToast();
  const dados = useLiveQuery(async () => ({
    comparaveis: await db.comparaveis.toArray(),
    ativos: await db.ativos.toArray(),
  }));
  const [edit, setEdit] = useState<ComparavelImobiliario | null>(null);
  const [editCenario, setEditCenario] = useState<Ativo | null>(null);

  if (!dados) return <div className="panel">Carregando…</div>;
  const { comparaveis, ativos } = dados;
  const medias = mediasPorTipo(comparaveis);

  return (
    <div>
      <div className="panel">
        <div className="row-actions" style={{ justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0 }}>Comparáveis de mercado ({comparaveis.length})</h2>
          <button className="btn small" onClick={() => setEdit(comparavelEmBranco())}>+ Novo comparável</button>
        </div>
        <p style={{ color: 'var(--ink-soft)', marginTop: 4 }}>Imóveis pesquisados no mercado (anúncios, corretores). Servem para calcular o R$/m² médio da região.</p>
        {comparaveis.length === 0 ? (
          <EmptyState titulo="Nenhum comparável ainda">
            Pesquise imóveis parecidos à venda ou aluguel e registre aqui, sempre com a fonte. Com
            alguns comparáveis, o app calcula o R$/m² médio por tipo automaticamente.
          </EmptyState>
        ) : (
          <table>
            <thead><tr><th>Descrição</th><th>Tipo</th><th>m²</th><th>Preço</th><th>Aluguel</th><th>Fonte</th><th></th></tr></thead>
            <tbody>
              {comparaveis.map((c) => (
                <tr key={c.id}>
                  <td><b>{c.descricao || '(sem descrição)'}</b><br /><span style={{ color: 'var(--ink-soft)', fontSize: 11 }}>{fmtData(c.data)}</span></td>
                  <td>{TIPOS.find((t) => t.v === c.tipo)?.r}</td>
                  <td>{c.m2 ?? '—'}</td>
                  <td>{c.precoPedido ? brl(c.precoPedido) : '—'}</td>
                  <td>{c.aluguelMensal ? brl(c.aluguelMensal) : '—'}</td>
                  <td style={{ fontSize: 11 }}>{c.fonte || <BadgeSemFonte />}</td>
                  <td>
                    <div className="row-actions">
                      <button className="btn small secondary" onClick={() => setEdit(c)}>Editar</button>
                      <button className="btn small danger" onClick={async () => { if (confirm('Apagar?')) { await apagarComparavel(c.id); toast('Apagado'); } }}>×</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="panel">
        <h2>R$/m² médio por tipo</h2>
        <p style={{ color: 'var(--ink-soft)', marginTop: 0 }}>Calculado só com comparáveis que têm m² e preço. Sem dados, fica em branco (não inventamos número).</p>
        {medias.every((m) => m.precoM2Medio == null && m.aluguelM2Medio == null) ? (
          <div className="empty-state"><p>Registre comparáveis com m² e preço para ver as médias.</p></div>
        ) : (
          <table>
            <thead><tr><th>Tipo</th><th>R$/m² (venda)</th><th>R$/m² (aluguel)</th><th>Amostras</th></tr></thead>
            <tbody>
              {medias.map((m) => (
                <tr key={m.tipo}>
                  <td><b>{TIPOS.find((t) => t.v === m.tipo)?.r}</b></td>
                  <td>{m.precoM2Medio == null ? '—' : brl(m.precoM2Medio)}</td>
                  <td>{m.aluguelM2Medio == null ? '—' : brl(m.aluguelM2Medio)}</td>
                  <td>{m.amostras}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="panel">
        <h2>Cenários de uso por ativo</h2>
        <p style={{ color: 'var(--ink-soft)', marginTop: 0 }}>Para cada imóvel: alugar como está, reformar (retrofit), desenvolver ou vender — com prós e contras.</p>
        {ativos.length === 0 ? (
          <div className="empty-state"><p>Cadastre ativos no módulo 01 para desenhar cenários de uso.</p></div>
        ) : (
          <table>
            <thead><tr><th>Ativo</th><th>Cenários preenchidos</th><th></th></tr></thead>
            <tbody>
              {ativos.map((a) => {
                const c = a.cenariosUso;
                const preenchidos = c ? ['alugar', 'retrofit', 'desenvolvimento', 'venda'].filter((k) => (c as any)[k]?.pros || (c as any)[k]?.contras).length : 0;
                return (
                  <tr key={a.id}>
                    <td><b>{a.nome}</b></td>
                    <td>{preenchidos} de 4</td>
                    <td><button className="btn small secondary" onClick={() => setEditCenario(a)}>Editar cenários</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <EvidenciasPanel
        pilar="imobiliario"
        titulo="Evidências"
        ajuda="Fatos coletados sobre o mercado imobiliário local (visitas, corretores, anúncios, documentos). Vincule cada uma a uma hipótese para alimentar o funil da aba Discovery."
      />

      {edit && <ComparavelModal comparavel={edit} onFechar={() => setEdit(null)} />}
      {editCenario && <CenariosModal ativo={editCenario} onFechar={() => setEditCenario(null)} />}
    </div>
  );
}

function ComparavelModal({ comparavel, onFechar }: { comparavel: ComparavelImobiliario; onFechar: () => void }) {
  const toast = useToast();
  const [c, setC] = useState<ComparavelImobiliario>(comparavel);
  const [erro, setErro] = useState<string | null>(null);
  async function salvar() {
    if (!c.descricao.trim()) { setErro('Dê uma descrição ao comparável.'); return; }
    await salvarComparavel(c); toast('Comparável salvo'); onFechar();
  }
  return (
    <div className="modal-backdrop" onClick={onFechar}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>{comparavel.descricao ? 'Editar comparável' : 'Novo comparável'}</h3>
        <label>Descrição</label><input type="text" value={c.descricao} onChange={(e) => setC({ ...c, descricao: e.target.value })} />
        <div className="form-grid">
          <div><label>Tipo</label>
            <select value={c.tipo} onChange={(e) => setC({ ...c, tipo: e.target.value as TipoAtivo })}>{TIPOS.map((t) => <option key={t.v} value={t.v}>{t.r}</option>)}</select>
          </div>
          <div><label>Área (m²)</label><CampoNumero value={c.m2} vazio={undefined} onChange={(v) => setC({ ...c, m2: v })} /></div>
          <div><label>Preço pedido (venda, R$)</label><CampoNumero value={c.precoPedido} vazio={undefined} casas={2} onChange={(v) => setC({ ...c, precoPedido: v })} /></div>
          <div><label>Aluguel mensal (R$)</label><CampoNumero value={c.aluguelMensal} vazio={undefined} casas={2} onChange={(v) => setC({ ...c, aluguelMensal: v })} /></div>
        </div>
        <label>Fonte (obrigatório na prática)</label><input type="text" value={c.fonte} onChange={(e) => setC({ ...c, fonte: e.target.value })} placeholder="ex.: OLX, imobiliária X, corretor Y" />
        <label>Observação</label><textarea value={c.observacao ?? ''} onChange={(e) => setC({ ...c, observacao: e.target.value })} />
        {erro && <div className="alerta" style={{ marginTop: 12 }}>{erro}</div>}
        <div className="row-actions" style={{ marginTop: 16 }}>
          <button className="btn" onClick={salvar}>Salvar</button>
          <button className="btn ghost" onClick={onFechar}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

const CENARIOS: { k: keyof CenariosUso; r: string }[] = [
  { k: 'alugar', r: 'Alugar como está' }, { k: 'retrofit', r: 'Reformar (retrofit)' },
  { k: 'desenvolvimento', r: 'Desenvolver' }, { k: 'venda', r: 'Vender' },
];
function cenariosBase(): CenariosUso {
  return {
    alugar: { pros: '', contras: '' }, retrofit: { pros: '', contras: '' },
    desenvolvimento: { pros: '', contras: '' }, venda: { pros: '', contras: '' },
  };
}
function CenariosModal({ ativo, onFechar }: { ativo: Ativo; onFechar: () => void }) {
  const toast = useToast();
  const [cen, setCen] = useState<CenariosUso>(ativo.cenariosUso ?? cenariosBase());
  async function salvar() {
    await salvarAtivo({ ...ativo, cenariosUso: cen }); toast('Cenários salvos'); onFechar();
  }
  return (
    <div className="modal-backdrop" onClick={onFechar}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>Cenários de uso — {ativo.nome}</h3>
        {CENARIOS.map(({ k, r }) => (
          <div key={k} style={{ borderTop: '1px solid var(--line)', paddingTop: 8, marginTop: 8 }}>
            <b>{r}</b>
            <div className="form-grid">
              <div><label>Prós</label><textarea value={cen[k].pros} onChange={(e) => setCen({ ...cen, [k]: { ...cen[k], pros: e.target.value } })} style={{ minHeight: 50 }} /></div>
              <div><label>Contras</label><textarea value={cen[k].contras} onChange={(e) => setCen({ ...cen, [k]: { ...cen[k], contras: e.target.value } })} style={{ minHeight: 50 }} /></div>
            </div>
          </div>
        ))}
        <div className="row-actions" style={{ marginTop: 16 }}>
          <button className="btn" onClick={salvar}>Salvar</button>
          <button className="btn ghost" onClick={onFechar}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}
