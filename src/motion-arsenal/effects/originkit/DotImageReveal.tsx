// Delivered by Originkit · stack: react
// Set these props to match the Originkit preview:
//   overrides={{}}
//   __curationVersion={1}
import { useRef, useEffect, type CSSProperties } from "react"
import { useIsStaticRenderer, ControlType } from "./framerRuntime"
interface MagneticGridProps {
    background: string
    image: { src: string; srcSet?: string; alt?: string } | string
    dots: number // dots across the width; rows are derived to fill the height
    gap: number // px between dots at rest
    intensity: number // 1-10: how much of the trigger area actually resolves
    radius: number // trigger area in px
    style?: CSSProperties
}

// How the image is cover-fitted to the whole component, in image pixels.
type Fit = { fit: number; dx: number; dy: number }

/**
 * One dot of the grid.
 *
 * Every dot is a circular window onto the image at its own position — the image
 * is fitted to the WHOLE component, so the dots together sample the entire
 * picture. `reveal` (0..1) grows the window: at 0 it is a small dot, at 1 it is
 * big enough to cover its whole cell, so neighbouring dots meet and the picture
 * appears intact. The cursor drives reveal, so the image shows only where the
 * cursor is.
 */
class Cell {
    x: number
    y: number
    reveal = 0
    treveal = 0
    lastHit = 0
    constructor(x: number, y: number) {
        this.x = x
        this.y = y
    }

    update(
        mx: number,
        my: number,
        hit: boolean,
        radius: number,
        falloff: number,
        now: number
    ) {
        if (hit) {
            this.lastHit = now
            const dist = Math.hypot(mx - this.x, my - this.y)
            // 1 at the cursor, 0 at the edge of the trigger area.
            const n = Math.max(0, Math.min(1, 1 - dist / radius))
            // `falloff` is the exponent that shapes the curve (see the component:
            // it comes from Intensity). A big exponent crushes everything but the
            // very centre — only the dots under the cursor resolve. A small one
            // pushes the curve towards a plateau, so the whole trigger area
            // resolves and only the rim fades.
            const shaped = Math.pow(n, falloff)
            this.treveal = shaped * shaped * (3 - 2 * shaped) // smoothstep
        } else if (now - this.lastHit > 50) {
            this.treveal = 0
        }
    }

    draw(
        ctx: CanvasRenderingContext2D,
        img: HTMLImageElement | null,
        dotSize: number,
        fullSize: number,
        f: Fit | null,
        color: string
    ) {
        this.reveal += (this.treveal - this.reveal) * 0.15

        // Diameter interpolates from the resting dot up to full cell coverage.
        const d = dotSize + (fullSize - dotSize) * this.reveal
        ctx.save()
        ctx.translate(this.x, this.y)
        ctx.beginPath()
        ctx.arc(0, 0, d / 2, 0, 2 * Math.PI)
        if (img && img.complete && img.naturalWidth > 0 && f) {
            // Sample exactly the region of the image under this circle, so the
            // picture lines up seamlessly with the neighbouring dots however far
            // they have opened up.
            ctx.clip()
            const sw = d / f.fit
            const sx = (this.x - d / 2 - f.dx) / f.fit
            const sy = (this.y - d / 2 - f.dy) / f.fit
            ctx.drawImage(img, sx, sy, sw, sw, -d / 2, -d / 2, d, d)
        } else {
            ctx.fillStyle = color
            ctx.fill()
        }
        ctx.restore()
    }
}

function imgSrc(image: MagneticGridProps["image"]): string {
    return typeof image === "string" ? image : image?.src || ""
}

const DEFAULT_IMAGE =
    "https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/6eaa9f69-8a66-4e0a-91ec-200d13a56500/w=800"

/**
 * Magnetic Grid
 *
 * A grid of dots at rest. The image is fitted to the whole component, and the
 * dots under the cursor open up until they meet — revealing the picture, intact,
 * only where the cursor is.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 600
 */
