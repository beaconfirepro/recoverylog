import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Mail, Lock, Loader2, ChevronDown, ArrowRight } from "lucide-react";
import GoogleIcon from "@/components/GoogleIcon";
import { Image } from "@/components/ui/image";
import { safeReturnTo } from "@/lib/authReturnTo";
import PhoneFrame from "@/components/splash/PhoneFrame";
import DayMockup from "@/components/splash/DayMockup";
import CheckinMockup from "@/components/splash/CheckinMockup";
import HistoryMockup from "@/components/splash/HistoryMockup";
import TrendsMockup from "@/components/splash/TrendsMockup";

// The public face of the log. Anyone can land here, read what it is, see how it
// works, and sign in at the bottom — without a token being asked for first.
export default function Splash() {
  const returnTo = safeReturnTo();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      window.location.href = returnTo;
    } catch (err) {
      setError(err.message || "That email and password don't match.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => base44.auth.loginWithProvider("google", returnTo);
  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  const steps = [
    { title: "Tap, don't type", body: "Big tiles for water, meds, meals, pain and more. One tap opens a form tuned for one hand.", mockup: <DayMockup /> },
    { title: "One question at a time", body: "The check-in asks how you feel one measure at a time, so a rough morning is still four taps.", mockup: <CheckinMockup /> },
    { title: "The day writes itself", body: "Every entry lands on a timeline. Daily totals and red flags are drawn from what you logged.", mockup: <HistoryMockup /> },
    { title: "Show your surgeon", body: "Trends turn into charts, and days turn into a PDF ready for the follow-up visit.", mockup: <TrendsMockup /> }
  ];

  const features = [
    "Day zero is the anchor. Every label counts from surgery.",
    "Red flags watch the log for you and say what to do next.",
    "Your care team can read along — invite them from the app.",
    "Export a day or a range as a PDF for the visit."
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b-2 bg-background" style={{ paddingTop: "var(--safe-t)" }}>
        <div className="max-w-lg mx-auto px-4 py-2.5 flex items-center justify-between">
          <span className="font-display uppercase tracking-widest text-sm">LipNode</span>
          <button className="nb-btn h-9 px-4 bg-primary text-primary-foreground text-xs" onClick={() => scrollTo("login")}>
            Sign in
          </button>
        </div>
      </header>

      {/* Welcome hero */}
      <section className="max-w-lg mx-auto px-4 pt-8 pb-6 space-y-5">
        <div className="flex justify-center mb-1">
          <Image
            src="https://media.base44.com/images/public/6a9b4d25d94bfa5fda1dac13/4fd109b51_welcome-hero.png"
            alt="LipNode editorial illustration"
            fittingType="fit"
            className="w-full max-w-[240px] aspect-square"
          />
        </div>
        <h1 className="font-display text-5xl leading-[1] break-words" style={{ letterSpacing: "-0.04em" }}>
          A small<br />fierce<br />reckoning.
        </h1>
        <div className="border-l-4 border-primary pl-4 space-y-3">
          <p className="font-heading text-xl leading-6 break-words" style={{ letterSpacing: "-0.02em" }}>
            LipNode is your daily logbook for life with Lipidema.
          </p>
          <p className="text-base leading-snug break-words">
            Inputs. Outputs. Symptoms. Measurements. Appointments. More...
          </p>
          <p className="text-base leading-snug break-words">
            Just because they ignore us doesn't mean we ignore ourselves. Our body does keep a score and we are listening.
          </p>
        </div>
        <div className="pt-2 text-center">
          <button className="nb-btn h-12 px-6 bg-card" onClick={() => scrollTo("login")}>
            <ArrowRight className="w-4 h-4" /> Tap to sign in
          </button>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="max-w-lg mx-auto px-4 py-8 space-y-10">
        <h2 className="font-display text-2xl uppercase text-center">How it works</h2>
        {steps.map((s, i) => (
          <div key={s.title} className="space-y-4">
            <PhoneFrame label={s.title}>{s.mockup}</PhoneFrame>
            <p className="text-sm font-semibold text-center break-words max-w-md mx-auto">{s.body}</p>
            {i < steps.length - 1 && <div className="flex justify-center"><ChevronDown className="w-5 h-5 text-muted-foreground" /></div>}
          </div>
        ))}
      </section>

      {/* Features */}
      <section className="max-w-lg mx-auto px-4 py-8 space-y-3">
        <h2 className="font-display text-2xl uppercase text-center">What it keeps track of</h2>
        <div className="nb-card p-4 space-y-2">
          {features.map((f) => (
            <div key={f} className="flex items-start gap-2">
              <span className="shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: "hsl(var(--accent))", borderColor: "hsl(var(--foreground))" }}>✓</span>
              <p className="text-sm font-semibold break-words">{f}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Login */}
      <section id="login" className="max-w-lg mx-auto px-4 py-10 space-y-4">
        <div className="text-center space-y-1">
          <h2 className="font-display text-2xl uppercase">Sign in</h2>
          <p className="text-sm font-semibold text-muted-foreground">Open your log.</p>
        </div>
        <div className="nb-card p-6 min-w-0 space-y-4">
          <button className="nb-btn w-full h-14 bg-card" onClick={handleGoogle}>
            <GoogleIcon className="w-5 h-5 mr-2" />
            Continue with Google
          </button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-3 text-muted-foreground">or</span></div>
          </div>
          {error && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm break-words">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="sp-email" className="nb-label">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                <input id="sp-email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="nb-input pl-10" required />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="sp-password" className="nb-label">Password</label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                <input id="sp-password" type="password" autoComplete="current-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="nb-input pl-10" required />
              </div>
            </div>
            <button type="submit" className="nb-btn w-full h-14 bg-primary text-primary-foreground" disabled={loading}>
              {loading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Logging in…</>) : "Log in"}
            </button>
          </form>
          <p className="text-center text-sm text-muted-foreground">
            New here?{" "}
            <Link to={"/register" + (returnTo !== "/" ? "?returnTo=" + encodeURIComponent(returnTo) : "")} className="text-primary font-medium hover:underline">Create an account</Link>
          </p>
        </div>
      </section>

      <footer className="max-w-lg mx-auto px-4 pb-10 pt-4 text-center space-y-1">
        <p className="text-sm font-semibold break-words">
          Built for Lipidema Babes everywhere. 2026 Copyright Deborah Dale
        </p>
        <p className="text-xs text-muted-foreground break-words">
          LipNode is a personal log, not a medical record. Nothing here is sent to your surgeon.
        </p>
      </footer>
    </div>
  );
}