import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
let n=1;
const labels={
  "there-is-are":"There is / There are",
  "prepositions-place":"Yer edatları",
  "describing-room":"Oda tasviri",
  "places-town":"Şehirdeki yerler",
  "directions":"Yol tarifi",
  "imperatives":"Emir ve talimatlar"
};
const q=(topicTag,type,title,instructionTr,content,points=4)=>({id:`m3r${String(n++).padStart(2,"0")}`,type,topicTag,topicLabel:labels[topicTag],title,instructionTr,content,points});
const mc=(tag,title,prompt,options,correctIndex,explanationsTr)=>q(tag,"multiple-choice",title,"En doğru seçeneği işaretle.",{prompt,options,correctIndex,explanationsTr});
const fill=(tag,title,prompt,acceptedAnswers,hintTr,feedbackCorrectTr,feedbackIncorrectTr)=>q(tag,"fill-blank",title,"Boşluğu tamamla.",{prompt,acceptedAnswers,hintTr,feedbackCorrectTr,feedbackIncorrectTr});
const order=(tag,title,tokens,answer,feedbackCorrectTr,feedbackIncorrectTr)=>q(tag,"sentence-order",title,"Kelimeleri doğru sıraya koy.",{tokens,answer,feedbackCorrectTr,feedbackIncorrectTr});
const err=(tag,title,sentence,error,correction,explanationTr)=>q(tag,"error-find",title,"Hatalı bölümü bul ve düzelt.",{sentence,error,correction,explanationTr});

