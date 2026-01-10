import React, { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area, ReferenceLine, Legend } from 'recharts';

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
  bg: '#F8F9FA',
  bgCard: '#FFFFFF',
  text: '#2C3E50',
  textLight: '#7F8C8D',
  textMuted: '#95A5A6',
  border: '#E8ECF0',
};

const BASELINE = {
  monthlyIncome: 22625,
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
  categories: {
    mortgage: { budgeted: 4208, name: 'Mortgage' },
    heloc: { budgeted: 1546, name: 'HELOC' },
    therapy: { budgeted: 3000, name: 'Therapy' },
    shopping: { budgeted: 1645, name: 'Shopping' },
    childcare: { budgeted: 876, name: 'Childcare' },
    groceries: { budgeted: 800, name: 'Groceries' },
    dining: { budgeted: 400, name: 'Dining' },
    utilities: { budgeted: 400, name: 'Utilities' },
    fitness: { budgeted: 400, name: 'Fitness' },
    other: { budgeted: 1428, name: 'Other' },
  }
};

const PHILOSOPHIES = {
  balanced: { name: 'Balanced', desc: 'Equal priority to debt and wealth building', helocAllocation: 0.5, retirementAllocation: 0.3, emergencyAllocation: 0.1, educationAllocation: 0.1 },
  debtFirst: { name: 'Debt First', desc: 'Maximize debt payoff first', helocAllocation: 0.8, retirementAllocation: 0.1, emergencyAllocation: 0.05, educationAllocation: 0.05 },
  growth: { name: 'Growth Focus', desc: 'Prioritize retirement growth', helocAllocation: 0.2, retirementAllocation: 0.6, emergencyAllocation: 0.1, educationAllocation: 0.1 },
  fire: { name: 'FIRE', desc: 'Aggressive savings for early retirement', helocAllocation: 0.15, retirementAllocation: 0.7, emergencyAllocation: 0.1, educationAllocation: 0.05 },
};

const calculateDebtPayoff = (principal, annualRate, monthlyPayment, extraPayment = 0) => {
  let balance = principal;
  const monthlyRate = annualRate / 12;
  const totalPayment = monthlyPayment + extraPayment;
  let months = 0;
  let totalInterest = 0;
  const schedule = [];
  
  while (balance > 0 && months < 360) {
    const interest = balance * monthlyRate;
    totalInterest += interest;
    balance = Math.max(0, balance - (totalPayment - interest));
    months++;
    if (months % 12 === 0 || balance === 0) {
      schedule.push({ month: months, year: Math.floor(months / 12), balance: Math.round(balance) });
    }
    if (totalPayment <= interest) return { months: -1, payoffDate: 'Never', totalInterest: Infinity, schedule: [] };
  }
  
  const payoffDate = new Date();
  payoffDate.setMonth(payoffDate.getMonth() + months);
  return { months, payoffDate: payoffDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), totalInterest: Math.round(totalInterest), schedule };
};

const calculateRetirementGrowth = (currentBalance, monthlyContrib, years) => {
  const monthlyReturn = 0.07 / 12;
  let balance = currentBalance;
  const snapshots = [];
  
  for (let month = 1; month <= years * 12; month++) {
    balance = balance * (1 + monthlyReturn) + monthlyContrib;
    if (month % 12 === 0) {
      snapshots.push({ year: month / 12, age: BASELINE.ericAge + (month / 12), balance: Math.round(balance) });
    }
  }
  return { finalBalance: Math.round(balance), snapshots };
};

const calculate529Growth = (currentBalance, monthlyContrib, years) => {
  const monthlyReturn = 0.06 / 12;
  let balance = currentBalance;
  for (let month = 1; month <= years * 12; month++) {
    balance = balance * (1 + monthlyReturn) + monthlyContrib;
  }
  return { finalBalance: Math.round(balance) };
};

