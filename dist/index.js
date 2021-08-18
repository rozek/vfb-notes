
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
        firstName:         '',
        lastName:          '',
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

    var css_248z$C = ".Dialog.svelte-1ogkcjw.svelte-1ogkcjw.svelte-1ogkcjw{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-1ogkcjw a.svelte-1ogkcjw.svelte-1ogkcjw,.Dialog.svelte-1ogkcjw a.svelte-1ogkcjw.svelte-1ogkcjw:visited{color:#2980B9;text-decoration:underline}.Dialog.svelte-1ogkcjw>div.svelte-1ogkcjw.svelte-1ogkcjw{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-1ogkcjw>div.svelte-1ogkcjw>[name=\"Title\"].svelte-1ogkcjw{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}.Dialog.svelte-1ogkcjw>div.svelte-1ogkcjw>.Block.svelte-1ogkcjw{display:block;margin:0px 0px 10px 0px;text-align:justify}.Dialog.svelte-1ogkcjw>div.svelte-1ogkcjw>button.svelte-1ogkcjw{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:6px;background-color:#2980B9;border:none;border-radius:4px;font-size:16px;font-weight:bold;color:white;cursor:pointer}.Dialog.svelte-1ogkcjw>div.svelte-1ogkcjw>button.svelte-1ogkcjw:disabled{opacity:0.3;cursor:auto}";
    styleInject(css_248z$C,{"insertAt":"top"});

    /* src/CommunicationFailureNotice.svelte generated by Svelte v3.42.1 */

    function create_fragment$D(ctx) {
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

    			div1.innerHTML = `Network communication with <a href="https://voltcloud.io/" class="svelte-1ogkcjw">VoltCloud.io</a>
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
    			attr(div0, "class", "svelte-1ogkcjw");
    			attr(div1, "class", "Block svelte-1ogkcjw");
    			attr(div2, "class", "Block svelte-1ogkcjw");
    			set_style(div2, "margin", "0px 10px 10px 10px");
    			set_style(div2, "font-size", "12px");
    			set_style(div2, "font-style", "italic");
    			set_style(div2, "color", "red\n    ");
    			attr(div3, "class", "Block svelte-1ogkcjw");
    			attr(button, "class", "svelte-1ogkcjw");
    			attr(div4, "class", "svelte-1ogkcjw");
    			attr(div5, "class", "Dialog svelte-1ogkcjw");
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

    function instance$t($$self, $$props, $$invalidate) {
    	let $Globals;
    	component_subscribe($$self, Globals, $$value => $$invalidate(0, $Globals = $$value));
    	return [$Globals];
    }

    class CommunicationFailureNotice extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$t, create_fragment$D, safe_not_equal, {});
    	}
    }

    var css_248z$B = ".Dialog.svelte-16jefj2.svelte-16jefj2.svelte-16jefj2{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-16jefj2>div.svelte-16jefj2.svelte-16jefj2{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-16jefj2>div.svelte-16jefj2>[name=\"Title\"].svelte-16jefj2{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}.Dialog.svelte-16jefj2>div.svelte-16jefj2>.Block.svelte-16jefj2{display:block;margin:0px 0px 10px 0px;text-align:justify}.Dialog.svelte-16jefj2>div.svelte-16jefj2>button.svelte-16jefj2{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:6px;background-color:#2980B9;border:none;border-radius:4px;font-size:16px;font-weight:bold;color:white;cursor:pointer}.Dialog.svelte-16jefj2>div.svelte-16jefj2>button.svelte-16jefj2:disabled{opacity:0.3;cursor:auto}";
    styleInject(css_248z$B,{"insertAt":"top"});

    /* src/UnregisteredNotice.svelte generated by Svelte v3.42.1 */

    function create_fragment$C(ctx) {
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
    			div0.textContent = "Account Deleted";
    			t1 = space();
    			div1 = element("div");
    			div1.textContent = "Your account was successfully deleted.";
    			t3 = space();
    			div2 = element("div");
    			div2.textContent = "If you want to use this application again, you will have to register anew.";
    			t5 = space();
    			button = element("button");
    			button.textContent = "Ok";
    			attr(div0, "name", "Title");
    			attr(div0, "class", "svelte-16jefj2");
    			attr(div1, "class", "Block svelte-16jefj2");
    			attr(div2, "class", "Block svelte-16jefj2");
    			attr(button, "class", "svelte-16jefj2");
    			attr(div3, "class", "svelte-16jefj2");
    			attr(div4, "class", "Dialog svelte-16jefj2");
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
    				dispose = listen(button, "click", closeNotice$b);
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

    function closeNotice$b(Event) {
    	Event.preventDefault();
    	Globals.define('State', 'Registration');
    }

    function instance$s($$self) {
    	return [];
    }

    class UnregisteredNotice extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$s, create_fragment$C, safe_not_equal, {});
    	}
    }

    var css_248z$A = ".Dialog.svelte-cmrmc8.svelte-cmrmc8.svelte-cmrmc8{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-cmrmc8>div.svelte-cmrmc8.svelte-cmrmc8{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-cmrmc8>div.svelte-cmrmc8>[name=\"Title\"].svelte-cmrmc8{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}";
    styleInject(css_248z$A,{"insertAt":"top"});

    /* src/UnregistrationNotice.svelte generated by Svelte v3.42.1 */

    function create_fragment$B(ctx) {
    	let div2;

    	return {
    		c() {
    			div2 = element("div");
    			div2.innerHTML = `<div class="svelte-cmrmc8"><div name="Title" class="svelte-cmrmc8">Account is being deleted...</div></div>`;
    			attr(div2, "class", "Dialog svelte-cmrmc8");
    		},
    		m(target, anchor) {
    			insert(target, div2, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div2);
    		}
    	};
    }

    class UnregistrationNotice extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, null, create_fragment$B, safe_not_equal, {});
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
    /**** ValueIsPlainObject ****/
    function ValueIsPlainObject(Value) {
        return ((Value != null) && (typeof Value === 'object') &&
            (Object.getPrototypeOf(Value) === Object.prototype));
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
    var expectPlainObject = /*#__PURE__*/ ValidatorForClassifier(ValueIsPlainObject, rejectNil, '"plain" JavaScript object');
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
    var maxNamePartLength = 255; // dto.
    var maxStorageKeyLength = 255; // as mentioned in REST API docs
    var maxStorageValueLength = 1048574; // see discussion forum
    /**** internal constants and variables ****/
    var Timeout = 30 * 1000; // request timeout given in ms
    var activeDeveloperId;
    var activeDeveloperAddress;
    var activeDeveloperPassword; // stored for token refresh
    var activeCustomerId;
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
    /**** focusOnNewCustomer ****/
    function focusOnNewCustomer(EMailAddress, Password) {
        return __awaiter(this, void 0, void 0, function () {
            var Response, Signal_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        expectEMailAddress('VoltCloud customer email address', EMailAddress);
                        expectPassword('VoltCloud customer password', Password);
                        assertApplicationFocus();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, ResponseOf('public', 'POST', '{{application_url}}/api/auth/register', null, {
                                email: EMailAddress,
                                password: Password,
                                confirmation: Password,
                                scope: currentApplicationId
                            })];
                    case 2:
                        Response = _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        Signal_3 = _a.sent();
                        switch (Signal_3.HTTPStatus) {
                            case 404:
                                switch (Signal_3.message) {
                                    case 'Could not route your request.':
                                    case 'App not found.':
                                        throwError('NoSuchApplication: could not find the given application');
                                }
                                break;
                            case 422: switch (Signal_3.message) {
                                case 'Could not decode scope.':
                                    throwError('InvalidArgument: invalid application id given');
                            }
                            default: throw Signal_3;
                        }
                        return [3 /*break*/, 4];
                    case 4:
                        if ((Response != null) && ValueIsString(Response.id)) {
                            currentCustomerId = Response.id;
                        }
                        else {
                            throwError('InternalError: could not analyze response for registration request');
                        }
                        return [2 /*return*/];
                }
            });
        });
    }
    /**** resendConfirmationEMailToCustomer ****/
    function resendConfirmationEMailToCustomer(EMailAddress) {
        return __awaiter(this, void 0, void 0, function () {
            var Signal_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        expectEMailAddress('VoltCloud customer email address', EMailAddress);
                        assertApplicationFocus();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, ResponseOf('public', 'POST', '{{application_url}}/api/auth/resend', null, {
                                email: EMailAddress,
                                scope: currentApplicationId
                            })];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        Signal_4 = _a.sent();
                        switch (Signal_4.HTTPStatus) {
                            case 422: switch (Signal_4.message) {
                                case 'Could not decode scope.':
                                    throwError('InvalidArgument: invalid application id given');
                            }
                            default: throw Signal_4;
                        }
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
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
    /**** resetCustomerPasswordUsing ****/
    function resetCustomerPasswordUsing(Token, Password) {
        return __awaiter(this, void 0, void 0, function () {
            var Signal_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        expectNonEmptyString('VoltCloud password reset token', Token);
                        expectPassword('VoltCloud customer password', Password);
                        assertApplicationFocus();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, ResponseOf('public', 'POST', '{{application_url}}/api/auth/reset', null, {
                                token: Token,
                                password: Password,
                                confirmation: Password
                            })];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        Signal_7 = _a.sent();
                        switch (Signal_7.HTTPStatus) {
                            case 401: throwError('BadToken: the given token can not be recognized');
                            default: throw Signal_7;
                        }
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    }
    /**** changeCustomerEMailAddressTo ****/
    function changeCustomerEMailAddressTo(EMailAddress) {
        return __awaiter(this, void 0, void 0, function () {
            var Response, Signal_9;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        expectEMailAddress('VoltCloud customer email address', EMailAddress);
                        assertCustomerMandate();
                        assertApplicationFocus();
                        assertCustomerFocus();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, ResponseOf('private', 'PUT', '{{application_url}}/api/user/{{customer_id}}', null, {
                                email: EMailAddress
                            })];
                    case 2:
                        Response = _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        Signal_9 = _a.sent();
                        switch (Signal_9.HTTPStatus) {
                            case 404: throwError('NoSuchUser: the given customer does not exist');
                            case 409: throwError('UserExists: the given EMail address is already in use');
                            case 422: switch (Signal_9.message) {
                                case 'Could not decode scope.':
                                    throwError('InvalidArgument: invalid customer id given');
                            }
                            default: throw Signal_9;
                        }
                        return [3 /*break*/, 4];
                    case 4:
                        if ((Response != null) && (Response.id === currentCustomerId)) {
                            if (currentCustomerId === activeCustomerId) {
                                activeCustomerAddress = Response.email; // might have changed
                            }
                        }
                        else {
                            throwError('InternalError: could not analyze response for registration request');
                        }
                        return [2 /*return*/];
                }
            });
        });
    }
    /**** changeCustomerPasswordTo ****/
    function changeCustomerPasswordTo(Password) {
        return __awaiter(this, void 0, void 0, function () {
            var Response, Signal_10;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        expectPassword('VoltCloud customer password', Password);
                        assertCustomerMandate();
                        assertApplicationFocus();
                        assertCustomerFocus();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, ResponseOf('private', 'PUT', '{{application_url}}/api/user/{{customer_id}}', null, {
                                password: {
                                    old: activeCustomerPassword,
                                    new: Password,
                                    confirmation: Password
                                }
                            })];
                    case 2:
                        Response = _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        Signal_10 = _a.sent();
                        switch (Signal_10.HTTPStatus) {
                            case 403: throwError('ForbiddenOperation: wrong current password given');
                            case 404: throwError('NoSuchUser: the given customer does not exist');
                            case 422: switch (Signal_10.message) {
                                case 'Could not decode scope.':
                                    throwError('InvalidArgument: invalid customer id given');
                            }
                            default: throw Signal_10;
                        }
                        return [3 /*break*/, 4];
                    case 4:
                        if ((Response != null) && (Response.id === currentCustomerId)) {
                            if (currentCustomerId === activeCustomerId) {
                                activeCustomerPassword = Password;
                            }
                        }
                        else {
                            throwError('InternalError: could not analyze response for registration request');
                        }
                        return [2 /*return*/];
                }
            });
        });
    }
    /**** updateCustomerRecordBy ****/
    function updateCustomerRecordBy(Settings) {
        return __awaiter(this, void 0, void 0, function () {
            var Response, Signal_11;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        expectPlainObject('VoltCloud customer settings', Settings);
                        assertCustomerMandate();
                        assertApplicationFocus();
                        assertCustomerFocus();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, ResponseOf('private', 'PUT', '{{application_url}}/api/user/{{customer_id}}', null, Settings)];
                    case 2:
                        Response = _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        Signal_11 = _a.sent();
                        switch (Signal_11.HTTPStatus) {
                            case 403: throwError('ForbiddenOperation: wrong current password given');
                            case 404: throwError('NoSuchUser: the given customer does not exist');
                            case 409: throwError('UserExists: the given EMail address is already in use');
                            case 422: switch (Signal_11.message) {
                                case 'Could not decode scope.':
                                    throwError('InvalidArgument: invalid customer id given');
                            }
                            default: throw Signal_11;
                        }
                        return [3 /*break*/, 4];
                    case 4:
                        if ((Response != null) && (Response.id === currentCustomerId)) {
                            if (currentCustomerId === activeCustomerId) {
                                activeCustomerAddress = Response.email; // might have changed
                                if (Settings.password != null) {
                                    activeCustomerPassword = Settings.password.new;
                                }
                            }
                        }
                        else {
                            throwError('InternalError: could not analyze response for registration request');
                        }
                        return [2 /*return*/];
                }
            });
        });
    }
    /**** deleteCustomer ****/
    function deleteCustomer() {
        return __awaiter(this, void 0, void 0, function () {
            var Signal_12;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        assertDeveloperOrCustomerMandate();
                        assertApplicationFocus();
                        assertCustomerFocus();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, ResponseOf('private', 'DELETE', '{{application_url}}/api/user/{{customer_id}}')];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        Signal_12 = _a.sent();
                        switch (Signal_12.HTTPStatus) {
                            case 404:
                                switch (Signal_12.message) {
                                    case 'User not found.': return [2 /*return*/];
                                }
                                break;
                            case 422: switch (Signal_12.message) {
                                case 'Could not decode scope.':
                                    throwError('InvalidArgument: invalid user id given');
                            }
                            default: throw Signal_12;
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
    /**** assertCustomerMandate ****/
    function assertCustomerMandate() {
        if (activeCustomerId == null)
            throwError('InvalidState: please mandate a specific VoltCloud customer first');
    }
    /**** assertDeveloperOrCustomerMandate ****/
    function assertDeveloperOrCustomerMandate() {
        if ((activeDeveloperId == null) && (activeCustomerId == null))
            throwError('InvalidState: please mandate a specific VoltCloud developer or customer first');
    }
    /**** assertApplicationFocus ****/
    function assertApplicationFocus() {
        if (currentApplicationURL == null)
            throwError('InvalidState: please focus on a specific VoltCloud application first');
    }
    /**** assertCustomerFocus ****/
    function assertCustomerFocus() {
        if (currentCustomerId == null)
            throwError('InvalidState: please focus on a specific VoltCloud application customer first');
    }
    /**** loginDeveloper ****/
    function loginDeveloper(EMailAddress, Password, firstAttempt) {
        if (firstAttempt === void 0) { firstAttempt = true; }
        return __awaiter(this, void 0, void 0, function () {
            var Response, Signal_18;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        activeDeveloperId = undefined; // avoid re-try after failure
                        activeDeveloperAddress = undefined; // dto.
                        activeDeveloperPassword = undefined; // dto.
                        activeCustomerId = undefined; // clear customer mandate
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
                            activeDeveloperId = Response.user_id;
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
                        activeCustomerId = undefined; // avoid re-try after failure
                        activeCustomerAddress = undefined; // dto.
                        activeCustomerPassword = undefined; // dto.
                        activeDeveloperId = undefined; // clear developer mandate
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
                            activeCustomerId = Response.user_id;
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

    var css_248z$z = ".Dialog.svelte-28kowe.svelte-28kowe.svelte-28kowe{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-28kowe>div.svelte-28kowe.svelte-28kowe{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-28kowe>div.svelte-28kowe>[name=\"Title\"].svelte-28kowe{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}.Dialog.svelte-28kowe>div.svelte-28kowe>[name=\"CloseButton\"].svelte-28kowe{display:block;position:absolute;top:-20px;right:-20px;width:20px;height:20px;border:solid 2px white;border-radius:50%;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2), 0px 0px 0px 1px lightgray;background-color:black;padding:0px;font-size:18px;font-weight:bold;line-height:12px;text-align:center;color:white;cursor:pointer}.Dialog.svelte-28kowe>div.svelte-28kowe>.Block.svelte-28kowe{display:block;margin:0px 0px 10px 0px;text-align:justify}.Dialog.svelte-28kowe>div.svelte-28kowe>button.svelte-28kowe{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:6px;background-color:#2980B9;border:none;border-radius:4px;font-size:16px;font-weight:bold;color:white;cursor:pointer}.Dialog.svelte-28kowe>div.svelte-28kowe>button.svelte-28kowe:disabled{opacity:0.3;cursor:auto}";
    styleInject(css_248z$z,{"insertAt":"top"});

    /* src/UnregistrationDialog.svelte generated by Svelte v3.42.1 */

    function create_fragment$A(ctx) {
    	let div7;
    	let div6;
    	let div0;
    	let t1;
    	let div1;
    	let t3;
    	let div2;
    	let t5;
    	let div3;
    	let t7;
    	let div4;
    	let t9;
    	let div5;
    	let input;
    	let t10;
    	let t11;
    	let button;
    	let t12;
    	let button_disabled_value;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			div7 = element("div");
    			div6 = element("div");
    			div0 = element("div");
    			div0.textContent = "Account Deletion";
    			t1 = space();
    			div1 = element("div");
    			div1.textContent = "×";
    			t3 = space();
    			div2 = element("div");
    			div2.textContent = "You are about to delete your account.";
    			t5 = space();
    			div3 = element("div");
    			div3.textContent = "This operation will also delete your notes and can not be reverted!";
    			t7 = space();
    			div4 = element("div");
    			div4.textContent = "Please check the following statement if you really want to proceed.";
    			t9 = space();
    			div5 = element("div");
    			input = element("input");
    			t10 = text("\n      I accept loosing all my data");
    			t11 = space();
    			button = element("button");
    			t12 = text("Delete Account");
    			attr(div0, "name", "Title");
    			attr(div0, "class", "svelte-28kowe");
    			attr(div1, "name", "CloseButton");
    			attr(div1, "class", "svelte-28kowe");
    			attr(div2, "class", "Block svelte-28kowe");
    			attr(div3, "class", "Block svelte-28kowe");
    			attr(div4, "class", "Block svelte-28kowe");
    			attr(input, "type", "checkbox");
    			attr(div5, "class", "Block svelte-28kowe");
    			button.disabled = button_disabled_value = !/*StatementChecked*/ ctx[0];
    			attr(button, "class", "svelte-28kowe");
    			attr(div6, "class", "svelte-28kowe");
    			attr(div7, "class", "Dialog svelte-28kowe");
    		},
    		m(target, anchor) {
    			insert(target, div7, anchor);
    			append(div7, div6);
    			append(div6, div0);
    			append(div6, t1);
    			append(div6, div1);
    			append(div6, t3);
    			append(div6, div2);
    			append(div6, t5);
    			append(div6, div3);
    			append(div6, t7);
    			append(div6, div4);
    			append(div6, t9);
    			append(div6, div5);
    			append(div5, input);
    			input.checked = /*StatementChecked*/ ctx[0];
    			append(div5, t10);
    			append(div6, t11);
    			append(div6, button);
    			append(button, t12);

    			if (!mounted) {
    				dispose = [
    					listen(div1, "click", closeDialog$8),
    					listen(input, "change", /*input_change_handler*/ ctx[2]),
    					listen(button, "click", /*deleteAccount*/ ctx[1])
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*StatementChecked*/ 1) {
    				input.checked = /*StatementChecked*/ ctx[0];
    			}

    			if (dirty & /*StatementChecked*/ 1 && button_disabled_value !== (button_disabled_value = !/*StatementChecked*/ ctx[0])) {
    				button.disabled = button_disabled_value;
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

    function closeDialog$8(Event) {
    	Event.preventDefault();
    	Globals.define('State', '');
    }

    function instance$r($$self, $$props, $$invalidate) {
    	let $Globals;
    	component_subscribe($$self, Globals, $$value => $$invalidate(3, $Globals = $$value));

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

    	let StatementChecked = false;

    	function deleteAccount(Event) {
    		return __awaiter(this, void 0, void 0, function* () {
    			Event.preventDefault();
    			Globals.define({ State: 'unregistering' });

    			try {
    				yield focusOnApplication($Globals.ApplicationURL, $Globals.ApplicationId);
    				yield actOnBehalfOfCustomer($Globals.EMailAddress, $Globals.Password);
    				yield deleteCustomer();
    			} catch(Signal) {
    				Globals.define({
    					State: 'CommunicationFailure',
    					FailureReason: Signal.toString()
    				});

    				return;
    			}

    			Globals.define({
    				loggedIn: false,
    				AccessToken: '',
    				State: 'unregistered'
    			});
    		});
    	}

    	function input_change_handler() {
    		StatementChecked = this.checked;
    		$$invalidate(0, StatementChecked);
    	}

    	return [StatementChecked, deleteAccount, input_change_handler];
    }

    class UnregistrationDialog extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$r, create_fragment$A, safe_not_equal, {});
    	}
    }

    var css_248z$y = ".Dialog.svelte-16jefj2.svelte-16jefj2.svelte-16jefj2{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-16jefj2>div.svelte-16jefj2.svelte-16jefj2{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-16jefj2>div.svelte-16jefj2>[name=\"Title\"].svelte-16jefj2{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}.Dialog.svelte-16jefj2>div.svelte-16jefj2>.Block.svelte-16jefj2{display:block;margin:0px 0px 10px 0px;text-align:justify}.Dialog.svelte-16jefj2>div.svelte-16jefj2>button.svelte-16jefj2{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:6px;background-color:#2980B9;border:none;border-radius:4px;font-size:16px;font-weight:bold;color:white;cursor:pointer}.Dialog.svelte-16jefj2>div.svelte-16jefj2>button.svelte-16jefj2:disabled{opacity:0.3;cursor:auto}";
    styleInject(css_248z$y,{"insertAt":"top"});

    /* src/LogoutNotice.svelte generated by Svelte v3.42.1 */

    function create_fragment$z(ctx) {
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
    			div0.textContent = "Logout";
    			t1 = space();
    			div1 = element("div");
    			div1.textContent = "You have been logged-out.";
    			t3 = space();
    			div2 = element("div");
    			div2.textContent = "If you want to continue using this application, you will have to log-in\n      again.";
    			t5 = space();
    			button = element("button");
    			button.textContent = "Ok";
    			attr(div0, "name", "Title");
    			attr(div0, "class", "svelte-16jefj2");
    			attr(div1, "class", "Block svelte-16jefj2");
    			attr(div2, "class", "Block svelte-16jefj2");
    			attr(button, "class", "svelte-16jefj2");
    			attr(div3, "class", "svelte-16jefj2");
    			attr(div4, "class", "Dialog svelte-16jefj2");
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
    				dispose = listen(button, "click", closeNotice$a);
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

    function closeNotice$a(Event) {
    	Event.preventDefault();
    	Globals.define('State', 'Login');
    }

    function instance$q($$self) {
    	return [];
    }

    class LogoutNotice extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$q, create_fragment$z, safe_not_equal, {});
    	}
    }

    var css_248z$x = ".Dialog.svelte-1ogkcjw.svelte-1ogkcjw.svelte-1ogkcjw{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-1ogkcjw>div.svelte-1ogkcjw.svelte-1ogkcjw{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-1ogkcjw>div.svelte-1ogkcjw>[name=\"Title\"].svelte-1ogkcjw{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}.Dialog.svelte-1ogkcjw>div.svelte-1ogkcjw>.Block.svelte-1ogkcjw{display:block;margin:0px 0px 10px 0px;text-align:justify}.Dialog.svelte-1ogkcjw>div.svelte-1ogkcjw>button.svelte-1ogkcjw{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:6px;background-color:#2980B9;border:none;border-radius:4px;font-size:16px;font-weight:bold;color:white;cursor:pointer}.Dialog.svelte-1ogkcjw>div.svelte-1ogkcjw>button.svelte-1ogkcjw:disabled{opacity:0.3;cursor:auto}";
    styleInject(css_248z$x,{"insertAt":"top"});

    /* src/NameChangedNotice.svelte generated by Svelte v3.42.1 */

    function create_fragment$y(ctx) {
    	let div3;
    	let div2;
    	let div0;
    	let t1;
    	let div1;
    	let t3;
    	let button;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			div3 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			div0.textContent = "Name Changed";
    			t1 = space();
    			div1 = element("div");
    			div1.textContent = "Your name has been successfully changed.";
    			t3 = space();
    			button = element("button");
    			button.textContent = "Ok";
    			attr(div0, "name", "Title");
    			attr(div0, "class", "svelte-1ogkcjw");
    			attr(div1, "class", "Block svelte-1ogkcjw");
    			attr(button, "class", "svelte-1ogkcjw");
    			attr(div2, "class", "svelte-1ogkcjw");
    			attr(div3, "class", "Dialog svelte-1ogkcjw");
    		},
    		m(target, anchor) {
    			insert(target, div3, anchor);
    			append(div3, div2);
    			append(div2, div0);
    			append(div2, t1);
    			append(div2, div1);
    			append(div2, t3);
    			append(div2, button);

    			if (!mounted) {
    				dispose = listen(button, "click", closeNotice$9);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div3);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    function closeNotice$9(Event) {
    	Event.preventDefault();
    	Globals.define('State', '');
    }

    function instance$p($$self) {
    	return [];
    }

    class NameChangedNotice extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$p, create_fragment$y, safe_not_equal, {});
    	}
    }

    var css_248z$w = ".Dialog.svelte-cmrmc8.svelte-cmrmc8.svelte-cmrmc8{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-cmrmc8>div.svelte-cmrmc8.svelte-cmrmc8{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-cmrmc8>div.svelte-cmrmc8>[name=\"Title\"].svelte-cmrmc8{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}";
    styleInject(css_248z$w,{"insertAt":"top"});

    /* src/NameChangeNotice.svelte generated by Svelte v3.42.1 */

    function create_fragment$x(ctx) {
    	let div2;

    	return {
    		c() {
    			div2 = element("div");
    			div2.innerHTML = `<div class="svelte-cmrmc8"><div name="Title" class="svelte-cmrmc8">Name is being changed...</div></div>`;
    			attr(div2, "class", "Dialog svelte-cmrmc8");
    		},
    		m(target, anchor) {
    			insert(target, div2, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div2);
    		}
    	};
    }

    class NameChangeNotice extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, null, create_fragment$x, safe_not_equal, {});
    	}
    }

    var css_248z$v = ".Dialog.svelte-1eiuw7.svelte-1eiuw7.svelte-1eiuw7{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-1eiuw7>div.svelte-1eiuw7.svelte-1eiuw7{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-1eiuw7>div.svelte-1eiuw7>[name=\"Title\"].svelte-1eiuw7{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}.Dialog.svelte-1eiuw7>div.svelte-1eiuw7>[name=\"CloseButton\"].svelte-1eiuw7{display:block;position:absolute;top:-20px;right:-20px;width:20px;height:20px;border:solid 2px white;border-radius:50%;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2), 0px 0px 0px 1px lightgray;background-color:black;padding:0px;font-size:18px;font-weight:bold;line-height:12px;text-align:center;color:white;cursor:pointer}.Dialog.svelte-1eiuw7>div.svelte-1eiuw7>input.svelte-1eiuw7{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:4px;border:solid 1px lightgray;border-radius:2px;font-size:16px}.Dialog.svelte-1eiuw7>div .Hint.svelte-1eiuw7.svelte-1eiuw7{display:inline-block;position:relative;left:2px;top:-2px;font-size:12px\n  }.Dialog.svelte-1eiuw7>div .invalid.Hint.svelte-1eiuw7.svelte-1eiuw7{color:red}.Dialog.svelte-1eiuw7>div.svelte-1eiuw7>button.svelte-1eiuw7{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:6px;background-color:#2980B9;border:none;border-radius:4px;font-size:16px;font-weight:bold;color:white;cursor:pointer}.Dialog.svelte-1eiuw7>div.svelte-1eiuw7>button.svelte-1eiuw7:disabled{opacity:0.3;cursor:auto}";
    styleInject(css_248z$v,{"insertAt":"top"});

    /* src/NameChangeDialog.svelte generated by Svelte v3.42.1 */

    function create_fragment$w(ctx) {
    	let div5;
    	let div4;
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
    	let button;
    	let t10;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			div5 = element("div");
    			div4 = element("div");
    			div0 = element("div");
    			div0.textContent = "Name Change";
    			t1 = space();
    			div1 = element("div");
    			div1.textContent = "×";
    			t3 = space();
    			input0 = element("input");
    			t4 = space();
    			div2 = element("div");
    			t5 = text(/*firstNameMessage*/ ctx[4]);
    			t6 = space();
    			input1 = element("input");
    			t7 = space();
    			div3 = element("div");
    			t8 = text(/*lastNameMessage*/ ctx[5]);
    			t9 = space();
    			button = element("button");
    			t10 = text("Change Name");
    			attr(div0, "name", "Title");
    			attr(div0, "class", "svelte-1eiuw7");
    			attr(div1, "name", "CloseButton");
    			attr(div1, "class", "svelte-1eiuw7");
    			attr(input0, "type", "text");
    			attr(input0, "placeholder", "your first name");
    			attr(input0, "class", "svelte-1eiuw7");
    			attr(div2, "class", "svelte-1eiuw7");
    			toggle_class(div2, "Hint", true);
    			toggle_class(div2, "invalid", /*firstNameLooksBad*/ ctx[1]);
    			attr(input1, "type", "text");
    			attr(input1, "placeholder", "your last name");
    			attr(input1, "class", "svelte-1eiuw7");
    			attr(div3, "class", "svelte-1eiuw7");
    			toggle_class(div3, "Hint", true);
    			toggle_class(div3, "invalid", /*lastNameLooksBad*/ ctx[3]);
    			button.disabled = /*ChangeIsForbidden*/ ctx[6];
    			attr(button, "class", "svelte-1eiuw7");
    			attr(div4, "class", "svelte-1eiuw7");
    			attr(div5, "class", "Dialog svelte-1eiuw7");
    		},
    		m(target, anchor) {
    			insert(target, div5, anchor);
    			append(div5, div4);
    			append(div4, div0);
    			append(div4, t1);
    			append(div4, div1);
    			append(div4, t3);
    			append(div4, input0);
    			set_input_value(input0, /*firstName*/ ctx[0]);
    			append(div4, t4);
    			append(div4, div2);
    			append(div2, t5);
    			append(div4, t6);
    			append(div4, input1);
    			set_input_value(input1, /*lastName*/ ctx[2]);
    			append(div4, t7);
    			append(div4, div3);
    			append(div3, t8);
    			append(div4, t9);
    			append(div4, button);
    			append(button, t10);

    			if (!mounted) {
    				dispose = [
    					listen(div1, "click", closeDialog$7),
    					listen(input0, "input", /*input0_input_handler*/ ctx[8]),
    					listen(input1, "input", /*input1_input_handler*/ ctx[9]),
    					listen(button, "click", /*changeName*/ ctx[7])
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*firstName*/ 1 && input0.value !== /*firstName*/ ctx[0]) {
    				set_input_value(input0, /*firstName*/ ctx[0]);
    			}

    			if (dirty & /*firstNameMessage*/ 16) set_data(t5, /*firstNameMessage*/ ctx[4]);

    			if (dirty & /*firstNameLooksBad*/ 2) {
    				toggle_class(div2, "invalid", /*firstNameLooksBad*/ ctx[1]);
    			}

    			if (dirty & /*lastName*/ 4 && input1.value !== /*lastName*/ ctx[2]) {
    				set_input_value(input1, /*lastName*/ ctx[2]);
    			}

    			if (dirty & /*lastNameMessage*/ 32) set_data(t8, /*lastNameMessage*/ ctx[5]);

    			if (dirty & /*lastNameLooksBad*/ 8) {
    				toggle_class(div3, "invalid", /*lastNameLooksBad*/ ctx[3]);
    			}

    			if (dirty & /*ChangeIsForbidden*/ 64) {
    				button.disabled = /*ChangeIsForbidden*/ ctx[6];
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div5);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function closeDialog$7(Event) {
    	Event.preventDefault();
    	Globals.define('State', '');
    }

    function instance$o($$self, $$props, $$invalidate) {
    	let ChangeIsForbidden;
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

    	let firstName, firstNameLooksBad, firstNameMessage;
    	let lastName, lastNameLooksBad, lastNameMessage;
    	firstName = $Globals.firstName;
    	lastName = $Globals.lastName;

    	function changeName(Event) {
    		return __awaiter(this, void 0, void 0, function* () {
    			Event.preventDefault();
    			Globals.define({ State: 'changingName' });

    			try {
    				yield focusOnApplication($Globals.ApplicationURL, $Globals.ApplicationId);
    				yield actOnBehalfOfCustomer($Globals.EMailAddress, $Globals.Password);

    				yield updateCustomerRecordBy({
    					first_name: firstName,
    					last_name: lastName
    				});
    			} catch(Signal) {
    				Globals.define({
    					State: 'CommunicationFailure',
    					FailureReason: Signal.toString()
    				});

    				return;
    			}

    			Globals.define({
    				firstName: firstName.trim(),
    				lastName: lastName.trim(),
    				State: 'NameChanged'
    			});
    		});
    	}

    	function input0_input_handler() {
    		firstName = this.value;
    		$$invalidate(0, firstName);
    	}

    	function input1_input_handler() {
    		lastName = this.value;
    		$$invalidate(2, lastName);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*firstName*/ 1) {
    			switch (true) {
    				case firstName.trim() === '':
    					$$invalidate(1, firstNameLooksBad = false);
    					$$invalidate(4, firstNameMessage = 'please, enter your first name');
    					break;
    				case firstName.trim().length > maxNamePartLength:
    					$$invalidate(1, firstNameLooksBad = true);
    					$$invalidate(4, firstNameMessage = 'the given name is too long');
    					break;
    				default:
    					$$invalidate(1, firstNameLooksBad = false);
    					$$invalidate(4, firstNameMessage = 'the given name looks acceptable');
    			}
    		}

    		if ($$self.$$.dirty & /*lastName*/ 4) {
    			switch (true) {
    				case lastName.trim() === '':
    					$$invalidate(3, lastNameLooksBad = false);
    					$$invalidate(5, lastNameMessage = 'please, enter your last name');
    					break;
    				case lastName.trim().length > maxNamePartLength:
    					$$invalidate(3, lastNameLooksBad = true);
    					$$invalidate(5, lastNameMessage = 'the given name is too long');
    					break;
    				default:
    					$$invalidate(3, lastNameLooksBad = false);
    					$$invalidate(5, lastNameMessage = 'the given name looks acceptable');
    			}
    		}

    		if ($$self.$$.dirty & /*firstNameLooksBad, lastNameLooksBad*/ 10) {
    			$$invalidate(6, ChangeIsForbidden = firstNameLooksBad || lastNameLooksBad);
    		}
    	};

    	return [
    		firstName,
    		firstNameLooksBad,
    		lastName,
    		lastNameLooksBad,
    		firstNameMessage,
    		lastNameMessage,
    		ChangeIsForbidden,
    		changeName,
    		input0_input_handler,
    		input1_input_handler
    	];
    }

    class NameChangeDialog extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$o, create_fragment$w, safe_not_equal, {});
    	}
    }

    var css_248z$u = ".Dialog.svelte-16jefj2.svelte-16jefj2.svelte-16jefj2{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-16jefj2>div.svelte-16jefj2.svelte-16jefj2{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-16jefj2>div.svelte-16jefj2>[name=\"Title\"].svelte-16jefj2{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}.Dialog.svelte-16jefj2>div.svelte-16jefj2>.Block.svelte-16jefj2{display:block;margin:0px 0px 10px 0px;text-align:justify}.Dialog.svelte-16jefj2>div.svelte-16jefj2>button.svelte-16jefj2{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:6px;background-color:#2980B9;border:none;border-radius:4px;font-size:16px;font-weight:bold;color:white;cursor:pointer}.Dialog.svelte-16jefj2>div.svelte-16jefj2>button.svelte-16jefj2:disabled{opacity:0.3;cursor:auto}";
    styleInject(css_248z$u,{"insertAt":"top"});

    /* src/PasswordChangeFailureNotice.svelte generated by Svelte v3.42.1 */

    function create_fragment$v(ctx) {
    	let div3;
    	let div2;
    	let div0;
    	let t1;
    	let div1;
    	let t3;
    	let button;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			div3 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			div0.textContent = "Password Change Failed";
    			t1 = space();
    			div1 = element("div");
    			div1.textContent = "Your password could not be changed because your current password was\n      incorrect.";
    			t3 = space();
    			button = element("button");
    			button.textContent = "Ok";
    			attr(div0, "name", "Title");
    			attr(div0, "class", "svelte-16jefj2");
    			attr(div1, "class", "Block svelte-16jefj2");
    			attr(button, "class", "svelte-16jefj2");
    			attr(div2, "class", "svelte-16jefj2");
    			attr(div3, "class", "Dialog svelte-16jefj2");
    		},
    		m(target, anchor) {
    			insert(target, div3, anchor);
    			append(div3, div2);
    			append(div2, div0);
    			append(div2, t1);
    			append(div2, div1);
    			append(div2, t3);
    			append(div2, button);

    			if (!mounted) {
    				dispose = listen(button, "click", closeNotice$8);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div3);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    function closeNotice$8(Event) {
    	Event.preventDefault();
    	Globals.define('State', 'PasswordChange');
    }

    function instance$n($$self) {
    	return [];
    }

    class PasswordChangeFailureNotice extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$n, create_fragment$v, safe_not_equal, {});
    	}
    }

    var css_248z$t = ".Dialog.svelte-1ogkcjw.svelte-1ogkcjw.svelte-1ogkcjw{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-1ogkcjw>div.svelte-1ogkcjw.svelte-1ogkcjw{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-1ogkcjw>div.svelte-1ogkcjw>[name=\"Title\"].svelte-1ogkcjw{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}.Dialog.svelte-1ogkcjw>div.svelte-1ogkcjw>.Block.svelte-1ogkcjw{display:block;margin:0px 0px 10px 0px;text-align:justify}.Dialog.svelte-1ogkcjw>div.svelte-1ogkcjw>button.svelte-1ogkcjw{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:6px;background-color:#2980B9;border:none;border-radius:4px;font-size:16px;font-weight:bold;color:white;cursor:pointer}.Dialog.svelte-1ogkcjw>div.svelte-1ogkcjw>button.svelte-1ogkcjw:disabled{opacity:0.3;cursor:auto}";
    styleInject(css_248z$t,{"insertAt":"top"});

    /* src/PasswordChangedNotice.svelte generated by Svelte v3.42.1 */

    function create_fragment$u(ctx) {
    	let div3;
    	let div2;
    	let div0;
    	let t1;
    	let div1;
    	let t3;
    	let button;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			div3 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			div0.textContent = "Password Changed";
    			t1 = space();
    			div1 = element("div");
    			div1.textContent = "Your password has been successfully changed.";
    			t3 = space();
    			button = element("button");
    			button.textContent = "Ok";
    			attr(div0, "name", "Title");
    			attr(div0, "class", "svelte-1ogkcjw");
    			attr(div1, "class", "Block svelte-1ogkcjw");
    			attr(button, "class", "svelte-1ogkcjw");
    			attr(div2, "class", "svelte-1ogkcjw");
    			attr(div3, "class", "Dialog svelte-1ogkcjw");
    		},
    		m(target, anchor) {
    			insert(target, div3, anchor);
    			append(div3, div2);
    			append(div2, div0);
    			append(div2, t1);
    			append(div2, div1);
    			append(div2, t3);
    			append(div2, button);

    			if (!mounted) {
    				dispose = listen(button, "click", closeNotice$7);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div3);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    function closeNotice$7(Event) {
    	Event.preventDefault();
    	Globals.define('State', '');
    }

    function instance$m($$self) {
    	return [];
    }

    class PasswordChangedNotice extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$m, create_fragment$u, safe_not_equal, {});
    	}
    }

    var css_248z$s = ".Dialog.svelte-cmrmc8.svelte-cmrmc8.svelte-cmrmc8{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-cmrmc8>div.svelte-cmrmc8.svelte-cmrmc8{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-cmrmc8>div.svelte-cmrmc8>[name=\"Title\"].svelte-cmrmc8{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}";
    styleInject(css_248z$s,{"insertAt":"top"});

    /* src/PasswordChangeNotice.svelte generated by Svelte v3.42.1 */

    function create_fragment$t(ctx) {
    	let div2;

    	return {
    		c() {
    			div2 = element("div");
    			div2.innerHTML = `<div class="svelte-cmrmc8"><div name="Title" class="svelte-cmrmc8">Password is being changed...</div></div>`;
    			attr(div2, "class", "Dialog svelte-cmrmc8");
    		},
    		m(target, anchor) {
    			insert(target, div2, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div2);
    		}
    	};
    }

    class PasswordChangeNotice extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, null, create_fragment$t, safe_not_equal, {});
    	}
    }

    var css_248z$r = ".Dialog.svelte-1eiuw7.svelte-1eiuw7.svelte-1eiuw7{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-1eiuw7>div.svelte-1eiuw7.svelte-1eiuw7{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-1eiuw7>div.svelte-1eiuw7>[name=\"Title\"].svelte-1eiuw7{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}.Dialog.svelte-1eiuw7>div.svelte-1eiuw7>[name=\"CloseButton\"].svelte-1eiuw7{display:block;position:absolute;top:-20px;right:-20px;width:20px;height:20px;border:solid 2px white;border-radius:50%;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2), 0px 0px 0px 1px lightgray;background-color:black;padding:0px;font-size:18px;font-weight:bold;line-height:12px;text-align:center;color:white;cursor:pointer}.Dialog.svelte-1eiuw7>div.svelte-1eiuw7>input.svelte-1eiuw7{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:4px;border:solid 1px lightgray;border-radius:2px;font-size:16px}.Dialog.svelte-1eiuw7>div .Hint.svelte-1eiuw7.svelte-1eiuw7{display:inline-block;position:relative;left:2px;top:-2px;font-size:12px\n  }.Dialog.svelte-1eiuw7>div .invalid.Hint.svelte-1eiuw7.svelte-1eiuw7{color:red}.Dialog.svelte-1eiuw7>div.svelte-1eiuw7>button.svelte-1eiuw7{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:6px;background-color:#2980B9;border:none;border-radius:4px;font-size:16px;font-weight:bold;color:white;cursor:pointer}.Dialog.svelte-1eiuw7>div.svelte-1eiuw7>button.svelte-1eiuw7:disabled{opacity:0.3;cursor:auto}";
    styleInject(css_248z$r,{"insertAt":"top"});

    /* src/PasswordChangeDialog.svelte generated by Svelte v3.42.1 */

    function create_fragment$s(ctx) {
    	let div6;
    	let div5;
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
    	let input2;
    	let t10;
    	let div4;
    	let t11;
    	let t12;
    	let button;
    	let t13;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			div6 = element("div");
    			div5 = element("div");
    			div0 = element("div");
    			div0.textContent = "Password Change";
    			t1 = space();
    			div1 = element("div");
    			div1.textContent = "×";
    			t3 = space();
    			input0 = element("input");
    			t4 = space();
    			div2 = element("div");
    			t5 = text(/*oldPasswordMessage*/ ctx[6]);
    			t6 = space();
    			input1 = element("input");
    			t7 = space();
    			div3 = element("div");
    			t8 = text(/*newPasswordMessage*/ ctx[7]);
    			t9 = space();
    			input2 = element("input");
    			t10 = space();
    			div4 = element("div");
    			t11 = text(/*newConfirmationMessage*/ ctx[8]);
    			t12 = space();
    			button = element("button");
    			t13 = text("Change Password");
    			attr(div0, "name", "Title");
    			attr(div0, "class", "svelte-1eiuw7");
    			attr(div1, "name", "CloseButton");
    			attr(div1, "class", "svelte-1eiuw7");
    			attr(input0, "type", "password");
    			attr(input0, "placeholder", "your current password");
    			attr(input0, "class", "svelte-1eiuw7");
    			attr(div2, "class", "svelte-1eiuw7");
    			toggle_class(div2, "Hint", true);
    			toggle_class(div2, "invalid", /*oldPasswordLooksBad*/ ctx[1]);
    			attr(input1, "type", "password");
    			attr(input1, "placeholder", "your new password");
    			attr(input1, "class", "svelte-1eiuw7");
    			attr(div3, "class", "svelte-1eiuw7");
    			toggle_class(div3, "Hint", true);
    			toggle_class(div3, "invalid", /*newPasswordLooksBad*/ ctx[3]);
    			attr(input2, "type", "password");
    			attr(input2, "placeholder", "confirm your new password");
    			attr(input2, "class", "svelte-1eiuw7");
    			attr(div4, "class", "svelte-1eiuw7");
    			toggle_class(div4, "Hint", true);
    			toggle_class(div4, "invalid", /*newConfirmationLooksBad*/ ctx[5]);
    			button.disabled = /*ChangeIsForbidden*/ ctx[9];
    			attr(button, "class", "svelte-1eiuw7");
    			attr(div5, "class", "svelte-1eiuw7");
    			attr(div6, "class", "Dialog svelte-1eiuw7");
    		},
    		m(target, anchor) {
    			insert(target, div6, anchor);
    			append(div6, div5);
    			append(div5, div0);
    			append(div5, t1);
    			append(div5, div1);
    			append(div5, t3);
    			append(div5, input0);
    			set_input_value(input0, /*oldPassword*/ ctx[0]);
    			append(div5, t4);
    			append(div5, div2);
    			append(div2, t5);
    			append(div5, t6);
    			append(div5, input1);
    			set_input_value(input1, /*newPassword*/ ctx[2]);
    			append(div5, t7);
    			append(div5, div3);
    			append(div3, t8);
    			append(div5, t9);
    			append(div5, input2);
    			set_input_value(input2, /*newConfirmation*/ ctx[4]);
    			append(div5, t10);
    			append(div5, div4);
    			append(div4, t11);
    			append(div5, t12);
    			append(div5, button);
    			append(button, t13);

    			if (!mounted) {
    				dispose = [
    					listen(div1, "click", closeDialog$6),
    					listen(input0, "input", /*input0_input_handler*/ ctx[11]),
    					listen(input1, "input", /*input1_input_handler*/ ctx[12]),
    					listen(input2, "input", /*input2_input_handler*/ ctx[13]),
    					listen(button, "click", /*changePassword*/ ctx[10])
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*oldPassword*/ 1 && input0.value !== /*oldPassword*/ ctx[0]) {
    				set_input_value(input0, /*oldPassword*/ ctx[0]);
    			}

    			if (dirty & /*oldPasswordMessage*/ 64) set_data(t5, /*oldPasswordMessage*/ ctx[6]);

    			if (dirty & /*oldPasswordLooksBad*/ 2) {
    				toggle_class(div2, "invalid", /*oldPasswordLooksBad*/ ctx[1]);
    			}

    			if (dirty & /*newPassword*/ 4 && input1.value !== /*newPassword*/ ctx[2]) {
    				set_input_value(input1, /*newPassword*/ ctx[2]);
    			}

    			if (dirty & /*newPasswordMessage*/ 128) set_data(t8, /*newPasswordMessage*/ ctx[7]);

    			if (dirty & /*newPasswordLooksBad*/ 8) {
    				toggle_class(div3, "invalid", /*newPasswordLooksBad*/ ctx[3]);
    			}

    			if (dirty & /*newConfirmation*/ 16 && input2.value !== /*newConfirmation*/ ctx[4]) {
    				set_input_value(input2, /*newConfirmation*/ ctx[4]);
    			}

    			if (dirty & /*newConfirmationMessage*/ 256) set_data(t11, /*newConfirmationMessage*/ ctx[8]);

    			if (dirty & /*newConfirmationLooksBad*/ 32) {
    				toggle_class(div4, "invalid", /*newConfirmationLooksBad*/ ctx[5]);
    			}

    			if (dirty & /*ChangeIsForbidden*/ 512) {
    				button.disabled = /*ChangeIsForbidden*/ ctx[9];
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

    function closeDialog$6(Event) {
    	Event.preventDefault();
    	Globals.define('State', '');
    }

    function instance$l($$self, $$props, $$invalidate) {
    	let ChangeIsForbidden;
    	let $Globals;
    	component_subscribe($$self, Globals, $$value => $$invalidate(14, $Globals = $$value));

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

    	let oldPassword, oldPasswordLooksBad, oldPasswordMessage;
    	let newPassword, newPasswordLooksBad, newPasswordMessage;
    	let newConfirmation, newConfirmationLooksBad, newConfirmationMessage;
    	oldPassword = newPassword = newConfirmation = '';

    	function changePassword(Event) {
    		return __awaiter(this, void 0, void 0, function* () {
    			Event.preventDefault();

    			if ($Globals.Password === oldPassword) {
    				Globals.define('State', 'changingPassword');

    				try {
    					yield focusOnApplication($Globals.ApplicationURL, $Globals.ApplicationId);
    					yield actOnBehalfOfCustomer($Globals.EMailAddress, $Globals.Password);
    					yield changeCustomerPasswordTo(newPassword);
    				} catch(Signal) {
    					Globals.define({
    						State: 'CommunicationFailure',
    						FailureReason: Signal.toString()
    					});

    					return;
    				}

    				Globals.define({
    					Password: newPassword,
    					State: 'PasswordChanged'
    				});
    			} else {
    				Globals.define('State', 'wrongPassword');
    			}
    		});
    	}

    	function input0_input_handler() {
    		oldPassword = this.value;
    		$$invalidate(0, oldPassword);
    	}

    	function input1_input_handler() {
    		newPassword = this.value;
    		$$invalidate(2, newPassword);
    	}

    	function input2_input_handler() {
    		newConfirmation = this.value;
    		$$invalidate(4, newConfirmation);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*oldPassword*/ 1) {
    			switch (true) {
    				case oldPassword === '':
    					$$invalidate(1, oldPasswordLooksBad = true);
    					$$invalidate(6, oldPasswordMessage = 'please, enter your current password');
    					break;
    				case oldPassword.length < 10:
    					$$invalidate(1, oldPasswordLooksBad = true);
    					$$invalidate(6, oldPasswordMessage = 'your pcurrent assword is too short');
    					break;
    				case !(/[0-9]/).test(oldPassword):
    					$$invalidate(1, oldPasswordLooksBad = true);
    					$$invalidate(6, oldPasswordMessage = 'your current password lacks any digits');
    					break;
    				case oldPassword.toLowerCase() === oldPassword:
    					$$invalidate(1, oldPasswordLooksBad = true);
    					$$invalidate(6, oldPasswordMessage = 'your current password lacks any uppercase characters');
    					break;
    				case oldPassword.toUpperCase() === oldPassword:
    					$$invalidate(1, oldPasswordLooksBad = true);
    					$$invalidate(6, oldPasswordMessage = 'your current password lacks any lowercase characters');
    					break;
    				default:
    					$$invalidate(1, oldPasswordLooksBad = false);
    					$$invalidate(6, oldPasswordMessage = 'your current password looks acceptable');
    			}
    		}

    		if ($$self.$$.dirty & /*newPassword*/ 4) {
    			switch (true) {
    				case newPassword === '':
    					$$invalidate(3, newPasswordLooksBad = true);
    					$$invalidate(7, newPasswordMessage = 'please, enter your new password');
    					break;
    				case newPassword.length < 10:
    					$$invalidate(3, newPasswordLooksBad = true);
    					$$invalidate(7, newPasswordMessage = 'your new password is too short');
    					break;
    				case !(/[0-9]/).test(newPassword):
    					$$invalidate(3, newPasswordLooksBad = true);
    					$$invalidate(7, newPasswordMessage = 'your new password lacks any digits');
    					break;
    				case newPassword.toLowerCase() === newPassword:
    					$$invalidate(3, newPasswordLooksBad = true);
    					$$invalidate(7, newPasswordMessage = 'your new password lacks any uppercase characters');
    					break;
    				case newPassword.toUpperCase() === newPassword:
    					$$invalidate(3, newPasswordLooksBad = true);
    					$$invalidate(7, newPasswordMessage = 'your new password lacks any lowercase characters');
    					break;
    				default:
    					$$invalidate(3, newPasswordLooksBad = false);
    					$$invalidate(7, newPasswordMessage = 'your new password looks acceptable');
    			}
    		}

    		if ($$self.$$.dirty & /*newConfirmation, newPassword*/ 20) {
    			switch (true) {
    				case newConfirmation === '':
    					$$invalidate(5, newConfirmationLooksBad = true);
    					$$invalidate(8, newConfirmationMessage = 'please, enter your new password again');
    					break;
    				case newConfirmation !== newPassword:
    					$$invalidate(5, newConfirmationLooksBad = true);
    					$$invalidate(8, newConfirmationMessage = 'new password differs from its confirmation');
    					break;
    				default:
    					$$invalidate(5, newConfirmationLooksBad = false);
    					$$invalidate(8, newConfirmationMessage = 'new password and its confirmation are equal');
    			}
    		}

    		if ($$self.$$.dirty & /*oldPasswordLooksBad, newPasswordLooksBad, newConfirmationLooksBad*/ 42) {
    			$$invalidate(9, ChangeIsForbidden = oldPasswordLooksBad || newPasswordLooksBad || newConfirmationLooksBad);
    		}
    	};

    	return [
    		oldPassword,
    		oldPasswordLooksBad,
    		newPassword,
    		newPasswordLooksBad,
    		newConfirmation,
    		newConfirmationLooksBad,
    		oldPasswordMessage,
    		newPasswordMessage,
    		newConfirmationMessage,
    		ChangeIsForbidden,
    		changePassword,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler
    	];
    }

    class PasswordChangeDialog extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$l, create_fragment$s, safe_not_equal, {});
    	}
    }

    var css_248z$q = ".Dialog.svelte-16jefj2.svelte-16jefj2.svelte-16jefj2{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-16jefj2>div.svelte-16jefj2.svelte-16jefj2{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-16jefj2>div.svelte-16jefj2>[name=\"Title\"].svelte-16jefj2{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}.Dialog.svelte-16jefj2>div.svelte-16jefj2>.Block.svelte-16jefj2{display:block;margin:0px 0px 10px 0px;text-align:justify}.Dialog.svelte-16jefj2>div.svelte-16jefj2>button.svelte-16jefj2{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:6px;background-color:#2980B9;border:none;border-radius:4px;font-size:16px;font-weight:bold;color:white;cursor:pointer}.Dialog.svelte-16jefj2>div.svelte-16jefj2>button.svelte-16jefj2:disabled{opacity:0.3;cursor:auto}";
    styleInject(css_248z$q,{"insertAt":"top"});

    /* src/EMailChangeFailureNotice.svelte generated by Svelte v3.42.1 */

    function create_fragment$r(ctx) {
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
    			div0.textContent = "EMail Address Change Failed";
    			t1 = space();
    			div1 = element("div");
    			div1.textContent = "Your email address could not be changed because it is currently used by\n      somebody.";
    			t3 = space();
    			div2 = element("div");
    			div2.textContent = "Please try again with a different email address.";
    			t5 = space();
    			button = element("button");
    			button.textContent = "Ok";
    			attr(div0, "name", "Title");
    			attr(div0, "class", "svelte-16jefj2");
    			attr(div1, "class", "Block svelte-16jefj2");
    			attr(div2, "class", "Block svelte-16jefj2");
    			attr(button, "class", "svelte-16jefj2");
    			attr(div3, "class", "svelte-16jefj2");
    			attr(div4, "class", "Dialog svelte-16jefj2");
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
    				dispose = listen(button, "click", closeNotice$6);
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

    function closeNotice$6(Event) {
    	Event.preventDefault();
    	Globals.define('State', 'EMailAddressChange');
    }

    function instance$k($$self) {
    	return [];
    }

    class EMailChangeFailureNotice extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$k, create_fragment$r, safe_not_equal, {});
    	}
    }

    var css_248z$p = ".Dialog.svelte-1ogkcjw.svelte-1ogkcjw.svelte-1ogkcjw{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-1ogkcjw>div.svelte-1ogkcjw.svelte-1ogkcjw{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-1ogkcjw>div.svelte-1ogkcjw>[name=\"Title\"].svelte-1ogkcjw{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}.Dialog.svelte-1ogkcjw>div.svelte-1ogkcjw>.Block.svelte-1ogkcjw{display:block;margin:0px 0px 10px 0px;text-align:justify}.Dialog.svelte-1ogkcjw>div.svelte-1ogkcjw>button.svelte-1ogkcjw{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:6px;background-color:#2980B9;border:none;border-radius:4px;font-size:16px;font-weight:bold;color:white;cursor:pointer}.Dialog.svelte-1ogkcjw>div.svelte-1ogkcjw>button.svelte-1ogkcjw:disabled{opacity:0.3;cursor:auto}";
    styleInject(css_248z$p,{"insertAt":"top"});

    /* src/EMailChangedNotice.svelte generated by Svelte v3.42.1 */

    function create_fragment$q(ctx) {
    	let div3;
    	let div2;
    	let div0;
    	let t1;
    	let div1;
    	let t3;
    	let button;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			div3 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			div0.textContent = "EMail Address Changed";
    			t1 = space();
    			div1 = element("div");
    			div1.textContent = "Your email address has been successfully changed.";
    			t3 = space();
    			button = element("button");
    			button.textContent = "Ok";
    			attr(div0, "name", "Title");
    			attr(div0, "class", "svelte-1ogkcjw");
    			attr(div1, "class", "Block svelte-1ogkcjw");
    			attr(button, "class", "svelte-1ogkcjw");
    			attr(div2, "class", "svelte-1ogkcjw");
    			attr(div3, "class", "Dialog svelte-1ogkcjw");
    		},
    		m(target, anchor) {
    			insert(target, div3, anchor);
    			append(div3, div2);
    			append(div2, div0);
    			append(div2, t1);
    			append(div2, div1);
    			append(div2, t3);
    			append(div2, button);

    			if (!mounted) {
    				dispose = listen(button, "click", closeNotice$5);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div3);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    function closeNotice$5(Event) {
    	Event.preventDefault();
    	Globals.define('State', '');
    }

    function instance$j($$self) {
    	return [];
    }

    class EMailChangedNotice extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$j, create_fragment$q, safe_not_equal, {});
    	}
    }

    var css_248z$o = ".Dialog.svelte-cmrmc8.svelte-cmrmc8.svelte-cmrmc8{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-cmrmc8>div.svelte-cmrmc8.svelte-cmrmc8{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-cmrmc8>div.svelte-cmrmc8>[name=\"Title\"].svelte-cmrmc8{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}";
    styleInject(css_248z$o,{"insertAt":"top"});

    /* src/EMailChangeNotice.svelte generated by Svelte v3.42.1 */

    function create_fragment$p(ctx) {
    	let div2;

    	return {
    		c() {
    			div2 = element("div");
    			div2.innerHTML = `<div class="svelte-cmrmc8"><div name="Title" class="svelte-cmrmc8">EMail Address is being changed...</div></div>`;
    			attr(div2, "class", "Dialog svelte-cmrmc8");
    		},
    		m(target, anchor) {
    			insert(target, div2, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div2);
    		}
    	};
    }

    class EMailChangeNotice extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, null, create_fragment$p, safe_not_equal, {});
    	}
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

    var css_248z$n = ".Dialog.svelte-1eiuw7.svelte-1eiuw7.svelte-1eiuw7{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-1eiuw7>div.svelte-1eiuw7.svelte-1eiuw7{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-1eiuw7>div.svelte-1eiuw7>[name=\"Title\"].svelte-1eiuw7{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}.Dialog.svelte-1eiuw7>div.svelte-1eiuw7>[name=\"CloseButton\"].svelte-1eiuw7{display:block;position:absolute;top:-20px;right:-20px;width:20px;height:20px;border:solid 2px white;border-radius:50%;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2), 0px 0px 0px 1px lightgray;background-color:black;padding:0px;font-size:18px;font-weight:bold;line-height:12px;text-align:center;color:white;cursor:pointer}.Dialog.svelte-1eiuw7>div.svelte-1eiuw7>input.svelte-1eiuw7{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:4px;border:solid 1px lightgray;border-radius:2px;font-size:16px}.Dialog.svelte-1eiuw7>div .Hint.svelte-1eiuw7.svelte-1eiuw7{display:inline-block;position:relative;left:2px;top:-2px;font-size:12px\n  }.Dialog.svelte-1eiuw7>div .invalid.Hint.svelte-1eiuw7.svelte-1eiuw7{color:red}.Dialog.svelte-1eiuw7>div.svelte-1eiuw7>button.svelte-1eiuw7{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:6px;background-color:#2980B9;border:none;border-radius:4px;font-size:16px;font-weight:bold;color:white;cursor:pointer}.Dialog.svelte-1eiuw7>div.svelte-1eiuw7>button.svelte-1eiuw7:disabled{opacity:0.3;cursor:auto}";
    styleInject(css_248z$n,{"insertAt":"top"});

    /* src/EMailChangeDialog.svelte generated by Svelte v3.42.1 */

    function create_fragment$o(ctx) {
    	let div4;
    	let div3;
    	let div0;
    	let t1;
    	let div1;
    	let t3;
    	let input;
    	let t4;
    	let div2;
    	let t5;
    	let t6;
    	let button;
    	let t7;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			div4 = element("div");
    			div3 = element("div");
    			div0 = element("div");
    			div0.textContent = "EMail Address Change";
    			t1 = space();
    			div1 = element("div");
    			div1.textContent = "×";
    			t3 = space();
    			input = element("input");
    			t4 = space();
    			div2 = element("div");
    			t5 = text(/*AddressMessage*/ ctx[2]);
    			t6 = space();
    			button = element("button");
    			t7 = text("Change EMail Address");
    			attr(div0, "name", "Title");
    			attr(div0, "class", "svelte-1eiuw7");
    			attr(div1, "name", "CloseButton");
    			attr(div1, "class", "svelte-1eiuw7");
    			attr(input, "type", "email");
    			attr(input, "placeholder", "your new email address");
    			attr(input, "class", "svelte-1eiuw7");
    			attr(div2, "class", "svelte-1eiuw7");
    			toggle_class(div2, "Hint", true);
    			toggle_class(div2, "invalid", /*AddressLooksBad*/ ctx[1]);
    			button.disabled = /*ChangeIsForbidden*/ ctx[3];
    			attr(button, "class", "svelte-1eiuw7");
    			attr(div3, "class", "svelte-1eiuw7");
    			attr(div4, "class", "Dialog svelte-1eiuw7");
    		},
    		m(target, anchor) {
    			insert(target, div4, anchor);
    			append(div4, div3);
    			append(div3, div0);
    			append(div3, t1);
    			append(div3, div1);
    			append(div3, t3);
    			append(div3, input);
    			set_input_value(input, /*EMailAddress*/ ctx[0]);
    			append(div3, t4);
    			append(div3, div2);
    			append(div2, t5);
    			append(div3, t6);
    			append(div3, button);
    			append(button, t7);

    			if (!mounted) {
    				dispose = [
    					listen(div1, "click", closeDialog$5),
    					listen(input, "input", /*input_input_handler*/ ctx[5]),
    					listen(button, "click", /*changeEMailAddress*/ ctx[4])
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*EMailAddress*/ 1 && input.value !== /*EMailAddress*/ ctx[0]) {
    				set_input_value(input, /*EMailAddress*/ ctx[0]);
    			}

    			if (dirty & /*AddressMessage*/ 4) set_data(t5, /*AddressMessage*/ ctx[2]);

    			if (dirty & /*AddressLooksBad*/ 2) {
    				toggle_class(div2, "invalid", /*AddressLooksBad*/ ctx[1]);
    			}

    			if (dirty & /*ChangeIsForbidden*/ 8) {
    				button.disabled = /*ChangeIsForbidden*/ ctx[3];
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div4);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function closeDialog$5(Event) {
    	Event.preventDefault();
    	Globals.define('State', '');
    }

    function instance$i($$self, $$props, $$invalidate) {
    	let ChangeIsForbidden;
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

    	function changeEMailAddress(Event) {
    		return __awaiter(this, void 0, void 0, function* () {
    			Event.preventDefault();
    			Globals.define('State', 'changingEMailAddress');

    			try {
    				yield focusOnApplication($Globals.ApplicationURL, $Globals.ApplicationId);
    				yield actOnBehalfOfCustomer($Globals.EMailAddress, $Globals.Password);
    				yield changeCustomerEMailAddressTo(EMailAddress);
    			} catch(Signal) {
    				if (Signal.name === 'ConflictError') {
    					Globals.define('State', 'EMailAddressChangeFailure');
    				} else {
    					Globals.define({
    						State: 'CommunicationFailure',
    						FailureReason: Signal.toString()
    					});
    				}

    				return;
    			}

    			Globals.define({
    				EMailAddress,
    				State: 'EMailAddressChanged'
    			});
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
    					$$invalidate(2, AddressMessage = 'please, enter your new email address');
    					break;
    				case ValueIsEMailAddress(EMailAddress):
    					$$invalidate(1, AddressLooksBad = false);
    					$$invalidate(2, AddressMessage = 'your new email address looks acceptable');
    					break;
    				default:
    					$$invalidate(1, AddressLooksBad = true);
    					$$invalidate(2, AddressMessage = 'please, enter a valid email address');
    			}
    		}

    		if ($$self.$$.dirty & /*AddressLooksBad*/ 2) {
    			$$invalidate(3, ChangeIsForbidden = AddressLooksBad);
    		}
    	};

    	return [
    		EMailAddress,
    		AddressLooksBad,
    		AddressMessage,
    		ChangeIsForbidden,
    		changeEMailAddress,
    		input_input_handler
    	];
    }

    class EMailChangeDialog extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$i, create_fragment$o, safe_not_equal, {});
    	}
    }

    var css_248z$m = ".Dialog.svelte-1veqcbc.svelte-1veqcbc.svelte-1veqcbc{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-1veqcbc>div.svelte-1veqcbc.svelte-1veqcbc{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-1veqcbc>div.svelte-1veqcbc>[name=\"Title\"].svelte-1veqcbc{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}.Dialog.svelte-1veqcbc a.svelte-1veqcbc.svelte-1veqcbc,.Dialog.svelte-1veqcbc a.svelte-1veqcbc.svelte-1veqcbc:visited{color:#2980B9;text-decoration:underline}.Dialog.svelte-1veqcbc>div.svelte-1veqcbc>.Block.svelte-1veqcbc{display:block;margin:0px 0px 10px 0px;text-align:justify}.Dialog.svelte-1veqcbc>div.svelte-1veqcbc>button.svelte-1veqcbc{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:6px;background-color:#2980B9;border:none;border-radius:4px;font-size:16px;font-weight:bold;color:white;cursor:pointer}.Dialog.svelte-1veqcbc>div.svelte-1veqcbc>button.svelte-1veqcbc:disabled{opacity:0.3;cursor:auto}";
    styleInject(css_248z$m,{"insertAt":"top"});

    /* src/LoginFailureNotice.svelte generated by Svelte v3.42.1 */

    function create_fragment$n(ctx) {
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
    			div1.textContent = "Your email address or your password may have been incorrect.";
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
    			attr(div0, "class", "svelte-1veqcbc");
    			attr(div1, "class", "Block svelte-1veqcbc");
    			attr(a0, "href", "#/");
    			attr(a0, "class", "svelte-1veqcbc");
    			attr(div2, "class", "Block svelte-1veqcbc");
    			attr(a1, "href", "#/");
    			attr(a1, "class", "svelte-1veqcbc");
    			attr(div3, "class", "Block svelte-1veqcbc");
    			attr(button, "class", "svelte-1veqcbc");
    			attr(div4, "class", "svelte-1veqcbc");
    			attr(div5, "class", "Dialog svelte-1veqcbc");
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
    					listen(a0, "click", startRegistration$1),
    					listen(a1, "click", startPasswordReset$1),
    					listen(button, "click", closeMessage$1)
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

    function startRegistration$1(Event) {
    	Event.preventDefault();
    	Globals.define('State', 'Registration');
    }

    function startPasswordReset$1(Event) {
    	Event.preventDefault();
    	Globals.define('State', 'ResetRequest');
    }

    function closeMessage$1(Event) {
    	Event.preventDefault();
    	Globals.define('State', '');
    }

    function instance$h($$self) {
    	return [];
    }

    class LoginFailureNotice extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$h, create_fragment$n, safe_not_equal, {});
    	}
    }

    var css_248z$l = ".Dialog.svelte-cmrmc8.svelte-cmrmc8.svelte-cmrmc8{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-cmrmc8>div.svelte-cmrmc8.svelte-cmrmc8{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-cmrmc8>div.svelte-cmrmc8>[name=\"Title\"].svelte-cmrmc8{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}";
    styleInject(css_248z$l,{"insertAt":"top"});

    /* src/LoginNotice.svelte generated by Svelte v3.42.1 */

    function create_fragment$m(ctx) {
    	let div2;

    	return {
    		c() {
    			div2 = element("div");
    			div2.innerHTML = `<div class="svelte-cmrmc8"><div name="Title" class="svelte-cmrmc8">Logging in...</div></div>`;
    			attr(div2, "class", "Dialog svelte-cmrmc8");
    		},
    		m(target, anchor) {
    			insert(target, div2, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div2);
    		}
    	};
    }

    class LoginNotice extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, null, create_fragment$m, safe_not_equal, {});
    	}
    }

    var css_248z$k = ".Dialog.svelte-omsjzl.svelte-omsjzl.svelte-omsjzl{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-omsjzl>div.svelte-omsjzl.svelte-omsjzl{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-omsjzl>div.svelte-omsjzl>[name=\"Title\"].svelte-omsjzl{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}.Dialog.svelte-omsjzl>div.svelte-omsjzl>[name=\"CloseButton\"].svelte-omsjzl{display:block;position:absolute;top:-20px;right:-20px;width:20px;height:20px;border:solid 2px white;border-radius:50%;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2), 0px 0px 0px 1px lightgray;background-color:black;padding:0px;font-size:18px;font-weight:bold;line-height:12px;text-align:center;color:white;cursor:pointer}.Dialog.svelte-omsjzl a.svelte-omsjzl.svelte-omsjzl,.Dialog.svelte-omsjzl a.svelte-omsjzl.svelte-omsjzl:visited{color:#2980B9;text-decoration:underline}.Dialog.svelte-omsjzl>div.svelte-omsjzl>input.svelte-omsjzl{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:4px;border:solid 1px lightgray;border-radius:2px;font-size:16px}.Dialog.svelte-omsjzl>div .Hint.svelte-omsjzl.svelte-omsjzl{display:inline-block;position:relative;left:2px;top:-2px;font-size:12px\n  }.Dialog.svelte-omsjzl>div .invalid.Hint.svelte-omsjzl.svelte-omsjzl{color:red}.Dialog.svelte-omsjzl>div.svelte-omsjzl>button.svelte-omsjzl{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:6px;background-color:#2980B9;border:none;border-radius:4px;font-size:16px;font-weight:bold;color:white;cursor:pointer}.Dialog.svelte-omsjzl>div.svelte-omsjzl>button.svelte-omsjzl:disabled{opacity:0.3;cursor:auto}.Dialog.svelte-omsjzl>div.svelte-omsjzl>[name=\"UnconfirmedAccount\"].svelte-omsjzl{display:block;position:relative;margin:10px 0px 5px 0px;text-align:right}.Dialog.svelte-omsjzl>div.svelte-omsjzl>[name=\"ForgottenPassword\"].svelte-omsjzl{display:block;position:relative;margin:5px 0px 10px 0px;text-align:right}";
    styleInject(css_248z$k,{"insertAt":"top"});

    /* src/LoginDialog.svelte generated by Svelte v3.42.1 */

    function create_fragment$l(ctx) {
    	let div8;
    	let div7;
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
    	let div5;
    	let a1;
    	let t13;
    	let button;
    	let t14;
    	let t15;
    	let div6;
    	let t16;
    	let a2;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			div8 = element("div");
    			div7 = element("div");
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
    			a0.textContent = "Did not confirm your account?";
    			t11 = space();
    			div5 = element("div");
    			a1 = element("a");
    			a1.textContent = "Forgot your password?";
    			t13 = space();
    			button = element("button");
    			t14 = text("Login");
    			t15 = space();
    			div6 = element("div");
    			t16 = text("Don't have an account? ");
    			a2 = element("a");
    			a2.textContent = "Create one!";
    			attr(div0, "name", "CloseButton");
    			attr(div0, "class", "svelte-omsjzl");
    			attr(div1, "name", "Title");
    			attr(div1, "class", "svelte-omsjzl");
    			attr(input0, "type", "email");
    			attr(input0, "placeholder", "your email address");
    			attr(input0, "class", "svelte-omsjzl");
    			attr(div2, "class", "svelte-omsjzl");
    			toggle_class(div2, "Hint", true);
    			toggle_class(div2, "invalid", /*AddressLooksBad*/ ctx[1]);
    			attr(input1, "type", "password");
    			attr(input1, "placeholder", "your password");
    			attr(input1, "class", "svelte-omsjzl");
    			attr(div3, "class", "svelte-omsjzl");
    			toggle_class(div3, "Hint", true);
    			toggle_class(div3, "invalid", /*PasswordLooksBad*/ ctx[3]);
    			attr(a0, "href", "#/");
    			attr(a0, "class", "svelte-omsjzl");
    			attr(div4, "name", "UnconfirmedAccount");
    			attr(div4, "class", "svelte-omsjzl");
    			attr(a1, "href", "#/");
    			attr(a1, "class", "svelte-omsjzl");
    			attr(div5, "name", "ForgottenPassword");
    			attr(div5, "class", "svelte-omsjzl");
    			button.disabled = /*LoginIsForbidden*/ ctx[6];
    			attr(button, "class", "svelte-omsjzl");
    			attr(a2, "href", "#/");
    			attr(a2, "class", "svelte-omsjzl");
    			set_style(div6, "text-align", "center");
    			attr(div7, "class", "svelte-omsjzl");
    			attr(div8, "class", "Dialog svelte-omsjzl");
    		},
    		m(target, anchor) {
    			insert(target, div8, anchor);
    			append(div8, div7);
    			append(div7, div0);
    			append(div7, t1);
    			append(div7, div1);
    			append(div7, t3);
    			append(div7, input0);
    			set_input_value(input0, /*EMailAddress*/ ctx[0]);
    			append(div7, t4);
    			append(div7, div2);
    			append(div2, t5);
    			append(div7, t6);
    			append(div7, input1);
    			set_input_value(input1, /*Password*/ ctx[2]);
    			append(div7, t7);
    			append(div7, div3);
    			append(div3, t8);
    			append(div7, t9);
    			append(div7, div4);
    			append(div4, a0);
    			append(div7, t11);
    			append(div7, div5);
    			append(div5, a1);
    			append(div7, t13);
    			append(div7, button);
    			append(button, t14);
    			append(div7, t15);
    			append(div7, div6);
    			append(div6, t16);
    			append(div6, a2);

    			if (!mounted) {
    				dispose = [
    					listen(div0, "click", closeDialog$4),
    					listen(input0, "input", /*input0_input_handler*/ ctx[8]),
    					listen(input1, "input", /*input1_input_handler*/ ctx[9]),
    					listen(a0, "click", startRenewalRequest),
    					listen(a1, "click", startPasswordReset),
    					listen(button, "click", /*doLogin*/ ctx[7]),
    					listen(a2, "click", startRegistration)
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
    			if (detaching) detach(div8);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function closeDialog$4(Event) {
    	Event.preventDefault();
    	Globals.define('State', '');
    }

    function startRegistration(Event) {
    	Event.preventDefault();
    	Globals.define('State', 'Registration');
    }

    function startRenewalRequest(Event) {
    	Event.preventDefault();
    	Globals.define('State', 'RenewalRequest');
    }

    function startPasswordReset(Event) {
    	Event.preventDefault();
    	Globals.define('State', 'ResetRequest');
    }

    function instance$g($$self, $$props, $$invalidate) {
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
    				State: 'sendingLogin',
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
    					$$invalidate(4, AddressMessage = 'please, enter your email address');
    					break;
    				case ValueIsEMailAddress(EMailAddress):
    					$$invalidate(1, AddressLooksBad = false);
    					$$invalidate(4, AddressMessage = 'your email address looks acceptable');
    					break;
    				default:
    					$$invalidate(1, AddressLooksBad = true);
    					$$invalidate(4, AddressMessage = 'please, enter a valid email address');
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
    		init(this, options, instance$g, create_fragment$l, safe_not_equal, {});
    	}
    }

    var css_248z$j = ".Dialog.svelte-1ogkcjw.svelte-1ogkcjw.svelte-1ogkcjw{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-1ogkcjw>div.svelte-1ogkcjw.svelte-1ogkcjw{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-1ogkcjw>div.svelte-1ogkcjw>[name=\"Title\"].svelte-1ogkcjw{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}.Dialog.svelte-1ogkcjw>div.svelte-1ogkcjw>.Block.svelte-1ogkcjw{display:block;margin:0px 0px 10px 0px;text-align:justify}.Dialog.svelte-1ogkcjw>div.svelte-1ogkcjw>button.svelte-1ogkcjw{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:6px;background-color:#2980B9;border:none;border-radius:4px;font-size:16px;font-weight:bold;color:white;cursor:pointer}.Dialog.svelte-1ogkcjw>div.svelte-1ogkcjw>button.svelte-1ogkcjw:disabled{opacity:0.3;cursor:auto}";
    styleInject(css_248z$j,{"insertAt":"top"});

    /* src/PasswordResetSuccessNotice.svelte generated by Svelte v3.42.1 */

    function create_fragment$k(ctx) {
    	let div3;
    	let div2;
    	let div0;
    	let t1;
    	let div1;
    	let t3;
    	let button;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			div3 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			div0.textContent = "Password Reset";
    			t1 = space();
    			div1 = element("div");
    			div1.textContent = "Your password has been successfully reset - you may login now.";
    			t3 = space();
    			button = element("button");
    			button.textContent = "Ok";
    			attr(div0, "name", "Title");
    			attr(div0, "class", "svelte-1ogkcjw");
    			attr(div1, "class", "Block svelte-1ogkcjw");
    			attr(button, "class", "svelte-1ogkcjw");
    			attr(div2, "class", "svelte-1ogkcjw");
    			attr(div3, "class", "Dialog svelte-1ogkcjw");
    		},
    		m(target, anchor) {
    			insert(target, div3, anchor);
    			append(div3, div2);
    			append(div2, div0);
    			append(div2, t1);
    			append(div2, div1);
    			append(div2, t3);
    			append(div2, button);

    			if (!mounted) {
    				dispose = listen(button, "click", closeNotice$4);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div3);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    function closeNotice$4(Event) {
    	Event.preventDefault();
    	Globals.define('State', 'Login');
    }

    function instance$f($$self) {
    	return [];
    }

    class PasswordResetSuccessNotice extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$f, create_fragment$k, safe_not_equal, {});
    	}
    }

    var css_248z$i = ".Dialog.svelte-cmrmc8.svelte-cmrmc8.svelte-cmrmc8{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-cmrmc8>div.svelte-cmrmc8.svelte-cmrmc8{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-cmrmc8>div.svelte-cmrmc8>[name=\"Title\"].svelte-cmrmc8{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}";
    styleInject(css_248z$i,{"insertAt":"top"});

    /* src/PasswordResetNotice.svelte generated by Svelte v3.42.1 */

    function create_fragment$j(ctx) {
    	let div2;

    	return {
    		c() {
    			div2 = element("div");
    			div2.innerHTML = `<div class="svelte-cmrmc8"><div name="Title" class="svelte-cmrmc8">Password is being reset...</div></div>`;
    			attr(div2, "class", "Dialog svelte-cmrmc8");
    		},
    		m(target, anchor) {
    			insert(target, div2, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div2);
    		}
    	};
    }

    class PasswordResetNotice extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, null, create_fragment$j, safe_not_equal, {});
    	}
    }

    var css_248z$h = ".Dialog.svelte-1t058m1.svelte-1t058m1.svelte-1t058m1{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-1t058m1>div.svelte-1t058m1.svelte-1t058m1{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-1t058m1>div.svelte-1t058m1>[name=\"Title\"].svelte-1t058m1{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}.Dialog.svelte-1t058m1>div.svelte-1t058m1>[name=\"CloseButton\"].svelte-1t058m1{display:block;position:absolute;top:-20px;right:-20px;width:20px;height:20px;border:solid 2px white;border-radius:50%;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2), 0px 0px 0px 1px lightgray;background-color:black;padding:0px;font-size:18px;font-weight:bold;line-height:12px;text-align:center;color:white;cursor:pointer}.Dialog.svelte-1t058m1>div.svelte-1t058m1>input.svelte-1t058m1{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:4px;border:solid 1px lightgray;border-radius:2px;font-size:16px}.Dialog.svelte-1t058m1>div .Hint.svelte-1t058m1.svelte-1t058m1{display:inline-block;position:relative;left:2px;top:-2px;font-size:12px\n  }.Dialog.svelte-1t058m1>div .invalid.Hint.svelte-1t058m1.svelte-1t058m1{color:red}.Dialog.svelte-1t058m1>div.svelte-1t058m1>button.svelte-1t058m1{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:6px;background-color:#2980B9;border:none;border-radius:4px;font-size:16px;font-weight:bold;color:white;cursor:pointer}.Dialog.svelte-1t058m1>div.svelte-1t058m1>button.svelte-1t058m1:disabled{opacity:0.3;cursor:auto}";
    styleInject(css_248z$h,{"insertAt":"top"});

    /* src/PasswordResetDialog.svelte generated by Svelte v3.42.1 */

    function create_fragment$i(ctx) {
    	let div4;
    	let div3;
    	let div0;
    	let t1;
    	let div1;
    	let t3;
    	let input;
    	let t4;
    	let div2;
    	let t5;
    	let t6;
    	let button;
    	let t7;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			div4 = element("div");
    			div3 = element("div");
    			div0 = element("div");
    			div0.textContent = "Password Reset";
    			t1 = space();
    			div1 = element("div");
    			div1.textContent = "×";
    			t3 = space();
    			input = element("input");
    			t4 = space();
    			div2 = element("div");
    			t5 = text(/*PasswordMessage*/ ctx[2]);
    			t6 = space();
    			button = element("button");
    			t7 = text("Reset Password");
    			attr(div0, "name", "Title");
    			attr(div0, "class", "svelte-1t058m1");
    			attr(div1, "name", "CloseButton");
    			attr(div1, "class", "svelte-1t058m1");
    			attr(input, "type", "password");
    			attr(input, "placeholder", "your new password");
    			attr(input, "class", "svelte-1t058m1");
    			attr(div2, "class", "svelte-1t058m1");
    			toggle_class(div2, "Hint", true);
    			toggle_class(div2, "invalid", /*PasswordLooksBad*/ ctx[1]);
    			button.disabled = /*ResetIsForbidden*/ ctx[3];
    			attr(button, "class", "svelte-1t058m1");
    			attr(div3, "class", "svelte-1t058m1");
    			attr(div4, "class", "Dialog svelte-1t058m1");
    		},
    		m(target, anchor) {
    			insert(target, div4, anchor);
    			append(div4, div3);
    			append(div3, div0);
    			append(div3, t1);
    			append(div3, div1);
    			append(div3, t3);
    			append(div3, input);
    			set_input_value(input, /*Password*/ ctx[0]);
    			append(div3, t4);
    			append(div3, div2);
    			append(div2, t5);
    			append(div3, t6);
    			append(div3, button);
    			append(button, t7);

    			if (!mounted) {
    				dispose = [
    					listen(div1, "click", closeDialog$3),
    					listen(input, "input", /*input_input_handler*/ ctx[5]),
    					listen(button, "click", /*resetPassword*/ ctx[4])
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*Password*/ 1 && input.value !== /*Password*/ ctx[0]) {
    				set_input_value(input, /*Password*/ ctx[0]);
    			}

    			if (dirty & /*PasswordMessage*/ 4) set_data(t5, /*PasswordMessage*/ ctx[2]);

    			if (dirty & /*PasswordLooksBad*/ 2) {
    				toggle_class(div2, "invalid", /*PasswordLooksBad*/ ctx[1]);
    			}

    			if (dirty & /*ResetIsForbidden*/ 8) {
    				button.disabled = /*ResetIsForbidden*/ ctx[3];
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div4);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function closeDialog$3(Event) {
    	Event.preventDefault();
    	Globals.define('State', '');
    }

    function instance$e($$self, $$props, $$invalidate) {
    	let ResetIsForbidden;
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

    	let Password, PasswordLooksBad, PasswordMessage;
    	Password = '';

    	function resetPassword(Event) {
    		return __awaiter(this, void 0, void 0, function* () {
    			Event.preventDefault();
    			Globals.define('State', 'resettingPassword');

    			try {
    				yield focusOnApplication($Globals.ApplicationURL, $Globals.ApplicationId);
    				yield resetCustomerPasswordUsing($Globals.ResetToken, Password);
    			} catch(Signal) {
    				Globals.define({
    					State: 'CommunicationFailure',
    					FailureReason: Signal.toString()
    				});

    				return;
    			}

    			Globals.define({
    				ResetToken: '',
    				Password,
    				State: 'PasswordReset'
    			});
    		});
    	}

    	function input_input_handler() {
    		Password = this.value;
    		$$invalidate(0, Password);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*Password*/ 1) {
    			switch (true) {
    				case Password === '':
    					$$invalidate(1, PasswordLooksBad = true);
    					$$invalidate(2, PasswordMessage = 'please, enter your password');
    					break;
    				case Password.length < 10:
    					$$invalidate(1, PasswordLooksBad = true);
    					$$invalidate(2, PasswordMessage = 'your password is too short');
    					break;
    				case !(/[0-9]/).test(Password):
    					$$invalidate(1, PasswordLooksBad = true);
    					$$invalidate(2, PasswordMessage = 'your password lacks any digits');
    					break;
    				case Password.toLowerCase() === Password:
    					$$invalidate(1, PasswordLooksBad = true);
    					$$invalidate(2, PasswordMessage = 'your password lacks any uppercase characters');
    					break;
    				case Password.toUpperCase() === Password:
    					$$invalidate(1, PasswordLooksBad = true);
    					$$invalidate(2, PasswordMessage = 'your password lacks any lowercase characters');
    					break;
    				default:
    					$$invalidate(1, PasswordLooksBad = false);
    					$$invalidate(2, PasswordMessage = 'your password looks acceptable');
    			}
    		}

    		if ($$self.$$.dirty & /*PasswordLooksBad*/ 2) {
    			$$invalidate(3, ResetIsForbidden = PasswordLooksBad);
    		}
    	};

    	return [
    		Password,
    		PasswordLooksBad,
    		PasswordMessage,
    		ResetIsForbidden,
    		resetPassword,
    		input_input_handler
    	];
    }

    class PasswordResetDialog extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$e, create_fragment$i, safe_not_equal, {});
    	}
    }

    var css_248z$g = ".Dialog.svelte-1ogkcjw.svelte-1ogkcjw.svelte-1ogkcjw{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-1ogkcjw>div.svelte-1ogkcjw.svelte-1ogkcjw{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-1ogkcjw>div.svelte-1ogkcjw>[name=\"Title\"].svelte-1ogkcjw{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}.Dialog.svelte-1ogkcjw>div.svelte-1ogkcjw>.Block.svelte-1ogkcjw{display:block;margin:0px 0px 10px 0px;text-align:justify}.Dialog.svelte-1ogkcjw>div.svelte-1ogkcjw>button.svelte-1ogkcjw{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:6px;background-color:#2980B9;border:none;border-radius:4px;font-size:16px;font-weight:bold;color:white;cursor:pointer}.Dialog.svelte-1ogkcjw>div.svelte-1ogkcjw>button.svelte-1ogkcjw:disabled{opacity:0.3;cursor:auto}";
    styleInject(css_248z$g,{"insertAt":"top"});

    /* src/ResetRequestedNotice.svelte generated by Svelte v3.42.1 */

    function create_fragment$h(ctx) {
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
    			div0.textContent = "Password Reset Requested";
    			t1 = space();
    			div1 = element("div");
    			div1.textContent = "An email containing a link to reset your password has been sent.";
    			t3 = space();
    			div2 = element("div");
    			div2.textContent = "Please, open your mailbox, look for an email from VoltCloud.io and click\n      on the link it contains. You will then be asked to enter a new password.";
    			t5 = space();
    			button = element("button");
    			button.textContent = "Ok";
    			attr(div0, "name", "Title");
    			attr(div0, "class", "svelte-1ogkcjw");
    			attr(div1, "class", "Block svelte-1ogkcjw");
    			attr(div2, "class", "Block svelte-1ogkcjw");
    			attr(button, "class", "svelte-1ogkcjw");
    			attr(div3, "class", "svelte-1ogkcjw");
    			attr(div4, "class", "Dialog svelte-1ogkcjw");
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
    				dispose = listen(button, "click", closeNotice$3);
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

    function closeNotice$3(Event) {
    	Event.preventDefault();
    	Globals.define('State', '');
    }

    function instance$d($$self) {
    	return [];
    }

    class ResetRequestedNotice extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$d, create_fragment$h, safe_not_equal, {});
    	}
    }

    var css_248z$f = ".Dialog.svelte-cmrmc8.svelte-cmrmc8.svelte-cmrmc8{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-cmrmc8>div.svelte-cmrmc8.svelte-cmrmc8{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-cmrmc8>div.svelte-cmrmc8>[name=\"Title\"].svelte-cmrmc8{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}";
    styleInject(css_248z$f,{"insertAt":"top"});

    /* src/ResetRequestNotice.svelte generated by Svelte v3.42.1 */

    function create_fragment$g(ctx) {
    	let div2;

    	return {
    		c() {
    			div2 = element("div");
    			div2.innerHTML = `<div class="svelte-cmrmc8"><div name="Title" class="svelte-cmrmc8">Requesting Password Reset...</div></div>`;
    			attr(div2, "class", "Dialog svelte-cmrmc8");
    		},
    		m(target, anchor) {
    			insert(target, div2, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div2);
    		}
    	};
    }

    class ResetRequestNotice extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, null, create_fragment$g, safe_not_equal, {});
    	}
    }

    var css_248z$e = ".Dialog.svelte-j6oh73.svelte-j6oh73.svelte-j6oh73{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-j6oh73>div.svelte-j6oh73.svelte-j6oh73{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-j6oh73>div.svelte-j6oh73>[name=\"Title\"].svelte-j6oh73{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}.Dialog.svelte-j6oh73>div.svelte-j6oh73>[name=\"CloseButton\"].svelte-j6oh73{display:block;position:absolute;top:-20px;right:-20px;width:20px;height:20px;border:solid 2px white;border-radius:50%;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2), 0px 0px 0px 1px lightgray;background-color:black;padding:0px;font-size:18px;font-weight:bold;line-height:12px;text-align:center;color:white;cursor:pointer}.Dialog.svelte-j6oh73>div.svelte-j6oh73>input.svelte-j6oh73{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:4px;border:solid 1px lightgray;border-radius:2px;font-size:16px}.Dialog.svelte-j6oh73>div.svelte-j6oh73>.Hint.svelte-j6oh73{display:inline-block;position:relative;left:2px;top:-2px;font-size:12px\n  }.Dialog.svelte-j6oh73>div.svelte-j6oh73>.invalid.Hint.svelte-j6oh73{color:red}.Dialog.svelte-j6oh73>div.svelte-j6oh73>.Block.svelte-j6oh73{display:block;margin:0px 0px 10px 0px;text-align:justify}.Dialog.svelte-j6oh73>div.svelte-j6oh73>button.svelte-j6oh73{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:6px;background-color:#2980B9;border:none;border-radius:4px;font-size:16px;font-weight:bold;color:white;cursor:pointer}.Dialog.svelte-j6oh73>div.svelte-j6oh73>button.svelte-j6oh73:disabled{opacity:0.3;cursor:auto}";
    styleInject(css_248z$e,{"insertAt":"top"});

    /* src/ResetRequestDialog.svelte generated by Svelte v3.42.1 */

    function create_fragment$f(ctx) {
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
    			div3.textContent = "That email will be sent immediately after submitting this request, the\n      link it contains will be valid for one hour.";
    			t7 = space();
    			input = element("input");
    			t8 = space();
    			div4 = element("div");
    			t9 = text(/*AddressMessage*/ ctx[2]);
    			t10 = space();
    			button = element("button");
    			t11 = text("SubmitRequest");
    			attr(div0, "name", "CloseButton");
    			attr(div0, "class", "svelte-j6oh73");
    			attr(div1, "name", "Title");
    			attr(div1, "class", "svelte-j6oh73");
    			attr(div2, "class", "Block svelte-j6oh73");
    			attr(div3, "class", "Block svelte-j6oh73");
    			attr(input, "type", "email");
    			attr(input, "placeholder", "your email address");
    			attr(input, "class", "svelte-j6oh73");
    			attr(div4, "class", "svelte-j6oh73");
    			toggle_class(div4, "Hint", true);
    			toggle_class(div4, "invalid", /*AddressLooksBad*/ ctx[1]);
    			attr(button, "name", "SubmitButton");
    			button.disabled = /*SubmitIsForbidden*/ ctx[3];
    			attr(button, "class", "svelte-j6oh73");
    			attr(div5, "class", "svelte-j6oh73");
    			attr(div6, "class", "Dialog svelte-j6oh73");
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
    					listen(div0, "click", closeDialog$2),
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

    function closeDialog$2(Event) {
    	Event.preventDefault();
    	Globals.define('State', '');
    }

    function instance$c($$self, $$props, $$invalidate) {
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
    					$$invalidate(2, AddressMessage = 'please, enter your email address');
    					break;
    				case ValueIsEMailAddress(EMailAddress):
    					$$invalidate(1, AddressLooksBad = false);
    					$$invalidate(2, AddressMessage = 'your email address looks acceptable');
    					break;
    				default:
    					$$invalidate(1, AddressLooksBad = true);
    					$$invalidate(2, AddressMessage = 'please, enter a valid email address');
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
    		init(this, options, instance$c, create_fragment$f, safe_not_equal, {});
    	}
    }

    var css_248z$d = ".Dialog.svelte-1ogkcjw.svelte-1ogkcjw.svelte-1ogkcjw{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-1ogkcjw>div.svelte-1ogkcjw.svelte-1ogkcjw{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-1ogkcjw>div.svelte-1ogkcjw>[name=\"Title\"].svelte-1ogkcjw{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}.Dialog.svelte-1ogkcjw>div.svelte-1ogkcjw>.Block.svelte-1ogkcjw{display:block;margin:0px 0px 10px 0px;text-align:justify}.Dialog.svelte-1ogkcjw>div.svelte-1ogkcjw>button.svelte-1ogkcjw{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:6px;background-color:#2980B9;border:none;border-radius:4px;font-size:16px;font-weight:bold;color:white;cursor:pointer}.Dialog.svelte-1ogkcjw>div.svelte-1ogkcjw>button.svelte-1ogkcjw:disabled{opacity:0.3;cursor:auto}";
    styleInject(css_248z$d,{"insertAt":"top"});

    /* src/ConfirmedNotice.svelte generated by Svelte v3.42.1 */

    function create_fragment$e(ctx) {
    	let div3;
    	let div2;
    	let div0;
    	let t1;
    	let div1;
    	let t3;
    	let button;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			div3 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			div0.textContent = "Account Confirmed";
    			t1 = space();
    			div1 = element("div");
    			div1.textContent = "Your account has been successfully confirmed. You may login now.";
    			t3 = space();
    			button = element("button");
    			button.textContent = "Ok";
    			attr(div0, "name", "Title");
    			attr(div0, "class", "svelte-1ogkcjw");
    			attr(div1, "class", "Block svelte-1ogkcjw");
    			attr(button, "class", "svelte-1ogkcjw");
    			attr(div2, "class", "svelte-1ogkcjw");
    			attr(div3, "class", "Dialog svelte-1ogkcjw");
    		},
    		m(target, anchor) {
    			insert(target, div3, anchor);
    			append(div3, div2);
    			append(div2, div0);
    			append(div2, t1);
    			append(div2, div1);
    			append(div2, t3);
    			append(div2, button);

    			if (!mounted) {
    				dispose = listen(button, "click", closeNotice$2);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div3);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    function closeNotice$2(Event) {
    	Event.preventDefault();
    	Globals.define('State', 'Login');
    }

    function instance$b($$self) {
    	return [];
    }

    class ConfirmedNotice extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$b, create_fragment$e, safe_not_equal, {});
    	}
    }

    var css_248z$c = ".Dialog.svelte-cmrmc8.svelte-cmrmc8.svelte-cmrmc8{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-cmrmc8>div.svelte-cmrmc8.svelte-cmrmc8{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-cmrmc8>div.svelte-cmrmc8>[name=\"Title\"].svelte-cmrmc8{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}";
    styleInject(css_248z$c,{"insertAt":"top"});

    /* src/ConfirmationNotice.svelte generated by Svelte v3.42.1 */

    function create_fragment$d(ctx) {
    	let div2;

    	return {
    		c() {
    			div2 = element("div");
    			div2.innerHTML = `<div class="svelte-cmrmc8"><div name="Title" class="svelte-cmrmc8">Confirming Account...</div></div>`;
    			attr(div2, "class", "Dialog svelte-cmrmc8");
    		},
    		m(target, anchor) {
    			insert(target, div2, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div2);
    		}
    	};
    }

    class ConfirmationNotice extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, null, create_fragment$d, safe_not_equal, {});
    	}
    }

    var css_248z$b = ".Dialog.svelte-1ogkcjw.svelte-1ogkcjw.svelte-1ogkcjw{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-1ogkcjw>div.svelte-1ogkcjw.svelte-1ogkcjw{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-1ogkcjw>div.svelte-1ogkcjw>[name=\"Title\"].svelte-1ogkcjw{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}.Dialog.svelte-1ogkcjw>div.svelte-1ogkcjw>.Block.svelte-1ogkcjw{display:block;margin:0px 0px 10px 0px;text-align:justify}.Dialog.svelte-1ogkcjw>div.svelte-1ogkcjw>button.svelte-1ogkcjw{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:6px;background-color:#2980B9;border:none;border-radius:4px;font-size:16px;font-weight:bold;color:white;cursor:pointer}.Dialog.svelte-1ogkcjw>div.svelte-1ogkcjw>button.svelte-1ogkcjw:disabled{opacity:0.3;cursor:auto}";
    styleInject(css_248z$b,{"insertAt":"top"});

    /* src/RenewedNotice.svelte generated by Svelte v3.42.1 */

    function create_fragment$c(ctx) {
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
    			div0.textContent = "Confirmation Message Sent";
    			t1 = space();
    			div1 = element("div");
    			div1.textContent = "Another confirmation message has been sent to the given email address.";
    			t3 = space();
    			div2 = element("div");
    			div2.textContent = "Please, open your mailbox, look for an email from VoltCloud.io and click\n      on the link it contains. This will automatically confirm your account.";
    			t5 = space();
    			button = element("button");
    			button.textContent = "Ok";
    			attr(div0, "name", "Title");
    			attr(div0, "class", "svelte-1ogkcjw");
    			attr(div1, "class", "Block svelte-1ogkcjw");
    			attr(div2, "class", "Block svelte-1ogkcjw");
    			attr(button, "class", "svelte-1ogkcjw");
    			attr(div3, "class", "svelte-1ogkcjw");
    			attr(div4, "class", "Dialog svelte-1ogkcjw");
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
    				dispose = listen(button, "click", closeNotice$1);
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

    function closeNotice$1(Event) {
    	Event.preventDefault();
    	Globals.define('State', '');
    }

    function instance$a($$self) {
    	return [];
    }

    class RenewedNotice extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$a, create_fragment$c, safe_not_equal, {});
    	}
    }

    var css_248z$a = ".Dialog.svelte-cmrmc8.svelte-cmrmc8.svelte-cmrmc8{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-cmrmc8>div.svelte-cmrmc8.svelte-cmrmc8{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-cmrmc8>div.svelte-cmrmc8>[name=\"Title\"].svelte-cmrmc8{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}";
    styleInject(css_248z$a,{"insertAt":"top"});

    /* src/RenewalNotice.svelte generated by Svelte v3.42.1 */

    function create_fragment$b(ctx) {
    	let div2;

    	return {
    		c() {
    			div2 = element("div");
    			div2.innerHTML = `<div class="svelte-cmrmc8"><div name="Title" class="svelte-cmrmc8">Sending another Confirmation Message...</div></div>`;
    			attr(div2, "class", "Dialog svelte-cmrmc8");
    		},
    		m(target, anchor) {
    			insert(target, div2, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div2);
    		}
    	};
    }

    class RenewalNotice extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, null, create_fragment$b, safe_not_equal, {});
    	}
    }

    var css_248z$9 = ".Dialog.svelte-j6oh73.svelte-j6oh73.svelte-j6oh73{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-j6oh73>div.svelte-j6oh73.svelte-j6oh73{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-j6oh73>div.svelte-j6oh73>[name=\"Title\"].svelte-j6oh73{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}.Dialog.svelte-j6oh73>div.svelte-j6oh73>[name=\"CloseButton\"].svelte-j6oh73{display:block;position:absolute;top:-20px;right:-20px;width:20px;height:20px;border:solid 2px white;border-radius:50%;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2), 0px 0px 0px 1px lightgray;background-color:black;padding:0px;font-size:18px;font-weight:bold;line-height:12px;text-align:center;color:white;cursor:pointer}.Dialog.svelte-j6oh73>div.svelte-j6oh73>input.svelte-j6oh73{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:4px;border:solid 1px lightgray;border-radius:2px;font-size:16px}.Dialog.svelte-j6oh73>div.svelte-j6oh73>.Hint.svelte-j6oh73{display:inline-block;position:relative;left:2px;top:-2px;font-size:12px\n  }.Dialog.svelte-j6oh73>div.svelte-j6oh73>.invalid.Hint.svelte-j6oh73{color:red}.Dialog.svelte-j6oh73>div.svelte-j6oh73>.Block.svelte-j6oh73{display:block;margin:0px 0px 10px 0px;text-align:justify}.Dialog.svelte-j6oh73>div.svelte-j6oh73>button.svelte-j6oh73{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:6px;background-color:#2980B9;border:none;border-radius:4px;font-size:16px;font-weight:bold;color:white;cursor:pointer}.Dialog.svelte-j6oh73>div.svelte-j6oh73>button.svelte-j6oh73:disabled{opacity:0.3;cursor:auto}";
    styleInject(css_248z$9,{"insertAt":"top"});

    /* src/RenewalDialog.svelte generated by Svelte v3.42.1 */

    function create_fragment$a(ctx) {
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
    			div1.textContent = "Confirmation Message Request";
    			t3 = space();
    			div2 = element("div");
    			div2.textContent = "Your account has been created, but not yet confirmed. If necessary, you\n      may request another confirmation email to be sent to your address.";
    			t5 = space();
    			div3 = element("div");
    			div3.textContent = "That email will be sent immediately after submitting this request, the\n      link it contains will be valid for twelve hours.";
    			t7 = space();
    			input = element("input");
    			t8 = space();
    			div4 = element("div");
    			t9 = text(/*AddressMessage*/ ctx[2]);
    			t10 = space();
    			button = element("button");
    			t11 = text("Request Confirmation Message");
    			attr(div0, "name", "CloseButton");
    			attr(div0, "class", "svelte-j6oh73");
    			attr(div1, "name", "Title");
    			attr(div1, "class", "svelte-j6oh73");
    			attr(div2, "class", "Block svelte-j6oh73");
    			attr(div3, "class", "Block svelte-j6oh73");
    			attr(input, "type", "email");
    			attr(input, "placeholder", "your email address");
    			attr(input, "class", "svelte-j6oh73");
    			attr(div4, "class", "svelte-j6oh73");
    			toggle_class(div4, "Hint", true);
    			toggle_class(div4, "invalid", /*AddressLooksBad*/ ctx[1]);
    			attr(button, "name", "SubmitButton");
    			button.disabled = /*SubmitIsForbidden*/ ctx[3];
    			attr(button, "class", "svelte-j6oh73");
    			attr(div5, "class", "svelte-j6oh73");
    			attr(div6, "class", "Dialog svelte-j6oh73");
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
    			Globals.define({ State: 'renewing' });

    			try {
    				yield focusOnApplication($Globals.ApplicationURL, $Globals.ApplicationId);
    				yield resendConfirmationEMailToCustomer(EMailAddress);
    			} catch(Signal) {
    				Globals.define({
    					State: 'CommunicationFailure',
    					FailureReason: Signal.toString()
    				});

    				return;
    			}

    			Globals.define({ State: 'renewed' });
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
    					$$invalidate(2, AddressMessage = 'please, enter your email address');
    					break;
    				case ValueIsEMailAddress(EMailAddress):
    					$$invalidate(1, AddressLooksBad = false);
    					$$invalidate(2, AddressMessage = 'your email address looks acceptable');
    					break;
    				default:
    					$$invalidate(1, AddressLooksBad = true);
    					$$invalidate(2, AddressMessage = 'please, enter a valid email address');
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

    class RenewalDialog extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$9, create_fragment$a, safe_not_equal, {});
    	}
    }

    var css_248z$8 = ".Dialog.svelte-1ogkcjw.svelte-1ogkcjw.svelte-1ogkcjw{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-1ogkcjw>div.svelte-1ogkcjw.svelte-1ogkcjw{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-1ogkcjw>div.svelte-1ogkcjw>[name=\"Title\"].svelte-1ogkcjw{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}.Dialog.svelte-1ogkcjw>div.svelte-1ogkcjw>.Block.svelte-1ogkcjw{display:block;margin:0px 0px 10px 0px;text-align:justify}.Dialog.svelte-1ogkcjw>div.svelte-1ogkcjw>button.svelte-1ogkcjw{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:6px;background-color:#2980B9;border:none;border-radius:4px;font-size:16px;font-weight:bold;color:white;cursor:pointer}.Dialog.svelte-1ogkcjw>div.svelte-1ogkcjw>button.svelte-1ogkcjw:disabled{opacity:0.3;cursor:auto}";
    styleInject(css_248z$8,{"insertAt":"top"});

    /* src/RegistrationFailureNotice.svelte generated by Svelte v3.42.1 */

    function create_fragment$9(ctx) {
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
    			div0.textContent = "Account Creation Failed";
    			t1 = space();
    			div1 = element("div");
    			div1.textContent = "Your account could not be created because the given email address is\n      currently used by somebody.";
    			t3 = space();
    			div2 = element("div");
    			div2.textContent = "Please try again with a different email address.";
    			t5 = space();
    			button = element("button");
    			button.textContent = "Ok";
    			attr(div0, "name", "Title");
    			attr(div0, "class", "svelte-1ogkcjw");
    			attr(div1, "class", "Block svelte-1ogkcjw");
    			attr(div2, "class", "Block svelte-1ogkcjw");
    			attr(button, "class", "svelte-1ogkcjw");
    			attr(div3, "class", "svelte-1ogkcjw");
    			attr(div4, "class", "Dialog svelte-1ogkcjw");
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
    				dispose = listen(button, "click", closeNotice);
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

    function closeNotice(Event) {
    	Event.preventDefault();
    	Globals.define('State', 'Registration');
    }

    function instance$8($$self) {
    	return [];
    }

    class RegistrationFailureNotice extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$8, create_fragment$9, safe_not_equal, {});
    	}
    }

    var css_248z$7 = ".Dialog.svelte-1ogkcjw.svelte-1ogkcjw.svelte-1ogkcjw{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-1ogkcjw>div.svelte-1ogkcjw.svelte-1ogkcjw{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-1ogkcjw>div.svelte-1ogkcjw>[name=\"Title\"].svelte-1ogkcjw{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}.Dialog.svelte-1ogkcjw>div.svelte-1ogkcjw>.Block.svelte-1ogkcjw{display:block;margin:0px 0px 10px 0px;text-align:justify}.Dialog.svelte-1ogkcjw>div.svelte-1ogkcjw>button.svelte-1ogkcjw{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:6px;background-color:#2980B9;border:none;border-radius:4px;font-size:16px;font-weight:bold;color:white;cursor:pointer}.Dialog.svelte-1ogkcjw>div.svelte-1ogkcjw>button.svelte-1ogkcjw:disabled{opacity:0.3;cursor:auto}";
    styleInject(css_248z$7,{"insertAt":"top"});

    /* src/RegistrationSuccessNotice.svelte generated by Svelte v3.42.1 */

    function create_fragment$8(ctx) {
    	let div5;
    	let div4;
    	let div0;
    	let t1;
    	let div1;
    	let t3;
    	let div2;
    	let t5;
    	let div3;
    	let t7;
    	let button;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			div5 = element("div");
    			div4 = element("div");
    			div0 = element("div");
    			div0.textContent = "Confirmation Message Sent";
    			t1 = space();
    			div1 = element("div");
    			div1.textContent = "Your account has been successfully created and a confirmation message\n      sent to the given email address.";
    			t3 = space();
    			div2 = element("div");
    			div2.textContent = "Please, check your mailbox, look for an email from VoltCloud.io and click\n      on the link it contains in order to complete the registration process.";
    			t5 = space();
    			div3 = element("div");
    			div3.textContent = "If you will not confirm your email address within 12 hours, your account\n      will be removed again.";
    			t7 = space();
    			button = element("button");
    			button.textContent = "Ok";
    			attr(div0, "name", "Title");
    			attr(div0, "class", "svelte-1ogkcjw");
    			attr(div1, "class", "Block svelte-1ogkcjw");
    			attr(div2, "class", "Block svelte-1ogkcjw");
    			attr(div3, "class", "Block svelte-1ogkcjw");
    			attr(button, "class", "svelte-1ogkcjw");
    			attr(div4, "class", "svelte-1ogkcjw");
    			attr(div5, "class", "Dialog svelte-1ogkcjw");
    		},
    		m(target, anchor) {
    			insert(target, div5, anchor);
    			append(div5, div4);
    			append(div4, div0);
    			append(div4, t1);
    			append(div4, div1);
    			append(div4, t3);
    			append(div4, div2);
    			append(div4, t5);
    			append(div4, div3);
    			append(div4, t7);
    			append(div4, button);

    			if (!mounted) {
    				dispose = listen(button, "click", closeMessage);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div5);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    function closeMessage(Event) {
    	Event.preventDefault();
    	Globals.define('State', '');
    }

    function instance$7($$self) {
    	return [];
    }

    class RegistrationSuccessNotice extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$7, create_fragment$8, safe_not_equal, {});
    	}
    }

    var css_248z$6 = ".Dialog.svelte-cmrmc8.svelte-cmrmc8.svelte-cmrmc8{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-cmrmc8>div.svelte-cmrmc8.svelte-cmrmc8{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-cmrmc8>div.svelte-cmrmc8>[name=\"Title\"].svelte-cmrmc8{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}";
    styleInject(css_248z$6,{"insertAt":"top"});

    /* src/RegistrationNotice.svelte generated by Svelte v3.42.1 */

    function create_fragment$7(ctx) {
    	let div2;

    	return {
    		c() {
    			div2 = element("div");
    			div2.innerHTML = `<div class="svelte-cmrmc8"><div name="Title" class="svelte-cmrmc8">Creating Account...</div></div>`;
    			attr(div2, "class", "Dialog svelte-cmrmc8");
    		},
    		m(target, anchor) {
    			insert(target, div2, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div2);
    		}
    	};
    }

    class RegistrationNotice extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, null, create_fragment$7, safe_not_equal, {});
    	}
    }

    var css_248z$5 = ".Dialog.svelte-fv1h5q.svelte-fv1h5q.svelte-fv1h5q{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-fv1h5q>div.svelte-fv1h5q.svelte-fv1h5q{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-fv1h5q>div.svelte-fv1h5q>[name=\"Title\"].svelte-fv1h5q{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}.Dialog.svelte-fv1h5q>div.svelte-fv1h5q>[name=\"CloseButton\"].svelte-fv1h5q{display:block;position:absolute;top:-20px;right:-20px;width:20px;height:20px;border:solid 2px white;border-radius:50%;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2), 0px 0px 0px 1px lightgray;background-color:black;padding:0px;font-size:18px;font-weight:bold;line-height:12px;text-align:center;color:white;cursor:pointer}.Dialog.svelte-fv1h5q a.svelte-fv1h5q.svelte-fv1h5q,.Dialog.svelte-fv1h5q a.svelte-fv1h5q.svelte-fv1h5q:visited{color:#2980B9;text-decoration:underline}.Dialog.svelte-fv1h5q>div.svelte-fv1h5q>input.svelte-fv1h5q{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:4px;border:solid 1px lightgray;border-radius:2px;font-size:16px}.Dialog.svelte-fv1h5q>div .Hint.svelte-fv1h5q.svelte-fv1h5q{display:inline-block;position:relative;left:2px;top:-2px;font-size:12px\n  }.Dialog.svelte-fv1h5q>div .invalid.Hint.svelte-fv1h5q.svelte-fv1h5q{color:red}.Dialog.svelte-fv1h5q>div.svelte-fv1h5q>button.svelte-fv1h5q{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:6px;background-color:#2980B9;border:none;border-radius:4px;font-size:16px;font-weight:bold;color:white;cursor:pointer}.Dialog.svelte-fv1h5q>div.svelte-fv1h5q>button.svelte-fv1h5q:disabled{opacity:0.3;cursor:auto}.Dialog.svelte-fv1h5q>div.svelte-fv1h5q>[name=\"LegalRow\"].svelte-fv1h5q{display:block;position:relative;padding-top:10px;text-align:right}";
    styleInject(css_248z$5,{"insertAt":"top"});

    /* src/RegistrationDialog.svelte generated by Svelte v3.42.1 */

    function create_fragment$6(ctx) {
    	let div12;
    	let div11;
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
    	let input2;
    	let t10;
    	let div4;
    	let t11;
    	let t12;
    	let div9;
    	let div5;
    	let t13;
    	let a0;
    	let t15;
    	let input3;
    	let t16;
    	let div6;
    	let t17;
    	let t18;
    	let div7;
    	let t19;
    	let a1;
    	let t21;
    	let input4;
    	let t22;
    	let div8;
    	let t23;
    	let t24;
    	let button;
    	let t25;
    	let t26;
    	let div10;
    	let t27;
    	let a2;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			div12 = element("div");
    			div11 = element("div");
    			div0 = element("div");
    			div0.textContent = "×";
    			t1 = space();
    			div1 = element("div");
    			div1.textContent = "User Registration";
    			t3 = space();
    			input0 = element("input");
    			t4 = space();
    			div2 = element("div");
    			t5 = text(/*AddressMessage*/ ctx[8]);
    			t6 = space();
    			input1 = element("input");
    			t7 = space();
    			div3 = element("div");
    			t8 = text(/*PasswordMessage*/ ctx[9]);
    			t9 = space();
    			input2 = element("input");
    			t10 = space();
    			div4 = element("div");
    			t11 = text(/*ConfirmationMessage*/ ctx[10]);
    			t12 = space();
    			div9 = element("div");
    			div5 = element("div");
    			t13 = text("Agreeing to ");
    			a0 = element("a");
    			a0.textContent = "Data Privacy Statement?";
    			t15 = space();
    			input3 = element("input");
    			t16 = space();
    			div6 = element("div");
    			t17 = text(/*DPSAgreementMessage*/ ctx[11]);
    			t18 = space();
    			div7 = element("div");
    			t19 = text("Agreeing to ");
    			a1 = element("a");
    			a1.textContent = "Terms of Service?";
    			t21 = space();
    			input4 = element("input");
    			t22 = space();
    			div8 = element("div");
    			t23 = text(/*TOSAgreementMessage*/ ctx[12]);
    			t24 = space();
    			button = element("button");
    			t25 = text("Create Your Account");
    			t26 = space();
    			div10 = element("div");
    			t27 = text("Already have an account? ");
    			a2 = element("a");
    			a2.textContent = "Log in!";
    			attr(div0, "name", "CloseButton");
    			attr(div0, "class", "svelte-fv1h5q");
    			attr(div1, "name", "Title");
    			attr(div1, "class", "svelte-fv1h5q");
    			attr(input0, "type", "email");
    			attr(input0, "placeholder", "your email address");
    			attr(input0, "class", "svelte-fv1h5q");
    			attr(div2, "class", "svelte-fv1h5q");
    			toggle_class(div2, "Hint", true);
    			toggle_class(div2, "invalid", /*AddressLooksBad*/ ctx[1]);
    			attr(input1, "type", "password");
    			attr(input1, "placeholder", "your password");
    			attr(input1, "class", "svelte-fv1h5q");
    			attr(div3, "class", "svelte-fv1h5q");
    			toggle_class(div3, "Hint", true);
    			toggle_class(div3, "invalid", /*PasswordLooksBad*/ ctx[3]);
    			attr(input2, "type", "password");
    			attr(input2, "placeholder", "confirm your password");
    			attr(input2, "class", "svelte-fv1h5q");
    			attr(div4, "class", "svelte-fv1h5q");
    			toggle_class(div4, "Hint", true);
    			toggle_class(div4, "invalid", /*ConfirmationLooksBad*/ ctx[5]);
    			attr(a0, "href", "#/");
    			attr(a0, "class", "svelte-fv1h5q");
    			attr(input3, "type", "checkbox");
    			attr(div6, "class", "svelte-fv1h5q");
    			toggle_class(div6, "Hint", true);
    			toggle_class(div6, "invalid", !/*DPSAgreementChecked*/ ctx[6]);
    			attr(a1, "href", "https://www.appstudio.dev/app/legal/legal.php");
    			attr(a1, "class", "svelte-fv1h5q");
    			attr(input4, "type", "checkbox");
    			attr(div8, "class", "svelte-fv1h5q");
    			toggle_class(div8, "Hint", true);
    			toggle_class(div8, "invalid", !/*TOSAgreementChecked*/ ctx[7]);
    			attr(div9, "name", "LegalRow");
    			attr(div9, "class", "svelte-fv1h5q");
    			button.disabled = /*SubmitIsForbidden*/ ctx[13];
    			attr(button, "class", "svelte-fv1h5q");
    			attr(a2, "href", "#/");
    			attr(a2, "class", "svelte-fv1h5q");
    			set_style(div10, "text-align", "center");
    			attr(div11, "class", "svelte-fv1h5q");
    			attr(div12, "class", "Dialog svelte-fv1h5q");
    		},
    		m(target, anchor) {
    			insert(target, div12, anchor);
    			append(div12, div11);
    			append(div11, div0);
    			append(div11, t1);
    			append(div11, div1);
    			append(div11, t3);
    			append(div11, input0);
    			set_input_value(input0, /*EMailAddress*/ ctx[0]);
    			append(div11, t4);
    			append(div11, div2);
    			append(div2, t5);
    			append(div11, t6);
    			append(div11, input1);
    			set_input_value(input1, /*Password*/ ctx[2]);
    			append(div11, t7);
    			append(div11, div3);
    			append(div3, t8);
    			append(div11, t9);
    			append(div11, input2);
    			set_input_value(input2, /*Confirmation*/ ctx[4]);
    			append(div11, t10);
    			append(div11, div4);
    			append(div4, t11);
    			append(div11, t12);
    			append(div11, div9);
    			append(div9, div5);
    			append(div5, t13);
    			append(div5, a0);
    			append(div5, t15);
    			append(div5, input3);
    			input3.checked = /*DPSAgreementChecked*/ ctx[6];
    			append(div9, t16);
    			append(div9, div6);
    			append(div6, t17);
    			append(div9, t18);
    			append(div9, div7);
    			append(div7, t19);
    			append(div7, a1);
    			append(div7, t21);
    			append(div7, input4);
    			input4.checked = /*TOSAgreementChecked*/ ctx[7];
    			append(div9, t22);
    			append(div9, div8);
    			append(div8, t23);
    			append(div11, t24);
    			append(div11, button);
    			append(button, t25);
    			append(div11, t26);
    			append(div11, div10);
    			append(div10, t27);
    			append(div10, a2);

    			if (!mounted) {
    				dispose = [
    					listen(div0, "click", closeDialog),
    					listen(input0, "input", /*input0_input_handler*/ ctx[15]),
    					listen(input1, "input", /*input1_input_handler*/ ctx[16]),
    					listen(input2, "input", /*input2_input_handler*/ ctx[17]),
    					listen(a0, "click", showLegal$1),
    					listen(input3, "change", /*input3_change_handler*/ ctx[18]),
    					listen(input4, "change", /*input4_change_handler*/ ctx[19]),
    					listen(button, "click", /*createAccount*/ ctx[14]),
    					listen(a2, "click", startLogin$1)
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*EMailAddress*/ 1 && input0.value !== /*EMailAddress*/ ctx[0]) {
    				set_input_value(input0, /*EMailAddress*/ ctx[0]);
    			}

    			if (dirty & /*AddressMessage*/ 256) set_data(t5, /*AddressMessage*/ ctx[8]);

    			if (dirty & /*AddressLooksBad*/ 2) {
    				toggle_class(div2, "invalid", /*AddressLooksBad*/ ctx[1]);
    			}

    			if (dirty & /*Password*/ 4 && input1.value !== /*Password*/ ctx[2]) {
    				set_input_value(input1, /*Password*/ ctx[2]);
    			}

    			if (dirty & /*PasswordMessage*/ 512) set_data(t8, /*PasswordMessage*/ ctx[9]);

    			if (dirty & /*PasswordLooksBad*/ 8) {
    				toggle_class(div3, "invalid", /*PasswordLooksBad*/ ctx[3]);
    			}

    			if (dirty & /*Confirmation*/ 16 && input2.value !== /*Confirmation*/ ctx[4]) {
    				set_input_value(input2, /*Confirmation*/ ctx[4]);
    			}

    			if (dirty & /*ConfirmationMessage*/ 1024) set_data(t11, /*ConfirmationMessage*/ ctx[10]);

    			if (dirty & /*ConfirmationLooksBad*/ 32) {
    				toggle_class(div4, "invalid", /*ConfirmationLooksBad*/ ctx[5]);
    			}

    			if (dirty & /*DPSAgreementChecked*/ 64) {
    				input3.checked = /*DPSAgreementChecked*/ ctx[6];
    			}

    			if (dirty & /*DPSAgreementMessage*/ 2048) set_data(t17, /*DPSAgreementMessage*/ ctx[11]);

    			if (dirty & /*DPSAgreementChecked*/ 64) {
    				toggle_class(div6, "invalid", !/*DPSAgreementChecked*/ ctx[6]);
    			}

    			if (dirty & /*TOSAgreementChecked*/ 128) {
    				input4.checked = /*TOSAgreementChecked*/ ctx[7];
    			}

    			if (dirty & /*TOSAgreementMessage*/ 4096) set_data(t23, /*TOSAgreementMessage*/ ctx[12]);

    			if (dirty & /*TOSAgreementChecked*/ 128) {
    				toggle_class(div8, "invalid", !/*TOSAgreementChecked*/ ctx[7]);
    			}

    			if (dirty & /*SubmitIsForbidden*/ 8192) {
    				button.disabled = /*SubmitIsForbidden*/ ctx[13];
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div12);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function closeDialog(Event) {
    	Event.preventDefault();
    	Globals.define('State', '');
    }

    function showLegal$1(Event) {
    	Event.preventDefault();
    	document.location.href = '#/Legal';
    }

    function startLogin$1(Event) {
    	Event.preventDefault();
    	Globals.define('State', 'Login');
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let SubmitIsForbidden;
    	let $Globals;
    	component_subscribe($$self, Globals, $$value => $$invalidate(20, $Globals = $$value));

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
    	let Confirmation, ConfirmationLooksBad, ConfirmationMessage;
    	let DPSAgreementChecked, DPSAgreementMessage;
    	let TOSAgreementChecked, TOSAgreementMessage;
    	EMailAddress = $Globals.EMailAddress || '';
    	Password = '';
    	DPSAgreementChecked = TOSAgreementChecked = false;

    	function createAccount(Event) {
    		return __awaiter(this, void 0, void 0, function* () {
    			Event.preventDefault();

    			Globals.define({
    				State: 'registering',
    				EMailAddress,
    				Password
    			});

    			try {
    				yield focusOnApplication($Globals.ApplicationURL, $Globals.ApplicationId);
    				yield focusOnNewCustomer(EMailAddress, Password);
    			} catch(Signal) {
    				if (Signal.name === 'ConflictError') {
    					Globals.define('State', 'RegistrationFailed');
    				} else {
    					Globals.define({
    						State: 'CommunicationFailure',
    						FailureReason: Signal.toString()
    					});
    				}

    				return;
    			}

    			Globals.define('State', 'registered');
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

    	function input2_input_handler() {
    		Confirmation = this.value;
    		$$invalidate(4, Confirmation);
    	}

    	function input3_change_handler() {
    		DPSAgreementChecked = this.checked;
    		$$invalidate(6, DPSAgreementChecked);
    	}

    	function input4_change_handler() {
    		TOSAgreementChecked = this.checked;
    		$$invalidate(7, TOSAgreementChecked);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*EMailAddress*/ 1) {
    			switch (true) {
    				case EMailAddress.trim() === '':
    					$$invalidate(1, AddressLooksBad = true);
    					$$invalidate(8, AddressMessage = 'please, enter your email address');
    					break;
    				case ValueIsEMailAddress(EMailAddress):
    					$$invalidate(1, AddressLooksBad = false);
    					$$invalidate(8, AddressMessage = 'your email address looks acceptable');
    					break;
    				default:
    					$$invalidate(1, AddressLooksBad = true);
    					$$invalidate(8, AddressMessage = 'please, enter a valid email address');
    			}
    		}

    		if ($$self.$$.dirty & /*Password*/ 4) {
    			switch (true) {
    				case Password === '':
    					$$invalidate(3, PasswordLooksBad = true);
    					$$invalidate(9, PasswordMessage = 'please, enter your password');
    					break;
    				case Password.length < 10:
    					$$invalidate(3, PasswordLooksBad = true);
    					$$invalidate(9, PasswordMessage = 'your password is too short');
    					break;
    				case !(/[0-9]/).test(Password):
    					$$invalidate(3, PasswordLooksBad = true);
    					$$invalidate(9, PasswordMessage = 'your password lacks any digits');
    					break;
    				case Password.toLowerCase() === Password:
    					$$invalidate(3, PasswordLooksBad = true);
    					$$invalidate(9, PasswordMessage = 'your password lacks any uppercase characters');
    					break;
    				case Password.toUpperCase() === Password:
    					$$invalidate(3, PasswordLooksBad = true);
    					$$invalidate(9, PasswordMessage = 'your password lacks any lowercase characters');
    					break;
    				default:
    					$$invalidate(3, PasswordLooksBad = false);
    					$$invalidate(9, PasswordMessage = 'your password looks acceptable');
    			}
    		}

    		if ($$self.$$.dirty & /*Confirmation, Password*/ 20) {
    			switch (true) {
    				case Confirmation === '':
    					$$invalidate(5, ConfirmationLooksBad = true);
    					$$invalidate(10, ConfirmationMessage = 'please, enter your password again');
    					break;
    				case Confirmation !== Password:
    					$$invalidate(5, ConfirmationLooksBad = true);
    					$$invalidate(10, ConfirmationMessage = 'password and confirmation differ');
    					break;
    				default:
    					$$invalidate(5, ConfirmationLooksBad = false);
    					$$invalidate(10, ConfirmationMessage = 'password and confirmation are equal');
    			}
    		}

    		if ($$self.$$.dirty & /*DPSAgreementChecked, TOSAgreementChecked*/ 192) {
    			{
    				$$invalidate(11, DPSAgreementMessage = DPSAgreementChecked
    				? 'thank you'
    				: 'please, agree to apply for an account');

    				$$invalidate(12, TOSAgreementMessage = TOSAgreementChecked
    				? 'thank you'
    				: 'please, agree to apply for an account');
    			}
    		}

    		if ($$self.$$.dirty & /*AddressLooksBad, PasswordLooksBad, ConfirmationLooksBad, DPSAgreementChecked, TOSAgreementChecked*/ 234) {
    			$$invalidate(13, SubmitIsForbidden = AddressLooksBad || PasswordLooksBad || ConfirmationLooksBad || !DPSAgreementChecked || !TOSAgreementChecked);
    		}
    	};

    	return [
    		EMailAddress,
    		AddressLooksBad,
    		Password,
    		PasswordLooksBad,
    		Confirmation,
    		ConfirmationLooksBad,
    		DPSAgreementChecked,
    		TOSAgreementChecked,
    		AddressMessage,
    		PasswordMessage,
    		ConfirmationMessage,
    		DPSAgreementMessage,
    		TOSAgreementMessage,
    		SubmitIsForbidden,
    		createAccount,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler,
    		input3_change_handler,
    		input4_change_handler
    	];
    }

    class RegistrationDialog extends SvelteComponent {
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
          <ul class="svelte-1tfx5dq"><li>your email address</li></ul></li> 
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
          (including your email address, your first and last name and wether
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
    					listen(div2, "click", startLogin),
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

    function startLogin(Event) {
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
    				$$slots: { default: [create_default_slot_18] },
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

    // (89:4) {#if SubPath === '#/Legal'}
    function create_if_block_17(ctx) {
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

    // (69:2) {#if $Globals.loggedIn}
    function create_if_block(ctx) {
    	let notepage;
    	let current;

    	notepage = new NotePage({
    			props: {
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			}
    		});

    	return {
    		c() {
    			create_component(notepage.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(notepage, target, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const notepage_changes = {};

    			if (dirty & /*$$scope, $Globals*/ 10) {
    				notepage_changes.$$scope = { dirty, ctx };
    			}

    			notepage.$set(notepage_changes);
    		},
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

    // (93:8) {#if $Globals.State === 'Registration'}
    function create_if_block_36(ctx) {
    	let overlay;
    	let current;

    	overlay = new Overlay({
    			props: {
    				$$slots: { default: [create_default_slot_37] },
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

    // (93:55) <Overlay>
    function create_default_slot_37(ctx) {
    	let registrationdialog;
    	let current;
    	registrationdialog = new RegistrationDialog({});

    	return {
    		c() {
    			create_component(registrationdialog.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(registrationdialog, target, anchor);
    			current = true;
    		},
    		i(local) {
    			if (current) return;
    			transition_in(registrationdialog.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(registrationdialog.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(registrationdialog, detaching);
    		}
    	};
    }

    // (94:8) {#if $Globals.State === 'registering'}
    function create_if_block_35(ctx) {
    	let overlay;
    	let current;

    	overlay = new Overlay({
    			props: {
    				$$slots: { default: [create_default_slot_36] },
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

    // (94:55) <Overlay>
    function create_default_slot_36(ctx) {
    	let registrationnotice;
    	let current;
    	registrationnotice = new RegistrationNotice({});

    	return {
    		c() {
    			create_component(registrationnotice.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(registrationnotice, target, anchor);
    			current = true;
    		},
    		i(local) {
    			if (current) return;
    			transition_in(registrationnotice.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(registrationnotice.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(registrationnotice, detaching);
    		}
    	};
    }

    // (95:8) {#if $Globals.State === 'registered'}
    function create_if_block_34(ctx) {
    	let overlay;
    	let current;

    	overlay = new Overlay({
    			props: {
    				$$slots: { default: [create_default_slot_35] },
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

    // (95:55) <Overlay>
    function create_default_slot_35(ctx) {
    	let registrationsuccessnotice;
    	let current;
    	registrationsuccessnotice = new RegistrationSuccessNotice({});

    	return {
    		c() {
    			create_component(registrationsuccessnotice.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(registrationsuccessnotice, target, anchor);
    			current = true;
    		},
    		i(local) {
    			if (current) return;
    			transition_in(registrationsuccessnotice.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(registrationsuccessnotice.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(registrationsuccessnotice, detaching);
    		}
    	};
    }

    // (96:8) {#if $Globals.State === 'RegistrationFailed'}
    function create_if_block_33(ctx) {
    	let overlay;
    	let current;

    	overlay = new Overlay({
    			props: {
    				$$slots: { default: [create_default_slot_34] },
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

    // (96:55) <Overlay>
    function create_default_slot_34(ctx) {
    	let registrationfailurenotice;
    	let current;
    	registrationfailurenotice = new RegistrationFailureNotice({});

    	return {
    		c() {
    			create_component(registrationfailurenotice.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(registrationfailurenotice, target, anchor);
    			current = true;
    		},
    		i(local) {
    			if (current) return;
    			transition_in(registrationfailurenotice.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(registrationfailurenotice.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(registrationfailurenotice, detaching);
    		}
    	};
    }

    // (97:8) {#if $Globals.State === 'RenewalRequest'}
    function create_if_block_32(ctx) {
    	let overlay;
    	let current;

    	overlay = new Overlay({
    			props: {
    				$$slots: { default: [create_default_slot_33] },
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

    // (97:55) <Overlay>
    function create_default_slot_33(ctx) {
    	let renewaldialog;
    	let current;
    	renewaldialog = new RenewalDialog({});

    	return {
    		c() {
    			create_component(renewaldialog.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(renewaldialog, target, anchor);
    			current = true;
    		},
    		i(local) {
    			if (current) return;
    			transition_in(renewaldialog.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(renewaldialog.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(renewaldialog, detaching);
    		}
    	};
    }

    // (98:8) {#if $Globals.State === 'renewing'}
    function create_if_block_31(ctx) {
    	let overlay;
    	let current;

    	overlay = new Overlay({
    			props: {
    				$$slots: { default: [create_default_slot_32] },
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

    // (98:55) <Overlay>
    function create_default_slot_32(ctx) {
    	let renewalnotice;
    	let current;
    	renewalnotice = new RenewalNotice({});

    	return {
    		c() {
    			create_component(renewalnotice.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(renewalnotice, target, anchor);
    			current = true;
    		},
    		i(local) {
    			if (current) return;
    			transition_in(renewalnotice.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(renewalnotice.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(renewalnotice, detaching);
    		}
    	};
    }

    // (99:8) {#if $Globals.State === 'renewed'}
    function create_if_block_30(ctx) {
    	let overlay;
    	let current;

    	overlay = new Overlay({
    			props: {
    				$$slots: { default: [create_default_slot_31] },
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

    // (99:55) <Overlay>
    function create_default_slot_31(ctx) {
    	let renewednotice;
    	let current;
    	renewednotice = new RenewedNotice({});

    	return {
    		c() {
    			create_component(renewednotice.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(renewednotice, target, anchor);
    			current = true;
    		},
    		i(local) {
    			if (current) return;
    			transition_in(renewednotice.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(renewednotice.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(renewednotice, detaching);
    		}
    	};
    }

    // (100:8) {#if $Globals.State === 'confirming'}
    function create_if_block_29(ctx) {
    	let overlay;
    	let current;

    	overlay = new Overlay({
    			props: {
    				$$slots: { default: [create_default_slot_30] },
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

    // (100:55) <Overlay>
    function create_default_slot_30(ctx) {
    	let confirmationnotice;
    	let current;
    	confirmationnotice = new ConfirmationNotice({});

    	return {
    		c() {
    			create_component(confirmationnotice.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(confirmationnotice, target, anchor);
    			current = true;
    		},
    		i(local) {
    			if (current) return;
    			transition_in(confirmationnotice.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(confirmationnotice.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(confirmationnotice, detaching);
    		}
    	};
    }

    // (101:8) {#if $Globals.State === 'confirmed'}
    function create_if_block_28(ctx) {
    	let overlay;
    	let current;

    	overlay = new Overlay({
    			props: {
    				$$slots: { default: [create_default_slot_29] },
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

    // (101:55) <Overlay>
    function create_default_slot_29(ctx) {
    	let confirmednotice;
    	let current;
    	confirmednotice = new ConfirmedNotice({});

    	return {
    		c() {
    			create_component(confirmednotice.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(confirmednotice, target, anchor);
    			current = true;
    		},
    		i(local) {
    			if (current) return;
    			transition_in(confirmednotice.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(confirmednotice.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(confirmednotice, detaching);
    		}
    	};
    }

    // (102:8) {#if $Globals.State === 'ResetRequest'}
    function create_if_block_27(ctx) {
    	let overlay;
    	let current;

    	overlay = new Overlay({
    			props: {
    				$$slots: { default: [create_default_slot_28] },
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

    // (102:55) <Overlay>
    function create_default_slot_28(ctx) {
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

    // (103:8) {#if $Globals.State === 'requestingReset'}
    function create_if_block_26(ctx) {
    	let overlay;
    	let current;

    	overlay = new Overlay({
    			props: {
    				$$slots: { default: [create_default_slot_27] },
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

    // (103:55) <Overlay>
    function create_default_slot_27(ctx) {
    	let resetrequestnotice;
    	let current;
    	resetrequestnotice = new ResetRequestNotice({});

    	return {
    		c() {
    			create_component(resetrequestnotice.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(resetrequestnotice, target, anchor);
    			current = true;
    		},
    		i(local) {
    			if (current) return;
    			transition_in(resetrequestnotice.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(resetrequestnotice.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(resetrequestnotice, detaching);
    		}
    	};
    }

    // (104:8) {#if $Globals.State === 'ResetRequested'}
    function create_if_block_25(ctx) {
    	let overlay;
    	let current;

    	overlay = new Overlay({
    			props: {
    				$$slots: { default: [create_default_slot_26] },
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

    // (104:55) <Overlay>
    function create_default_slot_26(ctx) {
    	let resetrequestednotice;
    	let current;
    	resetrequestednotice = new ResetRequestedNotice({});

    	return {
    		c() {
    			create_component(resetrequestednotice.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(resetrequestednotice, target, anchor);
    			current = true;
    		},
    		i(local) {
    			if (current) return;
    			transition_in(resetrequestednotice.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(resetrequestednotice.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(resetrequestednotice, detaching);
    		}
    	};
    }

    // (105:8) {#if $Globals.State === 'ResetPassword'}
    function create_if_block_24(ctx) {
    	let overlay;
    	let current;

    	overlay = new Overlay({
    			props: {
    				$$slots: { default: [create_default_slot_25] },
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

    // (105:55) <Overlay>
    function create_default_slot_25(ctx) {
    	let passwordresetdialog;
    	let current;
    	passwordresetdialog = new PasswordResetDialog({});

    	return {
    		c() {
    			create_component(passwordresetdialog.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(passwordresetdialog, target, anchor);
    			current = true;
    		},
    		i(local) {
    			if (current) return;
    			transition_in(passwordresetdialog.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(passwordresetdialog.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(passwordresetdialog, detaching);
    		}
    	};
    }

    // (106:8) {#if $Globals.State === 'resettingPassword'}
    function create_if_block_23(ctx) {
    	let overlay;
    	let current;

    	overlay = new Overlay({
    			props: {
    				$$slots: { default: [create_default_slot_24] },
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

    // (106:55) <Overlay>
    function create_default_slot_24(ctx) {
    	let passwordresetnotice;
    	let current;
    	passwordresetnotice = new PasswordResetNotice({});

    	return {
    		c() {
    			create_component(passwordresetnotice.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(passwordresetnotice, target, anchor);
    			current = true;
    		},
    		i(local) {
    			if (current) return;
    			transition_in(passwordresetnotice.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(passwordresetnotice.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(passwordresetnotice, detaching);
    		}
    	};
    }

    // (107:8) {#if $Globals.State === 'PasswordReset'}
    function create_if_block_22(ctx) {
    	let overlay;
    	let current;

    	overlay = new Overlay({
    			props: {
    				$$slots: { default: [create_default_slot_23] },
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

    // (107:55) <Overlay>
    function create_default_slot_23(ctx) {
    	let passwordresetsuccessnotice;
    	let current;
    	passwordresetsuccessnotice = new PasswordResetSuccessNotice({});

    	return {
    		c() {
    			create_component(passwordresetsuccessnotice.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(passwordresetsuccessnotice, target, anchor);
    			current = true;
    		},
    		i(local) {
    			if (current) return;
    			transition_in(passwordresetsuccessnotice.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(passwordresetsuccessnotice.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(passwordresetsuccessnotice, detaching);
    		}
    	};
    }

    // (108:8) {#if $Globals.State === 'Login'}
    function create_if_block_21(ctx) {
    	let overlay;
    	let current;

    	overlay = new Overlay({
    			props: {
    				$$slots: { default: [create_default_slot_22] },
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

    // (108:55) <Overlay>
    function create_default_slot_22(ctx) {
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

    // (109:8) {#if $Globals.State === 'sendingLogin'}
    function create_if_block_20(ctx) {
    	let overlay;
    	let current;

    	overlay = new Overlay({
    			props: {
    				$$slots: { default: [create_default_slot_21] },
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

    // (109:55) <Overlay>
    function create_default_slot_21(ctx) {
    	let loginnotice;
    	let current;
    	loginnotice = new LoginNotice({});

    	return {
    		c() {
    			create_component(loginnotice.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(loginnotice, target, anchor);
    			current = true;
    		},
    		i(local) {
    			if (current) return;
    			transition_in(loginnotice.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(loginnotice.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(loginnotice, detaching);
    		}
    	};
    }

    // (110:8) {#if $Globals.State === 'LoginFailure'}
    function create_if_block_19(ctx) {
    	let overlay;
    	let current;

    	overlay = new Overlay({
    			props: {
    				$$slots: { default: [create_default_slot_20] },
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

    // (110:55) <Overlay>
    function create_default_slot_20(ctx) {
    	let loginfailurenotice;
    	let current;
    	loginfailurenotice = new LoginFailureNotice({});

    	return {
    		c() {
    			create_component(loginfailurenotice.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(loginfailurenotice, target, anchor);
    			current = true;
    		},
    		i(local) {
    			if (current) return;
    			transition_in(loginfailurenotice.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(loginfailurenotice.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(loginfailurenotice, detaching);
    		}
    	};
    }

    // (111:8) {#if $Globals.State === 'CommunicationFailure'}
    function create_if_block_18(ctx) {
    	let overlay;
    	let current;

    	overlay = new Overlay({
    			props: {
    				$$slots: { default: [create_default_slot_19] },
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

    // (111:55) <Overlay>
    function create_default_slot_19(ctx) {
    	let communicationfailurenotice;
    	let current;
    	communicationfailurenotice = new CommunicationFailureNotice({});

    	return {
    		c() {
    			create_component(communicationfailurenotice.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(communicationfailurenotice, target, anchor);
    			current = true;
    		},
    		i(local) {
    			if (current) return;
    			transition_in(communicationfailurenotice.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(communicationfailurenotice.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(communicationfailurenotice, detaching);
    		}
    	};
    }

    // (92:6) <InfoPage>
    function create_default_slot_18(ctx) {
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let t4;
    	let t5;
    	let t6;
    	let t7;
    	let t8;
    	let t9;
    	let t10;
    	let t11;
    	let t12;
    	let t13;
    	let t14;
    	let t15;
    	let t16;
    	let t17;
    	let if_block18_anchor;
    	let current;
    	let if_block0 = /*$Globals*/ ctx[1].State === 'Registration' && create_if_block_36(ctx);
    	let if_block1 = /*$Globals*/ ctx[1].State === 'registering' && create_if_block_35(ctx);
    	let if_block2 = /*$Globals*/ ctx[1].State === 'registered' && create_if_block_34(ctx);
    	let if_block3 = /*$Globals*/ ctx[1].State === 'RegistrationFailed' && create_if_block_33(ctx);
    	let if_block4 = /*$Globals*/ ctx[1].State === 'RenewalRequest' && create_if_block_32(ctx);
    	let if_block5 = /*$Globals*/ ctx[1].State === 'renewing' && create_if_block_31(ctx);
    	let if_block6 = /*$Globals*/ ctx[1].State === 'renewed' && create_if_block_30(ctx);
    	let if_block7 = /*$Globals*/ ctx[1].State === 'confirming' && create_if_block_29(ctx);
    	let if_block8 = /*$Globals*/ ctx[1].State === 'confirmed' && create_if_block_28(ctx);
    	let if_block9 = /*$Globals*/ ctx[1].State === 'ResetRequest' && create_if_block_27(ctx);
    	let if_block10 = /*$Globals*/ ctx[1].State === 'requestingReset' && create_if_block_26(ctx);
    	let if_block11 = /*$Globals*/ ctx[1].State === 'ResetRequested' && create_if_block_25(ctx);
    	let if_block12 = /*$Globals*/ ctx[1].State === 'ResetPassword' && create_if_block_24(ctx);
    	let if_block13 = /*$Globals*/ ctx[1].State === 'resettingPassword' && create_if_block_23(ctx);
    	let if_block14 = /*$Globals*/ ctx[1].State === 'PasswordReset' && create_if_block_22(ctx);
    	let if_block15 = /*$Globals*/ ctx[1].State === 'Login' && create_if_block_21(ctx);
    	let if_block16 = /*$Globals*/ ctx[1].State === 'sendingLogin' && create_if_block_20(ctx);
    	let if_block17 = /*$Globals*/ ctx[1].State === 'LoginFailure' && create_if_block_19(ctx);
    	let if_block18 = /*$Globals*/ ctx[1].State === 'CommunicationFailure' && create_if_block_18(ctx);

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
    			t5 = space();
    			if (if_block6) if_block6.c();
    			t6 = space();
    			if (if_block7) if_block7.c();
    			t7 = space();
    			if (if_block8) if_block8.c();
    			t8 = space();
    			if (if_block9) if_block9.c();
    			t9 = space();
    			if (if_block10) if_block10.c();
    			t10 = space();
    			if (if_block11) if_block11.c();
    			t11 = space();
    			if (if_block12) if_block12.c();
    			t12 = space();
    			if (if_block13) if_block13.c();
    			t13 = space();
    			if (if_block14) if_block14.c();
    			t14 = space();
    			if (if_block15) if_block15.c();
    			t15 = space();
    			if (if_block16) if_block16.c();
    			t16 = space();
    			if (if_block17) if_block17.c();
    			t17 = space();
    			if (if_block18) if_block18.c();
    			if_block18_anchor = empty();
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
    			insert(target, t5, anchor);
    			if (if_block6) if_block6.m(target, anchor);
    			insert(target, t6, anchor);
    			if (if_block7) if_block7.m(target, anchor);
    			insert(target, t7, anchor);
    			if (if_block8) if_block8.m(target, anchor);
    			insert(target, t8, anchor);
    			if (if_block9) if_block9.m(target, anchor);
    			insert(target, t9, anchor);
    			if (if_block10) if_block10.m(target, anchor);
    			insert(target, t10, anchor);
    			if (if_block11) if_block11.m(target, anchor);
    			insert(target, t11, anchor);
    			if (if_block12) if_block12.m(target, anchor);
    			insert(target, t12, anchor);
    			if (if_block13) if_block13.m(target, anchor);
    			insert(target, t13, anchor);
    			if (if_block14) if_block14.m(target, anchor);
    			insert(target, t14, anchor);
    			if (if_block15) if_block15.m(target, anchor);
    			insert(target, t15, anchor);
    			if (if_block16) if_block16.m(target, anchor);
    			insert(target, t16, anchor);
    			if (if_block17) if_block17.m(target, anchor);
    			insert(target, t17, anchor);
    			if (if_block18) if_block18.m(target, anchor);
    			insert(target, if_block18_anchor, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			if (/*$Globals*/ ctx[1].State === 'Registration') {
    				if (if_block0) {
    					if (dirty & /*$Globals*/ 2) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_36(ctx);
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

    			if (/*$Globals*/ ctx[1].State === 'registering') {
    				if (if_block1) {
    					if (dirty & /*$Globals*/ 2) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_35(ctx);
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

    			if (/*$Globals*/ ctx[1].State === 'registered') {
    				if (if_block2) {
    					if (dirty & /*$Globals*/ 2) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_34(ctx);
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

    			if (/*$Globals*/ ctx[1].State === 'RegistrationFailed') {
    				if (if_block3) {
    					if (dirty & /*$Globals*/ 2) {
    						transition_in(if_block3, 1);
    					}
    				} else {
    					if_block3 = create_if_block_33(ctx);
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

    			if (/*$Globals*/ ctx[1].State === 'RenewalRequest') {
    				if (if_block4) {
    					if (dirty & /*$Globals*/ 2) {
    						transition_in(if_block4, 1);
    					}
    				} else {
    					if_block4 = create_if_block_32(ctx);
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

    			if (/*$Globals*/ ctx[1].State === 'renewing') {
    				if (if_block5) {
    					if (dirty & /*$Globals*/ 2) {
    						transition_in(if_block5, 1);
    					}
    				} else {
    					if_block5 = create_if_block_31(ctx);
    					if_block5.c();
    					transition_in(if_block5, 1);
    					if_block5.m(t5.parentNode, t5);
    				}
    			} else if (if_block5) {
    				group_outros();

    				transition_out(if_block5, 1, 1, () => {
    					if_block5 = null;
    				});

    				check_outros();
    			}

    			if (/*$Globals*/ ctx[1].State === 'renewed') {
    				if (if_block6) {
    					if (dirty & /*$Globals*/ 2) {
    						transition_in(if_block6, 1);
    					}
    				} else {
    					if_block6 = create_if_block_30(ctx);
    					if_block6.c();
    					transition_in(if_block6, 1);
    					if_block6.m(t6.parentNode, t6);
    				}
    			} else if (if_block6) {
    				group_outros();

    				transition_out(if_block6, 1, 1, () => {
    					if_block6 = null;
    				});

    				check_outros();
    			}

    			if (/*$Globals*/ ctx[1].State === 'confirming') {
    				if (if_block7) {
    					if (dirty & /*$Globals*/ 2) {
    						transition_in(if_block7, 1);
    					}
    				} else {
    					if_block7 = create_if_block_29(ctx);
    					if_block7.c();
    					transition_in(if_block7, 1);
    					if_block7.m(t7.parentNode, t7);
    				}
    			} else if (if_block7) {
    				group_outros();

    				transition_out(if_block7, 1, 1, () => {
    					if_block7 = null;
    				});

    				check_outros();
    			}

    			if (/*$Globals*/ ctx[1].State === 'confirmed') {
    				if (if_block8) {
    					if (dirty & /*$Globals*/ 2) {
    						transition_in(if_block8, 1);
    					}
    				} else {
    					if_block8 = create_if_block_28(ctx);
    					if_block8.c();
    					transition_in(if_block8, 1);
    					if_block8.m(t8.parentNode, t8);
    				}
    			} else if (if_block8) {
    				group_outros();

    				transition_out(if_block8, 1, 1, () => {
    					if_block8 = null;
    				});

    				check_outros();
    			}

    			if (/*$Globals*/ ctx[1].State === 'ResetRequest') {
    				if (if_block9) {
    					if (dirty & /*$Globals*/ 2) {
    						transition_in(if_block9, 1);
    					}
    				} else {
    					if_block9 = create_if_block_27(ctx);
    					if_block9.c();
    					transition_in(if_block9, 1);
    					if_block9.m(t9.parentNode, t9);
    				}
    			} else if (if_block9) {
    				group_outros();

    				transition_out(if_block9, 1, 1, () => {
    					if_block9 = null;
    				});

    				check_outros();
    			}

    			if (/*$Globals*/ ctx[1].State === 'requestingReset') {
    				if (if_block10) {
    					if (dirty & /*$Globals*/ 2) {
    						transition_in(if_block10, 1);
    					}
    				} else {
    					if_block10 = create_if_block_26(ctx);
    					if_block10.c();
    					transition_in(if_block10, 1);
    					if_block10.m(t10.parentNode, t10);
    				}
    			} else if (if_block10) {
    				group_outros();

    				transition_out(if_block10, 1, 1, () => {
    					if_block10 = null;
    				});

    				check_outros();
    			}

    			if (/*$Globals*/ ctx[1].State === 'ResetRequested') {
    				if (if_block11) {
    					if (dirty & /*$Globals*/ 2) {
    						transition_in(if_block11, 1);
    					}
    				} else {
    					if_block11 = create_if_block_25(ctx);
    					if_block11.c();
    					transition_in(if_block11, 1);
    					if_block11.m(t11.parentNode, t11);
    				}
    			} else if (if_block11) {
    				group_outros();

    				transition_out(if_block11, 1, 1, () => {
    					if_block11 = null;
    				});

    				check_outros();
    			}

    			if (/*$Globals*/ ctx[1].State === 'ResetPassword') {
    				if (if_block12) {
    					if (dirty & /*$Globals*/ 2) {
    						transition_in(if_block12, 1);
    					}
    				} else {
    					if_block12 = create_if_block_24(ctx);
    					if_block12.c();
    					transition_in(if_block12, 1);
    					if_block12.m(t12.parentNode, t12);
    				}
    			} else if (if_block12) {
    				group_outros();

    				transition_out(if_block12, 1, 1, () => {
    					if_block12 = null;
    				});

    				check_outros();
    			}

    			if (/*$Globals*/ ctx[1].State === 'resettingPassword') {
    				if (if_block13) {
    					if (dirty & /*$Globals*/ 2) {
    						transition_in(if_block13, 1);
    					}
    				} else {
    					if_block13 = create_if_block_23(ctx);
    					if_block13.c();
    					transition_in(if_block13, 1);
    					if_block13.m(t13.parentNode, t13);
    				}
    			} else if (if_block13) {
    				group_outros();

    				transition_out(if_block13, 1, 1, () => {
    					if_block13 = null;
    				});

    				check_outros();
    			}

    			if (/*$Globals*/ ctx[1].State === 'PasswordReset') {
    				if (if_block14) {
    					if (dirty & /*$Globals*/ 2) {
    						transition_in(if_block14, 1);
    					}
    				} else {
    					if_block14 = create_if_block_22(ctx);
    					if_block14.c();
    					transition_in(if_block14, 1);
    					if_block14.m(t14.parentNode, t14);
    				}
    			} else if (if_block14) {
    				group_outros();

    				transition_out(if_block14, 1, 1, () => {
    					if_block14 = null;
    				});

    				check_outros();
    			}

    			if (/*$Globals*/ ctx[1].State === 'Login') {
    				if (if_block15) {
    					if (dirty & /*$Globals*/ 2) {
    						transition_in(if_block15, 1);
    					}
    				} else {
    					if_block15 = create_if_block_21(ctx);
    					if_block15.c();
    					transition_in(if_block15, 1);
    					if_block15.m(t15.parentNode, t15);
    				}
    			} else if (if_block15) {
    				group_outros();

    				transition_out(if_block15, 1, 1, () => {
    					if_block15 = null;
    				});

    				check_outros();
    			}

    			if (/*$Globals*/ ctx[1].State === 'sendingLogin') {
    				if (if_block16) {
    					if (dirty & /*$Globals*/ 2) {
    						transition_in(if_block16, 1);
    					}
    				} else {
    					if_block16 = create_if_block_20(ctx);
    					if_block16.c();
    					transition_in(if_block16, 1);
    					if_block16.m(t16.parentNode, t16);
    				}
    			} else if (if_block16) {
    				group_outros();

    				transition_out(if_block16, 1, 1, () => {
    					if_block16 = null;
    				});

    				check_outros();
    			}

    			if (/*$Globals*/ ctx[1].State === 'LoginFailure') {
    				if (if_block17) {
    					if (dirty & /*$Globals*/ 2) {
    						transition_in(if_block17, 1);
    					}
    				} else {
    					if_block17 = create_if_block_19(ctx);
    					if_block17.c();
    					transition_in(if_block17, 1);
    					if_block17.m(t17.parentNode, t17);
    				}
    			} else if (if_block17) {
    				group_outros();

    				transition_out(if_block17, 1, 1, () => {
    					if_block17 = null;
    				});

    				check_outros();
    			}

    			if (/*$Globals*/ ctx[1].State === 'CommunicationFailure') {
    				if (if_block18) {
    					if (dirty & /*$Globals*/ 2) {
    						transition_in(if_block18, 1);
    					}
    				} else {
    					if_block18 = create_if_block_18(ctx);
    					if_block18.c();
    					transition_in(if_block18, 1);
    					if_block18.m(if_block18_anchor.parentNode, if_block18_anchor);
    				}
    			} else if (if_block18) {
    				group_outros();

    				transition_out(if_block18, 1, 1, () => {
    					if_block18 = null;
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
    			transition_in(if_block6);
    			transition_in(if_block7);
    			transition_in(if_block8);
    			transition_in(if_block9);
    			transition_in(if_block10);
    			transition_in(if_block11);
    			transition_in(if_block12);
    			transition_in(if_block13);
    			transition_in(if_block14);
    			transition_in(if_block15);
    			transition_in(if_block16);
    			transition_in(if_block17);
    			transition_in(if_block18);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(if_block2);
    			transition_out(if_block3);
    			transition_out(if_block4);
    			transition_out(if_block5);
    			transition_out(if_block6);
    			transition_out(if_block7);
    			transition_out(if_block8);
    			transition_out(if_block9);
    			transition_out(if_block10);
    			transition_out(if_block11);
    			transition_out(if_block12);
    			transition_out(if_block13);
    			transition_out(if_block14);
    			transition_out(if_block15);
    			transition_out(if_block16);
    			transition_out(if_block17);
    			transition_out(if_block18);
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
    			if (detaching) detach(t5);
    			if (if_block6) if_block6.d(detaching);
    			if (detaching) detach(t6);
    			if (if_block7) if_block7.d(detaching);
    			if (detaching) detach(t7);
    			if (if_block8) if_block8.d(detaching);
    			if (detaching) detach(t8);
    			if (if_block9) if_block9.d(detaching);
    			if (detaching) detach(t9);
    			if (if_block10) if_block10.d(detaching);
    			if (detaching) detach(t10);
    			if (if_block11) if_block11.d(detaching);
    			if (detaching) detach(t11);
    			if (if_block12) if_block12.d(detaching);
    			if (detaching) detach(t12);
    			if (if_block13) if_block13.d(detaching);
    			if (detaching) detach(t13);
    			if (if_block14) if_block14.d(detaching);
    			if (detaching) detach(t14);
    			if (if_block15) if_block15.d(detaching);
    			if (detaching) detach(t15);
    			if (if_block16) if_block16.d(detaching);
    			if (detaching) detach(t16);
    			if (if_block17) if_block17.d(detaching);
    			if (detaching) detach(t17);
    			if (if_block18) if_block18.d(detaching);
    			if (detaching) detach(if_block18_anchor);
    		}
    	};
    }

    // (71:6) {#if $Globals.State === 'EMailAddressChange'}
    function create_if_block_16(ctx) {
    	let overlay;
    	let current;

    	overlay = new Overlay({
    			props: {
    				$$slots: { default: [create_default_slot_17] },
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

    // (71:59) <Overlay>
    function create_default_slot_17(ctx) {
    	let emailchangedialog;
    	let current;
    	emailchangedialog = new EMailChangeDialog({});

    	return {
    		c() {
    			create_component(emailchangedialog.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(emailchangedialog, target, anchor);
    			current = true;
    		},
    		i(local) {
    			if (current) return;
    			transition_in(emailchangedialog.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(emailchangedialog.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(emailchangedialog, detaching);
    		}
    	};
    }

    // (72:6) {#if $Globals.State === 'changingEMailAddress'}
    function create_if_block_15(ctx) {
    	let overlay;
    	let current;

    	overlay = new Overlay({
    			props: {
    				$$slots: { default: [create_default_slot_16] },
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

    // (72:59) <Overlay>
    function create_default_slot_16(ctx) {
    	let emailchangenotice;
    	let current;
    	emailchangenotice = new EMailChangeNotice({});

    	return {
    		c() {
    			create_component(emailchangenotice.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(emailchangenotice, target, anchor);
    			current = true;
    		},
    		i(local) {
    			if (current) return;
    			transition_in(emailchangenotice.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(emailchangenotice.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(emailchangenotice, detaching);
    		}
    	};
    }

    // (73:6) {#if $Globals.State === 'EMailAddressChanged'}
    function create_if_block_14(ctx) {
    	let overlay;
    	let current;

    	overlay = new Overlay({
    			props: {
    				$$slots: { default: [create_default_slot_15] },
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

    // (73:59) <Overlay>
    function create_default_slot_15(ctx) {
    	let emailchangednotice;
    	let current;
    	emailchangednotice = new EMailChangedNotice({});

    	return {
    		c() {
    			create_component(emailchangednotice.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(emailchangednotice, target, anchor);
    			current = true;
    		},
    		i(local) {
    			if (current) return;
    			transition_in(emailchangednotice.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(emailchangednotice.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(emailchangednotice, detaching);
    		}
    	};
    }

    // (74:6) {#if $Globals.State === 'EMailAddressChangeFailure'}
    function create_if_block_13(ctx) {
    	let overlay;
    	let current;

    	overlay = new Overlay({
    			props: {
    				$$slots: { default: [create_default_slot_14] },
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

    // (74:59) <Overlay>
    function create_default_slot_14(ctx) {
    	let emailchangefailurenotice;
    	let current;
    	emailchangefailurenotice = new EMailChangeFailureNotice({});

    	return {
    		c() {
    			create_component(emailchangefailurenotice.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(emailchangefailurenotice, target, anchor);
    			current = true;
    		},
    		i(local) {
    			if (current) return;
    			transition_in(emailchangefailurenotice.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(emailchangefailurenotice.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(emailchangefailurenotice, detaching);
    		}
    	};
    }

    // (75:6) {#if $Globals.State === 'PasswordChange'}
    function create_if_block_12(ctx) {
    	let overlay;
    	let current;

    	overlay = new Overlay({
    			props: {
    				$$slots: { default: [create_default_slot_13] },
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

    // (75:59) <Overlay>
    function create_default_slot_13(ctx) {
    	let passwordchangedialog;
    	let current;
    	passwordchangedialog = new PasswordChangeDialog({});

    	return {
    		c() {
    			create_component(passwordchangedialog.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(passwordchangedialog, target, anchor);
    			current = true;
    		},
    		i(local) {
    			if (current) return;
    			transition_in(passwordchangedialog.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(passwordchangedialog.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(passwordchangedialog, detaching);
    		}
    	};
    }

    // (76:6) {#if $Globals.State === 'changingPassword'}
    function create_if_block_11(ctx) {
    	let overlay;
    	let current;

    	overlay = new Overlay({
    			props: {
    				$$slots: { default: [create_default_slot_12] },
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

    // (76:59) <Overlay>
    function create_default_slot_12(ctx) {
    	let passwordchangenotice;
    	let current;
    	passwordchangenotice = new PasswordChangeNotice({});

    	return {
    		c() {
    			create_component(passwordchangenotice.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(passwordchangenotice, target, anchor);
    			current = true;
    		},
    		i(local) {
    			if (current) return;
    			transition_in(passwordchangenotice.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(passwordchangenotice.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(passwordchangenotice, detaching);
    		}
    	};
    }

    // (77:6) {#if $Globals.State === 'PasswordChanged'}
    function create_if_block_10(ctx) {
    	let overlay;
    	let current;

    	overlay = new Overlay({
    			props: {
    				$$slots: { default: [create_default_slot_11] },
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

    // (77:59) <Overlay>
    function create_default_slot_11(ctx) {
    	let passwordchangednotice;
    	let current;
    	passwordchangednotice = new PasswordChangedNotice({});

    	return {
    		c() {
    			create_component(passwordchangednotice.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(passwordchangednotice, target, anchor);
    			current = true;
    		},
    		i(local) {
    			if (current) return;
    			transition_in(passwordchangednotice.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(passwordchangednotice.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(passwordchangednotice, detaching);
    		}
    	};
    }

    // (78:6) {#if $Globals.State === 'wrongPassword'}
    function create_if_block_9(ctx) {
    	let overlay;
    	let current;

    	overlay = new Overlay({
    			props: {
    				$$slots: { default: [create_default_slot_10] },
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

    // (78:59) <Overlay>
    function create_default_slot_10(ctx) {
    	let passwordchangefailurenotice;
    	let current;
    	passwordchangefailurenotice = new PasswordChangeFailureNotice({});

    	return {
    		c() {
    			create_component(passwordchangefailurenotice.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(passwordchangefailurenotice, target, anchor);
    			current = true;
    		},
    		i(local) {
    			if (current) return;
    			transition_in(passwordchangefailurenotice.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(passwordchangefailurenotice.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(passwordchangefailurenotice, detaching);
    		}
    	};
    }

    // (79:6) {#if $Globals.State === 'NameChange'}
    function create_if_block_8(ctx) {
    	let overlay;
    	let current;

    	overlay = new Overlay({
    			props: {
    				$$slots: { default: [create_default_slot_9] },
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

    // (79:59) <Overlay>
    function create_default_slot_9(ctx) {
    	let namechangedialog;
    	let current;
    	namechangedialog = new NameChangeDialog({});

    	return {
    		c() {
    			create_component(namechangedialog.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(namechangedialog, target, anchor);
    			current = true;
    		},
    		i(local) {
    			if (current) return;
    			transition_in(namechangedialog.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(namechangedialog.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(namechangedialog, detaching);
    		}
    	};
    }

    // (80:6) {#if $Globals.State === 'changingName'}
    function create_if_block_7(ctx) {
    	let overlay;
    	let current;

    	overlay = new Overlay({
    			props: {
    				$$slots: { default: [create_default_slot_8] },
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

    // (80:59) <Overlay>
    function create_default_slot_8(ctx) {
    	let namechangenotice;
    	let current;
    	namechangenotice = new NameChangeNotice({});

    	return {
    		c() {
    			create_component(namechangenotice.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(namechangenotice, target, anchor);
    			current = true;
    		},
    		i(local) {
    			if (current) return;
    			transition_in(namechangenotice.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(namechangenotice.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(namechangenotice, detaching);
    		}
    	};
    }

    // (81:6) {#if $Globals.State === 'NameChanged'}
    function create_if_block_6(ctx) {
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

    // (81:59) <Overlay>
    function create_default_slot_7(ctx) {
    	let namechangednotice;
    	let current;
    	namechangednotice = new NameChangedNotice({});

    	return {
    		c() {
    			create_component(namechangednotice.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(namechangednotice, target, anchor);
    			current = true;
    		},
    		i(local) {
    			if (current) return;
    			transition_in(namechangednotice.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(namechangednotice.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(namechangednotice, detaching);
    		}
    	};
    }

    // (82:6) {#if $Globals.State === 'loggedOut'}
    function create_if_block_5(ctx) {
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

    // (82:59) <Overlay>
    function create_default_slot_6(ctx) {
    	let logoutnotice;
    	let current;
    	logoutnotice = new LogoutNotice({});

    	return {
    		c() {
    			create_component(logoutnotice.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(logoutnotice, target, anchor);
    			current = true;
    		},
    		i(local) {
    			if (current) return;
    			transition_in(logoutnotice.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(logoutnotice.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(logoutnotice, detaching);
    		}
    	};
    }

    // (83:6) {#if $Globals.State === 'Unregistration'}
    function create_if_block_4(ctx) {
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

    // (83:59) <Overlay>
    function create_default_slot_5(ctx) {
    	let unregistrationdialog;
    	let current;
    	unregistrationdialog = new UnregistrationDialog({});

    	return {
    		c() {
    			create_component(unregistrationdialog.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(unregistrationdialog, target, anchor);
    			current = true;
    		},
    		i(local) {
    			if (current) return;
    			transition_in(unregistrationdialog.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(unregistrationdialog.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(unregistrationdialog, detaching);
    		}
    	};
    }

    // (84:6) {#if $Globals.State === 'unregistering'}
    function create_if_block_3(ctx) {
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

    // (84:59) <Overlay>
    function create_default_slot_4(ctx) {
    	let unregistrationnotice;
    	let current;
    	unregistrationnotice = new UnregistrationNotice({});

    	return {
    		c() {
    			create_component(unregistrationnotice.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(unregistrationnotice, target, anchor);
    			current = true;
    		},
    		i(local) {
    			if (current) return;
    			transition_in(unregistrationnotice.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(unregistrationnotice.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(unregistrationnotice, detaching);
    		}
    	};
    }

    // (85:6) {#if $Globals.State === 'unregistered'}
    function create_if_block_2(ctx) {
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

    // (85:59) <Overlay>
    function create_default_slot_3(ctx) {
    	let unregisterednotice;
    	let current;
    	unregisterednotice = new UnregisteredNotice({});

    	return {
    		c() {
    			create_component(unregisterednotice.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(unregisterednotice, target, anchor);
    			current = true;
    		},
    		i(local) {
    			if (current) return;
    			transition_in(unregisterednotice.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(unregisterednotice.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(unregisterednotice, detaching);
    		}
    	};
    }

    // (86:6) {#if $Globals.State === 'CommunicationFailure'}
    function create_if_block_1(ctx) {
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

    // (86:59) <Overlay>
    function create_default_slot_2(ctx) {
    	let communicationfailurenotice;
    	let current;
    	communicationfailurenotice = new CommunicationFailureNotice({});

    	return {
    		c() {
    			create_component(communicationfailurenotice.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(communicationfailurenotice, target, anchor);
    			current = true;
    		},
    		i(local) {
    			if (current) return;
    			transition_in(communicationfailurenotice.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(communicationfailurenotice.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(communicationfailurenotice, detaching);
    		}
    	};
    }

    // (70:4) <NotePage>
    function create_default_slot_1(ctx) {
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let t4;
    	let t5;
    	let t6;
    	let t7;
    	let t8;
    	let t9;
    	let t10;
    	let t11;
    	let t12;
    	let t13;
    	let t14;
    	let if_block15_anchor;
    	let current;
    	let if_block0 = /*$Globals*/ ctx[1].State === 'EMailAddressChange' && create_if_block_16(ctx);
    	let if_block1 = /*$Globals*/ ctx[1].State === 'changingEMailAddress' && create_if_block_15(ctx);
    	let if_block2 = /*$Globals*/ ctx[1].State === 'EMailAddressChanged' && create_if_block_14(ctx);
    	let if_block3 = /*$Globals*/ ctx[1].State === 'EMailAddressChangeFailure' && create_if_block_13(ctx);
    	let if_block4 = /*$Globals*/ ctx[1].State === 'PasswordChange' && create_if_block_12(ctx);
    	let if_block5 = /*$Globals*/ ctx[1].State === 'changingPassword' && create_if_block_11(ctx);
    	let if_block6 = /*$Globals*/ ctx[1].State === 'PasswordChanged' && create_if_block_10(ctx);
    	let if_block7 = /*$Globals*/ ctx[1].State === 'wrongPassword' && create_if_block_9(ctx);
    	let if_block8 = /*$Globals*/ ctx[1].State === 'NameChange' && create_if_block_8(ctx);
    	let if_block9 = /*$Globals*/ ctx[1].State === 'changingName' && create_if_block_7(ctx);
    	let if_block10 = /*$Globals*/ ctx[1].State === 'NameChanged' && create_if_block_6(ctx);
    	let if_block11 = /*$Globals*/ ctx[1].State === 'loggedOut' && create_if_block_5(ctx);
    	let if_block12 = /*$Globals*/ ctx[1].State === 'Unregistration' && create_if_block_4(ctx);
    	let if_block13 = /*$Globals*/ ctx[1].State === 'unregistering' && create_if_block_3(ctx);
    	let if_block14 = /*$Globals*/ ctx[1].State === 'unregistered' && create_if_block_2(ctx);
    	let if_block15 = /*$Globals*/ ctx[1].State === 'CommunicationFailure' && create_if_block_1(ctx);

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
    			t5 = space();
    			if (if_block6) if_block6.c();
    			t6 = space();
    			if (if_block7) if_block7.c();
    			t7 = space();
    			if (if_block8) if_block8.c();
    			t8 = space();
    			if (if_block9) if_block9.c();
    			t9 = space();
    			if (if_block10) if_block10.c();
    			t10 = space();
    			if (if_block11) if_block11.c();
    			t11 = space();
    			if (if_block12) if_block12.c();
    			t12 = space();
    			if (if_block13) if_block13.c();
    			t13 = space();
    			if (if_block14) if_block14.c();
    			t14 = space();
    			if (if_block15) if_block15.c();
    			if_block15_anchor = empty();
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
    			insert(target, t5, anchor);
    			if (if_block6) if_block6.m(target, anchor);
    			insert(target, t6, anchor);
    			if (if_block7) if_block7.m(target, anchor);
    			insert(target, t7, anchor);
    			if (if_block8) if_block8.m(target, anchor);
    			insert(target, t8, anchor);
    			if (if_block9) if_block9.m(target, anchor);
    			insert(target, t9, anchor);
    			if (if_block10) if_block10.m(target, anchor);
    			insert(target, t10, anchor);
    			if (if_block11) if_block11.m(target, anchor);
    			insert(target, t11, anchor);
    			if (if_block12) if_block12.m(target, anchor);
    			insert(target, t12, anchor);
    			if (if_block13) if_block13.m(target, anchor);
    			insert(target, t13, anchor);
    			if (if_block14) if_block14.m(target, anchor);
    			insert(target, t14, anchor);
    			if (if_block15) if_block15.m(target, anchor);
    			insert(target, if_block15_anchor, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			if (/*$Globals*/ ctx[1].State === 'EMailAddressChange') {
    				if (if_block0) {
    					if (dirty & /*$Globals*/ 2) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_16(ctx);
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

    			if (/*$Globals*/ ctx[1].State === 'changingEMailAddress') {
    				if (if_block1) {
    					if (dirty & /*$Globals*/ 2) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_15(ctx);
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

    			if (/*$Globals*/ ctx[1].State === 'EMailAddressChanged') {
    				if (if_block2) {
    					if (dirty & /*$Globals*/ 2) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_14(ctx);
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

    			if (/*$Globals*/ ctx[1].State === 'EMailAddressChangeFailure') {
    				if (if_block3) {
    					if (dirty & /*$Globals*/ 2) {
    						transition_in(if_block3, 1);
    					}
    				} else {
    					if_block3 = create_if_block_13(ctx);
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

    			if (/*$Globals*/ ctx[1].State === 'PasswordChange') {
    				if (if_block4) {
    					if (dirty & /*$Globals*/ 2) {
    						transition_in(if_block4, 1);
    					}
    				} else {
    					if_block4 = create_if_block_12(ctx);
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

    			if (/*$Globals*/ ctx[1].State === 'changingPassword') {
    				if (if_block5) {
    					if (dirty & /*$Globals*/ 2) {
    						transition_in(if_block5, 1);
    					}
    				} else {
    					if_block5 = create_if_block_11(ctx);
    					if_block5.c();
    					transition_in(if_block5, 1);
    					if_block5.m(t5.parentNode, t5);
    				}
    			} else if (if_block5) {
    				group_outros();

    				transition_out(if_block5, 1, 1, () => {
    					if_block5 = null;
    				});

    				check_outros();
    			}

    			if (/*$Globals*/ ctx[1].State === 'PasswordChanged') {
    				if (if_block6) {
    					if (dirty & /*$Globals*/ 2) {
    						transition_in(if_block6, 1);
    					}
    				} else {
    					if_block6 = create_if_block_10(ctx);
    					if_block6.c();
    					transition_in(if_block6, 1);
    					if_block6.m(t6.parentNode, t6);
    				}
    			} else if (if_block6) {
    				group_outros();

    				transition_out(if_block6, 1, 1, () => {
    					if_block6 = null;
    				});

    				check_outros();
    			}

    			if (/*$Globals*/ ctx[1].State === 'wrongPassword') {
    				if (if_block7) {
    					if (dirty & /*$Globals*/ 2) {
    						transition_in(if_block7, 1);
    					}
    				} else {
    					if_block7 = create_if_block_9(ctx);
    					if_block7.c();
    					transition_in(if_block7, 1);
    					if_block7.m(t7.parentNode, t7);
    				}
    			} else if (if_block7) {
    				group_outros();

    				transition_out(if_block7, 1, 1, () => {
    					if_block7 = null;
    				});

    				check_outros();
    			}

    			if (/*$Globals*/ ctx[1].State === 'NameChange') {
    				if (if_block8) {
    					if (dirty & /*$Globals*/ 2) {
    						transition_in(if_block8, 1);
    					}
    				} else {
    					if_block8 = create_if_block_8(ctx);
    					if_block8.c();
    					transition_in(if_block8, 1);
    					if_block8.m(t8.parentNode, t8);
    				}
    			} else if (if_block8) {
    				group_outros();

    				transition_out(if_block8, 1, 1, () => {
    					if_block8 = null;
    				});

    				check_outros();
    			}

    			if (/*$Globals*/ ctx[1].State === 'changingName') {
    				if (if_block9) {
    					if (dirty & /*$Globals*/ 2) {
    						transition_in(if_block9, 1);
    					}
    				} else {
    					if_block9 = create_if_block_7(ctx);
    					if_block9.c();
    					transition_in(if_block9, 1);
    					if_block9.m(t9.parentNode, t9);
    				}
    			} else if (if_block9) {
    				group_outros();

    				transition_out(if_block9, 1, 1, () => {
    					if_block9 = null;
    				});

    				check_outros();
    			}

    			if (/*$Globals*/ ctx[1].State === 'NameChanged') {
    				if (if_block10) {
    					if (dirty & /*$Globals*/ 2) {
    						transition_in(if_block10, 1);
    					}
    				} else {
    					if_block10 = create_if_block_6(ctx);
    					if_block10.c();
    					transition_in(if_block10, 1);
    					if_block10.m(t10.parentNode, t10);
    				}
    			} else if (if_block10) {
    				group_outros();

    				transition_out(if_block10, 1, 1, () => {
    					if_block10 = null;
    				});

    				check_outros();
    			}

    			if (/*$Globals*/ ctx[1].State === 'loggedOut') {
    				if (if_block11) {
    					if (dirty & /*$Globals*/ 2) {
    						transition_in(if_block11, 1);
    					}
    				} else {
    					if_block11 = create_if_block_5(ctx);
    					if_block11.c();
    					transition_in(if_block11, 1);
    					if_block11.m(t11.parentNode, t11);
    				}
    			} else if (if_block11) {
    				group_outros();

    				transition_out(if_block11, 1, 1, () => {
    					if_block11 = null;
    				});

    				check_outros();
    			}

    			if (/*$Globals*/ ctx[1].State === 'Unregistration') {
    				if (if_block12) {
    					if (dirty & /*$Globals*/ 2) {
    						transition_in(if_block12, 1);
    					}
    				} else {
    					if_block12 = create_if_block_4(ctx);
    					if_block12.c();
    					transition_in(if_block12, 1);
    					if_block12.m(t12.parentNode, t12);
    				}
    			} else if (if_block12) {
    				group_outros();

    				transition_out(if_block12, 1, 1, () => {
    					if_block12 = null;
    				});

    				check_outros();
    			}

    			if (/*$Globals*/ ctx[1].State === 'unregistering') {
    				if (if_block13) {
    					if (dirty & /*$Globals*/ 2) {
    						transition_in(if_block13, 1);
    					}
    				} else {
    					if_block13 = create_if_block_3(ctx);
    					if_block13.c();
    					transition_in(if_block13, 1);
    					if_block13.m(t13.parentNode, t13);
    				}
    			} else if (if_block13) {
    				group_outros();

    				transition_out(if_block13, 1, 1, () => {
    					if_block13 = null;
    				});

    				check_outros();
    			}

    			if (/*$Globals*/ ctx[1].State === 'unregistered') {
    				if (if_block14) {
    					if (dirty & /*$Globals*/ 2) {
    						transition_in(if_block14, 1);
    					}
    				} else {
    					if_block14 = create_if_block_2(ctx);
    					if_block14.c();
    					transition_in(if_block14, 1);
    					if_block14.m(t14.parentNode, t14);
    				}
    			} else if (if_block14) {
    				group_outros();

    				transition_out(if_block14, 1, 1, () => {
    					if_block14 = null;
    				});

    				check_outros();
    			}

    			if (/*$Globals*/ ctx[1].State === 'CommunicationFailure') {
    				if (if_block15) {
    					if (dirty & /*$Globals*/ 2) {
    						transition_in(if_block15, 1);
    					}
    				} else {
    					if_block15 = create_if_block_1(ctx);
    					if_block15.c();
    					transition_in(if_block15, 1);
    					if_block15.m(if_block15_anchor.parentNode, if_block15_anchor);
    				}
    			} else if (if_block15) {
    				group_outros();

    				transition_out(if_block15, 1, 1, () => {
    					if_block15 = null;
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
    			transition_in(if_block6);
    			transition_in(if_block7);
    			transition_in(if_block8);
    			transition_in(if_block9);
    			transition_in(if_block10);
    			transition_in(if_block11);
    			transition_in(if_block12);
    			transition_in(if_block13);
    			transition_in(if_block14);
    			transition_in(if_block15);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(if_block2);
    			transition_out(if_block3);
    			transition_out(if_block4);
    			transition_out(if_block5);
    			transition_out(if_block6);
    			transition_out(if_block7);
    			transition_out(if_block8);
    			transition_out(if_block9);
    			transition_out(if_block10);
    			transition_out(if_block11);
    			transition_out(if_block12);
    			transition_out(if_block13);
    			transition_out(if_block14);
    			transition_out(if_block15);
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
    			if (detaching) detach(t5);
    			if (if_block6) if_block6.d(detaching);
    			if (detaching) detach(t6);
    			if (if_block7) if_block7.d(detaching);
    			if (detaching) detach(t7);
    			if (if_block8) if_block8.d(detaching);
    			if (detaching) detach(t8);
    			if (if_block9) if_block9.d(detaching);
    			if (detaching) detach(t9);
    			if (if_block10) if_block10.d(detaching);
    			if (detaching) detach(t10);
    			if (if_block11) if_block11.d(detaching);
    			if (detaching) detach(t11);
    			if (if_block12) if_block12.d(detaching);
    			if (detaching) detach(t12);
    			if (if_block13) if_block13.d(detaching);
    			if (detaching) detach(t13);
    			if (if_block14) if_block14.d(detaching);
    			if (detaching) detach(t14);
    			if (if_block15) if_block15.d(detaching);
    			if (detaching) detach(if_block15_anchor);
    		}
    	};
    }

    // (68:0) <ApplicationCell>
    function create_default_slot(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block, create_if_block_17, create_else_block];
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
    			Globals.define({
    				ConfirmationToken: completeURL.replace(/^.*\/\#\/confirm\//, ''),
    				State: 'confirming'
    			});
    			break;
    		case completeURL.indexOf('/#/reset/') > 0:
    			Globals.define({
    				ResetToken: completeURL.replace(/^.*\/\#\/reset\//, ''),
    				State: 'PasswordReset'
    			});
    	}

    	let SubPath = document.location.hash;

    	window.addEventListener('hashchange', () => {
    		$$invalidate(0, SubPath = document.location.hash);
    	});

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
