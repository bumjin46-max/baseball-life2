/* 1-core.js — 코어 — 난수 · 저장소 · 월드 시드 · 이름 생성기
   원본 index.html 섹션: [1] [17]
   ※ 클래식 스크립트로 순서대로 로드됩니다. index.html의 <script> 순서를 바꾸지 마세요. */
"use strict";

/* ==========================================================================
   [0] BUILD — 빌드 식별자
   화면 좌하단과 콘솔에 찍힙니다. 여기 값과 화면 값이 다르면
   브라우저가 옛 js 파일을 캐시에서 쓰고 있다는 뜻입니다.
   ========================================================================== */
const BUILD='v3.1';
const BUILD_DATE='2026-09-16';
try{console.log('%c야구 인생 '+BUILD+' ('+BUILD_DATE+')','background:#1c7a4a;color:#fff;padding:2px 8px;border-radius:4px');}catch(e){}

/* ==========================================================================
   [1] UTIL — 난수, 저장소
   ========================================================================== */
const R = {
  f:(a,b)=>a+Math.random()*(b-a),
  i:(a,b)=>Math.floor(a+Math.random()*(b-a+1)),
  c:p=>Math.random()<p,
  pick:a=>a[Math.floor(Math.random()*a.length)],
  norm:(m,s)=>{let u=0,v=0;while(!u)u=Math.random();while(!v)v=Math.random();
    return m+s*Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);},
  shuffle:a=>a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(v=>v[1])
};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const round=(v,d)=>Math.round(v*10**d)/10**d;
const avg3=v=>v.toFixed(3).replace(/^0/,'');

const MEM={};
/* v3.0 — 저장소.
   기존 구현은 window.storage(비표준)만 보고 실패 시 MEM(메모리)으로 떨어졌다.
   즉 일반 브라우저에서는 새로고침하면 세이브가 사라졌다. 모바일에서는 탭이
   메모리에서 내려가기만 해도 날아간다. localStorage 를 실제 저장소로 쓴다.
   3단 폴백: window.storage → localStorage → 메모리 */
const STORE_NS='baseballLife:';
function _ls(){ try{ const t='__t'; localStorage.setItem(t,'1'); localStorage.removeItem(t); return localStorage; }catch(e){ return null; } }
const LS=_ls();
const Store={
  async get(k){
    try{ if(window.storage){const r=await window.storage.get(k); if(r)return JSON.parse(r.value);} }catch(e){}
    try{ if(LS){const v=LS.getItem(STORE_NS+k); if(v!=null)return JSON.parse(v);} }catch(e){}
    return MEM[k]??null;
  },
  async set(k,v){
    MEM[k]=v;
    const json=JSON.stringify(v);
    try{ if(window.storage)await window.storage.set(k,json); }catch(e){}
    try{ if(LS)LS.setItem(STORE_NS+k,json); }
    catch(e){
      /* 용량 초과 — 세이브가 제일 크다. 오래된 것부터 비우고 한 번 더 시도한다 */
      try{ LS.removeItem(STORE_NS+'save_v1'); LS.setItem(STORE_NS+k,json); }
      catch(e2){ if(!Store._warned){Store._warned=1;
        console.warn('저장 공간이 부족합니다. 이번 세션에서만 기록이 유지됩니다.');} }
    }
  },
  async del(k){
    delete MEM[k];
    try{ if(window.storage)await window.storage.delete(k); }catch(e){}
    try{ if(LS)LS.removeItem(STORE_NS+k); }catch(e){}
  }
};

/* ==========================================================================
   [17] WORLD — 시드 난수 / 이름 생성기
   ========================================================================== */
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);
  t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
let SRND=Math.random;
const SR={
  f:(a,b)=>a+SRND()*(b-a), i:(a,b)=>Math.floor(a+SRND()*(b-a+1)),
  c:p=>SRND()<p, pick:a=>a[Math.floor(SRND()*a.length)],
  norm:(m,s)=>{let u=0,v=0;while(!u)u=SRND();while(!v)v=SRND();
    return m+s*Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);},
  shuffle:a=>a.map(v=>[SRND(),v]).sort((x,y)=>x[0]-y[0]).map(v=>v[1])
};
function seedWorld(seed){SRND=mulberry32(seed>>>0);}

const SYL1=['도','태','준','재','민','현','우','성','지','승','건','예','주','시','한','윤','대','세','규','찬','영','동','기','상','진','호','정','수','경','인','범','석','용','병','유','근','철','창','광','남'];
const SYL2=['윤','준','현','우','호','석','민','진','성','훈','재','환','빈','수','규','찬','한','영','기','원','철','율','겸','휘','건','완','철','서','범','택','일','근','섭','목','훈'];
const BLOCK=['이승엽','박찬호','류현진','김광현','양현종','강백호','이정후','오타니','최정','손아섭','김하성','박병호','추신수','이대호','정근우','김태균','나성범','구자욱','윤석민','장원준','원태인','안우진'];
function genName(used){
  for(let i=0;i<60;i++){
    const n=SR.pick(SURNAME)+SR.pick(SYL1)+SR.pick(SYL2);
    if(!BLOCK.includes(n)&&!(used&&used.has(n))){used&&used.add(n);return n;}
  }
  return SR.pick(SURNAME)+SR.pick(SYL1)+SR.pick(SYL2)+SR.i(1,9);
}
