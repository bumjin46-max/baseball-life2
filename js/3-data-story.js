/* 3-data-story.js — 데이터: 스토리 — 일반 이벤트 · 결정적 순간 · 엔딩 · 구단 전용 · 특성 조합 · 확률 기반
   원본 index.html 섹션: [6] [7] [8] [23] [24] [34]
   ※ 클래식 스크립트로 순서대로 로드됩니다. index.html의 <script> 순서를 바꾸지 마세요. */
"use strict";

/* ==========================================================================
   [6] DATA — 스토리 이벤트
   when(p) : 발생 조건 / once : 1회 한정 / w : 가중치
   choices[].run(p) : 결과 로그 배열 반환
   ========================================================================== */
const EV=(o)=>o;
const EVENTS=[
EV({id:'E_ROOKIE_CAMP', once:1, w:9, when:p=>p.year===2026,
 title:'첫 캠프의 아침',
 text:p=>`새벽 6시. 아무도 없을 거라 생각하고 나온 실내 훈련장에 이미 불이 켜져 있다.\n10년 차 베테랑 ${p.vet}이 혼자 배트를 돌리고 있었다.\n\n"신인이네. 몇 시에 자?"`,
 choices:[
  {t:'"어제도 새벽까지 영상 봤습니다."', s:'성실성 ↑ 체력 ↓', run:p=>{tend(p,{diligence:8});p.fatigue+=8;return['<em>'+p.vet+'</em>이 피식 웃었다. "그래. 그거 3년만 해봐."','성실성이 올랐다.'];}},
  {t:'"잘 잤습니다. 몸이 재산이니까요."', s:'체력 ↑ 자기관리 ↑', run:p=>{p.fatigue-=12;tend(p,{patience:6});return['"영리하네. 오래 할 놈이야."','컨디션이 좋아졌다.'];}},
  {t:'말없이 옆에서 배트를 든다.', s:'인간관계 ↑ 성실성 ↑', run:p=>{tend(p,{diligence:5,social:8});rel(p,'vet',12);return['두 사람은 한 시간 동안 아무 말도 하지 않았다.',p.vet+'과의 관계가 좋아졌다.'];}}
 ]}),
EV({id:'E_MANAGER_ORDER', w:7, when:p=>p.year>=2026,
 title:'감독의 지시',
 text:p=>`감독이 부른다.\n\n"네 스윙, 지금 폼으로는 1군에서 안 통해. 바꿔라."\n\n지금 폼은 고교 시절부터 6년간 만들어온 것이다.`,
 choices:[
  {t:'지시대로 폼을 바꾼다.', s:'감독 신뢰 ↑ / 일시적 부진', run:p=>{rel(p,'manager',15);p.slump=1;return['감독의 신뢰가 크게 올랐다.','당분간 타격감이 흔들릴 것이다.'];}},
  {t:'"제 폼으로 결과를 내겠습니다."', s:'감독 갈등 ↑ 승부욕 ↑', run:p=>{rel(p,'manager',-18);tend(p,{competitive:8,selfish:4});flag(p,'managerConflict');return['감독은 아무 말 없이 돌아섰다.','<em>감독 갈등</em> 플래그가 생겼다.'];}},
  {t:'"두 가지를 다 준비해 보겠습니다."', s:'훈련량 ↑ 체력 ↓', run:p=>{p.fatigue+=18;tend(p,{diligence:6});rel(p,'manager',5);grow(p,{mental:1.5});return['훈련량이 두 배가 되었다.','체력이 크게 소모됐다.'];}}
 ]}),
EV({id:'E_SENIOR_SLUMP', once:1, w:6, when:p=>p.year>=2027,
 title:'부진한 선배',
 text:p=>`${p.vet}이 두 달째 타격감을 찾지 못하고 있다. 2군행 이야기가 나온다.\n라커룸에서 그가 혼자 장비를 정리하고 있다.`,
 choices:[
  {t:'같이 남아 야간 훈련을 한다.', s:'인간관계 ↑↑ 체력 ↓', run:p=>{rel(p,'vet',25);tend(p,{social:8,leadership:6});p.fatigue+=14;flag(p,'helpedVeteran');return['그는 아무 말도 하지 않았지만, 오래 기억할 것이다.'];}},
  {t:'내 훈련에 집중한다.', s:'개인 능력 ↑ 이기심 ↑', run:p=>{grow(p,p.pos==='pitcher'?{control:2}:{contact:2});tend(p,{selfish:7});return['내 할 일을 했다.'];}},
  {t:'"선배 자리, 제가 채우겠습니다."', s:'승부욕 ↑↑ 관계 ↓↓', run:p=>{tend(p,{competitive:12,selfish:10,social:-10});rel(p,'vet',-25);flag(p,'troubleMaker');return['말이 라커룸에 퍼졌다.'];}}
 ]}),
EV({id:'E_MEDIA', w:5, when:p=>p.year>=2027&&p.fame>=25,
 title:'인터뷰 요청',
 text:p=>`방송사에서 단독 인터뷰를 요청해 왔다.\n"솔직하게 말해주셔도 됩니다. 요즘 팀 분위기 어떻습니까?"`,
 choices:[
  {t:'팀에 대해 좋은 말만 한다.', s:'팀 관계 ↑ 화제성 ↓', run:p=>{tend(p,{loyalty:8});rel(p,'manager',6);return['무난한 기사가 나갔다.'];}},
  {t:'솔직하게 문제를 말한다.', s:'화제성 ↑↑ 팀 관계 ↓↓', run:p=>{tend(p,{star:12,selfish:6});rel(p,'manager',-14);p.fame+=8;flag(p,'troubleMaker');return['기사 제목에 그의 이름이 먼저 나왔다.'];}},
  {t:'자신의 목표를 크게 말한다.', s:'스타성 ↑ 부담 ↑', run:p=>{tend(p,{star:10,competitive:6});p.fame+=6;p.pressure=(p.pressure||0)+1;return['"올해 홈런왕 하겠습니다."','팬들이 그 말을 기억할 것이다.'];}}
 ]}),
EV({id:'E_RIVAL_FIRST', once:1, w:8, when:p=>p.year>=2027,
 title:'라이벌이 먼저 갔다',
 text:p=>`${p.rival.name}이 당신보다 먼저 1군에 자리를 잡았다.\n오늘 그의 인터뷰가 스포츠 뉴스 첫 꼭지였다.`,
 choices:[
  {t:'먼저 연락해 축하한다.', s:'라이벌 우정 ↑', run:p=>{p.rival.bond+=25;tend(p,{social:6});return['"고맙다. 너도 금방 올라올 거야."'];}},
  {t:'말없이 훈련장으로 간다.', s:'승부욕 ↑↑ 체력 ↓', run:p=>{tend(p,{competitive:12,diligence:6});p.fatigue+=12;p.rival.bond-=8;return['그날 밤 훈련장 불은 늦게 꺼졌다.'];}},
  {t:'신경 쓰지 않는다.', s:'멘탈 ↑', run:p=>{grow(p,{mental:2});return['남의 야구는 남의 야구다.'];}}
 ]}),
EV({id:'E_FAN_LETTER', w:4, when:p=>p.year>=2028,
 title:'편지 한 통',
 text:p=>`구단을 통해 편지가 왔다.\n"아버지가 병원에 계신데, 선수님 경기를 보는 날만 웃으십니다."`,
 choices:[
  {t:'병원을 직접 찾아간다.', s:'팬 평가 ↑↑ 체력 ↓', run:p=>{p.fanRating+=6;tend(p,{star:6,social:6});p.fatigue+=6;flag(p,'fanFavorite');return['기사도, 사진도 없었다. 그래도 알려졌다.'];}},
  {t:'사인 유니폼과 답장을 보낸다.', s:'팬 평가 ↑', run:p=>{p.fanRating+=3;return['정성껏 답장을 썼다.'];}},
  {t:'읽고 서랍에 넣어둔다.', s:'멘탈 ↑', run:p=>{grow(p,{mental:1.5});return['그 문장을 오래 기억했다.'];}}
 ]}),
EV({id:'E_COACH_RETURN', once:1, w:9, when:p=>p.year>=2031&&p.flags.includes('helpedVeteran'),
 title:'돌아온 사람',
 text:p=>`새 타격코치가 부임했다. ${p.vet}이었다.\n\n"그때 같이 남아줬던 거, 아직 기억한다."`,
 choices:[
  {t:'"이번엔 제가 배우겠습니다."', s:'능력치 대폭 성장', run:p=>{grow(p,p.pos==='pitcher'?{control:5,stuff:4}:{contact:5,power:3});rel(p,'vet',20);return['전담 코치가 붙은 것이나 다름없었다.','능력치가 크게 올랐다.'];}},
  {t:'"제 방식대로 하겠습니다."', s:'멘탈 ↑ 관계 ↓', run:p=>{grow(p,{mental:3});rel(p,'vet',-10);return['그는 고개를 끄덕였다. 실망한 눈이었다.'];}}
 ]}),
EV({id:'E_YOUNG', w:5, when:p=>p.age>=27,
 title:'후배가 찾아왔다',
 text:p=>`올해 입단한 신인이 조심스럽게 다가온다.\n"선배님… 저 지금 하나도 모르겠습니다."`,
 choices:[
  {t:'시간을 내서 하나하나 알려준다.', s:'리더십 ↑↑ / 개인 훈련 ↓', run:p=>{tend(p,{leadership:12,social:8});p.fatigue+=8;flag(p,'mentor');return['그를 따르는 후배가 생겼다.'];}},
  {t:'"직접 부딪혀봐. 그게 빨라."', s:'무변화', run:p=>{tend(p,{leadership:-3});return['틀린 말은 아니었다.'];}},
  {t:'감독에게 그를 추천한다.', s:'리더십 ↑ 감독 신뢰 ↑', run:p=>{tend(p,{leadership:7});rel(p,'manager',10);return['감독이 당신을 다시 봤다.'];}}
 ]}),
EV({id:'E_INJURY_TEMPT', w:5, when:p=>p.fatigue>=55,
 title:'몸이 보내는 신호',
 text:p=>`어깨가 무겁다. 트레이너는 2주 휴식을 권한다.\n하지만 팀은 순위 싸움 중이고, 다음 주는 라이벌 팀과의 3연전이다.`,
 choices:[
  {t:'참고 뛴다.', s:'팀 관계 ↑ / 부상 위험 ↑↑', run:p=>{rel(p,'manager',12);p.injRisk=(p.injRisk||0)+.25;tend(p,{competitive:6});flag(p,'playedHurt');return['이를 악물었다.'];}},
  {t:'휴식을 받아들인다.', s:'체력 회복 / 출장 감소', run:p=>{p.fatigue-=30;p.missGames=(p.missGames||0)+12;return['몸을 지키는 것도 실력이다.'];}},
  {t:'주사를 맞고 출장한다.', s:'단기 능력 유지 / 장기 위험', run:p=>{p.injRisk=(p.injRisk||0)+.45;p.fatigue+=10;return['통증은 사라졌다. 문제도 사라진 건 아니었다.'];}}
 ]}),
EV({id:'E_MONEY', w:4, when:p=>p.year>=2030&&p.fame>=40,
 title:'광고 제안',
 text:p=>`대형 광고 제안이 들어왔다. 촬영은 시즌 중 이틀.`,
 choices:[
  {t:'수락한다.', s:'스타성 ↑↑ 체력 ↓', run:p=>{tend(p,{star:14});p.fame+=10;p.fatigue+=12;p.fanRating+=2;return['그의 얼굴이 지하철역마다 붙었다.'];}},
  {t:'시즌이 끝난 뒤로 미룬다.', s:'집중력 유지', run:p=>{tend(p,{diligence:6});p.fatigue-=4;return['"야구부터 하겠습니다."'];}},
  {t:'거절한다.', s:'성실성 ↑ 스타성 ↓', run:p=>{tend(p,{diligence:8,star:-6});return['광고사는 다른 선수를 찾았다.'];}}
 ]}),
EV({id:'E_SLUMP_DEEP', w:6, when:p=>p.cond<=1,
 title:'끝나지 않는 부진',
 text:p=>`한 달째 답이 없다. 타석에, 마운드에 서는 것이 무섭다.\n오늘도 경기 후 혼자 남았다.`,
 choices:[
  {t:'영상을 밤새 돌려본다.', s:'멘탈 ↑ 체력 ↓', run:p=>{grow(p,{mental:2.5});p.fatigue+=14;p.cond=Math.min(4,p.cond+1);return['새벽 3시에 원인을 찾았다.'];}},
  {t:'며칠 야구를 잊는다.', s:'컨디션 ↑↑', run:p=>{p.fatigue-=26;p.cond=Math.min(4,p.cond+2);return['돌아온 날, 공이 다시 크게 보였다.'];}},
  {t:'선배에게 털어놓는다.', s:'인간관계 ↑ 멘탈 ↑', run:p=>{rel(p,'vet',12);grow(p,{mental:2});p.cond=Math.min(4,p.cond+1);tend(p,{social:6});return['"나도 그랬어. 다 그래."'];}}
 ]}),
EV({id:'E_CAPTAIN', once:1, w:10, when:p=>p.age>=28&&p.tend.leadership>=62&&!p.flags.includes('captain'),
 title:'주장 제안',
 text:p=>`구단이 내년 주장직을 제안했다.\n주장은 팀의 성적과 분위기를 함께 짊어지는 자리다.`,
 choices:[
  {t:'받아들인다.', s:'리더십 ↑↑ 팀 ↑ / 개인 성장 ↓', run:p=>{flag(p,'captain');tend(p,{leadership:16,loyalty:10});p.teamBoost=(p.teamBoost||0)+3;return['그는 주장이 되었다.'];}},
  {t:'"제 야구에 집중하겠습니다."', s:'개인 성적 ↑', run:p=>{tend(p,{selfish:8});grow(p,p.pos==='pitcher'?{stuff:2}:{power:2});return['구단은 다른 선수를 선임했다.'];}}
 ]}),
EV({id:'E_RIVAL_MVP', w:7, when:p=>p.year>=2032&&p.rival.war>=4,
 title:'경쟁',
 text:p=>`기자들이 묻는다.\n"올해 MVP는 ${p.rival.name} 선수와의 경쟁이라는 말이 많습니다."`,
 choices:[
  {t:'"제가 더 잘하면 됩니다."', s:'승부욕 ↑↑', run:p=>{tend(p,{competitive:12});p.rival.bond-=6;p.clutchBonus=(p.clutchBonus||0)+3;return['그 말이 그대로 기사 제목이 되었다.'];}},
  {t:'"좋은 선수와 같은 시대에 뛰어서 즐겁습니다."', s:'라이벌 우정 ↑↑ 팬 ↑', run:p=>{p.rival.bond+=20;p.fanRating+=3;tend(p,{star:6});return['그날 밤 라이벌에게서 문자가 왔다.'];}},
  {t:'"관심 없습니다."', s:'화제성 ↓ 멘탈 ↑', run:p=>{grow(p,{mental:2});p.rival.bond-=3;return['짧은 기사만 나갔다.'];}}
 ]}),
EV({id:'E_TRADE_RUMOR', w:5, when:p=>p.year>=2030&&p.rel.manager<40,
 title:'트레이드 루머',
 text:p=>`당신의 이름이 트레이드 후보로 언급됐다는 기사가 떴다.\n구단은 아무 설명도 하지 않는다.`,
 choices:[
  {t:'구단에 직접 묻는다.', s:'감독 관계 변화', run:p=>{const g=R.c(.5);rel(p,'manager',g?14:-12);return[g?'"그럴 계획 없다." 명확한 답을 들었다.':'"선수가 신경 쓸 일이 아니다." 벽을 느꼈다.'];}},
  {t:'성적으로 증명한다.', s:'승부욕 ↑ 체력 ↓', run:p=>{tend(p,{competitive:10,diligence:6});p.fatigue+=10;p.clutchBonus=(p.clutchBonus||0)+2;return['말 대신 기록을 남기기로 했다.'];}},
  {t:'이적을 각오한다.', s:'팀 충성도 ↓', run:p=>{tend(p,{loyalty:-15});flag(p,'wantOut');return['마음이 한 발 떨어졌다.'];}}
 ]})
];

