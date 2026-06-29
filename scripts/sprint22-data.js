import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
const write = (file, data) => fs.writeFileSync(path.join(root, file), JSON.stringify(data, null, 2) + "\n", "utf8");

const lessonWords = {
  "000-quick-start": [
    ["team", "takım", "We are a team.", "Biz bir takımız.", "general"],
    ["volleyball", "voleybol", "It is a volleyball.", "O bir voleybol topu.", "volleyball"],
    ["player", "oyuncu", "She is a volleyball player.", "O bir voleybol oyuncusu.", "volleyball"],
    ["singer", "şarkıcı", "They are singers.", "Onlar şarkıcıdır.", "music"],
    ["stage", "sahne", "The stage is bright.", "Sahne parlaktır.", "music"],
    ["friend", "arkadaş", "He is my friend.", "O benim arkadaşım.", "general"],
    ["practice", "antrenman / prova", "We are at practice.", "Biz antrenmandayız.", "volleyball"],
    ["music", "müzik", "Music is fun.", "Müzik eğlencelidir.", "music"]
  ],
  "001-subject-pronouns": [["library","kütüphane","They meet at the library.","Onlar kütüphanede buluşur.","general"],["robot","robot","It is a small robot.","O küçük bir robottur.","general"],["captain","kaptan","She is the captain.","O kaptandır.","volleyball"],["teammate","takım arkadaşı","He is my teammate.","O benim takım arkadaşımdır.","volleyball"],["melody","melodi","It is a calm melody.","O sakin bir melodidir.","general"],["microphone","mikrofon","They use microphones.","Onlar mikrofon kullanır.","music"]],
  "002-am-is-are": [["ready","hazır","I am ready.","Ben hazırım.","general"],["bright","parlak","The room is bright.","Oda parlaktır.","general"],["together","birlikte","We are together.","Biz birlikteyiz.","general"],["court","saha","The court is clean.","Saha temizdir.","volleyball"],["coach","antrenör","He is a coach.","O bir antrenördür.","volleyball"],["band","müzik grubu","They are a band.","Onlar bir müzik grubudur.","music"]],
  "003-to-be-negative": [["quiet","sessiz","They aren't quiet.","Onlar sessiz değildir.","general"],["late","geç","I am not late.","Ben geç kalmadım.","general"],["empty","boş","The bag isn't empty.","Çanta boş değildir.","general"],["tired","yorgun","The players aren't tired.","Oyuncular yorgun değildir.","volleyball"],["noisy","gürültülü","They aren't noisy.","Onlar gürültülü değildir.","music"],["alone","yalnız","She isn't alone.","O yalnız değildir.","general"]],
  "004-to-be-questions": [["home","evde","Is she at home?","O evde mi?","general"],["today","bugün","Are we ready today?","Bugün hazır mıyız?","general"],["match","maç","Is the match today?","Maç bugün mü?","general"],["serve","servis","Is your serve strong?","Servisin güçlü mü?","general"],["concert","konser","Is the concert soon?","Konser yakında mı?","music"],["ticket","bilet","Are the tickets here?","Biletler burada mı?","general"]],
  "005-possessive-adjectives": [["my","benim","My notebook is blue.","Benim defterim mavidir.","general"],["your","senin / sizin","Your idea is clever.","Senin fikrin zekicedir.","general"],["her","onun (kız)","Her bag is red.","Onun çantası kırmızıdır.","general"],["our","bizim","Our team is ready.","Bizim takımımız hazırdır.","volleyball"],["their","onların","Their song is new.","Onların şarkısı yenidir.","music"],["his","onun (erkek)","His guitar is black.","Onun gitarı siyahtır.","general"]],
  "006-have-got": [["helmet","kask","I have got a helmet.","Benim bir kaskım var.","general"],["tablet","tablet","She has got a tablet.","Onun tableti var.","general"],["knee pad","dizlik","They have got knee pads.","Onların dizlikleri var.","general"],["net","file","We have got a new net.","Bizim yeni filemiz var.","general"],["guitar","gitar","He has got a guitar.","Onun gitarı var.","music"],["playlist","çalma listesi","I have got a playlist.","Benim çalma listem var.","general"]],
  "007-demonstratives": [["this","bu","This is my notebook.","Bu benim defterim.","general"],["that","şu / o","That is the old gym.","Şu eski spor salonu.","general"],["these","bunlar","These are clean shoes.","Bunlar temiz ayakkabılar.","volleyball"],["those","şunlar / onlar","Those are volleyballs.","Şunlar voleybol topları.","volleyball"],["near","yakın","This microphone is near.","Bu mikrofon yakın.","music"],["far","uzak","That stage is far.","Şu sahne uzak.","music"]],
  "008-present-simple-affirmative": [["get up","kalkmak","I get up at seven.","Ben yedide kalkarım.","general"],["have breakfast","kahvaltı yapmak","She has breakfast at home.","O evde kahvaltı yapar.","general"],["go to school","okula gitmek","We go to school on weekdays.","Hafta içi okula gideriz.","general"],["study","ders çalışmak","He studies after dinner.","O akşam yemeğinden sonra ders çalışır.","general"],["watch","izlemek","They watch a documentary.","Onlar belgesel izler.","general"],["finish","bitirmek","Mina finishes her homework.","Mina ödevini bitirir.","general"]]
};

