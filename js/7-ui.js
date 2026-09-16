/* 7-ui.js — UI · 화면 · 씬 · 탭 · 엔딩  (v3.0 Phase 1)
   v2.1에서 [32]가 통째로 덮어쓰고 있던 죽은 코드 231줄을 제거했다.
   시간/루프/월간 행동은 6-calendar.js 로 분리됐다.
   ※ 6-calendar.js 다음에 로드되어야 한다 (G / advance 참조). */
"use strict";

/* ==========================================================================
   [14] UI — 렌더링
   ========================================================================== */
/* v3.0 — 2군 기록 한 줄 (통산에는 포함되지 않는다) */
function farmRow(p){
  const f=p.farm;
  if(!f||!f.g)return '';
  return p.pos==='pitcher'
    ? `<tr class="farm"><td>${p.year} 2군</td><td>${f.g}</td><td>${f.ip}</td><td>${f.w}</td><td>${f.l}</td><td>${f.sv}</td><td>${f.k}</td><td>${f.ip>0?round(f.er*9/f.ip,2):'-'}</td><td>—</td></tr>`
    : `<tr class="farm"><td>${p.year} 2군</td><td>${f.g}</td><td>${f.ab>0?avg3(f.h/f.ab):'-'}</td><td>${f.h}</td><td>${f.hr}</td><td>${f.rbi}</td><td>${f.sb}</td><td>${f.bb}</td><td>—</td></tr>`;
}
function recTable(p){
  const s=p.season;
  if(!s)return '<span class="dim sm">시즌 준비 중</span>';
  if(p.pos==='pitcher')return `<table class="rec">
    <tr><th>구분</th><th>경기</th><th>이닝</th><th>승</th><th>패</th><th>세이브</th><th>탈삼진</th><th>평균자책</th><th>WAR</th></tr>
    <tr><td>${p.year} 시즌</td><td>${s.g}</td><td>${s.ip}</td><td>${s.w}</td><td>${s.l}</td><td>${s.sv}</td><td>${s.k}</td><td>${s.ip>0?round(s.er*9/s.ip,2):'-'}</td><td>${s.war||round(warNow(p),1)}</td></tr>
    <tr><td>통산</td><td>${p.tot.g}</td><td>${p.tot.ip}</td><td>${p.tot.w}</td><td>${p.tot.l}</td><td>${p.tot.sv}</td><td>${p.tot.k}</td><td>${p.tot.ip>0?round(p.tot.er*9/p.tot.ip,2):'-'}</td><td>${p.tot.war}</td></tr>${farmRow(p)}</table>`;
  return `<table class="rec">
    <tr><th>구분</th><th>경기</th><th>타율</th><th>안타</th><th>홈런</th><th>타점</th><th>도루</th><th>볼넷</th><th>WAR</th></tr>
    <tr><td>${p.year} 시즌</td><td>${s.g}</td><td>${s.ab>0?avg3(s.h/s.ab):'-'}</td><td>${s.h}</td><td>${s.hr}</td><td>${s.rbi}</td><td>${s.sb}</td><td>${s.bb}</td><td>${s.war||round(warNow(p),1)}</td></tr>
    <tr><td>통산</td><td>${p.tot.g}</td><td>${p.tot.ab>0?avg3(p.tot.h/p.tot.ab):'-'}</td><td>${p.tot.h}</td><td>${p.tot.hr}</td><td>${p.tot.rbi}</td><td>${p.tot.sb}</td><td>${p.tot.bb}</td><td>${p.tot.war}</td></tr>${farmRow(p)}</table>`;
}
function careerTable(p){
  if(!p.career.seasons.length)return '<span class="dim sm">첫 시즌을 마치면 기록이 쌓입니다.</span>';
  const pit=p.pos==='pitcher';
  return `<table class="rec">
    <tr><th>시즌</th><th>나이</th><th>팀</th><th>경기</th>${pit?'<th>이닝</th><th>승</th><th>평균자책</th><th>탈삼진</th>':'<th>타율</th><th>홈런</th><th>타점</th><th>도루</th>'}<th>WAR</th><th>평가</th></tr>
    ${p.career.seasons.map(s=>{
      const f=s.farm;
      if(!s.g&&f)return `<tr class="farm"><td>${s.year}</td><td>${s.age}</td><td>${TEAM(s.team).short}</td><td>${f.g}</td>
        ${pit?`<td>${f.ip}</td><td>${f.w}</td><td>${f.ip>0?round(f.er*9/f.ip,2):'-'}</td><td>${f.k}</td>`
             :`<td>${f.ab>0?avg3(f.h/f.ab):'-'}</td><td>${f.hr}</td><td>${f.rbi}</td><td>-</td>`}
        <td>—</td><td>2군</td></tr>`;
      return `<tr><td>${s.year}</td><td>${s.age}</td><td>${TEAM(s.team).short}</td><td>${s.g}</td>
      ${pit?`<td>${s.ip}</td><td>${s.w}</td><td>${s.era}</td><td>${s.k}</td>`
           :`<td>${s.ab>0?avg3(s.h/s.ab):'-'}</td><td>${s.hr}</td><td>${s.rbi}</td><td>${s.sb}</td>`}
      <td>${s.war}</td><td>${seasonGrade(s.war)}</td></tr>`;}).join('')}
  </table>`;
}
/* ==========================================================================
   [15] FLOW — 페이즈 진행
   ========================================================================== */
