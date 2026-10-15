/* NYCU Research Explorer — data is served as five editable JSON files. */
'use strict';
let S;
const DATA_PATHS = {
  databases: './data/databases.json',
  groups: './data/groups.json',
  units: './data/units.json',
  questions: './data/questions.json',
  site: './data/site.json'
};
async function fetchProjectData() {
  const entries = await Promise.all(Object.entries(DATA_PATHS).map(async ([key, path]) => {
    const response = await fetch(path, {cache: 'no-cache'});
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
    return [key, await response.json()];
  }));
  return Object.fromEntries(entries);
}
function basicDataCheck(d) {
  if (!Array.isArray(d.databases) || !Array.isArray(d.groups) ||
      !Array.isArray(d.units) || !Array.isArray(d.questions) ||
      !Array.isArray(d.site.clusters) || !Array.isArray(d.site.commonTools) ||
      !d.site.styles || d.groups.length < 6) {
    throw new Error('資料集欄位不完整；請先執行 python scripts/validate_data.py');
  }
  if (d.databases.some(db => !db || typeof db.display !== 'boolean')) {
    throw new Error('資料庫缺少有效 display 布林值；請先執行 python scripts/validate_data.py');
  }
}
// display is a public-interface switch, not an access-control or licensing status.
// Keep hidden entries in databases.json, but never expose them as clickable resources.
function stateFromData(d) {
  const visibleDbMap = new Map(d.databases.filter(db => db.display === true)
    .map(db => [db.database_id, db]));
  // Hide a platform group only when none of its databases is visible.
  const visibleGroups = d.groups.filter(group => group.databaseIds.some(id => visibleDbMap.has(id)));
  const visibleTools = d.site.commonTools.filter(tool => tool.databaseIds.some(id => visibleDbMap.has(id)));
  return {
    ...d.site,
    commonTools: visibleTools,
    groups: visibleGroups, units: d.units, questions: d.questions,
    dbs: d.databases,
    dbMap: visibleDbMap,
    groupMap: new Map(visibleGroups.map(group => [group.id, group])),
    unit: null, answers: {}, qi: 0, result: null, cluster: '全部', browse: '全部'
  };
}
async function bootstrap() {
  try {
    const d = await fetchProjectData();
    basicDataCheck(d);
    S = stateFromData(d);
    if (S.groups.length < 6) {
      throw new Error('display=true 的資源群組少於六個，無法提供 3＋2＋1 結果');
    }
    $('#browseCount').textContent = S.groups.length;
    $('#start').disabled = false;
    $('#browse').disabled = false;
    init();
  } catch (error) {
    console.error('研究資源資料載入失敗', error);
    const node = $('#loadError');
    node.textContent = '研究資源資料載入失敗。請透過 GitHub Pages 或本機 HTTP 伺服器開啟網站，並確認 data/ 內五個 JSON 檔案均已上傳。';
    node.classList.remove('hidden');
  }
}
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];document.addEventListener('DOMContentLoaded', bootstrap);function init(){bind();renderCluster();renderUnits();renderBrowseFilters();renderBrowse();queryUnit();if(readStoredRoute())$('#resume').classList.remove('hidden')}function bind(){$('#start').onclick=()=>show('unitsView');$('#browse').onclick=()=>show('browseView');$('#search').oninput=renderUnits;$('#prev').onclick=prevQ;$('#next').onclick=nextQ;$('#restart').onclick=reset;$('#change').onclick=()=>show('unitsView');$('#copy').onclick=copyResult;$('#download').onclick=downloadResult;$('#resume').onclick=resume;$$('[data-back]').forEach(b=>b.onclick=()=>show(b.dataset.back));$('#dlgClose').onclick=()=>$('#dlg').close()}function show(id){$$('.view').forEach(v=>v.classList.toggle('active',v.id===id));scrollTo({top:0,behavior:'smooth'})}function renderCluster(){const arr=['全部',...S.clusters];$('#cluster').innerHTML=arr.map(x=>`<button class="chip ${x===S.cluster?'on':''}" data-c="${esc(x)}">${esc(x)}</button>`).join('');$$('[data-c]').forEach(b=>b.onclick=()=>{S.cluster=b.dataset.c;renderCluster();renderUnits()})}function renderUnits(){const q=$('#search').value.trim().toLowerCase();const list=S.units.filter(u=>(S.cluster==='全部'||u.cluster===S.cluster)&&(!q||[u.name,u.cluster,...u.keywords].join(' ').toLowerCase().includes(q)));$('#unitGrid').innerHTML=list.map(u=>`<button class="unit" data-u="${u.id}"><small>${esc(u.cluster)}</small><strong>${esc(u.name)}</strong></button>`).join('')||'<p>找不到符合的教學單位。</p>';$$('[data-u]').forEach(b=>b.onclick=()=>{S.unit=S.units.find(u=>u.id===b.dataset.u);startQuiz()})}function startQuiz(){if(!S.unit)return show('unitsView');S.answers={};S.qi=0;$('#unitName').textContent=S.unit.name;renderQ();show('quizView')}function renderQ(){const q=S.questions[S.qi],sel=S.answers[q.id];$('#qcard').innerHTML=`<span class="qnum">${String(S.qi+1).padStart(2,'0')}</span><h3>${esc(q.title)}</h3><p class="qhelp">${esc(q.help||'')}</p><div class="options">${q.options.map(o=>`<button class="opt ${sel===o.value?'on':''}" data-o="${esc(o.value)}">${o.icon?`<span class="ico">${esc(o.icon)}</span>`:''}<span>${esc(o.label)}</span></button>`).join('')}</div>`;$$('[data-o]').forEach(b=>b.onclick=()=>{S.answers[q.id]=b.dataset.o;renderQ()});$('#bar').style.width=`${(S.qi+1)/S.questions.length*100}%`;$('#ptext').textContent=`第 ${S.qi+1} 題，共 ${S.questions.length} 題`;$('#prev').disabled=S.qi===0;$('#next').disabled=!S.answers[q.id];$('#next').textContent=S.qi===S.questions.length-1?'查看結果':'下一題'}function prevQ(){if(S.qi>0){S.qi--;renderQ()}}function nextQ(){const q=S.questions[S.qi];if(!S.answers[q.id])return;if(S.qi<S.questions.length-1){S.qi++;renderQ()}else buildResult()}function styleId(){const d=S.answers.information==='concrete',p=S.answers.process==='plan';return d&&p?'route':d&&!p?'field':!d&&p?'map':'spark'}function rank(style){const base=new Set(S.unit.baseGroups),a=S.answers;return S.groups.map(g=>{let score=0,r=[];if(base.has(g.id)){score+=35;r.push(`符合${S.unit.name}常見需求`)}if(g.needs.includes(a.need)){score+=35;r.push('對應你想完成的研究任務')}if(g.stages.includes(a.stage)){score+=15;r.push('適合目前研究階段')}if(g.materials.includes(a.material)){score+=12;r.push('包含你需要的資料類型')}if(style.boostCategories.includes(g.category))score+=4;if(a.judgement==='method'&&[C3,C2,C4].includes(g.category))score+=3;if(a.judgement==='impact'&&[C6,C5,C1].includes(g.category))score+=3;return{...g,score,reasons:r.slice(0,3)}}).sort((x,y)=>y.score-x.score||x.number-y.number)}const C1='綜合學術與大型出版平台',C2='理工與研究方法',C3='數據、財經與產業情報',C4='醫學與健康',C5='法律與爭端解決',C6='臺灣與華文資源';function buildResult(){const sid=styleId(),style=S.styles[sid],all=rank(style),core=all.slice(0,3),ext=[];for(const g of all.slice(3)){if(!core.some(x=>x.id===g.id)&&(!ext.some(x=>x.category===g.category)||ext.length>=1))ext.push(g);if(ext.length===2)break}const used=new Set([...core,...ext].map(x=>x.id)),cand=all.filter(x=>!used.has(x.id)&&x.score>0),surprise=cand[hash([S.unit.id,...Object.values(S.answers)].join('|'))%Math.min(cand.length,8)]||all.find(x=>!used.has(x.id));S.result={style,core,ext,surprise,unit:S.unit,answers:{...S.answers}};saveRoute(JSON.stringify({sid,unit:S.unit.id,answers:S.answers}));renderResult();show('resultView')}function renderResult(){const r=S.result;$('#rname').textContent=r.style.name;$('#rcode').textContent=r.style.code;$('#comp').textContent=r.style.code;$('#rtag').textContent=r.style.tagline;$('#rdesc').textContent=r.style.description;$('#coreCards').innerHTML=r.core.map((g,i)=>card(g,i+1,'核心平台')).join('');$('#extCards').innerHTML=r.ext.map((g,i)=>card(g,i+4,'延伸平台')).join('');$('#surprise').innerHTML=`<div class="badge">意外<br>探索</div><div><h4>${esc(r.surprise.name)}</h4><p>${esc(r.surprise.description)}</p></div><button class="secondary" data-open="${r.surprise.id}">翻開資源</button>`;bindOpen();renderChallenge(r.core[0]);renderTools()}function card(g,rank,label){return`<article class="card" data-rank="${rank}"><small>${esc(label)}・${esc(g.category)}</small><h4>${esc(g.name)}</h4><p>${esc(g.description)}</p><p class="why">${esc(g.reasons[0]||'與你的研究需求相關')}</p><button data-open="${g.id}">查看入口與理由 →</button></article>`}function bindOpen(){$$('[data-open]').forEach(b=>b.onclick=()=>openGroup(S.groupMap.get(b.dataset.open)))}function renderChallenge(g){const d=S.dbMap.get(g.primaryDatabaseId)||g.databaseIds.map(id=>S.dbMap.get(id)).find(Boolean);$('#task').textContent=`${S.result.style.taskTone}：${challenge(g)}`;$('#taskLinks').innerHTML=`${d?`<a class="primary" href="${attr(d.permalink)}" target="_blank" rel="noopener">開啟 ${esc(d.name)} ↗</a>`:''}<button class="secondary" data-open="${g.id}">查看同群資源</button>`;bindOpen()}function challenge(g){if(['wrds','tej'].includes(g.id))return'找到一家公司、股票或經濟指標，確認資料年代與欄位。';if(g.id==='patent-tech')return'搜尋一項技術名稱，觀察專利申請人、年份或分類。';if(g.category===C5)return'找到一筆相關法規、判例、期刊文章或仲裁資料。';if(g.category===C4)return'搜尋一項健康主題，辨認平台提供的資料類型。';if(g.category===C3)return'找到一筆可比較或分析的數據、公司資料或產業報告。';if(g.category===C2)return'搜尋一項技術或方法，找到近五年的文獻、標準或流程。';if(g.category===C6)return'輸入一個人物、事件或主題，找到一筆臺灣或華文材料。';return'輸入一個研究關鍵字，找到近五年的文獻並記下題名。'}function renderTools(){$('#commonToolsSection').classList.toggle('hidden',S.commonTools.length===0);$('#tools').innerHTML=S.commonTools.map(t=>`<article class="tool"><h4>${esc(t.name)}</h4><p>${esc(t.description)}</p><button data-tool="${t.id}">查看工具入口 →</button></article>`).join('');$$('[data-tool]').forEach(b=>b.onclick=()=>openTool(S.commonTools.find(t=>t.id===b.dataset.tool)))}function openGroup(g){$('#dcat').textContent=g.category;$('#dtitle').textContent=g.name;$('#ddesc').textContent=g.description;$('#dreasons').innerHTML=`<b>適合用途：</b>${esc(g.keywords.join('、'))}`;resources(g.databaseIds);$('#dlg').showModal()}function openTool(t){$('#dcat').textContent='全校共通研究工具';$('#dtitle').textContent=t.name;$('#ddesc').textContent=t.description;$('#dreasons').innerHTML='<b>使用方式：</b>選擇下方實際工具入口。';resources(t.databaseIds);$('#dlg').showModal()}function resources(ids){const rs=ids.map(i=>S.dbMap.get(i)).filter(Boolean);$('#reslist').innerHTML=rs.map(d=>`<div class="res"><div><strong>${esc(d.name)}</strong><span>${esc(trunc(d.short_description||d.resource_type,105))}</span></div><a href="${attr(d.permalink)}" target="_blank" rel="noopener">圖書館入口 ↗</a></div>`).join('')||'<p>目前沒有可公開顯示的有效入口。</p>'}function renderBrowseFilters(){const cats=['全部',...new Set(S.groups.map(g=>g.category))];$('#browseFilters').innerHTML=cats.map(c=>`<button class="chip ${c===S.browse?'on':''}" data-bc="${esc(c)}">${esc(c)}</button>`).join('');$$('[data-bc]').forEach(b=>b.onclick=()=>{S.browse=b.dataset.bc;renderBrowseFilters();renderBrowse()})}function renderBrowse(){const gs=S.groups.filter(g=>S.browse==='全部'||g.category===S.browse);$('#browseGrid').innerHTML=gs.map(g=>`<article class="browsecard"><p class="eyebrow">${String(g.number).padStart(2,'0')}・${esc(g.category)}</p><h3>${esc(g.name)}</h3><p>${esc(g.description)}</p><button data-bg="${g.id}">查看入口 →</button></article>`).join('');$$('[data-bg]').forEach(b=>b.onclick=()=>openGroup(S.groupMap.get(b.dataset.bg)))}function summary(){const r=S.result;return['NYCU 圖書館研究資源探索',`結果代碼：${r.style.code}`,`研究探索風格：${r.style.name}`,`教學單位：${r.unit.name}`,'','核心平台：',...r.core.map((g,i)=>`${i+1}. ${g.name}`),'','延伸平台：',...r.ext.map((g,i)=>`${i+1}. ${g.name}`),'',`意外探索：${r.surprise.name}`].join('\n')}async function copyResult(){try{await navigator.clipboard.writeText(summary());toast('已複製結果摘要')}catch{toast('瀏覽器無法複製，請使用下載功能')}}function downloadResult(){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([summary()],{type:'text/plain;charset=utf-8'}));a.download=`NYCU研究路線_${S.result.style.code}.txt`;a.click();URL.revokeObjectURL(a.href);toast('已產生研究路線檔案')}function resume(){try{const x=JSON.parse(readStoredRoute());S.unit=S.units.find(u=>u.id===x.unit);S.answers=x.answers;buildResult()}catch{reset()}}function reset(){removeStoredRoute();S.unit=null;S.answers={};S.result=null;$('#resume').classList.add('hidden');show('welcomeView')}function queryUnit(){const p=new URLSearchParams(location.search),id=p.get('unit'),u=S.units.find(x=>x.id===id);if(u){S.unit=u;if(p.get('auto')==='1')startQuiz()}}function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('show'),2000)}function hash(s){let h=0;for(let i=0;i<s.length;i++){h=((h<<5)-h)+s.charCodeAt(i);h|=0}return Math.abs(h)}function trunc(s,n){s=String(s||'').replace(/\s+/g,' ').trim();return s.length>n?s.slice(0,n)+'…':s}function esc(v){return String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;')}function attr(v){return esc(/^https:\/\//i.test(String(v||''))?v:'#')}
// Local storage can be unavailable (browser policy/private mode); keep explorer usable.
function readStoredRoute() { try { return localStorage.getItem('nycu-route'); } catch { return null; } }
function saveRoute(value) { try { localStorage.setItem('nycu-route', value); } catch { /* optional */ } }
function removeStoredRoute() { try { localStorage.removeItem('nycu-route'); } catch { /* optional */ } }
