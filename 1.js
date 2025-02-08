// sptcd -d

const isBrowser=typeof document!=='undefined'

function step(arr) {
  let i=0, j=1, n=arr.length
  let mov=new Array(n).fill(0)
  for(; j<n; j++) {
    if(arr[j]===0) continue
    if(arr[i]===arr[j]) {
      arr[i]*=2
      arr[j]=0
      mov[j]=j-i
      i++
    }else if(arr[i]!==arr[j]) {
      if(arr[i]===0) {
        arr[i]=arr[j]
        arr[j]=0
        mov[j]=j-i
        j--
      }else{
        if(arr[i+1]===0) {
          arr[i+1]=arr[j]
          arr[j]=0
          mov[j]=j-i-1
        }
        i++
      }
    }
  }
  return mov
}

let r=4, map=[], record=[]

function newGame(noRender) {
  record=[]
  map=[]
  for(let i=0; i<r; i++) {
    map[i]=[]
    for(let j=0; j<r; j++) {
      map[i][j]=0
    }
  }
  const news=addNewNum(2)
  if(noRender) return;
  render(null, null, news)
}

function addNewNum(n) {
  let news=[]
  for(;n--;) {
    const p=(Math.round(Math.random())+1)*2
    let v=[]
    for(let i=0; i<r; i++) {
      for(let j=0; j<r; j++) {
        if(map[j][i]===0) {
          v.push([j, i])
        }
      }
    }
    const [y, x]=v[Math.floor(v.length*Math.random())]
    map[y][x]=p
    news.push([y, x])
  }
  return news
}

function playStep(dir) {
  let moveStep=0, moves=[], n=0
  function moved(mov, isX, rev) {
    if(rev) mov.reverse()
    moveStep=moveStep+mov.reduce((a, b)=>a+b)
    if(isX) {
      moves[n]=mov
    }else{
      for(let i=0; i<r; i++) {
        moves[i]=moves[i] || []
        moves[i][n]=mov[i]
      }
    }
    n++
  }
  if(dir==='left') {
    for(let i=0; i<r; i++) {
      moved(step(map[i]), true)
    }
  }else if(dir==='right') {
    for(let i=0; i<r; i++) {
      const p=map[i].slice().reverse()
      moved(step(p), true, true)
      map[i]=p.reverse()
    }
  }else if(dir==='up') {
    for(let i=0; i<r; i++) {
      let p=[]
      for(let j=0; j<r; j++) {
        p.push(map[j][i])
      }
      moved(step(p), false)
      for(let j=0; j<r; j++) {
        map[j][i]=p[j]
      }
    }
  }else if(dir==='down') {
    for(let i=0; i<r; i++) {
      let p=[]
      for(let j=0; j<r; j++) {
        p.unshift(map[j][i])
      }
      moved(step(p), false, true)
      for(let j=0; j<r; j++) {
        map[j][i]=p[r-j-1]
      }
    }
  }
  return [moveStep, moves]
}

async function render(moves, dir, news, end) {
  if(moves) {
    let w=0
    for(let i=0; i<r; i++) {
      for(let j=0; j<r; j++) {
        const c=document.getElementById(`i${i}j${j}`)
        const k=moves[i][j]
        if(k>0) {
          w=Math.max(w, k)
          c.className+=` tr-${k} m-${dir[0]}${k}`
        }
      }
    }
    await sleep(w*50+1)
  }
  let str=''
  for(let i=0; i<r; i++) {
    for(let j=0; j<r; j++) {
      const isNew=news && news.find(x=>x[0]===i && x[1]===j)
      str+=`<div id='i${i}j${j}' class='num ${isNew? 'new': ''} n${Math.min(2048, map[i][j])}'>${map[i][j] || ''}</div>`
    }
  }
  if(end) {
    str+=`<div class='end'>Gameover</div>`
  }
  board.innerHTML=str
}

function isGameover() {
  for(let i=0; i<r; i++) {
    for(let j=0; j<r; j++) {
      let a=map[j][i]
      if(i<r-1 && a===map[j][i+1]) return false
      if(j<r-1 && a===map[j+1][i]) return false
      if(a===0) return false
    }
  }
  return true
}

function shouldRecord() {
  return isBrowser && !query('t')
}

function saveRecord(rec, n) {
  const sav=JSON.stringify(rec)
  if(isBrowser) {
    const xhr=new XMLHttpRequest
    xhr.open('POST', '/do.s?a=save&n='+n, true)
    xhr.setRequestHeader('content-type', 'application/x-www-form-urlencoded')
    xhr.send(sav)
  }else{
    const fn=`${n}-${Date.now()}-mod-exp.json`
    const fs=require('fs')
    fs.writeFileSync(__dirname+'/'+fn, sav)
  }
}

function playStepEx(dir, noRender) {
  if(isGameover()) {
    newGame(noRender)
    return false
  }

  const mapCopy=copy()
  const [moveStep, moves]=playStep(dir)

  if(!moveStep) return false

  if(shouldRecord()) record.push([mapCopy, dir])

  let news=addNewNum(1)

  const end=isGameover()

  if(end && shouldRecord() && getState().max>=1024) {
    saveRecord(record, getState().max)
    alert('saved!')
  }

  if(!noRender) {
    render(moves, dir, news, end)
  }

  return true
}