/* 선택지의 문구가 포지션에 따라 달라질 수 있다 — 함수면 풀어서 쓴다 */
function txt(v,p){return typeof v==='function'?v(p):v;}
function mapChoices(list,p){
  return list.map(c=>({t:txt(c.t,p),s:txt(c.s,p),risk:c.risk,reveal:c.reveal,
    outcomes:c.outcomes,run:c.run?(()=>c.run(p)):null}));
}
/* ── 스토리 이벤트 ── */
function storyEvent(){
  const p=G.p;
  const pool=EVENTS.concat(CALLBACK_EVENTS).filter(e=>{
    if(e.once&&p.seenEvents.includes(e.id))return false;
    if(e.pos&&e.pos!=='all'&&e.pos!==p.pos)return false;   // v3.0 포지션 필터
    try{return e.when(p);}catch(err){return false;}
  });
  if(!pool.length)return 'skip';
  const bag=[];pool.forEach(e=>{for(let i=0;i<(e.w||5);i++)bag.push(e);});
  const e=R.pick(bag);
  p.seenEvents.push(e.id);
  return scene({when:nowLabel(),title:e.title,body:e.text(p),track:1,
    choices:mapChoices(e.choices,p)});
}
/* ── 결정적 순간 ── */
function momentEvent(){
  const p=G.p;
  const pool=MOMENTS.filter(m=>m.id!=='M_KS'&&(m.pos==='all'||m.pos===p.pos)&&
    (!m.once||!p.seenEvents.includes(m.id))&&(()=>{try{return m.when(p)}catch(e){return false}})());
  if(!pool.length||R.c(.25))return 'skip';
  return showMoment(R.pick(pool));
}
function showMoment(m){
  const p=G.p;p.seenEvents.push(m.id);
  return scene({when:m.ks?`${G.cal.year}년 10월 · 한국시리즈`:`${nowLabel()} · 경기 중`,title:m.title,body:m.text(p),track:1,
    choices:m.choices.map(c=>({t:c.t,run:()=>c.kind?momentResult(p,c.kind,!!m.ks):c.run(p).map(x=>{
      p.clutchBonus+=x.mod||0;return x.msg;})}))});
}
function momentResult(p,kind,isKS){
  const base=p.pos==='pitcher'
    ? (ab(p,'stuff')+ab(p,'control')+ab(p,'crisis')+ab(p,'mental'))/4
    : (ab(p,'contact')+ab(p,'power')*.7+ab(p,'mental')+ab(p,'lead')*0)/2.7;
  let pr=clamp((base-42)/68,.08,.86)+ (tEff(p,'clutch')+p.clutchBonus)*.006+condMod(p);
  let gain=3;
  if(kind==='aggr'){pr-=.10;gain=6;tend(p,{aggression:5,competitive:4});}
  if(kind==='safe'){pr+=.12;gain=1.5;tend(p,{patience:4,selfish:-2});}
  if(kind==='patient'){tend(p,{patience:3});}
  const ok=R.c(clamp(pr,.05,.93));
  const log=[];
  const bat=p.pos!=='pitcher';
  if(ok){
    p.clutchBonus+=gain;p.season.bigHits++;p.fame=clamp(p.fame+(isKS?7:2),0,100);
    p.fanRating=clamp(p.fanRating+(isKS?4:1.5),0,100);
    tend(p,{star:3,competitive:2});
    log.push(bat?(kind==='aggr'?'초구를 그대로 잡아당겼다. 타구는 담장을 넘어갔다.'
                 :kind==='safe'?'깊은 외야 뜬공. 3루 주자가 홈을 밟았다.'
                 :'풀카운트 끝에 중전 적시타.')
              :(kind==='aggr'?'삼진. 그는 마운드를 끝까지 지켰다.'
                 :kind==='safe'?'바뀐 투수가 병살로 이닝을 끝냈다. 판단이 옳았다.'
                 :'한 타자를 잡고 내려왔다. 관중석이 일어섰다.'));
    if(isKS){p.post.bigHits+=2;p.timeline.push({y:p.year,t:'가을의 결정적 장면'});}
    if(kind==='aggr'&&bat&&R.c(.14)&&!p.traits.includes('끝내기 본능'))G.tq.push({type:'new',id:'끝내기 본능'});
    if(kind==='aggr'&&!bat&&R.c(.12)&&!p.traits.includes('위기관리의 달인'))G.tq.push({type:'new',id:'위기관리의 달인'});
  }else{
    p.clutchBonus-=1.5;grow(p,{mental:.6});
    if(isKS)p.post.fail++;
    log.push(bat?(kind==='aggr'?'초구 헛스윙 삼진. 배트가 허공을 갈랐다.'
                 :'끝까지 지켜본 공은 스트라이크였다. 루킹 삼진.')
              :'역전을 허용했다. 더그아웃은 조용했다.');
    log.push('오래 기억에 남을 장면이 되었다.');
  }
  return log;
}
/* 구단 전용 이벤트 */
function teamEvent(){
  const p=G.p,cul=CUL(p.team);
  const pool=TEAM_EVENTS.concat(TEAM_EVENTS2).filter(e=>{
    if(p.seenEvents.includes(e.id))return false;
    if(e.team&&e.team!==p.team)return false;
    if(e.cul&&e.cul!==cul.style)return false;
    if(e.pos&&e.pos!=='all'&&e.pos!==p.pos)return false;   // v3.0 포지션 필터
    try{return e.when(p);}catch(err){return false;}
  });
  if(!pool.length||R.c(.2))return 'skip';
  const e=R.pick(pool);p.seenEvents.push(e.id);
  return scene({when:`${nowLabel()} · ${TEAM(p.team).name}`,title:e.title,body:e.text(p),track:1,
    choices:mapChoices(e.choices,p)});
}
/* 트레이드 제안 */
function tradePhase(){
  const p=G.p;
  if(p.seasonsPlayed<2||p.age>=38)return 'skip';
  const s=p.season, val=ovr(p)+s.war*4+p.fame*.2-(p.age-27)*2;
  const myRank=s.rank||8;
  let chance=.05;
  if(myRank>=7&&val>=78)chance=.13;                 // 하위팀의 좋은 선수 → 매물
  if(myRank<=3&&val<58)chance=.10;                  // 상위팀의 부진한 선수 → 정리
  if(p.flags.includes('wantOut'))chance+=.10;
  if(p.rel.manager<35)chance+=.07;
  if(!R.c(chance))return 'skip';
  const to=R.pick(TEAMS.filter(t=>t.id!==p.team&&(myRank>=7?CUL(t.id).fa>=3:CUL(t.id).youth>=3)));
  const c=CUL(to.id);
  return scene({when:`${p.year}년 12월 · 트레이드`,title:`${to.name}에서 관심을 보이고 있다`,
    body:`${to.name}이 당신을 원한다.\n\n"${c.desc}"\n\n${TEAM(p.team).name}은 결정을 당신에게 맡겼다.`,
    choices:[
      {t:'트레이드를 수용한다',s:'새 팀 · 새 이벤트 · 충성도 ↓',run:()=>{
        const from=TEAM(p.team).name;p.team=to.id;
        if(!p.teamsPlayed.includes(to.id))p.teamsPlayed.push(to.id);
        tend(p,{loyalty:-10});rel(p,'manager',50-p.rel.manager);
        p.timeline.push({y:p.year,t:`${to.name} 트레이드 이적`});
        return[`${from}에서의 시간이 끝났다.`,`${to.name}의 유니폼을 받았다.`];}},
      {t:'거절하고 남는다',s:'충성도 ↑ / 입지 불안',run:()=>{
        tend(p,{loyalty:14});flag(p,'refusedTrade');
        if(R.c(.4)){rel(p,'manager',-12);return['구단은 표정을 감추지 못했다.'];}
        return['그는 남기로 했다.'];}}
    ]});
}
/* ── FA ── */
function faPhase(){
  const p=G.p;
  if(!faEligible(p))return 'skip';
  p.faDone=true;
  const mv=marketValue(p);
  const v=Math.max(3,Math.round(mv/10000));   // 억 단위 규모
  const others=R.shuffle(TEAMS.filter(t=>t.id!==p.team)).slice(0,2);
  const rich=others.sort((a,b)=>b.money-a.money)[0];
  return scene({when:`${p.year}년 12월 · FA`,title:'자유계약선수',
    body:`${p.seasonsPlayed}시즌을 채웠다. 이제 팀을 고를 수 있다.\n\n현 소속 ${TEAM(p.team).name} — ${v}억 규모 제시\n${rich.name} — ${Math.round(v*R.f(1.15,1.5))}억 규모 제시`,
    choices:[
      {t:`${TEAM(p.team).name}에 남는다`,s:`계약 ${v}억 규모 · 충성도 ↑ 팬 평가 ↑`,run:()=>{
        tend(p,{loyalty:18});p.fanRating=clamp(p.fanRating+6,0,100);flag(p,'franchiseStar');
        p.money.salary=Math.round(mv*.92);p.money.years=R.i(3,4);
        p.money.balance+=Math.round(mv*.5);p.money.signBonus=Math.round(mv*.5);
        p.timeline.push({y:p.year,t:`FA 잔류 (${wonText(mv)} 규모)`});
        return['그는 남기로 했다. 팬들은 그 선택을 오래 기억했다.',
               `계약금 ${wonText(Math.round(mv*.5))} · 연봉 ${wonText(Math.round(mv*.92))}`];}},
      {t:`${rich.name}으로 이적한다`,s:`계약 ${Math.round(v*1.3)}억 규모 · 충성도 ↓`,run:()=>{
        p.team=rich.id;if(!p.teamsPlayed.includes(rich.id))p.teamsPlayed.push(rich.id);
        tend(p,{loyalty:-14,star:6});p.fanRating=clamp(p.fanRating-4,0,100);
        const deal=Math.round(mv*1.3);
        p.money.salary=Math.round(deal*.92);p.money.years=R.i(3,4);
        p.money.balance+=Math.round(deal*.5);p.money.signBonus=Math.round(deal*.5);
        p.timeline.push({y:p.year,t:`${rich.name} 이적 (${wonText(deal)} 규모)`});
        return[`${rich.name}의 유니폼을 입는다.`,
               `계약금 ${wonText(Math.round(deal*.5))} · 연봉 ${wonText(Math.round(deal*.92))}`];}},
      {t:'더 좋은 조건을 기다린다',s:'위험 · 보상 모두 큼',run:()=>{
        if(R.c(.45)){const t2=R.pick(TEAMS.filter(t=>t.id!==p.team));p.team=t2.id;
          if(!p.teamsPlayed.includes(t2.id))p.teamsPlayed.push(t2.id);
          p.timeline.push({y:p.year,t:`${t2.name} 이적`});
          return[`늦게까지 기다린 끝에 ${t2.name}과 큰 계약을 맺었다.`];}
        p.fatigue+=10;tend(p,{loyalty:-6});
        return['시장은 차가웠다. 결국 원 소속팀과 낮은 조건에 재계약했다.'];}}
    ]});
}
/* ── 은퇴 ── */
function retirePhase(){
  const p=G.p;
  const forced=retireCheck(p);
  const ask=p.age>=33||p.season.war<0.6&&p.age>=30;
  if(!forced&&!ask)return 'skip';
  if(forced&&p.age>=44)return doRetire('몸이 먼저 대답했다.');
  return scene({when:`${p.year}년 12월`,title:forced?'마지막을 생각할 때':'한 시즌 더?',
    body:forced?`구단에서 연락이 왔다. 내년 계획에 당신의 자리는 없다.\n${p.age}세. 사람들은 이제 그의 이름을 과거형으로 부른다.`
              :`${p.age}세. 아직 할 수 있다는 생각과, 이쯤이면 됐다는 생각이 같이 든다.`,
    choices:forced?[
      {t:'은퇴한다',run:()=>doRetire('그는 스스로 끝을 정했다.')},
      {t:'다른 팀에서 기회를 찾는다',s:'능력치 하락 감수',run:()=>{
        if(R.c(.5)){const t2=R.pick(TEAMS.filter(t=>t.id!==p.team));p.team=t2.id;
          if(!p.teamsPlayed.includes(t2.id))p.teamsPlayed.push(t2.id);
          p.timeline.push({y:p.year,t:`${t2.name} 이적`});return[`${t2.name}이 손을 내밀었다.`];}
        return doRetire('어느 팀도 전화를 걸지 않았다.'),['불러주는 팀은 없었다.'];}}
    ]:[
      {t:'한 시즌 더 뛴다',s:'몸은 정직하다',run:()=>{tend(p,{competitive:6});return['그는 다시 캠프로 향했다.'];}},
      {t:'여기서 은퇴한다',s:'가장 좋은 모습으로',run:()=>doRetire('가장 좋았던 시절의 모습으로 떠나기로 했다.')}
    ]});
}
function doRetire(line){
  const p=G.p;p.retired=true;p.retireLine=line;
  if(typeof syncPlayerEntry==='function')syncPlayerEntry(p);   // 리그 로스터에서 빠진다
  p.timeline.push({y:p.year,t:'은퇴'});
  p.ending=decideEnding(p);
  saveHof(p);
  G.screen='ending';render();Store.del('save_v3');G.hasSave=false;
  return [];
}
/* ==========================================================================
   [16] 이벤트 핸들러 / 저장
   ========================================================================== */
function go(s){
  if(s==='create')G.create={name:mkName(),pos:null};
  G.screen=s;render();
}
function reroll(){G.create.name=mkName();render();}
function pickPos(pos){
  const v=(document.getElementById('nm').value||'').trim()||mkName();
  startGame(v.slice(0,6),pos);
}
/* v3.0 — 세이브는 캘린더 전체(연/월/남은 큐)를 통째로 저장한다.
   월 중간 어느 지점에서도 정확히 이어진다. v2.1 세이브(save_v1)는 폐기. */
/* 저장은 400ms 디바운스로 합친다.
   기존에는 화면마다 약 270KB 를 직렬화해 저장소에 썼다. 주간 시스템으로
   화면이 3배가 되면서 모바일에서 눈에 띄는 렉이 됐다.
   큐 전체를 저장하므로 마지막 한 번만 기록돼도 정확히 이어진다. */
