<?js
const url=require('url')
const qs=require('querystring')
const x=url.parse($_RAW_REQUEST.url)
const q=qs.parse(x.query)

function data() {
  return new Promise(resolve=>{
    const buf=[]
    $_RAW_REQUEST.on('data', b=>{
	    buf.push(b)
    })
    $_RAW_REQUEST.on('end', _=>{
      resolve(Buffer.concat(buf).toString())
    })
  })
}

if(q.a==='save') {
  const exp_dir=__dirname+'/exp-tracks'
  try{
    fs.mkdirSync(exp_dir)
  }catch(e) {}
  Sync.Push(data().then(x=>{
    const fn=`${exp_dir}/${q.n}-${Date.now()}.json`
    const fs=require('fs')
    fs.writeFileSync(fn, x)
  }))
}
