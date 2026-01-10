import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area, ReferenceLine, Legend, PieChart, Pie, Cell } from 'recharts';

// =============================================================================
// DESIGN TOKENS - Original Goodlev Design (Navy + Gold)
// =============================================================================
const COLORS = {
  primary: '#0F2942',
  primaryLight: '#1A3A5C',
  primaryDark: '#0A1F33',
  accent: '#D4A84B',
  accentLight: '#E8C97D',
  positive: '#2ECC71',
  positiveLight: '#A3E4B7',
  negative: '#E74C3C',
  negativeLight: '#F5B7B1',
  warning: '#F39C12',
  warningLight: '#FAD7A0',
  plan: '#3498DB',
  actual: '#2ECC71',
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

// =============================================================================
// BASELINE DATA (Verified Dec 2025)
// =============================================================================
const BASELINE = {
  monthlyIncome: 22625,
  monthlyBudgetedExpenses: 18703,
  monthlySurplus: 3922,
  totalRetirement: 645449,
  helocBalance: 275809,
  helocRate: 0.0632,
  helocPayment: 1546,
  emergencyFund: 24049,
  emergencyTarget: 56000,
  balance529: 85747,
  totalAnnualRetirement: 41225,
  ericAge: 40,
  retirementTarget: 4000000,
};

// Family context for AI
const FAMILY_CONTEXT = `
GOODLEV FAMILY FINANCIAL CONTEXT:
- Eric (40) healthcare professional at Fox Chase Cancer Center (80% time)
- Lauren (42) clergy at Beth David Reform Congregation
- Three children: ages 7, 6, 6 (twins)
- Monthly expenses: $18,703 gross ($18,415 recurring + $288 temp)
- Monthly surplus: $3,922
- HELOC: ~$275K at 6.32%, draw period ends Jan 2032
- Retirement contributions: $41,225/year (already exceeds $4M target at 60)
- Therapy costs: ~$3K/month gross for eldest (giftedness + autism)
- "Twin Tuition Crunch": All 3 kids in college 2037-2039
`;

// =============================================================================
// UTILITIES
// =============================================================================
const formatCurrency = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value || 0);
const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
const formatPercent = (value) => `${(value * 100).toFixed(1)}%`;

