import {routeDistanceKm,resolvePin} from '../../server/shipping-location.mjs';
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
async function POST(request){
 try{
 const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)return json({error:'Permintaan tidak diizinkan.'},403);
 const raw=await request.text();if(raw.length>4096)return json({error:'Data terlalu panjang.'},400);
 const data=JSON.parse(raw);
 if(data.mode==='pin'){const point=await resolvePin(String(data.url||''));return json({...point,distanceKm:await routeDistanceKm(point.latitude,point.longitude),distanceSource:'maps_route'});}
 return json({error:'Pilih cara menentukan tujuan.'},400);
 }catch(error){return json({error:error instanceof Error&& !['TimeoutError','SyntaxError'].includes(error.name)?error.message:'Pin atau rute belum dapat dibaca. Klik Cek ongkir untuk mencoba lagi, atau hubungi admin.'},400);}
}

export default {
  async fetch(request) {
    if (request.method !== 'POST') {
      return Response.json({error:'Gunakan POST untuk mengecek ongkir.'},{status:405,headers:{Allow:'POST','Cache-Control':'no-store'}});
    }
    return POST(request);
  }
};
