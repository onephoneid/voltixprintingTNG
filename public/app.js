'use strict';
const form=document.getElementById('order-form');
const product=document.getElementById('product');
const size=document.getElementById('size');
const customInput=document.getElementById('custom-size');

const orderDialog=document.getElementById('order-dialog');
function openOrder(focusField=form.querySelector('[name="name"]')){
  if(!orderDialog.open)orderDialog.showModal();
  document.body.classList.add('order-modal-open');
  orderDialog.scrollTop=0;
  focusField?.focus({preventScroll:true});
}
document.getElementById('order-close').addEventListener('click',()=>orderDialog.close());
orderDialog.addEventListener('close',()=>document.body.classList.remove('order-modal-open'));
orderDialog.addEventListener('click',event=>{if(event.target===orderDialog){const r=orderDialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)orderDialog.close();}});
document.addEventListener('click',event=>{
  const trigger=event.target.closest('[data-order-open],a[href="#pesan"]');
  if(!trigger)return;
  event.preventDefault();
  openOrder();
});
window.addEventListener('hashchange',()=>{if(location.hash==='#pesan')openOrder();});

const shippingMethod=document.getElementById('shipping-method');
function rupiah(value){return new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(value);}
function simulationFor(data){if(data.get('shippingMethod')==='gosend'&&data.get('distanceSource')!=='maps_route')return {ok:false,message:'Lengkapi alamat dan tautan Maps tujuan, lalu cek ongkir.'};return VoltixShippingEstimate.estimate({method:data.get('shippingMethod'),province:data.get('province'),city:data.get('city'),weight:data.get('packageWeight'),distance:data.get('shippingDistance'),length:data.get('packageLength'),width:data.get('packageWidth'),height:data.get('packageHeight')});}
function renderShippingEstimate(){
  const method=shippingMethod.value;
  if(method!=='jne'&&method!=='gosend')return;
  const dimensions=[...document.querySelectorAll('#shipping-dimension-fields input')];
  const anyDimension=dimensions.some(field=>field.value!=='');
  dimensions.forEach(field=>{field.required=method==='jne'&&anyDimension;});
  const result=simulationFor(new FormData(form));
  const title=document.getElementById('shipping-quote-title');
  const description=document.getElementById('shipping-quote-description');
  if(!result.ok){title.textContent='Estimasi belum tersedia';description.textContent=result.message;return;}
  title.textContent=`Estimasi ${method==='jne'?'JNE':'GoSend'}: ${rupiah(result.amount)}`;
  description.textContent=result.method==='jne'?`Model wilayah ${result.zone.name}: ${result.chargedKg} kg × ${rupiah(result.zone.rate)}/kg (tarif asumsi).${result.hasDimensions?' Berat volume ikut diperhitungkan.':''}`:`Tarif ${rupiah(result.perKm)}/km dari rute ke pin Maps tujuan, minimum ${rupiah(result.minimum)}. Rute dibulatkan ke km berikutnya; tarif simulasi.`;
}
function syncShipping(){
  const method=shippingMethod.value;
  const sending=method==='jne'||method==='gosend';
  const fields=document.getElementById('shipping-address-fields');
  fields.hidden=!sending;
  fields.querySelectorAll('input,textarea').forEach(field=>{
    field.disabled=!sending;
    field.required=sending&&(field.hasAttribute('data-shipping-required')||field.hasAttribute('data-simulation-required')||(field.name==='destinationMap'&&method==='gosend'));
    if(!field.required)field.setCustomValidity('');
  });
  document.getElementById('shipping-distance').disabled=method!=='gosend';
  document.getElementById('shipping-distance').required=false;
  document.getElementById('shipping-dimension-fields').hidden=method!=='jne';
  document.querySelectorAll('#shipping-dimension-fields input').forEach(field=>{field.disabled=method!=='jne';field.required=false;});
  document.getElementById('pickup-note').hidden=method!=='pickup';
  document.getElementById('destination-map-help').textContent=method==='gosend'?'Wajib. Tempel tautan Maps tujuan sesuai alamat; ongkir dihitung otomatis dari pin.':'Opsional. Tambahkan untuk membantu menemukan alamat.';
  renderShippingEstimate();
}
function shippingSummary(data){
  const method=data.get('shippingMethod');
  if(method==='pickup')return ['','Penerimaan: Ambil sendiri','Titik dan waktu pengambilan: Konfirmasi admin'];
  if(method!=='jne'&&method!=='gosend')return ['','Pengiriman: Akan dikonsultasikan dengan admin'];
  const value=name=>String(data.get(name)||'').trim();
  const estimate=simulationFor(data);
  const estimateLines=estimate.ok?[`Estimasi ongkir (SIMULASI): ${rupiah(estimate.amount)}`,estimate.method==='jne'?`Asumsi: ${estimate.chargedKg} kg × ${rupiah(estimate.zone.rate)}/kg — ${estimate.zone.name}`:`Asumsi: ${estimate.chargedKm} km × ${rupiah(estimate.perKm)}/km, minimum ${rupiah(estimate.minimum)}`,'Bukan tarif resmi kurir; konfirmasi akhir sebelum membayar.']:[`Estimasi belum tersedia: ${estimate.message}`];
  return ['','DETAIL PENGIRIMAN',`Preferensi kurir: ${method==='jne'?'JNE':'GoSend (Gojek)'}`,`Penerima: ${value('recipientName')}`,`WhatsApp penerima: ${value('recipientPhone')}`,`Alamat: ${value('streetAddress')}`,`Kelurahan/desa: ${value('village')}`,`Kecamatan: ${value('district')}`,`Kota/kabupaten: ${value('city')}`,`Provinsi: ${value('province')}`,`Kode pos: ${value('postalCode')}`,...(value('destinationMap')?[`Pin tujuan: ${value('destinationMap')}`]:[]),...(method==='gosend'?[`Sumber jarak: ${value('distanceSource')==='maps_route'?'rute jalan OSRM ke pin Maps customer':'belum terverifikasi'}`]:[]),...estimateLines,'Layanan dan jangkauan: Konfirmasi admin'];
}
shippingMethod.addEventListener('change',syncShipping);
form.addEventListener('input',renderShippingEstimate);
form.addEventListener('change',renderShippingEstimate);
document.querySelectorAll('[data-shipping-choice]').forEach(button=>button.addEventListener('click',()=>{shippingMethod.value=button.dataset.shippingChoice;syncShipping();invalidateSummary();openOrder();}));
syncShipping();

