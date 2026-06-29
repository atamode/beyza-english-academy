import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = "C:/Users/USER/Downloads/modul2_english_academy_revised.md";
const readJson = file => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
const writeJson = (file, data) => fs.writeFileSync(path.join(root, file), JSON.stringify(data, null, 2) + "\n", "utf8");
const strip = s => String(s || "").replace(/\*\*/g, "").replace(/`/g, "").trim();
const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const cleanText = s => strip(s)
  .replace(/\b(hit|hits)\s+the volleyball\b/gi, (_, v) => `${v} the ball`)
  .replace(/\b(play|plays|playing|practise|practises)\s+guitar\b/gi, (_, v) => `${v} the guitar`);

const lessonMeta = {
  "09": { id: "009-third-person-s", title: "Third Person -s" },
  "10": { id: "010-present-simple-negative", title: "Present Simple Negative" },
  "11": { id: "011-do-does-questions", title: "Do / Does Questions" },
  "12": { id: "012-short-answers", title: "Short Answers" },
  "13": { id: "013-adverbs-frequency", title: "Adverbs of Frequency" },
  "14": { id: "014-time-daily-routine", title: "Telling the Time and Daily Routine" },
  "15": { id: "015-hobbies-preferences", title: "Hobbies and Preferences" }
};

function applyEditorial(text) {
  let out = text
    .replaceAll("He practises music in his room", "He practises the guitar in his room")
    .replaceAll("She doesn't play guitar", "She doesn't play the guitar")
    .replaceAll("Does he play guitar?", "Does he play the guitar?")
    .replace(/(play|plays|playing|practise|practises)(\*\*)?\s+guitar/gi, "$1$2 the guitar")
    .replace(/hit the volleyball/gi, "hit the ball");
  out = out.replace(/(hit|hits)(\*\*)?\s+the volleyball/gi, "$1$2 the ball");
  out = out.replace(
    "Is she tall? → Yes, she **is**. / No, she **isn't**.).",
    "Is she tall? → Yes, she **is**. / No, she **isn't**. Are your friends ready? → Yes, they **are**. / No, they **aren't**.)."
  );
  out = out.replace(
    "5. **My brother _______ misses a volleyball match. He loves watching.**\n   A) never  B) don't never  C) doesn't never",
    "5. **She plays volleyball every weekend. She ___ plays volleyball on weekends.**\n   A) always  B) don't always  C) always is"
  ).replace(
    "5. **A** — \"Never\" tek başına olumsuzluk anlamı katar; \"My brother\" (He) için \"misses\" yerinde durur. B ve C seçenekleri çift olumsuzluk hatasıdır; \"never\" varken ayrıca \"don't\" veya \"doesn't\" kullanılmaz.",
    "5. **A** — Every weekend düzenli ve güçlü bir sıklık ipucudur; bu yüzden always uygundur. B seçeneğinde gereksiz don't vardır. C seçeneğinde are/is gibi to be yardımı bu eylem cümlesine eklenmez."
  );
  out = replaceLessonSection(out, "15", "16", `### 16. Beş Soruluk Uygulama Oyunu
1. **She loves _______.**
   A) volleyball  B) play volleyball  C) plays volleyball

2. **We don't like _______ concerts.**
   A) noisy  B) noisily  C) noise plays

3. **He _______ like the match result.**
   A) doesn't  B) don't  C) isn't

4. **Do you like _______?**
   A) music  B) listen music  C) listens

5. **My friends love _______ volleyball.**
   A) playing  B) play  C) plays

*Cevap Anahtarı ve Açıklamalar:*
1. **A** — Bu derste temel yapı like/love + isimdir; volleyball doğrudan isim olarak gelir. B seçeneğinde yalın fiil gereksizdir. C seçeneği üçüncü şahıs çekimidir ve love’dan sonra kullanılmaz.
2. **A** — Noisy, concerts ismini açıklar ve “gürültülü konserler” anlamı verir. B zarf biçimidir. C anlam ve kelime sırası bakımından bozuk bir yapıdır.
3. **A** — He için olumsuz beğeni yapısı doesn't like + isim olur. B seçeneği I/you/we/they içindir. C seçeneği be fiiliyle ilgilidir; like fiilini olumsuz yapmaz.
4. **A** — Like’dan sonra doğrudan isim gelebilir: like music. B seçeneğinde fiil yanlış biçimdedir. C seçeneği üçüncü şahıs çekimidir.
5. **A** — Bu, derste yalnızca hazır kalıp olarak tanınan playing volleyball örneğidir. B seçeneğinde hazır kalıptaki -ing eksiktir. C seçeneği üçüncü şahıs çekimidir.`);
  out = replaceLessonSection(out, "15", "17", `### 17. Beş Soruluk Ders Sonu Testi
