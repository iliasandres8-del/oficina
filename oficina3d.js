// Oficina 3D de Leonida Clips: escenario redondo con los agentes en sus puestos y, en el centro,
// el Director (Andrés) y la Administradora. Personajes: Quaternius, Ultimate Modular Men/Women (CC0).
// La página le habla con window.escena3d (estado, paquete, jefe, admin).
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone as clonarEsqueleto } from "three/addons/utils/SkeletonUtils.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

const SALAS = window.SALAS;
const caja = document.querySelector(".escena-caja");
const capa = document.getElementById("rotulos");
const aviso = document.getElementById("cargando3d");
const quieto = matchMedia("(prefers-reduced-motion: reduce)").matches;
const celular = innerWidth < 900;

let render;
try {
  render = new THREE.WebGLRenderer({ antialias: !celular, powerPreference: "high-performance" });
} catch {
  aviso.textContent = "Este navegador no pudo dibujar la oficina en 3D.";
  throw new Error("sin WebGL");
}
render.setPixelRatio(Math.min(devicePixelRatio, celular ? 1.5 : 1.75));
render.toneMapping = THREE.ACESFilmicToneMapping;
render.toneMappingExposure = 0.95;
render.shadowMap.enabled = true;
render.shadowMap.type = THREE.PCFSoftShadowMap;
caja.prepend(render.domElement);

const escena = new THREE.Scene();
escena.fog = new THREE.Fog(0x3a1452, 36, 100);
const pmrem = new THREE.PMREMGenerator(render);
escena.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
escena.environmentIntensity = 0.18;
const camara = new THREE.PerspectiveCamera(38, 1, 0.1, 260);

// ---------- ayudantes ----------
let semilla = 7;
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
function redondo(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }

// ---------- luces ----------
escena.add(new THREE.HemisphereLight(0xffc6e0, 0x2a0d4a, 0.75));
const luzSol = new THREE.DirectionalLight(0xffc29a, 1.9);
luzSol.position.set(-9, 16, -7); luzSol.castShadow = true;
luzSol.shadow.mapSize.set(celular ? 1024 : 2048, celular ? 1024 : 2048);
Object.assign(luzSol.shadow.camera, { left: -13, right: 13, top: 13, bottom: -13, near: 1, far: 45 });
luzSol.shadow.bias = -0.0004; luzSol.shadow.normalBias = 0.02;
escena.add(luzSol);
const relleno = new THREE.DirectionalLight(0xa58bff, 0.8); relleno.position.set(10, 8, 12); escena.add(relleno);
const luzHolo = new THREE.PointLight(0xff4f8b, 10, 12, 2); luzHolo.position.set(0, 5, 0); escena.add(luzHolo);

// ---------- cielo de atardecer, sol a rayas, estrellas y palmeras ----------
escena.add(new THREE.Mesh(new THREE.SphereGeometry(120, 32, 16), new THREE.MeshBasicMaterial({
  side: THREE.BackSide, fog: false, map: textura(4, 512, (g, w, h) => {
    const d = g.createLinearGradient(0, 0, 0, h);
    d.addColorStop(0, "#0e0522"); d.addColorStop(0.28, "#33115e"); d.addColorStop(0.42, "#a42c6a");
    d.addColorStop(0.495, "#ff9a4f"); d.addColorStop(0.52, "#3a1452"); d.addColorStop(1, "#10051c");
    g.fillStyle = d; g.fillRect(0, 0, w, h);
  }),
})));
const sol = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshBasicMaterial({
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
  const n = 450, p = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const a = azar() * Math.PI * 2, e = 0.25 + azar() * 1.2;
    p.set([Math.cos(a) * Math.cos(e) * 110, Math.sin(e) * 110, Math.sin(a) * Math.cos(e) * 110], i * 3);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(p, 3));
  escena.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 0.45, fog: false, transparent: true, opacity: 0.8 })));
}
const mPalma = mat(0x1e0a36, { emissive: 0x13051f });
function palma(alto) {
  const g = new THREE.Group(), curva = 0.05 + azar() * 0.08;
  let x = 0, y = 0;
  for (let i = 0; i < 7; i++) {
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.2 - i * 0.012, 0.24 - i * 0.012, alto / 7 + 0.05, 6), mPalma);
    x += curva * i * 0.35; s.position.set(x, y + alto / 14, 0); s.rotation.z = -curva * i * 0.5; g.add(s); y += alto / 7;
  }
  for (let i = 0; i < 9; i++) {
    const piv = new THREE.Group(); piv.position.set(x, y, 0); piv.rotation.y = (i / 9) * Math.PI * 2 + azar() * 0.3;
    const hoja = new THREE.Mesh(new THREE.ConeGeometry(0.42, 3.6, 4), mPalma);
    hoja.scale.z = 0.22; hoja.rotation.x = Math.PI / 2 + 0.55 + azar() * 0.25; hoja.position.set(0, -0.5, 1.6);
    piv.add(hoja); g.add(piv);
  }
  return g;
}
const palmas = [];
for (let i = 0; i < 14; i++) {
  const a = (i / 14) * Math.PI * 2 + azar() * 0.3, r = 16 + azar() * 12;
  const p = palma(6 + azar() * 5); p.position.set(Math.cos(a) * r, 0, Math.sin(a) * r); p.rotation.y = azar() * 6; escena.add(p); palmas.push(p);
}

