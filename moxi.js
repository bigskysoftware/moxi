(()=>{
	let doc = document
	if(doc.__moxi_mo) return
	let liveFns = new Set(), pending = false,
	recompute = ()=>{
		if (pending) return
		pending = true
		queueMicrotask(()=>{liveFns.forEach(f=>f()); setTimeout(()=>pending = false)})
	}
	doc.__moxi_mo = new MutationObserver(recs=>{
		recs.forEach(r=>r.type == "childList" && r.addedNodes.forEach(n=>process(n)))
		recompute()
	})
	let AF = async function(){}.constructor, HARGS = ["q", "wait", "trigger", "debounce"],
	fire = (elt, type, detail, bub)=>elt.dispatchEvent(new CustomEvent(type, {detail, cancelable:1, bubbles:bub??1, composed:1})),
	el = (e,n,h,o)=>e.addEventListener(n,h,o),
	DB = Symbol(),
	mkDb = ()=>{let last = 0, j; return ms=>new Promise((r,rj)=>{j?.(DB); j = rj; let id = ++last; setTimeout(()=>id == last && (j = null, r()), ms)})},
	mkWait = ctx=>x=>new Promise(r=>typeof x == "number" ? setTimeout(r,x) : el(ctx,x,r,{once:1})),
	ignore = elt=>elt.closest("[mx-ignore]"),
	one = x=>x?[x]:[],
	POS = {before:"beforebegin",after:"afterend",start:"afterbegin",end:"beforeend"},
	proxy = elts=>new Proxy({}, {
		get:(_,p)=>{
			if (p == "count") return elts.length
			if (p == "arr") return ()=>elts.slice()
			if (p == Symbol.iterator) return ()=>elts.values()
			if (p == "trigger") return (t,d,b)=>elts.forEach(e=>fire(e,t,d,b))
			if (p == "insert") return (pos,s)=>elts.forEach(e=>e.insertAdjacentHTML(POS[pos],s))
			if (p == "take") return (cls,from)=>{
				for (let e of typeof from == "string" ? doc.querySelectorAll(from) : from) e.classList.remove(cls)
				for (let e of elts) e.classList.add(cls)
			}
			let v = elts[0]?.[p]
			if (v?.call) return (...a)=>elts.map(e=>e[p](...a))[0]
			if (v && typeof v == "object") return proxy(elts.map(e=>e[p]))
			return v
		},
		set:(_,p,v)=>(elts.forEach(e=>e[p]=v),true)
	}),
	mkq = ctx=>sel=>{
		if (typeof sel != "string") return proxy(sel.nodeType ? [sel] : [...sel])
		let im = sel.match(/^(.+)\s+in\s+(.+)$/), root = doc
		if (im){ sel = im[1]; root = im[2] == "this" ? ctx : doc.querySelector(im[2]) }
		if (!root) return proxy([])
		let m = sel.match(/^(next|prev|closest|first|last)\s+(.+)$/), elts
		if (m){
			let [,d,s] = m, cdp = e=>ctx.compareDocumentPosition(e)
			if (d == "closest") elts = one(ctx.closest(s))
			else {
				let all = [...root.querySelectorAll(s)]
				if (d == "first") elts = all.slice(0,1)
				else if (d == "last") elts = all.slice(-1)
				else if (d == "next") elts = one(all.find(e=>cdp(e) & 4))
				else elts = one(all.reverse().find(e=>cdp(e) & 2))
			}
		} else elts = [...root.querySelectorAll(sel)]
		return proxy(elts)
	},
	init = elt=>{
		if (elt.__moxi || ignore(elt)) return
		if (!fire(elt, "mx:init", {})) return
		elt.__moxi = {}
		let q = mkq(elt), wait = mkWait(elt), trigger = fire.bind(0,elt), liveRuns = []
		for (let a of elt.attributes){
			if (a.name == "live"){
				let fn = new AF(...HARGS, a.value),
				debounce = mkDb(),
				run = ()=>elt.isConnected ? fn.call(elt, q, wait, trigger, debounce) : liveFns.delete(run)
				liveFns.add(run)
				liveRuns.push(run)
			} else if (a.name.startsWith("on-")){
				let [name, ...mods] = a.name.slice(3).split("."),
				has = m=>mods.includes(m), h = has("halt"), debounce = mkDb()
				if (has("cc")) name = name.replace(/-([a-z])/g, (_,c)=>c.toUpperCase())
				let target = has("outside") ? doc : elt,
				opts = {capture: has("capture"), passive: has("passive")},
				fn = new AF("event", ...HARGS, `with(event?.detail||{}){${a.value}}`),
				handler = elt.__moxi[name] = evt=>{
					if (evt && (has("self") && evt.target != elt || has("outside") && elt.contains(evt.target))) return
					if (h || has("prevent")) evt?.preventDefault()
					if (h || has("stop")) evt?.stopPropagation()
					if (has("once")) target.removeEventListener(name, handler, opts)
					return fn.call(elt, evt, q, wait, trigger, debounce).catch(e=>{if(e!=DB) throw e})
				}
				if (name == "init") handler()
				else el(target, name, handler, opts)
			}
		}
		liveRuns.forEach(r=>r())
		fire(elt, "mx:inited", {}, false)
	},
	process = n=>{
		if (n.nodeType != 1 || ignore(n)) return
		let r = doc.evaluate("descendant-or-self::*[@live or @*[starts-with(name(),'on-')]]", n, null, 7, null)
		for (let i = 0; i < r.snapshotLength; i++) init(r.snapshotItem(i))
	},
	gt = globalThis, de = doc.documentElement
	gt.q = mkq(de)
	gt.wait = mkWait(de)
	gt.transition = fn=>doc.startViewTransition ? doc.startViewTransition(fn) : fn()
	el(doc, "mx:process", evt=>process(evt.target))
	el(doc, "refresh", recompute)
	el(doc, "DOMContentLoaded", ()=>{
		doc.__moxi_mo.observe(de, {childList:1, subtree:1, attributes:1, characterData:1})
		el(doc, "input", recompute, true)
		el(doc, "change", recompute, true)
		process(doc.body)
	})
})()
