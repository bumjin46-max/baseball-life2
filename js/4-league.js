/* 4-league.js — 리그 — AI 선수 생성 · 시즌 시뮬 · 성장/트레이드/FA · 역사와 기록
   원본 index.html 섹션: [19] [20] [21] [22]
   ※ 클래식 스크립트로 순서대로 로드됩니다. index.html의 <script> 순서를 바꾸지 마세요. */
"use strict";

/* ==========================================================================
   [19] ENGINE — AI 선수 생성 (playerEngine)
   ========================================================================== */
const STYLES={
  batter:[['거포형',{power:19,contact:-8,speed:-8}],['교타자형',{contact:16,power:-10,eye:5}],
          ['호타준족',{speed:16,run:15,power:-9}],['수비형',{defense:14,throw:9,power:-8}],['만능형',{}]],
  pitcher:[['파워피처',{velo:15,stuff:8,control:-10}],['제구형',{control:15,breaking:8,velo:-9}],
           ['이닝이터형',{stamina:10,control:4,stuff:-4}],['만능형',{}]],
  catcher:[['수비형 포수',{defense:8,throw:9,blocking:8,contact:-7}],['공격형 포수',{contact:9,power:7,lead:-6}],
           ['리드형',{lead:10,mental:6,power:-5}],['만능형',{}]]
};
function aiStats(pos,target,style){
  const st={};
  POS[pos].keys.forEach(k=>st[k]=clamp(Math.round(SR.norm(target,6)+(style[k]||0)),18,99));
  let cur=ovrOf(pos,st),t=0;
  while(Math.abs(cur-target)>1&&t++<25){
    const d=(target-cur)*.9;
    POS[pos].keys.forEach(k=>st[k]=clamp(Math.round(st[k]+d),18,99));
    cur=ovrOf(pos,st);
  }
  return st;
}
let AI_ID=1;
function genAi(teamId,pos,age,year,tier,used){
  const [sname,sbias]=SR.pick(STYLES[pos]);
  let target;
  if(age<=21)target=SR.norm(tier==='top'?54:46,5);
  else if(age<=25)target=SR.norm(tier==='top'?66:56,6);
  else if(age<=31)target=SR.norm(tier==='top'?75:62,7);
  else target=SR.norm(tier==='top'?70:58,7);
  target=clamp(Math.round(target),30,92);
  const st=aiStats(pos,target,sbias);
  const pot=clamp(Math.round(target+SR.norm(age<=21?19:age<=25?11:4,8)),target,97);
  return {
    id:'A'+(AI_ID++),name:genName(used),pos,age,born:year-age,team:teamId,
    style:sname,st,pot,ovr:ovrOf(pos,st),lv:'2군',role:'',
    s:blankLine(),c:{g:0,ab:0,h:0,hr:0,rbi:0,sb:0,bb:0,war:0,ip:0,w:0,l:0,sv:0,k:0,er:0},
    aw:{mvp:0,rookie:0,gg:0,allstar:0,hr:0,hit:0,sb:0,win:0,so:0,era:0,champ:0,ks:0,nat:0},
    debut:0,peak:0,peakY:0,teams:[teamId],retired:false,lines:[],flagRival:false
  };
}
function blankLine(){return{g:0,pa:0,ab:0,h:0,hr:0,rbi:0,sb:0,bb:0,so:0,d2:0,avg:0,ops:0,
  ip:0,w:0,l:0,sv:0,k:0,er:0,era:0,war:0};}

/* ── 세계 생성 ── */
let L=null;
function genWorld(seed,year){
  seedWorld(seed);AI_ID=1;
  const used=new Set();
  L={seed,year,players:[],retired:[],history:[],rec:{season:{},career:{}},games:[],
     standings:[],champions:[],lastTrades:[]};
  TEAMS.forEach(t=>{
    const plan=[['batter',8,'1군'],['catcher',2,'1군'],['pitcher',10,'1군'],
                ['batter',4,'2군'],['catcher',1,'2군'],['pitcher',4,'2군']];
    plan.forEach(([pos,n,lv])=>{
      for(let i=0;i<n;i++){
        const age=lv==='1군'?SR.i(22,36):SR.i(18,23);
        const tier=(lv==='1군'&&SR.c(.25+CUL(t.id).vet*.03))?'top':'std';
        const a=genAi(t.id,pos,age,year,tier,used);
        a.lv=lv;a.debut=lv==='1군'?year-SR.i(1,Math.max(1,age-20)):0;
        L.players.push(a);
      }
    });
  });
  SRND=Math.random;
  return L;
}
const roster=tid=>L.players.filter(a=>a.team===tid&&!a.retired);
const firstTeam=tid=>roster(tid).filter(a=>a.lv==='1군');

