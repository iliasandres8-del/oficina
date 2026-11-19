// Clips Tower: torre de 5 pisos abierta por delante (como una casa de muñecas). En cada piso trabajan
// oficinistas de verdad (Quaternius, Ultimate Modular Men/Women, CC0) y un ascensor sube el video
// de piso en piso hasta la Dirección. La página le habla con window.escena3d (estado, paquete, jefe).
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone as clonarEsqueleto } from "three/addons/utils/SkeletonUtils.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

const PISOS = window.PISOS;
await document.fonts.load("900 104px Unbounded").catch(() => {});
const caja = document.getElementById("torre-caja");
const capa = document.getElementById("rotulos");
const aviso = document.getElementById("cargando3d");
const quieto = matchMedia("(prefers-reduced-motion: reduce)").matches;
const celular = innerWidth < 900;

let render;
try {
  render = new THREE.WebGLRenderer({ antialias: !celular, powerPreference: "high-performance" });
} catch {
  aviso.textContent = "Este navegador no pudo dibujar la torre en 3D.";
  throw new Error("sin WebGL");
}
render.setPixelRatio(Math.min(devicePixelRatio, celular ? 1.5 : 1.75));
render.toneMapping = THREE.ACESFilmicToneMapping;
render.toneMappingExposure = 1.0;
render.shadowMap.enabled = true;
render.shadowMap.type = THREE.PCFSoftShadowMap;
caja.prepend(render.domElement);

const escena = new THREE.Scene();
escena.fog = new THREE.Fog(0x3a1452, 40, 110);
const pmrem = new THREE.PMREMGenerator(render);
escena.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
escena.environmentIntensity = 0.2;
const camara = new THREE.PerspectiveCamera(34, 1, 0.1, 300);

// ---------- ayudantes ----------
let semilla = 11;
const azar = () => ((semilla = (semilla * 16807) % 2147483647) / 2147483647);
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...extra });
const neon = (color, fuerza = 1.6) => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: fuerza, toneMapped: false });
const caja3 = (w, h, d, m, sombra = true) => { const x = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); x.castShadow = sombra; x.receiveShadow = true; return x; };
const ESFERA = new THREE.SphereGeometry(1, 12, 9);
const bola = (r, m) => { const b = new THREE.Mesh(ESFERA, m); b.scale.setScalar(r); b.castShadow = true; return b; };
function textura(w, h, dibujar) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  dibujar(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

// ---------- medidas de la torre ----------
const W = 7.2, D = 5.4, H = 2.9, LOSA = 0.24, BASE = 0.35;
const yPiso = (i) => BASE + i * H;
const ALTO = BASE + PISOS.length * H;

// ---------- luces ----------
escena.add(new THREE.HemisphereLight(0xffc6e0, 0x2a0d4a, 0.8));
const luzSol = new THREE.DirectionalLight(0xffc29a, 1.7);
luzSol.position.set(14, 26, 10); luzSol.castShadow = true;
luzSol.shadow.mapSize.set(celular ? 1024 : 2048, celular ? 1024 : 2048);
Object.assign(luzSol.shadow.camera, { left: -12, right: 12, top: 20, bottom: -6, near: 1, far: 70 });
luzSol.shadow.bias = -0.0004; luzSol.shadow.normalBias = 0.03;
luzSol.target.position.set(0, ALTO / 2, 0); escena.add(luzSol, luzSol.target);
const relleno = new THREE.DirectionalLight(0xa58bff, 0.6); relleno.position.set(-10, 8, 14); escena.add(relleno);

// ---------- cielo de atardecer, sol a rayas, estrellas, palmeras ----------
escena.add(new THREE.Mesh(new THREE.SphereGeometry(140, 32, 16), new THREE.MeshBasicMaterial({
  side: THREE.BackSide, fog: false, map: textura(4, 512, (g, w, h) => {
    const d = g.createLinearGradient(0, 0, 0, h);
    d.addColorStop(0, "#0b041c"); d.addColorStop(0.3, "#2e1058"); d.addColorStop(0.43, "#9c2a68");
    d.addColorStop(0.495, "#ff9a4f"); d.addColorStop(0.52, "#3a1452"); d.addColorStop(1, "#10051c");
    g.fillStyle = d; g.fillRect(0, 0, w, h);
  }),
})));
const sol = new THREE.Mesh(new THREE.PlaneGeometry(46, 46), new THREE.MeshBasicMaterial({
  transparent: true, fog: false, depthWrite: false, toneMapped: false, map: textura(512, 512, (g, w, h) => {
    const d = g.createLinearGradient(0, 0, 0, h);
    d.addColorStop(0, "#ffe17a"); d.addColorStop(0.6, "#ff7a45"); d.addColorStop(1, "#ff3d7f");
    g.fillStyle = d; g.beginPath(); g.arc(w / 2, h / 2, w / 2 - 2, 0, 7); g.fill();
    g.globalCompositeOperation = "destination-out";
    for (let y = h * 0.5; y < h; y += 30) g.fillRect(0, y, w, 5 + ((y - h * 0.5) / h) * 30);
  }),
}));
escena.add(sol);
{
  const n = 500, p = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const a = azar() * Math.PI * 2, e = 0.2 + azar() * 1.25;
    p.set([Math.cos(a) * Math.cos(e) * 130, Math.sin(e) * 130, Math.sin(a) * Math.cos(e) * 130], i * 3);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(p, 3));
  escena.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 0.5, fog: false, transparent: true, opacity: 0.85 })));
}
const mPalma = mat(0x1e0a36, { emissive: 0x13051f });
function palma(alto) {
  const g = new THREE.Group(), curva = 0.05 + azar() * 0.08;
  let x = 0, y = 0;
  for (let i = 0; i < 7; i++) {
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.2 - i * 0.012, 0.24 - i * 0.012, alto / 7 + 0.05, 6), mPalma);
    x += curva * i * 0.35; s.position.set(x, y + alto / 14, 0); s.rotation.z = -curva * i * 0.5; s.castShadow = true; g.add(s); y += alto / 7;
  }
  for (let i = 0; i < 9; i++) {
    const piv = new THREE.Group(); piv.position.set(x, y, 0); piv.rotation.y = (i / 9) * Math.PI * 2 + azar() * 0.3;
    const hoja = new THREE.Mesh(new THREE.ConeGeometry(0.42, 3.6, 4), mPalma);
    hoja.scale.z = 0.22; hoja.rotation.x = Math.PI / 2 + 0.55 + azar() * 0.25; hoja.position.set(0, -0.5, 1.6); hoja.castShadow = true;
    piv.add(hoja); g.add(piv);
  }
  return g;
}
const palmas = [];
for (let i = 0; i < 16; i++) {
  const a = (i / 16) * Math.PI * 2 + azar() * 0.25, r = 12 + azar() * 14;
  const p = palma(6 + azar() * 6); p.position.set(Math.cos(a) * r, 0, Math.sin(a) * r); p.rotation.y = azar() * 6; escena.add(p); palmas.push(p);
}

