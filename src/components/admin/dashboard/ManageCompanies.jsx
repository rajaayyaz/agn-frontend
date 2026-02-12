"use client"

import { useState, useEffect } from "react"
import { Search, Trash2 } from "lucide-react"
import { deleteEmployer } from "../../../Api/Service/apiService"
import CONFIG from "../../../Api/Config/config"

export default function ManageCompanies() {
  const [searchQuery, setSearchQuery] = useState("")
  const [allCompanies, setAllCompanies] = useState([])
  const [toasts, setToasts] = useState([])

  const showToast = (type, text, duration = 4500) => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, type, text }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), duration)
  }

  useEffect(() => {
    fetchCompaniesFromApi()
  }, [])

  const filteredResults = allCompanies.filter((company) => {
    if (!searchQuery.trim()) return true

    const searchTerms = searchQuery.toLowerCase().trim().split(/\s+/)

    const username = (company.username || "").toLowerCase()
    const companyName = (company.comapny_name || "").toLowerCase()
    const email = (company.email || "").toLowerCase()
  const phone = (company.phone || "").toLowerCase()
  const location = (company.location || "").toLowerCase()
  const referance = (company.referance || "").toLowerCase()

  const allFields = `${username} ${companyName} ${email} ${phone} ${location} ${referance}`

    return searchTerms.every((term) => allFields.includes(term))
  })

  function onSearch(e) {
    e && e.preventDefault()
    if (allCompanies.length === 0) {
      showToast("info", "Loading companies...")
    } else if (filteredResults.length === 0) {
      showToast("info", `No companies found matching "${searchQuery}"`)
    } else {
      showToast("success", `Found ${filteredResults.length} company/companies`)
    }
  }

  async function fetchCompaniesFromApi() {
    try {
      const url = `${CONFIG.BASE_URL}/api/employers`

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000)

      const r = await fetch(url, {
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      const j = await r.json()
      if (j.ok) {
        const userCompanies = j.rows.filter((company) => company.role !== "admin")
        setAllCompanies(userCompanies)
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

  async function handleDeleteCompany(employerId, companyName) {
    if (!confirm(`Are you sure you want to delete company "${companyName}"? This action cannot be undone.`)) {
      return
    }

    try {
      showToast("info", `Deleting company ${companyName}...`)
      const response = await deleteEmployer(employerId)

      if (response && response.ok) {
        showToast("success", `Company ${companyName} deleted successfully`)
        setAllCompanies((prev) => prev.filter((company) => company.employer_id !== employerId))
      } else {
        showToast("error", `Failed to delete: ${response?.error || "Unknown error"}`)
      }
    } catch (err) {
      showToast("error", `Delete error: ${err.message}`)
    }
  }

  const columns = [
    { key: "employer_id", label: "ID" },
    { key: "username", label: "Username" },
    { key: "comapny_name", label: "Company Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "location", label: "Location" },
    { key: "referance", label: "Reference" },
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
            <h2 className="text-sm sm:text-base md:text-lg lg:text-2xl font-black text-black">Search & Filter Companies</h2>
          </div>

          <form onSubmit={onSearch} className="space-y-2 sm:space-y-3 md:space-y-4">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:gap-4">
              <input
                type="text"
                className="flex-1 border-2 border-slate-300 p-2 sm:p-2.5 md:p-3 rounded-xl focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange transition bg-white hover:border-orange font-medium text-sm sm:text-base"
                placeholder="Search by company name, email, phone..."
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
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8 py-2 sm:py-3 md:py-4 lg:py-5 xl:py-6">
            <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-black text-white">Companies ({filteredResults.length})</h3>
          </div>

          {filteredResults.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">🏢</div>
              <p className="text-slate-600 font-semibold">
                {allCompanies.length === 0 ? "Loading companies..." : "No companies found matching your search."}
              </p>
              <p className="text-slate-500 text-sm mt-2">
                {allCompanies.length === 0
                  ? "Please wait while we fetch company data from the database."
                  : "Try a different search term or clear the search to see all companies."}
              </p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block lg:hidden">
                <div className="p-2 sm:p-3 space-y-2 sm:space-y-3">
                  {filteredResults.map((row, i) => (
                    <div
                      key={row.employer_id || i}
                      className="bg-white border-2 border-slate-200 rounded-xl p-3 shadow-md hover:shadow-lg transition-all duration-300"
                    >
                      {/* Header with Company Name */}
                      <div className="flex items-start justify-between mb-2 pb-2 border-b border-slate-200">
                        <div className="flex-1">
                          <h4 className="text-sm font-black text-slate-900">{row.comapny_name || row.username || "-"}</h4>
                          <p className="text-xs text-slate-500 mt-0.5">ID: {row.employer_id}</p>
                        </div>
                      </div>

                      {/* Key Info */}
                      <div className="space-y-2 mb-3">
                        <div className="flex items-start gap-2">
                          <span className="text-xs font-bold text-slate-600 min-w-[70px]">Username:</span>
                          <span className="text-xs text-slate-800">{row.username || "-"}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-xs font-bold text-slate-600 min-w-[70px]">Email:</span>
                          <span className="text-xs text-slate-800 break-all">{row.email || "-"}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-xs font-bold text-slate-600 min-w-[70px]">Phone:</span>
                          <span className="text-xs text-slate-800">{row.phone || "-"}</span>
                        </div>
                          <div className="flex items-start gap-2">
                            <span className="text-xs font-bold text-slate-600 min-w-[70px]">Location:</span>
                            <span className="text-xs text-slate-800">{row.location || "-"}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-xs font-bold text-slate-600 min-w-[70px]">Reference:</span>
                            <span className="text-xs text-slate-800">{row.referance || "-"}</span>
                          </div>
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => handleDeleteCompany(row.employer_id, row.comapny_name || row.username)}
                        className="w-full bg-red-600 text-white px-3 py-2 rounded-lg font-semibold hover:bg-red-700 transition-all duration-300 flex items-center justify-center gap-1.5 text-xs shadow-md"
                      >
                        <Trash2 size={14} /> Delete Company
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Desktop Table View */}
              <div
                className="hidden lg:block"
                style={{
                  width: "100%",
                  overflowX: "auto",
                  overflowY: "visible",
                  WebkitOverflowScrolling: "touch",
                }}
              >
                <table
                  className="text-left text-sm border-collapse"
                  style={{ width: "max-content", minWidth: "2000px", tableLayout: "fixed" }}
                >
                  <thead className="bg-orange border-b-2 border-orange">
                    <tr>
                      {columns.map((col) => (
                        <th
                          key={col.key}
                          className="px-6 py-4 font-black text-black whitespace-nowrap"
                          style={{ minWidth: "200px" }}
                        >
                          {col.label}
                        </th>
                      ))}
                      <th
                        className="px-6 py-4 font-black text-black whitespace-nowrap"
                        style={{ minWidth: "250px", width: "250px" }}
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResults.map((row, i) => (
                      <tr
                        key={row.employer_id || i}
                        className={`border-b-2 transition-all duration-300 hover:bg-light border-b-slate-200 ${
                          i % 2 === 0 ? "bg-white" : "bg-slate-50"
                        }`}
                      >
                        {columns.map((col) => (
                          <td
                            key={col.key}
                            className="px-6 py-4 text-slate-700 font-medium"
                            style={{ minWidth: "200px" }}
                          >
                            {String(row[col.key] ?? "-")}
                          </td>
                        ))}
                        <td className="px-6 py-4" style={{ minWidth: "250px", width: "250px" }}>
                          <button
                            onClick={() => handleDeleteCompany(row.employer_id, row.comapny_name || row.username)}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-all duration-300 transform hover:scale-105 whitespace-nowrap flex items-center gap-2 shadow-md hover:shadow-lg"
                          >
                            <Trash2 size={16} /> Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
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
