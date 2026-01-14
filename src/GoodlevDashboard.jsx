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
// SCENARIO COMPARISON
// =============================================================================
function ScenarioComparison({ apiUrl, apiKey }) {
  const [scenarios, setScenarios] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetch(`${apiUrl}/api/scenarios`, { headers: { 'X-API-Key': apiKey } })
      .then(r => r.json())
      .then(data => { setScenarios(data); setSelected(data?.scenarios?.[0]?.name); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [apiUrl, apiKey]);

  if (loading) return <div style={{ padding: 20, color: COLORS.textMuted }}>Calculating scenarios...</div>;
  if (!scenarios?.scenarios) return null;

  const activeScenario = scenarios.scenarios.find(s => s.name === selected);

  return (
    <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${COLORS.border}` }}>
      <h3 style={{ margin: '0 0 8px', color: COLORS.text }}>🎯 Surplus Allocation Scenarios</h3>
      <p style={{ fontSize: 12, color: COLORS.textMuted, margin: '0 0 16px' }}>
        Monthly surplus: <strong>{formatCurrency(scenarios.current_surplus)}</strong>
      </p>

      {/* Scenario Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {scenarios.scenarios.map(s => (
          <button key={s.name} onClick={() => setSelected(s.name)}
            style={{ padding: '8px 12px', borderRadius: 6, border: `1px solid ${selected === s.name ? COLORS.accent : COLORS.border}`,
              background: selected === s.name ? `${COLORS.accent}15` : 'transparent', fontSize: 12, cursor: 'pointer',
              color: selected === s.name ? COLORS.accent : COLORS.text, fontWeight: selected === s.name ? 600 : 400 }}>
            {s.name}
          </button>
        ))}
      </div>

      {activeScenario && (
        <div>
          <p style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 16 }}>{activeScenario.description}</p>
          
          {/* Projections */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 16 }}>
            {Object.entries(activeScenario.projections).map(([key, value]) => (
              <div key={key} style={{ padding: 12, background: COLORS.bg, borderRadius: 8 }}>
                <p style={{ fontSize: 11, color: COLORS.textMuted, margin: 0, textTransform: 'capitalize' }}>
                  {key.replace(/_/g, ' ')}
                </p>
                <p style={{ fontSize: 16, fontWeight: 600, color: COLORS.primary, margin: '4px 0 0' }}>
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
// BUDGET EDITOR
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
// NET WORTH BREAKDOWN
// =============================================================================
function NetWorthBreakdown({ apiUrl, apiKey }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${apiUrl}/api/net-worth`, { headers: { 'X-API-Key': apiKey } })
      .then(r => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [apiUrl, apiKey]);

  if (loading) return <div style={{ padding: 20, color: COLORS.textMuted }}>Calculating net worth...</div>;
  if (!data) return null;

  const assetColors = { checking_savings: COLORS.info, retirement: COLORS.accent, investment: COLORS.purple, '529_education': COLORS.warning, real_estate: COLORS.primary, other_assets: COLORS.textMuted };
  const pieData = Object.entries(data.assets).filter(([_, v]) => v > 0).map(([k, v]) => ({ name: k.replace(/_/g, ' '), value: v, color: assetColors[k] || COLORS.textMuted }));

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
        {Object.entries(data.assets).filter(([_, v]) => v > 0).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0' }}>
            <span style={{ textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}</span>
            <span style={{ fontWeight: 500 }}>{formatCurrency(v)}</span>
          </div>
        ))}
      </div>

      {/* Liability details */}
      <div style={{ marginTop: 12 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: COLORS.danger, marginBottom: 8 }}>Liabilities</p>
        {Object.entries(data.liabilities).filter(([_, v]) => v > 0).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0' }}>
            <span style={{ textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}</span>
            <span style={{ fontWeight: 500, color: COLORS.danger }}>-{formatCurrency(v)}</span>
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
    { id: 'trends', label: '📈 Trends' },
    { id: 'scenarios', label: '🎯 Scenarios' },
    { id: 'accounts', label: '💳 Accounts' },
  ];

  // Calculate net worth from accounts
  const netWorth = accounts.reduce((sum, a) => sum + (a.balance || 0), 0) + 1451900; // + home value

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
      <nav style={{ background: COLORS.bgCard, borderBottom: `1px solid ${COLORS.border}`, padding: '0 24px', display: 'flex', gap: 4 }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ padding: '16px 20px', border: 'none', background: 'transparent',
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
              <KPICard title="Net Worth" value={formatCurrency(netWorth)} icon="📊" color={COLORS.primary} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
              <BudgetVsActual data={budgetVsActual} />
              <BudgetRecommendations apiUrl={apiUrl} apiKey={apiKey} />
            </div>
          </div>
        )}

        {activeTab === 'budget' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div>
              <BudgetVsActual data={budgetVsActual} />
              <div style={{ marginTop: 24 }}>
                <BudgetRecommendations apiUrl={apiUrl} apiKey={apiKey} />
              </div>
            </div>
            <BudgetEditor apiUrl={apiUrl} apiKey={apiKey} />
          </div>
        )}

        {activeTab === 'trends' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <HistoricalTrends apiUrl={apiUrl} apiKey={apiKey} />
            <div>
              <SpendingTrends apiUrl={apiUrl} apiKey={apiKey} />
              <div style={{ marginTop: 24 }}>
                <BudgetRecommendations apiUrl={apiUrl} apiKey={apiKey} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'scenarios' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <ScenarioComparison apiUrl={apiUrl} apiKey={apiKey} />
            <ManualAccounts apiUrl={apiUrl} apiKey={apiKey} />
          </div>
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