// ---------- plaza ----------
{
  const t = textura(1024, 1024, (g, w) => {
    const c = w / 2, d = g.createRadialGradient(c, c, 0, c, c, c);
    d.addColorStop(0, "#3d1868"); d.addColorStop(0.75, "#1f0c3e"); d.addColorStop(1, "#14072a");
    g.fillStyle = d; g.fillRect(0, 0, w, w);
    g.strokeStyle = "rgba(255,120,170,.18)"; g.lineWidth = 2;
    for (let r = 80; r < c; r += 80) { g.beginPath(); g.arc(c, c, r, 0, 7); g.stroke(); }
  });
  const plaza = new THREE.Mesh(new THREE.CircleGeometry(10.5, 72), new THREE.MeshStandardMaterial({ map: t, roughness: 0.3, metalness: 0.15 }));
  plaza.rotation.x = -Math.PI / 2; plaza.receiveShadow = true; escena.add(plaza);
  const aro = new THREE.Mesh(new THREE.TorusGeometry(10.5, 0.06, 6, 140), neon(0xff4f8b, 2)); aro.rotation.x = Math.PI / 2; aro.position.y = 0.03; escena.add(aro);
  const zocalo = caja3(W + 0.8, BASE, D + 0.8, mat(0x22113f, { roughness: 0.4 })); zocalo.position.y = BASE / 2; escena.add(zocalo);
}

// ---------- pantallas animadas ----------
function pantallaViva(color, ancho = 256, alto = 150) {
  const c = document.createElement("canvas"); c.width = ancho; c.height = alto;
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return { c, g: c.getContext("2d"), t, color, avance: azar() };
}
function pintarPantalla(p, trabajando, error, t) {
  const { g, c } = p, w = c.width, h = c.height;
  g.fillStyle = "#120a26"; g.fillRect(0, 0, w, h);
  g.fillStyle = error ? "#ff3355" : p.color; g.fillRect(0, 0, w, 16);
  g.fillStyle = "rgba(0,0,0,.75)"; g.font = "bold 11px sans-serif"; g.fillText(error ? "ERROR" : trabajando ? "TRABAJANDO" : "EN ESPERA", 8, 12);
  g.fillStyle = "#2a1d4f"; g.fillRect(10, 24, 54, 96);
  if (trabajando) { g.fillStyle = p.color; g.globalAlpha = 0.35 + 0.25 * Math.sin(t * 3); g.fillRect(10, 24, 54, 96); g.globalAlpha = 1; }
  g.fillStyle = "#fff"; g.beginPath(); g.moveTo(30, 60); g.lineTo(30, 84); g.lineTo(48, 72); g.fill();
  for (let i = 0; i < 6; i++) {
    const ancho = 60 + ((i * 37 + Math.floor(t * (trabajando ? 2 : 0))) % 5) * 22;
    g.fillStyle = i === 0 ? p.color : "rgba(255,255,255,.35)"; g.fillRect(76, 28 + i * 14, ancho, 6);
  }
  if (trabajando) p.avance = (p.avance + 0.02) % 1;
  g.fillStyle = "rgba(255,255,255,.15)"; g.fillRect(10, 130, w - 20, 8);
  g.fillStyle = p.color; g.fillRect(10, 130, (w - 20) * (trabajando ? p.avance : 0.15), 8);
  p.t.needsUpdate = true;
}

// ---------- muebles ----------
const mMesa = mat(0xd6cdee, { roughness: 0.45 }), mPata = mat(0xb9aedc, { metalness: 0.7, roughness: 0.3 });
const mOscuro = mat(0x15101f, { roughness: 0.3, metalness: 0.4 }), mSilla = mat(0x2a1f48, { roughness: 0.5 });
const mHoja = mat(0x2fbf71, { roughness: 0.7 }), mMaceta = mat(0xf2e8ff, { roughness: 0.4 });
function mata(alta = 1) {
  const g = new THREE.Group();
  const maceta = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.2, 0.46, 14), mMaceta); maceta.position.y = 0.23; maceta.castShadow = true; g.add(maceta);
  for (let i = 0; i < 9; i++) {
    const h = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.85 * alta, 5), mHoja); h.castShadow = true;
    const a = (i / 9) * Math.PI * 2; h.position.set(Math.cos(a) * 0.11, 0.46 + 0.38 * alta, Math.sin(a) * 0.11);
    h.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5); g.add(h);
  }
  return g;
}
function estante(color) {
  const g = new THREE.Group();
  const cuerpo = caja3(1.4, 1.9, 0.4, mat(0x2a1d4f, { roughness: 0.5 })); cuerpo.position.y = 0.95; g.add(cuerpo);
  for (let f = 0; f < 4; f++) for (let k = 0; k < 6; k++) {
    if (azar() < 0.25) continue;
    const libro = caja3(0.14, 0.3 + azar() * 0.08, 0.3, mat(azar() < 0.4 ? color : [0xffffff, 0x7fd1ff, 0xffb03b][k % 3], { roughness: 0.6 }), false);
    libro.position.set(-0.55 + k * 0.2, 0.32 + f * 0.45, 0.06); g.add(libro);
  }
  return g;
}

