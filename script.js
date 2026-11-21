const THR=75, SUBJ=[
 {id:'DS',name:'Data Structures',fac:'Dr. Rao'},{id:'DBMS',name:'Database Systems',fac:'Prof. Iyer'},
 {id:'OS',name:'Operating Systems',fac:'Dr. Khan'},{id:'CN',name:'Computer Networks',fac:'Prof. Mehta'},
 {id:'MA',name:'Engineering Maths',fac:'Dr. Sen'}];
const NAMES=['Aarav Sharma','Rahul Verma','Priya Nair','Karthik Reddy','Sneha Gupta','Vikram Singh','Ananya Iyer','Rohan Mehta','Divya Menon','Arjun Patel','Neha Joshi','Siddharth Rao','Pooja Kulkarni','Aditya Kumar','Ishita Bose','Manish Yadav','Kavya Pillai','Harsh Agarwal','Meera Das','Nikhil Chopra','Shruti Desai','Varun Malhotra','Tanvi Shah','Yash Thakur','Lakshmi Naidu','Deepak Jain','Riya Kapoor','Sameer Khan','Aditi Bhat','Gaurav Mishra'];
// target attendance out of 16 per subject [DS,DBMS,OS,CN,MA]; edge cases near 75% (12/16)
const TARGET={1:[10,13,14,12,15],2:[15,15,14,16,15],3:[11,12,13,14,10],5:[9,13,12,11,14],9:[12,11,13,12,15],
 13:[8,14,15,13,12],17:[14,10,12,15,11],21:[11,9,14,13,12],26:[10,12,11,16,13],28:[13,12,9,14,10]};
let S,view={tab:'dash',sel:null,f:'All',q:'',sub:'DS',draft:{}},role='mentor';

function seed(){
  const st=NAMES.map((n,i)=>{const t=TARGET[i]||SUBJ.map((_,j)=>Math.min(16,13+((i*7+j*3)%4)));
    const rec={};SUBJ.forEach((s,j)=>rec[s.id]={h:16,a:t[j]});
    const f=n.split(' ')[0].toLowerCase();
    return{id:i+1,name:n,roll:'21CS'+String(101+i),email:f+'@univ.edu',parent:f+'.parent@mail.com',rec}});
  return{students:st,notes:[],emails:[],sessions:[]};
}
function load(){try{const r=localStorage.getItem('attendalert');if(r)return JSON.parse(r)}catch(e){}return seed()}
function save(){try{localStorage.setItem('attendalert',JSON.stringify(S))}catch(e){}}
S=load();

const pct=r=>r.h?r.a/r.h*100:100;
const tier=p=>p>=75?'Safe':p>=65?'Warning':'Critical';
const need=r=>pct(r)>=THR?0:Math.ceil((0.75*r.h-r.a)/0.25);
const spare=r=>Math.max(0,Math.floor(r.a/0.75-r.h)); // classes that can still be missed
function overall(s){let h=0,a=0;SUBJ.forEach(j=>{h+=s.rec[j.id].h;a+=s.rec[j.id].a});return{h,a}}
function worst(s){let w=null;SUBJ.forEach(j=>{const p=pct(s.rec[j.id]);if(!w||p<w.p)w={p,sub:j}});return w}
const badge=p=>`<span class="b ${tier(p)}">${tier(p)}</span>`;
const col=p=>p>=75?'var(--ok)':p>=65?'var(--wa)':'var(--cr)';
const bar=p=>`<div class="bar"><i style="width:${Math.min(100,p)}%;background:${col(p)}"></i></div>`;
const f1=p=>p.toFixed(1)+'%';

function atRisk(){return S.students.map(s=>({s,w:worst(s)})).filter(x=>x.w.p<THR).sort((a,b)=>a.w.p-b.w.p)}
function sendMail(s,sub,p){
  const r=s.rec[sub.id];
  S.emails.unshift({t:new Date().toLocaleString(),to:`${s.email}, ${s.parent}`,subject:`CRITICAL attendance shortage – ${sub.name}`,
   body:`Dear ${s.name} / Parent,\n\nAttendance in ${sub.name} is ${f1(p)} (${r.a}/${r.h}), below the mandatory 75%. Attend the next ${need(r)} consecutive classes to regain eligibility for semester exams.\n\n– AttendAlert (simulated)`});
}

function setRole(v){role=v;view.sel=null;render()}
function roleOpts(){return `<option value="mentor">Mentor / Faculty view</option>`+S.students.map(s=>`<option value="${s.id}">Student: ${s.name}</option>`).join('')}
function resetData(){if(confirm('Reset all demo data?')){S=seed();save();render()}}

