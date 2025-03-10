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

async function render(moves, dir, news, end, max) {
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
    str+=`<div class='end'>${max===2048? 'You Win!': 'Gameover'}</div>`
  }
  board.innerHTML=str
}

function isGameover() {
  if(getMax()===2048) return true
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

function saveRecord(rec) {
  const sav=JSON.stringify(rec)
  const xhr=new XMLHttpRequest
  xhr.open('POST', '/do.s?a=save', true)
  xhr.setRequestHeader('content-type', 'application/x-www-form-urlencoded')
  xhr.send(sav)
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
  const max=getMax()

  if(end && shouldRecord() && max===2048) {
    saveRecord(record)
    setTimeout(_=>alert('saved!'), 5e2)
  }

  if(!noRender) {
    render(moves, dir, news, end, max)
  }

  return true
}

function sleep(t) {
  return new Promise(r=>setTimeout(r, t))
}

if(isBrowser) {
  function set_lock(xs, t) {
    for(const x of xs.length? xs: [xs]) x.className=t? 'btn disable': 'btn'
  }
  function is_lock(x) {
    return x.className.indexOf('disable')>-1
  }
  document.onkeydown=e=>{
    if(is_lock(undo)) return;
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
    if(is_lock(undo)) return;
    const tx1=e.changedTouches[0].clientX
    const ty1=e.changedTouches[0].clientY
    const dx=tx1-tx, dy=ty1-ty
    const adx=Math.abs(dx), ady=Math.abs(dy)
    if(adx*3>ady && adx>20) playStepEx(dx<0? 'left': 'right')
    else if(ady*3>adx && ady>20) playStepEx(dy<0? 'up': 'down')
  }
  window.onbeforeunload=_=>'leave?'

  let isAutoplaying=false
  window.addEventListener('click', async e=>{
    if(is_lock(e.target)) return;
    if(e.target===undo) {
      map=record.pop()[0]
      render()
    }else if(e.target===newgame) {
      newGame()
    }else if(e.target===autoplay) {
      isAutoplaying=!isAutoplaying
      autoplay.innerHTML=isAutoplaying? 'Stop': 'Autoplay'
      set_lock([undo, newgame, autoplay], true)
      const v=autoplay.innerHTML
      autoplay.innerHTML='Loading..'
      const [model]=await loadModel()
      set_lock(autoplay, false)
      autoplay.innerHTML=v
      if(isGameover()) newGame()
      for(;;) {
        const dirs=await predict(model)
        if(!isAutoplaying) break
        for(const dir of dirs) {
          if(playStepEx(dir)) break
        }
        if(isGameover()) break;
        await sleep(200)
      }
      set_lock([undo, newgame], false)
      if(isAutoplaying) {
        isAutoplaying=false
        autoplay.innerHTML='Autoplay'
      }
    }
  })
}




// tfjs

const tf=isBrowser? window.tf: require('@tensorflow/tfjs-node-gpu')
let mod_cache={}
async function loadModel() {
  const mdir='mod-2048'
  const [savePath, loadPath]=isBrowser?
    [null, './'+mdir+'/model.json?t='+Math.floor(Date.now()/86400e3)]:
    ['file://'+__dirname+'/'+mdir, 'file://'+__dirname+'/'+mdir+'/model.json']

  const saveFn=async model=>model.save(savePath)
  try{
    if(!mod_cache[loadPath]) {
      mod_cache[loadPath]=await tf.loadLayersModel(loadPath)
    }
    const model=mod_cache[loadPath]
    return [model, _=>saveFn(model)]
  }catch(e) {}

  const model=tf.sequential()
  model.add(tf.layers.embedding({
    inputShape: [4, 4],
    inputDim: 12, // 0~11
    outputDim: 8,
  }))
  model.add(tf.layers.conv2d({
    kernelSize: 3,
    filters: 64,
    padding: 'same',
    activation: 'relu'
  }))
  model.add(tf.layers.conv2d({
    kernelSize: 3,
    filters: 64,
    padding: 'same',
    activation: 'relu'
  }))
  model.add(tf.layers.maxPooling2d({poolSize: 2, strides: 2}))

  model.add(tf.layers.conv2d({
    kernelSize: 3,
    filters: 128,
    padding: 'same',
    activation: 'relu'
  }))
  model.add(tf.layers.conv2d({
    kernelSize: 3,
    filters: 128,
    padding: 'same',
    activation: 'relu'
  }))
  model.add(tf.layers.maxPooling2d({poolSize: 2, strides: 2}))

  model.add(tf.layers.flatten({}))

  model.add(tf.layers.dense({
    units: 512,
    activation: 'relu',
  }))
  model.add(tf.layers.dense({
    units: 512,
    activation: 'relu',
  }))

  model.add(tf.layers.dropout(.2))

  model.add(tf.layers.dense({
    units: 4,
    activation: 'softmax',
  }))
  await saveFn(model)
  return [model, _=>saveFn(model)]
}

const dirs=['up', 'right', 'down', 'left']

function dir2y(dir) {
  return dirs.indexOf(dir)
}
function y2dir(y) {
  return dirs[y]
}
function getMax(m) {
  m=m || map
  let max=0
  for(let i=0; i<4; i++) {
    for(let j=0; j<4; j++) {
      max=Math.max(max, m[i][j])
    }
  }
  return max
}
function copy(m) {
  return (m || map).map(x=>x.slice())
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
    })
  }
  return ls
}