export default function MagneticGrid(props: MagneticGridProps) {
    const {
        background = "#000000",
        image = { src: DEFAULT_IMAGE },
        dots = 12,
        gap = 12,
        intensity = 10,
        radius = 150,
    } = props

    const hostRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const mouseRef = useRef({ x: -99999, y: -99999, active: false })
    const isStatic = useIsStaticRenderer()

    const src = imgSrc(image)

    useEffect(() => {
        const host = hostRef.current
        const canvas = canvasRef.current
        if (!host || !canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const cols = Math.max(1, Math.floor(dots))
        const R = Math.max(1, radius)
        // Intensity 1-10 → the exponent that shapes the reveal falloff.
        // The scale starts where it used to sit in the middle: 1 is the old 5
        // (a roughly linear fade), and it opens up from there.
        //   1  → exponent ~1.26 : linear-ish fade across the trigger area
        //   10 → exponent 0.125 : the whole trigger area resolves, rim aside
        const I = Math.max(1, Math.min(10, intensity))
        const falloff = Math.pow(2, (0.5 - ((I - 1) * 5) / 9) / 1.5)

        let img: HTMLImageElement | null = null
        if (src) {
            img = new Image()
            img.crossOrigin = "anonymous"
            img.src = src
        }

        let W = 1
        let H = 1
        let pitch = 20 // centre-to-centre spacing of the grid
        let dotSize = 20 // resting dot diameter = pitch - gap
        let fullSize = 20 // diameter at which neighbouring dots fully cover the image
        let fitInfo: Fit | null = null
        let bleed = 0
        let cells: Cell[] = []

        // How the image cover-fits the WHOLE component. Each dot samples the region
        // of this fitted image that lies under it, so the dots line up into one
        // continuous picture once they open up.
        const computeFit = () => {
            if (!img || !img.complete || !img.naturalWidth) {
                fitInfo = null
                return
            }
            const nW = img.naturalWidth
            const nH = img.naturalHeight
            const fit = Math.max(W / nW, H / nH) // cover
            fitInfo = {
                fit,
                dx: (W - nW * fit) / 2,
                dy: (H - nH * fit) / 2,
            }
        }

        const build = (mw?: number, mh?: number) => {
            const r = host.getBoundingClientRect()
            W = Math.max(1, Math.floor(mw ?? r.width))
            H = Math.max(1, Math.floor(mh ?? r.height))

            // Dot count drives everything: `cols` cells across the width, with as
            // many rows as it takes to fill the height. Gap shrinks each resting
            // dot inside its cell.
            pitch = W / cols
            dotSize = Math.max(1, pitch - Math.max(0, gap))
            // Fully revealed, a circle has to reach its cell's corners for the
            // dots to meet with no holes between them — that is the cell diagonal.
            fullSize = pitch * Math.SQRT2
            const rowN = Math.max(1, Math.ceil(H / pitch))

            // Bleed: extra canvas outside the host so revealed dots at the edge can
            // spill past the component bounds instead of being clipped.
            bleed = Math.ceil(fullSize / 2 + 4)

            const dpr = window.devicePixelRatio || 1
            const cw = W + bleed * 2
            const ch = H + bleed * 2
            canvas.width = Math.floor(cw * dpr)
            canvas.height = Math.floor(ch * dpr)
            canvas.style.width = cw + "px"
            canvas.style.height = ch + "px"
            canvas.style.left = -bleed + "px"
            canvas.style.top = -bleed + "px"
            ctx.setTransform(dpr, 0, 0, dpr, bleed * dpr, bleed * dpr)

            // Centre the rows vertically: the last row can overhang slightly,
            // and this splits that overhang evenly top and bottom.
            const gridH = rowN * pitch
            const oy = (H - gridH) / 2 + pitch / 2

            cells = []
            for (let c = 0; c < cols; c++) {
                for (let rIdx = 0; rIdx < rowN; rIdx++) {
                    cells.push(
                        new Cell(c * pitch + pitch / 2, oy + rIdx * pitch)
                    )
                }
            }
            computeFit()
        }

        const drawFrame = (now: number) => {
            const m = mouseRef.current
            ctx.clearRect(-bleed, -bleed, W + bleed * 2, H + bleed * 2)
            for (const cell of cells) {
                cell.update(m.x, m.y, m.active, R, falloff, now)
                cell.draw(ctx, img, dotSize, fullSize, fitInfo, "#FFFFFF")
            }
        }

        build()

        const ro =
            typeof ResizeObserver !== "undefined"
                ? new ResizeObserver((entries) => {
                      const cr = entries[0]?.contentRect
                      build(cr?.width, cr?.height)
                      if (isStatic) drawFrame(0)
                  })
                : null
        ro?.observe(host)

        // The fit can only be computed once the image has its natural size.
        if (img && !img.complete) {
            img.onload = () => {
                computeFit()
                if (isStatic) drawFrame(0)
            }
        }

        // Static renderer (Framer canvas / export): draw once at rest.
        if (isStatic) {
            drawFrame(0)
            return () => ro?.disconnect()
        }

        const setMouse = (clientX: number, clientY: number) => {
            const r = host.getBoundingClientRect()
            mouseRef.current.x = clientX - r.left
            mouseRef.current.y = clientY - r.top
            mouseRef.current.active = true
        }
        const onMove = (e: MouseEvent) => setMouse(e.clientX, e.clientY)
        const onLeave = () => {
            mouseRef.current.active = false
            mouseRef.current.x = -99999
            mouseRef.current.y = -99999
        }
        const onTouch = (e: TouchEvent) => {
            const t = e.touches[0]
            if (t) setMouse(t.clientX, t.clientY)
        }

        host.addEventListener("mousemove", onMove)
        host.addEventListener("mouseleave", onLeave)
        host.addEventListener("touchmove", onTouch, { passive: true })
        host.addEventListener("touchend", onLeave)

        let raf = 0
        const loop = (now: number) => {
            drawFrame(now)
            raf = requestAnimationFrame(loop)
        }
        raf = requestAnimationFrame(loop)

        return () => {
            cancelAnimationFrame(raf)
            ro?.disconnect()
            host.removeEventListener("mousemove", onMove)
            host.removeEventListener("mouseleave", onLeave)
            host.removeEventListener("touchmove", onTouch)
            host.removeEventListener("touchend", onLeave)
        }
    }, [src, dots, gap, intensity, radius, isStatic])

    return (
        <div
            ref={hostRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "visible",
                background,
                ...(props.style || {}),
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    pointerEvents: "none",
                }}
            />
        </div>
    )
}

// ControlType.ResponsiveImage takes no defaultValue, so the default image is
// supplied here (and in the destructure above).
MagneticGrid.defaultProps = {
    image: { src: DEFAULT_IMAGE },
    dots: 12,
    gap: 12,
    radius: 150,
    intensity: 10,
}