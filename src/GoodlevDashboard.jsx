import { useState, useEffect, useCallback, useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Legend, AreaChart, Area } from 'recharts';

// =============================================================================
// CONFIGURATION
// =============================================================================
const COLORS = {
  bg: '#F8FAFC',
  bgCard: '#FFFFFF',
  text: '#1E293B',
  textMuted: '#64748B',
  border: '#E2E8F0',
  primary: '#3B82F6',
  accent: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  purple: '#8B5CF6',
  pink: '#EC4899',
};

const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

// Your family's financial context for AI
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
- Key monthly: Mortgage $4,208, HELOC $1,546, Therapy gross $3,000
`;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================
const formatCurrency = (val) => {
  if (val === null || val === undefined) return '-';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// =============================================================================
// PERIOD SELECTOR COMPONENT
// =============================================================================
function PeriodSelector({ periodType, setPeriodType, selectedDate, setSelectedDate }) {
  const navigate = (direction) => {
    const d = new Date(selectedDate);
    if (periodType === 'week') d.setDate(d.getDate() + direction * 7);
    else if (periodType === 'month') d.setMonth(d.getMonth() + direction);
    else if (periodType === 'year' || periodType === 'ytd') d.setFullYear(d.getFullYear() + direction);
    setSelectedDate(d);
  };

  const getLabel = () => {
    const d = new Date(selectedDate);
    if (periodType === 'week') {
      const start = new Date(d);
      start.setDate(d.getDate() - d.getDay());
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    } else if (periodType === 'month') {
      return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else {
      return d.getFullYear().toString();
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        {['week', 'month', 'year', 'ytd'].map(type => (
          <button key={type} onClick={() => setPeriodType(type)} style={{
            padding: '6px 12px', borderRadius: 6,
            border: `1px solid ${periodType === type ? COLORS.accent : COLORS.border}`,
            background: periodType === type ? `${COLORS.accent}20` : 'transparent',
            cursor: 'pointer', fontSize: 13, fontWeight: 500, textTransform: 'capitalize'
          }}>
            {type === 'ytd' ? 'YTD' : type}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={() => navigate(-1)} style={{ width: 32, height: 32, borderRadius: 6, border: `1px solid ${COLORS.border}`, background: 'transparent', cursor: 'pointer' }}>←</button>
        <span style={{ fontWeight: 600, minWidth: 160, textAlign: 'center' }}>{getLabel()}</span>
        <button onClick={() => navigate(1)} style={{ width: 32, height: 32, borderRadius: 6, border: `1px solid ${COLORS.border}`, background: 'transparent', cursor: 'pointer' }}>→</button>
      </div>
    </div>
  );
}

// =============================================================================
// LOGIN COMPONENT
// =============================================================================
function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://goodlevdashboard-production.up.railway.app';
      const res = await fetch(`${apiUrl}/health`, {
        headers: { 'Authorization': 'Basic ' + btoa(`${username}:${password}`) }
      });
      
      if (res.ok) {
        sessionStorage.setItem('dashboard_auth', btoa(`${username}:${password}`));
        sessionStorage.setItem('dashboard_authenticated', 'true');
        onLogin();
      } else {
        setError('Invalid credentials');
      }
    } catch (err) {
      setError('Connection failed');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: COLORS.bg }}>
      <div style={{ background: COLORS.bgCard, padding: 40, borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', width: 360 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, textAlign: 'center' }}>🏠 Goodlev Dashboard</h1>
        <p style={{ color: COLORS.textMuted, textAlign: 'center', marginBottom: 24 }}>Sign in to continue</p>
        
        <form onSubmit={handleSubmit}>
          <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)}
            style={{ width: '100%', padding: 12, border: `1px solid ${COLORS.border}`, borderRadius: 8, marginBottom: 12, fontSize: 14, boxSizing: 'border-box' }} />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
            style={{ width: '100%', padding: 12, border: `1px solid ${COLORS.border}`, borderRadius: 8, marginBottom: 16, fontSize: 14, boxSizing: 'border-box' }} />
          
          {error && <p style={{ color: COLORS.danger, fontSize: 13, marginBottom: 12 }}>{error}</p>}
          
          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: 12, background: COLORS.primary, color: '#FFF', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            {loading ? 'Connecting...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

// =============================================================================
// CARD COMPONENT
// =============================================================================
function Card({ title, children, action, style = {} }) {
  return (
    <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', ...style }}>
      {(title || action) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          {title && <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

// =============================================================================
// STAT CARD COMPONENT
// =============================================================================
function StatCard({ label, value, subtext, color = COLORS.primary, trend }) {
  return (
    <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <p style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 24, fontWeight: 700, color, margin: 0 }}>{value}</p>
      {subtext && <p style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 4 }}>{subtext}</p>}
      {trend !== undefined && (
        <p style={{ fontSize: 12, color: trend >= 0 ? COLORS.accent : COLORS.danger, marginTop: 4 }}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last month
        </p>
      )}
    </div>
  );
}

// =============================================================================
// AI ADVISOR CHAT (Floating)
// =============================================================================
function AIAdvisor({ isOpen, onClose, financialContext }) {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const suggestedQuestions = [
    "Should I prioritize HELOC or retirement?",
    "Am I on track for my goals?",
    "How should I handle 3 kids in college?",
    "What if therapy costs increase 10%?",
    "How can I save more each month?"
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
      const answer = data.content?.[0]?.text || 'Unable to get response.';
      setMessages(prev => [...prev, { role: 'assistant', content: answer }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error connecting to AI. Check VITE_ANTHROPIC_API_KEY in Vercel environment variables.' }]);
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', bottom: 80, right: 24, width: 400, maxHeight: '70vh', background: COLORS.bgCard, borderRadius: 16, boxShadow: '0 10px 40px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', zIndex: 1000 }}>
      <div style={{ padding: 16, background: COLORS.primary, color: '#FFF', borderRadius: '16px 16px 0 0', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 600 }}>🤖 AI Financial Advisor</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#FFF', fontSize: 20, cursor: 'pointer' }}>×</button>
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 350 }}>
        {messages.length === 0 && (
          <div style={{ color: COLORS.textMuted, fontSize: 13, textAlign: 'center', padding: 20 }}>
            Ask me anything about your finances!
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
              {suggestedQuestions.map(q => (
                <button key={q} onClick={() => setQuestion(q)} style={{ padding: '8px 12px', background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 12, cursor: 'pointer', textAlign: 'left' }}>{q}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{ padding: 12, borderRadius: 12, background: m.role === 'user' ? COLORS.accent : COLORS.bg, color: m.role === 'user' ? '#FFF' : COLORS.text, alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%', fontSize: 13, lineHeight: 1.5 }}>
            {m.content}
          </div>
        ))}
        {loading && <div style={{ color: COLORS.textMuted, fontSize: 13 }}>Thinking...</div>}
      </div>

      <div style={{ padding: 12, borderTop: `1px solid ${COLORS.border}`, display: 'flex', gap: 8 }}>
        <input value={question} onChange={e => setQuestion(e.target.value)} onKeyDown={e => e.key === 'Enter' && askAI()} placeholder="Ask a question..."
          style={{ flex: 1, padding: '10px 14px', border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 14 }} />
        <button onClick={askAI} disabled={loading} style={{ padding: '10px 16px', background: COLORS.accent, color: '#FFF', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>→</button>
      </div>
    </div>
  );
}

// =============================================================================
// AUTO-CATEGORIZE PANEL
// =============================================================================
function AutoCategorizePanel({ apiUrl, authHeader, onRefresh }) {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [result, setResult] = useState(null);
  const [days, setDays] = useState(30);

  const fetchPreview = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${apiUrl}/api/autocategorize/preview?days=${days}`, {
        headers: { 'Authorization': authHeader }
      });
      const data = await res.json();
      setPreview(data);
    } catch (err) {
      console.error('Preview error:', err);
    }
    setLoading(false);
  };

  const applyCategories = async () => {
    if (!window.confirm(`This will categorize ${preview.summary.would_categorize} transactions in YNAB. Continue?`)) return;
    
    setApplying(true);
    try {
      const res = await fetch(`${apiUrl}/api/autocategorize/run?budget_id=last-used`, {
        method: 'POST',
        headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({ dry_run: false, days })
      });
      const data = await res.json();
      setResult(data);
      if (data.updated > 0) {
        onRefresh?.();
      }
    } catch (err) {
      console.error('Apply error:', err);
    }
    setApplying(false);
  };

  return (
    <Card title="🤖 Auto-Categorize Transactions">
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <select value={days} onChange={e => setDays(Number(e.target.value))}
          style={{ padding: '8px 12px', border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 14 }}>
          <option value={7}>Last 7 days</option>
          <option value={14}>Last 14 days</option>
          <option value={30}>Last 30 days</option>
          <option value={60}>Last 60 days</option>
          <option value={90}>Last 90 days</option>
        </select>
        <button onClick={fetchPreview} disabled={loading}
          style={{ padding: '8px 16px', background: COLORS.primary, color: '#FFF', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>
          {loading ? 'Scanning...' : '🔍 Preview'}
        </button>
        {preview && preview.summary.would_categorize > 0 && (
          <button onClick={applyCategories} disabled={applying}
            style={{ padding: '8px 16px', background: COLORS.accent, color: '#FFF', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>
            {applying ? 'Applying...' : `✓ Apply ${preview.summary.would_categorize} to YNAB`}
          </button>
        )}
      </div>

      {result && (
        <div style={{ padding: 12, background: COLORS.accent + '20', borderRadius: 8, marginBottom: 16 }}>
          <p style={{ color: COLORS.accent, fontWeight: 600, margin: 0 }}>
            ✓ Successfully categorized {result.updated} transactions in YNAB!
          </p>
        </div>
      )}

      {preview && (
        <div>
          {/* Summary Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
            <div style={{ padding: 12, background: COLORS.bg, borderRadius: 8, textAlign: 'center' }}>
              <p style={{ fontSize: 24, fontWeight: 700, color: COLORS.textMuted, margin: 0 }}>{preview.summary.total_uncategorized}</p>
              <p style={{ fontSize: 12, color: COLORS.textMuted }}>Uncategorized</p>
            </div>
            <div style={{ padding: 12, background: COLORS.accent + '20', borderRadius: 8, textAlign: 'center' }}>
              <p style={{ fontSize: 24, fontWeight: 700, color: COLORS.accent, margin: 0 }}>{preview.summary.would_categorize}</p>
              <p style={{ fontSize: 12, color: COLORS.accent }}>Can Auto-Cat</p>
            </div>
            <div style={{ padding: 12, background: COLORS.warning + '20', borderRadius: 8, textAlign: 'center' }}>
              <p style={{ fontSize: 24, fontWeight: 700, color: COLORS.warning, margin: 0 }}>{preview.summary.no_match}</p>
              <p style={{ fontSize: 12, color: COLORS.warning }}>No Match</p>
            </div>
            <div style={{ padding: 12, background: COLORS.danger + '20', borderRadius: 8, textAlign: 'center' }}>
              <p style={{ fontSize: 24, fontWeight: 700, color: COLORS.danger, margin: 0 }}>{preview.summary.missing_ynab_category}</p>
              <p style={{ fontSize: 12, color: COLORS.danger }}>Missing in YNAB</p>
            </div>
          </div>

          {/* Would Categorize List */}
          {preview.would_categorize.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <h4 style={{ fontSize: 14, marginBottom: 8 }}>✓ Ready to Categorize ({preview.would_categorize.length})</h4>
              <div style={{ maxHeight: 200, overflowY: 'auto', border: `1px solid ${COLORS.border}`, borderRadius: 8 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: COLORS.bg }}>
                      <th style={{ padding: 8, textAlign: 'left' }}>Date</th>
                      <th style={{ padding: 8, textAlign: 'left' }}>Payee</th>
                      <th style={{ padding: 8, textAlign: 'right' }}>Amount</th>
                      <th style={{ padding: 8, textAlign: 'left' }}>→ Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.would_categorize.map((t, i) => (
                      <tr key={i} style={{ borderTop: `1px solid ${COLORS.border}` }}>
                        <td style={{ padding: 8 }}>{formatDate(t.date)}</td>
                        <td style={{ padding: 8 }}>{t.payee}</td>
                        <td style={{ padding: 8, textAlign: 'right', color: t.amount < 0 ? COLORS.danger : COLORS.accent }}>
                          {formatCurrency(Math.abs(t.amount))}
                        </td>
                        <td style={{ padding: 8, color: COLORS.accent, fontWeight: 500 }}>{t.ynab_category_name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* No Match List */}
          {preview.no_match.length > 0 && (
            <div>
              <h4 style={{ fontSize: 14, marginBottom: 8, color: COLORS.warning }}>⚠ No Matching Rule ({preview.no_match.length})</h4>
              <div style={{ maxHeight: 150, overflowY: 'auto', border: `1px solid ${COLORS.border}`, borderRadius: 8 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: COLORS.bg }}>
                      <th style={{ padding: 8, textAlign: 'left' }}>Date</th>
                      <th style={{ padding: 8, textAlign: 'left' }}>Payee</th>
                      <th style={{ padding: 8, textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.no_match.slice(0, 15).map((t, i) => (
                      <tr key={i} style={{ borderTop: `1px solid ${COLORS.border}` }}>
                        <td style={{ padding: 8 }}>{formatDate(t.date)}</td>
                        <td style={{ padding: 8 }}>{t.payee}</td>
                        <td style={{ padding: 8, textAlign: 'right' }}>{formatCurrency(Math.abs(t.amount))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {preview.no_match.length > 15 && (
                <p style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 8 }}>
                  +{preview.no_match.length - 15} more transactions without rules
                </p>
              )}
            </div>
          )}

          {/* Missing YNAB Categories */}
          {preview.no_category_in_ynab?.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <h4 style={{ fontSize: 14, marginBottom: 8, color: COLORS.danger }}>❌ Missing YNAB Categories</h4>
              <p style={{ fontSize: 13, color: COLORS.textMuted }}>
                Create these categories in YNAB: {[...new Set(preview.no_category_in_ynab.map(t => t.matched_category))].join(', ')}
              </p>
            </div>
          )}
        </div>
      )}

      {!preview && !loading && (
        <p style={{ color: COLORS.textMuted, fontSize: 13 }}>
          Click Preview to scan for uncategorized transactions and see what can be auto-categorized using your Monarch rules (60+ merchants).
        </p>
      )}
    </Card>
  );
}

// =============================================================================
// TRANSACTIONS PANEL WITH EDIT
// =============================================================================
function TransactionsPanel({ apiUrl, authHeader, categories }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [saving, setSaving] = useState(false);
  const [days, setDays] = useState(14);
  const [filter, setFilter] = useState('all'); // all, uncategorized

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/transactions?days=${days}`, {
        headers: { 'Authorization': authHeader }
      });
      const data = await res.json();
      setTransactions(data.data?.transactions || []);
    } catch (err) {
      console.error('Fetch error:', err);
    }
    setLoading(false);
  }, [apiUrl, authHeader, days]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const updateTransaction = async (transactionId) => {
    if (!selectedCategory) return;
    setSaving(true);
    try {
      await fetch(`${apiUrl}/api/transactions/${transactionId}`, {
        method: 'PUT',
        headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({ category_name: selectedCategory })
      });
      setEditingId(null);
      setSelectedCategory('');
      fetchTransactions();
    } catch (err) {
      console.error('Update error:', err);
    }
    setSaving(false);
  };

  const categoryList = categories?.data?.category_groups?.flatMap(g => 
    g.categories.filter(c => !c.hidden).map(c => ({ id: c.id, name: c.name, group: g.name }))
  ) || [];

  const filteredTransactions = filter === 'uncategorized' 
    ? transactions.filter(t => !t.category_name || t.category_name === 'Uncategorized')
    : transactions;

  return (
    <Card 
      title="📋 Recent Transactions" 
      action={
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select value={filter} onChange={e => setFilter(e.target.value)}
            style={{ padding: '6px 10px', border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 13 }}>
            <option value="all">All</option>
            <option value="uncategorized">Uncategorized</option>
          </select>
          <select value={days} onChange={e => setDays(Number(e.target.value))}
            style={{ padding: '6px 10px', border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 13 }}>
            <option value={7}>7 days</option>
            <option value={14}>14 days</option>
            <option value={30}>30 days</option>
            <option value={60}>60 days</option>
          </select>
          <button onClick={fetchTransactions} disabled={loading}
            style={{ padding: '6px 12px', background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>
            {loading ? '...' : '↻'}
          </button>
        </div>
      }
    >
      <div style={{ maxHeight: 500, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: COLORS.bg, position: 'sticky', top: 0 }}>
              <th style={{ padding: 10, textAlign: 'left' }}>Date</th>
              <th style={{ padding: 10, textAlign: 'left' }}>Payee</th>
              <th style={{ padding: 10, textAlign: 'left' }}>Category</th>
              <th style={{ padding: 10, textAlign: 'right' }}>Amount</th>
              <th style={{ padding: 10, width: 100 }}></th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((t) => (
              <tr key={t.id} style={{ borderTop: `1px solid ${COLORS.border}` }}>
                <td style={{ padding: 10 }}>{formatDate(t.date)}</td>
                <td style={{ padding: 10, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.payee_name || 'Unknown'}</td>
                <td style={{ padding: 10 }}>
                  {editingId === t.id ? (
                    <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} autoFocus
                      style={{ padding: 4, fontSize: 12, width: '100%', maxWidth: 180 }}>
                      <option value="">Select category...</option>
                      {categoryList.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  ) : (
                    <span style={{ color: t.category_name && t.category_name !== 'Uncategorized' ? COLORS.text : COLORS.warning, fontWeight: t.category_name ? 400 : 500 }}>
                      {t.category_name || '⚠ Uncategorized'}
                    </span>
                  )}
                </td>
                <td style={{ padding: 10, textAlign: 'right', color: t.amount < 0 ? COLORS.danger : COLORS.accent, fontWeight: 500 }}>
                  {formatCurrency(Math.abs(t.amount / 1000))}
                </td>
                <td style={{ padding: 10, textAlign: 'center' }}>
                  {editingId === t.id ? (
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                      <button onClick={() => updateTransaction(t.id)} disabled={saving || !selectedCategory}
                        style={{ padding: '4px 10px', background: COLORS.accent, color: '#FFF', border: 'none', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}>
                        {saving ? '...' : 'Save'}
                      </button>
                      <button onClick={() => { setEditingId(null); setSelectedCategory(''); }}
                        style={{ padding: '4px 8px', background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 4, fontSize: 12, cursor: 'pointer' }}>
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => { setEditingId(t.id); setSelectedCategory(t.category_name || ''); }}
                      style={{ padding: '4px 10px', background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 4, fontSize: 12, cursor: 'pointer' }}>
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredTransactions.length === 0 && (
          <p style={{ textAlign: 'center', color: COLORS.textMuted, padding: 40 }}>
            {filter === 'uncategorized' ? 'No uncategorized transactions! 🎉' : 'No transactions found'}
          </p>
        )}
      </div>
    </Card>
  );
}

// =============================================================================
// BUDGET VS ACTUAL PANEL
// =============================================================================
function BudgetVsActualPanel({ data, budgetTargets }) {
  if (!data?.categories) return null;

  // Merge with budget targets
  const comparison = data.categories
    .filter(c => c.amount < 0) // Expenses only
    .map(c => {
      const target = budgetTargets?.[c.name.toLowerCase()] || null;
      const actual = Math.abs(c.amount);
      const variance = target ? target - actual : null;
      return {
        name: c.name,
        actual,
        budget: target,
        variance,
        status: variance === null ? 'no-budget' : variance >= 0 ? 'under' : 'over'
      };
    })
    .sort((a, b) => b.actual - a.actual);

  return (
    <Card title="📊 Budget vs Actual">
      <div style={{ maxHeight: 400, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: COLORS.bg }}>
              <th style={{ padding: 10, textAlign: 'left' }}>Category</th>
              <th style={{ padding: 10, textAlign: 'right' }}>Budget</th>
              <th style={{ padding: 10, textAlign: 'right' }}>Actual</th>
              <th style={{ padding: 10, textAlign: 'right' }}>Variance</th>
            </tr>
          </thead>
          <tbody>
            {comparison.map((c, i) => (
              <tr key={i} style={{ borderTop: `1px solid ${COLORS.border}` }}>
                <td style={{ padding: 10 }}>{c.name}</td>
                <td style={{ padding: 10, textAlign: 'right', color: COLORS.textMuted }}>
                  {c.budget ? formatCurrency(c.budget) : '-'}
                </td>
                <td style={{ padding: 10, textAlign: 'right', fontWeight: 500 }}>{formatCurrency(c.actual)}</td>
                <td style={{ padding: 10, textAlign: 'right', fontWeight: 600, color: c.status === 'over' ? COLORS.danger : c.status === 'under' ? COLORS.accent : COLORS.textMuted }}>
                  {c.variance !== null ? (c.variance >= 0 ? '+' : '') + formatCurrency(c.variance) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// =============================================================================
// SPENDING BY CATEGORY CHART
// =============================================================================
function SpendingChart({ data }) {
  if (!data || !data.categories) return null;
  
  const expenses = data.categories
    .filter(c => c.amount < 0)
    .map(c => ({ name: c.name, value: Math.abs(c.amount) }))
    .slice(0, 8);

  return (
    <Card title="💰 Spending by Category">
      <div style={{ display: 'flex', gap: 20 }}>
        <div style={{ width: 180, height: 180 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={expenses} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}>
                {expenses.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => formatCurrency(v)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{ flex: 1 }}>
          {expenses.map((c, i) => (
            <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: `1px solid ${COLORS.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: CHART_COLORS[i % CHART_COLORS.length] }} />
                <span style={{ fontSize: 12 }}>{c.name}</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600 }}>{formatCurrency(c.value)}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

// =============================================================================
// TRENDS CHART
// =============================================================================
function TrendsChart({ data }) {
  if (!data || !data.months || data.months.length < 2) {
    return (
      <Card title="📈 Spending Trends">
        <p style={{ color: COLORS.textMuted, textAlign: 'center', padding: 40 }}>
          Need at least 2 months of YNAB data to show trends.<br/>
          Keep using YNAB and check back later!
        </p>
      </Card>
    );
  }

  const chartData = data.months.map(m => ({
    month: m.month,
    income: m.income,
    expense: m.expense,
    net: m.income - m.expense
  }));

  return (
    <Card title="📈 Income & Expense Trends">
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData}>
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
          <Tooltip formatter={(v) => formatCurrency(v)} />
          <Legend />
          <Area type="monotone" dataKey="income" stroke={COLORS.accent} fill={COLORS.accent + '40'} name="Income" />
          <Area type="monotone" dataKey="expense" stroke={COLORS.danger} fill={COLORS.danger + '40'} name="Expenses" />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}

// =============================================================================
// HELOC ANALYSIS PANEL
// =============================================================================
function HelocPanel({ data }) {
  if (!data) return null;

  return (
    <Card title="🏠 HELOC Payoff Scenarios">
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 13, color: COLORS.textMuted, margin: 0 }}>
          Balance: <strong>{formatCurrency(data.current_balance)}</strong> | 
          Rate: <strong>{(data.interest_rate * 100).toFixed(2)}%</strong> | 
          Draw ends: <strong>{data.draw_period_ends}</strong> ({data.months_remaining_in_draw} months)
        </p>
      </div>
      
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: COLORS.bg }}>
              <th style={{ padding: 10, textAlign: 'left' }}>Extra/mo</th>
              <th style={{ padding: 10, textAlign: 'right' }}>Total Payment</th>
              <th style={{ padding: 10, textAlign: 'right' }}>Payoff Date</th>
              <th style={{ padding: 10, textAlign: 'right' }}>Total Interest</th>
              <th style={{ padding: 10, textAlign: 'right' }}>Interest Saved</th>
            </tr>
          </thead>
          <tbody>
            {data.scenarios.map((s, i) => (
              <tr key={i} style={{ 
                borderTop: `1px solid ${COLORS.border}`, 
                background: s.extra_payment === 1500 ? COLORS.accent + '15' : s.paid_before_draw_end ? COLORS.accent + '08' : 'transparent' 
              }}>
                <td style={{ padding: 10, fontWeight: s.extra_payment === 1500 ? 700 : 400 }}>
                  {s.extra_payment === 0 ? 'Minimum' : `+${formatCurrency(s.extra_payment)}`}
                </td>
                <td style={{ padding: 10, textAlign: 'right' }}>{formatCurrency(s.total_monthly)}</td>
                <td style={{ padding: 10, textAlign: 'right' }}>
                  {new Date(s.payoff_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  {s.paid_before_draw_end && <span style={{ marginLeft: 4, color: COLORS.accent }}>✓</span>}
                </td>
                <td style={{ padding: 10, textAlign: 'right' }}>{formatCurrency(s.total_interest)}</td>
                <td style={{ padding: 10, textAlign: 'right', color: COLORS.accent, fontWeight: 600 }}>
                  {s.interest_saved_vs_minimum > 0 ? formatCurrency(s.interest_saved_vs_minimum) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 12 }}>
        ✓ = Paid off before draw period ends (Jan 2032). Highlighted row = current target ($1,500 extra).
      </p>
    </Card>
  );
}

// =============================================================================
// RETIREMENT PROJECTION PANEL  
// =============================================================================
function RetirementPanel({ data }) {
  if (!data) return null;

  const chartData = data.projections.filter((_, i) => i % 2 === 0 || i === data.projections.length - 1);

  return (
    <Card title="📊 Retirement Projection to Age 60">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        <div style={{ padding: 12, background: COLORS.bg, borderRadius: 8, textAlign: 'center' }}>
          <p style={{ fontSize: 20, fontWeight: 700, color: COLORS.primary, margin: 0 }}>
            {formatCurrency(data.projected_balance_at_retirement)}
          </p>
          <p style={{ fontSize: 12, color: COLORS.textMuted }}>Projected at 60</p>
        </div>
        <div style={{ padding: 12, background: COLORS.bg, borderRadius: 8, textAlign: 'center' }}>
          <p style={{ fontSize: 20, fontWeight: 700, color: COLORS.accent, margin: 0 }}>
            {formatCurrency(data.safe_monthly_withdrawal)}
          </p>
          <p style={{ fontSize: 12, color: COLORS.textMuted }}>Monthly (4% rule)</p>
        </div>
        <div style={{ padding: 12, background: COLORS.bg, borderRadius: 8, textAlign: 'center' }}>
          <p style={{ fontSize: 20, fontWeight: 700, color: COLORS.purple, margin: 0 }}>
            {formatCurrency(data.inflation_adjusted_balance)}
          </p>
          <p style={{ fontSize: 12, color: COLORS.textMuted }}>Today's Dollars</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={chartData}>
          <XAxis dataKey="age" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v/1000000).toFixed(1)}M`} />
          <Tooltip formatter={(v) => formatCurrency(v)} />
          <Legend />
          <Line type="monotone" dataKey="nominal_balance" stroke={COLORS.primary} name="Nominal" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="real_balance" stroke={COLORS.purple} name="Inflation-adjusted" strokeWidth={2} dot={false} strokeDasharray="5 5" />
        </LineChart>
      </ResponsiveContainer>
      <p style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 8 }}>
        Based on ${formatCurrency(data.annual_contribution)}/year contributions, {(data.assumed_return * 100).toFixed(0)}% return, {(data.assumed_inflation * 100).toFixed(0)}% inflation
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
  
  const byType = {
    checking: accts.filter(a => a.type === 'checking'),
    savings: accts.filter(a => a.type === 'savings'),
    creditCard: accts.filter(a => a.type === 'creditCard'),
    mortgage: accts.filter(a => a.type === 'mortgage' || a.type === 'lineOfCredit'),
    investment: accts.filter(a => a.type === 'investmentAccount' || a.type === 'otherAsset'),
  };

  const netWorth = accts.reduce((sum, a) => sum + (a.balance || 0), 0) / 1000;

  return (
    <Card title="🏦 Accounts">
      <div style={{ marginBottom: 16, padding: 12, background: COLORS.primary + '10', borderRadius: 8 }}>
        <p style={{ fontSize: 12, color: COLORS.textMuted, margin: 0 }}>Net Worth (YNAB)</p>
        <p style={{ fontSize: 28, fontWeight: 700, color: COLORS.primary, margin: 0 }}>{formatCurrency(netWorth)}</p>
      </div>

      {Object.entries(byType).map(([type, list]) => list.length > 0 && (
        <div key={type} style={{ marginBottom: 12 }}>
          <h4 style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 6, textTransform: 'capitalize' }}>{type.replace(/([A-Z])/g, ' $1')}</h4>
          {list.map(a => (
            <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${COLORS.border}` }}>
              <span style={{ fontSize: 13 }}>{a.name}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: (a.balance || 0) >= 0 ? COLORS.accent : COLORS.danger }}>
                {formatCurrency((a.balance || 0) / 1000)}
              </span>
            </div>
          ))}
        </div>
      ))}
    </Card>
  );
}

