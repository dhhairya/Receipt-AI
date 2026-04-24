// ═══════════════════════════════════════════════════════════════════════════
// ReceiptAI — Application Logic
// Smart Payment Receipt Generator
// ═══════════════════════════════════════════════════════════════════════════

// ─── STATE ───────────────────────────────────────────────────────────────────
const S = {
  templateDataUrl: null,
  templateName: null,
  detectedFields: [],
  formData: {},
  fieldPositions: {},
  signatures: [],
  selectedSigId: null,
  sigPos: {x:72, y:82},
  sigSize: 18,
  records: [],
  isDragging: null,
  dragStart: null,
  imgNaturalW: 1, imgNaturalH: 1,
  savedTemplates: [],
  initialReceiptNo: 1,
  fontSizeMultiplier: 18
};

// ─── STORAGE ─────────────────────────────────────────────────────────────────
function loadState() {
  try { let r=localStorage.getItem('receiptai_signatures'); if(r) S.signatures=JSON.parse(r); } catch(e){ console.warn('Load sigs:',e); }
  try { let r=localStorage.getItem('receiptai_records'); if(r) S.records=JSON.parse(r); } catch(e){ console.warn('Load recs:',e); }
  try { let r=localStorage.getItem('receiptai_templates'); if(r) S.savedTemplates=JSON.parse(r); } catch(e){ console.warn('Load tpls:',e); }
  renderSigs(); renderRecords(); renderSavedTemplates();
}
function saveSigs() { try { localStorage.setItem('receiptai_signatures', JSON.stringify(S.signatures)); } catch(e){} }
function saveRecords() { try { localStorage.setItem('receiptai_records', JSON.stringify(S.records)); } catch(e){} }
function saveTpls() { try { localStorage.setItem('receiptai_templates', JSON.stringify(S.savedTemplates.map(t=>({id:t.id,name:t.name})))); } catch(e){} }

// ─── TABS ─────────────────────────────────────────────────────────────────────
function setTab(t) {
  ['new','sigs','records'].forEach(id => {
    document.getElementById('panel-'+id).classList.toggle('active', id===t);
    document.getElementById('tab-'+id).classList.toggle('active', id===t);
  });
  if(t==='records') renderRecords();
  if(t==='sigs') renderSigs();
}

// ─── STEP INDICATOR ──────────────────────────────────────────────────────────
function setStep(n) {
  for(let i=1;i<=5;i++) {
    const el=document.getElementById('s'+i);
    el.classList.remove('active','done');
    if(i<n) el.classList.add('done');
    else if(i===n) el.classList.add('active');
  }
}

// ─── TEMPLATE UPLOAD ─────────────────────────────────────────────────────────
function handleDrop(ev) {
  ev.preventDefault();
  document.getElementById('dropzone').classList.remove('drag-over');
  const f=ev.dataTransfer.files[0];
  if(f && f.type.startsWith('image/')) handleTemplateFile(f);
}

function handleTemplateFile(file) {
  if(!file) return;
  const reader=new FileReader();
  reader.onload=e => {
    S.templateDataUrl=e.target.result;
    S.templateName=file.name;
    S.detectedFields=[];
    S.formData={};
    S.fieldPositions={};
    S.selectedSigId=null;
    loadTemplate();
  };
  reader.readAsDataURL(file);
}

function loadTemplate() {
  document.getElementById('upload-section').style.display='none';
  document.getElementById('receipt-section').style.display='block';
  document.getElementById('download-actions').style.display='none';
  const img=document.getElementById('tpl-img');
  img.src=S.templateDataUrl;
  img.onload=()=>{ S.imgNaturalW=img.naturalWidth||img.offsetWidth; S.imgNaturalH=img.naturalHeight||img.offsetHeight; };
  clearOverlays();
  setStep(2);
  renderForm();
  detectFields();
}

function resetTemplate() {
  S.templateDataUrl=null;
  S.detectedFields=[];
  S.formData={};
  S.fieldPositions={};
  document.getElementById('upload-section').style.display='block';
  document.getElementById('receipt-section').style.display='none';
  setStep(1);
}

