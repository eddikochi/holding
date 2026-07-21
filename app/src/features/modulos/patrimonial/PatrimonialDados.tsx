import { useState, type ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db/database';
import { salvarAtivo, apagarAtivo, ativoEmBranco } from '../../../db/actions';
import { EmptyState } from '../../../components/EmptyState';
import { CampoNumero } from '../../../components/CampoNumero';
import { useToast } from '../../../components/Toast';
import { AtivosMapa } from './AtivosMapa';
import { EvidenciasPanel } from '../EvidenciasPanel';
import { novoId } from '../../../lib/ids';
import { PILARES } from '../../../models/types';
import type {
  Ativo, TipoAtivo, Pilar, Unidade, RelacaoUnidade,
  StatusVisitaAtivo, StatusVisitaUnidade, TipoRelacaoUnidade,
  RegistroImovel, ProprietarioAtivo, OcupacaoImovel,
  DocumentoRef, TipoDocumento,
} from '../../../models/types';

const TIPOS: { v: TipoAtivo; r: string }[] = [
  { v: 'galpao', r: 'Galpão' }, { v: 'terreno', r: 'Terreno' }, { v: 'loja', r: 'Loja' },
  { v: 'oficina', r: 'Oficina' }, { v: 'outro', r: 'Outro' },
];

const STATUS_ATIVO: { v: StatusVisitaAtivo; r: string }[] = [
  { v: 'a_visitar', r: 'A visitar' }, { v: 'visitado', r: 'Visitado' }, { v: 'parcial', r: 'Parcial' },
];
const STATUS_UNIDADE: { v: StatusVisitaUnidade; r: string }[] = [
  { v: 'a_visitar', r: 'A visitar' }, { v: 'visitado', r: 'Visitado' },
];
const TIPOS_RELACAO: { v: TipoRelacaoUnidade; r: string }[] = [
  { v: 'agua', r: 'Água' }, { v: 'energia', r: 'Energia' }, { v: 'acesso', r: 'Acesso' }, { v: 'outro', r: 'Outro' },
];
const OCUPACOES: { v: OcupacaoImovel; r: string }[] = [
  { v: 'locado', r: 'Locado' }, { v: 'vago', r: 'Vago' }, { v: 'uso_proprio', r: 'Uso próprio' },
  { v: 'cedido', r: 'Cedido' }, { v: 'irregular', r: 'Irregular' },
];
const TIPOS_DOC: { v: TipoDocumento; r: string }[] = [
  { v: 'matricula', r: 'Matrícula' }, { v: 'certidao', r: 'Certidão' }, { v: 'planta', r: 'Planta' },
  { v: 'contrato', r: 'Contrato' }, { v: 'foto', r: 'Foto' }, { v: 'inventario', r: 'Inventário' },
  { v: 'outro', r: 'Outro' },
];

function unidadeEmBranco(): Unidade {
  return { id: novoId(), nome: '', statusVisita: 'a_visitar' };
}

/** Verdadeiro se o registro tem qualquer campo preenchido (usado p/ derivar toggles). */
function registroTemValor(r?: RegistroImovel): boolean {
  return !!(r && (r.matricula || r.cartorio || r.inscricaoImobiliaria));
}

/**
 * Seção colapsável da ficha. Cabeçalho clicável + corpo. Estado aberto/fechado é
 * efêmero (não persiste). `resumo` aparece atenuado quando fechada (ajuda no mobile).
 */
function Secao({ titulo, resumo, defaultAberta = false, children }: {
  titulo: string; resumo?: string; defaultAberta?: boolean; children: ReactNode;
}) {
  const [aberta, setAberta] = useState(defaultAberta);
  return (
    <div style={{ border: '1px solid var(--line)', borderRadius: 'var(--r-panel)', marginTop: 'var(--s3)' }}>
      <button
        type="button"
        onClick={() => setAberta((v) => !v)}
        aria-expanded={aberta}
        style={{
          width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--s2)',
          background: 'transparent', border: 'none', padding: 'var(--s3)', cursor: 'pointer',
          color: 'var(--ink)', font: 'inherit', textAlign: 'left',
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 14 }}>{titulo}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ink-soft)', fontSize: 12, minWidth: 0 }}>
          {!aberta && resumo && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{resumo}</span>}
          <span aria-hidden style={{ flex: 'none' }}>{aberta ? '▾' : '▸'}</span>
        </span>
      </button>
      {aberta && (
        <div style={{ padding: '0 var(--s3) var(--s3)', borderTop: '1px solid var(--line)' }}>
          <div style={{ marginTop: 'var(--s3)' }}>{children}</div>
        </div>
      )}
    </div>
  );
}

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

      <EvidenciasPanel
        pilar="patrimonial"
        titulo="Evidências"
        ajuda="Fatos e registros sobre os imóveis (vistorias, fotos, documentos, observações de campo). Vincule cada um a uma hipótese para alimentar o funil da aba Discovery."
      />

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
  /** Fecha a ficha; se há alterações não salvas, pede confirmação antes de descartar. */
  const sujo = JSON.stringify(a) !== JSON.stringify(ativo);
  function tentarFechar() {
    if (sujo && !confirm('Você tem alterações não salvas nesta ficha. Fechar agora descarta tudo. Deseja sair mesmo assim?')) return;
    onFechar();
  }
  function setMetragem(campo: 'terrenoM2' | 'construidaM2' | 'peDireitoM', v: number | undefined) {
    setA({ ...a, metragens: { ...a.metragens, [campo]: v } });
  }
  function setPotencial(p: Pilar, v: string) {
    setA({ ...a, potencialPorPilar: { ...a.potencialPorPilar, [p]: v } });
  }

  return (
    <div className="modal-backdrop" onClick={tentarFechar}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>{ativo.nome ? 'Editar ativo' : 'Novo ativo'}</h3>
        <Secao titulo="Identificação" defaultAberta>
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
            <div><label>Terreno (m²)</label><CampoNumero placeholder="deixe em branco se não souber" value={a.metragens.terrenoM2} vazio={undefined} onChange={(v) => setMetragem('terrenoM2', v)} /></div>
            <div><label>Construída (m²)</label><CampoNumero placeholder="deixe em branco se não souber" value={a.metragens.construidaM2} vazio={undefined} onChange={(v) => setMetragem('construidaM2', v)} /></div>
            <div><label>Pé direito (m)</label><CampoNumero placeholder="deixe em branco se não souber" value={a.metragens.peDireitoM} vazio={undefined} onChange={(v) => setMetragem('peDireitoM', v)} /></div>
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
          <div className="form-grid">
            <div><label>Status de visita</label>
              <select value={a.statusVisita ?? 'a_visitar'} onChange={(e) => setA({ ...a, statusVisita: e.target.value as StatusVisitaAtivo })}>
                {STATUS_ATIVO.map((s) => <option key={s.v} value={s.v}>{s.r}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 400, textTransform: 'none', cursor: 'pointer' }}>
                <input type="checkbox" checked={!!a.ehSubdividido} onChange={(e) => setA({ ...a, ehSubdividido: e.target.checked })} style={{ width: 'auto' }} />
                Prédio subdividido em unidades locáveis
              </label>
            </div>
          </div>
        </Secao>

        <Secao titulo="Ocupação" defaultAberta>
          <div className="form-grid">
            <div><label>Ocupação</label>
              <select value={a.ocupacao ?? ''} onChange={(e) => setA({ ...a, ocupacao: e.target.value ? e.target.value as OcupacaoImovel : undefined })}>
                <option value="">— não informado —</option>
                {OCUPACOES.map((o) => <option key={o.v} value={o.v}>{o.r}</option>)}
              </select>
            </div>
            <div><label>Valor de aluguel (R$)</label><CampoNumero value={a.valorAluguel} vazio={undefined} casas={2} onChange={(v) => setA({ ...a, valorAluguel: v })} /></div>
          </div>
          <label>Situação jurídica (resumo)</label><input type="text" value={a.situacaoJuridicaResumo} onChange={(e) => setA({ ...a, situacaoJuridicaResumo: e.target.value })} />
        </Secao>

        <Secao titulo="Registro &amp; valores" resumo={a.registro?.matricula ? `matrícula ${a.registro.matricula}` : 'vazio'}>
          <label style={{ marginTop: 0 }}>Registro do imóvel</label>
          <RegistroFields valor={a.registro} onChange={(registro) => setA({ ...a, registro })} />
          <label style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 400, textTransform: 'none', cursor: 'pointer' }}>
            <input type="checkbox" checked={!!a.foreiro} onChange={(e) => setA({ ...a, foreiro: e.target.checked || undefined })} style={{ width: 'auto' }} />
            Imóvel foreiro (enfiteuse)
          </label>
          {a.foreiro && (
            <div><label>Senhorio / titular do domínio direto (a quem se paga o foro)</label>
              <input type="text" placeholder="ex.: Município de São Borja" value={a.enfiteuta ?? ''} onChange={(e) => setA({ ...a, enfiteuta: e.target.value || undefined })} />
            </div>
          )}
          <div className="form-grid">
            <div><label>Valor de partilha (R$)</label><CampoNumero value={a.valorPartilha} vazio={undefined} casas={2} onChange={(v) => setA({ ...a, valorPartilha: v })} /></div>
            <div><label>Avaliação fiscal / venal (R$)</label><CampoNumero value={a.valorAvaliacaoFiscal} vazio={undefined} casas={2} onChange={(v) => setA({ ...a, valorAvaliacaoFiscal: v })} /></div>
          </div>
          <label>Fonte dos valores</label>
          <input type="text" value={a.fonteValores ?? ''} onChange={(e) => setA({ ...a, fonteValores: e.target.value || undefined })} />
        </Secao>

        <Secao titulo={`Proprietários${a.proprietarios && a.proprietarios.length ? ` (${a.proprietarios.length})` : ''}`}>
          <ProprietariosEditor proprietarios={a.proprietarios} onChange={(proprietarios) => setA({ ...a, proprietarios })} />
        </Secao>

        <Secao titulo={`Documentos${a.documentos && a.documentos.length ? ` (${a.documentos.length})` : ''}`}>
          <DocumentosEditor documentos={a.documentos} onChange={(documentos) => setA({ ...a, documentos })} />
        </Secao>

        {a.ehSubdividido && (
          <Secao titulo={`Unidades (${(a.unidades ?? []).length})`}>
            <UnidadesEditor unidades={a.unidades ?? []} onChange={(unidades) => setA({ ...a, unidades })} />
          </Secao>
        )}

        <Secao titulo="Potencial por pilar">
          <p style={{ color: 'var(--ink-soft)', fontSize: 12, margin: '0 0 8px' }}>Deixe em branco se não se aplica.</p>
          <div className="form-grid">
            {PILARES.map((p) => (
              <div key={p.chave}>
                <label style={{ fontWeight: 400, textTransform: 'none' }}>{p.rotulo}</label>
                <input type="text" value={a.potencialPorPilar[p.chave] ?? ''} onChange={(e) => setPotencial(p.chave, e.target.value)} />
              </div>
            ))}
          </div>
        </Secao>
        {erro && <div className="alerta" style={{ marginTop: 12 }}>{erro}</div>}
        <div className="row-actions" style={{ marginTop: 16 }}>
          <button className="btn" onClick={salvar}>Salvar</button>
          <button className="btn ghost" onClick={tentarFechar}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

