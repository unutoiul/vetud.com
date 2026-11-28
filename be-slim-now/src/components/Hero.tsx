"use client"

import { CheckCircleFilled, GiftFilled, SafetyCertificateFilled, ShoppingOutlined } from "@ant-design/icons"
import { Button, Col, Flex, Grid, Row, Typography } from "antd"
import {
  motion,
  MotionConfig,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react"
import Image from "next/image"
import { Fragment, useRef, type CSSProperties, type PointerEvent } from "react"
import { MARKETS } from "@/config/markets"
import { OFFER, PRODUCTS, TRIAL_DATA, type ProductId } from "@/config/site"
import { around, format } from "@/i18n/format"
import { colors, fonts, gradients, shadows } from "@/theme/tokens"
import { CountUp, enter, EnterKeyframes, FadeUp, RisingWord, Shine, SPRING_CSS, srOnly } from "./animated"
import { useCountry } from "./CountryProvider"
import { useMessages } from "./MessagesProvider"
import OfferSeal from "./OfferSeal"
import { useOrder } from "./OrderProvider"
import { AccentRule, Container, Eyebrow } from "./ui"

/**
 * The headline rises word by word (hero.headlineLineOne / headlineLineTwo in the messages), so when
 * each part starts depends on how many words the language uses.
 */
const HEADLINE_START = 0.15
const WORD_GAP = 0.08
function headlineTiming(lineOne: number, lineTwo: number) {
  const lineTwoStart = HEADLINE_START + lineOne * WORD_GAP
  const offerStart = lineTwoStart + lineTwo * WORD_GAP
  return { lineTwoStart, offerStart, afterHeadline: offerStart + 0.25 }
}

function PenTag({ id, onClick, delay }: { id: ProductId; onClick: () => void; delay: number }) {
  const product = PRODUCTS[id]
  const m = useMessages()
  const { priceOf, money } = useCountry()
  const { regular, sale } = priceOf(id, "20mg")
  const hot = product.tone === "hot"
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -4, boxShadow: shadows.lifted }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      style={{
        display: "block",
        textAlign: "left",
        cursor: "pointer",
        background: colors.white,
        border: `1px solid ${hot ? colors.green : colors.line}`,
        borderRadius: 14,
        padding: "10px 16px",
        boxShadow: shadows.card,
        whiteSpace: "nowrap",
        font: "inherit",
        ...enter("pop", { delay, duration: 0.8, easing: SPRING_CSS }),
      }}
    >
      <div
        style={{
          fontFamily: fonts.mono,
          fontSize: 10,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: hot ? colors.sale : colors.tealDeep,
          fontWeight: 600,
        }}
      >
        {m.products[id].badge}
      </div>
      <div style={{ fontFamily: fonts.display, fontSize: 20, fontWeight: 500, color: colors.navy, lineHeight: 1.2 }}>
        {product.name}
        {product.label ? <span style={{ fontSize: 13, color: colors.muted }}> · {product.label}</span> : null}
      </div>
      <div style={{ fontSize: 14 }}>
        <span style={{ color: colors.muted, textDecoration: "line-through", marginRight: 6 }}>{money(regular)}</span>
        <span style={{ color: colors.navy, fontWeight: 700 }}>{format(m.hero.penTagFrom, { price: money(sale) })}</span>
      </div>
    </motion.button>
  )
}

