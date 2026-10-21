/* 第1段階：既存12問に重ねる経営モデル。金額は円、顧客は今回の判断後の人数。
   回答は元の選択肢ID(0..3)で保存。表示位置を計算に使わない。
   同じ回答を押し直しても増殖せず、見直し時は全判断を時系列で再計算する。 */
(function(root){'use strict';
 const orders=[[2,0,3,1],[1,3,0,2],[3,2,1,0],[0,2,1,3],[2,1,3,0],[1,0,2,3],[3,1,0,2],[0,3,2,1],[2,3,1,0],[1,2,0,3],[3,0,2,1],[0,1,3,2]];
 const approaches=[
  {name:'小さく運営',cost:0,rep:-2,reach:-3,good:'整備費をかけず、手元資金を温存',bad:'情報不足で見つけてもらいにくく、評判も育ちにくい'},
  {name:'手軽に広げる',cost:25000,rep:0,reach:7,good:'少額で新しい人に届きやすい',bad:'広く届く分、予約の準備が弱いと来店に結びつきにくい'},
  {name:'絞って整える',cost:65000,rep:3,reach:3,good:'必要な情報を整え、信頼と来店の土台を作る',bad:'6.5万円の整備費と、更新の手間がかかる'},
  {name:'丁寧に充実',cost:155000,rep:5,reach:5,good:'詳しい情報で評判と予約のしやすさを高める',bad:'15.5万円の整備費。維持費も増え、資金不足では効果が落ちる'}
 ];
 const axisCosts=['場所・道順の案内','来店理由・メニューの案内','店内・安心情報','発信内容の整理','予約の案内'];
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 function order(q){return orders[q].slice();}
 function initial(){return {cash:650000,revenue:0,totalRevenue:0,totalProfit:0,customers:0,reputation:50,abilities:[0,0,0,0,0],outreach:0,history:[],level:1};}
 function replay(answers,data){const s=initial();data.questions.forEach((q,i)=>{
  const v=answers[i];if(!Number.isInteger(v)||v<0||v>3)return;
  const a=approaches[v],before={cash:s.cash,revenue:s.revenue,customers:s.customers,reputation:s.reputation,level:s.level},prior=s.abilities.slice(),reasons=[];
  // 設備・情報は一度整えれば残る。似た投資を繰り返すほど増分効果は小さい。
  const gain=Math.max(0,v-prior[q.axis]);s.abilities[q.axis]=Math.max(prior[q.axis],v);
  s.outreach=Math.round(s.outreach*.6)+a.reach;
  let effectiveness=1;if(s.cash<a.cost+150000){effectiveness=.65;reasons.push('資金の余裕が少なく、整備後の運用に手が回らず効果が小さくなりました。');}
  const recognition=30+s.abilities[0]*4+s.abilities[1]*3+s.outreach;
  const conversion=.55+s.abilities[4]*.1+prior[2]*.04;
  if(q.axis===3&&prior[4]<2&&v>0)reasons.push('発信の反応は増えましたが、先に予約方法が整っていない分、来店を取りこぼしました。');
  if(q.axis===4&&prior[0]+prior[1]+prior[2]>=5)reasons.push('これまでの地域情報・来店理由・信頼の積み重ねを、予約へつなげられました。');
  if(gain===0&&v>=2)reasons.push('同じ軸をすでに整えているため、追加投資の効果は控えめでした。');
  const desired=Math.round((recognition*conversion+(s.reputation-50)*.16+gain*2)*effectiveness);
  // 小規模店舗の受入上限。集客し過ぎると対応の負荷が評判に影響。
  s.customers=clamp(desired,8,60);const crowd=Math.max(0,desired-60);
  const reputationChange=a.rep+(gain>0?1:0)-(crowd>5?3:0)-(s.cash<0?2:0);
  s.reputation=clamp(s.reputation+reputationChange,5,100);
  if(crowd>5)reasons.push('受入枠を超える来店希望で対応が混み合い、評判に負担がかかりました。');
  const unitPrice=10000,materials=s.customers*2500,fixed=165000,maintenance=s.abilities.reduce((sum,x)=>sum+(x>=2?x*2500:0),0);
  s.revenue=s.customers*unitPrice;const costs=materials+fixed+maintenance+a.cost,profit=s.revenue-costs;
  s.cash+=profit;s.totalRevenue+=s.revenue;s.totalProfit+=profit;
  reasons.unshift(axisCosts[q.axis]+'に'+a.cost.toLocaleString('ja-JP')+'円を使う「'+a.name+'」を選択。'+(gain>0?'この軸の情報が充実しました。':'今の土台を使って運営しました。'));
  if(v===0)reasons.push('整備費を抑えた一方、情報不足で来店の機会と評判を育てにくくなりました。');
  if(s.cash<150000)reasons.push('資金に注意。次の投資は来店につながる土台と費用を見比べましょう。');
  const balance=Math.min(s.abilities[0]+s.abilities[1],s.abilities[2]+s.abilities[4]);
  s.level=1;if(s.cash>=450000&&s.reputation>=48&&s.customers>=30)s.level=2;
  if(s.cash>=650000&&s.reputation>=58&&profit>=0&&balance>=3&&s.customers>=40)s.level=3;
  if(s.cash>=850000&&s.reputation>=65&&profit>=50000&&balance>=4&&s.customers>=48)s.level=4;
  if(s.cash>=1100000&&s.reputation>=72&&profit>=100000&&balance>=5&&s.customers>=55)s.level=5;
  s.history.push({q:i,value:v,before,cash:s.cash,revenue:s.revenue,customers:s.customers,reputation:s.reputation,costs,materials,fixed,maintenance,investment:a.cost,profit,reasons,level:s.level});
 });return s;}
 function verdict(s){return s.cash>=650000&&s.totalProfit>=0&&s.reputation>=60?'資金と信頼を育てたお店':s.cash<150000?'次は資金の余裕を育てよう':s.reputation<50?'次は信頼とのバランスを育てよう':'工夫を重ねるお店';}
 root.QuestManagement={order,approaches,initial,replay,verdict};
})(typeof window==='undefined'?globalThis:window);
