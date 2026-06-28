import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { clearPrerenderedHtml } from './lib/prerenderedData';

// Clear build-time prerendered HTML so React can mount cleanly.
// The prerendered data remains accessible via #prerendered-data JSON.
clearPrerenderedHtml();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
