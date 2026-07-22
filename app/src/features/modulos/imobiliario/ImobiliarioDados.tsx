import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db/database';
import { salvarComparavel, apagarComparavel, comparavelEmBranco, salvarAtivo } from '../../../db/actions';
import { EmptyState } from '../../../components/EmptyState';
import { CampoNumero } from '../../../components/CampoNumero';
import { TabelaAgrupadaMediana, type GrupoMediana } from '../../../components/TabelaAgrupadaMediana';
import { useToast } from '../../../components/Toast';
import { fmtData } from '../../../lib/datas';
import { EvidenciasPanel } from '../EvidenciasPanel';
import type { ComparavelImobiliario, TipoAtivo, Ativo, CenariosUso } from '../../../models/types';

const TIPOS: { v: TipoAtivo; r: string }[] = [
  { v: 'galpao', r: 'Galpão' }, { v: 'terreno', r: 'Terreno' }, { v: 'loja', r: 'Loja' },
  { v: 'oficina', r: 'Oficina' }, { v: 'outro', r: 'Outro' },
];
/** Rótulo plural por tipo, para os cabeçalhos de grupo. */
const TIPO_PLURAL: Record<TipoAtivo, string> = {
  galpao: 'Galpões', terreno: 'Terrenos', loja: 'Lojas', oficina: 'Oficinas', outro: 'Outros',
};
const TIPO_ORDEM: TipoAtivo[] = ['galpao', 'loja', 'terreno', 'oficina', 'outro'];

const brl = (n: number | null) => n == null ? '—' : n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

/** R$/m² de aluguel de um comparável (derivado em render, nunca persistido). 0 ≠ vazio. */
function rpmAluguel(c: ComparavelImobiliario): number | undefined {
  return c.m2 && c.m2 > 0 && c.aluguelMensal && c.aluguelMensal > 0 ? c.aluguelMensal / c.m2 : undefined;
}
/** "R$ 14,04/m²" — formato da métrica e da mediana. */
function fmtRpm(n: number): string {
  return `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/m²`;
}
/** Agrupa comparáveis por tipo (ordem fixa), só grupos não-vazios. */
function agruparPorTipo(comps: ComparavelImobiliario[]): GrupoMediana<ComparavelImobiliario>[] {
  return TIPO_ORDEM
    .map((t) => ({ rotulo: TIPO_PLURAL[t], registros: comps.filter((c) => c.tipo === t) }))
    .filter((g) => g.registros.length > 0);
}

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

  return (
    <div>
      <div className="panel">
        <div className="row-actions" style={{ justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0 }}>Comparáveis de mercado ({comparaveis.length})</h2>
          <button className="btn small" onClick={() => setEdit(comparavelEmBranco())}>+ Novo comparável</button>
        </div>
        <p style={{ color: 'var(--ink-soft)', marginTop: 4 }}>Imóveis pesquisados no mercado (anúncios, corretores). Servem para calcular o R$/m² médio da região.</p>
        <p style={{ color: 'var(--ink-soft)', marginTop: 0, fontSize: 12 }}>
          Ordenados por R$/m² de aluguel; a linha tracejada marca a mediana de cada tipo. Preço de venda não entra (vazio na pesquisa).
        </p>
        {comparaveis.length === 0 ? (
          <EmptyState titulo="Nenhum comparável ainda">
            Pesquise imóveis parecidos à venda ou aluguel e registre aqui, sempre com a fonte. Com
            alguns comparáveis, o app calcula o R$/m² mediano por tipo automaticamente.
          </EmptyState>
        ) : (
          <TabelaAgrupadaMediana
            grupos={agruparPorTipo(comparaveis)}
            metrica={rpmAluguel}
            formatMediana={fmtRpm}
            keyDe={(c) => c.id}
            rotuloSemMetrica={(n) => `${n} sem m² — não entram no cálculo`}
            primaria={(c) => (
              <div>
                <b>{c.descricao || '(sem descrição)'}</b>
                <div style={{ color: 'var(--ink-soft)', fontSize: 11 }}>
                  {[c.bairro, c.fonte || 'sem fonte', fmtData(c.data)].filter(Boolean).join(' · ')}
                </div>
              </div>
            )}
            colunas={[
              { celula: (c) => (c.m2 ? `${c.m2} m²` : '—') },
              { celula: (c) => (c.aluguelMensal ? `${brl(c.aluguelMensal)}/mês` : '—'), larguraMin: 96 },
              { celula: (c) => { const v = rpmAluguel(c); return v != null ? fmtRpm(v) : '—'; }, enfase: true },
            ]}
            acoes={(c) => (
              <div className="row-actions">
                <button className="btn small secondary" onClick={() => setEdit(c)}>Editar</button>
                <button className="btn small danger" onClick={async () => { if (confirm('Apagar?')) { await apagarComparavel(c.id); toast('Apagado'); } }}>×</button>
              </div>
            )}
          />
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
        <div className="form-grid">
          <div><label>Bairro</label><input type="text" value={c.bairro ?? ''} onChange={(e) => setC({ ...c, bairro: e.target.value || undefined })} placeholder="ex.: Paraboi" /></div>
          <div><label>Código (pesquisa)</label><input type="text" value={c.codigo ?? ''} onChange={(e) => setC({ ...c, codigo: e.target.value || undefined })} /></div>
        </div>
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