// ─── SAVED TEMPLATES ─────────────────────────────────────────────────────────
function renderSavedTemplates() {
  const row=document.getElementById('saved-templates-row');
  row.innerHTML='';
  if(!S.savedTemplates.length) return;
  const label=document.createElement('div');
  label.style.cssText='font-size:.8rem;color:var(--TM);align-self:center;';
  label.textContent='Recent templates:';
  row.appendChild(label);
  S.savedTemplates.forEach(t => {
    const btn=document.createElement('button');
    btn.className='btn bo bsm';
    btn.textContent='📋 '+t.name;
    btn.onclick=()=>{ if(t.dataUrl){ S.templateDataUrl=t.dataUrl; S.templateName=t.name; loadTemplate(); } else showToast('Template not in session memory. Please re-upload.','err'); };
    row.appendChild(btn);
  });
}

// ─── AI FIELD DETECTION ──────────────────────────────────────────────────────
async function detectFields() {
  document.getElementById('det-ov').style.display='flex';
  setStep(2);
  await new Promise(resolve => setTimeout(resolve, 1200));
  S.detectedFields=defaultFields();
  S.detectedFields.forEach(f => {
    S.fieldPositions[f.id]={x:f.x, y:f.y};
    if(!S.formData[f.id]) S.formData[f.id]='';
  });
  showToast(`✅ ${S.detectedFields.length} fields detected! Drag to reposition.`, 'ok');
  document.getElementById('det-ov').style.display='none';
  setStep(3);
  renderForm();
  renderOverlays();
  document.getElementById('field-count-badge').textContent=S.detectedFields.length+' fields';
}

function defaultFields() {
  return [
    {id:'name',label:'Name',label_hi:'नाम',type:'text',x:45,y:18},
    {id:'address',label:'Address',label_hi:'पता',type:'text',x:45,y:26},
    {id:'amount',label:'Amount (₹)',label_hi:'राशि',type:'amount',x:60,y:35},
    {id:'amount_words',label:'Amount in Words',label_hi:'राशि शब्दों में',type:'amount_words',x:45,y:45},
    {id:'date',label:'Date',label_hi:'दिनांक',type:'date',x:75,y:12},
    {id:'receipt_no',label:'Receipt No.',label_hi:'रसीद संख्या',type:'receipt_no',x:25,y:12},
    {id:'mobile',label:'Mobile No.',label_hi:'मोबाइल',type:'mobile',x:45,y:58},
    {id:'purpose',label:'Category',label_hi:'श्रेणी',type:'purpose',x:45,y:68},
  ];
}

// ─── OVERLAYS ────────────────────────────────────────────────────────────────
function clearOverlays() {
  document.getElementById('pvwrap').querySelectorAll('.fov,.sov').forEach(el=>el.remove());
}

function renderOverlays() {
  clearOverlays();
  const wrap=document.getElementById('pvwrap');
  S.detectedFields.forEach(f => {
    const pos=S.fieldPositions[f.id]||{x:50,y:50};
    const div=document.createElement('div');
    div.className='fov'+(S.formData[f.id]?'':' empty');
    div.id='fov-'+f.id;
    div.style.left=pos.x+'%';
    div.style.top=pos.y+'%';
    div.textContent=S.formData[f.id]||'[ '+f.label+' ]';
    makeDraggable(div, f.id);
    wrap.appendChild(div);
  });
  const sig=document.createElement('div');
  sig.className='sov'; sig.id='sov-main';
  sig.style.left=S.sigPos.x+'%'; sig.style.top=S.sigPos.y+'%';
  sig.style.width=S.sigSize+'%'; sig.style.height='8%';
  const selSig=S.signatures.find(s=>s.id===S.selectedSigId);
  sig.innerHTML=selSig?`<img src="${selSig.dataUrl}" alt="signature">`:`<div class="sp">✍️ Select a signature below</div>`;
  makeDraggable(sig, 'sig');
  wrap.appendChild(sig);
}

function updateFieldOverlay(fieldId) {
  const el=document.getElementById('fov-'+fieldId);
  if(!el) return;
  const val=S.formData[fieldId];
  el.textContent=val||'[ '+(S.detectedFields.find(f=>f.id===fieldId)||{label:fieldId}).label+' ]';
  el.classList.toggle('empty', !val);
}

function updateSigOverlay() {
  const el=document.getElementById('sov-main');
  if(!el) return;
  const selSig=S.signatures.find(s=>s.id===S.selectedSigId);
  el.innerHTML=selSig?`<img src="${selSig.dataUrl}" alt="signature">`:`<div class="sp">✍️ Select a signature below</div>`;
}

