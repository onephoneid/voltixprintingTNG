import assert from 'node:assert/strict';
import {readFile,stat,readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import vm from 'node:vm';
import {spawnSync} from 'node:child_process';
import api from '../api/shipping/location.js';
import {resolvePin,routeDistanceKm} from '../server/shipping-location.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
process.chdir(root);
const config=JSON.parse(await readFile('vercel.json','utf8'));
assert.equal(config.framework,null);assert.equal(config.outputDirectory,'public');
const html=await readFile('public/index.html','utf8');
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);
for(const [,value] of html.matchAll(/(?:src|href)="([^"]+)"/g)){
 if(/^(?:https?:|data:|#|mailto:|tel:|\?)/.test(value))continue;
 const path=value.split(/[?#]/)[0];if(!path)continue;
 assert((await stat(resolve('public',path))).isFile(),path);
}
assert(html.includes('assets/voltix-hero-promo.png'));assert(html.includes('shipping-distance" type="hidden"'));
for(const file of ['api/shipping/location.js','server/shipping-location.mjs','public/app.js','public/shipping-location.js','public/shipping-estimator.js']){
 assert.equal(spawnSync(process.execPath,['--check',file]).status,0,`Syntax: ${file}`);
}
const sandbox={};vm.runInNewContext(await readFile('public/shipping-estimator.js','utf8'),sandbox);
assert.equal(sandbox.VoltixShippingEstimate.estimate({method:'gosend',distance:10,weight:1000}).amount,25000);
assert.equal(sandbox.VoltixShippingEstimate.estimate({method:'gosend',distance:1,weight:1000}).amount,20000);
assert.equal(sandbox.VoltixShippingEstimate.estimate({method:'gosend',distance:41,weight:1000}).ok,false);
await assert.rejects(()=>resolvePin('https://127.0.0.1/maps'));
await assert.rejects(()=>resolvePin('https://maps.app.goo.gl/test',async()=>new Response(null,{status:302,headers:{location:'https://127.0.0.1/'}})));
await assert.rejects(()=>routeDistanceKm(-6.2,106.7,async()=>Response.json({code:'NoRoute'})));
const originalFetch=globalThis.fetch;
try{
 globalThis.fetch=async()=>Response.json({code:'Ok',routes:[{distance:10000}]});
 const make=(body,origin='https://voltix.test')=>new Request('https://voltix.test/api/shipping/location',{method:'POST',headers:{origin,'Content-Type':'application/json'},body});
 let response=await api.fetch(make(JSON.stringify({mode:'pin',url:'https://www.google.com/maps?q=-6.2,106.7'})));
 assert.equal(response.status,200);const quote=await response.json();assert.equal(quote.distanceKm,10);assert.equal(quote.distanceSource,'maps_route');assert(!('origin' in quote));
 response=await api.fetch(make('{}','https://other.test'));assert.equal(response.status,403);
 response=await api.fetch(make('{broken'));assert.equal(response.status,400);
 response=await api.fetch(make('x'.repeat(4097)));assert.equal(response.status,400);
 response=await api.fetch(new Request('https://voltix.test/api/shipping/location'));assert.equal(response.status,405);
}finally{globalThis.fetch=originalFetch;}
const listed=await readdir('.');assert(!listed.includes('.openai'));assert(!listed.includes('.env'));assert(!listed.includes('node_modules'));
console.log('PASS — static assets, hero image, unique IDs, JS syntax, tariffs, safe pin redirects, routes, Vercel endpoint, HTTP errors.');
