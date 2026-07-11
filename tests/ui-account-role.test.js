import { strict as assert } from 'assert';
import fs from 'fs';
import path from 'path';
import { describe, it } from 'node:test';

const APP_JS = path.resolve('C:/Users/USER/Documents/english time/js/app.js');
const STORAGE_JS = path.resolve('C:/Users/USER/Documents/english time/js/storage.js');
const src = fs.readFileSync(APP_JS, 'utf8');
const storageSrc = fs.readFileSync(STORAGE_JS, 'utf8');

describe('UI role & presentation checks', ()=>{
  it('adds a titleCaseName helper', ()=>{
    assert.ok(/function\s+titleCaseName\(/.test(src), 'titleCaseName helper not found');
  });

  it('uses titleCaseName on home greeting', ()=>{
    assert.ok(/titleCaseName\(state.profile.name\)/.test(src), 'home greeting not using titleCaseName');
  });

  it('final exam certificate uses titleCaseName or neutral default', ()=>{
    assert.ok(/studentName:\s*titleCaseName\(x.profile\?\.name\)\|\|"Öğrenci"/.test(src) || /studentName:\s*titleCaseName\(/.test(src), 'certificate studentName not using titleCaseName');
  });

  it('removes hardcoded "Beyza" in welcome lead text', ()=>{
    assert.ok(!/Poma Academy içinde Beyza/.test(src), 'Found hardcoded Beyza in welcome lead');
  });

  it('welcome default name is neutral', ()=>{
    assert.ok(/\|\|"Öğrenci"/.test(src), 'Welcome default name not changed to ÖĞrenci');
    assert.match(storageSrc, /profile:\s*\{\s*name:\s*""/, 'default profile name should not be hardcoded to Beyza');
  });

  it('parent mode is guarded for student accounts and header button toggled', ()=>{
    assert.ok(/function parent\(/.test(src), 'parent function missing');
    assert.ok(/const acctType = account\.profile\?\.account_type \|\| "parent";/.test(src) || /const acctType = account\.profile\?\.account_type \|\| 'parent';/.test(src), 'account type default logic missing');
    assert.ok(/if\(acctType === "student"\)/.test(src), 'student guard for parent mode missing');
    assert.ok(/if\(\["parent","both"\]\.includes\(acctType\) && !getActiveStudentId\(account\.user\.id\)\)/.test(src), 'parent active student guard missing');
    assert.ok(/parent-button/.test(src), 'parent-button selector missing');
  });
});