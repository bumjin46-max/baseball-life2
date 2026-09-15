/* 2-data-stats.js — 데이터: 능력치 — 구단 · 능력치 정의 · 구단 문화 · 특성 70종 · 훈련
   원본 index.html 섹션: [2] [3] [18] [4] [5]
   ※ 클래식 스크립트로 순서대로 로드됩니다. index.html의 <script> 순서를 바꾸지 마세요. */
"use strict";

/* ==========================================================================
   [2] DATA — 구단
   ========================================================================== */
const TEAMS=[
  {id:'seoul', name:'서울 블루스',   short:'서울', money:5, dev:3, pdev:3, fan:5, star:5, power:4, tag:'자금력과 팬덤이 리그 최고. 대신 자리 경쟁이 치열하다.'},
  {id:'busan', name:'부산 웨일스',   short:'부산', money:3, dev:3, pdev:2, fan:5, star:3, power:3, tag:'열성 팬덤. 성적이 나쁘면 여론도 험하다.'},
  {id:'incheon',name:'인천 마리너스', short:'인천', money:4, dev:2, pdev:4, fan:3, star:4, power:4, tag:'투수 육성의 명가.'},
  {id:'daejeon',name:'대전 파이오니어스',short:'대전',money:2,dev:5,pdev:3,fan:3,star:2,power:2, tag:'유망주에게 기회를 아끼지 않는다.'},
  {id:'gwangju',name:'광주 타이탄스', short:'광주', money:4, dev:4, pdev:3, fan:4, star:4, power:4, tag:'전통의 강호. 우승 경험이 많다.'},
  {id:'daegu', name:'대구 레이더스', short:'대구', money:4, dev:3, pdev:3, fan:4, star:5, power:4, tag:'스타 영입에 적극적이다.'},
  {id:'suwon', name:'수원 스톰',     short:'수원', money:3, dev:4, pdev:4, fan:3, star:3, power:3, tag:'데이터 야구를 앞세운 신흥 구단.'},
  {id:'changwon',name:'창원 샤크스', short:'창원', money:2, dev:4, pdev:2, fan:3, star:2, power:2, tag:'가난하지만 끈끈하다.'},
  {id:'goyang',name:'고양 크라운',   short:'고양', money:3, dev:5, pdev:3, fan:2, star:2, power:3, tag:'키워서 파는 구단. 육성은 최고다.'},
  {id:'seongnam',name:'성남 레이븐스',short:'성남',money:2,dev:2,pdev:2,fan:2,star:2,power:2, tag:'만년 하위권. 하지만 기회는 많다.'}
];
const TEAM=id=>TEAMS.find(t=>t.id===id);

const SURNAME=['김','이','박','최','정','강','조','윤','장','임','한','오','서','신','권','황','안','송','류','전','홍','고','문','손','배','백','허','유','남','심'];
const GIVEN=['도윤','태준','재현','성호','준혁','민석','현우','우진','준호','지호','시우','건우','승현','예준','주원','지훈','현서','동하','태양','상우','기윤','우성','해성','진우','세진','찬영','민찬','영호','도훈','윤재'];
const mkName=()=>R.pick(SURNAME)+R.pick(GIVEN.filter(g=>/^[가-힣]{2}$/.test(g)));

/* ==========================================================================
   [3] DATA — 능력치 정의
   ========================================================================== */
const POS={
  batter:{
    label:'타자',
    desc:'매 경기 타석에 선다. 기록이 눈에 보이고, 팬도 가장 빨리 알아본다.',
    keys:['contact','power','eye','speed','run','defense','throw','mental','stamina'],
    base:{contact:52,power:46,eye:44,speed:50,run:46,defense:46,throw:46,mental:46,stamina:50}
  },
  pitcher:{
    label:'투수',
    desc:'닷새에 한 번 마운드에 오른다. 한 경기가 시즌 전체를 바꾼다.',
    keys:['velo','stuff','control','breaking','stamina','mental','crisis','recovery'],
    base:{velo:54,stuff:48,control:44,breaking:44,stamina:48,mental:46,crisis:42,recovery:48}
  },
  catcher:{
    label:'포수',
    desc:'기록에 남지 않는 일을 가장 많이 한다. 대신 팀이 가장 먼저 알아본다.',
    keys:['contact','power','eye','defense','throw','catching','blocking','lead','mental','stamina'],
    base:{contact:46,power:42,eye:44,defense:50,throw:50,catching:48,blocking:46,lead:44,mental:50,stamina:50}
  }
};
const SLABEL={contact:'컨택',power:'파워',eye:'선구안',speed:'주력',run:'주루',defense:'수비',throw:'송구',
  mental:'멘탈',stamina:'체력',velo:'구속',stuff:'구위',control:'제구',breaking:'변화구',crisis:'위기관리',
  recovery:'회복력',catching:'포구',blocking:'블로킹',lead:'리드'};