/* ── 보직 배정 / 콜업·강등 ── */
function assignRoles(){
  const NEED={batter:11,catcher:3,pitcher:13}, ONE={batter:8,catcher:2,pitcher:10};
  TEAMS.forEach(t=>{
    ['batter','catcher','pitcher'].forEach(pos=>{
      let have=roster(t.id).filter(a=>a.pos===pos);
      while(have.length<NEED[pos]){                       // 인원 부족 → 육성선수 보충
        const a=genAi(t.id,pos,R.i(19,24),L.year,'std',null);
        a.lv='2군';L.players.push(a);have.push(a);
      }
      const arr=have.sort((a,b)=>(b.ovr+(b.lv==='1군'?1.5:0))-(a.ovr+(a.lv==='1군'?1.5:0)));
      arr.forEach((a,i)=>{
        const up=i<ONE[pos];
        if(up&&a.lv!=='1군'&&!a.debut)a.debut=L.year;
        a.lv=up?'1군':'2군';
      });
    });
    const r=roster(t.id);
    const bats=r.filter(a=>a.lv==='1군'&&a.pos!=='pitcher').sort((a,b)=>b.ovr-a.ovr);
    bats.forEach((a,i)=>a.role=i<8?'주전':'백업');
    const pit=r.filter(a=>a.lv==='1군'&&a.pos==='pitcher').sort((a,b)=>b.ovr-a.ovr);
    pit.forEach((a,i)=>a.role=i<5?'선발':'불펜');
    r.filter(a=>a.lv==='2군').forEach(a=>a.role='2군');
  });
}
function teamRating(tid,playerWar){
  const r=firstTeam(tid);
  const bats=r.filter(a=>a.pos!=='pitcher').sort((x,y)=>y.ovr-x.ovr).slice(0,9);
  const sp=r.filter(a=>a.pos==='pitcher'&&a.role==='선발').slice(0,5);
  const rp=r.filter(a=>a.pos==='pitcher'&&a.role==='불펜').slice(0,5);
  const m=a=>a.length?a.reduce((s,x)=>s+x.ovr,0)/a.length:50;
  let v=m(bats)*.44+m(sp)*.40+m(rp)*.16;
  if(playerWar)v+=playerWar*1.1;
  return v;
}

/* ==========================================================================
   [20] ENGINE — AI 시즌 시뮬레이션 (leagueEngine)
   ========================================================================== */