// ---------- el escenario redondo ----------
const R = 11;
{
  const t = textura(1024, 1024, (g, w) => {
    const c = w / 2, d = g.createRadialGradient(c, c, 0, c, c, c);
    d.addColorStop(0, "#4a2078"); d.addColorStop(0.7, "#251048"); d.addColorStop(1, "#170830");
    g.fillStyle = d; g.fillRect(0, 0, w, w);
    g.strokeStyle = "rgba(255,120,170,.22)"; g.lineWidth = 2;
    for (let r = 70; r < c; r += 70) { g.beginPath(); g.arc(c, c, r, 0, 7); g.stroke(); }
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2; g.beginPath();
      g.moveTo(c + Math.cos(a) * 140, c + Math.sin(a) * 140); g.lineTo(c + Math.cos(a) * c, c + Math.sin(a) * c); g.stroke();
    }
  });
  const piso = new THREE.Mesh(new THREE.CircleGeometry(R, 72), new THREE.MeshStandardMaterial({ map: t, roughness: 0.32, metalness: 0.15 }));
  piso.rotation.x = -Math.PI / 2; piso.receiveShadow = true; escena.add(piso);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(R, R - 0.8, 1.4, 72), mat(0x1a0a30)); base.position.y = -0.71; escena.add(base);
  const borde = new THREE.Mesh(new THREE.TorusGeometry(R, 0.07, 8, 140), neon(0xff4f8b, 2)); borde.rotation.x = Math.PI / 2; borde.position.y = 0.04; escena.add(borde);
  const pasamanos = borde.clone(); pasamanos.position.y = 1.15; escena.add(pasamanos);
  const vidrio = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 1.15, 72, 1, true),
    new THREE.MeshPhysicalMaterial({ color: 0xff8cc0, transparent: true, opacity: 0.12, roughness: 0.05, side: THREE.DoubleSide, depthWrite: false }));
  vidrio.position.y = 0.58; escena.add(vidrio);
  const mPoste = mat(0xd8c8ff, { metalness: 0.8, roughness: 0.25 }), gPoste = new THREE.CylinderGeometry(0.03, 0.03, 1.15, 6);
  for (let i = 0; i < 44; i++) {
    const a = (i / 44) * Math.PI * 2, p = new THREE.Mesh(gPoste, mPoste);
    p.position.set(Math.cos(a) * R, 0.58, Math.sin(a) * R); escena.add(p);
  }
}

// podio del centro
[[3.6, 0x2a1050, 0xff4f8b], [2.8, 0x361565, 0xffd23f]].forEach(([r, c, n], i) => {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.25, 64), mat(c, { roughness: 0.25, metalness: 0.3 }));
  m.position.y = 0.125 + i * 0.25; m.receiveShadow = true; m.castShadow = true; escena.add(m);
  const t = new THREE.Mesh(new THREE.TorusGeometry(r, 0.045, 6, 90), neon(n, 2)); t.rotation.x = Math.PI / 2; t.position.y = (i + 1) * 0.25; escena.add(t);
});

// holograma con el logo
const holo = new THREE.Group(); holo.position.y = 6.2; escena.add(holo);
const lienzoLogo = document.createElement("canvas"); lienzoLogo.width = lienzoLogo.height = 512;
const logoTex = new THREE.CanvasTexture(lienzoLogo); logoTex.colorSpace = THREE.SRGBColorSpace;
{
  const img = new Image();
  img.onload = () => { lienzoLogo.getContext("2d").drawImage(img, 0, 0, 512, 512); logoTex.needsUpdate = true; };
  img.src = "logo.svg";
  holo.add(new THREE.Mesh(new THREE.PlaneGeometry(3.1, 3.1), new THREE.MeshBasicMaterial({ map: logoTex, transparent: true, side: THREE.DoubleSide, fog: false })));
  for (const [r, y, c] of [[2.2, -1.9, 0xff4f8b], [1.7, 1.9, 0xffd23f]]) {
    const a = new THREE.Mesh(new THREE.TorusGeometry(r, 0.03, 6, 72), neon(c, 3)); a.rotation.x = Math.PI / 2; a.position.y = y; holo.add(a);
  }
}

