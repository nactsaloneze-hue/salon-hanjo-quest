/* 施策・費用・イベントを画面と計算から分離。金額は架空の円。 */
(function(r){'use strict';
 const titles=[
 ['店頭の声かけを続ける','近所のお店と紹介し合う','道順と駐車場を整える','地域に広告を広く出す'],
 ['常連さんの話を聞く','お試しメニューを案内','得意な悩みに絞って伝える','新メニューを大きく告知'],
 ['一人ずつ丁寧に案内','店内の写真を少し公開','初来店ガイドを作る','撮影と紹介動画を制作'],
 ['無理のない投稿を続ける','幅広い話題を試す','反応を見てテーマを絞る','投稿と広告を一斉に展開'],
 ['個別の相談を受け付ける','予約案内を一枚にする','予約手順を点検する','予約システムを刷新する']
 ];
 const styles=[
 {name:'手元と常連を大切に',cost:0,good:'費用を抑え、常連との信頼を育てる',bad:'新規への広がりは小さく、個別対応に時間が必要',gain:.16,reach:-2,loyalty:1.5,rep:1,slots:-4},
 {name:'小さく試す',cost:15000,good:'少額で新しいお客様の反応を試せる',bad:'幅広く届く分、予約や信頼の準備が必要',gain:.4,reach:8,loyalty:0,rep:0,slots:0},
 {name:'絞って改善',cost:45000,good:'弱い部分を整え、次の施策を支える',bad:'準備に時間がかかり、今の受入枠が減る',gain:1,reach:1,loyalty:.3,rep:1,slots:-5},
 {name:'大きく展開',cost:150000,good:'土台が整えば、多くの方へ一気に届けられる',bad:'準備不足・混雑・同じ投資の繰り返しで赤字の危険',gain:1.15,reach:22,loyalty:0,rep:0,slots:0}
 ];
 const events=[
 {id:'quiet',title:'いつもの街角',text:'落ち着いた営業。選んだ施策がそのまま試されます。',demand:0,cost:0},
 {id:'rain',title:'雨の日が続きました',text:'新しい来店は控えめ。常連さんとのつながりが支えになります。',demand:-5,cost:0},
 {id:'referral',title:'お客様の紹介が届く',text:'これまでの接客と信頼が、紹介の広がりを左右します。',demand:3,cost:0},
 {id:'chain',title:'近くにチェーン店が開業',text:'お店らしさが伝わっているか、試されるときです。',demand:-5,cost:0},
 {id:'repair',title:'備品の小さな修理',text:'修理費が1万2千円発生。手元の余裕が支えになります。',demand:0,cost:12000},
 {id:'buzz',title:'街の投稿で紹介されました',text:'関心が少し増加。予約の準備があれば活かせます。',demand:5,cost:0},
 {id:'cost',title:'材料の仕入れ価格が上昇',text:'今期の仕入れが6千円増加。費用の余裕が大切です。',demand:0,cost:6000}
 ];
 r.QuestManagementData={titles,styles,events};
})(typeof window==='undefined'?globalThis:window);
