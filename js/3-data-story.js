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
 text:p=>`새벽 6시. 아무도 없을 거라 생각하고 나온 실내 훈련장에 이미 불이 켜져 있다.\n10년 차 베테랑 ${p.vet}이 혼자 ${W(p).act} 있었다.\n\n"신인이네. 몇 시에 자?"`,
 choices:[
  {t:'"어제도 새벽까지 영상 봤습니다."', s:'성실성 ↑ 체력 ↓', run:p=>{tend(p,{diligence:8});p.fatigue+=8;return['<em>'+p.vet+'</em>이 피식 웃었다. "그래. 그거 3년만 해봐."','성실성이 올랐다.'];}},
  {t:'"잘 잤습니다. 몸이 재산이니까요."', s:'체력 ↑ 자기관리 ↑', run:p=>{p.fatigue-=12;tend(p,{patience:6});return['"영리하네. 오래 할 놈이야."','컨디션이 좋아졌다.'];}},
  {t:p=>`말없이 옆에서 ${W(p).act2}.`, s:'인간관계 ↑ 성실성 ↑', run:p=>{tend(p,{diligence:5,social:8});rel(p,'vet',12);return['두 사람은 한 시간 동안 아무 말도 하지 않았다.',p.vet+'과의 관계가 좋아졌다.'];}}
 ]}),
EV({id:'E_MANAGER_ORDER', w:7, when:p=>p.year>=2026,
 title:'감독의 지시',
 text:p=>`감독이 부른다.\n\n"네 ${W(p).craft}, 지금 상태로는 1군에서 안 통해. 바꿔라."\n\n지금 폼은 고교 시절부터 6년간 만들어온 것이다.`,
 choices:[
  {t:'지시대로 폼을 바꾼다.', s:'감독 신뢰 ↑ / 일시적 부진', run:p=>{rel(p,'manager',15);p.slump=1;return['감독의 신뢰가 크게 올랐다.',`당분간 ${W(p).feel}이 흔들릴 것이다.`];}},
  {t:p=>`"제 ${W(p).craft}으로 결과를 내겠습니다."`, s:'감독 갈등 ↑ 승부욕 ↑', run:p=>{rel(p,'manager',-18);tend(p,{competitive:8,selfish:4});flag(p,'managerConflict');return['감독은 아무 말 없이 돌아섰다.','<em>감독 갈등</em> 플래그가 생겼다.'];}},
  {t:'"두 가지를 다 준비해 보겠습니다."', s:'훈련량 ↑ 체력 ↓', run:p=>{p.fatigue+=18;tend(p,{diligence:6});rel(p,'manager',5);grow(p,{mental:1.5});return['훈련량이 두 배가 되었다.','체력이 크게 소모됐다.'];}}
 ]}),
EV({id:'E_SENIOR_SLUMP', once:1, w:6, when:p=>p.year>=2027,
 title:'부진한 선배',
 text:p=>`${p.vet}이 두 달째 ${POSV[p.vetPos||p.pos].feel}을 찾지 못하고 있다. 2군행 이야기가 나온다.\n라커룸에서 그 ${POS_LABEL[p.vetPos||p.pos]} 선배가 혼자 장비를 정리하고 있다.`,
 choices:[
  {t:'같이 남아 야간 훈련을 한다.', s:'인간관계 ↑ 체력 ↓', run:p=>{rel(p,'vet',25);tend(p,{social:8,leadership:6});p.fatigue+=14;flag(p,'helpedVeteran');return['그는 아무 말도 하지 않았지만, 오래 기억할 것이다.'];}},
  {t:'내 훈련에 집중한다.', s:'개인 능력 ↑ 이기심 ↑', run:p=>{grow(p,{[W(p).key]:2});tend(p,{selfish:7});return['내 할 일을 했다.'];}},
  {t:'"선배 자리, 제가 채우겠습니다."', s:'승부욕 ↑ 관계 ↓', run:p=>{tend(p,{competitive:12,selfish:10,social:-10});rel(p,'vet',-25);flag(p,'troubleMaker');return['말이 라커룸에 퍼졌다.'];}}
 ]}),
EV({id:'E_MEDIA', w:5, when:p=>p.year>=2027&&p.fame>=25,
 title:'인터뷰 요청',
 text:p=>`방송사에서 단독 인터뷰를 요청해 왔다.\n"솔직하게 말해주셔도 됩니다. 요즘 팀 분위기 어떻습니까?"`,
 choices:[
  {t:'팀에 대해 좋은 말만 한다.', s:'팀 관계 ↑ 화제성 ↓', run:p=>{tend(p,{loyalty:8});rel(p,'manager',6);return['무난한 기사가 나갔다.'];}},
  {t:'솔직하게 문제를 말한다.', s:'화제성 ↑ 팀 관계 ↓', run:p=>{tend(p,{star:12,selfish:6});rel(p,'manager',-14);p.fame+=8;flag(p,'troubleMaker');return['기사 제목에 그의 이름이 먼저 나왔다.'];}},
  {t:'자신의 목표를 크게 말한다.', s:'스타성 ↑ 부담 ↑', run:p=>{tend(p,{star:10,competitive:6});p.fame+=6;p.pressure=(p.pressure||0)+1;return[`"올해 ${W(p).goal} 하겠습니다."`,'팬들이 그 말을 기억할 것이다.'];}}
 ]}),
EV({id:'E_RIVAL_FIRST', once:1, w:8, when:p=>p.year>=2027,
 title:'라이벌이 먼저 갔다',
 text:p=>`${p.rival.name}이 당신보다 먼저 1군에 자리를 잡았다.\n오늘 그의 인터뷰가 스포츠 뉴스 첫 꼭지였다.`,
 choices:[
  {t:'먼저 연락해 축하한다.', s:'라이벌 우정 ↑', run:p=>{p.rival.bond+=25;tend(p,{social:6});return['"고맙다. 너도 금방 올라올 거야."'];}},
  {t:'말없이 훈련장으로 간다.', s:'승부욕 ↑ 체력 ↓', run:p=>{tend(p,{competitive:12,diligence:6});p.fatigue+=12;p.rival.bond-=8;return['그날 밤 훈련장 불은 늦게 꺼졌다.'];}},
  {t:'신경 쓰지 않는다.', s:'멘탈 ↑', run:p=>{grow(p,{mental:2});return['남의 야구는 남의 야구다.'];}}
 ]}),
EV({id:'E_FAN_LETTER', w:4, when:p=>p.year>=2028,
 title:'편지 한 통',
 text:p=>`구단을 통해 편지가 왔다.\n"아버지가 병원에 계신데, 선수님 경기를 보는 날만 웃으십니다."`,
 choices:[
  {t:'병원을 직접 찾아간다.', s:'팬 평가 ↑ 체력 ↓', run:p=>{p.fanRating+=6;tend(p,{star:6,social:6});p.fatigue+=6;flag(p,'fanFavorite');return['기사도, 사진도 없었다. 그래도 알려졌다.'];}},
  {t:'사인 유니폼과 답장을 보낸다.', s:'팬 평가 ↑', run:p=>{p.fanRating+=3;return['정성껏 답장을 썼다.'];}},
  {t:'읽고 서랍에 넣어둔다.', s:'멘탈 ↑', run:p=>{grow(p,{mental:1.5});return['그 문장을 오래 기억했다.'];}}
 ]}),
