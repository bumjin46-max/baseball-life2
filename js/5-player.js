/* 5-player.js — 내 선수 — 생성 · 시즌 · 특성 획득 · 은퇴 · 확률 선택지 · 훈련 강도 · 별명 · 뉴스
   원본 index.html 섹션: [9] [10] [11] [12] [28] [29] [30] [31]
   ※ 클래식 스크립트로 순서대로 로드됩니다. index.html의 <script> 순서를 바꾸지 마세요. */
"use strict";

/* ==========================================================================
   [9] ENGINE — 선수 생성
   ========================================================================== */
const COND_NAME=['최악','나쁨','보통','좋음','최고조'];
const COND_MOD=[-.10,-.05,0,.02,.05];

function createPlayer(name,pos){
  const base=POS[pos].base, st={};
  POS[pos].keys.forEach(k=>st[k]=clamp(Math.round(R.norm(base[k]+2,8)),28,74));
  const o0=ovrOf(pos,st);
  const pot=clamp(Math.round(o0+R.norm(30,11)),o0+10,99);
  const team=R.pick(TEAMS);
  const rnd=pot+o0>=145?1:(pot+o0>=128?2:(pot+o0>=112?3:R.i(4,6)));
  const p={
    name,pos,age:R.i(18,20),year:2026,team:team.id,teamsPlayed:[team.id],draftRound:rnd,
    st,pot,cond:2,fatigue:10,
    traits:[],traitLog:[],
    tend:{diligence:R.i(40,60),competitive:R.i(40,60),leadership:R.i(30,55),selfish:R.i(30,55),
          loyalty:R.i(45,65),star:R.i(30,55),patience:R.i(40,60),aggression:R.i(40,60),social:R.i(40,60)},
    rel:{manager:50,vet:45,team:50,coach:50,rookie:50,front:50,captain:50,fan:50},
    media:50,nick:'신예',choiceLog:[],gameLog:[],
    flags:[],vet:mkName(),vetPos:pos,
    rival:mkRival(pos),
    season:null,career:{seasons:[]},
    tot:{g:0,pa:0,h:0,hr:0,rbi:0,sb:0,bb:0,so:0,ab:0,war:0,ip:0,w:0,l:0,sv:0,k:0,er:0},
    awards:{mvp:0,allstar:0,gg:0,hrKing:0,hitKing:0,sbKing:0,winKing:0,soKing:0,eraKing:0,rookie:0,champ:0,ksMvp:0},
    post:{games:0,war:0,bigHits:0,fail:0},
    nat:{caps:0,gold:0,bigMoment:0},
    injuries:[],timeline:[],fanRating:50,fame:0,
    lv:'2군',seasonsPlayed:0,peakAge:20,bestWar:0,trainCount:0,
    gamesTotal:0,seenEvents:[],clutchBonus:0,teamBoost:0,retired:false,
    /* ── v3.0 추가 ── */
    month:1,                 // 현재 월 (캘린더가 매달 갱신)
    status:'정상',           // 정상 | 부상 | 재활
    rehabLeft:0,             // 남은 재활 개월
    stress:20,               // 0~100. 높으면 컨디션·성장이 눌린다
    monthLog:[],             // 이번 달에 일어난 일 (메인 화면 "최근")
    relLog:[],               // 장기 플래그가 언제 세워졌는지 (요구 24)
    money:Object.assign({},MONEY0),   // 돈 · 연봉 · 시장가치 (요구 20·21)
    slump:{active:false,since:null,depth:0,months:0}   // 슬럼프는 객체로 승격 (요구 22)
  };
  p.money.signBonus=[0,25000,12000,6000,3000,1500,800][Math.min(rnd,6)]||800;
  p.money.balance+=p.money.signBonus;
  p.timeline.push({y:2026,t:`${TEAM(team.id).name} ${rnd}라운드 지명`});
  return p;
}
function mkRival(myPos){
  const pos=R.c(.5)?myPos:R.pick(['batter','pitcher','catcher']);
  return {name:mkName(),pos,ovr:R.i(50,62),pot:R.i(76,95),war:0,totWar:0,bond:50,
          team:R.pick(TEAMS).id,mvp:0,peak:0};
}

/* ── 능력 종합 ── */
const W_OVR={
  batter:{contact:.25,power:.19,eye:.11,speed:.06,run:.07,defense:.12,throw:.05,mental:.08,stamina:.07},
  pitcher:{velo:.15,stuff:.25,control:.22,breaking:.14,stamina:.10,mental:.05,crisis:.06,recovery:.03},
  catcher:{contact:.17,power:.10,eye:.08,defense:.14,throw:.11,catching:.09,blocking:.08,lead:.13,mental:.06,stamina:.04}
};
function ovrOf(pos,st){let s=0;for(const k in W_OVR[pos])s+=st[k]*W_OVR[pos][k];return Math.round(s);}
function ovr(p){return ovrOf(p.pos,p.st);}

/* ── 특성 효과 합산 ── */
function tEff(p,key){
  let v=0;
  p.traits.forEach(id=>{const t=TR(id);if(t&&t.eff[key]!==undefined)v+=t.eff[key];});
  return v;
}
function ab(p,key){ // 경기용 실효 능력치
  return (p.st[key]||0)+tEff(p,key==='control'?'ctrl':key);
}

/* ── 성향/관계/플래그/성장 ── */
function tend(p,o){for(const k in o)p.tend[k]=clamp((p.tend[k]||50)+o[k],0,100);}
function rel(p,k,v){p.rel[k]=clamp((p.rel[k]||50)+v,0,100);}
/* v3.0 — 모든 플래그가 "언제 세워졌는지"를 남긴다. flagYear(p,f)로 읽는다 (요구 24) */
function flag(p,f,meta){
  if(p.flags.includes(f))return;
  p.flags.push(f);
  p.relLog=p.relLog||[];
  p.relLog.push(Object.assign({y:(G.cal?G.cal.year:p.year),m:(G.cal?G.cal.month:1),f},meta||{}));
}
function grow(p,o){
  for(const k in o){ if(p.st[k]===undefined)continue;
    p.st[k]=clamp(round(p.st[k]+o[k],1),1,100);}
}
function ageCurve(p){
  const a=p.age, late=tEff(p,'lateGrow');
  if(a<=22)return 1.35; if(a<=27)return 1.05; if(a<=30)return .72;
  if(a<=33)return .34+late*.4; return .12+late*.35;
}
function potRoom(p,k){
  const gap=p.pot-p.st[k];
  return clamp(gap/26,-0.2,1.25)*(1+tEff(p,'potential'));
}

/* ── 훈련 ──
   v3.0: v2.1은 훈련 기회가 연 2회였는데 월간 시스템에서는 연 최대 9회다.
   회당 성장을 그대로 두면 커리어 WAR 중앙값이 21 → 29로 튄다(실측).
   TRAIN_SCALE로 회당 성장을 낮춰 연간 총 성장량을 v2.1 수준에 맞춘다. */
const TRAIN_SCALE=.53;
function doTraining(p,t,mult0,fatMul){
  mult0=mult0||1;fatMul=fatMul===undefined?1:fatMul;
  const log=[];
  p.trainCount++;
  const teamDev=(p.pos==='pitcher'?TEAM(p.team).pdev:TEAM(p.team).dev)/10;
  const mult=(1+tEff(p,'train')+teamDev)*ageCurve(p)*(p.cond>=3?1.08:p.cond<=1?.85:1)*mult0*TRAIN_SCALE;
  if(t.rest){
    const r=1+tEff(p,'rest');
    p.fatigue=clamp(p.fatigue+t.fatigue*r,0,100);
    p.cond=clamp(p.cond+1,0,4);
    log.push('충분히 쉬었다. 몸이 가벼워졌다.');
  }else{
    const changes=[];
    for(const k in t.up){
      if(p.st[k]===undefined)continue;
      let g=t.up[k]*mult;
      if(g>0)g*=clamp(potRoom(p,k),p.st[k]>=p.pot?0:.06,1.25);
      g=round(g*R.f(.75,1.3),1);
      if(Math.abs(g)<0.1)continue;
      p.st[k]=clamp(round(p.st[k]+g,1),1,100);
      changes.push(`${SLABEL[k]} ${g>0?'+':''}${round(g,1)}`);
    }
    p.fatigue=clamp(p.fatigue+t.fatigue*(1+tEff(p,'staminaCost'))*fatMul,0,100);
    if(t.tend)tend(p,t.tend);
    if(t.risk)p.injRisk=(p.injRisk||0)+t.risk*.1;
    log.push(changes.length?changes.join('   '):'큰 변화는 없었다.');
    if(mult<0.5)log.push('예전만큼 몸이 따라오지 않는다.');
  }
  updateCond(p);
  return log;
}
function updateCond(p){
  let c=2;
  if(p.fatigue<20)c=4; else if(p.fatigue<38)c=3; else if(p.fatigue<60)c=2;
  else if(p.fatigue<80)c=1; else c=0;
  c+=Math.round((p.st.mental-50)/40);
  const sx=p.stress||0;                        // v3.0 — 스트레스가 컨디션을 깎는다
  if(sx>=80)c-=2; else if(sx>=60)c-=1;
  c=clamp(c,0,4);
  if(tEff(p,'condFloor'))c=Math.max(c,1);
  if(tEff(p,'condCeil'))c=Math.min(c,3);
  p.cond=clamp(c,0,4);
}

