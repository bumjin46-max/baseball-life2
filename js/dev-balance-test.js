/* dev-balance-test.js — 개발용 — 콘솔 밸런스 자동 테스트 runBalanceTest(n)
   원본 index.html 섹션: [33]
   ※ 클래식 스크립트로 순서대로 로드됩니다. index.html의 <script> 순서를 바꾸지 마세요. */
"use strict";

/* ==========================================================================
   [33] 밸런스 자동 테스트 — 콘솔에서 runBalanceTest(500)
   ========================================================================== */
function runBalanceTest(n){
  n=n||100;
  const t0=Date.now();
  const res={wars:[],seasons:[],inj:[],endings:{},traits:{},mvp:0,allstar:0,hrLead:[],mvpWar:[],
             aiTop:[],roster:[],warnings:0,maxStat:0};
  const w0=console.warn;console.warn=()=>{res.warnings++;};
  for(let i=0;i<n;i++){
    startGame('테스트'+i,['batter','pitcher','catcher'][i%3]);
    let g=0;
    while(G.screen==='game'&&g++<8000){
      if(G.ui&&G.ui.choices)choose(Math.floor(Math.random()*G.ui.choices.length));else advance();
    }
    const p=G.p;
    res.wars.push(p.tot.war);res.seasons.push(p.seasonsPlayed);res.inj.push(p.injuries.length);
    res.mvp+=p.awards.mvp;res.allstar+=p.awards.allstar;
    res.endings[p.ending.title]=(res.endings[p.ending.title]||0)+1;
    p.traits.forEach(t=>res.traits[t]=(res.traits[t]||0)+1);
    POS[p.pos].keys.forEach(k=>res.maxStat=Math.max(res.maxStat,p.st[k]));
    if(L){L.history.forEach(h=>{res.hrLead.push(h.hr.v);res.mvpWar.push(h.mvp.war);});
      res.aiTop.push(L.rec.career.war?L.rec.career.war.v:0);
      res.roster.push(L.players.filter(a=>a.lv==='1군').length);}
  }
  console.warn=w0;
  const avg=a=>a.length?Math.round(a.reduce((x,y)=>x+y,0)/a.length*10)/10:0;
  const q=(a,f)=>a.slice().sort((x,y)=>x-y)[Math.floor(a.length*f)];
  const top=(o,k)=>Object.entries(o).sort((a,b)=>b[1]-a[1]).slice(0,k)
    .map(([a,b])=>`${a} ${Math.round(b/n*100)}%`).join(', ');
  console.log(`━━ 밸런스 테스트 ${n}회 (${((Date.now()-t0)/1000).toFixed(1)}초) ━━`);
  console.log(`통산 WAR   25% ${q(res.wars,.25)} / 중앙 ${q(res.wars,.5)} / 75% ${q(res.wars,.75)} / 최대 ${Math.max(...res.wars)}`);
  console.log(`커리어 길이 평균 ${avg(res.seasons)}시즌 · 커리어당 부상 ${avg(res.inj)}회 · 최고 능력치 ${res.maxStat}`);
  console.log(`플레이어 MVP ${res.mvp}회 / 올스타 ${res.allstar}회 (${n}커리어 기준)`);
  console.log(`리그 홈런왕 평균 ${avg(res.hrLead)} · MVP 시즌 WAR 평균 ${avg(res.mvpWar)} · AI 통산 1위 평균 ${avg(res.aiTop)} · 1군 인원 ${avg(res.roster)}`);
  console.log(`엔딩 분포: ${top(res.endings,8)}`);
  console.log(`특성 보유율: ${top(res.traits,8)}`);
  console.log(`확률 합계 경고: ${res.warnings}건`);
  return res;
}