let _saveT=null;
function save(){
  if(G.noSave)return;                       // 자동 테스트용
  if(_saveT)clearTimeout(_saveT);
  _saveT=setTimeout(()=>{_saveT=null;saveNow();},400);
}
function saveFlush(){ if(_saveT){clearTimeout(_saveT);_saveT=null;} return saveNow(); }
async function saveNow(){
  if(!G.p||G.p.retired)return;
  const u=G.ui||{};
  const c=G.cal;
  const queue=(u.choices||u.after)?[c.last].concat(c.queue):c.queue.slice();
  await Store.set('save_v3',{v:3,p:G.p,cal:{year:c.year,month:c.month,week:c.week,queue,last:null},tq:G.tq,L});
  G.hasSave=true;
}
/* v3.1 (요구 16) — 이전 버전 세이브에 없는 필드를 기본값으로 채운다.
   필드를 추가할 때마다 여기에 한 줄씩 넣으면 옛 세이브가 깨지지 않는다. */
function migrate(p){
  if(!p)return p;
  const d=(k,v)=>{ if(p[k]===undefined||p[k]===null)p[k]=v; };
  d('grade','normal'); d('gradeLabel','평범한 유망주');
  d('stHist',[]); d('salaryHist',[]); d('contractLog',[]);
  d('status','정상'); d('rehabLeft',0); d('stress',20);
  d('monthLog',[]); d('relLog',[]); d('month',1); d('week',0);
  d('monthAcc',{ip:0,er:0,ab:0,h:0});
  d('vetPos',p.pos); d('farm',null); d('gearYear',0);
  if(!p.money)p.money=Object.assign({},MONEY0);
  if(typeof p.slump!=='object'||!p.slump)p.slump={active:false,since:null,depth:0,months:0};
  if(p.rel&&p.rel.fan===undefined)p.rel.fan=50;
  return p;
}
async function loadGame(){
  const d=await Store.get('save_v3');
  if(!d||!d.cal)return;
  G.p=migrate(d.p);G.tq=d.tq||[];L=d.L||null;
  if(L&&!L.retireAges)L.retireAges=[];
  G.cal={year:d.cal.year,month:d.cal.month,week:d.cal.week||0,queue:d.cal.queue||[],last:null};
  G.ui=null;G.screen='game';G.tab='main';
  if(!G.cal.queue.length)G.cal.queue=['action'];
  const ph=G.cal.queue.shift();G.cal.last=ph;
  if(runPhase(ph)==='skip')advance();
}
async function saveHof(p){
  G.hof.push({me:1,name:p.name,pos:POS[p.pos].label,war:p.tot.war,
    years:`${p.career.seasons[0]?p.career.seasons[0].year:2026}~${p.year}`,
    ending:p.ending.title,mvp:p.awards.mvp,champ:p.awards.champ});
  await Store.set('hof_v1',G.hof);
}
/* 모바일은 앱 전환만으로도 탭이 정리된다. 숨겨지는 순간 확실히 기록한다. */
try{
  document.addEventListener('visibilitychange',()=>{if(document.hidden)saveFlush();});
  window.addEventListener('pagehide',()=>{saveFlush();});
}catch(e){}

(async function boot(){
  G.hof=(await Store.get('hof_v1'))||[];
  G.compact=!!(await Store.get('compact_v1'));
  try{await Store.del('save_v1');}catch(e){}      // v2.1 세이브 폐기
  G.hasSave=!!(await Store.get('save_v3'));
  render();
})();
/* ==========================================================================
   [25] UI — 리그 / 역사 탭
   ========================================================================== */
function leagueTab(p){
  if(!L||!L.standings.length)
    return `<div class="sm dim">정규시즌이 끝나면 순위표가 나옵니다.</div>${rosterList(p)}`;
  const rows=L.standings.map(r=>`<tr class="${r.id===p.team?'mine':''}">
      <td>${r.rank}</td><td>${TEAM(r.id).name}</td><td>${r.w}</td><td>${r.l}</td>
      <td>${round(r.w/144,3).toFixed(3).replace(/^0/,'')}</td><td>${r.rank<=5?'PS':''}</td></tr>`).join('');
  const h=L.history[L.history.length-1];
  const ldr=h?`<div class="sm" style="margin-top:10px;display:grid;gap:4px">
    <div>MVP <b>${esc(h.mvp.name)}</b> <span class="dim">WAR ${h.mvp.war}</span></div>
    <div>홈런 <b>${esc(h.hr.name)}</b> <span class="dim">${h.hr.v}개</span>
      &nbsp; 다승 <b>${esc(h.win.name)}</b> <span class="dim">${h.win.v}승</span></div>
    <div>평균자책 <b>${esc(h.era.name)}</b> <span class="dim">${h.era.v}</span>
      &nbsp; 신인왕 <b>${esc(h.rookie)}</b></div></div>`:'';
  return `<table class="rec"><tr><th>순위</th><th>구단</th><th>승</th><th>패</th><th>승률</th><th></th></tr>${rows}</table>${ldr}${rosterList(p)}`;
}
function rosterList(p){
  if(!L)return '';
  const r=firstTeam(p.team).sort((a,b)=>b.ovr-a.ovr).slice(0,8);
  const rv=L.players.find(a=>a.id===p.rival.id)||L.retired.find(a=>a.id===p.rival.id);
  return `<div style="margin-top:14px"><h3 style="font-size:12px;color:var(--chalk-dim);margin:0 0 6px">${TEAM(p.team).name} 1군 주요 선수 · ${CUL(p.team).tag}</h3>
    <div class="sm" style="display:grid;gap:4px">
    ${r.map(a=>`<div style="display:flex;gap:8px"><span style="min-width:62px">${esc(a.name)}</span>
      <span class="dim">${POS[a.pos].label} ${a.age}세 · ${a.style}</span>
      <span style="margin-left:auto" class="num">${a.ovr}</span></div>`).join('')}
    </div>
    ${rv?`<div class="sm" style="margin-top:10px;border-top:1px solid var(--line);padding-top:8px">
      라이벌 <b>${esc(rv.name)}</b> <span class="dim">${TEAM(rv.team).short} · ${POS[rv.pos].label} · 종합 ${rv.ovr}${rv.retired?' · 은퇴':''}</span>
      <div class="dim">올해 WAR ${rv.s?rv.s.war:0} · 통산 ${rv.c.war} · MVP ${rv.aw.mvp}회</div></div>`:''}</div>`;
}
function historyTab(p){
  if(!L)return '';
  const S=L.rec.season,C=L.rec.career;
  const rec=[];
  if(S.hr)rec.push(`단일시즌 최다 홈런 <b>${S.hr.v}</b> ${esc(S.hr.name)} (${S.hr.y})`);
  if(S.avg)rec.push(`단일시즌 최고 타율 <b>${avg3(S.avg.v)}</b> ${esc(S.avg.name)} (${S.avg.y})`);
  if(S.w)rec.push(`단일시즌 최다 승 <b>${S.w.v}</b> ${esc(S.w.name)} (${S.w.y})`);
  if(S.era)rec.push(`단일시즌 최저 ERA <b>${S.era.v}</b> ${esc(S.era.name)} (${S.era.y})`);
  if(C.war)rec.push(`통산 최다 WAR <b>${C.war.v}</b> ${esc(C.war.name)}`);
  if(C.hr)rec.push(`통산 최다 홈런 <b>${C.hr.v}</b> ${esc(C.hr.name)}`);
  if(C.h)rec.push(`통산 최다 안타 <b>${C.h.v}</b> ${esc(C.h.name)}`);
  if(C.w)rec.push(`통산 최다 승 <b>${C.w.v}</b> ${esc(C.w.name)}`);
  const hist=L.history.slice().reverse().slice(0,10).map(h=>
    `<div><span class="num">${h.y}</span> &nbsp;${h.champ?esc(TEAM(h.champ).short)+' 우승':'—'}
      &nbsp;<span class="dim">MVP ${esc(h.mvp.name)}${h.mvp.me?' (나)':''} · 홈런왕 ${esc(h.hr.name)} ${h.hr.v}</span></div>`).join('');
  const gl=(p.gameLog||[]).slice().reverse().slice(0,8).map(g=>
    `<div><span class="num">${g.y}</span> &nbsp;<b>${esc(g.kind)}</b> <span class="dim">${esc(g.detail||'')}</span></div>`).join('');
  return `<div class="sm" style="display:grid;gap:5px">${rec.map(r=>`<div>${r}</div>`).join('')}</div>
    <div style="border-top:1px solid var(--line);margin:12px 0 8px"></div>
    <div class="sm" style="display:grid;gap:5px">${hist||'<span class="dim">아직 시즌 기록이 없습니다.</span>'}</div>
    ${gl?`<div style="border-top:1px solid var(--line);margin:12px 0 8px"></div>
      <div class="sm" style="display:grid;gap:5px">${gl}</div>`:''}`;
}
/* ==========================================================================
   [26] UI — 은퇴 후 연대기
   ========================================================================== */
