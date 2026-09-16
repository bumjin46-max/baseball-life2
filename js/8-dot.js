/* 8-dot.js — 도트 연출 엔진 (v3.1)
   고전 육성 시뮬 + 한국 프로야구 + 레트로 도트.

   40여 장을 전부 픽셀 행문자열로 찍으면 관리가 불가능해진다.
   그래서 "픽셀 드로잉 DSL + 부품 함수 + 장면 레시피" 3단으로 나눴다.
     · DSL      : px / rect / line / circ  — 64×32 픽셀 격자에만 그린다
     · 부품     : 타자·투수·포수·공·배트·트로피·붕대 …  (재사용)
     · 레시피   : DOT[id] = ctx => { 부품 몇 개 배치 }
   덕분에 장면 하나가 5~15줄이고, 색만 바꿔 파생 장면을 만들 수 있다.

   렌더는 <canvas>에 그린 뒤 image-rendering:pixelated 로 확대한다.
   같은 id는 dataURL 로 캐시하므로 두 번째부터는 그리지 않는다. */
"use strict";

const DOT_W=64, DOT_H=32;
/* 캐릭터는 2배(16px→32px)로 그리므로 32 높이 캔버스에 꽉 차 잘린다.
   캐릭터만 48 높이를 쓰고 위아래로 여백을 둔다. */
const CHAR_H=48;

/* 팔레트 — 게임 CSS 변수와 같은 계열로 맞춘다 */
const DP={
  sky1:'#16324a', sky2:'#1d4360', night:'#101d2b',
  turf:'#1f4a32', turf2:'#266039', dirt:'#8a5a34', dirt2:'#a06b3e',
  line:'#e8e6dc', skin:'#e8b088', skin2:'#c98f6a',
  uni:'#eceadf', uni2:'#c9c7bd', cap:'#1d4ed8',
  dark:'#24313a', bat:'#b07a45', ball:'#f4f2e8', seam:'#c0392b',
  gold:'#f5c451', gold2:'#c9962b', silver:'#c9cdd2',
  red:'#d2604f', green:'#8fd6a6', blue:'#6f9fc4', purple:'#b58ad6',
  clay:'#c07a45', dim:'#6b7a72', white:'#ffffff', black:'#0b1410',
  crowd1:'#2a3d4f', crowd2:'#35506a'
};

/* ── 픽셀 DSL ────────────────────────────────────────────────── */
function _mk(h){
  const c=document.createElement('canvas');
  c.width=DOT_W;c.height=h||DOT_H;
  const g=c.getContext('2d');
  g.imageSmoothingEnabled=false;
  return {c,g};
}
const D={
  g:null, s:1, ox:0, oy:0,          // s=2 면 부품 함수를 그대로 쓰면서 2배로 그려진다
  px(x,y,col){ if(!col)return; this.g.fillStyle=col;
    this.g.fillRect(this.ox+(x|0)*this.s, this.oy+(y|0)*this.s, this.s, this.s); },
  rect(x,y,w,h,col){ if(!col)return; this.g.fillStyle=col;
    this.g.fillRect(this.ox+(x|0)*this.s, this.oy+(y|0)*this.s, (w|0)*this.s, (h|0)*this.s); },
  hline(x,y,w,col){ this.rect(x,y,w,1,col); },
  vline(x,y,h,col){ this.rect(x,y,1,h,col); },
  line(x0,y0,x1,y1,col){                       // 브레젠험
    let dx=Math.abs(x1-x0), dy=Math.abs(y1-y0);
    let sx=x0<x1?1:-1, sy=y0<y1?1:-1, err=dx-dy;
    for(;;){ this.px(x0,y0,col);
      if(x0===x1&&y0===y1)break;
      const e2=2*err;
      if(e2>-dy){err-=dy;x0+=sx;}
      if(e2<dx){err+=dx;y0+=sy;}
    }
  },
  circ(cx,cy,r,col){
    for(let y=-r;y<=r;y++)for(let x=-r;x<=r;x++)
      if(x*x+y*y<=r*r+r*0.4)this.px(cx+x,cy+y,col);
  },
  ring(cx,cy,r,col){
    for(let a=0;a<360;a+=6)this.px(Math.round(cx+Math.cos(a*Math.PI/180)*r),
                                   Math.round(cy+Math.sin(a*Math.PI/180)*r),col);
  }
};