/* ---------- Mentor views ---------- */
function dash(){
  const all=S.students.map(s=>worst(s)),cr=all.filter(w=>w.p<65).length,wa=all.filter(w=>w.p>=65&&w.p<75).length,sf=all.length-cr-wa;
  const q=view.q.toLowerCase();
  const rows=S.students.map(s=>({s,w:worst(s),o:overall(s)})).filter(x=>(view.f==='All'||tier(x.w.p)===view.f)&&(x.s.name.toLowerCase().includes(q)||x.s.roll.toLowerCase().includes(q))).sort((a,b)=>a.w.p-b.w.p);
  return `${cr?`<div class="banner">⚠ ${cr} Student${cr>1?'s':''} in Critical Shortage (&lt;65%)</div>`:''}
  <div class="grid" style="margin-bottom:14px">
   <div class="stat"><span class="mu">Students</span><b>${S.students.length}</b></div>
   <div class="stat Safe"><span>Safe (≥75%)</span><b>${sf}</b></div>
   <div class="stat Warning"><span>Warning (65–74%)</span><b>${wa}</b></div>
   <div class="stat Critical"><span>Critical (&lt;65%)</span><b>${cr}</b></div></div>
  <div class="card"><h2>Students (tier = weakest subject)</h2>
   <div class="row"><input placeholder="Search name / roll" value="${view.q}" oninput="view.q=this.value;render(1)">
   ${['All','Critical','Warning','Safe'].map(t=>`<button class="${view.f===t?'on':''}" onclick="view.f='${t}';render()">${t}</button>`).join('')}</div>
   <div class="tw"><table><tr><th>Roll</th><th>Name</th><th>Overall</th><th>Weakest subject</th><th>%</th><th>Risk</th><th>Recovery</th></tr>
   ${rows.map(({s,w,o})=>`<tr><td>${s.roll}</td><td><a class="l" onclick="view.sel=${s.id};render()">${s.name}</a></td><td>${f1(o.a/o.h*100)}</td><td>${w.sub.name}</td><td>${f1(w.p)}</td><td>${badge(w.p)}</td><td>${need(s.rec[w.sub.id])?`attend next ${need(s.rec[w.sub.id])}`:'—'}</td></tr>`).join('')}</table></div></div>`;
}
function detail(s){
  return `<div class="card"><button onclick="view.sel=null;render()">← Back</button>
  <h2 style="margin-top:12px">${s.name} <span class="mu">(${s.roll})</span></h2>${subjTable(s)}
  <h2 style="margin-top:16px">Log Mentoring Intervention</h2>
  <div class="row"><input id="note" style="flex:1;min-width:200px" placeholder="Counseling notes…"><button class="pri" onclick="addNote(${s.id})">Log Mentoring Intervention</button></div>
  ${S.notes.filter(n=>n.sid===s.id).map(n=>`<div class="mail" style="border-color:var(--pr)"><span class="mu">${n.t}</span><br>${n.text.replace(/</g,'&lt;')}</div>`).join('')||'<p class="mu">No interventions logged yet.</p>'}</div>`;
}
function subjTable(s){
  return `<div class="tw"><table><tr><th>Subject</th><th>Attended / Held</th><th>%</th><th></th><th>Status</th><th>Recovery estimate</th></tr>
  ${SUBJ.map(j=>{const r=s.rec[j.id],p=pct(r),n=need(r);return `<tr><td>${j.name}</td><td>${r.a}/${r.h}</td><td>${f1(p)}</td><td>${bar(p)}</td><td>${badge(p)}</td>
  <td>${n?`Must attend next <b>${n}</b> consecutive classes to reach 75%`:`Can miss ${spare(r)} more class${spare(r)==1?'':'es'}`}</td></tr>`}).join('')}</table></div>`;
}
function addNote(id){const v=document.getElementById('note').value.trim();if(!v)return;S.notes.unshift({sid:id,t:new Date().toLocaleString(),text:v});save();render()}

