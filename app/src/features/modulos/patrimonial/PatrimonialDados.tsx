import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db/database';
import { salvarAtivo, apagarAtivo, ativoEmBranco } from '../../../db/actions';
import { EmptyState } from '../../../components/EmptyState';
import { useToast } from '../../../components/Toast';
import { AtivosMapa } from './AtivosMapa';
import { PILARES } from '../../../models/types';
import type { Ativo, TipoAtivo, Pilar } from '../../../models/types';

const TIPOS: { v: TipoAtivo; r: string }[] = [
  { v: 'galpao', r: 'Galpão' }, { v: 'terreno', r: 'Terreno' }, { v: 'loja', r: 'Loja' },
  { v: 'oficina', r: 'Oficina' }, { v: 'outro', r: 'Outro' },
];

/** Aba "Dados" do módulo 01 Patrimonial — inventário de ativos + ficha + potencial por pilar. */
export function PatrimonialDados() {
  const toast = useToast();
  const ativos = useLiveQuery(() => db.ativos.toArray());
  const [edit, setEdit] = useState<Ativo | null>(null);

  if (!ativos) return <div className="panel">Carregando…</div>;

  return (
    <div>
      <div className="panel">
        <div className="row-actions" style={{ justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0 }}>Inventário de ativos ({ativos.length})</h2>
          <button className="btn small" onClick={() => setEdit(ativoEmBranco())}>+ Novo ativo</button>
        </div>
        {ativos.length === 0 ? (
          <EmptyState titulo="Nenhum ativo cadastrado">
            Comece cadastrando os imóveis da família (galpão, terrenos, loja, oficina) ou importe da
            ferramenta de campo. Cada ativo vira uma ficha usada por todos os outros diagnósticos.
          </EmptyState>
        ) : (
          <table>
            <thead><tr><th>Nome</th><th>Tipo</th><th>Endereço</th><th>Área</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              {ativos.map((a) => (
                <tr key={a.id}>
                  <td><b>{a.nome || '(sem nome)'}</b></td>
                  <td>{TIPOS.find((t) => t.v === a.tipo)?.r ?? a.tipo}</td>
                  <td>{a.endereco}</td>
                  <td>{a.metragens.construidaM2 ? `${a.metragens.construidaM2} m²` : a.metragens.terrenoM2 ? `${a.metragens.terrenoM2} m² (terreno)` : '—'}</td>
                  <td style={{ fontSize: 11, color: 'var(--ink-soft)', maxWidth: 180 }}>{(a.estadoFisico || '').slice(0, 60)}</td>
                  <td>
                    <div className="row-actions">
                      <button className="btn small secondary" onClick={() => setEdit(a)}>Editar</button>
                      <button className="btn small danger" onClick={async () => { if (confirm(`Apagar "${a.nome}"?`)) { await apagarAtivo(a.id); toast('Ativo apagado'); } }}>×</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="panel">
        <h2>Potencial por pilar</h2>
        <p style={{ color: 'var(--ink-soft)', marginTop: 0 }}>
          Onde cada ativo pode gerar oportunidade. Resumo do que você anotou na ficha de cada um.
        </p>
        {ativos.length === 0 ? (
          <div className="empty-state"><p>Cadastre ativos para ver o resumo de potencial.</p></div>
        ) : (
          <table>
            <thead><tr><th>Ativo</th>{PILARES.map((p) => <th key={p.chave}>{p.rotulo}</th>)}</tr></thead>
            <tbody>
              {ativos.map((a) => (
                <tr key={a.id}>
                  <td><b>{a.nome || '(sem nome)'}</b></td>
                  {PILARES.map((p) => (
                    <td key={p.chave} style={{ fontSize: 11 }}>
                      {a.potencialPorPilar[p.chave] ? '●' : <span style={{ color: 'var(--line)' }}>—</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="panel">
        <h2>Mapa dos ativos</h2>
        <p style={{ color: 'var(--ink-soft)', marginTop: 0 }}>Ativos com lat/lng plotados sobre o OpenStreetMap. Sem internet, vira lista automaticamente.</p>
        <AtivosMapa ativos={ativos} />
      </div>

      {edit && <AtivoModal ativo={edit} onFechar={() => setEdit(null)} />}
    </div>
  );
}

function AtivoModal({ ativo, onFechar }: { ativo: Ativo; onFechar: () => void }) {
  const toast = useToast();
  const [a, setA] = useState<Ativo>(ativo);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar() {
    if (!a.nome.trim()) { setErro('Preencha o nome do ativo.'); return; }
    await salvarAtivo(a); toast('Ativo salvo'); onFechar();
  }
  function setMetragem(campo: 'terrenoM2' | 'construidaM2' | 'peDireitoM', v: string) {
    const n = v === '' ? undefined : parseFloat(v.replace(',', '.'));
    setA({ ...a, metragens: { ...a.metragens, [campo]: isNaN(n as number) ? undefined : n } });
  }
  function setPotencial(p: Pilar, v: string) {
    setA({ ...a, potencialPorPilar: { ...a.potencialPorPilar, [p]: v } });
  }

  return (
    <div className="modal-backdrop" onClick={onFechar}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>{ativo.nome ? 'Editar ativo' : 'Novo ativo'}</h3>
        <div className="form-grid">
          <div><label>Nome</label><input type="text" value={a.nome} onChange={(e) => setA({ ...a, nome: e.target.value })} /></div>
          <div><label>Tipo</label>
            <select value={a.tipo} onChange={(e) => setA({ ...a, tipo: e.target.value as TipoAtivo })}>
              {TIPOS.map((t) => <option key={t.v} value={t.v}>{t.r}</option>)}
            </select>
          </div>
        </div>
        <label>Endereço</label><input type="text" value={a.endereco} onChange={(e) => setA({ ...a, endereco: e.target.value })} />
        <div className="form-grid">
          <div><label>Terreno (m²)</label><input type="text" value={a.metragens.terrenoM2 ?? ''} onChange={(e) => setMetragem('terrenoM2', e.target.value)} /></div>
          <div><label>Construída (m²)</label><input type="text" value={a.metragens.construidaM2 ?? ''} onChange={(e) => setMetragem('construidaM2', e.target.value)} /></div>
          <div><label>Pé direito (m)</label><input type="text" value={a.metragens.peDireitoM ?? ''} onChange={(e) => setMetragem('peDireitoM', e.target.value)} /></div>
          <div><label>Lat, Lng (opcional)</label>
            <input type="text" placeholder="-28.66, -56.00"
              value={a.lat != null ? `${a.lat}, ${a.lng ?? ''}` : ''}
              onChange={(e) => {
                const [la, ln] = e.target.value.split(',').map((x) => parseFloat(x.trim()));
                setA({ ...a, lat: isNaN(la) ? undefined : la, lng: isNaN(ln) ? undefined : ln });
              }} />
          </div>
        </div>
        <label>Estado físico</label><textarea value={a.estadoFisico} onChange={(e) => setA({ ...a, estadoFisico: e.target.value })} />
        <label>Situação jurídica (resumo)</label><input type="text" value={a.situacaoJuridicaResumo} onChange={(e) => setA({ ...a, situacaoJuridicaResumo: e.target.value })} />
        <label style={{ marginTop: 16 }}>Potencial por pilar (deixe em branco se não se aplica)</label>
        <div className="form-grid">
          {PILARES.map((p) => (
            <div key={p.chave}>
              <label style={{ fontWeight: 400, textTransform: 'none' }}>{p.rotulo}</label>
              <input type="text" value={a.potencialPorPilar[p.chave] ?? ''} onChange={(e) => setPotencial(p.chave, e.target.value)} />
            </div>
          ))}
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
