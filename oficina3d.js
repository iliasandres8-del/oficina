// Oficina 3D: escenario redondo con los agentes en sus puestos y, en el centro,
// el Director (Andrés) y la Administradora. La página le habla con window.escena3d.
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const SALAS = window.SALAS;
const caja = document.querySelector(".escena-caja");
const capa = document.getElementById("rotulos");
const quieto = matchMedia("(prefers-reduced-motion: reduce)").matches;

let render;
try {
  render = new THREE.WebGLRenderer({ antialias: true, powerPreference: "low-power" });
} catch {
  document.getElementById("cargando3d").textContent = "Este navegador no pudo dibujar la oficina en 3D.";
  throw new Error("sin WebGL");
}
render.setPixelRatio(Math.min(devicePixelRatio, 1.75));
caja.prepend(render.domElement);
document.getElementById("cargando3d")?.remove();

const escena = new THREE.Scene();
escena.fog = new THREE.Fog(0x3a1452, 34, 95);
const camara = new THREE.PerspectiveCamera(38, 1, 0.1, 260);

// ---------- ayudantes ----------
let semilla = 7;
const azar = () => ((semilla = (semilla * 16807) % 2147483647) / 2147483647);
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...extra });
const neon = (color, fuerza = 1.6) => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: fuerza });
const caja3 = (w, h, d, m) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
const ESFERA = new THREE.SphereGeometry(1, 14, 10);
const bola = (r, m) => { const b = new THREE.Mesh(ESFERA, m); b.scale.setScalar(r); return b; };
function textura(w, h, dibujar) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  dibujar(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// ---------- luces ----------
escena.add(new THREE.HemisphereLight(0xffc6e0, 0x2a0d4a, 1.5));
const luzSol = new THREE.DirectionalLight(0xffb27a, 1.7); luzSol.position.set(-8, 14, -10); escena.add(luzSol);
const relleno = new THREE.DirectionalLight(0xa58bff, 0.7); relleno.position.set(10, 8, 12); escena.add(relleno);
const luzHolo = new THREE.PointLight(0xff4f8b, 25, 14, 2); luzHolo.position.set(0, 5, 0); escena.add(luzHolo);

// ---------- cielo de atardecer, sol a rayas, estrellas y palmeras ----------
escena.add(new THREE.Mesh(new THREE.SphereGeometry(120, 32, 16), new THREE.MeshBasicMaterial({
  side: THREE.BackSide, fog: false, map: textura(4, 512, (g, w, h) => {
    const d = g.createLinearGradient(0, 0, 0, h);
    d.addColorStop(0, "#120628"); d.addColorStop(0.28, "#3a1366"); d.addColorStop(0.43, "#b8306f");
    d.addColorStop(0.495, "#ff9a4f"); d.addColorStop(0.52, "#3a1452"); d.addColorStop(1, "#10051c");
    g.fillStyle = d; g.fillRect(0, 0, w, h);
  }),
})));
const sol = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshBasicMaterial({
  transparent: true, fog: false, depthWrite: false, map: textura(512, 512, (g, w, h) => {
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
  const a = (i / 14) * Math.PI * 2 + azar() * 0.3, r = 15 + azar() * 12;
  const p = palma(6 + azar() * 5); p.position.set(Math.cos(a) * r, 0, Math.sin(a) * r); p.rotation.y = azar() * 6; escena.add(p); palmas.push(p);
}

// ---------- el escenario redondo ----------
const R = 11;
{
  const t = textura(1024, 1024, (g, w) => {
    const c = w / 2, d = g.createRadialGradient(c, c, 0, c, c, c);
    d.addColorStop(0, "#3d1868"); d.addColorStop(0.7, "#200c40"); d.addColorStop(1, "#15072c");
    g.fillStyle = d; g.fillRect(0, 0, w, w);
    g.strokeStyle = "rgba(255,120,170,.2)"; g.lineWidth = 2;
    for (let r = 70; r < c; r += 70) { g.beginPath(); g.arc(c, c, r, 0, 7); g.stroke(); }
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2; g.beginPath();
      g.moveTo(c + Math.cos(a) * 140, c + Math.sin(a) * 140); g.lineTo(c + Math.cos(a) * c, c + Math.sin(a) * c); g.stroke();
    }
  });
  const piso = new THREE.Mesh(new THREE.CircleGeometry(R, 72), mat(0xffffff, { map: t, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.3, roughness: 0.35 }));
  piso.rotation.x = -Math.PI / 2; escena.add(piso);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(R, R - 0.8, 1.4, 72), mat(0x1a0a30)); base.position.y = -0.71; escena.add(base);
  const borde = new THREE.Mesh(new THREE.TorusGeometry(R, 0.08, 8, 120), neon(0xff4f8b, 2)); borde.rotation.x = Math.PI / 2; borde.position.y = 0.04; escena.add(borde);
  const pasamanos = borde.clone(); pasamanos.position.y = 1.15; escena.add(pasamanos);
  const vidrio = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 1.15, 72, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xff6aa8, transparent: true, opacity: 0.09, side: THREE.DoubleSide, depthWrite: false }));
  vidrio.position.y = 0.58; escena.add(vidrio);
  const mPoste = neon(0xff86b8, 0.8), gPoste = new THREE.CylinderGeometry(0.03, 0.03, 1.15, 4);
  for (let i = 0; i < 44; i++) {
    const a = (i / 44) * Math.PI * 2, p = new THREE.Mesh(gPoste, mPoste);
    p.position.set(Math.cos(a) * R, 0.58, Math.sin(a) * R); escena.add(p);
  }
}