const formatCurrency = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value || 0);

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
// MAIN DASHBOARD
// =============================================================================
export default function GoodlevDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => sessionStorage.getItem('dashboard_authenticated') === 'true');
  const [activeTab, setActiveTab] = useState('overview');
  const [philosophy, setPhilosophy] = useState('balanced');
  const [helocExtra, setHelocExtra] = useState(1961);
  const [retirementExtra, setRetirementExtra] = useState(1176);
  const [emergencyExtra, setEmergencyExtra] = useState(392);
  const [educationExtra, setEducationExtra] = useState(392);
  const [scenarios, setScenarios] = useState([]);
  const [scenarioName, setScenarioName] = useState('');
  
  // AI Chat state
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  
  const [actualSpending] = useState({
    mortgage: 4472, heloc: 1528, therapy: 882, shopping: 1890, childcare: 889,
    groceries: 920, dining: 485, utilities: 380, fitness: 390, other: 1245,
  });

  const apiUrl = import.meta.env.VITE_API_URL || 'https://goodlevdashboard.up.railway.app';
  const apiKey = import.meta.env.VITE_API_KEY || '';
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (apiKey && isAuthenticated) {
      fetch(`${apiUrl}/health`, { headers: { 'X-API-Key': apiKey } })
        .then(res => { if (res.ok) setIsConnected(true); })
        .catch(() => {});
    }
  }, [isAuthenticated, apiKey, apiUrl]);

  useEffect(() => {
    const preset = PHILOSOPHIES[philosophy];
    if (preset) {
      const surplus = BASELINE.monthlySurplus;
      setHelocExtra(Math.round(surplus * preset.helocAllocation));
      setRetirementExtra(Math.round(surplus * preset.retirementAllocation));
      setEmergencyExtra(Math.round(surplus * preset.emergencyAllocation));
      setEducationExtra(Math.round(surplus * preset.educationAllocation));
    }
  }, [philosophy]);

  const totalAllocated = helocExtra + retirementExtra + emergencyExtra + educationExtra;
  const remainingSurplus = BASELINE.monthlySurplus - totalAllocated;
  const totalActual = Object.values(actualSpending).reduce((a, b) => a + b, 0);
  const totalBudgeted = Object.values(BASELINE.categories).reduce((a, b) => a + b.budgeted, 0);
  const actualSurplus = BASELINE.monthlyIncome - totalActual;

  const helocBaseline = useMemo(() => calculateDebtPayoff(BASELINE.helocBalance, BASELINE.helocRate, BASELINE.helocPayment, 0), []);
  const helocWithExtra = useMemo(() => calculateDebtPayoff(BASELINE.helocBalance, BASELINE.helocRate, BASELINE.helocPayment, helocExtra), [helocExtra]);
  const interestSaved = helocBaseline.totalInterest - helocWithExtra.totalInterest;

  const monthlyRetirement = (BASELINE.totalAnnualRetirement / 12) + retirementExtra;
  const retirementProjection = useMemo(() => calculateRetirementGrowth(BASELINE.totalRetirement, monthlyRetirement, 20), [monthlyRetirement]);
  
  const education529 = useMemo(() => calculate529Growth(BASELINE.balance529, educationExtra, 11), [educationExtra]);

  const handleLogout = () => { sessionStorage.removeItem('dashboard_authenticated'); setIsAuthenticated(false); };

  const categoryData = Object.entries(BASELINE.categories).map(([key, cat]) => ({
    name: cat.name, budgeted: cat.budgeted, actual: actualSpending[key] || 0,
  }));

  const saveScenario = () => {
    if (!scenarioName.trim()) return;
    const newScenario = {
      id: Date.now(),
      name: scenarioName,
      createdAt: new Date().toISOString(),
      data: {
        philosophy, helocExtra, retirementExtra, emergencyExtra, educationExtra,
        projections: {
          helocPayoff: helocWithExtra,
          retirement: retirementProjection.finalBalance,
          education: education529.finalBalance,
        }
      }
    };
    setScenarios([...scenarios, newScenario]);
    setScenarioName('');
  };

  const loadScenario = (scenario) => {
    setPhilosophy(scenario.data.philosophy);
    setHelocExtra(scenario.data.helocExtra);
    setRetirementExtra(scenario.data.retirementExtra);
    setEmergencyExtra(scenario.data.emergencyExtra);
    setEducationExtra(scenario.data.educationExtra);
  };

  const deleteScenario = (id) => setScenarios(scenarios.filter(s => s.id !== id));

  // Build financial context for AI
  const buildFinancialContext = () => `
CURRENT FINANCIAL SNAPSHOT (January 2026):
- Monthly Income: ${formatCurrency(BASELINE.monthlyIncome)}
- Monthly Surplus: ${formatCurrency(actualSurplus)}
- Current Allocation: HELOC +${formatCurrency(helocExtra)}, Retirement +${formatCurrency(retirementExtra)}, Emergency +${formatCurrency(emergencyExtra)}, Education +${formatCurrency(educationExtra)}

DEBT:
- HELOC Balance: ${formatCurrency(BASELINE.helocBalance)} at 6.32% (draw period ends Jan 2032)
- With current extra payments: Payoff ${helocWithExtra.payoffDate} (${helocWithExtra.months} months), saving ${formatCurrency(interestSaved)} in interest
- Mortgage: $468,000 at 2.25% (keep this - great rate)

RETIREMENT:
- Current Balance: ${formatCurrency(BASELINE.totalRetirement)}
- Annual Contributions: ${formatCurrency(BASELINE.totalAnnualRetirement)}
- Projected at 60: ${formatCurrency(retirementProjection.finalBalance)}
- Target: ${formatCurrency(BASELINE.retirementTarget)}

SAVINGS:
- Emergency Fund: ${formatCurrency(BASELINE.emergencyFund)} (target: ${formatCurrency(BASELINE.emergencyTarget)})
- 529 Education: ${formatCurrency(BASELINE.balance529)} (3 kids, ages 7, 6, 6 - overlap in college 2037-2039)

SPECIAL CONSIDERATIONS:
- Eric (40) works 80% at Fox Chase Cancer Center - excellent PPO for out-of-network therapy
- Lauren (42) is clergy at Beth David Reform Congregation
- Eldest child has giftedness + autism, ongoing therapy costs ~$3K/month
- Healthcare coverage is critical for retirement timing

CURRENT PHILOSOPHY: ${PHILOSOPHIES[philosophy].name}
`;

  const askAI = async () => {
    if (!aiQuestion.trim()) return;
    setAiLoading(true);
    const context = buildFinancialContext();
    
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [...chatHistory, { role: 'user', content: `${context}\n\nQUESTION: ${aiQuestion}` }],
          system: `You are a knowledgeable financial advisor. Be specific with numbers. Keep responses concise (2-3 paragraphs). Reference actual data. Consider special circumstances (therapy costs, 3 kids in college simultaneously, healthcare needs).`
        })
      });
      
      const data = await response.json();
      const answer = data.content?.[0]?.text || 'Unable to get response.';
      setAiResponse(answer);
      setChatHistory(prev => [...prev, { role: 'user', content: aiQuestion }, { role: 'assistant', content: answer }]);
      setAiQuestion('');
    } catch (error) {
      setAiResponse('Error connecting to AI. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  if (!isAuthenticated) return <LoginScreen onLogin={() => setIsAuthenticated(true)} />;

  return (
    <div style={{ minHeight: '100vh', background: COLORS.bg, fontFamily: 'system-ui, sans-serif' }}>
      {/* HEADER */}
      <header style={{ background: `linear-gradient(135deg, ${COLORS.primary} 0%, #0A1F33 100%)`, padding: '20px 24px', color: '#FFF' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Family Financial Dashboard</h1>
              <p style={{ margin: '4px 0 0 0', opacity: 0.8, fontSize: 13 }}>Planning & Budget Tracking</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.15)', borderRadius: 8, fontSize: 14 }}>
                Surplus: <strong>{formatCurrency(actualSurplus)}</strong>/mo
              </div>
              <button onClick={handleLogout} style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.1)', color: '#FFF', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>Logout</button>
            </div>
          </div>
          <nav style={{ marginTop: 20, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {[
              { id: 'overview', label: '📊 Overview' },
              { id: 'budget', label: '💰 Budget' },
              { id: 'allocation', label: '🎯 Allocation' },
              { id: 'scenarios', label: '📋 Scenarios' },
              { id: 'advisor', label: '🤖 Ask AI' },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                padding: '10px 18px', background: activeTab === tab.id ? COLORS.accent : 'transparent',
                color: '#FFF', border: 'none', borderRadius: '8px 8px 0 0', fontWeight: activeTab === tab.id ? 600 : 400, cursor: 'pointer', fontSize: 14,
              }}>{tab.label}</button>
            ))}
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
        {/* CONNECTION STATUS */}
        <div style={{ background: isConnected ? '#D5F5E3' : '#FEF9E7', border: `1px solid ${isConnected ? COLORS.positive : COLORS.warning}`, borderRadius: 12, padding: 16, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: isConnected ? COLORS.positive : COLORS.warning }} />
            <span style={{ fontWeight: 600, color: COLORS.text }}>{isConnected ? '✓ Connected to YNAB API' : 'Demo Mode - Add VITE_API_KEY to Vercel env vars & redeploy'}</span>
          </div>
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
              {[
                { label: 'Monthly Surplus', value: formatCurrency(actualSurplus), color: actualSurplus > 0 ? COLORS.positive : COLORS.negative },
                { label: 'HELOC Balance', value: formatCurrency(BASELINE.helocBalance), sub: `Payoff: ${helocWithExtra.payoffDate}`, color: COLORS.heloc },
                { label: 'Retirement', value: formatCurrency(BASELINE.totalRetirement), sub: `Target: ${formatCurrency(BASELINE.retirementTarget)}`, color: COLORS.retirement },
                { label: 'Emergency Fund', value: formatCurrency(BASELINE.emergencyFund), sub: `Target: ${formatCurrency(BASELINE.emergencyTarget)}`, color: COLORS.emergency },
                { label: '529 Balance', value: formatCurrency(BASELINE.balance529), sub: `Projected: ${formatCurrency(education529.finalBalance)}`, color: COLORS.education },
              ].map(card => (
                <div key={card.label} style={{ background: COLORS.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${COLORS.border}`, borderLeft: `4px solid ${card.color}` }}>
                  <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 4 }}>{card.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: card.color }}>{card.value}</div>
                  {card.sub && <div style={{ fontSize: 12, color: COLORS.textLight }}>{card.sub}</div>}
                </div>
              ))}
            </div>
            <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 24, border: `1px solid ${COLORS.border}` }}>
              <h3 style={{ margin: '0 0 16px 0', color: COLORS.text }}>20-Year Retirement Trajectory</h3>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={retirementProjection.snapshots}>
                  <defs><linearGradient id="retGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLORS.retirement} stopOpacity={0.3} /><stop offset="95%" stopColor={COLORS.retirement} stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                  <XAxis dataKey="age" tick={{ fill: COLORS.textMuted, fontSize: 12 }} />
                  <YAxis tickFormatter={v => `$${(v / 1000000).toFixed(1)}M`} tick={{ fill: COLORS.textMuted, fontSize: 12 }} />
                  <Tooltip formatter={v => formatCurrency(v)} labelFormatter={age => `Age ${age}`} />
                  <ReferenceLine y={BASELINE.retirementTarget} stroke={COLORS.accent} strokeDasharray="5 5" label={{ value: '$4M Target', fill: COLORS.accent, fontSize: 11 }} />
                  <Area type="monotone" dataKey="balance" stroke={COLORS.retirement} fill="url(#retGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
              <div style={{ marginTop: 12, textAlign: 'center', color: COLORS.textLight, fontSize: 13 }}>
                Projected at 60: <strong style={{ color: COLORS.retirement }}>{formatCurrency(retirementProjection.finalBalance)}</strong>
                {retirementProjection.finalBalance >= BASELINE.retirementTarget && <span style={{ color: COLORS.positive }}> ✓ Exceeds $4M target</span>}
              </div>
            </div>
          </div>
        )}

        {/* BUDGET TAB */}
        {activeTab === 'budget' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginBottom: 24 }}>
              <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 24, border: `1px solid ${COLORS.border}` }}>
                <h3 style={{ margin: '0 0 16px 0', color: COLORS.text, fontSize: 16 }}>This Month</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><span style={{ color: COLORS.textLight }}>Budgeted</span><span style={{ fontWeight: 600 }}>{formatCurrency(totalBudgeted)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><span style={{ color: COLORS.textLight }}>Actual</span><span style={{ fontWeight: 600 }}>{formatCurrency(totalActual)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, borderTop: `1px solid ${COLORS.border}` }}>
                  <span style={{ fontWeight: 600 }}>Variance</span>
                  <span style={{ fontWeight: 700, color: totalBudgeted - totalActual >= 0 ? COLORS.positive : COLORS.negative }}>{totalBudgeted - totalActual >= 0 ? '+' : ''}{formatCurrency(totalBudgeted - totalActual)}</span>
                </div>
              </div>
              <div style={{ background: `linear-gradient(135deg, ${COLORS.primary} 0%, #1A3A5C 100%)`, borderRadius: 12, padding: 24, color: '#FFF' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: 16 }}>HELOC Impact</h3>
                <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 8 }}>Extra {formatCurrency(helocExtra)}/mo:</div>
                <div style={{ display: 'flex', gap: 24 }}>
                  <div><div style={{ fontSize: 11, opacity: 0.7 }}>Payoff Date</div><div style={{ fontSize: 18, fontWeight: 700 }}>{helocWithExtra.payoffDate}</div></div>
                  <div><div style={{ fontSize: 11, opacity: 0.7 }}>Interest Saved</div><div style={{ fontSize: 18, fontWeight: 700, color: '#58D68D' }}>{formatCurrency(interestSaved)}</div></div>
                </div>
              </div>
            </div>
            <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 24, border: `1px solid ${COLORS.border}` }}>
              <h3 style={{ margin: '0 0 16px 0', color: COLORS.text }}>Budget vs Actual</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                  <XAxis type="number" tickFormatter={v => `$${v}`} />
                  <YAxis type="category" dataKey="name" tick={{ fill: COLORS.textMuted, fontSize: 12 }} width={80} />
                  <Tooltip formatter={v => formatCurrency(v)} />
                  <Legend />
                  <Bar dataKey="budgeted" fill={COLORS.plan} name="Budgeted" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="actual" fill={COLORS.positive} name="Actual" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ALLOCATION TAB */}
        {activeTab === 'allocation' && (
          <div>
            <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 24, border: `1px solid ${COLORS.border}`, marginBottom: 24 }}>
              <h3 style={{ margin: '0 0 16px 0', color: COLORS.text }}>Financial Philosophy</h3>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {Object.entries(PHILOSOPHIES).map(([key, preset]) => (
                  <button key={key} onClick={() => setPhilosophy(key)} style={{
                    padding: '10px 16px', borderRadius: 8, border: philosophy === key ? `2px solid ${COLORS.accent}` : `1px solid ${COLORS.border}`,
                    background: philosophy === key ? `${COLORS.accent}20` : COLORS.bgCard, cursor: 'pointer', fontWeight: 600, color: COLORS.text,
                  }}>{preset.name}</button>
                ))}
              </div>
              {PHILOSOPHIES[philosophy] && <p style={{ margin: '12px 0 0 0', color: COLORS.textLight, fontSize: 13 }}>{PHILOSOPHIES[philosophy].desc}</p>}
            </div>
            <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 24, border: `1px solid ${COLORS.border}`, marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, color: COLORS.text }}>Surplus Allocation</h3>
                <div style={{ padding: '6px 12px', borderRadius: 20, background: remainingSurplus >= 0 ? `${COLORS.positive}30` : `${COLORS.negative}30`, color: remainingSurplus >= 0 ? COLORS.positive : COLORS.negative, fontWeight: 600, fontSize: 14 }}>
                  {remainingSurplus >= 0 ? `${formatCurrency(remainingSurplus)} unallocated` : `${formatCurrency(Math.abs(remainingSurplus))} over`}
                </div>
              </div>
              <div style={{ height: 8, background: COLORS.border, borderRadius: 4, marginBottom: 24, display: 'flex', overflow: 'hidden' }}>
                <div style={{ width: `${(helocExtra / BASELINE.monthlySurplus) * 100}%`, background: COLORS.heloc }} />
                <div style={{ width: `${(retirementExtra / BASELINE.monthlySurplus) * 100}%`, background: COLORS.retirement }} />
                <div style={{ width: `${(emergencyExtra / BASELINE.monthlySurplus) * 100}%`, background: COLORS.emergency }} />
                <div style={{ width: `${(educationExtra / BASELINE.monthlySurplus) * 100}%`, background: COLORS.education }} />
              </div>
              {[
                { label: 'HELOC Extra', value: helocExtra, setter: setHelocExtra, color: COLORS.heloc, max: 3000 },
                { label: 'Retirement Extra', value: retirementExtra, setter: setRetirementExtra, color: COLORS.retirement, max: 2000 },
                { label: 'Emergency Fund', value: emergencyExtra, setter: setEmergencyExtra, color: COLORS.emergency, max: 1000 },
                { label: '529 Education', value: educationExtra, setter: setEducationExtra, color: COLORS.education, max: 1000 },
              ].map(s => (
                <div key={s.label} style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ color: COLORS.text, fontWeight: 500 }}>{s.label}</span>
                    <span style={{ color: s.color, fontWeight: 700 }}>{formatCurrency(s.value)}/mo</span>
                  </div>
                  <input type="range" min="0" max={s.max} step="50" value={s.value} onChange={e => s.setter(Number(e.target.value))} style={{ width: '100%', accentColor: s.color }} />
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${COLORS.border}`, borderTop: `4px solid ${COLORS.heloc}` }}>
                <h4 style={{ margin: '0 0 12px 0', color: COLORS.heloc, fontSize: 15 }}>🏦 HELOC Payoff</h4>
                <div style={{ fontSize: 13 }}><span style={{ color: COLORS.textLight }}>Payoff:</span> <strong>{helocWithExtra.payoffDate}</strong></div>
                <div style={{ fontSize: 13 }}><span style={{ color: COLORS.textLight }}>Saved:</span> <strong style={{ color: COLORS.positive }}>{formatCurrency(interestSaved)}</strong></div>
              </div>
              <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${COLORS.border}`, borderTop: `4px solid ${COLORS.retirement}` }}>
                <h4 style={{ margin: '0 0 12px 0', color: COLORS.retirement, fontSize: 15 }}>📈 Retirement @60</h4>
                <div style={{ fontSize: 13 }}><span style={{ color: COLORS.textLight }}>Projected:</span> <strong>{formatCurrency(retirementProjection.finalBalance)}</strong></div>
                <div style={{ fontSize: 13 }}><span style={{ color: COLORS.textLight }}>vs Target:</span> <strong style={{ color: retirementProjection.finalBalance >= BASELINE.retirementTarget ? COLORS.positive : COLORS.warning }}>{formatCurrency(retirementProjection.finalBalance - BASELINE.retirementTarget)}</strong></div>
              </div>
              <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${COLORS.border}`, borderTop: `4px solid ${COLORS.emergency}` }}>
                <h4 style={{ margin: '0 0 12px 0', color: COLORS.emergency, fontSize: 15 }}>🛡️ Emergency Fund</h4>
                <div style={{ fontSize: 13 }}><span style={{ color: COLORS.textLight }}>Current:</span> <strong>{formatCurrency(BASELINE.emergencyFund)}</strong></div>
                <div style={{ height: 6, background: COLORS.border, borderRadius: 3, marginTop: 8 }}><div style={{ width: `${(BASELINE.emergencyFund / BASELINE.emergencyTarget) * 100}%`, height: '100%', background: COLORS.emergency, borderRadius: 3 }} /></div>
              </div>
              <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${COLORS.border}`, borderTop: `4px solid ${COLORS.education}` }}>
                <h4 style={{ margin: '0 0 12px 0', color: COLORS.education, fontSize: 15 }}>🎓 529 Education</h4>
                <div style={{ fontSize: 13 }}><span style={{ color: COLORS.textLight }}>Current:</span> <strong>{formatCurrency(BASELINE.balance529)}</strong></div>
                <div style={{ fontSize: 13 }}><span style={{ color: COLORS.textLight }}>@College:</span> <strong>{formatCurrency(education529.finalBalance)}</strong></div>
              </div>
            </div>
          </div>
        )}

        {/* SCENARIOS TAB */}
        {activeTab === 'scenarios' && (
          <div>
            <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 24, border: `1px solid ${COLORS.border}`, marginBottom: 24 }}>
              <h3 style={{ margin: '0 0 16px 0', color: COLORS.text }}>Save Current Scenario</h3>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <input type="text" value={scenarioName} onChange={e => setScenarioName(e.target.value)} placeholder="Scenario name (e.g., 'Aggressive HELOC')"
                  style={{ flex: 1, minWidth: 200, padding: '10px 14px', border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 14 }} />
                <button onClick={saveScenario} disabled={!scenarioName.trim()} style={{
                  padding: '10px 20px', background: scenarioName.trim() ? COLORS.accent : COLORS.border, color: '#FFF', border: 'none', borderRadius: 8, fontWeight: 600, cursor: scenarioName.trim() ? 'pointer' : 'not-allowed'
                }}>Save Scenario</button>
              </div>
              <div style={{ marginTop: 16, padding: 16, background: COLORS.bg, borderRadius: 8 }}>
                <div style={{ fontSize: 13, color: COLORS.textLight }}>Current Settings:</div>
                <div style={{ fontSize: 14, marginTop: 8 }}>
                  <strong>{PHILOSOPHIES[philosophy].name}</strong> • HELOC +{formatCurrency(helocExtra)} • Retirement +{formatCurrency(retirementExtra)} • Emergency +{formatCurrency(emergencyExtra)} • 529 +{formatCurrency(educationExtra)}
                </div>
              </div>
            </div>
            
            <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 24, border: `1px solid ${COLORS.border}` }}>
              <h3 style={{ margin: '0 0 16px 0', color: COLORS.text }}>Saved Scenarios</h3>
              {scenarios.length === 0 ? (
                <div style={{ color: COLORS.textMuted, padding: 40, textAlign: 'center' }}>No scenarios saved yet. Adjust allocation sliders and save to compare.</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                    <thead>
                      <tr style={{ borderBottom: `2px solid ${COLORS.border}` }}>
                        <th style={{ padding: 12, textAlign: 'left', color: COLORS.textMuted }}>Scenario</th>
                        <th style={{ padding: 12, textAlign: 'right', color: COLORS.textMuted }}>HELOC Extra</th>
                        <th style={{ padding: 12, textAlign: 'right', color: COLORS.textMuted }}>HELOC Payoff</th>
                        <th style={{ padding: 12, textAlign: 'right', color: COLORS.textMuted }}>Retirement @60</th>
                        <th style={{ padding: 12, textAlign: 'right', color: COLORS.textMuted }}>529 @College</th>
                        <th style={{ padding: 12, textAlign: 'center', color: COLORS.textMuted }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scenarios.map(scenario => (
                        <tr key={scenario.id} style={{ borderBottom: `1px solid ${COLORS.borderLight}` }}>
                          <td style={{ padding: 12 }}><div style={{ fontWeight: 600 }}>{scenario.name}</div><div style={{ fontSize: 11, color: COLORS.textMuted }}>{new Date(scenario.createdAt).toLocaleDateString()}</div></td>
                          <td style={{ padding: 12, textAlign: 'right' }}>{formatCurrency(scenario.data.helocExtra)}/mo</td>
                          <td style={{ padding: 12, textAlign: 'right' }}>{scenario.data.projections.helocPayoff.payoffDate}</td>
                          <td style={{ padding: 12, textAlign: 'right' }}>{formatCurrency(scenario.data.projections.retirement)}</td>
                          <td style={{ padding: 12, textAlign: 'right' }}>{formatCurrency(scenario.data.projections.education)}</td>
                          <td style={{ padding: 12, textAlign: 'center' }}>
                            <button onClick={() => loadScenario(scenario)} style={{ padding: '4px 10px', marginRight: 8, background: COLORS.plan, color: '#FFF', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>Load</button>
                            <button onClick={() => deleteScenario(scenario.id)} style={{ padding: '4px 10px', background: COLORS.negative, color: '#FFF', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ASK AI TAB */}
        {activeTab === 'advisor' && (
          <div>
            <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 24, border: `1px solid ${COLORS.border}`, marginBottom: 24 }}>
              <h3 style={{ margin: '0 0 8px 0', color: COLORS.text }}>🤖 Ask Your AI Financial Advisor</h3>
              <p style={{ color: COLORS.textLight, margin: '0 0 16px 0', fontSize: 14 }}>Get personalized advice based on your actual financial data:</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                {["Should I prioritize HELOC or retirement?", "Am I on track for retirement?", "How should I handle 3 kids in college overlap?", "What if I increase HELOC payments by $500?"].map(q => (
                  <button key={q} onClick={() => setAiQuestion(q)} style={{ padding: '6px 12px', background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 16, fontSize: 12, color: COLORS.textLight, cursor: 'pointer' }}>{q}</button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="text" value={aiQuestion} onChange={e => setAiQuestion(e.target.value)} onKeyDown={e => e.key === 'Enter' && askAI()} placeholder="Ask a question about your finances..."
                  style={{ flex: 1, padding: '12px 16px', border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 14 }} />
                <button onClick={askAI} disabled={aiLoading || !aiQuestion.trim()} style={{
                  padding: '12px 24px', background: aiLoading ? COLORS.textMuted : COLORS.accent, color: '#FFF', border: 'none', borderRadius: 8, fontWeight: 600, cursor: aiLoading ? 'wait' : 'pointer'
                }}>{aiLoading ? '...' : 'Ask'}</button>
              </div>
            </div>
            {aiResponse && (
              <div style={{ background: COLORS.bgCard, borderRadius: 12, padding: 24, border: `1px solid ${COLORS.border}`, borderLeft: `4px solid ${COLORS.accent}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 20 }}>🤖</span>
                  <span style={{ fontWeight: 600, color: COLORS.text }}>AI Advisor</span>
                </div>
                <div style={{ color: COLORS.text, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{aiResponse}</div>
              </div>
            )}
            <div style={{ background: COLORS.bg, borderRadius: 12, padding: 20, marginTop: 24 }}>
              <h4 style={{ margin: '0 0 12px 0', color: COLORS.textMuted, fontSize: 14 }}>📋 Data Being Analyzed</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, fontSize: 13 }}>
                <div><span style={{ color: COLORS.textMuted }}>Surplus:</span> <strong>{formatCurrency(actualSurplus)}/mo</strong></div>
                <div><span style={{ color: COLORS.textMuted }}>HELOC:</span> <strong>{formatCurrency(BASELINE.helocBalance)}</strong></div>
                <div><span style={{ color: COLORS.textMuted }}>Retirement:</span> <strong>{formatCurrency(BASELINE.totalRetirement)}</strong></div>
                <div><span style={{ color: COLORS.textMuted }}>Emergency:</span> <strong>{formatCurrency(BASELINE.emergencyFund)}</strong></div>
                <div><span style={{ color: COLORS.textMuted }}>529:</span> <strong>{formatCurrency(BASELINE.balance529)}</strong></div>
                <div><span style={{ color: COLORS.textMuted }}>Philosophy:</span> <strong>{PHILOSOPHIES[philosophy].name}</strong></div>
              </div>
            </div>
          </div>
        )}
      </main>
      <footer style={{ padding: 20, textAlign: 'center', color: COLORS.textMuted, fontSize: 12, borderTop: `1px solid ${COLORS.border}` }}>Family Financial Dashboard • YNAB + Claude</footer>
    </div>
  );
}