// =============================================================================
// LOGIN SCREEN (Password Only - Original Design)
// =============================================================================
function LoginScreen({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const correctPassword = import.meta.env.VITE_DASHBOARD_PASSWORD;
    const apiUrl = import.meta.env.VITE_API_URL || '';
    
    // If API URL configured, verify with backend
    if (apiUrl) {
      try {
        const res = await fetch(`${apiUrl}/health`);
        if (!res.ok) throw new Error('API unavailable');
      } catch (err) {
        // API check failed, but still allow local password
        console.warn('API check failed:', err);
      }
    }
    
    if (password === correctPassword) {
      sessionStorage.setItem('dashboard_authenticated', 'true');
      sessionStorage.setItem('dashboard_password', password);
      onLogin();
    } else {
      setError('Incorrect password');
      setPassword('');
    }
    setLoading(false);
  };
  
  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{
        background: COLORS.bgCard,
        borderRadius: 16,
        padding: 40,
        width: '100%',
        maxWidth: 400,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏦</div>
          <h1 style={{ margin: 0, fontSize: 24, color: COLORS.primary, fontWeight: 700 }}>
            Goodlev Family Dashboard
          </h1>
          <p style={{ margin: '8px 0 0 0', color: COLORS.textMuted, fontSize: 14 }}>
            Enter password to continue
          </p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(''); }}
            placeholder="Password"
            autoFocus
            style={{
              width: '100%',
              padding: '14px 16px',
              fontSize: 16,
              border: `2px solid ${error ? COLORS.negative : COLORS.border}`,
              borderRadius: 8,
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.2s',
            }}
          />
          
          {error && (
            <p style={{ color: COLORS.negative, fontSize: 13, margin: '8px 0 0 0' }}>{error}</p>
          )}
          
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px 16px',
              marginTop: 16,
              fontSize: 16,
              fontWeight: 600,
              color: '#FFFFFF',
              background: loading ? COLORS.textMuted : COLORS.primary,
              border: 'none',
              borderRadius: 8,
              cursor: loading ? 'wait' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {loading ? 'Connecting...' : 'Enter Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}

// =============================================================================
// CARD COMPONENT (Original Styling)
// =============================================================================
function Card({ title, children, action, style = {}, headerStyle = {} }) {
  return (
    <div style={{
      background: COLORS.bgCard,
      borderRadius: 12,
      padding: 20,
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      border: `1px solid ${COLORS.border}`,
      ...style,
    }}>
      {(title || action) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, ...headerStyle }}>
          {title && <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: COLORS.text }}>{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

// =============================================================================
// METRIC CARD (Original Styling)
// =============================================================================
function MetricCard({ label, value, subValue, trend, color = COLORS.primary }) {
  return (
    <div style={{
      background: COLORS.bgCard,
      borderRadius: 10,
      padding: 16,
      border: `1px solid ${COLORS.border}`,
    }}>
      <p style={{ margin: 0, fontSize: 12, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
      <p style={{ margin: '6px 0 0 0', fontSize: 24, fontWeight: 700, color }}>{value}</p>
      {subValue && <p style={{ margin: '4px 0 0 0', fontSize: 12, color: COLORS.textLight }}>{subValue}</p>}
      {trend !== undefined && (
        <p style={{ margin: '4px 0 0 0', fontSize: 12, color: trend >= 0 ? COLORS.positive : COLORS.negative }}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
        </p>
      )}
    </div>
  );
}

// =============================================================================
// PERIOD SELECTOR
// =============================================================================
function PeriodSelector({ periodType, setPeriodType, selectedDate, setSelectedDate }) {
  const navigate = (dir) => {
    const d = new Date(selectedDate);
    if (periodType === 'week') d.setDate(d.getDate() + dir * 7);
    else if (periodType === 'month') d.setMonth(d.getMonth() + dir);
    else d.setFullYear(d.getFullYear() + dir);
    setSelectedDate(d);
  };
  
  const getLabel = () => {
    const d = new Date(selectedDate);
    if (periodType === 'week') {
      const start = new Date(d); start.setDate(d.getDate() - d.getDay());
      const end = new Date(start); end.setDate(start.getDate() + 6);
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
    if (periodType === 'month') return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    return d.getFullYear().toString();
  };
  
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
      <div style={{ display: 'flex', gap: 6 }}>
        {['week', 'month', 'year', 'ytd'].map(type => (
          <button key={type} onClick={() => setPeriodType(type)} style={{
            padding: '6px 14px', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer',
            border: `1px solid ${periodType === type ? COLORS.accent : COLORS.border}`,
            background: periodType === type ? COLORS.accent : 'transparent',
            color: periodType === type ? '#FFF' : COLORS.text,
          }}>
            {type === 'ytd' ? 'YTD' : type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => navigate(-1)} style={{ width: 32, height: 32, borderRadius: 6, border: `1px solid ${COLORS.border}`, background: 'transparent', cursor: 'pointer', fontSize: 14 }}>←</button>
        <span style={{ fontWeight: 600, minWidth: 150, textAlign: 'center', color: COLORS.text }}>{getLabel()}</span>
        <button onClick={() => navigate(1)} style={{ width: 32, height: 32, borderRadius: 6, border: `1px solid ${COLORS.border}`, background: 'transparent', cursor: 'pointer', fontSize: 14 }}>→</button>
      </div>
    </div>
  );
}

// =============================================================================
// AI ADVISOR (Floating Chat)
// =============================================================================
function AIAdvisor({ isOpen, onClose, financialContext }) {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const suggestions = [
    "Should I prioritize HELOC or retirement?",
    "Am I on track for my goals?",
    "How should I handle 3 kids in college?",
    "What if therapy costs increase 10%?"
  ];
  
  const askAI = async () => {
    if (!question.trim() || loading) return;
    setLoading(true);
    const userMsg = question;
    setQuestion('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY || '',
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: `You are a knowledgeable financial advisor for the Goodlev family. Be specific with numbers. Keep responses to 2-3 paragraphs. Consider: 3 kids overlapping in college 2037-2039, eldest has autism (therapy ~$3K/mo), HELOC draw ends Jan 2032.`,
          messages: [{ role: 'user', content: `${financialContext}\n\nQUESTION: ${userMsg}` }]
        })
      });
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.content?.[0]?.text || 'Unable to get response.' }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error connecting to AI. Make sure VITE_ANTHROPIC_API_KEY is set.' }]);
    }
    setLoading(false);
  };
  
  if (!isOpen) return null;
  
  return (
    <div style={{
      position: 'fixed', bottom: 80, right: 24, width: 380, maxHeight: '65vh',
      background: COLORS.bgCard, borderRadius: 16, boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
      display: 'flex', flexDirection: 'column', zIndex: 1000, border: `1px solid ${COLORS.border}`,
    }}>
      <div style={{ padding: 16, background: COLORS.primary, color: '#FFF', borderRadius: '16px 16px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>🤖 Financial Advisor</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#FFF', fontSize: 18, cursor: 'pointer' }}>×</button>
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 300 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: 16 }}>
            <p style={{ color: COLORS.textMuted, fontSize: 13, marginBottom: 16 }}>Ask me anything about your finances!</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {suggestions.map(s => (
                <button key={s} onClick={() => setQuestion(s)} style={{
                  padding: '10px 12px', background: COLORS.bg, border: `1px solid ${COLORS.border}`,
                  borderRadius: 8, fontSize: 12, cursor: 'pointer', textAlign: 'left', color: COLORS.text,
                }}>{s}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{
            padding: 12, borderRadius: 12, fontSize: 13, lineHeight: 1.5, maxWidth: '85%',
            background: m.role === 'user' ? COLORS.accent : COLORS.bg,
            color: m.role === 'user' ? '#FFF' : COLORS.text,
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
          }}>{m.content}</div>
        ))}
        {loading && <div style={{ color: COLORS.textMuted, fontSize: 13, padding: 8 }}>Thinking...</div>}
      </div>
      
      <div style={{ padding: 12, borderTop: `1px solid ${COLORS.border}`, display: 'flex', gap: 8 }}>
        <input value={question} onChange={e => setQuestion(e.target.value)} onKeyDown={e => e.key === 'Enter' && askAI()}
          placeholder="Ask a question..." style={{ flex: 1, padding: '10px 14px', border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 14 }} />
        <button onClick={askAI} disabled={loading} style={{
          padding: '10px 16px', background: COLORS.accent, color: '#FFF', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer'
        }}>→</button>
      </div>
    </div>
  );
}

