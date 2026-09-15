# 야구 인생 v3.0 설계안 — STEP 1~3

> 목표: "시즌을 결산하는 게임"에서 **"한 달 한 달을 살아가는 게임"**으로.
> 이 문서는 코드를 쓰기 전 합의용입니다. 승인 후 Phase 1부터 착수합니다.

작성 기준 코드: 분할본 v2.1 (`js/1-core.js` ~ `js/dev-balance-test.js`)

---

## STEP 1 — 현재 구조 분석

### 1-1. 게임 루프의 실체

게임 전체가 **고정 길이 배열 하나**로 돌아갑니다.

```js
// 6-ui.js:11  [13] UI — 상태
const PHASES=['seasonStart','train','event','moment1','seg1','event','moment2','seg2',
              'train','teamEvent','moment3','seg3','rank','ksMoment','post','award','traits',
              'combo','nat','trade','fa','retire','leagueOff','yearEnd'];

// 6-ui.js:208
function advance(){
  if(G.ui&&G.ui.after){G.ui.after=0;G.pi--;}   // 결과 화면이면 같은 페이즈 재진입
  G.pi++;
  if(G.pi>=PHASES.length)G.pi=0;                // 24개 다 돌면 처음으로
  const r=runPhase(PHASES[G.pi]);
  if(r==='skip')return advance();               // 조건 미달이면 즉시 다음 페이즈
}
```

`G.pi`(phase index)가 유일한 시간 커서입니다. 한 바퀴 = 1시즌.
`runPhase()`는 24개 `case`의 스위치이고, 각 case는 `scene({...})`을 호출하거나 `'skip'`을 돌려줍니다.

**이 구조의 좋은 점**: 페이즈는 이미 "토큰 하나 = 화면 하나"로 정규화돼 있습니다.
v3.0은 이 스위치를 버리는 게 아니라, **배열을 고정값에서 캘린더 생성물로 바꾸면 됩니다.** (STEP 3-1)

### 1-2. 시간 표현이 실제로 어디에 있나

시간 정보는 세 군데에 흩어져 있고, **전부 문자열 라벨**입니다.

| 위치 | 코드 | 성격 |
|---|---|---|
| `p.year` | `6-ui.js:295` `p.age++;p.year++` | 유일한 실제 시간 상태 |
| `SEGS` | `6-ui.js:14` `{seg1:'4~5월',frac:.34}` | 3구간 × 경기 비중 |
| `when` 라벨 | `scene({when:'${p.year}년 7월 · 올스타 휴식기'})` | 화면에 찍는 문자열. 로직 아님 |

즉 **"월"이라는 개념은 표시용 문자열로만 존재하고, 상태로는 없습니다.** 새로 만들어야 합니다.

### 1-3. 시즌 시뮬레이션은 이미 비율 기반

가장 중요한 발견입니다.

```js
// 5-player.js:155
function simHalf(p,half,bonus,frac,seg){
  frac=frac||.5;
  const starts=Math.max(1,Math.round((p.lv==='선발'?30:52)*frac));   // 경기수 = 시즌치 × frac
  let gm=Math.round((p.lv==='주전'?144:88)*frac*catcherF);
  ...
  p.fatigue += (42*full*frac*2)*(1+tEff(p,'staminaCost')) - ...      // 피로도 = frac 비례
  expGrowth(p,full*frac*2);                                          // 성장 = frac 비례
  rollInjury(p,full*frac*2);                                         // 부상 = frac 비례
}
```

`frac`만 바꿔 주면 **경기수·성적·피로·성장·부상이 전부 자동으로 스케일됩니다.**
3구간(.34/.33/.33) → 6개월(월별 비중)로 바꾸는 데 시뮬레이션 코드 수정이 사실상 필요 없습니다. 이게 v3.0을 현실적으로 만드는 핵심입니다.

**단, 아래 1-4의 부상 판정만 예외입니다.**

### 1-4. 부상 판정은 호출 횟수에 민감 (밸런스 리스크)

```js
// 5-player.js:250
function rollInjury(p,full){
  let c=.055*full*(1+(p.fatigue-40)/110)*...;
  if(!R.c(clamp(c,.01,.6)))return null;   // ← 호출당 주사위 1번
  ...
}
```