function eraPlayers(p){
  const from=p.career.seasons[0]?p.career.seasons[0].year:2026, to=p.year;
  const all=[...L.players,...L.retired].filter(a=>a.c&&a.debut&&a.debut<=to&&(a.retireYear||9999)>=from);
  const arr=all.map(a=>({name:a.name,pos:a.pos,war:a.c.war,mvp:a.aw.mvp,champ:a.aw.champ,team:a.team}));
  arr.push({name:p.name,pos:p.pos,war:p.tot.war,mvp:p.awards.mvp,champ:p.awards.champ,team:p.team,me:1});
  return arr.sort((x,y)=>y.war-x.war);
}
function chronicleHtml(p){
  if(!L)return '';
  const era=eraPlayers(p), myIdx=era.findIndex(e=>e.me);
  const top=era.slice(0,5);
  const from=p.career.seasons[0]?p.career.seasons[0].year:2026;
  // 왕조
  const cnt={};L.champions.filter(c=>c.y>=from&&c.y<=p.year).forEach(c=>cnt[c.team]=(cnt[c.team]||0)+1);
  const dyn=Object.entries(cnt).sort((a,b)=>b[1]-a[1])[0];
  // 라이벌
  const rv=L.players.find(a=>a.id===p.rival.id)||L.retired.find(a=>a.id===p.rival.id);
  // 내 기록 순위
  const ranks=[];
  ranks.push(`통산 WAR 역대 ${myRank('war')}위`);
  if(p.pos==='pitcher'){ranks.push(`통산 ${p.tot.w}승 역대 ${myRank('w')}위`);ranks.push(`통산 ${p.tot.k}탈삼진 역대 ${myRank('k')}위`);}
  else{ranks.push(`통산 ${p.tot.h}안타 역대 ${myRank('h')}위`);ranks.push(`통산 ${p.tot.hr}홈런 역대 ${myRank('hr')}위`);}
  // 다음 세대
  const next=L.players.filter(a=>isAi(a)&&!a.retired&&a.age<=24).sort((a,b)=>b.pot-a.pot)[0];
  const stage=[
    `${from}~${Math.min(from+3,p.year)}  신인 시절`,
    `${clamp(p.peakAge-p.age+p.year-2,from,p.year)}년 전후  전성기 (최고 시즌 WAR ${p.bestWar})`,
    `${Math.max(from,p.year-3)}~${p.year}  베테랑, 그리고 은퇴`
  ];
  const hg=(p.gameLog||[]).filter(g=>['노히트노런','퍼펙트게임','사이클링히트'].includes(g.kind)||/달성|우승/.test(g.kind));
  return `<div class="rule"></div>
  <div class="sm dim" style="margin-bottom:8px">내가 살았던 시대 · ${from}~${p.year}</div>
  <div class="tl" style="max-width:420px">
    ${top.map((e,i)=>`<div><b>${i+1}</b><span style="${e.me?'color:var(--lamp)':''}">${esc(e.name)}${e.me?' (나)':''}
      <span class="dim"> ${POS[e.pos].label} · WAR ${e.war}${e.mvp?` · MVP ${e.mvp}회`:''}</span></span></div>`).join('')}
    ${myIdx>=5?`<div><b>${myIdx+1}</b><span style="color:var(--lamp)">${esc(p.name)} (나)<span class="dim"> WAR ${p.tot.war}</span></span></div>`:''}
  </div>
  <div class="sm" style="margin-top:14px;display:grid;gap:6px">
    ${dyn?`<div>이 시대의 왕조 — <b>${esc(TEAM(dyn[0]).name)}</b> <span class="dim">우승 ${dyn[1]}회</span></div>`:''}
    ${rv?`<div>라이벌 ${esc(rv.name)} — <span class="dim">통산 WAR ${rv.c.war} · MVP ${rv.aw.mvp}회 · 우승 ${rv.aw.champ}회${rv.retired?' · 은퇴':' · 현역'}</span></div>`:''}
    <div>${ranks.join(' &nbsp;·&nbsp; ')}</div>
    ${next?`<div>다음 세대 — <b>${esc(next.name)}</b> <span class="dim">${TEAM(next.team).short} · ${next.age}세 · 잠재력 ${next.pot>=90?'특급':'높음'}</span></div>`:''}
  </div>
  ${hg.length?`<div class="rule"></div><div class="sm" style="display:grid;gap:5px">
    ${hg.slice(0,6).map(g=>`<div><span class="num">${g.y}</span> &nbsp;<b>${esc(g.kind)}</b> <span class="dim">${esc(g.detail||'')}</span></div>`).join('')}</div>`:''}
  <div class="rule"></div>
  <div class="tl" style="max-width:420px">${stage.map(s=>`<div><span class="dim">${esc(s)}</span></div>`).join('')}</div>`;
}
/* ==========================================================================
   [32] UI v2.1 — 렌더 루트 / 하단 네비게이션
   ========================================================================== */
/* v3.1 (요구 11) — 6탭 구조. 하단 네비와 데스크톱 탭이 같은 목록을 쓴다. */
const NAV=[['main','🏠','메인'],['game','⚾','경기'],['profile','👤','선수'],
           ['league','🏆','리그'],['rec','📊','기록'],['hist','📖','역사']];
function render(){
  if(G.noRender)return;          // 자동 테스트 — 렌더(도트 PNG 인코딩 포함)를 건너뛴다
  const el=app();
  if(G.screen==='title')el.innerHTML=viewTitle();
  else if(G.screen==='create')el.innerHTML=viewCreate();
  else if(G.screen==='hof')el.innerHTML=viewHof();
  else if(G.screen==='ending')el.innerHTML=viewEnding();
  else el.innerHTML=viewGame();
  renderNav();
}
function renderNav(){
  let n;try{n=document.getElementById('nav');}catch(e){return;}
  if(!n)return;
  n.innerHTML=(G.screen==='game')
    ? NAV.map(([k,i,l])=>`<button class="${G.tab===k?'on':''}" onclick="setTab('${k}')">
        <span class="ni">${i}</span>${l}</button>`).join('')
    : '';
}
/* 모바일 — 상단 상태창을 접어 본문 공간을 확보한다 */
function toggleBoard(){
  G.compact=!G.compact;
  try{Store.set('compact_v1',G.compact?1:0);}catch(e){}
  render();
}
function setTab(t){G.tab=t;render();try{if(t==='main')window.scrollTo({top:0,behavior:'smooth'});}catch(e){}}

/* ── 타이틀 ── */
function viewTitle(){
  return `<div class="title">
    <span class="ball">⚾</span>
    <div class="kicker">2026 · 신인 드래프트</div>
    <h1>야구 인생</h1>
    <p class="sub">당신의 야구 인생은 2026년부터 시작됩니다.<br>은퇴하는 날까지, 선택은 모두 당신의 것입니다.</p>
    <div class="menu">
      <button onclick="go('create')">새로운 야구 인생</button>
      <button ${G.hasSave?'':'disabled'} onclick="loadGame()">이어하기</button>
      <button onclick="go('hof')">명예의 전당</button>
    </div>
    <p class="sm dim" style="margin-top:26px">정답 루트는 없습니다. 모든 선택에는 대가가 있습니다.</p>
  </div>`;
}
/* ── 선수 생성 (선수 카드) ── */
function viewCreate(){
  const c=G.create||(G.create={name:mkName(),pos:null});
  const ICON={batter:'🏏',pitcher:'⚾',catcher:'🧤'};
  return `<div class="title" style="max-width:760px">
    <div class="kicker">선수 등록</div>
    <h1 style="font-size:32px">어떤 선수로 시작할까</h1>
    <div class="panel" style="margin:22px 0 16px;text-align:left">
      <h3>이름</h3>
      <div class="field">
        <input id="nm" value="${esc(c.name)}" maxlength="6" aria-label="선수 이름">
        <button class="ghost" onclick="reroll()">다른 이름</button>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;text-align:left">
      ${Object.keys(POS).map(k=>`
        <button class="pcard" style="cursor:pointer" onclick="pickPos('${k}')">
          <div class="ball">${ICON[k]}</div>
          <div class="pos">${POS[k].label.toUpperCase()}</div>
          <div class="pn">${POS[k].label}</div>
          <div class="pm" style="margin:8px 0 10px">${POS[k].desc}</div>
          <div class="sm" style="color:var(--clay)">${POS[k].keys.map(s=>SLABEL[s]).join(' · ')}</div>
        </button>`).join('')}
    </div>
    <div class="menu" style="margin-top:18px"><button onclick="go('title')">돌아가기</button></div>
  </div>`;
}
/* ── 게임 본 화면 ── */
function viewGame(){
  const p=G.p,u=G.ui||{};
  const side1=`<div class="side ${G.tab==='profile'?'show':''}">${statPanel(p)}</div>`;
  const side2=`<div class="side ${G.tab==='profile'?'show':''}">${traitPanel(p)}${relPanel(p)}</div>`;
  const main=`<div class="main">${sceneHtml(u)}${infoTabs(p)}</div>`;
  return `${boardHtml(p)}<div class="stage">${side1}${main}${side2}</div>`;
}
/* ──────────────────────────────────────────────────────────────
   v3.0 메인 보드 — "내 인생을 관리하는 화면"
   날짜 / 나이 / 소속 / 게이지 / 이번 시즌 / 최근 사건 이 항상 보인다
   ────────────────────────────────────────────────────────────── */
