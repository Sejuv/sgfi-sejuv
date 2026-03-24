import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from "react-error-boundary";

// Shim mínimo para a extensão GitHub Spark (spoofer.js) não lançar erros.
// Envia o sinal que ela espera sem fazer chamadas de rede ao /_spark/*.
if (typeof window !== 'undefined') {
  (window as any).spark = { llm: undefined, llmPrompt: undefined, user: undefined, kv: undefined };
  window.parent.postMessage({ type: 'SPARK_RUNTIME_LOADED', payload: { url: window.location.href, load_ms: performance.now() } }, '*');
}

import App from './App.tsx'
import { ErrorFallback } from './ErrorFallback.tsx'

import "./main.css"
import "./styles/theme.css"
import "./index.css"

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <App />
   </ErrorBoundary>
)