`full`에 비례하지만 **판정은 호출당 1회**입니다.
- 현재: 3회 × 확률 c → 무부상 확률 `(1-c)³`
- v3.0: 6회 × 확률 c/2 → 무부상 확률 `(1-c/2)⁶`

기댓값(연간 부상 횟수)은 같지만 분포가 달라집니다. 특히 `clamp(c,.01,.6)`의 상한에 걸리는 고피로 구간에서 v3.0이 **부상이 더 자주 납니다**. Phase 5에서 반드시 재측정하고 `.055` 계수를 조정해야 합니다. (현재 기준값: 커리어당 부상 2.3회)

### 1-5. 플레이어는 리그 밖에 있다

v3.0의 11·12번(1군/2군, 콜업) 항목에 직결되는 구조적 문제입니다.

```js
// 4-league.js:77  AI는 팀 내 경쟁으로 1군/2군이 갈린다
function assignRoles(){
  const NEED={batter:11,catcher:3,pitcher:13}, ONE={batter:8,catcher:2,pitcher:10};
  const arr=have.sort((a,b)=>(b.ovr+(b.lv==='1군'?1.5:0))-(a.ovr+...));
  arr.forEach((a,i)=>{ a.lv = i<ONE[pos] ? '1군' : '2군'; });   // 정원 밖이면 강등
}

// 5-player.js:130  플레이어는 절대 기준 하나로 혼자 결정된다
function decideLevel(p){
  const o=ovr(p);
  if(o>=62)return '주전';
  if(o>=52)return '백업';
  return p.age<=23?'2군':'백업';
}
```

**플레이어는 `L.players`에 들어 있지 않습니다.** 그래서
- 우리 팀에 나보다 잘하는 포수가 3명 있어도 나는 종합 62면 주전입니다
- `teamRating(tid)`도 플레이어를 뺀 전력으로 계산합니다
- 콜업/강등이 "사건"이 아니라 시즌 시작 시점의 조용한 재계산입니다

`competitionCheck(p)` (`5-player.js:660`)가 주전 경쟁을 서사로 보여주긴 하지만, **실제 승격/강등 판정과는 연결돼 있지 않습니다.**

### 1-6. 플레이어 객체 (`createPlayer`, 5-player.js:12)

```
name pos age year team teamsPlayed draftRound
st{} pot cond fatigue                      ← 능력치·컨디션·피로
traits[] traitLog[]
tend{diligence competitive leadership selfish loyalty star patience aggression social}
rel{manager vet team coach rookie front captain}
media nick choiceLog gameLog flags vet rival
season{} career{seasons[]} tot{} awards{} post{} nat{}
injuries[] timeline[] fanRating fame
lv seasonsPlayed peakAge bestWar trainCount gamesTotal seenEvents clutchBonus teamBoost retired
```

### 1-7. 저장

```js
// 6-ui.js:564
async function save(){
  const resume=(u.choices||u.after)?G.pi:G.pi+1;   // 페이즈 인덱스를 저장
  await Store.set('save_v1',{p:G.p,resume,tq:G.tq,L});
}
```

세이브 = `{플레이어, 페이즈 인덱스, 특성 대기열, 리그 전체}`. 약 270KB.
`resume`이 `PHASES` 배열의 인덱스이므로 **배열이 바뀌면 기존 세이브는 반드시 깨집니다.** (→ 폐기 결정)

---

## STEP 2 — 충돌 지점

### 2-1. 요구사항 39개 항목 현황

먼저 **이미 구현돼 있어서 다시 만들면 안 되는 것들**입니다.