/** The offer's "NN% off." counts up, a brighter green light glides through it, and a green stroke draws itself underneath. */
function OfferWords({ delay }: { delay: number }) {
  const reduce = useReducedMotion()
  const m = useMessages()
  const [before, after] = around(m.hero.headlineOffer, "percent")
  return (
    <span style={{ position: "relative", display: "inline-block", whiteSpace: "nowrap" }}>
      <RisingWord delay={delay}>
        <motion.span
          style={{
            display: "inline-block",
            backgroundImage: gradients.saleShimmer,
            backgroundSize: "260% 100%",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: colors.clear,
            WebkitTextFillColor: colors.clear,
          }}
          initial={{ backgroundPosition: "100% 0%" }}
          animate={reduce ? undefined : { backgroundPosition: ["100% 0%", "0% 0%"] }}
          transition={{ duration: 1.8, ease: "easeInOut", repeat: Infinity, repeatDelay: 3.6, delay: delay + 1.5 }}
        >
          {before}
          <CountUp to={OFFER.salePercent} delay={delay + 0.05} duration={1.3} />
          {after}
        </motion.span>
      </RisingWord>
      <svg
        aria-hidden
        viewBox="0 0 200 16"
        preserveAspectRatio="none"
        style={{
          position: "absolute",
          left: "-1%",
          bottom: "-0.24em",
          width: "100%",
          height: "0.22em",
          overflow: "visible",
        }}
      >
        <path
          d="M3 11 C 48 4, 118 2, 197 7"
          pathLength={1}
          strokeDasharray="1 1"
          strokeDashoffset={0}
          fill="none"
          stroke={colors.green}
          strokeWidth={4}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          style={enter("draw", { delay: delay + 0.75, duration: 0.8, easing: "ease-in-out" })}
        />
      </svg>
    </span>
  )
}

/**
 * One pen picture. It glides in (CSS), then floats gently and leans toward the mouse (Motion). Each
 * movement has its own layer so they never fight over the same transform.
 */
function FloatingPen({
  alt,
  style,
  delay,
  from,
  float,
  parallax,
}: {
  alt: string
  style: CSSProperties
  delay: number
  from: { x: number; y: number; rotate: number }
  float: number
  parallax: { x: MotionValue<number>; y: MotionValue<number> }
}) {
  const reduce = useReducedMotion()
  const layer = { position: "absolute", inset: 0 } as const
  return (
    <div style={{ position: "absolute", aspectRatio: "857 / 760", ...style }}>
      <motion.div style={{ ...layer, x: parallax.x, y: parallax.y }}>
        <div
          style={{
            ...layer,
            ...enter("glide", {
              delay,
              duration: 1.3,
              vars: { "--enter-x": `${from.x}px`, "--enter-y": `${from.y}px`, "--enter-r": `${from.rotate}deg` },
            }),
          }}
        >
          <motion.div
            style={layer}
            initial={{ y: 0 }}
            animate={reduce ? undefined : { y: [0, float, 0] }}
            transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut", delay: delay + 1.3 }}
          >
            <Image
              src="/images/vetud-pen.webp"
              alt={alt}
              fill
              priority
              sizes="(max-width: 768px) 80vw, 480px"
              style={{ objectFit: "contain" }}
            />
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}

/** A knife and fork: the "less hunger" point. */
function AppetiteIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M7 3v8M4.5 3v5a2.5 2.5 0 0 0 5 0V3M7 11v10" />
      <path d="M17 21V3c-2 1.2-3 3.6-3 6.5V13h3" />
    </svg>
  )
}

/**
 * The three short reasons under the headline (hero.offerPoint / weightPoint / appetitePoint): the
 * price cut, retatrutide's trial result (TRIAL_DATA, counted up) and how both molecules work.
 */