function sleep(t) {
  return new Promise(r=>setTimeout(r, t))
}

if(isBrowser) {
  document.onkeydown=e=>{
    playStepEx(
      (e.keyCode===38 && 'up') ||
       (e.keyCode===39 && 'right') ||
      (e.keyCode===40 && 'down') ||
      (e.keyCode===37 && 'left')
    )
  }

  let tx=-1, ty=-1
  window.ontouchstart=e=>{
    tx=e.touches[0].clientX
    ty=e.touches[0].clientY
  }
  window.ontouchend=e=>{
    const tx1=e.changedTouches[0].clientX
    const ty1=e.changedTouches[0].clientY
    const dx=tx1-tx, dy=ty1-ty
    const adx=Math.abs(dx), ady=Math.abs(dy)
    if(adx*3>ady && adx>20) playStepEx(dx<0? 'left': 'right')
    else if(ady*3>adx && ady>20) playStepEx(dy<0? 'up': 'down')
  }

}




// tfjs

newGame(true)
const tf=isBrowser? window.tf: require('@tensorflow/tfjs-node-gpu')

async function loadModel() {
  const [savePath, loadPath]=[
    isBrowser? null: 'file://'+__dirname+'/mod-2048',
    isBrowser? './mod-2048/model.json': 'file://'+__dirname+'/mod-2048/model.json',
  ]

  const saveFn=async model=>model.save(savePath)
  try{
    const model=await tf.loadLayersModel(loadPath)
    return [model, _=>saveFn(model)]
  }catch(e) {}

  const model=tf.sequential()
  model.add(tf.layers.embedding({
    inputShape: [4, 4],
    inputDim: 16,
    outputDim: 16,
  }))
  model.add(tf.layers.conv2d({
    kernelSize: 3,
    filters: 32,
    padding: 'same',
    activation: 'relu'
  }))
  model.add(tf.layers.maxPooling2d({poolSize: 2, strides: 2}))
  model.add(tf.layers.conv2d({
    kernelSize: 3,
    filters: 64,
    padding: 'same',
    activation: 'relu'
  }))
  model.add(tf.layers.maxPooling2d({poolSize: 2, strides: 2}))
  model.add(tf.layers.flatten({}))
  model.add(tf.layers.dense({
    units: 256,
    activation: 'relu',
  }))
  model.add(tf.layers.dense({
    units: 256,
    activation: 'relu',
  }))
  model.add(tf.layers.dense({
    units: 4,
    useBias: true,
    activation: 'softmax',
  }))
  await saveFn(model)
  return [model, _=>saveFn(model)]
}

function dir2y(dir) {
  return ['up', 'right', 'down', 'left'].indexOf(dir)
}
function y2dir(y) {
  return ['up', 'right', 'down', 'left'][y]
}
function getState() {
  let max=0, empty=0
  for(let i=0; i<4; i++) {
    for(let j=0; j<4; j++) {
      max=Math.max(max, map[i][j])
      if(!map[i][j]) empty++
    }
  }
  return {max, empty}
}
function copy() {
  return map.map(x=>x.slice())
}
function mapCopy2x(mapCopy) {
  for(let i=0; i<4; i++) {
    for(let j=0; j<4; j++) {
      if(mapCopy[i][j]) {
        mapCopy[i][j]=Math.log2(mapCopy[i][j])
      }
    }
  }
  return mapCopy
}
function rsort(arr) {
  return arr.sort(_=>Math.random()-.5)
}

function rotate90(map, r) {
  const map2=[]
  for(let i=0; i<r; i++) {
    for(let j=0; j<r; j++) {
      map2[j]=map2[j] || []
      map2[j][r-1-i]=map[i][j]
    }
  }
  return map2
}
function flip180(map, r, horizon) {
  const map2=[]
  for(let i=0; i<r; i++) {
    for(let j=0; j<r; j++) {
      if(horizon) {
        map2[i]=map2[i] || []
        map2[i][r-j-1]=map[i][j]
      }else{
        map2[r-i-1]=map2[r-i-1] || []
        map2[r-i-1][j]=map[i][j]
      }
    }
  }
  return map2
}

function argu_xy(o) {
  let {x, y}=o
  const ls=[o]
  o.dir=y2dir(y)
  for(let i=1; i<4; i++) {
    x=rotate90(x, 4)
    ls.push({
      ...o,
      x,
      y: (i+y)%4,
      dir: y2dir((i+y)%4),
    })
  }
  for(let i=0; i<4; i++) {
    const o=ls[i]
    ls.push({
      ...o,
      x: flip180(o.x, 4, o.y%2===0),
      dir: y2dir(o.y),
    })
  }
  return ls
}