/* ==========================================================================
   [18] DATA — 구단 성향 / 문화
   ========================================================================== */
const CULTURE={
  seoul:{tag:'스타 중심',fa:5,trade:3,youth:2,vet:3,style:'공격',desc:'이름값을 산다. 성적이 안 나오면 다음 스타를 산다.'},
  busan:{tag:'팬덤 압박',fa:3,trade:4,youth:3,vet:3,style:'공격',desc:'관중석이 곧 프런트다. 부진은 오래 용서받지 못한다.'},
  incheon:{tag:'투수 왕국',fa:3,trade:3,youth:4,vet:2,style:'투수',desc:'마운드에 먼저 투자한다.'},
  daejeon:{tag:'육성 중심',fa:2,trade:3,youth:5,vet:1,style:'육성',desc:'성적보다 성장을 먼저 본다.'},
  gwangju:{tag:'승리 우선',fa:4,trade:4,youth:2,vet:4,style:'공격',desc:'우승 말고 다른 목표는 세우지 않는다.'},
  daegu:{tag:'베테랑 존중',fa:4,trade:2,youth:2,vet:5,style:'수비',desc:'고참의 말에 무게가 실린다.'},
  suwon:{tag:'데이터 야구',fa:3,trade:5,youth:4,vet:2,style:'수비',desc:'감정보다 숫자를 믿는다.'},
  changwon:{tag:'프랜차이즈 중시',fa:2,trade:2,youth:4,vet:3,style:'육성',desc:'오래 남는 선수를 귀하게 여긴다.'},
  goyang:{tag:'육성 후 이적',fa:1,trade:5,youth:5,vet:1,style:'육성',desc:'키워서 보낸다. 그게 이 구단의 방식이다.'},
  seongnam:{tag:'리빌딩',fa:2,trade:4,youth:4,vet:2,style:'수비',desc:'기회는 많고 우승은 멀다.'}
};
const CUL=id=>CULTURE[id]||CULTURE.seoul;

/* ==========================================================================
   [4] DATA — 특성
   eff 키: train(훈련효과) staminaCost injury clutch(중요상황) big(포스트시즌)
           contact power eye speed defense throw era k9 ip ctrl fan lead
   prob(p,s): 시즌 종료 시 획득 확률(0~1). s = 해당 시즌 기록
   ========================================================================== */