// ---------- personajes ----------
const cargador = new GLTFLoader();
const MODELOS = { H: "modelos/H_Suit.glb", M: "modelos/M_Suit.glb" };
const cargados = {};
const TINTES = {
  H: { traje: ["Suit"], camisa: ["White"], corbata: ["Tie"], piel: ["Skin"], pelo: ["Hair", "Eyebrows"] },
  M: { traje: ["Black"], camisa: ["White"], piel: ["Skin"], pelo: ["Hair_Brown", "Hair_Blond", "Brown"] },
};
const EJE_X = new THREE.Vector3(), EJE_Y = new THREE.Vector3(0, 1, 0), ADELANTE = new THREE.Vector3();
const q = new THREE.Quaternion(), qp = new THREE.Quaternion(), qb = new THREE.Quaternion(), qm = new THREE.Quaternion(), vtmp = new THREE.Vector3();
function girar(h, eje, ang) {
  h.parent.getWorldQuaternion(qp); h.getWorldQuaternion(qb);
  q.setFromAxisAngle(eje, ang); qb.premultiply(q); h.quaternion.copy(qp.invert().multiply(qb)); h.updateMatrixWorld(true);
}
function crearPersonaje(def) {
  const base = cargados[def.modelo];
  const m = clonarEsqueleto(base.scene);
  const huesos = {};
  m.traverse((o) => {
    if (o.isBone) huesos[o.name] = o;
    if (o.isMesh) {
      o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false;
      const cambiar = (mt) => {
        const n = mt.clone();
        for (const [parte, nombres] of Object.entries(TINTES[def.modelo])) if (nombres.includes(mt.name) && def[parte] != null) n.color.setHex(def[parte]);
        n.roughness = Math.min(n.roughness ?? 0.6, 0.7);
        return n;
      };
      o.material = Array.isArray(o.material) ? o.material.map(cambiar) : cambiar(o.material);
    }
  });
  m.updateMatrixWorld(true);
  const mPelo = mat(def.pelo, { roughness: 0.8 });
  const cabeza = new THREE.Vector3(); huesos.Head.getWorldPosition(cabeza);
  if (def.rizos === "corto") {   // como en su foto: rizos negros arriba
    const g = new THREE.Group();
    for (let i = 0; i < 30; i++) {
      const a = azar() * Math.PI * 2, r = Math.sqrt(azar()) * 0.12;
      const b = bola(0.042 + azar() * 0.018, mPelo); b.position.set(Math.cos(a) * r, 0.2 + azar() * 0.035 - r * 0.35, Math.sin(a) * r * 0.95 + 0.02); g.add(b);
    }
    for (let i = 0; i < 6; i++) { const b = bola(0.038, mPelo); b.position.set(-0.1 + i * 0.04, 0.16, 0.12); g.add(b); }
    g.position.copy(cabeza); m.add(g); huesos.Head.attach(g);
  }
  if (def.rizos === "largo") {   // como en su foto: rizos negros hasta la cintura, raya al medio
    const g = new THREE.Group();
    for (let col = 0; col < 7; col++) {
      const x = -0.15 + col * 0.05;
      for (let k = 0; k < 11; k++) {
        const b = bola(0.05 + azar() * 0.012, mPelo);
        b.position.set(x + Math.sin(k * 1.7 + col) * 0.018, 0.12 - k * 0.062, -0.1 - Math.abs(x) * 0.15 + Math.cos(k * 1.3 + col) * 0.015); g.add(b);
      }
    }
    for (const s of [-1, 1]) for (let k = 0; k < 9; k++) {
      const b = bola(0.045, mPelo); b.position.set(s * (0.13 + Math.sin(k * 1.4) * 0.015), 0.1 - k * 0.06, 0.02 + (k > 3 ? 0.05 : 0)); g.add(b);
    }
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; const b = bola(0.05, mPelo); b.position.set(Math.cos(a) * 0.12, 0.19, Math.sin(a) * 0.11 - 0.01); g.add(b); }
    g.position.copy(cabeza); m.add(g); huesos.Head.attach(g);
  }
  if (def.reloj) {
    const r = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.012, 6, 14), mat(0xdfe3ea, { metalness: 1, roughness: 0.15 }));
    const w = new THREE.Vector3(); huesos.WristL.getWorldPosition(w); r.position.copy(w); r.rotation.x = Math.PI / 2; m.add(r); huesos.WristL.attach(r);
  }
  const mezclador = new THREE.AnimationMixer(m);
  const acciones = {};
  for (const clip of base.animations) acciones[clip.name] = mezclador.clipAction(clip);
  const quieta = acciones.Idle_Neutral || acciones.Idle;
  quieta.play(); mezclador.update(0);
  // pose de brazos de referencia (brazos abajo): la animación de respirar a veces los sube
  const brazos = ["UpperArmL", "LowerArmL", "UpperArmR", "LowerArmR"].map((n) => [huesos[n], huesos[n].quaternion.clone()]);
  quieta.time = azar() * 3;
  return { m, huesos, mezclador, acciones, quieta, brazos, saludando: 0 };
}
// sentados y tecleando: se giran los huesos encima de la animación de respirar
function sentar(p, t) {
  const per = p.per; if (!per) return;
  per.m.getWorldQuaternion(qm); EJE_X.set(1, 0, 0).applyQuaternion(qm); ADELANTE.set(0, 0, 1).applyQuaternion(qm);
  const h = per.huesos, w = p.estado === "trabajando" && !quieto, fase = p.fase;
  if (per.saludando <= 0) { for (const [b, qr] of per.brazos) b.quaternion.copy(qr); per.brazos[0][0].parent.updateMatrixWorld(true); per.brazos[2][0].parent.updateMatrixWorld(true); }
  for (const s of ["L", "R"]) {
    girar(h["UpperLeg" + s], EJE_X, 1.5708); girar(h["LowerLeg" + s], EJE_X, -1.5708);
    h["LowerLeg" + s].getWorldPosition(vtmp); vtmp.y -= 0.46; vtmp.addScaledVector(ADELANTE, 0.08);
    h["Foot" + s].position.copy(h["Foot" + s].parent.worldToLocal(vtmp)); h["Foot" + s].updateMatrixWorld(true);
    if (per.saludando > 0) continue;
    const k = s === "L" ? 0 : 2.1;
    girar(h["UpperArm" + s], EJE_X, w ? 0.28 + Math.sin(t * 13 + k + fase) * 0.035 : 0.12);
    girar(h["LowerArm" + s], EJE_X, w ? 1.25 + Math.sin(t * 17 + k * 1.7 + fase) * 0.07 : 0.95);
  }
  girar(h.Head, EJE_Y, quieto ? 0 : w ? Math.sin(t * 1.5 + fase) * 0.1 : Math.sin(t * 0.45 + fase) * 0.45);
  if (w) girar(h.Head, EJE_X, 0.12);
}

