(() => {
  const studio = document.querySelector('#studio-ukuran');
  if (!studio) return;
  const find = selector => studio.querySelector(selector);
  const view = find('.vs-view');
  const scene = find('.vs-scene');
  const world = find('.vs-world');
  const furniture = find('.vs-furniture');
  const art = find('.vs-art');
  const canvas = art.querySelector('canvas');
  const width = find('#vs-width');
  const height = find('#vs-height');
  const error = find('.vs-error');
  const order = find('.vs-order');
  const angleButton = find('.vs-angle');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const frontAngle = 0;
  const studioAngle = -8;
  let angle = studioAngle;
  let front = false;
  let animation;
  let uploaded = null;
  let uploadVersion = 0;
  let dimensions = [100, 100];

  function element(className, parent) {
    const node = document.createElement('div');
    node.className = className;
    parent.append(node);
    return node;
  }
  function box(x, y, z, w, h, d, colors, rounded = false) {
    const group = element('vs-box', furniture);
    group.style.transform = 'translate3d(' + x + 'px,' + y + 'px,' + z + 'px)';
    function face(faceWidth, faceHeight, transform, background) {
      const side = element('vs-face', group);
      Object.assign(side.style, {
        width: faceWidth + 'px', height: faceHeight + 'px', transform, background,
        borderRadius: rounded ? '3px' : '0'
      });
    }
    face(w, h, 'translateZ(' + d + 'px)', colors[0]);
    face(w, d, 'rotateX(90deg)', colors[1]);
    face(d, h, 'rotateY(-90deg)', colors[2]);
    face(d, h, 'translate3d(' + w + 'px,0,' + d + 'px) rotateY(90deg)', colors[2]);
  }
  element('vs-rug', furniture);
  for (const x of [107, 284]) {
    for (const z of [19, 79]) box(x, 265, z, 7, 15, 7, ['#684d38', '#896a4d', '#58412f']);
  }
  const moss = ['linear-gradient(#929c79,#737d5e)', '#a5ac90', '#6c765b'];
  const seat = ['linear-gradient(#9da68a,#838e70)', '#b0b89c', '#7b8569'];
  box(100, 251, 12, 200, 16, 77, moss, true);
  box(103, 220, 15, 194, 38, 18, moss, true);
  for (const x of [114, 201]) {
    box(x, 212, 21, 85, 35, 17, seat, true);
    box(x, 244, 37, 85, 11, 49, seat, true);
  }
  for (const x of [100, 285]) box(x, 235, 18, 15, 27, 71, moss, true);
  for (const part of ['stem', 'base', 'globe']) element('vs-lamp-' + part, furniture);

  function paintPrint(w, h) {
    // A fixed drawing resolution keeps very slim or very tall prints inexpensive.
    canvas.width = Math.max(1, Math.round(850 * w / Math.max(w, h)));
    canvas.height = Math.max(1, Math.round(850 * h / Math.max(w, h)));
    const ctx = canvas.getContext('2d');
    const cw = canvas.width, ch = canvas.height;
    ctx.fillStyle = '#f5edda';
    ctx.fillRect(0, 0, cw, ch);
    if (uploaded) {
      const fit = Math.min(cw / uploaded.naturalWidth, ch / uploaded.naturalHeight);
      const dw = uploaded.naturalWidth * fit, dh = uploaded.naturalHeight * fit;
      ctx.drawImage(uploaded, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
      return;
    }
    ctx.scale(cw / 500, ch / 500);
    ctx.fillStyle = '#252d36';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('VOLTIX   /   ART PRINT', 27, 36);
    ctx.fillStyle = '#f47541';
    ctx.beginPath(); ctx.arc(332, 181, 111, 0, Math.PI * 2); ctx.fill();
    ctx.save();
    ctx.beginPath(); ctx.rect(26, 61, 448, 316); ctx.clip();
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#364e65';
    for (let n = 0; n < 24; n++) {
      const y = 230 + n * 13;
      ctx.beginPath(); ctx.moveTo(-20, y);
      ctx.bezierCurveTo(87, y - 150, 159, y - 132, 248, y - 34);
      ctx.bezierCurveTo(335, y + 63, 425, y + 10, 523, y - 79); ctx.stroke();
    }
    ctx.restore();
    ctx.font = 'bold 68px sans-serif'; ctx.fillText('PASANG', 24, 447);
    ctx.font = 'bold 14px sans-serif'; ctx.fillText('KOLEKSI GARIS  /  VOLTIX PRINTING', 29, 476);
  }

  function showDimensions() {
    const valid = [width, height].every(field => field.value !== '' && field.validity.valid);
    for (const field of [width, height]) field.setAttribute('aria-invalid', String(!field.value || !field.validity.valid));
    error.hidden = valid;
    order.disabled = !valid;
    error.textContent = valid ? '' : 'Isi lebar 1–400 cm dan tinggi 1–280 cm, maksimal satu angka desimal.';
    for (const button of studio.querySelectorAll('[data-vs-size]')) {
      button.setAttribute('aria-pressed', String(valid && button.dataset.vsSize === [width.valueAsNumber, height.valueAsNumber].join(',')));
    }
    if (!valid) return;
    const w = width.valueAsNumber, h = height.valueAsNumber;
    dimensions = [w, h];
    const top = Math.max(0, Math.min(140 - h / 2 - 26, 280 - h));
    Object.assign(art.style, {width:w + 'px', height:h + 'px', left:(400 - w) / 2 + 'px', top:top + 'px'});
    find('.vs-mw').textContent = w.toLocaleString('id-ID') + ' cm';
    find('.vs-mh').textContent = h.toLocaleString('id-ID') + ' cm';
    paintPrint(w, h);
  }
  function project() {
    const scale = Math.min(view.clientWidth / 410, view.clientHeight / 321);
    scene.style.transform = 'scale(' + scale + ')';
    world.style.transform = front ? 'none' :
      'perspective(940px) rotateX(-5deg) rotateY(' + angle + 'deg)';
    angleButton.setAttribute('aria-pressed', String(front));
    angleButton.textContent = front ? 'Kembali ke 3D' : 'Tampak depan';
    angleButton.title = angleButton.textContent;
  }
  function rotateTo(target) {
    cancelAnimationFrame(animation);
    const start = angle, began = performance.now();
    function frame(time) {
      const progress = reducedMotion.matches ? 1 : Math.min(1, (time - began) / 450);
      angle = start + (target - start) * (1 - (1 - progress) ** 3);
      project();
      if (progress < 1) animation = requestAnimationFrame(frame);
    }
    animation = requestAnimationFrame(frame);
  }
  angleButton.addEventListener('click', () => {
    front = !front;
    rotateTo(front ? frontAngle : studioAngle);
    project();
  });
  let dragging = null;
  view.addEventListener('pointerdown', event => {
    if (event.target.closest('button') || event.button !== 0) return;
    cancelAnimationFrame(animation);
    dragging = {id:event.pointerId, x:event.clientX, angle:front ? 0 : angle};
    view.setPointerCapture(event.pointerId);
  });
  view.addEventListener('pointermove', event => {
    if (!dragging || dragging.id !== event.pointerId) return;
    const delta = event.clientX - dragging.x;
    if (Math.abs(delta) < 3) return;
    front = false;
    angle = Math.max(-22, Math.min(22, dragging.angle + delta * .12));
    project();
  });
  view.addEventListener('lostpointercapture', () => { dragging = null; });
  view.tabIndex = 0;
  view.setAttribute('aria-label','Simulasi ruang 3D. Geser atau gunakan tombol panah kiri dan kanan untuk memutar.');
  view.addEventListener('keydown', event => {
    if (event.target !== view || !['ArrowLeft','ArrowRight'].includes(event.key)) return;
    event.preventDefault(); front = false;
    rotateTo(Math.max(-22, Math.min(22, angle + (event.key === 'ArrowLeft' ? -5 : 5))));
  });
  for (const field of [width, height]) field.addEventListener('input', showDimensions);
  for (const button of studio.querySelectorAll('[data-vs-size]')) {
    button.addEventListener('click', () => {
      [width.value, height.value] = button.dataset.vsSize.split(',');
      showDimensions();
    });
  }
  find('#vs-guides').addEventListener('change', event => world.classList.toggle('hide-guides', !event.target.checked));
  find('#vs-room').addEventListener('change', event => {
    const empty = event.target.value === 'empty';
    world.classList.toggle('empty', empty);
    find('#vs-room-name').textContent = empty ? 'Dinding kosong' : 'Ruang tamu';
    find('#vs-reference').textContent = 'Dinding 400 × 280 cm' + (empty ? '' : ' · Sofa 200 cm');
  });
  const fileInput = find('#vs-upload'), status = find('.vs-file-status'), clear = find('.vs-clear');
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file) return;
    const version = ++uploadVersion;
    const url = URL.createObjectURL(file);
    try {
      if (!['image/jpeg','image/png','image/webp'].includes(file.type)) throw new Error();
      const img = new Image(); img.src = url; await img.decode();
      if (version !== uploadVersion) return;
      uploaded = img; paintPrint(...dimensions);
      status.textContent = file.name; clear.hidden = false;
    } catch {
      if (version !== uploadVersion) return;
      status.textContent = 'Gambar gagal dibuka. Pilih file JPG, PNG, atau WebP.';
    } finally {
      URL.revokeObjectURL(url);
      if (version === uploadVersion) { status.hidden = false; fileInput.value = ''; }
    }
  });
  clear.addEventListener('click', () => {
    uploadVersion++; uploaded = null; clear.hidden = true; status.hidden = true;
    paintPrint(...dimensions);
  });
  order.addEventListener('click', () => {
    const product = document.querySelector('#product'), size = document.querySelector('#size');
    if (!product.value.startsWith('Banner')) product.value = 'Banner Acara';
    product.dispatchEvent(new Event('change', {bubbles:true}));
    const label = dimensions.map(n => n.toLocaleString('id-ID')).join(' × ') + ' cm';
    size.value = Array.from(size.options).some(option => option.value === label) ? label : 'Ukuran custom';
    size.dispatchEvent(new Event('change', {bubbles:true}));
    if (size.value === 'Ukuran custom') {
      const custom = document.querySelector('#custom-size');
      custom.value = label; custom.dispatchEvent(new Event('input', {bubbles:true}));
    }
    openOrder();
  });
  new ResizeObserver(project).observe(view);
  showDimensions(); project();
  if (!reducedMotion.matches && 'IntersectionObserver' in window) {
    const reveal = new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) return;
      reveal.disconnect();
      if (dragging || front || angle !== studioAngle) return;
      angle = -16; rotateTo(studioAngle);
    }, {threshold:.45});
    reveal.observe(view);
  }
})();
