import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area } from 'recharts';

// =============================================================================
// GOODLEV FAMILY FINANCIAL DASHBOARD v4.0
// =============================================================================
// Features:
// - YNAB live data + Monarch historical data
// - AI Financial Advisor (via backend)
// - Budget vs Actual with variance tracking
// - Spending Trends Analysis
// - Smart Budget Recommendations
// - Scenario Planning & Comparison
// - Manual account tracking (AXA/Equitable)
// =============================================================================

const COLORS = {
  primary: '#1E3A5F',
  accent: '#27AE60',
  danger: '#E74C3C',
  warning: '#F39C12',
  info: '#3498DB',
  purple: '#9B59B6',
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

// =============================================================================
// LOGIN SCREEN
// =============================================================================
function LoginScreen({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
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
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password"
            style={{ width: '100%', padding: 14, borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 16, marginBottom: 16 }} />
          {error && <p style={{ color: COLORS.danger, fontSize: 13, marginBottom: 12 }}>{error}</p>}
          <button type="submit" style={{ width: '100%', padding: 14, background: COLORS.primary, color: '#FFF', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>Sign In</button>
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
      case 'year': case 'ytd': d.setFullYear(d.getFullYear() + direction); break;
    }
    setSelectedDate(d);
  };

  const getLabel = () => {
    const d = new Date(selectedDate);
    switch (periodType) {
      case 'month': return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      case 'quarter': return `Q${Math.floor(d.getMonth() / 3) + 1} ${d.getFullYear()}`;
      case 'year': return d.getFullYear().toString();
      case 'ytd': return `YTD ${d.getFullYear()}`;
      default: return '';
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
      <div style={{ display: 'flex', gap: 4 }}>
        {periods.map((p) => (
          <button key={p} onClick={() => setPeriodType(p)}
            style={{ padding: '8px 14px', borderRadius: 6, border: `1px solid ${periodType === p ? COLORS.accent : COLORS.border}`,
              background: periodType === p ? `${COLORS.accent}20` : 'transparent', color: periodType === p ? COLORS.accent : COLORS.text,
              fontSize: 13, fontWeight: 500, cursor: 'pointer', textTransform: 'capitalize' }}>
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
function KPICard({ title, value, subtitle, icon, color = COLORS.primary }) {
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
    </div>
  );
}

// =============================================================================
// BUDGET VS ACTUAL
// =============================================================================
function BudgetVsActual({ data }) {
  if (!data || !data.categories) {
    return <div style={{ padding: 20, textAlign: 'center', color: COLORS.textMuted }}>Loading budget data...</div>;
  }

  const chartData = data.categories.slice(0, 10).map(c => ({
    name: c.category.length > 15 ? c.category.substring(0, 15) + '...' : c.category,
    budgeted: c.budgeted,
    actual: c.actual,
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
          <Bar dataKey="actual" fill={COLORS.primary} name="Actual" />
        </BarChart>
      </ResponsiveContainer>

      <p style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 12 }}>
        🔴 {data.summary?.categories_over || 0} over budget | 🟢 {data.summary?.categories_under || 0} under budget
      </p>
    </div>
  );
}

// =============================================================================
// SPENDING TRENDS
// =============================================================================
function SpendingTrends({ apiUrl, apiKey }) {
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);
  const [months, setMonths] = useState(6);

  useEffect(() => {
    fetch(`${apiUrl}/api/spending/trends?months=${months}`, { headers: { 'X-API-Key': apiKey } })
      .then(r => r.json())
      .then(setTrends)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [months, apiUrl, apiKey]);

  if (loading) return <div style={{ padding: 20, color: COLORS.textMuted }}>Loading trends...</div>;
  if (!trends) return null;

  // Prepare chart data
  const chartData = trends.months?.map(month => {
    const monthData = { month: month.slice(5) }; // Just MM
    Object.entries(trends.monthly_data?.[month] || {}).slice(0, 5).forEach(([cat, amt]) => {
      const shortCat = cat.replace(/[^\w\s]/g, '').slice(0, 10);
      monthData[shortCat] = amt;
    });
    return monthData;
  }) || [];

  // Top trending categories
  const trendingUp = Object.entries(trends.category_stats || {})
    .filter(([_, s]) => s.trend_percent > 10)
    .sort((a, b) => b[1].trend_percent - a[1].trend_percent)
    .slice(0, 3);

  const trendingDown = Object.entries(trends.category_stats || {})
    .filter(([_, s]) => s.trend_percent < -10)
    .sort((a, b) => a[1].trend_percent - b[1].trend_percent)
    .slice(0, 3);

  return (
    <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${COLORS.border}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0, color: COLORS.text }}>📈 Spending Trends</h3>
        <select value={months} onChange={(e) => setMonths(Number(e.target.value))}
          style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${COLORS.border}` }}>
          <option value={3}>3 months</option>
          <option value={6}>6 months</option>
          <option value={12}>12 months</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={{ padding: 12, background: `${COLORS.danger}10`, borderRadius: 8 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: COLORS.danger, margin: '0 0 8px' }}>📈 Trending Up</p>
          {trendingUp.length > 0 ? trendingUp.map(([cat, s]) => (
            <p key={cat} style={{ fontSize: 12, margin: '4px 0', color: COLORS.text }}>
              {cat.replace(/[^\w\s]/g, '').slice(0, 20)}: <span style={{ color: COLORS.danger }}>+{s.trend_percent.toFixed(0)}%</span>
            </p>
          )) : <p style={{ fontSize: 12, color: COLORS.textMuted }}>No significant increases</p>}
        </div>
        <div style={{ padding: 12, background: `${COLORS.accent}10`, borderRadius: 8 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: COLORS.accent, margin: '0 0 8px' }}>📉 Trending Down</p>
          {trendingDown.length > 0 ? trendingDown.map(([cat, s]) => (
            <p key={cat} style={{ fontSize: 12, margin: '4px 0', color: COLORS.text }}>
              {cat.replace(/[^\w\s]/g, '').slice(0, 20)}: <span style={{ color: COLORS.accent }}>{s.trend_percent.toFixed(0)}%</span>
            </p>
          )) : <p style={{ fontSize: 12, color: COLORS.textMuted }}>No significant decreases</p>}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// BUDGET RECOMMENDATIONS
// =============================================================================
function BudgetRecommendations({ apiUrl, apiKey }) {
  const [recs, setRecs] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${apiUrl}/api/budget/recommendations`, { headers: { 'X-API-Key': apiKey } })
      .then(r => r.json())
      .then(setRecs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [apiUrl, apiKey]);

  if (loading) return <div style={{ padding: 20, color: COLORS.textMuted }}>Analyzing spending patterns...</div>;
  if (!recs?.recommendations?.length) {
    return (
      <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${COLORS.border}` }}>
        <h3 style={{ margin: '0 0 12px', color: COLORS.text }}>💡 Budget Recommendations</h3>
        <p style={{ color: COLORS.accent }}>✓ Your budget aligns well with actual spending!</p>
      </div>
    );
  }

  return (
    <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${COLORS.border}` }}>
      <h3 style={{ margin: '0 0 16px', color: COLORS.text }}>💡 Budget Recommendations</h3>
      
      {recs.potential_reallocation > 0 && (
        <div style={{ padding: 12, background: `${COLORS.accent}15`, borderRadius: 8, marginBottom: 16 }}>
          <p style={{ margin: 0, fontSize: 14 }}>
            💰 Potential monthly reallocation: <strong style={{ color: COLORS.accent }}>{formatCurrency(recs.potential_reallocation)}</strong>
          </p>
        </div>
      )}

      {recs.recommendations.map((rec, i) => (
        <div key={i} style={{ padding: 12, borderBottom: i < recs.recommendations.length - 1 ? `1px solid ${COLORS.border}` : 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontWeight: 600 }}>
              {rec.type === 'increase' ? '⬆️' : '⬇️'} {rec.category}
            </span>
            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, 
              background: rec.priority === 'high' ? COLORS.danger : rec.priority === 'medium' ? COLORS.warning : COLORS.accent,
              color: '#FFF' }}>
              {rec.priority}
            </span>
          </div>
          <p style={{ fontSize: 12, color: COLORS.textMuted, margin: '4px 0' }}>{rec.reason}</p>
          <p style={{ fontSize: 13, margin: '8px 0 0' }}>
            Current: {formatCurrency(rec.current_budget)} → Suggested: <strong style={{ color: COLORS.accent }}>{formatCurrency(rec.suggested_budget)}</strong>
          </p>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// ACTION ITEMS TAB
// =============================================================================
function ActionItems({ apiUrl, apiKey }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetch(`${apiUrl}/api/action-items`, { headers: { 'X-API-Key': apiKey } })
      .then(r => r.json())
      .then(data => setItems(data.action_items || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [apiUrl, apiKey]);

  const updateStatus = async (itemId, newStatus) => {
    await fetch(`${apiUrl}/api/action-items/${itemId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
      body: JSON.stringify({ status: newStatus })
    });
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, status: newStatus } : item
    ));
  };

  const filteredItems = filter === 'all' ? items : items.filter(i => i.priority === filter);
  const statusColors = { not_started: COLORS.textMuted, in_progress: COLORS.warning, completed: COLORS.accent, deferred: COLORS.info };
  const priorityColors = { high: COLORS.danger, medium: COLORS.warning, low: COLORS.accent };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: COLORS.textMuted }}>Generating action items...</div>;

  return (
    <div>
      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 16, border: `1px solid ${COLORS.border}`, textAlign: 'center' }}>
          <p style={{ fontSize: 28, fontWeight: 700, color: COLORS.danger, margin: 0 }}>{items.filter(i => i.priority === 'high').length}</p>
          <p style={{ fontSize: 12, color: COLORS.textMuted, margin: '4px 0 0' }}>High Priority</p>
        </div>
        <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 16, border: `1px solid ${COLORS.border}`, textAlign: 'center' }}>
          <p style={{ fontSize: 28, fontWeight: 700, color: COLORS.warning, margin: 0 }}>{items.filter(i => i.priority === 'medium').length}</p>
          <p style={{ fontSize: 12, color: COLORS.textMuted, margin: '4px 0 0' }}>Medium Priority</p>
        </div>
        <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 16, border: `1px solid ${COLORS.border}`, textAlign: 'center' }}>
          <p style={{ fontSize: 28, fontWeight: 700, color: COLORS.accent, margin: 0 }}>{items.filter(i => i.priority === 'low').length}</p>
          <p style={{ fontSize: 12, color: COLORS.textMuted, margin: '4px 0 0' }}>Low Priority</p>
        </div>
        <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 16, border: `1px solid ${COLORS.border}`, textAlign: 'center' }}>
          <p style={{ fontSize: 28, fontWeight: 700, color: COLORS.accent, margin: 0 }}>{items.filter(i => i.status === 'completed').length}</p>
          <p style={{ fontSize: 12, color: COLORS.textMuted, margin: '4px 0 0' }}>Completed</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['all', 'high', 'medium', 'low'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: '8px 16px', borderRadius: 6, fontSize: 12, cursor: 'pointer', textTransform: 'capitalize',
              background: filter === f ? COLORS.primary : 'transparent',
              color: filter === f ? '#FFF' : COLORS.text,
              border: `1px solid ${filter === f ? COLORS.primary : COLORS.border}` }}>
            {f === 'all' ? 'All Items' : `${f} Priority`}
          </button>
        ))}
      </div>

      {/* Action Items List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filteredItems.map(item => (
          <div key={item.id} style={{ background: COLORS.bgCard, borderRadius: 12, padding: 16, border: `1px solid ${COLORS.border}`, borderLeft: `4px solid ${priorityColors[item.priority]}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 16, fontWeight: 600 }}>{item.title}</span>
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: priorityColors[item.priority], color: '#FFF' }}>{item.priority}</span>
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: COLORS.bg, color: COLORS.textMuted }}>{item.category}</span>
                </div>
                <p style={{ fontSize: 13, color: COLORS.textMuted, margin: 0 }}>{item.description}</p>
              </div>
              <select value={item.status || 'not_started'} onChange={(e) => updateStatus(item.id, e.target.value)}
                style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${COLORS.border}`, fontSize: 11, background: `${statusColors[item.status || 'not_started']}20`, cursor: 'pointer' }}>
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="deferred">Deferred</option>
              </select>
            </div>

            <div style={{ padding: 12, background: COLORS.bg, borderRadius: 8, marginBottom: 8 }}>
              <p style={{ fontSize: 12, margin: 0 }}><strong>Action:</strong> {item.action}</p>
              {item.potential_gain && <p style={{ fontSize: 12, margin: '8px 0 0', color: COLORS.accent }}><strong>Potential Gain:</strong> {item.potential_gain}</p>}
            </div>

            <button onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
              style={{ background: 'none', border: 'none', color: COLORS.info, fontSize: 12, cursor: 'pointer', padding: 0 }}>
              {expandedId === item.id ? '▼ Hide Steps' : '▶ Show Steps'}
            </button>

            {expandedId === item.id && item.steps && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${COLORS.border}` }}>
                <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Steps to Complete:</p>
                {item.steps.map((step, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: COLORS.textMuted, minWidth: 20 }}>{i + 1}.</span>
                    <span style={{ fontSize: 12 }}>{step}</span>
                  </div>
                ))}
                {item.note && (
                  <p style={{ fontSize: 11, fontStyle: 'italic', color: COLORS.warning, marginTop: 8, padding: 8, background: `${COLORS.warning}10`, borderRadius: 4 }}>
                    ⚠️ {item.note}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// CUSTOM SCENARIO BUILDER (with sliders)
// =============================================================================
function CustomScenarioBuilder({ apiUrl, apiKey, surplus = 3922 }) {
  const [allocations, setAllocations] = useState({
    heloc_extra: 0,
    retirement_extra: 0,
    emergency_extra: 0,
    education_extra: 0,
    vacation_extra: 0
  });
  const [projections, setProjections] = useState(null);
  const [loading, setLoading] = useState(false);

  const totalAllocated = Object.values(allocations).reduce((a, b) => a + b, 0);
  const remaining = surplus - totalAllocated;

  useEffect(() => {
    if (totalAllocated === 0) {
      setProjections(null);
      return;
    }
    
    const timer = setTimeout(() => {
      setLoading(true);
      fetch(`${apiUrl}/api/scenarios/custom`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
        body: JSON.stringify(allocations)
      })
        .then(r => r.json())
        .then(setProjections)
        .catch(console.error)
        .finally(() => setLoading(false));
    }, 300); // Debounce

    return () => clearTimeout(timer);
  }, [allocations, apiUrl, apiKey]);

  const handleSlider = (key, value) => {
    const newValue = Math.min(value, remaining + allocations[key]);
    setAllocations(prev => ({ ...prev, [key]: newValue }));
  };

  const sliderConfig = [
    { key: 'heloc_extra', label: '🏠 HELOC Extra', color: COLORS.danger, description: 'Pay off debt faster, save interest' },
    { key: 'retirement_extra', label: '📈 Retirement', color: COLORS.accent, description: 'Compound growth for future' },
    { key: 'emergency_extra', label: '🛡️ Emergency Fund', color: COLORS.info, description: 'Safety net for unexpected expenses' },
    { key: 'education_extra', label: '🎓 529 Education', color: COLORS.warning, description: 'Tax-free college savings' },
    { key: 'vacation_extra', label: '✈️ Vacation', color: COLORS.purple, description: 'Annual travel budget' }
  ];

  return (
    <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${COLORS.border}` }}>
      <h3 style={{ margin: '0 0 8px', color: COLORS.text }}>🎛️ Custom Scenario Builder</h3>
      <p style={{ fontSize: 12, color: COLORS.textMuted, margin: '0 0 16px' }}>
        Drag sliders to allocate your ${surplus.toLocaleString()}/month surplus
      </p>

      {/* Allocation Bar */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 12 }}>Allocated: <strong>{formatCurrency(totalAllocated)}</strong></span>
          <span style={{ fontSize: 12, color: remaining < 0 ? COLORS.danger : COLORS.accent }}>
            Remaining: <strong>{formatCurrency(remaining)}</strong>
          </span>
        </div>
        <div style={{ height: 8, background: COLORS.bg, borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ 
            height: '100%', 
            width: `${Math.min(100, (totalAllocated / surplus) * 100)}%`,
            background: remaining < 0 ? COLORS.danger : COLORS.accent,
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>

      {/* Sliders */}
      {sliderConfig.map(({ key, label, color, description }) => (
        <div key={key} style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color }}>{formatCurrency(allocations[key])}</span>
          </div>
          <input type="range" min="0" max={surplus} step="50" value={allocations[key]}
            onChange={(e) => handleSlider(key, parseInt(e.target.value))}
            style={{ width: '100%', accentColor: color, cursor: 'pointer' }} />
          <p style={{ fontSize: 10, color: COLORS.textMuted, margin: '2px 0 0' }}>{description}</p>
        </div>
      ))}

      {/* Quick Presets */}
      <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${COLORS.border}` }}>
        <p style={{ fontSize: 11, fontWeight: 600, marginBottom: 8 }}>Quick Presets:</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => setAllocations({ heloc_extra: surplus, retirement_extra: 0, emergency_extra: 0, education_extra: 0, vacation_extra: 0 })}
            style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: `1px solid ${COLORS.danger}`, background: 'transparent', color: COLORS.danger, cursor: 'pointer' }}>
            All to HELOC
          </button>
          <button onClick={() => setAllocations({ heloc_extra: 0, retirement_extra: surplus, emergency_extra: 0, education_extra: 0, vacation_extra: 0 })}
            style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: `1px solid ${COLORS.accent}`, background: 'transparent', color: COLORS.accent, cursor: 'pointer' }}>
            All to Retirement
          </button>
          <button onClick={() => setAllocations({ heloc_extra: surplus * 0.5, retirement_extra: surplus * 0.25, emergency_extra: surplus * 0.15, education_extra: surplus * 0.1, vacation_extra: 0 })}
            style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: `1px solid ${COLORS.info}`, background: 'transparent', color: COLORS.info, cursor: 'pointer' }}>
            Balanced
          </button>
          <button onClick={() => setAllocations({ heloc_extra: 0, retirement_extra: 0, emergency_extra: 0, education_extra: 0, vacation_extra: 0 })}
            style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: `1px solid ${COLORS.textMuted}`, background: 'transparent', color: COLORS.textMuted, cursor: 'pointer' }}>
            Reset
          </button>
        </div>
      </div>

      {/* Projections */}
      {loading && <p style={{ marginTop: 16, color: COLORS.textMuted, fontSize: 12 }}>Calculating...</p>}
      
      {projections && !loading && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${COLORS.border}` }}>
          <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 12 }}>📊 Projected Outcomes</p>
          
          {projections.warnings?.length > 0 && (
            <div style={{ padding: 8, background: `${COLORS.warning}15`, borderRadius: 6, marginBottom: 12 }}>
              {projections.warnings.map((w, i) => (
                <p key={i} style={{ fontSize: 11, color: COLORS.warning, margin: i > 0 ? '4px 0 0' : 0 }}>⚠️ {w}</p>
              ))}
            </div>
          )}
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{ padding: 10, background: COLORS.bg, borderRadius: 6 }}>
              <p style={{ fontSize: 10, color: COLORS.textMuted, margin: 0 }}>HELOC Payoff</p>
              <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.danger, margin: '2px 0 0' }}>{projections.projections?.heloc?.payoff_date}</p>
            </div>
            <div style={{ padding: 10, background: COLORS.bg, borderRadius: 6 }}>
              <p style={{ fontSize: 10, color: COLORS.textMuted, margin: 0 }}>Retirement at 60</p>
              <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.accent, margin: '2px 0 0' }}>{formatCurrency(projections.projections?.retirement?.at_age_60)}</p>
            </div>
            <div style={{ padding: 10, background: COLORS.bg, borderRadius: 6 }}>
              <p style={{ fontSize: 10, color: COLORS.textMuted, margin: 0 }}>Emergency Fund (1yr)</p>
              <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.info, margin: '2px 0 0' }}>{projections.projections?.emergency?.months_coverage} months</p>
            </div>
            <div style={{ padding: 10, background: COLORS.bg, borderRadius: 6 }}>
              <p style={{ fontSize: 10, color: COLORS.textMuted, margin: 0 }}>529 in 10 years</p>
              <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.warning, margin: '2px 0 0' }}>{formatCurrency(projections.projections?.education?.projected_10yr)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// ENHANCED SCENARIO COMPARISON (with tweakable sliders)
// =============================================================================
function ScenarioComparison({ apiUrl, apiKey }) {
  const [scenarios, setScenarios] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [tweakMode, setTweakMode] = useState(false);
  const [tweakedAllocations, setTweakedAllocations] = useState({});

  useEffect(() => {
    fetch(`${apiUrl}/api/scenarios`, { headers: { 'X-API-Key': apiKey } })
      .then(r => r.json())
      .then(data => { 
        setScenarios(data); 
        setSelected(data?.scenarios?.[0]?.name);
        if (data?.scenarios?.[0]) {
          setTweakedAllocations(data.scenarios[0].allocations || {});
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [apiUrl, apiKey]);

  const activeScenario = scenarios?.scenarios?.find(s => s.name === selected);
  const surplus = scenarios?.current_surplus || 3922;

  const handleSelectScenario = (name) => {
    setSelected(name);
    const scenario = scenarios?.scenarios?.find(s => s.name === name);
    if (scenario?.allocations) {
      setTweakedAllocations(scenario.allocations);
    }
    setTweakMode(false);
  };

  if (loading) return <div style={{ padding: 20, color: COLORS.textMuted }}>Calculating scenarios...</div>;
  if (!scenarios?.scenarios) return null;

  return (
    <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${COLORS.border}` }}>
      <h3 style={{ margin: '0 0 8px', color: COLORS.text }}>🎯 Surplus Allocation Scenarios</h3>
      <p style={{ fontSize: 12, color: COLORS.textMuted, margin: '0 0 16px' }}>
        Monthly surplus: <strong>{formatCurrency(surplus)}</strong>
      </p>

      {/* Scenario Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {scenarios.scenarios.map(s => (
          <button key={s.name} onClick={() => handleSelectScenario(s.name)}
            style={{ padding: '8px 12px', borderRadius: 6, border: `1px solid ${selected === s.name ? COLORS.accent : COLORS.border}`,
              background: selected === s.name ? `${COLORS.accent}15` : 'transparent', fontSize: 12, cursor: 'pointer',
              color: selected === s.name ? COLORS.accent : COLORS.text, fontWeight: selected === s.name ? 600 : 400 }}>
            {s.name}
          </button>
        ))}
      </div>

      {activeScenario && (
        <div>
          <p style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 12 }}>{activeScenario.description}</p>
          
          {/* Tweak Toggle */}
          <button onClick={() => setTweakMode(!tweakMode)}
            style={{ marginBottom: 12, padding: '6px 12px', fontSize: 11, borderRadius: 6, 
              border: `1px solid ${tweakMode ? COLORS.accent : COLORS.border}`,
              background: tweakMode ? `${COLORS.accent}15` : 'transparent',
              color: tweakMode ? COLORS.accent : COLORS.text, cursor: 'pointer' }}>
            {tweakMode ? '✓ Tweaking...' : '🎛️ Tweak This Scenario'}
          </button>

          {/* Tweakable Sliders */}
          {tweakMode && (
            <div style={{ padding: 12, background: COLORS.bg, borderRadius: 8, marginBottom: 16 }}>
              {Object.entries(tweakedAllocations).map(([key, value]) => (
                <div key={key} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</span>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{formatCurrency(value)}</span>
                  </div>
                  <input type="range" min="0" max={surplus} step="50" value={value}
                    onChange={(e) => setTweakedAllocations(prev => ({ ...prev, [key]: parseInt(e.target.value) }))}
                    style={{ width: '100%', cursor: 'pointer' }} />
                </div>
              ))}
              <p style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 8 }}>
                Total allocated: {formatCurrency(Object.values(tweakedAllocations).reduce((a, b) => a + b, 0))} / {formatCurrency(surplus)}
              </p>
            </div>
          )}
          
          {/* Projections */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, marginBottom: 16 }}>
            {Object.entries(activeScenario.projections || {}).map(([key, value]) => (
              <div key={key} style={{ padding: 10, background: COLORS.bg, borderRadius: 8 }}>
                <p style={{ fontSize: 10, color: COLORS.textMuted, margin: 0, textTransform: 'capitalize' }}>
                  {key.replace(/_/g, ' ')}
                </p>
                <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.primary, margin: '4px 0 0' }}>
                  {typeof value === 'number' && value > 1000 ? formatCurrency(value) : value}
                </p>
              </div>
            ))}
          </div>

          {/* Pros/Cons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ padding: 12, background: `${COLORS.accent}10`, borderRadius: 8 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: COLORS.accent, margin: '0 0 8px' }}>✓ Pros</p>
              {activeScenario.pros?.map((p, i) => (
                <p key={i} style={{ fontSize: 12, margin: '4px 0', color: COLORS.text }}>• {p}</p>
              ))}
            </div>
            <div style={{ padding: 12, background: `${COLORS.danger}10`, borderRadius: 8 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: COLORS.danger, margin: '0 0 8px' }}>✗ Cons</p>
              {activeScenario.cons?.map((c, i) => (
                <p key={i} style={{ fontSize: 12, margin: '4px 0', color: COLORS.text }}>• {c}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recommendation */}
      <div style={{ marginTop: 16, padding: 12, background: `${COLORS.info}15`, borderRadius: 8, border: `1px solid ${COLORS.info}` }}>
        <p style={{ margin: 0, fontSize: 13 }}>
          <strong>💡 Recommended:</strong> {scenarios.recommendation}
        </p>
        <p style={{ margin: '8px 0 0', fontSize: 12, color: COLORS.textMuted }}>{scenarios.recommendation_reason}</p>
      </div>
    </div>
  );
}

