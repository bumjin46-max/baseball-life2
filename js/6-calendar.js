/* 6-calendar.js — 시간 · 월간 루프 · 월간 행동  (v3.0 Phase 1)
   v2.1의 고정 PHASES 배열(1바퀴=1시즌)을 캘린더 큐로 교체한다.
   runPhase()의 기존 case는 이름 그대로 살아 있고, 월이 그것들을 재배치할 뿐이다.
   ※ 7-ui.js보다 먼저 로드되어야 한다 (G / advance 를 UI가 참조). */
"use strict";

/* ==========================================================================
   [40] STATE — 전역 상태 (구 [13])
   ========================================================================== */
const G={screen:'title',p:null,ui:null,hof:[],tab:'main',hasSave:false,tq:[],
         cal:{year:2026,month:0,week:0,queue:[],last:null}};
const app=()=>document.getElementById('app');

function scene(o){
  G.ui=o;render();save();
  /* 모바일에서 스크롤이 아래에 남아 있으면 새 장면의 첫 줄을 놓친다 */
  try{
    if(window.innerWidth<=940){
      const el=document.querySelector('.scene');
      if(el&&el.getBoundingClientRect().top<0)
        el.scrollIntoView({block:'start',behavior:'smooth'});
    }
  }catch(e){}
}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  .replace(/&lt;em&gt;/g,'<em>').replace(/&lt;\/em&gt;/g,'</em>');}

/* ==========================================================================
   [41] DATA — 12개월 테이블
   season:true 인 달의 frac 합계는 정확히 1.00 이어야 한다.
   그래야 v2.1의 시즌 총량(경기수·피로·성장·부상)이 그대로 보존된다.
   ========================================================================== */
const MONTHS=[
  {m:1, label:'1월',  season:false, frac:0,   note:'비시즌',        mood:'겨울'},
  {m:2, label:'2월',  season:false, frac:0,   note:'스프링캠프',    mood:'캠프'},
  {m:3, label:'3월',  season:false, frac:0,   note:'시범경기',      mood:'개막 전'},
  {m:4, label:'4월',  season:true,  frac:.16, note:'개막',          mood:'봄'},
  {m:5, label:'5월',  season:true,  frac:.19, note:'',              mood:'봄'},
  {m:6, label:'6월',  season:true,  frac:.17, note:'',              mood:'여름'},
  {m:7, label:'7월',  season:true,  frac:.14, note:'올스타 휴식기', mood:'여름'},
  {m:8, label:'8월',  season:true,  frac:.17, note:'',              mood:'한여름'},
  {m:9, label:'9월',  season:true,  frac:.17, note:'순위 싸움',     mood:'가을'},
  {m:10,label:'10월', season:false, frac:0,   note:'포스트시즌',    mood:'가을'},
  {m:11,label:'11월', season:false, frac:0,   note:'시즌 결산',     mood:'늦가을'},
  {m:12,label:'12월', season:false, frac:0,   note:'오프시즌',      mood:'겨울'}
];
const MON=()=>MONTHS[clamp(G.cal.month,1,12)-1];
const inSeason=()=>MON().season;

/* ==========================================================================
   [41b] 주간 시스템 (v3.0 최종)
   시즌중(4~9월)만 4주로 쪼갠다. 비시즌은 월 1행동을 유지한다.
   → 연 턴 수 = 시즌중 6개월×4주(24) + 비시즌 6개월(6) = 30턴.
     전체 주간(48턴)은 비시즌에 할 일이 없어 반복감이 생긴다.
   ========================================================================== */
const WEEKS_IN_MONTH=4;
const weekly=()=>MON().season;                 // 이 달이 주 단위인가
const WEEK_LABEL=['1주차','2주차','3주차','4주차'];
const weekFrac=()=>MON().frac/WEEKS_IN_MONTH;  // 그 주가 시즌에서 차지하는 비중

/* ==========================================================================
   [42] FLOW — 캘린더 큐
   월이 페이즈 토큰 배열을 만들고, advance()가 하나씩 꺼내 쓴다.
   주간 시스템으로 확장할 때는 'action'을 4개로 늘리기만 하면 된다.
   ========================================================================== */
/* 시즌중 한 달 = [주차 → 행동 → 그 주 경기] × 4 + 월말 이벤트.
   주마다 행동 1회. 이벤트는 달에 한 번만 붙는다. */
function seasonMonth(tail){
  const q=['monthStart'];
  for(let w=1;w<=WEEKS_IN_MONTH;w++)q.push('week'+w,'action','games');
  return q.concat(tail||[]);
}
function buildMonth(m){
  switch(m){
  case 1:  return ['monthStart','action'];
  case 2:  return ['monthStart','action','event'];
  case 3:  return ['monthStart','seasonStart','action','rosterSet'];
  case 4:  return seasonMonth(['moment']);
  case 5:  return seasonMonth(['event','levelCheck']);
  case 6:  return seasonMonth(['moment','levelCheck']);
  case 7:  return seasonMonth(['teamEvent','levelCheck']);
  case 8:  return seasonMonth(['moment','levelCheck']);
  case 9:  return seasonMonth(['rank']);
  case 10: return ['monthStart','ksMoment','post','action'];
  case 11: return ['monthStart','award','traits','combo'];
  case 12: return ['monthStart','action','nat','trade','fa','contract','retire','leagueOff','yearEnd'];
  default: return ['monthStart','action'];
  }
}