| 요구 | 상태 | 근거 |
|---|---|---|
| 7. 능력치 변화 시각화 `72 → 74 ▲ +2` | ✅ **완료** | `diffHtml()` 5-player.js:569 — 이전값·현재값·증감·미니바까지 이미 렌더 |
| 8. 확률 선택지 | ✅ **완료** | `outcomes[{p,label,res,bias}]` + `oddsHtml()` 5-player.js:537, 공개수준 FULL/PARTIAL/RUMOR/HIDDEN |
| 13. AI 선수 DB | ✅ **완료** | `genWorld()` 4-league.js:52 — 300명, 전원 고유 능력치·잠재력·스타일 |
| 14. 가상 이름 + 실존 차단 | ✅ **완료** | `genName()` 1-core.js, `BLOCK` 22명 차단 목록 |
| 15. AI 성장·은퇴 | ✅ **완료** | `aiDevelop()` `aiRetire()` 4-league.js:261,277 |
| 16. 리그 뉴스 | ✅ **완료** | `genNews()` 5-player.js:711 |
| 17. 트레이드 | ✅ **완료** | `tradePhase()` 6-ui.js, `aiOffseason()` 4-league.js:301 |
| 18. 구단 성향 | ✅ **완료** | `CULTURE` 2-data-stats.js — fa/trade/youth/vet/style |
| 19. 구단 전용 이벤트 | 🟡 부분 | `TEAM_EVENTS` 존재하나 구단당 1~3개 (목표 5~10개) |
| 25. 특성 조합 스토리 | ✅ **완료** | `COMBO_EVENTS` 8종 |
| 28. 별명 | ✅ **완료** | `NICK_RULES` + `nickname()` 5-player.js:643 |
| 29. 커리어 타임라인 | ✅ **완료** | `p.timeline[]` |
| 30. 엔딩 | 🟡 부분 | 14종 존재, 새 시스템(돈·관계·2군)과 미연결 |
| 34. 랜덤성 | ✅ **완료** | World Seed + 매 게임 재생성 |

**즉 v3.0에서 실제로 새로 만들 것은 39개 중 12개 정도입니다.** 나머지는 연결 작업입니다.

### 2-2. 진짜 없는 것 (코드 전수 검색 결과)

| 요구 | 검색 결과 | 판정 |
|---|---|---|
| 2·3. 월 단위 시간 | `week` 0건, `month` 상태 0건 | **신규** |
| 11·12. 플레이어 콜업/강등 | 플레이어가 `L.players`에 없음 | **구조 변경** |
| 20·21. 돈/연봉 | `salary` 0건, `money`는 전부 구단 자금 | **신규** |
| 22. 슬럼프 | `p.slump` 0/1 플래그뿐, `simHalf`마다 즉시 해제 | **신규** |
| 23. 관계 8종 | `p.rel`에 7키 선언, 실제 사용은 `manager`·`vet`·`team` 3개뿐 | **절반 신규** |
| 26. 개인활동/스트레스 | `stress` 0건, `hobby` 0건 | **신규** |

### 2-3. 월간 시스템과 직접 충돌하는 코드 5곳

| # | 위치 | 충돌 내용 | 처리 |
|---|---|---|---|
| C1 | `PHASES` 고정 배열 (6-ui.js:11) | 1바퀴=1시즌이 하드코딩 | **캘린더 큐로 교체** |
| C2 | `G.pi` 정수 커서 (6-ui.js:210) | 월 개념 없음. 세이브 resume도 이 값 | **`G.cal{year,month,step}`로 교체** |
| C3 | `SEGS` 3구간 (6-ui.js:14) | 4~5 / 6~7 / 8~9월 2개월 묶음 | **`MONTHS` 12칸 테이블로 교체** |
| C4 | `trainMenu()`의 `when` (6-ui.js:302) | `G.pi<=1 ? '2월 스프링캠프' : '7월 올스타'` — **페이즈 인덱스로 달을 추측** | 캘린더가 달을 알려주므로 삭제 |
| C5 | `decideLevel(p)` (5-player.js:130) | 시즌당 1회, 절대 기준 | **월간 `levelCheck`로 교체** |

### 2-4. 손대면 안 되는 것 (그대로 재사용)

- `simHalf()` — `frac`만 월 단위로 넘기면 됨. 내부 수식 유지
- `finalizeSeason()` `awardsPhase()` `agingPhase()` `traitCheck()` `postseason()` — 연 1회 호출 유지
- `aiSeasonAll()` `simStandings()` `leagueAwards()` `aiOffseason()` — 리그 엔진 전체 유지
- `rollOutcome()` `applyResult()` `oddsHtml()` — 확률 선택지 엔진 유지
- `diffHtml()` `snapStats()` `statDiff()` — 능력치 시각화 유지