// podio del centro
const podio = new THREE.Group(); escena.add(podio);
[[3.5, 0x2a1050, 0xff4f8b], [2.7, 0x361565, 0xffd23f]].forEach(([r, c, n], i) => {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.25, 56), mat(c, { roughness: 0.3 })); m.position.y = 0.125 + i * 0.25; podio.add(m);
  const t = new THREE.Mesh(new THREE.TorusGeometry(r, 0.05, 6, 80), neon(n, 1.8)); t.rotation.x = Math.PI / 2; t.position.y = (i + 1) * 0.25; podio.add(t);
});

// holograma con el logo
const holo = new THREE.Group(); holo.position.y = 5.6; escena.add(holo);
const lienzoLogo = document.createElement("canvas"); lienzoLogo.width = lienzoLogo.height = 512;
const logoTex = new THREE.CanvasTexture(lienzoLogo); logoTex.colorSpace = THREE.SRGBColorSpace;
{
  const img = new Image();
  img.onload = () => { lienzoLogo.getContext("2d").drawImage(img, 0, 0, 512, 512); logoTex.needsUpdate = true; };
  img.src = "logo.svg";
  const cartel = new THREE.Mesh(new THREE.PlaneGeometry(3.1, 3.1), new THREE.MeshBasicMaterial({ map: logoTex, transparent: true, opacity: 0.95, side: THREE.DoubleSide, fog: false }));
  holo.add(cartel);
  for (const [r, y, c] of [[2.2, -1.9, 0xff4f8b], [1.7, 1.9, 0xffd23f]]) {
    const a = new THREE.Mesh(new THREE.TorusGeometry(r, 0.035, 6, 64), neon(c, 2.2)); a.rotation.x = Math.PI / 2; a.position.y = y; holo.add(a);
  }
  const haz = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 0.6, 2.4, 40, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xff6aa8, transparent: true, opacity: 0.08, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
  haz.position.y = -3.1; holo.add(haz);
}

