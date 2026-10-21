/* 演出専用の純粋関数。既存の診断採点には影響しません。 */
(function(root){
 const names={local:'街の案内看板',interest:'来店理由のメニューボード',trust:'安心の灯り',social:'SNSフラッグ',entry:'予約の道しるべ',localPlus:'街角のベンチ',interestPlus:'花咲くショーウィンドウ',trustPlus:'常連さんのティーセット',socialPlus:'ハートのガーランド',entryPlus:'お迎えのアーチ'};
 const ids=['local','interest','trust','social','entry'];
 function derive(answers,data){
  const points=[0,0,0,0,0],max=[0,0,0,0,0],tokens=[];
  data.questions.forEach((q,i)=>{max[q.axis]+=3;const a=answers[i];if(Number.isInteger(a)&&a>=0&&a<=3){points[q.axis]+=a;tokens.push({q:i,axis:q.axis,value:a});}});
  const scores=points.map((n,i)=>Math.round(n/max[i]*100));
  const parts=[];ids.forEach((id,i)=>{if(points[i]>0)parts.push(id);if(scores[i]>=67)parts.push(id+'Plus');});
  const locals=Math.min(3,Math.ceil(points[0]/2));
  const interest=Math.min(3,Math.ceil(points[1]/2));
  const hearts=Math.min(6,Math.ceil(points[3]*2/3));
  const stars=Math.min(5,Math.ceil(points[2]*5/6));
  // 入店は予約導線だけでなく、来店前の関心・地域・信頼のいずれかも必要。
  const visitors=locals+interest+(points[2]>=3?1:0);
  const entering=points[4]>=3&&visitors>0?Math.min(3,Math.ceil(points[4]/3),visitors):0;
  return {points,scores,tokens,parts,locals,interest,hearts,stars,entering,visitors,answered:tokens.length};
 }
 function update(memory,current){
  const parts=Array.from(new Set([...(memory.parts||[]),...current.parts]));
  const tokens={...(memory.tokens||{})};current.tokens.forEach(t=>{tokens[t.q]=Math.max(tokens[t.q]??-1,t.value);});
  return {parts,tokens};
 }
 const stages=[
 {level:1,title:'はじまりの個人サロン',description:'小さな平屋から、お店の物語がはじまります。'},
 {level:2,title:'街角の愛されサロン',description:'外壁と看板を一新。花壇と窓のある、親しみやすいお店へ。'},
 {level:3,title:'街の人気サロン',description:'広い店舗にテラスと待合ベンチ。お迎えの場所が増えました。'},
 {level:4,title:'予約が集まる繁盛サロン',description:'大きな窓とバルコニーのある2階建て。庭園も育ちました。'},
 {level:5,title:'街を彩る名店',description:'両翼のある大型店舗と美しい庭園。お店の物語が花開きました。'}
 ];
 // 育成経験値のみ。自己診断点・タイプ判定には影響しない。
 function experience(memory,rewards=[]){const tokens=Object.values(memory.tokens||{});return tokens.length+tokens.reduce((s,v)=>s+v*2,0)+(memory.parts||[]).length+rewards.filter(Boolean).length*2;}
 function level(memory,rewards=[]){const xp=experience(memory,rewards);return 1+[12,32,58,86].filter(t=>xp>=t).length;}
 function stage(memory,rewards=[]){return stages[level(memory,rewards)-1];}

 function feedback(axis,value,g){
  if(value===0)return '小さな芽を植えました。'+['街の人に見つけてもらう情報を、これから育てよう。','来たくなる理由を、これから一緒に見つけよう。','はじめての安心を、これから灯していこう。','届けたい相手に向けて、発信の芽を育てよう。','お店までの最後の道しるべを、これから整えよう。'][axis];
  return ['街の案内看板と、近くのお客様が登場しました。','「気になる」のふきだしと、メニューの彩りが増えました。','安心の灯りと、口コミをイメージした星がきらり。','SNSのハートがふわり。反応と入店は別々に育ちます。',g.entering?'予約の道がつながり、お客様が入口へ歩きはじめました。':'予約の道しるべが登場。来店前の情報も育てていこう。'][axis];
 }
 root.QuestGrowth={derive,update,level,experience,stage,stages,feedback,names};
})(typeof window==='undefined'?globalThis:window);