// ---------- un puesto: escritorio con portátil, silla y su oficinista ----------
function puesto({ color, director = false, planta = false }) {
  const g = new THREE.Group();
  const tabla = caja3(1.5, 0.06, 0.72, mMesa); tabla.position.set(0, 0.76, 0.78); g.add(tabla);
  for (const [x, z] of [[-0.68, 0.48], [0.68, 0.48], [-0.68, 1.08], [0.68, 1.08]]) { const l = caja3(0.05, 0.74, 0.05, mPata); l.position.set(x, 0.37, z); g.add(l); }
  const pv = pantallaViva(color);
  const base = caja3(0.44, 0.02, 0.3, mOscuro); base.position.set(0, 0.8, 0.68); g.add(base);
  const tapa = new THREE.Group(); tapa.position.set(0, 0.81, 0.83); tapa.rotation.x = 0.25; g.add(tapa);
  const lomo = caja3(0.44, 0.28, 0.015, mOscuro); lomo.position.y = 0.14; tapa.add(lomo);
  const pantalla = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.25), new THREE.MeshBasicMaterial({ map: pv.t, toneMapped: false }));
  pantalla.position.set(0, 0.14, -0.009); pantalla.rotation.y = Math.PI; tapa.add(pantalla);
  const taza = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.11, 12), mat(color)); taza.position.set(-0.55, 0.84, 0.62); taza.castShadow = true; g.add(taza);
  for (let i = 0; i < 3; i++) { const hoja = caja3(0.22, 0.004, 0.3, mat(0xffffff), false); hoja.position.set(0.5, 0.795 + i * 0.005, 0.95); hoja.rotation.y = 0.2 + i * 0.15; g.add(hoja); }
  if (planta) { const p = mata(0.45); p.scale.setScalar(0.55); p.position.set(-0.55, 0.79, 1.0); g.add(p); }
  if (director) {
    const t = textura(128, 96, (c, w, h) => {
      c.fillStyle = "#111"; c.fillRect(0, 0, w, h); c.fillStyle = "#fff";
      for (let x = -20; x < w; x += 28) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 14, 0); c.lineTo(x + 30, 26); c.lineTo(x + 16, 26); c.fill(); }
      c.font = "bold 18px sans-serif"; c.fillText("CLIPS", 14, 56); c.fillText("TOWER", 14, 82);
    });
    const claq = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.02, 0.23), [mOscuro, mOscuro, new THREE.MeshBasicMaterial({ map: t }), mOscuro, mOscuro, mOscuro]);
    claq.position.set(0.45, 0.8, 0.66); claq.rotation.y = -0.3; g.add(claq);
    const madera = mat(0x8a5a35, { roughness: 0.5 }), lona = mat(0x111118);
    for (const [x, z] of [[-0.3, -0.24], [0.3, -0.24], [-0.3, 0.24], [0.3, 0.24]]) { const p = caja3(0.05, 0.5, 0.05, madera); p.position.set(x, 0.25, z); g.add(p); }
    for (const x of [-0.32, 0.32]) {
      const b = caja3(0.07, 0.04, 0.58, madera); b.position.set(x, 0.72, 0); g.add(b);
      const palo = caja3(0.045, 0.75, 0.045, madera); palo.position.set(x, 0.86, -0.28); g.add(palo);
    }
    const asiento = caja3(0.6, 0.04, 0.52, lona); asiento.position.set(0, 0.48, 0); g.add(asiento);
    const letreroTex = textura(512, 160, (c, w, h) => { c.fillStyle = "#111118"; c.fillRect(0, 0, w, h); c.fillStyle = "#fff"; c.font = "92px 'Bebas Neue', Impact, sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("DIRECTOR", w / 2, h / 2 + 4); });
    const cara = new THREE.MeshBasicMaterial({ map: letreroTex });
    const espaldar = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.24, 0.025), [lona, lona, lona, lona, cara, cara]);
    espaldar.position.set(0, 1.1, -0.29); g.add(espaldar);
  } else {
    const asiento = caja3(0.56, 0.08, 0.54, mSilla); asiento.position.set(0, 0.47, 0); g.add(asiento);
    const respaldo = caja3(0.56, 0.62, 0.08, mSilla); respaldo.position.set(0, 0.86, -0.29); respaldo.rotation.x = -0.08; g.add(respaldo);
    const poste = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.4, 8), mPata); poste.position.y = 0.23; g.add(poste);
    for (let i = 0; i < 5; i++) { const pata = caja3(0.04, 0.03, 0.3, mPata); pata.position.set(Math.sin((i / 5) * 6.28) * 0.14, 0.03, Math.cos((i / 5) * 6.28) * 0.14); pata.rotation.y = (i / 5) * 6.28; g.add(pata); }
  }
  return { g, pv, estado: "libre", fase: azar() * 6 };
}