/** Lista editável de unidades locáveis de um ativo subdividido. */
function UnidadesEditor({ unidades, onChange }: { unidades: Unidade[]; onChange: (u: Unidade[]) => void }) {
  function atualizar(id: string, patch: Partial<Unidade>) {
    onChange(unidades.map((u) => (u.id === id ? { ...u, ...patch } : u)));
  }
  function remover(id: string) {
    // ao remover uma unidade, limpa relações de outras unidades que a referenciavam
    const restantes = unidades
      .filter((u) => u.id !== id)
      .map((u) =>
        u.relacoes
          ? { ...u, relacoes: u.relacoes.map((r) => (r.alvoUnidadeId === id ? { ...r, alvoUnidadeId: undefined } : r)) }
          : u
      );
    onChange(restantes);
  }
  function adicionar() {
    onChange([...unidades, unidadeEmBranco()]);
  }

  return (
    <div>
      <div className="row-actions" style={{ justifyContent: 'flex-end', alignItems: 'center' }}>
        <button type="button" className="btn small secondary" onClick={adicionar}>+ Adicionar unidade</button>
      </div>
      <p style={{ color: 'var(--ink-soft)', fontSize: 12, margin: '4px 0 0' }}>
        As unidades só são gravadas quando você clica em Salvar no final desta ficha.
      </p>
      {unidades.length === 0 && (
        <p style={{ color: 'var(--ink-soft)', fontSize: 13, marginTop: 6 }}>
          Nenhuma unidade ainda. Adicione as lojas/salas locáveis deste prédio.
        </p>
      )}
      {unidades.map((u, i) => (
        <UnidadeCard
          key={u.id}
          indice={i}
          unidade={u}
          outras={unidades.filter((o) => o.id !== u.id)}
          onChange={(patch) => atualizar(u.id, patch)}
          onRemover={() => remover(u.id)}
        />
      ))}
    </div>
  );
}