function vocabRounds(words, lessonId) {
  const items = words.map(([word, meaningTr, example, sentenceTr], index) => ({ id: `${lessonId}-w${index + 1}`, word, meaningTr, example, sentenceTr, audioText: word }));
  return items.slice(0, 5).map((item, index) => {
    const types = ["İngilizce-Türkçe eşleştir", "Sesi dinleyip kelimeyi bul", "Eksik harfi tamamla", "Karışık harfleri düzelt", "Kelimeyi doğru cümleye koy"];
    const optionWords = [item.word, ...items.filter(x => x.id !== item.id).map(x => x.word).slice(0, 3)].sort((a, b) => a.localeCompare(b, "tr"));
    const optionMeanings = [item.meaningTr, ...items.filter(x => x.id !== item.id).map(x => x.meaningTr).slice(0, 3)].sort((a, b) => a.localeCompare(b, "tr"));
    const useMeaning = index < 2;
    return {
      wordId: item.id,
      word: item.word,
      example: item.example,
      audioText: item.audioText,
      prompt: `${types[index]}: ${index === 0 ? item.word : index === 1 ? "dinle" : index === 2 ? item.word.replace(/[aeiou]/i, "_") : index === 3 ? [...item.word].reverse().join("") : item.example.replace(item.word, "___")}`,
      options: useMeaning ? optionMeanings : optionWords,
      correctIndex: (useMeaning ? optionMeanings : optionWords).indexOf(useMeaning ? item.meaningTr : item.word)
    };
  });
}

function worksheet(title) {
  return {
    title: `${title} Çalışma Sayfası`,
    instructionTr: "Önce örneği oku, sonra boşlukları ve eşleştirmeleri kendi başına tamamla.",
    questions: [
      { type: "choice", prompt: "I ___ Beyza.", options: ["am", "is", "are"], spaceLines: 1 },
      { type: "choice", prompt: "She ___ a volleyball player.", options: ["am", "is", "are"], spaceLines: 1 },
      { type: "choice", prompt: "They ___ singers.", options: ["am", "is", "are"], spaceLines: 1 },
      { type: "fill", prompt: "We ___ a team.", spaceLines: 2 },
      { type: "fill", prompt: "It ___ a volleyball.", spaceLines: 2 },
      { type: "matching", prompt: "Eşleştir: I→am | he→is | she→is | we→are | they→are", spaceLines: 3 },
      { type: "sentence-order", prompt: "Sırala: are / We / team / a", spaceLines: 2 },
      { type: "error-find", prompt: "Hatayı düzelt: He are my friend.", spaceLines: 2 },
      { type: "writing", prompt: "Kendinle ilgili I am ile bir cümle yaz.", spaceLines: 3 },
      { type: "writing", prompt: "Voleybol veya müzikle ilgili is / are kullanan iki cümle yaz.", spaceLines: 4 }
    ],
    answerKey: ["am", "is", "are", "are", "is", "I-am, he-is, she-is, we-are, they-are", "We are a team.", "He is my friend.", "Özgün doğru cümle.", "Özgün doğru cümleler."]
  };
}

