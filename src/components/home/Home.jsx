"use client"

import {
  ArrowRight,
  Menu,
  X,
  Phone,
  Clipboard,
  Search,
  Briefcase,
  Target,
  Clock,
  UserCheck,
  User,
  UserPlus,
  BarChart2,
  TrendingUp,
  Linkedin,
  Twitter,
  Mail,
  MapPin,
  Star,
  Zap,
  Award,
  Users,
  FileText,
} from "lucide-react"
import { useState, useEffect } from "react"
import NavBar from "../shared/NavBar"
import { useRef } from "react"

function JobsCarousel() {
  const [jobs, setJobs] = useState([])
  const [groupIndex, setGroupIndex] = useState(0)
  const [visible, setVisible] = useState(4) // Default to 4 for desktop
  const [isPaused, setIsPaused] = useState(false)
  const timer = useRef(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { getJobs } = await import("../../Api/Service/apiService")
        const json = await getJobs()
        if (!cancelled) {
          if (json && json.ok) {
            // Reverse to show newest jobs first
            const jobsList = json.jobs || []
            setJobs(jobsList.reverse())
          }
          else setJobs([])
        }
      } catch (err) {
        if (!cancelled) setJobs([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const calc = () => {
      const w = window.innerWidth
      if (w >= 1200) return 4
      if (w >= 900) return 3
      if (w >= 640) return 2
      return 1
    }
    const handler = () => setVisible(calc())
    handler()
    window.addEventListener("resize", handler)
    return () => window.removeEventListener("resize", handler)
  }, [])

  // chunk into groups of 'visible'
  const groups = []
  for (let i = 0; i < jobs.length; i += visible) groups.push(jobs.slice(i, i + visible))
  const groupCount = Math.max(1, groups.length)

  // auto-advance
  useEffect(() => {
    if (isPaused || !jobs || jobs.length === 0) {
      if (timer.current) clearInterval(timer.current)
      return
    }
    timer.current = setInterval(() => setGroupIndex((g) => (g + 1) % groupCount), 4200)
    return () => {
      if (timer.current) clearInterval(timer.current)
    }
  }, [jobs, visible, isPaused, groupCount])

  if (!jobs || jobs.length === 0) {
    return (
      <div className="bg-light rounded-xl p-6 text-center">No jobs available yet. Admin can post jobs from the admin panel.</div>
    )
  }

  const prev = () => setGroupIndex((g) => (g - 1 + groupCount) % groupCount)
  const next = () => setGroupIndex((g) => (g + 1) % groupCount)

  return (
    <div className="relative pb-8" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
      <div className="overflow-hidden rounded-2xl bg-transparent">
        <div
          className="flex transition-transform duration-600 ease-in-out"
          style={{ transform: `translateX(-${groupIndex * 100}%)` }}
        >
          {groups.map((group, gi) => (
            <div key={gi} className="min-w-full flex gap-4 p-4 box-border flex-shrink-0">
              {group.map((job, i) => (
                <article
                  key={job.job_id || job.id || `${gi}-${i}`}
                  className="job-card bg-white rounded-2xl p-5 sm:p-6 shadow-md border border-gray-100 flex-1 min-w-0 max-w-full h-[240px] overflow-hidden flex flex-col"
                >
                  <div className="mb-2">
                    <div className="flex items-start justify-between mb-1 gap-2">
                      <h3 className="text-base sm:text-lg font-black leading-tight break-words flex-1 min-w-0">{job.name}</h3>
                      {job.created_at && (
                        <span className="text-xs text-slate-400 whitespace-nowrap flex-shrink-0">
                          {new Date(job.created_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric'
                          })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 mb-2 truncate">{job.experience} • {job.location}</p>
                  </div>
                  <p className="text-sm text-slate-700 mb-4 line-clamp-3 flex-1">{job.details}</p>
                  <div className="mt-2">
                    <a
                      href={`/apply?job=${encodeURIComponent(job.name)}`}
                      className="inline-flex items-center gap-2 bg-dark text-orange font-black px-3 py-2 rounded text-sm shadow-sm hover:shadow-md transition"
                    >
                      Apply Now
                    </a>
                  </div>
                </article>
              ))}
              {/* Fill empty spaces to maintain grid layout */}
              {Array.from({ length: Math.max(0, visible - group.length) }).map((_, k) => (
                <div key={`empty-${k}`} className="flex-1 min-w-0" />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Prev / Next controls (visible on all sizes but styled for mobile) */}
      <button
        onClick={prev}
        aria-label="Previous jobs"
        className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white p-2 rounded-full shadow-md backdrop-blur-sm sm:p-3"
      >
        <ArrowRight className="-rotate-180 text-dark" size={18} />
      </button>

      <button
        onClick={next}
        aria-label="Next jobs"
        className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white p-2 rounded-full shadow-md backdrop-blur-sm sm:p-3"
      >
        <ArrowRight className="text-dark" size={18} />
      </button>

      {/* Dots */}
      <div className="flex items-center justify-center gap-3 mt-6">
        {Array.from({ length: groupCount }).map((_, i) => (
          <button
            key={i}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => setGroupIndex(i)}
            className={`w-3 h-3 rounded-full ${i === groupIndex ? 'bg-dark' : 'bg-muted/60'}`}
          />
        ))}
      </div>
    </div>
  )
}

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const els = Array.from(document.querySelectorAll(".js-h2"))
    if (!els.length) return
    const obs = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target
            const idx = els.indexOf(el)
            const baseDelay = el.classList.contains("delay") ? 120 : 0
            setTimeout(
              () => {
                if (el.classList.contains("js-h2-slow")) {
                  el.classList.add("h2-animate-slow")
                } else {
                  el.classList.add("h2-animate")
                }
                observer.unobserve(el)
              },
              idx * 90 + baseDelay,
            )
          }
        })
      },
      { threshold: 0.2 },
    )

    els.forEach((el) => obs.observe(el))
    return () => obs.disconnect()
  }, [])
  
  // AUTO-FIX: add defensive `no-overflow` class to any node wider than the viewport
  useEffect(() => {
    const applyNoOverflow = () => {
      const vw = window.innerWidth || document.documentElement.clientWidth
      document.querySelectorAll('*').forEach((el) => {
        if (!(el instanceof HTMLElement)) return
        if (el === document.documentElement || el === document.body) return
        const rect = el.getBoundingClientRect()
        if (rect.width > vw + 0.5) {
          el.classList.add('no-overflow')
        }
      })
    }
    const t = setTimeout(applyNoOverflow, 80)
    window.addEventListener('resize', applyNoOverflow)
    return () => {
      clearTimeout(t)
      window.removeEventListener('resize', applyNoOverflow)
    }
  }, [])
  
  const openApply = (e) => {
    if (e && e.preventDefault) e.preventDefault()
    window.location.href = "/apply"
    try {
      window.scrollTo(0, 0)
    } catch (err) {}
  }

  const openHire = (e) => {
    if (e && e.preventDefault) e.preventDefault()
    window.location.href = "/hire"
    try {
      window.scrollTo(0, 0)
    } catch (err) {}
  }

  const openApplyTeaching = (e) => {
    if (e && e.preventDefault) e.preventDefault()
    window.location.href = "/apply?type=teaching"
    try {
      window.scrollTo(0, 0)
    } catch (err) {}
  }

  const openHireTeacher = (e) => {
    if (e && e.preventDefault) e.preventDefault()
    window.location.href = "/tutor-dashboard"
    try {
      window.scrollTo(0, 0)
    } catch (err) {}
  }

  return (
    <div className="min-h-screen bg-light overflow-x-hidden">
  <style>{`
        /* Enhanced logo animation with smooth floating and rotation */
        @keyframes logoFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(3deg); }
        }
        .logo-animated {
          animation: logoFloat 3.5s cubic-bezier(0.4, 0.0, 0.2, 1) infinite;
        }

        /* Darker accent gradient for headings */
        .h2-accent {
          height: 4px;
          border-radius: 9999px;
          background: linear-gradient(90deg, #d97706, #d97706);
          transform-origin: left;
          transform: scaleX(0);
          transition: transform 0.5s cubic-bezier(0.34, 1, 0.64, 1);
        }

        /* Card slide-up animation with refined easing */
        @keyframes cardSlideUp {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .card-animate {
          animation: cardSlideUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        /* Slightly darker hero vignette for contrast */
        .image-vignette { pointer-events: none; position: absolute; inset: 0; border-radius: inherit; background: radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.18) 100%); opacity: 0.9; }

        /* Job card subtle border accent and smoother hover */
        .job-card { transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.35s ease; }
        .job-card:hover { transform: translateY(-8px); box-shadow: 0 18px 40px rgba(2,6,23,0.12); }

        /* Accent pill */
        .pill { background: rgba(217,119,6,0.07); color: #92400e; padding: 6px 10px; border-radius: 9999px; font-weight: 700; font-size: 12px; }

        /* Truncate text safely */
        .line-clamp-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }

        /* Slightly darker buttons */
        .btn-apply { background: #111827; color: #fbbf24; padding: 8px 12px; border-radius: 8px; font-weight: 800; }
        .btn-apply:hover { background: #0b1220; }

  /* Overflow helper - applied to targeted containers to prevent accidental overflow on mobile */
  .no-overflow { max-width: 100%; box-sizing: border-box; word-break: break-word; }

      `}</style>

      {/* Shared Navigation */}
      <NavBar />

      {/* Hero Section */}
  <section className="bg-light pt-20 sm:pt-32 pb-12 sm:pb-20 px-4 sm:px-6 lg:px-8 relative overflow-x-hidden">
  <div className="absolute top-20 right-10 w-48 h-48 bg-orange rounded-full opacity-50 blur-3xl soft-pulse hidden sm:block"></div>
        <div
          className="absolute bottom-0 right-32 w-64 h-64 bg-orange rounded-full opacity-30 blur-3xl soft-pulse hidden sm:block"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute -left-32 top-40 w-80 h-80 bg-orange rounded-full opacity-40 blur-3xl soft-pulse hidden sm:block"
          style={{ animationDelay: "2s" }}
        ></div>

  <div className="max-w-7xl mx-auto relative z-10 no-overflow">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="w-full box-border min-h-0 no-overflow">
              <h1 className="text-3xl sm:text-5xl md:text-7xl font-black text-dark leading-tight mb-4 sm:mb-6 text-balance animate-in fade-in slide-in-from-left-8 duration-700 break-words">
                Where talent meets{" "}
                <span className="relative inline-block">
                  opportunity
                  {/* decorative circle removed per request */}
                </span>
              </h1>
              <p
                className="text-base sm:text-lg text-muted mb-6 max-w-md leading-relaxed font-medium animate-in fade-in slide-in-from-left-8 duration-700 break-words"
                style={{ animationDelay: "0.2s" }}
              >
                Specialists in financial recruitment, connecting businesses with exceptional people
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                <a
                  href="/apply"
                  onClick={openApply}
                  className="cta-card bg-white rounded-2xl p-4 sm:p-6 shadow-md border border-transparent cursor-pointer block card-animate stagger-1 no-overflow"
                >
                  <h3 className="text-lg font-black text-dark mb-2">I want to apply</h3>
                  <p className="text-muted mb-3 text-sm">Find your next finance role</p>
                  <div className="flex items-center justify-between">
                    <ArrowRight className="text-orange font-bold transition-transform duration-300" size={20} />
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-light rounded-lg flex items-center justify-center icon-bounce">
                      <Clipboard size={18} className="text-dark" />
                    </div>
                  </div>
                </a>

                <a
                  href="/hire"
                  onClick={openHire}
                  className="cta-card bg-white rounded-2xl p-4 sm:p-6 shadow-md border border-transparent cursor-pointer block card-animate stagger-2 no-overflow"
                >
                  <h3 className="text-lg font-black text-dark mb-2">I want to hire</h3>
                  <p className="text-muted mb-3 text-sm">Find your perfect candidate</p>
                  <div className="flex items-center justify-between">
                    <ArrowRight className="text-orange font-bold transition-transform duration-300" size={20} />
                    <div
                      className="w-10 h-10 sm:w-12 sm:h-12 bg-light rounded-lg flex items-center justify-center icon-bounce"
                      style={{ animationDelay: "0.5s" }}
                    >
                      <Search size={18} className="text-dark" />
                    </div>
                  </div>
                </a>

                <a
                  href="/apply?type=teaching"
                  onClick={openApplyTeaching}
                  className="cta-card bg-white rounded-2xl p-4 sm:p-6 shadow-md border border-transparent cursor-pointer block card-animate stagger-3 no-overflow"
                >
                  <h3 className="text-lg font-black text-dark mb-2">Apply for Teaching</h3>
                  <p className="text-muted mb-3 text-sm">Join as a teacher or tutor</p>
                  <div className="flex items-center justify-between">
                    <ArrowRight className="text-orange font-bold transition-transform duration-300" size={20} />
                    <div
                      className="w-10 h-10 sm:w-12 sm:h-12 bg-light rounded-lg flex items-center justify-center icon-bounce"
                      style={{ animationDelay: "0.7s" }}
                    >
                      <span className="text-dark text-xl">🎓</span>
                    </div>
                  </div>
                </a>

                <a
                  href="/tutor-dashboard"
                  onClick={openHireTeacher}
                  className="cta-card bg-white rounded-2xl p-4 sm:p-6 shadow-md border border-transparent cursor-pointer block card-animate stagger-4 no-overflow"
                >
                  <h3 className="text-lg font-black text-dark mb-2">Hire a Teacher</h3>
                  <p className="text-muted mb-3 text-sm">Find qualified tutors</p>
                  <div className="flex items-center justify-between">
                    <ArrowRight className="text-orange font-bold transition-transform duration-300" size={20} />
                    <div
                      className="w-10 h-10 sm:w-12 sm:h-12 bg-light rounded-lg flex items-center justify-center icon-bounce"
                      style={{ animationDelay: "0.9s" }}
                    >
                      <span className="text-dark text-xl">📚</span>
                    </div>
                  </div>
                </a>
              </div>
            </div>

            {/* Phone number callout */}
            <div className="hidden md:flex justify-end">
              <div className="glow-hover bg-white rounded-full px-8 py-4 shadow-xl flex items-center gap-3 hover:shadow-2xl transition transform hover:-translate-y-1 duration-300 animate-in fade-in slide-in-from-right-8 duration-700">
                <Phone size={28} className="text-black font-bold icon-bounce" />
                <div>
                  <p className="text-xs text-gray-600 font-semibold">Call us</p>
                  <p className="font-black text-black text-lg">+92 3037774400</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

  {/* Jobs Carousel Section */}
  <section className="py-12 px-4 sm:px-6 lg:px-8 bg-light">
    <div className="max-w-7xl mx-auto no-overflow">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black">Latest Jobs</h2>
            <a href="/apply" className="text-sm text-gray-500 hover:text-black">View all</a>
          </div>
          <JobsCarousel />
        </div>
      </section>

  {/* Expertise Section */}
  <section id="about" className="bg-dark text-light py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="group inline-block mb-6">
                <h2 className="js-h2 text-5xl md:text-6xl font-black leading-tight text-balance text-light">
                  Experts in <br />
                  Financial <br />
                  Recruitment<span className="text-orange">.</span>
                </h2>
                <span className="h2-accent mt-4 block"></span>
              </div>
              <p className="text-muted text-lg mb-8 leading-relaxed">
                AGN job bank are experts in Financial Recruitment offering honest, transparent advice, helping
                candidates into their next role and clients find valued finance professionals. Operating for over a
                decade in this market, we know our industry inside and out.
              </p>
              <button className="btn-primary bg-orange text-dark font-black text-base px-8 py-4 rounded-lg shadow-md inline-flex items-center gap-2 relative z-10">
                Find out More <ArrowRight className="ml-2 transition-transform duration-300" size={20} />
              </button>
            </div>
            <div className="image-enhanced bg-gradient-to-br from-gray-700 to-gray-900 rounded-2xl h-56 md:h-96 w-full max-w-full box-border flex items-center justify-center overflow-hidden relative glow-hover mx-auto min-h-0 no-overflow">
              {/* mobile: background image for better composition, desktop: keep img for accessibility */}
              <div
                className="block md:hidden w-full h-full bg-cover bg-center"
                style={{ backgroundImage: `url(${encodeURI("/images/homepage image.jpg")})` }}
                aria-hidden="true"
              />
              <img
                src={encodeURI("/images/homepage image.jpg")}
                alt="Homepage"
                className="hidden md:block hero-image object-cover object-center w-full h-full block flex-shrink-0"
                onError={(e) => {
                  e.currentTarget.style.display = "none"
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
              <div className="image-vignette" aria-hidden="true"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Career Levels Section */}
  <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-light">
    <div className="max-w-7xl mx-auto">
          <div className="group inline-block mb-4">
            <h2 className="js-h2 js-h2-slow delay text-4xl md:text-5xl font-black text-black text-balance">
              Recruiting Across All <br />
              Career Levels.
            </h2>
            <span className="h2-accent mt-4 block w-40"></span>
          </div>
          <p className="text-muted mb-12 text-lg font-medium">
            For permanent, Fixed Term Contract and Interim Appointments
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Transactional Finance",
                description: "Entry level, graduate, experienced professional",
                Icon: BarChart2,
              },
              {
                title: "Part Qualified Finance",
                description: "Studying ACA, ACCA, CIMA, Supervisory/Management or qualified by experience",
                Icon: TrendingUp,
              },
              {
                title: "Qualified Finance",
                description:
                  "Newly qualified/post-qualified ACA, ACCA, CIMA, Senior Management or qualified by experience",
                Icon: Target,
              },
            ].map((level, idx) => (
              <div
                key={idx}
                className={`card-animate bg-gray-50 rounded-xl p-6 sm:p-8 hover:shadow-md hover:bg-light transition border border-gray-200 hover:border-orange cursor-pointer stagger-${idx + 1}`}
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-orange rounded-full mb-4 flex items-center justify-center font-black text-dark text-lg sm:text-xl shadow-md hover:shadow-lg transition duration-300">
                  <level.Icon size={22} className="text-black" />
                </div>
                <h3 className="text-xl font-black text-black mb-3">{level.title}</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">{level.description}</p>
                  <a
                    href="#"
                    className="text-dark font-black flex items-center gap-2 hover:gap-3 transition group duration-300"
                  >
                  Search <ArrowRight size={20} className="group-hover:translate-x-1 transition duration-300" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
  <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-light">
        <div className="max-w-7xl mx-auto">
          <div className="group inline-block mb-4">
            <h2 className="js-h2 text-4xl md:text-5xl font-black text-black text-balance">Our Services.</h2>
            <span className="h2-accent mt-4 block w-36"></span>
          </div>
          <p className="text-gray-600 mb-12 text-lg font-medium">
            Comprehensive recruitment solutions tailored to your needs
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: "Permanent Placement",
                description: "Find the right talent for long-term roles with comprehensive vetting and support",
                Icon: Briefcase,
              },
              {
                title: "Contract & Interim",
                description: "Flexible staffing solutions for temporary and project-based finance positions",
                Icon: Clock,
              },
              {
                title: "Executive Search",
                description: "Senior-level recruitment for management and director positions",
                Icon: UserCheck,
              },
              {
                title: "Candidate Support",
                description: "Career guidance, interview preparation, and ongoing professional development",
                Icon: User,
              },
            ].map((service, idx) => (
              <div
                  key={idx}
                  className={`card-animate bg-white rounded-xl p-6 sm:p-8 border-2 border-gray-200 hover:border-orange hover:shadow-md transition cursor-pointer stagger-${idx + 1}`}
                >
                  <div className="w-12 h-12 sm:w-16 sm:h-16 mb-4 flex items-center justify-center bg-light rounded-full shadow-md hover:shadow-lg transition duration-300">
                    <service.Icon size={22} className="text-dark" />
                  </div>
                <h3 className="text-2xl font-black text-dark mb-3">{service.title}</h3>
                <p className="text-muted leading-relaxed">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
  <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-light">
        <div className="max-w-7xl mx-auto">
          <div className="group inline-block mb-12">
            <h2 className="js-h2 js-h2-slow text-4xl md:text-5xl font-black text-black text-balance">
              A Few Words On Us.
            </h2>
            <span className="h2-accent mt-4 block w-48"></span>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                text: "My second time working with AGN job bank and I would highly recommend them. Working with AGN job bank was great, they were reliable and very professional.",
                author: "Candidate – Contractor",
                rating: 5,
              },
              {
                text: "Mitchell provided me with a brilliant, first class service helping me to gain my first graduate role. He and his team worked with great efficiency and reliability.",
                author: "Candidate – Graduate",
                rating: 5,
              },
              {
                text: "I would highly recommend AGN job bank recruitment. They are very professional and very approachable. They gave me every detail I needed in the recruitment stages.",
                author: "Candidate – Management Accountant",
                rating: 5,
              },
              {
                text: "Can I say how pleased we have been with the service during our recent recruitment. They have been really hands-on and offered us excellent quality candidates.",
                author: "Director - Contractor Firm",
                rating: 5,
              },
            ].map((testimonial, idx) => (
              <div
                key={idx}
                className="card-animate bg-light rounded-xl p-6 sm:p-8 border border-gray-200 hover:shadow-md hover:border-orange transition cursor-pointer"
              >
                <div className="flex gap-1 mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span
                      key={i}
                      className="text-orange text-lg sm:text-xl animate-in zoom-in"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <p className="text-muted mb-5 leading-relaxed italic text-sm">"{testimonial.text}"</p>
                <p className="text-sm font-black text-dark">{testimonial.author}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section (simplified colors) */}
  <section className="bg-light text-dark py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { number: "10+", label: "Years Experience" },
              { number: "500+", label: "Placements" },
              { number: "98%", label: "Client Satisfaction" },
              { number: "24/7", label: "Support" },
            ].map((stat, idx) => (
              <div key={idx} className={`stat-item stagger-${idx + 1}`}>
                <div className="text-4xl md:text-6xl font-black text-dark mb-2">{stat.number}</div>
                <p className="text-muted font-semibold">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA (simpler background) */}
      <section className="bg-light py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black text-dark mb-8 text-balance animate-in fade-in duration-700">
            Ready to get started?
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={openApply}
              className="btn-primary bg-dark text-orange font-black text-lg px-6 py-4 sm:px-8 sm:py-6 rounded-lg shadow-md relative z-10 inline-flex items-center gap-2"
            >
              Apply Now???<ArrowRight size={20} />
            </button>
            <button className="btn-primary border-2 border-dark text-dark hover:bg-dark hover:text-orange font-black text-lg px-6 py-4 sm:px-8 sm:py-6 rounded-lg bg-transparent relative z-10 inline-flex items-center gap-2">
              Hire Talent <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
  <footer id="contact" className="bg-dark text-light py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div>
              <div className="w-12 h-12 bg-orange rounded-full flex items-center justify-center mb-4 shadow-lg">
                <span className="text-dark font-black text-lg">AGN</span>
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
                  <a href="#apply" className="text-gray-400 hover:text-orange transition font-medium duration-300">
                    Apply
                  </a>
                </li>
                <li>
                  <a href="#hire" className="text-gray-400 hover:text-orange transition font-medium duration-300">
                    Hire
                  </a>
                </li>
                <li>
                  <a href="#about" className="text-gray-400 hover:text-orange transition font-medium duration-300">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-orange transition font-medium duration-300">
                    Services
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="font-black text-white mb-4">Contact</h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-gray-400">
                  <Phone size={18} className="text-orange" />
                  <a href="tel:01216511235" className="hover:text-orange transition duration-300">
                    +92 3037774400
                  </a>
                </li>
                <li className="flex items-center gap-2 text-gray-400">
                  <Mail size={18} className="text-orange" />
                    <a href="mailto:agnjobbank123@gmail.com" className="hover:text-orange transition duration-300">
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
                  className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-orange hover:text-dark transition transform hover:scale-110 duration-300"
                >
                  <Linkedin size={20} />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-orange hover:text-dark transition transform hover:scale-110 duration-300"
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
                <a href="#" className="text-gray-400 hover:text-orange transition text-sm font-medium duration-300">
                  Privacy Policy
                </a>
                <a href="#" className="text-gray-400 hover:text-orange transition text-sm font-medium duration-300">
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








