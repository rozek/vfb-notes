
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
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
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
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
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

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
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

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function getAugmentedNamespace(n) {
    	if (n.__esModule) return n;
    	var a = Object.defineProperty({}, '__esModule', {value: true});
    	Object.keys(n).forEach(function (k) {
    		var d = Object.getOwnPropertyDescriptor(n, k);
    		Object.defineProperty(a, k, d.get ? d : {
    			enumerable: true,
    			get: function () {
    				return n[k];
    			}
    		});
    	});
    	return a;
    }

    function commonjsRequire (path) {
    	throw new Error('Could not dynamically require "' + path + '". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.');
    }

    var naclFast = {exports: {}};

    var _nodeResolve_empty = {};

    var _nodeResolve_empty$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        'default': _nodeResolve_empty
    });

    var require$$0 = /*@__PURE__*/getAugmentedNamespace(_nodeResolve_empty$1);

    (function (module) {
    (function(nacl) {

    // Ported in 2014 by Dmitry Chestnykh and Devi Mandiri.
    // Public domain.
    //
    // Implementation derived from TweetNaCl version 20140427.
    // See for details: http://tweetnacl.cr.yp.to/

    var gf = function(init) {
      var i, r = new Float64Array(16);
      if (init) for (i = 0; i < init.length; i++) r[i] = init[i];
      return r;
    };

    //  Pluggable, initialized in high-level API below.
    var randombytes = function(/* x, n */) { throw new Error('no PRNG'); };

    var _0 = new Uint8Array(16);
    var _9 = new Uint8Array(32); _9[0] = 9;

    var gf0 = gf(),
        gf1 = gf([1]),
        _121665 = gf([0xdb41, 1]),
        D = gf([0x78a3, 0x1359, 0x4dca, 0x75eb, 0xd8ab, 0x4141, 0x0a4d, 0x0070, 0xe898, 0x7779, 0x4079, 0x8cc7, 0xfe73, 0x2b6f, 0x6cee, 0x5203]),
        D2 = gf([0xf159, 0x26b2, 0x9b94, 0xebd6, 0xb156, 0x8283, 0x149a, 0x00e0, 0xd130, 0xeef3, 0x80f2, 0x198e, 0xfce7, 0x56df, 0xd9dc, 0x2406]),
        X = gf([0xd51a, 0x8f25, 0x2d60, 0xc956, 0xa7b2, 0x9525, 0xc760, 0x692c, 0xdc5c, 0xfdd6, 0xe231, 0xc0a4, 0x53fe, 0xcd6e, 0x36d3, 0x2169]),
        Y = gf([0x6658, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666, 0x6666]),
        I = gf([0xa0b0, 0x4a0e, 0x1b27, 0xc4ee, 0xe478, 0xad2f, 0x1806, 0x2f43, 0xd7a7, 0x3dfb, 0x0099, 0x2b4d, 0xdf0b, 0x4fc1, 0x2480, 0x2b83]);

    function ts64(x, i, h, l) {
      x[i]   = (h >> 24) & 0xff;
      x[i+1] = (h >> 16) & 0xff;
      x[i+2] = (h >>  8) & 0xff;
      x[i+3] = h & 0xff;
      x[i+4] = (l >> 24)  & 0xff;
      x[i+5] = (l >> 16)  & 0xff;
      x[i+6] = (l >>  8)  & 0xff;
      x[i+7] = l & 0xff;
    }

    function vn(x, xi, y, yi, n) {
      var i,d = 0;
      for (i = 0; i < n; i++) d |= x[xi+i]^y[yi+i];
      return (1 & ((d - 1) >>> 8)) - 1;
    }

    function crypto_verify_16(x, xi, y, yi) {
      return vn(x,xi,y,yi,16);
    }

    function crypto_verify_32(x, xi, y, yi) {
      return vn(x,xi,y,yi,32);
    }

    function core_salsa20(o, p, k, c) {
      var j0  = c[ 0] & 0xff | (c[ 1] & 0xff)<<8 | (c[ 2] & 0xff)<<16 | (c[ 3] & 0xff)<<24,
          j1  = k[ 0] & 0xff | (k[ 1] & 0xff)<<8 | (k[ 2] & 0xff)<<16 | (k[ 3] & 0xff)<<24,
          j2  = k[ 4] & 0xff | (k[ 5] & 0xff)<<8 | (k[ 6] & 0xff)<<16 | (k[ 7] & 0xff)<<24,
          j3  = k[ 8] & 0xff | (k[ 9] & 0xff)<<8 | (k[10] & 0xff)<<16 | (k[11] & 0xff)<<24,
          j4  = k[12] & 0xff | (k[13] & 0xff)<<8 | (k[14] & 0xff)<<16 | (k[15] & 0xff)<<24,
          j5  = c[ 4] & 0xff | (c[ 5] & 0xff)<<8 | (c[ 6] & 0xff)<<16 | (c[ 7] & 0xff)<<24,
          j6  = p[ 0] & 0xff | (p[ 1] & 0xff)<<8 | (p[ 2] & 0xff)<<16 | (p[ 3] & 0xff)<<24,
          j7  = p[ 4] & 0xff | (p[ 5] & 0xff)<<8 | (p[ 6] & 0xff)<<16 | (p[ 7] & 0xff)<<24,
          j8  = p[ 8] & 0xff | (p[ 9] & 0xff)<<8 | (p[10] & 0xff)<<16 | (p[11] & 0xff)<<24,
          j9  = p[12] & 0xff | (p[13] & 0xff)<<8 | (p[14] & 0xff)<<16 | (p[15] & 0xff)<<24,
          j10 = c[ 8] & 0xff | (c[ 9] & 0xff)<<8 | (c[10] & 0xff)<<16 | (c[11] & 0xff)<<24,
          j11 = k[16] & 0xff | (k[17] & 0xff)<<8 | (k[18] & 0xff)<<16 | (k[19] & 0xff)<<24,
          j12 = k[20] & 0xff | (k[21] & 0xff)<<8 | (k[22] & 0xff)<<16 | (k[23] & 0xff)<<24,
          j13 = k[24] & 0xff | (k[25] & 0xff)<<8 | (k[26] & 0xff)<<16 | (k[27] & 0xff)<<24,
          j14 = k[28] & 0xff | (k[29] & 0xff)<<8 | (k[30] & 0xff)<<16 | (k[31] & 0xff)<<24,
          j15 = c[12] & 0xff | (c[13] & 0xff)<<8 | (c[14] & 0xff)<<16 | (c[15] & 0xff)<<24;

      var x0 = j0, x1 = j1, x2 = j2, x3 = j3, x4 = j4, x5 = j5, x6 = j6, x7 = j7,
          x8 = j8, x9 = j9, x10 = j10, x11 = j11, x12 = j12, x13 = j13, x14 = j14,
          x15 = j15, u;

      for (var i = 0; i < 20; i += 2) {
        u = x0 + x12 | 0;
        x4 ^= u<<7 | u>>>(32-7);
        u = x4 + x0 | 0;
        x8 ^= u<<9 | u>>>(32-9);
        u = x8 + x4 | 0;
        x12 ^= u<<13 | u>>>(32-13);
        u = x12 + x8 | 0;
        x0 ^= u<<18 | u>>>(32-18);

        u = x5 + x1 | 0;
        x9 ^= u<<7 | u>>>(32-7);
        u = x9 + x5 | 0;
        x13 ^= u<<9 | u>>>(32-9);
        u = x13 + x9 | 0;
        x1 ^= u<<13 | u>>>(32-13);
        u = x1 + x13 | 0;
        x5 ^= u<<18 | u>>>(32-18);

        u = x10 + x6 | 0;
        x14 ^= u<<7 | u>>>(32-7);
        u = x14 + x10 | 0;
        x2 ^= u<<9 | u>>>(32-9);
        u = x2 + x14 | 0;
        x6 ^= u<<13 | u>>>(32-13);
        u = x6 + x2 | 0;
        x10 ^= u<<18 | u>>>(32-18);

        u = x15 + x11 | 0;
        x3 ^= u<<7 | u>>>(32-7);
        u = x3 + x15 | 0;
        x7 ^= u<<9 | u>>>(32-9);
        u = x7 + x3 | 0;
        x11 ^= u<<13 | u>>>(32-13);
        u = x11 + x7 | 0;
        x15 ^= u<<18 | u>>>(32-18);

        u = x0 + x3 | 0;
        x1 ^= u<<7 | u>>>(32-7);
        u = x1 + x0 | 0;
        x2 ^= u<<9 | u>>>(32-9);
        u = x2 + x1 | 0;
        x3 ^= u<<13 | u>>>(32-13);
        u = x3 + x2 | 0;
        x0 ^= u<<18 | u>>>(32-18);

        u = x5 + x4 | 0;
        x6 ^= u<<7 | u>>>(32-7);
        u = x6 + x5 | 0;
        x7 ^= u<<9 | u>>>(32-9);
        u = x7 + x6 | 0;
        x4 ^= u<<13 | u>>>(32-13);
        u = x4 + x7 | 0;
        x5 ^= u<<18 | u>>>(32-18);

        u = x10 + x9 | 0;
        x11 ^= u<<7 | u>>>(32-7);
        u = x11 + x10 | 0;
        x8 ^= u<<9 | u>>>(32-9);
        u = x8 + x11 | 0;
        x9 ^= u<<13 | u>>>(32-13);
        u = x9 + x8 | 0;
        x10 ^= u<<18 | u>>>(32-18);

        u = x15 + x14 | 0;
        x12 ^= u<<7 | u>>>(32-7);
        u = x12 + x15 | 0;
        x13 ^= u<<9 | u>>>(32-9);
        u = x13 + x12 | 0;
        x14 ^= u<<13 | u>>>(32-13);
        u = x14 + x13 | 0;
        x15 ^= u<<18 | u>>>(32-18);
      }
       x0 =  x0 +  j0 | 0;
       x1 =  x1 +  j1 | 0;
       x2 =  x2 +  j2 | 0;
       x3 =  x3 +  j3 | 0;
       x4 =  x4 +  j4 | 0;
       x5 =  x5 +  j5 | 0;
       x6 =  x6 +  j6 | 0;
       x7 =  x7 +  j7 | 0;
       x8 =  x8 +  j8 | 0;
       x9 =  x9 +  j9 | 0;
      x10 = x10 + j10 | 0;
      x11 = x11 + j11 | 0;
      x12 = x12 + j12 | 0;
      x13 = x13 + j13 | 0;
      x14 = x14 + j14 | 0;
      x15 = x15 + j15 | 0;

      o[ 0] = x0 >>>  0 & 0xff;
      o[ 1] = x0 >>>  8 & 0xff;
      o[ 2] = x0 >>> 16 & 0xff;
      o[ 3] = x0 >>> 24 & 0xff;

      o[ 4] = x1 >>>  0 & 0xff;
      o[ 5] = x1 >>>  8 & 0xff;
      o[ 6] = x1 >>> 16 & 0xff;
      o[ 7] = x1 >>> 24 & 0xff;

      o[ 8] = x2 >>>  0 & 0xff;
      o[ 9] = x2 >>>  8 & 0xff;
      o[10] = x2 >>> 16 & 0xff;
      o[11] = x2 >>> 24 & 0xff;

      o[12] = x3 >>>  0 & 0xff;
      o[13] = x3 >>>  8 & 0xff;
      o[14] = x3 >>> 16 & 0xff;
      o[15] = x3 >>> 24 & 0xff;

      o[16] = x4 >>>  0 & 0xff;
      o[17] = x4 >>>  8 & 0xff;
      o[18] = x4 >>> 16 & 0xff;
      o[19] = x4 >>> 24 & 0xff;

      o[20] = x5 >>>  0 & 0xff;
      o[21] = x5 >>>  8 & 0xff;
      o[22] = x5 >>> 16 & 0xff;
      o[23] = x5 >>> 24 & 0xff;

      o[24] = x6 >>>  0 & 0xff;
      o[25] = x6 >>>  8 & 0xff;
      o[26] = x6 >>> 16 & 0xff;
      o[27] = x6 >>> 24 & 0xff;

      o[28] = x7 >>>  0 & 0xff;
      o[29] = x7 >>>  8 & 0xff;
      o[30] = x7 >>> 16 & 0xff;
      o[31] = x7 >>> 24 & 0xff;

      o[32] = x8 >>>  0 & 0xff;
      o[33] = x8 >>>  8 & 0xff;
      o[34] = x8 >>> 16 & 0xff;
      o[35] = x8 >>> 24 & 0xff;

      o[36] = x9 >>>  0 & 0xff;
      o[37] = x9 >>>  8 & 0xff;
      o[38] = x9 >>> 16 & 0xff;
      o[39] = x9 >>> 24 & 0xff;

      o[40] = x10 >>>  0 & 0xff;
      o[41] = x10 >>>  8 & 0xff;
      o[42] = x10 >>> 16 & 0xff;
      o[43] = x10 >>> 24 & 0xff;

      o[44] = x11 >>>  0 & 0xff;
      o[45] = x11 >>>  8 & 0xff;
      o[46] = x11 >>> 16 & 0xff;
      o[47] = x11 >>> 24 & 0xff;

      o[48] = x12 >>>  0 & 0xff;
      o[49] = x12 >>>  8 & 0xff;
      o[50] = x12 >>> 16 & 0xff;
      o[51] = x12 >>> 24 & 0xff;

      o[52] = x13 >>>  0 & 0xff;
      o[53] = x13 >>>  8 & 0xff;
      o[54] = x13 >>> 16 & 0xff;
      o[55] = x13 >>> 24 & 0xff;

      o[56] = x14 >>>  0 & 0xff;
      o[57] = x14 >>>  8 & 0xff;
      o[58] = x14 >>> 16 & 0xff;
      o[59] = x14 >>> 24 & 0xff;

      o[60] = x15 >>>  0 & 0xff;
      o[61] = x15 >>>  8 & 0xff;
      o[62] = x15 >>> 16 & 0xff;
      o[63] = x15 >>> 24 & 0xff;
    }

    function core_hsalsa20(o,p,k,c) {
      var j0  = c[ 0] & 0xff | (c[ 1] & 0xff)<<8 | (c[ 2] & 0xff)<<16 | (c[ 3] & 0xff)<<24,
          j1  = k[ 0] & 0xff | (k[ 1] & 0xff)<<8 | (k[ 2] & 0xff)<<16 | (k[ 3] & 0xff)<<24,
          j2  = k[ 4] & 0xff | (k[ 5] & 0xff)<<8 | (k[ 6] & 0xff)<<16 | (k[ 7] & 0xff)<<24,
          j3  = k[ 8] & 0xff | (k[ 9] & 0xff)<<8 | (k[10] & 0xff)<<16 | (k[11] & 0xff)<<24,
          j4  = k[12] & 0xff | (k[13] & 0xff)<<8 | (k[14] & 0xff)<<16 | (k[15] & 0xff)<<24,
          j5  = c[ 4] & 0xff | (c[ 5] & 0xff)<<8 | (c[ 6] & 0xff)<<16 | (c[ 7] & 0xff)<<24,
          j6  = p[ 0] & 0xff | (p[ 1] & 0xff)<<8 | (p[ 2] & 0xff)<<16 | (p[ 3] & 0xff)<<24,
          j7  = p[ 4] & 0xff | (p[ 5] & 0xff)<<8 | (p[ 6] & 0xff)<<16 | (p[ 7] & 0xff)<<24,
          j8  = p[ 8] & 0xff | (p[ 9] & 0xff)<<8 | (p[10] & 0xff)<<16 | (p[11] & 0xff)<<24,
          j9  = p[12] & 0xff | (p[13] & 0xff)<<8 | (p[14] & 0xff)<<16 | (p[15] & 0xff)<<24,
          j10 = c[ 8] & 0xff | (c[ 9] & 0xff)<<8 | (c[10] & 0xff)<<16 | (c[11] & 0xff)<<24,
          j11 = k[16] & 0xff | (k[17] & 0xff)<<8 | (k[18] & 0xff)<<16 | (k[19] & 0xff)<<24,
          j12 = k[20] & 0xff | (k[21] & 0xff)<<8 | (k[22] & 0xff)<<16 | (k[23] & 0xff)<<24,
          j13 = k[24] & 0xff | (k[25] & 0xff)<<8 | (k[26] & 0xff)<<16 | (k[27] & 0xff)<<24,
          j14 = k[28] & 0xff | (k[29] & 0xff)<<8 | (k[30] & 0xff)<<16 | (k[31] & 0xff)<<24,
          j15 = c[12] & 0xff | (c[13] & 0xff)<<8 | (c[14] & 0xff)<<16 | (c[15] & 0xff)<<24;

      var x0 = j0, x1 = j1, x2 = j2, x3 = j3, x4 = j4, x5 = j5, x6 = j6, x7 = j7,
          x8 = j8, x9 = j9, x10 = j10, x11 = j11, x12 = j12, x13 = j13, x14 = j14,
          x15 = j15, u;

      for (var i = 0; i < 20; i += 2) {
        u = x0 + x12 | 0;
        x4 ^= u<<7 | u>>>(32-7);
        u = x4 + x0 | 0;
        x8 ^= u<<9 | u>>>(32-9);
        u = x8 + x4 | 0;
        x12 ^= u<<13 | u>>>(32-13);
        u = x12 + x8 | 0;
        x0 ^= u<<18 | u>>>(32-18);

        u = x5 + x1 | 0;
        x9 ^= u<<7 | u>>>(32-7);
        u = x9 + x5 | 0;
        x13 ^= u<<9 | u>>>(32-9);
        u = x13 + x9 | 0;
        x1 ^= u<<13 | u>>>(32-13);
        u = x1 + x13 | 0;
        x5 ^= u<<18 | u>>>(32-18);

        u = x10 + x6 | 0;
        x14 ^= u<<7 | u>>>(32-7);
        u = x14 + x10 | 0;
        x2 ^= u<<9 | u>>>(32-9);
        u = x2 + x14 | 0;
        x6 ^= u<<13 | u>>>(32-13);
        u = x6 + x2 | 0;
        x10 ^= u<<18 | u>>>(32-18);

        u = x15 + x11 | 0;
        x3 ^= u<<7 | u>>>(32-7);
        u = x3 + x15 | 0;
        x7 ^= u<<9 | u>>>(32-9);
        u = x7 + x3 | 0;
        x11 ^= u<<13 | u>>>(32-13);
        u = x11 + x7 | 0;
        x15 ^= u<<18 | u>>>(32-18);

        u = x0 + x3 | 0;
        x1 ^= u<<7 | u>>>(32-7);
        u = x1 + x0 | 0;
        x2 ^= u<<9 | u>>>(32-9);
        u = x2 + x1 | 0;
        x3 ^= u<<13 | u>>>(32-13);
        u = x3 + x2 | 0;
        x0 ^= u<<18 | u>>>(32-18);

        u = x5 + x4 | 0;
        x6 ^= u<<7 | u>>>(32-7);
        u = x6 + x5 | 0;
        x7 ^= u<<9 | u>>>(32-9);
        u = x7 + x6 | 0;
        x4 ^= u<<13 | u>>>(32-13);
        u = x4 + x7 | 0;
        x5 ^= u<<18 | u>>>(32-18);

        u = x10 + x9 | 0;
        x11 ^= u<<7 | u>>>(32-7);
        u = x11 + x10 | 0;
        x8 ^= u<<9 | u>>>(32-9);
        u = x8 + x11 | 0;
        x9 ^= u<<13 | u>>>(32-13);
        u = x9 + x8 | 0;
        x10 ^= u<<18 | u>>>(32-18);

        u = x15 + x14 | 0;
        x12 ^= u<<7 | u>>>(32-7);
        u = x12 + x15 | 0;
        x13 ^= u<<9 | u>>>(32-9);
        u = x13 + x12 | 0;
        x14 ^= u<<13 | u>>>(32-13);
        u = x14 + x13 | 0;
        x15 ^= u<<18 | u>>>(32-18);
      }

      o[ 0] = x0 >>>  0 & 0xff;
      o[ 1] = x0 >>>  8 & 0xff;
      o[ 2] = x0 >>> 16 & 0xff;
      o[ 3] = x0 >>> 24 & 0xff;

      o[ 4] = x5 >>>  0 & 0xff;
      o[ 5] = x5 >>>  8 & 0xff;
      o[ 6] = x5 >>> 16 & 0xff;
      o[ 7] = x5 >>> 24 & 0xff;

      o[ 8] = x10 >>>  0 & 0xff;
      o[ 9] = x10 >>>  8 & 0xff;
      o[10] = x10 >>> 16 & 0xff;
      o[11] = x10 >>> 24 & 0xff;

      o[12] = x15 >>>  0 & 0xff;
      o[13] = x15 >>>  8 & 0xff;
      o[14] = x15 >>> 16 & 0xff;
      o[15] = x15 >>> 24 & 0xff;

      o[16] = x6 >>>  0 & 0xff;
      o[17] = x6 >>>  8 & 0xff;
      o[18] = x6 >>> 16 & 0xff;
      o[19] = x6 >>> 24 & 0xff;

      o[20] = x7 >>>  0 & 0xff;
      o[21] = x7 >>>  8 & 0xff;
      o[22] = x7 >>> 16 & 0xff;
      o[23] = x7 >>> 24 & 0xff;

      o[24] = x8 >>>  0 & 0xff;
      o[25] = x8 >>>  8 & 0xff;
      o[26] = x8 >>> 16 & 0xff;
      o[27] = x8 >>> 24 & 0xff;

      o[28] = x9 >>>  0 & 0xff;
      o[29] = x9 >>>  8 & 0xff;
      o[30] = x9 >>> 16 & 0xff;
      o[31] = x9 >>> 24 & 0xff;
    }

    function crypto_core_salsa20(out,inp,k,c) {
      core_salsa20(out,inp,k,c);
    }

    function crypto_core_hsalsa20(out,inp,k,c) {
      core_hsalsa20(out,inp,k,c);
    }

    var sigma = new Uint8Array([101, 120, 112, 97, 110, 100, 32, 51, 50, 45, 98, 121, 116, 101, 32, 107]);
                // "expand 32-byte k"

    function crypto_stream_salsa20_xor(c,cpos,m,mpos,b,n,k) {
      var z = new Uint8Array(16), x = new Uint8Array(64);
      var u, i;
      for (i = 0; i < 16; i++) z[i] = 0;
      for (i = 0; i < 8; i++) z[i] = n[i];
      while (b >= 64) {
        crypto_core_salsa20(x,z,k,sigma);
        for (i = 0; i < 64; i++) c[cpos+i] = m[mpos+i] ^ x[i];
        u = 1;
        for (i = 8; i < 16; i++) {
          u = u + (z[i] & 0xff) | 0;
          z[i] = u & 0xff;
          u >>>= 8;
        }
        b -= 64;
        cpos += 64;
        mpos += 64;
      }
      if (b > 0) {
        crypto_core_salsa20(x,z,k,sigma);
        for (i = 0; i < b; i++) c[cpos+i] = m[mpos+i] ^ x[i];
      }
      return 0;
    }

    function crypto_stream_salsa20(c,cpos,b,n,k) {
      var z = new Uint8Array(16), x = new Uint8Array(64);
      var u, i;
      for (i = 0; i < 16; i++) z[i] = 0;
      for (i = 0; i < 8; i++) z[i] = n[i];
      while (b >= 64) {
        crypto_core_salsa20(x,z,k,sigma);
        for (i = 0; i < 64; i++) c[cpos+i] = x[i];
        u = 1;
        for (i = 8; i < 16; i++) {
          u = u + (z[i] & 0xff) | 0;
          z[i] = u & 0xff;
          u >>>= 8;
        }
        b -= 64;
        cpos += 64;
      }
      if (b > 0) {
        crypto_core_salsa20(x,z,k,sigma);
        for (i = 0; i < b; i++) c[cpos+i] = x[i];
      }
      return 0;
    }

    function crypto_stream(c,cpos,d,n,k) {
      var s = new Uint8Array(32);
      crypto_core_hsalsa20(s,n,k,sigma);
      var sn = new Uint8Array(8);
      for (var i = 0; i < 8; i++) sn[i] = n[i+16];
      return crypto_stream_salsa20(c,cpos,d,sn,s);
    }

    function crypto_stream_xor(c,cpos,m,mpos,d,n,k) {
      var s = new Uint8Array(32);
      crypto_core_hsalsa20(s,n,k,sigma);
      var sn = new Uint8Array(8);
      for (var i = 0; i < 8; i++) sn[i] = n[i+16];
      return crypto_stream_salsa20_xor(c,cpos,m,mpos,d,sn,s);
    }

    /*
    * Port of Andrew Moon's Poly1305-donna-16. Public domain.
    * https://github.com/floodyberry/poly1305-donna
    */

    var poly1305 = function(key) {
      this.buffer = new Uint8Array(16);
      this.r = new Uint16Array(10);
      this.h = new Uint16Array(10);
      this.pad = new Uint16Array(8);
      this.leftover = 0;
      this.fin = 0;

      var t0, t1, t2, t3, t4, t5, t6, t7;

      t0 = key[ 0] & 0xff | (key[ 1] & 0xff) << 8; this.r[0] = ( t0                     ) & 0x1fff;
      t1 = key[ 2] & 0xff | (key[ 3] & 0xff) << 8; this.r[1] = ((t0 >>> 13) | (t1 <<  3)) & 0x1fff;
      t2 = key[ 4] & 0xff | (key[ 5] & 0xff) << 8; this.r[2] = ((t1 >>> 10) | (t2 <<  6)) & 0x1f03;
      t3 = key[ 6] & 0xff | (key[ 7] & 0xff) << 8; this.r[3] = ((t2 >>>  7) | (t3 <<  9)) & 0x1fff;
      t4 = key[ 8] & 0xff | (key[ 9] & 0xff) << 8; this.r[4] = ((t3 >>>  4) | (t4 << 12)) & 0x00ff;
      this.r[5] = ((t4 >>>  1)) & 0x1ffe;
      t5 = key[10] & 0xff | (key[11] & 0xff) << 8; this.r[6] = ((t4 >>> 14) | (t5 <<  2)) & 0x1fff;
      t6 = key[12] & 0xff | (key[13] & 0xff) << 8; this.r[7] = ((t5 >>> 11) | (t6 <<  5)) & 0x1f81;
      t7 = key[14] & 0xff | (key[15] & 0xff) << 8; this.r[8] = ((t6 >>>  8) | (t7 <<  8)) & 0x1fff;
      this.r[9] = ((t7 >>>  5)) & 0x007f;

      this.pad[0] = key[16] & 0xff | (key[17] & 0xff) << 8;
      this.pad[1] = key[18] & 0xff | (key[19] & 0xff) << 8;
      this.pad[2] = key[20] & 0xff | (key[21] & 0xff) << 8;
      this.pad[3] = key[22] & 0xff | (key[23] & 0xff) << 8;
      this.pad[4] = key[24] & 0xff | (key[25] & 0xff) << 8;
      this.pad[5] = key[26] & 0xff | (key[27] & 0xff) << 8;
      this.pad[6] = key[28] & 0xff | (key[29] & 0xff) << 8;
      this.pad[7] = key[30] & 0xff | (key[31] & 0xff) << 8;
    };

    poly1305.prototype.blocks = function(m, mpos, bytes) {
      var hibit = this.fin ? 0 : (1 << 11);
      var t0, t1, t2, t3, t4, t5, t6, t7, c;
      var d0, d1, d2, d3, d4, d5, d6, d7, d8, d9;

      var h0 = this.h[0],
          h1 = this.h[1],
          h2 = this.h[2],
          h3 = this.h[3],
          h4 = this.h[4],
          h5 = this.h[5],
          h6 = this.h[6],
          h7 = this.h[7],
          h8 = this.h[8],
          h9 = this.h[9];

      var r0 = this.r[0],
          r1 = this.r[1],
          r2 = this.r[2],
          r3 = this.r[3],
          r4 = this.r[4],
          r5 = this.r[5],
          r6 = this.r[6],
          r7 = this.r[7],
          r8 = this.r[8],
          r9 = this.r[9];

      while (bytes >= 16) {
        t0 = m[mpos+ 0] & 0xff | (m[mpos+ 1] & 0xff) << 8; h0 += ( t0                     ) & 0x1fff;
        t1 = m[mpos+ 2] & 0xff | (m[mpos+ 3] & 0xff) << 8; h1 += ((t0 >>> 13) | (t1 <<  3)) & 0x1fff;
        t2 = m[mpos+ 4] & 0xff | (m[mpos+ 5] & 0xff) << 8; h2 += ((t1 >>> 10) | (t2 <<  6)) & 0x1fff;
        t3 = m[mpos+ 6] & 0xff | (m[mpos+ 7] & 0xff) << 8; h3 += ((t2 >>>  7) | (t3 <<  9)) & 0x1fff;
        t4 = m[mpos+ 8] & 0xff | (m[mpos+ 9] & 0xff) << 8; h4 += ((t3 >>>  4) | (t4 << 12)) & 0x1fff;
        h5 += ((t4 >>>  1)) & 0x1fff;
        t5 = m[mpos+10] & 0xff | (m[mpos+11] & 0xff) << 8; h6 += ((t4 >>> 14) | (t5 <<  2)) & 0x1fff;
        t6 = m[mpos+12] & 0xff | (m[mpos+13] & 0xff) << 8; h7 += ((t5 >>> 11) | (t6 <<  5)) & 0x1fff;
        t7 = m[mpos+14] & 0xff | (m[mpos+15] & 0xff) << 8; h8 += ((t6 >>>  8) | (t7 <<  8)) & 0x1fff;
        h9 += ((t7 >>> 5)) | hibit;

        c = 0;

        d0 = c;
        d0 += h0 * r0;
        d0 += h1 * (5 * r9);
        d0 += h2 * (5 * r8);
        d0 += h3 * (5 * r7);
        d0 += h4 * (5 * r6);
        c = (d0 >>> 13); d0 &= 0x1fff;
        d0 += h5 * (5 * r5);
        d0 += h6 * (5 * r4);
        d0 += h7 * (5 * r3);
        d0 += h8 * (5 * r2);
        d0 += h9 * (5 * r1);
        c += (d0 >>> 13); d0 &= 0x1fff;

        d1 = c;
        d1 += h0 * r1;
        d1 += h1 * r0;
        d1 += h2 * (5 * r9);
        d1 += h3 * (5 * r8);
        d1 += h4 * (5 * r7);
        c = (d1 >>> 13); d1 &= 0x1fff;
        d1 += h5 * (5 * r6);
        d1 += h6 * (5 * r5);
        d1 += h7 * (5 * r4);
        d1 += h8 * (5 * r3);
        d1 += h9 * (5 * r2);
        c += (d1 >>> 13); d1 &= 0x1fff;

        d2 = c;
        d2 += h0 * r2;
        d2 += h1 * r1;
        d2 += h2 * r0;
        d2 += h3 * (5 * r9);
        d2 += h4 * (5 * r8);
        c = (d2 >>> 13); d2 &= 0x1fff;
        d2 += h5 * (5 * r7);
        d2 += h6 * (5 * r6);
        d2 += h7 * (5 * r5);
        d2 += h8 * (5 * r4);
        d2 += h9 * (5 * r3);
        c += (d2 >>> 13); d2 &= 0x1fff;

        d3 = c;
        d3 += h0 * r3;
        d3 += h1 * r2;
        d3 += h2 * r1;
        d3 += h3 * r0;
        d3 += h4 * (5 * r9);
        c = (d3 >>> 13); d3 &= 0x1fff;
        d3 += h5 * (5 * r8);
        d3 += h6 * (5 * r7);
        d3 += h7 * (5 * r6);
        d3 += h8 * (5 * r5);
        d3 += h9 * (5 * r4);
        c += (d3 >>> 13); d3 &= 0x1fff;

        d4 = c;
        d4 += h0 * r4;
        d4 += h1 * r3;
        d4 += h2 * r2;
        d4 += h3 * r1;
        d4 += h4 * r0;
        c = (d4 >>> 13); d4 &= 0x1fff;
        d4 += h5 * (5 * r9);
        d4 += h6 * (5 * r8);
        d4 += h7 * (5 * r7);
        d4 += h8 * (5 * r6);
        d4 += h9 * (5 * r5);
        c += (d4 >>> 13); d4 &= 0x1fff;

        d5 = c;
        d5 += h0 * r5;
        d5 += h1 * r4;
        d5 += h2 * r3;
        d5 += h3 * r2;
        d5 += h4 * r1;
        c = (d5 >>> 13); d5 &= 0x1fff;
        d5 += h5 * r0;
        d5 += h6 * (5 * r9);
        d5 += h7 * (5 * r8);
        d5 += h8 * (5 * r7);
        d5 += h9 * (5 * r6);
        c += (d5 >>> 13); d5 &= 0x1fff;

        d6 = c;
        d6 += h0 * r6;
        d6 += h1 * r5;
        d6 += h2 * r4;
        d6 += h3 * r3;
        d6 += h4 * r2;
        c = (d6 >>> 13); d6 &= 0x1fff;
        d6 += h5 * r1;
        d6 += h6 * r0;
        d6 += h7 * (5 * r9);
        d6 += h8 * (5 * r8);
        d6 += h9 * (5 * r7);
        c += (d6 >>> 13); d6 &= 0x1fff;

        d7 = c;
        d7 += h0 * r7;
        d7 += h1 * r6;
        d7 += h2 * r5;
        d7 += h3 * r4;
        d7 += h4 * r3;
        c = (d7 >>> 13); d7 &= 0x1fff;
        d7 += h5 * r2;
        d7 += h6 * r1;
        d7 += h7 * r0;
        d7 += h8 * (5 * r9);
        d7 += h9 * (5 * r8);
        c += (d7 >>> 13); d7 &= 0x1fff;

        d8 = c;
        d8 += h0 * r8;
        d8 += h1 * r7;
        d8 += h2 * r6;
        d8 += h3 * r5;
        d8 += h4 * r4;
        c = (d8 >>> 13); d8 &= 0x1fff;
        d8 += h5 * r3;
        d8 += h6 * r2;
        d8 += h7 * r1;
        d8 += h8 * r0;
        d8 += h9 * (5 * r9);
        c += (d8 >>> 13); d8 &= 0x1fff;

        d9 = c;
        d9 += h0 * r9;
        d9 += h1 * r8;
        d9 += h2 * r7;
        d9 += h3 * r6;
        d9 += h4 * r5;
        c = (d9 >>> 13); d9 &= 0x1fff;
        d9 += h5 * r4;
        d9 += h6 * r3;
        d9 += h7 * r2;
        d9 += h8 * r1;
        d9 += h9 * r0;
        c += (d9 >>> 13); d9 &= 0x1fff;

        c = (((c << 2) + c)) | 0;
        c = (c + d0) | 0;
        d0 = c & 0x1fff;
        c = (c >>> 13);
        d1 += c;

        h0 = d0;
        h1 = d1;
        h2 = d2;
        h3 = d3;
        h4 = d4;
        h5 = d5;
        h6 = d6;
        h7 = d7;
        h8 = d8;
        h9 = d9;

        mpos += 16;
        bytes -= 16;
      }
      this.h[0] = h0;
      this.h[1] = h1;
      this.h[2] = h2;
      this.h[3] = h3;
      this.h[4] = h4;
      this.h[5] = h5;
      this.h[6] = h6;
      this.h[7] = h7;
      this.h[8] = h8;
      this.h[9] = h9;
    };

    poly1305.prototype.finish = function(mac, macpos) {
      var g = new Uint16Array(10);
      var c, mask, f, i;

      if (this.leftover) {
        i = this.leftover;
        this.buffer[i++] = 1;
        for (; i < 16; i++) this.buffer[i] = 0;
        this.fin = 1;
        this.blocks(this.buffer, 0, 16);
      }

      c = this.h[1] >>> 13;
      this.h[1] &= 0x1fff;
      for (i = 2; i < 10; i++) {
        this.h[i] += c;
        c = this.h[i] >>> 13;
        this.h[i] &= 0x1fff;
      }
      this.h[0] += (c * 5);
      c = this.h[0] >>> 13;
      this.h[0] &= 0x1fff;
      this.h[1] += c;
      c = this.h[1] >>> 13;
      this.h[1] &= 0x1fff;
      this.h[2] += c;

      g[0] = this.h[0] + 5;
      c = g[0] >>> 13;
      g[0] &= 0x1fff;
      for (i = 1; i < 10; i++) {
        g[i] = this.h[i] + c;
        c = g[i] >>> 13;
        g[i] &= 0x1fff;
      }
      g[9] -= (1 << 13);

      mask = (c ^ 1) - 1;
      for (i = 0; i < 10; i++) g[i] &= mask;
      mask = ~mask;
      for (i = 0; i < 10; i++) this.h[i] = (this.h[i] & mask) | g[i];

      this.h[0] = ((this.h[0]       ) | (this.h[1] << 13)                    ) & 0xffff;
      this.h[1] = ((this.h[1] >>>  3) | (this.h[2] << 10)                    ) & 0xffff;
      this.h[2] = ((this.h[2] >>>  6) | (this.h[3] <<  7)                    ) & 0xffff;
      this.h[3] = ((this.h[3] >>>  9) | (this.h[4] <<  4)                    ) & 0xffff;
      this.h[4] = ((this.h[4] >>> 12) | (this.h[5] <<  1) | (this.h[6] << 14)) & 0xffff;
      this.h[5] = ((this.h[6] >>>  2) | (this.h[7] << 11)                    ) & 0xffff;
      this.h[6] = ((this.h[7] >>>  5) | (this.h[8] <<  8)                    ) & 0xffff;
      this.h[7] = ((this.h[8] >>>  8) | (this.h[9] <<  5)                    ) & 0xffff;

      f = this.h[0] + this.pad[0];
      this.h[0] = f & 0xffff;
      for (i = 1; i < 8; i++) {
        f = (((this.h[i] + this.pad[i]) | 0) + (f >>> 16)) | 0;
        this.h[i] = f & 0xffff;
      }

      mac[macpos+ 0] = (this.h[0] >>> 0) & 0xff;
      mac[macpos+ 1] = (this.h[0] >>> 8) & 0xff;
      mac[macpos+ 2] = (this.h[1] >>> 0) & 0xff;
      mac[macpos+ 3] = (this.h[1] >>> 8) & 0xff;
      mac[macpos+ 4] = (this.h[2] >>> 0) & 0xff;
      mac[macpos+ 5] = (this.h[2] >>> 8) & 0xff;
      mac[macpos+ 6] = (this.h[3] >>> 0) & 0xff;
      mac[macpos+ 7] = (this.h[3] >>> 8) & 0xff;
      mac[macpos+ 8] = (this.h[4] >>> 0) & 0xff;
      mac[macpos+ 9] = (this.h[4] >>> 8) & 0xff;
      mac[macpos+10] = (this.h[5] >>> 0) & 0xff;
      mac[macpos+11] = (this.h[5] >>> 8) & 0xff;
      mac[macpos+12] = (this.h[6] >>> 0) & 0xff;
      mac[macpos+13] = (this.h[6] >>> 8) & 0xff;
      mac[macpos+14] = (this.h[7] >>> 0) & 0xff;
      mac[macpos+15] = (this.h[7] >>> 8) & 0xff;
    };

    poly1305.prototype.update = function(m, mpos, bytes) {
      var i, want;

      if (this.leftover) {
        want = (16 - this.leftover);
        if (want > bytes)
          want = bytes;
        for (i = 0; i < want; i++)
          this.buffer[this.leftover + i] = m[mpos+i];
        bytes -= want;
        mpos += want;
        this.leftover += want;
        if (this.leftover < 16)
          return;
        this.blocks(this.buffer, 0, 16);
        this.leftover = 0;
      }

      if (bytes >= 16) {
        want = bytes - (bytes % 16);
        this.blocks(m, mpos, want);
        mpos += want;
        bytes -= want;
      }

      if (bytes) {
        for (i = 0; i < bytes; i++)
          this.buffer[this.leftover + i] = m[mpos+i];
        this.leftover += bytes;
      }
    };

    function crypto_onetimeauth(out, outpos, m, mpos, n, k) {
      var s = new poly1305(k);
      s.update(m, mpos, n);
      s.finish(out, outpos);
      return 0;
    }

    function crypto_onetimeauth_verify(h, hpos, m, mpos, n, k) {
      var x = new Uint8Array(16);
      crypto_onetimeauth(x,0,m,mpos,n,k);
      return crypto_verify_16(h,hpos,x,0);
    }

    function crypto_secretbox(c,m,d,n,k) {
      var i;
      if (d < 32) return -1;
      crypto_stream_xor(c,0,m,0,d,n,k);
      crypto_onetimeauth(c, 16, c, 32, d - 32, c);
      for (i = 0; i < 16; i++) c[i] = 0;
      return 0;
    }

    function crypto_secretbox_open(m,c,d,n,k) {
      var i;
      var x = new Uint8Array(32);
      if (d < 32) return -1;
      crypto_stream(x,0,32,n,k);
      if (crypto_onetimeauth_verify(c, 16,c, 32,d - 32,x) !== 0) return -1;
      crypto_stream_xor(m,0,c,0,d,n,k);
      for (i = 0; i < 32; i++) m[i] = 0;
      return 0;
    }

    function set25519(r, a) {
      var i;
      for (i = 0; i < 16; i++) r[i] = a[i]|0;
    }

    function car25519(o) {
      var i, v, c = 1;
      for (i = 0; i < 16; i++) {
        v = o[i] + c + 65535;
        c = Math.floor(v / 65536);
        o[i] = v - c * 65536;
      }
      o[0] += c-1 + 37 * (c-1);
    }

    function sel25519(p, q, b) {
      var t, c = ~(b-1);
      for (var i = 0; i < 16; i++) {
        t = c & (p[i] ^ q[i]);
        p[i] ^= t;
        q[i] ^= t;
      }
    }

    function pack25519(o, n) {
      var i, j, b;
      var m = gf(), t = gf();
      for (i = 0; i < 16; i++) t[i] = n[i];
      car25519(t);
      car25519(t);
      car25519(t);
      for (j = 0; j < 2; j++) {
        m[0] = t[0] - 0xffed;
        for (i = 1; i < 15; i++) {
          m[i] = t[i] - 0xffff - ((m[i-1]>>16) & 1);
          m[i-1] &= 0xffff;
        }
        m[15] = t[15] - 0x7fff - ((m[14]>>16) & 1);
        b = (m[15]>>16) & 1;
        m[14] &= 0xffff;
        sel25519(t, m, 1-b);
      }
      for (i = 0; i < 16; i++) {
        o[2*i] = t[i] & 0xff;
        o[2*i+1] = t[i]>>8;
      }
    }

    function neq25519(a, b) {
      var c = new Uint8Array(32), d = new Uint8Array(32);
      pack25519(c, a);
      pack25519(d, b);
      return crypto_verify_32(c, 0, d, 0);
    }

    function par25519(a) {
      var d = new Uint8Array(32);
      pack25519(d, a);
      return d[0] & 1;
    }

    function unpack25519(o, n) {
      var i;
      for (i = 0; i < 16; i++) o[i] = n[2*i] + (n[2*i+1] << 8);
      o[15] &= 0x7fff;
    }

    function A(o, a, b) {
      for (var i = 0; i < 16; i++) o[i] = a[i] + b[i];
    }

    function Z(o, a, b) {
      for (var i = 0; i < 16; i++) o[i] = a[i] - b[i];
    }

    function M(o, a, b) {
      var v, c,
         t0 = 0,  t1 = 0,  t2 = 0,  t3 = 0,  t4 = 0,  t5 = 0,  t6 = 0,  t7 = 0,
         t8 = 0,  t9 = 0, t10 = 0, t11 = 0, t12 = 0, t13 = 0, t14 = 0, t15 = 0,
        t16 = 0, t17 = 0, t18 = 0, t19 = 0, t20 = 0, t21 = 0, t22 = 0, t23 = 0,
        t24 = 0, t25 = 0, t26 = 0, t27 = 0, t28 = 0, t29 = 0, t30 = 0,
        b0 = b[0],
        b1 = b[1],
        b2 = b[2],
        b3 = b[3],
        b4 = b[4],
        b5 = b[5],
        b6 = b[6],
        b7 = b[7],
        b8 = b[8],
        b9 = b[9],
        b10 = b[10],
        b11 = b[11],
        b12 = b[12],
        b13 = b[13],
        b14 = b[14],
        b15 = b[15];

      v = a[0];
      t0 += v * b0;
      t1 += v * b1;
      t2 += v * b2;
      t3 += v * b3;
      t4 += v * b4;
      t5 += v * b5;
      t6 += v * b6;
      t7 += v * b7;
      t8 += v * b8;
      t9 += v * b9;
      t10 += v * b10;
      t11 += v * b11;
      t12 += v * b12;
      t13 += v * b13;
      t14 += v * b14;
      t15 += v * b15;
      v = a[1];
      t1 += v * b0;
      t2 += v * b1;
      t3 += v * b2;
      t4 += v * b3;
      t5 += v * b4;
      t6 += v * b5;
      t7 += v * b6;
      t8 += v * b7;
      t9 += v * b8;
      t10 += v * b9;
      t11 += v * b10;
      t12 += v * b11;
      t13 += v * b12;
      t14 += v * b13;
      t15 += v * b14;
      t16 += v * b15;
      v = a[2];
      t2 += v * b0;
      t3 += v * b1;
      t4 += v * b2;
      t5 += v * b3;
      t6 += v * b4;
      t7 += v * b5;
      t8 += v * b6;
      t9 += v * b7;
      t10 += v * b8;
      t11 += v * b9;
      t12 += v * b10;
      t13 += v * b11;
      t14 += v * b12;
      t15 += v * b13;
      t16 += v * b14;
      t17 += v * b15;
      v = a[3];
      t3 += v * b0;
      t4 += v * b1;
      t5 += v * b2;
      t6 += v * b3;
      t7 += v * b4;
      t8 += v * b5;
      t9 += v * b6;
      t10 += v * b7;
      t11 += v * b8;
      t12 += v * b9;
      t13 += v * b10;
      t14 += v * b11;
      t15 += v * b12;
      t16 += v * b13;
      t17 += v * b14;
      t18 += v * b15;
      v = a[4];
      t4 += v * b0;
      t5 += v * b1;
      t6 += v * b2;
      t7 += v * b3;
      t8 += v * b4;
      t9 += v * b5;
      t10 += v * b6;
      t11 += v * b7;
      t12 += v * b8;
      t13 += v * b9;
      t14 += v * b10;
      t15 += v * b11;
      t16 += v * b12;
      t17 += v * b13;
      t18 += v * b14;
      t19 += v * b15;
      v = a[5];
      t5 += v * b0;
      t6 += v * b1;
      t7 += v * b2;
      t8 += v * b3;
      t9 += v * b4;
      t10 += v * b5;
      t11 += v * b6;
      t12 += v * b7;
      t13 += v * b8;
      t14 += v * b9;
      t15 += v * b10;
      t16 += v * b11;
      t17 += v * b12;
      t18 += v * b13;
      t19 += v * b14;
      t20 += v * b15;
      v = a[6];
      t6 += v * b0;
      t7 += v * b1;
      t8 += v * b2;
      t9 += v * b3;
      t10 += v * b4;
      t11 += v * b5;
      t12 += v * b6;
      t13 += v * b7;
      t14 += v * b8;
      t15 += v * b9;
      t16 += v * b10;
      t17 += v * b11;
      t18 += v * b12;
      t19 += v * b13;
      t20 += v * b14;
      t21 += v * b15;
      v = a[7];
      t7 += v * b0;
      t8 += v * b1;
      t9 += v * b2;
      t10 += v * b3;
      t11 += v * b4;
      t12 += v * b5;
      t13 += v * b6;
      t14 += v * b7;
      t15 += v * b8;
      t16 += v * b9;
      t17 += v * b10;
      t18 += v * b11;
      t19 += v * b12;
      t20 += v * b13;
      t21 += v * b14;
      t22 += v * b15;
      v = a[8];
      t8 += v * b0;
      t9 += v * b1;
      t10 += v * b2;
      t11 += v * b3;
      t12 += v * b4;
      t13 += v * b5;
      t14 += v * b6;
      t15 += v * b7;
      t16 += v * b8;
      t17 += v * b9;
      t18 += v * b10;
      t19 += v * b11;
      t20 += v * b12;
      t21 += v * b13;
      t22 += v * b14;
      t23 += v * b15;
      v = a[9];
      t9 += v * b0;
      t10 += v * b1;
      t11 += v * b2;
      t12 += v * b3;
      t13 += v * b4;
      t14 += v * b5;
      t15 += v * b6;
      t16 += v * b7;
      t17 += v * b8;
      t18 += v * b9;
      t19 += v * b10;
      t20 += v * b11;
      t21 += v * b12;
      t22 += v * b13;
      t23 += v * b14;
      t24 += v * b15;
      v = a[10];
      t10 += v * b0;
      t11 += v * b1;
      t12 += v * b2;
      t13 += v * b3;
      t14 += v * b4;
      t15 += v * b5;
      t16 += v * b6;
      t17 += v * b7;
      t18 += v * b8;
      t19 += v * b9;
      t20 += v * b10;
      t21 += v * b11;
      t22 += v * b12;
      t23 += v * b13;
      t24 += v * b14;
      t25 += v * b15;
      v = a[11];
      t11 += v * b0;
      t12 += v * b1;
      t13 += v * b2;
      t14 += v * b3;
      t15 += v * b4;
      t16 += v * b5;
      t17 += v * b6;
      t18 += v * b7;
      t19 += v * b8;
      t20 += v * b9;
      t21 += v * b10;
      t22 += v * b11;
      t23 += v * b12;
      t24 += v * b13;
      t25 += v * b14;
      t26 += v * b15;
      v = a[12];
      t12 += v * b0;
      t13 += v * b1;
      t14 += v * b2;
      t15 += v * b3;
      t16 += v * b4;
      t17 += v * b5;
      t18 += v * b6;
      t19 += v * b7;
      t20 += v * b8;
      t21 += v * b9;
      t22 += v * b10;
      t23 += v * b11;
      t24 += v * b12;
      t25 += v * b13;
      t26 += v * b14;
      t27 += v * b15;
      v = a[13];
      t13 += v * b0;
      t14 += v * b1;
      t15 += v * b2;
      t16 += v * b3;
      t17 += v * b4;
      t18 += v * b5;
      t19 += v * b6;
      t20 += v * b7;
      t21 += v * b8;
      t22 += v * b9;
      t23 += v * b10;
      t24 += v * b11;
      t25 += v * b12;
      t26 += v * b13;
      t27 += v * b14;
      t28 += v * b15;
      v = a[14];
      t14 += v * b0;
      t15 += v * b1;
      t16 += v * b2;
      t17 += v * b3;
      t18 += v * b4;
      t19 += v * b5;
      t20 += v * b6;
      t21 += v * b7;
      t22 += v * b8;
      t23 += v * b9;
      t24 += v * b10;
      t25 += v * b11;
      t26 += v * b12;
      t27 += v * b13;
      t28 += v * b14;
      t29 += v * b15;
      v = a[15];
      t15 += v * b0;
      t16 += v * b1;
      t17 += v * b2;
      t18 += v * b3;
      t19 += v * b4;
      t20 += v * b5;
      t21 += v * b6;
      t22 += v * b7;
      t23 += v * b8;
      t24 += v * b9;
      t25 += v * b10;
      t26 += v * b11;
      t27 += v * b12;
      t28 += v * b13;
      t29 += v * b14;
      t30 += v * b15;

      t0  += 38 * t16;
      t1  += 38 * t17;
      t2  += 38 * t18;
      t3  += 38 * t19;
      t4  += 38 * t20;
      t5  += 38 * t21;
      t6  += 38 * t22;
      t7  += 38 * t23;
      t8  += 38 * t24;
      t9  += 38 * t25;
      t10 += 38 * t26;
      t11 += 38 * t27;
      t12 += 38 * t28;
      t13 += 38 * t29;
      t14 += 38 * t30;
      // t15 left as is

      // first car
      c = 1;
      v =  t0 + c + 65535; c = Math.floor(v / 65536);  t0 = v - c * 65536;
      v =  t1 + c + 65535; c = Math.floor(v / 65536);  t1 = v - c * 65536;
      v =  t2 + c + 65535; c = Math.floor(v / 65536);  t2 = v - c * 65536;
      v =  t3 + c + 65535; c = Math.floor(v / 65536);  t3 = v - c * 65536;
      v =  t4 + c + 65535; c = Math.floor(v / 65536);  t4 = v - c * 65536;
      v =  t5 + c + 65535; c = Math.floor(v / 65536);  t5 = v - c * 65536;
      v =  t6 + c + 65535; c = Math.floor(v / 65536);  t6 = v - c * 65536;
      v =  t7 + c + 65535; c = Math.floor(v / 65536);  t7 = v - c * 65536;
      v =  t8 + c + 65535; c = Math.floor(v / 65536);  t8 = v - c * 65536;
      v =  t9 + c + 65535; c = Math.floor(v / 65536);  t9 = v - c * 65536;
      v = t10 + c + 65535; c = Math.floor(v / 65536); t10 = v - c * 65536;
      v = t11 + c + 65535; c = Math.floor(v / 65536); t11 = v - c * 65536;
      v = t12 + c + 65535; c = Math.floor(v / 65536); t12 = v - c * 65536;
      v = t13 + c + 65535; c = Math.floor(v / 65536); t13 = v - c * 65536;
      v = t14 + c + 65535; c = Math.floor(v / 65536); t14 = v - c * 65536;
      v = t15 + c + 65535; c = Math.floor(v / 65536); t15 = v - c * 65536;
      t0 += c-1 + 37 * (c-1);

      // second car
      c = 1;
      v =  t0 + c + 65535; c = Math.floor(v / 65536);  t0 = v - c * 65536;
      v =  t1 + c + 65535; c = Math.floor(v / 65536);  t1 = v - c * 65536;
      v =  t2 + c + 65535; c = Math.floor(v / 65536);  t2 = v - c * 65536;
      v =  t3 + c + 65535; c = Math.floor(v / 65536);  t3 = v - c * 65536;
      v =  t4 + c + 65535; c = Math.floor(v / 65536);  t4 = v - c * 65536;
      v =  t5 + c + 65535; c = Math.floor(v / 65536);  t5 = v - c * 65536;
      v =  t6 + c + 65535; c = Math.floor(v / 65536);  t6 = v - c * 65536;
      v =  t7 + c + 65535; c = Math.floor(v / 65536);  t7 = v - c * 65536;
      v =  t8 + c + 65535; c = Math.floor(v / 65536);  t8 = v - c * 65536;
      v =  t9 + c + 65535; c = Math.floor(v / 65536);  t9 = v - c * 65536;
      v = t10 + c + 65535; c = Math.floor(v / 65536); t10 = v - c * 65536;
      v = t11 + c + 65535; c = Math.floor(v / 65536); t11 = v - c * 65536;
      v = t12 + c + 65535; c = Math.floor(v / 65536); t12 = v - c * 65536;
      v = t13 + c + 65535; c = Math.floor(v / 65536); t13 = v - c * 65536;
      v = t14 + c + 65535; c = Math.floor(v / 65536); t14 = v - c * 65536;
      v = t15 + c + 65535; c = Math.floor(v / 65536); t15 = v - c * 65536;
      t0 += c-1 + 37 * (c-1);

      o[ 0] = t0;
      o[ 1] = t1;
      o[ 2] = t2;
      o[ 3] = t3;
      o[ 4] = t4;
      o[ 5] = t5;
      o[ 6] = t6;
      o[ 7] = t7;
      o[ 8] = t8;
      o[ 9] = t9;
      o[10] = t10;
      o[11] = t11;
      o[12] = t12;
      o[13] = t13;
      o[14] = t14;
      o[15] = t15;
    }

    function S(o, a) {
      M(o, a, a);
    }

    function inv25519(o, i) {
      var c = gf();
      var a;
      for (a = 0; a < 16; a++) c[a] = i[a];
      for (a = 253; a >= 0; a--) {
        S(c, c);
        if(a !== 2 && a !== 4) M(c, c, i);
      }
      for (a = 0; a < 16; a++) o[a] = c[a];
    }

    function pow2523(o, i) {
      var c = gf();
      var a;
      for (a = 0; a < 16; a++) c[a] = i[a];
      for (a = 250; a >= 0; a--) {
          S(c, c);
          if(a !== 1) M(c, c, i);
      }
      for (a = 0; a < 16; a++) o[a] = c[a];
    }

    function crypto_scalarmult(q, n, p) {
      var z = new Uint8Array(32);
      var x = new Float64Array(80), r, i;
      var a = gf(), b = gf(), c = gf(),
          d = gf(), e = gf(), f = gf();
      for (i = 0; i < 31; i++) z[i] = n[i];
      z[31]=(n[31]&127)|64;
      z[0]&=248;
      unpack25519(x,p);
      for (i = 0; i < 16; i++) {
        b[i]=x[i];
        d[i]=a[i]=c[i]=0;
      }
      a[0]=d[0]=1;
      for (i=254; i>=0; --i) {
        r=(z[i>>>3]>>>(i&7))&1;
        sel25519(a,b,r);
        sel25519(c,d,r);
        A(e,a,c);
        Z(a,a,c);
        A(c,b,d);
        Z(b,b,d);
        S(d,e);
        S(f,a);
        M(a,c,a);
        M(c,b,e);
        A(e,a,c);
        Z(a,a,c);
        S(b,a);
        Z(c,d,f);
        M(a,c,_121665);
        A(a,a,d);
        M(c,c,a);
        M(a,d,f);
        M(d,b,x);
        S(b,e);
        sel25519(a,b,r);
        sel25519(c,d,r);
      }
      for (i = 0; i < 16; i++) {
        x[i+16]=a[i];
        x[i+32]=c[i];
        x[i+48]=b[i];
        x[i+64]=d[i];
      }
      var x32 = x.subarray(32);
      var x16 = x.subarray(16);
      inv25519(x32,x32);
      M(x16,x16,x32);
      pack25519(q,x16);
      return 0;
    }

    function crypto_scalarmult_base(q, n) {
      return crypto_scalarmult(q, n, _9);
    }

    function crypto_box_keypair(y, x) {
      randombytes(x, 32);
      return crypto_scalarmult_base(y, x);
    }

    function crypto_box_beforenm(k, y, x) {
      var s = new Uint8Array(32);
      crypto_scalarmult(s, x, y);
      return crypto_core_hsalsa20(k, _0, s, sigma);
    }

    var crypto_box_afternm = crypto_secretbox;
    var crypto_box_open_afternm = crypto_secretbox_open;

    function crypto_box(c, m, d, n, y, x) {
      var k = new Uint8Array(32);
      crypto_box_beforenm(k, y, x);
      return crypto_box_afternm(c, m, d, n, k);
    }

    function crypto_box_open(m, c, d, n, y, x) {
      var k = new Uint8Array(32);
      crypto_box_beforenm(k, y, x);
      return crypto_box_open_afternm(m, c, d, n, k);
    }

    var K = [
      0x428a2f98, 0xd728ae22, 0x71374491, 0x23ef65cd,
      0xb5c0fbcf, 0xec4d3b2f, 0xe9b5dba5, 0x8189dbbc,
      0x3956c25b, 0xf348b538, 0x59f111f1, 0xb605d019,
      0x923f82a4, 0xaf194f9b, 0xab1c5ed5, 0xda6d8118,
      0xd807aa98, 0xa3030242, 0x12835b01, 0x45706fbe,
      0x243185be, 0x4ee4b28c, 0x550c7dc3, 0xd5ffb4e2,
      0x72be5d74, 0xf27b896f, 0x80deb1fe, 0x3b1696b1,
      0x9bdc06a7, 0x25c71235, 0xc19bf174, 0xcf692694,
      0xe49b69c1, 0x9ef14ad2, 0xefbe4786, 0x384f25e3,
      0x0fc19dc6, 0x8b8cd5b5, 0x240ca1cc, 0x77ac9c65,
      0x2de92c6f, 0x592b0275, 0x4a7484aa, 0x6ea6e483,
      0x5cb0a9dc, 0xbd41fbd4, 0x76f988da, 0x831153b5,
      0x983e5152, 0xee66dfab, 0xa831c66d, 0x2db43210,
      0xb00327c8, 0x98fb213f, 0xbf597fc7, 0xbeef0ee4,
      0xc6e00bf3, 0x3da88fc2, 0xd5a79147, 0x930aa725,
      0x06ca6351, 0xe003826f, 0x14292967, 0x0a0e6e70,
      0x27b70a85, 0x46d22ffc, 0x2e1b2138, 0x5c26c926,
      0x4d2c6dfc, 0x5ac42aed, 0x53380d13, 0x9d95b3df,
      0x650a7354, 0x8baf63de, 0x766a0abb, 0x3c77b2a8,
      0x81c2c92e, 0x47edaee6, 0x92722c85, 0x1482353b,
      0xa2bfe8a1, 0x4cf10364, 0xa81a664b, 0xbc423001,
      0xc24b8b70, 0xd0f89791, 0xc76c51a3, 0x0654be30,
      0xd192e819, 0xd6ef5218, 0xd6990624, 0x5565a910,
      0xf40e3585, 0x5771202a, 0x106aa070, 0x32bbd1b8,
      0x19a4c116, 0xb8d2d0c8, 0x1e376c08, 0x5141ab53,
      0x2748774c, 0xdf8eeb99, 0x34b0bcb5, 0xe19b48a8,
      0x391c0cb3, 0xc5c95a63, 0x4ed8aa4a, 0xe3418acb,
      0x5b9cca4f, 0x7763e373, 0x682e6ff3, 0xd6b2b8a3,
      0x748f82ee, 0x5defb2fc, 0x78a5636f, 0x43172f60,
      0x84c87814, 0xa1f0ab72, 0x8cc70208, 0x1a6439ec,
      0x90befffa, 0x23631e28, 0xa4506ceb, 0xde82bde9,
      0xbef9a3f7, 0xb2c67915, 0xc67178f2, 0xe372532b,
      0xca273ece, 0xea26619c, 0xd186b8c7, 0x21c0c207,
      0xeada7dd6, 0xcde0eb1e, 0xf57d4f7f, 0xee6ed178,
      0x06f067aa, 0x72176fba, 0x0a637dc5, 0xa2c898a6,
      0x113f9804, 0xbef90dae, 0x1b710b35, 0x131c471b,
      0x28db77f5, 0x23047d84, 0x32caab7b, 0x40c72493,
      0x3c9ebe0a, 0x15c9bebc, 0x431d67c4, 0x9c100d4c,
      0x4cc5d4be, 0xcb3e42b6, 0x597f299c, 0xfc657e2a,
      0x5fcb6fab, 0x3ad6faec, 0x6c44198c, 0x4a475817
    ];

    function crypto_hashblocks_hl(hh, hl, m, n) {
      var wh = new Int32Array(16), wl = new Int32Array(16),
          bh0, bh1, bh2, bh3, bh4, bh5, bh6, bh7,
          bl0, bl1, bl2, bl3, bl4, bl5, bl6, bl7,
          th, tl, i, j, h, l, a, b, c, d;

      var ah0 = hh[0],
          ah1 = hh[1],
          ah2 = hh[2],
          ah3 = hh[3],
          ah4 = hh[4],
          ah5 = hh[5],
          ah6 = hh[6],
          ah7 = hh[7],

          al0 = hl[0],
          al1 = hl[1],
          al2 = hl[2],
          al3 = hl[3],
          al4 = hl[4],
          al5 = hl[5],
          al6 = hl[6],
          al7 = hl[7];

      var pos = 0;
      while (n >= 128) {
        for (i = 0; i < 16; i++) {
          j = 8 * i + pos;
          wh[i] = (m[j+0] << 24) | (m[j+1] << 16) | (m[j+2] << 8) | m[j+3];
          wl[i] = (m[j+4] << 24) | (m[j+5] << 16) | (m[j+6] << 8) | m[j+7];
        }
        for (i = 0; i < 80; i++) {
          bh0 = ah0;
          bh1 = ah1;
          bh2 = ah2;
          bh3 = ah3;
          bh4 = ah4;
          bh5 = ah5;
          bh6 = ah6;
          bh7 = ah7;

          bl0 = al0;
          bl1 = al1;
          bl2 = al2;
          bl3 = al3;
          bl4 = al4;
          bl5 = al5;
          bl6 = al6;
          bl7 = al7;

          // add
          h = ah7;
          l = al7;

          a = l & 0xffff; b = l >>> 16;
          c = h & 0xffff; d = h >>> 16;

          // Sigma1
          h = ((ah4 >>> 14) | (al4 << (32-14))) ^ ((ah4 >>> 18) | (al4 << (32-18))) ^ ((al4 >>> (41-32)) | (ah4 << (32-(41-32))));
          l = ((al4 >>> 14) | (ah4 << (32-14))) ^ ((al4 >>> 18) | (ah4 << (32-18))) ^ ((ah4 >>> (41-32)) | (al4 << (32-(41-32))));

          a += l & 0xffff; b += l >>> 16;
          c += h & 0xffff; d += h >>> 16;

          // Ch
          h = (ah4 & ah5) ^ (~ah4 & ah6);
          l = (al4 & al5) ^ (~al4 & al6);

          a += l & 0xffff; b += l >>> 16;
          c += h & 0xffff; d += h >>> 16;

          // K
          h = K[i*2];
          l = K[i*2+1];

          a += l & 0xffff; b += l >>> 16;
          c += h & 0xffff; d += h >>> 16;

          // w
          h = wh[i%16];
          l = wl[i%16];

          a += l & 0xffff; b += l >>> 16;
          c += h & 0xffff; d += h >>> 16;

          b += a >>> 16;
          c += b >>> 16;
          d += c >>> 16;

          th = c & 0xffff | d << 16;
          tl = a & 0xffff | b << 16;

          // add
          h = th;
          l = tl;

          a = l & 0xffff; b = l >>> 16;
          c = h & 0xffff; d = h >>> 16;

          // Sigma0
          h = ((ah0 >>> 28) | (al0 << (32-28))) ^ ((al0 >>> (34-32)) | (ah0 << (32-(34-32)))) ^ ((al0 >>> (39-32)) | (ah0 << (32-(39-32))));
          l = ((al0 >>> 28) | (ah0 << (32-28))) ^ ((ah0 >>> (34-32)) | (al0 << (32-(34-32)))) ^ ((ah0 >>> (39-32)) | (al0 << (32-(39-32))));

          a += l & 0xffff; b += l >>> 16;
          c += h & 0xffff; d += h >>> 16;

          // Maj
          h = (ah0 & ah1) ^ (ah0 & ah2) ^ (ah1 & ah2);
          l = (al0 & al1) ^ (al0 & al2) ^ (al1 & al2);

          a += l & 0xffff; b += l >>> 16;
          c += h & 0xffff; d += h >>> 16;

          b += a >>> 16;
          c += b >>> 16;
          d += c >>> 16;

          bh7 = (c & 0xffff) | (d << 16);
          bl7 = (a & 0xffff) | (b << 16);

          // add
          h = bh3;
          l = bl3;

          a = l & 0xffff; b = l >>> 16;
          c = h & 0xffff; d = h >>> 16;

          h = th;
          l = tl;

          a += l & 0xffff; b += l >>> 16;
          c += h & 0xffff; d += h >>> 16;

          b += a >>> 16;
          c += b >>> 16;
          d += c >>> 16;

          bh3 = (c & 0xffff) | (d << 16);
          bl3 = (a & 0xffff) | (b << 16);

          ah1 = bh0;
          ah2 = bh1;
          ah3 = bh2;
          ah4 = bh3;
          ah5 = bh4;
          ah6 = bh5;
          ah7 = bh6;
          ah0 = bh7;

          al1 = bl0;
          al2 = bl1;
          al3 = bl2;
          al4 = bl3;
          al5 = bl4;
          al6 = bl5;
          al7 = bl6;
          al0 = bl7;

          if (i%16 === 15) {
            for (j = 0; j < 16; j++) {
              // add
              h = wh[j];
              l = wl[j];

              a = l & 0xffff; b = l >>> 16;
              c = h & 0xffff; d = h >>> 16;

              h = wh[(j+9)%16];
              l = wl[(j+9)%16];

              a += l & 0xffff; b += l >>> 16;
              c += h & 0xffff; d += h >>> 16;

              // sigma0
              th = wh[(j+1)%16];
              tl = wl[(j+1)%16];
              h = ((th >>> 1) | (tl << (32-1))) ^ ((th >>> 8) | (tl << (32-8))) ^ (th >>> 7);
              l = ((tl >>> 1) | (th << (32-1))) ^ ((tl >>> 8) | (th << (32-8))) ^ ((tl >>> 7) | (th << (32-7)));

              a += l & 0xffff; b += l >>> 16;
              c += h & 0xffff; d += h >>> 16;

              // sigma1
              th = wh[(j+14)%16];
              tl = wl[(j+14)%16];
              h = ((th >>> 19) | (tl << (32-19))) ^ ((tl >>> (61-32)) | (th << (32-(61-32)))) ^ (th >>> 6);
              l = ((tl >>> 19) | (th << (32-19))) ^ ((th >>> (61-32)) | (tl << (32-(61-32)))) ^ ((tl >>> 6) | (th << (32-6)));

              a += l & 0xffff; b += l >>> 16;
              c += h & 0xffff; d += h >>> 16;

              b += a >>> 16;
              c += b >>> 16;
              d += c >>> 16;

              wh[j] = (c & 0xffff) | (d << 16);
              wl[j] = (a & 0xffff) | (b << 16);
            }
          }
        }

        // add
        h = ah0;
        l = al0;

        a = l & 0xffff; b = l >>> 16;
        c = h & 0xffff; d = h >>> 16;

        h = hh[0];
        l = hl[0];

        a += l & 0xffff; b += l >>> 16;
        c += h & 0xffff; d += h >>> 16;

        b += a >>> 16;
        c += b >>> 16;
        d += c >>> 16;

        hh[0] = ah0 = (c & 0xffff) | (d << 16);
        hl[0] = al0 = (a & 0xffff) | (b << 16);

        h = ah1;
        l = al1;

        a = l & 0xffff; b = l >>> 16;
        c = h & 0xffff; d = h >>> 16;

        h = hh[1];
        l = hl[1];

        a += l & 0xffff; b += l >>> 16;
        c += h & 0xffff; d += h >>> 16;

        b += a >>> 16;
        c += b >>> 16;
        d += c >>> 16;

        hh[1] = ah1 = (c & 0xffff) | (d << 16);
        hl[1] = al1 = (a & 0xffff) | (b << 16);

        h = ah2;
        l = al2;

        a = l & 0xffff; b = l >>> 16;
        c = h & 0xffff; d = h >>> 16;

        h = hh[2];
        l = hl[2];

        a += l & 0xffff; b += l >>> 16;
        c += h & 0xffff; d += h >>> 16;

        b += a >>> 16;
        c += b >>> 16;
        d += c >>> 16;

        hh[2] = ah2 = (c & 0xffff) | (d << 16);
        hl[2] = al2 = (a & 0xffff) | (b << 16);

        h = ah3;
        l = al3;

        a = l & 0xffff; b = l >>> 16;
        c = h & 0xffff; d = h >>> 16;

        h = hh[3];
        l = hl[3];

        a += l & 0xffff; b += l >>> 16;
        c += h & 0xffff; d += h >>> 16;

        b += a >>> 16;
        c += b >>> 16;
        d += c >>> 16;

        hh[3] = ah3 = (c & 0xffff) | (d << 16);
        hl[3] = al3 = (a & 0xffff) | (b << 16);

        h = ah4;
        l = al4;

        a = l & 0xffff; b = l >>> 16;
        c = h & 0xffff; d = h >>> 16;

        h = hh[4];
        l = hl[4];

        a += l & 0xffff; b += l >>> 16;
        c += h & 0xffff; d += h >>> 16;

        b += a >>> 16;
        c += b >>> 16;
        d += c >>> 16;

        hh[4] = ah4 = (c & 0xffff) | (d << 16);
        hl[4] = al4 = (a & 0xffff) | (b << 16);

        h = ah5;
        l = al5;

        a = l & 0xffff; b = l >>> 16;
        c = h & 0xffff; d = h >>> 16;

        h = hh[5];
        l = hl[5];

        a += l & 0xffff; b += l >>> 16;
        c += h & 0xffff; d += h >>> 16;

        b += a >>> 16;
        c += b >>> 16;
        d += c >>> 16;

        hh[5] = ah5 = (c & 0xffff) | (d << 16);
        hl[5] = al5 = (a & 0xffff) | (b << 16);

        h = ah6;
        l = al6;

        a = l & 0xffff; b = l >>> 16;
        c = h & 0xffff; d = h >>> 16;

        h = hh[6];
        l = hl[6];

        a += l & 0xffff; b += l >>> 16;
        c += h & 0xffff; d += h >>> 16;

        b += a >>> 16;
        c += b >>> 16;
        d += c >>> 16;

        hh[6] = ah6 = (c & 0xffff) | (d << 16);
        hl[6] = al6 = (a & 0xffff) | (b << 16);

        h = ah7;
        l = al7;

        a = l & 0xffff; b = l >>> 16;
        c = h & 0xffff; d = h >>> 16;

        h = hh[7];
        l = hl[7];

        a += l & 0xffff; b += l >>> 16;
        c += h & 0xffff; d += h >>> 16;

        b += a >>> 16;
        c += b >>> 16;
        d += c >>> 16;

        hh[7] = ah7 = (c & 0xffff) | (d << 16);
        hl[7] = al7 = (a & 0xffff) | (b << 16);

        pos += 128;
        n -= 128;
      }

      return n;
    }

    function crypto_hash(out, m, n) {
      var hh = new Int32Array(8),
          hl = new Int32Array(8),
          x = new Uint8Array(256),
          i, b = n;

      hh[0] = 0x6a09e667;
      hh[1] = 0xbb67ae85;
      hh[2] = 0x3c6ef372;
      hh[3] = 0xa54ff53a;
      hh[4] = 0x510e527f;
      hh[5] = 0x9b05688c;
      hh[6] = 0x1f83d9ab;
      hh[7] = 0x5be0cd19;

      hl[0] = 0xf3bcc908;
      hl[1] = 0x84caa73b;
      hl[2] = 0xfe94f82b;
      hl[3] = 0x5f1d36f1;
      hl[4] = 0xade682d1;
      hl[5] = 0x2b3e6c1f;
      hl[6] = 0xfb41bd6b;
      hl[7] = 0x137e2179;

      crypto_hashblocks_hl(hh, hl, m, n);
      n %= 128;

      for (i = 0; i < n; i++) x[i] = m[b-n+i];
      x[n] = 128;

      n = 256-128*(n<112?1:0);
      x[n-9] = 0;
      ts64(x, n-8,  (b / 0x20000000) | 0, b << 3);
      crypto_hashblocks_hl(hh, hl, x, n);

      for (i = 0; i < 8; i++) ts64(out, 8*i, hh[i], hl[i]);

      return 0;
    }

    function add(p, q) {
      var a = gf(), b = gf(), c = gf(),
          d = gf(), e = gf(), f = gf(),
          g = gf(), h = gf(), t = gf();

      Z(a, p[1], p[0]);
      Z(t, q[1], q[0]);
      M(a, a, t);
      A(b, p[0], p[1]);
      A(t, q[0], q[1]);
      M(b, b, t);
      M(c, p[3], q[3]);
      M(c, c, D2);
      M(d, p[2], q[2]);
      A(d, d, d);
      Z(e, b, a);
      Z(f, d, c);
      A(g, d, c);
      A(h, b, a);

      M(p[0], e, f);
      M(p[1], h, g);
      M(p[2], g, f);
      M(p[3], e, h);
    }

    function cswap(p, q, b) {
      var i;
      for (i = 0; i < 4; i++) {
        sel25519(p[i], q[i], b);
      }
    }

    function pack(r, p) {
      var tx = gf(), ty = gf(), zi = gf();
      inv25519(zi, p[2]);
      M(tx, p[0], zi);
      M(ty, p[1], zi);
      pack25519(r, ty);
      r[31] ^= par25519(tx) << 7;
    }

    function scalarmult(p, q, s) {
      var b, i;
      set25519(p[0], gf0);
      set25519(p[1], gf1);
      set25519(p[2], gf1);
      set25519(p[3], gf0);
      for (i = 255; i >= 0; --i) {
        b = (s[(i/8)|0] >> (i&7)) & 1;
        cswap(p, q, b);
        add(q, p);
        add(p, p);
        cswap(p, q, b);
      }
    }

    function scalarbase(p, s) {
      var q = [gf(), gf(), gf(), gf()];
      set25519(q[0], X);
      set25519(q[1], Y);
      set25519(q[2], gf1);
      M(q[3], X, Y);
      scalarmult(p, q, s);
    }

    function crypto_sign_keypair(pk, sk, seeded) {
      var d = new Uint8Array(64);
      var p = [gf(), gf(), gf(), gf()];
      var i;

      if (!seeded) randombytes(sk, 32);
      crypto_hash(d, sk, 32);
      d[0] &= 248;
      d[31] &= 127;
      d[31] |= 64;

      scalarbase(p, d);
      pack(pk, p);

      for (i = 0; i < 32; i++) sk[i+32] = pk[i];
      return 0;
    }

    var L = new Float64Array([0xed, 0xd3, 0xf5, 0x5c, 0x1a, 0x63, 0x12, 0x58, 0xd6, 0x9c, 0xf7, 0xa2, 0xde, 0xf9, 0xde, 0x14, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0x10]);

    function modL(r, x) {
      var carry, i, j, k;
      for (i = 63; i >= 32; --i) {
        carry = 0;
        for (j = i - 32, k = i - 12; j < k; ++j) {
          x[j] += carry - 16 * x[i] * L[j - (i - 32)];
          carry = Math.floor((x[j] + 128) / 256);
          x[j] -= carry * 256;
        }
        x[j] += carry;
        x[i] = 0;
      }
      carry = 0;
      for (j = 0; j < 32; j++) {
        x[j] += carry - (x[31] >> 4) * L[j];
        carry = x[j] >> 8;
        x[j] &= 255;
      }
      for (j = 0; j < 32; j++) x[j] -= carry * L[j];
      for (i = 0; i < 32; i++) {
        x[i+1] += x[i] >> 8;
        r[i] = x[i] & 255;
      }
    }

    function reduce(r) {
      var x = new Float64Array(64), i;
      for (i = 0; i < 64; i++) x[i] = r[i];
      for (i = 0; i < 64; i++) r[i] = 0;
      modL(r, x);
    }

    // Note: difference from C - smlen returned, not passed as argument.
    function crypto_sign(sm, m, n, sk) {
      var d = new Uint8Array(64), h = new Uint8Array(64), r = new Uint8Array(64);
      var i, j, x = new Float64Array(64);
      var p = [gf(), gf(), gf(), gf()];

      crypto_hash(d, sk, 32);
      d[0] &= 248;
      d[31] &= 127;
      d[31] |= 64;

      var smlen = n + 64;
      for (i = 0; i < n; i++) sm[64 + i] = m[i];
      for (i = 0; i < 32; i++) sm[32 + i] = d[32 + i];

      crypto_hash(r, sm.subarray(32), n+32);
      reduce(r);
      scalarbase(p, r);
      pack(sm, p);

      for (i = 32; i < 64; i++) sm[i] = sk[i];
      crypto_hash(h, sm, n + 64);
      reduce(h);

      for (i = 0; i < 64; i++) x[i] = 0;
      for (i = 0; i < 32; i++) x[i] = r[i];
      for (i = 0; i < 32; i++) {
        for (j = 0; j < 32; j++) {
          x[i+j] += h[i] * d[j];
        }
      }

      modL(sm.subarray(32), x);
      return smlen;
    }

    function unpackneg(r, p) {
      var t = gf(), chk = gf(), num = gf(),
          den = gf(), den2 = gf(), den4 = gf(),
          den6 = gf();

      set25519(r[2], gf1);
      unpack25519(r[1], p);
      S(num, r[1]);
      M(den, num, D);
      Z(num, num, r[2]);
      A(den, r[2], den);

      S(den2, den);
      S(den4, den2);
      M(den6, den4, den2);
      M(t, den6, num);
      M(t, t, den);

      pow2523(t, t);
      M(t, t, num);
      M(t, t, den);
      M(t, t, den);
      M(r[0], t, den);

      S(chk, r[0]);
      M(chk, chk, den);
      if (neq25519(chk, num)) M(r[0], r[0], I);

      S(chk, r[0]);
      M(chk, chk, den);
      if (neq25519(chk, num)) return -1;

      if (par25519(r[0]) === (p[31]>>7)) Z(r[0], gf0, r[0]);

      M(r[3], r[0], r[1]);
      return 0;
    }

    function crypto_sign_open(m, sm, n, pk) {
      var i;
      var t = new Uint8Array(32), h = new Uint8Array(64);
      var p = [gf(), gf(), gf(), gf()],
          q = [gf(), gf(), gf(), gf()];

      if (n < 64) return -1;

      if (unpackneg(q, pk)) return -1;

      for (i = 0; i < n; i++) m[i] = sm[i];
      for (i = 0; i < 32; i++) m[i+32] = pk[i];
      crypto_hash(h, m, n);
      reduce(h);
      scalarmult(p, q, h);

      scalarbase(q, sm.subarray(32));
      add(p, q);
      pack(t, p);

      n -= 64;
      if (crypto_verify_32(sm, 0, t, 0)) {
        for (i = 0; i < n; i++) m[i] = 0;
        return -1;
      }

      for (i = 0; i < n; i++) m[i] = sm[i + 64];
      return n;
    }

    var crypto_secretbox_KEYBYTES = 32,
        crypto_secretbox_NONCEBYTES = 24,
        crypto_secretbox_ZEROBYTES = 32,
        crypto_secretbox_BOXZEROBYTES = 16,
        crypto_scalarmult_BYTES = 32,
        crypto_scalarmult_SCALARBYTES = 32,
        crypto_box_PUBLICKEYBYTES = 32,
        crypto_box_SECRETKEYBYTES = 32,
        crypto_box_BEFORENMBYTES = 32,
        crypto_box_NONCEBYTES = crypto_secretbox_NONCEBYTES,
        crypto_box_ZEROBYTES = crypto_secretbox_ZEROBYTES,
        crypto_box_BOXZEROBYTES = crypto_secretbox_BOXZEROBYTES,
        crypto_sign_BYTES = 64,
        crypto_sign_PUBLICKEYBYTES = 32,
        crypto_sign_SECRETKEYBYTES = 64,
        crypto_sign_SEEDBYTES = 32,
        crypto_hash_BYTES = 64;

    nacl.lowlevel = {
      crypto_core_hsalsa20: crypto_core_hsalsa20,
      crypto_stream_xor: crypto_stream_xor,
      crypto_stream: crypto_stream,
      crypto_stream_salsa20_xor: crypto_stream_salsa20_xor,
      crypto_stream_salsa20: crypto_stream_salsa20,
      crypto_onetimeauth: crypto_onetimeauth,
      crypto_onetimeauth_verify: crypto_onetimeauth_verify,
      crypto_verify_16: crypto_verify_16,
      crypto_verify_32: crypto_verify_32,
      crypto_secretbox: crypto_secretbox,
      crypto_secretbox_open: crypto_secretbox_open,
      crypto_scalarmult: crypto_scalarmult,
      crypto_scalarmult_base: crypto_scalarmult_base,
      crypto_box_beforenm: crypto_box_beforenm,
      crypto_box_afternm: crypto_box_afternm,
      crypto_box: crypto_box,
      crypto_box_open: crypto_box_open,
      crypto_box_keypair: crypto_box_keypair,
      crypto_hash: crypto_hash,
      crypto_sign: crypto_sign,
      crypto_sign_keypair: crypto_sign_keypair,
      crypto_sign_open: crypto_sign_open,

      crypto_secretbox_KEYBYTES: crypto_secretbox_KEYBYTES,
      crypto_secretbox_NONCEBYTES: crypto_secretbox_NONCEBYTES,
      crypto_secretbox_ZEROBYTES: crypto_secretbox_ZEROBYTES,
      crypto_secretbox_BOXZEROBYTES: crypto_secretbox_BOXZEROBYTES,
      crypto_scalarmult_BYTES: crypto_scalarmult_BYTES,
      crypto_scalarmult_SCALARBYTES: crypto_scalarmult_SCALARBYTES,
      crypto_box_PUBLICKEYBYTES: crypto_box_PUBLICKEYBYTES,
      crypto_box_SECRETKEYBYTES: crypto_box_SECRETKEYBYTES,
      crypto_box_BEFORENMBYTES: crypto_box_BEFORENMBYTES,
      crypto_box_NONCEBYTES: crypto_box_NONCEBYTES,
      crypto_box_ZEROBYTES: crypto_box_ZEROBYTES,
      crypto_box_BOXZEROBYTES: crypto_box_BOXZEROBYTES,
      crypto_sign_BYTES: crypto_sign_BYTES,
      crypto_sign_PUBLICKEYBYTES: crypto_sign_PUBLICKEYBYTES,
      crypto_sign_SECRETKEYBYTES: crypto_sign_SECRETKEYBYTES,
      crypto_sign_SEEDBYTES: crypto_sign_SEEDBYTES,
      crypto_hash_BYTES: crypto_hash_BYTES,

      gf: gf,
      D: D,
      L: L,
      pack25519: pack25519,
      unpack25519: unpack25519,
      M: M,
      A: A,
      S: S,
      Z: Z,
      pow2523: pow2523,
      add: add,
      set25519: set25519,
      modL: modL,
      scalarmult: scalarmult,
      scalarbase: scalarbase,
    };

    /* High-level API */

    function checkLengths(k, n) {
      if (k.length !== crypto_secretbox_KEYBYTES) throw new Error('bad key size');
      if (n.length !== crypto_secretbox_NONCEBYTES) throw new Error('bad nonce size');
    }

    function checkBoxLengths(pk, sk) {
      if (pk.length !== crypto_box_PUBLICKEYBYTES) throw new Error('bad public key size');
      if (sk.length !== crypto_box_SECRETKEYBYTES) throw new Error('bad secret key size');
    }

    function checkArrayTypes() {
      for (var i = 0; i < arguments.length; i++) {
        if (!(arguments[i] instanceof Uint8Array))
          throw new TypeError('unexpected type, use Uint8Array');
      }
    }

    function cleanup(arr) {
      for (var i = 0; i < arr.length; i++) arr[i] = 0;
    }

    nacl.randomBytes = function(n) {
      var b = new Uint8Array(n);
      randombytes(b, n);
      return b;
    };

    nacl.secretbox = function(msg, nonce, key) {
      checkArrayTypes(msg, nonce, key);
      checkLengths(key, nonce);
      var m = new Uint8Array(crypto_secretbox_ZEROBYTES + msg.length);
      var c = new Uint8Array(m.length);
      for (var i = 0; i < msg.length; i++) m[i+crypto_secretbox_ZEROBYTES] = msg[i];
      crypto_secretbox(c, m, m.length, nonce, key);
      return c.subarray(crypto_secretbox_BOXZEROBYTES);
    };

    nacl.secretbox.open = function(box, nonce, key) {
      checkArrayTypes(box, nonce, key);
      checkLengths(key, nonce);
      var c = new Uint8Array(crypto_secretbox_BOXZEROBYTES + box.length);
      var m = new Uint8Array(c.length);
      for (var i = 0; i < box.length; i++) c[i+crypto_secretbox_BOXZEROBYTES] = box[i];
      if (c.length < 32) return null;
      if (crypto_secretbox_open(m, c, c.length, nonce, key) !== 0) return null;
      return m.subarray(crypto_secretbox_ZEROBYTES);
    };

    nacl.secretbox.keyLength = crypto_secretbox_KEYBYTES;
    nacl.secretbox.nonceLength = crypto_secretbox_NONCEBYTES;
    nacl.secretbox.overheadLength = crypto_secretbox_BOXZEROBYTES;

    nacl.scalarMult = function(n, p) {
      checkArrayTypes(n, p);
      if (n.length !== crypto_scalarmult_SCALARBYTES) throw new Error('bad n size');
      if (p.length !== crypto_scalarmult_BYTES) throw new Error('bad p size');
      var q = new Uint8Array(crypto_scalarmult_BYTES);
      crypto_scalarmult(q, n, p);
      return q;
    };

    nacl.scalarMult.base = function(n) {
      checkArrayTypes(n);
      if (n.length !== crypto_scalarmult_SCALARBYTES) throw new Error('bad n size');
      var q = new Uint8Array(crypto_scalarmult_BYTES);
      crypto_scalarmult_base(q, n);
      return q;
    };

    nacl.scalarMult.scalarLength = crypto_scalarmult_SCALARBYTES;
    nacl.scalarMult.groupElementLength = crypto_scalarmult_BYTES;

    nacl.box = function(msg, nonce, publicKey, secretKey) {
      var k = nacl.box.before(publicKey, secretKey);
      return nacl.secretbox(msg, nonce, k);
    };

    nacl.box.before = function(publicKey, secretKey) {
      checkArrayTypes(publicKey, secretKey);
      checkBoxLengths(publicKey, secretKey);
      var k = new Uint8Array(crypto_box_BEFORENMBYTES);
      crypto_box_beforenm(k, publicKey, secretKey);
      return k;
    };

    nacl.box.after = nacl.secretbox;

    nacl.box.open = function(msg, nonce, publicKey, secretKey) {
      var k = nacl.box.before(publicKey, secretKey);
      return nacl.secretbox.open(msg, nonce, k);
    };

    nacl.box.open.after = nacl.secretbox.open;

    nacl.box.keyPair = function() {
      var pk = new Uint8Array(crypto_box_PUBLICKEYBYTES);
      var sk = new Uint8Array(crypto_box_SECRETKEYBYTES);
      crypto_box_keypair(pk, sk);
      return {publicKey: pk, secretKey: sk};
    };

    nacl.box.keyPair.fromSecretKey = function(secretKey) {
      checkArrayTypes(secretKey);
      if (secretKey.length !== crypto_box_SECRETKEYBYTES)
        throw new Error('bad secret key size');
      var pk = new Uint8Array(crypto_box_PUBLICKEYBYTES);
      crypto_scalarmult_base(pk, secretKey);
      return {publicKey: pk, secretKey: new Uint8Array(secretKey)};
    };

    nacl.box.publicKeyLength = crypto_box_PUBLICKEYBYTES;
    nacl.box.secretKeyLength = crypto_box_SECRETKEYBYTES;
    nacl.box.sharedKeyLength = crypto_box_BEFORENMBYTES;
    nacl.box.nonceLength = crypto_box_NONCEBYTES;
    nacl.box.overheadLength = nacl.secretbox.overheadLength;

    nacl.sign = function(msg, secretKey) {
      checkArrayTypes(msg, secretKey);
      if (secretKey.length !== crypto_sign_SECRETKEYBYTES)
        throw new Error('bad secret key size');
      var signedMsg = new Uint8Array(crypto_sign_BYTES+msg.length);
      crypto_sign(signedMsg, msg, msg.length, secretKey);
      return signedMsg;
    };

    nacl.sign.open = function(signedMsg, publicKey) {
      checkArrayTypes(signedMsg, publicKey);
      if (publicKey.length !== crypto_sign_PUBLICKEYBYTES)
        throw new Error('bad public key size');
      var tmp = new Uint8Array(signedMsg.length);
      var mlen = crypto_sign_open(tmp, signedMsg, signedMsg.length, publicKey);
      if (mlen < 0) return null;
      var m = new Uint8Array(mlen);
      for (var i = 0; i < m.length; i++) m[i] = tmp[i];
      return m;
    };

    nacl.sign.detached = function(msg, secretKey) {
      var signedMsg = nacl.sign(msg, secretKey);
      var sig = new Uint8Array(crypto_sign_BYTES);
      for (var i = 0; i < sig.length; i++) sig[i] = signedMsg[i];
      return sig;
    };

    nacl.sign.detached.verify = function(msg, sig, publicKey) {
      checkArrayTypes(msg, sig, publicKey);
      if (sig.length !== crypto_sign_BYTES)
        throw new Error('bad signature size');
      if (publicKey.length !== crypto_sign_PUBLICKEYBYTES)
        throw new Error('bad public key size');
      var sm = new Uint8Array(crypto_sign_BYTES + msg.length);
      var m = new Uint8Array(crypto_sign_BYTES + msg.length);
      var i;
      for (i = 0; i < crypto_sign_BYTES; i++) sm[i] = sig[i];
      for (i = 0; i < msg.length; i++) sm[i+crypto_sign_BYTES] = msg[i];
      return (crypto_sign_open(m, sm, sm.length, publicKey) >= 0);
    };

    nacl.sign.keyPair = function() {
      var pk = new Uint8Array(crypto_sign_PUBLICKEYBYTES);
      var sk = new Uint8Array(crypto_sign_SECRETKEYBYTES);
      crypto_sign_keypair(pk, sk);
      return {publicKey: pk, secretKey: sk};
    };

    nacl.sign.keyPair.fromSecretKey = function(secretKey) {
      checkArrayTypes(secretKey);
      if (secretKey.length !== crypto_sign_SECRETKEYBYTES)
        throw new Error('bad secret key size');
      var pk = new Uint8Array(crypto_sign_PUBLICKEYBYTES);
      for (var i = 0; i < pk.length; i++) pk[i] = secretKey[32+i];
      return {publicKey: pk, secretKey: new Uint8Array(secretKey)};
    };

    nacl.sign.keyPair.fromSeed = function(seed) {
      checkArrayTypes(seed);
      if (seed.length !== crypto_sign_SEEDBYTES)
        throw new Error('bad seed size');
      var pk = new Uint8Array(crypto_sign_PUBLICKEYBYTES);
      var sk = new Uint8Array(crypto_sign_SECRETKEYBYTES);
      for (var i = 0; i < 32; i++) sk[i] = seed[i];
      crypto_sign_keypair(pk, sk, true);
      return {publicKey: pk, secretKey: sk};
    };

    nacl.sign.publicKeyLength = crypto_sign_PUBLICKEYBYTES;
    nacl.sign.secretKeyLength = crypto_sign_SECRETKEYBYTES;
    nacl.sign.seedLength = crypto_sign_SEEDBYTES;
    nacl.sign.signatureLength = crypto_sign_BYTES;

    nacl.hash = function(msg) {
      checkArrayTypes(msg);
      var h = new Uint8Array(crypto_hash_BYTES);
      crypto_hash(h, msg, msg.length);
      return h;
    };

    nacl.hash.hashLength = crypto_hash_BYTES;

    nacl.verify = function(x, y) {
      checkArrayTypes(x, y);
      // Zero length arguments are considered not equal.
      if (x.length === 0 || y.length === 0) return false;
      if (x.length !== y.length) return false;
      return (vn(x, 0, y, 0, x.length) === 0) ? true : false;
    };

    nacl.setPRNG = function(fn) {
      randombytes = fn;
    };

    (function() {
      // Initialize PRNG if environment provides CSPRNG.
      // If not, methods calling randombytes will throw.
      var crypto = typeof self !== 'undefined' ? (self.crypto || self.msCrypto) : null;
      if (crypto && crypto.getRandomValues) {
        // Browsers.
        var QUOTA = 65536;
        nacl.setPRNG(function(x, n) {
          var i, v = new Uint8Array(n);
          for (i = 0; i < n; i += QUOTA) {
            crypto.getRandomValues(v.subarray(i, i + Math.min(n - i, QUOTA)));
          }
          for (i = 0; i < n; i++) x[i] = v[i];
          cleanup(v);
        });
      } else if (typeof commonjsRequire !== 'undefined') {
        // Node.js.
        crypto = require$$0;
        if (crypto && crypto.randomBytes) {
          nacl.setPRNG(function(x, n) {
            var i, v = crypto.randomBytes(n);
            for (i = 0; i < n; i++) x[i] = v[i];
            cleanup(v);
          });
        }
      }
    })();

    })(module.exports ? module.exports : (self.nacl = self.nacl || {}));
    }(naclFast));

    const { subscribe, set, update } = writable({
        ApplicationURL:    'https://vfb-notes.volt.live/',
        ApplicationId:     'd3CX6D',
        AccessToken:       '',
        ConfirmationToken: '',
        ResetToken:        '',
        EMailAddress:      localStorage['vfb-notes: email-address']  || '',
        Password:          '',
        loggedIn:          false,
        firstName:         '',
        lastName:          '',
        State:             '',
        EncryptionKey:     undefined,
        FailureReason:     ''
      });

      function define (KeyOrObject, Value) {
        if (typeof(KeyOrObject) === 'string') {
          update((Globals) => { Globals[KeyOrObject] = Value; return Globals });
          switch (KeyOrObject) {
            case 'EMailAddress':  localStorage['vfb-notes: email-address'] = Value; break
            case 'Password':
              let PasswordHash  = naclFast.exports.hash(new TextEncoder().encode(Value));
              let EncryptionKey = PasswordHash.slice(0,naclFast.exports.secretbox.keyLength);
              update((Globals) => { Globals['EncryptionKey'] = EncryptionKey; return Globals });
          }
        } else {
          update((Globals) => Object.assign(Globals,KeyOrObject));

          if ('EMailAddress' in KeyOrObject) {
            localStorage['vfb-notes: email-address'] = KeyOrObject['EMailAddress'];
          }

          if ('Password' in KeyOrObject) {
            let PasswordHash  = naclFast.exports.hash(new TextEncoder().encode(KeyOrObject['Password']));
            let EncryptionKey = PasswordHash.slice(0,naclFast.exports.secretbox.keyLength);
            update((Globals) => { Globals['EncryptionKey'] = EncryptionKey; return Globals });
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

    var css_248z$G = ".Dialog.svelte-16jefj2.svelte-16jefj2.svelte-16jefj2{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-16jefj2>div.svelte-16jefj2.svelte-16jefj2{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-16jefj2>div.svelte-16jefj2>[name=\"Title\"].svelte-16jefj2{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}.Dialog.svelte-16jefj2>div.svelte-16jefj2>.Block.svelte-16jefj2{display:block;margin:0px 0px 10px 0px;text-align:justify}.Dialog.svelte-16jefj2>div.svelte-16jefj2>button.svelte-16jefj2{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:6px;background-color:#2980B9;border:none;border-radius:4px;font-size:16px;font-weight:bold;color:white;cursor:pointer}.Dialog.svelte-16jefj2>div.svelte-16jefj2>button.svelte-16jefj2:disabled{opacity:0.3;cursor:auto}";
    styleInject(css_248z$G,{"insertAt":"top"});

    /* src/ReencryptionFailureNotice.svelte generated by Svelte v3.42.1 */

    function create_fragment$G(ctx) {
    	let div5;
    	let div4;
    	let div0;
    	let t1;
    	let div1;
    	let t3;
    	let div2;
    	let t4_value = /*$Globals*/ ctx[0].FailureReason + "";
    	let t4;
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
    			div0.textContent = "Reencryption Failure";
    			t1 = space();
    			div1 = element("div");
    			div1.textContent = "Your password has been changed, but the note text found on VoltCloud\n      could not be reencrypted because of the following reason:";
    			t3 = space();
    			div2 = element("div");
    			t4 = text(t4_value);
    			t5 = space();
    			div3 = element("div");
    			div3.textContent = "If you know the password with which the text was originally encrypted, you\n      may try to log-out and then to reset(!) your password in order to continue\n      working with the note. Important: do not \"change\" your password right now,\n      that will not help! However, you may \"change\" it again after having reset\n      it to its original value.";
    			t7 = space();
    			button = element("button");
    			button.textContent = "Ok";
    			attr(div0, "name", "Title");
    			attr(div0, "class", "svelte-16jefj2");
    			attr(div1, "class", "Block svelte-16jefj2");
    			attr(div2, "class", "Block svelte-16jefj2");
    			set_style(div2, "margin", "0px 10px 10px 10px");
    			set_style(div2, "font-size", "12px");
    			set_style(div2, "font-style", "italic");
    			set_style(div2, "color", "red\n    ");
    			attr(div3, "class", "Block svelte-16jefj2");
    			attr(button, "class", "svelte-16jefj2");
    			attr(div4, "class", "svelte-16jefj2");
    			attr(div5, "class", "Dialog svelte-16jefj2");
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
    			append(div4, t5);
    			append(div4, div3);
    			append(div4, t7);
    			append(div4, button);

    			if (!mounted) {
    				dispose = listen(button, "click", prevent_default(closeNotice$h));
    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*$Globals*/ 1 && t4_value !== (t4_value = /*$Globals*/ ctx[0].FailureReason + "")) set_data(t4, t4_value);
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

    function closeNotice$h() {
    	Globals.define('State', '');
    }

    function instance$w($$self, $$props, $$invalidate) {
    	let $Globals;
    	component_subscribe($$self, Globals, $$value => $$invalidate(0, $Globals = $$value));
    	return [$Globals];
    }

    class ReencryptionFailureNotice extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$w, create_fragment$G, safe_not_equal, {});
    	}
    }

    var css_248z$F = ".Dialog.svelte-16jefj2.svelte-16jefj2.svelte-16jefj2{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-16jefj2>div.svelte-16jefj2.svelte-16jefj2{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-16jefj2>div.svelte-16jefj2>[name=\"Title\"].svelte-16jefj2{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}.Dialog.svelte-16jefj2>div.svelte-16jefj2>.Block.svelte-16jefj2{display:block;margin:0px 0px 10px 0px;text-align:justify}.Dialog.svelte-16jefj2>div.svelte-16jefj2>button.svelte-16jefj2{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:6px;background-color:#2980B9;border:none;border-radius:4px;font-size:16px;font-weight:bold;color:white;cursor:pointer}.Dialog.svelte-16jefj2>div.svelte-16jefj2>button.svelte-16jefj2:disabled{opacity:0.3;cursor:auto}";
    styleInject(css_248z$F,{"insertAt":"top"});

    /* src/DecryptionFailureNotice.svelte generated by Svelte v3.42.1 */

    function create_fragment$F(ctx) {
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
    			div0.textContent = "Decryption Failure";
    			t1 = space();
    			div1 = element("div");
    			div1.textContent = "The note text found on VoltCloud could not be decrypted. Such a situation\n      may occur after a password reset or a password change from one browser\n      followed by a save from another one.";
    			t3 = space();
    			div2 = element("div");
    			div2.textContent = "If you know the password with which the text was encrypted, you may try\n      to log-out and then to reset(!) your password. Important: do not\n      just \"change\" your password, that will not help!";
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
    				dispose = listen(button, "click", prevent_default(closeNotice$g));
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

    function closeNotice$g() {
    	Globals.define('State', '');
    }

    function instance$v($$self) {
    	return [];
    }

    class DecryptionFailureNotice extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$v, create_fragment$F, safe_not_equal, {});
    	}
    }

    var css_248z$E = ".Dialog.svelte-16jefj2.svelte-16jefj2.svelte-16jefj2{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-16jefj2>div.svelte-16jefj2.svelte-16jefj2{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-16jefj2>div.svelte-16jefj2>[name=\"Title\"].svelte-16jefj2{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}.Dialog.svelte-16jefj2>div.svelte-16jefj2>.Block.svelte-16jefj2{display:block;margin:0px 0px 10px 0px;text-align:justify}.Dialog.svelte-16jefj2>div.svelte-16jefj2>button.svelte-16jefj2{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:6px;background-color:#2980B9;border:none;border-radius:4px;font-size:16px;font-weight:bold;color:white;cursor:pointer}.Dialog.svelte-16jefj2>div.svelte-16jefj2>button.svelte-16jefj2:disabled{opacity:0.3;cursor:auto}";
    styleInject(css_248z$E,{"insertAt":"top"});

    /* src/MultiInstanceNotice.svelte generated by Svelte v3.42.1 */

    function create_fragment$E(ctx) {
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
    			div0.textContent = "Multiple Instances";
    			t1 = space();
    			div1 = element("div");
    			div1.textContent = "There seem to be multiple instances of \"VfB-Notes\" running in this\n      browser.";
    			t3 = space();
    			div2 = element("div");
    			div2.textContent = "This should be avoided because multiple simultaneously running instances\n      of this application in the same browser may disturb each other and cause\n      unforeseen and annoying effects.";
    			t5 = space();
    			div3 = element("div");
    			div3.textContent = "Please, close them all but one.";
    			t7 = space();
    			button = element("button");
    			button.textContent = "Ok";
    			attr(div0, "name", "Title");
    			attr(div0, "class", "svelte-16jefj2");
    			attr(div1, "class", "Block svelte-16jefj2");
    			attr(div2, "class", "Block svelte-16jefj2");
    			attr(div3, "class", "Block svelte-16jefj2");
    			attr(button, "class", "svelte-16jefj2");
    			attr(div4, "class", "svelte-16jefj2");
    			attr(div5, "class", "Dialog svelte-16jefj2");
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
    				dispose = listen(button, "click", prevent_default(closeNotice$f));
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

    function closeNotice$f() {
    	Globals.define('State', '');
    }

    function instance$u($$self) {
    	return [];
    }

    class MultiInstanceNotice extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$u, create_fragment$E, safe_not_equal, {});
    	}
    }

    var css_248z$D = ".Dialog.svelte-16jefj2.svelte-16jefj2.svelte-16jefj2{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-16jefj2>div.svelte-16jefj2.svelte-16jefj2{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-16jefj2>div.svelte-16jefj2>[name=\"Title\"].svelte-16jefj2{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}.Dialog.svelte-16jefj2>div.svelte-16jefj2>.Block.svelte-16jefj2{display:block;margin:0px 0px 10px 0px;text-align:justify}.Dialog.svelte-16jefj2>div.svelte-16jefj2>button.svelte-16jefj2{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:6px;background-color:#2980B9;border:none;border-radius:4px;font-size:16px;font-weight:bold;color:white;cursor:pointer}.Dialog.svelte-16jefj2>div.svelte-16jefj2>button.svelte-16jefj2:disabled{opacity:0.3;cursor:auto}";
    styleInject(css_248z$D,{"insertAt":"top"});

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

    			div1.innerHTML = `Network communication with <a href="https://voltcloud.io/">VoltCloud.io</a>
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
    			attr(div0, "class", "svelte-16jefj2");
    			attr(div1, "class", "Block svelte-16jefj2");
    			attr(div2, "class", "Block svelte-16jefj2");
    			set_style(div2, "margin", "0px 10px 10px 10px");
    			set_style(div2, "font-size", "12px");
    			set_style(div2, "font-style", "italic");
    			set_style(div2, "color", "red\n    ");
    			attr(div3, "class", "Block svelte-16jefj2");
    			attr(button, "class", "svelte-16jefj2");
    			attr(div4, "class", "svelte-16jefj2");
    			attr(div5, "class", "Dialog svelte-16jefj2");
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
    				dispose = listen(button, "click", prevent_default(closeNotice$e));
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

    function closeNotice$e() {
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

    var css_248z$C = ".Dialog.svelte-16jefj2.svelte-16jefj2.svelte-16jefj2{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-16jefj2>div.svelte-16jefj2.svelte-16jefj2{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-16jefj2>div.svelte-16jefj2>[name=\"Title\"].svelte-16jefj2{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}.Dialog.svelte-16jefj2>div.svelte-16jefj2>.Block.svelte-16jefj2{display:block;margin:0px 0px 10px 0px;text-align:justify}.Dialog.svelte-16jefj2>div.svelte-16jefj2>button.svelte-16jefj2{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:6px;background-color:#2980B9;border:none;border-radius:4px;font-size:16px;font-weight:bold;color:white;cursor:pointer}.Dialog.svelte-16jefj2>div.svelte-16jefj2>button.svelte-16jefj2:disabled{opacity:0.3;cursor:auto}";
    styleInject(css_248z$C,{"insertAt":"top"});

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
    				dispose = listen(button, "click", prevent_default(closeNotice$d));
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

    function closeNotice$d() {
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

    var css_248z$B = ".Dialog.svelte-cmrmc8.svelte-cmrmc8.svelte-cmrmc8{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-cmrmc8>div.svelte-cmrmc8.svelte-cmrmc8{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-cmrmc8>div.svelte-cmrmc8>[name=\"Title\"].svelte-cmrmc8{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}";
    styleInject(css_248z$B,{"insertAt":"top"});

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
    /**** confirmCustomerUsing ****/
    function confirmCustomerUsing(Token) {
        return __awaiter(this, void 0, void 0, function () {
            var Signal_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        expectNonEmptyString('VoltCloud customer confirmation token', Token);
                        assertApplicationFocus();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, ResponseOf('public', 'POST', '{{application_url}}/api/auth/confirm', null, {
                                token: Token
                            })];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        Signal_5 = _a.sent();
                        switch (Signal_5.HTTPStatus) {
                            case 401: throwError('BadToken: the given token can not be recognized');
                            default: throw Signal_5;
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
    /**** CustomerRecord ****/
    function CustomerRecord() {
        return __awaiter(this, void 0, void 0, function () {
            var Response, Signal_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        assertApplicationFocus();
                        assertCustomerMandate();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, ResponseOf('private', 'GET', '{{application_url}}/api/user/{{customer_id}}', {
                                customer_id: activeCustomerId
                            })];
                    case 2:
                        Response = _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        Signal_8 = _a.sent();
                        switch (Signal_8.HTTPStatus) {
                            case 422: switch (Signal_8.message) {
                                case 'Could not decode scope.':
                                    throwError('InvalidArgument: invalid customer id given');
                            }
                            default: throw Signal_8;
                        }
                        return [3 /*break*/, 4];
                    case 4:
                        if ((Response != null) && (Response.id === activeCustomerId)) {
                            if (currentCustomerId === activeCustomerId) {
                                activeCustomerAddress = Response.email; // might have changed
                            }
                            return [2 /*return*/, Response];
                        }
                        else {
                            throwError('InternalError: could not analyze response for customer record request');
                        }
                        return [2 /*return*/];
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
    /**** CustomerStorageEntry ****/
    function CustomerStorageEntry(StorageKey) {
        return __awaiter(this, void 0, void 0, function () {
            var Response, Signal_14;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        expectStorageKey('VoltCloud customer storage key', StorageKey);
                        assertDeveloperOrCustomerMandate();
                        assertApplicationFocus();
                        assertCustomerFocus();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, ResponseOf('private', 'GET', '{{application_url}}/api/storage/{{customer_id}}/key/{{customer_storage_key}}', {
                                customer_storage_key: StorageKey
                            })];
                    case 2:
                        Response = _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        Signal_14 = _a.sent();
                        switch (Signal_14.HTTPStatus) {
                            case 404:
                                switch (Signal_14.message) {
                                    case 'Could not route your request.':
                                        throwError('NoSuchCustomer: could not find the given customer or storage key');
                                    case 'User not found.':
                                        throwError('NoSuchCustomer: could not find the given customer');
                                    case 'Key does not exist.':
                                        return [2 /*return*/, undefined];
                                }
                                break;
                            case 422: switch (Signal_14.message) {
                                case 'Could not decode scope.':
                                    throwError('InvalidArgument: invalid customer id given');
                                case 'The length of the key parameter must be <=255.':
                                    throwError('InvalidArgument: the given storage key is too long');
                            }
                            default: throw Signal_14;
                        }
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/, Response];
                }
            });
        });
    }
    /**** setCustomerStorageEntryTo ****/
    function setCustomerStorageEntryTo(StorageKey, StorageValue) {
        return __awaiter(this, void 0, void 0, function () {
            var Signal_15;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        expectStorageKey('VoltCloud customer storage key', StorageKey);
                        expectStorageValue('VoltCloud customer storage value', StorageValue);
                        assertDeveloperOrCustomerMandate();
                        assertApplicationFocus();
                        assertCustomerFocus();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, ResponseOf('private', 'PUT', '{{application_url}}/api/storage/{{customer_id}}/key/{{customer_storage_key}}', {
                                customer_storage_key: StorageKey
                            }, StorageValue)];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        Signal_15 = _a.sent();
                        switch (Signal_15.HTTPStatus) {
                            case 404:
                                switch (Signal_15.message) {
                                    case 'Could not route your request.':
                                    case 'User not found.':
                                        throwError('NoSuchCustomer: could not find the given customer');
                                }
                                break;
                            case 413: throwError('InvalidArgument: the given storage value is too long');
                            case 422: switch (Signal_15.message) {
                                case 'Could not decode scope.':
                                    throwError('InvalidArgument: invalid customer id given');
                                case 'The length of the key parameter must be <=255.':
                                    throwError('InvalidArgument: the given storage key is too long');
                            }
                            default: throw Signal_15;
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
            /[0-9]/.test(Value) && /[^a-zA-Z0-9]/.test(Value) &&
            (Value.toLowerCase() !== Value));
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
    var expectStorageKey = ValidatorForClassifier(ValueIsStorageKey, rejectNil, 'suitable VoltCloud storage key');
    /**** ValueIsStorageValue - a string suitable as a VoltCloud storage value ****/
    function ValueIsStorageValue(Value) {
        return ValueIsString(Value) && (Value.length <= maxStorageValueLength);
    }
    /**** allow/expect[ed]StorageValue ****/
    ValidatorForClassifier(ValueIsStorageValue, acceptNil, 'suitable VoltCloud storage value');
    var expectStorageValue = ValidatorForClassifier(ValueIsStorageValue, rejectNil, 'suitable VoltCloud storage value');
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
    /**** ResponseOf ****/
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

    var css_248z$A = ".Dialog.svelte-28kowe.svelte-28kowe.svelte-28kowe{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-28kowe>div.svelte-28kowe.svelte-28kowe{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-28kowe>div.svelte-28kowe>[name=\"Title\"].svelte-28kowe{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}.Dialog.svelte-28kowe>div.svelte-28kowe>[name=\"CloseButton\"].svelte-28kowe{display:block;position:absolute;top:-20px;right:-20px;width:20px;height:20px;border:solid 2px white;border-radius:50%;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2), 0px 0px 0px 1px lightgray;background-color:black;padding:0px;font-size:18px;font-weight:bold;line-height:12px;text-align:center;color:white;cursor:pointer}.Dialog.svelte-28kowe>div.svelte-28kowe>.Block.svelte-28kowe{display:block;margin:0px 0px 10px 0px;text-align:justify}.Dialog.svelte-28kowe>div.svelte-28kowe>button.svelte-28kowe{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:6px;background-color:#2980B9;border:none;border-radius:4px;font-size:16px;font-weight:bold;color:white;cursor:pointer}.Dialog.svelte-28kowe>div.svelte-28kowe>button.svelte-28kowe:disabled{opacity:0.3;cursor:auto}";
    styleInject(css_248z$A,{"insertAt":"top"});

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
    					listen(div1, "click", prevent_default(closeDialog$8)),
    					listen(input, "change", /*input_change_handler*/ ctx[2]),
    					listen(button, "click", prevent_default(/*deleteAccount*/ ctx[1]))
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

    function closeDialog$8() {
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

    	function deleteAccount() {
    		return __awaiter(this, void 0, void 0, function* () {
    			Globals.define({ State: 'unregistering' });

    			try {
    				yield focusOnApplication($Globals.ApplicationURL, $Globals.ApplicationId);
    				yield actOnBehalfOfCustomer($Globals.EMailAddress, $Globals.Password);
    				yield deleteCustomer();
    			} catch(Signal) {
    				switch (Signal.name) {
    					case 'LoginFailed':
    					case 'BadToken':
    						return Globals.define({ loggedIn: false, State: 'loggedOut' });
    					default:
    						return Globals.define({
    							State: 'CommunicationFailure',
    							FailureReason: Signal.toString()
    						});
    				}
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

    var css_248z$z = ".Dialog.svelte-16jefj2.svelte-16jefj2.svelte-16jefj2{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-16jefj2>div.svelte-16jefj2.svelte-16jefj2{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-16jefj2>div.svelte-16jefj2>[name=\"Title\"].svelte-16jefj2{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}.Dialog.svelte-16jefj2>div.svelte-16jefj2>.Block.svelte-16jefj2{display:block;margin:0px 0px 10px 0px;text-align:justify}.Dialog.svelte-16jefj2>div.svelte-16jefj2>button.svelte-16jefj2{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:6px;background-color:#2980B9;border:none;border-radius:4px;font-size:16px;font-weight:bold;color:white;cursor:pointer}.Dialog.svelte-16jefj2>div.svelte-16jefj2>button.svelte-16jefj2:disabled{opacity:0.3;cursor:auto}";
    styleInject(css_248z$z,{"insertAt":"top"});

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
    				dispose = listen(button, "click", prevent_default(closeNotice$c));
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

    function closeNotice$c() {
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

    var css_248z$y = ".Dialog.svelte-16jefj2.svelte-16jefj2.svelte-16jefj2{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-16jefj2>div.svelte-16jefj2.svelte-16jefj2{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-16jefj2>div.svelte-16jefj2>[name=\"Title\"].svelte-16jefj2{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}.Dialog.svelte-16jefj2>div.svelte-16jefj2>.Block.svelte-16jefj2{display:block;margin:0px 0px 10px 0px;text-align:justify}.Dialog.svelte-16jefj2>div.svelte-16jefj2>button.svelte-16jefj2{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:6px;background-color:#2980B9;border:none;border-radius:4px;font-size:16px;font-weight:bold;color:white;cursor:pointer}.Dialog.svelte-16jefj2>div.svelte-16jefj2>button.svelte-16jefj2:disabled{opacity:0.3;cursor:auto}";
    styleInject(css_248z$y,{"insertAt":"top"});

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
    				dispose = listen(button, "click", prevent_default(closeNotice$b));
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

    function closeNotice$b() {
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

    var css_248z$x = ".Dialog.svelte-cmrmc8.svelte-cmrmc8.svelte-cmrmc8{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-cmrmc8>div.svelte-cmrmc8.svelte-cmrmc8{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-cmrmc8>div.svelte-cmrmc8>[name=\"Title\"].svelte-cmrmc8{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}";
    styleInject(css_248z$x,{"insertAt":"top"});

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

    var css_248z$w = ".Dialog.svelte-1eiuw7.svelte-1eiuw7.svelte-1eiuw7{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-1eiuw7>div.svelte-1eiuw7.svelte-1eiuw7{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-1eiuw7>div.svelte-1eiuw7>[name=\"Title\"].svelte-1eiuw7{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}.Dialog.svelte-1eiuw7>div.svelte-1eiuw7>[name=\"CloseButton\"].svelte-1eiuw7{display:block;position:absolute;top:-20px;right:-20px;width:20px;height:20px;border:solid 2px white;border-radius:50%;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2), 0px 0px 0px 1px lightgray;background-color:black;padding:0px;font-size:18px;font-weight:bold;line-height:12px;text-align:center;color:white;cursor:pointer}.Dialog.svelte-1eiuw7>div.svelte-1eiuw7>input.svelte-1eiuw7{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:4px;border:solid 1px lightgray;border-radius:2px;font-size:16px}.Dialog.svelte-1eiuw7>div .Hint.svelte-1eiuw7.svelte-1eiuw7{display:inline-block;position:relative;left:2px;top:-2px;font-size:12px\n  }.Dialog.svelte-1eiuw7>div .invalid.Hint.svelte-1eiuw7.svelte-1eiuw7{color:red}.Dialog.svelte-1eiuw7>div.svelte-1eiuw7>button.svelte-1eiuw7{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:6px;background-color:#2980B9;border:none;border-radius:4px;font-size:16px;font-weight:bold;color:white;cursor:pointer}.Dialog.svelte-1eiuw7>div.svelte-1eiuw7>button.svelte-1eiuw7:disabled{opacity:0.3;cursor:auto}";
    styleInject(css_248z$w,{"insertAt":"top"});

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
    					listen(div1, "click", prevent_default(closeDialog$7)),
    					listen(input0, "input", /*input0_input_handler*/ ctx[8]),
    					listen(input1, "input", /*input1_input_handler*/ ctx[9]),
    					listen(button, "click", prevent_default(/*changeName*/ ctx[7]))
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

    function closeDialog$7() {
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

    	function changeName() {
    		return __awaiter(this, void 0, void 0, function* () {
    			Globals.define({ State: 'changingName' });

    			try {
    				yield focusOnApplication($Globals.ApplicationURL, $Globals.ApplicationId);
    				yield actOnBehalfOfCustomer($Globals.EMailAddress, $Globals.Password);

    				yield updateCustomerRecordBy({
    					first_name: firstName,
    					last_name: lastName
    				});
    			} catch(Signal) {
    				switch (Signal.name) {
    					case 'LoginFailed':
    					case 'BadToken':
    						return Globals.define({ loggedIn: false, State: 'loggedOut' });
    					default:
    						return Globals.define({
    							State: 'CommunicationFailure',
    							FailureReason: Signal.toString()
    						});
    				}
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

    var css_248z$v = ".Dialog.svelte-16jefj2.svelte-16jefj2.svelte-16jefj2{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-16jefj2>div.svelte-16jefj2.svelte-16jefj2{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-16jefj2>div.svelte-16jefj2>[name=\"Title\"].svelte-16jefj2{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}.Dialog.svelte-16jefj2>div.svelte-16jefj2>.Block.svelte-16jefj2{display:block;margin:0px 0px 10px 0px;text-align:justify}.Dialog.svelte-16jefj2>div.svelte-16jefj2>button.svelte-16jefj2{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:6px;background-color:#2980B9;border:none;border-radius:4px;font-size:16px;font-weight:bold;color:white;cursor:pointer}.Dialog.svelte-16jefj2>div.svelte-16jefj2>button.svelte-16jefj2:disabled{opacity:0.3;cursor:auto}";
    styleInject(css_248z$v,{"insertAt":"top"});

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
    				dispose = listen(button, "click", prevent_default(closeNotice$a));
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

    function closeNotice$a() {
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

    var css_248z$u = ".Dialog.svelte-16jefj2.svelte-16jefj2.svelte-16jefj2{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-16jefj2>div.svelte-16jefj2.svelte-16jefj2{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-16jefj2>div.svelte-16jefj2>[name=\"Title\"].svelte-16jefj2{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}.Dialog.svelte-16jefj2>div.svelte-16jefj2>.Block.svelte-16jefj2{display:block;margin:0px 0px 10px 0px;text-align:justify}.Dialog.svelte-16jefj2>div.svelte-16jefj2>button.svelte-16jefj2{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:6px;background-color:#2980B9;border:none;border-radius:4px;font-size:16px;font-weight:bold;color:white;cursor:pointer}.Dialog.svelte-16jefj2>div.svelte-16jefj2>button.svelte-16jefj2:disabled{opacity:0.3;cursor:auto}";
    styleInject(css_248z$u,{"insertAt":"top"});

    /* src/PasswordChangedNotice.svelte generated by Svelte v3.42.1 */

    function create_fragment$u(ctx) {
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
    			div0.textContent = "Password Changed";
    			t1 = space();
    			div1 = element("div");
    			div1.textContent = "Your password has been successfully changed any your notes re-encrypted.";
    			t3 = space();
    			div2 = element("div");
    			div2.textContent = "Important: please close all other currently running instances of this\n      application (on every device and browser) or those instances could\n      damage your data!";
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
    				dispose = listen(button, "click", prevent_default(closeNotice$9));
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

    function closeNotice$9() {
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

    var css_248z$t = ".Dialog.svelte-cmrmc8.svelte-cmrmc8.svelte-cmrmc8{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-cmrmc8>div.svelte-cmrmc8.svelte-cmrmc8{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-cmrmc8>div.svelte-cmrmc8>[name=\"Title\"].svelte-cmrmc8{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}";
    styleInject(css_248z$t,{"insertAt":"top"});

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

    var base64 = {};

    // Copyright (C) 2016 Dmitry Chestnykh
    // MIT License. See LICENSE file for details.
    var __extends = (commonjsGlobal && commonjsGlobal.__extends) || (function () {
        var extendStatics = function (d, b) {
            extendStatics = Object.setPrototypeOf ||
                ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
                function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
            return extendStatics(d, b);
        };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    Object.defineProperty(base64, "__esModule", { value: true });
    /**
     * Package base64 implements Base64 encoding and decoding.
     */
    // Invalid character used in decoding to indicate
    // that the character to decode is out of range of
    // alphabet and cannot be decoded.
    var INVALID_BYTE = 256;
    /**
     * Implements standard Base64 encoding.
     *
     * Operates in constant time.
     */
    var Coder = /** @class */ (function () {
        // TODO(dchest): methods to encode chunk-by-chunk.
        function Coder(_paddingCharacter) {
            if (_paddingCharacter === void 0) { _paddingCharacter = "="; }
            this._paddingCharacter = _paddingCharacter;
        }
        Coder.prototype.encodedLength = function (length) {
            if (!this._paddingCharacter) {
                return (length * 8 + 5) / 6 | 0;
            }
            return (length + 2) / 3 * 4 | 0;
        };
        Coder.prototype.encode = function (data) {
            var out = "";
            var i = 0;
            for (; i < data.length - 2; i += 3) {
                var c = (data[i] << 16) | (data[i + 1] << 8) | (data[i + 2]);
                out += this._encodeByte((c >>> 3 * 6) & 63);
                out += this._encodeByte((c >>> 2 * 6) & 63);
                out += this._encodeByte((c >>> 1 * 6) & 63);
                out += this._encodeByte((c >>> 0 * 6) & 63);
            }
            var left = data.length - i;
            if (left > 0) {
                var c = (data[i] << 16) | (left === 2 ? data[i + 1] << 8 : 0);
                out += this._encodeByte((c >>> 3 * 6) & 63);
                out += this._encodeByte((c >>> 2 * 6) & 63);
                if (left === 2) {
                    out += this._encodeByte((c >>> 1 * 6) & 63);
                }
                else {
                    out += this._paddingCharacter || "";
                }
                out += this._paddingCharacter || "";
            }
            return out;
        };
        Coder.prototype.maxDecodedLength = function (length) {
            if (!this._paddingCharacter) {
                return (length * 6 + 7) / 8 | 0;
            }
            return length / 4 * 3 | 0;
        };
        Coder.prototype.decodedLength = function (s) {
            return this.maxDecodedLength(s.length - this._getPaddingLength(s));
        };
        Coder.prototype.decode = function (s) {
            if (s.length === 0) {
                return new Uint8Array(0);
            }
            var paddingLength = this._getPaddingLength(s);
            var length = s.length - paddingLength;
            var out = new Uint8Array(this.maxDecodedLength(length));
            var op = 0;
            var i = 0;
            var haveBad = 0;
            var v0 = 0, v1 = 0, v2 = 0, v3 = 0;
            for (; i < length - 4; i += 4) {
                v0 = this._decodeChar(s.charCodeAt(i + 0));
                v1 = this._decodeChar(s.charCodeAt(i + 1));
                v2 = this._decodeChar(s.charCodeAt(i + 2));
                v3 = this._decodeChar(s.charCodeAt(i + 3));
                out[op++] = (v0 << 2) | (v1 >>> 4);
                out[op++] = (v1 << 4) | (v2 >>> 2);
                out[op++] = (v2 << 6) | v3;
                haveBad |= v0 & INVALID_BYTE;
                haveBad |= v1 & INVALID_BYTE;
                haveBad |= v2 & INVALID_BYTE;
                haveBad |= v3 & INVALID_BYTE;
            }
            if (i < length - 1) {
                v0 = this._decodeChar(s.charCodeAt(i));
                v1 = this._decodeChar(s.charCodeAt(i + 1));
                out[op++] = (v0 << 2) | (v1 >>> 4);
                haveBad |= v0 & INVALID_BYTE;
                haveBad |= v1 & INVALID_BYTE;
            }
            if (i < length - 2) {
                v2 = this._decodeChar(s.charCodeAt(i + 2));
                out[op++] = (v1 << 4) | (v2 >>> 2);
                haveBad |= v2 & INVALID_BYTE;
            }
            if (i < length - 3) {
                v3 = this._decodeChar(s.charCodeAt(i + 3));
                out[op++] = (v2 << 6) | v3;
                haveBad |= v3 & INVALID_BYTE;
            }
            if (haveBad !== 0) {
                throw new Error("Base64Coder: incorrect characters for decoding");
            }
            return out;
        };
        // Standard encoding have the following encoded/decoded ranges,
        // which we need to convert between.
        //
        // ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789  +   /
        // Index:   0 - 25                    26 - 51              52 - 61   62  63
        // ASCII:  65 - 90                    97 - 122             48 - 57   43  47
        //
        // Encode 6 bits in b into a new character.
        Coder.prototype._encodeByte = function (b) {
            // Encoding uses constant time operations as follows:
            //
            // 1. Define comparison of A with B using (A - B) >>> 8:
            //          if A > B, then result is positive integer
            //          if A <= B, then result is 0
            //
            // 2. Define selection of C or 0 using bitwise AND: X & C:
            //          if X == 0, then result is 0
            //          if X != 0, then result is C
            //
            // 3. Start with the smallest comparison (b >= 0), which is always
            //    true, so set the result to the starting ASCII value (65).
            //
            // 4. Continue comparing b to higher ASCII values, and selecting
            //    zero if comparison isn't true, otherwise selecting a value
            //    to add to result, which:
            //
            //          a) undoes the previous addition
            //          b) provides new value to add
            //
            var result = b;
            // b >= 0
            result += 65;
            // b > 25
            result += ((25 - b) >>> 8) & ((0 - 65) - 26 + 97);
            // b > 51
            result += ((51 - b) >>> 8) & ((26 - 97) - 52 + 48);
            // b > 61
            result += ((61 - b) >>> 8) & ((52 - 48) - 62 + 43);
            // b > 62
            result += ((62 - b) >>> 8) & ((62 - 43) - 63 + 47);
            return String.fromCharCode(result);
        };
        // Decode a character code into a byte.
        // Must return 256 if character is out of alphabet range.
        Coder.prototype._decodeChar = function (c) {
            // Decoding works similar to encoding: using the same comparison
            // function, but now it works on ranges: result is always incremented
            // by value, but this value becomes zero if the range is not
            // satisfied.
            //
            // Decoding starts with invalid value, 256, which is then
            // subtracted when the range is satisfied. If none of the ranges
            // apply, the function returns 256, which is then checked by
            // the caller to throw error.
            var result = INVALID_BYTE; // start with invalid character
            // c == 43 (c > 42 and c < 44)
            result += (((42 - c) & (c - 44)) >>> 8) & (-INVALID_BYTE + c - 43 + 62);
            // c == 47 (c > 46 and c < 48)
            result += (((46 - c) & (c - 48)) >>> 8) & (-INVALID_BYTE + c - 47 + 63);
            // c > 47 and c < 58
            result += (((47 - c) & (c - 58)) >>> 8) & (-INVALID_BYTE + c - 48 + 52);
            // c > 64 and c < 91
            result += (((64 - c) & (c - 91)) >>> 8) & (-INVALID_BYTE + c - 65 + 0);
            // c > 96 and c < 123
            result += (((96 - c) & (c - 123)) >>> 8) & (-INVALID_BYTE + c - 97 + 26);
            return result;
        };
        Coder.prototype._getPaddingLength = function (s) {
            var paddingLength = 0;
            if (this._paddingCharacter) {
                for (var i = s.length - 1; i >= 0; i--) {
                    if (s[i] !== this._paddingCharacter) {
                        break;
                    }
                    paddingLength++;
                }
                if (s.length < 4 || paddingLength > 2) {
                    throw new Error("Base64Coder: incorrect padding");
                }
            }
            return paddingLength;
        };
        return Coder;
    }());
    base64.Coder = Coder;
    var stdCoder = new Coder();
    function encode(data) {
        return stdCoder.encode(data);
    }
    var encode_1 = base64.encode = encode;
    function decode(s) {
        return stdCoder.decode(s);
    }
    var decode_1 = base64.decode = decode;
    /**
     * Implements URL-safe Base64 encoding.
     * (Same as Base64, but '+' is replaced with '-', and '/' with '_').
     *
     * Operates in constant time.
     */
    var URLSafeCoder = /** @class */ (function (_super) {
        __extends(URLSafeCoder, _super);
        function URLSafeCoder() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        // URL-safe encoding have the following encoded/decoded ranges:
        //
        // ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789  -   _
        // Index:   0 - 25                    26 - 51              52 - 61   62  63
        // ASCII:  65 - 90                    97 - 122             48 - 57   45  95
        //
        URLSafeCoder.prototype._encodeByte = function (b) {
            var result = b;
            // b >= 0
            result += 65;
            // b > 25
            result += ((25 - b) >>> 8) & ((0 - 65) - 26 + 97);
            // b > 51
            result += ((51 - b) >>> 8) & ((26 - 97) - 52 + 48);
            // b > 61
            result += ((61 - b) >>> 8) & ((52 - 48) - 62 + 45);
            // b > 62
            result += ((62 - b) >>> 8) & ((62 - 45) - 63 + 95);
            return String.fromCharCode(result);
        };
        URLSafeCoder.prototype._decodeChar = function (c) {
            var result = INVALID_BYTE;
            // c == 45 (c > 44 and c < 46)
            result += (((44 - c) & (c - 46)) >>> 8) & (-INVALID_BYTE + c - 45 + 62);
            // c == 95 (c > 94 and c < 96)
            result += (((94 - c) & (c - 96)) >>> 8) & (-INVALID_BYTE + c - 95 + 63);
            // c > 47 and c < 58
            result += (((47 - c) & (c - 58)) >>> 8) & (-INVALID_BYTE + c - 48 + 52);
            // c > 64 and c < 91
            result += (((64 - c) & (c - 91)) >>> 8) & (-INVALID_BYTE + c - 65 + 0);
            // c > 96 and c < 123
            result += (((96 - c) & (c - 123)) >>> 8) & (-INVALID_BYTE + c - 97 + 26);
            return result;
        };
        return URLSafeCoder;
    }(Coder));
    base64.URLSafeCoder = URLSafeCoder;
    var urlSafeCoder = new URLSafeCoder();
    function encodeURLSafe(data) {
        return urlSafeCoder.encode(data);
    }
    base64.encodeURLSafe = encodeURLSafe;
    function decodeURLSafe(s) {
        return urlSafeCoder.decode(s);
    }
    base64.decodeURLSafe = decodeURLSafe;
    base64.encodedLength = function (length) {
        return stdCoder.encodedLength(length);
    };
    base64.maxDecodedLength = function (length) {
        return stdCoder.maxDecodedLength(length);
    };
    base64.decodedLength = function (s) {
        return stdCoder.decodedLength(s);
    };

    var css_248z$s = ".Dialog.svelte-1jdexwn.svelte-1jdexwn.svelte-1jdexwn{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-1jdexwn>div.svelte-1jdexwn.svelte-1jdexwn{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-1jdexwn>div.svelte-1jdexwn>[name=\"Title\"].svelte-1jdexwn{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}.Dialog.svelte-1jdexwn>div.svelte-1jdexwn>[name=\"CloseButton\"].svelte-1jdexwn{display:block;position:absolute;top:-20px;right:-20px;width:20px;height:20px;border:solid 2px white;border-radius:50%;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2), 0px 0px 0px 1px lightgray;background-color:black;padding:0px;font-size:18px;font-weight:bold;line-height:12px;text-align:center;color:white;cursor:pointer}.Dialog.svelte-1jdexwn>div.svelte-1jdexwn>.Block.svelte-1jdexwn{display:block;margin:0px 0px 10px 0px;text-align:justify}.Dialog.svelte-1jdexwn>div.svelte-1jdexwn>input.svelte-1jdexwn{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:4px;border:solid 1px lightgray;border-radius:2px;font-size:16px}.Dialog.svelte-1jdexwn>div .Hint.svelte-1jdexwn.svelte-1jdexwn{display:inline-block;position:relative;left:2px;top:-2px;font-size:12px\n  }.Dialog.svelte-1jdexwn>div .invalid.Hint.svelte-1jdexwn.svelte-1jdexwn{color:red}.Dialog.svelte-1jdexwn>div.svelte-1jdexwn>button.svelte-1jdexwn{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:6px;background-color:#2980B9;border:none;border-radius:4px;font-size:16px;font-weight:bold;color:white;cursor:pointer}.Dialog.svelte-1jdexwn>div.svelte-1jdexwn>button.svelte-1jdexwn:disabled{opacity:0.3;cursor:auto}";
    styleInject(css_248z$s,{"insertAt":"top"});

    /* src/PasswordChangeDialog.svelte generated by Svelte v3.42.1 */

    function create_fragment$s(ctx) {
    	let div8;
    	let div7;
    	let div0;
    	let t1;
    	let div1;
    	let t3;
    	let div2;
    	let t5;
    	let div3;
    	let t7;
    	let input0;
    	let t8;
    	let div4;
    	let t9;
    	let t10;
    	let input1;
    	let t11;
    	let div5;
    	let t12;
    	let t13;
    	let input2;
    	let t14;
    	let div6;
    	let t15;
    	let t16;
    	let button;
    	let t17;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			div8 = element("div");
    			div7 = element("div");
    			div0 = element("div");
    			div0.textContent = "Password Change";
    			t1 = space();
    			div1 = element("div");
    			div1.textContent = "×";
    			t3 = space();
    			div2 = element("div");
    			div2.textContent = "You may now change your password. If successful, your notes will\n      automatically be re-encrypted using the new password.";
    			t5 = space();
    			div3 = element("div");
    			div3.textContent = "Important: please close all other currently running instances of this\n      application (on every device and browser) or those instances could\n      damage your data!";
    			t7 = space();
    			input0 = element("input");
    			t8 = space();
    			div4 = element("div");
    			t9 = text(/*oldPasswordMessage*/ ctx[6]);
    			t10 = space();
    			input1 = element("input");
    			t11 = space();
    			div5 = element("div");
    			t12 = text(/*newPasswordMessage*/ ctx[7]);
    			t13 = space();
    			input2 = element("input");
    			t14 = space();
    			div6 = element("div");
    			t15 = text(/*newConfirmationMessage*/ ctx[8]);
    			t16 = space();
    			button = element("button");
    			t17 = text("Change Password");
    			attr(div0, "name", "Title");
    			attr(div0, "class", "svelte-1jdexwn");
    			attr(div1, "name", "CloseButton");
    			attr(div1, "class", "svelte-1jdexwn");
    			attr(div2, "class", "Block svelte-1jdexwn");
    			attr(div3, "class", "Block svelte-1jdexwn");
    			attr(input0, "type", "password");
    			attr(input0, "placeholder", "your current password");
    			attr(input0, "class", "svelte-1jdexwn");
    			attr(div4, "class", "svelte-1jdexwn");
    			toggle_class(div4, "Hint", true);
    			toggle_class(div4, "invalid", /*oldPasswordLooksBad*/ ctx[1]);
    			attr(input1, "type", "password");
    			attr(input1, "placeholder", "your new password");
    			attr(input1, "class", "svelte-1jdexwn");
    			attr(div5, "class", "svelte-1jdexwn");
    			toggle_class(div5, "Hint", true);
    			toggle_class(div5, "invalid", /*newPasswordLooksBad*/ ctx[3]);
    			attr(input2, "type", "password");
    			attr(input2, "placeholder", "confirm your new password");
    			attr(input2, "class", "svelte-1jdexwn");
    			attr(div6, "class", "svelte-1jdexwn");
    			toggle_class(div6, "Hint", true);
    			toggle_class(div6, "invalid", /*newConfirmationLooksBad*/ ctx[5]);
    			button.disabled = /*ChangeIsForbidden*/ ctx[9];
    			attr(button, "class", "svelte-1jdexwn");
    			attr(div7, "class", "svelte-1jdexwn");
    			attr(div8, "class", "Dialog svelte-1jdexwn");
    		},
    		m(target, anchor) {
    			insert(target, div8, anchor);
    			append(div8, div7);
    			append(div7, div0);
    			append(div7, t1);
    			append(div7, div1);
    			append(div7, t3);
    			append(div7, div2);
    			append(div7, t5);
    			append(div7, div3);
    			append(div7, t7);
    			append(div7, input0);
    			set_input_value(input0, /*oldPassword*/ ctx[0]);
    			append(div7, t8);
    			append(div7, div4);
    			append(div4, t9);
    			append(div7, t10);
    			append(div7, input1);
    			set_input_value(input1, /*newPassword*/ ctx[2]);
    			append(div7, t11);
    			append(div7, div5);
    			append(div5, t12);
    			append(div7, t13);
    			append(div7, input2);
    			set_input_value(input2, /*newConfirmation*/ ctx[4]);
    			append(div7, t14);
    			append(div7, div6);
    			append(div6, t15);
    			append(div7, t16);
    			append(div7, button);
    			append(button, t17);

    			if (!mounted) {
    				dispose = [
    					listen(div1, "click", prevent_default(closeDialog$6)),
    					listen(input0, "input", /*input0_input_handler*/ ctx[11]),
    					listen(input1, "input", /*input1_input_handler*/ ctx[12]),
    					listen(input2, "input", /*input2_input_handler*/ ctx[13]),
    					listen(button, "click", prevent_default(/*changePassword*/ ctx[10]))
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*oldPassword*/ 1 && input0.value !== /*oldPassword*/ ctx[0]) {
    				set_input_value(input0, /*oldPassword*/ ctx[0]);
    			}

    			if (dirty & /*oldPasswordMessage*/ 64) set_data(t9, /*oldPasswordMessage*/ ctx[6]);

    			if (dirty & /*oldPasswordLooksBad*/ 2) {
    				toggle_class(div4, "invalid", /*oldPasswordLooksBad*/ ctx[1]);
    			}

    			if (dirty & /*newPassword*/ 4 && input1.value !== /*newPassword*/ ctx[2]) {
    				set_input_value(input1, /*newPassword*/ ctx[2]);
    			}

    			if (dirty & /*newPasswordMessage*/ 128) set_data(t12, /*newPasswordMessage*/ ctx[7]);

    			if (dirty & /*newPasswordLooksBad*/ 8) {
    				toggle_class(div5, "invalid", /*newPasswordLooksBad*/ ctx[3]);
    			}

    			if (dirty & /*newConfirmation*/ 16 && input2.value !== /*newConfirmation*/ ctx[4]) {
    				set_input_value(input2, /*newConfirmation*/ ctx[4]);
    			}

    			if (dirty & /*newConfirmationMessage*/ 256) set_data(t15, /*newConfirmationMessage*/ ctx[8]);

    			if (dirty & /*newConfirmationLooksBad*/ 32) {
    				toggle_class(div6, "invalid", /*newConfirmationLooksBad*/ ctx[5]);
    			}

    			if (dirty & /*ChangeIsForbidden*/ 512) {
    				button.disabled = /*ChangeIsForbidden*/ ctx[9];
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

    function closeDialog$6() {
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

    	function changePassword() {
    		return __awaiter(this, void 0, void 0, function* () {
    			if ($Globals.Password === oldPassword) {
    				Globals.define('State', 'changingPassword');

    				try {
    					yield focusOnApplication($Globals.ApplicationURL, $Globals.ApplicationId);
    					yield actOnBehalfOfCustomer($Globals.EMailAddress, $Globals.Password);
    					yield changeCustomerPasswordTo(newPassword);
    				} catch(Signal) {
    					switch (Signal.name) {
    						case 'LoginFailed':
    						case 'BadToken':
    							return Globals.define({ loggedIn: false, State: 'loggedOut' });
    						default:
    							return Globals.define({
    								State: 'CommunicationFailure',
    								FailureReason: Signal.toString()
    							});
    					}
    				}

    				try {
    					let NoteText = decrypted((yield CustomerStorageEntry('NoteText')) || '');
    					Globals.define('Password', newPassword);

    					if (NoteText == null) {
    						// decryption failure
    						return Globals.define({
    							State: 'ReencryptionFailure',
    							FailureReason: 'DecryptionFailed: could not decrypt existing note'
    						});
    					}

    					yield setCustomerStorageEntryTo('NoteText', encrypted(NoteText));
    				} catch(Signal) {
    					Globals.define('Password', newPassword);

    					return Globals.define({
    						State: 'ReencryptionFailure',
    						FailureReason: Signal.toString()
    					});
    				}

    				Globals.define('State', 'PasswordChanged');
    			} else {
    				Globals.define('State', 'wrongPassword');
    			}
    		});
    	}

    	function encrypted(Text) {
    		// @ts-ignore $Globals.EncryptionKey *is* a Uint8Array
    		let EncryptionKey = $Globals.EncryptionKey; // after login

    		let Nonce = naclFast.exports.randomBytes(naclFast.exports.secretbox.nonceLength);
    		let encryptedValue = naclFast.exports.secretbox(new TextEncoder().encode(Text), Nonce, EncryptionKey);
    		let Result = new Uint8Array(Nonce.length + encryptedValue.length);
    		Result.set(Nonce);
    		Result.set(encryptedValue, Nonce.length);
    		return encode_1(Result); // now Base64-encoded
    	}

    	function decrypted(Base64Value) {
    		if (Base64Value === '') {
    			return '';
    		}

    		// @ts-ignore $Globals.EncryptionKey *is* a Uint8Array
    		let EncryptionKey = $Globals.EncryptionKey; // after login

    		let Buffer;

    		try {
    			Buffer = decode_1(Base64Value);
    		} catch(Signal) {
    			console.error('Base64 decode failed', Signal);
    			return undefined;
    		}

    		if (Buffer.length < naclFast.exports.secretbox.nonceLength) {
    			return undefined;
    		}

    		let Nonce = Buffer.slice(0, naclFast.exports.secretbox.nonceLength);
    		let decryptedValue = naclFast.exports.secretbox.open(Buffer.slice(naclFast.exports.secretbox.nonceLength), Nonce, EncryptionKey);

    		return decryptedValue == null
    		? undefined
    		: new TextDecoder().decode(decryptedValue);
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
    				case !(/[^a-zA-Z0-9]/).test(oldPassword):
    					$$invalidate(1, oldPasswordLooksBad = true);
    					$$invalidate(6, oldPasswordMessage = 'your current password lacks any special characters');
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
    				case !(/[^a-zA-Z0-9]/).test(newPassword):
    					$$invalidate(3, newPasswordLooksBad = true);
    					$$invalidate(7, newPasswordMessage = 'your new password lacks any special characters');
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
    					$$invalidate(8, newConfirmationMessage = 'new password differs from confirmation');
    					break;
    				default:
    					$$invalidate(5, newConfirmationLooksBad = false);
    					$$invalidate(8, newConfirmationMessage = 'new password and confirmation are equal');
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

    var css_248z$r = ".Dialog.svelte-16jefj2.svelte-16jefj2.svelte-16jefj2{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-16jefj2>div.svelte-16jefj2.svelte-16jefj2{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-16jefj2>div.svelte-16jefj2>[name=\"Title\"].svelte-16jefj2{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}.Dialog.svelte-16jefj2>div.svelte-16jefj2>.Block.svelte-16jefj2{display:block;margin:0px 0px 10px 0px;text-align:justify}.Dialog.svelte-16jefj2>div.svelte-16jefj2>button.svelte-16jefj2{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:6px;background-color:#2980B9;border:none;border-radius:4px;font-size:16px;font-weight:bold;color:white;cursor:pointer}.Dialog.svelte-16jefj2>div.svelte-16jefj2>button.svelte-16jefj2:disabled{opacity:0.3;cursor:auto}";
    styleInject(css_248z$r,{"insertAt":"top"});

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
    				dispose = listen(button, "click", prevent_default(closeNotice$8));
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

    function closeNotice$8() {
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

    var css_248z$q = ".Dialog.svelte-16jefj2.svelte-16jefj2.svelte-16jefj2{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-16jefj2>div.svelte-16jefj2.svelte-16jefj2{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-16jefj2>div.svelte-16jefj2>[name=\"Title\"].svelte-16jefj2{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}.Dialog.svelte-16jefj2>div.svelte-16jefj2>.Block.svelte-16jefj2{display:block;margin:0px 0px 10px 0px;text-align:justify}.Dialog.svelte-16jefj2>div.svelte-16jefj2>button.svelte-16jefj2{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:6px;background-color:#2980B9;border:none;border-radius:4px;font-size:16px;font-weight:bold;color:white;cursor:pointer}.Dialog.svelte-16jefj2>div.svelte-16jefj2>button.svelte-16jefj2:disabled{opacity:0.3;cursor:auto}";
    styleInject(css_248z$q,{"insertAt":"top"});

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
    				dispose = listen(button, "click", prevent_default(closeNotice$7));
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

    function closeNotice$7() {
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

    var css_248z$p = ".Dialog.svelte-cmrmc8.svelte-cmrmc8.svelte-cmrmc8{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-cmrmc8>div.svelte-cmrmc8.svelte-cmrmc8{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-cmrmc8>div.svelte-cmrmc8>[name=\"Title\"].svelte-cmrmc8{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}";
    styleInject(css_248z$p,{"insertAt":"top"});

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

    var css_248z$o = ".Dialog.svelte-1eiuw7.svelte-1eiuw7.svelte-1eiuw7{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-1eiuw7>div.svelte-1eiuw7.svelte-1eiuw7{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-1eiuw7>div.svelte-1eiuw7>[name=\"Title\"].svelte-1eiuw7{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}.Dialog.svelte-1eiuw7>div.svelte-1eiuw7>[name=\"CloseButton\"].svelte-1eiuw7{display:block;position:absolute;top:-20px;right:-20px;width:20px;height:20px;border:solid 2px white;border-radius:50%;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2), 0px 0px 0px 1px lightgray;background-color:black;padding:0px;font-size:18px;font-weight:bold;line-height:12px;text-align:center;color:white;cursor:pointer}.Dialog.svelte-1eiuw7>div.svelte-1eiuw7>input.svelte-1eiuw7{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:4px;border:solid 1px lightgray;border-radius:2px;font-size:16px}.Dialog.svelte-1eiuw7>div .Hint.svelte-1eiuw7.svelte-1eiuw7{display:inline-block;position:relative;left:2px;top:-2px;font-size:12px\n  }.Dialog.svelte-1eiuw7>div .invalid.Hint.svelte-1eiuw7.svelte-1eiuw7{color:red}.Dialog.svelte-1eiuw7>div.svelte-1eiuw7>button.svelte-1eiuw7{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:6px;background-color:#2980B9;border:none;border-radius:4px;font-size:16px;font-weight:bold;color:white;cursor:pointer}.Dialog.svelte-1eiuw7>div.svelte-1eiuw7>button.svelte-1eiuw7:disabled{opacity:0.3;cursor:auto}";
    styleInject(css_248z$o,{"insertAt":"top"});

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
    					listen(div1, "click", prevent_default(closeDialog$5)),
    					listen(input, "input", /*input_input_handler*/ ctx[5]),
    					listen(button, "click", prevent_default(/*changeEMailAddress*/ ctx[4]))
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

    function closeDialog$5() {
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

    	function changeEMailAddress() {
    		return __awaiter(this, void 0, void 0, function* () {
    			Globals.define('State', 'changingEMailAddress');

    			try {
    				yield focusOnApplication($Globals.ApplicationURL, $Globals.ApplicationId);
    				yield actOnBehalfOfCustomer($Globals.EMailAddress, $Globals.Password);
    				yield changeCustomerEMailAddressTo(EMailAddress);
    			} catch(Signal) {
    				switch (Signal.name) {
    					case 'LoginFailed':
    					case 'BadToken':
    						return Globals.define({ loggedIn: false, State: 'loggedOut' });
    					case 'ConflictError':
    						return Globals.define('State', 'EMailAddressChangeFailure');
    					default:
    						return Globals.define({
    							State: 'CommunicationFailure',
    							FailureReason: Signal.toString()
    						});
    				}
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

    var css_248z$n = ".Dialog.svelte-cbod3o.svelte-cbod3o.svelte-cbod3o{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-cbod3o>div.svelte-cbod3o.svelte-cbod3o{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-cbod3o>div.svelte-cbod3o>[name=\"Title\"].svelte-cbod3o{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}.Dialog.svelte-cbod3o a.svelte-cbod3o.svelte-cbod3o,.Dialog.svelte-cbod3o a.svelte-cbod3o.svelte-cbod3o:visited{color:#2980B9;text-decoration:underline}.Dialog.svelte-cbod3o>div.svelte-cbod3o>.Block.svelte-cbod3o{display:block;margin:0px 0px 10px 0px;text-align:justify}.Dialog.svelte-cbod3o>div.svelte-cbod3o>button.svelte-cbod3o{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:6px;background-color:#2980B9;border:none;border-radius:4px;font-size:16px;font-weight:bold;color:white;cursor:pointer}.Dialog.svelte-cbod3o>div.svelte-cbod3o>button.svelte-cbod3o:disabled{opacity:0.3;cursor:auto}";
    styleInject(css_248z$n,{"insertAt":"top"});

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
    			attr(div0, "class", "svelte-cbod3o");
    			attr(div1, "class", "Block svelte-cbod3o");
    			attr(a0, "href", "#/");
    			attr(a0, "class", "svelte-cbod3o");
    			attr(div2, "class", "Block svelte-cbod3o");
    			attr(a1, "href", "#/");
    			attr(a1, "class", "svelte-cbod3o");
    			attr(div3, "class", "Block svelte-cbod3o");
    			attr(button, "class", "svelte-cbod3o");
    			attr(div4, "class", "svelte-cbod3o");
    			attr(div5, "class", "Dialog svelte-cbod3o");
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
    					listen(a0, "click", prevent_default(startRegistration$1)),
    					listen(a1, "click", prevent_default(startPasswordReset$1)),
    					listen(button, "click", prevent_default(closeNotice$6))
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

    function closeNotice$6() {
    	Globals.define('State', '');
    }

    function startRegistration$1() {
    	Globals.define('State', 'Registration');
    }

    function startPasswordReset$1() {
    	Globals.define('State', 'ResetRequest');
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

    var css_248z$m = ".Dialog.svelte-cmrmc8.svelte-cmrmc8.svelte-cmrmc8{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-cmrmc8>div.svelte-cmrmc8.svelte-cmrmc8{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-cmrmc8>div.svelte-cmrmc8>[name=\"Title\"].svelte-cmrmc8{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}";
    styleInject(css_248z$m,{"insertAt":"top"});

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

    var css_248z$l = ".Dialog.svelte-omsjzl.svelte-omsjzl.svelte-omsjzl{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-omsjzl>div.svelte-omsjzl.svelte-omsjzl{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-omsjzl>div.svelte-omsjzl>[name=\"Title\"].svelte-omsjzl{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}.Dialog.svelte-omsjzl>div.svelte-omsjzl>[name=\"CloseButton\"].svelte-omsjzl{display:block;position:absolute;top:-20px;right:-20px;width:20px;height:20px;border:solid 2px white;border-radius:50%;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2), 0px 0px 0px 1px lightgray;background-color:black;padding:0px;font-size:18px;font-weight:bold;line-height:12px;text-align:center;color:white;cursor:pointer}.Dialog.svelte-omsjzl a.svelte-omsjzl.svelte-omsjzl,.Dialog.svelte-omsjzl a.svelte-omsjzl.svelte-omsjzl:visited{color:#2980B9;text-decoration:underline}.Dialog.svelte-omsjzl>div.svelte-omsjzl>input.svelte-omsjzl{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:4px;border:solid 1px lightgray;border-radius:2px;font-size:16px}.Dialog.svelte-omsjzl>div .Hint.svelte-omsjzl.svelte-omsjzl{display:inline-block;position:relative;left:2px;top:-2px;font-size:12px\n  }.Dialog.svelte-omsjzl>div .invalid.Hint.svelte-omsjzl.svelte-omsjzl{color:red}.Dialog.svelte-omsjzl>div.svelte-omsjzl>button.svelte-omsjzl{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:6px;background-color:#2980B9;border:none;border-radius:4px;font-size:16px;font-weight:bold;color:white;cursor:pointer}.Dialog.svelte-omsjzl>div.svelte-omsjzl>button.svelte-omsjzl:disabled{opacity:0.3;cursor:auto}.Dialog.svelte-omsjzl>div.svelte-omsjzl>[name=\"UnconfirmedAccount\"].svelte-omsjzl{display:block;position:relative;margin:10px 0px 5px 0px;text-align:right}.Dialog.svelte-omsjzl>div.svelte-omsjzl>[name=\"ForgottenPassword\"].svelte-omsjzl{display:block;position:relative;margin:5px 0px 10px 0px;text-align:right}";
    styleInject(css_248z$l,{"insertAt":"top"});

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
    					listen(div0, "click", prevent_default(closeDialog$4)),
    					listen(input0, "input", /*input0_input_handler*/ ctx[8]),
    					listen(input1, "input", /*input1_input_handler*/ ctx[9]),
    					listen(a0, "click", prevent_default(startRenewalRequest)),
    					listen(a1, "click", prevent_default(startPasswordReset)),
    					listen(button, "click", prevent_default(/*doLogin*/ ctx[7])),
    					listen(a2, "click", prevent_default(startRegistration))
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

    function closeDialog$4() {
    	Globals.define('State', '');
    }

    function startRegistration() {
    	Globals.define('State', 'Registration');
    }

    function startRenewalRequest() {
    	Globals.define('State', 'RenewalRequest');
    }

    function startPasswordReset() {
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

    	function doLogin() {
    		return __awaiter(this, void 0, void 0, function* () {
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

    			try {
    				let CustomerInfo = yield CustomerRecord();

    				Globals.define({
    					firstName: CustomerInfo.first_name || '',
    					lastName: CustomerInfo.last_name || ''
    				});
    			} catch(Signal) {
    				console.error('could not retrieve CustomerRecord', Signal);
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
    				case !(/[^a-zA-Z0-9]/).test(Password):
    					$$invalidate(3, PasswordLooksBad = true);
    					$$invalidate(5, PasswordMessage = 'your password lacks any special characters');
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

    var css_248z$k = ".Dialog.svelte-16jefj2.svelte-16jefj2.svelte-16jefj2{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-16jefj2>div.svelte-16jefj2.svelte-16jefj2{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-16jefj2>div.svelte-16jefj2>[name=\"Title\"].svelte-16jefj2{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}.Dialog.svelte-16jefj2>div.svelte-16jefj2>.Block.svelte-16jefj2{display:block;margin:0px 0px 10px 0px;text-align:justify}.Dialog.svelte-16jefj2>div.svelte-16jefj2>button.svelte-16jefj2{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:6px;background-color:#2980B9;border:none;border-radius:4px;font-size:16px;font-weight:bold;color:white;cursor:pointer}.Dialog.svelte-16jefj2>div.svelte-16jefj2>button.svelte-16jefj2:disabled{opacity:0.3;cursor:auto}";
    styleInject(css_248z$k,{"insertAt":"top"});

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
    				dispose = listen(button, "click", prevent_default(closeNotice$5));
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

    function closeNotice$5() {
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

    var css_248z$j = ".Dialog.svelte-cmrmc8.svelte-cmrmc8.svelte-cmrmc8{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-cmrmc8>div.svelte-cmrmc8.svelte-cmrmc8{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-cmrmc8>div.svelte-cmrmc8>[name=\"Title\"].svelte-cmrmc8{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}";
    styleInject(css_248z$j,{"insertAt":"top"});

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

    var css_248z$i = ".Dialog.svelte-1jdexwn.svelte-1jdexwn.svelte-1jdexwn{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-1jdexwn>div.svelte-1jdexwn.svelte-1jdexwn{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-1jdexwn>div.svelte-1jdexwn>[name=\"Title\"].svelte-1jdexwn{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}.Dialog.svelte-1jdexwn>div.svelte-1jdexwn>[name=\"CloseButton\"].svelte-1jdexwn{display:block;position:absolute;top:-20px;right:-20px;width:20px;height:20px;border:solid 2px white;border-radius:50%;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2), 0px 0px 0px 1px lightgray;background-color:black;padding:0px;font-size:18px;font-weight:bold;line-height:12px;text-align:center;color:white;cursor:pointer}.Dialog.svelte-1jdexwn>div.svelte-1jdexwn>.Block.svelte-1jdexwn{display:block;margin:0px 0px 10px 0px;text-align:justify}.Dialog.svelte-1jdexwn>div.svelte-1jdexwn>input.svelte-1jdexwn{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:4px;border:solid 1px lightgray;border-radius:2px;font-size:16px}.Dialog.svelte-1jdexwn>div .Hint.svelte-1jdexwn.svelte-1jdexwn{display:inline-block;position:relative;left:2px;top:-2px;font-size:12px\n  }.Dialog.svelte-1jdexwn>div .invalid.Hint.svelte-1jdexwn.svelte-1jdexwn{color:red}.Dialog.svelte-1jdexwn>div.svelte-1jdexwn>button.svelte-1jdexwn{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:6px;background-color:#2980B9;border:none;border-radius:4px;font-size:16px;font-weight:bold;color:white;cursor:pointer}.Dialog.svelte-1jdexwn>div.svelte-1jdexwn>button.svelte-1jdexwn:disabled{opacity:0.3;cursor:auto}";
    styleInject(css_248z$i,{"insertAt":"top"});

    /* src/PasswordResetDialog.svelte generated by Svelte v3.42.1 */

    function create_fragment$i(ctx) {
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
    	let input0;
    	let t8;
    	let div4;
    	let t9;
    	let t10;
    	let input1;
    	let t11;
    	let div5;
    	let t12;
    	let t13;
    	let button;
    	let t14;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			div7 = element("div");
    			div6 = element("div");
    			div0 = element("div");
    			div0.textContent = "Password Reset";
    			t1 = space();
    			div1 = element("div");
    			div1.textContent = "×";
    			t3 = space();
    			div2 = element("div");
    			div2.textContent = "You may now define a new password.";
    			t5 = space();
    			div3 = element("div");
    			div3.textContent = "Warning: if you set a different password than before, you will loose\n      all your existing data!";
    			t7 = space();
    			input0 = element("input");
    			t8 = space();
    			div4 = element("div");
    			t9 = text(/*PasswordMessage*/ ctx[4]);
    			t10 = space();
    			input1 = element("input");
    			t11 = space();
    			div5 = element("div");
    			t12 = text(/*ConfirmationMessage*/ ctx[5]);
    			t13 = space();
    			button = element("button");
    			t14 = text("Reset Password");
    			attr(div0, "name", "Title");
    			attr(div0, "class", "svelte-1jdexwn");
    			attr(div1, "name", "CloseButton");
    			attr(div1, "class", "svelte-1jdexwn");
    			attr(div2, "class", "Block svelte-1jdexwn");
    			attr(div3, "class", "Block svelte-1jdexwn");
    			attr(input0, "type", "password");
    			attr(input0, "placeholder", "your new password");
    			attr(input0, "class", "svelte-1jdexwn");
    			attr(div4, "class", "svelte-1jdexwn");
    			toggle_class(div4, "Hint", true);
    			toggle_class(div4, "invalid", /*PasswordLooksBad*/ ctx[1]);
    			attr(input1, "type", "password");
    			attr(input1, "placeholder", "confirm your new password");
    			attr(input1, "class", "svelte-1jdexwn");
    			attr(div5, "class", "svelte-1jdexwn");
    			toggle_class(div5, "Hint", true);
    			toggle_class(div5, "invalid", /*ConfirmationLooksBad*/ ctx[3]);
    			button.disabled = /*ResetIsForbidden*/ ctx[6];
    			attr(button, "class", "svelte-1jdexwn");
    			attr(div6, "class", "svelte-1jdexwn");
    			attr(div7, "class", "Dialog svelte-1jdexwn");
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
    			append(div6, input0);
    			set_input_value(input0, /*Password*/ ctx[0]);
    			append(div6, t8);
    			append(div6, div4);
    			append(div4, t9);
    			append(div6, t10);
    			append(div6, input1);
    			set_input_value(input1, /*Confirmation*/ ctx[2]);
    			append(div6, t11);
    			append(div6, div5);
    			append(div5, t12);
    			append(div6, t13);
    			append(div6, button);
    			append(button, t14);

    			if (!mounted) {
    				dispose = [
    					listen(div1, "click", prevent_default(closeDialog$3)),
    					listen(input0, "input", /*input0_input_handler*/ ctx[8]),
    					listen(input1, "input", /*input1_input_handler*/ ctx[9]),
    					listen(button, "click", prevent_default(/*resetPassword*/ ctx[7]))
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*Password*/ 1 && input0.value !== /*Password*/ ctx[0]) {
    				set_input_value(input0, /*Password*/ ctx[0]);
    			}

    			if (dirty & /*PasswordMessage*/ 16) set_data(t9, /*PasswordMessage*/ ctx[4]);

    			if (dirty & /*PasswordLooksBad*/ 2) {
    				toggle_class(div4, "invalid", /*PasswordLooksBad*/ ctx[1]);
    			}

    			if (dirty & /*Confirmation*/ 4 && input1.value !== /*Confirmation*/ ctx[2]) {
    				set_input_value(input1, /*Confirmation*/ ctx[2]);
    			}

    			if (dirty & /*ConfirmationMessage*/ 32) set_data(t12, /*ConfirmationMessage*/ ctx[5]);

    			if (dirty & /*ConfirmationLooksBad*/ 8) {
    				toggle_class(div5, "invalid", /*ConfirmationLooksBad*/ ctx[3]);
    			}

    			if (dirty & /*ResetIsForbidden*/ 64) {
    				button.disabled = /*ResetIsForbidden*/ ctx[6];
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

    function closeDialog$3() {
    	Globals.define('State', '');
    }

    function instance$e($$self, $$props, $$invalidate) {
    	let ResetIsForbidden;
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

    	let Password, PasswordLooksBad, PasswordMessage;
    	let Confirmation, ConfirmationLooksBad, ConfirmationMessage;
    	Password = Confirmation = '';

    	function resetPassword() {
    		return __awaiter(this, void 0, void 0, function* () {
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

    	function input0_input_handler() {
    		Password = this.value;
    		$$invalidate(0, Password);
    	}

    	function input1_input_handler() {
    		Confirmation = this.value;
    		$$invalidate(2, Confirmation);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*Password*/ 1) {
    			switch (true) {
    				case Password === '':
    					$$invalidate(1, PasswordLooksBad = true);
    					$$invalidate(4, PasswordMessage = 'please, enter your password');
    					break;
    				case Password.length < 10:
    					$$invalidate(1, PasswordLooksBad = true);
    					$$invalidate(4, PasswordMessage = 'your password is too short');
    					break;
    				case !(/[0-9]/).test(Password):
    					$$invalidate(1, PasswordLooksBad = true);
    					$$invalidate(4, PasswordMessage = 'your password lacks any digits');
    					break;
    				case !(/[^a-zA-Z0-9]/).test(Password):
    					$$invalidate(1, PasswordLooksBad = true);
    					$$invalidate(4, PasswordMessage = 'your password lacks any special characters');
    					break;
    				case Password.toLowerCase() === Password:
    					$$invalidate(1, PasswordLooksBad = true);
    					$$invalidate(4, PasswordMessage = 'your password lacks any uppercase characters');
    					break;
    				case Password.toUpperCase() === Password:
    					$$invalidate(1, PasswordLooksBad = true);
    					$$invalidate(4, PasswordMessage = 'your password lacks any lowercase characters');
    					break;
    				default:
    					$$invalidate(1, PasswordLooksBad = false);
    					$$invalidate(4, PasswordMessage = 'your password looks acceptable');
    			}
    		}

    		if ($$self.$$.dirty & /*Confirmation, Password*/ 5) {
    			switch (true) {
    				case Confirmation === '':
    					$$invalidate(3, ConfirmationLooksBad = true);
    					$$invalidate(5, ConfirmationMessage = 'please, enter your new password again');
    					break;
    				case Confirmation !== Password:
    					$$invalidate(3, ConfirmationLooksBad = true);
    					$$invalidate(5, ConfirmationMessage = 'password differs from confirmation');
    					break;
    				default:
    					$$invalidate(3, ConfirmationLooksBad = false);
    					$$invalidate(5, ConfirmationMessage = 'password and confirmation are equal');
    			}
    		}

    		if ($$self.$$.dirty & /*PasswordLooksBad, ConfirmationLooksBad*/ 10) {
    			$$invalidate(6, ResetIsForbidden = PasswordLooksBad || ConfirmationLooksBad);
    		}
    	};

    	return [
    		Password,
    		PasswordLooksBad,
    		Confirmation,
    		ConfirmationLooksBad,
    		PasswordMessage,
    		ConfirmationMessage,
    		ResetIsForbidden,
    		resetPassword,
    		input0_input_handler,
    		input1_input_handler
    	];
    }

    class PasswordResetDialog extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$e, create_fragment$i, safe_not_equal, {});
    	}
    }

    var css_248z$h = ".Dialog.svelte-16jefj2.svelte-16jefj2.svelte-16jefj2{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-16jefj2>div.svelte-16jefj2.svelte-16jefj2{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-16jefj2>div.svelte-16jefj2>[name=\"Title\"].svelte-16jefj2{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}.Dialog.svelte-16jefj2>div.svelte-16jefj2>.Block.svelte-16jefj2{display:block;margin:0px 0px 10px 0px;text-align:justify}.Dialog.svelte-16jefj2>div.svelte-16jefj2>button.svelte-16jefj2{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:6px;background-color:#2980B9;border:none;border-radius:4px;font-size:16px;font-weight:bold;color:white;cursor:pointer}.Dialog.svelte-16jefj2>div.svelte-16jefj2>button.svelte-16jefj2:disabled{opacity:0.3;cursor:auto}";
    styleInject(css_248z$h,{"insertAt":"top"});

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
    				dispose = listen(button, "click", prevent_default(closeNotice$4));
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

    function closeNotice$4() {
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

    var css_248z$g = ".Dialog.svelte-cmrmc8.svelte-cmrmc8.svelte-cmrmc8{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-cmrmc8>div.svelte-cmrmc8.svelte-cmrmc8{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-cmrmc8>div.svelte-cmrmc8>[name=\"Title\"].svelte-cmrmc8{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}";
    styleInject(css_248z$g,{"insertAt":"top"});

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

    var css_248z$f = ".Dialog.svelte-ce5ist.svelte-ce5ist.svelte-ce5ist{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-ce5ist>div.svelte-ce5ist.svelte-ce5ist{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-ce5ist>div.svelte-ce5ist>[name=\"Title\"].svelte-ce5ist{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}.Dialog.svelte-ce5ist>div.svelte-ce5ist>[name=\"CloseButton\"].svelte-ce5ist{display:block;position:absolute;top:-20px;right:-20px;width:20px;height:20px;border:solid 2px white;border-radius:50%;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2), 0px 0px 0px 1px lightgray;background-color:black;padding:0px;font-size:18px;font-weight:bold;line-height:12px;text-align:center;color:white;cursor:pointer}.Dialog.svelte-ce5ist>div.svelte-ce5ist>input.svelte-ce5ist{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:4px;border:solid 1px lightgray;border-radius:2px;font-size:16px}.Dialog.svelte-ce5ist>div .Hint.svelte-ce5ist.svelte-ce5ist{display:inline-block;position:relative;left:2px;top:-2px;font-size:12px\n  }.Dialog.svelte-ce5ist>div .invalid.Hint.svelte-ce5ist.svelte-ce5ist{color:red}.Dialog.svelte-ce5ist>div.svelte-ce5ist>.Block.svelte-ce5ist{display:block;margin:0px 0px 10px 0px;text-align:justify}.Dialog.svelte-ce5ist>div.svelte-ce5ist>button.svelte-ce5ist{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:6px;background-color:#2980B9;border:none;border-radius:4px;font-size:16px;font-weight:bold;color:white;cursor:pointer}.Dialog.svelte-ce5ist>div.svelte-ce5ist>button.svelte-ce5ist:disabled{opacity:0.3;cursor:auto}";
    styleInject(css_248z$f,{"insertAt":"top"});

    /* src/ResetRequestDialog.svelte generated by Svelte v3.42.1 */

    function create_fragment$f(ctx) {
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
    	let input;
    	let t10;
    	let div5;
    	let t11;
    	let t12;
    	let button;
    	let t13;
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
    			div1.textContent = "Request Password Reset";
    			t3 = space();
    			div2 = element("div");
    			div2.textContent = "If you forgot your password, you may ask for an email containing a link\n      which will allow you to define a new password.";
    			t5 = space();
    			div3 = element("div");
    			div3.textContent = "That email will be sent immediately after submitting this request, the\n      link it contains will be valid for one hour.";
    			t7 = space();
    			div4 = element("div");
    			div4.textContent = "Warning: if you set a different password than before, you will loose\n      all your existing data!";
    			t9 = space();
    			input = element("input");
    			t10 = space();
    			div5 = element("div");
    			t11 = text(/*AddressMessage*/ ctx[2]);
    			t12 = space();
    			button = element("button");
    			t13 = text("Request Password Reset");
    			attr(div0, "name", "CloseButton");
    			attr(div0, "class", "svelte-ce5ist");
    			attr(div1, "name", "Title");
    			attr(div1, "class", "svelte-ce5ist");
    			attr(div2, "class", "Block svelte-ce5ist");
    			attr(div3, "class", "Block svelte-ce5ist");
    			attr(div4, "class", "Block svelte-ce5ist");
    			attr(input, "type", "email");
    			attr(input, "placeholder", "your email address");
    			attr(input, "class", "svelte-ce5ist");
    			attr(div5, "class", "svelte-ce5ist");
    			toggle_class(div5, "Hint", true);
    			toggle_class(div5, "invalid", /*AddressLooksBad*/ ctx[1]);
    			attr(button, "name", "SubmitButton");
    			button.disabled = /*SubmitIsForbidden*/ ctx[3];
    			attr(button, "class", "svelte-ce5ist");
    			attr(div6, "class", "svelte-ce5ist");
    			attr(div7, "class", "Dialog svelte-ce5ist");
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
    			append(div6, input);
    			set_input_value(input, /*EMailAddress*/ ctx[0]);
    			append(div6, t10);
    			append(div6, div5);
    			append(div5, t11);
    			append(div6, t12);
    			append(div6, button);
    			append(button, t13);

    			if (!mounted) {
    				dispose = [
    					listen(div0, "click", prevent_default(closeDialog$2)),
    					listen(input, "input", /*input_input_handler*/ ctx[5]),
    					listen(button, "click", prevent_default(/*submitRequest*/ ctx[4]))
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*EMailAddress*/ 1 && input.value !== /*EMailAddress*/ ctx[0]) {
    				set_input_value(input, /*EMailAddress*/ ctx[0]);
    			}

    			if (dirty & /*AddressMessage*/ 4) set_data(t11, /*AddressMessage*/ ctx[2]);

    			if (dirty & /*AddressLooksBad*/ 2) {
    				toggle_class(div5, "invalid", /*AddressLooksBad*/ ctx[1]);
    			}

    			if (dirty & /*SubmitIsForbidden*/ 8) {
    				button.disabled = /*SubmitIsForbidden*/ ctx[3];
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

    function closeDialog$2() {
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

    	function submitRequest() {
    		return __awaiter(this, void 0, void 0, function* () {
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

    var css_248z$e = ".Dialog.svelte-16jefj2.svelte-16jefj2.svelte-16jefj2{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-16jefj2>div.svelte-16jefj2.svelte-16jefj2{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-16jefj2>div.svelte-16jefj2>[name=\"Title\"].svelte-16jefj2{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}.Dialog.svelte-16jefj2>div.svelte-16jefj2>.Block.svelte-16jefj2{display:block;margin:0px 0px 10px 0px;text-align:justify}.Dialog.svelte-16jefj2>div.svelte-16jefj2>button.svelte-16jefj2{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:6px;background-color:#2980B9;border:none;border-radius:4px;font-size:16px;font-weight:bold;color:white;cursor:pointer}.Dialog.svelte-16jefj2>div.svelte-16jefj2>button.svelte-16jefj2:disabled{opacity:0.3;cursor:auto}";
    styleInject(css_248z$e,{"insertAt":"top"});

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
    				dispose = listen(button, "click", prevent_default(closeNotice$3));
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

    function closeNotice$3() {
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

    var css_248z$d = ".Dialog.svelte-cmrmc8.svelte-cmrmc8.svelte-cmrmc8{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-cmrmc8>div.svelte-cmrmc8.svelte-cmrmc8{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-cmrmc8>div.svelte-cmrmc8>[name=\"Title\"].svelte-cmrmc8{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}";
    styleInject(css_248z$d,{"insertAt":"top"});

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

    var css_248z$c = ".Dialog.svelte-16jefj2.svelte-16jefj2.svelte-16jefj2{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-16jefj2>div.svelte-16jefj2.svelte-16jefj2{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-16jefj2>div.svelte-16jefj2>[name=\"Title\"].svelte-16jefj2{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}.Dialog.svelte-16jefj2>div.svelte-16jefj2>.Block.svelte-16jefj2{display:block;margin:0px 0px 10px 0px;text-align:justify}.Dialog.svelte-16jefj2>div.svelte-16jefj2>button.svelte-16jefj2{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:6px;background-color:#2980B9;border:none;border-radius:4px;font-size:16px;font-weight:bold;color:white;cursor:pointer}.Dialog.svelte-16jefj2>div.svelte-16jefj2>button.svelte-16jefj2:disabled{opacity:0.3;cursor:auto}";
    styleInject(css_248z$c,{"insertAt":"top"});

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
    				dispose = listen(button, "click", prevent_default(closeNotice$2));
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

    function closeNotice$2() {
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

    var css_248z$b = ".Dialog.svelte-cmrmc8.svelte-cmrmc8.svelte-cmrmc8{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-cmrmc8>div.svelte-cmrmc8.svelte-cmrmc8{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-cmrmc8>div.svelte-cmrmc8>[name=\"Title\"].svelte-cmrmc8{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}";
    styleInject(css_248z$b,{"insertAt":"top"});

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

    var css_248z$a = ".Dialog.svelte-ce5ist.svelte-ce5ist.svelte-ce5ist{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-ce5ist>div.svelte-ce5ist.svelte-ce5ist{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-ce5ist>div.svelte-ce5ist>[name=\"Title\"].svelte-ce5ist{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}.Dialog.svelte-ce5ist>div.svelte-ce5ist>[name=\"CloseButton\"].svelte-ce5ist{display:block;position:absolute;top:-20px;right:-20px;width:20px;height:20px;border:solid 2px white;border-radius:50%;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2), 0px 0px 0px 1px lightgray;background-color:black;padding:0px;font-size:18px;font-weight:bold;line-height:12px;text-align:center;color:white;cursor:pointer}.Dialog.svelte-ce5ist>div.svelte-ce5ist>input.svelte-ce5ist{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:4px;border:solid 1px lightgray;border-radius:2px;font-size:16px}.Dialog.svelte-ce5ist>div .Hint.svelte-ce5ist.svelte-ce5ist{display:inline-block;position:relative;left:2px;top:-2px;font-size:12px\n  }.Dialog.svelte-ce5ist>div .invalid.Hint.svelte-ce5ist.svelte-ce5ist{color:red}.Dialog.svelte-ce5ist>div.svelte-ce5ist>.Block.svelte-ce5ist{display:block;margin:0px 0px 10px 0px;text-align:justify}.Dialog.svelte-ce5ist>div.svelte-ce5ist>button.svelte-ce5ist{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:6px;background-color:#2980B9;border:none;border-radius:4px;font-size:16px;font-weight:bold;color:white;cursor:pointer}.Dialog.svelte-ce5ist>div.svelte-ce5ist>button.svelte-ce5ist:disabled{opacity:0.3;cursor:auto}";
    styleInject(css_248z$a,{"insertAt":"top"});

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
    			div1.textContent = "Resend Confirmation Message";
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
    			t11 = text("Resend Confirmation Message");
    			attr(div0, "name", "CloseButton");
    			attr(div0, "class", "svelte-ce5ist");
    			attr(div1, "name", "Title");
    			attr(div1, "class", "svelte-ce5ist");
    			attr(div2, "class", "Block svelte-ce5ist");
    			attr(div3, "class", "Block svelte-ce5ist");
    			attr(input, "type", "email");
    			attr(input, "placeholder", "your email address");
    			attr(input, "class", "svelte-ce5ist");
    			attr(div4, "class", "svelte-ce5ist");
    			toggle_class(div4, "Hint", true);
    			toggle_class(div4, "invalid", /*AddressLooksBad*/ ctx[1]);
    			attr(button, "name", "SubmitButton");
    			button.disabled = /*SubmitIsForbidden*/ ctx[3];
    			attr(button, "class", "svelte-ce5ist");
    			attr(div5, "class", "svelte-ce5ist");
    			attr(div6, "class", "Dialog svelte-ce5ist");
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
    					listen(div0, "click", prevent_default(closeDialog$1)),
    					listen(input, "input", /*input_input_handler*/ ctx[5]),
    					listen(button, "click", prevent_default(/*submitRequest*/ ctx[4]))
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

    function closeDialog$1() {
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

    	function submitRequest() {
    		return __awaiter(this, void 0, void 0, function* () {
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

    var css_248z$9 = ".Dialog.svelte-16jefj2.svelte-16jefj2.svelte-16jefj2{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-16jefj2>div.svelte-16jefj2.svelte-16jefj2{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-16jefj2>div.svelte-16jefj2>[name=\"Title\"].svelte-16jefj2{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}.Dialog.svelte-16jefj2>div.svelte-16jefj2>.Block.svelte-16jefj2{display:block;margin:0px 0px 10px 0px;text-align:justify}.Dialog.svelte-16jefj2>div.svelte-16jefj2>button.svelte-16jefj2{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:6px;background-color:#2980B9;border:none;border-radius:4px;font-size:16px;font-weight:bold;color:white;cursor:pointer}.Dialog.svelte-16jefj2>div.svelte-16jefj2>button.svelte-16jefj2:disabled{opacity:0.3;cursor:auto}";
    styleInject(css_248z$9,{"insertAt":"top"});

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
    				dispose = listen(button, "click", prevent_default(closeNotice$1));
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

    function closeNotice$1() {
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

    var css_248z$8 = ".Dialog.svelte-16jefj2.svelte-16jefj2.svelte-16jefj2{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-16jefj2>div.svelte-16jefj2.svelte-16jefj2{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-16jefj2>div.svelte-16jefj2>[name=\"Title\"].svelte-16jefj2{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}.Dialog.svelte-16jefj2>div.svelte-16jefj2>.Block.svelte-16jefj2{display:block;margin:0px 0px 10px 0px;text-align:justify}.Dialog.svelte-16jefj2>div.svelte-16jefj2>button.svelte-16jefj2{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:6px;background-color:#2980B9;border:none;border-radius:4px;font-size:16px;font-weight:bold;color:white;cursor:pointer}.Dialog.svelte-16jefj2>div.svelte-16jefj2>button.svelte-16jefj2:disabled{opacity:0.3;cursor:auto}";
    styleInject(css_248z$8,{"insertAt":"top"});

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
    			attr(div0, "class", "svelte-16jefj2");
    			attr(div1, "class", "Block svelte-16jefj2");
    			attr(div2, "class", "Block svelte-16jefj2");
    			attr(div3, "class", "Block svelte-16jefj2");
    			attr(button, "class", "svelte-16jefj2");
    			attr(div4, "class", "svelte-16jefj2");
    			attr(div5, "class", "Dialog svelte-16jefj2");
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
    				dispose = listen(button, "click", prevent_default(closeNotice));
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

    function closeNotice() {
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

    var css_248z$7 = ".Dialog.svelte-cmrmc8.svelte-cmrmc8.svelte-cmrmc8{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-cmrmc8>div.svelte-cmrmc8.svelte-cmrmc8{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-cmrmc8>div.svelte-cmrmc8>[name=\"Title\"].svelte-cmrmc8{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}";
    styleInject(css_248z$7,{"insertAt":"top"});

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

    var css_248z$6 = ".Dialog.svelte-pvnh98.svelte-pvnh98.svelte-pvnh98{display:inline-block;flex:0 0 auto;position:relative;width:300px;height:auto;margin:0px;margin-top:-20px;border:none;border-radius:8px;padding:10px;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2);background-color:white}.Dialog.svelte-pvnh98>div.svelte-pvnh98.svelte-pvnh98{display:flex;position:relative;flex-flow:column nowrap;align-items:stretch;border:solid 2px lightgray;border-radius:4px;padding:10px}.Dialog.svelte-pvnh98>div.svelte-pvnh98>[name=\"Title\"].svelte-pvnh98{display:block;position:relative;padding:4px 0px 14px 0px;font-size:18px;font-weight:bold;text-align:center;color:#222222}.Dialog.svelte-pvnh98>div.svelte-pvnh98>[name=\"CloseButton\"].svelte-pvnh98{display:block;position:absolute;top:-20px;right:-20px;width:20px;height:20px;border:solid 2px white;border-radius:50%;box-shadow:0px 0px 5px 5px rgba(0,0,0,0.2), 0px 0px 0px 1px lightgray;background-color:black;padding:0px;font-size:18px;font-weight:bold;line-height:12px;text-align:center;color:white;cursor:pointer}.Dialog.svelte-pvnh98>div.svelte-pvnh98>.Block.svelte-pvnh98{display:block;margin:0px 0px 10px 0px;text-align:justify}.Dialog.svelte-pvnh98 a.svelte-pvnh98.svelte-pvnh98,.Dialog.svelte-pvnh98 a.svelte-pvnh98.svelte-pvnh98:visited{color:#2980B9;text-decoration:underline}.Dialog.svelte-pvnh98>div.svelte-pvnh98>input.svelte-pvnh98{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:4px;border:solid 1px lightgray;border-radius:2px;font-size:16px}.Dialog.svelte-pvnh98>div .Hint.svelte-pvnh98.svelte-pvnh98{display:inline-block;position:relative;left:2px;top:-2px;font-size:12px\n  }.Dialog.svelte-pvnh98>div .invalid.Hint.svelte-pvnh98.svelte-pvnh98{color:red}.Dialog.svelte-pvnh98>div.svelte-pvnh98>button.svelte-pvnh98{appearance:none;-webkit-appearance:none;-moz-appearance:none;-o-appearance:none;display:block;position:relative;margin:4px 0px 4px 0px;padding:6px;background-color:#2980B9;border:none;border-radius:4px;font-size:16px;font-weight:bold;color:white;cursor:pointer}.Dialog.svelte-pvnh98>div.svelte-pvnh98>button.svelte-pvnh98:disabled{opacity:0.3;cursor:auto}.Dialog.svelte-pvnh98>div.svelte-pvnh98>[name=\"LegalRow\"].svelte-pvnh98{display:block;position:relative;padding-top:10px;text-align:right}";
    styleInject(css_248z$6,{"insertAt":"top"});

    /* src/RegistrationDialog.svelte generated by Svelte v3.42.1 */

    function create_fragment$6(ctx) {
    	let div13;
    	let div12;
    	let div0;
    	let t1;
    	let div1;
    	let t3;
    	let input0;
    	let t4;
    	let div2;
    	let t5;
    	let t6;
    	let div3;
    	let t8;
    	let input1;
    	let t9;
    	let div4;
    	let t10;
    	let t11;
    	let input2;
    	let t12;
    	let div5;
    	let t13;
    	let t14;
    	let div10;
    	let div6;
    	let t15;
    	let a0;
    	let t17;
    	let input3;
    	let t18;
    	let div7;
    	let t19;
    	let t20;
    	let div8;
    	let t21;
    	let a1;
    	let t23;
    	let input4;
    	let t24;
    	let div9;
    	let t25;
    	let t26;
    	let button;
    	let t27;
    	let t28;
    	let div11;
    	let t29;
    	let a2;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			div13 = element("div");
    			div12 = element("div");
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
    			div3 = element("div");
    			div3.textContent = "Please note: GMX.de and Web.de currently need approx. 2 hours to deliver\n      confirmation messages, other providers should be much quicker.";
    			t8 = space();
    			input1 = element("input");
    			t9 = space();
    			div4 = element("div");
    			t10 = text(/*PasswordMessage*/ ctx[9]);
    			t11 = space();
    			input2 = element("input");
    			t12 = space();
    			div5 = element("div");
    			t13 = text(/*ConfirmationMessage*/ ctx[10]);
    			t14 = space();
    			div10 = element("div");
    			div6 = element("div");
    			t15 = text("Agreeing to ");
    			a0 = element("a");
    			a0.textContent = "Data Privacy Statement?";
    			t17 = space();
    			input3 = element("input");
    			t18 = space();
    			div7 = element("div");
    			t19 = text(/*DPSAgreementMessage*/ ctx[11]);
    			t20 = space();
    			div8 = element("div");
    			t21 = text("Agreeing to ");
    			a1 = element("a");
    			a1.textContent = "Terms of Service?";
    			t23 = space();
    			input4 = element("input");
    			t24 = space();
    			div9 = element("div");
    			t25 = text(/*TOSAgreementMessage*/ ctx[12]);
    			t26 = space();
    			button = element("button");
    			t27 = text("Create Account");
    			t28 = space();
    			div11 = element("div");
    			t29 = text("Already have an account? ");
    			a2 = element("a");
    			a2.textContent = "Log in!";
    			attr(div0, "name", "CloseButton");
    			attr(div0, "class", "svelte-pvnh98");
    			attr(div1, "name", "Title");
    			attr(div1, "class", "svelte-pvnh98");
    			attr(input0, "type", "email");
    			attr(input0, "placeholder", "your email address");
    			attr(input0, "class", "svelte-pvnh98");
    			attr(div2, "class", "svelte-pvnh98");
    			toggle_class(div2, "Hint", true);
    			toggle_class(div2, "invalid", /*AddressLooksBad*/ ctx[1]);
    			attr(div3, "class", "Block svelte-pvnh98");
    			attr(input1, "type", "password");
    			attr(input1, "placeholder", "your password");
    			attr(input1, "class", "svelte-pvnh98");
    			attr(div4, "class", "svelte-pvnh98");
    			toggle_class(div4, "Hint", true);
    			toggle_class(div4, "invalid", /*PasswordLooksBad*/ ctx[3]);
    			attr(input2, "type", "password");
    			attr(input2, "placeholder", "confirm your password");
    			attr(input2, "class", "svelte-pvnh98");
    			attr(div5, "class", "svelte-pvnh98");
    			toggle_class(div5, "Hint", true);
    			toggle_class(div5, "invalid", /*ConfirmationLooksBad*/ ctx[5]);
    			attr(a0, "href", "#/");
    			attr(a0, "class", "svelte-pvnh98");
    			attr(input3, "type", "checkbox");
    			attr(div7, "class", "svelte-pvnh98");
    			toggle_class(div7, "Hint", true);
    			toggle_class(div7, "invalid", !/*DPSAgreementChecked*/ ctx[6]);
    			attr(a1, "href", "https://www.appstudio.dev/app/legal/legal.php");
    			attr(a1, "class", "svelte-pvnh98");
    			attr(input4, "type", "checkbox");
    			attr(div9, "class", "svelte-pvnh98");
    			toggle_class(div9, "Hint", true);
    			toggle_class(div9, "invalid", !/*TOSAgreementChecked*/ ctx[7]);
    			attr(div10, "name", "LegalRow");
    			attr(div10, "class", "svelte-pvnh98");
    			button.disabled = /*SubmitIsForbidden*/ ctx[13];
    			attr(button, "class", "svelte-pvnh98");
    			attr(a2, "href", "#/");
    			attr(a2, "class", "svelte-pvnh98");
    			set_style(div11, "text-align", "center");
    			attr(div12, "class", "svelte-pvnh98");
    			attr(div13, "class", "Dialog svelte-pvnh98");
    		},
    		m(target, anchor) {
    			insert(target, div13, anchor);
    			append(div13, div12);
    			append(div12, div0);
    			append(div12, t1);
    			append(div12, div1);
    			append(div12, t3);
    			append(div12, input0);
    			set_input_value(input0, /*EMailAddress*/ ctx[0]);
    			append(div12, t4);
    			append(div12, div2);
    			append(div2, t5);
    			append(div12, t6);
    			append(div12, div3);
    			append(div12, t8);
    			append(div12, input1);
    			set_input_value(input1, /*Password*/ ctx[2]);
    			append(div12, t9);
    			append(div12, div4);
    			append(div4, t10);
    			append(div12, t11);
    			append(div12, input2);
    			set_input_value(input2, /*Confirmation*/ ctx[4]);
    			append(div12, t12);
    			append(div12, div5);
    			append(div5, t13);
    			append(div12, t14);
    			append(div12, div10);
    			append(div10, div6);
    			append(div6, t15);
    			append(div6, a0);
    			append(div6, t17);
    			append(div6, input3);
    			input3.checked = /*DPSAgreementChecked*/ ctx[6];
    			append(div10, t18);
    			append(div10, div7);
    			append(div7, t19);
    			append(div10, t20);
    			append(div10, div8);
    			append(div8, t21);
    			append(div8, a1);
    			append(div8, t23);
    			append(div8, input4);
    			input4.checked = /*TOSAgreementChecked*/ ctx[7];
    			append(div10, t24);
    			append(div10, div9);
    			append(div9, t25);
    			append(div12, t26);
    			append(div12, button);
    			append(button, t27);
    			append(div12, t28);
    			append(div12, div11);
    			append(div11, t29);
    			append(div11, a2);

    			if (!mounted) {
    				dispose = [
    					listen(div0, "click", prevent_default(closeDialog)),
    					listen(input0, "input", /*input0_input_handler*/ ctx[15]),
    					listen(input1, "input", /*input1_input_handler*/ ctx[16]),
    					listen(input2, "input", /*input2_input_handler*/ ctx[17]),
    					listen(a0, "click", prevent_default(showLegal$1)),
    					listen(input3, "change", /*input3_change_handler*/ ctx[18]),
    					listen(input4, "change", /*input4_change_handler*/ ctx[19]),
    					listen(button, "click", prevent_default(/*createAccount*/ ctx[14])),
    					listen(a2, "click", prevent_default(startLogin$1))
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

    			if (dirty & /*PasswordMessage*/ 512) set_data(t10, /*PasswordMessage*/ ctx[9]);

    			if (dirty & /*PasswordLooksBad*/ 8) {
    				toggle_class(div4, "invalid", /*PasswordLooksBad*/ ctx[3]);
    			}

    			if (dirty & /*Confirmation*/ 16 && input2.value !== /*Confirmation*/ ctx[4]) {
    				set_input_value(input2, /*Confirmation*/ ctx[4]);
    			}

    			if (dirty & /*ConfirmationMessage*/ 1024) set_data(t13, /*ConfirmationMessage*/ ctx[10]);

    			if (dirty & /*ConfirmationLooksBad*/ 32) {
    				toggle_class(div5, "invalid", /*ConfirmationLooksBad*/ ctx[5]);
    			}

    			if (dirty & /*DPSAgreementChecked*/ 64) {
    				input3.checked = /*DPSAgreementChecked*/ ctx[6];
    			}

    			if (dirty & /*DPSAgreementMessage*/ 2048) set_data(t19, /*DPSAgreementMessage*/ ctx[11]);

    			if (dirty & /*DPSAgreementChecked*/ 64) {
    				toggle_class(div7, "invalid", !/*DPSAgreementChecked*/ ctx[6]);
    			}

    			if (dirty & /*TOSAgreementChecked*/ 128) {
    				input4.checked = /*TOSAgreementChecked*/ ctx[7];
    			}

    			if (dirty & /*TOSAgreementMessage*/ 4096) set_data(t25, /*TOSAgreementMessage*/ ctx[12]);

    			if (dirty & /*TOSAgreementChecked*/ 128) {
    				toggle_class(div9, "invalid", !/*TOSAgreementChecked*/ ctx[7]);
    			}

    			if (dirty & /*SubmitIsForbidden*/ 8192) {
    				button.disabled = /*SubmitIsForbidden*/ ctx[13];
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div13);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function closeDialog() {
    	Globals.define('State', '');
    }

    function showLegal$1() {
    	document.location.href = '#/Legal';
    }

    function startLogin$1() {
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

    	function createAccount() {
    		return __awaiter(this, void 0, void 0, function* () {
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
    				case !(/[^a-zA-Z0-9]/).test(Password):
    					$$invalidate(3, PasswordLooksBad = true);
    					$$invalidate(9, PasswordMessage = 'your password lacks any special characters');
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

    var css_248z$5 = ".Overlay.svelte-1nu3ouw{display:flex;flex-flow:column nowrap;justify-content:center;align-items:center;position:absolute;left:0px;top:0px;width:100%;height:100%;background-color:rgb(0,0,0,0.2)}";
    styleInject(css_248z$5,{"insertAt":"top"});

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

    var css_248z$4 = ".Page.svelte-zlng69.svelte-zlng69.svelte-zlng69{display:flex;flex-flow:column nowrap;align-items:stretch;display:relative;width:100%;height:100%}.NavigationBar.svelte-zlng69.svelte-zlng69.svelte-zlng69{display:flex;flex:0 0 auto;width:100%;height:44px;border:none;border-bottom:solid 1px black;font-size:18px;font-weight:bold}.NavigationBar.svelte-zlng69 .Button.svelte-zlng69.svelte-zlng69{display:inline-block;position:absolute;top:0px;width:auto;height:44px;line-height:44px;color:#0080FF;cursor:pointer}.NavigationBar.svelte-zlng69 .left.Button.svelte-zlng69.svelte-zlng69{left:10px;text-align:left }.NavigationBar.svelte-zlng69 .right.Button.svelte-zlng69.svelte-zlng69{right:10px;text-align:right }.NavigationBar.svelte-zlng69 .Caret.svelte-zlng69.svelte-zlng69{display:inline;position:relative;top:0px;font-size:22px;font-weight:bold}.NavigationBar.svelte-zlng69 .Title.svelte-zlng69.svelte-zlng69{display:block;position:absolute;width:100%;height:44px;text-align:center;line-height:44px;pointer-events:none}.ContentArea.svelte-zlng69.svelte-zlng69.svelte-zlng69{display:block;position:relative;flex:1 1 auto;overflow:auto}.NavigationBar.svelte-zlng69 .Button[disabled=\"true\"].svelte-zlng69.svelte-zlng69{opacity:0.3 }.TabStrip.svelte-zlng69.svelte-zlng69.svelte-zlng69{display:inline-flex;position:relative;overflow:hidden;width:100%;height:52px;border:none;border-top:solid 1px black;padding:4px;font-size:16px;line-height:22px;color:#0080FF}.Tab.svelte-zlng69.svelte-zlng69.svelte-zlng69{display:inline-block;position:relative;height:100%;width:25%;text-align:center;cursor:pointer}.ContentArea.svelte-zlng69>.Placeholder.svelte-zlng69.svelte-zlng69{display:flex;flex-flow:column nowrap;justify-content:center;position:absolute;left:0px;top:0px;right:0px;bottom:0px;font-size:32px;font-weight:bold;color:rgba(0,0,0,0.1);text-align:center;pointer-events:none}.ContentArea.svelte-zlng69>.Placeholder.svelte-zlng69>span.svelte-zlng69{position:relative;top:-20px;pointer-events:none}.ContentArea.svelte-zlng69>textarea.svelte-zlng69.svelte-zlng69{width:100%;height:auto;min-height:99%;resize:none;background:transparent;border:none;outline:none;padding:4px;font-family:inherit;font-size:inherit;font-weight:normal}";
    styleInject(css_248z$4,{"insertAt":"top"});

    /* src/NotePage.svelte generated by Svelte v3.42.1 */

    function create_if_block$1(ctx) {
    	let div;

    	return {
    		c() {
    			div = element("div");
    			div.innerHTML = `<span class="svelte-zlng69">Enter your text here</span>`;
    			attr(div, "class", "Placeholder svelte-zlng69");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    		}
    	};
    }

    function create_fragment$4(ctx) {
    	let div10;
    	let div3;
    	let div0;
    	let t2;
    	let div1;
    	let t4;
    	let div2;
    	let t5;
    	let div2_disabled_value;
    	let t6;
    	let div4;
    	let t7;
    	let textarea;
    	let t8;
    	let div9;
    	let div5;
    	let t11;
    	let div6;
    	let t14;
    	let div7;
    	let t17;
    	let div8;
    	let t20;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*NoteText*/ ctx[0] === '' && create_if_block$1();
    	const default_slot_template = /*#slots*/ ctx[12].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[11], null);

    	return {
    		c() {
    			div10 = element("div");
    			div3 = element("div");
    			div0 = element("div");
    			div0.innerHTML = `<span class="Caret svelte-zlng69">⟨</span> Logout`;
    			t2 = space();
    			div1 = element("div");
    			div1.textContent = "VfB-Notes";
    			t4 = space();
    			div2 = element("div");
    			t5 = text("Refresh");
    			t6 = space();
    			div4 = element("div");
    			if (if_block) if_block.c();
    			t7 = space();
    			textarea = element("textarea");
    			t8 = space();
    			div9 = element("div");
    			div5 = element("div");
    			div5.innerHTML = `Change<br/>EMail`;
    			t11 = space();
    			div6 = element("div");
    			div6.innerHTML = `Change<br/>Password`;
    			t14 = space();
    			div7 = element("div");
    			div7.innerHTML = `Change<br/>Name`;
    			t17 = space();
    			div8 = element("div");
    			div8.innerHTML = `Delete<br/>Account`;
    			t20 = space();
    			if (default_slot) default_slot.c();
    			attr(div0, "class", "left Button svelte-zlng69");
    			attr(div1, "class", "Title svelte-zlng69");
    			attr(div2, "class", "right Button svelte-zlng69");
    			attr(div2, "disabled", div2_disabled_value = /*isSaving*/ ctx[1] || /*isRefreshing*/ ctx[2]);
    			attr(div3, "class", "NavigationBar svelte-zlng69");
    			attr(textarea, "class", "svelte-zlng69");
    			attr(div4, "class", "ContentArea svelte-zlng69");
    			set_style(div4, "background-color", "ivory");
    			attr(div5, "class", "Tab svelte-zlng69");
    			attr(div6, "class", "Tab svelte-zlng69");
    			attr(div7, "class", "Tab svelte-zlng69");
    			attr(div8, "class", "Tab svelte-zlng69");
    			attr(div9, "class", "TabStrip svelte-zlng69");
    			attr(div10, "class", "Page svelte-zlng69");
    		},
    		m(target, anchor) {
    			insert(target, div10, anchor);
    			append(div10, div3);
    			append(div3, div0);
    			append(div3, t2);
    			append(div3, div1);
    			append(div3, t4);
    			append(div3, div2);
    			append(div2, t5);
    			append(div10, t6);
    			append(div10, div4);
    			if (if_block) if_block.m(div4, null);
    			append(div4, t7);
    			append(div4, textarea);
    			/*textarea_binding*/ ctx[13](textarea);
    			set_input_value(textarea, /*NoteText*/ ctx[0]);
    			append(div10, t8);
    			append(div10, div9);
    			append(div9, div5);
    			append(div9, t11);
    			append(div9, div6);
    			append(div9, t14);
    			append(div9, div7);
    			append(div9, t17);
    			append(div9, div8);
    			append(div10, t20);

    			if (default_slot) {
    				default_slot.m(div10, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen(div0, "click", prevent_default(/*logout*/ ctx[4])),
    					listen(div2, "click", prevent_default(/*performRefresh*/ ctx[9])),
    					listen(textarea, "input", /*textarea_input_handler*/ ctx[14]),
    					listen(div5, "click", prevent_default(/*changeEMailAddress*/ ctx[5])),
    					listen(div6, "click", prevent_default(/*changePassword*/ ctx[6])),
    					listen(div7, "click", prevent_default(/*changeName*/ ctx[7])),
    					listen(div8, "click", prevent_default(/*deleteAccount*/ ctx[8]))
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (!current || dirty & /*isSaving, isRefreshing*/ 6 && div2_disabled_value !== (div2_disabled_value = /*isSaving*/ ctx[1] || /*isRefreshing*/ ctx[2])) {
    				attr(div2, "disabled", div2_disabled_value);
    			}

    			if (/*NoteText*/ ctx[0] === '') {
    				if (if_block) ; else {
    					if_block = create_if_block$1();
    					if_block.c();
    					if_block.m(div4, t7);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*NoteText*/ 1) {
    				set_input_value(textarea, /*NoteText*/ ctx[0]);
    			}

    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 2048)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[11],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[11])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[11], dirty, null),
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
    			if (detaching) detach(div10);
    			if (if_block) if_block.d();
    			/*textarea_binding*/ ctx[13](null);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let $Globals;
    	component_subscribe($$self, Globals, $$value => $$invalidate(18, $Globals = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;

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

    	function logout() {
    		performAutoSave();
    		Globals.define({ loggedIn: false, State: 'loggedOut' });
    	}

    	function changeEMailAddress() {
    		performAutoSave();
    		Globals.define('State', 'EMailAddressChange');
    	}

    	function changePassword() {
    		performAutoSave();
    		Globals.define('State', 'PasswordChange');
    	}

    	function changeName() {
    		performAutoSave();
    		Globals.define('State', 'NameChange');
    	}

    	function deleteAccount() {
    		performAutoSave();
    		Globals.define('State', 'Unregistration');
    	}

    	let DelayTimer, DelayLimitTimer;

    	function triggerAutoSave() {
    		if (DelayTimer != null) {
    			clearTimeout(DelayTimer);
    		}

    		DelayTimer = setTimeout(performAutoSave, 1000);

    		if (DelayLimitTimer == null) {
    			DelayLimitTimer = setTimeout(
    				() => {
    					if (isSaving) {
    						changedWhileSaving = true;
    					} else {
    						performAutoSave();
    					}
    				},
    				10000
    			);
    		}
    	}

    	let isSaving = false;
    	let changedWhileSaving = false;

    	function performAutoSave() {
    		return __awaiter(this, void 0, void 0, function* () {
    			if (DelayTimer == null) {
    				return;
    			}

    			if (isSaving) {
    				return;
    			}

    			clearTimeout(DelayTimer);
    			DelayTimer = undefined;
    			clearTimeout(DelayLimitTimer);
    			DelayLimitTimer = undefined;

    			if (isRefreshing) {
    				return;
    			}

    			$$invalidate(1, isSaving = true);
    			changedWhileSaving = false;

    			try {
    				yield focusOnApplication($Globals.ApplicationURL, $Globals.ApplicationId);
    				yield actOnBehalfOfCustomer($Globals.EMailAddress, $Globals.Password);
    				yield setCustomerStorageEntryTo('NoteText', encrypted(NoteText));
    			} catch(Signal) {
    				$$invalidate(1, isSaving = false);

    				switch (Signal.name) {
    					case 'LoginFailed':
    					case 'BadToken':
    						return Globals.define({ loggedIn: false, State: 'loggedOut' });
    					default:
    						return Globals.define({
    							State: 'CommunicationFailure',
    							FailureReason: Signal.toString()
    						});
    				}
    			}

    			$$invalidate(1, isSaving = false);

    			if (changedWhileSaving) {
    				performAutoSave();
    			} // for extremely slow networks
    		});
    	}

    	let isRefreshing = false;
    	let justRefreshed = false;

    	function performRefresh() {
    		return __awaiter(this, void 0, void 0, function* () {
    			if (isRefreshing) {
    				return;
    			}

    			$$invalidate(2, isRefreshing = true);

    			if (DelayTimer != null) {
    				clearTimeout(DelayTimer);
    				DelayTimer = undefined;
    			}

    			if (DelayLimitTimer != null) {
    				clearTimeout(DelayLimitTimer);
    				DelayLimitTimer = undefined;
    			}

    			try {
    				yield focusOnApplication($Globals.ApplicationURL, $Globals.ApplicationId);
    				yield actOnBehalfOfCustomer($Globals.EMailAddress, $Globals.Password);
    				let decryptedText = decrypted((yield CustomerStorageEntry('NoteText')) || '');

    				if (decryptedText == null) {
    					$$invalidate(2, isRefreshing = false);
    					return Globals.define('State', 'DecryptionFailure');
    				}

    				$$invalidate(0, NoteText = decryptedText);
    				$$invalidate(10, justRefreshed = true);
    			} catch(Signal) {
    				$$invalidate(2, isRefreshing = false);

    				switch (Signal.name) {
    					case 'LoginFailed':
    					case 'BadToken':
    						return Globals.define({ loggedIn: false, State: 'loggedOut' });
    					default:
    						return Globals.define({
    							State: 'CommunicationFailure',
    							FailureReason: Signal.toString()
    						});
    				}
    			}

    			$$invalidate(2, isRefreshing = false);
    		});
    	}

    	function encrypted(Text) {
    		// @ts-ignore $Globals.EncryptionKey *is* a Uint8Array
    		let EncryptionKey = $Globals.EncryptionKey; // after login

    		let Nonce = naclFast.exports.randomBytes(naclFast.exports.secretbox.nonceLength);
    		let encryptedValue = naclFast.exports.secretbox(new TextEncoder().encode(Text), Nonce, EncryptionKey);
    		let Result = new Uint8Array(Nonce.length + encryptedValue.length);
    		Result.set(Nonce);
    		Result.set(encryptedValue, Nonce.length);
    		return encode_1(Result); // now Base64-encoded
    	}

    	function decrypted(Base64Value) {
    		if (Base64Value === '') {
    			return '';
    		}

    		// @ts-ignore $Globals.EncryptionKey *is* a Uint8Array
    		let EncryptionKey = $Globals.EncryptionKey; // after login

    		let Buffer;

    		try {
    			Buffer = decode_1(Base64Value);
    		} catch(Signal) {
    			console.error('Base64 decode failed', Signal);
    			return undefined;
    		}

    		if (Buffer.length < naclFast.exports.secretbox.nonceLength) {
    			return undefined;
    		}

    		let Nonce = Buffer.slice(0, naclFast.exports.secretbox.nonceLength);
    		let decryptedValue = naclFast.exports.secretbox.open(Buffer.slice(naclFast.exports.secretbox.nonceLength), Nonce, EncryptionKey);

    		return decryptedValue == null
    		? undefined
    		: new TextDecoder().decode(decryptedValue);
    	}

    	let NoteText = localStorage['vfb-notes: note-text'] || '';
    	justRefreshed = true; // trick to avoid initial autosave
    	performRefresh();
    	let Editor; // bug fix for some browsers which ignore "height:auto"

    	onMount(() => {
    		$$invalidate(3, Editor.style.overflowY = 'hidden', Editor);

    		function setEditorHeight() {
    			let Height = Math.max(Editor.parentElement.clientHeight - 6, Editor.scrollHeight);
    			$$invalidate(3, Editor.style.height = Height + 'px', Editor);
    		}

    		setEditorHeight();
    		Editor.addEventListener('input', setEditorHeight);
    	});

    	function textarea_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			Editor = $$value;
    			$$invalidate(3, Editor);
    		});
    	}

    	function textarea_input_handler() {
    		NoteText = this.value;
    		$$invalidate(0, NoteText);
    	}

    	$$self.$$set = $$props => {
    		if ('$$scope' in $$props) $$invalidate(11, $$scope = $$props.$$scope);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*NoteText, justRefreshed*/ 1025) {
    			{
    				localStorage['vfb-notes: note-text'] = NoteText;

    				if (justRefreshed) {
    					$$invalidate(10, justRefreshed = false);
    				} else {
    					triggerAutoSave();
    				}
    			}
    		}
    	};

    	return [
    		NoteText,
    		isSaving,
    		isRefreshing,
    		Editor,
    		logout,
    		changeEMailAddress,
    		changePassword,
    		changeName,
    		deleteAccount,
    		performRefresh,
    		justRefreshed,
    		$$scope,
    		slots,
    		textarea_binding,
    		textarea_input_handler
    	];
    }

    class NotePage extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});
    	}
    }

    var css_248z$3 = ".Page.svelte-3cug1s.svelte-3cug1s{display:flex;flex-flow:column nowrap;align-items:stretch;display:relative;width:100%;height:100%}.NavigationBar.svelte-3cug1s.svelte-3cug1s{display:flex;flex:0 0 auto;width:100%;height:44px;border:none;border-bottom:solid 1px black;font-size:18px;font-weight:bold}.NavigationBar.svelte-3cug1s .Button.svelte-3cug1s{display:inline-block;position:absolute;top:0px;width:auto;height:44px;line-height:44px;color:#0080FF;cursor:pointer}.NavigationBar.svelte-3cug1s .left.Button.svelte-3cug1s{left:10px;text-align:left }.NavigationBar.svelte-3cug1s .right.Button.svelte-3cug1s{right:10px;text-align:right }.NavigationBar.svelte-3cug1s .Caret.svelte-3cug1s{display:inline;position:relative;top:0px;font-size:22px;font-weight:bold}.NavigationBar.svelte-3cug1s .Title.svelte-3cug1s{display:block;position:absolute;width:100%;height:44px;text-align:center;line-height:44px;pointer-events:none}.ContentArea.svelte-3cug1s.svelte-3cug1s{display:block;position:relative;flex:1 1 auto;overflow:auto}.ContentArea.svelte-3cug1s .Block.svelte-3cug1s{display:block;margin:20px;text-align:justify}.ContentArea.svelte-3cug1s .Block ul.svelte-3cug1s{margin-left:20px;padding-left:0px}.ContentArea.svelte-3cug1s .Block ul ul.svelte-3cug1s{margin-left:10px;padding-left:0px}";
    styleInject(css_248z$3,{"insertAt":"top"});

    /* src/LegalPage.svelte generated by Svelte v3.42.1 */

    function create_fragment$3(ctx) {
    	let div10;
    	let div3;
    	let div0;
    	let t2;
    	let div1;
    	let t4;
    	let div2;
    	let t5;
    	let div9;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			div10 = element("div");
    			div3 = element("div");
    			div0 = element("div");
    			div0.innerHTML = `<span class="Caret svelte-3cug1s">⟨</span> Back`;
    			t2 = space();
    			div1 = element("div");
    			div1.textContent = "VfB-Notes - Legal";
    			t4 = space();
    			div2 = element("div");
    			t5 = space();
    			div9 = element("div");

    			div9.innerHTML = `<div class="Block svelte-3cug1s">&quot;VfB-Notes&quot; is a simple application hosted at and using additional
      services offered by <a href="https://voltcloud.io/">VoltCloud.io</a>.
      As a consequence, at first, the VoltCloud
      <a href="https://www.appstudio.dev/app/legal/legal.php">Privacy Policy</a>
      and
      <a href="https://www.appstudio.dev/app/legal/legal.php">Terms of Service</a>
      apply.</div> 

    <div class="Block svelte-3cug1s"><h4>Logging</h4>

      &quot;VfB-Notes&quot; itself does not perform any logging.</div> 

    <div class="Block svelte-3cug1s"><h4>Cookies and other Data stored in a Browser</h4>

      &quot;VfB-Notes&quot; does not use cookies. It does, however, store your email
      address locally in the browser (in an area called &quot;localstorage&quot;). It will
      be kept there until explicitly deleted, but will not be accessible
      outside this browser or for web pages from other sites.</div> 

    <div class="Block svelte-3cug1s"><h4>Data Privacy</h4>

      The developer of this application has insight into

      <ul class="svelte-3cug1s"><li>your account, which was created to use this application
          (including your email address, your first and last name and whether
          your account has been confirmed or not)
          <br/> <br/> 
          <i>The developer will never use this knowledge to send you unrequested
          messages nor will he disclose that information to other parties!</i> 
          <br/> <br/></li> 
        <li>the notes you create
          <br/> <br/> 
          <i>For that reason, &quot;VfB-Notes&quot; always encrypts your notes using your
          password. Please note: your notes may become unreadable if you
          change your password using the VoltCloud &quot;password reset&quot; mechanism!</i></li></ul>

      The developer does <b>not</b> know your password, nor is he able to
      decrypt the notes you create.</div> 

    <div class="Block svelte-3cug1s"><h4>Data Removal</h4>

      As soon as you delete your account, all information about you (including
      any notes you created) will immediately become inaccessible for the
      developer - and will eventually be removed from VoltCloud in the course
      of their processes.</div>`;

    			attr(div0, "class", "left Button svelte-3cug1s");
    			attr(div1, "class", "Title svelte-3cug1s");
    			attr(div2, "class", "right Button svelte-3cug1s");
    			attr(div3, "class", "NavigationBar svelte-3cug1s");
    			attr(div9, "class", "ContentArea svelte-3cug1s");
    			attr(div10, "class", "Page svelte-3cug1s");
    		},
    		m(target, anchor) {
    			insert(target, div10, anchor);
    			append(div10, div3);
    			append(div3, div0);
    			append(div3, t2);
    			append(div3, div1);
    			append(div3, t4);
    			append(div3, div2);
    			append(div10, t5);
    			append(div10, div9);

    			if (!mounted) {
    				dispose = listen(div0, "click", prevent_default(showInfo));
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div10);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    function showInfo() {
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

    var css_248z$2 = ".Page.svelte-1a9mhjt.svelte-1a9mhjt{display:flex;flex-flow:column nowrap;align-items:stretch;display:relative;width:100%;height:100%}.NavigationBar.svelte-1a9mhjt.svelte-1a9mhjt{display:flex;flex:0 0 auto;width:100%;height:44px;border:none;border-bottom:solid 1px black;font-size:18px;font-weight:bold}.NavigationBar.svelte-1a9mhjt .Button.svelte-1a9mhjt{display:inline-block;position:absolute;top:0px;width:auto;height:44px;line-height:44px;color:#0080FF;cursor:pointer}.NavigationBar.svelte-1a9mhjt .left.Button.svelte-1a9mhjt{left:10px;text-align:left }.NavigationBar.svelte-1a9mhjt .right.Button.svelte-1a9mhjt{right:10px;text-align:right }.NavigationBar.svelte-1a9mhjt .Caret.svelte-1a9mhjt{display:inline;position:relative;top:0px;font-size:22px;font-weight:bold}.NavigationBar.svelte-1a9mhjt .Title.svelte-1a9mhjt{display:block;position:absolute;width:100%;height:44px;text-align:center;line-height:44px;pointer-events:none}.ContentArea.svelte-1a9mhjt.svelte-1a9mhjt{display:block;position:relative;flex:1 1 auto;overflow:auto}.TabStrip.svelte-1a9mhjt.svelte-1a9mhjt{display:inline-flex;position:relative;overflow:hidden;width:100%;height:52px;border:none;border-top:solid 1px black;padding:4px;font-size:16px;line-height:22px;color:#0080FF}.Tab.svelte-1a9mhjt.svelte-1a9mhjt{display:inline-block;position:relative;height:100%;width:25%;text-align:center;cursor:pointer}.ContentArea.svelte-1a9mhjt .Block.svelte-1a9mhjt{display:block;margin:20px;text-align:justify}";
    styleInject(css_248z$2,{"insertAt":"top"});

    /* src/InfoPage.svelte generated by Svelte v3.42.1 */

    function create_fragment$2(ctx) {
    	let div17;
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
    	let div16;
    	let div12;
    	let t31;
    	let div13;
    	let t34;
    	let div14;
    	let t37;
    	let div15;
    	let t40;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	return {
    		c() {
    			div17 = element("div");
    			div3 = element("div");
    			div0 = element("div");
    			div0.textContent = "Legal Info";
    			t1 = space();
    			div1 = element("div");
    			div1.textContent = "VfB-Notes";
    			t3 = space();
    			div2 = element("div");
    			div2.innerHTML = `Login <span class="Caret svelte-1a9mhjt">⟩</span>`;
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
    			div16 = element("div");
    			div12 = element("div");
    			div12.innerHTML = `Create<br/>Account`;
    			t31 = space();
    			div13 = element("div");
    			div13.innerHTML = `Resend<br/>Confirmation`;
    			t34 = space();
    			div14 = element("div");
    			div14.innerHTML = `Reset<br/>Password`;
    			t37 = space();
    			div15 = element("div");
    			div15.innerHTML = `Start<br/>Login`;
    			t40 = space();
    			if (default_slot) default_slot.c();
    			attr(div0, "class", "left Button svelte-1a9mhjt");
    			attr(div1, "class", "Title svelte-1a9mhjt");
    			attr(div2, "class", "right Button svelte-1a9mhjt");
    			attr(div3, "class", "NavigationBar svelte-1a9mhjt");
    			attr(div4, "class", "Block svelte-1a9mhjt");
    			attr(div5, "class", "Block svelte-1a9mhjt");
    			attr(div6, "class", "Block svelte-1a9mhjt");
    			attr(div7, "class", "Block svelte-1a9mhjt");
    			attr(div8, "class", "Block svelte-1a9mhjt");
    			attr(div9, "class", "Block svelte-1a9mhjt");
    			attr(a3, "href", "#/");
    			attr(a4, "href", "https://www.appstudio.dev/app/legal/legal.php");
    			attr(div10, "class", "Block svelte-1a9mhjt");
    			attr(div11, "class", "ContentArea svelte-1a9mhjt");
    			attr(div12, "class", "Tab svelte-1a9mhjt");
    			attr(div13, "class", "Tab svelte-1a9mhjt");
    			attr(div14, "class", "Tab svelte-1a9mhjt");
    			attr(div15, "class", "Tab svelte-1a9mhjt");
    			attr(div16, "class", "TabStrip svelte-1a9mhjt");
    			attr(div17, "class", "Page svelte-1a9mhjt");
    		},
    		m(target, anchor) {
    			insert(target, div17, anchor);
    			append(div17, div3);
    			append(div3, div0);
    			append(div3, t1);
    			append(div3, div1);
    			append(div3, t3);
    			append(div3, div2);
    			append(div17, t6);
    			append(div17, div11);
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
    			append(div17, t28);
    			append(div17, div16);
    			append(div16, div12);
    			append(div16, t31);
    			append(div16, div13);
    			append(div16, t34);
    			append(div16, div14);
    			append(div16, t37);
    			append(div16, div15);
    			append(div17, t40);

    			if (default_slot) {
    				default_slot.m(div17, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen(div0, "click", prevent_default(showLegal)),
    					listen(div2, "click", prevent_default(startLogin)),
    					listen(a3, "click", prevent_default(showLegal)),
    					listen(div12, "click", prevent_default(createAccount)),
    					listen(div13, "click", prevent_default(resendConfirmation)),
    					listen(div14, "click", prevent_default(resetPassword)),
    					listen(div15, "click", prevent_default(startLogin))
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
    			if (detaching) detach(div17);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function showLegal() {
    	document.location.href = '#/Legal';
    }

    function createAccount() {
    	Globals.define('State', 'Registration');
    }

    function resendConfirmation() {
    	Globals.define('State', 'RenewalRequest');
    }

    function resetPassword() {
    	Globals.define('State', 'ResetRequest');
    }

    function startLogin() {
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

    const { window: window_1 } = globals;

    function create_else_block(ctx) {
    	let infopage;
    	let current;

    	infopage = new InfoPage({
    			props: {
    				$$slots: { default: [create_default_slot_20] },
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

    			if (dirty & /*$$scope, $Globals*/ 66) {
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

    // (120:4) {#if SubPath === '#/Legal'}
    function create_if_block_19(ctx) {
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

    // (98:2) {#if $Globals.loggedIn}
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

    			if (dirty & /*$$scope, $Globals*/ 66) {
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

    // (124:8) {#if $Globals.State === 'Registration'}
    function create_if_block_40(ctx) {
    	let overlay;
    	let current;

    	overlay = new Overlay({
    			props: {
    				$$slots: { default: [create_default_slot_41] },
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

    // (124:55) <Overlay>
    function create_default_slot_41(ctx) {
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

    // (125:8) {#if $Globals.State === 'registering'}
    function create_if_block_39(ctx) {
    	let overlay;
    	let current;

    	overlay = new Overlay({
    			props: {
    				$$slots: { default: [create_default_slot_40] },
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

    // (125:55) <Overlay>
    function create_default_slot_40(ctx) {
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

    // (126:8) {#if $Globals.State === 'registered'}
    function create_if_block_38(ctx) {
    	let overlay;
    	let current;

    	overlay = new Overlay({
    			props: {
    				$$slots: { default: [create_default_slot_39] },
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

    // (126:55) <Overlay>
    function create_default_slot_39(ctx) {
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

    // (127:8) {#if $Globals.State === 'RegistrationFailed'}
    function create_if_block_37(ctx) {
    	let overlay;
    	let current;

    	overlay = new Overlay({
    			props: {
    				$$slots: { default: [create_default_slot_38] },
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

    // (127:55) <Overlay>
    function create_default_slot_38(ctx) {
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

    // (128:8) {#if $Globals.State === 'RenewalRequest'}
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

    // (128:55) <Overlay>
    function create_default_slot_37(ctx) {
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

    // (129:8) {#if $Globals.State === 'renewing'}
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

    // (129:55) <Overlay>
    function create_default_slot_36(ctx) {
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

    // (130:8) {#if $Globals.State === 'renewed'}
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

    // (130:55) <Overlay>
    function create_default_slot_35(ctx) {
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

    // (131:8) {#if $Globals.State === 'confirming'}
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

    // (131:55) <Overlay>
    function create_default_slot_34(ctx) {
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

    // (132:8) {#if $Globals.State === 'confirmed'}
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

    // (132:55) <Overlay>
    function create_default_slot_33(ctx) {
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

    // (133:8) {#if $Globals.State === 'ResetRequest'}
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

    // (133:55) <Overlay>
    function create_default_slot_32(ctx) {
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

    // (134:8) {#if $Globals.State === 'requestingReset'}
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

    // (134:55) <Overlay>
    function create_default_slot_31(ctx) {
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

    // (135:8) {#if $Globals.State === 'ResetRequested'}
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

    // (135:55) <Overlay>
    function create_default_slot_30(ctx) {
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

    // (136:8) {#if $Globals.State === 'ResetPassword'}
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

    // (136:55) <Overlay>
    function create_default_slot_29(ctx) {
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

    // (137:8) {#if $Globals.State === 'resettingPassword'}
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

    // (137:55) <Overlay>
    function create_default_slot_28(ctx) {
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

    // (138:8) {#if $Globals.State === 'PasswordReset'}
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

    // (138:55) <Overlay>
    function create_default_slot_27(ctx) {
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

    // (139:8) {#if $Globals.State === 'Login'}
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

    // (139:55) <Overlay>
    function create_default_slot_26(ctx) {
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

    // (140:8) {#if $Globals.State === 'sendingLogin'}
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

    // (140:55) <Overlay>
    function create_default_slot_25(ctx) {
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

    // (141:8) {#if $Globals.State === 'LoginFailure'}
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

    // (141:55) <Overlay>
    function create_default_slot_24(ctx) {
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

    // (142:8) {#if $Globals.State === 'loggedOut'}
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

    // (142:55) <Overlay>
    function create_default_slot_23(ctx) {
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

    // (143:8) {#if $Globals.State === 'CommunicationFailure'}
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

    // (143:55) <Overlay>
    function create_default_slot_22(ctx) {
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

    // (144:8) {#if $Globals.State === 'multipleInstances'}
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

    // (144:55) <Overlay>
    function create_default_slot_21(ctx) {
    	let multiinstancenotice;
    	let current;
    	multiinstancenotice = new MultiInstanceNotice({});

    	return {
    		c() {
    			create_component(multiinstancenotice.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(multiinstancenotice, target, anchor);
    			current = true;
    		},
    		i(local) {
    			if (current) return;
    			transition_in(multiinstancenotice.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(multiinstancenotice.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(multiinstancenotice, detaching);
    		}
    	};
    }

    // (123:6) <InfoPage>
    function create_default_slot_20(ctx) {
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
    	let t18;
    	let t19;
    	let if_block20_anchor;
    	let current;
    	let if_block0 = /*$Globals*/ ctx[1].State === 'Registration' && create_if_block_40(ctx);
    	let if_block1 = /*$Globals*/ ctx[1].State === 'registering' && create_if_block_39(ctx);
    	let if_block2 = /*$Globals*/ ctx[1].State === 'registered' && create_if_block_38(ctx);
    	let if_block3 = /*$Globals*/ ctx[1].State === 'RegistrationFailed' && create_if_block_37(ctx);
    	let if_block4 = /*$Globals*/ ctx[1].State === 'RenewalRequest' && create_if_block_36(ctx);
    	let if_block5 = /*$Globals*/ ctx[1].State === 'renewing' && create_if_block_35(ctx);
    	let if_block6 = /*$Globals*/ ctx[1].State === 'renewed' && create_if_block_34(ctx);
    	let if_block7 = /*$Globals*/ ctx[1].State === 'confirming' && create_if_block_33(ctx);
    	let if_block8 = /*$Globals*/ ctx[1].State === 'confirmed' && create_if_block_32(ctx);
    	let if_block9 = /*$Globals*/ ctx[1].State === 'ResetRequest' && create_if_block_31(ctx);
    	let if_block10 = /*$Globals*/ ctx[1].State === 'requestingReset' && create_if_block_30(ctx);
    	let if_block11 = /*$Globals*/ ctx[1].State === 'ResetRequested' && create_if_block_29(ctx);
    	let if_block12 = /*$Globals*/ ctx[1].State === 'ResetPassword' && create_if_block_28(ctx);
    	let if_block13 = /*$Globals*/ ctx[1].State === 'resettingPassword' && create_if_block_27(ctx);
    	let if_block14 = /*$Globals*/ ctx[1].State === 'PasswordReset' && create_if_block_26(ctx);
    	let if_block15 = /*$Globals*/ ctx[1].State === 'Login' && create_if_block_25(ctx);
    	let if_block16 = /*$Globals*/ ctx[1].State === 'sendingLogin' && create_if_block_24(ctx);
    	let if_block17 = /*$Globals*/ ctx[1].State === 'LoginFailure' && create_if_block_23(ctx);
    	let if_block18 = /*$Globals*/ ctx[1].State === 'loggedOut' && create_if_block_22(ctx);
    	let if_block19 = /*$Globals*/ ctx[1].State === 'CommunicationFailure' && create_if_block_21(ctx);
    	let if_block20 = /*$Globals*/ ctx[1].State === 'multipleInstances' && create_if_block_20(ctx);

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
    			t18 = space();
    			if (if_block19) if_block19.c();
    			t19 = space();
    			if (if_block20) if_block20.c();
    			if_block20_anchor = empty();
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
    			insert(target, t18, anchor);
    			if (if_block19) if_block19.m(target, anchor);
    			insert(target, t19, anchor);
    			if (if_block20) if_block20.m(target, anchor);
    			insert(target, if_block20_anchor, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			if (/*$Globals*/ ctx[1].State === 'Registration') {
    				if (if_block0) {
    					if (dirty & /*$Globals*/ 2) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_40(ctx);
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
    					if_block1 = create_if_block_39(ctx);
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
    					if_block2 = create_if_block_38(ctx);
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
    					if_block3 = create_if_block_37(ctx);
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
    					if_block4 = create_if_block_36(ctx);
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
    					if_block5 = create_if_block_35(ctx);
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
    					if_block6 = create_if_block_34(ctx);
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
    					if_block7 = create_if_block_33(ctx);
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
    					if_block8 = create_if_block_32(ctx);
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
    					if_block9 = create_if_block_31(ctx);
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
    					if_block10 = create_if_block_30(ctx);
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
    					if_block11 = create_if_block_29(ctx);
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
    					if_block12 = create_if_block_28(ctx);
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
    					if_block13 = create_if_block_27(ctx);
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
    					if_block14 = create_if_block_26(ctx);
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
    					if_block15 = create_if_block_25(ctx);
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
    					if_block16 = create_if_block_24(ctx);
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
    					if_block17 = create_if_block_23(ctx);
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

    			if (/*$Globals*/ ctx[1].State === 'loggedOut') {
    				if (if_block18) {
    					if (dirty & /*$Globals*/ 2) {
    						transition_in(if_block18, 1);
    					}
    				} else {
    					if_block18 = create_if_block_22(ctx);
    					if_block18.c();
    					transition_in(if_block18, 1);
    					if_block18.m(t18.parentNode, t18);
    				}
    			} else if (if_block18) {
    				group_outros();

    				transition_out(if_block18, 1, 1, () => {
    					if_block18 = null;
    				});

    				check_outros();
    			}

    			if (/*$Globals*/ ctx[1].State === 'CommunicationFailure') {
    				if (if_block19) {
    					if (dirty & /*$Globals*/ 2) {
    						transition_in(if_block19, 1);
    					}
    				} else {
    					if_block19 = create_if_block_21(ctx);
    					if_block19.c();
    					transition_in(if_block19, 1);
    					if_block19.m(t19.parentNode, t19);
    				}
    			} else if (if_block19) {
    				group_outros();

    				transition_out(if_block19, 1, 1, () => {
    					if_block19 = null;
    				});

    				check_outros();
    			}

    			if (/*$Globals*/ ctx[1].State === 'multipleInstances') {
    				if (if_block20) {
    					if (dirty & /*$Globals*/ 2) {
    						transition_in(if_block20, 1);
    					}
    				} else {
    					if_block20 = create_if_block_20(ctx);
    					if_block20.c();
    					transition_in(if_block20, 1);
    					if_block20.m(if_block20_anchor.parentNode, if_block20_anchor);
    				}
    			} else if (if_block20) {
    				group_outros();

    				transition_out(if_block20, 1, 1, () => {
    					if_block20 = null;
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
    			transition_in(if_block19);
    			transition_in(if_block20);
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
    			transition_out(if_block19);
    			transition_out(if_block20);
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
    			if (detaching) detach(t18);
    			if (if_block19) if_block19.d(detaching);
    			if (detaching) detach(t19);
    			if (if_block20) if_block20.d(detaching);
    			if (detaching) detach(if_block20_anchor);
    		}
    	};
    }

    // (100:6) {#if $Globals.State === 'EMailAddressChange'}
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

    // (100:59) <Overlay>
    function create_default_slot_19(ctx) {
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

    // (101:6) {#if $Globals.State === 'changingEMailAddress'}
    function create_if_block_17(ctx) {
    	let overlay;
    	let current;

    	overlay = new Overlay({
    			props: {
    				$$slots: { default: [create_default_slot_18] },
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

    // (101:59) <Overlay>
    function create_default_slot_18(ctx) {
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

    // (102:6) {#if $Globals.State === 'EMailAddressChanged'}
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

    // (102:59) <Overlay>
    function create_default_slot_17(ctx) {
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

    // (103:6) {#if $Globals.State === 'EMailAddressChangeFailure'}
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

    // (103:59) <Overlay>
    function create_default_slot_16(ctx) {
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

    // (104:6) {#if $Globals.State === 'PasswordChange'}
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

    // (104:59) <Overlay>
    function create_default_slot_15(ctx) {
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

    // (105:6) {#if $Globals.State === 'changingPassword'}
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

    // (105:59) <Overlay>
    function create_default_slot_14(ctx) {
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

    // (106:6) {#if $Globals.State === 'PasswordChanged'}
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

    // (106:59) <Overlay>
    function create_default_slot_13(ctx) {
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

    // (107:6) {#if $Globals.State === 'wrongPassword'}
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

    // (107:59) <Overlay>
    function create_default_slot_12(ctx) {
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

    // (108:6) {#if $Globals.State === 'NameChange'}
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

    // (108:59) <Overlay>
    function create_default_slot_11(ctx) {
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

    // (109:6) {#if $Globals.State === 'changingName'}
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

    // (109:59) <Overlay>
    function create_default_slot_10(ctx) {
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

    // (110:6) {#if $Globals.State === 'NameChanged'}
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

    // (110:59) <Overlay>
    function create_default_slot_9(ctx) {
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

    // (111:6) {#if $Globals.State === 'Unregistration'}
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

    // (111:59) <Overlay>
    function create_default_slot_8(ctx) {
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

    // (112:6) {#if $Globals.State === 'unregistering'}
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

    // (112:59) <Overlay>
    function create_default_slot_7(ctx) {
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

    // (113:6) {#if $Globals.State === 'unregistered'}
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

    // (113:59) <Overlay>
    function create_default_slot_6(ctx) {
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

    // (114:6) {#if $Globals.State === 'CommunicationFailure'}
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

    // (114:59) <Overlay>
    function create_default_slot_5(ctx) {
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

    // (115:6) {#if $Globals.State === 'multipleInstances'}
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

    // (115:59) <Overlay>
    function create_default_slot_4(ctx) {
    	let multiinstancenotice;
    	let current;
    	multiinstancenotice = new MultiInstanceNotice({});

    	return {
    		c() {
    			create_component(multiinstancenotice.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(multiinstancenotice, target, anchor);
    			current = true;
    		},
    		i(local) {
    			if (current) return;
    			transition_in(multiinstancenotice.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(multiinstancenotice.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(multiinstancenotice, detaching);
    		}
    	};
    }

    // (116:6) {#if $Globals.State === 'DecryptionFailure'}
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

    // (116:59) <Overlay>
    function create_default_slot_3(ctx) {
    	let decryptionfailurenotice;
    	let current;
    	decryptionfailurenotice = new DecryptionFailureNotice({});

    	return {
    		c() {
    			create_component(decryptionfailurenotice.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(decryptionfailurenotice, target, anchor);
    			current = true;
    		},
    		i(local) {
    			if (current) return;
    			transition_in(decryptionfailurenotice.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(decryptionfailurenotice.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(decryptionfailurenotice, detaching);
    		}
    	};
    }

    // (117:6) {#if $Globals.State === 'ReencryptionFailure'}
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

    // (117:59) <Overlay>
    function create_default_slot_2(ctx) {
    	let reencryptionfailurenotice;
    	let current;
    	reencryptionfailurenotice = new ReencryptionFailureNotice({});

    	return {
    		c() {
    			create_component(reencryptionfailurenotice.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(reencryptionfailurenotice, target, anchor);
    			current = true;
    		},
    		i(local) {
    			if (current) return;
    			transition_in(reencryptionfailurenotice.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(reencryptionfailurenotice.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(reencryptionfailurenotice, detaching);
    		}
    	};
    }

    // (99:4) <NotePage>
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
    	let t15;
    	let t16;
    	let if_block17_anchor;
    	let current;
    	let if_block0 = /*$Globals*/ ctx[1].State === 'EMailAddressChange' && create_if_block_18(ctx);
    	let if_block1 = /*$Globals*/ ctx[1].State === 'changingEMailAddress' && create_if_block_17(ctx);
    	let if_block2 = /*$Globals*/ ctx[1].State === 'EMailAddressChanged' && create_if_block_16(ctx);
    	let if_block3 = /*$Globals*/ ctx[1].State === 'EMailAddressChangeFailure' && create_if_block_15(ctx);
    	let if_block4 = /*$Globals*/ ctx[1].State === 'PasswordChange' && create_if_block_14(ctx);
    	let if_block5 = /*$Globals*/ ctx[1].State === 'changingPassword' && create_if_block_13(ctx);
    	let if_block6 = /*$Globals*/ ctx[1].State === 'PasswordChanged' && create_if_block_12(ctx);
    	let if_block7 = /*$Globals*/ ctx[1].State === 'wrongPassword' && create_if_block_11(ctx);
    	let if_block8 = /*$Globals*/ ctx[1].State === 'NameChange' && create_if_block_10(ctx);
    	let if_block9 = /*$Globals*/ ctx[1].State === 'changingName' && create_if_block_9(ctx);
    	let if_block10 = /*$Globals*/ ctx[1].State === 'NameChanged' && create_if_block_8(ctx);
    	let if_block11 = /*$Globals*/ ctx[1].State === 'Unregistration' && create_if_block_7(ctx);
    	let if_block12 = /*$Globals*/ ctx[1].State === 'unregistering' && create_if_block_6(ctx);
    	let if_block13 = /*$Globals*/ ctx[1].State === 'unregistered' && create_if_block_5(ctx);
    	let if_block14 = /*$Globals*/ ctx[1].State === 'CommunicationFailure' && create_if_block_4(ctx);
    	let if_block15 = /*$Globals*/ ctx[1].State === 'multipleInstances' && create_if_block_3(ctx);
    	let if_block16 = /*$Globals*/ ctx[1].State === 'DecryptionFailure' && create_if_block_2(ctx);
    	let if_block17 = /*$Globals*/ ctx[1].State === 'ReencryptionFailure' && create_if_block_1(ctx);

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
    			if_block17_anchor = empty();
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
    			insert(target, if_block17_anchor, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			if (/*$Globals*/ ctx[1].State === 'EMailAddressChange') {
    				if (if_block0) {
    					if (dirty & /*$Globals*/ 2) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_18(ctx);
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
    					if_block1 = create_if_block_17(ctx);
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
    					if_block2 = create_if_block_16(ctx);
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
    					if_block3 = create_if_block_15(ctx);
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
    					if_block4 = create_if_block_14(ctx);
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
    					if_block5 = create_if_block_13(ctx);
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
    					if_block6 = create_if_block_12(ctx);
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
    					if_block7 = create_if_block_11(ctx);
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
    					if_block8 = create_if_block_10(ctx);
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
    					if_block9 = create_if_block_9(ctx);
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
    					if_block10 = create_if_block_8(ctx);
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

    			if (/*$Globals*/ ctx[1].State === 'Unregistration') {
    				if (if_block11) {
    					if (dirty & /*$Globals*/ 2) {
    						transition_in(if_block11, 1);
    					}
    				} else {
    					if_block11 = create_if_block_7(ctx);
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

    			if (/*$Globals*/ ctx[1].State === 'unregistering') {
    				if (if_block12) {
    					if (dirty & /*$Globals*/ 2) {
    						transition_in(if_block12, 1);
    					}
    				} else {
    					if_block12 = create_if_block_6(ctx);
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

    			if (/*$Globals*/ ctx[1].State === 'unregistered') {
    				if (if_block13) {
    					if (dirty & /*$Globals*/ 2) {
    						transition_in(if_block13, 1);
    					}
    				} else {
    					if_block13 = create_if_block_5(ctx);
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

    			if (/*$Globals*/ ctx[1].State === 'CommunicationFailure') {
    				if (if_block14) {
    					if (dirty & /*$Globals*/ 2) {
    						transition_in(if_block14, 1);
    					}
    				} else {
    					if_block14 = create_if_block_4(ctx);
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

    			if (/*$Globals*/ ctx[1].State === 'multipleInstances') {
    				if (if_block15) {
    					if (dirty & /*$Globals*/ 2) {
    						transition_in(if_block15, 1);
    					}
    				} else {
    					if_block15 = create_if_block_3(ctx);
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

    			if (/*$Globals*/ ctx[1].State === 'DecryptionFailure') {
    				if (if_block16) {
    					if (dirty & /*$Globals*/ 2) {
    						transition_in(if_block16, 1);
    					}
    				} else {
    					if_block16 = create_if_block_2(ctx);
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

    			if (/*$Globals*/ ctx[1].State === 'ReencryptionFailure') {
    				if (if_block17) {
    					if (dirty & /*$Globals*/ 2) {
    						transition_in(if_block17, 1);
    					}
    				} else {
    					if_block17 = create_if_block_1(ctx);
    					if_block17.c();
    					transition_in(if_block17, 1);
    					if_block17.m(if_block17_anchor.parentNode, if_block17_anchor);
    				}
    			} else if (if_block17) {
    				group_outros();

    				transition_out(if_block17, 1, 1, () => {
    					if_block17 = null;
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
    			if (detaching) detach(if_block17_anchor);
    		}
    	};
    }

    // (97:0) <ApplicationCell>
    function create_default_slot(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block, create_if_block_19, create_else_block];
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
    	let mounted;
    	let dispose;

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

    			if (!mounted) {
    				dispose = listen(window_1, "storage", /*storage_handler*/ ctx[2]);
    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			const applicationcell_changes = {};

    			if (dirty & /*$$scope, $Globals, SubPath*/ 67) {
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
    			mounted = false;
    			dispose();
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	let $Globals;
    	component_subscribe($$self, Globals, $$value => $$invalidate(1, $Globals = $$value));

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

    	let completeURL = document.location.href;

    	switch (true) {
    		case completeURL.indexOf('/#/confirm/') > 0:
    			Globals.define({
    				ConfirmationToken: completeURL.replace(/^.*\/\#\/confirm\//, ''),
    				State: 'confirming'
    			});
    			confirmAccount();
    			break;
    		case completeURL.indexOf('/#/reset/') > 0:
    			Globals.define({
    				ResetToken: completeURL.replace(/^.*\/\#\/reset\//, ''),
    				State: 'ResetPassword'
    			});
    	}

    	function confirmAccount() {
    		return __awaiter(this, void 0, void 0, function* () {
    			try {
    				yield focusOnApplication($Globals.ApplicationURL, $Globals.ApplicationId);
    				yield confirmCustomerUsing($Globals.ConfirmationToken);
    			} catch(Signal) {
    				Globals.define({
    					State: 'CommunicationFailure',
    					FailureReason: Signal.toString()
    				});

    				return;
    			}

    			Globals.define({
    				ConfirmationToken: '',
    				State: 'confirmed'
    			});
    		});
    	}

    	let SubPath = document.location.hash;

    	window.addEventListener('hashchange', () => {
    		$$invalidate(0, SubPath = document.location.hash);
    	});

    	const storage_handler = () => Globals.define('State', 'multipleInstances');
    	return [SubPath, $Globals, storage_handler];
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