function expert_track(maxFilePerIter=100) {
  const fs=require('fs')
  const exp_dir=__dirname+'/exp-tracks'
  const fnList=fs.readdirSync(exp_dir).filter(x=>x.indexOf('.json')>-1)
  function loadFile(fn) {
    return JSON.parse(fs.readFileSync(exp_dir+'/'+fn, 'utf8'))
  }
  function loadXY(fn, track_steps) {
    const res=loadFile(fn)
    for(const [mapCopy, dir] of res) {
      track_steps.push(...argu_xy({
        x: mapCopy2x(mapCopy),
        y: dir2y(dir),
      }))
    }
  }
  function *iterator() {
    let track_steps=[], files=0
    for(;;) {
      rsort(fnList)
      for(let fn of fnList) {
        loadXY(fn, track_steps)
        files++
        if(files%maxFilePerIter===0) {
          yield rsort(track_steps)
          track_steps=[]
          files=0
        }
      }
    }
  }
  const steps=fnList.reduce((n, fn)=>{
    return n+loadFile(fn).length*8
  }, 0)
  return [steps, iterator()]
}

function getTrainData(batchSize) {

  const [exp_len, exp_iter]=expert_track()

  function *iterator() {
    for(let xy=[];;) {
      if(xy.length>batchSize) {
        const xys=xy.splice(0, batchSize)
        const xs=[], ys=[]
        for(const {x, y} of xys) {
          xs.push(x)
          ys.push(y)
        }
        yield {
          xs: tf.tidy(_=>tf.tensor3d(xs, [batchSize, 4, 4])),
          ys: tf.tidy(_=>tf.oneHot(tf.tensor1d(ys, 'int32'), 4)),
        }
      }else{
        xy=xy.concat(exp_iter.next().value)
      }
    }
  }

  return [iterator(), Math.round(exp_len/batchSize)]
}

function predict(model, maps) {
  maps=maps || [map]
  x=tf.tidy(_=>tf.tensor3d(
    maps.map(m=>mapCopy2x(copy(m))),
    [maps.length, 4, 4]
  ))
  const y=model.predictOnBatch(x)
  const ns=tf.topk(y, 4).indices.dataSync()
  return [...ns].map(n=>y2dir(n))
}

async function test(model, n=1000, batchSize=1024) {
  const randomMaxs={}
  for(let i=0; i<n; i++) {
    newGame(true)
    for(;!isGameover();) {
      for(const dir of rsort(dirs.slice(0))) {
        if(playStepEx(dir, true)) break
      }
    }
    const max=getMax()
    randomMaxs[max]=randomMaxs[max] || 0
    randomMaxs[max]++
  }
  const games=[]
  function addNewGame() {
    newGame(true)
    const state={map: copy()}
    games.push(state)
  }
  const modelMaxs={}
  for(;;) {
    for(; n && games.length<batchSize; ) {
      addNewGame()
      n--
    }
    if(!games.length) break
    let maps=[]
    for(const {map} of games) {
      maps.push(map)
    }
    const dirs=predict(model, maps)
    for(let i=0; i<dirs.length; i+=4) {
      map=games[i/4].map
      for(let j=i; j<i+4; j++) {
        const dir=dirs[j]
        if(playStepEx(dir, true)) break
      }
      if(isGameover()) {
        const max=getMax()
        modelMaxs[max]=modelMaxs[max] || 0
        modelMaxs[max]++
        games[i/4]=null
      }else{
        games[i/4].map=copy(map)
      }
    }
    for(let i=games.length; i--; ) {
      if(!games[i]) games.splice(i, 1)
    }
  }
  console.table({random: randomMaxs, model: modelMaxs})
}

function query(k) {
  return isBrowser && location.href.match(new RegExp(`\\b${k}=(.+?)\\b|$`))[1] || ''
}

; (async _=>{
  if(isBrowser) {
    newGame()
    return
  }

  const state=['train'].find(x=>x===process.argv[2]) || 'test'

  const [model, save]=await loadModel()

  if(state==='train') {
    const lr=1e-2
    const opt=tf.train.adam(lr)
    const dataset=getTrainData(16384) // batchSizeを大きくすると、性能が高くになります！

    if(state==='train') {
      model.summary()
    }

    model.compile({
      optimizer: opt,
      loss: 'categoricalCrossentropy',
      metrics: ['acc'],
    })
    const [ds, steps]=dataset
    let min_loss=99, hold_epoch=0
    model.fitDataset({iterator: _=>ds}, {
      epochs: 1000,
      batchesPerEpoch: steps,
      callbacks: {
        onEpochEnd: async (epoch, {loss})=>{
          await save()
          console.log("-- saved --")

          const hold=5
          const next=[
            [1e-2, .005],
            [1e-3, .002],
            [1e-4, .001],
            [1e-5, .001],
            [1e-6, .0001],
          ]
          for(let i=0; i<next.length; i++) {
            const [lr, min_diff]=next[i]
            if(lr!==opt.learningRate) continue
            if(min_loss-loss>=min_diff) {
              hold_epoch=0
            }else if(hold_epoch<hold-1) {
              hold_epoch++
            }else if(next[i+1]) {
              opt.learningRate=next[i+1][0]
              console.log(`-- learningRate decreased to ${opt.learningRate} --`)
              hold_epoch=0
            }else{
              console.log("-- early stopped --")
              process.exit()
            }
            break
          }

          min_loss=Math.min(loss, min_loss)
        },
      },
    })
  }else if(state==='test') {
    model.summary()
    console.log("testing..")
    await test(model, 1000)
  }
})()
