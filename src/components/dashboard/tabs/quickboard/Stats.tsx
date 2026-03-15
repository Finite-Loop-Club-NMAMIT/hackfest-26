"use client";

import {
  BarChart3,
  Building2,
  CheckCircle2,
  LayoutGrid,
  MapPin,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

type StatCardProps = {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
};

export type QuickStats = {
  totalTeams: number;
  totalUsers: number;
  totalParticipants: number;
  uniqueTotalColleges: number;
  uniqueTotalStates: number;
  uniqueConfirmedColleges: number;
  uniqueConfirmedStates: number;
  confirmedTeams: number;
  confirmedParticipants: number;
  ideaSubmissions: number;
};

export type TrendPoint = {
  date: string;
  totalRegistrations: number;
  confirmedRegistrations: number;
  ideaSubmissions: number;
  userAccounts: number;
};

function StatCard({ title, value, description, icon }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-4 w-4 text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

function AreaChart({ trends, title }: { trends: TrendPoint[]; title: string }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (trends.length === 0) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No registration data yet
          </p>
        </CardContent>
      </Card>
    );
  }

  const cumulative = trends.reduce<
    {
      date: string;
      total: number;
      confirmed: number;
      ideas: number;
      users: number;
      usersScaled: number;
    }[]
  >((acc, t) => {
    const prev =
      acc.length > 0
        ? (acc[acc.length - 1] ?? {
            total: 0,
            confirmed: 0,
            ideas: 0,
            users: 0,
            usersScaled: 0,
          })
        : { total: 0, confirmed: 0, ideas: 0, users: 0, usersScaled: 0 };
    acc.push({
      date: t.date,
      total: prev.total + t.totalRegistrations,
      confirmed: prev.confirmed + t.confirmedRegistrations,
      ideas: prev.ideas + t.ideaSubmissions,
      users: prev.users + t.userAccounts,
      usersScaled: (prev.users + t.userAccounts) / 4,
    });
    return acc;
  }, []);

  const maxVal = Math.max(
    ...cumulative.map((c) => Math.max(c.total, c.usersScaled)),
    1,
  );
  const W = 800;
  const H = 250;
  const padL = 40;
  const padR = 20;
  const padT = 10;
  const padB = 30;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const xStep =
    cumulative.length > 1 ? chartW / (cumulative.length - 1) : chartW;

  function toPoint(val: number, i: number) {
    const x = padL + i * xStep;
    const y = padT + chartH - (val / maxVal) * chartH;
    return { x, y };
  }

  function makePath(
    data: typeof cumulative,
    key: "total" | "confirmed" | "ideas" | "users" | "usersScaled",
  ) {
    return data
      .map((d, i) => {
        const { x, y } = toPoint(d[key], i);
        return `${i === 0 ? "M" : "L"}${x},${y}`;
      })
      .join(" ");
  }

  function makeArea(
    data: typeof cumulative,
    key: "total" | "confirmed" | "ideas" | "users" | "usersScaled",
  ) {
    const line = makePath(data, key);
    const first = padL;
    const last = padL + (data.length - 1) * xStep;
    return `${line} L${last},${padT + chartH} L${first},${padT + chartH} Z`;
  }

  const gridLines = 4;
  const gridVals = Array.from({ length: gridLines + 1 }, (_, i) =>
    Math.round((maxVal / gridLines) * i),
  );

  const labelInterval = Math.max(1, Math.floor(cumulative.length / 6));

  const lastPoint = cumulative[cumulative.length - 1] ?? {
    users: 0,
    total: 0,
    confirmed: 0,
    ideas: 0,
    usersScaled: 0,
  };
  const hovered = hoveredIdx !== null ? cumulative[hoveredIdx] : null;
  const hoveredTrend = hoveredIdx !== null ? trends[hoveredIdx] : null;
  const _hoveredPrev =
    hoveredIdx !== null && hoveredIdx > 0 ? cumulative[hoveredIdx - 1] : null;

  return (
    <Card className="col-span-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mt-1">
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block w-3 h-0.5 rounded"
              style={{ background: "#06b6d4" }}
            />
            Users ({lastPoint.users}){" "}
            <span className="text-muted-foreground/50">÷4</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block w-3 h-0.5 rounded"
              style={{ background: "#8b5cf6" }}
            />
            Teams ({lastPoint.total})
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block w-3 h-0.5 rounded"
              style={{ background: "#22c55e" }}
            />
            Confirmed ({lastPoint.confirmed})
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block w-3 h-0.5 rounded"
              style={{ background: "#f59e0b" }}
            />
            Ideas ({lastPoint.ideas})
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-0 relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto"
          preserveAspectRatio="xMidYMid meet"
          onMouseLeave={() => setHoveredIdx(null)}
        >
          <title>{title}</title>
          {/* Grid */}
          {gridVals.map((v) => {
            const y = padT + chartH - (v / maxVal) * chartH;
            return (
              <g key={v}>
                <line
                  x1={padL}
                  y1={y}
                  x2={W - padR}
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity={0.08}
                />
                <text
                  x={padL - 6}
                  y={y + 3}
                  textAnchor="end"
                  fill="currentColor"
                  opacity={0.4}
                  fontSize={9}
                >
                  {v}
                </text>
              </g>
            );
          })}

          {/* Areas */}
          <path
            d={makeArea(cumulative, "usersScaled")}
            fill="#06b6d4"
            fillOpacity={0.08}
          />
          <path
            d={makeArea(cumulative, "total")}
            fill="#8b5cf6"
            fillOpacity={0.12}
          />
          <path
            d={makeArea(cumulative, "confirmed")}
            fill="#22c55e"
            fillOpacity={0.12}
          />
          <path
            d={makeArea(cumulative, "ideas")}
            fill="#f59e0b"
            fillOpacity={0.1}
          />

          {/* Lines */}
          <path
            d={makePath(cumulative, "usersScaled")}
            fill="none"
            stroke="#06b6d4"
            strokeWidth={2}
            strokeLinejoin="round"
          />
          <path
            d={makePath(cumulative, "total")}
            fill="none"
            stroke="#8b5cf6"
            strokeWidth={2}
            strokeLinejoin="round"
          />
          <path
            d={makePath(cumulative, "confirmed")}
            fill="none"
            stroke="#22c55e"
            strokeWidth={2}
            strokeLinejoin="round"
          />
          <path
            d={makePath(cumulative, "ideas")}
            fill="none"
            stroke="#f59e0b"
            strokeWidth={1.5}
            strokeLinejoin="round"
            strokeDasharray="4 3"
          />

          {/* Hover crosshair + dots */}
          {hovered && hoveredIdx !== null && (
            <>
              <line
                x1={toPoint(0, hoveredIdx).x}
                y1={padT}
                x2={toPoint(0, hoveredIdx).x}
                y2={padT + chartH}
                stroke="currentColor"
                strokeOpacity={0.2}
                strokeDasharray="3 3"
              />
              <circle
                cx={toPoint(hovered.usersScaled, hoveredIdx).x}
                cy={toPoint(hovered.usersScaled, hoveredIdx).y}
                r={4}
                fill="#06b6d4"
                stroke="white"
                strokeWidth={1.5}
              />
              <circle
                cx={toPoint(hovered.total, hoveredIdx).x}
                cy={toPoint(hovered.total, hoveredIdx).y}
                r={4}
                fill="#8b5cf6"
                stroke="white"
                strokeWidth={1.5}
              />
              <circle
                cx={toPoint(hovered.confirmed, hoveredIdx).x}
                cy={toPoint(hovered.confirmed, hoveredIdx).y}
                r={4}
                fill="#22c55e"
                stroke="white"
                strokeWidth={1.5}
              />
              <circle
                cx={toPoint(hovered.ideas, hoveredIdx).x}
                cy={toPoint(hovered.ideas, hoveredIdx).y}
                r={4}
                fill="#f59e0b"
                stroke="white"
                strokeWidth={1.5}
              />
            </>
          )}

          {/* Latest dots (when not hovering) */}
          {hoveredIdx === null && (
            <>
              <circle
                cx={toPoint(lastPoint.usersScaled, cumulative.length - 1).x}
                cy={toPoint(lastPoint.usersScaled, cumulative.length - 1).y}
                r={3}
                fill="#06b6d4"
              />
              <circle
                cx={toPoint(lastPoint.total, cumulative.length - 1).x}
                cy={toPoint(lastPoint.total, cumulative.length - 1).y}
                r={3}
                fill="#8b5cf6"
              />
              <circle
                cx={toPoint(lastPoint.confirmed, cumulative.length - 1).x}
                cy={toPoint(lastPoint.confirmed, cumulative.length - 1).y}
                r={3}
                fill="#22c55e"
              />
              <circle
                cx={toPoint(lastPoint.ideas, cumulative.length - 1).x}
                cy={toPoint(lastPoint.ideas, cumulative.length - 1).y}
                r={3}
                fill="#f59e0b"
              />
            </>
          )}

          {/* X-axis labels */}
          {cumulative.map((d, i) => {
            if (i % labelInterval !== 0 && i !== cumulative.length - 1)
              return null;
            const x = padL + i * xStep;
            const label = new Date(d.date).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
            });
            return (
              <text
                key={d.date}
                x={x}
                y={H - 4}
                textAnchor="middle"
                fill="currentColor"
                opacity={0.4}
                fontSize={8}
              >
                {label}
              </text>
            );
          })}

          {/* Invisible hover zones — one rect per data point */}
          {cumulative.map((c, i) => {
            const x = padL + i * xStep - xStep / 2;
            return (
              // biome-ignore lint/a11y/noStaticElementInteractions: chart hover zones
              <rect
                key={`hover-${c.date}`}
                x={Math.max(x, padL - 5)}
                y={padT}
                width={xStep}
                height={chartH}
                fill="transparent"
                onMouseEnter={() => setHoveredIdx(i)}
              />
            );
          })}
        </svg>

        {/* Tooltip */}
        {hovered && hoveredIdx !== null && hoveredTrend && (
          <div
            className="absolute pointer-events-none bg-card border border-border rounded-lg shadow-lg px-3 py-2 text-xs z-10"
            style={{
              left: `${(toPoint(0, hoveredIdx).x / W) * 100}%`,
              top: "12px",
              transform:
                hoveredIdx > cumulative.length / 2
                  ? "translateX(-100%)"
                  : "translateX(0)",
            }}
          >
            <div className="font-semibold text-foreground mb-1.5">
              {new Date(hovered.date).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: "#06b6d4" }}
                  />
                  Users
                </span>
                <span className="tabular-nums font-medium">
                  {hovered.users}
                  <span className="text-emerald-500 ml-1">
                    +{hoveredTrend.userAccounts}
                  </span>
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: "#8b5cf6" }}
                  />
                  Teams
                </span>
                <span className="tabular-nums font-medium">
                  {hovered.total}
                  <span className="text-emerald-500 ml-1">
                    +{hoveredTrend.totalRegistrations}
                  </span>
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: "#22c55e" }}
                  />
                  Confirmed
                </span>
                <span className="tabular-nums font-medium">
                  {hovered.confirmed}
                  <span className="text-emerald-500 ml-1">
                    +{hoveredTrend.confirmedRegistrations}
                  </span>
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: "#f59e0b" }}
                  />
                  Ideas
                </span>
                <span className="tabular-nums font-medium">
                  {hovered.ideas}
                  <span className="text-emerald-500 ml-1">
                    +{hoveredTrend.ideaSubmissions}
                  </span>
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DailyBars({ trends, title }: { trends: TrendPoint[]; title: string }) {
  if (trends.length === 0) return null;

  const max = Math.max(...trends.map((t) => t.totalRegistrations), 1);
  const recent = trends.slice(-14);
  const barMaxH = 112; // matches h-28 = 7rem = 112px

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <p className="text-xs text-muted-foreground">
          Last {recent.length} days
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-1" style={{ height: barMaxH }}>
          {recent.map((t) => {
            const barH = Math.max(
              (t.totalRegistrations / max) * barMaxH,
              t.totalRegistrations > 0 ? 4 : 1,
            );
            const confirmedH =
              t.confirmedRegistrations > 0
                ? (t.confirmedRegistrations / t.totalRegistrations) * barH
                : 0;
            const label = new Date(t.date).toLocaleDateString("en-IN", {
              day: "numeric",
            });
            return (
              <div
                key={t.date}
                className="flex-1 flex flex-col items-center justify-end group"
                title={`${t.date}: ${t.totalRegistrations} total, ${t.confirmedRegistrations} confirmed`}
                style={{ height: barMaxH }}
              >
                <span className="text-[9px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity tabular-nums mb-0.5">
                  {t.totalRegistrations}
                </span>
                <div className="w-full relative" style={{ height: barH }}>
                  <div className="absolute inset-0 rounded-t bg-violet-500/30" />
                  <div
                    className="absolute bottom-0 left-0 right-0 rounded-t bg-emerald-500/70"
                    style={{ height: confirmedH }}
                  />
                </div>
                <span className="text-[8px] text-muted-foreground/60 mt-0.5">
                  {label}
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex gap-3 mt-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-violet-500/30" /> Total
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-emerald-500/70" /> Confirmed
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function DonutChart({
  slices,
  title,
  centerLabel,
  centerValue,
}: {
  slices: { label: string; value: number; color: string }[];
  title: string;
  centerLabel: string;
  centerValue: number;
}) {
  const total = slices.reduce((s, i) => s + i.value, 0) || 1;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-3">
        <div className="relative w-32 h-32">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <title>{title}</title>
            {slices.map((slice) => {
              const dash = (slice.value / total) * circumference;
              const gap = circumference - dash;
              const currentOffset = offset;
              offset += dash;
              return (
                <circle
                  key={slice.label}
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke={slice.color}
                  strokeWidth="10"
                  strokeDasharray={`${dash} ${gap}`}
                  strokeDashoffset={-currentOffset}
                  strokeLinecap="round"
                  className="transition-all duration-700 ease-out"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold">{centerValue}</span>
            <span className="text-[10px] text-muted-foreground">
              {centerLabel}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
          {slices.map((slice) => (
            <div
              key={slice.label}
              className="flex items-center gap-1 text-[11px]"
            >
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: slice.color }}
              />
              <span className="text-muted-foreground">{slice.label}</span>
              <span className="font-semibold tabular-nums">{slice.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ConversionFunnel({ data }: { data: QuickStats }) {
  const steps = [
    { label: "User Accounts", count: data.totalUsers, color: "#8b5cf6" },
    { label: "In Teams", count: data.totalParticipants, color: "#6366f1" },
    { label: "Teams Registered", count: data.totalTeams, color: "#3b82f6" },
    { label: "Teams Confirmed", count: data.confirmedTeams, color: "#22c55e" },
    { label: "Ideas Submitted", count: data.ideaSubmissions, color: "#f59e0b" },
  ];
  const max = Math.max(...steps.map((s) => s.count), 1);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Conversion Funnel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {steps.map((step, i) => {
          const pct = (step.count / max) * 100;
          const prevCount = i > 0 ? steps[i - 1]?.count : null;
          const dropPct =
            prevCount && prevCount > 0
              ? Math.round((step.count / prevCount) * 100)
              : null;
          return (
            <div key={step.label} className="space-y-0.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{step.label}</span>
                <span className="tabular-nums font-medium">
                  {step.count}
                  {dropPct !== null && (
                    <span className="text-muted-foreground/60 ml-1">
                      ({dropPct}%)
                    </span>
                  )}
                </span>
              </div>
              <div className="h-5 w-full rounded bg-muted/30 overflow-hidden flex items-center">
                <div
                  className="h-full rounded transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    background: step.color,
                    opacity: 0.7,
                  }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function VisualStats({
  data,
  trends,
}: {
  data: QuickStats;
  trends: TrendPoint[];
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Cumulative Growth Chart — spans full width */}
      <AreaChart trends={trends} title="Cumulative Growth" />

      {/* Daily Registrations Bar Chart */}
      <DailyBars trends={trends} title="Daily Registrations" />

      {/* Registration Pipeline Donut */}
      <DonutChart
        title="Registration Pipeline"
        centerLabel="Teams"
        centerValue={data.totalTeams}
        slices={[
          { label: "Confirmed", value: data.confirmedTeams, color: "#22c55e" },
          {
            label: "Unconfirmed",
            value: data.totalTeams - data.confirmedTeams,
            color: "#f59e0b",
          },
        ]}
      />

      {/* Geographic Reach Donut */}
      <DonutChart
        title="Geographic Reach"
        centerLabel="Colleges"
        centerValue={data.uniqueTotalColleges}
        slices={[
          {
            label: "Confirmed",
            value: data.uniqueConfirmedColleges,
            color: "#06b6d4",
          },
          {
            label: "Unconfirmed",
            value: Math.max(
              data.uniqueTotalColleges - data.uniqueConfirmedColleges,
              0,
            ),
            color: "#94a3b8",
          },
        ]}
      />

      {/* Conversion Funnel */}
      <ConversionFunnel data={data} />

      {/* States Donut */}
      <DonutChart
        title="States Coverage"
        centerLabel="States"
        centerValue={data.uniqueTotalStates}
        slices={[
          {
            label: "Confirmed",
            value: data.uniqueConfirmedStates,
            color: "#10b981",
          },
          {
            label: "Unconfirmed",
            value: Math.max(
              data.uniqueTotalStates - data.uniqueConfirmedStates,
              0,
            ),
            color: "#94a3b8",
          },
        ]}
      />
    </div>
  );
}

export function Stats({
  data: quickStats,
  trends = [],
}: {
  data: QuickStats | null;
  trends?: TrendPoint[];
}) {
  const [visualMode, setVisualMode] = useState(false);

  if (quickStats == null) {
    return null;
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Quickboard</h2>
          <p className="text-muted-foreground">Overview of Hackfest Stats</p>
        </div>

        <button
          type="button"
          onClick={() => setVisualMode(!visualMode)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          {visualMode ? (
            <>
              <LayoutGrid className="h-4 w-4" />
              Cards
            </>
          ) : (
            <>
              <BarChart3 className="h-4 w-4" />
              Visuals
            </>
          )}
        </button>
      </div>

      {visualMode ? (
        <VisualStats data={quickStats} trends={trends} />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <StatCard
              title="Total Users Accounts"
              value={quickStats?.totalUsers ?? 0}
              icon={<Users className="h-4 w-4" />}
            />
            <StatCard
              title="Total Teams registered"
              value={quickStats?.totalTeams ?? 0}
              icon={<Users className="h-4 w-4" />}
            />
            <StatCard
              title="Total Participants registered"
              value={quickStats?.totalParticipants ?? 0}
              icon={<Users className="h-4 w-4" />}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Unique Colleges (Total)"
              value={quickStats?.uniqueTotalColleges ?? 0}
              description="Colleges from which teams have registered"
              icon={<Building2 className="h-4 w-4" />}
            />
            <StatCard
              title="Unique States (Total)"
              value={quickStats?.uniqueTotalStates ?? 0}
              description="States from which teams have registered"
              icon={<MapPin className="h-4 w-4" />}
            />
            <StatCard
              title="Unique Colleges (Confirmed)"
              value={quickStats?.uniqueConfirmedColleges ?? 0}
              description="Colleges from which teams have registered"
              icon={<Building2 className="h-4 w-4" />}
            />
            <StatCard
              title="Unique States (Confirmed)"
              value={quickStats?.uniqueConfirmedStates ?? 0}
              description="States from which teams have registered"
              icon={<MapPin className="h-4 w-4" />}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <StatCard
              title="Confirmed Teams"
              value={quickStats?.confirmedTeams ?? 0}
              description="Teams that have confirmed participation"
              icon={<CheckCircle2 className="h-4 w-4" />}
            />
            <StatCard
              title="Confirmed Participants"
              value={quickStats?.confirmedParticipants ?? 0}
              description="Participants that have confirmed participation"
              icon={<CheckCircle2 className="h-4 w-4" />}
            />
            <StatCard
              title="Idea Submissions"
              value={quickStats?.ideaSubmissions ?? 0}
              description="Teams that have submitted their ideas"
              icon={<CheckCircle2 className="h-4 w-4" />}
            />
          </div>
        </>
      )}
    </>
  );
}