// ─── DRAGGABLE ───────────────────────────────────────────────────────────────
function makeDraggable(el, key) {
  function startDrag(startX, startY) {
    const wrap=document.getElementById('pvwrap');
    const wr=wrap.getBoundingClientRect();
    const er=el.getBoundingClientRect();
    const offX=startX-er.left, offY=startY-er.top;
    function onMove(cx,cy) {
      const nx=((cx-offX-wr.left)/wr.width)*100;
      const ny=((cy-offY-wr.top)/wr.height)*100;
      const px=Math.max(0,Math.min(95,nx)), py=Math.max(0,Math.min(95,ny));
      el.style.left=px+'%'; el.style.top=py+'%';
      if(key==='sig'){S.sigPos.x=px;S.sigPos.y=py;}else{S.fieldPositions[key]={x:px,y:py};}
    }
    function onMouseMove(e){onMove(e.clientX,e.clientY);}
    function onTouchMove(e){e.preventDefault();const t=e.touches[0];onMove(t.clientX,t.clientY);}
    function onUp(){window.removeEventListener('mousemove',onMouseMove);window.removeEventListener('mouseup',onUp);window.removeEventListener('touchmove',onTouchMove);window.removeEventListener('touchend',onUp);}
    window.addEventListener('mousemove',onMouseMove);
    window.addEventListener('mouseup',onUp);
    window.addEventListener('touchmove',onTouchMove,{passive:false});
    window.addEventListener('touchend',onUp);
  }
  el.addEventListener('mousedown',ev=>{ev.preventDefault();startDrag(ev.clientX,ev.clientY);});
  el.addEventListener('touchstart',ev=>{ev.preventDefault();const t=ev.touches[0];startDrag(t.clientX,t.clientY);},{passive:false});
}

function updateSigSize() {
  S.sigSize=parseInt(document.getElementById('sigsize').value);
  document.getElementById('sigsizeval').textContent=S.sigSize;
  const el=document.getElementById('sov-main');
  if(el) el.style.width=S.sigSize+'%';
}

function updateFontSize() {
  S.fontSizeMultiplier=parseInt(document.getElementById('fontsize').value);
  document.getElementById('fontsizeval').textContent=S.fontSizeMultiplier;
}

// ─── FORM RENDERING ──────────────────────────────────────────────────────────
function renderForm() {
  const panel=document.getElementById('form-panel');
  if(!S.detectedFields.length){panel.innerHTML='<div class="empty"><div class="eicon">⏳</div><p>Detecting fields…</p></div>';return;}
  let html=`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;"><div style="font-size:.82rem;font-weight:600;color:var(--P);">Starting Receipt No.</div><input type="number" class="fi" style="width:100px;margin:0;padding:6px;" value="${S.initialReceiptNo}" onchange="S.initialReceiptNo=parseInt(this.value)||1;const el=document.getElementById('fi-receipt_no');if(el){el.value=autoReceiptNo();onField('receipt_no',el.value);}"></div>`;
  S.detectedFields.forEach(f => {
    const val=S.formData[f.id]||'';
    const lbl=`${f.label}${f.label_hi?' <span class="hi">/ '+f.label_hi+'</span>':''}`;
    html+=`<div class="fg"><label class="fl">${lbl}</label>`;
    if(f.type==='amount_words') html+=`<input class="fi" type="text" id="fi-${f.id}" value="${escHtml(val)}" placeholder="Amount in words" oninput="onField('${f.id}',this.value)">`;
    else if(f.type==='amount') html+=`<input class="fi" type="number" id="fi-${f.id}" value="${escHtml(val)}" placeholder="0" oninput="onAmountField('${f.id}',this.value)">`;
    else if(f.type==='date') html+=`<input class="fi" type="date" id="fi-${f.id}" value="${escHtml(val)}" oninput="onField('${f.id}',this.value)">`;
    else if(f.type==='mobile') html+=`<input class="fi" type="tel" id="fi-${f.id}" value="${escHtml(val)}" maxlength="10" placeholder="10-digit number" oninput="onField('${f.id}',this.value)">`;
    else if(f.type==='receipt_no') html+=`<input class="fi" type="text" id="fi-${f.id}" value="${escHtml(val)||autoReceiptNo()}" oninput="onField('${f.id}',this.value)">`;
    else if(f.type==='purpose') html+=`<select class="fi" id="fi-${f.id}" onchange="onField('${f.id}',this.value)"><option value="">Select Category</option><option value="Daan" ${val==='Daan'?'selected':''}>Daan (Donation)</option><option value="Sadasyata" ${val==='Sadasyata'?'selected':''}>Sadasyata (Membership)</option><option value="Other" ${val==='Other'?'selected':''}>Other</option></select>`;
    else html+=`<input class="fi" type="text" id="fi-${f.id}" value="${escHtml(val)}" placeholder="${f.label}" oninput="onField('${f.id}',this.value)">`;
    html+=`</div>`;
  });
  html+=`<hr class="div"><div style="font-size:.82rem;font-weight:600;color:var(--P);margin-bottom:10px;">✍️ Select Signature</div>`;
  if(!S.signatures.length) {
    html+=`<div style="font-size:.82rem;color:var(--TM);margin-bottom:10px;">No signatures uploaded. <button class="btn bo bsm" onclick="setTab('sigs')">Go to Signatures →</button></div>`;
  } else {
    html+=`<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:14px;">`;
    S.signatures.forEach(sig => {
      const sel=S.selectedSigId===sig.id;
      html+=`<div class="sgcard ${sel?'sel':''}" style="padding:8px;" onclick="selectSig('${sig.id}')"><img src="${sig.dataUrl}" alt="${sig.name}" style="height:52px;"><div class="sgname">${sig.name}</div>${sel?'<span class="pill">✓ Selected</span>':''}</div>`;
    });
    html+=`</div>`;
  }
  html+=`<button class="btn bp" style="width:100%;justify-content:center;margin-top:4px;" onclick="finalizeReceipt()">✅ Preview & Enable Download</button>`;
  panel.innerHTML=html;
  S.detectedFields.forEach(f => {
    if(f.type==='receipt_no' && !S.formData[f.id]){const num=autoReceiptNo();S.formData[f.id]=num;updateFieldOverlay(f.id);}
  });
}

