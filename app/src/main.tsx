import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createHashRouter, RouterProvider } from 'react-router-dom';
import { App } from './App';
import { Home } from './features/home/Home';
import { ModuloDispatcher } from './features/modulos/ModuloDispatcher';
import { Importar } from './features/importar/Importar';
import { Backup } from './features/backup/Backup';
import { ToastProvider } from './components/Toast';
import { Login } from './pages/Login';
import './styles/global.css';

// HashRouter: funciona ao abrir o build direto do disco (file://), sem servidor.
const router = createHashRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'modulo/:slug', element: <ModuloDispatcher /> },
      { path: 'importar', element: <Importar /> },
      { path: 'backup', element: <Backup /> },
    ],
  },
]);

/** Porta de entrada: mostra o login enquanto não houver a flag em localStorage.
 *  Uma vez logado (ou já logado num refresh), entrega o app inteiro. */
function Raiz() {
  const [logado, setLogado] = useState(() => localStorage.getItem('holding_logado') === 'true');
  if (!logado) {
    return <Login onEntrar={() => { window.location.hash = '/'; setLogado(true); }} />;
  }
  return <RouterProvider router={router} />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <Raiz />
    </ToastProvider>
  </StrictMode>
);