const bannerSizes=['Konsultasikan ukuran','100 × 100 cm','150 × 100 cm','150 × 150 cm','200 × 100 cm','200 × 150 cm','200 × 200 cm','300 × 200 cm','60 × 160 cm','Ukuran custom'];
const posterSizes=['Konsultasikan ukuran','A4 (21 × 29,7 cm)','A3 (29,7 × 42 cm)','A2 (42 × 59,4 cm)','A0 (84,1 × 118,9 cm)'];
const invitationNotes='Contoh: Nama anak: Raka, 5 tahun. Hari/tanggal acara: …, jam: …, tempat: …, nama tamu: …, jumlah: 50 kartu. Dengan / tanpa foto.';
const posterNotes='Contoh: Poster menu kafe, ukuran A2, 2 lembar. Teks: Menu Kopi. Desain sendiri / menyesuaikan referensi katalog.';
const posterTheme='Contoh: menu kafe, edukasi anak, promosi, atau dekorasi';
const shirtSizes=['Konsultasikan ukuran','S','M','L','XL','XXL','XXXL','Campur ukuran — tulis di catatan','Ukuran custom'];
function updateSizes(){const shirt=product.value==='Baju Custom';const values=shirt?shirtSizes:product.value.startsWith('Banner')?bannerSizes:product.value==='Poster Custom'?posterSizes:['Konsultasikan ukuran','Ukuran custom'];size.replaceChildren(...values.map(v=>new Option(v,v)));document.getElementById('shirt-size-help').hidden=!shirt;document.getElementById('shirt-print-options').hidden=!shirt;document.querySelectorAll('#shirt-print-options select').forEach(field=>field.disabled=!shirt);customInput.placeholder=shirt?'Contoh: ukuran anak 6 tahun atau ukuran khusus sesuai kebutuhan':'Contoh: lebar 200 × tinggi 150 cm';document.getElementById('theme').placeholder=product.value==='Kartu Undangan'?'Contoh: BoBoiBoy, Upin & Ipin, dinosaurus, princess, luar angkasa':product.value==='Poster Custom'?posterTheme:'Contoh: Safari, hijau pastel, tanpa foto';form.elements.notes.placeholder=product.value==='Kartu Undangan'?invitationNotes:product.value==='Poster Custom'?posterNotes:shirt?'Contoh: 5 baju putih, 2 ukuran M dan 3 ukuran L. Depan: logo RT. Belakang: Semarak 17 Agustus.':'Contoh: Happy Birthday Aiman, 1 Tahun. Banner untuk dipasang di dinding ruang tamu.';updateCustom();}
function updateCustom(){const custom=size.value==='Ukuran custom';customInput.closest('label').hidden=!custom;customInput.required=custom;if(!custom){customInput.value='';customInput.setCustomValidity('');}}
let selectedReference=null;
function syncProduct(){if(selectedReference&&product.value!==selectedReference.product){if(document.getElementById('theme').value===selectedReference.theme)document.getElementById('theme').value='';selectedReference=null;}updateSizes();}
function selectReference(productName,theme){product.value=productName;syncProduct();document.getElementById('theme').value=theme;selectedReference={product:productName,theme};}
product.addEventListener('change',syncProduct);size.addEventListener('change',updateCustom);updateSizes();
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-filter]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});document.querySelectorAll('.product').forEach(card=>card.hidden=button.dataset.filter!=='all'&&card.dataset.category!==button.dataset.filter);}));
document.querySelectorAll('[data-product]').forEach(button=>button.addEventListener('click',()=>{product.value=button.dataset.product;syncProduct();if(button.dataset.productSize)size.value=button.dataset.productSize;invalidateSummary();openOrder();}));
document.querySelectorAll('[data-theme]').forEach(button=>button.addEventListener('click',()=>{selectReference(button.dataset.orderProduct||'Banner Ulang Tahun',button.dataset.theme);invalidateSummary();openOrder();}));
const today=new Date();document.getElementById('year').textContent=today.getFullYear();document.getElementById('date').min=[today.getFullYear(),String(today.getMonth()+1).padStart(2,'0'),String(today.getDate()).padStart(2,'0')].join('-');
let summary='';
function invalidateSummary(){document.getElementById('summary').hidden=true;document.getElementById('send-whatsapp').removeAttribute('href');summary='';}
form.addEventListener('input',invalidateSummary);form.addEventListener('change',invalidateSummary);
form.querySelectorAll('input:not([type=number]),select,textarea').forEach(field=>field.addEventListener('input',()=>field.setCustomValidity(field.required&&!field.value.trim()?'Isi kolom ini terlebih dahulu.':'')));
form.addEventListener('submit',event=>{event.preventDefault();form.querySelectorAll('[required]:not([type=number])').forEach(field=>field.setCustomValidity(field.value.trim()?'':'Isi kolom ini terlebih dahulu.'));if(!form.reportValidity())return;const d=new FormData(form);const date=d.get('date');const formatted=date?new Date(date+'T12:00:00').toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'}):'Akan dikonsultasikan';summary=['KEBUTUHAN CETAK — VOLTIX PRINTING','',`Nama: ${String(d.get('name')).trim()}`,`Produk: ${d.get('product')}`,`Ukuran: ${d.get('size')==='Ukuran custom'?String(d.get('customSize')).trim():d.get('size')}`,`Jumlah: ${d.get('quantity')}`,...(d.get('product')==='Baju Custom'?[`Cetak depan: ${d.get('printFront')}`,`Cetak belakang: ${d.get('printBack')}`]:[]),`Tema: ${String(d.get('theme')).trim()||'Akan dikonsultasikan'}`,`Dibutuhkan: ${formatted}`,...shippingSummary(d),'','Teks desain & catatan:',String(d.get('notes')).trim(),'','Mohon konfirmasi harga, bahan, jadwal pengerjaan, dan pengiriman. Foto/referensi menyusul.'].join('\n');document.getElementById('summary-text').textContent=summary;document.getElementById('send-whatsapp').href='https://wa.me/6283893793285?text='+encodeURIComponent(summary);document.getElementById('summary').hidden=false;document.getElementById('copy-status').textContent='';document.getElementById('summary').scrollIntoView({behavior:'smooth',block:'nearest'});});
document.getElementById('copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(summary);document.getElementById('copy-status').textContent='Ringkasan berhasil disalin. Belum dikirim ke admin.';}catch{document.getElementById('copy-status').textContent='Salin otomatis tidak tersedia. Pilih teks ringkasan lalu salin secara manual, atau unduh file.';}});
document.getElementById('download').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([summary],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='Ringkasan-Pesanan-Voltix.txt';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);});


const displayButtons=[...document.querySelectorAll('[data-display-index]')];
const displayDialog=document.getElementById('display-dialog');
let activeDisplay=0;
function renderDisplay(index){activeDisplay=(index+displayButtons.length)%displayButtons.length;const button=displayButtons[activeDisplay];const img=document.getElementById('display-large');img.src=button.querySelector('img').getAttribute('src');img.alt=button.querySelector('img').alt;document.getElementById('display-dialog-title').textContent=button.dataset.displayTitle;document.getElementById('display-dialog-counter').textContent=`${activeDisplay+1} / ${displayButtons.length} · REFERENSI #${button.dataset.displayCode}`;}
displayButtons.forEach((button,index)=>button.addEventListener('click',()=>{renderDisplay(index);displayDialog.showModal();document.body.classList.add('display-modal-open');}));
document.getElementById('display-close').addEventListener('click',()=>displayDialog.close());
displayDialog.addEventListener('close',()=>document.body.classList.remove('display-modal-open'));
displayDialog.addEventListener('click',event=>{if(event.target===displayDialog){const r=displayDialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)displayDialog.close();}});
document.getElementById('display-prev').addEventListener('click',()=>renderDisplay(activeDisplay-1));
document.getElementById('display-next').addEventListener('click',()=>renderDisplay(activeDisplay+1));
displayDialog.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'){event.preventDefault();renderDisplay(activeDisplay-1);}else if(event.key==='ArrowRight'){event.preventDefault();renderDisplay(activeDisplay+1);}});
document.getElementById('display-use').addEventListener('click',()=>{const button=displayButtons[activeDisplay];selectReference(button.dataset.orderProduct||(button.dataset.displayCode==='208'?'Banner Acara':'Banner Ulang Tahun'),`${button.dataset.displayTitle} — Referensi #${button.dataset.displayCode}`);invalidateSummary();displayDialog.close();openOrder();});