function onField(id,val){S.formData[id]=val;updateFieldOverlay(id);setStep(3);}

function onAmountField(id,val) {
  S.formData[id]=val;updateFieldOverlay(id);
  const awField=S.detectedFields.find(f=>f.type==='amount_words');
  if(awField && val){const words=numberToWords(parseFloat(val));S.formData[awField.id]=words;const inp=document.getElementById('fi-'+awField.id);if(inp)inp.value=words;updateFieldOverlay(awField.id);}
}

function selectSig(id){S.selectedSigId=id;setStep(4);updateSigOverlay();renderForm();}

function finalizeReceipt() {
  setStep(5);
  document.getElementById('download-actions').style.display='block';
  document.getElementById('download-actions').scrollIntoView({behavior:'smooth',block:'nearest'});
  showToast('Receipt ready! Download or save to records.','ok');
}

// ─── CANVAS COMPOSITE ───────────────────────────────────────────────────────
function buildCanvas(cb) {
  const tplImg=document.getElementById('tpl-img');
  const W=tplImg.naturalWidth||tplImg.offsetWidth;
  const H=tplImg.naturalHeight||tplImg.offsetHeight;
  const canvas=document.createElement('canvas');
  canvas.width=W; canvas.height=H;
  const ctx=canvas.getContext('2d');
  ctx.drawImage(tplImg,0,0,W,H);
  const fs=Math.round(Math.max(14,W*(S.fontSizeMultiplier/1000)));
  ctx.font=`600 ${fs}px 'DM Sans', Arial`;
  ctx.fillStyle='#111111';
  S.detectedFields.forEach(f => {
    const val=S.formData[f.id]; if(!val) return;
    const pos=S.fieldPositions[f.id]||{x:50,y:50};
    const cx=(pos.x/100)*W, cy=(pos.y/100)*H;
    ctx.fillText(f.type==='date'?formatDate(val):val, cx, cy);
  });
  if(S.selectedSigId) {
    const sig=S.signatures.find(s=>s.id===S.selectedSigId);
    if(sig) {
      const sigImg=new Image();
      sigImg.onload=()=>{const sigW=(S.sigSize/100)*W;const sigH=sigW*0.4;ctx.drawImage(sigImg,(S.sigPos.x/100)*W,(S.sigPos.y/100)*H,sigW,sigH);cb(canvas);};
      sigImg.src=sig.dataUrl; return;
    }
  }
  cb(canvas);
}

