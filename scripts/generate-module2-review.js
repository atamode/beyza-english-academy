import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const labels = {
  "present-simple-affirmative": "Present Simple olumlu",
  "third-person-s": "He/She/It + -s",
  "present-simple-negative": "don't / doesn't",
  "do-does-questions": "Do / Does soruları",
  "short-answers": "Kısa cevaplar",
  "frequency": "Sıklık zarfları",
  "time-routines": "Saat ve günlük rutin",
  "preferences": "Hobiler ve tercihler"
};

let n = 1;
function base(topicTag, type, title, instructionTr, content, extra = {}) {
  return {
    id: `m2r${String(n++).padStart(2, "0")}`,
    type,
    topicTag,
    topicLabel: labels[topicTag],
    title,
    instructionTr,
    points: 4,
    content,
    ...extra
  };
}

function mc(topicTag, title, prompt, options, correctIndex, explanationsTr) {
  return base(topicTag, "multiple-choice", title, "En doğru seçeneği işaretle.", {
    prompt,
    options,
    correctIndex,
    explanationsTr
  });
}

function fill(topicTag, title, prompt, acceptedAnswers, hintTr, feedbackCorrectTr, feedbackIncorrectTr) {
  return base(topicTag, "fill-blank", title, "Boşluğu tamamla.", {
    prompt,
    acceptedAnswers,
    hintTr,
    feedbackCorrectTr,
    feedbackIncorrectTr
  });
}

function order(topicTag, title, tokens, answer, feedbackCorrectTr, feedbackIncorrectTr) {
  return base(topicTag, "sentence-order", title, "Kelimeleri doğru sıraya koy.", {
    tokens,
    answer,
    feedbackCorrectTr,
    feedbackIncorrectTr
  });
}

function errorFind(topicTag, title, sentence, error, correction, explanationTr) {
  return base(topicTag, "error-find", title, "Cümledeki hatalı bölümü bul ve düzelt.", {
    sentence,
    error,
    correction,
    explanationTr
  });
}

