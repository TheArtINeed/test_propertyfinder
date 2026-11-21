"use client";

import { useEffect, useState } from "react";
import type { NewsItem, Post } from "@/lib/news";
import { track } from "@/lib/track";

const IMPACT = { up: "▲", down: "▼", neutral: "•" } as const;
const date = (iso: string) => new Date(iso + "T00:00:00Z").toLocaleString("en-US", { day: "numeric", month: "short", timeZone: "UTC" });

export function NewsFeed({ items, building }: { items: NewsItem[]; building: string }) {
  const [filter, setFilter] = useState<"all" | "data" | "View">("all");
  useEffect(() => track("feed_opened", { tab: "news", building }), [building]);
  const shown = items.filter((i) => filter === "all" || (filter === "data" ? i.kind === "data" : i.tag === filter));
  return (
    <div className="card">
      <h2>News for your home</h2>
      <p className="meta">Deals, rents and what is planned around {building}, with the likely effect on your price.</p>
      <div className="chips" role="group" aria-label="Filter news">
        {([
          ["all", "All"],
          ["data", "Deals & rents"],
          ["View", "View & building"],
        ] as const).map(([k, l]) => (
          <button key={k} className="chip" aria-pressed={filter === k} onClick={() => setFilter(k)}>
            {l}
          </button>
        ))}
      </div>
      <ul className="feed">
        {shown.map((n) => (
          <li key={n.id}>
            <div className="between">
              <span className="tiny">
                {n.tag} · {date(n.date)}
              </span>
              <span className={`impact ${n.impact}`}>
                <span aria-hidden>{IMPACT[n.impact]}</span> {n.impactText}
              </span>
            </div>
            <h3>{n.title}</h3>
            <p className="meta">{n.body}</p>
            {n.kind === "data" ? <span className="src">DLD / Ejari open data</span> : <span className="src illustrative">Illustrative example, not a real event</span>}
          </li>
        ))}
      </ul>
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