/* ── 배경 ────────────────────────────────────────────────────── */
const _H=()=>(D.g&&D.g.canvas?D.g.canvas.height:DOT_H);
function _raw(fn){const s=D.s,ox=D.ox,oy=D.oy;D.s=1;D.ox=0;D.oy=0;fn();D.s=s;D.ox=ox;D.oy=oy;}
function bgField(night){ _raw(()=>{
  D.rect(0,0,DOT_W,14,night?DP.night:DP.sky1);
  D.rect(0,6,DOT_W,8,night?'#16263a':DP.sky2);
  D.rect(0,14,DOT_W,_H()-14,DP.turf);
  D.hline(0,14,DOT_W,DP.turf2);
  for(let x=0;x<DOT_W;x+=8)D.rect(x,18,4,_H()-18,DP.turf2);   // 잔디 줄무늬
});}
function bgCrowd(){
  D.rect(0,0,DOT_W,DOT_H,DP.crowd1);
  for(let y=1;y<12;y+=3)for(let x=(y%2?1:3);x<DOT_W;x+=4)D.rect(x,y,2,2,DP.crowd2);
  D.rect(0,12,DOT_W,DOT_H-12,DP.turf);
  D.hline(0,12,DOT_W,DP.turf2);
}
function bgIndoor(){
  D.rect(0,0,DOT_W,DOT_H,'#1a2a24');
  for(let x=0;x<DOT_W;x+=16)D.vline(x,0,20,'#223528');
  D.rect(0,20,DOT_W,DOT_H-20,'#2b3c33');
  D.hline(0,20,DOT_W,'#3a5044');
}
function bgRoom(bright){
  D.rect(0,0,DOT_W,DOT_H,bright?'#243a30':'#16251e');
  D.rect(0,22,DOT_W,DOT_H-22,'#2e4438');
  D.hline(0,22,DOT_W,'#3d5a48');
}

