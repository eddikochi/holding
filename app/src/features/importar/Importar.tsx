import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../db/database';
import {
  importarCampo,
  previewDoResultado,
  type ResultadoImport,
  type PreviewImport,
} from '../../db/importCampo';
import { PageHeader } from '../../components/PageHeader';
import { useToast } from '../../components/Toast';

/** Fluxo de import da ferramenta de campo: escolher arquivo → preview → confirmar. */
export function Importar() {
  const toast = useToast();
  const navigate = useNavigate();
  const [resultado, setResultado] = useState<ResultadoImport | null>(null);
  const [preview, setPreview] = useState<PreviewImport | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  function aoEscolherArquivo(ev: React.ChangeEvent<HTMLInputElement>) {
    setErro(null);
    setResultado(null);
    setPreview(null);
    const file = ev.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const res = importarCampo(parsed);
        if (res.formato === 'desconhecido') {
          setErro('Não reconheci o formato deste arquivo. Ele precisa vir da ferramenta de campo (formato principal {ativos, stakeholders, registros} ou o formato antigo do Hub {galpao, players, registros}).');
          return;
        }
        setResultado(res);
        setPreview(previewDoResultado(res));
      } catch (e) {
        setErro('Não consegui ler o arquivo. Confira se é um JSON válido exportado pela ferramenta de campo.');
      }
    };
    reader.readAsText(file);
    ev.target.value = '';
  }

  async function confirmarImport() {
    if (!resultado) return;
    setSalvando(true);
    try {
      // Transacional: ou entra tudo, ou nada. Adiciona sem apagar o que já existe.
      await db.transaction('rw', [db.ativos, db.stakeholders, db.evidencias, db.hipoteses], async () => {
        if (resultado.ativos.length) await db.ativos.bulkPut(resultado.ativos);
        if (resultado.stakeholders.length) await db.stakeholders.bulkPut(resultado.stakeholders);
        if (resultado.evidencias.length) await db.evidencias.bulkPut(resultado.evidencias);
        if (resultado.hipoteses.length) await db.hipoteses.bulkPut(resultado.hipoteses);
      });
      toast('Dados importados com sucesso');
      navigate('/');
    } catch (e) {
      setErro('Falha ao gravar no navegador. Nada foi importado. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div>
      <PageHeader
        kicker="Dados de campo"
        titulo="Importar dados de campo"
        descricao="Traga o JSON exportado pela ferramenta de campo offline. O formato é detectado automaticamente e nada é gravado antes de você confirmar."
      />

      <div className="panel">
        <label htmlFor="arquivo-campo">Arquivo JSON da ferramenta de campo</label>
        <input id="arquivo-campo" type="file" accept=".json,application/json" onChange={aoEscolherArquivo} />
        <p style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
          Aceita os dois formatos reais: a ferramenta principal (<code>{'{ativos, stakeholders, registros}'}</code>)
          e a ferramenta antiga do Hub Logístico (<code>{'{galpao, players, registros}'}</code>).
        </p>
        {erro && <div className="alerta" style={{ marginTop: 12 }}>{erro}</div>}
      </div>

      {preview && resultado && (
        <div className="panel">
          <h2>Prévia do import</h2>
          <div className="alerta ok">Formato detectado: <b>{preview.rotuloFormato}</b></div>

          <div className="kpi-row" style={{ margin: '12px 0' }}>
            <div className="kpi-box"><div className="n">{preview.contagens.ativos}</div><div className="l">ativos</div></div>
            <div className="kpi-box"><div className="n">{preview.contagens.stakeholders}</div><div className="l">stakeholders</div></div>
            <div className="kpi-box"><div className="n">{preview.contagens.evidencias}</div><div className="l">evidências (registros)</div></div>
          </div>

          {preview.amostra.ativos.length > 0 && (
            <p style={{ fontSize: 13 }}><b>Ativos:</b> {preview.amostra.ativos.join(' · ')}{preview.contagens.ativos > 3 ? ' …' : ''}</p>
          )}
          {preview.amostra.stakeholders.length > 0 && (
            <p style={{ fontSize: 13 }}><b>Stakeholders:</b> {preview.amostra.stakeholders.join(' · ')}{preview.contagens.stakeholders > 3 ? ' …' : ''}</p>
          )}
          {preview.amostra.evidencias.length > 0 && (
            <p style={{ fontSize: 13 }}><b>Registros:</b> {preview.amostra.evidencias.map((e) => `"${e}…"`).join(' · ')}</p>
          )}

          {preview.avisos.map((a, i) => (
            <div className="alerta" key={i} style={{ marginTop: 8 }}>{a}</div>
          ))}

          <p style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 12 }}>
            Nenhum campo é descartado: informações sem lugar direto no modelo novo ficam guardadas
            em "campos não mapeados" de cada registro. Este import <b>adiciona</b> aos dados atuais.
          </p>

          <div className="row-actions" style={{ marginTop: 12 }}>
            <button className="btn" onClick={confirmarImport} disabled={salvando}>
              {salvando ? 'Importando…' : 'Confirmar e importar'}
            </button>
            <button className="btn ghost" onClick={() => { setResultado(null); setPreview(null); }} disabled={salvando}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
