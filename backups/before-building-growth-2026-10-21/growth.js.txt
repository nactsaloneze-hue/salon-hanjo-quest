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
 function level(memory,rewards=[]){return 1+Math.floor(Object.keys(memory.tokens||{}).length/4)+Math.floor((memory.parts||[]).length/2)+rewards.filter(Boolean).length;}
 function feedback(axis,value,g){
  if(value===0)return '小さな芽を植えました。'+['街の人に見つけてもらう情報を、これから育てよう。','来たくなる理由を、これから一緒に見つけよう。','はじめての安心を、これから灯していこう。','届けたい相手に向けて、発信の芽を育てよう。','お店までの最後の道しるべを、これから整えよう。'][axis];
  return ['街の案内看板と、近くのお客様が登場しました。','「気になる」のふきだしと、メニューの彩りが増えました。','安心の灯りと、口コミをイメージした星がきらり。','SNSのハートがふわり。反応と入店は別々に育ちます。',g.entering?'予約の道がつながり、お客様が入口へ歩きはじめました。':'予約の道しるべが登場。来店前の情報も育てていこう。'][axis];
 }
 root.QuestGrowth={derive,update,level,feedback,names};
})(typeof window==='undefined'?globalThis:window);