function advance(){
  const c=G.cal;
  if(G.ui&&G.ui.after){G.ui.after=0;c.queue.unshift(c.last);}   // 결과 화면 → 같은 페이즈 재진입
  let guard=0;
  while(!c.queue.length){
    c.month++;
    if(c.month>12){c.month=1;c.year++;}
    c.queue=buildMonth(c.month).slice();
    if(++guard>24)return;                                        // 방어
  }
  c.last=c.queue.shift();
  if(runPhase(c.last)==='skip')return advance();
}

/* 현재 시점 라벨 — 모든 씬이 이걸 쓴다 */
function nowLabel(extra){
  const m=MON();
  const wk=(weekly()&&G.cal.week>0)?` ${WEEK_LABEL[G.cal.week-1]}`:'';
  return `${G.cal.year}년 ${m.label}${wk}${extra?' · '+extra:(m.note&&!wk?' · '+m.note:'')}`;
}

/* ==========================================================================
   [43] FLOW — 페이즈 실행
   ★ v2.1의 case는 하나도 삭제하지 않았다. monthStart/action/games/
     rosterSet/levelCheck 5개만 새로 추가됐다.
   ========================================================================== */
function runPhase(ph){
  const p=G.p;
  switch(ph){

  /* ── 신규: 달의 시작. 화면을 띄우지 않고 상태만 정리한다 ── */
  /* ── 주 진입: 화면 없이 주차만 올린다 ── */
  case 'week1':case 'week2':case 'week3':case 'week4':
    G.cal.week=+ph.slice(4);
    p.week=G.cal.week;
    return 'skip';

  case 'monthStart':{
    const m=MON();
    p.year=G.cal.year;
    p.month=m.m;
    G.cal.week=0;p.week=0;
    p.monthLog=[];p.monthAcc={ip:0,er:0,ab:0,h:0};
    if(!m.season){                                   // 비시즌엔 몸이 조금 회복된다
      p.fatigue=clamp(p.fatigue-3,0,100);
      p.stress=clamp((p.stress||20)-2,0,100);
    }else{
      /* 기대를 받고 들어온 선수가 기대만큼 못하면 스트레스가 눈덩이처럼 커진다.
         그 체인이 슬럼프·강등으로 이어져야 "천재도 실패할 수 있다"가 성립한다. */
      const hypePress=(p.hype||0)>0&&p.season&&(p.season.war||0)<2.5
        ? Math.round(p.hype/5) : 0;
      p.stress=clamp((p.stress||20)+3+(p.lv==='2군'?2:0)+hypePress,0,100);
    }
    if(p.rehabLeft>0){                               // 재활 카운트다운
      p.rehabLeft--;
      if(p.rehabLeft<=0){p.status='정상';p.monthLog.push('복귀 판정을 받았다.');
        p.lvChangedAt=0;}                              // 복귀 직후엔 보직 재판정을 허용한다
    }
    updateCond(p);
    return 'skip';
  }

  /* ── 신규: 이번 달 무엇을 할까 ── */
  case 'action':return actionMenu();

  /* ── 신규: 그 달의 경기 ── */
  case 'games':{
    const m=MON();
    if(!p.season||!m.season)return 'skip';
    if(p.status==='부상'){
      if(weekly()&&G.cal.week!==WEEKS_IN_MONTH)return 'skip';   // 달에 한 번만 알린다
      return scene({when:nowLabel(),dot:'rehab',title:'재활실',
        body:`${m.label}. 그는 그라운드 대신 재활실에 있었다.`,
        log:['이번 달 경기에 나서지 못했다.'],cta:'계속'});
    }
    const unit=weekly()?weekFrac():m.frac;             // 주간이면 그 주 몫만 시뮬레이션
    const label=weekly()?`${m.label} ${WEEK_LABEL[Math.max(0,G.cal.week-1)]}`:m.label;
    const before=snapStats(p);
    const pre=gameSnap(p);                             // 도트 판정용 (홈런·무실점)
    const log=simHalf(p,label,p.clutchBonus*.2,unit,{m:[m.m]});
    p.monthLog=(p.monthLog||[]).concat(log).slice(-6);
    return scene({when:nowLabel(),dot:gameDot(p,pre),title:'경기',body:'',log,
      diff:statDiff(p,before),cta:'계속'});
  }

  /* ── 신규: 개막 엔트리 / 월간 콜업·강등 (Phase 2에서 실제 판정 연결) ── */
  case 'rosterSet':return rosterScene(true);
  case 'levelCheck':return rosterScene(false);

  /* ── 이하 v2.1 원본 case ── */
  case 'seasonStart':{
    newSeason(p);
    p.nick=nickname(p);
    const cl=competitionCheck(p);
    return scene({when:nowLabel('시즌 준비'),dot:'seasonStart',html:seasonCardHtml(p),log:cl,cta:'시즌 시작'});
  }
  case 'event':return storyEvent();
  case 'moment':case 'moment1':case 'moment2':case 'moment3':return momentEvent();
  case 'teamEvent':return teamEvent();
  case 'combo':{
    const c=comboCheck(p);
    if(!c)return 'skip';
    c.run(p);
    return scene({when:'특성 조합',dot:'evGood',title:c.title,body:c.text,cta:'계속'});
  }
  case 'trade':return tradePhase();
  case 'leagueOff':{
    const notes=aiOffseason();
    if(!notes.length)return 'skip';
    const cards=notes.slice(0,6).map(t=>({tag:'리그',text:t,y:p.year}));
    if(L)L.news=(L.news||[]).concat(cards).slice(-60);
    return scene({when:nowLabel('리그'),dot:'news',title:'리그는 계속 움직인다',
      html:newsHtml(cards),cta:'계속'});
  }
  case 'rank':{
    const log=rankCheck(p);
    const news=genNews(p);
    return scene({when:nowLabel('정규시즌 종료'),dot:p.inPost?'playoffIn':'playoffOut',title:'순위가 결정됐다',
      html:newsHtml(news),log,cta:p.inPost?'가을 야구로':'시즌 결산'});
  }
  case 'ksMoment':{
    if(!p.inPost)return 'skip';
    return showMoment(MOMENTS.find(x=>x.id==='M_KS'));
  }
  case 'post':{
    if(!p.inPost)return 'skip';
    const log=postseason(p);
    return scene({when:nowLabel(),dot:p.awards.champ&&p.timeline.some(t=>t.y===G.cal.year&&t.t==='한국시리즈 우승')?'ksWin':'ksIn',title:'가을',body:'',log,cta:'시즌 결산'});
  }
  case 'award':{
    if(!p.season)return 'skip';
    finalizeSeason(p);
    const got=awardsPhase(p);
    const agl=agingPhase(p);
    p.nick=nickname(p);
    if(p.farm&&p.farm.g){p.season.farm={g:p.farm.g,h:p.farm.h,ab:p.farm.ab,hr:p.farm.hr,
      rbi:p.farm.rbi,ip:p.farm.ip,w:p.farm.w,er:p.farm.er,k:p.farm.k};}
    p.career.seasons.push(JSON.parse(JSON.stringify(p.season)));
    return scene({when:nowLabel(),dot:got.includes('정규시즌 MVP')?'awardMvp':got.includes('신인왕')?'awardRookie':
        got.includes('골든글러브')?'awardGlove':got.length?'awardTitle':'seasonEnd',
      title:`${p.year} 시즌 결산`,html:seasonSummaryHtml(p,got,agl),cta:'계속'});
  }
  case 'traits':{
    if(!p.season)return 'skip';
    if(!p.season.traitChecked){p.season.traitChecked=true;G.tq=G.tq.concat(traitCheck(p));}
    if(!G.tq.length)return 'skip';
    const ev=G.tq.shift();
    if(ev.type==='evolve')
      return scene({when:'특성 진화',html:traitRevealHtml(TR(ev.to),ev.from),cta:'계속',after:1});
    const t=TR(ev.id);
    if(p.traits.length<6){
      addTrait(p,ev.id);
      return scene({when:'새로운 특성',html:traitRevealHtml(t),cta:'계속',after:1});
    }
    return scene({when:'새로운 특성',title:'특성 슬롯이 가득 찼다',
      body:`<em>[${t.id}]</em>  (${t.grade})\n${t.desc}\n\n어떤 특성을 대신 내보낼까?`,
      choices:[...p.traits.map(id=>({t:`[${id}] 을(를) 내보낸다`,s:TR(id).desc,
          run:()=>{addTrait(p,ev.id,id);return [`[${id}] 이(가) 커리어 기록으로 남았다.`];}})),
        {t:'새 특성을 받지 않는다',s:'현재 특성을 모두 유지',run:()=>['그는 하던 대로 하기로 했다.']}],
      after:1});
  }
  case 'nat':{
    const r=natCall(p);
    if(!r)return 'skip';
    return scene({when:'국가대표',dot:'awardTitle',title:'태극마크',body:'',log:[r],cta:'계속'});
  }
  case 'fa':return faPhase();
  /* ── 신규: 재계약 / 연간 정산 (요구 20·21) ── */
  case 'contract':{
    if(!p.season||p.retired)return 'skip';
    const r=salaryReview(p);
    const money=settleYear(p);
    p.salaryHist=p.salaryHist||[];
    p.salaryHist.push({y:G.cal.year+1,sal:r.next,mv:r.mv,
      note:r.diff>0?`${wonText(r.diff)} 인상`:r.diff<0?`${wonText(-r.diff)} 삭감`:'동결'});
    p.contractLog=p.contractLog||[];
    p.contractLog.push({y:G.cal.year+1,team:p.team,sal:r.next,years:p.money.years});
    const arrow=r.diff>0?'▲':r.diff<0?'▼':'—';
    const cls=r.diff>0?'plus':r.diff<0?'minus':'';
    return scene({when:nowLabel('재계약'),dot:'money',title:'연봉 협상',
      html:`<div class="diffbox"><h4>${G.cal.year+1} 계약</h4>
        <div class="dline ${cls}"><span class="nm">연봉</span>
          <span class="from">${wonText(r.prev)}</span><span class="dim">→</span>
          <span class="to">${wonText(r.next)}</span>
          <span class="delta">${arrow} ${wonText(Math.abs(r.diff))}</span></div>
        <div class="dline"><span class="nm">시장가치</span><span class="to">${wonText(r.mv)}</span></div>
        <div class="dline"><span class="nm">계약 기간</span><span class="to">${p.money.years}년</span></div>
      </div>`,
      log:money,cta:'계속'});
  }
  case 'retire':return retirePhase();
  case 'yearEnd':{
    p.age++;
    p.fatigue=clamp(p.fatigue-14,0,100);
    p.stress=clamp((p.stress||20)-6,0,100);
    p.status='정상';p.rehabLeft=0;
    p.gearYear=0;p.money.trainer=0;                  // 트레이너·장비는 매년 다시 계약한다
    p.slump=slumpObj();
    updateCond(p);
    return 'skip';                                   // 큐가 비면 advance()가 1월로 넘긴다
  }}
  return 'skip';
}

