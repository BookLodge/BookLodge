import React, { useState } from "react";
import { toast } from "react-hot-toast";

export const ContactPage = () => {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error("Please fill in your name, email and message.");
      return;
    }
    setSending(true);
    await new Promise((r) => setTimeout(r, 1500));
    setSending(false);
    setSent(true);
    toast.success("Message received! We will get back to you within 24 hours.");
    setTimeout(() => { setSent(false); setForm({ name: "", email: "", subject: "", message: "" }); }, 3000);
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <h1 style={{ color: "#254546" }} className="text-3xl font-bold tracking-tight mb-2">Contact Us</h1>
          <p className="text-slate-500 text-sm">Have a question about your reservation, or need help with a booking? We are here to help.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-5">
              <h2 style={{ color: "#254546" }} className="text-sm font-bold uppercase tracking-wider">Our Contact Details</h2>
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-0.5">Office Address</p>
                <p className="text-xs text-slate-500 leading-relaxed">14 Victoria Island Road,<br />Lagos, Nigeria</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-0.5">Support Email</p>
                <a href="mailto:support@booklodge.com" style={{ color: "#254546" }} className="text-xs hover:underline">support@booklodge.com</a>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-0.5">Phone</p>
                <p className="text-xs text-slate-500">+234 800 000 0000</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-0.5">Support Hours</p>
                <p className="text-xs text-slate-500">Monday - Friday: 8am - 6pm WAT<br />Saturday: 9am - 2pm WAT</p>
              </div>
            </div>
            <div className="border rounded-xl p-5 text-xs leading-relaxed" style={{ backgroundColor: "#25454610", borderColor: "#25454630" }}>
              <p style={{ color: "#254546" }} className="font-semibold mb-1">Have a booking issue?</p>
              <p className="text-slate-600">Use the <a href="/lookup" style={{ color: "#254546" }} className="underline font-semibold">Find My Reservation</a> page to manage your reservation instantly.</p>
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-stone-200 p-8">
              <h2 style={{ color: "#254546" }} className="text-lg font-bold mb-6">Send Us a Message</h2>
              {sent ? (
                <div className="text-center py-16 space-y-3">
                  <p style={{ color: "#254546" }} className="text-base font-bold">Message Sent!</p>
                  <p className="text-xs text-slate-500">Thank you, {form.name || "there"}. We will reply within 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Full Name *</label>
                      <input type="text" name="name" required value={form.name} onChange={handleChange} placeholder="e.g. Alex Morgan" className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#254546] transition" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Email Address *</label>
                      <input type="email" name="email" required value={form.email} onChange={handleChange} placeholder="name@example.com" className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#254546] transition" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Subject</label>
                    <select name="subject" value={form.subject} onChange={handleChange} className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#254546] transition">
                      <option value="">Select a topic</option>
                      <option value="booking-issue">Booking Issue</option>
                      <option value="cancellation">Cancellation Request</option>
                      <option value="payment">Payment Question</option>
                      <option value="general">General Enquiry</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Message *</label>
                    <textarea name="message" required rows={6} value={form.message} onChange={handleChange} placeholder="Describe your enquiry in detail..." className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#254546] transition resize-none" />
                  </div>
                  <button type="submit" disabled={sending} style={{ backgroundColor: "#254546", color: "#fefae0" }} className="w-full font-semibold py-3 rounded-lg flex items-center justify-center space-x-2 transition hover:opacity-90 disabled:opacity-60 cursor-pointer">
                    {sending ? (
                      <><div className="w-4 h-4 border-2 border-[#fefae0] border-t-transparent rounded-full animate-spin" /><span>Sending...</span></>
                    ) : <span>Send Message</span>}
                  </button>
                  <p className="text-xs text-slate-400 text-center">We typically respond within 24 business hours.</p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};