// letrero de neón LEONIDA CLIPS, de dos caras, al fondo del escenario
{
  const t = textura(1024, 200, (g, w, h) => {
    g.font = "120px Anton, Impact, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
    g.shadowColor = "#ff4f8b"; g.shadowBlur = 24; g.fillStyle = "#ffd6e6"; g.fillText("LEONIDA CLIPS", w / 2, h / 2 + 6);
  });
  const letrero = new THREE.Group();
  for (const giro of [0, Math.PI]) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 1.4), new THREE.MeshBasicMaterial({ map: t, transparent: true, toneMapped: false, color: new THREE.Color(1.5, 1.2, 1.35), depthWrite: false }));
    p.rotation.y = giro; p.position.z = giro ? -0.01 : 0.01; letrero.add(p);
  }
  for (const x of [-3.2, 3.2]) { const poste = caja3(0.08, 2.6, 0.08, mat(0x2a1f48, { metalness: 0.6, roughness: 0.3 })); poste.position.set(x, -1.2, 0); letrero.add(poste); }
  letrero.position.set(0, 2.5, -R + 0.6); escena.add(letrero);
}

// ---------- pantallas animadas ----------
function pantallaViva(color) {
  const c = document.createElement("canvas"); c.width = 256; c.height = 150;
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return { c, g: c.getContext("2d"), t, color, avance: azar() };
}
function pintarPantalla(p, trabajando, error, t) {
  const { g, c } = p, W = c.width, H = c.height;
  g.fillStyle = "#120a26"; g.fillRect(0, 0, W, H);
  g.fillStyle = error ? "#ff3355" : p.color; g.fillRect(0, 0, W, 16);
  g.fillStyle = "rgba(255,255,255,.85)"; g.font = "bold 11px sans-serif"; g.fillText(error ? "ERROR" : trabajando ? "TRABAJANDO" : "EN ESPERA", 8, 12);
  // miniatura de video vertical
  g.fillStyle = "#2a1d4f"; g.fillRect(10, 24, 54, 96);
  if (trabajando) { g.fillStyle = p.color; g.globalAlpha = 0.35 + 0.25 * Math.sin(t * 3); g.fillRect(10, 24, 54, 96); g.globalAlpha = 1; }
  g.fillStyle = "#fff"; g.beginPath(); g.moveTo(30, 60); g.lineTo(30, 84); g.lineTo(48, 72); g.fill();
  // renglones de texto
  for (let i = 0; i < 6; i++) {
    const ancho = 60 + ((i * 37 + Math.floor(t * (trabajando ? 2 : 0))) % 5) * 22;
    g.fillStyle = i === 0 ? p.color : "rgba(255,255,255,.35)"; g.fillRect(76, 28 + i * 14, ancho, 6);
  }
  // barra de avance
  if (trabajando) p.avance = (p.avance + 0.02) % 1;
  g.fillStyle = "rgba(255,255,255,.15)"; g.fillRect(10, 130, W - 20, 8);
  g.fillStyle = p.color; g.fillRect(10, 130, (W - 20) * (trabajando ? p.avance : 0.15), 8);
  p.t.needsUpdate = true;
}

