import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';

// =============================================================================
// GOODLEV FAMILY FINANCIAL DASHBOARD v3.0
// =============================================================================
// Features:
// - YNAB live data + Monarch historical data
// - AI Financial Advisor (via backend)
// - Budget vs Actual with variance tracking
// - Manual account tracking (AXA/Equitable)
// - Period navigation (Week/Month/Quarter/Year/YTD)
// - Transaction drill-down
// - Goals & Scenarios
// =============================================================================

const COLORS = {
  primary: '#1E3A5F',
  accent: '#27AE60',
  danger: '#E74C3C',
  warning: '#F39C12',
  info: '#3498DB',
  text: '#2C3E50',
  textMuted: '#95A5A6',
  bg: '#F8F9FA',
  bgCard: '#FFFFFF',
  border: '#E5E7EB',
};

const BASELINE = {
  monthlyIncome: 22625,
  monthlyExpenses: 18703,
  surplus: 3922,
  helocBalance: 275809,
  helocRate: 6.32,
  mortgageBalance: 468000,
  mortgageRate: 2.25,
  totalRetirement: 645449,
  annualRetirementContrib: 41225,
  retirementTarget: 4000000,
  emergencyFund: 24049,
  emergencyTarget: 56109,
  balance529: 85747,
};

const formatCurrency = (val) => {
  if (val === undefined || val === null) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
};

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// =============================================================================
// LOGIN SCREEN
// =============================================================================
function LoginScreen({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simple client-side check - real auth is via API key
    if (password === import.meta.env.VITE_DASHBOARD_PASSWORD) {
      sessionStorage.setItem('dashboard_authenticated', 'true');
      onLogin();
    } else {
      setError('Invalid password');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: COLORS.bg }}>
      <div style={{ background: COLORS.bgCard, padding: 40, borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', width: 360 }}>
        <h1 style={{ textAlign: 'center', color: COLORS.primary, marginBottom: 8 }}>🏦 Goodlev Dashboard</h1>
        <p style={{ textAlign: 'center', color: COLORS.textMuted, marginBottom: 24 }}>Family Financial Planning</p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            style={{ width: '100%', padding: 14, borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 16, marginBottom: 16 }}
          />
          {error && <p style={{ color: COLORS.danger, fontSize: 13, marginBottom: 12 }}>{error}</p>}
          <button type="submit" style={{ width: '100%', padding: 14, background: COLORS.primary, color: '#FFF', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}

// =============================================================================
// PERIOD NAVIGATOR
// =============================================================================
function PeriodNavigator({ periodType, setPeriodType, selectedDate, setSelectedDate }) {
  const periods = ['week', 'month', 'quarter', 'year', 'ytd'];

  const navigate = (direction) => {
    const d = new Date(selectedDate);
    switch (periodType) {
      case 'week': d.setDate(d.getDate() + direction * 7); break;
      case 'month': d.setMonth(d.getMonth() + direction); break;
      case 'quarter': d.setMonth(d.getMonth() + direction * 3); break;
      case 'year': d.setFullYear(d.getFullYear() + direction); break;
      case 'ytd': d.setFullYear(d.getFullYear() + direction); break;
      default: break;
    }
    setSelectedDate(d);
  };

  const getLabel = () => {
    const d = new Date(selectedDate);
    switch (periodType) {
      case 'week': 
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;
      case 'month': return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      case 'quarter': return `Q${Math.floor(d.getMonth() / 3) + 1} ${d.getFullYear()}`;
      case 'year': return d.getFullYear().toString();
      case 'ytd': return `YTD ${d.getFullYear()}`;
      default: return '';
    }
  };

  const getDates = () => {
    const d = new Date(selectedDate);
    let start, end;
    switch (periodType) {
      case 'week':
        start = new Date(d);
        start.setDate(d.getDate() - d.getDay());
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        break;
      case 'month':
        start = new Date(d.getFullYear(), d.getMonth(), 1);
        end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        break;
      case 'quarter':
        const qStart = Math.floor(d.getMonth() / 3) * 3;
        start = new Date(d.getFullYear(), qStart, 1);
        end = new Date(d.getFullYear(), qStart + 3, 0);
        break;
      case 'year':
        start = new Date(d.getFullYear(), 0, 1);
        end = new Date(d.getFullYear(), 11, 31);
        break;
      case 'ytd':
        start = new Date(d.getFullYear(), 0, 1);
        end = new Date();
        break;
      default:
        start = end = d;
    }
    return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0], label: getLabel() };
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
      <div style={{ display: 'flex', gap: 4 }}>
        {periods.map((p) => (
          <button
            key={p}
            onClick={() => setPeriodType(p)}
            style={{
              padding: '8px 14px',
              borderRadius: 6,
              border: `1px solid ${periodType === p ? COLORS.accent : COLORS.border}`,
              background: periodType === p ? `${COLORS.accent}20` : 'transparent',
              color: periodType === p ? COLORS.accent : COLORS.text,
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {p === 'ytd' ? 'YTD' : p}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={() => navigate(-1)} style={{ width: 32, height: 32, borderRadius: 6, border: `1px solid ${COLORS.border}`, background: 'transparent', cursor: 'pointer', fontSize: 16 }}>←</button>
        <span style={{ fontWeight: 600, minWidth: 160, textAlign: 'center', color: COLORS.text }}>{getLabel()}</span>
        <button onClick={() => navigate(1)} style={{ width: 32, height: 32, borderRadius: 6, border: `1px solid ${COLORS.border}`, background: 'transparent', cursor: 'pointer', fontSize: 16 }}>→</button>
      </div>
    </div>
  );
}

// =============================================================================
// KPI CARD
// =============================================================================
function KPICard({ title, value, subtitle, trend, icon, color = COLORS.primary }) {
  return (
    <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${COLORS.border}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: 13, color: COLORS.textMuted, margin: 0 }}>{title}</p>
          <p style={{ fontSize: 28, fontWeight: 700, color, margin: '8px 0 4px' }}>{value}</p>
          {subtitle && <p style={{ fontSize: 12, color: COLORS.textMuted, margin: 0 }}>{subtitle}</p>}
        </div>
        <span style={{ fontSize: 32 }}>{icon}</span>
      </div>
      {trend !== undefined && (
        <p style={{ fontSize: 12, color: trend >= 0 ? COLORS.accent : COLORS.danger, marginTop: 8, margin: 0 }}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last period
        </p>
      )}
    </div>
  );
}

// =============================================================================
// BUDGET VS ACTUAL
// =============================================================================
function BudgetVsActual({ data, onCategoryClick }) {
  if (!data || !data.categories) {
    return <div style={{ padding: 20, textAlign: 'center', color: COLORS.textMuted }}>Loading budget data...</div>;
  }

  const chartData = data.categories.slice(0, 10).map(c => ({
    name: c.category.length > 15 ? c.category.substring(0, 15) + '...' : c.category,
    fullName: c.category,
    budgeted: c.budgeted,
    actual: c.actual,
    variance: c.variance,
  }));

  return (
    <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${COLORS.border}` }}>
      <h3 style={{ margin: '0 0 16px', color: COLORS.text }}>📊 Budget vs Actual</h3>
      
      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <div style={{ flex: 1, padding: 12, background: COLORS.bg, borderRadius: 8 }}>
          <p style={{ fontSize: 12, color: COLORS.textMuted, margin: 0 }}>Total Budgeted</p>
          <p style={{ fontSize: 20, fontWeight: 600, color: COLORS.primary, margin: '4px 0 0' }}>{formatCurrency(data.summary?.total_budgeted)}</p>
        </div>
        <div style={{ flex: 1, padding: 12, background: COLORS.bg, borderRadius: 8 }}>
          <p style={{ fontSize: 12, color: COLORS.textMuted, margin: 0 }}>Total Actual</p>
          <p style={{ fontSize: 20, fontWeight: 600, color: COLORS.text, margin: '4px 0 0' }}>{formatCurrency(data.summary?.total_actual)}</p>
        </div>
        <div style={{ flex: 1, padding: 12, background: data.summary?.total_variance >= 0 ? `${COLORS.accent}15` : `${COLORS.danger}15`, borderRadius: 8 }}>
          <p style={{ fontSize: 12, color: COLORS.textMuted, margin: 0 }}>Variance</p>
          <p style={{ fontSize: 20, fontWeight: 600, color: data.summary?.total_variance >= 0 ? COLORS.accent : COLORS.danger, margin: '4px 0 0' }}>
            {data.summary?.total_variance >= 0 ? '+' : ''}{formatCurrency(data.summary?.total_variance)}
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
          <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v) => formatCurrency(v)} />
          <Legend />
          <Bar dataKey="budgeted" fill={COLORS.info} name="Budget" />
          <Bar dataKey="actual" fill={COLORS.primary} name="Actual" onClick={(d) => onCategoryClick && onCategoryClick(d.fullName)} style={{ cursor: 'pointer' }} />
        </BarChart>
      </ResponsiveContainer>

      <div style={{ marginTop: 16 }}>
        <p style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 8 }}>
          🔴 {data.summary?.categories_over || 0} over budget &nbsp;|&nbsp; 
          🟢 {data.summary?.categories_under || 0} under budget
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// SPENDING BY CATEGORY (PIE)
// =============================================================================
function SpendingPie({ data }) {
  const CHART_COLORS = ['#1E3A5F', '#27AE60', '#E74C3C', '#F39C12', '#9B59B6', '#3498DB', '#1ABC9C', '#E67E22', '#95A5A6', '#34495E'];
  
  if (!data || !data.categories) return null;

  const pieData = data.categories.slice(0, 8).map((c, i) => ({
    name: c.category,
    value: c.amount,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  return (
    <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${COLORS.border}` }}>
      <h3 style={{ margin: '0 0 16px', color: COLORS.text }}>🥧 Spending Breakdown</h3>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
            {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
          </Pie>
          <Tooltip formatter={(v) => formatCurrency(v)} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// =============================================================================
// MANUAL ACCOUNTS (AXA/Equitable)
// =============================================================================
function ManualAccounts({ apiUrl, apiKey }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editBalance, setEditBalance] = useState('');

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/manual-accounts`, { headers: { 'X-API-Key': apiKey } });
      if (res.ok) setAccounts(await res.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const updateBalance = async (account) => {
    try {
      await fetch(`${apiUrl}/api/manual-accounts/${account.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
        body: JSON.stringify({ ...account, balance: parseFloat(editBalance) })
      });
      setEditingId(null);
      fetchAccounts();
    } catch (e) { console.error(e); }
  };

  const isStale = (lastUpdated) => {
    if (!lastUpdated) return true;
    return (new Date() - new Date(lastUpdated)) / (1000 * 60 * 60 * 24) > 90;
  };

  const total = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);

  if (loading) return <div style={{ padding: 20, color: COLORS.textMuted }}>Loading...</div>;

  return (
    <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${COLORS.border}` }}>
      <h3 style={{ margin: '0 0 4px', color: COLORS.text }}>📋 Manual Accounts</h3>
      <p style={{ fontSize: 12, color: COLORS.textMuted, margin: '0 0 16px' }}>AXA/Equitable - update quarterly</p>

      {accounts.length === 0 ? (
        <p style={{ color: COLORS.textMuted, textAlign: 'center', padding: 20 }}>No manual accounts configured</p>
      ) : (
        <div>
          {accounts.map(acc => (
            <div key={acc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${COLORS.border}` }}>
              <div>
                <p style={{ fontWeight: 500, margin: 0, fontSize: 14 }}>{acc.name}</p>
                <p style={{ fontSize: 11, color: COLORS.textMuted, margin: '2px 0 0' }}>{acc.institution} • {acc.owner}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                {editingId === acc.id ? (
                  <div style={{ display: 'flex', gap: 4 }}>
                    <input type="number" value={editBalance} onChange={(e) => setEditBalance(e.target.value)} style={{ width: 100, padding: 4, borderRadius: 4, border: `1px solid ${COLORS.accent}` }} />
                    <button onClick={() => updateBalance(acc)} style={{ padding: '4px 8px', background: COLORS.accent, color: '#FFF', border: 'none', borderRadius: 4, fontSize: 11 }}>Save</button>
                  </div>
                ) : (
                  <>
                    <p style={{ fontWeight: 600, margin: 0 }}>{formatCurrency(acc.balance)}</p>
                    <p style={{ fontSize: 10, color: isStale(acc.last_updated) ? COLORS.danger : COLORS.textMuted, margin: '2px 0' }}>
                      {isStale(acc.last_updated) && '⚠️ '}{acc.last_updated ? new Date(acc.last_updated).toLocaleDateString() : 'Never'}
                    </p>
                    <button onClick={() => { setEditingId(acc.id); setEditBalance(acc.balance?.toString()); }} style={{ padding: '2px 8px', background: COLORS.primary, color: '#FFF', border: 'none', borderRadius: 4, fontSize: 10, cursor: 'pointer' }}>Update</button>
                  </>
                )}
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontWeight: 600 }}>
            <span>Total</span>
            <span style={{ color: COLORS.primary }}>{formatCurrency(total)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// AI ADVISOR
// =============================================================================
function AIAdvisor({ isOpen, onClose, apiUrl, apiKey }) {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const suggestions = [
    "Should I prioritize HELOC or retirement?",
    "Am I on track for my goals?",
    "How should I handle 3 kids in college?",
    "What if therapy costs increase 10%?",
  ];

  const askAI = async (q = question) => {
    if (!q.trim() || loading) return;
    setLoading(true);
    setQuestion('');
    setMessages(prev => [...prev, { role: 'user', content: q }]);

    try {
      const res = await fetch(`${apiUrl}/api/ai/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
        body: JSON.stringify({ question: q, include_context: true })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.success ? data.answer : `Error: ${data.error}` }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Connection error: ${e.message}` }]);
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', bottom: 90, right: 24, width: 400, maxHeight: '70vh', background: COLORS.bgCard, borderRadius: 16, boxShadow: '0 10px 40px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', zIndex: 1000 }}>
      <div style={{ padding: 16, background: COLORS.primary, color: '#FFF', borderRadius: '16px 16px 0 0', display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <span style={{ fontWeight: 600 }}>🤖 AI Financial Advisor</span>
          <div style={{ fontSize: 11, opacity: 0.8 }}>Powered by Claude</div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#FFF', fontSize: 24, cursor: 'pointer' }}>×</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 350 }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
            <p style={{ color: COLORS.textMuted, fontSize: 14 }}>Ask me anything about your finances!</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => askAI(s)} style={{ padding: 10, background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 12, cursor: 'pointer', textAlign: 'left' }}>{s}</button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} style={{ padding: 12, borderRadius: 12, background: m.role === 'user' ? COLORS.accent : COLORS.bg, color: m.role === 'user' ? '#FFF' : COLORS.text, alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%', fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
              {m.content}
            </div>
          ))
        )}
        {loading && <div style={{ color: COLORS.textMuted, fontSize: 13 }}>Thinking...</div>}
      </div>

      <div style={{ padding: 12, borderTop: `1px solid ${COLORS.border}`, display: 'flex', gap: 8 }}>
        <input value={question} onChange={e => setQuestion(e.target.value)} onKeyDown={e => e.key === 'Enter' && askAI()} placeholder="Ask a question..." style={{ flex: 1, padding: 10, border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 14 }} />
        <button onClick={() => askAI()} disabled={loading} style={{ padding: '10px 16px', background: COLORS.accent, color: '#FFF', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>→</button>
      </div>
    </div>
  );
}

