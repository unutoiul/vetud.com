import React from "react";
import Image from "next/image";
import transformationMan from "@/public/images/transformation-man.png";
import transformationWoman from "@/public/images/transformation-woman.png";

export const TransformationImages = () => {
  return (
    <div style={{ display: 'flex', gap: '20px', marginBottom: '40px' }}>
      <Image src={transformationMan} alt="Man's transformation" width={200} height={300} style={{ borderRadius: '8px', objectFit: 'cover' }} />
      <Image src={transformationWoman} alt="Woman's transformation" width={200} height={300} style={{ borderRadius: '8px', objectFit: 'cover' }} />
    </div>
  );
};

export default TransformationImages;
"use client"

import { Fragment } from "react"
import { Grid } from "antd"
import { MARKETS } from "@/config/markets"
import { TRIAL_DATA } from "@/config/site"
import { format } from "@/i18n/format"
import { colors, fonts, shadows } from "@/theme/tokens"
import { FadeUp } from "./animated"
import { useCountry } from "./CountryProvider"
import { useMessages } from "./MessagesProvider"
import { Section, SectionHeading } from "./ui"

/** The scale runs to the next 10% above the biggest result, so the ticks and the bars agree. */
const AXIS_MAX = Math.ceil(Math.max(...TRIAL_DATA.map((t) => t.medicine)) / 10) * 10
const TICKS = Array.from({ length: AXIS_MAX / 10 + 1 }, (_, index) => index * 10)
const width = (value: number) => `${(value / AXIS_MAX) * 100}%`

function Bar({ value, tone, height }: { value: number; tone: "medicine" | "placebo"; height: number }) {
  return (
    <div style={{ height, background: colors.aquaLight, borderRadius: 999, overflow: "hidden" }}>
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

function Legend({ medicine, placebo }: { medicine: string; placebo: string }) {
  const item = (tone: "medicine" | "placebo", label: string) => (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <span aria-hidden style={{ width: 22, height: 8, borderRadius: 999, background: tone === "medicine" ? colors.tealDeep : colors.muted }} />
      {label}
    </span>
  )
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 20px", fontSize: 13, color: colors.muted }}>
      {item("medicine", medicine)}
      {item("placebo", placebo)}
    </div>
  )
}

/**
 * Average body weight lost in published human trials, each medicine next to its own placebo group.
 * Text is trialChart in the messages; the numbers are TRIAL_DATA, written the visitor's way (24,2 %).
 */
export default function TrialChart() {
  const m = useMessages().trialChart
  const { country } = useCountry()
  const screens = Grid.useBreakpoint()
  const wide = !!screens.sm
  const number = new Intl.NumberFormat(MARKETS[country].locale, { maximumFractionDigits: 1 })
  const percent = (value: number) => format(m.percent, { value: number.format(value) })

  return (
    <Section id="trial-chart" background={colors.aquaWash}>
      <SectionHeading eyebrow={m.eyebrow} title={m.title} subtitle={m.subtitle} />
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
          <Legend medicine={m.medicine} placebo={m.placebo} />
          {/* One grid for every row, so the right-hand column (placebo labels) is as wide as the
              longest label in any language and all the bars and the scale line up. */}
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) max-content", columnGap: 12, alignItems: "center", marginTop: 24 }}>
            {TRIAL_DATA.map((trial, index) => {
              const text = m.trials[trial.name]
              return (
                <Fragment key={trial.name}>
                  <div
                    style={{
                      gridColumn: "1 / -1",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      gap: 16,
                      marginTop: index ? 28 : 0,
                    }}
                  >
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
                          {text.status}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>
                        {text.dose} · {text.study}
                      </div>
                    </div>
                    <span style={{ fontFamily: fonts.display, fontSize: wide ? 30 : 24, fontWeight: 500, color: colors.navy, lineHeight: 1, whiteSpace: "nowrap" }}>
                      {percent(trial.medicine)}
                    </span>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <Bar value={trial.medicine} tone="medicine" height={12} />
                  </div>
                  <span />
                  <div style={{ marginTop: 6 }}>
                    <Bar value={trial.placebo} tone="placebo" height={6} />
                  </div>
                  <span style={{ marginTop: 6, fontSize: 12, color: colors.muted, whiteSpace: "nowrap" }}>
                    {format(m.placeboValue, { value: number.format(trial.placebo) })}
                  </span>
                </Fragment>
              )
            })}
            {/* The scale, under the bars only */}
            <div style={{ position: "relative", height: 18, marginTop: 18, borderTop: `1px solid ${colors.line}` }}>
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
                    whiteSpace: "nowrap",
                  }}
                >
                  {percent(tick)}
                </span>
              ))}
            </div>
            <span />
          </div>
          <figcaption style={{ marginTop: 24, paddingTop: 18, borderTop: `1px solid ${colors.line}`, fontSize: 12.5, lineHeight: 1.6, color: colors.muted }}>
            {m.caption}
          </figcaption>
        </figure>
      </FadeUp>
    </Section>
  )
}
