import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Star,
  Phone,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Award,
} from 'lucide-react';
import axios from 'axios';

// Curated category royalty-free hero backgrounds
const HERO_IMAGES = {
  salon: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1600&q=80',
  dentist: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1600&q=80',
  auto: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1600&q=80',
  gym: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1600&q=80',
  plumbing: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=1600&q=80',
  bakery: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1600&q=80',
  roofing: 'https://images.unsplash.com/photo-1632759145351-1d592919f522?auto=format&fit=crop&w=1600&q=80',
  pet: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=1600&q=80',
  legal: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1600&q=80',
  default: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80',
};

export default function WebsiteMockupPreview() {
  const { leadId } = useParams();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formSubmitted, setFormSubmitted] = useState(false);

  useEffect(() => {
    const fetchLead = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/leads/public/${leadId}`);
        if (res.data.success) {
          setLead(res.data.data);
        }
      } catch (err) {
        console.warn('Failed to load public lead mockup data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLead();
  }, [leadId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 border-3 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Loading custom website preview...</p>
        </div>
      </div>
    );
  }

  const businessName = lead?.businessName || 'Your Business';
  const category = lead?.category || 'Local Business';
  const city = lead?.city || 'Local Area';
  const phone = lead?.phone || '(555) 019-2834';
  const rating = lead?.rating || 4.9;
  const reviews = lead?.reviews || 84;

  // Pick category image
  const catLower = category.toLowerCase();
  let heroImage = HERO_IMAGES.default;
  for (const [k, img] of Object.entries(HERO_IMAGES)) {
    if (catLower.includes(k)) {
      heroImage = img;
      break;
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Top Banner indicating Mockup Preview */}
      <div className="bg-slate-900 text-white px-4 py-2.5 text-xs flex flex-col sm:flex-row items-center justify-between gap-2 border-b border-slate-800 relative z-50">
        <div className="flex items-center space-x-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-semibold text-sky-400 uppercase tracking-wider text-[11px]">
            Interactive Concept Preview
          </span>
          <span className="hidden md:inline text-slate-400">• Tailored for {businessName}</span>
        </div>
        <div className="flex items-center space-x-3 text-slate-300">
          <span>Ready to turn this into your live website?</span>
          <a
            href={`tel:${phone.replace(/\D/g, '')}`}
            className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded text-[11px] transition-colors"
          >
            Claim This Design
          </a>
        </div>
      </div>

      {/* Website Mockup Navbar */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-sky-600 flex items-center justify-center text-white font-bold text-sm">
              {businessName.charAt(0)}
            </div>
            <span className="font-extrabold text-base text-slate-900 tracking-tight">
              {businessName}
            </span>
          </div>

          <nav className="hidden md:flex items-center space-x-6 text-xs font-semibold text-slate-600">
            <a href="#services" className="hover:text-sky-600">Services</a>
            <a href="#about" className="hover:text-sky-600">About Us</a>
            <a href="#reviews" className="hover:text-sky-600">Customer Reviews</a>
            <a href="#contact" className="hover:text-sky-600">Contact</a>
          </nav>

          <a
            href={`tel:${phone.replace(/\D/g, '')}`}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm"
          >
            <Phone className="h-3.5 w-3.5 text-sky-400" />
            <span>{phone}</span>
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <section
        className="relative bg-slate-900 text-white py-20 lg:py-28 bg-cover bg-center overflow-hidden"
        style={{ backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.85), rgba(15, 23, 42, 0.9)), url("${heroImage}")` }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10 space-y-6 text-center md:text-left md:max-w-2xl">
          {/* Google Star Badge */}
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-medium text-amber-300 backdrop-blur-sm">
            <div className="flex text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span>{rating} Stars • {reviews}+ Happy Google Reviews</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Top-Rated {category} in {city}
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Welcome to {businessName}. We deliver dedicated, reliable, and professional {category.toLowerCase()} services to our clients throughout {city} and surrounding communities.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <a
              href="#contact"
              className="w-full sm:w-auto px-6 py-3 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl text-sm shadow-lg shadow-sky-500/20 flex items-center justify-center space-x-2 transition-all"
            >
              <Calendar className="h-4 w-4" />
              <span>Book Appointment Online</span>
            </a>
            <a
              href={`tel:${phone.replace(/\D/g, '')}`}
              className="w-full sm:w-auto px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-sm border border-white/20 flex items-center justify-center space-x-2 transition-all"
            >
              <Phone className="h-4 w-4 text-sky-400" />
              <span>Call Us: {phone}</span>
            </a>
          </div>
        </div>
      </section>

      {/* Value Badges */}
      <section className="bg-white border-b border-slate-200 py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="flex items-center justify-center space-x-2 text-xs font-semibold text-slate-700">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>Licensed & Certified</span>
          </div>
          <div className="flex items-center justify-center space-x-2 text-xs font-semibold text-slate-700">
            <Award className="h-4 w-4 text-sky-500" />
            <span>Top Rated in {city}</span>
          </div>
          <div className="flex items-center justify-center space-x-2 text-xs font-semibold text-slate-700">
            <ShieldCheck className="h-4 w-4 text-indigo-500" />
            <span>100% Satisfaction Guarantee</span>
          </div>
          <div className="flex items-center justify-center space-x-2 text-xs font-semibold text-slate-700">
            <Clock className="h-4 w-4 text-amber-500" />
            <span>Fast & Friendly Service</span>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section id="services" className="py-16 max-w-6xl mx-auto px-4 sm:px-6 space-y-10">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">
            Our Specialties
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Professional Services for {city} Residents
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Quality craftsmanship, transparent communication, and client-first results.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: `Complete ${category} Consultation`,
              desc: 'Personalized evaluation tailored to your specific requirements and goals.',
            },
            {
              title: 'Premium Quality Care',
              desc: 'Using industry-leading techniques and standards to deliver long-lasting excellence.',
            },
            {
              title: 'Emergency & Fast-Track Booking',
              desc: 'Priority scheduling and prompt assistance when you need help right away.',
            },
          ].map((svc, i) => (
            <div
              key={i}
              className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow space-y-3"
            >
              <div className="h-10 w-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                0{i + 1}
              </div>
              <h3 className="text-base font-bold text-slate-900">{svc.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{svc.desc}</p>
              <a href="#contact" className="inline-flex items-center text-xs font-semibold text-sky-600 hover:text-sky-700 pt-2">
                <span>Inquire Now</span>
                <ArrowRight className="h-3 w-3 ml-1" />
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Online Booking / Inquiry Form */}
      <section id="contact" className="bg-slate-100 py-16 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-xl border border-slate-200/80 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">
                Get in Touch
              </span>
              <h2 className="text-2xl font-black text-slate-900">
                Book with {businessName}
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Fill out this quick form or call us directly. We respond quickly during regular business hours.
              </p>

              <div className="space-y-3 pt-4 text-xs text-slate-700">
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-sky-600 shrink-0" />
                  <span className="font-semibold">{phone}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="h-4 w-4 text-sky-600 shrink-0" />
                  <span>{lead?.address ? `${lead.address}, ` : ''}{city}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="h-4 w-4 text-sky-600 shrink-0" />
                  <span>Monday – Saturday: 9:00 AM – 6:00 PM</span>
                </div>
              </div>
            </div>

            {/* Interactive Form */}
            <div>
              {formSubmitted ? (
                <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
                  <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
                  <h4 className="text-sm font-bold text-emerald-900">Inquiry Received</h4>
                  <p className="text-xs text-emerald-700">
                    This is an interactive concept preview for {businessName}.
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setFormSubmitted(true);
                  }}
                  className="space-y-3 text-xs"
                >
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Your Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Sarah Jenkins"
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-800"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Phone or Email</label>
                    <input
                      type="text"
                      placeholder="sarah@example.com or (555) 000-0000"
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-800"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">How can we help?</label>
                    <textarea
                      rows={3}
                      placeholder="Describe what service you are looking for..."
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-800"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg shadow-sm transition-colors"
                  >
                    Request Appointment
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-8 text-xs text-center border-t border-slate-900">
        <p>© {new Date().getFullYear()} {businessName}. All rights reserved.</p>
        <p className="mt-1 text-slate-600">
          Concept website demo rendered by LeadFlow Automation System.
        </p>
      </footer>
    </div>
  );
}