const T=(id,grade,pos,desc,eff,extra={})=>({id,grade,pos,desc,eff,...extra});
const TRAITS=[
/* ── 공통 ── */
T('노력파','일반','all','훈련 효과 +8%',{train:.08},{prob:(p)=>p.tend.diligence>=74?.3:0, evolve:{to:'연습벌레',cond:p=>p.tend.diligence>=82&&p.trainCount>=16}}),
T('연습벌레','희귀','all','훈련 효과 +16%, 체력 소모 증가',{train:.16,staminaCost:.2}),
T('천재','영웅','all','잠재력 활용 효율 +25%, 일반 훈련 효과는 낮다',{potential:.25,train:-.05},{prob:p=>p.pot>=88&&p.age<=22?.3:0, evolve:{to:'야구천재',cond:p=>p.pot>=92&&ovr(p)>=85}}),
T('야구천재','전설','all','성장 한계를 스스로 밀어낸다',{potential:.4,train:.05}),
T('강심장','희귀','all','중요 경기 능력 +6',{clutch:6,big:.06},{prob:(p,s)=>s.bigHits>=3?.45:0, evolve:{to:'승부사',cond:p=>p.tend.competitive>=80}}),
T('승부사','영웅','all','중요 상황 능력 +10',{clutch:10,big:.1},{evolve:{to:'큰경기의 사나이',cond:p=>p.awards.ksMvp>=1||p.post.bigHits>=8}}),
T('큰경기의 사나이','전설','all','포스트시즌에서 전혀 다른 선수가 된다',{clutch:14,big:.2}),
T('새가슴','일반','all','중요 상황 능력 -8',{clutch:-8,big:-.12},{neg:1,prob:(p,s)=>p.post.fail>=3&&p.post.fail>p.post.bigHits*2?.12:0}),
T('멘탈갑','희귀','all','부진에도 흔들리지 않는다. 컨디션 하락 완화',{condFloor:1},{prob:p=>p.st.mental>=86?.25:0}),
T('유리멘탈','일반','all','부진이 길어진다',{condCeil:-1},{neg:1,prob:p=>p.st.mental<=42?.3:0}),
T('철인','희귀','all','체력 소모 -20%, 부상 확률 -35%',{staminaCost:-.2,injury:-.35},{prob:(p,s)=>s.g>=138&&p.injuries.length===0?.5:0, evolve:{to:'강철몸',cond:p=>p.career.seasons.filter(x=>x.games>=135).length>=5}}),
T('강철몸','전설','all','그는 좀처럼 그라운드를 비우지 않는다',{staminaCost:-.3,injury:-.6}),
T('유리몸','희귀','all','부상 확률 +55%',{injury:.55},{neg:1,evolve:{to:'재활왕',cond:p=>p.injuries.length>=3&&p.tend.patience>=75}}),
T('재활왕','영웅','all','부상에서 남들보다 빨리 돌아온다',{injury:.15,rehab:.5}),
T('자기관리','희귀','all','노쇠화 속도 -30%',{aging:-.3},{prob:p=>p.tend.diligence>=85&&p.age>=28?.12:0}),
T('게으름','일반','all','훈련 효과 -15%, 휴식 효과 +40%',{train:-.15,rest:.4},{neg:1,prob:p=>p.tend.diligence<=35?.35:0}),
T('팀플레이어','일반','all','팀 관계 상승, 리더십 성장',{teamB:1},{prob:p=>p.tend.loyalty>=70&&p.tend.selfish<=40?.4:0, evolve:{to:'주장감',cond:p=>p.tend.leadership>=78&&p.age>=27}}),
T('독고다이','희귀','all','개인 기록에 강하지만 팀 관계가 어렵다',{teamB:-2,clutch:3},{neg:1,prob:p=>p.tend.selfish>=72?.4:0}),
T('주장감','영웅','all','팀 전체의 성적을 끌어올린다',{teamB:3,lead:6},{prob:p=>p.tend.leadership>=80&&p.age>=27?.45:0, evolve:{to:'카리스마',cond:p=>p.flags.includes('captain')&&p.awards.champ>=1}}),
T('카리스마','전설','all','라커룸의 중심',{teamB:5,lead:10}),
T('인기인','일반','all','팬 평가 상승',{fan:1},{prob:p=>p.tend.star>=70?.15:0, evolve:{to:'슈퍼스타',cond:p=>p.tend.star>=85&&p.awards.allstar>=4}}),
T('슈퍼스타','영웅','all','경기장 밖에서도 시선이 따라다닌다',{fan:3,clutch:3},{evolve:{to:'국민스타',cond:p=>p.nat.caps>=2&&p.awards.mvp>=1}}),
T('국민스타','전설','all','야구를 모르는 사람도 이름을 안다',{fan:5,clutch:5},{evolve:{to:'국민영웅',cond:p=>p.nat.gold>=1&&p.nat.bigMoment>=1}}),
T('국민영웅','신화','all','그의 한 타석이 전국을 멈춰 세웠다',{fan:8,clutch:8,big:.1}),
T('악동','희귀','all','화제를 몰고 다닌다. 팀 관계에는 독',{teamB:-3,fan:2},{neg:1}),
T('모범생','일반','all','구단과 감독의 신뢰',{teamB:2,trust:5}),
T('늦게 피는 꽃','희귀','all','29세 이후에도 성장한다',{lateGrow:.5},{prob:p=>p.age>=26&&ovr(p)<66&&p.pot-ovr(p)>=14?.35:0, evolve:{to:'대기만성',cond:p=>p.age>=30&&ovr(p)>=80}}),
T('대기만성','영웅','all','전성기가 뒤늦게, 그러나 길게 온다',{lateGrow:1,aging:-.4}),
/* ── 타자 ── */
T('교타자','일반','batter','컨택 +4',{contact:4},{prob:(p,s)=>s.avg>=.300?.5:0, evolve:{to:'안타왕',cond:p=>p.awards.hitKing>=1}}),
T('안타왕','희귀','batter','컨택 +7',{contact:7},{evolve:{to:'안타제조기',cond:p=>p.tot.h>=1800}}),
T('안타제조기','전설','batter','컨택 +11, 삼진 감소',{contact:11,so:-.15}),
T('거포','희귀','batter','파워 +7, 삼진 소폭 증가',{power:7,so:.08},{prob:(p,s)=>s.hr>=28?.5:0, evolve:{to:'홈런왕',cond:p=>p.awards.hrKing>=1}}),
T('홈런왕','영웅','batter','파워 +12, 삼진 증가',{power:12,so:.12}),
T('초구킬러','일반','batter','초구 적극성, 컨택 +3',{contact:3},{prob:p=>p.tend.aggression>=70?.35:0, evolve:{to:'초구폭격기',cond:p=>p.tot.hr>=200}}),
T('초구폭격기','영웅','batter','초구 장타 +8',{power:8,contact:2}),
T('선구안','일반','batter','볼넷 +20%',{bb:.2},{prob:p=>p.st.eye>=78?.45:0, evolve:{to:'출루머신',cond:p=>p.st.eye>=88}}),
T('출루머신','희귀','batter','볼넷 +45%, 삼진 -10%',{bb:.45,so:-.1}),
T('클러치 히터','희귀','batter','득점권 능력 +10',{clutch:10},{prob:(p,s)=>s.rbi>=85&&s.avg>=.285?.4:0, evolve:{to:'해결사',cond:p=>p.tot.rbi>=900}}),
T('해결사','영웅','batter','득점권 +16',{clutch:16}),
T('끝내기 본능','영웅','batter','9회 이후 능력 대폭 상승',{clutch:12,walkoff:1}),
T('찬스에 약함','일반','batter','득점권 능력 -9',{clutch:-9},{neg:1}),
T('도루왕','희귀','batter','주루 +8',{run:8,speed:3},{prob:(p,s)=>s.sb>=35?.5:0, evolve:{to:'대도',cond:p=>p.awards.sbKing>=2}}),
T('대도','영웅','batter','주루 +14, 도루 성공률 상승',{run:14,speed:4}),
T('발 빠른 선수','일반','batter','주력 +4',{speed:4},{prob:p=>p.st.speed>=80?.4:0}),
T('욕심쟁이','일반','batter','개인 기록 +, 팀 관계 -',{power:3,teamB:-2},{neg:1}),
/* ── 수비 ── */
T('수비형 선수','일반','all','수비 +5',{defense:5},{prob:p=>p.st.defense>=76&&p.pos!=='pitcher'?.4:0, evolve:{to:'철벽수비',cond:p=>p.awards.gg>=2}}),
T('철벽수비','희귀','all','수비 +9, 실책 감소',{defense:9},{evolve:{to:'명품수비',cond:p=>p.awards.gg>=4}}),
T('명품수비','영웅','all','수비로만 승리를 만든다',{defense:14,teamB:1}),
T('강견','일반','all','송구 +6',{throw:6},{prob:p=>p.st.throw>=80?.4:0, evolve:{to:'레이저암',cond:p=>p.st.throw>=90}}),
T('레이저암','희귀','all','송구 +11',{throw:11}),
T('허슬플레이','일반','all','팬 평가 +, 부상 위험 소폭 증가',{fan:2,injury:.12},{prob:p=>p.tend.competitive>=80&&p.fanRating>=60?.12:0}),
/* ── 포수 ── */
T('명포수','희귀','catcher','리드 +8, 팀 투수진 강화',{lead:8,teamB:2},{prob:p=>p.st.lead>=78?.45:0, evolve:{to:'안방마님',cond:p=>p.career.seasons.length>=8&&p.st.lead>=88}}),
T('투수조련사','희귀','catcher','팀 평균자책점 개선',{teamB:3,lead:5},{prob:p=>p.st.lead>=74&&p.tend.leadership>=65?.4:0}),
T('블로킹장인','일반','catcher','블로킹 +8',{blocking:8},{prob:p=>p.st.blocking>=78?.45:0}),
T('도루저격수','희귀','catcher','송구 +10, 도루 저지율 상승',{throw:10},{prob:p=>p.st.throw>=82?.45:0}),
T('안방마님','전설','catcher','투수들이 그를 믿고 던진다',{lead:14,teamB:5,defense:6}),
/* ── 투수 ── */
T('에이스','희귀','pitcher','구위 +6, 승운 상승',{stuff:6,win:.15},{prob:(p,s)=>s.w>=14&&s.era<=3.3?.5:0, evolve:{to:'절대에이스',cond:p=>p.awards.winKing>=2||p.awards.mvp>=1}}),
T('절대에이스','전설','pitcher','구위 +12, 등판하는 날은 진다는 생각을 하지 않는다',{stuff:12,win:.3,clutch:8}),
T('탈삼진왕','희귀','pitcher','탈삼진 +20%',{k9:.2},{prob:(p,s)=>s.k>=170?.5:0, evolve:{to:'닥터K',cond:p=>p.awards.soKing>=2}}),
T('닥터K','영웅','pitcher','탈삼진 +40%',{k9:.4,stuff:4}),
T('강속구','일반','pitcher','구속 +4, 제구 불안',{velo:4,ctrl:-3},{prob:p=>p.st.velo>=84?.5:0, evolve:{to:'파이어볼러',cond:p=>p.st.velo>=92}}),
T('파이어볼러','희귀','pitcher','구속 +9',{velo:9,k9:.15}),
T('제구왕','일반','pitcher','제구 +6, 볼넷 감소',{ctrl:6,bb:-.2},{prob:p=>p.st.control>=82?.5:0, evolve:{to:'칼제구',cond:p=>p.st.control>=91}}),
T('칼제구','희귀','pitcher','제구 +11, 볼넷 대폭 감소',{ctrl:11,bb:-.4}),
T('이닝이터','일반','pitcher','소화 이닝 +12%',{ip:.12},{prob:(p,s)=>s.ip>=170?.5:0, evolve:{to:'철완',cond:p=>p.career.seasons.filter(x=>x.ip>=170).length>=4}}),
T('철완','영웅','pitcher','소화 이닝 +25%, 체력 소모 감소',{ip:.25,staminaCost:-.15}),
T('위기관리의 달인','희귀','pitcher','주자 있을 때 실점 억제',{crisis:10,era:-.25},{prob:p=>p.st.crisis>=82?.4:0})
];
const TR=id=>TRAITS.find(t=>t.id===id);

