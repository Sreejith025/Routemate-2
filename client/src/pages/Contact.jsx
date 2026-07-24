import React, { useState } from "react";
import { Mail, Phone, MapPin, Send, MessageSquare, CheckCircle2, HelpCircle } from "lucide-react";
import toast from "react-hot-toast";

const Contact = () => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "General Inquiry",
    message: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    toast.success("Thank you! Your message has been sent to the RouteMate team.");
  };

  return (
    <div className="space-y-16 py-8">
      {/* Header */}
      <section className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold px-4 py-1.5 rounded-full">
          <MessageSquare className="w-4 h-4" />
          <span>24/7 Commuter Support</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
          Get in Touch with <span className="gradient-text">RouteMate</span>
        </h1>
        <p className="text-slate-300 text-base leading-relaxed">
          Have questions about dynamic taxi switching, driver registration, or enterprise partnerships? Reach out to our support team.
        </p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {/* Contact Info Sidebar */}
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-6">
            <h3 className="text-xl font-bold text-white">Contact Information</h3>

            <div className="flex items-start space-x-4 text-xs text-slate-300">
              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <strong className="text-white block text-sm">Headquarters</strong>
                <span>100 Innovation Parkway, Suite 400</span>
                <span className="block text-slate-400">Tech Hub District, CA 94107</span>
              </div>
            </div>

            <div className="flex items-start space-x-4 text-xs text-slate-300">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <strong className="text-white block text-sm">Email Us</strong>
                <span>support@routemate.io</span>
                <span className="block text-slate-400">partnerships@routemate.io</span>
              </div>
            </div>

            <div className="flex items-start space-x-4 text-xs text-slate-300">
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <strong className="text-white block text-sm">24/7 Support Hotline</strong>
                <span>+1 (800) 555-ROUTE</span>
              </div>
            </div>
          </div>

          {/* Quick FAQ Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center space-x-2">
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span>Quick FAQ</span>
            </h4>
            <p className="text-xs text-slate-400">
              <strong>Q: How does dynamic taxi switching affect my fare?</strong>
              <br />
              A: The fare is guaranteed to remain locked at your initial booking estimate.
            </p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2 glass-card p-8 rounded-3xl border border-slate-800">
          {submitted ? (
            <div className="text-center py-16 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-white">Message Received!</h3>
              <p className="text-xs text-slate-300 max-w-md mx-auto">
                Our support team will respond within 24 hours. Thank you for connecting with RouteMate!
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="px-6 py-2.5 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <h3 className="text-2xl font-bold text-white">Send Us a Message</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-2">Your Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah Connor"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-2">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="name@domain.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">Subject Category</label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="General Inquiry">General Inquiry</option>
                  <option value="Taxi Switching Support">Taxi Switching Innovation Query</option>
                  <option value="Driver Partner Registration">Driver Partner Registration</option>
                  <option value="Technical Issue">Technical Issue</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">Your Message</label>
                <textarea
                  required
                  rows={5}
                  placeholder="How can we assist your journey?"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto flex items-center justify-center space-x-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all hover:scale-105"
              >
                <Send className="w-4 h-4" />
                <span>Submit Message</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Contact;
