
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function subscribe$1(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe$1(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function get_all_dirty_from_scope($$scope) {
        if ($$scope.ctx.length > 32) {
            const dirty = [];
            const length = $$scope.ctx.length / 32;
            for (let i = 0; i < length; i++) {
                dirty[i] = -1;
            }
            return dirty;
        }
        return -1;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_data(text, data) {
        data = '' + data;
        if (text.wholeText !== data)
            text.data = data;
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update$1(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update$1($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const { subscribe, set, update } = writable({
        ApplicationURL:    'https://vfb-notes.volt.live/',
        ApplicationId:     'd3CX6D',
        AccessToken:       sessionStorage['vfb-notes: access-token'] || '',
        ConfirmationToken: '',
        ResetToken:        '',
        EMailAddress:      localStorage['vfb-notes: email-address']  || '',
        Password:          sessionStorage['vfb-notes: password']     || '',
        loggedIn:          false,
        State:             '',
        FailureReason:     ''
      });

      function define (KeyOrObject, Value) {
        if (typeof(KeyOrObject) === 'string') {
          update((Globals) => { Globals[KeyOrObject] = Value; return Globals });
          switch (KeyOrObject) {
            case 'AccessToken': sessionStorage['vfb-notes: access-token']  = Value; break
            case 'EMailAddress':  localStorage['vfb-notes: email-address'] = Value; break
            case 'Password':    sessionStorage['vfb-notes: password']      = Value;
          }
        } else {
          update((Globals) => Object.assign(Globals,KeyOrObject));

          if ('AccessToken' in KeyOrObject) {
            sessionStorage['vfb-notes: access-token'] = KeyOrObject['AccessToken'];
          }

          if ('EMailAddress' in KeyOrObject) {
            localStorage['vfb-notes: email-address'] = KeyOrObject['EMailAddress'];
          }

          if ('Password' in KeyOrObject) {
            sessionStorage['vfb-notes: password'] = KeyOrObject['Password'];
          }
        }
      }

      const Globals = { subscribe, define };

    function styleInject(css, ref) {
      if ( ref === void 0 ) ref = {};
      var insertAt = ref.insertAt;

      if (!css || typeof document === 'undefined') { return; }

      var head = document.head || document.getElementsByTagName('head')[0];
      var style = document.createElement('style');
      style.type = 'text/css';

      if (insertAt === 'top') {
        if (head.firstChild) {
          head.insertBefore(style, head.firstChild);
        } else {
          head.appendChild(style);
        }
      } else {
        head.appendChild(style);
      }

      if (style.styleSheet) {
        style.styleSheet.cssText = css;
      } else {
        style.appendChild(document.createTextNode(css));
      }
    }

    var css_248z$a = ".Dialog.svelte-1gne4st.svelte-1gne4st.svelte-1gne4st{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-1gne4st a.svelte-1gne4st.svelte-1gne4st,.Dialog.svelte-1gne4st a.svelte-1gne4st.svelte-1gne4st:visited{color:#2980B9;text-decoration:underline}.Dialog.svelte-1gne4st>div.svelte-1gne4st.svelte-1gne4st{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-1gne4st>div.svelte-1gne4st>[name=\"Title\"].svelte-1gne4st{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}.Dialog.svelte-1gne4st>div.svelte-1gne4st>.Block.svelte-1gne4st{display:block;margin:0px 0px 10px 0px;text-align:justify}.Dialog.svelte-1gne4st>div.svelte-1gne4st>button.svelte-1gne4st{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:6px;background-color:#2980B9;border:none;border-radius:4px;font-size:16px;font-weight:bold;color:white;cursor:pointer}.Dialog.svelte-1gne4st>div.svelte-1gne4st>button.svelte-1gne4st:disabled{opacity:0.3;cursor:auto}";
    styleInject(css_248z$a,{"insertAt":"top"});

    /* src/CommunicationFailureDisplay.svelte generated by Svelte v3.42.1 */

    function create_fragment$b(ctx) {
    	let div5;
    	let div4;
    	let div0;
    	let t1;
    	let div1;
    	let t5;
    	let div2;
    	let t6_value = /*$Globals*/ ctx[0].FailureReason + "";
    	let t6;
    	let t7;
    	let div3;
    	let t9;
    	let button;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			div5 = element("div");
    			div4 = element("div");
    			div0 = element("div");
    			div0.textContent = "Communication Failure";
    			t1 = space();
    			div1 = element("div");

    			div1.innerHTML = `Network communication with <a href="https://voltcloud.io/" class="svelte-1gne4st">VoltCloud.io</a>
      failed for the following reason:`;

    			t5 = space();
    			div2 = element("div");
    			t6 = text(t6_value);
    			t7 = space();
    			div3 = element("div");
    			div3.textContent = "The best course of action will be to try again later.";
    			t9 = space();
    			button = element("button");
    			button.textContent = "Ok";
    			attr(div0, "name", "Title");
    			attr(div0, "class", "svelte-1gne4st");
    			attr(div1, "class", "Block svelte-1gne4st");
    			attr(div2, "class", "Block svelte-1gne4st");
    			set_style(div2, "margin", "0px 10px 10px 10px");
    			set_style(div2, "font-size", "12px");
    			set_style(div2, "font-style", "italic");
    			set_style(div2, "color", "red\n    ");
    			attr(div3, "class", "Block svelte-1gne4st");
    			attr(button, "class", "svelte-1gne4st");
    			attr(div4, "class", "svelte-1gne4st");
    			attr(div5, "class", "Dialog svelte-1gne4st");
    		},
    		m(target, anchor) {
    			insert(target, div5, anchor);
    			append(div5, div4);
    			append(div4, div0);
    			append(div4, t1);
    			append(div4, div1);
    			append(div4, t5);
    			append(div4, div2);
    			append(div2, t6);
    			append(div4, t7);
    			append(div4, div3);
    			append(div4, t9);
    			append(div4, button);

    			if (!mounted) {
    				dispose = listen(button, "click", closeMessage$2);
    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*$Globals*/ 1 && t6_value !== (t6_value = /*$Globals*/ ctx[0].FailureReason + "")) set_data(t6, t6_value);
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div5);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    function closeMessage$2(Event) {
    	Event.preventDefault();
    	Globals.define('State', '');
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let $Globals;
    	component_subscribe($$self, Globals, $$value => $$invalidate(0, $Globals = $$value));
    	return [$Globals];
    }

    class CommunicationFailureDisplay extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});
    	}
    }

    var css_248z$9 = ".Dialog.svelte-1gne4st.svelte-1gne4st.svelte-1gne4st{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-1gne4st>div.svelte-1gne4st.svelte-1gne4st{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-1gne4st>div.svelte-1gne4st>[name=\"Title\"].svelte-1gne4st{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}.Dialog.svelte-1gne4st>div.svelte-1gne4st>.Block.svelte-1gne4st{display:block;margin:0px 0px 10px 0px;text-align:justify}.Dialog.svelte-1gne4st>div.svelte-1gne4st>button.svelte-1gne4st{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:6px;background-color:#2980B9;border:none;border-radius:4px;font-size:16px;font-weight:bold;color:white;cursor:pointer}.Dialog.svelte-1gne4st>div.svelte-1gne4st>button.svelte-1gne4st:disabled{opacity:0.3;cursor:auto}";
    styleInject(css_248z$9,{"insertAt":"top"});

    /* src/ResetRequestSuccessDisplay.svelte generated by Svelte v3.42.1 */

    function create_fragment$a(ctx) {
    	let div4;
    	let div3;
    	let div0;
    	let t1;
    	let div1;
    	let t3;
    	let div2;
    	let t5;
    	let button;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			div4 = element("div");
    			div3 = element("div");
    			div0 = element("div");
    			div0.textContent = "Password Reset Request Sent";
    			t1 = space();
    			div1 = element("div");
    			div1.textContent = "An EMail containing a link to reset your password has been sent.";
    			t3 = space();
    			div2 = element("div");
    			div2.textContent = "Please, open your mailbox, look for a mail from VoltCloud.io and click\n      on the link it contains. You will then be asked to enter a new password.";
    			t5 = space();
    			button = element("button");
    			button.textContent = "Ok";
    			attr(div0, "name", "Title");
    			attr(div0, "class", "svelte-1gne4st");
    			attr(div1, "class", "Block svelte-1gne4st");
    			attr(div2, "class", "Block svelte-1gne4st");
    			attr(button, "class", "svelte-1gne4st");
    			attr(div3, "class", "svelte-1gne4st");
    			attr(div4, "class", "Dialog svelte-1gne4st");
    		},
    		m(target, anchor) {
    			insert(target, div4, anchor);
    			append(div4, div3);
    			append(div3, div0);
    			append(div3, t1);
    			append(div3, div1);
    			append(div3, t3);
    			append(div3, div2);
    			append(div3, t5);
    			append(div3, button);

    			if (!mounted) {
    				dispose = listen(button, "click", closeMessage$1);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div4);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    function closeMessage$1(Event) {
    	Event.preventDefault();
    	Globals.define('State', '');
    }

    function instance$a($$self) {
    	return [];
    }

    class ResetRequestSuccessDisplay extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});
    	}
    }

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */

    function __awaiter(thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }

    function __generator(thisArg, body) {
        var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
        function verb(n) { return function (v) { return step([n, v]); }; }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (_) try {
                if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
                if (y = 0, t) op = [op[0] & 2, t.value];
                switch (op[0]) {
                    case 0: case 1: t = op; break;
                    case 4: _.label++; return { value: op[1], done: false };
                    case 5: _.label++; y = op[1]; op = [0]; continue;
                    case 7: op = _.ops.pop(); _.trys.pop(); continue;
                    default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                        if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                        if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                        if (t[2]) _.ops.pop();
                        _.trys.pop(); continue;
                }
                op = body.call(thisArg, _);
            } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
            if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
        }
    }

    //----------------------------------------------------------------------------//
    /**** throwError - simplifies construction of named errors ****/
    function throwError(Message) {
        var Match = /^([$a-zA-Z][$a-zA-Z0-9]*):\s*(\S.+)\s*$/.exec(Message);
        if (Match == null) {
            throw new Error(Message);
        }
        else {
            var namedError = new Error(Match[2]);
            namedError.name = Match[1];
            throw namedError;
        }
    }
    /**** ValueIsString ****/
    function ValueIsString(Value) {
        return (typeof Value === 'string') || (Value instanceof String);
    }
    /**** ValueIs[Non]EmptyString ****/
    var emptyStringPattern = /^\s*$/;
    function ValueIsNonEmptyString(Value) {
        return ((typeof Value === 'string') || (Value instanceof String)) && !emptyStringPattern.test(Value.valueOf());
    }
    /**** ValueIsStringMatching ****/
    function ValueIsStringMatching$1(Value, Pattern) {
        return ((typeof Value === 'string') || (Value instanceof String)) && Pattern.test(Value.valueOf());
    }
    /**** ValueIsArray ****/
    var ValueIsArray = Array.isArray;
    /**** ValueIsEMailAddress ****/
    var EMailAddressPattern$1 = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;
    // see https://stackoverflow.com/questions/201323/how-to-validate-an-email-address-using-a-regular-expression
    function ValueIsEMailAddress$1(Value) {
        return ValueIsStringMatching$1(Value, EMailAddressPattern$1);
    }
    /**** ValueIsURL ****/
    var noCtrlCharsOrWhitespacePattern = /^[^\s\x00-\x1F\x7F-\x9F\u2028\u2029\uFFF9-\uFFFB]*$/;
    function ValueIsURL(Value) {
        if (!ValueIsStringMatching$1(Value, noCtrlCharsOrWhitespacePattern) ||
            (Value === '')) {
            return false;
        }
        try {
            new URL(Value, 'file://');
            return true;
        }
        catch (Signal) {
            return false;
        }
    }
    //------------------------------------------------------------------------------
    //--                      Argument Validation Functions                       --
    //------------------------------------------------------------------------------
    var rejectNil = false;
    var acceptNil = true;
    /**** validatedArgument ****/
    function validatedArgument(Description, Argument, ValueIsValid, NilIsAcceptable, Expectation) {
        if (Argument == null) {
            if (NilIsAcceptable) {
                return Argument;
            }
            else {
                throwError("MissingArgument: no " + escaped(Description) + " given");
            }
        }
        else {
            if (ValueIsValid(Argument)) {
                switch (true) {
                    case Argument instanceof Boolean:
                    case Argument instanceof Number:
                    case Argument instanceof String:
                        return Argument.valueOf(); // unboxes any primitives
                    default:
                        return Argument;
                }
            }
            else {
                throwError("InvalidArgument: the given " + escaped(Description) + " is no valid " + escaped(Expectation));
            }
        }
    }
    /**** ValidatorForClassifier ****/
    function ValidatorForClassifier(Classifier, NilIsAcceptable, Expectation) {
        var Validator = function (Description, Argument) {
            return validatedArgument(Description, Argument, Classifier, NilIsAcceptable, Expectation);
        };
        var ClassifierName = Classifier.name;
        if ((ClassifierName != null) && /^ValueIs/.test(ClassifierName)) {
            var ValidatorName = ClassifierName.replace(// derive name from validator
            /^ValueIs/, NilIsAcceptable ? 'allow' : 'expect');
            return FunctionWithName(Validator, ValidatorName);
        }
        else {
            return Validator; // without any specific name
        }
    }
    /**** FunctionWithName (works with older JS engines as well) ****/
    function FunctionWithName(originalFunction, desiredName) {
        if (originalFunction == null) {
            throwError('MissingArgument: no function given');
        }
        if (typeof originalFunction !== 'function') {
            throwError('InvalidArgument: the given 1st Argument is not a JavaScript function');
        }
        if (desiredName == null) {
            throwError('MissingArgument: no desired name given');
        }
        if ((typeof desiredName !== 'string') && !(desiredName instanceof String)) {
            throwError('InvalidArgument: the given desired name is not a string');
        }
        if (originalFunction.name === desiredName) {
            return originalFunction;
        }
        try {
            Object.defineProperty(originalFunction, 'name', { value: desiredName });
            if (originalFunction.name === desiredName) {
                return originalFunction;
            }
        }
        catch (signal) { /* ok - let's take the hard way */ }
        var renamed = new Function('originalFunction', 'return function ' + desiredName + ' () {' +
            'return originalFunction.apply(this,Array.prototype.slice.apply(arguments))' +
            '}');
        return renamed(originalFunction);
    } // also works with older JavaScript engines
    var expectNonEmptyString = /*#__PURE__*/ ValidatorForClassifier(ValueIsNonEmptyString, rejectNil, 'non-empty literal string');
    var expectEMailAddress = /*#__PURE__*/ ValidatorForClassifier(ValueIsEMailAddress$1, rejectNil, 'valid EMail address');
    var expectURL = /*#__PURE__*/ ValidatorForClassifier(ValueIsURL, rejectNil, 'valid URL');
    /**** escaped - escapes all control characters in a given string ****/
    function escaped(Text) {
        var EscapeSequencePattern = /\\x[0-9a-zA-Z]{2}|\\u[0-9a-zA-Z]{4}|\\[0bfnrtv'"\\\/]?/g;
        var CtrlCharCodePattern = /[\x00-\x1f\x7f-\x9f]/g;
        return Text
            .replace(EscapeSequencePattern, function (Match) {
            return (Match === '\\' ? '\\\\' : Match);
        })
            .replace(CtrlCharCodePattern, function (Match) {
            switch (Match) {
                case '\0': return '\\0';
                case '\b': return '\\b';
                case '\f': return '\\f';
                case '\n': return '\\n';
                case '\r': return '\\r';
                case '\t': return '\\t';
                case '\v': return '\\v';
                default: {
                    var HexCode = Match.charCodeAt(0).toString(16);
                    return '\\x' + '00'.slice(HexCode.length) + HexCode;
                }
            }
        });
    }
    /**** quotable - makes a given string ready to be put in single/double quotes ****/
    function quotable(Text, Quote) {
        if (Quote === void 0) { Quote = '"'; }
        var EscSeqOrSglQuotePattern = /\\x[0-9a-zA-Z]{2}|\\u[0-9a-zA-Z]{4}|\\[0bfnrtv'"\\\/]?|'/g;
        var EscSeqOrDblQuotePattern = /\\x[0-9a-zA-Z]{2}|\\u[0-9a-zA-Z]{4}|\\[0bfnrtv'"\\\/]?|"/g;
        var CtrlCharCodePattern = /[\x00-\x1f\x7f-\x9f]/g;
        return Text
            .replace(Quote === "'" ? EscSeqOrSglQuotePattern : EscSeqOrDblQuotePattern, function (Match) {
            switch (Match) {
                case "'": return "\\'";
                case '"': return '\\"';
                case '\\': return '\\\\';
                default: return Match;
            }
        })
            .replace(CtrlCharCodePattern, function (Match) {
            switch (Match) {
                case '\0': return '\\0';
                case '\b': return '\\b';
                case '\f': return '\\f';
                case '\n': return '\\n';
                case '\r': return '\\r';
                case '\t': return '\\t';
                case '\v': return '\\v';
                default: {
                    var HexCode = Match.charCodeAt(0).toString(16);
                    return '\\x' + '00'.slice(HexCode.length) + HexCode;
                }
            }
        });
    }
    /**** quoted ****/
    function quoted(Text, Quote) {
        if (Quote === void 0) { Quote = '"'; }
        return Quote + quotable(Text, Quote) + Quote;
    }

    //----------------------------------------------------------------------------//
    /**** VoltCloud-specific types and constants ****/
    var ApplicationNamePattern = /^([a-z0-9]|[a-z0-9][-a-z0-9]*[a-z0-9])$/; // dto.
    var maxApplicationNameLength = 63; // see discussion forum
    var maxStorageKeyLength = 255; // as mentioned in REST API docs
    var maxStorageValueLength = 1048574; // see discussion forum
    /**** internal constants and variables ****/
    var Timeout = 30 * 1000; // request timeout given in ms
    var activeDeveloperAddress;
    var activeDeveloperPassword; // stored for token refresh
    var activeCustomerAddress;
    var activeCustomerPassword; // stored for token refresh
    var activeAccessToken;
    var currentApplicationId;
    var currentApplicationURL;
    var currentCustomerId;
    /**** focusOnApplication - async for for the sake of systematics only ****/
    function focusOnApplication(ApplicationURL, ApplicationId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                expectURL('VoltCloud application url', ApplicationURL);
                expectNonEmptyString('VoltCloud application id', ApplicationId);
                currentApplicationURL = ApplicationURL;
                currentApplicationId = ApplicationId;
                return [2 /*return*/];
            });
        });
    }
    /**** actOnBehalfOfCustomer ****/
    function actOnBehalfOfCustomer(EMailAddress, Password) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        expectEMailAddress('VoltCloud customer email address', EMailAddress);
                        expectPassword('VoltCloud customer password', Password);
                        assertApplicationFocus();
                        return [4 /*yield*/, loginCustomer(EMailAddress, Password)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    }
    /**** startPasswordResetForCustomer ****/
    function startPasswordResetForCustomer(EMailAddress) {
        return __awaiter(this, void 0, void 0, function () {
            var Signal_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        expectEMailAddress('VoltCloud customer email address', EMailAddress);
                        assertApplicationFocus();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, ResponseOf('public', 'POST', '{{application_url}}/api/auth/forgot', null, {
                                email: EMailAddress,
                                scope: currentApplicationId
                            })];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        Signal_6 = _a.sent();
                        switch (Signal_6.HTTPStatus) {
                            case 422: switch (Signal_6.message) {
                                case 'Could not decode scope.':
                                    throwError('InvalidArgument: invalid application id given');
                            }
                            default: throw Signal_6;
                        }
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    }
    /**** ValueIsPassword - a string following VoltCloud's password rules ****/
    function ValueIsPassword(Value) {
        return (ValueIsString(Value) && (Value.length >= 8) &&
            /[0-9]/.test(Value) && (Value.toLowerCase() !== Value));
    }
    /**** allow/expect[ed]Password ****/
    ValidatorForClassifier(ValueIsPassword, acceptNil, 'valid VoltCloud password');
    var expectPassword = ValidatorForClassifier(ValueIsPassword, rejectNil, 'valid VoltCloud password');
    /**** ValueIsApplicationName - a string suitable as a VoltCloud application name ****/
    function ValueIsApplicationName(Value) {
        return (ValueIsString(Value) &&
            (Value.length >= 1) && (Value.length <= maxApplicationNameLength) &&
            ApplicationNamePattern.test(Value));
    }
    /**** allow/expect[ed]ApplicationName ****/
    ValidatorForClassifier(ValueIsApplicationName, acceptNil, 'valid VoltCloud application name');
    ValidatorForClassifier(ValueIsApplicationName, rejectNil, 'valid VoltCloud application name');
    /**** ValueIsStorageKey - a string suitable as a VoltCloud storage key ****/
    function ValueIsStorageKey(Value) {
        return ValueIsNonEmptyString(Value) && (Value.length <= maxStorageKeyLength);
    }
    /**** allow/expect[ed]StorageKey ****/
    ValidatorForClassifier(ValueIsStorageKey, acceptNil, 'suitable VoltCloud storage key');
    ValidatorForClassifier(ValueIsStorageKey, rejectNil, 'suitable VoltCloud storage key');
    /**** ValueIsStorageValue - a string suitable as a VoltCloud storage value ****/
    function ValueIsStorageValue(Value) {
        return ValueIsNonEmptyString(Value) && (Value.length <= maxStorageValueLength);
    }
    /**** allow/expect[ed]StorageValue ****/
    ValidatorForClassifier(ValueIsStorageValue, acceptNil, 'suitable VoltCloud storage value');
    ValidatorForClassifier(ValueIsStorageValue, rejectNil, 'suitable VoltCloud storage value');
    /**** assertApplicationFocus ****/
    function assertApplicationFocus() {
        if (currentApplicationURL == null)
            throwError('InvalidState: please focus on a specific VoltCloud application first');
    }
    /**** loginDeveloper ****/
    function loginDeveloper(EMailAddress, Password, firstAttempt) {
        if (firstAttempt === void 0) { firstAttempt = true; }
        return __awaiter(this, void 0, void 0, function () {
            var Response, Signal_18;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        activeDeveloperAddress = undefined; // dto.
                        activeDeveloperPassword = undefined; // dto.
                        activeCustomerAddress = undefined; // dto.
                        activeCustomerPassword = undefined; // dto.
                        activeAccessToken = undefined;
                        currentCustomerId = undefined; // unfocus any customer
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        activeDeveloperAddress = EMailAddress; // needed in case of login failure
                        activeDeveloperPassword = Password;
                        return [4 /*yield*/, ResponseOf('public', 'POST', '{{application_url}}/api/auth/login', null, {
                                grant_type: 'password',
                                username: EMailAddress,
                                password: Password,
                                scope: 'RpYCMN'
                            }, firstAttempt)];
                    case 2:
                        Response = _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        Signal_18 = _a.sent();
                        switch (Signal_18.HTTPStatus) {
                            case 401: throwError('LoginFailed: developer could not be logged in');
                            default: throw Signal_18;
                        }
                        return [3 /*break*/, 4];
                    case 4:
                        if ((Response != null) &&
                            (Response.token_type === 'bearer') && ValueIsString(Response.access_token) &&
                            ValueIsString(Response.user_id)) {
                            activeAccessToken = Response.access_token;
                        }
                        else {
                            activeDeveloperAddress = undefined;
                            activeDeveloperPassword = undefined;
                            throwError('InternalError: could not analyze response for login request');
                        }
                        return [2 /*return*/];
                }
            });
        });
    }
    /**** loginCustomer ****/
    function loginCustomer(EMailAddress, Password, firstAttempt) {
        if (firstAttempt === void 0) { firstAttempt = true; }
        return __awaiter(this, void 0, void 0, function () {
            var Response, Signal_19;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        activeCustomerAddress = undefined; // dto.
                        activeCustomerPassword = undefined; // dto.
                        activeDeveloperAddress = undefined; // dto.
                        activeDeveloperPassword = undefined; // dto.
                        activeAccessToken = undefined;
                        currentCustomerId = undefined; // unfocus any customer
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        activeCustomerAddress = EMailAddress; // needed in case of login failure
                        activeCustomerPassword = Password;
                        return [4 /*yield*/, ResponseOf('public', 'POST', '{{application_url}}/api/auth/login', null, {
                                grant_type: 'password',
                                username: EMailAddress,
                                password: Password,
                                scope: currentApplicationId
                            }, firstAttempt)];
                    case 2:
                        Response = _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        Signal_19 = _a.sent();
                        switch (Signal_19.HTTPStatus) {
                            case 401: throwError('LoginFailed: customer could not be logged in');
                            default: throw Signal_19;
                        }
                        return [3 /*break*/, 4];
                    case 4:
                        if ((Response != null) &&
                            (Response.token_type === 'bearer') && ValueIsString(Response.access_token) &&
                            ValueIsString(Response.user_id)) {
                            activeAccessToken = Response.access_token;
                            currentCustomerId = Response.user_id; // auto-focus logged-in customer
                        }
                        else {
                            activeCustomerAddress = undefined;
                            activeCustomerPassword = undefined;
                            throwError('InternalError: could not analyze response for login request');
                        }
                        return [2 /*return*/];
                }
            });
        });
    }
    /**** ResponseOf - simplified version for applications ****/
    function ResponseOf(Mode, Method, URL, Parameters, Data, firstAttempt) {
        if (firstAttempt === void 0) { firstAttempt = true; }
        return __awaiter(this, void 0, void 0, function () {
            var fullParameters, resolvedURL;
            return __generator(this, function (_a) {
                fullParameters = Object.assign({}, {
                    application_id: currentApplicationId,
                    application_url: currentApplicationURL,
                    customer_id: currentCustomerId,
                }, Parameters || {});
                resolvedURL = resolved(URL, fullParameters);
                if (Method === 'GET') {
                    resolvedURL += ((resolvedURL.indexOf('?') < 0 ? '?' : '&') +
                        '_=' + Date.now());
                }
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var Request = new XMLHttpRequest();
                        Request.open(Method, resolvedURL, true);
                        if (Mode === 'private') {
                            Request.withCredentials = true;
                            Request.setRequestHeader('authorization', 'Bearer ' + activeAccessToken);
                        }
                        Request.timeout = Timeout;
                        Request.addEventListener('timeout', function () {
                            reject(namedError('RequestTimedout: VoltCloud request timed out'));
                        });
                        Request.addEventListener('abort', function () {
                            reject(namedError('RequestAborted: VoltCloud request has been aborted'));
                        });
                        function handleError() {
                            return __awaiter(this, void 0, void 0, function () {
                                var ContentType, ErrorDetails;
                                return __generator(this, function (_a) {
                                    if (Request.status === 401) {
                                        if (firstAttempt && (Mode !== 'public')) { // try to "refresh" the access token
                                            return [2 /*return*/, (activeDeveloperAddress != null // also catches login failures
                                                    ? loginDeveloper(activeDeveloperAddress, activeDeveloperPassword, false)
                                                    : loginCustomer(activeCustomerAddress, activeCustomerPassword, false))
                                                    .then(function () {
                                                    ResponseOf(Mode, Method, URL, Parameters, Data, false)
                                                        .then(function (Result) { return resolve(Result); })
                                                        .catch(function (Signal) { return reject(Signal); });
                                                })
                                                    .catch(function (Signal) { return reject(Signal); })];
                                        }
                                        else {
                                            return [2 /*return*/, reject(namedError('AuthorizationFailure: VoltCloud request could not be authorized', { HTTPStatus: Request.status }))];
                                        }
                                    }
                                    ContentType = Request.getResponseHeader('content-type') || '';
                                    if (ContentType.startsWith('application/json')) {
                                        try { // if given, try to use a VoltCloud error message
                                            ErrorDetails = JSON.parse(Request.responseText);
                                            if (ValueIsNonEmptyString(ErrorDetails.type) &&
                                                ValueIsNonEmptyString(ErrorDetails.message)) {
                                                if ((Request.status === 422) &&
                                                    (ErrorDetails.type === 'ValidationError') &&
                                                    (ErrorDetails.validations != null)) {
                                                    return [2 /*return*/, reject(ValidationError(ErrorDetails))];
                                                }
                                                else {
                                                    return [2 /*return*/, reject(namedError(ErrorDetails.type + ': ' + ErrorDetails.message, {
                                                            HTTPStatus: Request.status, HTTPResponse: Request.responseText
                                                        }))];
                                                }
                                            }
                                        }
                                        catch (Signal) { /* otherwise create a generic error message */ }
                                    }
                                    return [2 /*return*/, reject(namedError('RequestFailed: VoltCloud request failed', {
                                            HTTPStatus: Request.status, HTTPResponse: Request.responseText
                                        }))];
                                });
                            });
                        }
                        Request.addEventListener('error', handleError);
                        function handleSuccess() {
                            return __awaiter(this, void 0, void 0, function () {
                                var StatusCode, ContentType;
                                return __generator(this, function (_a) {
                                    StatusCode = Request.status;
                                    ContentType = Request.getResponseHeader('content-type') || '';
                                    if (StatusCode === 204) {
                                        return [2 /*return*/, resolve(undefined)];
                                    }
                                    else {
                                        switch (true) {
                                            case ContentType.startsWith('application/json'):
                                                return [2 /*return*/, resolve(JSON.parse(Request.responseText))];
                                            case (StatusCode === 201): // often with content-type "text/plain"
                                                return [2 /*return*/, resolve(undefined)];
                                            default:
                                                return [2 /*return*/, reject(namedError('RequestFailed: unexpected response content type ' +
                                                        quoted(ContentType || '(missing)'), {
                                                        ContentType: ContentType,
                                                        HTTPResponse: Request.responseText
                                                    }))];
                                        }
                                    }
                                });
                            });
                        }
                        Request.addEventListener('load', function () {
                            if ((Request.status < 200) || (Request.status >= 300)) {
                                handleError();
                            }
                            else {
                                handleSuccess();
                            }
                        });
                        if (Data == null) {
                            Request.send(null);
                        }
                        else {
                            if (Data instanceof Blob) {
                                var RequestBody = new FormData();
                                RequestBody.append('index.zip', Data);
                                Request.send(RequestBody);
                            }
                            else {
                                Request.setRequestHeader('Content-Type', 'application/json');
                                Request.send(JSON.stringify(Data));
                            }
                        }
                    })];
            });
        });
    }
    /**** resolved ****/
    var PlaceholderPattern = /\{\{([a-z0-9_-]+)\}\}/gi;
    function resolved(Text, VariableSet) {
        return Text.replace(PlaceholderPattern, function (_, VariableName) {
            if (VariableSet.hasOwnProperty(VariableName)) {
                return VariableSet[VariableName];
            }
            else {
                throwError('VariableNotFound: the given placeholder text refers to an ' +
                    'undefined variable called ' + quoted(VariableName));
            }
        });
    }
    /**** namedError ****/
    function namedError(Message, Details) {
        var Result;
        var Match = /^([$a-zA-Z][$a-zA-Z0-9]*):\s*(\S.+)\s*$/.exec(Message);
        if (Match == null) {
            Result = new Error(Message);
        }
        else {
            Result = new Error(Match[2]);
            Result.name = Match[1];
        }
        if (Details != null) {
            Object.assign(Result, Details); // not fool-proof!
        }
        return Result;
    }
    /**** ValidationError ****/
    function ValidationError(Details) {
        function named422Error(Message) {
            return namedError(Message, { HTTPStatus: 422 });
        }
        if (ValueIsArray(Details.validations.body) &&
            (Details.validations.body[0] != null)) {
            var firstMessage = Details.validations.body[0].messages[0];
            switch (true) {
                case firstMessage.contains('email'):
                    switch (Details.validations.body[0].property) {
                        case 'request.body.username':
                        case 'request.body.email': return named422Error('InvalidArgument: invalid EMail address given');
                    }
                    break;
                case firstMessage.contains('^([a-z0-9]|[a-z0-9][-a-z0-9]*[a-z0-9])$'):
                    switch (Details.validations.body[0].property) {
                        case 'request.body.subdomain': return named422Error('InvalidArgument: invalid application name given');
                    }
                    break;
                case firstMessage.contains('does not meet minimum length of 1'):
                    switch (Details.validations.body[0].property) {
                        case 'request.body.subdomain': return named422Error('MissingArgument: no application name given');
                        case 'request.body.confirmation_url': return named422Error('MissingArgument: no Customer Confirmation URL given');
                        case 'request.body.reset_url': return named422Error('MissingArgument: no Password Reset URL given');
                    }
                    break;
                case firstMessage.contains('does not meet maximum length of 63'):
                    switch (Details.validations.body[0].property) {
                        case 'request.body.subdomain': return named422Error('InvalidArgument: the given application name is too long');
                        case 'request.body.confirmation_url': return named422Error('InvalidArgument: the given Customer Confirmation URL is too long');
                        case 'request.body.reset_url': return named422Error('InvalidArgument: the given Password Reset URL is too long');
                    }
                    break;
                case firstMessage.contains('additionalProperty'):
                    return named422Error('InvalidArgument: unsupported property given');
                case firstMessage.contains('does not match pattern "[a-zA-Z0-9]{6,}"'):
                    return named422Error('InvalidArgument: invalid Application Id given');
            }
        }
        if (ValueIsArray(Details.validations.password) &&
            (Details.validations.password[0] != null)) {
            return named422Error('InvalidArgument: ' + Details.validations.password[0]);
        }
        /**** fallback ****/
        return namedError('InternalError: ' + Details.message, Details);
    }

    //----------------------------------------------------------------------------//
    /**** ValueIsStringMatching ****/
    function ValueIsStringMatching(Value, Pattern) {
        return ((typeof Value === 'string') || (Value instanceof String)) && Pattern.test(Value.valueOf());
    }
    /**** ValueIsEMailAddress ****/
    var EMailAddressPattern = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;
    // see https://stackoverflow.com/questions/201323/how-to-validate-an-email-address-using-a-regular-expression
    function ValueIsEMailAddress(Value) {
        return ValueIsStringMatching(Value, EMailAddressPattern);
    }
    /**** constrained ****/
    function constrained(Value, Minimum, Maximum) {
        if (Minimum === void 0) { Minimum = -Infinity; }
        if (Maximum === void 0) { Maximum = Infinity; }
        return Math.max(Minimum, Math.min(Value, Maximum));
    }

    var css_248z$8 = ".Dialog.svelte-1gne4st.svelte-1gne4st.svelte-1gne4st{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-1gne4st>div.svelte-1gne4st.svelte-1gne4st{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-1gne4st>div.svelte-1gne4st>[name=\"CloseButton\"].svelte-1gne4st{display:block;position:absolute;top:-20px;right:-20px;width:20px;height:20px;border:solid 2px white;border-radius:50%;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2), 0px 0px 0px 1px lightgray;background-color:black;padding:0px;font-size:18px;font-weight:bold;line-height:12px;text-align:center;color:white;cursor:pointer}.Dialog.svelte-1gne4st>div.svelte-1gne4st>[name=\"Title\"].svelte-1gne4st{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}.Dialog.svelte-1gne4st>div.svelte-1gne4st>.Block.svelte-1gne4st{display:block;margin:0px 0px 10px 0px;text-align:justify}.Dialog.svelte-1gne4st>div.svelte-1gne4st>input.svelte-1gne4st{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:4px;border:solid 1px lightgray;border-radius:2px;font-size:16px}.Dialog.svelte-1gne4st>div.svelte-1gne4st>button.svelte-1gne4st{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:6px;background-color:#2980B9;border:none;border-radius:4px;font-size:16px;font-weight:bold;color:white;cursor:pointer}.Dialog.svelte-1gne4st>div.svelte-1gne4st>button.svelte-1gne4st:disabled{opacity:0.3;cursor:auto}.Dialog.svelte-1gne4st>div.svelte-1gne4st>.FormMessage.svelte-1gne4st{display:inline-block;position:relative;left:2px;top:-2px;font-size:12px\n  }.Dialog.svelte-1gne4st>div.svelte-1gne4st>.invalid.FormMessage.svelte-1gne4st{color:red}";
    styleInject(css_248z$8,{"insertAt":"top"});

    /* src/ResetRequestDialog.svelte generated by Svelte v3.42.1 */

    function create_fragment$9(ctx) {
    	let div6;
    	let div5;
    	let div0;
    	let t1;
    	let div1;
    	let t3;
    	let div2;
    	let t5;
    	let div3;
    	let t7;
    	let input;
    	let t8;
    	let div4;
    	let t9;
    	let t10;
    	let button;
    	let t11;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			div6 = element("div");
    			div5 = element("div");
    			div0 = element("div");
    			div0.textContent = "×";
    			t1 = space();
    			div1 = element("div");
    			div1.textContent = "Request Password Reset";
    			t3 = space();
    			div2 = element("div");
    			div2.textContent = "If you forgot your password, you may ask for an email containing a link\n      which will allow you to define a new password.";
    			t5 = space();
    			div3 = element("div");
    			div3.textContent = "That email will be sent immediately after submitting this request, the link\n      within will be valid for one hour.";
    			t7 = space();
    			input = element("input");
    			t8 = space();
    			div4 = element("div");
    			t9 = text(/*AddressMessage*/ ctx[2]);
    			t10 = space();
    			button = element("button");
    			t11 = text("SubmitRequest");
    			attr(div0, "name", "CloseButton");
    			attr(div0, "class", "svelte-1gne4st");
    			attr(div1, "name", "Title");
    			attr(div1, "class", "svelte-1gne4st");
    			attr(div2, "class", "Block svelte-1gne4st");
    			attr(div3, "class", "Block svelte-1gne4st");
    			attr(input, "name", "EMailAddressInput");
    			attr(input, "type", "email");
    			attr(input, "placeholder", "your email address");
    			attr(input, "class", "svelte-1gne4st");
    			attr(div4, "class", "svelte-1gne4st");
    			toggle_class(div4, "FormMessage", true);
    			toggle_class(div4, "invalid", /*AddressLooksBad*/ ctx[1]);
    			attr(button, "name", "SubmitButton");
    			button.disabled = /*SubmitIsForbidden*/ ctx[3];
    			attr(button, "class", "svelte-1gne4st");
    			attr(div5, "class", "svelte-1gne4st");
    			attr(div6, "class", "Dialog svelte-1gne4st");
    		},
    		m(target, anchor) {
    			insert(target, div6, anchor);
    			append(div6, div5);
    			append(div5, div0);
    			append(div5, t1);
    			append(div5, div1);
    			append(div5, t3);
    			append(div5, div2);
    			append(div5, t5);
    			append(div5, div3);
    			append(div5, t7);
    			append(div5, input);
    			set_input_value(input, /*EMailAddress*/ ctx[0]);
    			append(div5, t8);
    			append(div5, div4);
    			append(div4, t9);
    			append(div5, t10);
    			append(div5, button);
    			append(button, t11);

    			if (!mounted) {
    				dispose = [
    					listen(div0, "click", closeDialog$1),
    					listen(input, "input", /*input_input_handler*/ ctx[5]),
    					listen(button, "click", /*submitRequest*/ ctx[4])
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*EMailAddress*/ 1 && input.value !== /*EMailAddress*/ ctx[0]) {
    				set_input_value(input, /*EMailAddress*/ ctx[0]);
    			}

    			if (dirty & /*AddressMessage*/ 4) set_data(t9, /*AddressMessage*/ ctx[2]);

    			if (dirty & /*AddressLooksBad*/ 2) {
    				toggle_class(div4, "invalid", /*AddressLooksBad*/ ctx[1]);
    			}

    			if (dirty & /*SubmitIsForbidden*/ 8) {
    				button.disabled = /*SubmitIsForbidden*/ ctx[3];
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div6);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function closeDialog$1(Event) {
    	Event.preventDefault();
    	Globals.define('State', '');
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let SubmitIsForbidden;
    	let $Globals;
    	component_subscribe($$self, Globals, $$value => $$invalidate(6, $Globals = $$value));

    	var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
    		function adopt(value) {
    			return value instanceof P
    			? value
    			: new P(function (resolve) {
    						resolve(value);
    					});
    		}

    		return new (P || (P = Promise))(function (resolve, reject) {
    				function fulfilled(value) {
    					try {
    						step(generator.next(value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function rejected(value) {
    					try {
    						step(generator["throw"](value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function step(result) {
    					result.done
    					? resolve(result.value)
    					: adopt(result.value).then(fulfilled, rejected);
    				}

    				step((generator = generator.apply(thisArg, _arguments || [])).next());
    			});
    	};

    	let EMailAddress, AddressLooksBad, AddressMessage;
    	EMailAddress = $Globals.EMailAddress || '';

    	function submitRequest(Event) {
    		return __awaiter(this, void 0, void 0, function* () {
    			Event.preventDefault();
    			Globals.define({ State: 'requestingReset' });

    			try {
    				yield focusOnApplication($Globals.ApplicationURL, $Globals.ApplicationId);
    				yield startPasswordResetForCustomer(EMailAddress);
    			} catch(Signal) {
    				Globals.define({
    					State: 'CommunicationFailure',
    					FailureReason: Signal.toString()
    				});

    				return;
    			}

    			Globals.define({ State: 'ResetRequested' });
    		});
    	}

    	function input_input_handler() {
    		EMailAddress = this.value;
    		$$invalidate(0, EMailAddress);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*EMailAddress*/ 1) {
    			switch (true) {
    				case EMailAddress.trim() === '':
    					$$invalidate(1, AddressLooksBad = true);
    					$$invalidate(2, AddressMessage = 'please, enter your EMail address');
    					break;
    				case ValueIsEMailAddress(EMailAddress):
    					$$invalidate(1, AddressLooksBad = false);
    					$$invalidate(2, AddressMessage = 'your email address looks acceptable');
    					break;
    				default:
    					$$invalidate(1, AddressLooksBad = true);
    					$$invalidate(2, AddressMessage = 'please, enter a valid EMail address');
    			}
    		}

    		if ($$self.$$.dirty & /*AddressLooksBad*/ 2) {
    			$$invalidate(3, SubmitIsForbidden = AddressLooksBad);
    		}
    	};

    	return [
    		EMailAddress,
    		AddressLooksBad,
    		AddressMessage,
    		SubmitIsForbidden,
    		submitRequest,
    		input_input_handler
    	];
    }

    class ResetRequestDialog extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});
    	}
    }

    var css_248z$7 = ".Dialog.svelte-1gne4st.svelte-1gne4st.svelte-1gne4st{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-1gne4st a.svelte-1gne4st.svelte-1gne4st,.Dialog.svelte-1gne4st a.svelte-1gne4st.svelte-1gne4st:visited{color:#2980B9;text-decoration:underline}.Dialog.svelte-1gne4st>div.svelte-1gne4st.svelte-1gne4st{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-1gne4st>div.svelte-1gne4st>[name=\"Title\"].svelte-1gne4st{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}.Dialog.svelte-1gne4st>div.svelte-1gne4st>.Block.svelte-1gne4st{display:block;margin:0px 0px 10px 0px;text-align:justify}.Dialog.svelte-1gne4st>div.svelte-1gne4st>button.svelte-1gne4st{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:6px;background-color:#2980B9;border:none;border-radius:4px;font-size:16px;font-weight:bold;color:white;cursor:pointer}.Dialog.svelte-1gne4st>div.svelte-1gne4st>button.svelte-1gne4st:disabled{opacity:0.3;cursor:auto}";
    styleInject(css_248z$7,{"insertAt":"top"});

    /* src/LoginFailureDisplay.svelte generated by Svelte v3.42.1 */

    function create_fragment$8(ctx) {
    	let div5;
    	let div4;
    	let div0;
    	let t1;
    	let div1;
    	let t3;
    	let div2;
    	let t4;
    	let a0;
    	let t6;
    	let t7;
    	let div3;
    	let t8;
    	let a1;
    	let t10;
    	let t11;
    	let button;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			div5 = element("div");
    			div4 = element("div");
    			div0 = element("div");
    			div0.textContent = "Login Failure";
    			t1 = space();
    			div1 = element("div");
    			div1.textContent = "Your EMail address or your password may have been incorrect.";
    			t3 = space();
    			div2 = element("div");
    			t4 = text("If you have not yet applied for an account, just\n      ");
    			a0 = element("a");
    			a0.textContent = "create one";
    			t6 = text("!");
    			t7 = space();
    			div3 = element("div");
    			t8 = text("If you forgot your password, you may ask for a\n      ");
    			a1 = element("a");
    			a1.textContent = "password reset";
    			t10 = text(".");
    			t11 = space();
    			button = element("button");
    			button.textContent = "Ok";
    			attr(div0, "name", "Title");
    			attr(div0, "class", "svelte-1gne4st");
    			attr(div1, "class", "Block svelte-1gne4st");
    			attr(a0, "href", "#/");
    			attr(a0, "class", "svelte-1gne4st");
    			attr(div2, "class", "Block svelte-1gne4st");
    			attr(a1, "href", "#/");
    			attr(a1, "class", "svelte-1gne4st");
    			attr(div3, "class", "Block svelte-1gne4st");
    			attr(button, "class", "svelte-1gne4st");
    			attr(div4, "class", "svelte-1gne4st");
    			attr(div5, "class", "Dialog svelte-1gne4st");
    		},
    		m(target, anchor) {
    			insert(target, div5, anchor);
    			append(div5, div4);
    			append(div4, div0);
    			append(div4, t1);
    			append(div4, div1);
    			append(div4, t3);
    			append(div4, div2);
    			append(div2, t4);
    			append(div2, a0);
    			append(div2, t6);
    			append(div4, t7);
    			append(div4, div3);
    			append(div3, t8);
    			append(div3, a1);
    			append(div3, t10);
    			append(div4, t11);
    			append(div4, button);

    			if (!mounted) {
    				dispose = [
    					listen(a0, "click", showRegistration$1),
    					listen(a1, "click", showPasswordReset$1),
    					listen(button, "click", closeMessage)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div5);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function showRegistration$1(Event) {
    	Event.preventDefault();
    	Globals.define('State', 'Registration');
    }

    function showPasswordReset$1(Event) {
    	Event.preventDefault();
    	Globals.define('State', 'ResetRequest');
    }

    function closeMessage(Event) {
    	Event.preventDefault();
    	Globals.define('State', '');
    }

    function instance$8($$self) {
    	return [];
    }

    class LoginFailureDisplay extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});
    	}
    }

    var css_248z$6 = ".Dialog.svelte-1gne4st.svelte-1gne4st.svelte-1gne4st{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-1gne4st>div.svelte-1gne4st.svelte-1gne4st{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-1gne4st>div.svelte-1gne4st>[name=\"Title\"].svelte-1gne4st{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}.Dialog.svelte-1gne4st>div.svelte-1gne4st>button.svelte-1gne4st{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:6px;background-color:#2980B9;border:none;border-radius:4px;font-size:16px;font-weight:bold;color:white;cursor:pointer}.Dialog.svelte-1gne4st>div.svelte-1gne4st>button.svelte-1gne4st:disabled{opacity:0.3;cursor:auto}";
    styleInject(css_248z$6,{"insertAt":"top"});

    /* src/LoggingInDisplay.svelte generated by Svelte v3.42.1 */

    function create_fragment$7(ctx) {
    	let div2;
    	let div1;
    	let div0;
    	let t1;
    	let button;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			div0.textContent = "Logging in...please wait";
    			t1 = space();
    			button = element("button");
    			button.textContent = "Abort Login";
    			attr(div0, "name", "Title");
    			attr(div0, "class", "svelte-1gne4st");
    			attr(button, "class", "svelte-1gne4st");
    			attr(div1, "class", "svelte-1gne4st");
    			attr(div2, "class", "Dialog svelte-1gne4st");
    		},
    		m(target, anchor) {
    			insert(target, div2, anchor);
    			append(div2, div1);
    			append(div1, div0);
    			append(div1, t1);
    			append(div1, button);

    			if (!mounted) {
    				dispose = listen(button, "click", abortLogin);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div2);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    function abortLogin(Event) {
    	Event.preventDefault();
    	Globals.define('State', '');
    }

    function instance$7($$self) {
    	return [];
    }

    class LoggingInDisplay extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});
    	}
    }

    var css_248z$5 = ".Dialog.svelte-gr5y99.svelte-gr5y99.svelte-gr5y99{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-gr5y99 a.svelte-gr5y99.svelte-gr5y99,.Dialog.svelte-gr5y99 a.svelte-gr5y99.svelte-gr5y99:visited{color:#2980B9;text-decoration:underline}.Dialog.svelte-gr5y99>div.svelte-gr5y99.svelte-gr5y99{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-gr5y99>div.svelte-gr5y99>[name=\"CloseButton\"].svelte-gr5y99{display:block;position:absolute;top:-20px;right:-20px;width:20px;height:20px;border:solid 2px white;border-radius:50%;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2), 0px 0px 0px 1px lightgray;background-color:black;padding:0px;font-size:18px;font-weight:bold;line-height:12px;text-align:center;color:white;cursor:pointer}.Dialog.svelte-gr5y99>div.svelte-gr5y99>[name=\"Title\"].svelte-gr5y99{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}.Dialog.svelte-gr5y99>div.svelte-gr5y99>input.svelte-gr5y99{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:4px;border:solid 1px lightgray;border-radius:2px;font-size:16px}.Dialog.svelte-gr5y99>div.svelte-gr5y99>button.svelte-gr5y99{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:6px;background-color:#2980B9;border:none;border-radius:4px;font-size:16px;font-weight:bold;color:white;cursor:pointer}.Dialog.svelte-gr5y99>div.svelte-gr5y99>button.svelte-gr5y99:disabled{opacity:0.3;cursor:auto}.Dialog.svelte-gr5y99>div.svelte-gr5y99>.FormMessage.svelte-gr5y99{display:inline-block;position:relative;left:2px;top:-2px;font-size:12px\n  }.Dialog.svelte-gr5y99>div.svelte-gr5y99>.invalid.FormMessage.svelte-gr5y99{color:red}.Dialog.svelte-gr5y99>div.svelte-gr5y99>[name=\"ForgottenPassword\"].svelte-gr5y99{display:block;position:relative;padding:10px 0px 10px 0px;text-align:right}";
    styleInject(css_248z$5,{"insertAt":"top"});

    /* src/LoginDialog.svelte generated by Svelte v3.42.1 */

    function create_fragment$6(ctx) {
    	let div7;
    	let div6;
    	let div0;
    	let t1;
    	let div1;
    	let t3;
    	let input0;
    	let t4;
    	let div2;
    	let t5;
    	let t6;
    	let input1;
    	let t7;
    	let div3;
    	let t8;
    	let t9;
    	let div4;
    	let a0;
    	let t11;
    	let button;
    	let t12;
    	let t13;
    	let div5;
    	let t14;
    	let a1;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			div7 = element("div");
    			div6 = element("div");
    			div0 = element("div");
    			div0.textContent = "×";
    			t1 = space();
    			div1 = element("div");
    			div1.textContent = "Login";
    			t3 = space();
    			input0 = element("input");
    			t4 = space();
    			div2 = element("div");
    			t5 = text(/*AddressMessage*/ ctx[4]);
    			t6 = space();
    			input1 = element("input");
    			t7 = space();
    			div3 = element("div");
    			t8 = text(/*PasswordMessage*/ ctx[5]);
    			t9 = space();
    			div4 = element("div");
    			a0 = element("a");
    			a0.textContent = "Forgot your password?";
    			t11 = space();
    			button = element("button");
    			t12 = text("Login");
    			t13 = space();
    			div5 = element("div");
    			t14 = text("Don't have an account? ");
    			a1 = element("a");
    			a1.textContent = "Create one!";
    			attr(div0, "name", "CloseButton");
    			attr(div0, "class", "svelte-gr5y99");
    			attr(div1, "name", "Title");
    			attr(div1, "class", "svelte-gr5y99");
    			attr(input0, "name", "EMailAddressInput");
    			attr(input0, "type", "email");
    			attr(input0, "placeholder", "your email address");
    			attr(input0, "class", "svelte-gr5y99");
    			attr(div2, "class", "svelte-gr5y99");
    			toggle_class(div2, "FormMessage", true);
    			toggle_class(div2, "invalid", /*AddressLooksBad*/ ctx[1]);
    			attr(input1, "name", "PasswordInput");
    			attr(input1, "type", "password");
    			attr(input1, "placeholder", "your password");
    			attr(input1, "class", "svelte-gr5y99");
    			attr(div3, "class", "svelte-gr5y99");
    			toggle_class(div3, "FormMessage", true);
    			toggle_class(div3, "invalid", /*PasswordLooksBad*/ ctx[3]);
    			attr(a0, "href", "#/");
    			attr(a0, "class", "svelte-gr5y99");
    			attr(div4, "name", "ForgottenPassword");
    			attr(div4, "class", "svelte-gr5y99");
    			attr(button, "name", "LoginButton");
    			button.disabled = /*LoginIsForbidden*/ ctx[6];
    			attr(button, "class", "svelte-gr5y99");
    			attr(a1, "href", "#/");
    			attr(a1, "class", "svelte-gr5y99");
    			set_style(div5, "text-align", "center");
    			attr(div6, "class", "svelte-gr5y99");
    			attr(div7, "class", "Dialog svelte-gr5y99");
    		},
    		m(target, anchor) {
    			insert(target, div7, anchor);
    			append(div7, div6);
    			append(div6, div0);
    			append(div6, t1);
    			append(div6, div1);
    			append(div6, t3);
    			append(div6, input0);
    			set_input_value(input0, /*EMailAddress*/ ctx[0]);
    			append(div6, t4);
    			append(div6, div2);
    			append(div2, t5);
    			append(div6, t6);
    			append(div6, input1);
    			set_input_value(input1, /*Password*/ ctx[2]);
    			append(div6, t7);
    			append(div6, div3);
    			append(div3, t8);
    			append(div6, t9);
    			append(div6, div4);
    			append(div4, a0);
    			append(div6, t11);
    			append(div6, button);
    			append(button, t12);
    			append(div6, t13);
    			append(div6, div5);
    			append(div5, t14);
    			append(div5, a1);

    			if (!mounted) {
    				dispose = [
    					listen(div0, "click", closeDialog),
    					listen(input0, "input", /*input0_input_handler*/ ctx[8]),
    					listen(input1, "input", /*input1_input_handler*/ ctx[9]),
    					listen(a0, "click", showPasswordReset),
    					listen(button, "click", /*doLogin*/ ctx[7]),
    					listen(a1, "click", showRegistration)
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*EMailAddress*/ 1 && input0.value !== /*EMailAddress*/ ctx[0]) {
    				set_input_value(input0, /*EMailAddress*/ ctx[0]);
    			}

    			if (dirty & /*AddressMessage*/ 16) set_data(t5, /*AddressMessage*/ ctx[4]);

    			if (dirty & /*AddressLooksBad*/ 2) {
    				toggle_class(div2, "invalid", /*AddressLooksBad*/ ctx[1]);
    			}

    			if (dirty & /*Password*/ 4 && input1.value !== /*Password*/ ctx[2]) {
    				set_input_value(input1, /*Password*/ ctx[2]);
    			}

    			if (dirty & /*PasswordMessage*/ 32) set_data(t8, /*PasswordMessage*/ ctx[5]);

    			if (dirty & /*PasswordLooksBad*/ 8) {
    				toggle_class(div3, "invalid", /*PasswordLooksBad*/ ctx[3]);
    			}

    			if (dirty & /*LoginIsForbidden*/ 64) {
    				button.disabled = /*LoginIsForbidden*/ ctx[6];
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div7);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function closeDialog(Event) {
    	Event.preventDefault();
    	Globals.define('State', '');
    }

    function showRegistration(Event) {
    	Event.preventDefault();
    	Globals.define('State', 'Registration');
    }

    function showPasswordReset(Event) {
    	Event.preventDefault();
    	Globals.define('State', 'ResetRequest');
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let LoginIsForbidden;
    	let $Globals;
    	component_subscribe($$self, Globals, $$value => $$invalidate(10, $Globals = $$value));

    	var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
    		function adopt(value) {
    			return value instanceof P
    			? value
    			: new P(function (resolve) {
    						resolve(value);
    					});
    		}

    		return new (P || (P = Promise))(function (resolve, reject) {
    				function fulfilled(value) {
    					try {
    						step(generator.next(value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function rejected(value) {
    					try {
    						step(generator["throw"](value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function step(result) {
    					result.done
    					? resolve(result.value)
    					: adopt(result.value).then(fulfilled, rejected);
    				}

    				step((generator = generator.apply(thisArg, _arguments || [])).next());
    			});
    	};

    	let EMailAddress, AddressLooksBad, AddressMessage;
    	let Password, PasswordLooksBad, PasswordMessage;
    	EMailAddress = $Globals.EMailAddress || '';
    	Password = '';

    	function doLogin(Event) {
    		return __awaiter(this, void 0, void 0, function* () {
    			Event.preventDefault();

    			Globals.define({
    				State: 'loggingIn',
    				EMailAddress,
    				Password
    			});

    			try {
    				yield focusOnApplication($Globals.ApplicationURL, $Globals.ApplicationId);
    				yield actOnBehalfOfCustomer(EMailAddress, Password);
    			} catch(Signal) {
    				if (Signal.name === 'LoginFailed') {
    					Globals.define('State', 'LoginFailure');
    				} else {
    					Globals.define({
    						State: 'CommunicationFailure',
    						FailureReason: Signal.toString()
    					});
    				}

    				return;
    			}

    			Globals.define({ loggedIn: true, State: '' });
    		});
    	}

    	function input0_input_handler() {
    		EMailAddress = this.value;
    		$$invalidate(0, EMailAddress);
    	}

    	function input1_input_handler() {
    		Password = this.value;
    		$$invalidate(2, Password);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*EMailAddress*/ 1) {
    			switch (true) {
    				case EMailAddress.trim() === '':
    					$$invalidate(1, AddressLooksBad = true);
    					$$invalidate(4, AddressMessage = 'please, enter your EMail address');
    					break;
    				case ValueIsEMailAddress(EMailAddress):
    					$$invalidate(1, AddressLooksBad = false);
    					$$invalidate(4, AddressMessage = 'your email address looks acceptable');
    					break;
    				default:
    					$$invalidate(1, AddressLooksBad = true);
    					$$invalidate(4, AddressMessage = 'please, enter a valid EMail address');
    			}
    		}

    		if ($$self.$$.dirty & /*Password*/ 4) {
    			switch (true) {
    				case Password === '':
    					$$invalidate(3, PasswordLooksBad = true);
    					$$invalidate(5, PasswordMessage = 'please, enter your password');
    					break;
    				case Password.length < 10:
    					$$invalidate(3, PasswordLooksBad = true);
    					$$invalidate(5, PasswordMessage = 'your password is too short');
    					break;
    				case !(/[0-9]/).test(Password):
    					$$invalidate(3, PasswordLooksBad = true);
    					$$invalidate(5, PasswordMessage = 'your password lacks any digits');
    					break;
    				case Password.toLowerCase() === Password:
    					$$invalidate(3, PasswordLooksBad = true);
    					$$invalidate(5, PasswordMessage = 'your password lacks any uppercase characters');
    					break;
    				case Password.toUpperCase() === Password:
    					$$invalidate(3, PasswordLooksBad = true);
    					$$invalidate(5, PasswordMessage = 'your password lacks any lowercase characters');
    					break;
    				default:
    					$$invalidate(3, PasswordLooksBad = false);
    					$$invalidate(5, PasswordMessage = 'your password looks acceptable');
    			}
    		}

    		if ($$self.$$.dirty & /*AddressLooksBad, PasswordLooksBad*/ 10) {
    			$$invalidate(6, LoginIsForbidden = AddressLooksBad || PasswordLooksBad);
    		}
    	};

    	return [
    		EMailAddress,
    		AddressLooksBad,
    		Password,
    		PasswordLooksBad,
    		AddressMessage,
    		PasswordMessage,
    		LoginIsForbidden,
    		doLogin,
    		input0_input_handler,
    		input1_input_handler
    	];
    }

    class LoginDialog extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});
    	}
    }

    var css_248z$4 = ".Overlay.svelte-1nu3ouw{display:flex;flex-flow:column nowrap;justify-content:center;align-items:center;position:absolute;left:0px;top:0px;width:100%;height:100%;background-color:rgb(0,0,0,0.2)}";
    styleInject(css_248z$4,{"insertAt":"top"});

    /* src/Overlay.svelte generated by Svelte v3.42.1 */

    function create_fragment$5(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	return {
    		c() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr(div, "class", "Overlay svelte-1nu3ouw");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 1)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[0],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[0])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[0], dirty, null),
    						null
    					);
    				}
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;

    	$$self.$$set = $$props => {
    		if ('$$scope' in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	return [$$scope, slots];
    }

    class Overlay extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});
    	}
    }

    /* src/NotePage.svelte generated by Svelte v3.42.1 */

    function create_fragment$4(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	return {
    		c() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 1)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[0],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[0])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[0], dirty, null),
    						null
    					);
    				}
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;

    	$$self.$$set = $$props => {
    		if ('$$scope' in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	return [$$scope, slots];
    }

    class NotePage extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});
    	}
    }

    var css_248z$3 = ".Page.svelte-1tfx5dq.svelte-1tfx5dq{display:flex;flex-flow:column nowrap;align-items:stretch;display:relative;width:100%;height:100%}.NavigationBar.svelte-1tfx5dq.svelte-1tfx5dq{display:flex;flex:0 0 auto;width:100%;height:44px;border:none;border-bottom:solid 1px black;font-size:18px;font-weight:bold}.NavigationBar.svelte-1tfx5dq .Button.svelte-1tfx5dq{display:inline-block;position:absolute;top:0px;width:auto;height:44px;line-height:44px;color:#0080FF;cursor:pointer}.NavigationBar.svelte-1tfx5dq .left.Button.svelte-1tfx5dq{left:10px;text-align:left }.NavigationBar.svelte-1tfx5dq .Caret.svelte-1tfx5dq{display:inline;position:relative;top:0px;font-size:22px;font-weight:bold}.NavigationBar.svelte-1tfx5dq .Title.svelte-1tfx5dq{display:block;position:absolute;width:100%;height:44px;text-align:center;line-height:44px;pointer-events:none}.ContentArea.svelte-1tfx5dq.svelte-1tfx5dq{display:block;flex:1 1 auto;overflow:auto}.ContentArea.svelte-1tfx5dq .Block.svelte-1tfx5dq{display:block;margin:20px;text-align:justify}.ContentArea.svelte-1tfx5dq .Block ul.svelte-1tfx5dq{margin-left:20px;padding-left:0px}.ContentArea.svelte-1tfx5dq .Block ul ul.svelte-1tfx5dq{margin-left:10px;padding-left:0px}";
    styleInject(css_248z$3,{"insertAt":"top"});

    /* src/LegalPage.svelte generated by Svelte v3.42.1 */

    function create_fragment$3(ctx) {
    	let div9;
    	let div2;
    	let div0;
    	let t2;
    	let div1;
    	let t4;
    	let div8;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			div9 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			div0.innerHTML = `<span class="Caret svelte-1tfx5dq">⟨</span> Back`;
    			t2 = space();
    			div1 = element("div");
    			div1.textContent = "VfB-Notes - Legal";
    			t4 = space();
    			div8 = element("div");

    			div8.innerHTML = `<div class="Block svelte-1tfx5dq">&quot;VfB-Notes&quot; is a simple application hosted at and using additional
      services offered by <a href="https://voltcloud.io/">VoltCloud.io</a>.
      As a consequence, at first, the VoltCloud
      <a href="https://www.appstudio.dev/app/legal/legal.php">Privacy Policy</a>
      and
      <a href="https://www.appstudio.dev/app/legal/legal.php">Terms of Service</a>
      apply.</div> 

    <div class="Block svelte-1tfx5dq"><h4>Logging</h4>

      &quot;VfB-Notes&quot; itself does not perform any logging.</div> 

    <div class="Block svelte-1tfx5dq"><h4>Cookies and other Data stored in a Browser</h4>

      &quot;VfB-Notes&quot; does not use cookies. It does, however, store some information
      locally in the browser used to execute this web application, as there are:

      <ul class="svelte-1tfx5dq"><li>stored permanently (until deletion):
          <ul class="svelte-1tfx5dq"><li>your EMail address</li></ul></li> 
        <li>stored during a single &quot;session&quot; only:
          <ul class="svelte-1tfx5dq"><li>your password (for automatic token refresh)</li> 
            <li>your current VoltCloud access token</li></ul></li></ul>

      A &quot;session&quot; belongs to a single browser window (or tab). It starts when
      you first navigate to &quot;VfB-Notes&quot; and ends when that browser window (or
      tab, resp.) is closed.
      <br/> <br/>
      Finishing a &quot;session&quot; automatically deletes any session-related data
      (i.e., access token and password)</div> 

    <div class="Block svelte-1tfx5dq"><h4>Data Privacy</h4>

      The developer of this application has insight into

      <ul class="svelte-1tfx5dq"><li>your account, which was created to use this application
          (including your EMail address, your first and last name and wether
          your account has been confirmed or not)
          <br/> <br/> 
          <i>The developer will never use this knowledge to send you unrequested
          messages nor will he disclose that information to other parties!</i> 
          <br/> <br/></li> 
        <li>the notes you create
          <br/> <br/> 
          <i>For that reason, &quot;VfB-Notes&quot; always encrypts your notes using your
          password. Please note: your notes will become unreadable if you
          change your password using the VoltCloud &quot;password reset&quot; mechanism!</i></li></ul>

      The developer does <b>not</b> know your password, nor is he able to
      decrypt the notes you create.</div> 

    <div class="Block svelte-1tfx5dq"><h4>Data Removal</h4>

      As soon as you delete your account, all information about you (including
      any notes you created) will immediately become inaccessible for the
      developer - and will eventually be removed from VoltCloud in the course
      of their processes.</div>`;

    			attr(div0, "class", "left Button svelte-1tfx5dq");
    			attr(div1, "class", "Title svelte-1tfx5dq");
    			attr(div2, "class", "NavigationBar svelte-1tfx5dq");
    			attr(div8, "class", "ContentArea svelte-1tfx5dq");
    			attr(div9, "class", "Page svelte-1tfx5dq");
    		},
    		m(target, anchor) {
    			insert(target, div9, anchor);
    			append(div9, div2);
    			append(div2, div0);
    			append(div2, t2);
    			append(div2, div1);
    			append(div9, t4);
    			append(div9, div8);

    			if (!mounted) {
    				dispose = listen(div0, "click", showInfo);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div9);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    function showInfo(Event) {
    	Event.preventDefault();
    	document.location.hash = '#/';
    }

    function instance$3($$self) {
    	return [];
    }

    class LegalPage extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});
    	}
    }

    var css_248z$2 = ".Page.svelte-13xmfjq.svelte-13xmfjq{display:flex;flex-flow:column nowrap;align-items:stretch;display:relative;width:100%;height:100%}.NavigationBar.svelte-13xmfjq.svelte-13xmfjq{display:flex;flex:0 0 auto;width:100%;height:44px;border:none;border-bottom:solid 1px black;font-size:18px;font-weight:bold}.NavigationBar.svelte-13xmfjq .Button.svelte-13xmfjq{display:inline-block;position:absolute;top:0px;width:auto;height:44px;line-height:44px;color:#0080FF;cursor:pointer}.NavigationBar.svelte-13xmfjq .left.Button.svelte-13xmfjq{left:10px;text-align:left }.NavigationBar.svelte-13xmfjq .right.Button.svelte-13xmfjq{right:10px;text-align:right }.NavigationBar.svelte-13xmfjq .Caret.svelte-13xmfjq{display:inline;position:relative;top:0px;font-size:22px;font-weight:bold}.NavigationBar.svelte-13xmfjq .Title.svelte-13xmfjq{display:block;position:absolute;width:100%;height:44px;text-align:center;line-height:44px;pointer-events:none}.ContentArea.svelte-13xmfjq.svelte-13xmfjq{display:block;flex:1 1 auto;overflow:auto}.ContentArea.svelte-13xmfjq .Block.svelte-13xmfjq{display:block;margin:20px;text-align:justify}";
    styleInject(css_248z$2,{"insertAt":"top"});

    /* src/InfoPage.svelte generated by Svelte v3.42.1 */

    function create_fragment$2(ctx) {
    	let div12;
    	let div3;
    	let div0;
    	let t1;
    	let div1;
    	let t3;
    	let div2;
    	let t6;
    	let div11;
    	let div4;
    	let t10;
    	let div5;
    	let t13;
    	let div6;
    	let t16;
    	let div7;
    	let t18;
    	let div8;
    	let t20;
    	let div9;
    	let t22;
    	let div10;
    	let t23;
    	let a3;
    	let t25;
    	let a4;
    	let t27;
    	let t28;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	return {
    		c() {
    			div12 = element("div");
    			div3 = element("div");
    			div0 = element("div");
    			div0.textContent = "Legal Info";
    			t1 = space();
    			div1 = element("div");
    			div1.textContent = "VfB-Notes";
    			t3 = space();
    			div2 = element("div");
    			div2.innerHTML = `Proceed <span class="Caret svelte-13xmfjq">⟩</span>`;
    			t6 = space();
    			div11 = element("div");
    			div4 = element("div");

    			div4.innerHTML = `&quot;VfB-Notes&quot; is a trivial demonstrator for the
      <a href="https://github.com/rozek/voltcloud-for-browsers">voltcloud-for-browsers</a>
      library.`;

    			t10 = space();
    			div5 = element("div");

    			div5.innerHTML = `<a href="https://voltcloud.io/">VoltCloud.io</a> is a simple (and
      reasonably priced) deployment server for web applications with integrated
      user management and key-value stores for both the application itself and
      any of its users.`;

    			t13 = space();
    			div6 = element("div");

    			div6.innerHTML = `<a href="https://github.com/rozek/voltcloud-for-browsers">voltcloud-for-browsers</a>
      is a simple client library for web applications which need access to
      VoltCloud and its functions.`;

    			t16 = space();
    			div7 = element("div");
    			div7.textContent = "This demonstrator implements all user management processes VoltCloud\n      offers - ranging from user registration, email confirmation, password\n      reset up to user login, account management and, last not least, account\n      deletion.";
    			t18 = space();
    			div8 = element("div");
    			div8.textContent = "The service this application provides is, on the other hand, rather\n      trivial: registered users will be able to edit a single page of online\n      text notes from their smartphones (or tablets, desktops or notebooks)";
    			t20 = space();
    			div9 = element("div");
    			div9.textContent = "This \"service\" is provided free of charge on a \"best-effort\" basis.";
    			t22 = space();
    			div10 = element("div");
    			t23 = text("Please, consider the ");
    			a3 = element("a");
    			a3.textContent = "Data Privacy\n      Statement";
    			t25 = text(" for this little application and VoltCloud's\n      ");
    			a4 = element("a");
    			a4.textContent = "Terms of Service";
    			t27 = text("\n      before applying for an account.");
    			t28 = space();
    			if (default_slot) default_slot.c();
    			attr(div0, "class", "left Button svelte-13xmfjq");
    			attr(div1, "class", "Title svelte-13xmfjq");
    			attr(div2, "class", "right Button svelte-13xmfjq");
    			attr(div3, "class", "NavigationBar svelte-13xmfjq");
    			attr(div4, "class", "Block svelte-13xmfjq");
    			attr(div5, "class", "Block svelte-13xmfjq");
    			attr(div6, "class", "Block svelte-13xmfjq");
    			attr(div7, "class", "Block svelte-13xmfjq");
    			attr(div8, "class", "Block svelte-13xmfjq");
    			attr(div9, "class", "Block svelte-13xmfjq");
    			attr(a3, "href", "#/");
    			attr(a4, "href", "https://www.appstudio.dev/app/legal/legal.php");
    			attr(div10, "class", "Block svelte-13xmfjq");
    			attr(div11, "class", "ContentArea svelte-13xmfjq");
    			attr(div12, "class", "Page svelte-13xmfjq");
    		},
    		m(target, anchor) {
    			insert(target, div12, anchor);
    			append(div12, div3);
    			append(div3, div0);
    			append(div3, t1);
    			append(div3, div1);
    			append(div3, t3);
    			append(div3, div2);
    			append(div12, t6);
    			append(div12, div11);
    			append(div11, div4);
    			append(div11, t10);
    			append(div11, div5);
    			append(div11, t13);
    			append(div11, div6);
    			append(div11, t16);
    			append(div11, div7);
    			append(div11, t18);
    			append(div11, div8);
    			append(div11, t20);
    			append(div11, div9);
    			append(div11, t22);
    			append(div11, div10);
    			append(div10, t23);
    			append(div10, a3);
    			append(div10, t25);
    			append(div10, a4);
    			append(div10, t27);
    			append(div12, t28);

    			if (default_slot) {
    				default_slot.m(div12, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen(div0, "click", showLegal),
    					listen(div2, "click", showLogin),
    					listen(a3, "click", showLegal)
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 1)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[0],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[0])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[0], dirty, null),
    						null
    					);
    				}
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div12);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function showLegal(Event) {
    	Event.preventDefault();
    	document.location.href = '#/Legal';
    }

    function showLogin(Event) {
    	Event.preventDefault();
    	Globals.define('State', 'Login');
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;

    	$$self.$$set = $$props => {
    		if ('$$scope' in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	return [$$scope, slots];
    }

    class InfoPage extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});
    	}
    }

    //----------------------------------------------------------------------------//
    //                            Svelte Viewport Info                            //
    //----------------------------------------------------------------------------//
    var MediaMatcher = (window.matchMedia ||
        // @ts-ignore
        window['webkitMatchmedia'] || window['mozMatchmedia'] || window['oMatchmedia']);
    function MediaQuery(query) {
        return (MediaMatcher != null) && MediaMatcher(query).matches;
    }
    function DocumentIsReady() {
        return ((document.readyState === 'interactive') ||
            (document.readyState === 'complete'));
    }
    /**** determineViewportSize ****/
    // Internet Explorer and MS/Edge are NOT supported
    var ViewportWidth = 0; // given in px, explicit initialization...
    var ViewportHeight = 0; // ...is needed to satisfy the compiler
    function determineViewportSize() {
        ViewportWidth = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
        ViewportHeight = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
    }
    // see https://stackoverflow.com/questions/1248081/get-the-browser-viewport-dimensions-with-javascript
    determineViewportSize();
    var ScreenOrientation = undefined;
    var detailledScreenOrientation = undefined;
    // explicit initialization is needed to satisfy compiler
    function determineScreenOrientation() {
        var Orientation;
        if ('orientation' in window.Screen) {
            Orientation = window.screen.orientation.type;
        }
        switch (Orientation) {
            case 'portrait-primary':
            case 'portrait-secondary':
                ScreenOrientation = 'portrait';
                detailledScreenOrientation = Orientation;
                break;
            case 'landscape-primary':
            case 'landscape-secondary':
                ScreenOrientation = 'landscape';
                detailledScreenOrientation = Orientation;
                break;
            default:
                switch (true) {
                    case MediaQuery('(orientation:portrait)'):
                        ScreenOrientation = 'portrait';
                        break;
                    case MediaQuery('(orientation:landscape)'):
                    case ViewportWidth > ViewportHeight:
                        ScreenOrientation = 'landscape';
                        break;
                    default: ScreenOrientation = 'portrait';
                }
                detailledScreenOrientation = undefined;
        }
        if (DocumentIsReady()) {
            document.body.classList.remove('Portrait', 'Landscape', 'Portrait-primary', 'Portrait-secondary', 'Landscape-primary', 'Landscape-secondary');
            switch (ScreenOrientation) {
                case 'portrait':
                    document.body.classList.add('Portrait');
                    break;
                case 'landscape':
                    document.body.classList.add('Landscape');
                    break;
            }
            if (detailledScreenOrientation != null) {
                var capitalized = function (Name) { return Name[0].toUpperCase() + Name.slice(1); };
                document.body.classList.add(capitalized(detailledScreenOrientation));
            }
        }
    }
    determineScreenOrientation();
    if (!DocumentIsReady()) {
        window.addEventListener('DOMContentLoaded', determineScreenOrientation);
    } // after document is loaded, classes will be applied as foreseen
    /**** handle problem that "orientationchange" is fired too soon ****/
    var oldViewportWidth = ViewportWidth;
    var oldViewportHeight = ViewportHeight;
    var oldScreenOrientation = ScreenOrientation;
    var oldDetailledScreenOrientation = detailledScreenOrientation;
    function rememberSettings() {
        oldViewportWidth = ViewportWidth;
        oldViewportHeight = ViewportHeight;
        oldScreenOrientation = ScreenOrientation;
        oldDetailledScreenOrientation = detailledScreenOrientation;
    }
    function submitEvents() {
        if (!DocumentIsReady()) {
            return;
        }
        if ((oldViewportWidth !== ViewportWidth) || (oldViewportHeight !== ViewportHeight)) {
            document.body.dispatchEvent(new Event('viewportchanged', { bubbles: true, cancelable: true }));
        }
        if ((oldScreenOrientation !== ScreenOrientation) ||
            (oldDetailledScreenOrientation !== detailledScreenOrientation)) {
            document.body.dispatchEvent(new Event('orientationchangeend', { bubbles: true, cancelable: true }));
        }
    }
    var Poller; // right now, it's difficult to determine the proper type
    var PollCounter = 0;
    var PollCounterLimit = 10; // i.e., stop polling after 1000ms
    function stopPolling() {
        clearInterval(Poller);
        Poller = undefined;
        PollCounter = 0;
    }
    function pollForViewportAfterOrientationChange() {
        Poller = setInterval(function () {
            determineViewportSize();
            if ( // no update of screen size yet? => continue polling
            (oldViewportWidth === ViewportWidth) &&
                (oldViewportHeight === ViewportHeight)) {
                PollCounter += 1;
                if (PollCounter <= PollCounterLimit) {
                    return;
                }
            } // nota bene: sometimes viewport does not change (e.g., in iframe)
            stopPolling();
            determineScreenOrientation(); // uses ViewportWidth/Height as fallback
            submitEvents();
            rememberSettings();
        }, 100);
    }
    /**** handler for "orientationchange" event ****/
    function determineViewportSizeAndScreenOrientation() {
        determineViewportSize();
        determineScreenOrientation(); // uses screen_width/height as final fallback
        if (Poller != null) { // we are still polling because of former event
            stopPolling();
            submitEvents();
            rememberSettings();
        }
        if ((oldViewportWidth === ViewportWidth) &&
            (oldViewportHeight === ViewportHeight)) { // screen size did not (yet) change => start polling for change
            pollForViewportAfterOrientationChange();
        }
        else { // viewport size changed in time => do not poll
            submitEvents();
            rememberSettings();
        }
    }
    // see https://github.com/gajus/orientationchangeend
    /**** update on changes ****/
    window.addEventListener('orientationchange', function () {
        setTimeout(determineViewportSizeAndScreenOrientation, 10);
    }); // seen on iOS 12: "orientationchange" fired before orientation is updated
    window.addEventListener('resize', determineViewportSizeAndScreenOrientation);
    if ('orientation' in screen) {
        screen.orientation.addEventListener('change', function () {
            setTimeout(determineViewportSizeAndScreenOrientation, 10);
        });
    }
    var svelteViewportInfo = {
        get Width() { return ViewportWidth; },
        get Height() { return ViewportHeight; },
        get Orientation() { return ScreenOrientation; },
        get detailledOrientation() { return detailledScreenOrientation; },
    };

    var css_248z$1 = ".ApplicationCell.svelte-1f9bnpb{display:block;position:absolute;overflow:hidden;width:320px;height:480px;margin:0px;padding:0px;border:solid 8px black;border-radius:20px;box-shadow:0px 0px 16px 0px rgba(0,0,0,0.5);background:white;font-family:'Source Sans Pro','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;font-weight:400;color:black;line-height:150%}.isFullScreen.svelte-1f9bnpb{border:none;border-radius:0px}";
    styleInject(css_248z$1,{"insertAt":"top"});

    /* src/ApplicationCell.svelte generated by Svelte v3.42.1 */

    function create_fragment$1(ctx) {
    	let t;
    	let div;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[7].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[6], null);

    	return {
    		c() {
    			t = space();
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr(div, "class", "ApplicationCell svelte-1f9bnpb");
    			set_style(div, "left", /*CellX*/ ctx[0] + "px");
    			set_style(div, "top", /*CellY*/ ctx[2] + "px");
    			set_style(div, "width", /*CellWidth*/ ctx[1] + "px");
    			set_style(div, "height", /*CellHeight*/ ctx[3] + "px");
    			toggle_class(div, "isFullScreen", /*isFullScreen*/ ctx[4]);
    		},
    		m(target, anchor) {
    			insert(target, t, anchor);
    			insert(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen(document.body, "viewportchanged", /*resizeApplicationCell*/ ctx[5]),
    					listen(document.body, "orientationchangeend", /*resizeApplicationCell*/ ctx[5])
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 64)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[6],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[6])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[6], dirty, null),
    						null
    					);
    				}
    			}

    			if (!current || dirty & /*CellX*/ 1) {
    				set_style(div, "left", /*CellX*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*CellY*/ 4) {
    				set_style(div, "top", /*CellY*/ ctx[2] + "px");
    			}

    			if (!current || dirty & /*CellWidth*/ 2) {
    				set_style(div, "width", /*CellWidth*/ ctx[1] + "px");
    			}

    			if (!current || dirty & /*CellHeight*/ 8) {
    				set_style(div, "height", /*CellHeight*/ ctx[3] + "px");
    			}

    			if (dirty & /*isFullScreen*/ 16) {
    				toggle_class(div, "isFullScreen", /*isFullScreen*/ ctx[4]);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(t);
    			if (detaching) detach(div);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	let CellX = 0, CellWidth = 320;
    	let CellY = 0, CellHeight = 480;
    	let isFullScreen = false;

    	function resizeApplicationCell() {
    		let ViewportWidth = svelteViewportInfo.Width;
    		let ViewportHeight = svelteViewportInfo.Height;
    		$$invalidate(1, CellWidth = constrained(ViewportWidth, 320, 480));
    		$$invalidate(3, CellHeight = constrained(ViewportHeight, 480, 896));
    		$$invalidate(0, CellX = Math.max(0, (ViewportWidth - CellWidth) / 2));
    		$$invalidate(2, CellY = Math.max(0, (ViewportHeight - CellHeight) / 2));
    		$$invalidate(4, isFullScreen = ViewportWidth >= 320 && ViewportWidth <= 480 && ViewportHeight >= 480 && ViewportHeight <= 896);
    	}

    	resizeApplicationCell();

    	$$self.$$set = $$props => {
    		if ('$$scope' in $$props) $$invalidate(6, $$scope = $$props.$$scope);
    	};

    	return [
    		CellX,
    		CellWidth,
    		CellY,
    		CellHeight,
    		isFullScreen,
    		resizeApplicationCell,
    		$$scope,
    		slots
    	];
    }

    class ApplicationCell extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});
    	}
    }

    var css_248z = "*{-moz-box-sizing:border-box;-webkit-box-sizing:border-box;box-sizing:border-box}";
    styleInject(css_248z,{"insertAt":"top"});

    /* src/App.svelte generated by Svelte v3.42.1 */

    function create_else_block(ctx) {
    	let infopage;
    	let current;

    	infopage = new InfoPage({
    			props: {
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			}
    		});

    	return {
    		c() {
    			create_component(infopage.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(infopage, target, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const infopage_changes = {};

    			if (dirty & /*$$scope, $Globals*/ 10) {
    				infopage_changes.$$scope = { dirty, ctx };
    			}

    			infopage.$set(infopage_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(infopage.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(infopage.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(infopage, detaching);
    		}
    	};
    }

    // (48:4) {#if SubPath === '#/Legal'}
    function create_if_block_1(ctx) {
    	let legalpage;
    	let current;
    	legalpage = new LegalPage({});

    	return {
    		c() {
    			create_component(legalpage.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(legalpage, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i(local) {
    			if (current) return;
    			transition_in(legalpage.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(legalpage.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(legalpage, detaching);
    		}
    	};
    }

    // (44:2) {#if $Globals.loggedIn}
    function create_if_block(ctx) {
    	let notepage;
    	let current;
    	notepage = new NotePage({});

    	return {
    		c() {
    			create_component(notepage.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(notepage, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i(local) {
    			if (current) return;
    			transition_in(notepage.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(notepage.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(notepage, detaching);
    		}
    	};
    }

    // (52:8) {#if $Globals.State === 'Login'}
    function create_if_block_7(ctx) {
    	let overlay;
    	let current;

    	overlay = new Overlay({
    			props: {
    				$$slots: { default: [create_default_slot_7] },
    				$$scope: { ctx }
    			}
    		});

    	return {
    		c() {
    			create_component(overlay.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(overlay, target, anchor);
    			current = true;
    		},
    		i(local) {
    			if (current) return;
    			transition_in(overlay.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(overlay.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(overlay, detaching);
    		}
    	};
    }

    // (52:49) <Overlay>
    function create_default_slot_7(ctx) {
    	let logindialog;
    	let current;
    	logindialog = new LoginDialog({});

    	return {
    		c() {
    			create_component(logindialog.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(logindialog, target, anchor);
    			current = true;
    		},
    		i(local) {
    			if (current) return;
    			transition_in(logindialog.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(logindialog.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(logindialog, detaching);
    		}
    	};
    }

    // (53:8) {#if $Globals.State === 'loggingIn'}
    function create_if_block_6(ctx) {
    	let overlay;
    	let current;

    	overlay = new Overlay({
    			props: {
    				$$slots: { default: [create_default_slot_6] },
    				$$scope: { ctx }
    			}
    		});

    	return {
    		c() {
    			create_component(overlay.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(overlay, target, anchor);
    			current = true;
    		},
    		i(local) {
    			if (current) return;
    			transition_in(overlay.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(overlay.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(overlay, detaching);
    		}
    	};
    }

    // (53:49) <Overlay>
    function create_default_slot_6(ctx) {
    	let loggingindisplay;
    	let current;
    	loggingindisplay = new LoggingInDisplay({});

    	return {
    		c() {
    			create_component(loggingindisplay.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(loggingindisplay, target, anchor);
    			current = true;
    		},
    		i(local) {
    			if (current) return;
    			transition_in(loggingindisplay.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(loggingindisplay.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(loggingindisplay, detaching);
    		}
    	};
    }

    // (54:8) {#if $Globals.State === 'LoginFailure'}
    function create_if_block_5(ctx) {
    	let overlay;
    	let current;

    	overlay = new Overlay({
    			props: {
    				$$slots: { default: [create_default_slot_5] },
    				$$scope: { ctx }
    			}
    		});

    	return {
    		c() {
    			create_component(overlay.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(overlay, target, anchor);
    			current = true;
    		},
    		i(local) {
    			if (current) return;
    			transition_in(overlay.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(overlay.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(overlay, detaching);
    		}
    	};
    }

    // (54:49) <Overlay>
    function create_default_slot_5(ctx) {
    	let loginfailuredisplay;
    	let current;
    	loginfailuredisplay = new LoginFailureDisplay({});

    	return {
    		c() {
    			create_component(loginfailuredisplay.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(loginfailuredisplay, target, anchor);
    			current = true;
    		},
    		i(local) {
    			if (current) return;
    			transition_in(loginfailuredisplay.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(loginfailuredisplay.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(loginfailuredisplay, detaching);
    		}
    	};
    }

    // (55:8) {#if $Globals.State === 'ResetRequest'}
    function create_if_block_4(ctx) {
    	let overlay;
    	let current;

    	overlay = new Overlay({
    			props: {
    				$$slots: { default: [create_default_slot_4] },
    				$$scope: { ctx }
    			}
    		});

    	return {
    		c() {
    			create_component(overlay.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(overlay, target, anchor);
    			current = true;
    		},
    		i(local) {
    			if (current) return;
    			transition_in(overlay.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(overlay.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(overlay, detaching);
    		}
    	};
    }

    // (55:49) <Overlay>
    function create_default_slot_4(ctx) {
    	let resetrequestdialog;
    	let current;
    	resetrequestdialog = new ResetRequestDialog({});

    	return {
    		c() {
    			create_component(resetrequestdialog.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(resetrequestdialog, target, anchor);
    			current = true;
    		},
    		i(local) {
    			if (current) return;
    			transition_in(resetrequestdialog.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(resetrequestdialog.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(resetrequestdialog, detaching);
    		}
    	};
    }

    // (56:8) {#if $Globals.State === 'ResetRequested'}
    function create_if_block_3(ctx) {
    	let overlay;
    	let current;

    	overlay = new Overlay({
    			props: {
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			}
    		});

    	return {
    		c() {
    			create_component(overlay.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(overlay, target, anchor);
    			current = true;
    		},
    		i(local) {
    			if (current) return;
    			transition_in(overlay.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(overlay.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(overlay, detaching);
    		}
    	};
    }

    // (56:49) <Overlay>
    function create_default_slot_3(ctx) {
    	let resetrequestsuccessdisplay;
    	let current;
    	resetrequestsuccessdisplay = new ResetRequestSuccessDisplay({});

    	return {
    		c() {
    			create_component(resetrequestsuccessdisplay.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(resetrequestsuccessdisplay, target, anchor);
    			current = true;
    		},
    		i(local) {
    			if (current) return;
    			transition_in(resetrequestsuccessdisplay.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(resetrequestsuccessdisplay.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(resetrequestsuccessdisplay, detaching);
    		}
    	};
    }

    // (57:8) {#if $Globals.State === 'CommunicationFailure'}
    function create_if_block_2(ctx) {
    	let overlay;
    	let current;

    	overlay = new Overlay({
    			props: {
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			}
    		});

    	return {
    		c() {
    			create_component(overlay.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(overlay, target, anchor);
    			current = true;
    		},
    		i(local) {
    			if (current) return;
    			transition_in(overlay.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(overlay.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(overlay, detaching);
    		}
    	};
    }

    // (57:55) <Overlay>
    function create_default_slot_2(ctx) {
    	let communicationfailuredisplay;
    	let current;
    	communicationfailuredisplay = new CommunicationFailureDisplay({});

    	return {
    		c() {
    			create_component(communicationfailuredisplay.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(communicationfailuredisplay, target, anchor);
    			current = true;
    		},
    		i(local) {
    			if (current) return;
    			transition_in(communicationfailuredisplay.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(communicationfailuredisplay.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(communicationfailuredisplay, detaching);
    		}
    	};
    }

    // (51:6) <InfoPage>
    function create_default_slot_1(ctx) {
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let t4;
    	let if_block5_anchor;
    	let current;
    	let if_block0 = /*$Globals*/ ctx[1].State === 'Login' && create_if_block_7(ctx);
    	let if_block1 = /*$Globals*/ ctx[1].State === 'loggingIn' && create_if_block_6(ctx);
    	let if_block2 = /*$Globals*/ ctx[1].State === 'LoginFailure' && create_if_block_5(ctx);
    	let if_block3 = /*$Globals*/ ctx[1].State === 'ResetRequest' && create_if_block_4(ctx);
    	let if_block4 = /*$Globals*/ ctx[1].State === 'ResetRequested' && create_if_block_3(ctx);
    	let if_block5 = /*$Globals*/ ctx[1].State === 'CommunicationFailure' && create_if_block_2(ctx);

    	return {
    		c() {
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			if (if_block2) if_block2.c();
    			t2 = space();
    			if (if_block3) if_block3.c();
    			t3 = space();
    			if (if_block4) if_block4.c();
    			t4 = space();
    			if (if_block5) if_block5.c();
    			if_block5_anchor = empty();
    		},
    		m(target, anchor) {
    			if (if_block0) if_block0.m(target, anchor);
    			insert(target, t0, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert(target, t1, anchor);
    			if (if_block2) if_block2.m(target, anchor);
    			insert(target, t2, anchor);
    			if (if_block3) if_block3.m(target, anchor);
    			insert(target, t3, anchor);
    			if (if_block4) if_block4.m(target, anchor);
    			insert(target, t4, anchor);
    			if (if_block5) if_block5.m(target, anchor);
    			insert(target, if_block5_anchor, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			if (/*$Globals*/ ctx[1].State === 'Login') {
    				if (if_block0) {
    					if (dirty & /*$Globals*/ 2) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_7(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(t0.parentNode, t0);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*$Globals*/ ctx[1].State === 'loggingIn') {
    				if (if_block1) {
    					if (dirty & /*$Globals*/ 2) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_6(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(t1.parentNode, t1);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (/*$Globals*/ ctx[1].State === 'LoginFailure') {
    				if (if_block2) {
    					if (dirty & /*$Globals*/ 2) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_5(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(t2.parentNode, t2);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}

    			if (/*$Globals*/ ctx[1].State === 'ResetRequest') {
    				if (if_block3) {
    					if (dirty & /*$Globals*/ 2) {
    						transition_in(if_block3, 1);
    					}
    				} else {
    					if_block3 = create_if_block_4(ctx);
    					if_block3.c();
    					transition_in(if_block3, 1);
    					if_block3.m(t3.parentNode, t3);
    				}
    			} else if (if_block3) {
    				group_outros();

    				transition_out(if_block3, 1, 1, () => {
    					if_block3 = null;
    				});

    				check_outros();
    			}

    			if (/*$Globals*/ ctx[1].State === 'ResetRequested') {
    				if (if_block4) {
    					if (dirty & /*$Globals*/ 2) {
    						transition_in(if_block4, 1);
    					}
    				} else {
    					if_block4 = create_if_block_3(ctx);
    					if_block4.c();
    					transition_in(if_block4, 1);
    					if_block4.m(t4.parentNode, t4);
    				}
    			} else if (if_block4) {
    				group_outros();

    				transition_out(if_block4, 1, 1, () => {
    					if_block4 = null;
    				});

    				check_outros();
    			}

    			if (/*$Globals*/ ctx[1].State === 'CommunicationFailure') {
    				if (if_block5) {
    					if (dirty & /*$Globals*/ 2) {
    						transition_in(if_block5, 1);
    					}
    				} else {
    					if_block5 = create_if_block_2(ctx);
    					if_block5.c();
    					transition_in(if_block5, 1);
    					if_block5.m(if_block5_anchor.parentNode, if_block5_anchor);
    				}
    			} else if (if_block5) {
    				group_outros();

    				transition_out(if_block5, 1, 1, () => {
    					if_block5 = null;
    				});

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(if_block2);
    			transition_in(if_block3);
    			transition_in(if_block4);
    			transition_in(if_block5);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(if_block2);
    			transition_out(if_block3);
    			transition_out(if_block4);
    			transition_out(if_block5);
    			current = false;
    		},
    		d(detaching) {
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach(t0);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach(t1);
    			if (if_block2) if_block2.d(detaching);
    			if (detaching) detach(t2);
    			if (if_block3) if_block3.d(detaching);
    			if (detaching) detach(t3);
    			if (if_block4) if_block4.d(detaching);
    			if (detaching) detach(t4);
    			if (if_block5) if_block5.d(detaching);
    			if (detaching) detach(if_block5_anchor);
    		}
    	};
    }

    // (43:0) <ApplicationCell>
    function create_default_slot(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block, create_if_block_1, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*$Globals*/ ctx[1].loggedIn) return 0;
    		if (/*SubPath*/ ctx[0] === '#/Legal') return 1;
    		return 2;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	return {
    		c() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    function create_fragment(ctx) {
    	let applicationcell;
    	let current;

    	applicationcell = new ApplicationCell({
    			props: {
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			}
    		});

    	return {
    		c() {
    			create_component(applicationcell.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(applicationcell, target, anchor);
    			current = true;
    		},
    		p(ctx, [dirty]) {
    			const applicationcell_changes = {};

    			if (dirty & /*$$scope, $Globals, SubPath*/ 11) {
    				applicationcell_changes.$$scope = { dirty, ctx };
    			}

    			applicationcell.$set(applicationcell_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(applicationcell.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(applicationcell.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(applicationcell, detaching);
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	let $Globals;
    	component_subscribe($$self, Globals, $$value => $$invalidate(1, $Globals = $$value));
    	let completeURL = document.location.href;

    	switch (true) {
    		case completeURL.indexOf('/#/confirm/') > 0:
    			Globals.define('ConfirmationToken', completeURL.replace(/^.*\/\#\/confirm\//, ''));
    			break;
    		case completeURL.indexOf('/#/reset/') > 0:
    			Globals.define('ResetToken', completeURL.replace(/^.*\/\#\/reset\//, ''));
    	}

    	switch (true) {
    		case $Globals.ConfirmationToken !== '':
    			Globals.define('State', 'UserConfirmation');
    			break;
    		case $Globals.ConfirmationToken !== '':
    			Globals.define('State', 'PasswordReset');
    			break;
    	}

    	let SubPath = document.location.hash;

    	window.addEventListener('hashchange', () => {
    		$$invalidate(0, SubPath = document.location.hash);
    	});

    	Globals.define('State', 'ResetRequest');
    	return [SubPath, $Globals];
    }

    class App extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance, create_fragment, safe_not_equal, {});
    	}
    }

    var application = new App({
        target: document.body
    });

    return application;

}());
//# sourceMappingURL=index.js.map
