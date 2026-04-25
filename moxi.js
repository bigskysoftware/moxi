(()=>{
	let doc = document
	if(doc.__moxi_mo) return
	let liveFns = new Set(), pending = false
	let recompute = ()=>{
		if (pending) return
		pending = true
		queueMicrotask(()=>{liveFns.forEach((f)=>f()); setTimeout(()=>pending = false)})
	}
	doc.__moxi_mo = new MutationObserver((recs)=>{
		recs.forEach((r)=>r.type === "childList" && r.addedNodes.forEach((n)=>process(n)))
		recompute()
	})
	let PREFIX = "on-"
	let XPATH = "descendant-or-self::*[@live or @*[starts-with(name(),'on-')]]"
	let AF = async function(){}.constructor, HARGS = ["q", "trigger", "wait", "transition", "take", "debounce"]
	let fire = (elt, type, detail, bub)=>elt.dispatchEvent(new CustomEvent(type, {detail, cancelable:1, bubbles:bub??1, composed:1}))
	let transition = (fn)=>doc.startViewTransition ? doc.startViewTransition(fn) : fn()
	let take = (cls, from, to)=>{doc.querySelectorAll(from).forEach((e)=>e.classList.remove(cls)); to.classList.add(cls)}
	let DB = Symbol()
	let mkDb = ()=>{let last = 0, j; return (ms)=>new Promise((r,rj)=>{j?.(DB); j = rj; let id = ++last; setTimeout(()=>id === last && (j = null, r()), ms)})}
	let ignore = (elt)=>elt.closest("[mx-ignore]")
	let one = (x)=>x?[x]:[]
	let POS = {before:"beforebegin",after:"afterend",start:"afterbegin",end:"beforeend"}
	let proxy = (elts)=>new Proxy({}, {
		get:(_,p)=>{
			if (p === "count") return elts.length
			if (p === "arr") return ()=>elts.slice()
			if (p === Symbol.iterator) return ()=>elts.values()
			if (p === "trigger") return (t,d)=>elts.forEach((e)=>fire(e,t,d))
			if (p === "insert") return (pos,s)=>elts.forEach((e)=>e.insertAdjacentHTML(POS[pos],s))
			let v = elts[0]?.[p]
			if (typeof v === "function") return (...a)=>elts.map((e)=>e[p](...a))[0]
			if (v && typeof v === "object") return proxy(elts.map((e)=>e[p]))
			return v
		},
		set:(_,p,v)=>(elts.forEach((e)=>e[p]=v),true)
	})
	let mkq = (ctx)=>(sel)=>{
		let im = sel.match(/^(.+)\s+in\s+(.+)$/), root = doc
		if (im){ sel = im[1]; root = im[2] === "this" ? ctx : doc.querySelector(im[2]) }
		if (!root) return proxy([])
		let m = sel.match(/^(next|prev|closest|first|last)\s+(.+)$/), elts
		if (m){
			let [,d,s] = m, cdp = (e)=>ctx.compareDocumentPosition(e)
			if (d === "closest") elts = one(ctx.closest(s))
			else {
				let all = [...root.querySelectorAll(s)]
				if (d === "first") elts = all.slice(0,1)
				else if (d === "last") elts = all.slice(-1)
				else if (d === "next") elts = one(all.find((e)=>cdp(e) & 4))
				else elts = one(all.reverse().find((e)=>cdp(e) & 2))
			}
		} else elts = [...root.querySelectorAll(sel)]
		return proxy(elts)
	}
	let init = (elt)=>{
		if (elt.__moxi || ignore(elt)) return
		if (!fire(elt, "mx:init", {})) return
		elt.__moxi = {}
		let q = mkq(elt), trigger = (t,d)=>fire(elt,t,d)
		let wait = (x)=>new Promise((r)=>typeof x === "number" ? setTimeout(r,x) : elt.addEventListener(x,r,{once:1}))
		let liveRuns = []
		for (let a of elt.attributes){
			if (a.name === "live"){
				let fn = new AF(...HARGS, a.value)
				let debounce = mkDb()
				let run = ()=>elt.isConnected ? fn.call(elt, q, trigger, wait, transition, take, debounce) : liveFns.delete(run)
				liveFns.add(run)
				liveRuns.push(run)
			} else if (a.name.startsWith(PREFIX)){
				let [name, ...mods] = a.name.slice(3).split(".")
				let has = (m)=>mods.includes(m), h = has("halt"), debounce = mkDb()
				let target = has("outside") ? doc : elt
				let opts = {capture: has("capture"), passive: has("passive")}
				let fn = new AF("event", ...HARGS, `with(event?.detail||{}){${a.value}}`)
				let handler = elt.__moxi[name] = (evt)=>{
					if (evt && (has("self") && evt.target !== elt || has("outside") && elt.contains(evt.target))) return
					if (h || has("prevent")) evt?.preventDefault()
					if (h || has("stop")) evt?.stopPropagation()
					if (has("once")) target.removeEventListener(name, handler, opts)
					return fn.call(elt, evt, q, trigger, wait, transition, take, debounce).catch((e)=>{if(e!==DB) throw e})
				}
				if (name === "init") handler()
				else target.addEventListener(name, handler, opts)
			}
		}
		liveRuns.forEach((r)=>r())
		fire(elt, "mx:inited", {}, false)
	}
	let process = (n)=>{
		if (n.nodeType !== 1 || ignore(n)) return
		let r = doc.evaluate(XPATH, n, null, 7, null)
		for (let i = 0; i < r.snapshotLength; i++) init(r.snapshotItem(i))
	}
	doc.addEventListener("mx:process", (evt)=>process(evt.target))
	doc.addEventListener("DOMContentLoaded", ()=>{

		doc.__moxi_mo.observe(doc.documentElement, {childList:1, subtree:1, attributes:1, characterData:1})
		doc.addEventListener("input", recompute, true)
		doc.addEventListener("change", recompute, true)
		process(doc.body)
	})
})()