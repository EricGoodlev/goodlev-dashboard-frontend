import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { LineChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area, ReferenceLine, Legend, PieChart, Pie, Cell } from 'recharts';

const COLORS = {
  primary: '#0F2942', accent: '#D4A84B', positive: '#2ECC71', negative: '#E74C3C',
  warning: '#F39C12', plan: '#3498DB', heloc: '#E74C3C', retirement: '#2ECC71',
  education: '#3498DB', emergency: '#F39C12', vacation: '#9B59B6',
  bg: '#F8F9FA', bgCard: '#FFFFFF', text: '#2C3E50', textLight: '#7F8C8D',
  textMuted: '#95A5A6', border: '#E8ECF0',
};
const CHART_COLORS = ['#3498DB', '#2ECC71', '#E74C3C', '#F39C12', '#9B59B6', '#1ABC9C', '#E91E63', '#00BCD4'];
const formatCurrency = (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v || 0);
const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

// LOGIN
function LoginScreen({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === import.meta.env.VITE_DASHBOARD_PASSWORD) {
      sessionStorage.setItem('dashboard_authenticated', 'true');
      onLogin();
    } else { setError('Incorrect password'); setPassword(''); }
  };
  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${COLORS.primary} 0%, #0A1F33 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
      <div style={{ background: COLORS.bgCard, borderRadius: 16, padding: 40, width: '100%', maxWidth: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}><div style={{ fontSize: 48, marginBottom: 16 }}>🏦</div><h1 style={{ margin: 0, fontSize: 24, color: COLORS.primary }}>Family Dashboard</h1></div>
        <form onSubmit={handleSubmit}>
          <input type="password" value={password} onChange={e => { setPassword(e.target.value); setError(''); }} placeholder="Password" autoFocus style={{ width: '100%', padding: 14, fontSize: 16, border: `2px solid ${error ? COLORS.negative : COLORS.border}`, borderRadius: 8, marginBottom: 16, boxSizing: 'border-box' }} />
          {error && <div style={{ color: COLORS.negative, fontSize: 14, marginBottom: 16, textAlign: 'center' }}>{error}</div>}
          <button type="submit" style={{ width: '100%', padding: 14, fontSize: 16, fontWeight: 600, color: '#FFF', background: COLORS.accent, border: 'none', borderRadius: 8, cursor: 'pointer' }}>Sign In</button>
        </form>
      </div>
    </div>
  );
}

