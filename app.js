(function(){
 'use strict';
 const D=window.QUEST_DATA,L=window.QuestLogic,G=window.QuestGrowth,Scene=window.QuestScene,app=document.querySelector('#app');
 const balanced={icon:'💐',type:'街の小さな名プロデューサー',tag:'街・想い・予約を、ひとつの物語に。',strength:'5つの軸をバランスよく整えていること。お店の魅力を来店までつなぐ土台があります。',weak:'今の土台を活かし、問い合わせや来店のきっかけを見ながら小さく改善しましょう。'};
 const types=[...D.axes,balanced],industries=['エステサロン','ネイルサロン','美容室','整体院','指圧院','その他の小規模実店舗'];
 let state={screen:'home',name:'',industry:industries[0],answers:[],q:0,rewards:[],event:0,eventSelected:null,memory:{parts:[],tokens:{}},lastChange:null,editMode:false};
 let collection=[];try{collection=JSON.parse(localStorage.getItem('salon-quest-collection')||'[]').filter(x=>Number.isInteger(x)&&x>=0&&x<=5);}catch(e){}
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const btn=(label,action,cls='primary',extra='')=>`<button type="button" class="${cls}" data-action="${action}" ${extra}>${label}</button>`;
 function growth(){return G.derive(state.answers,D);}
 function shop(preview=false,still=false){return Scene.render(growth(),state.memory,state.name,state.rewards,{activeAxis:state.lastChange?.axis,still,final:state.screen==='result'});}
 function giftNames(){return state.rewards.filter(Boolean).map(r=>D.events.flatMap(e=>e.choices).find(c=>c.reward===r)?.name||r);}
 function currentSummary(){const g=growth();return `<div class="live-summary" aria-label="現在の回答によるゲーム内の反応"><span>♡ SNS反応 <b>${g.hearts}</b></span><span>☆ 信頼 <b>${g.stars}</b></span><span>🚪 入店 <b>${g.entering}</b></span></div>`;}
 let unlockTimer=0,animationLock=false;
 function unlockNext(){animationLock=false;app.querySelectorAll('[data-action="next"]').forEach(b=>b.disabled=false);}
 function render(focus=true){
  const s=state.screen;
  if(s==='home')app.innerHTML=`<section class="hero"><p class="eyebrow">A LITTLE SHOP, A NEW STORY</p><h1>サロン繁盛クエスト</h1><p class="serif" style="font-size:19px;margin-top:7px">あなたのお店は、どこまで育つ？</p>${shop(true)}<p class="intro">静かな街角に、小さなお店がひとつ。<br>12の回答で、花や看板、人の動きが変わります。<br>3つの贈り物も選んで、お店の物語を育てよう。<br>最後に見つかるのは、集客の強みと次の一歩。</p><div class="chips"><span class="chip">約3〜5分</span><span class="chip">無料・登録不要</span><span class="chip">6つの店主タイプ</span></div>${btn('お店の物語をはじめる →','setup')}<p class="welcome-note">まずは小さなお店から。今のお店に近い回答で育てよう。</p></section>`;
  if(s==='setup')app.innerHTML=`<section class="setup"><p class="eyebrow">PROLOGUE / はじまりの準備</p><h1 style="font-size:30px">どんなお店を<br>育てましょう。</h1><p class="intro">いつものお店でも、架空のお店でも。</p><form id="setup-form" class="card"><label class="field" for="industry">お店の種類</label><select id="industry">${industries.map(x=>`<option ${x===state.industry?'selected':''}>${x}</option>`).join('')}</select><label class="field" for="shop-name">お店の名前 <span class="small">（任意）</span></label><input id="shop-name" maxlength="24" placeholder="例：こもれびサロン" value="${esc(state.name)}" autocomplete="off"><p class="small" style="margin:8px 0 22px">本名や連絡先の入力は不要です。</p><button class="primary wide" type="submit">小さなお店をオープン →</button></form><p class="small" style="margin-top:15px">回答は画面を閉じるとリセット。集めたタイプだけ、この端末に保存します。</p></section>`;
  if(s==='question'){
   const q=D.questions[state.q],a=state.answers[state.q];
   app.innerHTML=`<div class="row small"><span>CHAPTER ${Math.floor(state.q/4)+1} / 3</span><span>問い ${state.q+1} / 12</span></div><div class="progress" role="progressbar" aria-label="診断の進み具合" aria-valuemin="0" aria-valuemax="12" aria-valuenow="${state.q}"><span style="width:${state.q/12*100}%"></span></div><div class="shop-stage">${shop()}${currentSummary()}<div class="growth-feedback ${state.lastChange?'has-change':''}" role="status" aria-live="polite"><p>${state.lastChange?G.feedback(state.lastChange.axis,state.lastChange.value,growth()):'回答すると、お店に小さな変化が生まれます。'}</p>${state.lastChange?btn(state.editMode?'変化を見たら、結果に戻る →':'変化を見たら、次へ →','next','growth-next',animationLock?'disabled':''):''}</div></div><p class="scene-caption">${esc(state.name||'小さなお店')} · ${esc(state.industry)} ／ お客様・反応はゲームの表現です</p><section class="card qcard"><p class="axis-tag">${D.axes[q.axis].icon} ${D.axes[q.axis].name}</p><h2>${q.text}</h2><div class="options" role="group" aria-label="回答をひとつ選択">${q.choices.map((x,i)=>btn(`<span class="letter">${'ABCD'[i]}</span><span>${x}</span>`,`answer-${i}`,`option ${a===i?'selected':''}`,`aria-pressed="${a===i}"`)).join('')}</div><div class="actions">${state.q>0?btn('← 前の問い','back','textbtn'):'<span class="small">今の状態に近いものを。</span>'}${btn(state.editMode?'結果に戻る →':state.q%4===3?'街のお店へ →':'次へ →','next','primary',a===undefined||animationLock?'disabled':'')}</div></section>`;
  }
  if(s==='event'){
   const e=D.events[state.event],choice=state.eventSelected===null?null:e.choices[state.eventSelected];
   app.innerHTML=`<p class="eyebrow">CHAPTER ${state.event+1} CLEAR / 育成イベント</p>${shop()}<p class="scene-caption">章クリアの贈り物を選びましょう。人の動き・診断点は変わりません。</p><section class="card qcard">${choice?`<div class="reward toast"><div class="big">✨</div><p class="eyebrow">LEVEL UP · ${state.event+1}つめの宝物</p><h2>${choice.name}を獲得！</h2><p class="intro">${choice.tip}</p></div>${btn(state.event===2?'完成したお店を見る →':'次の章へ →','continue','primary wide')}`:`<h2>${e.title}</h2><p class="intro">${e.intro}</p><div class="options">${e.choices.map((c,i)=>btn(`<span>${i?'🌸':'🌿'}</span><span>${c.label}</span>`,`event-${i}`,'option')).join('')}</div>`}</section>`;
  }
  if(s==='result'){
   const result=L.diagnose(state.answers,D),t=types[result.type],best=D.axes[result.order[0].i];
   if(!collection.includes(result.type)){collection.push(result.type);try{localStorage.setItem('salon-quest-collection',JSON.stringify(collection));}catch(e){}}
   app.innerHTML=`<section id="result-card"><div class="finished-shop"><div class="result-head"><p class="eyebrow">YOUR GARDEN, YOUR STORY</p><p class="congrats">おめでとうございます！</p><h1 class="grown-title">あなたのお店は、<br>ここまで育ちました！</h1><p class="small">${esc(state.name||'小さなお店')} · ${esc(state.industry)}</p></div>${shop()}${currentSummary()}<p class="growth-wish">あなたのお店は、まだまだ成長できます！</p><p class="scene-caption">花やパーツは育てた思い出。人の動きは現在の回答から。<br>反応・お客様・入店はゲーム内の表現です。</p><div class="parts-collection"><h3>育てたお店の宝物</h3><p class="small">${Object.keys(state.memory.tokens).length}の回答の芽 · ${state.memory.parts.length}の集客パーツ · ${state.rewards.filter(Boolean).length}つの贈り物</p><div class="parts-tags">${[...state.memory.parts.map(id=>G.names[id]),...giftNames()].map(x=>`<span>🌿 ${x}</span>`).join('')}</div></div><div class="type-caption"><span class="type-icon">${t.icon}</span><div><p class="eyebrow">経営者タイプ</p><h2>${t.type}</h2><p class="quote">${t.tag}</p></div></div></div><div class="result-layout"><section class="card"><h3>🌿 集客の強み</h3><p>${result.scores[result.order[0].i]===0?'これから土台を育てるスタート地点。まずは下の小さなクエストから、お店に合う伝え方を見つけましょう。':t.strength}</p></section><section class="card"><h3>🌱 これから育てたいところ</h3><p>${t.weak}</p></section></div><section class="card" style="margin-top:16px"><h3>お店の集客、5つの現在地</h3><p class="small">回答に基づく自己診断スコア / 100点満点</p>${D.axes.map((a,i)=>`<div class="score-row"><div class="score-label"><span>${a.icon} ${a.name}</span><strong>${result.scores[i]} / 100</strong></div><div class="meter"><span style="width:${result.scores[i]}%"></span></div></div>`).join('')}</section><section class="card" style="margin-top:16px"><h3>次に育てる、3つのこと</h3><p class="small">点数の低い軸から。得点が高い場合は、磨き込みのヒントです。</p>${result.priorities.map((p,j)=>`<div class="priority"><span class="number">0${j+1}</span><div><strong>${D.axes[p.i].name}</strong><p>${p.score===100?D.axes[p.i].next:D.axes[p.i].action}</p></div></div>`).join('')}<div class="next-action"><h3>☀️ 今日の小さなクエスト</h3><p>${result.priorities[0].score===100?D.axes[result.priorities[0].i].next:D.axes[result.priorities[0].i].action}</p><p class="small">目安：10〜15分。ひとつできたら、今日はクリア。</p></div></section></section><div class="share-actions">${btn('お店の画像を保存','save-image','primary')}${btn('タイプをシェア','share','secondary')}</div><div class="no-print edit-action">${btn('回答を見直す・変更する','review-answers','textbtn')}</div><p id="status" class="status" role="status"></p><p class="small">保存した画像は写真アプリへ。画面のスクリーンショットでも残せます。</p><details><summary>点数・タイプ・育成の決まり方を見る</summary><p>回答ごとに0点なら芽、1〜3点ならつぼみや花が育ちます。5軸の累積点が1点以上で基本パーツ、100点換算で67点以上になると追加パーツを獲得。花と獲得パーツは回答を変更しても思い出として残ります。ハート・星・人の動きは現在の回答だけから再計算します。</p><p>地域性は街の人、お悩み解決は関心を持つ人、信頼は星、発信設計はハート。予約導線が累積3点以上で、地域性・お悩み解決・信頼のいずれかによる人の登場がある場合に入店します。ハートだけでは入店しません。ゲーム内の数は実際の予約数・売上を示しません。</p><p>店舗レベルは1＋回答済み数÷4の切り捨て＋獲得パーツ数÷2の切り捨て＋章の贈り物数です。診断点とは別です。</p><p>各回答を上から0・1・2・3点として、その質問の軸に加算。軸ごとに「獲得点 ÷ 満点 × 100」を四捨五入します。地域性・お悩み解決・信頼は各2問、発信設計・予約導線は各3問です。</p><p>原則、最高点の軸がタイプになります。同点なら地域性→お悩み解決→信頼・実績→発信設計→予約導線の順。全軸67点以上かつ最高と最低の差が20点以内なら、バランス型の「街の小さな名プロデューサー」です。</p><p>改善順は低得点の軸から。同点なら予約導線→地域性→お悩み解決→信頼・実績→発信設計の順。回答の点数は育成イベントでは変わりません。全軸0点でも同点ルールでタイプが出ますが、相対的な分類であり強さの認定ではありません。</p><p>この暫定版は自己申告による振り返りツールです。アカウントの実測・売上予測・成果保証は行いません。業種は表示にのみ利用し、採点ルールは共通です。</p></details><section class="card" style="margin-top:20px"><div class="row"><h3>店主タイプ図鑑</h3><span class="small">${collection.length} / 6 発見</span></div><div class="collection">${types.map((x,i)=>`<div class="collect-item ${collection.includes(i)?'found':''}"><span class="emoji">${collection.includes(i)?x.icon:'🌱'}</span>${collection.includes(i)?x.type:'まだ出会っていない店主'}</div>`).join('')}</div><p class="small" style="margin-top:12px">見つけたタイプのみ、この端末に保存されます。</p>${btn('図鑑の保存を消す','clear-collection','textbtn')}</section><section class="card consult"><p class="eyebrow">お店の物語を、もう一歩。</p><h2>その街だからこそ、<br>選ばれるお店へ。</h2><p>Instagramの改善だけでなく、お店がある街の特徴から、集客方法を考えてみませんか？</p><p>地域集客・商圏分析レポート付きコンサルティングをご案内しています。</p><a class="primary wide" href="https://forms.gle/yLKicMnk3ndTzZ2v9" target="_blank" rel="noopener noreferrer">相談・申し込みフォームを見る ↗</a><p class="small" style="margin-bottom:0">外部のGoogleフォームが開きます。診断の回答は引き継ぎません。</p></section><div class="actions no-print">${btn('もう一度、お店を育てる','restart','secondary wide')}</div>`;
  }
  if(s==='review')app.innerHTML=`<p class="eyebrow">お店をもう一度、見つめる</p><h2>回答を見直す</h2><p class="small">変更した回答で点数・人の動きを再計算します。育てた花と記念パーツは残ります。</p><div class="options">${D.questions.map((q,i)=>btn(`<span class="letter">${i+1}</span><span>${q.text}<small class="review-value">${q.choices[state.answers[i]]}</small></span>`,`edit-${i}`,'option')).join('')}</div><div class="actions">${btn('完成したお店へ戻る','return-result','primary wide')}</div>`;
  if(focus){window.scrollTo(0,0);app.focus({preventScroll:true});}
 }
 app.addEventListener('submit',e=>{if(e.target.id!=='setup-form')return;e.preventDefault();state.name=document.querySelector('#shop-name').value.trim();state.industry=document.querySelector('#industry').value;state.screen='question';render();});
 app.addEventListener('click',async e=>{
  const b=e.target.closest('[data-action]');if(!b||b.disabled)return;const a=b.dataset.action;
  if(a==='setup'){state.screen='setup';render();}
  if(a.startsWith('answer-')){
   const value=Number(a.split('-')[1]);state.answers[state.q]=value;
   state.memory=G.update(state.memory,growth());state.lastChange={axis:D.questions[state.q].axis,value};
   animationLock=true;clearTimeout(unlockTimer);render(false);
   app.querySelector(`[data-action="${a}"]`).focus({preventScroll:true});
   const scene=app.querySelector('.shop-stage');if(scene){const rect=scene.getBoundingClientRect();if(rect.top<0||rect.bottom>window.innerHeight)scene.scrollIntoView({behavior:'smooth',block:'start'});}
   unlockTimer=setTimeout(unlockNext,900);
  }
  if(a==='next'){
   if(state.answers[state.q]===undefined||animationLock)return;state.lastChange=null;
   if(state.editMode){state.editMode=false;state.screen='result';}
   else if(state.q%4===3&&!state.rewards[Math.floor(state.q/4)]){state.event=Math.floor(state.q/4);state.eventSelected=null;state.screen='event';}
   else if(state.q===11)state.screen='result';else state.q++;
   render();
  }
  if(a==='back'&&state.q>0){clearTimeout(unlockTimer);animationLock=false;state.lastChange=null;state.q--;render();}
  if(a.startsWith('event-')&&state.eventSelected===null){state.eventSelected=Number(a.split('-')[1]);state.rewards[state.event]=D.events[state.event].choices[state.eventSelected].reward;render();}
  if(a==='continue'){if(state.event===2)state.screen='result';else{state.q++;state.screen='question';}render();}
  if(a==='review-answers'){state.screen='review';state.lastChange=null;render();}
  if(a.startsWith('edit-')){state.q=Number(a.split('-')[1]);state.screen='question';state.editMode=true;state.lastChange=null;animationLock=false;render();}
  if(a==='return-result'){state.screen='result';state.lastChange=null;render();}
  if(a==='restart'){clearTimeout(unlockTimer);animationLock=false;state={screen:'setup',name:state.name,industry:state.industry,answers:[],q:0,rewards:[],event:0,eventSelected:null,memory:{parts:[],tokens:{}},lastChange:null,editMode:false};render();}
  if(a==='clear-collection'){collection=[];try{localStorage.removeItem('salon-quest-collection');}catch(e){}state.screen='home';render();}
  if(a==='share'){
   const r=L.diagnose(state.answers,D),text=`サロン繁盛クエストで、お店がLv.${G.level(state.memory,state.rewards)}に育ちました。「${types[r.type].type}」のわたしのお店、見てみて！`;
   try{if(navigator.share)await navigator.share({title:'サロン繁盛クエスト',text,url:location.href});else if(navigator.clipboard){await navigator.clipboard.writeText(text+'\n'+location.href);status('共有文とURLをコピーしました。');}else status('画面のスクリーンショットと、ブラウザのURLを共有できます。');}catch(err){if(err.name!=='AbortError')status('スクリーンショットでも共有できます。');}
  }
  if(a==='save-image'){await saveImage();}
 });
 function status(text){const el=document.querySelector('#status');if(el)el.textContent=text;}
 async function saveImage(){
  const r=L.diagnose(state.answers,D),t=types[r.type],canvas=document.createElement('canvas');canvas.width=1000;canvas.height=1790;const c=canvas.getContext('2d');
  if(!c){status('スクリーンショットで保存してください。');return;}
  try {
  c.fillStyle='#f7f4ec';c.fillRect(0,0,1000,1790);c.fillStyle='#e2eadd';c.fillRect(40,40,920,1710);c.fillStyle='#fcfaf5';c.fillRect(55,55,890,1680);c.textAlign='center';c.fillStyle='#506f5b';c.font='22px sans-serif';c.fillText('サロン繁盛クエスト / YOUR SHOP STORY',500,120);c.font='bold 36px sans-serif';c.fillText('お店は、ここまで育ちました！',500,182);
  const svgText=Scene.render(growth(),state.memory,state.name,state.rewards,{still:true}).match(/<svg[\s\S]*<\/svg>/)[0];
  const image=new Image(),url=URL.createObjectURL(new Blob([svgText],{type:'image/svg+xml;charset=utf-8'}));
  try{await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;image.src=url;});c.drawImage(image,75,205,850,538);}finally{URL.revokeObjectURL(url);}
  c.fillStyle='#506f5b';c.font='26px sans-serif';c.fillText('育成 Lv.'+G.level(state.memory,state.rewards)+' · '+(state.name||'小さなお店'),500,790,800);
  c.font='bold 35px sans-serif';c.fillText(t.icon+' '+t.type,500,851);c.font='23px sans-serif';c.fillText(t.tag,500,900);
  c.textAlign='left';D.axes.forEach((a,i)=>{const y=985+i*83;c.fillStyle='#354b43';c.font='26px sans-serif';c.fillText(a.name,110,y);c.textAlign='right';c.fillText(r.scores[i]+' / 100',880,y);c.textAlign='left';c.fillStyle='#e5e8de';c.fillRect(110,y+16,770,10);c.fillStyle='#809b7d';c.fillRect(110,y+16,770*r.scores[i]/100,10);});
  c.fillStyle='#354b43';c.font='bold 26px sans-serif';c.fillText('今日の小さなクエスト',110,1450);c.font='25px sans-serif';let action=r.priorities[0].score===100?D.axes[r.priorities[0].i].next:D.axes[r.priorities[0].i].action;let line='',y=1500;for(const char of action){if(c.measureText(line+char).width>770){c.fillText(line,110,y);line='';y+=41;}line+=char;}c.fillText(line,110,y);c.font='19px sans-serif';c.fillStyle='#69786e';c.fillText('お店は、まだまだ成長できます！',110,1650);c.fillText('自己診断とゲームの表現。売上・予約数の予測ではありません。',110,1700);
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error();const file=new File([blob],'salon-quest-result.png',{type:'image/png'});if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title:'サロン繁盛クエストの診断結果'});status('共有メニューから「画像を保存」を選べます。');}else{const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='salon-quest-result.png';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);status('結果カードをPNG画像で保存しました。');}}catch(err){if(err.name!=='AbortError')status('保存できない場合は、画面のスクリーンショットをご利用ください。');}
 }
 render(false);
})();

