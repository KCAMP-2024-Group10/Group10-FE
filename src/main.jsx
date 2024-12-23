import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// 스타일 파일 경로 수정
import './assets/styles/input.css'; // Tailwind 입력 파일
import './assets/styles/output.css'; // Tailwind 빌드 출력 파일

import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);