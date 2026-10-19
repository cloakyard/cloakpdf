/* Air overlay study. Generated; see OVERLAY_LICENSES.txt. */
//#region \0rolldown/runtime.js
var e = Object.create, t = Object.defineProperty, n = Object.getOwnPropertyDescriptor, r = Object.getOwnPropertyNames, i = Object.getPrototypeOf, a = Object.prototype.hasOwnProperty, o = (e, t) => () => (t || (e((t = { exports: {} }).exports, t), e = null), t.exports), s = (e, i, o, s) => {
	if (i && typeof i == "object" || typeof i == "function") for (var c = r(i), l = 0, u = c.length, d; l < u; l++) d = c[l], !a.call(e, d) && d !== o && t(e, d, {
		get: ((e) => i[e]).bind(null, d),
		enumerable: !(s = n(i, d)) || s.enumerable
	});
	return e;
}, c = (n, r, o) => (o = n == null ? {} : e(i(n)), s(r || !n || !n.__esModule || !a.call(n, "default") ? t(o, "default", {
	value: n,
	enumerable: !0
}) : o, n)), l = /* @__PURE__ */ o(((e) => {
	var t = Symbol.for("react.transitional.element"), n = Symbol.for("react.portal"), r = Symbol.for("react.fragment"), i = Symbol.for("react.strict_mode"), a = Symbol.for("react.profiler"), o = Symbol.for("react.consumer"), s = Symbol.for("react.context"), c = Symbol.for("react.forward_ref"), l = Symbol.for("react.suspense"), u = Symbol.for("react.memo"), d = Symbol.for("react.lazy"), f = Symbol.for("react.activity"), p = Symbol.for("react.view_transition"), m = Symbol.iterator;
	function h(e) {
		return typeof e != "object" || !e ? null : (e = m && e[m] || e["@@iterator"], typeof e == "function" ? e : null);
	}
	var g = {
		isMounted: function() {
			return !1;
		},
		enqueueForceUpdate: function() {},
		enqueueReplaceState: function() {},
		enqueueSetState: function() {}
	}, _ = Object.assign, v = {};
	function y(e, t, n) {
		this.props = e, this.context = t, this.refs = v, this.updater = n || g;
	}
	y.prototype.isReactComponent = {}, y.prototype.setState = function(e, t) {
		if (typeof e != "object" && typeof e != "function" && e != null) throw Error("takes an object of state variables to update or a function which returns an object of state variables.");
		this.updater.enqueueSetState(this, e, t, "setState");
	}, y.prototype.forceUpdate = function(e) {
		this.updater.enqueueForceUpdate(this, e, "forceUpdate");
	};
	function b() {}
	b.prototype = y.prototype;
	function x(e, t, n) {
		this.props = e, this.context = t, this.refs = v, this.updater = n || g;
	}
	var S = x.prototype = new b();
	S.constructor = x, _(S, y.prototype), S.isPureReactComponent = !0;
	var C = Array.isArray;
	function w() {}
	var T = {
		H: null,
		A: null,
		T: null,
		S: null
	}, E = Object.prototype.hasOwnProperty;
	function D(e, n, r) {
		var i = r.ref;
		return {
			$$typeof: t,
			type: e,
			key: n,
			ref: i === void 0 ? null : i,
			props: r
		};
	}
	function O(e, t) {
		return D(e.type, t, e.props);
	}
	function k(e) {
		return typeof e == "object" && !!e && e.$$typeof === t;
	}
	function A(e) {
		var t = {
			"=": "=0",
			":": "=2"
		};
		return "$" + e.replace(/[=:]/g, function(e) {
			return t[e];
		});
	}
	var j = /\/+/g;
	function M(e, t) {
		return typeof e == "object" && e && e.key != null ? A("" + e.key) : t.toString(36);
	}
	function ee(e) {
		switch (e.status) {
			case "fulfilled": return e.value;
			case "rejected": throw e.reason;
			default: switch (typeof e.status == "string" ? e.then(w, w) : (e.status = "pending", e.then(function(t) {
				e.status === "pending" && (e.status = "fulfilled", e.value = t);
			}, function(t) {
				e.status === "pending" && (e.status = "rejected", e.reason = t);
			})), e.status) {
				case "fulfilled": return e.value;
				case "rejected": throw e.reason;
			}
		}
		throw e;
	}
	function N(e, r, i, a, o) {
		var s = typeof e;
		(s === "undefined" || s === "boolean") && (e = null);
		var c = !1;
		if (e === null) c = !0;
		else switch (s) {
			case "bigint":
			case "string":
			case "number":
				c = !0;
				break;
			case "object": switch (e.$$typeof) {
				case t:
				case n:
					c = !0;
					break;
				case d: return c = e._init, N(c(e._payload), r, i, a, o);
			}
		}
		if (c) return o = o(e), c = a === "" ? "." + M(e, 0) : a, C(o) ? (i = "", c != null && (i = c.replace(j, "$&/") + "/"), N(o, r, i, "", function(e) {
			return e;
		})) : o != null && (k(o) && (o = O(o, i + (o.key == null || e && e.key === o.key ? "" : ("" + o.key).replace(j, "$&/") + "/") + c)), r.push(o)), 1;
		c = 0;
		var l = a === "" ? "." : a + ":";
		if (C(e)) for (var u = 0; u < e.length; u++) a = e[u], s = l + M(a, u), c += N(a, r, i, s, o);
		else if (u = h(e), typeof u == "function") for (e = u.call(e), u = 0; !(a = e.next()).done;) a = a.value, s = l + M(a, u++), c += N(a, r, i, s, o);
		else if (s === "object") {
			if (typeof e.then == "function") return N(ee(e), r, i, a, o);
			throw r = String(e), Error("Objects are not valid as a React child (found: " + (r === "[object Object]" ? "object with keys {" + Object.keys(e).join(", ") + "}" : r) + "). If you meant to render a collection of children, use an array instead.");
		}
		return c;
	}
	function P(e, t, n) {
		if (e == null) return e;
		var r = [], i = 0;
		return N(e, r, "", "", function(e) {
			return t.call(n, e, i++);
		}), r;
	}
	function F(e) {
		if (e._status === -1) {
			var t = e._result, n = t();
			n.then(function(t) {
				(e._status === 0 || e._status === -1) && (e._status = 1, e._result = t, n.status === void 0 && (n.status = "fulfilled", n.value = t));
			}, function(t) {
				(e._status === 0 || e._status === -1) && (e._status = 2, e._result = t, n.status === void 0 && (n.status = "rejected", n.reason = t));
			}), e._status === -1 && (e._status = 0, e._result = n);
		}
		if (e._status === 1) return e._result.default;
		throw e._result;
	}
	var I = typeof reportError == "function" ? reportError : function(e) {
		if (typeof window == "object" && typeof window.ErrorEvent == "function") {
			var t = new window.ErrorEvent("error", {
				bubbles: !0,
				cancelable: !0,
				message: typeof e == "object" && e && typeof e.message == "string" ? String(e.message) : String(e),
				error: e
			});
			if (!window.dispatchEvent(t)) return;
		} else if (typeof process == "object" && typeof process.emit == "function") {
			process.emit("uncaughtException", e);
			return;
		}
		console.error(e);
	};
	function L(e) {
		var t = T.T, n = {};
		n.types = t === null ? null : t.types, T.T = n;
		try {
			var r = e(), i = T.S;
			i !== null && i(n, r), typeof r == "object" && r && typeof r.then == "function" && r.then(w, I);
		} catch (e) {
			I(e);
		} finally {
			t !== null && n.types !== null && (t.types = n.types), T.T = t;
		}
	}
	function te(e) {
		var t = T.T;
		if (t !== null) {
			var n = t.types;
			n === null ? t.types = [e] : n.indexOf(e) === -1 && n.push(e);
		} else L(te.bind(null, e));
	}
	var R = {
		map: P,
		forEach: function(e, t, n) {
			P(e, function() {
				t.apply(this, arguments);
			}, n);
		},
		count: function(e) {
			var t = 0;
			return P(e, function() {
				t++;
			}), t;
		},
		toArray: function(e) {
			return P(e, function(e) {
				return e;
			}) || [];
		},
		only: function(e) {
			if (!k(e)) throw Error("React.Children.only expected to receive a single React element child.");
			return e;
		}
	};
	e.Activity = f, e.Children = R, e.Component = y, e.Fragment = r, e.Profiler = a, e.PureComponent = x, e.StrictMode = i, e.Suspense = l, e.ViewTransition = p, e.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = T, e.__COMPILER_RUNTIME = {
		__proto__: null,
		c: function(e) {
			return T.H.useMemoCache(e);
		}
	}, e.addTransitionType = te, e.cache = function(e) {
		return function() {
			return e.apply(null, arguments);
		};
	}, e.cacheSignal = function() {
		return null;
	}, e.cloneElement = function(e, t, n) {
		if (e == null) throw Error("The argument must be a React element, but you passed " + e + ".");
		var r = _({}, e.props), i = e.key;
		if (t != null) for (a in t.key !== void 0 && (i = "" + t.key), t) !E.call(t, a) || a === "key" || a === "__self" || a === "__source" || a === "ref" && t.ref === void 0 || (r[a] = t[a]);
		var a = arguments.length - 2;
		if (a === 1) r.children = n;
		else if (1 < a) {
			for (var o = Array(a), s = 0; s < a; s++) o[s] = arguments[s + 2];
			r.children = o;
		}
		return D(e.type, i, r);
	}, e.createContext = function(e) {
		return e = {
			$$typeof: s,
			_currentValue: e,
			_currentValue2: e,
			_threadCount: 0,
			Provider: null,
			Consumer: null
		}, e.Provider = e, e.Consumer = {
			$$typeof: o,
			_context: e
		}, e;
	}, e.createElement = function(e, t, n) {
		var r, i = {}, a = null;
		if (t != null) for (r in t.key !== void 0 && (a = "" + t.key), t) E.call(t, r) && r !== "key" && r !== "__self" && r !== "__source" && (i[r] = t[r]);
		var o = arguments.length - 2;
		if (o === 1) i.children = n;
		else if (1 < o) {
			for (var s = Array(o), c = 0; c < o; c++) s[c] = arguments[c + 2];
			i.children = s;
		}
		if (e && e.defaultProps) for (r in o = e.defaultProps, o) i[r] === void 0 && (i[r] = o[r]);
		return D(e, a, i);
	}, e.createRef = function() {
		return { current: null };
	}, e.forwardRef = function(e) {
		return {
			$$typeof: c,
			render: e
		};
	}, e.isValidElement = k, e.lazy = function(e) {
		return {
			$$typeof: d,
			_payload: {
				_status: -1,
				_result: e
			},
			_init: F
		};
	}, e.memo = function(e, t) {
		return {
			$$typeof: u,
			type: e,
			compare: t === void 0 ? null : t
		};
	}, e.startTransition = L, e.unstable_useCacheRefresh = function() {
		return T.H.useCacheRefresh();
	}, e.use = function(e) {
		return T.H.use(e);
	}, e.useActionState = function(e, t, n) {
		return T.H.useActionState(e, t, n);
	}, e.useCallback = function(e, t) {
		return T.H.useCallback(e, t);
	}, e.useContext = function(e) {
		return T.H.useContext(e);
	}, e.useDebugValue = function() {}, e.useDeferredValue = function(e, t) {
		return T.H.useDeferredValue(e, t);
	}, e.useEffect = function(e, t) {
		return T.H.useEffect(e, t);
	}, e.useEffectEvent = function(e) {
		return T.H.useEffectEvent(e);
	}, e.useId = function() {
		return T.H.useId();
	}, e.useImperativeHandle = function(e, t, n) {
		return T.H.useImperativeHandle(e, t, n);
	}, e.useInsertionEffect = function(e, t) {
		return T.H.useInsertionEffect(e, t);
	}, e.useLayoutEffect = function(e, t) {
		return T.H.useLayoutEffect(e, t);
	}, e.useMemo = function(e, t) {
		return T.H.useMemo(e, t);
	}, e.useOptimistic = function(e, t) {
		return T.H.useOptimistic(e, t);
	}, e.useReducer = function(e, t, n) {
		return T.H.useReducer(e, t, n);
	}, e.useRef = function(e) {
		return T.H.useRef(e);
	}, e.useState = function(e) {
		return T.H.useState(e);
	}, e.useSyncExternalStore = function(e, t, n) {
		return T.H.useSyncExternalStore(e, t, n);
	}, e.useTransition = function() {
		return T.H.useTransition();
	}, e.version = "19.3.0";
})), u = /* @__PURE__ */ o(((e, t) => {
	t.exports = l();
})), d = /* @__PURE__ */ o(((e) => {
	function t(e, t) {
		var n = e.length;
		e.push(t);
		a: for (; 0 < n;) {
			var r = n - 1 >>> 1, a = e[r];
			if (0 < i(a, t)) e[r] = t, e[n] = a, n = r;
			else break a;
		}
	}
	function n(e) {
		return e.length === 0 ? null : e[0];
	}
	function r(e) {
		if (e.length === 0) return null;
		var t = e[0], n = e.pop();
		if (n !== t) {
			e[0] = n;
			a: for (var r = 0, a = e.length, o = a >>> 1; r < o;) {
				var s = 2 * (r + 1) - 1, c = e[s], l = s + 1, u = e[l];
				if (0 > i(c, n)) l < a && 0 > i(u, c) ? (e[r] = u, e[l] = n, r = l) : (e[r] = c, e[s] = n, r = s);
				else if (l < a && 0 > i(u, n)) e[r] = u, e[l] = n, r = l;
				else break a;
			}
		}
		return t;
	}
	function i(e, t) {
		var n = e.sortIndex - t.sortIndex;
		return n === 0 ? e.id - t.id : n;
	}
	if (e.unstable_now = void 0, typeof performance == "object" && typeof performance.now == "function") {
		var a = performance;
		e.unstable_now = function() {
			return a.now();
		};
	} else {
		var o = Date, s = o.now();
		e.unstable_now = function() {
			return o.now() - s;
		};
	}
	var c = [], l = [], u = 1, d = null, f = 3, p = !1, m = !1, h = !1, g = !1, _ = typeof setTimeout == "function" ? setTimeout : null, v = typeof clearTimeout == "function" ? clearTimeout : null, y = typeof setImmediate < "u" ? setImmediate : null;
	function b(e) {
		for (var i = n(l); i !== null;) {
			if (i.callback === null) r(l);
			else if (i.startTime <= e) r(l), i.sortIndex = i.expirationTime, t(c, i);
			else break;
			i = n(l);
		}
	}
	function x(e) {
		if (h = !1, b(e), !m) {
			if (n(c) !== null) m = !0, S || (S = !0, O());
			else {
				var t = n(l);
				t !== null && j(x, t.startTime - e);
			}
		}
	}
	var S = !1, C = -1, w = 5, T = -1;
	function E() {
		return g ? !0 : !(e.unstable_now() - T < w);
	}
	function D() {
		if (g = !1, S) {
			var t = e.unstable_now();
			T = t;
			var i = !0;
			try {
				a: {
					m = !1, h && (h = !1, v(C), C = -1), p = !0;
					var a = f;
					try {
						b: {
							for (b(t), d = n(c); d !== null && !(d.expirationTime > t && E());) {
								var o = d.callback;
								if (typeof o == "function") {
									d.callback = null, f = d.priorityLevel;
									var s = o(d.expirationTime <= t);
									if (t = e.unstable_now(), typeof s == "function") {
										d.callback = s, b(t), i = !0;
										break b;
									}
									d === n(c) && r(c), b(t);
								} else r(c);
								d = n(c);
							}
							if (d !== null) i = !0;
							else {
								var u = n(l);
								u !== null && j(x, u.startTime - t), i = !1;
							}
						}
						break a;
					} finally {
						d = null, f = a, p = !1;
					}
					i = void 0;
				}
			} finally {
				i ? O() : S = !1;
			}
		}
	}
	var O;
	if (typeof y == "function") O = function() {
		y(D);
	};
	else if (typeof MessageChannel < "u") {
		var k = new MessageChannel(), A = k.port2;
		k.port1.onmessage = D, O = function() {
			A.postMessage(null);
		};
	} else O = function() {
		_(D, 0);
	};
	function j(t, n) {
		C = _(function() {
			t(e.unstable_now());
		}, n);
	}
	e.unstable_IdlePriority = 5, e.unstable_ImmediatePriority = 1, e.unstable_LowPriority = 4, e.unstable_NormalPriority = 3, e.unstable_Profiling = null, e.unstable_UserBlockingPriority = 2, e.unstable_cancelCallback = function(e) {
		e.callback = null;
	}, e.unstable_forceFrameRate = function(e) {
		0 > e || 125 < e ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported") : w = 0 < e ? Math.floor(1e3 / e) : 5;
	}, e.unstable_getCurrentPriorityLevel = function() {
		return f;
	}, e.unstable_next = function(e) {
		switch (f) {
			case 1:
			case 2:
			case 3:
				var t = 3;
				break;
			default: t = f;
		}
		var n = f;
		f = t;
		try {
			return e();
		} finally {
			f = n;
		}
	}, e.unstable_requestPaint = function() {
		g = !0;
	}, e.unstable_runWithPriority = function(e, t) {
		switch (e) {
			case 1:
			case 2:
			case 3:
			case 4:
			case 5: break;
			default: e = 3;
		}
		var n = f;
		f = e;
		try {
			return t();
		} finally {
			f = n;
		}
	}, e.unstable_scheduleCallback = function(r, i, a) {
		var o = e.unstable_now();
		switch (typeof a == "object" && a ? (a = a.delay, a = typeof a == "number" && 0 < a ? o + a : o) : a = o, r) {
			case 1:
				var s = -1;
				break;
			case 2:
				s = 250;
				break;
			case 5:
				s = 1073741823;
				break;
			case 4:
				s = 1e4;
				break;
			default: s = 5e3;
		}
		return s = a + s, r = {
			id: u++,
			callback: i,
			priorityLevel: r,
			startTime: a,
			expirationTime: s,
			sortIndex: -1
		}, a > o ? (r.sortIndex = a, t(l, r), n(c) === null && r === n(l) && (h ? (v(C), C = -1) : h = !0, j(x, a - o))) : (r.sortIndex = s, t(c, r), m || p || (m = !0, S || (S = !0, O()))), r;
	}, e.unstable_shouldYield = E, e.unstable_wrapCallback = function(e) {
		var t = f;
		return function() {
			var n = f;
			f = t;
			try {
				return e.apply(this, arguments);
			} finally {
				f = n;
			}
		};
	};
})), f = /* @__PURE__ */ o(((e, t) => {
	t.exports = d();
})), p = /* @__PURE__ */ o(((e) => {
	var t = u();
	function n(e) {
		var t = "https://react.dev/errors/" + e;
		if (1 < arguments.length) {
			t += "?args[]=" + encodeURIComponent(arguments[1]);
			for (var n = 2; n < arguments.length; n++) t += "&args[]=" + encodeURIComponent(arguments[n]);
		}
		return "Minified React error #" + e + "; visit " + t + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
	}
	function r() {}
	var i = {
		d: {
			f: r,
			r: function() {
				throw Error(n(522));
			},
			D: r,
			C: r,
			L: r,
			m: r,
			X: r,
			S: r,
			M: r
		},
		p: 0,
		findDOMNode: null
	}, a = Symbol.for("react.portal"), o = Symbol.for("react.recoverable"), s = Symbol.for("react.optimistic_key");
	function c(e, t, n) {
		var r = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
		return {
			$$typeof: a,
			key: r == null ? null : r === s ? s : "" + r,
			children: e,
			containerInfo: t,
			implementation: n
		};
	}
	var l = t.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
	function d(e, t) {
		if (e === "font") return "";
		if (typeof t == "string") return t === "use-credentials" ? t : "";
	}
	e.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = i, e.browser = function(e) {
		return {
			$$typeof: o,
			_reason: e
		};
	}, e.createPortal = function(e, t) {
		var r = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
		if (!t || t.nodeType !== 1 && t.nodeType !== 9 && t.nodeType !== 11) throw Error(n(299));
		return c(e, t, null, r);
	}, e.flushSync = function(e) {
		var t = l.T, n = i.p;
		try {
			if (l.T = null, i.p = 2, e) return e();
		} finally {
			l.T = t, i.p = n, i.d.f();
		}
	}, e.preconnect = function(e, t) {
		typeof e == "string" && (t ? (t = t.crossOrigin, t = typeof t == "string" ? t === "use-credentials" ? t : "" : void 0) : t = null, i.d.C(e, t));
	}, e.prefetchDNS = function(e) {
		typeof e == "string" && i.d.D(e);
	}, e.preinit = function(e, t) {
		if (typeof e == "string" && t && typeof t.as == "string") {
			var n = t.as, r = d(n, t.crossOrigin), a = typeof t.integrity == "string" ? t.integrity : void 0, o = typeof t.fetchPriority == "string" ? t.fetchPriority : void 0;
			n === "style" ? i.d.S(e, typeof t.precedence == "string" ? t.precedence : void 0, {
				crossOrigin: r,
				integrity: a,
				fetchPriority: o
			}) : n === "script" && i.d.X(e, {
				crossOrigin: r,
				integrity: a,
				fetchPriority: o,
				nonce: typeof t.nonce == "string" ? t.nonce : void 0
			});
		}
	}, e.preinitModule = function(e, t) {
		if (typeof e == "string") {
			if (typeof t == "object" && t) {
				if (t.as == null || t.as === "script") {
					var n = d(t.as, t.crossOrigin);
					i.d.M(e, {
						crossOrigin: n,
						integrity: typeof t.integrity == "string" ? t.integrity : void 0,
						nonce: typeof t.nonce == "string" ? t.nonce : void 0,
						fetchPriority: typeof t.fetchPriority == "string" ? t.fetchPriority : void 0
					});
				}
			} else t ?? i.d.M(e);
		}
	}, e.preload = function(e, t) {
		if (typeof e == "string" && typeof t == "object" && t && typeof t.as == "string") {
			var n = t.as, r = d(n, t.crossOrigin);
			i.d.L(e, n, {
				crossOrigin: r,
				integrity: typeof t.integrity == "string" ? t.integrity : void 0,
				nonce: typeof t.nonce == "string" ? t.nonce : void 0,
				type: typeof t.type == "string" ? t.type : void 0,
				fetchPriority: typeof t.fetchPriority == "string" ? t.fetchPriority : void 0,
				referrerPolicy: typeof t.referrerPolicy == "string" ? t.referrerPolicy : void 0,
				imageSrcSet: typeof t.imageSrcSet == "string" ? t.imageSrcSet : void 0,
				imageSizes: typeof t.imageSizes == "string" ? t.imageSizes : void 0,
				media: typeof t.media == "string" ? t.media : void 0
			});
		}
	}, e.preloadModule = function(e, t) {
		if (typeof e == "string") {
			if (t) {
				var n = d(t.as, t.crossOrigin);
				i.d.m(e, {
					as: typeof t.as == "string" && t.as !== "script" ? t.as : void 0,
					crossOrigin: n,
					integrity: typeof t.integrity == "string" ? t.integrity : void 0,
					nonce: typeof t.nonce == "string" ? t.nonce : void 0,
					fetchPriority: typeof t.fetchPriority == "string" ? t.fetchPriority : void 0
				});
			} else i.d.m(e);
		}
	}, e.requestFormReset = function(e) {
		i.d.r(e);
	}, e.unstable_batchedUpdates = function(e, t) {
		return e(t);
	}, e.useFormState = function(e, t, n) {
		return l.H.useFormState(e, t, n);
	}, e.useFormStatus = function() {
		return l.H.useHostTransitionStatus();
	}, e.version = "19.3.0";
})), m = /* @__PURE__ */ o(((e, t) => {
	function n() {
		if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE == "function") try {
			__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(n);
		} catch (e) {
			console.error(e);
		}
	}
	n(), t.exports = p();
})), h = /* @__PURE__ */ o(((e) => {
	var t = f(), n = u(), r = m();
	function i(e) {
		var t = "https://react.dev/errors/" + e;
		if (1 < arguments.length) {
			t += "?args[]=" + encodeURIComponent(arguments[1]);
			for (var n = 2; n < arguments.length; n++) t += "&args[]=" + encodeURIComponent(arguments[n]);
		}
		return "Minified React error #" + e + "; visit " + t + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
	}
	function a(e) {
		return !(!e || e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11);
	}
	function o(e) {
		for (var t = e, n = t; n && !n.alternate;) t = n, t.flags & 4098 && (e = t.return), n = t.return;
		for (; t.return;) t = t.return;
		return t.tag === 3 ? e : null;
	}
	function s(e) {
		if (e.tag === 13) {
			var t = e.memoizedState;
			if (t === null && (e = e.alternate, e !== null && (t = e.memoizedState)), t !== null) return t.dehydrated;
		}
		return null;
	}
	function c(e) {
		if (e.tag === 31) {
			var t = e.memoizedState;
			if (t === null && (e = e.alternate, e !== null && (t = e.memoizedState)), t !== null) return t.dehydrated;
		}
		return null;
	}
	function l(e) {
		if (o(e) !== e) throw Error(i(188));
	}
	function d(e) {
		var t = e.alternate;
		if (!t) {
			if (t = o(e), t === null) throw Error(i(188));
			return t === e ? e : null;
		}
		for (var n = e, r = t;;) {
			var a = n.return;
			if (a === null) break;
			var s = a.alternate;
			if (s === null) {
				if (r = a.return, r !== null) {
					n = r;
					continue;
				}
				break;
			}
			if (a.child === s.child) {
				for (s = a.child; s;) {
					if (s === n) return l(a), e;
					if (s === r) return l(a), t;
					s = s.sibling;
				}
				throw Error(i(188));
			}
			if (n.return !== r.return) n = a, r = s;
			else {
				for (var c = !1, u = a.child; u;) {
					if (u === n) {
						c = !0, n = a, r = s;
						break;
					}
					if (u === r) {
						c = !0, r = a, n = s;
						break;
					}
					u = u.sibling;
				}
				if (!c) {
					for (u = s.child; u;) {
						if (u === n) {
							c = !0, n = s, r = a;
							break;
						}
						if (u === r) {
							c = !0, r = s, n = a;
							break;
						}
						u = u.sibling;
					}
					if (!c) throw Error(i(189));
				}
			}
			if (n.alternate !== r) throw Error(i(190));
		}
		if (n.tag !== 3) throw Error(i(188));
		return n.stateNode.current === n ? e : t;
	}
	function p(e) {
		var t = e.tag;
		if (t === 5 || t === 26 || t === 27 || t === 6) return e;
		for (e = e.child; e !== null;) {
			if (t = p(e), t !== null) return t;
			e = e.sibling;
		}
		return null;
	}
	function h(e, t, n, r, i, a) {
		for (; e !== null;) {
			if ((e.tag === 5 || e.tag === 27 || e.tag === 6) && n(e, r, i, a) || (e.tag !== 22 || e.memoizedState === null) && (t || e.tag !== 5 && e.tag !== 27) && h(e.child, t, n, r, i, a)) return !0;
			e = e.sibling;
		}
		return !1;
	}
	function g(e) {
		for (e = e.return; e !== null;) {
			if (e.tag === 3 || e.tag === 5 || e.tag === 27) return e;
			e = e.return;
		}
		return null;
	}
	function _(e) {
		var t = !1;
		for (e = e.return; e !== null && (e.tag === 4 && (t = !0), e.tag !== 3 && e.tag !== 5 && e.tag !== 27);) e = e.return;
		return t;
	}
	function v(e) {
		var t = [null, null], n = g(e);
		return n === null || y(t, e, n.child, { foundSelf: !1 }), t;
	}
	function y(e, t, n, r) {
		for (; n !== null;) {
			if (n === t) r.foundSelf = !0;
			else if (n.tag === 5 || n.tag === 27 || n.tag === 6) {
				if (r.foundSelf) return e[1] = n, !0;
				e[0] = n;
			} else if ((n.tag !== 22 || n.memoizedState === null) && y(e, t, n.child, r)) return !0;
			n = n.sibling;
		}
		return !1;
	}
	function b(e) {
		switch (e.tag) {
			case 5:
			case 27:
			case 6: return e.stateNode;
			case 3: return e.stateNode.containerInfo;
			default: throw Error(i(559));
		}
	}
	var x = null, S = null;
	function C(e, t, n) {
		return e === n || e === t && (x = e, !0);
	}
	function w(e, t, n) {
		return e === n ? (S = e, !1) : e === t && (S !== null && (x = e), !0);
	}
	function T(e) {
		if (e === null) return null;
		do
			e = e === null ? null : e.return;
		while (e && e.tag !== 5 && e.tag !== 27 && e.tag !== 3);
		return e || null;
	}
	function E(e, t, n) {
		for (var r = 0, i = e; i; i = n(i)) r++;
		i = 0;
		for (var a = t; a; a = n(a)) i++;
		for (; 0 < r - i;) e = n(e), r--;
		for (; 0 < i - r;) t = n(t), i--;
		for (; r--;) {
			if (e === t || t !== null && e === t.alternate) return e;
			e = n(e), t = n(t);
		}
		return null;
	}
	var D = Object.assign, O = Symbol.for("react.element"), k = Symbol.for("react.transitional.element"), A = Symbol.for("react.portal"), j = Symbol.for("react.fragment"), M = Symbol.for("react.strict_mode"), ee = Symbol.for("react.profiler"), N = Symbol.for("react.consumer"), P = Symbol.for("react.context"), F = Symbol.for("react.forward_ref"), I = Symbol.for("react.suspense"), L = Symbol.for("react.suspense_list"), te = Symbol.for("react.memo"), R = Symbol.for("react.lazy"), ne = Symbol.for("react.activity"), re = Symbol.for("react.legacy_hidden"), z = Symbol.for("react.memo_cache_sentinel"), B = Symbol.for("react.view_transition"), ie = Symbol.for("react.recoverable"), ae = Symbol.iterator;
	function oe(e) {
		return typeof e != "object" || !e ? null : (e = ae && e[ae] || e["@@iterator"], typeof e == "function" ? e : null);
	}
	var se = Symbol.for("react.client.reference");
	function ce(e) {
		if (e == null) return null;
		if (typeof e == "function") return e.$$typeof === se ? null : e.displayName || e.name || null;
		if (typeof e == "string") return e;
		switch (e) {
			case j: return "Fragment";
			case ee: return "Profiler";
			case M: return "StrictMode";
			case I: return "Suspense";
			case L: return "SuspenseList";
			case ne: return "Activity";
			case B: return "ViewTransition";
		}
		if (typeof e == "object") switch (e.$$typeof) {
			case A: return "Portal";
			case P: return e.displayName || "Context";
			case N: return (e._context.displayName || "Context") + ".Consumer";
			case F:
				var t = e.render;
				return e = e.displayName, e ||= (e = t.displayName || t.name || "", e === "" ? "ForwardRef" : "ForwardRef(" + e + ")"), e;
			case te: return t = e.displayName || null, t === null ? ce(e.type) || "Memo" : t;
			case R:
				t = e._payload, e = e._init;
				try {
					return ce(e(t));
				} catch {}
		}
		return null;
	}
	var V = Array.isArray, H = n.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, U = r.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, le = {
		pending: !1,
		data: null,
		method: null,
		action: null
	}, ue = [], de = -1;
	function fe(e) {
		return { current: e };
	}
	function W(e) {
		0 > de || (e.current = ue[de], ue[de] = null, de--);
	}
	function G(e, t) {
		de++, ue[de] = e.current, e.current = t;
	}
	var pe = fe(null), K = fe(null), me = fe(null), he = fe(null);
	function ge(e, t) {
		switch (G(me, t), G(K, e), G(pe, null), t.nodeType) {
			case 9:
			case 11:
				e = (e = t.documentElement) && (e = e.namespaceURI) ? up(e) : 0;
				break;
			default: if (e = t.tagName, t = t.namespaceURI) t = up(t), e = dp(t, e);
			else switch (e) {
				case "svg":
					e = 1;
					break;
				case "math":
					e = 2;
					break;
				default: e = 0;
			}
		}
		W(pe), G(pe, e);
	}
	function _e() {
		W(pe), W(K), W(me);
	}
	function ve(e) {
		var t = e.memoizedState;
		t !== null && (sh._currentValue = t.memoizedState, G(he, e)), t = pe.current;
		var n = dp(t, e.type);
		t !== n && (G(K, e), G(pe, n));
	}
	function ye(e) {
		K.current === e && (W(pe), W(K)), he.current === e && (W(he), sh._currentValue = le);
	}
	var be, xe;
	function Se(e) {
		if (be === void 0) try {
			throw Error();
		} catch (e) {
			var t = e.stack.trim().match(/\n( *(at )?)/);
			be = t && t[1] || "", xe = -1 < e.stack.indexOf("\n    at") ? " (<anonymous>)" : -1 < e.stack.indexOf("@") ? "@unknown:0:0" : "";
		}
		return "\n" + be + e + xe;
	}
	var Ce = !1;
	function we(e, t) {
		if (!e || Ce) return "";
		Ce = !0;
		var n = Error.prepareStackTrace;
		Error.prepareStackTrace = void 0;
		try {
			var r = { DetermineComponentFrameRoot: function() {
				try {
					if (t) {
						var n = function() {
							throw Error();
						};
						if (Object.defineProperty(n.prototype, "props", { set: function() {
							throw Error();
						} }), typeof Reflect == "object" && Reflect.construct) {
							try {
								Reflect.construct(n, []);
							} catch (e) {
								var r = e;
							}
							Reflect.construct(e, [], n);
						} else {
							try {
								n.call();
							} catch (e) {
								r = e;
							}
							n = !1;
							try {
								var i = Object.getOwnPropertyDescriptor(e.prototype, "props");
								Object.defineProperty(e.prototype, "props", {
									configurable: !0,
									set: function() {
										throw Error();
									}
								}), n = !0, new e();
							} finally {
								n && (i === void 0 ? delete e.prototype.props : Object.defineProperty(e.prototype, "props", i));
							}
						}
					} else {
						try {
							throw Error();
						} catch (e) {
							r = e;
						}
						(n = e()) && typeof n.catch == "function" && n.catch(function() {});
					}
				} catch (e) {
					if (e && r && typeof e.stack == "string") return [e.stack, r.stack];
				}
				return [null, null];
			} };
			r.DetermineComponentFrameRoot.displayName = "DetermineComponentFrameRoot";
			var i = Object.getOwnPropertyDescriptor(r.DetermineComponentFrameRoot, "name");
			i && i.configurable && Object.defineProperty(r.DetermineComponentFrameRoot, "name", { value: "DetermineComponentFrameRoot" });
			var a = r.DetermineComponentFrameRoot(), o = a[0], s = a[1];
			if (o && s) {
				var c = o.split("\n"), l = s.split("\n");
				for (i = r = 0; r < c.length && !c[r].includes("DetermineComponentFrameRoot");) r++;
				for (; i < l.length && !l[i].includes("DetermineComponentFrameRoot");) i++;
				if (r === c.length || i === l.length) for (r = c.length - 1, i = l.length - 1; 1 <= r && 0 <= i && c[r] !== l[i];) i--;
				for (; 1 <= r && 0 <= i; r--, i--) if (c[r] !== l[i]) {
					if (r !== 1 || i !== 1) do
						if (r--, i--, 0 > i || c[r] !== l[i]) {
							var u = "\n" + c[r].replace(" at new ", " at ");
							return e.displayName && u.includes("<anonymous>") && (u = u.replace("<anonymous>", e.displayName)), u;
						}
					while (1 <= r && 0 <= i);
					break;
				}
			}
		} finally {
			Ce = !1, Error.prepareStackTrace = n;
		}
		return (n = e ? e.displayName || e.name : "") ? Se(n) : "";
	}
	function Te(e, t) {
		switch (e.tag) {
			case 26:
			case 27:
			case 5: return Se(e.type);
			case 16: return Se("Lazy");
			case 13: return e.child !== t && t !== null ? Se("Suspense Fallback") : Se("Suspense");
			case 19: return Se("SuspenseList");
			case 0:
			case 15: return we(e.type, !1);
			case 11: return we(e.type.render, !1);
			case 1: return we(e.type, !0);
			case 31: return Se("Activity");
			case 30: return Se("ViewTransition");
			default: return "";
		}
	}
	function Ee(e) {
		try {
			var t = "", n = null;
			do
				t += Te(e, n), n = e, e = e.return;
			while (e);
			return t;
		} catch (e) {
			return "\nError generating stack: " + e.message + "\n" + e.stack;
		}
	}
	var De = Object.prototype.hasOwnProperty, Oe = t.unstable_scheduleCallback, ke = t.unstable_cancelCallback, Ae = t.unstable_shouldYield, je = t.unstable_requestPaint, Me = t.unstable_now, Ne = t.unstable_getCurrentPriorityLevel, q = t.unstable_ImmediatePriority, Pe = t.unstable_UserBlockingPriority, Fe = t.unstable_NormalPriority, Ie = t.unstable_LowPriority, Le = t.unstable_IdlePriority, Re = t.log, ze = t.unstable_setDisableYieldValue, Be = null, Ve = null;
	function He(e) {
		if (typeof Re == "function" && ze(e), Ve && typeof Ve.setStrictMode == "function") try {
			Ve.setStrictMode(Be, e);
		} catch {}
	}
	var Ue = Math.clz32 ? Math.clz32 : Ke, We = Math.log, Ge = Math.LN2;
	function Ke(e) {
		return e >>>= 0, e === 0 ? 32 : 31 - (We(e) / Ge | 0) | 0;
	}
	var qe = 256, Je = 262144, Ye = 4194304;
	function Xe(e) {
		var t = e & 42;
		if (t !== 0) return t;
		switch (e & -e) {
			case 1: return 1;
			case 2: return 2;
			case 4: return 4;
			case 8: return 8;
			case 16: return 16;
			case 32: return 32;
			case 64: return 64;
			case 128: return 128;
			case 256:
			case 512:
			case 1024:
			case 2048:
			case 4096:
			case 8192:
			case 16384:
			case 32768:
			case 65536:
			case 131072: return e & -e;
			case 262144:
			case 524288:
			case 1048576:
			case 2097152: return e & 3932160;
			case 4194304:
			case 8388608:
			case 16777216:
			case 33554432: return e & 62914560;
			case 67108864: return 67108864;
			case 134217728: return 134217728;
			case 268435456: return 268435456;
			case 536870912: return 536870912;
			case 1073741824: return 0;
			default: return e;
		}
	}
	function Ze(e, t, n) {
		var r = e.pendingLanes;
		if (r === 0) return 0;
		var i = 0, a = e.suspendedLanes, o = e.pingedLanes;
		e = e.warmLanes;
		var s = r & 134217727;
		return s === 0 ? (s = r & ~a, s === 0 ? o === 0 ? n || (n = r & ~e, n !== 0 && (i = Xe(n))) : i = Xe(o) : i = Xe(s)) : (r = s & ~a, r === 0 ? (o &= s, o === 0 ? n || (n = s & ~e, n !== 0 && (i = Xe(n))) : i = Xe(o)) : i = Xe(r)), i === 0 ? 0 : t !== 0 && t !== i && (t & a) === 0 && (a = i & -i, n = t & -t, a >= n || a === 32 && n & 4194048) ? t : i;
	}
	function Qe(e, t) {
		return (e.pendingLanes & ~(e.suspendedLanes & ~e.pingedLanes) & t) === 0;
	}
	function $e(e, t) {
		t & 8 && (t |= t & 32);
		var n = e.entangledLanes;
		if (n !== 0) for (e = e.entanglements, n &= t; 0 < n;) {
			var r = 31 - Ue(n), i = 1 << r;
			t |= e[r], n &= ~i;
		}
		return t;
	}
	function et(e, t) {
		switch (e) {
			case 1:
			case 2:
			case 4:
			case 8:
			case 64: return t + 250;
			case 16:
			case 32:
			case 128:
			case 256:
			case 512:
			case 1024:
			case 2048:
			case 4096:
			case 8192:
			case 16384:
			case 32768:
			case 65536:
			case 131072:
			case 262144:
			case 524288:
			case 1048576:
			case 2097152: return t + 5e3;
			case 4194304:
			case 8388608:
			case 16777216:
			case 33554432: return -1;
			case 67108864:
			case 134217728:
			case 268435456:
			case 536870912:
			case 1073741824: return -1;
			default: return -1;
		}
	}
	function tt() {
		var e = Ye;
		return Ye <<= 1, !(Ye & 62914560) && (Ye = 4194304), e;
	}
	function nt(e) {
		for (var t = [], n = 0; 31 > n; n++) t.push(e);
		return t;
	}
	function rt(e, t) {
		e.pendingLanes |= t, t !== 268435456 && (e.suspendedLanes = 0, e.pingedLanes = 0, e.warmLanes = 0);
	}
	function it(e, t, n, r, i, a) {
		var o = e.pendingLanes;
		e.pendingLanes = n, e.suspendedLanes = 0, e.pingedLanes = 0, e.warmLanes = 0, e.expiredLanes &= n, e.entangledLanes &= n, e.errorRecoveryDisabledLanes &= n, e.shellSuspendCounter = 0;
		var s = e.entanglements, c = e.expirationTimes, l = e.hiddenUpdates;
		for (n = o & ~n; 0 < n;) {
			var u = 31 - Ue(n), d = 1 << u;
			s[u] = 0, c[u] = -1;
			var f = l[u];
			if (f !== null) for (l[u] = null, u = 0; u < f.length; u++) {
				var p = f[u];
				p !== null && (p.lane &= -536870913);
			}
			n &= ~d;
		}
		r !== 0 && at(e, r, 0), a !== 0 && i === 0 && e.tag !== 0 && (e.suspendedLanes |= a & ~(o & ~t));
	}
	function at(e, t, n) {
		e.pendingLanes |= t, e.suspendedLanes &= ~t;
		var r = 31 - Ue(t);
		e.entangledLanes |= t, e.entanglements[r] = e.entanglements[r] | 1073741824 | n & 261930;
	}
	function ot(e, t) {
		var n = e.entangledLanes |= t;
		for (e = e.entanglements; n;) {
			var r = 31 - Ue(n), i = 1 << r;
			i & t | e[r] & t && (e[r] |= t), n &= ~i;
		}
	}
	function st(e, t) {
		var n = t & -t;
		return n = n & 42 ? 1 : ct(n), (n & (e.suspendedLanes | t)) === 0 ? n : 0;
	}
	function ct(e) {
		switch (e) {
			case 2:
				e = 1;
				break;
			case 8:
				e = 4;
				break;
			case 32:
				e = 16;
				break;
			case 256:
			case 512:
			case 1024:
			case 2048:
			case 4096:
			case 8192:
			case 16384:
			case 32768:
			case 65536:
			case 131072:
			case 262144:
			case 524288:
			case 1048576:
			case 2097152:
			case 4194304:
			case 8388608:
			case 16777216:
			case 33554432:
				e = 128;
				break;
			case 268435456:
				e = 134217728;
				break;
			default: e = 0;
		}
		return e;
	}
	function lt(e) {
		return e &= -e, 2 < e ? 8 < e ? e & 134217727 ? 32 : 268435456 : 8 : 2;
	}
	function ut() {
		var e = U.p;
		return e === 0 ? (e = window.event, e === void 0 ? 32 : Ch(e.type)) : e;
	}
	function dt(e, t) {
		var n = U.p;
		try {
			return U.p = e, t();
		} finally {
			U.p = n;
		}
	}
	var ft = Math.random().toString(36).slice(2), pt = "__reactFiber$" + ft, mt = "__reactProps$" + ft, ht = "__reactContainer$" + ft, gt = "__reactEvents$" + ft, _t = "__reactListeners$" + ft, vt = "__reactHandles$" + ft, yt = "__reactResources$" + ft, bt = "__reactMarker$" + ft, J = "__reactLoad$" + ft;
	function xt(e) {
		delete e[pt], delete e[mt], delete e[_t], delete e[vt];
	}
	function St(e) {
		var t;
		if (t = e[pt]) return t;
		for (var n = e.parentNode; n;) {
			if (t = n[ht] || n[pt]) {
				if (n = t.alternate, t.child !== null || n !== null && n.child !== null) for (e = fm(e); e !== null;) {
					if (n = e[pt]) return n;
					e = fm(e);
				}
				return t;
			}
			e = n, n = e.parentNode;
		}
		return null;
	}
	function Ct(e) {
		if (e = e[pt] || e[ht]) {
			var t = e.tag;
			if (t === 5 || t === 6 || t === 13 || t === 31 || t === 26 || t === 27 || t === 3) return e;
		}
		return null;
	}
	function wt(e) {
		var t = e.tag;
		if (t === 5 || t === 26 || t === 27 || t === 6) return e.stateNode;
		throw Error(i(33));
	}
	function Tt(e) {
		var t = e[yt];
		return t ||= e[yt] = {
			hoistableStyles: /* @__PURE__ */ new Map(),
			hoistableScripts: /* @__PURE__ */ new Map()
		}, t;
	}
	function Et(e) {
		e[bt] = !0;
	}
	function Dt(e) {
		e[J] = void 0;
	}
	var Ot = /* @__PURE__ */ new Set(), kt = {};
	function At(e, t) {
		jt(e, t), jt(e + "Capture", t);
	}
	function jt(e, t) {
		for (kt[e] = t, e = 0; e < t.length; e++) Ot.add(t[e]);
	}
	var Mt = RegExp("^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"), Nt = {}, Pt = {};
	function Ft(e) {
		return De.call(Pt, e) ? !0 : De.call(Nt, e) ? !1 : Mt.test(e) ? Pt[e] = !0 : (Nt[e] = !0, !1);
	}
	var It = !1;
	function Lt() {
		var e = It;
		return It = !1, e;
	}
	function Rt(e, t, n) {
		if (Ft(t)) {
			if (n === null) e.removeAttribute(t);
			else {
				switch (typeof n) {
					case "undefined":
					case "function":
					case "symbol":
						e.removeAttribute(t);
						return;
					case "boolean":
						var r = t.toLowerCase().slice(0, 5);
						if (r !== "data-" && r !== "aria-") {
							e.removeAttribute(t);
							return;
						}
				}
				e.setAttribute(t, n);
			}
		}
	}
	function Y(e, t, n) {
		if (n === null) e.removeAttribute(t);
		else {
			switch (typeof n) {
				case "undefined":
				case "function":
				case "symbol":
				case "boolean":
					e.removeAttribute(t);
					return;
			}
			e.setAttribute(t, n);
		}
	}
	function zt(e, t, n, r) {
		if (r === null) e.removeAttribute(n);
		else {
			switch (typeof r) {
				case "undefined":
				case "function":
				case "symbol":
				case "boolean":
					e.removeAttribute(n);
					return;
			}
			e.setAttributeNS(t, n, r);
		}
	}
	function Bt(e) {
		switch (typeof e) {
			case "bigint":
			case "boolean":
			case "number":
			case "string":
			case "undefined": return e;
			case "object": return e;
			default: return "";
		}
	}
	function Vt(e) {
		var t = e.type;
		return (e = e.nodeName) && e.toLowerCase() === "input" && (t === "checkbox" || t === "radio");
	}
	function Ht(e, t, n) {
		var r = Object.getOwnPropertyDescriptor(e.constructor.prototype, t);
		if (!e.hasOwnProperty(t) && r !== void 0 && typeof r.get == "function" && typeof r.set == "function") {
			var i = r.get, a = r.set;
			return Object.defineProperty(e, t, {
				configurable: !0,
				get: function() {
					return i.call(this);
				},
				set: function(e) {
					n = "" + e, a.call(this, e);
				}
			}), Object.defineProperty(e, t, { enumerable: r.enumerable }), {
				getValue: function() {
					return n;
				},
				setValue: function(e) {
					n = "" + e;
				},
				stopTracking: function() {
					e._valueTracker = null, delete e[t];
				}
			};
		}
	}
	function X(e) {
		if (!e._valueTracker) {
			var t = Vt(e) ? "checked" : "value";
			e._valueTracker = Ht(e, t, "" + e[t]);
		}
	}
	function Ut(e) {
		if (!e) return !1;
		var t = e._valueTracker;
		if (!t) return !0;
		var n = t.getValue(), r = "";
		return e && (r = Vt(e) ? e.checked ? "true" : "false" : e.value), e = r, e !== n && (t.setValue(e), !0);
	}
	var Wt = /[\n"\\]/g;
	function Gt(e) {
		return e.replace(Wt, function(e) {
			return "\\" + e.charCodeAt(0).toString(16) + " ";
		});
	}
	function Kt(e, t, n, r, i, a, o, s) {
		e.name = "", o != null && typeof o != "function" && typeof o != "symbol" && typeof o != "boolean" ? e.type = o : e.removeAttribute("type"), t == null ? o !== "submit" && o !== "reset" || e.removeAttribute("value") : o === "number" ? (t === 0 && e.value === "" || e.value != t) && (e.value = "" + Bt(t)) : e.value !== "" + Bt(t) && (e.value = "" + Bt(t)), t == null ? n == null ? r != null && e.removeAttribute("value") : Jt(e, Bt(n)) : o === "number" && e.value == t ? Jt(e, Bt(e.value)) : Jt(e, Bt(t)), i == null && a != null && (e.defaultChecked = !!a), i != null && (e.checked = i && typeof i != "function" && typeof i != "symbol"), s != null && typeof s != "function" && typeof s != "symbol" && typeof s != "boolean" ? e.name = "" + Bt(s) : e.removeAttribute("name");
	}
	function qt(e, t, n, r, i, a, o, s) {
		if (a != null && typeof a != "function" && typeof a != "symbol" && typeof a != "boolean" && (e.type = a), t != null || n != null) {
			if (!(a !== "submit" && a !== "reset" || t != null)) {
				X(e);
				return;
			}
			n = n == null ? "" : "" + Bt(n), t = t == null ? n : "" + Bt(t), s || t === e.value || (e.value = t), e.defaultValue = t;
		}
		r ??= i, r = typeof r != "function" && typeof r != "symbol" && !!r, e.checked = s ? e.checked : !!r, e.defaultChecked = !!r, o != null && typeof o != "function" && typeof o != "symbol" && typeof o != "boolean" && (e.name = o), X(e);
	}
	function Jt(e, t) {
		e.defaultValue !== "" + t && (e.defaultValue = "" + t);
	}
	function Yt(e, t, n, r) {
		if (e = e.options, t) {
			t = {};
			for (var i = 0; i < n.length; i++) t["$" + n[i]] = !0;
			for (n = 0; n < e.length; n++) i = t.hasOwnProperty("$" + e[n].value), e[n].selected !== i && (e[n].selected = i), i && r && (e[n].defaultSelected = !0);
		} else {
			for (n = "" + Bt(n), t = null, i = 0; i < e.length; i++) {
				if (e[i].value === n) {
					e[i].selected = !0, r && (e[i].defaultSelected = !0);
					return;
				}
				t !== null || e[i].disabled || (t = e[i]);
			}
			t !== null && (t.selected = !0);
		}
	}
	function Xt(e, t, n) {
		if (t != null && (t = "" + Bt(t), t !== e.value && (e.value = t), n == null)) {
			e.defaultValue !== t && (e.defaultValue = t);
			return;
		}
		e.defaultValue = n == null ? "" : "" + Bt(n);
	}
	function Zt(e, t, n, r) {
		if (t == null) {
			if (r != null) {
				if (n != null) throw Error(i(92));
				if (V(r)) {
					if (1 < r.length) throw Error(i(93));
					r = r[0];
				}
				n = r;
			}
			n ??= "", t = n;
		}
		n = Bt(t), e.defaultValue = n, r = e.textContent, r === n && r !== "" && r !== null && (e.value = r), X(e);
	}
	function Qt(e, t) {
		if (t) {
			var n = e.firstChild;
			if (n && n === e.lastChild && n.nodeType === 3) {
				n.nodeValue = t;
				return;
			}
		}
		e.textContent = t;
	}
	var $t = new Set("animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(" "));
	function en(e, t, n) {
		var r = t.indexOf("--") === 0;
		n == null || typeof n == "boolean" || n === "" ? r ? e.setProperty(t, "") : t === "float" ? e.cssFloat = "" : e[t] = "" : r ? e.setProperty(t, n) : typeof n != "number" || n === 0 || $t.has(t) ? t === "float" ? e.cssFloat = n : e[t] = ("" + n).trim() : e[t] = n + "px";
	}
	function Z(e, t, n) {
		if (t != null && typeof t != "object") throw Error(i(62));
		if (e = e.style, n != null) {
			for (var r in n) !n.hasOwnProperty(r) || t != null && t.hasOwnProperty(r) || (r.indexOf("--") === 0 ? e.setProperty(r, "") : r === "float" ? e.cssFloat = "" : e[r] = "", It = !0);
			for (var a in t) r = t[a], t.hasOwnProperty(a) && n[a] !== r && (en(e, a, r), It = !0);
		} else for (var o in t) t.hasOwnProperty(o) && en(e, o, t[o]);
	}
	function tn(e) {
		if (e.indexOf("-") === -1) return !1;
		switch (e) {
			case "annotation-xml":
			case "color-profile":
			case "font-face":
			case "font-face-src":
			case "font-face-uri":
			case "font-face-format":
			case "font-face-name":
			case "missing-glyph": return !1;
			default: return !0;
		}
	}
	var nn = /* @__PURE__ */ new Map([
		["acceptCharset", "accept-charset"],
		["htmlFor", "for"],
		["httpEquiv", "http-equiv"],
		["crossOrigin", "crossorigin"],
		["accentHeight", "accent-height"],
		["alignmentBaseline", "alignment-baseline"],
		["arabicForm", "arabic-form"],
		["baselineShift", "baseline-shift"],
		["capHeight", "cap-height"],
		["clipPath", "clip-path"],
		["clipRule", "clip-rule"],
		["colorInterpolation", "color-interpolation"],
		["colorInterpolationFilters", "color-interpolation-filters"],
		["colorProfile", "color-profile"],
		["colorRendering", "color-rendering"],
		["dominantBaseline", "dominant-baseline"],
		["enableBackground", "enable-background"],
		["fillOpacity", "fill-opacity"],
		["fillRule", "fill-rule"],
		["floodColor", "flood-color"],
		["floodOpacity", "flood-opacity"],
		["fontFamily", "font-family"],
		["fontSize", "font-size"],
		["fontSizeAdjust", "font-size-adjust"],
		["fontStretch", "font-stretch"],
		["fontStyle", "font-style"],
		["fontVariant", "font-variant"],
		["fontWeight", "font-weight"],
		["glyphName", "glyph-name"],
		["glyphOrientationHorizontal", "glyph-orientation-horizontal"],
		["glyphOrientationVertical", "glyph-orientation-vertical"],
		["horizAdvX", "horiz-adv-x"],
		["horizOriginX", "horiz-origin-x"],
		["imageRendering", "image-rendering"],
		["letterSpacing", "letter-spacing"],
		["lightingColor", "lighting-color"],
		["markerEnd", "marker-end"],
		["markerMid", "marker-mid"],
		["markerStart", "marker-start"],
		["maskType", "mask-type"],
		["overlinePosition", "overline-position"],
		["overlineThickness", "overline-thickness"],
		["paintOrder", "paint-order"],
		["panose-1", "panose-1"],
		["pointerEvents", "pointer-events"],
		["renderingIntent", "rendering-intent"],
		["shapeRendering", "shape-rendering"],
		["stopColor", "stop-color"],
		["stopOpacity", "stop-opacity"],
		["strikethroughPosition", "strikethrough-position"],
		["strikethroughThickness", "strikethrough-thickness"],
		["strokeDasharray", "stroke-dasharray"],
		["strokeDashoffset", "stroke-dashoffset"],
		["strokeLinecap", "stroke-linecap"],
		["strokeLinejoin", "stroke-linejoin"],
		["strokeMiterlimit", "stroke-miterlimit"],
		["strokeOpacity", "stroke-opacity"],
		["strokeWidth", "stroke-width"],
		["textAnchor", "text-anchor"],
		["textDecoration", "text-decoration"],
		["textRendering", "text-rendering"],
		["transformOrigin", "transform-origin"],
		["underlinePosition", "underline-position"],
		["underlineThickness", "underline-thickness"],
		["unicodeBidi", "unicode-bidi"],
		["unicodeRange", "unicode-range"],
		["unitsPerEm", "units-per-em"],
		["vAlphabetic", "v-alphabetic"],
		["vHanging", "v-hanging"],
		["vIdeographic", "v-ideographic"],
		["vMathematical", "v-mathematical"],
		["vectorEffect", "vector-effect"],
		["vertAdvY", "vert-adv-y"],
		["vertOriginX", "vert-origin-x"],
		["vertOriginY", "vert-origin-y"],
		["wordSpacing", "word-spacing"],
		["writingMode", "writing-mode"],
		["xmlnsXlink", "xmlns:xlink"],
		["xHeight", "x-height"]
	]), rn = /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;
	function an(e) {
		return rn.test("" + e) ? "javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')" : e;
	}
	function on() {}
	var sn = null;
	function cn(e) {
		return e = e.target || e.srcElement || window, e.correspondingUseElement && (e = e.correspondingUseElement), e.nodeType === 3 ? e.parentNode : e;
	}
	var ln = null, un = null;
	function dn(e) {
		var t = Ct(e);
		if (t && (e = t.stateNode)) {
			var n = e[mt] || null;
			a: switch (e = t.stateNode, t.type) {
				case "input":
					if (Kt(e, n.value, n.defaultValue, n.defaultValue, n.checked, n.defaultChecked, n.type, n.name), t = n.name, n.type === "radio" && t != null) {
						for (n = e; n.parentNode;) n = n.parentNode;
						for (n = n.querySelectorAll("input[name=\"" + Gt("" + t) + "\"][type=\"radio\"]"), t = 0; t < n.length; t++) {
							var r = n[t];
							if (r !== e && r.form === e.form) {
								var a = r[mt] || null;
								if (!a) throw Error(i(90));
								Kt(r, a.value, a.defaultValue, a.defaultValue, a.checked, a.defaultChecked, a.type, a.name);
							}
						}
						for (t = 0; t < n.length; t++) r = n[t], r.form === e.form && Ut(r);
					}
					break a;
				case "textarea":
					Xt(e, n.value, n.defaultValue);
					break a;
				case "select": t = n.value, t != null && Yt(e, !!n.multiple, t, !1);
			}
		}
	}
	var fn = !1;
	function pn(e, t, n) {
		if (fn) return e(t, n);
		fn = !0;
		try {
			return e(t);
		} finally {
			if (fn = !1, (ln !== null || un !== null) && (Id(), ln && (t = ln, e = un, un = ln = null, dn(t), e))) for (t = 0; t < e.length; t++) dn(e[t]);
		}
	}
	function mn(e, t) {
		var n = e.stateNode;
		if (n === null) return null;
		var r = n[mt] || null;
		if (r === null) return null;
		n = r[t];
		a: switch (t) {
			case "onClick":
			case "onClickCapture":
			case "onDoubleClick":
			case "onDoubleClickCapture":
			case "onMouseDown":
			case "onMouseDownCapture":
			case "onMouseMove":
			case "onMouseMoveCapture":
			case "onMouseUp":
			case "onMouseUpCapture":
			case "onMouseEnter":
				(r = !r.disabled) || (e = e.type, r = e !== "button" && e !== "input" && e !== "select" && e !== "textarea"), e = !r;
				break a;
			default: e = !1;
		}
		if (e) return null;
		if (n && typeof n != "function") throw Error(i(231, t, typeof n));
		return n;
	}
	var hn = typeof window < "u" && window.document !== void 0 && window.document.createElement !== void 0, gn = !1;
	if (hn) try {
		var _n = {};
		Object.defineProperty(_n, "passive", { get: function() {
			gn = !0;
		} }), window.addEventListener("test", _n, _n), window.removeEventListener("test", _n, _n);
	} catch {
		gn = !1;
	}
	var vn = null, yn = null, bn = null;
	function xn() {
		if (bn) return bn;
		var e, t = yn, n = t.length, r, i = "value" in vn ? vn.value : vn.textContent, a = i.length;
		for (e = 0; e < n && t[e] === i[e]; e++);
		var o = n - e;
		for (r = 1; r <= o && t[n - r] === i[a - r]; r++);
		return bn = i.slice(e, 1 < r ? 1 - r : void 0);
	}
	function Sn(e) {
		var t = e.keyCode;
		return "charCode" in e ? (e = e.charCode, e === 0 && t === 13 && (e = 13)) : e = t, e === 10 && (e = 13), 32 <= e || e === 13 ? e : 0;
	}
	function Cn() {
		return !0;
	}
	function wn() {
		return !1;
	}
	function Tn(e) {
		function t(t, n, r, i, a) {
			for (var o in this._reactName = t, this._targetInst = r, this.type = n, this.nativeEvent = i, this.target = a, this.currentTarget = null, e) e.hasOwnProperty(o) && (t = e[o], this[o] = t ? t(i) : i[o]);
			return this.isDefaultPrevented = (i.defaultPrevented == null ? !1 === i.returnValue : i.defaultPrevented) ? Cn : wn, this.isPropagationStopped = wn, this;
		}
		return D(t.prototype, {
			preventDefault: function() {
				this.defaultPrevented = !0;
				var e = this.nativeEvent;
				e && (e.preventDefault ? e.preventDefault() : typeof e.returnValue != "unknown" && (e.returnValue = !1), this.isDefaultPrevented = Cn);
			},
			stopPropagation: function() {
				var e = this.nativeEvent;
				e && (e.stopPropagation ? e.stopPropagation() : typeof e.cancelBubble != "unknown" && (e.cancelBubble = !0), this.isPropagationStopped = Cn);
			},
			persist: function() {},
			isPersistent: Cn
		}), t;
	}
	var En = {
		eventPhase: 0,
		bubbles: 0,
		cancelable: 0,
		timeStamp: function(e) {
			return e.timeStamp || Date.now();
		},
		defaultPrevented: 0,
		isTrusted: 0
	}, Dn = Tn(En), On = D({}, En, {
		view: 0,
		detail: 0
	}), kn = Tn(On), An, jn, Mn, Nn = D({}, On, {
		screenX: 0,
		screenY: 0,
		clientX: 0,
		clientY: 0,
		pageX: 0,
		pageY: 0,
		ctrlKey: 0,
		shiftKey: 0,
		altKey: 0,
		metaKey: 0,
		getModifierState: Wn,
		button: 0,
		buttons: 0,
		relatedTarget: function(e) {
			return e.relatedTarget === void 0 ? e.fromElement === e.srcElement ? e.toElement : e.fromElement : e.relatedTarget;
		},
		movementX: function(e) {
			return "movementX" in e ? e.movementX : (e !== Mn && (Mn && e.type === "mousemove" ? (An = e.screenX - Mn.screenX, jn = e.screenY - Mn.screenY) : jn = An = 0, Mn = e), An);
		},
		movementY: function(e) {
			return "movementY" in e ? e.movementY : jn;
		}
	}), Pn = Tn(Nn), Fn = Tn(D({}, Nn, { dataTransfer: 0 })), In = Tn(D({}, On, { relatedTarget: 0 })), Ln = Tn(D({}, En, {
		animationName: 0,
		elapsedTime: 0,
		pseudoElement: 0
	})), Rn = Tn(D({}, En, { clipboardData: function(e) {
		return "clipboardData" in e ? e.clipboardData : window.clipboardData;
	} })), zn = Tn(D({}, En, { data: 0 })), Bn = {
		Esc: "Escape",
		Spacebar: " ",
		Left: "ArrowLeft",
		Up: "ArrowUp",
		Right: "ArrowRight",
		Down: "ArrowDown",
		Del: "Delete",
		Win: "OS",
		Menu: "ContextMenu",
		Apps: "ContextMenu",
		Scroll: "ScrollLock",
		MozPrintableKey: "Unidentified"
	}, Vn = {
		8: "Backspace",
		9: "Tab",
		12: "Clear",
		13: "Enter",
		16: "Shift",
		17: "Control",
		18: "Alt",
		19: "Pause",
		20: "CapsLock",
		27: "Escape",
		32: " ",
		33: "PageUp",
		34: "PageDown",
		35: "End",
		36: "Home",
		37: "ArrowLeft",
		38: "ArrowUp",
		39: "ArrowRight",
		40: "ArrowDown",
		45: "Insert",
		46: "Delete",
		112: "F1",
		113: "F2",
		114: "F3",
		115: "F4",
		116: "F5",
		117: "F6",
		118: "F7",
		119: "F8",
		120: "F9",
		121: "F10",
		122: "F11",
		123: "F12",
		144: "NumLock",
		145: "ScrollLock",
		224: "Meta"
	}, Hn = {
		Alt: "altKey",
		Control: "ctrlKey",
		Meta: "metaKey",
		Shift: "shiftKey"
	};
	function Un(e) {
		var t = this.nativeEvent;
		return t.getModifierState ? t.getModifierState(e) : (e = Hn[e]) ? !!t[e] : !1;
	}
	function Wn() {
		return Un;
	}
	var Gn = Tn(D({}, On, {
		key: function(e) {
			if (e.key) {
				var t = Bn[e.key] || e.key;
				if (t !== "Unidentified") return t;
			}
			return e.type === "keypress" ? (e = Sn(e), e === 13 ? "Enter" : String.fromCharCode(e)) : e.type === "keydown" || e.type === "keyup" ? Vn[e.keyCode] || "Unidentified" : "";
		},
		code: 0,
		location: 0,
		ctrlKey: 0,
		shiftKey: 0,
		altKey: 0,
		metaKey: 0,
		repeat: 0,
		locale: 0,
		getModifierState: Wn,
		charCode: function(e) {
			return e.type === "keypress" ? Sn(e) : 0;
		},
		keyCode: function(e) {
			return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
		},
		which: function(e) {
			return e.type === "keypress" ? Sn(e) : e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
		}
	})), Kn = Tn(D({}, Nn, {
		pointerId: 0,
		width: 0,
		height: 0,
		pressure: 0,
		tangentialPressure: 0,
		tiltX: 0,
		tiltY: 0,
		twist: 0,
		pointerType: 0,
		isPrimary: 0
	})), qn = Tn(D({}, En, { submitter: 0 })), Jn = Tn(D({}, On, {
		touches: 0,
		targetTouches: 0,
		changedTouches: 0,
		altKey: 0,
		metaKey: 0,
		ctrlKey: 0,
		shiftKey: 0,
		getModifierState: Wn
	})), Yn = Tn(D({}, En, {
		propertyName: 0,
		elapsedTime: 0,
		pseudoElement: 0
	})), Xn = Tn(D({}, Nn, {
		deltaX: function(e) {
			return "deltaX" in e ? e.deltaX : "wheelDeltaX" in e ? -e.wheelDeltaX : 0;
		},
		deltaY: function(e) {
			return "deltaY" in e ? e.deltaY : "wheelDeltaY" in e ? -e.wheelDeltaY : "wheelDelta" in e ? -e.wheelDelta : 0;
		},
		deltaZ: 0,
		deltaMode: 0
	})), Zn = Tn(D({}, En, {
		newState: 0,
		oldState: 0,
		source: 0
	})), Qn = [
		9,
		13,
		27,
		32
	], $n = hn && "CompositionEvent" in window, er = null;
	hn && "documentMode" in document && (er = document.documentMode);
	var tr = hn && "TextEvent" in window && !er, nr = hn && (!$n || er && 8 < er && 11 >= er), rr = " ", ir = !1;
	function ar(e, t) {
		switch (e) {
			case "keyup": return Qn.indexOf(t.keyCode) !== -1;
			case "keydown": return t.keyCode !== 229;
			case "keypress":
			case "mousedown":
			case "focusout": return !0;
			default: return !1;
		}
	}
	function or(e) {
		return e = e.detail, typeof e == "object" && "data" in e ? e.data : null;
	}
	var sr = !1;
	function cr(e, t) {
		switch (e) {
			case "compositionend": return or(t);
			case "keypress": return t.which === 32 ? (ir = !0, rr) : null;
			case "textInput": return e = t.data, e === rr && ir ? null : e;
			default: return null;
		}
	}
	function lr(e, t) {
		if (sr) return e === "compositionend" || !$n && ar(e, t) ? (e = xn(), bn = yn = vn = null, sr = !1, e) : null;
		switch (e) {
			case "paste": return null;
			case "keypress":
				if (!(t.ctrlKey || t.altKey || t.metaKey) || t.ctrlKey && t.altKey) {
					if (t.char && 1 < t.char.length) return t.char;
					if (t.which) return String.fromCharCode(t.which);
				}
				return null;
			case "compositionend": return nr && t.locale !== "ko" ? null : t.data;
			default: return null;
		}
	}
	var ur = {
		color: !0,
		date: !0,
		datetime: !0,
		"datetime-local": !0,
		email: !0,
		month: !0,
		number: !0,
		password: !0,
		range: !0,
		search: !0,
		tel: !0,
		text: !0,
		time: !0,
		url: !0,
		week: !0
	};
	function dr(e) {
		var t = e && e.nodeName && e.nodeName.toLowerCase();
		return t === "input" ? !!ur[e.type] : t === "textarea";
	}
	function fr(e, t, n, r) {
		ln ? un ? un.push(r) : un = [r] : ln = r, t = qf(t, "onChange"), 0 < t.length && (n = new Dn("onChange", "change", null, n, r), e.push({
			event: n,
			listeners: t
		}));
	}
	var pr = null, mr = null;
	function hr(e) {
		zf(e, 0);
	}
	function gr(e) {
		if (Ut(wt(e))) return e;
	}
	function _r(e, t) {
		if (e === "change") return t;
	}
	var vr = !1;
	if (hn) {
		var yr;
		if (hn) {
			var br = "oninput" in document;
			if (!br) {
				var xr = document.createElement("div");
				xr.setAttribute("oninput", "return;"), br = typeof xr.oninput == "function";
			}
			yr = br;
		} else yr = !1;
		vr = yr && (!document.documentMode || 9 < document.documentMode);
	}
	function Sr() {
		pr && (pr.detachEvent("onpropertychange", Cr), mr = pr = null);
	}
	function Cr(e) {
		if (e.propertyName === "value" && gr(mr)) {
			var t = [];
			fr(t, mr, e, cn(e)), pn(hr, t);
		}
	}
	function wr(e, t, n) {
		e === "focusin" ? (Sr(), pr = t, mr = n, pr.attachEvent("onpropertychange", Cr)) : e === "focusout" && Sr();
	}
	function Tr(e) {
		if (e === "selectionchange" || e === "keyup" || e === "keydown") return gr(mr);
	}
	function Er(e, t) {
		if (e === "click") return gr(t);
	}
	function Dr(e, t) {
		if (e === "input" || e === "change") return gr(t);
	}
	function Or(e, t) {
		return e === t && (e !== 0 || 1 / e == 1 / t) || e !== e && t !== t;
	}
	var kr = typeof Object.is == "function" ? Object.is : Or;
	function Ar(e, t) {
		if (kr(e, t)) return !0;
		if (typeof e != "object" || !e || typeof t != "object" || !t) return !1;
		var n = Object.keys(e), r = Object.keys(t);
		if (n.length !== r.length) return !1;
		for (r = 0; r < n.length; r++) {
			var i = n[r];
			if (!De.call(t, i) || !kr(e[i], t[i])) return !1;
		}
		return !0;
	}
	function jr(e) {
		if (e ||= typeof document < "u" ? document : void 0, e === void 0) return null;
		try {
			return e.activeElement || e.body;
		} catch {
			return e.body;
		}
	}
	function Mr(e) {
		for (; e && e.firstChild;) e = e.firstChild;
		return e;
	}
	function Nr(e, t) {
		var n = Mr(e);
		e = 0;
		for (var r; n;) {
			if (n.nodeType === 3) {
				if (r = e + n.textContent.length, e <= t && r >= t) return {
					node: n,
					offset: t - e
				};
				e = r;
			}
			a: {
				for (; n;) {
					if (n.nextSibling) {
						n = n.nextSibling;
						break a;
					}
					n = n.parentNode;
				}
				n = void 0;
			}
			n = Mr(n);
		}
	}
	function Pr(e, t) {
		return e && t ? e === t ? !0 : e && e.nodeType === 3 ? !1 : t && t.nodeType === 3 ? Pr(e, t.parentNode) : "contains" in e ? e.contains(t) : e.compareDocumentPosition ? !!(e.compareDocumentPosition(t) & 16) : !1 : !1;
	}
	function Fr(e) {
		e = e != null && e.ownerDocument != null && e.ownerDocument.defaultView != null ? e.ownerDocument.defaultView : window;
		for (var t = jr(e.document); t instanceof e.HTMLIFrameElement;) {
			try {
				var n = typeof t.contentWindow.location.href == "string";
			} catch {
				n = !1;
			}
			if (n) e = t.contentWindow;
			else break;
			t = jr(e.document);
		}
		return t;
	}
	function Ir(e) {
		var t = e && e.nodeName && e.nodeName.toLowerCase();
		return t && (t === "input" && (e.type === "text" || e.type === "search" || e.type === "tel" || e.type === "url" || e.type === "password") || t === "textarea" || e.contentEditable === "true");
	}
	var Lr = hn && "documentMode" in document && 11 >= document.documentMode, Rr = null, zr = null, Br = null, Vr = !1;
	function Hr(e, t, n) {
		var r = n.window === n ? n.document : n.nodeType === 9 ? n : n.ownerDocument;
		Vr || Rr == null || Rr !== jr(r) || (r = Rr, "selectionStart" in r && Ir(r) ? r = {
			start: r.selectionStart,
			end: r.selectionEnd
		} : (r = (r.ownerDocument && r.ownerDocument.defaultView || window).getSelection(), r = {
			anchorNode: r.anchorNode,
			anchorOffset: r.anchorOffset,
			focusNode: r.focusNode,
			focusOffset: r.focusOffset
		}), Br && Ar(Br, r) || (Br = r, r = qf(zr, "onSelect"), 0 < r.length && (t = new Dn("onSelect", "select", null, t, n), e.push({
			event: t,
			listeners: r
		}), t.target = Rr)));
	}
	function Ur(e, t) {
		var n = {};
		return n[e.toLowerCase()] = t.toLowerCase(), n["Webkit" + e] = "webkit" + t, n["Moz" + e] = "moz" + t, n;
	}
	var Wr = {
		animationend: Ur("Animation", "AnimationEnd"),
		animationiteration: Ur("Animation", "AnimationIteration"),
		animationstart: Ur("Animation", "AnimationStart"),
		transitionrun: Ur("Transition", "TransitionRun"),
		transitionstart: Ur("Transition", "TransitionStart"),
		transitioncancel: Ur("Transition", "TransitionCancel"),
		transitionend: Ur("Transition", "TransitionEnd")
	}, Gr = {}, Kr = {};
	hn && (Kr = document.createElement("div").style, "AnimationEvent" in window || (delete Wr.animationend.animation, delete Wr.animationiteration.animation, delete Wr.animationstart.animation), "TransitionEvent" in window || delete Wr.transitionend.transition);
	function qr(e) {
		if (Gr[e]) return Gr[e];
		if (!Wr[e]) return e;
		var t = Wr[e], n;
		for (n in t) if (t.hasOwnProperty(n) && n in Kr) return Gr[e] = t[n];
		return e;
	}
	var Jr = qr("animationend"), Yr = qr("animationiteration"), Xr = qr("animationstart"), Zr = qr("transitionrun"), Qr = qr("transitionstart"), $r = qr("transitioncancel"), ei = qr("transitionend"), ti = /* @__PURE__ */ new Map(), ni = "abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error fullscreenChange fullscreenError gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
	ni.push("scrollEnd");
	function ri(e, t) {
		ti.set(e, t), At(t, [e]);
	}
	var ii = 0;
	function ai(e, t) {
		if (e.name != null && e.name !== "auto") return e.name;
		if (t.autoName !== null) return t.autoName;
		e = _d.identifierPrefix;
		var n = ii++;
		return e = "_" + e + "t_" + n.toString(32) + "_", t.autoName = e;
	}
	function oi(e) {
		if (e == null || typeof e == "string") return e;
		var t = null, n = Td;
		if (n !== null) for (var r = 0; r < n.length; r++) {
			var i = e[n[r]];
			if (i != null) {
				if (i === "none") return "none";
				t = t == null ? i : t + (" " + i);
			}
		}
		return t ?? e.default;
	}
	function si(e, t) {
		return e = oi(e), t = oi(t), t == null ? e === "auto" ? null : e : t === "auto" ? null : t;
	}
	var ci = typeof reportError == "function" ? reportError : function(e) {
		if (typeof window == "object" && typeof window.ErrorEvent == "function") {
			var t = new window.ErrorEvent("error", {
				bubbles: !0,
				cancelable: !0,
				message: typeof e == "object" && e && typeof e.message == "string" ? String(e.message) : String(e),
				error: e
			});
			if (!window.dispatchEvent(t)) return;
		} else if (typeof process == "object" && typeof process.emit == "function") {
			process.emit("uncaughtException", e);
			return;
		}
		console.error(e);
	}, li = [], ui = 0, di = 0;
	function fi() {
		for (var e = ui, t = di = ui = 0; t < e;) {
			var n = li[t];
			li[t++] = null;
			var r = li[t];
			li[t++] = null;
			var i = li[t];
			li[t++] = null;
			var a = li[t];
			if (li[t++] = null, r !== null && i !== null) {
				var o = r.pending;
				o === null ? i.next = i : (i.next = o.next, o.next = i), r.pending = i;
			}
			a !== 0 && gi(n, i, a);
		}
	}
	function pi(e, t, n, r) {
		li[ui++] = e, li[ui++] = t, li[ui++] = n, li[ui++] = r, di |= r, e.lanes |= r, e = e.alternate, e !== null && (e.lanes |= r);
	}
	function mi(e, t, n, r) {
		return pi(e, t, n, r), _i(e);
	}
	function hi(e, t) {
		return pi(e, null, null, t), _i(e);
	}
	function gi(e, t, n) {
		e.lanes |= n;
		var r = e.alternate;
		r !== null && (r.lanes |= n);
		for (var i = !1, a = e.return; a !== null;) a.childLanes |= n, r = a.alternate, r !== null && (r.childLanes |= n), a.tag === 22 && (e = a.stateNode, e === null || e._visibility & 1 || (i = !0)), e = a, a = a.return;
		return e.tag === 3 ? (a = e.stateNode, i && t !== null && (i = 31 - Ue(n), e = a.hiddenUpdates, r = e[i], r === null ? e[i] = [t] : r.push(t), t.lane = n | 536870912), a) : null;
	}
	function _i(e) {
		if (50 < Ed) throw Ed = 0, Dd = null, Error(i(185));
		for (var t = e.return; t !== null;) e = t, t = e.return;
		return e.tag === 3 ? e.stateNode : null;
	}
	var vi = {};
	function yi(e, t, n, r) {
		this.tag = e, this.key = n, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.refCleanup = this.ref = null, this.pendingProps = t, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = r, this.subtreeFlags = this.flags = 0, this.deletions = null, this.childLanes = this.lanes = 0, this.alternate = null;
	}
	function bi(e, t, n, r) {
		return new yi(e, t, n, r);
	}
	function xi(e) {
		return e = e.prototype, !(!e || !e.isReactComponent);
	}
	function Si(e, t) {
		var n = e.alternate;
		return n === null ? (n = bi(e.tag, t, e.key, e.mode), n.elementType = e.elementType, n.type = e.type, n.stateNode = e.stateNode, n.alternate = e, e.alternate = n) : (n.pendingProps = t, n.type = e.type, n.flags = 0, n.subtreeFlags = 0, n.deletions = null), n.flags = e.flags & 1206910976, n.childLanes = e.childLanes, n.lanes = e.lanes, n.child = e.child, n.memoizedProps = e.memoizedProps, n.memoizedState = e.memoizedState, n.updateQueue = e.updateQueue, t = e.dependencies, n.dependencies = t === null ? null : {
			lanes: t.lanes,
			firstContext: t.firstContext
		}, n.sibling = e.sibling, n.index = e.index, n.ref = e.ref, n.refCleanup = e.refCleanup, n;
	}
	function Ci(e, t) {
		e.flags &= 1206910978;
		var n = e.alternate;
		return n === null ? (e.childLanes = 0, e.lanes = t, e.child = null, e.subtreeFlags = 0, e.memoizedProps = null, e.memoizedState = null, e.updateQueue = null, e.dependencies = null, e.stateNode = null) : (e.childLanes = n.childLanes, e.lanes = n.lanes, e.child = n.child, e.subtreeFlags = 0, e.deletions = null, e.memoizedProps = n.memoizedProps, e.memoizedState = n.memoizedState, e.updateQueue = n.updateQueue, e.type = n.type, t = n.dependencies, e.dependencies = t === null ? null : {
			lanes: t.lanes,
			firstContext: t.firstContext
		}), e;
	}
	function wi(e, t, n, r, a, o) {
		var s = 0;
		if (r = e, typeof r == "function") xi(r) && (s = 1);
		else if (typeof r == "string") s = qm(e, n, pe.current) ? 26 : e === "html" || e === "head" || e === "body" ? 27 : 5;
		else a: switch (r) {
			case ne: return e = bi(31, n, t, a), e.elementType = ne, e.lanes = o, e;
			case j: return Ti(n.children, a, o, t);
			case M:
				s = 8, a |= 24;
				break;
			case ee: return e = bi(12, n, t, a | 2), e.elementType = ee, e.lanes = o, e;
			case I: return e = bi(13, n, t, a), e.elementType = I, e.lanes = o, e;
			case L: return e = bi(19, n, t, a), e.elementType = L, e.lanes = o, e;
			case re:
			case B: return e = a | 32, e = bi(30, n, t, e), e.elementType = B, e.lanes = o, e.stateNode = {
				autoName: null,
				paired: null,
				clones: null,
				ref: null
			}, e;
			default:
				if (typeof r == "object" && r) switch (r.$$typeof) {
					case P:
						s = 10;
						break a;
					case N:
						s = 9;
						break a;
					case F:
						s = 11;
						break a;
					case te:
						s = 14;
						break a;
					case R:
						s = 16, r = null;
						break a;
				}
				s = 29, n = Error(i(130, e === null ? "null" : typeof e, "")), r = null;
		}
		return t = bi(s, n, t, a), t.elementType = e, t.type = r, t.lanes = o, t;
	}
	function Ti(e, t, n, r) {
		return e = bi(7, e, r, t), e.lanes = n, e;
	}
	function Ei(e, t, n) {
		return e = bi(6, e, null, t), e.lanes = n, e;
	}
	function Di(e) {
		var t = bi(18, null, null, 0);
		return t.stateNode = e, t;
	}
	function Oi(e, t, n) {
		return t = bi(4, e.children === null ? [] : e.children, e.key, t), t.lanes = n, t.stateNode = {
			containerInfo: e.containerInfo,
			pendingChildren: null,
			implementation: e.implementation
		}, t;
	}
	var ki = /* @__PURE__ */ new WeakMap();
	function Ai(e, t) {
		if (typeof e == "object" && e) {
			var n = ki.get(e);
			return n === void 0 ? (t = {
				value: e,
				source: t,
				stack: Ee(t)
			}, ki.set(e, t), t) : n;
		}
		return {
			value: e,
			source: t,
			stack: Ee(t)
		};
	}
	var ji = [], Mi = 0, Ni = null, Pi = 0, Fi = [], Ii = 0, Li = null, Ri = 1, zi = "";
	function Bi(e, t) {
		ji[Mi++] = Pi, ji[Mi++] = Ni, Ni = e, Pi = t;
	}
	function Vi(e, t, n) {
		Fi[Ii++] = Ri, Fi[Ii++] = zi, Fi[Ii++] = Li, Li = e;
		var r = Ri;
		e = zi;
		var i = 32 - Ue(r) - 1;
		r &= ~(1 << i), n += 1;
		var a = 32 - Ue(t) + i;
		if (30 < a) {
			var o = i - i % 5;
			a = (r & (1 << o) - 1).toString(32), r >>= o, i -= o, Ri = 1 << 32 - Ue(t) + i | n << i | r, zi = a + e;
		} else Ri = 1 << a | n << i | r, zi = e;
	}
	function Hi(e) {
		e.return !== null && (Bi(e, 1), Vi(e, 1, 0));
	}
	function Ui(e) {
		for (; e === Ni;) Ni = ji[--Mi], ji[Mi] = null, Pi = ji[--Mi], ji[Mi] = null;
		for (; e === Li;) Li = Fi[--Ii], Fi[Ii] = null, zi = Fi[--Ii], Fi[Ii] = null, Ri = Fi[--Ii], Fi[Ii] = null;
	}
	function Wi(e, t) {
		Fi[Ii++] = Ri, Fi[Ii++] = zi, Fi[Ii++] = Li, Ri = t.id, zi = t.overflow, Li = e;
	}
	var Gi = null, Ki = null, Q = !1, qi = null, Ji = !1, Yi = Error(i(519));
	function Xi(e) {
		throw na(Ai(Error(i(418, 1 < arguments.length && arguments[1] !== void 0 && arguments[1] ? "text" : "HTML", "")), e)), Yi;
	}
	function Zi(e) {
		var t = e.stateNode, n = e.type, r = e.memoizedProps;
		switch (t[pt] = e, t[mt] = r, n) {
			case "dialog":
				Bf("cancel", t), Bf("close", t);
				break;
			case "iframe":
			case "object":
			case "embed":
				Bf("load", t);
				break;
			case "video":
			case "audio":
				for (n = 0; n < Lf.length; n++) Bf(Lf[n], t);
				break;
			case "source":
				Bf("error", t);
				break;
			case "img":
			case "image":
			case "link":
				Bf("error", t), Bf("load", t);
				break;
			case "details":
				Bf("toggle", t);
				break;
			case "input":
				Bf("invalid", t), qt(t, r.value, r.defaultValue, r.checked, r.defaultChecked, r.type, r.name, !0);
				break;
			case "select":
				Bf("invalid", t);
				break;
			case "textarea": Bf("invalid", t), Zt(t, r.value, r.defaultValue, r.children);
		}
		n = r.children, typeof n != "string" && typeof n != "number" && typeof n != "bigint" || t.textContent === "" + n || !0 === r.suppressHydrationWarning || $f(t.textContent, n) ? (r.popover != null && (Bf("beforetoggle", t), Bf("toggle", t)), r.onScroll != null && Bf("scroll", t), r.onScrollEnd != null && Bf("scrollend", t), r.onClick != null && (t.onclick = on), t = !0) : t = !1, t || Xi(e, !0);
	}
	function Qi(e) {
		for (Gi = e.return; Gi;) switch (Gi.tag) {
			case 5:
			case 31:
			case 13:
				Ji = !1;
				return;
			case 27:
			case 3:
				Ji = !0;
				return;
			default: Gi = Gi.return;
		}
	}
	function $i(e) {
		if (e !== Gi) return !1;
		if (!Q) return Qi(e), Q = !0, !1;
		var t = e.tag, n;
		if ((n = t !== 3 && t !== 27) && ((n = t === 5) && (n = e.type, n = n === "form" || n === "button" || pp(e.type, e.memoizedProps)), n = !n), n && Ki && Xi(e), Qi(e), t === 13) {
			if (e = e.memoizedState, e = e === null ? null : e.dehydrated, !e) throw Error(i(317));
			Ki = dm(e);
		} else if (t === 31) {
			if (e = e.memoizedState, e = e === null ? null : e.dehydrated, !e) throw Error(i(317));
			Ki = dm(e);
		} else t === 27 ? (t = Ki, Sp(e.type) ? (e = um, um = null, Ki = e) : Ki = t) : Ki = Gi ? lm(e.stateNode.nextSibling) : null;
		return !0;
	}
	function ea() {
		Ki = Gi = null, Q = !1;
	}
	function ta() {
		var e = qi;
		return e !== null && (ld === null ? ld = e : ld.push.apply(ld, e), qi = null), e;
	}
	function na(e) {
		qi === null ? qi = [e] : qi.push(e);
	}
	var ra = fe(null), ia = null, aa = null;
	function oa(e, t, n) {
		G(ra, t._currentValue), t._currentValue = n;
	}
	function sa(e) {
		e._currentValue = ra.current, W(ra);
	}
	function ca(e, t, n) {
		for (; e !== null;) {
			var r = e.alternate;
			if ((e.childLanes & t) === t ? r !== null && (r.childLanes & t) !== t && (r.childLanes |= t) : (e.childLanes |= t, r !== null && (r.childLanes |= t)), e === n) break;
			e = e.return;
		}
	}
	function la(e, t, n, r) {
		var a = e.child;
		for (a !== null && (a.return = e); a !== null;) {
			var o = a.dependencies;
			if (o !== null) {
				var s = a.child;
				o = o.firstContext;
				a: for (; o !== null;) {
					var c = o;
					o = a;
					for (var l = 0; l < t.length; l++) if (c.context === t[l]) {
						o.lanes |= n, c = o.alternate, c !== null && (c.lanes |= n), ca(o.return, n, e), r || (s = null);
						break a;
					}
					o = c.next;
				}
			} else if (a.tag === 18) {
				if (s = a.return, s === null) throw Error(i(341));
				s.lanes |= n, o = s.alternate, o !== null && (o.lanes |= n), ca(s, n, e), s = null;
			} else a.tag === 13 && a.memoizedState !== null && a.memoizedState.dehydrated === null ? (a.lanes |= n, s = a.alternate, s !== null && (s.lanes |= n), ca(a.return, n, e), s = a.child, s = s === null ? null : s.sibling) : s = a.child;
			if (s !== null) s.return = a;
			else for (s = a; s !== null;) {
				if (s === e) {
					s = null;
					break;
				}
				if (a = s.sibling, a !== null) {
					a.return = s.return, s = a;
					break;
				}
				s = s.return;
			}
			a = s;
		}
	}
	function ua(e, t, n, r) {
		e = null;
		for (var a = t, o = !1; a !== null;) {
			if (!o) {
				if (a.flags & 524288) o = !0;
				else if (a.flags & 262144) break;
			}
			if (a.tag === 10) {
				var s = a.alternate;
				if (s === null) throw Error(i(387));
				if (s = s.memoizedProps, s !== null) {
					var c = a.type;
					kr(a.pendingProps.value, s.value) || (e === null ? e = [c] : e.push(c));
				}
			} else if (a === he.current) {
				if (s = a.alternate, s === null) throw Error(i(387));
				s.memoizedState.memoizedState !== a.memoizedState.memoizedState && (e === null ? e = [sh] : e.push(sh));
			}
			a = a.return;
		}
		return e !== null && la(t, e, n, r), t.flags |= 262144, e !== null;
	}
	function da(e) {
		for (e = e.firstContext; e !== null;) {
			if (!kr(e.context._currentValue, e.memoizedValue)) return !0;
			e = e.next;
		}
		return !1;
	}
	function fa(e) {
		ia = e, aa = null, e = e.dependencies, e !== null && (e.firstContext = null);
	}
	function pa(e) {
		return ha(ia, e);
	}
	function ma(e, t) {
		return ia === null && fa(e), ha(e, t);
	}
	function ha(e, t) {
		var n = t._currentValue;
		if (t = {
			context: t,
			memoizedValue: n,
			next: null
		}, aa === null) {
			if (e === null) throw Error(i(308));
			aa = t, e.dependencies = {
				lanes: 0,
				firstContext: t
			}, e.flags |= 524288;
		} else aa = aa.next = t;
		return n;
	}
	var ga = typeof AbortController < "u" ? AbortController : function() {
		var e = [], t = this.signal = {
			aborted: !1,
			addEventListener: function(t, n) {
				e.push(n);
			}
		};
		this.abort = function() {
			t.aborted = !0, e.forEach(function(e) {
				return e();
			});
		};
	}, _a = t.unstable_scheduleCallback, va = t.unstable_NormalPriority, ya = {
		$$typeof: P,
		Consumer: null,
		Provider: null,
		_currentValue: null,
		_currentValue2: null,
		_threadCount: 0
	};
	function ba() {
		return {
			controller: new ga(),
			data: /* @__PURE__ */ new Map(),
			refCount: 0
		};
	}
	function xa(e) {
		e.refCount--, e.refCount === 0 && _a(va, function() {
			e.controller.abort();
		});
	}
	function Sa(e, t) {
		if (e.pendingLanes & 4194048) {
			var n = e.transitionTypes;
			for (n === null && (n = e.transitionTypes = []), e = 0; e < t.length; e++) {
				var r = t[e];
				n.indexOf(r) === -1 && n.push(r);
			}
		}
	}
	var Ca = null;
	function wa(e) {
		var t = e.transitionTypes;
		return e.transitionTypes = null, t;
	}
	var Ta = null, Ea = 0, Da = 0, Oa = null;
	function ka(e, t) {
		if (Ta === null) {
			var n = Ta = [];
			Ea = 0, Da = Mf(), Oa = {
				status: "pending",
				value: void 0,
				then: function(e) {
					n.push(e);
				}
			};
		}
		return Ea++, t.then(Aa, Aa), t;
	}
	function Aa() {
		if (--Ea === 0 && (Ca = null, Ta !== null)) {
			Oa !== null && (Oa.status = "fulfilled");
			var e = Ta;
			Ta = null, Da = 0, Oa = null;
			for (var t = 0; t < e.length; t++) (0, e[t])();
		}
	}
	function ja(e, t) {
		var n = [], r = {
			status: "pending",
			value: null,
			reason: null,
			then: function(e) {
				n.push(e);
			}
		};
		return e.then(function() {
			r.status = "fulfilled", r.value = t;
			for (var e = 0; e < n.length; e++) (0, n[e])(t);
		}, function(e) {
			for (r.status = "rejected", r.reason = e, e = 0; e < n.length; e++) (0, n[e])(void 0);
		}), r;
	}
	var Ma = H.S;
	H.S = function(e, t) {
		if (fd = Me(), typeof t == "object" && t && typeof t.then == "function" && ka(e, t), Ca !== null) for (var n = vf; n !== null;) Sa(n, Ca), n = n.next;
		if (n = e.types, n !== null) {
			for (var r = vf; r !== null;) Sa(r, n), r = r.next;
			if (Da !== 0) {
				r = Ca, r === null && (r = Ca = []);
				for (var i = 0; i < n.length; i++) {
					var a = n[i];
					r.indexOf(a) === -1 && r.push(a);
				}
			}
		}
		Ma !== null && Ma(e, t);
	};
	var Na = fe(null);
	function Pa() {
		var e = Na.current;
		return e === null ? qu.pooledCache : e;
	}
	function Fa(e, t) {
		t === null ? G(Na, Na.current) : G(Na, t.pool);
	}
	function Ia() {
		var e = Pa();
		return e === null ? null : {
			parent: ya._currentValue,
			pool: e
		};
	}
	var La = Error(i(460)), Ra = Error(i(474)), za = Error(i(542)), Ba = { then: function() {} };
	function Va(e) {
		return e = e.status, e === "fulfilled" || e === "rejected";
	}
	function Ha(e, t, n) {
		switch (n = e[n], n === void 0 ? e.push(t) : n !== t && (t.then(on, on), t = n), t.status) {
			case "fulfilled": return t.value;
			case "rejected": throw e = t.reason, Ka(e), e === void 0 && !("reason" in t) ? Error(i(600)) : e;
			default:
				if (typeof t.status == "string") t.then(on, on);
				else {
					if (e = qu, e !== null && 100 < e.shellSuspendCounter) throw Error(i(482));
					e = t, e.status = "pending", e.then(function(e) {
						if (t.status === "pending") {
							var n = t;
							n.status = "fulfilled", n.value = e;
						}
					}, function(e) {
						if (t.status === "pending") {
							var n = t;
							n.status = "rejected", n.reason = e;
						}
					});
				}
				switch (t.status) {
					case "fulfilled": return t.value;
					case "rejected": throw e = t.reason, Ka(e), e;
				}
				throw Wa = t, La;
		}
	}
	function Ua(e) {
		try {
			var t = e._init;
			return t(e._payload);
		} catch (e) {
			throw typeof e == "object" && e && typeof e.then == "function" ? (Wa = e, La) : e;
		}
	}
	var Wa = null;
	function Ga() {
		if (Wa === null) throw Error(i(459));
		var e = Wa;
		return Wa = null, e;
	}
	function Ka(e) {
		if (e === La || e === za) throw Error(i(483));
	}
	var qa = null, Ja = 0;
	function Ya(e) {
		var t = Ja;
		return Ja += 1, qa === null && (qa = []), Ha(qa, e, t);
	}
	function Xa(e, t) {
		t = t.props.ref, e.ref = t === void 0 ? null : t;
	}
	function Za(e, t) {
		throw t.$$typeof === O ? Error(i(525)) : (e = Object.prototype.toString.call(t), Error(i(31, e === "[object Object]" ? "object with keys {" + Object.keys(t).join(", ") + "}" : e)));
	}
	function Qa(e) {
		function t(t, n) {
			if (e) {
				var r = t.deletions;
				r === null ? (t.deletions = [n], t.flags |= 16) : r.push(n);
			}
		}
		function n(n, r) {
			if (!e) return null;
			for (; r !== null;) t(n, r), r = r.sibling;
			return null;
		}
		function r(e) {
			for (var t = /* @__PURE__ */ new Map(); e !== null;) e.key === null ? t.set(e.index, e) : t.set(e.key, e), e = e.sibling;
			return t;
		}
		function a(e, t) {
			return e = Si(e, t), e.index = 0, e.sibling = null, e;
		}
		function o(t, n, r) {
			return t.index = r, e ? (r = t.alternate, r === null ? (t.flags |= 134217730, n) : (r = r.index, r < n ? (t.flags |= 2, n) : r)) : (t.flags |= 1048576, n);
		}
		function s(t) {
			return e && t.alternate === null && (t.flags |= 134217730), t;
		}
		function c(e, t, n, r) {
			return t === null || t.tag !== 6 ? (t = Ei(n, e.mode, r), t.return = e, t) : (t = a(t, n), t.return = e, t);
		}
		function l(e, t, n, r) {
			var i = n.type;
			return i === j ? (e = d(e, t, n.props.children, r, n.key), Xa(e, n), e) : t !== null && (t.elementType === i || typeof i == "object" && i && i.$$typeof === R && Ua(i) === t.type) ? (t = a(t, n.props), Xa(t, n), t.return = e, t) : (t = wi(n.type, n.key, n.props, null, e.mode, r), Xa(t, n), t.return = e, t);
		}
		function u(e, t, n, r) {
			return t === null || t.tag !== 4 || t.stateNode.containerInfo !== n.containerInfo || t.stateNode.implementation !== n.implementation ? (t = Oi(n, e.mode, r), t.return = e, t) : (t = a(t, n.children || []), t.return = e, t);
		}
		function d(e, t, n, r, i) {
			return t === null || t.tag !== 7 ? (t = Ti(n, e.mode, r, i), t.return = e, t) : (t = a(t, n), t.return = e, t);
		}
		function f(e, t, n) {
			if (typeof t == "string" && t !== "" || typeof t == "number" || typeof t == "bigint") return t = Ei("" + t, e.mode, n), t.return = e, t;
			if (typeof t == "object" && t) {
				switch (t.$$typeof) {
					case k: return n = wi(t.type, t.key, t.props, null, e.mode, n), Xa(n, t), n.return = e, n;
					case A: return t = Oi(t, e.mode, n), t.return = e, t;
					case R: return t = Ua(t), f(e, t, n);
				}
				if (V(t) || oe(t)) return t = Ti(t, e.mode, n, null), t.return = e, t;
				if (typeof t.then == "function") return f(e, Ya(t), n);
				if (t.$$typeof === P) return f(e, ma(e, t), n);
				Za(e, t);
			}
			return null;
		}
		function p(e, t, n, r) {
			var i = t === null ? null : t.key;
			if (typeof n == "string" && n !== "" || typeof n == "number" || typeof n == "bigint") return i === null ? c(e, t, "" + n, r) : null;
			if (typeof n == "object" && n) {
				switch (n.$$typeof) {
					case k: return n.key === i ? l(e, t, n, r) : null;
					case A: return n.key === i ? u(e, t, n, r) : null;
					case R: return n = Ua(n), p(e, t, n, r);
				}
				if (V(n) || oe(n)) return i === null ? d(e, t, n, r, null) : null;
				if (typeof n.then == "function") return p(e, t, Ya(n), r);
				if (n.$$typeof === P) return p(e, t, ma(e, n), r);
				Za(e, n);
			}
			return null;
		}
		function m(e, t, n, r, i) {
			if (typeof r == "string" && r !== "" || typeof r == "number" || typeof r == "bigint") return e = e.get(n) || null, c(t, e, "" + r, i);
			if (typeof r == "object" && r) {
				switch (r.$$typeof) {
					case k: return e = e.get(r.key === null ? n : r.key) || null, l(t, e, r, i);
					case A: return e = e.get(r.key === null ? n : r.key) || null, u(t, e, r, i);
					case R: return r = Ua(r), m(e, t, n, r, i);
				}
				if (V(r) || oe(r)) return e = e.get(n) || null, d(t, e, r, i, null);
				if (typeof r.then == "function") return m(e, t, n, Ya(r), i);
				if (r.$$typeof === P) return m(e, t, n, ma(t, r), i);
				Za(t, r);
			}
			return null;
		}
		function h(i, a, s, c) {
			for (var l = null, u = null, d = a, h = a = 0, g = null; d !== null && h < s.length; h++) {
				d.index > h ? (g = d, d = null) : g = d.sibling;
				var _ = p(i, d, s[h], c);
				if (_ === null) {
					d === null && (d = g);
					break;
				}
				e && d && _.alternate === null && t(i, d), a = o(_, a, h), u === null ? l = _ : u.sibling = _, u = _, d = g;
			}
			if (h === s.length) return n(i, d), Q && Bi(i, h), l;
			if (d === null) {
				for (; h < s.length; h++) d = f(i, s[h], c), d !== null && (a = o(d, a, h), u === null ? l = d : u.sibling = d, u = d);
				return Q && Bi(i, h), l;
			}
			for (d = r(d); h < s.length; h++) g = m(d, i, h, s[h], c), g !== null && (e && (_ = g.alternate, _ !== null && d.delete(_.key === null ? h : _.key)), a = o(g, a, h), u === null ? l = g : u.sibling = g, u = g);
			return e && d.forEach(function(e) {
				return t(i, e);
			}), Q && Bi(i, h), l;
		}
		function g(a, s, c, l) {
			if (c == null) throw Error(i(151));
			for (var u = null, d = null, h = s, g = s = 0, _ = null, v = c.next(); h !== null && !v.done; g++, v = c.next()) {
				h.index > g ? (_ = h, h = null) : _ = h.sibling;
				var y = p(a, h, v.value, l);
				if (y === null) {
					h === null && (h = _);
					break;
				}
				e && h && y.alternate === null && t(a, h), s = o(y, s, g), d === null ? u = y : d.sibling = y, d = y, h = _;
			}
			if (v.done) return n(a, h), Q && Bi(a, g), u;
			if (h === null) {
				for (; !v.done; g++, v = c.next()) v = f(a, v.value, l), v !== null && (s = o(v, s, g), d === null ? u = v : d.sibling = v, d = v);
				return Q && Bi(a, g), u;
			}
			for (h = r(h); !v.done; g++, v = c.next()) v = m(h, a, g, v.value, l), v !== null && (e && (_ = v.alternate, _ !== null && h.delete(_.key === null ? g : _.key)), s = o(v, s, g), d === null ? u = v : d.sibling = v, d = v);
			return e && h.forEach(function(e) {
				return t(a, e);
			}), Q && Bi(a, g), u;
		}
		function _(e, r, o, c) {
			if (typeof o == "object" && o && o.type === j && o.key === null && o.props.ref === void 0 && (o = o.props.children), typeof o == "object" && o) {
				switch (o.$$typeof) {
					case k:
						a: {
							for (var l = o.key; r !== null;) {
								if (r.key === l) {
									if (l = o.type, l === j) {
										if (r.tag === 7) {
											n(e, r.sibling), c = a(r, o.props.children), Xa(c, o), c.return = e, e = c;
											break a;
										}
									} else if (r.elementType === l || typeof l == "object" && l && l.$$typeof === R && Ua(l) === r.type) {
										n(e, r.sibling), c = a(r, o.props), Xa(c, o), c.return = e, e = c;
										break a;
									}
									n(e, r);
									break;
								}
								t(e, r), r = r.sibling;
							}
							o.type === j ? (c = Ti(o.props.children, e.mode, c, o.key), Xa(c, o), c.return = e, e = c) : (c = wi(o.type, o.key, o.props, null, e.mode, c), Xa(c, o), c.return = e, e = c);
						}
						return s(e);
					case A:
						a: {
							for (l = o.key; r !== null;) {
								if (r.key === l) {
									if (r.tag === 4 && r.stateNode.containerInfo === o.containerInfo && r.stateNode.implementation === o.implementation) {
										n(e, r.sibling), c = a(r, o.children || []), c.return = e, e = c;
										break a;
									}
									n(e, r);
									break;
								}
								t(e, r), r = r.sibling;
							}
							c = Oi(o, e.mode, c), c.return = e, e = c;
						}
						return s(e);
					case R: return o = Ua(o), _(e, r, o, c);
				}
				if (V(o)) return h(e, r, o, c);
				if (oe(o)) {
					if (l = oe(o), typeof l != "function") throw Error(i(150));
					return o = l.call(o), g(e, r, o, c);
				}
				if (typeof o.then == "function") return _(e, r, Ya(o), c);
				if (o.$$typeof === P) return _(e, r, ma(e, o), c);
				Za(e, o);
			}
			return typeof o == "string" && o !== "" || typeof o == "number" || typeof o == "bigint" ? (o = "" + o, r !== null && r.tag === 6 ? (n(e, r.sibling), c = a(r, o), c.return = e, e = c) : (n(e, r), c = Ei(o, e.mode, c), c.return = e, e = c), s(e)) : n(e, r);
		}
		return function(e, t, n, r) {
			try {
				Ja = 0;
				var i = _(e, t, n, r);
				return qa = null, i;
			} catch (t) {
				if (t === La || t === za) throw t;
				var a = bi(29, t, null, e.mode);
				return a.lanes = r, a.return = e, a;
			}
		};
	}
	var $a = Qa(!0), eo = Qa(!1), to = !1;
	function no(e) {
		e.updateQueue = {
			baseState: e.memoizedState,
			firstBaseUpdate: null,
			lastBaseUpdate: null,
			shared: {
				pending: null,
				lanes: 0,
				hiddenCallbacks: null
			},
			callbacks: null
		};
	}
	function ro(e, t) {
		e = e.updateQueue, t.updateQueue === e && (t.updateQueue = {
			baseState: e.baseState,
			firstBaseUpdate: e.firstBaseUpdate,
			lastBaseUpdate: e.lastBaseUpdate,
			shared: e.shared,
			callbacks: null
		});
	}
	function io(e) {
		return {
			lane: e,
			tag: 0,
			payload: null,
			callback: null,
			next: null
		};
	}
	function ao(e, t, n) {
		var r = e.updateQueue;
		if (r === null) return null;
		if (r = r.shared, Ku & 2) {
			var i = r.pending;
			return i === null ? t.next = t : (t.next = i.next, i.next = t), r.pending = t, t = _i(e), gi(e, null, n), t;
		}
		return pi(e, r, t, n), _i(e);
	}
	function oo(e, t, n) {
		if (t = t.updateQueue, t !== null && (t = t.shared, n & 4194048)) {
			var r = t.lanes;
			r &= e.pendingLanes, n |= r, t.lanes = n, ot(e, n);
		}
	}
	function so(e, t) {
		var n = e.updateQueue, r = e.alternate;
		if (r !== null && (r = r.updateQueue, n === r)) {
			var i = null, a = null;
			if (n = n.firstBaseUpdate, n !== null) {
				do {
					var o = {
						lane: n.lane,
						tag: n.tag,
						payload: n.payload,
						callback: null,
						next: null
					};
					a === null ? i = a = o : a = a.next = o, n = n.next;
				} while (n !== null);
				a === null ? i = a = t : a = a.next = t;
			} else i = a = t;
			n = {
				baseState: r.baseState,
				firstBaseUpdate: i,
				lastBaseUpdate: a,
				shared: r.shared,
				callbacks: r.callbacks
			}, e.updateQueue = n;
			return;
		}
		e = n.lastBaseUpdate, e === null ? n.firstBaseUpdate = t : e.next = t, n.lastBaseUpdate = t;
	}
	var co = !1;
	function lo() {
		if (co) {
			var e = Oa;
			if (e !== null) throw e;
		}
	}
	function uo(e, t, n, r) {
		co = !1;
		var i = e.updateQueue;
		to = !1;
		var a = i.firstBaseUpdate, o = i.lastBaseUpdate, s = i.shared.pending;
		if (s !== null) {
			i.shared.pending = null;
			var c = s, l = c.next;
			c.next = null, o === null ? a = l : o.next = l, o = c;
			var u = e.alternate;
			u !== null && (u = u.updateQueue, s = u.lastBaseUpdate, s !== o && (s === null ? u.firstBaseUpdate = l : s.next = l, u.lastBaseUpdate = c));
		}
		if (a !== null) {
			var d = i.baseState;
			o = 0, u = l = c = null, s = a;
			do {
				var f = s.lane & -536870913, p = f !== s.lane;
				if (p ? (Yu & f) === f : (r & f) === f) {
					f !== 0 && f === Da && (co = !0), u !== null && (u = u.next = {
						lane: 0,
						tag: s.tag,
						payload: s.payload,
						callback: null,
						next: null
					});
					a: {
						var m = e, h = s;
						f = t;
						var g = n;
						switch (h.tag) {
							case 1:
								if (m = h.payload, typeof m == "function") {
									d = m.call(g, d, f);
									break a;
								}
								d = m;
								break a;
							case 3: m.flags = m.flags & -65537 | 128;
							case 0:
								if (m = h.payload, f = typeof m == "function" ? m.call(g, d, f) : m, f == null) break a;
								d = D({}, d, f);
								break a;
							case 2: to = !0;
						}
					}
					f = s.callback, f !== null && (e.flags |= 64, p && (e.flags |= 8192), p = i.callbacks, p === null ? i.callbacks = [f] : p.push(f));
				} else p = {
					lane: f,
					tag: s.tag,
					payload: s.payload,
					callback: s.callback,
					next: null
				}, u === null ? (l = u = p, c = d) : u = u.next = p, o |= f;
				if (s = s.next, s === null) {
					if (s = i.shared.pending, s === null) break;
					p = s, s = p.next, p.next = null, i.lastBaseUpdate = p, i.shared.pending = null;
				}
			} while (1);
			u === null && (c = d), i.baseState = c, i.firstBaseUpdate = l, i.lastBaseUpdate = u, a === null && (i.shared.lanes = 0), rd |= o, e.lanes = o, e.memoizedState = d;
		}
	}
	function fo(e, t) {
		if (typeof e != "function") throw Error(i(191, e));
		e.call(t);
	}
	function po(e, t) {
		var n = e.callbacks;
		if (n !== null) for (e.callbacks = null, e = 0; e < n.length; e++) fo(n[e], t);
	}
	var mo = fe(null), ho = fe(0);
	function go(e, t) {
		e = td, G(ho, e), G(mo, t), td = e | t.baseLanes;
	}
	function _o() {
		G(ho, td), G(mo, mo.current);
	}
	function vo() {
		td = ho.current, W(mo), W(ho);
	}
	var yo = fe(null), bo = null;
	function xo(e) {
		var t = e.alternate;
		G(Eo, Eo.current & 1), G(yo, e), bo === null && (t === null || mo.current !== null || t.memoizedState !== null) && (bo = e);
	}
	function So(e) {
		G(Eo, Eo.current), G(yo, e), bo === null && (bo = e);
	}
	function Co(e) {
		e.tag === 22 ? (G(Eo, Eo.current), G(yo, e), bo === null && (bo = e)) : wo();
	}
	function wo() {
		G(Eo, Eo.current), G(yo, yo.current);
	}
	function To(e) {
		W(yo), bo === e && (bo = null), W(Eo);
	}
	var Eo = fe(0);
	function Do(e, t) {
		G(yo, yo.current), G(Eo, t);
	}
	function Oo(e) {
		W(Eo), W(yo), bo === e && (bo = null);
	}
	function ko(e) {
		for (var t = e; t !== null;) {
			if (t.tag === 13) {
				var n = t.memoizedState;
				if (n !== null && (n = n.dehydrated, n === null || om(n) || sm(n))) return t;
			} else if (t.tag === 19 && t.memoizedProps.revealOrder !== "independent") {
				if (t.flags & 128) return t;
			} else if (t.child !== null) {
				t.child.return = t, t = t.child;
				continue;
			}
			if (t === e) break;
			for (; t.sibling === null;) {
				if (t.return === null || t.return === e) return null;
				t = t.return;
			}
			t.sibling.return = t.return, t = t.sibling;
		}
		return null;
	}
	var Ao = 0, $ = null, jo = null, Mo = null, No = !1, Po = !1, Fo = !1, Io = 0, Lo = 0, Ro = null, zo = 0;
	function Bo() {
		throw Error(i(321));
	}
	function Vo(e, t) {
		if (t === null) return !1;
		for (var n = 0; n < t.length && n < e.length; n++) if (!kr(e[n], t[n])) return !1;
		return !0;
	}
	function Ho(e, t, n, r, i, a) {
		return Ao = a, $ = t, t.memoizedState = null, t.updateQueue = null, t.lanes = 0, H.H = e === null || e.memoizedState === null ? ac : oc, Fo = !1, a = n(r, i), Fo = !1, Po && (a = Wo(t, n, r, i)), Uo(e), a;
	}
	function Uo(e) {
		H.H = ic;
		var t = jo !== null && jo.next !== null;
		if (Ao = 0, Mo = jo = $ = null, No = !1, Lo = 0, Ro = null, t) throw Error(i(300));
		e === null || Cc || (e = e.dependencies, e !== null && da(e) && (Cc = !0));
	}
	function Wo(e, t, n, r) {
		$ = e;
		var a = 0;
		do {
			if (Po && (Ro = null), Lo = 0, Po = !1, 25 <= a) throw Error(i(301));
			if (a += 1, Mo = jo = null, e.updateQueue != null) {
				var o = e.updateQueue;
				o.lastEffect = null, o.events = null, o.stores = null, o.memoCache != null && (o.memoCache.index = 0);
			}
			H.H = sc, o = t(n, r);
		} while (Po);
		return o;
	}
	function Go() {
		var e = H.H, t = e.useState()[0];
		return t = typeof t.then == "function" ? Qo(t) : t, e = e.useState()[0], (jo === null ? null : jo.memoizedState) !== e && ($.flags |= 1024), t;
	}
	function Ko() {
		var e = Io !== 0;
		return Io = 0, e;
	}
	function qo(e, t, n) {
		t.updateQueue = e.updateQueue, t.flags &= -2053, e.lanes &= ~n;
	}
	function Jo(e) {
		if (No) {
			for (e = e.memoizedState; e !== null;) {
				var t = e.queue;
				t !== null && (t.pending = null), e = e.next;
			}
			No = !1;
		}
		Ao = 0, Mo = jo = $ = null, Po = !1, Lo = Io = 0, Ro = null;
	}
	function Yo() {
		var e = {
			memoizedState: null,
			baseState: null,
			baseQueue: null,
			queue: null,
			next: null
		};
		return Mo === null ? $.memoizedState = Mo = e : Mo = Mo.next = e, Mo;
	}
	function Xo() {
		if (jo === null) {
			var e = $.alternate;
			e = e === null ? null : e.memoizedState;
		} else e = jo.next;
		var t = Mo === null ? $.memoizedState : Mo.next;
		if (t !== null) Mo = t, jo = e;
		else {
			if (e === null) throw $.alternate === null ? Error(i(467)) : Error(i(310));
			jo = e, e = {
				memoizedState: jo.memoizedState,
				baseState: jo.baseState,
				baseQueue: jo.baseQueue,
				queue: jo.queue,
				next: null
			}, Mo === null ? $.memoizedState = Mo = e : Mo = Mo.next = e;
		}
		return Mo;
	}
	function Zo() {
		return {
			lastEffect: null,
			events: null,
			stores: null,
			memoCache: null
		};
	}
	function Qo(e) {
		var t = Lo;
		return Lo += 1, Ro === null && (Ro = []), e = Ha(Ro, e, t), t = $, (Mo === null ? t.memoizedState : Mo.next) === null && (t = t.alternate, H.H = t === null || t.memoizedState === null ? ac : oc), e;
	}
	function $o(e) {
		if (typeof e == "object" && e) {
			if (typeof e.then == "function") return Qo(e);
			if (e.$$typeof === ie) return;
			if (e.$$typeof === P) return pa(e);
		}
		throw Error(i(438, String(e)));
	}
	function es(e) {
		var t = null, n = $.updateQueue;
		if (n !== null && (t = n.memoCache), t == null) {
			var r = $.alternate;
			r !== null && (r = r.updateQueue, r !== null && (r = r.memoCache, r != null && (t = {
				data: r.data.map(function(e) {
					return e.slice();
				}),
				index: 0
			})));
		}
		if (t ??= {
			data: [],
			index: 0
		}, n === null && (n = Zo(), $.updateQueue = n), n.memoCache = t, n = t.data[t.index], n === void 0) for (n = t.data[t.index] = Array(e), r = 0; r < e; r++) n[r] = z;
		return t.index++, n;
	}
	function ts(e, t) {
		return typeof t == "function" ? t(e) : t;
	}
	function ns(e) {
		return rs(Xo(), jo, e);
	}
	function rs(e, t, n) {
		var r = e.queue;
		if (r === null) throw Error(i(311));
		r.lastRenderedReducer = n;
		var a = e.baseQueue, o = r.pending;
		if (o !== null) {
			if (a !== null) {
				var s = a.next;
				a.next = o.next, o.next = s;
			}
			t.baseQueue = a = o, r.pending = null;
		}
		if (o = e.baseState, a === null) e.memoizedState = o;
		else {
			t = a.next;
			var c = s = null, l = null, u = t, d = !1;
			do {
				var f = u.lane & -536870913;
				if (f === u.lane ? (Ao & f) === f : (Yu & f) === f) {
					var p = u.revertLane;
					if (p === 0) l !== null && (l = l.next = {
						lane: 0,
						revertLane: 0,
						gesture: null,
						action: u.action,
						hasEagerState: u.hasEagerState,
						eagerState: u.eagerState,
						next: null
					}), f === Da && (d = !0);
					else if ((Ao & p) === p) {
						u = u.next, p === Da && (d = !0);
						continue;
					} else f = {
						lane: 0,
						revertLane: u.revertLane,
						gesture: null,
						action: u.action,
						hasEagerState: u.hasEagerState,
						eagerState: u.eagerState,
						next: null
					}, l === null ? (c = l = f, s = o) : l = l.next = f, $.lanes |= p, rd |= p;
					f = u.action, Fo && n(o, f), o = u.hasEagerState ? u.eagerState : n(o, f);
				} else p = {
					lane: f,
					revertLane: u.revertLane,
					gesture: u.gesture,
					action: u.action,
					hasEagerState: u.hasEagerState,
					eagerState: u.eagerState,
					next: null
				}, l === null ? (c = l = p, s = o) : l = l.next = p, $.lanes |= f, rd |= f;
				u = u.next;
			} while (u !== null && u !== t);
			if (l === null ? s = o : l.next = c, !kr(o, e.memoizedState) && (Cc = !0, d && (n = Oa, n !== null))) throw n;
			e.memoizedState = o, e.baseState = s, e.baseQueue = l, r.lastRenderedState = o;
		}
		return a === null && (r.lanes = 0), [e.memoizedState, r.dispatch];
	}
	function is(e) {
		var t = Xo(), n = t.queue;
		if (n === null) throw Error(i(311));
		n.lastRenderedReducer = e;
		var r = n.dispatch, a = n.pending, o = t.memoizedState;
		if (a !== null) {
			n.pending = null;
			var s = a = a.next;
			do
				o = e(o, s.action), s = s.next;
			while (s !== a);
			kr(o, t.memoizedState) || (Cc = !0), t.memoizedState = o, t.baseQueue === null && (t.baseState = o), n.lastRenderedState = o;
		}
		return [o, r];
	}
	function as(e, t, n) {
		var r = $, a = Xo(), o = Q;
		if (o) {
			if (n === void 0) throw Error(i(407));
			n = n();
		} else n = t();
		var s = !kr((jo || a).memoizedState, n);
		if (s && (a.memoizedState = n, Cc = !0), a = a.queue, As(cs.bind(null, r, a, e), [e]), e = a.getSnapshot !== t || s || Mo !== null && !!(Mo.memoizedState.tag & 1), Ts(e ? 9 : 8, { destroy: void 0 }, ss.bind(null, r, a, n, t), null), e) {
			if (r.flags |= 2048, qu === null) throw Error(i(349));
			o || Ao & 127 || os(r, t, n);
		}
		return n;
	}
	function os(e, t, n) {
		e.flags |= 16384, e = {
			getSnapshot: t,
			value: n
		}, t = $.updateQueue, t === null ? (t = Zo(), $.updateQueue = t, t.stores = [e]) : (n = t.stores, n === null ? t.stores = [e] : n.push(e));
	}
	function ss(e, t, n, r) {
		t.value = n, t.getSnapshot = r, ls(t) && us(e);
	}
	function cs(e, t, n) {
		return n(function() {
			ls(t) && us(e);
		});
	}
	function ls(e) {
		var t = e.getSnapshot;
		e = e.value;
		try {
			var n = t();
			return !kr(e, n);
		} catch {
			return !0;
		}
	}
	function us(e) {
		var t = hi(e, 2);
		t !== null && jd(t, e, 2);
	}
	function ds(e) {
		var t = Yo();
		if (typeof e == "function") {
			var n = e;
			if (e = n(), Fo) {
				He(!0);
				try {
					n();
				} finally {
					He(!1);
				}
			}
		}
		return t.memoizedState = t.baseState = e, t.queue = {
			pending: null,
			lanes: 0,
			dispatch: null,
			lastRenderedReducer: ts,
			lastRenderedState: e
		}, t;
	}
	function fs(e, t, n, r) {
		return e.baseState = n, rs(e, jo, typeof r == "function" ? r : ts);
	}
	function ps(e, t, n, r, a) {
		if (tc(e)) throw Error(i(485));
		if (e = t.action, e !== null) {
			var o = {
				payload: a,
				action: e,
				next: null,
				isTransition: !0,
				status: "pending",
				value: null,
				reason: null,
				listeners: [],
				then: function(e) {
					o.listeners.push(e);
				}
			};
			H.T === null ? o.isTransition = !1 : n(!0), r(o), n = t.pending, n === null ? (o.next = t.pending = o, ms(t, o)) : (o.next = n.next, t.pending = n.next = o);
		}
	}
	function ms(e, t) {
		var n = t.action, r = t.payload, i = e.state;
		if (t.isTransition) {
			var a = H.T, o = {};
			o.types = a === null ? null : a.types, H.T = o;
			try {
				var s = n(i, r), c = H.S;
				c !== null && c(o, s), hs(e, t, s);
			} catch (n) {
				_s(e, t, n);
			} finally {
				a !== null && o.types !== null && (a.types = o.types), H.T = a;
			}
		} else try {
			a = n(i, r), hs(e, t, a);
		} catch (n) {
			_s(e, t, n);
		}
	}
	function hs(e, t, n) {
		typeof n == "object" && n && typeof n.then == "function" ? n.then(function(n) {
			gs(e, t, n);
		}, function(n) {
			return _s(e, t, n);
		}) : gs(e, t, n);
	}
	function gs(e, t, n) {
		t.status = "fulfilled", t.value = n, vs(t), e.state = n, t = e.pending, t !== null && (n = t.next, n === t ? e.pending = null : (n = n.next, t.next = n, ms(e, n)));
	}
	function _s(e, t, n) {
		var r = e.pending;
		if (e.pending = null, r !== null) {
			r = r.next;
			do
				t.status = "rejected", t.reason = n, vs(t), t = t.next;
			while (t !== r);
		}
		e.action = null;
	}
	function vs(e) {
		e = e.listeners;
		for (var t = 0; t < e.length; t++) (0, e[t])();
	}
	function ys(e, t) {
		return t;
	}
	function bs(e, t) {
		if (Q) {
			var n = qu.formState;
			if (n !== null) {
				a: {
					var r = $;
					if (Q) {
						if (Ki) {
							b: {
								for (var i = Ki, a = Ji; i.nodeType !== 8;) {
									if (!a) {
										i = null;
										break b;
									}
									if (i = lm(i.nextSibling), i === null) {
										i = null;
										break b;
									}
								}
								a = i.data, i = a === "F!" || a === "F" ? i : null;
							}
							if (i) {
								Ki = lm(i.nextSibling), r = i.data === "F!";
								break a;
							}
						}
						Xi(r);
					}
					r = !1;
				}
				r && (t = n[0]);
			}
		}
		return n = Yo(), n.memoizedState = n.baseState = t, r = {
			pending: null,
			lanes: 0,
			dispatch: null,
			lastRenderedReducer: ys,
			lastRenderedState: t
		}, n.queue = r, n = Qs.bind(null, $, r), r.dispatch = n, r = ds(!1), a = ec.bind(null, $, !1, r.queue), r = Yo(), i = {
			state: t,
			dispatch: null,
			action: e,
			pending: null
		}, r.queue = i, n = ps.bind(null, $, i, a, n), i.dispatch = n, r.memoizedState = e, [
			t,
			n,
			!1
		];
	}
	function xs(e) {
		return Ss(Xo(), jo, e);
	}
	function Ss(e, t, n) {
		if (t = rs(e, t, ys)[0], e = ns(ts)[0], typeof t == "object" && t && typeof t.then == "function") try {
			var r = Qo(t);
		} catch (e) {
			throw e === La ? za : e;
		}
		else r = t;
		t = Xo();
		var i = t.queue, a = i.dispatch;
		return n !== t.memoizedState && ($.flags |= 2048, Ts(9, { destroy: void 0 }, Cs.bind(null, i, n), null)), [
			r,
			a,
			e
		];
	}
	function Cs(e, t) {
		e.action = t;
	}
	function ws(e) {
		var t = Xo(), n = jo;
		if (n !== null) return Ss(t, n, e);
		Xo(), t = t.memoizedState, n = Xo();
		var r = n.queue.dispatch;
		return n.memoizedState = e, [
			t,
			r,
			!1
		];
	}
	function Ts(e, t, n, r) {
		return e = {
			tag: e,
			create: n,
			deps: r,
			inst: t,
			next: null
		}, t = $.updateQueue, t === null && (t = Zo(), $.updateQueue = t), n = t.lastEffect, n === null ? t.lastEffect = e.next = e : (r = n.next, n.next = e, e.next = r, t.lastEffect = e), e;
	}
	function Es() {
		return Xo().memoizedState;
	}
	function Ds(e, t, n, r) {
		var i = Yo();
		$.flags |= e, i.memoizedState = Ts(1 | t, { destroy: void 0 }, n, r === void 0 ? null : r);
	}
	function Os(e, t, n, r) {
		var i = Xo();
		r = r === void 0 ? null : r;
		var a = i.memoizedState.inst;
		jo !== null && r !== null && Vo(r, jo.memoizedState.deps) ? i.memoizedState = Ts(t, a, n, r) : ($.flags |= e, i.memoizedState = Ts(1 | t, a, n, r));
	}
	function ks(e, t) {
		Ds(8390656, 8, e, t);
	}
	function As(e, t) {
		Os(2048, 8, e, t);
	}
	function js(e) {
		$.flags |= 4;
		var t = $.updateQueue;
		if (t === null) t = Zo(), $.updateQueue = t, t.events = [e];
		else {
			var n = t.events;
			n === null ? t.events = [e] : n.push(e);
		}
	}
	function Ms(e) {
		var t = Xo().memoizedState;
		return js({
			ref: t,
			nextImpl: e
		}), function() {
			if (Ku & 2) throw Error(i(440));
			return t.impl.apply(void 0, arguments);
		};
	}
	function Ns(e, t) {
		return Os(4, 2, e, t);
	}
	function Ps(e, t) {
		return Os(4, 4, e, t);
	}
	function Fs(e, t) {
		if (typeof t == "function") {
			e = e();
			var n = t(e);
			return function() {
				typeof n == "function" ? n() : t(null);
			};
		}
		if (t != null) return e = e(), t.current = e, function() {
			t.current = null;
		};
	}
	function Is(e, t, n) {
		n = n == null ? null : n.concat([e]), Os(4, 4, Fs.bind(null, t, e), n);
	}
	function Ls() {}
	function Rs(e, t) {
		var n = Xo();
		t = t === void 0 ? null : t;
		var r = n.memoizedState;
		return t !== null && Vo(t, r[1]) ? r[0] : (n.memoizedState = [e, t], e);
	}
	function zs(e, t) {
		var n = Xo();
		t = t === void 0 ? null : t;
		var r = n.memoizedState;
		if (t !== null && Vo(t, r[1])) return r[0];
		if (r = e(), Fo) {
			He(!0);
			try {
				e();
			} finally {
				He(!1);
			}
		}
		return n.memoizedState = [r, t], r;
	}
	function Bs(e, t, n) {
		return n === void 0 || Ao & 1073741824 && !(Yu & 261930) ? e.memoizedState = t : (e.memoizedState = n, e = kd(), $.lanes |= e, rd |= e, n);
	}
	function Vs(e, t, n, r) {
		return kr(n, t) ? n : mo.current === null ? !(Ao & 106) || Ao & 1073741824 && !(Yu & 261930) ? (Cc = !0, e.memoizedState = n) : (e = kd(), $.lanes |= e, rd |= e, t) : (e = Bs(e, n, r), kr(e, t) || (Cc = !0), e);
	}
	function Hs(e, t, n, r, i) {
		var a = U.p;
		U.p = a !== 0 && 8 > a ? a : 8;
		var o = H.T, s = {};
		s.types = o === null ? null : o.types, H.T = s, ec(e, !1, t, n);
		try {
			var c = i(), l = H.S;
			l !== null && l(s, c), typeof c == "object" && c && typeof c.then == "function" ? $s(e, t, ja(c, r), Od(e)) : $s(e, t, r, Od(e));
		} catch (n) {
			$s(e, t, {
				then: function() {},
				status: "rejected",
				reason: n
			}, Od());
		} finally {
			U.p = a, o !== null && s.types !== null && (o.types = s.types), H.T = o;
		}
	}
	function Us() {}
	function Ws(e, t, n, r) {
		if (e.tag !== 5) throw Error(i(476));
		var a = Gs(e).queue;
		Hs(e, a, t, le, n === null ? Us : function() {
			return Ks(e), n(r);
		});
	}
	function Gs(e) {
		var t = e.memoizedState;
		if (t !== null) return t;
		t = {
			memoizedState: le,
			baseState: le,
			baseQueue: null,
			queue: {
				pending: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: ts,
				lastRenderedState: le
			},
			next: null
		};
		var n = {};
		return t.next = {
			memoizedState: n,
			baseState: n,
			baseQueue: null,
			queue: {
				pending: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: ts,
				lastRenderedState: n
			},
			next: null
		}, e.memoizedState = t, e = e.alternate, e !== null && (e.memoizedState = t), t;
	}
	function Ks(e) {
		var t = Gs(e);
		t.next === null && (t = e.alternate.memoizedState), $s(e, t.next.queue, {}, Od());
	}
	function qs() {
		return pa(sh);
	}
	function Js() {
		return Xo().memoizedState;
	}
	function Ys() {
		return Xo().memoizedState;
	}
	function Xs(e) {
		for (var t = e.return; t !== null;) {
			switch (t.tag) {
				case 24:
				case 3:
					var n = Od();
					e = io(n);
					var r = ao(t, e, n);
					r !== null && (jd(r, t, n), oo(r, t, n)), t = { cache: ba() }, e.payload = t;
					return;
			}
			t = t.return;
		}
	}
	function Zs(e, t, n) {
		var r = Od();
		n = {
			lane: r,
			revertLane: 0,
			gesture: null,
			action: n,
			hasEagerState: !1,
			eagerState: null,
			next: null
		}, tc(e) ? nc(t, n) : (n = mi(e, t, n, r), n !== null && (jd(n, e, r), rc(n, t, r)));
	}
	function Qs(e, t, n) {
		$s(e, t, n, Od());
	}
	function $s(e, t, n, r) {
		var i = {
			lane: r,
			revertLane: 0,
			gesture: null,
			action: n,
			hasEagerState: !1,
			eagerState: null,
			next: null
		};
		if (tc(e)) nc(t, i);
		else {
			var a = e.alternate;
			if (e.lanes === 0 && (a === null || a.lanes === 0) && (a = t.lastRenderedReducer, a !== null)) try {
				var o = t.lastRenderedState, s = a(o, n);
				if (i.hasEagerState = !0, i.eagerState = s, kr(s, o)) return pi(e, t, i, 0), qu === null && fi(), !1;
			} catch {}
			if (n = mi(e, t, i, r), n !== null) return jd(n, e, r), rc(n, t, r), !0;
		}
		return !1;
	}
	function ec(e, t, n, r) {
		if (r = {
			lane: 2,
			revertLane: Mf(),
			gesture: null,
			action: r,
			hasEagerState: !1,
			eagerState: null,
			next: null
		}, tc(e)) {
			if (t) throw Error(i(479));
		} else t = mi(e, n, r, 2), t !== null && jd(t, e, 2);
	}
	function tc(e) {
		var t = e.alternate;
		return e === $ || t !== null && t === $;
	}
	function nc(e, t) {
		Po = No = !0;
		var n = e.pending;
		n === null ? t.next = t : (t.next = n.next, n.next = t), e.pending = t;
	}
	function rc(e, t, n) {
		if (n & 4194048) {
			var r = t.lanes;
			r &= e.pendingLanes, n |= r, t.lanes = n, ot(e, n);
		}
	}
	var ic = {
		readContext: pa,
		use: $o,
		useCallback: Bo,
		useContext: Bo,
		useEffect: Bo,
		useImperativeHandle: Bo,
		useLayoutEffect: Bo,
		useInsertionEffect: Bo,
		useMemo: Bo,
		useReducer: Bo,
		useRef: Bo,
		useState: Bo,
		useDebugValue: Bo,
		useDeferredValue: Bo,
		useTransition: Bo,
		useSyncExternalStore: Bo,
		useId: Bo,
		useHostTransitionStatus: Bo,
		useFormState: Bo,
		useActionState: Bo,
		useOptimistic: Bo,
		useMemoCache: Bo,
		useCacheRefresh: Bo,
		useEffectEvent: Bo
	}, ac = {
		readContext: pa,
		use: $o,
		useCallback: function(e, t) {
			return Yo().memoizedState = [e, t === void 0 ? null : t], e;
		},
		useContext: pa,
		useEffect: ks,
		useImperativeHandle: function(e, t, n) {
			n = n == null ? null : n.concat([e]), Ds(4194308, 4, Fs.bind(null, t, e), n);
		},
		useLayoutEffect: function(e, t) {
			return Ds(4194308, 4, e, t);
		},
		useInsertionEffect: function(e, t) {
			Ds(4, 2, e, t);
		},
		useMemo: function(e, t) {
			var n = Yo();
			t = t === void 0 ? null : t;
			var r = e();
			if (Fo) {
				He(!0);
				try {
					e();
				} finally {
					He(!1);
				}
			}
			return n.memoizedState = [r, t], r;
		},
		useReducer: function(e, t, n) {
			var r = Yo();
			if (n !== void 0) {
				var i = n(t);
				if (Fo) {
					He(!0);
					try {
						n(t);
					} finally {
						He(!1);
					}
				}
			} else i = t;
			return r.memoizedState = r.baseState = i, e = {
				pending: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: e,
				lastRenderedState: i
			}, r.queue = e, e = e.dispatch = Zs.bind(null, $, e), [r.memoizedState, e];
		},
		useRef: function(e) {
			var t = Yo();
			return e = { current: e }, t.memoizedState = e;
		},
		useState: function(e) {
			e = ds(e);
			var t = e.queue, n = Qs.bind(null, $, t);
			return t.dispatch = n, [e.memoizedState, n];
		},
		useDebugValue: Ls,
		useDeferredValue: function(e, t) {
			return Bs(Yo(), e, t);
		},
		useTransition: function() {
			var e = ds(!1);
			return e = Hs.bind(null, $, e.queue, !0, !1), Yo().memoizedState = e, [!1, e];
		},
		useSyncExternalStore: function(e, t, n) {
			var r = $, a = Yo();
			if (Q) {
				if (n === void 0) throw Error(i(407));
				n = n();
			} else {
				if (n = t(), qu === null) throw Error(i(349));
				Yu & 127 || os(r, t, n);
			}
			a.memoizedState = n;
			var o = {
				value: n,
				getSnapshot: t
			};
			return a.queue = o, ks(cs.bind(null, r, o, e), [e]), r.flags |= 2048, Ts(9, { destroy: void 0 }, ss.bind(null, r, o, n, t), null), n;
		},
		useId: function() {
			var e = Yo(), t = qu.identifierPrefix;
			if (Q) {
				var n = zi, r = Ri;
				n = (r & ~(1 << 32 - Ue(r) - 1)).toString(32) + n, t = "_" + t + "R_" + n, n = Io++, 0 < n && (t += "H" + n.toString(32)), t += "_";
			} else n = zo++, t = "_" + t + "r_" + n.toString(32) + "_";
			return e.memoizedState = t;
		},
		useHostTransitionStatus: qs,
		useFormState: bs,
		useActionState: bs,
		useOptimistic: function(e) {
			var t = Yo();
			t.memoizedState = t.baseState = e;
			var n = {
				pending: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: null,
				lastRenderedState: null
			};
			return t.queue = n, t = ec.bind(null, $, !0, n), n.dispatch = t, [e, t];
		},
		useMemoCache: es,
		useCacheRefresh: function() {
			return Yo().memoizedState = Xs.bind(null, $);
		},
		useEffectEvent: function(e) {
			var t = Yo(), n = { impl: e };
			return t.memoizedState = n, function() {
				if (Ku & 2) throw Error(i(440));
				return n.impl.apply(void 0, arguments);
			};
		}
	}, oc = {
		readContext: pa,
		use: $o,
		useCallback: Rs,
		useContext: pa,
		useEffect: As,
		useImperativeHandle: Is,
		useInsertionEffect: Ns,
		useLayoutEffect: Ps,
		useMemo: zs,
		useReducer: ns,
		useRef: Es,
		useState: function() {
			return ns(ts);
		},
		useDebugValue: Ls,
		useDeferredValue: function(e, t) {
			return Vs(Xo(), jo.memoizedState, e, t);
		},
		useTransition: function() {
			var e = ns(ts)[0], t = Xo().memoizedState;
			return [typeof e == "boolean" ? e : Qo(e), t];
		},
		useSyncExternalStore: as,
		useId: Js,
		useHostTransitionStatus: qs,
		useFormState: xs,
		useActionState: xs,
		useOptimistic: function(e, t) {
			return fs(Xo(), jo, e, t);
		},
		useMemoCache: es,
		useCacheRefresh: Ys,
		useEffectEvent: Ms
	}, sc = {
		readContext: pa,
		use: $o,
		useCallback: Rs,
		useContext: pa,
		useEffect: As,
		useImperativeHandle: Is,
		useInsertionEffect: Ns,
		useLayoutEffect: Ps,
		useMemo: zs,
		useReducer: is,
		useRef: Es,
		useState: function() {
			return is(ts);
		},
		useDebugValue: Ls,
		useDeferredValue: function(e, t) {
			var n = Xo();
			return jo === null ? Bs(n, e, t) : Vs(n, jo.memoizedState, e, t);
		},
		useTransition: function() {
			var e = is(ts)[0], t = Xo().memoizedState;
			return [typeof e == "boolean" ? e : Qo(e), t];
		},
		useSyncExternalStore: as,
		useId: Js,
		useHostTransitionStatus: qs,
		useFormState: ws,
		useActionState: ws,
		useOptimistic: function(e, t) {
			var n = Xo();
			return jo === null ? (n.baseState = e, [e, n.queue.dispatch]) : fs(n, jo, e, t);
		},
		useMemoCache: es,
		useCacheRefresh: Ys,
		useEffectEvent: Ms
	};
	function cc(e, t, n, r) {
		t = e.memoizedState, n = n(r, t), n = n == null ? t : D({}, t, n), e.memoizedState = n, e.lanes === 0 && (e.updateQueue.baseState = n);
	}
	var lc = {
		enqueueSetState: function(e, t, n) {
			e = e._reactInternals;
			var r = Od(), i = io(r);
			i.payload = t, n != null && (i.callback = n), t = ao(e, i, r), t !== null && (jd(t, e, r), oo(t, e, r));
		},
		enqueueReplaceState: function(e, t, n) {
			e = e._reactInternals;
			var r = Od(), i = io(r);
			i.tag = 1, i.payload = t, n != null && (i.callback = n), t = ao(e, i, r), t !== null && (jd(t, e, r), oo(t, e, r));
		},
		enqueueForceUpdate: function(e, t) {
			e = e._reactInternals;
			var n = Od(), r = io(n);
			r.tag = 2, t != null && (r.callback = t), t = ao(e, r, n), t !== null && (jd(t, e, n), oo(t, e, n));
		}
	};
	function uc(e, t, n, r, i, a, o) {
		return e = e.stateNode, typeof e.shouldComponentUpdate == "function" ? e.shouldComponentUpdate(r, a, o) : t.prototype && t.prototype.isPureReactComponent ? !Ar(n, r) || !Ar(i, a) : !0;
	}
	function dc(e, t, n, r) {
		e = t.state, typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps(n, r), typeof t.UNSAFE_componentWillReceiveProps == "function" && t.UNSAFE_componentWillReceiveProps(n, r), t.state !== e && lc.enqueueReplaceState(t, t.state, null);
	}
	function fc(e, t) {
		var n = t;
		if ("ref" in t) for (var r in n = {}, t) r !== "ref" && (n[r] = t[r]);
		if (e = e.defaultProps) for (var i in n === t && (n = D({}, n)), e) n[i] === void 0 && (n[i] = e[i]);
		return n;
	}
	function pc(e) {
		ci(e);
	}
	function mc(e) {
		console.error(e);
	}
	function hc(e) {
		ci(e);
	}
	function gc(e, t) {
		try {
			var n = e.onUncaughtError;
			n(t.value, { componentStack: t.stack });
		} catch (e) {
			setTimeout(function() {
				throw e;
			});
		}
	}
	function _c(e, t, n) {
		try {
			var r = e.onCaughtError;
			r(n.value, {
				componentStack: n.stack,
				errorBoundary: t.tag === 1 ? t.stateNode : null
			});
		} catch (e) {
			setTimeout(function() {
				throw e;
			});
		}
	}
	function vc(e, t, n) {
		return n = io(n), n.tag = 3, n.payload = { element: null }, n.callback = function() {
			gc(e, t);
		}, n;
	}
	function yc(e) {
		return e = io(e), e.tag = 3, e;
	}
	function bc(e, t, n, r) {
		var i = n.type.getDerivedStateFromError;
		if (typeof i == "function") {
			var a = r.value;
			e.payload = function() {
				return i(a);
			}, e.callback = function() {
				_c(t, n, r);
			};
		}
		var o = n.stateNode;
		o !== null && typeof o.componentDidCatch == "function" && (e.callback = function() {
			_c(t, n, r), typeof i != "function" && (hd === null ? hd = /* @__PURE__ */ new Set([this]) : hd.add(this));
			var e = r.stack;
			this.componentDidCatch(r.value, { componentStack: e === null ? "" : e });
		});
	}
	function xc(e, t, n, r, a) {
		if (n.flags |= 32768, typeof r == "object" && r && typeof r.then == "function") {
			if (t = n.alternate, t !== null && ua(t, n, a, !0), n = yo.current, n !== null) {
				switch (n.tag) {
					case 31:
					case 13:
					case 19: return bo === null ? Ud() : n.alternate === null && nd === 0 && (nd = 3), n.flags &= -257, n.flags |= 65536, n.lanes = a, r === Ba ? n.flags |= 16384 : (t = n.updateQueue, t === null ? n.updateQueue = /* @__PURE__ */ new Set([r]) : t.add(r), ff(e, r, a)), !1;
					case 22: return n.flags |= 65536, r === Ba ? n.flags |= 16384 : (t = n.updateQueue, t === null ? (t = {
						transitions: null,
						markerInstances: null,
						retryQueue: /* @__PURE__ */ new Set([r])
					}, n.updateQueue = t) : (n = t.retryQueue, n === null ? t.retryQueue = /* @__PURE__ */ new Set([r]) : n.add(r)), ff(e, r, a)), !1;
				}
				throw Error(i(435, n.tag));
			}
			return ff(e, r, a), Ud(), !1;
		}
		if (Q) return t = yo.current, t === null ? (r !== Yi && (t = Error(i(423), { cause: r }), na(Ai(t, n))), e = e.current.alternate, e.flags |= 65536, a &= -a, e.lanes |= a, r = Ai(r, n), a = vc(e.stateNode, r, a), so(e, a), nd !== 4 && (nd = 2)) : (!(t.flags & 65536) && (t.flags |= 256), t.flags |= 65536, t.lanes = a, r !== Yi && (e = Error(i(422), { cause: r }), na(Ai(e, n)))), !1;
		var o = Error(i(520), { cause: r });
		if (o = Ai(o, n), cd === null ? cd = [o] : cd.push(o), nd !== 4 && (nd = 2), t === null) return !0;
		r = Ai(r, n), n = t;
		do {
			switch (n.tag) {
				case 3: return n.flags |= 65536, e = a & -a, n.lanes |= e, e = vc(n.stateNode, r, e), so(n, e), !1;
				case 1:
					if (t = n.type, o = n.stateNode, !(n.flags & 128) && (typeof t.getDerivedStateFromError == "function" || o !== null && typeof o.componentDidCatch == "function" && (hd === null || !hd.has(o)))) return n.flags |= 65536, a &= -a, n.lanes |= a, a = yc(a), bc(a, e, n, r), so(n, a), !1;
					break;
				case 22: if (n.memoizedState !== null) return n.flags |= 65536, !1;
			}
			n = n.return;
		} while (n !== null);
		return !1;
	}
	var Sc = Error(i(461)), Cc = !1;
	function wc(e, t, n, r) {
		t.child = e === null ? eo(t, null, n, r) : $a(t, e.child, n, r);
	}
	function Tc(e, t, n, r, i) {
		n = n.render;
		var a = t.ref;
		if ("ref" in r) {
			var o = {};
			for (var s in r) s !== "ref" && (o[s] = r[s]);
		} else o = r;
		return fa(t), r = Ho(e, t, n, o, a, i), s = Ko(), e !== null && !Cc ? (qo(e, t, i), $c(e, t, i)) : (Q && s && Hi(t), t.flags |= 1, wc(e, t, r, i), t.child);
	}
	function Ec(e, t, n, r, i) {
		if (e === null) {
			var a = n.type;
			return typeof a == "function" && !xi(a) && a.defaultProps === void 0 && n.compare === null ? (t.tag = 15, t.type = a, Dc(e, t, a, r, i)) : (e = wi(n.type, null, r, t, t.mode, i), e.ref = t.ref, e.return = t, t.child = e);
		}
		if (a = e.child, !el(e, i)) {
			var o = a.memoizedProps;
			if (n = n.compare, n = n === null ? Ar : n, n(o, r) && e.ref === t.ref) return $c(e, t, i);
		}
		return t.flags |= 1, e = Si(a, r), e.ref = t.ref, e.return = t, t.child = e;
	}
	function Dc(e, t, n, r, i) {
		if (e !== null) {
			var a = e.memoizedProps;
			if (Ar(a, r) && e.ref === t.ref) {
				if (Cc = !1, t.pendingProps = r = a, el(e, i)) e.flags & 131072 && (Cc = !0);
				else return t.lanes = e.lanes, $c(e, t, i);
			}
		}
		return Fc(e, t, n, r, i);
	}
	function Oc(e, t, n, r) {
		var i = r.children, a = e === null ? null : e.memoizedState;
		if (e === null && t.stateNode === null && (t.stateNode = {
			_visibility: 1,
			_pendingMarkers: null,
			_retryCache: null,
			_transitions: null
		}), r.mode === "hidden") {
			if (t.flags & 128) {
				if (a = a === null ? n : a.baseLanes | n, e !== null) {
					for (r = t.child = e.child, i = 0; r !== null;) i = i | r.lanes | r.childLanes, r = r.sibling;
					r = i & ~a;
				} else r = 0, t.child = null;
				return Ac(e, t, a, n, r);
			}
			if (n & 536870912) t.memoizedState = {
				baseLanes: 0,
				cachePool: null
			}, e !== null && Fa(t, a === null ? null : a.cachePool), a === null ? _o() : go(t, a), Co(t);
			else return r = t.lanes = 536870912, Ac(e, t, a === null ? n : a.baseLanes | n, n, r);
		} else a === null ? (e !== null && Fa(t, null), _o(), wo()) : (Fa(t, a.cachePool), go(t, a), wo(), t.memoizedState = null);
		return wc(e, t, i, n), t.child;
	}
	function kc(e, t) {
		return e !== null && e.tag === 22 || t.stateNode !== null || (t.stateNode = {
			_visibility: 1,
			_pendingMarkers: null,
			_retryCache: null,
			_transitions: null
		}), t.sibling;
	}
	function Ac(e, t, n, r, i) {
		var a = Pa();
		return a = a === null ? null : {
			parent: ya._currentValue,
			pool: a
		}, t.memoizedState = {
			baseLanes: n,
			cachePool: a
		}, e !== null && Fa(t, null), _o(), Co(t), e !== null && ua(e, t, r, !0), t.childLanes = i, null;
	}
	function jc(e, t) {
		return t = Wc({
			mode: t.mode,
			children: t.children
		}, e.mode), t.ref = e.ref, e.child = t, t.return = e, t;
	}
	function Mc(e, t, n) {
		return $a(t, e.child, null, n), e = jc(t, t.pendingProps), e.flags |= 2, To(t), t.memoizedState = null, e;
	}
	function Nc(e, t, n) {
		var r = t.pendingProps, a = !!(t.flags & 128);
		if (t.flags &= -129, e === null) {
			if (Q) {
				if (r.mode === "hidden") return e = jc(t, r), t.lanes = 536870912, e.memoizedState = {
					baseLanes: 0,
					cachePool: null
				}, kc(null, e);
				if (So(t), (e = Ki) ? (e = am(e, Ji), e = e !== null && e.data === "&" ? e : null, e !== null && (t.memoizedState = {
					dehydrated: e,
					treeContext: Li === null ? null : {
						id: Ri,
						overflow: zi
					},
					retryLane: 536870912,
					hydrationErrors: null
				}, n = Di(e), n.return = t, t.child = n, Gi = t, Ki = null)) : e = null, e === null) throw Xi(t);
				return t.lanes = 536870912, null;
			}
			return jc(t, r);
		}
		var o = e.memoizedState;
		if (o !== null) {
			var s = o.dehydrated;
			if (So(t), a) {
				if (t.flags & 256) t.flags &= -257, t = Mc(e, t, n);
				else if (t.memoizedState !== null) t.child = e.child, t.flags |= 128, t = null;
				else throw Error(i(558));
			} else if (Cc || ua(e, t, n, !1), a = (n & e.childLanes) !== 0, Cc || a) {
				if (mo.current === null) {
					if (r = qu, r !== null && (s = st(r, n), s !== 0 && s !== o.retryLane)) throw o.retryLane = s, hi(e, s), jd(r, e, s), Sc;
					Ud();
				}
				t = Mc(e, t, n);
			} else e = o.treeContext, Ki = lm(s.nextSibling), Gi = t, Q = !0, qi = null, Ji = !1, e !== null && Wi(t, e), t = jc(t, r), t.flags |= 134221824;
			return t;
		}
		return e = Si(e.child, {
			mode: r.mode,
			children: r.children
		}), e.ref = t.ref, t.child = e, e.return = t, e;
	}
	function Pc(e, t) {
		var n = t.ref;
		if (n === null) e !== null && e.ref !== null && (t.flags |= 4194816);
		else {
			if (typeof n != "function" && typeof n != "object") throw Error(i(284));
			(e === null || e.ref !== n) && (t.flags |= 4194816);
		}
	}
	function Fc(e, t, n, r, i) {
		return fa(t), n = Ho(e, t, n, r, void 0, i), r = Ko(), e !== null && !Cc ? (qo(e, t, i), $c(e, t, i)) : (Q && r && Hi(t), t.flags |= 1, wc(e, t, n, i), t.child);
	}
	function Ic(e, t, n, r, i, a) {
		return fa(t), t.updateQueue = null, n = Wo(t, r, n, i), Uo(e), r = Ko(), e !== null && !Cc ? (qo(e, t, a), $c(e, t, a)) : (Q && r && Hi(t), t.flags |= 1, wc(e, t, n, a), t.child);
	}
	function Lc(e, t, n, r, i) {
		if (fa(t), t.stateNode === null) {
			var a = vi, o = n.contextType;
			typeof o == "object" && o && (a = pa(o)), a = new n(r, a), t.memoizedState = a.state !== null && a.state !== void 0 ? a.state : null, a.updater = lc, t.stateNode = a, a._reactInternals = t, a = t.stateNode, a.props = r, a.state = t.memoizedState, a.refs = {}, no(t), o = n.contextType, a.context = typeof o == "object" && o ? pa(o) : vi, a.state = t.memoizedState, o = n.getDerivedStateFromProps, typeof o == "function" && (cc(t, n, o, r), a.state = t.memoizedState), typeof n.getDerivedStateFromProps == "function" || typeof a.getSnapshotBeforeUpdate == "function" || typeof a.UNSAFE_componentWillMount != "function" && typeof a.componentWillMount != "function" || (o = a.state, typeof a.componentWillMount == "function" && a.componentWillMount(), typeof a.UNSAFE_componentWillMount == "function" && a.UNSAFE_componentWillMount(), o !== a.state && lc.enqueueReplaceState(a, a.state, null), uo(t, r, a, i), lo(), a.state = t.memoizedState), typeof a.componentDidMount == "function" && (t.flags |= 4194308), r = !0;
		} else if (e === null) {
			a = t.stateNode;
			var s = t.memoizedProps, c = fc(n, s);
			a.props = c;
			var l = a.context, u = n.contextType;
			o = vi, typeof u == "object" && u && (o = pa(u));
			var d = n.getDerivedStateFromProps;
			u = typeof d == "function" || typeof a.getSnapshotBeforeUpdate == "function", s = t.pendingProps !== s, u || typeof a.UNSAFE_componentWillReceiveProps != "function" && typeof a.componentWillReceiveProps != "function" || (s || l !== o) && dc(t, a, r, o), to = !1;
			var f = t.memoizedState;
			a.state = f, uo(t, r, a, i), lo(), l = t.memoizedState, s || f !== l || to ? (typeof d == "function" && (cc(t, n, d, r), l = t.memoizedState), (c = to || uc(t, n, c, r, f, l, o)) ? (u || typeof a.UNSAFE_componentWillMount != "function" && typeof a.componentWillMount != "function" || (typeof a.componentWillMount == "function" && a.componentWillMount(), typeof a.UNSAFE_componentWillMount == "function" && a.UNSAFE_componentWillMount()), typeof a.componentDidMount == "function" && (t.flags |= 4194308)) : (typeof a.componentDidMount == "function" && (t.flags |= 4194308), t.memoizedProps = r, t.memoizedState = l), a.props = r, a.state = l, a.context = o, r = c) : (typeof a.componentDidMount == "function" && (t.flags |= 4194308), r = !1);
		} else {
			a = t.stateNode, ro(e, t), o = t.memoizedProps, u = fc(n, o), a.props = u, d = t.pendingProps, f = a.context, l = n.contextType, c = vi, typeof l == "object" && l && (c = pa(l)), s = n.getDerivedStateFromProps, (l = typeof s == "function" || typeof a.getSnapshotBeforeUpdate == "function") || typeof a.UNSAFE_componentWillReceiveProps != "function" && typeof a.componentWillReceiveProps != "function" || (o !== d || f !== c) && dc(t, a, r, c), to = !1, f = t.memoizedState, a.state = f, uo(t, r, a, i), lo();
			var p = t.memoizedState;
			o !== d || f !== p || to || e !== null && e.dependencies !== null && da(e.dependencies) ? (typeof s == "function" && (cc(t, n, s, r), p = t.memoizedState), (u = to || uc(t, n, u, r, f, p, c) || e !== null && e.dependencies !== null && da(e.dependencies)) ? (l || typeof a.UNSAFE_componentWillUpdate != "function" && typeof a.componentWillUpdate != "function" || (typeof a.componentWillUpdate == "function" && a.componentWillUpdate(r, p, c), typeof a.UNSAFE_componentWillUpdate == "function" && a.UNSAFE_componentWillUpdate(r, p, c)), typeof a.componentDidUpdate == "function" && (t.flags |= 4), typeof a.getSnapshotBeforeUpdate == "function" && (t.flags |= 1024)) : (typeof a.componentDidUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 4), typeof a.getSnapshotBeforeUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 1024), t.memoizedProps = r, t.memoizedState = p), a.props = r, a.state = p, a.context = c, r = u) : (typeof a.componentDidUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 4), typeof a.getSnapshotBeforeUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 1024), r = !1);
		}
		return a = r, Pc(e, t), r = !!(t.flags & 128), a || r ? (a = t.stateNode, n = r && typeof n.getDerivedStateFromError != "function" ? null : a.render(), t.flags |= 1, e !== null && r ? (t.child = $a(t, e.child, null, i), t.child = $a(t, null, n, i)) : wc(e, t, n, i), t.memoizedState = a.state, e = t.child) : e = $c(e, t, i), e;
	}
	function Rc(e, t, n, r) {
		return ea(), t.flags |= 256, wc(e, t, n, r), t.child;
	}
	var zc = {
		dehydrated: null,
		treeContext: null,
		retryLane: 0,
		hydrationErrors: null
	};
	function Bc(e) {
		return {
			baseLanes: e,
			cachePool: Ia()
		};
	}
	function Vc(e, t, n) {
		return e = e === null ? 0 : e.childLanes & ~n, t && (e |= od), e;
	}
	function Hc(e, t, n) {
		var r = t.pendingProps, i = !1, a = !!(t.flags & 128), o;
		if ((o = a) || (o = e !== null && e.memoizedState === null ? !1 : !!(Eo.current & 2)), o && (i = !0, t.flags &= -129), o = !!(t.flags & 32), t.flags &= -33, e === null) {
			if (Q) {
				if (i ? xo(t) : wo(), (e = Ki) ? (e = am(e, Ji), e = e !== null && e.data !== "&" ? e : null, e !== null && (t.memoizedState = {
					dehydrated: e,
					treeContext: Li === null ? null : {
						id: Ri,
						overflow: zi
					},
					retryLane: 536870912,
					hydrationErrors: null
				}, n = Di(e), n.return = t, t.child = n, Gi = t, Ki = null)) : e = null, e === null) throw Xi(t);
				return t.lanes = sm(e) ? 32 : 536870912, null;
			}
			return a = r.children, r = r.fallback, i ? (wo(), i = t.mode, a = Wc({
				mode: "hidden",
				children: a
			}, i), r = Ti(r, i, n, null), a.return = t, r.return = t, a.sibling = r, t.child = a, r = t.child, r.memoizedState = Bc(n), r.childLanes = Vc(e, o, n), t.memoizedState = zc, kc(null, r)) : (xo(t), Uc(t, a));
		}
		var s = e.memoizedState;
		if (s !== null) {
			var c = s.dehydrated;
			if (c !== null) return Kc(e, t, a, o, r, c, s, n);
		}
		return i ? (wo(), i = r.fallback, a = t.mode, s = e.child, c = s.sibling, r = Si(s, {
			mode: "hidden",
			children: r.children
		}), r.subtreeFlags = s.subtreeFlags & 1206910976, c === null ? (i = Ti(i, a, n, null), i.flags |= 2) : i = Si(c, i), i.return = t, r.return = t, r.sibling = i, t.child = r, kc(null, r), r = t.child, i = e.child.memoizedState, i === null ? i = Bc(n) : (a = i.cachePool, a === null ? a = Ia() : (s = ya._currentValue, a = a.parent === s ? a : {
			parent: s,
			pool: s
		}), i = {
			baseLanes: i.baseLanes | n,
			cachePool: a
		}), r.memoizedState = i, r.childLanes = Vc(e, o, n), t.memoizedState = zc, kc(e.child, r)) : (xo(t), n = e.child, e = n.sibling, n = Si(n, {
			mode: "visible",
			children: r.children
		}), n.return = t, n.sibling = null, e !== null && (o = t.deletions, o === null ? (t.deletions = [e], t.flags |= 16) : o.push(e)), t.child = n, t.memoizedState = null, n);
	}
	function Uc(e, t) {
		return t = Wc({
			mode: "visible",
			children: t
		}, e.mode), t.return = e, e.child = t;
	}
	function Wc(e, t) {
		return e = bi(22, e, null, t), e.lanes = 0, e;
	}
	function Gc(e, t, n) {
		return $a(t, e.child, null, n), e = Uc(t, t.pendingProps.children), e.flags |= 2, t.memoizedState = null, e;
	}
	function Kc(e, t, n, r, a, o, s, c) {
		if (n) return t.flags & 256 ? (xo(t), t.flags &= -257, Gc(e, t, c)) : t.memoizedState === null ? (wo(), o = a.fallback, s = t.mode, a = Wc({
			mode: "visible",
			children: a.children
		}, s), o = Ti(o, s, c, null), o.flags |= 2, a.return = t, o.return = t, a.sibling = o, t.child = a, $a(t, e.child, null, c), a = t.child, a.memoizedState = Bc(c), a.childLanes = Vc(e, r, c), t.memoizedState = zc, kc(null, a)) : (wo(), t.child = e.child, t.flags |= 128, null);
		if (xo(t), sm(o)) {
			if (r = o.nextSibling && o.nextSibling.dataset, r) var l = r.dgst;
			return r = l, r !== "" && (a = Error(i(419)), a.stack = "", a.digest = r, na({
				value: a,
				source: null,
				stack: null
			})), Gc(e, t, c);
		}
		if (Cc || ua(e, t, c, !1), r = (c & e.childLanes) !== 0, Cc || r) {
			if (mo.current !== null) return Gc(e, t, c);
			if (r = qu, r !== null && (a = st(r, c), a !== 0 && a !== s.retryLane)) throw s.retryLane = a, hi(e, a), jd(r, e, a), Sc;
			return om(o) || Ud(), Gc(e, t, c);
		}
		return om(o) ? (t.flags |= 192, t.child = e.child, null) : (e = s.treeContext, Ki = lm(o.nextSibling), Gi = t, Q = !0, qi = null, Ji = !1, e !== null && Wi(t, e), t = Uc(t, a.children), t.flags |= 134221824, t);
	}
	function qc(e, t, n) {
		e.lanes |= t;
		var r = e.alternate;
		r !== null && (r.lanes |= t), ca(e.return, t, n);
	}
	function Jc(e) {
		for (var t = null; e !== null;) {
			var n = e.alternate;
			n !== null && ko(n) === null && (t = e), e = e.sibling;
		}
		return t;
	}
	function Yc(e, t, n, r, i, a) {
		var o = e.memoizedState;
		o === null ? e.memoizedState = {
			isBackwards: t,
			rendering: null,
			renderingStartTime: 0,
			last: r,
			tail: n,
			tailMode: i,
			treeForkCount: a
		} : (o.isBackwards = t, o.rendering = null, o.renderingStartTime = 0, o.last = r, o.tail = n, o.tailMode = i, o.treeForkCount = a);
	}
	function Xc(e) {
		var t = e.child;
		for (e.child = null; t !== null;) {
			var n = t.sibling;
			t.sibling = e.child, e.child = t, t = n;
		}
	}
	function Zc(e, t, n) {
		var r = t.pendingProps, i = r.revealOrder, a = r.tail;
		r = r.children;
		var o = Eo.current;
		if (t.flags & 128) return Do(t, o), null;
		var s = !!(o & 2);
		if (s ? (o = o & 1 | 2, t.flags |= 128) : o &= 1, Do(t, o), i === "backwards" && e !== null ? (Xc(e), wc(e, t, r, n), Xc(e)) : wc(e, t, r, n), r = Q ? Pi : 0, !s && e !== null && e.flags & 128) a: for (e = t.child; e !== null;) {
			if (e.tag === 13) e.memoizedState !== null && qc(e, n, t);
			else if (e.tag === 19) qc(e, n, t);
			else if (e.child !== null) {
				e.child.return = e, e = e.child;
				continue;
			}
			if (e === t) break a;
			for (; e.sibling === null;) {
				if (e.return === null || e.return === t) break a;
				e = e.return;
			}
			e.sibling.return = e.return, e = e.sibling;
		}
		switch (i) {
			case "backwards":
				n = Jc(t.child), n === null ? (i = t.child, t.child = null) : (i = n.sibling, n.sibling = null, Xc(t)), Yc(t, !0, i, null, a, r);
				break;
			case "unstable_legacy-backwards":
				for (n = null, i = t.child, t.child = null; i !== null;) {
					if (e = i.alternate, e !== null && ko(e) === null) {
						t.child = i;
						break;
					}
					e = i.sibling, i.sibling = n, n = i, i = e;
				}
				Yc(t, !0, n, null, a, r);
				break;
			case "together":
				Yc(t, !1, null, null, void 0, r);
				break;
			case "independent":
				t.memoizedState = null;
				break;
			default: n = Jc(t.child), n === null ? (i = t.child, t.child = null) : (i = n.sibling, n.sibling = null), Yc(t, !1, i, n, a, r);
		}
		return t.child;
	}
	function Qc(e, t, n) {
		var r = t.pendingProps;
		return oa(t, t.type, r.value), wc(e, t, r.children, n), t.child;
	}
	function $c(e, t, n) {
		if (e !== null && (t.dependencies = e.dependencies), rd |= t.lanes, (n & t.childLanes) === 0) {
			if (e !== null) {
				if (ua(e, t, n, !1), (n & t.childLanes) === 0) return null;
			} else return null;
		}
		if (e !== null && t.child !== e.child) throw Error(i(153));
		if (t.child !== null) {
			for (e = t.child, n = Si(e, e.pendingProps), t.child = n, n.return = t; e.sibling !== null;) e = e.sibling, n = n.sibling = Si(e, e.pendingProps), n.return = t;
			n.sibling = null;
		}
		return t.child;
	}
	function el(e, t) {
		return (e.lanes & t) !== 0 || (e = e.dependencies, !!(e !== null && da(e)));
	}
	function tl(e, t, n) {
		switch (t.tag) {
			case 3:
				ge(t, t.stateNode.containerInfo), oa(t, ya, e.memoizedState.cache), ea();
				break;
			case 27:
			case 5:
				ve(t);
				break;
			case 4:
				ge(t, t.stateNode.containerInfo);
				break;
			case 10:
				oa(t, t.type, t.memoizedProps.value);
				break;
			case 31:
				if (t.memoizedState !== null) return t.flags |= 128, So(t), null;
				break;
			case 13:
				var r = t.memoizedState;
				if (r !== null) {
					if (r.dehydrated !== null) return xo(t), t.flags |= 128, null;
					r = ua(e, t, n, !1);
					var i = t.child.childLanes;
					return r || (n & i) !== 0 ? Hc(e, t, n) : (xo(t), e = $c(e, t, n), e === null ? null : e.sibling);
				}
				xo(t);
				break;
			case 19:
				if (t.flags & 128) return Zc(e, t, n);
				if (i = !!(e.flags & 128), r = (n & t.childLanes) !== 0, r ||= (ua(e, t, n, !1), (n & t.childLanes) !== 0), i) {
					if (r) return Zc(e, t, n);
					t.flags |= 128;
				}
				if (i = t.memoizedState, i !== null && (i.rendering = null, i.tail = null, i.lastEffect = null), Do(t, Eo.current), r) break;
				return null;
			case 22: return t.lanes = 0, Oc(e, t, n, t.pendingProps);
			case 24: oa(t, ya, e.memoizedState.cache);
		}
		return $c(e, t, n);
	}
	function nl(e, t, n) {
		if (e !== null) {
			if (e.memoizedProps !== t.pendingProps) Cc = !0;
			else {
				if (!el(e, n) && !(t.flags & 128)) return Cc = !1, tl(e, t, n);
				Cc = !!(e.flags & 131072);
			}
		} else Cc = !1, Q && t.flags & 1048576 && Vi(t, Pi, t.index);
		switch (t.lanes = 0, t.tag) {
			case 16:
				a: {
					var r = t.pendingProps;
					if (e = Ua(t.elementType), t.type = e, typeof e == "function") xi(e) ? (r = fc(e, r), t.tag = 1, t = Lc(null, t, e, r, n)) : (t.tag = 0, t = Fc(null, t, e, r, n));
					else {
						if (e != null) {
							var a = e.$$typeof;
							if (a === F) {
								t.tag = 11, t = Tc(null, t, e, r, n);
								break a;
							}
							if (a === te) {
								t.tag = 14, t = Ec(null, t, e, r, n);
								break a;
							}
							if (a === P) {
								t.tag = 10, t.type = e, t = Qc(null, t, n);
								break a;
							}
						}
						throw t = ce(e) || e, Error(i(306, t, ""));
					}
				}
				return t;
			case 0: return Fc(e, t, t.type, t.pendingProps, n);
			case 1: return r = t.type, a = fc(r, t.pendingProps), Lc(e, t, r, a, n);
			case 3:
				a: {
					if (ge(t, t.stateNode.containerInfo), e === null) throw Error(i(387));
					r = t.pendingProps;
					var o = t.memoizedState;
					a = o.element, ro(e, t), uo(t, r, null, n);
					var s = t.memoizedState;
					if (r = s.cache, oa(t, ya, r), r !== o.cache && la(t, [ya], n, !0), lo(), r = s.element, o.isDehydrated) {
						if (o = {
							element: r,
							isDehydrated: !1,
							cache: s.cache
						}, t.updateQueue.baseState = o, t.memoizedState = o, t.flags & 256) {
							t = Rc(e, t, r, n);
							break a;
						}
						if (r !== a) {
							a = Ai(Error(i(424)), t), na(a), t = Rc(e, t, r, n);
							break a;
						}
						switch (e = t.stateNode.containerInfo, e.nodeType) {
							case 9:
								e = e.body;
								break;
							default: e = e.nodeName === "HTML" ? e.ownerDocument.body : e;
						}
						for (Ki = lm(e.firstChild), Gi = t, Q = !0, qi = null, Ji = !0, n = eo(t, null, r, n), t.child = n; n;) n.flags = n.flags & -3 | 134221824, n = n.sibling;
					} else {
						if (ea(), r === a) {
							t = $c(e, t, n);
							break a;
						}
						wc(e, t, r, n);
					}
					t = t.child;
				}
				return t;
			case 26: return Pc(e, t), e === null ? (n = Nm(t.type, null, t.pendingProps, null)) ? t.memoizedState = n : Q || (t.stateNode = fp(t.type, t.pendingProps, me.current, t)) : t.memoizedState = Nm(t.type, e.memoizedProps, t.pendingProps, e.memoizedState), null;
			case 27: return ve(t), e === null && Q && (r = t.stateNode = hm(t.type, t.pendingProps, me.current), Gi = t, Ji = !0, a = Ki, Sp(t.type) ? (um = a, Ki = lm(r.firstChild)) : Ki = a), wc(e, t, t.pendingProps.children, n), Pc(e, t), e === null && (t.flags |= 4194304), t.child;
			case 5: return e === null && Q && ((a = r = Ki) && (r = rm(r, t.type, t.pendingProps, Ji), r === null ? a = !1 : (t.stateNode = r, Gi = t, Ki = lm(r.firstChild), Ji = !1, a = !0)), a || Xi(t)), ve(t), a = t.type, o = t.pendingProps, s = e === null ? null : e.memoizedProps, r = o.children, pp(a, o) ? r = null : s !== null && pp(a, s) && (t.flags |= 32), t.memoizedState !== null && (a = Ho(e, t, Go, null, null, n), sh._currentValue = a), Pc(e, t), wc(e, t, r, n), t.child;
			case 6: return e === null && Q && ((e = n = Ki) && (n = im(n, t.pendingProps, Ji), n === null ? e = !1 : (t.stateNode = n, Gi = t, Ki = null, e = !0)), e || Xi(t)), null;
			case 13: return Hc(e, t, n);
			case 4: return ge(t, t.stateNode.containerInfo), r = t.pendingProps, e === null ? t.child = $a(t, null, r, n) : wc(e, t, r, n), t.child;
			case 11: return Tc(e, t, t.type, t.pendingProps, n);
			case 7: return r = t.pendingProps, Pc(e, t), wc(e, t, r, n), t.child;
			case 8: return wc(e, t, t.pendingProps.children, n), t.child;
			case 12: return wc(e, t, t.pendingProps.children, n), t.child;
			case 10: return Qc(e, t, n);
			case 9: return a = t.type._context, r = t.pendingProps.children, fa(t), a = pa(a), r = r(a), t.flags |= 1, wc(e, t, r, n), t.child;
			case 14: return Ec(e, t, t.type, t.pendingProps, n);
			case 15: return Dc(e, t, t.type, t.pendingProps, n);
			case 19: return Zc(e, t, n);
			case 31: return Nc(e, t, n);
			case 22: return Oc(e, t, n, t.pendingProps);
			case 24: return fa(t), r = pa(ya), e === null ? (a = Pa(), a === null && (a = qu, o = ba(), a.pooledCache = o, o.refCount++, o !== null && (a.pooledCacheLanes |= n), a = o), t.memoizedState = {
				parent: r,
				cache: a
			}, no(t), oa(t, ya, a)) : ((e.lanes & n) !== 0 && (ro(e, t), uo(t, null, null, n), lo()), a = e.memoizedState, o = t.memoizedState, a.parent === r ? (r = o.cache, oa(t, ya, r), r !== a.cache && la(t, [ya], n, !0)) : (a = {
				parent: r,
				cache: r
			}, t.memoizedState = a, t.lanes === 0 && (t.memoizedState = t.updateQueue.baseState = a), oa(t, ya, r))), wc(e, t, t.pendingProps.children, n), t.child;
			case 30: return t.stateNode === null && (t.stateNode = {
				autoName: null,
				paired: null,
				clones: null,
				ref: null
			}), r = t.pendingProps, r.name != null && r.name !== "auto" ? t.flags |= e === null ? 18882560 : 18874368 : Q && Hi(t), e !== null && e.memoizedProps.name !== r.name ? t.flags |= 4194816 : Pc(e, t), wc(e, t, r.children, n), t.child;
			case 29: throw t.pendingProps;
		}
		throw Error(i(156, t.tag));
	}
	function rl(e) {
		e.flags |= 4;
	}
	function il(e, t, n, r, i) {
		var a;
		if ((a = !!(e.mode & 32)) && (a = n === null ? Jm(t, r) : Jm(t, r) && (r.src !== n.src || r.srcSet !== n.srcSet)), a) {
			if (e.flags |= 16777216, (i & 335544128) === i) {
				if (e.stateNode.complete) e.flags |= 8192;
				else if (Bd()) e.flags |= 8192;
				else throw Wa = Ba, Ra;
			}
		} else e.flags &= -16777217;
	}
	function al(e, t) {
		if (t.type !== "stylesheet" || t.state.loading & 4) e.flags &= -16777217;
		else if (e.flags |= 16777216, !Ym(t)) {
			if (Bd()) e.flags |= 8192;
			else throw Wa = Ba, Ra;
		}
	}
	function ol(e, t) {
		t !== null && (e.flags |= 4), e.flags & 16384 && (t = e.tag === 22 ? 536870912 : tt(), e.lanes |= t, sd |= t);
	}
	function sl(e, t) {
		if (!Q) switch (e.tailMode) {
			case "visible": break;
			case "collapsed":
				for (var n = e.tail, r = null; n !== null;) n.alternate !== null && (r = n), n = n.sibling;
				r === null ? t || e.tail === null ? e.tail = null : e.tail.sibling = null : r.sibling = null;
				break;
			default:
				for (t = e.tail, n = null; t !== null;) t.alternate !== null && (n = t), t = t.sibling;
				n === null ? e.tail = null : n.sibling = null;
		}
	}
	function cl(e) {
		var t = e.alternate !== null && e.alternate.child === e.child, n = 0, r = 0;
		if (t) for (var i = e.child; i !== null;) n |= i.lanes | i.childLanes, r |= i.subtreeFlags & 1206910976, r |= i.flags & 1206910976, i.return = e, i = i.sibling;
		else for (i = e.child; i !== null;) n |= i.lanes | i.childLanes, r |= i.subtreeFlags, r |= i.flags, i.return = e, i = i.sibling;
		return e.subtreeFlags |= r, e.childLanes = n, t;
	}
	function ll(e, t, n) {
		var r = t.pendingProps;
		switch (Ui(t), t.tag) {
			case 16:
			case 15:
			case 0:
			case 11:
			case 7:
			case 8:
			case 12:
			case 9:
			case 14: return cl(t), null;
			case 1: return cl(t), null;
			case 3: return n = t.stateNode, r = null, e !== null && (r = e.memoizedState.cache), t.memoizedState.cache !== r && (t.flags |= 2048), sa(ya), _e(), n.pendingContext && (n.context = n.pendingContext, n.pendingContext = null), (e === null || e.child === null) && ($i(t) ? rl(t) : e === null || e.memoizedState.isDehydrated && !(t.flags & 256) || (t.flags |= 1024, ta())), cl(t), null;
			case 26:
				var a = t.type, o = t.memoizedState;
				return e === null ? (rl(t), o === null ? (cl(t), il(t, a, null, r, n)) : (cl(t), al(t, o))) : o ? o === e.memoizedState ? (cl(t), t.flags &= -16777217) : (rl(t), cl(t), al(t, o)) : (e = e.memoizedProps, e !== r && rl(t), cl(t), il(t, a, e, r, n)), null;
			case 27:
				if (ye(t), n = me.current, a = t.type, e !== null && t.stateNode != null) e.memoizedProps !== r && rl(t);
				else {
					if (!r) {
						if (t.stateNode === null) throw Error(i(166));
						return cl(t), t.subtreeFlags &= -33554433, null;
					}
					e = pe.current, $i(t) ? Zi(t, e) : (e = hm(a, r, n), t.stateNode = e, rl(t));
				}
				return cl(t), t.subtreeFlags &= -33554433, null;
			case 5:
				if (ye(t), a = t.type, e !== null && t.stateNode != null) e.memoizedProps !== r && rl(t);
				else {
					if (!r) {
						if (t.stateNode === null) throw Error(i(166));
						return cl(t), t.subtreeFlags &= -33554433, null;
					}
					if (o = pe.current, $i(t)) Zi(t, o);
					else {
						var s = lp(me.current);
						switch (o) {
							case 1:
								o = s.createElementNS("http://www.w3.org/2000/svg", a);
								break;
							case 2:
								o = s.createElementNS("http://www.w3.org/1998/Math/MathML", a);
								break;
							default: switch (a) {
								case "svg":
									o = s.createElementNS("http://www.w3.org/2000/svg", a);
									break;
								case "math":
									o = s.createElementNS("http://www.w3.org/1998/Math/MathML", a);
									break;
								case "script":
									o = s.createElement("div"), o.innerHTML = "<script><\/script>", o = o.removeChild(o.firstChild);
									break;
								case "select":
									o = typeof r.is == "string" ? s.createElement("select", { is: r.is }) : s.createElement("select"), r.multiple ? o.multiple = !0 : r.size && (o.size = r.size);
									break;
								default: o = typeof r.is == "string" ? s.createElement(a, { is: r.is }) : s.createElement(a);
							}
						}
						o[pt] = t, o[mt] = r;
						a: for (s = t.child; s !== null;) {
							if (s.tag === 5 || s.tag === 6) o.appendChild(s.stateNode);
							else if (s.tag !== 4 && s.tag !== 27 && s.child !== null) {
								s.child.return = s, s = s.child;
								continue;
							}
							if (s === t) break a;
							for (; s.sibling === null;) {
								if (s.return === null || s.return === t) break a;
								s = s.return;
							}
							s.sibling.return = s.return, s = s.sibling;
						}
						t.stateNode = o;
						a: switch (np(o, a, r), a) {
							case "button":
							case "input":
							case "select":
							case "textarea":
								r = !!r.autoFocus;
								break a;
							case "img":
								r = !0;
								break a;
							default: r = !1;
						}
						r && rl(t);
					}
				}
				return cl(t), t.subtreeFlags &= -33554433, il(t, t.type, e === null ? null : e.memoizedProps, t.pendingProps, n), null;
			case 6:
				if (e && t.stateNode != null) e.memoizedProps !== r && rl(t);
				else {
					if (typeof r != "string" && t.stateNode === null) throw Error(i(166));
					if (e = me.current, $i(t)) {
						if (e = t.stateNode, n = t.memoizedProps, r = null, a = Gi, a !== null) switch (a.tag) {
							case 27:
							case 5: r = a.memoizedProps;
						}
						e[pt] = t, e = !!(e.nodeValue === n || r !== null && !0 === r.suppressHydrationWarning || $f(e.nodeValue, n)), e || Xi(t, !0);
					} else e = lp(e).createTextNode(r), e[pt] = t, t.stateNode = e;
				}
				return cl(t), null;
			case 31:
				if (n = t.memoizedState, e === null || e.memoizedState !== null) {
					if (r = $i(t), n !== null) {
						if (e === null) {
							if (!r) throw Error(i(318));
							if (e = t.memoizedState, e = e === null ? null : e.dehydrated, !e) throw Error(i(557));
							e[pt] = t;
						} else ea(), !(t.flags & 128) && (t.memoizedState = null), t.flags |= 4;
						cl(t), e = !1;
					} else n = ta(), e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = n), e = !0;
					if (!e) return t.flags & 256 ? (To(t), t) : (To(t), null);
					if (t.flags & 128) throw Error(i(558));
				}
				return cl(t), null;
			case 13:
				if (r = t.memoizedState, e === null || e.memoizedState !== null && e.memoizedState.dehydrated !== null) {
					if (a = $i(t), r !== null && r.dehydrated !== null) {
						if (e === null) {
							if (!a) throw Error(i(318));
							if (a = t.memoizedState, a = a === null ? null : a.dehydrated, !a) throw Error(i(317));
							a[pt] = t;
						} else ea(), !(t.flags & 128) && (t.memoizedState = null), t.flags |= 4;
						cl(t), a = !1;
					} else a = ta(), e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = a), a = !0;
					if (!a) return t.flags & 256 ? (To(t), t) : (To(t), null);
				}
				return To(t), t.flags & 128 ? (t.lanes = n, t) : (n = r !== null, e = e !== null && e.memoizedState !== null, n && (r = t.child, a = null, r.alternate !== null && r.alternate.memoizedState !== null && r.alternate.memoizedState.cachePool !== null && (a = r.alternate.memoizedState.cachePool.pool), o = null, r.memoizedState !== null && r.memoizedState.cachePool !== null && (o = r.memoizedState.cachePool.pool), o !== a && (r.flags |= 2048)), n !== e && n && (t.child.flags |= 8192), ol(t, t.updateQueue), cl(t), null);
			case 4: return _e(), e === null && Uf(t.stateNode.containerInfo), t.flags |= 67108864, cl(t), null;
			case 10: return sa(t.type), cl(t), null;
			case 19:
				if (Oo(t), r = t.memoizedState, r === null) return cl(t), null;
				if (a = !!(t.flags & 128), o = r.rendering, o === null) {
					if (a) sl(r, !1);
					else {
						if (nd !== 0 || e !== null && e.flags & 128) for (e = t.child; e !== null;) {
							if (o = ko(e), o !== null) {
								for (t.flags |= 128, sl(r, !1), e = o.updateQueue, t.updateQueue = e, ol(t, e), t.subtreeFlags = 0, e = n, n = t.child; n !== null;) Ci(n, e), n = n.sibling;
								return Do(t, Eo.current & 1 | 2), Q && Bi(t, r.treeForkCount), t.child;
							}
							e = e.sibling;
						}
						r.tail !== null && Me() > pd && (t.flags |= 128, a = !0, sl(r, !1), t.lanes = 4194304);
					}
				} else {
					if (!a) {
						if (e = ko(o), e !== null) {
							if (t.flags |= 128, a = !0, e = e.updateQueue, t.updateQueue = e, ol(t, e), sl(r, !0), r.tail === null && r.tailMode !== "collapsed" && r.tailMode !== "visible" && !o.alternate && !Q) return cl(t), null;
						} else 2 * Me() - r.renderingStartTime > pd && n !== 536870912 && (t.flags |= 128, a = !0, sl(r, !1), t.lanes = 4194304);
					}
					r.isBackwards ? (o.sibling = t.child, t.child = o) : (e = r.last, e === null ? t.child = o : e.sibling = o, r.last = o);
				}
				if (r.tail !== null) {
					e = r.tail;
					a: {
						for (n = e; n !== null;) {
							if (n.alternate !== null) {
								n = !1;
								break a;
							}
							n = n.sibling;
						}
						n = !0;
					}
					return r.rendering = e, r.tail = e.sibling, r.renderingStartTime = Me(), e.sibling = null, o = Eo.current, o = a ? o & 1 | 2 : o & 1, r.tailMode === "visible" || r.tailMode === "collapsed" || !n || Q ? Do(t, o) : (n = o, G(yo, t), G(Eo, n), bo === null && (bo = t)), Q && Bi(t, r.treeForkCount), e;
				}
				return cl(t), null;
			case 22:
			case 23: return To(t), vo(), r = t.memoizedState !== null, e === null ? r && (t.flags |= 8192) : e.memoizedState !== null !== r && (t.flags |= 8192), r ? n & 536870912 && !(t.flags & 128) && (cl(t), t.subtreeFlags & 6 && (t.flags |= 8192)) : cl(t), n = t.updateQueue, n !== null && ol(t, n.retryQueue), n = null, e !== null && e.memoizedState !== null && e.memoizedState.cachePool !== null && (n = e.memoizedState.cachePool.pool), r = null, t.memoizedState !== null && t.memoizedState.cachePool !== null && (r = t.memoizedState.cachePool.pool), r !== n && (t.flags |= 2048), e !== null && W(Na), null;
			case 24: return n = null, e !== null && (n = e.memoizedState.cache), t.memoizedState.cache !== n && (t.flags |= 2048), sa(ya), cl(t), null;
			case 25: return null;
			case 30: return t.flags |= 33554432, cl(t), null;
		}
		throw Error(i(156, t.tag));
	}
	function ul(e, t) {
		switch (Ui(t), t.tag) {
			case 1: return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 3: return sa(ya), _e(), e = t.flags, e & 65536 && !(e & 128) ? (t.flags = e & -65537 | 128, t) : null;
			case 26:
			case 27:
			case 5: return ye(t), null;
			case 31:
				if (t.memoizedState !== null) {
					if (To(t), t.alternate === null) throw Error(i(340));
					ea();
				}
				return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 13:
				if (To(t), e = t.memoizedState, e !== null && e.dehydrated !== null) {
					if (t.alternate === null) throw Error(i(340));
					ea();
				}
				return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 19: return Oo(t), e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, e = t.memoizedState, e !== null && (e.rendering = null, e.tail = null), t.flags |= 4, t) : null;
			case 4: return _e(), null;
			case 10: return sa(t.type), null;
			case 22:
			case 23: return To(t), vo(), e !== null && W(Na), e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 24: return sa(ya), null;
			case 25: return null;
			default: return null;
		}
	}
	function dl(e, t) {
		switch (Ui(t), t.tag) {
			case 3:
				sa(ya), _e();
				break;
			case 26:
			case 27:
			case 5:
				ye(t);
				break;
			case 4:
				_e();
				break;
			case 31:
				t.memoizedState !== null && To(t);
				break;
			case 13:
				To(t);
				break;
			case 19:
				Oo(t);
				break;
			case 10:
				sa(t.type);
				break;
			case 22:
			case 23:
				To(t), vo(), e !== null && W(Na);
				break;
			case 24: sa(ya);
		}
	}
	function fl(e, t) {
		try {
			var n = t.updateQueue, r = n === null ? null : n.lastEffect;
			if (r !== null) {
				var i = r.next;
				n = i;
				do {
					if ((n.tag & e) === e) {
						r = void 0;
						var a = n.create, o = n.inst;
						r = a(), o.destroy = r;
					}
					n = n.next;
				} while (n !== i);
			}
		} catch (e) {
			df(t, t.return, e);
		}
	}
	function pl(e, t, n) {
		try {
			var r = t.updateQueue, i = r === null ? null : r.lastEffect;
			if (i !== null) {
				var a = i.next;
				r = a;
				do {
					if ((r.tag & e) === e) {
						var o = r.inst, s = o.destroy;
						if (s !== void 0) {
							o.destroy = void 0, i = t;
							var c = n, l = s;
							try {
								l();
							} catch (e) {
								df(i, c, e);
							}
						}
					}
					r = r.next;
				} while (r !== a);
			}
		} catch (e) {
			df(t, t.return, e);
		}
	}
	function ml(e) {
		var t = e.updateQueue;
		if (t !== null) {
			var n = e.stateNode;
			try {
				po(t, n);
			} catch (t) {
				df(e, e.return, t);
			}
		}
	}
	function hl(e, t, n) {
		n.props = fc(e.type, e.memoizedProps), n.state = e.memoizedState;
		try {
			n.componentWillUnmount();
		} catch (n) {
			df(e, t, n);
		}
	}
	function gl(e, t) {
		try {
			var n = e.ref;
			if (n !== null) {
				switch (e.tag) {
					case 26:
					case 27:
					case 5:
						var r = e.stateNode;
						break;
					case 30:
						var i = e.stateNode, a = ai(e.memoizedProps, i);
						(i.ref === null || i.ref.name !== a) && (i.ref = Pp(a)), r = i.ref;
						break;
					case 7:
						if (e.stateNode === null) {
							var o = new Fp(e);
							h(e.child, !1, Qp, o, void 0, void 0), e.stateNode = o;
						}
						r = e.stateNode;
						break;
					default: r = e.stateNode;
				}
				typeof n == "function" ? e.refCleanup = n(r) : n.current = r;
			}
		} catch (n) {
			df(e, t, n);
		}
	}
	function _l(e, t) {
		var n = e.ref, r = e.refCleanup;
		if (n !== null) {
			if (typeof r == "function") try {
				r();
			} catch (n) {
				df(e, t, n);
			} finally {
				e.refCleanup = null, e = e.alternate, e != null && (e.refCleanup = null);
			}
			else if (typeof n == "function") try {
				n(null);
			} catch (n) {
				df(e, t, n);
			}
			else n.current = null;
		}
	}
	function vl(e, t) {
		if ((e.tag === 5 || e.tag === 27 || e.tag === 6) && e.alternate === null && t !== null) for (var n = 0; n < t.length; n++) em(e.stateNode, t[n]);
	}
	function yl(e) {
		for (var t = e.return; t !== null && (Sl(t) && em(e.stateNode, t.stateNode), !xl(t));) t = t.return;
	}
	function bl(e) {
		for (var t = e.return; t !== null && (Sl(t) && tm(e.stateNode, t.stateNode), !xl(t));) t = t.return;
	}
	function xl(e) {
		return e.tag === 5 || e.tag === 3 || e.tag === 27;
	}
	function Sl(e) {
		return e && e.tag === 7 && e.stateNode !== null;
	}
	function Cl(e) {
		var t = e.type, n = e.memoizedProps, r = e.stateNode;
		try {
			a: switch (t) {
				case "button":
				case "input":
				case "select":
				case "textarea":
					n.autoFocus && r.focus();
					break a;
				case "img": n.src ? r.src = n.src : n.srcSet && (r.srcset = n.srcSet);
			}
		} catch (t) {
			df(e, e.return, t);
		}
	}
	function wl(e, t, n) {
		try {
			var r = e.stateNode;
			ip(r, e.type, n, t), r[mt] = t;
		} catch (t) {
			df(e, e.return, t);
		}
	}
	function Tl(e) {
		return e.tag === 5 || e.tag === 3 || e.tag === 26 || e.tag === 27 && Sp(e.type) || e.tag === 4;
	}
	function El(e) {
		a: for (;;) {
			for (; e.sibling === null;) {
				if (e.return === null || Tl(e.return)) return null;
				e = e.return;
			}
			for (e.sibling.return = e.return, e = e.sibling; e.tag !== 5 && e.tag !== 6 && e.tag !== 18;) {
				if (e.tag === 27 && Sp(e.type) || e.flags & 2 || e.child === null || e.tag === 4) continue a;
				e.child.return = e, e = e.child;
			}
			if (!(e.flags & 2)) return e.stateNode;
		}
	}
	function Dl(e, t, n, r) {
		var i = e.tag;
		if (i === 5 || i === 6) i = e.stateNode, t ? (n.nodeType === 9 ? n.body : n.nodeName === "HTML" ? n.ownerDocument.body : n).insertBefore(i, t) : (t = n.nodeType === 9 ? n.body : n.nodeName === "HTML" ? n.ownerDocument.body : n, t.appendChild(i), n = n._reactRootContainer, n != null || t.onclick !== null || (t.onclick = on)), vl(e, r), It = !0;
		else if (i !== 4 && (i === 27 && (vl(e, r), r = null, Sp(e.type) && (n = e.stateNode, t = null)), e = e.child, e !== null)) for (Dl(e, t, n, r), e = e.sibling; e !== null;) Dl(e, t, n, r), e = e.sibling;
	}
	function Ol(e, t, n, r) {
		var i = e.tag;
		if (i === 5 || i === 6) i = e.stateNode, t ? n.insertBefore(i, t) : n.appendChild(i), vl(e, r), It = !0;
		else if (i !== 4 && (i === 27 && (vl(e, r), r = null, Sp(e.type) && (n = e.stateNode)), e = e.child, e !== null)) for (Ol(e, t, n, r), e = e.sibling; e !== null;) Ol(e, t, n, r), e = e.sibling;
	}
	function kl(e) {
		var t = e.stateNode, n = e.memoizedProps;
		try {
			for (var r = e.type, i = t.attributes; i.length;) t.removeAttributeNode(i[0]);
			np(t, r, n), t[pt] = e, t[mt] = n;
		} catch (t) {
			df(e, e.return, t);
		}
	}
	var Al = !1, jl = null;
	function Ml(e) {
		(e.tag === 30 || e.subtreeFlags & 33554432) && (Al = !0);
	}
	var Nl = null;
	function Pl() {
		var e = Nl;
		return Nl = null, e;
	}
	var Fl = 0;
	function Il(e, t, n, r, i) {
		return Fl = 0, Ll(e.child, t, n, r, i);
	}
	function Ll(e, t, n, r, i) {
		for (var a = !1; e !== null;) {
			if (e.tag === 5) {
				var o = e.stateNode;
				if (r !== null) {
					var s = Op(o);
					r.push(s), s.view && (a = !0);
				} else a || Op(o).view && (a = !0);
				Al = !0, Tp(o, Fl === 0 ? t : t + "_" + Fl, n), Fl++;
			} else (e.tag !== 22 || e.memoizedState === null) && (e.tag === 30 && i || Ll(e.child, t, n, r, i) && (a = !0));
			e = e.sibling;
		}
		return a;
	}
	function Rl(e, t) {
		for (; e !== null;) e.tag === 5 ? Ep(e.stateNode, e.memoizedProps) : (e.tag !== 22 || e.memoizedState === null) && (e.tag === 30 && t || Rl(e.child, t)), e = e.sibling;
	}
	function zl(e) {
		if (e.subtreeFlags & 18874368) for (e = e.child; e !== null;) {
			if ((e.tag !== 22 || e.memoizedState === null) && (zl(e), e.tag === 30 && e.flags & 18874368 && e.stateNode.paired)) {
				var t = e.memoizedProps;
				if (t.name == null || t.name === "auto") throw Error(i(544));
				var n = t.name;
				t = si(t.default, t.share), t !== "none" && (Il(e, n, t, null, !1) || Rl(e.child, !1));
			}
			e = e.sibling;
		}
	}
	function Bl(e, t) {
		if (e.tag === 30) {
			var n = e.stateNode, r = e.memoizedProps, i = ai(r, n), a = si(r.default, n.paired ? r.share : r.enter);
			a === "none" ? zl(e) : Il(e, i, a, null, !1) ? (zl(e), n.paired || t || Ad(e, r.onEnter)) : Rl(e.child, !1);
		} else if (e.subtreeFlags & 33554432) for (e = e.child; e !== null;) Bl(e, t), e = e.sibling;
		else zl(e);
	}
	function Vl(e) {
		if (jl !== null && jl.size !== 0) {
			var t = jl;
			if (e.subtreeFlags & 18874368) for (e = e.child; e !== null;) {
				if (e.tag !== 22 || e.memoizedState === null) {
					if (e.tag === 30 && e.flags & 18874368) {
						var n = e.memoizedProps, r = n.name;
						if (r != null && r !== "auto") {
							var i = t.get(r);
							if (i !== void 0) {
								var a = si(n.default, n.share);
								if (a !== "none" && (Il(e, r, a, null, !1) ? (a = e.stateNode, i.paired = a, a.paired = i, Ad(e, n.onShare)) : Rl(e.child, !1)), t.delete(r), t.size === 0) break;
							}
						}
					}
					Vl(e);
				}
				e = e.sibling;
			}
		}
	}
	function Hl(e) {
		if (e.tag === 30) {
			var t = e.memoizedProps, n = ai(t, e.stateNode), r = jl === null ? void 0 : jl.get(n), i = si(t.default, r === void 0 ? t.exit : t.share);
			i !== "none" && (Il(e, n, i, null, !1) ? r === void 0 ? Ad(e, t.onExit) : (i = e.stateNode, r.paired = i, i.paired = r, jl.delete(n), Ad(e, t.onShare)) : Rl(e.child, !1)), jl !== null && Vl(e);
		} else if (e.subtreeFlags & 33554432) for (e = e.child; e !== null;) Hl(e), e = e.sibling;
		else jl !== null && Vl(e);
	}
	function Ul(e) {
		for (e = e.child; e !== null;) {
			if (e.tag === 30) {
				var t = e.memoizedProps, n = ai(t, e.stateNode);
				t = si(t.default, t.update), e.flags &= -5, t !== "none" && Il(e, n, t, e.memoizedState = [], !1);
			} else e.subtreeFlags & 33554432 && Ul(e);
			e = e.sibling;
		}
	}
	function Wl(e) {
		if (e.subtreeFlags & 18874368) for (e = e.child; e !== null;) {
			if (e.tag !== 22 || e.memoizedState === null) {
				if (e.tag === 30 && e.flags & 18874368) {
					var t = e.stateNode;
					t.paired !== null && (t.paired = null, Rl(e.child, !1));
				}
				Wl(e);
			}
			e = e.sibling;
		}
	}
	function Gl(e) {
		if (e.tag === 30) e.stateNode.paired = null, Rl(e.child, !1), Wl(e);
		else if (e.subtreeFlags & 33554432) for (e = e.child; e !== null;) Gl(e), e = e.sibling;
		else Wl(e);
	}
	function Kl(e) {
		for (e = e.child; e !== null;) e.tag === 30 ? Rl(e.child, !1) : e.subtreeFlags & 33554432 && Kl(e), e = e.sibling;
	}
	function ql(e, t, n, r, i, a, o) {
		for (var s = !1; t !== null;) {
			if (t.tag === 5) {
				var c = t.stateNode;
				if (a !== null && Fl < a.length) {
					var l = a[Fl], u = Op(c);
					(l.view || u.view) && (s = !0);
					var d;
					if (d = !(e.flags & 4)) {
						if (u.clip) d = !0;
						else {
							d = l.rect;
							var f = u.rect;
							d = d.y !== f.y || d.x !== f.x || d.height !== f.height || d.width !== f.width;
						}
					}
					d && (e.flags |= 4), u.abs ? u = !l.abs : (l = l.rect, u = u.rect, u = l.height !== u.height || l.width !== u.width), u && (e.flags |= 32);
				} else e.flags |= 32;
				e.flags & 4 && Tp(c, Fl === 0 ? n : n + "_" + Fl, i), s && e.flags & 4 || (Nl === null && (Nl = []), Nl.push(c, Fl === 0 ? r : r + "_" + Fl, t.memoizedProps)), Fl++;
			} else (t.tag !== 22 || t.memoizedState === null) && (t.tag === 30 && o ? e.flags |= t.flags & 32 : ql(e, t.child, n, r, i, a, o) && (s = !0));
			t = t.sibling;
		}
		return s;
	}
	function Jl(e, t) {
		for (e = e.child; e !== null;) {
			if (e.tag === 30) {
				var n = e.memoizedProps, r = e.stateNode, i = ai(n, r), a = si(n.default, n.update);
				if (t) {
					r = r.clones;
					var o = r === null ? null : r.map(kp);
				} else o = e.memoizedState, e.memoizedState = null;
				r = e;
				var s = e.child;
				Fl = 0, i = ql(r, s, i, i, a, o, !1), e.flags & 4 && i && (t || Ad(e, n.onUpdate));
			} else e.subtreeFlags & 33554432 && Jl(e, t);
			e = e.sibling;
		}
	}
	var Yl = !1, Xl = !1, Zl = !1, Ql = !1, $l = typeof WeakSet == "function" ? WeakSet : Set, eu = null, tu = !1, nu = !1, ru = !1, iu = !1;
	function au(e, t, n) {
		if (e = e.containerInfo, sp = gh, e = Fr(e), Ir(e)) {
			if ("selectionStart" in e) var r = {
				start: e.selectionStart,
				end: e.selectionEnd
			};
			else a: {
				r = (r = e.ownerDocument) && r.defaultView || window;
				var i = r.getSelection && r.getSelection();
				if (i && i.rangeCount !== 0) {
					r = i.anchorNode;
					var a = i.anchorOffset, o = i.focusNode;
					i = i.focusOffset;
					try {
						r.nodeType, o.nodeType;
					} catch {
						r = null;
						break a;
					}
					var s = 0, c = -1, l = -1, u = 0, d = 0, f = e, p = null;
					b: for (;;) {
						for (var m; f !== r || a !== 0 && f.nodeType !== 3 || (c = s + a), f !== o || i !== 0 && f.nodeType !== 3 || (l = s + i), f.nodeType === 3 && (s += f.nodeValue.length), (m = f.firstChild) !== null;) p = f, f = m;
						for (;;) {
							if (f === e) break b;
							if (p === r && ++u === a && (c = s), p === o && ++d === i && (l = s), (m = f.nextSibling) !== null) break;
							f = p, p = f.parentNode;
						}
						f = m;
					}
					r = c === -1 || l === -1 ? null : {
						start: c,
						end: l
					};
				} else r = null;
			}
			r ||= {
				start: 0,
				end: 0
			};
		} else r = null;
		for (cp = {
			focusedElem: e,
			selectionRange: r
		}, gh = !1, n = (n & 335544064) === n, eu = t, t = n ? 9270 : 1024; eu !== null;) {
			if (e = eu, n && (r = e.deletions, r !== null)) for (a = 0; a < r.length; a++) n && Hl(r[a]);
			if (e.alternate === null && e.flags & 2) n && Ml(e), ou(n);
			else {
				if (e.tag === 22) {
					if (r = e.alternate, e.memoizedState !== null) {
						r !== null && r.memoizedState === null && n && Hl(r), ou(n);
						continue;
					}
					if (r !== null && r.memoizedState !== null) {
						n && Ml(e), ou(n);
						continue;
					}
				}
				r = e.child, (e.subtreeFlags & t) !== 0 && r !== null ? (r.return = e, eu = r) : (n && Ul(e), ou(n));
			}
		}
		jl = null;
	}
	function ou(e) {
		for (; eu !== null;) {
			var t = eu, n = e, r = t.alternate, a = t.flags;
			switch (t.tag) {
				case 0:
				case 11:
				case 15: break;
				case 1:
					if (a & 1024 && r !== null) {
						n = void 0, a = r.memoizedProps, r = r.memoizedState;
						var o = t.stateNode;
						try {
							var s = fc(t.type, a);
							n = o.getSnapshotBeforeUpdate(s, r), o.__reactInternalSnapshotBeforeUpdate = n;
						} catch (e) {
							df(t, t.return, e);
						}
					}
					break;
				case 3:
					if (a & 1024) {
						if (r = t.stateNode.containerInfo, n = r.nodeType, n === 9) nm(r);
						else if (n === 1) switch (r.nodeName) {
							case "HEAD":
							case "HTML":
							case "BODY":
								nm(r);
								break;
							default: r.textContent = "";
						}
					}
					break;
				case 5:
				case 26:
				case 27:
				case 6:
				case 4:
				case 17: break;
				case 30:
					n && r !== null && (n = ai(r.memoizedProps, r.stateNode), a = t.memoizedProps, a = si(a.default, a.update), a !== "none" && Il(r, n, a, r.memoizedState = [], !0));
					break;
				default: if (a & 1024) throw Error(i(163));
			}
			if (r = t.sibling, r !== null) {
				r.return = t.return, eu = r;
				break;
			}
			eu = t.return;
		}
	}
	function su(e, t, n) {
		var r = n.flags;
		switch (n.tag) {
			case 0:
			case 11:
			case 15:
				Du(e, n), r & 4 && fl(5, n);
				break;
			case 1:
				if (Du(e, n), r & 4) {
					if (e = n.stateNode, t === null) try {
						e.componentDidMount();
					} catch (e) {
						df(n, n.return, e);
					}
					else {
						var i = fc(n.type, t.memoizedProps);
						t = t.memoizedState;
						try {
							e.componentDidUpdate(i, t, e.__reactInternalSnapshotBeforeUpdate);
						} catch (e) {
							df(n, n.return, e);
						}
					}
				}
				r & 64 && ml(n), r & 512 && gl(n, n.return);
				break;
			case 3:
				if (Du(e, n), r & 64 && (e = n.updateQueue, e !== null)) {
					if (t = null, n.child !== null) switch (n.child.tag) {
						case 27:
						case 5:
							t = n.child.stateNode;
							break;
						case 1: t = n.child.stateNode;
					}
					try {
						po(e, t);
					} catch (e) {
						df(n, n.return, e);
					}
				}
				break;
			case 27: t === null && r & 4 && kl(n);
			case 26:
			case 5:
				Du(e, n), t === null && r & 4 && Cl(n), r & 512 && gl(n, n.return);
				break;
			case 12:
				Du(e, n);
				break;
			case 31:
				Du(e, n), r & 4 && gu(e, n);
				break;
			case 13:
				Du(e, n), r & 4 && _u(e, n), r & 64 && (e = n.memoizedState, e !== null && (e = e.dehydrated, e !== null && (n = hf.bind(null, n), cm(e, n))));
				break;
			case 22:
				if (r = n.memoizedState !== null || Yl, !r) {
					var a = t !== null && t.memoizedState !== null || Xl;
					t = Yl, i = Xl, Yl = r, (Xl = a) && !i ? (r = 2, n.subtreeFlags & 8772 && (r |= 1), ku(e, n, r)) : Du(e, n), Yl = t, Xl = i;
				}
				break;
			case 30:
				Du(e, n), r & 512 && gl(n, n.return);
				break;
			case 7: r & 512 && gl(n, n.return);
			default: Du(e, n);
		}
	}
	function cu(e, t) {
		for (e = e.child; e !== null;) lu(e, t), e = e.sibling;
	}
	function lu(e, t) {
		switch (e.tag) {
			case 5:
			case 26:
				try {
					var n = e.stateNode;
					if (t) {
						var r = n.style;
						typeof r.setProperty == "function" ? r.setProperty("display", "none", "important") : r.display = "none";
					} else {
						var i = e.stateNode, a = e.memoizedProps.style, o = a != null && a.hasOwnProperty("display") ? a.display : null;
						i.style.display = o == null || typeof o == "boolean" ? "" : ("" + o).trim();
					}
				} catch (t) {
					df(e, e.return, t);
				}
				uu(e, t);
				break;
			case 6:
				try {
					e.stateNode.nodeValue = t ? "" : e.memoizedProps, It = !0;
				} catch (t) {
					df(e, e.return, t);
				}
				break;
			case 18:
				try {
					var s = e.stateNode;
					t ? wp(s, !0) : wp(e.stateNode, !1);
				} catch (t) {
					df(e, e.return, t);
				}
				break;
			case 22:
			case 23:
				e.memoizedState === null && cu(e, t);
				break;
			default: cu(e, t);
		}
	}
	function uu(e, t) {
		if (e.subtreeFlags & 67108864) for (e = e.child; e !== null;) {
			a: {
				var n = e, r = t;
				switch (n.tag) {
					case 4:
						lu(n, r);
						break a;
					case 22:
						n.memoizedState === null && uu(n, r);
						break a;
					default: uu(n, r);
				}
			}
			e = e.sibling;
		}
	}
	function du(e) {
		var t = e.alternate;
		t !== null && (e.alternate = null, du(t)), e.child = null, e.deletions = null, e.sibling = null, e.tag === 5 && (t = e.stateNode, t !== null && xt(t)), e.stateNode = null, e.return = null, e.dependencies = null, e.memoizedProps = null, e.memoizedState = null, e.pendingProps = null, e.stateNode = null, e.updateQueue = null;
	}
	var fu = null, pu = !1;
	function mu(e, t, n) {
		for (n = n.child; n !== null;) hu(e, t, n), n = n.sibling;
	}
	function hu(e, t, n) {
		if (Ve && typeof Ve.onCommitFiberUnmount == "function") try {
			Ve.onCommitFiberUnmount(Be, n);
		} catch {}
		switch (n.tag) {
			case 26:
				Xl || _l(n, t), mu(e, t, n), n.memoizedState ? n.memoizedState.count-- : n.stateNode && !Xl && (n = n.stateNode, n.parentNode.removeChild(n));
				break;
			case 27:
				Xl || _l(n, t), bl(n);
				var r = fu, i = pu;
				Sp(n.type) && (fu = n.stateNode, pu = !1), mu(e, t, n), gm(n.stateNode, n.type, n.memoizedProps), fu = r, pu = i;
				break;
			case 5: Xl || _l(n, t), bl(n);
			case 6:
				if (n.tag === 6 && bl(n), r = fu, i = pu, fu = null, mu(e, t, n), fu = r, pu = i, fu !== null) {
					if (pu) try {
						(fu.nodeType === 9 ? fu.body : fu.nodeName === "HTML" ? fu.ownerDocument.body : fu).removeChild(n.stateNode), It = !0;
					} catch (e) {
						df(n, t, e);
					}
					else try {
						fu.removeChild(n.stateNode), It = !0;
					} catch (e) {
						df(n, t, e);
					}
				}
				break;
			case 18:
				fu !== null && (pu ? (e = fu, Cp(e.nodeType === 9 ? e.body : e.nodeName === "HTML" ? e.ownerDocument.body : e, n.stateNode), Hh(e)) : Cp(fu, n.stateNode));
				break;
			case 4:
				r = fu, i = pu, fu = n.stateNode.containerInfo, pu = !0, mu(e, t, n), fu = r, pu = i;
				break;
			case 0:
			case 11:
			case 14:
			case 15:
				pl(2, n, t), Xl || pl(4, n, t), mu(e, t, n);
				break;
			case 1:
				Xl || (_l(n, t), r = n.stateNode, typeof r.componentWillUnmount == "function" && hl(n, t, r)), mu(e, t, n);
				break;
			case 21:
				mu(e, t, n);
				break;
			case 22:
				Xl = (r = Xl) || n.memoizedState !== null, mu(e, t, n), Xl = r;
				break;
			case 30:
				_l(n, t), mu(e, t, n);
				break;
			case 7:
				Xl || _l(n, t), mu(e, t, n);
				break;
			default: mu(e, t, n);
		}
	}
	function gu(e, t) {
		if (t.memoizedState === null && (e = t.alternate, e !== null && (e = e.memoizedState, e !== null))) {
			e = e.dehydrated;
			try {
				Hh(e);
			} catch (e) {
				df(t, t.return, e);
			}
		}
	}
	function _u(e, t) {
		if (t.memoizedState === null && (e = t.alternate, e !== null && (e = e.memoizedState, e !== null && (e = e.dehydrated, e !== null)))) try {
			Hh(e);
		} catch (e) {
			df(t, t.return, e);
		}
	}
	function vu(e) {
		switch (e.tag) {
			case 31:
			case 13:
			case 19:
				var t = e.stateNode;
				return t === null && (t = e.stateNode = new $l()), t;
			case 22: return e = e.stateNode, t = e._retryCache, t === null && (t = e._retryCache = new $l()), t;
			default: throw Error(i(435, e.tag));
		}
	}
	function yu(e, t) {
		var n = vu(e);
		t.forEach(function(t) {
			if (!n.has(t)) {
				n.add(t);
				var r = gf.bind(null, e, t);
				t.then(r, r);
			}
		});
	}
	function bu(e, t, n) {
		var r = t.deletions;
		if (r !== null) for (var a = 0; a < r.length; a++) {
			var o = r[a], s = e, c = t, l = c;
			a: for (; l !== null;) {
				switch (l.tag) {
					case 27:
						if (Sp(l.type)) {
							fu = l.stateNode, pu = !1;
							break a;
						}
						break;
					case 5:
						fu = l.stateNode, pu = !1;
						break a;
					case 3:
					case 4:
						fu = l.stateNode.containerInfo, pu = !0;
						break a;
				}
				l = l.return;
			}
			if (fu === null) throw Error(i(160));
			hu(s, c, o), fu = null, pu = !1, s = o.alternate, s !== null && (s.return = null), o.return = null;
		}
		if (t.subtreeFlags & 13886) for (t = t.child; t !== null;) Su(t, e, n), t = t.sibling;
	}
	var xu = null;
	function Su(e, t, n) {
		var r = e.alternate, a = e.flags;
		switch (e.tag) {
			case 0:
			case 11:
			case 14:
			case 15:
				if (a & 4 && (r = e.updateQueue, r = r === null ? null : r.events, r !== null)) for (var o = 0; o < r.length; o++) {
					var s = r[o];
					s.ref.impl = s.nextImpl;
				}
				bu(t, e, n), Cu(e), a & 4 && (pl(3, e, e.return), fl(3, e), pl(5, e, e.return));
				break;
			case 1:
				bu(t, e, n), Cu(e), a & 512 && (Xl || r === null || _l(r, r.return)), a & 64 && Yl && (e = e.updateQueue, e !== null && (t = e.callbacks, t !== null && (n = e.shared.hiddenCallbacks, e.shared.hiddenCallbacks = n === null ? t : n.concat(t))));
				break;
			case 26:
				if (o = xu, bu(t, e, n), Cu(e), a & 512 && (Xl || r === null || _l(r, r.return)), a & 4) {
					if (a = r === null ? null : r.memoizedState, n = e.memoizedState, r === null) {
						if (n === null) {
							if (e.stateNode === null) {
								if (Yl) e.stateNode = fp(e.type, e.memoizedProps, t.containerInfo, e);
								else {
									a: {
										t = e.type, n = e.memoizedProps, a = o.ownerDocument || o;
										b: switch (t) {
											case "title":
												r = a.getElementsByTagName("title")[0], (!r || r[bt] || r[pt] || r.namespaceURI === "http://www.w3.org/2000/svg" || r.hasAttribute("itemprop")) && (r = a.createElement(t), a.head.insertBefore(r, a.querySelector("head > title"))), np(r, t, n), r[pt] = e, Et(r), t = r;
												break a;
											case "link":
												if (o = Gm("link", "href", a).get(t + (n.href || ""))) {
													for (s = 0; s < o.length; s++) if (r = o[s], r.getAttribute("href") === (n.href == null || n.href === "" ? null : n.href) && r.getAttribute("rel") === (n.rel == null ? null : n.rel) && r.getAttribute("title") === (n.title == null ? null : n.title) && r.getAttribute("crossorigin") === (n.crossOrigin == null ? null : n.crossOrigin)) {
														o.splice(s, 1);
														break b;
													}
												}
												r = a.createElement(t), np(r, t, n), a.head.appendChild(r);
												break;
											case "meta":
												if (o = Gm("meta", "content", a).get(t + (n.content || ""))) {
													for (s = 0; s < o.length; s++) if (r = o[s], r.getAttribute("content") === (n.content == null ? null : "" + n.content) && r.getAttribute("name") === (n.name == null ? null : n.name) && r.getAttribute("property") === (n.property == null ? null : n.property) && r.getAttribute("http-equiv") === (n.httpEquiv == null ? null : n.httpEquiv) && r.getAttribute("charset") === (n.charSet == null ? null : n.charSet)) {
														o.splice(s, 1);
														break b;
													}
												}
												r = a.createElement(t), np(r, t, n), a.head.appendChild(r);
												break;
											default: throw Error(i(468, t));
										}
										r[pt] = e, Et(r), t = r;
									}
									e.stateNode = t;
								}
							} else Yl || Km(o, e.type, e.stateNode);
						} else e.stateNode = Bm(o, n, e.memoizedProps);
					} else a === n ? n === null && e.stateNode !== null && wl(e, e.memoizedProps, r.memoizedProps) : (a === null ? (t = r.stateNode, t === null || Xl || t.parentNode.removeChild(t)) : a.count--, n === null ? Yl || Km(o, e.type, e.stateNode) : Bm(o, n, e.memoizedProps));
				}
				break;
			case 27:
				bu(t, e, n), Cu(e), a & 512 && (Xl || r === null || _l(r, r.return)), r !== null && a & 4 && wl(e, e.memoizedProps, r.memoizedProps);
				break;
			case 5:
				if (o = Zl, Zl = !1, bu(t, e, n), Zl = o, Cu(e), a & 512 && (Xl || r === null || _l(r, r.return)), e.flags & 32) {
					t = e.stateNode;
					try {
						Qt(t, ""), It = !0;
					} catch (t) {
						df(e, e.return, t);
					}
				}
				a & 4 && e.stateNode != null && (t = e.memoizedProps, wl(e, t, r === null ? t : r.memoizedProps)), a & 1024 && (Ql = !0);
				break;
			case 6:
				if (bu(t, e, n), Cu(e), a & 4) {
					if (e.stateNode === null) throw Error(i(162));
					t = e.memoizedProps, n = e.stateNode;
					try {
						n.nodeValue = t, It = !0;
					} catch (t) {
						df(e, e.return, t);
					}
				}
				break;
			case 3:
				if (It = !1, Wm = null, o = xu, xu = bm(t.containerInfo), bu(t, e, n), xu = o, Cu(e), a & 4 && r !== null && r.memoizedState.isDehydrated) try {
					Hh(t.containerInfo);
				} catch (t) {
					df(e, e.return, t);
				}
				Ql && (Ql = !1, wu(e)), It = !1;
				break;
			case 4:
				a = Zl, Zl = Yl, r = Lt(), o = xu, xu = bm(e.stateNode.containerInfo), bu(t, e, n), Cu(e), xu = o, It && nu && (ru = !0), It = r, Zl = a;
				break;
			case 12:
				bu(t, e, n), Cu(e);
				break;
			case 31:
				bu(t, e, n), Cu(e), a & 4 && (t = e.updateQueue, t !== null && (e.updateQueue = null, yu(e, t)));
				break;
			case 13:
				bu(t, e, n), Cu(e), e.child.flags & 8192 && e.memoizedState !== null != (r !== null && r.memoizedState !== null) && (dd = Me()), a & 4 && (t = e.updateQueue, t !== null && (e.updateQueue = null, yu(e, t)));
				break;
			case 22:
				o = e.memoizedState !== null, s = r !== null && r.memoizedState !== null;
				var c = Yl, l = Xl, u = Zl;
				Yl = c || o, Zl = u || o, Xl = l || s, bu(t, e, n), Xl = l, Zl = u, Yl = c, Cu(e), a & 8192 && (t = e.stateNode, t._visibility = o ? t._visibility & -2 : t._visibility | 1, !o || r === null || s || Yl || Xl || (t = s || Xl, n = Yl, r = Xl, Yl = o || Yl, Xl = t, Ou(e, 2), Yl = n, Xl = r), !o && Zl || cu(e, o)), a & 4 && (t = e.updateQueue, t !== null && (n = t.retryQueue, n !== null && (t.retryQueue = null, yu(e, n))));
				break;
			case 19:
				bu(t, e, n), Cu(e), a & 4 && (t = e.updateQueue, t !== null && (e.updateQueue = null, yu(e, t)));
				break;
			case 30:
				a & 512 && (Xl || r === null || _l(r, r.return)), a = Lt(), o = nu, s = (n & 335544064) === n, c = e.memoizedProps, nu = s && si(c.default, c.update) !== "none", bu(t, e, n), Cu(e), s && r !== null && It && (e.flags |= 4), nu = o, It = a;
				break;
			case 21: break;
			case 7: a & 512 && (Xl || r === null || _l(r, r.return)), r && r.stateNode !== null && (r.stateNode._fragmentFiber = e);
			default: bu(t, e, n), Cu(e);
		}
	}
	function Cu(e) {
		var t = e.flags;
		if (t & 2) {
			try {
				for (var n, r = e.return; r !== null;) {
					if (Tl(r)) {
						n = r;
						break;
					}
					r = r.return;
				}
				r = null;
				for (var a = e.return; a !== null;) {
					if (Sl(a)) {
						var o = a.stateNode;
						r === null ? r = [o] : r.push(o);
					}
					if (xl(a)) break;
					a = a.return;
				}
				var s = r;
				if (n == null) throw Error(i(160));
				switch (n.tag) {
					case 27:
						var c = n.stateNode;
						Ol(e, El(e), c, s);
						break;
					case 5:
						var l = n.stateNode;
						n.flags & 32 && (Qt(l, ""), n.flags &= -33), Ol(e, El(e), l, s);
						break;
					case 3:
					case 4:
						var u = n.stateNode.containerInfo;
						Dl(e, El(e), u, s);
						break;
					default: throw Error(i(161));
				}
			} catch (t) {
				df(e, e.return, t);
			}
			e.flags &= -3;
		}
		t & 4096 && (e.flags &= -4097);
	}
	function wu(e) {
		if (e.subtreeFlags & 1024) for (e = e.child; e !== null;) {
			var t = e;
			wu(t), t.tag === 5 && t.flags & 1024 && (t = t.stateNode, gh = !0, t.reset(), gh = !1), e = e.sibling;
		}
	}
	function Tu(e, t) {
		if (t.subtreeFlags & 9270) for (t = t.child; t !== null;) Eu(t, e), t = t.sibling;
		else Jl(t, !1);
	}
	function Eu(e, t) {
		var n = e.alternate;
		if (n === null) Bl(e, !1);
		else switch (e.tag) {
			case 3:
				if (iu = tu = !1, Pl(), Tu(t, e), !tu && !ru) {
					if (e = Nl, e !== null) for (var r = 0; r < e.length; r += 3) {
						n = e[r];
						var i = e[r + 1];
						Ep(n, e[r + 2]), n = n.ownerDocument.documentElement, n !== null && n.animate({
							opacity: [0, 0],
							pointerEvents: ["none", "none"]
						}, {
							duration: 0,
							fill: "forwards",
							pseudoElement: "::view-transition-group(" + i + ")"
						});
					}
					e = t.containerInfo, e = e.nodeType === 9 ? e.documentElement : e.ownerDocument.documentElement, e !== null && e.style.viewTransitionName === "" && (e.style.viewTransitionName = "none", e.animate({
						opacity: [0, 0],
						pointerEvents: ["none", "none"]
					}, {
						duration: 0,
						fill: "forwards",
						pseudoElement: "::view-transition-group(root)"
					}), e.animate({
						width: [0, 0],
						height: [0, 0]
					}, {
						duration: 0,
						fill: "forwards",
						pseudoElement: "::view-transition"
					})), iu = !0;
				}
				Nl = null;
				break;
			case 5:
				Tu(t, e);
				break;
			case 4:
				r = tu, tu = !1, Tu(t, e), tu && (ru = !0), tu = r;
				break;
			case 22:
				e.memoizedState === null && (n.memoizedState === null ? Tu(t, e) : Bl(e, !1));
				break;
			case 30:
				r = tu, i = Pl(), tu = !1, Tu(t, e), tu && (e.flags |= 4);
				var a = e.memoizedProps, o = e.stateNode;
				t = ai(a, o), o = ai(n.memoizedProps, o);
				var s = si(a.default, a.update);
				s === "none" ? t = !1 : (a = n.memoizedState, n.memoizedState = null, n = e.child, Fl = 0, t = ql(e, n, t, o, s, a, !0), Fl !== (a === null ? 0 : a.length) && (e.flags |= 32)), e.flags & 4 && t ? (Ad(e, e.memoizedProps.onUpdate), Nl = i) : i !== null && (i.push.apply(i, Nl), Nl = i), tu = e.flags & 32 ? !0 : r;
				break;
			default: Tu(t, e);
		}
	}
	function Du(e, t) {
		if (t.subtreeFlags & 8772) for (t = t.child; t !== null;) su(e, t.alternate, t), t = t.sibling;
	}
	function Ou(e, t) {
		for (e = e.child; e !== null;) {
			var n = e, r = t;
			switch (n.tag) {
				case 0:
				case 11:
				case 14:
				case 15:
					pl(4, n, n.return), Ou(n, r);
					break;
				case 1:
					_l(n, n.return);
					var i = n.stateNode;
					typeof i.componentWillUnmount == "function" && hl(n, n.return, i), Ou(n, r);
					break;
				case 27: r & 2 && gm(n.stateNode, n.type, n.memoizedProps);
				case 5:
					_l(n, n.return), n.tag !== 5 && n.tag !== 27 || bl(n), Ou(n, r);
					break;
				case 6:
					bl(n);
					break;
				case 26:
					_l(n, n.return), i = n.stateNode, n.memoizedState !== null || i === null || Xl || i.parentNode.removeChild(i), Ou(n, r);
					break;
				case 22:
					n.memoizedState === null && Ou(n, r);
					break;
				case 30:
					_l(n, n.return), Ou(n, r);
					break;
				case 7: _l(n, n.return);
				default: Ou(n, r);
			}
			e = e.sibling;
		}
	}
	function ku(e, t, n) {
		for (n = t.subtreeFlags & 8772 ? n : n & -2, t = t.child; t !== null;) {
			var r = t.alternate, i = e, a = t, o = a.flags, s = !!(n & 1);
			switch (a.tag) {
				case 0:
				case 11:
				case 15:
					ku(i, a, n), fl(4, a);
					break;
				case 1:
					if (ku(i, a, n), r = a, i = r.stateNode, typeof i.componentDidMount == "function") try {
						i.componentDidMount();
					} catch (e) {
						df(r, r.return, e);
					}
					if (r = a, i = r.updateQueue, i !== null) {
						var c = r.stateNode;
						try {
							var l = i.shared.hiddenCallbacks;
							if (l !== null) for (i.shared.hiddenCallbacks = null, i = 0; i < l.length; i++) fo(l[i], c);
						} catch (e) {
							df(r, r.return, e);
						}
					}
					s && o & 64 && ml(a), gl(a, a.return);
					break;
				case 27: n & 2 && kl(a);
				case 5:
					a.tag !== 5 && a.tag !== 27 || yl(a), ku(i, a, n), s && r === null && o & 4 && Cl(a), gl(a, a.return);
					break;
				case 6:
					yl(a);
					break;
				case 26:
					c = a.stateNode, a.memoizedState !== null || c === null || Yl || Km(bm(c.ownerDocument), a.type, c), ku(i, a, n), s && r === null && o & 4 && Cl(a), gl(a, a.return);
					break;
				case 12:
					ku(i, a, n);
					break;
				case 31:
					ku(i, a, n), s && o & 4 && gu(i, a);
					break;
				case 13:
					ku(i, a, n), s && o & 4 && _u(i, a);
					break;
				case 22:
					a.memoizedState === null && ku(i, a, n), gl(a, a.return);
					break;
				case 30:
					ku(i, a, n), gl(a, a.return);
					break;
				case 7: gl(a, a.return);
				default: ku(i, a, n);
			}
			t = t.sibling;
		}
	}
	function Au(e, t) {
		var n = null;
		e !== null && e.memoizedState !== null && e.memoizedState.cachePool !== null && (n = e.memoizedState.cachePool.pool), e = null, t.memoizedState !== null && t.memoizedState.cachePool !== null && (e = t.memoizedState.cachePool.pool), e !== n && (e != null && e.refCount++, n != null && xa(n));
	}
	function ju(e, t) {
		e = null, t.alternate !== null && (e = t.alternate.memoizedState.cache), t = t.memoizedState.cache, t !== e && (t.refCount++, e != null && xa(e));
	}
	function Mu(e, t, n, r) {
		var i = (n & 335544064) === n;
		if (t.subtreeFlags & (i ? 10262 : 10256)) for (t = t.child; t !== null;) Nu(e, t, n, r), t = t.sibling;
		else i && Kl(t);
	}
	function Nu(e, t, n, r) {
		var i = (n & 335544064) === n;
		i && t.alternate === null && t.return !== null && t.return.alternate !== null && Gl(t);
		var a = t.flags;
		switch (t.tag) {
			case 0:
			case 11:
			case 15:
				Mu(e, t, n, r), a & 2048 && fl(9, t);
				break;
			case 1:
				Mu(e, t, n, r);
				break;
			case 3:
				Mu(e, t, n, r), i && iu && (e = e.containerInfo, e = e.nodeType === 9 ? e.body : e.nodeName === "HTML" ? e.ownerDocument.body : e, e.style.viewTransitionName === "root" && (e.style.viewTransitionName = ""), e = e.ownerDocument.documentElement, e !== null && e.style.viewTransitionName === "none" && (e.style.viewTransitionName = "")), a & 2048 && (a = null, t.alternate !== null && (a = t.alternate.memoizedState.cache), t = t.memoizedState.cache, t !== a && (t.refCount++, a != null && xa(a)));
				break;
			case 12:
				if (a & 2048) {
					Mu(e, t, n, r), a = t.stateNode;
					try {
						var o = t.memoizedProps, s = o.id, c = o.onPostCommit;
						typeof c == "function" && c(s, t.alternate === null ? "mount" : "update", a.passiveEffectDuration, -0);
					} catch (e) {
						df(t, t.return, e);
					}
				} else Mu(e, t, n, r);
				break;
			case 31:
				Mu(e, t, n, r);
				break;
			case 13:
				Mu(e, t, n, r);
				break;
			case 23: break;
			case 22:
				o = t.stateNode, s = t.alternate, t.memoizedState === null ? (i && s !== null && s.memoizedState !== null && Gl(t), o._visibility & 2 ? Mu(e, t, n, r) : (o._visibility |= 2, Pu(e, t, n, r, !!(t.subtreeFlags & 10256) || !1))) : (i && s !== null && s.memoizedState === null && Gl(s), o._visibility & 2 ? Mu(e, t, n, r) : Fu(e, t)), a & 2048 && Au(s, t);
				break;
			case 24:
				Mu(e, t, n, r), a & 2048 && ju(t.alternate, t);
				break;
			case 30:
				i && (a = t.alternate, a !== null && (Rl(a.child, !0), Rl(t.child, !0))), Mu(e, t, n, r);
				break;
			default: Mu(e, t, n, r);
		}
	}
	function Pu(e, t, n, r, i) {
		for (i &&= !!(t.subtreeFlags & 10256) || !1, t = t.child; t !== null;) {
			var a = e, o = t, s = n, c = r, l = o.flags;
			switch (o.tag) {
				case 0:
				case 11:
				case 15:
					Pu(a, o, s, c, i), fl(8, o);
					break;
				case 23: break;
				case 22:
					var u = o.stateNode;
					o.memoizedState === null ? (u._visibility |= 2, Pu(a, o, s, c, i)) : u._visibility & 2 ? Pu(a, o, s, c, i) : Fu(a, o), i && l & 2048 && Au(o.alternate, o);
					break;
				case 24:
					Pu(a, o, s, c, i), i && l & 2048 && ju(o.alternate, o);
					break;
				default: Pu(a, o, s, c, i);
			}
			t = t.sibling;
		}
	}
	function Fu(e, t) {
		if (t.subtreeFlags & 10256) for (t = t.child; t !== null;) {
			var n = e, r = t, i = r.flags;
			switch (r.tag) {
				case 22:
					Fu(n, r), i & 2048 && Au(r.alternate, r);
					break;
				case 24:
					Fu(n, r), i & 2048 && ju(r.alternate, r);
					break;
				default: Fu(n, r);
			}
			t = t.sibling;
		}
	}
	var Iu = 8192;
	function Lu(e, t, n) {
		if (e.subtreeFlags & Iu) for (e = e.child; e !== null;) Ru(e, t, n), e = e.sibling;
	}
	function Ru(e, t, n) {
		switch (e.tag) {
			case 26:
				Lu(e, t, n), e.flags & Iu && (e.memoizedState === null ? (e = e.stateNode, (t & 335544128) === t && Zm(n, e)) : Qm(n, xu, e.memoizedState, e.memoizedProps));
				break;
			case 5:
				Lu(e, t, n), e.flags & Iu && (e = e.stateNode, (t & 335544128) === t && Zm(n, e));
				break;
			case 3:
			case 4:
				var r = xu;
				xu = bm(e.stateNode.containerInfo), Lu(e, t, n), xu = r;
				break;
			case 22:
				e.memoizedState === null && (r = e.alternate, r !== null && r.memoizedState !== null ? (r = Iu, Iu = 16777216, Lu(e, t, n), Iu = r) : Lu(e, t, n));
				break;
			case 30:
				if ((e.flags & Iu) !== 0 && (r = e.memoizedProps.name, r != null && r !== "auto")) {
					var i = e.stateNode;
					i.paired = null, jl === null && (jl = /* @__PURE__ */ new Map()), jl.set(r, i);
				}
				Lu(e, t, n);
				break;
			default: Lu(e, t, n);
		}
	}
	function zu(e) {
		var t = e.alternate;
		if (t !== null && (e = t.child, e !== null)) {
			t.child = null;
			do
				t = e.sibling, e.sibling = null, e = t;
			while (e !== null);
		}
	}
	function Bu(e) {
		var t = e.deletions;
		if (e.flags & 16) {
			if (t !== null) for (var n = 0; n < t.length; n++) {
				var r = t[n];
				eu = r, Uu(r, e);
			}
			zu(e);
		}
		if (e.subtreeFlags & 10256) for (e = e.child; e !== null;) Vu(e), e = e.sibling;
	}
	function Vu(e) {
		switch (e.tag) {
			case 0:
			case 11:
			case 15:
				Bu(e), e.flags & 2048 && pl(9, e, e.return);
				break;
			case 3:
				Bu(e);
				break;
			case 12:
				Bu(e);
				break;
			case 22:
				var t = e.stateNode;
				e.memoizedState !== null && t._visibility & 2 && (e.return === null || e.return.tag !== 13) ? (t._visibility &= -3, Hu(e)) : Bu(e);
				break;
			default: Bu(e);
		}
	}
	function Hu(e) {
		var t = e.deletions;
		if (e.flags & 16) {
			if (t !== null) for (var n = 0; n < t.length; n++) {
				var r = t[n];
				eu = r, Uu(r, e);
			}
			zu(e);
		}
		for (e = e.child; e !== null;) {
			switch (t = e, t.tag) {
				case 0:
				case 11:
				case 15:
					pl(8, t, t.return), Hu(t);
					break;
				case 22:
					n = t.stateNode, n._visibility & 2 && (n._visibility &= -3, Hu(t));
					break;
				default: Hu(t);
			}
			e = e.sibling;
		}
	}
	function Uu(e, t) {
		for (; eu !== null;) {
			var n = eu;
			switch (n.tag) {
				case 0:
				case 11:
				case 15:
					pl(8, n, t);
					break;
				case 23:
				case 22:
					if (n.memoizedState !== null && n.memoizedState.cachePool !== null) {
						var r = n.memoizedState.cachePool.pool;
						r != null && r.refCount++;
					}
					break;
				case 24: xa(n.memoizedState.cache);
			}
			if (r = n.child, r !== null) r.return = n, eu = r;
			else a: for (n = e; eu !== null;) {
				r = eu;
				var i = r.sibling, a = r.return;
				if (du(r), r === n) {
					eu = null;
					break a;
				}
				if (i !== null) {
					i.return = a, eu = i;
					break a;
				}
				eu = a;
			}
		}
	}
	var Wu = {
		getCacheForType: function(e) {
			var t = pa(ya), n = t.data.get(e);
			return n === void 0 && (n = e(), t.data.set(e, n)), n;
		},
		cacheSignal: function() {
			return pa(ya).controller.signal;
		}
	}, Gu = typeof WeakMap == "function" ? WeakMap : Map, Ku = 0, qu = null, Ju = null, Yu = 0, Xu = 0, Zu = null, Qu = !1, $u = !1, ed = !1, td = 0, nd = 0, rd = 0, id = 0, ad = 0, od = 0, sd = 0, cd = null, ld = null, ud = !1, dd = 0, fd = 0, pd = Infinity, md = null, hd = null, gd = 0, _d = null, vd = null, yd = 0, bd = 0, xd = null, Sd = null, Cd = null, wd = null, Td = null, Ed = 0, Dd = null;
	function Od() {
		return Ku & 2 && Yu !== 0 ? Yu & -Yu : H.T === null ? ut() : Mf();
	}
	function kd() {
		if (od === 0) {
			if (!(Yu & 536870912) || Q) {
				var e = Je;
				Je <<= 1, !(Je & 3932160) && (Je = 262144), od = e;
			} else od = 536870912;
		}
		return e = yo.current, e !== null && (e.flags |= 32), od;
	}
	function Ad(e, t) {
		if (t != null) {
			var n = e.stateNode, r = n.ref;
			r === null && (r = n.ref = Pp(ai(e.memoizedProps, n))), wd === null && (wd = []), wd.push(t.bind(null, r));
		}
	}
	function jd(e, t, n) {
		(e === qu && (Xu === 2 || Xu === 9) || e.cancelPendingCommit !== null) && (Rd(e, 0), Fd(e, Yu, od, !1)), rt(e, n), (!(Ku & 2) || e !== qu) && (e === qu && (!(Ku & 2) && (id |= n), nd === 4 && Fd(e, Yu, od, !1)), wf(e));
	}
	function Md(e, t, n) {
		if (Ku & 6) throw Error(i(327));
		var r = !n && !(t & 127) && (t & e.expiredLanes) === 0 || Qe(e, t), a = r ? Kd(e, t) : Wd(e, t, !0), o = r;
		do {
			if (a === 0) {
				$u && !r && Fd(e, t, 0, !1);
				break;
			}
			if (n = e.current.alternate, o && !Pd(n)) {
				a = Wd(e, t, !1), o = !1;
				continue;
			}
			if (a === 2) {
				if (o = t, e.errorRecoveryDisabledLanes & o) var s = 0;
				else s = e.pendingLanes & -536870913, s = s === 0 ? s & 536870912 ? 536870912 : 0 : s;
				if (s !== 0) {
					t = s;
					a: {
						var c = e;
						a = cd;
						var l = c.current.memoizedState.isDehydrated;
						if (l && (Rd(c, s).flags |= 256), s = Wd(c, s, !1), s !== 2 && s !== 6) {
							if (ed && !l) {
								c.errorRecoveryDisabledLanes |= o, id |= o, a = 4;
								break a;
							}
							o = ld, ld = a, o !== null && (ld === null ? ld = o : ld.push.apply(ld, o));
						}
						a = s;
					}
					if (o = !1, a !== 2) continue;
				}
			}
			if (a === 1) {
				Rd(e, 0), Fd(e, t, 0, !0);
				break;
			}
			a: {
				switch (r = e, o = a, o) {
					case 0:
					case 1: throw Error(i(345));
					case 4: if ((t & 4194048) !== t && (t & 62914560) !== t) break;
					case 6:
						Fd(r, t, od, !Qu);
						break a;
					case 2:
						ld = null;
						break;
					case 3:
					case 5: break;
					default: throw Error(i(329));
				}
				if ((t & 62914560) === t && (a = dd + 300 - Me(), 10 < a)) {
					if (Fd(r, t, od, !Qu), Ze(r, 0, !0) !== 0) break a;
					yd = t, r.timeoutHandle = gp(Nd.bind(null, r, n, ld, md, ud, t, od, id, sd, Qu, o, "Throttled", -0, 0), a);
					break a;
				}
				Nd(r, n, ld, md, ud, t, od, id, sd, Qu, o, null, -0, 0);
			}
			break;
		} while (1);
		wf(e);
	}
	function Nd(e, t, n, r, i, a, o, s, c, l, u, d, f, p) {
		e.timeoutHandle = -1;
		var m = t.subtreeFlags, h = (a & 335544064) === a;
		if (d = null, (h || m & 8192 || (m & 16785408) == 16785408) && (d = {
			stylesheets: null,
			count: 0,
			imgCount: 0,
			imgBytes: 0,
			suspenseyImages: [],
			waitingForImages: !0,
			waitingForViewTransition: !1,
			unsuspend: on
		}, jl = null, Ru(t, a, d), h && (m = d, h = e.containerInfo, h = (h.nodeType === 9 ? h : h.ownerDocument).__reactViewTransition, h != null && (m.count++, m.waitingForViewTransition = !0, m = nh.bind(m), h.finished.then(m, m))), m = (a & 62914560) === a ? dd - Me() : (a & 4194048) === a ? fd - Me() : 0, m = eh(d, m), m !== null)) {
			yd = a, e.cancelPendingCommit = m($d.bind(null, e, t, a, n, r, i, o, s, c, l, u, d, null, f, p)), Fd(e, a, o, !l);
			return;
		}
		$d(e, t, a, n, r, i, o, s, c, l, u, d);
	}
	function Pd(e) {
		for (var t = e;;) {
			var n = t.tag;
			if ((n === 0 || n === 11 || n === 15) && t.flags & 16384 && (n = t.updateQueue, n !== null && (n = n.stores, n !== null))) for (var r = 0; r < n.length; r++) {
				var i = n[r], a = i.getSnapshot;
				i = i.value;
				try {
					if (!kr(a(), i)) return !1;
				} catch {
					return !1;
				}
			}
			if (n = t.child, t.subtreeFlags & 16384 && n !== null) n.return = t, t = n;
			else {
				if (t === e) break;
				for (; t.sibling === null;) {
					if (t.return === null || t.return === e) return !0;
					t = t.return;
				}
				t.sibling.return = t.return, t = t.sibling;
			}
		}
		return !0;
	}
	function Fd(e, t, n, r) {
		t = $e(e, t), t &= ~ad, t &= ~id, e.suspendedLanes |= t, e.pingedLanes &= ~t, r && (e.warmLanes |= t), r = e.expirationTimes;
		for (var i = t; 0 < i;) {
			var a = 31 - Ue(i), o = 1 << a;
			r[a] = -1, i &= ~o;
		}
		n !== 0 && at(e, n, t);
	}
	function Id() {
		return Ku & 6 ? !0 : (Tf(0, !1), !1);
	}
	function Ld() {
		if (Ju !== null) {
			if (Xu === 0) var e = Ju.return;
			else e = Ju, aa = ia = null, Jo(e), qa = null, Ja = 0, e = Ju;
			for (; e !== null;) dl(e.alternate, e), e = e.return;
			Ju = null;
		}
	}
	function Rd(e, t) {
		var n = e.timeoutHandle;
		return n !== -1 && (e.timeoutHandle = -1, _p(n)), n = e.cancelPendingCommit, n !== null && (e.cancelPendingCommit = null, n()), yd = 0, Ld(), qu = e, Ju = n = Si(e.current, null), Yu = t, Xu = 0, Zu = null, Qu = !1, $u = Qe(e, t), ed = !1, sd = od = ad = id = rd = nd = 0, ld = cd = null, ud = !1, td = $e(e, t), fi(), n;
	}
	function zd(e, t) {
		$ = null, H.H = ic, t === La || t === za ? (t = Ga(), Xu = 3) : t === Ra ? (t = Ga(), Xu = 4) : Xu = t === Sc ? 8 : typeof t == "object" && t && typeof t.then == "function" ? 6 : 1, Zu = t, Ju === null && (nd = 1, gc(e, Ai(t, e.current)));
	}
	function Bd() {
		var e = yo.current;
		return e === null ? !0 : (Yu & 4194048) === Yu ? bo === null : (Yu & 62914560) === Yu || Yu & 536870912 ? e === bo : !1;
	}
	function Vd() {
		var e = H.H;
		return H.H = ic, e === null ? ic : e;
	}
	function Hd() {
		var e = H.A;
		return H.A = Wu, e;
	}
	function Ud() {
		nd = 4, Qu || (Yu & 4194048) !== Yu && yo.current !== null || ($u = !0), !(rd & 134217727) && !(id & 134217727) || qu === null || Fd(qu, Yu, od, !1);
	}
	function Wd(e, t, n) {
		var r = Ku;
		Ku |= 2;
		var i = Vd(), a = Hd();
		(qu !== e || Yu !== t) && (md = null, Rd(e, t)), t = !1;
		var o = nd;
		a: do
			try {
				if (Xu !== 0 && Ju !== null) {
					var s = Ju, c = Zu;
					switch (Xu) {
						case 8:
							Ld(), o = 6;
							break a;
						case 3:
						case 2:
						case 9:
						case 6:
							yo.current === null && (t = !0);
							var l = Xu;
							if (Xu = 0, Zu = null, Xd(e, s, c, l), n && $u) {
								o = 0;
								break a;
							}
							break;
						default: l = Xu, Xu = 0, Zu = null, Xd(e, s, c, l);
					}
				}
				Gd(), o = nd;
				break;
			} catch (t) {
				zd(e, t);
			}
		while (1);
		return t && e.shellSuspendCounter++, aa = ia = null, Ku = r, H.H = i, H.A = a, Ju === null && (qu = null, Yu = 0, fi()), o;
	}
	function Gd() {
		for (; Ju !== null;) Jd(Ju);
	}
	function Kd(e, t) {
		var n = Ku;
		Ku |= 2;
		var r = Vd(), a = Hd();
		qu !== e || Yu !== t ? (md = null, pd = Me() + 500, Rd(e, t)) : $u = Qe(e, t);
		a: do
			try {
				if (Xu !== 0 && Ju !== null) {
					t = Ju;
					var o = Zu;
					b: switch (Xu) {
						case 1:
							Xu = 0, Zu = null, Xd(e, t, o, 1);
							break;
						case 2:
						case 9:
							if (Va(o)) {
								Xu = 0, Zu = null, Yd(t);
								break;
							}
							t = function() {
								Xu !== 2 && Xu !== 9 || qu !== e || (Xu = 7), wf(e);
							}, o.then(t, t);
							break a;
						case 3:
							Xu = 7;
							break a;
						case 4:
							Xu = 5;
							break a;
						case 7:
							Va(o) ? (Xu = 0, Zu = null, Yd(t)) : (Xu = 0, Zu = null, Xd(e, t, o, 7));
							break;
						case 5:
							var s = null;
							switch (Ju.tag) {
								case 26: s = Ju.memoizedState;
								case 5:
								case 27:
									var c = Ju;
									if (s ? Ym(s) : c.stateNode.complete) {
										Xu = 0, Zu = null;
										var l = c.sibling;
										if (l !== null) Ju = l;
										else {
											var u = c.return;
											u === null ? Ju = null : (Ju = u, Zd(u));
										}
										break b;
									}
							}
							Xu = 0, Zu = null, Xd(e, t, o, 5);
							break;
						case 6:
							Xu = 0, Zu = null, Xd(e, t, o, 6);
							break;
						case 8:
							Ld(), nd = 6;
							break a;
						default: throw Error(i(462));
					}
				}
				qd();
				break;
			} catch (t) {
				zd(e, t);
			}
		while (1);
		return aa = ia = null, H.H = r, H.A = a, Ku = n, Ju === null ? (qu = null, Yu = 0, fi(), nd) : 0;
	}
	function qd() {
		for (; Ju !== null && !Ae();) Jd(Ju);
	}
	function Jd(e) {
		var t = nl(e.alternate, e, td);
		e.memoizedProps = e.pendingProps, t === null ? Zd(e) : Ju = t;
	}
	function Yd(e) {
		var t = e, n = t.alternate;
		switch (t.tag) {
			case 15:
			case 0:
				t = Ic(n, t, t.pendingProps, t.type, void 0, Yu);
				break;
			case 11:
				t = Ic(n, t, t.pendingProps, t.type.render, t.ref, Yu);
				break;
			case 5:
				Jo(t);
				var r = t;
				r === Gi && (Q ? (Qi(r), r.tag === 5 && r.stateNode != null && (Ki = r.stateNode)) : (Qi(r), Q = !0));
			default: dl(n, t), t = Ju = Ci(t, td), t = nl(n, t, td);
		}
		e.memoizedProps = e.pendingProps, t === null ? Zd(e) : Ju = t;
	}
	function Xd(e, t, n, r) {
		aa = ia = null, Jo(t), qa = null, Ja = 0;
		var i = t.return;
		try {
			if (xc(e, i, t, n, Yu)) {
				nd = 1, gc(e, Ai(n, e.current)), Ju = null;
				return;
			}
		} catch (t) {
			if (i !== null) throw Ju = i, t;
			nd = 1, gc(e, Ai(n, e.current)), Ju = null;
			return;
		}
		t.flags & 32768 ? (Q || r === 1 ? e = !0 : $u || Yu & 536870912 ? e = !1 : (Qu = e = !0, (r === 2 || r === 9 || r === 3 || r === 6) && (r = yo.current, r !== null && r.tag === 13 && (r.flags |= 16384))), Qd(t, e)) : Zd(t);
	}
	function Zd(e) {
		var t = e;
		do {
			if (t.flags & 32768) {
				Qd(t, Qu);
				return;
			}
			e = t.return;
			var n = ll(t.alternate, t, td);
			if (n !== null) {
				Ju = n;
				return;
			}
			if (t = t.sibling, t !== null) {
				Ju = t;
				return;
			}
			Ju = t = e;
		} while (t !== null);
		nd === 0 && (nd = 5);
	}
	function Qd(e, t) {
		do {
			var n = ul(e.alternate, e);
			if (n !== null) {
				n.flags &= 32767, Ju = n;
				return;
			}
			if (n = e.return, n !== null && (n.flags |= 32768, n.subtreeFlags = 0, n.deletions = null), !t && (e = e.sibling, e !== null)) {
				Ju = e;
				return;
			}
			Ju = e = n;
		} while (e !== null);
		nd = 6, Ju = null;
	}
	function $d(e, t, n, r, a, o, s, c, l, u, d, f) {
		e.cancelPendingCommit = null;
		do
			cf();
		while (gd !== 0);
		if (Ku & 6) throw Error(i(327));
		if (t !== null) {
			if (t === e.current) throw Error(i(177));
			e === qu && (Ju = qu = null, Yu = 0), vd = t, _d = e, yd = n, xd = a, Sd = r, ef(e, t, n, s, c, l, f);
		}
	}
	function ef(e, t, n, r, i, a, o) {
		var s = t.lanes | t.childLanes;
		if (bd = s, s |= di, it(e, n, s, r, i, a), wd = null, (n & 335544064) === n ? (Td = wa(e), r = 10262) : (Td = null, r = 10256), (t.subtreeFlags & r) !== 0 || (t.flags & r) !== 0 ? (e.callbackNode = null, e.callbackPriority = 0, _f(Fe, function() {
			return lf(), null;
		})) : (e.callbackNode = null, e.callbackPriority = 0), Al = !1, r = !!(t.flags & 13878), t.subtreeFlags & 13878 || r) {
			r = H.T, H.T = null, i = U.p, U.p = 2, a = Ku, Ku |= 4;
			try {
				au(e, t, n);
			} finally {
				Ku = a, U.p = i, H.T = r;
			}
		}
		gd = 1, Al ? Cd = Mp(o, e.containerInfo, Td, rf, af, nf, of, lf, tf, null, null) : (rf(), af(), of());
	}
	function tf(e) {
		if (gd !== 0) {
			var t = _d.onRecoverableError;
			t(e, { componentStack: null });
		}
	}
	function nf() {
		gd === 3 && (gd = 0, Eu(vd, _d), gd = 4);
	}
	function rf() {
		if (gd === 1) {
			gd = 0;
			var e = _d, t = vd, n = yd, r = !!(t.flags & 13878);
			if (t.subtreeFlags & 13878 || r) {
				r = H.T, H.T = null;
				var i = U.p;
				U.p = 2;
				var a = Ku;
				Ku |= 4;
				try {
					nu = ru = !1, Su(t, e, n), n = cp;
					var o = Fr(e.containerInfo), s = n.focusedElem, c = n.selectionRange;
					if (o !== s && s && s.ownerDocument && Pr(s.ownerDocument.documentElement, s)) {
						if (c !== null && Ir(s)) {
							var l = c.start, u = c.end;
							if (u === void 0 && (u = l), "selectionStart" in s) s.selectionStart = l, s.selectionEnd = Math.min(u, s.value.length);
							else {
								var d = s.ownerDocument || document, f = d && d.defaultView || window;
								if (f.getSelection) {
									var p = f.getSelection(), m = s.textContent.length, h = Math.min(c.start, m), g = c.end === void 0 ? h : Math.min(c.end, m);
									!p.extend && h > g && (o = g, g = h, h = o);
									var _ = Nr(s, h), v = Nr(s, g);
									if (_ && v && (p.rangeCount !== 1 || p.anchorNode !== _.node || p.anchorOffset !== _.offset || p.focusNode !== v.node || p.focusOffset !== v.offset)) {
										var y = d.createRange();
										y.setStart(_.node, _.offset), p.removeAllRanges(), h > g ? (p.addRange(y), p.extend(v.node, v.offset)) : (y.setEnd(v.node, v.offset), p.addRange(y));
									}
								}
							}
						}
						for (d = [], p = s; p = p.parentNode;) p.nodeType === 1 && d.push({
							element: p,
							left: p.scrollLeft,
							top: p.scrollTop
						});
						for (typeof s.focus == "function" && s.focus(), s = 0; s < d.length; s++) {
							var b = d[s];
							b.element.scrollLeft = b.left, b.element.scrollTop = b.top;
						}
					}
					gh = !!sp, cp = sp = null;
				} finally {
					Ku = a, U.p = i, H.T = r;
				}
			}
			e.current = t, gd = 2;
		}
	}
	function af() {
		if (gd === 2) {
			gd = 0;
			var e = _d, t = vd, n = !!(t.flags & 8772);
			if (t.subtreeFlags & 8772 || n) {
				n = H.T, H.T = null;
				var r = U.p;
				U.p = 2;
				var i = Ku;
				Ku |= 4;
				try {
					su(e, t.alternate, t);
				} finally {
					Ku = i, U.p = r, H.T = n;
				}
			}
			gd = 3;
		}
	}
	function of() {
		if (gd === 4 || gd === 3) {
			gd = 0;
			var e = Cd;
			Cd = null, je();
			var t = _d, n = vd, r = yd, i = Sd, a = (r & 335544064) === r ? 10262 : 10256;
			if ((n.subtreeFlags & a) !== 0 || (n.flags & a) !== 0 ? gd = 5 : (gd = 0, vd = _d = null, sf(t, t.pendingLanes)), a = t.pendingLanes, a === 0 && (hd = null), lt(r), n = n.stateNode, Ve && typeof Ve.onCommitFiberRoot == "function") try {
				Ve.onCommitFiberRoot(Be, n, void 0, (n.current.flags & 128) == 128);
			} catch {}
			if (i !== null) {
				n = H.T, a = U.p, U.p = 2, H.T = null;
				try {
					for (var o = t.onRecoverableError, s = 0; s < i.length; s++) {
						var c = i[s];
						o(c.value, { componentStack: c.stack });
					}
				} finally {
					H.T = n, U.p = a;
				}
			}
			if (i = wd, o = Td, Td = null, i !== null && (wd = null, o === null && (o = []), e !== null)) for (c = 0; c < i.length; c++) n = (0, i[c])(o), n !== void 0 && e.finished.finally(n);
			yd & 3 && cf(), wf(t), a = t.pendingLanes, r & 261930 && a & 42 ? t === Dd ? Ed++ : (Ed = 0, Dd = t) : (Ed = 0, Dd = null), Tf(0, !1);
		}
	}
	function sf(e, t) {
		(e.pooledCacheLanes &= t) === 0 && (t = e.pooledCache, t != null && (e.pooledCache = null, xa(t)));
	}
	function cf() {
		return Cd !== null && (Cd.skipTransition(), Cd = null), rf(), af(), of(), lf();
	}
	function lf() {
		if (gd !== 5) return !1;
		var e = _d, t = bd;
		bd = 0;
		var n = lt(yd), r = H.T, a = U.p;
		try {
			U.p = 32 > n ? 32 : n, H.T = null, n = xd, xd = null;
			var o = _d, s = yd;
			if (gd = 0, vd = _d = null, yd = 0, Ku & 6) throw Error(i(331));
			var c = Ku;
			if (Ku |= 4, Vu(o.current), Nu(o, o.current, s, n), Ku = c, Tf(0, !1), Ve && typeof Ve.onPostCommitFiberRoot == "function") try {
				Ve.onPostCommitFiberRoot(Be, o);
			} catch {}
			return !0;
		} finally {
			U.p = a, H.T = r, sf(e, t);
		}
	}
	function uf(e, t, n) {
		t = Ai(n, t), t = vc(e.stateNode, t, 2), e = ao(e, t, 2), e !== null && (rt(e, 2), wf(e));
	}
	function df(e, t, n) {
		if (e.tag === 3) uf(e, e, n);
		else for (; t !== null;) {
			if (t.tag === 3) {
				uf(t, e, n);
				break;
			}
			if (t.tag === 1) {
				var r = t.stateNode;
				if (typeof t.type.getDerivedStateFromError == "function" || typeof r.componentDidCatch == "function" && (hd === null || !hd.has(r))) {
					e = Ai(n, e), n = yc(2), r = ao(t, n, 2), r !== null && (bc(n, r, t, e), rt(r, 2), wf(r));
					break;
				}
			}
			t = t.return;
		}
	}
	function ff(e, t, n) {
		var r = e.pingCache;
		if (r === null) {
			r = e.pingCache = new Gu();
			var i = /* @__PURE__ */ new Set();
			r.set(t, i);
		} else i = r.get(t), i === void 0 && (i = /* @__PURE__ */ new Set(), r.set(t, i));
		i.has(n) || (ed = !0, i.add(n), e = pf.bind(null, e, t, n), t.then(e, e));
	}
	function pf(e, t, n) {
		var r = e.pingCache;
		r !== null && r.delete(t), e.pingedLanes |= e.suspendedLanes & n, e.warmLanes &= ~n, qu === e && (Yu & n) === n && (nd === 4 || nd === 3 && (Yu & 62914560) === Yu && 300 > Me() - dd ? Ku & 2 ? ad |= n : Rd(e, 0) : ad |= n, sd === Yu && (sd = 0)), wf(e);
	}
	function mf(e, t) {
		t === 0 && (t = tt()), e = hi(e, t), e !== null && (rt(e, t), wf(e));
	}
	function hf(e) {
		var t = e.memoizedState, n = 0;
		t !== null && (n = t.retryLane), mf(e, n);
	}
	function gf(e, t) {
		var n = 0;
		switch (e.tag) {
			case 31:
			case 13:
				var r = e.stateNode, a = e.memoizedState;
				a !== null && (n = a.retryLane);
				break;
			case 19:
				r = e.stateNode;
				break;
			case 22:
				r = e.stateNode._retryCache;
				break;
			default: throw Error(i(314));
		}
		r !== null && r.delete(t), mf(e, n);
	}
	function _f(e, t) {
		return Oe(e, t);
	}
	var vf = null, yf = null, bf = !1, xf = !1, Sf = !1, Cf = 0;
	function wf(e) {
		e !== yf && e.next === null && (yf === null ? vf = yf = e : yf = yf.next = e), xf = !0, bf || (bf = !0, jf());
	}
	function Tf(e, t) {
		if (!Sf && xf) {
			Sf = !0;
			do
				for (var n = !1, r = vf; r !== null;) {
					if (!t) {
						if (e !== 0) {
							var i = r.pendingLanes;
							if (i === 0) var a = 0;
							else {
								var o = r.suspendedLanes, s = r.pingedLanes;
								a = (1 << 31 - Ue(42 | e) + 1) - 1, a &= i & ~(o & ~s), a = a & 201326741 ? a & 201326741 | 1 : a ? a | 2 : 0;
							}
							a !== 0 && (n = !0, Af(r, a));
						} else a = Yu, a = Ze(r, r === qu ? a : 0, r.cancelPendingCommit !== null || r.timeoutHandle !== -1), !(a & 3) || Qe(r, a) || (n = !0, Af(r, a));
					}
					r = r.next;
				}
			while (n);
			Sf = !1;
		}
	}
	function Ef() {
		Df();
	}
	function Df() {
		xf = bf = !1;
		var e = 0;
		Cf !== 0 && hp() && (e = Cf);
		for (var t = Me(), n = null, r = vf; r !== null;) {
			var i = r.next, a = Of(r, t);
			a === 0 ? (r.next = null, n === null ? vf = i : n.next = i, i === null && (yf = n)) : (n = r, (e !== 0 || a & 3) && (xf = !0)), r = i;
		}
		gd !== 0 && gd !== 5 || Tf(e, !1), Cf !== 0 && (Cf = 0);
	}
	function Of(e, t) {
		for (var n = e.suspendedLanes, r = e.pingedLanes, i = e.expirationTimes, a = e.pendingLanes & -62914561; 0 < a;) {
			var o = 31 - Ue(a), s = 1 << o, c = i[o];
			c === -1 ? ((s & n) === 0 || (s & r) !== 0) && (i[o] = et(s, t)) : c <= t && (e.expiredLanes |= s), a &= ~s;
		}
		if (t = qu, n = Yu, n = Ze(e, e === t ? n : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1), r = e.callbackNode, n === 0 || e === t && (Xu === 2 || Xu === 9) || e.cancelPendingCommit !== null) return r !== null && r !== null && ke(r), e.callbackNode = null, e.callbackPriority = 0;
		if (!(n & 3) || Qe(e, n)) {
			if (t = n & -n, t === e.callbackPriority) return t;
			switch (r !== null && ke(r), lt(n)) {
				case 2:
				case 8:
					n = Pe;
					break;
				case 32:
					n = Fe;
					break;
				case 268435456:
					n = Le;
					break;
				default: n = Fe;
			}
			return r = kf.bind(null, e), n = Oe(n, r), e.callbackPriority = t, e.callbackNode = n, t;
		}
		return r !== null && r !== null && ke(r), e.callbackPriority = 2, e.callbackNode = null, 2;
	}
	function kf(e, t) {
		if (gd !== 0 && gd !== 5) return e.callbackNode = null, e.callbackPriority = 0, null;
		var n = e.callbackNode;
		if (cf() && e.callbackNode !== n) return null;
		var r = Yu;
		return r = Ze(e, e === qu ? r : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1), r === 0 ? null : (Md(e, r, t), Of(e, Me()), e.callbackNode != null && e.callbackNode === n ? kf.bind(null, e) : null);
	}
	function Af(e, t) {
		if (cf()) return null;
		Md(e, t, !0);
	}
	function jf() {
		bp(function() {
			Ku & 6 ? Oe(q, Ef) : Df();
		});
	}
	function Mf() {
		if (Cf === 0) {
			var e = Da;
			e === 0 && (e = qe, qe <<= 1, !(qe & 261888) && (qe = 256)), Cf = e;
		}
		return Cf;
	}
	function Nf(e) {
		return e == null || typeof e == "symbol" || typeof e == "boolean" ? null : typeof e == "function" ? e : an(e);
	}
	function Pf(e, t, n, r, i) {
		if (t === "submit" && n && n.stateNode === i) {
			var a = Nf((i[mt] || null).action), o = r.submitter;
			o && (t = (t = o[mt] || null) ? Nf(t.formAction) : o.getAttribute("formAction"), t !== null && (a = t, o = null));
			var s = new Dn("action", "action", null, r, i);
			e.push({
				event: s,
				listeners: [{
					instance: null,
					listener: function() {
						if (r.defaultPrevented) {
							if (Cf !== 0) {
								var e = new FormData(i, o);
								Ws(n, {
									pending: !0,
									data: e,
									method: i.method,
									action: a
								}, null, e);
							}
						} else typeof a == "function" && (s.preventDefault(), e = new FormData(i, o), Ws(n, {
							pending: !0,
							data: e,
							method: i.method,
							action: a
						}, a, e));
					},
					currentTarget: i
				}]
			});
		}
	}
	for (var Ff = 0; Ff < ni.length; Ff++) {
		var If = ni[Ff];
		ri(If.toLowerCase(), "on" + (If[0].toUpperCase() + If.slice(1)));
	}
	ri(Jr, "onAnimationEnd"), ri(Yr, "onAnimationIteration"), ri(Xr, "onAnimationStart"), ri("dblclick", "onDoubleClick"), ri("focusin", "onFocus"), ri("focusout", "onBlur"), ri(Zr, "onTransitionRun"), ri(Qr, "onTransitionStart"), ri($r, "onTransitionCancel"), ri(ei, "onTransitionEnd"), jt("onMouseEnter", ["mouseout", "mouseover"]), jt("onMouseLeave", ["mouseout", "mouseover"]), jt("onPointerEnter", ["pointerout", "pointerover"]), jt("onPointerLeave", ["pointerout", "pointerover"]), At("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" ")), At("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" ")), At("onBeforeInput", [
		"compositionend",
		"keypress",
		"textInput",
		"paste"
	]), At("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" ")), At("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" ")), At("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
	var Lf = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "), Rf = new Set("beforetoggle cancel close invalid load scroll scrollend toggle".split(" ").concat(Lf));
	function zf(e, t) {
		t = !!(t & 4);
		for (var n = 0; n < e.length; n++) {
			var r = e[n], i = r.event;
			r = r.listeners;
			a: {
				var a = void 0;
				if (t) for (var o = r.length - 1; 0 <= o; o--) {
					var s = r[o], c = s.instance, l = s.currentTarget;
					if (s = s.listener, c !== a && i.isPropagationStopped()) break a;
					a = s, i.currentTarget = l;
					try {
						a(i);
					} catch (e) {
						ci(e);
					}
					i.currentTarget = null, a = c;
				}
				else for (o = 0; o < r.length; o++) {
					if (s = r[o], c = s.instance, l = s.currentTarget, s = s.listener, c !== a && i.isPropagationStopped()) break a;
					a = s, i.currentTarget = l;
					try {
						a(i);
					} catch (e) {
						ci(e);
					}
					i.currentTarget = null, a = c;
				}
			}
		}
	}
	function Bf(e, t) {
		var n = t[gt];
		n === void 0 && (n = t[gt] = /* @__PURE__ */ new Set());
		var r = e + "__bubble";
		n.has(r) || (Wf(t, e, 2, !1), n.add(r));
	}
	function Vf(e, t, n) {
		var r = 0;
		t && (r |= 4), Wf(n, e, r, t);
	}
	var Hf = "_reactListening" + Math.random().toString(36).slice(2);
	function Uf(e) {
		if (!e[Hf]) {
			e[Hf] = !0, Ot.forEach(function(t) {
				t !== "selectionchange" && (Rf.has(t) || Vf(t, !1, e), Vf(t, !0, e));
			});
			var t = e.nodeType === 9 ? e : e.ownerDocument;
			t === null || t[Hf] || (t[Hf] = !0, Vf("selectionchange", !1, t));
		}
	}
	function Wf(e, t, n, r) {
		switch (Ch(t)) {
			case 2:
				var i = _h;
				break;
			case 8:
				i = vh;
				break;
			default: i = yh;
		}
		n = i.bind(null, t, n, e), i = void 0, !gn || t !== "touchstart" && t !== "touchmove" && t !== "wheel" || (i = !0), r ? i === void 0 ? e.addEventListener(t, n, !0) : e.addEventListener(t, n, {
			capture: !0,
			passive: i
		}) : i === void 0 ? e.addEventListener(t, n, !1) : e.addEventListener(t, n, { passive: i });
	}
	function Gf(e, t, n, r, i) {
		var a = r;
		if (!(t & 1) && !(t & 2) && r !== null) a: for (;;) {
			if (r === null) return;
			var s = r.tag;
			if (s === 3 || s === 4) {
				var c = r.stateNode.containerInfo;
				if (c === i) break;
				if (s === 4) for (s = r.return; s !== null;) {
					var l = s.tag;
					if ((l === 3 || l === 4) && s.stateNode.containerInfo === i) return;
					s = s.return;
				}
				for (; c !== null;) {
					if (s = St(c), s === null) return;
					if (l = s.tag, l === 5 || l === 6 || l === 26 || l === 27) {
						r = a = s;
						continue a;
					}
					c = c.parentNode;
				}
			}
			r = r.return;
		}
		pn(function() {
			var r = a, i = cn(n), s = [];
			a: {
				var c = ti.get(e);
				if (c !== void 0) {
					var l = Dn, u = e;
					switch (e) {
						case "keypress": if (Sn(n) === 0) break a;
						case "keydown":
						case "keyup":
							l = Gn;
							break;
						case "focusin":
							u = "focus", l = In;
							break;
						case "focusout":
							u = "blur", l = In;
							break;
						case "beforeblur":
						case "afterblur":
							l = In;
							break;
						case "click": if (n.button === 2) break a;
						case "auxclick":
						case "dblclick":
						case "mousedown":
						case "mousemove":
						case "mouseup":
						case "mouseout":
						case "mouseover":
						case "contextmenu":
							l = Pn;
							break;
						case "drag":
						case "dragend":
						case "dragenter":
						case "dragexit":
						case "dragleave":
						case "dragover":
						case "dragstart":
						case "drop":
							l = Fn;
							break;
						case "touchcancel":
						case "touchend":
						case "touchmove":
						case "touchstart":
							l = Jn;
							break;
						case Jr:
						case Yr:
						case Xr:
							l = Ln;
							break;
						case ei:
							l = Yn;
							break;
						case "scroll":
						case "scrollend":
							l = kn;
							break;
						case "wheel":
							l = Xn;
							break;
						case "copy":
						case "cut":
						case "paste":
							l = Rn;
							break;
						case "gotpointercapture":
						case "lostpointercapture":
						case "pointercancel":
						case "pointerdown":
						case "pointermove":
						case "pointerout":
						case "pointerover":
						case "pointerup":
							l = Kn;
							break;
						case "submit":
							l = qn;
							break;
						case "toggle":
						case "beforetoggle": l = Zn;
					}
					var d = !!(t & 4), f = !d && (e === "scroll" || e === "scrollend"), p = d ? c === null ? null : c + "Capture" : c;
					d = [];
					for (var m = r, h; m !== null;) {
						var g = m;
						if (h = g.stateNode, g = g.tag, g !== 5 && g !== 26 && g !== 27 || h === null || p === null || (g = mn(m, p), g != null && d.push(Kf(m, g, h))), f) break;
						m = m.return;
					}
					0 < d.length && (c = new l(c, u, null, n, i), s.push({
						event: c,
						listeners: d
					}));
				}
			}
			if (!(t & 7)) {
				a: {
					if (l = e === "mouseover" || e === "pointerover", c = e === "mouseout" || e === "pointerout", l && n !== sn && (u = n.relatedTarget || n.fromElement) && (St(u) || u[ht])) break a;
					(c || l) && (u = i.window === i ? i : (l = i.ownerDocument) ? l.defaultView || l.parentWindow : window, c ? (l = n.relatedTarget || n.toElement, c = r, l = l ? St(l) : null, l !== null && (f = o(l), d = l.tag, l !== f || d !== 5 && d !== 27 && d !== 6) && (l = null)) : (c = null, l = r), c !== l && (d = Pn, g = "onMouseLeave", p = "onMouseEnter", m = "mouse", (e === "pointerout" || e === "pointerover") && (d = Kn, g = "onPointerLeave", p = "onPointerEnter", m = "pointer"), f = c == null ? u : wt(c), h = l == null ? u : wt(l), u = new d(g, m + "leave", c, n, i), u.target = f, u.relatedTarget = h, g = null, St(i) === r && (d = new d(p, m + "enter", l, n, i), d.target = h, d.relatedTarget = f, g = d), f = g, d = c && l ? E(c, l, Jf) : null, c !== null && Yf(s, u, c, d, !1), l !== null && f !== null && Yf(s, f, l, d, !0)));
				}
				a: {
					if (c = r ? wt(r) : window, l = c.nodeName && c.nodeName.toLowerCase(), l === "select" || l === "input" && c.type === "file") var _ = _r;
					else if (dr(c)) {
						if (vr) _ = Dr;
						else {
							_ = Tr;
							var v = wr;
						}
					} else l = c.nodeName, !l || l.toLowerCase() !== "input" || c.type !== "checkbox" && c.type !== "radio" ? r && tn(r.elementType) && (_ = _r) : _ = Er;
					if (_ &&= _(e, r)) {
						fr(s, _, n, i);
						break a;
					}
					v && v(e, c, r);
				}
				switch (v = r ? wt(r) : window, e) {
					case "focusin":
						(dr(v) || v.contentEditable === "true") && (Rr = v, zr = r, Br = null);
						break;
					case "focusout":
						Br = zr = Rr = null;
						break;
					case "mousedown":
						Vr = !0;
						break;
					case "contextmenu":
					case "mouseup":
					case "dragend":
						Vr = !1, Hr(s, n, i);
						break;
					case "selectionchange": if (Lr) break;
					case "keydown":
					case "keyup": Hr(s, n, i);
				}
				var y;
				if ($n) b: {
					switch (e) {
						case "compositionstart":
							var b = "onCompositionStart";
							break b;
						case "compositionend":
							b = "onCompositionEnd";
							break b;
						case "compositionupdate":
							b = "onCompositionUpdate";
							break b;
					}
					b = void 0;
				}
				else sr ? ar(e, n) && (b = "onCompositionEnd") : e === "keydown" && n.keyCode === 229 && (b = "onCompositionStart");
				b && (nr && n.locale !== "ko" && (sr || b !== "onCompositionStart" ? b === "onCompositionEnd" && sr && (y = xn()) : (vn = i, yn = "value" in vn ? vn.value : vn.textContent, sr = !0)), v = qf(r, b), 0 < v.length && (b = new zn(b, e, null, n, i), s.push({
					event: b,
					listeners: v
				}), y ? b.data = y : (y = or(n), y !== null && (b.data = y)))), (y = tr ? cr(e, n) : lr(e, n)) && (b = qf(r, "onBeforeInput"), 0 < b.length && (v = new zn("onBeforeInput", "beforeinput", null, n, i), s.push({
					event: v,
					listeners: b
				}), v.data = y)), Pf(s, e, r, n, i);
			}
			zf(s, t);
		});
	}
	function Kf(e, t, n) {
		return {
			instance: e,
			listener: t,
			currentTarget: n
		};
	}
	function qf(e, t) {
		for (var n = t + "Capture", r = []; e !== null;) {
			var i = e, a = i.stateNode;
			if (i = i.tag, i !== 5 && i !== 26 && i !== 27 || a === null || (i = mn(e, n), i != null && r.unshift(Kf(e, i, a)), i = mn(e, t), i != null && r.push(Kf(e, i, a))), e.tag === 3) return r;
			e = e.return;
		}
		return [];
	}
	function Jf(e) {
		if (e === null) return null;
		do
			e = e.return;
		while (e && e.tag !== 5 && e.tag !== 27);
		return e || null;
	}
	function Yf(e, t, n, r, i) {
		for (var a = t._reactName, o = []; n !== null && n !== r;) {
			var s = n, c = s.alternate, l = s.stateNode;
			if (s = s.tag, c !== null && c === r) break;
			s !== 5 && s !== 26 && s !== 27 || l === null || (c = l, i ? (l = mn(n, a), l != null && o.unshift(Kf(n, l, c))) : i || (l = mn(n, a), l != null && o.push(Kf(n, l, c)))), n = n.return;
		}
		o.length !== 0 && e.push({
			event: t,
			listeners: o
		});
	}
	var Xf = /\r\n?/g, Zf = /\u0000|\uFFFD/g;
	function Qf(e) {
		return (typeof e == "string" ? e : "" + e).replace(Xf, "\n").replace(Zf, "");
	}
	function $f(e, t) {
		return t = Qf(t), Qf(e) === t;
	}
	function ep(e, t, n, r, a, o) {
		switch (n) {
			case "children":
				if (typeof r == "string") t === "body" || t === "textarea" && r === "" || Qt(e, r);
				else if (typeof r == "number" || typeof r == "bigint") t !== "body" && Qt(e, "" + r);
				else return;
				break;
			case "className":
				Y(e, "class", r);
				break;
			case "tabIndex":
				Y(e, "tabindex", r);
				break;
			case "dir":
			case "role":
			case "viewBox":
			case "width":
			case "height":
				Y(e, n, r);
				break;
			case "style":
				Z(e, r, o);
				return;
			case "data": if (t !== "object") {
				Y(e, "data", r);
				break;
			}
			case "src":
			case "href":
				if (r === "" && (t !== "a" || n !== "href")) {
					e.removeAttribute(n);
					break;
				}
				if (r == null || typeof r == "function" || typeof r == "symbol" || typeof r == "boolean") {
					e.removeAttribute(n);
					break;
				}
				r = an(r), e.setAttribute(n, r);
				break;
			case "action":
			case "formAction":
				if (typeof r == "function") {
					e.setAttribute(n, "javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')");
					break;
				}
				if (typeof o == "function" && (n === "formAction" ? (t !== "input" && ep(e, t, "name", a.name, a, null), ep(e, t, "formEncType", a.formEncType, a, null), ep(e, t, "formMethod", a.formMethod, a, null), ep(e, t, "formTarget", a.formTarget, a, null)) : (ep(e, t, "encType", a.encType, a, null), ep(e, t, "method", a.method, a, null), ep(e, t, "target", a.target, a, null))), r == null || typeof r == "symbol" || typeof r == "boolean") {
					e.removeAttribute(n);
					break;
				}
				r = an(r), e.setAttribute(n, r);
				break;
			case "onClick":
				r != null && (e.onclick = on);
				return;
			case "onScroll":
				r != null && Bf("scroll", e);
				return;
			case "onScrollEnd":
				r != null && Bf("scrollend", e);
				return;
			case "dangerouslySetInnerHTML":
				if (r != null) {
					if (typeof r != "object" || !("__html" in r)) throw Error(i(61));
					if (n = r.__html, n != null) {
						if (a.children != null) throw Error(i(60));
						o?.__html !== n && (e.innerHTML = n);
					}
				}
				break;
			case "multiple":
				e.multiple = r && typeof r != "function" && typeof r != "symbol";
				break;
			case "muted":
				e.muted = r && typeof r != "function" && typeof r != "symbol";
				break;
			case "suppressContentEditableWarning":
			case "suppressHydrationWarning":
			case "defaultValue":
			case "defaultChecked":
			case "innerHTML":
			case "ref": break;
			case "autoFocus": break;
			case "xlinkHref":
				if (r == null || typeof r == "function" || typeof r == "boolean" || typeof r == "symbol") {
					e.removeAttribute("xlink:href");
					break;
				}
				n = an(r), e.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", n);
				break;
			case "contentEditable":
			case "spellCheck":
			case "draggable":
			case "value":
			case "autoReverse":
			case "externalResourcesRequired":
			case "focusable":
			case "preserveAlpha":
				r != null && typeof r != "function" && typeof r != "symbol" ? e.setAttribute(n, r) : e.removeAttribute(n);
				break;
			case "inert":
			case "allowFullScreen":
			case "async":
			case "autoPlay":
			case "controls":
			case "credentialless":
			case "default":
			case "defer":
			case "disabled":
			case "disablePictureInPicture":
			case "disableRemotePlayback":
			case "formNoValidate":
			case "hidden":
			case "loop":
			case "noModule":
			case "noValidate":
			case "open":
			case "playsInline":
			case "readOnly":
			case "required":
			case "reversed":
			case "scoped":
			case "seamless":
			case "itemScope":
				r && typeof r != "function" && typeof r != "symbol" ? e.setAttribute(n, "") : e.removeAttribute(n);
				break;
			case "capture":
			case "download":
				!0 === r ? e.setAttribute(n, "") : !1 !== r && r != null && typeof r != "function" && typeof r != "symbol" ? e.setAttribute(n, r) : e.removeAttribute(n);
				break;
			case "cols":
			case "rows":
			case "size":
			case "span":
				r != null && typeof r != "function" && typeof r != "symbol" && !isNaN(r) && 1 <= r ? e.setAttribute(n, r) : e.removeAttribute(n);
				break;
			case "rowSpan":
			case "start":
				r == null || typeof r == "function" || typeof r == "symbol" || isNaN(r) ? e.removeAttribute(n) : e.setAttribute(n, r);
				break;
			case "popover":
				Bf("beforetoggle", e), Bf("toggle", e), Rt(e, "popover", r);
				break;
			case "xlinkActuate":
				zt(e, "http://www.w3.org/1999/xlink", "xlink:actuate", r);
				break;
			case "xlinkArcrole":
				zt(e, "http://www.w3.org/1999/xlink", "xlink:arcrole", r);
				break;
			case "xlinkRole":
				zt(e, "http://www.w3.org/1999/xlink", "xlink:role", r);
				break;
			case "xlinkShow":
				zt(e, "http://www.w3.org/1999/xlink", "xlink:show", r);
				break;
			case "xlinkTitle":
				zt(e, "http://www.w3.org/1999/xlink", "xlink:title", r);
				break;
			case "xlinkType":
				zt(e, "http://www.w3.org/1999/xlink", "xlink:type", r);
				break;
			case "xmlBase":
				zt(e, "http://www.w3.org/XML/1998/namespace", "xml:base", r);
				break;
			case "xmlLang":
				zt(e, "http://www.w3.org/XML/1998/namespace", "xml:lang", r);
				break;
			case "xmlSpace":
				zt(e, "http://www.w3.org/XML/1998/namespace", "xml:space", r);
				break;
			case "is":
				Rt(e, "is", r);
				break;
			case "innerText":
			case "textContent": return;
			default: if (!(2 < n.length) || n[0] !== "o" && n[0] !== "O" || n[1] !== "n" && n[1] !== "N") n = nn.get(n) || n, Rt(e, n, r);
			else return;
		}
		It = !0;
	}
	function tp(e, t, n, r, a, o) {
		switch (n) {
			case "style":
				Z(e, r, o);
				return;
			case "dangerouslySetInnerHTML":
				if (r != null) {
					if (typeof r != "object" || !("__html" in r)) throw Error(i(61));
					if (n = r.__html, n != null) {
						if (a.children != null) throw Error(i(60));
						o?.__html !== n && (e.innerHTML = n);
					}
				}
				break;
			case "children":
				if (typeof r == "string") Qt(e, r);
				else if (typeof r == "number" || typeof r == "bigint") Qt(e, "" + r);
				else return;
				break;
			case "onScroll":
				r != null && Bf("scroll", e);
				return;
			case "onScrollEnd":
				r != null && Bf("scrollend", e);
				return;
			case "onClick":
				r != null && (e.onclick = on);
				return;
			case "suppressContentEditableWarning":
			case "suppressHydrationWarning":
			case "innerHTML":
			case "ref": return;
			case "innerText":
			case "textContent": return;
			default:
				if (!kt.hasOwnProperty(n)) a: {
					if (n[0] === "o" && n[1] === "n" && (a = n.endsWith("Capture"), o = n.slice(2, a ? n.length - 7 : void 0), t = e[mt] || null, t = t == null ? null : t[n], typeof t == "function" && e.removeEventListener(o, t, a), typeof r == "function")) {
						typeof t != "function" && t !== null && (n in e ? e[n] = null : e.hasAttribute(n) && e.removeAttribute(n)), e.addEventListener(o, r, a);
						break a;
					}
					It = !0, n in e ? e[n] = r : !0 === r ? e.setAttribute(n, "") : Rt(e, n, r);
				}
				return;
		}
		It = !0;
	}
	function np(e, t, n) {
		switch (t) {
			case "div":
			case "span":
			case "svg":
			case "path":
			case "a":
			case "g":
			case "p":
			case "li": break;
			case "img":
				Bf("error", e), Bf("load", e);
				var r = !1, a = !1, o;
				for (o in n) if (n.hasOwnProperty(o)) {
					var s = n[o];
					if (s != null) switch (o) {
						case "src":
							r = !0;
							break;
						case "srcSet":
							a = !0;
							break;
						case "children":
						case "dangerouslySetInnerHTML": throw Error(i(137, t));
						default: ep(e, t, o, s, n, null);
					}
				}
				a && ep(e, t, "srcSet", n.srcSet, n, null), r && ep(e, t, "src", n.src, n, null);
				return;
			case "input":
				Bf("invalid", e);
				var c = o = s = a = null, l = null, u = null;
				for (r in n) if (n.hasOwnProperty(r)) {
					var d = n[r];
					if (d != null) switch (r) {
						case "name":
							a = d;
							break;
						case "type":
							s = d;
							break;
						case "checked":
							l = d;
							break;
						case "defaultChecked":
							u = d;
							break;
						case "value":
							o = d;
							break;
						case "defaultValue":
							c = d;
							break;
						case "children":
						case "dangerouslySetInnerHTML":
							if (d != null) throw Error(i(137, t));
							break;
						default: ep(e, t, r, d, n, null);
					}
				}
				qt(e, o, c, l, u, s, a, !1);
				return;
			case "select":
				for (a in Bf("invalid", e), r = s = o = null, n) if (n.hasOwnProperty(a) && (c = n[a], c != null)) switch (a) {
					case "value":
						o = c;
						break;
					case "defaultValue":
						s = c;
						break;
					case "multiple": r = c;
					default: ep(e, t, a, c, n, null);
				}
				t = o, n = s, e.multiple = !!r, t == null ? n != null && Yt(e, !!r, n, !0) : Yt(e, !!r, t, !1);
				return;
			case "textarea":
				for (s in Bf("invalid", e), o = a = r = null, n) if (n.hasOwnProperty(s) && (c = n[s], c != null)) switch (s) {
					case "value":
						r = c;
						break;
					case "defaultValue":
						a = c;
						break;
					case "children":
						o = c;
						break;
					case "dangerouslySetInnerHTML":
						if (c != null) throw Error(i(91));
						break;
					default: ep(e, t, s, c, n, null);
				}
				Zt(e, r, a, o);
				return;
			case "option":
				for (l in n) if (n.hasOwnProperty(l) && (r = n[l], r != null)) switch (l) {
					case "selected":
						e.selected = r && typeof r != "function" && typeof r != "symbol";
						break;
					default: ep(e, t, l, r, n, null);
				}
				return;
			case "dialog":
				Bf("beforetoggle", e), Bf("toggle", e), Bf("cancel", e), Bf("close", e);
				break;
			case "iframe":
			case "object":
				Bf("load", e);
				break;
			case "video":
			case "audio":
				for (r = 0; r < Lf.length; r++) Bf(Lf[r], e);
				break;
			case "image":
				Bf("error", e), Bf("load", e);
				break;
			case "details":
				Bf("toggle", e);
				break;
			case "embed":
			case "source":
			case "link": Bf("error", e), Bf("load", e);
			case "area":
			case "base":
			case "br":
			case "col":
			case "hr":
			case "keygen":
			case "meta":
			case "param":
			case "track":
			case "wbr":
			case "menuitem":
				for (u in n) if (n.hasOwnProperty(u) && (r = n[u], r != null)) switch (u) {
					case "children":
					case "dangerouslySetInnerHTML": throw Error(i(137, t));
					default: ep(e, t, u, r, n, null);
				}
				return;
			default: if (tn(t)) {
				for (d in n) n.hasOwnProperty(d) && (r = n[d], r !== void 0 && tp(e, t, d, r, n, void 0));
				return;
			}
		}
		for (c in n) n.hasOwnProperty(c) && (r = n[c], r != null && ep(e, t, c, r, n, null));
	}
	var rp = {};
	function ip(e, t, n, r) {
		switch (t) {
			case "div":
			case "span":
			case "svg":
			case "path":
			case "a":
			case "g":
			case "p":
			case "li": break;
			case "input":
				var a = null, o = null, s = null, c = null, l = null, u = null, d = null;
				for (m in n) {
					var f = n[m];
					if (n.hasOwnProperty(m) && f != null) switch (m) {
						case "checked": break;
						case "value": break;
						case "defaultValue": l = f;
						default: r.hasOwnProperty(m) || ep(e, t, m, null, r, f);
					}
				}
				for (var p in r) {
					var m = r[p];
					if (f = n[p], r.hasOwnProperty(p) && (m != null || f != null)) switch (p) {
						case "type":
							m !== f && (It = !0), o = m;
							break;
						case "name":
							m !== f && (It = !0), a = m;
							break;
						case "checked":
							m !== f && (It = !0), u = m;
							break;
						case "defaultChecked":
							m !== f && (It = !0), d = m;
							break;
						case "value":
							m !== f && (It = !0), s = m;
							break;
						case "defaultValue":
							m !== f && (It = !0), c = m;
							break;
						case "children":
						case "dangerouslySetInnerHTML":
							if (m != null) throw Error(i(137, t));
							break;
						default: m !== f && ep(e, t, p, m, r, f);
					}
				}
				Kt(e, s, c, l, u, d, o, a);
				return;
			case "select":
				for (o in m = s = c = p = null, n) if (l = n[o], n.hasOwnProperty(o) && l != null) switch (o) {
					case "value": break;
					case "multiple": m = l;
					default: r.hasOwnProperty(o) || ep(e, t, o, null, r, l);
				}
				for (a in r) if (o = r[a], l = n[a], r.hasOwnProperty(a) && (o != null || l != null)) switch (a) {
					case "value":
						o !== l && (It = !0), p = o;
						break;
					case "defaultValue":
						o !== l && (It = !0), c = o;
						break;
					case "multiple": o !== l && (It = !0), s = o;
					default: o !== l && ep(e, t, a, o, r, l);
				}
				t = c, n = s, r = m, p == null ? !!r != !!n && (t == null ? Yt(e, !!n, n ? [] : "", !1) : Yt(e, !!n, t, !0)) : Yt(e, !!n, p, !1);
				return;
			case "textarea":
				for (c in m = p = null, n) if (a = n[c], n.hasOwnProperty(c) && a != null && !r.hasOwnProperty(c)) switch (c) {
					case "value": break;
					case "children": break;
					default: ep(e, t, c, null, r, a);
				}
				for (s in r) if (a = r[s], o = n[s], r.hasOwnProperty(s) && (a != null || o != null)) switch (s) {
					case "value":
						a !== o && (It = !0), p = a;
						break;
					case "defaultValue":
						a !== o && (It = !0), m = a;
						break;
					case "children": break;
					case "dangerouslySetInnerHTML":
						if (a != null) throw Error(i(91));
						break;
					default: a !== o && ep(e, t, s, a, r, o);
				}
				Xt(e, p, m);
				return;
			case "option":
				for (var h in n) if (p = n[h], n.hasOwnProperty(h) && p != null && !r.hasOwnProperty(h)) switch (h) {
					case "selected":
						e.selected = !1;
						break;
					default: ep(e, t, h, null, r, p);
				}
				for (l in r) if (p = r[l], m = n[l], r.hasOwnProperty(l) && p !== m && (p != null || m != null)) switch (l) {
					case "selected":
						p !== m && (It = !0), e.selected = p && typeof p != "function" && typeof p != "symbol";
						break;
					default: ep(e, t, l, p, r, m);
				}
				return;
			case "img":
			case "link":
			case "area":
			case "base":
			case "br":
			case "col":
			case "embed":
			case "hr":
			case "keygen":
			case "meta":
			case "param":
			case "source":
			case "track":
			case "wbr":
			case "menuitem":
				for (var g in n) p = n[g], n.hasOwnProperty(g) && p != null && !r.hasOwnProperty(g) && ep(e, t, g, null, r, p);
				for (u in r) if (p = r[u], m = n[u], r.hasOwnProperty(u) && p !== m && (p != null || m != null)) switch (u) {
					case "children":
					case "dangerouslySetInnerHTML":
						if (p != null) throw Error(i(137, t));
						break;
					default: ep(e, t, u, p, r, m);
				}
				return;
			default: if (tn(t)) {
				for (var _ in n) p = n[_], n.hasOwnProperty(_) && p !== void 0 && !r.hasOwnProperty(_) && tp(e, t, _, void 0, r, p);
				for (d in r) p = r[d], m = n[d], !r.hasOwnProperty(d) || p === m || p === void 0 && m === void 0 || tp(e, t, d, p, r, m);
				return;
			}
		}
		for (var v in n) p = n[v], n.hasOwnProperty(v) && p != null && !r.hasOwnProperty(v) && ep(e, t, v, null, r, p);
		for (f in r) p = r[f], m = n[f], !r.hasOwnProperty(f) || p === m || p == null && m == null || ep(e, t, f, p, r, m);
	}
	function ap(e) {
		switch (e) {
			case "css":
			case "script":
			case "font":
			case "img":
			case "image":
			case "input":
			case "link": return !0;
			default: return !1;
		}
	}
	function op() {
		if (typeof performance.getEntriesByType == "function") {
			for (var e = 0, t = 0, n = performance.getEntriesByType("resource"), r = 0; r < n.length; r++) {
				var i = n[r], a = i.transferSize, o = i.initiatorType, s = i.duration;
				if (a && s && ap(o)) {
					for (o = 0, s = i.responseEnd, r += 1; r < n.length; r++) {
						var c = n[r], l = c.startTime;
						if (l > s) break;
						var u = c.transferSize, d = c.initiatorType;
						u && ap(d) && (c = c.responseEnd, o += u * (c < s ? 1 : (s - l) / (c - l)));
					}
					if (--r, t += 8 * (a + o) / (i.duration / 1e3), e++, 10 < e) break;
				}
			}
			if (0 < e) return t / e / 1e6;
		}
		return navigator.connection && (e = navigator.connection.downlink, typeof e == "number") ? e : 5;
	}
	var sp = null, cp = null;
	function lp(e) {
		return e.nodeType === 9 ? e : e.ownerDocument;
	}
	function up(e) {
		switch (e) {
			case "http://www.w3.org/2000/svg": return 1;
			case "http://www.w3.org/1998/Math/MathML": return 2;
			default: return 0;
		}
	}
	function dp(e, t) {
		if (e === 0) switch (t) {
			case "svg": return 1;
			case "math": return 2;
			default: return 0;
		}
		return e === 1 && t === "foreignObject" ? 0 : e;
	}
	function fp(e, t, n, r) {
		return n = lp(n).createElement(e), n[pt] = r, n[mt] = t, np(n, e, t), Et(n), n;
	}
	function pp(e, t) {
		return e === "textarea" || e === "noscript" || typeof t.children == "string" || typeof t.children == "number" || typeof t.children == "bigint" || typeof t.dangerouslySetInnerHTML == "object" && t.dangerouslySetInnerHTML !== null && t.dangerouslySetInnerHTML.__html != null;
	}
	var mp = null;
	function hp() {
		var e = window.event;
		return e && e.type === "popstate" ? e !== mp && (mp = e, !0) : (mp = null, !1);
	}
	var gp = typeof setTimeout == "function" ? setTimeout : void 0, _p = typeof clearTimeout == "function" ? clearTimeout : void 0, vp = typeof Promise == "function" ? Promise : void 0, yp = typeof requestAnimationFrame == "function" ? requestAnimationFrame : gp, bp = typeof queueMicrotask == "function" ? queueMicrotask : vp === void 0 ? gp : function(e) {
		return vp.resolve(null).then(e).catch(xp);
	};
	function xp(e) {
		setTimeout(function() {
			throw e;
		});
	}
	function Sp(e) {
		return e === "head";
	}
	function Cp(e, t) {
		var n = t, r = 0;
		do {
			var i = n.nextSibling;
			if (e.removeChild(n), i && i.nodeType === 8) {
				if (n = i.data, n === "/$" || n === "/&") {
					if (r === 0) {
						e.removeChild(i), Hh(t);
						return;
					}
					r--;
				} else if (n === "$" || n === "$?" || n === "$~" || n === "$!" || n === "&") r++;
				else if (n === "html") _m(e.ownerDocument.documentElement);
				else if (n === "head") {
					n = e.ownerDocument.head, _m(n);
					for (var a = n.firstChild; a;) {
						var o = a.nextSibling, s = a.nodeName;
						a[bt] || s === "SCRIPT" || s === "STYLE" || s === "LINK" && a.rel.toLowerCase() === "stylesheet" || n.removeChild(a), a = o;
					}
				} else n === "body" && _m(e.ownerDocument.body);
			}
			n = i;
		} while (n);
		Hh(t);
	}
	function wp(e, t) {
		var n = e;
		e = 0;
		do {
			var r = n.nextSibling;
			if (n.nodeType === 1 ? t ? (n._stashedDisplay = n.style.display, n.style.display = "none") : (n.style.display = n._stashedDisplay || "", n.getAttribute("style") === "" && n.removeAttribute("style")) : n.nodeType === 3 && (t ? (n._stashedText = n.nodeValue, n.nodeValue = "") : n.nodeValue = n._stashedText || ""), r && r.nodeType === 8) {
				if (n = r.data, n === "/$") {
					if (e === 0) break;
					e--;
				} else n !== "$" && n !== "$?" && n !== "$~" && n !== "$!" || e++;
			}
			n = r;
		} while (n);
	}
	function Tp(e, t, n) {
		if (t = CSS.escape(t) === t ? t : "r-" + btoa(t).replace(/=/g, ""), e.style.viewTransitionName = t, n != null && (e.style.viewTransitionClass = n), n = getComputedStyle(e), n.display === "inline") {
			if (t = e.getClientRects(), t.length === 1) var r = 1;
			else for (var i = r = 0; i < t.length; i++) {
				var a = t[i];
				0 < a.width && 0 < a.height && r++;
			}
			r === 1 && (e = e.style, e.display = t.length === 1 ? "inline-block" : "block", e.marginTop = "-" + n.paddingTop, e.marginBottom = "-" + n.paddingBottom);
		}
	}
	function Ep(e, t) {
		e = e.style, t = t.style;
		var n = t == null ? null : t.hasOwnProperty("viewTransitionName") ? t.viewTransitionName : t.hasOwnProperty("view-transition-name") ? t["view-transition-name"] : null;
		e.viewTransitionName = n == null || typeof n == "boolean" ? "" : ("" + n).trim(), n = t == null ? null : t.hasOwnProperty("viewTransitionClass") ? t.viewTransitionClass : t.hasOwnProperty("view-transition-class") ? t["view-transition-class"] : null, e.viewTransitionClass = n == null || typeof n == "boolean" ? "" : ("" + n).trim(), e.display === "inline-block" && (t == null ? e.display = e.margin = "" : (n = t.display, e.display = n == null || typeof n == "boolean" ? "" : n, n = t.margin, n == null ? (n = t.hasOwnProperty("marginTop") ? t.marginTop : t["margin-top"], e.marginTop = n == null || typeof n == "boolean" ? "" : n, t = t.hasOwnProperty("marginBottom") ? t.marginBottom : t["margin-bottom"], e.marginBottom = t == null || typeof t == "boolean" ? "" : t) : e.margin = n));
	}
	function Dp(e, t, n) {
		return n = n.ownerDocument.defaultView, {
			rect: e,
			abs: t.position === "absolute" || t.position === "fixed",
			clip: t.clipPath !== "none" || t.overflow !== "visible" || t.filter !== "none" || t.mask !== "none" || t.mask !== "none" || t.borderRadius !== "0px",
			view: 0 <= e.bottom && 0 <= e.right && e.top <= n.innerHeight && e.left <= n.innerWidth
		};
	}
	function Op(e) {
		return Dp(e.getBoundingClientRect(), getComputedStyle(e), e);
	}
	function kp(e) {
		var t = e.getBoundingClientRect();
		t = new DOMRect(t.x + 2e4, t.y + 2e4, t.width, t.height);
		var n = getComputedStyle(e);
		return Dp(t, n, e);
	}
	function Ap(e) {
		return e.documentElement.clientHeight;
	}
	function jp(e) {
		this.addEventListener("load", e), this.addEventListener("error", e);
	}
	function Mp(e, t, n, r, i, a, o, s, c) {
		var l = t.nodeType === 9 ? t : t.ownerDocument;
		try {
			var u = l.startViewTransition({
				update: function() {
					var t = l.defaultView, n = t.navigation && t.navigation.transition, o = l.fonts.status;
					r();
					var s = [];
					if (o === "loaded" && (Ap(l), l.fonts.status === "loading" && s.push(l.fonts.ready)), o = s.length, e !== null) for (var c = e.suspenseyImages, u = 0, d = 0; d < c.length; d++) {
						var f = c[d];
						if (!f.complete) {
							var p = f.getBoundingClientRect();
							if (0 < p.bottom && 0 < p.right && p.top < t.innerHeight && p.left < t.innerWidth) {
								if (u += Xm(f), u > $m) {
									s.length = o;
									break;
								}
								f = new Promise(jp.bind(f)), s.push(f);
							}
						}
					}
					if (0 < s.length) return t = Promise.race([Promise.all(s), new Promise(function(e) {
						return setTimeout(e, 500);
					})]).then(i, i), (n ? Promise.allSettled([n.finished, t]) : t).then(a, a);
					if (i(), n) return n.finished.then(a, a);
					a();
				},
				types: n
			});
			l.__reactViewTransition = u;
			var d = [];
			return u.ready.then(function() {
				for (var e = l.documentElement.getAnimations({ subtree: !0 }), t = 0; t < e.length; t++) {
					var n = e[t], r = n.effect, i = r.pseudoElement;
					if (i != null && i.startsWith("::view-transition")) {
						d.push(n), n = r.getKeyframes();
						for (var a = i = void 0, s = !0, c = 0; c < n.length; c++) {
							var u = n[c], f = u.width;
							if (i === void 0) i = f;
							else if (i !== f) {
								s = !1;
								break;
							}
							if (f = u.height, a === void 0) a = f;
							else if (a !== f) {
								s = !1;
								break;
							}
							delete u.width, delete u.height, u.transform === "none" && delete u.transform;
						}
						s && i !== void 0 && a !== void 0 && (r.setKeyframes(n), s = getComputedStyle(r.target, r.pseudoElement), s.width !== i || s.height !== a) && (s = n[0], s.width = i, s.height = a, s = n[n.length - 1], s.width = i, s.height = a, r.setKeyframes(n));
					}
				}
				o();
			}, function(e) {
				l.__reactViewTransition === u && (l.__reactViewTransition = null);
				try {
					if (typeof e == "object" && e) switch (e.name) {
						case "InvalidStateError": (e.message === "View transition was skipped because document visibility state is hidden." || e.message === "Skipping view transition because document visibility state has become hidden." || e.message === "Skipping view transition because viewport size changed." || e.message === "Transition was aborted because of invalid state") && (e = null);
					}
					e !== null && c(e);
				} finally {
					r(), i(), o();
				}
			}), u.finished.finally(function() {
				for (var e = 0; e < d.length; e++) d[e].cancel();
				l.__reactViewTransition === u && (l.__reactViewTransition = null), s();
			}), u;
		} catch {
			return r(), i(), o(), null;
		}
	}
	function Np(e, t) {
		this._scope = document.documentElement, this._selector = "::view-transition-" + e + "(" + t + ")";
	}
	Np.prototype.animate = function(e, t) {
		return t = typeof t == "number" ? { duration: t } : D({}, t), t.pseudoElement = this._selector, this._scope.animate(e, t);
	}, Np.prototype.getAnimations = function() {
		for (var e = this._scope, t = this._selector, n = e.getAnimations({ subtree: !0 }), r = [], i = 0; i < n.length; i++) {
			var a = n[i].effect;
			a !== null && a.target === e && a.pseudoElement === t && r.push(n[i]);
		}
		return r;
	}, Np.prototype.getComputedStyle = function() {
		return getComputedStyle(this._scope, this._selector);
	};
	function Pp(e) {
		return {
			name: e,
			group: new Np("group", e),
			imagePair: new Np("image-pair", e),
			old: new Np("old", e),
			new: new Np("new", e)
		};
	}
	function Fp(e) {
		this._fragmentFiber = e, this._observers = this._eventListeners = null;
	}
	Fp.prototype.addEventListener = function(e, t, n) {
		var r = null, i = null;
		if (!(n != null && typeof n != "boolean" && (r = n.signal || null, r !== null && r.aborted))) {
			this._eventListeners === null && (this._eventListeners = []);
			var a = this._eventListeners;
			if (Bp(a, e, t, n) === -1) {
				var o = this, s = t;
				n != null && typeof n != "boolean" && !0 === n.once && (s = function(r) {
					o.removeEventListener(e, t, n), typeof t == "function" ? t.call(this, r) : t.handleEvent(r);
				}), r !== null && (i = o.removeEventListener.bind(o, e, t, n), r.addEventListener("abort", i, { once: !0 }), i = r.removeEventListener.bind(r, "abort", i)), r = Rp(n), a.push({
					type: e,
					listener: t,
					optionsOrUseCapture: n,
					attachedListener: s,
					cleanup: i
				}), h(this._fragmentFiber.child, !1, Ip, e, s, r);
			}
			this._eventListeners = a;
		}
	};
	function Ip(e, t, n, r) {
		return b(e).addEventListener(t, n, r), !1;
	}
	Fp.prototype.removeEventListener = function(e, t, n) {
		var r = this._eventListeners;
		if (r !== null && (t = Bp(r, e, t, n), t !== -1)) {
			var i = r[t];
			n = i.attachedListener;
			var a = i.cleanup;
			i = Rp(i.optionsOrUseCapture), h(this._fragmentFiber.child, !1, Lp, e, n, i), r.splice(t, 1), a !== null && a();
		}
	};
	function Lp(e, t, n, r) {
		return b(e).removeEventListener(t, n, r), !1;
	}
	function Rp(e) {
		return e != null && typeof e != "boolean" && (!0 === e.once || e.signal instanceof AbortSignal) ? {
			capture: e.capture,
			passive: e.passive
		} : e;
	}
	function zp(e) {
		return e == null ? "c=0" : typeof e == "boolean" ? "c=" + (e ? "1" : "0") : "c=" + (e.capture ? "1" : "0");
	}
	function Bp(e, t, n, r) {
		if (e.length === 0) return -1;
		r = zp(r);
		for (var i = 0; i < e.length; i++) {
			var a = e[i];
			if (a.type === t && a.listener === n && zp(a.optionsOrUseCapture) === r) return i;
		}
		return -1;
	}
	Fp.prototype.dispatchEvent = function(e) {
		var t = g(this._fragmentFiber);
		if (t === null) return !0;
		t = b(t);
		var n = this._eventListeners;
		if (n !== null && 0 < n.length || !e.bubbles) {
			var r = t.nodeType === 9 ? t.createComment("") : document.createTextNode("");
			if (n) for (var i = 0; i < n.length; i++) {
				var a = n[i];
				r.addEventListener(a.type, a.attachedListener, Rp(a.optionsOrUseCapture));
			}
			if (t.appendChild(r), e = r.dispatchEvent(e), n) for (i = 0; i < n.length; i++) a = n[i], r.removeEventListener(a.type, a.attachedListener, Rp(a.optionsOrUseCapture));
			return t.removeChild(r), e;
		}
		return t.dispatchEvent(e);
	}, Fp.prototype.focus = function(e) {
		h(this._fragmentFiber.child, !0, Vp, e, void 0, void 0);
	};
	function Vp(e, t) {
		return e.tag !== 6 && (e = b(e), pm(e, t));
	}
	Fp.prototype.focusLast = function(e) {
		var t = [];
		h(this._fragmentFiber.child, !0, Hp, t, void 0, void 0);
		for (var n = t.length - 1; 0 <= n && !Vp(t[n], e); n--);
	};
	function Hp(e, t) {
		return t.push(e), !1;
	}
	Fp.prototype.blur = function() {
		var e = g(this._fragmentFiber);
		e !== null && (e = b(e), e = lp(e).activeElement, e !== null && h(this._fragmentFiber.child, !1, Up, e, void 0, void 0));
	};
	function Up(e, t) {
		return e.tag !== 6 && (e = b(e), e === t || e.contains(t) ? (t.blur(), !0) : !1);
	}
	Fp.prototype.observeUsing = function(e) {
		this._observers === null && (this._observers = /* @__PURE__ */ new Set()), this._observers.add(e), h(this._fragmentFiber.child, !1, Wp, e, void 0, void 0);
	};
	function Wp(e, t) {
		return e.tag !== 6 && (e = b(e), t.observe(e), !1);
	}
	Fp.prototype.unobserveUsing = function(e) {
		var t = this._observers;
		if (t !== null && t.has(e)) {
			t.delete(e), h(this._fragmentFiber.child, !1, Gp, e, void 0, void 0);
			for (var n = t = 0; n < Kp.length; n++) {
				var r = Kp[n];
				r.fragmentInstance === this && r.observer === e ? e.unobserve(r.instance) : Kp[t++] = r;
			}
			Kp.length = t;
		}
	};
	function Gp(e, t) {
		return e.tag !== 6 && (e = b(e), t.unobserve(e), !1);
	}
	var Kp = [], qp = !1;
	function Jp(e, t, n) {
		Kp.push({
			fragmentInstance: e,
			observer: t,
			instance: n
		}), qp || (qp = !0, mm(function() {
			qp = !1;
			var e = Kp;
			Kp = [];
			for (var t = 0; t < e.length; t++) {
				var n = e[t];
				n.observer.unobserve(n.instance);
			}
		}));
	}
	Fp.prototype.getClientRects = function() {
		var e = [];
		return h(this._fragmentFiber.child, !1, Yp, e, void 0, void 0), e;
	};
	function Yp(e, t) {
		if (e.tag === 6) {
			e = e.stateNode;
			var n = e.ownerDocument.createRange();
			n.selectNodeContents(e), t.push.apply(t, n.getClientRects());
		} else e = b(e), t.push.apply(t, e.getClientRects());
		return !1;
	}
	Fp.prototype.getRootNode = function(e) {
		var t = g(this._fragmentFiber);
		return t === null ? this : b(t).getRootNode(e);
	}, Fp.prototype.compareDocumentPosition = function(e) {
		var t = g(this._fragmentFiber);
		if (t === null) return Node.DOCUMENT_POSITION_DISCONNECTED;
		var n = [];
		h(this._fragmentFiber.child, !1, Hp, n, void 0, void 0);
		var r = b(t);
		if (n.length === 0) {
			if (n = r, _(this._fragmentFiber)) {
				a: {
					for (t = this._fragmentFiber.return; t !== null;) {
						if (t.tag === 4) {
							t = t.stateNode.containerInfo;
							break a;
						}
						if (t.tag === 3 || t.tag === 5 || t.tag === 27) break;
						t = t.return;
					}
					t = null;
				}
				t != null && (n = t);
			}
			t = this._fragmentFiber;
			var i = r = n.compareDocumentPosition(e);
			return n === e ? i = Node.DOCUMENT_POSITION_CONTAINS : r & Node.DOCUMENT_POSITION_CONTAINED_BY && (n = v(t)[1], n === null ? i = Node.DOCUMENT_POSITION_PRECEDING : (e = b(n).compareDocumentPosition(e), i = e === 0 || e & Node.DOCUMENT_POSITION_FOLLOWING ? Node.DOCUMENT_POSITION_FOLLOWING : Node.DOCUMENT_POSITION_PRECEDING)), i |= Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC;
		}
		t = b(n[0]), i = b(n[n.length - 1]);
		var a = _(this._fragmentFiber) ? t.parentElement : r;
		if (a == null) return Node.DOCUMENT_POSITION_DISCONNECTED;
		r = a.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_CONTAINED_BY, a = a.compareDocumentPosition(i) & Node.DOCUMENT_POSITION_CONTAINED_BY;
		var o = t.compareDocumentPosition(e), s = i.compareDocumentPosition(e), c = o & Node.DOCUMENT_POSITION_CONTAINED_BY || s & Node.DOCUMENT_POSITION_CONTAINED_BY;
		return s = r && a && o & Node.DOCUMENT_POSITION_FOLLOWING && s & Node.DOCUMENT_POSITION_PRECEDING, t = r && t === e || a && i === e || c || s ? Node.DOCUMENT_POSITION_CONTAINED_BY : !r && t === e || !a && i === e ? Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC : o, t & Node.DOCUMENT_POSITION_DISCONNECTED || t & Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC || Xp(t, this._fragmentFiber, n[0], n[n.length - 1], e) ? t : Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC;
	};
	function Xp(e, t, n, r, i) {
		var a = St(i);
		if (e & Node.DOCUMENT_POSITION_CONTAINED_BY) {
			if (n = !!a) a: {
				for (; a !== null;) {
					if (a.tag === 7 && (a === t || a.alternate === t)) {
						n = !0;
						break a;
					}
					a = a.return;
				}
				n = !1;
			}
			return n;
		}
		if (e & Node.DOCUMENT_POSITION_CONTAINS) {
			if (a === null) return a = i.ownerDocument, i === a || i === a.documentElement || i === a.body;
			a: {
				for (a = t, t = g(t); a !== null;) {
					if (!(a.tag !== 5 && a.tag !== 3 && a.tag !== 27 || a !== t && a.alternate !== t)) {
						a = !0;
						break a;
					}
					a = a.return;
				}
				a = !1;
			}
			return a;
		}
		return e & Node.DOCUMENT_POSITION_PRECEDING ? ((t = !!a) && !(t = a === n) && (t = E(n, a, T), t === null ? t = !1 : (h(t, !0, C, a, n), a = x, x = null, t = a !== null)), t) : e & Node.DOCUMENT_POSITION_FOLLOWING ? ((t = !!a) && !(t = a === r) && (t = E(r, a, T), t === null ? t = !1 : (h(t, !0, w, a, r), a = x, S = x = null, t = a !== null)), t) : !1;
	}
	function Zp(e, t) {
		var n = e.ownerDocument.createRange();
		n.selectNodeContents(e), e = n.getBoundingClientRect(), window.scrollTo(window.scrollX + e.left, t ? window.scrollY + e.top : window.scrollY + e.bottom - window.innerHeight);
	}
	Fp.prototype.scrollIntoView = function(e) {
		if (typeof e == "object") throw Error(i(566));
		var t = [];
		h(this._fragmentFiber.child, !1, Hp, t, void 0, void 0);
		var n = !1 !== e;
		if (t.length === 0) {
			var r = v(this._fragmentFiber);
			if (r = n ? r[1] || r[0] || g(this._fragmentFiber) : r[0] || r[1], r === null) return;
			if (r.tag === 6) {
				e = b(r), Zp(e, n);
				return;
			}
			if (r = b(r), r.nodeType !== 9) {
				if (r.nodeType === 11) {
					n = "host" in r ? r.host : null, n !== null && n.scrollIntoView(e);
					return;
				}
				r.scrollIntoView(e);
			}
		}
		for (r = n ? t.length - 1 : 0; r !== (n ? -1 : t.length);) {
			var a = t[r];
			a.tag === 6 ? (a = b(a), Zp(a, n)) : b(a).scrollIntoView(e), r += n ? -1 : 1;
		}
	};
	function Qp(e, t) {
		return e = b(e), $p(e, t), !1;
	}
	function $p(e, t) {
		e.reactFragments ??= /* @__PURE__ */ new Set(), e.reactFragments.add(t);
	}
	function em(e, t) {
		var n = t._eventListeners;
		if (n !== null) for (var r = 0; r < n.length; r++) {
			var i = n[r];
			e.addEventListener(i.type, i.attachedListener, Rp(i.optionsOrUseCapture));
		}
		e.nodeType !== 3 && (n = t._observers, n !== null && n.forEach(function(n) {
			for (var r = 0, i = 0; i < Kp.length; i++) {
				var a = Kp[i];
				(a.fragmentInstance !== t || a.observer !== n || a.instance !== e) && (Kp[r++] = a);
			}
			Kp.length = r, n.observe(e);
		}), $p(e, t));
	}
	function tm(e, t) {
		var n = t._eventListeners;
		if (n !== null) for (var r = 0; r < n.length; r++) {
			var i = n[r];
			e.removeEventListener(i.type, i.attachedListener, Rp(i.optionsOrUseCapture));
		}
		e.nodeType !== 3 && (n = t._observers, n !== null && n.forEach(function(n) {
			typeof n.rootMargin == "string" ? Jp(t, n, e) : n.unobserve(e);
		}), e.reactFragments != null && e.reactFragments.delete(t));
	}
	function nm(e) {
		var t = e.firstChild;
		for (t && t.nodeType === 10 && (t = t.nextSibling); t;) {
			var n = t;
			switch (t = t.nextSibling, n.nodeName) {
				case "HTML":
				case "HEAD":
				case "BODY":
					nm(n), xt(n);
					continue;
				case "SCRIPT":
				case "STYLE": continue;
				case "LINK": if (n.rel.toLowerCase() === "stylesheet") continue;
			}
			e.removeChild(n);
		}
	}
	function rm(e, t, n, r) {
		for (; e.nodeType === 1;) {
			var i = n;
			if (e.nodeName.toLowerCase() !== t.toLowerCase()) {
				if (!r && (e.nodeName !== "INPUT" || e.type !== "hidden")) break;
			} else if (!r) {
				if (t === "input" && e.type === "hidden") {
					var a = i.name == null ? null : "" + i.name;
					if (i.type === "hidden" && e.getAttribute("name") === a) return e;
				} else return e;
			} else if (!e[bt]) switch (t) {
				case "meta":
					if (!e.hasAttribute("itemprop")) break;
					return e;
				case "link":
					if (a = e.getAttribute("rel"), a === "stylesheet" && e.hasAttribute("data-precedence") || a !== i.rel || e.getAttribute("href") !== (i.href == null || i.href === "" ? null : i.href) || e.getAttribute("crossorigin") !== (i.crossOrigin == null ? null : i.crossOrigin) || e.getAttribute("title") !== (i.title == null ? null : i.title)) break;
					return e;
				case "style":
					if (e.hasAttribute("data-precedence")) break;
					return e;
				case "script":
					if (a = e.getAttribute("src"), (a !== (i.src == null ? null : i.src) || e.getAttribute("type") !== (i.type == null ? null : i.type) || e.getAttribute("crossorigin") !== (i.crossOrigin == null ? null : i.crossOrigin)) && a && e.hasAttribute("async") && !e.hasAttribute("itemprop")) break;
					return e;
				default: return e;
			}
			if (e = lm(e.nextSibling), e === null) break;
		}
		return null;
	}
	function im(e, t, n) {
		if (t === "") return null;
		for (; e.nodeType !== 3;) if ((e.nodeType !== 1 || e.nodeName !== "INPUT" || e.type !== "hidden") && !n || (e = lm(e.nextSibling), e === null)) return null;
		return e;
	}
	function am(e, t) {
		for (; e.nodeType !== 8;) if ((e.nodeType !== 1 || e.nodeName !== "INPUT" || e.type !== "hidden") && !t || (e = lm(e.nextSibling), e === null)) return null;
		return e;
	}
	function om(e) {
		return e.data === "$?" || e.data === "$~";
	}
	function sm(e) {
		return e.data === "$!" || e.data === "$?" && e.ownerDocument.readyState !== "loading";
	}
	function cm(e, t) {
		var n = e.ownerDocument;
		if (e.data === "$~") e._reactRetry = t;
		else if (e.data !== "$?" || n.readyState !== "loading") t();
		else {
			var r = function() {
				t(), n.removeEventListener("DOMContentLoaded", r);
			};
			n.addEventListener("DOMContentLoaded", r), e._reactRetry = r;
		}
	}
	function lm(e) {
		for (; e != null; e = e.nextSibling) {
			var t = e.nodeType;
			if (t === 1 || t === 3) break;
			if (t === 8) {
				if (t = e.data, t === "$" || t === "$!" || t === "$?" || t === "$~" || t === "&" || t === "F!" || t === "F") break;
				if (t === "/$" || t === "/&") return null;
			}
		}
		return e;
	}
	var um = null;
	function dm(e) {
		e = e.nextSibling;
		for (var t = 0; e;) {
			if (e.nodeType === 8) {
				var n = e.data;
				if (n === "/$" || n === "/&") {
					if (t === 0) return lm(e.nextSibling);
					t--;
				} else n !== "$" && n !== "$!" && n !== "$?" && n !== "$~" && n !== "&" || t++;
			}
			e = e.nextSibling;
		}
		return null;
	}
	function fm(e) {
		e = e.previousSibling;
		for (var t = 0; e;) {
			if (e.nodeType === 8) {
				var n = e.data;
				if (n === "$" || n === "$!" || n === "$?" || n === "$~" || n === "&") {
					if (t === 0) return e;
					t--;
				} else n !== "/$" && n !== "/&" || t++;
			}
			e = e.previousSibling;
		}
		return null;
	}
	function pm(e, t) {
		function n() {
			r = !0;
		}
		if (e.ownerDocument.activeElement === e) return !0;
		var r = !1;
		try {
			e.ownerDocument.addEventListener("focus", n, !0), (e.focus || HTMLElement.prototype.focus).call(e, t);
		} finally {
			e.ownerDocument.removeEventListener("focus", n, !0);
		}
		return r;
	}
	function mm(e) {
		yp(function() {
			yp(function(t) {
				return e(t);
			});
		});
	}
	function hm(e, t, n) {
		switch (t = lp(n), e) {
			case "html":
				if (e = t.documentElement, !e) throw Error(i(452));
				return e;
			case "head":
				if (e = t.head, !e) throw Error(i(453));
				return e;
			case "body":
				if (e = t.body, !e) throw Error(i(454));
				return e;
			default: throw Error(i(451));
		}
	}
	function gm(e, t, n) {
		for (var r in n) {
			var i = n[r];
			n.hasOwnProperty(r) && i != null && ep(e, t, r, null, rp, i);
		}
		n.dangerouslySetInnerHTML != null && (e.textContent = ""), e.onclick === on && (e.onclick = null), xt(e);
	}
	function _m(e) {
		for (var t = e.attributes; t.length;) e.removeAttributeNode(t[0]);
		xt(e);
	}
	var vm = /* @__PURE__ */ new Map(), ym = /* @__PURE__ */ new Set();
	function bm(e) {
		if (typeof e.getRootNode == "function") {
			var t = e.getRootNode();
			if (t.nodeType === 9 || t.nodeType === 11) return t;
		}
		return e.nodeType === 9 ? e : e.ownerDocument;
	}
	var xm = U.d;
	U.d = {
		f: Sm,
		r: Cm,
		D: Em,
		C: Dm,
		L: Om,
		m: km,
		X: jm,
		S: Am,
		M: Mm
	};
	function Sm() {
		var e = xm.f(), t = Id();
		return e || t;
	}
	function Cm(e) {
		var t = Ct(e);
		t !== null && t.tag === 5 && t.type === "form" ? Ks(t) : xm.r(e);
	}
	var wm = typeof document > "u" ? null : document;
	function Tm(e, t, n) {
		var r = wm;
		if (r && typeof t == "string" && t) {
			var i = Gt(t);
			i = "link[rel=\"" + e + "\"][href=\"" + i + "\"]", typeof n == "string" && (i += "[crossorigin=\"" + n + "\"]"), ym.has(i) || (ym.add(i), e = {
				rel: e,
				crossOrigin: n,
				href: t
			}, r.querySelector(i) === null && (t = r.createElement("link"), np(t, "link", e), Et(t), r.head.appendChild(t)));
		}
	}
	function Em(e) {
		xm.D(e), Tm("dns-prefetch", e, null);
	}
	function Dm(e, t) {
		xm.C(e, t), Tm("preconnect", e, t);
	}
	function Om(e, t, n) {
		xm.L(e, t, n);
		var r = wm;
		if (r && e && t) {
			var i = "link[rel=\"preload\"][as=\"" + Gt(t) + "\"]";
			t === "image" && n && n.imageSrcSet ? (i += "[imagesrcset=\"" + Gt(n.imageSrcSet) + "\"]", typeof n.imageSizes == "string" && (i += "[imagesizes=\"" + Gt(n.imageSizes) + "\"]")) : i += "[href=\"" + Gt(e) + "\"]";
			var a = i;
			switch (t) {
				case "style":
					a = Pm(e);
					break;
				case "script": a = Rm(e);
			}
			if (!(vm.has(a) || (e = D({
				rel: "preload",
				href: t === "image" && n && n.imageSrcSet ? void 0 : e,
				as: t
			}, n), vm.set(a, e), r.querySelector(i) !== null || t === "style" && r.querySelector(Fm(a)) || t === "script" && r.querySelector(zm(a))))) {
				var o = r.createElement("link");
				np(o, "link", e), t === "style" && (o[J] = !0, o.onload = o.onerror = function() {
					Dt(o);
				}), Et(o), r.head.appendChild(o);
			}
		}
	}
	function km(e, t) {
		xm.m(e, t);
		var n = wm;
		if (n && e) {
			var r = t && typeof t.as == "string" ? t.as : "script", i = "link[rel=\"modulepreload\"][as=\"" + Gt(r) + "\"][href=\"" + Gt(e) + "\"]", a = i;
			switch (r) {
				case "audioworklet":
				case "paintworklet":
				case "serviceworker":
				case "sharedworker":
				case "worker":
				case "script": a = Rm(e);
			}
			if (!vm.has(a) && (e = D({
				rel: "modulepreload",
				href: e
			}, t), vm.set(a, e), n.querySelector(i) === null)) {
				switch (r) {
					case "audioworklet":
					case "paintworklet":
					case "serviceworker":
					case "sharedworker":
					case "worker":
					case "script": if (n.querySelector(zm(a))) return;
				}
				r = n.createElement("link"), np(r, "link", e), Et(r), n.head.appendChild(r);
			}
		}
	}
	function Am(e, t, n) {
		xm.S(e, t, n);
		var r = wm;
		if (r && e) {
			var i = Tt(r).hoistableStyles, a = Pm(e);
			t ||= "default";
			var o = i.get(a);
			if (!o) {
				var s = {
					loading: 0,
					preload: null
				};
				if (o = r.querySelector(Fm(a))) s.loading = 5;
				else {
					e = D({
						rel: "stylesheet",
						href: e,
						"data-precedence": t
					}, n), (n = vm.get(a)) && Hm(e, n);
					var c = o = r.createElement("link");
					Et(c), np(c, "link", e), c._p = new Promise(function(e, t) {
						c.onload = e, c.onerror = t;
					}), c.addEventListener("load", function() {
						s.loading |= 1;
					}), c.addEventListener("error", function() {
						s.loading |= 2;
					}), s.loading |= 4, Vm(o, t, r);
				}
				o = {
					type: "stylesheet",
					instance: o,
					count: 1,
					state: s
				}, i.set(a, o);
			}
		}
	}
	function jm(e, t) {
		xm.X(e, t);
		var n = wm;
		if (n && e) {
			var r = Tt(n).hoistableScripts, i = Rm(e), a = r.get(i);
			a || (a = n.querySelector(zm(i)), a || (e = D({
				src: e,
				async: !0
			}, t), (t = vm.get(i)) && Um(e, t), a = n.createElement("script"), Et(a), np(a, "link", e), n.head.appendChild(a)), a = {
				type: "script",
				instance: a,
				count: 1,
				state: null
			}, r.set(i, a));
		}
	}
	function Mm(e, t) {
		xm.M(e, t);
		var n = wm;
		if (n && e) {
			var r = Tt(n).hoistableScripts, i = Rm(e), a = r.get(i);
			a || (a = n.querySelector(zm(i)), a || (e = D({
				src: e,
				async: !0,
				type: "module"
			}, t), (t = vm.get(i)) && Um(e, t), a = n.createElement("script"), Et(a), np(a, "link", e), n.head.appendChild(a)), a = {
				type: "script",
				instance: a,
				count: 1,
				state: null
			}, r.set(i, a));
		}
	}
	function Nm(e, t, n, r) {
		var a = (a = me.current) ? bm(a) : null;
		if (!a) throw Error(i(446));
		switch (e) {
			case "meta":
			case "title": return null;
			case "style": return typeof n.precedence == "string" && typeof n.href == "string" ? (n = Pm(n.href), t = Tt(a).hoistableStyles, r = t.get(n), r || (r = {
				type: "style",
				instance: null,
				count: 0,
				state: null
			}, t.set(n, r)), r) : {
				type: "void",
				instance: null,
				count: 0,
				state: null
			};
			case "link":
				if (n.rel === "stylesheet" && typeof n.href == "string" && typeof n.precedence == "string") {
					e = Pm(n.href);
					var o = Tt(a).hoistableStyles, s = o.get(e);
					if (s || (a = a.ownerDocument || a, s = {
						type: "stylesheet",
						instance: null,
						count: 0,
						state: {
							loading: 0,
							preload: null
						}
					}, o.set(e, s), (o = a.querySelector(Fm(e))) ? o._p || (s.instance = o, s.state.loading = 5) : (o = vm.get(e), o || (o = {
						rel: "preload",
						as: "style",
						href: n.href,
						crossOrigin: n.crossOrigin,
						integrity: n.integrity,
						media: n.media,
						hrefLang: n.hrefLang,
						referrerPolicy: n.referrerPolicy
					}, vm.set(e, o)), Lm(a, e, o, s.state))), t && r === null) throw Error(i(528, ""));
					return s;
				}
				if (t && r !== null) throw Error(i(529, ""));
				return null;
			case "script": return t = n.async, n = n.src, typeof n == "string" && t && typeof t != "function" && typeof t != "symbol" ? (n = Rm(n), t = Tt(a).hoistableScripts, r = t.get(n), r || (r = {
				type: "script",
				instance: null,
				count: 0,
				state: null
			}, t.set(n, r)), r) : {
				type: "void",
				instance: null,
				count: 0,
				state: null
			};
			default: throw Error(i(444, e));
		}
	}
	function Pm(e) {
		return "href=\"" + Gt(e) + "\"";
	}
	function Fm(e) {
		return "link[rel=\"stylesheet\"][" + e + "]";
	}
	function Im(e) {
		return D({}, e, {
			"data-precedence": e.precedence,
			precedence: null
		});
	}
	function Lm(e, t, n, r) {
		if (t = e.querySelector("link[rel=\"preload\"][as=\"style\"][" + t + "]")) {
			if (!0 !== t[J]) {
				r.loading = 1;
				return;
			}
		} else t = e.createElement("link"), t[J] = !0, t.onload = t.onerror = Dt.bind(null, t), np(t, "link", n), Et(t), e.head.appendChild(t);
		r.preload = t, t.addEventListener("load", function() {
			return r.loading |= 1;
		}), t.addEventListener("error", function() {
			return r.loading |= 2;
		});
	}
	function Rm(e) {
		return "[src=\"" + Gt(e) + "\"]";
	}
	function zm(e) {
		return "script[async]" + e;
	}
	function Bm(e, t, n) {
		if (t.count++, t.instance === null) switch (t.type) {
			case "style":
				var r = e.querySelector("style[data-href~=\"" + Gt(n.href) + "\"]");
				if (r) return t.instance = r, Et(r), r;
				var a = D({}, n, {
					"data-href": n.href,
					"data-precedence": n.precedence,
					href: null,
					precedence: null
				});
				return r = (e.ownerDocument || e).createElement("style"), Et(r), np(r, "style", a), Vm(r, n.precedence, e), t.instance = r;
			case "stylesheet":
				a = Pm(n.href);
				var o = e.querySelector(Fm(a));
				if (o) return t.state.loading |= 4, t.instance = o, Et(o), o;
				r = Im(n), (a = vm.get(a)) && Hm(r, a), o = (e.ownerDocument || e).createElement("link"), Et(o);
				var s = o;
				return s._p = new Promise(function(e, t) {
					s.onload = e, s.onerror = t;
				}), np(o, "link", r), t.state.loading |= 4, Vm(o, n.precedence, e), t.instance = o;
			case "script": return o = Rm(n.src), (a = e.querySelector(zm(o))) ? (t.instance = a, Et(a), a) : (r = n, (a = vm.get(o)) && (r = D({}, n), Um(r, a)), e = e.ownerDocument || e, a = e.createElement("script"), Et(a), np(a, "link", r), e.head.appendChild(a), t.instance = a);
			case "void": return null;
			default: throw Error(i(443, t.type));
		}
		else t.type === "stylesheet" && !(t.state.loading & 4) && (r = t.instance, t.state.loading |= 4, Vm(r, n.precedence, e));
		return t.instance;
	}
	function Vm(e, t, n) {
		for (var r = n.querySelectorAll("link[rel=\"stylesheet\"][data-precedence],style[data-precedence]"), i = r.length ? r[r.length - 1] : null, a = i, o = 0; o < r.length; o++) {
			var s = r[o];
			if (s.dataset.precedence === t) a = s;
			else if (a !== i) break;
		}
		a ? a.parentNode.insertBefore(e, a.nextSibling) : (t = n.nodeType === 9 ? n.head : n, t.insertBefore(e, t.firstChild));
	}
	function Hm(e, t) {
		e.crossOrigin ??= t.crossOrigin, e.referrerPolicy ??= t.referrerPolicy, e.title ??= t.title;
	}
	function Um(e, t) {
		e.crossOrigin ??= t.crossOrigin, e.referrerPolicy ??= t.referrerPolicy, e.integrity ??= t.integrity;
	}
	var Wm = null;
	function Gm(e, t, n) {
		if (Wm === null) {
			var r = /* @__PURE__ */ new Map(), i = Wm = /* @__PURE__ */ new Map();
			i.set(n, r);
		} else i = Wm, r = i.get(n), r || (r = /* @__PURE__ */ new Map(), i.set(n, r));
		if (r.has(e)) return r;
		for (r.set(e, null), n = n.getElementsByTagName(e), i = 0; i < n.length; i++) {
			var a = n[i];
			if (!(a[bt] || a[pt] || e === "link" && a.getAttribute("rel") === "stylesheet") && a.namespaceURI !== "http://www.w3.org/2000/svg") {
				var o = a.getAttribute(t) || "";
				o = e + o;
				var s = r.get(o);
				s ? s.push(a) : r.set(o, [a]);
			}
		}
		return r;
	}
	function Km(e, t, n) {
		e = e.ownerDocument || e, e.head.insertBefore(n, t === "title" ? e.querySelector("head > title") : null);
	}
	function qm(e, t, n) {
		if (n === 1 || t.itemProp != null) return !1;
		switch (e) {
			case "meta":
			case "title": return !0;
			case "style":
				if (typeof t.precedence != "string" || typeof t.href != "string" || t.href === "") break;
				return !0;
			case "link":
				if (typeof t.rel != "string" || typeof t.href != "string" || t.href === "" || t.onLoad || t.onError) break;
				switch (t.rel) {
					case "stylesheet": return e = t.disabled, typeof t.precedence == "string" && e == null;
					default: return !0;
				}
			case "script": if (t.async && typeof t.async != "function" && typeof t.async != "symbol" && !t.onLoad && !t.onError && t.src && typeof t.src == "string") return !0;
		}
		return !1;
	}
	function Jm(e, t) {
		return e === "img" && t.src != null && t.src !== "" && t.onLoad == null && t.loading !== "lazy";
	}
	function Ym(e) {
		return !(e.type === "stylesheet" && !(e.state.loading & 3));
	}
	function Xm(e) {
		return (e.width || 100) * (e.height || 100) * (typeof devicePixelRatio == "number" ? devicePixelRatio : 1) * .25;
	}
	function Zm(e, t) {
		typeof t.decode == "function" && (e.imgCount++, t.complete || (e.imgBytes += Xm(t), e.suspenseyImages.push(t)), e = rh.bind(e), t.decode().then(e, e));
	}
	function Qm(e, t, n, r) {
		if (n.type === "stylesheet" && (typeof r.media != "string" || !1 !== matchMedia(r.media).matches) && !(n.state.loading & 4)) {
			if (n.instance === null) {
				var i = Pm(r.href), a = t.querySelector(Fm(i));
				if (a) {
					t = a._p, typeof t == "object" && t && typeof t.then == "function" && (e.count++, e = nh.bind(e), t.then(e, e)), n.state.loading |= 4, n.instance = a, Et(a);
					return;
				}
				a = t.ownerDocument || t, r = Im(r), (i = vm.get(i)) && Hm(r, i), a = a.createElement("link"), Et(a);
				var o = a;
				o._p = new Promise(function(e, t) {
					o.onload = e, o.onerror = t;
				}), np(a, "link", r), n.instance = a;
			}
			e.stylesheets === null && (e.stylesheets = /* @__PURE__ */ new Map()), e.stylesheets.set(n, t), (t = n.state.preload) && !(n.state.loading & 3) && (e.count++, n = nh.bind(e), t.addEventListener("load", n), t.addEventListener("error", n));
		}
	}
	var $m = 0;
	function eh(e, t) {
		return e.stylesheets && e.count === 0 && ah(e, e.stylesheets), 0 < e.count || 0 < e.imgCount ? function(n) {
			var r = setTimeout(function() {
				if (e.stylesheets && ah(e, e.stylesheets), e.unsuspend) {
					var t = e.unsuspend;
					e.unsuspend = null, t();
				}
			}, 6e4 + t);
			0 < e.imgBytes && $m === 0 && ($m = 62500 * op());
			var i = setTimeout(function() {
				if (e.waitingForImages = !1, e.count === 0 && (e.stylesheets && ah(e, e.stylesheets), e.unsuspend)) {
					var t = e.unsuspend;
					e.unsuspend = null, t();
				}
			}, (e.imgBytes > $m ? 50 : 800) + t);
			return e.unsuspend = n, function() {
				e.unsuspend = null, clearTimeout(r), clearTimeout(i);
			};
		} : null;
	}
	function th(e) {
		if (e.count === 0 && (e.imgCount === 0 || !e.waitingForImages)) {
			if (e.stylesheets) ah(e, e.stylesheets);
			else if (e.unsuspend) {
				var t = e.unsuspend;
				e.unsuspend = null, t();
			}
		}
	}
	function nh() {
		this.count--, th(this);
	}
	function rh() {
		this.imgCount--, th(this);
	}
	var ih = null;
	function ah(e, t) {
		e.stylesheets = null, e.unsuspend !== null && (e.count++, ih = /* @__PURE__ */ new Map(), t.forEach(oh, e), ih = null, nh.call(e));
	}
	function oh(e, t) {
		if (!(t.state.loading & 4)) {
			var n = ih.get(e);
			if (n) var r = n.get(null);
			else {
				n = /* @__PURE__ */ new Map(), ih.set(e, n);
				for (var i = e.querySelectorAll("link[data-precedence],style[data-precedence]"), a = 0; a < i.length; a++) {
					var o = i[a];
					(o.nodeName === "LINK" || o.getAttribute("media") !== "not all") && (n.set(o.dataset.precedence, o), r = o);
				}
				r && n.set(null, r);
			}
			i = t.instance, o = i.getAttribute("data-precedence"), a = n.get(o) || r, a === r && n.set(null, i), n.set(o, i), this.count++, r = nh.bind(this), i.addEventListener("load", r), i.addEventListener("error", r), a ? a.parentNode.insertBefore(i, a.nextSibling) : (e = e.nodeType === 9 ? e.head : e, e.insertBefore(i, e.firstChild)), t.state.loading |= 4;
		}
	}
	var sh = {
		$$typeof: P,
		Provider: null,
		Consumer: null,
		_currentValue: le,
		_currentValue2: le,
		_threadCount: 0
	};
	function ch(e, t, n, r, i, a, o, s, c) {
		this.tag = 1, this.containerInfo = e, this.pingCache = this.current = this.pendingChildren = null, this.timeoutHandle = -1, this.callbackNode = this.next = this.pendingContext = this.context = this.cancelPendingCommit = null, this.callbackPriority = 0, this.expirationTimes = nt(-1), this.entangledLanes = this.shellSuspendCounter = this.errorRecoveryDisabledLanes = this.expiredLanes = this.warmLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0, this.entanglements = nt(0), this.hiddenUpdates = nt(null), this.identifierPrefix = r, this.onUncaughtError = i, this.onCaughtError = a, this.onRecoverableError = o, this.pooledCache = null, this.pooledCacheLanes = 0, this.formState = c, this.transitionTypes = null, this.incompleteTransitions = /* @__PURE__ */ new Map();
	}
	function lh(e, t, n, r, i, a, o, s, c, l, u, d) {
		return e = new ch(e, t, n, o, c, l, u, d, s), t = 1, !0 === a && (t |= 24), a = bi(3, null, null, t), e.current = a, a.stateNode = e, t = ba(), t.refCount++, e.pooledCache = t, t.refCount++, a.memoizedState = {
			element: r,
			isDehydrated: n,
			cache: t
		}, no(a), e;
	}
	function uh(e) {
		return e ? (e = vi, e) : vi;
	}
	function dh(e, t, n, r, i, a) {
		i = uh(i), r.context === null ? r.context = i : r.pendingContext = i, r = io(t), r.payload = { element: n }, a = a === void 0 ? null : a, a !== null && (r.callback = a), n = ao(e, r, t), n !== null && (jd(n, e, t), oo(n, e, t));
	}
	function fh(e, t) {
		if (e = e.memoizedState, e !== null && e.dehydrated !== null) {
			var n = e.retryLane;
			e.retryLane = n !== 0 && n < t ? n : t;
		}
	}
	function ph(e, t) {
		fh(e, t), (e = e.alternate) && fh(e, t);
	}
	function mh(e) {
		if (e.tag === 13 || e.tag === 31) {
			var t = hi(e, 67108864);
			t !== null && jd(t, e, 67108864), ph(e, 67108864);
		}
	}
	function hh(e) {
		if (e.tag === 13 || e.tag === 31) {
			var t = Od();
			t = ct(t);
			var n = hi(e, t);
			n !== null && jd(n, e, t), ph(e, t);
		}
	}
	var gh = !0;
	function _h(e, t, n, r) {
		var i = H.T;
		H.T = null;
		var a = U.p;
		try {
			U.p = 2, yh(e, t, n, r);
		} finally {
			U.p = a, H.T = i;
		}
	}
	function vh(e, t, n, r) {
		var i = H.T;
		H.T = null;
		var a = U.p;
		try {
			U.p = 8, yh(e, t, n, r);
		} finally {
			U.p = a, H.T = i;
		}
	}
	function yh(e, t, n, r) {
		if (gh) {
			var i = bh(r);
			if (i === null) Gf(e, t, r, xh, n), Mh(e, r);
			else if (Ph(i, e, t, n, r)) r.stopPropagation();
			else if (Mh(e, r), t & 4 && -1 < jh.indexOf(e)) {
				for (; i !== null;) {
					var a = Ct(i);
					if (a !== null) switch (a.tag) {
						case 3:
							if (a = a.stateNode, a.current.memoizedState.isDehydrated) {
								var o = Xe(a.pendingLanes);
								if (o !== 0) {
									var s = a;
									for (s.pendingLanes |= 2, s.entangledLanes |= 2; o;) {
										var c = 1 << 31 - Ue(o);
										s.entanglements[1] |= c, o &= ~c;
									}
									wf(a), !(Ku & 6) && (pd = Me() + 500, Tf(0, !1));
								}
							}
							break;
						case 31:
						case 13: s = hi(a, 2), s !== null && jd(s, a, 2), Id(), ph(a, 2);
					}
					if (a = bh(r), a === null && Gf(e, t, r, xh, n), a === i) break;
					i = a;
				}
				i !== null && r.stopPropagation();
			} else Gf(e, t, r, null, n);
		}
	}
	function bh(e) {
		return e = cn(e), Sh(e);
	}
	var xh = null;
	function Sh(e) {
		if (xh = null, e = St(e), e !== null) {
			var t = o(e);
			if (t === null) e = null;
			else {
				var n = t.tag;
				if (n === 13) {
					if (e = s(t), e !== null) return e;
					e = null;
				} else if (n === 31) {
					if (e = c(t), e !== null) return e;
					e = null;
				} else if (n === 3) {
					if (t.stateNode.current.memoizedState.isDehydrated) return t.tag === 3 ? t.stateNode.containerInfo : null;
					e = null;
				} else t !== e && (e = null);
			}
		}
		return xh = e, null;
	}
	function Ch(e) {
		switch (e) {
			case "beforetoggle":
			case "cancel":
			case "click":
			case "close":
			case "contextmenu":
			case "copy":
			case "cut":
			case "auxclick":
			case "dblclick":
			case "dragend":
			case "dragstart":
			case "drop":
			case "focusin":
			case "focusout":
			case "input":
			case "invalid":
			case "keydown":
			case "keypress":
			case "keyup":
			case "mousedown":
			case "mouseup":
			case "paste":
			case "pause":
			case "play":
			case "pointercancel":
			case "pointerdown":
			case "pointerup":
			case "ratechange":
			case "reset":
			case "seeked":
			case "submit":
			case "toggle":
			case "touchcancel":
			case "touchend":
			case "touchstart":
			case "volumechange":
			case "change":
			case "selectionchange":
			case "textInput":
			case "compositionstart":
			case "compositionend":
			case "compositionupdate":
			case "beforeblur":
			case "afterblur":
			case "beforeinput":
			case "blur":
			case "fullscreenchange":
			case "fullscreenerror":
			case "focus":
			case "hashchange":
			case "popstate":
			case "select":
			case "selectstart": return 2;
			case "drag":
			case "dragenter":
			case "dragexit":
			case "dragleave":
			case "dragover":
			case "mousemove":
			case "mouseout":
			case "mouseover":
			case "pointermove":
			case "pointerout":
			case "pointerover":
			case "resize":
			case "scroll":
			case "touchmove":
			case "wheel":
			case "mouseenter":
			case "mouseleave":
			case "pointerenter":
			case "pointerleave": return 8;
			case "message": switch (Ne()) {
				case q: return 2;
				case Pe: return 8;
				case Fe:
				case Ie: return 32;
				case Le: return 268435456;
				default: return 32;
			}
			default: return 32;
		}
	}
	var wh = !1, Th = null, Eh = null, Dh = null, Oh = /* @__PURE__ */ new Map(), kh = /* @__PURE__ */ new Map(), Ah = [], jh = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset".split(" ");
	function Mh(e, t) {
		switch (e) {
			case "focusin":
			case "focusout":
				Th = null;
				break;
			case "dragenter":
			case "dragleave":
				Eh = null;
				break;
			case "mouseover":
			case "mouseout":
				Dh = null;
				break;
			case "pointerover":
			case "pointerout":
				Oh.delete(t.pointerId);
				break;
			case "gotpointercapture":
			case "lostpointercapture": kh.delete(t.pointerId);
		}
	}
	function Nh(e, t, n, r, i, a) {
		return e === null || e.nativeEvent !== a ? (e = {
			blockedOn: t,
			domEventName: n,
			eventSystemFlags: r,
			nativeEvent: a,
			targetContainers: [i]
		}, t !== null && (t = Ct(t), t !== null && mh(t)), e) : (e.eventSystemFlags |= r, t = e.targetContainers, i !== null && t.indexOf(i) === -1 && t.push(i), e);
	}
	function Ph(e, t, n, r, i) {
		switch (t) {
			case "focusin": return Th = Nh(Th, e, t, n, r, i), !0;
			case "dragenter": return Eh = Nh(Eh, e, t, n, r, i), !0;
			case "mouseover": return Dh = Nh(Dh, e, t, n, r, i), !0;
			case "pointerover":
				var a = i.pointerId;
				return Oh.set(a, Nh(Oh.get(a) || null, e, t, n, r, i)), !0;
			case "gotpointercapture": return a = i.pointerId, kh.set(a, Nh(kh.get(a) || null, e, t, n, r, i)), !0;
		}
		return !1;
	}
	function Fh(e) {
		var t = St(e.target);
		if (t !== null) {
			var n = o(t);
			if (n !== null) {
				if (t = n.tag, t === 13) {
					if (t = s(n), t !== null) {
						e.blockedOn = t, dt(e.priority, function() {
							hh(n);
						});
						return;
					}
				} else if (t === 31) {
					if (t = c(n), t !== null) {
						e.blockedOn = t, dt(e.priority, function() {
							hh(n);
						});
						return;
					}
				} else if (t === 3 && n.stateNode.current.memoizedState.isDehydrated) {
					e.blockedOn = n.tag === 3 ? n.stateNode.containerInfo : null;
					return;
				}
			}
		}
		e.blockedOn = null;
	}
	function Ih(e) {
		if (e.blockedOn !== null) return !1;
		for (var t = e.targetContainers; 0 < t.length;) {
			var n = bh(e.nativeEvent);
			if (n === null) {
				n = e.nativeEvent;
				var r = new n.constructor(n.type, n);
				sn = r, n.target.dispatchEvent(r), sn = null;
			} else return t = Ct(n), t !== null && mh(t), e.blockedOn = n, !1;
			t.shift();
		}
		return !0;
	}
	function Lh(e, t, n) {
		Ih(e) && n.delete(t);
	}
	function Rh() {
		wh = !1, Th !== null && Ih(Th) && (Th = null), Eh !== null && Ih(Eh) && (Eh = null), Dh !== null && Ih(Dh) && (Dh = null), Oh.forEach(Lh), kh.forEach(Lh);
	}
	function zh(e, n) {
		e.blockedOn === n && (e.blockedOn = null, wh || (wh = !0, t.unstable_scheduleCallback(t.unstable_NormalPriority, Rh)));
	}
	var Bh = null;
	function Vh(e) {
		Bh !== e && (Bh = e, t.unstable_scheduleCallback(t.unstable_NormalPriority, function() {
			Bh === e && (Bh = null);
			for (var t = 0; t < e.length; t += 3) {
				var n = e[t], r = e[t + 1], i = e[t + 2];
				if (typeof r != "function") {
					if (Sh(r || n) === null) continue;
					break;
				}
				var a = Ct(n);
				a !== null && (e.splice(t, 3), t -= 3, Ws(a, {
					pending: !0,
					data: i,
					method: n.method,
					action: r
				}, r, i));
			}
		}));
	}
	function Hh(e) {
		function t(t) {
			return zh(t, e);
		}
		Th !== null && zh(Th, e), Eh !== null && zh(Eh, e), Dh !== null && zh(Dh, e), Oh.forEach(t), kh.forEach(t);
		for (var n = 0; n < Ah.length; n++) {
			var r = Ah[n];
			r.blockedOn === e && (r.blockedOn = null);
		}
		for (; 0 < Ah.length && (n = Ah[0], n.blockedOn === null);) Fh(n), n.blockedOn === null && Ah.shift();
		if (n = (e.ownerDocument || e).$$reactFormReplay, n != null) for (r = 0; r < n.length; r += 3) {
			var i = n[r], a = n[r + 1], o = i[mt] || null;
			if (typeof a == "function") o || Vh(n);
			else if (o) {
				var s = null;
				if (a && a.hasAttribute("formAction")) {
					if (i = a, o = a[mt] || null) s = o.formAction;
					else if (Sh(i) !== null) continue;
				} else s = o.action;
				typeof s == "function" ? n[r + 1] = s : (n.splice(r, 3), r -= 3), Vh(n);
			}
		}
	}
	function Uh() {
		function e(e) {
			e.canIntercept && e.info === "react-transition" && e.intercept({
				handler: function() {
					return new Promise(function(e) {
						return i = e;
					});
				},
				focusReset: "manual",
				scroll: "manual"
			});
		}
		function t() {
			i !== null && (i(), i = null), r || setTimeout(n, 20);
		}
		function n() {
			if (!r && !navigation.transition) {
				var e = navigation.currentEntry;
				e && e.url != null && navigation.navigate(e.url, {
					state: e.getState(),
					info: "react-transition",
					history: "replace"
				});
			}
		}
		if (typeof navigation == "object") {
			var r = !1, i = null;
			return navigation.addEventListener("navigate", e), navigation.addEventListener("navigatesuccess", t), navigation.addEventListener("navigateerror", t), setTimeout(n, 100), function() {
				r = !0, navigation.removeEventListener("navigate", e), navigation.removeEventListener("navigatesuccess", t), navigation.removeEventListener("navigateerror", t), i !== null && (i(), i = null);
			};
		}
	}
	function Wh(e) {
		this._internalRoot = e;
	}
	Gh.prototype.render = Wh.prototype.render = function(e) {
		var t = this._internalRoot;
		if (t === null) throw Error(i(409));
		var n = t.current;
		dh(n, Od(), e, t, null, null);
	}, Gh.prototype.unmount = Wh.prototype.unmount = function() {
		var e = this._internalRoot;
		if (e !== null) {
			this._internalRoot = null;
			var t = e.containerInfo;
			dh(e.current, 2, null, e, null, null), Id(), t[ht] = null;
		}
	};
	function Gh(e) {
		this._internalRoot = e;
	}
	Gh.prototype.unstable_scheduleHydration = function(e) {
		if (e) {
			var t = ut();
			e = {
				blockedOn: null,
				target: e,
				priority: t
			};
			for (var n = 0; n < Ah.length && t !== 0 && t < Ah[n].priority; n++);
			Ah.splice(n, 0, e), n === 0 && Fh(e);
		}
	};
	var Kh = n.version;
	if (Kh !== "19.3.0") throw Error(i(527, Kh, "19.3.0"));
	U.findDOMNode = function(e) {
		var t = e._reactInternals;
		if (t === void 0) throw typeof e.render == "function" ? Error(i(188)) : (e = Object.keys(e).join(","), Error(i(268, e)));
		return e = d(t), e = e === null ? null : p(e), e = e === null ? null : e.stateNode, e;
	};
	var qh = {
		bundleType: 0,
		version: "19.3.0",
		rendererPackageName: "react-dom",
		currentDispatcherRef: H,
		reconcilerVersion: "19.3.0"
	};
	if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u") {
		var Jh = __REACT_DEVTOOLS_GLOBAL_HOOK__;
		if (!Jh.isDisabled && Jh.supportsFiber) try {
			Be = Jh.inject(qh), Ve = Jh;
		} catch {}
	}
	e.createRoot = function(e, t) {
		if (!a(e)) throw Error(i(299));
		var n = !1, r = "", o = pc, s = mc, c = hc;
		return t != null && (!0 === t.unstable_strictMode && (n = !0), t.identifierPrefix !== void 0 && (r = t.identifierPrefix), t.onUncaughtError !== void 0 && (o = t.onUncaughtError), t.onCaughtError !== void 0 && (s = t.onCaughtError), t.onRecoverableError !== void 0 && (c = t.onRecoverableError)), t = lh(e, 1, !1, null, null, n, r, null, o, s, c, Uh), e[ht] = t.current, Uf(e), new Wh(t);
	};
})), g = /* @__PURE__ */ o(((e, t) => {
	function n() {
		if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u" && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE == "function") try {
			__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(n);
		} catch (e) {
			console.error(e);
		}
	}
	n(), t.exports = h();
})), _ = /* @__PURE__ */ c(u(), 1), v = {};
function y(e, t) {
	let n = _.useRef(v);
	return n.current === v && (n.current = e(t)), n;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.5.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/fastHooks.mjs
var b = [], x = void 0;
function S() {
	return x;
}
function C(e) {
	b.push(e);
}
function w(e) {
	let t = (t, n) => {
		let r = y(E).current, i;
		try {
			x = r;
			for (let e of b) e.before(r);
			i = e(t, n);
			for (let e of b) e.after(r);
			r.didInitialize = !0;
		} finally {
			x = void 0;
		}
		return i;
	};
	return t.displayName = e.displayName || e.name, t;
}
function T(e) {
	return /*#__PURE__*/ _.forwardRef(w(e));
}
function E() {
	return { didInitialize: !1 };
}
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.5.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/empty.mjs
function D() {}
var O = Object.freeze([]), k = Object.freeze({});
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.5.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/useOnMount.mjs
function A(e) {
	_.useEffect(e, O);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.5.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/useTimeout.mjs
var j = 0, M = class e {
	static create() {
		return new e();
	}
	currentId = j;
	start(e, t) {
		this.clear(), this.currentId = setTimeout(() => {
			this.currentId = j, t();
		}, e);
	}
	isStarted() {
		return this.currentId !== j;
	}
	clear = () => {
		this.currentId !== j && (clearTimeout(this.currentId), this.currentId = j);
	};
	disposeEffect = () => this.clear;
};
function ee() {
	let e = y(M.create).current;
	return A(e.disposeEffect), e;
}
var N = typeof document < "u" ? _.useLayoutEffect : () => {};
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.5.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/platform/shared.mjs
function P() {
	return typeof navigator > "u" ? {
		userAgent: "",
		platform: "",
		maxTouchPoints: 0
	} : {
		userAgent: navigator.userAgent,
		platform: navigator.platform ?? "",
		maxTouchPoints: navigator.maxTouchPoints ?? 0
	};
}
var { userAgent: F, platform: I, maxTouchPoints: L } = P(), te = F.toLowerCase(), R = I.toLowerCase(), ne = /^i(os$|p)/.test(R) || R === "macintel" && L > 1, re = "android", z = R === re || te.includes(re), B = !ne && R.startsWith("mac");
R.startsWith("win"), !z && /^(linux|chrome os)/.test(R);
var ie = B || ne, ae = typeof CSS < "u" && !!CSS.supports?.("-webkit-backdrop-filter:none");
!ae && te.includes("firefox"), !ae && te.includes("chrom");
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.5.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/platform/screen-reader.mjs
var oe = ie, se = /jsdom|happydom/.test(te);
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/utils/event.mjs
function ce(e) {
	e.preventDefault(), e.stopPropagation();
}
function V(e) {
	return "nativeEvent" in e;
}
function H(e) {
	return e.pointerType === "" && e.isTrusted ? !0 : z && e.pointerType ? e.type === "click" && e.buttons === 1 : e.detail === 0 && !e.pointerType;
}
function U(e) {
	return se ? !1 : !z && e.width === 0 && e.height === 0 || e.type === "pointerdown" && e.width === 1 && e.height === 1 && e.pressure === 0 && e.detail === 0 && e.pointerType === "mouse" && (z || e.buttons === 0) || e.width < 1 && e.height < 1 && e.pressure === 0 && e.detail === 0 && e.pointerType === "touch";
}
function le(e, t) {
	let n = ["mouse", "pen"];
	return t || n.push("", void 0), n.includes(e);
}
function ue(e) {
	let t = e.type;
	return t === "click" || t === "mousedown" || t === "keydown" || t === "keyup";
}
//#endregion
//#region node_modules/.pnpm/@floating-ui+utils@0.2.12/node_modules/@floating-ui/utils/dist/floating-ui.utils.dom.mjs
function de() {
	return typeof window < "u";
}
function fe(e) {
	return pe(e) ? (e.nodeName || "").toLowerCase() : "#document";
}
function W(e) {
	var t;
	return (e == null || (t = e.ownerDocument) == null ? void 0 : t.defaultView) || window;
}
function G(e) {
	return ((pe(e) ? e.ownerDocument : e.document) || window.document)?.documentElement;
}
function pe(e) {
	return de() ? e instanceof Node || e instanceof W(e).Node : !1;
}
function K(e) {
	return de() ? e instanceof Element || e instanceof W(e).Element : !1;
}
function me(e) {
	return de() ? e instanceof HTMLElement || e instanceof W(e).HTMLElement : !1;
}
function he(e) {
	return !de() || typeof ShadowRoot > "u" ? !1 : e instanceof ShadowRoot || e instanceof W(e).ShadowRoot;
}
function ge(e) {
	let { overflow: t, overflowX: n, overflowY: r, display: i } = De(e);
	return /auto|scroll|overlay|hidden|clip/.test(t + r + n) && i !== "inline" && i !== "contents";
}
function _e(e) {
	return /^(table|td|th)$/.test(fe(e));
}
function ve(e) {
	try {
		if (e.matches(":popover-open")) return !0;
	} catch {}
	try {
		return e.matches(":modal");
	} catch {
		return !1;
	}
}
var ye = /transform|translate|scale|rotate|perspective|filter/, be = /paint|layout|strict|content/, xe = (e) => !!e && e !== "none", Se;
function Ce(e) {
	let t = K(e) ? De(e) : e;
	return xe(t.transform) || xe(t.translate) || xe(t.scale) || xe(t.rotate) || xe(t.perspective) || !Te() && (xe(t.backdropFilter) || xe(t.filter)) || ye.test(t.willChange || "") || be.test(t.contain || "");
}
function we(e) {
	let t = ke(e);
	for (; me(t) && !Ee(t);) {
		if (Ce(t)) return t;
		if (ve(t)) return null;
		t = ke(t);
	}
	return null;
}
function Te() {
	return Se ??= typeof CSS < "u" && CSS.supports && CSS.supports("-webkit-backdrop-filter", "none"), Se;
}
function Ee(e) {
	return /^(html|body|#document)$/.test(fe(e));
}
function De(e) {
	return W(e).getComputedStyle(e);
}
function Oe(e) {
	return K(e) ? {
		scrollLeft: e.scrollLeft,
		scrollTop: e.scrollTop
	} : {
		scrollLeft: e.scrollX,
		scrollTop: e.scrollY
	};
}
function ke(e) {
	if (fe(e) === "html") return e;
	let t = e.assignedSlot || e.parentNode || he(e) && e.host || G(e);
	return he(t) ? t.host : t;
}
function Ae(e) {
	let t = ke(e);
	return Ee(t) ? (e.ownerDocument || e).body : me(t) && ge(t) ? t : Ae(t);
}
function je(e, t, n) {
	t === void 0 && (t = []), n === void 0 && (n = !0);
	let r = Ae(e), i = r === e.ownerDocument?.body, a = W(r);
	if (i) {
		let e = Me(a);
		return t.concat(a, a.visualViewport || [], ge(r) ? r : [], e && n ? je(e) : []);
	}
	return t.concat(r, je(r, [], n));
}
function Me(e) {
	return e.parent && Object.getPrototypeOf(e.parent) ? e.frameElement : null;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.5.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/shadowDom.mjs
function Ne(e) {
	let t = e.activeElement;
	for (; t?.shadowRoot?.activeElement != null;) t = t.shadowRoot.activeElement;
	return t;
}
function q(e, t) {
	if (!e || !t) return !1;
	let n = t.getRootNode?.();
	if (e.contains(t)) return !0;
	if (n && he(n)) {
		let n = t;
		for (; n;) {
			if (e === n) return !0;
			n = n.parentNode || n.host;
		}
	}
	return !1;
}
function Pe(e, t) {
	let n = e;
	for (; n;) {
		if (K(n) && n.matches(t)) return n;
		n = n.assignedSlot ?? n.parentNode ?? (he(n) ? n.host : null);
	}
	return null;
}
function Fe(e) {
	return "composedPath" in e ? e.composedPath()[0] ?? e.target : e.target;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/utils/constants.mjs
var Ie = "data-base-ui-focusable", Le = "input:not([type='hidden']):not([disabled]),[contenteditable]:not([contenteditable='false']),textarea:not([disabled])", Re = "ArrowLeft", ze = "ArrowRight", Be = "ArrowUp", Ve = "ArrowDown", He = "data-starting-style", Ue = "data-ending-style", We = { [He]: "" }, Ge = { [Ue]: "" }, Ke = { transitionStatus(e) {
	return e === "starting" ? We : e === "ending" ? Ge : null;
} }, qe = "data-open", Je = "data-closed", Ye = "data-anchor-hidden", Xe = "data-popup-open", Ze = "data-pressed", Qe = { [Xe]: "" }, $e = {
	[Xe]: "",
	[Ze]: ""
}, et = { [qe]: "" }, tt = { [Je]: "" }, nt = { [Ye]: "" }, rt = { open(e) {
	return e ? Qe : null;
} }, it = { open(e) {
	return e ? $e : null;
} }, at = {
	open(e) {
		return e ? et : tt;
	},
	anchorHidden(e) {
		return e ? nt : null;
	}
}, ot = {
	...at,
	...Ke
}, st = "data-trigger-disabled";
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/utils/element.mjs
function ct(e, t) {
	if (!K(e)) return !1;
	let n = e;
	if (t.hasElement(n)) return !n.hasAttribute(st);
	for (let [, e] of t.entries()) if (q(e, n)) return !e.hasAttribute(st);
	return !1;
}
function lt(e, t) {
	if (t == null) return !1;
	if ("composedPath" in e) return e.composedPath().includes(t);
	let n = e;
	return n.target != null && t.contains(n.target);
}
function ut(e) {
	return e.matches("html,body");
}
function dt(e) {
	return me(e) && e.matches("input:not([type='hidden']):not([disabled]),[contenteditable]:not([contenteditable='false']),textarea:not([disabled])");
}
function ft(e) {
	return Pe(e, `button,a[href],[role="button"],select,[tabindex]:not([tabindex="-1"]),${Le}`) != null;
}
function pt(e) {
	return e ? e.getAttribute("role") === "combobox" && dt(e) : !1;
}
function mt(e) {
	if (!e || se) return !0;
	try {
		return e.matches(":focus-visible");
	} catch {
		return !0;
	}
}
function ht(e) {
	return e ? e.hasAttribute("data-base-ui-focusable") ? e : e.querySelector("[data-base-ui-focusable]") || e : null;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/hooks/useHoverShared.mjs
function gt(e, t) {
	return t != null && !le(t) ? 0 : typeof e == "function" ? e() : e;
}
function _t(e, t, n) {
	let r = gt(e, n);
	return typeof r == "number" ? r : r?.[t];
}
function vt(e) {
	return typeof e == "function" ? e() : e;
}
function yt(e, t) {
	return t || e === "click" || e === "mousedown";
}
function bt(e) {
	return e?.includes("mouse") && e !== "mousedown";
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/createBaseUIEventDetails.mjs
function J(e, t, n, r) {
	let i = !1, a = !1, o = r ?? k;
	return {
		reason: e,
		event: t ?? new Event("base-ui"),
		cancel() {
			i = !0;
		},
		allowPropagation() {
			a = !0;
		},
		get isCanceled() {
			return i;
		},
		get isPropagationAllowed() {
			return a;
		},
		trigger: n,
		...o
	};
}
function xt(e, t, n) {
	let r = n ?? k;
	return {
		reason: e,
		event: t ?? new Event("base-ui"),
		...r
	};
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/reason-parts.mjs
var St = "none", Ct = "trigger-press", wt = "trigger-hover", Tt = "trigger-focus", Et = "outside-press", Dt = "item-press", Ot = "close-press", kt = "focus-out", At = "escape-key", jt = "list-navigation", Mt = "keyboard", Nt = "pointer", Pt = "cancel-open", Ft = "sibling-open", It = "disabled", Lt = "imperative-action", Rt = /* @__PURE__ */ o(((e) => {
	var t = Symbol.for("react.transitional.element"), n = Symbol.for("react.fragment");
	function r(e, n, r) {
		var i = null;
		if (r !== void 0 && (i = "" + r), n.key !== void 0 && (i = "" + n.key), "key" in n) for (var a in r = {}, n) a !== "key" && (r[a] = n[a]);
		else r = n;
		return n = r.ref, {
			$$typeof: t,
			type: e,
			key: i,
			ref: n === void 0 ? null : n,
			props: r
		};
	}
	e.Fragment = n, e.jsx = r, e.jsxs = r;
})), Y = (/* @__PURE__ */ o(((e, t) => {
	t.exports = Rt();
})))(), zt = /*#__PURE__*/ _.createContext({
	hasProvider: !1,
	timeoutMs: 0,
	delayRef: { current: 0 },
	initialDelayRef: { current: 0 },
	timeout: new M(),
	currentIdRef: { current: null },
	currentContextRef: { current: null }
});
function Bt(e, t) {
	e.current = t.current;
}
function Vt(e) {
	let { children: t, delay: n, timeoutMs: r = 0 } = e, i = _.useRef(n), a = _.useRef(n), o = _.useRef(null), s = _.useRef(null), c = ee();
	return N(() => {
		if (a.current = n, !o.current) {
			i.current = n;
			return;
		}
		i.current = {
			open: _t(i.current, "open"),
			close: _t(n, "close")
		};
	}, [
		n,
		o,
		i,
		a
	]), /*#__PURE__*/ (0, Y.jsx)(zt.Provider, {
		value: _.useMemo(() => ({
			hasProvider: !0,
			delayRef: i,
			initialDelayRef: a,
			currentIdRef: o,
			timeoutMs: r,
			currentContextRef: s,
			timeout: c
		}), [r, c]),
		children: t
	});
}
function Ht(e, t = { open: !1 }) {
	let { open: n } = t, r = e.useState("floatingId"), { currentIdRef: i, delayRef: a, timeoutMs: o, initialDelayRef: s, currentContextRef: c, hasProvider: l, timeout: u } = _.useContext(zt), [d, f] = _.useState(!1), p = _.useRef(n);
	return N(() => {
		p.current = n;
	}, [n]), N(() => {
		function t() {
			c.current?.setIsInstantPhase(!1), i.current = null, c.current = null, a.current = s.current, u.clear();
		}
		if (i.current && !n && i.current === r) {
			if (f(!1), o) {
				let n = r;
				return u.start(o, () => {
					e.select("open") || i.current && i.current !== n || t();
				}), () => {
					(p.current || i.current !== n) && u.clear();
				};
			}
			t();
		}
	}, [
		n,
		r,
		i,
		a,
		o,
		s,
		c,
		u,
		e
	]), N(() => {
		if (!n) return;
		let t = c.current, o = i.current;
		u.clear(), c.current = {
			onOpenChange: e.setOpen,
			setIsInstantPhase: f
		}, i.current = r, a.current = {
			open: 0,
			close: _t(s.current, "close")
		}, o !== null && o !== r ? (f(!0), t?.setIsInstantPhase(!0), t?.onOpenChange(!1, J(St))) : (f(!1), t?.setIsInstantPhase(!1));
	}, [
		n,
		r,
		e,
		i,
		a,
		s,
		c,
		u
	]), N(() => () => {
		if (i.current === r) {
			if (c.current = null, !p.current) return;
			i.current = null, Bt(a, s), u.clear();
		}
	}, [
		c,
		i,
		a,
		r,
		s,
		u
	]), _.useMemo(() => ({
		activeIdRef: i,
		hasProvider: l,
		delayRef: a,
		isInstantPhase: d
	}), [
		i,
		l,
		a,
		d
	]);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.5.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/addEventListener.mjs
function X(e, t, n, r) {
	return e.addEventListener(t, n, r), () => {
		e.removeEventListener(t, n, r);
	};
}
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.5.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/mergeCleanups.mjs
function Ut(...e) {
	return () => {
		for (let t = 0; t < e.length; t += 1) {
			let n = e[t];
			n && n();
		}
	};
}
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.5.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/useMergedRefs.mjs
function Wt(e, t, n, r) {
	let i = y(Kt).current;
	return qt(i, e, t, n, r) && Yt(i, [
		e,
		t,
		n,
		r
	]), i.callback;
}
function Gt(e) {
	let t = y(Kt).current;
	return Jt(t, e) && Yt(t, e), t.callback;
}
function Kt() {
	return {
		callback: null,
		cleanup: null,
		refs: []
	};
}
function qt(e, t, n, r, i) {
	return e.refs[0] !== t || e.refs[1] !== n || e.refs[2] !== r || e.refs[3] !== i;
}
function Jt(e, t) {
	return e.refs.length !== t.length || e.refs.some((e, n) => e !== t[n]);
}
function Yt(e, t) {
	if (e.refs = t, t.every((e) => e == null)) {
		e.callback = null;
		return;
	}
	e.callback = (n) => {
		if (e.cleanup &&= (e.cleanup(), null), n != null) {
			let r = Array(t.length).fill(null);
			for (let e = 0; e < t.length; e += 1) {
				let i = t[e];
				if (i != null) switch (typeof i) {
					case "function": {
						let t = i(n);
						typeof t == "function" && (r[e] = t);
						break;
					}
					case "object": i.current = n;
				}
			}
			e.cleanup = () => {
				for (let e = 0; e < t.length; e += 1) {
					let n = t[e];
					if (n != null) switch (typeof n) {
						case "function": {
							let t = r[e];
							typeof t == "function" ? t() : n(null);
							break;
						}
						case "object": n.current = null;
					}
				}
			};
		}
	};
}
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.5.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/useValueAsRef.mjs
function Xt(e) {
	let t = y(Zt, e).current;
	return t.next = e, N(t.effect), t;
}
function Zt(e) {
	let t = {
		current: e,
		next: e,
		effect: () => {
			t.current = t.next;
		}
	};
	return t;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.5.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/safeReact.mjs
var Qt = { ..._ }, $t = Qt.useInsertionEffect, en = $t && $t !== Qt.useLayoutEffect ? $t : (e) => e();
function Z(e) {
	let t = y(tn).current;
	return t.next = e, en(t.effect), t.trampoline;
}
function tn() {
	let e = {
		next: void 0,
		callback: nn,
		trampoline: (...t) => e.callback?.(...t),
		effect: () => {
			e.callback = e.next;
		}
	};
	return e;
}
function nn() {}
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.5.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/useAnimationFrame.mjs
var rn = null;
globalThis.requestAnimationFrame;
var an = new class {
	callbacks = [];
	callbacksCount = 0;
	nextId = 1;
	startId = 1;
	isScheduled = !1;
	tick = (e) => {
		this.isScheduled = !1;
		let t = this.callbacks, n = this.callbacksCount;
		if (this.callbacks = [], this.callbacksCount = 0, this.startId = this.nextId, n > 0) for (let n = 0; n < t.length; n += 1) t[n]?.(e);
	};
	request(e) {
		let t = this.nextId;
		return this.nextId += 1, this.callbacks.push(e), this.callbacksCount += 1, this.isScheduled ||= (requestAnimationFrame(this.tick), !0), t;
	}
	cancel(e) {
		let t = e - this.startId;
		t < 0 || t >= this.callbacks.length || this.callbacks[t] !== null && (this.callbacks[t] = null, --this.callbacksCount);
	}
}(), on = class e {
	static create() {
		return new e();
	}
	static request(e) {
		return an.request(e);
	}
	static cancel(e) {
		return an.cancel(e);
	}
	currentId = rn;
	request(e) {
		this.cancel(), this.currentId = an.request(() => {
			this.currentId = rn, e();
		});
	}
	cancel = () => {
		this.currentId !== rn && (an.cancel(this.currentId), this.currentId = rn);
	};
	disposeEffect = () => this.cancel;
};
function sn() {
	let e = y(on.create).current;
	return A(e.disposeEffect), e;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.5.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/owner.mjs
function cn(e) {
	return e?.ownerDocument || document;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.5.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/visuallyHidden.mjs
var ln = {
	clipPath: "inset(50%)",
	overflow: "hidden",
	whiteSpace: "nowrap",
	border: 0,
	padding: 0,
	width: 1,
	height: 1,
	margin: -1
}, un = {
	...ln,
	position: "fixed",
	margin: 0,
	top: 0,
	left: 0
};
({ ...ln });
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/utils/FocusGuard.mjs
var dn = /*#__PURE__*/ _.forwardRef(function(e, t) {
	let [n, r] = _.useState();
	N(() => {
		oe && ae && r("button");
	}, []);
	let i = {
		tabIndex: 0,
		role: n
	};
	return /*#__PURE__*/ (0, Y.jsx)("span", {
		...e,
		ref: t,
		style: un,
		"aria-hidden": !n || void 0,
		...i,
		"data-base-ui-focus-guard": ""
	});
}), fn = Math.min, pn = Math.max, mn = Math.round, hn = Math.floor, gn = (e) => ({
	x: e,
	y: e
}), _n = {
	left: "right",
	right: "left",
	bottom: "top",
	top: "bottom"
};
function vn(e, t, n) {
	return pn(e, fn(t, n));
}
function yn(e, t) {
	return typeof e == "function" ? e(t) : e;
}
function bn(e) {
	return e.split("-")[0];
}
function xn(e) {
	return e.split("-")[1];
}
function Sn(e) {
	return e === "x" ? "y" : "x";
}
function Cn(e) {
	return e === "y" ? "height" : "width";
}
function wn(e) {
	let t = e[0];
	return t === "t" || t === "b" ? "y" : "x";
}
function Tn(e) {
	return Sn(wn(e));
}
function En(e, t, n) {
	n === void 0 && (n = !1);
	let r = xn(e), i = Tn(e), a = Cn(i), o = i === "x" ? r === (n ? "end" : "start") ? "right" : "left" : r === "start" ? "bottom" : "top";
	return t.reference[a] > t.floating[a] && (o = Fn(o)), [o, Fn(o)];
}
function Dn(e) {
	let t = Fn(e);
	return [
		On(e),
		t,
		On(t)
	];
}
function On(e) {
	return e.includes("start") ? e.replace("start", "end") : e.replace("end", "start");
}
var kn = ["left", "right"], An = ["right", "left"], jn = ["top", "bottom"], Mn = ["bottom", "top"];
function Nn(e, t, n) {
	switch (e) {
		case "top":
		case "bottom": return n ? t ? An : kn : t ? kn : An;
		case "left":
		case "right": return t ? jn : Mn;
		default: return [];
	}
}
function Pn(e, t, n, r) {
	let i = xn(e), a = Nn(bn(e), n === "start", r);
	return i && (a = a.map((e) => e + "-" + i), t && (a = a.concat(a.map(On)))), a;
}
function Fn(e) {
	let t = bn(e);
	return _n[t] + e.slice(t.length);
}
function In(e) {
	return {
		top: e.top ?? 0,
		right: e.right ?? 0,
		bottom: e.bottom ?? 0,
		left: e.left ?? 0
	};
}
function Ln(e) {
	return typeof e == "number" ? {
		top: e,
		right: e,
		bottom: e,
		left: e
	} : In(e);
}
function Rn(e) {
	let { x: t, y: n, width: r, height: i } = e;
	return {
		width: r,
		height: i,
		top: n,
		left: t,
		right: t + r,
		bottom: n + i,
		x: t,
		y: n
	};
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/utils/composite.mjs
function zn(e, t) {
	return t < 0 || t >= e.length;
}
function Bn(e, t) {
	return Un(e.current, { disabledIndices: t });
}
function Vn(e, t) {
	return Un(e.current, {
		decrement: !0,
		startingIndex: e.current.length,
		disabledIndices: t
	});
}
function Hn(e, t, n) {
	let { decrement: r, loopFocus: i, allowEscape: a, disabledIndices: o, minIndex: s, maxIndex: c } = n, l = () => Un(e, {
		startingIndex: t,
		decrement: r,
		disabledIndices: o
	}), u, d = !1;
	if (!i) u = r ? Math.max(s, l()) : Math.min(c, l());
	else if (r ? t <= s : t >= c) {
		let n = r ? -1 : e.length;
		a && t !== n ? u = -1 : (u = r ? c : s, d = !0);
	} else u = l();
	return {
		index: zn(e, u) ? -1 : u,
		wrapped: d
	};
}
function Un(e, { startingIndex: t = -1, decrement: n = !1, disabledIndices: r, amount: i = 1 } = {}) {
	let a = t;
	do
		a += n ? -i : i;
	while (a >= 0 && a <= e.length - 1 && Wn(e, a, r));
	return a;
}
function Wn(e, t, n) {
	if (typeof n == "function" ? n(t) : n?.includes(t) ?? !1) return !0;
	let r = e[t];
	return r ? !Kn(r) || r.matches(":disabled") ? !0 : !n && (r.hasAttribute("disabled") || r.getAttribute("aria-disabled") === "true") : !1;
}
function Gn(e) {
	return e.visibility === "hidden" || e.visibility === "collapse";
}
function Kn(e, t = e ? De(e) : null) {
	return !e || !e.isConnected || !t || Gn(t) ? !1 : typeof e.checkVisibility == "function" ? e.checkVisibility() : t.display !== "none" && t.display !== "contents";
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/utils/tabbable.mjs
var qn = "a[href],button,input,select,textarea,summary,details,iframe,object,embed,[tabindex],[contenteditable]:not([contenteditable=\"false\"]),audio[controls],video[controls]";
function Jn(e) {
	let t = e.assignedSlot;
	if (t) return t;
	if (e.parentElement) return e.parentElement;
	let n = e.getRootNode();
	return he(n) ? n.host : null;
}
function Yn(e) {
	for (let t of Array.from(e.children)) if (fe(t) === "summary") return t;
	return null;
}
function Xn(e, t) {
	let n = Yn(t);
	return !!n && (e === n || q(n, e));
}
function Zn(e) {
	let t = e ? fe(e) : "";
	return e != null && e.matches(qn) && (t !== "summary" || e.parentElement != null && fe(e.parentElement) === "details" && Yn(e.parentElement) === e) && (t !== "details" || Yn(e) == null) && (t !== "input" || e.type !== "hidden");
}
function Qn(e) {
	if (!Zn(e) || !e.isConnected || e.matches(":disabled")) return !1;
	for (let t = e; t; t = Jn(t)) {
		let n = t !== e, r = fe(t) === "slot";
		if (t.hasAttribute("inert") || n && fe(t) === "details" && !t.open && !Xn(e, t) || t.hasAttribute("hidden") || !r && !$n(t, n)) return !1;
	}
	return !0;
}
function $n(e, t) {
	let n = De(e);
	return t ? n.display !== "none" : Kn(e, n);
}
function er(e) {
	let t = e.tabIndex;
	if (t < 0) {
		let t = fe(e);
		if (t === "details" || t === "audio" || t === "video" || me(e) && e.isContentEditable) return 0;
	}
	return t;
}
function tr(e) {
	if (fe(e) !== "input") return null;
	let t = e;
	return t.type === "radio" && t.name !== "" ? t : null;
}
function nr(e, t) {
	let n = tr(e);
	if (!n) return !0;
	let r = t.find((e) => {
		let t = tr(e);
		return t?.name === n.name && t.form === n.form && t.checked;
	});
	return r ? r === n : t.find((e) => {
		let t = tr(e);
		return t?.name === n.name && t.form === n.form;
	}) === n;
}
function rr(e) {
	if (me(e) && fe(e) === "slot") {
		let t = e.assignedElements({ flatten: !0 });
		if (t.length > 0) return t;
	}
	return me(e) && e.shadowRoot ? Array.from(e.shadowRoot.children) : Array.from(e.children);
}
function ir(e, t) {
	rr(e).forEach((e) => {
		Zn(e) && t.push(e), ir(e, t);
	});
}
function ar(e, t, n) {
	rr(e).forEach((e) => {
		me(e) && e.matches(t) && n.push(e), ar(e, t, n);
	});
}
function or(e) {
	return Qn(e) && er(e) >= 0;
}
function sr(e) {
	let t = [];
	return ir(e, t), t.filter(Qn);
}
function cr(e) {
	let t = sr(e);
	return t.filter((e) => er(e) >= 0 && nr(e, t));
}
function lr(e, t) {
	let n = cr(e), r = n.length;
	if (r === 0) return;
	let i = Ne(cn(e)), a = n.indexOf(i);
	return n[a === -1 ? t === 1 ? 0 : r - 1 : a + t];
}
function ur(e) {
	return lr(cn(e).body, 1) || e;
}
function dr(e) {
	return lr(cn(e).body, -1) || e;
}
function fr(e, t, n) {
	if (!e) return null;
	let r = [];
	ir(cn(e).body, r);
	let i = r.indexOf(e);
	if (i === -1) return null;
	let a = r.filter(Qn);
	for (let e = 1; e < r.length; e += 1) {
		let o = r[(i + t * e + r.length) % r.length];
		if (!q(n, o) && or(o) && nr(o, a)) return o;
	}
	return r[i];
}
function pr(e, t) {
	let n = t || e.currentTarget, r = e.relatedTarget;
	return !r || !q(n, r);
}
function mr(e) {
	cr(e).forEach((e) => {
		e.dataset.tabindex = e.getAttribute("tabindex") || "", e.setAttribute("tabindex", "-1");
	});
}
function hr(e) {
	let t = [];
	ar(e, "[data-tabindex]", t), t.forEach((e) => {
		let t = e.dataset.tabindex;
		delete e.dataset.tabindex, t ? e.setAttribute("tabindex", t) : e.removeAttribute("tabindex");
	});
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/utils/nodes.mjs
function gr(e, t, n = !0) {
	return e.filter((e) => e.parentId === t).flatMap((t) => [...!n || t.context?.open ? [t] : [], ...gr(e, t.id, n)]);
}
function _r(e, t) {
	let n = [], r = e.find((e) => e.id === t)?.parentId;
	for (; r;) {
		let t = e.find((e) => e.id === r);
		r = t?.parentId, t && (n = n.concat(t));
	}
	return n;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/utils/createAttribute.mjs
function vr(e) {
	return `data-base-ui-${e}`;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/utils/enqueueFocus.mjs
var yr = 0;
function br(e, t = {}) {
	let { preventScroll: n = !1, sync: r = !1, shouldFocus: i } = t;
	cancelAnimationFrame(yr);
	function a() {
		(!i || i()) && e?.focus({ preventScroll: n });
	}
	if (r) return a(), D;
	let o = requestAnimationFrame(a);
	return yr = o, () => {
		yr === o && (cancelAnimationFrame(o), yr = 0);
	};
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/utils/markOthers.mjs
var xr = "data-base-ui-inert", Sr = /* @__PURE__ */ new WeakMap(), Cr = /* @__PURE__ */ new WeakSet(), wr = /* @__PURE__ */ new WeakMap(), Tr = 0;
function Er(e) {
	return e ? he(e) ? e.host : Er(e.parentNode) : null;
}
var Dr = (e, t) => t.map((t) => {
	if (e.contains(t)) return t;
	let n = Er(t);
	return e.contains(n) ? n : null;
}).filter((e) => e != null), Or = (e) => {
	let t = /* @__PURE__ */ new Set();
	return e.forEach((e) => {
		let n = e;
		for (; n && !t.has(n);) t.add(n), n = n.parentNode;
	}), t;
}, kr = (e, t, n) => {
	let r = [], i = (e) => {
		e && !n.has(e) && Array.from(e.children).forEach((e) => {
			fe(e) !== "script" && (t.has(e) ? i(e) : r.push(e));
		});
	};
	return i(e), r;
};
function Ar(e, t, n, { mark: r = !0 }) {
	let i = Dr(t, e), a = r ? kr(t, Or(i), new Set(i)) : [], o = [], s = [];
	if (n) {
		let e = Dr(t, Array.from(t.querySelectorAll("[aria-live]"))), n = i.concat(e);
		kr(t, Or(n), new Set(n)).forEach((e) => {
			let t = e.getAttribute("aria-hidden"), n = t !== null && t !== "false", r = (Sr.get(e) || 0) + 1;
			Sr.set(e, r), o.push(e), r === 1 && n && Cr.add(e), n || e.setAttribute("aria-hidden", "true");
		});
	}
	return r && a.forEach((e) => {
		let t = (wr.get(e) || 0) + 1;
		wr.set(e, t), s.push(e), t === 1 && e.setAttribute(xr, "");
	}), Tr += 1, () => {
		o.forEach((e) => {
			let t = (Sr.get(e) || 0) - 1;
			Sr.set(e, t), t || (Cr.has(e) || e.removeAttribute("aria-hidden"), Cr.delete(e));
		}), r && s.forEach((e) => {
			let t = (wr.get(e) || 0) - 1;
			wr.set(e, t), t || e.removeAttribute(xr);
		}), --Tr, Tr || (Sr = /* @__PURE__ */ new WeakMap(), Cr = /* @__PURE__ */ new WeakSet(), wr = /* @__PURE__ */ new WeakMap());
	};
}
function jr(e, t = {}) {
	let { ariaHidden: n = !1, mark: r = !0 } = t, i = cn(e[0]).body;
	return Ar(e, i, n, { mark: r });
}
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.5.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/useForcedRerendering.mjs
function Mr() {
	let [, e] = _.useState({});
	return _.useCallback(() => {
		e({});
	}, []);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.5.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/useId.mjs
var Nr = 0;
function Pr(e, t = "mui") {
	let n = _.useRef(void 0), r = Mr(), i = e ?? n.current;
	return _.useEffect(() => {
		n.current ?? (Nr += 1, n.current = `${t}-${Nr}`, e ?? r());
	}, [
		e,
		t,
		r
	]), i;
}
var Fr = Qt.useId;
function Ir(e, t) {
	if (Fr !== void 0) {
		let n = Fr();
		return e ?? (t ? `${t}-${n}` : n);
	}
	return Pr(e, t);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.5.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/reactVersion.mjs
var Lr = 19;
function Rr(e) {
	return Lr >= e;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.5.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/getReactElementRef.mjs
function zr(e) {
	if (!/*#__PURE__*/ _.isValidElement(e)) return null;
	let t = e, n = t.props;
	return (Rr(19) ? n?.ref : t.ref) ?? null;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.5.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/mergeObjects.mjs
function Br(e, t) {
	if (e && !t) return e;
	if (!e && t) return t;
	if (e || t) return {
		...e,
		...t
	};
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/getStateAttributesProps.mjs
function Vr(e, t) {
	let n = {};
	for (let r in e) {
		let i = e[r];
		if (t?.hasOwnProperty(r)) {
			let e = t[r](i);
			e != null && Object.assign(n, e);
			continue;
		}
		i === !0 ? n[`data-${r.toLowerCase()}`] = "" : i && (n[`data-${r.toLowerCase()}`] = i.toString());
	}
	return n;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/utils/resolveClassName.mjs
function Hr(e, t) {
	return typeof e == "function" ? e(t) : e;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/utils/resolveStyle.mjs
function Ur(e, t) {
	return typeof e == "function" ? e(t) : e;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/merge-props/mergeProps.mjs
var Wr = {};
function Gr(e, t, n, r, i) {
	if (!n && !r && !i && !e) return qr(t);
	let a = qr(e);
	return t && (a = Jr(a, t)), n && (a = Jr(a, n)), r && (a = Jr(a, r)), i && (a = Jr(a, i)), a;
}
function Kr(e) {
	if (e.length === 0) return Wr;
	if (e.length === 1) return qr(e[0]);
	let t = qr(e[0]);
	for (let n = 1; n < e.length; n += 1) t = Jr(t, e[n]);
	return t;
}
function qr(e) {
	return Qr(e) ? { ...e(Wr) } : Yr(e);
}
function Jr(e, t) {
	return Qr(t) ? t(e) : Xr(e, t);
}
function Yr(e) {
	let t = { ...e };
	for (let e in t) {
		let n = t[e];
		Zr(e, n) && (t[e] = ei(n));
	}
	return t;
}
function Xr(e, t) {
	if (!t) return e;
	for (let n in t) {
		let r = t[n];
		switch (n) {
			case "style":
				e[n] = Br(e.style, r);
				break;
			case "className":
				e[n] = ni(e.className, r);
				break;
			default: e[n] = Zr(n, r) ? $r(e[n], r) : r;
		}
	}
	return e;
}
function Zr(e, t) {
	let n = e.charCodeAt(0), r = e.charCodeAt(1), i = e.charCodeAt(2);
	return n === 111 && r === 110 && i >= 65 && i <= 90 && (typeof t == "function" || t === void 0);
}
function Qr(e) {
	return typeof e == "function";
}
function $r(e, t) {
	return t ? e ? (...n) => {
		let r = n[0];
		if (ri(r)) {
			let i = r;
			ti(i);
			let a = t(...n);
			return i.baseUIHandlerPrevented || e?.(...n), a;
		}
		let i = t(...n);
		return e?.(...n), i;
	} : ei(t) : e;
}
function ei(e) {
	return e && ((...t) => {
		let n = t[0];
		return ri(n) && ti(n), e(...t);
	});
}
function ti(e) {
	return e.preventBaseUIHandler = () => {
		e.baseUIHandlerPrevented = !0;
	}, e;
}
function ni(e, t) {
	return t ? e ? t + " " + e : t : e;
}
function ri(e) {
	return typeof e == "object" && !!e && "nativeEvent" in e;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/useRenderElement.mjs
function ii(e, t, n = {}) {
	let r = t.render;
	n.enabled !== !1 && (r = ci(r));
	let i = ai(t, n, r);
	if (n.enabled === !1) return null;
	let a = n.state ?? k;
	return li(e, r, i, a);
}
function ai(e, t, n) {
	let { className: r, style: i } = e, { state: a = k, ref: o, props: s, stateAttributesMapping: c, enabled: l = !0 } = t, u = l ? Hr(r, a) : void 0, d = l ? Ur(i, a) : void 0, f = l ? Vr(a, c) : k, p = l && s ? oi(s) : void 0, m = l ? Br(f, p) ?? {} : k;
	return typeof document < "u" && (l ? m.ref = Array.isArray(o) ? Gt([
		m.ref,
		zr(n),
		...o
	]) : Wt(m.ref, zr(n), o) : Wt(null, null)), l ? (u !== void 0 && (m.className = ni(m.className, u)), d !== void 0 && (m.style = Br(m.style, d)), m) : k;
}
function oi(e) {
	return Array.isArray(e) ? Kr(e) : Gr(void 0, e);
}
var si = Symbol.for("react.lazy");
function ci(e) {
	if (e?.$$typeof !== si) return e;
	let t = _.Children.toArray(e)[0];
	return /*#__PURE__*/ _.isValidElement(t) ? t : e;
}
function li(e, t, n, r) {
	if (t) {
		if (typeof t == "function") return t(n, r);
		let e = Gr(n, t.props);
		return e.ref = n.ref, /*#__PURE__*/ _.cloneElement(t, e);
	}
	return ui(e, n);
}
function ui(e, t) {
	return e === "button" ? /*#__PURE__*/ (0, _.createElement)("button", {
		type: "button",
		...t,
		key: t.key
	}) : e === "img" ? /*#__PURE__*/ (0, _.createElement)("img", {
		alt: "",
		...t,
		key: t.key
	}) : /*#__PURE__*/ _.createElement(e, t);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/constants.mjs
var di = { style: { transition: "none" } }, fi = "data-base-ui-click-trigger", pi = { fallbackAxisSide: "none" }, mi = { fallbackAxisSide: "end" }, hi = {
	clipPath: "inset(50%)",
	position: "fixed",
	top: 0,
	left: 0
}, gi = /* @__PURE__ */ c(m(), 1), _i = /*#__PURE__*/ _.createContext(null), vi = () => _.useContext(_i), yi = vr("portal");
function bi(e = {}) {
	let { ref: t, container: n, componentProps: r = k, elementProps: i } = e, a = Ir(), o = vi()?.portalNode, [s, c] = _.useState(null), [l, u] = _.useState(null), d = Z((e) => {
		e !== null && u(e);
	}), f = _.useRef(null);
	N(() => {
		if (n === null) {
			f.current && (f.current = null, u(null), c(null));
			return;
		}
		let e = (n && (pe(n) ? n : n.current)) ?? o ?? document.body;
		if (e == null) {
			f.current && (f.current = null, u(null), c(null));
			return;
		}
		f.current !== e && (f.current = e, u(null), c(e));
	}, [n, o]);
	let p = ii("div", r, {
		ref: [t, d],
		props: [{
			id: a,
			[yi]: ""
		}, i]
	}), m = s && p ? /*#__PURE__*/ gi.createPortal(p, s) : null;
	return {
		node: l,
		nodeId: /*#__PURE__*/ _.isValidElement(p) ? p.props.id : void 0,
		subtree: m
	};
}
var xi = /*#__PURE__*/ _.forwardRef(function(e, t) {
	let { render: n, className: r, style: i, children: a, container: o, portalOwnerRole: s, ...c } = e, { node: l, nodeId: u, subtree: d } = bi({
		container: o,
		ref: t,
		componentProps: e,
		elementProps: c
	}), f = _.useRef(null), p = _.useRef(null), m = _.useRef(null), h = _.useRef(null), [g, v] = _.useState(null), y = _.useRef(!1), b = g?.modal, x = g?.open, S = !!g && !g.modal && g.open && !!l;
	_.useEffect(() => {
		if (!l || b) return;
		function e(e) {
			l && e.relatedTarget && pr(e) && (e.type === "focusin" ? y.current &&= (hr(l), !1) : (mr(l), y.current = !0));
		}
		return Ut(X(l, "focusin", e, !0), X(l, "focusout", e, !0));
	}, [l, b]), N(() => {
		l && x === !0 && y.current && (hr(l), y.current = !1);
	}, [x, l]);
	let C = _.useMemo(() => ({
		beforeOutsideRef: f,
		afterOutsideRef: p,
		beforeInsideRef: m,
		afterInsideRef: h,
		portalNode: l,
		setFocusManagerState: v
	}), [l]);
	return /*#__PURE__*/ (0, Y.jsxs)(_.Fragment, { children: [d, /*#__PURE__*/ (0, Y.jsxs)(_i.Provider, {
		value: C,
		children: [
			S && l && /*#__PURE__*/ (0, Y.jsx)(dn, {
				"data-type": "outside",
				ref: f,
				onFocus: (e) => {
					pr(e, l) ? m.current?.focus() : dr(g ? g.domReference : null)?.focus();
				}
			}),
			S && l && /*#__PURE__*/ (0, Y.jsx)("span", {
				role: s,
				"aria-owns": u,
				style: hi
			}),
			l && /*#__PURE__*/ gi.createPortal(a, l),
			S && l && /*#__PURE__*/ (0, Y.jsx)(dn, {
				"data-type": "outside",
				ref: p,
				onFocus: (e) => {
					pr(e, l) ? h.current?.focus() : (ur(g ? g.domReference : null)?.focus(), g?.closeOnFocusOut && g?.onOpenChange(!1, J("focus-out", e.nativeEvent)));
				}
			})
		]
	})] });
});
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/utils/createEventEmitter.mjs
function Si() {
	let e = /* @__PURE__ */ new Map();
	return {
		emit(t, n) {
			e.get(t)?.forEach((e) => e(n));
		},
		on(t, n) {
			e.has(t) || e.set(t, /* @__PURE__ */ new Set()), e.get(t).add(n);
		},
		off(t, n) {
			e.get(t)?.delete(n);
		}
	};
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/components/FloatingTreeStore.mjs
var Ci = class {
	nodesRef = { current: [] };
	events = Si();
	addNode(e) {
		this.nodesRef.current.push(e);
	}
	removeNode(e) {
		let t = this.nodesRef.current.findIndex((t) => t === e);
		t !== -1 && this.nodesRef.current.splice(t, 1);
	}
}, wi = /*#__PURE__*/ _.createContext(null), Ti = /*#__PURE__*/ _.createContext(null), Ei = () => _.useContext(wi)?.id || null, Di = (e) => {
	let t = _.useContext(Ti);
	return e ?? t;
};
function Oi(e) {
	let t = Ir(), n = Di(e), r = Ei();
	return N(() => {
		if (!t) return;
		let e = {
			id: t,
			parentId: r
		};
		return n?.addNode(e), () => {
			n?.removeNode(e);
		};
	}, [
		n,
		t,
		r
	]), t;
}
function ki(e) {
	let { children: t, id: n } = e, r = Ei();
	return /*#__PURE__*/ (0, Y.jsx)(wi.Provider, {
		value: _.useMemo(() => ({
			id: n,
			parentId: r
		}), [n, r]),
		children: t
	});
}
function Ai(e) {
	let { children: t, externalTree: n } = e, r = y(() => n ?? new Ci()).current;
	return /*#__PURE__*/ (0, Y.jsx)(Ti.Provider, {
		value: r,
		children: t
	});
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/utils/resolveRef.mjs
function ji(e) {
	return e == null ? e : "current" in e ? e.current : e;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/components/FloatingFocusManager.mjs
function Mi(e, t) {
	let n = W(Fe(e));
	return e instanceof n.KeyboardEvent ? "keyboard" : e instanceof n.FocusEvent ? t || "keyboard" : "pointerType" in e ? e.pointerType || (H(e) ? "keyboard" : t || "mouse") : "touches" in e ? "touch" : e instanceof n.MouseEvent ? t || (e.detail === 0 ? "keyboard" : "mouse") : "";
}
var Ni = 20, Pi = [];
function Fi() {
	Pi = Pi.filter((e) => e.deref()?.isConnected);
}
function Ii(e) {
	Fi(), e && fe(e) !== "body" && (Pi.push(new WeakRef(e)), Pi.length > Ni && (Pi = Pi.slice(-20)));
}
function Li() {
	return Fi(), Pi[Pi.length - 1]?.deref();
}
function Ri(e) {
	return e ? or(e) ? e : cr(e)[0] || e : null;
}
function zi(e) {
	if (e.hasAttribute("tabindex") && !e.hasAttribute("data-tabindex") || !e.getAttribute("role")?.includes("dialog")) return;
	let t = sr(e).filter((e) => {
		let t = e.getAttribute("data-tabindex") || "";
		return or(e) || e.hasAttribute("data-tabindex") && !t.startsWith("-");
	}), n = e.getAttribute("tabindex");
	t.length === 0 ? n !== "0" && (e.setAttribute("tabindex", "0"), e.setAttribute("data-tabindex", "0")) : (n !== "-1" || e.hasAttribute("data-tabindex") && e.getAttribute("data-tabindex") !== "-1") && (e.setAttribute("tabindex", "-1"), e.setAttribute("data-tabindex", "-1"));
}
function Bi(e) {
	let { context: t, children: n, disabled: r = !1, initialFocus: i = !0, returnFocus: a = !0, explicitReturnFocus: o, restoreFocus: s = !1, modal: c = !0, closeOnFocusOut: l = !0, openInteractionType: u = "", nextFocusableElement: d, previousFocusableElement: f, beforeContentFocusGuardRef: p, externalTree: m, getInsideElements: h } = e, g = t.useState("open"), v = t.useState("domReferenceElement"), y = t.useState("floatingElement"), { events: b, dataRef: x } = t.context, S = Z(() => x.current.floatingContext?.nodeId), C = i === !1, w = pt(v) && C, T = Xt(i), E = Xt(a), D = Xt(o), O = Xt(u), k = Xt(g), A = Di(m), j = vi(), M = _.useRef(!1), P = _.useRef(!1), F = _.useRef(!1), I = _.useRef(null), L = _.useRef(""), te = _.useRef(""), R = _.useRef(null), ne = _.useRef(null), re = Wt(R, p, j?.beforeInsideRef), z = Wt(ne, j?.afterInsideRef), B = ee(), ie = ee(), oe = sn(), se = j != null, V = ht(y), le = Z((e = V) => e ? cr(e) : []), ue = Z(() => h?.().filter((e) => e != null) ?? []);
	_.useEffect(() => {
		if (r || !c) return;
		function e(e) {
			e.key === "Tab" && q(V, Ne(cn(V))) && le().length === 0 && !w && ce(e);
		}
		return X(cn(V), "keydown", e);
	}, [
		r,
		V,
		c,
		w,
		le
	]), _.useEffect(() => {
		if (r || !g) return;
		let e = cn(V);
		function t() {
			F.current = !1;
		}
		function n(e) {
			let t = Fe(e), n = ue(), r = q(y, t) || q(v, t) || q(j?.portalNode, t) || n.some((e) => e === t || q(e, t));
			F.current = !r, te.current = e.pointerType || "keyboard", Pe(t, "[data-base-ui-click-trigger]") && (P.current = !0, ie.start(0, () => {
				P.current = !1;
			}));
		}
		function i() {
			te.current = "keyboard";
		}
		return Ut(X(e, "pointerdown", n, !0), X(e, "pointerup", t, !0), X(e, "pointercancel", t, !0), X(e, "keydown", i, !0), t);
	}, [
		r,
		y,
		v,
		V,
		g,
		j,
		ie,
		ue
	]), _.useEffect(() => {
		if (r || !l) return;
		let e = cn(V);
		function n() {
			P.current = !0, ie.start(0, () => {
				P.current = !1;
			});
		}
		function i(e) {
			let t = Fe(e);
			or(t) && (I.current = t);
		}
		function a(n) {
			let r = n.relatedTarget, i = n.currentTarget, a = Fe(n);
			c && r == null && a != null && q(y, a) && Ii(a), queueMicrotask(() => {
				let o = S(), l = t.context.triggerElements, u = ue(), p = r?.hasAttribute(vr("focus-guard")) && [
					R.current,
					ne.current,
					j?.beforeInsideRef.current,
					j?.afterInsideRef.current,
					j?.beforeOutsideRef.current,
					j?.afterOutsideRef.current,
					ji(f),
					ji(d)
				].includes(r), m = !(q(v, r) || q(y, r) || q(r, y) || q(j?.portalNode, r) || u.some((e) => e === r || q(e, r)) || l.hasMatchingElement((e) => q(e, r)) || p || A && (gr(A.nodesRef.current, o).find((e) => q(e.context?.elements.floating, r) || q(e.context?.elements.domReference, r)) || _r(A.nodesRef.current, o).find((e) => [e.context?.elements.floating, ht(e.context?.elements.floating)].includes(r) || e.context?.elements.domReference === r)));
				if (i === v && V && zi(V), s && i !== v && !Kn(a) && Ne(e) === e.body) {
					if (me(V) && (V.focus(), s === "popup")) {
						oe.request(() => {
							V.focus();
						});
						return;
					}
					let e = le(), t = I.current, n = (t && e.includes(t) ? t : null) || e[e.length - 1] || V;
					me(n) && n.focus();
				}
				if (x.current.insideReactTree) {
					x.current.insideReactTree = !1;
					return;
				}
				(w || !c) && r && m && !P.current && (w || r !== Li()) && (M.current = !0, t.setOpen(!1, J(kt, n)));
			});
		}
		function o() {
			F.current || (x.current.insideReactTree = !0, B.start(0, () => {
				x.current.insideReactTree = !1;
			}));
		}
		let u = me(v) ? v : null;
		if (y || u) return Ut(u && X(u, "focusout", a), u && X(u, "pointerdown", n), y && X(y, "focusin", i), y && X(y, "focusout", a), y && j && X(y, "focusout", o, !0));
	}, [
		r,
		v,
		y,
		V,
		c,
		A,
		j,
		t,
		l,
		s,
		le,
		w,
		S,
		x,
		B,
		ie,
		oe,
		d,
		f,
		ue
	]), _.useEffect(() => {
		if (r || !y || !g) return;
		let e = Array.from(j?.portalNode?.querySelectorAll(`[${vr("portal")}]`) || []), t = (A ? _r(A.nodesRef.current, S()) : []).find((e) => pt(e.context?.elements.domReference || null))?.context?.elements.domReference, n = jr([
			y,
			...e,
			R.current,
			ne.current,
			j?.beforeOutsideRef.current,
			j?.afterOutsideRef.current,
			...ue(),
			t,
			ji(f),
			ji(d),
			w ? v : null
		].filter((e) => e != null), {
			ariaHidden: c || w,
			mark: !1
		}), i = jr([y, ...e].filter((e) => e != null));
		return () => {
			i(), n();
		};
	}, [
		g,
		r,
		v,
		y,
		c,
		j,
		w,
		A,
		S,
		d,
		f,
		ue
	]), N(() => {
		if (!g || r || !me(V)) return;
		L.current = "", te.current = "";
		let e = cn(V), t = Ne(e);
		queueMicrotask(() => {
			let n = T.current, r = typeof n == "function" ? n(O.current || "") : n;
			if (r === void 0 || r === !1 || q(V, t)) return;
			let i = null, a = () => (i ??= le(V), i[0] || V), o;
			o = r === !0 || r === null ? a() : ji(r), o ||= a();
			let s = q(V, Ne(e)), c = x.current.openEvent, l = c?.type === "mousedown" && H(c);
			br(o, {
				sync: l,
				preventScroll: o === V,
				shouldFocus() {
					if (!k.current) return !1;
					if (s) return !0;
					let t = Ne(e);
					return !(t !== o && q(V, t));
				}
			});
		});
	}, [
		r,
		g,
		V,
		le,
		T,
		O,
		k,
		x
	]);
	let de = _.useRef(null);
	N(() => {
		if (r || !V) {
			de.current = null;
			return;
		}
		de.current &&= (de.current.cancelled = !0, null);
		let e = cn(V), t = Ne(e), n = O.current == null;
		Ii(t);
		function i(e) {
			if (e.open || (L.current = Mi(e.nativeEvent, te.current)), (e.reason === "focus-out" && e.triggerElement?.hasAttribute(vr("focus-guard")) || e.reason === "trigger-hover" && e.nativeEvent.type === "mouseleave") && (M.current = !0), e.reason === "outside-press") {
				if (e.nested) M.current = !1;
				else if (H(e.nativeEvent) || U(e.nativeEvent)) M.current = !1;
				else {
					let e = !1;
					cn(V).createElement("div").focus({ get preventScroll() {
						return e = !0, !1;
					} }), e ? M.current = !1 : M.current = !0;
				}
			}
		}
		b.on("openchange", i);
		function a(e) {
			let r = E.current, i = typeof r == "function" ? r(e) : r;
			if (i === void 0 || i === !1) return null;
			i === null && (i = !0);
			let a = v?.isConnected ? v : null, o = t?.isConnected && fe(t) !== "body" ? t : null, s = n ? o || a : a || o;
			return s ||= Li() || null, typeof i == "boolean" ? s : ji(i) || s || null;
		}
		return () => {
			b.off("openchange", i);
			let t = Ne(e), n = ue(), r = q(y, t) || n.some((e) => e === t || q(e, t)) || A && gr(A.nodesRef.current, S(), !1).some((e) => q(e.context?.elements.floating, t)), o = E.current, s = L.current, c = a(s), l = { cancelled: !1 };
			de.current = l, queueMicrotask(() => {
				de.current === l && (de.current = null);
				let n = Ri(c), i = D.current ?? typeof o != "boolean";
				if (!l.cancelled && o && !M.current && me(n) && (i || n === t || t === e.body || r)) {
					let e = { preventScroll: !0 };
					s === "keyboard" && (e.focusVisible = !0), n.focus(e);
				}
				M.current = !1;
			});
		};
	}, [
		r,
		y,
		V,
		E,
		D,
		O,
		b,
		A,
		v,
		S,
		ue
	]), N(() => {
		if (!ae || g || !y) return;
		let e = Ne(cn(y));
		me(e) && dt(e) && q(y, e) && e.blur();
	}, [g, y]), N(() => {
		if (!r && j) return j.setFocusManagerState({
			modal: c,
			closeOnFocusOut: l,
			open: g,
			onOpenChange: t.setOpen,
			domReference: v
		}), () => {
			j.setFocusManagerState(null);
		};
	}, [
		r,
		j,
		c,
		g,
		t,
		l,
		v
	]), N(() => {
		if (!r && V) return zi(V), () => {
			queueMicrotask(Fi);
		};
	}, [r, V]);
	let W = !r && (!c || !w) && (se || c);
	return /*#__PURE__*/ (0, Y.jsxs)(_.Fragment, { children: [
		W && /*#__PURE__*/ (0, Y.jsx)(dn, {
			"data-type": "inside",
			ref: re,
			onFocus: (e) => {
				if (c) {
					let e = le();
					br(e[e.length - 1]);
				} else j?.portalNode && (M.current = !1, pr(e, j.portalNode) ? ur(v)?.focus() : ji(f ?? j.beforeOutsideRef)?.focus());
			}
		}),
		n,
		W && /*#__PURE__*/ (0, Y.jsx)(dn, {
			"data-type": "inside",
			ref: z,
			onFocus: (e) => {
				c ? br(le()[0]) : j?.portalNode && (l && (M.current = !0), pr(e, j.portalNode) ? dr(v)?.focus() : ji(d ?? j.afterOutsideRef)?.focus());
			}
		})
	] });
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/hooks/useClick.mjs
function Vi(e, t = {}) {
	let { enabled: n = !0, event: r = "click", toggle: i = !0, ignoreMouse: a = !1, stickIfOpen: o = !0, touchOpenDelay: s = 0, reason: c = Ct } = t, l = e.context.dataRef, u = _.useRef(void 0), d = sn(), f = ee(), p = _.useMemo(() => {
		function t(t, n, r, i) {
			let a = J(c, n, r);
			t && i === "touch" && s > 0 ? f.start(s, () => {
				e.setOpen(!0, a);
			}) : e.setOpen(t, a);
		}
		function n(t, n, r) {
			let a = l.current.openEvent, s = e.select("domReferenceElement") !== n;
			return t && s || !t || !i ? !0 : a && (typeof o == "function" ? o() : o) ? !r(a.type) : !1;
		}
		return {
			onPointerDown(e) {
				u.current = le(e.pointerType, !0) && U(e.nativeEvent) ? "virtual" : e.pointerType;
			},
			onMouseDown(i) {
				let o = u.current, s = i.nativeEvent, c = e.select("open");
				if (i.button !== 0 || r === "click" || le(o, !0) && a) return;
				let l = n(c, i.currentTarget, (e) => e === "click" || e === "mousedown"), f = Fe(s), p = dt(f);
				if (p || o === "virtual") {
					t(l, s, p ? f : i.currentTarget, o);
					return;
				}
				let m = i.currentTarget;
				d.request(() => {
					t(l, s, m, o);
				});
			},
			onClick(i) {
				if (r === "mousedown-only") return;
				let o = u.current;
				if (r === "mousedown" && o) {
					u.current = void 0;
					return;
				}
				le(o, !0) && a || t(n(e.select("open"), i.currentTarget, (e) => e === "click" || e === "mousedown" || e === "keydown" || e === "keyup"), i.nativeEvent, i.currentTarget, o);
			},
			onKeyDown() {
				u.current = void 0;
			}
		};
	}, [
		l,
		r,
		a,
		c,
		e,
		o,
		i,
		d,
		f,
		s
	]);
	return _.useMemo(() => n ? { reference: p } : k, [n, p]);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/hooks/useClientPoint.mjs
function Hi(e, t) {
	let n = null, r = null, i = !1;
	return {
		contextElement: e || void 0,
		getBoundingClientRect() {
			let a = e?.getBoundingClientRect() || {
				width: 0,
				height: 0,
				x: 0,
				y: 0
			}, o = t.axis === "x" || t.axis === "both", s = t.axis === "y" || t.axis === "both", c = ["mouseenter", "mousemove"].includes(t.dataRef.current.openEvent?.type || "") && t.pointerType !== "touch", l = t.axis === "y" ? a.width : 0, u = t.axis === "x" ? a.height : 0, d = a.x, f = a.y;
			return n == null && t.x && o && (n = a.x - t.x), r == null && t.y && s && (r = a.y - t.y), d -= n || 0, f -= r || 0, (!i || c) && (d = o && t.x != null ? t.x : d, f = s && t.y != null ? t.y : f), i = !0, {
				width: l,
				height: u,
				x: d,
				y: f,
				top: f,
				right: d + l,
				bottom: f + u,
				left: d
			};
		}
	};
}
function Ui(e) {
	return e != null && e.clientX != null;
}
function Wi(e, t = {}) {
	let { enabled: n = !0, axis: r = "both" } = t, i = e.useState("open"), a = e.useState("floatingElement"), o = e.useState("domReferenceElement"), s = e.context.dataRef, c = _.useRef(!1), l = _.useRef(null), [u, d] = _.useState(), [f, p] = _.useState([]), m = Z((t) => {
		e.set("positionReference", t);
	}), h = Z((t, n, i) => {
		c.current || (!s.current.openEvent || Ui(s.current.openEvent)) && e.set("positionReference", Hi(i ?? o, {
			x: t,
			y: n,
			axis: r,
			dataRef: s,
			pointerType: u
		}));
	}), g = Z((e) => {
		i ? l.current || (h(e.clientX, e.clientY, e.currentTarget), p([])) : h(e.clientX, e.clientY, e.currentTarget);
	}), v = le(u) ? a : i;
	_.useEffect(() => {
		if (!n) {
			m(o);
			return;
		}
		if (!v) return;
		function e() {
			l.current?.(), l.current = null;
		}
		let t = W(a);
		function r(t) {
			let n = Fe(t);
			q(a, n) ? e() : h(t.clientX, t.clientY);
		}
		return !s.current.openEvent || Ui(s.current.openEvent) ? l.current = X(t, "mousemove", r) : m(o), e;
	}, [
		v,
		n,
		a,
		s,
		o,
		e,
		h,
		m,
		f
	]), _.useEffect(() => () => {
		e.set("positionReference", null);
	}, [e]), _.useEffect(() => {
		n && !a && (c.current = !1);
	}, [n, a]), _.useEffect(() => {
		!n && i && (c.current = !0);
	}, [n, i]);
	let y = _.useMemo(() => {
		function e(e) {
			d(e.pointerType);
		}
		return {
			onPointerDown: e,
			onPointerEnter: e,
			onMouseMove: g,
			onMouseEnter: g
		};
	}, [g]);
	return _.useMemo(() => n ? {
		reference: y,
		trigger: y
	} : {}, [n, y]);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/hooks/useDismiss.mjs
function Gi() {
	return !1;
}
function Ki(e) {
	return {
		escapeKey: typeof e == "boolean" ? e : e?.escapeKey ?? !1,
		outsidePress: typeof e == "boolean" ? e : e?.outsidePress ?? !0
	};
}
function Q(e, t = {}) {
	let { enabled: n = !0, escapeKey: r = !0, outsidePress: i = !0, outsidePressEvent: a = "sloppy", referencePress: o = Gi, bubbles: s, externalTree: c } = t, l = e.useState("open"), u = e.useState("floatingElement"), { dataRef: d, events: f } = e.context, p = Di(c), m = Z(typeof i == "function" ? i : () => !1), h = typeof i == "function" ? m : i, g = h !== !1, v = Z(() => a), { escapeKey: y, outsidePress: b } = Ki(s), x = _.useRef(!1), S = _.useRef(!1), C = _.useRef(!1), w = _.useRef(!1), T = _.useRef(!1), E = _.useRef(""), D = _.useRef(null), O = ee(), k = ee(), A = ee(), j = Z(() => {
		k.clear(), d.current.insideReactTree = !1;
	}), N = Z((e) => {
		let t = d.current.floatingContext?.nodeId;
		return (p ? gr(p.nodesRef.current, t) : []).some((t) => t.context?.open && !t.context.dataRef.current[e]);
	}), P = Z((t) => lt(t, e.select("floatingElement")) || lt(t, e.select("domReferenceElement"))), F = Z((t) => {
		o() && e.setOpen(!1, J(Ct, t.nativeEvent));
	}), I = Z((t) => {
		if (!l || !n || !r || t.key !== "Escape") return;
		let i = V(t) ? t.nativeEvent : t;
		if (T.current || i.isComposing || !y && N("__escapeKeyBubbles")) return;
		let a = J(At, i);
		e.setOpen(!1, a), a.isCanceled || t.preventDefault(), !y && !a.isPropagationAllowed && t.stopPropagation();
	}), L = Z(() => {
		d.current.insideReactTree = !0, k.start(0, j);
	}), te = Z((t) => {
		if (!l || !n || t.button !== 0) return;
		let r = Fe(t.nativeEvent);
		q(e.select("floatingElement"), r) && (x.current || (x.current = !0, S.current = !1));
	}), R = Z((e) => {
		l && n && (e.defaultPrevented || e.nativeEvent.defaultPrevented) && x.current && (S.current = !0);
	});
	_.useEffect(() => {
		function e(e) {
			e.open || (w.current = !1);
		}
		return f.on("openchange", e), () => {
			f.off("openchange", e);
		};
	}, [f]), _.useEffect(() => j, [j]), _.useEffect(() => {
		if (!l || !n) return l || (w.current = !1, T.current = !1, E.current = "", D.current = null), j;
		d.current.__escapeKeyBubbles = y, d.current.__outsidePressBubbles = b;
		let t = new M(), i = cn(u);
		function a() {
			A.clear(), T.current = !0;
		}
		function o() {
			T.current = !0, A.start(ae ? 5 : 0, () => {
				T.current = !1;
			});
		}
		function s() {
			C.current = !0, t.start(0, () => {
				C.current = !1;
			});
		}
		function c() {
			x.current = !1, S.current = !1;
		}
		function f() {
			let e = E.current, t = e === "pen" || !e ? "mouse" : e, n = v(), r = typeof n == "function" ? n() : n;
			return typeof r == "string" ? r : r[t];
		}
		function m(e) {
			let t = f();
			return t === "intentional" && e.type !== "click" || t === "sloppy" && e.type === "click";
		}
		function _(e) {
			let t = d.current.floatingContext?.nodeId, n = p && gr(p.nodesRef.current, t).some((t) => lt(e, t.context?.elements.floating));
			return P(e) || n;
		}
		function k(n) {
			if (m(n)) {
				n.type !== "click" && !P(n) && (t.clear(), C.current = !1), j();
				return;
			}
			if (d.current.insideReactTree) {
				j();
				return;
			}
			let r = Fe(n), i = `[${vr("inert")}]`, a = K(r) ? r.getRootNode() : null, o = Array.from((he(a) ? a : cn(e.select("floatingElement"))).querySelectorAll(i)), s = e.context.triggerElements;
			if (r && (s.hasElement(r) || s.hasMatchingElement((e) => q(e, r)))) return;
			let c = K(r) ? r : null;
			for (; c && !Ee(c);) {
				let e = ke(c);
				if (Ee(e) || !K(e)) break;
				c = e;
			}
			if (!(o.length && K(r) && !ut(r) && !q(r, e.select("floatingElement")) && o.every((e) => !q(c, e)))) {
				if (me(r) && !("touches" in n)) {
					let e = Ee(r), t = De(r), i = /auto|scroll/, a = e || i.test(t.overflowX), o = e || i.test(t.overflowY), s = a && r.clientWidth > 0 && r.scrollWidth > r.clientWidth, c = o && r.clientHeight > 0 && r.scrollHeight > r.clientHeight, l = t.direction === "rtl", u = c && (l ? n.offsetX <= r.offsetWidth - r.clientWidth : n.offsetX > r.clientWidth), d = s && n.offsetY > r.clientHeight;
					if (u || d) return;
				}
				if (!_(n)) {
					if (f() === "intentional") {
						if (n.detail !== 0 && !H(n) && !w.current) return;
						if (C.current) {
							t.clear(), C.current = !1;
							return;
						}
					}
					(typeof h != "function" || h(n)) && (N("__outsidePressBubbles") || (e.setOpen(!1, J(Et, n)), j()));
				}
			}
		}
		function ee(t) {
			f() === "sloppy" && t.pointerType !== "touch" && e.select("open") && n && !P(t) && k(t);
		}
		function F(t) {
			if (f() !== "sloppy" || !e.select("open") || !n || P(t)) return;
			let r = t.touches[0];
			r && (D.current = {
				startTime: Date.now(),
				startX: r.clientX,
				startY: r.clientY,
				dismissOnTouchEnd: !1,
				dismissOnMouseDown: !0
			}, O.start(1e3, () => {
				D.current && (D.current.dismissOnTouchEnd = !1, D.current.dismissOnMouseDown = !1);
			}));
		}
		function L(e, t) {
			let n = Fe(e);
			if (!n) return;
			let r = X(n, e.type, () => {
				t(e), r();
			});
		}
		function te(e) {
			E.current = "touch", L(e, F);
		}
		function R(e) {
			O.clear(), e.type === "pointerdown" && (e.button === 0 && (w.current = !0), E.current = e.pointerType), (e.type !== "mousedown" || !D.current || D.current.dismissOnMouseDown) && L(e, (e) => {
				e.type === "pointerdown" ? ee(e) : k(e);
			});
		}
		function ne(e) {
			if (e.type === "pointercancel" && (w.current = !1), !x.current) return;
			let n = S.current;
			if (c(), f() === "intentional") {
				if (e.type === "pointercancel") {
					n && s();
					return;
				}
				if (!_(e)) {
					if (n) {
						s();
						return;
					}
					(typeof h != "function" || h(e)) && (t.clear(), C.current = !0, j());
				}
			}
		}
		function re(e) {
			if (f() !== "sloppy" || !D.current || P(e)) return;
			let t = e.touches[0];
			if (!t) return;
			let n = Math.abs(t.clientX - D.current.startX), r = Math.abs(t.clientY - D.current.startY), i = Math.sqrt(n * n + r * r);
			i > 5 && (D.current.dismissOnTouchEnd = !0), i > 10 && (k(e), O.clear(), D.current = null);
		}
		function z(e) {
			L(e, re);
		}
		function B(e) {
			f() === "sloppy" && D.current && !P(e) && (D.current.dismissOnTouchEnd && k(e), O.clear(), D.current = null);
		}
		function ie(e) {
			L(e, B);
		}
		let oe = Ut(r && Ut(X(i, "keydown", I), X(i, "compositionstart", a), X(i, "compositionend", o)), g && Ut(X(i, "click", R, !0), X(i, "pointerdown", R, !0), X(i, "pointerup", ne, !0), X(i, "pointercancel", ne, !0), X(i, "mousedown", R, !0), X(i, "mouseup", ne, !0), X(i, "touchstart", te, {
			capture: !0,
			passive: !0
		}), X(i, "touchmove", z, {
			capture: !0,
			passive: !0
		}), X(i, "touchend", ie, {
			capture: !0,
			passive: !0
		})));
		return () => {
			oe(), t.clear(), c(), C.current = !1;
		};
	}, [
		d,
		u,
		r,
		g,
		h,
		l,
		n,
		y,
		b,
		I,
		j,
		v,
		N,
		P,
		p,
		e,
		O,
		A
	]);
	let ne = _.useMemo(() => ({
		onKeyDown: I,
		onPointerDown: F,
		onClick: F
	}), [I, F]), re = _.useMemo(() => ({
		onKeyDown: I,
		onPointerDown: R,
		onMouseDown: R,
		onClickCapture: L,
		onMouseDownCapture(e) {
			L(), te(e);
		},
		onPointerDownCapture(e) {
			L(), te(e);
		},
		onMouseUpCapture: L,
		onTouchEndCapture: L,
		onTouchMoveCapture: L
	}), [
		I,
		L,
		te,
		R
	]);
	return _.useMemo(() => n ? {
		reference: ne,
		floating: re,
		trigger: ne
	} : {}, [
		n,
		ne,
		re
	]);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.5.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/formatErrorMessage.mjs
function qi(e, t) {
	return function(n, ...r) {
		let i = new URL(e);
		return i.searchParams.set("code", n.toString()), r.forEach((e) => i.searchParams.append("args[]", e)), `${t} error #${n}; visit ${i} for the full message.`;
	};
}
var Ji = qi("https://base-ui.com/production-error", "Base UI");
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/hooks/useSyncedFloatingRootContext.mjs
function Yi(e) {
	let { popupStore: t, treatPopupAsFloatingElement: n = !1, floatingRootContext: r, floatingId: i, nested: a, onOpenChange: o } = e, s = t.useState("open"), c = t.useState("activeTriggerElement"), l = t.useState(n ? "popupElement" : "positionerElement"), u = o;
	return t.useSyncedValue("floatingId", i), N(() => {
		let e = {
			open: s,
			floatingId: i,
			referenceElement: c,
			floatingElement: l
		};
		K(c) && (e.domReferenceElement = c), r.state.positionReference === r.state.referenceElement && (e.positionReference = c), r.update(e);
	}, [
		s,
		i,
		c,
		l,
		r
	]), r.context.onOpenChange = u, r.context.nested = a, r;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/useTransitionStatus.mjs
function Xi(e, t = !1, n = !1, r = !1) {
	let [i, a] = _.useState(e && t ? "idle" : void 0), [o, s] = _.useState(e && !r);
	return e && !o && (s(!0), a("starting")), !e && o && i !== "ending" && !n && a("ending"), !e && !o && i === "ending" && a(void 0), N(() => {
		if (!e && o && i !== "ending" && n) {
			let e = on.request(() => {
				a("ending");
			});
			return () => {
				on.cancel(e);
			};
		}
	}, [
		e,
		o,
		i,
		n
	]), N(() => {
		if (!e || t || i === void 0) return;
		let n = on.request(() => {
			a(void 0);
		});
		return () => {
			on.cancel(n);
		};
	}, [
		t,
		e,
		i
	]), N(() => {
		if (!e || !t) return;
		e && o && i !== "idle" && a("starting");
		let n = on.request(() => {
			a("idle");
		});
		return () => {
			on.cancel(n);
		};
	}, [
		t,
		e,
		o,
		i
	]), {
		mounted: o,
		setMounted: s,
		transitionStatus: i
	};
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/utils/getFiniteAnimations.mjs
function Zi(e, t) {
	return e.getAnimations(t).filter((e) => {
		let t = e.effect?.getTiming();
		return t?.duration !== Infinity && t?.iterations !== Infinity;
	});
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/useAnimationsFinished.mjs
var Qi = null;
function $i(e) {
	if (!Qi) {
		let e = [];
		Qi = e, queueMicrotask(() => {
			Qi = null, gi.flushSync(() => {
				for (let t of e) t();
			});
		});
	}
	Qi.push(e);
}
function ea(e, t = !1, n = !1) {
	let r = sn();
	return Z((i, a = null) => {
		r.cancel();
		let o = ji(e);
		if (o == null) return;
		let s = o, c = () => {
			if (!n) {
				gi.flushSync(i);
				return;
			}
			$i(() => {
				a?.aborted || i();
			});
		};
		if (typeof s.getAnimations != "function" || globalThis.BASE_UI_ANIMATIONS_DISABLED) {
			i();
			return;
		}
		function l() {
			Promise.all(Zi(s).map((e) => e.finished.then(D))).then(() => {
				a?.aborted || c();
			}, () => {
				if (!a?.aborted) {
					if (Zi(s).some((e) => e.pending || e.playState !== "finished")) {
						l();
						return;
					}
					c();
				}
			});
		}
		if (t) {
			let e = He;
			if (!s.hasAttribute(e)) {
				r.request(l);
				return;
			}
			let t = new MutationObserver(() => {
				s.hasAttribute(e) || (t.disconnect(), l());
			});
			t.observe(s, {
				attributes: !0,
				attributeFilter: [e]
			}), a?.addEventListener("abort", () => t.disconnect(), { once: !0 });
			return;
		}
		r.request(l);
	});
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/useOpenChangeComplete.mjs
function ta(e) {
	let { enabled: t = !0, open: n, ref: r, batch: i = !1, onComplete: a } = e, o = Z(a), s = ea(r, n, i);
	_.useEffect(() => {
		if (!t) return;
		let e = new AbortController();
		return s(o, e.signal), () => {
			e.abort();
		};
	}, [
		t,
		n,
		o,
		s
	]);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/useUnmountAfterClose.mjs
function na(e) {
	let { open: t, ref: n, preventUnmountOnClose: r, setPreventUnmountOnClose: i, onUnmount: a, animateInitialOpen: o } = e, s = Z(i), { mounted: c, setMounted: l, transitionStatus: u } = Xi(t, !1, !1, o), d = !t && r;
	N(() => {
		t && s(!1);
	}, [t, s]);
	let f = _.useRef(c), p = _.useRef(!1), m = Mr(), h = () => {
		f.current = !1, l(!1), a();
	};
	N(() => {
		f.current = c, p.current && (p.current = !1, !t && c && h());
	});
	let g = Z(() => {
		if (f.current) {
			if (t) {
				p.current = !0, m();
				return;
			}
			h();
		}
	});
	return ta({
		enabled: c && !t && !d,
		open: t,
		ref: n,
		onComplete() {
			t || g();
		}
	}), {
		mounted: c,
		transitionStatus: u,
		preventUnmountingOnClose: d,
		forceUnmount: g
	};
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/utils/popups/popupStoreUtils.mjs
var ra = {
	tabIndex: -1,
	[Ie]: ""
};
function ia(e) {
	return (t) => t !== "touch" || e.current;
}
function aa(e, t = !1) {
	let n = Ir(), r = Ei() != null, i = y(() => e(n, r)).current;
	return Yi({
		popupStore: i,
		treatPopupAsFloatingElement: t,
		floatingRootContext: i.state.floatingRootContext,
		floatingId: n,
		nested: r,
		onOpenChange: i.setOpen
	}), i;
}
function oa({ handle: e, store: t }) {
	return N(() => e.attachStore(t), [e, t]), null;
}
function sa(e) {
	let t = e.context.triggerElements.size;
	e.select("open") && e.state.triggerCount !== t && e.set("triggerCount", t);
}
function ca(e, t) {
	let n = _.useRef(null);
	return Z((r) => {
		let i = n.current;
		if (i !== null) {
			if (i.element === r && i.store === t && i.id === e) return;
			n.current = null;
			let a = i.store;
			a.context.triggerElements.getById(i.id) === i.element && (a.context.triggerElements.delete(i.id), sa(a));
		}
		r !== null && e !== void 0 && (n.current = {
			store: t,
			id: e,
			element: r
		}, t.context.triggerElements.add(e, r), sa(t));
	});
}
function la(e, t, n, r = !1) {
	let i = e.preventUnmountingOnClose;
	t ? i = !1 : r && (i = !0);
	let a = n?.id ?? null, o = e.activeTriggerId, s = e.activeTriggerElement;
	return (a || t) && (o = a, s = n ?? null), {
		open: t,
		preventUnmountingOnClose: i,
		activeTriggerId: o,
		activeTriggerElement: s,
		openedWithoutTrigger: t ? n == null : e.openedWithoutTrigger
	};
}
function ua(e) {
	let t = !1;
	return e.preventUnmountOnClose = () => {
		t = !0;
	}, () => t;
}
function da(e, t, n, r = {}) {
	let i = n.reason, a = i === wt, o = t && i === "trigger-focus", s = !t && (i === "trigger-press" || i === "escape-key"), c = ua(n);
	if (e.context.onOpenChange?.(t, n), n.isCanceled) return;
	r.onBeforeDispatch?.(), e.state.floatingRootContext.dispatchOpenChange(t, n);
	let l = () => {
		let i = la(e.state, t, n.trigger, c()), l = {
			...r.extraState,
			...i
		};
		o ? l.instantType = "focus" : s ? l.instantType = "dismiss" : a && (l.instantType = void 0), e.update(l);
	};
	a ? gi.flushSync(l) : l();
}
function fa(e, t, n, r) {
	let i = n.useState("isMountedByTrigger", e), a = ca(e, n), o = Z((t) => {
		let i = n.select("open"), a = n.select("activeTriggerId");
		if (a === e) {
			let e = {
				activeTriggerElement: t,
				...i ? r : null
			};
			n.update(e);
			return;
		}
		if (a == null && i && !n.state.openedWithoutTrigger) {
			let i = {
				activeTriggerId: e ?? null,
				activeTriggerElement: t,
				...r
			};
			n.update(i);
		}
	}), s = Z((e) => {
		a(e), e && o(e);
	});
	return N(() => (s(t.current), () => s(null)), [
		s,
		t,
		n,
		e
	]), N(() => {
		if (i) {
			let e = {
				activeTriggerElement: t.current,
				...r
			};
			n.update(e);
		}
	}, [
		i,
		n,
		t,
		...Object.values(r)
	]), {
		registerTrigger: s,
		isMountedByThisTrigger: i
	};
}
function pa(e, t = {}) {
	let { closeOnActiveTriggerUnmount: n = !1 } = t, r = _.useRef(null), i = e.useState("open");
	N(() => {
		if (!i) {
			r.current = null, e.state.triggerCount !== 0 && e.set("triggerCount", 0), e.state.openedWithoutTrigger && e.set("openedWithoutTrigger", !1);
			return;
		}
		let t = e.context.triggerElements.size, a = {};
		e.state.triggerCount !== t && (a.triggerCount = t);
		let o = e.select("activeTriggerId"), s = null;
		if (o) {
			let t = e.context.triggerElements.getById(o);
			if (t) r.current = o, t !== e.state.activeTriggerElement && (a.activeTriggerElement = t);
			else {
				for (let [t, n] of e.context.triggerElements.entries()) if (n === e.state.activeTriggerElement) {
					a.activeTriggerId = t, a.activeTriggerElement = n, r.current = t;
					break;
				}
				a.activeTriggerId === void 0 && (r.current === o ? s = o : r.current = null);
			}
		} else r.current = null;
		if (!s && !o && !e.state.openedWithoutTrigger && t === 1) {
			let t = e.context.triggerElements.entries().next();
			if (!t.done) {
				let [e, n] = t.value;
				a.activeTriggerId = e, a.activeTriggerElement = n, r.current = e;
			}
		}
		(a.triggerCount !== void 0 || a.activeTriggerId !== void 0 || a.activeTriggerElement !== void 0) && e.update(a), s && n && queueMicrotask(() => {
			if (e.select("open") && e.select("activeTriggerId") === s && !e.context.triggerElements.getById(s)) {
				let t = J(St);
				e.setOpen(!1, t), t.isCanceled || e.update({
					activeTriggerId: null,
					activeTriggerElement: null
				});
			}
		});
	}, [
		i,
		e,
		e.useState("triggerCount"),
		e.useState("activeTriggerId"),
		e.useState("activeTriggerElement"),
		n
	]);
}
function ma(e, t, n, r) {
	let { mounted: i, transitionStatus: a, forceUnmount: o } = na({
		open: e,
		ref: t.context.popupRef,
		preventUnmountOnClose: t.useState("preventUnmountingOnClose"),
		setPreventUnmountOnClose: (e) => t.set("preventUnmountingOnClose", e),
		animateInitialOpen: r,
		onUnmount() {
			t.update({
				activeTriggerId: null,
				activeTriggerElement: null,
				mounted: !1,
				preventUnmountingOnClose: !1
			}), n?.(), t.context.onOpenChangeComplete?.(!1);
		}
	});
	return y(() => (t.set("mounted", i), null)), t.useSyncedValues({
		mounted: i,
		transitionStatus: a
	}), {
		forceUnmount: o,
		transitionStatus: a
	};
}
function ha(e, t) {
	e.useSyncedValues(t), N(() => () => {
		e.update({
			activeTriggerProps: k,
			inactiveTriggerProps: k,
			popupProps: k
		});
	}, [e]);
}
function ga(e, t) {
	N(() => {
		!t && e.state.openMethod !== null && e.set("openMethod", null);
	}, [t, e]), N(() => () => {
		e.state.openMethod !== null && e.set("openMethod", null);
	}, [e]);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/utils/popups/popupTriggerMap.mjs
var _a = class {
	idMap = /* @__PURE__ */ new Map();
	add(e, t) {
		this.idMap.set(e, t);
	}
	delete(e) {
		this.idMap.delete(e);
	}
	hasElement(e) {
		for (let t of this.idMap.values()) if (t === e) return !0;
		return !1;
	}
	hasMatchingElement(e) {
		for (let t of this.idMap.values()) if (e(t)) return !0;
		return !1;
	}
	getById(e) {
		return this.idMap.get(e);
	}
	entries() {
		return this.idMap.entries();
	}
	elements() {
		return this.idMap.values();
	}
	get size() {
		return this.idMap.size;
	}
}, va = /* @__PURE__ */ o(((e) => {
	var t = u();
	function n(e, t) {
		return e === t && (e !== 0 || 1 / e == 1 / t) || e !== e && t !== t;
	}
	var r = typeof Object.is == "function" ? Object.is : n, i = t.useState, a = t.useEffect, o = t.useLayoutEffect, s = t.useDebugValue;
	function c(e, t) {
		var n = t(), r = i({ inst: {
			value: n,
			getSnapshot: t
		} }), c = r[0].inst, u = r[1];
		return o(function() {
			c.value = n, c.getSnapshot = t, l(c) && u({ inst: c });
		}, [
			e,
			n,
			t
		]), a(function() {
			return l(c) && u({ inst: c }), e(function() {
				l(c) && u({ inst: c });
			});
		}, [e]), s(n), n;
	}
	function l(e) {
		var t = e.getSnapshot;
		e = e.value;
		try {
			var n = t();
			return !r(e, n);
		} catch {
			return !0;
		}
	}
	function d(e, t) {
		return t();
	}
	var f = typeof window > "u" || window.document === void 0 || window.document.createElement === void 0 ? d : c;
	e.useSyncExternalStore = t.useSyncExternalStore === void 0 ? f : t.useSyncExternalStore;
})), ya = /* @__PURE__ */ o(((e, t) => {
	t.exports = va();
})), ba = /* @__PURE__ */ o(((e) => {
	var t = u(), n = ya();
	function r(e, t) {
		return e === t && (e !== 0 || 1 / e == 1 / t) || e !== e && t !== t;
	}
	var i = typeof Object.is == "function" ? Object.is : r, a = n.useSyncExternalStore, o = t.useRef, s = t.useEffect, c = t.useMemo, l = t.useDebugValue;
	e.useSyncExternalStoreWithSelector = function(e, t, n, r, u) {
		var d = o(null);
		if (d.current === null) {
			var f = {
				hasValue: !1,
				value: null
			};
			d.current = f;
		} else f = d.current;
		d = c(function() {
			function e(e) {
				if (!a) {
					if (a = !0, o = e, e = r(e), u !== void 0 && f.hasValue) {
						var t = f.value;
						if (u(t, e)) return s = t;
					}
					return s = e;
				}
				if (t = s, i(o, e)) return t;
				var n = r(e);
				return u !== void 0 && u(t, n) ? (o = e, t) : (o = e, s = n);
			}
			var a = !1, o, s, c = n === void 0 ? null : n;
			return [function() {
				return e(t());
			}, c === null ? void 0 : function() {
				return e(c());
			}];
		}, [
			t,
			n,
			r,
			u
		]);
		var p = a(e, d[0], d[1]);
		return s(function() {
			f.hasValue = !0, f.value = p;
		}, [p]), l(p), p;
	};
})), xa = /* @__PURE__ */ o(((e, t) => {
	t.exports = ba();
})), Sa = ya(), Ca = xa(), wa = Rr(19) ? Da : Oa;
function Ta(e, t, n, r, i) {
	return wa(e, t, n, r, i);
}
function Ea(e, t, n, r, i) {
	let a = _.useCallback(() => t(e.getSnapshot(), n, r, i), [
		e,
		t,
		n,
		r,
		i
	]);
	return (0, Sa.useSyncExternalStore)(e.subscribe, a, a);
}
C({
	before(e) {
		e.syncIndex = 0, e.didInitialize || (e.syncTick = 1, e.syncHooks = [], e.didChangeStore = !0, e.getSnapshot = () => {
			let t = !1;
			for (let n = 0; n < e.syncHooks.length; n += 1) {
				let r = e.syncHooks[n], i = r.selector(r.store.state, r.a1, r.a2, r.a3);
				Object.is(r.value, i) || (t = !0, r.value = i);
			}
			return t && (e.syncTick += 1), e.syncTick;
		});
	},
	after(e) {
		e.syncHooks.length > 0 && (e.didChangeStore && (e.didChangeStore = !1, e.subscribe = (t) => {
			let n = /* @__PURE__ */ new Set();
			for (let t of e.syncHooks) n.add(t.store);
			let r = [];
			for (let e of n) r.push(e.subscribe(t));
			return () => {
				for (let e of r) e();
			};
		}), (0, Sa.useSyncExternalStore)(e.subscribe, e.getSnapshot, e.getSnapshot));
	}
});
function Da(e, t, n, r, i) {
	let a = S();
	if (!a) return Ea(e, t, n, r, i);
	let o = a.syncIndex;
	a.syncIndex += 1;
	let s;
	return a.didInitialize ? (s = a.syncHooks[o], (s.store !== e || s.selector !== t || !Object.is(s.a1, n) || !Object.is(s.a2, r) || !Object.is(s.a3, i)) && (s.store !== e && (a.didChangeStore = !0), s.store = e, s.selector = t, s.a1 = n, s.a2 = r, s.a3 = i, s.value = t(e.getSnapshot(), n, r, i))) : (s = {
		store: e,
		selector: t,
		a1: n,
		a2: r,
		a3: i,
		value: t(e.getSnapshot(), n, r, i)
	}, a.syncHooks.push(s)), s.value;
}
function Oa(e, t, n, r, i) {
	return (0, Ca.useSyncExternalStoreWithSelector)(e.subscribe, e.getSnapshot, e.getSnapshot, (e) => t(e, n, r, i));
}
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.5.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/store/Store.mjs
var ka = class {
	static create(e) {
		return new this(e);
	}
	constructor(e) {
		this.state = e, this.listeners = /* @__PURE__ */ new Set(), this.updateTick = 0;
	}
	subscribe = (e) => (this.listeners.add(e), () => {
		this.listeners.delete(e);
	});
	getSnapshot = () => this.state;
	setState(e) {
		if (this.state === e) return;
		this.state = e, this.updateTick += 1;
		let t = this.updateTick;
		for (let n of this.listeners) {
			if (t !== this.updateTick) return;
			n(e);
		}
	}
	update(e) {
		for (let t in e) if (!Object.is(this.state[t], e[t])) {
			this.setState({
				...this.state,
				...e
			});
			return;
		}
	}
	set(e, t) {
		Object.is(this.state[e], t) || this.setState({
			...this.state,
			[e]: t
		});
	}
	notifyAll() {
		let e = { ...this.state };
		this.setState(e);
	}
	use(e, t, n, r) {
		return Ta(this, e, t, n, r);
	}
}, Aa = class extends ka {
	constructor(e, t = {}, n) {
		super(e), this.context = t, this.selectors = n;
	}
	useSyncedValue(e, t) {
		_.useDebugValue(e);
		let n = this;
		N(() => {
			n.state[e] !== t && n.set(e, t);
		}, [
			n,
			e,
			t
		]);
	}
	useSyncedValueWithCleanup(e, t) {
		let n = this;
		N(() => (n.state[e] !== t && n.set(e, t), () => {
			n.set(e, void 0);
		}), [
			n,
			e,
			t
		]);
	}
	useSyncedValues(e) {
		let t = this;
		N(() => {
			t.update(e);
		}, [t, ...Object.values(e)]);
	}
	useControlledProp(e, t) {
		_.useDebugValue(e);
		let n = this, r = t !== void 0;
		N(() => {
			r && !Object.is(n.state[e], t) && n.setState({
				...n.state,
				[e]: t
			});
		}, [
			n,
			e,
			t,
			r
		]);
	}
	select(e, t, n, r) {
		let i = this.selectors[e];
		return i(this.state, t, n, r);
	}
	useState(e, t, n, r) {
		return _.useDebugValue(e), Ta(this, this.selectors[e], t, n, r);
	}
	useContextCallback(e, t) {
		_.useDebugValue(e);
		let n = Z(t ?? D);
		this.context[e] = n;
	}
	useStateSetter(e) {
		let t = _.useRef(void 0);
		return t.current === void 0 && (t.current = (t) => {
			this.set(e, t);
		}), t.current;
	}
	observe(e, t) {
		let n;
		n = typeof e == "function" ? e : this.selectors[e];
		let r = n(this.state);
		return t(r, r, this), this.subscribe((e) => {
			let i = n(e);
			if (!Object.is(r, i)) {
				let e = r;
				r = i, t(i, e, this);
			}
		});
	}
}, ja = {
	open: (e) => e.open,
	transitionStatus: (e) => e.transitionStatus,
	domReferenceElement: (e) => e.domReferenceElement,
	referenceElement: (e) => e.positionReference ?? e.referenceElement,
	floatingElement: (e) => e.floatingElement,
	floatingId: (e) => e.floatingId
}, Ma = class extends Aa {
	constructor(e) {
		let { syncOnly: t, nested: n, onOpenChange: r, triggerElements: i, ...a } = e;
		super({
			...a,
			positionReference: a.referenceElement,
			domReferenceElement: a.referenceElement
		}, {
			onOpenChange: r,
			dataRef: { current: {} },
			events: Si(),
			nested: n,
			triggerElements: i
		}, ja), this.syncOnly = t;
	}
	syncOpenEvent = (e, t) => {
		(!e || !this.state.open || t != null && ue(t)) && (this.context.dataRef.current.openEvent = e ? t : void 0);
	};
	dispatchOpenChange = (e, t) => {
		this.syncOpenEvent(e, t.event);
		let n = {
			open: e,
			reason: t.reason,
			nativeEvent: t.event,
			nested: this.context.nested,
			triggerElement: t.trigger
		};
		this.context.events.emit("openchange", n);
	};
	setOpen = (e, t) => {
		if (this.syncOnly) {
			this.context.onOpenChange?.(e, t);
			return;
		}
		this.dispatchOpenChange(e, t), this.context.onOpenChange?.(e, t);
	};
};
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/utils/popups/store.mjs
function Na(e, t, n = !1) {
	return {
		open: !1,
		openProp: void 0,
		mounted: !1,
		transitionStatus: void 0,
		floatingRootContext: new Ma({
			open: !1,
			transitionStatus: void 0,
			floatingElement: null,
			referenceElement: null,
			triggerElements: e,
			floatingId: t,
			syncOnly: !0,
			nested: n,
			onOpenChange: void 0
		}),
		floatingId: t,
		triggerCount: 0,
		preventUnmountingOnClose: !1,
		payload: void 0,
		activeTriggerId: null,
		activeTriggerElement: null,
		openedWithoutTrigger: !1,
		triggerIdProp: void 0,
		popupElement: null,
		positionerElement: null,
		activeTriggerProps: k,
		inactiveTriggerProps: k,
		popupProps: k
	};
}
var Pa = (e) => e.triggerIdProp ?? e.activeTriggerId, Fa = (e) => e.openProp ?? e.open, Ia = (e) => (e.popupElement?.id ?? e.floatingId) || void 0;
function La(e, t) {
	return t !== void 0 && Fa(e) && Pa(e) === t;
}
function Ra(e, t) {
	return La(e, t) ? !0 : t !== void 0 && Fa(e) && Pa(e) == null && !e.openedWithoutTrigger && e.triggerCount === 1;
}
var za = {
	open: Fa,
	mounted: (e) => e.mounted,
	transitionStatus: (e) => Fa(e) && !e.mounted ? "starting" : e.transitionStatus,
	floatingRootContext: (e) => e.floatingRootContext,
	triggerCount: (e) => e.triggerCount,
	preventUnmountingOnClose: (e) => e.preventUnmountingOnClose,
	payload: (e) => e.payload,
	activeTriggerId: Pa,
	activeTriggerElement: (e) => e.mounted ? e.activeTriggerElement : null,
	popupId: Ia,
	isTriggerActive: (e, t) => t !== void 0 && Pa(e) === t,
	isOpenedByTrigger: (e, t) => La(e, t),
	isMountedByTrigger: (e, t) => t !== void 0 && Pa(e) === t && e.mounted,
	triggerProps: (e, t) => t ? e.activeTriggerProps : e.inactiveTriggerProps,
	triggerPopupId: (e, t) => Ra(e, t) ? Ia(e) : void 0,
	popupProps: (e) => e.popupProps,
	popupElement: (e) => e.popupElement,
	positionerElement: (e) => e.positionerElement
};
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/utils/popups/usePopupHandleStore.mjs
function Ba(e) {
	let t = _.useCallback((t) => e === void 0 ? D : e.subscribeStore(t), [e]), n = _.useCallback(() => e === void 0 ? void 0 : e.store, [e]);
	return (0, Sa.useSyncExternalStore)(t, n, () => e?.serverStore);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/hooks/useFocus.mjs
var Va = B && ae;
function Ha(e, t = {}) {
	let { enabled: n = !0, delay: r } = t, { events: i, dataRef: a } = e.context, o = _.useRef(!1), s = _.useRef(null), c = _.useRef(!0), l = ee();
	_.useEffect(() => {
		let t = e.select("domReferenceElement");
		if (!n) return;
		let r = W(t);
		function i() {
			let t = e.select("domReferenceElement");
			!e.select("open") && me(t) && t === Ne(cn(t)) && (o.current = !0, s.current = t);
		}
		function a() {
			c.current = !0;
		}
		function l() {
			c.current = !1;
		}
		return Ut(X(r, "blur", i), Va && X(r, "keydown", a, !0), Va && X(r, "pointerdown", l, !0));
	}, [e, n]), _.useEffect(() => {
		if (!n) return;
		function t(t) {
			if (t.reason === "trigger-press" || t.reason === "escape-key") {
				let t = e.select("domReferenceElement");
				K(t) && (s.current = t, o.current = !0);
			}
		}
		return i.on("openchange", t), () => {
			i.off("openchange", t);
		};
	}, [
		i,
		n,
		e
	]);
	let u = _.useMemo(() => {
		function t() {
			o.current = !1, s.current = null;
		}
		return {
			onMouseLeave() {
				t();
			},
			onFocus(n) {
				let i = n.currentTarget;
				if (o.current) {
					if (s.current === i) return;
					t();
				}
				let a = Fe(n.nativeEvent);
				if (K(a)) {
					if (Va && !n.relatedTarget) {
						if (!c.current && !dt(a)) return;
					} else if (!mt(a)) return;
				}
				let u = ct(n.relatedTarget, e.context.triggerElements), { nativeEvent: d, currentTarget: f } = n;
				if (e.select("open") && u || !r) {
					e.setOpen(!0, J(Tt, d, f));
					return;
				}
				l.start(r, () => {
					o.current || e.setOpen(!0, J(Tt, d, f));
				});
			},
			onBlur(n) {
				t();
				let r = n.relatedTarget, i = n.nativeEvent, o = K(r) && r.hasAttribute(vr("focus-guard")) && r.getAttribute("data-type") === "outside";
				l.start(0, () => {
					let t = e.select("domReferenceElement"), n = Ne(cn(t));
					(r || n !== t) && (q(a.current.floatingContext?.refs.floating.current, n) || q(t, n) || o || ct(r ?? n, e.context.triggerElements) || e.setOpen(!1, J(Tt, i)));
				});
			}
		};
	}, [
		a,
		r,
		e,
		l
	]);
	return _.useMemo(() => n ? {
		reference: u,
		trigger: u
	} : {}, [n, u]);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/hooks/useHoverInteractionSharedState.mjs
var Ua = class e {
	pointerType = void 0;
	interactedInside = !1;
	handler = void 0;
	blockMouseMove = !0;
	performedPointerEventsMutation = !1;
	pointerEventsScopeElement = null;
	pointerEventsReferenceElement = null;
	pointerEventsFloatingElement = null;
	restTimeoutPending = !1;
	openChangeTimeout = new M();
	restTimeout = new M();
	handleCloseOptions = void 0;
	static create() {
		return new e();
	}
	dispose = () => {
		this.openChangeTimeout.clear(), this.restTimeout.clear();
	};
	disposeEffect = () => this.dispose;
}, Wa = /* @__PURE__ */ new WeakMap();
function Ga(e) {
	if (!e.performedPointerEventsMutation) return;
	let t = e.pointerEventsScopeElement;
	t && Wa.get(t) === e && (e.pointerEventsScopeElement?.style.removeProperty("pointer-events"), e.pointerEventsReferenceElement?.style.removeProperty("pointer-events"), e.pointerEventsFloatingElement?.style.removeProperty("pointer-events"), Wa.delete(t)), e.performedPointerEventsMutation = !1, e.pointerEventsScopeElement = null, e.pointerEventsReferenceElement = null, e.pointerEventsFloatingElement = null;
}
function Ka(e, t) {
	let { scopeElement: n, referenceElement: r, floatingElement: i } = t, a = Wa.get(n);
	a && a !== e && Ga(a), Ga(e), e.performedPointerEventsMutation = !0, e.pointerEventsScopeElement = n, e.pointerEventsReferenceElement = r, e.pointerEventsFloatingElement = i, Wa.set(n, e), n.style.pointerEvents = "none", r.style.pointerEvents = "auto", i.style.pointerEvents = "auto";
}
function qa(e) {
	let t = e.context.dataRef.current, n = y(() => t.hoverInteractionState ?? Ua.create()).current;
	return t.hoverInteractionState ||= n, A(t.hoverInteractionState.disposeEffect), t.hoverInteractionState;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/hooks/useHoverFloatingInteraction.mjs
function Ja(e, t = {}) {
	let { enabled: n = !0, closeDelay: r = 0, nodeId: i } = t, a = e.useState("open"), o = e.useState("floatingElement"), s = e.useState("domReferenceElement"), { dataRef: c } = e.context, l = Di(), u = Ei(), d = qa(e), f = ee(), p = Z(() => yt(c.current.openEvent?.type, d.interactedInside)), m = Z(() => bt(c.current.openEvent?.type)), h = Z(() => {
		Ga(d);
	});
	N(() => {
		a || (d.pointerType = void 0, d.restTimeoutPending = !1, d.interactedInside = !1, h());
	}, [
		a,
		d,
		h
	]), _.useEffect(() => h, [h]), N(() => {
		if (n && a && d.handleCloseOptions?.blockPointerEvents && m() && K(s) && o) {
			let e = s, t = o, n = cn(o), r = l?.nodesRef.current.find((e) => e.id === u)?.context?.elements.floating;
			r && (r.style.pointerEvents = "");
			let i = d.pointerEventsScopeElement === t ? null : d.pointerEventsScopeElement, a = r === t ? null : r, c = d.handleCloseOptions?.getScope?.() ?? i ?? a ?? Pe(e, "[data-rootownerid]") ?? n.body;
			return Ka(d, {
				scopeElement: c,
				referenceElement: e,
				floatingElement: t
			}), () => {
				h();
			};
		}
	}, [
		n,
		a,
		s,
		o,
		d,
		m,
		l,
		u,
		h
	]), _.useEffect(() => {
		if (!n) return;
		function t() {
			return !!(l && u && gr(l.nodesRef.current, u).length > 0);
		}
		function a(t) {
			let n = _t(r, "close", d.pointerType), i = () => {
				e.setOpen(!1, J(wt, t)), l?.events.emit("floating.closed", t);
			};
			n ? d.openChangeTimeout.start(n, i) : (d.openChangeTimeout.clear(), i());
		}
		function s(e) {
			let t = Fe(e);
			if (!ft(t)) {
				d.interactedInside = !1;
				return;
			}
			d.interactedInside = Pe(t, "[aria-haspopup]") != null;
		}
		function g() {
			d.openChangeTimeout.clear(), f.clear(), l?.events.off("floating.closed", v), h();
		}
		function _(n) {
			if (t() && l) {
				l.events.on("floating.closed", v);
				return;
			}
			if (ct(n.relatedTarget, e.context.triggerElements)) return;
			let r = c.current.floatingContext?.nodeId ?? i, o = n.relatedTarget;
			if (!(l && r && K(o) && gr(l.nodesRef.current, r, !1).some((e) => q(e.context?.elements.floating, o)))) {
				if (d.handler) {
					d.handler(n);
					return;
				}
				h(), m() && !p() && a(n);
			}
		}
		function v(n) {
			l && u && !t() && f.start(0, () => {
				l.events.off("floating.closed", v), e.setOpen(!1, J(wt, n)), l.events.emit("floating.closed", n);
			});
		}
		let y = o;
		return Ut(y && X(y, "mouseenter", g), y && X(y, "mouseleave", _), y && X(y, "pointerdown", s, !0), () => {
			l?.events.off("floating.closed", v);
		});
	}, [
		n,
		o,
		e,
		c,
		r,
		i,
		m,
		p,
		h,
		d,
		l,
		u,
		f
	]);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/hooks/useHoverReferenceInteraction.mjs
var Ya = { current: null };
function Xa(e, t = {}) {
	let { enabled: n = !0, delay: r = 0, handleClose: i = null, mouseOnly: a = !1, restMs: o = 0, move: s = !0, triggerElementRef: c = Ya, externalTree: l, isActiveTrigger: u = !0, getHandleCloseContext: d, isClosing: f, shouldOpen: p, guardStaleOpen: m = !1 } = t, { dataRef: h, events: g } = e.context, v = Di(l), y = qa(e), b = _.useRef(!1), x = Xt(i), S = Xt(r), C = Xt(o), w = Xt(n), T = Xt(p), E = Xt(f), D = Z(() => yt(h.current.openEvent?.type, y.interactedInside)), O = Z(() => T.current?.() !== !1), k = Z((t, n, r) => {
		let i = e.context.triggerElements;
		if (i.hasElement(n)) return !t || !q(t, n);
		if (!K(r)) return !1;
		let a = r;
		return i.hasMatchingElement((e) => q(e, a)) && (!t || !q(t, a));
	}), A = Z(() => {
		y.handler &&= (cn(e.select("domReferenceElement")).removeEventListener("mousemove", y.handler), void 0);
	}), j = Z(() => {
		Ga(y);
	});
	return u && (y.handleCloseOptions = i?.__options), _.useEffect(() => A, [A]), _.useEffect(() => {
		if (!n) return;
		function e(e) {
			e.open ? b.current = !1 : (b.current = e.reason === wt, A(), y.openChangeTimeout.clear(), y.restTimeout.clear(), y.blockMouseMove = !0, y.restTimeoutPending = !1);
		}
		return g.on("openchange", e), () => {
			g.off("openchange", e);
		};
	}, [
		n,
		g,
		y,
		A
	]), _.useEffect(() => {
		if (!n) return;
		function t(t, n = !0) {
			let r = _t(S.current, "close", y.pointerType);
			r ? y.openChangeTimeout.start(r, () => {
				e.setOpen(!1, J(wt, t)), v?.events.emit("floating.closed", t);
			}) : n && (y.openChangeTimeout.clear(), e.setOpen(!1, J(wt, t)), v?.events.emit("floating.closed", t));
		}
		let r = c.current ?? (u ? e.select("domReferenceElement") : null);
		if (!K(r)) return;
		function i(t) {
			if (y.openChangeTimeout.clear(), y.blockMouseMove = !1, a && !le(y.pointerType)) return;
			let n = vt(C.current), r = _t(S.current, "open", y.pointerType), i = Fe(t), o = t.currentTarget ?? null, s = e.select("domReferenceElement"), c = o;
			if (K(i) && !e.context.triggerElements.hasElement(i)) {
				for (let t of e.context.triggerElements.elements()) if (q(t, i)) {
					c = t;
					break;
				}
			}
			K(o) && K(s) && !e.context.triggerElements.hasElement(o) && q(o, s) && (c = s);
			let l = c != null && k(s, c, i), u = e.select("open"), d = E.current?.() ?? e.select("transitionStatus") === "ending", f = !u && d && b.current, p = !l && K(c) && K(s) && q(s, c) && f, m = n > 0 && !r, h = l && (u || f) || p, g = !u || l;
			if (h) {
				O() && e.setOpen(!0, J(wt, t, c));
				return;
			}
			m || (r ? y.openChangeTimeout.start(r, () => {
				g && O() && e.setOpen(!0, J(wt, t, c));
			}) : g && O() && e.setOpen(!0, J(wt, t, c)));
		}
		function o(n) {
			if (D()) {
				j();
				return;
			}
			A();
			let r = cn(e.select("domReferenceElement"));
			y.restTimeout.clear(), y.restTimeoutPending = !1;
			let i = h.current.floatingContext ?? d?.();
			if (!ct(n.relatedTarget, e.context.triggerElements)) {
				if (x.current && i) {
					e.select("open") || y.openChangeTimeout.clear();
					let a = c.current;
					y.handler = x.current({
						...i,
						tree: v,
						x: n.clientX,
						y: n.clientY,
						onClose() {
							j(), A(), w.current && !D() && a === e.select("domReferenceElement") && t(n, !0);
						}
					}), r.addEventListener("mousemove", y.handler), y.handler(n);
					return;
				}
				(y.pointerType !== "touch" || !q(e.select("floatingElement"), n.relatedTarget)) && t(n);
			}
		}
		function l(e) {
			q(r, e.relatedTarget) || (y.openChangeTimeout.clear(), y.restTimeout.clear(), y.restTimeoutPending = !1);
		}
		let f = m ? X(r, "mouseout", l) : void 0;
		return s ? Ut(X(r, "mousemove", i, { once: !0 }), X(r, "mouseenter", i), X(r, "mouseleave", o), f) : Ut(X(r, "mouseenter", i), X(r, "mouseleave", o), f);
	}, [
		A,
		j,
		h,
		S,
		e,
		n,
		x,
		y,
		u,
		k,
		D,
		a,
		s,
		C,
		c,
		v,
		w,
		d,
		E,
		O,
		m
	]), _.useMemo(() => {
		if (!n) return;
		function t(e) {
			y.pointerType = e.pointerType;
		}
		return {
			onPointerDown: t,
			onPointerEnter: t,
			onMouseMove(t) {
				let { nativeEvent: n } = t, r = t.currentTarget, i = e.select("domReferenceElement"), o = e.select("open"), s = k(i, r, t.target);
				if (a && !le(y.pointerType)) return;
				if (o && s && y.handleCloseOptions?.blockPointerEvents) {
					let t = e.select("floatingElement");
					if (t) {
						let e = y.handleCloseOptions?.getScope?.() ?? r.ownerDocument.body;
						Ka(y, {
							scopeElement: e,
							referenceElement: r,
							floatingElement: t
						});
					}
				}
				let c = vt(C.current);
				if (o && !s || c === 0 || !s && y.restTimeoutPending && t.movementX ** 2 + t.movementY ** 2 < 2) return;
				y.restTimeout.clear();
				function l() {
					if (y.restTimeoutPending = !1, D()) return;
					let t = e.select("open");
					!y.blockMouseMove && (!t || s) && O() && e.setOpen(!0, J(wt, n, r));
				}
				y.pointerType === "touch" ? gi.flushSync(() => {
					l();
				}) : s && o ? l() : (y.restTimeoutPending = !0, y.restTimeout.start(c, l));
			}
		};
	}, [
		n,
		y,
		D,
		k,
		a,
		e,
		C,
		O
	]);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/hooks/useListNavigation.mjs
function Za(e) {
	return ae && e.movementX === 0 && e.movementY === 0;
}
function Qa(e, t, n) {
	switch (e) {
		case "vertical": return t;
		case "horizontal": return n;
		default: return t || n;
	}
}
function $a(e, t) {
	return Qa(t, e === "ArrowUp" || e === "ArrowDown", e === "ArrowLeft" || e === "ArrowRight");
}
function eo(e, t, n) {
	return Qa(t, e === "ArrowDown", n ? e === "ArrowLeft" : e === "ArrowRight") || e === "Enter" || e === " " || e === "";
}
function to(e, t, n) {
	return Qa(t, n ? e === Re : e === ze, e === Ve);
}
function no(e, t, n, r) {
	return t === "both" || t === "horizontal" && r ? e === "Escape" : Qa(t, n ? e === ze : e === Re, e === Be);
}
function ro(e, t) {
	let { listRef: n, activeIndex: r, onNavigate: i = () => {}, enabled: a = !0, selectedIndex: o = null, allowEscape: s = !1, loopFocus: c = !1, nested: l = !1, rtl: u = !1, virtual: d = !1, focusItemOnOpen: f = "auto", focusItemOnHover: p = !0, openOnArrowKeyDown: m = !0, disabledIndices: h = void 0, orientation: g = "vertical", triggerOrientation: v = g, parentOrientation: y, id: b, resetOnPointerLeave: x = !0, externalTree: S, nestedReturnFocusRef: C, grid: w } = t, T = w != null, E = e.useState("open"), D = e.useState("floatingElement"), O = e.useState("domReferenceElement"), k = e.context.dataRef, A = ht(D), j = pt(O), M = Xt(A), ee = Ei(), P = Di(S), F = _.useRef(f), I = _.useRef(o ?? -1), L = _.useRef(null), te = _.useRef(!0), R = Z((e) => {
		i(I.current === -1 ? null : I.current, e);
	}), ne = _.useRef(!!D), re = _.useRef(E), z = _.useRef(!1), B = _.useRef(!1), ie = _.useRef(null), ae = Xt(h), oe = Xt(E), se = Xt(o), V = Xt(x), le = sn(), ue = sn(), de = Z(() => {
		le.cancel();
		function e(e) {
			d || (ie.current = br(e, {
				sync: z.current,
				preventScroll: !0
			}));
		}
		let t = n.current[I.current], r = B.current;
		t && e(t), (z.current ? (e) => e() : (e) => le.request(e))(() => {
			let i = n.current[I.current] || t;
			i && (t || e(i), he && (r || !te.current) && i.scrollIntoView?.({
				block: "nearest",
				inline: "nearest"
			}));
		});
	});
	N(() => {
		k.current.orientation = g;
	}, [k, g]), N(() => {
		E || (L.current = null), (!E || f !== "auto") && (F.current = f);
	}, [E, f]), N(() => {
		a && (E && D ? (I.current = o ?? -1, F.current && o != null && (B.current = !0, R())) : ne.current && (I.current = -1, R()));
	}, [
		a,
		E,
		D,
		o,
		R
	]), N(() => {
		if (a) {
			if (!E) {
				z.current = !1;
				return;
			}
			if (D) {
				if (r == null) {
					if (z.current = !1, se.current != null) return;
					if (ne.current && (I.current = -1, de()), (!re.current || !ne.current) && F.current && (L.current != null || F.current === !0 && L.current == null)) {
						let e = 0, t = () => {
							n.current[0] == null ? (e < 2 && (e ? (e) => ue.request(e) : queueMicrotask)(t), e += 1) : (I.current = L.current == null || eo(L.current, v, u) || l ? Bn(n) : Vn(n), L.current = null, R());
						};
						t();
					}
				} else zn(n.current, r) || (I.current = r, de(), B.current = !1);
			}
		}
	}, [
		a,
		E,
		D,
		r,
		se,
		l,
		n,
		v,
		u,
		R,
		de,
		ue
	]), N(() => {
		if (!a || D || !P || d || !ne.current) return;
		let e = P.nodesRef.current, t = e.find((e) => e.id === ee)?.context?.elements.floating, n = Ne(cn(O ?? t ?? null)), r = e.some((e) => e.context && q(e.context.elements.floating, n));
		t && !r && te.current && t.focus({ preventScroll: !0 });
	}, [
		a,
		D,
		O,
		P,
		ee,
		d
	]), N(() => {
		re.current = E, ne.current = !!D;
	});
	let fe = r != null, W = Z((e) => {
		if (!oe.current) return;
		let t = n.current.indexOf(e.currentTarget);
		t !== -1 && (I.current !== t || r !== t) && (I.current = t, R(e));
	}), G = Z(() => y ?? P?.nodesRef.current.find((e) => e.id === ee)?.context?.dataRef?.current.orientation), pe = Z(() => Bn(n, ae.current)), K = Z((t) => {
		if (te.current = !1, z.current = !0, t.which === 229 || !oe.current && t.currentTarget === M.current) return;
		if (l && no(t.key, g, u, T)) {
			$a(t.key, G()) || ce(t), e.setOpen(!1, J(jt, t.nativeEvent));
			let n = C?.current ?? O;
			me(n) && n.focus();
			return;
		}
		r != null && r !== I.current && !zn(n.current, r) && (I.current = r);
		let i = I.current, a = Bn(n, h), o = Vn(n, h);
		if (j || (t.key === "Home" && (ce(t), I.current = a, R(t)), t.key === "End" && (ce(t), I.current = o, R(t))), w != null) {
			let e = w(t, I.current, n, g, c, u, h, a, o);
			if (e != null && e !== I.current && (I.current = e, R(t)), g === "both") return;
		}
		if ($a(t.key, g)) {
			ce(t);
			let e = Ne(t.currentTarget.ownerDocument);
			if (E && !d && q(t.currentTarget, e) && !n.current.some((t) => t != null && q(t, e))) {
				I.current = eo(t.key, g, u) ? a : o, R(t), r === I.current && de();
				return;
			}
			let { index: l, wrapped: f } = Hn(n.current, i, {
				decrement: !eo(t.key, g, u),
				loopFocus: c,
				allowEscape: s,
				disabledIndices: h,
				minIndex: a,
				maxIndex: o
			});
			f && (z.current = !1), I.current = l, R(t);
		}
	}), he = _.useMemo(() => ({
		onFocus(e) {
			z.current = !0, W(e);
		},
		onClick({ currentTarget: e }) {
			d || e.focus({ preventScroll: !0 });
		},
		onMouseMove(e) {
			Za(e) || (z.current = !0, B.current = !1, p && W(e));
		},
		onPointerLeave(e) {
			if (!oe.current || !te.current || e.pointerType === "touch") return;
			z.current = !0;
			let t = e.relatedTarget;
			if (p && !n.current.includes(t) && V.current && (ie.current?.(), ie.current = null, I.current = -1, R(e), !d)) {
				let e = M.current, t = Ne(cn(e));
				e && q(e, t) && e.focus({ preventScroll: !0 });
			}
		}
	}), [
		W,
		oe,
		M,
		p,
		n,
		R,
		V,
		d
	]), ge = _.useMemo(() => d && E && fe && { "aria-activedescendant": `${b}-${r}` }, [
		d,
		E,
		fe,
		b,
		r
	]), _e = _.useMemo(() => ({
		...j ? {} : ge,
		onKeyDown(t) {
			if (t.key === "Tab" && t.shiftKey && E && !d) {
				let n = Fe(t.nativeEvent);
				if (n && !q(M.current, n)) return;
				ce(t);
				let r = J(kt, t.nativeEvent);
				e.setOpen(!1, r);
				let i = C?.current ?? O;
				!r.isCanceled && me(i) && i.focus();
				return;
			}
			K(t);
		},
		onPointerMove(e) {
			Za(e) || (te.current = !0);
		}
	}), [
		ge,
		K,
		M,
		j,
		e,
		E,
		d,
		O,
		C
	]), ve = _.useMemo(() => {
		function t(t) {
			e.setOpen(!0, J(jt, t.nativeEvent, t.currentTarget));
		}
		function n(e) {
			f === "auto" && H(e.nativeEvent) && (F.current = !d);
		}
		function r(e) {
			F.current = f, f === "auto" && U(e.nativeEvent) && (F.current = !0);
		}
		return {
			onKeyDown(n) {
				let r = e.select("open");
				te.current = !1;
				let i = n.key.startsWith("Arrow"), a = to(n.key, G(), u), o = $a(n.key, r ? g : v), s = (l ? a : o) || n.key === "Enter" || n.key.trim() === "";
				if (d && r && (!l || dt(n.currentTarget))) return K(n);
				if (r || m || !i) {
					if (s) {
						let e = $a(n.key, G());
						L.current = l && e ? null : n.key;
					}
					if (l) {
						a && (ce(n), r ? (I.current = pe(), R(n), d && M.current?.focus()) : t(n));
						return;
					}
					o && (se.current != null && (I.current = se.current), ce(n), !r && m ? t(n) : K(n), r && R(n));
				}
			},
			onFocus(t) {
				t.target === t.currentTarget && e.select("open") && !d && (I.current = -1, R(t));
			},
			onPointerDown: r,
			onPointerEnter: r,
			onMouseDown: n,
			onClick: n
		};
	}, [
		K,
		f,
		pe,
		l,
		R,
		e,
		m,
		g,
		v,
		G,
		u,
		se,
		d,
		M
	]), ye = _.useMemo(() => ({
		...ge,
		...ve
	}), [ge, ve]);
	return _.useMemo(() => a ? {
		reference: ye,
		floating: _e,
		item: he,
		trigger: ve
	} : {}, [
		a,
		ye,
		_e,
		ve,
		he
	]);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/hooks/useTypeahead.mjs
function io(e, t) {
	let { listRef: n, elementsRef: r, activeIndex: i, onMatch: a, disabledIndices: o, onTyping: s, enabled: c = !0, resetMs: l = 750, selectedIndex: u = null } = t, d = Z(s), f = e.useState("open"), p = ee(), m = _.useRef(""), h = _.useRef(u ?? i ?? -1), g = _.useRef(null), v = Z((e) => {
		function t(e) {
			return r?.current[e];
		}
		function s(e) {
			let n = t(e);
			return n && !Kn(n) || n?.matches(":disabled") ? !1 : o == null || !Wn(O, e, o);
		}
		function c(e, t, n = 0) {
			if (e.length === 0) return -1;
			let r = (n % e.length + e.length) % e.length, i = t.toLowerCase();
			for (let t = 0; t < e.length; t += 1) {
				let n = (r + t) % e.length;
				if (e[n]?.toLowerCase().startsWith(i) && s(n)) return n;
			}
			return -1;
		}
		let _ = n.current;
		if (m.current.length > 0 && e.key === " " && (ce(e), d?.(!0)), m.current.length > 0 && m.current[0] !== " " && c(_, m.current) === -1 && e.key !== " " && d?.(!1), _ == null || e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return;
		f && e.key !== " " && (ce(e), d?.(!0));
		let v = m.current === "";
		v && (h.current = u ?? i ?? -1), _.every((e, t) => e && s(t) ? e[0]?.toLowerCase() !== e[1]?.toLowerCase() : !0) && m.current === e.key && (m.current = "", h.current = g.current), m.current += e.key, p.start(l, () => {
			m.current = "", h.current = g.current, d?.(!1);
		});
		let y = ((v ? u ?? i ?? -1 : h.current) ?? 0) + 1, b = c(_, m.current, y);
		b === -1 ? e.key !== " " && (m.current = "", d?.(!1)) : (a?.(b, e), g.current = b);
	}), y = Z((t) => {
		let n = t.relatedTarget, r = e.select("domReferenceElement"), i = e.select("floatingElement");
		q(r, n) || q(i, n) || (p.clear(), m.current = "", h.current = g.current, d?.(!1));
	});
	N(() => {
		(f || u === null) && (p.clear(), g.current = null, m.current !== "" && (m.current = "", d?.(!1)));
	}, [
		f,
		u,
		p,
		d
	]);
	let b = _.useMemo(() => ({
		onKeyDown: v,
		onBlur: y
	}), [v, y]);
	return _.useMemo(() => c ? {
		reference: b,
		floating: b
	} : {}, [c, b]);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/safePolygon.mjs
var ao = .1, oo = ao * ao, so = .5;
function co(e, t, n, r, i, a) {
	return r >= t != a >= t && e <= (i - n) * (t - r) / (a - r) + n;
}
function lo(e, t, n, r, i, a, o, s, c, l) {
	let u = !1;
	return co(e, t, n, r, i, a) && (u = !u), co(e, t, i, a, o, s) && (u = !u), co(e, t, o, s, c, l) && (u = !u), co(e, t, c, l, n, r) && (u = !u), u;
}
function uo(e, t, n) {
	return e >= n.x && e <= n.x + n.width && t >= n.y && t <= n.y + n.height;
}
function fo(e, t, n, r, i, a) {
	return e >= Math.min(n, i) && e <= Math.max(n, i) && t >= Math.min(r, a) && t <= Math.max(r, a);
}
function po(e = {}) {
	let { blockPointerEvents: t = !1 } = e, n = new M(), r = ({ x: e, y: t, placement: r, elements: i, onClose: a, nodeId: o, tree: s }) => {
		let c = r?.split("-")[0], l = !1, u = null, d = null, f = typeof performance < "u" ? performance.now() : 0;
		function p(e, t) {
			let n = performance.now(), r = n - f;
			if (u === null || d === null || r === 0) return u = e, d = t, f = n, !1;
			let i = e - u, a = t - d, o = i * i + a * a, s = r * r * oo;
			return u = e, d = t, f = n, o < s;
		}
		function m() {
			n.clear(), a();
		}
		return function(r) {
			n.clear();
			let a = i.domReference, u = i.floating;
			if (!a || !u || c == null || e == null || t == null) return;
			let { clientX: d, clientY: f } = r, h = Fe(r), g = r.type === "mouseleave", _ = q(u, h), v = q(a, h);
			if (_ && (l = !0, !g)) return;
			if (v && (l = !1, !g)) {
				l = !0;
				return;
			}
			if (g && K(r.relatedTarget) && q(u, r.relatedTarget)) return;
			function y() {
				return !!(s && gr(s.nodesRef.current, o).length > 0);
			}
			function b() {
				y() || m();
			}
			if (y()) return;
			let x = a.getBoundingClientRect(), S = u.getBoundingClientRect(), C = e > S.right - S.width / 2, w = t > S.bottom - S.height / 2, T = S.width > x.width, E = S.height > x.height, D = (T ? x : S).left, O = (T ? x : S).right, k = (E ? x : S).top, A = (E ? x : S).bottom;
			if (c === "top" && t >= x.bottom - 1 || c === "bottom" && t <= x.top + 1 || c === "left" && e >= x.right - 1 || c === "right" && e <= x.left + 1) {
				b();
				return;
			}
			let j = !1;
			switch (c) {
				case "top":
					j = fo(d, f, D, x.top + 1, O, S.bottom - 1);
					break;
				case "bottom":
					j = fo(d, f, D, S.top + 1, O, x.bottom - 1);
					break;
				case "left":
					j = fo(d, f, S.right - 1, A, x.left + 1, k);
					break;
				case "right": j = fo(d, f, x.right - 1, A, S.left + 1, k);
			}
			if (j) return;
			if (l && !uo(d, f, x)) {
				b();
				return;
			}
			if (!g && p(d, f)) {
				b();
				return;
			}
			let M = !1;
			switch (c) {
				case "top": {
					let n = T ? so / 2 : so * 4, r = T || C ? e + n : e - n, i = T ? e - n : C ? e + n : e - n, a = t + so + 1, o = C || T ? S.bottom - so : S.top, s = C ? T ? S.bottom - so : S.top : S.bottom - so;
					M = lo(d, f, r, a, i, a, S.left, o, S.right, s);
					break;
				}
				case "bottom": {
					let n = T ? so / 2 : so * 4, r = T || C ? e + n : e - n, i = T ? e - n : C ? e + n : e - n, a = t - so, o = C || T ? S.top + so : S.bottom, s = C ? T ? S.top + so : S.bottom : S.top + so;
					M = lo(d, f, r, a, i, a, S.left, o, S.right, s);
					break;
				}
				case "left": {
					let n = E ? so / 2 : so * 4, r = E || w ? t + n : t - n, i = E ? t - n : w ? t + n : t - n, a = e + so + 1, o = w || E ? S.right - so : S.left, s = w ? E ? S.right - so : S.left : S.right - so;
					M = lo(d, f, o, S.top, s, S.bottom, a, r, a, i);
					break;
				}
				case "right": {
					let n = E ? so / 2 : so * 4, r = E || w ? t + n : t - n, i = E ? t - n : w ? t + n : t - n, a = e - so, o = w || E ? S.left + so : S.right, s = w ? E ? S.left + so : S.right : S.left + so;
					M = lo(d, f, a, r, a, i, o, S.top, s, S.bottom);
					break;
				}
			}
			M ? l || n.start(40, b) : b();
		};
	};
	return r.__options = {
		...e,
		blockPointerEvents: t
	}, r;
}
//#endregion
//#region node_modules/.pnpm/@floating-ui+core@1.8.0/node_modules/@floating-ui/core/dist/floating-ui.core.mjs
function mo(e, t, n) {
	let { reference: r, floating: i } = e, a = wn(t), o = Tn(t), s = Cn(o), c = bn(t), l = a === "y", u = r.x + r.width / 2 - i.width / 2, d = r.y + r.height / 2 - i.height / 2, f = r[s] / 2 - i[s] / 2, p;
	switch (c) {
		case "top":
			p = {
				x: u,
				y: r.y - i.height
			};
			break;
		case "bottom":
			p = {
				x: u,
				y: r.y + r.height
			};
			break;
		case "right":
			p = {
				x: r.x + r.width,
				y: d
			};
			break;
		case "left":
			p = {
				x: r.x - i.width,
				y: d
			};
			break;
		default: p = {
			x: r.x,
			y: r.y
		};
	}
	let m = xn(t);
	return m && (p[o] += f * (m === "end" ? 1 : -1) * (n && l ? -1 : 1)), p;
}
async function ho(e, t) {
	t === void 0 && (t = {});
	let { x: n, y: r, platform: i, rects: a, elements: o, strategy: s } = e, { boundary: c = "clippingAncestors", rootBoundary: l = "viewport", elementContext: u = "floating", altBoundary: d = !1, padding: f = 0 } = yn(t, e), p = Ln(f), m = o[d ? u === "floating" ? "reference" : "floating" : u], h = Rn(await i.getClippingRect({
		element: await (i.isElement == null ? void 0 : i.isElement(m)) ?? !0 ? m : m.contextElement || await (i.getDocumentElement == null ? void 0 : i.getDocumentElement(o.floating)),
		boundary: c,
		rootBoundary: l,
		strategy: s
	})), g = u === "floating" ? {
		x: n,
		y: r,
		width: a.floating.width,
		height: a.floating.height
	} : a.reference, _ = await (i.getOffsetParent == null ? void 0 : i.getOffsetParent(o.floating)), v = await (i.isElement == null ? void 0 : i.isElement(_)) && await (i.getScale == null ? void 0 : i.getScale(_)) || {
		x: 1,
		y: 1
	}, y = Rn(i.convertOffsetParentRelativeRectToViewportRelativeRect ? await i.convertOffsetParentRelativeRectToViewportRelativeRect({
		elements: o,
		rect: g,
		offsetParent: _,
		strategy: s
	}) : g);
	return {
		top: (h.top - y.top + p.top) / v.y,
		bottom: (y.bottom - h.bottom + p.bottom) / v.y,
		left: (h.left - y.left + p.left) / v.x,
		right: (y.right - h.right + p.right) / v.x
	};
}
var go = 50, _o = async (e, t, n) => {
	let { placement: r = "bottom", strategy: i = "absolute", middleware: a = [], platform: o } = n, s = o.detectOverflow ? o : {
		...o,
		detectOverflow: ho
	}, c = await (o.isRTL == null ? void 0 : o.isRTL(t)), l = await o.getElementRects({
		reference: e,
		floating: t,
		strategy: i
	}), { x: u, y: d } = mo(l, r, c), f = r, p = 0, m = {};
	for (let n = 0; n < a.length; n++) {
		let h = a[n];
		if (!h) continue;
		let { name: g, fn: _ } = h, { x: v, y, data: b, reset: x } = await _({
			x: u,
			y: d,
			initialPlacement: r,
			placement: f,
			strategy: i,
			middlewareData: m,
			rects: l,
			platform: s,
			elements: {
				reference: e,
				floating: t
			}
		});
		u = v ?? u, d = y ?? d, m[g] = {
			...m[g],
			...b
		}, x && p < go && (p++, typeof x == "object" && (x.placement && (f = x.placement), x.rects && (l = x.rects === !0 ? await o.getElementRects({
			reference: e,
			floating: t,
			strategy: i
		}) : x.rects), {x: u, y: d} = mo(l, f, c)), n = -1);
	}
	return {
		x: u,
		y: d,
		placement: f,
		strategy: i,
		middlewareData: m
	};
}, vo = function(e) {
	return e === void 0 && (e = {}), {
		name: "flip",
		options: e,
		async fn(t) {
			var n;
			let { placement: r, middlewareData: i, rects: a, initialPlacement: o, platform: s, elements: c } = t, { mainAxis: l = !0, crossAxis: u = !0, fallbackPlacements: d, fallbackStrategy: f = "bestFit", fallbackAxisSideDirection: p = "none", flipAlignment: m = !0, ...h } = yn(e, t);
			if ((n = i.arrow) != null && n.alignmentOffset) return {};
			let g = bn(r), _ = wn(o), v = bn(o) === o, y = await (s.isRTL == null ? void 0 : s.isRTL(c.floating)), b = d || (v || !m ? [Fn(o)] : Dn(o)), x = p !== "none";
			!d && x && b.push(...Pn(o, m, p, y));
			let S = [o, ...b], C = await s.detectOverflow(t, h), w = [], T = i.flip?.overflows || [];
			if (l && w.push(C[g]), u) {
				let e = En(r, a, y);
				w.push(C[e[0]], C[e[1]]);
			}
			if (T = [...T, {
				placement: r,
				overflows: w
			}], !w.every((e) => e <= 0)) {
				let e = (i.flip?.index || 0) + 1, t = S[e];
				if (t && (u !== "alignment" || _ === wn(t) || T.every((e) => wn(e.placement) !== _ || e.overflows[0] > 0))) return {
					data: {
						index: e,
						overflows: T
					},
					reset: { placement: t }
				};
				let n = T.filter((e) => e.overflows[0] <= 0).sort((e, t) => e.overflows[1] - t.overflows[1])[0]?.placement;
				if (!n) switch (f) {
					case "bestFit": {
						let e = T.filter((e) => {
							if (x) {
								let t = wn(e.placement);
								return t === _ || t === "y";
							}
							return !0;
						}).map((e) => [e.placement, e.overflows.filter((e) => e > 0).reduce((e, t) => e + t, 0)]).sort((e, t) => e[1] - t[1])[0]?.[0];
						e && (n = e);
						break;
					}
					case "initialPlacement": n = o;
				}
				if (r !== n) return { reset: { placement: n } };
			}
			return {};
		}
	};
}, yo = /*#__PURE__*/ new Set(["left", "top"]);
async function bo(e, t) {
	let { placement: n, platform: r, elements: i } = e, a = await (r.isRTL == null ? void 0 : r.isRTL(i.floating)), o = bn(n), s = xn(n), c = wn(n) === "y", l = yo.has(o) ? -1 : 1, u = a && c ? -1 : 1, d = yn(t, e), { mainAxis: f, crossAxis: p, alignmentAxis: m } = typeof d == "number" ? {
		mainAxis: d,
		crossAxis: 0,
		alignmentAxis: null
	} : {
		mainAxis: d.mainAxis || 0,
		crossAxis: d.crossAxis || 0,
		alignmentAxis: d.alignmentAxis
	};
	return s && typeof m == "number" && (p = s === "end" ? m * -1 : m), c ? {
		x: p * u,
		y: f * l
	} : {
		x: f * l,
		y: p * u
	};
}
var xo = function(e) {
	return e === void 0 && (e = 0), {
		name: "offset",
		options: e,
		async fn(t) {
			var n;
			let { x: r, y: i, placement: a, middlewareData: o } = t, s = await bo(t, e);
			return a === o.offset?.placement && (n = o.arrow) != null && n.alignmentOffset ? {} : {
				x: r + s.x,
				y: i + s.y,
				data: {
					...s,
					placement: a
				}
			};
		}
	};
}, So = function(e) {
	return e === void 0 && (e = {}), {
		name: "shift",
		options: e,
		async fn(t) {
			let { x: n, y: r, placement: i, platform: a } = t, { mainAxis: o = !0, crossAxis: s = !1, limiter: c = { fn: (e) => {
				let { x: t, y: n } = e;
				return {
					x: t,
					y: n
				};
			} }, ...l } = yn(e, t), u = {
				x: n,
				y: r
			}, d = await a.detectOverflow(t, l), f = wn(i), p = Sn(f), m = u[p], h = u[f], g = (e, t) => vn(t + d[e === "y" ? "top" : "left"], t, t - d[e === "y" ? "bottom" : "right"]);
			o && (m = g(p, m)), s && (h = g(f, h));
			let _ = c.fn({
				...t,
				[p]: m,
				[f]: h
			});
			return {
				..._,
				data: {
					x: _.x - n,
					y: _.y - r,
					enabled: {
						[p]: o,
						[f]: s
					}
				}
			};
		}
	};
}, Co = function(e) {
	return e === void 0 && (e = {}), {
		options: e,
		fn(t) {
			let { x: n, y: r, placement: i, rects: a, middlewareData: o } = t, { offset: s = 0, mainAxis: c = !0, crossAxis: l = !0 } = yn(e, t), u = {
				x: n,
				y: r
			}, d = wn(i), f = Sn(d), p = u[f], m = u[d], h = yn(s, t), g = typeof h == "number" ? {
				mainAxis: h,
				crossAxis: 0
			} : {
				mainAxis: h.mainAxis ?? 0,
				crossAxis: h.crossAxis ?? 0
			};
			if (c) {
				let e = f === "y" ? "height" : "width", t = a.reference[f] - a.floating[e] + g.mainAxis, n = a.reference[f] + a.reference[e] - g.mainAxis;
				p < t ? p = t : p > n && (p = n);
			}
			if (l) {
				let e = f === "y" ? "width" : "height", t = yo.has(bn(i)), n = a.reference[d] - a.floating[e] + (t && o.offset?.[d] || 0) + (t ? 0 : g.crossAxis), r = a.reference[d] + a.reference[e] + (t ? 0 : o.offset?.[d] || 0) - (t ? g.crossAxis : 0);
				m < n ? m = n : m > r && (m = r);
			}
			return {
				[f]: p,
				[d]: m
			};
		}
	};
}, wo = function(e) {
	return e === void 0 && (e = {}), {
		name: "size",
		options: e,
		async fn(t) {
			let { placement: n, rects: r, platform: i, elements: a } = t, { apply: o = () => {}, ...s } = yn(e, t), c = await i.detectOverflow(t, s), l = bn(n), u = xn(n), d = wn(n) === "y", { width: f, height: p } = r.floating, m, h;
			l === "top" || l === "bottom" ? (m = l, h = u === (await (i.isRTL == null ? void 0 : i.isRTL(a.floating)) ? "start" : "end") ? "left" : "right") : (h = l, m = u === "end" ? "top" : "bottom");
			let g = p - c.top - c.bottom, _ = f - c.left - c.right, v = fn(p - c[m], g), y = fn(f - c[h], _), b = t.middlewareData.shift, x = !b, S = v, C = y;
			b != null && b.enabled.x && (C = _), b != null && b.enabled.y && (S = g), x && !u && (d ? C = f - 2 * pn(c.left, c.right) : S = p - 2 * pn(c.top, c.bottom)), await o({
				...t,
				availableWidth: C,
				availableHeight: S
			});
			let w = await i.getDimensions(a.floating);
			return f !== w.width || p !== w.height ? { reset: { rects: !0 } } : {};
		}
	};
};
//#endregion
//#region node_modules/.pnpm/@floating-ui+dom@1.8.0/node_modules/@floating-ui/dom/dist/floating-ui.dom.mjs
function To(e) {
	let t = De(e), n = parseFloat(t.width) || 0, r = parseFloat(t.height) || 0, i = me(e), a = i ? e.offsetWidth : n, o = i ? e.offsetHeight : r, s = mn(n) !== a || mn(r) !== o;
	return s && (n = a, r = o), {
		width: n,
		height: r,
		$: s
	};
}
function Eo(e) {
	return K(e) ? e : e.contextElement;
}
function Do(e) {
	let t = Eo(e);
	if (!me(t)) return gn(1);
	let n = t.getBoundingClientRect(), { width: r, height: i, $: a } = To(t), o = (a ? mn(n.width) : n.width) / r, s = (a ? mn(n.height) : n.height) / i;
	return (!o || !Number.isFinite(o)) && (o = 1), (!s || !Number.isFinite(s)) && (s = 1), {
		x: o,
		y: s
	};
}
var Oo = /*#__PURE__*/ gn(0);
function ko(e) {
	let t = W(e);
	return !Te() || !t.visualViewport ? Oo : {
		x: t.visualViewport.offsetLeft,
		y: t.visualViewport.offsetTop
	};
}
function Ao(e, t, n) {
	return t === void 0 && (t = !1), !!n && t && n === W(e);
}
function $(e, t, n, r) {
	t === void 0 && (t = !1), n === void 0 && (n = !1);
	let i = e.getBoundingClientRect(), a = Eo(e), o = gn(1);
	t && (r ? K(r) && (o = Do(r)) : o = Do(e));
	let s = Ao(a, n, r) ? ko(a) : gn(0), c = (i.left + s.x) / o.x, l = (i.top + s.y) / o.y, u = i.width / o.x, d = i.height / o.y;
	if (a && r) {
		let e = W(a), t = K(r) ? W(r) : r, n = e, i = Me(n);
		for (; i && t !== n;) {
			let e = Do(i), t = i.getBoundingClientRect(), r = De(i), a = t.left + (i.clientLeft + parseFloat(r.paddingLeft)) * e.x, o = t.top + (i.clientTop + parseFloat(r.paddingTop)) * e.y;
			c *= e.x, l *= e.y, u *= e.x, d *= e.y, c += a, l += o, n = W(i), i = Me(n);
		}
	}
	return Rn({
		width: u,
		height: d,
		x: c,
		y: l
	});
}
function jo(e, t) {
	let n = Oe(e).scrollLeft;
	return t ? t.left + n : $(G(e)).left + n;
}
function Mo(e, t) {
	let n = e.getBoundingClientRect();
	return {
		x: n.left + t.scrollLeft - jo(e, n),
		y: n.top + t.scrollTop
	};
}
function No(e) {
	let { elements: t, rect: n, offsetParent: r, strategy: i } = e, a = i === "fixed", o = G(r), s = t ? ve(t.floating) : !1;
	if (r === o || s && a) return n;
	let c = {
		scrollLeft: 0,
		scrollTop: 0
	}, l = gn(1), u = gn(0), d = me(r);
	if ((d || !a) && ((fe(r) !== "body" || ge(o)) && (c = Oe(r)), d)) {
		let e = $(r);
		l = Do(r), u.x = e.x + r.clientLeft, u.y = e.y + r.clientTop;
	}
	let f = o && !d && !a ? Mo(o, c) : gn(0);
	return {
		width: n.width * l.x,
		height: n.height * l.y,
		x: n.x * l.x - c.scrollLeft * l.x + u.x + f.x,
		y: n.y * l.y - c.scrollTop * l.y + u.y + f.y
	};
}
function Po(e) {
	return e.getClientRects ? Array.from(e.getClientRects()) : [];
}
function Fo(e) {
	let t = Oe(e), n = e.ownerDocument.body, r = pn(e.scrollWidth, e.clientWidth, n.scrollWidth, n.clientWidth), i = pn(e.scrollHeight, e.clientHeight, n.scrollHeight, n.clientHeight), a = -t.scrollLeft + jo(e), o = -t.scrollTop;
	return De(n).direction === "rtl" && (a += pn(e.clientWidth, n.clientWidth) - r), {
		width: r,
		height: i,
		x: a,
		y: o
	};
}
var Io = 25;
function Lo(e, t, n) {
	n === void 0 && (n = "viewport");
	let r = n === "layoutViewport", i = W(e), a = G(e), o = i.visualViewport, s = a.clientWidth, c = a.clientHeight, l = 0, u = 0;
	if (o) {
		let e = !Te() || t === "fixed";
		r ? e || (l = -o.offsetLeft, u = -o.offsetTop) : (s = o.width, c = o.height, e && (l = o.offsetLeft, u = o.offsetTop));
	}
	if (jo(a) <= 0) {
		let e = a.ownerDocument, t = e.body, n = getComputedStyle(t), r = e.compatMode === "CSS1Compat" && parseFloat(n.marginLeft) + parseFloat(n.marginRight) || 0, i = Math.abs(a.clientWidth - t.clientWidth - r), o = getComputedStyle(a).scrollbarGutter === "stable both-edges" ? i / 2 : i;
		o <= Io && (s -= o);
	}
	return {
		width: s,
		height: c,
		x: l,
		y: u
	};
}
function Ro(e, t) {
	let n = $(e, !0, t === "fixed"), r = n.top + e.clientTop, i = n.left + e.clientLeft, a = Do(e);
	return {
		width: e.clientWidth * a.x,
		height: e.clientHeight * a.y,
		x: i * a.x,
		y: r * a.y
	};
}
function zo(e, t, n) {
	let r;
	if (t === "viewport" || t === "layoutViewport") r = Lo(e, n, t);
	else if (t === "document") r = Fo(G(e));
	else if (K(t)) r = Ro(t, n);
	else {
		let n = ko(e);
		r = {
			x: t.x - n.x,
			y: t.y - n.y,
			width: t.width,
			height: t.height
		};
	}
	return Rn(r);
}
function Bo(e, t) {
	let n = t.get(e);
	if (n) return n;
	let r = je(e, [], !1).filter((e) => K(e) && fe(e) !== "body"), i = null, a = De(e).position === "fixed", o = a ? ke(e) : e;
	for (; K(o) && !Ee(o);) {
		let e = De(o), t = Ce(o), n = i ? i.position : a ? "fixed" : "";
		!t && (n === "fixed" || n === "absolute" && e.position === "static") ? r = r.filter((e) => e !== o) : i = e, o = ke(o);
	}
	return t.set(e, r), r;
}
function Vo(e) {
	let { element: t, boundary: n, rootBoundary: r, strategy: i } = e, a = [...n === "clippingAncestors" ? ve(t) ? [] : Bo(t, this._c) : [].concat(n), r], o = zo(t, a[0], i), s = o.top, c = o.right, l = o.bottom, u = o.left;
	for (let e = 1; e < a.length; e++) {
		let n = zo(t, a[e], i);
		s = pn(n.top, s), c = fn(n.right, c), l = fn(n.bottom, l), u = pn(n.left, u);
	}
	return {
		width: c - u,
		height: l - s,
		x: u,
		y: s
	};
}
function Ho(e) {
	let { width: t, height: n } = To(e);
	return {
		width: t,
		height: n
	};
}
function Uo(e, t, n) {
	let r = me(t), i = G(t), a = n === "fixed", o = $(e, !0, a, t), s = {
		scrollLeft: 0,
		scrollTop: 0
	}, c = gn(0);
	if ((r || !a) && ((fe(t) !== "body" || ge(i)) && (s = Oe(t)), r)) {
		let e = $(t, !0, a, t);
		c.x = e.x + t.clientLeft, c.y = e.y + t.clientTop;
	}
	!r && i && (c.x = jo(i));
	let l = i && !r && !a ? Mo(i, s) : gn(0);
	return {
		x: o.left + s.scrollLeft - c.x - l.x,
		y: o.top + s.scrollTop - c.y - l.y,
		width: o.width,
		height: o.height
	};
}
function Wo(e) {
	return De(e).position === "static";
}
function Go(e, t) {
	if (!me(e) || De(e).position === "fixed") return null;
	if (t) return t(e);
	let n = e.offsetParent;
	return G(e) === n && (n = n.ownerDocument.body), n;
}
function Ko(e, t) {
	let n = W(e);
	if (ve(e)) return n;
	if (!me(e)) {
		let t = ke(e);
		for (; t && !Ee(t);) {
			if (K(t) && !Wo(t)) return t;
			t = ke(t);
		}
		return n;
	}
	let r = Go(e, t);
	for (; r && _e(r) && Wo(r);) r = Go(r, t);
	return r && Ee(r) && Wo(r) && !Ce(r) ? n : r || we(e) || n;
}
var qo = async function(e) {
	let t = this.getOffsetParent || Ko, n = this.getDimensions, r = await n(e.floating);
	return {
		reference: Uo(e.reference, await t(e.floating), e.strategy),
		floating: {
			x: 0,
			y: 0,
			width: r.width,
			height: r.height
		}
	};
};
function Jo(e) {
	return De(e).direction === "rtl";
}
var Yo = {
	convertOffsetParentRelativeRectToViewportRelativeRect: No,
	getDocumentElement: G,
	getClippingRect: Vo,
	getOffsetParent: Ko,
	getElementRects: qo,
	getClientRects: Po,
	getDimensions: Ho,
	getScale: Do,
	isElement: K,
	isRTL: Jo
};
function Xo(e, t) {
	return e.x === t.x && e.y === t.y && e.width === t.width && e.height === t.height;
}
function Zo(e, t, n) {
	let r = null, i, a = G(e);
	function o() {
		var e;
		clearTimeout(i), (e = r) == null || e.disconnect(), r = null;
	}
	function s(n, c) {
		n === void 0 && (n = !1), c === void 0 && (c = 1), o();
		let l = e.getBoundingClientRect(), { left: u, top: d, width: f, height: p } = l;
		if (n || t(), !f || !p) return;
		let m = hn(d), h = hn(a.clientWidth - (u + f)), g = hn(a.clientHeight - (d + p)), _ = hn(u), v = {
			rootMargin: -m + "px " + -h + "px " + -g + "px " + -_ + "px",
			threshold: pn(0, fn(1, c)) || 1
		}, y = !0;
		function b(t) {
			let n = t[0].intersectionRatio;
			if (!Xo(l, e.getBoundingClientRect())) return s();
			if (n !== c) {
				if (!y) return s();
				n ? s(!1, n) : i = setTimeout(() => {
					s(!1, 1e-7);
				}, 1e3);
			}
			y = !1;
		}
		try {
			r = new IntersectionObserver(b, {
				...v,
				root: a.ownerDocument
			});
		} catch {
			r = new IntersectionObserver(b, v);
		}
		r.observe(e);
	}
	let c = W(e), l = () => s(n);
	return c.addEventListener("resize", l), s(!0), () => {
		c.removeEventListener("resize", l), o();
	};
}
function Qo(e, t, n, r) {
	r === void 0 && (r = {});
	let { ancestorScroll: i = !0, ancestorResize: a = !0, elementResize: o = typeof ResizeObserver == "function", layoutShift: s = typeof IntersectionObserver == "function", animationFrame: c = !1 } = r, l = Eo(e), u = i || a ? [...l ? je(l) : [], ...t ? je(t) : []] : [];
	u.forEach((e) => {
		i && e.addEventListener("scroll", n), a && e.addEventListener("resize", n);
	});
	let d = l && s ? Zo(l, n, a) : null, f = -1, p = null;
	o && (p = new ResizeObserver((e) => {
		let [r] = e;
		r && r.target === l && p && t && (p.unobserve(t), cancelAnimationFrame(f), f = requestAnimationFrame(() => {
			var e;
			(e = p) == null || e.observe(t);
		})), n();
	}), l && !c && p.observe(l), t && p.observe(t));
	let m, h = c ? $(e) : null;
	c && g();
	function g() {
		let t = $(e);
		h && !Xo(h, t) && n(), h = t, m = requestAnimationFrame(g);
	}
	return n(), () => {
		var e;
		u.forEach((e) => {
			i && e.removeEventListener("scroll", n), a && e.removeEventListener("resize", n);
		}), d?.(), (e = p) == null || e.disconnect(), p = null, c && cancelAnimationFrame(m);
	};
}
var $o = xo, es = So, ts = vo, ns = wo, rs = Co, is = (e, t, n) => {
	let r = /* @__PURE__ */ new Map(), i = n ?? {}, a = {
		...Yo,
		...i.platform,
		_c: r
	};
	return _o(e, t, {
		...i,
		platform: a
	});
}, as = typeof document < "u" ? _.useLayoutEffect : function() {};
function os(e, t) {
	if (e === t) return !0;
	if (typeof e != typeof t) return !1;
	if (typeof e == "function" && e.toString() === t.toString()) return !0;
	let n, r, i;
	if (e && t && typeof e == "object") {
		if (Array.isArray(e)) {
			if (n = e.length, n !== t.length) return !1;
			for (r = n; r-- !== 0;) if (!os(e[r], t[r])) return !1;
			return !0;
		}
		if (i = Object.keys(e), n = i.length, n !== Object.keys(t).length) return !1;
		for (r = n; r-- !== 0;) if (!{}.hasOwnProperty.call(t, i[r])) return !1;
		for (r = n; r-- !== 0;) {
			let n = i[r];
			if (!(n === "_owner" && e.$$typeof) && !os(e[n], t[n])) return !1;
		}
		return !0;
	}
	return e !== e && t !== t;
}
function ss(e) {
	return typeof window > "u" ? 1 : (e.ownerDocument.defaultView || window).devicePixelRatio || 1;
}
function cs(e, t) {
	let n = ss(e);
	return Math.round(t * n) / n;
}
function ls(e) {
	let t = _.useRef(e);
	return as(() => {
		t.current = e;
	}), t;
}
function us(e) {
	e === void 0 && (e = {});
	let { placement: t = "bottom", strategy: n = "absolute", middleware: r = [], platform: i, elements: { reference: a, floating: o } = {}, transform: s = !0, whileElementsMounted: c, open: l } = e, [u, d] = _.useState({
		x: 0,
		y: 0,
		strategy: n,
		placement: t,
		middlewareData: {},
		isPositioned: !1
	}), [f, p] = _.useState(r);
	os(f, r) || p(r);
	let [m, h] = _.useState(null), [g, v] = _.useState(null), y = _.useCallback((e) => {
		e !== C.current && (C.current = e, h(e));
	}, []), b = _.useCallback((e) => {
		e !== w.current && (w.current = e, v(e));
	}, []), x = a || m, S = o || g, C = _.useRef(null), w = _.useRef(null), T = _.useRef(u), E = c != null, D = ls(c), O = ls(i), k = ls(l), A = _.useCallback(() => {
		if (!C.current || !w.current) return;
		let e = {
			placement: t,
			strategy: n,
			middleware: f
		};
		O.current && (e.platform = O.current), is(C.current, w.current, e).then((e) => {
			let t = {
				...e,
				isPositioned: k.current !== !1
			};
			j.current && !os(T.current, t) && (T.current = t, gi.flushSync(() => {
				d(t);
			}));
		});
	}, [
		f,
		t,
		n,
		O,
		k
	]);
	as(() => {
		l === !1 && T.current.isPositioned && (T.current.isPositioned = !1, d((e) => ({
			...e,
			isPositioned: !1
		})));
	}, [l]);
	let j = _.useRef(!1);
	as(() => (j.current = !0, () => {
		j.current = !1;
	}), []), as(() => {
		if (x && (C.current = x), S && (w.current = S), x && S) {
			if (D.current) return D.current(x, S, A);
			A();
		}
	}, [
		x,
		S,
		A,
		D,
		E
	]);
	let M = _.useMemo(() => ({
		reference: C,
		floating: w,
		setReference: y,
		setFloating: b
	}), [y, b]), ee = _.useMemo(() => ({
		reference: x,
		floating: S
	}), [x, S]), N = _.useMemo(() => {
		let e = {
			position: n,
			left: 0,
			top: 0
		};
		if (!ee.floating) return e;
		let t = cs(ee.floating, u.x), r = cs(ee.floating, u.y);
		return s ? {
			...e,
			transform: "translate(" + t + "px, " + r + "px)",
			...ss(ee.floating) >= 1.5 && { willChange: "transform" }
		} : {
			position: n,
			left: t,
			top: r
		};
	}, [
		n,
		s,
		ee.floating,
		u.x,
		u.y
	]);
	return _.useMemo(() => ({
		...u,
		update: A,
		refs: M,
		elements: ee,
		floatingStyles: N
	}), [
		u,
		A,
		M,
		ee,
		N
	]);
}
var ds = (e, t) => {
	let n = $o(e);
	return {
		name: n.name,
		fn: n.fn,
		options: [e, t]
	};
}, fs = (e, t) => {
	let n = es(e);
	return {
		name: n.name,
		fn: n.fn,
		options: [e, t]
	};
}, ps = (e, t) => ({
	fn: rs(e).fn,
	options: [e, t]
}), ms = (e, t) => {
	let n = ts(e);
	return {
		name: n.name,
		fn: n.fn,
		options: [e, t]
	};
}, hs = (e, t) => {
	let n = ns(e);
	return {
		name: n.name,
		fn: n.fn,
		options: [e, t]
	};
}, gs = /*#__PURE__*/ _.createContext(void 0);
function _s(e) {
	let t = _.useContext(gs);
	if (t === void 0 && !e) throw Error(Ji(47));
	return t;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/popover/store/PopoverStore.mjs
var vs = {
	...za,
	disabled: (e) => e.disabled,
	instantType: (e) => e.instantType === "trigger-change" && !za.open(e) ? void 0 : e.instantType,
	openMethod: (e) => e.openMethod,
	openChangeReason: (e) => e.openChangeReason,
	isPressOpenedByTrigger: (e, t) => e.openChangeReason === "trigger-press" && za.isOpenedByTrigger(e, t),
	isTouchPressOpen: (e, t) => t && e.openMethod === "touch" && e.openChangeReason === "trigger-press",
	hasTriggerFocusGuards: (e, t) => za.isOpenedByTrigger(e, t) && !e.focusManagerModal,
	modal: (e) => e.modal,
	titleElementId: (e) => e.titleElementId,
	descriptionElementId: (e) => e.descriptionElementId,
	openOnHover: (e) => e.openOnHover,
	closeDelay: (e) => e.closeDelay,
	adaptiveOrigin: (e) => e.adaptiveOrigin
}, ys = class extends Aa {
	constructor(e, t, n) {
		let r = new _a();
		super(bs(e, r, t, n), xs(r), vs);
	}
	setOpen = (e, t) => {
		let n = t.reason === wt, r = t.reason === "trigger-press" && t.event.detail === 0, i = !e && (t.reason === "escape-key" || t.reason == null), a = ua(t), o = this.select("activeTriggerId");
		if (!e && t.reason === "close-press" && t.trigger == null && o != null && (t.trigger = this.context.triggerElements.getById(o) ?? this.select("activeTriggerElement") ?? void 0), this.context.onOpenChange?.(e, t), t.isCanceled) return;
		this.state.floatingRootContext.dispatchOpenChange(e, t);
		let s = () => {
			let n = la(this.state, e, t.trigger, a());
			n.openChangeReason = t.reason, this.update(n);
		};
		n ? (this.context.stickIfOpen = !0, this.context.stickIfOpenTimeout.start(500, () => {
			this.context.stickIfOpen = !1;
		}), gi.flushSync(s)) : s();
		let c;
		r ? c = "click" : i ? c = "dismiss" : t.reason === "focus-out" && (c = "focus"), this.set("instantType", c);
	};
};
function bs(e, t, n, r = !1) {
	let i = {
		...Na(t, n, r),
		disabled: !1,
		modal: !1,
		focusManagerModal: !1,
		instantType: void 0,
		openMethod: null,
		openChangeReason: null,
		titleElementId: void 0,
		descriptionElementId: void 0,
		openOnHover: !1,
		closeDelay: 0,
		adaptiveOrigin: void 0,
		...e
	};
	return i.open && e?.mounted === void 0 && (i.mounted = !0), i;
}
function xs(e) {
	return {
		popupRef: /*#__PURE__*/ _.createRef(),
		onOpenChange: void 0,
		onOpenChangeComplete: void 0,
		triggerFocusTargetRef: /*#__PURE__*/ _.createRef(),
		beforeTriggerFocusGuardRef: /*#__PURE__*/ _.createRef(),
		beforeContentFocusGuardRef: /*#__PURE__*/ _.createRef(),
		stickIfOpenTimeout: new M(),
		stickIfOpen: !0,
		triggerElements: e
	};
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/popover/root/PopoverRoot.mjs
var Ss = w(function({ props: e }) {
	let { children: t, open: n, defaultOpen: r = !1, onOpenChange: i, onOpenChangeComplete: a, modal: o = !1, handle: s, triggerId: c, defaultTriggerId: l = null } = e, u = ws(s, {
		modal: o,
		open: r,
		openProp: n,
		activeTriggerId: l,
		triggerIdProp: c
	});
	u.useControlledProp("openProp", n), u.useControlledProp("triggerIdProp", c);
	let d = u.useState("open"), f = u.useState("mounted"), p = u.useState("payload");
	u.useContextCallback("onOpenChange", i), u.useContextCallback("onOpenChangeComplete", a), ga(u, d), pa(u);
	let { forceUnmount: m } = ma(d, u, () => {
		u.context.stickIfOpen = !0, u.set("openChangeReason", null);
	});
	u.useSyncedValues({ modal: o }), _.useEffect(() => {
		d || u.context.stickIfOpenTimeout.clear();
	}, [u, d]), _.useImperativeHandle(e.actionsRef, () => ({
		unmount: m,
		close: () => u.setOpen(!1, J(Lt))
	}), [m, u]);
	let h = d || f || s != null;
	return /*#__PURE__*/ (0, Y.jsxs)(gs.Provider, {
		value: u,
		children: [
			s && /*#__PURE__*/ (0, Y.jsx)(oa, {
				handle: s,
				store: u
			}),
			h && /*#__PURE__*/ (0, Y.jsx)(Ts, {
				store: u,
				modal: o
			}),
			typeof t == "function" ? t({ payload: p }) : t
		]
	});
});
function Cs(e) {
	return _s(!0) ? /*#__PURE__*/ (0, Y.jsx)(Ss, { props: e }) : /*#__PURE__*/ (0, Y.jsx)(Ai, { children: /*#__PURE__*/ (0, Y.jsx)(Ss, { props: e }) });
}
function ws(e, t) {
	let n = aa((e, n) => new ys(t, e, n));
	return _.useEffect(() => n.context.stickIfOpenTimeout.disposeEffect(), [n]), n;
}
function Ts({ store: e, modal: t }) {
	let n = Q(e.useState("floatingRootContext"), { outsidePressEvent: {
		mouse: t === "trap-focus" ? "sloppy" : "intentional",
		touch: "sloppy"
	} }), r = n.reference, i = n.floating;
	return ha(e, {
		activeTriggerProps: r,
		inactiveTriggerProps: r,
		popupProps: i
	}), null;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/composite/root/CompositeRootContext.mjs
var Es = /*#__PURE__*/ _.createContext(void 0);
function Ds(e = !1) {
	let t = _.useContext(Es);
	if (t === void 0 && !e) throw Error(Ji(16));
	return t;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/utils/useFocusableWhenDisabled.mjs
function Os(e) {
	let { focusableWhenDisabled: t, disabled: n, composite: r = !1, tabIndex: i = 0, isNativeButton: a } = e, o = r && t !== !1, s = r && t === !1;
	return { props: _.useMemo(() => {
		let e = { onKeyDown(e) {
			n && t && e.key !== "Tab" && e.preventDefault();
		} };
		return r || (e.tabIndex = i, !a && n && (e.tabIndex = t ? i : -1)), (a && (t || o) || !a && n) && (e["aria-disabled"] = n), a && (!t || s) && (e.disabled = n), e;
	}, [
		r,
		n,
		t,
		o,
		s,
		a,
		i
	]) };
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/utils/dispatchClickWithModifiers.mjs
function ks(e, t, { detail: n = 0, pointerType: r = "" } = {}) {
	e.dispatchEvent(new (W(e)).PointerEvent("click", {
		bubbles: !0,
		cancelable: !0,
		composed: !0,
		detail: n,
		pointerType: r,
		shiftKey: t.shiftKey,
		ctrlKey: t.ctrlKey,
		altKey: t.altKey,
		metaKey: t.metaKey
	}));
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/use-button/useButton.mjs
function As(e = {}) {
	let { disabled: t = !1, focusableWhenDisabled: n, tabIndex: r = 0, native: i = !0, composite: a } = e, o = _.useRef(null), s = Ds(!0), c = a ?? s !== void 0, { props: l } = Os({
		focusableWhenDisabled: n,
		disabled: t,
		composite: c,
		tabIndex: r,
		isNativeButton: i
	}), u = _.useCallback(() => {
		let e = o.current;
		js(e) && c && t && l.disabled === void 0 && e.disabled && (e.disabled = !1);
	}, [
		t,
		l.disabled,
		c
	]);
	return N(u, [u]), {
		getButtonProps: _.useCallback((e = {}) => {
			let { onClick: n, onMouseDown: r, onKeyUp: a, onKeyDown: o, onPointerDown: s, ...u } = e;
			return Gr({
				onClick(e) {
					if (t) {
						e.preventDefault();
						return;
					}
					n?.(e);
				},
				onMouseDown(e) {
					t || r?.(e);
				},
				onKeyDown(e) {
					if (t || (ti(e), o?.(e), e.baseUIHandlerPrevented)) return;
					let n = e.target === e.currentTarget, r = e.currentTarget, a = js(r), s = !i && Ms(r), l = n && (i ? a : !s), u = e.key === "Enter", d = e.key === " ", f = r.getAttribute("role"), p = f?.startsWith("menuitem") || f === "option" || f === "gridcell";
					if (n && c && d) {
						if (e.defaultPrevented && p) return;
						e.preventDefault(), (!i || a) && (e.preventBaseUIHandler(), ks(r, e));
						return;
					}
					if (!l || i || !d && !u) {
						n && s && d && e.preventDefault();
						return;
					}
					e.defaultPrevented || (e.preventDefault(), u && (e.preventBaseUIHandler(), ks(r, e)));
				},
				onKeyUp(e) {
					if (!t) {
						if (ti(e), a?.(e), e.target === e.currentTarget && i && c && js(e.currentTarget) && e.key === " ") {
							e.preventDefault();
							return;
						}
						e.baseUIHandlerPrevented || e.target === e.currentTarget && !i && !c && !e.defaultPrevented && e.key === " " && (e.preventBaseUIHandler(), ks(e.currentTarget, e));
					}
				},
				onPointerDown(e) {
					if (t) {
						e.preventDefault();
						return;
					}
					s?.(e);
				}
			}, i ? { type: "button" } : { role: "button" }, l, u);
		}, [
			t,
			l,
			c,
			i
		]),
		buttonRef: Z((e) => {
			o.current = e, u();
		})
	};
}
function js(e) {
	return me(e) && e.tagName === "BUTTON";
}
function Ms(e) {
	return me(e) && e.tagName === "A" && !!e.href;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/useBaseUiId.mjs
function Ns(e) {
	return Ir(e, "base-ui");
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/utils/popups/useTriggerFocusGuards.mjs
function Ps(e, t) {
	function n(n, r, i) {
		let a = n.currentTarget;
		gi.flushSync(() => {
			e.setOpen(!1, J(kt, n.nativeEvent, a));
		}), fr(a.isConnected ? a : t.current, r, i)?.focus();
	}
	function r(t) {
		n(t, -1, e.select("positionerElement"));
	}
	function i(t) {
		let r = e.select("positionerElement");
		r && pr(t, r) ? e.context.beforeContentFocusGuardRef.current?.focus() : n(t, 1, r);
	}
	return {
		handlePreFocusGuardFocus: r,
		handleFocusTargetFocus: i
	};
}
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.5.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/useEnhancedClickHandler.mjs
function Fs(e) {
	let t = _.useRef(""), n = _.useCallback((n) => {
		n.defaultPrevented || (t.current = n.pointerType, e(n, n.pointerType));
	}, [e]);
	return {
		onClick: _.useCallback((n) => {
			if (n.detail === 0) {
				e(n, "keyboard");
				return;
			}
			"pointerType" in n ? e(n, n.pointerType) : e(n, t.current), t.current = "";
		}, [e]),
		onPointerDown: n
	};
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/useValueChanged.mjs
function Is(e, t) {
	let n = _.useRef(e), r = Z(t);
	N(() => {
		n.current !== e && r(n.current), n.current = e;
	}, [e, r]);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/utils/useOpenInteractionType.mjs
function Ls(e, t) {
	let { onClick: n, onPointerDown: r } = Fs(Z((n, r) => {
		(typeof e == "function" ? e() : e) || t(r || (ne ? "touch" : ""));
	}));
	return _.useMemo(() => ({
		onClick: n,
		onPointerDown: r
	}), [n, r]);
}
function Rs(e) {
	let [t, n] = _.useState(null), r = Ls(e, n);
	return Is(e, (t) => {
		t && !e && n(null);
	}), _.useMemo(() => ({
		openMethod: t,
		triggerProps: r
	}), [t, r]);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/popover/trigger/PopoverTrigger.mjs
var zs = T(function(e, t) {
	let { render: n, className: r, style: i, disabled: a = !1, nativeButton: o = !0, handle: s, payload: c, openOnHover: l = !1, delay: u = 300, closeDelay: d = 0, id: f, ...p } = e, m = _s(!0), h = Ba(s) ?? m;
	if (!h) throw Error(Ji(74));
	let g = Ns(f), v = h.useState("isTriggerActive", g), y = h.useState("floatingRootContext"), b = h.useState("isOpenedByTrigger", g), x = h.useState("triggerPopupId", g), S = _.useRef(null), { registerTrigger: C, isMountedByThisTrigger: w } = fa(g, S, h, {
		payload: c,
		disabled: a,
		openOnHover: l,
		closeDelay: d
	}), T = h.useState("isPressOpenedByTrigger", g), E = h.useState("isTouchPressOpen", l), D = h.useState("hasTriggerFocusGuards", g), O = Xa(y, {
		enabled: !a && l && !E,
		mouseOnly: !0,
		move: !1,
		handleClose: po(),
		restMs: u,
		delay: { close: d },
		triggerElementRef: S,
		isActiveTrigger: v,
		isClosing: () => h.select("transitionStatus") === "ending"
	}), k = Vi(y, { stickIfOpen: Z(() => h.context.stickIfOpen) }), A = Ls(() => h.select("open"), (e) => {
		h.set("openMethod", e);
	}), j = h.useState("triggerProps", w), { getButtonProps: M, buttonRef: ee } = As({
		disabled: a,
		native: o
	}), N = { open(e) {
		return T ? it.open(e) : rt.open(e);
	} }, { handlePreFocusGuardFocus: P, handleFocusTargetFocus: F } = Ps(h, S), I = ii("button", e, {
		state: {
			disabled: a,
			open: b
		},
		ref: [
			ee,
			t,
			C,
			S
		],
		props: [
			k.reference,
			O,
			j,
			A,
			{
				[fi]: "",
				id: g,
				"aria-haspopup": "dialog",
				"aria-expanded": b,
				"aria-controls": x
			},
			p,
			M
		],
		stateAttributesMapping: N
	}), L = /*#__PURE__*/ (0, Y.jsx)(_.Fragment, { children: I }, g);
	return D ? /*#__PURE__*/ (0, Y.jsxs)(_.Fragment, { children: [
		/*#__PURE__*/ (0, Y.jsx)(dn, {
			ref: h.context.beforeTriggerFocusGuardRef,
			onFocus: P
		}),
		L,
		/*#__PURE__*/ (0, Y.jsx)(dn, {
			ref: h.context.triggerFocusTargetRef,
			onFocus: F
		})
	] }) : L;
}), Bs = /*#__PURE__*/ _.createContext(void 0);
function Vs() {
	let e = _.useContext(Bs);
	if (e === void 0) throw Error(Ji(45));
	return e;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/popover/portal/PopoverPortal.mjs
var Hs = /*#__PURE__*/ _.forwardRef(function(e, t) {
	let { keepMounted: n = !1, ...r } = e;
	return _s().useState("mounted") || n ? /*#__PURE__*/ (0, Y.jsx)(Bs.Provider, {
		value: n,
		children: /*#__PURE__*/ (0, Y.jsx)(xi, {
			ref: t,
			...r
		})
	}) : null;
});
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.5.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/inertValue.mjs
function Us(e) {
	return Rr(19) ? e : e ? "true" : void 0;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/popover/positioner/PopoverPositionerContext.mjs
var Ws = /*#__PURE__*/ _.createContext(void 0);
function Gs() {
	let e = _.useContext(Ws);
	if (!e) throw Error(Ji(46));
	return e;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/hooks/useFloating.mjs
function Ks(e) {
	let { nodeId: t, externalTree: n, rootContext: r } = e, i = r.useState("referenceElement"), a = r.useState("floatingElement"), o = r.useState("domReferenceElement"), s = r.useState("open"), c = r.useState("floatingId"), [l, u] = _.useState(null), d = _.useRef(null), f = Di(n), p = _.useMemo(() => ({
		reference: i,
		floating: a,
		domReference: o
	}), [
		i,
		a,
		o
	]), m = us({
		...e,
		elements: {
			...p,
			...l && { reference: l }
		}
	}), h = _.useCallback((e) => {
		let t = K(e) ? {
			getBoundingClientRect: () => e.getBoundingClientRect(),
			getClientRects: () => e.getClientRects(),
			contextElement: e
		} : e;
		u(t), m.refs.setReference(t);
	}, [m.refs]), g = _.useMemo(() => ({
		...m.refs,
		setPositionReference: h,
		domReference: d
	}), [m.refs, h]), v = _.useMemo(() => ({
		...m.elements,
		domReference: o
	}), [m.elements, o]), y = _.useMemo(() => ({
		...m,
		dataRef: r.context.dataRef,
		open: s,
		onOpenChange: r.setOpen,
		events: r.context.events,
		floatingId: c,
		refs: g,
		elements: v,
		nodeId: t,
		rootStore: r
	}), [
		m,
		g,
		v,
		t,
		r,
		s,
		c
	]);
	return N(() => {
		o && (d.current = o);
	}, [o]), N(() => {
		r.context.dataRef.current.floatingContext = y;
		let e = f?.nodesRef.current.find((e) => e.id === t);
		e && (e.context = y);
	}), _.useMemo(() => ({
		...m,
		context: y,
		refs: g,
		elements: v,
		rootStore: r
	}), [
		m,
		g,
		v,
		y,
		r
	]);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/direction-context/DirectionContext.mjs
var qs = /*#__PURE__*/ _.createContext(void 0);
function Js() {
	return _.useContext(qs)?.direction ?? "ltr";
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/middleware/arrow.mjs
var Ys = (e) => ({
	name: "arrow",
	options: e,
	async fn(t) {
		let { x: n, y: r, placement: i, rects: a, platform: o, elements: s, middlewareData: c } = t, { element: l, padding: u = 0 } = yn(e, t) || {};
		if (l == null) return {};
		let d = Ln(u), f = {
			x: n,
			y: r
		}, p = Tn(i), m = Cn(p), h = await o.getDimensions(l), g = p === "y", _ = g ? "top" : "left", v = g ? "bottom" : "right", y = g ? "clientHeight" : "clientWidth", b = a.reference[m] + a.reference[p] - f[p] - a.floating[m], x = f[p] - a.reference[p], S = s.floating[y] || a.floating[m], C = b / 2 - x / 2, w = S / 2 - h[m] / 2 - 1, T = Math.min(d[_], w), E = Math.min(d[v], w), D = T, O = S - h[m] - E, k = S / 2 - h[m] / 2 + C, A = vn(D, k, O), j = !c.arrow && xn(i) != null && k !== A && a.reference[m] / 2 - (k < D ? T : E) - h[m] / 2 < 0, M = j ? k < D ? k - D : k - O : 0;
		return {
			[p]: f[p] + M,
			data: {
				[p]: A,
				centerOffset: k - A - M,
				...j && { alignmentOffset: M }
			},
			reset: j
		};
	}
}), Xs = (e, t) => {
	let { name: n, fn: r } = Ys(e);
	return {
		name: n,
		fn: r,
		options: [e, t]
	};
}, Zs = {
	name: "hide",
	async fn(e) {
		let { width: t, height: n, x: r, y: i } = e.rects.reference, a = t === 0 && n === 0 && r === 0 && i === 0, o = await e.platform.detectOverflow(e, { elementContext: "reference" });
		return { data: { referenceHidden: o.top - n >= 0 || o.right - t >= 0 || o.bottom - n >= 0 || o.left - t >= 0 || a } };
	}
}, Qs = {
	sideX: "left",
	sideY: "top"
}, $s = "--available-width", ec = "--available-height", tc = "--anchor-width", nc = "--anchor-height", rc = "--transform-origin", ic = $s, ac = ec;
function oc(e, t, n) {
	let r = e === "inline-start" || e === "inline-end";
	return {
		top: "top",
		right: r ? n ? "inline-start" : "inline-end" : "right",
		bottom: "bottom",
		left: r ? n ? "inline-end" : "inline-start" : "left"
	}[t];
}
function sc(e, t, n) {
	let { rects: r, placement: i } = e;
	return {
		side: oc(t, bn(i), n),
		align: xn(i) || "center",
		anchor: {
			width: r.reference.width,
			height: r.reference.height
		},
		positioner: {
			width: r.floating.width,
			height: r.floating.height
		}
	};
}
function cc(e) {
	return lc(e, Ks);
}
function lc(e, t) {
	let { anchor: n, positionMethod: r = "absolute", side: i = "bottom", sideOffset: a = 0, align: o = "center", alignOffset: s = 0, collisionBoundary: c, collisionPadding: l = 5, sticky: u = !1, arrowPadding: d = 5, disableAnchorTracking: f = !1, inline: p, keepMounted: m = !1, floatingRootContext: h, mounted: g, collisionAvoidance: v, shift: y, nodeId: b, adaptiveOrigin: x, lazyFlip: S = !1, externalTree: C } = e, w = v.side || "flip", T = v.align || "flip", E = v.fallbackAxisSide || "end", D = y?.crossAxis ?? !1, O = y?.rootBoundary, k = typeof n == "function" ? n : void 0, A = Z(k), j = k ? A : n, M = Xt(n), ee = Xt(g), P = Js() === "rtl", [F, I] = _.useState(null);
	!g && F !== null && I(null);
	let L = S === "placement", te = F ? bn(F) : null, R = F && L ? xn(F) || "center" : null, ne = te || {
		top: "top",
		right: "right",
		bottom: "bottom",
		left: "left",
		"inline-end": P ? "left" : "right",
		"inline-start": P ? "right" : "left"
	}[i], re = R || o, z = re === "center" ? ne : `${ne}-${re}`, B = l;
	typeof B == "number" ? B = {
		top: B,
		right: B,
		bottom: B,
		left: B
	} : B &&= {
		top: B.top || 0,
		right: B.right || 0,
		bottom: B.bottom || 0,
		left: B.left || 0
	};
	let ie = +(i === "bottom"), ae = +(i === "top"), oe = +(i === "right"), se = +(i === "left"), ce = {
		boundary: c === "clipping-ancestors" ? "clippingAncestors" : c,
		padding: B
	}, V = _.useRef(null), H = Xt(a), U = Xt(s), le = typeof a == "function" ? 0 : a, ue = typeof s == "function" ? 0 : s, de = [];
	p && de.push(p), de.push(ds((e) => {
		let t = sc(e, i, P), n = typeof H.current == "function" ? H.current(t) : H.current, r = typeof U.current == "function" ? U.current(t) : U.current;
		return {
			mainAxis: n,
			crossAxis: r,
			alignmentAxis: r
		};
	}, [
		le,
		ue,
		P,
		i
	]));
	let fe = T === "none" && w !== "shift", G = !fe && (u || D || w === "shift"), pe = w === "none" ? null : ms({
		...ce,
		padding: {
			top: B.top + 1 + ie,
			right: B.right + 1 + se,
			bottom: B.bottom + 1 + ae,
			left: B.left + 1 + oe
		},
		mainAxis: !D && w === "flip",
		crossAxis: T === "flip" && "alignment",
		fallbackAxisSideDirection: E
	}), K = fe ? null : fs({
		...ce,
		rootBoundary: O,
		mainAxis: T !== "none",
		crossAxis: G,
		limiter: u || D ? void 0 : ps((e) => {
			if (!V.current) return {};
			let { width: t, height: n } = V.current.getBoundingClientRect(), r = wn(bn(e.placement)), i = r === "y" ? t : n, a = r === "y" ? B.left + B.right : B.top + B.bottom;
			return { offset: i / 2 + a / 2 };
		})
	}, [
		ce,
		u,
		D,
		O,
		B,
		T
	]);
	w === "shift" || T === "shift" || re === "center" ? de.push(K, pe) : de.push(pe, K), de.push(hs({
		...ce,
		apply({ elements: { floating: e }, availableWidth: t, availableHeight: n, rects: r }) {
			if (!ee.current) return;
			let i = e.style;
			i.setProperty(ic, `${t}px`), i.setProperty(ac, `${n}px`);
			let a = W(e).devicePixelRatio || 1, { x: o, y: s, width: c, height: l } = r.reference, u = (Math.round((o + c) * a) - Math.round(o * a)) / a, d = (Math.round((s + l) * a) - Math.round(s * a)) / a;
			i.setProperty(tc, `${u}px`), i.setProperty(nc, `${d}px`);
		}
	}), Xs((e) => ({
		element: V.current || cn(e.elements.floating).createElement("div"),
		padding: V.current ? d : 0
	}), [d]), {
		name: "transformOrigin",
		fn(e) {
			let { elements: { floating: t }, middlewareData: n, placement: r, platform: o, rects: s, y: c } = e, l = bn(r), u = xn(r), d = wn(l) === "y", f = V.current, p = typeof a == "function" ? a(sc(e, i, P)) : a, m;
			m = !f && u && Math.abs(d ? n.shift?.x || 0 : n.shift?.y || 0) <= 1 ? u === "start" === (d && o.isRTL?.(t) === !0) ? "100%" : "0%" : `${(d ? n.arrow?.x || 0 : n.arrow?.y || 0) + (d ? f?.clientWidth || 0 : f?.clientHeight || 0) / 2}px`;
			let h = l === "top" || l === "left" ? `calc(100% + ${p}px)` : `${-p}px`;
			return G && d && Math.abs(n.shift?.y || 0) > p && (h = `${s.reference.y + s.reference.height / 2 - c}px`), t.style.setProperty(rc, d ? `${m} ${h}` : `${h} ${m}`), {};
		}
	}, Zs, x), N(() => {
		!g && h && h.update({
			referenceElement: null,
			floatingElement: null,
			domReferenceElement: null,
			positionReference: null
		});
	}, [g, h]);
	let me = _.useMemo(() => ({
		ancestorScroll: !f,
		elementResize: !f && typeof ResizeObserver < "u",
		layoutShift: !f && typeof IntersectionObserver < "u"
	}), [f]), { refs: he, elements: ge, x: _e, y: ve, middlewareData: ye, update: be, placement: xe, context: Se, isPositioned: Ce, floatingStyles: we } = t({
		rootContext: h,
		open: m ? g : void 0,
		placement: z,
		middleware: de,
		strategy: r,
		whileElementsMounted: m ? void 0 : (...e) => Qo(...e, me),
		nodeId: b,
		externalTree: C
	}), { sideX: Te, sideY: Ee } = ye.adaptiveOrigin || Qs, De = Ce ? r : "fixed", Oe = _.useMemo(() => {
		let e;
		return e = Ce ? x ? {
			position: De,
			[Te]: _e,
			[Ee]: ve
		} : {
			...we,
			position: De
		} : {
			position: De,
			top: 0,
			left: 0
		}, e[ic] = "100vw", e[ac] = "100vh", Ce || (e.opacity = 0), e;
	}, [
		x,
		De,
		Te,
		_e,
		Ee,
		ve,
		we,
		Ce
	]), ke = _.useRef(null);
	N(() => {
		if (!g) return;
		let e = M.current, t = typeof e == "function" ? e() : e, n = (uc(t) ? t.current : t) || null;
		n !== ke.current && (he.setPositionReference(n), ke.current = n);
	}, [
		g,
		he,
		j,
		M
	]), _.useEffect(() => {
		if (!g) return;
		let e = M.current;
		typeof e != "function" && uc(e) && e.current !== ke.current && (he.setPositionReference(e.current), ke.current = e.current);
	}, [
		g,
		he,
		j,
		M
	]), _.useEffect(() => {
		if (m && g && ge.reference && ge.floating) return Qo(ge.reference, ge.floating, be, me);
	}, [
		m,
		g,
		ge,
		be,
		me
	]);
	let Ae = bn(xe), je = oc(i, Ae, P), Me = xn(xe) || "center", Ne = !!ye.hide?.referenceHidden;
	N(() => {
		S && g && Ce && (Ae !== ne || L && Me !== re) && I(xe);
	}, [
		S,
		L,
		g,
		Ce,
		xe,
		Ae,
		Me,
		ne,
		re
	]);
	let q = _.useMemo(() => ({
		position: "absolute",
		top: ye.arrow?.y,
		left: ye.arrow?.x
	}), [ye.arrow]), Pe = ye.arrow?.centerOffset !== 0;
	return _.useMemo(() => ({
		positionerStyles: Oe,
		arrowStyles: q,
		arrowRef: V,
		arrowUncentered: Pe,
		side: je,
		align: Me,
		physicalSide: Ae,
		anchorHidden: Ne,
		refs: he,
		context: Se,
		isPositioned: Ce,
		update: be
	}), [
		Oe,
		q,
		V,
		Pe,
		je,
		Me,
		Ae,
		Ne,
		he,
		Se,
		Ce,
		be
	]);
}
function uc(e) {
	return e != null && "current" in e;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/utils/InternalBackdrop.mjs
var dc = /*#__PURE__*/ _.forwardRef(function(e, t) {
	let { cutout: n, ...r } = e, i;
	if (n) {
		let e = n.getBoundingClientRect();
		i = `polygon(0% 0%,100% 0%,100% 100%,0% 100%,0% 0%,${e.left}px ${e.top}px,${e.left}px ${e.bottom}px,${e.right}px ${e.bottom}px,${e.right}px ${e.top}px,${e.left}px ${e.top}px)`;
	}
	return /*#__PURE__*/ (0, Y.jsx)("div", {
		ref: t,
		role: "presentation",
		"data-base-ui-inert": "",
		...r,
		style: {
			position: "fixed",
			inset: 0,
			userSelect: "none",
			WebkitUserSelect: "none",
			clipPath: i
		}
	});
});
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/useTriggerSwitchTransition.mjs
function fc(e) {
	let { store: t, domReference: n, positionerElement: r, open: i } = e, a = _.useRef(null), o = _.useRef(null), s = ea(r);
	N(() => {
		i || (o.current?.abort(), o.current = null, t.state.instantType === "trigger-change" && t.set("instantType", void 0));
	}, [i, t]), N(() => {
		let e = n, r = a.current;
		if (e && (a.current = e), !r || !e || e === r || !t.select("open")) return;
		t.set("instantType", void 0);
		let i = new AbortController();
		return o.current = i, s(() => {
			t.select("open") && t.set("instantType", "trigger-change");
		}, i.signal), () => {
			i.abort();
		};
	}, [
		n,
		s,
		t
	]);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/getDisabledMountTransitionStyles.mjs
function pc(e) {
	return e === "starting" ? di : k;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/utils/usePositioner.mjs
function mc(e, t, { styles: n, transitionStatus: r, props: i, refs: a, hidden: o, inert: s = !1 }) {
	let c = { ...n };
	return s && (c.pointerEvents = "none"), ii("div", e, {
		state: t,
		ref: a,
		props: [
			{
				role: "presentation",
				hidden: o,
				style: c
			},
			pc(r),
			i
		],
		stateAttributesMapping: at
	});
}
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.5.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/useScrollLock.mjs
var hc = {}, gc = {}, _c = "";
function vc(e, t) {
	return ge(e) ? e : t;
}
function yc(e, t, n) {
	return /hidden|clip/.test(e.getComputedStyle(vc(t, n)).overflowY);
}
function bc(e) {
	if (typeof document > "u") return !1;
	let t = cn(e);
	return W(t).innerWidth - t.documentElement.clientWidth > 0;
}
function xc(e) {
	if (!(typeof CSS < "u" && CSS.supports && CSS.supports("scrollbar-gutter", "stable")) || typeof document > "u") return !1;
	let t = cn(e), n = t.documentElement, r = t.body, i = vc(n, r), a = i.style.overflowY, o = n.style.scrollbarGutter;
	n.style.scrollbarGutter = "stable", i.style.overflowY = "scroll";
	let s = i.offsetWidth;
	i.style.overflowY = "hidden";
	let c = i.offsetWidth;
	return i.style.overflowY = a, n.style.scrollbarGutter = o, s === c;
}
function Sc(e) {
	let t = cn(e), n = t.documentElement, r = t.body, i = vc(n, r), a = {
		overflowY: i.style.overflowY,
		overflowX: i.style.overflowX
	};
	return Object.assign(i.style, {
		overflowY: "hidden",
		overflowX: "hidden"
	}), () => {
		Object.assign(i.style, a);
	};
}
function Cc(e) {
	let t = cn(e), n = t.documentElement, r = t.body, i = W(n), a = 0, o = 0, s = !1, c = on.create();
	if (ae && (i.visualViewport?.scale ?? 1) !== 1) return () => {};
	function l() {
		let t = i.getComputedStyle(n), c = i.getComputedStyle(r), l = (t.scrollbarGutter || "").includes("both-edges") ? "stable both-edges" : "stable";
		a = n.scrollTop, o = n.scrollLeft, hc = {
			scrollbarGutter: n.style.scrollbarGutter,
			overflowY: n.style.overflowY,
			overflowX: n.style.overflowX
		}, _c = n.style.scrollBehavior, gc = {
			position: r.style.position,
			height: r.style.height,
			width: r.style.width,
			boxSizing: r.style.boxSizing,
			overflowY: r.style.overflowY,
			overflowX: r.style.overflowX,
			scrollBehavior: r.style.scrollBehavior
		};
		let u = n.scrollHeight > n.clientHeight, d = n.scrollWidth > n.clientWidth, f = t.overflowY === "scroll" || c.overflowY === "scroll", p = t.overflowX === "scroll" || c.overflowX === "scroll", m = Math.max(0, i.innerWidth - r.clientWidth), h = Math.max(0, i.innerHeight - r.clientHeight), g = parseFloat(c.marginTop) + parseFloat(c.marginBottom), _ = parseFloat(c.marginLeft) + parseFloat(c.marginRight), v = vc(n, r);
		if (s = xc(e), s) {
			n.style.scrollbarGutter = l, v.style.overflowY = "hidden", v.style.overflowX = "hidden";
			return;
		}
		Object.assign(n.style, {
			scrollbarGutter: l,
			overflowY: "hidden",
			overflowX: "hidden"
		}), (u || f) && (n.style.overflowY = "scroll"), (d || p) && (n.style.overflowX = "scroll"), Object.assign(r.style, {
			position: "relative",
			height: g || h ? `calc(100dvh - ${g + h}px)` : "100dvh",
			width: _ || m ? `calc(100vw - ${_ + m}px)` : "100vw",
			boxSizing: "border-box",
			overflowY: "hidden",
			overflowX: "hidden",
			scrollBehavior: "unset"
		}), r.scrollTop = a, r.scrollLeft = o, n.setAttribute("data-base-ui-scroll-locked", ""), n.style.scrollBehavior = "unset";
	}
	function u() {
		Object.assign(n.style, hc), Object.assign(r.style, gc), s || (n.scrollTop = a, n.scrollLeft = o, n.removeAttribute("data-base-ui-scroll-locked"), n.style.scrollBehavior = _c);
	}
	function d() {
		u(), c.request(l);
	}
	l();
	let f = X(i, "resize", d);
	return () => {
		c.cancel(), u(), typeof i.removeEventListener == "function" && f();
	};
}
var wc = new class {
	lockCount = 0;
	restore = null;
	timeoutLock = M.create();
	timeoutUnlock = M.create();
	acquire(e) {
		return this.lockCount += 1, this.lockCount === 1 && this.restore === null && this.timeoutLock.start(0, () => this.lock(e)), this.release;
	}
	release = () => {
		--this.lockCount, this.lockCount === 0 && this.restore && this.timeoutUnlock.start(0, this.unlock);
	};
	unlock = () => {
		this.lockCount === 0 && this.restore && (this.restore?.(), this.restore = null);
	};
	lock(e) {
		if (this.lockCount === 0 || this.restore !== null) return;
		let t = cn(e), n = t.documentElement, r = t.body, i = W(n);
		if (yc(i, n, r)) {
			let t = new i.MutationObserver(() => {
				yc(i, n, r) || (t.disconnect(), this.restore = null, this.lock(e));
			}), a = { attributes: !0 };
			t.observe(n, a), t.observe(r, a), this.restore = () => t.disconnect();
			return;
		}
		let a = ne || !bc(e);
		this.restore = a ? Sc(e) : Cc(e);
	}
}();
function Tc(e = !0, t = null) {
	N(() => {
		if (e) return wc.acquire(t);
	}, [e, t]);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/utils/useAnchoredPopupScrollLock.mjs
var Ec = 20;
function Dc(e, t, n, r) {
	let [i, a] = _.useState(!1);
	N(() => {
		if (!e || !t || n == null) {
			a(!1);
			return;
		}
		let r = cn(n).documentElement.clientWidth, i = n.offsetWidth;
		a(r > 0 && i > 0 && i >= r - Ec);
	}, [
		e,
		t,
		n
	]), Tc(e && (!t || i), r);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/popover/positioner/PopoverPositioner.mjs
var Oc = /*#__PURE__*/ _.forwardRef(function(e, t) {
	let { render: n, className: r, style: i, anchor: a, positionMethod: o, side: s, align: c, sideOffset: l, alignOffset: u, collisionBoundary: d = "clipping-ancestors", collisionPadding: f, arrowPadding: p, sticky: m, disableAnchorTracking: h = !1, collisionAvoidance: g = mi, ..._ } = e, v = _s(), y = Vs(), b = Oi(), x = v.useState("floatingRootContext"), S = v.useState("mounted"), C = v.useState("open"), w = v.useState("openChangeReason"), T = v.useState("activeTriggerElement"), E = v.useState("modal"), D = v.useState("openMethod"), O = v.useState("positionerElement"), k = v.useState("instantType"), A = v.useState("transitionStatus"), j = cc({
		anchor: a,
		floatingRootContext: x,
		positionMethod: o,
		mounted: S,
		side: s,
		sideOffset: l,
		align: c,
		alignOffset: u,
		arrowPadding: p,
		collisionBoundary: d,
		collisionPadding: f,
		sticky: m,
		disableAnchorTracking: h,
		keepMounted: y,
		nodeId: b,
		collisionAvoidance: g,
		adaptiveOrigin: v.useState("adaptiveOrigin")
	});
	fc({
		store: v,
		domReference: x.useState("domReferenceElement"),
		positionerElement: O,
		open: C
	});
	let M = E === !0 && w !== "trigger-hover";
	Dc(C && M, D === "touch", O, T);
	let ee = v.useStateSetter("positionerElement"), N = mc(e, {
		open: C,
		side: j.side,
		align: j.align,
		anchorHidden: j.anchorHidden,
		instant: k
	}, {
		styles: j.positionerStyles,
		transitionStatus: A,
		props: _,
		refs: [t, ee],
		hidden: !S,
		inert: !C
	});
	return /*#__PURE__*/ (0, Y.jsxs)(Ws.Provider, {
		value: j,
		children: [S && M && /*#__PURE__*/ (0, Y.jsx)(dc, {
			inert: Us(!C),
			cutout: T
		}), /*#__PURE__*/ (0, Y.jsx)(ki, {
			id: b,
			children: N
		})]
	});
}), kc = /* @__PURE__ */ new Set([
	"ArrowUp",
	"ArrowDown",
	"ArrowLeft",
	"ArrowRight",
	"Home",
	"End"
]), Ac = /*#__PURE__*/ _.createContext(void 0);
function jc(e) {
	let t = _.useContext(Ac);
	if (t === void 0 && !e) throw Error(Ji(69));
	return t;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/utils/closePart.mjs
var Mc = /*#__PURE__*/ _.createContext(void 0);
function Nc() {
	let [e, t] = _.useState(0), n = Z(() => (t((e) => e + 1), () => {
		t((e) => Math.max(0, e - 1));
	}));
	return {
		context: _.useMemo(() => ({ register: n }), [n]),
		hasClosePart: e > 0
	};
}
function Pc() {
	let e = _.useContext(Mc);
	N(() => e?.register(), [e]);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/popover/popup/PopoverPopup.mjs
var Fc = /*#__PURE__*/ _.forwardRef(function(e, t) {
	let { render: n, className: r, style: i, initialFocus: a, finalFocus: o, ...s } = e, c = _s(), l = Gs(), u = jc(!0) != null, { context: d, hasClosePart: f } = Nc(), p = c.useState("open"), m = c.useState("openMethod"), h = c.useState("instantType"), g = c.useState("transitionStatus"), _ = c.useState("popupProps"), v = c.useState("titleElementId"), y = c.useState("descriptionElementId"), b = c.useState("modal"), x = c.useState("mounted"), S = c.useState("openChangeReason"), C = c.useState("activeTriggerElement"), w = c.useState("floatingRootContext"), T = w.useState("floatingId"), E = c.useState("disabled"), D = c.useState("openOnHover"), O = c.useState("closeDelay");
	ta({
		open: p,
		ref: c.context.popupRef,
		onComplete() {
			p && c.context.onOpenChangeComplete?.(!0);
		}
	}), Ja(w, {
		enabled: D && !E,
		closeDelay: O
	});
	let k = a === void 0 ? ia(c.context.popupRef) : a, A = b !== !1 && f;
	c.useSyncedValue("focusManagerModal", A);
	let j = c.useStateSetter("popupElement"), M = ii("div", e, {
		state: {
			open: p,
			side: l.side,
			align: l.align,
			instant: h,
			transitionStatus: g
		},
		ref: [
			t,
			c.context.popupRef,
			j
		],
		props: [
			_,
			{
				id: T,
				role: "dialog",
				...ra,
				"aria-labelledby": v,
				"aria-describedby": y,
				onKeyDown(e) {
					u && kc.has(e.key) && e.stopPropagation();
				}
			},
			pc(g),
			s
		],
		stateAttributesMapping: ot
	});
	return /*#__PURE__*/ (0, Y.jsx)(Bi, {
		context: w,
		openInteractionType: m,
		modal: A,
		disabled: !x || S === "trigger-hover",
		initialFocus: k,
		returnFocus: o,
		restoreFocus: "popup",
		getInsideElements: () => [c.context.beforeTriggerFocusGuardRef.current],
		previousFocusableElement: me(C) ? C : void 0,
		nextFocusableElement: c.context.triggerFocusTargetRef,
		beforeContentFocusGuardRef: c.context.beforeContentFocusGuardRef,
		children: /*#__PURE__*/ (0, Y.jsx)(Mc.Provider, {
			value: d,
			children: M
		})
	});
}), Ic = /*#__PURE__*/ _.forwardRef(function(e, t) {
	let { render: n, className: r, style: i, ...a } = e, o = _s(), s = Ns(a.id);
	return o.useSyncedValueWithCleanup("titleElementId", s), ii("h2", e, {
		ref: t,
		props: [{ id: s }, a]
	});
}), Lc = /*#__PURE__*/ _.forwardRef(function(e, t) {
	let { render: n, className: r, style: i, ...a } = e, o = _s(), s = Ns(a.id);
	return o.useSyncedValueWithCleanup("descriptionElementId", s), ii("p", e, {
		ref: t,
		props: [{ id: s }, a]
	});
}), Rc = /*#__PURE__*/ _.forwardRef(function(e, t) {
	let { render: n, className: r, style: i, disabled: a = !1, nativeButton: o = !0, ...s } = e, { buttonRef: c, getButtonProps: l } = As({
		disabled: a,
		focusableWhenDisabled: !1,
		native: o
	}), u = _s();
	return Pc(), ii("button", e, {
		ref: [t, c],
		props: [
			{ onClick(e) {
				u.setOpen(!1, J(Ot, e.nativeEvent));
			} },
			s,
			l
		]
	});
}), zc = /*#__PURE__*/ _.createContext(void 0);
function Bc(e) {
	let t = _.useContext(zc);
	if (t === void 0 && !e) throw Error(Ji(72));
	return t;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/tooltip/store/TooltipStore.mjs
var Vc = {
	...za,
	disabled: (e) => e.disabled,
	instantType: (e) => e.instantType,
	isInstantPhase: (e) => e.isInstantPhase,
	trackCursorAxis: (e) => e.trackCursorAxis,
	disableHoverablePopup: (e) => e.disableHoverablePopup,
	lastOpenChangeReason: (e) => e.openChangeReason,
	closeOnClick: (e) => e.closeOnClick,
	appliedTriggerProps: (e, t) => t ? e.activeTriggerProps : void 0,
	closeDelay: (e) => e.closeDelay,
	adaptiveOrigin: (e) => e.adaptiveOrigin
}, Hc = class extends Aa {
	constructor(e, t, n) {
		let r = new _a();
		super(Uc(e, r, t, n), Wc(r), Vc);
	}
	setOpen = (e, t) => {
		da(this, e, t, { extraState: { openChangeReason: t.reason } });
	};
	cancelPendingOpen(e) {
		this.state.floatingRootContext.dispatchOpenChange(!1, J(Ct, e));
	}
};
function Uc(e, t, n, r = !1) {
	return {
		...Na(t, n, r),
		disabled: !1,
		instantType: void 0,
		isInstantPhase: !1,
		trackCursorAxis: "none",
		disableHoverablePopup: !1,
		openChangeReason: null,
		closeOnClick: !0,
		closeDelay: 0,
		adaptiveOrigin: void 0,
		...e
	};
}
function Wc(e) {
	return {
		popupRef: /*#__PURE__*/ _.createRef(),
		onOpenChange: void 0,
		onOpenChangeComplete: void 0,
		triggerElements: e
	};
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/tooltip/root/TooltipRoot.mjs
var Gc = w(function(e) {
	let { disabled: t = !1, defaultOpen: n = !1, open: r, disableHoverablePopup: i = !1, trackCursorAxis: a = "none", actionsRef: o, onOpenChange: s, onOpenChangeComplete: c, handle: l, triggerId: u, defaultTriggerId: d = null, children: f } = e, p = aa((e, t) => new Hc({
		open: n,
		openProp: r,
		activeTriggerId: d,
		triggerIdProp: u
	}, e, t));
	p.useControlledProp("openProp", r), p.useControlledProp("triggerIdProp", u), p.useContextCallback("onOpenChange", s), p.useContextCallback("onOpenChangeComplete", c);
	let m = p.useState("open"), h = !t && m, g = p.useState("activeTriggerId"), v = p.useState("mounted"), y = p.useState("payload");
	p.useSyncedValues({
		trackCursorAxis: a,
		disableHoverablePopup: i,
		disabled: t
	}), pa(p, { closeOnActiveTriggerUnmount: !0 });
	let { forceUnmount: b, transitionStatus: x } = ma(h, p), S = p.useState("isInstantPhase"), C = p.useState("instantType"), w = p.useState("lastOpenChangeReason"), T = _.useRef(null);
	N(() => {
		m && t && p.setOpen(!1, J(It));
	}, [
		m,
		t,
		p
	]), N(() => {
		x === "ending" && w === "none" || x !== "ending" && S ? (C !== "delay" && (T.current = C), p.set("instantType", "delay")) : T.current !== null && (p.set("instantType", T.current), T.current = null);
	}, [
		x,
		S,
		w,
		C,
		p
	]), N(() => {
		h && (g ?? p.set("payload", void 0));
	}, [
		p,
		g,
		h
	]), _.useImperativeHandle(o, () => ({
		unmount: b,
		close: () => p.setOpen(!1, J(Lt))
	}), [b, p]);
	let E = h || v || !t && a !== "none";
	return /*#__PURE__*/ (0, Y.jsxs)(zc.Provider, {
		value: p,
		children: [
			l && /*#__PURE__*/ (0, Y.jsx)(oa, {
				handle: l,
				store: p
			}),
			E && /*#__PURE__*/ (0, Y.jsx)(Kc, {
				store: p,
				disabled: t,
				trackCursorAxis: a
			}),
			typeof f == "function" ? f({ payload: y }) : f
		]
	});
});
function Kc({ store: e, disabled: t, trackCursorAxis: n }) {
	let r = e.useState("floatingRootContext"), i = Q(r, {
		enabled: !t,
		referencePress: () => e.select("closeOnClick")
	}), a = Wi(r, {
		enabled: !t && n !== "none",
		axis: n === "none" ? void 0 : n
	}), o = _.useMemo(() => Gr(a.reference, i.reference), [a.reference, i.reference]);
	return ha(e, {
		activeTriggerProps: o,
		inactiveTriggerProps: o,
		popupProps: i.floating ?? k
	}), null;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/tooltip/provider/TooltipProviderContext.mjs
var qc = /*#__PURE__*/ _.createContext(void 0);
function Jc() {
	return _.useContext(qc);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/tooltip/trigger/TooltipTrigger.mjs
var Yc = "data-base-ui-tooltip-trigger";
function Xc(e) {
	let t = Fe(e);
	return K(t) ? t : null;
}
var Zc = T(function(e, t) {
	let { render: n, className: r, style: i, handle: a, payload: o, disabled: s, delay: c, closeOnClick: l = !0, closeDelay: u, id: d, ...f } = e, p = Bc(!0), m = Ba(a) ?? p;
	if (!m) throw Error(Ji(82));
	let h = Ns(d), g = m.useState("isTriggerActive", h), v = m.useState("isOpenedByTrigger", h), y = m.useState("floatingRootContext"), b = _.useRef(null), x = u ?? 0, { registerTrigger: S, isMountedByThisTrigger: C } = fa(h, b, m, {
		payload: o,
		closeOnClick: l,
		closeDelay: x
	}), w = Jc(), { activeIdRef: T, delayRef: E, isInstantPhase: D, hasProvider: O } = Ht(y, { open: v }), k = qa(y);
	m.useSyncedValue("isInstantPhase", D);
	let A = m.useState("disabled"), j = s ?? A, M = Xt(j), N = m.useState("trackCursorAxis"), P = m.useState("disableHoverablePopup"), F = _.useRef(!1), I = ee(), L = _.useRef(void 0);
	function te() {
		return O && T.current != null ? 0 : c ?? w ?? 600;
	}
	function R(e) {
		let t = b.current;
		if (!t || !e) return !1;
		let n = Pe(e, `[${Yc}]`);
		return n !== null && n !== t && q(t, n);
	}
	function ne(e) {
		let t = R(e);
		return F.current = t, t && (k.openChangeTimeout.clear(), k.restTimeout.clear(), k.restTimeoutPending = !1, I.clear()), t;
	}
	let re = Xa(y, {
		enabled: !j,
		mouseOnly: !0,
		move: !1,
		handleClose: !P && N !== "both" ? po() : null,
		restMs: te,
		delay() {
			return u == null && O ? { close: _t(E.current, "close") } : { close: x };
		},
		triggerElementRef: b,
		isActiveTrigger: g,
		isClosing: () => m.select("transitionStatus") === "ending",
		shouldOpen() {
			return !F.current;
		}
	}), z = Ha(y, { enabled: !j }).reference, B = (e) => {
		let t = F.current, n = Xc(e), r = ne(n), i = b.current, a = i && n && q(i, n);
		if (r && m.select("open") && m.select("lastOpenChangeReason") === "trigger-hover") {
			m.setOpen(!1, J(wt, e));
			return;
		}
		if (t && !r && a && !M.current && !m.select("open") && i && le(L.current)) {
			let t = () => {
				!F.current && !M.current && !m.select("open") && m.setOpen(!0, J(wt, e, i));
			}, n = te();
			n === 0 ? (I.clear(), t()) : I.start(n, t);
		}
	}, ie = m.useState("appliedTriggerProps", C || N !== "none");
	return ii("button", e, {
		state: { open: v },
		ref: [
			t,
			S,
			b
		],
		props: [
			re,
			z,
			ie,
			{
				onMouseOver(e) {
					B(e.nativeEvent);
				},
				onFocus(e) {
					R(Xc(e.nativeEvent)) && e.preventBaseUIHandler();
				},
				onMouseLeave() {
					F.current = !1, I.clear(), L.current = void 0;
				},
				onPointerEnter(e) {
					L.current = e.pointerType;
				},
				onPointerDown(e) {
					L.current = e.pointerType, m.set("closeOnClick", l), l && !m.select("open") && m.cancelPendingOpen(e.nativeEvent);
				},
				onClick(e) {
					l && !m.select("open") && m.cancelPendingOpen(e.nativeEvent);
				},
				id: h,
				[st]: j ? "" : void 0,
				[Yc]: j ? void 0 : ""
			},
			f
		],
		stateAttributesMapping: rt
	});
}), Qc = /*#__PURE__*/ _.createContext(void 0);
function $c() {
	let e = _.useContext(Qc);
	if (e === void 0) throw Error(Ji(70));
	return e;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/utils/FloatingPortalLite.mjs
var el = /*#__PURE__*/ _.forwardRef(function(e, t) {
	let { children: n, container: r, className: i, render: a, style: o, ...s } = e, { node: c, subtree: l } = bi({
		container: r,
		ref: t,
		componentProps: e,
		elementProps: s
	});
	return !l && !c ? null : /*#__PURE__*/ (0, Y.jsxs)(_.Fragment, { children: [l, c && /*#__PURE__*/ gi.createPortal(n, c)] });
}), tl = /*#__PURE__*/ _.forwardRef(function(e, t) {
	let { keepMounted: n = !1, ...r } = e;
	return Bc().useState("mounted") || n ? /*#__PURE__*/ (0, Y.jsx)(Qc.Provider, {
		value: n,
		children: /*#__PURE__*/ (0, Y.jsx)(el, {
			ref: t,
			...r
		})
	}) : null;
}), nl = /*#__PURE__*/ _.createContext(void 0);
function rl() {
	let e = _.useContext(nl);
	if (e === void 0) throw Error(Ji(71));
	return e;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/tooltip/positioner/TooltipPositioner.mjs
var il = /*#__PURE__*/ _.forwardRef(function(e, t) {
	let { render: n, className: r, anchor: i, positionMethod: a = "absolute", side: o = "top", align: s = "center", sideOffset: c = 0, alignOffset: l = 0, collisionBoundary: u = "clipping-ancestors", collisionPadding: d = 5, arrowPadding: f = 5, sticky: p = !1, disableAnchorTracking: m = !1, collisionAvoidance: h = mi, style: g, ...v } = e, y = Bc(), b = $c(), x = y.useState("open"), S = y.useState("mounted"), C = y.useState("trackCursorAxis"), w = y.useState("disableHoverablePopup"), T = y.useState("floatingRootContext"), E = y.useState("instantType"), D = y.useState("transitionStatus"), O = cc({
		anchor: i,
		positionMethod: a,
		floatingRootContext: T,
		mounted: S,
		side: o,
		sideOffset: c,
		align: s,
		alignOffset: l,
		collisionBoundary: u,
		collisionPadding: d,
		sticky: p,
		arrowPadding: f,
		disableAnchorTracking: m,
		keepMounted: b,
		collisionAvoidance: h,
		adaptiveOrigin: y.useState("adaptiveOrigin")
	}), k = mc(e, _.useMemo(() => ({
		open: x,
		side: O.side,
		align: O.align,
		anchorHidden: O.anchorHidden,
		instant: C === "none" ? E : "tracking-cursor"
	}), [
		x,
		O.side,
		O.align,
		O.anchorHidden,
		C,
		E
	]), {
		styles: O.positionerStyles,
		transitionStatus: D,
		props: v,
		refs: [t, y.useStateSetter("positionerElement")],
		hidden: !S,
		inert: !x || C === "both" || w
	});
	return /*#__PURE__*/ (0, Y.jsx)(nl.Provider, {
		value: O,
		children: k
	});
}), al = /*#__PURE__*/ _.forwardRef(function(e, t) {
	let { render: n, className: r, style: i, ...a } = e, o = Bc(), { side: s, align: c } = rl(), l = o.useState("open"), u = o.useState("instantType"), d = o.useState("transitionStatus"), f = o.useState("popupProps"), p = o.useState("floatingRootContext"), m = o.useState("disabled"), h = o.useState("closeDelay");
	ta({
		open: l,
		ref: o.context.popupRef,
		onComplete() {
			l && o.context.onOpenChangeComplete?.(!0);
		}
	}), Ja(p, {
		enabled: !m,
		closeDelay: h
	});
	let g = o.useStateSetter("popupElement");
	return ii("div", e, {
		state: {
			open: l,
			side: s,
			align: c,
			instant: u,
			transitionStatus: d
		},
		ref: [
			t,
			o.context.popupRef,
			g
		],
		props: [
			ra,
			f,
			pc(d),
			a
		],
		stateAttributesMapping: ot
	});
}), ol = function(e) {
	let { delay: t, closeDelay: n, timeout: r = 400 } = e, i = _.useMemo(() => ({
		open: t,
		close: n
	}), [t, n]);
	return /*#__PURE__*/ (0, Y.jsx)(qc.Provider, {
		value: t,
		children: /*#__PURE__*/ (0, Y.jsx)(Vt, {
			delay: i,
			timeoutMs: r,
			children: e.children
		})
	});
}, sl = /*#__PURE__*/ _.createContext(void 0);
function cl(e) {
	let t = _.useContext(sl);
	if (t === void 0 && !e) throw Error(Ji(33));
	return t;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/menu/root/MenuRootContext.mjs
var ll = /*#__PURE__*/ _.createContext(void 0);
function ul(e) {
	let t = _.useContext(ll);
	if (t === void 0 && !e) throw Error(Ji(36));
	return t;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/context-menu/root/ContextMenuRootContext.mjs
var dl = /*#__PURE__*/ _.createContext(void 0);
function fl(e = !0) {
	let t = _.useContext(dl);
	if (t === void 0 && !e) throw Error(Ji(25));
	return t;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.5.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/useControlled.mjs
function pl({ controlled: e, default: t, name: n, state: r = "value" }) {
	let { current: i } = _.useRef(e !== void 0), [a, o] = _.useState(() => t);
	return [i && e !== void 0 ? e : a, _.useCallback((e) => {
		i || o(e);
	}, [])];
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/menu/filter-root/MenuFilterContext.mjs
var ml = /*#__PURE__*/ _.createContext(null);
function hl(e = "root") {
	let t = _.useContext(ml), n = _.useContext(ll);
	return t === null || n === void 0 ? null : (e === "submenu-trigger" ? n.virtualFocus || n.parentVirtualFocus : n.virtualFocus) ? t : null;
}
var gl = {
	visible: !0,
	ref: null
};
function _l() {
	return gl;
}
function vl(e, t, n = "root") {
	let r = hl(n), i = ((n === "submenu-trigger" ? r?.useSubmenuTrigger : r?.useItem) ?? _l)({
		label: e.label,
		children: e.children,
		render: e.render
	}), a = Wt(t, i.ref);
	return {
		visible: i.visible,
		ref: a,
		props: i.props
	};
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/menu/checkbox-item/MenuCheckboxItemContext.mjs
var yl = /*#__PURE__*/ _.createContext(void 0);
function bl() {
	let e = _.useContext(yl);
	if (e === void 0) throw Error(Ji(30));
	return e;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/menu/item/useMenuItemCommonProps.mjs
function xl(e) {
	e.preventDefault();
}
function Sl(e) {
	let { closeOnClick: t, highlighted: n, id: r, nodeId: i, store: a, typingRef: o, itemRef: s, itemMetadata: c } = e, l = ul(), u = fl(!0), d = c.type === "submenu-trigger", f = d ? l.parentVirtualFocus : l.virtualFocus, p = (d && l.parent.type === "menu" ? l.parent.store : l.store).useState("webkitAriaSelected", n), { events: m } = a.useState("floatingTreeRoot"), h = a.useState("open"), g = u !== void 0, v = !f && h && n ? 0 : -1;
	return _.useMemo(() => ({
		id: r,
		role: "menuitem",
		tabIndex: v,
		"aria-selected": p,
		onMouseDown: f ? xl : void 0,
		onKeyDown(e) {
			e.key === " " && o?.current && e.preventDefault();
		},
		onMouseMove(e) {
			i && m.emit("itemhover", {
				nodeId: i,
				target: e.currentTarget
			});
		},
		onClick(e) {
			t && m.emit("close", {
				domEvent: e.nativeEvent,
				reason: Dt
			});
		},
		onMouseUp(e) {
			if (u) {
				let t = u.initialCursorPointRef.current;
				if (u.initialCursorPointRef.current = null, g && t && Math.abs(e.clientX - t.x) <= 1 && Math.abs(e.clientY - t.y) <= 1 || g && !B && e.button === 2) return;
			}
			s.current && a.context.allowMouseUpTriggerRef.current && (!g || e.button === 2) && c.type === "regular-item" && ks(s.current, e, {
				detail: 1,
				pointerType: "mouse"
			});
		}
	}), [
		t,
		v,
		r,
		m,
		i,
		a.context.allowMouseUpTriggerRef,
		o,
		s,
		u,
		g,
		c.type,
		p,
		f
	]);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/menu/item/useMenuItem.mjs
var Cl = { type: "regular-item" };
function wl(e) {
	let { closeOnClick: t, disabled: n, highlighted: r, id: i, store: a, typingRef: o = a.context.typingRef, nativeButton: s, itemMetadata: c, nodeId: l } = e, u = _.useRef(null), { getButtonProps: d, buttonRef: f } = As({
		disabled: n,
		focusableWhenDisabled: !0,
		native: s,
		composite: !0
	}), p = Sl({
		closeOnClick: t,
		highlighted: r,
		id: i,
		nodeId: l,
		store: a,
		typingRef: o,
		itemRef: u,
		itemMetadata: c
	}), m = _.useCallback((e) => Gr(p, { onMouseEnter(e) {
		c.type === "submenu-trigger" && c.setActive(e.nativeEvent);
	} }, e, d), [
		p,
		d,
		c
	]), h = Wt(u, f);
	return _.useMemo(() => ({
		getItemProps: m,
		itemRef: h
	}), [m, h]);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/composite/list/CompositeListContext.mjs
var Tl = /*#__PURE__*/ _.createContext({
	register: () => {},
	unregister: () => {},
	subscribeMapChange: () => () => {},
	nextIndexRef: { current: 0 }
});
function El() {
	return _.useContext(Tl);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/composite/list/useCompositeListItem.mjs
function Dl(e = {}) {
	let { guess: t, label: n, metadata: r, textRef: i, index: a } = e, { register: o, unregister: s, subscribeMapChange: c, nextIndexRef: l } = El(), u = _.useRef(-1), [d, f] = _.useState(a == null && t ? () => {
		if (u.current === -1) {
			let e = l.current;
			l.current += 1, u.current = e;
		}
		return u.current;
	} : -1), p = a ?? d, m = _.useRef(null), h = _.useCallback((e) => {
		let t = m.current;
		t && s(t), m.current = e, e && o(e, {
			metadata: r ?? null,
			index: a ?? null,
			label: n,
			textRef: i
		});
	}, [
		a,
		o,
		s,
		r,
		n,
		i
	]);
	return N(() => {
		if (a == null) return c((e) => {
			let t = m.current ? e.get(m.current)?.index : null;
			t != null && f(t);
		});
	}, [a, c]), {
		ref: h,
		index: p
	};
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/menu/checkbox-item/MenuCheckboxItemDataAttributes.mjs
var Ol = "data-checked", kl = "data-unchecked", Al = {
	checked(e) {
		return e ? { [Ol]: "" } : { [kl]: "" };
	},
	...Ke
}, jl = /*#__PURE__*/ _.forwardRef(function(e, t) {
	let { render: n, className: r, id: i, label: a, nativeButton: o = !1, disabled: s = !1, closeOnClick: c = !1, checked: l = !1, onCheckedChange: u, style: d, ...f } = e, { store: p } = ul(), m = Dl({
		guess: !0,
		label: a
	}), h = Ns(i), g = p.useState("disabled"), v = p.useState("isActive", m.index), y = p.useState("floatingNodeId"), b = p.useState("itemProps"), x = s || g, { getItemProps: S, itemRef: C } = wl({
		closeOnClick: c,
		disabled: x,
		highlighted: v,
		id: h,
		store: p,
		nativeButton: o,
		nodeId: y,
		itemMetadata: Cl
	}), w = _.useMemo(() => ({
		disabled: x,
		highlighted: v,
		checked: l
	}), [
		x,
		v,
		l
	]);
	function T(e) {
		let t = J(Dt, e.nativeEvent, void 0, { preventUnmountOnClose: D });
		u?.(!l, t);
	}
	let E = ii("div", e, {
		state: w,
		stateAttributesMapping: Al,
		props: [
			b,
			{
				role: "menuitemcheckbox",
				"aria-checked": l,
				onClick: T
			},
			f,
			S
		],
		ref: [
			C,
			t,
			m.ref
		]
	});
	return /*#__PURE__*/ (0, Y.jsx)(yl.Provider, {
		value: w,
		children: E
	});
}), Ml = /*#__PURE__*/ _.forwardRef(function(e, t) {
	let { checked: n, defaultChecked: r, onCheckedChange: i, ...a } = e, [o, s] = pl({
		controlled: n,
		default: r ?? !1,
		name: "MenuCheckboxItem",
		state: "checked"
	}), c = vl(e, t);
	function l(e, t) {
		i?.(e, t), t.isCanceled || s(e);
	}
	return c.visible ? /*#__PURE__*/ (0, Y.jsx)(jl, {
		...a,
		checked: o,
		onCheckedChange: l,
		ref: c.ref
	}) : null;
}), Nl = /*#__PURE__*/ _.forwardRef(function(e, t) {
	let { render: n, className: r, style: i, keepMounted: a = !1, ...o } = e, s = bl(), c = _.useRef(null), { transitionStatus: l, mounted: u, setMounted: d } = Xi(s.checked);
	return ta({
		batch: !0,
		enabled: !s.checked,
		open: s.checked,
		ref: c,
		onComplete() {
			s.checked || d(!1);
		}
	}), ii("span", e, {
		state: {
			checked: s.checked,
			disabled: s.disabled,
			highlighted: s.highlighted,
			transitionStatus: l
		},
		ref: [t, c],
		stateAttributesMapping: Al,
		props: {
			"aria-hidden": !0,
			...o
		},
		enabled: a || u
	});
}), Pl = /*#__PURE__*/ _.createContext(void 0);
function Fl() {
	let e = _.useContext(Pl);
	if (e === void 0) throw Error(Ji(31));
	return e;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/menu/group/MenuGroup.mjs
var Il = /*#__PURE__*/ _.forwardRef(function(e, t) {
	let { render: n, className: r, style: i, ...a } = e, [o, s] = _.useState(void 0), c = ii("div", e, {
		ref: t,
		props: {
			role: "group",
			"aria-labelledby": o,
			...a
		}
	});
	return /*#__PURE__*/ (0, Y.jsx)(Pl.Provider, {
		value: s,
		children: c
	});
}), Ll = /*#__PURE__*/ _.forwardRef(function(e, t) {
	let n = hl()?.Group ?? Il;
	return /*#__PURE__*/ (0, Y.jsx)(n, {
		...e,
		ref: t
	});
}), Rl = /*#__PURE__*/ _.forwardRef(function(e, t) {
	let { render: n, className: r, style: i, id: a, ...o } = e, s = Ns(a), c = Fl();
	return N(() => (c(s), () => {
		c((e) => e === s ? void 0 : e);
	}), [c, s]), ii("div", e, {
		ref: t,
		props: {
			id: s,
			"aria-hidden": !0,
			...o
		}
	});
}), zl = /*#__PURE__*/ _.forwardRef(function(e, t) {
	let { render: n, className: r, id: i, label: a, nativeButton: o = !1, disabled: s = !1, closeOnClick: c = !0, style: l, ...u } = e, { store: d } = ul(), f = Dl({
		guess: !0,
		label: a
	}), p = Ns(i), m = d.useState("disabled"), h = d.useState("isActive", f.index), g = d.useState("floatingNodeId"), _ = d.useState("itemProps"), v = s || m, { getItemProps: y, itemRef: b } = wl({
		closeOnClick: c,
		disabled: v,
		highlighted: h,
		id: p,
		store: d,
		nativeButton: o,
		nodeId: g,
		itemMetadata: Cl
	});
	return ii("div", e, {
		state: {
			disabled: v,
			highlighted: h
		},
		props: [
			_,
			u,
			y
		],
		ref: [
			b,
			t,
			f.ref
		]
	});
}), Bl = /*#__PURE__*/ _.forwardRef(function(e, t) {
	let n = vl(e, t);
	return n.visible ? /*#__PURE__*/ (0, Y.jsx)(zl, {
		...e,
		ref: n.ref
	}) : null;
}), Vl = /*#__PURE__*/ _.createContext(void 0);
function Hl() {
	return _.useContext(Vl);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/resolveRenderedId.mjs
function Ul(e, t) {
	let n = ci(e.render);
	if (/*#__PURE__*/ _.isValidElement(n)) {
		let e = n.props;
		if (Object.hasOwn(e, "id")) return e.id ?? "";
	}
	return e.id ?? t;
}
function Wl(e, t, n) {
	let r = Ul(e, t), i = r === t ? void 0 : r;
	return [r, _.useCallback((e) => n?.(e ? i : void 0), [i, n])];
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/resolvePopupLabel.mjs
function Gl(e, t, n) {
	let r = ci(e.render), i = /*#__PURE__*/ _.isValidElement(r) ? r.props : void 0, a = e["aria-label"] ?? i?.["aria-label"], o = e["aria-labelledby"] ?? i?.["aria-labelledby"];
	return o == null && !a && (o = t ? t.id || void 0 : n || void 0), o;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/menu/popup/MenuPopup.mjs
var Kl = /*#__PURE__*/ _.forwardRef(function(e, t) {
	let { render: n, className: r, style: i, finalFocus: a, id: o, initialFocus: s, ...c } = e, { store: l, defaultFloatingId: u, setRenderedFloatingId: d, virtualFocus: f, orientation: p } = ul(), m = Hl(), { side: h, align: g } = cl(), v = jc(!0) != null, y = l.useState("open"), b = l.useState("transitionStatus"), x = l.useState("popupProps"), S = l.useState("mounted"), C = l.useState("instantType"), w = l.useState("activeTriggerElement"), T = l.useState("parent"), E = l.useState("lastOpenChangeReason"), D = l.useState("rootId"), O = l.useState("floatingRootContext"), k = l.useState("floatingTreeRoot"), A = l.useState("closeDelay"), j = l.useState("hoverEnabled"), M = l.useState("disabled"), ee = l.useState("openMethod"), N = l.useState("activeTriggerId"), P = l.useState("listElement"), [F, I] = Wl(e, u, d), L = Gl(e, w, N), te = T.type === "menu" ? m : void 0, R = T.type === "context-menu", ne = s ?? T.type !== "menu";
	s === void 0 && P && T.type !== "menu" && (ne = () => l.state.activeIndex === null && P), ta({
		open: y,
		ref: l.context.popupRef,
		onComplete() {
			y && l.context.onOpenChangeComplete?.(!0);
		}
	}), _.useEffect(() => {
		function e(e) {
			l.setOpen(!1, J(e.reason, e.domEvent));
		}
		return k.events.on("close", e), () => {
			k.events.off("close", e);
		};
	}, [k.events, l]), Ja(O, {
		enabled: j && !M && !R && T.type !== "menubar",
		closeDelay: A
	});
	let re = l.useStateSetter("popupElement"), { parentVirtualFocusRef: z, handleFocus: B } = (_.useContext(ml)?.useParentHandoff ?? Jl)(l, T, y, f), ie = ii("div", e, {
		state: {
			transitionStatus: b,
			side: h,
			align: g,
			open: y,
			nested: T.type === "menu",
			instant: C
		},
		ref: [
			t,
			l.context.popupRef,
			re,
			I
		],
		stateAttributesMapping: ot,
		props: [
			x,
			{
				id: F,
				...P ? { role: "presentation" } : {
					role: "menu",
					"aria-orientation": p === "horizontal" ? "horizontal" : void 0,
					"aria-labelledby": L
				},
				onKeyDown(e) {
					te?.onPopupKeyDown?.(e), v && kc.has(e.key) && e.stopPropagation();
				},
				onFocus: B
			},
			pc(b),
			c,
			{ "data-rootownerid": D }
		]
	}), ae = T.type === void 0 || R;
	(w || T.type === "menubar" && E !== "outside-press") && (ae = !0);
	let oe = te?.getReturnElement ?? z;
	return /*#__PURE__*/ (0, Y.jsx)(Bi, {
		context: O,
		openInteractionType: ee,
		modal: R,
		disabled: !S,
		returnFocus: a ?? oe ?? ae,
		explicitReturnFocus: a === void 0 && oe ? !1 : void 0,
		initialFocus: ne,
		restoreFocus: !0,
		getInsideElements: T.type === void 0 ? () => [l.context.beforeTriggerFocusGuardRef.current] : void 0,
		externalTree: T.type === "menubar" ? void 0 : k,
		previousFocusableElement: w,
		nextFocusableElement: T.type === void 0 ? l.context.triggerFocusTargetRef : void 0,
		beforeContentFocusGuardRef: l.context.beforeContentFocusGuardRef,
		children: ie
	});
}), ql = {
	parentVirtualFocusRef: void 0,
	handleFocus: void 0
};
function Jl() {
	return ql;
}
var Yl = /*#__PURE__*/ _.forwardRef(function(e, t) {
	let n = hl()?.Popup ?? Kl;
	return /*#__PURE__*/ (0, Y.jsx)(n, {
		...e,
		ref: t
	});
}), Xl = /*#__PURE__*/ _.createContext(void 0);
function Zl() {
	let e = _.useContext(Xl);
	if (e === void 0) throw Error(Ji(32));
	return e;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/menu/portal/MenuPortal.mjs
var Ql = /*#__PURE__*/ _.forwardRef(function(e, t) {
	let { keepMounted: n = !1, ...r } = e, { store: i, parent: a } = ul();
	if (!(i.useState("mounted") || n)) return null;
	let o = a.type === "menu" || a.type === "menubar" ? "group" : void 0;
	return /*#__PURE__*/ (0, Y.jsx)(Xl.Provider, {
		value: n,
		children: /*#__PURE__*/ (0, Y.jsx)(xi, {
			ref: t,
			...r,
			portalOwnerRole: o
		})
	});
});
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/composite/list/CompositeList.mjs
function $l(e) {
	let { children: t, elementsRef: n, labelsRef: r, onMapChange: i } = e, a = Z(i), [, o] = _.useState(0), s = y(tu).current, c = y(eu).current, l = _.useRef(0), u = _.useRef(!0), d = _.useRef(null), f = _.useRef(null), p = Z(() => {
		u.current || (u.current = !0, o((e) => e + 1));
	}), m = Z((e, t) => {
		c.set(e, t), p();
	}), h = Z((e) => {
		c.delete(e), p();
	}), g = Z((e) => {
		let t = /* @__PURE__ */ new Map();
		return n.current.length = 0, r && (r.current.length = 0), e.forEach((e) => {
			t.set(e.element, {
				...e.registration.metadata ?? {},
				index: e.index
			}), n.current[e.index] = e.element, r && (r.current[e.index] = e.registration.label === void 0 ? e.registration.textRef?.current?.textContent ?? e.element.textContent : e.registration.label);
		}), l.current = n.current.length, t;
	});
	function v(e) {
		if (f.current?.disconnect(), f.current = null, typeof MutationObserver != "function" || e.length < 2) return;
		let t = new MutationObserver((n) => {
			if (!iu(n)) return;
			let r = null;
			for (let n of e) if (n.isConnected) {
				if (r && au(r, n) > 0) {
					t.disconnect(), p();
					return;
				}
				r = n;
			}
		});
		f.current = t;
		let n = /* @__PURE__ */ new Set();
		for (let t = 1; t < e.length; t += 1) {
			let r = ru(e[t - 1], e[t]);
			r && n.add(r);
		}
		n.forEach((e) => t.observe(e, { childList: !0 }));
	}
	let b = Z(() => {
		let [e, t] = nu(c), n = g(e), r = d.current, i = !r || r.length !== e.length || e.some((e, t) => {
			let n = r[t];
			return e.index !== n.index || e.element !== n.element || e.registration.index !== n.registration.index || e.registration.metadata !== n.registration.metadata;
		});
		v(t), d.current = e, u.current = !1, i && (s.forEach((e) => e(n)), a(n));
	});
	N(() => (!u.current && d.current && g(d.current), () => {
		n.current = [], r && (r.current = []);
	}), [
		n,
		r,
		g
	]), N(() => {
		u.current && b();
	}), N(() => () => {
		f.current?.disconnect(), u.current = !0;
	}, []);
	let x = Z((e) => (s.add(e), () => {
		s.delete(e);
	})), S = _.useMemo(() => ({
		register: m,
		unregister: h,
		subscribeMapChange: x,
		nextIndexRef: l
	}), [
		m,
		h,
		x,
		l
	]);
	return /*#__PURE__*/ (0, Y.jsx)(Tl.Provider, {
		value: S,
		children: t
	});
}
function eu() {
	return /* @__PURE__ */ new Map();
}
function tu() {
	return /* @__PURE__ */ new Set();
}
function nu(e) {
	let t = /* @__PURE__ */ new Set(), n = [], r = [];
	e.forEach((e, i) => {
		if (!i.isConnected) return;
		let a = e.index, o = {
			index: a ?? -1,
			element: i,
			registration: e
		};
		a === null ? r.push(o) : a >= 0 && (t.add(a), n.push(o));
	});
	let i = 0;
	return r.sort((e, t) => au(e.element, t.element)), r.forEach((e) => {
		for (; t.has(i);) i += 1;
		e.index = i, n.push(e), i += 1;
	}), t.size > 0 && n.sort((e, t) => e.index - t.index), [n, r.map((e) => e.element)];
}
function ru(e, t) {
	let n = e.parentElement;
	for (; n && !n.contains(t);) n = n.parentElement;
	return n;
}
function iu(e) {
	for (let t of e) for (let e = 0; e < t.removedNodes.length; e += 1) if (t.removedNodes[e].isConnected) return !0;
	return !1;
}
function au(e, t) {
	return e.nextElementSibling === t ? -1 : t.nextElementSibling === e ? 1 : e.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/menu/positioner/MenuPositioner.mjs
var ou = /*#__PURE__*/ _.forwardRef(function(e, t) {
	let { anchor: n, positionMethod: r = "absolute", className: i, render: a, side: o, align: s, sideOffset: c = 0, alignOffset: l = 0, collisionBoundary: u = "clipping-ancestors", collisionPadding: d = 5, arrowPadding: f = 5, sticky: p = !1, disableAnchorTracking: m = !1, collisionAvoidance: h = pi, style: g, ...v } = e, { store: y, virtualFocus: b, syncHighlightedItem: x } = ul(), S = Zl(), C = fl(!0), w = y.useState("parent"), T = y.useState("floatingRootContext"), E = y.useState("floatingTreeRoot"), D = y.useState("mounted"), O = y.useState("open"), k = y.useState("modal"), A = y.useState("openMethod"), j = y.useState("activeTriggerElement"), M = y.useState("transitionStatus"), N = y.useState("positionerElement"), P = y.useState("instantType"), F = y.useState("adaptiveOrigin"), I = y.useState("lastOpenChangeReason"), L = y.useState("floatingNodeId"), te = y.useState("floatingParentNodeId"), R = T.useState("domReferenceElement"), ne = n, re = c, z = l, B = s, ie = h;
	w.type === "context-menu" && (ne = n ?? w.context?.anchor, B ??= "start", !o && B !== "center" && (z = e.alignOffset ?? 2, re = e.sideOffset ?? -5));
	let ae = o, oe = B;
	w.type === "menu" ? (ae ??= "inline-end", oe ??= "start", ie = e.collisionAvoidance ?? mi) : w.type === "menubar" && (ae ??= w.context.orientation === "vertical" ? "inline-end" : "bottom", oe ??= "start");
	let se = w.type === "context-menu", ce = cc({
		anchor: ne,
		floatingRootContext: T,
		positionMethod: C ? "fixed" : r,
		mounted: D,
		side: ae,
		sideOffset: re,
		align: oe,
		alignOffset: z,
		arrowPadding: se ? 0 : f,
		collisionBoundary: u,
		collisionPadding: d,
		sticky: p,
		nodeId: L,
		keepMounted: S,
		disableAnchorTracking: m,
		collisionAvoidance: ie,
		shift: se ? {
			crossAxis: !("side" in ie && ie.side === "flip"),
			rootBoundary: "layoutViewport"
		} : void 0,
		externalTree: E,
		adaptiveOrigin: F,
		lazyFlip: b ? "placement" : !1
	});
	_.useEffect(() => {
		function e(e) {
			e.open && (e.parentNodeId === L && y.set("hoverEnabled", !1), e.nodeId !== L && e.parentNodeId === y.select("floatingParentNodeId") && y.setOpen(!1, J(Ft)));
		}
		return E.events.on("menuopenchange", e), () => {
			E.events.off("menuopenchange", e);
		};
	}, [
		y,
		E.events,
		L
	]), _.useEffect(() => {
		if (y.select("floatingParentNodeId") == null) return;
		function e(e) {
			if (e.open || e.nodeId !== y.select("floatingParentNodeId")) return;
			let t = e.reason ?? "sibling-open";
			y.setOpen(!1, J(t));
		}
		return E.events.on("menuopenchange", e), () => {
			E.events.off("menuopenchange", e);
		};
	}, [E.events, y]);
	let V = ee();
	_.useEffect(() => {
		O || V.clear();
	}, [O, V]), _.useEffect(() => {
		function e(e) {
			if (O && e.nodeId === y.select("floatingParentNodeId")) {
				if (e.target && j && j !== e.target) {
					let e = y.select("closeDelay");
					e > 0 ? V.isStarted() || V.start(e, () => {
						y.setOpen(!1, J(Ft));
					}) : y.setOpen(!1, J(Ft));
				} else V.clear();
			}
		}
		return E.events.on("itemhover", e), () => {
			E.events.off("itemhover", e);
		};
	}, [
		E.events,
		O,
		j,
		y,
		V
	]), _.useEffect(() => {
		let e = {
			open: O,
			nodeId: L,
			parentNodeId: te,
			reason: y.select("lastOpenChangeReason")
		};
		E.events.emit("menuopenchange", e);
	}, [
		E.events,
		O,
		y,
		L,
		te
	]), fc({
		store: y,
		domReference: R,
		positionerElement: N,
		open: O
	});
	let H = {
		open: O,
		side: ce.side,
		align: ce.align,
		anchorHidden: ce.anchorHidden,
		nested: w.type === "menu",
		instant: P
	}, U = w.type === "menubar" && w.context.modal;
	Dc(O && (U || k && I !== "trigger-hover"), A === "touch", N, j);
	let le = mc(e, H, {
		styles: ce.positionerStyles,
		transitionStatus: M,
		props: v,
		refs: [t, y.useStateSetter("positionerElement")],
		hidden: !D,
		inert: !O
	}), ue = D && w.type !== "menu" && (w.type !== "menubar" && k && I !== "trigger-hover" || w.type === "menubar" && w.context.modal), de = null;
	return w.type === "menubar" ? de = w.context.contentElement : w.type === void 0 && (de = j), /*#__PURE__*/ (0, Y.jsxs)(sl.Provider, {
		value: ce,
		children: [ue && /*#__PURE__*/ (0, Y.jsx)(dc, {
			ref: w.type === "context-menu" || w.type === "nested-context-menu" ? w.context.internalBackdropRef : null,
			inert: Us(!O),
			cutout: de
		}), /*#__PURE__*/ (0, Y.jsx)(ki, {
			id: L,
			children: /*#__PURE__*/ (0, Y.jsx)($l, {
				elementsRef: y.context.itemDomElements,
				labelsRef: y.context.itemLabels,
				onMapChange: x,
				children: le
			})
		})]
	});
}), su = /*#__PURE__*/ _.createContext(null);
function cu(e) {
	let t = _.useContext(su);
	if (t === null && !e) throw Error(Ji(5));
	return t;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/utils/getHighlightReason.mjs
function lu(e) {
	return e == null ? St : e.type.startsWith("key") ? Mt : e.type.startsWith("mouse") || e.type.startsWith("pointer") ? Nt : St;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/menu/store/MenuStore.mjs
var uu = {
	...za,
	disabled: (e) => e.parent.type === "menubar" && e.parent.context.disabled || e.disabled,
	modal: (e) => (e.parent.type === void 0 || e.parent.type === "context-menu") && (e.modal ?? !0),
	openMethod: (e) => e.openMethod,
	keyboardOpen: (e) => e.keyboardOpen,
	allowMouseEnter: (e) => e.allowMouseEnter,
	highlightItemOnHover: (e) => e.highlightItemOnHover,
	parent: (e) => e.parent,
	rootId: (e) => e.parent.type === "menu" ? e.parent.store.select("rootId") : e.parent.type === void 0 ? e.rootId : e.parent.context.rootId,
	activeIndex: (e) => e.activeIndex,
	listElement: (e) => e.listElement,
	triggerControlsId: (e, t) => {
		let n = za.triggerPopupId(e, t);
		return n ? e.listElement?.id || n : void 0;
	},
	filterTriggerProps: (e) => e.filterTriggerProps,
	inputProps: (e) => e.inputProps,
	webkitAriaSelected: (e, t) => ae && e.inputFocused && t ? !0 : void 0,
	highlightedItemId: (e) => e.highlightedItem?.id || void 0,
	isActive: (e, t) => e.activeIndex === t,
	hoverEnabled: (e) => e.hoverEnabled,
	instantType: (e) => e.instantType === "trigger-change" && !za.open(e) ? void 0 : e.instantType,
	lastOpenChangeReason: (e) => e.openChangeReason,
	floatingTreeRoot: (e) => e.parent.type === "menu" ? e.parent.store.select("floatingTreeRoot") : e.floatingTreeRoot,
	floatingNodeId: (e) => e.floatingNodeId,
	floatingParentNodeId: (e) => e.floatingParentNodeId,
	itemProps: (e) => e.itemProps,
	closeDelay: (e) => e.closeDelay,
	adaptiveOrigin: (e) => e.adaptiveOrigin,
	keyboardEventRelay: (e) => {
		if (e.keyboardEventRelay) return e.keyboardEventRelay;
		if (e.parent.type === "menu") return e.parent.store.select("keyboardEventRelay");
	}
}, du = class extends Aa {
	constructor(e, t, n = !1) {
		let r = new _a(), i = pu(r, t, n, e);
		super(i, fu(r), uu), this.observe("parent", (e) => {
			e.type === "menu" ? this.context.allowMouseUpTriggerRef = e.store.context.allowMouseUpTriggerRef : e.type !== void 0 && (this.context.allowMouseUpTriggerRef = e.context.allowMouseUpTriggerRef);
		});
	}
	subscribeToParentMenu() {
		let e = this.state.parent;
		if (e.type !== "menu") return;
		let t = e.store.select("rootId"), n = e.store.select("floatingTreeRoot"), r = e.store.select("keyboardEventRelay");
		return e.store.subscribe(() => {
			let i = e.store.select("rootId"), a = e.store.select("floatingTreeRoot"), o = e.store.select("keyboardEventRelay");
			(t !== i || n !== a || r !== o) && (t = i, n = a, r = o, this.notifyAll());
		});
	}
	setOpen(e, t) {
		this.state.floatingRootContext.context.events.emit("setOpen", {
			open: e,
			eventDetails: t
		});
	}
	setActiveIndex(e, t, n) {
		if (this.state.activeIndex !== e) {
			let r = (e === null ? void 0 : this.context.itemDomElements.current[e]) === this.context.reportedItem;
			this.context.highlightReason = r ? "none" : t, this.context.highlightEvent = r ? void 0 : n;
		}
		this.set("activeIndex", e);
	}
	highlightItem(e, t, n) {
		let r = this.context.itemDomElements.current.indexOf(e);
		r > -1 && this.setActiveIndex(r, t, n);
	}
};
function fu(e) {
	return {
		positionerRef: /*#__PURE__*/ _.createRef(),
		popupRef: /*#__PURE__*/ _.createRef(),
		typingRef: { current: !1 },
		itemDomElements: { current: [] },
		itemLabels: { current: [] },
		highlightReason: "none",
		highlightEvent: void 0,
		reportedItem: void 0,
		allowMouseUpTriggerRef: { current: !1 },
		virtualFocusRef: void 0,
		triggerFocusTargetRef: /*#__PURE__*/ _.createRef(),
		beforeTriggerFocusGuardRef: /*#__PURE__*/ _.createRef(),
		beforeContentFocusGuardRef: /*#__PURE__*/ _.createRef(),
		onOpenChangeComplete: void 0,
		triggerElements: e
	};
}
function pu(e, t, n = !1, r) {
	return {
		...Na(e, t, n),
		disabled: !1,
		modal: !0,
		openMethod: null,
		keyboardOpen: !1,
		allowMouseEnter: !1,
		highlightItemOnHover: !0,
		parent: { type: void 0 },
		rootId: void 0,
		activeIndex: null,
		listElement: null,
		filterTriggerProps: k,
		inputProps: k,
		inputFocused: !1,
		highlightedItem: void 0,
		hoverEnabled: !0,
		instantType: void 0,
		openChangeReason: null,
		floatingTreeRoot: new Ci(),
		floatingNodeId: void 0,
		floatingParentNodeId: null,
		itemProps: k,
		keyboardEventRelay: void 0,
		closeDelay: 0,
		adaptiveOrigin: void 0,
		...r
	};
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/menu/filter-provider/MenuFilterProviderContext.mjs
var mu = /*#__PURE__*/ _.createContext(null);
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/menu/utils/isKeyboardOpen.mjs
function hu(e, t) {
	return (e === "trigger-press" || e === "item-press") && t?.detail === 0;
}
function gu(e, t) {
	return e === "list-navigation" || hu(e, t);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/menu/root/MenuRoot.mjs
var _u = w(function(e) {
	let { children: t, open: n, onOpenChange: r, onOpenChangeComplete: i, onItemHighlighted: a, defaultOpen: o = !1, disabled: s = !1, modal: c, loopFocus: l = !0, orientation: u = "vertical", actionsRef: d, closeParentOnEsc: f = !1, handle: p, triggerId: m, defaultTriggerId: h = null, highlightItemOnHover: g = !0, isSubmenu: v = !1, virtualFocus: b = !1, virtualFocusRef: x, allowEscape: S = !0, resetOnPointerLeave: C = !0 } = e, w = fl(!0), T = ul(!0), E = cu(!0), D = T?.store, A = T?.virtualFocus ?? !1, j = _.useMemo(() => v && D ? {
		type: "menu",
		store: D
	} : E ? {
		type: "menubar",
		context: E
	} : w && !D ? {
		type: "context-menu",
		context: w
	} : { type: void 0 }, [
		w,
		D,
		E,
		v
	]), M = Ns(), P = Ns(), [F, I] = _.useState(void 0), L = (F ?? P) || void 0, te = Ei(), R = j.type === "menu" ? j.store : void 0, ne = (n ?? o) && R?.state.transitionStatus === "starting", re = y(() => ne ? R?.state.instantType : void 0).current, z = y(() => {
		let e = new du({
			open: o,
			openProp: n,
			activeTriggerId: h,
			triggerIdProp: m,
			parent: j,
			disabled: s,
			highlightItemOnHover: g,
			modal: j.type === void 0 ? c : void 0,
			rootId: M,
			instantType: re
		}, L, te != null);
		return e.context.virtualFocusRef = x, e;
	}).current;
	z.useControlledProp("openProp", n), z.useControlledProp("triggerIdProp", m), z.useContextCallback("onOpenChangeComplete", i);
	let B = z.useState("floatingTreeRoot"), ie = Oi(B), ae = z.useState("open"), oe = z.useState("activeTriggerElement"), se = z.useState("positionerElement"), ce = z.useState("hoverEnabled"), V = z.useState("disabled"), H = z.useState("lastOpenChangeReason"), U = z.useState("parent"), le = z.useState("activeIndex"), ue = z.useState("keyboardOpen"), de = z.useState("payload"), fe = z.useState("floatingParentNodeId"), W = _.useRef(null), G = _.useRef(U.type !== "context-menu"), pe = ee(), K = _.useRef(!0), me = ee(), he = fe != null, { openMethod: ge, triggerProps: _e } = Rs(ae);
	z.useSyncedValues({
		disabled: s,
		highlightItemOnHover: g,
		modal: U.type === void 0 ? c : void 0,
		openMethod: ge,
		rootId: M
	}), pa(z);
	let { forceUnmount: ve, transitionStatus: ye } = ma(ae, z, () => {
		z.set("allowMouseEnter", !1);
	}, ne), be = ea(z.context.popupRef);
	_.useEffect(() => {
		if (re === void 0) return;
		let e = () => {
			z.state.instantType === re && z.set("instantType", void 0);
		};
		if (!ae) {
			e();
			return;
		}
		if (ye !== void 0) return;
		if (z.context.popupRef.current == null) {
			e();
			return;
		}
		let t = new AbortController();
		return be(e, t.signal), () => {
			t.abort();
		};
	}, [
		re,
		ae,
		ye,
		be,
		z
	]), N(() => {
		w && !T ? z.update({
			parent: {
				type: "context-menu",
				context: w
			},
			floatingNodeId: ie,
			floatingParentNodeId: te
		}) : (T || !z.select("activeTriggerElement")) && z.update({
			floatingNodeId: ie,
			floatingParentNodeId: te
		});
	}, [
		w,
		T,
		ie,
		te,
		oe,
		z
	]), _.useEffect(() => {
		if (ae || (W.current = null), U.type === "context-menu") {
			if (!ae) {
				pe.clear(), G.current = !1;
				return;
			}
			pe.start(500, () => {
				G.current = !0;
			});
		}
	}, [
		pe,
		ae,
		U.type
	]), N(() => {
		!ae && !ce && z.set("hoverEnabled", !0);
	}, [
		ae,
		ce,
		z
	]);
	let xe = Z((e, t) => {
		let n = t.reason;
		if (!e && !z.select("open") || ae === e && t.trigger === oe && H === n) return;
		let i = ua(t);
		if (!e && t.trigger == null && (t.trigger = oe ?? void 0), r?.(e, t), t.isCanceled) return;
		z.state.floatingRootContext.dispatchOpenChange(e, t);
		let a = t.event;
		if (e === !1 && n !== "item-press" && a?.type === "click" && a.pointerType === "touch" && !K.current) return;
		e && n === "trigger-focus" ? (K.current = !1, me.start(300, () => {
			K.current = !0;
		})) : (K.current = !0, me.clear());
		let o = !e && (n === "escape-key" || n == null);
		W.current = t.event;
		let s = la(z.state, e, t.trigger, i());
		s.openChangeReason = n, s.keyboardOpen = e && gu(n, a), s.instantType = U.type === "menubar" && (n === "trigger-focus" || n === "focus-out" || n === "trigger-hover" || n === "list-navigation" || n === "sibling-open") ? "group" : hu(n, a) ? "click" : o ? "dismiss" : void 0, z.update(s);
	}), Se = Yi({
		popupStore: z,
		floatingRootContext: z.state.floatingRootContext,
		floatingId: L,
		nested: te != null,
		onOpenChange: xe
	}), Ce = Se.context.events;
	N(() => {
		let e = ({ open: e, eventDetails: t }) => xe(e, t);
		return Ce.on("setOpen", e), () => {
			Ce?.off("setOpen", e);
		};
	}, [Ce, xe]), N(() => z.subscribeToParentMenu(), [z]);
	let we = _.useCallback(() => {
		z.setOpen(!1, J(Lt));
	}, [z]);
	_.useImperativeHandle(d, () => ({
		unmount: ve,
		close: we
	}), [ve, we]);
	let Te;
	U.type === "context-menu" && (Te = U.context), _.useImperativeHandle(Te?.positionerRef, () => se, [se]), _.useImperativeHandle(Te?.actionsRef, () => ({ setOpen: xe }), [xe]);
	let Ee = Q(Se, {
		enabled: !V,
		bubbles: { escapeKey: f && U.type === "menu" },
		outsidePress() {
			return U.type !== "context-menu" || W.current?.type === "contextmenu" || G.current;
		},
		externalTree: he ? B : void 0
	}), De = Js(), Oe = ro(Se, {
		enabled: !V,
		listRef: z.context.itemDomElements,
		activeIndex: le,
		virtual: b,
		nested: U.type === "menubar" || !b && U.type !== void 0,
		parentOrientation: U.type === "menubar" ? U.context.orientation : void 0,
		loopFocus: l,
		focusItemOnOpen: b ? ue : void 0,
		allowEscape: b && l && S,
		orientation: u,
		triggerOrientation: b ? "vertical" : u,
		rtl: De === "rtl",
		disabledIndices: O,
		onNavigate(e, t) {
			z.setActiveIndex(e, lu(t), t?.nativeEvent);
		},
		openOnArrowKeyDown: U.type !== "context-menu" && !(b && v),
		externalTree: !b && he ? B : void 0,
		nestedReturnFocusRef: R?.context.virtualFocusRef,
		focusItemOnHover: g,
		resetOnPointerLeave: C
	}), ke = _.useCallback((e) => {
		z.context.typingRef.current = e;
	}, [z]), Ae = io(Se, {
		enabled: !V && !b,
		listRef: z.context.itemLabels,
		elementsRef: z.context.itemDomElements,
		activeIndex: le,
		resetMs: 500,
		onMatch: (e, t) => {
			ae && e !== le && z.setActiveIndex(e, Mt, t.nativeEvent);
		},
		onTyping: ke
	}), je = Z(a), Me = _.useRef(-1), Ne = Z(() => {
		let e = z.state.activeIndex, t = e === null ? void 0 : z.context.itemDomElements.current[e] ?? void 0;
		if (t?.isConnected === !1) return;
		let n = t === void 0 ? -1 : e;
		if (Me.current === n && z.context.reportedItem === t) return;
		Me.current = n, z.context.reportedItem = t, b && z.set("highlightedItem", t);
		let { highlightReason: r, highlightEvent: i } = z.context;
		z.context.highlightReason = St, z.context.highlightEvent = void 0, a && je(t, xt(r, i, { label: t === void 0 ? void 0 : z.context.itemLabels.current[n] ?? void 0 }));
	});
	N(() => {
		Ne();
	}, [le, Ne]);
	let q = _.useMemo(() => {
		if (!b) return Oe.reference;
		if (!Oe.trigger) return k;
		let { onFocus: e, ...t } = Oe.trigger;
		return t;
	}, [
		b,
		Oe.reference,
		Oe.trigger
	]);
	z.useSyncedValue("inputProps", b ? Oe.reference ?? k : k);
	let Pe = _.useMemo(() => {
		let e = Gr(Ae.reference, q, Ee.reference, { onMouseMove() {
			z.set("allowMouseEnter", !0);
		} }, _e);
		return e["aria-haspopup"] = "menu", e["aria-expanded"] = ae, e;
	}, [
		z,
		Ae.reference,
		q,
		Ee.reference,
		_e,
		ae
	]), Fe = _.useMemo(() => {
		let e = Gr(Oe.trigger, Ee.trigger, _e);
		return e["aria-haspopup"] = "menu", e["aria-expanded"] = !1, e;
	}, [
		Oe.trigger,
		Ee.trigger,
		_e
	]);
	y(() => (z.update({ inactiveTriggerProps: Fe }), null)), ha(z, {
		floatingRootContext: Se,
		activeTriggerProps: Pe,
		inactiveTriggerProps: Fe,
		popupProps: _.useMemo(() => Gr(ra, {
			onMouseMove() {
				z.set("allowMouseEnter", !0), U.type === "menu" && z.set("hoverEnabled", !1);
			},
			onClick() {
				z.select("hoverEnabled") && z.set("hoverEnabled", !1);
			},
			onKeyDown(e) {
				let t = z.select("keyboardEventRelay");
				t && !e.isPropagationStopped() && t(e);
			}
		}, Ae.floating, Oe.floating, Ee.floating), [
			U.type,
			z,
			Ae.floating,
			Oe.floating,
			Ee.floating
		]),
		itemProps: Oe.item ?? k
	});
	let Ie = _.useMemo(() => ({
		store: z,
		parent: j,
		orientation: u,
		loopFocus: l,
		allowEscape: S,
		defaultFloatingId: P,
		setRenderedFloatingId: I,
		virtualFocus: b,
		parentVirtualFocus: A,
		syncHighlightedItem: Ne
	}), [
		z,
		j,
		u,
		l,
		S,
		P,
		b,
		A,
		Ne
	]), Le = typeof t == "function" ? t({ payload: de }) : t, Re = /*#__PURE__*/ (0, Y.jsxs)(ll.Provider, {
		value: Ie,
		children: [p && /*#__PURE__*/ (0, Y.jsx)(oa, {
			handle: p,
			store: z
		}), Le]
	});
	return (U.type === void 0 || U.type === "context-menu") && (Re = /*#__PURE__*/ (0, Y.jsx)(Ai, {
		externalTree: B,
		children: Re
	})), Re;
});
function vu(e) {
	let t = _.useContext(mu);
	if (t === null) return /*#__PURE__*/ (0, Y.jsx)(_u, { ...e });
	let n = t.Root;
	return /*#__PURE__*/ (0, Y.jsx)(mu.Provider, {
		value: null,
		children: /*#__PURE__*/ (0, Y.jsx)(n, {
			...t.options,
			...e
		})
	});
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/utils/getPseudoElementBounds.mjs
var yu = 5;
function bu(e, t) {
	let n = xu(t);
	return e.clientX >= n.left - yu && e.clientX <= n.right + yu && e.clientY >= n.top - yu && e.clientY <= n.bottom + yu;
}
function xu(e) {
	let t = e.getBoundingClientRect(), n = W(e);
	if (se) return t;
	let r = n.getComputedStyle(e, "::before"), i = n.getComputedStyle(e, "::after");
	if (r.content === "none" && i.content === "none") return t;
	let a = parseFloat(r.width) || 0, o = parseFloat(r.height) || 0, s = parseFloat(i.width) || 0, c = parseFloat(i.height) || 0, l = Math.max(t.width, a, s), u = Math.max(t.height, o, c), d = l - t.width, f = u - t.height;
	return {
		left: t.left - d / 2,
		right: t.right + d / 2,
		top: t.top - f / 2,
		bottom: t.bottom + f / 2
	};
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/composite/item/useCompositeItem.mjs
function Su(e = {}) {
	let { highlightItemOnHover: t, highlightedIndex: n, onHighlightedIndexChange: r } = Ds(), { ref: i, index: a } = Dl(e), o = n === a, s = _.useRef(null), c = Wt(i, s);
	return {
		compositeProps: {
			tabIndex: o ? 0 : -1,
			onFocus() {
				r(a);
			},
			onMouseMove() {
				let e = s.current;
				if (!t || !e) return;
				let n = e.hasAttribute("disabled") || e.ariaDisabled === "true";
				!o && !n && e.focus();
			}
		},
		compositeRef: c,
		index: a
	};
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/composite/item/CompositeItem.mjs
function Cu(e) {
	let { render: t, className: n, style: r, state: i = k, props: a = O, refs: o = O, metadata: s, stateAttributesMapping: c, tag: l = "div", ...u } = e, { compositeProps: d, compositeRef: f } = Su({ metadata: s });
	return ii(l, e, {
		state: i,
		ref: [f, ...o],
		props: [
			d,
			...a,
			u
		],
		stateAttributesMapping: c
	});
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/menu/utils/findRootOwnerId.mjs
function wu(e) {
	if (me(e) && e.hasAttribute("data-rootownerid")) return e.getAttribute("data-rootownerid");
	if (!Ee(e)) return wu(ke(e));
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/utils/useMixedToggleClickHandler.mjs
function Tu(e) {
	let { enabled: t = !0, mouseDownAction: n, open: r } = e, i = _.useRef(!1);
	return _.useMemo(() => t ? {
		onMouseDown: (e) => {
			(n === "open" && !r || n === "close" && r) && (i.current = !0, cn(e.currentTarget).addEventListener("click", () => {
				i.current = !1;
			}, { once: !0 }));
		},
		onClick: (e) => {
			i.current && (i.current = !1, e.preventBaseUIHandler());
		}
	} : k, [
		t,
		n,
		r
	]);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/menu/trigger/MenuTrigger.mjs
var Eu = T(function(e, t) {
	let { render: n, className: r, style: i, disabled: a = !1, nativeButton: o = !0, id: s, openOnHover: c, delay: l = 100, closeDelay: u = 0, handle: d, payload: f, ...p } = e, m = ul(!0), h = Ba(d) ?? m?.store;
	if (!h) throw Error(Ji(85));
	let g = Ns(s), v = h.useState("isTriggerActive", g), y = h.useState("floatingRootContext"), b = h.useState("isOpenedByTrigger", g), x = h.useState("triggerControlsId", g), S = _.useRef(null), C = Ou(), w = Ds(!0), T = Di(), E = _.useMemo(() => T ?? new Ci(), [T]), { registerTrigger: D, isMountedByThisTrigger: O } = fa(g, S, h, {
		payload: f,
		closeDelay: u,
		parent: C,
		floatingTreeRoot: E,
		floatingNodeId: Oi(E),
		floatingParentNodeId: Ei(),
		keyboardEventRelay: w?.relayKeyboardEvent
	}), A = C.type === "menubar", j = h.useState("disabled"), M = a || j || A && C.context.disabled, { getButtonProps: N, buttonRef: P } = As({
		disabled: M,
		native: o
	});
	_.useEffect(() => {
		!b && C.type === void 0 && (h.context.allowMouseUpTriggerRef.current = !1);
	}, [
		h,
		b,
		C.type
	]);
	let F = _.useRef(null), I = ee(), L = Z((e) => {
		if (!F.current) return;
		I.clear(), h.context.allowMouseUpTriggerRef.current = !1;
		let t = e.target;
		q(F.current, t) || q(h.select("positionerElement"), t) || t === F.current || (t == null || wu(t) !== h.select("rootId")) && (bu(e, F.current) || E.events.emit("close", {
			domEvent: e,
			reason: Pt
		}));
	});
	_.useEffect(() => {
		let e = cn(F.current);
		if (b && h.select("lastOpenChangeReason") === "trigger-hover") return e.addEventListener("mouseup", L, { once: !0 }), () => {
			e.removeEventListener("mouseup", L);
		};
	}, [
		b,
		L,
		h
	]);
	let te = A && C.context.hasSubmenuOpen, R = Xa(y, {
		enabled: (c ?? te) && !M && (!A || te && !O),
		handleClose: po({ blockPointerEvents: !A }),
		mouseOnly: !0,
		move: !1,
		restMs: C.type === void 0 ? l : void 0,
		delay: { close: u },
		triggerElementRef: S,
		externalTree: E,
		isActiveTrigger: v,
		isClosing: () => h.select("transitionStatus") === "ending"
	}), ne = Du(b, h.select("lastOpenChangeReason")), re = Vi(y, {
		enabled: !M,
		event: b && A ? "click" : "mousedown",
		toggle: !0,
		ignoreMouse: !1,
		stickIfOpen: C.type === void 0 && ne
	}), z = Ha(y, { enabled: !M && te }), B = Tu({
		open: b,
		enabled: A,
		mouseDownAction: "open"
	}), ie = _.useMemo(() => Gr(z.reference, re.reference), [z.reference, re.reference]), ae = h.useState("triggerProps", O), oe = h.useState("filterTriggerProps"), { handlePreFocusGuardFocus: se, handleFocusTargetFocus: ce } = Ps(h, S), V = {
		disabled: M,
		open: b
	}, H = [
		F,
		t,
		P,
		D,
		S
	], U = [
		ie,
		R ?? k,
		ae,
		{
			"aria-haspopup": "menu",
			"aria-controls": x,
			id: g,
			onMouseDown: (e) => {
				h.select("open") || (I.start(200, () => {
					h.context.allowMouseUpTriggerRef.current = !0;
				}), cn(e.currentTarget).addEventListener("mouseup", L, { once: !0 }));
			}
		},
		oe,
		A ? { role: "menuitem" } : {},
		B,
		p,
		N
	], le = ii("button", e, {
		enabled: !A,
		stateAttributesMapping: it,
		state: V,
		ref: H,
		props: U
	});
	return A ? /*#__PURE__*/ (0, Y.jsx)(Cu, {
		tag: "button",
		render: n,
		className: r,
		style: i,
		state: V,
		refs: H,
		props: U,
		stateAttributesMapping: it
	}) : b ? /*#__PURE__*/ (0, Y.jsxs)(_.Fragment, { children: [
		/*#__PURE__*/ (0, Y.jsx)(dn, {
			ref: h.context.beforeTriggerFocusGuardRef,
			onFocus: se
		}, `${g}-pre-focus-guard`),
		/*#__PURE__*/ (0, Y.jsx)(_.Fragment, { children: le }, g),
		/*#__PURE__*/ (0, Y.jsx)(dn, {
			ref: h.context.triggerFocusTargetRef,
			onFocus: ce
		}, `${g}-post-focus-guard`)
	] }) : /*#__PURE__*/ (0, Y.jsx)(_.Fragment, { children: le }, g);
});
function Du(e, t) {
	let n = ee(), [r, i] = _.useState(!1);
	return N(() => {
		e && t === "trigger-hover" ? (i(!0), n.start(500, () => {
			i(!1);
		})) : e || (n.clear(), i(!1));
	}, [
		e,
		t,
		n
	]), r;
}
function Ou() {
	let e = cu(!0);
	return _.useMemo(() => e ? {
		type: "menubar",
		context: e
	} : { type: void 0 }, [e]);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/separator/Separator.mjs
var ku = /*#__PURE__*/ _.forwardRef(function(e, t) {
	let { className: n, render: r, orientation: i = "horizontal", style: a, ...o } = e;
	return ii("div", e, {
		state: { orientation: i },
		ref: t,
		props: [{
			role: "separator",
			"aria-orientation": i
		}, o]
	});
});
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/context-menu/root/ContextMenuRoot.mjs
function Au(e) {
	let [t, n] = _.useState({ getBoundingClientRect() {
		return DOMRect.fromRect({
			width: 0,
			height: 0,
			x: 0,
			y: 0
		});
	} }), r = _.useRef(null), i = _.useRef(null), a = _.useRef(null), o = _.useRef(null), s = _.useRef(!0), c = _.useRef(null), l = Ir(), u = _.useMemo(() => ({
		anchor: t,
		setAnchor: n,
		actionsRef: a,
		backdropRef: r,
		internalBackdropRef: i,
		positionerRef: o,
		allowMouseUpTriggerRef: s,
		initialCursorPointRef: c,
		rootId: l
	}), [t, l]);
	return /*#__PURE__*/ (0, Y.jsx)(dl.Provider, {
		value: u,
		children: /*#__PURE__*/ (0, Y.jsx)(ll.Provider, {
			value: void 0,
			children: /*#__PURE__*/ (0, Y.jsx)(vu, { ...e })
		})
	});
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/context-menu/trigger/ContextMenuTrigger.mjs
var ju = 500, Mu = /*#__PURE__*/ _.forwardRef(function(e, t) {
	let { render: n, className: r, style: i, ...a } = e, { setAnchor: o, actionsRef: s, internalBackdropRef: c, backdropRef: l, positionerRef: u, allowMouseUpTriggerRef: d, initialCursorPointRef: f, rootId: p } = fl(!1), { store: m } = ul(!1), h = m.useState("open"), g = m.useState("disabled"), v = _.useRef(null), y = _.useRef(null), b = ee(), x = ee(), S = _.useRef(!1), C = _.useRef(null);
	function w(e, t, n) {
		let r = n.type.startsWith("touch");
		f.current = {
			x: e,
			y: t
		}, o({ getBoundingClientRect() {
			return DOMRect.fromRect({
				width: r ? 10 : 0,
				height: r ? 10 : 0,
				x: e,
				y: t
			});
		} }), S.current = !1, s.current?.setOpen(!0, J(Ct, n)), x.start(ju, () => {
			S.current = !0;
		});
	}
	function T(e) {
		if (g) return;
		d.current = !0, ce(e), w(e.clientX, e.clientY, e.nativeEvent);
		let t = cn(v.current);
		C.current?.abort();
		let n = new AbortController();
		C.current = n, t.addEventListener("mouseup", (e) => {
			if (d.current = !1, !S.current) return;
			x.clear(), S.current = !1;
			let t = Fe(e);
			q(u.current, t) || p && t && wu(t) === p || s.current?.setOpen(!1, J(Pt, e));
		}, {
			once: !0,
			signal: n.signal
		});
	}
	function E() {
		b.clear(), y.current = null;
	}
	function D(e) {
		if (g) {
			E();
			return;
		}
		if (d.current = !1, e.touches.length !== 1) {
			E();
			return;
		}
		e.stopPropagation();
		let t = e.touches[0], n = {
			x: t.clientX,
			y: t.clientY
		};
		y.current = n, b.start(ju, () => {
			w(n.x, n.y, e.nativeEvent);
		});
	}
	function O(e) {
		if (e.touches.length !== 1) {
			E();
			return;
		}
		if (b.isStarted() && y.current) {
			let t = e.touches[0], n = Math.abs(t.clientX - y.current.x), r = Math.abs(t.clientY - y.current.y);
			(n > 10 || r > 10) && E();
		}
	}
	return _.useEffect(() => () => {
		C.current?.abort();
	}, []), _.useEffect(() => {
		function e(e) {
			if (g) return;
			let t = Fe(e);
			(q(v.current, t) || q(c.current, t) || q(l.current, t)) && e.preventDefault();
		}
		return X(cn(v.current), "contextmenu", e);
	}, [
		l,
		g,
		c
	]), ii("div", e, {
		state: { open: h },
		ref: [v, t],
		props: [{
			onContextMenu: T,
			onTouchStart: D,
			onTouchMove: O,
			onTouchEnd: E,
			onTouchCancel: E,
			style: { WebkitTouchCallout: "none" }
		}, a],
		stateAttributesMapping: it
	});
}), Nu = ou, Pu = /*#__PURE__*/ _.createContext(void 0);
function Fu(e) {
	let t = _.useContext(Pu);
	if (!e && t === void 0) throw Error(Ji(27));
	return t;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/dialog/backdrop/DialogBackdrop.mjs
var Iu = /*#__PURE__*/ _.forwardRef(function(e, t) {
	let { render: n, className: r, style: i, forceRender: a = !1, ...o } = e, s = Fu(), c = s.useState("open"), l = s.useState("nested"), u = s.useState("mounted");
	return ii("div", e, {
		state: {
			open: c,
			transitionStatus: s.useState("transitionStatus")
		},
		ref: [s.context.backdropRef, t],
		stateAttributesMapping: ot,
		props: [{
			role: "presentation",
			hidden: !u,
			style: {
				userSelect: "none",
				WebkitUserSelect: "none"
			}
		}, o],
		enabled: a || !l
	});
}), Lu = /*#__PURE__*/ _.forwardRef(function(e, t) {
	let { render: n, className: r, style: i, disabled: a = !1, nativeButton: o = !0, ...s } = e, c = Fu(), l = c.useState("open"), { getButtonProps: u, buttonRef: d } = As({
		disabled: a,
		native: o
	}), f = { disabled: a };
	function p(e) {
		l && c.setOpen(!1, J(Ot, e.nativeEvent));
	}
	return ii("button", e, {
		state: f,
		ref: [t, d],
		props: [
			{ onClick: p },
			s,
			u
		]
	});
}), Ru = /*#__PURE__*/ _.forwardRef(function(e, t) {
	let { render: n, className: r, style: i, id: a, ...o } = e, s = Fu(), c = Ns(a);
	return s.useSyncedValueWithCleanup("descriptionElementId", c), ii("p", e, {
		ref: t,
		props: [{ id: c }, o]
	});
}), zu = /*#__PURE__*/ _.createContext(void 0);
function Bu() {
	let e = _.useContext(zu);
	if (e === void 0) throw Error(Ji(26));
	return e;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/dialog/popup/DialogPopupCssVars.mjs
var Vu = "--nested-dialogs", Hu = "data-nested-dialog-open", Uu = {
	...at,
	...Ke,
	nestedDialogOpen(e) {
		return e ? { [Hu]: "" } : null;
	}
}, Wu = /*#__PURE__*/ _.forwardRef(function(e, t) {
	let { render: n, className: r, style: i, finalFocus: a, initialFocus: o, ...s } = e, c = Fu(), l = c.useState("descriptionElementId"), u = c.useState("disablePointerDismissal"), d = c.useState("floatingRootContext"), f = c.useState("popupProps"), p = c.useState("modal"), m = c.useState("mounted"), h = c.useState("nested"), g = c.useState("nestedOpenDialogCount"), _ = c.useState("open"), v = c.useState("openMethod"), y = c.useState("titleElementId"), b = c.useState("transitionStatus"), x = c.useState("role"), S = d.useState("floatingId");
	Bu(), ta({
		open: _,
		ref: c.context.popupRef,
		onComplete() {
			_ && c.context.onOpenChangeComplete?.(!0);
		}
	});
	let C = o === void 0 ? ia(c.context.popupRef) : o, w = g > 0, T = c.useStateSetter("popupElement"), E = ii("div", e, {
		state: {
			open: _,
			nested: h,
			transitionStatus: b,
			nestedDialogOpen: w
		},
		props: [
			f,
			{
				id: S,
				"aria-labelledby": y,
				"aria-describedby": l,
				role: x,
				...ra,
				hidden: !m,
				onKeyDown(e) {
					kc.has(e.key) && e.stopPropagation();
				},
				style: { [Vu]: g }
			},
			s
		],
		ref: [
			t,
			c.context.popupRef,
			T
		],
		stateAttributesMapping: Uu
	});
	return /*#__PURE__*/ (0, Y.jsx)(Bi, {
		context: d,
		openInteractionType: v,
		disabled: !m,
		closeOnFocusOut: !u,
		initialFocus: C,
		returnFocus: a,
		modal: p !== !1,
		restoreFocus: "popup",
		children: E
	});
}), Gu = /*#__PURE__*/ _.forwardRef(function(e, t) {
	let { keepMounted: n = !1, ...r } = e, i = Fu(), a = i.useState("mounted"), o = i.useState("modal"), s = i.useState("open");
	return a || n ? /*#__PURE__*/ (0, Y.jsx)(zu.Provider, {
		value: n,
		children: /*#__PURE__*/ (0, Y.jsxs)(xi, {
			ref: t,
			...r,
			children: [a && o === !0 && /*#__PURE__*/ (0, Y.jsx)(dc, {
				ref: i.context.internalBackdropRef,
				inert: Us(!s)
			}), e.children]
		})
	}) : null;
});
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/dialog/root/useDialogRoot.mjs
function Ku({ store: e, parentContext: t, isDrawer: n }) {
	let r = e.useState("open"), i = e.useState("mounted"), a = e.useState("disablePointerDismissal"), o = e.useState("modal"), s = e.useState("popupElement"), c = e.useState("floatingRootContext"), [l, u] = _.useState(0), [d, f] = _.useState(0), p = l === 0, m = Q(c, {
		outsidePressEvent() {
			return e.context.internalBackdropRef.current || e.context.backdropRef.current ? "intentional" : {
				mouse: o === "trap-focus" ? "sloppy" : "intentional",
				touch: "sloppy"
			};
		},
		outsidePress(t) {
			if (!e.context.outsidePressEnabledRef.current || "button" in t && t.button !== 0) return !1;
			if ("touches" in t) {
				if (t.type === "touchend") {
					if (t.changedTouches.length !== 1 || t.touches.length !== 0) return !1;
				} else if (t.touches.length !== 1) return !1;
			}
			let n = Fe(t);
			if (p && !a) {
				if (o) {
					let t = e.context.internalBackdropRef.current, r = e.context.backdropRef.current;
					return t || r ? t === n || r === n || q(n, s) && !n?.hasAttribute("data-base-ui-portal") : !0;
				}
				return !0;
			}
			return !1;
		},
		escapeKey: p
	});
	return Tc(r && o === !0, s), e.useContextCallback("onNestedDialogOpen", (t, n) => {
		(e.select("open") || e.select("mounted")) && (u(t), f(n));
	}), N(() => {
		!r && !i && (u(0), f(0));
	}, [r, i]), N(() => (t?.onNestedDialogOpen && r && t.onNestedDialogOpen(l + 1, d + +!!n), () => {
		t?.onNestedDialogOpen && r && t.onNestedDialogOpen(0, 0);
	}), [
		n,
		r,
		l,
		d,
		t
	]), ha(e, {
		activeTriggerProps: m.reference,
		inactiveTriggerProps: m.trigger,
		popupProps: m.floating,
		nestedOpenDialogCount: l,
		nestedOpenDrawerCount: d
	}), null;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/dialog/store/DialogStore.mjs
var qu = {
	...za,
	modal: (e) => e.modal,
	nested: (e) => e.nested,
	nestedOpenDialogCount: (e) => e.nestedOpenDialogCount,
	nestedOpenDrawerCount: (e) => e.nestedOpenDrawerCount,
	disablePointerDismissal: (e) => e.disablePointerDismissal,
	openMethod: (e) => e.openMethod,
	descriptionElementId: (e) => e.descriptionElementId,
	titleElementId: (e) => e.titleElementId,
	viewportElement: (e) => e.viewportElement,
	role: (e) => e.role
}, Ju = class extends Aa {
	constructor(e, t, n) {
		let r = new _a(), i = Yu(e, r, t, n);
		super(i, Xu(r), qu);
	}
	setOpen = (e, t) => {
		t.preventUnmountOnClose = () => {
			this.set("preventUnmountingOnClose", !0);
		}, !e && t.trigger == null && this.state.activeTriggerId != null && (t.trigger = this.state.activeTriggerElement ?? void 0), this.context.onOpenChange?.(e, t), !t.isCanceled && (this.state.floatingRootContext.dispatchOpenChange(e, t), this.update(la(this.state, e, t.trigger)));
	};
};
function Yu(e, t, n, r = !1) {
	return {
		...Na(t, n, r),
		modal: !0,
		disablePointerDismissal: !1,
		viewportElement: null,
		descriptionElementId: void 0,
		titleElementId: void 0,
		openMethod: null,
		nested: !1,
		nestedOpenDialogCount: 0,
		nestedOpenDrawerCount: 0,
		role: "dialog",
		...e
	};
}
function Xu(e) {
	return {
		popupRef: /*#__PURE__*/ _.createRef(),
		backdropRef: /*#__PURE__*/ _.createRef(),
		internalBackdropRef: /*#__PURE__*/ _.createRef(),
		outsidePressEnabledRef: { current: !0 },
		triggerElements: e,
		onOpenChange: void 0,
		onOpenChangeComplete: void 0
	};
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/dialog/root/useRenderDialogRoot.mjs
function Zu(e, t) {
	let { children: n, open: r, defaultOpen: i = !1, onOpenChange: a, onOpenChangeComplete: o, disablePointerDismissal: s = !1, modal: c = !0, actionsRef: l, handle: u, triggerId: d, defaultTriggerId: f = null } = t, p = e === "drawer", m = e === "alert-dialog", h = m ? !0 : c, g = m || s, v = m ? "alertdialog" : "dialog", y = Fu(!0), b = {
		modal: h,
		disablePointerDismissal: g,
		nested: y != null,
		role: v
	}, x = aa((e, t) => new Ju({
		open: i,
		openProp: r,
		activeTriggerId: f,
		triggerIdProp: d,
		...b
	}, e, t), !0);
	x.useControlledProp("openProp", r), x.useControlledProp("triggerIdProp", d), x.useSyncedValues(b), x.useContextCallback("onOpenChange", a), x.useContextCallback("onOpenChangeComplete", o);
	let S = x.useState("open"), C = x.useState("mounted"), w = x.useState("payload");
	ga(x, S), pa(x);
	let { forceUnmount: T } = ma(S, x);
	_.useImperativeHandle(l, () => ({
		unmount: T,
		close: () => x.setOpen(!1, J(Lt))
	}), [T, x]);
	let E = S || C || u != null;
	return /*#__PURE__*/ (0, Y.jsxs)(Pu.Provider, {
		value: x,
		children: [
			u && /*#__PURE__*/ (0, Y.jsx)(oa, {
				handle: u,
				store: x
			}),
			E && /*#__PURE__*/ (0, Y.jsx)(Ku, {
				store: x,
				parentContext: y?.context,
				isDrawer: p
			}),
			typeof n == "function" ? n({ payload: w }) : n
		]
	});
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/dialog/root/DialogRoot.mjs
var Qu = w(function(e) {
	return Zu("dialog", e);
}), $u = /*#__PURE__*/ _.forwardRef(function(e, t) {
	let { render: n, className: r, style: i, children: a, ...o } = e, s = Bu(), c = Fu(), l = c.useState("open"), u = c.useState("nested"), d = c.useState("transitionStatus"), f = c.useState("nestedOpenDialogCount"), p = c.useState("mounted"), m = c.useStateSetter("viewportElement");
	return ii("div", e, {
		enabled: s || p,
		state: {
			open: l,
			nested: u,
			transitionStatus: d,
			nestedDialogOpen: f > 0
		},
		ref: [t, m],
		stateAttributesMapping: Uu,
		props: [{
			role: "presentation",
			hidden: !p,
			style: { pointerEvents: l ? void 0 : "none" },
			children: a
		}, o]
	});
}), ed = /*#__PURE__*/ _.forwardRef(function(e, t) {
	let { render: n, className: r, style: i, id: a, ...o } = e, s = Fu(), c = Ns(a);
	return s.useSyncedValueWithCleanup("titleElementId", c), ii("h2", e, {
		ref: t,
		props: [{ id: c }, o]
	});
});
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/alert-dialog/root/AlertDialogRoot.mjs
function td(e) {
	return Zu("alert-dialog", e);
}
//#endregion
//#region design/air/overlays.tsx
var nd = g(), rd = "Field notes.pdf", id = {
	sideOffset: 8,
	collisionPadding: 16,
	positionMethod: "fixed"
};
function ad({ kind: e }) {
	return /* @__PURE__ */ (0, Y.jsx)("svg", {
		width: "18",
		height: "18",
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: "1.6",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		"aria-hidden": "true",
		children: e === "check" ? /* @__PURE__ */ (0, Y.jsx)("path", { d: "m5 12 4 4L19 6" }) : e === "info" ? /* @__PURE__ */ (0, Y.jsxs)(Y.Fragment, { children: [/* @__PURE__ */ (0, Y.jsx)("circle", {
			cx: "12",
			cy: "12",
			r: "9"
		}), /* @__PURE__ */ (0, Y.jsx)("path", { d: "M12 11v6m0-10v.01" })] }) : /* @__PURE__ */ (0, Y.jsxs)(Y.Fragment, { children: [
			/* @__PURE__ */ (0, Y.jsx)("circle", {
				cx: "5",
				cy: "12",
				r: "1"
			}),
			/* @__PURE__ */ (0, Y.jsx)("circle", {
				cx: "12",
				cy: "12",
				r: "1"
			}),
			/* @__PURE__ */ (0, Y.jsx)("circle", {
				cx: "19",
				cy: "12",
				r: "1"
			})
		] })
	});
}
function od({ focusOnMount: e }) {
	let [t, n] = (0, _.useState)(rd), [r, i] = (0, _.useState)(rd), [a, o] = (0, _.useState)(!1), [s, c] = (0, _.useState)(!1), [l, u] = (0, _.useState)(!0), [d, f] = (0, _.useState)(!1), [p, m] = (0, _.useState)("A4"), [h, g] = (0, _.useState)(!1), [v, y] = (0, _.useState)(!1), [b, x] = (0, _.useState)(!1), [S, C] = (0, _.useState)(!1), [w, T] = (0, _.useState)(!1), [E, D] = (0, _.useState)(!1), [O, k] = (0, _.useState)("Local interaction study. No files are changed."), A = (0, _.useRef)(null), j = (0, _.useRef)(null), M = (0, _.useRef)(null), ee = (0, _.useRef)(null), N = (0, _.useRef)(null), P = (0, _.useRef)(!1), F = (0, _.useRef)(null), I = (0, _.useRef)(null), L = (0, _.useRef)(!1);
	(0, _.useLayoutEffect)(() => {
		!h && L.current && (A.current?.focus(), L.current = !1);
	}, [h]);
	function te(e) {
		P.current = !0, i(t), o(!1), D(e.detail > 0), y(!0);
	}
	function R(e) {
		P.current = !0, D(e.detail > 0), x(!0);
	}
	function ne(e) {
		let t = () => {
			I.current = e === "context" ? F.current : A.current;
		};
		return /* @__PURE__ */ (0, Y.jsxs)(Ll, { children: [
			/* @__PURE__ */ (0, Y.jsx)(Rl, {
				className: "air-menu-label",
				children: "Sample actions"
			}),
			/* @__PURE__ */ (0, Y.jsx)(Bl, {
				className: "air-menu-item",
				onClick: (e) => {
					t(), te(e);
				},
				children: "Rename sample…"
			}),
			/* @__PURE__ */ (0, Y.jsxs)(Ml, {
				className: "air-menu-item",
				checked: s,
				onCheckedChange: (e) => {
					c(e), k(e ? "Sample marked as reviewed." : "Review mark removed.");
				},
				closeOnClick: !1,
				children: [/* @__PURE__ */ (0, Y.jsx)("span", { children: "Reviewed" }), /* @__PURE__ */ (0, Y.jsx)(Nl, {
					className: "air-menu-check",
					children: /* @__PURE__ */ (0, Y.jsx)(ad, { kind: "check" })
				})]
			}),
			/* @__PURE__ */ (0, Y.jsx)(Bl, {
				className: "air-menu-item",
				disabled: !0,
				children: "Download original · unavailable"
			}),
			/* @__PURE__ */ (0, Y.jsx)(ku, { className: "air-menu-separator" }),
			/* @__PURE__ */ (0, Y.jsx)(Bl, {
				className: "air-menu-item air-menu-item--danger",
				onClick: (e) => {
					t(), R(e);
				},
				children: "Remove sample…"
			})
		] });
	}
	let re = () => !P.current && A.current;
	return /* @__PURE__ */ (0, Y.jsxs)(ol, {
		delay: 400,
		closeDelay: 0,
		children: [
			/* @__PURE__ */ (0, Y.jsxs)("div", {
				className: "air-study-overlays",
				children: [
					/* @__PURE__ */ (0, Y.jsxs)("div", {
						className: "air-study-toolbar",
						children: [/* @__PURE__ */ (0, Y.jsxs)(Cs, { children: [/* @__PURE__ */ (0, Y.jsx)(zs, {
							className: "air-button",
							id: "air-view-settings",
							autoFocus: e,
							children: "View settings"
						}), /* @__PURE__ */ (0, Y.jsx)(Hs, { children: /* @__PURE__ */ (0, Y.jsx)(Oc, {
							...id,
							className: "air-floating-positioner",
							align: "start",
							children: /* @__PURE__ */ (0, Y.jsxs)(Fc, {
								className: "air-popover",
								id: "air-settings-popup",
								children: [
									/* @__PURE__ */ (0, Y.jsx)(Ic, {
										className: "air-floating-title",
										children: "A clearer view."
									}),
									/* @__PURE__ */ (0, Y.jsx)(Lc, {
										className: "air-help",
										children: "These settings update the sample below."
									}),
									/* @__PURE__ */ (0, Y.jsxs)("label", {
										className: "air-check-label",
										children: [/* @__PURE__ */ (0, Y.jsx)("input", {
											className: "air-check",
											type: "checkbox",
											checked: l,
											onChange: (e) => u(e.target.checked)
										}), "Show page details"]
									}),
									/* @__PURE__ */ (0, Y.jsx)("label", {
										className: "air-label",
										htmlFor: "air-sample-paper",
										children: "Paper size"
									}),
									/* @__PURE__ */ (0, Y.jsxs)("select", {
										className: "air-field",
										id: "air-sample-paper",
										value: p,
										onChange: (e) => m(e.target.value),
										children: [/* @__PURE__ */ (0, Y.jsx)("option", { children: "A4" }), /* @__PURE__ */ (0, Y.jsx)("option", { children: "Letter" })]
									}),
									/* @__PURE__ */ (0, Y.jsx)("div", {
										className: "air-floating-actions",
										children: /* @__PURE__ */ (0, Y.jsx)(Rc, {
											className: "air-button",
											children: "Done"
										})
									})
								]
							})
						}) })] }), /* @__PURE__ */ (0, Y.jsxs)(Gc, {
							open: d,
							onOpenChange: (e) => f(e),
							children: [/* @__PURE__ */ (0, Y.jsx)(Zc, {
								className: "air-icon-button",
								id: "air-details-hint",
								"aria-label": "Show page details",
								"aria-describedby": d ? "air-details-tooltip" : void 0,
								"aria-pressed": l,
								onClick: () => u(!l),
								children: /* @__PURE__ */ (0, Y.jsx)(ad, { kind: "info" })
							}), /* @__PURE__ */ (0, Y.jsx)(tl, { children: /* @__PURE__ */ (0, Y.jsx)(il, {
								...id,
								className: "air-floating-positioner",
								side: "top",
								children: /* @__PURE__ */ (0, Y.jsx)(al, {
									className: "air-tooltip",
									id: "air-details-tooltip",
									role: "tooltip",
									children: "Show or hide page details"
								})
							}) })]
						})]
					}),
					h ? /* @__PURE__ */ (0, Y.jsx)("p", {
						className: "air-study-empty",
						children: "The sample has been removed from this study."
					}) : /* @__PURE__ */ (0, Y.jsxs)(Au, {
						open: S,
						onOpenChange: (e) => {
							C(e), e || T(!1);
						},
						children: [/* @__PURE__ */ (0, Y.jsxs)(Mu, {
							className: "air-study-file",
							id: "air-context-target",
							ref: F,
							role: "group",
							tabIndex: 0,
							onKeyDown: (e) => {
								e.target === e.currentTarget && (e.key === "ContextMenu" || e.key === "F10" && e.shiftKey) && (e.preventDefault(), T(!0), C(!0));
							},
							"aria-label": `${t}. Sample document actions`,
							children: [/* @__PURE__ */ (0, Y.jsxs)("div", {
								className: "air-study-file-copy",
								children: [
									/* @__PURE__ */ (0, Y.jsx)("p", {
										className: "air-study-filename",
										children: t
									}),
									l ? /* @__PURE__ */ (0, Y.jsxs)("p", {
										className: "air-help",
										children: [
											"4 pages · ",
											p,
											" · Local sample"
										]
									}) : null,
									s ? /* @__PURE__ */ (0, Y.jsx)("p", {
										className: "air-help",
										children: "Reviewed"
									}) : null
								]
							}), /* @__PURE__ */ (0, Y.jsxs)(vu, { children: [/* @__PURE__ */ (0, Y.jsx)(Eu, {
								className: "air-icon-button",
								id: "air-more-actions",
								"aria-label": "Sample actions",
								ref: A,
								children: /* @__PURE__ */ (0, Y.jsx)(ad, { kind: "more" })
							}), /* @__PURE__ */ (0, Y.jsx)(Ql, { children: /* @__PURE__ */ (0, Y.jsx)(ou, {
								...id,
								className: "air-floating-positioner",
								align: "end",
								children: /* @__PURE__ */ (0, Y.jsx)(Yl, {
									className: "air-menu",
									id: "air-action-menu",
									finalFocus: re,
									children: ne("menu")
								})
							}) })] })]
						}), /* @__PURE__ */ (0, Y.jsx)(Ql, { children: /* @__PURE__ */ (0, Y.jsx)(Nu, {
							...id,
							className: "air-floating-positioner",
							anchor: w ? F : void 0,
							children: /* @__PURE__ */ (0, Y.jsx)(Yl, {
								className: "air-menu",
								id: "air-context-menu",
								finalFocus: () => !P.current && F.current,
								children: ne("context")
							})
						}) })]
					}),
					/* @__PURE__ */ (0, Y.jsx)("p", {
						className: "air-help",
						children: "Use Sample actions, or right-click the document. The same actions are available by touch and keyboard."
					}),
					/* @__PURE__ */ (0, Y.jsx)("div", {
						className: "air-study-toolbar",
						children: /* @__PURE__ */ (0, Y.jsx)("button", {
							className: "air-button air-button--quiet",
							id: "air-restore-sample",
							ref: j,
							disabled: !h,
							onClick: () => {
								L.current = !0, g(!1), k("Sample restored with its name and review mark.");
							},
							children: "Restore sample"
						})
					}),
					/* @__PURE__ */ (0, Y.jsx)("p", {
						className: "air-help",
						id: "air-overlay-status",
						role: "status",
						"aria-atomic": "true",
						children: O
					})
				]
			}),
			/* @__PURE__ */ (0, Y.jsx)(Qu, {
				open: v,
				onOpenChange: (e, t) => {
					D("detail" in t.event && Number(t.event.detail) > 0), y(e);
				},
				onOpenChangeComplete: (e) => {
					e || (P.current = !1);
				},
				children: /* @__PURE__ */ (0, Y.jsxs)(Gu, { children: [/* @__PURE__ */ (0, Y.jsx)(Iu, { className: "air-modal-backdrop" }), /* @__PURE__ */ (0, Y.jsx)($u, {
					className: "air-modal-viewport",
					children: /* @__PURE__ */ (0, Y.jsxs)(Wu, {
						className: "air-modal",
						id: "air-rename-dialog",
						ref: N,
						initialFocus: (e) => e === "touch" || matchMedia("(pointer: coarse)").matches ? N.current : ee.current,
						"data-air-motion": E ? "pointer" : "immediate",
						finalFocus: () => I.current,
						children: [
							/* @__PURE__ */ (0, Y.jsx)(ed, {
								className: "air-floating-title",
								children: "Rename the sample"
							}),
							/* @__PURE__ */ (0, Y.jsx)(Ru, {
								className: "air-help",
								children: "Only this study changes. The file on your device keeps its name."
							}),
							/* @__PURE__ */ (0, Y.jsxs)("form", {
								className: "air-modal-form",
								noValidate: !0,
								onSubmit: (e) => {
									e.preventDefault();
									let t = r.trim();
									if (!t) {
										o(!0), ee.current?.focus();
										return;
									}
									n(t), y(!1), k(`Sample renamed to ${t}.`);
								},
								children: [
									/* @__PURE__ */ (0, Y.jsx)("label", {
										className: "air-label",
										htmlFor: "air-rename-input",
										children: "File name · required"
									}),
									/* @__PURE__ */ (0, Y.jsx)("input", {
										className: "air-field",
										id: "air-rename-input",
										ref: ee,
										name: "sample-name",
										autoComplete: "off",
										value: r,
										required: !0,
										maxLength: 160,
										"aria-invalid": a,
										"aria-describedby": "air-rename-help air-rename-error",
										onChange: (e) => i(e.target.value),
										onBlur: () => o(!r.trim())
									}),
									/* @__PURE__ */ (0, Y.jsx)("p", {
										className: "air-help",
										id: "air-rename-help",
										children: "Up to 160 characters. Keep a name you’ll recognise."
									}),
									/* @__PURE__ */ (0, Y.jsx)("p", {
										className: "air-help air-help--error",
										id: "air-rename-error",
										hidden: !a,
										children: "Enter a name before saving."
									}),
									/* @__PURE__ */ (0, Y.jsx)("p", {
										className: "air-help",
										role: "status",
										children: a ? "The name is empty. Your previous name is unchanged." : ""
									}),
									/* @__PURE__ */ (0, Y.jsxs)("div", {
										className: "air-floating-actions",
										children: [/* @__PURE__ */ (0, Y.jsx)(Lu, {
											className: "air-button",
											type: "button",
											children: "Cancel"
										}), /* @__PURE__ */ (0, Y.jsx)("button", {
											className: "air-button air-button--primary",
											type: "submit",
											onClick: (e) => D(e.detail > 0),
											children: "Save name"
										})]
									})
								]
							})
						]
					})
				})] })
			}),
			/* @__PURE__ */ (0, Y.jsx)(td, {
				open: b,
				onOpenChange: (e, t) => {
					D("detail" in t.event && Number(t.event.detail) > 0), x(e);
				},
				onOpenChangeComplete: (e) => {
					e || (P.current = !1);
				},
				children: /* @__PURE__ */ (0, Y.jsxs)(Gu, { children: [/* @__PURE__ */ (0, Y.jsx)(Iu, { className: "air-modal-backdrop" }), /* @__PURE__ */ (0, Y.jsx)($u, {
					className: "air-modal-viewport",
					children: /* @__PURE__ */ (0, Y.jsxs)(Wu, {
						className: "air-modal",
						id: "air-remove-dialog",
						"data-air-motion": E ? "pointer" : "immediate",
						initialFocus: M,
						finalFocus: () => h ? j.current : I.current,
						children: [
							/* @__PURE__ */ (0, Y.jsx)(ed, {
								className: "air-floating-title",
								children: "Remove this sample?"
							}),
							/* @__PURE__ */ (0, Y.jsxs)(Ru, {
								className: "air-help",
								children: [
									"“",
									t,
									"” will leave this study. Your files stay untouched, and you can restore the sample afterward."
								]
							}),
							/* @__PURE__ */ (0, Y.jsxs)("div", {
								className: "air-floating-actions",
								children: [/* @__PURE__ */ (0, Y.jsx)(Lu, {
									className: "air-button",
									ref: M,
									id: "air-remove-cancel",
									children: "Keep sample"
								}), /* @__PURE__ */ (0, Y.jsx)("button", {
									className: "air-button air-button--danger",
									id: "air-remove-confirm",
									onClick: (e) => {
										D(e.detail > 0), g(!0), x(!1), k("Sample removed from the study. Restore it whenever you’re ready.");
									},
									children: "Remove sample"
								})]
							})
						]
					})
				})] })
			})
		]
	});
}
function sd(e, t = !1) {
	let n = (0, nd.createRoot)(e);
	return n.render(/* @__PURE__ */ (0, Y.jsx)(od, { focusOnMount: t })), () => n.unmount();
}
//#endregion
export { sd as mountOverlayStudy };
