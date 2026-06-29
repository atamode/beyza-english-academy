import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const excluded=new Set([".git",".deploy","dist",".zip-check-final","node_modules"]);
const textExtensions=new Set([".js",".json",".md",".html",".css",".webmanifest",".txt",".bat",".py"]);

function repairMojibake(text){
  let current=text;
  for(let pass=0;pass<4;pass++){
    const next=current.replace(/[\u00C2-\u00F4][\u0080-\u00BF]+/g,chunk=>{
      const bytes=Array.from(chunk,ch=>ch.charCodeAt(0));
      const decoded=Buffer.from(bytes).toString("utf8");
      return decoded.includes("\uFFFD")?chunk:decoded;
    });
    if(next===current)break;
    current=next;
  }
  return current.replace(/\u00A0/g," ").replace(/\uFFFD/g,"");
}

function cleanFile(file){
  const original=fs.readFileSync(file,"utf8");
  const fixed=repairMojibake(original);
  if(fixed!==original)fs.writeFileSync(file,fixed,"utf8");
}

function walk(dir){
  for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
    if(excluded.has(ent.name)||ent.name.endsWith(".zip"))continue;
    const full=path.join(dir,ent.name);
    if(ent.isDirectory())walk(full);
    else if(textExtensions.has(path.extname(ent.name))||ent.name==="manifest.webmanifest")cleanFile(full);
  }
}

walk(root);
console.log("UTF cleanup complete.");
