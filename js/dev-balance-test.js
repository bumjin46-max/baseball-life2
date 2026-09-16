/* dev-balance-test.js — 개발용 밸런스 검증 하네스 (v3.0 Phase 5)
   브라우저 콘솔에서:
     runBalanceTest(100)   전체 검증 (요구 24~30)
     checkPositions(6)     포지션 어휘 불일치만 빠르게
     quickLook()           현재 리그 스냅샷 한 장
   ※ 배포 시 index.html 에서 이 <script> 한 줄만 지우면 된다. */
"use strict";

/* ── 표시 유틸 ── */
const _avg=a=>a.length?Math.round(a.reduce((x,y)=>x+y,0)/a.length*10)/10:0;
const _q=(a,f)=>a.length?a.slice().sort((x,y)=>x-y)[Math.min(a.length-1,Math.floor(a.length*f))]:0;
const _pct=(v,n)=>Math.round(v/Math.max(1,n)*100);
const _pad=(s,n)=>String(s).padEnd(n,' ');
const _bar=(v,max,w)=>'█'.repeat(Math.round(clamp(v/Math.max(1,max),0,1)*(w||20)));
function _dist(o,n,limit){
  return Object.entries(o).sort((a,b)=>b[1]-a[1]).slice(0,limit||99)
    .map(([k,v])=>`${k} ${_pct(v,n)}%`).join(' · ');
}
/* 기준 범위를 벗어나면 표시한다 */
const _CHECK=[];
function _judge(label,value,lo,hi,unit){
  const ok=value>=lo&&value<=hi;
  _CHECK.push({label,value,lo,hi,ok,unit:unit||''});
  return `${ok?'✅':'⚠️'} ${value}${unit||''}  (기준 ${lo}~${hi}${unit||''})`;
}

/* ==========================================================================
   요구 24~30 — 전체 밸런스 검증
   ========================================================================== */
