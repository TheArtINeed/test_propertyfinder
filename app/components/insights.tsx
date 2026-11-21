import type { Advice, Insight, Reading, Tone } from "@/lib/insights";
import { Source } from "../ui";

const ICON: Record<Tone, string> = { good: "▲", watch: "!", neutral: "•" };
const LABEL: Record<Tone, string> = { good: "Good", watch: "Watch", neutral: "Neutral" };

export function ToneBadge({ tone }: { tone: Tone }) {
  return (
    <span className={`tone ${tone}`}>
      <span aria-hidden>{ICON[tone]}</span> {LABEL[tone]}
    </span>
  );
}

export function InsightCard({ i }: { i: Insight }) {
  return (
    <li className="insight">
      <div className="between">
        <h3>{i.title}</h3>
        <ToneBadge tone={i.tone} />
      </div>
      <p className="meta">{i.detail}</p>
      <p className="action">→ {i.action}</p>
      <Source kind={i.source} />
    </li>
  );
}

/** "What this means" block: one headline, then each reading with its action. */
export function ReadingCard({ reading, limit }: { reading: Reading; limit?: number }) {
  const shown = limit ? reading.insights.slice(0, limit) : reading.insights;
  return (
    <div className="card">
      <p className="meta">What this means</p>
      <div className="between" style={{ alignItems: "center" }}>
        <h2 style={{ margin: 0 }}>{reading.headline}</h2>
        <ToneBadge tone={reading.tone} />
      </div>
      <ul className="list insights">
        {shown.map((i) => (
          <InsightCard key={i.id} i={i} />
        ))}
      </ul>
      <p className="tiny">Readings from registered deals and leases. Not financial advice.</p>
    </div>
  );
}

export function AdviceCard({ advice, label = "What this means" }: { advice: Advice; label?: string }) {
  return (
    <div className={`card advice ${advice.tone}`}>
      <div className="between">
        <p className="meta">{label}</p>
        <ToneBadge tone={advice.tone} />
      </div>
      <h3>{advice.title}</h3>
      <p className="meta">{advice.detail}</p>
      <p className="action">→ {advice.action}</p>
    </div>
  );
}
