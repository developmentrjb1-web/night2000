import { useState } from "react";
import { CheckCircle2, MessageCircle, Facebook } from "lucide-react";
import { api, formatApiErrorDetail } from "@/lib/api";
import { Toaster, toast } from "sonner";

const EVENT_TYPES = ["DJ Set", "MC Hosting", "Full Event Hosting", "Bar/Club Performance", "Private Event"];

export default function Booking() {
  const [form, setForm] = useState({
    full_name: "",
    contact_number: "",
    facebook_link: "",
    event_type: "DJ Set",
    event_date: "",
    venue: "",
    budget: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);

  const change = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await api.post("/bookings", form);
      setSuccess(data.auto_response);
      toast.success("Booking submitted!");
      setForm({ full_name: "", contact_number: "", facebook_link: "", event_type: "DJ Set", event_date: "", venue: "", budget: "", message: "" });
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail) || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen" data-testid="booking-page">
      <Toaster theme="dark" richColors position="top-right" />
      <section className="relative py-20 md:py-28 border-b border-white/5 overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.pexels.com/photos/6032557/pexels-photo-6032557.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900" alt="" className="w-full h-full object-cover opacity-25" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-black" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 md:px-10">
          <div className="label-tag">Booking</div>
          <h1 className="font-display text-4xl md:text-6xl font-black uppercase tracking-tighter mt-4">
            Book the <span className="text-[#00E5FF]">wave.</span>
          </h1>
          <p className="text-white/60 mt-4 max-w-xl">Drop your event details. We respond within 24 hours via Facebook Messenger.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="https://www.facebook.com/nightwavecollective" target="_blank" rel="noopener noreferrer" className="btn-secondary !py-2 !px-5 text-xs" data-testid="book-fb-btn">
              <Facebook className="w-4 h-4" /> Book Us on Facebook
            </a>
            <a href="https://m.me/nightwavecollective" target="_blank" rel="noopener noreferrer" className="btn-secondary !py-2 !px-5 text-xs" data-testid="book-messenger-btn">
              <MessageCircle className="w-4 h-4" /> Chat on Messenger
            </a>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-6 md:px-10">
          {success ? (
            <div className="rounded-3xl border border-[#00E5FF]/40 bg-[#0D0D14] p-10 text-center" data-testid="booking-success">
              <CheckCircle2 className="w-14 h-14 text-[#00E5FF] mx-auto" />
              <h2 className="font-display text-2xl md:text-3xl font-bold mt-4 uppercase">Booking received</h2>
              <p className="text-white/70 mt-3 max-w-xl mx-auto">{success}</p>
              <div className="mt-6 flex justify-center gap-3 flex-wrap">
                <a href="https://m.me/nightwavecollective" target="_blank" rel="noopener noreferrer" className="btn-primary !py-2 !px-5 text-xs">
                  <MessageCircle className="w-4 h-4" /> Open Messenger
                </a>
                <button onClick={() => setSuccess(null)} className="btn-secondary !py-2 !px-5 text-xs" data-testid="booking-new-btn">Submit another</button>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="rounded-3xl border border-white/10 bg-[#0D0D14] p-8 md:p-10 grid md:grid-cols-2 gap-5" data-testid="booking-form">
              <Field label="Full Name" required>
                <input data-testid="booking-input-name" required value={form.full_name} onChange={change("full_name")} className="input" />
              </Field>
              <Field label="Contact Number" required>
                <input data-testid="booking-input-phone" required value={form.contact_number} onChange={change("contact_number")} className="input" />
              </Field>
              <Field label="Facebook Profile Link">
                <input data-testid="booking-input-fb" value={form.facebook_link} onChange={change("facebook_link")} placeholder="https://facebook.com/your.profile" className="input" />
              </Field>
              <Field label="Event Type" required>
                <select data-testid="booking-input-type" value={form.event_type} onChange={change("event_type")} className="input">
                  {EVENT_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Event Date" required>
                <input data-testid="booking-input-date" required type="date" value={form.event_date} onChange={change("event_date")} className="input" />
              </Field>
              <Field label="Venue" required>
                <input data-testid="booking-input-venue" required value={form.venue} onChange={change("venue")} className="input" />
              </Field>
              <Field label="Budget">
                <input data-testid="booking-input-budget" value={form.budget} onChange={change("budget")} placeholder="e.g. ₱20,000" className="input" />
              </Field>
              <div />
              <div className="md:col-span-2">
                <Field label="Message / Special Request">
                  <textarea data-testid="booking-input-message" rows={4} value={form.message} onChange={change("message")} className="input" />
                </Field>
              </div>
              <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-4 pt-3">
                <div className="text-xs text-white/40">By submitting, you agree to be contacted via Facebook Messenger.</div>
                <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-60" data-testid="booking-submit-btn">
                  {submitting ? "Sending…" : "Send Booking"}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      <style>{`.input { width:100%; padding: 0.85rem 1rem; border-radius: 0.85rem; }`}</style>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <label className="block">
      <div className="text-xs uppercase tracking-widest text-white/60 mb-2">
        {label} {required && <span className="text-[#FF007F]">*</span>}
      </div>
      {children}
    </label>
  );
}