// ---------- texturas pequeñas ----------
const solPecho = textura(128, 128, (g) => {
  g.fillStyle = "#d8262f"; g.translate(64, 64);
  for (let i = 0; i < 14; i++) { g.rotate((Math.PI * 2) / 14); g.beginPath(); g.moveTo(-9, 22); g.lineTo(0, 60); g.lineTo(9, 22); g.fill(); }
  g.beginPath(); g.arc(0, 0, 28, 0, 7); g.fill();
});
const letrero = (texto, fondo, color) => textura(512, 160, (g, w, h) => {
  g.fillStyle = fondo; g.fillRect(0, 0, w, h);
  g.fillStyle = color; g.font = "bold 92px Anton, Impact, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText(texto, w / 2, h / 2 + 4);
});
const claquetaTex = textura(128, 96, (g, w, h) => {
  g.fillStyle = "#111"; g.fillRect(0, 0, w, h);
  g.fillStyle = "#fff"; for (let x = -20; x < w; x += 28) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 14, 0); g.lineTo(x + 30, 26); g.lineTo(x + 16, 26); g.fill(); }
  g.font = "bold 18px sans-serif"; g.fillText("LEONIDA", 14, 56); g.fillText("TOMA 1", 14, 82);
});

// ---------- los muñecos ----------
function persona(o) {
  const { piel, pelo, peinado = "corto", ropa, mangaLarga = false, pantalon = 0x23263a, zapatos = 0x2a2a35 } = o;
  const g = new THREE.Group();
  const mPiel = mat(piel), mPelo = mat(pelo, { roughness: 0.85 }), mRopa = mat(o.saco ?? ropa), mPan = mat(pantalon), mZap = mat(zapatos);
  for (const s of [-1, 1]) {
    const muslo = caja3(0.2, 0.18, 0.52, mPan); muslo.position.set(s * 0.12, 0.62, 0.2); g.add(muslo);
    const pierna = caja3(0.19, 0.5, 0.19, mPan); pierna.position.set(s * 0.12, 0.34, 0.44); g.add(pierna);
    const zap = caja3(0.21, 0.12, 0.32, mZap); zap.position.set(s * 0.12, 0.06, 0.5); g.add(zap);
  }
  const torso = new THREE.Group(); torso.position.y = 0.66; g.add(torso);
  const cuerpo = new THREE.Mesh(new THREE.CapsuleGeometry(0.27, 0.36, 6, 14), mRopa); cuerpo.position.y = 0.38; cuerpo.scale.z = 0.78; torso.add(cuerpo);
  if (o.saco) {
    const pecho = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.3), mat(ropa)); pecho.position.set(0, 0.56, 0.216); torso.add(pecho);
    for (const s of [-1, 1]) { const solapa = caja3(0.06, 0.26, 0.02, mat(new THREE.Color(o.saco).multiplyScalar(0.7))); solapa.position.set(s * 0.1, 0.57, 0.222); solapa.rotation.z = s * 0.35; torso.add(solapa); }
    for (const y of [0.36, 0.26]) { const b = bola(0.018, mat(0x111111)); b.position.set(0, y, 0.218); torso.add(b); }
  }
  for (const s of [-1, 1]) { const cuello = caja3(0.1, 0.05, 0.03, mat(ropa)); cuello.position.set(s * 0.05, 0.76, 0.19); cuello.rotation.z = s * -0.5; torso.add(cuello); }
  if (o.corbata) { const c = caja3(0.07, 0.3, 0.03, mat(o.corbata)); c.position.set(0, 0.5, 0.225); torso.add(c); }
  if (o.sol) { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.17, 0.17), new THREE.MeshBasicMaterial({ map: solPecho, transparent: true })); p.position.set(0.02, 0.58, 0.217); torso.add(p); }
  if (o.hebilla) {
    const h = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.02, 6, 16), mat(0xd9b45a, { metalness: 0.8, roughness: 0.25 }));
    h.position.set(0, 0.62, 0.224); torso.add(h);
  }
  const brazos = [];
  for (const s of [-1, 1]) {
    const hombro = new THREE.Group(); hombro.position.set(s * 0.3, 0.62, 0); torso.add(hombro);
    const dir = new THREE.Vector3(-s * 0.14, -0.34, 0.58).normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    const brazo = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.46, 4, 8), mangaLarga || o.saco ? mRopa : mPiel);
    brazo.quaternion.copy(q); brazo.position.copy(dir).multiplyScalar(0.31); hombro.add(brazo);
    if (!mangaLarga && !o.saco) { const manga = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.12, 4, 8), mRopa); manga.quaternion.copy(q); manga.position.copy(dir).multiplyScalar(0.08); hombro.add(manga); }
    const mano = bola(0.085, mPiel); mano.position.copy(dir).multiplyScalar(0.63); hombro.add(mano);
    if (o.reloj && s === 1) {
      const r = new THREE.Mesh(new THREE.TorusGeometry(0.083, 0.026, 6, 14), mat(0xd8dce6, { metalness: 0.9, roughness: 0.2 }));
      r.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir); r.position.copy(dir).multiplyScalar(0.53); hombro.add(r);
    }
    brazos.push(hombro);
  }
  const cabeza = new THREE.Group(); cabeza.position.y = 1.13; torso.add(cabeza);
  cabeza.add(bola(0.32, mPiel));
  const mNegro = mat(0x1a0f1f, { roughness: 0.2 }), mBrillo = new THREE.MeshBasicMaterial({ color: 0xffffff });
  for (const s of [-1, 1]) {
    const oreja = bola(0.07, mPiel); oreja.position.set(s * 0.31, 0, 0); cabeza.add(oreja);
    const ojo = bola(0.042, mNegro); ojo.position.set(s * 0.11, 0.02, 0.288); cabeza.add(ojo);
    const brillo = bola(0.013, mBrillo); brillo.position.set(s * 0.11 + 0.014, 0.036, 0.326); cabeza.add(brillo);
    const ceja = caja3(0.09, 0.022, 0.02, mPelo); ceja.position.set(s * 0.11, 0.105, 0.3); ceja.rotation.z = -s * 0.12; cabeza.add(ceja);
    const mejilla = new THREE.Mesh(new THREE.CircleGeometry(0.05, 12), new THREE.MeshBasicMaterial({ color: 0xff8fa8, transparent: true, opacity: 0.5 }));
    mejilla.position.set(s * 0.18, -0.07, 0.272); mejilla.rotation.y = s * 0.5; cabeza.add(mejilla);
  }
  const nariz = bola(0.034, mPiel); nariz.position.set(0, -0.03, 0.318); cabeza.add(nariz);
  const boca = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.012, 4, 10, Math.PI), mat(0x7a2a3a)); boca.position.set(0, -0.11, 0.29); boca.rotation.z = Math.PI; cabeza.add(boca);

  const casco = (corte, giro) => {
    const c = new THREE.Mesh(new THREE.SphereGeometry(0.338, 20, 12, 0, Math.PI * 2, 0, Math.PI * corte), mPelo);
    c.rotation.x = giro; c.position.y = 0.02; cabeza.add(c);
  };
  if (peinado === "corto") { casco(0.52, -0.3); const f = caja3(0.4, 0.08, 0.1, mPelo); f.position.set(0, 0.22, 0.24); f.rotation.x = -0.4; cabeza.add(f); }
  if (peinado === "mono") { casco(0.55, -0.25); const m = bola(0.15, mPelo); m.position.set(0, 0.32, -0.16); cabeza.add(m); }
  if (peinado === "cola") {
    casco(0.55, -0.25); const n = bola(0.1, mPelo); n.position.set(0, 0.12, -0.33); cabeza.add(n);
    const cola = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.4, 4, 8), mPelo); cola.position.set(0, -0.15, -0.38); cola.rotation.x = 0.25; cabeza.add(cola);
  }
  if (peinado === "largo") {
    casco(0.56, -0.2);
    const atras = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.5, 4, 12), mPelo); atras.scale.z = 0.5; atras.position.set(0, -0.3, -0.14); cabeza.add(atras);
  }
  if (peinado === "rizos_corto") {
    // como en la foto: rizos negros arriba y los lados bajitos
    casco(0.47, -0.25);
    for (let i = 0; i < 26; i++) {
      const a = azar() * Math.PI * 2, r = Math.sqrt(azar()) * 0.25;
      const b = bola(0.08 + azar() * 0.035, mPelo); b.position.set(Math.cos(a) * r, 0.27 + azar() * 0.07 - r * 0.3, Math.sin(a) * r * 0.9 + 0.03); cabeza.add(b);
    }
    for (let i = 0; i < 6; i++) { const b = bola(0.07, mPelo); b.position.set(-0.19 + i * 0.076, 0.2 + azar() * 0.03, 0.23); cabeza.add(b); }
  }
  if (peinado === "rizos_largo") {
    // como en la foto: rizos negros hasta la cintura, raya al medio
    casco(0.55, -0.2);
    const raya = caja3(0.012, 0.01, 0.2, mat(piel)); raya.position.set(0, 0.338, 0.06); raya.rotation.x = -0.35; cabeza.add(raya);
    for (let col = 0; col < 7; col++) {
      const x = -0.3 + col * 0.1;
      for (let k = 0; k < 9; k++) {
        const b = bola(0.1 + azar() * 0.02, mPelo);
        b.position.set(x + Math.sin(k * 1.7 + col) * 0.035, 0.06 - k * 0.14, -0.2 - Math.abs(x) * 0.1 + Math.cos(k * 1.3 + col) * 0.03); cabeza.add(b);
      }
    }
    for (const s of [-1, 1]) for (let k = 0; k < 8; k++) {
      const b = bola(0.095, mPelo); b.position.set(s * (0.29 + Math.sin(k * 1.4) * 0.035), 0.08 - k * 0.14, 0.04 + (k > 2 ? 0.1 : 0)); cabeza.add(b);
    }
  }
  if (o.lentes) {
    const mL = mat(0x1a1a22, { metalness: 0.5 });
    for (const s of [-1, 1]) { const l = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.012, 6, 16), mL); l.position.set(s * 0.11, 0.02, 0.31); cabeza.add(l); }
    const puente = caja3(0.08, 0.012, 0.012, mL); puente.position.set(0, 0.03, 0.315); cabeza.add(puente);
  }
  if (o.audifonos) {
    const mA = mat(0x22222c);
    const arco = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.03, 6, 20, Math.PI), mA); arco.position.y = 0.02; cabeza.add(arco);
    for (const s of [-1, 1]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.07, 12), mA); c.rotation.z = Math.PI / 2; c.position.set(s * 0.35, 0, 0); cabeza.add(c); }
  }
  return { grupo: g, torso, cabeza, brazos };
}

