import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area, ReferenceLine, Legend, PieChart, Pie, Cell } from 'recharts';

const COLORS = {
  primary: '#0F2942',
  accent: '#D4A84B',
  positive: '#2ECC71',
  negative: '#E74C3C',
  warning: '#F39C12',
  plan: '#3498DB',
  heloc: '#E74C3C',
  retirement: '#2ECC71',
  education: '#3498DB',
  emergency: '#F39C12',
  vacation: '#9B59B6',
  bg: '#F8F9FA',
  bgCard: '#FFFFFF',
  text: '#2C3E50',
  textLight: '#7F8C8D',
  textMuted: '#95A5A6',
  border: '#E8ECF0',
};

const CHART_COLORS = ['#3498DB', '#2ECC71', '#E74C3C', '#F39C12', '#9B59B6', '#1ABC9C', '#E91E63', '#00BCD4'];

const formatCurrency = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value || 0);
const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

// =============================================================================
// LOGIN SCREEN
// =============================================================================
function LoginScreen({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    const correctPassword = import.meta.env.VITE_DASHBOARD_PASSWORD;
    if (password === correctPassword) {
      sessionStorage.setItem('dashboard_authenticated', 'true');
      onLogin();
    } else {
      setError('Incorrect password');
      setPassword('');
    }
  };
  
  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${COLORS.primary} 0%, #0A1F33 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ background: COLORS.bgCard, borderRadius: 16, padding: 40, width: '100%', maxWidth: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏦</div>
          <h1 style={{ margin: 0, fontSize: 24, color: COLORS.primary, fontWeight: 700 }}>Family Dashboard</h1>
          <p style={{ margin: '8px 0 0 0', color: COLORS.textMuted, fontSize: 14 }}>Enter password to continue</p>
        </div>
        <form onSubmit={handleSubmit}>
          <input type="password" value={password} onChange={e => { setPassword(e.target.value); setError(''); }} placeholder="Password" autoFocus
            style={{ width: '100%', padding: '14px 16px', fontSize: 16, border: `2px solid ${error ? COLORS.negative : COLORS.border}`, borderRadius: 8, marginBottom: 16, outline: 'none', boxSizing: 'border-box' }} />
          {error && <div style={{ color: COLORS.negative, fontSize: 14, marginBottom: 16, textAlign: 'center' }}>{error}</div>}
          <button type="submit" style={{ width: '100%', padding: '14px 16px', fontSize: 16, fontWeight: 600, color: '#FFF', background: COLORS.accent, border: 'none', borderRadius: 8, cursor: 'pointer' }}>Sign In</button>
        </form>
      </div>
    </div>
  );
}