/* 그 경기의 내용에 맞는 도트를 고른다 — 시뮬 전후를 비교한다 */
function gameSnap(p){
  const l=(p.lv==='2군'?p.farm:p.season)||{};
  return {hr:l.hr||0,ip:l.ip||0,er:l.er||0};
}
function gameDot(p,pre){
  const l=(p.lv==='2군'?p.farm:p.season)||{};
  if(p.pos==='pitcher'){
    const ip=(l.ip||0)-pre.ip, er=(l.er||0)-pre.er;
    if(ip>=8&&er===0)return 'gameShutout';
  }else if((l.hr||0)>pre.hr)return 'gameHomer';
  return 'gameStart';
}

/* ==========================================================================
   [44] FLOW — 새 게임
   ========================================================================== */
function startGame(name,pos){
  const seed=Math.floor(Math.random()*900000)+100000;
  genWorld(seed,2026);
  G.p=createPlayer(name,pos);
  setupRival(G.p);
  G.p.worldSeed=seed;
  assignRoles();
  G.cal={year:2026,month:0,queue:[],last:null};
  G.screen='game';G.tq=[];G.tab='main';
  advance();
}
function setupRival(p){
  const pos=R.c(.5)?p.pos:R.pick(['batter','pitcher','catcher']);
  const t=R.pick(TEAMS.filter(x=>x.id!==p.team));
  seedWorld(L.seed+7);
  const a=genAi(t.id,pos,p.age,2026,'top',new Set(L.players.map(x=>x.name)));
  SRND=Math.random;
  a.pot=clamp(a.pot+12,82,99);a.lv='2군';a.flagRival=true;a.debut=0;a.rookieYear=2026;
  L.players.push(a);
  p.rival={id:a.id,name:a.name,pos,bond:50,war:0,totWar:0,team:t.id,ovr:a.ovr,peak:0,aw:a.aw};
}