/* ==========================================================================
   [7] DATA — 중요 경기(결정적 순간) 이벤트
   ========================================================================== */
const MOMENTS=[
{id:'M_DEBUT', once:1, when:p=>p.gamesTotal>0&&!p.flags.includes('debut'), pos:'all',
 title:'데뷔전',
 text:p=>`1군 등록 통보를 받은 다음 날이다.\n관중석의 소리가 한 겹 다르게 들린다.\n\n첫 ${p.pos==='pitcher'?'타자':'타석'}이다.`,
 choices:[
  {t:'평소대로 한다.', run:p=>{flag(p,'debut');return[{mod:0,msg:'몸에 익은 대로 했다.'}];}},
  {t:'초구부터 노린다.', run:p=>{flag(p,'debut');tend(p,{aggression:8});return[{mod:R.c(.5)?6:-4,msg:R.c(.5)?'초구를 그대로 받아쳤다.':'초구에 헛스윙. 긴장이 풀리지 않았다.'}];}},
  {t:'관중석을 한 번 둘러본다.', run:p=>{flag(p,'debut');tend(p,{star:8});p.fanRating+=2;return[{mod:2,msg:'이 장면을 평생 기억하기로 했다.'}];}}
 ]},
{id:'M_WALKOFF', w:8, when:p=>p.lv!=='2군', pos:'batter',
 title:'9회말 2사 만루',
 text:p=>`2:3, 한 점 차. 2사 만루.\n타석에 당신이 들어선다. 상대는 마무리 투수다.`,
 choices:[
  {t:'초구부터 적극적으로 노린다.', kind:'aggr'},
  {t:'공을 끝까지 본다.', kind:'patient'},
  {t:'외야 뜬공만 만든다는 생각으로.', kind:'safe'}
 ]},
{id:'M_CRISIS', w:8, when:p=>p.lv!=='2군', pos:'pitcher',
 title:'8회, 1사 1·3루',
 text:p=>`1점 차 리드. 투구 수는 이미 105구.\n불펜은 아직 준비가 덜 됐다. 감독이 마운드로 올라온다.\n\n"어때?"`,
 choices:[
  {t:'"제가 끝내겠습니다."', kind:'aggr'},
  {t:'"한 타자만 더 상대하겠습니다."', kind:'patient'},
  {t:'"교체해 주십시오."', kind:'safe'}
 ]},
{id:'M_LEAD', w:8, when:p=>p.lv!=='2군', pos:'catcher',
 title:'9회, 마무리의 공이 흔들린다',
 text:p=>`1점 차. 주자 2루. 마무리 투수의 직구가 계속 높다.\n포수인 당신이 사인을 낸다.`,
 choices:[
  {t:'직구로 정면 승부시킨다.', kind:'aggr'},
  {t:'변화구로 유인한다.', kind:'patient'},
  {t:'마운드에 올라가 시간을 끈다.', kind:'safe'}
 ]},
{id:'M_KS', w:20, when:p=>p.inPost, pos:'all', ks:1,
 title:'한국시리즈',
 text:p=>`가을이다.\n관중석은 가득 찼고, 카메라는 당신을 비추고 있다.\n이 시리즈가 끝나면, 사람들은 오늘의 당신만 기억할 것이다.`,
 choices:[
  {t:'모든 것을 쏟아붓는다.', kind:'aggr'},
  {t:'평소의 야구를 한다.', kind:'patient'},
  {t:'팀을 믿고 내 몫만 한다.', kind:'safe'}
 ]}
];

