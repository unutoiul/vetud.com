"use client"

import { Grid } from "antd"
import { TRIAL_DATA } from "@/config/site"
import { colors, fonts, shadows } from "@/theme/tokens"
import { FadeUp } from "./animated"
import { Section, SectionHeading } from "./ui"

/** The scale runs to the next 10% above the biggest result, so the ticks and the bars agree. */
const AXIS_MAX = Math.ceil(Math.max(...TRIAL_DATA.map((t) => t.medicine)) / 10) * 10
const TICKS = Array.from({ length: AXIS_MAX / 10 + 1 }, (_, index) => index * 10)
const width = (value: number) => `${(value / AXIS_MAX) * 100}%`

function Bar({ value, tone, height }: { value: number; tone: "medicine" | "placebo"; height: number }) {
  return (
    <div style={{ flex: 1, height, background: colors.aquaLight, borderRadius: 999, overflow: "hidden" }}>
      <div
        style={{
          width: width(value),
          height: "100%",
          borderRadius: 999,
          background: tone === "medicine" ? `linear-gradient(90deg, ${colors.tealDeep}, ${colors.navyDeep})` : colors.muted,
        }}
      />
    </div>
  )
}

function Legend() {
  const item = (tone: "medicine" | "placebo", label: string) => (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <span aria-hidden style={{ width: 22, height: 8, borderRadius: 999, background: tone === "medicine" ? colors.tealDeep : colors.muted }} />
      {label}
    </span>
  )
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 20px", fontSize: 13, color: colors.muted }}>
      {item("medicine", "Medicine")}
      {item("placebo", "Placebo")}
    </div>
  )
}

/** Average body weight lost in published human trials, each medicine next to its own placebo group. */
export default function TrialChart() {
  const screens = Grid.useBreakpoint()
  const wide = !!screens.sm
  return (
    <Section id="trial-chart" background={colors.aquaWash}>
      <SectionHeading
        eyebrow="Human trials"
        title="Average body weight lost in human trials"
        subtitle="Each medicine compared with its trial's placebo group. Ordered by reported average; this is not a head-to-head ranking. Trials differ in people, doses and length."
      />
      <FadeUp delay={0.05} y={10}>
        <figure
          style={{
            maxWidth: 820,
            margin: "0 auto",
            padding: wide ? "32px 40px" : "24px 20px",
            background: colors.white,
            border: `1px solid ${colors.line}`,
            borderRadius: 24,
            boxShadow: shadows.card,
          }}
        >
          <Legend />
          <div style={{ display: "flex", flexDirection: "column", gap: 28, marginTop: 24 }}>
            {TRIAL_DATA.map((trial) => (
              <div key={`${trial.name}-${trial.dose}`}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: fonts.display, fontSize: 18, fontWeight: 500, color: colors.navy, lineHeight: 1.3 }}>
                      {trial.name}
                      <span
                        style={{
                          marginLeft: 10,
                          verticalAlign: "middle",
                          fontFamily: fonts.body,
                          fontSize: 11.5,
                          fontWeight: 600,
                          color: colors.tealDeep,
                          background: colors.aquaLight,
                          borderRadius: 999,
                          padding: "2px 10px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {trial.status}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>
                      {trial.dose} · {trial.study}
                    </div>
                  </div>
                  <span style={{ fontFamily: fonts.display, fontSize: wide ? 30 : 24, fontWeight: 500, color: colors.navy, lineHeight: 1, whiteSpace: "nowrap" }}>
                    {trial.medicine}%
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
                  <Bar value={trial.medicine} tone="medicine" height={12} />
                  <span style={{ width: 92, flex: "none" }} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6 }}>
                  <Bar value={trial.placebo} tone="placebo" height={6} />
                  <span style={{ width: 92, flex: "none", fontSize: 12, color: colors.muted, whiteSpace: "nowrap" }}>Placebo {trial.placebo}%</span>
                </div>
              </div>
            ))}
          </div>
          {/* The scale, under the bars only (the right-hand column holds the placebo labels) */}
          <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
            <div style={{ flex: 1, position: "relative", height: 18, borderTop: `1px solid ${colors.line}` }}>
              {TICKS.map((tick) => (
                <span
                  key={tick}
                  style={{
                    position: "absolute",
                    top: 6,
                    left: width(tick),
                    transform: tick === 0 ? "none" : tick === AXIS_MAX ? "translateX(-100%)" : "translateX(-50%)",
                    fontSize: 11,
                    color: colors.muted,
                  }}
                >
                  {tick}%
                </span>
              ))}
            </div>
            <span style={{ width: 92, flex: "none" }} />
          </div>
          <figcaption style={{ marginTop: 24, paddingTop: 18, borderTop: `1px solid ${colors.line}`, fontSize: 12.5, lineHeight: 1.6, color: colors.muted }}>
            Each human trial had different people, doses and lengths, so compare with care. The bars describe medicines studied under
            medical supervision with diet and exercise advice, not VETUD&apos;s research product.
          </figcaption>
        </figure>
      </FadeUp>
    </Section>
  )
}
