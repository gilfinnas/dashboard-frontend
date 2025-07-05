"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
  AreaChart, Area,
} from "recharts"
import { ArrowLeft, BarChart2, Briefcase, DollarSign, MinusCircle, PlusCircle, TrendingUp } from "lucide-react"

// --- Type Definitions ---
interface DashboardData {
  kpi: {
    ytdNetProfit: number
    ytdIncome: number
    ytdExpense: number
    totalTransactions: number
  }
  charts: {
    monthlyComparison: { name: string; הכנסות: number; הוצאות: number }[]
    expenseComposition: { name: string; value: number; color: string }[]
    netProfitTrend: { name: string; "רווח נקי": number; "רווח מצטבר": number }[]
  }
  recentTransactions: { id: string; description: string; amount: number; type: "inflow" | "outflow", date: string }[]
}

// --- Helper Components ---
const KpiCard: React.FC<{ title: string; value: string; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
  <div className="bg-slate-800/60 p-5 rounded-xl border border-slate-700 flex items-center gap-5">
    <div className={`w-14 h-14 rounded-lg flex items-center justify-center ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-slate-400 text-sm">{title}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
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
        {payload.map((pld: any) => (
          <p key={pld.dataKey} style={{ color: pld.color || pld.fill }}>
            {`${pld.name}: ₪${pld.value.toLocaleString()}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// --- Main Component ---
export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const userId = params.get("userId")

    const fetchDataForUser = async (id: string) => {
      try {
        setLoading(true)
        setError(null)
        const apiUrl = `https://dashboard-backend-7vgh.onrender.com/api/dashboard/${id}`
        const apiKey = process.env.NEXT_PUBLIC_API_KEY
        if (!apiKey) throw new Error("API Key is not configured.")

        const response = await fetch(apiUrl, { headers: { "x-api-key": apiKey } })
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Error: ${response.status}`);
        }
        
        const result: DashboardData = await response.json()
        setData(result)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (userId && userId !== "null" && userId !== "undefined") {
      fetchDataForUser(userId)
    } else {
      setError("שגיאה: מזהה לקוח לא נמצא בכתובת. אנא ודא שאתה מתחבר דרך המערכת המרכזית.")
      setLoading(false)
    }
  }, [])

  if (loading) return (
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

  if (!data) return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center text-xl">לא נמצאו נתונים להצגה.</div>
  )

  return (
    <div className="min-h-screen bg-slate-900 text-slate-300 font-sans p-4 sm:p-6 lg:p-8" dir="rtl">
      <div className="relative z-10 max-w-screen-2xl mx-auto">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white">תקציר מנהלים</h1>
            <p className="text-slate-400 mt-1">תמונת מצב פיננסית של העסק</p>
          </div>
          <a href="https://gilfinnas.com/" className="mt-4 sm:mt-0 bg-slate-700 hover:bg-slate-600 text-white font-semibold px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-lg transition-colors duration-200">
            <span>מעבר לתזרים המלא</span>
            <ArrowLeft className="w-4 h-4" />
          </a>
        </header>

        <main className="grid grid-cols-12 gap-6">
          {/* KPIs */}
          <div className="col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <KpiCard title="רווח נקי (שנתי)" value={`₪${data.kpi.ytdNetProfit.toLocaleString()}`} icon={<TrendingUp size={28} />} color="bg-green-500/20 text-green-400" />
            <KpiCard title="סה״כ הכנסות (שנתי)" value={`₪${data.kpi.ytdIncome.toLocaleString()}`} icon={<DollarSign size={28} />} color="bg-cyan-500/20 text-cyan-400" />
            <KpiCard title="סה״כ הוצאות (שנתי)" value={`₪${data.kpi.ytdExpense.toLocaleString()}`} icon={<Briefcase size={28} />} color="bg-amber-500/20 text-amber-400" />
            <KpiCard title="סה״כ תנועות" value={data.kpi.totalTransactions.toLocaleString()} icon={<BarChart2 size={28} />} color="bg-indigo-500/20 text-indigo-400" />
          </div>

          {/* Main Charts */}
          <ChartCard title="הכנסות מול הוצאות" className="col-span-12 lg:col-span-8">
            <ResponsiveContainer width="100%" height={300}>
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

          <ChartCard title="הרכב הוצאות (שנתי)" className="col-span-12 lg:col-span-4">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={data.charts.expenseComposition} cx="50%" cy="50%" innerRadius={70} outerRadius={110} dataKey="value" paddingAngle={3}>
                  {data.charts.expenseComposition.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke={'#1e293b'} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" formatter={(value) => <span className="text-slate-300 text-sm">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
          
          {/* Trend Chart & Transactions */}
          <ChartCard title="מגמת רווח נקי (6 חודשים)" className="col-span-12 lg:col-span-7">
             <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data.charts.netProfitTrend} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.7}/>
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                    <XAxis dataKey="name" tick={{ fill: "#94a3b8" }} fontSize={12}/>
                    <YAxis tick={{ fill: "#94a3b8" }} fontSize={12} tickFormatter={(value) => `₪${value / 1000}k`}/>
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="רווח נקי" stroke="#22c55e" fillOpacity={1} fill="url(#colorProfit)" />
                </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <div className="col-span-12 lg:col-span-5 bg-slate-800/60 p-6 rounded-xl border border-slate-700">
             <h3 className="text-lg font-semibold text-white mb-4">תנועות אחרונות</h3>
             <div className="flow-root">
                <ul role="list" className="-my-3 divide-y divide-slate-700">
                  {data.recentTransactions.map((tx) => (
                    <li key={tx.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {tx.type === 'inflow' 
                          ? <PlusCircle className="w-5 h-5 text-green-500" /> 
                          : <MinusCircle className="w-5 h-5 text-red-500" />
                        }
                        <div>
                          <p className="text-sm font-medium text-slate-200 truncate">{tx.description}</p>
                          <p className="text-xs text-slate-400">{new Date(tx.date).toLocaleDateString('he-IL')}</p>
                        </div>
                      </div>
                      <p className={`text-sm font-bold whitespace-nowrap ${tx.type === "inflow" ? "text-green-400" : "text-red-400"}`}>
                        {tx.type === "inflow" ? "+" : "-"}₪{Math.abs(tx.amount).toLocaleString()}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
          </div>
        </main>
      </div>
    </div>
  )
}
