const fs = require('node:fs'); const assert = require('node:assert/strict'); const crypto = require('node:crypto');
const live = process.argv[2] === 'live';
const dotenv = require('../../apps/backend/node_modules/dotenv');
const env = dotenv.parse(fs.readFileSync(live ? '.vercel/.env.production.local' : 'apps/storefront/.env.local'));
const base = live ? env.NEXT_PUBLIC_MEDUSA_BACKEND_URL : 'http://localhost:9000';
const before = JSON.parse(fs.readFileSync(live ? 'output/qa/pricing-after-premium.json' : 'output/qa/pricing-local-after-premium.json'));
(async()=>{
 const headers = {'x-publishable-api-key':env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY};
 const response = await fetch(base+'/store/regions',{headers}); assert.equal(response.status,200);
 const {regions}=await response.json(); assert.equal(regions.length,12); let count=0; const after=[];
 for(const region of regions){
  const res=await fetch(base+'/store/products?region_id='+region.id+'&fields=id,title,handle,subtitle,description,thumbnail,+metadata,*images,*variants,*variants.calculated_price,+variants.inventory_quantity&limit=100',{headers}); assert.equal(res.status,200);
  const {products}=await res.json();assert.equal(products.length,5);
  const oldRegion=before.find(r=>r.currency===region.currency_code);
  for(const p of products){
   const old=oldRegion.products.find(o=>o.id===p.id); assert(old); assert.equal(p.title,old.title); assert.equal(p.images.length,2);
   assert.equal(p.metadata.testing,'Lab tested for purity'); assert.equal(p.metadata.purity,'99%'); assert(!/UK lab/i.test(p.description));
   assert(p.metadata.storage && p.metadata.stability && p.metadata.handling);
   const nasal=['selank','semax'].includes(p.handle);
   if(nasal){ assert.deepEqual(p.images,old.images); assert.equal(p.thumbnail,old.thumbnail); assert(!p.metadata.features?.includes('Freeze-dried peptide')); }
   else { assert.match(p.description,/freeze-dried peptide powder/);assert.match(p.description,/bacteriostatic water/);assert.equal(p.metadata.form,'Dual-chamber pen kit');assert.equal(p.metadata.features.length,3);assert.match(p.metadata.ingredients,new RegExp(p.title+' peptide powder')); assert(p.images.every(i=>i.url.endsWith('_lab.png'))); }
   for(const v of p.variants){ const ov=old.variants.find(o=>o.id===v.id); assert(ov); for(const field of ['sku','title','inventory_quantity','manage_inventory','allow_backorder'])assert.equal(v[field],ov[field]); assert.equal(v.calculated_price.calculated_amount,nasal? Math.round(ov.calculated_price.calculated_amount*50)/100:ov.calculated_price.calculated_amount); count++; }
   if(region.currency_code==='usd'&&!nasal){for(const i of p.images){const filename=i.url.split('/').pop().replace(/^\d+-/,''); const src=fs.readFileSync('apps/backend/assets/products/'+filename);const remote=await fetch(i.url);assert.equal(remote.status,200);const actual=Buffer.from(await remote.arrayBuffer());assert.equal(crypto.createHash('sha256').update(actual).digest('hex'),crypto.createHash('sha256').update(src).digest('hex'));}}
  }
  after.push({region:region.name,regionId:region.id,currency:region.currency_code,products});
 }
 assert.equal(count,132); fs.writeFileSync('output/qa/quality-and-prices-'+(live?'live':'local')+'.json',JSON.stringify(after,null,2));console.log('Verified all 132 prices, inventory, names, two images each, pen photo hashes, lab wording and dual-chamber details.');
 console.log(JSON.stringify(after.find(r=>r.currency==='usd').products.map(p=>({name:p.title,prices:p.variants.map(v=>({amount:v.title,usd:v.calculated_price.calculated_amount}))})),null,2));
})().catch(e=>{console.error(e);process.exit(1)});