const COND_FACE=['😞','😕','😐','🙂','😊'];
function gauge(label,v,max,tone){
  const pct=clamp(v/max*100,0,100);
  return `<div class="g"><span class="gl">${label}</span>
    <span class="gb"><i class="${tone||''}" style="width:${pct}%"></i></span>
    <span class="gv">${Math.round(v)}</span></div>`;
}
function boardHtml(p){
  const s=p.season, m=(typeof MON==='function'&&G.cal)?MON():{label:'',note:''};
  /* 콜업/강등 씬을 읽는 동안에는 보드가 아직 "이전 보직"을 보여준다.
     "전화가 왔다"를 읽는데 상단이 이미 1군이면 장면이 깨진다. */
  const lv=(G.ui&&G.ui.lvWas)||p.lv;
  const yrs=p.seasonsPlayed+1;
  const w=(s&&s.g)?round(warNow(p)||0,1):0;
  const f=p.farm;
  /* 2군에 있으면 2군 성적을, 1군이면 1군 성적을 보여준다 */
  const farmLine=(lv==='2군'&&f&&f.g)?(p.pos==='pitcher'
      ? [[f.w+'승',''],[f.ip,'이닝'],[f.ip?round(f.er*9/f.ip,2):'-','ERA'],[f.k,'K']]
      : [[f.ab?avg3(f.h/f.ab):'-','타율'],[f.hr,'홈런'],[f.rbi,'타점'],[f.g,'경기']]):null;
  const line=s&&s.g?(p.pos==='pitcher'
      ? [[s.w+'승',''],[s.l+'패',''],[s.ip?round(s.er*9/s.ip,2):'-','ERA'],[s.k,'K'],[w,'WAR']]
      : [[s.ab?avg3(s.h/s.ab):'-','타율'],[s.hr,'홈런'],[s.rbi,'타점'],[s.sb,'도루'],[w,'WAR']])
    :null;
  const recent=(p.monthLog||[]).slice(-2);
  const st=p.status!=='정상'?`<span class="tagx">${p.status}${p.rehabLeft?` · ${p.rehabLeft}개월`:''}</span>`:'';
  const sl=(p.slump&&p.slump.active)
    ?`<span class="tagx">슬럼프${p.slump.months>1?` ${p.slump.months}개월`:''}</span>`:'';
  const mny=p.money||{balance:0,salary:0};
  return `<div class="lifeboard ${G.compact?'compact':''}">
    <button class="lb-fold" onclick="toggleBoard()" aria-label="상태창 접기/펼치기">${G.compact?'▾':'▴'}</button>
    <div class="lb-top">
      <div class="lb-date"><b>${G.cal?G.cal.year:p.year}년 ${m.label}</b>
        <span class="dim">${m.note||''}</span></div>
      <div class="lb-who">${p.age}세 · 프로 ${yrs}년차 · <b>${esc(p.name)}</b>
        <span class="dim">"${esc(p.nick||'신예')}"</span></div>
      <div class="lb-char">${dotImg('char',p,'big')}</div>
      <div class="lb-team">${TEAM(p.team).name}
        <span class="tag">${lv==='2군'?'2군':'1군 · '+lv}</span>
        <span class="tag">${POS[p.pos].label}</span>${st}${sl}</div>
    </div>
    <div class="lb-g">
      <div class="g"><span class="gl">컨디션</span>
        <span class="face c${p.cond}">${COND_FACE[p.cond]}</span>
        <span class="gv" style="min-width:auto">${COND_NAME[p.cond]}</span></div>
      ${gauge('체력',p.st.stamina||0,100)}
      ${gauge('피로도',p.fatigue,100,p.fatigue>70?'bad':'')}
      ${gauge('스트레스',p.stress||0,100,(p.stress||0)>65?'bad':'')}
      ${gauge('팬 인기',p.fanRating,100,'good')}
      <div class="g"><span class="gl">자산</span><span class="gv" style="min-width:auto">${wonText(mny.balance)}</span></div>
      <div class="g"><span class="gl">연봉</span><span class="gv" style="min-width:auto">${wonText(mny.salary)}</span></div>
      <div class="g"><span class="gl">종합</span><span class="gv big">${ovr(p)}</span></div>
    </div>
    ${farmLine?`<div class="lb-season farm"><span class="lbl">${p.year} 2군</span>
      ${farmLine.map(([v,l])=>`<span class="st"><b>${v}</b>${l?`<i>${l}</i>`:''}</span>`).join('')}</div>`:''}
    ${line?`<div class="lb-season"><span class="lbl">${p.year} 1군</span>
      ${line.map(([v,l])=>`<span class="st"><b>${v}</b>${l?`<i>${l}</i>`:''}</span>`).join('')}</div>`:
      (farmLine?'':`<div class="lb-season"><span class="lbl">${m.season?'시즌 준비':'비시즌'}</span></div>`)}
    ${recent.length?`<div class="lb-recent">${recent.map(r=>`<div>· ${esc(String(r).replace(/<[^>]+>/g,''))}</div>`).join('')}</div>`:''}
  </div>`;
}
/* ── 능력치 패널 (그룹 + 바) ── */
const STAT_GROUP={
  batter:[['타격',['contact','power','eye']],['주루',['speed','run']],['수비',['defense','throw']],['기본',['mental','stamina']]],
  pitcher:[['구위',['velo','stuff','breaking']],['제구',['control','crisis']],['기본',['stamina','mental','recovery']]],
  catcher:[['타격',['contact','power','eye']],['포수',['catching','blocking','lead','throw']],['기본',['defense','mental','stamina']]]
};
function statPanel(p){
  const tier=p.pot>=90?'특급':p.pot>=80?'높음':p.pot>=68?'보통':'낮음';
  const bar=k=>{
    const v=p.st[k],b=tEff(p,k==='control'?'ctrl':k);
    return `<div class="stat"><div class="row">
      <span>${SLABEL[k]}${b?` <span class="${b>0?'up':'down'}">${b>0?'+':''}${Math.round(b)}</span>`:''}</span>
      <span class="v">${Math.round(v)}</span></div>
      <div class="bar"><i class="${v>=85?'hi':v<45?'lo':''}" style="width:${clamp(v,0,100)}%"></i></div></div>`;
  };
  return `<div class="panel">
    <h3>능력치 · 종합 ${ovr(p)}</h3>
    ${STAT_GROUP[p.pos].map(([g,ks])=>`<div class="grp">${g}</div>${ks.filter(k=>p.st[k]!==undefined).map(bar).join('')}`).join('')}
    <div class="grp">컨디션</div>
    <div class="stat"><div class="row"><span>잠재력</span><span style="color:var(--lamp);font-weight:700">${tier}</span></div></div>
    <div class="stat"><div class="row"><span>피로도</span><span class="v">${Math.round(p.fatigue)}</span></div>
      <div class="bar"><i style="width:${p.fatigue}%;background:${p.fatigue>70?'var(--red)':'var(--clay)'}"></i></div></div>
    <div class="sm dim" style="margin-top:6px">${esc(bodyHint(p))}</div>
  </div>`;
}
const STARS={일반:'★☆☆☆☆',희귀:'★★☆☆☆',영웅:'★★★☆☆',전설:'★★★★☆',신화:'★★★★★'};
function traitPanel(p){
  const slots=[...p.traits];while(slots.length<6)slots.push(null);
  return `<div class="panel"><h3>특성 ${p.traits.length}/6</h3><div class="traits">
    ${slots.map(id=>{
      if(!id)return `<div class="tcard empty">빈 슬롯</div>`;
      const t=TR(id);
      return `<div class="tcard b${t.grade} ${t.neg?'neg':''}">
        <span class="gr g${t.grade}">${t.grade}</span>
        <div class="tn">${t.id}</div><div class="td">${t.desc}</div></div>`;
    }).join('')}</div></div>`;
}
function relPanel(p){
  const rv=p.rival;
  const bond=rv.bond>=75?'가장 가까운 친구':rv.bond>=58?'선의의 경쟁자':rv.bond>=40?'경쟁자':rv.bond>=25?'견제 관계':'악연';
  /* 관계는 숫자가 아니라 단계로 읽힌다 (요구 23) */
  const row=(l,v)=>{v=v===undefined?50:v;return `<div style="display:flex;gap:8px;align-items:center">
     <span class="dim" style="min-width:48px">${l}</span>
     <span class="mini bar" style="flex:1;height:5px"><i style="width:${clamp(v,0,100)}%"></i></span>
     <span style="font-size:11.5px;min-width:44px;text-align:right;color:${v>=75?'var(--green)':v<=25?'var(--red)':'var(--chalk-dim)'}">${relTier(v)}</span></div>`;};
  const c=competitor(p);
  return `<div class="panel"><h3>관계</h3>
    <div class="sm" style="display:grid;gap:5px">
      ${row('감독',p.rel.manager)}${row('코치',p.rel.coach)}
      ${row('선배',p.rel.vet)}${row('후배',p.rel.rookie)}
      ${row('동료',p.rel.team)}${row('주장',p.rel.captain)}
      ${row('프런트',p.rel.front)}${row('팬',p.rel.fan)}
    </div>
    <div class="grp">라이벌</div>
    <div class="sm"><b>${esc(rv.name)}</b> <span class="dim">· ${bond}</span>
      <div class="dim">통산 WAR ${rv.totWar}${rv.retired?' · 은퇴':''}</div></div>
    ${c?`<div class="grp">주전 경쟁</div><div class="sm">${esc(c.name)} <span class="dim">종합 ${c.ovr}</span>
      <div class="${ovr(p)>=c.ovr?'up':'down'}">${ovr(p)>=c.ovr?'내가 앞서 있다':'아직 뒤처져 있다'} (나 ${ovr(p)})</div></div>`:''}
    <div class="grp">팬 · 언론</div>
    <div class="sm">팬 ${'★'.repeat(clamp(Math.round(p.fanRating/20),0,5))}${'☆'.repeat(5-clamp(Math.round(p.fanRating/20),0,5))}
      <span class="dim"> · 언론 관심 ${Math.round(p.media||50)}</span></div>
  </div>`;
}
/* ── 씬 ── */
function sceneHtml(u){
  return `<div class="scene">
    ${u.when?`<div class="when">${esc(u.when)}</div>`:''}
    ${u.dot?`<div class="dotbox">${dotImg(u.dot)}</div>`:''}
    ${u.title?`<h2>${esc(u.title)}</h2>`:''}
    <div class="body">${u.html?u.html:esc(u.body||'')}</div>
    ${u.log&&u.log.length?`<div class="log">${u.log.map(l=>`<div>${esc(l)}</div>`).join('')}</div>`:''}
    ${u.diff?diffHtml(u.diff):''}
    ${u.choices?`<div class="choices${u.month?' acts':''}">${u.choices.map((c,i)=>
      `<button class="choice" onclick="choose(${i})">
        <div class="ct">${c.risk?`<span class="rb ${c.risk}">${RISK_LABEL[c.risk]}</span>`:''}${esc(c.t)}</div>
        ${(c.gain||c.cost)?`<div class="tradeoff">${c.gain?`<span class="gain">+ ${esc(c.gain)}</span>`:''}${c.cost?`<span class="cost">− ${esc(c.cost)}</span>`:''}</div>`:''}
        ${oddsHtml(G.p,c)}</button>`).join('')}</div>`:''}
    ${u.cta?`<button class="go" onclick="advance()">${esc(u.cta)}</button>`:''}
  </div>`;
}
/* ── 선택 처리 ── */
function logChoice(p,title,pick,mark){
  p.choiceLog=p.choiceLog||[];
  p.choiceLog.unshift({y:p.year,title,pick,mark:mark?1:0});
  if(p.choiceLog.length>40)p.choiceLog.pop();
}
function choose(i){
  const c=G.ui.choices[i];
  if(c.next){c.next();return;}
  const p=G.p,before=snapStats(p),fb=p.flags.length;
  const log=(c.outcomes?rollOutcome(p,c):(c.run()||[]));
  if(G.ui.track)logChoice(p,G.ui.title,c.t,p.flags.length>fb);
  if(p.retired)return;
  scene({when:G.ui.when,title:G.ui.title,body:'',log:log.length?log:['…'],
    diff:statDiff(p,before),cta:'계속',after:G.ui.after});
}
/* ── 훈련: 종목 → 강도 (리스크/리턴) ── */
function trainMenu(){
  const p=G.p;
  const when=nowLabel();                                   // 캘린더가 달을 안다
  const ae=ageEff(p);
  return scene({when,title:'무엇에 시간을 쓸까',month:1,
    body:`시간은 한정되어 있다. 무엇을 얻으면 무엇을 잃는다.\n\n${bodyHint(p)}${
      ae.label?`\n<em>${ae.label}</em> — 성장 ×${ae.gain} · 피로 ×${ae.fat}${ae.fatAdd?` (+${ae.fatAdd})`:''}`:''}`,
    choices:TRAININGS[p.pos].filter(t=>!t.rest).map(t=>{
        const pv=trainPreview(p,t,1,1);
        return {t:t.name,
          gain:pv.rows.filter(r=>r.v>0).map(r=>`${r.label} ${numTxt(r.v)}`).join(' · ')||null,
          cost:[...pv.rows.filter(r=>r.v<0).map(r=>`${r.label} ${numTxt(r.v)}`),
                Math.round(pv.fat)?`피로 ${numTxt(pv.fat)}`:null].filter(Boolean).join(' · ')||null,
          next:()=>intensityMenu(t,when)};
      })
      .concat([{t:'돌아간다',gain:null,cost:'다른 행동을 고른다',next:()=>actionMenu()}])});
}
function intensityMenu(t,when){
  const p=G.p;
  return scene({when,title:`${t.name} — 얼마나 몰아붙일까`,dot:'trainSolo',
    body:`${bodyHint(p)}`,
    choices:INTENSITY.map(it=>{
      const pr=Math.round(trainSuccess(p,it)*100);
      const ok=trainPreview(p,t,it.mult,it.fat);         // 성공 시 (실제 식과 동일)
      const ng=trainPreview(p,t,it.mult*.15,it.fat*1.45); // 실패 시
      const odds=[{pct:pr,text:`성공 — ${previewTxt(ok)}`},
                  {pct:100-pr,text:`실패 — ${previewTxt(ng)}${it.inj?' · 부상 위험':''}`}];
      return {t:it.label,risk:it.risk,odds,run:()=>doTrainingWith(p,t,it)};
    }).concat([{t:'돌아간다',risk:'SAFE',s:'다른 훈련을 고른다',next:()=>trainMenu()}])});
}
/* ── 특성 획득 연출 ── */
function traitRevealHtml(t,from){
  return `<div class="reveal">
    <div class="lab">${from?'TRAIT EVOLVED':'NEW TRAIT'}</div>
    <div class="ico">⚾</div>
    <div class="tn2">${esc(t.id)}</div>
    <div class="stars g${t.grade}">${STARS[t.grade]} ${t.grade}</div>
    <div class="desc">${esc(t.desc)}</div>
    ${from?`<div class="sm dim" style="margin-top:10px">[${esc(from)}] 이(가) 한 단계 나아갔다.</div>`:''}
  </div>`;
}
/* ── 시즌 카드 / 시즌 리포트 ── */
function seasonCardHtml(p){
  const t=TEAM(p.team),n=p.seasonsPlayed+1;
  const goal=p.lv==='2군'?'1군 진입':p.lv==='백업'||p.lv==='불펜'?'주전 확보':
    ovr(p)>=78?'리그 정상급 성적':'주전 유지와 성장';
  return `<div class="seasoncard">
    <div class="yy">${p.year}</div>
    <div class="sm" style="letter-spacing:.2em;color:var(--clay);font-weight:800">SEASON</div>
    <div style="margin-top:14px;font-size:15px">${p.age}세 · 프로 ${n}년차 · ${t.name}</div>
    <div class="sm dim" style="margin-top:4px">${t.tag}</div>
    <div style="margin-top:14px"><span class="pill hi">보직 ${p.lv}</span><span class="pill">목표 · ${goal}</span></div>
  </div>`;
}
function seasonSummaryHtml(p,got,agl){
  const s=p.season,pit=p.pos==='pitcher';
  const rows=pit?[['경기',s.g],['이닝',s.ip],['승-패',`${s.w}-${s.l}`],['평균자책',s.era],['탈삼진',s.k],['WAR',s.war]]
                :[['경기',s.g],['타율',s.ab>0?avg3(s.h/s.ab):'-'],['홈런',s.hr],['타점',s.rbi],['도루',s.sb],['WAR',s.war]];
  const g=seasonGrade(s.war);
  const verdict=s.war>=6?'리그를 대표하는 선수가 되었다.':s.war>=3.5?'팀의 중심으로 자리잡았다.':
    s.war>=1.8?'제 몫을 해낸 한 해였다.':s.war>=0?'아쉬움이 남는 시즌이었다.':'잊고 싶은 한 해였다.';
  return `<div class="seasoncard" style="background:linear-gradient(180deg,rgba(255,255,255,.05),transparent)">
      <div class="sm" style="letter-spacing:.2em;color:var(--clay);font-weight:800">${p.year} SEASON REPORT</div>
      <div class="bigline">${rows.map(([l,v])=>`<div><div class="n">${v}</div><div class="l">${l}</div></div>`).join('')}</div>
      <div class="gradebox"><span class="g">${g}</span><span class="sm">시즌 평가<br><span class="dim">${esc(verdict)}</span></span></div>
      ${got.length?`<div style="margin-top:14px">${got.map(x=>`<span class="pill hi">🏆 ${x}</span>`).join('')}</div>`:''}
    </div>
    ${s.rank?`<div class="sm dim center">팀 성적 ${s.rank}위 (${s.teamW}승 ${s.teamL}패)</div>`:''}
    ${agl.length?`<div class="log" style="border-color:var(--red)">${agl.map(a=>`<div>${a}</div>`).join('')}</div>`:''}
    <div class="center sm dim" style="margin-top:12px">팬 평가 ${'★'.repeat(clamp(Math.round(p.fanRating/20),0,5))}${'☆'.repeat(5-clamp(Math.round(p.fanRating/20),0,5))}
      · 별명 "${esc(p.nick||nickname(p))}"</div>`;
}
/* ── 탭 ── */
/* 각 탭이 무엇을 담는지 한 곳에서 정의한다 (요구 11) */
function tabGame(p){
  const g=(p.gameLog||[]).slice().reverse().slice(0,10);
  return `<div class="grp">최근 경기</div>
    ${g.length?`<div class="tlx">${g.map(x=>
      `<div><b>${x.y}</b><span>${esc(x.kind)} — ${esc(x.detail||'')}</span></div>`).join('')}</div>`
      :'<div class="sm dim">아직 기록에 남을 경기가 없습니다.</div>'}
    <div class="grp">포스트시즌</div>
    <div class="sm">${p.post.games?`${p.post.games}경기 · 큰 것 ${p.post.bigHits}회 · 침묵 ${p.post.fail}회
      · 우승 ${p.awards.champ}회${p.awards.ksMvp?` · 한국시리즈 MVP ${p.awards.ksMvp}회`:''}`
      :'<span class="dim">아직 가을 야구 경험이 없습니다.</span>'}</div>
    <div class="grp">이번 시즌</div>${recTable(p)}`;
}
function tabPlayer(p){
  return `${profileTab(p)}
    <div class="grp">성장 그래프</div>${growthGraph(p)}
    <div class="grp">계약 / 연봉</div>${contractPanel(p)}
    <div class="grp">라이벌</div>${rivalPanel(p)}`;
}
function tabRecord(p){
  return `<div class="grp">시즌 / 통산</div>${recTable(p)}
    <div class="grp">커리어</div>${careerTab(p)}
    <div class="grp">수상</div>${awardPanel(p)}`;
}
function tabHistory(p){
  return `<div class="grp">선수 인생 연표</div>${storyTab(p)}
    <div class="grp">리그 역사</div>${historyTab(p)}`;
}
function tabLeague(p){
  return `${leagueTab(p)}
    <div class="grp">리그 뉴스</div>${newsHtml((L&&L.news||[]).slice().reverse().slice(0,10))}`;
}
function awardPanel(p){
  const a=p.awards;
  const rows=[['정규시즌 MVP',a.mvp],['신인왕',a.rookie],['골든글러브',a.gg],['올스타',a.allstar],
    ['한국시리즈 우승',a.champ],['한국시리즈 MVP',a.ksMvp],['홈런왕',a.hrKing],['타율 1위',a.hitKing],
    ['도루왕',a.sbKing],['다승왕',a.winKing],['탈삼진왕',a.soKing],['평균자책 1위',a.eraKing],
    ['국가대표',p.nat.caps],['국제대회 우승',p.nat.gold]].filter(r=>r[1]>0);
  if(!rows.length)return '<div class="sm dim">아직 수상 기록이 없습니다.</div>';
  return `<div>${rows.map(([l,v])=>`<span class="pill hi">${l} ${v}회</span>`).join('')}</div>`;
}
function contractPanel(p){
  const m=p.money||{};
  const hist=(p.salaryHist||[]).slice(-8);
  return `<div class="rvg" style="grid-template-columns:repeat(3,1fr)">
      <span><b>${wonText(m.salary||0)}</b><i>연봉</i></span>
      <span><b>${wonText(m.value||0)}</b><i>시장가치</i></span>
      <span><b>${m.years||0}년</b><i>잔여 계약</i></span>
    </div>
    <div class="sm dim" style="margin-top:6px">자산 ${wonText(m.balance||0)} · 통산 수입 ${wonText(m.earned||0)}</div>
    ${hist.length?`<div class="tlx" style="margin-top:8px">${hist.map(h=>
      `<div><b>${h.y}</b><span>${wonText(h.sal)}${h.note?` · ${esc(h.note)}`:''}</span></div>`).join('')}</div>`:''}`;
}
function infoTabs(p){
  const t=G.tab;
  let body='';
  if(t==='main')      body='';
  else if(t==='game') body=tabGame(p);
  else if(t==='profile')body=tabPlayer(p);
  else if(t==='league') body=tabLeague(p);
  else if(t==='rec')  body=tabRecord(p);
  else if(t==='hist') body=tabHistory(p);
  else body=tabGame(p);
  return `<div class="panel" style="margin-top:14px">
    <div class="tabs">${NAV.filter(x=>x[0]!=='main').map(([k,,l])=>
      `<button class="tab ${t===k?'on':''}" onclick="setTab('${k}')">${l}</button>`).join('')}</div>
    ${body||'<div class="sm dim">아래 탭에서 경기·선수·리그·기록·역사를 볼 수 있습니다.</div>'}</div>`;
}
function chainHtml(p){
  const ch=lifeChain(p);
  if(ch.length<2)return '';
  return `<div class="rule"></div>
    <div class="sm dim" style="margin-bottom:8px">이 인생을 만든 선택들</div>
    <div class="chain" style="max-width:440px;margin:0 auto;text-align:left">
      ${ch.map(c=>`<div><b>${c.y}.${String(c.m||1).padStart(2,'0')}</b><span>${esc(c.t)}</span></div>`).join('')}
      <div class="last"><b>→</b><span>${esc(p.ending?p.ending.title:'')}</span></div>
    </div>`;
}
function storyTab(p){
  const ch=lifeChain(p);
  return `<div class="tlx">${p.timeline.slice().reverse().map(e=>
    `<div><b>${e.y}${e.m?`.${String(e.m).padStart(2,'0')}`:''}</b><span>${esc(e.t)}</span></div>`).join('')||'<span class="dim sm">아직 기록이 없습니다.</span>'}</div>
    ${ch.length?`<div class="grp">남긴 선택</div>
      <div class="chain">${ch.slice().reverse().map(c=>
        `<div><b>${c.y}.${String(c.m||1).padStart(2,'0')}</b><span>${esc(c.t)}</span></div>`).join('')}</div>`:''}
    `;
}
function profileTab(p){
  const s=p.season;
  const gr=PROSPECT.find(x=>x.id===p.grade)||PROSPECT[0];
  return `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px">
      <div class="pcard">
        <div class="ball">${p.pos==='pitcher'?'⚾':p.pos==='catcher'?'🧤':'🏏'}</div>
        <div class="pos">${POS[p.pos].label} · ${p.lv}</div>
        <div class="pn">${esc(p.name)}</div>
        <div class="pm">${p.age}세 · ${TEAM(p.team).name}</div>
        <div class="pm" style="color:var(--clay);margin-top:6px">"${esc(p.nick||nickname(p))}"</div>
        <div style="margin-top:12px"><span class="pill hi">종합 ${ovr(p)}</span><span class="pill">잠재력 ${p.pot>=90?'특급':p.pot>=80?'높음':p.pot>=68?'보통':'낮음'}</span>
          ${p.grade&&p.grade!=='normal'?`<span class="pill" style="color:var(--purple);border-color:rgba(181,138,214,.55)">${gr.label}</span>`:''}</div>
        <div class="sm dim" style="margin-top:6px">${esc(gr.desc)}</div>
        ${s&&s.g?`<div class="sm dim" style="margin-top:10px">${p.year} · ${p.pos==='pitcher'
          ?`${s.w}승 ${s.l}패 ERA ${s.ip?round(s.er*9/s.ip,2):'-'}`
          :`타율 ${s.ab?avg3(s.h/s.ab):'-'} ${s.hr}홈런 ${s.rbi}타점`}</div>`:''}
      </div>
      <div>${statPanel(p)}</div>
      <div>${traitPanel(p)}${relPanel(p)}</div>
    </div>
    <div class="grp" style="margin-top:14px">커리어 WAR 추이</div>
    ${sparkHtml(p)}`;
}
function sparkHtml(p){
  const ss=p.career.seasons;
  if(ss.length<2)return '<div class="sm dim">두 시즌을 마치면 그래프가 그려집니다.</div>';
  const W=320,H=110,pad=18;
  const mx=Math.max(3,...ss.map(s=>s.war)),mn=Math.min(0,...ss.map(s=>s.war));
  const X=i=>pad+(W-pad*2)*(ss.length===1?.5:i/(ss.length-1));
  const Y=v=>H-pad-(H-pad*2)*((v-mn)/(mx-mn||1));
  const pts=ss.map((s,i)=>`${X(i)},${Y(s.war)}`).join(' ');
  return `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="시즌별 WAR 그래프">
    <line class="ax" x1="${pad}" y1="${Y(0)}" x2="${W-pad}" y2="${Y(0)}"/>
    <polyline class="ln" points="${pts}"/>
    ${ss.map((s,i)=>`<circle class="dot" cx="${X(i)}" cy="${Y(s.war)}" r="${s.war===Math.max(...ss.map(x=>x.war))?3.6:2.2}"/>`).join('')}
    <text x="${pad}" y="12">WAR ${round(mx,1)}</text>
    <text x="${pad}" y="${H-4}">${ss[0].year}</text>
    <text x="${W-pad-26}" y="${H-4}">${ss[ss.length-1].year}</text>
  </svg>`;
}
function careerTab(p){
  if(!p.career.seasons.length)return '<span class="dim sm">첫 시즌을 마치면 기록이 쌓입니다.</span>';
  const pit=p.pos==='pitcher';
  return `${sparkHtml(p)}<table class="rec">
    <tr><th>시즌</th><th>나이</th><th>팀</th><th>경기</th>${pit?'<th>이닝</th><th>승</th><th>ERA</th><th>탈삼진</th>':'<th>타율</th><th>홈런</th><th>타점</th><th>도루</th>'}<th>WAR</th><th>평가</th></tr>
    ${p.career.seasons.map(s=>`<tr><td>${s.year}</td><td>${s.age}</td><td>${TEAM(s.team).short}</td><td>${s.g}</td>
      ${pit?`<td>${s.ip}</td><td>${s.w}</td><td>${s.era}</td><td>${s.k}</td>`
           :`<td>${s.ab>0?avg3(s.h/s.ab):'-'}</td><td>${s.hr}</td><td>${s.rbi}</td><td>${s.sb}</td>`}
      <td>${s.war}</td><td>${seasonGrade(s.war)}</td></tr>`).join('')}</table>`;
}
/* ── 명예의 전당 ── */
function viewHof(){
  let list=[...G.hof];
  if(L){
    [...L.retired,...L.players].filter(a=>a.c&&a.c.war>=25&&(a.retired||a.age>=36)).forEach(a=>{
      list.push({name:a.name,pos:POS[a.pos].label,war:a.c.war,
        years:`${a.debut||'-'}~${a.retireYear||'현역'}`,mvp:a.aw.mvp,champ:a.aw.champ,gg:a.aw.gg});
    });
  }
  list=list.sort((a,b)=>b.war-a.war).slice(0,20);
  return `<div class="title" style="max-width:720px">
    <div class="kicker">${L?`WORLD SEED ${L.seed}`:'기록실'}</div>
    <h1 style="font-size:34px">🏆 명예의 전당</h1>
    <p class="sub">한 시대를 보낸 선수들이 여기에 남습니다.</p>
    <div class="panel" style="text-align:left">
    ${list.length?list.map((h,i)=>`<div class="hofrow ${i===0?'top1':''}">
      <span class="rk">${i+1}</span>
      <div style="flex:1">
        <div class="nm">${esc(h.name)}${h.me?' ★':''}</div>
        <div class="sm dim">${h.pos} · ${h.years}</div>
      </div>
      <div style="text-align:right">
        <div><span class="num" style="font-size:20px">${h.war}</span> <span class="sm dim">WAR</span></div>
        <div class="sm dim">${h.ending?esc(h.ending):`MVP ×${h.mvp||0} · 우승 ×${h.champ||0}`}</div>
      </div></div>`).join('')
      :'<span class="dim sm">아직 은퇴한 선수가 없습니다.</span>'}
    </div>
    <div class="menu" style="margin-top:18px"><button onclick="go('title')">돌아가기</button></div>
  </div>`;
}
/* ── 엔딩 ── */
const GRADE_LABEL={'S+':'전설','S':'전설','A':'스타','B':'훌륭한 선수','C':'평범한 선수','D':'아쉬운 커리어','F':'아쉬운 커리어'};
function viewEnding(){
  const p=G.p,e=p.ending,pit=p.pos==='pitcher';
  const rows=pit?[[p.tot.w,'승'],[p.tot.k,'탈삼진'],[p.tot.ip>0?round(p.tot.er*9/p.tot.ip,2):'-','평균자책'],[p.tot.war,'WAR']]
                :[[p.tot.h,'안타'],[p.tot.hr,'홈런'],[p.tot.ab>0?avg3(p.tot.h/p.tot.ab):'-','타율'],[p.tot.war,'WAR']];
  const aw=[[p.awards.mvp,'MVP'],[p.awards.allstar,'올스타'],[p.awards.champ,'우승'],[p.awards.ksMvp,'한국시리즈 MVP'],
    [p.awards.gg,'골든글러브'],[p.nat.gold,'국제대회 우승'],[p.awards.hrKing,'홈런왕'],[p.awards.winKing,'다승왕'],
    [p.awards.soKing,'탈삼진왕'],[p.awards.sbKing,'도루왕']].filter(a=>a[0]>0).map(a=>`${a[1]} × ${a[0]}`);
  const rv=p.rival;
  const rvLine=rv.bond>=70?'"그는 평생의 경쟁자이자 가장 가까운 친구였다."'
    :rv.bond<=30?`"두 선수는 ${p.seasonsPlayed}년 동안 서로를 인정하지 않았다."`
    :`"${rv.name}이 없었다면, 그는 이만큼 오지 못했을 것이다."`;
  const g=careerGrade(p);
  const hl=lifeHighlights(p);
  return `<div class="ending">
    <div class="yr">${p.career.seasons[0]?p.career.seasons[0].year:2026} — ${p.year}</div>
    <div class="nm">${esc(p.name)}</div>
    <div class="sm" style="color:var(--clay)">"${esc(p.nick||nickname(p))}"</div>
    <div class="sm dim">${POS[p.pos].label} · ${p.teamsPlayed.map(t=>TEAM(t).short).join(' → ')} · ${p.seasonsPlayed}시즌</div>
    <div class="bigline">${rows.map(([n,l])=>`<div><div class="n">${n}</div><div class="l">${l}</div></div>`).join('')}</div>
    ${aw.length?`<div>${aw.map(a=>`<span class="pill hi">${a}</span>`).join('')}</div>`:''}
    <div class="rule"></div>
    <div>${p.traits.map(t=>`<span class="pill hi">${t}</span>`).join('')}</div>
    <div class="rule"></div>
    <div class="gradebox"><span class="g">${g}</span><span style="text-align:left">
      <span class="sm dim">최종 등급</span><br><b>${GRADE_LABEL[g]||'선수'}</b></span></div>
    <div class="verdict" style="margin-top:14px">${esc(e.title)}</div>
    <div class="quote">${esc(e.quote).replace(/\n/g,'<br>')}</div>
    <div class="sm dim" style="margin-top:12px">${esc(p.retireLine||'')}</div>
    <div class="quote" style="font-size:14px;margin-top:8px">${esc(rvLine)}</div>
    ${hl.length?`<div class="rule"></div><div class="sm dim" style="margin-bottom:8px">이번 생의 기록</div>
      <div class="tl" style="max-width:440px;margin:0 auto;text-align:left">
      ${hl.map(([k,v,x])=>`<div><b style="min-width:0;color:var(--chalk-dim);font-family:var(--font);font-size:12px;min-width:104px">${esc(k)}</b>
        <span>${esc(v)}${x?` <span class="dim">${esc(x)}</span>`:''}</span></div>`).join('')}</div>`:''}
    <div class="rule"></div>
    <div class="sm dim" style="margin-bottom:8px">커리어 연대기</div>
    <div class="tlx" style="max-width:440px;margin:0 auto;text-align:left">
      ${p.timeline.map(t=>`<div><b>${t.y}${t.m?`.${String(t.m).padStart(2,'0')}`:''}</b><span>${esc(t.t)}</span></div>`).join('')}</div>
    ${chainHtml(p)}
    ${chronicleHtml(p)}
    <div class="rule"></div>
    <div class="menu"><button onclick="go('hof')">명예의 전당</button><button onclick="go('title')">새로운 선수</button></div>
  </div>`;
}