// pantalla grande del Director: el video que espera su OK
const jefeLienzo = document.createElement("canvas"); jefeLienzo.width = 512; jefeLienzo.height = 320;
const jefeTex = new THREE.CanvasTexture(jefeLienzo); jefeTex.colorSpace = THREE.SRGBColorSpace;
let videoTex = null;
const videoEl = Object.assign(document.createElement("video"), { muted: true, loop: true, playsInline: true, crossOrigin: "anonymous" });
const jefePantalla = new THREE.Group();
{
  const marco = caja3(4.1, 2.5, 0.12, mat(0x15101f, { metalness: 0.6, roughness: 0.3 })); jefePantalla.add(marco);
  const frente = new THREE.Mesh(new THREE.PlaneGeometry(2.7, 2.3), new THREE.MeshBasicMaterial({ map: jefeTex, toneMapped: false }));
  frente.position.set(-0.62, 0, 0.065); jefePantalla.add(frente);
  const video = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 2.13), new THREE.MeshBasicMaterial({ color: 0x1a1233, toneMapped: false }));
  video.position.set(1.37, 0, 0.065); video.name = "video"; jefePantalla.add(video);
  const atras = new THREE.Mesh(new THREE.PlaneGeometry(4.0, 2.4), new THREE.MeshBasicMaterial({ map: logoTex }));
  atras.rotation.y = Math.PI; atras.position.z = -0.065; jefePantalla.add(atras);
  for (const x of [-1.6, 1.6]) { const pata = caja3(0.1, 1.6, 0.1, mat(0x2a1f48, { metalness: 0.6 })); pata.position.set(x, -1.9, 0); jefePantalla.add(pata); }
  jefePantalla.position.set(0, 2.9, -1.7); jefePantalla.scale.setScalar(1.15);
  escena.add(jefePantalla);
}
function pintarJefe(n, gancho, streamer) {
  const g = jefeLienzo.getContext("2d"), W = 512, H = 320;
  const d = g.createLinearGradient(0, 0, W, H); d.addColorStop(0, "#5b1a7a"); d.addColorStop(1, "#d6336c");
  g.fillStyle = d; g.fillRect(0, 0, W, H);
  g.fillStyle = n ? "#ffd23f" : "#3ddc97"; redondo(g, 22, 22, n ? 210 : 190, 44, 12); g.fill();
  g.fillStyle = "#1a0612"; g.font = "bold 24px sans-serif"; g.fillText(n ? "ESPERA TU OK" : "TODO AL DÍA ✓", 38, 52);
  g.fillStyle = "#fff"; g.font = "bold 34px Anton, Impact, sans-serif";
  const texto = (n ? gancho || "Video listo" : "Sin videos pendientes").toUpperCase();
  const palabras = texto.split(" "); let linea = "", y = 120;
  for (const p of palabras) { if (g.measureText(linea + p).width > W - 50) { g.fillText(linea, 24, y); y += 42; linea = ""; } linea += p + " "; }
  g.fillText(linea, 24, y);
  g.fillStyle = "#c9bff0"; g.font = "22px sans-serif";
  g.fillText(n ? `${streamer || ""}${n > 1 ? `  ·  +${n - 1} más` : ""}` : "Los agentes siguen buscando clips", 24, H - 30);
  jefeTex.needsUpdate = true;
}
pintarJefe(0);

// ---------- muebles y cosas ----------
const mMesa = mat(0xcfc6e6, { roughness: 0.5 }), mPata = mat(0xb9aedc, { metalness: 0.7, roughness: 0.3 }), mOscuro = mat(0x15101f, { roughness: 0.3, metalness: 0.4 }), mSilla = mat(0x2a1f48, { roughness: 0.5 });
const mHoja = mat(0x2fbf71, { roughness: 0.7 }), mMaceta = mat(0xf2e8ff, { roughness: 0.4 });
function mata(alta = 1) {
  const g = new THREE.Group();
  const maceta = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.22, 0.5, 14), mMaceta); maceta.position.y = 0.25; maceta.castShadow = true; g.add(maceta);
  for (let i = 0; i < 9; i++) {
    const h = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.9 * alta, 5), mHoja); h.castShadow = true;
    const a = (i / 9) * Math.PI * 2; h.position.set(Math.cos(a) * 0.12, 0.5 + 0.4 * alta, Math.sin(a) * 0.12);
    h.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5); g.add(h);
  }
  return g;
}
for (let i = 0; i < 8; i++) {
  const a = Math.PI * (-7 / 8) + (i * Math.PI) / 4 + Math.PI / 8, m = mata(0.9 + azar() * 0.5);
  m.position.set(Math.cos(a) * 9.9, 0, Math.sin(a) * 9.9); escena.add(m);
}
function lampara() {
  const g = new THREE.Group();
  const poste = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.2, 6), mPata); poste.position.y = 1.1; g.add(poste);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 0.05, 16), mOscuro); base.position.y = 0.03; g.add(base);
  const foco = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 1.6, 1.1), toneMapped: false })); foco.position.y = 2.25; g.add(foco);
  return g;
}
for (const a of [Math.PI * 0.5 - 0.4, Math.PI * 0.5 + 0.4]) { const l = lampara(); l.position.set(Math.cos(a) * 9.6, 0, Math.sin(a) * 9.6); escena.add(l); }

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
  // rizos cortos arriba (Director) o rizos largos hasta la cintura (Administradora), pegados al hueso de la cabeza
  if (def.rizos === "corto") {
    const g = new THREE.Group();
    for (let i = 0; i < 30; i++) {
      const a = azar() * Math.PI * 2, r = Math.sqrt(azar()) * 0.12;
      const b = bola(0.042 + azar() * 0.018, mPelo); b.position.set(Math.cos(a) * r, 0.2 + azar() * 0.035 - r * 0.35, Math.sin(a) * r * 0.95 + 0.02); g.add(b);
    }
    for (let i = 0; i < 6; i++) { const b = bola(0.038, mPelo); b.position.set(-0.1 + i * 0.04, 0.16, 0.12); g.add(b); }
    g.position.copy(cabeza); m.add(g); huesos.Head.attach(g);
  }
  if (def.rizos === "largo") {
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
  quieta.play(); quieta.time = azar() * 3;
  return { m, huesos, mezclador, acciones, quieta, saludando: 0 };
}