/* 주간이면 행동 횟수가 4배가 된다 (시즌중 월 1회 → 4회).
   회당 효과를 줄여 연간 총량을 월간 시절과 비슷하게 맞춘다. */
const ACT_WEEK_SCALE=.32;
const AS=v=>Math.round(v*(weekly()?ACT_WEEK_SCALE:1)*100)/100;
/* 관계·취미처럼 내부 수치가 하드코딩된 행동은 실행 전후 델타를 통째로 줄인다.
   플래그·타임라인은 이진값이므로 건드리지 않는다. */
function scaledRun(fn,p){
  if(!weekly())return fn(p);
  const k=ACT_WEEK_SCALE;
  const b={tend:Object.assign({},p.tend),rel:Object.assign({},p.rel),
           st:Object.assign({},p.st),fan:p.fanRating,media:p.media||50,
           stress:p.stress||0,fat:p.fatigue,tb:p.teamBoost||0,cb:p.clutchBonus||0};
  const log=fn(p);
  for(const x in p.tend) p.tend[x]=clamp(b.tend[x]+(p.tend[x]-b.tend[x])*k,0,100);
  for(const x in p.rel)  p.rel[x] =clamp((b.rel[x]==null?50:b.rel[x])+(p.rel[x]-(b.rel[x]==null?50:b.rel[x]))*k,0,100);
  for(const x in p.st)   p.st[x]  =round(b.st[x]+(p.st[x]-b.st[x])*k,1);
  p.fanRating=clamp(b.fan+(p.fanRating-b.fan)*k,0,100);
  p.media    =clamp(b.media+((p.media||50)-b.media)*k,0,100);
  p.stress   =clamp(b.stress+((p.stress||0)-b.stress)*k,0,100);
  p.fatigue  =clamp(b.fat+(p.fatigue-b.fat)*k,0,100);
  p.teamBoost=b.tb+((p.teamBoost||0)-b.tb)*k;
  p.clutchBonus=b.cb+((p.clutchBonus||0)-b.cb)*k;
  return log;
}
/* 화면 표기 — 주간의 소수값(0.64 등)을 그대로 보여주면 지저분하다.
   1 미만은 '소폭'으로, 그 이상은 반올림해 보여준다. */
function ASD(v){
  const x=AS(v), a=Math.abs(x);
  if(a<1)return '소폭';
  return (x>0?'+':'−')+Math.round(a);
}

