"use client";

import { useState } from "react";

export interface Series {
  name: string;
  color: string; // validated pair: #6250d6 / #eb6834
  points: { month: string; value: number | null; count: number }[];
}

const W = 340;
const H = 180;
const PAD = { l: 44, r: 12, t: 12, b: 24 };
const mLabel = (m: string) => new Date(m + "-01T00:00:00Z").toLocaleString("en-US", { month: "short", timeZone: "UTC" });
const k = (v: number) => `${(v / 1000).toFixed(1)}K`;

/** Line chart of median AED/m² by month: one axis, 2px lines, crosshair tooltip, legend + table view. */
export function PriceChart({ series, title }: { series: Series[]; title: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const months = series[0].points.map((p) => p.month);
  const values = series.flatMap((s) => s.points.map((p) => p.value).filter((v): v is number => v != null));
  const min = Math.floor((Math.min(...values) * 0.95) / 1000) * 1000;
  const max = Math.ceil((Math.max(...values) * 1.05) / 1000) * 1000;
  const x = (i: number) => PAD.l + (i * (W - PAD.l - PAD.r)) / Math.max(1, months.length - 1);
  const y = (v: number) => PAD.t + ((max - v) * (H - PAD.t - PAD.b)) / (max - min);
  const ticks = [min, (min + max) / 2, max];

  const path = (s: Series) => {
    let d = "";
    let pen = false;
    s.points.forEach((p, i) => {
      if (p.value == null) {
        pen = false;
        return;
      }
      d += `${pen ? "L" : "M"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`;
      pen = true;
    });
    return d;
  };

  return (
    <figure className="chart" style={{ margin: 0 }}>
      <figcaption className="meta" style={{ marginBottom: 4 }}>{title}</figcaption>
      <div className="legend">
        {series.map((s) => (
          <span key={s.name}>
            <i style={{ background: s.color }} aria-hidden /> {s.name}
          </span>
        ))}
      </div>
      <div style={{ position: "relative" }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={title} onMouseLeave={() => setHover(null)}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke="#ececec" strokeWidth={1} />
              <text x={PAD.l - 6} y={y(t) + 4} textAnchor="end" fontSize={10} fill="#707070">
                {k(t)}
              </text>
            </g>
          ))}
          {months.map((m, i) =>
            i % 3 === 0 || i === months.length - 1 ? (
              <text key={m} x={x(i)} y={H - 6} textAnchor="middle" fontSize={10} fill="#707070">
                {mLabel(m)}
              </text>
            ) : null,
          )}
          {hover != null ? <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={H - PAD.b} stroke="#cccccc" strokeWidth={1} /> : null}
          {series.map((s) => (
            <g key={s.name}>
              <path d={path(s)} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
              {s.points.map((p, i) =>
                p.value != null && (i === hover || i === s.points.length - 1) ? (
                  <circle key={i} cx={x(i)} cy={y(p.value)} r={4} fill={s.color} stroke="#fff" strokeWidth={2} />
                ) : null,
              )}
            </g>
          ))}
          {months.map((m, i) => (
            <rect
              key={m}
              x={x(i) - (W - PAD.l - PAD.r) / (2 * (months.length - 1))}
              y={0}
              width={(W - PAD.l - PAD.r) / (months.length - 1)}
              height={H}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
              onTouchStart={() => setHover(i)}
            />
          ))}
        </svg>
        {hover != null ? (
          <div className="tooltip" style={{ left: `${(x(hover) / W) * 100}%` }}>
            <b>{mLabel(months[hover])} 2026</b>
            {series.map((s) => {
              const p = s.points[hover];
              return (
                <div key={s.name}>
                  <i style={{ background: s.color }} aria-hidden /> {s.name}: {p.value != null ? `AED ${Math.round(p.value).toLocaleString("en-US")}/m²` : "too few deals"}{" "}
                  <span className="tiny">({p.count})</span>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
      <details>
        <summary className="meta">Show as table</summary>
        <table className="table">
          <thead>
            <tr>
              <th>Month</th>
              {series.map((s) => (
                <th key={s.name}>{s.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {months.map((m, i) => (
              <tr key={m}>
                <td>{mLabel(m)}</td>
                {series.map((s) => (
                  <td key={s.name}>{s.points[i].value != null ? Math.round(s.points[i].value!).toLocaleString("en-US") : "–"}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
