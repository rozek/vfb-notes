
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
                update(component.$$);
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
    function update($$) {
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
    			attr(div, "class", "ApplicationCell svelte-5a84km");
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

    function create_fragment(ctx) {
    	let applicationcell;
    	let current;
    	applicationcell = new ApplicationCell({});

    	return {
    		c() {
    			create_component(applicationcell.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(applicationcell, target, anchor);
    			current = true;
    		},
    		p: noop,
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

    function instance($$self) {
    	return [];
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
