import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area } from 'recharts';

// =============================================================================
// GOODLEV FAMILY FINANCIAL DASHBOARD v4.0
// Complete dashboard with YNAB integration, account mapping, AI advisor
// =============================================================================

const COLORS = {
  primary: '#0F2942',
  primaryLight: '#1A3A5C',
  accent: '#D4A84B',
  positive: '#2ECC71',
  negative: '#E74C3C',
  warning: '#F39C12',
  info: '#3498DB',
  text: '#2C3E50',
  textMuted: '#95A5A6',
  bg: '#F8F9FA',
  bgCard: '#FFFFFF',
  border: '#E8ECF0',
};

const BASELINE = {
  monthlyIncome: 22625,
  monthlyExpenses: 18703,
  monthlySurplus: 3922,
  helocBalance: 275809,
  helocRate: 0.0632,
  helocPayment: 1546,
  totalRetirement: 645449,
  annualRetirementContrib: 41225,
  balance529: 85747,
};

const ACCOUNT_CATEGORIES = [
  { value: 'checking_savings', label: 'Checking/Savings', icon: '💵', group: 'assets' },
  { value: 'retirement', label: 'Retirement (401k, IRA, 403b)', icon: '🏦', group: 'assets' },
  { value: '529_education', label: '529 Education', icon: '🎓', group: 'assets' },
  { value: 'investment', label: 'Investment/Brokerage', icon: '📈', group: 'assets' },
  { value: 'hsa', label: 'HSA', icon: '🏥', group: 'assets' },
  { value: 'other_asset', label: 'Other Asset', icon: '💎', group: 'assets' },
  { value: 'mortgage', label: 'Mortgage', icon: '🏠', group: 'liabilities' },
  { value: 'heloc', label: 'HELOC', icon: '🏡', group: 'liabilities' },
  { value: 'credit_card', label: 'Credit Card', icon: '💳', group: 'liabilities' },
  { value: 'other_liability', label: 'Other Liability', icon: '📋', group: 'liabilities' },
];

const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount || 0);

const getPeriodDates = (periodType, selectedDate) => {
  const d = new Date(selectedDate);
  let start, end, label;
  switch (periodType) {
    case 'month':
      start = new Date(d.getFullYear(), d.getMonth(), 1);
      end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      break;
    case 'quarter':
      const qStart = Math.floor(d.getMonth() / 3) * 3;
      start = new Date(d.getFullYear(), qStart, 1);
      end = new Date(d.getFullYear(), qStart + 3, 0);
      label = `Q${Math.floor(qStart / 3) + 1} ${d.getFullYear()}`;
      break;
    case 'year':
      start = new Date(d.getFullYear(), 0, 1);
      end = new Date(d.getFullYear(), 11, 31);
      label = d.getFullYear().toString();
      break;
    default:
      start = new Date(d.getFullYear(), d.getMonth(), 1);
      end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }
  return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0], label };
};