// ---------- puestos de trabajo ----------
const mMesa = mat(0xf3e9ff, { roughness: 0.4 }), mPata = mat(0x9d8fc4), mOscuro = mat(0x1a1233, { roughness: 0.3 }), mSilla = mat(0x2a1f48);
function puesto({ linea, quien, director = false, planta = false }) {
  const g = new THREE.Group();
  const disco = new THREE.Mesh(new THREE.CircleGeometry(1.45, 40), new THREE.MeshBasicMaterial({ color: linea, transparent: true, opacity: 0.12, depthWrite: false }));
  disco.rotation.x = -Math.PI / 2; disco.position.y = 0.015; g.add(disco);
  const aro = new THREE.Mesh(new THREE.RingGeometry(1.38, 1.5, 48), new THREE.MeshBasicMaterial({ color: linea, transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false }));
  aro.rotation.x = -Math.PI / 2; aro.position.y = 0.02; g.add(aro);
  const tabla = caja3(1.5, 0.08, 0.75, mMesa); tabla.position.set(0, 0.86, 0.78); g.add(tabla);
  for (const [x, z] of [[-0.68, 0.48], [0.68, 0.48], [-0.68, 1.1], [0.68, 1.1]]) { const l = caja3(0.07, 0.84, 0.07, mPata); l.position.set(x, 0.42, z); g.add(l); }
  const marco = caja3(0.82, 0.52, 0.06, mOscuro); marco.position.set(0, 1.33, 1.03); g.add(marco);
  const pie = caja3(0.08, 0.22, 0.08, mOscuro); pie.position.set(0, 1.0, 1.05); g.add(pie);
  const pantalla = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.42),
    director ? new THREE.MeshBasicMaterial({ map: logoTex }) : new THREE.MeshStandardMaterial({ color: 0x000000, emissive: new THREE.Color(linea), emissiveIntensity: 0.25 }));
  pantalla.position.set(0, 1.33, 0.995); pantalla.rotation.y = Math.PI; g.add(pantalla);
  const teclado = caja3(0.6, 0.03, 0.2, mat(0x2a1f48)); teclado.position.set(0, 0.915, 0.6); g.add(teclado);
  const taza = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.13, 10), mat(linea)); taza.position.set(0.56, 0.97, 0.66); g.add(taza);
  if (planta) {
    const maceta = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.16, 10), mat(0xffffff)); maceta.position.set(-0.55, 0.98, 0.95); g.add(maceta);
    for (let i = 0; i < 5; i++) { const h = bola(0.09, mat(0x3ddc97)); h.position.set(-0.55 + Math.cos(i * 1.3) * 0.07, 1.12 + (i % 2) * 0.06, 0.95 + Math.sin(i * 1.3) * 0.07); g.add(h); }
  }
  if (director) {
    const c = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.025, 0.26), [mOscuro, mOscuro, new THREE.MeshBasicMaterial({ map: claquetaTex }), mOscuro, mOscuro, mOscuro]);
    c.position.set(-0.5, 0.915, 0.66); c.rotation.y = 0.3; g.add(c);
    // silla de director de cine
    const madera = mat(0x8a5a35), lona = mat(0x15151c);
    for (const [x, z] of [[-0.32, -0.25], [0.32, -0.25], [-0.32, 0.25], [0.32, 0.25]]) {
      const p = caja3(0.06, 0.55, 0.06, madera); p.position.set(x, 0.27, z); g.add(p);
    }
    for (const x of [-0.34, 0.34]) {
      const brazo = caja3(0.08, 0.05, 0.62, madera); brazo.position.set(x, 0.82, 0); g.add(brazo);
      const palo = caja3(0.05, 0.85, 0.05, madera); palo.position.set(x, 0.95, -0.3); g.add(palo);
    }
    const asiento = caja3(0.64, 0.05, 0.56, lona); asiento.position.set(0, 0.52, 0); g.add(asiento);
    const espaldar = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.3, 0.03),
      [lona, lona, lona, lona, new THREE.MeshBasicMaterial({ map: letrero("DIRECTOR", "#15151c", "#ffffff") }), new THREE.MeshBasicMaterial({ map: letrero("DIRECTOR", "#15151c", "#ffffff") })]);
    espaldar.position.set(0, 1.2, -0.31); g.add(espaldar);
  } else {
    const asiento = caja3(0.62, 0.1, 0.6, mSilla); asiento.position.set(0, 0.5, 0); g.add(asiento);
    const respaldo = caja3(0.62, 0.75, 0.1, mSilla); respaldo.position.set(0, 0.95, -0.3); g.add(respaldo);
    const poste = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.45, 6), mPata); poste.position.y = 0.23; g.add(poste);
    const patas = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.04, 5), mPata); patas.position.y = 0.04; g.add(patas);
  }
  const muneco = persona(quien); g.add(muneco.grupo);
  const ancla = new THREE.Object3D(); ancla.position.set(0, 2.45, 0); g.add(ancla);
  return { g, pantalla, aro, muneco, ancla, linea: new THREE.Color(linea), estado: "libre", fase: azar() * 6 };
}

