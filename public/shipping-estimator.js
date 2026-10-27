/* Assumptions for a Voltix simulation only. These are not official carrier rates. */
(function(root){
  'use strict';
  const config={metro:10000,java:18000,sumatra:25000,baliNusa:35000,kalimantan:40000,sulawesi:45000,maluku:60000,papua:80000,goSendPerKm:2500,goSendMinimum:20000,maxDistanceKm:40,maxGoSendWeightGrams:20000,volumeDivisor:6000};
  const normalize=value=>String(value||'').toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
  function zoneFor(province,city){
    const p=normalize(province),c=normalize(city);
    if(!p||!c)return null;
    const java=['banten','jawa barat','jawa tengah','jawa timur','dki jakarta','jakarta','daerah khusus jakarta','di yogyakarta','diy','yogyakarta','daerah istimewa yogyakarta'];
    if(java.includes(p)){
      if((['banten','jawa barat','dki jakarta','jakarta','daerah khusus jakarta'].includes(p))&&/^(?:(?:kota|kabupaten|kab) )?(?:jakarta(?: pusat|barat|selatan|timur|utara)?|tangerang(?: selatan)?|bogor|depok|bekasi)$/.test(c))return {key:'metro',name:'Jabodetabek',rate:config.metro};
      return {key:'java',name:'Jawa non-Jabodetabek',rate:config.java};
    }
    if(['aceh','sumatera utara','sumatra utara','sumatera barat','sumatra barat','sumatera selatan','sumatra selatan','riau','kepulauan riau','jambi','bengkulu','lampung','kepulauan bangka belitung','bangka belitung'].includes(p))return {key:'sumatra',name:'Sumatra',rate:config.sumatra};
    if(['bali','nusa tenggara barat','nusa tenggara timur','ntb','ntt'].includes(p))return {key:'baliNusa',name:'Bali dan Nusa Tenggara',rate:config.baliNusa};
    if(/^kalimantan (barat|tengah|selatan|timur|utara)$/.test(p))return {key:'kalimantan',name:'Kalimantan',rate:config.kalimantan};
    if(/^sulawesi (utara|barat|tengah|selatan|tenggara)$/.test(p)||p==='gorontalo')return {key:'sulawesi',name:'Sulawesi',rate:config.sulawesi};
    if(['maluku','maluku utara'].includes(p))return {key:'maluku',name:'Maluku',rate:config.maluku};
    if(['papua','papua barat','papua barat daya','papua selatan','papua tengah','papua pegunungan'].includes(p))return {key:'papua',name:'Papua',rate:config.papua};
    return null;
  }
  function estimate(data){
    const weight=Number(data.weight);
    if(!Number.isFinite(weight)||weight<=0||weight>50000)return {ok:false,message:'Isi perkiraan berat total paket, 1–50.000 gram.'};
    if(data.method==='gosend'){
      const km=Number(data.distance);
      if(!Number.isFinite(km)||km<=0)return {ok:false,message:'Lengkapi alamat dan tautan Maps tujuan, lalu cek ongkir.'};
      if(km>config.maxDistanceKm||weight>config.maxGoSendWeightGrams)return {ok:false,message:'Di luar batas simulasi GoSend (40 km / 20 kg). Konfirmasikan rute dan paket ke admin.'};
      const chargedKm=Math.ceil(km);
      return {ok:true,method:'gosend',amount:Math.max(config.goSendMinimum,chargedKm*config.goSendPerKm),chargedKm,weight,perKm:config.goSendPerKm,minimum:config.goSendMinimum};
    }
    if(data.method!=='jne')return {ok:false,message:'Pilih JNE atau GoSend untuk melihat simulasi.'};
    const zone=zoneFor(data.province,data.city);
    if(!zone)return {ok:false,message:'Isi provinsi dan kota/kabupaten yang dikenali untuk melihat simulasi JNE.'};
    const dimensions=[data.length,data.width,data.height].map(v=>v===''||v==null?null:Number(v));
    const hasDimensions=dimensions.some(v=>v!==null);
    if(hasDimensions&&dimensions.some(v=>!Number.isFinite(v)||v<=0||v>300))return {ok:false,message:'Jika mengisi dimensi, lengkapi panjang, lebar, dan tinggi paket (cm).'};
    const actualKg=weight/1000;
    const volumetricKg=hasDimensions?dimensions.reduce((a,b)=>a*b,1)/config.volumeDivisor:0;
    const chargedKg=Math.max(1,Math.ceil(Math.max(actualKg,volumetricKg)));
    if(chargedKg>50)return {ok:false,message:'Berat hitung melebihi batas simulasi 50 kg. Konfirmasikan layanan paket besar ke admin.'};
    return {ok:true,method:'jne',amount:chargedKg*zone.rate,chargedKg,actualKg,volumetricKg,zone,hasDimensions};
  }
  const api={config,zoneFor,estimate};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.VoltixShippingEstimate=api;
})(typeof window!=='undefined'?window:globalThis);
