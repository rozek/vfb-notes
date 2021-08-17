
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

    /* src/LoginDialog.svelte generated by Svelte v3.42.1 */

    function create_fragment$6(ctx) {
    	let div7;

    	return {
    		c() {
    			div7 = element("div");

    			div7.innerHTML = `<div class="svelte-1h0ucju"><div name="CloseButton" class="svelte-1h0ucju">×</div> 
    <div name="Title" class="svelte-1h0ucju">Please Login</div> 

    <input name="EMailAddressInput" type="email" required="" placeholder="your email address" class="svelte-1h0ucju"/> 
    <div class="FormMessage"> </div> 

    <input name="PasswordInput" type="password" required="" minlength="10" placeholder="your password" class="svelte-1h0ucju"/> 
    <div class="FormMessage"> </div> 

    <div name="ForgottenPassword" class="svelte-1h0ucju"><a href="" class="svelte-1h0ucju">Forgot your password?</a></div> 

    <button name="LoginButton" class="svelte-1h0ucju">Login</button> 

    <div style="text-align:center">Don&#39;t have an account? <a href="" class="svelte-1h0ucju">Create one!</a></div></div>`;

    			attr(div7, "class", "Dialog svelte-1h0ucju");
    		},
    		m(target, anchor) {
    			insert(target, div7, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div7);
    		}
    	};
    }

    class LoginDialog extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, null, create_fragment$6, safe_not_equal, {});
    	}
    }

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
    			attr(div, "class", "Overlay svelte-14tmgka");
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
        AccessToken: undefined,
        State:       undefined
      });

      function define (KeyOrObject, Value) {
        if (typeof(KeyOrObject) === 'string') {
          update((Globals) => { Globals[KeyOrObject] = Value; return Globals });
        } else {
          update((Globals) => Object.assign(Globals,KeyOrObject));
        }
      }

      const Globals = { subscribe, define };

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
    			div9.textContent = "This \"service\" is free of charge and offered on a \"best-effort\" service.";
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

    //----------------------------------------------------------------------------//
    /**** constrained ****/
    function constrained(Value, Minimum, Maximum) {
        if (Minimum === void 0) { Minimum = -Infinity; }
        if (Maximum === void 0) { Maximum = Infinity; }
        return Math.max(Minimum, Math.min(Value, Maximum));
    }

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

    /* src/App.svelte generated by Svelte v3.42.1 */

    function create_else_block_1(ctx) {
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

    // (43:2) {#if $Globals.AccessToken == null}
    function create_if_block(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_1, create_else_block];
    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*SubPath*/ ctx[0] === '#/Legal') return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_1(ctx);
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
    			current_block_type_index = select_block_type_1(ctx);

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

    // (46:4) {:else}
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

    // (44:4) {#if SubPath === '#/Legal'}
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

    // (48:8) {#if $Globals.State === 'Login'}
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

    // (49:10) <Overlay>
    function create_default_slot_2(ctx) {
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

    // (47:6) <InfoPage>
    function create_default_slot_1(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*$Globals*/ ctx[1].State === 'Login' && create_if_block_2(ctx);

    	return {
    		c() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			if (/*$Globals*/ ctx[1].State === 'Login') {
    				if (if_block) {
    					if (dirty & /*$Globals*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
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
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    // (42:0) <ApplicationCell>
    function create_default_slot(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block_1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*$Globals*/ ctx[1].AccessToken == null) return 0;
    		return 1;
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

    			if (dirty & /*$$scope, SubPath, $Globals*/ 11) {
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

    	Globals.define({
    		AccessToken: sessionStorage['vfb-notes: access-token'],
    		EMailAddress: localStorage['vfb-notes: email-address'],
    		Password: sessionStorage['vfb-notes: password']
    	});

    	switch (true) {
    		case $Globals.ConfirmationToken != null:
    			Globals.define('State', 'UserConfirmation');
    			break;
    		case $Globals.ConfirmationToken != null:
    			Globals.define('ResetToken', 'PasswordReset');
    			break;
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