const EQUIPO = {
  radar:      { modelo: "H", traje: 0x2e3a5c, corbata: 0xffb000, piel: 0xf1c27d, pelo: 0x1b1b1b },
  nicho:      { modelo: "M", traje: 0x2c3a66, piel: 0x8d5524, pelo: 0x1b1b1b },
  cortador:   { modelo: "M", traje: 0x5a2340, piel: 0x8d5524, pelo: 0x141414 },
  copywriter: { modelo: "M", traje: 0xa8744a, piel: 0xffdbac, pelo: 0x8a3f1d },
  editor:     { modelo: "H", traje: 0x3b3b46, corbata: 0xff3d8b, piel: 0xc68642, pelo: 0x2a1a12 },
  revisor:    { modelo: "M", traje: 0x2a2440, piel: 0xe0ac69, pelo: 0x4a2c1a },
  publicador: { modelo: "H", traje: 0x4a3b6b, corbata: 0x8a5cff, piel: 0xffdbac, pelo: 0xb8862f },
  analista:   { modelo: "H", traje: 0x1f4a52, corbata: 0x20b8d0, piel: 0xe0ac69, pelo: 0x6b3e26 },
  // los jefes: pelo y piel como en sus fotos, ropa de oficina
  director:   { modelo: "H", traje: 0x161a2e, corbata: 0xd8262f, camisa: 0xffffff, piel: 0xb07a52, pelo: 0x0e0a08, rizos: "corto", reloj: true },
  admin:      { modelo: "M", traje: 0x111116, camisa: 0xfdf6ee, piel: 0xd4a07a, pelo: 0x150d0a, rizos: "largo" },
};

// nombres que se ven en las placas
const NOMBRES = { radar: "Radar", nicho: "Nicho", cortador: "Cortador", copywriter: "Copywriter", editor: "Editor", revisor: "Revisor",
  publicador: "Publicador", analista: "Analista", director: "Andrés", admin: "Yareidys" };

// ---------- los pisos ----------
const puestos = {}, pisos = [];
const ventanaTex = textura(256, 128, (g, w, h) => {
  const d = g.createLinearGradient(0, 0, 0, h); d.addColorStop(0, "#2e1058"); d.addColorStop(0.6, "#c2386e"); d.addColorStop(1, "#ff9a4f");
  g.fillStyle = d; g.fillRect(0, 0, w, h);
  g.fillStyle = "rgba(20,6,40,.85)";
  for (let x = 0; x < w; x += 18) { const alto = 20 + ((x * 7) % 50); g.fillRect(x, h - alto, 14, alto); }
});
let jefePantalla, jefeTex, jefeLienzo;
PISOS.forEach((info, i) => {
  const y = yPiso(i), color = new THREE.Color(info.color), esJefe = info.id === "direccion";
  const piso = new THREE.Group(); piso.position.y = y; escena.add(piso);
  // losa, alfombra, paredes de atrás
  const losa = caja3(W, LOSA, D, mat(0x24123f, { roughness: 0.5 })); losa.position.y = -LOSA / 2; piso.add(losa);
  const alfombra = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.3, D - 0.3), mat(new THREE.Color(info.color).lerp(new THREE.Color(0x1a0d33), esJefe ? 0.72 : 0.84), { roughness: 0.9 }));
  alfombra.rotation.x = -Math.PI / 2; alfombra.position.y = 0.005; alfombra.receiveShadow = true; piso.add(alfombra);
  const mPared = mat(new THREE.Color(info.color).lerp(new THREE.Color(0x2a1650), 0.78), { roughness: 0.8 });
  const atras = caja3(W, H - LOSA, 0.14, mPared); atras.position.set(0, (H - LOSA) / 2, -D / 2 + 0.07); piso.add(atras);
  const izq = caja3(0.14, H - LOSA, D, mPared); izq.position.set(-W / 2 + 0.07, (H - LOSA) / 2, 0); piso.add(izq);
  // ventana panorámica con la ciudad al atardecer en la pared izquierda
  const ventana = new THREE.Mesh(new THREE.PlaneGeometry(D - 1.4, 1.2), new THREE.MeshBasicMaterial({ map: ventanaTex }));
  ventana.rotation.y = Math.PI / 2; ventana.position.set(-W / 2 + 0.15, 1.6, 0.2); piso.add(ventana);
  // bordes de neón del color del piso (los dos lados abiertos)
  const mBorde = neon(color, 2);
  const b1 = caja3(W, 0.06, 0.06, mBorde, false); b1.position.set(0, 0, D / 2); piso.add(b1);
  const b2 = caja3(0.06, 0.06, D, mBorde, false); b2.position.set(W / 2, 0, 0); piso.add(b2);
  // luz del techo: se prende fuerte cuando alguien del piso trabaja
  const mTecho = neon(color, 0.5);
  const techo = caja3(W * 0.55, 0.05, 0.3, mTecho, false); techo.position.set(0, H - LOSA - 0.04, -0.3); piso.add(techo);
  const luz = new THREE.PointLight(color, 4, 8, 2); luz.position.set(0.5, H - 0.6, 0.4); piso.add(luz);
  // decoración
  const m1 = mata(1.1); m1.position.set(-W / 2 + 0.6, 0, -D / 2 + 0.6); piso.add(m1);
  if (i === 0 || i === 3) { const e = estante(info.color); e.position.set(W / 2 - 1.4, 0, -D / 2 + 0.35); piso.add(e); }
  // pantalla de pared: muestra lo que hace el piso
  const pv = pantallaViva(info.color, 320, 180);
  if (!esJefe) {
    const marco = caja3(1.9, 1.1, 0.06, mOscuro); marco.position.set(-0.6, 1.65, -D / 2 + 0.17); piso.add(marco);
    const tv = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.0), new THREE.MeshBasicMaterial({ map: pv.t, toneMapped: false })); tv.position.set(-0.6, 1.65, -D / 2 + 0.205); piso.add(tv);
  } else {
    // pantalla grande del Director con el video que espera su OK
    jefeLienzo = document.createElement("canvas"); jefeLienzo.width = 512; jefeLienzo.height = 300;
    jefeTex = new THREE.CanvasTexture(jefeLienzo); jefeTex.colorSpace = THREE.SRGBColorSpace;
    jefePantalla = new THREE.Group();
    const marco = caja3(3.5, 1.75, 0.08, mOscuro); jefePantalla.add(marco);
    const frente = new THREE.Mesh(new THREE.PlaneGeometry(2.45, 1.6), new THREE.MeshBasicMaterial({ map: jefeTex, toneMapped: false })); frente.position.set(-0.47, 0, 0.045); jefePantalla.add(frente);
    const video = new THREE.Mesh(new THREE.PlaneGeometry(0.88, 1.56), new THREE.MeshBasicMaterial({ color: 0x1a1233, toneMapped: false })); video.position.set(1.24, 0, 0.045); video.name = "video"; jefePantalla.add(video);
    jefePantalla.position.set(-0.3, 1.5, -D / 2 + 0.2); piso.add(jefePantalla);
    const alfombraRoja = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.4), mat(0x8a1238, { roughness: 0.9 })); alfombraRoja.rotation.x = -Math.PI / 2; alfombraRoja.position.set(0.2, 0.01, 0.7); alfombraRoja.receiveShadow = true; piso.add(alfombraRoja);
  }
  // los dos puestos del piso, mirando hacia la cámara
  const sitios = [[-1.5, 0.75], [1.45, -0.55]];
  info.agentes.forEach((id, k) => {
    const p = puesto({ color: info.color, director: id === "director", planta: id === "admin" });
    p.g.position.set(sitios[k][0], 0, sitios[k][1]); p.g.rotation.y = Math.PI / 4;
    p.def = EQUIPO[id]; p.piso = i; piso.add(p.g); puestos[id] = p;
  });
  // placa del piso (HTML), unida a la torre con una línea
  const ancla = new THREE.Object3D(); ancla.position.set(-W / 2, H * 0.55, D / 2); piso.add(ancla);
  const el = document.createElement("div"); el.className = "placa" + (esJefe ? " jefe" : "");
  el.style.setProperty("--c", info.color);
  const caras = info.agentes.map((id) => `<i style="--fondo-cara:#${new THREE.Color(EQUIPO[id].traje).lerp(new THREE.Color(info.color), 0.55).getHexString()}" title="${NOMBRES[id]}">${NOMBRES[id][0]}</i>`).join("");
  el.innerHTML = `<div class="num">${String(i + 1).padStart(2, "0")}</div><div class="cuerpo"><div class="fila"><div class="nombre">${info.nombre}</div><span class="caras">${caras}</span></div>`
    + `<span class="que">${esJefe ? "Andrés y Yareidys" : "En espera"}</span>`
    + (esJefe ? `<span class="ir">Ver en tu mesa →</span>` : "") + `</div><span class="guia"></span>`;
  if (esJefe) el.addEventListener("click", () => { location.hash = "director"; });
  capa.appendChild(el);
  pisos.push({ info, piso, mTecho, luz, pv, el, ancla, esJefe });
});