### 2-5. 덤으로 발견한 죽은 코드 231줄

`[32] UI v2.1`이 `[14]`·`[27]`의 함수를 **전부** 덮어쓰고 있습니다. 로드 순서상 `[14]`·`[27]` 버전은 한 번도 실행되지 않습니다.

```
[14] 165줄 → render viewTitle viewCreate viewGame boardHtml statPanel
             traitPanel relPanel sceneHtml infoTabs  … 10개 전부 죽음
             (recTable, careerTable 2개만 살아 있음)
[27]  66줄 → viewEnding viewHof … 2개 전부 죽음
[15]        → trainMenu seasonSummaryHtml viewEnding viewHof 죽음
[16]        → choose setTab 죽음
```

v3.0은 UI를 전면 개편하므로, **Phase 1에서 이 231줄을 먼저 제거**합니다. 안 그러면 "어느 `render()`를 고쳐야 하지?"를 매번 고민하게 됩니다.

---

## STEP 3 — v3.0 아키텍처

### 3-1. 캘린더 큐 — 핵심 변경 하나

`PHASES` 고정 배열을 **월이 생성하는 페이즈 큐**로 바꿉니다. `runPhase()`의 24개 case는 **그대로 둡니다.**

```js
/* 7-calendar.js (신규) */
G.cal = { year:2026, month:1, queue:[] };

// 월 → 페이즈 토큰 배열. 기존 페이즈 이름을 그대로 재사용한다.
function buildMonth(m){
  const p=G.p;
  switch(m){
  case 1:  return ['monthStart','action'];                          // 비시즌
  case 2:  return ['monthStart','action','event'];                  // 스프링캠프
  case 3:  return ['monthStart','action','rosterSet'];              // 개막 엔트리 발표
  case 4: case 5: case 6:
  case 7: case 8: case 9:
           return ['monthStart','action','games','moment','levelCheck'];
  case 10: return ['monthStart','rank','ksMoment','post'];
  case 11: return ['award','traits','combo','nat'];                 // 시즌 결산
  case 12: return ['monthStart','action','trade','fa','retire','leagueOff','yearEnd'];
  }
}

function advance(){
  if(G.ui&&G.ui.after){G.ui.after=0;G.cal.queue.unshift(G.cal.last);}
  if(!G.cal.queue.length){                 // 이번 달 끝 → 다음 달
    G.cal.month++;
    if(G.cal.month>12){G.cal.month=1;}
    G.cal.queue=buildMonth(G.cal.month);
  }
  const ph=G.cal.queue.shift(); G.cal.last=ph;
  if(runPhase(ph)==='skip')return advance();
}
```

**이 설계의 의미**
- `runPhase()`의 기존 case(`event` `moment1` `rank` `post` `award` `traits` `combo` `nat` `trade` `fa` `retire` `leagueOff` `yearEnd`)가 전부 살아남습니다. 이름만 재배치.
- 새로 추가되는 case는 `monthStart` `action` `games` `rosterSet` `levelCheck` 5개뿐입니다.
- **주간 확장이 공짜입니다.** `buildMonth()`가 `['action']` 대신 `['action','action','action','action']`을 돌려주면 그대로 주간 4칸이 됩니다. UI만 4칸으로 그리면 끝.

### 3-2. 월별 경기 비중

`SEGS` 3칸 → 12칸 테이블. **합이 1.00**이어야 기존 시즌 총량(피로·성장·부상·성적)이 보존됩니다.

