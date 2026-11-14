import {readMedia} from '../server/admin-store.mjs';
export default {
  async fetch(request) {
    const p = new URL(request.url).searchParams.get('p') || '';
    const r = await readMedia(p).catch(() => null);
    if (!r) return new Response('Tidak ditemukan', {status: 404});
    return new Response(r.stream, {headers: {'Content-Type': r.blob.contentType || 'image/webp', 'Cache-Control': 'public, max-age=31536000, immutable'}});
  }
};
