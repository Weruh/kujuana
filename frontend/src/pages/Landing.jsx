import { Link } from "react-router-dom";
import Logo from "../components/Logo.jsx";

const highlights = [
  "Mature community of intentional African singles",
  "Profiles curated for purpose-driven dating",
  "Built with the cultural nuance our stories deserve",
];

const Landing = () => (
  <div className="gradient-bg relative min-h-screen overflow-hidden">
    <div className="pointer-events-none absolute -right-32 -top-36 h-72 w-72 rounded-full bg-brand-light/80 blur-3xl" />
    <div className="pointer-events-none absolute bottom-[-120px] left-[-80px] h-80 w-80 rounded-full bg-brand-dark/20 blur-[160px]" />
    <header className="relative z-10 mx-auto flex max-w-6xl flex-col items-start gap-6 px-6 py-8 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <Logo className="w-full sm:w-auto" />
      <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-4">
        <Link
          to="/login"
          className="inline-flex w-full items-center justify-center rounded-full border border-transparent bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-white/90 hover:text-brand-dark sm:w-auto"
        >
          Log in
        </Link>
        <Link
          to="/register"
          className="w-full rounded-full bg-gradient-to-r from-brand-dark via-[#9d79ff] to-[#b894ff] px-6 py-2 text-center text-sm font-semibold text-white shadow-lg transition hover:via-brand-dark hover:to-[#9d79ff] sm:w-auto"
        >
          Get started
        </Link>
      </div>
    </header>
    <main className="relative z-10 mx-auto flex max-w-4xl flex-col items-center gap-6 px-6 py-4 text-center md:flex-row md:items-stretch md:gap-8 md:py-6 md:text-left">
      <div className="flex-1 space-y-3 rounded-[2.5rem] bg-white/70 p-4 shadow-xl backdrop-blur-md md:space-y-4 md:p-7 md:h-full">
        <span className="inline-block rounded-full bg-gradient-to-r from-brand-dark to-[#a87eff] px-4 py-1 text-xs font-bold uppercase tracking-[0.4em] text-white shadow-sm">
          Dating with Intention
        </span>
        <h1 className="text-3xl font-semibold leading-tight text-slate-900 md:text-4xl md:leading-snug">
          Build the love story you have been praying and preparing for.
        </h1>
        <p className="text-sm leading-snug text-slate-700 md:text-base md:leading-relaxed">
          Kujuana is crafted for Africans at home and in the diaspora who are ready for a covenant-centered relationship.
          Thoughtful profiles, meaningful prompts, and community accountability for real connection.
        </p>
        <div className="space-y-2 text-left">
          {highlights.map((item) => (
            <p key={item} className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-light text-sm text-brand-dark shadow">*</span>
              {item}
            </p>
          ))}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:justify-center sm:gap-4">
          <Link
            to="/register"
            className="w-full rounded-full bg-gradient-to-r from-brand-dark via-[#a671ff] to-[#d2b7ff] px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-[0.25em] text-white shadow-[0_10px_20px_rgba(120,73,255,0.3)] transition hover:shadow-[0_14px_28px_rgba(120,73,255,0.4)] sm:flex-1 sm:text-sm"
          >
            Join
          </Link>
          <Link
            to="/upgrade"
            className="w-full rounded-full bg-gradient-to-r from-brand-dark/70 via-[#c39dff]/70 to-[#f1dcff]/70 p-[1.5px] text-center shadow-[0_10px_18px_rgba(120,73,255,0.2)] transition hover:shadow-[0_14px_26px_rgba(120,73,255,0.3)] sm:flex-1"
          >
            <span className="block w-full rounded-full bg-white/95 px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-brand-dark sm:px-8 sm:text-sm">
              Explore 
            </span>
          </Link>
        </div>
      </div>
      <div className="flex flex-1 justify-center md:items-stretch">
        <div className="relative ml-8 mt-24 flex-1 w-full max-w-md max-h-[320px] aspect-[4/3] overflow-hidden rounded-[2.75rem] shadow-2xl md:max-w-lg md:max-h-[360px] md:h-full">
          <img
            src="/images/profiles/kujuana.jpeg"
            alt="Kujuana couple smiling together"
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    </main>
  </div>
);

export default Landing;

