"use client"

import { useState, useEffect } from "react"
import { GraduationCap, Send, X, CheckCircle, AlertCircle, Search, MapPin, BookOpen, Mail, Phone } from "lucide-react"
import NavBar from "../shared/NavBar"
import CONFIG from "../../Api/Config/config"

export default function TutorHirePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showResultModal, setShowResultModal] = useState(false)
  const [resultType, setResultType] = useState(null)
  const [resultMessage, setResultMessage] = useState("")
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [allTeachers, setAllTeachers] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loadingTeachers, setLoadingTeachers] = useState(true)
  const [formData, setFormData] = useState({
    requester_name: "",
    requester_email: "",
    requester_phone: "",
    requester_company: "",
    subject: "",
    message: "",
    preferred_teacher_field: "",
    preferred_experience: "",
    location: "",
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchTeachers()
  }, [])

  const fetchTeachers = async () => {
    setLoadingTeachers(true)
    try {
      const response = await fetch(`${CONFIG.BASE_URL}/api/employees/teachers`)
      const data = await response.json()
      
      if (data && data.ok) {
        setAllTeachers(data.rows || [])
      }
    } catch (error) {
      // Silent fail
    } finally {
      setLoadingTeachers(false)
    }
  }

  const filteredTeachers = allTeachers.filter((teacher) => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      (teacher.name || "").toLowerCase().includes(query) ||
      (teacher.field || "").toLowerCase().includes(query) ||
      (teacher.location || "").toLowerCase().includes(query) ||
      (teacher.experience || "").toLowerCase().includes(query) ||
      (teacher.subjects || "").toLowerCase().includes(query)
    )
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setIsLoading(true)

    if (!formData.requester_name || !formData.requester_email || !formData.message) {
      setResultType("error")
      setResultMessage("Please fill in all required fields (Name, Email, Message)")
      setShowResultModal(true)
      setIsLoading(false)
      return
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000)

    fetch(`${CONFIG.BASE_URL}/api/tutor-request`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
      signal: controller.signal,
    })
      .then((r) => {
        clearTimeout(timeoutId)
        return r.json()
      })
      .then((j) => {
        if (j.ok) {
          setResultType("success")
          setResultMessage(
            "Your tutor hire request has been submitted successfully! Our team will review your requirements and get back to you soon."
          )
          setShowResultModal(true)
          setFormData({
            requester_name: "",
            requester_email: "",
            requester_phone: "",
            requester_company: "",
            subject: "",
            message: "",
            preferred_teacher_field: "",
            preferred_experience: "",
            location: "",
          })
        } else {
          setResultType("error")
          setResultMessage(j.error || "Failed to submit request. Please try again.")
          setShowResultModal(true)
        }
      })
      .catch((err) => {
        clearTimeout(timeoutId)
        if (err.name === "AbortError") {
          setResultType("error")
          setResultMessage("Request timed out. Please try again.")
        } else {
          setResultType("error")
          setResultMessage(`Error: ${err.message}`)
        }
        setShowResultModal(true)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  const closeResultModal = () => {
    setShowResultModal(false)
  }

  return (
    <div className="min-h-screen bg-light">
      <NavBar />

      <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header with gradient background */}
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 sm:p-12 mb-8 shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange rounded-full opacity-10 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange rounded-full opacity-10 blur-3xl"></div>
            
            <div className="relative z-10 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange to-orange/80 rounded-2xl mb-6 shadow-lg transform hover:scale-110 transition-transform duration-300">
                <GraduationCap size={40} className="text-white" />
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 leading-tight">
                Find Your Perfect Teacher
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
                Browse our qualified teachers and tutors. Can't find what you need? Submit a request and we'll help you.
              </p>
            </div>
          </div>

          {!showRequestForm ? (
            <>
              {/* Search Section with improved styling */}
              <div className="bg-white rounded-2xl shadow-xl border-2 border-slate-200 p-6 mb-8 hover:shadow-2xl transition-shadow duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                    <Search className="text-white" size={20} />
                  </div>
                  <h2 className="text-xl font-black text-dark">Search Teachers</h2>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 items-center">
                  <div className="flex-1 w-full relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange transition-colors" size={20} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name, subject, location, or experience..."
                      className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-slate-300 focus:border-orange focus:outline-none focus:ring-4 focus:ring-orange/20 transition-all text-sm font-medium"
                    />
                  </div>
                  <button
                    onClick={() => setSearchQuery("")}
                    className="w-full sm:w-auto bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white font-black px-8 py-4 rounded-xl transition transform hover:scale-105 shadow-lg hover:shadow-xl text-sm"
                  >
                    Clear
                  </button>
                </div>
                {searchQuery && (
                  <div className="mt-3 text-sm text-slate-600">
                    <span className="font-semibold">{filteredTeachers.length}</span> teacher(s) found
                  </div>
                )}
              </div>

              {/* Teachers Grid with improved cards */}
              <div className="bg-white rounded-2xl shadow-xl border-2 border-slate-200 p-6 sm:p-8 mb-8">
                <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-10 bg-gradient-to-b from-orange to-orange/60 rounded-full"></div>
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-black text-dark">
                        Available Teachers
                      </h2>
                      <p className="text-sm text-slate-600 mt-1">
                        {filteredTeachers.length} qualified professional{filteredTeachers.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </div>

                {loadingTeachers ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-16 h-16 border-4 border-orange border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-slate-600 font-semibold">Loading teachers...</p>
                  </div>
                ) : filteredTeachers.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl mb-6">
                      <GraduationCap className="text-slate-400" size={56} />
                    </div>
                    <h3 className="text-xl font-black text-slate-700 mb-3">
                      {searchQuery ? "No teachers match your search" : "No teachers available"}
                    </h3>
                    <p className="text-slate-500 mb-8 max-w-md mx-auto">
                      {searchQuery
                        ? "Try adjusting your search terms or submit a request below to find the perfect teacher"
                        : "We don't have any teachers listed yet. Be the first to submit a hiring request!"}
                    </p>
                    <button
                      onClick={() => setShowRequestForm(true)}
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-orange to-orange/90 hover:from-orange/90 hover:to-orange text-white font-black py-3 px-8 rounded-xl transition transform hover:scale-105 shadow-lg"
                    >
                      <Send size={20} />
                      Submit a Request
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTeachers.map((teacher) => (
                      <div
                        key={teacher.employee_id}
                        className="group relative bg-gradient-to-br from-white to-slate-50 border-2 border-slate-200 rounded-2xl p-5 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 hover:border-orange/50"
                      >
                        {/* Decorative corner */}
                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-orange/10 to-transparent rounded-bl-3xl"></div>
                        
                        <div className="relative">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="font-black text-dark text-lg mb-1 group-hover:text-orange transition-colors">
                                {teacher.name}
                              </h3>
                              <div className="inline-block bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full">
                                {teacher.field || "Teacher"}
                              </div>
                            </div>
                            <div className="bg-gradient-to-br from-orange to-orange/80 text-white p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                              <GraduationCap size={22} />
                            </div>
                          </div>

                          <div className="space-y-3 text-sm mb-5">
                            {teacher.subjects && (
                              <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-3 rounded-lg border border-purple-200">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <BookOpen size={16} className="text-white" />
                                  </div>
                                  <span className="font-black text-purple-900 text-xs uppercase tracking-wide">Subjects</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5 ml-10">
                                  {teacher.subjects.split(',').map((subject, idx) => (
                                    <span
                                      key={idx}
                                      className="bg-white text-purple-700 px-2.5 py-1 rounded-full text-xs font-bold border border-purple-300 shadow-sm"
                                    >
                                      {subject.trim()}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {teacher.location && (
                              <div className="flex items-center gap-2 text-slate-700 bg-slate-50 p-2 rounded-lg">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <MapPin size={16} className="text-blue-600" />
                                </div>
                                <span className="font-medium">{teacher.location}</span>
                              </div>
                            )}
                            {teacher.experience && (
                              <div className="flex items-center gap-2 text-slate-700 bg-slate-50 p-2 rounded-lg">
                                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <BookOpen size={16} className="text-purple-600" />
                                </div>
                                <span className="font-medium">{teacher.experience}</span>
                              </div>
                            )}
                            {teacher.email && (
                              <div className="flex items-center gap-2 text-slate-700 bg-slate-50 p-2 rounded-lg">
                                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <Mail size={16} className="text-emerald-600" />
                                </div>
                                <span className="truncate text-xs font-medium">{teacher.email}</span>
                              </div>
                            )}
                            {teacher.mobile_no && (
                              <div className="flex items-center gap-2 text-slate-700 bg-slate-50 p-2 rounded-lg">
                                <div className="w-8 h-8 bg-orange/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <Phone size={16} className="text-orange" />
                                </div>
                                <span className="font-medium">{teacher.mobile_no}</span>
                              </div>
                            )}
                          </div>

                          {teacher.cv && (
                            <a
                              href={teacher.masked_cv || teacher.cv}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block w-full bg-gradient-to-r from-slate-800 to-slate-900 hover:from-orange hover:to-orange/90 text-white font-black py-3 px-4 rounded-xl transition-all text-center text-sm shadow-lg hover:shadow-xl transform hover:scale-105"
                            >
                              View CV →
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* CTA for Request Form with improved design */}
              <div className="relative overflow-hidden bg-gradient-to-r from-orange via-orange/95 to-orange/90 rounded-3xl p-8 sm:p-12 text-center text-white shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-[1.02]">
                <div className="absolute top-0 left-0 w-full h-full opacity-10">
                  <div className="absolute top-10 right-10 w-32 h-32 bg-white rounded-full blur-2xl"></div>
                  <div className="absolute bottom-10 left-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
                </div>
                
                <div className="relative z-10">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-6">
                    <AlertCircle className="text-white" size={32} />
                  </div>
                  <h3 className="text-2xl sm:text-3xl md:text-4xl font-black mb-4 leading-tight">
                    Can't Find What You're Looking For?
                  </h3>
                  <p className="text-base sm:text-lg md:text-xl mb-8 opacity-95 max-w-2xl mx-auto leading-relaxed">
                    Submit a request with your specific requirements and we'll help you find the perfect teacher
                  </p>
                  <button
                    onClick={() => setShowRequestForm(true)}
                    className="inline-flex items-center gap-3 bg-white hover:bg-slate-100 text-dark font-black py-4 px-10 rounded-xl transition transform hover:scale-110 shadow-2xl text-base sm:text-lg group"
                  >
                    <Send size={22} className="group-hover:translate-x-1 transition-transform" />
                    Submit a Hire Request
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Back Button */}
              <button
                onClick={() => setShowRequestForm(false)}
                className="mb-6 flex items-center gap-2 text-slate-600 hover:text-dark font-semibold transition"
              >
                <X size={20} />
                Back to Teachers
              </button>

              {/* Request Form */}
              <div className="bg-white rounded-2xl shadow-xl border-2 border-slate-200 p-4 sm:p-6 md:p-8 lg:p-10">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Personal Information */}
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-dark mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-orange rounded-full flex items-center justify-center text-dark text-sm font-black">
                    1
                  </span>
                  Your Information
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-dark mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="requester_name"
                      value={formData.requester_name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-lg border-2 border-slate-300 focus:border-orange focus:outline-none transition text-sm"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-dark mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="requester_email"
                      value={formData.requester_email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-lg border-2 border-slate-300 focus:border-orange focus:outline-none transition text-sm"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-dark mb-2">Phone Number</label>
                    <input
                      type="tel"
                      name="requester_phone"
                      value={formData.requester_phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border-2 border-slate-300 focus:border-orange focus:outline-none transition text-sm"
                      placeholder="+92 300 1234567"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-dark mb-2">Company/Organization</label>
                    <input
                      type="text"
                      name="requester_company"
                      value={formData.requester_company}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border-2 border-slate-300 focus:border-orange focus:outline-none transition text-sm"
                      placeholder="ABC School"
                    />
                  </div>
                </div>
              </div>

              {/* Requirements */}
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-dark mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-orange rounded-full flex items-center justify-center text-dark text-sm font-black">
                    2
                  </span>
                  Teaching Requirements
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-dark mb-2">Subject/Field</label>
                    <input
                      type="text"
                      name="preferred_teacher_field"
                      value={formData.preferred_teacher_field}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border-2 border-slate-300 focus:border-orange focus:outline-none transition text-sm"
                      placeholder="e.g., Mathematics, English, Science"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-dark mb-2">Preferred Experience</label>
                    <select
                      name="preferred_experience"
                      value={formData.preferred_experience}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border-2 border-slate-300 focus:border-orange focus:outline-none transition text-sm bg-white"
                    >
                      <option value="">Select experience level</option>
                      <option value="Entry Level (0-2 years)">Entry Level (0-2 years)</option>
                      <option value="Intermediate (2-5 years)">Intermediate (2-5 years)</option>
                      <option value="Experienced (5-10 years)">Experienced (5-10 years)</option>
                      <option value="Expert (10+ years)">Expert (10+ years)</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-dark mb-2">Location</label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border-2 border-slate-300 focus:border-orange focus:outline-none transition text-sm"
                      placeholder="e.g., Karachi, Lahore"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-dark mb-2">Subject Line</label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border-2 border-slate-300 focus:border-orange focus:outline-none transition text-sm"
                      placeholder="Brief subject for your request"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-dark mb-2">
                      Detailed Requirements <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      className="w-full px-4 py-3 rounded-lg border-2 border-slate-300 focus:border-orange focus:outline-none transition text-sm resize-none"
                      placeholder="Please describe your requirements in detail: teaching level, schedule preferences, any specific qualifications needed, etc."
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => window.history.back()}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 text-dark font-black py-3 px-6 rounded-lg transition-all duration-300 text-sm sm:text-base"
                >
                  Go Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-orange hover:opacity-90 text-dark font-black py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm sm:text-base"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-dark border-t-transparent rounded-full animate-spin"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Submit Request
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Additional Info */}
          <div className="mt-8 bg-blue-50 border-2 border-blue-200 rounded-xl p-4 sm:p-6">
            <h3 className="text-lg font-black text-dark mb-3 flex items-center gap-2">
              <AlertCircle className="text-blue-600" size={20} />
              What happens next?
            </h3>
            <ul className="space-y-2 text-sm text-slate-700">
              <li className="flex gap-2">
                <span className="text-orange font-black">1.</span>
                <span>Our team reviews your requirements</span>
              </li>
              <li className="flex gap-2">
                <span className="text-orange font-black">2.</span>
                <span>We match you with qualified teachers from our database</span>
              </li>
              <li className="flex gap-2">
                <span className="text-orange font-black">3.</span>
                <span>We contact you with suitable candidates and next steps</span>
              </li>
              <li className="flex gap-2">
                <span className="text-orange font-black">4.</span>
                <span>You'll typically hear back from us within 1-2 business days</span>
              </li>
            </ul>
          </div>
            </>
          )}
        </div>
      </div>

      {/* Result Modal */}
      {showResultModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300">
            <div
              className={`p-6 rounded-t-2xl ${
                resultType === "success"
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-600"
                  : "bg-gradient-to-r from-red-500 to-red-600"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {resultType === "success" ? (
                    <CheckCircle className="text-white" size={32} />
                  ) : (
                    <AlertCircle className="text-white" size={32} />
                  )}
                  <h3 className="text-xl font-black text-white">
                    {resultType === "success" ? "Request Submitted!" : "Submission Failed"}
                  </h3>
                </div>
                <button onClick={closeResultModal} className="text-white hover:text-slate-200 transition-colors">
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6">
              <p className="text-slate-700 mb-6 leading-relaxed">{resultMessage}</p>
              <div className="flex gap-3">
                {resultType === "success" && (
                  <button
                    onClick={() => (window.location.href = "/")}
                    className="flex-1 bg-slate-200 hover:bg-slate-300 text-dark font-black py-3 px-4 rounded-lg transition-all duration-300 text-sm"
                  >
                    Back to Home
                  </button>
                )}
                <button
                  onClick={closeResultModal}
                  className={`flex-1 ${
                    resultType === "success" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-orange hover:opacity-90"
                  } text-white font-black py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 text-sm`}
                >
                  {resultType === "success" ? "Close" : "Try Again"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