function sentar(p, t) {
  const per = p.per; if (!per) return;
  per.m.getWorldQuaternion(qm); EJE_X.set(1, 0, 0).applyQuaternion(qm); ADELANTE.set(0, 0, 1).applyQuaternion(qm);
  const h = per.huesos, w = p.estado === "trabajando" && !quieto, fase = p.fase;
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

// ---------- puestos de trabajo ----------
function puesto({ linea, director = false, planta = false, portatil = false }) {
  const g = new THREE.Group();
  const disco = new THREE.Mesh(new THREE.CircleGeometry(1.45, 40), new THREE.MeshBasicMaterial({ color: linea, transparent: true, opacity: 0.1, depthWrite: false }));
  disco.rotation.x = -Math.PI / 2; disco.position.y = 0.015; g.add(disco);
  const aro = new THREE.Mesh(new THREE.RingGeometry(1.4, 1.48, 56), new THREE.MeshBasicMaterial({ color: new THREE.Color(linea).multiplyScalar(1.3), transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }));
  aro.rotation.x = -Math.PI / 2; aro.position.y = 0.02; g.add(aro);
  const tabla = caja3(1.5, 0.06, 0.72, mMesa); tabla.position.set(0, 0.76, 0.78); g.add(tabla);
  for (const [x, z] of [[-0.68, 0.48], [0.68, 0.48], [-0.68, 1.08], [0.68, 1.08]]) { const l = caja3(0.05, 0.74, 0.05, mPata); l.position.set(x, 0.37, z); g.add(l); }
  const pv = pantallaViva(linea);
  const pantalla = new THREE.Mesh(new THREE.PlaneGeometry(portatil ? 0.4 : 0.78, portatil ? 0.25 : 0.45), new THREE.MeshBasicMaterial({ map: director ? logoTex : pv.t, toneMapped: false }));
  if (portatil) {
    // portátil bajito para que se le vea la cara al jefe
    const base = caja3(0.44, 0.02, 0.3, mOscuro); base.position.set(0, 0.8, 0.68); g.add(base);
    const tapa = new THREE.Group(); tapa.position.set(0, 0.81, 0.83); tapa.rotation.x = 0.25; g.add(tapa);
    const lomo = caja3(0.44, 0.28, 0.015, mOscuro); lomo.position.y = 0.14; tapa.add(lomo);
    pantalla.position.set(0, 0.14, -0.009); pantalla.rotation.y = Math.PI; tapa.add(pantalla);
  } else {
    const marco = caja3(0.86, 0.52, 0.05, mOscuro); marco.position.set(0, 1.2, 1.0); g.add(marco);
    const pie = caja3(0.06, 0.18, 0.06, mOscuro); pie.position.set(0, 0.88, 1.02); g.add(pie);
    pantalla.position.set(0, 1.2, 0.973); pantalla.rotation.y = Math.PI; g.add(pantalla);
  }
  if (!portatil) { const teclado = caja3(0.5, 0.025, 0.16, mat(0x2a1f48), false); teclado.position.set(0, 0.8, 0.58); g.add(teclado); }
  const raton = caja3(0.06, 0.025, 0.1, mat(0x2a1f48), false); raton.position.set(0.38, 0.8, 0.6); g.add(raton);
  const taza = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.11, 12), mat(linea)); taza.position.set(-0.55, 0.84, 0.62); taza.castShadow = true; g.add(taza);
  for (let i = 0; i < 3; i++) { const hoja = caja3(0.22, 0.004, 0.3, mat(0xffffff), false); hoja.position.set(0.5, 0.795 + i * 0.005, 0.95); hoja.rotation.y = 0.2 + i * 0.15; g.add(hoja); }
  if (planta) { const p = mata(0.45); p.scale.setScalar(0.55); p.position.set(-0.55, 0.79, 1.0); g.add(p); }
  if (director) {
    const t = textura(128, 96, (c, w, h) => {
      c.fillStyle = "#111"; c.fillRect(0, 0, w, h); c.fillStyle = "#fff";
      for (let x = -20; x < w; x += 28) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 14, 0); c.lineTo(x + 30, 26); c.lineTo(x + 16, 26); c.fill(); }
      c.font = "bold 18px sans-serif"; c.fillText("LEONIDA", 14, 56); c.fillText("TOMA 1", 14, 82);
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
    const letreroTex = textura(512, 160, (c, w, h) => { c.fillStyle = "#111118"; c.fillRect(0, 0, w, h); c.fillStyle = "#fff"; c.font = "92px Anton, Impact, sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("DIRECTOR", w / 2, h / 2 + 4); });
    const caraLetrero = new THREE.MeshBasicMaterial({ map: letreroTex });
    const espaldar = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.24, 0.025), [lona, lona, lona, lona, caraLetrero, caraLetrero]);
    espaldar.position.set(0, 1.1, -0.29); g.add(espaldar);
  } else {
    const asiento = caja3(0.56, 0.08, 0.54, mSilla); asiento.position.set(0, 0.47, 0); g.add(asiento);
    const respaldo = caja3(0.56, 0.62, 0.08, mSilla); respaldo.position.set(0, 0.86, -0.29); respaldo.rotation.x = -0.08; g.add(respaldo);
    const poste = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.4, 8), mPata); poste.position.y = 0.23; g.add(poste);
    for (let i = 0; i < 5; i++) { const pata = caja3(0.04, 0.03, 0.3, mPata); pata.position.set(Math.sin((i / 5) * 6.28) * 0.14, 0.03, Math.cos((i / 5) * 6.28) * 0.14); pata.rotation.y = (i / 5) * 6.28; g.add(pata); }
  }
  const ancla = new THREE.Object3D(); ancla.position.set(0, 2.1, 0); g.add(ancla);
  return { g, pantalla, pv, aro, ancla, linea: new THREE.Color(linea), estado: "libre", fase: azar() * 6 };
}