/* ==========================================================================
   [8] DATA — 엔딩 (위에서부터 우선 판정)
   ========================================================================== */
const ENDINGS=[
{id:'goat', title:'역대 최고의 선수', when:p=>p.tot.war>=85&&p.awards.mvp>=2&&p.awards.champ>=2,
 quote:'"그가 뛴 시대를, 사람들은 그의 이름으로 불렀다."'},
{id:'era', title:'시대의 지배자', when:p=>p.tot.war>=65&&(p.awards.mvp>=1||p.awards.allstar>=8),
 quote:'"같은 시대의 선수들에게는, 그가 불행이었다."'},
{id:'legend', title:'구단의 전설', when:p=>p.tot.war>=45&&p.teamsPlayed.length<=1&&p.seasonsPlayed>=12,
 quote:'"그는 가장 뛰어난 선수였던 것보다\n가장 오래 기억될 선수였다."'},
{id:'bigGame', title:'큰 경기의 사나이', when:p=>p.awards.ksMvp>=1&&p.post.war>=Math.max(4,p.tot.war*.14),
 quote:'"정규시즌의 그는 평범했다.\n10월의 그는 아니었다."'},
{id:'national', title:'국민의 선수', when:p=>p.nat.gold>=1&&p.fanRating>=82&&p.tot.war>=35,
 quote:'"그 순간만큼은, 야구를 모르는 사람도 그의 이름을 불렀다."'},
{id:'tragic', title:'비운의 천재', when:p=>p.pot>=85&&p.injuries.length>=3&&p.tot.war<26,
 quote:'"뛰어난 재능을 가진 선수였지만\n부상은 언제나 그의 발목을 잡았습니다."'},
{id:'captain', title:'최고의 주장', when:p=>p.flags.includes('captain')&&p.awards.champ>=1&&p.tend.leadership>=80&&p.tot.war>=30,
 quote:'"성적표에는 남지 않는 것들을, 동료들이 대신 기억했다."'},
{id:'oneSeason', title:'한 시즌의 신화', when:p=>p.bestWar>=6.5&&p.tot.war<25,
 quote:'"딱 한 해. 그러나 그 한 해는 누구도 잊지 못했다."'},
{id:'late', title:'늦게 피어난 꽃', when:p=>p.peakAge>=31&&p.tot.war>=30,
 quote:'"모두가 늦었다고 말할 때,\n그는 이제 시작이라고 생각했다."'},
{id:'solid', title:'좋은 선수였다', when:p=>p.tot.war>=22,
 quote:'"화려하지 않았다. 대신 오래 있었다."'},
{id:'journey', title:'저니맨', when:p=>p.teamsPlayed.length>=4&&p.seasonsPlayed>=12,
 quote:'"유니폼은 여러 번 바뀌었지만,\n야구를 하는 방식은 한 번도 바뀌지 않았다."'},
{id:'role', title:'없으면 아쉬운 선수', when:p=>p.tot.war>=9&&p.seasonsPlayed>=8,
 quote:'"이름을 외우는 사람은 많지 않았다.\n그가 빠진 날, 팀은 그 빈자리를 알았다."'},
{id:'shortlived', title:'짧았던 선수 생활', when:p=>p.seasonsPlayed<=6,
 quote:'"그는 오래 버티지 못했다.\n그래도 그 자리까지 간 사람은 많지 않다."'},
{id:'forgotten', title:'잊힌 유망주', when:()=>true,
 quote:'"한때 모두가 그의 이름을 알았다.\n그리고 조용히 잊었다."'}
];

