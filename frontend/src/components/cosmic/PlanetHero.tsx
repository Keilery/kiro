"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useMemo, useRef } from "react";
import { Mesh, ShaderMaterial, AdditiveBlending, DoubleSide, BackSide, Vector3 } from "three";

/**
 * PlanetHero — процедурная 3D-планета с GLSL шейдером.
 * Чёрно-белая поверхность с лунным/каменным шумом, атмосферный halo,
 * двойное кольцо в наклонной плоскости (как Сатурн, но монохромное).
 *
 * Никаких внешних текстур — все детали из шейдера. Один canvas, ~1k треугольников.
 */

const vert = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Лунная поверхность: многослойный simplex + кратеры через смещение.
const planetFrag = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec3 uLight;

  // 3D hash + simplex (компактная версия)
  vec3 hash33(vec3 p) {
    p = vec3(dot(p, vec3(127.1, 311.7, 74.7)),
             dot(p, vec3(269.5, 183.3, 246.1)),
             dot(p, vec3(113.5, 271.9, 124.6)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
  }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod(i, 289.0);
    vec4 p = mod(i.z + vec4(0.0, i1.z, i2.z, 1.0), 289.0);
    p = mod((p * 49.0) + i.y + vec4(0.0, i1.y, i2.y, 1.0), 289.0);
    p = mod((p * 49.0) + i.x + vec4(0.0, i1.x, i2.x, 1.0), 289.0);
    vec3 ns = (1.0 / 7.0) * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = inversesqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
  }

  float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * snoise(p);
      p *= 2.0;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec3 p = normalize(vPosition);
    // Континенты + мелкая фактура
    float landmass = fbm(p * 1.8);
    float detail = fbm(p * 6.0 + uTime * 0.005);
    float craters = fbm(p * 18.0) * 0.4;
    float h = landmass + detail * 0.25 + craters * 0.15;

    // Поляризация: тёмные «моря», светлые «возвышенности»
    float tone = smoothstep(-0.15, 0.45, h);

    // Полярные шапки
    float polar = smoothstep(0.78, 0.94, abs(p.y));
    tone = mix(tone, 1.0, polar * 0.85);

    // Тонкий контурный рисунок на терминаторе
    float fres = 1.0 - abs(dot(vNormal, normalize(cameraPosition - vPosition)));
    fres = pow(fres, 2.5);

    // Освещение
    float ndotl = max(dot(vNormal, normalize(uLight)), 0.0);
    float lighting = pow(ndotl, 0.85);

    vec3 base = mix(vec3(0.07), vec3(0.92), tone);
    vec3 col = base * (0.16 + lighting * 0.84);

    // Глубокая тень — почти чёрная
    col *= 0.5 + 0.5 * lighting;

    // Подсветка терминатора
    col += vec3(0.06, 0.08, 0.10) * fres * lighting * 0.6;

    // Контурный grain
    float g = snoise(p * 80.0);
    col += g * 0.015;

    gl_FragColor = vec4(col, 1.0);
  }
`;

const atmoFrag = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.5);
    gl_FragColor = vec4(vec3(1.0), intensity * 0.85);
  }
`;

function Planet() {
  const mesh = useRef<Mesh>(null);
  const mat = useRef<ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uLight: { value: new Vector3(2.5, 1.2, 1.5).normalize() }
    }),
    []
  );

  useFrame((_, dt) => {
    if (mesh.current) {
      mesh.current.rotation.y += dt * 0.05;
      mesh.current.rotation.x = Math.sin(performance.now() * 0.00018) * 0.1 + 0.15;
    }
    if (mat.current) {
      (mat.current.uniforms.uTime.value as number) += dt;
    }
  });

  return (
    <group>
      {/* Атмосфера / halo */}
      <mesh scale={1.18}>
        <sphereGeometry args={[1, 64, 64]} />
        <shaderMaterial
          vertexShader={vert}
          fragmentShader={atmoFrag}
          transparent
          side={BackSide}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      {/* Поверхность */}
      <mesh ref={mesh} castShadow receiveShadow>
        <sphereGeometry args={[1, 96, 96]} />
        <shaderMaterial
          ref={mat}
          vertexShader={vert}
          fragmentShader={planetFrag}
          uniforms={uniforms}
        />
      </mesh>
    </group>
  );
}

function OrbitRing({
  radius,
  thickness = 0.012,
  opacity = 0.4,
  tilt = 0.3,
  speed = 1
}: {
  radius: number;
  thickness?: number;
  opacity?: number;
  tilt?: number;
  speed?: number;
}) {
  const ref = useRef<Mesh>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.z += dt * 0.02 * speed;
  });
  return (
    <mesh ref={ref} rotation={[Math.PI / 2 - tilt, 0, 0]}>
      <ringGeometry args={[radius - thickness, radius + thickness, 128]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={opacity} side={DoubleSide} />
    </mesh>
  );
}

function OrbitingDot({
  radius,
  speed = 1,
  tilt = 0.3,
  phase = 0
}: {
  radius: number;
  speed?: number;
  tilt?: number;
  phase?: number;
}) {
  const ref = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime * speed + phase;
    ref.current.position.set(
      Math.cos(t) * radius,
      Math.sin(t) * radius * Math.sin(tilt),
      Math.sin(t) * radius * Math.cos(tilt)
    );
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.022, 16, 16]} />
      <meshBasicMaterial color="#ffffff" />
    </mesh>
  );
}

export function PlanetHero() {
  return (
    <div className="absolute inset-0">
      <Canvas
        camera={{ position: [0, 0.4, 3.2], fov: 38 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.18} />
        <directionalLight position={[5, 3, 4]} intensity={1.4} />
        <Suspense fallback={null}>
          <Planet />
          <OrbitRing radius={1.55} thickness={0.004} opacity={0.5} tilt={0.6} speed={1} />
          <OrbitRing radius={1.85} thickness={0.003} opacity={0.32} tilt={0.45} speed={-0.6} />
          <OrbitRing radius={2.2} thickness={0.002} opacity={0.18} tilt={0.7} speed={0.4} />
          <OrbitingDot radius={1.55} speed={0.6} tilt={0.6} phase={0.0} />
          <OrbitingDot radius={1.55} speed={0.6} tilt={0.6} phase={Math.PI * 1.2} />
          <OrbitingDot radius={1.85} speed={0.42} tilt={0.45} phase={1.2} />
          <OrbitingDot radius={2.2} speed={0.3} tilt={0.7} phase={2.4} />
        </Suspense>
      </Canvas>
    </div>
  );
}
