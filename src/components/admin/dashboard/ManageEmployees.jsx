"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Search, Upload, Trash2, Download, FileCheck, MessageCircle } from "lucide-react"
import Modal from "../../common/Modal"
import { deleteEmployee } from "../../../Api/Service/apiService"
import CONFIG from "../../../Api/Config/config"

export default function ManageEmployees() {
  const [searchQuery, setSearchQuery] = useState("")
  const [employees, setEmployees] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const scrollContainerRef = useRef(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)

  const [toasts, setToasts] = useState([])
  const [viewedCVs, setViewedCVs] = useState({})

  const showToast = (type, text, duration = 4500) => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, type, text }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), duration)
  }

  // Load viewed CVs from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('agn_viewed_cvs')
      if (stored) {
        setViewedCVs(JSON.parse(stored))
      }
    } catch (err) {
      console.error('Error loading viewed CVs:', err)
    }
  }, [])

  // Mark CV as viewed
  const markCVAsViewed = (empId, cvType) => {
    const key = `${empId}_${cvType}`
    const timestamp = new Date().toISOString()
    const updated = { ...viewedCVs, [key]: timestamp }
    setViewedCVs(updated)
    try {
      localStorage.setItem('agn_viewed_cvs', JSON.stringify(updated))
    } catch (err) {
      console.error('Error saving viewed CV:', err)
    }
  }

  // Check if CV has been viewed
  const isCVViewed = (empId, cvType) => {
    const key = `${empId}_${cvType}`
    return !!viewedCVs[key]
  }

  // Handle CV view - opens in new tab
  const handleCVView = (url, empId, cvType) => {
    if (!url) return
    markCVAsViewed(empId, cvType)
    window.open(url, '_blank')
  }

  // Handle CV download with proper filename
  const handleCVDownload = async (emp) => {
    const url = emp.masked_cv || emp.cv
    if (!url) {
      showToast("error", "No CV available to download")
      return
    }

    try {
      // Create proper filename
      const cleanName = (emp.name || 'Employee').replace(/[^a-zA-Z0-9]/g, '_')
      const extension = url.toLowerCase().includes('.docx') ? '.docx' : '.pdf'
      const filename = `${cleanName}_CV${extension}`

      showToast("info", "Downloading CV...")

      // Fetch and download with proper name
      const response = await fetch(url)
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)

      showToast("success", `Downloaded: ${filename}`)
    } catch (err) {
      showToast("error", "Download failed. Please try again.")
      console.error('Download error:', err)
    }
  }

  // Initial fetch
  useEffect(() => {
    // Fetch first page (offset 0)
    fetchEmployees(0, "", false)
  }, [])

  const PAGE_SIZE = 50
  const isFetchingRef = useRef(false)

  const fetchEmployees = useCallback(async (currentOffset, search, append = false) => {
    // Prevent concurrent fetches
    if (isFetchingRef.current) return
    isFetchingRef.current = true

    if (append) {
      setIsLoadingMore(true)
    } else {
      setIsLoading(true)
    }

    try {
      const params = new URLSearchParams({
        limit: PAGE_SIZE.toString(),
        offset: currentOffset.toString(),
        search: search
      })

      const fetchUrl = `${CONFIG.BASE_URL}/api/employees?${params.toString()}`

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000)

      const r = await fetch(fetchUrl, { signal: controller.signal })
      clearTimeout(timeoutId)

      const j = await r.json()
      if (j.ok) {
        const rows = j.rows || []

        // Update total count from API
        if (j.total !== undefined) {
          setTotalCount(j.total)
        } else if (!append) {
          // Fallback if API doesn't return total yet
          setTotalCount(rows.length)
        }

        if (append) {
          setEmployees(prev => {
            const existingIds = new Set(prev.map(e => e.employee_id))
            const newRows = rows.filter(row => !existingIds.has(row.employee_id))
            return [...prev, ...newRows]
          })
        } else {
          setEmployees(rows)
        }

        setHasMore(rows.length >= PAGE_SIZE)
        setOffset(currentOffset + rows.length)
      } else {
        showToast("error", `API error: ${j.error}`)
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        showToast("error", `Fetch error: ${err.message}`)
      }
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
      isFetchingRef.current = false
    }
  }, [searchQuery])

  function onSearch(e) {
    if (e) e.preventDefault()
    // Reset and fetch
    setOffset(0)
    setHasMore(true)
    fetchEmployees(0, searchQuery, false)
  }

  // Infinite Scroll Handler
  useEffect(() => {
    if (!hasMore || isLoading || isLoadingMore) return

    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer
      if (scrollTop + clientHeight >= scrollHeight - 300) {
        if (hasMore && !isFetchingRef.current) {
          fetchEmployees(offset, searchQuery, true)
        }
      }
    }

    scrollContainer.addEventListener('scroll', handleScroll)
    return () => scrollContainer.removeEventListener('scroll', handleScroll)
  }, [hasMore, isLoading, isLoadingMore, offset, searchQuery, fetchEmployees])

  function updateCvForEmployee(empId) {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".pdf,.doc,.docx"
    input.onchange = async () => {
      const file = input.files[0]
      if (!file) return
      const fd = new FormData()
      fd.append("cv", file)
      showToast("info", `Uploading CV for ${empId}...`)
      try {
        const r = await fetch(`${CONFIG.BASE_URL}/api/employee/${empId}/update_cv`, {
          method: "POST",
          body: fd,
        })
        const j = await r.json()
        if (j.ok) {
          showToast("success", `Updated CV for ${empId}`)
          setEmployees((prev) =>
            prev.map((row) => (row.employee_id === empId ? { ...row, cv: j.cv_url, masked_cv: j.masked_cv_url } : row)),
          )
        } else {
          showToast("error", `Error: ${j.error}`)
        }
      } catch (err) {
        showToast("error", `Upload error: ${err.message}`)
      }
    }
    input.click()
  }

  async function handleWhatsAppShare(emp) {
    // emp is the employee row object
    try {
      const cvLink = emp?.masked_cv || emp?.cv
      if (!cvLink) {
        showToast("error", `No CV available for ${emp?.name || 'this employee'}`)
        return
      }

      // Create a well-formatted message with employee details
      const message = [
        `CANDIDATE PROFILE`,
        `━━━━━━━━━━━━━━━━`,
        ``,
        `Name: ${emp?.name || 'N/A'}`,
        emp?.field ? `Field: ${emp.field}` : null,
        emp?.experience ? `Experience: ${emp.experience}` : null,
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

  async function handleDeleteEmployee(empId, empName) {
    // Custom confirmation logic or standard confirm
    if (!confirm(`Are you sure you want to delete employee "${empName}"? This action cannot be undone.`)) {
      return
    }

    try {
      showToast("info", `Deleting employee ${empName}...`)
      const response = await deleteEmployee(empId)

      if (response && response.ok) {
        showToast("success", `Employee ${empName} deleted successfully`)
        setEmployees((prev) => prev.filter((emp) => emp.employee_id !== empId))
      } else {
        showToast("error", `Failed to delete: ${response?.error || "Unknown error"}`)
      }
    } catch (err) {
      showToast("error", `Delete error: ${err.message}`)
    }
  }

  async function exportToCSV() {
    try {
      showToast("info", "Preparing export... fetching all records.")

      // Fetch ALL records for the export, matching current search
      // We use a high limit to get everything.
      const params = new URLSearchParams({
        limit: "100000",
        offset: "0",
        search: searchQuery
      })
      const exportUrl = `${CONFIG.BASE_URL}/api/employees?${params.toString()}`
      const r = await fetch(exportUrl)
      const j = await r.json()

      if (!j.ok) {
        throw new Error(j.error || "Failed to fetch data")
      }

      const dataToExport = j.rows || []

      if (dataToExport.length === 0) {
        showToast("error", "No data to export")
        return
      }

      // Define CSV headers based on columns
      const headers = columns.map(col => col.label)

      // Convert data to CSV format
      const csvRows = []

      // Add header row
      csvRows.push(headers.join(','))

      // Add data rows
      dataToExport.forEach(row => {
        const values = columns.map(col => {
          const value = row[col.key] ?? ''
          // Escape quotes and wrap in quotes if contains comma, quote, or newline
          const stringValue = String(value)
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`
          }
          return stringValue
        })
        csvRows.push(values.join(','))
      })

      // Create CSV string
      const csvString = csvRows.join('\n')

      // Create blob and download
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const blobUrl = URL.createObjectURL(blob)

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
      const filterStatus = searchQuery.trim() ? 'filtered' : 'all'
      const filename = `employees_${filterStatus}_${timestamp}.csv`

      link.setAttribute('href', blobUrl)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(blobUrl)

      showToast("success", `Exported ${dataToExport.length} employee(s) to ${filename}`)
    } catch (err) {
      showToast("error", `Export error: ${err.message}`)
    }
  }

  const columns = [
    { key: "name", label: "Employee Name", width: "auto", maxWidth: "200px" },
    { key: "age", label: "Age", width: "auto", maxWidth: "100px" },
    { key: "mobile_no", label: "Mobile Number", width: "auto", maxWidth: "150px" },
    { key: "location", label: "Location", width: "auto", maxWidth: "150px" },
    { key: "nearest_route", label: "Nearest Route", width: "auto", maxWidth: "150px" },
    { key: "educational_profile", label: "Education Profile", width: "auto", maxWidth: "200px" },
    { key: "recent_completed_education", label: "Recent Education", width: "auto", maxWidth: "200px" },
    { key: "field", label: "Field of Expertise", width: "auto", maxWidth: "180px" },
    { key: "experience", label: "Experience", width: "auto", maxWidth: "150px" },
    { key: "cv", label: "CV Link", width: "auto", maxWidth: "120px" },
    { key: "masked_cv", label: "Masked CV Link", width: "auto", maxWidth: "150px" },
    { key: "agreement_pdf_url", label: "Agreement PDF", width: "auto", maxWidth: "150px" },
    { key: "status", label: "Status", width: "auto", maxWidth: "120px" },
  ]

  const [confirmDialog, setConfirmDialog] = useState(null) // { empId, empName }

  async function handleMarkAppointed() {
    if (!confirmDialog) return
    const { empId, empName } = confirmDialog

    try {
      const token = localStorage.getItem('agn_auth_token')
      if (!token) {
        showToast("error", "Session expired. Please re-login as admin.")
        setConfirmDialog(null)
        return
      }
      showToast("info", `Updating status for ${empName}...`)
      const response = await fetch(`${CONFIG.BASE_URL}/api/employees/${empId}/appoint`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      })

      if (response.status === 401) {
        showToast("error", "Session expired. Please re-login as admin.")
        setConfirmDialog(null)
        return
      }

      const j = await response.json()

      if (j.ok) {
        showToast("success", `${empName} marked as Appointed!`)
        setEmployees(prev => prev.map(emp =>
          emp.employee_id === empId ? { ...emp, status: 'appointed' } : emp
        ))
      } else {
        showToast("error", `Failed: ${j.error}`)
      }
    } catch (err) {
      showToast("error", `Error: ${err.message}`)
    } finally {
      setConfirmDialog(null)
    }
  }

  async function markAsAppointed(empId, empName) {
    setConfirmDialog({ empId, empName })
  }

  function handleWhatsAppChat(emp) {
    const phone = emp?.mobile_no
    if (!phone) {
      showToast("error", `No phone number for ${emp?.name || 'this employee'}`)
      return
    }
    // Clean: remove spaces, dashes, parens, + sign
    let cleaned = phone.replace(/[\s\-\(\)\+]/g, '')
    // Ensure country code (Pakistan: if starts with 0, replace with 92)
    if (cleaned.startsWith('0')) {
      cleaned = '92' + cleaned.slice(1)
    }
    window.open(`https://wa.me/${cleaned}`, '_blank')
  }

  return (
    <div>
      {/* Confirmation Toast is rendered in the toast container below */}

      {/* Search Section */}
      <div className="mb-3 sm:mb-4 md:mb-6 lg:mb-8">
        <div className="bg-white rounded-2xl p-2 sm:p-3 md:p-4 lg:p-6 xl:p-8 border-2 border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 md:mb-4 lg:mb-6">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange rounded-full flex items-center justify-center shadow-md flex-shrink-0">
              <Search size={16} className="text-black font-bold sm:w-5 sm:h-5" />
            </div>
            <h2 className="text-sm sm:text-base md:text-lg lg:text-2xl font-black text-black">Search & Filter Candidates</h2>
          </div>

          <form onSubmit={onSearch} className="space-y-2 sm:space-y-3 md:space-y-4">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:gap-4">
              <input
                type="text"
                className="flex-1 border-2 border-slate-300 p-2 sm:p-2.5 md:p-3 rounded-xl focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange transition bg-white hover:border-orange font-medium text-sm sm:text-base"
                placeholder="Search by name, email, phone, field..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="submit"
                className="bg-black text-orange px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-xl font-black hover:bg-slate-900 transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 shadow-md hover:shadow-lg text-xs sm:text-sm md:text-base w-full sm:w-auto"
              >
                <Search size={16} className="sm:w-[18px] sm:h-[18px]" /> Search
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Results Table */}
      <div className="w-full">
        <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-lg overflow-hidden">
          <div className="bg-slate-900 text-white px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8 py-2 sm:py-3 md:py-4 lg:py-5 xl:py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
            <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-black">Employees ({totalCount})</h3>
            <button
              onClick={exportToCSV}
              className="bg-orange text-dark px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-2.5 lg:py-3 rounded-xl font-black hover:opacity-90 transition-all duration-300 transform hover:scale-105 flex items-center gap-2 shadow-md hover:shadow-lg text-xs sm:text-sm md:text-base w-full sm:w-auto justify-center"
            >
              <Download size={14} className="sm:w-4 sm:h-4 md:w-[18px] md:h-[18px]" /> Export to CSV
            </button>
          </div>

          {employees.length === 0 && !isLoading ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">📋</div>
              <p className="text-slate-600 font-semibold">
                No employees found matching your search.
              </p>
              <p className="text-slate-500 text-sm mt-2">
                Try a different search term or clear the search to see all employees.
              </p>
            </div>
          ) : (
            <div ref={scrollContainerRef} className="h-600 overflow-y-auto" style={{ maxHeight: '600px' }}>
              <table className="w-full min-w-full divide-y divide-gray-200 text-left text-sm">
                <thead className="bg-orange border-b-2 border-orange sticky top-0 z-10">
                  <tr>
                    {columns.map((col) => (
                      <th key={col.key} className="px-6 py-3 text-xs font-medium tracking-wider uppercase text-black">
                        {col.label}
                      </th>
                    ))}
                    <th className="px-6 py-3 text-xs font-medium tracking-wider uppercase text-black">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {employees.map((row, i) => (
                    <tr key={row.employee_id || i} className="hover:bg-gray-50">
                      {columns.map((col) => (
                        <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate" style={{ maxWidth: col.maxWidth }}>
                          {col.key === "cv" || col.key === "masked_cv" ? (
                            row[col.key] ? (
                              <button
                                onClick={() => handleCVView(row[col.key], row.employee_id, col.key === 'cv' ? 'original' : 'masked')}
                                className="text-blue-600 hover:text-blue-800 underline font-semibold flex items-center gap-2"
                              >
                                <span
                                  className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isCVViewed(row.employee_id, col.key === 'cv' ? 'original' : 'masked') ? 'bg-emerald-500' : 'bg-red-500'
                                    }`}
                                  title={isCVViewed(row.employee_id, col.key === 'cv' ? 'original' : 'masked') ? 'Viewed' : 'Not viewed'}
                                />
                                View
                              </button>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )
                          ) : col.key === "agreement_pdf_url" ? (
                            row[col.key] ? (
                              <button
                                onClick={() => window.open(row[col.key], '_blank')}
                                className="text-green-600 hover:text-green-800 underline font-semibold flex items-center gap-2"
                              >
                                <FileCheck size={16} />
                                View
                              </button>
                            ) : row.agreement_accepted ? (
                              <span className="text-amber-600 text-xs">Pending</span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )
                          ) : col.key === "status" ? (
                            row.status === 'appointed' ? (
                              <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full border border-emerald-300 shadow-sm">
                                ✓ Appointed
                              </span>
                            ) : (
                              <button
                                onClick={() => markAsAppointed(row.employee_id, row.name)}
                                className="bg-orange/10 text-orange text-xs font-bold px-4 py-1.5 rounded-full border border-orange/40 hover:bg-orange hover:text-black transition-all duration-300 shadow-sm hover:shadow-lg whitespace-nowrap min-w-[120px]"
                                title="Click to mark as appointed"
                              >
                                Mark Appointed
                              </button>
                            )
                          ) : (
                            String(row[col.key] ?? "-")
                          )}
                        </td>
                      ))}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateCvForEmployee(row.employee_id)}
                            className="bg-blue-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 whitespace-nowrap flex items-center gap-1.5 text-xs shadow-md hover:shadow-lg"
                          >
                            <Upload size={14} /> Update
                          </button>
                          <button
                            onClick={() => handleCVDownload(row)}
                            className="bg-purple-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-purple-700 transition-all duration-300 transform hover:scale-105 whitespace-nowrap flex items-center gap-1.5 text-xs shadow-md hover:shadow-lg"
                            disabled={!row.masked_cv && !row.cv}
                          >
                            <Download size={14} /> Download
                          </button>
                          <button
                            onClick={() => handleWhatsAppShare(row)}
                            className="bg-emerald-500 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-emerald-600 transition-all duration-300 transform hover:scale-105 whitespace-nowrap flex items-center gap-1.5 text-xs shadow-md hover:shadow-lg"
                          >
                            <span className="text-sm">📲</span> Share
                          </button>
                          <button
                            onClick={() => handleWhatsAppChat(row)}
                            className="bg-green-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-green-700 transition-all duration-300 transform hover:scale-105 whitespace-nowrap flex items-center gap-1.5 text-xs shadow-md hover:shadow-lg ring-1 ring-green-600/20"
                            title={`Chat with ${row.name} on WhatsApp`}
                          >
                            <MessageCircle size={14} className="fill-current" /> Chat
                          </button>
                          <button
                            onClick={() => handleDeleteEmployee(row.employee_id, row.name)}
                            className="bg-red-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-red-700 transition-all duration-300 transform hover:scale-105 whitespace-nowrap flex items-center gap-1.5 text-xs shadow-md hover:shadow-lg"
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {/* Loading indicator at bottom */}
                  {isLoading || isLoadingMore ? (
                    <tr>
                      <td colSpan={columns.length + 1} className="text-center py-4">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange"></div>
                        <span className="ml-2 text-slate-600">Loading more employees...</span>
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={!!confirmDialog}
        onClose={() => setConfirmDialog(null)}
        title="Confirm Appointment"
      >
        <div className="flex flex-col items-center text-center">
          <div className="p-4 bg-orange/10 rounded-full text-orange mb-4">
            <FileCheck size={32} strokeWidth={2.5} />
          </div>
          <p className="text-gray-600 mb-8 text-base leading-relaxed">
            Are you sure you want to mark <span className="font-bold text-gray-900">{confirmDialog?.empName}</span> as appointed?
          </p>
          <div className="flex gap-3 w-full">
            <button
              onClick={() => setConfirmDialog(null)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleMarkAppointed}
              className="flex-1 px-4 py-2.5 rounded-xl bg-orange text-white font-bold hover:bg-orange/90 transition-colors shadow-lg shadow-orange/20"
            >
              Confirm
            </button>
          </div>
        </div>
      </Modal>

      {/* Toast container - Top Right */}
      <div aria-live="polite" className="fixed top-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none max-w-sm w-full">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`w-full px-4 py-3 rounded-xl shadow-lg border text-sm font-bold flex items-center justify-between pointer-events-auto animate-in slide-in-from-bottom-5 fade-in ${t.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : t.type === "info"
                  ? "bg-blue-50 text-blue-800 border-blue-200"
                  : "bg-red-50 text-red-800 border-red-200"
              }`}
          >
            <span>{t.text}</span>
            <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} className="ml-3 opacity-50 hover:opacity-100 p-1 flex-shrink-0">✕</button>
          </div>
        ))}
      </div>
    </div>
  )
}