const questions=[
  mc("there-is-are","Tekil varlık","___ a net in the middle of the court.",["There is","There are","Are there","There aren't"],0,["Doğru. 'A net' tekildir; bu yüzden 'There is' kullanılır.","'There are' çoğul isimlerle kullanılır; burada bir file var.","'Are there' soru başlatır; cümle düz olumlu cümle.","'There aren't' olumsuz ve çoğul yapıdır; anlamı bozar."]),
  mc("there-is-are","Çoğul varlık","Look! ___ three posters on the wall.",["There is","There are","Is there","There isn't"],1,["'Three posters' çoğuldur; 'There is' tekil için kullanılır.","Doğru. Üç poster çoğul olduğu için 'There are' gerekir.","'Is there' tekil soru yapısıdır; burada düz cümle var.","'There isn't' tekil olumsuzdur; hem sayı hem anlam yanlış olur."]),
  fill("there-is-are","Olumsuz varlık","There ___ any players in the room.",["aren't","are not"],"Any players çoğuldur; olumsuzda aren't kullanılır.","Doğru. 'Players' çoğul olduğu için 'There aren't' uygundur.","'Players' çoğul olduğundan 'isn't' değil 'aren't' gerekir."),
  order("there-is-are","Soru kur",["Are","there","two","singers","on","the","stage"],"Are there two singers on the stage?","Doğru. Çoğul soruda 'Are there...' ile başlanır.","İki şarkıcı çoğul olduğu için soru 'Are there' ile başlamalı."),
  mc("prepositions-place","İçinde mi üstünde mi?","The ticket is ___ the bag. Open the bag and take it.",["in","on","behind","between"],0,["Doğru. Çantayı açıp almak gerekiyorsa bilet çantanın içindedir.","'On' yüzey üstünde demektir; çantayı açma ipucu 'in' ister.","'Behind' arkasında demektir; açma ipucuyla uyuşmaz.","'Between' iki şeyin arasında demektir; burada iki nesne yok."]),
  mc("prepositions-place","Duvar yüzeyi","The Manifest poster is ___ the wall.",["in","under","on","between"],2,["Poster duvarın içinde olmaz; yüzeye asılır.","'Under' altında demektir; poster için verilen yer duvar yüzeyi.","Doğru. Poster, resim ve saat gibi şeyler duvarın üzerinde 'on' olur.","'Between' iki şey arasında kullanılır; burada tek duvar var."]),
  fill("prepositions-place","Yanında","The microphone is ___ the guitar.",["next to"],"'Next to' bitişiğinde/yanında demektir.","Doğru. 'Next to the guitar' gitarın yanında anlamına gelir.","'Next' tek başına yer edatı olmaz; 'next to' gerekir."),
  err("prepositions-place","Hatalı edat","The poster is in the wall.","in","on","Poster duvarın içine girmez; yüzeye asıldığı için 'on the wall' kullanılır."),
  mc("describing-room","Oda tasviri","My desk is ___ the window, so I can see the garden.",["next to","under","in","between of"],0,["Doğru. Pencerenin yanında anlamı için 'next to' kullanılır.","'Under the window' pencerenin altında demektir; görme ipucu yanındayı destekler.","'In the window' doğal oda tasviri değildir.","'Between of' yanlış yapıdır; between'den sonra of gelmez."]),
  fill("describing-room","Room kelimesi","There is a small ___ next to my bed.",["lamp"],"Yatağın yanında olabilecek küçük eşya: lamp.","Doğru. 'A small lamp' tekil ve oda eşyasıdır.","Bu cümlede oda eşyası ve tekil isim gerekir; kaynak kelime 'lamp'."),
  order("describing-room","Oda cümlesi",["There","is","a","carpet","on","the","floor"],"There is a carpet on the floor.","Doğru. Tekil halı için 'There is' ve yer için 'on the floor' kullanılır.","Cümle tekil varlıkla başlar: There is a carpet..."),
  mc("describing-room","Kısa okuma ipucu","A bed, a desk and a wardrobe are room words. Which one is NOT a room word?",["wardrobe","stadium","desk","bed"],1,["Wardrobe oda eşyasıdır; yanlış seçenek değildir.","Doğru. Stadium şehir/spor yeridir, oda eşyası değildir.","Desk oda eşyasıdır.","Bed oda eşyasıdır."]),
  mc("places-town","Şehir yeri","You watch films at the ___.",["hospital","cinema","school","music shop"],1,["Hospital hastane demektir; film izleme yeri değildir.","Doğru. Film izlenen yer 'cinema'dır.","School öğrenme yeridir; film izleme ipucu cinema ister.","Music shop müzik aleti/ürün yeri olabilir; film için cinema gerekir."]),
  fill("places-town","Spor yeri","Beyza watches a volleyball match at the sports ___.",["centre","center"],"İngiliz İngilizcesinde sports centre yazılır.","Doğru. Kaynak yazım 'sports centre'dır.","Bu kalıp 'sports centre' şeklindedir; İngiliz İngilizcesinde centre yazımı tercih edilir."),
  err("places-town","Yer adı hatası","The cinema is next the park.","next","next to","Yer belirtirken 'next' tek başına kullanılmaz; 'next to the park' gerekir."),
  q("places-town","matching","Eşleştirme","Yerleri işlevleriyle eşleştir.",{pairs:[{left:"hospital",right:"see a doctor"},{left:"music shop",right:"buy a guitar"},{left:"park",right:"walk outside"},{left:"stadium",right:"watch a match"}],feedbackCorrectTr:"Doğru. Her yer kendi işleviyle eşleşti.",feedbackIncorrectTr:"Yer adının günlük işlevini düşün: hospital doktor, music shop gitar, stadium maç."},5),
  mc("directions","Yol tarifi","'Dümdüz git' İngilizcede hangisidir?",["Turn right","Go straight on","Go past","On the left"],1,["Bu sağa dön demektir.","Doğru. 'Go straight on' dümdüz git demektir.","Bu bir yeri geç demektir.","Bu sağ/sol tarafta yapısıdır, hareket talimatı değildir."]),
  fill("directions","Get to kalıbı","How do I ___ to the stadium?",["get"],"Yol sorma kalıbı: How do I get to...?","Doğru. 'How do I get to...' bir yere nasıl gidileceğini sorar.","Bu kalıpta 'goes' veya 'turn' değil 'get' kullanılır."),
  order("directions","Yön sırala",["Go","past","the","cinema","and","turn","left"],"Go past the cinema and turn left.","Doğru. Önce bir yeri geç, sonra sola dön talimatı verilir.","Yol tarifinde 'Go past...' kalıbı birlikte durmalı."),
  err("directions","Left/right hatası","Turn to left at the school.","to left","left","Yön verirken 'turn left/right' deriz; left'ten önce 'to' gelmez."),
  mc("imperatives","Olumlu talimat","___ the ball to the captain!",["Pass","Passes","Passing","To pass"],0,["Doğru. Emir cümlesi yalın fiille başlar.","'-s' üçüncü tekil ekidir; emir cümlesinde kullanılmaz.","'-ing' talimat başlatmaz.","'To pass' mastardır; doğrudan talimat için yalın fiil gerekir."]),
  mc("imperatives","Olumsuz talimat","The baby is sleeping. ___ shout.",["Doesn't","Don't","No","Aren't"],1,["Doesn't üçüncü tekil olumsuzdur; emir cümlesi için kullanılmaz.","Doğru. Olumsuz talimatlar 'Don't + fiil' ile kurulur.","No tek başına fiili olumsuz yapmaz.","Aren't be fiilidir; shout eylemini yasaklamaz."]),
  fill("imperatives","Dinle talimatı","___ to the teacher carefully.",["listen"],"Talimatlar fiilin yalın hâliyle başlar.","Doğru. 'Listen to...' doğru talimat yapısıdır.","'Listens/listening' değil yalın emir fiili 'listen' gerekir."),
  err("imperatives","Don't yapısı","No touch the guitar.","No","Don't","Bir eylemi yapma demek için 'No' değil 'Don't + fiil' kullanılır."),
  q("directions","listening","Dinleme turu","Önce dinle, sonra soruyu cevapla.",{audioText:"Go straight on. Turn right at the music shop. The sports centre is next to the cinema.",question:"Where must you turn right?",options:["at the music shop","at the hospital","under the cinema","in the park"],correctIndex:0,explanationsTr:["Doğru. Dinlemede 'Turn right at the music shop' deniyor.","Hospital dinlemede dönme noktası olarak geçmiyor.","Under yer edatıdır; yön tarifi noktası değildir.","Park bu dinleme metninde dönme noktası değildir."]},5)
];

const data={id:"module-3-review",moduleId:"module-3",title:"Modül 3 Genel Tekrar",description:"016–021 derslerindeki ev, şehir, yer ve yön konularını ölçer.",questionCount:questions.length,questions};
if(questions.length!==25)throw new Error(`Expected 25 questions, got ${questions.length}`);
fs.writeFileSync(path.join(root,"data/module3-review.json"),JSON.stringify(data,null,2)+"\n","utf8");
console.log("Wrote Module 3 review.");
