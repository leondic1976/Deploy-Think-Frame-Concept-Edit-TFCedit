import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { AppStoreProvider } from './state/appStore';
import './styles/tokens.css';
import './styles/global.css';
import './styles/themes.css';

const root = document.getElementById('root');
if (!root) throw new Error('렌더러 루트 요소를 찾을 수 없습니다.');

createRoot(root).render(
  <StrictMode>
    <AppStoreProvider>
      <App />
    </AppStoreProvider>
  </StrictMode>,
);