/* ==========================================================================
   [50] UI v3.1 — 성장 그래프 (요구 7)
   p.stHist 에 시즌 시작마다 쌓인 능력치를 연도별 선그래프로 그린다.
   ========================================================================== */
const GRAPH_KEYS={
  batter:['contact','power','eye','speed','defense','throw','mental','stamina'],
  pitcher:['velo','stuff','control','breaking','stamina','crisis','mental','recovery'],
  catcher:['contact','power','catching','blocking','lead','throw','defense','mental']
};
function growthGraph(p){
  const h=(p.stHist||[]).filter(x=>x&&x.year);
  if(h.length<2)return '<div class="sm dim">두 번째 시즌부터 성장 곡선이 그려집니다.</div>';
  const keys=(GRAPH_KEYS[p.pos]||[]).filter(k=>h.some(x=>x[k]!==undefined));
  const sel=G.gKey&&keys.includes(G.gKey)?G.gKey:keys[0];
  const W=280,H=110,PAD=22;
  const xs=h.map((_,i)=>PAD+(W-PAD-6)*(h.length===1?0:i/(h.length-1)));
  const vals=h.map(x=>x[sel]||0);
  const lo=Math.max(0,Math.min(...vals)-6), hi=Math.min(100,Math.max(...vals)+6);
  const y=v=>H-14-(H-28)*((v-lo)/Math.max(1,hi-lo));
  const pts=vals.map((v,i)=>`${round(xs[i],1)},${round(y(v),1)}`).join(' ');
  const peak=vals.indexOf(Math.max(...vals));
  return `<div class="gsel">${keys.map(k=>
      `<button class="gk ${k===sel?'on':''}" onclick="setGKey('${k}')">${SLABEL[k]}</button>`).join('')}</div>
    <svg class="gchart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${SLABEL[sel]} 연도별 변화">
      ${[0,.5,1].map(f=>{const yy=14+(H-28)*f;const v=Math.round(hi-(hi-lo)*f);
        return `<line x1="${PAD}" y1="${yy}" x2="${W-6}" y2="${yy}" stroke="rgba(236,234,223,.12)"/>
                <text x="2" y="${yy+3}" class="gax">${v}</text>`;}).join('')}
      <polyline points="${pts}" fill="none" stroke="var(--lamp)" stroke-width="2"
        stroke-linejoin="round" stroke-linecap="round"/>
      ${vals.map((v,i)=>`<circle cx="${round(xs[i],1)}" cy="${round(y(v),1)}" r="${i===peak?3.2:2}"
        fill="${i===peak?'var(--green)':'var(--clay)'}"/>`).join('')}
      ${h.map((x,i)=>i%Math.ceil(h.length/5)===0||i===h.length-1
        ?`<text x="${round(xs[i],1)}" y="${H-2}" class="gax" text-anchor="middle">${x.age}</text>`:'').join('')}
    </svg>
    <div class="sm dim">${SLABEL[sel]} · ${h[0].age}세 ${vals[0]} → ${h[h.length-1].age}세 ${vals[vals.length-1]}
      <span style="color:var(--green)"> · 최고 ${h[peak].age}세 ${vals[peak]}</span></div>`;
}
function setGKey(k){G.gKey=k;render();}