// PERIOD SELECTOR
function PeriodSelector({ onChange }) {
  const [type, setType] = useState('month');
  const [date, setDate] = useState(new Date());
  
  const getDates = useCallback((t, d) => {
    const dt = new Date(d);
    let start, end;
    if (t === 'month') { start = new Date(dt.getFullYear(), dt.getMonth(), 1); end = new Date(dt.getFullYear(), dt.getMonth() + 1, 0); }
    else if (t === 'quarter') { const q = Math.floor(dt.getMonth() / 3); start = new Date(dt.getFullYear(), q * 3, 1); end = new Date(dt.getFullYear(), (q + 1) * 3, 0); }
    else if (t === 'year') { start = new Date(dt.getFullYear(), 0, 1); end = new Date(dt.getFullYear(), 11, 31); }
    else { start = new Date(dt.getFullYear(), 0, 1); end = new Date(); }
    const label = t === 'month' ? start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : t === 'quarter' ? `Q${Math.floor(start.getMonth() / 3) + 1} ${start.getFullYear()}` : t === 'year' ? start.getFullYear().toString() : `YTD ${start.getFullYear()}`;
    return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0], label };
  }, []);
  
  useEffect(() => { onChange(getDates(type, date)); }, [type, date, getDates, onChange]);
  
  const nav = (dir) => { const d = new Date(date); if (type === 'month') d.setMonth(d.getMonth() + dir); else if (type === 'quarter') d.setMonth(d.getMonth() + dir * 3); else if (type === 'year') d.setFullYear(d.getFullYear() + dir); setDate(d); };
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', gap: 4 }}>
        {['month', 'quarter', 'year', 'ytd'].map(t => (
          <button key={t} onClick={() => setType(t)} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${type === t ? COLORS.accent : COLORS.border}`, background: type === t ? `${COLORS.accent}20` : 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: 500, textTransform: 'capitalize' }}>{t === 'ytd' ? 'YTD' : t}</button>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={() => nav(-1)} style={{ width: 32, height: 32, borderRadius: 6, border: `1px solid ${COLORS.border}`, background: 'transparent', cursor: 'pointer' }}>←</button>
        <span style={{ fontWeight: 600, minWidth: 140, textAlign: 'center' }}>{getDates(type, date).label}</span>
        <button onClick={() => nav(1)} style={{ width: 32, height: 32, borderRadius: 6, border: `1px solid ${COLORS.border}`, background: 'transparent', cursor: 'pointer' }}>→</button>
      </div>
    </div>
  );
}

// AI CHAT
function AIChat({ isOpen, onClose, context }) {
  const [q, setQ] = useState('');
  const [msgs, setMsgs] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const ask = async () => {
    if (!q.trim() || loading) return;
    setLoading(true);
    const userMsg = q; setQ('');
    setMsgs(prev => [...prev, { role: 'user', content: userMsg }]);
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1000, messages: [...msgs, { role: 'user', content: `${context}\n\nQUESTION: ${userMsg}` }],
          system: 'You are a financial advisor. Be specific with numbers. Keep responses to 2-3 paragraphs. Consider: 3 kids overlapping in college 2037-2039, eldest has autism (therapy ~$3K/mo), HELOC draw ends Jan 2032.' })
      });
      const data = await res.json();
      setMsgs(prev => [...prev, { role: 'assistant', content: data.content?.[0]?.text || 'Error' }]);
    } catch { setMsgs(prev => [...prev, { role: 'assistant', content: 'Connection error' }]); }
    setLoading(false);
  };
  
  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', bottom: 80, right: 24, width: 400, maxHeight: '70vh', background: COLORS.bgCard, borderRadius: 16, boxShadow: '0 10px 40px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', zIndex: 1000 }}>
      <div style={{ padding: 16, background: COLORS.primary, color: '#FFF', borderRadius: '16px 16px 0 0', display: 'flex', justifyContent: 'space-between' }}><span style={{ fontWeight: 600 }}>🤖 AI Advisor</span><button onClick={onClose} style={{ background: 'none', border: 'none', color: '#FFF', fontSize: 20, cursor: 'pointer' }}>×</button></div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 350 }}>
        {msgs.length === 0 && <div style={{ color: COLORS.textMuted, fontSize: 13, textAlign: 'center', padding: 20 }}>Ask me anything about your finances!<div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>{["Should I prioritize HELOC or retirement?", "Am I on track?", "How to handle 3 kids in college?"].map(s => <button key={s} onClick={() => setQ(s)} style={{ padding: 8, background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 12, cursor: 'pointer', textAlign: 'left' }}>{s}</button>)}</div></div>}
        {msgs.map((m, i) => <div key={i} style={{ padding: 12, borderRadius: 12, background: m.role === 'user' ? COLORS.accent : COLORS.bg, color: m.role === 'user' ? '#FFF' : COLORS.text, alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%', fontSize: 13, whiteSpace: 'pre-wrap' }}>{m.content}</div>)}
        {loading && <div style={{ color: COLORS.textMuted }}>Thinking...</div>}
      </div>
      <div style={{ padding: 12, borderTop: `1px solid ${COLORS.border}`, display: 'flex', gap: 8 }}>
        <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && ask()} placeholder="Ask..." style={{ flex: 1, padding: 10, border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 14 }} />
        <button onClick={ask} disabled={loading} style={{ padding: '10px 16px', background: COLORS.accent, color: '#FFF', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>→</button>
      </div>
    </div>
  );
}

// MAIN
export default function GoodlevDashboard() {
  const [auth, setAuth] = useState(() => sessionStorage.getItem('dashboard_authenticated') === 'true');
  const [tab, setTab] = useState('dashboard');
  const apiUrl = import.meta.env.VITE_API_URL || 'https://goodlevdashboard.up.railway.app';
  const apiKey = import.meta.env.VITE_API_KEY || '';
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState({ start: '', end: '', label: '' });
  
  // Data
  const [accounts, setAccounts] = useState([]);
  const [manualAccounts, setManualAccounts] = useState([]);
  const [netWorth, setNetWorth] = useState(null);
  const [spending, setSpending] = useState(null);
  const [budgetVsActual, setBudgetVsActual] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [trends, setTrends] = useState(null);
  const [marketRates, setMarketRates] = useState(null);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [selectedCat, setSelectedCat] = useState(null);
  const [catTxns, setCatTxns] = useState([]);
  const [editingAccount, setEditingAccount] = useState(null);
  const [editBalance, setEditBalance] = useState('');
  
  // Goals
  const [allocs, setAllocs] = useState({ heloc: 1961, retirement: 784, emergency: 392, education: 392, vacation: 393 });
  const [scenarios, setScenarios] = useState([]);
  const [scenarioName, setScenarioName] = useState('');
  const [aiOpen, setAiOpen] = useState(false);
  
  const surplus = 3922;
  const remaining = surplus - Object.values(allocs).reduce((a, b) => a + b, 0);
  
  const api = useCallback(async (ep, opts = {}) => {
    const res = await fetch(`${apiUrl}${ep}`, { ...opts, headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json', ...opts.headers } });
    if (!res.ok) throw new Error(res.status);
    return res.json();
  }, [apiUrl, apiKey]);
  
  // Init
  useEffect(() => {
    if (apiKey && auth) {
      fetch(`${apiUrl}/health`, { headers: { 'X-API-Key': apiKey } }).then(r => { if (r.ok) setConnected(true); }).catch(() => {});
    }
  }, [auth, apiKey, apiUrl]);
  
  useEffect(() => { if (connected) api('/api/accounts').then(setAccounts).catch(console.error); }, [connected, api]);
  useEffect(() => { if (connected) api('/api/manual-accounts').then(setManualAccounts).catch(console.error); }, [connected, api]);
  useEffect(() => { if (connected) api('/api/net-worth').then(setNetWorth).catch(console.error); }, [connected, api]);
  useEffect(() => { if (connected) api('/api/notes').then(d => setNotes(Array.isArray(d) ? d : [])).catch(console.error); }, [connected, api]);
  useEffect(() => { if (connected) api('/api/market/rates').then(setMarketRates).catch(console.error); }, [connected, api]);
  
  // Period data
  useEffect(() => {
    if (!period.start || !connected) return;
    setLoading(true);
    Promise.all([
      api(`/api/spending/by-category?start_date=${period.start}&end_date=${period.end}`),
      api(`/api/budget/vs-actual?start_date=${period.start}&end_date=${period.end}`)
    ]).then(([s, b]) => { setSpending(s); setBudgetVsActual(b); }).catch(console.error).finally(() => setLoading(false));
  }, [period, connected, api]);
  
  // Comparison
  useEffect(() => {
    if (!period.start || !connected) return;
    const s = new Date(period.start), e = new Date(period.end), dur = e - s;
    const pe = new Date(s - 1), ps = new Date(pe - dur);
    api(`/api/spending/compare?period1_start=${ps.toISOString().split('T')[0]}&period1_end=${pe.toISOString().split('T')[0]}&period2_start=${period.start}&period2_end=${period.end}`).then(setComparison).catch(console.error);
  }, [period, connected, api]);
  
  // Trends
  useEffect(() => {
    if (!connected) return;
    const end = new Date(), start = new Date(); start.setMonth(start.getMonth() - 12);
    api(`/api/spending/by-month?start_date=${start.toISOString().split('T')[0]}&end_date=${end.toISOString().split('T')[0]}`).then(setTrends).catch(console.error);
  }, [connected, api]);
  
  const drillDown = async (cat) => {
    setSelectedCat(cat); setLoading(true);
    try { const d = await api(`/api/transactions/search?start_date=${period.start}&end_date=${period.end}&category=${encodeURIComponent(cat)}`); setCatTxns(d.transactions || []); } catch (e) { console.error(e); }
    setLoading(false);
  };
  
  const addNote = async () => { if (!newNote.trim()) return; try { const n = await api('/api/notes', { method: 'POST', body: JSON.stringify({ content: newNote }) }); setNotes([...notes, n]); setNewNote(''); } catch (e) { console.error(e); } };
  const delNote = async (id) => { try { await api(`/api/notes/${id}`, { method: 'DELETE' }); setNotes(notes.filter(n => n.id !== id)); } catch (e) { console.error(e); } };
  
  const updateManualBalance = async (accountId) => {
    const balance = parseFloat(editBalance);
    if (isNaN(balance)) return;
    try {
      const updated = await api(`/api/manual-accounts/${accountId}/balance`, { method: 'PUT', body: JSON.stringify({ balance }) });
      setManualAccounts(manualAccounts.map(a => a.id === accountId ? { ...a, ...updated, update_status: 'current', days_since_update: 0 } : a));
      setEditingAccount(null);
      setEditBalance('');
      // Refresh net worth
      api('/api/net-worth').then(setNetWorth).catch(console.error);
    } catch (e) { console.error(e); }
  };
  
  const getUpdateStatusColor = (status) => {
    if (status === 'current') return COLORS.positive;
    if (status === 'stale') return COLORS.warning;
    return COLORS.negative; // overdue or never_updated
  };
  
  const getUpdateStatusText = (account) => {
    if (account.update_status === 'never_updated') return '⚠️ Never updated';
    if (account.update_status === 'overdue') return `🔴 ${account.days_since_update} days old`;
    if (account.update_status === 'stale') return `🟡 ${account.days_since_update} days old`;
    return `✓ ${account.days_since_update}d ago`;
  };
  
  const accountsNeedingUpdate = manualAccounts.filter(a => a.update_status !== 'current');
  
  // Goals calcs
  const helocPayoff = useMemo(() => {
    let b = 275809, r = 0.0632 / 12, p = 1546 + allocs.heloc, m = 0, i = 0;
    while (b > 0 && m < 360) { const int = b * r; i += int; b = Math.max(0, b - (p - int)); m++; }
    const d = new Date(); d.setMonth(d.getMonth() + m);
    return { months: m, date: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), interest: Math.round(i) };
  }, [allocs.heloc]);
  
  const baselineInterest = useMemo(() => { let b = 275809, r = 0.0632 / 12, p = 1546, m = 0, i = 0; while (b > 0 && m < 360) { const int = b * r; i += int; b = Math.max(0, b - (p - int)); m++; } return Math.round(i); }, []);
  
  const retireAt60 = useMemo(() => {
    let bal = 645449, mr = 0.07 / 12, mc = 3435 + allocs.retirement;
    for (let m = 0; m < 240; m++) bal = bal * (1 + mr) + mc;
    return Math.round(bal);
  }, [allocs.retirement]);
  
  const saveScenario = () => {
    if (!scenarioName.trim()) return;
    setScenarios([...scenarios, { id: Date.now(), name: scenarioName, createdAt: new Date().toISOString(), allocs: { ...allocs }, helocPayoff: helocPayoff.date, interestSaved: baselineInterest - helocPayoff.interest, retireAt60 }]);
    setScenarioName('');
  };
  
  const logout = () => { sessionStorage.removeItem('dashboard_authenticated'); setAuth(false); };
  
  const aiContext = `SNAPSHOT: Surplus ${formatCurrency(surplus)}, HELOC $275,809 @ 6.32% payoff ${helocPayoff.date}, Retirement ${netWorth ? formatCurrency(netWorth.retirement_total) : '$645,449'} (${netWorth?.retirement_progress || 16}% of $4M target), Emergency $24,049/$56,000, 529 $85,747. Period spending: ${spending ? formatCurrency(spending.total_spending) : 'loading'}. ${comparison ? `vs prev: ${comparison.total_change > 0 ? '+' : ''}${formatCurrency(comparison.total_change)}` : ''} Market: ${marketRates?.rates?.mortgage_30yr ? `30yr mortgage ${marketRates.rates.mortgage_30yr}%, your rate 2.25%` : ''} Manual accounts: ${manualAccounts.map(a => `${a.name}: ${formatCurrency(a.balance)}`).join(', ')}`;
  
  if (!auth) return <LoginScreen onLogin={() => setAuth(true)} />;
  
  return (
    <div style={{ minHeight: '100vh', background: COLORS.bg, fontFamily: 'system-ui' }}>
      {/* Header */}
      <header style={{ background: `linear-gradient(135deg, ${COLORS.primary} 0%, #0A1F33 100%)`, padding: '16px 24px', color: '#FFF' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Family Financial Dashboard</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {accountsNeedingUpdate.length > 0 && (
                <div style={{ padding: '6px 12px', background: `${COLORS.warning}30`, borderRadius: 6, fontSize: 12, color: COLORS.warning, fontWeight: 600 }}>
                  ⚠️ {accountsNeedingUpdate.length} account{accountsNeedingUpdate.length > 1 ? 's' : ''} need update
                </div>
              )}
              <div style={{ padding: '6px 12px', background: connected ? 'rgba(46,204,113,0.2)' : 'rgba(243,156,18,0.2)', borderRadius: 6, fontSize: 12 }}>{connected ? `● ${accounts.length} Accounts` : '○ Demo'}</div>
              <button onClick={logout} style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.1)', color: '#FFF', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Logout</button>
            </div>
          </div>
          <nav style={{ marginTop: 16, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {[{ id: 'dashboard', label: '📊 Dashboard' }, { id: 'budget', label: '💰 Budget' }, { id: 'trends', label: '📈 Trends' }, { id: 'drilldown', label: '🔍 Drill-Down' }, { id: 'goals', label: '🎯 Goals' }, { id: 'notes', label: '📝 Notes' }].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '8px 16px', background: tab === t.id ? COLORS.accent : 'transparent', color: '#FFF', border: 'none', borderRadius: '6px 6px 0 0', fontWeight: tab === t.id ? 600 : 400, cursor: 'pointer', fontSize: 13 }}>{t.label}</button>
            ))}
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: 1400, margin: '0 auto', padding: 24 }}>
        
        {/* DASHBOARD */}
        {tab === 'dashboard' && (
          <div>
            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <PeriodSelector onChange={setPeriod} />
              {marketRates?.rates && (
                <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
                  <span style={{ padding: '6px 10px', background: COLORS.bgCard, borderRadius: 6, border: `1px solid ${COLORS.border}` }}>30yr: <strong>{marketRates.rates.mortgage_30yr}%</strong></span>
                  <span style={{ padding: '6px 10px', background: COLORS.bgCard, borderRadius: 6, border: `1px solid ${COLORS.border}` }}>Your mtg: <strong style={{ color: COLORS.positive }}>2.25%</strong> <span style={{ color: COLORS.positive }}>↓{marketRates.rates.mortgage_savings}%</span></span>
                </div>
              )}
            </div>
            
            {accounts.length > 0 && (
              <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 16, border: `1px solid ${COLORS.border}`, marginBottom: 24 }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: 13, color: COLORS.textMuted }}>Connected Accounts (YNAB)</h3>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {accounts.filter(a => !a.closed).map(a => (
                    <div key={a.id} style={{ padding: '8px 12px', background: COLORS.bg, borderRadius: 8, fontSize: 12 }}>
                      <div style={{ fontWeight: 600 }}>{a.name}</div>
                      <div style={{ color: a.balance < 0 ? COLORS.negative : COLORS.positive, fontWeight: 600 }}>{formatCurrency(a.balance / 1000)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Manual Accounts with Update Warnings */}
            {manualAccounts.length > 0 && (
              <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 16, border: `1px solid ${accountsNeedingUpdate.length > 0 ? COLORS.warning : COLORS.border}`, marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h3 style={{ margin: 0, fontSize: 13, color: COLORS.textMuted }}>Manual Accounts (Equitable/AXA)</h3>
                  {accountsNeedingUpdate.length > 0 && (
                    <span style={{ padding: '4px 8px', background: `${COLORS.warning}20`, color: COLORS.warning, borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                      ⚠️ {accountsNeedingUpdate.length} need{accountsNeedingUpdate.length === 1 ? 's' : ''} update
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {manualAccounts.map(a => (
                    <div key={a.id} style={{ padding: '12px 16px', background: COLORS.bg, borderRadius: 8, fontSize: 12, minWidth: 180, border: `2px solid ${a.update_status === 'current' ? 'transparent' : getUpdateStatusColor(a.update_status)}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontWeight: 600 }}>{a.name}</span>
                        <span style={{ fontSize: 10, color: COLORS.textMuted }}>{a.owner}</span>
                      </div>
                      
                      {editingAccount === a.id ? (
                        <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                          <input type="number" value={editBalance} onChange={e => setEditBalance(e.target.value)} placeholder="New balance" autoFocus
                            style={{ flex: 1, padding: '6px 8px', border: `1px solid ${COLORS.border}`, borderRadius: 4, fontSize: 12, width: 80 }} />
                          <button onClick={() => updateManualBalance(a.id)} style={{ padding: '6px 10px', background: COLORS.positive, color: '#FFF', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>✓</button>
                          <button onClick={() => { setEditingAccount(null); setEditBalance(''); }} style={{ padding: '6px 10px', background: COLORS.textMuted, color: '#FFF', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>×</button>
                        </div>
                      ) : (
                        <>
                          <div style={{ color: COLORS.positive, fontWeight: 700, fontSize: 16 }}>{formatCurrency(a.balance)}</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                            <span style={{ fontSize: 10, color: getUpdateStatusColor(a.update_status) }}>{getUpdateStatusText(a)}</span>
                            <button onClick={() => { setEditingAccount(a.id); setEditBalance(a.balance.toString()); }} style={{ padding: '3px 8px', background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 4, cursor: 'pointer', fontSize: 10, color: COLORS.textMuted }}>Update</button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Net Worth Summary */}
            {netWorth && (
              <div style={{ background: `linear-gradient(135deg, ${COLORS.primary} 0%, #0A1F33 100%)`, borderRadius: 12, padding: 20, marginBottom: 24, color: '#FFF' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 11, opacity: 0.7 }}>Total Net Worth</div>
                    <div style={{ fontSize: 28, fontWeight: 700 }}>{formatCurrency(netWorth.total_net_worth)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, opacity: 0.7 }}>Retirement Total</div>
                    <div style={{ fontSize: 28, fontWeight: 700 }}>{formatCurrency(netWorth.retirement_total)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, opacity: 0.7 }}>Retirement Progress</div>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>{netWorth.retirement_progress}%</div>
                    <div style={{ height: 6, background: 'rgba(255,255,255,0.2)', borderRadius: 3, marginTop: 6 }}>
                      <div style={{ width: `${Math.min(netWorth.retirement_progress, 100)}%`, height: '100%', background: COLORS.positive, borderRadius: 3 }} />
                    </div>
                    <div style={{ fontSize: 10, opacity: 0.7, marginTop: 4 }}>Target: $4M @ 60</div>
                  </div>
                </div>
              </div>
            )}
            
            {loading && <div style={{ padding: 40, textAlign: 'center', color: COLORS.textMuted }}>Loading...</div>}
            
            {spending && !loading && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
                  <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 16, border: `1px solid ${COLORS.border}` }}><div style={{ fontSize: 11, color: COLORS.textMuted }}>Period Spending</div><div style={{ fontSize: 24, fontWeight: 700, color: COLORS.negative }}>{formatCurrency(spending.total_spending)}</div>{comparison && <div style={{ fontSize: 11, color: comparison.total_change > 0 ? COLORS.negative : COLORS.positive }}>{comparison.total_change > 0 ? '↑' : '↓'} {formatCurrency(Math.abs(comparison.total_change))}</div>}</div>
                  <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 16, border: `1px solid ${COLORS.border}` }}><div style={{ fontSize: 11, color: COLORS.textMuted }}>Monthly Surplus</div><div style={{ fontSize: 24, fontWeight: 700, color: COLORS.positive }}>{formatCurrency(surplus)}</div></div>
                  <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 16, border: `1px solid ${COLORS.border}` }}><div style={{ fontSize: 11, color: COLORS.textMuted }}>HELOC Payoff</div><div style={{ fontSize: 24, fontWeight: 700, color: COLORS.heloc }}>{helocPayoff.date}</div><div style={{ fontSize: 11, color: COLORS.textLight }}>{helocPayoff.months} mo</div></div>
                  <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 16, border: `1px solid ${COLORS.border}` }}><div style={{ fontSize: 11, color: COLORS.textMuted }}>Retirement @ 60</div><div style={{ fontSize: 24, fontWeight: 700, color: COLORS.retirement }}>{formatCurrency(retireAt60)}</div><div style={{ fontSize: 11, color: retireAt60 >= 4000000 ? COLORS.positive : COLORS.warning }}>{retireAt60 >= 4000000 ? '✓ On track' : 'Below $4M'}</div></div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                  <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${COLORS.border}` }}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: 15 }}>Spending by Category</h3>
                    <ResponsiveContainer width="100%" height={250}><PieChart><Pie data={spending.categories?.slice(0, 8)} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={85}>{spending.categories?.slice(0, 8).map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}</Pie><Tooltip formatter={v => formatCurrency(v)} /></PieChart></ResponsiveContainer>
                  </div>
                  <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${COLORS.border}` }}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: 15 }}>Top Categories</h3>
                    {spending.categories?.slice(0, 8).map((c, i) => (
                      <div key={c.category} onClick={() => { setTab('drilldown'); setTimeout(() => drillDown(c.category), 100); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', cursor: 'pointer', borderBottom: `1px solid ${COLORS.border}` }}>
                        <div style={{ width: 10, height: 10, borderRadius: 2, background: CHART_COLORS[i % CHART_COLORS.length] }} />
                        <div style={{ flex: 1, fontSize: 13 }}>{c.category}</div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{formatCurrency(c.amount)}</div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {comparison && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                    <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${COLORS.border}` }}>
                      <h3 style={{ margin: '0 0 12px 0', fontSize: 15, color: COLORS.negative }}>📈 Spending Up</h3>
                      {comparison.biggest_increases?.slice(0, 5).map(c => <div key={c.category} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${COLORS.border}`, fontSize: 13 }}><span>{c.category}</span><span style={{ color: COLORS.negative, fontWeight: 600 }}>+{formatCurrency(c.change)}</span></div>)}
                      {!comparison.biggest_increases?.length && <div style={{ color: COLORS.textMuted, fontSize: 13 }}>None! 🎉</div>}
                    </div>
                    <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${COLORS.border}` }}>
                      <h3 style={{ margin: '0 0 12px 0', fontSize: 15, color: COLORS.positive }}>📉 Savings Found</h3>
                      {comparison.biggest_decreases?.slice(0, 5).map(c => <div key={c.category} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${COLORS.border}`, fontSize: 13 }}><span>{c.category}</span><span style={{ color: COLORS.positive, fontWeight: 600 }}>{formatCurrency(c.change)}</span></div>)}
                      {!comparison.biggest_decreases?.length && <div style={{ color: COLORS.textMuted, fontSize: 13 }}>None</div>}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* BUDGET VS ACTUAL */}
        {tab === 'budget' && (
          <div>
            <div style={{ marginBottom: 24 }}><PeriodSelector onChange={setPeriod} /></div>
            {budgetVsActual && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
                  <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${COLORS.border}` }}><div style={{ fontSize: 12, color: COLORS.textMuted }}>Total Budgeted</div><div style={{ fontSize: 28, fontWeight: 700 }}>{formatCurrency(budgetVsActual.summary.total_budgeted)}</div></div>
                  <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${COLORS.border}` }}><div style={{ fontSize: 12, color: COLORS.textMuted }}>Total Actual</div><div style={{ fontSize: 28, fontWeight: 700, color: COLORS.negative }}>{formatCurrency(budgetVsActual.summary.total_actual)}</div></div>
                  <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${COLORS.border}` }}><div style={{ fontSize: 12, color: COLORS.textMuted }}>Variance</div><div style={{ fontSize: 28, fontWeight: 700, color: budgetVsActual.summary.total_variance >= 0 ? COLORS.positive : COLORS.negative }}>{budgetVsActual.summary.total_variance >= 0 ? '+' : ''}{formatCurrency(budgetVsActual.summary.total_variance)}</div></div>
                  <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${COLORS.border}` }}><div style={{ fontSize: 12, color: COLORS.textMuted }}>Status</div><div style={{ fontSize: 18, fontWeight: 700 }}><span style={{ color: COLORS.positive }}>{budgetVsActual.summary.categories_under} under</span> / <span style={{ color: COLORS.negative }}>{budgetVsActual.summary.categories_over} over</span></div></div>
                </div>
                
                <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 24, border: `1px solid ${COLORS.border}` }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: 16 }}>Budget vs Actual by Category</h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={budgetVsActual.categories.filter(c => c.budgeted > 0 || c.actual > 0).slice(0, 15)} layout="vertical" margin={{ left: 100 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tickFormatter={v => `$${v}`} />
                      <YAxis type="category" dataKey="category" tick={{ fontSize: 12 }} width={100} />
                      <Tooltip formatter={v => formatCurrency(v)} />
                      <Legend />
                      <Bar dataKey="budgeted" fill={COLORS.plan} name="Budgeted" />
                      <Bar dataKey="actual" fill={COLORS.warning} name="Actual" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 24, border: `1px solid ${COLORS.border}`, marginTop: 24 }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: 16 }}>Category Details</h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead><tr style={{ borderBottom: `2px solid ${COLORS.border}` }}><th style={{ padding: 10, textAlign: 'left' }}>Category</th><th style={{ padding: 10, textAlign: 'right' }}>Budget</th><th style={{ padding: 10, textAlign: 'right' }}>Actual</th><th style={{ padding: 10, textAlign: 'right' }}>Variance</th><th style={{ padding: 10, textAlign: 'right' }}>% Used</th></tr></thead>
                    <tbody>
                      {budgetVsActual.categories.filter(c => c.budgeted > 0 || c.actual > 0).map(c => (
                        <tr key={c.category} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                          <td style={{ padding: 10 }}>{c.category}</td>
                          <td style={{ padding: 10, textAlign: 'right' }}>{formatCurrency(c.budgeted)}</td>
                          <td style={{ padding: 10, textAlign: 'right' }}>{formatCurrency(c.actual)}</td>
                          <td style={{ padding: 10, textAlign: 'right', color: c.variance >= 0 ? COLORS.positive : COLORS.negative, fontWeight: 600 }}>{c.variance >= 0 ? '+' : ''}{formatCurrency(c.variance)}</td>
                          <td style={{ padding: 10, textAlign: 'right' }}><span style={{ padding: '2px 8px', borderRadius: 12, background: c.percent_used > 100 ? `${COLORS.negative}20` : c.percent_used > 80 ? `${COLORS.warning}20` : `${COLORS.positive}20`, color: c.percent_used > 100 ? COLORS.negative : c.percent_used > 80 ? COLORS.warning : COLORS.positive, fontSize: 12 }}>{c.percent_used}%</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* TRENDS */}
        {tab === 'trends' && (
          <div>
            <h2 style={{ margin: '0 0 24px 0' }}>Spending Trends</h2>
            {trends && trends.months?.length > 1 ? (
              <>
                <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 24, border: `1px solid ${COLORS.border}`, marginBottom: 24 }}>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={trends.months}>
                      <defs><linearGradient id="grad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLORS.plan} stopOpacity={0.3} /><stop offset="95%" stopColor={COLORS.plan} stopOpacity={0} /></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tickFormatter={v => `$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                      <Tooltip formatter={v => formatCurrency(v)} />
                      <Area type="monotone" dataKey="total" stroke={COLORS.plan} fill="url(#grad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 24, border: `1px solid ${COLORS.border}` }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead><tr style={{ borderBottom: `2px solid ${COLORS.border}` }}><th style={{ padding: 12, textAlign: 'left' }}>Month</th><th style={{ padding: 12, textAlign: 'right' }}>Total</th><th style={{ padding: 12, textAlign: 'right' }}>Change</th></tr></thead>
                    <tbody>{trends.months?.map((m, i) => { const prev = trends.months[i - 1]; const ch = prev ? m.total - prev.total : 0; return (<tr key={m.month} style={{ borderBottom: `1px solid ${COLORS.border}` }}><td style={{ padding: 12 }}>{m.month}</td><td style={{ padding: 12, textAlign: 'right', fontWeight: 600 }}>{formatCurrency(m.total)}</td><td style={{ padding: 12, textAlign: 'right', color: ch > 0 ? COLORS.negative : ch < 0 ? COLORS.positive : COLORS.textMuted }}>{i > 0 && `${ch > 0 ? '+' : ''}${formatCurrency(ch)}`}</td></tr>); })}</tbody>
                  </table>
                </div>
              </>
            ) : (
              <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 40, border: `1px solid ${COLORS.border}`, textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
                <h3 style={{ margin: '0 0 8px 0' }}>Building Your History</h3>
                <p style={{ color: COLORS.textMuted, margin: 0 }}>Trend data will appear as you accumulate more months in YNAB.<br />Currently showing {trends?.months?.length || 0} month(s) of data.</p>
              </div>
            )}
          </div>
        )}

        {/* DRILL-DOWN */}
        {tab === 'drilldown' && (
          <div>
            <div style={{ marginBottom: 24 }}><PeriodSelector onChange={setPeriod} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24 }}>
              <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 16, border: `1px solid ${COLORS.border}`, maxHeight: 600, overflowY: 'auto' }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: 13, color: COLORS.textMuted }}>Categories</h3>
                {spending?.categories?.map(c => (
                  <button key={c.category} onClick={() => drillDown(c.category)} style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '10px 12px', marginBottom: 4, border: `1px solid ${selectedCat === c.category ? COLORS.accent : COLORS.border}`, borderRadius: 6, background: selectedCat === c.category ? `${COLORS.accent}15` : 'transparent', cursor: 'pointer', fontSize: 13, textAlign: 'left' }}><span>{c.category}</span><span style={{ fontWeight: 600 }}>{formatCurrency(c.amount)}</span></button>
                ))}
              </div>
              <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 24, border: `1px solid ${COLORS.border}` }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: 16 }}>{selectedCat ? `${selectedCat} Transactions` : 'Select a category'}</h3>
                {catTxns.length > 0 && (
                  <div style={{ maxHeight: 500, overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead style={{ position: 'sticky', top: 0, background: COLORS.bgCard }}><tr style={{ borderBottom: `2px solid ${COLORS.border}` }}><th style={{ padding: 10, textAlign: 'left' }}>Date</th><th style={{ padding: 10, textAlign: 'left' }}>Payee</th><th style={{ padding: 10, textAlign: 'right' }}>Amount</th><th style={{ padding: 10, textAlign: 'left' }}>Source</th></tr></thead>
                      <tbody>{catTxns.map((t, i) => (<tr key={i} style={{ borderBottom: `1px solid ${COLORS.border}` }}><td style={{ padding: 10 }}>{formatDate(t.date)}</td><td style={{ padding: 10 }}>{t.payee}</td><td style={{ padding: 10, textAlign: 'right', fontWeight: 600, color: t.amount < 0 ? COLORS.negative : COLORS.positive }}>{formatCurrency(Math.abs(t.amount))}</td><td style={{ padding: 10 }}><span style={{ padding: '2px 6px', borderRadius: 4, fontSize: 10, background: t.local_category ? `${COLORS.accent}20` : COLORS.bg }}>{t.local_category ? '🏷️ Auto' : 'YNAB'}</span></td></tr>))}</tbody>
                    </table>
                    <div style={{ marginTop: 12, padding: 12, background: COLORS.bg, borderRadius: 8, fontSize: 13 }}><strong>{catTxns.length}</strong> transactions • Total: <strong>{formatCurrency(catTxns.reduce((s, t) => s + Math.abs(t.amount), 0))}</strong></div>
                  </div>
                )}
                {selectedCat && catTxns.length === 0 && !loading && <div style={{ color: COLORS.textMuted }}>No transactions</div>}
              </div>
            </div>
          </div>
        )}

        {/* GOALS */}
        {tab === 'goals' && (
          <div>
            <h2 style={{ margin: '0 0 24px 0' }}>Goal Allocation & Scenarios</h2>
            <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 24, border: `1px solid ${COLORS.border}`, marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}><span style={{ fontWeight: 600 }}>Surplus: {formatCurrency(surplus)}</span><span style={{ color: remaining >= 0 ? COLORS.positive : COLORS.negative, fontWeight: 600 }}>{remaining >= 0 ? `${formatCurrency(remaining)} left` : `${formatCurrency(-remaining)} over`}</span></div>
              <div style={{ height: 10, background: COLORS.border, borderRadius: 5, display: 'flex', overflow: 'hidden', marginBottom: 20 }}>{[{ k: 'heloc', c: COLORS.heloc }, { k: 'retirement', c: COLORS.retirement }, { k: 'emergency', c: COLORS.emergency }, { k: 'education', c: COLORS.education }, { k: 'vacation', c: COLORS.vacation }].map(g => <div key={g.k} style={{ width: `${(allocs[g.k] / surplus) * 100}%`, background: g.c }} />)}</div>
              {[{ k: 'heloc', l: '🏦 HELOC', c: COLORS.heloc, m: 3000 }, { k: 'retirement', l: '📈 Retirement', c: COLORS.retirement, m: 1500 }, { k: 'emergency', l: '🛡️ Emergency', c: COLORS.emergency, m: 1000 }, { k: 'education', l: '🎓 529', c: COLORS.education, m: 1000 }, { k: 'vacation', l: '🏖️ Vacation', c: COLORS.vacation, m: 1000 }].map(g => (
                <div key={g.k} style={{ marginBottom: 16 }}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span style={{ fontSize: 14 }}>{g.l}</span><span style={{ fontWeight: 600, color: g.c }}>{formatCurrency(allocs[g.k])}/mo</span></div><input type="range" min="0" max={g.m} step="50" value={allocs[g.k]} onChange={e => setAllocs({ ...allocs, [g.k]: +e.target.value })} style={{ width: '100%', accentColor: g.c }} /></div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
              <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 16, border: `1px solid ${COLORS.border}`, borderTop: `4px solid ${COLORS.heloc}` }}><h4 style={{ margin: '0 0 8px 0', color: COLORS.heloc, fontSize: 13 }}>HELOC Payoff</h4><div style={{ fontSize: 22, fontWeight: 700 }}>{helocPayoff.date}</div><div style={{ fontSize: 11, color: COLORS.positive }}>Save {formatCurrency(baselineInterest - helocPayoff.interest)}</div></div>
              <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 16, border: `1px solid ${COLORS.border}`, borderTop: `4px solid ${COLORS.retirement}` }}><h4 style={{ margin: '0 0 8px 0', color: COLORS.retirement, fontSize: 13 }}>Retire @ 60</h4><div style={{ fontSize: 22, fontWeight: 700 }}>{formatCurrency(retireAt60)}</div><div style={{ fontSize: 11, color: retireAt60 >= 4e6 ? COLORS.positive : COLORS.warning }}>{retireAt60 >= 4e6 ? '✓ On track' : `${formatCurrency(4e6 - retireAt60)} short`}</div>{netWorth && <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 4 }}>Current: {formatCurrency(netWorth.retirement_total)}</div>}</div>
              <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 16, border: `1px solid ${COLORS.border}`, borderTop: `4px solid ${COLORS.emergency}` }}><h4 style={{ margin: '0 0 8px 0', color: COLORS.emergency, fontSize: 13 }}>Emergency</h4><div style={{ fontSize: 22, fontWeight: 700 }}>{allocs.emergency > 0 ? Math.ceil((56000 - 24049) / allocs.emergency) : '∞'} mo</div><div style={{ height: 6, background: COLORS.border, borderRadius: 3, marginTop: 8 }}><div style={{ width: `${(24049 / 56000) * 100}%`, height: '100%', background: COLORS.emergency, borderRadius: 3 }} /></div></div>
              <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 16, border: `1px solid ${COLORS.border}`, borderTop: `4px solid ${COLORS.education}` }}><h4 style={{ margin: '0 0 8px 0', color: COLORS.education, fontSize: 13 }}>529 @ College</h4><div style={{ fontSize: 22, fontWeight: 700 }}>{formatCurrency(85747 + allocs.education * 12 * 11 * 1.03)}</div></div>
              <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 16, border: `1px solid ${COLORS.border}`, borderTop: `4px solid ${COLORS.vacation}` }}><h4 style={{ margin: '0 0 8px 0', color: COLORS.vacation, fontSize: 13 }}>Vacation</h4><div style={{ fontSize: 22, fontWeight: 700 }}>{formatCurrency(allocs.vacation * 12)}/yr</div></div>
            </div>
            <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 24, border: `1px solid ${COLORS.border}`, marginBottom: 24 }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: 15 }}>💾 Save Scenario</h3>
              <div style={{ display: 'flex', gap: 12 }}><input value={scenarioName} onChange={e => setScenarioName(e.target.value)} placeholder="Name (e.g., 'Aggressive HELOC')" style={{ flex: 1, padding: 10, border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 14 }} /><button onClick={saveScenario} disabled={!scenarioName.trim()} style={{ padding: '10px 20px', background: scenarioName.trim() ? COLORS.accent : COLORS.border, color: '#FFF', border: 'none', borderRadius: 8, fontWeight: 600, cursor: scenarioName.trim() ? 'pointer' : 'not-allowed' }}>Save</button></div>
            </div>
            {scenarios.length > 0 && (
              <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 24, border: `1px solid ${COLORS.border}` }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: 15 }}>📋 Saved Scenarios</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead><tr style={{ borderBottom: `2px solid ${COLORS.border}` }}><th style={{ padding: 10, textAlign: 'left' }}>Name</th><th style={{ padding: 10, textAlign: 'right' }}>HELOC+</th><th style={{ padding: 10, textAlign: 'right' }}>Payoff</th><th style={{ padding: 10, textAlign: 'right' }}>Saved</th><th style={{ padding: 10, textAlign: 'right' }}>Retire@60</th><th style={{ padding: 10 }}></th></tr></thead>
                  <tbody>{scenarios.map(s => (<tr key={s.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}><td style={{ padding: 10 }}><div style={{ fontWeight: 600 }}>{s.name}</div><div style={{ fontSize: 10, color: COLORS.textMuted }}>{new Date(s.createdAt).toLocaleDateString()}</div></td><td style={{ padding: 10, textAlign: 'right' }}>{formatCurrency(s.allocs.heloc)}</td><td style={{ padding: 10, textAlign: 'right' }}>{s.helocPayoff}</td><td style={{ padding: 10, textAlign: 'right', color: COLORS.positive }}>{formatCurrency(s.interestSaved)}</td><td style={{ padding: 10, textAlign: 'right' }}>{formatCurrency(s.retireAt60)}</td><td style={{ padding: 10 }}><button onClick={() => setAllocs({ ...s.allocs })} style={{ padding: '4px 8px', background: COLORS.plan, color: '#FFF', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11, marginRight: 4 }}>Load</button><button onClick={() => setScenarios(scenarios.filter(x => x.id !== s.id))} style={{ padding: '4px 8px', background: COLORS.negative, color: '#FFF', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>×</button></td></tr>))}</tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* NOTES */}
        {tab === 'notes' && (
          <div>
            <h2 style={{ margin: '0 0 24px 0' }}>📝 Notes & Reminders</h2>
            <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 24, border: `1px solid ${COLORS.border}`, marginBottom: 24 }}>
              <textarea value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="What's on your mind?" style={{ width: '100%', minHeight: 100, padding: 12, border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 14, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
              <button onClick={addNote} disabled={!newNote.trim()} style={{ marginTop: 12, padding: '10px 20px', background: newNote.trim() ? COLORS.accent : COLORS.border, color: '#FFF', border: 'none', borderRadius: 6, fontWeight: 600, cursor: newNote.trim() ? 'pointer' : 'not-allowed' }}>Add Note</button>
            </div>
            {notes.map(n => (
              <div key={n.id} style={{ background: COLORS.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${COLORS.border}`, borderLeft: `4px solid ${COLORS.accent}`, marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1 }}><div style={{ fontSize: 14, whiteSpace: 'pre-wrap' }}>{n.content}</div><div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 8 }}>{new Date(n.created_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</div></div>
                  <button onClick={() => delNote(n.id)} style={{ padding: '4px 8px', background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 4, cursor: 'pointer', fontSize: 14, color: COLORS.textMuted }}>×</button>
                </div>
              </div>
            ))}
            {notes.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: COLORS.textMuted }}>No notes yet</div>}
          </div>
        )}
      </main>

      <button onClick={() => setAiOpen(!aiOpen)} style={{ position: 'fixed', bottom: 24, right: 24, width: 56, height: 56, borderRadius: '50%', background: aiOpen ? COLORS.textMuted : COLORS.accent, color: '#FFF', border: 'none', fontSize: 24, cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{aiOpen ? '×' : '🤖'}</button>
      <AIChat isOpen={aiOpen} onClose={() => setAiOpen(false)} context={aiContext} />
      <footer style={{ padding: 16, textAlign: 'center', color: COLORS.textMuted, fontSize: 11, borderTop: `1px solid ${COLORS.border}` }}>Family Financial Dashboard v3.0</footer>
    </div>
  );
}