/* ── 부품 ────────────────────────────────────────────────────── */
/* 선수 몸통 — pose: stand|swing|pitch|crouch|down|lift|run|cheer */
function figure(x,y,pose,uni,capCol){
  uni=uni||DP.uni; capCol=capCol||DP.cap;
  const s=DP.skin;
  D.rect(x+2,y+1,4,4,s);                 // 머리
  D.rect(x+1,y,6,2,capCol);              // 모자
  D.px(x+7,y+1,capCol);                  // 챙
  if(pose==='down'){                      // 고개 숙이고 주저앉음
    D.rect(x+2,y+2,4,3,s);                // 머리를 한 칸 내린다
    D.rect(x+1,y+1,6,2,capCol);
    D.rect(x+1,y+6,6,5,uni);
    D.rect(x+0,y+11,8,3,DP.dark);         // 접은 다리
    D.rect(x-1,y+7,2,4,s);                // 늘어뜨린 팔
    D.rect(x+7,y+7,2,4,s);
    return;
  }
  if(pose==='crouch'){                    // 포수 자세
    D.rect(x+1,y+5,6,4,uni);
    D.rect(x+0,y+9,3,3,DP.dark);D.rect(x+5,y+9,3,3,DP.dark);
    D.rect(x-2,y+5,3,3,DP.bat);           // 미트
    return;
  }
  D.rect(x+2,y+5,4,6,uni);               // 몸통
  D.rect(x+2,y+11,2,5,DP.dark);          // 다리
  D.rect(x+4,y+11,2,5,DP.dark);
  /* 팔은 2px — 1px 팔은 확대해도 자세가 읽히지 않는다 */
  if(pose==='swing'){ D.rect(x+6,y+4,3,2,s); D.rect(x+8,y+3,2,2,s); }
  else if(pose==='pitch'){ D.rect(x+6,y+2,2,4,s); D.rect(x-1,y+7,3,2,s); }
  else if(pose==='lift'){ D.rect(x+0,y+3,2,3,s); D.rect(x+6,y+3,2,3,s); }
  else if(pose==='cheer'){ D.rect(x-1,y+0,2,5,s); D.rect(x+7,y+0,2,5,s); }
  else if(pose==='run'){ D.rect(x+6,y+5,2,3,s); D.rect(x+0,y+7,2,2,s);
    D.rect(x+1,y+15,3,1,DP.dark); }
  else { D.rect(x+0,y+6,2,4,s); D.rect(x+6,y+6,2,4,s); }
}
function bat(x,y,ang){                    // ang: -1 뒤 / 0 위 / 1 스윙
  const c=DP.bat;
  if(ang<0){ D.line(x,y,x+5,y-5,c); D.line(x+1,y,x+6,y-5,c); }
  else if(ang>0){ D.line(x,y,x+7,y+2,c); D.line(x,y+1,x+7,y+3,c); }
  else { D.vline(x,y-6,7,c); D.vline(x+1,y-6,7,c); }
}
function ball(x,y,big){
  D.circ(x,y,big?2:1,DP.ball);
  D.px(x-1,y,DP.seam);D.px(x+1,y,DP.seam);
}
function trail(x,y,dx,col){               // 궤적
  for(let i=0;i<5;i++)D.px(x-dx*i,y-i,i<2?col:DP.dim);
}
function glove(x,y){ D.rect(x,y,4,4,DP.bat); D.px(x+1,y-1,DP.bat); D.px(x+3,y-1,DP.bat); }
function trophy(x,y,col){
  col=col||DP.gold;
  D.rect(x,y,7,5,col); D.rect(x+1,y+5,5,1,col);
  D.rect(x+2,y+6,3,3,DP.gold2); D.rect(x,y+9,7,2,DP.gold2);
  D.px(x-1,y+1,col);D.px(x-1,y+2,col);D.px(x+7,y+1,col);D.px(x+7,y+2,col);
  D.px(x+2,y+1,DP.white);
}
function medal(x,y,col){
  col=col||DP.gold;
  D.line(x,y,x+2,y+4,DP.red);D.line(x+5,y,x+3,y+4,DP.red);
  D.circ(x+3,y+7,3,col); D.px(x+2,y+6,DP.white);
}
function star(x,y,col){
  col=col||DP.gold;
  D.px(x,y-2,col);D.rect(x-2,y-1,5,1,col);D.rect(x-1,y,3,2,col);
  D.px(x-2,y+2,col);D.px(x+2,y+2,col);
}
function bandage(x,y){
  D.rect(x,y,5,3,DP.uni); D.px(x+1,y+1,DP.red); D.px(x+3,y+1,DP.red);
}
function note(x,y){                        // 신문/서류
  D.rect(x,y,9,11,DP.uni); D.rect(x+1,y+1,7,1,DP.dark);
  for(let i=3;i<10;i+=2)D.hline(x+1,y+i,7,DP.dim);
}
function arrowUp(x,y,col){
  col=col||DP.green;
  D.px(x,y,col);D.rect(x-1,y+1,3,1,col);D.rect(x-2,y+2,5,1,col);D.rect(x-1,y+3,3,3,col);
}
function arrowDown(x,y,col){
  col=col||DP.red;
  D.rect(x-1,y,3,3,col);D.rect(x-2,y+3,5,1,col);D.rect(x-1,y+4,3,1,col);D.px(x,y+5,col);
}
function sparks(cx,cy,col,n){
  col=col||DP.gold;n=n||6;
  for(let i=0;i<n;i++){
    const a=i*(360/n)*Math.PI/180;
    D.px(Math.round(cx+Math.cos(a)*5),Math.round(cy+Math.sin(a)*5),col);
    D.px(Math.round(cx+Math.cos(a)*7),Math.round(cy+Math.sin(a)*7),DP.white);
  }
}
function sweat(x,y){ D.px(x,y,DP.blue);D.px(x,y+1,DP.blue);D.px(x+3,y-1,DP.blue); }
function scoreboard(x,y,l,r){
  D.rect(x,y,20,9,DP.black); D.rect(x+1,y+1,18,7,'#152018');
  D.rect(x+3,y+3,3,3,DP.gold); D.rect(x+13,y+3,3,3,DP.gold);
  D.px(x+9,y+4,DP.dim);D.px(x+10,y+5,DP.dim);
}
function crowdWave(){ for(let x=0;x<DOT_W;x+=5)D.rect(x,2+((x/5)%2?0:2),3,2,DP.gold); }
function rain(){ for(let i=0;i<22;i++){const x=(i*7)%DOT_W,y=(i*5)%20;D.vline(x,y,3,'#5b7f9e');} }

