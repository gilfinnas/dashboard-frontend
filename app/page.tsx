"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
  AreaChart, Area,
} from "recharts"
import { ArrowLeft, Calendar, Landmark, TrendingUp, Truck, Users } from "lucide-react"

// --- Type Definitions ---
interface DashboardData {
  kpi: {
    ytdNetProfit: number
    monthlySalaries: number
    monthlyLoans: number
    monthlySuppliers: number
  }
  charts: {
    monthlyComparison: { name: string; הכנסות: number; הוצאות: number }[]
    monthlyExpenseComposition: { name: string; value: number; color: string }[]
    expenseTrend: { name: string; [key: string]: number | string }[]
  }
}

interface ApiResponse {
  dashboardData: DashboardData;
  availableYears: string[];
}

// --- Helper Components ---
const KpiCard: React.FC<{ title: string; value: string; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
  <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 flex flex-col justify-between h-full">
    <div className="flex justify-between items-start">
      <p className="text-slate-400 text-sm font-medium">{title}</p>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        {icon}
      </div>
    </div>
    <p className="text-3xl font-bold text-white mt-2">{value}</p>
  </div>
)

const ChartCard: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = "" }) => (
  <div className={`bg-slate-800/60 p-6 rounded-xl border border-slate-700 h-full flex flex-col ${className}`}>
    <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
    <div className="flex-grow">{children}</div>
  </div>
)

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-sm p-3 rounded-lg border border-slate-600 shadow-xl">
        <p className="label font-bold text-cyan-300">{label}</p>
        {payload.map((pld: any, index: number) => (
          <p key={index} style={{ color: pld.color || pld.fill }}>
            {`${pld.name}: ₪${(pld.value || 0).toLocaleString()}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const EXPENSE_TREND_COLORS: { [key: string]: string } = { "ספקים": "#3b82f6", "הוצאות קבועות": "#8b5cf6", "הוצאות משתנות": "#ef4444", "משכורות ומיסים": "#f97316", "הלוואות": "#14b8a6", "בלת'מ": "#64748b" };

// --- Main Component ---
export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [availableYears, setAvailableYears] = useState<string[]>([])
  const [selectedYear, setSelectedYear] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Generic data fetching function
  const fetchData = async (userId: string, year?: string) => {
    setLoading(true);
    setError(null);
    
    const yearQuery = year ? `?year=${year}` : '';
    const apiUrl = `https://dashboard-backend-7vgh.onrender.com/api/dashboard/${userId}${yearQuery}`;
    console.log(`Fetching from: ${apiUrl}`);

    try {
      const apiKey = process.env.NEXT_PUBLIC_API_KEY;
      if (!apiKey) throw new Error("API Key is not configured.");

      const response = await fetch(apiUrl, { headers: { "x-api-key": apiKey } });
      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Error: ${response.status}`);
      }
      
      const result: ApiResponse = await response.json();
      setData(result.dashboardData);
      return result; // Return the full result for the initial load
    } catch (err: any) {
      console.error("Fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Effect for initial data load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userId = params.get("userId");

    if (!userId || userId === "null" || userId === "undefined") {
      setError("שגיאה: מזהה לקוח לא נמצא בכתובת.");
      setLoading(false);
      return;
    }

    const initialLoad = async () => {
      const result = await fetchData(userId);
      if (result && result.availableYears.length > 0) {
        setAvailableYears(result.availableYears);
        setSelectedYear(result.availableYears[0]);
      } else if (result) {
        setError("לא נמצאו נתונים עבור משתמש זה.");
      }
    };

    initialLoad();
  }, []);

  // Handler for year selection
  const handleYearChange = (newYear: string) => {
    const params = new URLSearchParams(window.location.search);
    const userId = params.get("userId");
    if (userId && newYear !== selectedYear) {
      setSelectedYear(newYear);
      fetchData(userId, newYear);
    }
  };

  const YearSelector = () => (
    <div className="relative">
      <select
        value={selectedYear}
        onChange={(e) => handleYearChange(e.target.value)}
        disabled={loading || availableYears.length <= 1}
        className="bg-slate-700 border border-slate-600 text-white font-semibold rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full pl-10 pr-4 py-2.5 appearance-none shadow-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {availableYears.length > 0 ? (
            availableYears.map((year) => (
              <option key={year} value={year}>
                שנת {year}
              </option>
            ))
        ) : (
            <option>טוען...</option>
        )}
      </select>
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <Calendar className="w-5 h-5 text-slate-400" />
      </div>
    </div>
  );

  if (loading && !data) return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center text-xl font-semibold">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-400"></div>
      <span className="mr-4">טוען דשבורד ניהולי...</span>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-slate-900 text-red-400 flex flex-col items-center justify-center text-lg p-8 text-center">
      <h2 className="text-3xl font-bold mb-4">אופס, אירעה שגיאה</h2>
      <p>{error}</p>
      <a href="https://gilfinnas.com/" className="mt-6 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold px-6 py-3 rounded-lg flex items-center gap-2 shadow-lg">
        <span>חזרה למערכת</span>
        <ArrowLeft className="w-5 h-5" />
      </a>
    </div>
  )

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center text-xl text-center p-4">
          <h2 className="text-3xl font-bold mb-4">אין מספיק נתונים</h2>
          <p className="max-w-md">כדי להציג את הדשבורד הניהולי, יש להזין נתונים במערכת התזרים הראשית תחילה.</p>
          <a href="https://gilfinnas.com/" className="mt-6 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold px-6 py-3 rounded-lg flex items-center gap-2 shadow-lg">
          <span>חזרה למערכת התזרים</span>
          <ArrowLeft className="w-5 h-5" />
        </a>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-300 font-sans p-4 sm:p-6 lg:p-8" dir="rtl">
      <div className="relative z-10 max-w-screen-2xl mx-auto">
        <header className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white">תקציר מנהלים</h1>
            <p className="text-slate-400 mt-1">תמונת מצב פיננסית של העסק</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
            <YearSelector />
            <a href="https://gilfinnas.com/" className="bg-slate-700 hover:bg-slate-600 text-white font-semibold px-5 py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-lg transition-colors duration-200">
              <span>מעבר לתזרים המלא</span>
              <ArrowLeft className="w-4 h-4" />
            </a>
          </div>
        </header>

        <main className="grid grid-cols-12 gap-6">
          
          <div className="col-span-12 lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
            <KpiCard title="רווח נקי (שנתי)" value={`₪${(data.kpi?.ytdNetProfit || 0).toLocaleString()}`} icon={<TrendingUp size={24} />} color="bg-green-500/20 text-green-400" />
            <KpiCard title="עלות משכורות (ממוצע חודשי)" value={`₪${(data.kpi?.monthlySalaries || 0).toLocaleString()}`} icon={<Users size={24} />} color="bg-amber-500/20 text-amber-400" />
            <KpiCard title="החזרי הלוואות (ממוצע חודשי)" value={`₪${(data.kpi?.monthlyLoans || 0).toLocaleString()}`} icon={<Landmark size={24} />} color="bg-teal-500/20 text-teal-400" />
            <KpiCard title="תשלום לספקים (ממוצע חודשי)" value={`₪${(data.kpi?.monthlySuppliers || 0).toLocaleString()}`} icon={<Truck size={24} />} color="bg-blue-500/20 text-blue-400" />
          </div>

          <div className="col-span-12 lg:col-span-9 grid grid-cols-1 gap-6">
            <ChartCard title={`הכנסות מול הוצאות - ${selectedYear}`}>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={data.charts.monthlyComparison} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                    <XAxis dataKey="name" tick={{ fill: "#94a3b8" }} fontSize={12} />
                    <YAxis tick={{ fill: "#94a3b8" }} fontSize={12} tickFormatter={(value) => `₪${value / 1000}k`} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(14, 165, 233, 0.1)' }} />
                    <Legend wrapperStyle={{ color: '#e5e7eb', fontSize: '14px' }} />
                    <Bar dataKey="הכנסות" fill="#0ea5e9" name="הכנסות" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="הוצאות" fill="#f43f5e" name="הוצאות" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
            </ChartCard>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <ChartCard title={`מגמת הוצאות לפי סוג - ${selectedYear}`}>
                    <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={data.charts.expenseTrend} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
                             <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                             <XAxis dataKey="name" tick={{ fill: "#94a3b8" }} fontSize={12}/>
                             <YAxis tick={{ fill: "#94a3b8" }} fontSize={12} tickFormatter={(value) => `₪${value / 1000}k`}/>
                             <Tooltip content={<CustomTooltip />} />
                             <Legend wrapperStyle={{ color: '#e5e7eb', fontSize: '12px' }} />
                             {Object.keys(EXPENSE_TREND_COLORS).map(key => (
                                <Area key={key} type="monotone" dataKey={key} stackId="1" stroke={EXPENSE_TREND_COLORS[key]} fill={EXPENSE_TREND_COLORS[key]} fillOpacity={0.6} />
                             ))}
                        </AreaChart>
                    </ResponsiveContainer>
                 </ChartCard>
                 <ChartCard title={`הרכב הוצאות שנתי - ${selectedYear}`}>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie data={data.charts.monthlyExpenseComposition} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={3}>
                            {data.charts.monthlyExpenseComposition.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke={'#1e293b'} />)}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend iconType="circle" layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: '12px', lineHeight: '20px' }}/>
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