function SellingPoints({ delay }: { delay: number }) {
  const m = useMessages().hero
  const { country } = useCountry()
  const screens = Grid.useBreakpoint()
  const locale = MARKETS[country].locale
  const trial = TRIAL_DATA.find((item) => item.name === "Retatrutide") ?? TRIAL_DATA[0]
  const [before, after] = around(m.weightPoint.value, "percent")
  const badge: CSSProperties = {
    flex: "none",
    minWidth: screens.sm ? 116 : 94,
    fontFamily: fonts.display,
    fontWeight: 700,
    fontSize: screens.sm ? 34 : 27,
    lineHeight: 1,
    letterSpacing: "-0.02em",
    whiteSpace: "nowrap",
  }
  const rows = [
    ...(OFFER.salePercent > 0
      ? [
          {
            key: "offer",
            value: (
              <span style={{ ...badge, color: colors.sale }}>
                {format(m.offerPoint.value, { percent: OFFER.salePercent })}
              </span>
            ),
            title: m.offerPoint.title,
            text: m.offerPoint.text,
          },
        ]
      : []),
    {
      key: "weight",
      value: (
        <span style={{ ...badge, color: colors.tealDeep }}>
          {before}
          <CountUp to={trial.medicine} decimals={1} locale={locale} delay={delay + 0.12} duration={1.7} />
          {after}
        </span>
      ),
      title: m.weightPoint.title,
      text: m.weightPoint.text,
    },
    {
      key: "appetite",
      value: (
        <span style={badge}>
          <span
            style={{
              display: "inline-grid",
              placeItems: "center",
              width: 50,
              height: 50,
              borderRadius: 999,
              background: colors.aquaLight,
              color: colors.tealDeep,
            }}
          >
            <AppetiteIcon />
          </span>
        </span>
      ),
      title: m.appetitePoint.title,
      text: m.appetitePoint.text,
    },
  ]

  return (
    <div style={{ display: "flex", flexDirection: "column", maxWidth: 520, marginTop: 4 }}>
      {rows.map((row, index) => (
        <FadeUp key={row.key} delay={delay + index * 0.12} y={10}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: screens.sm ? 18 : 14,
              padding: "14px 0",
              borderTop: index ? `1px solid ${colors.line}` : "none",
            }}
          >
            {row.value}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: screens.sm ? 18 : 16.5, color: colors.navy, lineHeight: 1.3 }}>
                {row.title}
              </div>
              <div style={{ fontSize: screens.sm ? 15 : 14, color: colors.navyInk, lineHeight: 1.45, marginTop: 2 }}>
                {row.text}
              </div>
            </div>
          </div>
        </FadeUp>
      ))}
    </div>
  )
}