// =============================================================================
// AUTO-CATEGORIZE PANEL
// =============================================================================
function AutoCategorizePanel({ apiUrl, onRefresh }) {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [result, setResult] = useState(null);
  const [days, setDays] = useState(30);
  
  const fetchPreview = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${apiUrl}/api/autocategorize/preview?days=${days}`);
      setPreview(await res.json());
    } catch (err) { console.error(err); }
    setLoading(false);
  };
  
  const applyCategories = async () => {
    if (!window.confirm(`Categorize ${preview.summary.would_categorize} transactions in YNAB?`)) return;
    setApplying(true);
    try {
      const res = await fetch(`${apiUrl}/api/autocategorize/run?budget_id=last-used`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dry_run: false, days })
      });
      const data = await res.json();
      setResult(data);
      if (data.updated > 0) onRefresh?.();
    } catch (err) { console.error(err); }
    setApplying(false);
  };
  
  return (
    <Card title="🤖 Auto-Categorize Transactions">
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={days} onChange={e => setDays(Number(e.target.value))} style={{ padding: '8px 12px', border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 13 }}>
          <option value={7}>Last 7 days</option>
          <option value={14}>Last 14 days</option>
          <option value={30}>Last 30 days</option>
          <option value={60}>Last 60 days</option>
        </select>
        <button onClick={fetchPreview} disabled={loading} style={{ padding: '8px 16px', background: COLORS.primary, color: '#FFF', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>
          {loading ? 'Scanning...' : '🔍 Preview'}
        </button>
        {preview?.summary?.would_categorize > 0 && (
          <button onClick={applyCategories} disabled={applying} style={{ padding: '8px 16px', background: COLORS.positive, color: '#FFF', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>
            {applying ? 'Applying...' : `✓ Apply ${preview.summary.would_categorize} to YNAB`}
          </button>
        )}
      </div>
      
      {result && (
        <div style={{ padding: 12, background: COLORS.positiveLight, borderRadius: 8, marginBottom: 16 }}>
          <p style={{ margin: 0, color: COLORS.positive, fontWeight: 600 }}>✓ Categorized {result.updated} transactions!</p>
        </div>
      )}
      
      {preview && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
            {[
              { label: 'Uncategorized', value: preview.summary.total_uncategorized, color: COLORS.textMuted },
              { label: 'Can Auto-Cat', value: preview.summary.would_categorize, color: COLORS.positive },
              { label: 'No Match', value: preview.summary.no_match, color: COLORS.warning },
              { label: 'Missing Category', value: preview.summary.missing_ynab_category, color: COLORS.negative },
            ].map(stat => (
              <div key={stat.label} style={{ padding: 12, background: COLORS.bg, borderRadius: 8, textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: stat.color }}>{stat.value}</p>
                <p style={{ margin: '4px 0 0 0', fontSize: 11, color: COLORS.textMuted }}>{stat.label}</p>
              </div>
            ))}
          </div>
          
          {preview.would_categorize?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <h4 style={{ fontSize: 13, marginBottom: 8, color: COLORS.positive }}>✓ Ready to Categorize ({preview.would_categorize.length})</h4>
              <div style={{ maxHeight: 180, overflowY: 'auto', border: `1px solid ${COLORS.border}`, borderRadius: 8 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead><tr style={{ background: COLORS.bg }}>
                    <th style={{ padding: 8, textAlign: 'left' }}>Date</th>
                    <th style={{ padding: 8, textAlign: 'left' }}>Payee</th>
                    <th style={{ padding: 8, textAlign: 'right' }}>Amount</th>
                    <th style={{ padding: 8, textAlign: 'left' }}>→ Category</th>
                  </tr></thead>
                  <tbody>
                    {preview.would_categorize.slice(0, 20).map((t, i) => (
                      <tr key={i} style={{ borderTop: `1px solid ${COLORS.border}` }}>
                        <td style={{ padding: 8 }}>{formatDate(t.date)}</td>
                        <td style={{ padding: 8 }}>{t.payee}</td>
                        <td style={{ padding: 8, textAlign: 'right', color: t.amount < 0 ? COLORS.negative : COLORS.positive }}>{formatCurrency(Math.abs(t.amount))}</td>
                        <td style={{ padding: 8, color: COLORS.positive, fontWeight: 500 }}>{t.ynab_category_name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {preview.no_match?.length > 0 && (
            <div>
              <h4 style={{ fontSize: 13, marginBottom: 8, color: COLORS.warning }}>⚠ No Matching Rule ({preview.no_match.length})</h4>
              <div style={{ maxHeight: 120, overflowY: 'auto', border: `1px solid ${COLORS.border}`, borderRadius: 8 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead><tr style={{ background: COLORS.bg }}>
                    <th style={{ padding: 8, textAlign: 'left' }}>Date</th>
                    <th style={{ padding: 8, textAlign: 'left' }}>Payee</th>
                    <th style={{ padding: 8, textAlign: 'right' }}>Amount</th>
                  </tr></thead>
                  <tbody>
                    {preview.no_match.slice(0, 10).map((t, i) => (
                      <tr key={i} style={{ borderTop: `1px solid ${COLORS.border}` }}>
                        <td style={{ padding: 8 }}>{formatDate(t.date)}</td>
                        <td style={{ padding: 8 }}>{t.payee}</td>
                        <td style={{ padding: 8, textAlign: 'right' }}>{formatCurrency(Math.abs(t.amount))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
      
      {!preview && !loading && (
        <p style={{ color: COLORS.textMuted, fontSize: 13 }}>Click Preview to scan uncategorized transactions and apply Monarch rules.</p>
      )}
    </Card>
  );
}

// =============================================================================
// TRANSACTIONS PANEL
// =============================================================================
function TransactionsPanel({ apiUrl, categories }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [saving, setSaving] = useState(false);
  const [days, setDays] = useState(14);
  const [filter, setFilter] = useState('all');
  
  const [error, setError] = useState(null);
  
  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/api/transactions?days=${days}`);
      const data = await res.json();
      setTransactions(data.data?.transactions || []);
    } catch (err) { console.error(err); setError('Failed to load transactions'); }
    setLoading(false);
  }, [apiUrl, days]);
  
  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);
  
  const updateTransaction = async (id) => {
    if (!selectedCategory) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/api/transactions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category_name: selectedCategory })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Update failed (${res.status})`);
      }
      setEditingId(null);
      setSelectedCategory('');
      fetchTransactions();
    } catch (err) { 
      console.error(err); 
      setError(err.message || 'Failed to update transaction');
    }
    setSaving(false);
  };
  
  const categoryList = categories?.data?.category_groups?.flatMap(g => g.categories.filter(c => !c.hidden).map(c => c.name)) || [];
  const filtered = filter === 'uncategorized' ? transactions.filter(t => !t.category_name || t.category_name === 'Uncategorized') : transactions;
  
  return (
    <Card title="📋 Recent Transactions" action={
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <select value={filter} onChange={e => setFilter(e.target.value)} style={{ padding: '6px 10px', border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 12 }}>
          <option value="all">All</option>
          <option value="uncategorized">Uncategorized</option>
        </select>
        <select value={days} onChange={e => setDays(Number(e.target.value))} style={{ padding: '6px 10px', border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 12 }}>
          <option value={7}>7 days</option>
          <option value={14}>14 days</option>
          <option value={30}>30 days</option>
        </select>
        <button onClick={fetchTransactions} disabled={loading} style={{ padding: '6px 12px', background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>
          {loading ? '...' : '↻'}
        </button>
      </div>
    }>
      {error && (
        <div style={{ padding: 12, marginBottom: 12, background: COLORS.negativeLight, borderRadius: 8, color: COLORS.negative, fontSize: 13 }}>
          ⚠️ {error}
          <button onClick={() => setError(null)} style={{ marginLeft: 12, background: 'transparent', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>
      )}
      <div style={{ maxHeight: 450, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead><tr style={{ background: COLORS.bg, position: 'sticky', top: 0 }}>
            <th style={{ padding: 10, textAlign: 'left' }}>Date</th>
            <th style={{ padding: 10, textAlign: 'left' }}>Payee</th>
            <th style={{ padding: 10, textAlign: 'left' }}>Category</th>
            <th style={{ padding: 10, textAlign: 'right' }}>Amount</th>
            <th style={{ padding: 10, width: 90 }}></th>
          </tr></thead>
          <tbody>
            {filtered.map(t => (
              <tr key={t.id} style={{ borderTop: `1px solid ${COLORS.border}` }}>
                <td style={{ padding: 10 }}>{formatDate(t.date)}</td>
                <td style={{ padding: 10, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.payee_name || 'Unknown'}</td>
                <td style={{ padding: 10 }}>
                  {editingId === t.id ? (
                    <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} autoFocus style={{ padding: 4, fontSize: 11, width: '100%' }}>
                      <option value="">Select...</option>
                      {categoryList.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  ) : (
                    <span style={{ color: t.category_name && t.category_name !== 'Uncategorized' ? COLORS.text : COLORS.warning }}>
                      {t.category_name || '⚠ Uncategorized'}
                    </span>
                  )}
                </td>
                <td style={{ padding: 10, textAlign: 'right', color: t.amount < 0 ? COLORS.negative : COLORS.positive, fontWeight: 500 }}>
                  {formatCurrency(Math.abs(t.amount / 1000))}
                </td>
                <td style={{ padding: 10, textAlign: 'center' }}>
                  {editingId === t.id ? (
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                      <button onClick={() => updateTransaction(t.id)} disabled={saving || !selectedCategory} style={{ padding: '4px 8px', background: COLORS.positive, color: '#FFF', border: 'none', borderRadius: 4, fontSize: 11, cursor: 'pointer' }}>{saving ? '...' : 'Save'}</button>
                      <button onClick={() => { setEditingId(null); setSelectedCategory(''); }} style={{ padding: '4px 6px', background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 4, fontSize: 11, cursor: 'pointer' }}>✕</button>
                    </div>
                  ) : (
                    <button onClick={() => { setEditingId(t.id); setSelectedCategory(t.category_name || ''); }} style={{ padding: '4px 10px', background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 4, fontSize: 11, cursor: 'pointer' }}>Edit</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p style={{ textAlign: 'center', color: COLORS.textMuted, padding: 32 }}>
            {filter === 'uncategorized' ? '🎉 All transactions categorized!' : 'No transactions found'}
          </p>
        )}
      </div>
    </Card>
  );
}

// =============================================================================
// SPENDING CHART
// =============================================================================
function SpendingChart({ data }) {
  if (!data?.categories) return null;
  const expenses = data.categories.filter(c => c.amount < 0).map(c => ({ name: c.name, value: Math.abs(c.amount) })).slice(0, 8);
  
  return (
    <Card title="💰 Spending by Category">
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ width: 160, height: 160 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={expenses} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65}>
                {expenses.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={v => formatCurrency(v)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{ flex: 1 }}>
          {expenses.map((c, i) => (
            <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: `1px solid ${COLORS.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: CHART_COLORS[i % CHART_COLORS.length] }} />
                <span style={{ fontSize: 12, color: COLORS.text }}>{c.name}</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.text }}>{formatCurrency(c.value)}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