function downloadJPG() {
  buildCanvas(canvas=>{const link=document.createElement('a');link.download='receipt_'+(S.formData['name']||'receipt').replace(/\s+/g,'_')+'_'+Date.now()+'.jpg';link.href=canvas.toDataURL('image/jpeg',0.92);link.click();showToast('JPG downloaded!','ok');});
}

function downloadPDF() {
  buildCanvas(canvas=>{const{jsPDF}=window.jspdf;const imgData=canvas.toDataURL('image/jpeg',0.92);const orientation=canvas.width>canvas.height?'l':'p';const pdf=new jsPDF({orientation,unit:'px',format:[canvas.width,canvas.height]});pdf.addImage(imgData,'JPEG',0,0,canvas.width,canvas.height);pdf.save('receipt_'+(S.formData['name']||'receipt').replace(/\s+/g,'_')+'_'+Date.now()+'.pdf');showToast('PDF downloaded!','ok');});
}

// ─── SAVE RECORD ─────────────────────────────────────────────────────────────
function saveRecord() {
  const name=S.formData['name']||S.formData['naam']||'Unknown';
  const amount=S.formData['amount']||'';
  const date=S.formData['date']?formatDate(S.formData['date']):new Date().toLocaleDateString('en-IN');
  const id='rec_'+Date.now();
  buildCanvas(canvas=>{
    const thumb=canvas.toDataURL('image/jpeg',0.6);
    S.records.push({id,name,amount,date,formData:{...S.formData},fields:S.detectedFields.map(f=>({id:f.id,label:f.label})),thumbnail:thumb,createdAt:new Date().toISOString()});
    S.records.sort((a,b)=>a.name.localeCompare(b.name));
    saveRecords();
    showToast('✅ Record saved under "'+name+'"','ok');
  });
}

// ─── RECORDS RENDERING ──────────────────────────────────────────────────────
function renderRecords() {
  const container=document.getElementById('records-container');
  const q=(document.getElementById('rec-search')?.value||'').toLowerCase();
  const cat=(document.getElementById('rec-category-filter')?.value||'');
  let recs=S.records.filter(r=>{
    const matchQ = !q || r.name.toLowerCase().includes(q);
    const p = r.formData.purpose || '';
    const matchCat = !cat || p === cat || (cat==='Other' && p !== 'Daan' && p !== 'Sadasyata');
    return matchQ && matchCat;
  });
  recs.sort((a,b)=>a.name.localeCompare(b.name));
  if(!recs.length){container.innerHTML=`<div class="empty" style="padding:60px"><div class="eicon">📚</div><p>${(q||cat)?'No matching records.':'No records saved yet.<br>Generate a receipt and click Save.'}</p></div>`;return;}
  let html=`<table class="rtbl"><thead><tr><th>Name</th><th>Amount</th><th>Date</th><th>Fields</th><th>Actions</th></tr></thead><tbody>`;
  recs.forEach(r=>{html+=`<tr><td class="nc">👤 ${escHtml(r.name)}</td><td>${r.amount?'₹'+escHtml(r.amount):'—'}</td><td>${escHtml(r.date)}</td><td><span class="badge bgp">${(r.fields||[]).length} fields</span></td><td style="display:flex;gap:6px;flex-wrap:wrap;"><button class="btn bo bsm" onclick="viewRecord('${r.id}')">👁 View</button><button class="btn bd bsm" onclick="deleteRecord('${r.id}')">🗑</button></td></tr>`;});
  html+=`</tbody></table>`;
  container.innerHTML=html;
}

function viewRecord(id) {
  const r=S.records.find(x=>x.id===id); if(!r) return;
  document.getElementById('modal-title').textContent='📄 Receipt — '+r.name;
  let html='';
  if(r.thumbnail) html+=`<img src="${r.thumbnail}" style="width:100%;border-radius:8px;margin-bottom:16px;border:1px solid var(--B);">`;
  html+=`<table style="width:100%;border-collapse:collapse;">`;
  (r.fields||[]).forEach(f=>{const val=(r.formData||{})[f.id];if(!val)return;html+=`<tr><td style="padding:8px 10px;font-size:.82rem;font-weight:600;color:var(--TM);width:40%;border-bottom:1px solid var(--B);">${f.label}</td><td style="padding:8px 10px;font-size:.88rem;border-bottom:1px solid var(--B);">${escHtml(val)}</td></tr>`;});
  html+=`</table><div style="margin-top:18px;display:flex;gap:10px;flex-wrap:wrap;"><button class="btn bp" onclick="downloadRecordJPG('${id}')">⬇ JPG</button><button class="btn bo" onclick="closeModal()">Close</button></div>`;
  document.getElementById('modal-body').innerHTML=html;
  document.getElementById('modal-backdrop').style.display='flex';
}