/* ==========================================================================
   [23] DATA — 구단 전용 이벤트 (이적하면 풀이 바뀐다)
   team: 특정 구단 / cul: 문화 태그 공용
   ========================================================================== */
const TEAM_EVENTS=[
/* 서울 블루스 — 스타 중심 */
EV({id:'TE_SEOUL_1',team:'seoul',w:7,when:p=>p.year>=2027,
 title:'간판스타의 눈빛',
 text:p=>`구단의 간판타자가 당신의 타격 훈련을 한참 지켜본다.\n\n"요즘 네 얘기 많이 들린다."\n\n칭찬인지 경고인지 알 수 없는 말투였다.`,
 choices:[
  {t:'"자리 뺏을 생각으로 하고 있습니다."',s:'승부욕 ↑↑ 팀 관계 ↓',run:p=>{tend(p,{competitive:12,selfish:5});rel(p,'team',-8);p.clutchBonus+=2;return['그가 웃었다. 눈은 웃지 않았다.'];}},
  {t:'"많이 배우고 있습니다."',s:'인간관계 ↑ 훈련 효과 ↑',run:p=>{tend(p,{social:8});rel(p,'vet',12);grow(p,p.pos==='pitcher'?{control:1.5}:{contact:1.5});return['그날부터 그가 직접 조언을 해주기 시작했다.'];}}
 ]}),
EV({id:'TE_SEOUL_2',team:'seoul',w:5,when:p=>p.year>=2029,
 title:'또 한 명의 FA 영입',
 text:p=>`구단이 당신과 같은 포지션의 대형 FA를 영입했다는 기사가 떴다.`,
 choices:[
  {t:'경쟁을 받아들인다',s:'훈련량 ↑ 체력 ↓',run:p=>{p.fatigue+=14;tend(p,{competitive:10,diligence:6});grow(p,p.pos==='pitcher'?{stuff:2}:{power:2});return['잃을 게 없는 쪽이 유리하다.'];}},
  {t:'구단에 서운함을 표한다',s:'감독 관계 ↓ 충성도 ↓',run:p=>{rel(p,'manager',-12);tend(p,{loyalty:-10});flag(p,'wantOut');return['"저를 어떻게 보시는 겁니까."'];}}
 ]}),
/* 부산 웨일스 — 팬덤 압박 */
EV({id:'TE_BUSAN_1',team:'busan',w:7,when:p=>p.year>=2027,
 title:'최근 10경기 3승 7패',
 text:p=>`관중석에서 야유가 나온다. 구단 게시판은 더 심하다.\n경기 후 라커룸은 조용하다.`,
 choices:[
  {t:'팬들 앞에서 고개를 숙인다',s:'팬 평가 ↑ 멘탈 ↓',run:p=>{p.fanRating=clamp(p.fanRating+5,0,100);grow(p,{mental:-1});return['야유가 박수로 바뀌기까지는 시간이 걸렸다.'];}},
  {t:'신경 쓰지 않고 훈련한다',s:'멘탈 ↑ 팬 평가 ↓',run:p=>{grow(p,{mental:2.5});p.fanRating=clamp(p.fanRating-3,0,100);return['그는 소리를 듣지 않는 법을 배웠다.'];}},
  {t:'인터뷰에서 팬들에게 응원을 부탁한다',s:'스타성 ↑',run:p=>{tend(p,{star:8});p.fanRating=clamp(p.fanRating+3,0,100);return['다음 홈경기, 관중석이 가득 찼다.'];}}
 ]}),
/* 인천 마리너스 — 투수 왕국 */
EV({id:'TE_INCHEON_1',team:'incheon',w:7,when:p=>p.year>=2027,
 title:'마운드 우선주의',
 text:p=>`구단은 올해도 투수 보강에 예산 대부분을 썼다.\n야수 훈련 시설 개선 요청은 또 미뤄졌다.`,
 choices:[
  {t:'주어진 환경에서 최선을 다한다',s:'성실성 ↑',run:p=>{tend(p,{diligence:10,patience:6});return['불평은 성적을 올려주지 않는다.'];}},
  {t:'구단에 정식으로 건의한다',s:'리더십 ↑ 감독 관계 ↓',run:p=>{tend(p,{leadership:10});rel(p,'manager',-8);return['선수단 대표로 나섰다. 프런트는 불편해했다.'];}}
 ]}),
/* 대전 파이오니어스 — 육성 중심 */
EV({id:'TE_DAEJEON_1',team:'daejeon',w:7,when:p=>p.age<=24,
 title:'실패해도 된다',
 text:p=>`감독이 말한다.\n\n"올해 성적은 신경 쓰지 마라. 네가 커야 우리 팀이 산다."\n\n1군 붙박이 출전을 보장받았다.`,
 choices:[
  {t:'과감하게 부딪친다',s:'성장 ↑↑ 기록 불안정',run:p=>{grow(p,p.pos==='pitcher'?{velo:2,stuff:2}:{power:2,contact:1.5});tend(p,{aggression:8});return['실패해도 되는 시간은 길지 않다.'];}},
  {t:'안정적으로 시즌을 보낸다',s:'멘탈 ↑ 성장 ↓',run:p=>{grow(p,{mental:2.5});tend(p,{patience:8});return['무너지지 않는 것도 실력이다.'];}}
 ]}),
/* 광주 타이탄스 — 승리 우선 */
EV({id:'TE_GWANGJU_1',team:'gwangju',w:7,when:p=>p.year>=2028,
 title:'우승 말고는 실패',
 text:p=>`구단 사무실 벽에 우승 연도가 새겨져 있다. 마지막 숫자는 오래전이다.\n\n"올해는 반드시."`,
 choices:[
  {t:'팀 우승에 모든 걸 맞춘다',s:'팀 기여 ↑ 개인 기록 ↓',run:p=>{tend(p,{loyalty:10,selfish:-8});p.teamBoost=(p.teamBoost||0)+2;return['개인 기록은 뒤로 미뤘다.'];}},
  {t:'내 성적이 곧 팀 성적이다',s:'개인 성적 ↑ 이기심 ↑',run:p=>{tend(p,{selfish:10,competitive:6});p.clutchBonus+=2;return['틀린 말은 아니다.'];}}
 ]}),
/* 대구 레이더스 — 베테랑 존중 */
EV({id:'TE_DAEGU_1',team:'daegu',w:7,when:p=>p.age<=26,
 title:'전통',
 text:p=>`고참들이 부른다.\n\n"우리 팀은 원래 이렇게 해왔다. 너도 이어가라."\n\n오래된 방식이었다. 효율적이지는 않았다.`,
 choices:[
  {t:'전통을 따른다',s:'팀 관계 ↑↑ 성장 ↓',run:p=>{rel(p,'vet',18);rel(p,'team',12);tend(p,{loyalty:10});return['라커룸에서 그의 자리가 생겼다.'];}},
  {t:'내 방식대로 한다',s:'성장 ↑ 팀 관계 ↓↓',run:p=>{grow(p,p.pos==='pitcher'?{control:2.5}:{contact:2.5});rel(p,'vet',-15);flag(p,'troubleMaker');return['고참들과 거리가 생겼다.'];}}
 ]}),
/* 수원 스톰 — 데이터 야구 */
EV({id:'TE_SUWON_1',team:'suwon',w:7,when:p=>p.year>=2027,
 title:'데이터가 말한다',
 text:p=>`분석팀이 리포트를 건넨다.\n\n"당신의 ${p.pos==='pitcher'?'슬라이더 구사 비율':'바깥쪽 낮은 공 대응'}을 바꾸면 수치가 올라갑니다."\n\n감각과는 맞지 않는 제안이다.`,
 choices:[
  {t:'데이터를 믿는다',s:'능력 ↑ 초반 부진',run:p=>{grow(p,p.pos==='pitcher'?{breaking:3}:{eye:3});p.slump=1;return['적응에 시간이 걸릴 것이다.'];}},
  {t:'감각을 믿는다',s:'멘탈 ↑',run:p=>{grow(p,{mental:2});tend(p,{patience:-4});return['숫자가 전부는 아니다.'];}}
 ]}),
/* 창원 샤크스 — 프랜차이즈 중시 */
EV({id:'TE_CHANGWON_1',team:'changwon',w:7,when:p=>p.seasonsPlayed>=4,
 title:'평생 이 유니폼',
 text:p=>`구단주가 직접 찾아왔다.\n\n"돈은 다른 팀만큼 못 준다. 대신 자네 등번호는 영구결번으로 남길 생각이다."`,
 choices:[
  {t:'약속한다',s:'충성도 ↑↑ 팬 ↑',run:p=>{tend(p,{loyalty:20});p.fanRating=clamp(p.fanRating+7,0,100);flag(p,'franchiseStar');return['그 약속은 기록보다 오래 남을 것이다.'];}},
  {t:'대답을 미룬다',s:'변화 없음',run:p=>{tend(p,{loyalty:-4});return['"생각해 보겠습니다."'];}}
 ]}),
/* 고양 크라운 — 키워서 보낸다 */
EV({id:'TE_GOYANG_1',team:'goyang',w:7,when:p=>p.seasonsPlayed>=3,
 title:'키워서 보내는 팀',
 text:p=>`함께 성장한 동료가 다른 팀으로 트레이드됐다.\n구단에서는 "좋은 조건이었다"고만 말했다.`,
 choices:[
  {t:'나도 언젠가 떠난다고 각오한다',s:'충성도 ↓ 멘탈 ↑',run:p=>{tend(p,{loyalty:-12});grow(p,{mental:2});return['정을 붙이지 않기로 했다.'];}},
  {t:'남아서 이 팀을 바꾸겠다고 다짐한다',s:'리더십 ↑ 충성도 ↑',run:p=>{tend(p,{leadership:10,loyalty:12});return['누군가는 남아야 한다.'];}}
 ]}),
/* 성남 레이븐스 — 리빌딩 */
EV({id:'TE_SEONGNAM_1',team:'seongnam',w:7,when:p=>p.year>=2027,
 title:'또 리빌딩',
 text:p=>`구단이 베테랑들을 정리했다. 라커룸의 절반이 신인이다.\n당신이 어느새 고참 축에 든다.`,
 choices:[
  {t:'어린 선수들을 이끈다',s:'리더십 ↑↑',run:p=>{tend(p,{leadership:14,social:6});flag(p,'mentor');return['그는 자기도 모르게 중심이 되어 있었다.'];}},
  {t:'내 커리어를 먼저 생각한다',s:'개인 성적 ↑ 충성도 ↓',run:p=>{tend(p,{selfish:10,loyalty:-8});p.clutchBonus+=2;return['이 팀에서 보낼 시간이 아깝다.'];}}
 ]}),
/* 문화 공용 */
EV({id:'TE_CUL_YOUTH',cul:'육성',w:4,when:p=>p.age>=27,
 title:'2군의 유망주',
 text:p=>`2군에서 올라온 어린 선수가 당신의 루틴을 그대로 따라 하고 있다.`,
 choices:[
  {t:'전부 알려준다',s:'리더십 ↑ 팀 문화 적합',run:p=>{tend(p,{leadership:10});rel(p,'team',10);return['그 선수는 3년 뒤 주전이 된다.'];}},
  {t:'스스로 찾게 둔다',s:'변화 없음',run:p=>{return['배우는 방법도 실력이다.'];}}
 ]}),
EV({id:'TE_CUL_VET',cul:'수비',w:4,when:p=>p.year>=2028,
 title:'수비가 먼저다',
 text:p=>`코치진이 말한다. "이 팀에서는 잘 치는 선수보다 안 실수하는 선수를 먼저 쓴다."`,
 choices:[
  {t:'수비에 시간을 쓴다',s:'수비 ↑ 공격 성장 ↓',run:p=>{grow(p,p.pos==='pitcher'?{control:2.5}:{defense:3});return['기본기가 두꺼워졌다.'];}},
  {t:'방망이로 증명한다',s:'공격 ↑ 감독 관계 ↓',run:p=>{grow(p,p.pos==='pitcher'?{velo:2}:{power:2.5});rel(p,'manager',-6);return['그는 다른 방식으로 설득하기로 했다.'];}}
 ]})
];