const questions = [
  mc("present-simple-affirmative", "Takım rutini", "We ___ volleyball after school.", ["play", "plays", "are play", "playing"], 0, [
    "Doğru. 'We' ile Present Simple olumlu cümlede fiilin yalın hâli kullanılır: play.",
    "'Plays' he/she/it için kullanılır; 'we' çoğul olduğu için fiile -s gelmez.",
    "'Are play' iki yapıyı karıştırır. Present Simple olumlu cümlede yardımcı fiil gerekmez.",
    "'Playing' tek başına Present Simple cümleyi tamamlamaz; burada alışkanlık anlatılıyor."
  ]),
  fill("present-simple-affirmative", "Müzik kulübü", "They ___ a new song every Friday.", ["sing"], "They çoğul özne; fiil yalın kalır.", "Doğru. 'They sing' düzenli yapılan bir işi anlatır.", "Burada 'they' ile fiile -s eklenmez; doğru cevap 'sing'."),
  mc("third-person-s", "Tek kişi alışkanlığı", "Beyza ___ the ball over the net.", ["hit", "hits", "hitting", "are hits"], 1, [
    "'Hit' yalın fiildir; Beyza tek kişi olduğu için burada -s gerekir.",
    "Doğru. Beyza = she gibi tek kişi; Present Simple'da fiil 'hits' olur.",
    "'Hitting' burada tek başına alışkanlık cümlesi kurmaz.",
    "'Are hits' doğru bir Present Simple yapısı değildir."
  ]),
  fill("third-person-s", "Gitar provası", "He ___ the guitar in his room.", ["practises", "practices"], "He tek kişidir; fiile -s eklenir.", "Doğru. 'He practises/practices' tek kişinin düzenli yaptığı işi anlatır.", "He/she/it ile fiilin üçüncü tekil hâli gerekir: practises/practices."),
  errorFind("third-person-s", "Hata avcısı", "My sister play chess on Sundays.", "play", "plays", "'My sister' tek kişidir. Present Simple'da he/she/it gibi düşünülür ve fiil 'plays' olur."),
  mc("present-simple-negative", "Olumsuz rutin", "She ___ play the guitar at night.", ["don't", "doesn't", "isn't", "not"], 1, [
    "'Don't' I/you/we/they ile kullanılır; 'she' için 'doesn't' gerekir.",
    "Doğru. 'She doesn't play...' deriz; doesn't gelince ana fiil yalın kalır.",
    "'Isn't' isim/sıfat cümlelerinde kullanılır; burada fiil 'play' var.",
    "'Not' tek başına Present Simple olumsuz cümle kurmaz."
  ]),
  fill("present-simple-negative", "Hafta içi planı", "They ___ train on Mondays.", ["don't", "do not"], "They ile olumsuzda don't kullanılır.", "Doğru. 'They don't train' çoğul öznenin yapmadığı bir rutindir.", "They çoğul olduğu için 'doesn't' değil 'don't' gerekir."),
  errorFind("present-simple-negative", "Ana fiil yalın kalır", "Beyza doesn't plays volleyball before breakfast.", "plays", "play", "'Doesn't' zaten üçüncü tekil eki taşır. Bu yüzden ana fiil yalın kalır: doesn't play."),
  mc("do-does-questions", "Soru seçimi", "___ your friends like pop music?", ["Do", "Does", "Are", "Is"], 0, [
    "Doğru. 'Your friends' çoğul olduğu için soru 'Do your friends...' diye başlar.",
    "'Does' tek kişi için kullanılır; friends çoğuldur.",
    "'Are' be fiili sorusudur; burada ana fiil 'like' var.",
    "'Is' tekil be fiilidir; bu cümlede uygun değildir."
  ]),
  order("do-does-questions", "Does sorusu", ["Does", "Beyza", "play", "volleyball", "on", "Saturdays"], "Does Beyza play volleyball on Saturdays?", "Doğru. Tek kişi için soru 'Does + özne + yalın fiil' sırasıyla kurulur.", "Soru 'Does' ile başlar; 'plays' değil 'play' kullanılır."),
  fill("do-does-questions", "Do mu Does mu?", "___ he practise the guitar after school?", ["does"], "He tek kişidir; soru Does ile başlar.", "Doğru. 'Does he practise...' doğru soru yapısıdır.", "He/she/it için Present Simple soruda 'Does' gerekir."),
  mc("short-answers", "Kısa cevap", "Do they sing in the club? — Yes, they ___.", ["do", "does", "are", "sing"], 0, [
    "Doğru. 'Do they...?' sorusuna kısa cevap 'Yes, they do.' olur.",
    "'Does' tek kişi içindir; 'they' ile kullanılmaz.",
    "'Are' be fiili sorularında kullanılır; soru 'Do' ile başladı.",
    "Kısa cevapta ana fiili tekrar etmeyiz; yardımcı fiili kullanırız."
  ]),
  mc("short-answers", "Are cevabı", "Are your teammates ready? — No, they ___.", ["don't", "doesn't", "aren't", "isn't"], 2, [
    "'Don't' ana fiilli Present Simple sorularında kullanılır; burada soru 'Are' ile başladı.",
    "'Doesn't' tek kişi ve ana fiilli cümleler içindir.",
    "Doğru. 'Are...' sorusunun olumsuz kısa cevabı 'No, they aren't.' olur.",
    "'Isn't' tek kişi içindir; 'they' çoğuldur."
  ]),
  mc("frequency", "Hafta sonu kanıtı", "She plays volleyball every weekend. She ___ plays volleyball on weekends.", ["always", "never", "rarely", "doesn't"], 0, [
    "Doğru. Every weekend = her hafta sonu; bu yüzden 'always' en uygunudur.",
    "'Never' hiç yapmaz demektir; cümle her hafta sonu oynadığını söylüyor.",
    "'Rarely' nadiren demektir; every weekend ile çelişir.",
    "'Doesn't' olumsuz yardımcıdır; boşluk bir sıklık zarfı istiyor."
  ]),
  fill("frequency", "Sıklık zarfı yeri", "I ___ listen to music after dinner. (usually)", ["usually"], "Sıklık zarfı ana fiilden önce gelir.", "Doğru. 'I usually listen...' doğal sıralamadır.", "Boşluğa bir sıklık zarfı gelmeli; 'usually' ana fiilden önce kullanılır."),
  errorFind("frequency", "Yanlış anlam", "They never practise on Tuesdays, because they practise every Tuesday.", "never", "always", "'Every Tuesday' her salı demektir. Bu bilgiye göre 'never' değil 'always' anlamlıdır."),
  mc("time-routines", "Saat okuma", "7:30 = ___", ["half past seven", "quarter past seven", "seven o'clock", "quarter to seven"], 0, [
    "Doğru. 7:30 İngilizcede 'half past seven' diye söylenir.",
    "'Quarter past seven' 7:15 demektir.",
    "'Seven o'clock' tam 7:00 demektir.",
    "'Quarter to seven' 6:45 demektir."
  ]),
  fill("time-routines", "Rutin saati", "Beyza ___ breakfast at eight o'clock.", ["has"], "Beyza tek kişi; have fiili has olur.", "Doğru. 'Beyza has breakfast...' doğru günlük rutin cümlesidir.", "Beyza tek kişi olduğu için 'have' değil 'has' kullanılır."),
  mc("preferences", "İsimle tercih", "She loves ___, but she doesn't like cold weather.", ["volleyball", "to volleyball", "plays volleyball", "volleyballed"], 0, [
    "Doğru. 'Love + isim' yapısında volleyball doğrudan kullanılabilir.",
    "'To volleyball' doğru bir isim ya da fiil yapısı değildir.",
    "'Plays volleyball' ayrı bir cümle parçasıdır; love'dan sonra bu şekilde gelmez.",
    "'Volleyballed' bu anlamda kullanılan doğru bir kelime değildir."
  ]),
  fill("preferences", "Olumsuz tercih", "He ___ like loud concerts.", ["doesn't", "does not"], "He tek kişi; olumsuzda doesn't kullanılır.", "Doğru. 'He doesn't like...' tek kişinin sevmediği şeyi anlatır.", "He/she/it ile 'don't' değil 'doesn't' kullanılır; ana fiil 'like' kalır."),
  mc("preferences", "Hazır kalıp tanıma", "I like listening to music after homework. Bu cümlede anlatılan şey nedir?", ["Bir tercih", "Bir saat sorma", "Bir olumsuzluk", "Bir sahiplik"], 0, [
    "Doğru. 'I like listening to music' hazır kalıp olarak bir tercih anlatır.",
    "Cümlede saat sorulmuyor; after homework sadece zaman bilgisi verir.",
    "Cümlede don't/doesn't gibi olumsuzluk yok.",
    "Cümlede my/your/have got gibi sahiplik anlatımı yok."
  ]),
  base("present-simple-negative", "reading", "Kısa okuma", "Metni oku ve soruyu cevapla.", {
    text: "Beyza has a busy Wednesday. She plays volleyball after school. Her brother practises the guitar in his room. They don't watch TV before homework. In the evening, Beyza listens to music and prepares her school bag.",
    questions: [{
      prompt: "What don't they do before homework?",
      options: ["watch TV", "play volleyball", "practise the guitar", "prepare a school bag"],
      correctIndex: 0,
      explanationsTr: [
        "Doğru. Metinde açıkça 'They don't watch TV before homework.' yazıyor.",
        "Beyza okuldan sonra voleybol oynuyor; bu olumsuz verilen eylem değil.",
        "Kardeşi gitar çalışıyor; metinde bunun yapılmadığı söylenmiyor.",
        "Beyza çantasını akşam hazırlıyor; before homework için olumsuz bilgi bu değil."
      ]
    }]
  }, {points: 5}),
  base("do-does-questions", "listening", "Dinleme sorusu", "Önce dinle, sonra soruyu cevapla.", {
    audioText: "Does Beyza play volleyball on Saturdays? Yes, she does. Do her friends sing in the music room? No, they don't.",
    question: "Which short answer is correct for Beyza?",
    options: ["Yes, she does.", "No, she doesn't.", "Yes, they do.", "No, he doesn't."],
    correctIndex: 0,
    explanationsTr: [
      "Doğru. Dinlemede 'Does Beyza play...? Yes, she does.' deniyor.",
      "Bu cevap olumsuzdur; dinlemede Beyza için olumlu kısa cevap var.",
      "'They' arkadaşlar için kullanılır; Beyza tek kişi olduğu için 'she' gerekir.",
      "'He' erkek tek kişi için kullanılır; Beyza için doğru zamir 'she'dir."
    ]
  }, {points: 5}),
  base("third-person-s", "matching", "Eşleştir", "Özne ile doğru fiil parçasını eşleştir.", {
    pairs: [
      {left: "She", right: "plays the drums"},
      {left: "They", right: "play the drums"},
      {left: "He", right: "hits the ball"},
      {left: "We", right: "train after school"}
    ],
    feedbackCorrectTr: "Doğru. Tek kişi öznelerde fiile -s gelir; çoğul öznelerde fiil yalın kalır.",
    feedbackIncorrectTr: "Eşleşmeleri özneye göre kontrol et: she/he tek kişi, they/we çoğul."
  }, {points: 5}),
  base("frequency", "matching", "Karışık kavramlar", "Sıklık ifadesini anlamıyla eşleştir.", {
    pairs: [
      {left: "always", right: "her zaman"},
      {left: "usually", right: "genellikle"},
      {left: "sometimes", right: "bazen"},
      {left: "never", right: "asla"}
    ],
    feedbackCorrectTr: "Doğru. Sıklık kelimeleri bir işin ne kadar sık yapıldığını anlatır.",
    feedbackIncorrectTr: "Anlamları tekrar düşün: always en sık, never hiç yapılmayan durumdur."
  }, {points: 5})
];

if (questions.length !== 25) throw new Error(`Expected 25 questions, got ${questions.length}`);

const data = {
  id: "module-2-review",
  moduleId: "module-2",
  title: "Modül 2 Genel Tekrar",
  description: "008–015 derslerindeki Present Simple, kısa cevap, sıklık, saat-rutin ve tercih konularını dengeli ölçer.",
  questionCount: questions.length,
  questions
};

fs.writeFileSync(path.join(root, "data/module2-review.json"), JSON.stringify(data, null, 2) + "\n", "utf8");
console.log(`Wrote ${data.questionCount} Module 2 review questions.`);
