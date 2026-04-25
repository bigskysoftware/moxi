<h1>&#x1F94A; moxi.js - <i>just a bit more...</i></h1>

moxi.js is an experimental, minimalist companion to [fixi.js](https://github.com/bigskysoftware/fixi) that
lets you put small bits of behavior directly on HTML elements: event handlers, reactive
expressions, and a compact query helper - all inline, all in one attribute.

Part of the [fixi project](https://fixiproject.org).

Where fixi handles the network and swapping, moxi handles local interactivity. The two are
designed to be used together, but moxi has no dependency on fixi and works perfectly well on
its own.

The moxi api consists of three [attributes](#attributes), eight [event modifiers](#event-modifiers),
seven [handler helpers](#handler-scope), and three [lifecycle events](#events).

Here is an example:

```html
<input id="name" placeholder="name">
<output live="this.innerText = 'hello ' + q('#name').value"></output>
<button on-click="q('#name').value = ''">clear</button>
```

When a user types into the `input`, the `output` updates automatically because the `live`
attribute re-runs when the DOM or form state changes. The `button` clears the input when
clicked, and the `output` updates again in response.

## Minimalism

Philosophically, moxi is to [hyperscript](https://hyperscript.org) what fixi is to htmx: a
smaller, less ambitious version of the same idea, with fewer features, no DSL, and no
parser beyond a couple of regexes. You write plain JavaScript - moxi just gives you a tiny,
DOM-flavored scope to write it in.

As such, it does _not_ include many of the features found in hyperscript, Alpine, or Vue:

* a bespoke scripting language
* reactive stores / shared JS state
* templating or iteration directives (`x-for`, `v-for`)
* two-way data binding (`v-model`, `x-model`)
* component model / custom elements
* fetch, swap, or any network behavior - that's [fixi](https://github.com/bigskysoftware/fixi)'s job

moxi takes advantage of some modern JavaScript features:

* [`async` functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function) (via the [`AsyncFunction`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AsyncFunction) constructor)
* [`Proxy`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) for the query helper
* [`MutationObserver`](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) for auto-wiring & reactivity
* [XPath](https://developer.mozilla.org/en-US/docs/Web/XPath) for discovering moxi-powered elements
* The [View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API)

A hard constraint on the project is that the _unminified, uncompressed_ size of moxi.js must
be less than the minified + gzipped size of
[preact](https://bundlephobia.com/package/preact). Current sizes are listed on the
[fixi project site](https://fixiproject.org).

Another goal is that users should be able to
[debug](https://developer.chrome.com/docs/devtools/javascript/) moxi easily, since it is
small enough to use unminified.

Like fixi, moxi has very few moving parts:

* No dependencies (including test and development)
* No public JS API (beyond the [events](#events) and `__moxi` property)
* No minified `moxi.min.js` file
* No `package.json`
* No build step

The moxi project consists of four files:

* [`moxi.js`](moxi.js), the code for the library
* [`test.html`](test.html), the test suite for the library
* [`demo.html`](demo.html), interactive examples you can open directly
* This [`README.md`](README.md), which is the documentation

[`test.html`](test.html) is a stand-alone HTML file that implements its own visual testing
infrastructure and can be opened using the `file:` protocol for easy testing.

## Installing

moxi is designed to be easily [vendored](https://htmx.org/essays/vendoring/) - that is,
copied into your project:

```html
<script src="moxi.js"></script>
```

That's the entire install. moxi auto-initializes on `DOMContentLoaded` and uses a
`MutationObserver` to pick up elements added later.

## API

### Attributes

<table>
<thead>
<tr>
  <th>attribute</th>
  <th>description</th>
  <th>example</th>
</tr>
</thead>
<tbody>
<tr>
  <td><code>on-&lt;event&gt;</code></td>
  <td>Binds a handler for <code>&lt;event&gt;</code> on this element. Colons are allowed in the event name (e.g. <code>on-fx:after</code>).</td>
  <td><code>on-click="q('#out').innerText = 'hi'"</code></td>
</tr>
<tr>
  <td><code>on-init</code></td>
  <td>Special case - runs once at bind time rather than registering an event listener. Useful for setup code that lives on the element itself.</td>
  <td><code>on-init="this.dataset.ready = true"</code></td>
</tr>
<tr>
  <td><code>live</code></td>
  <td>An expression that is evaluated at bind time and re-evaluated whenever the DOM or form state changes. Great for reactive output.</td>
  <td><code>live="this.innerText = q('#name').value"</code></td>
</tr>
<tr>
  <td><code>mx-ignore</code></td>
  <td>Any element with this attribute on it or on an ancestor will be skipped during processing - no <code>on-*</code> or <code>live</code> attributes on it will be wired up.</td>
  <td></td>
</tr>
</tbody>
</table>

### Event Modifiers

Modifiers are dot-separated and composable. They live between the event name and the `=`.
For example, `on-click.prevent.stop="..."` will both `preventDefault()` and `stopPropagation()`
before the body runs.

<table>
<thead>
<tr>
  <th>modifier</th>
  <th>description</th>
</tr>
</thead>
<tbody>
<tr><td><code>.prevent</code></td><td>Calls <code>event.preventDefault()</code> before the handler body runs.</td></tr>
<tr><td><code>.stop</code></td><td>Calls <code>event.stopPropagation()</code> before the handler body runs.</td></tr>
<tr><td><code>.halt</code></td><td>Equivalent to <code>.prevent.stop</code> - a shorthand for the common case.</td></tr>
<tr><td><code>.once</code></td><td>Removes the listener after the first successful fire. Plays correctly with <code>.self</code> and <code>.outside</code> - skipped invocations don't consume the listener.</td></tr>
<tr><td><code>.self</code></td><td>Skips the handler when <code>event.target !== this</code>. Ignores bubbled events from children.</td></tr>
<tr><td><code>.capture</code></td><td>Passes <code>{capture: true}</code> to <code>addEventListener</code>.</td></tr>
<tr><td><code>.passive</code></td><td>Passes <code>{passive: true}</code> to <code>addEventListener</code>. Required for smooth scroll/touch handlers.</td></tr>
<tr><td><code>.outside</code></td><td>Attaches the listener to <code>document</code> instead of <code>this</code>, and only fires when the event happened outside the element. Useful for dismissing menus and modals.</td></tr>
</tbody>
</table>

### Handler Scope

Inside every `on-*` and `live` expression, moxi injects the following variables:

<table>
<thead>
<tr>
  <th>name</th>
  <th>type</th>
  <th>description</th>
</tr>
</thead>
<tbody>
<tr><td><code>this</code></td><td><code>Element</code></td><td>The element the attribute is on.</td></tr>
<tr><td><code>event</code></td><td><code>Event</code></td><td>Available in <code>on-*</code> handlers; undefined for <code>on-init</code> and <code>live</code>.</td></tr>
<tr><td><code>q(sel)</code></td><td>fn -> proxy</td><td>Query helper. See <a href="#the-q-helper">The <code>q()</code> Helper</a> below.</td></tr>
<tr><td><code>trigger(type, detail)</code></td><td>fn</td><td>Dispatches a bubbling, cancelable <code>CustomEvent</code> from <code>this</code>.</td></tr>
<tr><td><code>wait(x)</code></td><td>fn -> Promise</td><td><code>x</code> can be a number (ms delay) or a string (event name, resolves with the event object).</td></tr>
<tr><td><code>debounce(ms)</code></td><td>fn -> Promise</td><td>Per-handler debouncer - superseded calls never resolve. Use with <code>await</code>.</td></tr>
<tr><td><code>transition(fn)</code></td><td>fn</td><td>Wraps <code>fn</code> in <code>document.startViewTransition()</code>, with a fallback if unsupported.</td></tr>
<tr><td><code>take(cls, from, to)</code></td><td>fn</td><td>Removes <code>cls</code> from every element matching selector <code>from</code>, then adds it to <code>to</code>. Perfect for active-tab / active-nav patterns.</td></tr>
</tbody>
</table>

Handler bodies are compiled as **async functions** (via the `AsyncFunction` constructor), so
`await` works anywhere.

#### Bare-name access to `event.detail`

For `on-*` handlers, every key on `event.detail` is also exposed as a top-level
variable inside the handler body. So instead of writing

```html
<button on-fx:config="event.detail.cfg.confirm = () => confirm('Delete?')">delete</button>
```

you can drop the `event.detail.` prefix and write

```html
<button on-fx:config="cfg.confirm = () => confirm('Delete?')">delete</button>
```

Reads, mutations (`cfg.foo = ...`), and even reassignments (`cfg = {...}`) all hit the
underlying `event.detail` object. If a handler updates `cfg.confirm` inside an
`fx:config` listener, fixi sees the change. This is implemented with a `with` block
around the handler body, so:

* If `event.detail` is missing or null (e.g., a plain non-`CustomEvent`), nothing
  is injected and the handler still runs.
* Names that aren't on `event.detail` resolve normally to the helpers above
  (`q`, `trigger`, `wait`, ...) or to globals.
* Assignments to a name that *isn't* already a property of `event.detail` fall
  through to the outer scope, so they don't accidentally pollute `detail`.

### The `q()` Helper

`q(selector)` returns a proxy over matched elements. The selector grammar is:

```
[<direction> ]<css-selector>[ in (this | <scope-selector>)]
```

#### Directions

<table>
<thead>
<tr>
  <th>direction</th>
  <th>result</th>
</tr>
</thead>
<tbody>
<tr><td><em>(none)</em></td><td>All elements matching the selector in the scope (default scope: <code>document</code>).</td></tr>
<tr><td><code>next X</code></td><td>The first <code>X</code> after <code>this</code> in document order.</td></tr>
<tr><td><code>prev X</code></td><td>The last <code>X</code> before <code>this</code> in document order.</td></tr>
<tr><td><code>closest X</code></td><td>The same as <code>this.closest(X)</code>.</td></tr>
<tr><td><code>first X</code></td><td>The first <code>X</code> in the scope.</td></tr>
<tr><td><code>last X</code></td><td>The last <code>X</code> in the scope.</td></tr>
</tbody>
</table>

#### Scoping with `in`

* `q('.row in this')` - scopes the query to `this`
* `q('.row in #panel')` - scopes the query to the element matching `#panel`
* If the scope selector matches nothing, `q` returns an empty proxy (no throw).

#### The Proxy

The object returned by `q()` is a `Proxy` that fans reads, writes, and method calls across
every matched element:

<table>
<thead>
<tr>
  <th>operation</th>
  <th>behavior</th>
</tr>
</thead>
<tbody>
<tr><td><code>q(...).prop = v</code></td><td>Sets <code>prop = v</code> on every match.</td></tr>
<tr><td><code>q(...).method(...)</code></td><td>Calls <code>method</code> on every match. Returns the result from the first match - so value-returning methods like <code>checkValidity()</code> or <code>getAttribute()</code> work naturally.</td></tr>
<tr><td><code>q(...).prop</code> (object)</td><td>Returns a new proxy over <code>[e1.prop, e2.prop, ...]</code>, so nested access like <code>q('.row').classList.add('sel')</code> and <code>q('.row').style.color = 'red'</code> works.</td></tr>
<tr><td><code>q(...).prop</code> (primitive or function)</td><td>Returns the value from the first match.</td></tr>
<tr><td><code>q(...).count</code></td><td>Returns the number of matched elements.</td></tr>
<tr><td><code>q(...).arr()</code></td><td>Returns the matched elements as a plain <code>Array</code>, so you can chain <code>.filter()</code>, <code>.map()</code>, etc. without spreading.</td></tr>
<tr><td><code>q(...).trigger(type, detail)</code></td><td>Dispatches the event from every matched element.</td></tr>
<tr><td><code>q(...).insert(pos, html)</code></td><td>Parses <code>html</code> and inserts it at every matched element. <code>pos</code> is one of <code>'before' | 'start' | 'end' | 'after'</code> - a friendlier spelling of the four <code>insertAdjacentHTML</code> positions.</td></tr>
<tr><td><code>for (let e of q(...))</code> / <code>[...q(...)]</code></td><td>Iterates over the raw matched elements.</td></tr>
</tbody>
</table>

### Events

moxi fires three lifecycle events. All are dispatched on the element being processed; listen
on the `document` for global hooks.

<table>
<thead>
<tr>
  <th>event</th>
  <th>description</th>
</tr>
</thead>
<tbody>
<tr>
  <td><code>mx:init</code></td>
  <td>Fired just before moxi initializes an element. Cancelable - calling <code>preventDefault()</code> will skip binding that element.</td>
</tr>
<tr>
  <td><code>mx:inited</code></td>
  <td>Fired after the element has been fully initialized. Does not bubble.</td>
</tr>
<tr>
  <td><code>mx:process</code></td>
  <td>moxi listens for this event on the <code>document</code> and will process the <code>evt.target</code> and its descendants. Dispatch this to force re-scanning after manual DOM changes.</td>
</tr>
</tbody>
</table>

### Properties

<table>
<thead>
<tr>
  <th>property</th>
  <th>description</th>
</tr>
</thead>
<tbody>
<tr>
  <td><code>document.__moxi_mo</code></td>
  <td>The <code>MutationObserver</code> that moxi uses to auto-process newly added elements and to drive reactivity. You can <code>disconnect()</code> it temporarily for performance during large mutations.</td>
</tr>
<tr>
  <td><code>elt.__moxi</code></td>
  <td>An object mapping event names to the handlers moxi wired up on this element. Useful for debugging and for manually removing listeners.</td>
</tr>
</tbody>
</table>

## Modus Operandi

moxi's entry point is at the bottom of [moxi.js](moxi.js). On `DOMContentLoaded` it:

1. Starts a `MutationObserver` watching the document for added nodes, attribute changes,
   character data changes, and text child changes.
2. Adds capturing document-level listeners for `input` and `change` to drive reactivity.
3. Processes the existing body.

### Discovery

moxi finds elements using a single XPath query:

```
descendant-or-self::*[@live or @*[starts-with(name(),'on-')]]
```

That is - anything with a `live` attribute, or any attribute name starting with `on-`. XPath
means moxi only visits elements it actually needs to wire up, rather than iterating every
descendant.

### `on-*` Handlers

For each `on-<event>[.<mod>...]` attribute, moxi compiles the attribute value into an async
function with the handler scope described above, then attaches it as an event listener. The
attribute name after the `on-` prefix is the event name (colons allowed), optionally followed
by dot-separated modifiers.

If the event name is the literal string `init`, moxi invokes the function immediately instead
of registering a listener.

### `live` Expressions

For each `live` attribute, moxi compiles the value into an async function, runs it once, and
adds it to a global set of reactive expressions. Whenever the `MutationObserver` sees a
change, or the capturing `input`/`change` listener fires, every live expression is re-run.

To avoid runaway self-mutation cycles, moxi guards recompute behind a `pending` flag cleared
on the next macrotask - so a live expression writing to the DOM will, at worst, settle in two
ticks rather than cycle forever.

Live expressions whose element has been removed from the DOM are removed from the run set on
the next invocation (they detect `!elt.isConnected` and clean up).

### Pairing with fixi

moxi and [fixi](https://github.com/bigskysoftware/fixi) compose cleanly. Because moxi listens
for events via `on-*`, you can react to fixi's lifecycle events with an ordinary handler:

```html
<div fx-action="/data" on-fx:after="q('closest section').classList.add('loaded')">
  ...
</div>
```

or trigger a fixi request from a moxi handler via `trigger`:

```html
<button on-click="q('#target').trigger('refresh')">Reload</button>
<div id="target" fx-action="/data" fx-trigger="refresh">...</div>
```

## Examples

### Reactive Output

```html
<input id="name" placeholder="type something">
<output live="this.innerText = 'hello ' + (q('#name').value || 'stranger')"></output>
```

### Click Counter

```html
<button on-init="this.count = 0"
        on-click="this.count++; q('next output').value = this.count">click me</button>
<output>0</output>
```

### Active Tab With `take()`

```html
<nav>
  <button class="tab active" on-click="take('active', '.tab', this)">One</button>
  <button class="tab"        on-click="take('active', '.tab', this)">Two</button>
  <button class="tab"        on-click="take('active', '.tab', this)">Three</button>
</nav>
```

### Debounced Search

```html
<input on-input="await debounce(250); q('next output').innerText = 'searching ' + this.value">
<output></output>
```

### View Transition on Toggle

```html
<button on-click="transition(() => q('#panel').classList.toggle('open'))">toggle</button>
<div id="panel">...</div>
```

### Click-Outside-To-Dismiss

```html
<button on-click="q('#menu').hidden = false">open menu</button>
<div id="menu" hidden on-click.outside="this.hidden = true">
  Menu contents...
</div>
```

### Parent-Listens-For-Child-Emits

```html
<dialog on-confirm="alert('confirmed: ' + event.detail)">
  <button on-click="trigger('confirm', 'yes')">yes</button>
  <button on-click="trigger('confirm', 'no')">no</button>
</dialog>
```

## Extensions

Because moxi ships no public JS API beyond its scope helpers and lifecycle events, extensions
are mostly a matter of hanging additional behavior off the `mx:init` and `mx:inited` events.
A suggested convention when adding moxi extension attributes is to use the `ext-mx` prefix:

```js
// ext-mx-log: logs every time the element receives focus
document.addEventListener("mx:inited", (evt) => {
  if (evt.target.hasAttribute("ext-mx-log")) {
    evt.target.addEventListener("focus", () => console.log("focused:", evt.target))
  }
})
```

```html
<input ext-mx-log placeholder="focus me">
```

## LICENCE

BSD-0