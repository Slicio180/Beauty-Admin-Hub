const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.AIK_CHROMIUM||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try{
 const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setContent(require('./preview.cjs').buildPreview());
 await page.getByRole('button',{name:'Create local test list',exact:true}).click();
 await page.getByRole('button',{name:'Players',exact:true}).click();
 await page.getByRole('button',{name:'Bulk add players',exact:true}).click();
 await page.getByLabel('Player names').fill('Test A\nTest B\nTest C\nTest D');
 await page.getByRole('button',{name:'Review names',exact:true}).click();
 await page.getByRole('button',{name:'Add 4 valid players',exact:true}).click();
 await page.getByRole('button',{name:'Player averages',exact:true}).click();
 const ids=await page.getByLabel('Player',{exact:true}).locator('option').evaluateAll(opts=>opts.map(o=>o.value));
 for(let i=0;i<ids.length;i++){
  await page.getByLabel('Player',{exact:true}).selectOption(ids[i]);await page.getByLabel('Three-dart average').fill(String(80-i*10));await page.getByRole('button',{name:'Save average',exact:true}).click();
  await page.waitForFunction(()=>!document.querySelector('button').disabled);
 }
 await page.getByRole('button',{name:'Tournaments',exact:true}).click();
 await page.getByRole('button',{name:'New internal tournament',exact:true}).click();
 await page.getByLabel('Tournament name',{exact:true}).fill('Pairing UI test');
 await page.getByLabel('Format',{exact:true}).selectOption('doubles');
 for(const name of ['Test A','Test B','Test C','Test D'])await page.getByLabel(name,{exact:true}).check();
 await page.getByRole('button',{name:'Generate couples',exact:true}).click();
 await page.getByText('Test A + Test D',{exact:true}).waitFor();await page.getByText('Test B + Test C',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Save and open Pool Planner',exact:true}).click();
 await page.getByRole('button',{name:'Generate new draw',exact:true}).click();
 await page.getByLabel('I have checked every group',{exact:true}).check();
 await page.getByRole('button',{name:'Save reviewed pool plan',exact:true}).click();
 await page.getByText('Reviewed plan saved in this preview tab.',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Back to tournaments',exact:true}).click();await page.getByRole('button',{name:'Open Pool Planner',exact:true}).click();
 await page.getByText('Test A + Test D',{exact:true}).waitFor();
 if(errors.length)throw Error(errors.join('\n'));
 console.log('PASS rendered UI: bulk add, manual averages, default Fair couples, balanced groups, reviewed save and reopen.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