function downloadRecordJPG(id){const r=S.records.find(x=>x.id===id);if(!r||!r.thumbnail)return;const link=document.createElement('a');link.download='receipt_'+r.name.replace(/\s+/g,'_')+'.jpg';link.href=r.thumbnail;link.click();showToast('JPG downloaded!','ok');}
function deleteRecord(id){if(!confirm('Delete this record?'))return;S.records=S.records.filter(r=>r.id!==id);saveRecords();renderRecords();showToast('Record deleted.','');}
function closeModal(){document.getElementById('modal-backdrop').style.display='none';}

// ─── SIGNATURES ──────────────────────────────────────────────────────────────
function uploadSignature(file) {
  if(!file) return;
  const reader=new FileReader();
  reader.onload=e=>{
    const sig={id:'sig_'+Date.now(),name:file.name.replace(/\.[^.]+$/,''),dataUrl:e.target.result,uploadedAt:new Date().toISOString()};
    S.signatures.push(sig); saveSigs(); renderSigs();
    showToast('Signature "'+sig.name+'" uploaded!','ok');
  };
  reader.readAsDataURL(file);
}

function deleteSig(id){S.signatures=S.signatures.filter(s=>s.id!==id);if(S.selectedSigId===id)S.selectedSigId=null;saveSigs();renderSigs();showToast('Signature deleted.','');}

function renderSigs() {
  const grid=document.getElementById('sig-grid');
  const count=document.getElementById('sig-count');
  if(!grid) return;
  if(count) count.textContent=S.signatures.length;
  if(!S.signatures.length){grid.innerHTML='<div class="empty"><div class="eicon">✍️</div><p>No signatures yet.<br>Upload one above.</p></div>';return;}
  grid.innerHTML=S.signatures.map(s=>`<div class="sgcard ${S.selectedSigId===s.id?'sel':''}"><button class="sgdel" onclick="deleteSig('${s.id}')">✕</button><img src="${s.dataUrl}" alt="${s.name}"><div class="sgname">${s.name}</div>${S.selectedSigId===s.id?'<span class="pill">✓ In use</span>':''}</div>`).join('');
}

// ─── UTILITIES ───────────────────────────────────────────────────────────────
function showToast(msg,type=''){const old=document.querySelector('.toast');if(old)old.remove();const t=document.createElement('div');t.className='toast'+(type==='ok'?' ok':type==='err'?' err':'');t.innerHTML=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),3500);}
function escHtml(s){if(s===null||s===undefined)return '';return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function autoReceiptNo(){return 'REC-'+String(S.initialReceiptNo+S.records.length).padStart(4,'0');}
function formatDate(d){if(!d)return '';if(d.includes('-')&&d.length===10){const[y,m,dd]=d.split('-');return `${dd}/${m}/${y}`;}return d;}

function numberToWords(num) {
  if(isNaN(num)||num===''||num===null) return '';
  num=parseFloat(num); if(num===0) return 'Zero Only';
  const ones=['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const tens=['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  function t(n){if(n<20)return ones[n];return tens[Math.floor(n/10)]+(n%10?' '+ones[n%10]:'');}
  function h(n){if(n<100)return t(n);return ones[Math.floor(n/100)]+' Hundred'+(n%100?' '+t(n%100):'');}
  let r='';
  const paise=Math.round((num%1)*100);
  num=Math.floor(num);
  if(num>=10000000){r+=h(Math.floor(num/10000000))+' Crore ';num%=10000000;}
  if(num>=100000){r+=h(Math.floor(num/100000))+' Lakh ';num%=100000;}
  if(num>=1000){r+=h(Math.floor(num/1000))+' Thousand ';num%=1000;}
  if(num>0){r+=h(num);}
  r=r.trim();
  if(paise>0) r+=' and '+t(paise)+' Paise';
  return r+' Only';
}

// ─── INIT ────────────────────────────────────────────────────────────────────
loadState();