function expert_track() {
  const track_steps=[]
  const fs=require('fs')
  fs.readdirSync('.').map(x=>{
    if(x.indexOf('-exp.json')>-1) {
      const res=JSON.parse(fs.readFileSync(__dirname+'/'+x, 'utf8'))
      const track=[]
      for(const [mapCopy, dir] of res) {
        const axy=argu_xy({
          x: mapCopy2x(mapCopy),
          y: dir2y(dir),
        })
        track_steps.push(...axy)
      }
    }
  })
  return track_steps
}

function* getTrainBatch(model, batchSize=256) {
  const minNum=1024
  const track_maxlen=200
  const track_ls=[]

  const exp_track_steps=expert_track()

  function build_xy() {
    const xy=[...exp_track_steps]
    for(const {track} of track_ls) {
      xy.push(...track)
    }
    rsort(xy)
    return xy
  }

  for(let xy=[];;) {
    if(xy.length>batchSize) {
      const xys=xy.splice(0, batchSize)
      const xs=[], ys=[]
      for(const {x, y} of xys) {
        xs.push(x)
        ys.push(y)
      }
      x=tf.tidy(_=>tf.tensor3d(xs, [batchSize, 4, 4]))
      y=tf.tidy(_=>tf.oneHot(tf.tensor1d(ys, 'int32'), 4))
      yield [x, y]
    }else{
      xy=xy.concat(build_xy())
    }

    newGame(true)
    let ts={
      empty: 0,
      max: 0,
      v: 0,
      track: [],
      record: [],
    }
    for(;!isGameover();) {
      const r=predict(model)
      for(const dir of r) {
        const mapCopy=copy()
        const recordStep=[copy(), dir]
        if(playStepEx(dir, true)) {
          let {max, empty}=getState()
          empty+=1
          ts.max=max
          ts.empty+=empty
          ts.track.push(...argu_xy({
            x: mapCopy2x(mapCopy),
            y: dir2y(dir),
            max,
            empty,
          }))
          ts.record.push(recordStep)
          break
        }
      }
    }

    const max=getState().max
    if(max>=minNum) {
      ts.v=ts.max*1e3+ts.empty/1e3

      saveRecord(ts.record, max)
      track_ls.push(ts)

      if(track_ls.length>track_maxlen) {
        let min_i=-1, min_s=1e8
        for(let i=0; i<track_ls.length; i++) {
          if(track_ls[i].v<min_s) {
            min_s=track_ls[i].v
            min_i=i
          }
        }
        track_ls.splice(min_i, 1)
      }
    }

  }
}

function predict(model) {
  x=tf.tensor3d([mapCopy2x(copy())], [1, 4, 4])
  const y=model.predictOnBatch(x)
  const ns=tf.topk(y, 4).indices.dataSync()
  return [...ns].map(n=>y2dir(n))
}

async function test(isRandom, n=1000, log_step=200) {
  const [model]=await loadModel()
  let maxs={}
  let str=''
  for(let i=0; i<n; i++) {
    newGame(true)
    for(;!isGameover();) {
      const r=isRandom?
        rsort(['up', 'down', 'right', 'left']):
        predict(model)
      for(const dir of r) {
        if(playStepEx(dir, true)) break
      }
    }
    const max=getState().max
    maxs[max]=maxs[max] || 0
    maxs[max]++
    str=`${isRandom? "random:": "model:"} ${i+1} ${JSON.stringify(maxs)}`
    if((i+1)%log_step===0) {
      console.log(str)
    }
  }
  return maxs
}

function query(k) {
  return isBrowser && location.href.match(new RegExp(`\\b${k}=(.+?)\\b|$`))[1] || ''
}

; (async _=>{
  const state=isBrowser?
    query('t'):
    process.argv[2]==='train'? 'train': 'test'

  if(!state) {
    newGame()
    return
  }


  const [model, save]=await loadModel()
  model.summary()

  if(state==='train') {
    model.compile({
      optimizer: tf.train.adam(1e-3),
      loss: 'categoricalCrossentropy',
    })
    const ds=getTrainBatch(model)
    let step=0, losses=0
    for(const [x, y] of ds) {
      const loss_v=await model.trainOnBatch(x, y)
      losses+=loss_v
      if(step%100===0) console.log("loss:", loss_v)
      if(++step>1000) {
        await save()
        console.log("loss_avg:", losses/step)
        const [rand, mod]=await Promise.all([
          test(true, 100),
          test(false, 100),
        ])
        const table={}
        for(let k of [...Object.keys(rand), ...Object.keys(mod)].map(x=>parseInt(x)).sort()) {
          table[k]={
            random: rand[k] || 0,
            model: mod[k] || 0,
          }
        }
        console.log("test:")
        console.table(table)
        console.log("--saved--")
        step=0
        losses=0
      }
    }
  }else if(state==='test') {
    await test(true)
    await test(false)
  }else if(state==='play') {
    newGame()
    for(;;) {
      const dirs=await predict(model)
      for(const dir of dirs) {
        if(playStepEx(dir)) break
      }
      if(isGameover()) return;
      await sleep(200)
    }
  }

})()
