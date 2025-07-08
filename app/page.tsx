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
import { ArrowRight, TrendingUp, Users, DollarSign, Calendar } from "lucide-react"

// --- Type Definitions ---
interface DashboardData {
  mainMetrics: {
    totalRevenue: number
    revenueChange: number
    activeUsers: number
    usersChange: number
    avgMonthlyRevenue: number
    avgChange: number
  }
  monthlyRevenueData: { name: string; revenue: number }[]
  revenueByCategoryData: { name: string; value: number; color: string }[]
  recentTransactions: { id: string; company: string; amount: number; type: "inflow" | "outflow" }[]
}

// This new interface matches the complete response from our updated API
interface ApiResponse {
  dashboardData: DashboardData;
  availableYears: string[];
}

// --- Helper Components ---
type MetricCardProps = {
  title: string
  value: number
  change: number
  icon: React.ReactNode
  prefix?: string
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, icon, prefix = "" }) => {
  const isPositive = change >= 0
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl border border-white/10 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <span className="text-gray-400 text-lg">{title}</span>
        {icon}
      </div>
      <p className="text-4xl font-bold text-white mb-2">
        {prefix}
        {value.toLocaleString()}
      </p>
      <div className={`flex items-center text-sm ${isPositive ? "text-green-400" : "text-red-400"}`}>
        <TrendingUp className={`w-4 h-4 mr-1 ${!isPositive && "transform -scale-y-100"}`} />
        <span>{Math.abs(change)}% לעומת תקופה קודמת</span>
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
    <h3 className="text-xl font-semibold text-white mb-4">{title}</h3>
    <div className="flex-grow">{children}</div>
  </div>
)