/* ==========================================================================
   [10] ENGINE — 출전 등급 / 시즌 시뮬레이션
   ========================================================================== */
/* v3.0 — 보직은 절대 기준이 아니라 팀 내 정원 경쟁으로 결정된다 (요구 11)
   플레이어의 그림자 엔트리를 L.players에 넣고 기존 assignRoles()를 그대로 돌리면,
   우리 팀에 나보다 나은 같은 포지션 선수가 정원만큼 있으면 나는 2군으로 내려간다. */
function decideLevel(p){
  if(!L)return decideLevelFallback(p);
  const e=syncPlayerEntry(p);
  if(!e)return decideLevelFallback(p);
  assignRoles();
  const me=L.players.find(a=>a.isPlayer);
  if(!me)return decideLevelFallback(p);
  return me.lv==='2군'?'2군':(me.role||decideLevelFallback(p));
}
/* 리그가 아직 없을 때만 쓰는 예전 절대 기준 */
function decideLevelFallback(p){
  const o=ovr(p);
  if(p.pos==='pitcher'){
    if(o>=62)return '선발';
    if(o>=52)return '불펜';
    return p.age<=23?'2군':'불펜';
  }
  if(o>=62)return '주전';
  if(o>=52)return '백업';
  return p.age<=23?'2군':'백업';
}
/* 2군 성적은 1군 기록과 분리해 따로 쌓는다 (통산 기록은 1군만) */
function blankFarm(){return{g:0,pa:0,ab:0,h:0,hr:0,rbi:0,r:0,bb:0,so:0,sb:0,d2:0,
  ip:0,w:0,l:0,sv:0,k:0,er:0,months:0};}
function newSeason(p){
  p.inPost=false;p.missGames=0;p.injRisk=0;p.clutchBonus=0;slumpOf(p);
  if(L)L.year=p.year;
  p.farm=blankFarm();                 // 2군 기록은 매 시즌 초기화
  p.lvBefore=p.lv;                    // rosterSet 이 "직전 보직"을 알아야 콜업을 감지한다
  p.lv=decideLevel(p);                // ← 안에서 syncPlayerEntry + assignRoles 를 돈다
  const teamStr=(L?teamRating(p.team):62)+R.f(-1.5,1.5)+(p.teamBoost||0)*.6+tEff(p,'teamB')*.5;
  if(p.lv!=='2군'&&!p.debutYear){p.debutYear=p.year;p.timeline.push({y:p.year,t:'1군 데뷔'});}
  p.season={year:p.year,age:p.age,team:p.team,lv:p.lv,
    g:0,pa:0,ab:0,h:0,hr:0,rbi:0,r:0,bb:0,so:0,sb:0,d2:0,avg:0,ops:0,
    ip:0,w:0,l:0,sv:0,era:0,k:0,er:0,bb9:0,
    war:0,bigHits:0,events:[],traits:[],teamStr};
}
function condMod(p){return COND_MOD[p.cond];}