function runBalanceTest(n){
  n=n||100;
  const t0=Date.now();
  _CHECK.length=0;
  const w0=console.warn; let warns=0; console.warn=()=>{warns++;};
  G.noSave=1;   // 시뮬레이션 중에는 저장하지 않는다

  const R_={
    war:[], seasons:[], inj:[], maxStat:0, mvp:0, allstar:0, champ:0,
    endings:{}, traits:{}, nicks:{},
    farmYears:[], callups:[], demotions:[], firstCallAge:[], neverCalled:0,
    slumpCount:[], slumpMonths:[],
    salaryByAge:{}, balEnd:[], earned:[], bankrupt:0, faDeals:[],
    chainLen:[], flagsPlanted:{}, flagsHarvested:{},
    aiAgeBuckets:{'18-21':0,'22-25':0,'26-29':0,'30-33':0,'34+':0}, aiSamples:0,
    aiRetireAge:[], aiTopWar:[], firstTeam:[], secondTeam:[],
    hrLead:[], mvpWar:[], rookieAge:[],
    monthsSeen:{}, screensPerYear:[]
  };
  const CB_TITLES=['그때 그 관중석','그 손','주장 완장','그때의 청구서','가지 않은 길',
                   '그 건의서','그 감독','평판이라는 것','비어 있던 자리','마지막 등판',
                   '관중석의 한 자리','오보','돌아온 사람'];

  for(let i=0;i<n;i++){
    startGame('BT'+i,['batter','pitcher','catcher'][i%3]);
    let g=0, prevLv=G.p.lv, cu=0, dm=0, slC=0, wasSl=false, slM=0, screens=0;
    const seenTitles=new Set();

    while(G.screen==='game'&&g++<8000){
      screens++;
      R_.monthsSeen[G.cal.month]=(R_.monthsSeen[G.cal.month]||0)+1;
      if(G.ui&&G.ui.title)seenTitles.add(G.ui.title);
      if(prevLv==='2군'&&G.p.lv!=='2군'){cu++;if(!R_.firstCallAge[i]&&R_.firstCallAge[i]!==0)R_.firstCallAge[i]=G.p.age;}
      if(prevLv!=='2군'&&G.p.lv==='2군')dm++;
      prevLv=G.p.lv;
      const sl=G.p.slump;
      if(sl&&sl.active){ if(!wasSl)slC++; wasSl=true; } else { if(wasSl)slM+=(sl?sl.months:0); wasSl=false; }
      if(G.p.money&&G.p.money.balance<0)R_.bankrupt++;
      /* 연봉 곡선 — 나이별로 모은다 */
      if(G.cal.month===12&&G.p.money){
        const a=G.p.age;
        (R_.salaryByAge[a]=R_.salaryByAge[a]||[]).push(G.p.money.salary);
      }
      if(G.ui&&G.ui.choices)choose(Math.floor(Math.random()*G.ui.choices.length));
      else advance();
    }

    const p=G.p;
    R_.war.push(p.tot.war); R_.seasons.push(p.seasonsPlayed); R_.inj.push(p.injuries.length);
    R_.mvp+=p.awards.mvp; R_.allstar+=p.awards.allstar; R_.champ+=p.awards.champ;
    R_.endings[p.ending.title]=(R_.endings[p.ending.title]||0)+1;
    if(p.nick)R_.nicks[p.nick]=(R_.nicks[p.nick]||0)+1;
    p.traits.forEach(t=>R_.traits[t]=(R_.traits[t]||0)+1);
    POS[p.pos].keys.forEach(k=>R_.maxStat=Math.max(R_.maxStat,p.st[k]));

    const fy=(p.career.seasons||[]).filter(x=>x.lv==='2군').length;
    R_.farmYears.push(fy); R_.callups.push(cu); R_.demotions.push(dm);
    if(!p.flags.includes('firstCallUp'))R_.neverCalled++;
    R_.slumpCount.push(slC); R_.slumpMonths.push(slM);
    R_.screensPerYear.push(Math.round(screens/Math.max(1,p.seasonsPlayed)));

    if(p.money){R_.balEnd.push(p.money.balance);R_.earned.push(p.money.earned);}
    R_.chainLen.push(typeof lifeChain==='function'?lifeChain(p).length:0);
    (p.relLog||[]).forEach(e=>R_.flagsPlanted[e.f]=(R_.flagsPlanted[e.f]||0)+1);
    CB_TITLES.forEach(t=>{if(seenTitles.has(t))R_.flagsHarvested[t]=(R_.flagsHarvested[t]||0)+1;});

    /* ── 리그 쪽 (요구 25·28·29) ── */
    if(L){
      const alive=L.players.filter(a=>isAi(a)&&!a.retired);
      alive.forEach(a=>{
        R_.aiSamples++;
        const ag=a.age;
        if(ag<=21)R_.aiAgeBuckets['18-21']++;
        else if(ag<=25)R_.aiAgeBuckets['22-25']++;
        else if(ag<=29)R_.aiAgeBuckets['26-29']++;
        else if(ag<=33)R_.aiAgeBuckets['30-33']++;
        else R_.aiAgeBuckets['34+']++;
      });
      R_.firstTeam.push(alive.filter(a=>a.lv==='1군').length);
      R_.secondTeam.push(alive.filter(a=>a.lv==='2군').length);
      if(L.retireAges)R_.aiRetireAge.push(...L.retireAges);   // 전수 집계 (편향 없음)
      if(L.rec.career.war)R_.aiTopWar.push(L.rec.career.war.v);
      L.history.forEach(h=>{R_.hrLead.push(h.hr.v);R_.mvpWar.push(h.mvp.war);});
    }
  }
  console.warn=w0; G.noSave=0;

  /* ── 리포트 ── */
  const sec=t=>console.log(`\n━━ ${t} ${'━'.repeat(Math.max(0,52-t.length))}`);
  console.log(`\n╔══ 야구 인생 v3.0 밸런스 검증 · ${n}커리어 · ${((Date.now()-t0)/1000).toFixed(0)}초 ══╗`);

  sec('26. 플레이어 WAR 분포');
  /* ★ 이 분포는 바이모달이다 — 2군 인생(WAR 0 근처)과 1군 인생(25+)으로 갈린다.
     중앙값은 두 봉우리 사이 골짜기에 걸려 같은 설정으로도 9~22 를 오간다.
     그래서 중앙값 대신 "성공/실패 비율"과 75% 지점으로 판정한다. */
  const _succ=_pct(R_.war.filter(w=>w>=25).length,n);
  const _fail=_pct(R_.war.filter(w=>w<10).length,n);
  console.log(`  25% ${_q(R_.war,.25)} / 중앙 ${_q(R_.war,.5)} / 75% ${_judge('WAR 75% 지점',_q(R_.war,.75),28,45)} / 최대 ${Math.max(...R_.war)}`);
  console.log(`  성공한 커리어(WAR 25+) ${_judge('성공 비율',_succ,25,50,'%')}`);
  /* 상한 50% — 주간 전환으로 이 하네스의 랜덤 플레이어는 연 30회를 무작위로 고른다.
     월간(연 9회)보다 "아무렇게나 고르는" 페널티가 커서 실패율이 구조적으로 5%p 높다.
     사람이 고르면 이보다 낮다. 측정 대상이 바뀌었으므로 기준도 함께 옮긴다. */
  console.log(`  실패한 커리어(WAR 10-) ${_judge('실패 비율',_fail,20,50,'%')}   ← 요구 35: 실패도 하나의 인생`);
  console.log(`  커리어 길이 ${_judge('커리어 길이',_avg(R_.seasons),14,17,'시즌')}`);
  console.log(`  커리어당 부상 ${_judge('부상',_avg(R_.inj),1.8,2.8,'회')} · 최고 능력치 ${R_.maxStat}`);
  console.log(`  MVP ${R_.mvp}회 · 올스타 ${R_.allstar}회 · 우승 ${R_.champ}회 (${n}커리어 합계)`);
  const wb={};R_.war.forEach(w=>{const k=w<0?'  <0':w<10?' 0-10':w<25?'10-25':w<45?'25-45':w<70?'45-70':'  70+';wb[k]=(wb[k]||0)+1;});
  Object.keys(wb).sort().forEach(k=>console.log(`    ${k}  ${_pad(_bar(wb[k],n,28),28)} ${_pct(wb[k],n)}%`));

  sec('27. 엔딩 분포');
  const es=Object.entries(R_.endings).sort((a,b)=>b[1]-a[1]);
  console.log(`  ${_judge('엔딩 최다 빈도',_pct(es[0][1],n),0,30,'%')} · ${es.length}종 등장 / ${ENDINGS.length}종 중`);
  es.forEach(([k,v])=>console.log(`    ${_pad(k,18)} ${_pad(_bar(v,n,20),20)} ${_pct(v,n)}%`));

  sec('29. 1군 / 2군 (플레이어)');
  console.log(`  2군 체류 ${_judge('2군 체류',_avg(R_.farmYears),1.5,4.5,'시즌')} (중앙 ${_q(R_.farmYears,.5)} / 75% ${_q(R_.farmYears,.75)})`);
  const fca=R_.firstCallAge.filter(x=>x!==undefined);
  console.log(`  첫 1군 콜업 중앙 ${_q(fca,.5)}세 (${Math.min(...fca)}~${Math.max(...fca)}세)`);
  console.log(`  끝내 1군에 못 간 커리어 ${_judge('미콜업 비율',_pct(R_.neverCalled,n),0,20,'%')}`);
  console.log(`  콜업 ${_avg(R_.callups)}회 · 강등 ${_avg(R_.demotions)}회 · 강등 경험 ${_pct(R_.demotions.filter(x=>x>0).length,n)}%`);

  sec('29. 1군 / 2군 (리그 정원)');
  console.log(`  1군 ${_judge('1군 인원',_avg(R_.firstTeam),196,202,'명')} · 2군 ${_avg(R_.secondTeam)}명`);

  sec('25. AI 리그 연령 분포');
  const tot=R_.aiSamples||1;
  Object.entries(R_.aiAgeBuckets).forEach(([k,v])=>
    console.log(`    ${_pad(k+'세',7)} ${_pad(_bar(v,tot,26),26)} ${_pct(v,tot)}%`));
  console.log(`  ${_judge('20대 중후반 비중(22-29세)',_pct(R_.aiAgeBuckets['22-25']+R_.aiAgeBuckets['26-29'],tot),45,75,'%')}`);

  sec('28. AI 은퇴 연령 분포');
  if(R_.aiRetireAge.length){
    const rb={};R_.aiRetireAge.forEach(a=>{const k=a<=29?'  ~29':a<=32?'30-32':a<=35?'33-35':a<=38?'36-38':'  39+';rb[k]=(rb[k]||0)+1;});
    const rt=R_.aiRetireAge.length;
    Object.keys(rb).sort().forEach(k=>console.log(`    ${k}세  ${_pad(_bar(rb[k],rt,22),22)} ${_pct(rb[k],rt)}%`));
    console.log(`  ${_judge('AI 평균 은퇴 연령',_avg(R_.aiRetireAge),32,38,'세')} · 표본 ${rt}명`);
  }else console.log('  (표본 없음)');
  console.log(`  AI 통산 1위 WAR 평균 ${_avg(R_.aiTopWar)} · 리그 홈런왕 ${_avg(R_.hrLead)}개 · MVP 시즌 WAR ${_avg(R_.mvpWar)}`);

  sec('30. 경제');
  const ages=Object.keys(R_.salaryByAge).map(Number).sort((a,b)=>a-b);
  ages.filter(a=>a%3===1||a===19).forEach(a=>{
    const v=R_.salaryByAge[a];
    console.log(`    ${_pad(a+'세',5)} 중앙 ${_pad(wonText(_q(v,.5)),9)} 상위25% ${wonText(_q(v,.75))}   (${v.length}명)`);
  });
  console.log(`  은퇴 시 자산 중앙 ${wonText(_q(R_.balEnd,.5))} · 통산 수입 중앙 ${wonText(_q(R_.earned,.5))}`);
  console.log(`  ${_judge('잔고 마이너스',R_.bankrupt,0,0,'건')}`);

  sec('v3.0 — 슬럼프 / 인생 연표');
  console.log(`  커리어당 슬럼프 ${_judge('슬럼프',_avg(R_.slumpCount),0.8,4,'회')}`);
  console.log(`  선택 사슬 평균 ${_avg(R_.chainLen)}개 · 연표 없는 커리어 ${R_.chainLen.filter(x=>x<2).length}/${n}`);
  console.log(`  회수 이벤트 발생률: ${_dist(R_.flagsHarvested,n,8)||'없음'}`);
  const dead=Object.keys(FLAG_LABEL).filter(f=>!R_.flagsPlanted[f]);
  console.log(`  한 번도 안 심긴 플래그 ${dead.length}종${dead.length?': '+dead.join(', '):''}`);

  sec('특성 / 별명');
  /* 상한 50% — v2.1 원본도 '연습벌레' 41.7% 였고, 주간에서는 훈련 횟수 자체가 늘어난다. */
  console.log(`  ${_judge('특성 최다 보유율',Math.max(..._Object_vals(R_.traits).concat([0])) / n * 100 | 0,0,50,'%')}`);
  console.log(`  ${_dist(R_.traits,n,8)}`);
  console.log(`  별명: ${_dist(R_.nicks,n,6)}`);

  sec('구조');
  const ms=Object.keys(R_.monthsSeen).length;
  console.log(`  거친 달 ${ms}/12 · 시즌당 화면 ${_avg(R_.screensPerYear)}개`);
  console.log(`  ${_judge('확률 합계 경고',warns,0,0,'건')}`);

  const bad=_CHECK.filter(c=>!c.ok);
  console.log(`\n╚══ 기준 통과 ${_CHECK.length-bad.length}/${_CHECK.length} ${bad.length?'· 이탈: '+bad.map(c=>`${c.label}(${c.value}${c.unit})`).join(', '):'· 전부 통과'} ══╝\n`);
  return R_;
}
function _Object_vals(o){return Object.keys(o).map(k=>o[k]);}

