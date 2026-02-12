"use client"

import { useState, useEffect } from "react"
import { Eye, EyeOff, ArrowRight, Phone, Mail, MapPin, Linkedin, Twitter, Check, BarChart2, Users, Briefcase, FileText, TrendingUp } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import NavBar from "../shared/NavBar"
import { employerLogin, adminLogin } from "../../Api/Service/apiService"

export default function AdminLogin() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navigate = useNavigate()

  // Redirect if already authenticated
  useEffect(() => {
    const adminAuth = localStorage.getItem('agn_admin_authenticated');
    const employerAuth = localStorage.getItem('agn_employer_authenticated');
    
    if (adminAuth === '1') {
      navigate('/admin/panel', { replace: true });
    } else if (employerAuth === '1') {
      navigate('/employer-dashboard', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    if (!username || !password) {
      setError("Please provide username and password")
      setLoading(false)
      return
    }

    try {
      // Try employer login first
      try {
        const res = await employerLogin(username, password)
        // employerLogin now returns { ok: true, employer_id, role }
        if (res && res.ok) {
          const role = (res.role || "").toLowerCase()
          if (role === "admin") {
            localStorage.setItem("agn_admin_user", username)
            localStorage.setItem("agn_admin_authenticated", "1")
            setSuccess(true)
            setTimeout(() => navigate("/admin/panel"), 300)
            return
          }

          // default to employer dashboard for non-admin roles
          localStorage.setItem("agn_employer_user", username)
          localStorage.setItem("agn_employer_authenticated", "1")
          localStorage.setItem("agn_employer_id", String(res.employer_id || ""))
          setSuccess(true)
          setTimeout(() => navigate("/employer-dashboard"), 300)
          return
        }
      } catch (e) {
        // employer login failed — fallthrough to admin check
      }

      // Try admin login
      try {
        const res2 = await adminLogin(username, password)
        if (res2 && res2.ok) {
          localStorage.setItem("agn_admin_user", username)
          localStorage.setItem("agn_admin_authenticated", "1")
          setSuccess(true)
          setTimeout(() => navigate("/admin/panel"), 300)
          return
        }
      } catch (e) {
        // both failed
      }

      setError("Invalid credentials or account role not recognized")
      setLoading(false)
    } catch (err) {
      setError("An error occurred. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Shared Navigation */}
      <NavBar />

      {/* Hero Section
      <section className="bg-orange pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        
        <div className="absolute top-20 right-10 w-48 h-48 bg-orange rounded-full opacity-50 blur-3xl"></div>
        <div className="absolute bottom-0 right-32 w-64 h-64 bg-orange rounded-full opacity-30 blur-3xl"></div>
        <div className="absolute -left-32 top-40 w-80 h-80 bg-orange rounded-full opacity-40 blur-3xl"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-black text-black leading-tight mb-4 text-balance">login Access</h1>
            <p className="text-lg text-black max-w-2xl mx-auto leading-relaxed font-medium">
              Secure login for AGN administrators to manage recruitment operations
            </p>
          </div>
        </div>
      </section> */}

      {/* Login Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="animate-fade-in-delay">
                <h2 className="text-4xl md:text-5xl font-black text-black mb-6 leading-tight text-balance">
                Manage Your <br />
                <span className="text-orange">Recruitment</span> <br />
                Operations
              </h2>
              <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                Access the admin dashboard to manage candidates, job postings, applications, and track recruitment
                metrics in real-time.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-light transition">
                  <div className="w-10 h-10 bg-orange rounded-full flex items-center justify-center flex-shrink-0 font-black text-black">
                    <Check size={18} className="text-black" />
                  </div>
                  <div>
                    <h3 className="font-black text-black mb-1">Candidate Management</h3>
                    <p className="text-sm text-gray-600">
                      View, filter, and manage all candidate profiles and applications
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-light transition">
                  <div className="w-10 h-10 bg-orange rounded-full flex items-center justify-center flex-shrink-0 font-black text-black">
                    <Briefcase size={18} className="text-black" />
                  </div>
                  <div>
                    <h3 className="font-black text-black mb-1">Job Postings</h3>
                    <p className="text-sm text-gray-600">
                      Create, edit, and manage active job listings across all levels
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-light transition">
                  <div className="w-10 h-10 bg-orange rounded-full flex items-center justify-center flex-shrink-0 font-black text-black">
                    <BarChart2 size={18} className="text-black" />
                  </div>
                  <div>
                    <h3 className="font-black text-black mb-1">Analytics & Reports</h3>
                    <p className="text-sm text-gray-600">
                      Track recruitment metrics and generate comprehensive reports
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Login Form */}
            <div className="animate-fade-in-delay-2">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 shadow-xl border-2 border-orange hover:shadow-2xl transition">
                <h3 className="text-2xl font-black text-black mb-6">Login</h3>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Username Field */}
                  <div>
                    <label className="block text-sm font-black text-black mb-2">Username</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your username"
                      className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-orange focus:outline-none transition bg-white font-medium"
                    />
                  </div>

                  {/* Password Field */}
                  <div>
                    <label className="block text-sm font-black text-black mb-2">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full px-4 py-3 pr-10 rounded-lg border-2 border-gray-300 focus:border-orange focus:outline-none transition bg-white font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute inset-y-0 right-4 flex items-center text-gray-600 hover:text-black transition"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                      <p className="text-sm font-bold text-red-600">{error}</p>
                    </div>
                  )}

                  {/* Success Message */}
                  {success && (
                    <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                      <p className="text-sm font-bold text-green-600">✓ Login successful! Redirecting...</p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    aria-busy={loading}
                    className={`w-full bg-black text-orange font-black py-3 rounded-lg transition flex items-center justify-center gap-2 group ${loading ? 'opacity-60 cursor-not-allowed' : 'hover:bg-gray-900 hover:shadow-lg'}`}
                  >
                    <span>Login to Dashboard</span>
                    {loading ? (
                      <span className="w-4 h-4 rounded-full border-2 border-t-orange border-gray-200 animate-spin" aria-hidden="true"></span>
                    ) : (
                      <ArrowRight size={20} className="group-hover:translate-x-1 transition" />
                    )}
                  </button>

                  {/* Prominent signup button (more visible than link below) */}
                  <Link
                    to="/employer-signup"
                    className="w-full inline-flex items-center justify-center gap-2 bg-orange text-black font-black py-3 rounded-lg transition hover:shadow-lg hover:scale-105"
                  >
                    Create Employer Account
                  </Link>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600 mb-2">
                    Don't have an account?{" "}
                    <Link
                      to="/employer-signup"
                      className="text-orange hover:text-dark font-black underline transition"
                    >
                      Sign Up Here
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black text-black mb-4 text-balance text-center">
            Admin Dashboard Features
          </h2>
          <p className="text-gray-600 mb-12 text-lg font-medium text-center max-w-2xl mx-auto">
            Comprehensive tools to manage your recruitment operations efficiently
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Real-time Analytics",
                description: "Monitor recruitment metrics, conversion rates, and performance indicators",
                icon: <BarChart2 size={36} className="text-orange" />,
              },
              {
                title: "Candidate Database",
                description: "Search, filter, and manage thousands of candidate profiles efficiently",
                icon: <Users size={36} className="text-orange" />,
              },
              {
                title: "Job Management",
                description: "Create, publish, and manage job postings across all career levels",
                icon: <Briefcase size={36} className="text-orange" />,
              },
              {
                title: "Application Tracking",
                description: "Track applications through each stage of the recruitment pipeline",
                icon: <FileText size={36} className="text-orange" />,
              },
              {
                title: "Team Collaboration",
                description: "Share notes, feedback, and collaborate with your recruitment team",
                icon: <Users size={36} className="text-orange" />,
              },
              {
                title: "Export & Reports",
                description: "Generate detailed reports and export data in multiple formats",
                icon: <TrendingUp size={36} className="text-orange" />,
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl p-8 border-2 border-gray-200 hover:border-orange hover:shadow-lg transition transform hover:-translate-y-1"
              >
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-black text-black mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section
  <section className="bg-orange py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black text-black mb-8 text-balance">Need Admin Access?</h2>
          <p className="text-black text-lg mb-8 max-w-2xl mx-auto font-medium">
            Contact our team to request administrator credentials for the recruitment dashboard
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="tel:01216511235"
              className="bg-black text-orange hover:bg-gray-900 font-black text-lg px-8 py-4 rounded-lg transition flex items-center justify-center gap-2 group"
            >
              <Phone size={20} />
              Call Us
            </a>
            <a
              href="mailto:agnjobbank123@gmail.com"
              className="border-2 border-black text-black hover:bg-black hover:text-orange font-black text-lg px-8 py-4 rounded-lg transition flex items-center justify-center gap-2 group"
            >
              <Mail size={20} />
              Email Us
            </a>
          </div>
        </div>
      </section> */}

      {/* Footer */}
      <footer className="bg-black text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div>
              <div className="w-12 h-12 bg-orange rounded-full flex items-center justify-center mb-4">
                <span className="text-black font-black text-lg">AGN</span>
              </div>
              <h3 className="text-xl font-black text-white mb-2">AGN job bank</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Specialists in financial recruitment, connecting talent with opportunity.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-black text-white mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/" className="text-gray-400 hover:text-orange transition font-medium">
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/apply" className="text-gray-400 hover:text-orange transition font-medium">
                    Apply
                  </Link>
                </li>
                <li>
                  <Link to="/hire" className="text-gray-400 hover:text-orange transition font-medium">
                    Hire
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="font-black text-white mb-4">Contact</h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-gray-400">
                  <Phone size={18} className="text-orange" />
                  <a href="tel:01216511235" className="hover:text-orange transition">
                    +92 3037774400
                  </a>
                </li>
                <li className="flex items-center gap-2 text-gray-400">
                  <Mail size={18} className="text-orange" />
                  <a href="mailto:agnjobbank123@gmail.com" className="hover:text-orange transition">
                    agnjobbank123@gmail.com
                  </a>
                </li>
                <li className="flex items-center gap-2 text-gray-400">
                  <MapPin size={18} className="text-orange" />
                  <span>Office #6, 2nd Floor, Sitara Plaza, Near Mediacom, Kohinoor Chowk, Faisalabad</span>
                </li>
              </ul>
            </div>

            {/* Social Links */}
            <div>
              <h4 className="font-black text-white mb-4">Follow Us</h4>
              <div className="flex gap-4">
                <a
                  href="#"
                  className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-orange hover:text-black transition"
                >
                  <Linkedin size={20} />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-orange hover:text-black transition"
                >
                  <Twitter size={20} />
                </a>
              </div>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-gray-400 text-sm">© 2025 AGN job bank Recruitment. All rights reserved.</p>
              <div className="flex gap-6">
                <a href="#" className="text-gray-400 hover:text-orange transition text-sm font-medium">
                  Privacy Policy
                </a>
                <a href="#" className="text-gray-400 hover:text-orange transition text-sm font-medium">
                  Terms of Service
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