export default function Hero() {
  const m = useMessages()
  const { openOrder, openPromo } = useOrder()
  const { lowestPrice, money } = useCountry()
  const reduce = useReducedMotion()
  const screens = Grid.useBreakpoint()
  /** On phones the two buttons stack, each the full width: bigger targets, no ragged edge. */
  const ctaWidth: CSSProperties = screens.sm ? {} : { width: "100%" }
  const sectionRef = useRef<HTMLElement>(null)
  const lineOne = m.hero.headlineLineOne
  const lineTwo = m.hero.headlineLineTwo
  const { lineTwoStart, offerStart, afterHeadline } = headlineTiming(lineOne.length, lineTwo.length)

  // The alpine art drifts down a little as the page scrolls, so the hero has depth.
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] })
  const artY = useTransform(scrollYProgress, [0, 1], ["0%", "16%"])

  // Mouse position over the hero, from −0.5 to 0.5, smoothed. The pens and the glow move by different amounts.
  const pointerX = useMotionValue(0)
  const pointerY = useMotionValue(0)
  const smoothX = useSpring(pointerX, { stiffness: 50, damping: 16 })
  const smoothY = useSpring(pointerY, { stiffness: 50, damping: 16 })
  const backX = useTransform(smoothX, (v) => v * -16)
  const backY = useTransform(smoothY, (v) => v * -12)
  const frontX = useTransform(smoothX, (v) => v * 26)
  const frontY = useTransform(smoothY, (v) => v * 18)
  const glowX = useTransform(smoothX, (v) => v * 40)
  const glowY = useTransform(smoothY, (v) => v * 30)

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    if (reduce || event.pointerType !== "mouse") return
    const box = event.currentTarget.getBoundingClientRect()
    pointerX.set((event.clientX - box.left) / box.width - 0.5)
    pointerY.set((event.clientY - box.top) / box.height - 0.5)
  }
  const onPointerLeave = () => {
    pointerX.set(0)
    pointerY.set(0)
  }

  return (
    <MotionConfig reducedMotion="user">
      <EnterKeyframes />
      <section
        ref={sectionRef}
        id="top"
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        style={{ position: "relative", overflow: "hidden", background: gradients.hero, marginTop: -80, paddingTop: 80 }}
      >
        {/* VETUD's alpine artwork, faded into the page */}
        <motion.div aria-hidden style={{ position: "absolute", inset: 0, y: artY }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0.75,
              ...enter("settle", { duration: 2.4, vars: { "--enter-scale": "1.07" } }),
            }}
          >
            <Image
              src="/images/alpine.webp"
              alt=""
              fill
              priority
              sizes="100vw"
              style={{ objectFit: "cover", objectPosition: "center bottom" }}
            />
          </div>
          <div style={{ position: "absolute", inset: 0, background: gradients.heroSide }} />
          <div style={{ position: "absolute", inset: 0, background: gradients.heroScrim }} />
        </motion.div>

        <Container style={{ position: "relative" }}>
          <Row
            gutter={[{ xs: 16, md: 48 }, 32]}
            align="middle"
            style={{ minHeight: "min(84vh, 780px)", padding: "clamp(32px, 5vw, 64px) 0 clamp(48px, 6vw, 72px)" }}
          >
            <Col xs={24} md={12}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 18,
                  padding: "6px 14px 6px 6px",
                  borderRadius: 999,
                  background: colors.night,
                  color: colors.onNavy,
                  fontSize: 13,
                  fontWeight: 600,
                  ...enter("drop", { duration: 0.7 }),
                }}
              >
                <span
                  style={{
                    position: "relative",
                    overflow: "hidden",
                    background: gradients.hot,
                    color: colors.navyDeep,
                    borderRadius: 999,
                    padding: "3px 10px",
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    fontSize: 11.5,
                    whiteSpace: "nowrap",
                  }}
                >
                  {m.offer.saleLabel.toUpperCase()}
                  <Shine delay={1.6} every={3.4} width="60%" />
                </span>
                {format(m.hero.saleChip, { percent: OFFER.salePercent })}
              </span>

              <FadeUp delay={0.08} y={10}>
                <Eyebrow>{m.hero.eyebrow}</Eyebrow>
              </FadeUp>

              <Typography.Title
                level={1}
                style={{
                  fontFamily: fonts.display,
                  fontWeight: 300,
                  fontSize: "clamp(38px, 4.8vw, 62px)",
                  lineHeight: 1.04,
                  letterSpacing: "-0.02em",
                  color: colors.navy,
                  margin: 0,
                }}
              >
                <span style={srOnly}>{format(m.hero.headlineSr, { percent: OFFER.salePercent })}</span>
                <span aria-hidden>
                  {lineOne.map((word, index) => (
                    <Fragment key={`${index}-${word}`}>
                      <RisingWord delay={HEADLINE_START + index * WORD_GAP}>{word}</RisingWord>{" "}
                    </Fragment>
                  ))}
                  <br />
                  <span style={{ fontWeight: 600 }}>
                    {lineTwo.map((word, index) => (
                      <Fragment key={`${index}-${word}`}>
                        <RisingWord delay={lineTwoStart + index * WORD_GAP}>{word}</RisingWord>{" "}
                      </Fragment>
                    ))}
                    <OfferWords delay={offerStart} />
                  </span>
                </span>
              </Typography.Title>

              <div
                style={{ transformOrigin: "0% 50%", ...enter("grow", { delay: afterHeadline - 0.1, duration: 0.8 }) }}
              >
                <AccentRule />
              </div>

              <SellingPoints delay={afterHeadline - 0.06} />

              <FadeUp delay={afterHeadline + 0.25}>
                <Flex wrap gap={12} style={{ marginTop: 30 }}>
                  <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} style={ctaWidth}>
                    <Button
                      type="primary"
                      size="large"
                      icon={<ShoppingOutlined />}
                      onClick={() => openOrder()}
                      style={{
                        position: "relative",
                        overflow: "hidden",
                        height: 58,
                        padding: "0 30px",
                        fontSize: 18,
                        ...ctaWidth,
                      }}
                    >
                      {format(m.hero.buyFrom, { price: money(lowestPrice()) })}
                      <Shine delay={2.4} every={4.2} />
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} style={ctaWidth}>
                    <Button
                      size="large"
                      icon={
                        <motion.span
                          style={{ display: "inline-flex" }}
                          animate={{ rotate: [0, -14, 11, -7, 4, 0] }}
                          transition={{ duration: 0.9, repeat: Infinity, repeatDelay: 5, delay: 3.2 }}
                        >
                          <GiftFilled />
                        </motion.span>
                      }
                      onClick={openPromo}
                      style={{
                        height: 58,
                        padding: "0 22px",
                        fontSize: 16,
                        fontWeight: 600,
                        color: colors.navy,
                        borderColor: colors.green,
                        background: colors.white,
                        ...ctaWidth,
                      }}
                    >
                      {format(m.hero.extraCode, { percent: OFFER.subscriberPercent })}
                    </Button>
                  </motion.div>
                </Flex>
              </FadeUp>

              <FadeUp delay={afterHeadline + 0.32} y={8}>
                <p
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 8,
                    margin: "16px 0 0",
                    fontSize: 13.5,
                    lineHeight: 1.5,
                    color: colors.muted,
                    maxWidth: 520,
                  }}
                >
                  <SafetyCertificateFilled style={{ color: colors.sale, fontSize: 16, marginTop: 2 }} />
                  <span>
                    <strong style={{ color: colors.navy }}>{m.hero.guaranteedLabel}</strong>{" "}
                    {m.hero.guarantees.join(" · ")}.
                  </span>
                </p>
              </FadeUp>

              <Flex wrap gap="10px 22px" style={{ marginTop: 22 }}>
                {m.hero.trust.map((item, index) => (
                  <span
                    key={item}
                    style={{
                      fontSize: 14,
                      color: colors.navyInk,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      ...enter("up", {
                        delay: afterHeadline + 0.45 + index * 0.07,
                        duration: 0.6,
                        vars: { "--enter-y": "8px" },
                      }),
                    }}
                  >
                    <CheckCircleFilled style={{ color: colors.teal }} />
                    {item}
                  </span>
                ))}
              </Flex>
            </Col>

            {/* The two VETUD pens, side by side on the diagonal */}
            <Col xs={24} md={12}>
              <div style={{ position: "relative", aspectRatio: "1 / 0.92", maxWidth: 600, margin: "0 auto" }}>
                <div
                  aria-hidden
                  style={{ position: "absolute", inset: "-8% -6%", ...enter("bloom", { duration: 1.6 }) }}
                >
                  <motion.div
                    style={{ position: "absolute", inset: 0, background: gradients.penGlow, x: glowX, y: glowY }}
                  />
                </div>
                <FloatingPen
                  alt={m.products.tz2.penAlt}
                  style={{ left: "0%", top: "0%", width: "80%" }}
                  delay={0.2}
                  from={{ x: -40, y: 50, rotate: -6 }}
                  float={-10}
                  parallax={{ x: backX, y: backY }}
                />
                <FloatingPen
                  alt={m.products.retatrutide.penAlt}
                  style={{ left: "20%", top: "20%", width: "80%" }}
                  delay={0.38}
                  from={{ x: 70, y: 40, rotate: 7 }}
                  float={12}
                  parallax={{ x: frontX, y: frontY }}
                />

                <div style={{ position: "absolute", left: 0, bottom: "4%" }}>
                  <PenTag id="tz2" onClick={() => openOrder({ product: "tz2" })} delay={0.95} />
                </div>
                <div style={{ position: "absolute", right: 0, top: "2%" }}>
                  <PenTag id="retatrutide" onClick={() => openOrder({ product: "retatrutide" })} delay={1.1} />
                </div>

                {OFFER.salePercent > 0 && (
                  <div style={{ position: "absolute", right: "4%", bottom: "4%" }}>
                    <motion.div
                      aria-hidden
                      style={{ position: "absolute", inset: 0, borderRadius: 999, border: `2px solid ${colors.green}` }}
                      initial={{ scale: 1, opacity: 0 }}
                      animate={reduce ? undefined : { scale: [1, 1.45], opacity: [0.6, 0] }}
                      transition={{ duration: 2, ease: "easeOut", repeat: Infinity, repeatDelay: 1.6, delay: 2.4 }}
                    />
                    <div style={enter("spin", { delay: 1.25, duration: 1, easing: SPRING_CSS })}>
                      <motion.div
                        whileHover={{ rotate: -8, scale: 1.06 }}
                        transition={{ type: "spring", stiffness: 260, damping: 14 }}
                      >
                        <OfferSeal percent={OFFER.salePercent} size="clamp(96px, 10vw, 132px)" />
                      </motion.div>
                    </div>
                  </div>
                )}
              </div>
            </Col>
          </Row>
        </Container>
      </section>
    </MotionConfig>
  )
}
