// Delivered by Originkit · stack: react
// Set these props to match the Originkit preview:
//   overrides={{}}
//   __curationVersion={1}
import { useRef, useState, type CSSProperties } from "react"
import { ControlType } from "./framerRuntime"

import {
motion,
    useMotionValue,
    useSpring,
    type Transition as MotionTransition,
} from "framer-motion"
interface Item {
    text?: string
    image?: { src?: string; srcSet?: string; alt?: string }
    link?: string
}

interface ItemsValue {
    itemCount?: number
    [key: string]: unknown
}

const MAX_ITEMS = 6

interface FontValue {
    fontSize?: number | string
    letterSpacing?: number | string
    lineHeight?: number | string
    [key: string]: unknown
}

interface HoverImageRevealProps {
    items: ItemsValue
    font: FontValue
    textColor: string
    dimColor: string
    align: "left" | "center" | "right"
    rowGap: number
    imageWidth: number
    imageHeight: number
    rounded: number
    offsetX: number
    offsetY: number
    followStrength: number
    transition: MotionTransition
    backgroundColor?: string
    style?: CSSProperties
}

const DEFAULTS = {
    textColor: "#FFFFFF",
    dimColor: "#51565A",
    align: "center" as const,
    rowGap: 30,
    imageWidth: 300,
    imageHeight: 400,
    rounded: 16,
    offsetX: 200,
    offsetY: 0,
    followStrength: 0,
    backgroundColor: "#000000",
}

const DEFAULT_ITEMS_DATA: { text: string; src: string }[] = [
    {
        text: "NEW SEASON DROP",
        src: "https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/8e0d22a8-ac82-4893-90d8-3403f80ec600/w=800",
    },
    {
        text: "ESSENTIAL COLLECTION",
        src: "https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/d6af07a0-4dc5-4de4-07b1-9d2ad6100000/w=800",
    },
    {
        text: "SUMMER EDITION",
        src: "https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/c083d83a-f5a4-4434-989f-4eaa9bbe7500/w=800",
    },
    {
        text: "STREET ICONS",
        src: "https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/93bad0e0-e2ab-4e21-de9c-4cb54b028f00/w=800",
    },
    {
        text: "PREMIUM DENIM",
        src: "https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/09a59a65-3c07-4500-f72c-68c824168c00/w=800",
    },
    {
        text: "ARCHIVE PIECES",
        src: "https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/8e0d22a8-ac82-4893-90d8-3403f80ec600/w=800",
    },
]

// Runtime fallback when an instance has no Items value yet
const DEFAULT_ITEMS: ItemsValue = {
    itemCount: 5,
    item1: {
        text: DEFAULT_ITEMS_DATA[0].text,
        image: { src: DEFAULT_ITEMS_DATA[0].src },
    },
    item2: {
        text: DEFAULT_ITEMS_DATA[1].text,
        image: { src: DEFAULT_ITEMS_DATA[1].src },
    },
    item3: {
        text: DEFAULT_ITEMS_DATA[2].text,
        image: { src: DEFAULT_ITEMS_DATA[2].src },
    },
    item4: {
        text: DEFAULT_ITEMS_DATA[3].text,
        image: { src: DEFAULT_ITEMS_DATA[3].src },
    },
    item5: {
        text: DEFAULT_ITEMS_DATA[4].text,
        image: { src: DEFAULT_ITEMS_DATA[4].src },
    },
    item6: {
        text: DEFAULT_ITEMS_DATA[5].text,
        image: { src: DEFAULT_ITEMS_DATA[5].src },
    },
}