/** Ficha de uma unidade: campos próprios + potencial por pilar + relações físicas. */
function UnidadeCard({
  indice, unidade: u, outras, onChange, onRemover,
}: {
  indice: number;
  unidade: Unidade;
  outras: Unidade[];
  onChange: (patch: Partial<Unidade>) => void;
  onRemover: () => void;
}) {
  // Toggle derivado: começa ligado se a unidade já tem algum dado de registro.
  const [registroAberto, setRegistroAberto] = useState(() => registroTemValor(u.registro));
  function setMetragem(campo: 'construidaM2' | 'peDireitoM', v: number | undefined) {
    onChange({ metragens: { ...u.metragens, [campo]: v } });
  }
  function setPotencial(p: Pilar, v: string) {
    onChange({ potencialPorPilar: { ...u.potencialPorPilar, [p]: v } });
  }
  const relacoes = u.relacoes ?? [];
  function setRelacao(idx: number, patch: Partial<RelacaoUnidade>) {
    onChange({ relacoes: relacoes.map((r, i) => (i === idx ? { ...r, ...patch } : r)) });
  }
  function addRelacao() {
    onChange({ relacoes: [...relacoes, { tipo: 'energia', descricao: '' }] });
  }
  function removerRelacao(idx: number) {
    onChange({ relacoes: relacoes.filter((_, i) => i !== idx) });
  }
  const nomeExibicao = u.nome.trim() || `Unidade ${indice + 1}`;
  function confirmarRemover() {
    if (confirm(`Remover a unidade "${nomeExibicao}"? Locatário, contato, estado e relações desta unidade serão apagados. Esta ação não pode ser desfeita.`)) {
      onRemover();
    }
  }

  return (
    <div style={{ border: '1px solid var(--line)', borderRadius: 'var(--r-panel)', padding: 'var(--s3)', marginTop: 'var(--s2)' }}>
      <div className="row-actions" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <b style={{ fontSize: 13 }}>{nomeExibicao}</b>
        <button type="button" className="btn small danger" onClick={confirmarRemover}>Remover</button>
      </div>
      <div className="form-grid">
        <div><label>Nome</label><input type="text" value={u.nome} onChange={(e) => onChange({ nome: e.target.value })} /></div>
        <div><label>Status de visita</label>
          <select value={u.statusVisita} onChange={(e) => onChange({ statusVisita: e.target.value as StatusVisitaUnidade })}>
            {STATUS_UNIDADE.map((s) => <option key={s.v} value={s.v}>{s.r}</option>)}
          </select>
        </div>
        <div><label>Locatário</label><input type="text" value={u.locatario ?? ''} onChange={(e) => onChange({ locatario: e.target.value || undefined })} /></div>
        <div><label>Contato</label><input type="text" value={u.contato ?? ''} onChange={(e) => onChange({ contato: e.target.value || undefined })} /></div>
        <div><label>Ocupação</label>
          <select value={u.ocupacao ?? ''} onChange={(e) => onChange({ ocupacao: e.target.value ? e.target.value as OcupacaoImovel : undefined })}>
            <option value="">— não informado —</option>
            {OCUPACOES.map((o) => <option key={o.v} value={o.v}>{o.r}</option>)}
          </select>
        </div>
        <div><label>Valor de aluguel (R$)</label><CampoNumero value={u.valorAluguel} vazio={undefined} casas={2} onChange={(v) => onChange({ valorAluguel: v })} /></div>
        <div><label>Construída (m²)</label><CampoNumero placeholder="deixe em branco se não souber" value={u.metragens?.construidaM2} vazio={undefined} onChange={(v) => setMetragem('construidaM2', v)} /></div>
        <div><label>Pé direito (m)</label><CampoNumero placeholder="deixe em branco se não souber" value={u.metragens?.peDireitoM} vazio={undefined} onChange={(v) => setMetragem('peDireitoM', v)} /></div>
      </div>
      <label>Estado físico</label>
      <textarea value={u.estadoFisico ?? ''} onChange={(e) => onChange({ estadoFisico: e.target.value || undefined })} />
      <label style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 400, textTransform: 'none', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={registroAberto}
          onChange={(e) => {
            if (e.target.checked) { setRegistroAberto(true); }
            else { setRegistroAberto(false); onChange({ registro: undefined }); }
          }}
          style={{ width: 'auto' }}
        />
        Esta unidade tem matrícula própria
      </label>
      {registroAberto && (
        <>
          <label style={{ fontWeight: 400, textTransform: 'none' }}>Registro da unidade</label>
          <RegistroFields valor={u.registro} onChange={(registro) => onChange({ registro })} />
        </>
      )}
      <Secao titulo="Avançado (jurídico, documentos, potencial, relações)">
        <label style={{ marginTop: 0 }}>Situação jurídica (resumo)</label>
        <input type="text" value={u.situacaoJuridicaResumo ?? ''} onChange={(e) => onChange({ situacaoJuridicaResumo: e.target.value || undefined })} />
        <label style={{ marginTop: 12 }}>Documentos (links)</label>
        <DocumentosEditor documentos={u.documentos} onChange={(documentos) => onChange({ documentos })} />
        <label style={{ marginTop: 12 }}>Potencial por pilar da unidade (deixe em branco se não se aplica)</label>
        <div className="form-grid">
          {PILARES.map((p) => (
            <div key={p.chave}>
              <label style={{ fontWeight: 400, textTransform: 'none' }}>{p.rotulo}</label>
              <input type="text" value={u.potencialPorPilar?.[p.chave] ?? ''} onChange={(e) => setPotencial(p.chave, e.target.value)} />
            </div>
          ))}
        </div>
        <div className="row-actions" style={{ justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
          <label style={{ margin: 0 }}>Relações físicas com outras unidades</label>
          <button type="button" className="btn small secondary" onClick={addRelacao}>+ Relação</button>
        </div>
        {relacoes.length === 0 && (
          <p style={{ color: 'var(--ink-soft)', fontSize: 12, marginTop: 6 }}>
            Ex.: “recebe energia da U3”, “água unificada do prédio”, “transição vedada com parede”.
          </p>
        )}
        {relacoes.map((r, idx) => (
          <div key={idx} className="form-grid" style={{ alignItems: 'end' }}>
            <div><label>Tipo</label>
              <select value={r.tipo} onChange={(e) => setRelacao(idx, { tipo: e.target.value as TipoRelacaoUnidade })}>
                {TIPOS_RELACAO.map((t) => <option key={t.v} value={t.v}>{t.r}</option>)}
              </select>
            </div>
            <div><label>Unidade alvo (opcional)</label>
              <select value={r.alvoUnidadeId ?? ''} onChange={(e) => setRelacao(idx, { alvoUnidadeId: e.target.value || undefined })}>
                <option value="">— prédio / genérica —</option>
                {outras.map((o) => <option key={o.id} value={o.id}>{o.nome.trim() || 'Unidade sem nome'}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8, alignItems: 'end' }}>
              <div style={{ flex: 1 }}><label>Descrição</label><input type="text" value={r.descricao} onChange={(e) => setRelacao(idx, { descricao: e.target.value })} /></div>
              <button type="button" className="btn small danger" onClick={() => removerRelacao(idx)}>×</button>
            </div>
          </div>
        ))}
      </Secao>
    </div>
  );
}

/** Trio de campos de identificação registral, reutilizado no ativo e na unidade. */
function RegistroFields({ valor, onChange }: { valor?: RegistroImovel; onChange: (r: RegistroImovel) => void }) {
  const r = valor ?? {};
  const set = (campo: keyof RegistroImovel, v: string) => onChange({ ...r, [campo]: v || undefined });
  return (
    <div className="form-grid">
      <div><label style={{ fontWeight: 400, textTransform: 'none' }}>Matrícula</label><input type="text" value={r.matricula ?? ''} onChange={(e) => set('matricula', e.target.value)} /></div>
      <div><label style={{ fontWeight: 400, textTransform: 'none' }}>Cartório / RI</label><input type="text" value={r.cartorio ?? ''} onChange={(e) => set('cartorio', e.target.value)} /></div>
      <div><label style={{ fontWeight: 400, textTransform: 'none' }}>Inscrição imobiliária (IPTU)</label><input type="text" value={r.inscricaoImobiliaria ?? ''} onChange={(e) => set('inscricaoImobiliaria', e.target.value)} /></div>
    </div>
  );
}

/** Lista editável de proprietários (nome + % de participação). Só no ativo. */
function ProprietariosEditor({ proprietarios, onChange }: { proprietarios?: ProprietarioAtivo[]; onChange: (p: ProprietarioAtivo[]) => void }) {
  const lista = proprietarios ?? [];
  function atualizar(i: number, patch: Partial<ProprietarioAtivo>) {
    onChange(lista.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  }
  function remover(i: number) { onChange(lista.filter((_, idx) => idx !== i)); }
  function adicionar() { onChange([...lista, { nome: '' }]); }
  function setPercentual(i: number, v: number | undefined) {
    atualizar(i, { percentual: v });
  }
  const soma = lista.reduce((s, p) => s + (p.percentual ?? 0), 0);
  return (
    <div>
      {lista.length === 0 && (
        <p style={{ color: 'var(--ink-soft)', fontSize: 13, marginTop: 4 }}>
          Nenhum proprietário informado. Adicione quem detém o imóvel e, se souber, o percentual.
        </p>
      )}
      {lista.map((p, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'end', marginTop: 6 }}>
          <div style={{ flex: 1 }}><label style={{ fontWeight: 400, textTransform: 'none' }}>Nome</label><input type="text" value={p.nome} onChange={(e) => atualizar(i, { nome: e.target.value })} /></div>
          <div style={{ width: 120 }}><label style={{ fontWeight: 400, textTransform: 'none' }}>Participação (%)</label><CampoNumero value={p.percentual} vazio={undefined} onChange={(v) => setPercentual(i, v)} /></div>
          <button type="button" className="btn small danger" onClick={() => remover(i)}>×</button>
        </div>
      ))}
      <div className="row-actions" style={{ justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
        <button type="button" className="btn small secondary" onClick={adicionar}>+ Proprietário</button>
        {lista.length > 0 && (
          <span style={{ fontSize: 12, color: soma === 100 ? 'var(--ink-soft)' : 'var(--amber)' }}>
            Soma: {soma}%{soma !== 100 ? ' (≠ 100)' : ''}
          </span>
        )}
      </div>
    </div>
  );
}

/** Lista editável de documentos externos (título + URL + tipo). Reutilizado no ativo e na unidade. */
function DocumentosEditor({ documentos, onChange }: { documentos?: DocumentoRef[]; onChange: (d: DocumentoRef[]) => void }) {
  const lista = documentos ?? [];
  function atualizar(i: number, patch: Partial<DocumentoRef>) {
    onChange(lista.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));
  }
  function remover(i: number) { onChange(lista.filter((_, idx) => idx !== i)); }
  function adicionar() { onChange([...lista, { titulo: '', url: '' }]); }

  return (
    <div>
      {lista.length === 0 && (
        <p style={{ color: 'var(--ink-soft)', fontSize: 13, marginTop: 4 }}>
          Nenhum documento vinculado. Adicione um link (Drive/nuvem) — o arquivo mora fora do app.
        </p>
      )}
      {lista.map((d, i) => (
        <div key={i} style={{ border: '1px solid var(--line)', borderRadius: 'var(--r-panel)', padding: 'var(--s3)', marginTop: 'var(--s2)' }}>
          <div className="form-grid">
            <div><label style={{ fontWeight: 400, textTransform: 'none' }}>Título</label><input type="text" value={d.titulo} onChange={(e) => atualizar(i, { titulo: e.target.value })} /></div>
            <div><label style={{ fontWeight: 400, textTransform: 'none' }}>Tipo</label>
              <select value={d.tipo ?? ''} onChange={(e) => atualizar(i, { tipo: e.target.value ? e.target.value as TipoDocumento : undefined })}>
                <option value="">— tipo —</option>
                {TIPOS_DOC.map((t) => <option key={t.v} value={t.v}>{t.r}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'end' }}>
            <div style={{ flex: 1 }}><label style={{ fontWeight: 400, textTransform: 'none' }}>URL (link do arquivo)</label><input type="text" placeholder="https://…" value={d.url} onChange={(e) => atualizar(i, { url: e.target.value })} /></div>
            <button type="button" className="btn small danger" onClick={() => remover(i)}>×</button>
          </div>
        </div>
      ))}
      <div style={{ marginTop: 8 }}>
        <button type="button" className="btn small secondary" onClick={adicionar}>+ Documento</button>
      </div>
    </div>
  );
}
