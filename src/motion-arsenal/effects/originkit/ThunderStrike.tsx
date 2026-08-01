import { useEffect, useRef } from 'react';
import NoxHorizonRift, { type NoxHorizonRiftProps } from './NoxHorizonRift';

/**
 * ThunderStrike — GPU electric lightning shader (fbm-driven crackle).
 * Ported from Originkit (originkit.dev/components/thunderstrike), Framer
 * runtime stripped.
 */

function rgbToHslWithSV(rgb: string): { h: number; s: number; v: number } {
  const [r, g, b] = rgb
    .replace('rgb(', '')
    .replace(')', '')
    .split(',')
    .map((n) => parseInt(n.trim()) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  const v = max;
  const d = max - min;
  const s = max === 0 ? 0 : d / max;
  if (max === min) {
    h = 0;
  } else {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h *= 60;
  }
  return { h: h >= 0 ? h : h + 360, s, v };
}

/**
 * `classic`         — der portierte Originkit-Shader (Default, unverändert).
 * `nox-horizon-rift`— scrollgebundene Hero→Cosmic-Kante, siehe NoxHorizonRift.
 *                     Eigene Implementierung, weil der Shader zeitgetrieben ist
 *                     und sich weder am Scroll festmachen noch rückwärts
 *                     abspielen lässt.
 */
export type ThunderStrikeVariant = 'classic' | 'nox-horizon-rift';

interface Props extends Partial<NoxHorizonRiftProps> {
  variant?: ThunderStrikeVariant;
  lightningColor?: string;
  backgroundColor?: string;
  xOffset?: number;
  speed?: number;
  intensity?: number;
  size?: number;
  angle?: number;
  style?: React.CSSProperties;
}

export default function ThunderStrike(props: Props) {
  if (props.variant === 'nox-horizon-rift') {
    const { variant, lightningColor, backgroundColor, xOffset, speed, intensity, size, angle, ...rift } = props;
    return <NoxHorizonRift {...rift} />;
  }
  return <ThunderStrikeClassic {...props} />;
}

function ThunderStrikeClassic(props: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resizeCanvas = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    const gl = canvas.getContext('webgl');
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }
    let isDestroyed = false;
    let rafId = 0;

    const compileShader = (source: string, type: number) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };
    const vertexShader = compileShader(vertexShaderSource, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER);
    if (!vertexShader || !fragmentShader) return;
    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program linking error:', gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);
    const uniforms: Record<string, WebGLUniformLocation | null> = {
      iResolution: gl.getUniformLocation(program, 'iResolution'),
      iTime: gl.getUniformLocation(program, 'iTime'),
      uHue: gl.getUniformLocation(program, 'uHue'),
      uBackgroundHsv: gl.getUniformLocation(program, 'uBackgroundHsv'),
      uXOffset: gl.getUniformLocation(program, 'uXOffset'),
      uSpeed: gl.getUniformLocation(program, 'uSpeed'),
      uIntensity: gl.getUniformLocation(program, 'uIntensity'),
      uSize: gl.getUniformLocation(program, 'uSize'),
      uAngle: gl.getUniformLocation(program, 'uAngle'),
    };
    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    const aPosition = gl.getAttribLocation(program, 'aPosition');
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);
    const startTime = performance.now();

    const render = () => {
      if (isDestroyed) return;
      resizeCanvas();
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (uniforms.iResolution) gl.uniform2f(uniforms.iResolution, canvas.width, canvas.height);
      const currentTime = performance.now();
      if (uniforms.iTime) gl.uniform1f(uniforms.iTime, (currentTime - startTime) / 1e3);

      const mainColor = rgbToHslWithSV(props.lightningColor ?? 'rgb(245, 114, 25)');
      const bgColor = rgbToHslWithSV(props.backgroundColor ?? 'rgb(0, 0, 0)');
      if (uniforms.uHue) gl.uniform1f(uniforms.uHue, mainColor.h);
      if (uniforms.uBackgroundHsv) gl.uniform3f(uniforms.uBackgroundHsv, bgColor.h / 360, bgColor.s, bgColor.v);
      if (uniforms.uXOffset) gl.uniform1f(uniforms.uXOffset, -(props.xOffset ?? 1) / 25);
      if (uniforms.uSpeed) gl.uniform1f(uniforms.uSpeed, (props.speed ?? 55) / 50);
      if (uniforms.uIntensity) gl.uniform1f(uniforms.uIntensity, (props.intensity ?? 23) / 50);
      if (uniforms.uSize) gl.uniform1f(uniforms.uSize, (props.size ?? 50) * 0.03);
      if (uniforms.uAngle) gl.uniform1f(uniforms.uAngle, ((props.angle ?? -27) * Math.PI) / 180);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      if (!isDestroyed) rafId = requestAnimationFrame(render);
    };
    render();

    return () => {
      isDestroyed = true;
      window.removeEventListener('resize', resizeCanvas);
      if (rafId) cancelAnimationFrame(rafId);
      if (vertexBuffer) gl.deleteBuffer(vertexBuffer);
      if (vertexShader) gl.deleteShader(vertexShader);
      if (fragmentShader) gl.deleteShader(fragmentShader);
      if (program) gl.deleteProgram(program);
    };
  }, [props.lightningColor, props.backgroundColor, props.xOffset, props.speed, props.intensity, props.size, props.angle]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', position: 'relative', ...(props.style || {}) }} />
    </div>
  );
}