/* ══════════════════════════════════════════════════════════════
   장면 레시피 — 요구 1의 목록을 전부 덮는다
   ══════════════════════════════════════════════════════════════ */
const DOT={

/* ── 훈련 ── */
trainSolo(){ bgIndoor(); figure(14,10,'swing'); bat(22,15,1);
  ball(40,14,1); trail(40,14,2,DP.uni2); sweat(12,10); },
trainSuccess(){ bgIndoor(); figure(14,9,'lift'); sparks(18,10,DP.gold,7);
  arrowUp(40,14); arrowUp(48,16); D.rect(30,26,20,2,DP.gold2); },
trainFail(){ bgIndoor(); figure(14,11,'down'); sweat(11,13); sweat(25,15);
  arrowDown(42,12,DP.red); arrowDown(50,15,DP.red); D.rect(32,26,10,2,DP.dim); },
trainTeam(){ bgField(); figure(8,10,'stand'); figure(22,10,'stand',DP.uni2);
  figure(36,10,'stand'); figure(50,10,'stand',DP.uni2);
  ball(30,20,0); ball(44,22,0); },
trainWeight(){ bgIndoor(); figure(26,10,'lift');
  D.rect(18,9,4,4,DP.dark); D.rect(38,9,4,4,DP.dark); D.rect(22,10,16,2,DP.silver);
  sweat(24,9); },
trainSkill(){ bgIndoor(); figure(16,10,'pitch'); ball(36,12,1); trail(36,12,3,DP.ball);
  D.rect(52,8,6,14,DP.uni2); D.rect(53,9,4,12,DP.dark); },
statUp(){ bgRoom(1); arrowUp(20,10,DP.green); arrowUp(32,7,DP.green); arrowUp(44,10,DP.green);
  sparks(32,14,DP.green,8); D.rect(12,24,40,2,DP.green); },

/* ── 이벤트 ── */
evStory(){ bgRoom(); note(28,9); figure(12,11,'stand'); },
evGood(){ bgRoom(1); figure(28,10,'cheer'); sparks(32,10,DP.gold,8); star(50,8); star(12,10); },
evBad(){ bgRoom(); rain(); figure(28,11,'down'); },
evRival(){ bgField(); figure(12,10,'stand',DP.uni,DP.red); figure(44,10,'stand',DP.uni2,DP.blue);
  D.vline(32,8,18,DP.gold); D.rect(30,6,5,2,DP.gold); sparks(32,16,DP.red,4); },
evCoach(){ bgField(); figure(16,10,'stand',DP.uni2,DP.dark); figure(38,10,'stand');
  D.rect(26,8,4,3,DP.uni); D.px(28,11,DP.uni); },
evTeam(){ bgRoom(1); figure(10,11,'stand'); figure(24,11,'stand',DP.uni2);
  figure(38,11,'stand'); figure(52,11,'stand',DP.uni2); D.hline(8,28,48,DP.clay); },
evContract(){ bgRoom(1); note(14,8); figure(38,10,'stand',DP.uni2,DP.dark);
  D.rect(26,26,12,2,DP.gold); star(20,6,DP.gold); },

/* ── 경기 ── */
gameStart(){ bgCrowd(); figure(26,12,'stand'); ball(50,18,1); scoreboard(40,2); crowdWave(); },
gameWin(){ bgCrowd(); figure(20,11,'cheer'); figure(34,11,'cheer',DP.uni2);
  sparks(28,10,DP.gold,8); scoreboard(40,2); },
gameLose(){ bgCrowd(); figure(28,13,'down'); D.rect(0,0,DOT_W,12,DP.night);
  scoreboard(40,2); },
gameWalkoff(){ bgCrowd(); crowdWave(); figure(16,11,'run'); bat(28,18,1);
  ball(52,6,1); trail(52,6,3,DP.gold); sparks(52,6,DP.gold,6); },
gameComeback(){ bgCrowd(); figure(24,11,'cheer'); arrowUp(48,12,DP.green);
  arrowUp(54,16,DP.green); scoreboard(38,2); },
gameBlowout(){ bgCrowd(); figure(10,11,'cheer');figure(22,11,'cheer',DP.uni2);
  figure(34,11,'cheer');figure(46,11,'cheer',DP.uni2); crowdWave(); },
gameShutout(){ bgField(1); figure(26,10,'pitch'); ball(44,12,1); trail(44,12,3,DP.ball);
  D.rect(4,4,14,7,DP.black); D.rect(6,6,4,3,DP.gold); D.rect(12,6,4,3,DP.gold); },
gameHomer(){ bgCrowd(); figure(12,11,'swing'); bat(20,16,1);
  ball(54,5,1); trail(54,5,4,DP.gold); sparks(54,5,DP.gold,7); crowdWave(); },
momentWin(){ bgCrowd(); figure(26,10,'swing'); bat(34,15,1); ball(50,10,1);
  sparks(50,10,DP.gold,6); D.rect(0,0,DOT_W,2,DP.gold); },
momentLose(){ bgCrowd(); figure(26,12,'down'); D.rect(0,0,DOT_W,2,DP.red);
  sweat(24,12); },

/* ── 시즌 ── */
seasonStart(){ bgField(); D.rect(8,4,48,8,DP.uni); D.rect(9,5,46,6,DP.dark);
  figure(28,16,'stand'); star(14,8);star(50,8); },
seasonEnd(){ bgField(1); figure(28,12,'stand'); note(48,14);
  D.rect(0,0,DOT_W,14,DP.night); star(10,5,DP.silver); },
playoffIn(){ bgCrowd(); crowdWave(); figure(28,12,'cheer'); star(14,6);star(50,6);
  D.rect(20,26,24,2,DP.gold); },
playoffOut(){ bgCrowd(); D.rect(0,0,DOT_W,12,DP.night); rain(); figure(28,12,'down'); },
ksIn(){ bgCrowd(); crowdWave(); figure(22,11,'cheer'); figure(36,11,'cheer',DP.uni2);
  D.rect(16,2,32,4,DP.gold); D.rect(17,3,30,2,DP.gold2); },
ksWin(){ bgCrowd(); crowdWave(); trophy(28,4); figure(14,14,'cheer');figure(46,14,'cheer',DP.uni2);
  sparks(31,8,DP.gold,10); star(6,6);star(56,6); },
ksLose(){ bgCrowd(); figure(28,13,'down'); trophy(48,6,DP.silver);
  D.rect(0,0,DOT_W,12,DP.night); },
awardMvp(){ bgRoom(1); trophy(28,5); figure(12,14,'cheer'); sparks(31,9,DP.gold,10);
  D.rect(20,26,24,2,DP.gold); },
awardRookie(){ bgRoom(1); medal(29,5); figure(14,14,'stand'); star(48,8); sparks(32,12,DP.green,6); },
awardGlove(){ bgRoom(1); glove(28,10); D.rect(27,9,6,6,DP.gold);
  figure(12,13,'stand'); sparks(30,12,DP.gold,7); },
awardTitle(){ bgRoom(1); medal(20,6,DP.gold); medal(38,6,DP.gold);
  figure(28,16,'cheer'); D.rect(14,27,36,2,DP.gold); },

/* ── 상태 ── */
injury(){ bgRoom(); figure(26,12,'down'); bandage(24,12); D.px(22,10,DP.red);D.px(36,11,DP.red); },
rehab(){ bgIndoor(); figure(26,11,'stand'); bandage(24,16); arrowUp(46,14,DP.green); },
slump(){ bgRoom(); rain(); figure(28,11,'down'); sweat(25,13); },
callUp(){ bgField(); figure(20,10,'stand'); D.rect(40,8,8,12,DP.uni);
  D.rect(41,9,6,7,DP.blue); D.px(44,18,DP.dark); arrowUp(54,12,DP.green); sparks(44,10,DP.gold,5); },
demote(){ bgField(); figure(28,11,'stand',DP.uni2); arrowDown(50,10); D.rect(0,0,DOT_W,14,DP.night); },
retire(){ bgCrowd(); figure(28,12,'stand'); bat(24,26,0); glove(40,24);
  D.rect(0,0,DOT_W,10,DP.night); star(8,4,DP.silver);star(54,4,DP.silver); },
news(){ bgRoom(); note(16,8); note(30,8); note(44,8); },
money(){ bgRoom(1); D.rect(20,12,24,10,DP.green); D.rect(21,13,22,8,'#2f6b46');
  D.circ(32,17,3,DP.gold); sparks(32,17,DP.gold,6); }
};

