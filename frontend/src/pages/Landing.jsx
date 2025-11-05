import { Link } from "react-router-dom";
import Logo from "../components/Logo.jsx";

const highlights = [
  "Mature community of intentional African singles",
  "Profiles curated for purpose-driven dating",
  "Built with the cultural nuance our stories deserve",
];

const primaryCtaClasses =
  "flex flex-1 items-center justify-center rounded-full bg-gradient-to-r from-brand-dark via-[#9d79ff] to-[#b894ff] px-5 py-2 text-sm font-semibold uppercase tracking-wide text-white shadow-xl transition hover:via-brand-dark hover:to-[#9d79ff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark";

const secondaryCtaOuterClasses =
  "group flex flex-1 items-center justify-center rounded-full bg-gradient-to-r from-brand-dark via-[#9d79ff] to-[#b894ff] p-[2px] shadow-xl transition hover:from-brand-dark hover:via-[#a88bff] hover:to-[#caa8ff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark";

const secondaryCtaInnerClasses =
  "flex h-full w-full items-center justify-center rounded-full bg-white px-5 py-2 text-sm font-semibold uppercase tracking-wide text-brand-dark transition group-hover:bg-white/95";

const Landing = () => (
  <div className="gradient-bg relative min-h-screen overflow-hidden">
    <div className="pointer-events-none absolute -right-32 -top-36 h-72 w-72 rounded-full bg-brand-light/80 blur-3xl" />
    <div className="pointer-events-none absolute bottom-[-120px] left-[-80px] h-80 w-80 rounded-full bg-brand-dark/20 blur-[160px]" />
    <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-8">
      <Logo />
      <div className="flex items-center gap-4">
        <Link
          to="/login"
          className="text-sm font-semibold text-slate-700 transition hover:text-brand-dark"
        >
          Log in
        </Link>
        <Link
          to="/register"
          className="rounded-full bg-gradient-to-r from-brand-dark via-[#9d79ff] to-[#b894ff] px-6 py-2 text-sm font-semibold text-white shadow-lg transition hover:via-brand-dark hover:to-[#9d79ff]"
        >
          Get started
        </Link>
      </div>
    </header>
    <main className="relative z-10 mx-auto flex max-w-5xl flex-col items-center gap-6 px-6 py-4 text-center md:flex-row md:items-stretch md:gap-8 md:py-6 md:text-left">
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
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            to="/register"
            className={primaryCtaClasses}
          >
            Join Kujuana
          </Link>
          <Link
            to="/upgrade"
            className={secondaryCtaOuterClasses}
          >
            <span className={secondaryCtaInnerClasses}>Explore membership</span>
          </Link>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center md:items-center">
        <div className="relative w-full max-w-xl max-h-[420px] aspect-[4/3] overflow-hidden rounded-[2.75rem] shadow-2xl md:max-w-2xl md:max-h-[500px]">
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