function aiBatSeason(a,teamStr){
  const s=blankLine();
  const gm=Math.round((a.role==='주전'?144:a.role==='백업'?74:26)*(a.pos==='catcher'?.88:1)*R.f(.78,1.0));
  const pa=Math.round(gm*(a.role==='주전'?4.3:3.5));
  const C=a.st.contact,P=a.st.power,E=a.st.eye;
  const avg=clamp(.140+C*.0019+E*.0002+R.norm(0,.021),.130,.400);
  const bb=Math.round(pa*clamp((E/100)*.135,.02,.22));
  const so=Math.round(pa*clamp(.245-C*.0012+P*.0008,.06,.36));
  const abn=Math.max(1,pa-bb-Math.round(pa*.02));
  const h=Math.round(abn*avg), hr=Math.round(pa*Math.pow(P/100,3.2)*.070);
  const d2=Math.round(h*(.15+P*.0009));
  const rn=a.st.run||38, sp=a.st.speed||38;
  const sb=Math.round(Math.pow(rn/100,2)*gm*.6*(.58+sp*.003));
  s.g=gm;s.pa=pa;s.ab=abn;s.h=Math.min(h,abn);s.hr=hr;s.d2=d2;s.bb=bb;s.so=so;s.sb=Math.max(0,sb);
  s.rbi=Math.round(hr*2.15+h*.33+(teamStr-62)*.35);
  s.avg=s.h/s.ab;
  const obp=(s.h+s.bb)/pa, slg=(s.h+s.d2+2*s.hr)/s.ab;
  s.ops=round(obp+slg,3);
  let def=((a.st.defense-58)/100)*1.6*(gm/144);
  if(a.pos==='catcher')def+=1.2*(gm/144)+((a.st.lead-55)/100)*1.4;
  s.war=round(clamp((gm/144)*((s.ops-.660)*15)+def+s.sb*.012,-2,9),1);
  return s;
}
function aiPitSeason(a,teamStr){
  const s=blankLine();
  const starter=a.role==='선발';
  const app=Math.round((starter?30:a.role==='불펜'?55:12)*R.f(.72,1.0));
  const per=starter?(4.3+a.st.stamina*.028):(a.role==='불펜'?1.5:3.4);
  const ip=round(app*per,1);
  const rate=a.st.stuff*.34+a.st.control*.30+a.st.velo*.16+a.st.breaking*.20;
  const era=clamp(round(9.9-rate*.078+R.norm(0,.55)-(a.st.crisis-50)*.006,2),1.30,9.5);
  const k9=clamp(2.5+(a.st.velo-45)*.085+(a.st.stuff-45)*.06+a.st.breaking*.018,3,15);
  const dec=Math.round(app*(starter?.68:.26));
  const wr=clamp(.44+(4.70-era)*.075+(teamStr-62)*.006,.18,.80);
  s.g=app;s.ip=ip;s.w=Math.round(dec*wr);s.l=Math.max(0,dec-s.w);
  s.sv=starter?0:Math.round(app*R.f(0,.35));
  s.k=Math.round(ip/9*k9);s.er=Math.round(ip/9*era);s.era=era;
  s.war=round(clamp((ip/9)*((5.00-era)*.135)+s.sv*.06,-2,9),1);
  return s;
}
function aiSeasonAll(){
  const ratings={};
  TEAMS.forEach(t=>ratings[t.id]=teamRating(t.id));
  L.players.forEach(a=>{
    if(a.retired){a.s=blankLine();return;}
    if(a.lv==='2군'){a.s=blankLine();return;}
    if(!a.debut)a.debut=L.year;
    a.s=a.pos==='pitcher'?aiPitSeason(a,ratings[a.team]):aiBatSeason(a,ratings[a.team]);
    if(R.c(.13)){ const k=R.f(.35,.7);   // 부상·부진 시즌
      ['g','pa','ab','h','hr','rbi','sb','bb','so','ip','w','l','k','er'].forEach(f=>a.s[f]=Math.round(a.s[f]*k));
      a.s.war=round(a.s.war*k,1); }
    const c=a.c,s=a.s;
    c.g+=s.g;c.ab+=s.ab;c.h+=s.h;c.hr+=s.hr;c.rbi+=s.rbi;c.sb+=s.sb;c.bb+=s.bb;
    c.ip=round(c.ip+s.ip,1);c.w+=s.w;c.l+=s.l;c.sv+=s.sv;c.k+=s.k;c.er+=s.er;
    c.war=round(c.war+s.war,1);
    if(s.war>a.peak){a.peak=s.war;a.peakY=L.year;}
    if(a.flagRival||s.war>=5)a.lines.push({y:L.year,t:a.team,g:s.g,h:s.h,hr:s.hr,rbi:s.rbi,
      sb:s.sb,avg:round(s.avg,3),ip:s.ip,w:s.w,era:s.era,k:s.k,war:s.war});
  });
  return ratings;
}
/* ── 순위 ── */
function simStandings(playerWar){
  const ratings={};
  TEAMS.forEach(t=>ratings[t.id]=teamRating(t.id,t.id===G.p.team?playerWar:0));
  const mean=TEAMS.reduce((s,t)=>s+ratings[t.id],0)/TEAMS.length;
  let rows=TEAMS.map(t=>({id:t.id,rating:round(ratings[t.id],1),
    w:clamp(Math.round(72+(ratings[t.id]-mean)*2.2+R.norm(0,5.5)),42,102)}));
  const tot=rows.reduce((s,r)=>s+r.w,0), adj=(720-tot)/rows.length;
  rows.forEach(r=>{r.w=clamp(Math.round(r.w+adj),42,102);r.l=144-r.w;});
  rows.sort((a,b)=>b.w-a.w||b.rating-a.rating);
  rows.forEach((r,i)=>r.rank=i+1);
  L.standings=rows;
  return rows;
}
function postseasonRun(){
  const top=L.standings.slice(0,5);
  let field=top.map(r=>({id:r.id,rating:r.rating,rank:r.rank}));
  // 준플레이오프 → 플레이오프 → 한국시리즈 (상위 시드 어드밴티지)
  const beat=(a,b,edge)=>{const p=clamp(.5+(a.rating-b.rating)*.035+edge,.1,.9);return R.c(p)?a:b;};
  let x=beat(field[3],field[4],.06);
  x=beat(field[2],x,.10);
  x=beat(field[1],x,.12);
  const champ=beat(field[0],x,.14);
  return {champ:champ.id,runnerUp:(champ.id===field[0].id?x.id:field[0].id)};
}
/* ── 시상 ── */
function leagueAwards(playerEntry){
  const ents=L.players.filter(a=>!a.retired&&a.lv==='1군').map(a=>({a,s:a.s,name:a.name,pos:a.pos,
    team:a.team,rookie:a.debut===L.year,ai:1}));
  if(playerEntry)ents.push(playerEntry);
  const bats=ents.filter(e=>e.pos!=='pitcher'), pits=ents.filter(e=>e.pos==='pitcher');
  const best=(arr,f,min)=>arr.filter(e=>min?min(e):true).sort((x,y)=>f(y)-f(x))[0];
  const lead={
    hr:best(bats,e=>e.s.hr), hit:best(bats,e=>e.s.h),
    avg:best(bats,e=>e.s.avg,e=>e.s.ab>=250), rbi:best(bats,e=>e.s.rbi), sb:best(bats,e=>e.s.sb),
    win:best(pits,e=>e.s.w), so:best(pits,e=>e.s.k),
    era:best(pits,e=>-e.s.era,e=>e.s.ip>=100),
    mvp:best(ents,e=>e.s.war),
    rookie:best(ents.filter(e=>e.rookie),e=>e.s.war)
  };
  // 올스타 / 골든글러브
  const allstars=ents.filter(e=>e.s.war>=3.0).sort((x,y)=>y.s.war-x.s.war).slice(0,24);
  const gg={};
  ['batter','pitcher','catcher'].forEach(pos=>{
    const c=ents.filter(e=>e.pos===pos).sort((x,y)=>y.s.war-x.s.war)[0];
    if(c)gg[pos]=c;
  });
  // AI 수상 반영
  const bump=(e,k)=>{if(e&&e.ai)e.a.aw[k]++;};
  bump(lead.hr,'hr');bump(lead.hit,'hit');bump(lead.avg,'hit');bump(lead.sb,'sb');
  bump(lead.win,'win');bump(lead.so,'so');bump(lead.era,'era');
  bump(lead.mvp,'mvp');bump(lead.rookie,'rookie');
  allstars.forEach(e=>{if(e.ai)e.a.aw.allstar++;});
  Object.values(gg).forEach(e=>{if(e.ai)e.a.aw.gg++;});
  lead.allstars=allstars;lead.gg=gg;lead.ents=ents;
  return lead;
}
/* ── 리그 기록 갱신 ── */
function updateRecords(entries){
  const S=L.rec.season,C=L.rec.career;
  const chk=(k,name,v,year,extra)=>{if(!S[k]||v>S[k].v)S[k]={v:round(v,3),name,y:year,extra};};
  entries.forEach(e=>{
    const s=e.s;
    if(e.pos==='pitcher'){
      chk('w',e.name,s.w,L.year);chk('k',e.name,s.k,L.year);
      if(s.ip>=100&&(!S.era||s.era<S.era.v))S.era={v:s.era,name:e.name,y:L.year};
    }else{
      chk('hr',e.name,s.hr,L.year);chk('h',e.name,s.h,L.year);chk('rbi',e.name,s.rbi,L.year);
      chk('sb',e.name,s.sb,L.year);
      if(s.ab>=250)chk('avg',e.name,s.avg,L.year);
    }
    chk('war',e.name,s.war,L.year);
  });
  const all=[...L.players,...L.retired];
  const ckey=(k,f,min)=>{let b=null;all.forEach(a=>{const v=f(a);if(v!=null&&(!b||v>b.v))b={v:round(v,1),name:a.name};});
    if(G.p){const v=f(playerCareerObj());if(v!=null&&(!b||v>b.v))b={v:round(v,1),name:G.p.name,me:1};}
    C[k]=b;};
  ckey('hr',a=>a.c?a.c.hr:null);ckey('h',a=>a.c?a.c.h:null);ckey('w',a=>a.c?a.c.w:null);
  ckey('k',a=>a.c?a.c.k:null);ckey('war',a=>a.c?a.c.war:null);
}
function playerCareerObj(){const p=G.p;return {c:{hr:p.tot.hr,h:p.tot.h,w:p.tot.w,k:p.tot.k,war:p.tot.war}};}