/* ==========================================================================
   [24] DATA — 특성 조합 전용 스토리
   ========================================================================== */
const COMBO_EVENTS=[
{id:'C_BIGBOMB',need:['홈런왕','강심장'],title:'큰 경기의 거포',
 text:'가을에 그의 타구는 더 멀리 갔다. 상대 팀 감독은 "그 타석만은 피하고 싶었다"고 말했다.',
 run:p=>{p.clutchBonus+=4;p.fanRating=clamp(p.fanRating+4,0,100);flag(p,'bigBomb');}},
{id:'C_IRONACE',need:['에이스','철인'],title:'혹사도 이겨낸 에이스',
 text:'팀이 필요할 때마다 그는 마운드에 있었다. 어깨는 버텨주었고, 기록은 남았다.',
 run:p=>{grow(p,{stamina:3});p.timeline.push({y:p.year,t:'팀의 절대적인 기둥'});}},
{id:'C_EYEKING',need:['안타왕','선구안'],title:'타석에서 모든 것을 보는 남자',
 text:'그의 타석은 길었다. 투수들은 그를 상대하는 데 평균보다 여섯 개의 공을 더 썼다.',
 run:p=>{grow(p,{eye:3});p.fanRating=clamp(p.fanRating+3,0,100);}},
{id:'C_IFONLY',need:['유리몸','천재'],title:'부상만 아니었다면',
 text:'재능을 의심한 사람은 없었다. 다만 그의 몸은 재능의 속도를 따라가지 못했다.',
 run:p=>{flag(p,'ifOnly');grow(p,{mental:2});}},
{id:'C_FACE',need:['슈퍼스타','주장감'],title:'팀의 얼굴',
 text:'구단 홈페이지 첫 화면도, 시즌권 포스터도 그였다. 라커룸의 중심도 그였다.',
 run:p=>{p.teamBoost=(p.teamBoost||0)+2;p.fanRating=clamp(p.fanRating+5,0,100);flag(p,'teamFace');}},
{id:'C_LATE',need:['대기만성','자기관리'],title:'서른 넘어 시작된 전성기',
 text:'또래들이 하나둘 유니폼을 벗을 때, 그는 커리어 최고의 시즌을 보내고 있었다.',
 run:p=>{grow(p,{mental:2});p.timeline.push({y:p.year,t:'서른 이후의 전성기'});}},
{id:'C_KING',need:['절대에이스','승부사'],title:'가장 믿을 수 있는 공',
 text:'단기전 1차전 선발은 언제나 그였다. 감독은 고민한 적이 없다고 했다.',
 run:p=>{p.clutchBonus+=4;}},
{id:'C_CATCH',need:['안방마님','투수조련사'],title:'마운드를 키운 사람',
 text:'그와 배터리를 이룬 투수들은 하나같이 커리어 최고의 시즌을 보냈다.',
 run:p=>{p.teamBoost=(p.teamBoost||0)+3;}}
];
function comboCheck(p){
  p.combos=p.combos||[];
  for(const c of COMBO_EVENTS){
    if(p.combos.includes(c.id))continue;
    if(c.need.every(n=>p.traits.includes(n))){p.combos.push(c.id);return c;}
  }
  return null;
}

