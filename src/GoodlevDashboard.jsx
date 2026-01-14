import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area, ComposedChart } from 'recharts';

// =============================================================================
// GOODLEV FAMILY FINANCIAL DASHBOARD v5.0
// Fixed budget filtering + restored trends/scenarios
// =============================================================================

const COLORS = {
  primary: '#0F2942',
  accent: '#D4A84B',
  positive: '#2ECC71',
  negative: '#E74C3C',
  warning: '#F39C12',
  info: '#3498DB',
  purple: '#9B59B6',
  text: '#2C3E50',
  textMuted: '#95A5A6',
  bg: '#F8F9FA',
  bgCard: '#FFFFFF',
  border: '#E8ECF0',
};

const CHART_COLORS = ['#3498DB', '#2ECC71', '#F39C12', '#E74C3C', '#9B59B6', '#1ABC9C', '#E67E22', '#34495E'];

const BASELINE = {
  monthlyIncome: 22625,
  monthlyExpenses: 18703,
  monthlySurplus: 3922,
  helocBalance: 275809,
  helocRate: 0.0632,
  helocPayment: 1546,
  totalRetirement: 645449,
  annualRetirementContrib: 41225,
};

const ACCOUNT_CATEGORIES = [
  { value: 'checking_savings', label: 'Checking/Savings', icon: '💵', group: 'assets' },
  { value: 'retirement', label: 'Retirement', icon: '🏦', group: 'assets' },
  { value: '529_education', label: '529 Education', icon: '🎓', group: 'assets' },
  { value: 'investment', label: 'Investment', icon: '📈', group: 'assets' },
  { value: 'hsa', label: 'HSA', icon: '🏥', group: 'assets' },
  { value: 'other_asset', label: 'Other Asset', icon: '💎', group: 'assets' },
  { value: 'mortgage', label: 'Mortgage', icon: '🏠', group: 'liabilities' },
  { value: 'heloc', label: 'HELOC', icon: '🏡', group: 'liabilities' },
  { value: 'credit_card', label: 'Credit Card', icon: '💳', group: 'liabilities' },
  { value: 'other_liability', label: 'Other Liability', icon: '📋', group: 'liabilities' },
];

const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount || 0);
const formatCurrencyK = (amount) => `$${(amount / 1000).toFixed(0)}k`;

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