const alignToFlex: Record<string, CSSProperties["alignItems"]> = {
    left: "flex-start",
    center: "center",
    right: "flex-end",
}
const alignToText: Record<string, CSSProperties["textAlign"]> = {
    left: "left",
    center: "center",
    right: "right",
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 640
 * @framerIntrinsicHeight 420
 * @framerDisableUnlink
 */
export default function HoverImageReveal({
    items = DEFAULT_ITEMS,
    font,
    textColor = DEFAULTS.textColor,
    dimColor = DEFAULTS.dimColor,
    align = DEFAULTS.align,
    rowGap = DEFAULTS.rowGap,
    imageWidth = DEFAULTS.imageWidth,
    imageHeight = DEFAULTS.imageHeight,
    rounded = DEFAULTS.rounded,
    offsetX = DEFAULTS.offsetX,
    offsetY = DEFAULTS.offsetY,
    followStrength = DEFAULTS.followStrength,
    transition,
    backgroundColor = DEFAULTS.backgroundColor,
    style,
}: HoverImageRevealProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [hovered, setHovered] = useState<number | null>(null)

    // Cursor position (relative to container), smoothed so the image window
    // trails the cursor — the "hover-cursor" follow.
    const rawX = useMotionValue(0)
    const rawY = useMotionValue(0)
    const stiffness = 60 + followStrength * 5
    const springCfg = { stiffness, damping: 28, mass: 0.5 }
    const x = useSpring(rawX, springCfg)
    const y = useSpring(rawY, springCfg)

    // Build the ordered item list from the "Items" modal (item1..itemN)
    const data = items || DEFAULT_ITEMS
    const count = Math.max(
        1,
        Math.min(MAX_ITEMS, (data.itemCount as number) || 5)
    )
    const list: Item[] = []
    for (let i = 1; i <= count; i++) {
        const it = data[`item${i}`] as Item | undefined
        const fallback = DEFAULT_ITEMS_DATA[i - 1]
        list.push({
            text: it?.text ?? fallback?.text ?? `Item ${i}`,
            image: it?.image ?? (fallback ? { src: fallback.src } : undefined),
            link: it?.link,
        })
    }
    const anyActive = hovered != null

    const onMove = (e: React.MouseEvent) => {
        const rect = containerRef.current?.getBoundingClientRect()
        if (!rect) return
        rawX.set(e.clientX - rect.left + offsetX)
        rawY.set(e.clientY - rect.top + offsetY)
    }

    return (
        <div
            ref={containerRef}
            onMouseMove={onMove}
            onMouseLeave={() => setHovered(null)}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                backgroundColor,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: alignToFlex[align],
                gap: `${rowGap}px`,
                padding: 24,
                boxSizing: "border-box",
                cursor: "default",
                ...font,
                ...style,
            }}
        >
            {/* Cursor-following window with a vertical image reel inside.
                Switching rows slides the reel to the active image. */}
            <motion.div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    x,
                    y,
                    translateX: "-50%",
                    translateY: "-50%",
                    width: imageWidth,
                    height: imageHeight,
                    borderRadius: rounded,
                    overflow: "hidden",
                    pointerEvents: "none",
                    zIndex: 2,
                }}
                animate={{ opacity: anyActive ? 1 : 0 }}
                transition={transition}
            >
                {/* Stacked images clipped to the window. Active sits at y:0;
                    every other image is parked fully below (y:100%) and hidden
                    by overflow, so no neighbor preview — only the active image
                    (and the one sliding out) ever passes through the window. */}
                {list.map((item, i) => {
                    const src = item.image?.src
                    // Directional reel: active at 0, items above it parked
                    // above (-100%), items below parked below (100%). Moving
                    // down the list slides the old image up and out.
                    const yPos =
                        hovered == null
                            ? "100%"
                            : i < hovered
                              ? "-100%"
                              : i > hovered
                                ? "100%"
                                : "0%"
                    return (
                        <motion.div
                            key={i}
                            initial={false}
                            animate={{ y: yPos }}
                            transition={transition}
                            style={{
                                position: "absolute",
                                inset: 0,
                                width: "100%",
                                height: "100%",
                                overflow: "hidden",
                            }}
                        >
                            {src ? (
                                <img
                                    src={src}
                                    alt={item.image?.alt || item.text || ""}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        display: "block",
                                    }}
                                />
                            ) : (
                                <div
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        background:
                                            "linear-gradient(135deg,#333,#111)",
                                    }}
                                />
                            )}
                        </motion.div>
                    )
                })}
            </motion.div>

            {/* Text list. Leaving this block (not the whole component)
                clears the hover, so the image only shows over the text. */}
            <div
                onMouseLeave={() => setHovered(null)}
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: alignToFlex[align],
                    gap: `${rowGap}px`,
                }}
            >
                {list.map((item, i) => {
                    const isHovered = hovered === i
                    const color = anyActive
                        ? isHovered
                            ? textColor
                            : dimColor
                        : textColor
                    const copyStyle: CSSProperties = {
                        display: "block",
                        color,
                        transition: "color 0.2s ease",
                        whiteSpace: "pre",
                        textAlign: alignToText[align],
                    }
                    // Two stacked copies: the second sits one line below and
                    // rolls up into view on hover, back down on leave.
                    const inner = (
                        <motion.div
                            style={{ position: "relative" }}
                            animate={{ y: isHovered ? "-100%" : "0%" }}
                            transition={transition}
                        >
                            <span style={copyStyle}>{item.text}</span>
                            <span
                                aria-hidden
                                style={{
                                    ...copyStyle,
                                    position: "absolute",
                                    top: "100%",
                                    left: 0,
                                    width: "100%",
                                }}
                            >
                                {item.text}
                            </span>
                        </motion.div>
                    )
                    return (
                        <div
                            key={i}
                            onMouseEnter={() => setHovered(i)}
                            style={{
                                overflow: "hidden",
                                cursor: item.link ? "pointer" : "default",
                            }}
                        >
                            {item.link ? (
                                <a
                                    href={item.link}
                                    style={{
                                        textDecoration: "none",
                                        color: "inherit",
                                    }}
                                >
                                    {inner}
                                </a>
                            ) : (
                                inner
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

HoverImageReveal.displayName = "Hover Image Reveal"

// Build item1..itemN as nested Object modals ("Item 1", "Item 2", ...),
// each gated by the Count slider.
function itemControls() {
    const controls: Record<string, unknown> = {}
    for (let i = 1; i <= MAX_ITEMS; i++) {
        controls[`item${i}`] = {
            type: ControlType.Object,
            title: `Item ${i}`,
            buttonTitle: `Item ${i}`,
            controls: {
                text: {
                    type: ControlType.String,
                    title: "Text",
                    defaultValue:
                        DEFAULT_ITEMS_DATA[i - 1]?.text || `Item ${i}`,
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                    defaultValue: { src: DEFAULT_ITEMS_DATA[i - 1]?.src },
                },
                link: { type: ControlType.Link, title: "Link" },
            },
            hidden: (props: ItemsValue) => (props?.itemCount ?? 5) < i,
        }
    }
    return controls
}