/* ==========================================================================
   [45] ACTION — 월간/주간 행동
   원칙: 공짜 행동은 없다. 모든 선택이 무언가를 얻고 무언가를 잃는다.
   확률이 필요한 행동은 v2.1의 outcomes 엔진을 그대로 쓴다.
   ========================================================================== */
const HOBBIES=[
  {id:'read', icon:'📚', name:'독서',       cost:30,  eff:{stress:-6},  run:p=>{tend(p,{leadership:2,patience:1});grow(p,{mental:.5});return['조용한 저녁이었다.'];}},
  {id:'game', icon:'🎮', name:'게임',       cost:80,  eff:{stress:-10}, run:p=>{tend(p,{diligence:-1});return['머리를 비웠다.'];}},
  {id:'out',  icon:'🍻', name:'동료와 외출', cost:250, eff:{stress:-8},  run:p=>{rel(p,'team',5);rel(p,'vet',2);tend(p,{social:3});return['늦게까지 이야기했다. 계산은 선배가 하지 않았다.'];}},
  {id:'golf', icon:'🏌', name:'골프',       cost:400, eff:{stress:-5},  run:p=>{p.fanRating=clamp(p.fanRating+1,0,100);rel(p,'front',3);tend(p,{star:2});return['사진이 몇 장 돌았다.'];}},
  {id:'fish', icon:'🎣', name:'낚시',       cost:60,  eff:{stress:-9},  run:p=>{tend(p,{patience:3});return['아무것도 잡지 못했지만 괜찮았다.'];}},
  {id:'fam',  icon:'🏠', name:'가족과 시간', cost:200, eff:{stress:-12}, run:p=>{tend(p,{patience:2,selfish:-3});flagAt(p,'family');return['오랜만에 집밥을 먹었다.'];}},
  {id:'fan',  icon:'❤️', name:'팬 행사',    cost:0,   eff:{stress:+3},  run:p=>{p.fanRating=clamp(p.fanRating+4,0,100);p.media=clamp((p.media||50)+3,0,100);tend(p,{star:3});return['이름을 불러주는 사람들이 있었다.'];}}
];

/* 관계 8종 (요구 23) — 각 관계가 실제로 다른 것을 준다 */
const RELATIONS=[
  {id:'manager',name:'감독',   line:'면담을 요청한다',      gain:'출전 기회 ↑',
   run:p=>{rel(p,'manager',6);tend(p,{social:1});
     return['짧게, 그러나 분명하게 이야기했다.','감독의 신뢰는 라인업으로 돌아온다.'];}},
  {id:'coach',  name:'코치',   line:'기술 상담을 받는다',   gain:'주 능력 ↑ · 슬럼프 탈출 ↑',
   run:p=>{rel(p,'coach',6);grow(p,{[W(p).key]:.35,mental:.25});
     return[`${W(p).coach}와 영상을 돌려봤다.`];}},
  {id:'vet',    name:'선배',   line:'선배를 찾아간다',      gain:'인내 ↑ · 훗날의 이야기',
   run:p=>{rel(p,'vet',7);tend(p,{patience:2});flagAt(p,'helpedVeteran');
     return['그는 오래 듣기만 했다.'];}},
  {id:'rookie', name:'후배',   line:'후배를 챙긴다',        gain:'리더십 ↑ · 지도자의 길',
   run:p=>{rel(p,'rookie',7);tend(p,{leadership:3,selfish:-2});flagAt(p,'mentoredRookie');
     return['후배가 처음으로 먼저 인사했다.'];}},
  {id:'team',   name:'동료',   line:'라커룸에서 시간을 보낸다', gain:'팀 관계 ↑ · 팀 기여 ↑',
   run:p=>{rel(p,'team',7);tend(p,{social:3,selfish:-1});p.teamBoost=(p.teamBoost||0)+.4;
     return['별 이야기는 안 했는데 분위기가 편해졌다.'];}},
  {id:'front',  name:'프런트', line:'구단 사무실에 들른다', gain:'시장가치 평가 ↑',
   run:p=>{rel(p,'front',6);
     return['계약 이야기는 나오지 않았다. 얼굴은 익혔다.'];}},
  {id:'captain',name:'주장',   line:'주장과 이야기한다',    gain:'리더십 ↑ · 주장 후보',
   run:p=>{rel(p,'captain',7);tend(p,{leadership:2,loyalty:2});
     if((p.rel.captain||50)>=78&&p.lv!=='2군'&&p.seasonsPlayed>=3)flag(p,'captainCandidate');
     return['"너도 언젠가 이 자리에 앉을 거야."'];}},
  {id:'fan',    name:'팬',     line:'팬들과 만난다',        gain:'팬 인기 ↑ · 언론 관심 ↑',
   run:p=>{rel(p,'fan',6);p.fanRating=clamp(p.fanRating+3,0,100);
     p.media=clamp((p.media||50)+2,0,100);tend(p,{star:2});
     return['사인을 스무 장쯤 했다.'];}}
];

