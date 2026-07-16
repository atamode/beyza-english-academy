import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { reportPeriod, previousReportPeriod } from "../js/report-periods.js";

const sql=fs.readFileSync(new URL("../supabase/migrations/202607160005_learning_reports_phase1.sql",import.meta.url),"utf8");

test("weekly period is Monday to next Monday in Europe/Istanbul UTC boundaries",()=>{const p=reportPeriod("weekly",new Date("2026-07-16T12:00:00Z"));assert.equal(p.startDate,"2026-07-13");assert.equal(p.start,"2026-07-12T21:00:00.000Z");assert.equal(p.end,"2026-07-19T21:00:00.000Z");});
test("monthly period follows Istanbul calendar month",()=>{const p=reportPeriod("monthly",new Date("2026-07-31T22:30:00Z"));assert.equal(p.startDate,"2026-08-01");assert.equal(p.start,"2026-07-31T21:00:00.000Z");assert.equal(p.end,"2026-08-31T21:00:00.000Z");});
test("previous periods are complete calendar periods",()=>{assert.equal(previousReportPeriod("weekly",new Date("2026-07-16T12:00:00Z")).startDate,"2026-07-06");assert.equal(previousReportPeriod("monthly",new Date("2026-07-16T12:00:00Z")).startDate,"2026-06-01");});
test("server counts each lesson answer key once and keeps game metrics separate",()=>{assert.match(sql,/for answer in select key,value from jsonb_each/);assert.match(sql,/total_answers:=total_answers\+1/);assert.match(sql,/'games',null,'stories',null/);assert.doesNotMatch(sql,/football[^\n]*total_answers|volleyball[^\n]*total_answers/i);});
test("accuracy is bounded and avoids division by zero",()=>{assert.match(sql,/if total_answers>0 then accuracy:=least\(100,greatest\(0,round\(correct_answers\*100\.0\/total_answers\)::int\)\)/);assert.match(sql,/'accuracy_percent',accuracy/);});
test("empty period produces an honest safe report",()=>{assert.match(sql,/completed_count=0 and total_answers=0 and seen_words=0/);assert.match(sql,/yeterli çalışma kaydı bulunmuyor/);assert.match(sql,/'has_data',\(completed_count\+started_count\+total_answers\+seen_words\)>0/);});
test("strong and review topics come only from recorded diagnostic skill groups",()=>{assert.match(sql,/diagnostic,skillGroups/);assert.match(sql,/percent'\)::int>=75/);assert.match(sql,/percent'\)::int<60/);});
test("legacy malformed timestamps normalize without crashing",()=>{assert.match(sql,/learning_report_safe_timestamptz/);assert.match(sql,/exception when others then return null/);});
test("snapshot payload excludes direct personal identifiers",()=>{const payloadSection=sql.slice(sql.indexOf("return jsonb_build_object"),sql.indexOf("end $$;",sql.indexOf("return jsonb_build_object")));assert.doesNotMatch(payloadSection,/email|parent_user_id|child_id|auth\.uid|display_name/i);});
