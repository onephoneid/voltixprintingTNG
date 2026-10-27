'use strict';
(()=>{
 const order=document.getElementById('order-form'),method=document.getElementById('shipping-method'),distance=document.getElementById('shipping-distance'),source=document.getElementById('distance-source'),map=document.getElementById('destination-map'),status=document.getElementById('location-status'),panel=document.getElementById('shipping-location-tools'),button=document.getElementById('read-map');
 const addressNames=['streetAddress','village','district','city','province','postalCode'];
 let revision=0,controller=null,timer=null,verifiedPin='',verifiedAddress='';
 const addressSignature=()=>addressNames.map(name=>order.elements[name].value.trim()).join('|');
 const completeAddress=()=>addressNames.every(name=>order.elements[name].value.trim());
 function refresh(){distance.dispatchEvent(new Event('input',{bubbles:true}));}
 function reset(message='Alamat atau pin berubah. Pastikan keduanya sesuai, lalu cek ongkir kembali.'){
 revision++;controller?.abort();clearTimeout(timer);verifiedPin='';verifiedAddress='';distance.value='';source.value='';button.disabled=false;map.setCustomValidity('');status.textContent=message;refresh();
 }
 async function checkPin(){
 if(method.value!=='gosend')return;
 reset('Membaca pin dan menghitung ongkir…');
 if(!completeAddress()){status.textContent='Lengkapi alamat jalan, kelurahan, kecamatan, kota, provinsi, dan kode pos terlebih dahulu.';return;}
 if(!map.value.trim()||!map.checkValidity()){status.textContent='Tempel tautan Google Maps tujuan yang valid.';return;}
 const version=revision,pin=map.value.trim(),address=addressSignature();
 const activeController=new AbortController();controller=activeController;button.disabled=true;
 const timeout=setTimeout(()=>activeController.abort(),40000);
 try{
 const response=await fetch('/api/shipping/location',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'pin',url:pin}),signal:activeController.signal});
 const data=await response.json();if(version!==revision)return;
 if(!response.ok)throw Error(data.error||'Pin belum dapat dibaca.');
 if(!Number.isFinite(data.distanceKm)||data.distanceKm<=0||data.distanceSource!=='maps_route')throw Error('Rute belum tersedia. Hubungi admin untuk konfirmasi ongkir.');
 verifiedPin=pin;verifiedAddress=address;distance.value=String(data.distanceKm);source.value='maps_route';refresh();
 status.textContent=data.distanceKm>40?'Pin terbaca, tetapi rute berada di luar batas simulasi 40 km. Hubungi admin untuk ongkir.':'Pin dan rute berhasil dibaca. Ongkir sudah diperbarui. Pastikan pin sesuai alamat penerima.';
 }catch(error){if(version!==revision)return;status.textContent=error.name==='AbortError'?'Pin atau rute belum dapat dibaca. Klik Cek ongkir untuk mencoba lagi, atau hubungi admin.':error.message;}
 finally{clearTimeout(timeout);if(version===revision)button.disabled=false;}
 }
 button.addEventListener('click',checkPin);
 function pinChanged(){reset();if(method.value==='gosend'&&map.value.trim())timer=setTimeout(checkPin,900);}
 map.addEventListener('input',pinChanged);map.addEventListener('change',pinChanged);
 for(const name of addressNames){for(const event of ['input','change'])order.elements[name].addEventListener(event,()=>reset());}
 function sync(){panel.hidden=method.value!=='gosend';reset('Isi alamat lengkap dan tautan Maps tujuan.');}
 method.addEventListener('change',sync);
 document.querySelectorAll('[data-shipping-choice]').forEach(trigger=>trigger.addEventListener('click',sync));
 order.addEventListener('submit',event=>{
 if(method.value!=='gosend')return;
 if(!verifiedPin||verifiedPin!==map.value.trim()||verifiedAddress!==addressSignature()||source.value!=='maps_route'){
 event.preventDefault();event.stopImmediatePropagation();
 status.textContent='Ongkir belum tersedia. Lengkapi alamat, tempel pin Maps tujuan, lalu klik Cek ongkir.';
 map.setCustomValidity('Baca pin Maps dan cek ongkir terlebih dahulu.');map.reportValidity();map.focus();return;
 }
 const quote=VoltixShippingEstimate.estimate({method:'gosend',distance:distance.value,weight:order.elements.packageWeight.value});
 if(!quote.ok){event.preventDefault();event.stopImmediatePropagation();status.textContent=quote.message;button.focus();}
 },true);
 sync();
})();