const ZAP = 0x1a1414, GRIS = 0x2e3142, AZUL = 0x232a45;
const EQUIPO = {
  radar:      { piel: 0xf1c27d, pelo: 0x1b1b1b, peinado: "corto", ropa: 0xdfe9ff, corbata: 0xffb000, mangaLarga: true, audifonos: true, pantalon: GRIS, zapatos: ZAP },
  cortador:   { piel: 0x8d5524, pelo: 0x141414, peinado: "mono", ropa: 0xffffff, saco: 0x3a3f58, pantalon: GRIS, zapatos: ZAP },
  copywriter: { piel: 0xffdbac, pelo: 0xa0522d, peinado: "largo", ropa: 0xfff1f4, saco: 0x6a2444, lentes: true, pantalon: AZUL, zapatos: ZAP },
  editor:     { piel: 0xc68642, pelo: 0x2a1a12, peinado: "corto", ropa: 0xffffff, corbata: 0xff3d8b, mangaLarga: true, audifonos: true, pantalon: AZUL, zapatos: ZAP },
  revisor:    { piel: 0xe0ac69, pelo: 0x4a2c1a, peinado: "cola", ropa: 0xffffff, saco: 0x2a2440, corbata: 0xc64bff, lentes: true, pantalon: GRIS, zapatos: ZAP },
  publicador: { piel: 0xffdbac, pelo: 0xe3b866, peinado: "corto", ropa: 0xe8f0ff, corbata: 0x8a5cff, mangaLarga: true, pantalon: AZUL, zapatos: ZAP },
  biblioteca: { piel: 0x8d5524, pelo: 0x1b1b1b, peinado: "largo", ropa: 0xffffff, saco: 0x2c3a66, pantalon: GRIS, zapatos: ZAP },
  analista:   { piel: 0xf1c27d, pelo: 0x6b3e26, peinado: "corto", ropa: 0xffffff, corbata: 0x20b8d0, mangaLarga: true, lentes: true, pantalon: AZUL, zapatos: ZAP },
};
const puestos = {};
Object.keys(SALAS).forEach((id, i) => {
  const a = Math.PI * (-7 / 8) + (i * Math.PI) / 4, r = 7.4;
  const p = puesto({ linea: SALAS[id].linea, quien: EQUIPO[id] });
  p.g.position.set(Math.cos(a) * r, 0, Math.sin(a) * r); p.g.lookAt(0, 0, 0);
  escena.add(p.g); puestos[id] = p;
});
// los jefes, en el podio
const director = puesto({
  linea: "#ffd23f", director: true,
  quien: { piel: 0xb07a52, pelo: 0x120c0a, peinado: "rizos_corto", ropa: 0xffffff, saco: 0x1b2038, corbata: 0xd8262f, pantalon: 0x1b2038, zapatos: ZAP, reloj: true },
});
director.g.position.set(-1.4, 0.5, 0.3); director.g.rotation.y = 0.12; escena.add(director.g); puestos.director = director;
const admin = puesto({
  linea: "#ffd23f", planta: true,
  quien: { piel: 0xd4a07a, pelo: 0x1a100d, peinado: "rizos_largo", ropa: 0xfdf6ee, saco: 0x1c1c26, hebilla: true, pantalon: 0x1c1c26, zapatos: ZAP },
});
admin.g.position.set(1.4, 0.5, 0.3); admin.g.rotation.y = -0.12; escena.add(admin.g); puestos.admin = admin;
director.ancla.position.y = admin.ancla.position.y = 2.6;
director.ax = -82; admin.ax = -18;

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
const mPaquete = neon(0xffd23f, 2.4), gPaquete = new THREE.BoxGeometry(0.32, 0.32, 0.32);
const donde = (id) => { const p = puestos[id]; if (!p) return null; const v = new THREE.Vector3(); p.g.getWorldPosition(v); v.y += 1.7; return v; };