function simHalf(p,half,bonus,frac,seg){
  frac=frac||.5;
  /* v3.0 — 2군 경기는 p.farm 에 따로 쌓는다. 통산 기록(p.tot)에는 들어가지 않는다.
     S = 시즌 메타(팀 전력 등), s = 이번 달 기록을 누적할 대상 */
  const S=p.season, log=[];
  const farm = p.lv==='2군';
  if(farm&&!p.farm)p.farm=blankFarm();
  const s = farm ? p.farm : p.season;
  if(farm)s.months++;
  const full = p.lv==='주전'||p.lv==='선발' ? 1 : (p.lv==='백업'||p.lv==='불펜' ? .62 : .24);
  const cm=1+condMod(p), clutch=(tEff(p,'clutch')+p.clutchBonus+bonus)*.4;
  const opp=R.f(-2,2);
  const ip0=s.ip, er0=s.er, ab0=s.ab, h0=s.h;      // 이 달치만 떼어내기 위한 스냅샷
  if(p.pos==='pitcher'){
    const starts=Math.max(1,Math.round((p.lv==='선발'?30:p.lv==='불펜'?52:12)*frac));
    const perOut=p.lv==='선발'?(4.3+ab(p,'stamina')*.028):(p.lv==='불펜'?1.5:3.4);
    let ip=round(starts*perOut*(1+tEff(p,'ip'))*cm,1);
    ip=round(ip*(1-clamp((p.missGames||0)/144,0,.9)),1);
    const rate=ab(p,'stuff')*.34+ab(p,'control')*.30+ab(p,'velo')*.16+ab(p,'breaking')*.20;
    let era=9.9-rate*.078-tEff(p,'era')-clutch*.02+R.norm(0,.55)+opp*.06-(ab(p,'crisis')-50)*.006
            +slumpPenalty(p)*.34;
    era=clamp(round(era*(1-condMod(p)*.6),2),1.30,9.5);
    const k9=clamp((2.5+(ab(p,'velo')-45)*.085+(ab(p,'stuff')-45)*.06+ab(p,'breaking')*.018)*(1+tEff(p,'k9')),3,15);
    const dec=Math.round(starts*(p.lv==='선발'?.68:.26));
    const wr=clamp(.44+(4.70-era)*.075+(S.teamStr-62)*.006+tEff(p,'win')*.4,.18,.80);
    const w=Math.round(dec*wr), l=Math.max(0,dec-w);
    const sv=p.lv==='불펜'?Math.round(starts*R.f(.1,.45)):0;
    s.ip=round(s.ip+ip,1); s.w+=w; s.l+=l; s.sv+=sv;
    s.k+=Math.round(ip/9*k9); s.er+=Math.round(ip/9*era); s.g+=starts;
    log.push(`${farm?'[2군] ':''}${half} ${starts}경기 ${ip}이닝  ${w}승 ${l}패  평균자책 ${round(era,2)}  탈삼진 ${Math.round(ip/9*k9)}`);
  }else{
    const catcherF=p.pos==='catcher'?.88:1;
    let gm=Math.round((p.lv==='주전'?144:p.lv==='백업'?88:32)*frac*catcherF);
    gm=Math.max(2,gm-Math.round((p.missGames||0)*frac*2));
    const pa=Math.round(gm*(p.lv==='주전'?4.3:3.6));
    const C=ab(p,'contact')-slumpPenalty(p)*3.2,P=ab(p,'power'),E=ab(p,'eye');
    let avg=.140+C*.0019+E*.0002+condMod(p)*.12+clutch*.0012+R.norm(0,.021)-opp*.002;
    avg=clamp(avg,.130,.400);
    const bbR=clamp((E/100)*.135*(1+tEff(p,'bb')),.02,.22);
    const soR=clamp(.245-C*.0012+P*.0008+tEff(p,'so'),.06,.36);
    const bb=Math.round(pa*bbR), so=Math.round(pa*soR);
    const abn=Math.max(1,pa-bb-Math.round(pa*.02));
    const h=Math.round(abn*avg);
    const hr=Math.round(pa*Math.pow(P/100,3.2)*.070*cm);
    const d2=Math.round(h*(.15+P*.0009));
    const att=Math.round(Math.pow(ab(p,'run')/100,2)*gm*.6);
    const sb=Math.round(att*(.58+ab(p,'speed')*.003));
    const rbi=Math.round(hr*2.15+h*.33+(S.teamStr-62)*.35+clutch*.5);
    const r=Math.round(h*.42+bb*.24+hr*.4);
    s.g+=gm;s.pa+=pa;s.ab+=abn;s.h+=Math.min(h,abn);s.hr+=hr;s.d2+=d2;
    s.bb+=bb;s.so+=so;s.sb+=Math.max(0,sb);s.rbi+=rbi;s.r+=r;
    log.push(`${farm?'[2군] ':''}${half} ${gm}경기  타율 ${avg3(avg)}  ${h}안타 ${hr}홈런 ${rbi}타점 ${sb}도루`);
  }
  const hi=segmentHighlight(p,seg||{m:[4,5]});
  if(hi)log.push(hi);
  /* v3.0 — 회복항도 frac에 비례해야 한다.
     v2.1은 3회 호출 × .09 = 시즌 .27·체력 이었다. 월간(6회)에서 Σfrac*2 = 2 이므로
     계수를 .135로 두면 시즌 총 회복량이 .27·체력로 정확히 보존된다.
     (이 스케일링을 빼면 회복이 2배가 되어 피로도가 쌓이지 않는다) */
  p.fatigue=clamp(p.fatigue+(42*full*frac*2)*(1+tEff(p,'staminaCost'))
                  -ab(p,'stamina')*.135*(frac*2),0,100);
  if(!farm)p.gamesTotal+=s.g;
  expGrowth(p,full*frac*2);
  updateCond(p);
  const inj=rollInjury(p,full*frac*2);
  if(inj)log.push(inj);
  /* v3.0 — 슬럼프는 그 달 성적으로 판정한다 (한 달 만에 자동 해제되지 않는다) */
  const before0=p.pos==='pitcher'
    ? {ip:round(s.ip-ip0,1),er:s.er-er0}
    : {ab:s.ab-ab0,h:s.h-h0};
  const sm=slumpCheck(p,before0);
  if(sm)log.push(sm);
  return log;
}
/* 구간별 하이라이트 경기 — 역사적 경기는 리그 기록에도 남는다 */
function segmentHighlight(p,seg){
  if(p.lv==='2군')return null;
  const opp=TEAM(R.pick(TEAMS.filter(t=>t.id!==p.team)).id);
  const date=`${p.year}.${String(R.pick(seg.m)).padStart(2,'0')}.${String(R.i(1,28)).padStart(2,'0')}`;
  p.gameLog=p.gameLog||[];
  if(p.pos==='pitcher'){
    const rate=(ab(p,'stuff')+ab(p,'control')+ab(p,'breaking'))/3;
    if(p.lv==='선발'&&R.c(clamp((rate-74)/300,0,.05))){
      const perfect=R.c(.12);
      const k=perfect?'퍼펙트게임':'노히트노런';
      historicGame(k,`${date} vs ${opp.name} · 9이닝 무실점 ${R.i(7,14)}탈삼진`);
      return `<em>${k}</em> — ${date} ${opp.name}전`;
    }
    if(p.lv==='선발'&&R.c(.35)){
      const ln=`${R.i(6,8)}이닝 ${R.i(0,2)}실점 ${R.i(4,11)}탈삼진`;
      p.gameLog.push({y:p.year,kind:'호투',detail:`${date} vs ${opp.name} · ${ln}`});
    }
    return null;
  }
  const pw=ab(p,'power'),ct=ab(p,'contact');
  if(R.c(clamp((ct+pw-150)/900,0,.035))){
    historicGame('사이클링히트',`${date} vs ${opp.name} · 5타수 4안타`);
    return `<em>사이클링히트</em> — ${date} ${opp.name}전`;
  }
  if(R.c(.4)){
    const h=R.i(2,4),hr=R.c(clamp(pw/260,0,.4))?1:0;
    p.gameLog.push({y:p.year,kind:h>=4?'4안타 경기':'맹타',
      detail:`${date} vs ${opp.name} · ${h+1}타수 ${h}안타 ${hr?'1홈런 ':''}${R.i(1,4)}타점`});
  }
  return null;
}
function expGrowth(p,full){ // 경기 경험 — 잠재력을 향해 서서히 수렴
  const rate=(p.age<=22?.055:p.age<=26?.036:p.age<=29?.016:.004)*full*(1+tEff(p,'potential')*.5+tEff(p,'lateGrow')*.3);
  POS[p.pos].keys.forEach(k=>{
    const g=round((p.pot-p.st[k])*rate*R.f(.4,1.6),1);
    if(g>0.05)p.st[k]=clamp(round(p.st[k]+g,1),1,100);
  });
}
function rollInjury(p,full){
  let c=.066*full*(1+(p.fatigue-40)/110)*(1+tEff(p,'injury'))*(1+(p.injRisk||0));
  c*= p.age>=33?1.5:p.age>=30?1.2:1;
  c*= 1-clamp((p.st.stamina-50)/220,-.2,.25);
  if(!R.c(clamp(c,.01,.6)))return null;
  const sev=R.f(0,1);
  const days=sev>.85?R.i(90,160):sev>.55?R.i(35,70):R.i(10,28);
  const rehab=1-tEff(p,'rehab')*.4;
  const miss=Math.round(days*rehab/1.6);
  p.missGames=(p.missGames||0)+miss;
  p.injuries.push({y:p.year,days});
  p.fatigue=clamp(p.fatigue-15,0,100);
  /* v3.0 — 부상은 월 단위 상태가 된다. 그 달부터 경기에 못 나간다 */
  p.status='부상';
  p.rehabLeft=Math.max(1,Math.round(days*(1-tEff(p,'rehab')*.4)/30));
  p.stress=clamp((p.stress||20)+14,0,100);
  if(days>=90){
    const k=p.pos==='pitcher'?'velo':'speed';
    p.st[k]=clamp(round(p.st[k]-R.f(1.5,4),1),1,100);
    p.timeline.push({y:p.year,t:'큰 부상 (시즌 아웃)'});
    flag(p,'injuryHistory');
    return `<em>부상</em> — ${days}일 진단. 시즌의 상당 부분을 잃었다.`;
  }
  return `<em>부상</em> — ${days}일 진단. ${miss}경기 결장.`;
}

