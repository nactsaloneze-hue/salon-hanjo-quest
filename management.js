/* 経営モデルv2。原選択肢IDで計算。乱数はプレイの種から固定し、
   再選択・戻る・回答変更でも同じ問いのくじを引き直さない。 */
(function(r){'use strict';const D=r.QuestManagementData,clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 const INITIAL_CASH=650000,DEFAULT_SEED=12345;
 function roll(seed,q,salt=0){let x=((seed>>>0)^Math.imul(q+1,2654435761)^Math.imul(salt+1,2246822519))>>>0;x^=x>>>16;x=Math.imul(x,2146121005);x^=x>>>15;x=Math.imul(x,2221713035);x^=x>>>16;return (x>>>0)/4294967296;}
 function order(q,seed=DEFAULT_SEED){const a=[0,1,2,3];for(let i=3;i>0;i--){const j=Math.floor(roll(seed,q,i)*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
 function plan(axis,v,q){return {...D.styles[v],title:(D.questionTitles[q]||D.titles[axis])[v]};}
 function initial(){return {cash:INITIAL_CASH,revenue:0,totalRevenue:0,totalProfit:0,customers:0,reputation:55,abilities:[1,1,1,1,1],outreach:0,loyalty:0,fatigue:0,upkeep:0,history:[],level:1,gameOver:false,rescued:false};}
 function building(s,profit){const balance=Math.min(s.abilities[0]+s.abilities[1],s.abilities[2]+s.abilities[4]);let l=1;
 if(s.cash>=400000&&s.reputation>=50&&s.customers>=28)l=2;
 if(s.cash>=650000&&s.reputation>=60&&profit>=0&&balance>=3.5&&s.customers>=35)l=3;
 if(s.cash>=900000&&s.reputation>=67&&profit>=50000&&balance>=4.4&&s.customers>=43)l=4;
 if(s.cash>=1200000&&s.reputation>=70&&profit>=90000&&balance>=4.4&&s.customers>=46)l=5;return l;}
 function replay(answers,data,seed=DEFAULT_SEED){const s=initial();for(let i=0;i<data.questions.length;i++){
  const v=answers[i];if(!Number.isInteger(v)||v<0||v>3||s.gameOver)break;
  const q=data.questions[i],a=plan(q.axis,v),before={cash:s.cash,revenue:s.revenue,customers:s.customers,reputation:s.reputation,level:s.level,outreach:s.outreach},prior=s.abilities.slice(),reasons=[],reputationDrivers=[];
  const rep=(label,amount)=>{reputationDrivers.push({label,amount});return amount;};
  const e={...D.events[Math.floor(roll(seed,i,20)*D.events.length)]};
  // 得意分野への追加投資は逓減。弱い軸に絞る判断ほど効果がある。
  const gain=a.gain/(1+Math.max(0,prior[q.axis]-1)*.8);s.abilities[q.axis]=clamp(prior[q.axis]+gain,1,4);
  const readiness=(prior[1]+prior[2]+prior[4])/3;
  let reach=a.reach,repDelta=rep('選んだ施策による信頼',a.rep);
  if(v===3){s.upkeep+=3500;if(readiness<1.65){reach*=.35;repDelta+=rep('告知に対する事前準備の不足',-2);reasons.push('信頼・来店理由・予約の準備が足りず、大きな投資を来店につなげきれませんでした。');}else{reach*=1.15;reasons.push('先に整えた信頼と予約の流れが、大きな告知を支えました。');}
   if(prior[q.axis]>2.4){reach*=.5;reasons.push('同じ分野への投資が重なり、新しく届く人は少なめでした。');}}
  if(v===1&&(prior[4]<1.8||prior[2]<1.8)){reach*=.5;repDelta+=rep('信頼や予約の準備不足',-1);reasons.push('小さく試せましたが、予約方法がわかりにくく来店を一部取りこぼしました。');}
  if(v===2&&prior[q.axis]<1.8){repDelta+=rep('弱い部分を整えた効果',1);reasons.push('弱かった部分に絞った改善が、次の施策を支える土台になりました。');}
  s.loyalty=clamp(s.loyalty+a.loyalty,0,8);s.outreach=Math.round(s.outreach*.4+reach);
  if(v===0)s.fatigue=Math.max(0,s.fatigue-1);else if(v===3)s.fatigue+=1;else if(v===2){s.fatigue+=.8;if(s.fatigue>=3)reasons.push('改善作業が続いて受入枠が少なめに。運営に集中する時間も作りましょう。');}
  let eventDemand=e.demand;
  if(e.id==='rain')eventDemand+=Math.min(3,Math.floor(s.loyalty/2));
  if(e.id==='referral'){eventDemand=s.reputation>=62&&s.loyalty>=3?8:1;reasons.push(eventDemand===8?'積み重ねた気配りから紹介が広がりました。':'紹介の芽がひとつ。信頼を育てると、さらに広がります。');}
  if(e.id==='chain'&&prior[1]>=2){eventDemand=-1;reasons.push('得意なことが伝わっていたため、競合の影響を抑えられました。');}
  let fixed=165000,turnaround=0;
  // 追加の現金配布ではなく支出削減と紹介による回復。帳簿を崩さない。
  if(before.cash<220000&&v<=1){s.fatigue=Math.min(s.fatigue,1);repDelta+=rep('運営を縮小して対応に集中',2);fixed-=35000;turnaround=s.loyalty>=3&&prior[2]>=1.8?7:2;reasons.push('資金を守るため運営を縮小。固定費を3万5千円抑え、既存客への対応に集中しました。');}
  const buffer=before.cash-a.cost;let effectiveness=1;
  if(buffer<150000){effectiveness=.7;reasons.push('投資後の手元資金が少なく、運営に余裕がなくなりました。');}
  const novelty=Math.max(0,i-3)*Math.max(0,2-prior[0]-prior[3]/3)*1.7;
  const recognition=25+s.abilities[0]*3+s.abilities[1]*2+s.outreach+s.loyalty*.65-novelty;
  const conversion=clamp(.65+s.abilities[4]*.08+prior[2]*.05,.7,1.08);
  const desired=Math.max(6,Math.round((recognition*conversion+(s.reputation-55)*.18+eventDemand+turnaround)*effectiveness));
  const capacity=Math.max(28,52+(a.slots||0)-Math.floor(s.fatigue)*2);
  s.customers=Math.min(desired,capacity);const overflow=Math.max(0,desired-capacity);
  if(overflow>3){s.fatigue+=2;repDelta+=rep('混雑でお待たせした影響',-Math.min(6,Math.ceil(overflow/3)));reasons.push('告知に対応が追いつかず、お待たせしたお客様が離れてしまいました。');}
  else if(v<=1&&s.customers<=capacity-3){repDelta+=rep('余裕を持った接客',1);s.fatigue=Math.max(0,s.fatigue-.5);}
  if(s.fatigue>=5){repDelta+=rep('対応の負担が接客に出た影響',-3);reasons.push('忙しさの積み重ねが接客に影響。投資を休める判断も有効です。');}
  if(v===0&&prior[0]+prior[3]<3&&i>=4){repDelta+=rep('新しいお客様への案内不足',-2);reasons.push('常連さんには届く一方、新しい方への案内が不足。小さな発信も組み合わせましょう。');}
  s.reputation=clamp(Math.round(s.reputation+repDelta),5,100);
  if(s.reputation-before.reputation!==repDelta)rep('評判の上下限による調整',s.reputation-before.reputation-repDelta);
  const materials=s.customers*2500,maintenance=Math.round(s.upkeep),investment=a.cost,eventCost=e.cost,costs=materials+fixed+maintenance+investment+eventCost;
  s.revenue=s.customers*10000;const profit=s.revenue-costs;s.cash+=profit;s.totalRevenue+=s.revenue;s.totalProfit+=profit;
  if(before.cash<220000&&s.cash>=220000){s.rescued=true;reasons.unshift('立て直し成功！支出を絞り、積み重ねた信頼で資金の余裕を取り戻しました。');}
  if(before.cash>=220000&&s.cash<220000)reasons.unshift('資金が少なくなりました。次は支出を抑え、土台を活かす手もあります。');
  s.gameOver=s.cash<=0;s.level=s.gameOver?1:building(s,profit);
  if(s.gameOver)reasons.unshift('運転資金が尽きたため、今回の経営はここで終了です。次は違う判断で再挑戦できます。');
  const headline=s.gameOver?'運転資金が尽きました':s.rescued&&before.cash<220000&&s.cash>=220000?'ピンチから立て直しました':profit<0?'今回は赤字。次の一手を考えよう':profit>=90000?'判断が実り、利益が育ちました':'小さな一歩が実りました';
  const customerChange=s.customers-before.customers,reputationChange=s.reputation-before.reputation,customerReasons=[];
  if(customerChange<0){
   if(eventDemand<0)customerReasons.push(e.title+'で来店希望が控えめでした。');
   if(s.outreach<before.outreach)customerReasons.push('前回の告知の勢いが落ち着き、新しい来店希望が減りました。');
   if(desired>capacity)customerReasons.push('希望はありましたが、準備・対応の負担で受入枠が限られました。');
   if(effectiveness<1)customerReasons.push('手元資金の不足で、施策を十分に運用できませんでした。');
   if(before.reputation<55)customerReasons.push('これまでの評判が来店の判断に影響しました。');
   if(!customerReasons.length)customerReasons.push('今回は告知・予約・受入枠の組み合わせにより、来店が前回を下回りました。');
  }
  const cashReason=customerChange<0&&profit>0?'顧客は前回より減りましたが、今回の売上が経費を上回ったため、黒字分だけ資金が増えました。':profit<0?'今回の売上より経費が多く、赤字分だけ資金が減りました。':profit===0?'今回の売上と経費が同額のため、資金は変わりません。':'今回の利益分だけ資金が増えました。';
  s.history.push({q:i,customerChange,reputationChange,customerReasons,reputationDrivers,cashReason,value:v,before,cash:s.cash,revenue:s.revenue,customers:s.customers,reputation:s.reputation,costs,materials,fixed,maintenance,investment,eventCost,profit,event:e,headline,reasons,level:s.level});
 }return s;}
 function success(s){return !s.gameOver&&s.history.length===12&&s.cash>=INITIAL_CASH&&s.totalProfit>=0&&s.reputation>=65&&s.customers>=32;}
 function verdict(s){return s.gameOver?'次の一手を見つけた挑戦者':s.rescued&&s.cash>=INITIAL_CASH?'危機から立て直したお店':success(s)?(s.rescued?'逆転を育てたサロン店主':'資金と信頼を育てたお店'):s.cash<220000?'次は資金の余裕を育てよう':s.reputation<65?'次は信頼とのバランスを育てよう':'工夫を重ねるお店';}
 r.QuestManagement={order,plan,approaches:D.styles,initial,replay,verdict,success,roll,building,INITIAL_CASH};
})(typeof window==='undefined'?globalThis:window);