// =============================================================================
// MAIN DASHBOARD
// =============================================================================
export default function GoodlevDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => 
    sessionStorage.getItem('dashboard_authenticated') === 'true'
  );
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [showAI, setShowAI] = useState(false);

  // Period selection
  const [periodType, setPeriodType] = useState('month');
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Data state
  const [accounts, setAccounts] = useState(null);
  const [categories, setCategories] = useState(null);
  const [monthlySummary, setMonthlySummary] = useState(null);
  const [trends, setTrends] = useState(null);
  const [helocData, setHelocData] = useState(null);
  const [retirementData, setRetirementData] = useState(null);

  const apiUrl = import.meta.env.VITE_API_URL || 'https://goodlevdashboard-production.up.railway.app';
  const authHeader = sessionStorage.getItem('dashboard_auth') ? 
    'Basic ' + sessionStorage.getItem('dashboard_auth') : '';

  // Budget targets (from your verified expenses)
  const budgetTargets = {
    'mortgage': 4208,
    'heloc': 1546,
    'therapy': 3000,
    'child care': 876,
    'groceries': 800,
    'shopping': 500,
    'restaurants & bars': 300,
    'gas': 200,
    'fitness': 200,
    'streaming': 100,
  };

  const fetchAllData = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);

    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;

    try {
      const headers = { 'Authorization': authHeader };

      const [accountsRes, categoriesRes, summaryRes, trendsRes, helocRes, retirementRes] = await Promise.all([
        fetch(`${apiUrl}/api/accounts`, { headers }),
        fetch(`${apiUrl}/api/categories`, { headers }),
        fetch(`${apiUrl}/api/analytics/monthly-summary?year=${year}&month=${month}`, { headers }),
        fetch(`${apiUrl}/api/analytics/spending-trends?months=6`, { headers }),
        fetch(`${apiUrl}/api/analytics/heloc-analysis?principal=275809&rate=0.0632&current_payment=1546`, { headers }),
        fetch(`${apiUrl}/api/analytics/retirement-projection?current_balance=500000&annual_contribution=41225&current_age=40&target_age=60`, { headers }),
      ]);

      if (accountsRes.ok) setAccounts(await accountsRes.json());
      if (categoriesRes.ok) setCategories(await categoriesRes.json());
      if (summaryRes.ok) setMonthlySummary(await summaryRes.json());
      if (trendsRes.ok) setTrends(await trendsRes.json());
      if (helocRes.ok) setHelocData(await helocRes.json());
      if (retirementRes.ok) setRetirementData(await retirementRes.json());

      setLastRefresh(new Date());
    } catch (err) {
      console.error('Fetch error:', err);
    }

    setLoading(false);
  }, [isAuthenticated, apiUrl, authHeader, selectedDate]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleLogout = () => {
    sessionStorage.removeItem('dashboard_authenticated');
    sessionStorage.removeItem('dashboard_auth');
    setIsAuthenticated(false);
  };

  // Build financial context for AI
  const financialContext = useMemo(() => {
    if (!monthlySummary || !accounts) return FAMILY_CONTEXT;
    const netWorth = accounts.data?.accounts?.reduce((sum, a) => sum + (a.balance || 0), 0) / 1000 || 0;
    return `${FAMILY_CONTEXT}
CURRENT MONTH (${monthlySummary.year}-${monthlySummary.month}):
- Income: ${formatCurrency(monthlySummary.total_income)}
- Expenses: ${formatCurrency(monthlySummary.total_expense)}
- Net: ${formatCurrency(monthlySummary.net)}
- Net Worth (YNAB): ${formatCurrency(netWorth)}
`;
  }, [monthlySummary, accounts]);

  if (!isAuthenticated) {
    return <LoginScreen onLogin={() => setIsAuthenticated(true)} />;
  }

  const tabs = [
    { id: 'dashboard', label: '📊 Dashboard' },
    { id: 'categorize', label: '🤖 Auto-Cat' },
    { id: 'transactions', label: '📋 Transactions' },
    { id: 'projections', label: '📈 Projections' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: COLORS.bg }}>
      {/* Header */}
      <div style={{ background: COLORS.bgCard, borderBottom: `1px solid ${COLORS.border}`, padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>🏠 Goodlev Dashboard</h1>
          <div style={{ display: 'flex', gap: 4 }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                style={{ 
                  padding: '8px 16px', 
                  background: activeTab === t.id ? COLORS.primary : 'transparent',
                  color: activeTab === t.id ? '#FFF' : COLORS.text,
                  border: 'none', 
                  borderRadius: 6, 
                  fontSize: 14, 
                  cursor: 'pointer',
                  fontWeight: activeTab === t.id ? 600 : 400
                }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {lastRefresh && (
            <span style={{ fontSize: 12, color: COLORS.textMuted }}>
              Updated {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <button onClick={fetchAllData} disabled={loading}
            style={{ padding: '8px 16px', background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>
            {loading ? 'Loading...' : '↻ Refresh'}
          </button>
          <button onClick={handleLogout}
            style={{ padding: '8px 16px', background: COLORS.danger, color: '#FFF', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>
            Logout
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
        {activeTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Period Selector */}
            <PeriodSelector 
              periodType={periodType} 
              setPeriodType={setPeriodType} 
              selectedDate={selectedDate} 
              setSelectedDate={setSelectedDate} 
            />

            {/* Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              <StatCard 
                label="Monthly Income" 
                value={formatCurrency(monthlySummary?.total_income || 0)} 
                color={COLORS.accent} 
              />
              <StatCard 
                label="Monthly Expenses" 
                value={formatCurrency(monthlySummary?.total_expense || 0)} 
                color={COLORS.danger} 
              />
              <StatCard 
                label="Net This Month" 
                value={formatCurrency(monthlySummary?.net || 0)} 
                color={(monthlySummary?.net || 0) >= 0 ? COLORS.accent : COLORS.danger} 
              />
              <StatCard 
                label="Target Surplus" 
                value={formatCurrency(3922)} 
                subtext="Based on $18,703 expenses"
                color={COLORS.primary} 
              />
            </div>

            {/* Charts Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <SpendingChart data={monthlySummary} />
              <AccountsPanel accounts={accounts} />
            </div>

            {/* Budget vs Actual + Trends */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <BudgetVsActualPanel data={monthlySummary} budgetTargets={budgetTargets} />
              <TrendsChart data={trends} />
            </div>
          </div>
        )}

        {activeTab === 'categorize' && (
          <AutoCategorizePanel apiUrl={apiUrl} authHeader={authHeader} onRefresh={fetchAllData} />
        )}

        {activeTab === 'transactions' && (
          <TransactionsPanel apiUrl={apiUrl} authHeader={authHeader} categories={categories} />
        )}

        {activeTab === 'projections' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <HelocPanel data={helocData} />
            <RetirementPanel data={retirementData} />
          </div>
        )}
      </div>

      {/* AI Advisor FAB */}
      <button onClick={() => setShowAI(!showAI)} style={{
        position: 'fixed', bottom: 24, right: 24, width: 56, height: 56,
        borderRadius: '50%', background: COLORS.primary, color: '#FFF',
        border: 'none', fontSize: 24, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999
      }}>
        {showAI ? '×' : '🤖'}
      </button>

      {/* AI Advisor Panel */}
      <AIAdvisor isOpen={showAI} onClose={() => setShowAI(false)} financialContext={financialContext} />
    </div>
  );
}