/* ── 시즌 마감 계산 ── */
function finalizeSeason(p){
  const s=p.season;
  if(p.pos==='pitcher'){
    s.era=s.ip>0?round(s.er*9/s.ip,2):0;
    s.war=round(clamp((s.ip/9)*((5.00-s.era)*.135)+(s.sv*.06),-2,9),1);
  }else{
    s.avg=s.ab>0?s.h/s.ab:0;
    const obp=s.pa>0?(s.h+s.bb)/s.pa:0;
    const tb=s.h+s.d2+2*s.hr;
    const slg=s.ab>0?tb/s.ab:0;
    s.ops=round(obp+slg,3);
    let def=((ab(p,'defense')-58)/100)*1.6*(s.g/144);
    if(p.pos==='catcher')def+=1.2*(s.g/144)+((ab(p,'lead')-55)/100)*1.4;
    s.war=round(clamp((s.g/144)*((s.ops-.660)*15)+def+(s.sb*.012),-2,9),1);
  }
  // 통산 누적
  const t=p.tot;
  t.g+=s.g;t.pa+=s.pa;t.ab+=s.ab;t.h+=s.h;t.hr+=s.hr;t.rbi+=s.rbi;t.sb+=s.sb;
  t.bb+=s.bb;t.so+=s.so;t.ip=round(t.ip+s.ip,1);t.w+=s.w;t.l+=s.l;t.sv+=s.sv;
  t.k+=s.k;t.er+=s.er;t.war=round(t.war+s.war,1);
  if(s.war>p.bestWar){p.bestWar=s.war;p.peakAge=p.age;}
  p.seasonsPlayed++;
  // 라이벌 성장
  simRival(p);
  return s;
}
function simRival(p){
  const rv=p.rival;
  const a=(L.players.find(x=>x.id===rv.id))||(L.retired.find(x=>x.id===rv.id));
  if(!a){rv.war=0;return;}
  rv.war=a.s?a.s.war:0;rv.totWar=a.c.war;rv.team=a.team;rv.ovr=a.ovr;
  rv.retired=a.retired;rv.aw=a.aw;rv.peak=a.peak;
}
function awardsPhase(p){
  const s=p.season,got=[];
  const entry={s,name:p.name,pos:p.pos,team:p.team,rookie:p.year===p.debutYear,ai:0,me:1};
  const lead=leagueAwards(entry);
  const mine=e=>e&&e.me;
  if(p.pos==='pitcher'){
    if(mine(lead.win)){p.awards.winKing++;got.push('다승왕');}
    if(mine(lead.so)){p.awards.soKing++;got.push('탈삼진왕');}
    if(mine(lead.era)){p.awards.eraKing++;got.push('평균자책점 1위');}
  }else{
    if(mine(lead.hr)){p.awards.hrKing++;got.push('홈런왕');}
    if(mine(lead.avg)){p.awards.hitKing++;got.push('타율 1위');}
    if(mine(lead.sb)){p.awards.sbKing++;got.push('도루왕');}
    if(mine(lead.hit))got.push('최다안타');
  }
  if(lead.allstars.some(e=>e.me)){p.awards.allstar++;got.push('올스타');}
  if(lead.gg[p.pos]&&lead.gg[p.pos].me){p.awards.gg++;got.push('골든글러브');}
  if(mine(lead.mvp)){p.awards.mvp++;got.push('정규시즌 MVP');p.fame+=15;p.timeline.push({y:p.year,t:'정규시즌 MVP'});}
  if(mine(lead.rookie)&&p.year===p.debutYear&&p.seasonsPlayed<=2){p.awards.rookie++;got.push('신인왕');p.timeline.push({y:p.year,t:'신인왕'});}
  ['홈런왕','다승왕','도루왕','탈삼진왕','타율 1위'].forEach(g=>{
    if(got.includes(g))p.timeline.push({y:p.year,t:g});});
  updateRecords(lead.ents);
  const nm=e=>e?e.name:'-';
  pushHistory({y:p.year,
    champ:(L.champions.find(c=>c.y===p.year)||{}).team||null,
    mvp:{name:nm(lead.mvp),war:lead.mvp?lead.mvp.s.war:0,me:!!mine(lead.mvp)},
    rookie:nm(lead.rookie),
    hr:{name:nm(lead.hr),v:lead.hr?lead.hr.s.hr:0},
    win:{name:nm(lead.win),v:lead.win?lead.win.s.w:0},
    era:{name:nm(lead.era),v:lead.era?lead.era.s.era:0},
    me:{war:s.war,team:p.team,rank:s.rank}});
  p.fame=clamp(p.fame+s.war*2.2+got.length*3-2,0,100);
  p.fanRating=clamp(p.fanRating+(s.war-2)*1.8+(p.flags.includes('troubleMaker')?-2:0)+tEff(p,'fan'),0,100);
  s.awardsGot=got;
  milestoneCheck(p);
  return got;
}
function rankCheck(p){
  const s=p.season;
  L.year=p.year;
  aiSeasonAll();
  const rows=simStandings(warNow(p));
  const my=rows.find(r=>r.id===p.team);
  s.rank=my.rank;s.teamW=my.w;s.teamL=my.l;
  p.inPost=my.rank<=5;
  const top=rows.slice(0,3).map(r=>`${TEAM(r.id).short} ${r.w}승`).join('  ·  ');
  return p.inPost
    ? [`${TEAM(p.team).name} — 정규시즌 <em>${my.rank}위</em> (${my.w}승 ${my.l}패). 포스트시즌 진출.`,`상위권: ${top}`]
    : [`${TEAM(p.team).name} — 정규시즌 ${my.rank}위 (${my.w}승 ${my.l}패). 가을 야구는 없다.`,`상위권: ${top}`];
}
function warNow(p){ // 시즌 확정 전 임시 WAR 추정
  const s=p.season;
  if(p.pos==='pitcher')return s.ip>0?(s.ip/9)*((5.00-(s.er*9/s.ip))*.135):0;
  const obp=s.pa>0?(s.h+s.bb)/s.pa:0, slg=s.ab>0?(s.h+s.d2+2*s.hr)/s.ab:0;
  return (s.g/144)*((obp+slg-.660)*15);
}
function postseason(p){
  const s=p.season,log=[];
  if(!p.inPost)return [];
  const res=postseasonRun();
  L.champions.push({y:L.year,team:res.champ});
  firstTeam(res.champ).filter(isAi).forEach(a=>a.aw.champ++);   // 플레이어 우승은 아래에서 따로 센다
  const big=1+tEff(p,'big');
  const perf=clamp((warNow(p)/6)*big*R.f(.4,1.7)+(p.cond-2)*.08+(p.clutchBonus||0)*.05,0,2.2);
  const games=R.i(4,13);
  p.post.games+=games;
  p.post.war=round(p.post.war+round(perf*1.2,1),1);
  if(perf>=1.1){p.post.bigHits+=2;log.push('10월의 그는 다른 선수였다.');}
  else if(perf<=.45){p.post.fail++;log.push('가을에는 방망이가, 공이 무거웠다.');}
  if(res.champ===p.team){
    p.awards.champ++;p.timeline.push({y:p.year,t:'한국시리즈 우승'});
    log.push('<em>한국시리즈 우승.</em> 마운드 위에 모두가 쌓였다.');
    historicGame('한국시리즈 우승',`${TEAM(p.team).name}, ${L.year} 한국시리즈 제패`);
    if(perf>=1.0&&R.c(.6)){p.awards.ksMvp++;p.timeline.push({y:p.year,t:'한국시리즈 MVP'});
      log.push('<em>한국시리즈 MVP</em>에 선정되었다.');p.fame+=12;}
    p.fanRating=clamp(p.fanRating+6,0,100);
  }else{
    log.push(`${TEAM(res.champ).name}이 한국시리즈 우승을 차지했다.`);
  }
  return log;
}

/* ==========================================================================
   [11] ENGINE — 특성 획득 / 진화
   ========================================================================== */
function traitCheck(p){
  const out=[];
  // 진화
  for(const id of [...p.traits]){
    const t=TR(id);
    if(t&&t.evolve&&t.evolve.cond(p)&&!p.traits.includes(t.evolve.to)){
      p.traits[p.traits.indexOf(id)]=t.evolve.to;
      p.traitLog.push({y:p.year,id:t.evolve.to,from:id});
      out.push({type:'evolve',from:id,to:t.evolve.to});
    }
  }
  // 신규 획득
  const cands=TRAITS.filter(t=>!p.traits.includes(t.id)&&t.prob&&
      (t.pos==='all'||t.pos===p.pos)&&!p.traitLog.find(l=>l.id===t.id));
  for(const t of R.shuffle(cands)){
    let pr=0; try{pr=t.prob(p,p.season)||0;}catch(e){pr=0;}
    if(pr>0&&R.c(pr)){ out.push({type:'new',id:t.id}); break; }
  }
  return out;
}
function addTrait(p,id,replaceId){
  if(replaceId){
    p.traits[p.traits.indexOf(replaceId)]=id;
  }else p.traits.push(id);
  p.traitLog.push({y:p.year,id});
  p.season&&p.season.traits.push(id);
}

/* ==========================================================================
   [12] ENGINE — 오프시즌 / 은퇴 / 엔딩
   ========================================================================== */