/* ==========================================================================
   [5] DATA — 훈련
   ========================================================================== */
const TRAININGS={
  batter:[
    {id:'bat', name:'타격 훈련', sub:'컨택 ↑↑ 파워 ↑ / 체력 ↓', up:{contact:3.2,power:1.2}, fatigue:14},
    {id:'pow', name:'장타 훈련', sub:'파워 ↑↑↑ / 컨택 ↓ 삼진 ↑', up:{power:4.2,contact:-0.8}, fatigue:16, tend:{aggression:2}},
    {id:'eye', name:'선구안 훈련', sub:'선구안 ↑↑ 멘탈 ↑', up:{eye:3.4,mental:0.8}, fatigue:9, tend:{patience:2}},
    {id:'def', name:'수비 훈련', sub:'수비 ↑↑ 송구 ↑', up:{defense:3.2,throw:2.0}, fatigue:12},
    {id:'run', name:'주루 훈련', sub:'주력·주루 ↑↑ / 부상 위험 ↑', up:{speed:2.6,run:3.0}, fatigue:13, risk:.5},
    {id:'wt',  name:'웨이트', sub:'파워·체력 ↑ / 주력 성장 둔화', up:{power:2.6,stamina:2.2,speed:-0.5}, fatigue:15},
    {id:'rest',name:'휴식', sub:'체력 회복 / 성장 없음', up:{}, fatigue:-34, rest:1}
  ],
  pitcher:[
    {id:'velo',name:'구속 훈련', sub:'구속 ↑↑ / 제구 ↓ 부상 위험 ↑', up:{velo:3.4,control:-0.8}, fatigue:17, risk:.8, tend:{aggression:2}},
    {id:'ctrl',name:'제구 훈련', sub:'제구 ↑↑↑', up:{control:3.8}, fatigue:10, tend:{patience:2}},
    {id:'brk', name:'변화구 연마', sub:'변화구 ↑↑ 구위 ↑', up:{breaking:3.4,stuff:1.2}, fatigue:11},
    {id:'stu', name:'구위 훈련', sub:'구위 ↑↑ / 체력 ↓', up:{stuff:3.2,velo:0.8}, fatigue:15},
    {id:'sta', name:'지구력 훈련', sub:'체력·회복력 ↑↑', up:{stamina:3.0,recovery:2.2}, fatigue:13},
    {id:'men', name:'실전 시뮬레이션', sub:'멘탈·위기관리 ↑', up:{mental:2.4,crisis:3.0}, fatigue:9},
    {id:'rest',name:'휴식', sub:'체력 회복 / 성장 없음', up:{}, fatigue:-34, rest:1}
  ],
  catcher:[
    {id:'bat', name:'타격 훈련', sub:'컨택 ↑↑ 파워 ↑ / 체력 ↓', up:{contact:3.0,power:1.2}, fatigue:14},
    {id:'blk', name:'블로킹 훈련', sub:'블로킹·포구 ↑↑ / 체력 ↓', up:{blocking:3.4,catching:2.2}, fatigue:16},
    {id:'thr', name:'송구 훈련', sub:'송구 ↑↑ 수비 ↑', up:{throw:3.4,defense:1.4}, fatigue:12},
    {id:'lead',name:'투수진 미팅', sub:'리드 ↑↑ 멘탈 ↑ / 팀 관계 ↑', up:{lead:3.4,mental:1.2}, fatigue:7, tend:{leadership:3,loyalty:2}},
    {id:'wt',  name:'웨이트', sub:'파워·체력 ↑', up:{power:2.6,stamina:2.4}, fatigue:15},
    {id:'eye', name:'선구안 훈련', sub:'선구안 ↑↑', up:{eye:3.2}, fatigue:9, tend:{patience:2}},
    {id:'rest',name:'휴식', sub:'체력 회복 / 성장 없음', up:{}, fatigue:-34, rest:1}
  ]
};