// techo de la torre con letrero de neón y antena
const TECHO = ALTO;
{
  const azotea = caja3(W, LOSA, D, mat(0x24123f, { roughness: 0.5 })); azotea.position.y = TECHO - LOSA / 2; escena.add(azotea);
  const borde = caja3(W + 0.1, 0.07, 0.07, neon(0xffb03b, 2.4), false); borde.position.set(0, TECHO, D / 2); escena.add(borde);
  const borde2 = caja3(0.07, 0.07, D + 0.1, neon(0xffb03b, 2.4), false); borde2.position.set(W / 2, TECHO, 0); escena.add(borde2);
  const t = textura(1024, 220, (g, w, h) => {
    g.font = "900 104px Unbounded, Impact, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
    g.shadowColor = "#ff4f8b"; g.shadowBlur = 26; g.fillStyle = "#ffe0ec"; g.fillText("CLIPS TOWER", w / 2, h / 2 + 8);
  });
  const letrero = new THREE.Group();
  for (const giro of [0, Math.PI]) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 1.4), new THREE.MeshBasicMaterial({ map: t, transparent: true, toneMapped: false, color: new THREE.Color(1.5, 1.2, 1.35), depthWrite: false }));
    p.rotation.y = giro; p.position.z = giro ? -0.01 : 0.01; letrero.add(p);
  }
  for (const x of [-2.6, 2.6]) { const poste = caja3(0.08, 1.2, 0.08, mat(0x2a1f48, { metalness: 0.6, roughness: 0.3 })); poste.position.set(x, -0.9, 0); letrero.add(poste); }
  letrero.position.set(-0.4, TECHO + 1.4, -0.6); letrero.rotation.y = Math.PI / 4; escena.add(letrero);
  const antena = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 2.4, 6), mPata); antena.position.set(-W / 2 + 0.8, TECHO + 1.2, -D / 2 + 0.8); escena.add(antena);
}
const foquito = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 0.4, 0.6), toneMapped: false }));
foquito.position.set(-W / 2 + 0.8, TECHO + 2.45, -D / 2 + 0.8); escena.add(foquito);

// ---------- ascensor de vidrio por fuera, a la derecha ----------
const XA = W / 2 + 0.75, ZA = -D / 2 + 0.75;
{
  const tubo = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, TECHO - 0.1, 24, 1, true),
    new THREE.MeshPhysicalMaterial({ color: 0xc9b8ff, transparent: true, opacity: 0.14, roughness: 0.05, side: THREE.DoubleSide, depthWrite: false }));
  tubo.position.set(XA, TECHO / 2 + 0.05, ZA); escena.add(tubo);
  for (const a of [0, 2.1, 4.2]) { const r = caja3(0.05, TECHO, 0.05, mPata, false); r.position.set(XA + Math.cos(a) * 0.62, TECHO / 2, ZA + Math.sin(a) * 0.62); escena.add(r); }
}
const cabina = new THREE.Group(); cabina.position.set(XA, yPiso(0) + 0.05, ZA); escena.add(cabina);
const mCabina = neon(0xffd23f, 0.6);
{
  const piso = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.08, 20), mat(0x2a1f48)); cabina.add(piso);
  const anillo = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.04, 6, 30), mCabina); anillo.rotation.x = Math.PI / 2; anillo.position.y = 1.9; cabina.add(anillo);
  const anillo2 = anillo.clone(); anillo2.position.y = 0.05; cabina.add(anillo2);
}
const carga = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.36, 0.36), neon(0xffd23f, 3)); carga.position.y = 0.3; carga.visible = false; cabina.add(carga);
const viajes = [];
let viaje = null;