EV({id:'E_COACH_RETURN', once:1, w:5, when:p=>yearsSince(p,'helpedVeteran')>=4&&p.age>=25,
 title:'돌아온 사람',
 text:p=>`새 ${W(p).coach}가 부임했다. ${p.vet}이었다.\n\n"그때 같이 남아줬던 거, 아직 기억한다."`,
 choices:[
  {t:'"이번엔 제가 배우겠습니다."', s:'능력치 대폭 성장', run:p=>{grow(p,{[W(p).key]:5,[W(p).key2]:3.5});rel(p,'vet',20);return['전담 코치가 붙은 것이나 다름없었다.','능력치가 크게 올랐다.'];}},
  {t:'"제 방식대로 하겠습니다."', s:'멘탈 ↑ 관계 ↓', run:p=>{grow(p,{mental:3});rel(p,'vet',-10);return['그는 고개를 끄덕였다. 실망한 눈이었다.'];}}
 ]}),
EV({id:'E_YOUNG', w:5, when:p=>p.age>=27,
 title:'후배가 찾아왔다',
 text:p=>`올해 입단한 신인이 조심스럽게 다가온다.\n"선배님… 저 지금 하나도 모르겠습니다."`,
 choices:[
  {t:'시간을 내서 하나하나 알려준다.', s:'리더십 ↑ / 개인 훈련 ↓', run:p=>{tend(p,{leadership:12,social:8});p.fatigue+=8;flag(p,'mentor');return['그를 따르는 후배가 생겼다.'];}},
  {t:'"직접 부딪혀봐. 그게 빨라."', s:'무변화', run:p=>{tend(p,{leadership:-3});return['틀린 말은 아니었다.'];}},
  {t:'감독에게 그를 추천한다.', s:'리더십 ↑ 감독 신뢰 ↑', run:p=>{tend(p,{leadership:7});rel(p,'manager',10);return['감독이 당신을 다시 봤다.'];}}
 ]}),
EV({id:'E_INJURY_TEMPT', w:5, when:p=>p.fatigue>=55,
 title:'몸이 보내는 신호',
 text:p=>`${W(p).bodypart}이 무겁다. 트레이너는 2주 휴식을 권한다.\n하지만 팀은 순위 싸움 중이고, 다음 주는 라이벌 팀과의 3연전이다.`,
 choices:[
  {t:'참고 뛴다.', s:'팀 관계 ↑ / 부상 위험 ↑', run:p=>{rel(p,'manager',12);p.injRisk=(p.injRisk||0)+.25;tend(p,{competitive:6});flag(p,'playedHurt');return['이를 악물었다.'];}},
  {t:'휴식을 받아들인다.', s:'체력 회복 / 출장 감소', run:p=>{p.fatigue-=30;p.missGames=(p.missGames||0)+12;return['몸을 지키는 것도 실력이다.'];}},
  {t:'주사를 맞고 출장한다.', s:'단기 능력 유지 / 장기 위험', run:p=>{p.injRisk=(p.injRisk||0)+.45;p.fatigue+=10;return['통증은 사라졌다. 문제도 사라진 건 아니었다.'];}}
 ]}),
EV({id:'E_MONEY', w:4, when:p=>p.year>=2030&&p.fame>=40,
 title:'광고 제안',
 text:p=>`대형 광고 제안이 들어왔다. 촬영은 시즌 중 이틀.`,
 choices:[
  {t:'수락한다.', s:'스타성 ↑ 체력 ↓', run:p=>{tend(p,{star:14});p.fame+=10;p.fatigue+=12;p.fanRating+=2;return['그의 얼굴이 지하철역마다 붙었다.'];}},
  {t:'시즌이 끝난 뒤로 미룬다.', s:'집중력 유지', run:p=>{tend(p,{diligence:6});p.fatigue-=4;return['"야구부터 하겠습니다."'];}},
  {t:'거절한다.', s:'성실성 ↑ 스타성 ↓', run:p=>{tend(p,{diligence:8,star:-6});return['광고사는 다른 선수를 찾았다.'];}}
 ]}),
EV({id:'E_SLUMP_DEEP', w:6, when:p=>p.cond<=1,
 title:'끝나지 않는 부진',
 text:p=>`한 달째 답이 없다. ${W(p).place}에 서는 것이 무섭다.\n${W(p).slumpLine}. 오늘도 경기 후 혼자 남았다.`,
 choices:[
  {t:'영상을 밤새 돌려본다.', s:'멘탈 ↑ 체력 ↓', run:p=>{grow(p,{mental:2.5});p.fatigue+=14;p.cond=Math.min(4,p.cond+1);return['새벽 3시에 원인을 찾았다.'];}},
  {t:'며칠 야구를 잊는다.', s:'컨디션 ↑', run:p=>{p.fatigue-=26;p.cond=Math.min(4,p.cond+2);return['돌아온 날, 공이 다시 크게 보였다.'];}},
  {t:'선배에게 털어놓는다.', s:'인간관계 ↑ 멘탈 ↑', run:p=>{rel(p,'vet',12);grow(p,{mental:2});p.cond=Math.min(4,p.cond+1);tend(p,{social:6});return['"나도 그랬어. 다 그래."'];}}
 ]}),
EV({id:'E_CAPTAIN', once:1, w:10, when:p=>p.age>=28&&p.tend.leadership>=62&&!p.flags.includes('captain'),
 title:'주장 제안',
 text:p=>`구단이 내년 주장직을 제안했다.\n주장은 팀의 성적과 분위기를 함께 짊어지는 자리다.`,
 choices:[
  {t:'받아들인다.', s:'리더십 ↑ 팀 ↑ / 개인 성장 ↓', run:p=>{flag(p,'captain');tend(p,{leadership:16,loyalty:10});p.teamBoost=(p.teamBoost||0)+3;return['그는 주장이 되었다.'];}},
  {t:'"제 야구에 집중하겠습니다."', s:'개인 성적 ↑', run:p=>{tend(p,{selfish:8});grow(p,p.pos==='pitcher'?{stuff:2}:{power:2});return['구단은 다른 선수를 선임했다.'];}}
 ]}),
