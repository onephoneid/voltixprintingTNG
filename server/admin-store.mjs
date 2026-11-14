// Penyimpanan konten dashboard (Vercel Blob) + sesi login admin.
import {createHmac, createHash, timingSafeEqual} from 'node:crypto';
import {put, get} from '@vercel/blob';

export const DEFAULT_CONTENT = {showDefaultBanners: true, banners: [], products: []};
export const PRODUCTS = ['Banner Ulang Tahun','Banner Usaha','Banner Wisuda','Banner Acara','Stiker','Gantungan Kunci','Baju Custom','Kartu Undangan','Poster Custom','Neon Box','Google Review Card'];
const COOKIE = 'vx_admin';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 hari

export const env = () => ({
  user: process.env.ADMIN_USERNAME || '',
  pass: process.env.ADMIN_PASSWORD || '',
  blob: process.env.BLOB_READ_WRITE_TOKEN || ''
});
export const configured = () => {const e = env(); return {login: !!(e.user && e.pass), storage: !!e.blob};};

const key = () => {const e = env(); return createHash('sha256').update('vx|' + e.user + '|' + e.pass + '|' + e.blob).digest();};
const sign = v => createHmac('sha256', key()).update(v).digest('base64url');
const same = (a, b) => {const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && timingSafeEqual(x, y);};

export function checkLogin(username, password) {
  const e = env();
  if (!e.user || !e.pass) return false;
  const u = createHash('sha256').update(String(username || '')).digest();
  const p = createHash('sha256').update(String(password || '')).digest();
  const okU = timingSafeEqual(u, createHash('sha256').update(e.user).digest());
  const okP = timingSafeEqual(p, createHash('sha256').update(e.pass).digest());
  return okU && okP;
}
export function sessionCookie() {
  const exp = String(Math.floor(Date.now() / 1000) + MAX_AGE);
  return `${COOKIE}=${exp}.${sign(exp)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${MAX_AGE}`;
}
export const clearCookie = () => `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
export function isAuthed(request) {
  if (!configured().login) return false;
  const raw = (request.headers.get('cookie') || '').split(/;\s*/).find(c => c.startsWith(COOKIE + '='));
  if (!raw) return false;
  const [exp, sig] = raw.slice(COOKIE.length + 1).split('.');
  if (!exp || !sig || !/^\d+$/.test(exp) || Number(exp) < Date.now() / 1000) return false;
  return same(sig, sign(exp));
}

// ---------- Blob ----------
let mode = null; // 'public' | 'private'
async function putAny(pathname, body, contentType, overwrite) {
  const opts = {contentType, addRandomSuffix: false, allowOverwrite: !!overwrite, cacheControlMaxAge: overwrite ? 60 : 31536000};
  if (mode !== 'private') {
    try { const r = await put(pathname, body, {...opts, access: 'public'}); mode = 'public'; return {url: r.url, access: 'public'}; }
    catch (e) { if (!/private|public|access/i.test(String(e && e.message))) throw e; mode = 'private'; }
  }
  await put(pathname, body, {...opts, access: 'private'});
  return {url: '/api/media?p=' + encodeURIComponent(pathname), access: 'private'};
}
export async function readContent() {
  if (!configured().storage) return DEFAULT_CONTENT;
  for (const access of mode === 'private' ? ['private', 'public'] : ['public', 'private']) {
    try {
      const r = await get('content.json', {access, useCache: false});
      if (!r) return DEFAULT_CONTENT;
      mode = access;
      return clean(JSON.parse(await new Response(r.stream).text()));
    } catch (e) { if (e && e.name === 'BlobNotFoundError') return DEFAULT_CONTENT; }
  }
  return DEFAULT_CONTENT;
}
export async function writeContent(data) {
  const c = clean(data);
  await putAny('content.json', JSON.stringify(c, null, 2), 'application/json', true);
  return c;
}
export async function saveImage(name, type, base64) {
  if (!/^image\/(webp|jpeg|png)$/.test(type)) throw new Error('Format gambar harus WEBP, JPG, atau PNG.');
  const buf = Buffer.from(String(base64 || ''), 'base64');
  if (!buf.length || buf.length > 3 * 1024 * 1024) throw new Error('Ukuran gambar maksimal 3 MB.');
  const ext = type === 'image/png' ? 'png' : type === 'image/jpeg' ? 'jpg' : 'webp';
  const base = String(name || 'gambar').toLowerCase().replace(/\.[a-z0-9]+$/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'gambar';
  const pathname = `uploads/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}-${base}.${ext}`;
  return putAny(pathname, buf, type, false);
}
export async function readMedia(pathname) {
  if (!/^uploads\/[\w.\-]+$/.test(pathname)) return null;
  for (const access of ['private', 'public']) {
    try { const r = await get(pathname, {access}); if (r) return r; } catch (e) {}
  }
  return null;
}

// ---------- Validasi ----------
const str = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n);
export const validImage = u => /^https:\/\/[a-z0-9-]+\.(public|private)\.blob\.vercel-storage\.com\/uploads\/[\w.\-]+$/i.test(u) || /^\/api\/media\?p=uploads%2F[\w.\-]+$/i.test(u) || /^uploads\/[\w.\-]+$/.test(u);
const validLink = u => u === '' || u === '?pesan=1' || /^#[\w-]{1,40}$/.test(u) || /^https?:\/\/[^\s"'<>]{3,300}$/i.test(u);
export function clean(d) {
  d = d && typeof d === 'object' ? d : {};
  const banners = (Array.isArray(d.banners) ? d.banners : []).slice(0, 12).map(b => ({
    image: str(b && b.image, 400), alt: str(b && b.alt, 140), link: str(b && b.link, 300), active: !(b && b.active === false)
  })).filter(b => validImage(b.image)).map(b => ({...b, link: validLink(b.link) ? b.link : ''}));
  const products = (Array.isArray(d.products) ? d.products : []).slice(0, 60).map(p => ({
    image: str(p && p.image, 400), name: str(p && p.name, 80), price: str(p && p.price, 40), category: str(p && p.category, 60),
    product: PRODUCTS.includes(p && p.product) ? p.product : 'Banner Ulang Tahun', badge: str(p && p.badge, 16),
    shopee: /^https:\/\/([\w-]+\.)*shopee\.co\.id\/[^\s"'<>]{0,300}$/i.test(str(p && p.shopee, 320)) ? str(p.shopee, 320) : '',
    active: !(p && p.active === false)
  })).filter(p => validImage(p.image) && p.name);
  return {showDefaultBanners: d.showDefaultBanners !== false, banners, products};
}
