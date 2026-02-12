"use client"

import { useState, useEffect } from "react"
import { Search, Upload, Trash2, Download, FileCheck } from "lucide-react"
import { deleteEmployee } from "../../../Api/Service/apiService"
import CONFIG from "../../../Api/Config/config"

export default function ManageEmployees() {
  const [searchQuery, setSearchQuery] = useState("")
  const [allEmployees, setAllEmployees] = useState([])
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

  useEffect(() => {
    fetchEmployeesFromApi()
  }, [])

  const filteredResults = allEmployees.filter((emp) => {
    if (!searchQuery.trim()) return true

    const searchTerms = searchQuery.toLowerCase().trim().split(/\s+/)

    const name = (emp.name || "").toLowerCase()
    const mobile = (emp.mobile_no || "").toLowerCase()
    const route = (emp.nearest_route || "").toLowerCase()
    const field = (emp.field || "").toLowerCase()
    const location = (emp.location || "").toLowerCase()

    const allFields = `${name} ${mobile} ${route} ${field} ${location}`

    return searchTerms.every((term) => allFields.includes(term))
  })

  function onSearch(e) {
    e && e.preventDefault()
    if (allEmployees.length === 0) {
      showToast("info", "Loading employees...")
    } else if (filteredResults.length === 0) {
      showToast("info", `No employees found matching "${searchQuery}"`)
    } else {
      showToast("success", `Found ${filteredResults.length} employee(s)`)
    }
  }

  async function fetchEmployeesFromApi() {
    try {
      const params = new URLSearchParams({ limit: 200 })
      const url = `${CONFIG.BASE_URL}/api/employees?${params.toString()}`

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000)

      const r = await fetch(url, {
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      const j = await r.json()
      if (j.ok) {
        // Sort by employee_id descending to show newest first
        const sortedRows = (j.rows || []).sort((a, b) => (b.employee_id || 0) - (a.employee_id || 0))
        setAllEmployees(sortedRows)
      } else {
        showToast("error", `API error: ${j.error}`)
      }
    } catch (err) {
      if (err.name === "AbortError") {
        showToast("error", "Request timed out. The server is taking too long to respond.")
      } else {
        showToast("error", `Fetch error: ${err.message}`)
      }
    }
  }

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
          setAllEmployees((prev) =>
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
    if (!confirm(`Are you sure you want to delete employee "${empName}"? This action cannot be undone.`)) {
      return
    }

    try {
      showToast("info", `Deleting employee ${empName}...`)
      const response = await deleteEmployee(empId)

      if (response && response.ok) {
        showToast("success", `Employee ${empName} deleted successfully`)
        setAllEmployees((prev) => prev.filter((emp) => emp.employee_id !== empId))
      } else {
        showToast("error", `Failed to delete: ${response?.error || "Unknown error"}`)
      }
    } catch (err) {
      showToast("error", `Delete error: ${err.message}`)
    }
  }

  function exportToCSV() {
    try {
      // Use filteredResults to export either all data or filtered data
      const dataToExport = filteredResults
      
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
      const url = URL.createObjectURL(blob)
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
      const filterStatus = searchQuery.trim() ? 'filtered' : 'all'
      const filename = `employees_${filterStatus}_${timestamp}.csv`
      
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
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
  ]

  return (
    <div>
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
            <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-black">Employees ({filteredResults.length})</h3>
            <button
              onClick={exportToCSV}
              className="bg-orange text-dark px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-2.5 lg:py-3 rounded-xl font-black hover:opacity-90 transition-all duration-300 transform hover:scale-105 flex items-center gap-2 shadow-md hover:shadow-lg text-xs sm:text-sm md:text-base w-full sm:w-auto justify-center"
            >
              <Download size={14} className="sm:w-4 sm:h-4 md:w-[18px] md:h-[18px]" /> Export to CSV
            </button>
          </div>

          {filteredResults.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">📋</div>
              <p className="text-slate-600 font-semibold">
                {allEmployees.length === 0 ? "Loading employees..." : "No employees found matching your search."}
              </p>
              <p className="text-slate-500 text-sm mt-2">
                {allEmployees.length === 0
                  ? "Please wait while we fetch employee data from the database."
                  : "Try a different search term or clear the search to see all employees."}
              </p>
            </div>
          ) : (
            <div className="h-600 overflow-y-auto" style={{ maxHeight: '600px' }}>
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
                  {filteredResults.map((row, i) => (
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
                                  className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                                    isCVViewed(row.employee_id, col.key === 'cv' ? 'original' : 'masked') ? 'bg-emerald-500' : 'bg-red-500'
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
                            onClick={() => handleDeleteEmployee(row.employee_id, row.name)}
                            className="bg-red-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-red-700 transition-all duration-300 transform hover:scale-105 whitespace-nowrap flex items-center gap-1.5 text-xs shadow-md hover:shadow-lg"
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Toast container */}
      <div aria-live="polite" className="fixed top-6 right-4 sm:right-6 z-50 flex flex-col gap-2 pointer-events-none max-w-[calc(100vw-2rem)] sm:max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`w-full px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white transform transition-all duration-300 pointer-events-auto ${
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
 