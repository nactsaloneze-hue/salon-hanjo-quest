const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),dir=fs.existsSync(path.join(root,'public','index.html'))?path.join(root,'public'):root;
const sources=Object.fromEntries(['data.js','logic.js','growth.js','buildings.js','scene.js','management-data.js','management.js','app.js'].map(f=>[f,fs.readFileSync(path.join(dir,f),'utf8')]));
function runModelChecks(sources) {
 const assert=(v,m)=>{if(!v)throw Error(m);},equal=(a,b,m)=>assert(JSON.stringify(a)===JSON.stringify(b),m);
 const c={};for(const f of ['data.js','management-data.js','management.js'])new Function('window',sources[f])(c);
 const M=c.QuestManagement,D=c.QUEST_DATA,balanced=[1,1,2,1,2,0,2,0,1,0,2,0];
 assert(new Set(D.questions.map(q=>q.text)).size===12,'12 distinct questions');assert(new Set(D.questions.map((q,i)=>Array.from({length:4},(_,v)=>M.plan(q.axis,v,i).title).join('|'))).size===12,'12 distinct option sets');
 const position=[],style=[];let balanceWins=0,seenLevels=new Set(),rescues=0,example=null,declines=0;
 function accounting(s){assert(s.cash===650000+s.totalProfit,'cash identity');assert(s.totalRevenue===s.history.reduce((a,h)=>a+h.revenue,0),'revenue sum');for(const h of s.history){assert(h.cash===h.before.cash+h.profit,'ledger');assert(h.revenue===h.customers*10000,'sales');assert(h.costs===h.materials+h.fixed+h.maintenance+h.investment+h.eventCost,'cost sum');assert(h.profit===h.revenue-h.costs,'profit');assert(h.customerChange===h.customers-h.before.customers,'customer delta');assert(h.reputationDrivers.reduce((n,d)=>n+d.amount,0)===h.reputation-h.before.reputation,'reputation reasons sum');if(h.customerChange<0)assert(h.customerReasons.length>0,'customer decline reason');if(h.reputationChange<0)assert(h.reputationDrivers.some(d=>d.amount<0),'reputation decline reason');if(h.customerChange<0&&h.profit>0)assert(h.cashReason.includes('黒字'),'explain customer down cash up');if(h.profit<0)assert(h.cash<h.before.cash,'loss cannot increase cash');assert(h.level>=1&&h.level<=5,'level bounds');assert(h.reputation>=5&&h.reputation<=100,'reputation bounds');assert(h.eventCost>=0&&h.eventCost<=12000,'bounded random costs');seenLevels.add(h.level);if(h.level<h.before.level)declines++;}if(s.gameOver){assert(s.cash<=0,'bankruptcy');assert(s.history.length<=12,'stop at failure');}}
 for(let pos=0;pos<4;pos++){let wins=0,failures=0,bankrupt=0;for(let seed=1;seed<=1000;seed++){const a=Array.from({length:12},(_,q)=>M.order(q,seed)[pos]),s=M.replay(a,D,seed);accounting(s);wins+=M.success(s);failures+=!M.success(s);bankrupt+=s.gameOver;}assert(failures>0,'constant position cannot always win');position.push({position:'ABCD'[pos],wins,failures,bankrupt});}
 for(let v=0;v<4;v++){let wins=0,bankrupt=0;for(let seed=1;seed<=1000;seed++){const s=M.replay(Array(12).fill(v),D,seed);accounting(s);wins+=M.success(s);bankrupt+=s.gameOver;}assert(wins<1000,'constant strategy cannot always win');style.push({strategy:v,wins,bankrupt});}
 for(let seed=1;seed<=1000;seed++)balanceWins+=M.success(M.replay(balanced,D,seed));
 assert(balanceWins>=950,'rational low-budget mix resilient to bounded random events');
 assert(Math.max(...balanced.map(v=>M.approaches[v].cost))<=45000,'low budget');
 for(let seed=1;seed<=30000;seed++){const a=Array.from({length:12},(_,q)=>Math.floor(M.roll(seed,q,90)*4)),s=M.replay(a,D,seed);accounting(s);if(s.rescued){rescues++;if(!example)example={seed,answers:a,cash:s.cash,reputation:s.reputation};}}
 assert(rescues>0,'crisis recovery possible');equal([...seenLevels].sort(),[1,2,3,4,5],'all 5 buildings reachable');assert(declines>0,'decline possible');
 const answer=[2,1,2,1,2,0,2,0,1,0,2,0],a=M.replay(answer,D,111);equal(a,M.replay(answer,D,111),'repeat idempotent');
 const edited=answer.slice();edited[0]=3;const b=M.replay(edited,D,111);assert(a.cash!==b.cash,'editing changes results');
 equal(a.history.map(h=>h.event),b.history.map(h=>h.event),'editing cannot reroll events');
 const weak=M.replay([0,0,0,1,3],D,123),ready=M.replay([2,2,2,1,3],D,123);
 assert(weak.history[4].customers!==ready.history[4].customers,'same choice depends on past preparation');
 assert(weak.history[4].profit<0&&ready.history[4].profit>0,'same high investment can fail or profit by preparation');
 const comeback=M.replay([...Array(7).fill(3),...Array(5).fill(0)],D,1);assert(comeback.rescued&&!comeback.gameOver&&comeback.cash>=650000,'crisis to positive capital comeback');
 assert(weak.history[4].reasons.some(t=>t.includes('準備が足りず')),'preparation explanation');
 const p=M.replay([1,1,2,1,2,0,2,0,1,0,2,0],D,1);
 assert(p.history.length===12&&!p.gameOver,'balanced full run');
 assert(new Set(Array.from({length:12},(_,q)=>M.order(q,1).join(''))).size>1,'positions vary');
 return {seedTrialsPerStrategy:1000,position,style,lowBudgetWins:balanceWins,randomPaths:30000,recoveries:rescues,recoveryExample:example,levels:[...seenLevels].sort(),declines,checks:['cash/sales/cost/profit identities','no guaranteed constant-position or constant-strategy win','low budget balanced path resilient','high investment bankruptcy','prior preparation changes next result','event seeds repeat through edits','crisis recovery','5 building levels and declines']};
}
function runUiChecks(sources) {
 const assert=(v,m)=>{if(!v)throw Error(m);};
 function context(seed=1,saved={},blocked=false){
  let html='',timer=null,download=0;const handlers={},buttons=new Map(),drawn=[];
  function element(){return {focus(){},getBoundingClientRect(){return{top:0,bottom:350}},scrollIntoView(){}};}
  function lookup(selector){const m=selector.match(/data-action="([^"]+)"/);if(m){if(buttons.has(m[1]))return buttons.get(m[1]);const re=new RegExp('<button[^>]*data-action="'+m[1]+'"[^>]*>'),tag=html.match(re)?.[0];if(!tag)return null;const b={...element(),dataset:{action:m[1],turn:tag.match(/data-turn="(\d+)"/)?.[1],screen:tag.match(/data-screen="([^"]+)"/)?.[1]},disabled:/\sdisabled(?:\s|>)/.test(tag)};buttons.set(m[1],b);return b;}return selector==='.shop-stage'&&html.includes('class="shop-stage"')?element():null;}
  const app={set innerHTML(v){for(const b of buttons.values())b.isConnected=false;html=v;buttons.clear();},get innerHTML(){return html},focus(){},insertAdjacentHTML(_,v){html+=v},addEventListener(k,f){handlers[k]=f},querySelector:lookup,querySelectorAll(s){const el=lookup(s);return el?[el]:[];}};
  const storage={getItem(k){if(blocked)throw Error('blocked');return saved[k]||null},setItem(k,v){if(blocked)throw Error('blocked');saved[k]=v},removeItem(k){delete saved[k]}};
  const document={querySelector(s){if(s==='#app')return app;if(s==='#shop-name')return {value:'テスト <サロン>'};if(s==='#industry')return {value:'指圧院'};if(s==='#status')return {set textContent(v){drawn.push(v)}};return null;},body:{append(){}},createElement(tag){if(tag==='canvas')return {getContext(){return new Proxy({measureText(t){return{width:t.length*25}},fillText(t){drawn.push(t)},drawImage(){drawn.push('drawImage')}},{get(t,k){return k in t?t[k]:()=>{}}});},toBlob(fn){fn({type:'image/png'})}};return{click(){download++},remove(){}};}};
  let fresh=seed;const window={innerHeight:844,scrollTo(){},crypto:{getRandomValues(a){a[0]=fresh++;return a;}}};
  const timers={setTimeout(f){timer=f;return 1},clearTimeout(){timer=null}};
  class FakeImage{set src(v){this.onload?.();}}
  const nav={};const url={createObjectURL(){return 'blob:test'},revokeObjectURL(){}};
  for(const f of ['data.js','logic.js','growth.js','buildings.js','scene.js','management-data.js','management.js','app.js'])new Function('window','document','localStorage','setTimeout','clearTimeout','navigator','location','Image','Blob','File','URL',sources[f])(window,document,storage,timers.setTimeout,timers.clearTimeout,nav,{href:'https://nactsaloneze-hue.github.io/salon-hanjo-quest/'},FakeImage,class{},class{},url);
  return {capture(a){const b=lookup(`[data-action="${a}"]`);assert(b,'capture button missing');return()=>handlers.click({target:{closest(){return b}}});},window,saved,drawn,html:()=>html,download:()=>download,state(){return JSON.parse(saved['salon-quest-progress-v2']);},tick(){if(timer){const f=timer;timer=null;f()}},async click(a){const b=lookup(`[data-action="${a}"]`);assert(b,'button missing '+a);await handlers.click({target:{closest(){return b}}});},async start(){await this.click('setup');handlers.submit({target:{id:'setup-form'},preventDefault(){}});}};
 }
 return (async()=>{
  let full=0,over=0,edits=0;const safe=[1,1,2,1,2,0,2,0,1,0,2,0];
  for(const seed of [1,2,8,50,100,12345])for(const pattern of [safe,Array(12).fill(0),Array(12).fill(1),Array(12).fill(2),Array(12).fill(3)]){
   const t=context(seed),visited=[];await t.start();
   for(let q=0;q<12;q++){
    assert(t.html().includes(`問い ${q+1} / 12`),'question counter');visited.push(t.state().q);assert(new Set(visited).size===visited.length,'no repeated question during forward play');
    const displayed=Array.from(t.html().matchAll(/data-action="answer-(\d)"/g),m=>Number(m[1]));assert(JSON.stringify(displayed)===JSON.stringify(t.window.QuestManagement.order(q,t.state().seed)),'displayed order matches seeded choices');
    await t.click('answer-'+pattern[q]);
    const state=t.state(),m=t.window.QuestManagement.replay(state.answers,t.window.QUEST_DATA,state.seed);
    if(m.gameOver){assert(t.html().includes('尽きました'),'gameover rendered');assert(!t.html().includes('data-action="next"'),'cannot continue after bankruptcy');assert(t.html().includes('https://lin.ee/otxcMMq'),'LINE on gameover');const retry=context(seed,t.saved);assert(retry.html().includes('尽きました'),'bankruptcy resumes');await t.click('restart');assert(t.html().includes('どんなお店を'),'retry screen');assert(t.state().answers.length===0,'retry clears answers');assert(t.state().seed!==state.seed,'retry new seed');over++;break;}
    assert(t.html().includes('理由と費用の内訳'),'feedback available');assert(t.html().includes('前の資金')&&t.html().includes('＝ 今の資金'),'visible cash equation');if(m.history[q].customerChange<0)assert(t.html().includes('顧客が減った理由'),'visible decline reason');if(m.history[q].reputationChange<0)assert(t.html().includes('評判が下がった理由'),'visible reputation reason');assert(t.html().includes(`<h2>第${q+1}問の結果</h2>`),'answer displays result heading');
    assert(t.html().includes('イベント費用'),'event cost disclosed');
    await t.click('next');assert(t.html().includes(`問い ${q+1} / 12`),'animation lock');
    t.tick();await t.click('next');
    if(q%4===3){assert(t.html().includes('育成イベント'),'chapter event');await t.click('event-0');const staleContinue=t.capture('continue');await staleContinue();const once=t.state().q;await staleContinue();assert(t.state().q===once,'stale continue does not skip question');}
    if(q===11){assert(t.html().includes('ここまで育ちました！'),'completed result');assert(t.html().includes('https://lin.ee/otxcMMq'),'LINE result');assert(t.html().includes('テスト &lt;サロン&gt;'),'escaped store name');const done=context(seed,t.saved);assert(done.html().includes('ここまで育ちました！'),'result reload');await t.click('save-image');assert(t.download()===1,'PNG save code path');assert(t.drawn.includes('drawImage'),'store SVG drawn');await t.click('review-answers');await t.click('edit-0');const snapshot=t.state(),prefix=t.window.QuestManagement.replay(snapshot.answers.slice(0,1),t.window.QUEST_DATA,snapshot.seed);assert(t.html().includes('>'+prefix.cash.toLocaleString('ja-JP')+'円</strong>'),'review shows finances at that question');const reload=context(seed,t.saved);assert(reload.html().includes('>'+prefix.cash.toLocaleString('ja-JP')+'円</strong>'),'review reload keeps historical finances');await t.click('answer-'+((pattern[0]+1)%4));t.tick();if(!t.html().includes('尽きました')){await t.click('next');assert(t.html().includes('ここまで育ちました！'),'edited result');}edits++;full++;}
   }
  }
  // 再読み込みで途中の回答、イベント、資金が変わらない。
  const t=context(7);await t.start();await t.click('answer-2');const before=t.state(),money=t.window.QuestManagement.replay(before.answers,t.window.QUEST_DATA,before.seed).cash;
  await t.click('answer-2');const after=t.state();assert(JSON.stringify(before.answers)===JSON.stringify(after.answers),'no duplicate choice accumulation');
  t.tick();const staleNext=t.capture('next');await staleNext();const at=t.state().q;await staleNext();assert(t.state().q===at,'stale next cannot advance twice');await t.click('back');const resumed=context(99,t.saved),r=resumed.state();assert(r.seed===before.seed,'seed persists');assert(resumed.window.QuestManagement.replay(r.answers,resumed.window.QUEST_DATA,r.seed).cash===money,'cash persists');
  const future={...before,screen:'question',q:0,answers:Array(12).fill(3)};const historical=context(99,{'salon-quest-progress-v2':JSON.stringify(future)});assert(historical.state().screen==='question','future bankruptcy does not prematurely end historical review');
  const noStore=context(1,{},true);assert(noStore.html().includes('自動保存できません'),'storage failure notice');await noStore.start();await noStore.click('answer-2');assert(noStore.html().includes('理由と費用の内訳'),'play without storage');
  const corrupt=context(1,{'salon-quest-progress-v2':'{"version":2,"seed":1,"screen":"gameover"}'});assert(corrupt.html().includes('お店の物語をはじめる'),'invalid save discarded');
  return {full12QuestionFlows:full,gameOverAndRetryFlows:over,answerReviewFlows:edits,checks:['result and gameover LINE href','seed/answers/cash resume','double-click idempotence','animation lock','PNG save handler with canvas doubles','storage blocked and invalid save fallback','unique questions/option sets','visible decline and cash explanations','historical finances on review','stale next/continue guarded'],limitation:'DOM/canvas test doubles; actual browser rendering and real PNG output remain unverified'};
 })();
}
(async()=>{const model=runModelChecks(sources),ui=await runUiChecks(sources);console.log(JSON.stringify({model,ui},null,2));})().catch(e=>{console.error(e);process.exitCode=1;});

