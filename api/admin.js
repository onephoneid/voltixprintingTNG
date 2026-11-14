import {configured, checkLogin, sessionCookie, clearCookie, isAuthed, readContent, writeContent, saveImage} from '../server/admin-store.mjs';
const json = (data, status = 200, extra = {}) => Response.json(data, {status, headers: {'Cache-Control': 'no-store', ...extra}});
const fails = new Map(); // percobaan login gagal per IP (per instance)
const ipOf = r => (r.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'x';
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function POST(request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return json({error: 'Permintaan tidak diizinkan.'}, 403);
  const raw = await request.text();
  if (raw.length > 4.2 * 1024 * 1024) return json({error: 'Data terlalu besar.'}, 413);
  let body; try { body = JSON.parse(raw || '{}'); } catch { return json({error: 'Data tidak valid.'}, 400); }
  const cfg = configured();
  switch (body.action) {
    case 'status':
      return json({configured: cfg, authed: isAuthed(request)});
    case 'login': {
      if (!cfg.login) return json({error: 'Login admin belum diatur di Vercel (ADMIN_USERNAME & ADMIN_PASSWORD).'}, 503);
      const ip = ipOf(request), f = fails.get(ip) || {n: 0, t: Date.now()};
      if (Date.now() - f.t > 15 * 60 * 1000) { f.n = 0; f.t = Date.now(); }
      if (f.n >= 8) return json({error: 'Terlalu banyak percobaan. Coba lagi 15 menit lagi.'}, 429);
      if (!checkLogin(body.username, body.password)) { f.n++; fails.set(ip, f); await sleep(900); return json({error: 'Username atau password salah.'}, 401); }
      fails.delete(ip);
      return json({ok: true}, 200, {'Set-Cookie': sessionCookie()});
    }
    case 'logout':
      return json({ok: true}, 200, {'Set-Cookie': clearCookie()});
  }
  if (!isAuthed(request)) return json({error: 'Sesi berakhir. Silakan masuk lagi.'}, 401);
  if (!cfg.storage) return json({error: 'Penyimpanan Vercel Blob belum dihubungkan ke project ini.'}, 503);
  try {
    if (body.action === 'load') return json({content: await readContent()});
    if (body.action === 'upload') return json(await saveImage(body.name, body.type, body.data));
    if (body.action === 'save') return json({ok: true, content: await writeContent(body.content)});
  } catch (e) {
    return json({error: e instanceof Error ? e.message : 'Gagal menyimpan.'}, 500);
  }
  return json({error: 'Aksi tidak dikenal.'}, 400);
}
export default {
  async fetch(request) {
    if (request.method !== 'POST') return json({error: 'Gunakan POST.'}, 405, {Allow: 'POST'});
    return POST(request);
  }
};
