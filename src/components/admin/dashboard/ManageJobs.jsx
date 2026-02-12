"use client"

import { useState, useEffect } from "react"
import { Trash2, Plus } from "lucide-react"
import { getJobs, createJob, deleteJob } from "../../../Api/Service/apiService"

export default function ManageJobs() {
  const [jobs, setJobs] = useState([])
  const [form, setForm] = useState({ name: "", experience: "", details: "", location: "" })
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null) // { type: 'success'|'error', text: string }

  useEffect(() => {
    fetchJobs()
  }, [])

  async function fetchJobs() {
    try {
      const json = await getJobs()
      if (json && json.ok) {
        // Reverse to show newest jobs first
        const jobsList = json.jobs || []
        setJobs(jobsList.reverse())
      }
      else setJobs([])
    } catch (err) {
      setJobs([])
    }
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  async function handleAdd(e) {
    e && e.preventDefault()
    if (!form.name.trim()) return
    setLoading(true)
    try {
      const admin_user = localStorage.getItem("agn_admin_user") || ""
      const admin_authenticated = localStorage.getItem("agn_admin_authenticated") || ""

      const payload = {
        admin_user,
        admin_authenticated,
        name: form.name,
        experience: form.experience,
        details: form.details,
        location: form.location,
      }

      const json = await createJob(payload)
      if (json && json.ok) {
        setForm({ name: "", experience: "", details: "", location: "" })
        fetchJobs()
        showToast('success', 'Job posted successfully')
      } else {
        const msg = json && json.error ? json.error : "Failed to create job"
        showToast('error', msg)
      }
    } catch (err) {
      showToast('error', err && err.message ? err.message : 'An error occurred while creating the job')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this job?")) return
    setLoading(true)
    try {
      const admin_user = localStorage.getItem("agn_admin_user") || ""
      const admin_authenticated = localStorage.getItem("agn_admin_authenticated") || ""

      const json = await deleteJob(id, { admin_user, admin_authenticated })
      if (json && json.ok) {
        fetchJobs()
        showToast('success', 'Job deleted')
      } else {
        const msg = json && json.error ? json.error : 'Failed to delete job'
        showToast('error', msg)
      }
    } catch (err) {
      showToast('error', err && err.message ? err.message : 'An error occurred while deleting the job')
    } finally {
      setLoading(false)
    }
  }

  function showToast(type, text, duration = 4000) {
    setToast({ type, text })
    setTimeout(() => setToast(null), duration)
  }

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 pointer-events-auto max-w-sm w-full`}> 
          <div className={`px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
            {toast.text}
          </div>
        </div>
      )}
      <div className="mb-3 sm:mb-4 md:mb-6 lg:mb-8">
        <div className="bg-white rounded-2xl p-3 sm:p-4 md:p-6 border-2 border-slate-200 shadow-lg">
          <h3 className="text-lg sm:text-xl font-black mb-3">Post a Job</h3>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-3">
            <input name="name" value={form.name} onChange={handleChange} placeholder="Job title" className="col-span-1 md:col-span-2 border p-2 rounded" />
            <input name="experience" value={form.experience} onChange={handleChange} placeholder="Experience (e.g. 2+ years)" className="border p-2 rounded" />
            <input name="location" value={form.location} onChange={handleChange} placeholder="Location" className="border p-2 rounded" />
            <textarea name="details" value={form.details} onChange={handleChange} placeholder="Short details" className="col-span-1 md:col-span-4 border p-2 rounded mt-2 md:mt-0" />
            <div className="col-span-1 md:col-span-4 text-right">
              <button disabled={loading} type="submit" className="inline-flex items-center gap-2 bg-orange text-dark font-black px-4 py-2 rounded">
                <Plus size={16} /> {loading ? "Posting..." : "Add Job"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-3 sm:p-4 md:p-6 border-2 border-slate-200 shadow-lg">
        <h3 className="text-lg sm:text-xl font-black mb-4">Existing Jobs</h3>
        {jobs.length === 0 ? (
          <p className="text-sm text-gray-500">No jobs posted yet.</p>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <div key={job.job_id || job.id} className="p-3 rounded-lg border border-slate-100 flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="font-black text-sm">{job.name}</h4>
                    {job.created_at && (
                      <span className="text-xs text-slate-500 ml-2">
                        Posted: {new Date(job.created_at).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600">{job.experience} • {job.location}</p>
                  <p className="text-xs text-slate-700 mt-1 break-words">{job.details}</p>
                </div>
                <div className="flex flex-col items-end gap-2 ml-3">
                  <button onClick={() => handleDelete(job.job_id || job.id)} className="bg-red-600 text-white px-3 py-1 rounded text-xs flex items-center gap-2">
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