/* 행동 정의 — cost/gain 은 버튼에 그대로 노출된다 (요구 5·7) */
const ACTIONS={
  teamTrain:{icon:'🏟',name:'팀 훈련',gain:()=>`팀워크 ${ASD(3)} · 감독 ${ASD(2)} · 능력 소폭`,cost:()=>`피로 ${ASD(10)}`,
    run:p=>{
      const ks=R.shuffle(POS[p.pos].keys.slice());
      const up={};up[ks[0]]=AS(.55);up[ks[1]]=AS(.35);grow(p,up);
      rel(p,'team',AS(3));rel(p,'manager',AS(2));tend(p,{social:AS(1),diligence:AS(1)});
      p.fatigue=clamp(p.fatigue+AS(10),0,100);p.trainCount+=(weekly()?ACT_WEEK_SCALE:1);
      return['팀 훈련을 소화했다.'];}},

  soloTrain:{icon:'💪',name:'개인 훈련',
    gain:p=>{ const ts=TRAININGS[p.pos].filter(t=>!t.rest);
      const best=ts.map(t=>trainPreview(p,t,1,1)).map(pv=>pv.rows.reduce((a,r)=>Math.max(a,r.v),0));
      const lo=Math.min(...best), hi=Math.max(...best);
      return `주 능력 +${Math.max(1,Math.round(lo))}~${Math.max(1,Math.round(hi))} (종목 선택)`; },
    cost:p=>{ const ts=TRAININGS[p.pos].filter(t=>!t.rest);
      const f=ts.map(t=>trainPreview(p,t,1,1).fat);
      return `피로 +${Math.round(Math.min(...f))}~${Math.round(Math.max(...f))} · 부상 위험`; },
    menu:1},

  focus:{icon:'⚾',name:'경기에 집중',gain:()=>`${weekly()?'이번 주':'이번 달'} 경기력 ↑ · 승부욕 ↑`,cost:()=>`피로 ${ASD(5)}`,
    run:p=>{p.clutchBonus=clamp((p.clutchBonus||0)+AS(2),-30,14);p.fatigue=clamp(p.fatigue+AS(5),0,100);tend(p,{competitive:AS(3)});
      return['다른 건 생각하지 않기로 했다.'];}},

  rest:{icon:'🛌',name:'휴식',gain:()=>`피로 ${ASD(-14)} · 컨디션 ↑ · 스트레스 ${ASD(-6)}`,cost:'성장 없음 · 감독 신뢰 ↓',
    run:p=>{p.fatigue=clamp(p.fatigue+AS(-14),0,100);p.stress=clamp((p.stress||20)-AS(6),0,100);
      rel(p,'manager',-AS(2));tend(p,{diligence:-AS(1)});updateCond(p);
      return['하루 종일 아무것도 하지 않았다.'];}},

  hobby:{icon:'🎣',name:'개인 활동',gain:'스트레스 ↓',cost:'성장 없음',menu:2},

  relation:{icon:'🤝',name:'인간관계',gain:'관계 ↑ · 먼 훗날의 이야기',cost:()=>`피로 ${ASD(3)} · 성장 없음`,menu:3},

  rehab:{icon:'🏥',name:'재활에 전념',gain:'복귀 앞당김',cost:'능력 정체',
    run:p=>{
      const cut=R.i(1,2);
      p.rehabLeft=Math.max(0,(p.rehabLeft||1)-cut);
      p.missGames=Math.max(0,(p.missGames||0)-10);
      rel(p,'coach',2);tend(p,{patience:3});
      if(p.rehabLeft<=0){p.status='정상';return['재활을 마쳤다. 그라운드 냄새가 낯설었다.'];}
      return[`재활에 매달렸다. 복귀까지 ${p.rehabLeft}개월.`];}},

  push:{icon:'🔥',name:'감독에게 출전을 요청',gain:'출전 기회 · 투혼',cost:'부상 위험 · 관계 악화 가능',
    reveal:'FULL',
    outcomes:[
      {p:.60,label:'감독이 받아들인다',bias:{competitive:1,social:.5},
        res:{text:'"그래, 나가라." 그는 라인업에 이름을 올렸다.',
             rel:{manager:3},clutch:4,tend:{competitive:4}}},
      {p:.30,label:'불쾌하게 생각한다',bias:{social:-.6},
        res:{text:'"몸이 먼저다." 감독의 표정이 굳었다.',rel:{manager:-4}}},
      {p:.10,label:'무리가 탈이 난다',
        res:{text:'무릎이 말을 듣지 않았다.',injRisk:.9,fatigue:12}}]},

  /* ── 슬럼프 탈출 3종 (요구 22) — 확률과 대가가 서로 다르다 ── */
  slumpHard:{icon:'🔥',name:'더 강하게 훈련한다',gain:'탈출 60% · 성공 시 능력 +1',cost:'피로 +12 · 실패 시 악화',
    run:p=>slumpEscape(p,'hard')},
  slumpRest:{icon:'🛌',name:'며칠 야구를 잊는다',gain:'탈출 45% · 피로 −16 · 스트레스 −8',cost:'성장 없음',
    run:p=>slumpEscape(p,'rest')},
  slumpCoach:{icon:'🗣',name:`코치와 상담한다`,gain:'탈출 70% · 코치 관계 +6',cost:'성장 없음',
    run:p=>slumpEscape(p,'coach')},

  /* ── 돈을 쓰는 행동 (요구 20) ── */
  trainer:{icon:'💳',name:'개인 트레이너를 고용',gain:'연중 부상 위험 ↓ · 회복 ↑',cost:'연 1,800만원',
    run:p=>{
      if(p.money.trainer)return['이미 전담 트레이너가 붙어 있다.'];
      if(!spend(p,1800,'트레이너'))return['잔고가 부족하다.'];
      p.money.trainer=1;p.injRisk=(p.injRisk||0)-.15;
      return['전담 트레이너가 붙었다. 몸 관리가 달라진다.'];}},

  gear:{icon:'🧤',name:'장비를 맞춘다',gain:'주 능력 +0.8 · 컨디션 ↑',cost:'1,200만원',
    run:p=>{
      if(!spend(p,1200,'장비'))return['잔고가 부족하다.'];
      p.gearYear=1;grow(p,{[W(p).key]:.8});p.cond=clamp(p.cond+1,0,4);
      return[`손에 맞는 ${W(p).gear}는 생각보다 큰 차이를 만든다.`];}}
};

