const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const {stripTypeScriptTypes} = require('node:module');
const source = fs.readFileSync(require('node:path').join(__dirname, '../components/readiness-assessment.tsx'),'utf8').split('export function ReadinessAssessment')[0].replace(/^import .*;\n/gm,'');
let generatedBlob;
const context = {console,Blob,Date,Set,Math,URL:{createObjectURL:b=>{generatedBlob=b;return 'blob:unit-test'},revokeObjectURL:()=>{}},document:{createElement:()=>({click(){},remove(){}}),body:{appendChild(){}}}};
vm.createContext(context);vm.runInContext(stripTypeScriptTypes(source),context);
const keys=['issuePosition','evidenceInformation','exposureStakes','actionsEscalation','optionsAwareness','preparedness'];
const dimensions=keys.map(key=>({key,label:key}));
function analysis(scores, flags=[]){ const answers=Object.fromEntries(keys.flatMap((key,i)=>[1,2,3,4].map(j=>['q'+(i+1)+'_'+j,Math.round(scores[key]/4)])));return context.buildAnalysis(dimensions,scores,answers,flags); }
(async()=>{
 for(const [score,expected] of [[0,'Needs Attention'],[2,'Needs Attention'],[3,'Developing'],[5,'Developing'],[6,'Established'],[8,'Established']])assert.equal(context.bandFor(score),expected);
 const middle=Object.fromEntries(keys.map(k=>[k,4]));const balanced=analysis(middle);assert.match(balanced.profileSummary,/All six areas are developing/);assert.equal(balanced.strengths.length,1);assert.match(balanced.strengths[0].body,/no area is identified as stronger/);assert.ok(balanced.nextSteps.length);
 const low=analysis(Object.fromEntries(keys.map(k=>[k,0])));assert.match(low.strengths[0].title,/foundations/);assert.ok(!low.strengths.some(s=>s.body.includes('Your records appear')));
 const high=analysis(Object.fromEntries(keys.map(k=>[k,8])));assert.equal(high.priorities.length,0);assert.equal(high.nextSteps.length,3);
 const mixed=analysis({...Object.fromEntries(keys.map(k=>[k,8])),evidenceInformation:0});assert.equal(mixed.priorities[0].title,'evidenceInformation');assert.match(mixed.nextSteps.join(' '),/evidence/);
 const urgent=analysis(middle,[true,true,false,false,false]);assert.equal(urgent.complexityFactors.length,2);assert.deepEqual(Array.from(urgent.nextSteps),Array.from(balanced.nextSteps));
 context.downloadBriefPdf(dimensions,middle,balanced);const pdf=await generatedBlob.text();assert.match(pdf,/YOUR NEXT ACTION NOTE/);assert.match(pdf,/Page 1 of/);const pdfText = Array.from(pdf.matchAll(/\((.*?)\) Tj/g), m => m[1]).join(" ");assert.match(pdfText,/not reviewed your documents/);
 console.log('PASS: band boundaries; equal-score interpretation; low scores; established-profile next steps; evidence-gap prioritisation; separate complexity; action-note PDF generation');
})().catch(e=>{console.error(e);process.exitCode=1});

