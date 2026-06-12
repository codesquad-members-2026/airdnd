import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app/App';
import { env } from './shared/config/env';
import './styles/global.css';

async function enableMocks() {
  if (!env.enableMocks) {
    return;
  }

  const { worker } = await import('./mocks/browser');
  await worker.start({
    onUnhandledRequest: 'bypass',
  });
}

enableMocks().then(() => {
  ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
});