function mark(){
  const j=SUBJ.find(x=>x.id===view.sub);
  return `<div class="card"><h2>Mark Attendance</h2><div class="row">
   <select onchange="view.sub=this.value;view.draft={};render()">${SUBJ.map(x=>`<option value="${x.id}" ${x.id===view.sub?'selected':''}>${x.name} – ${x.fac}</option>`).join('')}</select>
   <input type="date" id="dt" value="${new Date().toISOString().slice(0,10)}">
   <button onclick="allP()">Mark All Present</button><button class="pri" onclick="saveAtt()">Save session</button></div>
   <p class="mu">Default is Present – tap Absent/Late only for exceptions. Late counts as attended.</p>
   <div class="tw"><table><tr><th>Roll</th><th>Name</th><th>Now</th><th>Status</th></tr>
   ${S.students.map(s=>{const d=view.draft[s.id]||'P',p=pct(s.rec[j.id]);return `<tr><td>${s.roll}</td><td>${s.name}</td><td>${f1(p)} ${badge(p)}</td>
   <td class="tg">${['P','A','L'].map(k=>`<button class="${k} ${d===k?'on':''}" onclick="view.draft[${s.id}]='${k}';render(1)">${{P:'Present',A:'Absent',L:'Late'}[k]}</button>`).join('')}</td></tr>`}).join('')}</table></div></div>`;
}
function allP(){view.draft={};render()}
function saveAtt(){
  const j=SUBJ.find(x=>x.id===view.sub),date=document.getElementById('dt').value,newCrit=[];
  S.students.forEach(s=>{const r=s.rec[j.id],before=pct(r),d=view.draft[s.id]||'P';r.h++;if(d!=='A')r.a++;
    if(before>=65&&pct(r)<65){sendMail(s,j,pct(r));newCrit.push(s.name)}});
  S.sessions.push({sub:j.id,date});view.draft={};save();render();
  alert(newCrit.length?`Session saved. ${newCrit.length} student(s) dropped into CRITICAL: ${newCrit.join(', ')}. Simulated emails sent – see Alerts tab.`:'Session saved.');
}
function alerts(){
  const ar=atRisk();
  return `<div class="card"><h2>Mentor Notification Hub – ${ar.length} at-risk students</h2><div class="tw"><table>
  <tr><th>Student</th><th>Subject</th><th>%</th><th>Risk</th><th>Action needed</th><th></th></tr>
  ${ar.map(({s,w})=>`<tr><td><a class="l" onclick="view.sel=${s.id};view.tab='dash';render()">${s.name}</a></td><td>${w.sub.name}</td><td>${f1(w.p)}</td><td>${badge(w.p)}</td>
  <td>Attend next ${need(s.rec[w.sub.id])} classes</td><td>${tier(w.p)==='Critical'?`<button onclick="manualMail(${s.id},'${w.sub.id}')">Send email alert</button>`:''}</td></tr>`).join('')}</table></div></div>
  <div class="card"><h2>Simulated Email Outbox (${S.emails.length})</h2>${S.emails.map(m=>`<div class="mail"><span class="mu">${m.t} → ${m.to}</span><br><b>${m.subject}</b><pre>${m.body}</pre></div>`).join('')||'<p class="mu">No emails yet. Mark a student absent until they turn Critical, or press “Send email alert”.</p>'}</div>`;
}
function manualMail(id,sid){const s=S.students.find(x=>x.id===id),j=SUBJ.find(x=>x.id===sid);sendMail(s,j,pct(s.rec[sid]));save();render()}

function mentor(){
  const tabs=[['dash','Dashboard'],['mark','Mark Attendance'],['alerts','Alerts & Emails']];
  const s=view.sel&&S.students.find(x=>x.id===view.sel);
  return `<nav>${tabs.map(([k,l])=>`<button class="${view.tab===k?'on':''}" onclick="view.tab='${k}';view.sel=null;render()">${l}</button>`).join('')}</nav>`+
   (s?detail(s):view.tab==='dash'?dash():view.tab==='mark'?mark():alerts());
}
function student(id){
  const s=S.students.find(x=>x.id==id),o=overall(s),w=worst(s),crit=SUBJ.filter(j=>pct(s.rec[j.id])<75);
  return `<div class="card"><h2>Welcome, ${s.name} <span class="mu">(${s.roll})</span></h2>
  <div class="grid"><div class="stat"><span class="mu">Overall</span><b>${f1(o.a/o.h*100)}</b></div><div class="stat ${tier(w.p)}"><span>Status</span><b>${tier(w.p)}</b></div></div></div>
  ${crit.length?`<div class="banner">Shortage warning: ${crit.map(j=>`${j.name} (${f1(pct(s.rec[j.id]))})`).join(', ')}. You risk being detained from semester exams.</div>`:''}
  <div class="card"><h2>My attendance by subject</h2>${subjTable(s)}<p class="mu">This is your private dashboard – other students' data is not visible.</p></div>`;
}
function render(keepFocus){
  const sel=document.getElementById('role');sel.innerHTML=roleOpts();sel.value=role;
  const ae=document.activeElement,id=ae&&ae.tagName==='INPUT'&&ae.placeholder?ae.placeholder:null,pos=ae&&ae.selectionStart;
  document.getElementById('app').innerHTML=role==='mentor'?mentor():student(role);
  if(id){const e=[...document.querySelectorAll('input')].find(i=>i.placeholder===id);if(e){e.focus();try{e.setSelectionRange(pos,pos)}catch(x){}}}
}
render();