1. **The coach loves _______.**
   A) the team  B) help  C) helps

2. **I don't like _______.**
   A) cold weather  B) coldly  C) colds

3. **Does she like _______?**
   A) the guitar  B) plays the guitar  C) guitar rules

4. **He loves _______.**
   A) music  B) perform  C) performs

5. **They enjoy _______ to music after school.**
   A) listening  B) listen  C) listens

*Cevap Anahtarı ve Açıklamalar:*
1. **A** — Love’dan sonra doğrudan isim gelebilir: the team. B yalın fiildir ve nesne gibi durmaz. C üçüncü şahıs çekimidir.
2. **A** — Don't like + isim yapısı hedeflenir; cold weather bir isim grubudur. B zarf biçimidir. C bu cümlede kullanılmayan yanlış bir çoğul gibi durur.
3. **A** — Like + isim yapısında the guitar doğrudan nesnedir. B'de çekimli fiil gereksizdir. C anlamlı bir tercih nesnesi değildir.
4. **A** — Music doğrudan isimdir ve love ile kullanılabilir. B yalın fiildir. C üçüncü şahıs çekimidir.
5. **A** — Listening to music derste yalnızca hazır kalıp olarak tanınır. B seçeneğinde hazır kalıptaki -ing eksiktir. C üçüncü şahıs çekimidir.`);
  return out;
}

function replaceLessonSection(text, lessonNo, sectionNo, replacement) {
  const lessonRe = new RegExp(`(## DERS ${lessonNo} [\\s\\S]*?)(?=\\n---\\n\\n## DERS|\\n---\\n\\n## MOD|$)`);
  const lesson = text.match(lessonRe)?.[1];
  if (!lesson) return text;
  const secRe = new RegExp(`### ${sectionNo}\\. [\\s\\S]*?(?=\\n### ${Number(sectionNo) + 1}\\. |\\n### 18\\. |\\n---\\n|$)`);
  return text.replace(lesson, lesson.replace(secRe, replacement.trim()));
}

function splitLessons(text) {
  const matches = [...text.matchAll(/^## DERS\s+(\d+)\s+.\s+(.+)$/gm)];
  return matches.map((m, i) => ({
    no: m[1],
    heading: m[2].trim(),
    text: text.slice(m.index, matches[i + 1]?.index ?? text.indexOf("\n---\n\n## MODÜL SONU"))
  })).filter(x => lessonMeta[x.no]);
}

function section(lessonText, no) {
  const re = new RegExp(`### ${no}\\. [^\\n]+\\n([\\s\\S]*?)(?=\\n### ${no + 1}\\. |\\n---\\n|$)`);
  return lessonText.match(re)?.[1]?.trim() || "";
}

function bullets(text) {
  return [...text.matchAll(/^\*\s+(.+)$/gm)].map(m => strip(m[1]));
}

function numbered(text) {
  return [...text.matchAll(/^\d+\.\s+(.+)$/gm)].map(m => cleanText(m[1]));
}

function paragraphs(text) {
  return text.split(/\n{2,}/).map(strip).filter(Boolean).filter(x => !x.startsWith("*Cevap"));
}

function tableRows(text) {
  return text.split(/\n/).filter(l => /^\|/.test(l) && !/---/.test(l)).slice(1).map(l => l.split("|").slice(1, -1).map(strip)).filter(r => r.length >= 2);
}

function parseMC(text) {
  const answerBlock = text.match(/\*Cevap Anahtarı[\s\S]*$/)?.[0] || "";
  const answers = {};
  for (const m of answerBlock.matchAll(/^(\d+)\.\s+\*\*([ABC])\*\*\s+—\s+(.+)$/gm)) answers[m[1]] = { letter: m[2], explanation: strip(m[3]) };
  const rows = [];
  const qRe = /(?:^|\n)(\d+)\.\s+\*\*([\s\S]*?)\*\*\s*([\s\S]*?)(?=\n\d+\.\s+\*\*|\n\n\*Cevap|$)/g;
  for (const m of text.matchAll(qRe)) {
    const opts = [];
    for (const o of m[3].matchAll(/([ABC])\)\s*([\s\S]*?)(?=\s+[ABC]\)|\n|$)/g)) opts.push(strip(o[2]));
    if (opts.length >= 2) {
      const ans = answers[m[1]] || { letter: "A", explanation: "Kaynak cevap anahtarına göre doğru seçenek budur." };
      rows.push({ prompt: cleanText(m[2]), options: opts.slice(0, 3).map(cleanText), correctIndex: "ABC".indexOf(ans.letter), explanation: cleanText(ans.explanation) });
    }
  }
  return rows;
}

