import { loadSnapshot } from "@/lib/data";
import { firstScreenProof } from "@/lib/first-screen";
import { FooterNote, TopBar } from "./ui";
import { FirstScreen } from "./components/first-screen";

/**
 * First screen (spec v17, section 24; D10 kept): the promise and one action per destination, then a reason to start:
 * a trust line, real numbers for the pilot building and what the user gets after the first estimate.
 * A returning owner sees their PropWorth first. No reviewer pitch or instructions in the UI.
 */
export default function Home() {
  const { resales, rents } = loadSnapshot();
  const proof = firstScreenProof(resales, rents);
  return (
    <main className="shell">
      <TopBar />
      <FirstScreen proof={proof}>
        <span className="badge coral">New · Pilot in JVC</span>
        <h1>Your home is your biggest asset. Track it like one.</h1>
        <p className="lead">
          What your flat is worth today, what it rents for, what is being built next door. Every month, from real Dubai
          Land Department deals, not asking prices.
        </p>
      </FirstScreen>
      <FooterNote />
    </main>
  );
}
