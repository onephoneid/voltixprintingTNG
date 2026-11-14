'use strict';
(function(){
  const WA='https://wa.me/6283893793285';
  /* Carousel hero */
  const car=document.getElementById('vx-carousel');
  if(car){
    const track=car.querySelector('.vx-slides');const slides=[...car.querySelectorAll('.vx-slide')];const dots=car.querySelector('.vx-dots');
    let i=0,timer;
    slides.forEach((_,n)=>{const b=document.createElement('button');b.type='button';b.setAttribute('role','tab');b.setAttribute('aria-label','Slide '+(n+1));b.addEventListener('click',()=>{go(n);restart();});dots.appendChild(b);});
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