/* ── 상태 반응형 캐릭터 (요구 12) ───────────────────────────────
   포지션 × 컨디션 × 상태(정상/부상/슬럼프)에 따라 자세와 표정이 바뀐다. */
function dotChar(p){
  bgField(p&&p.status==='부상');
  D.s=2; D.ox=0; D.oy=8;           // 2배(16→32px)로 키우고 48 높이 캔버스 중앙에 세운다
  const pose = !p ? 'stand'
    : p.status==='부상' ? 'down'
    : (p.slump&&p.slump.active) ? 'down'
    : p.cond>=4 ? 'cheer'
    : p.cond<=1 ? 'stand'
    : p.pos==='pitcher' ? 'pitch'
    : p.pos==='catcher' ? 'crouch' : 'swing';
  const teamCol=p?(TEAM(p.team).color||DP.cap):DP.cap;
  figure(12,0,pose,DP.uni,teamCol);
  if(p){
    if(p.pos==='batter'&&pose==='swing')bat(21,5,1);
    if(p.pos==='pitcher')ball(24,4,1);
    if(p.status==='부상')bandage(10,5);
    if(p.cond>=4)sparks(16,1,DP.gold,5);
    if(p.cond<=1)sweat(9,2);
  }
  D.s=1;D.ox=0;D.oy=0;
  if(p&&p.slump&&p.slump.active)rain();
}