/* ==========================================================================
   [21] ENGINE — 성장 / 은퇴 / 신인 / 트레이드 / FA (developmentEngine)
   ========================================================================== */
function aiDevelop(a){
  const age=a.age;
  const rate=age<=22?.20:age<=26?.13:age<=29?.06:.01;
  const dev=CUL(a.team).youth*.02;
  POS[a.pos].keys.forEach(k=>{
    let g=(a.pot-a.st[k])*rate*(1+dev)*R.f(.5,1.5);
    if(age>=30){
      const phys=a.pos==='pitcher'?['velo','stamina','recovery']:['speed','run','stamina','defense'];
      g-=phys.includes(k)?(age>=35?R.f(2.0,3.8):age>=33?R.f(1.2,2.6):R.f(.6,1.6))
                         :(age>=34?R.f(.5,1.6):age>=32?R.f(.2,.9):0);
    }
    a.st[k]=clamp(round(a.st[k]+g,1),12,99);
  });
  a.ovr=ovrOf(a.pos,a.st);
  a.age++;
}
function aiRetire(a){
  if(a.age>=41)return true;
  if(a.age>=38&&R.c(.45))return true;
  if(a.age>=36&&a.ovr<68)return true;
  if(a.age>=34&&a.ovr<60)return true;
  if(a.age>=32&&a.ovr<50)return true;
  if(a.age>=27&&a.ovr<42)return true;          // 성장 실패 → 방출
  if(a.lv==='2군'&&a.age>=27&&a.ovr<50)return true;
  return false;
}
function genRookies(year,used){
  const out=[];
  TEAMS.forEach(t=>{
    const n=SR.i(2,3)+(CUL(t.id).youth>=4?1:0);
    for(let i=0;i<n;i++){
      const pos=SR.c(.45)?'batter':SR.c(.75)?'pitcher':'catcher';
      const tier=SR.c(.12)?'top':'std';
      const a=genAi(t.id,pos,SR.i(18,21),year,tier,used);
      a.lv='2군';a.rookieYear=year;
      out.push(a);
    }
  });
  return out;
}
function aiOffseason(){
  seedWorld((L.seed+L.year*7919)>>>0);
  const used=new Set(L.players.map(a=>a.name));
  const notes=[];
  // 은퇴
  L.players.filter(a=>!a.retired).forEach(a=>{
    if(aiRetire(a)){
      a.retired=true;a.retireYear=L.year;
      if(a.c.war>=20||a.flagRival){
        L.retired.push(a);
        if(a.c.war>=25)notes.push(`${a.name} 은퇴 (통산 WAR ${a.c.war})`);
      }
    }
  });
  L.players=L.players.filter(a=>!a.retired);
  // 성장/노쇠
  L.players.forEach(aiDevelop);
  // FA 이동
  const fas=L.players.filter(a=>a.age>=28&&a.ovr>=62&&R.c(.14));
  fas.forEach(a=>{
    const cands=TEAMS.filter(t=>t.id!==a.team).sort((x,y)=>(y.money+CUL(y.id).fa)-(x.money+CUL(x.id).fa));
    const to=R.c(.6)?cands[R.i(0,2)]:R.pick(cands);
    if(!to)return;
    a.team=to.id;if(!a.teams.includes(to.id))a.teams.push(to.id);
    if(a.ovr>=72)notes.push(`FA — ${a.name}, ${to.name} 이적`);
  });
  // 트레이드
  L.lastTrades=[];
  for(let i=0;i<R.i(2,4);i++){
    const [ta,tb]=R.shuffle(TEAMS).slice(0,2);
    const A=roster(ta.id).filter(a=>a.lv==='1군'),B=roster(tb.id).filter(a=>a.lv==='1군');
    if(A.length<12||B.length<12)continue;
    const needYouth=CUL(ta.id).youth>=4;
    const a1=R.pick(needYouth?A.filter(x=>x.age>=30):A.filter(x=>x.age<=25))||R.pick(A);
    const b1=R.pick(needYouth?B.filter(x=>x.age<=25):B.filter(x=>x.age>=27))||R.pick(B);
    if(!a1||!b1||Math.abs(a1.ovr-b1.ovr)>12)continue;
    a1.team=tb.id;b1.team=ta.id;
    if(!a1.teams.includes(tb.id))a1.teams.push(tb.id);
    if(!b1.teams.includes(ta.id))b1.teams.push(ta.id);
    const line=`${ta.short} ${a1.name} ↔ ${tb.short} ${b1.name}`;
    L.lastTrades.push(line);
    if(a1.ovr>=70||b1.ovr>=70)notes.push('트레이드 — '+line);
  }
  // 신인
  const rk=genRookies(L.year+1,used);
  L.players.push(...rk);
  // 정원 관리 — 넘치면 하위 선수 방출
  TEAMS.forEach(t=>{
    const r=roster(t.id).sort((a,b)=>(b.ovr+b.pot*.3-b.age)-(a.ovr+a.pot*.3-a.age));
    r.slice(30).forEach(a=>{a.retired=true;a.retireYear=L.year;});
  });
  L.players=L.players.filter(a=>!a.retired);
  L.retired=L.retired.filter(a=>a.c.war>=20||a.flagRival).slice(-90);
  L.players.forEach(a=>{if(!a.flagRival&&a.lines.length>18)a.lines=a.lines.slice(-18);});
  const star=rk.sort((a,b)=>b.pot-a.pot)[0];
  if(star&&star.pot>=88)notes.push(`${L.year+1} 신인 — ${star.name} (${TEAM(star.team).short}), 특급 유망주로 평가받는다`);
  SRND=Math.random;
  return notes;
}

