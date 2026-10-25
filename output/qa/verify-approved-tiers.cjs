const fs=require('node:fs');const assert=require('node:assert/strict');const dotenv=require('../../apps/backend/node_modules/dotenv');
const live=process.argv[2]==='live';const stage=process.argv[3]??'before';
const targets={retatrutide:{10:298,20:488,40:688},tirzepatide:{10:248,20:398,40:588},semaglutide:{10:198,20:338,40:488}};
(async()=>{
 const env=dotenv.parse(fs.readFileSync(live?'.vercel/.env.production.local':'apps/storefront/.env.local'));
 const base=live?env.NEXT_PUBLIC_MEDUSA_BACKEND_URL:'http://localhost:9000'; const headers={'x-publishable-api-key':env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY};
 const response=await fetch(base+'/store/regions',{headers});assert.equal(response.status,200);const {regions}=await response.json();assert.equal(regions.length,12);
 const snapshot=await Promise.all(regions.map(async region=>{const r=await fetch(base+'/store/products?region_id='+region.id+'&fields=id,title,handle,description,subtitle,thumbnail,+metadata,*images,*variants,*variants.calculated_price,+variants.inventory_quantity&limit=100',{headers});assert.equal(r.status,200);const {products}=await r.json();assert.equal(products.length,5);return{currency:region.currency_code,region:region.name,products}}));
 const file='output/qa/approved-tiers-'+(live?'live':'local')+'-'+stage+'.json';
 if(stage==='after'){
  const before=JSON.parse(fs.readFileSync(file.replace('-after.json','-before.json')));let verified=0;
  for(const market of snapshot){const oldMarket=before.find(m=>m.currency===market.currency);for(const p of market.products){const old=oldMarket.products.find(o=>o.id===p.id);assert(old);for(const key of ['title','subtitle','description','thumbnail','images'])assert.deepEqual(p[key],old[key]);assert.equal(p.variants.length,old.variants.length);
   const tiers=targets[p.handle];for(const [key,value]of Object.entries(old.metadata)){if(tiers&&['retail_pricing_note','us_pricing_note','us_pricing_provisional'].includes(key))continue;assert.deepEqual(p.metadata[key],value,key)}
   for(const v of p.variants){const ov=old.variants.find(o=>o.id===v.id);assert(ov);for(const key of ['sku','title','inventory_quantity','manage_inventory','allow_backorder'])assert.equal(v[key],ov[key]);let expected=ov.calculated_price.calculated_amount;
    if(tiers){const amount=Number(v.title.match(/^(10|20|40)\s*mg$/i)[1]);const oldUsd=before.find(m=>m.currency==='usd').products.find(o=>o.id===p.id).variants.find(o=>o.id===v.id).calculated_price.calculated_amount;const precision=['huf','isk'].includes(market.currency)?1:100;expected=market.currency==='usd'?tiers[amount]:Math.round(expected*tiers[amount]/oldUsd*precision)/precision;assert.equal(p.metadata.pen_tier_pricing_revision,'approved-pen-retail-2026-10-13-v1');}
    assert.equal(v.calculated_price.calculated_amount,expected,p.handle+' '+v.title+' '+market.currency);verified++;
   }
  }}assert.equal(verified,132);console.log('Verified all 132 prices, including 108 approved pen prices and 24 unchanged spray prices; names, images, copy, SKUs and stock preserved.');
 }
 fs.writeFileSync(file,JSON.stringify(snapshot,null,2));console.log(file);console.log(JSON.stringify(snapshot.find(m=>m.currency==='usd').products.map(p=>({name:p.title,prices:p.variants.map(v=>({size:v.title,usd:v.calculated_price.calculated_amount}))})),null,2));
})().catch(e=>{console.error(e);process.exit(1)});