```js
const MONTHS=[
 {m:1, label:'1월',  season:false, frac:0,   note:'비시즌'},
 {m:2, label:'2월',  season:false, frac:0,   note:'스프링캠프'},
 {m:3, label:'3월',  season:false, frac:0,   note:'시범경기'},
 {m:4, label:'4월',  season:true,  frac:.16},
 {m:5, label:'5월',  season:true,  frac:.19},
 {m:6, label:'6월',  season:true,  frac:.17},
 {m:7, label:'7월',  season:true,  frac:.14, note:'올스타 휴식기'},
 {m:8, label:'8월',  season:true,  frac:.17},
 {m:9, label:'9월',  season:true,  frac:.17},
 {m:10,label:'10월', season:false, frac:0,   note:'포스트시즌'},
 {m:11,label:'11월', season:false, frac:0,   note:'시즌 결산'},
 {m:12,label:'12월', season:false, frac:0,   note:'오프시즌'}
]; // 4~9월 합계 = 1.00
```

`games` 페이즈는 `simHalf(p, '7월', bonus, .14, {m:[7]})`를 호출합니다. **`simHalf` 수정 불필요** (`seg.m` 배열만 단일 월로).

### 3-3. 월간 행동과 Trade-off (요구 3·5)

`action` 페이즈. 선택지는 **상태에 따라 동적으로 생성**합니다.

```js
function monthActions(p){
  const list=[];
  if(p.status==='부상')      return [A.rehab, A.lightTrain, A.rest];      // 재활 중엔 제한
  if(p.status==='재활')      list.push(A.rehab);
  list.push(A.teamTrain, A.soloTrain);
  if(MONTHS[G.cal.month-1].season) list.push(p.lv==='2군' ? A.farmGame : A.pushForStart);
  list.push(A.rest, A.hobby, A.relation);
  if(p.stress>=70)           list.push(A.escape);        // 스트레스 높을 때만
  if(p.slump.active)         list.push(A.coachTalk);     // 슬럼프일 때만
  return list;
}
```

**모든 행동에 명시적 대가를 둡니다.** 기존 `INTENSITY`(안전/평소/한계)와 `outcomes` 확률 시스템을 그대로 씁니다.

| 행동 | 얻는 것 | 잃는 것 |
|---|---|---|
| 팀 훈련 | 팀워크 +2, 감독 +2, 능력 +1 | 피로 +7 |
| 개인 훈련 | 능력 +2~4 | 피로 +12, 부상위험 +3, 감독 관계 변화 없음 |
| 휴식 | 피로 −15, 체력 +8, 컨디션 ↑ | 성장 0, **감독 신뢰 −2** |
| 개인활동 | 스트레스 −10, 팬 인기 +2 | 성장 0, 돈 −  |
| 인간관계 | 관계 +5, 장기 플래그 | 피로 +3, 성장 0 |
| 무리해서 출전 | 팀 기여 +5, 투혼 특성 후보 | 60/30/10 확률로 부상 |

핵심 원칙: **"항상 이게 정답"인 버튼이 없어야 합니다.** 개인 훈련만 6개월 누르면 스트레스·감독 신뢰가 무너지고, 휴식만 누르면 성장이 멈춥니다.

### 3-4. 플레이어를 리그에 편입 (요구 11·12)

**가장 구조적인 변경입니다.** 플레이어의 그림자 엔트리를 `L.players`에 넣습니다.

```js
/* 4-league.js 확장 */
function syncPlayerEntry(p){
  let e=L.players.find(a=>a.isPlayer);
  if(!e){ e={id:'ME',isPlayer:true}; L.players.push(e); }
  Object.assign(e,{ name:p.name, pos:p.pos, age:p.age, team:p.team,
                    ovr:ovr(p), pot:p.pot, retired:p.retired, lv:p.lv, role:p.role });
  return e;
}
```

그러면 기존 `assignRoles()`가 **수정 없이** 플레이어를 팀 내 정원 경쟁에 포함시킵니다.
`decideLevel()`은 절대 기준 계산에서 **그림자 엔트리 조회**로 바뀝니다.

```js
function levelCheck(p){
  const before=p.lv;
  syncPlayerEntry(p); assignRoles();
  const e=L.players.find(a=>a.isPlayer);
  p.lv = e.lv==='2군' ? '2군' : e.role;     // '주전'|'백업'|'선발'|'불펜'|'2군'
  if(before==='2군' && p.lv!=='2군') return firstCallUp(p) || callUpScene(p);
  if(before!=='2군' && p.lv==='2군') return demotionScene(p);
  return 'skip';
}
```

