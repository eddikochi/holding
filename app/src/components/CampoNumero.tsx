import { useState, type InputHTMLAttributes } from 'react';
import { parseNumeroBR } from '../lib/numero';

/**
 * Input numérico controlado que aceita vírgula e ponto e preserva o que se digita.
 *
 * O bug que isto resolve: amarrar `value` ao número já parseado e reparsear a cada
 * tecla apaga o separador decimal antes do 2º dígito ("3," → parseFloat → 3 → "3").
 * Aqui o texto digitado vive num buffer local (`raw`) enquanto o campo está focado,
 * então a vírgula sobrevive; o pai recebe sempre `number` (ou vazio), nunca string.
 *
 * - `vazio`: o que emitir quando o campo esvazia. Mantém o tipo do call-site
 *   (`undefined` p/ Patrimonial/Imobiliário; `null` p/ BusinessCases/Governança).
 * - `casas`: casas decimais fixas ao sair do campo (R$ = 2). Omitido = decimais livres.
 *   Não trava a digitação; só arredonda no blur. Campo vazio permanece vazio (nunca 0).
 */
type Props<V extends null | undefined> = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'type'
> & {
  value: number | V;
  onChange: (v: number | V) => void;
  vazio: V;
  casas?: number;
};

export function CampoNumero<V extends null | undefined>({
  value,
  onChange,
  vazio,
  casas,
  onFocus,
  onBlur,
  ...rest
}: Props<V>) {
  const [focado, setFocado] = useState(false);
  const [raw, setRaw] = useState('');

  const formatar = (n: number) => (casas != null ? n.toFixed(casas) : String(n));
  // Focado: mostra o texto cru (preserva vírgula/dígito em progresso).
  // Sem foco: reflete o value do pai (load do IndexedDB, import, reset).
  const texto = focado ? raw : value == null ? '' : formatar(value);

  return (
    <input
      type="text"
      inputMode="decimal"
      value={texto}
      onFocus={(e) => {
        setFocado(true);
        setRaw(value == null ? '' : formatar(value));
        onFocus?.(e);
      }}
      onChange={(e) => {
        const t = e.target.value;
        setRaw(t);
        const n = parseNumeroBR(t);
        onChange(n === undefined ? vazio : n);
      }}
      onBlur={(e) => {
        setFocado(false);
        // Arredonda para as casas pedidas ao sair. Vazio continua vazio (nunca 0).
        if (casas != null) {
          const n = parseNumeroBR(raw);
          if (n !== undefined) {
            const arred = Number(n.toFixed(casas));
            if (arred !== value) onChange(arred);
          }
        }
        onBlur?.(e);
      }}
      {...rest}
    />
  );
}
