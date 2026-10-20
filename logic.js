/* UIから独立した純粋な診断関数。ゲームの報酬は渡さない。 */
(function(root){
 function diagnose(answers,data){
  if(answers.length!==data.questions.length || answers.some(x=>!Number.isInteger(x)||x<0||x>3)) throw new Error('12問すべての回答が必要です');
  const sums=data.axes.map(()=>0), max=data.axes.map(()=>0);
  data.questions.forEach((q,i)=>{sums[q.axis]+=answers[i];max[q.axis]+=3;});
  const scores=sums.map((s,i)=>Math.round(s/max[i]*100));
  const order=scores.map((score,i)=>({score,i})).sort((a,b)=>b.score-a.score||a.i-b.i);
  const balanced=Math.min(...scores)>=67 && Math.max(...scores)-Math.min(...scores)<=20;
  const type=balanced?5:order[0].i;
  const priorities=scores.map((score,i)=>({score,i})).sort((a,b)=>a.score-b.score||[4,0,1,2,3].indexOf(a.i)-[4,0,1,2,3].indexOf(b.i)).slice(0,3);
  return {scores,type,order,priorities};
 }
 root.QuestLogic={diagnose};
})(typeof window==='undefined'?globalThis:window);