/* ==========================================================================
   [51] UI v3.1 — 라이벌 / 타이틀 경쟁 (요구 8)
   ========================================================================== */
function titleRace(p){
  if(!L||!p.season||!p.season.g)return '';
  const s=p.season, bat=p.pos!=='pitcher';
  const cat=bat?[['홈런','hr'],['안타','h'],['타점','rbi'],['도루','sb']]
               :[['승','w'],['탈삼진','k']];
  const rows=cat.map(([label,key])=>{
    const mine=s[key]||0;
    let best=null;
    L.players.forEach(a=>{
      if(!isAi(a)||a.retired||a.lv!=='1군'||!a.s)return;
      if((a.pos==='pitcher')!==!bat)return;
      if(!best||(a.s[key]||0)>(best.s[key]||0))best=a;
    });
    if(!best)return '';
    const bv=best.s[key]||0, lead=mine-bv;
    const max=Math.max(mine,bv,1);
    return `<div class="race">
      <div class="rt">${label} 경쟁 <span class="${lead>=0?'up':'down'}">${lead>=0?`+${lead}`:lead}</span></div>
      <div class="rr"><span class="rn">나</span>
        <span class="rb"><i style="width:${mine/max*100}%"></i></span><b>${mine}</b></div>
      <div class="rr"><span class="rn">${esc(best.name)}</span>
        <span class="rb alt"><i style="width:${bv/max*100}%"></i></span><b>${bv}</b></div>
    </div>`;
  }).filter(Boolean).join('');
  return rows?`<div class="grp">타이틀 경쟁</div>${rows}`:'';
}
function rivalPanel(p){
  const rv=p.rival;
  const a=L&&(L.players.find(x=>x.id===rv.id)||L.retired.find(x=>x.id===rv.id));
  const bond=rv.bond>=75?'가장 가까운 친구':rv.bond>=58?'선의의 경쟁자':rv.bond>=40?'경쟁자':rv.bond>=25?'견제 관계':'악연';
  if(!a)return `<div class="sm dim">라이벌 정보를 찾을 수 없습니다.</div>`;
  const line=a.s&&a.s.g?(a.pos==='pitcher'
      ? `${a.s.w}승 ${a.s.l}패 ERA ${a.s.era}`
      : `타율 ${a.s.ab?avg3(a.s.h/a.s.ab):'-'} ${a.s.hr}홈런 ${a.s.rbi}타점`):'기록 없음';
  const tot=a.c?(a.pos==='pitcher'?`${a.c.w}승 ${a.c.k}K`:`${a.c.h}안타 ${a.c.hr}홈런`):'-';
  return `<div class="rivalcard">
      <div class="rvn">${esc(a.name)} <span class="dim sm">${POS[a.pos].label} · ${a.age}세 · ${TEAM(a.team).short}</span></div>
      <div class="sm dim">${bond}${a.retired?' · 은퇴':''}</div>
      <div class="rvg">
        <span><b>${a.ovr}</b><i>종합</i></span>
        <span><b>${a.c?a.c.war:0}</b><i>통산 WAR</i></span>
        <span><b>${a.aw?a.aw.mvp:0}</b><i>MVP</i></span>
        <span><b>${a.aw?a.aw.allstar:0}</b><i>올스타</i></span>
      </div>
      <div class="sm" style="margin-top:6px">${p.year} 시즌 · ${line}</div>
      <div class="sm dim">통산 · ${tot}</div>
      <div class="sm" style="margin-top:6px">
        나 <b>${ovr(p)}</b> vs 라이벌 <b>${a.ovr}</b>
        <span class="${ovr(p)>=a.ovr?'up':'down'}">${ovr(p)>=a.ovr?'내가 앞선다':'아직 뒤처져 있다'}</span></div>
    </div>${titleRace(p)}`;
}