// =============================================================================
// TRANSACTION DRILL-DOWN (by category)
// =============================================================================
function TransactionDrillDown({ apiUrl, apiKey, periodDates }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [dataIntegrity, setDataIntegrity] = useState(null);

  // Fetch all transactions for the period
  useEffect(() => {
    if (!periodDates?.start) return;
    setLoading(true);
    
    Promise.all([
      fetch(`${apiUrl}/api/transactions?since_date=${periodDates.start}`, { headers: { 'X-API-Key': apiKey } }).then(r => r.json()),
      fetch(`${apiUrl}/api/data-integrity?start_date=${periodDates.start}&end_date=${periodDates.end}`, { headers: { 'X-API-Key': apiKey } }).then(r => r.json()).catch(() => null)
    ]).then(([txns, integrity]) => {
      setTransactions(txns || []);
      setDataIntegrity(integrity);
      
      // Build category list with totals
      const catTotals = {};
      (txns || []).forEach(t => {
        if (t.amount < 0) {
          const cat = t.category || 'Uncategorized';
          catTotals[cat] = (catTotals[cat] || 0) + Math.abs(t.amount);
        }
      });
      setCategories(Object.entries(catTotals).sort((a, b) => b[1] - a[1]));
    }).finally(() => setLoading(false));
  }, [periodDates, apiUrl, apiKey]);

  const filteredTxns = selectedCategory 
    ? transactions.filter(t => t.category === selectedCategory && t.amount < 0)
    : transactions.filter(t => t.amount < 0);

  return (
    <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${COLORS.border}` }}>
      <h3 style={{ margin: '0 0 16px', color: COLORS.text }}>🔍 Transaction Details</h3>
      
      {/* Data Integrity Panel */}
      {dataIntegrity && (
        <div style={{ padding: 12, background: `${COLORS.accent}10`, borderRadius: 8, marginBottom: 16, border: `1px solid ${COLORS.accent}` }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: COLORS.accent, margin: '0 0 8px' }}>✓ Data Integrity Verified</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, fontSize: 11 }}>
            <div>
              <span style={{ color: COLORS.textMuted }}>Transactions:</span>
              <span style={{ marginLeft: 4, fontWeight: 600 }}>{dataIntegrity.total_transactions}</span>
            </div>
            <div>
              <span style={{ color: COLORS.textMuted }}>Excluded transfers:</span>
              <span style={{ marginLeft: 4, fontWeight: 600, color: COLORS.warning }}>{dataIntegrity.excluded_transfers}</span>
            </div>
            <div>
              <span style={{ color: COLORS.textMuted }}>Excluded CC payments:</span>
              <span style={{ marginLeft: 4, fontWeight: 600, color: COLORS.warning }}>{dataIntegrity.excluded_cc_payments}</span>
            </div>
          </div>
          <p style={{ fontSize: 10, color: COLORS.textMuted, margin: '8px 0 0' }}>
            Transfers and credit card payments are excluded to prevent double-counting
          </p>
        </div>
      )}

      {/* Category selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button onClick={() => setSelectedCategory(null)}
          style={{ padding: '6px 12px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
            background: !selectedCategory ? COLORS.primary : 'transparent',
            color: !selectedCategory ? '#FFF' : COLORS.text,
            border: `1px solid ${!selectedCategory ? COLORS.primary : COLORS.border}` }}>
          All ({filteredTxns.length})
        </button>
        {categories.slice(0, 8).map(([cat, total]) => (
          <button key={cat} onClick={() => setSelectedCategory(cat)}
            style={{ padding: '6px 12px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
              background: selectedCategory === cat ? COLORS.primary : 'transparent',
              color: selectedCategory === cat ? '#FFF' : COLORS.text,
              border: `1px solid ${selectedCategory === cat ? COLORS.primary : COLORS.border}` }}>
            {cat.slice(0, 15)} ({formatCurrency(total)})
          </button>
        ))}
      </div>

      {/* Transaction list */}
      <div style={{ maxHeight: 300, overflowY: 'auto' }}>
        {loading ? (
          <p style={{ color: COLORS.textMuted }}>Loading transactions...</p>
        ) : filteredTxns.length === 0 ? (
          <p style={{ color: COLORS.textMuted }}>No transactions found</p>
        ) : (
          filteredTxns.slice(0, 50).map((t, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${COLORS.border}`, fontSize: 12 }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 500 }}>{t.payee?.slice(0, 30)}</span>
                <span style={{ marginLeft: 8, color: COLORS.textMuted, fontSize: 10 }}>{t.date}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontWeight: 600, color: COLORS.danger }}>{formatCurrency(Math.abs(t.amount))}</span>
                <span style={{ display: 'block', fontSize: 10, color: COLORS.textMuted }}>{t.category?.slice(0, 20)}</span>
              </div>
            </div>
          ))
        )}
        {filteredTxns.length > 50 && (
          <p style={{ fontSize: 11, color: COLORS.textMuted, textAlign: 'center', padding: 8 }}>
            Showing 50 of {filteredTxns.length} transactions
          </p>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// COMBINED BUDGET EDITOR + RECOMMENDATIONS (with Apply buttons)
// =============================================================================
function SmartBudgetEditor({ apiUrl, apiKey }) {
  const [targets, setTargets] = useState({});
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [applying, setApplying] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch(`${apiUrl}/api/budget-targets`, { headers: { 'X-API-Key': apiKey } }).then(r => r.json()),
      fetch(`${apiUrl}/api/budget/recommendations`, { headers: { 'X-API-Key': apiKey } }).then(r => r.json())
    ]).then(([targetData, recData]) => {
      setTargets(targetData.targets || {});
      setRecommendations(recData.recommendations || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, [apiUrl, apiKey]);

  const saveTarget = async (category, newValue) => {
    const value = parseFloat(newValue);
    if (isNaN(value)) return;
    
    setApplying(category);
    await fetch(`${apiUrl}/api/budget-targets`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
      body: JSON.stringify({ [category]: value })
    });
    
    setTargets(prev => ({ ...prev, [category]: value }));
    setEditing(null);
    setApplying(null);
    
    // Remove the recommendation since it was applied
    setRecommendations(prev => prev.filter(r => r.category.toLowerCase().replace(/\s+/g, '_') !== category));
  };

  const applyRecommendation = (rec) => {
    const categoryKey = rec.category.toLowerCase().replace(/\s+/g, '_');
    saveTarget(categoryKey, rec.suggested_budget);
  };

  const totalBudget = Object.values(targets).reduce((a, b) => a + b, 0);
  const potentialSavings = recommendations
    .filter(r => r.type === 'decrease')
    .reduce((sum, r) => sum + (r.current_budget - r.suggested_budget), 0);

  if (loading) return <div style={{ padding: 20, color: COLORS.textMuted }}>Analyzing budget...</div>;

  return (
    <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${COLORS.border}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0, color: COLORS.text }}>💡 Smart Budget Editor</h3>
        <span style={{ fontSize: 12, color: COLORS.textMuted }}>Total: {formatCurrency(totalBudget)}/mo</span>
      </div>

      {/* Recommendations with Apply buttons */}
      {recommendations.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: COLORS.accent, marginBottom: 12 }}>
            📊 Recommendations Based on Your Spending
          </p>
          
          {potentialSavings > 0 && (
            <div style={{ padding: 10, background: `${COLORS.accent}15`, borderRadius: 8, marginBottom: 12, fontSize: 12 }}>
              💰 Potential reallocation: <strong>{formatCurrency(potentialSavings)}/mo</strong> to HELOC or retirement
            </div>
          )}

          {recommendations.map((rec, i) => (
            <div key={i} style={{ padding: 12, background: COLORS.bg, borderRadius: 8, marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <span style={{ fontWeight: 600 }}>
                    {rec.type === 'increase' ? '⬆️' : '⬇️'} {rec.category}
                  </span>
                  <span style={{ fontSize: 10, marginLeft: 8, padding: '2px 6px', borderRadius: 4,
                    background: rec.priority === 'high' ? COLORS.danger : rec.priority === 'medium' ? COLORS.warning : COLORS.accent,
                    color: '#FFF' }}>
                    {rec.priority}
                  </span>
                </div>
                <button onClick={() => applyRecommendation(rec)} disabled={applying === rec.category}
                  style={{ padding: '6px 12px', background: COLORS.accent, color: '#FFF', border: 'none', 
                    borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    opacity: applying === rec.category ? 0.5 : 1 }}>
                  {applying === rec.category ? 'Applying...' : 'Apply →'}
                </button>
              </div>
              <p style={{ fontSize: 11, color: COLORS.textMuted, margin: '0 0 8px' }}>{rec.reason}</p>
              <div style={{ fontSize: 12 }}>
                <span style={{ color: COLORS.danger }}>{formatCurrency(rec.current_budget)}</span>
                <span style={{ margin: '0 8px' }}>→</span>
                <span style={{ color: COLORS.accent, fontWeight: 600 }}>{formatCurrency(rec.suggested_budget)}</span>
                {rec.type === 'decrease' && (
                  <span style={{ marginLeft: 8, fontSize: 10, color: COLORS.accent }}>
                    (saves {formatCurrency(rec.current_budget - rec.suggested_budget)}/mo)
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* All budget categories */}
      <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 12 }}>All Budget Categories</p>
      <div style={{ maxHeight: 300, overflowY: 'auto' }}>
        {Object.entries(targets).sort((a, b) => b[1] - a[1]).map(([cat, amount]) => (
          <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${COLORS.border}` }}>
            <span style={{ fontSize: 13, textTransform: 'capitalize' }}>{cat.replace(/_/g, ' ')}</span>
            {editing === cat ? (
              <div style={{ display: 'flex', gap: 4 }}>
                <input type="number" value={editValue} onChange={(e) => setEditValue(e.target.value)}
                  style={{ width: 80, padding: 4, borderRadius: 4, border: `1px solid ${COLORS.accent}`, textAlign: 'right' }} />
                <button onClick={() => saveTarget(cat, editValue)} style={{ padding: '4px 8px', background: COLORS.accent, color: '#FFF', border: 'none', borderRadius: 4, fontSize: 11 }}>Save</button>
                <button onClick={() => setEditing(null)} style={{ padding: '4px 8px', background: COLORS.textMuted, color: '#FFF', border: 'none', borderRadius: 4, fontSize: 11 }}>×</button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 600 }}>{formatCurrency(amount)}</span>
                <button onClick={() => { setEditing(cat); setEditValue(amount.toString()); }}
                  style={{ padding: '2px 8px', background: COLORS.primary, color: '#FFF', border: 'none', borderRadius: 4, fontSize: 10, cursor: 'pointer' }}>Edit</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// OPTIMIZATION SUGGESTIONS (bundle services, consolidate, etc.)
// =============================================================================
function OptimizationSuggestions({ apiUrl, apiKey }) {
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${apiUrl}/api/optimization-suggestions`, { headers: { 'X-API-Key': apiKey } })
      .then(r => r.json())
      .then(setSuggestions)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [apiUrl, apiKey]);

  if (loading) return <div style={{ padding: 20, color: COLORS.textMuted }}>Analyzing optimization opportunities...</div>;
  if (!suggestions?.suggestions?.length) {
    return (
      <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${COLORS.border}` }}>
        <h3 style={{ margin: '0 0 12px', color: COLORS.text }}>🎯 Optimization Opportunities</h3>
        <p style={{ color: COLORS.textMuted, fontSize: 13 }}>No obvious optimization opportunities found. Your spending looks efficient!</p>
      </div>
    );
  }

  return (
    <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${COLORS.border}` }}>
      <h3 style={{ margin: '0 0 8px', color: COLORS.text }}>🎯 Optimization Opportunities</h3>
      {suggestions.total_potential_savings > 0 && (
        <p style={{ fontSize: 13, color: COLORS.accent, margin: '0 0 16px' }}>
          💰 Potential annual savings: <strong>{formatCurrency(suggestions.total_potential_savings)}</strong>
        </p>
      )}

      {suggestions.suggestions.map((s, i) => (
        <div key={i} style={{ padding: 12, background: COLORS.bg, borderRadius: 8, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>{s.icon} {s.title}</span>
            {s.potential_savings > 0 && (
              <span style={{ fontSize: 12, color: COLORS.accent, fontWeight: 600 }}>
                Save {formatCurrency(s.potential_savings)}/yr
              </span>
            )}
          </div>
          <p style={{ fontSize: 12, color: COLORS.textMuted, margin: '0 0 8px' }}>{s.description}</p>
          {s.action_items && (
            <div style={{ fontSize: 11 }}>
              <p style={{ fontWeight: 600, margin: '8px 0 4px' }}>Action items:</p>
              {s.action_items.map((item, j) => (
                <p key={j} style={{ margin: '2px 0', color: COLORS.text }}>• {item}</p>
              ))}
            </div>
          )}
          {s.impact && (
            <p style={{ fontSize: 11, marginTop: 8, padding: 8, background: `${COLORS.accent}15`, borderRadius: 4 }}>
              <strong>Impact:</strong> {s.impact}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// NET WORTH BREAKDOWN (with proper real estate)
// =============================================================================
function NetWorthBreakdown({ apiUrl, apiKey }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingRealEstate, setEditingRealEstate] = useState(false);
  const [realEstateValue, setRealEstateValue] = useState('');

  useEffect(() => {
    fetch(`${apiUrl}/api/net-worth`, { headers: { 'X-API-Key': apiKey } })
      .then(r => r.json())
      .then(data => {
        setData(data);
        setRealEstateValue(data.assets?.real_estate?.toString() || '1424800');
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [apiUrl, apiKey]);

  const updateRealEstate = async () => {
    const value = parseFloat(realEstateValue);
    if (isNaN(value)) return;
    
    // Update via API (would need backend endpoint)
    setData(prev => ({
      ...prev,
      assets: { ...prev.assets, real_estate: value },
      total_assets: prev.total_assets - (prev.assets.real_estate || 0) + value,
      net_worth: prev.net_worth - (prev.assets.real_estate || 0) + value
    }));
    setEditingRealEstate(false);
  };

  if (loading) return <div style={{ padding: 20, color: COLORS.textMuted }}>Calculating net worth...</div>;
  if (!data) return null;

  const assetColors = { 
    checking_savings: COLORS.info, 
    retirement: COLORS.accent, 
    investment: COLORS.purple, 
    '529_education': COLORS.warning, 
    real_estate: '#8B4513',  // Brown for real estate
    other_assets: COLORS.textMuted 
  };
  
  const pieData = Object.entries(data.assets || {})
    .filter(([_, v]) => v > 0)
    .map(([k, v]) => ({ 
      name: k.replace(/_/g, ' ').replace('529', '529 '), 
      value: v, 
      color: assetColors[k] || COLORS.textMuted 
    }));

  return (
    <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${COLORS.border}` }}>
      <h3 style={{ margin: '0 0 16px', color: COLORS.text }}>💰 Net Worth Breakdown</h3>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
        <div style={{ padding: 12, background: `${COLORS.accent}15`, borderRadius: 8, textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: COLORS.textMuted, margin: 0 }}>Total Assets</p>
          <p style={{ fontSize: 18, fontWeight: 700, color: COLORS.accent, margin: '4px 0 0' }}>{formatCurrency(data.total_assets)}</p>
        </div>
        <div style={{ padding: 12, background: `${COLORS.danger}15`, borderRadius: 8, textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: COLORS.textMuted, margin: 0 }}>Total Liabilities</p>
          <p style={{ fontSize: 18, fontWeight: 700, color: COLORS.danger, margin: '4px 0 0' }}>{formatCurrency(data.total_liabilities)}</p>
        </div>
        <div style={{ padding: 12, background: `${COLORS.primary}15`, borderRadius: 8, textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: COLORS.textMuted, margin: 0 }}>Net Worth</p>
          <p style={{ fontSize: 18, fontWeight: 700, color: COLORS.primary, margin: '4px 0 0' }}>{formatCurrency(data.net_worth)}</p>
        </div>
      </div>

      {/* Assets pie chart */}
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}>
            {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
          </Pie>
          <Tooltip formatter={(v) => formatCurrency(v)} />
          <Legend wrapperStyle={{ fontSize: 10 }} />
        </PieChart>
      </ResponsiveContainer>

      {/* Asset details */}
      <div style={{ marginTop: 12 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: COLORS.accent, marginBottom: 8 }}>Assets</p>
        {Object.entries(data.assets || {}).filter(([_, v]) => v > 0).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, padding: '4px 0' }}>
            <span style={{ textTransform: 'capitalize' }}>
              {k === 'real_estate' ? '🏠 ' : ''}{k.replace(/_/g, ' ').replace('529', '529 ')}
            </span>
            {k === 'real_estate' && editingRealEstate ? (
              <div style={{ display: 'flex', gap: 4 }}>
                <input type="number" value={realEstateValue} onChange={(e) => setRealEstateValue(e.target.value)}
                  style={{ width: 100, padding: 4, borderRadius: 4, border: `1px solid ${COLORS.accent}` }} />
                <button onClick={updateRealEstate} style={{ padding: '4px 8px', background: COLORS.accent, color: '#FFF', border: 'none', borderRadius: 4, fontSize: 10 }}>Save</button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 500 }}>{formatCurrency(v)}</span>
                {k === 'real_estate' && (
                  <button onClick={() => setEditingRealEstate(true)} style={{ padding: '2px 6px', background: COLORS.textMuted, color: '#FFF', border: 'none', borderRadius: 4, fontSize: 9, cursor: 'pointer' }}>Edit</button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Liability details */}
      <div style={{ marginTop: 12 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: COLORS.danger, marginBottom: 8 }}>Liabilities</p>
        {Object.entries(data.liabilities || {}).filter(([_, v]) => v > 0).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0' }}>
            <span style={{ textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}</span>
            <span style={{ fontWeight: 500, color: COLORS.danger }}>-{formatCurrency(v)}</span>
          </div>
        ))}
      </div>

      {/* Data sources */}
      <p style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 12, borderTop: `1px solid ${COLORS.border}`, paddingTop: 8 }}>
        Sources: YNAB ({data.breakdown?.ynab_accounts || 0} accounts) + Manual ({data.breakdown?.manual_accounts || 0} accounts) + Real Estate
      </p>
    </div>
  );
}

// =============================================================================
// BUDGET EDITOR (keep for backward compatibility but mark as deprecated)
// =============================================================================
function BudgetEditor({ apiUrl, apiKey }) {
  const [targets, setTargets] = useState({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newAmount, setNewAmount] = useState('');

  useEffect(() => {
    fetch(`${apiUrl}/api/budget-targets`, { headers: { 'X-API-Key': apiKey } })
      .then(r => r.json())
      .then(data => setTargets(data.targets || {}))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [apiUrl, apiKey]);

  const saveTarget = async (category) => {
    const newValue = parseFloat(editValue);
    if (isNaN(newValue)) return;
    
    await fetch(`${apiUrl}/api/budget-targets`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
      body: JSON.stringify({ [category]: newValue })
    });
    
    setTargets(prev => ({ ...prev, [category]: newValue }));
    setEditing(null);
  };

  const addCategory = async () => {
    if (!newCategory || !newAmount) return;
    
    await fetch(`${apiUrl}/api/budget-targets/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
      body: JSON.stringify({ category: newCategory.toLowerCase().replace(/\s+/g, '_'), target: parseFloat(newAmount) })
    });
    
    setTargets(prev => ({ ...prev, [newCategory.toLowerCase().replace(/\s+/g, '_')]: parseFloat(newAmount) }));
    setNewCategory('');
    setNewAmount('');
  };

  const totalBudget = Object.values(targets).reduce((a, b) => a + b, 0);

  if (loading) return <div style={{ padding: 20, color: COLORS.textMuted }}>Loading budget...</div>;

  return (
    <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${COLORS.border}` }}>
      <h3 style={{ margin: '0 0 8px', color: COLORS.text }}>✏️ Edit Budget Targets</h3>
      <p style={{ fontSize: 12, color: COLORS.textMuted, margin: '0 0 16px' }}>
        Total monthly budget: <strong>{formatCurrency(totalBudget)}</strong>
      </p>

      <div style={{ maxHeight: 400, overflowY: 'auto' }}>
        {Object.entries(targets).sort((a, b) => b[1] - a[1]).map(([cat, amount]) => (
          <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${COLORS.border}` }}>
            <span style={{ fontSize: 13, textTransform: 'capitalize' }}>{cat.replace(/_/g, ' ')}</span>
            {editing === cat ? (
              <div style={{ display: 'flex', gap: 4 }}>
                <input type="number" value={editValue} onChange={(e) => setEditValue(e.target.value)}
                  style={{ width: 80, padding: 4, borderRadius: 4, border: `1px solid ${COLORS.accent}`, textAlign: 'right' }} />
                <button onClick={() => saveTarget(cat)} style={{ padding: '4px 8px', background: COLORS.accent, color: '#FFF', border: 'none', borderRadius: 4, fontSize: 11 }}>Save</button>
                <button onClick={() => setEditing(null)} style={{ padding: '4px 8px', background: COLORS.textMuted, color: '#FFF', border: 'none', borderRadius: 4, fontSize: 11 }}>×</button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 600 }}>{formatCurrency(amount)}</span>
                <button onClick={() => { setEditing(cat); setEditValue(amount.toString()); }}
                  style={{ padding: '2px 8px', background: COLORS.primary, color: '#FFF', border: 'none', borderRadius: 4, fontSize: 10, cursor: 'pointer' }}>Edit</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add new category */}
      <div style={{ marginTop: 16, padding: 12, background: COLORS.bg, borderRadius: 8 }}>
        <p style={{ fontSize: 12, fontWeight: 600, margin: '0 0 8px' }}>Add New Category</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <input type="text" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Category name"
            style={{ flex: 1, padding: 8, borderRadius: 4, border: `1px solid ${COLORS.border}`, fontSize: 12 }} />
          <input type="number" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} placeholder="Amount"
            style={{ width: 80, padding: 8, borderRadius: 4, border: `1px solid ${COLORS.border}`, fontSize: 12 }} />
          <button onClick={addCategory} disabled={!newCategory || !newAmount}
            style={{ padding: '8px 12px', background: !newCategory || !newAmount ? COLORS.textMuted : COLORS.accent, color: '#FFF', border: 'none', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}>Add</button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// HISTORICAL TRENDS (Monarch + YNAB data)
// =============================================================================
function HistoricalTrends({ apiUrl, apiKey }) {
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);
  const [months, setMonths] = useState(12);

  useEffect(() => {
    setLoading(true);
    fetch(`${apiUrl}/api/historical/trends?months=${months}`, { headers: { 'X-API-Key': apiKey } })
      .then(r => r.json())
      .then(setTrends)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [months, apiUrl, apiKey]);

  if (loading) return <div style={{ padding: 20, color: COLORS.textMuted }}>Loading historical data...</div>;
  if (trends?.error) return <div style={{ padding: 20, color: COLORS.danger }}>{trends.error}</div>;
  if (!trends?.months?.length) return <div style={{ padding: 20, color: COLORS.textMuted }}>No historical data available</div>;

  // Prepare chart data
  const chartData = trends.months.map(month => ({
    month: month.slice(2), // YY-MM
    total: trends.monthly_totals[month] || 0
  }));

  // Top categories by total spend
  const topCategories = Object.entries(trends.category_stats || {}).slice(0, 10);

  return (
    <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${COLORS.border}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0, color: COLORS.text }}>📜 Historical Spending</h3>
        <select value={months} onChange={(e) => setMonths(Number(e.target.value))}
          style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${COLORS.border}` }}>
          <option value={6}>6 months</option>
          <option value={12}>12 months</option>
          <option value={24}>2 years</option>
          <option value={36}>3 years</option>
          <option value={60}>5 years</option>
        </select>
      </div>

      {/* Monthly spending trend */}
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" tick={{ fontSize: 10 }} />
          <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
          <Tooltip formatter={(v) => formatCurrency(v)} />
          <Area type="monotone" dataKey="total" fill={COLORS.primary} fillOpacity={0.3} stroke={COLORS.primary} />
        </AreaChart>
      </ResponsiveContainer>

      {/* Top categories */}
      <div style={{ marginTop: 16 }}>
        <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Top Spending Categories ({months} months)</p>
        {topCategories.map(([cat, stats]) => (
          <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: `1px solid ${COLORS.border}` }}>
            <div>
              <span style={{ fontSize: 12 }}>{cat.slice(0, 25)}</span>
              <span style={{ fontSize: 10, marginLeft: 8, color: stats.trend_percent > 5 ? COLORS.danger : stats.trend_percent < -5 ? COLORS.accent : COLORS.textMuted }}>
                {stats.trend_percent > 0 ? '↑' : '↓'}{Math.abs(stats.trend_percent).toFixed(0)}%
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontWeight: 600, fontSize: 12 }}>{formatCurrency(stats.total)}</span>
              <span style={{ fontSize: 10, color: COLORS.textMuted, marginLeft: 8 }}>~{formatCurrency(stats.average)}/mo</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// MANUAL ACCOUNTS
// =============================================================================
function ManualAccounts({ apiUrl, apiKey }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editBalance, setEditBalance] = useState('');

  useEffect(() => { fetchAccounts(); }, []);

  const fetchAccounts = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/manual-accounts`, { headers: { 'X-API-Key': apiKey } });
      if (res.ok) setAccounts(await res.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const updateBalance = async (account) => {
    await fetch(`${apiUrl}/api/manual-accounts/${account.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
      body: JSON.stringify({ ...account, balance: parseFloat(editBalance) })
    });
    setEditingId(null);
    fetchAccounts();
  };

  const isStale = (lastUpdated) => !lastUpdated || (new Date() - new Date(lastUpdated)) / (1000 * 60 * 60 * 24) > 90;
  const total = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);

  if (loading) return <div style={{ padding: 20, color: COLORS.textMuted }}>Loading...</div>;

  return (
    <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${COLORS.border}` }}>
      <h3 style={{ margin: '0 0 4px', color: COLORS.text }}>📋 Manual Accounts</h3>
      <p style={{ fontSize: 12, color: COLORS.textMuted, margin: '0 0 16px' }}>AXA/Equitable - update quarterly</p>

      {accounts.length === 0 ? (
        <p style={{ color: COLORS.textMuted, textAlign: 'center', padding: 20 }}>No manual accounts. Add via API.</p>
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
                    <input type="number" value={editBalance} onChange={(e) => setEditBalance(e.target.value)} style={{ width: 100, padding: 4 }} />
                    <button onClick={() => updateBalance(acc)} style={{ padding: '4px 8px', background: COLORS.accent, color: '#FFF', border: 'none', borderRadius: 4, fontSize: 11 }}>Save</button>
                  </div>
                ) : (
                  <>
                    <p style={{ fontWeight: 600, margin: 0 }}>{formatCurrency(acc.balance)}</p>
                    <p style={{ fontSize: 10, color: isStale(acc.last_updated) ? COLORS.danger : COLORS.textMuted, margin: '2px 0' }}>
                      {isStale(acc.last_updated) && '⚠️ '}{acc.last_updated ? new Date(acc.last_updated).toLocaleDateString() : 'Never'}
                    </p>
                    <button onClick={() => { setEditingId(acc.id); setEditBalance(acc.balance?.toString()); }} 
                      style={{ padding: '2px 8px', background: COLORS.primary, color: '#FFF', border: 'none', borderRadius: 4, fontSize: 10, cursor: 'pointer' }}>Update</button>
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
    "What budget categories should I adjust?",
    "How will therapy cost changes affect us?",
    "What's the optimal surplus allocation?",
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
// MAIN DASHBOARD
// =============================================================================
export default function GoodlevDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => sessionStorage.getItem('dashboard_authenticated') === 'true');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [aiOpen, setAiOpen] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL || 'https://goodlevdashboard.up.railway.app';
  const apiKey = import.meta.env.VITE_API_KEY || '';

  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [periodType, setPeriodType] = useState('month');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [accounts, setAccounts] = useState([]);
  const [spending, setSpending] = useState(null);
  const [budgetVsActual, setBudgetVsActual] = useState(null);

  const getPeriodDates = () => {
    const d = new Date(selectedDate);
    let start, end;
    switch (periodType) {
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
        start = new Date(d.getFullYear(), d.getMonth(), 1);
        end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    }
    return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
  };

  const api = useCallback(async (endpoint, options = {}) => {
    const res = await fetch(`${apiUrl}${endpoint}`, {
      ...options,
      headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json', ...options.headers }
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  }, [apiUrl, apiKey]);

  useEffect(() => {
    if (isAuthenticated && apiKey) {
      api('/health').then(data => setConnected(data.status === 'healthy')).catch(() => setConnected(false));
    }
  }, [isAuthenticated, api, apiKey]);

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

  if (!isAuthenticated) return <LoginScreen onLogin={() => setIsAuthenticated(true)} />;

  const tabs = [
    { id: 'dashboard', label: '📊 Dashboard' },
    { id: 'budget', label: '💰 Budget' },
    { id: 'transactions', label: '🔍 Transactions' },
    { id: 'trends', label: '📈 Trends' },
    { id: 'scenarios', label: '🎯 Scenarios' },
    { id: 'actions', label: '✅ Action Items' },
    { id: 'accounts', label: '💳 Accounts' },
  ];

  // Get period dates for API calls
  const periodDates = (() => {
    const d = new Date(selectedDate);
    let start, end;
    switch (periodType) {
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
        start = new Date(d.getFullYear(), d.getMonth(), 1);
        end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    }
    return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
  })();

  return (
    <div style={{ minHeight: '100vh', background: COLORS.bg }}>
      {/* Header */}
      <header style={{ background: COLORS.primary, color: '#FFF', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20 }}>🏦 Goodlev Family Dashboard</h1>
          <p style={{ margin: '4px 0 0', fontSize: 12, opacity: 0.8 }}>
            {connected ? '✓ Connected to YNAB' : '⚠️ Not connected'} {loading && ' • Loading...'}
          </p>
        </div>
        <button onClick={() => { sessionStorage.removeItem('dashboard_authenticated'); setIsAuthenticated(false); }} 
          style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#FFF', padding: '8px 16px', borderRadius: 6, cursor: 'pointer' }}>Sign Out</button>
      </header>

      {/* Tabs */}
      <nav style={{ background: COLORS.bgCard, borderBottom: `1px solid ${COLORS.border}`, padding: '0 24px', display: 'flex', gap: 4, overflowX: 'auto' }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ padding: '16px 20px', border: 'none', background: 'transparent', whiteSpace: 'nowrap',
              borderBottom: activeTab === tab.id ? `3px solid ${COLORS.accent}` : '3px solid transparent',
              color: activeTab === tab.id ? COLORS.accent : COLORS.text, fontWeight: activeTab === tab.id ? 600 : 400, cursor: 'pointer', fontSize: 14 }}>
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <main style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
        <PeriodNavigator periodType={periodType} setPeriodType={setPeriodType} selectedDate={selectedDate} setSelectedDate={setSelectedDate} />

        {activeTab === 'dashboard' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
              <KPICard title="Monthly Income" value={formatCurrency(spending?.total_income || BASELINE.monthlyIncome)} icon="💵" color={COLORS.accent} />
              <KPICard title="Monthly Expenses" value={formatCurrency(spending?.total_spent || BASELINE.monthlyExpenses)} icon="📉" color={COLORS.danger} />
              <KPICard title="Surplus" value={formatCurrency(BASELINE.surplus)} subtitle="Available to allocate" icon="✨" color={COLORS.accent} />
              <KPICard title="Net Worth" value="Click Accounts →" subtitle="Full breakdown" icon="📊" color={COLORS.primary} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
              <BudgetVsActual data={budgetVsActual} />
              <SmartBudgetEditor apiUrl={apiUrl} apiKey={apiKey} />
            </div>
          </div>
        )}

        {activeTab === 'budget' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div>
              <BudgetVsActual data={budgetVsActual} />
            </div>
            <SmartBudgetEditor apiUrl={apiUrl} apiKey={apiKey} />
          </div>
        )}

        {activeTab === 'transactions' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <TransactionDrillDown apiUrl={apiUrl} apiKey={apiKey} periodDates={periodDates} />
            <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${COLORS.border}` }}>
              <h3 style={{ margin: '0 0 16px', color: COLORS.text }}>📋 Period Summary</h3>
              <p style={{ fontSize: 13, marginBottom: 12 }}>
                Viewing: <strong>{periodDates.start}</strong> to <strong>{periodDates.end}</strong>
              </p>
              <div style={{ padding: 12, background: COLORS.bg, borderRadius: 8, marginBottom: 12 }}>
                <p style={{ fontSize: 12, margin: '0 0 8px' }}><strong>Why no double-counting?</strong></p>
                <ul style={{ fontSize: 11, margin: 0, paddingLeft: 16, color: COLORS.textMuted }}>
                  <li>Credit card payments are excluded (just moving money between accounts)</li>
                  <li>Transfers between accounts are excluded</li>
                  <li>Only actual expenses to merchants/payees are counted</li>
                  <li>Income only counted when deposited, not when moved</li>
                </ul>
              </div>
              <p style={{ fontSize: 11, color: COLORS.textMuted }}>
                Click a category above to filter transactions
              </p>
            </div>
          </div>
        )}

        {activeTab === 'trends' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <HistoricalTrends apiUrl={apiUrl} apiKey={apiKey} />
            <div>
              <SpendingTrends apiUrl={apiUrl} apiKey={apiKey} />
            </div>
          </div>
        )}

        {activeTab === 'scenarios' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div>
              <ScenarioComparison apiUrl={apiUrl} apiKey={apiKey} />
              <div style={{ marginTop: 24 }}>
                <OptimizationSuggestions apiUrl={apiUrl} apiKey={apiKey} />
              </div>
            </div>
            <div>
              <CustomScenarioBuilder apiUrl={apiUrl} apiKey={apiKey} surplus={BASELINE.surplus} />
              <div style={{ marginTop: 24 }}>
                <ManualAccounts apiUrl={apiUrl} apiKey={apiKey} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'actions' && (
          <ActionItems apiUrl={apiUrl} apiKey={apiKey} />
        )}

        {activeTab === 'accounts' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div>
              <NetWorthBreakdown apiUrl={apiUrl} apiKey={apiKey} />
              <div style={{ marginTop: 24, background: COLORS.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${COLORS.border}` }}>
                <h3 style={{ margin: '0 0 16px', color: COLORS.text }}>💳 YNAB Accounts</h3>
                {accounts.length === 0 ? (
                  <p style={{ color: COLORS.textMuted }}>No accounts loaded</p>
                ) : accounts.map(a => (
                  <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${COLORS.border}` }}>
                    <span style={{ fontSize: 13 }}>{a.name}</span>
                    <span style={{ fontWeight: 600, color: a.balance < 0 ? COLORS.danger : COLORS.text }}>{formatCurrency(a.balance)}</span>
                  </div>
                ))}
              </div>
            </div>
            <ManualAccounts apiUrl={apiUrl} apiKey={apiKey} />
          </div>
        )}
      </main>

      {/* AI Button */}
      <button onClick={() => setAiOpen(!aiOpen)}
        style={{ position: 'fixed', bottom: 24, right: 24, width: 60, height: 60, borderRadius: '50%',
          background: aiOpen ? COLORS.textMuted : COLORS.accent, color: '#FFF', border: 'none', fontSize: 28, cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)', zIndex: 999 }}>
        {aiOpen ? '×' : '🤖'}
      </button>

      <AIAdvisor isOpen={aiOpen} onClose={() => setAiOpen(false)} apiUrl={apiUrl} apiKey={apiKey} />
    </div>
  );
}