/* ==========================================================================
   [35] DATA v3.0 — 포지션 어휘
   같은 이벤트라도 투수에게는 "네 투구폼", 타자에게는 "네 스윙"으로 나가야 한다.
   하드코딩된 야구 용어를 전부 이 테이블로 돌린다.
   ========================================================================== */
const POSV={
  batter:{
    craft:'스윙',        feel:'타격감',      place:'타석',       gear:'배트',
    coach:'타격코치',    goal:'홈런왕',      act:'배트를 돌리고', act2:'배트를 든다',
    job:'타자',          drill:'티배팅',     bodypart:'손목',
    key:'contact',       key2:'power',       slumpLine:'공이 작아 보인다'
  },
  pitcher:{
    craft:'투구폼',      feel:'공 끝',       place:'마운드',     gear:'글러브',
    coach:'투수코치',    goal:'다승왕',      act:'섀도 피칭을 하고', act2:'글러브를 낀다',
    job:'투수',          drill:'불펜 피칭',  bodypart:'어깨',
    key:'control',       key2:'stuff',       slumpLine:'공이 손에서 늦게 빠진다'
  },
  catcher:{
    craft:'블로킹 자세', feel:'포구감',      place:'홈플레이트', gear:'미트',
    coach:'배터리코치',  goal:'골든글러브',  act:'미트를 손질하고', act2:'미트를 챙긴다',
    job:'포수',          drill:'블로킹 드릴',bodypart:'무릎',
    key:'catching',      key2:'lead',        slumpLine:'사인이 머리에서 엉킨다'
  }
};
const W=p=>POSV[p.pos]||POSV.batter;
/* 선배/코치 같은 NPC도 포지션을 갖는다 — "타격코치가 된 투수 선배"를 막는다 */
const POS_LABEL={batter:'타자',pitcher:'투수',catcher:'포수'};
