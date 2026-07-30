// Delivered by Originkit · stack: react
// Set these props to match the Originkit preview:
//   overrides={{"image":{"src":"https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/d3424fc6-fe9a-48bd-1dfa-841fa8fec700/public"}}}
//   __curationVersion={1}
import { useState, useEffect, useRef, useMemo, useCallback, type CSSProperties } from "react"
import { RenderTarget } from "./framerRuntime"

function ComponentMessage({ title, subtitle, style }: { title: string; subtitle: string; style?: CSSProperties }) {
    return (
        <div style={{ ...style, display: "grid", placeContent: "center", textAlign: "center", color: "rgba(255,255,255,.72)" }}>
            <strong>{title}</strong>
            <span style={{ marginTop: 6, fontSize: 12, color: "rgba(255,255,255,.48)" }}>{subtitle}</span>
        </div>
    )
}

/**
 * Pick the highest-resolution source from a Framer ResponsiveImage. Using the
 * plain `image.src` (a downscaled variant) makes tiles upscale and look
 * pixelated; the largest entry in `srcSet` keeps the reveal crisp.
 */
function pickBestSrc(image: any): string | null {
    if (!image) return null
    if (typeof image === "string") return image
    const srcSet: string | undefined = image.srcSet
    if (srcSet && typeof srcSet === "string") {
        let best: string | null = image.src || null
        let bestW = 0
        for (const part of srcSet.split(",")) {
            const seg = part.trim()
            if (!seg) continue
            const sp = seg.lastIndexOf(" ")
            const url = sp === -1 ? seg : seg.slice(0, sp)
            const w = sp === -1 ? 0 : parseInt(seg.slice(sp + 1), 10)
            if (!isNaN(w) && w > bestW) {
                bestW = w
                best = url
            }
        }
        return best
    }
    return image.src || null
}

// Numeric easing so tile fades can be computed per-frame on the canvas.
const NAMED_EASES: Record<string, [number, number, number, number]> = {
    linear: [0, 0, 1, 1],
    easeIn: [0.42, 0, 1, 1],
    easeOut: [0, 0, 0.58, 1],
    easeInOut: [0.42, 0, 0.58, 1],
}

function cubicBezierEase(x1: number, y1: number, x2: number, y2: number) {
    const cx = 3 * x1
    const bx = 3 * (x2 - x1) - cx
    const ax = 1 - cx - bx
    const cy = 3 * y1
    const by = 3 * (y2 - y1) - cy
    const ay = 1 - cy - by
    const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t
    const sampleY = (t: number) => ((ay * t + by) * t + cy) * t
    const dX = (t: number) => (3 * ax * t + 2 * bx) * t + cx
    return (p: number) => {
        let t = p
        for (let i = 0; i < 8; i++) {
            const x = sampleX(t) - p
            const d = dX(t)
            if (Math.abs(x) < 1e-4 || Math.abs(d) < 1e-6) break
            t -= x / d
        }
        t = t < 0 ? 0 : t > 1 ? 1 : t
        return sampleY(t)
    }
}

