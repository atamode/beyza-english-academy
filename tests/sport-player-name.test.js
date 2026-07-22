import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { sportPlayerName } from "../js/sport-player.js";

test("sport score uses the entered student name and a neutral fallback", () => {
  assert.equal(sportPlayerName({ profile: { name: "  Ece   Deniz  " } }), "Ece Deniz");
  assert.equal(sportPlayerName({ profile: { name: "" } }), "Poma");
  assert.equal(sportPlayerName({}), "Poma");
});

test("football and volleyball scoreboards use the shared escaped player label", () => {
  for (const file of ["js/football-game.js", "js/volleyball-game.js"]) {
    const source = fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
    assert.match(source, /sportPlayerName\(context\.state\)/);
    assert.match(source, /<strong>\$\{esc\(player\)\}/);
    assert.doesNotMatch(source, /<strong>Beyza /);
  }
});
