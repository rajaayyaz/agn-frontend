"use client"

import { useState, useEffect } from "react"
import {
  Download,
  ChevronLeft,
  ChevronRight,
  Users,
  Building2,
  FileText,
  Settings,
  LogOut,
  LayoutDashboard,
  Menu,
  Briefcase,
  GraduationCap,
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { getDashboardStats, getRecentActivity } from "../../Api/Service/apiService"
import ManageEmployees from "./dashboard/ManageEmployees"
import ManageCompanies from "./dashboard/ManageCompanies"
import HireRequests from "./dashboard/HireRequests"
import TutorDashboard from "./dashboard/TutorDashboard"
import SettingsPanel from "./dashboard/SettingsPanel"
import ManageJobs from "./dashboard/ManageJobs"

export default function AdminPanel() {
  const navigate = useNavigate()
  const [sidebarExpanded, setSidebarExpanded] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState("dashboard")
  const [toasts, setToasts] = useState([])
  const [dashboardStats, setDashboardStats] = useState({
    total_employees: 0,
    active_companies: 0,
    pending_requests: 0,
    cvs_processed: 0,
  })
  const [recentActivities, setRecentActivities] = useState([])
  const [loadingStats, setLoadingStats] = useState(true)
  const [loadingActivities, setLoadingActivities] = useState(true)

  const showToast = (type, text, duration = 4500) => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, type, text }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), duration)
  }

  // Fetch dashboard data on mount and when switching to dashboard
  useEffect(() => {
    if (activeSection === "dashboard") {
      fetchDashboardData()
    }
  }, [activeSection])

  // Scroll to top when section changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [activeSection])

  // Handle window resize and close mobile menu on larger screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setMobileMenuOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const fetchDashboardData = async () => {
    // Fetch stats
    setLoadingStats(true)
    try {
      const statsResponse = await getDashboardStats()
      if (statsResponse && statsResponse.ok) {
        setDashboardStats(statsResponse.stats)
      }
    } catch (error) {
      showToast("error", "Failed to load dashboard statistics")
    } finally {
      setLoadingStats(false)
    }

    // Fetch recent activity
    setLoadingActivities(true)
    try {
      const activityResponse = await getRecentActivity()
      if (activityResponse && activityResponse.ok) {
        setRecentActivities(activityResponse.activities || [])
      } else {
        setRecentActivities([])
      }
    } catch (error) {
      showToast("error", "Failed to load recent activity")
      setRecentActivities([])
    } finally {
      setLoadingActivities(false)
    }
  }

  const getActivityIcon = (type) => {
    switch (type) {
      case "employee":
        return { icon: Users, bgColor: "bg-blue-100", iconColor: "text-blue-600" }
      case "company":
        return { icon: Building2, bgColor: "bg-green-100", iconColor: "text-green-600" }
      case "hire_request":
  return { icon: FileText, bgColor: "bg-light", iconColor: "text-orange" }
      default:
        return { icon: FileText, bgColor: "bg-gray-100", iconColor: "text-gray-600" }
    }
  }

  const getActivityTitle = (type) => {
    switch (type) {
      case "employee":
        return "New employee added"
      case "company":
        return "Company registered"
      case "hire_request":
        return "Hire request received"
      default:
        return "Activity"
    }
  }

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return "Recently"

    // Parse the timestamp - if it doesn't have timezone info, treat it as UTC
    let date = new Date(timestamp)

    // If the timestamp doesn't include 'Z' or timezone offset, it's likely UTC from database
    // MySQL/TiDB returns timestamps without timezone indicator, so we need to parse as UTC
    if (!timestamp.includes("Z") && !timestamp.includes("+") && !timestamp.includes("-", 10)) {
      // Manually parse as UTC by adding 'Z'
      date = new Date(timestamp + "Z")
    }

    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const handleLogout = () => {
    localStorage.removeItem("agn_admin_user")
    localStorage.removeItem("agn_admin_authenticated")
    localStorage.removeItem("agn_auth_token")  // Clear JWT token
    showToast("success", "Logged out successfully")
    setTimeout(() => navigate("/"), 1000)
  }

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "employees", label: "Employees", icon: Users },
    { id: "companies", label: "Companies", icon: Building2 },
    { id: "jobs", label: "Jobs", icon: Briefcase },
    { id: "hire-requests", label: "Hire Requests", icon: FileText },
    { id: "tutor-dashboard", label: "Tutor Hiring", icon: GraduationCap },
    { id: "settings", label: "Settings", icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        ></div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-col w-full">
        {/* Top Navigation Bar */}
  <header className="bg-white shadow-md border-b-2 border-orange z-[70] w-full flex-shrink-0 fixed top-0 left-0 right-0">
          <div className="px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8 py-2 sm:py-3">
            {/* Main Header with Dashboard title and Admin badge */}
            <div className="flex items-center justify-between gap-2 w-full mb-2 sm:mb-3">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-black font-black text-sm sm:text-lg">A</span>
                </div>
                <div className="min-w-0">
                  <h1 className="text-sm sm:text-base md:text-xl lg:text-2xl font-black text-black truncate">
                    {menuItems.find((item) => item.id === activeSection)?.label || "Admin Panel"}
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">Welcome back, Administrator</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-orange rounded-full flex items-center justify-center">
                  <span className="text-black font-black text-xs sm:text-sm">AD</span>
                </div>
              </div>
            </div>

            {/* Navigation Menu - Horizontal scrollable */}
            <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-1 sm:pb-2 -mx-2 px-2 scrollbar-hide">
              {menuItems.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg font-bold text-xs sm:text-sm whitespace-nowrap transition-all flex-shrink-0 ${
                      activeSection === item.id
                        ? "bg-orange text-dark shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <Icon size={14} className="sm:w-4 sm:h-4 md:w-5 md:h-5" />
                    <span className="hidden sm:inline">{item.label}</span>
                    <span className="sm:hidden">{item.label.split(' ')[0]}</span>
                  </button>
                )
              })}
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg font-bold text-xs sm:text-sm whitespace-nowrap bg-red-500 text-white hover:bg-red-600 transition-all ml-auto flex-shrink-0"
              >
                <LogOut size={14} className="sm:w-4 sm:h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">Logout</span>
                <span className="sm:hidden">Exit</span>
              </button>
            </nav>
          </div>
        </header>

        {/* Content Area */}
        <main className="w-full min-h-screen pt-[120px] sm:pt-[140px] md:pt-[150px] pb-12">
          <div className="px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8">
          {activeSection === "dashboard" && (
            <div className="py-4">
              {/* Dashboard Overview */}
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-3 md:gap-4 lg:gap-6 mb-3 sm:mb-6 lg:mb-8">
                {/* Stats Cards */}
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg sm:rounded-xl md:rounded-2xl p-2 sm:p-4 md:p-5 lg:p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1">
                  <div className="flex items-center justify-between">
                    <Users size={14} className="opacity-90 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7" />
                    {loadingStats ? (
                      <div className="animate-spin rounded-full h-4 w-4 sm:h-6 sm:w-6 md:h-7 md:w-7 border-b-2 border-white"></div>
                    ) : (
                      <span className="text-base sm:text-2xl md:text-3xl font-black">{dashboardStats.total_employees}</span>
                    )}
                  </div>
                  <h3 className="text-[9px] leading-tight sm:text-sm font-medium opacity-90 mt-1">Total Employees</h3>
                </div>

                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg sm:rounded-xl md:rounded-2xl p-2 sm:p-4 md:p-5 lg:p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1">
                  <div className="flex items-center justify-between">
                    <Building2 size={14} className="opacity-90 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7" />
                    {loadingStats ? (
                      <div className="animate-spin rounded-full h-4 w-4 sm:h-6 sm:w-6 md:h-7 md:w-7 border-b-2 border-white"></div>
                    ) : (
                      <span className="text-base sm:text-2xl md:text-3xl font-black">{dashboardStats.active_companies}</span>
                    )}
                  </div>
                  <h3 className="text-[9px] leading-tight sm:text-sm font-medium opacity-90 mt-1">Active Companies</h3>
                </div>

                <div className="bg-gradient-to-br from-orange to-light rounded-lg sm:rounded-xl md:rounded-2xl p-2 sm:p-4 md:p-5 lg:p-6 text-black shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1">
                  <div className="flex items-center justify-between">
                    <FileText size={14} className="opacity-90 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7" />
                    {loadingStats ? (
                      <div className="animate-spin rounded-full h-4 w-4 sm:h-6 sm:w-6 md:h-7 md:w-7 border-b-2 border-black"></div>
                    ) : (
                      <span className="text-base sm:text-2xl md:text-3xl font-black">{dashboardStats.pending_requests}</span>
                    )}
                  </div>
                  <h3 className="text-[9px] leading-tight sm:text-sm font-medium opacity-90 mt-1">Pending Requests</h3>
                </div>

                <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-lg sm:rounded-xl md:rounded-2xl p-2 sm:p-4 md:p-5 lg:p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1">
                  <div className="flex items-center justify-between">
                    <Download size={14} className="opacity-90 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7" />
                    {loadingStats ? (
                      <div className="animate-spin rounded-full h-4 w-4 sm:h-6 sm:w-6 md:h-7 md:w-7 border-b-2 border-white"></div>
                    ) : (
                      <span className="text-base sm:text-2xl md:text-3xl font-black">{dashboardStats.cvs_processed}</span>
                    )}
                  </div>
                  <h3 className="text-[9px] leading-tight sm:text-sm font-medium opacity-90 mt-1">CVs Processed</h3>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 border-2 border-gray-300 shadow-lg hover:shadow-xl transition-all duration-300">
                  <h3 className="text-xl font-black text-black mb-4 flex items-center gap-2">
                    <div className="w-1 h-6 bg-orange rounded-full"></div>
                    Recent Activity
                  </h3>
                  {loadingActivities ? (
                    <div className="flex justify-center items-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange"></div>
                    </div>
                  ) : recentActivities.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-sm">No recent activity</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentActivities.map((activity, index) => {
                        const { icon: Icon, bgColor, iconColor } = getActivityIcon(activity.type)
                        return (
                          <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <div className={`w-10 h-10 ${bgColor} rounded-full flex items-center justify-center`}>
                              <Icon size={20} className={iconColor} />
                            </div>
                            <div className="flex-1">
                              <p className="font-bold text-sm">{getActivityTitle(activity.type)}</p>
                              <p className="text-xs text-gray-500">
                                {activity.name}
                                {activity.detail ? ` - ${activity.detail}` : ""}
                              </p>
                            </div>
                            <span className="text-xs text-gray-400">{formatTimeAgo(activity.timestamp)}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-2xl p-6 border-2 border-gray-300 shadow-lg hover:shadow-xl transition-all duration-300">
                  <h3 className="text-xl font-black text-black mb-4 flex items-center gap-2">
                    <div className="w-1 h-6 bg-orange rounded-full"></div>
                    Quick Actions
                  </h3>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <button
                      onClick={() => {
                        setActiveSection("employees")
                        setMobileMenuOpen(false)
                      }}
                      className="p-3 sm:p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all duration-300 text-left group hover:shadow-md transform hover:scale-105"
                    >
                      <Users size={20} className="text-blue-600 mb-2 group-hover:scale-110 transition-transform sm:w-6 sm:h-6" />
                      <p className="font-black text-xs sm:text-sm text-black">Add Employee</p>
                    </button>
                    <button
                      onClick={() => {
                        setActiveSection("companies")
                        setMobileMenuOpen(false)
                      }}
                      className="p-3 sm:p-4 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all duration-300 text-left group hover:shadow-md transform hover:scale-105"
                    >
                      <Building2
                        size={20}
                        className="text-emerald-600 mb-2 group-hover:scale-110 transition-transform sm:w-6 sm:h-6"
                      />
                      <p className="font-black text-xs sm:text-sm text-black">Add Company</p>
                    </button>
                    <button
                      onClick={() => {
                        setActiveSection("hire-requests")
                        setMobileMenuOpen(false)
                      }}
                      className="p-3 sm:p-4 bg-light hover:bg-light/90 rounded-xl transition-all duration-300 text-left group hover:shadow-md transform hover:scale-105"
                    >
                      <FileText size={20} className="text-orange mb-2 group-hover:scale-110 transition-transform sm:w-6 sm:h-6" />
                      <p className="font-black text-xs sm:text-sm text-black">View Requests</p>
                    </button>
                    <button
                      onClick={() => {
                        setActiveSection("settings")
                        setMobileMenuOpen(false)
                      }}
                      className="p-3 sm:p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-all duration-300 text-left group hover:shadow-md transform hover:scale-105"
                    >
                      <Settings size={20} className="text-purple-600 mb-2 group-hover:scale-110 transition-transform sm:w-6 sm:h-6" />
                      <p className="font-black text-xs sm:text-sm text-black">Settings</p>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === "employees" && <ManageEmployees />}

          {activeSection === "companies" && <ManageCompanies />}

          {activeSection === "jobs" && <ManageJobs />}

          {activeSection === "hire-requests" && <HireRequests />}

          {activeSection === "tutor-dashboard" && <TutorDashboard />}

          {activeSection === "settings" && <SettingsPanel />}
          </div>
        </main>
      </div>

      {/* Toast container */}
      <div aria-live="polite" className="fixed top-6 right-4 sm:right-6 z-50 flex flex-col gap-2 pointer-events-none max-w-[calc(100vw-2rem)] sm:max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`w-full px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white transform transition-all duration-200 pointer-events-auto ${
              t.type === "success" ? "bg-emerald-600" : t.type === "info" ? "bg-sky-600" : "bg-rose-600"
            }`}
          >
            {t.text}
          </div>
        ))}
      </div>
    </div>
  )
}
