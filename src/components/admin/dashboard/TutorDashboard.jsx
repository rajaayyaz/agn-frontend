"use client"

import { useState, useEffect } from "react"
import {
  Users,
  GraduationCap,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Mail,
  Building2,
  FileText,
  X,
  BookOpen,
  Phone,
} from "lucide-react"
import CONFIG from "../../../Api/Config/config"

export default function TutorDashboard() {
  const [allRequests, setAllRequests] = useState([])
  const [allTeachers, setAllTeachers] = useState([])
  const [filteredRequests, setFilteredRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [teachersLoading, setTeachersLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState("all")
  const [responseModal, setResponseModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [responseAction, setResponseAction] = useState(null)
  const [responseMessage, setResponseMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [toasts, setToasts] = useState([])

  const showToast = (type, text, duration = 4500) => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, type, text }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), duration)
  }

  useEffect(() => {
    fetchAllRequests()
    fetchAllTeachers()
  }, [])

  useEffect(() => {
    if (filterStatus === "all") {
      setFilteredRequests(allRequests)
    } else {
      setFilteredRequests(allRequests.filter((req) => req.status === filterStatus))
    }
  }, [filterStatus, allRequests])

  const fetchAllRequests = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('agn_auth_token')
      const response = await fetch(`${CONFIG.BASE_URL}/api/admin/tutor-requests`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      })
      const data = await response.json()
      
      if (data && data.ok) {
        setAllRequests(data.requests || [])
        setFilteredRequests(data.requests || [])
      } else {
        showToast("error", data?.error || "Failed to load tutor requests")
      }
    } catch (error) {
      showToast("error", "Failed to load tutor requests")
    } finally {
      setLoading(false)
    }
  }

  const fetchAllTeachers = async () => {
    setTeachersLoading(true)
    try {
      const response = await fetch(`${CONFIG.BASE_URL}/api/employees/teachers`)
      const data = await response.json()
      
      if (data && data.ok) {
        setAllTeachers(data.rows || [])
      } else {
        showToast("error", data?.error || "Failed to load teachers")
      }
    } catch (error) {
      showToast("error", "Failed to load teachers")
    } finally {
      setTeachersLoading(false)
    }
  }

  const openResponseModal = (request, action) => {
    setSelectedRequest(request)
    setResponseAction(action)
    setResponseMessage("")
    setResponseModal(true)
  }

  const closeResponseModal = () => {
    setResponseModal(false)
    setSelectedRequest(null)
    setResponseAction(null)
    setResponseMessage("")
  }

  const handleResponseSubmit = async () => {
    if (!responseMessage.trim()) {
      showToast("error", "Please enter a response message")
      return
    }

    setSubmitting(true)
    try {
      const newStatus = responseAction === "accept" ? "accepted" : "rejected"
      const token = localStorage.getItem('agn_auth_token')

      const response = await fetch(`${CONFIG.BASE_URL}/api/admin/tutor-request/respond`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          request_id: selectedRequest.id,
          status: newStatus,
          admin_response: responseMessage.trim(),
        }),
      })

      const data = await response.json()

      if (data && data.ok) {
        showToast("success", `Request ${newStatus} successfully!`)
        closeResponseModal()
        fetchAllRequests()
      } else {
        showToast("error", data?.error || "Failed to update request")
      }
    } catch (error) {
      showToast("error", "Failed to submit response")
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Clock className="text-orange" size={20} />
      case "accepted":
        return <CheckCircle className="text-emerald-600" size={20} />
      case "rejected":
        return <XCircle className="text-red-600" size={20} />
      default:
        return <AlertCircle className="text-slate-600" size={20} />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-light text-orange border-orange"
      case "accepted":
        return "bg-emerald-100 text-emerald-900 border-emerald-300"
      case "rejected":
        return "bg-red-100 text-red-900 border-red-300"
      default:
        return "bg-slate-100 text-slate-900 border-slate-300"
    }
  }

  const handleWhatsAppShare = async (teacher) => {
    try {
      const cvLink = teacher?.masked_cv || teacher?.cv
      if (!cvLink) {
        showToast("error", `No CV available for ${teacher?.name || 'this teacher'}`)
        return
      }

      // Create a well-formatted message with teacher details
      const message = [
        `TEACHER PROFILE`,
        `━━━━━━━━━━━━━━━━`,
        ``,
        `Name: ${teacher?.name || 'N/A'}`,
        teacher?.subjects ? `Subjects: ${teacher.subjects}` : null,
        teacher?.experience ? `Experience: ${teacher.experience}` : null,
        ``,
        `CV Link:`,
        `${cvLink}`
      ].filter(Boolean).join('\n')

      // Copy to clipboard (best-effort)
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(cvLink)
          showToast("success", "CV link copied to clipboard! Opening WhatsApp...")
        } else {
          // Fallback copy
          const ta = document.createElement('textarea')
          ta.value = cvLink
          ta.style.position = 'fixed'
          ta.style.left = '-9999px'
          document.body.appendChild(ta)
          ta.select()
          document.execCommand('copy')
          document.body.removeChild(ta)
          showToast("success", "CV link copied! Opening WhatsApp...")
        }
      } catch (err) {
        // Non-fatal: just notify user
        showToast("info", "Opening WhatsApp with CV details...")
      }

      // Open WhatsApp (works for mobile app and web)
      const encoded = encodeURIComponent(message)
      const whatsappUrl = `https://wa.me/?text=${encoded}`
      window.open(whatsappUrl, '_blank')
    } catch (err) {
      showToast("error", `WhatsApp share error: ${err?.message || err}`)
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

  const pendingCount = allRequests.filter((r) => r.status === "pending").length
  const acceptedCount = allRequests.filter((r) => r.status === "accepted").length
  const rejectedCount = allRequests.filter((r) => r.status === "rejected").length

  return (
    <div>
      {/* Header */}
      <div className="mb-3 sm:mb-4 md:mb-6 lg:mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 md:gap-4">
          <div>
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black text-black mb-1 sm:mb-2 flex items-center gap-2">
              <GraduationCap className="text-orange" size={28} />
              Tutor Hiring Dashboard
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-slate-600">Manage tutor hire requests and available teachers</p>
          </div>
          <button
            onClick={() => {
              fetchAllRequests()
              fetchAllTeachers()
            }}
            className="bg-orange hover:opacity-90 text-dark font-black px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-2.5 lg:py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-xs sm:text-sm md:text-base w-full sm:w-auto"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Available Teachers Section */}
      <div className="mb-3 sm:mb-4 md:mb-6 lg:mb-8">
        <div className="bg-white rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 border-2 border-slate-200 shadow-lg">
          <div className="flex items-center gap-2 mb-3 sm:mb-4 md:mb-5">
            <Users className="text-blue-600" size={20} />
            <h3 className="text-base sm:text-lg md:text-xl font-black text-black">Available Teachers</h3>
            <span className="ml-auto bg-blue-100 text-blue-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-black">
              {allTeachers.length} Teachers
            </span>
          </div>

          {teachersLoading ? (
            <div className="flex items-center justify-center py-8 sm:py-12">
              <div className="w-8 sm:w-10 h-8 sm:h-10 border-4 border-orange border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : allTeachers.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <GraduationCap className="mx-auto text-slate-400 mb-3" size={40} />
              <p className="text-sm text-slate-600">No teachers found in the system</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
              {allTeachers.slice(0, 6).map((teacher) => (
                <div
                  key={teacher.employee_id}
                  className="bg-blue-50 border-2 border-blue-200 rounded-xl p-2 sm:p-3 md:p-4 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-black text-black text-sm sm:text-base mb-1">{teacher.name}</h4>
                      <p className="text-xs text-slate-600 font-semibold">{teacher.field || "Teacher"}</p>
                    </div>
                    <div className="bg-blue-600 text-white p-1.5 rounded-full">
                      <GraduationCap size={14} />
                    </div>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-1 text-slate-700">
                      <MapPin size={12} />
                      <span>{teacher.location || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-700">
                      <BookOpen size={12} />
                      <span>{teacher.experience || "N/A"}</span>
                    </div>
                  </div>
                  {(teacher.cv || teacher.masked_cv) && (
                    <button
                      onClick={() => handleWhatsAppShare(teacher)}
                      className="w-full mt-2 bg-emerald-500 text-white px-2 py-1.5 rounded-lg font-semibold hover:bg-emerald-600 transition-all duration-300 flex items-center justify-center gap-1.5 text-xs shadow-md"
                    >
                      <span className="text-sm">📲</span> Share CV
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          {allTeachers.length > 6 && (
            <p className="text-center text-xs text-slate-500 mt-3">
              Showing 6 of {allTeachers.length} teachers. Go to Manage Employees to see all.
            </p>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4 md:mb-6 lg:mb-8">
        <div className="bg-white rounded-xl p-2 sm:p-3 md:p-4 lg:p-5 xl:p-6 border-2 border-slate-200 shadow-md hover:shadow-lg transition-all duration-300">
          <div className="flex items-center gap-1 sm:gap-2 md:gap-3 mb-1 sm:mb-2">
            <FileText className="text-blue-600" size={16} />
            <span className="text-xs sm:text-sm text-slate-600 font-semibold">Total Requests</span>
          </div>
          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black text-black">{allRequests.length}</p>
        </div>

        <div
          className="bg-light rounded-xl p-2 sm:p-3 md:p-4 lg:p-5 xl:p-6 border-2 border-orange shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:scale-105"
          onClick={() => setFilterStatus("pending")}
        >
          <div className="flex items-center gap-1 sm:gap-2 md:gap-3 mb-1 sm:mb-2">
            <Clock className="text-orange" size={16} />
            <span className="text-xs sm:text-sm text-slate-600 font-semibold">Pending</span>
          </div>
          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black text-orange">{pendingCount}</p>
        </div>

        <div
          className="bg-emerald-50 rounded-xl p-2 sm:p-3 md:p-4 lg:p-5 xl:p-6 border-2 border-emerald-300 shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:scale-105"
          onClick={() => setFilterStatus("accepted")}
        >
          <div className="flex items-center gap-1 sm:gap-2 md:gap-3 mb-1 sm:mb-2">
            <CheckCircle className="text-emerald-600" size={16} />
            <span className="text-xs sm:text-sm text-slate-600 font-semibold">Accepted</span>
          </div>
          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black text-emerald-700">{acceptedCount}</p>
        </div>

        <div
          className="bg-red-50 rounded-xl p-2 sm:p-3 md:p-4 lg:p-5 xl:p-6 border-2 border-red-300 shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:scale-105"
          onClick={() => setFilterStatus("rejected")}
        >
          <div className="flex items-center gap-1 sm:gap-2 md:gap-3 mb-1 sm:mb-2">
            <XCircle className="text-red-600" size={16} />
            <span className="text-xs sm:text-sm text-slate-600 font-semibold">Rejected</span>
          </div>
          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black text-red-700">{rejectedCount}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-xl p-1 sm:p-1.5 md:p-2 mb-3 sm:mb-4 md:mb-6 border-2 border-slate-200 shadow-md flex flex-wrap gap-1 sm:gap-1.5 md:gap-2 w-full">
        <button
          onClick={() => setFilterStatus("all")}
          className={`flex-1 sm:flex-none px-2 sm:px-3 md:px-4 lg:px-6 py-1.5 sm:py-2 md:py-2.5 lg:py-3 rounded-lg font-black transition-all duration-300 text-xs sm:text-sm ${
            filterStatus === "all"
              ? "bg-black text-orange shadow-lg"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilterStatus("pending")}
          className={`flex-1 sm:flex-none px-2 sm:px-3 md:px-4 lg:px-6 py-1.5 sm:py-2 md:py-2.5 lg:py-3 rounded-lg font-black transition-all duration-300 text-xs sm:text-sm ${
            filterStatus === "pending"
              ? "bg-orange text-dark shadow-lg"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setFilterStatus("accepted")}
          className={`flex-1 sm:flex-none px-2 sm:px-3 md:px-4 lg:px-6 py-1.5 sm:py-2 md:py-2.5 lg:py-3 rounded-lg font-black transition-all duration-300 text-xs sm:text-sm ${
            filterStatus === "accepted"
              ? "bg-emerald-600 text-white shadow-lg"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          Accepted
        </button>
        <button
          onClick={() => setFilterStatus("rejected")}
          className={`flex-1 sm:flex-none px-2 sm:px-3 md:px-4 lg:px-6 py-1.5 sm:py-2 md:py-2.5 lg:py-3 rounded-lg font-black transition-all duration-300 text-xs sm:text-sm ${
            filterStatus === "rejected"
              ? "bg-red-600 text-white shadow-lg"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          Rejected
        </button>
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12 sm:py-16 md:py-20">
            <div className="w-10 sm:w-12 h-10 sm:h-12 border-4 border-orange border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-12 sm:py-16 md:py-20 px-2 sm:px-4">
            <FileText className="mx-auto text-slate-400 mb-3 sm:mb-4" size={48} />
            <h4 className="text-base sm:text-lg md:text-xl font-black text-slate-700 mb-1 sm:mb-2">
              No {filterStatus !== "all" ? filterStatus : ""} Tutor Requests Found
            </h4>
            <p className="text-xs sm:text-sm md:text-base text-slate-500">
              {filterStatus === "all"
                ? "No tutor hire requests have been submitted yet."
                : `No ${filterStatus} requests to display.`}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {filteredRequests.map((request, index) => (
              <div
                key={request.id || index}
                className="p-2 sm:p-3 md:p-4 lg:p-6 hover:bg-slate-50 transition-all duration-300 border-l-4 border-transparent hover:border-orange"
              >
                <div className="flex items-start justify-between mb-2 sm:mb-3 md:mb-4">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5 sm:gap-2 md:gap-3 mb-2 sm:mb-3">
                      <div
                        className={`px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-full border-2 flex items-center gap-1 sm:gap-1.5 md:gap-2 font-black text-xs sm:text-sm ${getStatusColor(request.status)}`}
                      >
                        {getStatusIcon(request.status)}
                        <span className="uppercase">{request.status}</span>
                      </div>
                      <span className="text-xs sm:text-sm text-slate-500 font-semibold">Request #{request.id}</span>
                    </div>

                    <div className="grid md:grid-cols-2 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
                      {/* Requester Details */}
                      <div className="bg-purple-50 rounded-xl p-2 sm:p-3 md:p-4 border-2 border-purple-200">
                        <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 mb-2 sm:mb-3">
                          <Building2 className="text-purple-600" size={16} />
                          <h4 className="font-black text-black text-xs sm:text-sm md:text-base">Requester Details</h4>
                        </div>
                        <div className="space-y-1 sm:space-y-1.5 md:space-y-2 text-xs sm:text-sm">
                          <div>
                            <span className="text-slate-600 font-semibold">Name:</span>
                            <p className="text-black font-bold">{request.requester_name || "N/A"}</p>
                          </div>
                          <div>
                            <span className="text-slate-600 font-semibold">Company:</span>
                            <p className="text-black font-bold">{request.requester_company || "N/A"}</p>
                          </div>
                          <div>
                            <span className="text-slate-600 font-semibold">Email:</span>
                            <p className="text-black font-bold text-xs break-all">{request.requester_email || "N/A"}</p>
                          </div>
                          {request.requester_phone && (
                            <div>
                              <span className="text-slate-600 font-semibold">Phone:</span>
                              <p className="text-black font-bold">{request.requester_phone}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Requirements */}
                      <div className="bg-emerald-50 rounded-xl p-2 sm:p-3 md:p-4 border-2 border-emerald-200">
                        <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 mb-2 sm:mb-3">
                          <GraduationCap className="text-emerald-600" size={16} />
                          <h4 className="font-black text-black text-xs sm:text-sm md:text-base">Requirements</h4>
                        </div>
                        <div className="space-y-1 sm:space-y-1.5 md:space-y-2 text-xs sm:text-sm">
                          {request.subject && (
                            <div>
                              <span className="text-slate-600 font-semibold">Subject:</span>
                              <p className="text-black font-bold">{request.subject}</p>
                            </div>
                          )}
                          {request.preferred_teacher_field && (
                            <div>
                              <span className="text-slate-600 font-semibold">Field:</span>
                              <p className="text-black font-bold">{request.preferred_teacher_field}</p>
                            </div>
                          )}
                          {request.preferred_experience && (
                            <div>
                              <span className="text-slate-600 font-semibold">Experience:</span>
                              <p className="text-black font-bold">{request.preferred_experience}</p>
                            </div>
                          )}
                          {request.location && (
                            <div className="flex items-center gap-1">
                              <MapPin size={12} className="text-emerald-600" />
                              <span className="text-black font-bold">{request.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Timestamps */}
                    <div className="grid md:grid-cols-2 gap-2 sm:gap-3 md:gap-4 mt-2 sm:mt-3 md:mt-4">
                      <div className="bg-slate-50 rounded-lg p-2 sm:p-2.5 md:p-3 border-2 border-slate-200">
                        <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 mb-0.5 sm:mb-1">
                          <Clock size={14} className="text-slate-600" />
                          <span className="text-xs text-slate-600 font-semibold">Request Sent</span>
                        </div>
                        <p className="text-xs sm:text-sm font-black text-black">{formatDate(request.created_at)}</p>
                      </div>
                      {request.updated_at && request.status !== "pending" && (
                        <div className="bg-slate-50 rounded-lg p-2 sm:p-2.5 md:p-3 border-2 border-slate-200">
                          <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 mb-0.5 sm:mb-1">
                            <Clock size={14} className="text-slate-600" />
                            <span className="text-xs text-slate-600 font-semibold">Response Date</span>
                          </div>
                          <p className="text-xs sm:text-sm font-black text-black">{formatDate(request.updated_at)}</p>
                        </div>
                      )}
                    </div>

                    {/* Request Message */}
                    {request.message && (
                      <div className="mt-2 sm:mt-3 md:mt-4 rounded-xl p-2 sm:p-3 md:p-4 border-2 bg-white border-slate-300">
                        <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 mb-1 sm:mb-1.5 md:mb-2">
                          <Mail size={14} className="text-slate-600" />
                          <span className="text-xs font-semibold text-slate-600">Request Message</span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">{request.message}</p>
                      </div>
                    )}

                    {/* Admin Response */}
                    {request.admin_response && request.status !== "pending" && (
                      <div className="mt-2 sm:mt-3 md:mt-4 rounded-xl p-2 sm:p-3 md:p-4 border-2 bg-blue-50 border-blue-300">
                        <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 mb-1 sm:mb-1.5 md:mb-2">
                          <Mail size={14} className="text-blue-600" />
                          <span className="text-xs font-semibold text-blue-600">Admin Response</span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">{request.admin_response}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                {request.status === "pending" && (
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-2 sm:mt-3 md:mt-4 pt-2 sm:pt-3 md:pt-4 border-t-2 border-slate-200">
                    <button
                      onClick={() => openResponseModal(request, "accept")}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2 sm:py-2.5 md:py-3 px-3 sm:px-4 rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-1.5 sm:gap-2 shadow-md hover:shadow-lg text-xs sm:text-sm"
                    >
                      <CheckCircle size={16} />
                      Accept Request
                    </button>
                    <button
                      onClick={() => openResponseModal(request, "reject")}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black py-2 sm:py-2.5 md:py-3 px-3 sm:px-4 rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-1.5 sm:gap-2 shadow-md hover:shadow-lg text-xs sm:text-sm"
                    >
                      <XCircle size={16} />
                      Reject Request
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Response Modal */}
      {responseModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-3 md:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl animate-in zoom-in-95 duration-300 max-h-[95vh] flex flex-col">
            {/* Modal Header */}
            <div
              className={`p-3 sm:p-4 md:p-5 lg:p-6 rounded-t-2xl ${
                responseAction === "accept"
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-600"
                  : "bg-gradient-to-r from-red-500 to-red-600"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-black text-white mb-1 sm:mb-2">
                    {responseAction === "accept" ? "Accept" : "Reject"} Tutor Request
                  </h3>
                  <p className="text-white text-xs sm:text-sm font-semibold">
                    Request #{selectedRequest.id} - {selectedRequest.requester_name}
                  </p>
                </div>
                <button
                  onClick={closeResponseModal}
                  className="text-white hover:text-slate-200 transition-colors p-0.5 sm:p-1"
                  disabled={submitting}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-3 sm:p-4 md:p-5 lg:p-6 space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6 overflow-y-auto">
              {/* Request Summary */}
              <div className="bg-slate-50 rounded-xl p-2 sm:p-3 md:p-4 border-2 border-slate-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm">
                  <div>
                    <span className="text-slate-600 font-semibold">Requester:</span>
                    <p className="text-black font-bold">{selectedRequest.requester_name}</p>
                  </div>
                  <div>
                    <span className="text-slate-600 font-semibold">Company:</span>
                    <p className="text-black font-bold">{selectedRequest.requester_company || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-slate-600 font-semibold">Subject:</span>
                    <p className="text-black font-bold">{selectedRequest.subject || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-slate-600 font-semibold">Location:</span>
                    <p className="text-black font-bold">{selectedRequest.location || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Response Message */}
              <div>
                <label className="block font-black text-black mb-2 sm:mb-3 text-xs sm:text-sm">
                  Response Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  placeholder={`Enter your ${responseAction === "accept" ? "acceptance" : "rejection"} message to the requester...`}
                  rows={5}
                  className="w-full px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 rounded-lg border-2 border-slate-300 focus:border-orange focus:outline-none transition-all duration-200 font-medium resize-none text-xs sm:text-sm"
                  disabled={submitting}
                  required
                />
                <p className="text-slate-500 text-xs mt-1 sm:mt-2">
                  {responseAction === "accept"
                    ? "Provide details about available teachers, contact information, or next steps."
                    : "Provide a professional reason for the rejection."}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 sm:pt-3 md:pt-4 border-t-2 border-slate-200">
                <button
                  onClick={closeResponseModal}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 text-black font-black py-2 sm:py-2.5 md:py-3 px-3 sm:px-4 rounded-lg transition-all duration-300 text-xs sm:text-sm"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleResponseSubmit}
                  disabled={submitting || !responseMessage.trim()}
                  className={`flex-1 ${
                    responseAction === "accept" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"
                  } text-white font-black py-2 sm:py-2.5 md:py-3 px-3 sm:px-4 rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-1.5 sm:gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-md hover:shadow-lg text-xs sm:text-sm`}
                >
                  {submitting ? (
                    <>
                      <div className="w-4 sm:w-5 h-4 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      {responseAction === "accept" ? <CheckCircle size={16} /> : <XCircle size={16} />}
                      Confirm {responseAction === "accept" ? "Accept" : "Reject"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast container */}
      <div aria-live="polite" className="fixed top-4 sm:top-6 right-2 sm:right-4 md:right-6 z-50 flex flex-col gap-1.5 sm:gap-2 pointer-events-none max-w-[calc(100vw-1rem)] sm:max-w-[calc(100vw-2rem)] md:max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 rounded-lg shadow-lg text-xs sm:text-sm font-medium text-white transform transition-all duration-300 pointer-events-auto ${
              t.type === "success" ? "bg-emerald-600" : t.type === "info" ? "bg-blue-600" : "bg-red-600"
            }`}
          >
            {t.text}
          </div>
        ))}
      </div>
    </div>
  )
}