// --- Main App Component ---
export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [availableYears, setAvailableYears] = useState<string[]>([])
  const [selectedYear, setSelectedYear] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Generic data fetching function
  const fetchData = async (userId: string, year?: string) => {
    setLoading(true)
    setError(null)
    
    const yearQuery = year ? `?year=${year}` : ''
    const apiUrl = `https://dashboard-backend-7vgh.onrender.com/api/dashboard/${userId}${yearQuery}`
    console.log(`Fetching from: ${apiUrl}`)

    try {
      const apiKey = process.env.NEXT_PUBLIC_API_KEY
      if (!apiKey) throw new Error("API Key is not configured.")

      const response = await fetch(apiUrl, { headers: { "x-api-key": apiKey } })
      if (!response.ok) {
          const errorText = await response.text();
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.error || `Request failed with status ${response.status}`);
      }
      
      const result: ApiResponse = await response.json()
      setData(result.dashboardData)
      return result // Return the full result for the initial load
    } catch (err: any) {
      console.error("Fetch error:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Effect for initial data load, runs only once on component mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const userId = params.get("userId")

    if (!userId || userId === "null" || userId === "undefined") {
      setError("שגיאה: מזהה לקוח לא נמצא בכתובת. אנא ודא שאתה מתחבר דרך המערכת המרכזית.")
      setLoading(false)
      return
    }

    const initialLoad = async () => {
      const result = await fetchData(userId)
      // After the first load, set the available years and select the most recent one
      if (result && result.availableYears.length > 0) {
        setAvailableYears(result.availableYears)
        setSelectedYear(result.availableYears[0])
      } else if (result) {
        // Handle case where user exists but has no data for any year
        setError("לא נמצאו נתונים שנתיים עבור משתמש זה.")
      }
    }

    initialLoad()
  }, []) // Empty dependency array ensures this runs only once

  // Handler for when the user selects a new year from the dropdown
  const handleYearChange = (newYear: string) => {
    const params = new URLSearchParams(window.location.search)
    const userId = params.get("userId")
    // Fetch new data only if the year has actually changed
    if (userId && newYear !== selectedYear) {
      setSelectedYear(newYear)
      fetchData(userId, newYear)
    }
  }

  // --- UI Components ---

  const YearSelector = () => (
    <div className="relative">
      <select
        value={selectedYear}
        onChange={(e) => handleYearChange(e.target.value)}
        disabled={loading || availableYears.length <= 1}
        className="bg-gray-700/80 border border-white/20 text-white font-semibold text-lg rounded-lg focus:ring-sky-500 focus:border-sky-500 block w-full pl-12 pr-4 py-2.5 appearance-none shadow-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {availableYears.length > 0 ? (
            availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))
        ) : (
            <option>טוען...</option>
        )}
      </select>
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
        <Calendar className="w-5 h-5 text-gray-400" />
      </div>
    </div>
  );

  if (loading && !data) return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center text-2xl">טוען נתונים...</div>
  if (error) return <div className="min-h-screen bg-gray-900 text-red-400 flex items-center justify-center text-2xl p-8 text-center">שגיאה: {error}</div>
  if (!data) return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center text-2xl">לא נמצאו נתונים להצגה.</div>

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans p-4 sm:p-6 lg:p-8">
      <div
        className="absolute inset-0 z-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 0, #38bdf8 0%, transparent 40%), radial-gradient(circle at 100% 100%, #8b5cf6 0%, transparent 35%)",
        }}
      />
      <div className="relative z-10">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold">סקירה כללית לשנת {selectedYear}</h1>
            <p className="text-gray-400 mt-1">ברוך הבא, זהו סיכום הפעילות העסקית שלך.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
            <YearSelector />
            <a
              href={`https://gilfinnas.com/ai.html?from_dashboard=true`}
              className="bg-sky-500 hover:bg-sky-600 text-white font-semibold px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-lg transition-transform duration-200 hover:scale-105"
            >
              <span>מעבר לתזרים המלא</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard title="סה״כ הכנסות (שנתי)" value={data.mainMetrics.totalRevenue} change={data.mainMetrics.revenueChange} prefix="₪" icon={<DollarSign className="w-6 h-6 text-gray-500" />} />
            <MetricCard title="סה״כ תנועות הכנסה" value={data.mainMetrics.activeUsers} change={data.mainMetrics.usersChange} icon={<Users className="w-6 h-6 text-gray-500" />} />
            <MetricCard title="הכנסה ממוצעת (חודשי)" value={data.mainMetrics.avgMonthlyRevenue} change={data.mainMetrics.avgChange} prefix="₪" icon={<TrendingUp className="w-6 h-6 text-gray-500" />} />
          </div>
          
          <div className="lg:col-span-2">
            <ChartCard title="הכנסות לפי חודש">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.monthlyRevenueData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                  <XAxis dataKey="name" tick={{ fill: "#9ca3af" }} />
                  <YAxis tick={{ fill: "#9ca3af" }} tickFormatter={(value) => `₪${Number(value) / 1000}k`} />
                  <Tooltip contentStyle={{ backgroundColor: "rgba(31, 41, 55, 0.8)", borderColor: "rgba(255, 255, 255, 0.2)", borderRadius: "0.75rem" }} labelStyle={{ color: "#f3f4f6" }} formatter={(value: number) => [value.toLocaleString(), "הכנסה"]}/>
                  <defs><linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8} /><stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.2} /></linearGradient></defs>
                  <Bar dataKey="revenue" name="הכנסה" fill="url(#colorUv)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <div>
            <ChartCard title="הכנסות לפי קטגוריה">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={data.revenueByCategoryData} cx="50%" cy="50%" labelLine={false} outerRadius={100} innerRadius={60} fill="#8884d8" dataKey="value" paddingAngle={5}>
                    {data.revenueByCategoryData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} stroke={entry.color} />))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "rgba(31, 41, 55, 0.8)", borderColor: "rgba(255, 255, 255, 0.2)", borderRadius: "0.75rem" }} formatter={(value: number, name: string) => [`₪${value.toLocaleString()}`, name]}/>
                  <Legend iconType="circle" formatter={(value) => <span className="text-gray-300">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl border border-white/10 shadow-lg">
              <h3 className="text-xl font-semibold text-white mb-4">5 התנועות האחרונות בשנה</h3>
              <div className="flow-root">
                <ul role="list" className="divide-y divide-white/10">
                  {data.recentTransactions.length > 0 ? (
                    data.recentTransactions.map((tx) => (
                        <li key={tx.id} className="py-4 flex items-center justify-between">
                          <p className="text-md font-medium text-gray-200">{tx.company}</p>
                          <p className={`text-md font-semibold ${tx.type === "inflow" ? "text-green-400" : "text-red-400"}`}>
                            {tx.type === "inflow" ? "+" : "-"}₪{Math.abs(tx.amount).toLocaleString()}
                          </p>
                        </li>
                    ))
                  ) : (
                    <li className="py-4 text-center text-gray-400">אין תנועות להצגה</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
