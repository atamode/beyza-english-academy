import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { exec } from "node:child_process";
import { fileURLToPath } from "node:url";
const root=path.dirname(fileURLToPath(import.meta.url)),port=8765;
const types={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".json":"application/json; charset=utf-8",".svg":"image/svg+xml",".webmanifest":"application/manifest+json"};
http.createServer((req,res)=>{const clean=decodeURIComponent(req.url.split("?")[0]);let target=path.join(root,clean==="/"?"index.html":clean);if(!target.startsWith(root)){res.writeHead(403).end();return}fs.readFile(target,(err,data)=>{if(err){res.writeHead(404).end("Not found");return}res.writeHead(200,{"Content-Type":types[path.extname(target)]||"application/octet-stream","Cache-Control":"no-cache"});res.end(data)})}).listen(port,"127.0.0.1",()=>{const url=`http://127.0.0.1:${port}`;console.log(`Beyza English Academy: ${url}`);exec(`start "" "${url}"`)});
