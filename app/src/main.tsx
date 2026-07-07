import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createHashRouter, RouterProvider } from 'react-router-dom';
import { App } from './App';
import { Home } from './features/home/Home';
import { ModuloShell } from './features/modulos/ModuloShell';
import { Importar } from './features/importar/Importar';
import { Backup } from './features/backup/Backup';
import { ToastProvider } from './components/Toast';
import './styles/global.css';

// HashRouter: funciona ao abrir o build direto do disco (file://), sem servidor.
const router = createHashRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'modulo/:slug', element: <ModuloShell /> },
      { path: 'importar', element: <Importar /> },
      { path: 'backup', element: <Backup /> },
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>
  </StrictMode>
);
