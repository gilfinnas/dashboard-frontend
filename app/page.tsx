"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { ArrowRight, TrendingUp, TrendingDown, Scale, ArrowLeft } from "lucide-react"

// --- Type Definitions for our new data structure ---
interface DashboardData {
  mainMetrics: {
    currentMonthIncome: number
    currentMonthExpense: number
    currentMonthBalance: number
    incomeChange: number
    expenseChange: number
    balanceChange: number
  }
  monthlyComparisonData: { name: string; הכנסות: number; הוצאות: number }[]
  expenseByCategoryData: { name: string; value: number; color: string }[]
  recentTransactions: { id: string; description: string; amount: number; type: "inflow" | "outflow" }[]
}

// --- Helper Components ---
type MetricCardProps = {
  title: string
  value: number
  change: number
  icon: React.ReactNode
  prefix?: string
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, icon, prefix = "₪" }) => {
  const isPositive = change >= 0
  const isNeutral = title === "סה״כ הוצאות"
  const changeColor = isNeutral ? (isPositive ? "text-red-400" : "text-green-400") : (isPositive ? "text-green-400" : "text-red-400")
  const ChangeIcon = isPositive ? TrendingUp : TrendingDown

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl border border-white/10 shadow-lg transition-all duration-300 hover:border-sky-400/50 hover:scale-105">
      <div className="flex items-center justify-between mb-4">
        <span className="text-gray-300 text-lg font-medium">{title}</span>
        <div className="text-gray-500">{icon}</div>
      </div>
      <p className="text-4xl font-bold text-white mb-2">
        {prefix}
        {value.toLocaleString()}
      </p>
      <div className={`flex items-center text-sm ${changeColor}`}>
        <ChangeIcon className="w-4 h-4 ml-1" />
        <span>{Math.abs(change)}% לעומת חודש קודם</span>
      </div>
    </div>
  )
}

type ChartCardProps = {
  title: string
  children: React.ReactNode
}

const ChartCard: React.FC<ChartCardProps> = ({ title, children }) => (
  <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl border border-white/10 shadow-lg h-full flex flex-col">
    <h3 className="text-xl font-semibold text-white mb-6">{title}</h3>
    <div className="flex-grow">{children}</div>
  </div>
)