효과:
- 우리 팀 포수 depth에 나보다 나은 선수가 있으면 **종합 65여도 2군**입니다
- 트레이드로 팀을 옮기면 출전 기회가 실제로 바뀝니다 (구단 성향과 연결)
- 매월 판정하므로 **시즌 중 콜업/강등**이 자연스럽게 사건이 됩니다
- `teamRating()`에 플레이어가 포함돼 내 성적이 팀 순위에 반영됩니다

**첫 콜업(요구 12)** 은 `p.flags`에 `firstCallUp`이 없을 때만 뜨는 전용 연출 + `p.timeline.push({y,m,t:'프로 1군 데뷔'})`.

### 3-5. 새 상태 스키마

`createPlayer()`에 추가할 필드입니다. **기존 필드는 하나도 건드리지 않습니다.**

```js
// v3.0 추가분
cal:      { debutMonth:null },
status:   '정상',                                  // 정상 | 부상 | 재활
stress:   20,                                     // 0~100. 높으면 컨디션·성장 페널티
money:    { balance: 3000, salary: 3000,          // 만원 단위
            signBonus: 0, contractYears: 3, marketValue: 3000 },
slump:    { active:false, since:null, depth:0 },  // 기존 0/1 플래그를 객체로 승격
rel:      { manager:50, vet:45, team:50, coach:50,
            rookie:50, front:50, captain:50, fan:50 },   // 7키 전부 실사용 + fan 추가
relLog:   [],                                     // 관계 사건 기록 (요구 24)
monthLog: [],                                     // 이번 달에 일어난 일 (메인 화면 "최근 사건")
goal:     null                                    // 현재 목표 (요구 31)
```

`G` 상태:
```js
G.cal = { year:2026, month:1, queue:[], last:null };   // G.pi 대체
```

**관계는 숫자가 아니라 단계로 보여줍니다** (요구 23):
```js
const REL_TIER=[[0,'불편함'],[25,'경계'],[40,'중립'],[58,'신뢰'],[75,'존중'],[90,'각별함']];
```

### 3-6. 장기 플래그 — "2026년의 선택이 2033년에 돌아온다" (요구 24·27)

기존 `p.flags[]`(문자열 배열)와 `p.seenEvents[]`를 그대로 쓰되, **시점을 기록**합니다.

```js
function flagAt(p,f,meta){                        // 기존 flag() 확장
  if(p.flags.includes(f))return;
  p.flags.push(f);
  p.relLog.push({y:G.cal.year, m:G.cal.month, f, ...meta});
}
```

이벤트 조건에 `when:p=>p.flags.includes('helpedVeteran') && p.year-flagYear(p,'helpedVeteran')>=5` 형태를 쓸 수 있게 됩니다. 이게 요구 24의 "선배가 5년 뒤 코치로 돌아온다"를 가능하게 하는 유일한 장치입니다.

### 3-7. 메인 화면 (요구 6·31·32)

```
┌────────────────────────────────┐  ← sticky 상단
│ 2029년 7월        24세 · 프로 6년차 │
│ 서울 블루스   1군 · 포수            │
├────────────────────────────────┤
│ 컨디션 😊   체력 78   피로 21      │  ← 한 줄 상태바
│ 팬 인기 64  스트레스 34  1.2억      │
├────────────────────────────────┤
│ 이번 시즌  .318  21홈런  74타점     │
│           WAR 4.8                │
├────────────────────────────────┤
│ 최근  · 6월 3주 4안타 경기          │  ← monthLog
│      · 감독과 면담                 │
├────────────────────────────────┤
│ 이번 달 무엇을 할까?                │
│ [ 팀 훈련 ]  피로+7 감독+2         │  ← 대가를 버튼에 같이 표시
│ [ 개인 훈련 ] 능력+3 피로+12 부상+3 │
│ [ 경기 집중 ]                      │
│ [ 휴식 ]     피로-15 감독-2        │
│ [ 개인활동 ] 스트레스-10           │
└────────────────────────────────┘
```