const quick = {
  id: "000-quick-start",
  title: "Ders 0 — Hızlı Başlangıç",
  level: "A1-starter",
  module: "Hızlı Başlangıç",
  estimatedMinutes: 25,
  objectives: ["I, you, he, she, it, we, they zamirlerini tanımak", "I am / is / are yapısını öğretimden sonra kolayca denemek", "Voleybol, müzik ve günlük hayat örnekleriyle ilk cümleleri kurmak"],
  prerequisites: [],
  parentGuide: {
    summaryTr: "Bu ders grammar bilmeden başlayan öğrenci için yumuşak giriş dersidir. Önce özne zamirleri ve am/is/are öğretilir; sonra kolay etkinlikler gelir.",
    todayGoal: "Beyza'nın I am, he/she/it is ve you/we/they are kalıbını baskı hissetmeden tanıması.",
    teachingTips: ["Yanlış cevapta hemen düzeltmek yerine özneye baktırın: I mi, tek kişi mi, grup mu?", "Voleybol ve müzik örneklerini konuşma konusu yapın; cümleleri ezberletmeyin.", "İkinci denemeden sonra doğru cevabı birlikte okuyup Türkçesini söyleyin."],
    questionsToAsk: ["Say: I am Beyza.", "Point to a volleyball: It is a volleyball.", "Talk about a team: We are a team.", "Talk about singers: They are singers."],
    listeningScripts: ["I am Beyza. She is a volleyball player. We are a team. They are singers. It is a volleyball."],
    speakingRubric: ["10 puan: I am / is / are kalıplarıyla dört cümle", "5 puan: Yardımla iki veya üç cümle", "0 puan: Örnekleri tekrar dinleyip yeniden deneme"],
    worksheet: worksheet("Ders 0")
  },
  screens: [
    { id: "s01", type: "intro", title: "Ders 0 — Hızlı Başlangıç", instructionTr: "Önce öğreneceğiz, sonra kolayca deneyeceğiz. Bu bir sınav değil.", content: { eyebrow: "20–25 DAKİKA", heroText: "I am Beyza." } },
    { id: "s02", type: "explanation", title: "Önce kişi kelimeleri", instructionTr: "İngilizcede cümleye çoğu zaman kimden veya neden bahsettiğimizi söyleyerek başlarız.", content: { examples: ["I = ben", "you = sen / siz", "he = o (erkek)", "she = o (kız)", "it = o (hayvan/nesne)", "we = biz", "they = onlar"], noteTr: "Kuralın ilk adımı: önce özneyi tanı." } },
    { id: "s03", type: "rule-table", title: "am / is / are haritası", instructionTr: "Özneye göre küçük kelime değişir.", content: { rows: [["I", "am"], ["he / she / it", "is"], ["you / we / they", "are"]] }, explanationTr: "I yalnızca am alır. Tek kişi veya tek şey is alır. You, we ve they are alır." },
    { id: "s04", type: "example", title: "Beyza'ya yakın örnekler", instructionTr: "Cümleleri oku; spor, müzik ve günlük hayat karışık kullanıldı.", content: { examples: ["I am Beyza.", "She is a volleyball player.", "He is my friend.", "It is a volleyball.", "We are a team.", "They are singers.", "You are ready.", "The stage is bright."], noteTr: "Manifest teması yalnızca konser, sahne ve grup örnekleriyle işlendi; şarkı sözü kullanılmadı." } },
    { id: "s05", type: "multiple-choice", title: "Kolay seçim", instructionTr: "I ___ Beyza.", content: { options: ["am", "is", "are"], correctIndex: 0, secondTryHintTr: "I gördüğünde am düşün.", optionExplanationsTr: ["Doğru. I öznesi her zaman am alır.", "Is tek kişi veya tek şey içindir; I ile kullanılmaz.", "Are you/we/they ile kullanılır; I ile kullanılmaz."] }, points: 10 },
    { id: "s06", type: "multiple-choice", title: "Tek kişi", instructionTr: "She ___ a volleyball player.", content: { options: ["am", "is", "are"], correctIndex: 1, secondTryHintTr: "She tek bir kişidir; he/she/it is olur.", optionExplanationsTr: ["Am yalnız I ile kullanılır.", "Doğru. She tek bir kişi olduğu için is alır.", "Are grup veya you içindir; she ile kullanılmaz."] }, points: 10 },
    { id: "s07", type: "matching", title: "Eşleştir", instructionTr: "Soldaki özneyi doğru am/is/are ile eşleştir.", content: { pairs: [["I","am"],["he","is"],["it","is"],["we","are"],["they","are"]], explanationTr: "I-am, he/she/it-is, you/we/they-are eşleşir." }, points: 20 },
    { id: "s08", type: "fill-blank", title: "Boşluğu tamamla", instructionTr: "We ___ a team.", content: { answer: "are", accepted: ["are"], placeholder: "am / is / are", explanationTr: "We, bir grubu anlatır ve are alır." }, hintTr: "We gördüğünde are düşün.", points: 10 },
    { id: "s09", type: "listening", title: "Dinle, sonra seç", instructionTr: "Metni önce dinle; transkript cevap sonrasında açılır. What is it?", content: { audioText: "It is a volleyball. We are a team. They are singers.", options: ["a volleyball", "a singer", "Beyza"], correctIndex: 0, optionExplanationsTr: ["Doğru. It is a volleyball cümlesi duyuluyor.", "Singers they ile anlatılıyor; it değil.", "Beyza bu dinleme metninde kişi olarak geçmiyor."] }, points: 10 },
    { id: "s10", type: "reading", title: "Mini okuma", instructionTr: "Kısa metni oku ve iki kolay soruyu cevapla.", content: { text: "Beyza is at volleyball practice. She is ready. Her friends are near the net. They are a team. A song is on before practice, but no lyrics are shown here.", questions: [{ prompt: "Who is ready?", options: ["Beyza", "the net", "the song"], correctIndex: 0, explanationsTr: ["Doğru. She zamiri Beyza'ya döner.", "Net bir nesnedir; ready olan kişi Beyza.", "Song müzikle ilgilidir ama ready olan o değil."] }, { prompt: "Which sentence talks about a group?", options: ["They are a team.", "It is a net.", "I am Beyza."], correctIndex: 0, explanationsTr: ["Doğru. They bir grubu anlatır ve are alır.", "It tek nesne içindir.", "I tek konuşan kişidir."] }] }, points: 20 },
    { id: "s11", type: "speaking", title: "Söz sende", instructionTr: "45 saniyede dört kısa cümle söyle.", content: { sentenceStarters: ["I am ...", "She is ...", "It is ...", "We are ..."], timerSeconds: 45, selfChecks: ["I am ile bir cümle söyledim.", "is ile tek kişi/şey anlattım.", "are ile grup anlattım.", "Cümleleri açık söyledim."] }, points: 10 },
    { id: "s12", type: "vocabulary-hunt", title: "Kelime Avı", instructionTr: "Dersin kelimeleriyle 3–5 dakikalık kısa oyun.", content: { rounds: vocabRounds(lessonWords["000-quick-start"], "000-quick-start") }, points: 25 },
    { id: "s13", type: "summary", title: "İlk Adım Rozeti", instructionTr: "Dersi tamamlayınca İlk Adım Rozeti kazanırsın.", content: { points: ["I am = Ben ...im", "he/she/it is = O ...dır", "you/we/they are = Sen/Siz/Biz/Onlar ...", "Yanlış cevapta ipucunu oku ve ikinci kez dene."] } }
  ],
  assessment: { passScore: 60, starThresholds: { one: 60, two: 75, three: 90 }, completionBonus: 20 }
};