// =============================================================================
// HELOC PANEL
// =============================================================================
function HelocPanel({ apiUrl, authHeader }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [extraPayment, setExtraPayment] = useState(1500);
  const [principal, setPrincipal] = useState(275809);
  const [rate, setRate] = useState(6.32);
  
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${apiUrl}/api/analytics/heloc-analysis?principal=${principal}&rate=${rate/100}&current_payment=1546`,
        { headers: { 'Authorization': authHeader } }
      );
      if (res.ok) setData(await res.json());
    } catch (err) {
      console.error('HELOC fetch error:', err);
    }
    setLoading(false);
  }, [apiUrl, authHeader, principal, rate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (!data) return <Card title="🏠 HELOC Payoff Scenarios"><p style={{ color: COLORS.textMuted }}>Loading...</p></Card>;

  // Find the scenario that matches current slider
  const selectedScenario = data.scenarios.find(s => s.extra_payment === extraPayment) || data.scenarios[0];
  
  return (
    <Card title="🏠 HELOC Payoff Scenarios">
      {/* Interactive Controls */}
      <div style={{ marginBottom: 20, padding: 16, background: COLORS.bg, borderRadius: 8 }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Extra Monthly Payment</label>
            <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.primary }}>{formatCurrency(extraPayment)}/mo</span>
          </div>
          <input type="range" min="0" max="3000" step="100" value={extraPayment}
            onChange={e => setExtraPayment(Number(e.target.value))}
            style={{ width: '100%', cursor: 'pointer' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: COLORS.textMuted }}>
            <span>$0</span><span>$1,500</span><span>$3,000</span>
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: COLORS.textMuted }}>Principal Balance</label>
            <input type="number" value={principal} onChange={e => setPrincipal(Number(e.target.value))}
              style={{ width: '100%', padding: 8, border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 13 }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: COLORS.textMuted }}>Interest Rate (%)</label>
            <input type="number" step="0.01" value={rate} onChange={e => setRate(Number(e.target.value))}
              style={{ width: '100%', padding: 8, border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 13 }} />
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
        <div style={{ padding: 12, background: COLORS.primaryLight, borderRadius: 8, textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#FFF' }}>{formatCurrency(selectedScenario.total_monthly)}</p>
          <p style={{ margin: '4px 0 0', fontSize: 10, color: COLORS.accentLight }}>Total/Month</p>
        </div>
        <div style={{ padding: 12, background: selectedScenario.paid_before_draw_end ? COLORS.positive + '20' : COLORS.warning + '20', borderRadius: 8, textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: selectedScenario.paid_before_draw_end ? COLORS.positive : COLORS.warning }}>
            {new Date(selectedScenario.payoff_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 10, color: COLORS.textMuted }}>Payoff Date {selectedScenario.paid_before_draw_end && '✓'}</p>
        </div>
        <div style={{ padding: 12, background: COLORS.bg, borderRadius: 8, textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: COLORS.negative }}>{formatCurrency(selectedScenario.total_interest)}</p>
          <p style={{ margin: '4px 0 0', fontSize: 10, color: COLORS.textMuted }}>Total Interest</p>
        </div>
        <div style={{ padding: 12, background: COLORS.positive + '20', borderRadius: 8, textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: COLORS.positive }}>{formatCurrency(selectedScenario.interest_saved_vs_minimum)}</p>
          <p style={{ margin: '4px 0 0', fontSize: 10, color: COLORS.textMuted }}>Interest Saved</p>
        </div>
      </div>

      {/* Comparison Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead><tr style={{ background: COLORS.bg }}>
            <th style={{ padding: 10, textAlign: 'left' }}>Extra/mo</th>
            <th style={{ padding: 10, textAlign: 'right' }}>Total</th>
            <th style={{ padding: 10, textAlign: 'right' }}>Payoff</th>
            <th style={{ padding: 10, textAlign: 'right' }}>Interest</th>
            <th style={{ padding: 10, textAlign: 'right' }}>Saved</th>
          </tr></thead>
          <tbody>
            {data.scenarios.map((s, i) => (
              <tr key={i} style={{ 
                borderTop: `1px solid ${COLORS.border}`, 
                background: s.extra_payment === extraPayment ? COLORS.primary + '15' : 'transparent',
                fontWeight: s.extra_payment === extraPayment ? 600 : 400
              }}>
                <td style={{ padding: 10 }}>{s.extra_payment === 0 ? 'Min' : `+${formatCurrency(s.extra_payment)}`}</td>
                <td style={{ padding: 10, textAlign: 'right' }}>{formatCurrency(s.total_monthly)}</td>
                <td style={{ padding: 10, textAlign: 'right' }}>
                  {new Date(s.payoff_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  {s.paid_before_draw_end && <span style={{ marginLeft: 4, color: COLORS.positive }}>✓</span>}
                </td>
                <td style={{ padding: 10, textAlign: 'right' }}>{formatCurrency(s.total_interest)}</td>
                <td style={{ padding: 10, textAlign: 'right', color: COLORS.positive }}>{s.interest_saved_vs_minimum > 0 ? formatCurrency(s.interest_saved_vs_minimum) : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 8 }}>
        ✓ = Paid off before draw period ends (Jan 2032). Current HELOC rate: {rate}%
      </p>
    </Card>
  );
}

// =============================================================================
// RETIREMENT PANEL
// =============================================================================
function RetirementPanel({ apiUrl, authHeader }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentBalance, setCurrentBalance] = useState(500000);
  const [annualContribution, setAnnualContribution] = useState(41225);
  const [targetAge, setTargetAge] = useState(60);
  const [returnRate, setReturnRate] = useState(7);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${apiUrl}/api/analytics/retirement-projection?current_balance=${currentBalance}&annual_contribution=${annualContribution}&current_age=40&target_age=${targetAge}&return_rate=${returnRate/100}`,
        { headers: { 'Authorization': authHeader } }
      );
      if (res.ok) setData(await res.json());
    } catch (err) {
      console.error('Retirement fetch error:', err);
    }
    setLoading(false);
  }, [apiUrl, authHeader, currentBalance, annualContribution, targetAge, returnRate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (!data) return <Card title="📊 Retirement Projection"><p style={{ color: COLORS.textMuted }}>Loading...</p></Card>;
  
  const chartData = data.projections.filter((_, i) => i % 2 === 0 || i === data.projections.length - 1);
  
  return (
    <Card title="📊 Retirement Projection">
      {/* Interactive Controls */}
      <div style={{ marginBottom: 20, padding: 16, background: COLORS.bg, borderRadius: 8 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <label style={{ fontSize: 12, color: COLORS.textMuted }}>Annual Contribution</label>
              <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.primary }}>{formatCurrency(annualContribution)}</span>
            </div>
            <input type="range" min="20000" max="80000" step="1000" value={annualContribution}
              onChange={e => setAnnualContribution(Number(e.target.value))}
              style={{ width: '100%', cursor: 'pointer' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: COLORS.textMuted }}>
              <span>$20K</span><span>$50K</span><span>$80K</span>
            </div>
          </div>
          
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <label style={{ fontSize: 12, color: COLORS.textMuted }}>Target Retirement Age</label>
              <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.primary }}>{targetAge}</span>
            </div>
            <input type="range" min="55" max="70" step="1" value={targetAge}
              onChange={e => setTargetAge(Number(e.target.value))}
              style={{ width: '100%', cursor: 'pointer' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: COLORS.textMuted }}>
              <span>55</span><span>62</span><span>70</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: COLORS.textMuted }}>Current Balance</label>
            <input type="number" value={currentBalance} onChange={e => setCurrentBalance(Number(e.target.value))}
              style={{ width: '100%', padding: 8, border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 13 }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: COLORS.textMuted }}>Expected Return (%)</label>
            <input type="number" step="0.5" value={returnRate} onChange={e => setReturnRate(Number(e.target.value))}
              style={{ width: '100%', padding: 8, border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 13 }} />
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
        <div style={{ padding: 12, background: COLORS.primaryLight, borderRadius: 8, textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#FFF' }}>{formatCurrency(data.projected_balance_at_retirement)}</p>
          <p style={{ margin: '4px 0 0', fontSize: 10, color: COLORS.accentLight }}>At Age {targetAge}</p>
        </div>
        <div style={{ padding: 12, background: COLORS.positive + '20', borderRadius: 8, textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: COLORS.positive }}>{formatCurrency(data.safe_monthly_withdrawal)}</p>
          <p style={{ margin: '4px 0 0', fontSize: 10, color: COLORS.textMuted }}>Monthly (4%)</p>
        </div>
        <div style={{ padding: 12, background: COLORS.plan + '20', borderRadius: 8, textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: COLORS.plan }}>{formatCurrency(data.inflation_adjusted_balance)}</p>
          <p style={{ margin: '4px 0 0', fontSize: 10, color: COLORS.textMuted }}>Today's $</p>
        </div>
        <div style={{ padding: 12, background: COLORS.bg, borderRadius: 8, textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: COLORS.text }}>{formatCurrency(data.safe_withdrawal_real / 12)}</p>
          <p style={{ margin: '4px 0 0', fontSize: 10, color: COLORS.textMuted }}>Real Monthly</p>
        </div>
      </div>

      {/* Projection Chart */}
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={chartData}>
          <XAxis dataKey="age" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${(v/1000000).toFixed(1)}M`} />
          <Tooltip formatter={v => formatCurrency(v)} />
          <Legend />
          <Line type="monotone" dataKey="nominal_balance" stroke={COLORS.primary} strokeWidth={2} dot={false} name="Nominal" />
          <Line type="monotone" dataKey="real_balance" stroke={COLORS.plan} strokeWidth={2} dot={false} strokeDasharray="5 5" name="Real (inflation-adj)" />
        </LineChart>
      </ResponsiveContainer>
      
      <p style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 8 }}>
        Assumptions: {returnRate}% annual return, 3% inflation, {targetAge - 40} years to retirement
      </p>
    </Card>
  );
}

// =============================================================================
// ACCOUNTS PANEL
// =============================================================================
function AccountsPanel({ accounts }) {
  if (!accounts?.data?.accounts) return null;
  const accts = accounts.data.accounts.filter(a => !a.closed && !a.deleted);
  const netWorth = accts.reduce((sum, a) => sum + (a.balance || 0), 0) / 1000;
  
  return (
    <Card title="🏦 Accounts">
      <div style={{ marginBottom: 12, padding: 12, background: COLORS.primaryLight, borderRadius: 8 }}>
        <p style={{ margin: 0, fontSize: 11, color: COLORS.accentLight }}>Net Worth</p>
        <p style={{ margin: '4px 0 0', fontSize: 24, fontWeight: 700, color: '#FFF' }}>{formatCurrency(netWorth)}</p>
      </div>
      {accts.slice(0, 8).map(a => (
        <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${COLORS.border}` }}>
          <span style={{ fontSize: 12, color: COLORS.text }}>{a.name}</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: (a.balance || 0) >= 0 ? COLORS.positive : COLORS.negative }}>{formatCurrency((a.balance || 0) / 1000)}</span>
        </div>
      ))}
    </Card>
  );
}

