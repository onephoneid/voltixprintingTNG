'use strict';
(async function(){
  const WA='https://wa.me/6283893793285';
  const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeUrl=u=>{u=String(u||'').trim();if(!u)return '';if(/^(https?:\/\/|#|\?pesan=1$)/i.test(u))return u;return '';};
  const safeImg=u=>{u=String(u||'');return /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\/uploads\/[\w.\-]+$/i.test(u)||/^\/api\/media\?p=uploads%2F[\w.\-]+$/i.test(u)||/^uploads\/[\w.\-]+\.(webp|jpe?g|png)$/i.test(u)?u:'';};

  /* Konten dari dashboard admin (content.json) */
  let content=null;
  for(const src of ['/api/content','content.json?t='+Date.now()]){try{const r=await fetch(src,{cache:'no-store'});if(r.ok&&/json/.test(r.headers.get('content-type')||'')){content=await r.json();break;}}catch(e){}}
  if(content){
    const track=document.querySelector('#vx-carousel .vx-slides');
    const banners=(content.banners||[]).filter(b=>b&&b.active!==false&&safeImg(b.image));
    if(track&&banners.length){
      if(content.showDefaultBanners===false)track.querySelectorAll('.vx-slide').forEach(s=>s.remove());
      const frag=document.createDocumentFragment();
      banners.forEach((b,n)=>{
        const link=safeUrl(b.link);const img=safeImg(b.image);
        const d=document.createElement('div');d.className='vx-slide vx-slide-promo';d.setAttribute('aria-roledescription','slide');d.setAttribute('aria-label',b.alt||'Promo');
        const inner='<img class="vx-promo-bg" src="'+esc(img)+'" alt="" aria-hidden="true"><img class="vx-promo-img" src="'+esc(img)+'" alt="'+esc(b.alt||'Promo Voltix Printing')+'"'+(n?' loading="lazy"':'')+'>';
        d.innerHTML=link?(link==='?pesan=1'?'<a href="?pesan=1" data-order-open aria-haspopup="dialog" aria-controls="order-dialog">'+inner+'</a>':'<a href="'+esc(link)+'"'+(/^https?:/.test(link)?' target="_blank" rel="noopener noreferrer"':'')+'>'+inner+'</a>'):inner;
        frag.appendChild(d);
      });
      track.insertBefore(frag,track.firstChild);
    }
    const row=document.querySelector('#cetak-favorit .vx-fav-row');
    const prods=(content.products||[]).filter(p=>p&&p.active!==false&&safeImg(p.image)&&p.name);
    if(row&&prods.length){
      const frag=document.createDocumentFragment();
      prods.forEach(p=>{
        const a=document.createElement('article');a.className='vx-fav-card vx-dyn';
        const shop=safeUrl(p.shopee);
        a.innerHTML='<button type="button" class="vx-fav-img" data-order-open data-dyn-product="'+esc(p.product)+'" aria-label="Pesan '+esc(p.name)+'">'+(p.badge?'<span class="vx-new">'+esc(p.badge)+'</span>':'')+'<img src="'+esc(safeImg(p.image))+'" alt="'+esc(p.name)+'" loading="lazy" decoding="async"></button><h3>'+esc(p.name)+'</h3><p>'+esc(p.category||'')+'</p><div class="vx-dyn-actions"><button type="button" class="vx-price" data-order-open data-dyn-product="'+esc(p.product)+'">'+esc(p.price||'Tanya harga')+'</button>'+(/^https?:\/\/([\w-]+\.)*shopee\.co\.id\//i.test(shop)?'<a class="vx-shopee-mini" href="'+esc(shop)+'" target="_blank" rel="noopener noreferrer">Shopee ↗</a>':'')+'</div>';
        frag.appendChild(a);
      });
      row.insertBefore(frag,row.firstChild);
      row.classList.add('vx-fav-scroll');
    }
  }
  /* Klik produk dinamis: isi produk di formulir pesanan sebelum dialog dibuka */
  document.addEventListener('click',e=>{
    const t=e.target.closest('[data-dyn-product]');if(!t)return;
    const sel=document.getElementById('product');const v=t.getAttribute('data-dyn-product');
    if(sel&&v&&[...sel.options].some(o=>o.value===v||o.text===v)){sel.value=v;sel.dispatchEvent(new Event('change',{bubbles:true}));}
  },true);

  /* Carousel hero */
  const car=document.getElementById('vx-carousel');
  if(car){
    const track=car.querySelector('.vx-slides');const slides=[...car.querySelectorAll('.vx-slide')];const dots=car.querySelector('.vx-dots');
    let i=0,timer;
    slides.forEach((s,n)=>{s.setAttribute('aria-label',(n+1)+' dari '+slides.length);const b=document.createElement('button');b.type='button';b.setAttribute('role','tab');b.setAttribute('aria-label','Slide '+(n+1));b.addEventListener('click',()=>{go(n);restart();});dots.appendChild(b);});
    function go(n){i=(n+slides.length)%slides.length;track.style.transform='translateX(-'+(i*100)+'%)';[...dots.children].forEach((d,k)=>d.setAttribute('aria-selected',String(k===i)));slides.forEach((s,k)=>s.setAttribute('aria-hidden',String(k!==i)));}
    function restart(){clearInterval(timer);if(!matchMedia('(prefers-reduced-motion: reduce)').matches)timer=setInterval(()=>go(i+1),6000);}
    car.querySelector('.vx-prev').addEventListener('click',()=>{go(i-1);restart();});
    car.querySelector('.vx-next').addEventListener('click',()=>{go(i+1);restart();});
    let x0=null;car.addEventListener('touchstart',e=>{x0=e.touches[0].clientX;},{passive:true});
    car.addEventListener('touchend',e=>{if(x0===null)return;const dx=e.changedTouches[0].clientX-x0;if(Math.abs(dx)>40){go(i+(dx<0?1:-1));restart();}x0=null;});
    car.addEventListener('mouseenter',()=>clearInterval(timer));car.addEventListener('mouseleave',restart);
    go(0);restart();
  }

  /* Pencarian produk & katalog */
  const form=document.getElementById('vx-search');
  if(form){
    const input=document.getElementById('vx-search-input');const box=document.getElementById('vx-search-results');
    const index=[];
    document.querySelectorAll('#layanan .product, .display-card, .vx-fav-card').forEach(card=>{
      const t=card.querySelector('h3');if(!t)return;
      const section=card.closest('section');const sh=section&&section.querySelector('h2');
      index.push({title:t.textContent.trim(),where:sh?sh.textContent.trim():'',el:card});
    });
    const norm=s=>s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
    function render(q){
      box.innerHTML='';if(!q){box.hidden=true;return;}
      const words=norm(q).split(/\s+/).filter(Boolean);
      const hits=index.filter(it=>{const s=norm(it.title+' '+it.where);return words.every(w=>s.includes(w));}).slice(0,8);
      if(!hits.length){const a=document.createElement('a');a.href=WA+'?text='+encodeURIComponent('Halo Voltix, apakah bisa cetak: '+q+'?');a.target='_blank';a.rel='noopener noreferrer';a.innerHTML='<b>Tidak ketemu “'+q.replace(/[<>&]/g,'')+'”</b><span>Tanya admin via WhatsApp ↗</span>';box.appendChild(a);}
      hits.forEach(it=>{const b=document.createElement('button');b.type='button';b.innerHTML='<b></b><span></span>';b.querySelector('b').textContent=it.title;b.querySelector('span').textContent=it.where;b.addEventListener('click',()=>jump(it.el));box.appendChild(b);});
      box.hidden=false;
    }
    function jump(el){box.hidden=true;el.scrollIntoView({behavior:'smooth',block:'center'});el.classList.remove('vx-flash');void el.offsetWidth;el.classList.add('vx-flash');}
    input.addEventListener('input',()=>render(input.value.trim()));
    input.addEventListener('focus',()=>render(input.value.trim()));
    form.addEventListener('submit',e=>{e.preventDefault();const first=box.querySelector('button,a');if(first)first.click();});
    document.addEventListener('click',e=>{if(!form.contains(e.target))box.hidden=true;});
    input.addEventListener('keydown',e=>{if(e.key==='Escape'){box.hidden=true;input.blur();}});
  }

  /* Info promo via WhatsApp */
  const sub=document.getElementById('vx-sub-form');
  if(sub)sub.addEventListener('submit',e=>{e.preventDefault();const n=document.getElementById('vx-sub-name').value.trim();const t='Halo Voltix Printing'+(n?', saya '+n:'')+'. Saya mau dapat info promo dan desain terbaru.';window.open(WA+'?text='+encodeURIComponent(t),'_blank','noopener');});

  /* Widget chat */
  const btn=document.querySelector('.vx-chat-btn');const card=document.getElementById('vx-chat-card');
  if(btn&&card){
    const set=open=>{card.hidden=!open;btn.setAttribute('aria-expanded',String(open));};
    btn.addEventListener('click',()=>set(card.hidden));
    card.querySelector('.vx-chat-x').addEventListener('click',()=>set(false));
    if(innerWidth>760)setTimeout(()=>{try{if(!sessionStorage.getItem('vxChat')){set(true);sessionStorage.setItem('vxChat','1');}}catch(e){}},2500);
  }

  /* Tutup menu kategori setelah klik */
  const cat=document.querySelector('.vx-cat');
  if(cat){cat.addEventListener('click',e=>{if(e.target.closest('a'))cat.open=false;});document.addEventListener('click',e=>{if(!cat.contains(e.target))cat.open=false;});}
})();
