"use client"

import {
  ArrowRight,
  Phone,
  Mail,
  Linkedin,
  Twitter,
  CheckCircle,
  Users,
  Briefcase,
  TrendingUp,
  GraduationCap,
  BarChart3,
  Crown,
  Building2,
} from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import "./globals.css"
import NavBar from "../shared/NavBar"
import { employerSignup } from "../../Api/Service/apiService"

export default function HirePage() {
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    company_name: "",
    email: "",
    password: "",
    phone: "",
    location: "",
    referance: "",
  })
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [sideImage, setSideImage] = useState(null)
  const STATIC_SIDE_IMAGE = "/images/Hire_side.jpg"

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSideImage = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setSideImage(ev.target.result)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSubmitted(false)
    setLoading(true)

    try {
      const result = await employerSignup({
        username: formData.username,
        company_name: formData.company_name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        location: formData.location,
        referance: formData.referance,
      })

      if (result.ok) {
        setSubmitted(true)
  setFormData({ username: "", company_name: "", email: "", password: "", phone: "", location: "", referance: "" })
        
        // Redirect to login page after 2 seconds
        setTimeout(() => {
          navigate('/hire')
        }, 2000)
      } else {
        setError(result.error || "Registration failed")
      }
    } catch (err) {
      setError(err.message || "An error occurred during registration")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Shared Navigation */}
      <NavBar />

      {/* Hero Section */}
  <section className="bg-gradient-to-br from-orange via-orange to-light pt-32 pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          <div className="absolute top-20 right-10 w-48 h-48 bg-orange/30 rounded-full opacity-40 blur-3xl animate-float"></div>
        <div
          className="absolute bottom-0 right-32 w-64 h-64 bg-orange-300 rounded-full opacity-30 blur-3xl animate-float"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-40 left-20 w-40 h-40 bg-light rounded-full opacity-30 blur-3xl animate-float"
          style={{ animationDelay: "2s" }}
        ></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <h1 className="text-5xl md:text-7xl font-black text-black leading-tight mb-6 text-balance animate-fade-in">
            Hire with AGN job bank
          </h1>
          <p className="text-lg md:text-xl text-black mb-8 max-w-2xl leading-relaxed font-medium animate-fade-in-delay">
            Find exceptional finance professionals to drive your business forward. Post roles, review candidates, and
            build your dream team.
          </p>
        </div>
      </section>

      {/* Registration Form Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white relative">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          <div className="hidden md:flex items-center justify-center animate-slide-in-left md:mt-8">
            <div className="hire-side w-full h-96 rounded-3xl overflow-hidden flex items-center justify-center">
              <img
                src={STATIC_SIDE_IMAGE}
                alt="Hire side"
                className="object-cover w-full h-full"
                onError={(e) => {
                  e.currentTarget.style.display = "none"
                }}
              />
            </div>
          </div>

          {/* Form column */}
          <div className="w-full animate-slide-in-right">
            <div className="mx-auto md:ml-auto md:w-11/12 lg:w-3/4">
              <div className="text-center mb-8 animate-fade-in">
                <h2 className="text-4xl md:text-5xl font-black text-black mb-4 text-balance">Get Started Today</h2>
                <p className="text-gray-600 text-lg font-medium">
                  Create your employer account and start hiring top finance talent
                </p>
              </div>

              {submitted && (
                <div className="mb-8 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 rounded-2xl p-6 flex items-start gap-4 animate-scale-in shadow-lg">
                  <div className="w-8 h-8 bg-green-400 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white font-black">✓</span>
                  </div>
                  <div>
                    <h3 className="font-black text-green-900 text-lg mb-1">Employer Registered!</h3>
                    <p className="text-green-800">
                      Account created successfully! Redirecting to login page...
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <div className="mb-8 bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-400 rounded-2xl p-6 flex items-start gap-4 animate-scale-in shadow-lg">
                  <div className="w-8 h-8 bg-red-400 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white font-black">✕</span>
                  </div>
                  <div>
                    <h3 className="font-black text-red-900 text-lg mb-1">Registration Failed</h3>
                    <p className="text-red-800">{error}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in-delay-2">
                <div className="bg-white rounded-3xl p-8 border-2 border-gray-200 shadow-md hover:shadow-xl transition-smooth-lg">
                  <h3 className="text-2xl font-black text-black mb-6">Employer Details</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="stagger-item">
                      <label className="block text-sm font-black text-black mb-3">Username *</label>
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                        disabled={loading}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange focus:outline-none transition-smooth focus:shadow-lg focus:ring-2 focus:ring-orange"
                      />
                    </div>
                    <div className="stagger-item">
                      <label className="block text-sm font-black text-black mb-3">Company Name</label>
                      <input
                        type="text"
                        name="company_name"
                        value={formData.company_name}
                        onChange={handleChange}
                        disabled={loading}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange focus:outline-none transition-smooth focus:shadow-lg focus:ring-2 focus:ring-orange"
                      />
                    </div>
                    <div className="stagger-item">
                      <label className="block text-sm font-black text-black mb-3">Email *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        disabled={loading}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange focus:outline-none transition-smooth focus:shadow-lg focus:ring-2 focus:ring-orange"
                      />
                    </div>
                    <div className="stagger-item">
                      <label className="block text-sm font-black text-black mb-3">Password *</label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        maxLength={15}
                        disabled={loading}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange focus:outline-none transition-smooth focus:shadow-lg focus:ring-2 focus:ring-orange"
                      />
                    </div>
                    <div className="stagger-item">
                      <label className="block text-sm font-black text-black mb-3">Phone</label>
                      <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        disabled={loading}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange focus:outline-none transition-smooth focus:shadow-lg focus:ring-2 focus:ring-orange"
                      />
                    </div>
                    <div className="stagger-item">
                      <label className="block text-sm font-black text-black mb-3">Location</label>
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        disabled={loading}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange focus:outline-none transition-smooth focus:shadow-lg focus:ring-2 focus:ring-orange"
                      />
                    </div>
                    <div className="stagger-item">
                      <label className="block text-sm font-black text-black mb-3">Reference</label>
                      <input
                        type="text"
                        name="referance"
                        value={formData.referance}
                        onChange={handleChange}
                        disabled={loading}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange focus:outline-none transition-smooth focus:shadow-lg focus:ring-2 focus:ring-orange"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    aria-busy={loading}
                    className={`flex-1 font-black text-lg px-8 py-4 rounded-xl transition-smooth transform ${loading ? 'bg-gray-400 text-gray-800 cursor-not-allowed' : 'bg-black text-orange hover:bg-gray-900 active:scale-95 shadow-lg hover:shadow-xl hover:scale-105'}`}
                  >
                    {loading ? (
                      <span className="inline-flex items-center gap-3">
                        <span className="w-4 h-4 rounded-full border-2 border-t-orange border-gray-200 animate-spin" aria-hidden="true" />
                        Creating...
                      </span>
                    ) : (
                      <>
                        Create Employer Account <ArrowRight className="ml-2 inline" size={20} />
                      </>
                    )}
                  </button>
                  <a
                    href="/"
                    className="flex-1 border-2 border-black text-black hover:bg-black hover:text-orange font-black text-lg px-8 py-4 rounded-xl bg-white transition-smooth text-center shadow-md hover:shadow-lg"
                  >
                    Back Home
                  </a>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Why Hire With Us Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16 animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-black text-black mb-4 text-balance">Why Hire With Us?</h2>
            <p className="text-gray-600 text-lg font-medium">
              Access a curated network of finance professionals ready to make an impact
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Users size={28} />,
                title: "Vetted Talent Pool",
                description: "All candidates are thoroughly screened and verified for qualifications and experience",
              },
              {
                icon: <TrendingUp size={28} />,
                title: "Quick Placements",
                description: "Average time to hire reduced by 60% with our streamlined recruitment process",
              },
              {
                icon: <Briefcase size={28} />,
                title: "Flexible Solutions",
                description: "Permanent, contract, interim, or executive search - we have the right fit for you",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="stagger-item bg-white rounded-3xl p-8 border-2 border-gray-200 hover:border-orange hover:shadow-xl transition-smooth-lg hover:scale-105 group"
              >
                  <div className="w-16 h-16 bg-gradient-to-br from-light to-light rounded-2xl flex items-center justify-center mb-6 transition-smooth-lg group-hover:scale-110 group-hover:shadow-lg">
                  <div className="text-orange transition-smooth">{item.icon}</div>
                </div>
                <h3 className="text-xl font-black text-black mb-3">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Agency Section */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
  <div className="absolute top-20 right-10 w-96 h-96 bg-orange rounded-full opacity-5 blur-3xl"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="animate-slide-in-left">
              <h2 className="text-5xl md:text-6xl font-black mb-6 leading-tight text-balance">
                About Mitchell <br />
                Adam<span className="text-orange">.</span>
              </h2>
              <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                With over a decade of experience in financial recruitment, AGN job bank has built a reputation for
                excellence, integrity, and results. We understand the unique challenges of hiring finance professionals
                and have the expertise to deliver.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  "10+ years in finance recruitment",
                  "500+ successful placements",
                  "98% client satisfaction rate",
                  "24/7 dedicated support",
                ].map((item, idx) => (
                  <li key={idx} className="stagger-item flex items-center gap-3 group">
                    <div className="w-6 h-6 bg-orange/20 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-orange/40 transition-smooth">
                      <CheckCircle
                        size={18}
                        className="text-orange flex-shrink-0 group-hover:scale-110 transition-smooth"
                      />
                    </div>
                    <span className="text-gray-300 group-hover:text-white transition-smooth">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="animate-slide-in-right">
              <div className="bg-gradient-to-br from-gray-700 to-gray-900 rounded-3xl h-96 flex items-center justify-center overflow-hidden relative shadow-2xl group hover:shadow-orange/20 transition-smooth-lg">
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                <div className="w-24 h-24 bg-gradient-to-br from-orange/30 to-light/20 rounded-3xl flex items-center justify-center relative z-10 group-hover:scale-110 transition-smooth group-hover:from-orange/50 group-hover:to-light/40">
                  <Building2 size={56} className="text-orange" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Clients Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16 animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-black text-black mb-4 text-balance">Our Clients</h2>
            <p className="text-gray-600 text-lg font-medium">
              We partner with leading companies across diverse industries
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                industry: "Financial Services",
                description: "Banks, investment firms, and fintech companies seeking top finance talent",
              },
              {
                industry: "Corporate Finance",
                description: "Large enterprises requiring experienced finance professionals and controllers",
              },
              {
                industry: "Accounting Firms",
                description: "Big 4 and mid-tier firms looking for qualified accountants and auditors",
              },
              {
                industry: "Tech & Startups",
                description: "Growing companies needing finance expertise to scale operations",
              },
            ].map((client, idx) => (
              <div
                key={idx}
                className="stagger-item bg-white rounded-3xl p-8 border-2 border-gray-200 hover:border-orange hover:shadow-xl transition-smooth-lg hover:scale-105"
              >
                <h3 className="text-2xl font-black text-black mb-3">{client.industry}</h3>
                <p className="text-gray-600 leading-relaxed">{client.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Available Jobs Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16 animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-black text-black mb-4 text-balance">Available Job Levels</h2>
            <p className="text-gray-600 text-lg font-medium">We recruit across all career stages and specializations</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Entry Level & Graduate",
                roles: ["Graduate Accountants", "Junior Finance Analysts", "Finance Administrators"],
                icon: <GraduationCap size={32} />,
                bgColor: "from-blue-100 to-cyan-100",
                iconColor: "text-blue-600",
              },
              {
                title: "Mid-Level Professionals",
                roles: ["Senior Accountants", "Finance Managers", "Management Accountants"],
                icon: <BarChart3 size={32} />,
                bgColor: "from-purple-100 to-pink-100",
                iconColor: "text-purple-600",
              },
              {
                title: "Senior & Executive",
                roles: ["Finance Directors", "CFOs", "Finance Controllers"],
                icon: <Crown size={32} />,
                bgColor: "from-light to-orange/30",
                iconColor: "text-orange",
              },
            ].map((level, idx) => (
              <div
                key={idx}
                className="stagger-item bg-gradient-to-br from-gray-50 to-white rounded-3xl p-8 border-2 border-gray-200 hover:border-orange hover:shadow-xl transition-smooth-lg hover:scale-105 group"
              >
                <div
                  className={`w-16 h-16 bg-gradient-to-br ${level.bgColor} rounded-2xl flex items-center justify-center mb-6 group-hover:shadow-lg transition-smooth-lg group-hover:scale-110`}
                >
                  <div className={`${level.iconColor} group-hover:scale-110 transition-smooth`}>{level.icon}</div>
                </div>
                <h3 className="text-xl font-black text-black mb-4">{level.title}</h3>
                <ul className="space-y-3">
                  {level.roles.map((role, i) => (
                    <li
                      key={i}
                      className="text-gray-600 flex items-center gap-3 group/item hover:text-black transition-smooth"
                    >
                      <span className="w-2 h-2 bg-orange rounded-full group-hover/item:scale-150 transition-smooth"></span>
                      {role}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
  <section className="bg-gradient-to-r from-orange via-orange to-light py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 bg-orange/60 rounded-full blur-3xl animate-float"></div>
          <div
            className="absolute bottom-10 right-10 w-40 h-40 bg-orange-400 rounded-full blur-3xl animate-float"
            style={{ animationDelay: "1.5s" }}
          ></div>
        </div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-black text-black mb-8 text-balance animate-fade-in">
            Ready to find your next hire?
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-delay">
            <button
              type="button"
              className="bg-black text-orange hover:bg-gray-900 font-black text-lg px-8 py-4 rounded-xl transition-smooth inline-flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
            >
              Post a Job <ArrowRight className="ml-2" size={20} />
            </button>
            <button
              type="button"
              className="border-2 border-black text-black hover:bg-black hover:text-orange font-black text-lg px-8 py-4 bg-transparent rounded-xl transition-smooth inline-flex items-center justify-center shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
            >
              Browse Candidates <ArrowRight className="ml-2" size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="animate-fade-in-up">
              <div className="w-12 h-12 bg-orange rounded-full flex items-center justify-center mb-4 hover:scale-110 transition-smooth">
                <span className="text-black font-black text-lg">AGN</span>
              </div>
              <h3 className="text-xl font-black text-white mb-2">AGN job bank</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Specialists in financial recruitment, connecting talent with opportunity.
              </p>
            </div>

            <div className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              <h4 className="font-black text-white mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <a href="/" className="text-gray-400 hover:text-orange transition-smooth font-medium">
                    Home
                  </a>
                </li>
                <li>
                  <a href="/apply" className="text-gray-400 hover:text-orange transition-smooth font-medium">
                    Apply
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-orange transition-smooth font-medium">
                    Services
                  </a>
                </li>
              </ul>
            </div>

            <div className="animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              <h4 className="font-black text-white mb-4">Contact</h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-gray-400 hover:text-orange transition-smooth group">
                  <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center group-hover:bg-orange transition-smooth">
                    <Phone size={16} className="text-orange group-hover:text-black transition-smooth" />
                  </div>
                  <a href="tel:01216511235">+92 3037774400</a>
                </li>
                <li className="flex items-center gap-2 text-gray-400 hover:text-orange transition-smooth group">
                  <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center group-hover:bg-orange transition-smooth">
                    <Mail size={16} className="text-orange group-hover:text-black transition-smooth" />
                  </div>
                  <a href="mailto:agnjobbank123@gmail.com">agnjobbank123@gmail.com</a>
                </li>
              </ul>
            </div>

            <div className="animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
              <h4 className="font-black text-white mb-4">Follow Us</h4>
              <div className="flex gap-4">
                <a
                  href="#"
                  className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-orange hover:text-black transition-smooth hover:scale-110 active:scale-95 group"
                >
                  <Linkedin size={20} className="group-hover:scale-110 transition-smooth" />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-orange hover:text-black transition-smooth hover:scale-110 active:scale-95 group"
                >
                  <Twitter size={20} className="group-hover:scale-110 transition-smooth" />
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8">
            <p className="text-gray-400 text-sm">© 2025 AGN job bank Recruitment. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