/* 상태에 따라 가능한 행동이 달라진다 (요구 3) */
function monthActions(p){
  const m=MON(),list=[];
  const sl=slumpOf(p);
  if(p.status==='부상')return ['rehab','rest','hobby','relation'];
  if(p.status==='재활')list.push('rehab');
  if(sl.active){                                  // 슬럼프면 탈출 선택지가 앞에 온다
    list.push('slumpCoach','slumpHard','slumpRest');
  }
  list.push('teamTrain','soloTrain');
  if(m.season&&p.lv!=='2군')list.push('focus');
  if(m.season&&p.lv==='2군')list.push('push');
  list.push('rest','hobby','relation');
  if(!m.season&&!p.money.trainer&&p.money.balance>=1800)list.push('trainer');
  if(!m.season&&p.money.balance>=1200&&!p.gearYear)list.push('gear');
  return list;
}

function actionMenu(){
  const p=G.p,m=MON();
  const ids=monthActions(p);
  return scene({when:nowLabel(),title:weekly()?'이번 주 무엇을 할까':'이번 달 무엇을 할까',
    body:bodyHint(p),month:1,
    choices:ids.map(id=>{
      const a=ACTIONS[id];
      return {t:`${a.icon} ${a.name}`,gain:txt(a.gain,p),cost:txt(a.cost,p),
        reveal:a.reveal,outcomes:a.outcomes,
        next:a.menu===1?(()=>trainMenu()):a.menu===2?(()=>hobbyMenu()):a.menu===3?(()=>relationMenu()):null,
        run:a.run?(()=>{const log=a.run(p);updateCond(p);return log;}):null};
    })});
}

function hobbyMenu(){
  const p=G.p;
  return scene({when:nowLabel(),title:'무엇을 하며 보낼까',month:1,
    body:`스트레스 ${Math.round(p.stress||20)} · 자산 ${wonText(p.money.balance)}`,
    choices:HOBBIES.filter(h=>p.money.balance>=h.cost).map(h=>({t:`${h.icon} ${h.name}`,
      gain:h.eff.stress<0?`스트레스 ${ASD(h.eff.stress)}`:null,
      cost:[h.eff.stress>0?`스트레스 ${ASD(h.eff.stress)}`:null,h.cost?wonText(h.cost):null]
             .filter(Boolean).join(' · ')||null,
      run:()=>{if(h.cost)spend(p,h.cost,h.name);
        const log=scaledRun(q=>{q.stress=clamp((q.stress||20)+h.eff.stress,0,100);return h.run(q);},p);
        updateCond(p);return log;}}))
      .concat([{t:'돌아간다',gain:null,cost:'다른 행동을 고른다',next:()=>actionMenu()}])});
}

function relationMenu(){
  const p=G.p;
  return scene({when:nowLabel(),title:'누구를 만날까',month:1,
    body:'지금 쌓아두는 관계가 몇 해 뒤에 돌아올 수도 있다.',
    choices:RELATIONS.map(r=>({t:`${r.name} — ${relTier(p.rel[r.id]||50)}`,
      gain:r.gain,cost:r.line,
      run:()=>{const log=scaledRun(q=>{q.fatigue=clamp(q.fatigue+3,0,100);return r.run(q);},p);
        updateCond(p);return log;}}))
      .concat([{t:'돌아간다',gain:null,cost:'다른 행동을 고른다',next:()=>actionMenu()}])});
}

/* ==========================================================================
   [46] ROSTER — 1군/2군 (Phase 1은 연출 골격만, Phase 2에서 실제 경쟁 판정 연결)
   ========================================================================== */
/* 시즌 중 판정은 최소 2개월 간격 — 매달 오르내리는 요요를 막는다 */
const LV_COOLDOWN=2;

