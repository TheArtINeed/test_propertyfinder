import { FooterNote, TopBar } from "./ui";
import { MyHomes } from "./components/client";
import { HeroCta } from "./components/portfolio";

/**
 * First screen (spec v14 D10): the promise, one action per destination, and the PropWorth card only when homes exist.
 * No pitch blocks or instructions in the UI (brief); entry points and the pitch live in README and docs/mockups.
 */
export default function Home() {
  return (
    <main className="shell">
      <TopBar />
      <section className="hero">
        <span className="badge coral">New · Pilot in JVC</span>
        <h1>Your home is your biggest asset. Track it like one.</h1>
        <p className="lead">
          What your flat is worth today, what it rents for, what is being built next door. Every month, from real Dubai
          Land Department deals, not asking prices.
        </p>
        <HeroCta />
      </section>

      <MyHomes />
      <FooterNote />
    </main>
  );
}