// ---------- pantalla del Director ----------
const videoEl = Object.assign(document.createElement("video"), { muted: true, loop: true, playsInline: true, crossOrigin: "anonymous" });
let videoTex = null;
function pintarJefe(n, gancho, streamer) {
  const g = jefeLienzo.getContext("2d"), w = 512, h = 300;
  const d = g.createLinearGradient(0, 0, w, h); d.addColorStop(0, "#5b1a7a"); d.addColorStop(1, "#d6336c");
  g.fillStyle = d; g.fillRect(0, 0, w, h);
  g.fillStyle = n ? "#ffd23f" : "#3ddc97"; g.beginPath(); g.roundRect(22, 22, n ? 214 : 196, 44, 12); g.fill();
  g.fillStyle = "#1a0612"; g.font = "bold 24px sans-serif"; g.fillText(n ? "ESPERA TU OK" : "TODO AL DÍA ✓", 38, 52);
  g.fillStyle = "#fff"; g.font = "44px 'Bebas Neue', Impact, sans-serif";
  const palabras = (n ? gancho || "Video listo" : "Sin videos pendientes").toUpperCase().split(" ");
  let linea = "", y = 122;
  for (const p of palabras) { if (g.measureText(linea + p).width > w - 50) { g.fillText(linea, 24, y); y += 46; linea = ""; } linea += p + " "; }
  g.fillText(linea, 24, y);
  g.fillStyle = "#f3e6ff"; g.font = "22px sans-serif";
  g.fillText(n ? `${streamer || ""}${n > 1 ? `  ·  +${n - 1} más` : ""}` : "El equipo sigue buscando clips", 24, h - 26);
  jefeTex.needsUpdate = true;
}
pintarJefe(0);

// ---------- cargar a los oficinistas ----------
Promise.all(Object.entries(MODELOS).map(async ([k, url]) => { cargados[k] = await cargador.loadAsync(url); }))
  .then(() => {
    for (const p of Object.values(puestos)) { p.per = crearPersonaje(p.def); p.per.m.position.y = -0.36; p.g.add(p.per.m); }
    aviso?.remove();
  })
  .catch(() => { aviso.textContent = "No pude cargar a los oficinistas. Recarga la página."; });

// ---------- lo que la página puede pedir ----------
const tareas = {};
let pendientes = 0;
function pintarPiso(pz) {
  const ids = pz.info.agentes;
  pz.el.querySelectorAll(".caras i").forEach((d, k) => {
    const e = puestos[ids[k]]?.estado;
    d.className = e === "trabajando" ? "on" : e === "error" ? "mal" : "";
  });
  if (pz.esJefe) return;
  const que = pz.el.querySelector(".que");
  const malo = ids.find((id) => puestos[id]?.estado === "error");
  const activo = ids.find((id) => puestos[id]?.estado === "trabajando");
  pz.el.classList.toggle("falla", !!malo && !activo);
  pz.el.classList.toggle("activa", !!activo);
  if (activo) que.innerHTML = `<b>${NOMBRES[activo]}</b> · ${tareas[activo] || "trabajando"}`;
  else que.textContent = malo ? `${NOMBRES[malo]} tuvo un error` : "En espera";
  que.title = que.textContent;
  pz.ancho = 0;
}
const api = {
  estado(id, estado, tarea, nombre) {
    const p = puestos[id]; if (!p) return;
    p.estado = estado; tareas[id] = estado === "libre" ? "" : (tarea || "trabajando").replace(/^./, (c) => c.toLowerCase());
    pintarPiso(pisos[p.piso]);
  },
  paquete(desde, hasta) {
    const a = puestos[desde], b = puestos[hasta]; if (!a || !b) return;
    viajes.push([a.piso, b.piso]);
  },
  jefe(n, clip = {}) {
    const dir = puestos.director;
    if (n > pendientes && dir.per && !quieto && dir.per.acciones.Wave) {   // llegó un video nuevo: el Director saluda
      dir.per.acciones.Wave.reset().setLoop(THREE.LoopOnce, 1).play(); dir.per.saludando = 2.6;
    }
    pendientes = n;
    dir.estado = n ? "trabajando" : "libre"; puestos.admin.estado = n ? "trabajando" : "libre";
    const pz = pisos[dir.piso];
    pz.el.classList.toggle("pendiente", n > 0);
    pz.el.querySelector(".que").textContent = n ? `${n} video${n > 1 ? "s" : ""} espera${n > 1 ? "n" : ""} tu OK` : "Andrés y Yareidys";
    pz.ancho = 0;
    pintarPiso(pz);
    pintarJefe(n, clip.gancho, clip.streamer);
    const pv = jefePantalla.getObjectByName("video");
    if (n && clip.url) {
      if (videoEl.src !== clip.url) { videoEl.src = clip.url; videoEl.play().catch(() => {}); }
      if (!videoTex) { videoTex = new THREE.VideoTexture(videoEl); videoTex.colorSpace = THREE.SRGBColorSpace; }
      pv.material.map = videoTex; pv.material.color.set(0xffffff);
    } else { videoEl.pause(); pv.material.map = null; pv.material.color.set(0x1a1233); }
    pv.material.needsUpdate = true;
  },
};
const cola = window.escena3d?.cola || [];
window.escena3d = api;
cola.forEach(([f, a]) => api[f](...a));