/** Map a Framer transition ease (bezier array or string preset) to a numeric ease function. */
function easeToFn(ease: any) {
    if (Array.isArray(ease) && ease.length === 4)
        return cubicBezierEase(ease[0], ease[1], ease[2], ease[3])
    const b =
        (typeof ease === "string" && NAMED_EASES[ease]) || NAMED_EASES.easeOut
    return cubicBezierEase(b[0], b[1], b[2], b[3])
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 600
 * @framerDisableUnlink
 */
export default function PixelReveal({
    image = {
        src: "https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/6eaa9f69-8a66-4e0a-91ec-200d13a56500/w=800",
    },
    pixelSize = 32,
    duration = 3,
    startAlign = "center",
    replay = true,
    style,
}: any) {
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const containerRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null) // visible display canvas
    const offscreenRef = useRef<HTMLCanvasElement | null>(null) // full crisp image
    const imgElRef = useRef<HTMLImageElement | null>(null)
    const tilesRef = useRef<{ x: number; y: number; order: number }[]>([])
    const rafRef = useRef<number | null>(null)
    // Signature of the last build (size + tile size + src). Rebuilding with the
    // same signature is a no-op, so a redundant resize can't wipe a live reveal.
    const buildSigRef = useRef("")
    // Bumped on every real rebuild. A running reveal loop stops as soon as its
    // generation is stale — it would otherwise keep painting tiles from an array
    // that no longer matches the canvas.
    const genRef = useRef(0)
    const lastVersionRef = useRef(-1)
    const [version, setVersion] = useState(0) // bumps when tiles rebuilt
    const [isInView, setIsInView] = useState(false)
    // True only when the element is entirely off-screen (above OR below). The one
    // state in which a revealed image is allowed to be wiped (Replay on) — while
    // any part of it is still on screen it stays painted.
    const [offScreen, setOffScreen] = useState(false)

    // `duration` (seconds) is the TOTAL time for the whole image to appear; every
    // tile is spread evenly across it. Fixed easeOut fade per tile.
    const totalDuration = typeof duration === "number" ? duration : 1.5
    const easeFn = useMemo(() => easeToFn("easeOut"), [])

    const imageSrc = useMemo(() => pickBestSrc(image), [image])
    const hasImage = !!imageSrc

    // Build the crisp offscreen image (cover, at device resolution) and the tile
    // grid. Drawing the FULL-res source once — then revealing slices of it — keeps
    // the assembled result identical to the original image (no CSS upscaling).
    const build = useCallback(() => {
        const container = containerRef.current
        const canvas = canvasRef.current
        const img = imgElRef.current
        if (!container || !canvas || !img) return
        if (!img.complete || !img.naturalWidth) return
        const cw = container.clientWidth
        const ch = container.clientHeight
        if (cw <= 0 || ch <= 0) return

        // A ResizeObserver always fires once as soon as it starts observing, and
        // rebuilding wipes the canvas + reshuffles the tiles out from under a
        // running reveal. Bail on any rebuild that would produce the same result.
        const sig = `${cw}x${ch}|${pixelSize}|${imageSrc}`
        if (sig === buildSigRef.current && tilesRef.current.length) return
        buildSigRef.current = sig

        const dpr = window.devicePixelRatio || 1
        canvas.width = Math.round(cw * dpr)
        canvas.height = Math.round(ch * dpr)
        canvas.style.width = cw + "px"
        canvas.style.height = ch + "px"
        const dctx = canvas.getContext("2d")
        if (!dctx) return
        dctx.setTransform(1, 0, 0, 1, 0, 0)
        dctx.clearRect(0, 0, canvas.width, canvas.height)

        const off = offscreenRef.current || document.createElement("canvas")
        offscreenRef.current = off
        off.width = canvas.width
        off.height = canvas.height
        const octx = off.getContext("2d")
        if (!octx) return

        // Cover-fit the image to the component: scale so it fills the whole
        // container (cropping the overflow), centered. No fixed width/height.
        const nW = img.naturalWidth
        const nH = img.naturalHeight
        const scale = Math.max(cw / nW, ch / nH)
        const dw = nW * scale
        const dh = nH * scale
        const dx = (cw - dw) / 2
        const dy = (ch - dh) / 2
        octx.setTransform(1, 0, 0, 1, 0, 0)
        octx.clearRect(0, 0, off.width, off.height)
        octx.imageSmoothingEnabled = true
        octx.imageSmoothingQuality = "high"
        octx.drawImage(img, dx * dpr, dy * dpr, dw * dpr, dh * dpr)

        // Grid of tiles. Keep a cell if ANY pixel in it has content (not just the
        // center) so curved edges aren't lost to boxy stair-steps. Each tile later
        // blits its real slice, whose per-pixel alpha handles the soft edges.
        const numCols = Math.ceil(cw / pixelSize)
        const rows = Math.ceil(ch / pixelSize)
        const data = octx.getImageData(0, 0, off.width, off.height).data
        const tiles: { x: number; y: number; order: number }[] = []
        const ALPHA_TH = 3 // 0-255
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < numCols; col++) {
                const x = col * pixelSize
                const y = row * pixelSize
                const x0 = Math.floor(x * dpr)
                const y0 = Math.floor(y * dpr)
                const x1 = Math.min(off.width, Math.ceil((x + pixelSize) * dpr))
                const y1 = Math.min(
                    off.height,
                    Math.ceil((y + pixelSize) * dpr)
                )
                let hasContent = false
                for (let py = y0; py < y1 && !hasContent; py++) {
                    let idx = (py * off.width + x0) * 4 + 3
                    for (let px = x0; px < x1; px++) {
                        if (data[idx] > ALPHA_TH) {
                            hasContent = true
                            break
                        }
                        idx += 4
                    }
                }
                if (hasContent) tiles.push({ x, y, order: 0 })
            }
        }

        // Random reveal order.
        for (let i = tiles.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            ;[tiles[i], tiles[j]] = [tiles[j], tiles[i]]
        }
        tiles.forEach((t, i) => (t.order = i))
        tilesRef.current = tiles
        genRef.current += 1
        setVersion((v) => v + 1)
    }, [pixelSize, imageSrc])

    // Whether the image is currently revealed on the display canvas. Drives the
    // "reveal once per entrance" logic — see the trigger effect below.
    const revealedRef = useRef(false)
    // True while the reveal is mid-flight. Scrolling re-renders the component, and
    // without this the trigger effect would treat an in-progress reveal as already
    // done and snap it to the full image with drawFull().
    const animatingRef = useRef(false)

    // Play the staggered reveal: each tile fades its slice of the offscreen image
    // onto the display canvas. Committed (fully revealed) tiles are drawn once.
    const animate = useCallback(() => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current)
        const canvas = canvasRef.current
        const off = offscreenRef.current
        if (!canvas || !off) return
        const dctx = canvas.getContext("2d")
        if (!dctx) return
        const dpr = window.devicePixelRatio || 1
        const tiles = tilesRef.current
        if (!tiles.length) return
        dctx.clearRect(0, 0, canvas.width, canvas.height)
        // Spread every tile evenly across the total duration so the last one
        // finishes exactly at `totalDuration`. Each tile fades over one slot.
        const slot = totalDuration / tiles.length
        const committed = new Uint8Array(tiles.length)
        const start = performance.now()
        const gen = genRef.current
        animatingRef.current = true
        const step = (now: number) => {
            // A rebuild happened under us: this loop's tiles and the canvas no
            // longer agree. Stop; the trigger effect restarts a fresh reveal.
            if (gen !== genRef.current) {
                rafRef.current = null
                return
            }
            const elapsed = (now - start) / 1000
            let allDone = true
            for (let i = 0; i < tiles.length; i++) {
                if (committed[i]) continue
                const t = tiles[i]
                const p = slot > 0 ? (elapsed - t.order * slot) / slot : 1
                if (p <= 0) {
                    allDone = false
                    continue
                }
                // Snap to shared boundaries so adjacent tiles tile exactly — with
                // ceil()ed widths a tile's clearRect can bleed into an already
                // committed neighbour, which is never repainted.
                const dx = Math.round(t.x * dpr)
                const dy = Math.round(t.y * dpr)
                const dw = Math.round((t.x + pixelSize) * dpr) - dx
                const dh = Math.round((t.y + pixelSize) * dpr) - dy
                dctx.clearRect(dx, dy, dw, dh)
                if (p >= 1) {
                    dctx.globalAlpha = 1
                    dctx.drawImage(off, dx, dy, dw, dh, dx, dy, dw, dh)
                    committed[i] = 1
                } else {
                    allDone = false
                    dctx.globalAlpha = easeFn(p)
                    dctx.drawImage(off, dx, dy, dw, dh, dx, dy, dw, dh)
                }
            }
            dctx.globalAlpha = 1
            if (allDone) {
                // Repaint the whole image in one blit. Every tile is at full
                // opacity by now, so this is invisible — it just guarantees the
                // final frame is the complete image, with no tile left behind.
                dctx.clearRect(0, 0, canvas.width, canvas.height)
                dctx.drawImage(off, 0, 0)
                animatingRef.current = false
                rafRef.current = null
            } else {
                rafRef.current = requestAnimationFrame(step)
            }
        }
        rafRef.current = requestAnimationFrame(step)
    }, [totalDuration, easeFn, pixelSize])

    // Wipe the display canvas (used when the component leaves view in replay
    // mode, so the next entrance reveals from blank again).
    const clearDisplay = useCallback(() => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current)
        const canvas = canvasRef.current
        const dctx = canvas?.getContext("2d")
        if (canvas && dctx) dctx.clearRect(0, 0, canvas.width, canvas.height)
    }, [])

    // Draw the whole image at once, no animation. Used to keep the image visible
    // after it has already revealed (Replay off) across rebuilds/resizes so it
    // never blanks out.
    const drawFull = useCallback(() => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current)
        const canvas = canvasRef.current
        const off = offscreenRef.current
        const dctx = canvas?.getContext("2d")
        if (!canvas || !off || !dctx) return
        dctx.clearRect(0, 0, canvas.width, canvas.height)
        dctx.globalAlpha = 1
        dctx.drawImage(off, 0, 0)
    }, [])

    // Load image, then build.
    useEffect(() => {
        // New image → allow the reveal to play again from blank.
        revealedRef.current = false
        if (!imageSrc) {
            tilesRef.current = []
            setVersion((v) => v + 1)
            return
        }
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
            imgElRef.current = img
            build()
        }
        img.onerror = () => {
            imgElRef.current = null
            tilesRef.current = []
            setVersion((v) => v + 1)
        }
        img.src = imageSrc
    }, [imageSrc, build])

    // Rebuild on resize (debounced).
    useEffect(() => {
        const container = containerRef.current
        if (!imageSrc || !container) return
        let timeout: ReturnType<typeof setTimeout> | null = null
        const onResize = () => {
            if (timeout) clearTimeout(timeout)
            timeout = setTimeout(build, 60)
        }
        let ro: ResizeObserver | null = null
        if (typeof ResizeObserver !== "undefined") {
            ro = new ResizeObserver(onResize)
            ro.observe(container)
        } else {
            window.addEventListener("resize", onResize)
        }
        return () => {
            if (timeout) clearTimeout(timeout)
            if (ro) ro.disconnect()
            else window.removeEventListener("resize", onResize)
        }
    }, [imageSrc, build])

    // Scroll trigger, measured off the layer's rect (same approach as BlobReveal).
    // Two distinct signals, and the difference is the whole point:
    //   isInView      — the chosen edge has crossed into the viewport → reveal.
    //   scrolledBelow — the element sits entirely BELOW the viewport, i.e. it has
    //                   not been reached (or has been scrolled back away from).
    // Only `scrolledBelow` clears the canvas. Scrolling the image up and off the
    // top leaves it painted, so a revealed image is never yanked away while the
    // user can still see it — the old IntersectionObserver blanked it on ANY exit.
    useEffect(() => {
        if (isCanvas) return
        let raf: number | null = null
        const check = () => {
            const container = containerRef.current
            if (!container) return
            const rect = container.getBoundingClientRect()
            const vh = window.innerHeight || 0
            const edge =
                startAlign === "top"
                    ? rect.top
                    : startAlign === "center"
                      ? rect.top + rect.height / 2
                      : rect.bottom
            setIsInView(edge <= vh && rect.bottom >= 0)
            // Fully off-screen in EITHER direction: entirely below the fold
            // (rect.top > vh) or scrolled entirely past the top (rect.bottom < 0).
            // Both re-arm the reveal, so it plays again whichever way you come back.
            setOffScreen(rect.top > vh || rect.bottom < 0)
        }
        const onScroll = () => {
            if (raf) cancelAnimationFrame(raf)
            raf = requestAnimationFrame(check)
        }
        check()
        window.addEventListener("scroll", onScroll, { passive: true })
        window.addEventListener("resize", onScroll)
        return () => {
            if (raf) cancelAnimationFrame(raf)
            window.removeEventListener("scroll", onScroll)
            window.removeEventListener("resize", onScroll)
        }
    }, [startAlign, isCanvas])

    // Trigger the reveal. Canvas preview always plays.
    // Replay on  → reveal on entrance; reset once the element is fully off-screen
    //              (either direction), so coming back from above OR below reveals
    //              again from blank.
    // Replay off → reveal pixel-by-pixel ONCE, then stay for good.
    // NOTE: this effect must NOT cancel the rAF in a cleanup. Scrolling updates
    // isInView/offScreen, which re-runs the effect — a cleanup that cancelled the
    // loop would abort a reveal the moment the user scrolled, and the re-run would
    // then see revealedRef and snap straight to the full image via drawFull().
    // The reveal is torn down only on unmount (separate effect below).
    useEffect(() => {
        if (!tilesRef.current.length) return
        // A rebuild (resize / new image / new tile size) invalidates whatever the
        // running loop was painting — it has already stopped itself on the stale
        // generation, leaving a half-painted canvas. Play the reveal again.
        const rebuilt = version !== lastVersionRef.current
        lastVersionRef.current = version
        const interrupted = rebuilt && animatingRef.current
        if (isCanvas) {
            if (interrupted || !animatingRef.current) animate()
            return
        }
        if (replay && offScreen) {
            // Completely out of sight — wipe so it can reveal again on the way
            // back in. Nothing the user can see is being hidden here.
            if (revealedRef.current || animatingRef.current) {
                clearDisplay()
                animatingRef.current = false
                revealedRef.current = false
            }
        } else if (isInView && (!revealedRef.current || interrupted)) {
            revealedRef.current = true
            animate()
        } else if (revealedRef.current && !animatingRef.current) {
            // Revealed AND finished — keep it fully shown across rebuilds/resizes.
            // Guarded on animatingRef: mid-reveal this would snap to the full
            // image, which is exactly what scrolling used to do.
            drawFull()
        }
    }, [
        version,
        isCanvas,
        isInView,
        offScreen,
        replay,
        animate,
        clearDisplay,
        drawFull,
    ])

    // Stop the reveal loop only when the component actually goes away.
    useEffect(() => {
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
            animatingRef.current = false
        }
    }, [])

    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    width: "100%",
                    height: "100%",
                }}
            />
            {!hasImage && (
                <ComponentMessage
                    style={{
                        position: "relative",
                        width: "100%",
                        height: "100%",
                        minWidth: 0,
                        minHeight: 0,
                    }}
                    title="Pixel Reveal"
                    subtitle="Add an image to see the pixel reveal effect"
                />
            )}
        </div>
    )
}

PixelReveal.defaultProps = {
    image: {
        src: "https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/6eaa9f69-8a66-4e0a-91ec-200d13a56500/w=800",
    },
    pixelSize: 32,
    duration: 3,
    startAlign: "center",
    replay: true,
}