EV({id:'E_RIVAL_MVP', w:7, when:p=>p.year>=2032&&p.rival.war>=4,
 title:'경쟁',
 text:p=>`기자들이 묻는다.\n"올해 MVP는 ${p.rival.name} 선수와의 경쟁이라는 말이 많습니다."`,
 choices:[
  {t:'"제가 더 잘하면 됩니다."', s:'승부욕 ↑', run:p=>{tend(p,{competitive:12});p.rival.bond-=6;p.clutchBonus=(p.clutchBonus||0)+3;return['그 말이 그대로 기사 제목이 되었다.'];}},
  {t:'"좋은 선수와 같은 시대에 뛰어서 즐겁습니다."', s:'라이벌 우정 ↑ 팬 ↑', run:p=>{p.rival.bond+=20;p.fanRating+=3;tend(p,{star:6});return['그날 밤 라이벌에게서 문자가 왔다.'];}},
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
 text:p=>`1군 등록 통보를 받은 다음 날이다.\n관중석의 소리가 한 겹 다르게 들린다.\n\n${W(p).place}에 처음 선다.`,
 choices:[
  {t:'평소대로 한다.', run:p=>{flag(p,'debut');return[{mod:0,msg:'몸에 익은 대로 했다.'}];}},
  {t:p=>p.pos==='pitcher'?'초구부터 강하게 넣는다.':'초구부터 노린다.',
   run:p=>{flag(p,'debut');tend(p,{aggression:8});const ok=R.c(.5);
     return[{mod:ok?6:-4,msg:p.pos==='pitcher'
       ?(ok?'초구 스트라이크. 손이 떨리지 않았다.':'초구가 크게 빠졌다. 긴장이 풀리지 않았다.')
       :(ok?'초구를 그대로 받아쳤다.':'초구에 헛스윙. 긴장이 풀리지 않았다.')}];}},
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
/* ==========================================================================
   [38] DATA v3.0 — 회수 이벤트  (요구 24·27)
   "2026년에 했던 그 선택 때문에 이렇게 됐구나"를 만드는 장치.
   전부 yearsSince(p,플래그) 로 몇 해가 지났는지 확인하고 그 해를 본문에 박는다.
   ★ EVENTS 와 같은 형식이므로 storyEvent() 풀에 그대로 합류한다.
   ========================================================================== */
const CALLBACK_EVENTS=[

/* 부산에서 야유를 정면으로 맞았던 사람 */
EV({id:'CB_BOOING',once:1,w:11,when:p=>yearsSince(p,'facedBooing')>=4&&p.fanRating>=62,
 title:'그때 그 관중석',
 text:p=>`${flagYear(p,'facedBooing')}년, 이 자리에서 야유를 들었다.\n오늘은 같은 자리에서 그의 응원가가 나온다.\n\n${G.cal.year-flagYear(p,'facedBooing')}년이 걸렸다.`,
 choices:[
  {t:'모자를 벗어 인사한다',s:'팬 ↑ · 멘탈 ↑',run:p=>{
    rel(p,'fan',14);p.fanRating=clamp(p.fanRating+8,0,100);grow(p,{mental:2});
    p.stress=clamp((p.stress||20)-12,0,100);flag(p,'wonThemBack');
    p.timeline.push({y:G.cal.year,m:G.cal.month,t:'야유를 응원가로 바꾸다'});
    return['그날의 소리와 오늘의 소리가 겹쳐 들렸다.'];}},
  {t:'아무 일 없던 것처럼 들어간다',s:'멘탈 ↑',run:p=>{
    grow(p,{mental:3});tend(p,{patience:6});
    return['잊은 척하는 것도 능력이다.'];}}
 ]}),

/* 불펜에서 손을 들었던 투수 */
EV({id:'CB_BALL',once:1,w:10,pos:'pitcher',when:p=>yearsSince(p,'tookTheBall')>=3,
 title:'그 손',
 text:p=>`후배 투수가 회의실에서 손을 들었다.\n${flagYear(p,'tookTheBall')}년의 나와 같은 표정이었다.`,
 choices:[
  {t:'"내가 대신 던진다."',s:'팀·후배 관계 ↑ / 피로 ↑',run:p=>{
    rel(p,'team',12);rel(p,'rookie',14);p.fatigue=clamp(p.fatigue+14,0,100);
    tend(p,{leadership:8});flag(p,'mentoredRookie');flag(p,'teamFace');
    return['후배는 아무 말도 못 했다.','이제 이 팀에서 그 손은 내 것이다.'];}},
  {t:'"잘 생각했다." 등을 두드린다',s:'후배 관계 ↑ 리더십 ↑',run:p=>{
    rel(p,'rookie',10);tend(p,{leadership:5});flag(p,'mentoredRookie');
    return['그 아이도 언젠가 같은 말을 하게 될 것이다.'];}}
 ]}),

/* 후배를 챙겨온 사람 → 주장 제안 → 지도자의 길 */
EV({id:'CB_CAPTAIN',once:1,w:12,when:p=>!p.flags.includes('captain')&&p.age>=28&&
   yearsSince(p,'mentoredRookie')>=3&&(p.rel.rookie||50)>=72&&p.tend.leadership>=70,
 title:'주장 완장',
 text:p=>`감독이 완장을 책상 위에 올려놓는다.\n\n"${flagYear(p,'mentoredRookie')}년부터 애들이 너한테 먼저 가더라. 나한테 말고."`,
 choices:[
  {t:'완장을 받는다',s:'리더십 ↑ · 팀 전체 상승 / 스트레스 ↑',run:p=>{
    flag(p,'captain');rel(p,'captain',25);rel(p,'team',12);rel(p,'manager',8);
    tend(p,{leadership:12,selfish:-6});p.teamBoost=(p.teamBoost||0)+2;
    p.stress=clamp((p.stress||20)+14,0,100);
    p.timeline.push({y:G.cal.year,m:G.cal.month,t:'주장 선임'});
    return['라커룸에서 박수가 나왔다.','이제 지는 경기의 인터뷰는 그의 몫이다.'];}},
  {t:'"제 야구부터 하겠습니다."',s:'스트레스 ↓ 관계 ↓',run:p=>{
    rel(p,'team',-8);rel(p,'manager',-6);tend(p,{selfish:6});
    return['완장은 다른 사람에게 갔다.'];}}
 ]}),

/* 무리해서 뛰었던 몸이 돌아온다 */
EV({id:'CB_HURT',once:1,w:10,when:p=>yearsSince(p,'playedHurt')>=5&&p.age>=29,
 title:'그때의 청구서',
 text:p=>`${flagYear(p,'playedHurt')}년 그 3연전.\n의사가 사진을 가리킨다. "이거, 그때 무리한 자립니다."`,
 choices:[
  {t:'수술을 받는다',risk:'RISK',reveal:'FULL',outcomes:[
    {p:.62,label:'완전히 회복한다',res:{text:'반년을 잃고 몸을 되찾았다.',stKey:[1.5,1.0],fatigue:-20}},
    {p:.38,label:'예전 같지 않다',res:{text:'수술은 성공했지만 그 감각은 돌아오지 않았다.',
      st:{stamina:-3},tend:{patience:6}}}
  ]},
  {t:'버티고 뛴다',s:'출전 유지 / 노쇠 가속',run:p=>{
    p.injRisk=(p.injRisk||0)+.3;tend(p,{competitive:6});flag(p,'ironWill');
    grow(p,{stamina:-2});
    return['"끝까지 뛰겠습니다."','그 말을 후회하는 날이 올지도 모른다.'];}}
 ]}),

/* 트레이드를 거절했던 선택 */
EV({id:'CB_REFUSED',once:1,w:9,when:p=>yearsSince(p,'refusedTrade')>=4,
 title:'가지 않은 길',
 text:p=>`${flagYear(p,'refusedTrade')}년에 나를 원했던 그 팀이 올해 우승했다.\n중계 화면에 낯익은 유니폼이 비친다.`,
 choices:[
  {t:'"후회는 없습니다."',s:'충성도 ↑ 멘탈 ↑',run:p=>{
    tend(p,{loyalty:12});grow(p,{mental:2});rel(p,'fan',8);flag(p,'noRegret');
    return['말은 그렇게 했다.'];}},
  {t:'그날의 선택을 곱씹는다',s:'스트레스 ↑ 승부욕 ↑',run:p=>{
    p.stress=clamp((p.stress||20)+12,0,100);tend(p,{competitive:12});p.clutchBonus+=4;
    flag(p,'ifOnly');
    return['다음 시즌, 그는 다른 사람처럼 뛰었다.'];}}
 ]}),

/* 구단에 쓴소리를 했던 사람 */
EV({id:'CB_SPOKE',once:1,w:8,when:p=>yearsSince(p,'spokeUp')>=4,
 title:'그 건의서',
 text:p=>`새 훈련 시설이 문을 열었다.\n입구 안내문에 ${flagYear(p,'spokeUp')}년의 선수단 건의가 출발점이었다고 적혀 있다.`,
 choices:[
  {t:'후배들에게 넘긴다',s:'후배 ↑ 리더십 ↑',run:p=>{
    rel(p,'rookie',14);rel(p,'team',8);tend(p,{leadership:8,selfish:-4});
    flag(p,'mentoredRookie');
    return['"형들 때는 없었어요?" "없었지."'];}},
  {t:'제일 먼저 쓴다',s:'주 능력 ↑',run:p=>{
    grow(p,{[W(p).key]:1.8,[W(p).key2]:1.0});tend(p,{diligence:6});
    return['새 장비 냄새가 났다.'];}}
 ]}),

/* 감독과 부딪쳤던 과거 */
EV({id:'CB_CONFLICT',once:1,w:5,when:p=>p.age>=27&&yearsSince(p,'managerConflict')>=4,
 title:'그 감독',
 text:p=>`${flagYear(p,'managerConflict')}년에 등을 돌렸던 감독이 경질됐다.\n마지막 인사 자리에서 그가 이쪽을 본다.`,
 choices:[
  {t:'먼저 손을 내민다',s:'멘탈 ↑ · 다음 감독과의 관계 ↑',run:p=>{
    grow(p,{mental:2.5});rel(p,'manager',20);tend(p,{social:6,selfish:-4});
    flag(p,'madeAmends');
    return['"그때는 제가 어렸습니다."','그는 오래 악수를 놓지 않았다.'];}},
  {t:'끝까지 눈을 피한다',s:'승부욕 ↑ 관계 ↓',run:p=>{
    tend(p,{competitive:8,social:-6});rel(p,'front',-6);
    return['문이 닫히는 소리가 유난히 컸다.'];}}
 ]}),

/* 라커룸에서 말이 돌았던 사람 */
EV({id:'CB_TROUBLE',once:1,w:9,when:p=>yearsSince(p,'troubleMaker')>=5&&p.age>=28,
 title:'평판이라는 것',
 text:p=>`FA를 앞두고 에이전트가 말한다.\n"${flagYear(p,'troubleMaker')}년 그 일, 아직 회자됩니다. 구단들이 그걸 봐요."`,
 choices:[
  {t:'지금부터 바꾼다',s:'관계 전반 ↑ / 시간이 걸린다',run:p=>{
    rel(p,'team',12);rel(p,'manager',10);rel(p,'front',10);rel(p,'vet',8);
    tend(p,{selfish:-10,social:8});flag(p,'changedMan');
    return['라커룸에서 제일 먼저 나가는 사람이 됐다.'];}},
  {t:'"실력으로 말하겠습니다."',s:'승부욕 ↑ 시장가치 ↓',run:p=>{
    tend(p,{competitive:12,selfish:4});p.clutchBonus+=3;rel(p,'front',-8);
    return['숫자만 남기면 된다고 생각했다.'];}}
 ]}),

/* 영구결번을 마음에 담았던 사람 */
EV({id:'CB_NUMBER',once:1,w:10,when:p=>p.teamsPlayed.length<=1&&p.tot.war>=30&&
   (yearsSince(p,'wantsNumberRetired')>=4||(p.seasonsPlayed>=9&&p.fanRating>=70)),
 title:'비어 있던 자리',
 text:p=>{const y=flagYear(p,'wantsNumberRetired');
   return `${y?`${y}년에 올려다봤던 그 담장.`:`외야 담장에 걸린 번호들.`}\n구단이 조용히 의사를 물어왔다. "은퇴하시면, 저 자리요."`;},
 choices:[
  {t:'"끝까지 여기서 하겠습니다."',s:'충성도 ↑ 팬 ↑ 시장가치 ↓',run:p=>{
    tend(p,{loyalty:20});rel(p,'fan',16);rel(p,'front',12);
    p.fanRating=clamp(p.fanRating+10,0,100);
    flag(p,'franchiseStar');flag(p,'numberPromised');
    p.timeline.push({y:G.cal.year,m:G.cal.month,t:'영구결번 약속'});
    return['그날 계약서에 도장을 찍었다.','조건은 보지 않았다.'];}},
  {t:'"아직 이릅니다."',s:'승부욕 ↑',run:p=>{
    tend(p,{competitive:8});
    return['"저 자리는 다 끝난 사람이 가는 데죠."'];}}
 ]}),

/* 에이스와 배터리를 이뤘던 포수 */
EV({id:'CB_BATTERY',once:1,w:10,pos:'catcher',when:p=>yearsSince(p,'aceBattery')>=4,
 title:'마지막 등판',
 text:p=>`${flagYear(p,'aceBattery')}년부터 함께 던졌던 그 투수가 은퇴를 발표했다.\n"마지막 경기, 네가 받아줘."`,
 choices:[
  {t:'끝까지 받는다',s:'리드 ↑ 팬 ↑ 팀 ↑',run:p=>{
    grow(p,{lead:3,catching:1.5});rel(p,'team',16);rel(p,'fan',10);
    p.fanRating=clamp(p.fanRating+6,0,100);
    p.timeline.push({y:G.cal.year,m:G.cal.month,t:'에이스의 마지막 배터리'});
    flag(p,'lastBattery');
    return['9회 마지막 공을 받고, 마운드까지 걸어 올라갔다.'];}},
  {t:'후배에게 양보한다',s:'후배 ↑ 리더십 ↑',run:p=>{
    rel(p,'rookie',16);tend(p,{leadership:8,selfish:-5});flag(p,'mentoredRookie');
    return['"저 자리는 다음 사람 것이어야죠."'];}}
 ]}),

/* 가족과 시간을 보내온 사람 */
EV({id:'CB_FAMILY',once:1,w:8,when:p=>yearsSince(p,'family')>=5&&p.age>=30,
 title:'관중석의 한 자리',
 text:p=>`아이가 처음으로 경기장에 왔다.\n${flagYear(p,'family')}년에는 없던 얼굴이다.`,
 choices:[
  {t:'그 자리를 보고 뛴다',s:'멘탈 ↑ 스트레스 ↓ 클러치 ↑',run:p=>{
    grow(p,{mental:3});p.stress=clamp((p.stress||20)-18,0,100);
    p.clutchBonus+=4;tend(p,{patience:6});flag(p,'playingForSomeone');
    return['3회에 한 번, 7회에 한 번 그쪽을 봤다.'];}},
  {t:'평소처럼 한다',s:'멘탈 ↑',run:p=>{
    grow(p,{mental:1.4});p.stress=clamp((p.stress||20)-6,0,100);
    return['끝나고 나서야 손을 흔들었다.'];}}
 ]}),

/* 언론과 부딪친 적 있는 사람 — mediaConflict 는 심는 곳이 없던 플래그였다 */
EV({id:'CB_MEDIA',once:1,w:8,when:p=>p.media>=70&&p.fame>=45&&!p.flags.includes('mediaConflict'),
 title:'오보',
 text:p=>`사실과 다른 기사가 났다.\n댓글은 이미 수천 개다.`,
 choices:[
  {t:'공개적으로 반박한다',risk:'RISK',reveal:'FULL',outcomes:[
    {p:.45,label:'여론이 돌아선다',bias:{star:.8},
     res:{fan:10,media:6,text:'사과 기사가 났다.',flag:'wonThemBack'}},
    {p:.55,label:'싸움만 커진다',
     res:{fan:-10,media:12,text:'기사보다 반박이 더 오래 회자됐다.',flag:'mediaConflict'}}
  ]},
  {t:'대응하지 않는다',s:'스트레스 ↑ / 조용히 지나간다',run:p=>{
    p.stress=clamp((p.stress||20)+12,0,100);tend(p,{patience:8});
    return['일주일 뒤 아무도 그 기사를 말하지 않았다.'];}}
 ]})
];

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
/* ── v3.0 추가 — 2군 · 돈 · 관계 · 장기 플래그와 연결된 엔딩 (요구 30)
   catch-all('잊힌 유망주') 하나로 27%가 몰리던 것을 갈래로 나눈다.
   위에서부터 판정하므로 희귀한 것이 위에 온다. ── */
{id:'numberRetired', title:'담장에 걸린 번호', when:p=>p.flags.includes('numberPromised')&&
   p.teamsPlayed.length<=1&&p.tot.war>=35,
 quote:'"그의 번호는 이제 아무도 달지 않는다."'},
{id:'coachPath', title:'지도자의 길', when:p=>p.flags.includes('captain')&&
   (p.rel.rookie||50)>=75&&p.tend.leadership>=75&&p.flags.includes('mentoredRookie'),
 quote:'"선수로서의 그보다\n그가 키운 선수들이 더 오래 남았다."'},
{id:'ironman', title:'그라운드를 비우지 않았다', when:p=>p.injuries.length<=1&&
   p.seasonsPlayed>=13&&p.tot.war>=25,
 quote:'"화려한 기록은 없다.\n대신 그는 거기 항상 있었다."'},
{id:'wonThemBack', title:'야유를 이겨낸 사람', when:p=>p.flags.includes('wonThemBack')&&
   p.fanRating>=78&&p.tot.war>=20,
 quote:'"같은 관중석이 그를 두 번 울렸다.\n한 번은 야유로, 한 번은 응원가로."'},
{id:'clubhouse', title:'라커룸의 어른', when:p=>(p.rel.team||50)>=78&&(p.rel.vet||50)>=70&&
   p.seasonsPlayed>=11&&p.tot.war<28,
 quote:'"성적표에 없는 것들을 그가 지탱했다."'},
{id:'climbed', title:'끝내 올라간 사람', when:p=>
   (p.career.seasons||[]).filter(x=>x.lv==='2군').length>=4&&p.tot.war>=18,
 quote:'"2군 버스를 몇 번이나 탔는지 그는 세지 않았다.\n마지막에 서 있던 곳이 1군이면 됐다."'},
{id:'richContract', title:'계약은 성공했다', when:p=>p.money&&p.money.earned>=400000&&p.tot.war<30,
 quote:'"통장은 그를 성공한 선수라고 말했다.\n기록지는 다르게 말했다."'},
{id:'glass', title:'몸이 먼저 무너졌다', when:p=>p.injuries.length>=5,
 quote:'"실력이 모자란 적은 없었다.\n몸이 매번 먼저 손을 들었다."'},
{id:'farmhand', title:'2군의 사람', when:p=>
   (p.career.seasons||[]).filter(x=>x.lv==='2군').length>=5&&p.tot.war<6,
 quote:'"1군 잔디를 밟은 날은 손에 꼽는다.\n그래도 그는 매년 다시 짐을 쌌다."'},
{id:'neverCalled', title:'전화는 오지 않았다', when:p=>!p.flags.includes('firstCallUp'),
 quote:'"매일 휴대폰을 뒤집어 놓고 잤다.\n그 전화는 끝내 오지 않았다."'},
{id:'shortlived', title:'짧았던 선수 생활', when:p=>p.seasonsPlayed<=6,
 quote:'"그는 오래 버티지 못했다.\n그래도 그 자리까지 간 사람은 많지 않다."'},
{id:'journeyman2', title:'어디서든 뛰었다', when:p=>p.teamsPlayed.length>=3&&p.seasonsPlayed>=9,
 quote:'"짐을 싸는 데 익숙해졌다.\n야구를 그만두는 것보다는 나았다."'},
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
 text:p=>`구단의 간판${W(p).job}가 당신의 ${W(p).drill}을 한참 지켜본다.\n\n"요즘 네 얘기 많이 들린다."\n\n칭찬인지 경고인지 알 수 없는 말투였다.`,
 choices:[
  {t:'"자리 뺏을 생각으로 하고 있습니다."',s:'승부욕 ↑ 팀 관계 ↓',run:p=>{tend(p,{competitive:12,selfish:5});rel(p,'team',-8);p.clutchBonus+=2;return['그가 웃었다. 눈은 웃지 않았다.'];}},
  {t:'"많이 배우고 있습니다."',s:'인간관계 ↑ 훈련 효과 ↑',run:p=>{tend(p,{social:8});rel(p,'vet',12);grow(p,{[W(p).key]:1.5});return['그날부터 그가 직접 조언을 해주기 시작했다.'];}}
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
EV({id:'TE_INCHEON_1',team:'incheon',w:7,pos:'pitcher',when:p=>p.year>=2027,
 title:'마운드 우선주의',
 text:p=>`구단은 올해도 투수 보강에 예산 대부분을 썼다.\n최신 추적 장비가 불펜에 먼저 들어왔다.`,
 choices:[
  {t:'데이터를 파고든다',s:'제구·구위 ↑ / 피로 ↑',run:p=>{grow(p,{control:2.2,stuff:1.4});p.fatigue=clamp(p.fatigue+8,0,100);tend(p,{diligence:8});return['회전수라는 숫자를 처음으로 이해했다.'];}},
  {t:'몸으로 익힌 감각을 믿는다',s:'멘탈 ↑ 코치 관계 ↓',run:p=>{grow(p,{mental:2});rel(p,'coach',-8);tend(p,{patience:6});return['"숫자가 공을 던져주진 않습니다."'];}}
 ]}),
EV({id:'TE_INCHEON_2',team:'incheon',w:7,when:p=>p.pos!=='pitcher'&&p.year>=2027,
 title:'야수는 뒷전',
 text:p=>`구단은 올해도 투수 보강에 예산 대부분을 썼다.\n야수 훈련 시설 개선 요청은 또 미뤄졌다.`,
 choices:[
  {t:'주어진 환경에서 최선을 다한다',s:'성실성 ↑',run:p=>{tend(p,{diligence:10,patience:6});return['불평은 성적을 올려주지 않는다.'];}},
  {t:'구단에 정식으로 건의한다',s:'리더십 ↑ 프런트 관계 ↓',run:p=>{tend(p,{leadership:10});rel(p,'front',-10);flagAt(p,'spokeUp');return['선수단 대표로 나섰다. 프런트는 불편해했다.'];}}
 ]}),
/* 대전 파이오니어스 — 육성 중심 */
EV({id:'TE_DAEJEON_1',team:'daejeon',w:7,when:p=>p.age<=24,
 title:'실패해도 된다',
 text:p=>`감독이 말한다.\n\n"올해 성적은 신경 쓰지 마라. 네가 커야 우리 팀이 산다."\n\n1군 붙박이 출전을 보장받았다.`,
 choices:[
  {t:'과감하게 부딪친다',s:'성장 ↑ 기록 불안정',run:p=>{grow(p,p.pos==='pitcher'?{velo:2,stuff:2}:{power:2,contact:1.5});tend(p,{aggression:8});return['실패해도 되는 시간은 길지 않다.'];}},
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
  {t:'전통을 따른다',s:'팀 관계 ↑ 성장 ↓',run:p=>{rel(p,'vet',18);rel(p,'team',12);tend(p,{loyalty:10});return['라커룸에서 그의 자리가 생겼다.'];}},
  {t:'내 방식대로 한다',s:'성장 ↑ 팀 관계 ↓',run:p=>{grow(p,p.pos==='pitcher'?{control:2.5}:{contact:2.5});rel(p,'vet',-15);flag(p,'troubleMaker');return['고참들과 거리가 생겼다.'];}}
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
  {t:'약속한다',s:'충성도 ↑ 팬 ↑',run:p=>{tend(p,{loyalty:20});p.fanRating=clamp(p.fanRating+7,0,100);flag(p,'franchiseStar');return['그 약속은 기록보다 오래 남을 것이다.'];}},
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
  {t:'어린 선수들을 이끈다',s:'리더십 ↑',run:p=>{tend(p,{leadership:14,social:6});flag(p,'mentor');return['그는 자기도 모르게 중심이 되어 있었다.'];}},
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
/* ==========================================================================
   [23b] DATA v3.0 — 구단 전용 이벤트 확충 (요구 19)
   전부 v3.0 시스템(돈 · 관계 8종 · 스트레스 · 슬럼프 · 2군)과 연결한다.
   포지션 어휘는 W(p)를 쓴다 — 투수에게 "네 스윙" 이 나가지 않도록.
   ========================================================================== */
const TEAM_EVENTS2=[

/* ── 서울 블루스 · 스타 중심 ── */
EV({id:'TE_SEOUL_2',team:'seoul',w:6,when:p=>p.fame>=30,
 title:'광고 대행사',
 text:p=>`대행사에서 연락이 왔다.\n"음료 광고입니다. 촬영은 시즌 중 이틀."`,
 choices:[
  {t:'촬영을 수락한다',s:'큰 수입 · 피로 · 감독 관계 ↓',run:p=>{
    const fee=Math.round(2000+p.fame*140);p.money.balance+=fee;p.money.earned+=fee;
    p.fanRating=clamp(p.fanRating+4,0,100);p.media=clamp((p.media||50)+8,0,100);
    p.fatigue=clamp(p.fatigue+10,0,100);rel(p,'manager',-5);tend(p,{star:8});
    return[`${wonText(fee)}를 받았다.`,'감독은 기사에서 그 소식을 봤다.'];}},
  {t:'시즌 중이라 거절한다',s:'감독 신뢰 ↑ · 수입 없음',run:p=>{
    rel(p,'manager',8);tend(p,{diligence:5,star:-3});
    return['"요즘 애들 같지 않네." 감독이 처음으로 웃었다.'];}}
 ]}),
EV({id:'TE_SEOUL_3',team:'seoul',w:6,when:p=>p.seasonsPlayed>=3&&p.lv!=='2군',
 title:'다음 스타',
 text:p=>`구단이 FA 시장에서 같은 포지션의 대형 선수를 데려왔다.\n기자가 묻는다. "자리를 뺏길까 걱정되진 않나요?"`,
 choices:[
  {t:'"경쟁은 당연합니다."',risk:'SAFE',reveal:'FULL',outcomes:[
    {p:.70,label:'담담한 태도가 좋게 읽힌다',res:{rel:{front:8,team:5},text:'기사 제목이 점잖게 나갔다.'}},
    {p:.30,label:'패기가 없다는 평',res:{rel:{fan:-5},text:'"너무 얌전한 거 아니냐"는 말이 돌았다.'}}
  ]},
  {t:'"제 자리는 제가 지킵니다."',risk:'RISK',reveal:'FULL',outcomes:[
    {p:.55,label:'팬들이 반응한다',bias:{competitive:1},
     res:{fan:7,media:8,clutch:3,tend:{competitive:8},text:'그 한 마디가 헤드라인이 됐다.'}},
    {p:.45,label:'건방지다는 말이 돈다',res:{rel:{vet:-10,team:-6},text:'라커룸이 조용해졌다.'}}
  ]}
 ]}),

/* ── 부산 웨일스 · 팬덤 압박 ── */
EV({id:'TE_BUSAN_2',team:'busan',w:7,when:p=>p.lv!=='2군',
 title:'사직의 밤',
 text:p=>`3만 관중이 그의 이름을 부른다.\n${W(p).place}로 걸어 나가는 몇 초가 유난히 길다.`,
 choices:[
  {t:'그 소리에 응답한다',s:'팬 ↑ 스트레스 ↑',run:p=>{
    rel(p,'fan',10);p.fanRating=clamp(p.fanRating+6,0,100);
    p.stress=clamp((p.stress||20)+8,0,100);p.clutchBonus+=3;tend(p,{star:6});
    return['그 소리를 오래 기억했다.'];}},
  {t:'귀를 닫고 집중한다',s:'멘탈 ↑ · 스트레스 ↓',run:p=>{
    grow(p,{mental:1.6});p.stress=clamp((p.stress||20)-6,0,100);tend(p,{patience:5});
    return['관중석은 사라지고 공만 남았다.'];}}
 ]}),
EV({id:'TE_BUSAN_3',team:'busan',w:6,when:p=>p.season&&p.season.war<1&&p.seasonsPlayed>=2,
 title:'야유',
 text:p=>`홈에서 또 졌다. 3루 쪽에서 야유가 길게 이어진다.\n그중에 분명히 내 이름이 있었다.`,
 choices:[
  {t:'모자를 벗고 인사한다',s:'팬 ↑ 스트레스 ↑',run:p=>{
    rel(p,'fan',12);p.stress=clamp((p.stress||20)+14,0,100);tend(p,{patience:6});
    flagAt(p,'facedBooing');
    return['야유가 조금씩 잦아들었다.','그날 밤은 오래 잠들지 못했다.'];}},
  {t:'못 들은 척한다',s:'스트레스 ↓ 팬 ↓',run:p=>{
    rel(p,'fan',-8);p.stress=clamp((p.stress||20)+4,0,100);
    return['더그아웃까지가 멀었다.'];}}
 ]}),

/* ── 인천 샤크스 · 투수 왕국 ── */
EV({id:'TE_INCHEON_3',team:'incheon',w:6,when:p=>p.pos==='catcher',pos:'catcher',
 title:'배터리',
 text:p=>`팀의 에이스가 따로 부른다.\n"다음 등판, 네가 받아라. 감독한테는 내가 말한다."`,
 choices:[
  {t:'"믿어주셔서 감사합니다."',s:'리드 ↑ 출전 기회 ↑',run:p=>{
    grow(p,{lead:2.6,catching:1.2});rel(p,'team',10);rel(p,'manager',6);
    flagAt(p,'aceBattery');
    return['그날 경기, 사인을 한 번도 흔들지 않았다.'];}},
  {t:'"제가 그럴 자격이 될까요."',s:'멘탈 ↓ 관계 ↑',run:p=>{
    rel(p,'team',4);p.stress=clamp((p.stress||20)+6,0,100);
    return['"그런 말 하지 마. 그게 제일 안 좋아."'];}}
 ]}),

/* ── 대전 파이오니어스 · 육성 중심 ── */
EV({id:'TE_DAEJEON_2',team:'daejeon',w:7,when:p=>p.lv==='2군'&&p.age<=24,
 title:'실패해도 된다',
 text:p=>`2군 감독이 노트를 덮는다.\n"여기서는 실패해도 돼. 대신 똑같은 실패를 두 번 하면 안 돼."`,
 choices:[
  {t:'약점을 정면으로 파고든다',risk:'RISK',reveal:'FULL',outcomes:[
    {p:.55,label:'약점이 눈에 띄게 줄어든다',bias:{diligence:1,patience:.6},
     res:{stKey:[3.2,1.8],rel:{coach:10},text:'두 달 만에 다른 선수가 됐다.'}},
    {p:.45,label:'아직은 몸이 따라오지 않는다',
     res:{fatigue:10,tend:{patience:5},text:'조급해하지 않기로 했다.'}}
  ]},
  {t:'잘하는 것을 더 키운다',s:'주 능력 ↑ · 안전',run:p=>{
    grow(p,{[W(p).key2]:2.2});tend(p,{competitive:4});
    return['확실한 무기가 하나 생겼다.'];}}
 ]}),

/* ── 광주 타이거즈 · 승리 우선 ── */
EV({id:'TE_GWANGJU_2',team:'gwangju',w:6,when:p=>p.lv!=='2군'&&p.season&&p.season.rank&&p.season.rank<=3,
 title:'우승 말고는',
 text:p=>`구단주가 라커룸에 들어왔다.\n"올해 우승 못 하면 여기 절반은 내년에 없다."\n\n농담이 아니었다.`,
 choices:[
  {t:'"제가 끝내겠습니다."',s:'승부욕 ↑ 스트레스 ↑',run:p=>{
    tend(p,{competitive:10});p.clutchBonus+=5;
    p.stress=clamp((p.stress||20)+16,0,100);rel(p,'front',8);
    return['말을 뱉고 나니 도망갈 곳이 없어졌다.'];}},
  {t:'아무 말도 하지 않는다',s:'스트레스 ↓ 프런트 관계 ↓',run:p=>{
    rel(p,'front',-6);tend(p,{patience:4});
    return['그는 끝까지 눈을 마주치지 않았다.'];}}
 ]}),

/* ── 대구 레오파즈 · 베테랑 존중 ── */
EV({id:'TE_DAEGU_2',team:'daegu',w:7,when:p=>p.age<=23,
 title:'고참의 방식',
 text:p=>`훈련 순서가 연차대로 정해져 있다.\n내 차례는 항상 마지막이고, 그때쯤이면 ${W(p).gear}도 사람도 지쳐 있다.`,
 choices:[
  {t:'새벽에 혼자 나온다',s:'주 능력 ↑ 피로 ↑',run:p=>{
    grow(p,{[W(p).key]:1.8});p.fatigue=clamp(p.fatigue+14,0,100);
    tend(p,{diligence:9});rel(p,'vet',4);
    return['아무도 없는 훈련장의 소리를 알게 됐다.'];}},
  {t:'순서를 기다리며 선배를 돕는다',s:'관계 ↑ 성장 ↓',run:p=>{
    rel(p,'vet',12);rel(p,'captain',6);tend(p,{patience:6,social:4});
    flagAt(p,'helpedVeteran');
    return['공을 줍는 동안 배운 것도 있었다.'];}}
 ]}),

/* ── 수원 유니콘스 · 데이터 야구 ── */
EV({id:'TE_SUWON_2',team:'suwon',w:7,when:p=>p.seasonsPlayed>=1,
 title:'리포트',
 text:p=>`전력분석팀이 보낸 30페이지짜리 문서.\n첫 장에 내 약점이 세 줄로 정리돼 있었다.`,
 choices:[
  {t:'끝까지 읽는다',s:'주 능력 ↑ 멘탈 ↓ 스트레스 ↑',run:p=>{
    grow(p,{[W(p).key]:1.6,mental:-0.6});p.stress=clamp((p.stress||20)+8,0,100);
    rel(p,'front',8);tend(p,{diligence:6});
    return['모르는 게 나을 뻔한 문장도 있었다.'];}},
  {t:'덮어둔다',s:'스트레스 ↓ 프런트 관계 ↓',run:p=>{
    p.stress=clamp((p.stress||20)-5,0,100);rel(p,'front',-8);
    return['숫자가 공을 쳐주지는 않는다고 생각했다.'];}}
 ]}),

/* ── 창원 샤이닝 · 프랜차이즈 중시 ── */
EV({id:'TE_CHANGWON_2',team:'changwon',w:6,when:p=>p.seasonsPlayed>=5,
 title:'영구결번의 무게',
 text:p=>`외야 담장에 걸린 번호들 앞에서 한참 서 있었다.\n프런트 직원이 지나가며 말한다. "저 자리, 아직 비어 있어요."`,
 choices:[
  {t:'여기서 끝내겠다고 마음먹는다',s:'충성도 ↑ 팬 ↑',run:p=>{
    tend(p,{loyalty:14});rel(p,'fan',8);rel(p,'front',6);
    flagAt(p,'wantsNumberRetired');
    return['말은 하지 않았지만 결심이 섰다.'];}},
  {t:'"기록이 먼저죠."',s:'승부욕 ↑',run:p=>{
    tend(p,{competitive:7,star:3});
    return['담장을 등지고 돌아섰다.'];}}
 ]}),

/* ── 고양 · 키워서 보낸다 ── */
EV({id:'TE_GOYANG_2',team:'goyang',w:7,when:p=>p.seasonsPlayed>=3&&ovr(p)>=66,
 title:'키워서 보낸다',
 text:p=>`에이전트가 조용히 말한다.\n"이 구단은 당신을 오래 데리고 있을 생각이 없어요. 값이 오를 때까지만이죠."`,
 choices:[
  {t:'그래도 여기서 증명한다',s:'충성도 ↑ 시장가치 ↑',run:p=>{
    tend(p,{loyalty:10,competitive:5});rel(p,'front',5);
    return['어디서 뛰든 숫자는 남는다.'];}},
  {t:'이적을 염두에 둔다',s:'트레이드 확률 ↑ 충성도 ↓',run:p=>{
    flag(p,'wantOut');tend(p,{loyalty:-12,star:4});
    return['그날부터 다른 유니폼을 상상하기 시작했다.'];}}
 ]}),

/* ── 성남 · 리빌딩 ── */
EV({id:'TE_SEONGNAM_2',team:'seongnam',w:7,when:p=>p.age<=25,
 title:'기회는 많고 우승은 멀다',
 text:p=>`팀은 또 하위권이다.\n대신 ${W(p).place}에 설 기회만큼은 누구보다 많다.`,
 choices:[
  {t:'기회를 전부 쓴다',s:'출전 ↑ 피로 ↑ 성장 ↑',run:p=>{
    grow(p,{[W(p).key]:1.4,[W(p).key2]:1.0});p.fatigue=clamp(p.fatigue+10,0,100);
    rel(p,'manager',6);tend(p,{competitive:5});
    return['지는 경기에서도 배울 것은 있었다.'];}},
  {t:'이기는 야구가 하고 싶다',s:'충성도 ↓ 트레이드 확률 ↑',run:p=>{
    tend(p,{loyalty:-10,competitive:8});flag(p,'wantOut');
    p.stress=clamp((p.stress||20)+8,0,100);
    return['가을 야구를 TV로 보는 것도 네 번째다.'];}}
 ]}),

/* ══ 구단 문화 공용 — 같은 성향의 팀이면 어디서나 뜬다 ══ */
EV({id:'TC_YOUTH_1',cul:'육성',w:6,when:p=>p.age<=24&&p.lv==='2군',
 title:'2군의 겨울',
 text:p=>`난방이 잘 안 되는 실내 훈련장.\n같은 조 후배가 묻는다. "형은 언제 올라갈 것 같아요?"`,
 choices:[
  {t:'"내년엔 간다."',s:'승부욕 ↑ 후배 관계 ↑',run:p=>{
    tend(p,{competitive:7});rel(p,'rookie',8);
    return['말해놓고 나니 진짜로 그래야 할 것 같았다.'];}},
  {t:'"몰라. 그냥 하는 거지."',s:'인내 ↑ 스트레스 ↓',run:p=>{
    tend(p,{patience:8});p.stress=clamp((p.stress||20)-7,0,100);
    return['후배는 고개를 끄덕였다.'];}}
 ]}),
EV({id:'TC_ATTACK_1',cul:'공격',w:6,when:p=>p.lv!=='2군'&&p.seasonsPlayed>=2,
 title:'치고 달리는 팀',
 text:p=>`감독의 야구는 단순하다. 무조건 두드린다.\n그 안에서 내 역할은 아직 애매하다.`,
 choices:[
  {t:'팀 색깔에 나를 맞춘다',s:'주 능력 ↑ 감독 ↑ / 다른 능력 정체',run:p=>{
    grow(p,{[W(p).key2]:2.2,mental:-0.4});rel(p,'manager',9);
    return['라인업에서 내 자리가 분명해졌다.'];}},
  {t:'내 강점을 밀고 간다',s:'주 능력 ↑ 감독 ↓',run:p=>{
    grow(p,{[W(p).key]:2.4});rel(p,'manager',-7);tend(p,{selfish:5,competitive:4});
    return['벤치에서 뭐라 하든 내 방식이 있었다.'];}}
 ]}),
EV({id:'TC_DEF_1',cul:'수비',w:6,when:p=>p.lv!=='2군',
 title:'한 점을 지키는 야구',
 text:p=>`수비 시프트 미팅이 30분째다.\n타구 방향 하나하나에 이름이 붙어 있다.`,
 choices:[
  {t:'전부 외운다',s:'수비 ↑ 리더십 ↑ 피로 ↑',run:p=>{
    grow(p,p.pos==='pitcher'?{control:1.4,crisis:1.6}:{defense:2.0,mental:0.8});
    tend(p,{diligence:6,leadership:3});p.fatigue=clamp(p.fatigue+6,0,100);
    rel(p,'coach',7);
    return['다음 경기에서 그 타구가 정말 왔다.'];}},
  {t:'몸이 기억하게 둔다',s:'스트레스 ↓ 코치 관계 ↓',run:p=>{
    p.stress=clamp((p.stress||20)-5,0,100);rel(p,'coach',-5);
    return['머리로 하는 수비는 늦다고 생각했다.'];}}
 ]}),
EV({id:'TC_PIT_1',cul:'투수',w:6,pos:'pitcher',when:p=>p.lv!=='2군',
 title:'투수진 회의',
 text:p=>`투수조 전원이 모였다.\n"이번 주 불펜 운용, 누가 하루 더 던질래."`,
 choices:[
  {t:'손을 든다',s:'팀 관계 ↑ 피로 ↑ 부상 위험 ↑',run:p=>{
    rel(p,'team',12);rel(p,'manager',8);p.fatigue=clamp(p.fatigue+16,0,100);
    p.injRisk=(p.injRisk||0)+.2;tend(p,{leadership:5,competitive:4});
    flagAt(p,'tookTheBall');
    return['아무도 손을 안 들 때 드는 손의 무게가 있다.'];}},
  {t:'몸 상태를 솔직히 말한다',s:'코치 관계 ↑ 팀 관계 ↓',run:p=>{
    rel(p,'coach',8);rel(p,'team',-5);tend(p,{patience:4});
    return['"솔직한 게 낫지." 코치는 그렇게 말했다.'];}}
 ]})
];

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
 run:p=>{p.teamBoost=(p.teamBoost||0)+3;}},
/* ── v3.0 추가 — 조합이 서사와 v3 시스템 양쪽에 걸린다 (요구 25) ── */
{id:'C_GLASSIRON',need:['유리몸','철인'],title:'이상한 몸',
 text:'몸은 늘 어딘가 아팠다. 그런데 정작 중요한 경기에는 매번 이름이 있었다.\n트레이너는 그를 "설명이 안 되는 선수"라고 불렀다.',
 run:p=>{p.clutchBonus+=5;grow(p,{mental:2.5});flag(p,'ironWill');
   p.timeline.push({y:G.cal.year,m:G.cal.month,t:'아픈 몸으로 큰 경기를 지켰다'});}},
{id:'C_HITWAR',need:['홈런왕','안타왕'],title:'타격왕 논쟁',
 text:'"둘 중 뭐가 진짜냐"는 논쟁이 야구 게시판을 한 달째 덮었다.\n정작 본인은 인터뷰에서 "둘 다 하면 되죠"라고 말했다.',
 run:p=>{p.media=clamp((p.media||50)+14,0,100);p.fanRating=clamp(p.fanRating+6,0,100);
   rel(p,'fan',10);tend(p,{star:8});}},
{id:'C_MENTOR',need:['주장감','팀플레이어'],title:'다음 세대',
 text:'2군에서 올라온 선수들이 제일 먼저 찾는 사람이 됐다.\n감독보다 그의 말을 먼저 듣는다는 이야기가 프런트에도 들어갔다.',
 run:p=>{rel(p,'rookie',18);rel(p,'team',12);tend(p,{leadership:8});
   flag(p,'mentoredRookie');p.teamBoost=(p.teamBoost||0)+1.2;}},
{id:'C_LONER',need:['독고다이','악동'],title:'혼자 가는 사람',
 text:'성적은 나온다. 다만 그의 이름 옆에는 늘 다른 이야기가 붙는다.\n구단은 그를 쓰면서도 재계약 이야기는 미룬다.',
 run:p=>{p.media=clamp((p.media||50)+12,0,100);rel(p,'front',-12);rel(p,'team',-10);
   p.clutchBonus+=4;flag(p,'troubleMaker');}},
{id:'C_LATEBLOOM',need:['대기만성','자기관리'],title:'서른을 넘어서',
 text:'서른둘. 동기들은 대부분 유니폼을 벗었다.\n그는 이번 겨울에도 훈련 스케줄을 새로 짰다.',
 run:p=>{grow(p,{stamina:2.5,mental:2});p.stress=clamp((p.stress||20)-10,0,100);
   tend(p,{diligence:8});p.timeline.push({y:G.cal.year,m:G.cal.month,t:'서른 넘어 다시 성장하다'});}},
{id:'C_CLUTCHK',need:['승부사','위기관리의 달인'],title:'8회의 남자',
 text:'감독은 경기 후반이 되면 그를 먼저 본다.\n"저 친구 눈빛이 바뀌는 순간이 있어요."',
 run:p=>{p.clutchBonus+=7;grow(p,{[W(p).key]:1.5});rel(p,'manager',10);}}
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
    {p:.65,label:'후배 관계 ↑ 리더십 ↑',res:{rel:{rookie:18},tend:{leadership:10,social:6},flag:'mentor',
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
 text:p=>`${W(p).coach}가 ${W(p).craft}을 손보자고 한다.\n"두 달만 참으면 완전히 달라질 거다. 대신 그동안은 성적이 떨어질 수 있어."`,
 choices:[
  {t:'두 달을 투자한다',risk:'RISK',reveal:'FULL',outcomes:[
    {p:.55,label:'핵심 능력 큰 성장',res:{stKey:[3.5,2.2],rel:{coach:15},text:'두 달 뒤, 몸이 다르게 움직이기 시작했다.'},bias:{diligence:.9}},
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
    {p:.75,label:'팬 평가 ↑',res:{fan:8,media:5,tend:{star:6},fatigue:10,flag:'fanFavorite',
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
    {p:.80,label:'리더십 ↑ 팀 전체 상승',res:{tend:{leadership:14},rel:{rookie:20,coach:10},
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
