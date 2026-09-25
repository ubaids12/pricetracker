import { useEffect, useState } from 'react';
import { getHistory, getLogs, getTrackedProducts, searchProducts, trackProduct } from './api/client';
import SearchPage from './pages/SearchPage';
import Dashboard from './pages/Dashboard';
import ProductDetail from './pages/ProductDetail';

export default function App() {
  const [results, setResults] = useState([]);
  const [tracked, setTracked] = useState([]);
  const [selections, setSelections] = useState({});
  const [detail, setDetail] = useState(null);
  const [history, setHistory] = useState([]);
  const [logs, setLogs] = useState([]);
  const [busy, setBusy] = useState(false);
  const [tracking, setTracking] = useState(null);
  const [error, setError] = useState('');

  const refreshTracked = async () => {
    try { setTracked((await getTrackedProducts()).data || []); } catch (requestError) { setError(requestError.message); }
  };

  useEffect(() => { refreshTracked(); }, []);

  async function handleSearch(query) {
    if (!query.trim()) return;
    setBusy(true); setError('');
    try { setResults((await searchProducts(query)).data || []); } catch (requestError) { setError(requestError.message); } finally { setBusy(false); }
  }

  async function handleTrack(product) {
    const optionId = selections[product.id];
    const option = product.options.find((item) => item.id === optionId);
    if (!option) return;
    setTracking(product.id); setError('');
    try { await trackProduct(product.id, option.name, option.id); await refreshTracked(); } catch (requestError) { setError(requestError.message); } finally { setTracking(null); }
  }

  async function openDetail(product) {
    setDetail(product); setError('');
    try { const [historyResponse, logsResponse] = await Promise.all([getHistory(product.id), getLogs(product.id)]); setHistory(historyResponse.data || []); setLogs(logsResponse.data || []); } catch (requestError) { setError(requestError.message); }
  }

  return <main className="app-shell">
    <header className="topbar"><div className="brand-mark"><span>INE</span><strong>Price Ledger</strong></div><span className="live-indicator">● live storefront</span></header>
    <div className="app-content">
      <section className="hero-band"><div><p className="eyebrow">INE Store monitor</p><h1>Know what changed before you buy.</h1><p className="lede">Search the catalog, choose a precise edition, and keep an honest record of every price and stock check.</p></div><div className="hero-stamp">Every 2 hours<br /><strong>automatic checks</strong></div></section>
      <SearchPage onSearch={handleSearch} results={results} selections={selections} onOptionChange={(id, option) => setSelections((current) => ({ ...current, [id]: option }))} onTrack={handleTrack} tracking={tracking} busy={busy} error={error} />
      <Dashboard products={tracked} onSelect={openDetail} onRefresh={refreshTracked} />
      {detail && <ProductDetail product={detail} history={history} logs={logs} onBack={() => setDetail(null)} />}
    </div>
  </main>;
}
