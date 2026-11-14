import {readContent} from '../server/admin-store.mjs';
export default {
  async fetch() {
    const content = await readContent().catch(() => null);
    return Response.json(content || {showDefaultBanners: true, banners: [], products: []}, {headers: {'Cache-Control': 'public, max-age=0, s-maxage=15, stale-while-revalidate=60'}});
  }
};