function agingPhase(p){
  const log=[];
  if(p.age<30)return log;
  const A=1+tEff(p,'aging');
  const rate=(p.age>=36?R.f(2.4,4.2):p.age>=34?R.f(1.6,3.0):p.age>=32?R.f(.9,2.0):R.f(.4,1.2))*A;
  const phys=p.pos==='pitcher'?['velo','stamina','recovery']:['speed','run','stamina','defense'];
  const skill=p.pos==='pitcher'?['control','breaking','stuff','mental','crisis']
                               :['contact','eye','mental','throw','power','catching','blocking','lead'];
  const dropped=[];
  phys.forEach(k=>{ if(p.st[k]===undefined)return;
    const d=round(rate*R.f(.5,1.2),1);
    if(d>.1){p.st[k]=clamp(round(p.st[k]-d,1),1,100);dropped.push(`${SLABEL[k]} -${d}`);}
  });
  skill.forEach(k=>{
    if(p.st[k]===undefined)return;
    if(p.age<=32){ if(R.c(.45))p.st[k]=clamp(round(p.st[k]+R.f(.2,.8),1),1,100); return; }
    const d=round(rate*R.f(.15,.5)*A,1);
    if(d>.1){p.st[k]=clamp(round(p.st[k]-d,1),1,100);dropped.push(`${SLABEL[k]} -${d}`);}
  });
  if(dropped.length)log.push(`몸이 달라졌다 — ${dropped.slice(0,6).join('  ')}`);
  return log;
}
function natCall(p){
  const s=p.season;
  if(s.war<3.6||p.age>34)return null;
  if(!R.c(.55))return null;
  p.nat.caps++;flag(p,'nationalTeam');
  const gold=R.c(.3+ (s.war-3.6)*.05);
  if(gold){p.nat.gold++;p.timeline.push({y:p.year,t:'국제대회 우승'});}
  const big=gold&&R.c(.5);
  if(big)p.nat.bigMoment++;
  p.fame=clamp(p.fame+8,0,100);p.fanRating=clamp(p.fanRating+(gold?7:3),0,100);
  return gold
    ?`국가대표로 <em>국제대회 우승</em>. ${big?'결승전 결승타의 주인공이 그였다.':'대표팀의 중심에 그가 있었다.'}`
    :'국가대표로 발탁되어 국제대회에 출전했다.';
}
function faEligible(p){return p.seasonsPlayed>=8&&!p.faDone;}
function contractValue(p){
  const base=ovr(p)*1.1+p.tot.war*.8+p.fame*.4-(p.age-27)*3-p.injuries.length*2;
  return Math.max(3,Math.round(base/4));
}
function retireCheck(p){
  const o=ovr(p);
  if(p.age>=40)return true;
  if(p.age>=38&&o<64)return true;
  if(p.age>=36&&o<58)return true;
  if(p.age>=34&&o<52)return true;
  if(p.age>=31&&p.season.war<0.2&&p.injuries.length>=3)return true;
  /* v3.0 — 1군에 한 번도 자리잡지 못한 채 나이만 먹으면 구단이 먼저 정리한다
     (요구 35 "유망주 실패"). 단, 1군 기록이 쌓인 선수에게는 적용하지 않는다. */
  p.farmYears=(p.career.seasons||[]).filter(s=>s.lv==='2군').length;
  if(p.lv==='2군'&&p.age>=28&&p.farmYears>=6&&p.tot.war<3)return true;
  if(p.lv==='2군'&&p.age>=31&&p.tot.war<8)return true;
  return false;
}
function decideEnding(p){
  for(const e of ENDINGS)if(e.when(p))return e;
  return ENDINGS[ENDINGS.length-1];
}
function careerGrade(p){
  const sc=p.tot.war*1.0+p.awards.mvp*8+p.awards.champ*5+p.awards.ksMvp*5+p.awards.allstar*1.5
    +p.nat.gold*4+p.fanRating*.08;
  if(sc>=110)return 'S+';if(sc>=85)return 'S';if(sc>=65)return 'A';
  if(sc>=45)return 'B';if(sc>=28)return 'C';if(sc>=14)return 'D';return 'F';
}
function seasonGrade(w){return w>=7?'S':w>=5?'A':w>=3.2?'B':w>=1.5?'C':w>=0?'D':'F';}

/* ==========================================================================
   [28] ENGINE v2.1 — 확률 기반 선택지 (outcome)
   choice = { t, s, risk, reveal, outcomes:[{p,label,res,bias}] , run, next, odds }
   res = { st:{power:+2}, tend:{}, rel:{}, flag:'x', fatigue:+10, cond:+1,
           injRisk:.2, fan:+3, media:+5, clutch:+2, text:'...' }
   ========================================================================== */
const REVEAL={FULL:'FULL',PARTIAL:'PARTIAL',HIDDEN:'HIDDEN',RUMOR:'RUMOR'};

function validateOutcomes(c){
  if(!c.outcomes)return;
  const sum=c.outcomes.reduce((s,o)=>s+o.p,0);
  if(Math.abs(sum-1)>0.001)
    console.warn(`[확률 검증] "${c.t}" 선택지의 확률 합이 ${round(sum*100,1)}% 입니다 (100%가 되어야 합니다)`);
}
/* 숨겨진 성향이 확률을 조용히 밀어준다 — 플레이어에게 계산식은 공개하지 않는다 */
function biasedWeights(p,c){
  return c.outcomes.map(o=>{
    let w=o.p;
    if(o.bias)for(const k in o.bias){
      const t=(k==='mental')?p.st.mental:(p.tend[k]!==undefined?p.tend[k]:50);
      w*=clamp(1+((t-50)/100)*o.bias[k]*1.3,.25,2.4);
    }
    return Math.max(.0005,w);
  });
}
function rollOutcome(p,c){
  validateOutcomes(c);
  const w=biasedWeights(p,c), tot=w.reduce((a,b)=>a+b,0);
  let r=Math.random()*tot,i=0;
  while(i<w.length-1&&r>w[i]){r-=w[i];i++;}
  const o=c.outcomes[i];
  const log=applyResult(p,o.res||{});
  if(o.res&&o.res.text)log.unshift(o.res.text);
  else log.unshift(o.label||'…');
  return log;
}
function applyResult(p,res){
  const log=[];
  if(res.st)grow(p,res.st);
  /* stKey:[주능력, 부능력] — 포지션에 맞는 능력치에 적용한다 (투수에게 컨택을 주지 않는다) */
  if(res.stKey)grow(p,{[W(p).key]:res.stKey[0],[W(p).key2]:res.stKey[1]||0});
  if(res.tend)tend(p,res.tend);
  if(res.rel)for(const k in res.rel)rel(p,k,res.rel[k]);
  if(res.flag)flag(p,res.flag);
  if(res.fatigue){p.fatigue=clamp(p.fatigue+res.fatigue,0,100);updateCond(p);}
  if(res.cond){p.cond=clamp(p.cond+res.cond,0,4);}
  if(res.injRisk)p.injRisk=(p.injRisk||0)+res.injRisk;
  if(res.fan){p.fanRating=clamp(p.fanRating+res.fan,0,100);}
  if(res.media){p.media=clamp((p.media||50)+res.media,0,100);
    log.push(res.media>0?'언론의 관심이 늘었다.':'언론의 관심에서 조금 멀어졌다.');}
  if(res.clutch)p.clutchBonus=(p.clutchBonus||0)+res.clutch;
  if(res.fame)p.fame=clamp(p.fame+res.fame,0,100);
  return log;
}
/* 선택지 미리보기 — 공개 수준에 따라 다르게 */
function oddsHtml(p,c){
  if(c.odds)  // 훈련처럼 직접 계산한 확률
    return `<div class="odds">${c.odds.map(o=>`<div><b>${o.pct}%</b><span>${esc(o.text)}</span></div>`).join('')}</div>`;
  if(!c.outcomes)return c.s?`<div class="cs">${esc(c.s)}</div>`:'';
  const lv=c.reveal||'PARTIAL';
  if(lv==='HIDDEN')return `<div class="cs">어떤 결과가 기다리는지는 알 수 없다.</div>`;
  const w=biasedWeights(p,c),tot=w.reduce((a,b)=>a+b,0);
  const rows=c.outcomes.map((o,i)=>({label:o.label,pct:Math.round(w[i]/tot*100)}))
                       .sort((a,b)=>b.pct-a.pct);
  if(lv==='FULL')
    return `<div class="odds">${rows.map(r=>`<div><b>${r.pct}%</b><span>${esc(r.label)}</span></div>`).join('')}</div>`;
  if(lv==='RUMOR')
    return `<div class="cs">예상 — ${esc(rows.map(r=>r.label).slice(0,2).join(' / '))}</div>`;
  const top=rows[0];
  const tone=top.pct>=65?'가능성이 높다':top.pct>=45?'해볼 만하다':'장담할 수 없다';
  return `<div class="cs">${esc(top.label)} — ${tone}</div>`;
}
const RISK_LABEL={SAFE:'안전',BALANCED:'보통',RISK:'위험',HIGH_RISK:'무리'};