// ---------- lo que la página puede pedir ----------
const api = {
  estado(id, estado, tarea, nombre) {
    const p = puestos[id]; if (!p) return;
    p.estado = estado;
    if (p.pantalla.material.emissive) p.pantalla.material.emissive.set(estado === "error" ? 0xff3355 : p.linea);
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
  jefe(n) {
    director.estado = n ? "trabajando" : "libre";
    director.el.classList.toggle("trabajando", n > 0);
    director.el.querySelector(".burbuja").textContent = n ? `Tengo ${n} video${n > 1 ? "s" : ""} por aprobar` : "";
  },
  admin(texto) {
    admin.estado = "trabajando"; admin.el.classList.add("trabajando");
    admin.el.querySelector(".burbuja").textContent = texto;
  },
};
const cola = window.escena3d?.cola || [];
window.escena3d = api;
cola.forEach(([f, a]) => api[f](...a));

// ---------- cámara: gira sola y se puede arrastrar ----------
let ang = 0.35, dist = 26, W = 1, H = 1, arrastrando = false, x0 = 0, visible = true;
const lienzo = render.domElement;
lienzo.addEventListener("pointerdown", (e) => { arrastrando = true; x0 = e.clientX; lienzo.setPointerCapture(e.pointerId); });
lienzo.addEventListener("pointermove", (e) => { if (!arrastrando) return; ang -= (e.clientX - x0) * 0.008; x0 = e.clientX; });
for (const n of ["pointerup", "pointercancel"]) lienzo.addEventListener(n, () => { arrastrando = false; });
function medir() {
  W = caja.clientWidth; H = caja.clientHeight;
  render.setSize(W, H, false); camara.aspect = W / H; camara.updateProjectionMatrix();
  const t = Math.tan(THREE.MathUtils.degToRad(camara.fov / 2));
  dist = Math.max((camara.aspect < 1 ? 9 : 10.5) / (t * camara.aspect), 8.5 / t);
}
new ResizeObserver(medir).observe(caja); medir();
new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(caja);

const reloj = new THREE.Clock(), v = new THREE.Vector3();
function cuadro() {
  requestAnimationFrame(cuadro);
  const dt = Math.min(reloj.getDelta(), 0.05), t = reloj.elapsedTime;
  if (!visible || document.hidden) return;
  if (!arrastrando && !quieto) ang += dt * 0.07;
  const fi = 1.13;
  camara.position.set(Math.sin(ang) * Math.sin(fi) * dist, Math.cos(fi) * dist + 1, Math.cos(ang) * Math.sin(fi) * dist);
  camara.lookAt(0, 2.3, 0);
  for (const pa of palmas) pa.visible = Math.hypot(pa.position.x - camara.position.x, pa.position.z - camara.position.z) > 16;
  sol.position.set(-Math.sin(ang) * 95, 12, -Math.cos(ang) * 95); sol.lookAt(camara.position.x, 12, camara.position.z);

  for (const p of Object.values(puestos)) {
    const w = p.estado === "trabajando" && !quieto, m = p.muneco;
    m.brazos.forEach((b, i) => { b.rotation.x = w ? Math.sin(t * 16 + i * 2.1) * 0.07 : Math.sin(t * 1.2 + i) * 0.015; });
    m.cabeza.rotation.y = quieto ? 0 : w ? Math.sin(t * 2 + p.fase) * 0.08 : Math.sin(t * 0.5 + p.fase) * 0.4;
    m.cabeza.rotation.x = w ? 0.12 : 0;
    m.torso.rotation.x = w ? 0.06 : -0.04;
    m.torso.scale.y = 1 + Math.sin(t * 2 + p.fase) * 0.012;
    if (p.pantalla.material.emissive) p.pantalla.material.emissiveIntensity = p.estado === "libre" ? 0.25 : 1.1 + Math.sin(t * 9 + p.fase) * 0.25;
    p.aro.material.opacity = p.estado === "libre" ? 0.35 : 0.7 + Math.sin(t * 4 + p.fase) * 0.2;
  }
  if (!quieto) { holo.rotation.y += dt * 0.6; holo.position.y = 5.6 + Math.sin(t * 1.3) * 0.15; }

  for (let i = paquetes.length - 1; i >= 0; i--) {
    const k = paquetes[i]; k.t += dt / 1.4;
    k.m.position.lerpVectors(k.a, k.b, Math.min(k.t, 1)); k.m.position.y += Math.sin(Math.PI * Math.min(k.t, 1)) * 2.5;
    k.m.rotation.x += dt * 4; k.m.rotation.y += dt * 3;
    if (k.t >= 1) { escena.remove(k.m); paquetes.splice(i, 1); }
  }

  render.render(escena, camara);
  for (const p of rotulos) {
    p.ancla.getWorldPosition(v); v.project(camara);
    const x = Math.min(Math.max((v.x * 0.5 + 0.5) * W, 74), W - 74), y = (-v.y * 0.5 + 0.5) * H;
    p.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(${p.ax ?? -50}%, -100%)`;
    p.el.style.zIndex = Math.round((1 - v.z) * 10000);
  }
}
cuadro();