기존 `boardHtml()`을 이 레이아웃으로 교체하고, 하단 5탭 네비게이션(경기·선수·리그·기록·역사)은 유지합니다.
모바일: 상단 고정 / 중앙 스크롤 / 하단 행동 버튼(최소 높이 60px 유지).

### 3-8. 파일 배치

기존 6파일 구조를 유지하고 **2개만 추가**합니다.

```
js/
├── 1-core.js            (유지)
├── 2-data-stats.js      + ACTIONS, HOBBIES, REL_TIER, MONTHS
├── 3-data-story.js      + 장기 플래그 이벤트, 구단 이벤트 확충
├── 4-league.js          + syncPlayerEntry()  ← 플레이어 편입
├── 5-player.js          + 돈·스트레스·슬럼프·관계 엔진
├── 6-calendar.js  ★신규  캘린더 큐 · buildMonth · advance · 월간 행동
├── 7-ui.js              (기존 6-ui.js에서 죽은 231줄 제거 + 메인 화면 개편)
└── dev-balance-test.js  (월간 루프에 맞춰 수정)
```

`6-calendar.js`가 `7-ui.js`보다 **먼저** 로드돼야 합니다 (`advance()`를 UI가 호출하므로).
React + Vite 이전 시 `calendar.ts` / `lifeEngine.ts`로 1:1 대응됩니다.

### 3-9. 저장

```js
Store.set('save_v3', { p:G.p, cal:G.cal, tq:G.tq, L });
// 부팅 시 save_v1 삭제 (v2.1 세이브 폐기 결정)
```
`resume`(페이즈 인덱스) → `cal`(연/월/큐) 로 교체. 큐를 통째로 저장하므로 월 중간에서도 정확히 이어집니다.

### 3-10. Phase 계획

| Phase | 내용 | 검증 |
|---|---|---|
| **1** ✅ | 죽은 231줄 제거 → 캘린더 큐 → 월간 행동 → 메인 UI 개편 | **완료 — 아래 3-11 참고** |
| **2** | `syncPlayerEntry` → 월간 `levelCheck` → 첫 콜업/강등 연출 | 1군 200명 유지, 플레이어가 depth 경쟁에서 밀리는가 |
| **3** | 돈·연봉·스트레스·슬럼프·개인활동·관계 8종 | 19세 3천만 → 30세 FA 15억 곡선이 나오는가 |
| **4** | 장기 플래그 · 구단 이벤트 확충 · 엔딩 연동 | 5년 전 선택이 회수되는 이벤트가 실제로 뜨는가 |
| **5** | 자동 플레이 100~500회 밸런스 재측정 | 아래 기준표 |

**Phase 5 기준값** (v2.1 520회 표본 대비)

| 지표 | v2.1 | v3.0 허용 범위 |
|---|---|---|
| 통산 WAR 중앙값 | 21.4 | 18~25 |
| 커리어 길이 | 15.3시즌 | 14~17 |
| 커리어당 부상 | 2.3회 | **2.0~2.8** (1-4 리스크 구간) |
| 리그 홈런왕 | 37.8개 | 30~40 |
| MVP 시즌 WAR | 6.2 | 5.5~7 |
| 1군 인원 | 200명 | 200 고정 |
| 엔딩 최다 빈도 | 26.2% | 30% 이하 |
| 2군 체류 비율 | — | 커리어 초반 2~4시즌 (신규 지표) |

---

## 3-11. Phase 1 구현 결과 (완료)

### 실제 월 배치

```
 1월  action                                     비시즌
 2월  action · event                             스프링캠프
 3월  seasonStart · action · rosterSet           개막 엔트리
 4월  action · games · moment
 5월  action · games · event · levelCheck
 6월  action · games · moment
 7월  action · games · teamEvent · levelCheck    올스타 휴식기
 8월  action · games · moment
 9월  action · games · rank                      정규시즌 종료
10월  ksMoment · post · action                   포스트시즌
11월  award · traits · combo                     시즌 결산
12월  action · nat · trade · fa · retire · leagueOff · yearEnd
```