/* ── 능력치 변화 스냅샷 / 표시 ── */
function snapStats(p){
  const o={__fat:p.fatigue,__cond:p.cond};
  POS[p.pos].keys.forEach(k=>o[k]=p.st[k]);
  return o;
}
function statDiff(p,b){
  const stats=[];
  POS[p.pos].keys.forEach(k=>{
    if(Math.abs(p.st[k]-b[k])>=.05)stats.push({k,from:b[k],to:p.st[k],d:round(p.st[k]-b[k],1)});
  });
  return {stats,fat:Math.round(p.fatigue-b.__fat),cond:p.cond-b.__cond};
}
function diffHtml(d){
  if(!d||(!d.stats.length&&!d.fat&&!d.cond))return '';
  const rows=d.stats.map(s=>{
    const cls=s.d>0?'plus':'minus';
    const lo=Math.min(s.from,s.to),hi=Math.max(s.from,s.to);
    return `<div class="dline ${cls}">
      <span class="nm">${SLABEL[s.k]}</span>
      <span class="from">${Math.round(s.from)}</span><span class="dim">→</span>
      <span class="to">${Math.round(s.to)}</span>
      <span class="delta">${s.d>0?'▲ +':'▼ '}${round(s.d,1)}</span>
      <span class="mini"><i style="width:${lo}%"></i>${s.d>0?`<u style="left:${lo}%;width:${hi-lo}%"></u>`:''}</span>
    </div>`;
  }).join('');
  const extra=[];
  if(d.fat)extra.push(`<div class="dline ${d.fat>0?'minus':'plus'}"><span class="nm">피로도</span>
     <span class="delta">${d.fat>0?'▲ +':'▼ '}${d.fat}</span></div>`);
  if(d.cond)extra.push(`<div class="dline ${d.cond>0?'plus':'minus'}"><span class="nm">컨디션</span>
     <span class="to">${COND_NAME[G.p.cond]}</span></div>`);
  return `<div class="diffbox"><h4>변화</h4>${rows}${extra.join('')}</div>`;
}

/* ==========================================================================
   [29] ENGINE v2.1 — 훈련 강도 (리스크 / 리턴)
   ========================================================================== */
const INTENSITY=[
  {id:'safe',label:'안전하게 조정한다',risk:'SAFE',mult:.7,base:.93,fat:.6},
  {id:'norm',label:'평소대로 훈련한다',risk:'BALANCED',mult:1,base:.76,fat:1},
  {id:'hard',label:'한계를 넘어선다',risk:'HIGH_RISK',mult:1.8,base:.44,fat:1.7,inj:.6}
];
function trainSuccess(p,it){
  let v=it.base+(p.tend.diligence-50)*.0035-(p.fatigue-40)*.0024+tEff(p,'train')*.4
        +(p.cond-2)*.025-(p.age>=33?.06:0);
  return clamp(v,.12,.97);
}
function doTrainingWith(p,t,it){
  if(t.rest)return doTraining(p,t,1,1);
  const pr=trainSuccess(p,it);
  const ok=R.c(pr);
  const log=doTraining(p,t,it.mult*(ok?1:.15),it.fat*(ok?1:1.45));
  if(ok){
    log.unshift(it.id==='hard'?'<em>한계를 넘었다.</em> 몸이 기억할 만한 훈련이었다.':'훈련 성공.');
    if(it.id==='hard')tend(p,{diligence:4,competitive:3});
  }else{
    log.unshift('<em>뜻대로 되지 않았다.</em> 몸이 따라오지 않는다.');
    p.fatigue=clamp(p.fatigue+8,0,100);
    if(it.inj)p.injRisk=(p.injRisk||0)+it.inj*.5;
    tend(p,{patience:2});
  }
  if(it.inj)p.injRisk=(p.injRisk||0)+it.inj*.3;
  updateCond(p);
  return log;
}
/* 몸 상태는 숫자로 다 알려주지 않는다 */
function bodyHint(p){
  const f=p.fatigue;
  if(f>=82)return '몸이 무겁다. 오늘은 무리하면 안 될 것 같다.';
  if(f>=64)return '피로가 쌓여 있는 게 느껴진다.';
  if(f>=42)return '나쁘지 않다. 조금 더 밀어붙일 수 있을 것 같기도 하다.';
  return '몸이 가볍다.';
}

/* ==========================================================================
   [30] ENGINE v2.1 — 별명 / 팀 내 경쟁 / 커리어 하이라이트
   ========================================================================== */
const NICK_RULES=[
  [['홈런왕','강심장'],'가을의 거포'],[['홈런왕','슈퍼스타'],'담장 너머의 사나이'],
  [['안타왕','선구안'],'타석의 계산기'],[['안타제조기'],'안타 제조기'],
  [['에이스','철인'],'마운드의 철벽'],[['절대에이스'],'리그의 벽'],
  [['닥터K'],'삼진 수집가'],[['칼제구'],'실 끝의 제구'],
  [['유리몸','천재'],'부서진 천재'],[['도루왕','슈퍼스타'],'그라운드의 질주'],
  [['대도'],'베이스 도둑'],[['명포수','주장감'],'안방의 지휘자'],
  [['큰경기의 사나이'],'10월의 남자'],[['국민영웅'],'국민의 4번'],
  [['악동'],'문제아'],[['대기만성'],'늦게 핀 꽃'],[['철인'],'철인']
];
function nickname(p){
  for(const [need,nick] of NICK_RULES)
    if(need.every(t=>p.traits.includes(t)))return nick;
  if(p.awards.mvp>=2)return '리그의 지배자';
  if(p.awards.hrKing>=1)return '홈런 타자';
  if(p.awards.winKing>=1||p.awards.soKing>=1)return '팀의 1선발';
  if(p.awards.allstar>=3)return '올스타 단골';
  if(p.seasonsPlayed>=10)return '베테랑';
  if(p.lv==='2군')return '2군의 유망주';
  return '신예';
}
/* 팀 내 같은 포지션 경쟁자 */
function competitor(p){
  if(!L)return null;
  const same=firstTeam(p.team).filter(a=>a.pos===p.pos);
  return same.sort((a,b)=>b.ovr-a.ovr)[0]||null;
}
function competitionCheck(p){
  const c=competitor(p);
  const log=[];
  if(!c)return log;
  const me=ovr(p);
  if(p.compId!==c.id){p.compId=c.id;p.compYears=0;p.compAhead=me>=c.ovr;}
  p.compYears=(p.compYears||0)+1;
  const ahead=me>=c.ovr;
  if(ahead&&!p.compAhead){
    log.push(`<em>주전 경쟁</em> — ${c.name}(${c.ovr})을 넘어섰다. 이제 감독은 당신을 먼저 부른다.`);
    p.timeline.push({y:p.year,t:`${c.name}과의 주전 경쟁에서 앞서다`});
    rel(p,'manager',6);
  }else if(!ahead&&p.compAhead){
    log.push(`<em>주전 경쟁</em> — ${c.name}(${c.ovr})에게 자리를 내줬다.`);
  }else if(!ahead){
    log.push(`같은 자리를 두고 ${c.name}(종합 ${c.ovr})과 경쟁 중이다. 당신은 ${me}.`);
  }
  p.compAhead=ahead;
  // 팀 내 경쟁자 → 라이벌로 진화
  if(p.compYears>=4&&!p.flags.includes('teamRival_'+c.id)){
    flag(p,'teamRival_'+c.id);
    log.push(`${c.name}과는 이제 단순한 동료가 아니다.`);
  }
  return log;
}
/* 이번 생의 기록 */
function lifeHighlights(p){
  const out=[];
  const best=p.career.seasons.slice().sort((a,b)=>b.war-a.war)[0];
  if(best)out.push(['최고의 시즌',`${best.year}년 · WAR ${best.war}`,
    p.pos==='pitcher'?`${best.w}승 평균자책 ${best.era}`:`타율 ${best.ab?avg3(best.h/best.ab):'-'} ${best.hr}홈런 ${best.rbi}타점`]);
  const big=(p.gameLog||[]).find(g=>/퍼펙트|노히트|사이클링/.test(g.kind));
  const ks=p.timeline.find(t=>t.t==='한국시리즈 MVP')||p.timeline.find(t=>t.t==='한국시리즈 우승');
  if(big)out.push(['최고의 경기',big.kind,big.detail||'']);
  else if(ks)out.push(['최고의 경기',`${ks.y}년 한국시리즈`,ks.t]);
  const inj=p.injuries.slice().sort((a,b)=>b.days-a.days)[0];
  if(inj)out.push(['가장 아쉬웠던 순간',`${inj.y}년 부상`,`${inj.days}일 진단`]);
  const mvp=p.timeline.find(t=>t.t==='정규시즌 MVP');
  if(mvp)out.push(['가장 극적인 순간',`${mvp.y}년 MVP 수상`,'']);
  else if(p.awards.champ)out.push(['가장 극적인 순간',
    `${(p.timeline.find(t=>t.t==='한국시리즈 우승')||{}).y||''}년 우승`,'']);
  const rv=L&&(L.players.find(a=>a.id===p.rival.id)||L.retired.find(a=>a.id===p.rival.id));
  if(rv)out.push(['최고의 라이벌',rv.name,`통산 WAR ${rv.c.war} · MVP ${rv.aw.mvp}회`]);
  const ch=(p.choiceLog||[]).filter(c=>c.mark)[0]||(p.choiceLog||[])[0];
  if(ch)out.push(['가장 기억에 남는 선택',`${ch.y}년 · ${ch.title}`,ch.pick]);
  return out;
}

