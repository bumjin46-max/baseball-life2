/* 6-calendar.js — 시간 · 월간 루프 · 월간 행동  (v3.0 Phase 1)
   v2.1의 고정 PHASES 배열(1바퀴=1시즌)을 캘린더 큐로 교체한다.
   runPhase()의 기존 case는 이름 그대로 살아 있고, 월이 그것들을 재배치할 뿐이다.
   ※ 7-ui.js보다 먼저 로드되어야 한다 (G / advance 를 UI가 참조). */
"use strict";

/* ==========================================================================
   [40] STATE — 전역 상태 (구 [13])
   ========================================================================== */
const G={screen:'title',p:null,ui:null,hof:[],tab:'main',hasSave:false,tq:[],
         cal:{year:2026,month:0,queue:[],last:null}};
const app=()=>document.getElementById('app');

function scene(o){G.ui=o;render();save();}
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
   [42] FLOW — 캘린더 큐
   월이 페이즈 토큰 배열을 만들고, advance()가 하나씩 꺼내 쓴다.
   주간 시스템으로 확장할 때는 'action'을 4개로 늘리기만 하면 된다.
   ========================================================================== */
function buildMonth(m){
  switch(m){
  case 1:  return ['monthStart','action'];
  case 2:  return ['monthStart','action','event'];
  case 3:  return ['monthStart','seasonStart','action','rosterSet'];
  case 4:  return ['monthStart','action','games','moment'];
  case 5:  return ['monthStart','action','games','event','levelCheck'];
  case 6:  return ['monthStart','action','games','moment'];
  case 7:  return ['monthStart','action','games','teamEvent','levelCheck'];
  case 8:  return ['monthStart','action','games','moment'];
  case 9:  return ['monthStart','action','games','rank'];
  case 10: return ['monthStart','ksMoment','post','action'];
  case 11: return ['monthStart','award','traits','combo'];
  case 12: return ['monthStart','action','nat','trade','fa','retire','leagueOff','yearEnd'];
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
  return `${G.cal.year}년 ${m.label}${extra?' · '+extra:(m.note?' · '+m.note:'')}`;
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
  case 'monthStart':{
    const m=MON();
    p.year=G.cal.year;
    p.month=m.m;
    p.monthLog=[];
    if(!m.season){                                   // 비시즌엔 몸이 조금 회복된다
      p.fatigue=clamp(p.fatigue-3,0,100);
      p.stress=clamp((p.stress||20)-2,0,100);
    }else{
      p.stress=clamp((p.stress||20)+3+(p.lv==='2군'?2:0),0,100);
    }
    if(p.rehabLeft>0){                               // 재활 카운트다운
      p.rehabLeft--;
      if(p.rehabLeft<=0){p.status='정상';p.monthLog.push('복귀 판정을 받았다.');}
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
      return scene({when:nowLabel(),title:'재활실',
        body:`${m.label}. 그는 그라운드 대신 재활실에 있었다.`,
        log:['이번 달 경기에 나서지 못했다.'],cta:'계속'});
    }
    const before=snapStats(p);
    const log=simHalf(p,m.label,p.clutchBonus*.2,m.frac,{m:[m.m]});
    p.monthLog=(p.monthLog||[]).concat(log);
    return scene({when:nowLabel(),title:'경기',body:'',log,
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
    return scene({when:nowLabel('시즌 준비'),html:seasonCardHtml(p),log:cl,cta:'시즌 시작'});
  }
  case 'event':return storyEvent();
  case 'moment':case 'moment1':case 'moment2':case 'moment3':return momentEvent();
  case 'teamEvent':return teamEvent();
  case 'combo':{
    const c=comboCheck(p);
    if(!c)return 'skip';
    c.run(p);
    return scene({when:'특성 조합',title:c.title,body:c.text,cta:'계속'});
  }
  case 'trade':return tradePhase();
  case 'leagueOff':{
    const notes=aiOffseason();
    if(!notes.length)return 'skip';
    const cards=notes.slice(0,6).map(t=>({tag:'리그',text:t,y:p.year}));
    if(L)L.news=(L.news||[]).concat(cards).slice(-60);
    return scene({when:nowLabel('리그'),title:'리그는 계속 움직인다',
      html:newsHtml(cards),cta:'계속'});
  }
  case 'rank':{
    const log=rankCheck(p);
    const news=genNews(p);
    return scene({when:nowLabel('정규시즌 종료'),title:'순위가 결정됐다',
      html:newsHtml(news),log,cta:p.inPost?'가을 야구로':'시즌 결산'});
  }
  case 'ksMoment':{
    if(!p.inPost)return 'skip';
    return showMoment(MOMENTS.find(x=>x.id==='M_KS'));
  }
  case 'post':{
    if(!p.inPost)return 'skip';
    const log=postseason(p);
    return scene({when:nowLabel(),title:'가을',body:'',log,cta:'시즌 결산'});
  }
  case 'award':{
    if(!p.season)return 'skip';
    finalizeSeason(p);
    const got=awardsPhase(p);
    const agl=agingPhase(p);
    p.nick=nickname(p);
    p.career.seasons.push(JSON.parse(JSON.stringify(p.season)));
    return scene({when:nowLabel(),title:`${p.year} 시즌 결산`,
      html:seasonSummaryHtml(p,got,agl),cta:'계속'});
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
    return scene({when:'국가대표',title:'태극마크',body:'',log:[r],cta:'계속'});
  }
  case 'fa':return faPhase();
  case 'retire':return retirePhase();
  case 'yearEnd':{
    p.age++;
    p.fatigue=clamp(p.fatigue-14,0,100);
    p.stress=clamp((p.stress||20)-6,0,100);
    p.status='정상';p.rehabLeft=0;
    updateCond(p);
    return 'skip';                                   // 큐가 비면 advance()가 1월로 넘긴다
  }}
  return 'skip';
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

/* ==========================================================================
   [45] ACTION — 월간 행동
   원칙: 공짜 행동은 없다. 모든 선택이 무언가를 얻고 무언가를 잃는다.
   확률이 필요한 행동은 v2.1의 outcomes 엔진을 그대로 쓴다.
   ========================================================================== */
const HOBBIES=[
  {id:'read', icon:'📚', name:'독서',       eff:{stress:-6},  run:p=>{tend(p,{leadership:2,patience:1});grow(p,{mental:.5});return['조용한 저녁이었다.'];}},
  {id:'game', icon:'🎮', name:'게임',       eff:{stress:-10}, run:p=>{tend(p,{diligence:-1});return['머리를 비웠다.'];}},
  {id:'out',  icon:'🍻', name:'동료와 외출', eff:{stress:-8},  run:p=>{rel(p,'team',5);rel(p,'vet',2);tend(p,{social:3});return['늦게까지 이야기했다.'];}},
  {id:'golf', icon:'🏌', name:'골프',       eff:{stress:-5},  run:p=>{p.fanRating=clamp(p.fanRating+1,0,100);tend(p,{star:2});return['사진이 몇 장 돌았다.'];}},
  {id:'fish', icon:'🎣', name:'낚시',       eff:{stress:-9},  run:p=>{tend(p,{patience:3});return['아무것도 잡지 못했지만 괜찮았다.'];}},
  {id:'fan',  icon:'❤️', name:'팬 행사',    eff:{stress:+3},  run:p=>{p.fanRating=clamp(p.fanRating+4,0,100);p.media=clamp((p.media||50)+3,0,100);tend(p,{star:3});return['이름을 불러주는 사람들이 있었다.'];}}
];

const RELATIONS=[
  {id:'manager',name:'감독',   line:'면담을 요청했다.',     run:p=>{rel(p,'manager',6);tend(p,{social:1});return['짧게, 그러나 분명하게 이야기했다.'];}},
  {id:'coach',  name:'코치',   line:'기술 상담을 받았다.',  run:p=>{rel(p,'coach',6);grow(p,{mental:.6});return['자기 폼을 처음으로 영상으로 봤다.'];}},
  {id:'vet',    name:'선배',   line:'선배를 찾아갔다.',     run:p=>{rel(p,'vet',7);tend(p,{patience:2});flagAt(p,'helpedVeteran');return['그는 오래 듣기만 했다.'];}},
  {id:'rookie', name:'후배',   line:'후배를 챙겼다.',       run:p=>{rel(p,'rookie',7);tend(p,{leadership:3,selfish:-2});flagAt(p,'mentoredRookie');return['후배가 처음으로 먼저 인사했다.'];}},
  {id:'front',  name:'프런트', line:'구단 사무실에 들렀다.',run:p=>{rel(p,'front',6);return['계약 이야기는 나오지 않았다.'];}}
];

/* 행동 정의 — cost/gain 은 버튼에 그대로 노출된다 (요구 5·7) */
const ACTIONS={
  teamTrain:{icon:'🏟',name:'팀 훈련',gain:'팀워크 +3 · 감독 +2 · 능력 소폭',cost:'피로 +10',
    run:p=>{
      const ks=R.shuffle(POS[p.pos].keys.slice());
      const up={};up[ks[0]]=.55;up[ks[1]]=.35;grow(p,up);
      rel(p,'team',3);rel(p,'manager',2);tend(p,{social:1,diligence:1});
      p.fatigue=clamp(p.fatigue+10,0,100);p.trainCount++;
      return['팀 훈련을 소화했다.'];}},

  soloTrain:{icon:'💪',name:'개인 훈련',gain:'능력 +2~4',cost:'피로 +12 · 부상 위험 · 감독 관계 변화 없음',
    menu:1},

  focus:{icon:'⚾',name:'경기에 집중',gain:'이번 달 경기력 ↑ · 승부욕 ↑',cost:'피로 +5',
    run:p=>{p.clutchBonus=clamp((p.clutchBonus||0)+2,-30,14);p.fatigue=clamp(p.fatigue+5,0,100);tend(p,{competitive:3});
      return['다른 건 생각하지 않기로 했다.'];}},

  rest:{icon:'🛌',name:'휴식',gain:'피로 −14 · 컨디션 ↑ · 스트레스 −6',cost:'성장 없음 · 감독 신뢰 −2',
    run:p=>{p.fatigue=clamp(p.fatigue-14,0,100);p.stress=clamp((p.stress||20)-6,0,100);
      rel(p,'manager',-2);tend(p,{diligence:-1});updateCond(p);
      return['하루 종일 아무것도 하지 않았다.'];}},

  hobby:{icon:'🎣',name:'개인 활동',gain:'스트레스 ↓',cost:'성장 없음',menu:2},

  relation:{icon:'🤝',name:'인간관계',gain:'관계 +6 · 먼 훗날의 이야기',cost:'피로 +3 · 성장 없음',menu:3},

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

  coachTalk:{icon:'🗣',name:'코치와 상담',gain:'슬럼프 탈출 70%',cost:'성장 없음',
    run:p=>{rel(p,'coach',5);
      if(R.c(.7)){p.slump=0;return['<em>실마리를 찾았다.</em> 배트가 다시 돌기 시작했다.'];}
      return['이야기는 길었지만 답은 나오지 않았다.'];}}
};

/* 상태에 따라 가능한 행동이 달라진다 (요구 3) */
function monthActions(p){
  const m=MON(),list=[];
  if(p.status==='부상'){
    return ['rehab','rest','hobby','relation'];
  }
  if(p.status==='재활')list.push('rehab');
  list.push('teamTrain','soloTrain');
  if(m.season&&p.lv!=='2군')list.push('focus');
  if(m.season&&p.lv==='2군')list.push('push');
  list.push('rest','hobby','relation');
  if(p.slump)list.push('coachTalk');
  return list;
}

function actionMenu(){
  const p=G.p,m=MON();
  const ids=monthActions(p);
  return scene({when:nowLabel(),title:'이번 달 무엇을 할까',
    body:bodyHint(p),month:1,
    choices:ids.map(id=>{
      const a=ACTIONS[id];
      return {t:`${a.icon} ${a.name}`,gain:a.gain,cost:a.cost,
        reveal:a.reveal,outcomes:a.outcomes,
        next:a.menu===1?(()=>trainMenu()):a.menu===2?(()=>hobbyMenu()):a.menu===3?(()=>relationMenu()):null,
        run:a.run?(()=>{const log=a.run(p);updateCond(p);return log;}):null};
    })});
}

function hobbyMenu(){
  const p=G.p;
  return scene({when:nowLabel(),title:'무엇을 하며 보낼까',
    body:`스트레스 ${Math.round(p.stress||20)}`,
    choices:HOBBIES.map(h=>({t:`${h.icon} ${h.name}`,
      s:h.eff.stress<0?`스트레스 ${h.eff.stress}`:`스트레스 +${h.eff.stress}`,
      run:()=>{p.stress=clamp((p.stress||20)+h.eff.stress,0,100);
        const log=h.run(p);updateCond(p);return log;}}))
      .concat([{t:'돌아간다',s:'다른 행동을 고른다',next:()=>actionMenu()}])});
}

function relationMenu(){
  const p=G.p;
  return scene({when:nowLabel(),title:'누구를 만날까',
    body:'지금 쌓아두는 관계가 몇 해 뒤에 돌아올 수도 있다.',
    choices:RELATIONS.map(r=>({t:r.name,s:`${r.line}   /   ${relTier(p.rel[r.id]||50)}`,
      run:()=>{p.fatigue=clamp(p.fatigue+3,0,100);const log=r.run(p);updateCond(p);return log;}}))
      .concat([{t:'돌아간다',s:'다른 행동을 고른다',next:()=>actionMenu()}])});
}

/* ==========================================================================
   [46] ROSTER — 1군/2군 (Phase 1은 연출 골격만, Phase 2에서 실제 경쟁 판정 연결)
   ========================================================================== */
function rosterScene(opening){
  const p=G.p,before=p.lv;
  const now=decideLevel(p);
  if(now===before&&!opening)return 'skip';
  p.lv=now;
  if(p.season)p.season.lv=now;

  if(before==='2군'&&now!=='2군'&&!p.flags.includes('firstCallUp')){
    flagAt(p,'firstCallUp');
    p.timeline.push({y:G.cal.year,t:'프로 1군 데뷔'});
    return scene({when:nowLabel(),title:'전화가 왔다',
      body:`"내일 1군에 합류해."\n\n잠시 말이 나오지 않았다.\n\n${p.age}살의 ${MON().mood}.\n당신은 처음으로 프로야구 1군 선수 명단에 이름을 올렸다.`,
      cta:'1군으로 간다'});
  }
  if(before==='2군'&&now!=='2군')
    return scene({when:nowLabel(),title:'콜업',body:'다시 1군의 부름을 받았다.',
      log:[`보직 · ${now}`],cta:'계속'});
  if(before!=='2군'&&now==='2군'){
    rel(p,'manager',-3);
    return scene({when:nowLabel(),title:'강등',
      body:'감독실에서 짧은 이야기를 들었다.\n\n"내려가서 다시 만들어 와."',
      log:['2군으로 내려간다.'],cta:'계속'});
  }
  if(opening)
    return scene({when:nowLabel('개막 엔트리'),title:'개막 엔트리가 발표됐다',
      body:`${TEAM(p.team).name}의 ${G.cal.year} 개막 엔트리.`,
      log:[`보직 · ${now}`],cta:'시즌으로'});
  return 'skip';
}

/* ==========================================================================
   [47] 관계 단계 표기 (요구 23) — 숫자가 아니라 말로 보여준다
   ========================================================================== */
const REL_TIER=[[90,'각별함'],[75,'존중'],[58,'신뢰'],[40,'중립'],[25,'경계'],[0,'불편함']];
function relTier(v){v=clamp(v||50,0,100);for(const [t,l] of REL_TIER)if(v>=t)return l;return '불편함';}

/* 장기 플래그 — 언제 세워졌는지를 함께 기록한다 (요구 24) */
function flagAt(p,f,meta){
  if(p.flags.includes(f))return;
  p.flags.push(f);
  p.relLog=p.relLog||[];
  p.relLog.push(Object.assign({y:G.cal.year,m:G.cal.month,f},meta||{}));
}
function flagYear(p,f){const e=(p.relLog||[]).find(x=>x.f===f);return e?e.y:null;}