이벤트 밀도는 v2.1과 동일하게 맞췄습니다 — `moment` 3회 / `event` 2회 / `teamEvent` 1회.
행동 슬롯은 연 **9회**입니다 (v2.1의 훈련 2회 대비 4.5배).

### 구현 중 발견하고 고친 밸런스 버그 2건

**① 피로 회복이 2배가 되던 버그** (`simHalf`)

```js
// v2.1 — 회복항만 frac에 비례하지 않았다
p.fatigue += (42*full*frac*2)*... - ab(p,'stamina')*.09;
```
호출이 3회에서 6회로 늘자 회복도 2배가 됐습니다. 실측에서 피로도가 한 해 내내 0~5에 붙어 있고 컨디션이 계속 '최고조'였습니다. 회복항도 `frac`에 비례시키고, 시즌 총 회복량이 v2.1과 **정확히 같아지도록** 계수를 `.09 → .135`로 보정했습니다 (`Σfrac*2 = 2`, `.135×2 = .27 = 3×.09`).

**② 훈련 기회 4.5배 → 커리어 WAR 폭등**

첫 측정에서 통산 WAR 중앙값이 21 → **28.8**, 25% 지점이 4.4 → **16**으로 튀었습니다. 실패한 커리어가 사라진 겁니다 (요구 35 위반). `TRAIN_SCALE=.52`로 회당 성장을 낮춰 연간 총 성장량을 v2.1 수준에 맞췄습니다.

### 검증 결과 (60커리어 자동 플레이)

| 지표 | v2.1 | v3.0 | 판정 |
|---|---|---|---|
| 통산 WAR 중앙값 | 19.3 | 17.9 | ✅ |
| WAR 25% 지점 | 4.4 | 9.1 | 🟡 실패 커리어 유지됨 |
| 커리어 길이 | 15.2시즌 | 15.9시즌 | ✅ |
| 커리어당 부상 | 2.3회 | 2.5회 | ✅ (1-4 리스크 구간 통과) |
| 리그 홈런왕 | 29.6 | 29.9 | ✅ 리그 엔진 무손상 |
| MVP 시즌 WAR | 6.4 | 6.4 | ✅ |
| AI 통산 1위 | 67.5 | 65.6 | ✅ |
| 1군 인원 | 200 | 200 | ✅ |
| 확률 합계 경고 | 0건 | 0건 | ✅ |

그 밖에: 3포지션 전부 은퇴까지 완주, 12개월 모두 통과, `pageerror` 0건, 모바일 390px 가로 스크롤 없음, 저장/이어하기 연·월·큐 정확 복원.

### Phase 2로 넘긴 것

`rosterSet` / `levelCheck` 페이즈는 **자리만 잡아뒀습니다.** 지금은 기존 `decideLevel()`(절대 기준)을 호출하므로 강등이 거의 발생하지 않습니다 (실측 콜업 1회 / 강등 0회). 3-4의 `syncPlayerEntry()`를 연결하면 이 두 페이즈가 그대로 실제 정원 경쟁 판정이 됩니다.

---

## 확인이 필요한 결정 3가지

1. **11월 결산을 한 화면으로 몰까요, 나눌까요?**
   현재 `award`→`traits`→`combo`→`nat`이 연속 4화면입니다. 월간으로 오면 11월 한 달에 4화면이 몰립니다. 그대로 두는 안 / 10월 포스트시즌 직후로 일부 분산하는 안.

2. **비시즌(1·2·3·11·12월) 5달이 너무 한가하지 않을까요?**
   경기가 없어 행동만 반복됩니다. 비시즌 전용 이벤트(자율훈련, 해외 캠프, 광고 촬영, 결혼, 가족)를 Phase 3에서 채울 계획인데, 부족하면 비시즌을 3칸(겨울/캠프/오프시즌)으로 압축하는 것도 가능합니다.

3. **2군 경기도 시뮬레이션할까요?**
   현재 `simHalf`는 2군을 `full=.24`로 축소 처리만 합니다. 요구 11의 "2군 성적 .342 → 콜업"을 제대로 하려면 2군 성적을 따로 누적해야 합니다. Phase 2에서 `p.farmSeason{}`을 추가하는 방향을 제안합니다.