/* ==========================================================================
   [31] ENGINE v2.1 — 리그 뉴스 피드
   ========================================================================== */
function genNews(p){
  const n=[],add=(tag,text,me)=>n.push({tag,text,me:me?1:0,y:L.year});
  const ones=L.players.filter(a=>a.lv==='1군'&&a.s&&a.s.g);
  const top=ones.slice().sort((a,b)=>b.s.war-a.s.war)[0];
  const hr=ones.filter(a=>a.pos!=='pitcher').sort((a,b)=>b.s.hr-a.s.hr)[0];
  const st=L.standings[0];
  if(st)add('순위',`${TEAM(st.id).name}, ${st.w}승 ${st.l}패로 정규시즌 1위`,st.id===p.team);
  if(top)add('활약',`${top.name}(${TEAM(top.team).short}) 올 시즌 WAR ${top.s.war} — 리그 최고의 한 해`);
  if(hr&&hr.s.hr>=25)add('기록',`${hr.name}, 시즌 ${hr.s.hr}호 홈런`);
  const rookie=ones.filter(a=>a.debut===L.year&&a.s.war>=1.5).sort((a,b)=>b.s.war-a.s.war)[0];
  if(rookie)add('신인',`신인 ${rookie.name}(${TEAM(rookie.team).short}) 데뷔 첫해부터 1군 주전급 활약`);
  const rv=L.players.find(a=>a.id===p.rival.id);
  if(rv&&rv.s&&rv.s.g)add('라이벌',rv.pos==='pitcher'
    ? `${rv.name}, ${rv.s.w}승 평균자책 ${rv.s.era}`
    : `${rv.name}, 타율 ${avg3(rv.s.avg||0)} ${rv.s.hr}홈런`);
  const s=p.season;
  if(s&&s.g)add('당신',p.pos==='pitcher'
    ? `${p.name}, ${s.w}승 ${s.l}패 평균자책 ${s.ip?round(s.er*9/s.ip,2):'-'}`
    : `${p.name}, 타율 ${s.ab?avg3(s.h/s.ab):'-'} ${s.hr}홈런 ${s.rbi}타점`,1);
  // 역사적 사건 (리그 전체)
  if(R.c(.35)){
    const t=R.pick(TEAMS);
    add('구단',R.pick([`${t.name}, 감독 교체 발표`,`${t.name}, 대대적인 리빌딩 선언`,
      `${t.name} 구단주 교체 — 투자 확대 예고`,`${t.name}, 최근 9경기 8승으로 상승세`,
      `${t.name}, 8연패로 흔들리는 중`]),t.id===p.team);
  }
  const dyn=L.champions.slice(-3);
  if(dyn.length===3&&dyn[0].team===dyn[1].team&&dyn[1].team===dyn[2].team)
    add('왕조',`${TEAM(dyn[0].team).name}, 3년 연속 우승 — 새로운 왕조의 시작`,dyn[0].team===p.team);
  L.news=(L.news||[]).concat(n).slice(-60);
  return n;
}
function newsHtml(list){
  if(!list||!list.length)return '<div class="sm dim">아직 소식이 없습니다.</div>';
  return list.map(x=>`<div class="newscard ${x.me?'me':''}">
    <div class="nh">★ ${esc(x.tag)} NEWS ${x.y||''}</div>
    <div class="nb">${esc(x.text)}</div></div>`).join('');
}

/* ==========================================================================
   [36] ENGINE v3.0 — 돈 / 연봉 / 시장가치  (요구 20·21)
   단위: 만원. 화면에는 억/만원으로 환산해 보여준다.
   경제가 게임의 주제가 되지 않도록 단순하게 유지한다.
   ========================================================================== */
const MONEY0={balance:2000,salary:3000,signBonus:0,years:3,value:3000,earned:0,spent:0};

function wonText(v){
  v=Math.round(v||0);
  if(Math.abs(v)>=10000){
    const eok=v/10000;
    return (Math.abs(eok)>=10?Math.round(eok):round(eok,1))+'억';
  }
  return v.toLocaleString('ko-KR')+'만원';
}
/* 시장가치 — 성적·나이·잠재력·인기가 값을 만든다 */
function marketValue(p){
  const o=ovr(p), war=p.tot.war, best=p.bestWar||0;
  /* 목표 곡선 — 19세 유망주 3천만 / 23세 주전 1.2억 / 27세 스타 7억 / 30세 FA 최대어 15억 */
  let v = 1200
    + Math.pow(Math.max(0,o-44),2.5)*1.7        // 능력치는 가파르게 (상위 구간에서 급등)
    + war*360                                    // 통산 실적
    + best*best*400                              // 전성기 임팩트는 비선형
    + p.fanRating*26 + p.fame*34
    + p.awards.mvp*22000 + p.awards.allstar*2600 + p.awards.gg*1800
    + p.awards.champ*2200 + p.nat.gold*3000;
  v*=1+clamp(((p.rel.front||50)-50)*.0035,-.12,.12);  // 프런트와의 관계가 평가에 묻어난다
  if(p.age>=31)v*=clamp(1-(p.age-30)*.11,.25,1);   // 나이 할인
  if(p.age<=22)v*=.55+ (p.pot-o)*.012;             // 유망주 프리미엄은 제한적
  if(p.lv==='2군')v*=.35;
  if(p.injuries.length>=4)v*=.85;
  return Math.max(2700,Math.round(v/100)*100);
}
/* 매년 재계약 — FA 전에는 구단이 값을 매긴다 */
function salaryReview(p){
  const m=p.money, mv=marketValue(p);
  m.value=mv;
  const prev=m.salary;
  let next;
  if(m.years>1){                                  // 계약 기간 중 — 소폭만 오른다
    m.years--;
    next=Math.round(prev*clamp(1+(p.season.war-1.5)*.07,.95,1.35));
  }else{
    next=Math.round(mv*(p.seasonsPlayed>=8?1:.55));   // FA 자격 전엔 구단이 유리하다
    next=clamp(next,Math.round(prev*.72),Math.round(prev*2.6));
    m.years=p.seasonsPlayed>=6?R.i(1,3):1;
  }
  next=Math.max(3000,next);
  m.salary=next;
  return {prev,next,mv,diff:next-prev};
}
/* 한 해 수입/지출 정산 */
function settleYear(p){
  const m=p.money, s=p.season, log=[];
  const win=Math.round((s.war>0?s.war:0)*380);                 // 승리수당
  const ad=Math.round(p.fanRating*p.fame*0.9);                 // 광고
  const prize=(p.awards.champ&&p.year===(p.lastChampYear||-1))?3000:0;
  const income=m.salary+win+ad+prize;
  const living=Math.round(600+m.salary*.13);                   // 생활비 (연봉에 비례)
  const gear=Math.round(120+ovr(p)*4);                         // 장비 유지비
  const trainer=p.money.trainer?1800:0;                        // 개인 트레이너
  const rehab=p.injuries.filter(x=>x.y===p.year).length*500;   // 재활비
  let outgo=living+gear+trainer+rehab;
  if(m.balance+income-outgo<0){                                // 빚은 지지 않는다 — 허리띠를 조른다
    outgo=Math.max(0,m.balance+income);
    log.push('올해는 씀씀이를 줄여야 했다.');
  }
  m.balance=Math.max(0,m.balance+income-outgo);
  m.earned+=income;m.spent+=outgo;
  log.push(`연봉 ${wonText(m.salary)}  승리수당 ${wonText(win)}  광고 ${wonText(ad)}${prize?`  우승 보너스 ${wonText(prize)}`:''}`);
  log.push(`지출 ${wonText(outgo)} (생활 ${wonText(living)} · 장비 ${wonText(gear)}${trainer?` · 트레이너 ${wonText(trainer)}`:''}${rehab?` · 재활 ${wonText(rehab)}`:''})`);
  log.push(`자산 <em>${wonText(m.balance)}</em>`);
  return log;
}
/* 돈을 쓰는 행동의 공통 처리 — 잔고가 부족하면 못 한다 */
function spend(p,amount,label){
  const m=p.money;
  if(m.balance<amount)return false;
  m.balance-=amount;m.spent+=amount;
  return true;
}