// =============================================================================
// PERIOD SELECTOR
// =============================================================================
function PeriodSelector({ period, onChange }) {
  const [periodType, setPeriodType] = useState('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const getPeriodDates = useCallback((type, date) => {
    const d = new Date(date);
    let start, end;
    
    if (type === 'month') {
      start = new Date(d.getFullYear(), d.getMonth(), 1);
      end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    } else if (type === 'quarter') {
      const q = Math.floor(d.getMonth() / 3);
      start = new Date(d.getFullYear(), q * 3, 1);
      end = new Date(d.getFullYear(), (q + 1) * 3, 0);
    } else if (type === 'year') {
      start = new Date(d.getFullYear(), 0, 1);
      end = new Date(d.getFullYear(), 11, 31);
    } else if (type === 'ytd') {
      start = new Date(d.getFullYear(), 0, 1);
      end = new Date();
    }
    
    return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0], label: formatPeriodLabel(type, start) };
  }, []);
  
  const formatPeriodLabel = (type, date) => {
    if (type === 'month') return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    if (type === 'quarter') return `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`;
    if (type === 'year') return date.getFullYear().toString();
    if (type === 'ytd') return `YTD ${date.getFullYear()}`;
    return '';
  };
  
  useEffect(() => { onChange(getPeriodDates(periodType, selectedDate)); }, [periodType, selectedDate, getPeriodDates, onChange]);
  
  const navigate = (direction) => {
    const d = new Date(selectedDate);
    if (periodType === 'month') d.setMonth(d.getMonth() + direction);
    else if (periodType === 'quarter') d.setMonth(d.getMonth() + (direction * 3));
    else if (periodType === 'year') d.setFullYear(d.getFullYear() + direction);
    setSelectedDate(d);
  };
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', gap: 4 }}>
        {['month', 'quarter', 'year', 'ytd'].map(type => (
          <button key={type} onClick={() => setPeriodType(type)} style={{
            padding: '6px 12px', borderRadius: 6, border: `1px solid ${periodType === type ? COLORS.accent : COLORS.border}`,
            background: periodType === type ? `${COLORS.accent}20` : 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: COLORS.text, textTransform: 'capitalize'
          }}>{type === 'ytd' ? 'YTD' : type}</button>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={() => navigate(-1)} style={{ width: 32, height: 32, borderRadius: 6, border: `1px solid ${COLORS.border}`, background: 'transparent', cursor: 'pointer', fontSize: 16 }}>←</button>
        <span style={{ fontWeight: 600, minWidth: 140, textAlign: 'center' }}>{getPeriodDates(periodType, selectedDate).label}</span>
        <button onClick={() => navigate(1)} style={{ width: 32, height: 32, borderRadius: 6, border: `1px solid ${COLORS.border}`, background: 'transparent', cursor: 'pointer', fontSize: 16 }}>→</button>
      </div>
    </div>
  );
}

// =============================================================================
// AI CHAT COMPONENT (Floating)
// =============================================================================
function AIChat({ isOpen, onClose, context }) {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const askAI = async () => {
    if (!question.trim() || loading) return;
    setLoading(true);
    const userMsg = question;
    setQuestion('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [...messages, { role: 'user', content: `${context}\n\nQUESTION: ${userMsg}` }],
          system: `You are a knowledgeable financial advisor for the Goodlev family. Be specific with numbers. Keep responses concise (2-3 paragraphs). Consider their special circumstances: 3 kids (ages 7,6,6) who will overlap in college 2037-2039, eldest has autism requiring therapy (~$3K/mo), HELOC draw period ends Jan 2032, Eric works 80% at Fox Chase Cancer Center, Lauren is clergy.`
        })
      });
      const data = await response.json();
      const answer = data.content?.[0]?.text || 'Unable to get response.';
      setMessages(prev => [...prev, { role: 'assistant', content: answer }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error connecting to AI. Make sure you have API access configured.' }]);
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', bottom: 80, right: 24, width: 400, maxHeight: '70vh', background: COLORS.bgCard, borderRadius: 16, boxShadow: '0 10px 40px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', zIndex: 1000 }}>
      <div style={{ padding: '16px 20px', background: COLORS.primary, color: '#FFF', borderRadius: '16px 16px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 600 }}>🤖 AI Financial Advisor</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#FFF', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>×</button>
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 350 }}>
        {messages.length === 0 && (
          <div style={{ color: COLORS.textMuted, fontSize: 13, textAlign: 'center', padding: 20 }}>
            Ask me anything about your finances!
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
              {["Should I prioritize HELOC or retirement?", "Am I on track for my goals?", "How should I handle 3 kids in college?", "What if rates drop - should I refi?"].map(q => (
                <button key={q} onClick={() => setQuestion(q)} style={{ padding: '8px 12px', background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 12, cursor: 'pointer', textAlign: 'left' }}>{q}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{ padding: 12, borderRadius: 12, background: m.role === 'user' ? COLORS.accent : COLORS.bg, color: m.role === 'user' ? '#FFF' : COLORS.text, alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%', fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
            {m.content}
          </div>
        ))}
        {loading && <div style={{ color: COLORS.textMuted, fontSize: 13, padding: 8 }}>Thinking...</div>}
      </div>

      <div style={{ padding: 12, borderTop: `1px solid ${COLORS.border}`, display: 'flex', gap: 8 }}>
        <input value={question} onChange={e => setQuestion(e.target.value)} onKeyDown={e => e.key === 'Enter' && askAI()} placeholder="Ask a question..."
          style={{ flex: 1, padding: '10px 14px', border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 14, outline: 'none' }} />
        <button onClick={askAI} disabled={loading || !question.trim()} style={{ padding: '10px 16px', background: loading ? COLORS.textMuted : COLORS.accent, color: '#FFF', border: 'none', borderRadius: 8, fontWeight: 600, cursor: loading ? 'wait' : 'pointer' }}>→</button>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN DASHBOARD
// =============================================================================
export default function GoodlevDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => sessionStorage.getItem('dashboard_authenticated') === 'true');
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const apiUrl = import.meta.env.VITE_API_URL || 'https://goodlevdashboard.up.railway.app';
  const apiKey = import.meta.env.VITE_API_KEY || '';
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [currentPeriod, setCurrentPeriod] = useState({ start: '', end: '', label: '' });
  
  // Data State
  const [accounts, setAccounts] = useState([]);
  const [spendingData, setSpendingData] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);
  const [monthlyTrends, setMonthlyTrends] = useState(null);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  
  // Drill-down
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryTransactions, setCategoryTransactions] = useState([]);
  
  // Goals & Scenarios
  const [allocations, setAllocations] = useState({ heloc: 1961, retirement: 784, emergency: 392, education: 392, vacation: 393 });
  const [scenarios, setScenarios] = useState([]);
  const [scenarioName, setScenarioName] = useState('');
  
  // AI Chat
  const [aiChatOpen, setAiChatOpen] = useState(false);

  const surplus = 3922;
  const totalAllocated = Object.values(allocations).reduce((a, b) => a + b, 0);
  const remaining = surplus - totalAllocated;

  const apiFetch = useCallback(async (endpoint, options = {}) => {
    const res = await fetch(`${apiUrl}${endpoint}`, {
      ...options,
      headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json', ...options.headers }
    });
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return res.json();
  }, [apiUrl, apiKey]);

  // Check connection & fetch accounts (refreshes on tab focus)
  const fetchAccounts = useCallback(() => {
    if (apiKey && isConnected) {
      apiFetch('/api/accounts').then(data => setAccounts(data || [])).catch(console.error);
    }
  }, [apiKey, isConnected, apiFetch]);

  useEffect(() => {
    if (apiKey && isAuthenticated) {
      fetch(`${apiUrl}/health`, { headers: { 'X-API-Key': apiKey } })
        .then(res => { if (res.ok) { setIsConnected(true); } })
        .catch(() => {});
    }
  }, [isAuthenticated, apiKey, apiUrl]);

  useEffect(() => {
    if (isConnected) fetchAccounts();
  }, [isConnected, fetchAccounts]);

  // Refresh accounts when window regains focus (real-time updates)
  useEffect(() => {
    const onFocus = () => fetchAccounts();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchAccounts]);

  // Fetch spending data
  useEffect(() => {
    if (!currentPeriod.start || !isConnected) return;
    setLoading(true);
    apiFetch(`/api/spending/by-category?start_date=${currentPeriod.start}&end_date=${currentPeriod.end}`)
      .then(data => setSpendingData(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [currentPeriod, isConnected, apiFetch]);

  // Fetch comparison
  useEffect(() => {
    if (!currentPeriod.start || !isConnected) return;
    const start = new Date(currentPeriod.start);
    const end = new Date(currentPeriod.end);
    const duration = end - start;
    const prevEnd = new Date(start - 1);
    const prevStart = new Date(prevEnd - duration);
    apiFetch(`/api/spending/compare?period1_start=${prevStart.toISOString().split('T')[0]}&period1_end=${prevEnd.toISOString().split('T')[0]}&period2_start=${currentPeriod.start}&period2_end=${currentPeriod.end}`)
      .then(data => setComparisonData(data))
      .catch(console.error);
  }, [currentPeriod, isConnected, apiFetch]);

  // Fetch trends
  useEffect(() => {
    if (!isConnected) return;
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 6);
    apiFetch(`/api/spending/by-month?start_date=${start.toISOString().split('T')[0]}&end_date=${end.toISOString().split('T')[0]}`)
      .then(data => setMonthlyTrends(data))
      .catch(console.error);
  }, [isConnected, apiFetch]);

  // Fetch notes
  useEffect(() => {
    if (!isConnected) return;
    apiFetch('/api/notes').then(data => setNotes(Array.isArray(data) ? data : [])).catch(console.error);
  }, [isConnected, apiFetch]);

  const drillDownCategory = async (categoryName) => {
    setSelectedCategory(categoryName);
    setLoading(true);
    try {
      const data = await apiFetch(`/api/transactions/search?start_date=${currentPeriod.start}&end_date=${currentPeriod.end}&category=${encodeURIComponent(categoryName)}`);
      setCategoryTransactions(data.transactions || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const addNote = async () => {
    if (!newNote.trim()) return;
    try {
      const note = await apiFetch('/api/notes', { method: 'POST', body: JSON.stringify({ content: newNote, category: 'general' }) });
      setNotes([...notes, note]);
      setNewNote('');
    } catch (e) { console.error(e); }
  };

  const deleteNote = async (noteId) => {
    try {
      await apiFetch(`/api/notes/${noteId}`, { method: 'DELETE' });
      setNotes(notes.filter(n => n.id !== noteId));
    } catch (e) { console.error(e); }
  };

  // Scenarios - calculations
  const helocPayoff = useMemo(() => {
    const balance = 275809, rate = 0.0632 / 12, payment = 1546 + allocations.heloc;
    let months = 0, b = balance, interest = 0;
    while (b > 0 && months < 360) { const i = b * rate; interest += i; b = Math.max(0, b - (payment - i)); months++; }
    const date = new Date(); date.setMonth(date.getMonth() + months);
    return { months, date: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), interest: Math.round(interest) };
  }, [allocations.heloc]);

  const baselineHelocInterest = useMemo(() => {
    const balance = 275809, rate = 0.0632 / 12, payment = 1546;
    let b = balance, interest = 0, months = 0;
    while (b > 0 && months < 360) { const i = b * rate; interest += i; b = Math.max(0, b - (payment - i)); months++; }
    return Math.round(interest);
  }, []);

  const retirementAt60 = useMemo(() => {
    const years = 20;
    const monthlyReturn = 0.07 / 12;
    const monthlyContrib = 3435 + allocations.retirement;
    let balance = 645449;
    for (let m = 0; m < years * 12; m++) balance = balance * (1 + monthlyReturn) + monthlyContrib;
    return Math.round(balance);
  }, [allocations.retirement]);

  const saveScenario = () => {
    if (!scenarioName.trim()) return;
    setScenarios([...scenarios, {
      id: Date.now(), name: scenarioName, createdAt: new Date().toISOString(),
      allocations: { ...allocations },
      projections: { helocPayoff: helocPayoff.date, helocMonths: helocPayoff.months, interestSaved: baselineHelocInterest - helocPayoff.interest, retirementAt60 }
    }]);
    setScenarioName('');
  };

  const loadScenario = (s) => setAllocations({ ...s.allocations });

  const handleLogout = () => { sessionStorage.removeItem('dashboard_authenticated'); setIsAuthenticated(false); };

  // AI Context - comprehensive snapshot
  const aiContext = `
FINANCIAL SNAPSHOT (${new Date().toLocaleDateString()}):
- Monthly Surplus: ${formatCurrency(surplus)}
- Current Allocation: HELOC +${formatCurrency(allocations.heloc)}, Retirement +${formatCurrency(allocations.retirement)}, Emergency +${formatCurrency(allocations.emergency)}, Education +${formatCurrency(allocations.education)}, Vacation +${formatCurrency(allocations.vacation)}

DEBT:
- HELOC: $275,809 @ 6.32%, draw period ends Jan 2032
- With current allocation: Payoff ${helocPayoff.date} (${helocPayoff.months} months), saving ${formatCurrency(baselineHelocInterest - helocPayoff.interest)} vs minimum
- Mortgage: $468K @ 2.25% (keep this low rate)

RETIREMENT:
- Current: $645,449 | Target: $4M at 60
- Projected at 60: ${formatCurrency(retirementAt60)}
- Monthly contrib: $3,435 baseline + ${formatCurrency(allocations.retirement)} extra

SAVINGS:
- Emergency: $24,049 / $56,000 target (${Math.round(24049/56000*100)}%)
- 529 College: $85,747 (3 kids, overlap 2037-2039)
- Vacation: ${formatCurrency(allocations.vacation)}/mo

CURRENT PERIOD SPENDING: ${spendingData ? formatCurrency(spendingData.total_spending) : 'Loading...'}
${comparisonData ? `vs Previous Period: ${comparisonData.total_change > 0 ? '+' : ''}${formatCurrency(comparisonData.total_change)} (${comparisonData.percent_change}%)` : ''}
${comparisonData?.biggest_increases?.length ? `Top Increases: ${comparisonData.biggest_increases.slice(0,3).map(c => `${c.category} +${formatCurrency(c.change)}`).join(', ')}` : ''}
${comparisonData?.biggest_decreases?.length ? `Savings Found: ${comparisonData.biggest_decreases.slice(0,3).map(c => `${c.category} ${formatCurrency(c.change)}`).join(', ')}` : ''}

ACCOUNTS: ${accounts.length} connected
${accounts.filter(a => !a.closed).slice(0,5).map(a => `- ${a.name}: ${formatCurrency(a.balance/1000)}`).join('\n')}
`;

  if (!isAuthenticated) return <LoginScreen onLogin={() => setIsAuthenticated(true)} />;

  return (
    <div style={{ minHeight: '100vh', background: COLORS.bg, fontFamily: 'system-ui, sans-serif' }}>
      {/* HEADER */}
      <header style={{ background: `linear-gradient(135deg, ${COLORS.primary} 0%, #0A1F33 100%)`, padding: '16px 24px', color: '#FFF' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Family Financial Dashboard</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ padding: '6px 12px', background: isConnected ? 'rgba(46,204,113,0.2)' : 'rgba(243,156,18,0.2)', borderRadius: 6, fontSize: 12 }}>
                {isConnected ? `● ${accounts.length} Accounts` : '○ Demo Mode'}
              </div>
              <button onClick={handleLogout} style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.1)', color: '#FFF', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Logout</button>
            </div>
          </div>
          <nav style={{ marginTop: 16, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {[
              { id: 'dashboard', label: '📊 Dashboard' },
              { id: 'trends', label: '📈 Trends' },
              { id: 'drilldown', label: '🔍 Drill-Down' },
              { id: 'goals', label: '🎯 Goals' },
              { id: 'notes', label: '📝 Notes' },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                padding: '8px 16px', background: activeTab === tab.id ? COLORS.accent : 'transparent',
                color: '#FFF', border: 'none', borderRadius: '6px 6px 0 0', fontWeight: activeTab === tab.id ? 600 : 400, cursor: 'pointer', fontSize: 13,
              }}>{tab.label}</button>
            ))}
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: 1400, margin: '0 auto', padding: 24 }}>
        
        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div>
            <div style={{ marginBottom: 24 }}><PeriodSelector period={currentPeriod} onChange={setCurrentPeriod} /></div>
            
            {/* Accounts Overview */}
            {accounts.length > 0 && (
              <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${COLORS.border}`, marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h3 style={{ margin: 0, fontSize: 14, color: COLORS.textMuted }}>Connected Accounts</h3>
                  <button onClick={fetchAccounts} style={{ padding: '4px 8px', background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 4, cursor: 'pointer', fontSize: 11, color: COLORS.textMuted }}>↻ Refresh</button>
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {accounts.filter(a => !a.closed).map(a => (
                    <div key={a.id} style={{ padding: '10px 14px', background: COLORS.bg, borderRadius: 8, fontSize: 13, minWidth: 120 }}>
                      <div style={{ fontWeight: 600 }}>{a.name}</div>
                      <div style={{ color: a.balance < 0 ? COLORS.negative : COLORS.positive, fontWeight: 600 }}>{formatCurrency(a.balance / 1000)}</div>
                      <div style={{ fontSize: 10, color: COLORS.textMuted }}>{a.type}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {loading && <div style={{ padding: 40, textAlign: 'center', color: COLORS.textMuted }}>Loading...</div>}
            
            {spendingData && !loading && (
              <>
                {/* Summary Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
                  <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${COLORS.border}` }}>
                    <div style={{ fontSize: 12, color: COLORS.textMuted }}>Period Spending</div>
                    <div style={{ fontSize: 26, fontWeight: 700, color: COLORS.negative }}>{formatCurrency(spendingData.total_spending)}</div>
                    {comparisonData && <div style={{ fontSize: 12, color: comparisonData.total_change > 0 ? COLORS.negative : COLORS.positive }}>{comparisonData.total_change > 0 ? '↑' : '↓'} {formatCurrency(Math.abs(comparisonData.total_change))} vs prev</div>}
                  </div>
                  <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${COLORS.border}` }}>
                    <div style={{ fontSize: 12, color: COLORS.textMuted }}>Monthly Surplus</div>
                    <div style={{ fontSize: 26, fontWeight: 700, color: COLORS.positive }}>{formatCurrency(surplus)}</div>
                    <div style={{ fontSize: 12, color: COLORS.textLight }}>to allocate</div>
                  </div>
                  <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${COLORS.border}` }}>
                    <div style={{ fontSize: 12, color: COLORS.textMuted }}>HELOC Payoff</div>
                    <div style={{ fontSize: 26, fontWeight: 700, color: COLORS.heloc }}>{helocPayoff.date}</div>
                    <div style={{ fontSize: 12, color: COLORS.textLight }}>{helocPayoff.months} months</div>
                  </div>
                  <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${COLORS.border}` }}>
                    <div style={{ fontSize: 12, color: COLORS.textMuted }}>Retirement @ 60</div>
                    <div style={{ fontSize: 26, fontWeight: 700, color: COLORS.retirement }}>{formatCurrency(retirementAt60)}</div>
                    <div style={{ fontSize: 12, color: retirementAt60 >= 4000000 ? COLORS.positive : COLORS.warning }}>{retirementAt60 >= 4000000 ? '✓ On track' : 'Below $4M target'}</div>
                  </div>
                </div>

                {/* Charts */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                  <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 24, border: `1px solid ${COLORS.border}` }}>
                    <h3 style={{ margin: '0 0 16px 0', color: COLORS.text, fontSize: 16 }}>Spending by Category</h3>
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie data={spendingData.categories?.slice(0, 8)} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={90}>
                          {spendingData.categories?.slice(0, 8).map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={v => formatCurrency(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 24, border: `1px solid ${COLORS.border}` }}>
                    <h3 style={{ margin: '0 0 16px 0', color: COLORS.text, fontSize: 16 }}>Top Categories</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {spendingData.categories?.slice(0, 8).map((cat, i) => (
                        <div key={cat.category} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '4px 0' }} onClick={() => { setActiveTab('drilldown'); setTimeout(() => drillDownCategory(cat.category), 100); }}>
                          <div style={{ width: 12, height: 12, borderRadius: 2, background: CHART_COLORS[i % CHART_COLORS.length] }} />
                          <div style={{ flex: 1, fontSize: 13 }}>{cat.category}</div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{formatCurrency(cat.amount)}</div>
                          <div style={{ fontSize: 11, color: COLORS.textMuted, width: 35 }}>{cat.percentage}%</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: 12, fontSize: 11, color: COLORS.textMuted }}>Click any category to drill down →</div>
                  </div>
                </div>

                {/* Variance */}
                {comparisonData && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                    <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 24, border: `1px solid ${COLORS.border}` }}>
                      <h3 style={{ margin: '0 0 16px 0', color: COLORS.negative, fontSize: 16 }}>📈 Spending Up</h3>
                      {comparisonData.biggest_increases?.slice(0, 5).map(cat => (
                        <div key={cat.category} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${COLORS.border}`, cursor: 'pointer' }} onClick={() => { setActiveTab('drilldown'); setTimeout(() => drillDownCategory(cat.category), 100); }}>
                          <span style={{ fontSize: 13 }}>{cat.category}</span>
                          <span style={{ color: COLORS.negative, fontWeight: 600, fontSize: 13 }}>+{formatCurrency(cat.change)} ({cat.percent_change}%)</span>
                        </div>
                      ))}
                      {!comparisonData.biggest_increases?.length && <div style={{ color: COLORS.textMuted, fontSize: 13 }}>No increases 🎉</div>}
                    </div>
                    <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 24, border: `1px solid ${COLORS.border}` }}>
                      <h3 style={{ margin: '0 0 16px 0', color: COLORS.positive, fontSize: 16 }}>📉 Savings Found!</h3>
                      {comparisonData.biggest_decreases?.slice(0, 5).map(cat => (
                        <div key={cat.category} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${COLORS.border}` }}>
                          <span style={{ fontSize: 13 }}>{cat.category}</span>
                          <span style={{ color: COLORS.positive, fontWeight: 600, fontSize: 13 }}>{formatCurrency(cat.change)}</span>
                        </div>
                      ))}
                      {!comparisonData.biggest_decreases?.length && <div style={{ color: COLORS.textMuted, fontSize: 13 }}>No decreases</div>}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* TRENDS TAB */}
        {activeTab === 'trends' && (
          <div>
            <h2 style={{ margin: '0 0 24px 0', color: COLORS.text }}>6-Month Spending Trends</h2>
            {monthlyTrends ? (
              <>
                <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 24, border: `1px solid ${COLORS.border}`, marginBottom: 24 }}>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={monthlyTrends.months}>
                      <defs><linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLORS.plan} stopOpacity={0.3} /><stop offset="95%" stopColor={COLORS.plan} stopOpacity={0} /></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                      <XAxis dataKey="month" tick={{ fill: COLORS.textMuted, fontSize: 12 }} />
                      <YAxis tickFormatter={v => `$${(v/1000).toFixed(0)}k`} tick={{ fill: COLORS.textMuted, fontSize: 12 }} />
                      <Tooltip formatter={v => formatCurrency(v)} />
                      <Area type="monotone" dataKey="total" stroke={COLORS.plan} fill="url(#spendGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 24, border: `1px solid ${COLORS.border}` }}>
                  <h3 style={{ margin: '0 0 16px 0', color: COLORS.text, fontSize: 16 }}>Month-over-Month</h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead><tr style={{ borderBottom: `2px solid ${COLORS.border}` }}><th style={{ padding: 12, textAlign: 'left', color: COLORS.textMuted }}>Month</th><th style={{ padding: 12, textAlign: 'right', color: COLORS.textMuted }}>Total</th><th style={{ padding: 12, textAlign: 'right', color: COLORS.textMuted }}>Change</th></tr></thead>
                    <tbody>
                      {monthlyTrends.months?.map((m, i) => {
                        const prev = monthlyTrends.months[i - 1];
                        const change = prev ? m.total - prev.total : 0;
                        return (<tr key={m.month} style={{ borderBottom: `1px solid ${COLORS.border}` }}><td style={{ padding: 12 }}>{m.month}</td><td style={{ padding: 12, textAlign: 'right', fontWeight: 600 }}>{formatCurrency(m.total)}</td><td style={{ padding: 12, textAlign: 'right', color: change > 0 ? COLORS.negative : change < 0 ? COLORS.positive : COLORS.textMuted }}>{i > 0 && ((change > 0 ? '+' : '') + formatCurrency(change))}</td></tr>);
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            ) : <div style={{ padding: 40, textAlign: 'center', color: COLORS.textMuted }}>Loading trends...</div>}
          </div>
        )}

        {/* DRILL-DOWN TAB */}
        {activeTab === 'drilldown' && (
          <div>
            <div style={{ marginBottom: 24 }}><PeriodSelector period={currentPeriod} onChange={setCurrentPeriod} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24 }}>
              <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 16, border: `1px solid ${COLORS.border}`, maxHeight: 600, overflowY: 'auto' }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: 14, color: COLORS.textMuted }}>Categories</h3>
                {spendingData?.categories?.map(cat => (
                  <button key={cat.category} onClick={() => drillDownCategory(cat.category)} style={{
                    display: 'flex', justifyContent: 'space-between', width: '100%', padding: '10px 12px', marginBottom: 4, textAlign: 'left',
                    border: `1px solid ${selectedCategory === cat.category ? COLORS.accent : COLORS.border}`, borderRadius: 6,
                    background: selectedCategory === cat.category ? `${COLORS.accent}15` : 'transparent', cursor: 'pointer', fontSize: 13
                  }}><span style={{ flex: 1 }}>{cat.category}</span><span style={{ fontWeight: 600 }}>{formatCurrency(cat.amount)}</span></button>
                ))}
                {!spendingData?.categories?.length && <div style={{ color: COLORS.textMuted, fontSize: 13 }}>Select a period above</div>}
              </div>
              <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 24, border: `1px solid ${COLORS.border}` }}>
                <h3 style={{ margin: '0 0 16px 0', color: COLORS.text, fontSize: 16 }}>{selectedCategory ? `${selectedCategory} Transactions` : 'Select a category'}</h3>
                {selectedCategory && categoryTransactions.length > 0 && (
                  <div style={{ maxHeight: 500, overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead style={{ position: 'sticky', top: 0, background: COLORS.bgCard }}><tr style={{ borderBottom: `2px solid ${COLORS.border}` }}><th style={{ padding: 10, textAlign: 'left', color: COLORS.textMuted }}>Date</th><th style={{ padding: 10, textAlign: 'left', color: COLORS.textMuted }}>Payee</th><th style={{ padding: 10, textAlign: 'right', color: COLORS.textMuted }}>Amount</th></tr></thead>
                      <tbody>{categoryTransactions.map((t, i) => (<tr key={i} style={{ borderBottom: `1px solid ${COLORS.border}` }}><td style={{ padding: 10 }}>{formatDate(t.date)}</td><td style={{ padding: 10 }}>{t.payee}</td><td style={{ padding: 10, textAlign: 'right', fontWeight: 600, color: t.amount < 0 ? COLORS.negative : COLORS.positive }}>{formatCurrency(Math.abs(t.amount))}</td></tr>))}</tbody>
                    </table>
                    <div style={{ marginTop: 12, padding: 12, background: COLORS.bg, borderRadius: 8, fontSize: 13 }}>
                      <strong>{categoryTransactions.length}</strong> transactions • Total: <strong>{formatCurrency(categoryTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0))}</strong>
                    </div>
                  </div>
                )}
                {selectedCategory && categoryTransactions.length === 0 && !loading && <div style={{ color: COLORS.textMuted }}>No transactions found</div>}
                {loading && <div style={{ color: COLORS.textMuted }}>Loading...</div>}
              </div>
            </div>
          </div>
        )}

        {/* GOALS TAB */}
        {activeTab === 'goals' && (
          <div>
            <h2 style={{ margin: '0 0 8px 0', color: COLORS.text }}>Goal Allocation & Scenarios</h2>
            <p style={{ margin: '0 0 24px 0', color: COLORS.textLight, fontSize: 14 }}>Allocate your {formatCurrency(surplus)}/month surplus and compare scenarios</p>
            
            {/* Allocation Sliders */}
            <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 24, border: `1px solid ${COLORS.border}`, marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ fontWeight: 600 }}>Monthly Surplus: {formatCurrency(surplus)}</span>
                <span style={{ color: remaining >= 0 ? COLORS.positive : COLORS.negative, fontWeight: 600 }}>{remaining >= 0 ? `${formatCurrency(remaining)} unallocated` : `${formatCurrency(Math.abs(remaining))} over`}</span>
              </div>
              <div style={{ height: 10, background: COLORS.border, borderRadius: 5, display: 'flex', overflow: 'hidden', marginBottom: 20 }}>
                {[{ k: 'heloc', c: COLORS.heloc }, { k: 'retirement', c: COLORS.retirement }, { k: 'emergency', c: COLORS.emergency }, { k: 'education', c: COLORS.education }, { k: 'vacation', c: COLORS.vacation }].map(g => (
                  <div key={g.k} style={{ width: `${(allocations[g.k] / surplus) * 100}%`, background: g.c }} />
                ))}
              </div>
              {[
                { key: 'heloc', label: '🏦 HELOC Extra', color: COLORS.heloc, max: 3000 },
                { key: 'retirement', label: '📈 Retirement Extra', color: COLORS.retirement, max: 1500 },
                { key: 'emergency', label: '🛡️ Emergency Fund', color: COLORS.emergency, max: 1000 },
                { key: 'education', label: '🎓 529 College', color: COLORS.education, max: 1000 },
                { key: 'vacation', label: '🏖️ Vacation Fund', color: COLORS.vacation, max: 1000 },
              ].map(g => (
                <div key={g.key} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span style={{ fontSize: 14 }}>{g.label}</span><span style={{ fontWeight: 600, color: g.color }}>{formatCurrency(allocations[g.key])}/mo</span></div>
                  <input type="range" min="0" max={g.max} step="50" value={allocations[g.key]} onChange={e => setAllocations({ ...allocations, [g.key]: Number(e.target.value) })} style={{ width: '100%', accentColor: g.color }} />
                </div>
              ))}
            </div>

            {/* Impact Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
              <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${COLORS.border}`, borderTop: `4px solid ${COLORS.heloc}` }}>
                <h4 style={{ margin: '0 0 8px 0', color: COLORS.heloc, fontSize: 14 }}>🏦 HELOC Payoff</h4>
                <div style={{ fontSize: 24, fontWeight: 700 }}>{helocPayoff.date}</div>
                <div style={{ fontSize: 12, color: COLORS.textLight }}>{helocPayoff.months} months</div>
                <div style={{ fontSize: 12, color: COLORS.positive, marginTop: 4 }}>Save {formatCurrency(baselineHelocInterest - helocPayoff.interest)} interest</div>
              </div>
              <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${COLORS.border}`, borderTop: `4px solid ${COLORS.retirement}` }}>
                <h4 style={{ margin: '0 0 8px 0', color: COLORS.retirement, fontSize: 14 }}>📈 Retirement @ 60</h4>
                <div style={{ fontSize: 24, fontWeight: 700 }}>{formatCurrency(retirementAt60)}</div>
                <div style={{ fontSize: 12, color: retirementAt60 >= 4000000 ? COLORS.positive : COLORS.warning }}>{retirementAt60 >= 4000000 ? '✓ Exceeds $4M target' : `${formatCurrency(4000000 - retirementAt60)} below target`}</div>
              </div>
              <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${COLORS.border}`, borderTop: `4px solid ${COLORS.emergency}` }}>
                <h4 style={{ margin: '0 0 8px 0', color: COLORS.emergency, fontSize: 14 }}>🛡️ Emergency Fund</h4>
                <div style={{ fontSize: 24, fontWeight: 700 }}>{allocations.emergency > 0 ? Math.ceil((56000 - 24049) / allocations.emergency) : '∞'} mo</div>
                <div style={{ fontSize: 12, color: COLORS.textLight }}>to reach $56K target</div>
                <div style={{ height: 6, background: COLORS.border, borderRadius: 3, marginTop: 8 }}><div style={{ width: `${(24049/56000)*100}%`, height: '100%', background: COLORS.emergency, borderRadius: 3 }} /></div>
              </div>
              <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${COLORS.border}`, borderTop: `4px solid ${COLORS.education}` }}>
                <h4 style={{ margin: '0 0 8px 0', color: COLORS.education, fontSize: 14 }}>🎓 529 @ College</h4>
                <div style={{ fontSize: 24, fontWeight: 700 }}>{formatCurrency(85747 + allocations.education * 12 * 11 * 1.03)}</div>
                <div style={{ fontSize: 12, color: COLORS.textLight }}>projected 2037</div>
              </div>
              <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${COLORS.border}`, borderTop: `4px solid ${COLORS.vacation}` }}>
                <h4 style={{ margin: '0 0 8px 0', color: COLORS.vacation, fontSize: 14 }}>🏖️ Vacation Fund</h4>
                <div style={{ fontSize: 24, fontWeight: 700 }}>{formatCurrency(allocations.vacation * 12)}/yr</div>
                <div style={{ fontSize: 12, color: COLORS.textLight }}>{allocations.vacation > 0 ? `${Math.ceil(5000 / allocations.vacation)} mo to $5K` : 'Not funded'}</div>
              </div>
            </div>

            {/* Save Scenario */}
            <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 24, border: `1px solid ${COLORS.border}`, marginBottom: 24 }}>
              <h3 style={{ margin: '0 0 16px 0', color: COLORS.text, fontSize: 16 }}>💾 Save This Scenario</h3>
              <div style={{ display: 'flex', gap: 12 }}>
                <input value={scenarioName} onChange={e => setScenarioName(e.target.value)} placeholder="Scenario name (e.g., 'Aggressive HELOC')" style={{ flex: 1, padding: '10px 14px', border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 14 }} />
                <button onClick={saveScenario} disabled={!scenarioName.trim()} style={{ padding: '10px 20px', background: scenarioName.trim() ? COLORS.accent : COLORS.border, color: '#FFF', border: 'none', borderRadius: 8, fontWeight: 600, cursor: scenarioName.trim() ? 'pointer' : 'not-allowed' }}>Save</button>
              </div>
              <div style={{ marginTop: 12, padding: 12, background: COLORS.bg, borderRadius: 8, fontSize: 12, color: COLORS.textLight }}>
                Current: HELOC +{formatCurrency(allocations.heloc)} • Retirement +{formatCurrency(allocations.retirement)} • Emergency +{formatCurrency(allocations.emergency)} • 529 +{formatCurrency(allocations.education)} • Vacation +{formatCurrency(allocations.vacation)}
              </div>
            </div>

            {/* Saved Scenarios */}
            {scenarios.length > 0 && (
              <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 24, border: `1px solid ${COLORS.border}` }}>
                <h3 style={{ margin: '0 0 16px 0', color: COLORS.text, fontSize: 16 }}>📋 Saved Scenarios</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead><tr style={{ borderBottom: `2px solid ${COLORS.border}` }}><th style={{ padding: 10, textAlign: 'left', color: COLORS.textMuted }}>Name</th><th style={{ padding: 10, textAlign: 'right', color: COLORS.textMuted }}>HELOC +</th><th style={{ padding: 10, textAlign: 'right', color: COLORS.textMuted }}>Payoff</th><th style={{ padding: 10, textAlign: 'right', color: COLORS.textMuted }}>Interest Saved</th><th style={{ padding: 10, textAlign: 'right', color: COLORS.textMuted }}>Retire @ 60</th><th style={{ padding: 10 }}></th></tr></thead>
                    <tbody>
                      {scenarios.map(s => (
                        <tr key={s.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                          <td style={{ padding: 10 }}><div style={{ fontWeight: 600 }}>{s.name}</div><div style={{ fontSize: 11, color: COLORS.textMuted }}>{new Date(s.createdAt).toLocaleDateString()}</div></td>
                          <td style={{ padding: 10, textAlign: 'right' }}>{formatCurrency(s.allocations.heloc)}</td>
                          <td style={{ padding: 10, textAlign: 'right' }}>{s.projections.helocPayoff}</td>
                          <td style={{ padding: 10, textAlign: 'right', color: COLORS.positive }}>{formatCurrency(s.projections.interestSaved)}</td>
                          <td style={{ padding: 10, textAlign: 'right' }}>{formatCurrency(s.projections.retirementAt60)}</td>
                          <td style={{ padding: 10, textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <button onClick={() => loadScenario(s)} style={{ padding: '4px 10px', background: COLORS.plan, color: '#FFF', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12, marginRight: 4 }}>Load</button>
                            <button onClick={() => setScenarios(scenarios.filter(x => x.id !== s.id))} style={{ padding: '4px 10px', background: COLORS.negative, color: '#FFF', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>×</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* NOTES TAB */}
        {activeTab === 'notes' && (
          <div>
            <h2 style={{ margin: '0 0 24px 0', color: COLORS.text }}>📝 Notes & Reminders</h2>
            <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 24, border: `1px solid ${COLORS.border}`, marginBottom: 24 }}>
              <textarea value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="What's on your mind? Jot down financial thoughts, reminders, goals, or ideas..." style={{ width: '100%', minHeight: 120, padding: 12, border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 14, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
              <button onClick={addNote} disabled={!newNote.trim()} style={{ marginTop: 12, padding: '10px 20px', background: newNote.trim() ? COLORS.accent : COLORS.border, color: '#FFF', border: 'none', borderRadius: 6, fontWeight: 600, cursor: newNote.trim() ? 'pointer' : 'not-allowed' }}>Add Note</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {notes.map(note => (
                <div key={note.id} style={{ background: COLORS.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${COLORS.border}`, borderLeft: `4px solid ${COLORS.accent}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{note.content}</div>
                      <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 8 }}>{new Date(note.created_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</div>
                    </div>
                    <button onClick={() => deleteNote(note.id)} style={{ padding: '4px 8px', background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 4, cursor: 'pointer', fontSize: 14, color: COLORS.textMuted, marginLeft: 12 }}>×</button>
                  </div>
                </div>
              ))}
              {notes.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: COLORS.textMuted }}>No notes yet. Add your first note above!</div>}
            </div>
          </div>
        )}
      </main>

      {/* AI Chat Floating Button */}
      <button onClick={() => setAiChatOpen(!aiChatOpen)} style={{
        position: 'fixed', bottom: 24, right: 24, width: 56, height: 56, borderRadius: '50%',
        background: aiChatOpen ? COLORS.textMuted : COLORS.accent, color: '#FFF', border: 'none', fontSize: 24, cursor: 'pointer',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>{aiChatOpen ? '×' : '🤖'}</button>

      {/* AI Chat Panel */}
      <AIChat isOpen={aiChatOpen} onClose={() => setAiChatOpen(false)} context={aiContext} />

      <footer style={{ padding: 16, textAlign: 'center', color: COLORS.textMuted, fontSize: 11, borderTop: `1px solid ${COLORS.border}` }}>Family Financial Dashboard v2.0</footer>
    </div>
  );
}
