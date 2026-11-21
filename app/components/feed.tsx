"use client";

import { useEffect, useState } from "react";
import { IMPACT_WORD, type NewsItem, type Post } from "@/lib/news";
import { track } from "@/lib/track";
import { Icon } from "../icons";

const IMPACT = { up: "▲", down: "▼", neutral: "•" } as const;
const date = (iso: string) => new Date(iso + "T00:00:00Z").toLocaleString("en-US", { day: "numeric", month: "short", timeZone: "UTC" });

/** One news item: date, source, impact (icon + word), label. Opening it logs news_opened. */
function NewsItemView({ n }: { n: NewsItem }) {
  return (
    <li className={`news ${n.kind}`}>
      <details onToggle={(e) => (e.currentTarget as HTMLDetailsElement).open && track("news_opened", { item: n.id, real: n.kind === "data" })}>
        <summary>
          <span className="tiny">
            {n.tag} · {date(n.date)}
          </span>
          <b className="news-title">{n.title}</b>
          <span className={`impact ${n.impact}`}>
            <span aria-hidden>{IMPACT[n.impact]}</span> {IMPACT_WORD[n.impact]}: {n.impactText}
          </span>
        </summary>
        <p className="meta">{n.body}</p>
      </details>
      <span className={n.kind === "data" ? "src" : "src illustrative"}>{n.source}</span>
    </li>
  );
}

export function NewsList({ items }: { items: NewsItem[] }) {
  return (
    <ul className="feed">
      {items.map((n) => (
        <NewsItemView key={n.id} n={n} />
      ))}
    </ul>
  );
}

/** N2: market moves are numbers; shown inside the numbers block. */
export function MarketMoves({ items }: { items: NewsItem[] }) {
  if (!items.length) return null;
  return (
    <section>
      <h3>Market moves</h3>
      <NewsList items={items} />
    </section>
  );
}

/** N1/N2: building and area news, a separate block below the numbers. */
export function AreaNewsBlock({ items, building }: { items: NewsItem[]; building: string }) {
  useEffect(() => track("feed_opened", { tab: "news", building }), [building]);
  return (
    <section className="news-block" data-block="news" aria-label="Building and area news">
      <h2>
        <Icon name="news" size={22} /> Building and area news
      </h2>
      <p className="meta">What is planned around {building} and how it may affect your price.</p>
      <NewsList items={items} />
    </section>
  );
}

/** V12: the same digest as a WhatsApp message. */
export function WhatsAppPreview({ lines }: { lines: string[] }) {
  return (
    <div className="card wa">
      <p className="tiny">How it arrives on WhatsApp</p>
      <div className="wa-bubble">
        {lines.map((l, i) => (
          <p key={i}>{l}</p>
        ))}
      </div>
      <p className="tiny">Preview only: no message is sent.</p>
    </div>
  );
}

export function Community({ posts, building }: { posts: Post[]; building: string }) {
  const [helped, setHelped] = useState<Record<string, boolean>>({});
  useEffect(() => {
    track("feed_opened", { tab: "community", building });
    try {
      setHelped(JSON.parse(localStorage.getItem("pf.helpful") ?? "{}"));
    } catch {
      /* storage blocked */
    }
  }, [building]);
  function toggle(id: string) {
    const next = { ...helped, [id]: !helped[id] };
    setHelped(next);
    try {
      localStorage.setItem("pf.helpful", JSON.stringify(next));
    } catch {
      /* storage blocked */
    }
    track("post_reacted", { post: id, helpful: next[id] });
  }
  return (
    <div className="card">
      <h2>Owners of {building}</h2>
      <p className="meta">Verified owners only. No agents, no ads.</p>
      <ul className="feed">
        {posts.map((p) => (
          <li key={p.id}>
            <div className="between">
              <span className="tiny">
                {p.author} · {p.ago}
              </span>
              <span className="badge">{p.topic}</span>
            </div>
            <p>{p.text}</p>
            <div className="row">
              <button className="chip small" aria-pressed={!!helped[p.id]} onClick={() => toggle(p.id)}>
                Helpful · {p.helpful + (helped[p.id] ? 1 : 0)}
              </button>
              <span className="tiny">{p.replies} replies</span>
            </div>
          </li>
        ))}
      </ul>
      <button className="btn secondary" disabled title="Posting opens after ownership is verified">
        Write a post (after verification)
      </button>
      <p className="tiny" style={{ marginTop: 8 }}>Illustrative posts: shows how the owners&apos; space would look.</p>
    </div>
  );
}