// ---------- brillo de neón ----------
const compositor = new EffectComposer(render);
compositor.addPass(new RenderPass(escena, camara));
const brillo = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.5, 0.35, 1.0);
compositor.addPass(brillo);
compositor.addPass(new OutputPass());

// ---------- cámara: entra volando, se mece y se puede girar con el dedo ----------
let giro = 0, dist = 30, Wp = 1, Hp = 1, arrastrando = false, x0 = 0, visible = true, entrada = quieto ? 1 : 0;
const lienzo = render.domElement;
lienzo.addEventListener("pointerdown", (e) => { arrastrando = true; x0 = e.clientX; lienzo.setPointerCapture(e.pointerId); document.getElementById("pista").style.opacity = 0; });
lienzo.addEventListener("pointermove", (e) => { if (!arrastrando) return; giro = Math.max(-0.75, Math.min(0.75, giro - (e.clientX - x0) * 0.006)); x0 = e.clientX; });
for (const n of ["pointerup", "pointercancel"]) lienzo.addEventListener(n, () => { arrastrando = false; });
function medir() {
  Wp = caja.clientWidth; Hp = caja.clientHeight; if (!Wp || !Hp) return;
  render.setSize(Wp, Hp, false); compositor.setSize(Wp, Hp); brillo.resolution.set(Wp / 2, Hp / 2);
  camara.aspect = Wp / Hp;
  camara.setViewOffset(Wp, Hp, -Wp * (Wp < 600 ? 0.12 : 0.04), 0, Wp, Hp);   // corre la torre a la derecha: deja sitio a los rótulos
  camara.updateProjectionMatrix();
  const t = Math.tan(THREE.MathUtils.degToRad(camara.fov / 2));
  dist = Math.max((TECHO + 5.5) / 2 / t, 5.6 / (t * camara.aspect));
}
new ResizeObserver(medir).observe(caja); medir();
new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(caja);

const reloj = new THREE.Clock(), v = new THREE.Vector3();
let ultimoPintado = 0;
const suave = (x) => 1 - Math.pow(1 - x, 3);
function cuadro() {
  requestAnimationFrame(cuadro);
  const dt = Math.min(reloj.getDelta(), 0.05), t = reloj.elapsedTime;
  if (!visible || document.hidden || !Wp) return;
  if (!arrastrando && !quieto) giro *= 0.995;
  entrada = Math.min(1, entrada + dt / 2.6);
  const e = suave(entrada);
  const ang = Math.PI / 4 + giro + (quieto ? 0 : Math.sin(t * 0.18) * 0.1) - (1 - e) * 0.9;
  const d = dist * (1 + (1 - e) * 0.7), alt = 0.2 + (1 - e) * 0.35;
  const centro = TECHO / 2 + 0.6;
  camara.position.set(Math.sin(ang) * Math.cos(alt) * d, centro + Math.sin(alt) * d, Math.cos(ang) * Math.cos(alt) * d);
  camara.lookAt(0, centro + 0.4, 0);
  sol.position.set(-Math.sin(ang) * 110, 14, -Math.cos(ang) * 110); sol.lookAt(camara.position.x, 14, camara.position.z);
  for (const pa of palmas) pa.visible = Math.hypot(pa.position.x - camara.position.x, pa.position.z - camara.position.z) > 24;
  foquito.visible = Math.sin(t * 3) > 0;

  const repintar = t - ultimoPintado > 0.2;
  if (repintar) ultimoPintado = t;
  for (const p of Object.values(puestos)) {
    if (p.per) {
      p.per.mezclador.update(dt);
      if (p.per.saludando > 0) { p.per.saludando -= dt; if (p.per.saludando <= 0) { p.per.acciones.Wave?.fadeOut(0.3); p.per.quieta.reset().fadeIn(0.3).play(); } }
      p.per.m.updateMatrixWorld(true);
      sentar(p, t);
    }
    if (repintar) pintarPantalla(p.pv, p.estado === "trabajando", p.estado === "error", t);
  }
  for (const pz of pisos) {
    const ids = pz.info.agentes, activo = ids.some((id) => puestos[id]?.estado === "trabajando");
    const objetivo = activo ? 2.4 + Math.sin(t * 3) * 0.3 : 0.45;
    pz.mTecho.emissiveIntensity += (objetivo - pz.mTecho.emissiveIntensity) * 0.08;
    pz.luz.intensity += ((activo ? 9 : 3) - pz.luz.intensity) * 0.08;
    if (repintar && !pz.esJefe) pintarPantalla(pz.pv, activo, false, t);
  }

  // el ascensor lleva el video de piso en piso
  if (!viaje && viajes.length) { const [a, b] = viajes.shift(); viaje = { a, b, t: 0 }; carga.visible = false; }
  if (viaje) {
    viaje.t += dt / 2.6;
    const k = Math.min(viaje.t, 1);
    const fase1 = Math.min(k / 0.35, 1), fase2 = Math.max(0, (k - 0.35) / 0.65);
    const yA = yPiso(viaje.a) + 0.05, yB = yPiso(viaje.b) + 0.05, y0 = cabina.position.y;
    cabina.position.y = fase2 > 0 ? THREE.MathUtils.lerp(yA, yB, suave(fase2)) : THREE.MathUtils.lerp(y0, yA, fase1 * 0.25);
    carga.visible = fase1 >= 1; carga.rotation.y += dt * 2;
    mCabina.emissiveIntensity = 2.6;
    if (k >= 1) { viaje = null; carga.visible = false; }
  } else mCabina.emissiveIntensity += (0.6 - mCabina.emissiveIntensity) * 0.05;

  compositor.render();
  for (const pz of pisos) {
    pz.ancla.getWorldPosition(v); v.project(camara);
    pz.ancho ||= pz.el.offsetWidth;
    const x = Math.max(8, (v.x * 0.5 + 0.5) * Wp - pz.ancho - 22), y = (-v.y * 0.5 + 0.5) * Hp;
    pz.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(0, -50%)`;
    pz.el.style.opacity = entrada < 0.85 ? 0 : 1;
  }
}
cuadro();