function choiceScreen(id, title, q, points = 10) {
  return { id, type: "multiple-choice", title, instructionTr: q.prompt, content: {
    options: q.options,
    correctIndex: Math.max(0, q.correctIndex),
    optionExplanationsTr: q.options.map((opt, i) => i === q.correctIndex ? `Doğru. ${q.explanation}` : `"${opt}" bu cümlede hedef kurala uymaz. ${q.explanation}`)
  }, points };
}

function gameScreen(id, title, questions) {
  return { id, type: "mini-game", title, instructionTr: "Kaynak dosyadaki beş soruluk uygulama setini çöz.", content: {
    rounds: questions.slice(0, 5).map(q => ({
      prompt: q.prompt, options: q.options, correctIndex: Math.max(0, q.correctIndex),
      explanationTr: q.explanation,
      wrongExplanationTr: `Seçtiğin yapı bu cümlede doğru değil. ${q.explanation}`
    }))
  }, points: 50 };
}

function parseFill(text) {
  const qs = [...text.matchAll(/^\d+\.\s+(.+)$/gm)].map(m => cleanText(m[1]));
  const ans = [...text.matchAll(/^\d+\.\s+\*\*([^*]+)\*\*\s+\((.+)\)$/gm)].map(m => ({ answer: cleanText(m[1]), exp: cleanText(m[2]) }));
  return qs.map((q, i) => ({ prompt: q, answer: ans[i]?.answer || "", exp: ans[i]?.exp || "Kaynak cevap anahtarındaki biçim hedef kurala uyar." }));
}

function parseOrder(text) {
  const q = text.match(/^\d+\.\s+\\?\[([^\]]+)\]/m)?.[1]?.split("/").map(x => cleanText(x).replace(/\\+$/,"")) || ["I", "like", "music"];
  const ans = cleanText(text.match(/^\d+\.\s+\*\*([^*]+)\*\*/m)?.[1] || "").replace(/\.$/, "").split(/\s+/).filter(Boolean);
  return { tokens: q, answer: ans };
}