const vertexShaderSource = `
attribute vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;
const fragmentShaderSource = `
precision mediump float;
uniform vec2 iResolution;
uniform float iTime;
uniform float uHue;
uniform vec3 uBackgroundHsv;
uniform float uXOffset;
uniform float uSpeed;
uniform float uIntensity;
uniform float uSize;
uniform float uAngle;

#define OCTAVE_COUNT 10

vec3 hsv2rgb(vec3 c) {
    vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0,4.0,2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
    return c.z * mix(vec3(1.0), rgb, c.y);
}

float hash11(float p) {
    p = fract(p * .1031);
    p *= p + 33.33;
    p *= p + p;
    return fract(p);
}

float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * .1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

mat2 rotate2d(float theta) {
    float c = cos(theta);
    float s = sin(theta);
    return mat2(c, -s, s, c);
}

float noise(vec2 p) {
    vec2 ip = floor(p);
    vec2 fp = fract(p);
    float a = hash12(ip);
    float b = hash12(ip + vec2(1.0, 0.0));
    float c = hash12(ip + vec2(0.0, 1.0));
    float d = hash12(ip + vec2(1.0, 1.0));

    vec2 t = smoothstep(0.0, 1.0, fp);
    return mix(mix(a, b, t.x), mix(c, d, t.x), t.y);
}

float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < OCTAVE_COUNT; ++i) {
        value += amplitude * noise(p);
        p *= rotate2d(0.45);
        p *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
    vec2 uv = fragCoord / iResolution.xy;
    uv = 2.0 * uv - 1.0;
    uv.x *= iResolution.x / iResolution.y;

    uv *= rotate2d(uAngle);
    uv.x += uXOffset;
    uv += 2.0 * fbm(uv * uSize + 0.8 * iTime * uSpeed) - 1.0;

    float dist = abs(uv.x);
    vec3 baseColor = hsv2rgb(vec3(uHue / 360.0, 0.7, 0.8));
    vec3 bgColor = hsv2rgb(vec3(uBackgroundHsv.x, uBackgroundHsv.y, uBackgroundHsv.z));
    vec3 lightningEffect = baseColor * pow(mix(0.0, 0.07, hash11(iTime * uSpeed)) / dist, 1.0) * uIntensity;
    vec3 col = mix(bgColor, lightningEffect, lightningEffect.r);
    col = pow(col, vec3(1.0));
    fragColor = vec4(col, 1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
`;

ThunderStrike.defaultProps = {
  lightningColor: 'rgb(245, 114, 25)',
  backgroundColor: 'rgb(0, 0, 0)',
  xOffset: 1,
  speed: 55,
  intensity: 23,
  size: 50,
  angle: -27,
};