function rosterScene(opening){
  const p=G.p;
  /* 개막(rosterSet)에서는 newSeason 이 이미 p.lv 을 갱신한 뒤다.
     p.lvBefore(작년 보직)와 비교해야 개막 승격이 콜업으로 잡힌다. */
  const before=(opening&&p.lvBefore!==undefined)?p.lvBefore:p.lv;
  if(p.status==='부상')return 'skip';                       // 부상 중엔 보직을 건드리지 않는다
  if(!opening){
    const since=(G.cal.year*12+G.cal.month)-(p.lvChangedAt||0);
    if(since<LV_COOLDOWN)return 'skip';
  }
  const now=opening?p.lv:decideLevel(p);                    // 팀 내 정원 경쟁 판정
  if(now===before&&!opening)return 'skip';
  const changed=now!==before;
  p.lv=now;
  if(p.season)p.season.lv=now;
  if(changed)p.lvChangedAt=G.cal.year*12+G.cal.month;

  const depth=rivalAhead(p);
  const farmLine=farmSummary(p);

  /* 첫 1군 콜업 — 일반 이벤트와 다르게 처리한다 (요구 12) */
  if(before==='2군'&&now!=='2군'&&!p.flags.includes('firstCallUp')){
    flagAt(p,'firstCallUp');
    p.timeline.push({y:G.cal.year,m:G.cal.month,t:'프로 1군 데뷔'});
    p.stress=clamp((p.stress||20)+8,0,100);
    return scene({when:nowLabel(),lvWas:before,dot:'callUp',title:'전화가 왔다',
      body:`"내일 1군에 합류해."\n\n잠시 말이 나오지 않았다.\n\n${p.age}살의 ${MON().mood}.\n당신은 처음으로 프로야구 1군 선수 명단에 이름을 올렸다.`,
      log:[`${G.cal.year}.${String(G.cal.month).padStart(2,'0')} · 1군 등록 (${now})`]
        .concat(farmLine?[farmLine]:[]),
      cta:'1군으로 간다'});
  }
  if(before==='2군'&&now!=='2군'){
    rel(p,'manager',3);
    return scene({when:nowLabel(),lvWas:before,dot:'callUp',title:'콜업',
      body:`다시 1군의 부름을 받았다.\n\n이번엔 자리를 지킬 수 있을까.`,
      log:[`보직 · ${now}`].concat(farmLine?[farmLine]:[]),cta:'계속'});
  }
  if(before!=='2군'&&now==='2군'){
    rel(p,'manager',-4);
    p.stress=clamp((p.stress||20)+12,0,100);
    tend(p,{patience:2});
    flagAt(p,'demoted');
    return scene({when:nowLabel(),lvWas:before,dot:'demote',title:'강등',
      body:`감독실에서 짧은 이야기를 들었다.\n\n"내려가서 다시 만들어 와."`,
      log:['2군으로 내려간다.'].concat(depth?[depth]:[]),cta:'계속'});
  }
  if(changed)                                               // 주전↔백업, 선발↔불펜
    return scene({when:nowLabel(),lvWas:before,title:'보직 변경',
      body:`라인업이 바뀌었다.`,log:[`${before} → ${now}`].concat(depth?[depth]:[]),cta:'계속'});
  if(opening)
    return scene({when:nowLabel('개막 엔트리'),title:'개막 엔트리가 발표됐다',
      body:`${TEAM(p.team).name}의 ${G.cal.year} 개막 엔트리가 나왔다.`,
      log:[`보직 · ${now}`].concat(depth?[depth]:[]),cta:'시즌으로'});
  return 'skip';
}

/* 내 앞을 막고 있는 선수 — 강등이 왜 났는지 보여준다 */
function rivalAhead(p){
  if(!L)return null;
  const same=L.players.filter(a=>isAi(a)&&a.team===p.team&&a.pos===p.pos&&!a.retired&&a.lv==='1군')
                      .sort((a,b)=>b.ovr-a.ovr);
  if(!same.length)return null;
  const me=ovr(p);
  const ahead=same.filter(a=>a.ovr>me);
  if(!ahead.length)return `팀 내 ${POS[p.pos].label} 1순위는 나다. (종합 ${me})`;
  return `내 앞에 ${ahead.length}명 — 선두 ${ahead[0].name} 종합 ${ahead[0].ovr} (나 ${me})`;
}
/* 2군 성적 한 줄 */
function farmSummary(p){
  const f=p.farm;
  if(!f||!f.g)return null;
  if(p.pos==='pitcher'){
    if(!f.ip)return null;
    return `2군 성적 — ${f.g}경기 ${f.ip}이닝 ${f.w}승 방어율 ${round(f.er*9/f.ip,2)}`;
  }
  if(!f.ab)return null;
  return `2군 성적 — ${f.g}경기 타율 ${avg3(f.h/f.ab)} ${f.hr}홈런 ${f.rbi}타점`;
}

/* ==========================================================================
   [47] 관계 단계 표기 (요구 23) — 숫자가 아니라 말로 보여준다
   ========================================================================== */
const REL_TIER=[[90,'각별함'],[75,'존중'],[58,'신뢰'],[40,'중립'],[25,'경계'],[0,'불편함']];
function relTier(v){v=clamp(v||50,0,100);for(const [t,l] of REL_TIER)if(v>=t)return l;return '불편함';}

/* 장기 플래그 (요구 24) — flag() 와 동일. 기존 호출부 호환용 별칭 */
function flagAt(p,f,meta){return flag(p,f,meta);}
function flagYear(p,f){const e=(p.relLog||[]).find(x=>x.f===f);return e?e.y:null;}
/* 플래그를 세운 지 몇 해가 지났는가 — 회수 이벤트의 조건이 된다 */
function yearsSince(p,f){const y=flagYear(p,f);return y===null?-1:(G.cal.year-y);}
