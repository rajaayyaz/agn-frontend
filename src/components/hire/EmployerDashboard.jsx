"use client"

import {
  ArrowRight,
  X,
  CheckCircle,
  Briefcase,
  Users,
  Award,
  FileText,
  Clock,
  AlertCircle,
  XCircle,
  Home,
  LogOut,
} from "lucide-react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import NavBar from "../shared/NavBar"
import { listEmployees, createHireRequest, getEmployerHireRequests, createJob } from "../../Api/Service/apiService"

export default function EmployerDashboard() {
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [jobTitle, setJobTitle] = useState("")
  const [experience, setExperience] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [searchResults, setSearchResults] = useState(null)
  const [experienceOptions, setExperienceOptions] = useState([])
  const [fieldOptions, setFieldOptions] = useState([])
  const [expandedCandidate, setExpandedCandidate] = useState(null)
  const [hireModalOpen, setHireModalOpen] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [hireMessage, setHireMessage] = useState("")
  const [submittingHire, setSubmittingHire] = useState(false)
  const [requestsModalOpen, setRequestsModalOpen] = useState(false)
  const [hireRequests, setHireRequests] = useState([])
  const [loadingRequests, setLoadingRequests] = useState(false)
  // Post job when no candidates found
  const [postModalOpen, setPostModalOpen] = useState(false)
  const [postingJob, setPostingJob] = useState(false)
  const [postForm, setPostForm] = useState({ name: "", experience: "", location: "", details: "" })

  const handleLogout = () => {
    // Clear any stored user data
    localStorage.removeItem("agn_employer_user")
    localStorage.removeItem("agn_employer_authenticated")
    localStorage.removeItem("agn_employer_id")
    localStorage.removeItem("agn_auth_token")  // Clear JWT token
    sessionStorage.clear()
    // Redirect to home page
    navigate("/")
  }

  const handleGoHome = () => {
    navigate("/")
  }

  const handleSearch = (e) => {
    e.preventDefault()
    // Query backend for matching employees by role (field) and experience
    ;(async () => {
      try {
        const params = {}
        if (jobTitle) {
          // if the user typed a partial role (e.g. "Software"), prefer the full role
          // from `fieldOptions` that startsWith the typed text (case-insensitive).
          const typed = String(jobTitle || "").trim()
          const match = (fieldOptions || []).find((f) =>
            String(f || "")
              .toLowerCase()
              .startsWith(typed.toLowerCase()),
          )
          params.role = match || jobTitle
        }
        if (experience) params.experience = experience
        const res = await listEmployees(params)
        if (res && res.ok) {
          const rows = res.rows || []
          setSearchResults({
            jobTitle,
            experience,
            count: rows.length,
            timestamp: new Date().toLocaleTimeString(),
            rows,
          })
        } else {
          setSearchResults({ jobTitle, experience, count: 0, timestamp: new Date().toLocaleTimeString(), rows: [] })
        }
      } catch (err) {
        setSearchResults({ jobTitle, experience, count: 0, timestamp: new Date().toLocaleTimeString(), rows: [] })
      }
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 700)
    })()
  }

  // Convert experience string from DB into years representation
  function toYearsLabel(exp) {
    if (!exp && exp !== 0) return ""
    const s = String(exp)
    // try to find first number in the string
    const m = s.match(/\d+/)
    if (m) {
      const n = Number.parseInt(m[0], 10)
      return n === 1 ? "1 year" : `${n} years`
    }
    // treat fresh/no experience as 0 years so it appears in the dropdown
    const low = s.toLowerCase()
    if (
      low.includes("fresh") ||
      low.includes("fresher") ||
      low.includes("no professional") ||
      low.includes("no experience")
    ) {
      return "0 years"
    }
    return s
  }

  // load options on mount
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        // fetch a large sample (adjust limit if needed)
        const res = await listEmployees({ limit: 1000 })
        if (!mounted) return
        if (res && res.ok) {
          const rows = res.rows || []
          const expSet = new Set()
          const fieldSet = new Set()
          rows.forEach((r) => {
            if (r.experience) expSet.add(toYearsLabel(r.experience))
            if (r.field) fieldSet.add(r.field)
          })
          // sort experience options by numeric value when possible
          const expArr = Array.from(expSet)
            .filter(Boolean)
            .sort((a, b) => {
              const na = Number.parseInt(a, 10) || 0
              const nb = Number.parseInt(b, 10) || 0
              return na - nb
            })
          setExperienceOptions(expArr)
          setFieldOptions(Array.from(fieldSet).filter(Boolean).sort())
        }
      } catch (err) {
        // Silent fail
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const clearResults = () => {
    setSearchResults(null)
    setJobTitle("")
    setExperience("")
  }

  const openHireModal = (candidate) => {
    setSelectedCandidate(candidate)
    setHireMessage("")
    setHireModalOpen(true)
  }

  // Post job modal handlers
  const openPostModal = (prefill = {}) => {
    setPostForm({
      name: prefill.name || prefill.jobTitle || "",
      experience: prefill.experience || prefill.experience || "",
      location: prefill.location || "",
      details: prefill.details || "",
    })
    setPostModalOpen(true)
  }

  const closePostModal = () => {
    setPostModalOpen(false)
    setPostForm({ name: "", experience: "", location: "", details: "" })
  }

  const handlePostJobSubmit = async () => {
    // Simple validation
    if (!postForm.name.trim()) {
      alert("Please enter a job title")
      return
    }
    setPostingJob(true)
    try {
      const employerId = localStorage.getItem("agn_employer_id")
      const employerAuthenticated = localStorage.getItem("agn_employer_authenticated")
      const payload = {
        name: postForm.name,
        experience: postForm.experience,
        details: postForm.details,
        location: postForm.location,
      }
      if (employerId) {
        payload.employer_id = Number.parseInt(employerId)
        payload.employer_authenticated = employerAuthenticated ? String(employerAuthenticated) : "1"
      }

      const res = await createJob(payload)
      if (res && res.ok) {
        alert("Job posted successfully")
        closePostModal()
      } else {
        alert(res?.error || "Failed to post job. Please try again.")
      }
    } catch (err) {
      alert(err?.message || "Failed to post job. Please try again.")
    } finally {
      setPostingJob(false)
    }
  }

  const closeHireModal = () => {
    setHireModalOpen(false)
    setSelectedCandidate(null)
    setHireMessage("")
  }

  const handleHireSubmit = async () => {
    if (!hireMessage.trim()) {
      alert("Please enter a message for your hire request")
      return
    }

    setSubmittingHire(true)
    try {
      // Get employer_id from localStorage
      const employerId = localStorage.getItem("agn_employer_id")
      if (!employerId) {
        alert("Employer ID not found. Please login again.")
        return
      }

      const response = await createHireRequest({
        employer_id: Number.parseInt(employerId),
        employee_id: selectedCandidate.employee_id,
        message: hireMessage.trim(),
      })

      if (response && response.ok) {
        alert(`Hire request sent successfully for ${selectedCandidate.name}!`)
        closeHireModal()
      } else {
        alert(response?.error || "Failed to create hire request")
      }
    } catch (error) {
      alert(error.message || "Failed to create hire request. Please try again.")
    } finally {
      setSubmittingHire(false)
    }
  }

  const openRequestsModal = async () => {
    setRequestsModalOpen(true)
    setLoadingRequests(true)
    try {
      const employerId = localStorage.getItem("agn_employer_id")
      if (!employerId) {
        alert("Employer ID not found. Please login again.")
        return
      }

      const response = await getEmployerHireRequests(Number.parseInt(employerId))
      if (response && response.ok) {
        setHireRequests(response.requests || [])
      } else {
        alert(response?.error || "Failed to load hire requests")
      }
    } catch (error) {
      alert("Failed to load hire requests. Please try again.")
    } finally {
      setLoadingRequests(false)
    }
  }

  const closeRequestsModal = () => {
    setRequestsModalOpen(false)
    setHireRequests([])
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Clock className="text-orange" size={20} />
      case "accepted":
        return <CheckCircle className="text-green-600" size={20} />
      case "rejected":
        return <XCircle className="text-red-600" size={20} />
      default:
        return <AlertCircle className="text-gray-600" size={20} />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-light text-dark border-orange"
      case "accepted":
        return "bg-green-100 text-green-800 border-green-300"
      case "rejected":
        return "bg-red-100 text-red-800 border-red-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Shared Navigation */}
      <NavBar />

  <div className="sticky top-0 z-40 bg-white border-b-2 border-orange shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Briefcase className="text-orange flex-shrink-0" size={24} />
            <div className="flex-1">
              <h3 className="font-black text-black text-sm">Quick Search</h3>
              <p className="text-gray-600 text-xs">Find candidates instantly</p>
            </div>
            <button
              onClick={handleGoHome}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-black px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 text-sm flex items-center gap-2 shadow-sm hover:shadow-md"
            >
              <Home size={18} />
              Home
            </button>
            <button
              onClick={openRequestsModal}
              className="bg-blue-600 hover:bg-blue-700 text-white font-black px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 text-sm flex items-center gap-2 shadow-sm hover:shadow-md"
            >
              <FileText size={18} />
              My Requests
            </button>
            <button
              onClick={() => document.getElementById("search-form")?.scrollIntoView({ behavior: "smooth" })}
              className="bg-orange hover:opacity-90 text-black font-black px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 text-sm shadow-sm hover:shadow-md"
            >
              Search Now
            </button>
            <button
              onClick={handleLogout}
              className="bg-rose-600 hover:bg-rose-700 text-white font-black px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 text-sm flex items-center gap-2 shadow-sm hover:shadow-md"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-orange to-light pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute top-20 right-10 w-48 h-48 bg-orange rounded-full opacity-50 blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-0 right-32 w-64 h-64 bg-orange-300 rounded-full opacity-30 blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute -left-32 top-40 w-80 h-80 bg-orange rounded-full opacity-40 blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <h1 className="text-5xl md:text-7xl font-black text-black leading-tight mb-6 text-balance">
                Find Your Next{" "}
                <span className="relative inline-block">
                  Finance<span className="absolute -bottom-3 left-0 w-10 h-10 bg-black rounded-full"></span>
                </span>{" "}
                Professional
              </h1>
              <p className="text-lg text-black mb-8 max-w-md leading-relaxed font-medium">
                Access our network of vetted finance professionals ready to join your team
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="search-form" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-black text-black mb-4 text-balance">Search Our Talent Pool</h2>
            <p className="text-gray-600 text-lg font-medium max-w-2xl mx-auto">
              Tell us what you're looking for and we'll help you find the perfect candidate
            </p>
          </div>

          <div className="bg-light rounded-2xl p-8 border-2 border-orange shadow-lg hover:shadow-xl transition-all duration-300 animate-slide-up">
            {submitted ? (
              <div className="text-center py-12 animate-fade-in">
                <div className="w-16 h-16 bg-orange rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <CheckCircle className="text-black" size={32} />
                </div>
                <h3 className="text-2xl font-black text-black mb-2">Search Submitted!</h3>
                <p className="text-gray-700 mb-6">
                  We'll review your requirements and get back to you shortly with matching candidates.
                </p>
                <button
                  onClick={clearResults}
                  className="bg-black text-orange hover:bg-gray-900 font-black px-6 py-2 rounded-lg transition-all duration-200 transform hover:scale-105"
                >
                  New Search
                </button>
              </div>
            ) : (
              <form onSubmit={handleSearch} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
                    <label className="block font-black text-black mb-3 text-sm">Job Title or Role</label>
                    <input
                      type="text"
                      list="field-options"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="e.g., Senior Accountant, Finance Manager"
                      required
                      className="w-full px-4 py-3 rounded-lg border-2 border-orange focus:border-black focus:outline-none transition-all duration-200 font-medium hover:border-orange"
                    />
                    <datalist id="field-options">
                      {(fieldOptions || [])
                        .filter((f) => {
                          if (!jobTitle) return true
                          try {
                            return String(f || "")
                              .toLowerCase()
                              .startsWith(String(jobTitle || "").toLowerCase())
                          } catch (e) {
                            return true
                          }
                        })
                        .map((f) => (
                          <option key={f} value={f} />
                        ))}
                    </datalist>
                  </div>

                  <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
                    <label className="block font-black text-black mb-3 text-sm">Experience Level Required</label>
                    <select
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border-2 border-orange focus:border-black focus:outline-none transition-all duration-200 font-medium hover:border-orange"
                    >
                      <option value="">Select experience level</option>
                      {experienceOptions.length > 0 ? (
                        experienceOptions.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="entry">Entry Level / Graduate</option>
                          <option value="part-qualified">Part Qualified</option>
                          <option value="qualified">Qualified Professional</option>
                          <option value="senior">Senior / Management</option>
                          <option value="executive">Executive / Director</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-black text-orange hover:bg-gray-900 font-black text-lg px-8 py-4 rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 group animate-fade-in"
                  style={{ animationDelay: "0.3s" }}
                >
                  <span>Search Candidates</span>
                  <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {searchResults && (
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-indigo-50 animate-fade-in">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-8 border-2 border-blue-200 shadow-lg">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-3xl font-black text-black mb-2">Search Results</h3>
                  <p className="text-gray-600 text-sm">Found {searchResults.count} matching candidates</p>
                </div>
                <button onClick={clearResults} className="text-gray-500 hover:text-black transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-xs text-gray-600 font-semibold mb-1">Job Title</p>
                  <p className="font-black text-black text-lg">{searchResults.jobTitle}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-xs text-gray-600 font-semibold mb-1">Experience Level</p>
                  <p className="font-black text-black text-lg capitalize">{searchResults.experience}</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                {(searchResults.rows || []).slice(0, Math.min(searchResults.rows.length, 6)).map((r, i) => {
                  const isExpanded = expandedCandidate === r.employee_id
                  return (
                    <div
                      key={r.employee_id || i}
                      className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 hover:border-blue-400 transition-all duration-200 group"
                    >
                      <div
                        className="p-4 cursor-pointer"
                        onClick={() => setExpandedCandidate(isExpanded ? null : r.employee_id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Users className="text-blue-500" size={18} />
                              <h4 className="font-black text-black">{r.name || `Candidate ${i + 1}`}</h4>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{r.field || "Relevant role"}</p>
                            <div className="flex gap-2">
                              <span className="bg-blue-200 text-blue-900 text-xs font-bold px-3 py-1 rounded-full">
                                {r.location || "Location unknown"}
                              </span>
                              <span className="bg-green-200 text-green-900 text-xs font-bold px-3 py-1 rounded-full">
                                {r.experience ? toYearsLabel(r.experience) : "Experience N/A"}
                              </span>
                            </div>
                          </div>
                          <ArrowRight
                            className={`text-blue-500 transition-transform ${isExpanded ? "rotate-90" : "group-hover:translate-x-1"}`}
                            size={20}
                          />
                        </div>
                      </div>

                      {/* Expanded section with CV and Hire button */}
                      {isExpanded && (
                        <div className="border-t border-blue-200 p-4 bg-white animate-fade-in">
                          <div className="space-y-4">
                            {/* Candidate Details */}
                            <div className="grid md:grid-cols-2 gap-3 text-sm">
                              {r.educational_profile && (
                                <div className="flex items-center gap-2">
                                  <Award size={16} className="text-blue-500" />
                                  <span className="text-gray-700">{r.educational_profile}</span>
                                </div>
                              )}
                              {r.experience_detail && (
                                <div className="flex items-start gap-2 md:col-span-2">
                                  <Briefcase size={16} className="text-blue-500 mt-1" />
                                  <span className="text-gray-700">{r.experience_detail}</span>
                                </div>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openHireModal(r)
                                }}
                                className="flex-1 bg-orange hover:opacity-90 text-black font-black py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
                              >
                                <CheckCircle size={18} />
                                Hire {r.name?.split(" ")[0]}
                              </button>
                              {r.masked_cv && (
                                <a
                                  href={r.masked_cv}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="bg-blue-600 hover:bg-blue-700 text-white font-black py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
                                >
                                  <FileText size={18} />
                                  Download CV
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {searchResults.count === 0 && (
                <div className="text-center p-8 border-t border-blue-100">
                  <AlertCircle className="text-gray-400 mx-auto mb-4" size={48} />
                  <h4 className="text-xl font-black text-black mb-2">No candidates found</h4>
                  <p className="text-gray-600 mb-4">Would you like to post this job to our job board so candidates can apply?</p>
                  <div className="flex justify-center">
                    <button
                      onClick={() => openPostModal({ jobTitle: searchResults.jobTitle, experience: searchResults.experience })}
                      className="bg-orange hover:bg-orange/90 text-dark font-black px-6 py-3 rounded-lg transition-all duration-200"
                    >
                      Post this Job
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Hire Request Modal */}
      {hireModalOpen && selectedCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-black text-black">Send Hire Request</h3>
              <button onClick={closeHireModal} className="text-gray-500 hover:text-black transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="mb-6">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="text-blue-500" size={18} />
                  <h4 className="font-black text-black">{selectedCandidate.name}</h4>
                </div>
                <p className="text-sm text-gray-600">{selectedCandidate.field}</p>
              </div>

              <label className="block font-black text-black mb-2 text-sm">Your Message</label>
              <textarea
                value={hireMessage}
                onChange={(e) => setHireMessage(e.target.value)}
                placeholder="Tell the candidate why you're interested and what the opportunity involves..."
                rows={5}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={closeHireModal}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-black py-3 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleHireSubmit}
                disabled={submittingHire}
                className="flex-1 bg-orange hover:bg-orange/90 text-dark font-black py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submittingHire ? (
                  <>
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} />
                    Send Request
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post Job Modal (for employers to post when no candidates found) */}
      {postModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-black text-black">Post Job</h3>
              <button onClick={closePostModal} className="text-gray-500 hover:text-black transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block font-black text-black mb-2 text-sm">Job Title</label>
                <input
                  value={postForm.name}
                  onChange={(e) => setPostForm((s) => ({ ...s, name: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-black text-black mb-2 text-sm">Experience</label>
                <input
                  value={postForm.experience}
                  onChange={(e) => setPostForm((s) => ({ ...s, experience: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-black text-black mb-2 text-sm">Location</label>
                <input
                  value={postForm.location}
                  onChange={(e) => setPostForm((s) => ({ ...s, location: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-black text-black mb-2 text-sm">Details / Description</label>
                <textarea
                  value={postForm.details}
                  onChange={(e) => setPostForm((s) => ({ ...s, details: e.target.value }))}
                  rows={5}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={closePostModal} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-black py-3 px-4 rounded-lg">
                Cancel
              </button>
              <button
                onClick={handlePostJobSubmit}
                disabled={postingJob}
                className="flex-1 bg-orange hover:bg-orange/90 text-dark font-black py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {postingJob ? (
                  <>
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin inline-block mr-2"></div>
                    Posting...
                  </>
                ) : (
                  "Post Job"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* My Hire Requests Modal */}
      {requestsModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden shadow-2xl animate-slide-up">
            <div className="p-8 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black text-black">My Hire Requests</h3>
                <button onClick={closeRequestsModal} className="text-gray-500 hover:text-black transition-colors">
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-8 overflow-y-auto max-h-[calc(80vh-120px)]">
              {loadingRequests ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading requests...</p>
                </div>
              ) : hireRequests.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="text-gray-400 mx-auto mb-4" size={48} />
                  <h4 className="text-xl font-black text-black mb-2">No Hire Requests Yet</h4>
                  <p className="text-gray-600">You haven't sent any hire requests yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {hireRequests.map((request) => (
                    <div
                      key={request.request_id}
                      className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="text-blue-500" size={18} />
                            <h4 className="font-black text-black">{request.employee_name || "Candidate"}</h4>
                          </div>
                          <p className="text-sm text-gray-600">Request ID: #{request.request_id}</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full border ${getStatusColor(request.status)} flex items-center gap-2`}>
                          {getStatusIcon(request.status)}
                          <span className="font-bold text-sm capitalize">{request.status}</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-600 font-semibold mb-1">Your Message</p>
                          <p className="text-sm text-gray-700 bg-white rounded p-3 border border-blue-200">
                            {request.message}
                          </p>
                        </div>

                        {request.admin_response && (
                          <div>
                            <p className="text-xs text-gray-600 font-semibold mb-1">Admin Response</p>
                            <p className="text-sm text-gray-700 bg-green-50 rounded p-3 border border-green-200">
                              {request.admin_response}
                            </p>
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-xs text-gray-600">
                          <div className="flex items-center gap-1">
                            <Clock size={14} />
                            <span>Sent: {formatDate(request.created_at)}</span>
                          </div>
                          {request.updated_at && request.updated_at !== request.created_at && (
                            <div className="flex items-center gap-1">
                              <Clock size={14} />
                              <span>Updated: {formatDate(request.updated_at)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