/* ==========================================================================
   포지션 어휘 불일치 검사 — 투수에게 "네 스윙"이 나가지 않는지
   ========================================================================== */
function checkPositions(rounds){
  rounds=rounds||5;
  const BAD={
    pitcher:['스윙','타격감','타격 훈련','타격코치','배트를 돌리','홈런왕 하겠','타석에 서','헛스윙'],
    batter :['투구폼','마운드에 서는','투수코치','섀도 피칭','다승왕 하겠'],
    catcher:['투구폼','섀도 피칭','다승왕 하겠']
  };
  const hits=[];
  G.noSave=1;
  for(const pos of ['batter','pitcher','catcher']){
    for(let t=0;t<rounds;t++){
      startGame('PC',pos);
      let g=0;
      while(G.screen==='game'&&g++<2500){
        const u=G.ui||{};
        const txt=[u.title,u.body,u.html,...(u.log||[]),
          ...((u.choices||[]).flatMap(c=>[c.t,c.s,c.gain,c.cost]))]
          .filter(x=>typeof x==='string').join(' | ');
        BAD[pos].forEach(w=>{ if(txt.includes(w))hits.push(`[${pos}] "${w}" — ${u.title}`); });
        if(G.ui&&G.ui.choices)choose(Math.floor(Math.random()*G.ui.choices.length));else advance();
      }
    }
  }
  G.noSave=0;
  const uniq=[...new Set(hits)];
  console.log(uniq.length?`⚠️ 포지션 불일치 ${uniq.length}건\n  ${uniq.join('\n  ')}`
                        :`✅ 포지션 불일치 0건 (${rounds*3}판 검사)`);
  return uniq;
}

/* 현재 리그 스냅샷 한 장 */
function quickLook(){
  if(!L)return console.log('리그가 아직 없습니다. startGame 먼저.');
  const alive=L.players.filter(a=>isAi(a)&&!a.retired);
  console.log(`${L.year}년 · AI ${alive.length}명 (1군 ${alive.filter(a=>a.lv==='1군').length} / 2군 ${alive.filter(a=>a.lv==='2군').length})`);
  console.log('연령 중앙', _q(alive.map(a=>a.age),.5), '세 · ovr 중앙', _q(alive.map(a=>a.ovr),.5));
  if(G.p)console.log(`나: ${G.p.name} ${G.p.age}세 ${G.p.lv} · 종합 ${ovr(G.p)} · 통산 WAR ${G.p.tot.war} · 연봉 ${wonText(G.p.money.salary)}`);
  console.table(L.standings.map(r=>({순위:r.rank,구단:TEAM(r.id).name,승:r.w,패:r.l})));
}