/* ==========================================================================
   [34] DATA v2.1 — 확률 기반 이벤트 (outcomes / reveal / risk)
   기존 EVENTS 배열에 합쳐진다.
   ========================================================================== */
const V21_EVENTS=[
EV({id:'V_PUSH',w:7,when:p=>p.fatigue>=50&&p.lv!=='2군',
 title:'감독이 부른다',
 text:p=>`"내일도 나갈 수 있지?"\n\n${bodyHint(p)}`,
 choices:[
  {t:'"괜찮습니다. 나가겠습니다."',risk:'HIGH_RISK',reveal:'PARTIAL',outcomes:[
    {p:.45,label:'결정적인 활약',res:{clutch:4,rel:{manager:10},fan:3,fatigue:12,text:'그날 경기, 그가 팀을 구했다.'},bias:{competitive:.8}},
    {p:.35,label:'평범한 경기 · 피로 누적',res:{fatigue:18,rel:{manager:3},text:'몸이 무거웠지만 티는 내지 않았다.'}},
    {p:.20,label:'몸에 이상 신호',res:{fatigue:22,injRisk:.45,flag:'playedHurt',text:'3회부터 통증이 왔다. 아무에게도 말하지 않았다.'},bias:{mental:-.5}}
  ]},
  {t:'"하루만 쉬겠습니다."',risk:'SAFE',reveal:'FULL',outcomes:[
    {p:.70,label:'컨디션 회복',res:{fatigue:-22,cond:1,text:'하루가 몸을 바꿔놓았다.'}},
    {p:.30,label:'감독의 실망',res:{fatigue:-18,rel:{manager:-8},text:'"요즘 애들은…" 뒤에서 그런 말이 들렸다.'},bias:{loyalty:-.6}}
  ]}
 ]}),
EV({id:'V_MEDIA2',w:6,when:p=>p.year>=2028&&(p.fame>=30||(p.media||50)>=60),
 title:'기자의 질문',
 text:p=>`"감독님의 기용 방식에 대해 어떻게 생각하십니까?"\n\n마이크가 코앞에 있다.`,
 choices:[
  {t:'솔직하게 말한다',risk:'RISK',reveal:'FULL',outcomes:[
    {p:.40,label:'소신 발언으로 화제',res:{media:14,fan:4,fame:6,tend:{star:8},flag:'mediaFriendly',text:'그의 말이 하루 종일 회자됐다.'},bias:{competitive:.6}},
    {p:.60,label:'구단·감독과 마찰',res:{media:10,rel:{manager:-14,front:-8},flag:'mediaConflict',text:'구단은 불쾌감을 감추지 않았다.'}}
  ]},
  {t:'말을 아낀다',risk:'SAFE',reveal:'FULL',outcomes:[
    {p:.80,label:'무난하게 마무리',res:{rel:{manager:4},text:'"선수는 야구만 하면 됩니다."'}},
    {p:.20,label:'언론의 관심 하락',res:{media:-6,text:'기사는 나가지 않았다.'}}
  ]}
 ]}),
EV({id:'V_ROOKIE_HELP',w:6,when:p=>p.age>=26,
 title:'후배의 부탁',
 text:p=>`2군에서 갓 올라온 후배가 따라붙는다.\n"선배님 루틴, 한 번만 보여주시면 안 됩니까."`,
 choices:[
  {t:'내 시간을 쪼개 가르친다',risk:'BALANCED',reveal:'FULL',outcomes:[
    {p:.65,label:'후배 관계 ↑↑ 리더십 ↑',res:{rel:{rookie:18},tend:{leadership:10,social:6},flag:'mentor',
      text:'그 후배는 이 장면을 오래 기억할 것이다.'},bias:{leadership:.9}},
    {p:.35,label:'내 훈련 시간 손실',res:{rel:{rookie:10},fatigue:10,text:'내 것을 챙길 시간이 줄었다.'}}
  ]},
  {t:'"혼자 부딪혀봐."',risk:'SAFE',reveal:'PARTIAL',outcomes:[
    {p:.55,label:'내 훈련에 집중',res:{st:{mental:1.5},tend:{selfish:6},text:'틀린 말은 아니었다.'}},
    {p:.45,label:'후배들과 거리감',res:{rel:{rookie:-10},tend:{leadership:-4},text:'그 뒤로 아무도 묻지 않았다.'}}
  ]}
 ]}),
EV({id:'V_COACH',w:6,when:p=>p.year>=2027,
 title:'코치의 제안',
 text:p=>`타격코치가 새로운 방법을 제안한다.\n"두 달만 참으면 완전히 달라질 거다. 대신 그동안은 성적이 떨어질 수 있어."`,
 choices:[
  {t:'두 달을 투자한다',risk:'RISK',reveal:'FULL',outcomes:[
    {p:.55,label:'핵심 능력 큰 성장',res:{st:{},rel:{coach:15},text:'두 달 뒤, 공이 다르게 보이기 시작했다.'},bias:{diligence:.9}},
    {p:.30,label:'성장은 미미 · 감각 혼란',res:{rel:{coach:5},text:'몸에 붙지 않았다.'}},
    {p:.15,label:'완전히 무너진 밸런스',res:{st:{mental:-2},rel:{coach:-8},text:'원래 폼으로도 돌아가지 못했다.'}}
  ]},
  {t:'지금 방식을 유지한다',risk:'SAFE',reveal:'PARTIAL',outcomes:[
    {p:.75,label:'안정적인 시즌',res:{st:{mental:1},text:'익숙한 것을 지켰다.'}},
    {p:.25,label:'코치와 거리감',res:{rel:{coach:-8},text:'코치는 더 이상 말을 걸지 않았다.'}}
  ]}
 ]}),
EV({id:'V_FRONT',w:5,when:p=>p.seasonsPlayed>=3,
 title:'연봉 협상',
 text:p=>`구단 사무실. 제시된 금액은 기대에 못 미친다.`,
 choices:[
  {t:'강하게 요구한다',risk:'RISK',reveal:'PARTIAL',outcomes:[
    {p:.45,label:'요구 관철',res:{rel:{front:6},tend:{star:6},fame:4,text:'구단이 한발 물러섰다.'},bias:{selfish:.8}},
    {p:.55,label:'협상 결렬 · 감정 상함',res:{rel:{front:-14},flag:'wantOut',text:'"이 선수, 팀보다 돈이네."'}}
  ]},
  {t:'구단 제시안을 받아들인다',risk:'SAFE',reveal:'FULL',outcomes:[
    {p:.85,label:'구단 신뢰 ↑',res:{rel:{front:14},tend:{loyalty:10},text:'프런트는 그를 다르게 보기 시작했다.'}},
    {p:.15,label:'주변의 핀잔',res:{rel:{front:8},tend:{patience:4},text:'"너무 쉽게 도장 찍었다"는 말을 들었다.'}}
  ]}
 ]}),
EV({id:'V_MINOR',w:9,when:p=>p.lv==='2군',
 title:'2군의 성적표',
 text:p=>`2군에서는 할 만하다. 문제는 아무도 보지 않는다는 것이다.\n감독대행이 묻는다. "위에 올라갈 준비, 됐냐?"`,
 choices:[
  {t:'"지금 당장 올려주십시오."',risk:'HIGH_RISK',reveal:'HIDDEN',outcomes:[
    {p:.40,label:'콜업 성공',res:{rel:{manager:10},tend:{competitive:8},clutch:3,text:'다음 주, 1군 등록 통보를 받았다.'},bias:{competitive:.9}},
    {p:.60,label:'아직 이르다는 평가',res:{rel:{manager:-5},tend:{patience:4},text:'"조금만 더 있어라." 익숙한 말이었다.'}}
  ]},
  {t:'"조금 더 준비하겠습니다."',risk:'SAFE',reveal:'FULL',outcomes:[
    {p:.70,label:'기본기 향상',res:{st:{mental:2},tend:{patience:8,diligence:5},text:'조급함을 버리자 오히려 잘 맞았다.'}},
    {p:.30,label:'잊혀짐',res:{tend:{patience:5},rel:{manager:-4},text:'2군의 시간은 조용히 흘렀다.'}}
  ]}
 ]}),
EV({id:'V_FANDAY',w:5,when:p=>p.fanRating>=55,
 title:'팬 사인회',
 text:p=>`줄이 길다. 예정 시간이 한참 지났는데도 끝이 보이지 않는다.`,
 choices:[
  {t:'끝까지 남아 전부 받아준다',risk:'BALANCED',reveal:'FULL',outcomes:[
    {p:.75,label:'팬 평가 ↑↑',res:{fan:8,media:5,tend:{star:6},fatigue:10,flag:'fanFavorite',
      text:'마지막 팬까지 이름을 불러줬다.'}},
    {p:.25,label:'체력 소모만 남음',res:{fan:3,fatigue:16,text:'다음 날 몸이 무거웠다.'}}
  ]},
  {t:'예정대로 마무리한다',risk:'SAFE',reveal:'FULL',outcomes:[
    {p:.60,label:'무난',res:{fan:1,text:'정해진 만큼만 했다.'}},
    {p:.40,label:'팬 실망',res:{fan:-5,media:3,text:'"그 선수 그렇게 안 봤는데." 글이 올라왔다.'}}
  ]}
 ]}),
EV({id:'V_MENTOR_BACK',once:1,w:10,when:p=>p.year>=2032&&p.flags.includes('mentor'),
 title:'그 후배가 돌아왔다',
 text:p=>`몇 년 전 당신에게 루틴을 배우던 후배가 이제 팀의 주전이 되었다.\n그가 신인들을 모아놓고 말한다.\n\n"이건 저 선배한테 배운 겁니다."`,
 choices:[
  {t:'함께 어린 선수들을 가르친다',risk:'BALANCED',reveal:'FULL',outcomes:[
    {p:.80,label:'리더십 ↑↑ 팀 전체 상승',res:{tend:{leadership:14},rel:{rookie:20,coach:10},
      text:'라커룸의 공기가 달라졌다.'}},
    {p:.20,label:'내 훈련 시간 감소',res:{tend:{leadership:8},fatigue:8,text:'내 몸 챙길 시간은 줄었다.'}}
  ]},
  {t:'조용히 지켜본다',risk:'SAFE',reveal:'FULL',outcomes:[
    {p:1,label:'흐뭇함',res:{st:{mental:1.5},rel:{rookie:8},text:'그걸로 충분했다.'}}
  ]}
 ]}),
EV({id:'V_MEDIA_BACK',once:1,w:8,when:p=>p.year>=2031&&p.flags.includes('mediaConflict'),
 title:'다시 꺼내진 발언',
 text:p=>`몇 년 전 인터뷰가 다시 기사로 돌아왔다.\n"그때 그 말, 지금도 같은 생각입니까?"`,
 choices:[
  {t:'"그때와 생각이 다릅니다."',risk:'SAFE',reveal:'FULL',outcomes:[
    {p:.70,label:'이미지 회복',res:{media:-4,fan:6,rel:{manager:8,front:8},text:'논란은 그렇게 정리됐다.'}},
    {p:.30,label:'번복이라는 비판',res:{media:6,fan:-3,text:'"말 바꾸기"라는 제목이 달렸다.'}}
  ]},
  {t:'"지금도 같은 생각입니다."',risk:'HIGH_RISK',reveal:'PARTIAL',outcomes:[
    {p:.45,label:'소신 있는 선수로 각인',res:{media:12,fan:7,tend:{star:10},flag:'troubleMaker',
      text:'그를 지지하는 팬들이 생겼다.'},bias:{competitive:.7}},
    {p:.55,label:'구단과 완전히 틀어짐',res:{rel:{manager:-16,front:-16},media:10,flag:'wantOut',
      text:'구단은 더 이상 그를 프랜차이즈로 보지 않았다.'}}
  ]}
 ]})
];
EVENTS.push(...V21_EVENTS);
/* 코치 제안 이벤트의 성장치는 포지션에 맞춰 주입 */
(function(){
  const e=V21_EVENTS.find(x=>x.id==='V_COACH');
  e.choices[0].outcomes[0].res.st=null; // 실행 시점에 결정
  const orig=e.choices[0].outcomes[0].res;
  Object.defineProperty(orig,'st',{get(){
    const p=G.p;
    return p.pos==='pitcher'?{control:3,breaking:2.5}:p.pos==='catcher'?{lead:3,contact:2}:{contact:3,power:2};
  }});
})();
