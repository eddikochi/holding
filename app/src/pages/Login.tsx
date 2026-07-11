import { useState } from 'react';
import { Logo } from '../components/Logo';

const SENHA = '231418';

/** Tela de acesso. Ao entrar com a senha correta, grava a flag em localStorage
 *  e chama onEntrar() para liberar o app. A checagem inicial fica em main.tsx. */
export function Login({ onEntrar }: { onEntrar: () => void }) {
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState(false);

  function entrar(e: React.FormEvent) {
    e.preventDefault();
    if (senha === SENHA) {
      localStorage.setItem('holding_logado', 'true');
      onEntrar();
    } else {
      setErro(true);
    }
  }

  return (
    <div className="login-page">
      <form className="login-box" onSubmit={entrar}>
        <div className="login-logo">
          <Logo />
        </div>
        <input
          type="password"
          className="login-input"
          placeholder="Senha"
          value={senha}
          onChange={(e) => {
            setSenha(e.target.value);
            if (erro) setErro(false);
          }}
          autoFocus
          aria-label="Senha"
        />
        <button type="submit" className="login-btn">Entrar</button>
        {erro && <p className="login-erro">Senha incorreta</p>}
      </form>
    </div>
  );
}
