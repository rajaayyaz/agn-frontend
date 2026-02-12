"use client"

import {
  ArrowRight,
  Menu,
  X,
  Phone,
  Mail,
  MapPin,
  Linkedin,
  Twitter,
  Upload,
  CheckCircle,
  AlertCircle,
  Home,
  Info,
  MessageSquare,
  Briefcase,
  Award,
  Users,
  TrendingUp,
  Star,
  Zap,
  Target,
  Clock,
} from "lucide-react"
import { useState, useEffect } from "react"
import NavBar from "../shared/NavBar"
import CONFIG from "../../Api/Config/config"

export default function ApplyPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [showResultModal, setShowResultModal] = useState(false)
  const [resultType, setResultType] = useState(null) // 'success' or 'error'
  const [resultMessage, setResultMessage] = useState("")
  const [pendingSubmission, setPendingSubmission] = useState(null)
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    email: "",
    mobile_no: "",
    location: "",
    nearest_route: "",
    cnic_no: "",
    educational_profile: "",
    recent_completed_education: "",
    applying_for: "",
    experience: "",
    experience_detail: "",
    subjects: "",
  })
  const [cvFile, setCvFile] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  // Prefill applying_for from URL param ?job=... or ?type=teaching
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const job = params.get('job')
      const type = params.get('type')
      
      if (type === 'teaching') {
        setFormData((f) => ({ ...f, applying_for: 'Teacher' }))
      } else if (job) {
        setFormData((f) => ({ ...f, applying_for: decodeURIComponent(job) }))
      }
    } catch (e) {
      // ignore in SSR
    }
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) {
      setCvFile(null)
      return
    }
    // Validate file type and size (5MB max)
    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]
    if (!allowed.includes(file.type) && !/\.pdf$|\.docx?$/.test(file.name.toLowerCase())) {
      setResultType('error')
      setResultMessage('Only PDF or Word files are allowed (PDF, DOC, DOCX).')
      setShowResultModal(true)
      setCvFile(null)
      e.target.value = ''
      return
    }
    const maxBytes = 5 * 1024 * 1024
    if (file.size > maxBytes) {
      setResultType('error')
      setResultMessage('File too large. Maximum allowed size is 5MB.')
      setShowResultModal(true)
      setCvFile(null)
      e.target.value = ''
      return
    }
    setCvFile(file)
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!formData.name || !formData.email || !formData.mobile_no) {
      setResultType('error')
      setResultMessage('Please fill in all required fields (Name, Email, Mobile Number)')
      setShowResultModal(true)
      return
    }

    if (!cvFile) {
      setResultType('error')
      setResultMessage('Please upload your CV')
      setShowResultModal(true)
      return
    }

    // Store form data and show T&C modal
    const data = new FormData()
    Object.keys(formData).forEach((key) => {
      data.append(key, formData[key])
    })
    if (cvFile) {
      data.append("cv", cvFile)
    }
    
    setPendingSubmission(data)
    setShowTermsModal(true)
  }

  const handleAgreementAccept = () => {
    if (!pendingSubmission) return
    
    setShowTermsModal(false)
    setIsLoading(true)
    
    // Add agreement acceptance to form data
    const data = pendingSubmission
    data.append("agreement_accepted", "true")
    data.append("agreement_timestamp", new Date().toISOString())

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 second timeout

    fetch(`${CONFIG.BASE_URL}/insert_employee`, {
      method: "POST",
      body: data,
      signal: controller.signal,
    })
      .then(async (response) => {
        clearTimeout(timeoutId)
        const result = await response.json()
        
        if (!response.ok) {
          // Backend returned an error (400, 500, etc.)
          // Extract the error message from the JSON response
          const errorMsg = result.error || `Server error: ${response.status}`
          throw new Error(errorMsg)
        }
        return result
      })
      .then((result) => {
        setIsLoading(false)
        setPendingSubmission(null)
        setResultType('success')
        setResultMessage('Application submitted successfully! We\'ll review your application and get in touch soon with next steps.')
        setShowResultModal(true)
        setFormData({
          name: "",
          age: "",
          email: "",
          mobile_no: "",
          location: "",
          nearest_route: "",
          cnic_no: "",
          educational_profile: "",
          recent_completed_education: "",
          applying_for: "",
          experience: "",
          experience_detail: "",
        })
        setCvFile(null)
        // Reset file input
        const fileInput = document.querySelector('input[type="file"]')
        if (fileInput) fileInput.value = ''
      })
      .catch((error) => {
        setIsLoading(false)
        setPendingSubmission(null)
        
        let errorMsg = "Failed to submit application. Please try again or contact support."
        
        // Check specific error types in order of priority
        if (error.name === "AbortError") {
          errorMsg = "Request timeout. Please check your connection and try again."
        } else if (error.message && error.message.includes("Failed to fetch")) {
          errorMsg = "Unable to connect to server. Please ensure the backend is running and try again."
        } else if (error.message && !error.message.includes("Server error:")) {
          // Use the backend's specific error message (like Canva rejection)
          // Skip generic "Server error: 400" messages
          errorMsg = error.message
        }
        
        setResultType('error')
        setResultMessage(errorMsg)
        setShowResultModal(true)
      })
  }

  const handleAgreementReject = () => {
    setShowTermsModal(false)
    setPendingSubmission(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Shared Navigation */}
      <NavBar />

      {/* Terms and Conditions Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 h-screen">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-fadeIn">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-orange to-yellow-400 px-6 py-4">
              <h2 className="text-2xl font-bold text-black">Service Agreement - Please Review</h2>
              <p className="text-sm text-gray-700 mt-1">You must accept this agreement to proceed with your application</p>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded">
                <p className="text-sm font-semibold text-blue-900">
                  📋 This agreement will be digitally signed and stored securely. You will be legally bound by its terms upon acceptance.
                </p>
                <p className="text-sm font-semibold text-blue-900 mt-2" dir="rtl">
                  📋 یہ معاہدہ ڈیجیٹل طور پر دستخط شدہ اور محفوظ طریقے سے محفوظ کیا جائے گا۔ قبولیت کے بعد آپ اس کی شرائط سے قانونی طور پر پابند ہوں گے۔
                </p>
              </div>
              
              <div className="prose prose-sm max-w-none">
                <h3 className="text-lg font-bold text-black mb-3">JOB PLACEMENT SERVICE AGREEMENT</h3>
                <h3 className="text-lg font-bold text-black mb-3" dir="rtl">ملازمت کی جگہ کی خدمات کا معاہدہ</h3>
                
                <p className="text-gray-700 mb-2 leading-relaxed">
                  This Service Agreement ("Agreement") is entered into on <strong>{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</strong> between:
                </p>
                <p className="text-gray-700 mb-4 leading-relaxed" dir="rtl">
                  یہ سروس معاہدہ ("معاہدہ") <strong>{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</strong> کو درج ذیل کے درمیان طے پایا:
                </p>
                
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <p className="font-semibold text-black mb-2">APPLICANT:</p>
                  <p className="font-semibold text-black mb-2" dir="rtl">درخواست دہندہ:</p>
                  <p className="text-gray-700"><strong>Name:</strong> {formData.name || "[Your Name]"}</p>
                  <p className="text-gray-700" dir="rtl"><strong>نام:</strong> {formData.name || "[آپ کا نام]"}</p>
                  <p className="text-gray-700"><strong>Email:</strong> {formData.email || "[Your Email]"}</p>
                  <p className="text-gray-700" dir="rtl"><strong>ای میل:</strong> {formData.email || "[آپ کی ای میل]"}</p>
                  <p className="text-gray-700"><strong>CNIC:</strong> {formData.cnic_no || "[Your CNIC]"}</p>
                  <p className="text-gray-700" dir="rtl"><strong>شناختی کارڈ:</strong> {formData.cnic_no || "[آپ کا شناختی کارڈ]"}</p>
                  <p className="text-gray-700"><strong>Position Applied:</strong> {formData.applying_for || "[Position]"}</p>
                  <p className="text-gray-700" dir="rtl"><strong>درخواست شدہ عہدہ:</strong> {formData.applying_for || "[عہدہ]"}</p>
                </div>
                
                <p className="text-gray-700 mb-2">and</p>
                <p className="text-gray-700 mb-4" dir="rtl">اور</p>
                
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <p className="font-semibold text-black mb-2">SERVICE PROVIDER:</p>
                  <p className="font-semibold text-black mb-2" dir="rtl">خدمات فراہم کنندہ:</p>
                  <p className="text-gray-700">AGN Job Bank</p>
                  <p className="text-gray-700">Email: agnjobbank123@gmail.com</p>
                </div>

                <h4 className="text-base font-bold text-black mt-6 mb-3">1. SERVICE TERMS</h4>
                <h4 className="text-base font-bold text-black mb-3" dir="rtl">۱۔ خدمات کی شرائط</h4>
                <p className="text-gray-700 mb-2 leading-relaxed">
                  I, <strong>{formData.name || "[Applicant Name]"}</strong>, hereby acknowledge and agree that:
                </p>
                <p className="text-gray-700 mb-4 leading-relaxed" dir="rtl">
                  میں، <strong>{formData.name || "[درخواست دہندہ کا نام]"}</strong>، اس بات کو تسلیم کرتا/کرتی ہوں اور اس سے اتفاق کرتا/کرتی ہوں کہ:
                </p>
                
                <ol className="list-decimal pl-6 space-y-3 mb-6 text-gray-700">
                  <li>AGN Job Bank will provide job placement services to assist me in securing employment.</li>
                  <li dir="rtl">AGN جاب بینک مجھے ملازمت حاصل کرنے میں مدد کے لیے جاب پلیسمنٹ کی خدمات فراہم کرے گا۔</li>
                  <li>Upon successful job placement and official appointment by an employer arranged through AGN Job Bank, I agree to pay a <strong className="text-red-600">one-time service fee of 50% (fifty percent) of my first complete monthly salary</strong>, including all bonuses and allowances.</li>
                  <li dir="rtl">کامیاب جاب پلیسمنٹ اور AGN جاب بینک کے ذریعے منظم کردہ آجر کی طرف سے سرکاری تقرری پر، میں <strong className="text-red-600">اپنی پہلی مکمل ماہانہ تنخواہ کا 50% (پچاس فیصد) ایک بار کی سروس فیس</strong> ادا کرنے پر راضی ہوں، جس میں تمام بونس اور الاؤنسز شامل ہیں۔</li>
                  <li>This payment shall be made within <strong>30 days of receiving my first salary</strong> from the employer.</li>
                  <li dir="rtl">یہ ادائیگی آجر سے <strong>میری پہلی تنخواہ وصول کرنے کے 30 دنوں کے اندر</strong> کی جائے گی۔</li>
                  <li>If I voluntarily leave the job within the first month, the service fee remains payable on a pro-rata basis as per the days worked.</li>
                  <li dir="rtl">اگر میں پہلے مہینے کے اندر رضاکارانہ طور پر نوکری چھوڑ دیتا/دیتی ہوں، تو سروس فیس کام کیے گئے دنوں کے مطابق تناسب کی بنیاد پر قابل ادائیگی رہے گی۔</li>
                </ol>

                <h4 className="text-base font-bold text-black mt-6 mb-3">2. PAYMENT OBLIGATION</h4>
                <h4 className="text-base font-bold text-black mb-3" dir="rtl">۲۔ ادائیگی کی ذمہ داری</h4>
                <p className="text-gray-700 mb-2 leading-relaxed">
                  The service fee is calculated as: <strong>First Complete Monthly Salary × 50% = Service Fee</strong>
                </p>
                <p className="text-gray-700 mb-4 leading-relaxed" dir="rtl">
                  سروس فیس کا حساب اس طرح کیا جاتا ہے: <strong>پہلی مکمل ماہانہ تنخواہ × 50% = سروس فیس</strong>
                </p>
                
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                  <p className="text-sm text-yellow-900 mb-1">
                    <strong>Example:</strong> If your first month salary is £2,000, you will pay £1,000 to AGN Job Bank as a one-time service fee.
                  </p>
                  <p className="text-sm text-yellow-900" dir="rtl">
                    <strong>مثال:</strong> اگر آپ کی پہلے مہینے کی تنخواہ £2,000 ہے، تو آپ AGN جاب بینک کو £1,000 ایک بار کی سروس فیس کے طور پر ادا کریں گے۔
                  </p>
                </div>

                <h4 className="text-base font-bold text-black mt-6 mb-3">3. LEGAL ACKNOWLEDGMENT</h4>
                
                <h4 className="text-base font-bold text-black mb-3" dir="rtl">۳۔ قانونی تسلیم</h4>
                <p className="text-gray-700 mb-2 leading-relaxed">
                  By clicking "Accept & Submit" below, I certify that:
                </p>
                <p className="text-gray-700 mb-4 leading-relaxed" dir="rtl">
                  نیچے "قبول کریں اور جمع کروائیں" پر کلک کرکے، میں تصدیق کرتا/کرتی ہوں کہ:
                </p>
                <ul className="list-disc pl-6 space-y-2 mb-3 text-gray-700">
                  <li>I have read and understood all terms of this agreement</li>
                  <li>I agree to be legally bound by these terms</li>
                  <li>All information provided in my application is true and accurate</li>
                  <li>I will fulfill my payment obligation as stated above</li>
                </ul>
                <ul className="list-disc pr-6 space-y-2 mb-6 text-gray-700" dir="rtl">
                  <li>میں نے اس معاہدے کی تمام شرائط پڑھی اور سمجھی ہیں</li>
                  <li>میں ان شرائط سے قانونی طور پر پابند ہونے پر راضی ہوں</li>
                  <li>میری درخواست میں فراہم کردہ تمام معلومات سچی اور درست ہیں</li>
                  <li>میں اوپر بیان کردہ اپنی ادائیگی کی ذمہ داری پوری کروں گا/گی</li>
                </ul>
                
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mt-6 rounded">
                  <p className="text-sm text-red-900 mb-2">
                    <strong>⚠️ Important:</strong> This is a legally binding agreement. Non-payment may result in legal action. 
                    For questions, contact: <a href="mailto:agnjobbank123@gmail.com" className="text-orange hover:underline">agnjobbank123@gmail.com</a>
                  </p>
                  <p className="text-sm text-red-900" dir="rtl">
                    <strong>⚠️ اہم:</strong> یہ ایک قانونی طور پر پابند کرنے والا معاہدہ ہے۔ عدم ادائیگی کے نتیجے میں قانونی کارروائی ہو سکتی ہے۔
                    سوالات کے لیے رابطہ کریں: <a href="mailto:agnjobbank123@gmail.com" className="text-orange hover:underline">agnjobbank123@gmail.com</a>
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3">
              <button
                onClick={handleAgreementAccept}
                disabled={isLoading}
                className="flex-1 bg-green-600 text-white hover:bg-green-700 font-semibold px-6 py-3 rounded-lg transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle size={20} />
                    Accept & Submit Application
                  </>
                )}
              </button>
              <button
                onClick={handleAgreementReject}
                disabled={isLoading}
                className="flex-1 border-2 border-red-300 text-red-700 hover:border-red-500 hover:text-red-600 hover:bg-red-50 font-semibold px-6 py-3 rounded-lg bg-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <X size={20} />
                Reject & Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Result Modal (Success/Error) */}
      {showResultModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 h-screen">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-fadeIn">
            {/* Modal Header */}
            <div className={`px-6 py-4 flex items-center justify-between ${
              resultType === 'success' 
                ? 'bg-gradient-to-r from-green-400 to-emerald-500' 
                : 'bg-gradient-to-r from-red-400 to-rose-500'
            }`}>
              <div className="flex items-center gap-3">
                {resultType === 'success' ? (
                  <CheckCircle size={24} className="text-white" />
                ) : (
                  <AlertCircle size={24} className="text-white" />
                )}
                <h2 className="text-2xl font-bold text-white">
                  {resultType === 'success' ? 'Success!' : 'Error'}
                </h2>
              </div>
              <button
                onClick={() => setShowResultModal(false)}
                className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
                aria-label="Close modal"
              >
                <X size={20} className="text-white" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <p className="text-gray-700 text-center leading-relaxed mb-4">
                {resultMessage}
              </p>
              {resultType === 'success' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-green-800 text-center">
                    <strong>Expected response time:</strong> 3-5 business days
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <button
                onClick={() => setShowResultModal(false)}
                className={`w-full font-semibold px-6 py-3 rounded-lg transition-all duration-300 hover:shadow-lg ${
                  resultType === 'success'
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {resultType === 'success' ? 'Great!' : 'Try Again'}
              </button>
            </div>
          </div>
        </div>
      )}


     

      {/* Form Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Personal Information Section */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-orange rounded-lg flex items-center justify-center">
                  <span className="text-dark font-bold text-lg">1</span>
                </div>
                <h2 className="text-2xl font-bold text-dark">Personal Information</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent outline-none transition-all"
                    placeholder="John Smith"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Age <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent outline-none transition-all"
                    placeholder="28"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent outline-none transition-all"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="mobile_no"
                    value={formData.mobile_no}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent outline-none transition-all"
                    placeholder="07700 000000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Location <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent outline-none transition-all"
                    placeholder="City, Country"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nearest Route
                  </label>
                  <input
                    type="text"
                    name="nearest_route"
                    value={formData.nearest_route}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent outline-none transition-all"
                    placeholder="e.g., M5, M6"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    CNIC/ID Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="cnic_no"
                    value={formData.cnic_no}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent outline-none transition-all"
                    placeholder="12345-6789012-3"
                  />
                </div>
              </div>
            </div>

            {/* Education Section */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-orange rounded-lg flex items-center justify-center">
                  <span className="text-dark font-bold text-lg">2</span>
                </div>
                <h2 className="text-2xl font-bold text-dark">Education</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Educational Profile <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="educational_profile"
                    value={formData.educational_profile}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent outline-none transition-all"
                    placeholder="e.g., Bachelor's in Accounting"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Recent Completed Education <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="recent_completed_education"
                    value={formData.recent_completed_education}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent outline-none transition-all"
                    placeholder="e.g., ACCA, ACA, CIMA"
                  />
                </div>
              </div>
            </div>

            {/* Experience Section */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-orange rounded-lg flex items-center justify-center">
                  <span className="text-dark font-bold text-lg">3</span>
                </div>
                <h2 className="text-2xl font-bold text-dark">Experience</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Position Applying For <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="applying_for"
                    value={formData.applying_for}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent outline-none transition-all"
                    placeholder="e.g., Senior Accountant"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Years of Experience
                  </label>
                  <input
                    type="number"
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent outline-none transition-all"
                    placeholder="5"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Experience Details
                </label>
                <textarea
                  name="experience_detail"
                  value={formData.experience_detail}
                  onChange={handleChange}
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent outline-none transition-all resize-none"
                  placeholder="Tell us about your relevant experience, key achievements, and why you're interested in this role..."
                />
              </div>

              {/* Subjects field - only show for teachers */}
              {(formData.applying_for.toLowerCase().includes('teacher') || 
                formData.applying_for.toLowerCase().includes('tutor') || 
                formData.applying_for.toLowerCase().includes('teaching')) && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Subjects You Can Teach <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="subjects"
                    value={formData.subjects}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent outline-none transition-all"
                    placeholder="e.g., Mathematics, Physics, Chemistry, English"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Enter subjects separated by commas. This helps students find the right teacher.
                  </p>
                </div>
              )}
            </div>

            {/* CV Upload Section */}
            <div className="bg-light rounded-xl border border-muted shadow-sm p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-orange rounded-lg flex items-center justify-center">
                  <span className="text-dark font-bold text-lg">4</span>
                </div>
                <h2 className="text-2xl font-bold text-dark">Upload CV</h2>
              </div>
              
              {/* Important Notice */}
              <div className="mb-6 bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                <p className="text-sm text-blue-800">
                  <strong className="font-bold">📝 Important:</strong> Please upload a <strong>text-based PDF</strong> (not an image/Canva PDF). 
                  Image-based CVs cannot be properly processed for privacy protection. 
                  To create a text-based PDF, export directly from Word or Google Docs.
                </p>
              </div>
              
              <div className="relative">
                <input
                  type="file"
                  name="cv"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  required
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="border-2 border-dashed border-orange rounded-lg p-8 text-center bg-white hover:bg-light transition-colors cursor-pointer">
                  <Upload size={40} className="mx-auto mb-3 text-orange" />
                  <p className="font-semibold text-black text-lg mb-1">
                    {cvFile ? cvFile.name : "Drop your CV here or click to browse"}
                  </p>
                  <p className="text-sm text-gray-600">PDF, DOC, or DOCX (Max 5MB)</p>
                  <p className="text-xs text-gray-500 mt-2">✅ Text-based PDFs only • ❌ No Canva or image PDFs</p>
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-black text-white hover:bg-gray-800 font-semibold text-base px-6 py-4 rounded-lg transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Application
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => window.history.back()}
                className="flex-1 border-2 border-gray-300 text-gray-700 hover:border-black hover:text-black font-semibold text-base px-6 py-4 rounded-lg bg-white transition-all duration-300 hover:shadow-lg"
              >
                Back
              </button>
            </div>
          </form>
        </div>
      </section>

     {/* Why Apply Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-black mb-4">
            Why Apply with AGN Job Bank?
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            We're committed to helping finance professionals find their ideal career opportunities
          </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Briefcase,
                title: "Exclusive Opportunities",
                desc: "Access premium finance roles not listed elsewhere",
              },
              {
                icon: TrendingUp,
                title: "Career Growth",
                desc: "Work with industry leaders and advance your career",
              },
              {
                icon: Award,
                title: "Competitive Packages",
                desc: "Attractive salaries and comprehensive benefits",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl p-6 border border-gray-200 hover:border-orange hover:shadow-lg transition-all duration-300"
              >
                <div className="w-12 h-12 bg-orange rounded-lg flex items-center justify-center mb-4">
                  <item.icon size={24} className="text-black" />
                </div>
                <h3 className="text-lg font-bold text-black mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Stats Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Zap, label: "Fast Process", value: "3-5 Days" },
              { icon: Target, label: "Success Rate", value: "92%" },
              { icon: Clock, label: "Avg Response", value: "24 Hours" },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="bg-light rounded-xl p-6 text-center border border-muted hover:border-orange hover:shadow-md transition-all duration-300"
              >
                <stat.icon size={28} className="text-orange mx-auto mb-3" />
                <p className="text-muted font-semibold text-sm mb-1">{stat.label}</p>
                <p className="text-dark font-bold text-2xl">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-black mb-4">
            Success Stories from Our Candidates
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            See what our successful candidates have to say about their experience with AGN Job Bank
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: "Ahmad ali",
                role: "Senior Accountant",
                company: "KPMG",
                testimonial: "AGN Job Bank helped me land my dream role. The process was smooth and professional.",
              },
              {
                name: "Shahbaz Khan",
                role: "Finance Manager",
                company: "Deloitte",
                testimonial: "Excellent support throughout the application process. Highly recommended!",
              },
              {
                name: "Amna Rafeeq",
                role: "Tax Specialist",
                company: "EY",
                testimonial: "Within 2 weeks of applying, I had my job offer. Amazing experience!",
              },
            ].map((testimonial, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl p-6 border border-gray-200 hover:border-orange hover:shadow-lg transition-all duration-300"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} className="fill-orange text-orange" />
                  ))}
                </div>
                <p className="text-muted mb-6 italic text-sm leading-relaxed">"{testimonial.testimonial}"</p>
                <div className="border-t border-gray-200 pt-4">
                  <p className="font-bold text-black">{testimonial.name}</p>
                  <p className="text-sm text-gray-600">
                    {testimonial.role} at {testimonial.company}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-black mb-4">
            About AGN Job Bank
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Your trusted partner in finance recruitment
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-light rounded-xl p-8 border border-muted">
              <div className="flex items-center gap-3 mb-4">
                <Users size={24} className="text-orange" />
                <h3 className="text-xl font-bold text-dark">Our Mission</h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                We connect talented finance professionals with leading organizations across Pakistan. With over 20 years
                of experience in recruitment, we understand what both employers and candidates need to succeed.
              </p>
            </div>
            <div className="bg-white rounded-xl p-8 border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <Award size={24} className="text-black" />
                <h3 className="text-xl font-bold text-black">Why Choose Us</h3>
              </div>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-orange rounded-full mt-2 flex-shrink-0"></div>
                  <span>Personalized recruitment support</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-orange rounded-full mt-2 flex-shrink-0"></div>
                  <span>Access to exclusive opportunities</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-orange rounded-full mt-2 flex-shrink-0"></div>
                  <span>Fast-track interview process</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-orange rounded-full mt-2 flex-shrink-0"></div>
                  <span>Dedicated career guidance</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
                <div className="w-12 h-12 bg-orange rounded-lg flex items-center justify-center mb-4">
                <span className="text-dark font-bold text-lg">AGN</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">AGN job bank</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Specialists in financial recruitment, connecting talent with opportunity.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <a href="/" className="text-gray-400 hover:text-orange transition-colors text-sm">
                    Home
                  </a>
                </li>
                <li>
                  <a href="/#about" className="text-gray-400 hover:text-orange transition-colors text-sm">
                    About
                  </a>
                </li>
                <li>
                  <a href="/apply" className="text-gray-400 hover:text-orange transition-colors text-sm">
                    Apply
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">Contact</h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-gray-400 text-sm">
                  <Phone size={16} className="text-orange flex-shrink-0" />
                  <a href="tel:+923037774400" className="hover:text-orange transition-colors">
                    +92 3037774400
                  </a>
                </li>
                <li className="flex items-center gap-2 text-gray-400 text-sm">
                  <Mail size={16} className="text-orange flex-shrink-0" />
                  <a href="mailto:agnjobbank123@gmail.com" className="hover:text-orange transition-colors">
                    agnjobbank123@gmail.com
                  </a>
                </li>
                <li className="flex items-start gap-2 text-gray-400 text-sm">
                  <MapPin size={16} className="text-orange flex-shrink-0 mt-0.5" />
                  <span>Office #6, 2nd Floor, Sitara Plaza, Near Mediacom, Kohinoor Chowk, Faisalabad</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">Follow Us</h4>
              <div className="flex gap-3">
                <a
                  href="#"
                  className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-orange hover:text-dark transition-all"
                >
                  <Linkedin size={18} />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-orange hover:text-dark transition-all"
                >
                  <Twitter size={18} />
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-gray-400 text-sm">© 2025 AGN job bank Recruitment. All rights reserved.</p>
              <div className="flex gap-6">
                <a href="#" className="text-gray-400 hover:text-orange transition-colors text-sm">
                  Privacy Policy
                </a>
                <a href="#" className="text-gray-400 hover:text-orange transition-colors text-sm">
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