/* ==========================================================================
   [22] ENGINE — 역사 / 기록 (historyEngine)
   ========================================================================== */
function pushHistory(o){L.history.push(o);}
function historicGame(kind,detail){
  const g={y:L.year,kind,detail,who:G.p?G.p.name:''};
  L.games.push(g);
  if(G.p){G.p.gameLog=G.p.gameLog||[];G.p.gameLog.push(g);
    G.p.timeline.push({y:L.year,t:kind});}
  return g;
}
function milestoneCheck(p){
  const out=[];
  const M=[[2000,'통산 2000안타',()=>p.tot.h],[2500,'통산 2500안타',()=>p.tot.h],
    [300,'통산 300홈런',()=>p.tot.hr],[500,'통산 500홈런',()=>p.tot.hr],
    [400,'통산 400도루',()=>p.tot.sb],
    [150,'통산 150승',()=>p.tot.w],[200,'통산 200승',()=>p.tot.w],
    [2000,'통산 2000탈삼진',()=>p.tot.k],[3000,'통산 3000탈삼진',()=>p.tot.k]];
  p.milestones=p.milestones||[];
  M.forEach(([n,label,f])=>{
    const rel=(label.includes('승')||label.includes('탈삼진'))===(p.pos==='pitcher');
    if(!rel)return;
    if(f()>=n&&!p.milestones.includes(label)){
      p.milestones.push(label);p.timeline.push({y:p.year,t:label});
      historicGame(label,`${p.name}, ${label} 달성`);
      out.push(label);
    }
  });
  return out;
}
function leagueLeaderBoard(kind){
  const all=[...L.players,...L.retired].filter(a=>a.c);
  const me={name:G.p.name,c:{hr:G.p.tot.hr,h:G.p.tot.h,w:G.p.tot.w,k:G.p.tot.k,war:G.p.tot.war},me:1};
  const arr=[...all.map(a=>({name:a.name,c:a.c})),me];
  return arr.sort((x,y)=>y.c[kind]-x.c[kind]).slice(0,10);
}
function myRank(kind){
  const all=[...L.players,...L.retired].filter(a=>a.c);
  const v={hr:G.p.tot.hr,h:G.p.tot.h,w:G.p.tot.w,k:G.p.tot.k,war:G.p.tot.war}[kind];
  return all.filter(a=>a.c[kind]>v).length+1;
}