const EQUIPO = {
  radar:      { modelo: "H", traje: 0x2e3a5c, corbata: 0xffb000, piel: 0xf1c27d, pelo: 0x1b1b1b },
  cortador:   { modelo: "M", traje: 0x5a2340, piel: 0x8d5524, pelo: 0x141414 },
  copywriter: { modelo: "M", traje: 0xa8744a, piel: 0xffdbac, pelo: 0x8a3f1d },
  editor:     { modelo: "H", traje: 0x3b3b46, corbata: 0xff3d8b, piel: 0xc68642, pelo: 0x2a1a12 },
  revisor:    { modelo: "M", traje: 0x2a2440, piel: 0xe0ac69, pelo: 0x4a2c1a },
  publicador: { modelo: "H", traje: 0x4a3b6b, corbata: 0x8a5cff, piel: 0xffdbac, pelo: 0xb8862f },
  biblioteca: { modelo: "M", traje: 0x2c3a66, piel: 0x8d5524, pelo: 0x1b1b1b },
  analista:   { modelo: "H", traje: 0x1f4a52, corbata: 0x20b8d0, piel: 0xe0ac69, pelo: 0x6b3e26 },
};
const puestos = {};
Object.keys(SALAS).forEach((id, i) => {
  const a = Math.PI * (-7 / 8) + (i * Math.PI) / 4, r = 7.5;
  const p = puesto({ linea: SALAS[id].linea });
  p.g.position.set(Math.cos(a) * r, 0, Math.sin(a) * r); p.g.lookAt(0, 0, 0);
  p.def = EQUIPO[id]; escena.add(p.g); puestos[id] = p;
});
// los jefes, en el podio (pelo y piel como en sus fotos; ropa de oficina)
const director = puesto({ linea: "#ffd23f", director: true, portatil: true });
director.def = { modelo: "H", traje: 0x161a2e, corbata: 0xd8262f, camisa: 0xffffff, piel: 0xb07a52, pelo: 0x0e0a08, rizos: "corto", reloj: true };
director.g.position.set(-1.35, 0.5, 0.45); director.g.rotation.y = 0.12; escena.add(director.g); puestos.director = director;
const admin = puesto({ linea: "#ffd23f", planta: true, portatil: true });
admin.def = { modelo: "M", traje: 0x111116, camisa: 0xfdf6ee, piel: 0xd4a07a, pelo: 0x150d0a, rizos: "largo" };
admin.g.position.set(1.35, 0.5, 0.45); admin.g.rotation.y = -0.12; escena.add(admin.g); puestos.admin = admin;
director.ax = -70; admin.ax = -30; director.ancla.position.y = admin.ancla.position.y = 1.9;

