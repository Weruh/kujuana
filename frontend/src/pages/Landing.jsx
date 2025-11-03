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
    <main className="relative z-10 mx-auto flex max-w-6xl flex-col items-center gap-16 px-6 pb-24 text-center md:flex-row md:text-left">
      <div className="flex-1 space-y-6 rounded-[2.5rem] bg-white/70 p-8 shadow-xl backdrop-blur-md md:p-12">
        <span className="inline-block rounded-full bg-gradient-to-r from-brand-dark to-[#a87eff] px-4 py-1 text-xs font-bold uppercase tracking-[0.4em] text-white shadow-sm">
          Dating with Intention
        </span>
        <h1 className="text-4xl font-semibold text-slate-900 md:text-5xl">
          Build the love story you have been praying and preparing for.
        </h1>
        <p className="text-lg text-slate-700">
          Kujuana is crafted for Africans at home and in the diaspora who are ready for a covenant-centered relationship.
          Thoughtful profiles, meaningful prompts, and community accountability for real connection.
        </p>
        <div className="space-y-3 text-left">
          {highlights.map((item) => (
            <p key={item} className="flex items-center gap-3 text-sm font-medium text-slate-700">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-light text-brand-dark shadow">*</span>
              {item}
            </p>
          ))}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            to="/register"
            className="flex-1 rounded-full bg-gradient-to-r from-brand-dark via-[#9d79ff] to-[#b894ff] px-6 py-3 text-center text-sm font-semibold uppercase tracking-wide text-white shadow-xl transition hover:via-brand-dark hover:to-[#9d79ff]"
          >
            Join Kujuana
          </Link>
          <Link
            to="/upgrade"
            className="flex-1 rounded-full border-2 border-brand-dark/60 bg-white/60 px-6 py-3 text-center text-sm font-semibold uppercase tracking-wide text-brand-dark shadow-lg backdrop-blur transition hover:border-brand-dark hover:bg-white/80"
          >
            Explore membership
          </Link>
        </div>
      </div>
      <div className="flex flex-1 justify-center">
        <div className="relative w-full max-w-md overflow-hidden rounded-[2.75rem] bg-white/60 p-6 shadow-2xl backdrop-blur">
          <div className="pointer-events-none absolute inset-0 rounded-[2.25rem] bg-gradient-to-br from-brand-light/60 via-transparent to-brand/50 blur-3xl" />
          <img
            src="https://images.unsplash.com/photo-1543269664-7eef42226a21?auto=format&fit=crop&w=720&q=80"
            alt="Kujuana couple"
            className="relative z-10 rounded-[2rem] shadow-xl"
          />
        </div>
      </div>
    </main>
  </div>
);

export default Landing;