/* ── 렌더 ────────────────────────────────────────────────────── */
const _dotCache={};
function dotURL(id,p){
  const key=(id==='char')
    ? 'char:'+(p?`${p.pos}|${p.cond}|${p.status}|${p.slump&&p.slump.active?1:0}|${p.team}`:'-')
    : id;
  if(_dotCache[key])return _dotCache[key];
  const {c,g}=_mk(id==='char'?CHAR_H:DOT_H); D.g=g;
  try{
    if(id==='char')dotChar(p);
    else if(DOT[id])DOT[id]();
    else { bgRoom(); note(28,9); }
  }catch(e){ bgRoom(); }
  const url=c.toDataURL('image/png');
  /* 캐릭터 조합은 포지션3 × 컨디션5 × 상태3 × 슬럼프2 = 90/팀.
     상한이 낮으면 매 화면 PNG 인코딩이 다시 돌아 눈에 띄게 느려진다. */
  if(Object.keys(_dotCache).length<400)_dotCache[key]=url;
  return url;
}
/* 씬에 넣는 HTML — 폭은 컨테이너에 맞추고 높이는 비율 유지 */
function dotImg(id,p,cls){
  if(typeof document==='undefined')return '';
  return `<img class="dot ${cls||''}" src="${dotURL(id,p)}" alt="" aria-hidden="true"
    width="${DOT_W}" height="${id==='char'?CHAR_H:DOT_H}" draggable="false">`;
}

/* 상황 → 스프라이트 id 매핑. 씬에서 dot:'...' 을 직접 주지 않아도
   제목/맥락으로 적당한 그림을 고른다. */
function dotFor(kind,ctx){
  ctx=ctx||{};
  switch(kind){
    case 'train':      return ctx.ok===false?'trainFail':ctx.ok?'trainSuccess':'trainSolo';
    case 'teamTrain':  return 'trainTeam';
    case 'weight':     return 'trainWeight';
    case 'skill':      return 'trainSkill';
    case 'games':      return ctx.hr?'gameHomer':ctx.shutout?'gameShutout':'gameStart';
    case 'moment':     return ctx.ok?'momentWin':'momentLose';
    case 'event':      return ctx.tone==='good'?'evGood':ctx.tone==='bad'?'evBad':'evStory';
    default:           return DOT[kind]?kind:'evStory';
  }
}