Promise.all(Object.entries(MODELOS).map(async ([k, url]) => { cargados[k] = await cargador.loadAsync(url); }))
  .then(() => {
    for (const p of Object.values(puestos)) {
      p.per = crearPersonaje(p.def);
      p.per.m.position.y = -0.36; p.g.add(p.per.m);
    }
    aviso?.remove();
  })
  .catch(() => { aviso.textContent = "No pude cargar a los personajes. Recarga la página."; });

// ---------- rótulos (HTML que sigue a cada puesto) ----------
const rotulos = [];
function rotulo(p, icono, texto, clase = "") {
  const el = document.createElement("div"); el.className = "rotulo " + clase;
  el.style.setProperty("--c", "#" + p.linea.getHexString());
  el.innerHTML = `<span class="burbuja"></span><span class="chip3"><i></i><span class="ico"></span><span class="nom"></span></span>`;
  el.querySelector(".ico").textContent = icono; el.querySelector(".nom").textContent = texto; capa.appendChild(el);
  p.el = el; rotulos.push(p);
}
for (const [id, s] of Object.entries(SALAS)) rotulo(puestos[id], s.icono, id[0].toUpperCase() + id.slice(1));
rotulo(director, "⭐", "Andrés · Director", "jefe");
rotulo(admin, "💼", "Administradora", "jefe admin");

// ---------- paquetes que viajan entre puestos ----------
const paquetes = [];
const mPaquete = neon(0xffd23f, 4), gPaquete = new THREE.BoxGeometry(0.3, 0.3, 0.3);
const donde = (id) => { const p = puestos[id]; if (!p) return null; const v = new THREE.Vector3(); p.g.getWorldPosition(v); v.y += 1.6; return v; };

// ---------- lo que la página puede pedir ----------
let pendientes = 0;
const api = {
  estado(id, estado, tarea, nombre) {
    const p = puestos[id]; if (!p) return;
    p.estado = estado;
    p.el.classList.toggle("trabajando", estado === "trabajando");
    p.el.classList.toggle("error", estado === "error");
    p.el.querySelector(".burbuja").textContent = estado === "libre" ? "" : tarea || "";
    if (nombre) p.el.querySelector(".nom").textContent = nombre;
  },
  paquete(desde, hasta) {
    const a = donde(desde), b = donde(hasta); if (!a || !b) return;
    const m = new THREE.Mesh(gPaquete, mPaquete); m.position.copy(a); escena.add(m);
    paquetes.push({ m, a, b, t: 0 });
  },
  jefe(n, clip = {}) {
    if (n > pendientes && director.per && !quieto) {   // llegó un video nuevo: el Director saluda
      const w = director.per.acciones.Wave;
      if (w) { w.reset().setLoop(THREE.LoopOnce, 1).play(); director.per.saludando = 2.6; }
    }
    pendientes = n;
    director.estado = n ? "trabajando" : "libre";
    director.el.classList.toggle("trabajando", n > 0);
    director.el.querySelector(".burbuja").textContent = n ? `Tengo ${n} video${n > 1 ? "s" : ""} por aprobar` : "";
    pintarJefe(n, clip.gancho, clip.streamer);
    const pantallaVideo = jefePantalla.getObjectByName("video");
    if (n && clip.url) {
      if (videoEl.src !== clip.url) { videoEl.src = clip.url; videoEl.play().catch(() => {}); }
      if (!videoTex) { videoTex = new THREE.VideoTexture(videoEl); videoTex.colorSpace = THREE.SRGBColorSpace; }
      pantallaVideo.material.map = videoTex; pantallaVideo.material.color.set(0xffffff);
    } else {
      videoEl.pause(); pantallaVideo.material.map = null; pantallaVideo.material.color.set(0x1a1233);
    }
    pantallaVideo.material.needsUpdate = true;
  },
  admin(texto) {
    admin.estado = "trabajando"; admin.el.classList.add("trabajando");
    admin.el.querySelector(".burbuja").textContent = texto;
  },
};
const cola = window.escena3d?.cola || [];
window.escena3d = api;
cola.forEach(([f, a]) => api[f](...a));

// ---------- posproceso: brillo de neón ----------
const compositor = new EffectComposer(render);
compositor.addPass(new RenderPass(escena, camara));
const brillo = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.5, 0.35, 1.0);
compositor.addPass(brillo);
compositor.addPass(new OutputPass());

