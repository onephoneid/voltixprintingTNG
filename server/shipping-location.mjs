// Verified Voltix listing; never sent to the storefront.
const origin = {lat:-6.242338,lon:106.7282454};
export function validPoint(lat,lon){return Number.isFinite(lat)&&Number.isFinite(lon)&&lat>=-11.5&&lat<=6.5&&lon>=94&&lon<=142;}
let lastRouteAt=0;
export async function routeDistanceKm(lat,lon,fetcher=fetch){
 if(!validPoint(lat,lon))throw Error('Titik tujuan harus berada di Indonesia.');
 // The free demo permits at most one request per second; fail closed when busy.
 if(fetcher===fetch){if(Date.now()-lastRouteAt<1100)throw Error('Layanan rute sedang sibuk. Tunggu sebentar lalu klik Cek ongkir.');lastRouteAt=Date.now();}
 const url=`https://router.project-osrm.org/route/v1/driving/${origin.lon},${origin.lat};${lon},${lat}?overview=false&steps=false&alternatives=false&radiuses=300;300`;
 const response=await fetcher(url,{headers:{'User-Agent':'VoltixPrinting/1.0 (+https://voltix-printing-studio.rifki58534.chatgpt.site)','Referer':'https://voltix-printing-studio.rifki58534.chatgpt.site/'},signal:AbortSignal.timeout(12000)});
 if(!response.ok)throw Error('Rute belum tersedia. Coba lagi atau konfirmasi ongkir ke admin.');
 const data=await response.json();const meters=data.routes?.[0]?.distance;
 if(data.code!=='Ok'||!Number.isFinite(meters)||meters<0)throw Error('Rute jalan menuju pin belum ditemukan. Periksa pin tujuan atau hubungi admin.');
 return Math.max(.1,Math.ceil(meters/100)/10);
}
function allowed(url){return url.protocol==='https:'&&!url.username&&!url.password&&(!url.port||url.port==='443')&&(['maps.app.goo.gl','maps.google.com'].includes(url.hostname)||(['www.google.com','google.com','www.google.co.id','google.co.id'].includes(url.hostname)&&url.pathname.startsWith('/maps')));}
export async function resolvePin(value,fetcher=fetch){
 let url;try{url=new URL(value);}catch{throw Error('Isi tautan Google Maps yang valid.');}
 for(let i=0;i<6;i++){
 if(!allowed(url))throw Error('Gunakan tautan Google Maps HTTPS.');
 const text=decodeURIComponent(url.href);const match=text.match(/!3d(-?[\d.]+)!4d(-?[\d.]+)/)||text.match(/[?&](?:q|query)=(-?[\d.]+),\s*(-?[\d.]+)/)||text.match(/\/(?:search|place)\/(-?[\d.]+),\s*(-?[\d.]+)/);
 if(match){const lat=Number(match[1]),lon=Number(match[2]);if(validPoint(lat,lon))return {latitude:lat,longitude:lon,label:'Pin Google Maps tujuan'};}
 const cid=url.searchParams.get('cid')||(/0x[\da-f]+:0x([\da-f]+)/i.exec(text)?.[1] ? BigInt('0x'+/0x[\da-f]+:0x([\da-f]+)/i.exec(text)[1]).toString():null);
 if(cid&&/^\d+$/.test(cid)){
 const embed=await fetcher('https://www.google.com/maps?cid='+cid+'&hl=id&output=embed',{signal:AbortSignal.timeout(8000)});
 const body=await embed.text();const m=body.match(/,\[(-?\d+\.\d+),(-?\d+\.\d+)\],"\d+"/);
 if(m&&validPoint(Number(m[1]),Number(m[2])))return {latitude:Number(m[1]),longitude:Number(m[2]),label:'Pin Google Maps tujuan'};
 break;
 }
 const response=await fetcher(url,{redirect:'manual',signal:AbortSignal.timeout(8000)});
 if(response.status>=300&&response.status<400&&response.headers.get('location')){url=new URL(response.headers.get('location'),url);continue;}
 break;
 }
 throw Error('Titik pin belum dapat dibaca. Buka Google Maps, pilih titik rumah lalu bagikan tautan pin. Jika tetap gagal, hubungi admin untuk konfirmasi ongkir.');
}