// =============================================================================
// GOALS PANEL
// =============================================================================
function GoalsPanel({ allocations, setAllocations, surplus }) {
  const total = Object.values(allocations).reduce((a, b) => a + b, 0);
  const remaining = surplus - total;

  const handleChange = (key, value) => {
    setAllocations(prev => ({ ...prev, [key]: Math.max(0, parseInt(value) || 0) }));
  };

  const categories = [
    { key: 'heloc', label: 'HELOC Extra', icon: '🏠', color: COLORS.danger },
    { key: 'retirement', label: 'Retirement Extra', icon: '👴', color: COLORS.info },
    { key: 'emergency', label: 'Emergency Fund', icon: '🛡️', color: COLORS.warning },
    { key: 'education', label: '529 Education', icon: '🎓', color: COLORS.accent },
    { key: 'vacation', label: 'Vacation', icon: '✈️', color: '#9B59B6' },
  ];

  return (
    <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${COLORS.border}` }}>
      <h3 style={{ margin: '0 0 16px', color: COLORS.text }}>🎯 Surplus Allocation</h3>
      <p style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 16 }}>
        Monthly surplus: <strong>{formatCurrency(surplus)}</strong> &nbsp;|&nbsp;
        Allocated: <strong>{formatCurrency(total)}</strong> &nbsp;|&nbsp;
        <span style={{ color: remaining >= 0 ? COLORS.accent : COLORS.danger }}>
          Remaining: <strong>{formatCurrency(remaining)}</strong>
        </span>
      </p>

      {categories.map(({ key, label, icon, color }) => (
        <div key={key} style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 13 }}>{icon} {label}</span>
            <span style={{ fontWeight: 600, color }}>{formatCurrency(allocations[key])}</span>
          </div>
          <input
            type="range"
            min="0"
            max={surplus}
            value={allocations[key]}
            onChange={(e) => handleChange(key, e.target.value)}
            style={{ width: '100%', accentColor: color }}
          />
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// ACCOUNTS SUMMARY
// =============================================================================
function AccountsSummary({ accounts }) {
  if (!accounts || accounts.length === 0) {
    return <div style={{ padding: 20, color: COLORS.textMuted }}>No accounts loaded</div>;
  }

  const grouped = accounts.reduce((acc, a) => {
    const type = a.type || 'other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(a);
    return acc;
  }, {});

  return (
    <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${COLORS.border}` }}>
      <h3 style={{ margin: '0 0 16px', color: COLORS.text }}>💳 Accounts</h3>
      {Object.entries(grouped).map(([type, accts]) => (
        <div key={type} style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 11, color: COLORS.textMuted, textTransform: 'uppercase', marginBottom: 8 }}>{type}</p>
          {accts.map(a => (
            <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${COLORS.border}` }}>
              <span style={{ fontSize: 13 }}>{a.name}</span>
              <span style={{ fontWeight: 600, color: a.balance < 0 ? COLORS.danger : COLORS.text }}>{formatCurrency(a.balance)}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// TRENDS CHART
// =============================================================================
function TrendsChart({ apiUrl, apiKey }) {
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock historical data for now - will be replaced by API
    const mockTrends = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      mockTrends.push({
        month: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        income: 22000 + Math.random() * 5000,
        expenses: 17000 + Math.random() * 4000,
      });
    }
    setTrends(mockTrends);
    setLoading(false);
  }, []);

  if (loading) return <div style={{ padding: 20, color: COLORS.textMuted }}>Loading trends...</div>;

  return (
    <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${COLORS.border}` }}>
      <h3 style={{ margin: '0 0 16px', color: COLORS.text }}>📈 Income vs Expenses (12 Months)</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={trends}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
          <Tooltip formatter={(v) => formatCurrency(v)} />
          <Legend />
          <Line type="monotone" dataKey="income" stroke={COLORS.accent} strokeWidth={2} name="Income" />
          <Line type="monotone" dataKey="expenses" stroke={COLORS.danger} strokeWidth={2} name="Expenses" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// =============================================================================
// MAIN DASHBOARD
// =============================================================================
export default function GoodlevDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => sessionStorage.getItem('dashboard_authenticated') === 'true');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [aiOpen, setAiOpen] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL || 'https://goodlevdashboard.up.railway.app';
  const apiKey = import.meta.env.VITE_API_KEY || 'goodlev2026';

  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  // Period state
  const [periodType, setPeriodType] = useState('month');
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Data state
  const [accounts, setAccounts] = useState([]);
  const [spending, setSpending] = useState(null);
  const [budgetVsActual, setBudgetVsActual] = useState(null);
  const [allocations, setAllocations] = useState({ heloc: 1961, retirement: 784, emergency: 392, education: 392, vacation: 393 });

  const getPeriodDates = () => {
    const d = new Date(selectedDate);
    let start, end;
    switch (periodType) {
      case 'month':
        start = new Date(d.getFullYear(), d.getMonth(), 1);
        end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        break;
      default:
        start = new Date(d.getFullYear(), d.getMonth(), 1);
        end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    }
    return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
  };

  // API helper
  const api = useCallback(async (endpoint, options = {}) => {
    const res = await fetch(`${apiUrl}${endpoint}`, {
      ...options,
      headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json', ...options.headers }
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  }, [apiUrl, apiKey]);

  // Check connection on load
  useEffect(() => {
    if (isAuthenticated) {
      api('/health').then(data => {
        setConnected(data.status === 'healthy');
      }).catch(() => setConnected(false));
    }
  }, [isAuthenticated, api]);

  // Load data when connected and period changes
  useEffect(() => {
    if (!connected) return;
    
    const { start, end } = getPeriodDates();
    
    setLoading(true);
    Promise.all([
      api('/api/accounts').catch(() => []),
      api(`/api/spending/by-category?start_date=${start}&end_date=${end}`).catch(() => null),
      api(`/api/budget-vs-actual?start_date=${start}&end_date=${end}`).catch(() => null),
    ]).then(([accts, spend, budget]) => {
      setAccounts(accts);
      setSpending(spend);
      setBudgetVsActual(budget);
      setLoading(false);
    });
  }, [connected, periodType, selectedDate, api]);

  if (!isAuthenticated) {
    return <LoginScreen onLogin={() => setIsAuthenticated(true)} />;
  }

  const tabs = [
    { id: 'dashboard', label: '📊 Dashboard' },
    { id: 'budget', label: '💰 Budget' },
    { id: 'goals', label: '🎯 Goals' },
    { id: 'accounts', label: '💳 Accounts' },
    { id: 'trends', label: '📈 Trends' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: COLORS.bg }}>
      {/* Header */}
      <header style={{ background: COLORS.primary, color: '#FFF', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20 }}>🏦 Goodlev Family Dashboard</h1>
          <p style={{ margin: '4px 0 0', fontSize: 12, opacity: 0.8 }}>
            {connected ? '✓ Connected to YNAB' : '⚠️ Not connected'} 
            {loading && ' • Loading...'}
          </p>
        </div>
        <button onClick={() => { sessionStorage.removeItem('dashboard_authenticated'); setIsAuthenticated(false); }} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#FFF', padding: '8px 16px', borderRadius: 6, cursor: 'pointer' }}>
          Sign Out
        </button>
      </header>

      {/* Tabs */}
      <nav style={{ background: COLORS.bgCard, borderBottom: `1px solid ${COLORS.border}`, padding: '0 24px', display: 'flex', gap: 4 }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '16px 20px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === tab.id ? `3px solid ${COLORS.accent}` : '3px solid transparent',
              color: activeTab === tab.id ? COLORS.accent : COLORS.text,
              fontWeight: activeTab === tab.id ? 600 : 400,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <main style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
        <PeriodNavigator periodType={periodType} setPeriodType={setPeriodType} selectedDate={selectedDate} setSelectedDate={setSelectedDate} />

        {activeTab === 'dashboard' && (
          <div>
            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
              <KPICard title="Monthly Income" value={formatCurrency(spending?.total_income || BASELINE.monthlyIncome)} icon="💵" color={COLORS.accent} />
              <KPICard title="Monthly Expenses" value={formatCurrency(spending?.total_spent || BASELINE.monthlyExpenses)} icon="📉" color={COLORS.danger} />
              <KPICard title="Surplus" value={formatCurrency(BASELINE.surplus)} subtitle="Available to allocate" icon="✨" color={COLORS.accent} />
              <KPICard title="Net Worth" value={formatCurrency(1387592)} icon="📊" color={COLORS.primary} />
            </div>

            {/* Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
              <BudgetVsActual data={budgetVsActual} />
              <SpendingPie data={spending} />
            </div>
          </div>
        )}

        {activeTab === 'budget' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <BudgetVsActual data={budgetVsActual} />
            <SpendingPie data={spending} />
          </div>
        )}

        {activeTab === 'goals' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <GoalsPanel allocations={allocations} setAllocations={setAllocations} surplus={BASELINE.surplus} />
            <ManualAccounts apiUrl={apiUrl} apiKey={apiKey} />
          </div>
        )}

        {activeTab === 'accounts' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <AccountsSummary accounts={accounts} />
            <ManualAccounts apiUrl={apiUrl} apiKey={apiKey} />
          </div>
        )}

        {activeTab === 'trends' && (
          <TrendsChart apiUrl={apiUrl} apiKey={apiKey} />
        )}
      </main>

      {/* AI Advisor Button */}
      <button
        onClick={() => setAiOpen(!aiOpen)}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 60,
          height: 60,
          borderRadius: '50%',
          background: aiOpen ? COLORS.textMuted : COLORS.accent,
          color: '#FFF',
          border: 'none',
          fontSize: 28,
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          zIndex: 999,
        }}
      >
        {aiOpen ? '×' : '🤖'}
      </button>

      {/* AI Advisor Panel */}
      <AIAdvisor isOpen={aiOpen} onClose={() => setAiOpen(false)} apiUrl={apiUrl} apiKey={apiKey} />
    </div>
  );
}