// ---------- cámara: entrada al abrir, gira sola y se puede arrastrar ----------
let ang = 0.35, dist = 26, W = 1, H = 1, arrastrando = false, x0 = 0, visible = true, entrada = quieto ? 1 : 0;
const lienzo = render.domElement;
lienzo.addEventListener("pointerdown", (e) => { arrastrando = true; x0 = e.clientX; lienzo.setPointerCapture(e.pointerId); });
lienzo.addEventListener("pointermove", (e) => { if (!arrastrando) return; ang -= (e.clientX - x0) * 0.008; x0 = e.clientX; });
for (const n of ["pointerup", "pointercancel"]) lienzo.addEventListener(n, () => { arrastrando = false; });
function medir() {
  W = caja.clientWidth; H = caja.clientHeight;
  render.setSize(W, H, false); compositor.setSize(W, H);
  brillo.resolution.set(W / 2, H / 2);
  camara.aspect = W / H; camara.updateProjectionMatrix();
  const t = Math.tan(THREE.MathUtils.degToRad(camara.fov / 2));
  dist = Math.max((camara.aspect < 1 ? 7.6 : 9.6) / (t * camara.aspect), 7.8 / t);
}
new ResizeObserver(medir).observe(caja); medir();
new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(caja);

const reloj = new THREE.Clock(), v = new THREE.Vector3();
let ultimoPintado = 0;
const suave = (x) => 1 - Math.pow(1 - x, 3);
function cuadro() {
  requestAnimationFrame(cuadro);
  const dt = Math.min(reloj.getDelta(), 0.05), t = reloj.elapsedTime;
  if (!visible || document.hidden) return;
  if (!arrastrando && !quieto) ang += dt * 0.06;
  entrada = Math.min(1, entrada + dt / 2.8);
  const e = suave(entrada), d = dist * (1 + (1 - e) * 0.9), fi = 1.13 - (1 - e) * 0.35, a = ang - (1 - e) * 1.2;
  camara.position.set(Math.sin(a) * Math.sin(fi) * d, Math.cos(fi) * d + 1, Math.cos(a) * Math.sin(fi) * d);
  camara.lookAt(0, 2.1, 0);
  sol.position.set(-Math.sin(a) * 95, 12, -Math.cos(a) * 95); sol.lookAt(camara.position.x, 12, camara.position.z);
  for (const pa of palmas) pa.visible = Math.hypot(pa.position.x - camara.position.x, pa.position.z - camara.position.z) > 16;

  const repintar = t - ultimoPintado > 0.2;
  if (repintar) ultimoPintado = t;
  for (const p of Object.values(puestos)) {
    if (p.per) {
      p.per.mezclador.update(dt);
      if (p.per.saludando > 0) { p.per.saludando -= dt; if (p.per.saludando <= 0) { p.per.acciones.Wave?.fadeOut(0.3); p.per.quieta.reset().fadeIn(0.3).play(); } }
      p.per.m.updateMatrixWorld(true);
      sentar(p, t);
    }
    p.aro.material.opacity = p.estado === "libre" ? 0.35 : 0.75 + Math.sin(t * 4 + p.fase) * 0.2;
    if (repintar && p.pv && p !== director) pintarPantalla(p.pv, p.estado === "trabajando", p.estado === "error", t);
  }
  if (!quieto) { holo.rotation.y += dt * 0.6; holo.position.y = 6.2 + Math.sin(t * 1.3) * 0.15; }

  for (let i = paquetes.length - 1; i >= 0; i--) {
    const k = paquetes[i]; k.t += dt / 1.4;
    k.m.position.lerpVectors(k.a, k.b, Math.min(k.t, 1)); k.m.position.y += Math.sin(Math.PI * Math.min(k.t, 1)) * 2.5;
    k.m.rotation.x += dt * 4; k.m.rotation.y += dt * 3;
    if (k.t >= 1) { escena.remove(k.m); paquetes.splice(i, 1); }
  }

  compositor.render();
  for (const p of rotulos) {
    p.ancla.getWorldPosition(v); v.project(camara);
    const x = Math.min(Math.max((v.x * 0.5 + 0.5) * W, 74), W - 74), y = (-v.y * 0.5 + 0.5) * H;
    p.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(${p.ax ?? -50}%, -100%)`;
    p.el.style.zIndex = Math.round((1 - v.z) * 10000);
    p.el.style.opacity = entrada < 0.85 ? 0 : 1;
  }
}
cuadro();