// --- Custom Tooltip for Charts ---
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900/80 backdrop-blur-sm p-4 rounded-lg border border-white/20 shadow-xl">
        <p className="label text-lg font-bold text-sky-300">{`${label}`}</p>
        {payload.map((pld: any) => (
          <p key={pld.dataKey} style={{ color: pld.color }}>
            {`${pld.name}: ₪${pld.value.toLocaleString()}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};


// --- Main App Component ---
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
        
        if (!apiKey) {
          throw new Error("API Key is not configured.")
        }

        const response = await fetch(apiUrl, {
          headers: { "x-api-key": apiKey },
        })

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Error: ${response.status}`);
        }
        
        const result: DashboardData = await response.json()
        setData(result)
      } catch (err: any) {
        console.error("An error occurred during the fetch process:", err);
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (userId && userId !== "null" && userId !== "undefined") {
      fetchDataForUser(userId)
    } else {
      const errorMessage = "שגיאה: מזהה לקוח לא נמצא בכתובת. אנא ודא שאתה מתחבר דרך המערכת המרכזית."
      setError(errorMessage)
      setLoading(false)
    }
  }, [])

  if (loading)
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center text-2xl font-semibold">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-sky-400"></div>
        <span className="mr-4">טוען נתונים...</span>
      </div>
    )
  if (error)
    return (
      <div className="min-h-screen bg-gray-900 text-red-400 flex flex-col items-center justify-center text-xl p-8 text-center">
        <h2 className="text-3xl font-bold mb-4">אופס, אירעה שגיאה</h2>
        <p>{error}</p>
        <a
            href={`https://gilfinnas.com/ai.html`}
            className="mt-6 bg-sky-500 hover:bg-sky-600 text-white font-semibold px-6 py-3 rounded-lg flex items-center gap-2 shadow-lg"
          >
            <span>חזרה למערכת הראשית</span>
            <ArrowLeft className="w-5 h-5" />
        </a>
      </div>
    )
  if (!data)
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center text-2xl">
        לא נמצאו נתונים להצגה.
      </div>
    )

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans p-4 sm:p-6 lg:p-8" dir="rtl">
      <div
        className="absolute inset-0 z-0 opacity-25"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, #1e40af 0%, transparent 30%), radial-gradient(circle at 80% 90%, #5b21b6 0%, transparent 30%)",
        }}
      />
      <div className="relative z-10 max-w-7xl mx-auto">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl font-extrabold text-white">דשבורד ניהולי</h1>
            <p className="text-gray-400 mt-2">סיכום הפעילות העסקית שלך בזמן אמת</p>
          </div>
          <a
            href={`https://gilfinnas.com/ai.html`}
            className="mt-4 sm:mt-0 bg-sky-500 hover:bg-sky-600 text-white font-semibold px-6 py-3 rounded-lg flex items-center gap-2 shadow-lg transition-transform duration-200 hover:scale-105"
          >
            <span>מעבר לתזרים המלא</span>
            <ArrowLeft className="w-5 h-5" />
          </a>
        </header>

        <main className="grid grid-cols-1 gap-6">
          {/* KPI Cards Section */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              title="סה״כ הכנסות (חודשי)"
              value={data.mainMetrics.currentMonthIncome}
              change={data.mainMetrics.incomeChange}
              icon={<TrendingUp className="w-7 h-7" />}
            />
            <MetricCard
              title="סה״כ הוצאות (חודשי)"
              value={data.mainMetrics.currentMonthExpense}
              change={data.mainMetrics.expenseChange}
              icon={<TrendingDown className="w-7 h-7" />}
            />
            <MetricCard
              title="מאזן (חודשי)"
              value={data.mainMetrics.currentMonthBalance}
              change={data.mainMetrics.balanceChange}
              icon={<Scale className="w-7 h-7" />}
            />
          </section>

          {/* Charts Section */}
          <section className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-4">
            <div className="lg:col-span-3">
              <ChartCard title="מאזן חודשי (6 חודשים אחרונים)">
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={data.monthlyComparisonData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                    <XAxis dataKey="name" tick={{ fill: "#9ca3af" }} />
                    <YAxis tick={{ fill: "#9ca3af" }} tickFormatter={(value) => `₪${value / 1000}k`} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(14, 165, 233, 0.1)' }} />
                    <Legend wrapperStyle={{ color: '#e5e7eb' }} />
                    <Bar dataKey="הכנסות" fill="#0ea5e9" name="הכנסות" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="הוצאות" fill="#f43f5e" name="הוצאות" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
            <div className="lg:col-span-2">
              <ChartCard title="הרכב הוצאות">
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={data.expenseByCategoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={120}
                      innerRadius={70}
                      fill="#8884d8"
                      dataKey="value"
                      paddingAngle={3}
                    >
                      {data.expenseByCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke={'#1f2937'} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" formatter={(value) => <span className="text-gray-300">{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </section>

          {/* Recent Transactions Section */}
          <section className="mt-4">
             <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl border border-white/10 shadow-lg">
              <h3 className="text-xl font-semibold text-white mb-4">תנועות אחרונות</h3>
              <div className="flow-root">
                <ul role="list" className="-my-4 divide-y divide-white/10">
                  {data.recentTransactions.map((tx) => (
                    <li key={tx.id} className="py-4 flex items-center justify-between gap-4">
                      <p className="text-md font-medium text-gray-300 truncate">{tx.description}</p>
                      <p
                        className={`text-md font-bold whitespace-nowrap ${tx.type === "inflow" ? "text-green-400" : "text-red-400"}`}
                      >
                        {tx.type === "inflow" ? "+" : "-"}₪{Math.abs(tx.amount).toLocaleString()}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
