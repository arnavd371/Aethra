/**
 * InkVell-style moving dithered wave background (Three.js),
 * tinted for Aethra: light blue paper #DCEAF9, navy-ink waves.
 */
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";

const mount = document.getElementById("ink-bg");
if (!mount) {
  /* no mount */
} else {
  const PAPER = 0xdceaf9;
  const INK = 0x3f5170;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(PAPER);

  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(0, 0, 1);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  mount.appendChild(renderer.domElement);

  const geometry = new THREE.PlaneGeometry(4, 4, 128, 128);

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(INK) },
      uResolution: {
        value: new THREE.Vector2(window.innerWidth, window.innerHeight),
      },
    },
    transparent: true,
    vertexShader: `
      varying vec2 vUv;
      varying float vElevation;
      uniform float uTime;

      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

      float snoise(vec3 v) {
        const vec2  C = vec2(1.0/6.0, 1.0/3.0);
        const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
        vec3 i  = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;
        i = mod289(i);
        vec4 p = permute(permute(permute(
                   i.z + vec4(0.0, i1.z, i2.z, 1.0))
                 + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                 + i.x + vec4(0.0, i1.x, i2.x, 1.0));
        float n_ = 0.142857142857;
        vec3  ns = n_ * D.wyz - D.xzx;
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
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
        p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
      }

      void main() {
        vUv = uv;
        float noise = snoise(vec3(position.x * 0.8, position.y * 0.8, uTime * 0.1));
        float smallNoise = snoise(vec3(position.x * 2.5, position.y * 2.5, uTime * 0.15)) * 0.15;
        vElevation = noise + smallNoise;
        vec3 newPos = position;
        newPos.z += vElevation * 0.2;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      varying float vElevation;

      float dither(vec2 pos, float brightness) {
        float bayer[16];
        bayer[0] = 0.0/16.0;  bayer[1] = 8.0/16.0;  bayer[2] = 2.0/16.0;  bayer[3] = 10.0/16.0;
        bayer[4] = 12.0/16.0; bayer[5] = 4.0/16.0;  bayer[6] = 14.0/16.0; bayer[7] = 6.0/16.0;
        bayer[8] = 3.0/16.0;  bayer[9] = 11.0/16.0; bayer[10] = 1.0/16.0; bayer[11] = 9.0/16.0;
        bayer[12] = 15.0/16.0; bayer[13] = 7.0/16.0; bayer[14] = 13.0/16.0; bayer[15] = 5.0/16.0;

        int x = int(mod(pos.x, 4.0));
        int y = int(mod(pos.y, 4.0));
        int index = x + y * 4;
        float limit = 0.0;
        if (index == 0) limit = bayer[0];
        if (index == 1) limit = bayer[1];
        if (index == 2) limit = bayer[2];
        if (index == 3) limit = bayer[3];
        if (index == 4) limit = bayer[4];
        if (index == 5) limit = bayer[5];
        if (index == 6) limit = bayer[6];
        if (index == 7) limit = bayer[7];
        if (index == 8) limit = bayer[8];
        if (index == 9) limit = bayer[9];
        if (index == 10) limit = bayer[10];
        if (index == 11) limit = bayer[11];
        if (index == 12) limit = bayer[12];
        if (index == 13) limit = bayer[13];
        if (index == 14) limit = bayer[14];
        if (index == 15) limit = bayer[15];
        return step(limit, brightness);
      }

      void main() {
        float brightness = smoothstep(-1.0, 1.0, vElevation);
        brightness = 0.6 + brightness * 0.5;
        float d = dither(gl_FragCoord.xy, brightness);
        float alpha = (1.0 - d) * 0.30;
        gl_FragColor = vec4(uColor, alpha);
      }
    `,
  });

  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  const clock = new THREE.Clock();
  let raf = 0;

  function animate() {
    material.uniforms.uTime.value = clock.getElapsedTime();
    renderer.render(scene, camera);
    raf = requestAnimationFrame(animate);
  }
  animate();

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    material.uniforms.uResolution.value.set(
      window.innerWidth,
      window.innerHeight
    );
  }
  window.addEventListener("resize", onResize);

  window.addEventListener("pagehide", () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", onResize);
    geometry.dispose();
    material.dispose();
    renderer.dispose();
    if (mount.contains(renderer.domElement)) {
      mount.removeChild(renderer.domElement);
    }
  });
}