// =============================================================================
// LOGIN
// =============================================================================
function LoginScreen({ onLogin }) {
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL || 'https://goodlevdashboard.up.railway.app';

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/health`, { headers: { 'X-API-Key': apiKey } });
      if (res.ok) {
        sessionStorage.setItem('dashboard_api_key', apiKey);
        sessionStorage.setItem('dashboard_authenticated', 'true');
        onLogin();
      } else setError('Invalid API key');
    } catch (e) { setError('Connection failed'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${COLORS.primary} 0%, #0A1F33 100%)` }}>
      <div style={{ background: COLORS.bgCard, padding: 40, borderRadius: 16, width: 360, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <h1 style={{ margin: '0 0 8px', color: COLORS.primary, fontSize: 24, textAlign: 'center' }}>🏦 Goodlev Dashboard</h1>
        <p style={{ margin: '0 0 24px', color: COLORS.textMuted, textAlign: 'center', fontSize: 14 }}>Family Financial Planning</p>
        <input type="password" placeholder="API Key" value={apiKey} onChange={e => setApiKey(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} style={{ width: '100%', padding: 14, border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 15, marginBottom: 16, boxSizing: 'border-box' }} />
        {error && <p style={{ color: COLORS.negative, fontSize: 13, margin: '0 0 16px' }}>{error}</p>}
        <button onClick={handleLogin} disabled={loading || !apiKey} style={{ width: '100%', padding: 14, background: COLORS.primary, color: '#FFF', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>{loading ? 'Connecting...' : 'Login'}</button>
      </div>
    </div>
  );
}

// =============================================================================
// UI COMPONENTS
// =============================================================================
function Card({ title, children, icon, action, collapsible, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${COLORS.border}` }}>
      {(title || action) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: open ? 16 : 0 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: COLORS.text, display: 'flex', alignItems: 'center', gap: 8, cursor: collapsible ? 'pointer' : 'default' }} onClick={() => collapsible && setOpen(!open)}>
            {icon && <span>{icon}</span>}{title}{collapsible && <span style={{ fontSize: 12 }}>{open ? '▼' : '▶'}</span>}
          </h3>
          {action}
        </div>
      )}
      {(!collapsible || open) && children}
    </div>
  );
}

function KPICard({ label, value, subValue, icon, color, trend }) {
  return (
    <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${COLORS.border}`, flex: 1, minWidth: 160 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <p style={{ margin: 0, fontSize: 13, color: COLORS.textMuted }}>{label}</p>
          <p style={{ margin: '8px 0 0', fontSize: 24, fontWeight: 700, color: color || COLORS.text }}>{value}</p>
          {subValue && <p style={{ margin: '4px 0 0', fontSize: 12, color: COLORS.textMuted }}>{subValue}</p>}
          {trend !== undefined && <p style={{ margin: '4px 0 0', fontSize: 12, color: trend >= 0 ? COLORS.positive : COLORS.negative }}>{trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%</p>}
        </div>
        {icon && <span style={{ fontSize: 28, opacity: 0.8 }}>{icon}</span>}
      </div>
    </div>
  );
}

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

// =============================================================================
// SPENDING TRENDS
// =============================================================================
function SpendingTrends({ apiUrl, apiKey }) {
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/spending/trends?months=6`, { headers: { 'X-API-Key': apiKey } });
        const data = await res.json();
        setTrends(data.trends || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchTrends();
  }, [apiUrl, apiKey]);

  if (loading) return <Card title="Spending Trends" icon="📈"><p style={{ color: COLORS.textMuted }}>Loading...</p></Card>;
  if (!trends?.length) return <Card title="Spending Trends" icon="📈"><p style={{ color: COLORS.textMuted }}>No trend data</p></Card>;

  return (
    <Card title="6-Month Spending Trends" icon="📈">
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={trends}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis tickFormatter={formatCurrencyK} />
          <Tooltip formatter={(v) => formatCurrency(v)} />
          <Legend />
          <Bar dataKey="expenses" fill={COLORS.negative} name="Expenses" />
          <Bar dataKey="income" fill={COLORS.positive} name="Income" />
          <Line type="monotone" dataKey="surplus" stroke={COLORS.info} strokeWidth={2} name="Surplus" />
        </ComposedChart>
      </ResponsiveContainer>
      
      <div style={{ marginTop: 20 }}>
        <h4 style={{ margin: '0 0 12px', fontSize: 14 }}>Monthly Breakdown</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
          {trends.slice(-3).map(m => (
            <div key={m.month} style={{ padding: 12, background: COLORS.bg, borderRadius: 8 }}>
              <strong>{m.month}</strong>
              <p style={{ margin: '4px 0', fontSize: 13 }}>In: <span style={{ color: COLORS.positive }}>{formatCurrency(m.income)}</span></p>
              <p style={{ margin: '4px 0', fontSize: 13 }}>Out: <span style={{ color: COLORS.negative }}>{formatCurrency(m.expenses)}</span></p>
              <p style={{ margin: '4px 0', fontSize: 13, fontWeight: 600, color: m.surplus >= 0 ? COLORS.positive : COLORS.negative }}>Net: {formatCurrency(m.surplus)}</p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

// =============================================================================
// STRATEGY COMPARISON
// =============================================================================
function StrategyComparison({ apiUrl, apiKey }) {
  const [strategies, setStrategies] = useState(null);
  const [loading, setLoading] = useState(true);
  const [customHeloc, setCustomHeloc] = useState(1961);
  const [customRetire, setCustomRetire] = useState(1961);
  const [customResult, setCustomResult] = useState(null);

  useEffect(() => {
    const fetchStrategies = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/strategies/compare`, { headers: { 'X-API-Key': apiKey } });
        const data = await res.json();
        setStrategies(data.strategies || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchStrategies();
  }, [apiUrl, apiKey]);

  const runCustom = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/strategies/custom`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
        body: JSON.stringify({ heloc_extra: customHeloc, retirement_extra: customRetire * 12 })
      });
      const data = await res.json();
      setCustomResult(data);
    } catch (e) { console.error(e); }
  };

  if (loading) return <Card title="Strategy Comparison" icon="⚖️"><p style={{ color: COLORS.textMuted }}>Loading...</p></Card>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Card title="Preset Strategies" icon="⚖️">
        <p style={{ margin: '0 0 16px', fontSize: 13, color: COLORS.textMuted }}>Compare how different surplus allocations affect HELOC payoff and retirement growth</p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: COLORS.bg }}>
                <th style={{ padding: 12, textAlign: 'left', borderBottom: `2px solid ${COLORS.border}` }}>Strategy</th>
                <th style={{ padding: 12, textAlign: 'right', borderBottom: `2px solid ${COLORS.border}` }}>HELOC Extra</th>
                <th style={{ padding: 12, textAlign: 'right', borderBottom: `2px solid ${COLORS.border}` }}>Retire Extra</th>
                <th style={{ padding: 12, textAlign: 'right', borderBottom: `2px solid ${COLORS.border}` }}>Payoff Date</th>
                <th style={{ padding: 12, textAlign: 'right', borderBottom: `2px solid ${COLORS.border}` }}>Interest Saved</th>
                <th style={{ padding: 12, textAlign: 'right', borderBottom: `2px solid ${COLORS.border}` }}>Retire @ 60</th>
              </tr>
            </thead>
            <tbody>
              {strategies?.map((s, i) => (
                <tr key={s.name} style={{ background: i % 2 === 0 ? '#FFF' : COLORS.bg }}>
                  <td style={{ padding: 12, fontWeight: 600 }}>{s.name}</td>
                  <td style={{ padding: 12, textAlign: 'right' }}>{formatCurrency(s.heloc_extra)}/mo</td>
                  <td style={{ padding: 12, textAlign: 'right' }}>{formatCurrency(s.retirement_extra)}/yr</td>
                  <td style={{ padding: 12, textAlign: 'right' }}>{s.heloc_payoff_date}</td>
                  <td style={{ padding: 12, textAlign: 'right', color: COLORS.positive }}>{formatCurrency(s.heloc_interest_saved)}</td>
                  <td style={{ padding: 12, textAlign: 'right', color: COLORS.info }}>{formatCurrency(s.retirement_at_60)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Custom Strategy Builder" icon="🔧">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Extra HELOC Payment: {formatCurrency(customHeloc)}/mo</label>
            <input type="range" min={0} max={3922} value={customHeloc} onChange={e => setCustomHeloc(parseInt(e.target.value))} style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Extra Retirement: {formatCurrency(customRetire)}/mo</label>
            <input type="range" min={0} max={3922} value={customRetire} onChange={e => setCustomRetire(parseInt(e.target.value))} style={{ width: '100%' }} />
          </div>
        </div>
        <p style={{ margin: '12px 0', fontSize: 13, color: customHeloc + customRetire > 3922 ? COLORS.negative : COLORS.textMuted }}>
          Total allocated: {formatCurrency(customHeloc + customRetire)}/mo | Remaining: {formatCurrency(3922 - customHeloc - customRetire)}
        </p>
        <button onClick={runCustom} style={{ padding: '10px 20px', background: COLORS.primary, color: '#FFF', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Calculate Custom Strategy</button>

        {customResult && (
          <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ padding: 16, background: COLORS.bg, borderRadius: 8 }}>
              <h4 style={{ margin: '0 0 12px', color: COLORS.negative }}>🏡 HELOC Payoff</h4>
              <p style={{ margin: '4px 0' }}>Payoff: <strong>{customResult.heloc.payoff_date}</strong></p>
              <p style={{ margin: '4px 0' }}>Months: <strong>{customResult.heloc.payoff_months}</strong></p>
              <p style={{ margin: '4px 0', color: COLORS.positive }}>Interest saved: <strong>{formatCurrency(customResult.heloc.interest_saved)}</strong></p>
            </div>
            <div style={{ padding: 16, background: COLORS.bg, borderRadius: 8 }}>
              <h4 style={{ margin: '0 0 12px', color: COLORS.info }}>📈 Retirement @ 60</h4>
              <p style={{ margin: '4px 0' }}>Balance: <strong>{formatCurrency(customResult.retirement.balance_at_60)}</strong></p>
              <p style={{ margin: '4px 0' }}>Extra/year: <strong>{formatCurrency(customResult.retirement.extra_annual)}</strong></p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// =============================================================================
// CATEGORY DRILL-DOWN
// =============================================================================
function CategoryDrillDown({ apiUrl, apiKey, startDate, endDate }) {
  const [categories, setCategories] = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/spending/by-category?start_date=${startDate}&end_date=${endDate}`, { headers: { 'X-API-Key': apiKey } });
        const data = await res.json();
        setCategories(Array.isArray(data) ? data : []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchCategories();
  }, [apiUrl, apiKey, startDate, endDate]);

  if (loading) return <Card title="Category Breakdown" icon="📊"><p style={{ color: COLORS.textMuted }}>Loading...</p></Card>;

  return (
    <Card title="Category Breakdown" icon="📊">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={categories?.slice(0, 8)} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {categories?.slice(0, 8).map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => formatCurrency(v)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{ maxHeight: 300, overflowY: 'auto' }}>
          {categories?.map((cat, i) => (
            <div key={cat.category} onClick={() => setSelected(selected === cat.category ? null : cat.category)} style={{ padding: '10px 12px', borderBottom: `1px solid ${COLORS.border}`, cursor: 'pointer', background: selected === cat.category ? COLORS.bg : 'transparent' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 12, height: 12, borderRadius: 2, background: CHART_COLORS[i % CHART_COLORS.length] }} />
                  {cat.category}
                </span>
                <span style={{ fontWeight: 600 }}>{formatCurrency(cat.amount)}</span>
              </div>
              {selected === cat.category && cat.transactions && (
                <div style={{ marginTop: 8, paddingLeft: 20, fontSize: 12 }}>
                  {cat.transactions.map((t, j) => (
                    <div key={j} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: COLORS.textMuted }}>
                      <span>{t.date} - {t.payee}</span>
                      <span>{formatCurrency(t.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

// =============================================================================
// ACCOUNT MAPPING
// =============================================================================
function AccountMappingPanel({ apiUrl, apiKey, onMappingChange }) {
  const [unmapped, setUnmapped] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState({});
  const [saving, setSaving] = useState({});
  const [showMappings, setShowMappings] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const headers = { 'X-API-Key': apiKey };
      const [uRes, mRes] = await Promise.all([fetch(`${apiUrl}/api/accounts/unmapped`, { headers }), fetch(`${apiUrl}/api/account-mappings`, { headers })]);
      setUnmapped((await uRes.json()).unmapped_accounts || []);
      setMappings((await mRes.json()).mappings || []);
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

  const getCat = (v) => ACCOUNT_CATEGORIES.find(c => c.value === v) || { label: v, icon: '❓' };

  if (loading) return <Card title="Account Mappings" icon="🏷️"><p style={{ color: COLORS.textMuted }}>Loading...</p></Card>;

  return (
    <div>
      {unmapped.length > 0 ? (
        <div style={{ background: '#FEF3E2', border: `1px solid ${COLORS.warning}`, borderRadius: 8, padding: 16, marginBottom: 20 }}>
          <strong style={{ color: '#8B5A00' }}>⚠️ {unmapped.length} account(s) need classification</strong>
        </div>
      ) : (
        <div style={{ background: '#E8F8F0', borderRadius: 8, padding: 16, marginBottom: 20 }}>
          <strong style={{ color: '#1E8449' }}>✅ All accounts classified</strong>
        </div>
      )}

      {unmapped.map(acc => (
        <Card key={acc.account_id} title={acc.account_name}>
          <p style={{ margin: '0 0 12px', fontSize: 13 }}>Balance: <strong>{formatCurrency(acc.balance)}</strong> | Type: {acc.ynab_type}</p>
          {acc.suggested_category && <p style={{ margin: '0 0 12px', fontSize: 13, color: COLORS.accent }}>💡 Suggested: {getCat(acc.suggested_category).label}</p>}
          <div style={{ display: 'flex', gap: 10 }}>
            <select value={selected[acc.account_id] || acc.suggested_category || ''} onChange={e => setSelected(p => ({ ...p, [acc.account_id]: e.target.value }))} style={{ flex: 1, padding: 10, borderRadius: 6, border: `1px solid ${COLORS.border}` }}>
              <option value="">Select...</option>
              <optgroup label="Assets">{ACCOUNT_CATEGORIES.filter(c => c.group === 'assets').map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}</optgroup>
              <optgroup label="Liabilities">{ACCOUNT_CATEGORIES.filter(c => c.group === 'liabilities').map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}</optgroup>
            </select>
            <button onClick={() => handleSave(acc)} disabled={saving[acc.account_id]} style={{ padding: '10px 20px', background: COLORS.positive, color: '#FFF', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>{saving[acc.account_id] ? '...' : 'Save'}</button>
          </div>
        </Card>
      ))}

      <Card title={`Current Mappings (${mappings.length})`} icon="📋" collapsible defaultOpen={false}>
        {mappings.map(m => (
          <div key={m.account_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${COLORS.border}` }}>
            <span>{m.account_name}</span>
            <span style={{ color: COLORS.primary }}>{getCat(m.category).icon} {getCat(m.category).label}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}

// =============================================================================
// MANUAL ACCOUNTS
// =============================================================================
function ManualAccountsPanel({ apiUrl, apiKey, onUpdate }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editBalance, setEditBalance] = useState('');

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/manual-accounts`, { headers: { 'X-API-Key': apiKey } });
        setAccounts(await res.json() || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchAccounts();
  }, [apiUrl, apiKey]);

  const handleUpdate = async (id) => {
    try {
      await fetch(`${apiUrl}/api/manual-accounts/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey }, body: JSON.stringify({ balance: parseFloat(editBalance) }) });
      setEditingId(null);
      const res = await fetch(`${apiUrl}/api/manual-accounts`, { headers: { 'X-API-Key': apiKey } });
      setAccounts(await res.json() || []);
      onUpdate?.();
    } catch (e) { alert('Failed'); }
  };

  const isStale = (d) => !d || (Date.now() - new Date(d).getTime()) / 86400000 > 90;
  const total = accounts.reduce((s, a) => s + (a.balance || 0), 0);

  if (loading) return <Card title="Manual Accounts" icon="📋"><p style={{ color: COLORS.textMuted }}>Loading...</p></Card>;

  return (
    <Card title="Manual Accounts (AXA/Equitable)" icon="📋">
      <p style={{ margin: '0 0 16px', fontSize: 13, color: COLORS.textMuted }}>Update quarterly from statements</p>
      {accounts.map(acc => (
        <div key={acc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${COLORS.border}` }}>
          <div>
            <strong>{acc.name}</strong>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: isStale(acc.last_updated) ? COLORS.negative : COLORS.textMuted }}>{isStale(acc.last_updated) && '⚠️ '}{acc.last_updated ? `Updated: ${new Date(acc.last_updated).toLocaleDateString()}` : 'Never'}</p>
          </div>
          {editingId === acc.id ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="number" value={editBalance} onChange={e => setEditBalance(e.target.value)} style={{ width: 100, padding: 8, borderRadius: 4, border: `1px solid ${COLORS.border}` }} />
              <button onClick={() => handleUpdate(acc.id)} style={{ padding: '8px 12px', background: COLORS.positive, color: '#FFF', border: 'none', borderRadius: 4 }}>Save</button>
              <button onClick={() => setEditingId(null)} style={{ padding: '8px 12px', background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 4 }}>Cancel</button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{formatCurrency(acc.balance)}</span>
              <button onClick={() => { setEditingId(acc.id); setEditBalance(acc.balance?.toString() || '0'); }} style={{ padding: '6px 12px', background: COLORS.primary, color: '#FFF', border: 'none', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}>Update</button>
            </div>
          )}
        </div>
      ))}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0 0', fontWeight: 600 }}><span>Total</span><span style={{ color: COLORS.primary }}>{formatCurrency(total)}</span></div>
    </Card>
  );
}

// =============================================================================
// AI ADVISOR
// =============================================================================
function AIAdvisorPanel({ apiUrl, apiKey, isOpen, onClose }) {
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const suggestions = ["Should I prioritize HELOC or retirement?", "Am I on track for the twin tuition crunch?", "What if rates drop to 5%?"];

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
    <div style={{ position: 'fixed', bottom: 80, right: 24, width: 400, height: 520, background: COLORS.bgCard, borderRadius: 16, boxShadow: '0 10px 40px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', zIndex: 1000 }}>
      <div style={{ padding: 16, borderBottom: `1px solid ${COLORS.border}`, display: 'flex', justifyContent: 'space-between' }}><h3 style={{ margin: 0 }}>🤖 Financial Advisor</h3><button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>×</button></div>
      <div style={{ flex: 1, padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.length === 0 && <div><p style={{ color: COLORS.textMuted, marginBottom: 12 }}>Ask about your finances:</p>{suggestions.map(s => <button key={s} onClick={() => setQuestion(s)} style={{ display: 'block', width: '100%', padding: 10, marginBottom: 8, background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 12, cursor: 'pointer', textAlign: 'left' }}>{s}</button>)}</div>}
        {messages.map((m, i) => <div key={i} style={{ padding: 12, borderRadius: 12, background: m.role === 'user' ? COLORS.primary : COLORS.bg, color: m.role === 'user' ? '#FFF' : COLORS.text, alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%', fontSize: 13, whiteSpace: 'pre-wrap' }}>{m.content}</div>)}
        {loading && <div style={{ color: COLORS.textMuted }}>Thinking...</div>}
      </div>
      <div style={{ padding: 12, borderTop: `1px solid ${COLORS.border}`, display: 'flex', gap: 8 }}><input value={question} onChange={e => setQuestion(e.target.value)} onKeyDown={e => e.key === 'Enter' && askAI()} placeholder="Ask..." style={{ flex: 1, padding: 10, border: `1px solid ${COLORS.border}`, borderRadius: 8 }} /><button onClick={askAI} disabled={loading} style={{ padding: '10px 16px', background: COLORS.positive, color: '#FFF', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>→</button></div>
    </div>
  );
}

// =============================================================================
// MAIN DASHBOARD
// =============================================================================
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
  const [newNote, setNewNote] = useState('');

  const apiUrl = import.meta.env.VITE_API_URL || 'https://goodlevdashboard.up.railway.app';
  const apiKey = sessionStorage.getItem('dashboard_api_key') || import.meta.env.VITE_API_KEY || '';
  const period = useMemo(() => getPeriodDates(periodType, selectedDate), [periodType, selectedDate]);

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
        const [bva, nw, n] = await Promise.all([
          api(`/api/budget-vs-actual?start_date=${period.start}&end_date=${period.end}`),
          api('/api/net-worth'),
          api('/api/notes')
        ]);
        setBudgetVsActual(bva);
        setNetWorth(nw);
        setNotes(Array.isArray(n) ? n : []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [isAuthenticated, period.start, period.end, api]);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    try { await api('/api/notes', { method: 'POST', body: JSON.stringify({ content: newNote }) }); setNewNote(''); setNotes(await api('/api/notes')); }
    catch (e) { console.error(e); }
  };

  const refreshNetWorth = async () => { try { setNetWorth(await api('/api/net-worth')); } catch (e) { console.error(e); } };

  if (!isAuthenticated) return <LoginScreen onLogin={() => setIsAuthenticated(true)} />;

  const tabs = [
    { id: 'dashboard', label: '📊 Dashboard' },
    { id: 'trends', label: '📈 Trends' },
    { id: 'strategies', label: '⚖️ Strategies' },
    { id: 'accounts', label: '💳 Accounts' },
    { id: 'notes', label: '📝 Notes' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: COLORS.bg }}>
      <header style={{ background: `linear-gradient(135deg, ${COLORS.primary} 0%, #0A1F33 100%)`, color: '#FFF', padding: '16px 24px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div><h1 style={{ margin: 0, fontSize: 22 }}>🏦 Goodlev Dashboard</h1><p style={{ margin: '4px 0 0', opacity: 0.8, fontSize: 13 }}>v5.0 - Financial Planning</p></div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.15)', borderRadius: 8 }}>Net Worth: <strong>{formatCurrency(netWorth?.net_worth)}</strong></div>
              <div style={{ padding: '8px 16px', background: 'rgba(39,174,96,0.3)', borderRadius: 8 }}>Surplus: <strong>{formatCurrency(BASELINE.monthlySurplus)}</strong>/mo</div>
            </div>
          </div>
          <nav style={{ marginTop: 20, display: 'flex', gap: 4, flexWrap: 'wrap' }}>{tabs.map(t => <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ padding: '10px 18px', background: activeTab === t.id ? COLORS.accent : 'transparent', color: '#FFF', border: 'none', borderRadius: '8px 8px 0 0', fontWeight: activeTab === t.id ? 600 : 400, cursor: 'pointer', fontSize: 14 }}>{t.label}</button>)}</nav>
        </div>
      </header>

      <main style={{ maxWidth: 1400, margin: '0 auto', padding: 24 }}>
        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <PeriodSelector periodType={periodType} setPeriodType={setPeriodType} selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
            
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <KPICard label="Net Worth" value={formatCurrency(netWorth?.net_worth)} icon="💰" color={netWorth?.net_worth >= 0 ? COLORS.positive : COLORS.negative} />
              <KPICard label="Assets" value={formatCurrency(netWorth?.total_assets)} icon="📈" color={COLORS.positive} />
              <KPICard label="Liabilities" value={formatCurrency(netWorth?.total_liabilities)} icon="📉" color={COLORS.negative} />
              <KPICard label="Monthly Surplus" value={formatCurrency(BASELINE.monthlySurplus)} icon="💵" color={COLORS.accent} />
            </div>

            {netWorth?.has_warnings && (
              <div style={{ background: '#FEF3E2', border: `1px solid ${COLORS.warning}`, borderRadius: 8, padding: 16 }}>
                <strong style={{ color: '#8B5A00' }}>⚠️ {netWorth.unmapped_count} account(s) need classification</strong> - Go to Accounts tab
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: 24 }}>
              <Card title={`Budget vs Actual - ${period.label}`} icon="📊">
                {loading ? <p style={{ color: COLORS.textMuted }}>Loading...</p> : budgetVsActual?.categories ? (
                  <div>
                    <div style={{ display: 'flex', gap: 24, marginBottom: 20 }}>
                      <div><p style={{ margin: 0, fontSize: 13, color: COLORS.textMuted }}>Budgeted</p><p style={{ margin: '4px 0', fontSize: 24, fontWeight: 700 }}>{formatCurrency(budgetVsActual.totals?.budgeted)}</p></div>
                      <div><p style={{ margin: 0, fontSize: 13, color: COLORS.textMuted }}>Actual</p><p style={{ margin: '4px 0', fontSize: 24, fontWeight: 700 }}>{formatCurrency(budgetVsActual.totals?.actual)}</p></div>
                      <div><p style={{ margin: 0, fontSize: 13, color: COLORS.textMuted }}>Variance</p><p style={{ margin: '4px 0', fontSize: 24, fontWeight: 700, color: budgetVsActual.totals?.variance >= 0 ? COLORS.positive : COLORS.negative }}>{budgetVsActual.totals?.variance >= 0 ? '+' : ''}{formatCurrency(budgetVsActual.totals?.variance)}</p></div>
                    </div>
                    <p style={{ margin: '0 0 12px', fontSize: 12, color: COLORS.textMuted }}>{budgetVsActual.transaction_count} transactions analyzed</p>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={budgetVsActual.categories.filter(c => c.actual > 50).slice(0, 12)} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                        <YAxis type="category" dataKey="category" width={100} tick={{ fontSize: 11 }} />
                        <Tooltip formatter={v => formatCurrency(v)} />
                        <Legend />
                        <Bar dataKey="budgeted" fill={COLORS.info} name="Budget" />
                        <Bar dataKey="actual" fill={COLORS.accent} name="Actual" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : <p style={{ color: COLORS.textMuted }}>No data</p>}
              </Card>

              <CategoryDrillDown apiUrl={apiUrl} apiKey={apiKey} startDate={period.start} endDate={period.end} />
            </div>
          </div>
        )}

        {/* TRENDS TAB */}
        {activeTab === 'trends' && <SpendingTrends apiUrl={apiUrl} apiKey={apiKey} />}

        {/* STRATEGIES TAB */}
        {activeTab === 'strategies' && <StrategyComparison apiUrl={apiUrl} apiKey={apiKey} />}

        {/* ACCOUNTS TAB */}
        {activeTab === 'accounts' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24 }}>
            <AccountMappingPanel apiUrl={apiUrl} apiKey={apiKey} onMappingChange={refreshNetWorth} />
            <ManualAccountsPanel apiUrl={apiUrl} apiKey={apiKey} onUpdate={refreshNetWorth} />
            {netWorth && (
              <Card title="Net Worth Breakdown" icon="💰">
                <div style={{ marginBottom: 16 }}>
                  <h4 style={{ margin: '0 0 12px', color: COLORS.positive }}>Assets ({formatCurrency(netWorth.total_assets)})</h4>
                  {Object.entries(netWorth.assets || {}).filter(([_, v]) => v > 0).map(([k, v]) => <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${COLORS.border}` }}><span style={{ textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}</span><span style={{ fontWeight: 600 }}>{formatCurrency(v)}</span></div>)}
                </div>
                <div>
                  <h4 style={{ margin: '0 0 12px', color: COLORS.negative }}>Liabilities ({formatCurrency(netWorth.total_liabilities)})</h4>
                  {Object.entries(netWorth.liabilities || {}).filter(([_, v]) => v > 0).map(([k, v]) => <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${COLORS.border}` }}><span style={{ textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}</span><span style={{ fontWeight: 600, color: COLORS.negative }}>{formatCurrency(v)}</span></div>)}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* NOTES TAB */}
        {activeTab === 'notes' && (
          <Card title="Financial Notes" icon="📝">
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              <input placeholder="Add a note..." value={newNote} onChange={e => setNewNote(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddNote()} style={{ flex: 1, padding: 12, border: `1px solid ${COLORS.border}`, borderRadius: 8 }} />
              <button onClick={handleAddNote} style={{ padding: '12px 20px', background: COLORS.primary, color: '#FFF', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Add</button>
            </div>
            {notes.map(n => <div key={n.id} style={{ padding: '12px 0', borderBottom: `1px solid ${COLORS.border}` }}><p style={{ margin: 0 }}>{n.content}</p><p style={{ margin: '4px 0 0', fontSize: 12, color: COLORS.textMuted }}>{new Date(n.created_at).toLocaleDateString()}</p></div>)}
          </Card>
        )}
      </main>

      <button onClick={() => setAiOpen(!aiOpen)} style={{ position: 'fixed', bottom: 24, right: 24, width: 56, height: 56, borderRadius: '50%', background: aiOpen ? COLORS.textMuted : COLORS.accent, color: '#FFF', border: 'none', fontSize: 28, cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', zIndex: 999 }}>{aiOpen ? '×' : '🤖'}</button>
      <AIAdvisorPanel apiUrl={apiUrl} apiKey={apiKey} isOpen={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  );
}