write("data/lessons/000-quick-start.json", quick);

const vocabulary = { version: 2, items: [] };
for (const [lessonId, words] of Object.entries(lessonWords)) {
  const lessonTitle = lessonId === "000-quick-start" ? quick.title : read(`data/lessons/${lessonId}.json`).title;
  words.forEach(([word, meaningTr, example, sentenceTr, theme], index) => vocabulary.items.push({
    id: `${lessonId}-w${index + 1}`, lessonId, word, meaningTr, example, sentenceTr, audioText: word, sourceLessonTitle: lessonTitle, theme
  }));
}
write("data/vocabulary.json", vocabulary);

for (const lessonId of Object.keys(lessonWords).filter(id => id !== "000-quick-start")) {
  const file = `data/lessons/${lessonId}.json`;
  const lesson = read(file);
  lesson.vocabulary = vocabulary.items.filter(w => w.lessonId === lessonId).map(w => w.id);
  lesson.screens = lesson.screens.filter(s => s.type !== "vocabulary-hunt");
  const summaryIndex = lesson.screens.findIndex(s => s.type === "summary");
  const screen = { id: "s-vocab", type: "vocabulary-hunt", title: "Kelime Avı", instructionTr: "Bu dersin hedef kelimeleriyle kısa tekrar oyunu oyna.", content: { rounds: vocabRounds(lessonWords[lessonId], lessonId) }, points: 25 };
  if (summaryIndex >= 0) lesson.screens.splice(summaryIndex, 0, screen); else lesson.screens.push(screen);
  write(file, lesson);
}

const curriculum = read("data/curriculum.json");
curriculum.sprint = 2.2;
curriculum.modules = curriculum.modules.filter(m => m.id !== "module-0");
curriculum.modules.unshift({
  id: "module-0",
  title: "Hızlı Başlangıç",
  description: "Grammar bilmeden başlayan öğrenci için öğretici ilk adım",
  lessons: [{ id: "000-quick-start", order: 0, title: quick.title, file: "data/lessons/000-quick-start.json", status: "published", prerequisites: [] }]
});
write("data/curriculum.json", curriculum);

console.log("Sprint 2.2 data updated: Ders 0, vocabulary vault, lesson hunts.");