function parseError(text) {
  const q = cleanText(text.match(/^\d+\.\s+\*\*([^*]+)\*\*/m)?.[1] || "She play volleyball.");
  const ans = text.match(/^\d+\.\s+\*\*([^*]+)\*\*\s+\((.+)\)$/m);
  const wrong = ans?.[1]?.split(/[→-]/)[0]?.trim().split(/\s+/)[0] || q.split(/\s+/)[1];
  const words = q.replace(/[“”"]/g, "").split(/\s+/);
  return { sentence: words, wrongIndex: Math.max(0, words.findIndex(w => w.replace(/[.,!?]/g, "") === wrong.replace(/[.,!?]/g, ""))), explanation: cleanText(ans?.[2] || "Kaynakta belirtilen kelime hedef kurala göre düzeltilmelidir.") };
}

function parseMatching(text) {
  const pre = text.split("*Cevap Anahtarı")[0];
  const left = [...pre.matchAll(/^(\d+)\.\s+(.+)$/gm)].map(m => cleanText(m[2]));
  const opts = [...pre.matchAll(/^([ABC])\)\s+(.+)$/gm)].reduce((a, m) => (a[m[1]] = cleanText(m[2]), a), {});
  const pairs = [];
  for (const m of text.matchAll(/^(\d+)\s+—\s+\*\*([ABC])\*\*/gm)) {
    const l = left[Number(m[1]) - 1], r = opts[m[2]];
    if (l && r) pairs.push([l, r]);
  }
  return pairs.length ? pairs : [["I", "do"], ["She", "does"], ["They", "do"]];
}

function parseReadingLike(text) {
  const before = text.split(/\n1\.\s+\*\*/)[0].trim();
  const prompts = [...text.matchAll(/^\d+\.\s+\*\*([^*]+)\*\*/gm)].map(m => strip(m[1]));
  const answers = [...(text.match(/\*Cevap Anahtarı:\*([\s\S]*)$/)?.[1] || "").matchAll(/^\d+\.\s+(.+)$/gm)].map(m => strip(m[1]));
  return { text: cleanText(before.replace(/^"|"$/g, "")), prompts: prompts.map(cleanText), answers: answers.map(cleanText) };
}

function readingQuestions(parsed) {
  const generic = ["Metinde bu bilgi yok.", "Hayır, bu ayrıntı farklı.", "Başka bir kişi veya zaman anlatılıyor."];
  return parsed.prompts.slice(0, 3).map((prompt, i) => {
    const answer = parsed.answers[i] || "Yes.";
    const options = [answer, generic[i % generic.length], generic[(i + 1) % generic.length]];
    return { prompt, options, correctIndex: 0, explanationsTr: [
      `Doğru. Kaynak metindeki cevap: ${answer}`,
      `Bu seçenek metindeki doğru cevabı vermez. Doğru cevap: ${answer}`,
      `Bu seçenek sorudaki ayrıntıyla eşleşmez. Doğru cevap: ${answer}`
    ] };
  });
}

function vocabularyFromSection(text, lessonId, lessonTitle) {
  const rows = [];
  for (const m of text.matchAll(/^\d+\.\s+\*\*([^*]+)\*\*\s+\|\s+([^|]+)\|\s+([^|]+)\|\s+([^|]+)\|\s+(.+)$/gm)) {
    rows.push({ word: cleanText(m[1]).toLowerCase(), meaningTr: cleanText(m[2]), example: cleanText(m[3]), sentenceTr: cleanText(m[3]), lessonId, sourceLessonTitle: lessonTitle, audioText: cleanText(m[1]).toLowerCase(), theme: /volley|match|team|coach|hit|jump/i.test(m[0]) ? "volleyball" : /music|sing|stage|guitar|band|microphone|concert|drum|studio/i.test(m[0]) ? "music" : "general" });
  }
  return rows.slice(0, 8).map((w, i) => ({ id: `${lessonId}-w${i + 1}`, ...w }));
}

function vocabHunt(words, lessonId) {
  const source = words.slice(0, 5);
  return source.map((w, i) => {
    const useMeaning = i < 2;
    const wordOptions = [w.word, ...words.filter(x => x.id !== w.id).map(x => x.word).slice(0, 3)].sort((a, b) => a.localeCompare(b, "tr"));
    const meaningOptions = [w.meaningTr, ...words.filter(x => x.id !== w.id).map(x => x.meaningTr).slice(0, 3)].sort((a, b) => a.localeCompare(b, "tr"));
    const options = useMeaning ? meaningOptions : wordOptions;
    const correct = useMeaning ? w.meaningTr : w.word;
    return { wordId: w.id, word: w.word, example: w.example, audioText: w.audioText, prompt: ["İngilizce-Türkçe eşleştir", "Sesi dinleyip kelimeyi bul", "Eksik harfi tamamla", "Karışık harfleri düzelt", "Kelimeyi doğru cümleye koy"][i] + `: ${i === 0 ? w.word : i === 1 ? "dinle" : i === 2 ? w.word.replace(/[aeiou]/i, "_") : i === 3 ? [...w.word].reverse().join("") : w.example.replace(new RegExp(escRe(w.word), "i"), "___")}`, options, correctIndex: options.indexOf(correct) };
  });
}

function worksheet(title, mc, fill, order, error) {
  const questions = [
    ...mc.slice(0, 3).map(q => ({ type: "choice", prompt: q.prompt, options: q.options, spaceLines: 1 })),
    ...fill.slice(0, 2).map(q => ({ type: "fill", prompt: q.prompt, spaceLines: 2 })),
    { type: "sentence-order", prompt: `Sırala: ${order.tokens.join(" / ")}`, spaceLines: 2 },
    { type: "error-find", prompt: `Hatayı düzelt: ${error.sentence.join(" ")}`, spaceLines: 2 },
    { type: "matching", prompt: "Ders eşleştirme etkinliğinden üç öğeyi yeniden eşleştir.", spaceLines: 3 },
    { type: "writing", prompt: "Bu dersin hedef yapısıyla kendin bir cümle yaz.", spaceLines: 3 },
    { type: "rule", prompt: "Kuralı Türkçe bir cümleyle açıkla.", spaceLines: 3 }
  ].slice(0, 10);
  return { title: `${title} Çalışma Sayfası`, instructionTr: "Soruları kaynak dersteki kurala göre çöz. Öğrenci sayfasında cevaplar görünmez.", questions, answerKey: questions.map((q, i) => q.type === "choice" ? mc[i]?.options[mc[i]?.correctIndex] : q.type === "fill" ? fill[i - 3]?.answer || "Kaynak cevabı" : q.type === "sentence-order" ? order.answer.join(" ") : q.type === "error-find" ? error.explanation : "Öğrencinin kurala uygun özgün cevabı.") };
}

function createLesson(entry) {
  const meta = lessonMeta[entry.no], lessonText = entry.text;
  const objectives = bullets(section(lessonText, 2));
  const explanation = paragraphs(section(lessonText, 4)).slice(0, 3);
  const examples = numbered(section(lessonText, 5)).slice(0, 10);
  if (entry.no === "12" && !examples.some(x => x.includes("Are your friends ready"))) examples.push("Are your friends ready? — Yes, they are. / No, they aren't.");
  const rows = tableRows(section(lessonText, 6));
  const mistakes = paragraphs(section(lessonText, 7)).slice(0, 6);
  const mc8 = parseMC(section(lessonText, 8));
  const fill = parseFill(section(lessonText, 9));
  const order = parseOrder(section(lessonText, 10));
  const error = parseError(section(lessonText, 11));
  const pairs = parseMatching(section(lessonText, 12));
  const reading = parseReadingLike(section(lessonText, 13));
  const listening = parseReadingLike(section(lessonText, 14));
  const game = parseMC(section(lessonText, 16));
  const final = parseMC(section(lessonText, 17));
  const speaking = paragraphs(section(lessonText, 15))[0] || "Hedef yapıyla iki kısa cümle söyle.";
  const parentNote = paragraphs(section(lessonText, 18)).join(" ");
  const words = vocabularyFromSection(section(lessonText, 19), meta.id, meta.title);
  const screens = [
    { id: "s01", type: "intro", title: meta.title, instructionTr: objectives[0] || meta.title, content: { eyebrow: `MODÜL 2 · DERS ${entry.no}`, heroText: examples[0] || meta.title } },
    { id: "s02", type: "explanation", title: "Türkçe konu anlatımı", instructionTr: explanation[0] || objectives[0], content: { examples: explanation.slice(1), noteTr: explanation[0] || "" } },
    { id: "s03", type: "example", title: "Kaynak örnekleri", instructionTr: "Kolaydan zora örnekleri incele.", content: { examples } },
    { id: "s04", type: "rule-table", title: "Kural tablosu", instructionTr: "Kaynak dosyadaki kural tablosu.", content: { rows: rows.length ? rows : [["Kural", objectives[0] || meta.title], ["Örnek", examples[0] || "I like music."]] }, explanationTr: objectives.join(" ") },
    { id: "s05", type: "explanation", title: "Sık yapılan hatalar", instructionTr: "Kaynak dosyadaki hata örneklerini oku.", content: { examples: mistakes, noteTr: "Yanlış seçeneklerde özne, yardımcı fiil ve fiil biçimini kontrol et." } },
    choiceScreen("s06", "Çoktan seçmeli 1", mc8[0] || game[0]),
    choiceScreen("s07", "Çoktan seçmeli 2", mc8[1] || game[1]),
    { id: "s08", type: "fill-blank", title: "Boşluk doldurma", instructionTr: fill[0]?.prompt || "Boşluğu tamamla.", content: { answer: fill[0]?.answer || "", accepted: [fill[0]?.answer || ""], placeholder: "Cevabı yaz", explanationTr: fill[0]?.exp || "Kaynak cevap anahtarındaki biçim doğrudur." }, hintTr: objectives[0] || "Kuralı düşün.", points: 10 },
    { id: "s09", type: "sentence-order", title: "Cümle sıralama", instructionTr: "Kelimeleri doğru sıraya koy.", content: { tokens: order.tokens, answer: order.answer, explanationTr: `Doğru sıra: ${order.answer.join(" ")}` }, hintTr: "Özneyle başla; sonra yardımcı fiil veya ana fiili yerleştir.", points: 10 },
    { id: "s10", type: "error-find", title: "Hata bulma", instructionTr: "Hatalı kelimeyi seç.", content: { sentence: error.sentence, wrongIndex: error.wrongIndex, explanationTr: error.explanation }, points: 10 },
    { id: "s11", type: "matching", title: "Eşleştirme", instructionTr: "Kaynak eşleştirme etkinliğini tamamla.", content: { pairs, explanationTr: "Doğru eşleştirme kaynak cevap anahtarına göre yapılır." }, points: 20 },
    { id: "s12", type: "reading", title: "Kısa okuma", instructionTr: "Metni oku ve üç soruyu cevapla.", content: { text: reading.text, questions: readingQuestions(reading) }, points: 30 },
    { id: "s13", type: "listening", title: "Dinleme metni", instructionTr: listening.prompts[0] || "Metni dinle ve doğru cevabı seç.", content: { audioText: listening.text, options: [listening.answers[0] || "Kaynak cevap", "Metinde yok", "Farklı ayrıntı"], correctIndex: 0, optionExplanationsTr: [`Doğru. ${listening.answers[0] || ""}`, "Bu seçenek dinleme metnindeki doğru ayrıntı değil.", "Bu seçenek başka bir ayrıntıyla karışıyor."] }, points: 10 },
    { id: "s14", type: "speaking", title: "Konuşma görevi", instructionTr: speaking, content: { sentenceStarters: ["I ...", "She ...", "He ...", "We ..."], timerSeconds: 45, selfChecks: ["Hedef yapıyı kullandım.", "En az iki cümle söyledim.", "Özne-fiil uyumunu kontrol ettim.", "Cümlelerim anlaşılırdı."] }, points: 10 },
    gameScreen("s15", "Beş soruluk uygulama oyunu", game),
    gameScreen("s16", "Ders sonu testi", final),
    { id: "s17", type: "vocabulary-hunt", title: "Kelime Avı", instructionTr: "Bu dersin hedef kelimeleriyle kısa tekrar oyunu oyna.", content: { rounds: vocabHunt(words, meta.id) }, points: 25 },
    { id: "s18", type: "summary", title: "Ders özeti", instructionTr: "Kaynak dersteki ana noktaları kapat.", content: { points: [objectives[0] || meta.title, objectives[1] || "", `Hedef kelimeler: ${words.map(w => w.word).join(", ")}`].filter(Boolean) } }
  ];
  return {
    lesson: { id: meta.id, title: meta.title, level: "A1+", module: "Günlük Hayat", estimatedMinutes: 45, objectives, prerequisites: [], parentGuide: { summaryTr: parentNote || explanation[0] || meta.title, todayGoal: objectives[0] || meta.title, teachingTips: [objectives[0] || "Hedef yapıyı kısa cümlelerle tekrar edin.", "Yanlışta önce özne ve yardımcı fiile baktırın.", "Voleybol, müzik ve günlük hayat örneklerini karışık sorun."], questionsToAsk: examples.slice(0, 4), listeningScripts: [listening.text], speakingRubric: ["10 puan: Dört öz değerlendirme maddesi tamam", "5 puan: Destekle iki cümle", "0 puan: Örnekleri tekrar dinleyip yeniden deneme"], worksheet: worksheet(meta.title, [...mc8, ...game, ...final], fill, order, error) }, vocabulary: words.map(w => w.id), screens, assessment: { passScore: 60, starThresholds: { one: 60, two: 75, three: 90 }, completionBonus: 20 } },
    words
  };
}

const source = fs.readFileSync(sourcePath, "utf8");
const corrected = applyEditorial(source);
fs.writeFileSync(path.join(root, "docs/module2_source_corrected.md"), corrected, "utf8");

const lessons = splitLessons(corrected).map(createLesson);
for (const { lesson } of lessons) writeJson(`data/lessons/${lesson.id}.json`, lesson);

const vocabulary = readJson("data/vocabulary.json");
const keep = (vocabulary.items || []).filter(w => !lessons.some(x => x.lesson.id === w.lessonId));
vocabulary.version = 3;
vocabulary.items = [...keep, ...lessons.flatMap(x => x.words)];
writeJson("data/vocabulary.json", vocabulary);

const curriculum = readJson("data/curriculum.json");
curriculum.sprint = 2.3;
const mod = curriculum.modules.find(m => m.id === "module-2");
const rows = [
  { id: "008-present-simple-affirmative", order: 8, title: "Present Simple — Olumlu Cümleler", file: "data/lessons/008-present-simple-affirmative.json", status: "published", prerequisites: ["007-demonstratives"] },
  ...["09","10","11","12","13","14","15"].map(no => { const meta = lessonMeta[no]; return { id: meta.id, order: Number(no), title: meta.title, file: `data/lessons/${meta.id}.json`, status: "published", prerequisites: [Number(no) === 9 ? "008-present-simple-affirmative" : lessonMeta[String(Number(no) - 1).padStart(2, "0")].id] }; })
];
mod.lessons = rows;
writeJson("data/curriculum.json", curriculum);

console.log(`Imported ${lessons.length} Module 2 lessons from corrected source.`);