if(location.hash==='#pesan'||new URLSearchParams(location.search).get('pesan')==='1')openOrder();

const reviewForm=document.getElementById('customer-review-form');
const reviewPreview=document.getElementById('customer-review-preview');
const reviewSend=document.getElementById('customer-review-send');
function invalidateReview(){reviewPreview.hidden=true;reviewSend.removeAttribute('href');}
reviewForm.addEventListener('input',invalidateReview);
reviewForm.addEventListener('change',invalidateReview);
reviewForm.querySelectorAll('[name="rating"]').forEach(input=>input.addEventListener('change',()=>{
  const rating=Number(input.value);
  document.getElementById('customer-rating-text').textContent=`${rating} dari 5 bintang`;
  reviewForm.querySelectorAll('.customer-rating label').forEach((label,index)=>label.classList.toggle('rating-selected',index<rating));
}));
reviewForm.querySelectorAll('input:not([type="radio"]),textarea').forEach(field=>field.addEventListener('input',()=>field.setCustomValidity(field.value.trim()?'':'Isi kolom ini terlebih dahulu.')));
reviewForm.addEventListener('submit',event=>{
  event.preventDefault();
  reviewForm.querySelectorAll('input:not([type="radio"]),textarea').forEach(field=>field.setCustomValidity(field.value.trim()?'':'Isi kolom ini terlebih dahulu.'));
  if(!reviewForm.reportValidity())return;
  const data=new FormData(reviewForm);
  const rating=Number(data.get('rating'));
  if(!Number.isInteger(rating)||rating<1||rating>5)return;
  const text=['ULASAN PELANGGAN — VOLTIX PRINTING','',`Nama: ${String(data.get('reviewer')).trim()}`,`Produk: ${String(data.get('reviewProduct')).trim()}`,`Rating: ${rating}/5 (${'★'.repeat(rating)})`,'','Ulasan:',String(data.get('reviewText')).trim(),'','Mohon konfirmasi ulasan ini sebelum ditampilkan di website.'].join('\n');
  document.getElementById('customer-review-text').textContent=text;
  reviewSend.href='https://wa.me/6283893793285?text='+encodeURIComponent(text);
  reviewPreview.hidden=false;
  reviewPreview.scrollIntoView({behavior:'smooth',block:'nearest'});
});

// Visual preview uses only the visitor's own text and chosen rating.
reviewForm.addEventListener('submit',()=>{
  if(reviewPreview.hidden||!reviewForm.checkValidity())return;
  const data=new FormData(reviewForm),rating=Number(data.get('rating'));
  if(!Number.isInteger(rating)||rating<1||rating>5)return;
  document.getElementById('own-review-name').textContent=String(data.get('reviewer')).trim();
  document.getElementById('own-review-product').textContent=String(data.get('reviewProduct')).trim();
  document.getElementById('own-review-comment').textContent=String(data.get('reviewText')).trim();
  const stars=document.getElementById('own-review-stars');
  stars.textContent='★'.repeat(rating)+'☆'.repeat(5-rating);
  stars.setAttribute('aria-label',`${rating} dari 5 bintang`);
});
