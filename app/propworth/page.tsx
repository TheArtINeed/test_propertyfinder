import { PortfolioView } from "../components/portfolio";
import { FooterNote, TopBar } from "../ui";

/** P1: PropWorth = all your homes in one place. Homes are saved on this device. */
export default function PropWorthPage() {
  return (
    <main className="shell">
      <TopBar back="/" title="PropWorth" />
      <h1>Your PropWorth</h1>
      <p className="lead">All your homes in one place: what each is worth, what it rents for and what needs attention.</p>
      <PortfolioView />
      <FooterNote />
    </main>
  );
}