/* ==========================================================================
   [37] ENGINE v3.0 — 슬럼프  (요구 22)
   v2.1의 p.slump 는 simHalf 한 번마다 즉시 풀리는 0/1 플래그였다.
   월간 시스템에서는 "몇 달째 답이 없는" 상태가 되어야 한다.
   ========================================================================== */
function slumpObj(){return{active:false,since:null,depth:0,months:0};}
function slumpOf(p){
  if(!p.slump||typeof p.slump!=='object')p.slump=slumpObj();
  return p.slump;
}
/* 그 달의 성적을 보고 슬럼프 진입/심화/탈출을 판정한다 */
function slumpCheck(p,monthLine){
  const sl=slumpOf(p);
  let bad=false;
  /* 한 달 표본은 작다. 임계를 엄하게 잡지 않으면 매달 슬럼프에 걸린다 (실측: 커리어당 5.9회) */
  if(p.pos==='pitcher'){
    if(monthLine.ip>=10)bad=(monthLine.er*9/monthLine.ip)>=5.9;
  }else if(monthLine.ab>=30){
    bad=(monthLine.h/monthLine.ab)<=.205;
  }
  const mentalGuard=clamp((ab(p,'mental')-50)*.004,-.08,.10);
  if(!sl.active){
    if(bad&&R.c(clamp(.44-mentalGuard+(p.stress||0)*.002,.12,.70))){
      sl.active=true;sl.since=`${G.cal.year}.${G.cal.month}`;sl.depth=1;sl.months=1;
      p.stress=clamp((p.stress||20)+12,0,100);
      return `<em>슬럼프</em> — ${W(p).slumpLine}.`;
    }
    return null;
  }
  sl.months++;
  if(bad&&sl.months<=4){sl.depth=Math.min(3,sl.depth+1);p.stress=clamp((p.stress||20)+6,0,100);
    return `슬럼프가 길어진다. (${sl.months}개월째)`;}
  if(R.c(.58+mentalGuard+(sl.months>=4?.25:0))){  // 자연 탈출 (길어질수록 잘 풀린다)
    const mo=sl.months;
    p.slump=slumpObj();
    p.stress=clamp((p.stress||20)-10,0,100);
    return `<em>슬럼프 탈출</em> — ${mo}개월 만이다.`;
  }
  return `아직 감이 돌아오지 않는다. (${sl.months}개월째)`;
}
function slumpPenalty(p){
  const sl=slumpOf(p);
  return sl.active?sl.depth:0;                    // 1~3
}
function slumpEscape(p,kind){
  const sl=slumpOf(p);
  if(!sl.active)return ['이미 감은 돌아와 있었다.'];
  let pr=0,log=[];
  if(kind==='hard'){ pr=.60; p.fatigue=clamp(p.fatigue+12,0,100); tend(p,{diligence:5}); }
  if(kind==='rest'){ pr=.45; p.fatigue=clamp(p.fatigue-16,0,100); p.stress=clamp((p.stress||20)-8,0,100); }
  if(kind==='coach'){ pr=.70; rel(p,'coach',6); tend(p,{social:3}); }
  pr+=clamp((ab(p,'mental')-50)*.004,-.06,.08);
  if(R.c(pr)){
    const mo=sl.months;p.slump=slumpObj();
    p.stress=clamp((p.stress||20)-12,0,100);
    if(kind==='hard'){grow(p,{[W(p).key]:1.2});log.push('몸이 먼저 기억해냈다.');}
    if(kind==='coach')log.push(`${W(p).coach}가 영상 하나를 짚어줬다.`);
    log.unshift(`<em>슬럼프 탈출</em> — ${mo}개월 만이다.`);
  }else{
    sl.depth=Math.min(3,sl.depth+1);
    p.stress=clamp((p.stress||20)+5,0,100);
    log.push('이번에도 답은 나오지 않았다.');
    if(kind==='hard'){p.fatigue=clamp(p.fatigue+6,0,100);log.push('피로만 쌓였다.');}
  }
  updateCond(p);
  return log;
}

/* ==========================================================================
   [39] v3.0 — "이 인생을 만든 선택들"  (요구 24·27·39)
   relLog 에 쌓인 장기 플래그를 연·월 순으로 풀어, 은퇴 화면에서
   "2026년의 그 선택이 여기까지 왔구나"를 눈으로 보게 한다.
   ========================================================================== */
const FLAG_LABEL={
  firstCallUp:'처음 1군의 부름을 받았다',
  demoted:'2군으로 내려갔다',
  helpedVeteran:'부진한 선배 곁에 남았다',
  mentoredRookie:'후배를 챙기기 시작했다',
  captainCandidate:'주장 후보로 거론됐다',
  captain:'주장 완장을 받았다',
  playedHurt:'아픈 몸으로 그라운드에 섰다',
  ironWill:'수술 대신 출전을 택했다',
  injuryHistory:'큰 부상을 겪었다',
  facedBooing:'야유 앞에서 모자를 벗었다',
  wonThemBack:'야유를 응원가로 바꿨다',
  refusedTrade:'트레이드를 거절했다',
  noRegret:'그 선택을 후회하지 않기로 했다',
  ifOnly:'가지 않은 길을 곱씹었다',
  managerConflict:'감독에게 등을 돌렸다',
  madeAmends:'먼저 손을 내밀었다',
  troubleMaker:'라커룸에 말이 돌았다',
  changedMan:'평판을 바꾸기로 했다',
  franchiseStar:'한 팀에 남기로 했다',
  wantsNumberRetired:'비어 있는 담장을 올려다봤다',
  numberPromised:'영구결번을 약속받았다',
  tookTheBall:'아무도 안 들 때 손을 들었다',
  aceBattery:'에이스의 공을 받기 시작했다',
  lastBattery:'에이스의 마지막 공을 받았다',
  spokeUp:'구단에 쓴소리를 했다',
  family:'가족과 보내는 시간을 만들었다',
  playingForSomeone:'누군가를 위해 뛰기 시작했다',
  mediaConflict:'언론과 부딪쳤다',
  wantOut:'다른 유니폼을 상상했다',
  nationalTeam:'태극마크를 달았다',
  teamFace:'팀의 얼굴이 됐다',
  bigBomb:'큰 경기의 거포가 됐다',
  debut:'첫 경기에 섰다'
};
function lifeChain(p){
  return (p.relLog||[])
    .filter(e=>FLAG_LABEL[e.f])
    .sort((a,b)=>(a.y-b.y)||((a.m||0)-(b.m||0)))
    .map(e=>({y:e.y,m:e.m,t:FLAG_LABEL[e.f]}));
}