// =============================================================================
// MAIN DASHBOARD
// =============================================================================
export default function GoodlevDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => sessionStorage.getItem('dashboard_authenticated') === 'true');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [showAI, setShowAI] = useState(false);
  
  const [periodType, setPeriodType] = useState('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const [accounts, setAccounts] = useState(null);
  const [categories, setCategories] = useState(null);
  const [monthlySummary, setMonthlySummary] = useState(null);
  
  const apiUrl = import.meta.env.VITE_API_URL || '';
  const authHeader = sessionStorage.getItem('auth') ? 'Basic ' + sessionStorage.getItem('auth') : '';
  
  const fetchAllData = useCallback(async () => {
    if (!isAuthenticated || !apiUrl) return;
    setLoading(true);
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;
    
    try {
      const [accountsRes, categoriesRes, summaryRes] = await Promise.all([
        fetch(`${apiUrl}/api/accounts`),
        fetch(`${apiUrl}/api/categories`),
        fetch(`${apiUrl}/api/analytics/monthly-summary?year=${year}&month=${month}`),
      ]);
      
      if (accountsRes.ok) setAccounts(await accountsRes.json());
      if (categoriesRes.ok) setCategories(await categoriesRes.json());
      if (summaryRes.ok) setMonthlySummary(await summaryRes.json());
      setLastRefresh(new Date());
    } catch (err) { console.error(err); }
    setLoading(false);
  }, [isAuthenticated, apiUrl, selectedDate]);
  
  useEffect(() => { fetchAllData(); }, [fetchAllData]);
  
  const financialContext = useMemo(() => {
    if (!monthlySummary || !accounts) return FAMILY_CONTEXT;
    const netWorth = accounts.data?.accounts?.reduce((sum, a) => sum + (a.balance || 0), 0) / 1000 || 0;
    return `${FAMILY_CONTEXT}\nCURRENT: Income ${formatCurrency(monthlySummary.total_income)}, Expenses ${formatCurrency(monthlySummary.total_expense)}, Net ${formatCurrency(monthlySummary.net)}, Net Worth ${formatCurrency(netWorth)}`;
  }, [monthlySummary, accounts]);
  
  const handleLogout = () => {
    sessionStorage.clear();
    setIsAuthenticated(false);
  };
  
  if (!isAuthenticated) return <LoginScreen onLogin={() => setIsAuthenticated(true)} />;
  
  const tabs = [
    { id: 'dashboard', label: '📊 Dashboard' },
    { id: 'categorize', label: '🤖 Auto-Cat' },
    { id: 'transactions', label: '📋 Transactions' },
    { id: 'projections', label: '📈 Projections' },
  ];
  
  return (
    <div style={{ minHeight: '100vh', background: COLORS.bg, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <div style={{ background: COLORS.primary, padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#FFF' }}>🏦 Goodlev Dashboard</h1>
          <div style={{ display: 'flex', gap: 4 }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                padding: '8px 14px', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer',
                background: activeTab === t.id ? COLORS.accent : 'transparent',
                color: activeTab === t.id ? COLORS.primary : '#FFF',
                fontWeight: activeTab === t.id ? 600 : 400,
              }}>{t.label}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {lastRefresh && <span style={{ fontSize: 11, color: COLORS.accentLight }}>Updated {lastRefresh.toLocaleTimeString()}</span>}
          <button onClick={fetchAllData} disabled={loading} style={{ padding: '6px 14px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 6, color: '#FFF', fontSize: 12, cursor: 'pointer' }}>
            {loading ? '...' : '↻ Refresh'}
          </button>
          <button onClick={handleLogout} style={{ padding: '6px 14px', background: COLORS.negative, border: 'none', borderRadius: 6, color: '#FFF', fontSize: 12, cursor: 'pointer' }}>Logout</button>
        </div>
      </div>
      
      {/* Content */}
      <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
        {activeTab === 'dashboard' && (
          <>
            <PeriodSelector periodType={periodType} setPeriodType={setPeriodType} selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
              <MetricCard label="Income" value={formatCurrency(monthlySummary?.total_income || 0)} color={COLORS.positive} />
              <MetricCard label="Expenses" value={formatCurrency(monthlySummary?.total_expense || 0)} color={COLORS.negative} />
              <MetricCard label="Net" value={formatCurrency(monthlySummary?.net || 0)} color={(monthlySummary?.net || 0) >= 0 ? COLORS.positive : COLORS.negative} />
              <MetricCard label="Target Surplus" value={formatCurrency(3922)} subValue="Based on $18,703 expenses" color={COLORS.plan} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <SpendingChart data={monthlySummary} />
              <AccountsPanel accounts={accounts} />
            </div>
          </>
        )}
        
        {activeTab === 'categorize' && <AutoCategorizePanel apiUrl={apiUrl} onRefresh={fetchAllData} />}
        {activeTab === 'transactions' && <TransactionsPanel apiUrl={apiUrl} categories={categories} />}
        {activeTab === 'projections' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <HelocPanel apiUrl={apiUrl} authHeader={authHeader} />
            <RetirementPanel apiUrl={apiUrl} authHeader={authHeader} />
          </div>
        )}
      </div>
      
      {/* AI FAB */}
      <button onClick={() => setShowAI(!showAI)} style={{
        position: 'fixed', bottom: 24, right: 24, width: 56, height: 56, borderRadius: '50%',
        background: COLORS.accent, color: COLORS.primary, border: 'none', fontSize: 22, cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999,
      }}>{showAI ? '×' : '🤖'}</button>
      
      <AIAdvisor isOpen={showAI} onClose={() => setShowAI(false)} financialContext={financialContext} />
    </div>
  );
}