// LOGIN
function LoginScreen({ onLogin }) {
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL || 'https://goodlevdashboard.up.railway.app';

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${apiUrl}/health`, { headers: { 'X-API-Key': apiKey } });
      if (res.ok) {
        sessionStorage.setItem('dashboard_api_key', apiKey);
        sessionStorage.setItem('dashboard_authenticated', 'true');
        onLogin();
      } else {
        setError('Invalid API key');
      }
    } catch (e) {
      setError('Connection failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${COLORS.primary} 0%, #0A1F33 100%)` }}>
      <div style={{ background: COLORS.bgCard, padding: 40, borderRadius: 16, width: 360, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <h1 style={{ margin: '0 0 8px', color: COLORS.primary, fontSize: 24, textAlign: 'center' }}>🏦 Goodlev Dashboard</h1>
        <p style={{ margin: '0 0 24px', color: COLORS.textMuted, textAlign: 'center', fontSize: 14 }}>Family Financial Planning</p>
        <input type="password" placeholder="Enter API Key" value={apiKey} onChange={e => setApiKey(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} style={{ width: '100%', padding: 14, border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 15, marginBottom: 16, boxSizing: 'border-box' }} />
        {error && <p style={{ color: COLORS.negative, fontSize: 13, margin: '0 0 16px' }}>{error}</p>}
        <button onClick={handleLogin} disabled={loading || !apiKey} style={{ width: '100%', padding: 14, background: COLORS.primary, color: '#FFF', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>{loading ? 'Connecting...' : 'Login'}</button>
      </div>
    </div>
  );
}

// CARD
function Card({ title, children, icon, action }) {
  return (
    <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${COLORS.border}` }}>
      {(title || action) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: COLORS.text, display: 'flex', alignItems: 'center', gap: 8 }}>{icon && <span>{icon}</span>}{title}</h3>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

// KPI CARD
function KPICard({ label, value, icon, color }) {
  return (
    <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${COLORS.border}`, flex: 1, minWidth: 160 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ margin: 0, fontSize: 13, color: COLORS.textMuted }}>{label}</p>
          <p style={{ margin: '8px 0 0', fontSize: 24, fontWeight: 700, color: color || COLORS.text }}>{value}</p>
        </div>
        {icon && <span style={{ fontSize: 28, opacity: 0.8 }}>{icon}</span>}
      </div>
    </div>
  );
}

// PERIOD SELECTOR
function PeriodSelector({ periodType, setPeriodType, selectedDate, setSelectedDate }) {
  const periods = [{ value: 'month', label: 'Month' }, { value: 'quarter', label: 'Quarter' }, { value: 'year', label: 'Year' }];
  const navigate = (dir) => {
    const d = new Date(selectedDate);
    if (periodType === 'month') d.setMonth(d.getMonth() + dir);
    else if (periodType === 'quarter') d.setMonth(d.getMonth() + dir * 3);
    else d.setFullYear(d.getFullYear() + dir);
    setSelectedDate(d);
  };
  const { label } = getPeriodDates(periodType, selectedDate);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', gap: 4 }}>
        {periods.map(p => (
          <button key={p.value} onClick={() => setPeriodType(p.value)} style={{ padding: '8px 16px', background: periodType === p.value ? COLORS.primary : 'transparent', color: periodType === p.value ? '#FFF' : COLORS.text, border: `1px solid ${periodType === p.value ? COLORS.primary : COLORS.border}`, borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>{p.label}</button>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={() => navigate(-1)} style={{ padding: '8px 12px', background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 6, cursor: 'pointer' }}>←</button>
        <span style={{ fontWeight: 600, minWidth: 140, textAlign: 'center' }}>{label}</span>
        <button onClick={() => navigate(1)} style={{ padding: '8px 12px', background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 6, cursor: 'pointer' }}>→</button>
      </div>
    </div>
  );
}

// ACCOUNT MAPPING PANEL
function AccountMappingPanel({ apiUrl, apiKey, onMappingChange }) {
  const [unmapped, setUnmapped] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState({});
  const [saving, setSaving] = useState({});
  const [showAll, setShowAll] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const headers = { 'X-API-Key': apiKey };
      const [uRes, mRes] = await Promise.all([fetch(`${apiUrl}/api/accounts/unmapped`, { headers }), fetch(`${apiUrl}/api/account-mappings`, { headers })]);
      const uData = await uRes.json();
      const mData = await mRes.json();
      setUnmapped(uData.unmapped_accounts || []);
      setMappings(mData.mappings || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [apiUrl, apiKey]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async (acc) => {
    const cat = selected[acc.account_id] || acc.suggested_category;
    if (!cat) return alert('Select a category');
    setSaving(p => ({ ...p, [acc.account_id]: true }));
    try {
      await fetch(`${apiUrl}/api/account-mappings`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey }, body: JSON.stringify({ account_id: acc.account_id, category: cat }) });
      await fetchData();
      onMappingChange?.();
    } catch (e) { alert('Failed'); }
    finally { setSaving(p => ({ ...p, [acc.account_id]: false })); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove mapping?')) return;
    try { await fetch(`${apiUrl}/api/account-mappings/${id}`, { method: 'DELETE', headers: { 'X-API-Key': apiKey } }); await fetchData(); onMappingChange?.(); }
    catch (e) { alert('Failed'); }
  };

  const getCat = (v) => ACCOUNT_CATEGORIES.find(c => c.value === v) || { label: v, icon: '❓' };

  if (loading) return <Card title="Account Mappings" icon="🏷️"><p style={{ color: COLORS.textMuted }}>Loading...</p></Card>;

  return (
    <div>
      {unmapped.length > 0 && (
        <div style={{ background: '#FEF3E2', border: `1px solid ${COLORS.warning}`, borderRadius: 8, padding: 16, marginBottom: 20, display: 'flex', gap: 12 }}>
          <span style={{ fontSize: 24 }}>⚠️</span>
          <div><strong style={{ color: '#8B5A00' }}>{unmapped.length} account(s) need classification</strong><p style={{ margin: '4px 0 0', fontSize: 13, color: '#8B5A00' }}>Categorize for accurate tracking.</p></div>
        </div>
      )}
      {unmapped.length > 0 && (
        <Card title="Needs Classification" icon="🏷️">
          {unmapped.map(acc => (
            <div key={acc.account_id} style={{ padding: 16, border: `2px solid ${COLORS.warning}`, borderRadius: 10, marginBottom: 12, background: '#FFFBF5' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><strong>{acc.account_name}</strong><span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{formatCurrency(acc.balance)}</span></div>
              <p style={{ margin: '0 0 12px', fontSize: 13, color: COLORS.textMuted }}>Type: {acc.ynab_type}{acc.suggested_category && <span style={{ marginLeft: 12, color: COLORS.accent }}>💡 {getCat(acc.suggested_category).label}</span>}</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <select value={selected[acc.account_id] || acc.suggested_category || ''} onChange={e => setSelected(p => ({ ...p, [acc.account_id]: e.target.value }))} style={{ flex: 1, padding: 10, borderRadius: 6, border: `1px solid ${COLORS.border}` }}>
                  <option value="">Select...</option>
                  <optgroup label="Assets">{ACCOUNT_CATEGORIES.filter(c => c.group === 'assets').map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}</optgroup>
                  <optgroup label="Liabilities">{ACCOUNT_CATEGORIES.filter(c => c.group === 'liabilities').map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}</optgroup>
                </select>
                <button onClick={() => handleSave(acc)} disabled={saving[acc.account_id]} style={{ padding: '10px 20px', background: COLORS.positive, color: '#FFF', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>{saving[acc.account_id] ? '...' : 'Save'}</button>
              </div>
            </div>
          ))}
        </Card>
      )}
      {unmapped.length === 0 && <div style={{ background: '#E8F8F0', borderRadius: 8, padding: 20, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}><span style={{ fontSize: 24 }}>✅</span><span style={{ color: '#1E8449', fontWeight: 500 }}>All accounts classified</span></div>}
      <Card title={`Mappings (${mappings.length})`} icon="📋" action={<button onClick={() => setShowAll(!showAll)} style={{ padding: '6px 12px', background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>{showAll ? 'Hide' : 'Show'}</button>}>
        {showAll && (mappings.length === 0 ? <p style={{ color: COLORS.textMuted }}>None yet</p> : mappings.map(m => <div key={m.account_id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: `1px solid ${COLORS.border}` }}><span style={{ flex: 1, fontWeight: 500 }}>{m.account_name}</span><span style={{ color: COLORS.textMuted }}>→</span><span style={{ color: COLORS.primary }}>{getCat(m.category).icon} {getCat(m.category).label}</span><button onClick={() => handleDelete(m.account_id)} style={{ padding: '4px 8px', background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>✕</button></div>))}
      </Card>
    </div>
  );
}

// MANUAL ACCOUNTS
function ManualAccountsPanel({ apiUrl, apiKey, onUpdate }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editBalance, setEditBalance] = useState('');

  const fetchAccounts = useCallback(async () => {
    try { const res = await fetch(`${apiUrl}/api/manual-accounts`, { headers: { 'X-API-Key': apiKey } }); const data = await res.json(); setAccounts(Array.isArray(data) ? data : []); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [apiUrl, apiKey]);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const handleUpdate = async (id) => {
    try { await fetch(`${apiUrl}/api/manual-accounts/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey }, body: JSON.stringify({ balance: parseFloat(editBalance) }) }); setEditingId(null); fetchAccounts(); onUpdate?.(); }
    catch (e) { alert('Failed'); }
  };

  const isStale = (d) => !d || (Date.now() - new Date(d).getTime()) / 86400000 > 90;
  const total = accounts.reduce((s, a) => s + (a.balance || 0), 0);

  if (loading) return <Card title="Manual Accounts" icon="📋"><p style={{ color: COLORS.textMuted }}>Loading...</p></Card>;

  return (
    <Card title="Manual Accounts (AXA/Equitable)" icon="📋">
      <p style={{ margin: '0 0 16px', fontSize: 13, color: COLORS.textMuted }}>Update quarterly from statements.</p>
      {accounts.map(acc => (
        <div key={acc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${COLORS.border}` }}>
          <div><strong>{acc.name}</strong><p style={{ margin: '4px 0 0', fontSize: 12, color: isStale(acc.last_updated) ? COLORS.negative : COLORS.textMuted }}>{isStale(acc.last_updated) && '⚠️ '}{acc.last_updated ? `Updated: ${new Date(acc.last_updated).toLocaleDateString()}` : 'Never'}</p></div>
          {editingId === acc.id ? (
            <div style={{ display: 'flex', gap: 8 }}><input type="number" value={editBalance} onChange={e => setEditBalance(e.target.value)} style={{ width: 100, padding: 8, borderRadius: 4, border: `1px solid ${COLORS.border}` }} /><button onClick={() => handleUpdate(acc.id)} style={{ padding: '8px 12px', background: COLORS.positive, color: '#FFF', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Save</button><button onClick={() => setEditingId(null)} style={{ padding: '8px 12px', background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 4, cursor: 'pointer' }}>Cancel</button></div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{formatCurrency(acc.balance)}</span><button onClick={() => { setEditingId(acc.id); setEditBalance(acc.balance?.toString() || '0'); }} style={{ padding: '6px 12px', background: COLORS.primary, color: '#FFF', border: 'none', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}>Update</button></div>
          )}
        </div>
      ))}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0 0', fontWeight: 600 }}><span>Total</span><span style={{ color: COLORS.primary }}>{formatCurrency(total)}</span></div>
    </Card>
  );
}

// AI ADVISOR
function AIAdvisorPanel({ apiUrl, apiKey, isOpen, onClose }) {
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const suggestions = ["Should I prioritize HELOC or retirement?", "Am I on track for the twin tuition crunch?", "How's my emergency fund?"];

  const askAI = async () => {
    if (!question.trim() || loading) return;
    setMessages(p => [...p, { role: 'user', content: question }]);
    setQuestion('');
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/ai/query`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey }, body: JSON.stringify({ question }) });
      const data = await res.json();
      setMessages(p => [...p, { role: 'assistant', content: data.answer || 'Error' }]);
    } catch (e) { setMessages(p => [...p, { role: 'assistant', content: 'Error: ' + e.message }]); }
    finally { setLoading(false); }
  };

  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', bottom: 80, right: 24, width: 380, height: 500, background: COLORS.bgCard, borderRadius: 16, boxShadow: '0 10px 40px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', zIndex: 1000 }}>
      <div style={{ padding: 16, borderBottom: `1px solid ${COLORS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><h3 style={{ margin: 0, fontSize: 16 }}>🤖 Financial Advisor</h3><button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>×</button></div>
      <div style={{ flex: 1, padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.length === 0 && <div><p style={{ color: COLORS.textMuted, fontSize: 13, marginBottom: 12 }}>Ask me:</p>{suggestions.map(s => <button key={s} onClick={() => setQuestion(s)} style={{ display: 'block', width: '100%', padding: 10, marginBottom: 8, background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 12, cursor: 'pointer', textAlign: 'left' }}>{s}</button>)}</div>}
        {messages.map((m, i) => <div key={i} style={{ padding: 12, borderRadius: 12, background: m.role === 'user' ? COLORS.primary : COLORS.bg, color: m.role === 'user' ? '#FFF' : COLORS.text, alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%', fontSize: 13, whiteSpace: 'pre-wrap' }}>{m.content}</div>)}
        {loading && <div style={{ color: COLORS.textMuted }}>Thinking...</div>}
      </div>
      <div style={{ padding: 12, borderTop: `1px solid ${COLORS.border}`, display: 'flex', gap: 8 }}><input value={question} onChange={e => setQuestion(e.target.value)} onKeyDown={e => e.key === 'Enter' && askAI()} placeholder="Ask..." style={{ flex: 1, padding: 10, border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 14 }} /><button onClick={askAI} disabled={loading} style={{ padding: '10px 16px', background: COLORS.positive, color: '#FFF', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>→</button></div>
    </div>
  );
}

// MAIN DASHBOARD
export default function GoodlevDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => sessionStorage.getItem('dashboard_authenticated') === 'true');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [periodType, setPeriodType] = useState('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [budgetVsActual, setBudgetVsActual] = useState(null);
  const [netWorth, setNetWorth] = useState(null);
  const [notes, setNotes] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [allocs, setAllocs] = useState({ heloc: 1961, retirement: 784, emergency: 392, education: 392, vacation: 393 });
  const [scenarioName, setScenarioName] = useState('');

  const apiUrl = import.meta.env.VITE_API_URL || 'https://goodlevdashboard.up.railway.app';
  const apiKey = sessionStorage.getItem('dashboard_api_key') || import.meta.env.VITE_API_KEY || '';
  const period = useMemo(() => getPeriodDates(periodType, selectedDate), [periodType, selectedDate]);
  const surplus = BASELINE.monthlySurplus;
  const remaining = surplus - Object.values(allocs).reduce((a, b) => a + b, 0);

  const api = useCallback(async (ep, opts = {}) => {
    const res = await fetch(`${apiUrl}${ep}`, { ...opts, headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json', ...opts.headers } });
    if (!res.ok) throw new Error(`${res.status}`);
    return res.json();
  }, [apiUrl, apiKey]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [bva, nw, n, s] = await Promise.all([api(`/api/budget-vs-actual?start_date=${period.start}&end_date=${period.end}`), api('/api/net-worth'), api('/api/notes'), api('/api/scenarios')]);
        setBudgetVsActual(bva);
        setNetWorth(nw);
        setNotes(Array.isArray(n) ? n : []);
        setScenarios(Array.isArray(s) ? s : []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [isAuthenticated, period.start, period.end, api]);

  const handleAddNote = async () => { if (!newNote.trim()) return; try { await api('/api/notes', { method: 'POST', body: JSON.stringify({ content: newNote }) }); setNewNote(''); const d = await api('/api/notes'); setNotes(Array.isArray(d) ? d : []); } catch (e) { console.error(e); } };
  const handleDeleteNote = async (id) => { try { await api(`/api/notes/${id}`, { method: 'DELETE' }); const d = await api('/api/notes'); setNotes(Array.isArray(d) ? d : []); } catch (e) { console.error(e); } };
  const handleSaveScenario = async () => { if (!scenarioName.trim()) return; try { await api('/api/scenarios', { method: 'POST', body: JSON.stringify({ name: scenarioName, allocations: allocs }) }); setScenarioName(''); const d = await api('/api/scenarios'); setScenarios(Array.isArray(d) ? d : []); } catch (e) { console.error(e); } };
  const refreshNetWorth = async () => { try { const d = await api('/api/net-worth'); setNetWorth(d); } catch (e) { console.error(e); } };

  if (!isAuthenticated) return <LoginScreen onLogin={() => setIsAuthenticated(true)} />;

  const tabs = [{ id: 'dashboard', label: '📊 Dashboard' }, { id: 'goals', label: '🎯 Goals' }, { id: 'accounts', label: '💳 Accounts' }, { id: 'notes', label: '📝 Notes' }];

  return (
    <div style={{ minHeight: '100vh', background: COLORS.bg }}>
      <header style={{ background: `linear-gradient(135deg, ${COLORS.primary} 0%, #0A1F33 100%)`, color: '#FFF', padding: '16px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div><h1 style={{ margin: 0, fontSize: 22 }}>🏦 Goodlev Dashboard</h1><p style={{ margin: '4px 0 0', opacity: 0.8, fontSize: 13 }}>Financial Planning</p></div>
            <div style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.15)', borderRadius: 8 }}>Surplus: <strong>{formatCurrency(surplus)}</strong>/mo</div>
          </div>
          <nav style={{ marginTop: 20, display: 'flex', gap: 4, flexWrap: 'wrap' }}>{tabs.map(t => <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ padding: '10px 18px', background: activeTab === t.id ? COLORS.accent : 'transparent', color: '#FFF', border: 'none', borderRadius: '8px 8px 0 0', fontWeight: activeTab === t.id ? 600 : 400, cursor: 'pointer', fontSize: 14 }}>{t.label}</button>)}</nav>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
        {activeTab === 'dashboard' && (
          <div>
            <div style={{ marginBottom: 24 }}><PeriodSelector periodType={periodType} setPeriodType={setPeriodType} selectedDate={selectedDate} setSelectedDate={setSelectedDate} /></div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
              <KPICard label="Net Worth" value={formatCurrency(netWorth?.net_worth)} icon="💰" color={COLORS.primary} />
              <KPICard label="Assets" value={formatCurrency(netWorth?.total_assets)} icon="📈" color={COLORS.positive} />
              <KPICard label="Liabilities" value={formatCurrency(netWorth?.total_liabilities)} icon="📉" color={COLORS.negative} />
              <KPICard label="Surplus" value={formatCurrency(surplus)} icon="💵" color={COLORS.accent} />
            </div>
            {netWorth?.has_warnings && <div style={{ background: '#FEF3E2', border: `1px solid ${COLORS.warning}`, borderRadius: 8, padding: 16, marginBottom: 24 }}><strong style={{ color: '#8B5A00' }}>⚠️ {netWorth.unmapped_count} account(s) need classification</strong><p style={{ margin: '4px 0 0', fontSize: 13, color: '#8B5A00' }}>Go to Accounts tab.</p></div>}
            <Card title={`Budget vs Actual - ${period.label}`} icon="📊">
              {loading ? <p style={{ color: COLORS.textMuted }}>Loading...</p> : budgetVsActual?.categories ? (
                <div>
                  <div style={{ display: 'flex', gap: 24, marginBottom: 20, flexWrap: 'wrap' }}>
                    <div><p style={{ margin: 0, fontSize: 13, color: COLORS.textMuted }}>Budgeted</p><p style={{ margin: '4px 0', fontSize: 24, fontWeight: 700 }}>{formatCurrency(budgetVsActual.totals?.budgeted)}</p></div>
                    <div><p style={{ margin: 0, fontSize: 13, color: COLORS.textMuted }}>Actual</p><p style={{ margin: '4px 0', fontSize: 24, fontWeight: 700 }}>{formatCurrency(budgetVsActual.totals?.actual)}</p></div>
                    <div><p style={{ margin: 0, fontSize: 13, color: COLORS.textMuted }}>Variance</p><p style={{ margin: '4px 0', fontSize: 24, fontWeight: 700, color: budgetVsActual.totals?.variance >= 0 ? COLORS.positive : COLORS.negative }}>{budgetVsActual.totals?.variance >= 0 ? '+' : ''}{formatCurrency(budgetVsActual.totals?.variance)}</p></div>
                  </div>
                  <ResponsiveContainer width="100%" height={300}><BarChart data={budgetVsActual.categories.slice(0, 10)} layout="vertical"><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" tickFormatter={v => `$${(v/1000).toFixed(0)}k`} /><YAxis type="category" dataKey="category" width={100} tick={{ fontSize: 12 }} /><Tooltip formatter={v => formatCurrency(v)} /><Legend /><Bar dataKey="budgeted" fill={COLORS.info} name="Budget" /><Bar dataKey="actual" fill={COLORS.accent} name="Actual" /></BarChart></ResponsiveContainer>
                </div>
              ) : <p style={{ color: COLORS.textMuted }}>No data</p>}
            </Card>
          </div>
        )}

        {activeTab === 'goals' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24 }}>
            <Card title="Surplus Allocation" icon="🎯">
              <p style={{ margin: '0 0 16px', fontSize: 13, color: COLORS.textMuted }}>Surplus: {formatCurrency(surplus)} | Remaining: <span style={{ color: remaining < 0 ? COLORS.negative : COLORS.positive }}>{formatCurrency(remaining)}</span></p>
              {Object.entries(allocs).map(([k, v]) => (<div key={k} style={{ marginBottom: 16 }}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><label style={{ textTransform: 'capitalize' }}>{k}</label><span style={{ fontWeight: 600 }}>{formatCurrency(v)}</span></div><input type="range" min={0} max={surplus} value={v} onChange={e => setAllocs(p => ({ ...p, [k]: parseInt(e.target.value) }))} style={{ width: '100%' }} /></div>))}
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${COLORS.border}` }}><div style={{ display: 'flex', gap: 8 }}><input placeholder="Scenario name..." value={scenarioName} onChange={e => setScenarioName(e.target.value)} style={{ flex: 1, padding: 10, border: `1px solid ${COLORS.border}`, borderRadius: 6 }} /><button onClick={handleSaveScenario} style={{ padding: '10px 16px', background: COLORS.primary, color: '#FFF', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Save</button></div></div>
            </Card>
            <Card title="Saved Scenarios" icon="📁">
              {scenarios.length === 0 ? <p style={{ color: COLORS.textMuted }}>None saved</p> : scenarios.map(s => (<div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${COLORS.border}` }}><div><strong>{s.name}</strong><p style={{ margin: '4px 0 0', fontSize: 12, color: COLORS.textMuted }}>HELOC: {formatCurrency(s.allocations?.heloc)}</p></div><button onClick={() => setAllocs(s.allocations)} style={{ padding: '8px 16px', background: COLORS.accent, color: '#FFF', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Load</button></div>))}
            </Card>
            <Card title="HELOC Payoff" icon="🏡">
              <p style={{ margin: '0 0 16px', fontSize: 13, color: COLORS.textMuted }}>Balance: {formatCurrency(BASELINE.helocBalance)} @ {(BASELINE.helocRate * 100).toFixed(2)}% | Extra: {formatCurrency(allocs.heloc)}/mo</p>
              <ResponsiveContainer width="100%" height={200}><AreaChart data={Array.from({ length: 84 }, (_, i) => { let bal = BASELINE.helocBalance; const pmt = BASELINE.helocPayment + allocs.heloc; for (let m = 0; m < i; m++) { const int = bal * BASELINE.helocRate / 12; bal = Math.max(0, bal - (pmt - int)); } return { month: i, balance: Math.round(bal) }; })}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" tickFormatter={v => `${Math.floor(v/12)}y`} /><YAxis tickFormatter={v => `$${(v/1000).toFixed(0)}k`} /><Tooltip formatter={v => formatCurrency(v)} /><Area type="monotone" dataKey="balance" fill={COLORS.negative} fillOpacity={0.3} stroke={COLORS.negative} /></AreaChart></ResponsiveContainer>
            </Card>
            <Card title="Retirement Projection" icon="📈">
              <p style={{ margin: '0 0 16px', fontSize: 13, color: COLORS.textMuted }}>Current: {formatCurrency(BASELINE.totalRetirement)} | Baseline + {formatCurrency(allocs.retirement * 12)}/yr extra</p>
              <ResponsiveContainer width="100%" height={200}><AreaChart data={Array.from({ length: 21 }, (_, i) => { let bal = BASELINE.totalRetirement; for (let y = 0; y < i; y++) bal = bal * 1.07 + BASELINE.annualRetirementContrib + allocs.retirement * 12; return { year: 40 + i, balance: Math.round(bal) }; })}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="year" /><YAxis tickFormatter={v => `$${(v/1000000).toFixed(1)}M`} /><Tooltip formatter={v => formatCurrency(v)} /><Area type="monotone" dataKey="balance" fill={COLORS.positive} fillOpacity={0.3} stroke={COLORS.positive} /></AreaChart></ResponsiveContainer>
            </Card>
          </div>
        )}

        {activeTab === 'accounts' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24 }}>
            <AccountMappingPanel apiUrl={apiUrl} apiKey={apiKey} onMappingChange={refreshNetWorth} />
            <ManualAccountsPanel apiUrl={apiUrl} apiKey={apiKey} onUpdate={refreshNetWorth} />
            {netWorth && (
              <Card title="Net Worth Breakdown" icon="💰">
                <div style={{ marginBottom: 16 }}><h4 style={{ margin: '0 0 12px', color: COLORS.positive }}>Assets ({formatCurrency(netWorth.total_assets)})</h4>{Object.entries(netWorth.assets || {}).filter(([_, v]) => v > 0).map(([k, v]) => <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${COLORS.border}` }}><span style={{ textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}</span><span style={{ fontWeight: 600 }}>{formatCurrency(v)}</span></div>)}</div>
                <div><h4 style={{ margin: '0 0 12px', color: COLORS.negative }}>Liabilities ({formatCurrency(netWorth.total_liabilities)})</h4>{Object.entries(netWorth.liabilities || {}).filter(([_, v]) => v > 0).map(([k, v]) => <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${COLORS.border}` }}><span style={{ textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}</span><span style={{ fontWeight: 600, color: COLORS.negative }}>{formatCurrency(v)}</span></div>)}</div>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'notes' && (
          <Card title="Financial Notes" icon="📝">
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}><input placeholder="Add a note..." value={newNote} onChange={e => setNewNote(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddNote()} style={{ flex: 1, padding: 12, border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 14 }} /><button onClick={handleAddNote} style={{ padding: '12px 20px', background: COLORS.primary, color: '#FFF', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Add</button></div>
            {notes.length === 0 ? <p style={{ color: COLORS.textMuted }}>No notes yet.</p> : notes.map(n => <div key={n.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '12px 0', borderBottom: `1px solid ${COLORS.border}` }}><div><p style={{ margin: 0 }}>{n.content}</p><p style={{ margin: '4px 0 0', fontSize: 12, color: COLORS.textMuted }}>{new Date(n.created_at).toLocaleDateString()}</p></div><button onClick={() => handleDeleteNote(n.id)} style={{ padding: '4px 8px', background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 4, cursor: 'pointer' }}>×</button></div>)}
          </Card>
        )}
      </main>

      <button onClick={() => setAiOpen(!aiOpen)} style={{ position: 'fixed', bottom: 24, right: 24, width: 56, height: 56, borderRadius: '50%', background: aiOpen ? COLORS.textMuted : COLORS.accent, color: '#FFF', border: 'none', fontSize: 28, cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{aiOpen ? '×' : '🤖'}</button>
      <AIAdvisorPanel apiUrl={apiUrl} apiKey={apiKey} isOpen={aiOpen} onClose={() => setAiOpen(false)} />
      <footer style={{ padding: 16, textAlign: 'center', color: COLORS.textMuted, fontSize: 11, borderTop: `1px solid ${COLORS.border}` }}>Goodlev Dashboard v4.0</footer>
    </div>
  );
}
