import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {practiceForWrongAnswer,tutorExplanation} from "../js/offline-tutor.js";

test("wrong lesson answer gets an authored explanation and a different answer-keyed practice question", () => {
  const lesson=JSON.parse(fs.readFileSync(new URL("../data/lessons/000-quick-start.json",import.meta.url)));
  const screen=lesson.screens.find(item=>item.type==="multiple-choice");
  const source=screen.content;
  const wrongIndex=source.options.findIndex((_,i)=>i!==source.correctIndex);
  const choice={question:source.prompt||screen.instructionTr||screen.title,selected:source.options[wrongIndex],correctAnswer:source.options[source.correctIndex],round:1};
  const practice=practiceForWrongAnswer(lesson,screen,choice);
  assert.ok(practice);
  assert.notEqual(practice.question,choice.question);
  assert.ok(practice.options[practice.correctIndex]);
  assert.match(tutorExplanation(screen,choice),/Doğru cevap:/);
});
