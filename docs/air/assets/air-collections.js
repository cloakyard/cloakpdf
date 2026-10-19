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
	function N(e) {
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
	function P(e, r, i, a, o) {
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
				case d: return c = e._init, P(c(e._payload), r, i, a, o);
			}
		}
		if (c) return o = o(e), c = a === "" ? "." + M(e, 0) : a, C(o) ? (i = "", c != null && (i = c.replace(j, "$&/") + "/"), P(o, r, i, "", function(e) {
			return e;
		})) : o != null && (k(o) && (o = O(o, i + (o.key == null || e && e.key === o.key ? "" : ("" + o.key).replace(j, "$&/") + "/") + c)), r.push(o)), 1;
		c = 0;
		var l = a === "" ? "." : a + ":";
		if (C(e)) for (var u = 0; u < e.length; u++) a = e[u], s = l + M(a, u), c += P(a, r, i, s, o);
		else if (u = h(e), typeof u == "function") for (e = u.call(e), u = 0; !(a = e.next()).done;) a = a.value, s = l + M(a, u++), c += P(a, r, i, s, o);
		else if (s === "object") {
			if (typeof e.then == "function") return P(N(e), r, i, a, o);
			throw r = String(e), Error("Objects are not valid as a React child (found: " + (r === "[object Object]" ? "object with keys {" + Object.keys(e).join(", ") + "}" : r) + "). If you meant to render a collection of children, use an array instead.");
		}
		return c;
	}
	function F(e, t, n) {
		if (e == null) return e;
		var r = [], i = 0;
		return P(e, r, "", "", function(e) {
			return t.call(n, e, i++);
		}), r;
	}
	function I(e) {
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
	var L = typeof reportError == "function" ? reportError : function(e) {
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
	function R(e) {
		var t = T.T, n = {};
		n.types = t === null ? null : t.types, T.T = n;
		try {
			var r = e(), i = T.S;
			i !== null && i(n, r), typeof r == "object" && r && typeof r.then == "function" && r.then(w, L);
		} catch (e) {
			L(e);
		} finally {
			t !== null && n.types !== null && (t.types = n.types), T.T = t;
		}
	}
	function z(e) {
		var t = T.T;
		if (t !== null) {
			var n = t.types;
			n === null ? t.types = [e] : n.indexOf(e) === -1 && n.push(e);
		} else R(z.bind(null, e));
	}
	var B = {
		map: F,
		forEach: function(e, t, n) {
			F(e, function() {
				t.apply(this, arguments);
			}, n);
		},
		count: function(e) {
			var t = 0;
			return F(e, function() {
				t++;
			}), t;
		},
		toArray: function(e) {
			return F(e, function(e) {
				return e;
			}) || [];
		},
		only: function(e) {
			if (!k(e)) throw Error("React.Children.only expected to receive a single React element child.");
			return e;
		}
	};
	e.Activity = f, e.Children = B, e.Component = y, e.Fragment = r, e.Profiler = a, e.PureComponent = x, e.StrictMode = i, e.Suspense = l, e.ViewTransition = p, e.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = T, e.__COMPILER_RUNTIME = {
		__proto__: null,
		c: function(e) {
			return T.H.useMemoCache(e);
		}
	}, e.addTransitionType = z, e.cache = function(e) {
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
			_init: I
		};
	}, e.memo = function(e, t) {
		return {
			$$typeof: u,
			type: e,
			compare: t === void 0 ? null : t
		};
	}, e.startTransition = R, e.unstable_useCacheRefresh = function() {
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
	var D = Object.assign, O = Symbol.for("react.element"), k = Symbol.for("react.transitional.element"), A = Symbol.for("react.portal"), j = Symbol.for("react.fragment"), M = Symbol.for("react.strict_mode"), N = Symbol.for("react.profiler"), P = Symbol.for("react.consumer"), F = Symbol.for("react.context"), I = Symbol.for("react.forward_ref"), L = Symbol.for("react.suspense"), R = Symbol.for("react.suspense_list"), z = Symbol.for("react.memo"), B = Symbol.for("react.lazy"), ee = Symbol.for("react.activity"), V = Symbol.for("react.legacy_hidden"), H = Symbol.for("react.memo_cache_sentinel"), U = Symbol.for("react.view_transition"), W = Symbol.for("react.recoverable"), te = Symbol.iterator;
	function G(e) {
		return typeof e != "object" || !e ? null : (e = te && e[te] || e["@@iterator"], typeof e == "function" ? e : null);
	}
	var ne = Symbol.for("react.client.reference");
	function re(e) {
		if (e == null) return null;
		if (typeof e == "function") return e.$$typeof === ne ? null : e.displayName || e.name || null;
		if (typeof e == "string") return e;
		switch (e) {
			case j: return "Fragment";
			case N: return "Profiler";
			case M: return "StrictMode";
			case L: return "Suspense";
			case R: return "SuspenseList";
			case ee: return "Activity";
			case U: return "ViewTransition";
		}
		if (typeof e == "object") switch (e.$$typeof) {
			case A: return "Portal";
			case F: return e.displayName || "Context";
			case P: return (e._context.displayName || "Context") + ".Consumer";
			case I:
				var t = e.render;
				return e = e.displayName, e ||= (e = t.displayName || t.name || "", e === "" ? "ForwardRef" : "ForwardRef(" + e + ")"), e;
			case z: return t = e.displayName || null, t === null ? re(e.type) || "Memo" : t;
			case B:
				t = e._payload, e = e._init;
				try {
					return re(e(t));
				} catch {}
		}
		return null;
	}
	var ie = Array.isArray, K = n.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, ae = r.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, oe = {
		pending: !1,
		data: null,
		method: null,
		action: null
	}, se = [], ce = -1;
	function q(e) {
		return { current: e };
	}
	function le(e) {
		0 > ce || (e.current = se[ce], se[ce] = null, ce--);
	}
	function ue(e, t) {
		ce++, se[ce] = e.current, e.current = t;
	}
	var de = q(null), fe = q(null), pe = q(null), me = q(null);
	function he(e, t) {
		switch (ue(pe, t), ue(fe, e), ue(de, null), t.nodeType) {
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
		le(de), ue(de, e);
	}
	function ge() {
		le(de), le(fe), le(pe);
	}
	function _e(e) {
		var t = e.memoizedState;
		t !== null && (sh._currentValue = t.memoizedState, ue(me, e)), t = de.current;
		var n = dp(t, e.type);
		t !== n && (ue(fe, e), ue(de, n));
	}
	function ve(e) {
		fe.current === e && (le(de), le(fe)), me.current === e && (le(me), sh._currentValue = oe);
	}
	var ye, be;
	function xe(e) {
		if (ye === void 0) try {
			throw Error();
		} catch (e) {
			var t = e.stack.trim().match(/\n( *(at )?)/);
			ye = t && t[1] || "", be = -1 < e.stack.indexOf("\n    at") ? " (<anonymous>)" : -1 < e.stack.indexOf("@") ? "@unknown:0:0" : "";
		}
		return "\n" + ye + e + be;
	}
	var Se = !1;
	function Ce(e, t) {
		if (!e || Se) return "";
		Se = !0;
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
			Se = !1, Error.prepareStackTrace = n;
		}
		return (n = e ? e.displayName || e.name : "") ? xe(n) : "";
	}
	function we(e, t) {
		switch (e.tag) {
			case 26:
			case 27:
			case 5: return xe(e.type);
			case 16: return xe("Lazy");
			case 13: return e.child !== t && t !== null ? xe("Suspense Fallback") : xe("Suspense");
			case 19: return xe("SuspenseList");
			case 0:
			case 15: return Ce(e.type, !1);
			case 11: return Ce(e.type.render, !1);
			case 1: return Ce(e.type, !0);
			case 31: return xe("Activity");
			case 30: return xe("ViewTransition");
			default: return "";
		}
	}
	function Te(e) {
		try {
			var t = "", n = null;
			do
				t += we(e, n), n = e, e = e.return;
			while (e);
			return t;
		} catch (e) {
			return "\nError generating stack: " + e.message + "\n" + e.stack;
		}
	}
	var Ee = Object.prototype.hasOwnProperty, De = t.unstable_scheduleCallback, Oe = t.unstable_cancelCallback, ke = t.unstable_shouldYield, Ae = t.unstable_requestPaint, je = t.unstable_now, Me = t.unstable_getCurrentPriorityLevel, Ne = t.unstable_ImmediatePriority, Pe = t.unstable_UserBlockingPriority, Fe = t.unstable_NormalPriority, Ie = t.unstable_LowPriority, Le = t.unstable_IdlePriority, Re = t.log, ze = t.unstable_setDisableYieldValue, Be = null, Ve = null;
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
		var e = ae.p;
		return e === 0 ? (e = window.event, e === void 0 ? 32 : Ch(e.type)) : e;
	}
	function dt(e, t) {
		var n = ae.p;
		try {
			return ae.p = e, t();
		} finally {
			ae.p = n;
		}
	}
	var ft = Math.random().toString(36).slice(2), pt = "__reactFiber$" + ft, mt = "__reactProps$" + ft, ht = "__reactContainer$" + ft, gt = "__reactEvents$" + ft, _t = "__reactListeners$" + ft, vt = "__reactHandles$" + ft, yt = "__reactResources$" + ft, bt = "__reactMarker$" + ft, xt = "__reactLoad$" + ft;
	function St(e) {
		delete e[pt], delete e[mt], delete e[_t], delete e[vt];
	}
	function Ct(e) {
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
	function wt(e) {
		if (e = e[pt] || e[ht]) {
			var t = e.tag;
			if (t === 5 || t === 6 || t === 13 || t === 31 || t === 26 || t === 27 || t === 3) return e;
		}
		return null;
	}
	function Tt(e) {
		var t = e.tag;
		if (t === 5 || t === 26 || t === 27 || t === 6) return e.stateNode;
		throw Error(i(33));
	}
	function Et(e) {
		var t = e[yt];
		return t ||= e[yt] = {
			hoistableStyles: /* @__PURE__ */ new Map(),
			hoistableScripts: /* @__PURE__ */ new Map()
		}, t;
	}
	function Dt(e) {
		e[bt] = !0;
	}
	function Ot(e) {
		e[xt] = void 0;
	}
	var kt = /* @__PURE__ */ new Set(), At = {};
	function jt(e, t) {
		J(e, t), J(e + "Capture", t);
	}
	function J(e, t) {
		for (At[e] = t, e = 0; e < t.length; e++) kt.add(t[e]);
	}
	var Mt = RegExp("^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"), Nt = {}, Y = {};
	function Pt(e) {
		return Ee.call(Y, e) ? !0 : Ee.call(Nt, e) ? !1 : Mt.test(e) ? Y[e] = !0 : (Nt[e] = !0, !1);
	}
	var Ft = !1;
	function It() {
		var e = Ft;
		return Ft = !1, e;
	}
	function Lt(e, t, n) {
		if (Pt(t)) {
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
	function Rt(e, t, n) {
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
	function Ut(e) {
		if (!e._valueTracker) {
			var t = Vt(e) ? "checked" : "value";
			e._valueTracker = Ht(e, t, "" + e[t]);
		}
	}
	function Wt(e) {
		if (!e) return !1;
		var t = e._valueTracker;
		if (!t) return !0;
		var n = t.getValue(), r = "";
		return e && (r = Vt(e) ? e.checked ? "true" : "false" : e.value), e = r, e !== n && (t.setValue(e), !0);
	}
	var Gt = /[\n"\\]/g;
	function Kt(e) {
		return e.replace(Gt, function(e) {
			return "\\" + e.charCodeAt(0).toString(16) + " ";
		});
	}
	function qt(e, t, n, r, i, a, o, s) {
		e.name = "", o != null && typeof o != "function" && typeof o != "symbol" && typeof o != "boolean" ? e.type = o : e.removeAttribute("type"), t == null ? o !== "submit" && o !== "reset" || e.removeAttribute("value") : o === "number" ? (t === 0 && e.value === "" || e.value != t) && (e.value = "" + Bt(t)) : e.value !== "" + Bt(t) && (e.value = "" + Bt(t)), t == null ? n == null ? r != null && e.removeAttribute("value") : Yt(e, Bt(n)) : o === "number" && e.value == t ? Yt(e, Bt(e.value)) : Yt(e, Bt(t)), i == null && a != null && (e.defaultChecked = !!a), i != null && (e.checked = i && typeof i != "function" && typeof i != "symbol"), s != null && typeof s != "function" && typeof s != "symbol" && typeof s != "boolean" ? e.name = "" + Bt(s) : e.removeAttribute("name");
	}
	function Jt(e, t, n, r, i, a, o, s) {
		if (a != null && typeof a != "function" && typeof a != "symbol" && typeof a != "boolean" && (e.type = a), t != null || n != null) {
			if (!(a !== "submit" && a !== "reset" || t != null)) {
				Ut(e);
				return;
			}
			n = n == null ? "" : "" + Bt(n), t = t == null ? n : "" + Bt(t), s || t === e.value || (e.value = t), e.defaultValue = t;
		}
		r ??= i, r = typeof r != "function" && typeof r != "symbol" && !!r, e.checked = s ? e.checked : !!r, e.defaultChecked = !!r, o != null && typeof o != "function" && typeof o != "symbol" && typeof o != "boolean" && (e.name = o), Ut(e);
	}
	function Yt(e, t) {
		e.defaultValue !== "" + t && (e.defaultValue = "" + t);
	}
	function Xt(e, t, n, r) {
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
	function Zt(e, t, n) {
		if (t != null && (t = "" + Bt(t), t !== e.value && (e.value = t), n == null)) {
			e.defaultValue !== t && (e.defaultValue = t);
			return;
		}
		e.defaultValue = n == null ? "" : "" + Bt(n);
	}
	function Qt(e, t, n, r) {
		if (t == null) {
			if (r != null) {
				if (n != null) throw Error(i(92));
				if (ie(r)) {
					if (1 < r.length) throw Error(i(93));
					r = r[0];
				}
				n = r;
			}
			n ??= "", t = n;
		}
		n = Bt(t), e.defaultValue = n, r = e.textContent, r === n && r !== "" && r !== null && (e.value = r), Ut(e);
	}
	function $t(e, t) {
		if (t) {
			var n = e.firstChild;
			if (n && n === e.lastChild && n.nodeType === 3) {
				n.nodeValue = t;
				return;
			}
		}
		e.textContent = t;
	}
	var en = new Set("animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(" "));
	function tn(e, t, n) {
		var r = t.indexOf("--") === 0;
		n == null || typeof n == "boolean" || n === "" ? r ? e.setProperty(t, "") : t === "float" ? e.cssFloat = "" : e[t] = "" : r ? e.setProperty(t, n) : typeof n != "number" || n === 0 || en.has(t) ? t === "float" ? e.cssFloat = n : e[t] = ("" + n).trim() : e[t] = n + "px";
	}
	function nn(e, t, n) {
		if (t != null && typeof t != "object") throw Error(i(62));
		if (e = e.style, n != null) {
			for (var r in n) !n.hasOwnProperty(r) || t != null && t.hasOwnProperty(r) || (r.indexOf("--") === 0 ? e.setProperty(r, "") : r === "float" ? e.cssFloat = "" : e[r] = "", Ft = !0);
			for (var a in t) r = t[a], t.hasOwnProperty(a) && n[a] !== r && (tn(e, a, r), Ft = !0);
		} else for (var o in t) t.hasOwnProperty(o) && tn(e, o, t[o]);
	}
	function rn(e) {
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
	var an = /* @__PURE__ */ new Map([
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
	]), on = /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;
	function sn(e) {
		return on.test("" + e) ? "javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')" : e;
	}
	function cn() {}
	var ln = null;
	function un(e) {
		return e = e.target || e.srcElement || window, e.correspondingUseElement && (e = e.correspondingUseElement), e.nodeType === 3 ? e.parentNode : e;
	}
	var dn = null, fn = null;
	function pn(e) {
		var t = wt(e);
		if (t && (e = t.stateNode)) {
			var n = e[mt] || null;
			a: switch (e = t.stateNode, t.type) {
				case "input":
					if (qt(e, n.value, n.defaultValue, n.defaultValue, n.checked, n.defaultChecked, n.type, n.name), t = n.name, n.type === "radio" && t != null) {
						for (n = e; n.parentNode;) n = n.parentNode;
						for (n = n.querySelectorAll("input[name=\"" + Kt("" + t) + "\"][type=\"radio\"]"), t = 0; t < n.length; t++) {
							var r = n[t];
							if (r !== e && r.form === e.form) {
								var a = r[mt] || null;
								if (!a) throw Error(i(90));
								qt(r, a.value, a.defaultValue, a.defaultValue, a.checked, a.defaultChecked, a.type, a.name);
							}
						}
						for (t = 0; t < n.length; t++) r = n[t], r.form === e.form && Wt(r);
					}
					break a;
				case "textarea":
					Zt(e, n.value, n.defaultValue);
					break a;
				case "select": t = n.value, t != null && Xt(e, !!n.multiple, t, !1);
			}
		}
	}
	var mn = !1;
	function hn(e, t, n) {
		if (mn) return e(t, n);
		mn = !0;
		try {
			return e(t);
		} finally {
			if (mn = !1, (dn !== null || fn !== null) && (Id(), dn && (t = dn, e = fn, fn = dn = null, pn(t), e))) for (t = 0; t < e.length; t++) pn(e[t]);
		}
	}
	function X(e, t) {
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
	var gn = typeof window < "u" && window.document !== void 0 && window.document.createElement !== void 0, _n = !1;
	if (gn) try {
		var vn = {};
		Object.defineProperty(vn, "passive", { get: function() {
			_n = !0;
		} }), window.addEventListener("test", vn, vn), window.removeEventListener("test", vn, vn);
	} catch {
		_n = !1;
	}
	var yn = null, bn = null, xn = null;
	function Sn() {
		if (xn) return xn;
		var e, t = bn, n = t.length, r, i = "value" in yn ? yn.value : yn.textContent, a = i.length;
		for (e = 0; e < n && t[e] === i[e]; e++);
		var o = n - e;
		for (r = 1; r <= o && t[n - r] === i[a - r]; r++);
		return xn = i.slice(e, 1 < r ? 1 - r : void 0);
	}
	function Cn(e) {
		var t = e.keyCode;
		return "charCode" in e ? (e = e.charCode, e === 0 && t === 13 && (e = 13)) : e = t, e === 10 && (e = 13), 32 <= e || e === 13 ? e : 0;
	}
	function wn() {
		return !0;
	}
	function Tn() {
		return !1;
	}
	function En(e) {
		function t(t, n, r, i, a) {
			for (var o in this._reactName = t, this._targetInst = r, this.type = n, this.nativeEvent = i, this.target = a, this.currentTarget = null, e) e.hasOwnProperty(o) && (t = e[o], this[o] = t ? t(i) : i[o]);
			return this.isDefaultPrevented = (i.defaultPrevented == null ? !1 === i.returnValue : i.defaultPrevented) ? wn : Tn, this.isPropagationStopped = Tn, this;
		}
		return D(t.prototype, {
			preventDefault: function() {
				this.defaultPrevented = !0;
				var e = this.nativeEvent;
				e && (e.preventDefault ? e.preventDefault() : typeof e.returnValue != "unknown" && (e.returnValue = !1), this.isDefaultPrevented = wn);
			},
			stopPropagation: function() {
				var e = this.nativeEvent;
				e && (e.stopPropagation ? e.stopPropagation() : typeof e.cancelBubble != "unknown" && (e.cancelBubble = !0), this.isPropagationStopped = wn);
			},
			persist: function() {},
			isPersistent: wn
		}), t;
	}
	var Dn = {
		eventPhase: 0,
		bubbles: 0,
		cancelable: 0,
		timeStamp: function(e) {
			return e.timeStamp || Date.now();
		},
		defaultPrevented: 0,
		isTrusted: 0
	}, On = En(Dn), kn = D({}, Dn, {
		view: 0,
		detail: 0
	}), An = En(kn), jn, Mn, Nn, Z = D({}, kn, {
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
			return "movementX" in e ? e.movementX : (e !== Nn && (Nn && e.type === "mousemove" ? (jn = e.screenX - Nn.screenX, Mn = e.screenY - Nn.screenY) : Mn = jn = 0, Nn = e), jn);
		},
		movementY: function(e) {
			return "movementY" in e ? e.movementY : Mn;
		}
	}), Pn = En(Z), Fn = En(D({}, Z, { dataTransfer: 0 })), In = En(D({}, kn, { relatedTarget: 0 })), Ln = En(D({}, Dn, {
		animationName: 0,
		elapsedTime: 0,
		pseudoElement: 0
	})), Rn = En(D({}, Dn, { clipboardData: function(e) {
		return "clipboardData" in e ? e.clipboardData : window.clipboardData;
	} })), zn = En(D({}, Dn, { data: 0 })), Bn = {
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
	var Gn = En(D({}, kn, {
		key: function(e) {
			if (e.key) {
				var t = Bn[e.key] || e.key;
				if (t !== "Unidentified") return t;
			}
			return e.type === "keypress" ? (e = Cn(e), e === 13 ? "Enter" : String.fromCharCode(e)) : e.type === "keydown" || e.type === "keyup" ? Vn[e.keyCode] || "Unidentified" : "";
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
			return e.type === "keypress" ? Cn(e) : 0;
		},
		keyCode: function(e) {
			return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
		},
		which: function(e) {
			return e.type === "keypress" ? Cn(e) : e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
		}
	})), Kn = En(D({}, Z, {
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
	})), qn = En(D({}, Dn, { submitter: 0 })), Jn = En(D({}, kn, {
		touches: 0,
		targetTouches: 0,
		changedTouches: 0,
		altKey: 0,
		metaKey: 0,
		ctrlKey: 0,
		shiftKey: 0,
		getModifierState: Wn
	})), Q = En(D({}, Dn, {
		propertyName: 0,
		elapsedTime: 0,
		pseudoElement: 0
	})), Yn = En(D({}, Z, {
		deltaX: function(e) {
			return "deltaX" in e ? e.deltaX : "wheelDeltaX" in e ? -e.wheelDeltaX : 0;
		},
		deltaY: function(e) {
			return "deltaY" in e ? e.deltaY : "wheelDeltaY" in e ? -e.wheelDeltaY : "wheelDelta" in e ? -e.wheelDelta : 0;
		},
		deltaZ: 0,
		deltaMode: 0
	})), Xn = En(D({}, Dn, {
		newState: 0,
		oldState: 0,
		source: 0
	})), Zn = [
		9,
		13,
		27,
		32
	], Qn = gn && "CompositionEvent" in window, $n = null;
	gn && "documentMode" in document && ($n = document.documentMode);
	var er = gn && "TextEvent" in window && !$n, tr = gn && (!Qn || $n && 8 < $n && 11 >= $n), nr = " ", rr = !1;
	function ir(e, t) {
		switch (e) {
			case "keyup": return Zn.indexOf(t.keyCode) !== -1;
			case "keydown": return t.keyCode !== 229;
			case "keypress":
			case "mousedown":
			case "focusout": return !0;
			default: return !1;
		}
	}
	function ar(e) {
		return e = e.detail, typeof e == "object" && "data" in e ? e.data : null;
	}
	var or = !1;
	function sr(e, t) {
		switch (e) {
			case "compositionend": return ar(t);
			case "keypress": return t.which === 32 ? (rr = !0, nr) : null;
			case "textInput": return e = t.data, e === nr && rr ? null : e;
			default: return null;
		}
	}
	function cr(e, t) {
		if (or) return e === "compositionend" || !Qn && ir(e, t) ? (e = Sn(), xn = bn = yn = null, or = !1, e) : null;
		switch (e) {
			case "paste": return null;
			case "keypress":
				if (!(t.ctrlKey || t.altKey || t.metaKey) || t.ctrlKey && t.altKey) {
					if (t.char && 1 < t.char.length) return t.char;
					if (t.which) return String.fromCharCode(t.which);
				}
				return null;
			case "compositionend": return tr && t.locale !== "ko" ? null : t.data;
			default: return null;
		}
	}
	var lr = {
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
	function ur(e) {
		var t = e && e.nodeName && e.nodeName.toLowerCase();
		return t === "input" ? !!lr[e.type] : t === "textarea";
	}
	function dr(e, t, n, r) {
		dn ? fn ? fn.push(r) : fn = [r] : dn = r, t = qf(t, "onChange"), 0 < t.length && (n = new On("onChange", "change", null, n, r), e.push({
			event: n,
			listeners: t
		}));
	}
	var fr = null, pr = null;
	function mr(e) {
		zf(e, 0);
	}
	function hr(e) {
		if (Wt(Tt(e))) return e;
	}
	function gr(e, t) {
		if (e === "change") return t;
	}
	var _r = !1;
	if (gn) {
		var vr;
		if (gn) {
			var yr = "oninput" in document;
			if (!yr) {
				var br = document.createElement("div");
				br.setAttribute("oninput", "return;"), yr = typeof br.oninput == "function";
			}
			vr = yr;
		} else vr = !1;
		_r = vr && (!document.documentMode || 9 < document.documentMode);
	}
	function xr() {
		fr && (fr.detachEvent("onpropertychange", Sr), pr = fr = null);
	}
	function Sr(e) {
		if (e.propertyName === "value" && hr(pr)) {
			var t = [];
			dr(t, pr, e, un(e)), hn(mr, t);
		}
	}
	function Cr(e, t, n) {
		e === "focusin" ? (xr(), fr = t, pr = n, fr.attachEvent("onpropertychange", Sr)) : e === "focusout" && xr();
	}
	function wr(e) {
		if (e === "selectionchange" || e === "keyup" || e === "keydown") return hr(pr);
	}
	function Tr(e, t) {
		if (e === "click") return hr(t);
	}
	function Er(e, t) {
		if (e === "input" || e === "change") return hr(t);
	}
	function Dr(e, t) {
		return e === t && (e !== 0 || 1 / e == 1 / t) || e !== e && t !== t;
	}
	var Or = typeof Object.is == "function" ? Object.is : Dr;
	function kr(e, t) {
		if (Or(e, t)) return !0;
		if (typeof e != "object" || !e || typeof t != "object" || !t) return !1;
		var n = Object.keys(e), r = Object.keys(t);
		if (n.length !== r.length) return !1;
		for (r = 0; r < n.length; r++) {
			var i = n[r];
			if (!Ee.call(t, i) || !Or(e[i], t[i])) return !1;
		}
		return !0;
	}
	function Ar(e) {
		if (e ||= typeof document < "u" ? document : void 0, e === void 0) return null;
		try {
			return e.activeElement || e.body;
		} catch {
			return e.body;
		}
	}
	function jr(e) {
		for (; e && e.firstChild;) e = e.firstChild;
		return e;
	}
	function Mr(e, t) {
		var n = jr(e);
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
			n = jr(n);
		}
	}
	function Nr(e, t) {
		return e && t ? e === t ? !0 : e && e.nodeType === 3 ? !1 : t && t.nodeType === 3 ? Nr(e, t.parentNode) : "contains" in e ? e.contains(t) : e.compareDocumentPosition ? !!(e.compareDocumentPosition(t) & 16) : !1 : !1;
	}
	function Pr(e) {
		e = e != null && e.ownerDocument != null && e.ownerDocument.defaultView != null ? e.ownerDocument.defaultView : window;
		for (var t = Ar(e.document); t instanceof e.HTMLIFrameElement;) {
			try {
				var n = typeof t.contentWindow.location.href == "string";
			} catch {
				n = !1;
			}
			if (n) e = t.contentWindow;
			else break;
			t = Ar(e.document);
		}
		return t;
	}
	function Fr(e) {
		var t = e && e.nodeName && e.nodeName.toLowerCase();
		return t && (t === "input" && (e.type === "text" || e.type === "search" || e.type === "tel" || e.type === "url" || e.type === "password") || t === "textarea" || e.contentEditable === "true");
	}
	var Ir = gn && "documentMode" in document && 11 >= document.documentMode, Lr = null, Rr = null, zr = null, Br = !1;
	function Vr(e, t, n) {
		var r = n.window === n ? n.document : n.nodeType === 9 ? n : n.ownerDocument;
		Br || Lr == null || Lr !== Ar(r) || (r = Lr, "selectionStart" in r && Fr(r) ? r = {
			start: r.selectionStart,
			end: r.selectionEnd
		} : (r = (r.ownerDocument && r.ownerDocument.defaultView || window).getSelection(), r = {
			anchorNode: r.anchorNode,
			anchorOffset: r.anchorOffset,
			focusNode: r.focusNode,
			focusOffset: r.focusOffset
		}), zr && kr(zr, r) || (zr = r, r = qf(Rr, "onSelect"), 0 < r.length && (t = new On("onSelect", "select", null, t, n), e.push({
			event: t,
			listeners: r
		}), t.target = Lr)));
	}
	function Hr(e, t) {
		var n = {};
		return n[e.toLowerCase()] = t.toLowerCase(), n["Webkit" + e] = "webkit" + t, n["Moz" + e] = "moz" + t, n;
	}
	var Ur = {
		animationend: Hr("Animation", "AnimationEnd"),
		animationiteration: Hr("Animation", "AnimationIteration"),
		animationstart: Hr("Animation", "AnimationStart"),
		transitionrun: Hr("Transition", "TransitionRun"),
		transitionstart: Hr("Transition", "TransitionStart"),
		transitioncancel: Hr("Transition", "TransitionCancel"),
		transitionend: Hr("Transition", "TransitionEnd")
	}, Wr = {}, Gr = {};
	gn && (Gr = document.createElement("div").style, "AnimationEvent" in window || (delete Ur.animationend.animation, delete Ur.animationiteration.animation, delete Ur.animationstart.animation), "TransitionEvent" in window || delete Ur.transitionend.transition);
	function Kr(e) {
		if (Wr[e]) return Wr[e];
		if (!Ur[e]) return e;
		var t = Ur[e], n;
		for (n in t) if (t.hasOwnProperty(n) && n in Gr) return Wr[e] = t[n];
		return e;
	}
	var qr = Kr("animationend"), Jr = Kr("animationiteration"), Yr = Kr("animationstart"), Xr = Kr("transitionrun"), Zr = Kr("transitionstart"), Qr = Kr("transitioncancel"), $r = Kr("transitionend"), ei = /* @__PURE__ */ new Map(), ti = "abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error fullscreenChange fullscreenError gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
	ti.push("scrollEnd");
	function ni(e, t) {
		ei.set(e, t), jt(t, [e]);
	}
	var ri = 0;
	function ii(e, t) {
		if (e.name != null && e.name !== "auto") return e.name;
		if (t.autoName !== null) return t.autoName;
		e = _d.identifierPrefix;
		var n = ri++;
		return e = "_" + e + "t_" + n.toString(32) + "_", t.autoName = e;
	}
	function ai(e) {
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
	function oi(e, t) {
		return e = ai(e), t = ai(t), t == null ? e === "auto" ? null : e : t === "auto" ? null : t;
	}
	var si = typeof reportError == "function" ? reportError : function(e) {
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
	}, ci = [], li = 0, ui = 0;
	function di() {
		for (var e = li, t = ui = li = 0; t < e;) {
			var n = ci[t];
			ci[t++] = null;
			var r = ci[t];
			ci[t++] = null;
			var i = ci[t];
			ci[t++] = null;
			var a = ci[t];
			if (ci[t++] = null, r !== null && i !== null) {
				var o = r.pending;
				o === null ? i.next = i : (i.next = o.next, o.next = i), r.pending = i;
			}
			a !== 0 && hi(n, i, a);
		}
	}
	function fi(e, t, n, r) {
		ci[li++] = e, ci[li++] = t, ci[li++] = n, ci[li++] = r, ui |= r, e.lanes |= r, e = e.alternate, e !== null && (e.lanes |= r);
	}
	function pi(e, t, n, r) {
		return fi(e, t, n, r), gi(e);
	}
	function mi(e, t) {
		return fi(e, null, null, t), gi(e);
	}
	function hi(e, t, n) {
		e.lanes |= n;
		var r = e.alternate;
		r !== null && (r.lanes |= n);
		for (var i = !1, a = e.return; a !== null;) a.childLanes |= n, r = a.alternate, r !== null && (r.childLanes |= n), a.tag === 22 && (e = a.stateNode, e === null || e._visibility & 1 || (i = !0)), e = a, a = a.return;
		return e.tag === 3 ? (a = e.stateNode, i && t !== null && (i = 31 - Ue(n), e = a.hiddenUpdates, r = e[i], r === null ? e[i] = [t] : r.push(t), t.lane = n | 536870912), a) : null;
	}
	function gi(e) {
		if (50 < Ed) throw Ed = 0, Dd = null, Error(i(185));
		for (var t = e.return; t !== null;) e = t, t = e.return;
		return e.tag === 3 ? e.stateNode : null;
	}
	var _i = {};
	function vi(e, t, n, r) {
		this.tag = e, this.key = n, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.refCleanup = this.ref = null, this.pendingProps = t, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = r, this.subtreeFlags = this.flags = 0, this.deletions = null, this.childLanes = this.lanes = 0, this.alternate = null;
	}
	function yi(e, t, n, r) {
		return new vi(e, t, n, r);
	}
	function bi(e) {
		return e = e.prototype, !(!e || !e.isReactComponent);
	}
	function xi(e, t) {
		var n = e.alternate;
		return n === null ? (n = yi(e.tag, t, e.key, e.mode), n.elementType = e.elementType, n.type = e.type, n.stateNode = e.stateNode, n.alternate = e, e.alternate = n) : (n.pendingProps = t, n.type = e.type, n.flags = 0, n.subtreeFlags = 0, n.deletions = null), n.flags = e.flags & 1206910976, n.childLanes = e.childLanes, n.lanes = e.lanes, n.child = e.child, n.memoizedProps = e.memoizedProps, n.memoizedState = e.memoizedState, n.updateQueue = e.updateQueue, t = e.dependencies, n.dependencies = t === null ? null : {
			lanes: t.lanes,
			firstContext: t.firstContext
		}, n.sibling = e.sibling, n.index = e.index, n.ref = e.ref, n.refCleanup = e.refCleanup, n;
	}
	function Si(e, t) {
		e.flags &= 1206910978;
		var n = e.alternate;
		return n === null ? (e.childLanes = 0, e.lanes = t, e.child = null, e.subtreeFlags = 0, e.memoizedProps = null, e.memoizedState = null, e.updateQueue = null, e.dependencies = null, e.stateNode = null) : (e.childLanes = n.childLanes, e.lanes = n.lanes, e.child = n.child, e.subtreeFlags = 0, e.deletions = null, e.memoizedProps = n.memoizedProps, e.memoizedState = n.memoizedState, e.updateQueue = n.updateQueue, e.type = n.type, t = n.dependencies, e.dependencies = t === null ? null : {
			lanes: t.lanes,
			firstContext: t.firstContext
		}), e;
	}
	function Ci(e, t, n, r, a, o) {
		var s = 0;
		if (r = e, typeof r == "function") bi(r) && (s = 1);
		else if (typeof r == "string") s = qm(e, n, de.current) ? 26 : e === "html" || e === "head" || e === "body" ? 27 : 5;
		else a: switch (r) {
			case ee: return e = yi(31, n, t, a), e.elementType = ee, e.lanes = o, e;
			case j: return wi(n.children, a, o, t);
			case M:
				s = 8, a |= 24;
				break;
			case N: return e = yi(12, n, t, a | 2), e.elementType = N, e.lanes = o, e;
			case L: return e = yi(13, n, t, a), e.elementType = L, e.lanes = o, e;
			case R: return e = yi(19, n, t, a), e.elementType = R, e.lanes = o, e;
			case V:
			case U: return e = a | 32, e = yi(30, n, t, e), e.elementType = U, e.lanes = o, e.stateNode = {
				autoName: null,
				paired: null,
				clones: null,
				ref: null
			}, e;
			default:
				if (typeof r == "object" && r) switch (r.$$typeof) {
					case F:
						s = 10;
						break a;
					case P:
						s = 9;
						break a;
					case I:
						s = 11;
						break a;
					case z:
						s = 14;
						break a;
					case B:
						s = 16, r = null;
						break a;
				}
				s = 29, n = Error(i(130, e === null ? "null" : typeof e, "")), r = null;
		}
		return t = yi(s, n, t, a), t.elementType = e, t.type = r, t.lanes = o, t;
	}
	function wi(e, t, n, r) {
		return e = yi(7, e, r, t), e.lanes = n, e;
	}
	function Ti(e, t, n) {
		return e = yi(6, e, null, t), e.lanes = n, e;
	}
	function Ei(e) {
		var t = yi(18, null, null, 0);
		return t.stateNode = e, t;
	}
	function Di(e, t, n) {
		return t = yi(4, e.children === null ? [] : e.children, e.key, t), t.lanes = n, t.stateNode = {
			containerInfo: e.containerInfo,
			pendingChildren: null,
			implementation: e.implementation
		}, t;
	}
	var Oi = /* @__PURE__ */ new WeakMap();
	function ki(e, t) {
		if (typeof e == "object" && e) {
			var n = Oi.get(e);
			return n === void 0 ? (t = {
				value: e,
				source: t,
				stack: Te(t)
			}, Oi.set(e, t), t) : n;
		}
		return {
			value: e,
			source: t,
			stack: Te(t)
		};
	}
	var Ai = [], ji = 0, Mi = null, Ni = 0, Pi = [], Fi = 0, Ii = null, Li = 1, Ri = "";
	function zi(e, t) {
		Ai[ji++] = Ni, Ai[ji++] = Mi, Mi = e, Ni = t;
	}
	function Bi(e, t, n) {
		Pi[Fi++] = Li, Pi[Fi++] = Ri, Pi[Fi++] = Ii, Ii = e;
		var r = Li;
		e = Ri;
		var i = 32 - Ue(r) - 1;
		r &= ~(1 << i), n += 1;
		var a = 32 - Ue(t) + i;
		if (30 < a) {
			var o = i - i % 5;
			a = (r & (1 << o) - 1).toString(32), r >>= o, i -= o, Li = 1 << 32 - Ue(t) + i | n << i | r, Ri = a + e;
		} else Li = 1 << a | n << i | r, Ri = e;
	}
	function Vi(e) {
		e.return !== null && (zi(e, 1), Bi(e, 1, 0));
	}
	function Hi(e) {
		for (; e === Mi;) Mi = Ai[--ji], Ai[ji] = null, Ni = Ai[--ji], Ai[ji] = null;
		for (; e === Ii;) Ii = Pi[--Fi], Pi[Fi] = null, Ri = Pi[--Fi], Pi[Fi] = null, Li = Pi[--Fi], Pi[Fi] = null;
	}
	function Ui(e, t) {
		Pi[Fi++] = Li, Pi[Fi++] = Ri, Pi[Fi++] = Ii, Li = t.id, Ri = t.overflow, Ii = e;
	}
	var Wi = null, Gi = null, Ki = !1, qi = null, Ji = !1, Yi = Error(i(519));
	function Xi(e) {
		throw na(ki(Error(i(418, 1 < arguments.length && arguments[1] !== void 0 && arguments[1] ? "text" : "HTML", "")), e)), Yi;
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
				Bf("invalid", t), Jt(t, r.value, r.defaultValue, r.checked, r.defaultChecked, r.type, r.name, !0);
				break;
			case "select":
				Bf("invalid", t);
				break;
			case "textarea": Bf("invalid", t), Qt(t, r.value, r.defaultValue, r.children);
		}
		n = r.children, typeof n != "string" && typeof n != "number" && typeof n != "bigint" || t.textContent === "" + n || !0 === r.suppressHydrationWarning || $f(t.textContent, n) ? (r.popover != null && (Bf("beforetoggle", t), Bf("toggle", t)), r.onScroll != null && Bf("scroll", t), r.onScrollEnd != null && Bf("scrollend", t), r.onClick != null && (t.onclick = cn), t = !0) : t = !1, t || Xi(e, !0);
	}
	function Qi(e) {
		for (Wi = e.return; Wi;) switch (Wi.tag) {
			case 5:
			case 31:
			case 13:
				Ji = !1;
				return;
			case 27:
			case 3:
				Ji = !0;
				return;
			default: Wi = Wi.return;
		}
	}
	function $i(e) {
		if (e !== Wi) return !1;
		if (!Ki) return Qi(e), Ki = !0, !1;
		var t = e.tag, n;
		if ((n = t !== 3 && t !== 27) && ((n = t === 5) && (n = e.type, n = n === "form" || n === "button" || pp(e.type, e.memoizedProps)), n = !n), n && Gi && Xi(e), Qi(e), t === 13) {
			if (e = e.memoizedState, e = e === null ? null : e.dehydrated, !e) throw Error(i(317));
			Gi = dm(e);
		} else if (t === 31) {
			if (e = e.memoizedState, e = e === null ? null : e.dehydrated, !e) throw Error(i(317));
			Gi = dm(e);
		} else t === 27 ? (t = Gi, Sp(e.type) ? (e = um, um = null, Gi = e) : Gi = t) : Gi = Wi ? lm(e.stateNode.nextSibling) : null;
		return !0;
	}
	function ea() {
		Gi = Wi = null, Ki = !1;
	}
	function ta() {
		var e = qi;
		return e !== null && (ld === null ? ld = e : ld.push.apply(ld, e), qi = null), e;
	}
	function na(e) {
		qi === null ? qi = [e] : qi.push(e);
	}
	var ra = q(null), ia = null, aa = null;
	function oa(e, t, n) {
		ue(ra, t._currentValue), t._currentValue = n;
	}
	function sa(e) {
		e._currentValue = ra.current, le(ra);
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
					Or(a.pendingProps.value, s.value) || (e === null ? e = [c] : e.push(c));
				}
			} else if (a === me.current) {
				if (s = a.alternate, s === null) throw Error(i(387));
				s.memoizedState.memoizedState !== a.memoizedState.memoizedState && (e === null ? e = [sh] : e.push(sh));
			}
			a = a.return;
		}
		return e !== null && la(t, e, n, r), t.flags |= 262144, e !== null;
	}
	function da(e) {
		for (e = e.firstContext; e !== null;) {
			if (!Or(e.context._currentValue, e.memoizedValue)) return !0;
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
		$$typeof: F,
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
	var Ma = K.S;
	K.S = function(e, t) {
		if (fd = je(), typeof t == "object" && t && typeof t.then == "function" && ka(e, t), Ca !== null) for (var n = vf; n !== null;) Sa(n, Ca), n = n.next;
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
	var Na = q(null);
	function Pa() {
		var e = Na.current;
		return e === null ? qu.pooledCache : e;
	}
	function Fa(e, t) {
		t === null ? ue(Na, Na.current) : ue(Na, t.pool);
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
		switch (n = e[n], n === void 0 ? e.push(t) : n !== t && (t.then(cn, cn), t = n), t.status) {
			case "fulfilled": return t.value;
			case "rejected": throw e = t.reason, Ka(e), e === void 0 && !("reason" in t) ? Error(i(600)) : e;
			default:
				if (typeof t.status == "string") t.then(cn, cn);
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
			return e = xi(e, t), e.index = 0, e.sibling = null, e;
		}
		function o(t, n, r) {
			return t.index = r, e ? (r = t.alternate, r === null ? (t.flags |= 134217730, n) : (r = r.index, r < n ? (t.flags |= 2, n) : r)) : (t.flags |= 1048576, n);
		}
		function s(t) {
			return e && t.alternate === null && (t.flags |= 134217730), t;
		}
		function c(e, t, n, r) {
			return t === null || t.tag !== 6 ? (t = Ti(n, e.mode, r), t.return = e, t) : (t = a(t, n), t.return = e, t);
		}
		function l(e, t, n, r) {
			var i = n.type;
			return i === j ? (e = d(e, t, n.props.children, r, n.key), Xa(e, n), e) : t !== null && (t.elementType === i || typeof i == "object" && i && i.$$typeof === B && Ua(i) === t.type) ? (t = a(t, n.props), Xa(t, n), t.return = e, t) : (t = Ci(n.type, n.key, n.props, null, e.mode, r), Xa(t, n), t.return = e, t);
		}
		function u(e, t, n, r) {
			return t === null || t.tag !== 4 || t.stateNode.containerInfo !== n.containerInfo || t.stateNode.implementation !== n.implementation ? (t = Di(n, e.mode, r), t.return = e, t) : (t = a(t, n.children || []), t.return = e, t);
		}
		function d(e, t, n, r, i) {
			return t === null || t.tag !== 7 ? (t = wi(n, e.mode, r, i), t.return = e, t) : (t = a(t, n), t.return = e, t);
		}
		function f(e, t, n) {
			if (typeof t == "string" && t !== "" || typeof t == "number" || typeof t == "bigint") return t = Ti("" + t, e.mode, n), t.return = e, t;
			if (typeof t == "object" && t) {
				switch (t.$$typeof) {
					case k: return n = Ci(t.type, t.key, t.props, null, e.mode, n), Xa(n, t), n.return = e, n;
					case A: return t = Di(t, e.mode, n), t.return = e, t;
					case B: return t = Ua(t), f(e, t, n);
				}
				if (ie(t) || G(t)) return t = wi(t, e.mode, n, null), t.return = e, t;
				if (typeof t.then == "function") return f(e, Ya(t), n);
				if (t.$$typeof === F) return f(e, ma(e, t), n);
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
					case B: return n = Ua(n), p(e, t, n, r);
				}
				if (ie(n) || G(n)) return i === null ? d(e, t, n, r, null) : null;
				if (typeof n.then == "function") return p(e, t, Ya(n), r);
				if (n.$$typeof === F) return p(e, t, ma(e, n), r);
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
					case B: return r = Ua(r), m(e, t, n, r, i);
				}
				if (ie(r) || G(r)) return e = e.get(n) || null, d(t, e, r, i, null);
				if (typeof r.then == "function") return m(e, t, n, Ya(r), i);
				if (r.$$typeof === F) return m(e, t, n, ma(t, r), i);
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
			if (h === s.length) return n(i, d), Ki && zi(i, h), l;
			if (d === null) {
				for (; h < s.length; h++) d = f(i, s[h], c), d !== null && (a = o(d, a, h), u === null ? l = d : u.sibling = d, u = d);
				return Ki && zi(i, h), l;
			}
			for (d = r(d); h < s.length; h++) g = m(d, i, h, s[h], c), g !== null && (e && (_ = g.alternate, _ !== null && d.delete(_.key === null ? h : _.key)), a = o(g, a, h), u === null ? l = g : u.sibling = g, u = g);
			return e && d.forEach(function(e) {
				return t(i, e);
			}), Ki && zi(i, h), l;
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
			if (v.done) return n(a, h), Ki && zi(a, g), u;
			if (h === null) {
				for (; !v.done; g++, v = c.next()) v = f(a, v.value, l), v !== null && (s = o(v, s, g), d === null ? u = v : d.sibling = v, d = v);
				return Ki && zi(a, g), u;
			}
			for (h = r(h); !v.done; g++, v = c.next()) v = m(h, a, g, v.value, l), v !== null && (e && (_ = v.alternate, _ !== null && h.delete(_.key === null ? g : _.key)), s = o(v, s, g), d === null ? u = v : d.sibling = v, d = v);
			return e && h.forEach(function(e) {
				return t(a, e);
			}), Ki && zi(a, g), u;
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
									} else if (r.elementType === l || typeof l == "object" && l && l.$$typeof === B && Ua(l) === r.type) {
										n(e, r.sibling), c = a(r, o.props), Xa(c, o), c.return = e, e = c;
										break a;
									}
									n(e, r);
									break;
								}
								t(e, r), r = r.sibling;
							}
							o.type === j ? (c = wi(o.props.children, e.mode, c, o.key), Xa(c, o), c.return = e, e = c) : (c = Ci(o.type, o.key, o.props, null, e.mode, c), Xa(c, o), c.return = e, e = c);
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
							c = Di(o, e.mode, c), c.return = e, e = c;
						}
						return s(e);
					case B: return o = Ua(o), _(e, r, o, c);
				}
				if (ie(o)) return h(e, r, o, c);
				if (G(o)) {
					if (l = G(o), typeof l != "function") throw Error(i(150));
					return o = l.call(o), g(e, r, o, c);
				}
				if (typeof o.then == "function") return _(e, r, Ya(o), c);
				if (o.$$typeof === F) return _(e, r, ma(e, o), c);
				Za(e, o);
			}
			return typeof o == "string" && o !== "" || typeof o == "number" || typeof o == "bigint" ? (o = "" + o, r !== null && r.tag === 6 ? (n(e, r.sibling), c = a(r, o), c.return = e, e = c) : (n(e, r), c = Ti(o, e.mode, c), c.return = e, e = c), s(e)) : n(e, r);
		}
		return function(e, t, n, r) {
			try {
				Ja = 0;
				var i = _(e, t, n, r);
				return qa = null, i;
			} catch (t) {
				if (t === La || t === za) throw t;
				var a = yi(29, t, null, e.mode);
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
			return i === null ? t.next = t : (t.next = i.next, i.next = t), r.pending = t, t = gi(e), hi(e, null, n), t;
		}
		return fi(e, r, t, n), gi(e);
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
	var mo = q(null), ho = q(0);
	function go(e, t) {
		e = td, ue(ho, e), ue(mo, t), td = e | t.baseLanes;
	}
	function _o() {
		ue(ho, td), ue(mo, mo.current);
	}
	function vo() {
		td = ho.current, le(mo), le(ho);
	}
	var yo = q(null), bo = null;
	function xo(e) {
		var t = e.alternate;
		ue(Eo, Eo.current & 1), ue(yo, e), bo === null && (t === null || mo.current !== null || t.memoizedState !== null) && (bo = e);
	}
	function So(e) {
		ue(Eo, Eo.current), ue(yo, e), bo === null && (bo = e);
	}
	function Co(e) {
		e.tag === 22 ? (ue(Eo, Eo.current), ue(yo, e), bo === null && (bo = e)) : wo();
	}
	function wo() {
		ue(Eo, Eo.current), ue(yo, yo.current);
	}
	function To(e) {
		le(yo), bo === e && (bo = null), le(Eo);
	}
	var Eo = q(0);
	function Do(e, t) {
		ue(yo, yo.current), ue(Eo, t);
	}
	function Oo(e) {
		le(Eo), le(yo), bo === e && (bo = null);
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
		for (var n = 0; n < t.length && n < e.length; n++) if (!Or(e[n], t[n])) return !1;
		return !0;
	}
	function Ho(e, t, n, r, i, a) {
		return Ao = a, $ = t, t.memoizedState = null, t.updateQueue = null, t.lanes = 0, K.H = e === null || e.memoizedState === null ? ac : oc, Fo = !1, a = n(r, i), Fo = !1, Po && (a = Wo(t, n, r, i)), Uo(e), a;
	}
	function Uo(e) {
		K.H = ic;
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
			K.H = sc, o = t(n, r);
		} while (Po);
		return o;
	}
	function Go() {
		var e = K.H, t = e.useState()[0];
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
		return Lo += 1, Ro === null && (Ro = []), e = Ha(Ro, e, t), t = $, (Mo === null ? t.memoizedState : Mo.next) === null && (t = t.alternate, K.H = t === null || t.memoizedState === null ? ac : oc), e;
	}
	function $o(e) {
		if (typeof e == "object" && e) {
			if (typeof e.then == "function") return Qo(e);
			if (e.$$typeof === W) return;
			if (e.$$typeof === F) return pa(e);
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
		}, n === null && (n = Zo(), $.updateQueue = n), n.memoCache = t, n = t.data[t.index], n === void 0) for (n = t.data[t.index] = Array(e), r = 0; r < e; r++) n[r] = H;
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
			if (l === null ? s = o : l.next = c, !Or(o, e.memoizedState) && (Cc = !0, d && (n = Oa, n !== null))) throw n;
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
			Or(o, t.memoizedState) || (Cc = !0), t.memoizedState = o, t.baseQueue === null && (t.baseState = o), n.lastRenderedState = o;
		}
		return [o, r];
	}
	function as(e, t, n) {
		var r = $, a = Xo(), o = Ki;
		if (o) {
			if (n === void 0) throw Error(i(407));
			n = n();
		} else n = t();
		var s = !Or((jo || a).memoizedState, n);
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
			return !Or(e, n);
		} catch {
			return !0;
		}
	}
	function us(e) {
		var t = mi(e, 2);
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
			K.T === null ? o.isTransition = !1 : n(!0), r(o), n = t.pending, n === null ? (o.next = t.pending = o, ms(t, o)) : (o.next = n.next, t.pending = n.next = o);
		}
	}
	function ms(e, t) {
		var n = t.action, r = t.payload, i = e.state;
		if (t.isTransition) {
			var a = K.T, o = {};
			o.types = a === null ? null : a.types, K.T = o;
			try {
				var s = n(i, r), c = K.S;
				c !== null && c(o, s), hs(e, t, s);
			} catch (n) {
				_s(e, t, n);
			} finally {
				a !== null && o.types !== null && (a.types = o.types), K.T = a;
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
		if (Ki) {
			var n = qu.formState;
			if (n !== null) {
				a: {
					var r = $;
					if (Ki) {
						if (Gi) {
							b: {
								for (var i = Gi, a = Ji; i.nodeType !== 8;) {
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
								Gi = lm(i.nextSibling), r = i.data === "F!";
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
		return Or(n, t) ? n : mo.current === null ? !(Ao & 106) || Ao & 1073741824 && !(Yu & 261930) ? (Cc = !0, e.memoizedState = n) : (e = kd(), $.lanes |= e, rd |= e, t) : (e = Bs(e, n, r), Or(e, t) || (Cc = !0), e);
	}
	function Hs(e, t, n, r, i) {
		var a = ae.p;
		ae.p = a !== 0 && 8 > a ? a : 8;
		var o = K.T, s = {};
		s.types = o === null ? null : o.types, K.T = s, ec(e, !1, t, n);
		try {
			var c = i(), l = K.S;
			l !== null && l(s, c), typeof c == "object" && c && typeof c.then == "function" ? $s(e, t, ja(c, r), Od(e)) : $s(e, t, r, Od(e));
		} catch (n) {
			$s(e, t, {
				then: function() {},
				status: "rejected",
				reason: n
			}, Od());
		} finally {
			ae.p = a, o !== null && s.types !== null && (o.types = s.types), K.T = o;
		}
	}
	function Us() {}
	function Ws(e, t, n, r) {
		if (e.tag !== 5) throw Error(i(476));
		var a = Gs(e).queue;
		Hs(e, a, t, oe, n === null ? Us : function() {
			return Ks(e), n(r);
		});
	}
	function Gs(e) {
		var t = e.memoizedState;
		if (t !== null) return t;
		t = {
			memoizedState: oe,
			baseState: oe,
			baseQueue: null,
			queue: {
				pending: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: ts,
				lastRenderedState: oe
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
		}, tc(e) ? nc(t, n) : (n = pi(e, t, n, r), n !== null && (jd(n, e, r), rc(n, t, r)));
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
				if (i.hasEagerState = !0, i.eagerState = s, Or(s, o)) return fi(e, t, i, 0), qu === null && di(), !1;
			} catch {}
			if (n = pi(e, t, i, r), n !== null) return jd(n, e, r), rc(n, t, r), !0;
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
		} else t = pi(e, n, r, 2), t !== null && jd(t, e, 2);
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
			if (Ki) {
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
			if (Ki) {
				var n = Ri, r = Li;
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
		return e = e.stateNode, typeof e.shouldComponentUpdate == "function" ? e.shouldComponentUpdate(r, a, o) : t.prototype && t.prototype.isPureReactComponent ? !kr(n, r) || !kr(i, a) : !0;
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
		si(e);
	}
	function mc(e) {
		console.error(e);
	}
	function hc(e) {
		si(e);
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
		if (Ki) return t = yo.current, t === null ? (r !== Yi && (t = Error(i(423), { cause: r }), na(ki(t, n))), e = e.current.alternate, e.flags |= 65536, a &= -a, e.lanes |= a, r = ki(r, n), a = vc(e.stateNode, r, a), so(e, a), nd !== 4 && (nd = 2)) : (!(t.flags & 65536) && (t.flags |= 256), t.flags |= 65536, t.lanes = a, r !== Yi && (e = Error(i(422), { cause: r }), na(ki(e, n)))), !1;
		var o = Error(i(520), { cause: r });
		if (o = ki(o, n), cd === null ? cd = [o] : cd.push(o), nd !== 4 && (nd = 2), t === null) return !0;
		r = ki(r, n), n = t;
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
		return fa(t), r = Ho(e, t, n, o, a, i), s = Ko(), e !== null && !Cc ? (qo(e, t, i), $c(e, t, i)) : (Ki && s && Vi(t), t.flags |= 1, wc(e, t, r, i), t.child);
	}
	function Ec(e, t, n, r, i) {
		if (e === null) {
			var a = n.type;
			return typeof a == "function" && !bi(a) && a.defaultProps === void 0 && n.compare === null ? (t.tag = 15, t.type = a, Dc(e, t, a, r, i)) : (e = Ci(n.type, null, r, t, t.mode, i), e.ref = t.ref, e.return = t, t.child = e);
		}
		if (a = e.child, !el(e, i)) {
			var o = a.memoizedProps;
			if (n = n.compare, n = n === null ? kr : n, n(o, r) && e.ref === t.ref) return $c(e, t, i);
		}
		return t.flags |= 1, e = xi(a, r), e.ref = t.ref, e.return = t, t.child = e;
	}
	function Dc(e, t, n, r, i) {
		if (e !== null) {
			var a = e.memoizedProps;
			if (kr(a, r) && e.ref === t.ref) {
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
			if (Ki) {
				if (r.mode === "hidden") return e = jc(t, r), t.lanes = 536870912, e.memoizedState = {
					baseLanes: 0,
					cachePool: null
				}, kc(null, e);
				if (So(t), (e = Gi) ? (e = am(e, Ji), e = e !== null && e.data === "&" ? e : null, e !== null && (t.memoizedState = {
					dehydrated: e,
					treeContext: Ii === null ? null : {
						id: Li,
						overflow: Ri
					},
					retryLane: 536870912,
					hydrationErrors: null
				}, n = Ei(e), n.return = t, t.child = n, Wi = t, Gi = null)) : e = null, e === null) throw Xi(t);
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
					if (r = qu, r !== null && (s = st(r, n), s !== 0 && s !== o.retryLane)) throw o.retryLane = s, mi(e, s), jd(r, e, s), Sc;
					Ud();
				}
				t = Mc(e, t, n);
			} else e = o.treeContext, Gi = lm(s.nextSibling), Wi = t, Ki = !0, qi = null, Ji = !1, e !== null && Ui(t, e), t = jc(t, r), t.flags |= 134221824;
			return t;
		}
		return e = xi(e.child, {
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
		return fa(t), n = Ho(e, t, n, r, void 0, i), r = Ko(), e !== null && !Cc ? (qo(e, t, i), $c(e, t, i)) : (Ki && r && Vi(t), t.flags |= 1, wc(e, t, n, i), t.child);
	}
	function Ic(e, t, n, r, i, a) {
		return fa(t), t.updateQueue = null, n = Wo(t, r, n, i), Uo(e), r = Ko(), e !== null && !Cc ? (qo(e, t, a), $c(e, t, a)) : (Ki && r && Vi(t), t.flags |= 1, wc(e, t, n, a), t.child);
	}
	function Lc(e, t, n, r, i) {
		if (fa(t), t.stateNode === null) {
			var a = _i, o = n.contextType;
			typeof o == "object" && o && (a = pa(o)), a = new n(r, a), t.memoizedState = a.state !== null && a.state !== void 0 ? a.state : null, a.updater = lc, t.stateNode = a, a._reactInternals = t, a = t.stateNode, a.props = r, a.state = t.memoizedState, a.refs = {}, no(t), o = n.contextType, a.context = typeof o == "object" && o ? pa(o) : _i, a.state = t.memoizedState, o = n.getDerivedStateFromProps, typeof o == "function" && (cc(t, n, o, r), a.state = t.memoizedState), typeof n.getDerivedStateFromProps == "function" || typeof a.getSnapshotBeforeUpdate == "function" || typeof a.UNSAFE_componentWillMount != "function" && typeof a.componentWillMount != "function" || (o = a.state, typeof a.componentWillMount == "function" && a.componentWillMount(), typeof a.UNSAFE_componentWillMount == "function" && a.UNSAFE_componentWillMount(), o !== a.state && lc.enqueueReplaceState(a, a.state, null), uo(t, r, a, i), lo(), a.state = t.memoizedState), typeof a.componentDidMount == "function" && (t.flags |= 4194308), r = !0;
		} else if (e === null) {
			a = t.stateNode;
			var s = t.memoizedProps, c = fc(n, s);
			a.props = c;
			var l = a.context, u = n.contextType;
			o = _i, typeof u == "object" && u && (o = pa(u));
			var d = n.getDerivedStateFromProps;
			u = typeof d == "function" || typeof a.getSnapshotBeforeUpdate == "function", s = t.pendingProps !== s, u || typeof a.UNSAFE_componentWillReceiveProps != "function" && typeof a.componentWillReceiveProps != "function" || (s || l !== o) && dc(t, a, r, o), to = !1;
			var f = t.memoizedState;
			a.state = f, uo(t, r, a, i), lo(), l = t.memoizedState, s || f !== l || to ? (typeof d == "function" && (cc(t, n, d, r), l = t.memoizedState), (c = to || uc(t, n, c, r, f, l, o)) ? (u || typeof a.UNSAFE_componentWillMount != "function" && typeof a.componentWillMount != "function" || (typeof a.componentWillMount == "function" && a.componentWillMount(), typeof a.UNSAFE_componentWillMount == "function" && a.UNSAFE_componentWillMount()), typeof a.componentDidMount == "function" && (t.flags |= 4194308)) : (typeof a.componentDidMount == "function" && (t.flags |= 4194308), t.memoizedProps = r, t.memoizedState = l), a.props = r, a.state = l, a.context = o, r = c) : (typeof a.componentDidMount == "function" && (t.flags |= 4194308), r = !1);
		} else {
			a = t.stateNode, ro(e, t), o = t.memoizedProps, u = fc(n, o), a.props = u, d = t.pendingProps, f = a.context, l = n.contextType, c = _i, typeof l == "object" && l && (c = pa(l)), s = n.getDerivedStateFromProps, (l = typeof s == "function" || typeof a.getSnapshotBeforeUpdate == "function") || typeof a.UNSAFE_componentWillReceiveProps != "function" && typeof a.componentWillReceiveProps != "function" || (o !== d || f !== c) && dc(t, a, r, c), to = !1, f = t.memoizedState, a.state = f, uo(t, r, a, i), lo();
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
			if (Ki) {
				if (i ? xo(t) : wo(), (e = Gi) ? (e = am(e, Ji), e = e !== null && e.data !== "&" ? e : null, e !== null && (t.memoizedState = {
					dehydrated: e,
					treeContext: Ii === null ? null : {
						id: Li,
						overflow: Ri
					},
					retryLane: 536870912,
					hydrationErrors: null
				}, n = Ei(e), n.return = t, t.child = n, Wi = t, Gi = null)) : e = null, e === null) throw Xi(t);
				return t.lanes = sm(e) ? 32 : 536870912, null;
			}
			return a = r.children, r = r.fallback, i ? (wo(), i = t.mode, a = Wc({
				mode: "hidden",
				children: a
			}, i), r = wi(r, i, n, null), a.return = t, r.return = t, a.sibling = r, t.child = a, r = t.child, r.memoizedState = Bc(n), r.childLanes = Vc(e, o, n), t.memoizedState = zc, kc(null, r)) : (xo(t), Uc(t, a));
		}
		var s = e.memoizedState;
		if (s !== null) {
			var c = s.dehydrated;
			if (c !== null) return Kc(e, t, a, o, r, c, s, n);
		}
		return i ? (wo(), i = r.fallback, a = t.mode, s = e.child, c = s.sibling, r = xi(s, {
			mode: "hidden",
			children: r.children
		}), r.subtreeFlags = s.subtreeFlags & 1206910976, c === null ? (i = wi(i, a, n, null), i.flags |= 2) : i = xi(c, i), i.return = t, r.return = t, r.sibling = i, t.child = r, kc(null, r), r = t.child, i = e.child.memoizedState, i === null ? i = Bc(n) : (a = i.cachePool, a === null ? a = Ia() : (s = ya._currentValue, a = a.parent === s ? a : {
			parent: s,
			pool: s
		}), i = {
			baseLanes: i.baseLanes | n,
			cachePool: a
		}), r.memoizedState = i, r.childLanes = Vc(e, o, n), t.memoizedState = zc, kc(e.child, r)) : (xo(t), n = e.child, e = n.sibling, n = xi(n, {
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
		return e = yi(22, e, null, t), e.lanes = 0, e;
	}
	function Gc(e, t, n) {
		return $a(t, e.child, null, n), e = Uc(t, t.pendingProps.children), e.flags |= 2, t.memoizedState = null, e;
	}
	function Kc(e, t, n, r, a, o, s, c) {
		if (n) return t.flags & 256 ? (xo(t), t.flags &= -257, Gc(e, t, c)) : t.memoizedState === null ? (wo(), o = a.fallback, s = t.mode, a = Wc({
			mode: "visible",
			children: a.children
		}, s), o = wi(o, s, c, null), o.flags |= 2, a.return = t, o.return = t, a.sibling = o, t.child = a, $a(t, e.child, null, c), a = t.child, a.memoizedState = Bc(c), a.childLanes = Vc(e, r, c), t.memoizedState = zc, kc(null, a)) : (wo(), t.child = e.child, t.flags |= 128, null);
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
			if (r = qu, r !== null && (a = st(r, c), a !== 0 && a !== s.retryLane)) throw s.retryLane = a, mi(e, a), jd(r, e, a), Sc;
			return om(o) || Ud(), Gc(e, t, c);
		}
		return om(o) ? (t.flags |= 192, t.child = e.child, null) : (e = s.treeContext, Gi = lm(o.nextSibling), Wi = t, Ki = !0, qi = null, Ji = !1, e !== null && Ui(t, e), t = Uc(t, a.children), t.flags |= 134221824, t);
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
		if (s ? (o = o & 1 | 2, t.flags |= 128) : o &= 1, Do(t, o), i === "backwards" && e !== null ? (Xc(e), wc(e, t, r, n), Xc(e)) : wc(e, t, r, n), r = Ki ? Ni : 0, !s && e !== null && e.flags & 128) a: for (e = t.child; e !== null;) {
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
			for (e = t.child, n = xi(e, e.pendingProps), t.child = n, n.return = t; e.sibling !== null;) e = e.sibling, n = n.sibling = xi(e, e.pendingProps), n.return = t;
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
				he(t, t.stateNode.containerInfo), oa(t, ya, e.memoizedState.cache), ea();
				break;
			case 27:
			case 5:
				_e(t);
				break;
			case 4:
				he(t, t.stateNode.containerInfo);
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
		} else Cc = !1, Ki && t.flags & 1048576 && Bi(t, Ni, t.index);
		switch (t.lanes = 0, t.tag) {
			case 16:
				a: {
					var r = t.pendingProps;
					if (e = Ua(t.elementType), t.type = e, typeof e == "function") bi(e) ? (r = fc(e, r), t.tag = 1, t = Lc(null, t, e, r, n)) : (t.tag = 0, t = Fc(null, t, e, r, n));
					else {
						if (e != null) {
							var a = e.$$typeof;
							if (a === I) {
								t.tag = 11, t = Tc(null, t, e, r, n);
								break a;
							}
							if (a === z) {
								t.tag = 14, t = Ec(null, t, e, r, n);
								break a;
							}
							if (a === F) {
								t.tag = 10, t.type = e, t = Qc(null, t, n);
								break a;
							}
						}
						throw t = re(e) || e, Error(i(306, t, ""));
					}
				}
				return t;
			case 0: return Fc(e, t, t.type, t.pendingProps, n);
			case 1: return r = t.type, a = fc(r, t.pendingProps), Lc(e, t, r, a, n);
			case 3:
				a: {
					if (he(t, t.stateNode.containerInfo), e === null) throw Error(i(387));
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
							a = ki(Error(i(424)), t), na(a), t = Rc(e, t, r, n);
							break a;
						}
						switch (e = t.stateNode.containerInfo, e.nodeType) {
							case 9:
								e = e.body;
								break;
							default: e = e.nodeName === "HTML" ? e.ownerDocument.body : e;
						}
						for (Gi = lm(e.firstChild), Wi = t, Ki = !0, qi = null, Ji = !0, n = eo(t, null, r, n), t.child = n; n;) n.flags = n.flags & -3 | 134221824, n = n.sibling;
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
			case 26: return Pc(e, t), e === null ? (n = Nm(t.type, null, t.pendingProps, null)) ? t.memoizedState = n : Ki || (t.stateNode = fp(t.type, t.pendingProps, pe.current, t)) : t.memoizedState = Nm(t.type, e.memoizedProps, t.pendingProps, e.memoizedState), null;
			case 27: return _e(t), e === null && Ki && (r = t.stateNode = hm(t.type, t.pendingProps, pe.current), Wi = t, Ji = !0, a = Gi, Sp(t.type) ? (um = a, Gi = lm(r.firstChild)) : Gi = a), wc(e, t, t.pendingProps.children, n), Pc(e, t), e === null && (t.flags |= 4194304), t.child;
			case 5: return e === null && Ki && ((a = r = Gi) && (r = rm(r, t.type, t.pendingProps, Ji), r === null ? a = !1 : (t.stateNode = r, Wi = t, Gi = lm(r.firstChild), Ji = !1, a = !0)), a || Xi(t)), _e(t), a = t.type, o = t.pendingProps, s = e === null ? null : e.memoizedProps, r = o.children, pp(a, o) ? r = null : s !== null && pp(a, s) && (t.flags |= 32), t.memoizedState !== null && (a = Ho(e, t, Go, null, null, n), sh._currentValue = a), Pc(e, t), wc(e, t, r, n), t.child;
			case 6: return e === null && Ki && ((e = n = Gi) && (n = im(n, t.pendingProps, Ji), n === null ? e = !1 : (t.stateNode = n, Wi = t, Gi = null, e = !0)), e || Xi(t)), null;
			case 13: return Hc(e, t, n);
			case 4: return he(t, t.stateNode.containerInfo), r = t.pendingProps, e === null ? t.child = $a(t, null, r, n) : wc(e, t, r, n), t.child;
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
			}), r = t.pendingProps, r.name != null && r.name !== "auto" ? t.flags |= e === null ? 18882560 : 18874368 : Ki && Vi(t), e !== null && e.memoizedProps.name !== r.name ? t.flags |= 4194816 : Pc(e, t), wc(e, t, r.children, n), t.child;
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
		if (!Ki) switch (e.tailMode) {
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
		switch (Hi(t), t.tag) {
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
			case 3: return n = t.stateNode, r = null, e !== null && (r = e.memoizedState.cache), t.memoizedState.cache !== r && (t.flags |= 2048), sa(ya), ge(), n.pendingContext && (n.context = n.pendingContext, n.pendingContext = null), (e === null || e.child === null) && ($i(t) ? rl(t) : e === null || e.memoizedState.isDehydrated && !(t.flags & 256) || (t.flags |= 1024, ta())), cl(t), null;
			case 26:
				var a = t.type, o = t.memoizedState;
				return e === null ? (rl(t), o === null ? (cl(t), il(t, a, null, r, n)) : (cl(t), al(t, o))) : o ? o === e.memoizedState ? (cl(t), t.flags &= -16777217) : (rl(t), cl(t), al(t, o)) : (e = e.memoizedProps, e !== r && rl(t), cl(t), il(t, a, e, r, n)), null;
			case 27:
				if (ve(t), n = pe.current, a = t.type, e !== null && t.stateNode != null) e.memoizedProps !== r && rl(t);
				else {
					if (!r) {
						if (t.stateNode === null) throw Error(i(166));
						return cl(t), t.subtreeFlags &= -33554433, null;
					}
					e = de.current, $i(t) ? Zi(t, e) : (e = hm(a, r, n), t.stateNode = e, rl(t));
				}
				return cl(t), t.subtreeFlags &= -33554433, null;
			case 5:
				if (ve(t), a = t.type, e !== null && t.stateNode != null) e.memoizedProps !== r && rl(t);
				else {
					if (!r) {
						if (t.stateNode === null) throw Error(i(166));
						return cl(t), t.subtreeFlags &= -33554433, null;
					}
					if (o = de.current, $i(t)) Zi(t, o);
					else {
						var s = lp(pe.current);
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
					if (e = pe.current, $i(t)) {
						if (e = t.stateNode, n = t.memoizedProps, r = null, a = Wi, a !== null) switch (a.tag) {
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
			case 4: return ge(), e === null && Uf(t.stateNode.containerInfo), t.flags |= 67108864, cl(t), null;
			case 10: return sa(t.type), cl(t), null;
			case 19:
				if (Oo(t), r = t.memoizedState, r === null) return cl(t), null;
				if (a = !!(t.flags & 128), o = r.rendering, o === null) {
					if (a) sl(r, !1);
					else {
						if (nd !== 0 || e !== null && e.flags & 128) for (e = t.child; e !== null;) {
							if (o = ko(e), o !== null) {
								for (t.flags |= 128, sl(r, !1), e = o.updateQueue, t.updateQueue = e, ol(t, e), t.subtreeFlags = 0, e = n, n = t.child; n !== null;) Si(n, e), n = n.sibling;
								return Do(t, Eo.current & 1 | 2), Ki && zi(t, r.treeForkCount), t.child;
							}
							e = e.sibling;
						}
						r.tail !== null && je() > pd && (t.flags |= 128, a = !0, sl(r, !1), t.lanes = 4194304);
					}
				} else {
					if (!a) {
						if (e = ko(o), e !== null) {
							if (t.flags |= 128, a = !0, e = e.updateQueue, t.updateQueue = e, ol(t, e), sl(r, !0), r.tail === null && r.tailMode !== "collapsed" && r.tailMode !== "visible" && !o.alternate && !Ki) return cl(t), null;
						} else 2 * je() - r.renderingStartTime > pd && n !== 536870912 && (t.flags |= 128, a = !0, sl(r, !1), t.lanes = 4194304);
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
					return r.rendering = e, r.tail = e.sibling, r.renderingStartTime = je(), e.sibling = null, o = Eo.current, o = a ? o & 1 | 2 : o & 1, r.tailMode === "visible" || r.tailMode === "collapsed" || !n || Ki ? Do(t, o) : (n = o, ue(yo, t), ue(Eo, n), bo === null && (bo = t)), Ki && zi(t, r.treeForkCount), e;
				}
				return cl(t), null;
			case 22:
			case 23: return To(t), vo(), r = t.memoizedState !== null, e === null ? r && (t.flags |= 8192) : e.memoizedState !== null !== r && (t.flags |= 8192), r ? n & 536870912 && !(t.flags & 128) && (cl(t), t.subtreeFlags & 6 && (t.flags |= 8192)) : cl(t), n = t.updateQueue, n !== null && ol(t, n.retryQueue), n = null, e !== null && e.memoizedState !== null && e.memoizedState.cachePool !== null && (n = e.memoizedState.cachePool.pool), r = null, t.memoizedState !== null && t.memoizedState.cachePool !== null && (r = t.memoizedState.cachePool.pool), r !== n && (t.flags |= 2048), e !== null && le(Na), null;
			case 24: return n = null, e !== null && (n = e.memoizedState.cache), t.memoizedState.cache !== n && (t.flags |= 2048), sa(ya), cl(t), null;
			case 25: return null;
			case 30: return t.flags |= 33554432, cl(t), null;
		}
		throw Error(i(156, t.tag));
	}
	function ul(e, t) {
		switch (Hi(t), t.tag) {
			case 1: return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 3: return sa(ya), ge(), e = t.flags, e & 65536 && !(e & 128) ? (t.flags = e & -65537 | 128, t) : null;
			case 26:
			case 27:
			case 5: return ve(t), null;
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
			case 4: return ge(), null;
			case 10: return sa(t.type), null;
			case 22:
			case 23: return To(t), vo(), e !== null && le(Na), e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 24: return sa(ya), null;
			case 25: return null;
			default: return null;
		}
	}
	function dl(e, t) {
		switch (Hi(t), t.tag) {
			case 3:
				sa(ya), ge();
				break;
			case 26:
			case 27:
			case 5:
				ve(t);
				break;
			case 4:
				ge();
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
				To(t), vo(), e !== null && le(Na);
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
						var i = e.stateNode, a = ii(e.memoizedProps, i);
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
		if (i === 5 || i === 6) i = e.stateNode, t ? (n.nodeType === 9 ? n.body : n.nodeName === "HTML" ? n.ownerDocument.body : n).insertBefore(i, t) : (t = n.nodeType === 9 ? n.body : n.nodeName === "HTML" ? n.ownerDocument.body : n, t.appendChild(i), n = n._reactRootContainer, n != null || t.onclick !== null || (t.onclick = cn)), vl(e, r), Ft = !0;
		else if (i !== 4 && (i === 27 && (vl(e, r), r = null, Sp(e.type) && (n = e.stateNode, t = null)), e = e.child, e !== null)) for (Dl(e, t, n, r), e = e.sibling; e !== null;) Dl(e, t, n, r), e = e.sibling;
	}
	function Ol(e, t, n, r) {
		var i = e.tag;
		if (i === 5 || i === 6) i = e.stateNode, t ? n.insertBefore(i, t) : n.appendChild(i), vl(e, r), Ft = !0;
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
				t = oi(t.default, t.share), t !== "none" && (Il(e, n, t, null, !1) || Rl(e.child, !1));
			}
			e = e.sibling;
		}
	}
	function Bl(e, t) {
		if (e.tag === 30) {
			var n = e.stateNode, r = e.memoizedProps, i = ii(r, n), a = oi(r.default, n.paired ? r.share : r.enter);
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
								var a = oi(n.default, n.share);
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
			var t = e.memoizedProps, n = ii(t, e.stateNode), r = jl === null ? void 0 : jl.get(n), i = oi(t.default, r === void 0 ? t.exit : t.share);
			i !== "none" && (Il(e, n, i, null, !1) ? r === void 0 ? Ad(e, t.onExit) : (i = e.stateNode, r.paired = i, i.paired = r, jl.delete(n), Ad(e, t.onShare)) : Rl(e.child, !1)), jl !== null && Vl(e);
		} else if (e.subtreeFlags & 33554432) for (e = e.child; e !== null;) Hl(e), e = e.sibling;
		else jl !== null && Vl(e);
	}
	function Ul(e) {
		for (e = e.child; e !== null;) {
			if (e.tag === 30) {
				var t = e.memoizedProps, n = ii(t, e.stateNode);
				t = oi(t.default, t.update), e.flags &= -5, t !== "none" && Il(e, n, t, e.memoizedState = [], !1);
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
				var n = e.memoizedProps, r = e.stateNode, i = ii(n, r), a = oi(n.default, n.update);
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
		if (e = e.containerInfo, sp = gh, e = Pr(e), Fr(e)) {
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
					n && r !== null && (n = ii(r.memoizedProps, r.stateNode), a = t.memoizedProps, a = oi(a.default, a.update), a !== "none" && Il(r, n, a, r.memoizedState = [], !0));
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
					e.stateNode.nodeValue = t ? "" : e.memoizedProps, Ft = !0;
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
		t !== null && (e.alternate = null, du(t)), e.child = null, e.deletions = null, e.sibling = null, e.tag === 5 && (t = e.stateNode, t !== null && St(t)), e.stateNode = null, e.return = null, e.dependencies = null, e.memoizedProps = null, e.memoizedState = null, e.pendingProps = null, e.stateNode = null, e.updateQueue = null;
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
						(fu.nodeType === 9 ? fu.body : fu.nodeName === "HTML" ? fu.ownerDocument.body : fu).removeChild(n.stateNode), Ft = !0;
					} catch (e) {
						df(n, t, e);
					}
					else try {
						fu.removeChild(n.stateNode), Ft = !0;
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
												r = a.getElementsByTagName("title")[0], (!r || r[bt] || r[pt] || r.namespaceURI === "http://www.w3.org/2000/svg" || r.hasAttribute("itemprop")) && (r = a.createElement(t), a.head.insertBefore(r, a.querySelector("head > title"))), np(r, t, n), r[pt] = e, Dt(r), t = r;
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
										r[pt] = e, Dt(r), t = r;
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
						$t(t, ""), Ft = !0;
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
						n.nodeValue = t, Ft = !0;
					} catch (t) {
						df(e, e.return, t);
					}
				}
				break;
			case 3:
				if (Ft = !1, Wm = null, o = xu, xu = bm(t.containerInfo), bu(t, e, n), xu = o, Cu(e), a & 4 && r !== null && r.memoizedState.isDehydrated) try {
					Hh(t.containerInfo);
				} catch (t) {
					df(e, e.return, t);
				}
				Ql && (Ql = !1, wu(e)), Ft = !1;
				break;
			case 4:
				a = Zl, Zl = Yl, r = It(), o = xu, xu = bm(e.stateNode.containerInfo), bu(t, e, n), Cu(e), xu = o, Ft && nu && (ru = !0), Ft = r, Zl = a;
				break;
			case 12:
				bu(t, e, n), Cu(e);
				break;
			case 31:
				bu(t, e, n), Cu(e), a & 4 && (t = e.updateQueue, t !== null && (e.updateQueue = null, yu(e, t)));
				break;
			case 13:
				bu(t, e, n), Cu(e), e.child.flags & 8192 && e.memoizedState !== null != (r !== null && r.memoizedState !== null) && (dd = je()), a & 4 && (t = e.updateQueue, t !== null && (e.updateQueue = null, yu(e, t)));
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
				a & 512 && (Xl || r === null || _l(r, r.return)), a = It(), o = nu, s = (n & 335544064) === n, c = e.memoizedProps, nu = s && oi(c.default, c.update) !== "none", bu(t, e, n), Cu(e), s && r !== null && Ft && (e.flags |= 4), nu = o, Ft = a;
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
						n.flags & 32 && ($t(l, ""), n.flags &= -33), Ol(e, El(e), l, s);
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
				t = ii(a, o), o = ii(n.memoizedProps, o);
				var s = oi(a.default, a.update);
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
		return Ku & 2 && Yu !== 0 ? Yu & -Yu : K.T === null ? ut() : Mf();
	}
	function kd() {
		if (od === 0) {
			if (!(Yu & 536870912) || Ki) {
				var e = Je;
				Je <<= 1, !(Je & 3932160) && (Je = 262144), od = e;
			} else od = 536870912;
		}
		return e = yo.current, e !== null && (e.flags |= 32), od;
	}
	function Ad(e, t) {
		if (t != null) {
			var n = e.stateNode, r = n.ref;
			r === null && (r = n.ref = Pp(ii(e.memoizedProps, n))), wd === null && (wd = []), wd.push(t.bind(null, r));
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
				if ((t & 62914560) === t && (a = dd + 300 - je(), 10 < a)) {
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
			unsuspend: cn
		}, jl = null, Ru(t, a, d), h && (m = d, h = e.containerInfo, h = (h.nodeType === 9 ? h : h.ownerDocument).__reactViewTransition, h != null && (m.count++, m.waitingForViewTransition = !0, m = nh.bind(m), h.finished.then(m, m))), m = (a & 62914560) === a ? dd - je() : (a & 4194048) === a ? fd - je() : 0, m = eh(d, m), m !== null)) {
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
					if (!Or(a(), i)) return !1;
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
		return n !== -1 && (e.timeoutHandle = -1, _p(n)), n = e.cancelPendingCommit, n !== null && (e.cancelPendingCommit = null, n()), yd = 0, Ld(), qu = e, Ju = n = xi(e.current, null), Yu = t, Xu = 0, Zu = null, Qu = !1, $u = Qe(e, t), ed = !1, sd = od = ad = id = rd = nd = 0, ld = cd = null, ud = !1, td = $e(e, t), di(), n;
	}
	function zd(e, t) {
		$ = null, K.H = ic, t === La || t === za ? (t = Ga(), Xu = 3) : t === Ra ? (t = Ga(), Xu = 4) : Xu = t === Sc ? 8 : typeof t == "object" && t && typeof t.then == "function" ? 6 : 1, Zu = t, Ju === null && (nd = 1, gc(e, ki(t, e.current)));
	}
	function Bd() {
		var e = yo.current;
		return e === null ? !0 : (Yu & 4194048) === Yu ? bo === null : (Yu & 62914560) === Yu || Yu & 536870912 ? e === bo : !1;
	}
	function Vd() {
		var e = K.H;
		return K.H = ic, e === null ? ic : e;
	}
	function Hd() {
		var e = K.A;
		return K.A = Wu, e;
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
		return t && e.shellSuspendCounter++, aa = ia = null, Ku = r, K.H = i, K.A = a, Ju === null && (qu = null, Yu = 0, di()), o;
	}
	function Gd() {
		for (; Ju !== null;) Jd(Ju);
	}
	function Kd(e, t) {
		var n = Ku;
		Ku |= 2;
		var r = Vd(), a = Hd();
		qu !== e || Yu !== t ? (md = null, pd = je() + 500, Rd(e, t)) : $u = Qe(e, t);
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
		return aa = ia = null, K.H = r, K.A = a, Ku = n, Ju === null ? (qu = null, Yu = 0, di(), nd) : 0;
	}
	function qd() {
		for (; Ju !== null && !ke();) Jd(Ju);
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
				r === Wi && (Ki ? (Qi(r), r.tag === 5 && r.stateNode != null && (Gi = r.stateNode)) : (Qi(r), Ki = !0));
			default: dl(n, t), t = Ju = Si(t, td), t = nl(n, t, td);
		}
		e.memoizedProps = e.pendingProps, t === null ? Zd(e) : Ju = t;
	}
	function Xd(e, t, n, r) {
		aa = ia = null, Jo(t), qa = null, Ja = 0;
		var i = t.return;
		try {
			if (xc(e, i, t, n, Yu)) {
				nd = 1, gc(e, ki(n, e.current)), Ju = null;
				return;
			}
		} catch (t) {
			if (i !== null) throw Ju = i, t;
			nd = 1, gc(e, ki(n, e.current)), Ju = null;
			return;
		}
		t.flags & 32768 ? (Ki || r === 1 ? e = !0 : $u || Yu & 536870912 ? e = !1 : (Qu = e = !0, (r === 2 || r === 9 || r === 3 || r === 6) && (r = yo.current, r !== null && r.tag === 13 && (r.flags |= 16384))), Qd(t, e)) : Zd(t);
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
		if (bd = s, s |= ui, it(e, n, s, r, i, a), wd = null, (n & 335544064) === n ? (Td = wa(e), r = 10262) : (Td = null, r = 10256), (t.subtreeFlags & r) !== 0 || (t.flags & r) !== 0 ? (e.callbackNode = null, e.callbackPriority = 0, _f(Fe, function() {
			return lf(), null;
		})) : (e.callbackNode = null, e.callbackPriority = 0), Al = !1, r = !!(t.flags & 13878), t.subtreeFlags & 13878 || r) {
			r = K.T, K.T = null, i = ae.p, ae.p = 2, a = Ku, Ku |= 4;
			try {
				au(e, t, n);
			} finally {
				Ku = a, ae.p = i, K.T = r;
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
				r = K.T, K.T = null;
				var i = ae.p;
				ae.p = 2;
				var a = Ku;
				Ku |= 4;
				try {
					nu = ru = !1, Su(t, e, n), n = cp;
					var o = Pr(e.containerInfo), s = n.focusedElem, c = n.selectionRange;
					if (o !== s && s && s.ownerDocument && Nr(s.ownerDocument.documentElement, s)) {
						if (c !== null && Fr(s)) {
							var l = c.start, u = c.end;
							if (u === void 0 && (u = l), "selectionStart" in s) s.selectionStart = l, s.selectionEnd = Math.min(u, s.value.length);
							else {
								var d = s.ownerDocument || document, f = d && d.defaultView || window;
								if (f.getSelection) {
									var p = f.getSelection(), m = s.textContent.length, h = Math.min(c.start, m), g = c.end === void 0 ? h : Math.min(c.end, m);
									!p.extend && h > g && (o = g, g = h, h = o);
									var _ = Mr(s, h), v = Mr(s, g);
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
					Ku = a, ae.p = i, K.T = r;
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
				n = K.T, K.T = null;
				var r = ae.p;
				ae.p = 2;
				var i = Ku;
				Ku |= 4;
				try {
					su(e, t.alternate, t);
				} finally {
					Ku = i, ae.p = r, K.T = n;
				}
			}
			gd = 3;
		}
	}
	function of() {
		if (gd === 4 || gd === 3) {
			gd = 0;
			var e = Cd;
			Cd = null, Ae();
			var t = _d, n = vd, r = yd, i = Sd, a = (r & 335544064) === r ? 10262 : 10256;
			if ((n.subtreeFlags & a) !== 0 || (n.flags & a) !== 0 ? gd = 5 : (gd = 0, vd = _d = null, sf(t, t.pendingLanes)), a = t.pendingLanes, a === 0 && (hd = null), lt(r), n = n.stateNode, Ve && typeof Ve.onCommitFiberRoot == "function") try {
				Ve.onCommitFiberRoot(Be, n, void 0, (n.current.flags & 128) == 128);
			} catch {}
			if (i !== null) {
				n = K.T, a = ae.p, ae.p = 2, K.T = null;
				try {
					for (var o = t.onRecoverableError, s = 0; s < i.length; s++) {
						var c = i[s];
						o(c.value, { componentStack: c.stack });
					}
				} finally {
					K.T = n, ae.p = a;
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
		var n = lt(yd), r = K.T, a = ae.p;
		try {
			ae.p = 32 > n ? 32 : n, K.T = null, n = xd, xd = null;
			var o = _d, s = yd;
			if (gd = 0, vd = _d = null, yd = 0, Ku & 6) throw Error(i(331));
			var c = Ku;
			if (Ku |= 4, Vu(o.current), Nu(o, o.current, s, n), Ku = c, Tf(0, !1), Ve && typeof Ve.onPostCommitFiberRoot == "function") try {
				Ve.onPostCommitFiberRoot(Be, o);
			} catch {}
			return !0;
		} finally {
			ae.p = a, K.T = r, sf(e, t);
		}
	}
	function uf(e, t, n) {
		t = ki(n, t), t = vc(e.stateNode, t, 2), e = ao(e, t, 2), e !== null && (rt(e, 2), wf(e));
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
					e = ki(n, e), n = yc(2), r = ao(t, n, 2), r !== null && (bc(n, r, t, e), rt(r, 2), wf(r));
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
		r !== null && r.delete(t), e.pingedLanes |= e.suspendedLanes & n, e.warmLanes &= ~n, qu === e && (Yu & n) === n && (nd === 4 || nd === 3 && (Yu & 62914560) === Yu && 300 > je() - dd ? Ku & 2 ? ad |= n : Rd(e, 0) : ad |= n, sd === Yu && (sd = 0)), wf(e);
	}
	function mf(e, t) {
		t === 0 && (t = tt()), e = mi(e, t), e !== null && (rt(e, t), wf(e));
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
		return De(e, t);
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
		for (var t = je(), n = null, r = vf; r !== null;) {
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
		if (t = qu, n = Yu, n = Ze(e, e === t ? n : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1), r = e.callbackNode, n === 0 || e === t && (Xu === 2 || Xu === 9) || e.cancelPendingCommit !== null) return r !== null && r !== null && Oe(r), e.callbackNode = null, e.callbackPriority = 0;
		if (!(n & 3) || Qe(e, n)) {
			if (t = n & -n, t === e.callbackPriority) return t;
			switch (r !== null && Oe(r), lt(n)) {
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
			return r = kf.bind(null, e), n = De(n, r), e.callbackPriority = t, e.callbackNode = n, t;
		}
		return r !== null && r !== null && Oe(r), e.callbackPriority = 2, e.callbackNode = null, 2;
	}
	function kf(e, t) {
		if (gd !== 0 && gd !== 5) return e.callbackNode = null, e.callbackPriority = 0, null;
		var n = e.callbackNode;
		if (cf() && e.callbackNode !== n) return null;
		var r = Yu;
		return r = Ze(e, e === qu ? r : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1), r === 0 ? null : (Md(e, r, t), Of(e, je()), e.callbackNode != null && e.callbackNode === n ? kf.bind(null, e) : null);
	}
	function Af(e, t) {
		if (cf()) return null;
		Md(e, t, !0);
	}
	function jf() {
		bp(function() {
			Ku & 6 ? De(Ne, Ef) : Df();
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
		return e == null || typeof e == "symbol" || typeof e == "boolean" ? null : typeof e == "function" ? e : sn(e);
	}
	function Pf(e, t, n, r, i) {
		if (t === "submit" && n && n.stateNode === i) {
			var a = Nf((i[mt] || null).action), o = r.submitter;
			o && (t = (t = o[mt] || null) ? Nf(t.formAction) : o.getAttribute("formAction"), t !== null && (a = t, o = null));
			var s = new On("action", "action", null, r, i);
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
	for (var Ff = 0; Ff < ti.length; Ff++) {
		var If = ti[Ff];
		ni(If.toLowerCase(), "on" + (If[0].toUpperCase() + If.slice(1)));
	}
	ni(qr, "onAnimationEnd"), ni(Jr, "onAnimationIteration"), ni(Yr, "onAnimationStart"), ni("dblclick", "onDoubleClick"), ni("focusin", "onFocus"), ni("focusout", "onBlur"), ni(Xr, "onTransitionRun"), ni(Zr, "onTransitionStart"), ni(Qr, "onTransitionCancel"), ni($r, "onTransitionEnd"), J("onMouseEnter", ["mouseout", "mouseover"]), J("onMouseLeave", ["mouseout", "mouseover"]), J("onPointerEnter", ["pointerout", "pointerover"]), J("onPointerLeave", ["pointerout", "pointerover"]), jt("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" ")), jt("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" ")), jt("onBeforeInput", [
		"compositionend",
		"keypress",
		"textInput",
		"paste"
	]), jt("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" ")), jt("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" ")), jt("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
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
						si(e);
					}
					i.currentTarget = null, a = c;
				}
				else for (o = 0; o < r.length; o++) {
					if (s = r[o], c = s.instance, l = s.currentTarget, s = s.listener, c !== a && i.isPropagationStopped()) break a;
					a = s, i.currentTarget = l;
					try {
						a(i);
					} catch (e) {
						si(e);
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
			e[Hf] = !0, kt.forEach(function(t) {
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
		n = i.bind(null, t, n, e), i = void 0, !_n || t !== "touchstart" && t !== "touchmove" && t !== "wheel" || (i = !0), r ? i === void 0 ? e.addEventListener(t, n, !0) : e.addEventListener(t, n, {
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
					if (s = Ct(c), s === null) return;
					if (l = s.tag, l === 5 || l === 6 || l === 26 || l === 27) {
						r = a = s;
						continue a;
					}
					c = c.parentNode;
				}
			}
			r = r.return;
		}
		hn(function() {
			var r = a, i = un(n), s = [];
			a: {
				var c = ei.get(e);
				if (c !== void 0) {
					var l = On, u = e;
					switch (e) {
						case "keypress": if (Cn(n) === 0) break a;
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
						case qr:
						case Jr:
						case Yr:
							l = Ln;
							break;
						case $r:
							l = Q;
							break;
						case "scroll":
						case "scrollend":
							l = An;
							break;
						case "wheel":
							l = Yn;
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
						case "beforetoggle": l = Xn;
					}
					var d = !!(t & 4), f = !d && (e === "scroll" || e === "scrollend"), p = d ? c === null ? null : c + "Capture" : c;
					d = [];
					for (var m = r, h; m !== null;) {
						var g = m;
						if (h = g.stateNode, g = g.tag, g !== 5 && g !== 26 && g !== 27 || h === null || p === null || (g = X(m, p), g != null && d.push(Kf(m, g, h))), f) break;
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
					if (l = e === "mouseover" || e === "pointerover", c = e === "mouseout" || e === "pointerout", l && n !== ln && (u = n.relatedTarget || n.fromElement) && (Ct(u) || u[ht])) break a;
					(c || l) && (u = i.window === i ? i : (l = i.ownerDocument) ? l.defaultView || l.parentWindow : window, c ? (l = n.relatedTarget || n.toElement, c = r, l = l ? Ct(l) : null, l !== null && (f = o(l), d = l.tag, l !== f || d !== 5 && d !== 27 && d !== 6) && (l = null)) : (c = null, l = r), c !== l && (d = Pn, g = "onMouseLeave", p = "onMouseEnter", m = "mouse", (e === "pointerout" || e === "pointerover") && (d = Kn, g = "onPointerLeave", p = "onPointerEnter", m = "pointer"), f = c == null ? u : Tt(c), h = l == null ? u : Tt(l), u = new d(g, m + "leave", c, n, i), u.target = f, u.relatedTarget = h, g = null, Ct(i) === r && (d = new d(p, m + "enter", l, n, i), d.target = h, d.relatedTarget = f, g = d), f = g, d = c && l ? E(c, l, Jf) : null, c !== null && Yf(s, u, c, d, !1), l !== null && f !== null && Yf(s, f, l, d, !0)));
				}
				a: {
					if (c = r ? Tt(r) : window, l = c.nodeName && c.nodeName.toLowerCase(), l === "select" || l === "input" && c.type === "file") var _ = gr;
					else if (ur(c)) {
						if (_r) _ = Er;
						else {
							_ = wr;
							var v = Cr;
						}
					} else l = c.nodeName, !l || l.toLowerCase() !== "input" || c.type !== "checkbox" && c.type !== "radio" ? r && rn(r.elementType) && (_ = gr) : _ = Tr;
					if (_ &&= _(e, r)) {
						dr(s, _, n, i);
						break a;
					}
					v && v(e, c, r);
				}
				switch (v = r ? Tt(r) : window, e) {
					case "focusin":
						(ur(v) || v.contentEditable === "true") && (Lr = v, Rr = r, zr = null);
						break;
					case "focusout":
						zr = Rr = Lr = null;
						break;
					case "mousedown":
						Br = !0;
						break;
					case "contextmenu":
					case "mouseup":
					case "dragend":
						Br = !1, Vr(s, n, i);
						break;
					case "selectionchange": if (Ir) break;
					case "keydown":
					case "keyup": Vr(s, n, i);
				}
				var y;
				if (Qn) b: {
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
				else or ? ir(e, n) && (b = "onCompositionEnd") : e === "keydown" && n.keyCode === 229 && (b = "onCompositionStart");
				b && (tr && n.locale !== "ko" && (or || b !== "onCompositionStart" ? b === "onCompositionEnd" && or && (y = Sn()) : (yn = i, bn = "value" in yn ? yn.value : yn.textContent, or = !0)), v = qf(r, b), 0 < v.length && (b = new zn(b, e, null, n, i), s.push({
					event: b,
					listeners: v
				}), y ? b.data = y : (y = ar(n), y !== null && (b.data = y)))), (y = er ? sr(e, n) : cr(e, n)) && (b = qf(r, "onBeforeInput"), 0 < b.length && (v = new zn("onBeforeInput", "beforeinput", null, n, i), s.push({
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
			if (i = i.tag, i !== 5 && i !== 26 && i !== 27 || a === null || (i = X(e, n), i != null && r.unshift(Kf(e, i, a)), i = X(e, t), i != null && r.push(Kf(e, i, a))), e.tag === 3) return r;
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
			s !== 5 && s !== 26 && s !== 27 || l === null || (c = l, i ? (l = X(n, a), l != null && o.unshift(Kf(n, l, c))) : i || (l = X(n, a), l != null && o.push(Kf(n, l, c)))), n = n.return;
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
				if (typeof r == "string") t === "body" || t === "textarea" && r === "" || $t(e, r);
				else if (typeof r == "number" || typeof r == "bigint") t !== "body" && $t(e, "" + r);
				else return;
				break;
			case "className":
				Rt(e, "class", r);
				break;
			case "tabIndex":
				Rt(e, "tabindex", r);
				break;
			case "dir":
			case "role":
			case "viewBox":
			case "width":
			case "height":
				Rt(e, n, r);
				break;
			case "style":
				nn(e, r, o);
				return;
			case "data": if (t !== "object") {
				Rt(e, "data", r);
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
				r = sn(r), e.setAttribute(n, r);
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
				r = sn(r), e.setAttribute(n, r);
				break;
			case "onClick":
				r != null && (e.onclick = cn);
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
				n = sn(r), e.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", n);
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
				Bf("beforetoggle", e), Bf("toggle", e), Lt(e, "popover", r);
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
				Lt(e, "is", r);
				break;
			case "innerText":
			case "textContent": return;
			default: if (!(2 < n.length) || n[0] !== "o" && n[0] !== "O" || n[1] !== "n" && n[1] !== "N") n = an.get(n) || n, Lt(e, n, r);
			else return;
		}
		Ft = !0;
	}
	function tp(e, t, n, r, a, o) {
		switch (n) {
			case "style":
				nn(e, r, o);
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
				if (typeof r == "string") $t(e, r);
				else if (typeof r == "number" || typeof r == "bigint") $t(e, "" + r);
				else return;
				break;
			case "onScroll":
				r != null && Bf("scroll", e);
				return;
			case "onScrollEnd":
				r != null && Bf("scrollend", e);
				return;
			case "onClick":
				r != null && (e.onclick = cn);
				return;
			case "suppressContentEditableWarning":
			case "suppressHydrationWarning":
			case "innerHTML":
			case "ref": return;
			case "innerText":
			case "textContent": return;
			default:
				if (!At.hasOwnProperty(n)) a: {
					if (n[0] === "o" && n[1] === "n" && (a = n.endsWith("Capture"), o = n.slice(2, a ? n.length - 7 : void 0), t = e[mt] || null, t = t == null ? null : t[n], typeof t == "function" && e.removeEventListener(o, t, a), typeof r == "function")) {
						typeof t != "function" && t !== null && (n in e ? e[n] = null : e.hasAttribute(n) && e.removeAttribute(n)), e.addEventListener(o, r, a);
						break a;
					}
					Ft = !0, n in e ? e[n] = r : !0 === r ? e.setAttribute(n, "") : Lt(e, n, r);
				}
				return;
		}
		Ft = !0;
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
				Jt(e, o, c, l, u, s, a, !1);
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
				t = o, n = s, e.multiple = !!r, t == null ? n != null && Xt(e, !!r, n, !0) : Xt(e, !!r, t, !1);
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
				Qt(e, r, a, o);
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
			default: if (rn(t)) {
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
							m !== f && (Ft = !0), o = m;
							break;
						case "name":
							m !== f && (Ft = !0), a = m;
							break;
						case "checked":
							m !== f && (Ft = !0), u = m;
							break;
						case "defaultChecked":
							m !== f && (Ft = !0), d = m;
							break;
						case "value":
							m !== f && (Ft = !0), s = m;
							break;
						case "defaultValue":
							m !== f && (Ft = !0), c = m;
							break;
						case "children":
						case "dangerouslySetInnerHTML":
							if (m != null) throw Error(i(137, t));
							break;
						default: m !== f && ep(e, t, p, m, r, f);
					}
				}
				qt(e, s, c, l, u, d, o, a);
				return;
			case "select":
				for (o in m = s = c = p = null, n) if (l = n[o], n.hasOwnProperty(o) && l != null) switch (o) {
					case "value": break;
					case "multiple": m = l;
					default: r.hasOwnProperty(o) || ep(e, t, o, null, r, l);
				}
				for (a in r) if (o = r[a], l = n[a], r.hasOwnProperty(a) && (o != null || l != null)) switch (a) {
					case "value":
						o !== l && (Ft = !0), p = o;
						break;
					case "defaultValue":
						o !== l && (Ft = !0), c = o;
						break;
					case "multiple": o !== l && (Ft = !0), s = o;
					default: o !== l && ep(e, t, a, o, r, l);
				}
				t = c, n = s, r = m, p == null ? !!r != !!n && (t == null ? Xt(e, !!n, n ? [] : "", !1) : Xt(e, !!n, t, !0)) : Xt(e, !!n, p, !1);
				return;
			case "textarea":
				for (c in m = p = null, n) if (a = n[c], n.hasOwnProperty(c) && a != null && !r.hasOwnProperty(c)) switch (c) {
					case "value": break;
					case "children": break;
					default: ep(e, t, c, null, r, a);
				}
				for (s in r) if (a = r[s], o = n[s], r.hasOwnProperty(s) && (a != null || o != null)) switch (s) {
					case "value":
						a !== o && (Ft = !0), p = a;
						break;
					case "defaultValue":
						a !== o && (Ft = !0), m = a;
						break;
					case "children": break;
					case "dangerouslySetInnerHTML":
						if (a != null) throw Error(i(91));
						break;
					default: a !== o && ep(e, t, s, a, r, o);
				}
				Zt(e, p, m);
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
						p !== m && (Ft = !0), e.selected = p && typeof p != "function" && typeof p != "symbol";
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
			default: if (rn(t)) {
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
		return n = lp(n).createElement(e), n[pt] = r, n[mt] = t, np(n, e, t), Dt(n), n;
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
		var a = Ct(i);
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
					nm(n), St(n);
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
		n.dangerouslySetInnerHTML != null && (e.textContent = ""), e.onclick === cn && (e.onclick = null), St(e);
	}
	function _m(e) {
		for (var t = e.attributes; t.length;) e.removeAttributeNode(t[0]);
		St(e);
	}
	var vm = /* @__PURE__ */ new Map(), ym = /* @__PURE__ */ new Set();
	function bm(e) {
		if (typeof e.getRootNode == "function") {
			var t = e.getRootNode();
			if (t.nodeType === 9 || t.nodeType === 11) return t;
		}
		return e.nodeType === 9 ? e : e.ownerDocument;
	}
	var xm = ae.d;
	ae.d = {
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
		var t = wt(e);
		t !== null && t.tag === 5 && t.type === "form" ? Ks(t) : xm.r(e);
	}
	var wm = typeof document > "u" ? null : document;
	function Tm(e, t, n) {
		var r = wm;
		if (r && typeof t == "string" && t) {
			var i = Kt(t);
			i = "link[rel=\"" + e + "\"][href=\"" + i + "\"]", typeof n == "string" && (i += "[crossorigin=\"" + n + "\"]"), ym.has(i) || (ym.add(i), e = {
				rel: e,
				crossOrigin: n,
				href: t
			}, r.querySelector(i) === null && (t = r.createElement("link"), np(t, "link", e), Dt(t), r.head.appendChild(t)));
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
			var i = "link[rel=\"preload\"][as=\"" + Kt(t) + "\"]";
			t === "image" && n && n.imageSrcSet ? (i += "[imagesrcset=\"" + Kt(n.imageSrcSet) + "\"]", typeof n.imageSizes == "string" && (i += "[imagesizes=\"" + Kt(n.imageSizes) + "\"]")) : i += "[href=\"" + Kt(e) + "\"]";
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
				np(o, "link", e), t === "style" && (o[xt] = !0, o.onload = o.onerror = function() {
					Ot(o);
				}), Dt(o), r.head.appendChild(o);
			}
		}
	}
	function km(e, t) {
		xm.m(e, t);
		var n = wm;
		if (n && e) {
			var r = t && typeof t.as == "string" ? t.as : "script", i = "link[rel=\"modulepreload\"][as=\"" + Kt(r) + "\"][href=\"" + Kt(e) + "\"]", a = i;
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
				r = n.createElement("link"), np(r, "link", e), Dt(r), n.head.appendChild(r);
			}
		}
	}
	function Am(e, t, n) {
		xm.S(e, t, n);
		var r = wm;
		if (r && e) {
			var i = Et(r).hoistableStyles, a = Pm(e);
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
					Dt(c), np(c, "link", e), c._p = new Promise(function(e, t) {
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
			var r = Et(n).hoistableScripts, i = Rm(e), a = r.get(i);
			a || (a = n.querySelector(zm(i)), a || (e = D({
				src: e,
				async: !0
			}, t), (t = vm.get(i)) && Um(e, t), a = n.createElement("script"), Dt(a), np(a, "link", e), n.head.appendChild(a)), a = {
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
			var r = Et(n).hoistableScripts, i = Rm(e), a = r.get(i);
			a || (a = n.querySelector(zm(i)), a || (e = D({
				src: e,
				async: !0,
				type: "module"
			}, t), (t = vm.get(i)) && Um(e, t), a = n.createElement("script"), Dt(a), np(a, "link", e), n.head.appendChild(a)), a = {
				type: "script",
				instance: a,
				count: 1,
				state: null
			}, r.set(i, a));
		}
	}
	function Nm(e, t, n, r) {
		var a = (a = pe.current) ? bm(a) : null;
		if (!a) throw Error(i(446));
		switch (e) {
			case "meta":
			case "title": return null;
			case "style": return typeof n.precedence == "string" && typeof n.href == "string" ? (n = Pm(n.href), t = Et(a).hoistableStyles, r = t.get(n), r || (r = {
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
					var o = Et(a).hoistableStyles, s = o.get(e);
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
			case "script": return t = n.async, n = n.src, typeof n == "string" && t && typeof t != "function" && typeof t != "symbol" ? (n = Rm(n), t = Et(a).hoistableScripts, r = t.get(n), r || (r = {
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
		return "href=\"" + Kt(e) + "\"";
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
			if (!0 !== t[xt]) {
				r.loading = 1;
				return;
			}
		} else t = e.createElement("link"), t[xt] = !0, t.onload = t.onerror = Ot.bind(null, t), np(t, "link", n), Dt(t), e.head.appendChild(t);
		r.preload = t, t.addEventListener("load", function() {
			return r.loading |= 1;
		}), t.addEventListener("error", function() {
			return r.loading |= 2;
		});
	}
	function Rm(e) {
		return "[src=\"" + Kt(e) + "\"]";
	}
	function zm(e) {
		return "script[async]" + e;
	}
	function Bm(e, t, n) {
		if (t.count++, t.instance === null) switch (t.type) {
			case "style":
				var r = e.querySelector("style[data-href~=\"" + Kt(n.href) + "\"]");
				if (r) return t.instance = r, Dt(r), r;
				var a = D({}, n, {
					"data-href": n.href,
					"data-precedence": n.precedence,
					href: null,
					precedence: null
				});
				return r = (e.ownerDocument || e).createElement("style"), Dt(r), np(r, "style", a), Vm(r, n.precedence, e), t.instance = r;
			case "stylesheet":
				a = Pm(n.href);
				var o = e.querySelector(Fm(a));
				if (o) return t.state.loading |= 4, t.instance = o, Dt(o), o;
				r = Im(n), (a = vm.get(a)) && Hm(r, a), o = (e.ownerDocument || e).createElement("link"), Dt(o);
				var s = o;
				return s._p = new Promise(function(e, t) {
					s.onload = e, s.onerror = t;
				}), np(o, "link", r), t.state.loading |= 4, Vm(o, n.precedence, e), t.instance = o;
			case "script": return o = Rm(n.src), (a = e.querySelector(zm(o))) ? (t.instance = a, Dt(a), a) : (r = n, (a = vm.get(o)) && (r = D({}, n), Um(r, a)), e = e.ownerDocument || e, a = e.createElement("script"), Dt(a), np(a, "link", r), e.head.appendChild(a), t.instance = a);
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
					t = a._p, typeof t == "object" && t && typeof t.then == "function" && (e.count++, e = nh.bind(e), t.then(e, e)), n.state.loading |= 4, n.instance = a, Dt(a);
					return;
				}
				a = t.ownerDocument || t, r = Im(r), (i = vm.get(i)) && Hm(r, i), a = a.createElement("link"), Dt(a);
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
		$$typeof: F,
		Provider: null,
		Consumer: null,
		_currentValue: oe,
		_currentValue2: oe,
		_threadCount: 0
	};
	function ch(e, t, n, r, i, a, o, s, c) {
		this.tag = 1, this.containerInfo = e, this.pingCache = this.current = this.pendingChildren = null, this.timeoutHandle = -1, this.callbackNode = this.next = this.pendingContext = this.context = this.cancelPendingCommit = null, this.callbackPriority = 0, this.expirationTimes = nt(-1), this.entangledLanes = this.shellSuspendCounter = this.errorRecoveryDisabledLanes = this.expiredLanes = this.warmLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0, this.entanglements = nt(0), this.hiddenUpdates = nt(null), this.identifierPrefix = r, this.onUncaughtError = i, this.onCaughtError = a, this.onRecoverableError = o, this.pooledCache = null, this.pooledCacheLanes = 0, this.formState = c, this.transitionTypes = null, this.incompleteTransitions = /* @__PURE__ */ new Map();
	}
	function lh(e, t, n, r, i, a, o, s, c, l, u, d) {
		return e = new ch(e, t, n, o, c, l, u, d, s), t = 1, !0 === a && (t |= 24), a = yi(3, null, null, t), e.current = a, a.stateNode = e, t = ba(), t.refCount++, e.pooledCache = t, t.refCount++, a.memoizedState = {
			element: r,
			isDehydrated: n,
			cache: t
		}, no(a), e;
	}
	function uh(e) {
		return e ? (e = _i, e) : _i;
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
			var t = mi(e, 67108864);
			t !== null && jd(t, e, 67108864), ph(e, 67108864);
		}
	}
	function hh(e) {
		if (e.tag === 13 || e.tag === 31) {
			var t = Od();
			t = ct(t);
			var n = mi(e, t);
			n !== null && jd(n, e, t), ph(e, t);
		}
	}
	var gh = !0;
	function _h(e, t, n, r) {
		var i = K.T;
		K.T = null;
		var a = ae.p;
		try {
			ae.p = 2, yh(e, t, n, r);
		} finally {
			ae.p = a, K.T = i;
		}
	}
	function vh(e, t, n, r) {
		var i = K.T;
		K.T = null;
		var a = ae.p;
		try {
			ae.p = 8, yh(e, t, n, r);
		} finally {
			ae.p = a, K.T = i;
		}
	}
	function yh(e, t, n, r) {
		if (gh) {
			var i = bh(r);
			if (i === null) Gf(e, t, r, xh, n), Mh(e, r);
			else if (Ph(i, e, t, n, r)) r.stopPropagation();
			else if (Mh(e, r), t & 4 && -1 < jh.indexOf(e)) {
				for (; i !== null;) {
					var a = wt(i);
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
									wf(a), !(Ku & 6) && (pd = je() + 500, Tf(0, !1));
								}
							}
							break;
						case 31:
						case 13: s = mi(a, 2), s !== null && jd(s, a, 2), Id(), ph(a, 2);
					}
					if (a = bh(r), a === null && Gf(e, t, r, xh, n), a === i) break;
					i = a;
				}
				i !== null && r.stopPropagation();
			} else Gf(e, t, r, null, n);
		}
	}
	function bh(e) {
		return e = un(e), Sh(e);
	}
	var xh = null;
	function Sh(e) {
		if (xh = null, e = Ct(e), e !== null) {
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
			case "message": switch (Me()) {
				case Ne: return 2;
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
		}, t !== null && (t = wt(t), t !== null && mh(t)), e) : (e.eventSystemFlags |= r, t = e.targetContainers, i !== null && t.indexOf(i) === -1 && t.push(i), e);
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
		var t = Ct(e.target);
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
				ln = r, n.target.dispatchEvent(r), ln = null;
			} else return t = wt(n), t !== null && mh(t), e.blockedOn = n, !1;
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
				var a = wt(n);
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
	ae.findDOMNode = function(e) {
		var t = e._reactInternals;
		if (t === void 0) throw typeof e.render == "function" ? Error(i(188)) : (e = Object.keys(e).join(","), Error(i(268, e)));
		return e = d(t), e = e === null ? null : p(e), e = e === null ? null : e.stateNode, e;
	};
	var qh = {
		bundleType: 0,
		version: "19.3.0",
		rendererPackageName: "react-dom",
		currentDispatcherRef: K,
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
}));
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.5.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/formatErrorMessage.mjs
function _(e, t) {
	return function(n, ...r) {
		let i = new URL(e);
		return i.searchParams.set("code", n.toString()), r.forEach((e) => i.searchParams.append("args[]", e)), `${t} error #${n}; visit ${i} for the full message.`;
	};
}
var v = _("https://base-ui.com/production-error", "Base UI"), y = /* @__PURE__ */ c(u(), 1), b = /*#__PURE__*/ y.createContext(void 0);
function x(e) {
	let t = y.useContext(b);
	if (t === void 0 && !e) throw Error(v(33));
	return t;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/menu/root/MenuRootContext.mjs
var S = /*#__PURE__*/ y.createContext(void 0);
function C(e) {
	let t = y.useContext(S);
	if (t === void 0 && !e) throw Error(v(36));
	return t;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.5.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/useRefWithInit.mjs
var w = {};
function T(e, t) {
	let n = y.useRef(w);
	return n.current === w && (n.current = e(t)), n;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.5.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/useMergedRefs.mjs
function E(e, t, n, r) {
	let i = T(O).current;
	return k(i, e, t, n, r) && j(i, [
		e,
		t,
		n,
		r
	]), i.callback;
}
function D(e) {
	let t = T(O).current;
	return A(t, e) && j(t, e), t.callback;
}
function O() {
	return {
		callback: null,
		cleanup: null,
		refs: []
	};
}
function k(e, t, n, r, i) {
	return e.refs[0] !== t || e.refs[1] !== n || e.refs[2] !== r || e.refs[3] !== i;
}
function A(e, t) {
	return e.refs.length !== t.length || e.refs.some((e, n) => e !== t[n]);
}
function j(e, t) {
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
//#region node_modules/.pnpm/@base-ui+utils@0.5.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/reactVersion.mjs
var M = 19;
function N(e) {
	return M >= e;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.5.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/getReactElementRef.mjs
function P(e) {
	if (!/*#__PURE__*/ y.isValidElement(e)) return null;
	let t = e, n = t.props;
	return (N(19) ? n?.ref : t.ref) ?? null;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.5.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/mergeObjects.mjs
function F(e, t) {
	if (e && !t) return e;
	if (!e && t) return t;
	if (e || t) return {
		...e,
		...t
	};
}
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.5.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/empty.mjs
function I() {}
var L = Object.freeze([]), R = Object.freeze({});
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/getStateAttributesProps.mjs
function z(e, t) {
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
function B(e, t) {
	return typeof e == "function" ? e(t) : e;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/utils/resolveStyle.mjs
function ee(e, t) {
	return typeof e == "function" ? e(t) : e;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/merge-props/mergeProps.mjs
var V = {};
function H(e, t, n, r, i) {
	if (!n && !r && !i && !e) return W(t);
	let a = W(e);
	return t && (a = te(a, t)), n && (a = te(a, n)), r && (a = te(a, r)), i && (a = te(a, i)), a;
}
function U(e) {
	if (e.length === 0) return V;
	if (e.length === 1) return W(e[0]);
	let t = W(e[0]);
	for (let n = 1; n < e.length; n += 1) t = te(t, e[n]);
	return t;
}
function W(e) {
	return ie(e) ? { ...e(V) } : G(e);
}
function te(e, t) {
	return ie(t) ? t(e) : ne(e, t);
}
function G(e) {
	let t = { ...e };
	for (let e in t) {
		let n = t[e];
		re(e, n) && (t[e] = ae(n));
	}
	return t;
}
function ne(e, t) {
	if (!t) return e;
	for (let n in t) {
		let r = t[n];
		switch (n) {
			case "style":
				e[n] = F(e.style, r);
				break;
			case "className":
				e[n] = se(e.className, r);
				break;
			default: e[n] = re(n, r) ? K(e[n], r) : r;
		}
	}
	return e;
}
function re(e, t) {
	let n = e.charCodeAt(0), r = e.charCodeAt(1), i = e.charCodeAt(2);
	return n === 111 && r === 110 && i >= 65 && i <= 90 && (typeof t == "function" || t === void 0);
}
function ie(e) {
	return typeof e == "function";
}
function K(e, t) {
	return t ? e ? (...n) => {
		let r = n[0];
		if (ce(r)) {
			let i = r;
			oe(i);
			let a = t(...n);
			return i.baseUIHandlerPrevented || e?.(...n), a;
		}
		let i = t(...n);
		return e?.(...n), i;
	} : ae(t) : e;
}
function ae(e) {
	return e && ((...t) => {
		let n = t[0];
		return ce(n) && oe(n), e(...t);
	});
}
function oe(e) {
	return e.preventBaseUIHandler = () => {
		e.baseUIHandlerPrevented = !0;
	}, e;
}
function se(e, t) {
	return t ? e ? t + " " + e : t : e;
}
function ce(e) {
	return typeof e == "object" && !!e && "nativeEvent" in e;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/useRenderElement.mjs
function q(e, t, n = {}) {
	let r = t.render;
	n.enabled !== !1 && (r = fe(r));
	let i = le(t, n, r);
	if (n.enabled === !1) return null;
	let a = n.state ?? R;
	return pe(e, r, i, a);
}
function le(e, t, n) {
	let { className: r, style: i } = e, { state: a = R, ref: o, props: s, stateAttributesMapping: c, enabled: l = !0 } = t, u = l ? B(r, a) : void 0, d = l ? ee(i, a) : void 0, f = l ? z(a, c) : R, p = l && s ? ue(s) : void 0, m = l ? F(f, p) ?? {} : R;
	return typeof document < "u" && (l ? m.ref = Array.isArray(o) ? D([
		m.ref,
		P(n),
		...o
	]) : E(m.ref, P(n), o) : E(null, null)), l ? (u !== void 0 && (m.className = se(m.className, u)), d !== void 0 && (m.style = F(m.style, d)), m) : R;
}
function ue(e) {
	return Array.isArray(e) ? U(e) : H(void 0, e);
}
var de = Symbol.for("react.lazy");
function fe(e) {
	if (e?.$$typeof !== de) return e;
	let t = y.Children.toArray(e)[0];
	return /*#__PURE__*/ y.isValidElement(t) ? t : e;
}
function pe(e, t, n, r) {
	if (t) {
		if (typeof t == "function") return t(n, r);
		let e = H(n, t.props);
		return e.ref = n.ref, /*#__PURE__*/ y.cloneElement(t, e);
	}
	return me(e, n);
}
function me(e, t) {
	return e === "button" ? /*#__PURE__*/ (0, y.createElement)("button", {
		type: "button",
		...t,
		key: t.key
	}) : e === "img" ? /*#__PURE__*/ (0, y.createElement)("img", {
		alt: "",
		...t,
		key: t.key
	}) : /*#__PURE__*/ y.createElement(e, t);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/TransitionStatusDataAttributes.mjs
var he = "data-starting-style", ge = "data-ending-style", _e = { [he]: "" }, ve = { [ge]: "" }, ye = { transitionStatus(e) {
	return e === "starting" ? _e : e === "ending" ? ve : null;
} }, be = "data-open", xe = "data-closed", Se = "data-anchor-hidden", Ce = "data-popup-open", we = "data-pressed", Te = { [Ce]: "" }, Ee = {
	[Ce]: "",
	[we]: ""
}, De = { [be]: "" }, Oe = { [xe]: "" }, ke = { [Se]: "" }, Ae = { open(e) {
	return e ? Te : null;
} }, je = { open(e) {
	return e ? Ee : null;
} }, Me = {
	open(e) {
		return e ? De : Oe;
	},
	anchorHidden(e) {
		return e ? ke : null;
	}
}, Ne = {
	...Me,
	...ye
}, Pe = /*#__PURE__*/ y.createContext(void 0);
function Fe(e = !0) {
	let t = y.useContext(Pe);
	if (t === void 0 && !e) throw Error(v(25));
	return t;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/reason-parts.mjs
var Ie = "none", Le = "trigger-press", Re = "trigger-hover", ze = "trigger-focus", Be = "outside-press", Ve = "item-press", He = "close-press", Ue = "focus-out", We = "escape-key", Ge = "list-navigation", Ke = "keyboard", qe = "pointer", Je = "cancel-open", Ye = "sibling-open", Xe = "imperative-action", Ze = "window-resize";
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.5.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/useControlled.mjs
function Qe({ controlled: e, default: t, name: n, state: r = "value" }) {
	let { current: i } = y.useRef(e !== void 0), [a, o] = y.useState(() => t);
	return [i && e !== void 0 ? e : a, y.useCallback((e) => {
		i || o(e);
	}, [])];
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/menu/filter-root/MenuFilterContext.mjs
var $e = /*#__PURE__*/ y.createContext(null);
function et(e = "root") {
	let t = y.useContext($e), n = y.useContext(S);
	return t === null || n === void 0 ? null : (e === "submenu-trigger" ? n.virtualFocus || n.parentVirtualFocus : n.virtualFocus) ? t : null;
}
var tt = {
	visible: !0,
	ref: null
};
function nt() {
	return tt;
}
function rt(e, t, n = "root") {
	let r = et(n), i = ((n === "submenu-trigger" ? r?.useSubmenuTrigger : r?.useItem) ?? nt)({
		label: e.label,
		children: e.children,
		render: e.render
	}), a = E(t, i.ref);
	return {
		visible: i.visible,
		ref: a,
		props: i.props
	};
}
//#endregion
//#region node_modules/.pnpm/@floating-ui+utils@0.2.12/node_modules/@floating-ui/utils/dist/floating-ui.utils.dom.mjs
function it() {
	return typeof window < "u";
}
function at(e) {
	return ct(e) ? (e.nodeName || "").toLowerCase() : "#document";
}
function ot(e) {
	var t;
	return (e == null || (t = e.ownerDocument) == null ? void 0 : t.defaultView) || window;
}
function st(e) {
	return ((ct(e) ? e.ownerDocument : e.document) || window.document)?.documentElement;
}
function ct(e) {
	return it() ? e instanceof Node || e instanceof ot(e).Node : !1;
}
function lt(e) {
	return it() ? e instanceof Element || e instanceof ot(e).Element : !1;
}
function ut(e) {
	return it() ? e instanceof HTMLElement || e instanceof ot(e).HTMLElement : !1;
}
function dt(e) {
	return !it() || typeof ShadowRoot > "u" ? !1 : e instanceof ShadowRoot || e instanceof ot(e).ShadowRoot;
}
function ft(e) {
	let { overflow: t, overflowX: n, overflowY: r, display: i } = Ct(e);
	return /auto|scroll|overlay|hidden|clip/.test(t + r + n) && i !== "inline" && i !== "contents";
}
function pt(e) {
	return /^(table|td|th)$/.test(at(e));
}
function mt(e) {
	try {
		if (e.matches(":popover-open")) return !0;
	} catch {}
	try {
		return e.matches(":modal");
	} catch {
		return !1;
	}
}
var ht = /transform|translate|scale|rotate|perspective|filter/, gt = /paint|layout|strict|content/, _t = (e) => !!e && e !== "none", vt;
function yt(e) {
	let t = lt(e) ? Ct(e) : e;
	return _t(t.transform) || _t(t.translate) || _t(t.scale) || _t(t.rotate) || _t(t.perspective) || !xt() && (_t(t.backdropFilter) || _t(t.filter)) || ht.test(t.willChange || "") || gt.test(t.contain || "");
}
function bt(e) {
	let t = Tt(e);
	for (; ut(t) && !St(t);) {
		if (yt(t)) return t;
		if (mt(t)) return null;
		t = Tt(t);
	}
	return null;
}
function xt() {
	return vt ??= typeof CSS < "u" && CSS.supports && CSS.supports("-webkit-backdrop-filter", "none"), vt;
}
function St(e) {
	return /^(html|body|#document)$/.test(at(e));
}
function Ct(e) {
	return ot(e).getComputedStyle(e);
}
function wt(e) {
	return lt(e) ? {
		scrollLeft: e.scrollLeft,
		scrollTop: e.scrollTop
	} : {
		scrollLeft: e.scrollX,
		scrollTop: e.scrollY
	};
}
function Tt(e) {
	if (at(e) === "html") return e;
	let t = e.assignedSlot || e.parentNode || dt(e) && e.host || st(e);
	return dt(t) ? t.host : t;
}
function Et(e) {
	let t = Tt(e);
	return St(t) ? (e.ownerDocument || e).body : ut(t) && ft(t) ? t : Et(t);
}
function Dt(e, t, n) {
	t === void 0 && (t = []), n === void 0 && (n = !0);
	let r = Et(e), i = r === e.ownerDocument?.body, a = ot(r);
	if (i) {
		let e = Ot(a);
		return t.concat(a, a.visualViewport || [], ft(r) ? r : [], e && n ? Dt(e) : []);
	}
	return t.concat(r, Dt(r, [], n));
}
function Ot(e) {
	return e.parent && Object.getPrototypeOf(e.parent) ? e.frameElement : null;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.5.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/safeReact.mjs
var kt = { ...y }, At = kt.useInsertionEffect, jt = At && At !== kt.useLayoutEffect ? At : (e) => e();
function J(e) {
	let t = T(Mt).current;
	return t.next = e, jt(t.effect), t.trampoline;
}
function Mt() {
	let e = {
		next: void 0,
		callback: Nt,
		trampoline: (...t) => e.callback?.(...t),
		effect: () => {
			e.callback = e.next;
		}
	};
	return e;
}
function Nt() {}
var Y = typeof document < "u" ? y.useLayoutEffect : () => {}, Pt = /*#__PURE__*/ y.createContext(void 0);
function Ft(e = !1) {
	let t = y.useContext(Pt);
	if (t === void 0 && !e) throw Error(v(16));
	return t;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/utils/useFocusableWhenDisabled.mjs
function It(e) {
	let { focusableWhenDisabled: t, disabled: n, composite: r = !1, tabIndex: i = 0, isNativeButton: a } = e, o = r && t !== !1, s = r && t === !1;
	return { props: y.useMemo(() => {
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
//#region node_modules/.pnpm/@base-ui+utils@0.5.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/owner.mjs
function Lt(e) {
	return e?.ownerDocument || document;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/utils/dispatchClickWithModifiers.mjs
function Rt(e, t, { detail: n = 0, pointerType: r = "" } = {}) {
	e.dispatchEvent(new (ot(e)).PointerEvent("click", {
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
function zt(e = {}) {
	let { disabled: t = !1, focusableWhenDisabled: n, tabIndex: r = 0, native: i = !0, composite: a } = e, o = y.useRef(null), s = Ft(!0), c = a ?? s !== void 0, { props: l } = It({
		focusableWhenDisabled: n,
		disabled: t,
		composite: c,
		tabIndex: r,
		isNativeButton: i
	}), u = y.useCallback(() => {
		let e = o.current;
		Bt(e) && c && t && l.disabled === void 0 && e.disabled && (e.disabled = !1);
	}, [
		t,
		l.disabled,
		c
	]);
	return Y(u, [u]), {
		getButtonProps: y.useCallback((e = {}) => {
			let { onClick: n, onMouseDown: r, onKeyUp: a, onKeyDown: o, onPointerDown: s, ...u } = e;
			return H({
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
					if (t || (oe(e), o?.(e), e.baseUIHandlerPrevented)) return;
					let n = e.target === e.currentTarget, r = e.currentTarget, a = Bt(r), s = !i && Vt(r), l = n && (i ? a : !s), u = e.key === "Enter", d = e.key === " ", f = r.getAttribute("role"), p = f?.startsWith("menuitem") || f === "option" || f === "gridcell";
					if (n && c && d) {
						if (e.defaultPrevented && p) return;
						e.preventDefault(), (!i || a) && (e.preventBaseUIHandler(), Rt(r, e));
						return;
					}
					if (!l || i || !d && !u) {
						n && s && d && e.preventDefault();
						return;
					}
					e.defaultPrevented || (e.preventDefault(), u && (e.preventBaseUIHandler(), Rt(r, e)));
				},
				onKeyUp(e) {
					if (!t) {
						if (oe(e), a?.(e), e.target === e.currentTarget && i && c && Bt(e.currentTarget) && e.key === " ") {
							e.preventDefault();
							return;
						}
						e.baseUIHandlerPrevented || e.target === e.currentTarget && !i && !c && !e.defaultPrevented && e.key === " " && (e.preventBaseUIHandler(), Rt(e.currentTarget, e));
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
		buttonRef: J((e) => {
			o.current = e, u();
		})
	};
}
function Bt(e) {
	return ut(e) && e.tagName === "BUTTON";
}
function Vt(e) {
	return ut(e) && e.tagName === "A" && !!e.href;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.5.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/platform/shared.mjs
function Ht() {
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
var { userAgent: Ut, platform: Wt, maxTouchPoints: Gt } = Ht(), Kt = Ut.toLowerCase(), qt = Wt.toLowerCase(), Jt = /^i(os$|p)/.test(qt) || qt === "macintel" && Gt > 1, Yt = "android", Xt = qt === Yt || Kt.includes(Yt), Zt = !Jt && qt.startsWith("mac");
qt.startsWith("win"), !Xt && /^(linux|chrome os)/.test(qt);
var Qt = Zt || Jt, $t = typeof CSS < "u" && !!CSS.supports?.("-webkit-backdrop-filter:none");
!$t && Kt.includes("firefox"), !$t && Kt.includes("chrom");
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.5.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/platform/screen-reader.mjs
var en = Qt, tn = /jsdom|happydom/.test(Kt);
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/menu/item/useMenuItemCommonProps.mjs
function nn(e) {
	e.preventDefault();
}
function rn(e) {
	let { closeOnClick: t, highlighted: n, id: r, nodeId: i, store: a, typingRef: o, itemRef: s, itemMetadata: c } = e, l = C(), u = Fe(!0), d = c.type === "submenu-trigger", f = d ? l.parentVirtualFocus : l.virtualFocus, p = (d && l.parent.type === "menu" ? l.parent.store : l.store).useState("webkitAriaSelected", n), { events: m } = a.useState("floatingTreeRoot"), h = a.useState("open"), g = u !== void 0, _ = !f && h && n ? 0 : -1;
	return y.useMemo(() => ({
		id: r,
		role: "menuitem",
		tabIndex: _,
		"aria-selected": p,
		onMouseDown: f ? nn : void 0,
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
				reason: Ve
			});
		},
		onMouseUp(e) {
			if (u) {
				let t = u.initialCursorPointRef.current;
				if (u.initialCursorPointRef.current = null, g && t && Math.abs(e.clientX - t.x) <= 1 && Math.abs(e.clientY - t.y) <= 1 || g && !Zt && e.button === 2) return;
			}
			s.current && a.context.allowMouseUpTriggerRef.current && (!g || e.button === 2) && c.type === "regular-item" && Rt(s.current, e, {
				detail: 1,
				pointerType: "mouse"
			});
		}
	}), [
		t,
		_,
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
var an = { type: "regular-item" };
function on(e) {
	let { closeOnClick: t, disabled: n, highlighted: r, id: i, store: a, typingRef: o = a.context.typingRef, nativeButton: s, itemMetadata: c, nodeId: l } = e, u = y.useRef(null), { getButtonProps: d, buttonRef: f } = zt({
		disabled: n,
		focusableWhenDisabled: !0,
		native: s,
		composite: !0
	}), p = rn({
		closeOnClick: t,
		highlighted: r,
		id: i,
		nodeId: l,
		store: a,
		typingRef: o,
		itemRef: u,
		itemMetadata: c
	}), m = y.useCallback((e) => H(p, { onMouseEnter(e) {
		c.type === "submenu-trigger" && c.setActive(e.nativeEvent);
	} }, e, d), [
		p,
		d,
		c
	]), h = E(u, f);
	return y.useMemo(() => ({
		getItemProps: m,
		itemRef: h
	}), [m, h]);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/composite/list/CompositeListContext.mjs
var sn = /*#__PURE__*/ y.createContext({
	register: () => {},
	unregister: () => {},
	subscribeMapChange: () => () => {},
	nextIndexRef: { current: 0 }
});
function cn() {
	return y.useContext(sn);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/composite/list/useCompositeListItem.mjs
function ln(e = {}) {
	let { guess: t, label: n, metadata: r, textRef: i, index: a } = e, { register: o, unregister: s, subscribeMapChange: c, nextIndexRef: l } = cn(), u = y.useRef(-1), [d, f] = y.useState(a == null && t ? () => {
		if (u.current === -1) {
			let e = l.current;
			l.current += 1, u.current = e;
		}
		return u.current;
	} : -1), p = a ?? d, m = y.useRef(null), h = y.useCallback((e) => {
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
	return Y(() => {
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
//#region node_modules/.pnpm/@base-ui+utils@0.5.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/useForcedRerendering.mjs
function un() {
	let [, e] = y.useState({});
	return y.useCallback(() => {
		e({});
	}, []);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.5.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/useId.mjs
var dn = 0;
function fn(e, t = "mui") {
	let n = y.useRef(void 0), r = un(), i = e ?? n.current;
	return y.useEffect(() => {
		n.current ?? (dn += 1, n.current = `${t}-${dn}`, e ?? r());
	}, [
		e,
		t,
		r
	]), i;
}
var pn = kt.useId;
function mn(e, t) {
	if (pn !== void 0) {
		let n = pn();
		return e ?? (t ? `${t}-${n}` : n);
	}
	return fn(e, t);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/useBaseUiId.mjs
function hn(e) {
	return mn(e, "base-ui");
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/createBaseUIEventDetails.mjs
function X(e, t, n, r) {
	let i = !1, a = !1, o = r ?? R;
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
function gn(e, t, n) {
	let r = n ?? R;
	return {
		reason: e,
		event: t ?? new Event("base-ui"),
		...r
	};
}
//#endregion
//#region node_modules/.pnpm/react@19.3.0/node_modules/react/cjs/react-jsx-runtime.production.js
var _n = /* @__PURE__ */ o(((e) => {
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
})), vn = /* @__PURE__ */ o(((e, t) => {
	t.exports = _n();
}));
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.5.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/useOnMount.mjs
function yn(e) {
	y.useEffect(e, L);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.5.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/useAnimationFrame.mjs
var bn = null;
globalThis.requestAnimationFrame;
var xn = new class {
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
}(), Sn = class e {
	static create() {
		return new e();
	}
	static request(e) {
		return xn.request(e);
	}
	static cancel(e) {
		return xn.cancel(e);
	}
	currentId = bn;
	request(e) {
		this.cancel(), this.currentId = xn.request(() => {
			this.currentId = bn, e();
		});
	}
	cancel = () => {
		this.currentId !== bn && (xn.cancel(this.currentId), this.currentId = bn);
	};
	disposeEffect = () => this.cancel;
};
function Cn() {
	let e = T(Sn.create).current;
	return yn(e.disposeEffect), e;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/useTransitionStatus.mjs
function wn(e, t = !1, n = !1, r = !1) {
	let [i, a] = y.useState(e && t ? "idle" : void 0), [o, s] = y.useState(e && !r);
	return e && !o && (s(!0), a("starting")), !e && o && i !== "ending" && !n && a("ending"), !e && !o && i === "ending" && a(void 0), Y(() => {
		if (!e && o && i !== "ending" && n) {
			let e = Sn.request(() => {
				a("ending");
			});
			return () => {
				Sn.cancel(e);
			};
		}
	}, [
		e,
		o,
		i,
		n
	]), Y(() => {
		if (!e || t || i === void 0) return;
		let n = Sn.request(() => {
			a(void 0);
		});
		return () => {
			Sn.cancel(n);
		};
	}, [
		t,
		e,
		i
	]), Y(() => {
		if (!e || !t) return;
		e && o && i !== "idle" && a("starting");
		let n = Sn.request(() => {
			a("idle");
		});
		return () => {
			Sn.cancel(n);
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
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/utils/resolveRef.mjs
function Tn(e) {
	return e == null ? e : "current" in e ? e.current : e;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/utils/getFiniteAnimations.mjs
function En(e, t) {
	return e.getAnimations(t).filter((e) => {
		let t = e.effect?.getTiming();
		return t?.duration !== Infinity && t?.iterations !== Infinity;
	});
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/useAnimationsFinished.mjs
var Dn = /* @__PURE__ */ c(m(), 1), On = null;
function kn(e) {
	if (!On) {
		let e = [];
		On = e, queueMicrotask(() => {
			On = null, Dn.flushSync(() => {
				for (let t of e) t();
			});
		});
	}
	On.push(e);
}
function An(e, t = !1, n = !1) {
	let r = Cn();
	return J((i, a = null) => {
		r.cancel();
		let o = Tn(e);
		if (o == null) return;
		let s = o, c = () => {
			if (!n) {
				Dn.flushSync(i);
				return;
			}
			kn(() => {
				a?.aborted || i();
			});
		};
		if (typeof s.getAnimations != "function" || globalThis.BASE_UI_ANIMATIONS_DISABLED) {
			i();
			return;
		}
		function l() {
			Promise.all(En(s).map((e) => e.finished.then(I))).then(() => {
				a?.aborted || c();
			}, () => {
				if (!a?.aborted) {
					if (En(s).some((e) => e.pending || e.playState !== "finished")) {
						l();
						return;
					}
					c();
				}
			});
		}
		if (t) {
			let e = he;
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
function jn(e) {
	let { enabled: t = !0, open: n, ref: r, batch: i = !1, onComplete: a } = e, o = J(a), s = An(r, n, i);
	y.useEffect(() => {
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
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/menu/group/MenuGroupContext.mjs
var Mn = /*#__PURE__*/ y.createContext(void 0);
function Nn() {
	let e = y.useContext(Mn);
	if (e === void 0) throw Error(v(31));
	return e;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/menu/group/MenuGroup.mjs
var Z = vn(), Pn = /*#__PURE__*/ y.forwardRef(function(e, t) {
	let { render: n, className: r, style: i, ...a } = e, [o, s] = y.useState(void 0), c = q("div", e, {
		ref: t,
		props: {
			role: "group",
			"aria-labelledby": o,
			...a
		}
	});
	return /*#__PURE__*/ (0, Z.jsx)(Mn.Provider, {
		value: s,
		children: c
	});
}), Fn = /*#__PURE__*/ y.forwardRef(function(e, t) {
	let n = et()?.Group ?? Pn;
	return /*#__PURE__*/ (0, Z.jsx)(n, {
		...e,
		ref: t
	});
}), In = /*#__PURE__*/ y.forwardRef(function(e, t) {
	let { render: n, className: r, style: i, id: a, ...o } = e, s = hn(a), c = Nn();
	return Y(() => (c(s), () => {
		c((e) => e === s ? void 0 : e);
	}), [c, s]), q("div", e, {
		ref: t,
		props: {
			id: s,
			"aria-hidden": !0,
			...o
		}
	});
}), Ln = /*#__PURE__*/ y.forwardRef(function(e, t) {
	let { render: n, className: r, id: i, label: a, nativeButton: o = !1, disabled: s = !1, closeOnClick: c = !0, style: l, ...u } = e, { store: d } = C(), f = ln({
		guess: !0,
		label: a
	}), p = hn(i), m = d.useState("disabled"), h = d.useState("isActive", f.index), g = d.useState("floatingNodeId"), _ = d.useState("itemProps"), v = s || m, { getItemProps: y, itemRef: b } = on({
		closeOnClick: c,
		disabled: v,
		highlighted: h,
		id: p,
		store: d,
		nativeButton: o,
		nodeId: g,
		itemMetadata: an
	});
	return q("div", e, {
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
}), Rn = /*#__PURE__*/ y.forwardRef(function(e, t) {
	let n = rt(e, t);
	return n.visible ? /*#__PURE__*/ (0, Z.jsx)(Ln, {
		...e,
		ref: n.ref
	}) : null;
}), zn = 0, Bn = class e {
	static create() {
		return new e();
	}
	currentId = zn;
	start(e, t) {
		this.clear(), this.currentId = setTimeout(() => {
			this.currentId = zn, t();
		}, e);
	}
	isStarted() {
		return this.currentId !== zn;
	}
	clear = () => {
		this.currentId !== zn && (clearTimeout(this.currentId), this.currentId = zn);
	};
	disposeEffect = () => this.clear;
};
function Vn() {
	let e = T(Bn.create).current;
	return yn(e.disposeEffect), e;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/utils/event.mjs
function Hn(e) {
	e.preventDefault(), e.stopPropagation();
}
function Un(e) {
	return "nativeEvent" in e;
}
function Wn(e) {
	return e.pointerType === "" && e.isTrusted ? !0 : Xt && e.pointerType ? e.type === "click" && e.buttons === 1 : e.detail === 0 && !e.pointerType;
}
function Gn(e) {
	return tn ? !1 : !Xt && e.width === 0 && e.height === 0 || e.type === "pointerdown" && e.width === 1 && e.height === 1 && e.pressure === 0 && e.detail === 0 && e.pointerType === "mouse" && (Xt || e.buttons === 0) || e.width < 1 && e.height < 1 && e.pressure === 0 && e.detail === 0 && e.pointerType === "touch";
}
function Kn(e, t) {
	let n = ["mouse", "pen"];
	return t || n.push("", void 0), n.includes(e);
}
function qn(e) {
	let t = e.type;
	return t === "click" || t === "mousedown" || t === "keydown" || t === "keyup";
}
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.5.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/shadowDom.mjs
function Jn(e) {
	let t = e.activeElement;
	for (; t?.shadowRoot?.activeElement != null;) t = t.shadowRoot.activeElement;
	return t;
}
function Q(e, t) {
	if (!e || !t) return !1;
	let n = t.getRootNode?.();
	if (e.contains(t)) return !0;
	if (n && dt(n)) {
		let n = t;
		for (; n;) {
			if (e === n) return !0;
			n = n.parentNode || n.host;
		}
	}
	return !1;
}
function Yn(e, t) {
	let n = e;
	for (; n;) {
		if (lt(n) && n.matches(t)) return n;
		n = n.assignedSlot ?? n.parentNode ?? (dt(n) ? n.host : null);
	}
	return null;
}
function Xn(e) {
	return "composedPath" in e ? e.composedPath()[0] ?? e.target : e.target;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/utils/constants.mjs
var Zn = "data-base-ui-focusable", Qn = "input:not([type='hidden']):not([disabled]),[contenteditable]:not([contenteditable='false']),textarea:not([disabled])", $n = "ArrowLeft", er = "ArrowRight", tr = "ArrowUp", nr = "ArrowDown", rr = "data-trigger-disabled";
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/utils/element.mjs
function ir(e, t) {
	if (!lt(e)) return !1;
	let n = e;
	if (t.hasElement(n)) return !n.hasAttribute(rr);
	for (let [, e] of t.entries()) if (Q(e, n)) return !e.hasAttribute(rr);
	return !1;
}
function ar(e, t) {
	if (t == null) return !1;
	if ("composedPath" in e) return e.composedPath().includes(t);
	let n = e;
	return n.target != null && t.contains(n.target);
}
function or(e) {
	return e.matches("html,body");
}
function sr(e) {
	return ut(e) && e.matches("input:not([type='hidden']):not([disabled]),[contenteditable]:not([contenteditable='false']),textarea:not([disabled])");
}
function cr(e) {
	return Yn(e, `button,a[href],[role="button"],select,[tabindex]:not([tabindex="-1"]),${Qn}`) != null;
}
function lr(e) {
	return e ? e.getAttribute("role") === "combobox" && sr(e) : !1;
}
function ur(e) {
	if (!e || tn) return !0;
	try {
		return e.matches(":focus-visible");
	} catch {
		return !0;
	}
}
function dr(e) {
	return e ? e.hasAttribute("data-base-ui-focusable") ? e : e.querySelector("[data-base-ui-focusable]") || e : null;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/hooks/useHoverShared.mjs
function fr(e, t) {
	return t != null && !Kn(t) ? 0 : typeof e == "function" ? e() : e;
}
function pr(e, t, n) {
	let r = fr(e, n);
	return typeof r == "number" ? r : r?.[t];
}
function mr(e) {
	return typeof e == "function" ? e() : e;
}
function hr(e, t) {
	return t || e === "click" || e === "mousedown";
}
function gr(e) {
	return e?.includes("mouse") && e !== "mousedown";
}
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.5.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/addEventListener.mjs
function _r(e, t, n, r) {
	return e.addEventListener(t, n, r), () => {
		e.removeEventListener(t, n, r);
	};
}
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.5.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/mergeCleanups.mjs
function vr(...e) {
	return () => {
		for (let t = 0; t < e.length; t += 1) {
			let n = e[t];
			n && n();
		}
	};
}
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.5.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/useValueAsRef.mjs
function yr(e) {
	let t = T(br, e).current;
	return t.next = e, Y(t.effect), t;
}
function br(e) {
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
//#region node_modules/.pnpm/@base-ui+utils@0.5.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/visuallyHidden.mjs
var xr = {
	clipPath: "inset(50%)",
	overflow: "hidden",
	whiteSpace: "nowrap",
	border: 0,
	padding: 0,
	width: 1,
	height: 1,
	margin: -1
}, Sr = {
	...xr,
	position: "fixed",
	margin: 0,
	top: 0,
	left: 0
}, Cr = {
	...xr,
	position: "absolute"
}, wr = /*#__PURE__*/ y.forwardRef(function(e, t) {
	let [n, r] = y.useState();
	Y(() => {
		en && $t && r("button");
	}, []);
	let i = {
		tabIndex: 0,
		role: n
	};
	return /*#__PURE__*/ (0, Z.jsx)("span", {
		...e,
		ref: t,
		style: Sr,
		"aria-hidden": !n || void 0,
		...i,
		"data-base-ui-focus-guard": ""
	});
}), Tr = Math.min, Er = Math.max, Dr = Math.round, Or = Math.floor, kr = (e) => ({
	x: e,
	y: e
}), Ar = {
	left: "right",
	right: "left",
	bottom: "top",
	top: "bottom"
};
function jr(e, t, n) {
	return Er(e, Tr(t, n));
}
function Mr(e, t) {
	return typeof e == "function" ? e(t) : e;
}
function Nr(e) {
	return e.split("-")[0];
}
function Pr(e) {
	return e.split("-")[1];
}
function Fr(e) {
	return e === "x" ? "y" : "x";
}
function Ir(e) {
	return e === "y" ? "height" : "width";
}
function Lr(e) {
	let t = e[0];
	return t === "t" || t === "b" ? "y" : "x";
}
function Rr(e) {
	return Fr(Lr(e));
}
function zr(e, t, n) {
	n === void 0 && (n = !1);
	let r = Pr(e), i = Rr(e), a = Ir(i), o = i === "x" ? r === (n ? "end" : "start") ? "right" : "left" : r === "start" ? "bottom" : "top";
	return t.reference[a] > t.floating[a] && (o = Jr(o)), [o, Jr(o)];
}
function Br(e) {
	let t = Jr(e);
	return [
		Vr(e),
		t,
		Vr(t)
	];
}
function Vr(e) {
	return e.includes("start") ? e.replace("start", "end") : e.replace("end", "start");
}
var Hr = ["left", "right"], Ur = ["right", "left"], Wr = ["top", "bottom"], Gr = ["bottom", "top"];
function Kr(e, t, n) {
	switch (e) {
		case "top":
		case "bottom": return n ? t ? Ur : Hr : t ? Hr : Ur;
		case "left":
		case "right": return t ? Wr : Gr;
		default: return [];
	}
}
function qr(e, t, n, r) {
	let i = Pr(e), a = Kr(Nr(e), n === "start", r);
	return i && (a = a.map((e) => e + "-" + i), t && (a = a.concat(a.map(Vr)))), a;
}
function Jr(e) {
	let t = Nr(e);
	return Ar[t] + e.slice(t.length);
}
function Yr(e) {
	return {
		top: e.top ?? 0,
		right: e.right ?? 0,
		bottom: e.bottom ?? 0,
		left: e.left ?? 0
	};
}
function Xr(e) {
	return typeof e == "number" ? {
		top: e,
		right: e,
		bottom: e,
		left: e
	} : Yr(e);
}
function Zr(e) {
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
function Qr(e, t) {
	return t < 0 || t >= e.length;
}
function $r(e, t) {
	return ni(e.current, { disabledIndices: t });
}
function ei(e, t) {
	return ni(e.current, {
		decrement: !0,
		startingIndex: e.current.length,
		disabledIndices: t
	});
}
function ti(e, t, n) {
	let { decrement: r, loopFocus: i, allowEscape: a, disabledIndices: o, minIndex: s, maxIndex: c } = n, l = () => ni(e, {
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
		index: Qr(e, u) ? -1 : u,
		wrapped: d
	};
}
function ni(e, { startingIndex: t = -1, decrement: n = !1, disabledIndices: r, amount: i = 1 } = {}) {
	let a = t;
	do
		a += n ? -i : i;
	while (a >= 0 && a <= e.length - 1 && ri(e, a, r));
	return a;
}
function ri(e, t, n) {
	if (typeof n == "function" ? n(t) : n?.includes(t) ?? !1) return !0;
	let r = e[t];
	return r ? !ai(r) || r.matches(":disabled") ? !0 : !n && (r.hasAttribute("disabled") || r.getAttribute("aria-disabled") === "true") : !1;
}
function ii(e) {
	return e.visibility === "hidden" || e.visibility === "collapse";
}
function ai(e, t = e ? Ct(e) : null) {
	return !e || !e.isConnected || !t || ii(t) ? !1 : typeof e.checkVisibility == "function" ? e.checkVisibility() : t.display !== "none" && t.display !== "contents";
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/utils/tabbable.mjs
var oi = "a[href],button,input,select,textarea,summary,details,iframe,object,embed,[tabindex],[contenteditable]:not([contenteditable=\"false\"]),audio[controls],video[controls]";
function si(e) {
	let t = e.assignedSlot;
	if (t) return t;
	if (e.parentElement) return e.parentElement;
	let n = e.getRootNode();
	return dt(n) ? n.host : null;
}
function ci(e) {
	for (let t of Array.from(e.children)) if (at(t) === "summary") return t;
	return null;
}
function li(e, t) {
	let n = ci(t);
	return !!n && (e === n || Q(n, e));
}
function ui(e) {
	let t = e ? at(e) : "";
	return e != null && e.matches(oi) && (t !== "summary" || e.parentElement != null && at(e.parentElement) === "details" && ci(e.parentElement) === e) && (t !== "details" || ci(e) == null) && (t !== "input" || e.type !== "hidden");
}
function di(e) {
	if (!ui(e) || !e.isConnected || e.matches(":disabled")) return !1;
	for (let t = e; t; t = si(t)) {
		let n = t !== e, r = at(t) === "slot";
		if (t.hasAttribute("inert") || n && at(t) === "details" && !t.open && !li(e, t) || t.hasAttribute("hidden") || !r && !fi(t, n)) return !1;
	}
	return !0;
}
function fi(e, t) {
	let n = Ct(e);
	return t ? n.display !== "none" : ai(e, n);
}
function pi(e) {
	let t = e.tabIndex;
	if (t < 0) {
		let t = at(e);
		if (t === "details" || t === "audio" || t === "video" || ut(e) && e.isContentEditable) return 0;
	}
	return t;
}
function mi(e) {
	if (at(e) !== "input") return null;
	let t = e;
	return t.type === "radio" && t.name !== "" ? t : null;
}
function hi(e, t) {
	let n = mi(e);
	if (!n) return !0;
	let r = t.find((e) => {
		let t = mi(e);
		return t?.name === n.name && t.form === n.form && t.checked;
	});
	return r ? r === n : t.find((e) => {
		let t = mi(e);
		return t?.name === n.name && t.form === n.form;
	}) === n;
}
function gi(e) {
	if (ut(e) && at(e) === "slot") {
		let t = e.assignedElements({ flatten: !0 });
		if (t.length > 0) return t;
	}
	return ut(e) && e.shadowRoot ? Array.from(e.shadowRoot.children) : Array.from(e.children);
}
function _i(e, t) {
	gi(e).forEach((e) => {
		ui(e) && t.push(e), _i(e, t);
	});
}
function vi(e, t, n) {
	gi(e).forEach((e) => {
		ut(e) && e.matches(t) && n.push(e), vi(e, t, n);
	});
}
function yi(e) {
	return di(e) && pi(e) >= 0;
}
function bi(e) {
	let t = [];
	return _i(e, t), t.filter(di);
}
function xi(e) {
	let t = bi(e);
	return t.filter((e) => pi(e) >= 0 && hi(e, t));
}
function Si(e, t) {
	let n = xi(e), r = n.length;
	if (r === 0) return;
	let i = Jn(Lt(e)), a = n.indexOf(i);
	return n[a === -1 ? t === 1 ? 0 : r - 1 : a + t];
}
function Ci(e) {
	return Si(Lt(e).body, 1) || e;
}
function wi(e) {
	return Si(Lt(e).body, -1) || e;
}
function Ti(e, t, n) {
	if (!e) return null;
	let r = [];
	_i(Lt(e).body, r);
	let i = r.indexOf(e);
	if (i === -1) return null;
	let a = r.filter(di);
	for (let e = 1; e < r.length; e += 1) {
		let o = r[(i + t * e + r.length) % r.length];
		if (!Q(n, o) && yi(o) && hi(o, a)) return o;
	}
	return r[i];
}
function Ei(e, t) {
	let n = t || e.currentTarget, r = e.relatedTarget;
	return !r || !Q(n, r);
}
function Di(e) {
	xi(e).forEach((e) => {
		e.dataset.tabindex = e.getAttribute("tabindex") || "", e.setAttribute("tabindex", "-1");
	});
}
function Oi(e) {
	let t = [];
	vi(e, "[data-tabindex]", t), t.forEach((e) => {
		let t = e.dataset.tabindex;
		delete e.dataset.tabindex, t ? e.setAttribute("tabindex", t) : e.removeAttribute("tabindex");
	});
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/utils/nodes.mjs
function ki(e, t, n = !0) {
	return e.filter((e) => e.parentId === t).flatMap((t) => [...!n || t.context?.open ? [t] : [], ...ki(e, t.id, n)]);
}
function Ai(e, t) {
	let n = [], r = e.find((e) => e.id === t)?.parentId;
	for (; r;) {
		let t = e.find((e) => e.id === r);
		r = t?.parentId, t && (n = n.concat(t));
	}
	return n;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/utils/createAttribute.mjs
function ji(e) {
	return `data-base-ui-${e}`;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/utils/enqueueFocus.mjs
var Mi = 0;
function Ni(e, t = {}) {
	let { preventScroll: n = !1, sync: r = !1, shouldFocus: i } = t;
	cancelAnimationFrame(Mi);
	function a() {
		(!i || i()) && e?.focus({ preventScroll: n });
	}
	if (r) return a(), I;
	let o = requestAnimationFrame(a);
	return Mi = o, () => {
		Mi === o && (cancelAnimationFrame(o), Mi = 0);
	};
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/utils/markOthers.mjs
var Pi = "data-base-ui-inert", Fi = /* @__PURE__ */ new WeakMap(), Ii = /* @__PURE__ */ new WeakSet(), Li = /* @__PURE__ */ new WeakMap(), Ri = 0;
function zi(e) {
	return e ? dt(e) ? e.host : zi(e.parentNode) : null;
}
var Bi = (e, t) => t.map((t) => {
	if (e.contains(t)) return t;
	let n = zi(t);
	return e.contains(n) ? n : null;
}).filter((e) => e != null), Vi = (e) => {
	let t = /* @__PURE__ */ new Set();
	return e.forEach((e) => {
		let n = e;
		for (; n && !t.has(n);) t.add(n), n = n.parentNode;
	}), t;
}, Hi = (e, t, n) => {
	let r = [], i = (e) => {
		e && !n.has(e) && Array.from(e.children).forEach((e) => {
			at(e) !== "script" && (t.has(e) ? i(e) : r.push(e));
		});
	};
	return i(e), r;
};
function Ui(e, t, n, { mark: r = !0 }) {
	let i = Bi(t, e), a = r ? Hi(t, Vi(i), new Set(i)) : [], o = [], s = [];
	if (n) {
		let e = Bi(t, Array.from(t.querySelectorAll("[aria-live]"))), n = i.concat(e);
		Hi(t, Vi(n), new Set(n)).forEach((e) => {
			let t = e.getAttribute("aria-hidden"), n = t !== null && t !== "false", r = (Fi.get(e) || 0) + 1;
			Fi.set(e, r), o.push(e), r === 1 && n && Ii.add(e), n || e.setAttribute("aria-hidden", "true");
		});
	}
	return r && a.forEach((e) => {
		let t = (Li.get(e) || 0) + 1;
		Li.set(e, t), s.push(e), t === 1 && e.setAttribute(Pi, "");
	}), Ri += 1, () => {
		o.forEach((e) => {
			let t = (Fi.get(e) || 0) - 1;
			Fi.set(e, t), t || (Ii.has(e) || e.removeAttribute("aria-hidden"), Ii.delete(e));
		}), r && s.forEach((e) => {
			let t = (Li.get(e) || 0) - 1;
			Li.set(e, t), t || e.removeAttribute(Pi);
		}), --Ri, Ri || (Fi = /* @__PURE__ */ new WeakMap(), Ii = /* @__PURE__ */ new WeakSet(), Li = /* @__PURE__ */ new WeakMap());
	};
}
function Wi(e, t = {}) {
	let { ariaHidden: n = !1, mark: r = !0 } = t, i = Lt(e[0]).body;
	return Ui(e, i, n, { mark: r });
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/constants.mjs
var Gi = { style: { transition: "none" } }, Ki = { fallbackAxisSide: "none" }, qi = { fallbackAxisSide: "end" }, Ji = {
	clipPath: "inset(50%)",
	position: "fixed",
	top: 0,
	left: 0
}, Yi = /*#__PURE__*/ y.createContext(null), Xi = () => y.useContext(Yi), Zi = ji("portal");
function Qi(e = {}) {
	let { ref: t, container: n, componentProps: r = R, elementProps: i } = e, a = mn(), o = Xi()?.portalNode, [s, c] = y.useState(null), [l, u] = y.useState(null), d = J((e) => {
		e !== null && u(e);
	}), f = y.useRef(null);
	Y(() => {
		if (n === null) {
			f.current && (f.current = null, u(null), c(null));
			return;
		}
		let e = (n && (ct(n) ? n : n.current)) ?? o ?? document.body;
		if (e == null) {
			f.current && (f.current = null, u(null), c(null));
			return;
		}
		f.current !== e && (f.current = e, u(null), c(e));
	}, [n, o]);
	let p = q("div", r, {
		ref: [t, d],
		props: [{
			id: a,
			[Zi]: ""
		}, i]
	}), m = s && p ? /*#__PURE__*/ Dn.createPortal(p, s) : null;
	return {
		node: l,
		nodeId: /*#__PURE__*/ y.isValidElement(p) ? p.props.id : void 0,
		subtree: m
	};
}
var $i = /*#__PURE__*/ y.forwardRef(function(e, t) {
	let { render: n, className: r, style: i, children: a, container: o, portalOwnerRole: s, ...c } = e, { node: l, nodeId: u, subtree: d } = Qi({
		container: o,
		ref: t,
		componentProps: e,
		elementProps: c
	}), f = y.useRef(null), p = y.useRef(null), m = y.useRef(null), h = y.useRef(null), [g, _] = y.useState(null), v = y.useRef(!1), b = g?.modal, x = g?.open, S = !!g && !g.modal && g.open && !!l;
	y.useEffect(() => {
		if (!l || b) return;
		function e(e) {
			l && e.relatedTarget && Ei(e) && (e.type === "focusin" ? v.current &&= (Oi(l), !1) : (Di(l), v.current = !0));
		}
		return vr(_r(l, "focusin", e, !0), _r(l, "focusout", e, !0));
	}, [l, b]), Y(() => {
		l && x === !0 && v.current && (Oi(l), v.current = !1);
	}, [x, l]);
	let C = y.useMemo(() => ({
		beforeOutsideRef: f,
		afterOutsideRef: p,
		beforeInsideRef: m,
		afterInsideRef: h,
		portalNode: l,
		setFocusManagerState: _
	}), [l]);
	return /*#__PURE__*/ (0, Z.jsxs)(y.Fragment, { children: [d, /*#__PURE__*/ (0, Z.jsxs)(Yi.Provider, {
		value: C,
		children: [
			S && l && /*#__PURE__*/ (0, Z.jsx)(wr, {
				"data-type": "outside",
				ref: f,
				onFocus: (e) => {
					Ei(e, l) ? m.current?.focus() : wi(g ? g.domReference : null)?.focus();
				}
			}),
			S && l && /*#__PURE__*/ (0, Z.jsx)("span", {
				role: s,
				"aria-owns": u,
				style: Ji
			}),
			l && /*#__PURE__*/ Dn.createPortal(a, l),
			S && l && /*#__PURE__*/ (0, Z.jsx)(wr, {
				"data-type": "outside",
				ref: p,
				onFocus: (e) => {
					Ei(e, l) ? h.current?.focus() : (Ci(g ? g.domReference : null)?.focus(), g?.closeOnFocusOut && g?.onOpenChange(!1, X("focus-out", e.nativeEvent)));
				}
			})
		]
	})] });
});
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/utils/createEventEmitter.mjs
function ea() {
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
var ta = class {
	nodesRef = { current: [] };
	events = ea();
	addNode(e) {
		this.nodesRef.current.push(e);
	}
	removeNode(e) {
		let t = this.nodesRef.current.findIndex((t) => t === e);
		t !== -1 && this.nodesRef.current.splice(t, 1);
	}
}, na = /*#__PURE__*/ y.createContext(null), ra = /*#__PURE__*/ y.createContext(null), ia = () => y.useContext(na)?.id || null, aa = (e) => {
	let t = y.useContext(ra);
	return e ?? t;
};
function oa(e) {
	let t = mn(), n = aa(e), r = ia();
	return Y(() => {
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
function sa(e) {
	let { children: t, id: n } = e, r = ia();
	return /*#__PURE__*/ (0, Z.jsx)(na.Provider, {
		value: y.useMemo(() => ({
			id: n,
			parentId: r
		}), [n, r]),
		children: t
	});
}
function ca(e) {
	let { children: t, externalTree: n } = e, r = T(() => n ?? new ta()).current;
	return /*#__PURE__*/ (0, Z.jsx)(ra.Provider, {
		value: r,
		children: t
	});
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/components/FloatingFocusManager.mjs
function la(e, t) {
	let n = ot(Xn(e));
	return e instanceof n.KeyboardEvent ? "keyboard" : e instanceof n.FocusEvent ? t || "keyboard" : "pointerType" in e ? e.pointerType || (Wn(e) ? "keyboard" : t || "mouse") : "touches" in e ? "touch" : e instanceof n.MouseEvent ? t || (e.detail === 0 ? "keyboard" : "mouse") : "";
}
var ua = 20, da = [];
function fa() {
	da = da.filter((e) => e.deref()?.isConnected);
}
function pa(e) {
	fa(), e && at(e) !== "body" && (da.push(new WeakRef(e)), da.length > ua && (da = da.slice(-20)));
}
function ma() {
	return fa(), da[da.length - 1]?.deref();
}
function ha(e) {
	return e ? yi(e) ? e : xi(e)[0] || e : null;
}
function ga(e) {
	if (e.hasAttribute("tabindex") && !e.hasAttribute("data-tabindex") || !e.getAttribute("role")?.includes("dialog")) return;
	let t = bi(e).filter((e) => {
		let t = e.getAttribute("data-tabindex") || "";
		return yi(e) || e.hasAttribute("data-tabindex") && !t.startsWith("-");
	}), n = e.getAttribute("tabindex");
	t.length === 0 ? n !== "0" && (e.setAttribute("tabindex", "0"), e.setAttribute("data-tabindex", "0")) : (n !== "-1" || e.hasAttribute("data-tabindex") && e.getAttribute("data-tabindex") !== "-1") && (e.setAttribute("tabindex", "-1"), e.setAttribute("data-tabindex", "-1"));
}
function _a(e) {
	let { context: t, children: n, disabled: r = !1, initialFocus: i = !0, returnFocus: a = !0, explicitReturnFocus: o, restoreFocus: s = !1, modal: c = !0, closeOnFocusOut: l = !0, openInteractionType: u = "", nextFocusableElement: d, previousFocusableElement: f, beforeContentFocusGuardRef: p, externalTree: m, getInsideElements: h } = e, g = t.useState("open"), _ = t.useState("domReferenceElement"), v = t.useState("floatingElement"), { events: b, dataRef: x } = t.context, S = J(() => x.current.floatingContext?.nodeId), C = i === !1, w = lr(_) && C, T = yr(i), D = yr(a), O = yr(o), k = yr(u), A = yr(g), j = aa(m), M = Xi(), N = y.useRef(!1), P = y.useRef(!1), F = y.useRef(!1), I = y.useRef(null), L = y.useRef(""), R = y.useRef(""), z = y.useRef(null), B = y.useRef(null), ee = E(z, p, M?.beforeInsideRef), V = E(B, M?.afterInsideRef), H = Vn(), U = Vn(), W = Cn(), te = M != null, G = dr(v), ne = J((e = G) => e ? xi(e) : []), re = J(() => h?.().filter((e) => e != null) ?? []);
	y.useEffect(() => {
		if (r || !c) return;
		function e(e) {
			e.key === "Tab" && Q(G, Jn(Lt(G))) && ne().length === 0 && !w && Hn(e);
		}
		return _r(Lt(G), "keydown", e);
	}, [
		r,
		G,
		c,
		w,
		ne
	]), y.useEffect(() => {
		if (r || !g) return;
		let e = Lt(G);
		function t() {
			F.current = !1;
		}
		function n(e) {
			let t = Xn(e), n = re(), r = Q(v, t) || Q(_, t) || Q(M?.portalNode, t) || n.some((e) => e === t || Q(e, t));
			F.current = !r, R.current = e.pointerType || "keyboard", Yn(t, "[data-base-ui-click-trigger]") && (P.current = !0, U.start(0, () => {
				P.current = !1;
			}));
		}
		function i() {
			R.current = "keyboard";
		}
		return vr(_r(e, "pointerdown", n, !0), _r(e, "pointerup", t, !0), _r(e, "pointercancel", t, !0), _r(e, "keydown", i, !0), t);
	}, [
		r,
		v,
		_,
		G,
		g,
		M,
		U,
		re
	]), y.useEffect(() => {
		if (r || !l) return;
		let e = Lt(G);
		function n() {
			P.current = !0, U.start(0, () => {
				P.current = !1;
			});
		}
		function i(e) {
			let t = Xn(e);
			yi(t) && (I.current = t);
		}
		function a(n) {
			let r = n.relatedTarget, i = n.currentTarget, a = Xn(n);
			c && r == null && a != null && Q(v, a) && pa(a), queueMicrotask(() => {
				let o = S(), l = t.context.triggerElements, u = re(), p = r?.hasAttribute(ji("focus-guard")) && [
					z.current,
					B.current,
					M?.beforeInsideRef.current,
					M?.afterInsideRef.current,
					M?.beforeOutsideRef.current,
					M?.afterOutsideRef.current,
					Tn(f),
					Tn(d)
				].includes(r), m = !(Q(_, r) || Q(v, r) || Q(r, v) || Q(M?.portalNode, r) || u.some((e) => e === r || Q(e, r)) || l.hasMatchingElement((e) => Q(e, r)) || p || j && (ki(j.nodesRef.current, o).find((e) => Q(e.context?.elements.floating, r) || Q(e.context?.elements.domReference, r)) || Ai(j.nodesRef.current, o).find((e) => [e.context?.elements.floating, dr(e.context?.elements.floating)].includes(r) || e.context?.elements.domReference === r)));
				if (i === _ && G && ga(G), s && i !== _ && !ai(a) && Jn(e) === e.body) {
					if (ut(G) && (G.focus(), s === "popup")) {
						W.request(() => {
							G.focus();
						});
						return;
					}
					let e = ne(), t = I.current, n = (t && e.includes(t) ? t : null) || e[e.length - 1] || G;
					ut(n) && n.focus();
				}
				if (x.current.insideReactTree) {
					x.current.insideReactTree = !1;
					return;
				}
				(w || !c) && r && m && !P.current && (w || r !== ma()) && (N.current = !0, t.setOpen(!1, X(Ue, n)));
			});
		}
		function o() {
			F.current || (x.current.insideReactTree = !0, H.start(0, () => {
				x.current.insideReactTree = !1;
			}));
		}
		let u = ut(_) ? _ : null;
		if (v || u) return vr(u && _r(u, "focusout", a), u && _r(u, "pointerdown", n), v && _r(v, "focusin", i), v && _r(v, "focusout", a), v && M && _r(v, "focusout", o, !0));
	}, [
		r,
		_,
		v,
		G,
		c,
		j,
		M,
		t,
		l,
		s,
		ne,
		w,
		S,
		x,
		H,
		U,
		W,
		d,
		f,
		re
	]), y.useEffect(() => {
		if (r || !v || !g) return;
		let e = Array.from(M?.portalNode?.querySelectorAll(`[${ji("portal")}]`) || []), t = (j ? Ai(j.nodesRef.current, S()) : []).find((e) => lr(e.context?.elements.domReference || null))?.context?.elements.domReference, n = Wi([
			v,
			...e,
			z.current,
			B.current,
			M?.beforeOutsideRef.current,
			M?.afterOutsideRef.current,
			...re(),
			t,
			Tn(f),
			Tn(d),
			w ? _ : null
		].filter((e) => e != null), {
			ariaHidden: c || w,
			mark: !1
		}), i = Wi([v, ...e].filter((e) => e != null));
		return () => {
			i(), n();
		};
	}, [
		g,
		r,
		_,
		v,
		c,
		M,
		w,
		j,
		S,
		d,
		f,
		re
	]), Y(() => {
		if (!g || r || !ut(G)) return;
		L.current = "", R.current = "";
		let e = Lt(G), t = Jn(e);
		queueMicrotask(() => {
			let n = T.current, r = typeof n == "function" ? n(k.current || "") : n;
			if (r === void 0 || r === !1 || Q(G, t)) return;
			let i = null, a = () => (i ??= ne(G), i[0] || G), o;
			o = r === !0 || r === null ? a() : Tn(r), o ||= a();
			let s = Q(G, Jn(e)), c = x.current.openEvent, l = c?.type === "mousedown" && Wn(c);
			Ni(o, {
				sync: l,
				preventScroll: o === G,
				shouldFocus() {
					if (!A.current) return !1;
					if (s) return !0;
					let t = Jn(e);
					return !(t !== o && Q(G, t));
				}
			});
		});
	}, [
		r,
		g,
		G,
		ne,
		T,
		k,
		A,
		x
	]);
	let ie = y.useRef(null);
	Y(() => {
		if (r || !G) {
			ie.current = null;
			return;
		}
		ie.current &&= (ie.current.cancelled = !0, null);
		let e = Lt(G), t = Jn(e), n = k.current == null;
		pa(t);
		function i(e) {
			if (e.open || (L.current = la(e.nativeEvent, R.current)), (e.reason === "focus-out" && e.triggerElement?.hasAttribute(ji("focus-guard")) || e.reason === "trigger-hover" && e.nativeEvent.type === "mouseleave") && (N.current = !0), e.reason === "outside-press") {
				if (e.nested) N.current = !1;
				else if (Wn(e.nativeEvent) || Gn(e.nativeEvent)) N.current = !1;
				else {
					let e = !1;
					Lt(G).createElement("div").focus({ get preventScroll() {
						return e = !0, !1;
					} }), e ? N.current = !1 : N.current = !0;
				}
			}
		}
		b.on("openchange", i);
		function a(e) {
			let r = D.current, i = typeof r == "function" ? r(e) : r;
			if (i === void 0 || i === !1) return null;
			i === null && (i = !0);
			let a = _?.isConnected ? _ : null, o = t?.isConnected && at(t) !== "body" ? t : null, s = n ? o || a : a || o;
			return s ||= ma() || null, typeof i == "boolean" ? s : Tn(i) || s || null;
		}
		return () => {
			b.off("openchange", i);
			let t = Jn(e), n = re(), r = Q(v, t) || n.some((e) => e === t || Q(e, t)) || j && ki(j.nodesRef.current, S(), !1).some((e) => Q(e.context?.elements.floating, t)), o = D.current, s = L.current, c = a(s), l = { cancelled: !1 };
			ie.current = l, queueMicrotask(() => {
				ie.current === l && (ie.current = null);
				let n = ha(c), i = O.current ?? typeof o != "boolean";
				if (!l.cancelled && o && !N.current && ut(n) && (i || n === t || t === e.body || r)) {
					let e = { preventScroll: !0 };
					s === "keyboard" && (e.focusVisible = !0), n.focus(e);
				}
				N.current = !1;
			});
		};
	}, [
		r,
		v,
		G,
		D,
		O,
		k,
		b,
		j,
		_,
		S,
		re
	]), Y(() => {
		if (!$t || g || !v) return;
		let e = Jn(Lt(v));
		ut(e) && sr(e) && Q(v, e) && e.blur();
	}, [g, v]), Y(() => {
		if (!r && M) return M.setFocusManagerState({
			modal: c,
			closeOnFocusOut: l,
			open: g,
			onOpenChange: t.setOpen,
			domReference: _
		}), () => {
			M.setFocusManagerState(null);
		};
	}, [
		r,
		M,
		c,
		g,
		t,
		l,
		_
	]), Y(() => {
		if (!r && G) return ga(G), () => {
			queueMicrotask(fa);
		};
	}, [r, G]);
	let K = !r && (!c || !w) && (te || c);
	return /*#__PURE__*/ (0, Z.jsxs)(y.Fragment, { children: [
		K && /*#__PURE__*/ (0, Z.jsx)(wr, {
			"data-type": "inside",
			ref: ee,
			onFocus: (e) => {
				if (c) {
					let e = ne();
					Ni(e[e.length - 1]);
				} else M?.portalNode && (N.current = !1, Ei(e, M.portalNode) ? Ci(_)?.focus() : Tn(f ?? M.beforeOutsideRef)?.focus());
			}
		}),
		n,
		K && /*#__PURE__*/ (0, Z.jsx)(wr, {
			"data-type": "inside",
			ref: V,
			onFocus: (e) => {
				c ? Ni(ne()[0]) : M?.portalNode && (l && (N.current = !0), Ei(e, M.portalNode) ? wi(_)?.focus() : Tn(d ?? M.afterOutsideRef)?.focus());
			}
		})
	] });
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/hooks/useClick.mjs
function va(e, t = {}) {
	let { enabled: n = !0, event: r = "click", toggle: i = !0, ignoreMouse: a = !1, stickIfOpen: o = !0, touchOpenDelay: s = 0, reason: c = Le } = t, l = e.context.dataRef, u = y.useRef(void 0), d = Cn(), f = Vn(), p = y.useMemo(() => {
		function t(t, n, r, i) {
			let a = X(c, n, r);
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
				u.current = Kn(e.pointerType, !0) && Gn(e.nativeEvent) ? "virtual" : e.pointerType;
			},
			onMouseDown(i) {
				let o = u.current, s = i.nativeEvent, c = e.select("open");
				if (i.button !== 0 || r === "click" || Kn(o, !0) && a) return;
				let l = n(c, i.currentTarget, (e) => e === "click" || e === "mousedown"), f = Xn(s), p = sr(f);
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
				Kn(o, !0) && a || t(n(e.select("open"), i.currentTarget, (e) => e === "click" || e === "mousedown" || e === "keydown" || e === "keyup"), i.nativeEvent, i.currentTarget, o);
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
	return y.useMemo(() => n ? { reference: p } : R, [n, p]);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/hooks/useDismiss.mjs
function ya() {
	return !1;
}
function ba(e) {
	return {
		escapeKey: typeof e == "boolean" ? e : e?.escapeKey ?? !1,
		outsidePress: typeof e == "boolean" ? e : e?.outsidePress ?? !0
	};
}
function xa(e, t = {}) {
	let { enabled: n = !0, escapeKey: r = !0, outsidePress: i = !0, outsidePressEvent: a = "sloppy", referencePress: o = ya, bubbles: s, externalTree: c } = t, l = e.useState("open"), u = e.useState("floatingElement"), { dataRef: d, events: f } = e.context, p = aa(c), m = J(typeof i == "function" ? i : () => !1), h = typeof i == "function" ? m : i, g = h !== !1, _ = J(() => a), { escapeKey: v, outsidePress: b } = ba(s), x = y.useRef(!1), S = y.useRef(!1), C = y.useRef(!1), w = y.useRef(!1), T = y.useRef(!1), E = y.useRef(""), D = y.useRef(null), O = Vn(), k = Vn(), A = Vn(), j = J(() => {
		k.clear(), d.current.insideReactTree = !1;
	}), M = J((e) => {
		let t = d.current.floatingContext?.nodeId;
		return (p ? ki(p.nodesRef.current, t) : []).some((t) => t.context?.open && !t.context.dataRef.current[e]);
	}), N = J((t) => ar(t, e.select("floatingElement")) || ar(t, e.select("domReferenceElement"))), P = J((t) => {
		o() && e.setOpen(!1, X(Le, t.nativeEvent));
	}), F = J((t) => {
		if (!l || !n || !r || t.key !== "Escape") return;
		let i = Un(t) ? t.nativeEvent : t;
		if (T.current || i.isComposing || !v && M("__escapeKeyBubbles")) return;
		let a = X(We, i);
		e.setOpen(!1, a), a.isCanceled || t.preventDefault(), !v && !a.isPropagationAllowed && t.stopPropagation();
	}), I = J(() => {
		d.current.insideReactTree = !0, k.start(0, j);
	}), L = J((t) => {
		if (!l || !n || t.button !== 0) return;
		let r = Xn(t.nativeEvent);
		Q(e.select("floatingElement"), r) && (x.current || (x.current = !0, S.current = !1));
	}), R = J((e) => {
		l && n && (e.defaultPrevented || e.nativeEvent.defaultPrevented) && x.current && (S.current = !0);
	});
	y.useEffect(() => {
		function e(e) {
			e.open || (w.current = !1);
		}
		return f.on("openchange", e), () => {
			f.off("openchange", e);
		};
	}, [f]), y.useEffect(() => j, [j]), y.useEffect(() => {
		if (!l || !n) return l || (w.current = !1, T.current = !1, E.current = "", D.current = null), j;
		d.current.__escapeKeyBubbles = v, d.current.__outsidePressBubbles = b;
		let t = new Bn(), i = Lt(u);
		function a() {
			A.clear(), T.current = !0;
		}
		function o() {
			T.current = !0, A.start($t ? 5 : 0, () => {
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
			let e = E.current, t = e === "pen" || !e ? "mouse" : e, n = _(), r = typeof n == "function" ? n() : n;
			return typeof r == "string" ? r : r[t];
		}
		function m(e) {
			let t = f();
			return t === "intentional" && e.type !== "click" || t === "sloppy" && e.type === "click";
		}
		function y(e) {
			let t = d.current.floatingContext?.nodeId, n = p && ki(p.nodesRef.current, t).some((t) => ar(e, t.context?.elements.floating));
			return N(e) || n;
		}
		function k(n) {
			if (m(n)) {
				n.type !== "click" && !N(n) && (t.clear(), C.current = !1), j();
				return;
			}
			if (d.current.insideReactTree) {
				j();
				return;
			}
			let r = Xn(n), i = `[${ji("inert")}]`, a = lt(r) ? r.getRootNode() : null, o = Array.from((dt(a) ? a : Lt(e.select("floatingElement"))).querySelectorAll(i)), s = e.context.triggerElements;
			if (r && (s.hasElement(r) || s.hasMatchingElement((e) => Q(e, r)))) return;
			let c = lt(r) ? r : null;
			for (; c && !St(c);) {
				let e = Tt(c);
				if (St(e) || !lt(e)) break;
				c = e;
			}
			if (!(o.length && lt(r) && !or(r) && !Q(r, e.select("floatingElement")) && o.every((e) => !Q(c, e)))) {
				if (ut(r) && !("touches" in n)) {
					let e = St(r), t = Ct(r), i = /auto|scroll/, a = e || i.test(t.overflowX), o = e || i.test(t.overflowY), s = a && r.clientWidth > 0 && r.scrollWidth > r.clientWidth, c = o && r.clientHeight > 0 && r.scrollHeight > r.clientHeight, l = t.direction === "rtl", u = c && (l ? n.offsetX <= r.offsetWidth - r.clientWidth : n.offsetX > r.clientWidth), d = s && n.offsetY > r.clientHeight;
					if (u || d) return;
				}
				if (!y(n)) {
					if (f() === "intentional") {
						if (n.detail !== 0 && !Wn(n) && !w.current) return;
						if (C.current) {
							t.clear(), C.current = !1;
							return;
						}
					}
					(typeof h != "function" || h(n)) && (M("__outsidePressBubbles") || (e.setOpen(!1, X(Be, n)), j()));
				}
			}
		}
		function P(t) {
			f() === "sloppy" && t.pointerType !== "touch" && e.select("open") && n && !N(t) && k(t);
		}
		function I(t) {
			if (f() !== "sloppy" || !e.select("open") || !n || N(t)) return;
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
			let n = Xn(e);
			if (!n) return;
			let r = _r(n, e.type, () => {
				t(e), r();
			});
		}
		function R(e) {
			E.current = "touch", L(e, I);
		}
		function z(e) {
			O.clear(), e.type === "pointerdown" && (e.button === 0 && (w.current = !0), E.current = e.pointerType), (e.type !== "mousedown" || !D.current || D.current.dismissOnMouseDown) && L(e, (e) => {
				e.type === "pointerdown" ? P(e) : k(e);
			});
		}
		function B(e) {
			if (e.type === "pointercancel" && (w.current = !1), !x.current) return;
			let n = S.current;
			if (c(), f() === "intentional") {
				if (e.type === "pointercancel") {
					n && s();
					return;
				}
				if (!y(e)) {
					if (n) {
						s();
						return;
					}
					(typeof h != "function" || h(e)) && (t.clear(), C.current = !0, j());
				}
			}
		}
		function ee(e) {
			if (f() !== "sloppy" || !D.current || N(e)) return;
			let t = e.touches[0];
			if (!t) return;
			let n = Math.abs(t.clientX - D.current.startX), r = Math.abs(t.clientY - D.current.startY), i = Math.sqrt(n * n + r * r);
			i > 5 && (D.current.dismissOnTouchEnd = !0), i > 10 && (k(e), O.clear(), D.current = null);
		}
		function V(e) {
			L(e, ee);
		}
		function H(e) {
			f() === "sloppy" && D.current && !N(e) && (D.current.dismissOnTouchEnd && k(e), O.clear(), D.current = null);
		}
		function U(e) {
			L(e, H);
		}
		let W = vr(r && vr(_r(i, "keydown", F), _r(i, "compositionstart", a), _r(i, "compositionend", o)), g && vr(_r(i, "click", z, !0), _r(i, "pointerdown", z, !0), _r(i, "pointerup", B, !0), _r(i, "pointercancel", B, !0), _r(i, "mousedown", z, !0), _r(i, "mouseup", B, !0), _r(i, "touchstart", R, {
			capture: !0,
			passive: !0
		}), _r(i, "touchmove", V, {
			capture: !0,
			passive: !0
		}), _r(i, "touchend", U, {
			capture: !0,
			passive: !0
		})));
		return () => {
			W(), t.clear(), c(), C.current = !1;
		};
	}, [
		d,
		u,
		r,
		g,
		h,
		l,
		n,
		v,
		b,
		F,
		j,
		_,
		M,
		N,
		p,
		e,
		O,
		A
	]);
	let z = y.useMemo(() => ({
		onKeyDown: F,
		onPointerDown: P,
		onClick: P
	}), [F, P]), B = y.useMemo(() => ({
		onKeyDown: F,
		onPointerDown: R,
		onMouseDown: R,
		onClickCapture: I,
		onMouseDownCapture(e) {
			I(), L(e);
		},
		onPointerDownCapture(e) {
			I(), L(e);
		},
		onMouseUpCapture: I,
		onTouchEndCapture: I,
		onTouchMoveCapture: I
	}), [
		F,
		I,
		L,
		R
	]);
	return y.useMemo(() => n ? {
		reference: z,
		floating: B,
		trigger: z
	} : {}, [
		n,
		z,
		B
	]);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/hooks/useSyncedFloatingRootContext.mjs
function Sa(e) {
	let { popupStore: t, treatPopupAsFloatingElement: n = !1, floatingRootContext: r, floatingId: i, nested: a, onOpenChange: o } = e, s = t.useState("open"), c = t.useState("activeTriggerElement"), l = t.useState(n ? "popupElement" : "positionerElement"), u = o;
	return t.useSyncedValue("floatingId", i), Y(() => {
		let e = {
			open: s,
			floatingId: i,
			referenceElement: c,
			floatingElement: l
		};
		lt(c) && (e.domReferenceElement = c), r.state.positionReference === r.state.referenceElement && (e.positionReference = c), r.update(e);
	}, [
		s,
		i,
		c,
		l,
		r
	]), r.context.onOpenChange = u, r.context.nested = a, r;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/useUnmountAfterClose.mjs
function Ca(e) {
	let { open: t, ref: n, preventUnmountOnClose: r, setPreventUnmountOnClose: i, onUnmount: a, animateInitialOpen: o } = e, s = J(i), { mounted: c, setMounted: l, transitionStatus: u } = wn(t, !1, !1, o), d = !t && r;
	Y(() => {
		t && s(!1);
	}, [t, s]);
	let f = y.useRef(c), p = y.useRef(!1), m = un(), h = () => {
		f.current = !1, l(!1), a();
	};
	Y(() => {
		f.current = c, p.current && (p.current = !1, !t && c && h());
	});
	let g = J(() => {
		if (f.current) {
			if (t) {
				p.current = !0, m();
				return;
			}
			h();
		}
	});
	return jn({
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
var wa = {
	tabIndex: -1,
	[Zn]: ""
};
function Ta(e) {
	return (t) => t !== "touch" || e.current;
}
function Ea(e, t = !1) {
	let n = mn(), r = ia() != null, i = T(() => e(n, r)).current;
	return Sa({
		popupStore: i,
		treatPopupAsFloatingElement: t,
		floatingRootContext: i.state.floatingRootContext,
		floatingId: n,
		nested: r,
		onOpenChange: i.setOpen
	}), i;
}
function Da({ handle: e, store: t }) {
	return Y(() => e.attachStore(t), [e, t]), null;
}
function Oa(e) {
	let t = e.context.triggerElements.size;
	e.select("open") && e.state.triggerCount !== t && e.set("triggerCount", t);
}
function ka(e, t) {
	let n = y.useRef(null);
	return J((r) => {
		let i = n.current;
		if (i !== null) {
			if (i.element === r && i.store === t && i.id === e) return;
			n.current = null;
			let a = i.store;
			a.context.triggerElements.getById(i.id) === i.element && (a.context.triggerElements.delete(i.id), Oa(a));
		}
		r !== null && e !== void 0 && (n.current = {
			store: t,
			id: e,
			element: r
		}, t.context.triggerElements.add(e, r), Oa(t));
	});
}
function Aa(e, t, n, r = !1) {
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
function ja(e) {
	let t = !1;
	return e.preventUnmountOnClose = () => {
		t = !0;
	}, () => t;
}
function Ma(e, t, n, r) {
	let i = n.useState("isMountedByTrigger", e), a = ka(e, n), o = J((t) => {
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
	}), s = J((e) => {
		a(e), e && o(e);
	});
	return Y(() => (s(t.current), () => s(null)), [
		s,
		t,
		n,
		e
	]), Y(() => {
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
function Na(e, t = {}) {
	let { closeOnActiveTriggerUnmount: n = !1 } = t, r = y.useRef(null), i = e.useState("open");
	Y(() => {
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
				let t = X(Ie);
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
function Pa(e, t, n, r) {
	let { mounted: i, transitionStatus: a, forceUnmount: o } = Ca({
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
	return T(() => (t.set("mounted", i), null)), t.useSyncedValues({
		mounted: i,
		transitionStatus: a
	}), {
		forceUnmount: o,
		transitionStatus: a
	};
}
function Fa(e, t) {
	e.useSyncedValues(t), Y(() => () => {
		e.update({
			activeTriggerProps: R,
			inactiveTriggerProps: R,
			popupProps: R
		});
	}, [e]);
}
function Ia(e, t) {
	Y(() => {
		!t && e.state.openMethod !== null && e.set("openMethod", null);
	}, [t, e]), Y(() => () => {
		e.state.openMethod !== null && e.set("openMethod", null);
	}, [e]);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/utils/popups/popupTriggerMap.mjs
var La = class {
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
}, Ra = /* @__PURE__ */ o(((e) => {
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
})), za = /* @__PURE__ */ o(((e, t) => {
	t.exports = Ra();
})), Ba = /* @__PURE__ */ o(((e) => {
	var t = u(), n = za();
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
})), Va = /* @__PURE__ */ o(((e, t) => {
	t.exports = Ba();
})), Ha = [], Ua = void 0;
function Wa() {
	return Ua;
}
function Ga(e) {
	Ha.push(e);
}
function Ka(e) {
	let t = (t, n) => {
		let r = T(Ja).current, i;
		try {
			Ua = r;
			for (let e of Ha) e.before(r);
			i = e(t, n);
			for (let e of Ha) e.after(r);
			r.didInitialize = !0;
		} finally {
			Ua = void 0;
		}
		return i;
	};
	return t.displayName = e.displayName || e.name, t;
}
function qa(e) {
	return /*#__PURE__*/ y.forwardRef(Ka(e));
}
function Ja() {
	return { didInitialize: !1 };
}
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.5.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/store/useStore.mjs
var Ya = za(), Xa = Va(), Za = N(19) ? eo : to;
function Qa(e, t, n, r, i) {
	return Za(e, t, n, r, i);
}
function $a(e, t, n, r, i) {
	let a = y.useCallback(() => t(e.getSnapshot(), n, r, i), [
		e,
		t,
		n,
		r,
		i
	]);
	return (0, Ya.useSyncExternalStore)(e.subscribe, a, a);
}
Ga({
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
		}), (0, Ya.useSyncExternalStore)(e.subscribe, e.getSnapshot, e.getSnapshot));
	}
});
function eo(e, t, n, r, i) {
	let a = Wa();
	if (!a) return $a(e, t, n, r, i);
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
function to(e, t, n, r, i) {
	return (0, Xa.useSyncExternalStoreWithSelector)(e.subscribe, e.getSnapshot, e.getSnapshot, (e) => t(e, n, r, i));
}
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.5.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/store/Store.mjs
var no = class {
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
		return Qa(this, e, t, n, r);
	}
}, ro = class extends no {
	constructor(e, t = {}, n) {
		super(e), this.context = t, this.selectors = n;
	}
	useSyncedValue(e, t) {
		y.useDebugValue(e);
		let n = this;
		Y(() => {
			n.state[e] !== t && n.set(e, t);
		}, [
			n,
			e,
			t
		]);
	}
	useSyncedValueWithCleanup(e, t) {
		let n = this;
		Y(() => (n.state[e] !== t && n.set(e, t), () => {
			n.set(e, void 0);
		}), [
			n,
			e,
			t
		]);
	}
	useSyncedValues(e) {
		let t = this;
		Y(() => {
			t.update(e);
		}, [t, ...Object.values(e)]);
	}
	useControlledProp(e, t) {
		y.useDebugValue(e);
		let n = this, r = t !== void 0;
		Y(() => {
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
		return y.useDebugValue(e), Qa(this, this.selectors[e], t, n, r);
	}
	useContextCallback(e, t) {
		y.useDebugValue(e);
		let n = J(t ?? I);
		this.context[e] = n;
	}
	useStateSetter(e) {
		let t = y.useRef(void 0);
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
}, io = {
	open: (e) => e.open,
	transitionStatus: (e) => e.transitionStatus,
	domReferenceElement: (e) => e.domReferenceElement,
	referenceElement: (e) => e.positionReference ?? e.referenceElement,
	floatingElement: (e) => e.floatingElement,
	floatingId: (e) => e.floatingId
}, ao = class extends ro {
	constructor(e) {
		let { syncOnly: t, nested: n, onOpenChange: r, triggerElements: i, ...a } = e;
		super({
			...a,
			positionReference: a.referenceElement,
			domReferenceElement: a.referenceElement
		}, {
			onOpenChange: r,
			dataRef: { current: {} },
			events: ea(),
			nested: n,
			triggerElements: i
		}, io), this.syncOnly = t;
	}
	syncOpenEvent = (e, t) => {
		(!e || !this.state.open || t != null && qn(t)) && (this.context.dataRef.current.openEvent = e ? t : void 0);
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
function oo(e, t, n = !1) {
	return {
		open: !1,
		openProp: void 0,
		mounted: !1,
		transitionStatus: void 0,
		floatingRootContext: new ao({
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
		activeTriggerProps: R,
		inactiveTriggerProps: R,
		popupProps: R
	};
}
var so = (e) => e.triggerIdProp ?? e.activeTriggerId, co = (e) => e.openProp ?? e.open, lo = (e) => (e.popupElement?.id ?? e.floatingId) || void 0;
function uo(e, t) {
	return t !== void 0 && co(e) && so(e) === t;
}
function fo(e, t) {
	return uo(e, t) ? !0 : t !== void 0 && co(e) && so(e) == null && !e.openedWithoutTrigger && e.triggerCount === 1;
}
var po = {
	open: co,
	mounted: (e) => e.mounted,
	transitionStatus: (e) => co(e) && !e.mounted ? "starting" : e.transitionStatus,
	floatingRootContext: (e) => e.floatingRootContext,
	triggerCount: (e) => e.triggerCount,
	preventUnmountingOnClose: (e) => e.preventUnmountingOnClose,
	payload: (e) => e.payload,
	activeTriggerId: so,
	activeTriggerElement: (e) => e.mounted ? e.activeTriggerElement : null,
	popupId: lo,
	isTriggerActive: (e, t) => t !== void 0 && so(e) === t,
	isOpenedByTrigger: (e, t) => uo(e, t),
	isMountedByTrigger: (e, t) => t !== void 0 && so(e) === t && e.mounted,
	triggerProps: (e, t) => t ? e.activeTriggerProps : e.inactiveTriggerProps,
	triggerPopupId: (e, t) => fo(e, t) ? lo(e) : void 0,
	popupProps: (e) => e.popupProps,
	popupElement: (e) => e.popupElement,
	positionerElement: (e) => e.positionerElement
};
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/utils/popups/usePopupHandleStore.mjs
function mo(e) {
	let t = y.useCallback((t) => e === void 0 ? I : e.subscribeStore(t), [e]), n = y.useCallback(() => e === void 0 ? void 0 : e.store, [e]);
	return (0, Ya.useSyncExternalStore)(t, n, () => e?.serverStore);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/hooks/useFloatingRootContext.mjs
function ho(e) {
	let { open: t = !1, onOpenChange: n, elements: r = {} } = e, i = mn(), a = ia() != null, o = T(() => new ao({
		open: t,
		transitionStatus: void 0,
		onOpenChange: n,
		referenceElement: r.reference ?? null,
		floatingElement: r.floating ?? null,
		triggerElements: new La(),
		floatingId: i,
		syncOnly: !1,
		nested: a
	})).current;
	return Y(() => {
		let e = {
			open: t,
			floatingId: i
		};
		r.reference !== void 0 && (e.referenceElement = r.reference, e.domReferenceElement = lt(r.reference) ? r.reference : null), r.floating !== void 0 && (e.floatingElement = r.floating), o.update(e);
	}, [
		t,
		i,
		r.reference,
		r.floating,
		o
	]), o.context.onOpenChange = n, o.context.nested = a, o;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/hooks/useFocus.mjs
var go = Zt && $t;
function _o(e, t = {}) {
	let { enabled: n = !0, delay: r } = t, { events: i, dataRef: a } = e.context, o = y.useRef(!1), s = y.useRef(null), c = y.useRef(!0), l = Vn();
	y.useEffect(() => {
		let t = e.select("domReferenceElement");
		if (!n) return;
		let r = ot(t);
		function i() {
			let t = e.select("domReferenceElement");
			!e.select("open") && ut(t) && t === Jn(Lt(t)) && (o.current = !0, s.current = t);
		}
		function a() {
			c.current = !0;
		}
		function l() {
			c.current = !1;
		}
		return vr(_r(r, "blur", i), go && _r(r, "keydown", a, !0), go && _r(r, "pointerdown", l, !0));
	}, [e, n]), y.useEffect(() => {
		if (!n) return;
		function t(t) {
			if (t.reason === "trigger-press" || t.reason === "escape-key") {
				let t = e.select("domReferenceElement");
				lt(t) && (s.current = t, o.current = !0);
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
	let u = y.useMemo(() => {
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
				let a = Xn(n.nativeEvent);
				if (lt(a)) {
					if (go && !n.relatedTarget) {
						if (!c.current && !sr(a)) return;
					} else if (!ur(a)) return;
				}
				let u = ir(n.relatedTarget, e.context.triggerElements), { nativeEvent: d, currentTarget: f } = n;
				if (e.select("open") && u || !r) {
					e.setOpen(!0, X(ze, d, f));
					return;
				}
				l.start(r, () => {
					o.current || e.setOpen(!0, X(ze, d, f));
				});
			},
			onBlur(n) {
				t();
				let r = n.relatedTarget, i = n.nativeEvent, o = lt(r) && r.hasAttribute(ji("focus-guard")) && r.getAttribute("data-type") === "outside";
				l.start(0, () => {
					let t = e.select("domReferenceElement"), n = Jn(Lt(t));
					(r || n !== t) && (Q(a.current.floatingContext?.refs.floating.current, n) || Q(t, n) || o || ir(r ?? n, e.context.triggerElements) || e.setOpen(!1, X(ze, i)));
				});
			}
		};
	}, [
		a,
		r,
		e,
		l
	]);
	return y.useMemo(() => n ? {
		reference: u,
		trigger: u
	} : {}, [n, u]);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/hooks/useHoverInteractionSharedState.mjs
var vo = class e {
	pointerType = void 0;
	interactedInside = !1;
	handler = void 0;
	blockMouseMove = !0;
	performedPointerEventsMutation = !1;
	pointerEventsScopeElement = null;
	pointerEventsReferenceElement = null;
	pointerEventsFloatingElement = null;
	restTimeoutPending = !1;
	openChangeTimeout = new Bn();
	restTimeout = new Bn();
	handleCloseOptions = void 0;
	static create() {
		return new e();
	}
	dispose = () => {
		this.openChangeTimeout.clear(), this.restTimeout.clear();
	};
	disposeEffect = () => this.dispose;
}, yo = /* @__PURE__ */ new WeakMap();
function bo(e) {
	if (!e.performedPointerEventsMutation) return;
	let t = e.pointerEventsScopeElement;
	t && yo.get(t) === e && (e.pointerEventsScopeElement?.style.removeProperty("pointer-events"), e.pointerEventsReferenceElement?.style.removeProperty("pointer-events"), e.pointerEventsFloatingElement?.style.removeProperty("pointer-events"), yo.delete(t)), e.performedPointerEventsMutation = !1, e.pointerEventsScopeElement = null, e.pointerEventsReferenceElement = null, e.pointerEventsFloatingElement = null;
}
function xo(e, t) {
	let { scopeElement: n, referenceElement: r, floatingElement: i } = t, a = yo.get(n);
	a && a !== e && bo(a), bo(e), e.performedPointerEventsMutation = !0, e.pointerEventsScopeElement = n, e.pointerEventsReferenceElement = r, e.pointerEventsFloatingElement = i, yo.set(n, e), n.style.pointerEvents = "none", r.style.pointerEvents = "auto", i.style.pointerEvents = "auto";
}
function So(e) {
	let t = e.context.dataRef.current, n = T(() => t.hoverInteractionState ?? vo.create()).current;
	return t.hoverInteractionState ||= n, yn(t.hoverInteractionState.disposeEffect), t.hoverInteractionState;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/hooks/useHoverFloatingInteraction.mjs
function Co(e, t = {}) {
	let { enabled: n = !0, closeDelay: r = 0, nodeId: i } = t, a = e.useState("open"), o = e.useState("floatingElement"), s = e.useState("domReferenceElement"), { dataRef: c } = e.context, l = aa(), u = ia(), d = So(e), f = Vn(), p = J(() => hr(c.current.openEvent?.type, d.interactedInside)), m = J(() => gr(c.current.openEvent?.type)), h = J(() => {
		bo(d);
	});
	Y(() => {
		a || (d.pointerType = void 0, d.restTimeoutPending = !1, d.interactedInside = !1, h());
	}, [
		a,
		d,
		h
	]), y.useEffect(() => h, [h]), Y(() => {
		if (n && a && d.handleCloseOptions?.blockPointerEvents && m() && lt(s) && o) {
			let e = s, t = o, n = Lt(o), r = l?.nodesRef.current.find((e) => e.id === u)?.context?.elements.floating;
			r && (r.style.pointerEvents = "");
			let i = d.pointerEventsScopeElement === t ? null : d.pointerEventsScopeElement, a = r === t ? null : r, c = d.handleCloseOptions?.getScope?.() ?? i ?? a ?? Yn(e, "[data-rootownerid]") ?? n.body;
			return xo(d, {
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
	]), y.useEffect(() => {
		if (!n) return;
		function t() {
			return !!(l && u && ki(l.nodesRef.current, u).length > 0);
		}
		function a(t) {
			let n = pr(r, "close", d.pointerType), i = () => {
				e.setOpen(!1, X(Re, t)), l?.events.emit("floating.closed", t);
			};
			n ? d.openChangeTimeout.start(n, i) : (d.openChangeTimeout.clear(), i());
		}
		function s(e) {
			let t = Xn(e);
			if (!cr(t)) {
				d.interactedInside = !1;
				return;
			}
			d.interactedInside = Yn(t, "[aria-haspopup]") != null;
		}
		function g() {
			d.openChangeTimeout.clear(), f.clear(), l?.events.off("floating.closed", v), h();
		}
		function _(n) {
			if (t() && l) {
				l.events.on("floating.closed", v);
				return;
			}
			if (ir(n.relatedTarget, e.context.triggerElements)) return;
			let r = c.current.floatingContext?.nodeId ?? i, o = n.relatedTarget;
			if (!(l && r && lt(o) && ki(l.nodesRef.current, r, !1).some((e) => Q(e.context?.elements.floating, o)))) {
				if (d.handler) {
					d.handler(n);
					return;
				}
				h(), m() && !p() && a(n);
			}
		}
		function v(n) {
			l && u && !t() && f.start(0, () => {
				l.events.off("floating.closed", v), e.setOpen(!1, X(Re, n)), l.events.emit("floating.closed", n);
			});
		}
		let y = o;
		return vr(y && _r(y, "mouseenter", g), y && _r(y, "mouseleave", _), y && _r(y, "pointerdown", s, !0), () => {
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
var wo = { current: null };
function To(e, t = {}) {
	let { enabled: n = !0, delay: r = 0, handleClose: i = null, mouseOnly: a = !1, restMs: o = 0, move: s = !0, triggerElementRef: c = wo, externalTree: l, isActiveTrigger: u = !0, getHandleCloseContext: d, isClosing: f, shouldOpen: p, guardStaleOpen: m = !1 } = t, { dataRef: h, events: g } = e.context, _ = aa(l), v = So(e), b = y.useRef(!1), x = yr(i), S = yr(r), C = yr(o), w = yr(n), T = yr(p), E = yr(f), D = J(() => hr(h.current.openEvent?.type, v.interactedInside)), O = J(() => T.current?.() !== !1), k = J((t, n, r) => {
		let i = e.context.triggerElements;
		if (i.hasElement(n)) return !t || !Q(t, n);
		if (!lt(r)) return !1;
		let a = r;
		return i.hasMatchingElement((e) => Q(e, a)) && (!t || !Q(t, a));
	}), A = J(() => {
		v.handler &&= (Lt(e.select("domReferenceElement")).removeEventListener("mousemove", v.handler), void 0);
	}), j = J(() => {
		bo(v);
	});
	return u && (v.handleCloseOptions = i?.__options), y.useEffect(() => A, [A]), y.useEffect(() => {
		if (!n) return;
		function e(e) {
			e.open ? b.current = !1 : (b.current = e.reason === Re, A(), v.openChangeTimeout.clear(), v.restTimeout.clear(), v.blockMouseMove = !0, v.restTimeoutPending = !1);
		}
		return g.on("openchange", e), () => {
			g.off("openchange", e);
		};
	}, [
		n,
		g,
		v,
		A
	]), y.useEffect(() => {
		if (!n) return;
		function t(t, n = !0) {
			let r = pr(S.current, "close", v.pointerType);
			r ? v.openChangeTimeout.start(r, () => {
				e.setOpen(!1, X(Re, t)), _?.events.emit("floating.closed", t);
			}) : n && (v.openChangeTimeout.clear(), e.setOpen(!1, X(Re, t)), _?.events.emit("floating.closed", t));
		}
		let r = c.current ?? (u ? e.select("domReferenceElement") : null);
		if (!lt(r)) return;
		function i(t) {
			if (v.openChangeTimeout.clear(), v.blockMouseMove = !1, a && !Kn(v.pointerType)) return;
			let n = mr(C.current), r = pr(S.current, "open", v.pointerType), i = Xn(t), o = t.currentTarget ?? null, s = e.select("domReferenceElement"), c = o;
			if (lt(i) && !e.context.triggerElements.hasElement(i)) {
				for (let t of e.context.triggerElements.elements()) if (Q(t, i)) {
					c = t;
					break;
				}
			}
			lt(o) && lt(s) && !e.context.triggerElements.hasElement(o) && Q(o, s) && (c = s);
			let l = c != null && k(s, c, i), u = e.select("open"), d = E.current?.() ?? e.select("transitionStatus") === "ending", f = !u && d && b.current, p = !l && lt(c) && lt(s) && Q(s, c) && f, m = n > 0 && !r, h = l && (u || f) || p, g = !u || l;
			if (h) {
				O() && e.setOpen(!0, X(Re, t, c));
				return;
			}
			m || (r ? v.openChangeTimeout.start(r, () => {
				g && O() && e.setOpen(!0, X(Re, t, c));
			}) : g && O() && e.setOpen(!0, X(Re, t, c)));
		}
		function o(n) {
			if (D()) {
				j();
				return;
			}
			A();
			let r = Lt(e.select("domReferenceElement"));
			v.restTimeout.clear(), v.restTimeoutPending = !1;
			let i = h.current.floatingContext ?? d?.();
			if (!ir(n.relatedTarget, e.context.triggerElements)) {
				if (x.current && i) {
					e.select("open") || v.openChangeTimeout.clear();
					let a = c.current;
					v.handler = x.current({
						...i,
						tree: _,
						x: n.clientX,
						y: n.clientY,
						onClose() {
							j(), A(), w.current && !D() && a === e.select("domReferenceElement") && t(n, !0);
						}
					}), r.addEventListener("mousemove", v.handler), v.handler(n);
					return;
				}
				(v.pointerType !== "touch" || !Q(e.select("floatingElement"), n.relatedTarget)) && t(n);
			}
		}
		function l(e) {
			Q(r, e.relatedTarget) || (v.openChangeTimeout.clear(), v.restTimeout.clear(), v.restTimeoutPending = !1);
		}
		let f = m ? _r(r, "mouseout", l) : void 0;
		return s ? vr(_r(r, "mousemove", i, { once: !0 }), _r(r, "mouseenter", i), _r(r, "mouseleave", o), f) : vr(_r(r, "mouseenter", i), _r(r, "mouseleave", o), f);
	}, [
		A,
		j,
		h,
		S,
		e,
		n,
		x,
		v,
		u,
		k,
		D,
		a,
		s,
		C,
		c,
		_,
		w,
		d,
		E,
		O,
		m
	]), y.useMemo(() => {
		if (!n) return;
		function t(e) {
			v.pointerType = e.pointerType;
		}
		return {
			onPointerDown: t,
			onPointerEnter: t,
			onMouseMove(t) {
				let { nativeEvent: n } = t, r = t.currentTarget, i = e.select("domReferenceElement"), o = e.select("open"), s = k(i, r, t.target);
				if (a && !Kn(v.pointerType)) return;
				if (o && s && v.handleCloseOptions?.blockPointerEvents) {
					let t = e.select("floatingElement");
					if (t) {
						let e = v.handleCloseOptions?.getScope?.() ?? r.ownerDocument.body;
						xo(v, {
							scopeElement: e,
							referenceElement: r,
							floatingElement: t
						});
					}
				}
				let c = mr(C.current);
				if (o && !s || c === 0 || !s && v.restTimeoutPending && t.movementX ** 2 + t.movementY ** 2 < 2) return;
				v.restTimeout.clear();
				function l() {
					if (v.restTimeoutPending = !1, D()) return;
					let t = e.select("open");
					!v.blockMouseMove && (!t || s) && O() && e.setOpen(!0, X(Re, n, r));
				}
				v.pointerType === "touch" ? Dn.flushSync(() => {
					l();
				}) : s && o ? l() : (v.restTimeoutPending = !0, v.restTimeout.start(c, l));
			}
		};
	}, [
		n,
		v,
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
function Eo(e) {
	return $t && e.movementX === 0 && e.movementY === 0;
}
function Do(e, t, n) {
	switch (e) {
		case "vertical": return t;
		case "horizontal": return n;
		default: return t || n;
	}
}
function Oo(e, t) {
	return Do(t, e === "ArrowUp" || e === "ArrowDown", e === "ArrowLeft" || e === "ArrowRight");
}
function ko(e, t, n) {
	return Do(t, e === "ArrowDown", n ? e === "ArrowLeft" : e === "ArrowRight") || e === "Enter" || e === " " || e === "";
}
function Ao(e, t, n) {
	return Do(t, n ? e === $n : e === er, e === nr);
}
function $(e, t, n, r) {
	return t === "both" || t === "horizontal" && r ? e === "Escape" : Do(t, n ? e === er : e === $n, e === tr);
}
function jo(e, t) {
	let { listRef: n, activeIndex: r, onNavigate: i = () => {}, enabled: a = !0, selectedIndex: o = null, allowEscape: s = !1, loopFocus: c = !1, nested: l = !1, rtl: u = !1, virtual: d = !1, focusItemOnOpen: f = "auto", focusItemOnHover: p = !0, openOnArrowKeyDown: m = !0, disabledIndices: h = void 0, orientation: g = "vertical", triggerOrientation: _ = g, parentOrientation: v, id: b, resetOnPointerLeave: x = !0, externalTree: S, nestedReturnFocusRef: C, grid: w } = t, T = w != null, E = e.useState("open"), D = e.useState("floatingElement"), O = e.useState("domReferenceElement"), k = e.context.dataRef, A = dr(D), j = lr(O), M = yr(A), N = ia(), P = aa(S), F = y.useRef(f), I = y.useRef(o ?? -1), L = y.useRef(null), R = y.useRef(!0), z = J((e) => {
		i(I.current === -1 ? null : I.current, e);
	}), B = y.useRef(!!D), ee = y.useRef(E), V = y.useRef(!1), H = y.useRef(!1), U = y.useRef(null), W = yr(h), te = yr(E), G = yr(o), ne = yr(x), re = Cn(), ie = Cn(), K = J(() => {
		re.cancel();
		function e(e) {
			d || (U.current = Ni(e, {
				sync: V.current,
				preventScroll: !0
			}));
		}
		let t = n.current[I.current], r = H.current;
		t && e(t), (V.current ? (e) => e() : (e) => re.request(e))(() => {
			let i = n.current[I.current] || t;
			i && (t || e(i), le && (r || !R.current) && i.scrollIntoView?.({
				block: "nearest",
				inline: "nearest"
			}));
		});
	});
	Y(() => {
		k.current.orientation = g;
	}, [k, g]), Y(() => {
		E || (L.current = null), (!E || f !== "auto") && (F.current = f);
	}, [E, f]), Y(() => {
		a && (E && D ? (I.current = o ?? -1, F.current && o != null && (H.current = !0, z())) : B.current && (I.current = -1, z()));
	}, [
		a,
		E,
		D,
		o,
		z
	]), Y(() => {
		if (a) {
			if (!E) {
				V.current = !1;
				return;
			}
			if (D) {
				if (r == null) {
					if (V.current = !1, G.current != null) return;
					if (B.current && (I.current = -1, K()), (!ee.current || !B.current) && F.current && (L.current != null || F.current === !0 && L.current == null)) {
						let e = 0, t = () => {
							n.current[0] == null ? (e < 2 && (e ? (e) => ie.request(e) : queueMicrotask)(t), e += 1) : (I.current = L.current == null || ko(L.current, _, u) || l ? $r(n) : ei(n), L.current = null, z());
						};
						t();
					}
				} else Qr(n.current, r) || (I.current = r, K(), H.current = !1);
			}
		}
	}, [
		a,
		E,
		D,
		r,
		G,
		l,
		n,
		_,
		u,
		z,
		K,
		ie
	]), Y(() => {
		if (!a || D || !P || d || !B.current) return;
		let e = P.nodesRef.current, t = e.find((e) => e.id === N)?.context?.elements.floating, n = Jn(Lt(O ?? t ?? null)), r = e.some((e) => e.context && Q(e.context.elements.floating, n));
		t && !r && R.current && t.focus({ preventScroll: !0 });
	}, [
		a,
		D,
		O,
		P,
		N,
		d
	]), Y(() => {
		ee.current = E, B.current = !!D;
	});
	let ae = r != null, oe = J((e) => {
		if (!te.current) return;
		let t = n.current.indexOf(e.currentTarget);
		t !== -1 && (I.current !== t || r !== t) && (I.current = t, z(e));
	}), se = J(() => v ?? P?.nodesRef.current.find((e) => e.id === N)?.context?.dataRef?.current.orientation), ce = J(() => $r(n, W.current)), q = J((t) => {
		if (R.current = !1, V.current = !0, t.which === 229 || !te.current && t.currentTarget === M.current) return;
		if (l && $(t.key, g, u, T)) {
			Oo(t.key, se()) || Hn(t), e.setOpen(!1, X(Ge, t.nativeEvent));
			let n = C?.current ?? O;
			ut(n) && n.focus();
			return;
		}
		r != null && r !== I.current && !Qr(n.current, r) && (I.current = r);
		let i = I.current, a = $r(n, h), o = ei(n, h);
		if (j || (t.key === "Home" && (Hn(t), I.current = a, z(t)), t.key === "End" && (Hn(t), I.current = o, z(t))), w != null) {
			let e = w(t, I.current, n, g, c, u, h, a, o);
			if (e != null && e !== I.current && (I.current = e, z(t)), g === "both") return;
		}
		if (Oo(t.key, g)) {
			Hn(t);
			let e = Jn(t.currentTarget.ownerDocument);
			if (E && !d && Q(t.currentTarget, e) && !n.current.some((t) => t != null && Q(t, e))) {
				I.current = ko(t.key, g, u) ? a : o, z(t), r === I.current && K();
				return;
			}
			let { index: l, wrapped: f } = ti(n.current, i, {
				decrement: !ko(t.key, g, u),
				loopFocus: c,
				allowEscape: s,
				disabledIndices: h,
				minIndex: a,
				maxIndex: o
			});
			f && (V.current = !1), I.current = l, z(t);
		}
	}), le = y.useMemo(() => ({
		onFocus(e) {
			V.current = !0, oe(e);
		},
		onClick({ currentTarget: e }) {
			d || e.focus({ preventScroll: !0 });
		},
		onMouseMove(e) {
			Eo(e) || (V.current = !0, H.current = !1, p && oe(e));
		},
		onPointerLeave(e) {
			if (!te.current || !R.current || e.pointerType === "touch") return;
			V.current = !0;
			let t = e.relatedTarget;
			if (p && !n.current.includes(t) && ne.current && (U.current?.(), U.current = null, I.current = -1, z(e), !d)) {
				let e = M.current, t = Jn(Lt(e));
				e && Q(e, t) && e.focus({ preventScroll: !0 });
			}
		}
	}), [
		oe,
		te,
		M,
		p,
		n,
		z,
		ne,
		d
	]), ue = y.useMemo(() => d && E && ae && { "aria-activedescendant": `${b}-${r}` }, [
		d,
		E,
		ae,
		b,
		r
	]), de = y.useMemo(() => ({
		...j ? {} : ue,
		onKeyDown(t) {
			if (t.key === "Tab" && t.shiftKey && E && !d) {
				let n = Xn(t.nativeEvent);
				if (n && !Q(M.current, n)) return;
				Hn(t);
				let r = X(Ue, t.nativeEvent);
				e.setOpen(!1, r);
				let i = C?.current ?? O;
				!r.isCanceled && ut(i) && i.focus();
				return;
			}
			q(t);
		},
		onPointerMove(e) {
			Eo(e) || (R.current = !0);
		}
	}), [
		ue,
		q,
		M,
		j,
		e,
		E,
		d,
		O,
		C
	]), fe = y.useMemo(() => {
		function t(t) {
			e.setOpen(!0, X(Ge, t.nativeEvent, t.currentTarget));
		}
		function n(e) {
			f === "auto" && Wn(e.nativeEvent) && (F.current = !d);
		}
		function r(e) {
			F.current = f, f === "auto" && Gn(e.nativeEvent) && (F.current = !0);
		}
		return {
			onKeyDown(n) {
				let r = e.select("open");
				R.current = !1;
				let i = n.key.startsWith("Arrow"), a = Ao(n.key, se(), u), o = Oo(n.key, r ? g : _), s = (l ? a : o) || n.key === "Enter" || n.key.trim() === "";
				if (d && r && (!l || sr(n.currentTarget))) return q(n);
				if (r || m || !i) {
					if (s) {
						let e = Oo(n.key, se());
						L.current = l && e ? null : n.key;
					}
					if (l) {
						a && (Hn(n), r ? (I.current = ce(), z(n), d && M.current?.focus()) : t(n));
						return;
					}
					o && (G.current != null && (I.current = G.current), Hn(n), !r && m ? t(n) : q(n), r && z(n));
				}
			},
			onFocus(t) {
				t.target === t.currentTarget && e.select("open") && !d && (I.current = -1, z(t));
			},
			onPointerDown: r,
			onPointerEnter: r,
			onMouseDown: n,
			onClick: n
		};
	}, [
		q,
		f,
		ce,
		l,
		z,
		e,
		m,
		g,
		_,
		se,
		u,
		G,
		d,
		M
	]), pe = y.useMemo(() => ({
		...ue,
		...fe
	}), [ue, fe]);
	return y.useMemo(() => a ? {
		reference: pe,
		floating: de,
		item: le,
		trigger: fe
	} : {}, [
		a,
		pe,
		de,
		fe,
		le
	]);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/hooks/useTypeahead.mjs
function Mo(e, t) {
	let { listRef: n, elementsRef: r, activeIndex: i, onMatch: a, disabledIndices: o, onTyping: s, enabled: c = !0, resetMs: l = 750, selectedIndex: u = null } = t, d = J(s), f = e.useState("open"), p = Vn(), m = y.useRef(""), h = y.useRef(u ?? i ?? -1), g = y.useRef(null), _ = J((e) => {
		function t(e) {
			return r?.current[e];
		}
		function s(e) {
			let n = t(e);
			return n && !ai(n) || n?.matches(":disabled") ? !1 : o == null || !ri(L, e, o);
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
		if (m.current.length > 0 && e.key === " " && (Hn(e), d?.(!0)), m.current.length > 0 && m.current[0] !== " " && c(_, m.current) === -1 && e.key !== " " && d?.(!1), _ == null || e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return;
		f && e.key !== " " && (Hn(e), d?.(!0));
		let v = m.current === "";
		v && (h.current = u ?? i ?? -1), _.every((e, t) => e && s(t) ? e[0]?.toLowerCase() !== e[1]?.toLowerCase() : !0) && m.current === e.key && (m.current = "", h.current = g.current), m.current += e.key, p.start(l, () => {
			m.current = "", h.current = g.current, d?.(!1);
		});
		let y = ((v ? u ?? i ?? -1 : h.current) ?? 0) + 1, b = c(_, m.current, y);
		b === -1 ? e.key !== " " && (m.current = "", d?.(!1)) : (a?.(b, e), g.current = b);
	}), v = J((t) => {
		let n = t.relatedTarget, r = e.select("domReferenceElement"), i = e.select("floatingElement");
		Q(r, n) || Q(i, n) || (p.clear(), m.current = "", h.current = g.current, d?.(!1));
	});
	Y(() => {
		(f || u === null) && (p.clear(), g.current = null, m.current !== "" && (m.current = "", d?.(!1)));
	}, [
		f,
		u,
		p,
		d
	]);
	let b = y.useMemo(() => ({
		onKeyDown: _,
		onBlur: v
	}), [_, v]);
	return y.useMemo(() => c ? {
		reference: b,
		floating: b
	} : {}, [c, b]);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/safePolygon.mjs
var No = .1, Po = No * No, Fo = .5;
function Io(e, t, n, r, i, a) {
	return r >= t != a >= t && e <= (i - n) * (t - r) / (a - r) + n;
}
function Lo(e, t, n, r, i, a, o, s, c, l) {
	let u = !1;
	return Io(e, t, n, r, i, a) && (u = !u), Io(e, t, i, a, o, s) && (u = !u), Io(e, t, o, s, c, l) && (u = !u), Io(e, t, c, l, n, r) && (u = !u), u;
}
function Ro(e, t, n) {
	return e >= n.x && e <= n.x + n.width && t >= n.y && t <= n.y + n.height;
}
function zo(e, t, n, r, i, a) {
	return e >= Math.min(n, i) && e <= Math.max(n, i) && t >= Math.min(r, a) && t <= Math.max(r, a);
}
function Bo(e = {}) {
	let { blockPointerEvents: t = !1 } = e, n = new Bn(), r = ({ x: e, y: t, placement: r, elements: i, onClose: a, nodeId: o, tree: s }) => {
		let c = r?.split("-")[0], l = !1, u = null, d = null, f = typeof performance < "u" ? performance.now() : 0;
		function p(e, t) {
			let n = performance.now(), r = n - f;
			if (u === null || d === null || r === 0) return u = e, d = t, f = n, !1;
			let i = e - u, a = t - d, o = i * i + a * a, s = r * r * Po;
			return u = e, d = t, f = n, o < s;
		}
		function m() {
			n.clear(), a();
		}
		return function(r) {
			n.clear();
			let a = i.domReference, u = i.floating;
			if (!a || !u || c == null || e == null || t == null) return;
			let { clientX: d, clientY: f } = r, h = Xn(r), g = r.type === "mouseleave", _ = Q(u, h), v = Q(a, h);
			if (_ && (l = !0, !g)) return;
			if (v && (l = !1, !g)) {
				l = !0;
				return;
			}
			if (g && lt(r.relatedTarget) && Q(u, r.relatedTarget)) return;
			function y() {
				return !!(s && ki(s.nodesRef.current, o).length > 0);
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
					j = zo(d, f, D, x.top + 1, O, S.bottom - 1);
					break;
				case "bottom":
					j = zo(d, f, D, S.top + 1, O, x.bottom - 1);
					break;
				case "left":
					j = zo(d, f, S.right - 1, A, x.left + 1, k);
					break;
				case "right": j = zo(d, f, x.right - 1, A, S.left + 1, k);
			}
			if (j) return;
			if (l && !Ro(d, f, x)) {
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
					let n = T ? Fo / 2 : Fo * 4, r = T || C ? e + n : e - n, i = T ? e - n : C ? e + n : e - n, a = t + Fo + 1, o = C || T ? S.bottom - Fo : S.top, s = C ? T ? S.bottom - Fo : S.top : S.bottom - Fo;
					M = Lo(d, f, r, a, i, a, S.left, o, S.right, s);
					break;
				}
				case "bottom": {
					let n = T ? Fo / 2 : Fo * 4, r = T || C ? e + n : e - n, i = T ? e - n : C ? e + n : e - n, a = t - Fo, o = C || T ? S.top + Fo : S.bottom, s = C ? T ? S.top + Fo : S.bottom : S.top + Fo;
					M = Lo(d, f, r, a, i, a, S.left, o, S.right, s);
					break;
				}
				case "left": {
					let n = E ? Fo / 2 : Fo * 4, r = E || w ? t + n : t - n, i = E ? t - n : w ? t + n : t - n, a = e + Fo + 1, o = w || E ? S.right - Fo : S.left, s = w ? E ? S.right - Fo : S.left : S.right - Fo;
					M = Lo(d, f, o, S.top, s, S.bottom, a, r, a, i);
					break;
				}
				case "right": {
					let n = E ? Fo / 2 : Fo * 4, r = E || w ? t + n : t - n, i = E ? t - n : w ? t + n : t - n, a = e - Fo, o = w || E ? S.left + Fo : S.right, s = w ? E ? S.left + Fo : S.right : S.left + Fo;
					M = Lo(d, f, a, r, a, i, o, S.top, s, S.bottom);
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
function Vo(e, t, n) {
	let { reference: r, floating: i } = e, a = Lr(t), o = Rr(t), s = Ir(o), c = Nr(t), l = a === "y", u = r.x + r.width / 2 - i.width / 2, d = r.y + r.height / 2 - i.height / 2, f = r[s] / 2 - i[s] / 2, p;
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
	let m = Pr(t);
	return m && (p[o] += f * (m === "end" ? 1 : -1) * (n && l ? -1 : 1)), p;
}
async function Ho(e, t) {
	t === void 0 && (t = {});
	let { x: n, y: r, platform: i, rects: a, elements: o, strategy: s } = e, { boundary: c = "clippingAncestors", rootBoundary: l = "viewport", elementContext: u = "floating", altBoundary: d = !1, padding: f = 0 } = Mr(t, e), p = Xr(f), m = o[d ? u === "floating" ? "reference" : "floating" : u], h = Zr(await i.getClippingRect({
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
	}, y = Zr(i.convertOffsetParentRelativeRectToViewportRelativeRect ? await i.convertOffsetParentRelativeRectToViewportRelativeRect({
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
var Uo = 50, Wo = async (e, t, n) => {
	let { placement: r = "bottom", strategy: i = "absolute", middleware: a = [], platform: o } = n, s = o.detectOverflow ? o : {
		...o,
		detectOverflow: Ho
	}, c = await (o.isRTL == null ? void 0 : o.isRTL(t)), l = await o.getElementRects({
		reference: e,
		floating: t,
		strategy: i
	}), { x: u, y: d } = Vo(l, r, c), f = r, p = 0, m = {};
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
		}, x && p < Uo && (p++, typeof x == "object" && (x.placement && (f = x.placement), x.rects && (l = x.rects === !0 ? await o.getElementRects({
			reference: e,
			floating: t,
			strategy: i
		}) : x.rects), {x: u, y: d} = Vo(l, f, c)), n = -1);
	}
	return {
		x: u,
		y: d,
		placement: f,
		strategy: i,
		middlewareData: m
	};
}, Go = function(e) {
	return e === void 0 && (e = {}), {
		name: "flip",
		options: e,
		async fn(t) {
			var n;
			let { placement: r, middlewareData: i, rects: a, initialPlacement: o, platform: s, elements: c } = t, { mainAxis: l = !0, crossAxis: u = !0, fallbackPlacements: d, fallbackStrategy: f = "bestFit", fallbackAxisSideDirection: p = "none", flipAlignment: m = !0, ...h } = Mr(e, t);
			if ((n = i.arrow) != null && n.alignmentOffset) return {};
			let g = Nr(r), _ = Lr(o), v = Nr(o) === o, y = await (s.isRTL == null ? void 0 : s.isRTL(c.floating)), b = d || (v || !m ? [Jr(o)] : Br(o)), x = p !== "none";
			!d && x && b.push(...qr(o, m, p, y));
			let S = [o, ...b], C = await s.detectOverflow(t, h), w = [], T = i.flip?.overflows || [];
			if (l && w.push(C[g]), u) {
				let e = zr(r, a, y);
				w.push(C[e[0]], C[e[1]]);
			}
			if (T = [...T, {
				placement: r,
				overflows: w
			}], !w.every((e) => e <= 0)) {
				let e = (i.flip?.index || 0) + 1, t = S[e];
				if (t && (u !== "alignment" || _ === Lr(t) || T.every((e) => Lr(e.placement) !== _ || e.overflows[0] > 0))) return {
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
								let t = Lr(e.placement);
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
}, Ko = /*#__PURE__*/ new Set(["left", "top"]);
async function qo(e, t) {
	let { placement: n, platform: r, elements: i } = e, a = await (r.isRTL == null ? void 0 : r.isRTL(i.floating)), o = Nr(n), s = Pr(n), c = Lr(n) === "y", l = Ko.has(o) ? -1 : 1, u = a && c ? -1 : 1, d = Mr(t, e), { mainAxis: f, crossAxis: p, alignmentAxis: m } = typeof d == "number" ? {
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
var Jo = function(e) {
	return e === void 0 && (e = 0), {
		name: "offset",
		options: e,
		async fn(t) {
			var n;
			let { x: r, y: i, placement: a, middlewareData: o } = t, s = await qo(t, e);
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
}, Yo = function(e) {
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
			} }, ...l } = Mr(e, t), u = {
				x: n,
				y: r
			}, d = await a.detectOverflow(t, l), f = Lr(i), p = Fr(f), m = u[p], h = u[f], g = (e, t) => jr(t + d[e === "y" ? "top" : "left"], t, t - d[e === "y" ? "bottom" : "right"]);
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
}, Xo = function(e) {
	return e === void 0 && (e = {}), {
		options: e,
		fn(t) {
			let { x: n, y: r, placement: i, rects: a, middlewareData: o } = t, { offset: s = 0, mainAxis: c = !0, crossAxis: l = !0 } = Mr(e, t), u = {
				x: n,
				y: r
			}, d = Lr(i), f = Fr(d), p = u[f], m = u[d], h = Mr(s, t), g = typeof h == "number" ? {
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
				let e = f === "y" ? "width" : "height", t = Ko.has(Nr(i)), n = a.reference[d] - a.floating[e] + (t && o.offset?.[d] || 0) + (t ? 0 : g.crossAxis), r = a.reference[d] + a.reference[e] + (t ? 0 : o.offset?.[d] || 0) - (t ? g.crossAxis : 0);
				m < n ? m = n : m > r && (m = r);
			}
			return {
				[f]: p,
				[d]: m
			};
		}
	};
}, Zo = function(e) {
	return e === void 0 && (e = {}), {
		name: "size",
		options: e,
		async fn(t) {
			let { placement: n, rects: r, platform: i, elements: a } = t, { apply: o = () => {}, ...s } = Mr(e, t), c = await i.detectOverflow(t, s), l = Nr(n), u = Pr(n), d = Lr(n) === "y", { width: f, height: p } = r.floating, m, h;
			l === "top" || l === "bottom" ? (m = l, h = u === (await (i.isRTL == null ? void 0 : i.isRTL(a.floating)) ? "start" : "end") ? "left" : "right") : (h = l, m = u === "end" ? "top" : "bottom");
			let g = p - c.top - c.bottom, _ = f - c.left - c.right, v = Tr(p - c[m], g), y = Tr(f - c[h], _), b = t.middlewareData.shift, x = !b, S = v, C = y;
			b != null && b.enabled.x && (C = _), b != null && b.enabled.y && (S = g), x && !u && (d ? C = f - 2 * Er(c.left, c.right) : S = p - 2 * Er(c.top, c.bottom)), await o({
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
function Qo(e) {
	let t = Ct(e), n = parseFloat(t.width) || 0, r = parseFloat(t.height) || 0, i = ut(e), a = i ? e.offsetWidth : n, o = i ? e.offsetHeight : r, s = Dr(n) !== a || Dr(r) !== o;
	return s && (n = a, r = o), {
		width: n,
		height: r,
		$: s
	};
}
function $o(e) {
	return lt(e) ? e : e.contextElement;
}
function es(e) {
	let t = $o(e);
	if (!ut(t)) return kr(1);
	let n = t.getBoundingClientRect(), { width: r, height: i, $: a } = Qo(t), o = (a ? Dr(n.width) : n.width) / r, s = (a ? Dr(n.height) : n.height) / i;
	return (!o || !Number.isFinite(o)) && (o = 1), (!s || !Number.isFinite(s)) && (s = 1), {
		x: o,
		y: s
	};
}
var ts = /*#__PURE__*/ kr(0);
function ns(e) {
	let t = ot(e);
	return !xt() || !t.visualViewport ? ts : {
		x: t.visualViewport.offsetLeft,
		y: t.visualViewport.offsetTop
	};
}
function rs(e, t, n) {
	return t === void 0 && (t = !1), !!n && t && n === ot(e);
}
function is(e, t, n, r) {
	t === void 0 && (t = !1), n === void 0 && (n = !1);
	let i = e.getBoundingClientRect(), a = $o(e), o = kr(1);
	t && (r ? lt(r) && (o = es(r)) : o = es(e));
	let s = rs(a, n, r) ? ns(a) : kr(0), c = (i.left + s.x) / o.x, l = (i.top + s.y) / o.y, u = i.width / o.x, d = i.height / o.y;
	if (a && r) {
		let e = ot(a), t = lt(r) ? ot(r) : r, n = e, i = Ot(n);
		for (; i && t !== n;) {
			let e = es(i), t = i.getBoundingClientRect(), r = Ct(i), a = t.left + (i.clientLeft + parseFloat(r.paddingLeft)) * e.x, o = t.top + (i.clientTop + parseFloat(r.paddingTop)) * e.y;
			c *= e.x, l *= e.y, u *= e.x, d *= e.y, c += a, l += o, n = ot(i), i = Ot(n);
		}
	}
	return Zr({
		width: u,
		height: d,
		x: c,
		y: l
	});
}
function as(e, t) {
	let n = wt(e).scrollLeft;
	return t ? t.left + n : is(st(e)).left + n;
}
function os(e, t) {
	let n = e.getBoundingClientRect();
	return {
		x: n.left + t.scrollLeft - as(e, n),
		y: n.top + t.scrollTop
	};
}
function ss(e) {
	let { elements: t, rect: n, offsetParent: r, strategy: i } = e, a = i === "fixed", o = st(r), s = t ? mt(t.floating) : !1;
	if (r === o || s && a) return n;
	let c = {
		scrollLeft: 0,
		scrollTop: 0
	}, l = kr(1), u = kr(0), d = ut(r);
	if ((d || !a) && ((at(r) !== "body" || ft(o)) && (c = wt(r)), d)) {
		let e = is(r);
		l = es(r), u.x = e.x + r.clientLeft, u.y = e.y + r.clientTop;
	}
	let f = o && !d && !a ? os(o, c) : kr(0);
	return {
		width: n.width * l.x,
		height: n.height * l.y,
		x: n.x * l.x - c.scrollLeft * l.x + u.x + f.x,
		y: n.y * l.y - c.scrollTop * l.y + u.y + f.y
	};
}
function cs(e) {
	return e.getClientRects ? Array.from(e.getClientRects()) : [];
}
function ls(e) {
	let t = wt(e), n = e.ownerDocument.body, r = Er(e.scrollWidth, e.clientWidth, n.scrollWidth, n.clientWidth), i = Er(e.scrollHeight, e.clientHeight, n.scrollHeight, n.clientHeight), a = -t.scrollLeft + as(e), o = -t.scrollTop;
	return Ct(n).direction === "rtl" && (a += Er(e.clientWidth, n.clientWidth) - r), {
		width: r,
		height: i,
		x: a,
		y: o
	};
}
var us = 25;
function ds(e, t, n) {
	n === void 0 && (n = "viewport");
	let r = n === "layoutViewport", i = ot(e), a = st(e), o = i.visualViewport, s = a.clientWidth, c = a.clientHeight, l = 0, u = 0;
	if (o) {
		let e = !xt() || t === "fixed";
		r ? e || (l = -o.offsetLeft, u = -o.offsetTop) : (s = o.width, c = o.height, e && (l = o.offsetLeft, u = o.offsetTop));
	}
	if (as(a) <= 0) {
		let e = a.ownerDocument, t = e.body, n = getComputedStyle(t), r = e.compatMode === "CSS1Compat" && parseFloat(n.marginLeft) + parseFloat(n.marginRight) || 0, i = Math.abs(a.clientWidth - t.clientWidth - r), o = getComputedStyle(a).scrollbarGutter === "stable both-edges" ? i / 2 : i;
		o <= us && (s -= o);
	}
	return {
		width: s,
		height: c,
		x: l,
		y: u
	};
}
function fs(e, t) {
	let n = is(e, !0, t === "fixed"), r = n.top + e.clientTop, i = n.left + e.clientLeft, a = es(e);
	return {
		width: e.clientWidth * a.x,
		height: e.clientHeight * a.y,
		x: i * a.x,
		y: r * a.y
	};
}
function ps(e, t, n) {
	let r;
	if (t === "viewport" || t === "layoutViewport") r = ds(e, n, t);
	else if (t === "document") r = ls(st(e));
	else if (lt(t)) r = fs(t, n);
	else {
		let n = ns(e);
		r = {
			x: t.x - n.x,
			y: t.y - n.y,
			width: t.width,
			height: t.height
		};
	}
	return Zr(r);
}
function ms(e, t) {
	let n = t.get(e);
	if (n) return n;
	let r = Dt(e, [], !1).filter((e) => lt(e) && at(e) !== "body"), i = null, a = Ct(e).position === "fixed", o = a ? Tt(e) : e;
	for (; lt(o) && !St(o);) {
		let e = Ct(o), t = yt(o), n = i ? i.position : a ? "fixed" : "";
		!t && (n === "fixed" || n === "absolute" && e.position === "static") ? r = r.filter((e) => e !== o) : i = e, o = Tt(o);
	}
	return t.set(e, r), r;
}
function hs(e) {
	let { element: t, boundary: n, rootBoundary: r, strategy: i } = e, a = [...n === "clippingAncestors" ? mt(t) ? [] : ms(t, this._c) : [].concat(n), r], o = ps(t, a[0], i), s = o.top, c = o.right, l = o.bottom, u = o.left;
	for (let e = 1; e < a.length; e++) {
		let n = ps(t, a[e], i);
		s = Er(n.top, s), c = Tr(n.right, c), l = Tr(n.bottom, l), u = Er(n.left, u);
	}
	return {
		width: c - u,
		height: l - s,
		x: u,
		y: s
	};
}
function gs(e) {
	let { width: t, height: n } = Qo(e);
	return {
		width: t,
		height: n
	};
}
function _s(e, t, n) {
	let r = ut(t), i = st(t), a = n === "fixed", o = is(e, !0, a, t), s = {
		scrollLeft: 0,
		scrollTop: 0
	}, c = kr(0);
	if ((r || !a) && ((at(t) !== "body" || ft(i)) && (s = wt(t)), r)) {
		let e = is(t, !0, a, t);
		c.x = e.x + t.clientLeft, c.y = e.y + t.clientTop;
	}
	!r && i && (c.x = as(i));
	let l = i && !r && !a ? os(i, s) : kr(0);
	return {
		x: o.left + s.scrollLeft - c.x - l.x,
		y: o.top + s.scrollTop - c.y - l.y,
		width: o.width,
		height: o.height
	};
}
function vs(e) {
	return Ct(e).position === "static";
}
function ys(e, t) {
	if (!ut(e) || Ct(e).position === "fixed") return null;
	if (t) return t(e);
	let n = e.offsetParent;
	return st(e) === n && (n = n.ownerDocument.body), n;
}
function bs(e, t) {
	let n = ot(e);
	if (mt(e)) return n;
	if (!ut(e)) {
		let t = Tt(e);
		for (; t && !St(t);) {
			if (lt(t) && !vs(t)) return t;
			t = Tt(t);
		}
		return n;
	}
	let r = ys(e, t);
	for (; r && pt(r) && vs(r);) r = ys(r, t);
	return r && St(r) && vs(r) && !yt(r) ? n : r || bt(e) || n;
}
var xs = async function(e) {
	let t = this.getOffsetParent || bs, n = this.getDimensions, r = await n(e.floating);
	return {
		reference: _s(e.reference, await t(e.floating), e.strategy),
		floating: {
			x: 0,
			y: 0,
			width: r.width,
			height: r.height
		}
	};
};
function Ss(e) {
	return Ct(e).direction === "rtl";
}
var Cs = {
	convertOffsetParentRelativeRectToViewportRelativeRect: ss,
	getDocumentElement: st,
	getClippingRect: hs,
	getOffsetParent: bs,
	getElementRects: xs,
	getClientRects: cs,
	getDimensions: gs,
	getScale: es,
	isElement: lt,
	isRTL: Ss
};
function ws(e, t) {
	return e.x === t.x && e.y === t.y && e.width === t.width && e.height === t.height;
}
function Ts(e, t, n) {
	let r = null, i, a = st(e);
	function o() {
		var e;
		clearTimeout(i), (e = r) == null || e.disconnect(), r = null;
	}
	function s(n, c) {
		n === void 0 && (n = !1), c === void 0 && (c = 1), o();
		let l = e.getBoundingClientRect(), { left: u, top: d, width: f, height: p } = l;
		if (n || t(), !f || !p) return;
		let m = Or(d), h = Or(a.clientWidth - (u + f)), g = Or(a.clientHeight - (d + p)), _ = Or(u), v = {
			rootMargin: -m + "px " + -h + "px " + -g + "px " + -_ + "px",
			threshold: Er(0, Tr(1, c)) || 1
		}, y = !0;
		function b(t) {
			let n = t[0].intersectionRatio;
			if (!ws(l, e.getBoundingClientRect())) return s();
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
	let c = ot(e), l = () => s(n);
	return c.addEventListener("resize", l), s(!0), () => {
		c.removeEventListener("resize", l), o();
	};
}
function Es(e, t, n, r) {
	r === void 0 && (r = {});
	let { ancestorScroll: i = !0, ancestorResize: a = !0, elementResize: o = typeof ResizeObserver == "function", layoutShift: s = typeof IntersectionObserver == "function", animationFrame: c = !1 } = r, l = $o(e), u = i || a ? [...l ? Dt(l) : [], ...t ? Dt(t) : []] : [];
	u.forEach((e) => {
		i && e.addEventListener("scroll", n), a && e.addEventListener("resize", n);
	});
	let d = l && s ? Ts(l, n, a) : null, f = -1, p = null;
	o && (p = new ResizeObserver((e) => {
		let [r] = e;
		r && r.target === l && p && t && (p.unobserve(t), cancelAnimationFrame(f), f = requestAnimationFrame(() => {
			var e;
			(e = p) == null || e.observe(t);
		})), n();
	}), l && !c && p.observe(l), t && p.observe(t));
	let m, h = c ? is(e) : null;
	c && g();
	function g() {
		let t = is(e);
		h && !ws(h, t) && n(), h = t, m = requestAnimationFrame(g);
	}
	return n(), () => {
		var e;
		u.forEach((e) => {
			i && e.removeEventListener("scroll", n), a && e.removeEventListener("resize", n);
		}), d?.(), (e = p) == null || e.disconnect(), p = null, c && cancelAnimationFrame(m);
	};
}
var Ds = Jo, Os = Yo, ks = Go, As = Zo, js = Xo, Ms = (e, t, n) => {
	let r = /* @__PURE__ */ new Map(), i = n ?? {}, a = {
		...Cs,
		...i.platform,
		_c: r
	};
	return Wo(e, t, {
		...i,
		platform: a
	});
}, Ns = typeof document < "u" ? y.useLayoutEffect : function() {};
function Ps(e, t) {
	if (e === t) return !0;
	if (typeof e != typeof t) return !1;
	if (typeof e == "function" && e.toString() === t.toString()) return !0;
	let n, r, i;
	if (e && t && typeof e == "object") {
		if (Array.isArray(e)) {
			if (n = e.length, n !== t.length) return !1;
			for (r = n; r-- !== 0;) if (!Ps(e[r], t[r])) return !1;
			return !0;
		}
		if (i = Object.keys(e), n = i.length, n !== Object.keys(t).length) return !1;
		for (r = n; r-- !== 0;) if (!{}.hasOwnProperty.call(t, i[r])) return !1;
		for (r = n; r-- !== 0;) {
			let n = i[r];
			if (!(n === "_owner" && e.$$typeof) && !Ps(e[n], t[n])) return !1;
		}
		return !0;
	}
	return e !== e && t !== t;
}
function Fs(e) {
	return typeof window > "u" ? 1 : (e.ownerDocument.defaultView || window).devicePixelRatio || 1;
}
function Is(e, t) {
	let n = Fs(e);
	return Math.round(t * n) / n;
}
function Ls(e) {
	let t = y.useRef(e);
	return Ns(() => {
		t.current = e;
	}), t;
}
function Rs(e) {
	e === void 0 && (e = {});
	let { placement: t = "bottom", strategy: n = "absolute", middleware: r = [], platform: i, elements: { reference: a, floating: o } = {}, transform: s = !0, whileElementsMounted: c, open: l } = e, [u, d] = y.useState({
		x: 0,
		y: 0,
		strategy: n,
		placement: t,
		middlewareData: {},
		isPositioned: !1
	}), [f, p] = y.useState(r);
	Ps(f, r) || p(r);
	let [m, h] = y.useState(null), [g, _] = y.useState(null), v = y.useCallback((e) => {
		e !== C.current && (C.current = e, h(e));
	}, []), b = y.useCallback((e) => {
		e !== w.current && (w.current = e, _(e));
	}, []), x = a || m, S = o || g, C = y.useRef(null), w = y.useRef(null), T = y.useRef(u), E = c != null, D = Ls(c), O = Ls(i), k = Ls(l), A = y.useCallback(() => {
		if (!C.current || !w.current) return;
		let e = {
			placement: t,
			strategy: n,
			middleware: f
		};
		O.current && (e.platform = O.current), Ms(C.current, w.current, e).then((e) => {
			let t = {
				...e,
				isPositioned: k.current !== !1
			};
			j.current && !Ps(T.current, t) && (T.current = t, Dn.flushSync(() => {
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
	Ns(() => {
		l === !1 && T.current.isPositioned && (T.current.isPositioned = !1, d((e) => ({
			...e,
			isPositioned: !1
		})));
	}, [l]);
	let j = y.useRef(!1);
	Ns(() => (j.current = !0, () => {
		j.current = !1;
	}), []), Ns(() => {
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
	let M = y.useMemo(() => ({
		reference: C,
		floating: w,
		setReference: v,
		setFloating: b
	}), [v, b]), N = y.useMemo(() => ({
		reference: x,
		floating: S
	}), [x, S]), P = y.useMemo(() => {
		let e = {
			position: n,
			left: 0,
			top: 0
		};
		if (!N.floating) return e;
		let t = Is(N.floating, u.x), r = Is(N.floating, u.y);
		return s ? {
			...e,
			transform: "translate(" + t + "px, " + r + "px)",
			...Fs(N.floating) >= 1.5 && { willChange: "transform" }
		} : {
			position: n,
			left: t,
			top: r
		};
	}, [
		n,
		s,
		N.floating,
		u.x,
		u.y
	]);
	return y.useMemo(() => ({
		...u,
		update: A,
		refs: M,
		elements: N,
		floatingStyles: P
	}), [
		u,
		A,
		M,
		N,
		P
	]);
}
var zs = (e, t) => {
	let n = Ds(e);
	return {
		name: n.name,
		fn: n.fn,
		options: [e, t]
	};
}, Bs = (e, t) => {
	let n = Os(e);
	return {
		name: n.name,
		fn: n.fn,
		options: [e, t]
	};
}, Vs = (e, t) => ({
	fn: js(e).fn,
	options: [e, t]
}), Hs = (e, t) => {
	let n = ks(e);
	return {
		name: n.name,
		fn: n.fn,
		options: [e, t]
	};
}, Us = (e, t) => {
	let n = As(e);
	return {
		name: n.name,
		fn: n.fn,
		options: [e, t]
	};
}, Ws = /*#__PURE__*/ y.createContext(void 0);
function Gs(e) {
	let t = y.useContext(Ws);
	if (t === void 0 && !e) throw Error(v(69));
	return t;
}
var Ks = /* @__PURE__ */ new Set([
	"ArrowUp",
	"ArrowDown",
	"ArrowLeft",
	"ArrowRight",
	"Home",
	"End"
]);
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/getDisabledMountTransitionStyles.mjs
function qs(e) {
	return e === "starting" ? Gi : R;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/menu/submenu-root/MenuSubmenuRootContext.mjs
var Js = /*#__PURE__*/ y.createContext(void 0);
function Ys() {
	return y.useContext(Js);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/resolveRenderedId.mjs
function Xs(e, t) {
	let n = fe(e.render);
	if (/*#__PURE__*/ y.isValidElement(n)) {
		let e = n.props;
		if (Object.hasOwn(e, "id")) return e.id ?? "";
	}
	return e.id ?? t;
}
function Zs(e, t, n) {
	let r = Xs(e, t), i = r === t ? void 0 : r;
	return [r, y.useCallback((e) => n?.(e ? i : void 0), [i, n])];
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/resolvePopupLabel.mjs
function Qs(e, t, n) {
	let r = fe(e.render), i = /*#__PURE__*/ y.isValidElement(r) ? r.props : void 0, a = e["aria-label"] ?? i?.["aria-label"], o = e["aria-labelledby"] ?? i?.["aria-labelledby"];
	return o == null && !a && (o = t ? t.id || void 0 : n || void 0), o;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/menu/popup/MenuPopup.mjs
var $s = /*#__PURE__*/ y.forwardRef(function(e, t) {
	let { render: n, className: r, style: i, finalFocus: a, id: o, initialFocus: s, ...c } = e, { store: l, defaultFloatingId: u, setRenderedFloatingId: d, virtualFocus: f, orientation: p } = C(), m = Ys(), { side: h, align: g } = x(), _ = Gs(!0) != null, v = l.useState("open"), b = l.useState("transitionStatus"), S = l.useState("popupProps"), w = l.useState("mounted"), T = l.useState("instantType"), E = l.useState("activeTriggerElement"), D = l.useState("parent"), O = l.useState("lastOpenChangeReason"), k = l.useState("rootId"), A = l.useState("floatingRootContext"), j = l.useState("floatingTreeRoot"), M = l.useState("closeDelay"), N = l.useState("hoverEnabled"), P = l.useState("disabled"), F = l.useState("openMethod"), I = l.useState("activeTriggerId"), L = l.useState("listElement"), [R, z] = Zs(e, u, d), B = Qs(e, E, I), ee = D.type === "menu" ? m : void 0, V = D.type === "context-menu", H = s ?? D.type !== "menu";
	s === void 0 && L && D.type !== "menu" && (H = () => l.state.activeIndex === null && L), jn({
		open: v,
		ref: l.context.popupRef,
		onComplete() {
			v && l.context.onOpenChangeComplete?.(!0);
		}
	}), y.useEffect(() => {
		function e(e) {
			l.setOpen(!1, X(e.reason, e.domEvent));
		}
		return j.events.on("close", e), () => {
			j.events.off("close", e);
		};
	}, [j.events, l]), Co(A, {
		enabled: N && !P && !V && D.type !== "menubar",
		closeDelay: M
	});
	let U = l.useStateSetter("popupElement"), { parentVirtualFocusRef: W, handleFocus: te } = (y.useContext($e)?.useParentHandoff ?? tc)(l, D, v, f), G = q("div", e, {
		state: {
			transitionStatus: b,
			side: h,
			align: g,
			open: v,
			nested: D.type === "menu",
			instant: T
		},
		ref: [
			t,
			l.context.popupRef,
			U,
			z
		],
		stateAttributesMapping: Ne,
		props: [
			S,
			{
				id: R,
				...L ? { role: "presentation" } : {
					role: "menu",
					"aria-orientation": p === "horizontal" ? "horizontal" : void 0,
					"aria-labelledby": B
				},
				onKeyDown(e) {
					ee?.onPopupKeyDown?.(e), _ && Ks.has(e.key) && e.stopPropagation();
				},
				onFocus: te
			},
			qs(b),
			c,
			{ "data-rootownerid": k }
		]
	}), ne = D.type === void 0 || V;
	(E || D.type === "menubar" && O !== "outside-press") && (ne = !0);
	let re = ee?.getReturnElement ?? W;
	return /*#__PURE__*/ (0, Z.jsx)(_a, {
		context: A,
		openInteractionType: F,
		modal: V,
		disabled: !w,
		returnFocus: a ?? re ?? ne,
		explicitReturnFocus: a === void 0 && re ? !1 : void 0,
		initialFocus: H,
		restoreFocus: !0,
		getInsideElements: D.type === void 0 ? () => [l.context.beforeTriggerFocusGuardRef.current] : void 0,
		externalTree: D.type === "menubar" ? void 0 : j,
		previousFocusableElement: E,
		nextFocusableElement: D.type === void 0 ? l.context.triggerFocusTargetRef : void 0,
		beforeContentFocusGuardRef: l.context.beforeContentFocusGuardRef,
		children: G
	});
}), ec = {
	parentVirtualFocusRef: void 0,
	handleFocus: void 0
};
function tc() {
	return ec;
}
var nc = /*#__PURE__*/ y.forwardRef(function(e, t) {
	let n = et()?.Popup ?? $s;
	return /*#__PURE__*/ (0, Z.jsx)(n, {
		...e,
		ref: t
	});
}), rc = /*#__PURE__*/ y.createContext(void 0);
function ic() {
	let e = y.useContext(rc);
	if (e === void 0) throw Error(v(32));
	return e;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/menu/portal/MenuPortal.mjs
var ac = /*#__PURE__*/ y.forwardRef(function(e, t) {
	let { keepMounted: n = !1, ...r } = e, { store: i, parent: a } = C();
	if (!(i.useState("mounted") || n)) return null;
	let o = a.type === "menu" || a.type === "menubar" ? "group" : void 0;
	return /*#__PURE__*/ (0, Z.jsx)(rc.Provider, {
		value: n,
		children: /*#__PURE__*/ (0, Z.jsx)($i, {
			ref: t,
			...r,
			portalOwnerRole: o
		})
	});
});
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.5.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/inertValue.mjs
function oc(e) {
	return N(19) ? e : e ? "true" : void 0;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/hooks/useFloating.mjs
function sc(e) {
	let { nodeId: t, externalTree: n, rootContext: r } = e, i = r.useState("referenceElement"), a = r.useState("floatingElement"), o = r.useState("domReferenceElement"), s = r.useState("open"), c = r.useState("floatingId"), [l, u] = y.useState(null), d = y.useRef(null), f = aa(n), p = y.useMemo(() => ({
		reference: i,
		floating: a,
		domReference: o
	}), [
		i,
		a,
		o
	]), m = Rs({
		...e,
		elements: {
			...p,
			...l && { reference: l }
		}
	}), h = y.useCallback((e) => {
		let t = lt(e) ? {
			getBoundingClientRect: () => e.getBoundingClientRect(),
			getClientRects: () => e.getClientRects(),
			contextElement: e
		} : e;
		u(t), m.refs.setReference(t);
	}, [m.refs]), g = y.useMemo(() => ({
		...m.refs,
		setPositionReference: h,
		domReference: d
	}), [m.refs, h]), _ = y.useMemo(() => ({
		...m.elements,
		domReference: o
	}), [m.elements, o]), v = y.useMemo(() => ({
		...m,
		dataRef: r.context.dataRef,
		open: s,
		onOpenChange: r.setOpen,
		events: r.context.events,
		floatingId: c,
		refs: g,
		elements: _,
		nodeId: t,
		rootStore: r
	}), [
		m,
		g,
		_,
		t,
		r,
		s,
		c
	]);
	return Y(() => {
		o && (d.current = o);
	}, [o]), Y(() => {
		r.context.dataRef.current.floatingContext = v;
		let e = f?.nodesRef.current.find((e) => e.id === t);
		e && (e.context = v);
	}), y.useMemo(() => ({
		...m,
		context: v,
		refs: g,
		elements: _,
		rootStore: r
	}), [
		m,
		g,
		_,
		v,
		r
	]);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/direction-context/DirectionContext.mjs
var cc = /*#__PURE__*/ y.createContext(void 0);
function lc() {
	return y.useContext(cc)?.direction ?? "ltr";
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/floating-ui-react/middleware/arrow.mjs
var uc = (e) => ({
	name: "arrow",
	options: e,
	async fn(t) {
		let { x: n, y: r, placement: i, rects: a, platform: o, elements: s, middlewareData: c } = t, { element: l, padding: u = 0 } = Mr(e, t) || {};
		if (l == null) return {};
		let d = Xr(u), f = {
			x: n,
			y: r
		}, p = Rr(i), m = Ir(p), h = await o.getDimensions(l), g = p === "y", _ = g ? "top" : "left", v = g ? "bottom" : "right", y = g ? "clientHeight" : "clientWidth", b = a.reference[m] + a.reference[p] - f[p] - a.floating[m], x = f[p] - a.reference[p], S = s.floating[y] || a.floating[m], C = b / 2 - x / 2, w = S / 2 - h[m] / 2 - 1, T = Math.min(d[_], w), E = Math.min(d[v], w), D = T, O = S - h[m] - E, k = S / 2 - h[m] / 2 + C, A = jr(D, k, O), j = !c.arrow && Pr(i) != null && k !== A && a.reference[m] / 2 - (k < D ? T : E) - h[m] / 2 < 0, M = j ? k < D ? k - D : k - O : 0;
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
}), dc = (e, t) => {
	let { name: n, fn: r } = uc(e);
	return {
		name: n,
		fn: r,
		options: [e, t]
	};
}, fc = {
	name: "hide",
	async fn(e) {
		let { width: t, height: n, x: r, y: i } = e.rects.reference, a = t === 0 && n === 0 && r === 0 && i === 0, o = await e.platform.detectOverflow(e, { elementContext: "reference" });
		return { data: { referenceHidden: o.top - n >= 0 || o.right - t >= 0 || o.bottom - n >= 0 || o.left - t >= 0 || a } };
	}
}, pc = {
	sideX: "left",
	sideY: "top"
}, mc = "--available-width", hc = "--available-height", gc = "--anchor-width", _c = "--anchor-height", vc = "--transform-origin", yc = mc, bc = hc;
function xc(e, t, n) {
	let r = e === "inline-start" || e === "inline-end";
	return {
		top: "top",
		right: r ? n ? "inline-start" : "inline-end" : "right",
		bottom: "bottom",
		left: r ? n ? "inline-end" : "inline-start" : "left"
	}[t];
}
function Sc(e, t, n) {
	let { rects: r, placement: i } = e;
	return {
		side: xc(t, Nr(i), n),
		align: Pr(i) || "center",
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
function Cc(e) {
	return wc(e, sc);
}
function wc(e, t) {
	let { anchor: n, positionMethod: r = "absolute", side: i = "bottom", sideOffset: a = 0, align: o = "center", alignOffset: s = 0, collisionBoundary: c, collisionPadding: l = 5, sticky: u = !1, arrowPadding: d = 5, disableAnchorTracking: f = !1, inline: p, keepMounted: m = !1, floatingRootContext: h, mounted: g, collisionAvoidance: _, shift: v, nodeId: b, adaptiveOrigin: x, lazyFlip: S = !1, externalTree: C } = e, w = _.side || "flip", T = _.align || "flip", E = _.fallbackAxisSide || "end", D = v?.crossAxis ?? !1, O = v?.rootBoundary, k = typeof n == "function" ? n : void 0, A = J(k), j = k ? A : n, M = yr(n), N = yr(g), P = lc() === "rtl", [F, I] = y.useState(null);
	!g && F !== null && I(null);
	let L = S === "placement", R = F ? Nr(F) : null, z = F && L ? Pr(F) || "center" : null, B = R || {
		top: "top",
		right: "right",
		bottom: "bottom",
		left: "left",
		"inline-end": P ? "left" : "right",
		"inline-start": P ? "right" : "left"
	}[i], ee = z || o, V = ee === "center" ? B : `${B}-${ee}`, H = l;
	typeof H == "number" ? H = {
		top: H,
		right: H,
		bottom: H,
		left: H
	} : H &&= {
		top: H.top || 0,
		right: H.right || 0,
		bottom: H.bottom || 0,
		left: H.left || 0
	};
	let U = +(i === "bottom"), W = +(i === "top"), te = +(i === "right"), G = +(i === "left"), ne = {
		boundary: c === "clipping-ancestors" ? "clippingAncestors" : c,
		padding: H
	}, re = y.useRef(null), ie = yr(a), K = yr(s), ae = typeof a == "function" ? 0 : a, oe = typeof s == "function" ? 0 : s, se = [];
	p && se.push(p), se.push(zs((e) => {
		let t = Sc(e, i, P), n = typeof ie.current == "function" ? ie.current(t) : ie.current, r = typeof K.current == "function" ? K.current(t) : K.current;
		return {
			mainAxis: n,
			crossAxis: r,
			alignmentAxis: r
		};
	}, [
		ae,
		oe,
		P,
		i
	]));
	let ce = T === "none" && w !== "shift", q = !ce && (u || D || w === "shift"), le = w === "none" ? null : Hs({
		...ne,
		padding: {
			top: H.top + 1 + U,
			right: H.right + 1 + G,
			bottom: H.bottom + 1 + W,
			left: H.left + 1 + te
		},
		mainAxis: !D && w === "flip",
		crossAxis: T === "flip" && "alignment",
		fallbackAxisSideDirection: E
	}), ue = ce ? null : Bs({
		...ne,
		rootBoundary: O,
		mainAxis: T !== "none",
		crossAxis: q,
		limiter: u || D ? void 0 : Vs((e) => {
			if (!re.current) return {};
			let { width: t, height: n } = re.current.getBoundingClientRect(), r = Lr(Nr(e.placement)), i = r === "y" ? t : n, a = r === "y" ? H.left + H.right : H.top + H.bottom;
			return { offset: i / 2 + a / 2 };
		})
	}, [
		ne,
		u,
		D,
		O,
		H,
		T
	]);
	w === "shift" || T === "shift" || ee === "center" ? se.push(ue, le) : se.push(le, ue), se.push(Us({
		...ne,
		apply({ elements: { floating: e }, availableWidth: t, availableHeight: n, rects: r }) {
			if (!N.current) return;
			let i = e.style;
			i.setProperty(yc, `${t}px`), i.setProperty(bc, `${n}px`);
			let a = ot(e).devicePixelRatio || 1, { x: o, y: s, width: c, height: l } = r.reference, u = (Math.round((o + c) * a) - Math.round(o * a)) / a, d = (Math.round((s + l) * a) - Math.round(s * a)) / a;
			i.setProperty(gc, `${u}px`), i.setProperty(_c, `${d}px`);
		}
	}), dc((e) => ({
		element: re.current || Lt(e.elements.floating).createElement("div"),
		padding: re.current ? d : 0
	}), [d]), {
		name: "transformOrigin",
		fn(e) {
			let { elements: { floating: t }, middlewareData: n, placement: r, platform: o, rects: s, y: c } = e, l = Nr(r), u = Pr(r), d = Lr(l) === "y", f = re.current, p = typeof a == "function" ? a(Sc(e, i, P)) : a, m;
			m = !f && u && Math.abs(d ? n.shift?.x || 0 : n.shift?.y || 0) <= 1 ? u === "start" === (d && o.isRTL?.(t) === !0) ? "100%" : "0%" : `${(d ? n.arrow?.x || 0 : n.arrow?.y || 0) + (d ? f?.clientWidth || 0 : f?.clientHeight || 0) / 2}px`;
			let h = l === "top" || l === "left" ? `calc(100% + ${p}px)` : `${-p}px`;
			return q && d && Math.abs(n.shift?.y || 0) > p && (h = `${s.reference.y + s.reference.height / 2 - c}px`), t.style.setProperty(vc, d ? `${m} ${h}` : `${h} ${m}`), {};
		}
	}, fc, x), Y(() => {
		!g && h && h.update({
			referenceElement: null,
			floatingElement: null,
			domReferenceElement: null,
			positionReference: null
		});
	}, [g, h]);
	let de = y.useMemo(() => ({
		ancestorScroll: !f,
		elementResize: !f && typeof ResizeObserver < "u",
		layoutShift: !f && typeof IntersectionObserver < "u"
	}), [f]), { refs: fe, elements: pe, x: me, y: he, middlewareData: ge, update: _e, placement: ve, context: ye, isPositioned: be, floatingStyles: xe } = t({
		rootContext: h,
		open: m ? g : void 0,
		placement: V,
		middleware: se,
		strategy: r,
		whileElementsMounted: m ? void 0 : (...e) => Es(...e, de),
		nodeId: b,
		externalTree: C
	}), { sideX: Se, sideY: Ce } = ge.adaptiveOrigin || pc, we = be ? r : "fixed", Te = y.useMemo(() => {
		let e;
		return e = be ? x ? {
			position: we,
			[Se]: me,
			[Ce]: he
		} : {
			...xe,
			position: we
		} : {
			position: we,
			top: 0,
			left: 0
		}, e[yc] = "100vw", e[bc] = "100vh", be || (e.opacity = 0), e;
	}, [
		x,
		we,
		Se,
		me,
		Ce,
		he,
		xe,
		be
	]), Ee = y.useRef(null);
	Y(() => {
		if (!g) return;
		let e = M.current, t = typeof e == "function" ? e() : e, n = (Tc(t) ? t.current : t) || null;
		n !== Ee.current && (fe.setPositionReference(n), Ee.current = n);
	}, [
		g,
		fe,
		j,
		M
	]), y.useEffect(() => {
		if (!g) return;
		let e = M.current;
		typeof e != "function" && Tc(e) && e.current !== Ee.current && (fe.setPositionReference(e.current), Ee.current = e.current);
	}, [
		g,
		fe,
		j,
		M
	]), y.useEffect(() => {
		if (m && g && pe.reference && pe.floating) return Es(pe.reference, pe.floating, _e, de);
	}, [
		m,
		g,
		pe,
		_e,
		de
	]);
	let De = Nr(ve), Oe = xc(i, De, P), ke = Pr(ve) || "center", Ae = !!ge.hide?.referenceHidden;
	Y(() => {
		S && g && be && (De !== B || L && ke !== ee) && I(ve);
	}, [
		S,
		L,
		g,
		be,
		ve,
		De,
		ke,
		B,
		ee
	]);
	let je = y.useMemo(() => ({
		position: "absolute",
		top: ge.arrow?.y,
		left: ge.arrow?.x
	}), [ge.arrow]), Me = ge.arrow?.centerOffset !== 0;
	return y.useMemo(() => ({
		positionerStyles: Te,
		arrowStyles: je,
		arrowRef: re,
		arrowUncentered: Me,
		side: Oe,
		align: ke,
		physicalSide: De,
		anchorHidden: Ae,
		refs: fe,
		context: ye,
		isPositioned: be,
		update: _e
	}), [
		Te,
		je,
		re,
		Me,
		Oe,
		ke,
		De,
		Ae,
		fe,
		ye,
		be,
		_e
	]);
}
function Tc(e) {
	return e != null && "current" in e;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/composite/list/CompositeList.mjs
function Ec(e) {
	let { children: t, elementsRef: n, labelsRef: r, onMapChange: i } = e, a = J(i), [, o] = y.useState(0), s = T(Oc).current, c = T(Dc).current, l = y.useRef(0), u = y.useRef(!0), d = y.useRef(null), f = y.useRef(null), p = J(() => {
		u.current || (u.current = !0, o((e) => e + 1));
	}), m = J((e, t) => {
		c.set(e, t), p();
	}), h = J((e) => {
		c.delete(e), p();
	}), g = J((e) => {
		let t = /* @__PURE__ */ new Map();
		return n.current.length = 0, r && (r.current.length = 0), e.forEach((e) => {
			t.set(e.element, {
				...e.registration.metadata ?? {},
				index: e.index
			}), n.current[e.index] = e.element, r && (r.current[e.index] = e.registration.label === void 0 ? e.registration.textRef?.current?.textContent ?? e.element.textContent : e.registration.label);
		}), l.current = n.current.length, t;
	});
	function _(e) {
		if (f.current?.disconnect(), f.current = null, typeof MutationObserver != "function" || e.length < 2) return;
		let t = new MutationObserver((n) => {
			if (!jc(n)) return;
			let r = null;
			for (let n of e) if (n.isConnected) {
				if (r && Mc(r, n) > 0) {
					t.disconnect(), p();
					return;
				}
				r = n;
			}
		});
		f.current = t;
		let n = /* @__PURE__ */ new Set();
		for (let t = 1; t < e.length; t += 1) {
			let r = Ac(e[t - 1], e[t]);
			r && n.add(r);
		}
		n.forEach((e) => t.observe(e, { childList: !0 }));
	}
	let v = J(() => {
		let [e, t] = kc(c), n = g(e), r = d.current, i = !r || r.length !== e.length || e.some((e, t) => {
			let n = r[t];
			return e.index !== n.index || e.element !== n.element || e.registration.index !== n.registration.index || e.registration.metadata !== n.registration.metadata;
		});
		_(t), d.current = e, u.current = !1, i && (s.forEach((e) => e(n)), a(n));
	});
	Y(() => (!u.current && d.current && g(d.current), () => {
		n.current = [], r && (r.current = []);
	}), [
		n,
		r,
		g
	]), Y(() => {
		u.current && v();
	}), Y(() => () => {
		f.current?.disconnect(), u.current = !0;
	}, []);
	let b = J((e) => (s.add(e), () => {
		s.delete(e);
	})), x = y.useMemo(() => ({
		register: m,
		unregister: h,
		subscribeMapChange: b,
		nextIndexRef: l
	}), [
		m,
		h,
		b,
		l
	]);
	return /*#__PURE__*/ (0, Z.jsx)(sn.Provider, {
		value: x,
		children: t
	});
}
function Dc() {
	return /* @__PURE__ */ new Map();
}
function Oc() {
	return /* @__PURE__ */ new Set();
}
function kc(e) {
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
	return r.sort((e, t) => Mc(e.element, t.element)), r.forEach((e) => {
		for (; t.has(i);) i += 1;
		e.index = i, n.push(e), i += 1;
	}), t.size > 0 && n.sort((e, t) => e.index - t.index), [n, r.map((e) => e.element)];
}
function Ac(e, t) {
	let n = e.parentElement;
	for (; n && !n.contains(t);) n = n.parentElement;
	return n;
}
function jc(e) {
	for (let t of e) for (let e = 0; e < t.removedNodes.length; e += 1) if (t.removedNodes[e].isConnected) return !0;
	return !1;
}
function Mc(e, t) {
	return e.nextElementSibling === t ? -1 : t.nextElementSibling === e ? 1 : e.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/utils/InternalBackdrop.mjs
var Nc = /*#__PURE__*/ y.forwardRef(function(e, t) {
	let { cutout: n, ...r } = e, i;
	if (n) {
		let e = n.getBoundingClientRect();
		i = `polygon(0% 0%,100% 0%,100% 100%,0% 100%,0% 0%,${e.left}px ${e.top}px,${e.left}px ${e.bottom}px,${e.right}px ${e.bottom}px,${e.right}px ${e.top}px,${e.left}px ${e.top}px)`;
	}
	return /*#__PURE__*/ (0, Z.jsx)("div", {
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
function Pc(e) {
	let { store: t, domReference: n, positionerElement: r, open: i } = e, a = y.useRef(null), o = y.useRef(null), s = An(r);
	Y(() => {
		i || (o.current?.abort(), o.current = null, t.state.instantType === "trigger-change" && t.set("instantType", void 0));
	}, [i, t]), Y(() => {
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
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/utils/usePositioner.mjs
function Fc(e, t, { styles: n, transitionStatus: r, props: i, refs: a, hidden: o, inert: s = !1 }) {
	let c = { ...n };
	return s && (c.pointerEvents = "none"), q("div", e, {
		state: t,
		ref: a,
		props: [
			{
				role: "presentation",
				hidden: o,
				style: c
			},
			qs(r),
			i
		],
		stateAttributesMapping: Me
	});
}
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.5.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/useScrollLock.mjs
var Ic = {}, Lc = {}, Rc = "";
function zc(e, t) {
	return ft(e) ? e : t;
}
function Bc(e, t, n) {
	return /hidden|clip/.test(e.getComputedStyle(zc(t, n)).overflowY);
}
function Vc(e) {
	if (typeof document > "u") return !1;
	let t = Lt(e);
	return ot(t).innerWidth - t.documentElement.clientWidth > 0;
}
function Hc(e) {
	if (!(typeof CSS < "u" && CSS.supports && CSS.supports("scrollbar-gutter", "stable")) || typeof document > "u") return !1;
	let t = Lt(e), n = t.documentElement, r = t.body, i = zc(n, r), a = i.style.overflowY, o = n.style.scrollbarGutter;
	n.style.scrollbarGutter = "stable", i.style.overflowY = "scroll";
	let s = i.offsetWidth;
	i.style.overflowY = "hidden";
	let c = i.offsetWidth;
	return i.style.overflowY = a, n.style.scrollbarGutter = o, s === c;
}
function Uc(e) {
	let t = Lt(e), n = t.documentElement, r = t.body, i = zc(n, r), a = {
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
function Wc(e) {
	let t = Lt(e), n = t.documentElement, r = t.body, i = ot(n), a = 0, o = 0, s = !1, c = Sn.create();
	if ($t && (i.visualViewport?.scale ?? 1) !== 1) return () => {};
	function l() {
		let t = i.getComputedStyle(n), c = i.getComputedStyle(r), l = (t.scrollbarGutter || "").includes("both-edges") ? "stable both-edges" : "stable";
		a = n.scrollTop, o = n.scrollLeft, Ic = {
			scrollbarGutter: n.style.scrollbarGutter,
			overflowY: n.style.overflowY,
			overflowX: n.style.overflowX
		}, Rc = n.style.scrollBehavior, Lc = {
			position: r.style.position,
			height: r.style.height,
			width: r.style.width,
			boxSizing: r.style.boxSizing,
			overflowY: r.style.overflowY,
			overflowX: r.style.overflowX,
			scrollBehavior: r.style.scrollBehavior
		};
		let u = n.scrollHeight > n.clientHeight, d = n.scrollWidth > n.clientWidth, f = t.overflowY === "scroll" || c.overflowY === "scroll", p = t.overflowX === "scroll" || c.overflowX === "scroll", m = Math.max(0, i.innerWidth - r.clientWidth), h = Math.max(0, i.innerHeight - r.clientHeight), g = parseFloat(c.marginTop) + parseFloat(c.marginBottom), _ = parseFloat(c.marginLeft) + parseFloat(c.marginRight), v = zc(n, r);
		if (s = Hc(e), s) {
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
		Object.assign(n.style, Ic), Object.assign(r.style, Lc), s || (n.scrollTop = a, n.scrollLeft = o, n.removeAttribute("data-base-ui-scroll-locked"), n.style.scrollBehavior = Rc);
	}
	function d() {
		u(), c.request(l);
	}
	l();
	let f = _r(i, "resize", d);
	return () => {
		c.cancel(), u(), typeof i.removeEventListener == "function" && f();
	};
}
var Gc = new class {
	lockCount = 0;
	restore = null;
	timeoutLock = Bn.create();
	timeoutUnlock = Bn.create();
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
		let t = Lt(e), n = t.documentElement, r = t.body, i = ot(n);
		if (Bc(i, n, r)) {
			let t = new i.MutationObserver(() => {
				Bc(i, n, r) || (t.disconnect(), this.restore = null, this.lock(e));
			}), a = { attributes: !0 };
			t.observe(n, a), t.observe(r, a), this.restore = () => t.disconnect();
			return;
		}
		let a = Jt || !Vc(e);
		this.restore = a ? Uc(e) : Wc(e);
	}
}();
function Kc(e = !0, t = null) {
	Y(() => {
		if (e) return Gc.acquire(t);
	}, [e, t]);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/utils/useAnchoredPopupScrollLock.mjs
var qc = 20;
function Jc(e, t, n, r) {
	let [i, a] = y.useState(!1);
	Y(() => {
		if (!e || !t || n == null) {
			a(!1);
			return;
		}
		let r = Lt(n).documentElement.clientWidth, i = n.offsetWidth;
		a(r > 0 && i > 0 && i >= r - qc);
	}, [
		e,
		t,
		n
	]), Kc(e && (!t || i), r);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/menu/positioner/MenuPositioner.mjs
var Yc = /*#__PURE__*/ y.forwardRef(function(e, t) {
	let { anchor: n, positionMethod: r = "absolute", className: i, render: a, side: o, align: s, sideOffset: c = 0, alignOffset: l = 0, collisionBoundary: u = "clipping-ancestors", collisionPadding: d = 5, arrowPadding: f = 5, sticky: p = !1, disableAnchorTracking: m = !1, collisionAvoidance: h = Ki, style: g, ..._ } = e, { store: v, virtualFocus: x, syncHighlightedItem: S } = C(), w = ic(), T = Fe(!0), E = v.useState("parent"), D = v.useState("floatingRootContext"), O = v.useState("floatingTreeRoot"), k = v.useState("mounted"), A = v.useState("open"), j = v.useState("modal"), M = v.useState("openMethod"), N = v.useState("activeTriggerElement"), P = v.useState("transitionStatus"), F = v.useState("positionerElement"), I = v.useState("instantType"), L = v.useState("adaptiveOrigin"), R = v.useState("lastOpenChangeReason"), z = v.useState("floatingNodeId"), B = v.useState("floatingParentNodeId"), ee = D.useState("domReferenceElement"), V = n, H = c, U = l, W = s, te = h;
	E.type === "context-menu" && (V = n ?? E.context?.anchor, W ??= "start", !o && W !== "center" && (U = e.alignOffset ?? 2, H = e.sideOffset ?? -5));
	let G = o, ne = W;
	E.type === "menu" ? (G ??= "inline-end", ne ??= "start", te = e.collisionAvoidance ?? qi) : E.type === "menubar" && (G ??= E.context.orientation === "vertical" ? "inline-end" : "bottom", ne ??= "start");
	let re = E.type === "context-menu", ie = Cc({
		anchor: V,
		floatingRootContext: D,
		positionMethod: T ? "fixed" : r,
		mounted: k,
		side: G,
		sideOffset: H,
		align: ne,
		alignOffset: U,
		arrowPadding: re ? 0 : f,
		collisionBoundary: u,
		collisionPadding: d,
		sticky: p,
		nodeId: z,
		keepMounted: w,
		disableAnchorTracking: m,
		collisionAvoidance: te,
		shift: re ? {
			crossAxis: !("side" in te && te.side === "flip"),
			rootBoundary: "layoutViewport"
		} : void 0,
		externalTree: O,
		adaptiveOrigin: L,
		lazyFlip: x ? "placement" : !1
	});
	y.useEffect(() => {
		function e(e) {
			e.open && (e.parentNodeId === z && v.set("hoverEnabled", !1), e.nodeId !== z && e.parentNodeId === v.select("floatingParentNodeId") && v.setOpen(!1, X(Ye)));
		}
		return O.events.on("menuopenchange", e), () => {
			O.events.off("menuopenchange", e);
		};
	}, [
		v,
		O.events,
		z
	]), y.useEffect(() => {
		if (v.select("floatingParentNodeId") == null) return;
		function e(e) {
			if (e.open || e.nodeId !== v.select("floatingParentNodeId")) return;
			let t = e.reason ?? "sibling-open";
			v.setOpen(!1, X(t));
		}
		return O.events.on("menuopenchange", e), () => {
			O.events.off("menuopenchange", e);
		};
	}, [O.events, v]);
	let K = Vn();
	y.useEffect(() => {
		A || K.clear();
	}, [A, K]), y.useEffect(() => {
		function e(e) {
			if (A && e.nodeId === v.select("floatingParentNodeId")) {
				if (e.target && N && N !== e.target) {
					let e = v.select("closeDelay");
					e > 0 ? K.isStarted() || K.start(e, () => {
						v.setOpen(!1, X(Ye));
					}) : v.setOpen(!1, X(Ye));
				} else K.clear();
			}
		}
		return O.events.on("itemhover", e), () => {
			O.events.off("itemhover", e);
		};
	}, [
		O.events,
		A,
		N,
		v,
		K
	]), y.useEffect(() => {
		let e = {
			open: A,
			nodeId: z,
			parentNodeId: B,
			reason: v.select("lastOpenChangeReason")
		};
		O.events.emit("menuopenchange", e);
	}, [
		O.events,
		A,
		v,
		z,
		B
	]), Pc({
		store: v,
		domReference: ee,
		positionerElement: F,
		open: A
	});
	let ae = {
		open: A,
		side: ie.side,
		align: ie.align,
		anchorHidden: ie.anchorHidden,
		nested: E.type === "menu",
		instant: I
	}, oe = E.type === "menubar" && E.context.modal;
	Jc(A && (oe || j && R !== "trigger-hover"), M === "touch", F, N);
	let se = Fc(e, ae, {
		styles: ie.positionerStyles,
		transitionStatus: P,
		props: _,
		refs: [t, v.useStateSetter("positionerElement")],
		hidden: !k,
		inert: !A
	}), ce = k && E.type !== "menu" && (E.type !== "menubar" && j && R !== "trigger-hover" || E.type === "menubar" && E.context.modal), q = null;
	return E.type === "menubar" ? q = E.context.contentElement : E.type === void 0 && (q = N), /*#__PURE__*/ (0, Z.jsxs)(b.Provider, {
		value: ie,
		children: [ce && /*#__PURE__*/ (0, Z.jsx)(Nc, {
			ref: E.type === "context-menu" || E.type === "nested-context-menu" ? E.context.internalBackdropRef : null,
			inert: oc(!A),
			cutout: q
		}), /*#__PURE__*/ (0, Z.jsx)(sa, {
			id: z,
			children: /*#__PURE__*/ (0, Z.jsx)(Ec, {
				elementsRef: v.context.itemDomElements,
				labelsRef: v.context.itemLabels,
				onMapChange: S,
				children: se
			})
		})]
	});
}), Xc = /*#__PURE__*/ y.createContext(null);
function Zc(e) {
	let t = y.useContext(Xc);
	if (t === null && !e) throw Error(v(5));
	return t;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.5.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/useEnhancedClickHandler.mjs
function Qc(e) {
	let t = y.useRef(""), n = y.useCallback((n) => {
		n.defaultPrevented || (t.current = n.pointerType, e(n, n.pointerType));
	}, [e]);
	return {
		onClick: y.useCallback((n) => {
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
function $c(e, t) {
	let n = y.useRef(e), r = J(t);
	Y(() => {
		n.current !== e && r(n.current), n.current = e;
	}, [e, r]);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/utils/useOpenInteractionType.mjs
function el(e, t) {
	let { onClick: n, onPointerDown: r } = Qc(J((n, r) => {
		(typeof e == "function" ? e() : e) || t(r || (Jt ? "touch" : ""));
	}));
	return y.useMemo(() => ({
		onClick: n,
		onPointerDown: r
	}), [n, r]);
}
function tl(e) {
	let [t, n] = y.useState(null), r = el(e, n);
	return $c(e, (t) => {
		t && !e && n(null);
	}), y.useMemo(() => ({
		openMethod: t,
		triggerProps: r
	}), [t, r]);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/utils/getHighlightReason.mjs
function nl(e) {
	return e == null ? Ie : e.type.startsWith("key") ? Ke : e.type.startsWith("mouse") || e.type.startsWith("pointer") ? qe : Ie;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/menu/store/MenuStore.mjs
var rl = {
	...po,
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
		let n = po.triggerPopupId(e, t);
		return n ? e.listElement?.id || n : void 0;
	},
	filterTriggerProps: (e) => e.filterTriggerProps,
	inputProps: (e) => e.inputProps,
	webkitAriaSelected: (e, t) => $t && e.inputFocused && t ? !0 : void 0,
	highlightedItemId: (e) => e.highlightedItem?.id || void 0,
	isActive: (e, t) => e.activeIndex === t,
	hoverEnabled: (e) => e.hoverEnabled,
	instantType: (e) => e.instantType === "trigger-change" && !po.open(e) ? void 0 : e.instantType,
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
}, il = class extends ro {
	constructor(e, t, n = !1) {
		let r = new La(), i = ol(r, t, n, e);
		super(i, al(r), rl), this.observe("parent", (e) => {
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
function al(e) {
	return {
		positionerRef: /*#__PURE__*/ y.createRef(),
		popupRef: /*#__PURE__*/ y.createRef(),
		typingRef: { current: !1 },
		itemDomElements: { current: [] },
		itemLabels: { current: [] },
		highlightReason: "none",
		highlightEvent: void 0,
		reportedItem: void 0,
		allowMouseUpTriggerRef: { current: !1 },
		virtualFocusRef: void 0,
		triggerFocusTargetRef: /*#__PURE__*/ y.createRef(),
		beforeTriggerFocusGuardRef: /*#__PURE__*/ y.createRef(),
		beforeContentFocusGuardRef: /*#__PURE__*/ y.createRef(),
		onOpenChangeComplete: void 0,
		triggerElements: e
	};
}
function ol(e, t, n = !1, r) {
	return {
		...oo(e, t, n),
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
		filterTriggerProps: R,
		inputProps: R,
		inputFocused: !1,
		highlightedItem: void 0,
		hoverEnabled: !0,
		instantType: void 0,
		openChangeReason: null,
		floatingTreeRoot: new ta(),
		floatingNodeId: void 0,
		floatingParentNodeId: null,
		itemProps: R,
		keyboardEventRelay: void 0,
		closeDelay: 0,
		adaptiveOrigin: void 0,
		...r
	};
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/menu/filter-provider/MenuFilterProviderContext.mjs
var sl = /*#__PURE__*/ y.createContext(null);
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/menu/utils/isKeyboardOpen.mjs
function cl(e, t) {
	return (e === "trigger-press" || e === "item-press") && t?.detail === 0;
}
function ll(e, t) {
	return e === "list-navigation" || cl(e, t);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/menu/root/MenuRoot.mjs
var ul = Ka(function(e) {
	let { children: t, open: n, onOpenChange: r, onOpenChangeComplete: i, onItemHighlighted: a, defaultOpen: o = !1, disabled: s = !1, modal: c, loopFocus: l = !0, orientation: u = "vertical", actionsRef: d, closeParentOnEsc: f = !1, handle: p, triggerId: m, defaultTriggerId: h = null, highlightItemOnHover: g = !0, isSubmenu: _ = !1, virtualFocus: v = !1, virtualFocusRef: b, allowEscape: x = !0, resetOnPointerLeave: w = !0 } = e, E = Fe(!0), D = C(!0), O = Zc(!0), k = D?.store, A = D?.virtualFocus ?? !1, j = y.useMemo(() => _ && k ? {
		type: "menu",
		store: k
	} : O ? {
		type: "menubar",
		context: O
	} : E && !k ? {
		type: "context-menu",
		context: E
	} : { type: void 0 }, [
		E,
		k,
		O,
		_
	]), M = hn(), N = hn(), [P, F] = y.useState(void 0), I = (P ?? N) || void 0, z = ia(), B = j.type === "menu" ? j.store : void 0, ee = (n ?? o) && B?.state.transitionStatus === "starting", V = T(() => ee ? B?.state.instantType : void 0).current, U = T(() => {
		let e = new il({
			open: o,
			openProp: n,
			activeTriggerId: h,
			triggerIdProp: m,
			parent: j,
			disabled: s,
			highlightItemOnHover: g,
			modal: j.type === void 0 ? c : void 0,
			rootId: M,
			instantType: V
		}, I, z != null);
		return e.context.virtualFocusRef = b, e;
	}).current;
	U.useControlledProp("openProp", n), U.useControlledProp("triggerIdProp", m), U.useContextCallback("onOpenChangeComplete", i);
	let W = U.useState("floatingTreeRoot"), te = oa(W), G = U.useState("open"), ne = U.useState("activeTriggerElement"), re = U.useState("positionerElement"), ie = U.useState("hoverEnabled"), K = U.useState("disabled"), ae = U.useState("lastOpenChangeReason"), oe = U.useState("parent"), se = U.useState("activeIndex"), ce = U.useState("keyboardOpen"), q = U.useState("payload"), le = U.useState("floatingParentNodeId"), ue = y.useRef(null), de = y.useRef(oe.type !== "context-menu"), fe = Vn(), pe = y.useRef(!0), me = Vn(), he = le != null, { openMethod: ge, triggerProps: _e } = tl(G);
	U.useSyncedValues({
		disabled: s,
		highlightItemOnHover: g,
		modal: oe.type === void 0 ? c : void 0,
		openMethod: ge,
		rootId: M
	}), Na(U);
	let { forceUnmount: ve, transitionStatus: ye } = Pa(G, U, () => {
		U.set("allowMouseEnter", !1);
	}, ee), be = An(U.context.popupRef);
	y.useEffect(() => {
		if (V === void 0) return;
		let e = () => {
			U.state.instantType === V && U.set("instantType", void 0);
		};
		if (!G) {
			e();
			return;
		}
		if (ye !== void 0) return;
		if (U.context.popupRef.current == null) {
			e();
			return;
		}
		let t = new AbortController();
		return be(e, t.signal), () => {
			t.abort();
		};
	}, [
		V,
		G,
		ye,
		be,
		U
	]), Y(() => {
		E && !D ? U.update({
			parent: {
				type: "context-menu",
				context: E
			},
			floatingNodeId: te,
			floatingParentNodeId: z
		}) : (D || !U.select("activeTriggerElement")) && U.update({
			floatingNodeId: te,
			floatingParentNodeId: z
		});
	}, [
		E,
		D,
		te,
		z,
		ne,
		U
	]), y.useEffect(() => {
		if (G || (ue.current = null), oe.type === "context-menu") {
			if (!G) {
				fe.clear(), de.current = !1;
				return;
			}
			fe.start(500, () => {
				de.current = !0;
			});
		}
	}, [
		fe,
		G,
		oe.type
	]), Y(() => {
		!G && !ie && U.set("hoverEnabled", !0);
	}, [
		G,
		ie,
		U
	]);
	let xe = J((e, t) => {
		let n = t.reason;
		if (!e && !U.select("open") || G === e && t.trigger === ne && ae === n) return;
		let i = ja(t);
		if (!e && t.trigger == null && (t.trigger = ne ?? void 0), r?.(e, t), t.isCanceled) return;
		U.state.floatingRootContext.dispatchOpenChange(e, t);
		let a = t.event;
		if (e === !1 && n !== "item-press" && a?.type === "click" && a.pointerType === "touch" && !pe.current) return;
		e && n === "trigger-focus" ? (pe.current = !1, me.start(300, () => {
			pe.current = !0;
		})) : (pe.current = !0, me.clear());
		let o = !e && (n === "escape-key" || n == null);
		ue.current = t.event;
		let s = Aa(U.state, e, t.trigger, i());
		s.openChangeReason = n, s.keyboardOpen = e && ll(n, a), s.instantType = oe.type === "menubar" && (n === "trigger-focus" || n === "focus-out" || n === "trigger-hover" || n === "list-navigation" || n === "sibling-open") ? "group" : cl(n, a) ? "click" : o ? "dismiss" : void 0, U.update(s);
	}), Se = Sa({
		popupStore: U,
		floatingRootContext: U.state.floatingRootContext,
		floatingId: I,
		nested: z != null,
		onOpenChange: xe
	}), Ce = Se.context.events;
	Y(() => {
		let e = ({ open: e, eventDetails: t }) => xe(e, t);
		return Ce.on("setOpen", e), () => {
			Ce?.off("setOpen", e);
		};
	}, [Ce, xe]), Y(() => U.subscribeToParentMenu(), [U]);
	let we = y.useCallback(() => {
		U.setOpen(!1, X(Xe));
	}, [U]);
	y.useImperativeHandle(d, () => ({
		unmount: ve,
		close: we
	}), [ve, we]);
	let Te;
	oe.type === "context-menu" && (Te = oe.context), y.useImperativeHandle(Te?.positionerRef, () => re, [re]), y.useImperativeHandle(Te?.actionsRef, () => ({ setOpen: xe }), [xe]);
	let Ee = xa(Se, {
		enabled: !K,
		bubbles: { escapeKey: f && oe.type === "menu" },
		outsidePress() {
			return oe.type !== "context-menu" || ue.current?.type === "contextmenu" || de.current;
		},
		externalTree: he ? W : void 0
	}), De = lc(), Oe = jo(Se, {
		enabled: !K,
		listRef: U.context.itemDomElements,
		activeIndex: se,
		virtual: v,
		nested: oe.type === "menubar" || !v && oe.type !== void 0,
		parentOrientation: oe.type === "menubar" ? oe.context.orientation : void 0,
		loopFocus: l,
		focusItemOnOpen: v ? ce : void 0,
		allowEscape: v && l && x,
		orientation: u,
		triggerOrientation: v ? "vertical" : u,
		rtl: De === "rtl",
		disabledIndices: L,
		onNavigate(e, t) {
			U.setActiveIndex(e, nl(t), t?.nativeEvent);
		},
		openOnArrowKeyDown: oe.type !== "context-menu" && !(v && _),
		externalTree: !v && he ? W : void 0,
		nestedReturnFocusRef: B?.context.virtualFocusRef,
		focusItemOnHover: g,
		resetOnPointerLeave: w
	}), ke = y.useCallback((e) => {
		U.context.typingRef.current = e;
	}, [U]), Ae = Mo(Se, {
		enabled: !K && !v,
		listRef: U.context.itemLabels,
		elementsRef: U.context.itemDomElements,
		activeIndex: se,
		resetMs: 500,
		onMatch: (e, t) => {
			G && e !== se && U.setActiveIndex(e, Ke, t.nativeEvent);
		},
		onTyping: ke
	}), je = J(a), Me = y.useRef(-1), Ne = J(() => {
		let e = U.state.activeIndex, t = e === null ? void 0 : U.context.itemDomElements.current[e] ?? void 0;
		if (t?.isConnected === !1) return;
		let n = t === void 0 ? -1 : e;
		if (Me.current === n && U.context.reportedItem === t) return;
		Me.current = n, U.context.reportedItem = t, v && U.set("highlightedItem", t);
		let { highlightReason: r, highlightEvent: i } = U.context;
		U.context.highlightReason = Ie, U.context.highlightEvent = void 0, a && je(t, gn(r, i, { label: t === void 0 ? void 0 : U.context.itemLabels.current[n] ?? void 0 }));
	});
	Y(() => {
		Ne();
	}, [se, Ne]);
	let Pe = y.useMemo(() => {
		if (!v) return Oe.reference;
		if (!Oe.trigger) return R;
		let { onFocus: e, ...t } = Oe.trigger;
		return t;
	}, [
		v,
		Oe.reference,
		Oe.trigger
	]);
	U.useSyncedValue("inputProps", v ? Oe.reference ?? R : R);
	let Le = y.useMemo(() => {
		let e = H(Ae.reference, Pe, Ee.reference, { onMouseMove() {
			U.set("allowMouseEnter", !0);
		} }, _e);
		return e["aria-haspopup"] = "menu", e["aria-expanded"] = G, e;
	}, [
		U,
		Ae.reference,
		Pe,
		Ee.reference,
		_e,
		G
	]), Re = y.useMemo(() => {
		let e = H(Oe.trigger, Ee.trigger, _e);
		return e["aria-haspopup"] = "menu", e["aria-expanded"] = !1, e;
	}, [
		Oe.trigger,
		Ee.trigger,
		_e
	]);
	T(() => (U.update({ inactiveTriggerProps: Re }), null)), Fa(U, {
		floatingRootContext: Se,
		activeTriggerProps: Le,
		inactiveTriggerProps: Re,
		popupProps: y.useMemo(() => H(wa, {
			onMouseMove() {
				U.set("allowMouseEnter", !0), oe.type === "menu" && U.set("hoverEnabled", !1);
			},
			onClick() {
				U.select("hoverEnabled") && U.set("hoverEnabled", !1);
			},
			onKeyDown(e) {
				let t = U.select("keyboardEventRelay");
				t && !e.isPropagationStopped() && t(e);
			}
		}, Ae.floating, Oe.floating, Ee.floating), [
			oe.type,
			U,
			Ae.floating,
			Oe.floating,
			Ee.floating
		]),
		itemProps: Oe.item ?? R
	});
	let ze = y.useMemo(() => ({
		store: U,
		parent: j,
		orientation: u,
		loopFocus: l,
		allowEscape: x,
		defaultFloatingId: N,
		setRenderedFloatingId: F,
		virtualFocus: v,
		parentVirtualFocus: A,
		syncHighlightedItem: Ne
	}), [
		U,
		j,
		u,
		l,
		x,
		N,
		v,
		A,
		Ne
	]), Be = typeof t == "function" ? t({ payload: q }) : t, Ve = /*#__PURE__*/ (0, Z.jsxs)(S.Provider, {
		value: ze,
		children: [p && /*#__PURE__*/ (0, Z.jsx)(Da, {
			handle: p,
			store: U
		}), Be]
	});
	return (oe.type === void 0 || oe.type === "context-menu") && (Ve = /*#__PURE__*/ (0, Z.jsx)(ca, {
		externalTree: W,
		children: Ve
	})), Ve;
});
function dl(e) {
	let t = y.useContext(sl);
	if (t === null) return /*#__PURE__*/ (0, Z.jsx)(ul, { ...e });
	let n = t.Root;
	return /*#__PURE__*/ (0, Z.jsx)(sl.Provider, {
		value: null,
		children: /*#__PURE__*/ (0, Z.jsx)(n, {
			...t.options,
			...e
		})
	});
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/menu/submenu-root/MenuSubmenuRoot.mjs
var fl = {};
function pl(e) {
	C();
	let t = y.useContext(sl);
	if (t !== null) {
		let n = t.SubmenuRoot;
		return /*#__PURE__*/ (0, Z.jsx)(sl.Provider, {
			value: null,
			children: /*#__PURE__*/ (0, Z.jsx)(n, {
				...t.options,
				...e
			})
		});
	}
	return /*#__PURE__*/ (0, Z.jsx)(Js.Provider, {
		value: fl,
		children: /*#__PURE__*/ (0, Z.jsx)(ul, {
			...e,
			isSubmenu: !0
		})
	});
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/utils/getPseudoElementBounds.mjs
var ml = 5;
function hl(e, t) {
	let n = gl(t);
	return e.clientX >= n.left - ml && e.clientX <= n.right + ml && e.clientY >= n.top - ml && e.clientY <= n.bottom + ml;
}
function gl(e) {
	let t = e.getBoundingClientRect(), n = ot(e);
	if (tn) return t;
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
function _l(e = {}) {
	let { highlightItemOnHover: t, highlightedIndex: n, onHighlightedIndexChange: r } = Ft(), { ref: i, index: a } = ln(e), o = n === a, s = y.useRef(null), c = E(i, s);
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
function vl(e) {
	let { render: t, className: n, style: r, state: i = R, props: a = L, refs: o = L, metadata: s, stateAttributesMapping: c, tag: l = "div", ...u } = e, { compositeProps: d, compositeRef: f } = _l({ metadata: s });
	return q(l, e, {
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
function yl(e) {
	if (ut(e) && e.hasAttribute("data-rootownerid")) return e.getAttribute("data-rootownerid");
	if (!St(e)) return yl(Tt(e));
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/utils/popups/useTriggerFocusGuards.mjs
function bl(e, t) {
	function n(n, r, i) {
		let a = n.currentTarget;
		Dn.flushSync(() => {
			e.setOpen(!1, X(Ue, n.nativeEvent, a));
		}), Ti(a.isConnected ? a : t.current, r, i)?.focus();
	}
	function r(t) {
		n(t, -1, e.select("positionerElement"));
	}
	function i(t) {
		let r = e.select("positionerElement");
		r && Ei(t, r) ? e.context.beforeContentFocusGuardRef.current?.focus() : n(t, 1, r);
	}
	return {
		handlePreFocusGuardFocus: r,
		handleFocusTargetFocus: i
	};
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/utils/useMixedToggleClickHandler.mjs
function xl(e) {
	let { enabled: t = !0, mouseDownAction: n, open: r } = e, i = y.useRef(!1);
	return y.useMemo(() => t ? {
		onMouseDown: (e) => {
			(n === "open" && !r || n === "close" && r) && (i.current = !0, Lt(e.currentTarget).addEventListener("click", () => {
				i.current = !1;
			}, { once: !0 }));
		},
		onClick: (e) => {
			i.current && (i.current = !1, e.preventBaseUIHandler());
		}
	} : R, [
		t,
		n,
		r
	]);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/menu/trigger/MenuTrigger.mjs
var Sl = qa(function(e, t) {
	let { render: n, className: r, style: i, disabled: a = !1, nativeButton: o = !0, id: s, openOnHover: c, delay: l = 100, closeDelay: u = 0, handle: d, payload: f, ...p } = e, m = C(!0), h = mo(d) ?? m?.store;
	if (!h) throw Error(v(85));
	let g = hn(s), _ = h.useState("isTriggerActive", g), b = h.useState("floatingRootContext"), x = h.useState("isOpenedByTrigger", g), S = h.useState("triggerControlsId", g), w = y.useRef(null), T = wl(), E = Ft(!0), D = aa(), O = y.useMemo(() => D ?? new ta(), [D]), { registerTrigger: k, isMountedByThisTrigger: A } = Ma(g, w, h, {
		payload: f,
		closeDelay: u,
		parent: T,
		floatingTreeRoot: O,
		floatingNodeId: oa(O),
		floatingParentNodeId: ia(),
		keyboardEventRelay: E?.relayKeyboardEvent
	}), j = T.type === "menubar", M = h.useState("disabled"), N = a || M || j && T.context.disabled, { getButtonProps: P, buttonRef: F } = zt({
		disabled: N,
		native: o
	});
	y.useEffect(() => {
		!x && T.type === void 0 && (h.context.allowMouseUpTriggerRef.current = !1);
	}, [
		h,
		x,
		T.type
	]);
	let I = y.useRef(null), L = Vn(), z = J((e) => {
		if (!I.current) return;
		L.clear(), h.context.allowMouseUpTriggerRef.current = !1;
		let t = e.target;
		Q(I.current, t) || Q(h.select("positionerElement"), t) || t === I.current || (t == null || yl(t) !== h.select("rootId")) && (hl(e, I.current) || O.events.emit("close", {
			domEvent: e,
			reason: Je
		}));
	});
	y.useEffect(() => {
		let e = Lt(I.current);
		if (x && h.select("lastOpenChangeReason") === "trigger-hover") return e.addEventListener("mouseup", z, { once: !0 }), () => {
			e.removeEventListener("mouseup", z);
		};
	}, [
		x,
		z,
		h
	]);
	let B = j && T.context.hasSubmenuOpen, ee = To(b, {
		enabled: (c ?? B) && !N && (!j || B && !A),
		handleClose: Bo({ blockPointerEvents: !j }),
		mouseOnly: !0,
		move: !1,
		restMs: T.type === void 0 ? l : void 0,
		delay: { close: u },
		triggerElementRef: w,
		externalTree: O,
		isActiveTrigger: _,
		isClosing: () => h.select("transitionStatus") === "ending"
	}), V = Cl(x, h.select("lastOpenChangeReason")), U = va(b, {
		enabled: !N,
		event: x && j ? "click" : "mousedown",
		toggle: !0,
		ignoreMouse: !1,
		stickIfOpen: T.type === void 0 && V
	}), W = _o(b, { enabled: !N && B }), te = xl({
		open: x,
		enabled: j,
		mouseDownAction: "open"
	}), G = y.useMemo(() => H(W.reference, U.reference), [W.reference, U.reference]), ne = h.useState("triggerProps", A), re = h.useState("filterTriggerProps"), { handlePreFocusGuardFocus: ie, handleFocusTargetFocus: K } = bl(h, w), ae = {
		disabled: N,
		open: x
	}, oe = [
		I,
		t,
		F,
		k,
		w
	], se = [
		G,
		ee ?? R,
		ne,
		{
			"aria-haspopup": "menu",
			"aria-controls": S,
			id: g,
			onMouseDown: (e) => {
				h.select("open") || (L.start(200, () => {
					h.context.allowMouseUpTriggerRef.current = !0;
				}), Lt(e.currentTarget).addEventListener("mouseup", z, { once: !0 }));
			}
		},
		re,
		j ? { role: "menuitem" } : {},
		te,
		p,
		P
	], ce = q("button", e, {
		enabled: !j,
		stateAttributesMapping: je,
		state: ae,
		ref: oe,
		props: se
	});
	return j ? /*#__PURE__*/ (0, Z.jsx)(vl, {
		tag: "button",
		render: n,
		className: r,
		style: i,
		state: ae,
		refs: oe,
		props: se,
		stateAttributesMapping: je
	}) : x ? /*#__PURE__*/ (0, Z.jsxs)(y.Fragment, { children: [
		/*#__PURE__*/ (0, Z.jsx)(wr, {
			ref: h.context.beforeTriggerFocusGuardRef,
			onFocus: ie
		}, `${g}-pre-focus-guard`),
		/*#__PURE__*/ (0, Z.jsx)(y.Fragment, { children: ce }, g),
		/*#__PURE__*/ (0, Z.jsx)(wr, {
			ref: h.context.triggerFocusTargetRef,
			onFocus: K
		}, `${g}-post-focus-guard`)
	] }) : /*#__PURE__*/ (0, Z.jsx)(y.Fragment, { children: ce }, g);
});
function Cl(e, t) {
	let n = Vn(), [r, i] = y.useState(!1);
	return Y(() => {
		e && t === "trigger-hover" ? (i(!0), n.start(500, () => {
			i(!1);
		})) : e || (n.clear(), i(!1));
	}, [
		e,
		t,
		n
	]), r;
}
function wl() {
	let e = Zc(!0);
	return y.useMemo(() => e ? {
		type: "menubar",
		context: e
	} : { type: void 0 }, [e]);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.5.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/usePreviousValue.mjs
function Tl(e) {
	let [t, n] = y.useState({
		current: e,
		previous: null
	});
	return Object.is(e, t.current) || n({
		current: e,
		previous: t.current
	}), t.previous;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/separator/Separator.mjs
var El = /*#__PURE__*/ y.forwardRef(function(e, t) {
	let { className: n, render: r, orientation: i = "horizontal", style: a, ...o } = e;
	return q("div", e, {
		state: { orientation: i },
		ref: t,
		props: [{
			role: "separator",
			"aria-orientation": i
		}, o]
	});
});
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.5.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/isElementDisabled.mjs
function Dl(e) {
	return e == null || e.hasAttribute("disabled") || e.getAttribute("aria-disabled") === "true";
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/menu/submenu-trigger/MenuSubmenuTrigger.mjs
var Ol = { "aria-expanded": void 0 }, kl = /*#__PURE__*/ y.forwardRef(function(e, t) {
	let { render: n, className: r, style: i, label: a, id: o, nativeButton: s = !1, openOnHover: c = !0, delay: l = 100, closeDelay: u = 0, disabled: d = !1, ...f } = e, p = C(!0);
	if (p?.parent.type !== "menu") throw Error(v(37));
	let m = x(), h = Ys(), { store: g, parentVirtualFocus: _ } = p, b = p.parent.store, S = ln({
		guess: !0,
		label: a
	}), w = hn(o), T = g.useState("open"), E = y.useRef(!1), D = g.useState("positionerElement"), O = g.useState("floatingRootContext"), k = g.useState("floatingTreeRoot"), A = g.useState("triggerPopupId", w), j = ka(w, g), M = J((e) => {
		j(e);
		let t = g.select("activeTriggerElement");
		e !== null && g.select("open") && (t === e || g.select("activeTriggerId") == null) && g.update({
			activeTriggerId: w ?? null,
			activeTriggerElement: e,
			closeDelay: u
		});
	}), N = y.useRef(null), P = y.useCallback((e) => {
		N.current = e, g.set("activeTriggerElement", e);
	}, [g]);
	Y(() => (M(N.current), () => M(null)), [
		M,
		w,
		g
	]), Y(() => {
		if (!T || !D) return;
		function e(e) {
			Xn(e) === g.context.beforeContentFocusGuardRef.current && (E.current = e.relatedTarget === N.current);
		}
		return D.addEventListener("focusout", e, !0), () => {
			E.current = !1, D.removeEventListener("focusout", e, !0);
		};
	}, [
		T,
		D,
		g
	]), g.useSyncedValue("closeDelay", u);
	let F = g.useState("disabled"), I = b.useState("disabled"), L = d || F || I, z = b.useState("itemProps"), B = b.useState("isActive", S.index), ee = y.useMemo(() => ({
		type: "submenu-trigger",
		setActive(e) {
			b.select("highlightItemOnHover") && b.setActiveIndex(S.index, qe, e);
		}
	}), [b, S.index]), { getItemProps: V, itemRef: H } = on({
		closeOnClick: !1,
		disabled: L,
		highlighted: B,
		id: w,
		store: g,
		typingRef: b.context.typingRef,
		nativeButton: s,
		itemMetadata: ee,
		nodeId: m?.context.nodeId
	}), U = To(O, {
		enabled: g.useState("hoverEnabled") && c && !L,
		handleClose: Bo({ blockPointerEvents: !0 }),
		mouseOnly: !0,
		move: !0,
		restMs: l,
		delay: {
			open: l,
			close: u
		},
		shouldOpen: l > 0 ? () => b.select("allowMouseEnter") : void 0,
		triggerElementRef: N,
		externalTree: k,
		isClosing: () => g.select("transitionStatus") === "ending",
		guardStaleOpen: !0
	}), W = va(O, {
		enabled: !L,
		event: "mousedown",
		toggle: !0,
		ignoreMouse: c,
		stickIfOpen: c
	}).reference ?? R, te = g.useState("triggerProps", !0);
	delete te.id;
	let G = {
		disabled: L,
		highlighted: B,
		open: T
	}, ne = g.useState("openMethod"), re = g.useState("lastOpenChangeReason") === "list-navigation" || ne === "keyboard", ie = T && re && en;
	return q("div", e, {
		state: G,
		stateAttributesMapping: Ae,
		props: [
			W,
			U,
			te,
			h?.onTriggerKeyDown ? { onKeyDown: h.onTriggerKeyDown } : void 0,
			z,
			ie ? Ol : void 0,
			{
				"aria-controls": A,
				tabIndex: _ || !(T || B) ? -1 : 0,
				onFocus(e) {
					g.select("open") && E.current && (E.current = !1, g.setOpen(!1, X(Ue, e.nativeEvent)));
				},
				onBlur() {
					B && b.setActiveIndex(null, Ie);
				}
			},
			f,
			V
		],
		ref: [
			t,
			S.ref,
			H,
			M,
			P
		]
	});
}), Al = /*#__PURE__*/ y.forwardRef(function(e, t) {
	let n = rt(e, t, "submenu-trigger");
	if (!n.visible) return null;
	let r = n.props ? H(n.props, e) : e;
	return /*#__PURE__*/ (0, Z.jsx)(kl, {
		...r,
		ref: n.ref
	});
});
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/serializeValue.mjs
function jl(e) {
	if (e == null) return "";
	if (typeof e == "string") return e;
	try {
		return JSON.stringify(e);
	} catch {
		return String(e);
	}
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/resolveValueLabel.mjs
function Ml(e) {
	return typeof e == "object" && !!e && Array.isArray(e.items);
}
function Nl(e) {
	return Ml(e?.[0]);
}
function Pl(e) {
	return Nl(e) ? e.flatMap((e) => e.items) : e;
}
function Fl(e) {
	if (!Array.isArray(e)) return e != null && "null" in e;
	let t = e;
	if (Nl(t)) {
		for (let e of t) for (let t of e.items) if (t && t.value == null && t.label != null) return !0;
		return !1;
	}
	for (let e of t) if (e && e.value == null && e.label != null) return !0;
	return !1;
}
function Il(e, t) {
	if (t && e != null) return t(e) ?? "";
	if (e && typeof e == "object") {
		if ("label" in e && e.label != null) return String(e.label);
		if ("value" in e) return String(e.value);
	}
	return jl(e);
}
function Ll(e, t) {
	return t && e != null ? t(e) ?? "" : e && typeof e == "object" && "value" in e && "label" in e ? jl(e.value) : jl(e);
}
function Rl(e, t, n) {
	function r() {
		return Il(e, n);
	}
	if (n && e != null) return n(e);
	if (e && typeof e == "object" && "label" in e && e.label != null) return e.label;
	if (t && !Array.isArray(t)) return (Object.hasOwn(t, e) ? t[e] : void 0) ?? r();
	if (Array.isArray(t)) {
		let n = Pl(t);
		if (typeof e != "object" || !e) {
			let t = n.find((t) => t.value === e);
			return t && t.label != null ? t.label : r();
		}
		if ("value" in e) {
			let t = n.find((t) => t && t.value === e.value);
			if (t && t.label != null) return t.label;
		}
	}
	return r();
}
function zl(e, t, n) {
	return e.reduce((e, r, i) => (i > 0 && e.push(", "), e.push(/*#__PURE__*/ (0, Z.jsx)(y.Fragment, { children: Rl(r, t, n) }, i)), e), []);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.5.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/useOnFirstRender.mjs
function Bl(e) {
	let t = y.useRef(!0);
	t.current && (t.current = !1, e());
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/select/root/SelectRootContext.mjs
var Vl = /*#__PURE__*/ y.createContext(void 0), Hl = /*#__PURE__*/ y.createContext(void 0);
function Ul() {
	let e = y.useContext(Vl);
	if (e === void 0) throw Error(v(60));
	return e;
}
function Wl() {
	let e = y.useContext(Hl);
	if (e === void 0) throw Error(v(61));
	return e;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/field/control/FieldControlDataAttributes.mjs
var Gl = "data-valid", Kl = "data-invalid", ql = {
	badInput: !1,
	customError: !1,
	patternMismatch: !1,
	rangeOverflow: !1,
	rangeUnderflow: !1,
	stepMismatch: !1,
	tooLong: !1,
	tooShort: !1,
	typeMismatch: !1,
	valid: null,
	valueMissing: !1
}, Jl = {
	disabled: !1,
	valid: null,
	touched: !1,
	dirty: !1,
	filled: !1,
	focused: !1
}, Yl = { valid(e) {
	return e === null ? null : e ? { [Gl]: "" } : { [Kl]: "" };
} }, Xl = {
	invalid: void 0,
	name: void 0,
	validityData: {
		state: ql,
		errors: [],
		error: "",
		value: "",
		initialValue: null
	},
	setValidityData: I,
	disabled: void 0,
	setTouched: I,
	setDirty: I,
	setFilled: I,
	setFocused: I,
	focusOwnerRef: { current: void 0 },
	validationMode: "onSubmit",
	shouldValidateOnChange: () => !1,
	state: Jl,
	registerFieldControl: I,
	validation: {
		getValidationProps: (e, t = R) => t,
		inputRef: { current: null },
		registeredInputs: /* @__PURE__ */ new Map(),
		registerInput: I,
		getInputControl: () => null,
		commit: async () => {},
		change: I
	}
}, Zl = /*#__PURE__*/ y.createContext(Xl);
function Ql(e = !0) {
	let t = y.useContext(Zl);
	if (t.setValidityData === I && !e) throw Error(v(28));
	return t;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/field-register-control/useRegisterFieldControl.mjs
function $l(e, t, n, r, i = !0, a) {
	let { registerFieldControl: o } = Ql(), s = T(() => Symbol());
	Y(() => {
		let c = s.current;
		if (!i) {
			o(c, void 0);
			return;
		}
		o(c, {
			controlRef: e,
			getValue: r,
			id: t,
			name: a,
			value: n
		});
	}, [
		e,
		i,
		r,
		t,
		a,
		o,
		s,
		n
	]), Y(() => {
		let e = s.current;
		return () => {
			o(e, void 0);
		};
	}, [o, s]);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/labelable-provider/LabelableContext.mjs
var eu = /*#__PURE__*/ y.createContext({
	controlId: void 0,
	registerControlId: I,
	resetControlId: I,
	labelId: void 0,
	setLabelId: I,
	messageIds: [],
	setMessageIds: I,
	getDescriptionProps: (e) => e
});
function tu() {
	return y.useContext(eu);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/labelable-provider/useLabelableId.mjs
function nu(e = {}) {
	let { id: t, enabled: n = !0 } = e, { controlId: r, registerControlId: i, resetControlId: a } = tu(), o = hn(), s = T(() => Symbol()), c = y.useRef(!1), l = y.useRef(!1), u = J(() => {
		c.current && i !== I && (c.current = !1, i(s.current, void 0));
	});
	return Y(() => {
		if (!n || i === I) {
			u();
			return;
		}
		let e;
		if (t !== void 0) l.current = !0, e = t;
		else if (l.current) e = o;
		else {
			a();
			return;
		}
		if (e === void 0) {
			u();
			return;
		}
		c.current = !0, i(s.current, e);
	}, [
		t,
		n,
		i,
		a,
		o,
		s,
		u
	]), Y(() => u, [u]), (n ? r : void 0) ?? t ?? o;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.5.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/areArraysEqual.mjs
function ru(e, t, n = Object.is) {
	let { length: r } = e;
	if (r !== t.length) return !1;
	for (let i = 0; i < r; i += 1) if (!n(e[i], t[i])) return !1;
	return !0;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/itemEquality.mjs
var iu = (e, t) => Object.is(e, t);
function au(e, t, n) {
	return e == null || t == null ? Object.is(e, t) : n(e, t);
}
function ou(e, t, n) {
	return Array.isArray(e) && Array.isArray(t) ? !ru(e, t, (e, t) => au(e, t, n)) : e !== t;
}
function su(e, t, n) {
	return e ? e.some((e) => e !== void 0 && au(t, e, n)) : !1;
}
function cu(e, t, n) {
	return e ? e.findIndex((e) => e !== void 0 && au(e, t, n)) : -1;
}
function lu(e, t) {
	if (t !== iu) return (n) => su(e, n, t);
	let n = new Set(e);
	return n.delete(void 0), (t) => n.has(t) && (t !== 0 || e.some((e) => Object.is(t, e)));
}
function uu(e, t, n, r) {
	let i = r && Array.isArray(t) ? e.findIndex(lu(t, n)) : cu(e, t, n);
	return i === -1 ? null : i;
}
function du(e, t, n, r, i, a) {
	return su(r, t, i) ? a != null && e > a && su(r, n[a], i) ? a : e : e === a ? uu(n, r, i, !0) : a;
}
function fu(e, t, n) {
	return e.filter((e) => !au(t, e, n));
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/select/store.mjs
var pu = {
	id: (e) => e.id,
	labelId: (e) => e.labelId,
	modal: (e) => e.modal,
	multiple: (e) => e.multiple,
	disabled: (e) => e.disabled,
	readOnly: (e) => e.readOnly,
	required: (e) => e.required,
	highlightItemOnHover: (e) => e.highlightItemOnHover,
	items: (e) => e.items,
	itemToStringLabel: (e) => e.itemToStringLabel,
	isItemEqualToValue: (e) => e.isItemEqualToValue,
	value: (e) => e.value,
	hasSelectedValue: (e) => {
		let { value: t, multiple: n, itemToStringValue: r } = e;
		return t == null ? !1 : n && Array.isArray(t) ? t.length > 0 : Ll(t, r) !== "";
	},
	hasNullItemLabel: (e, t) => t ? Fl(e.items) : !1,
	open: (e) => e.open,
	mounted: (e) => e.mounted,
	forceMount: (e) => e.forceMount,
	transitionStatus: (e) => e.transitionStatus,
	openMethod: (e) => e.openMethod,
	activeIndex: (e) => e.activeIndex,
	selectedIndex: (e) => e.selectedIndex,
	isActive: (e, t) => e.activeIndex === t,
	isSelected: (e, t) => {
		let n = e.isItemEqualToValue, r = e.value;
		return e.multiple ? Array.isArray(r) && r.some((e) => au(t, e, n)) : au(t, r, n);
	},
	isSelectedByFocus: (e, t) => e.selectedIndex === t,
	popupProps: (e) => e.popupProps,
	triggerProps: (e) => e.triggerProps,
	itemRoot: (e) => e.itemRoot,
	triggerElement: (e) => e.triggerElement,
	positionerElement: (e) => e.positionerElement,
	listElement: (e) => e.listElement,
	popupSide: (e) => e.popupSide,
	scrollUpArrowVisible: (e) => e.scrollUpArrowVisible,
	scrollDownArrowVisible: (e) => e.scrollDownArrowVisible,
	hasScrollArrows: (e) => e.hasScrollArrows
}, mu = /*#__PURE__*/ y.createContext({
	elementRef: { current: null },
	formRef: { current: { fields: /* @__PURE__ */ new Map() } },
	errors: {},
	clearErrors: I,
	validationMode: "onSubmit",
	submitCountRef: { current: 0 }
});
function hu() {
	return y.useContext(mu);
}
//#endregion
//#region node_modules/.pnpm/@base-ui+utils@0.5.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/utils/clamp.mjs
function gu(e, t = -(2 ** 53 - 1), n = 2 ** 53 - 1) {
	return Math.max(t, Math.min(e, n));
}
function _u(e, t) {
	return Math.max(0, e - t);
}
function vu(e, t) {
	if (t <= 0) return 0;
	let n = gu(e, 0, t), r = n, i = t - n, a = r <= 1, o = i <= 1;
	return a && o ? r <= i ? 0 : t : a ? 0 : o ? t : n;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/select/root/SelectRoot.mjs
function yu(e) {
	let { id: t, value: n, defaultValue: r = null, onValueChange: i, open: a, defaultOpen: o = !1, onOpenChange: s, name: c, form: l, autoComplete: u, disabled: d = !1, readOnly: f = !1, required: p = !1, modal: m = !0, actionsRef: h, inputRef: g, onOpenChangeComplete: _, items: v, multiple: b = !1, itemToStringLabel: x, itemToStringValue: S, isItemEqualToValue: C = iu, highlightItemOnHover: w = !0, children: D } = e, { clearErrors: O } = hu(), { setDirty: k, setTouched: A, setFocused: j, validityData: M, setFilled: N, name: P, disabled: F, validation: z, validationMode: B } = Ql(), ee = nu({ id: t }), V = F || d, U = P ?? c, [W, te] = Qe({
		controlled: n,
		default: b ? r ?? L : r,
		name: "Select",
		state: "value"
	}), [G, ne] = Qe({
		controlled: a,
		default: o,
		name: "Select",
		state: "open"
	}), re = y.useRef([]), ie = y.useRef([]), K = y.useRef(null), ae = y.useRef(null), oe = y.useRef(0), se = y.useRef(null), ce = y.useRef([]), q = y.useRef(!1), le = y.useRef(null), ue = y.useRef(null), de = y.useRef({
		allowSelectedMouseUp: !1,
		allowUnselectedMouseUp: !1,
		dragY: 0
	}), fe = y.useRef(!1), pe = y.useRef(W), { openMethod: me, triggerProps: he } = tl(G), ge = T(() => new ro({
		id: ee,
		labelId: void 0,
		modal: m,
		multiple: b,
		disabled: V,
		readOnly: f,
		required: p,
		highlightItemOnHover: w,
		itemToStringLabel: x,
		itemToStringValue: S,
		isItemEqualToValue: C,
		value: W,
		open: G,
		mounted: G,
		transitionStatus: void 0,
		items: v,
		forceMount: !1,
		openMethod: null,
		activeIndex: null,
		selectedIndex: null,
		popupProps: R,
		triggerProps: R,
		itemRoot: {
			props: R,
			multiple: b,
			disabled: V,
			readOnly: f,
			isItemEqualToValue: C
		},
		triggerElement: null,
		positionerElement: null,
		listElement: null,
		popupSide: null,
		scrollUpArrowVisible: !1,
		scrollDownArrowVisible: !1,
		hasScrollArrows: !1
	}, {
		setValue: I,
		setOpen: I,
		handleScrollArrowVisibility: I,
		onOpenChangeComplete: I,
		listRef: re,
		popupRef: K,
		scrollHandlerRef: ae,
		scrollArrowsMountedCountRef: oe,
		valueRef: se,
		valuesRef: ce,
		labelsRef: ie,
		typingRef: q,
		selectionRef: de,
		firstItemTextRef: le,
		selectedItemTextRef: ue,
		alignItemWithTriggerActiveRef: fe,
		initialValueRef: pe
	}, pu)).current, [_e, ve] = y.useState(!1), { mounted: ye, transitionStatus: be, forceUnmount: xe } = Ca({
		open: G,
		ref: K,
		preventUnmountOnClose: _e,
		setPreventUnmountOnClose: ve,
		onUnmount() {
			ge.update({
				activeIndex: null,
				openMethod: null,
				scrollUpArrowVisible: !1,
				scrollDownArrowVisible: !1
			}), _?.(!1);
		}
	}), Se = ge.useState("activeIndex"), Ce = ge.useState("selectedIndex"), we = ge.useState("triggerElement"), Te = ge.useState("positionerElement"), Ee = Tl(me), De = me ?? Ee, Oe = y.useMemo(() => b ? "" : Ll(W, S), [
		b,
		W,
		S
	]), ke = y.useMemo(() => b && Array.isArray(W) ? W.map((e) => Ll(e, S)) : Ll(W, S), [
		b,
		W,
		S
	]);
	$l(yr(we), ee, W, J(() => ke), !V, c);
	let Ae = b ? Array.isArray(W) && W.length > 0 : W != null && Oe !== "";
	Y(() => {
		N(Ae);
	}, [Ae, N]), Y(function() {
		let e = uu(ce.current, W, C, b);
		e === null && (ue.current = null), !G && ge.set("selectedIndex", e);
	}, [
		b,
		G,
		W,
		C,
		ge
	]), $c(W, () => {
		O(U), k(ou(W, M.initialValue, C)), z.change(W);
	});
	let je = J((e, t) => {
		let n = t, r = ja(n);
		s?.(e, n), !t.isCanceled && (e || ve(r()), ne(e), !e && (t.reason === "focus-out" || t.reason === "outside-press") && (A(!0), j(!1), B === "onBlur" && z.commit(W)));
	});
	y.useImperativeHandle(h, () => ({
		unmount: xe,
		close: () => {
			ge.state.open && je(!1, X(Xe));
		}
	}), [
		xe,
		je,
		ge
	]);
	let Me = J((e, t) => {
		i?.(e, t), !t.isCanceled && te(e);
	}), Ne = J((e) => {
		let t = _u(e.scrollHeight, e.clientHeight), n = vu(e.scrollTop, t), r = n > 0, i = n < t;
		ge.set("scrollUpArrowVisible", r), ge.set("scrollDownArrowVisible", i);
	}), Pe = ho({
		open: G,
		onOpenChange: je,
		elements: {
			reference: we,
			floating: Te
		}
	}), Fe = va(Pe, {
		enabled: !V,
		event: "mousedown"
	}), Le = xa(Pe), Re = jo(Pe, {
		enabled: !V,
		listRef: re,
		activeIndex: Se,
		selectedIndex: Ce,
		disabledIndices: L,
		onNavigate(e) {
			(e !== null || G) && ge.set("activeIndex", e);
		},
		focusItemOnHover: w
	}), ze = Mo(Pe, {
		enabled: !V && (G || !f && !b),
		listRef: ie,
		activeIndex: Se,
		selectedIndex: Ce,
		disabledIndices: (e) => Dl(re.current[e]),
		onMatch(e) {
			G ? ge.set("activeIndex", e) : Me(ce.current[e], X(Ie));
		},
		onTyping(e) {
			q.current = e;
		}
	}), Be = y.useMemo(() => H(ze.reference, Re.reference, Le.reference, Fe.reference, he), [
		Fe.reference,
		ze.reference,
		Re.reference,
		Le.reference,
		he
	]), Ve = y.useMemo(() => H(wa, ze.floating, Re.floating, Le.floating), [
		ze.floating,
		Re.floating,
		Le.floating
	]), He = Re.item ?? R, Ue = y.useMemo(() => ({
		props: He,
		multiple: b,
		disabled: V,
		readOnly: f,
		isItemEqualToValue: C
	}), [
		He,
		b,
		V,
		f,
		C
	]);
	ge.useContextCallback("setValue", Me), ge.useContextCallback("setOpen", je), ge.useContextCallback("handleScrollArrowVisibility", Ne), ge.useContextCallback("onOpenChangeComplete", _), Bl(() => {
		ge.update({
			popupProps: Ve,
			triggerProps: Be,
			itemRoot: Ue
		});
	}), ge.useSyncedValues({
		id: ee,
		modal: m,
		multiple: b,
		disabled: V,
		readOnly: f,
		required: p,
		highlightItemOnHover: w,
		value: W,
		open: G,
		mounted: ye,
		transitionStatus: be,
		popupProps: Ve,
		triggerProps: Be,
		itemRoot: Ue,
		items: v,
		itemToStringLabel: x,
		itemToStringValue: S,
		isItemEqualToValue: C,
		openMethod: De
	});
	let We = E(g, z.inputRef), Ge = b ? void 0 : U, Ke = y.useMemo(() => !b || !Array.isArray(W) || !U ? null : W.map((e) => {
		let t = Ll(e, S);
		return /*#__PURE__*/ (0, Z.jsx)("input", {
			type: "hidden",
			form: l,
			name: U,
			value: t,
			disabled: V
		}, t);
	}), [
		b,
		W,
		l,
		U,
		S,
		V
	]);
	return /*#__PURE__*/ (0, Z.jsxs)(Vl.Provider, {
		value: ge,
		children: [
			/*#__PURE__*/ (0, Z.jsx)(Hl.Provider, {
				value: Pe,
				children: D
			}),
			/*#__PURE__*/ (0, Z.jsx)("input", {
				...z.getValidationProps(V, {
					onFocus() {
						ge.state.triggerElement?.focus({ focusVisible: !0 });
					},
					onChange(e) {
						if (e.nativeEvent.defaultPrevented || V || f) return;
						let t = e.currentTarget.value, n = X(Ie, e.nativeEvent);
						function r() {
							if (b) return;
							let e = t.toLowerCase(), r = ce.current.findIndex((t) => Ll(t, S).toLowerCase() === e || Il(t, x).toLowerCase() === e);
							r === -1 && (r = ce.current.findIndex((t, n) => {
								let r = ie.current[n];
								return r != null && r.toLowerCase() === e;
							}));
							let i = ce.current[r];
							i != null && Me(i, n);
						}
						ge.set("forceMount", !0), queueMicrotask(r);
					}
				}),
				id: ee && Ge == null ? `${ee}-hidden-input` : void 0,
				form: l,
				name: Ge,
				autoComplete: u,
				value: Oe,
				disabled: V,
				required: p && !(b && Ae),
				readOnly: f,
				ref: We,
				style: U ? Cr : Sr,
				tabIndex: -1,
				"aria-hidden": !0,
				suppressHydrationWarning: !0
			}),
			Ke
		]
	});
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/utils/resolveAriaLabelledBy.mjs
function bu(e, t) {
	return e ?? t;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/internals/field-root-context/useSetFieldFocused.mjs
function xu(e, t, n) {
	let { setFocused: r, focusOwnerRef: i } = Ql(), a = J((t) => {
		(t ? !e : i.current === a) && (i.current = t && a, n?.(t), r(t));
	});
	return Y(() => {
		let e = t.current;
		return e?.getRootNode()?.activeElement === e && a(!0), () => a(!1);
	}, [
		e,
		t,
		a
	]), a;
}
var Su = "data-popup-side", Cu = 400, wu = {
	...je,
	...Yl,
	popupSide: (e) => e ? { [Su]: e } : null,
	value: () => null
}, Tu = /*#__PURE__*/ y.forwardRef(function(e, t) {
	let { render: n, className: r, id: i, disabled: a = !1, nativeButton: o = !0, style: s, ...c } = e, { setTouched: l, validationMode: u, validation: d, state: f, disabled: p } = Ql(), { labelId: m } = tu(), h = Ul(), g = h.useState("readOnly"), _ = h.useState("required"), v = h.useState("disabled"), b = p || v || a, x = h.useState("open"), S = h.useState("mounted"), C = h.useState("value"), w = h.useState("triggerProps"), T = h.useState("positionerElement"), E = h.useState("listElement"), D = h.useState("popupSide"), O = h.useState("id"), k = h.useState("labelId"), A = h.useState("hasSelectedValue"), j = S && T ? D : null, M = i ?? O, N = bu(m, k);
	nu({ id: i });
	let P = yr(T), F = y.useRef(null), I = xu(b, F), { getButtonProps: L, buttonRef: R } = zt({
		disabled: b,
		native: o
	}), z = h.useStateSetter("triggerElement"), B = Vn(), ee = Vn(), V = Vn();
	y.useEffect(() => {
		if (x) return V.start(Cu, () => {
			h.context.selectionRef.current.allowUnselectedMouseUp = !0, h.context.selectionRef.current.allowSelectedMouseUp = !0;
		}), () => {
			V.clear();
		};
		h.context.selectionRef.current = {
			allowSelectedMouseUp: !1,
			allowUnselectedMouseUp: !1,
			dragY: 0
		}, ee.clear();
	}, [
		x,
		h,
		ee,
		V
	]);
	let U = H(w, {
		id: M,
		role: "combobox",
		"aria-expanded": x,
		"aria-haspopup": "listbox",
		"aria-controls": x ? E?.id ?? dr(T)?.id : void 0,
		"aria-labelledby": N,
		"aria-readonly": g || void 0,
		"aria-required": _ || void 0,
		tabIndex: b ? -1 : 0,
		onFocus(e) {
			I(!0), x && h.context.alignItemWithTriggerActiveRef.current && h.context.setOpen(!1, X(Ie, e.nativeEvent)), B.start(0, () => {
				h.set("forceMount", !0);
			});
		},
		onBlur(e) {
			Q(T, e.relatedTarget) || (l(!0), I(!1), u === "onBlur" && d.commit(C));
		},
		onMouseDown(e) {
			if (x) return;
			let t = Lt(e.currentTarget);
			function n(e) {
				if (!F.current) return;
				let t = e.target;
				Q(F.current, t) || Q(P.current, t) || hl(e, F.current) || h.context.setOpen(!1, X(Je, e));
			}
			ee.start(0, () => {
				t.addEventListener("mouseup", n, { once: !0 });
			});
		}
	}, c, L), W = d.getValidationProps(b, U);
	W.role = "combobox";
	let te = {
		...f,
		open: x,
		disabled: b,
		value: C,
		readOnly: g,
		popupSide: j,
		placeholder: !A
	};
	return q("button", e, {
		ref: [
			t,
			F,
			R,
			z
		],
		state: te,
		stateAttributesMapping: wu,
		props: W
	});
}), Eu = { value: () => null }, Du = /*#__PURE__*/ y.forwardRef(function(e, t) {
	let { className: n, render: r, children: i, placeholder: a, style: o, ...s } = e, c = Ul(), l = c.useState("value"), u = c.useState("items"), d = c.useState("itemToStringLabel"), f = c.useState("hasSelectedValue"), p = !f && a != null && i == null, m = c.useState("hasNullItemLabel", p), h = {
		value: l,
		placeholder: !f
	}, g = null;
	return g = typeof i == "function" ? i(l) : i ?? (p && !m ? a : Array.isArray(l) ? zl(l, u, d) : Rl(l, u, d)), q("span", e, {
		state: h,
		ref: [t, c.context.valueRef],
		props: [{ children: g }, s],
		stateAttributesMapping: Eu
	});
}), Ou = /*#__PURE__*/ y.forwardRef(function(e, t) {
	let { render: n, className: r, style: i, ...a } = e;
	return q("span", e, {
		state: { open: Ul().useState("open") },
		ref: t,
		props: [{
			"aria-hidden": !0,
			children: "▼"
		}, a],
		stateAttributesMapping: Ae
	});
}), ku = /*#__PURE__*/ y.forwardRef(function(e, t) {
	let n = Ul(), r = n.useState("mounted"), i = n.useState("forceMount");
	return r || i ? /*#__PURE__*/ (0, Z.jsx)($i, {
		ref: t,
		...e
	}) : null;
}), Au = /*#__PURE__*/ y.createContext(void 0);
function ju() {
	let e = y.useContext(Au);
	if (!e) throw Error(v(59));
	return e;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/select/popup/utils.mjs
function Mu(e, t) {
	e && Object.assign(e.style, t);
}
var Nu = {
	position: "relative",
	maxHeight: "100%",
	overflowX: "hidden",
	overflowY: "auto"
}, Pu = { position: "fixed" }, Fu = /*#__PURE__*/ y.forwardRef(function(e, t) {
	let { anchor: n, className: r, render: i, positionMethod: a, side: o, align: s, sideOffset: c, alignOffset: l, collisionBoundary: u = "clipping-ancestors", collisionPadding: d, arrowPadding: f, sticky: p, disableAnchorTracking: m, alignItemWithTrigger: h = !0, collisionAvoidance: g = Ki, style: _, ...v } = e, b = Ul(), x = Wl(), S = b.useState("open"), C = b.useState("mounted"), w = b.useState("modal"), T = b.useState("value"), E = b.useState("openMethod"), D = b.useState("positionerElement"), O = b.useState("triggerElement"), k = b.useState("isItemEqualToValue"), A = b.useState("transitionStatus"), j = y.useRef(null), M = y.useRef(null), [N, P] = y.useState(h), F = C && N && E !== "touch";
	!C && N !== h && P(h), y.useImperativeHandle(b.context.alignItemWithTriggerActiveRef, () => F), Jc((F || w) && S, E === "touch", D, O);
	let I = Cc({
		anchor: n,
		floatingRootContext: x,
		positionMethod: a,
		mounted: C,
		side: o,
		sideOffset: c,
		align: s,
		alignOffset: l,
		arrowPadding: f,
		collisionBoundary: u,
		collisionPadding: d,
		sticky: p,
		disableAnchorTracking: m ?? F,
		collisionAvoidance: g,
		keepMounted: !0
	}), L = F ? "none" : I.side, R = F ? Pu : I.positionerStyles, z = {
		open: S,
		side: L,
		align: I.align,
		anchorHidden: I.anchorHidden
	};
	Y(() => {
		b.set("popupSide", I.side);
	}, [b, I.side]);
	let B = Fc(e, z, {
		styles: R,
		transitionStatus: A,
		props: v,
		refs: [t, b.useStateSetter("positionerElement")],
		hidden: !C,
		inert: !S
	}), ee = y.useRef(0), V = J((e) => {
		if (b.context.valuesRef.current.length === 0) return;
		let t = ee.current;
		ee.current = e.size;
		let n = X(Ie);
		if (t !== 0 && !b.state.multiple && T !== null && cu(b.context.valuesRef.current, T, k) === -1) {
			let e = b.context.initialValueRef.current, t = e != null && cu(b.context.valuesRef.current, e, k) !== -1 ? e : null;
			b.context.setValue(t, n), t === null && (b.set("selectedIndex", null), b.context.selectedItemTextRef.current = null);
		}
		if (t !== 0 && b.state.multiple && Array.isArray(T)) {
			let e = T.filter((e) => cu(b.context.valuesRef.current, e, k) !== -1);
			e.length !== T.length && (b.context.setValue(e, n), e.length === 0 && (b.set("selectedIndex", null), b.context.selectedItemTextRef.current = null));
		}
		if (S && F) {
			b.update({
				scrollUpArrowVisible: !1,
				scrollDownArrowVisible: !1
			});
			let e = { height: "" };
			Mu(D, e), Mu(b.context.popupRef.current, e);
		}
	}), H = y.useMemo(() => ({
		...I,
		side: L,
		alignItemWithTriggerActive: F,
		setControlledAlignItemWithTrigger: P,
		scrollUpArrowRef: j,
		scrollDownArrowRef: M
	}), [
		I,
		L,
		F,
		P
	]);
	return /*#__PURE__*/ (0, Z.jsx)(Ec, {
		elementsRef: b.context.listRef,
		labelsRef: b.context.labelsRef,
		onMapChange: V,
		children: /*#__PURE__*/ (0, Z.jsxs)(Au.Provider, {
			value: H,
			children: [C && w && /*#__PURE__*/ (0, Z.jsx)(Nc, {
				inert: oc(!S),
				cutout: O
			}), B]
		})
	});
}), Iu = "base-ui-disable-scrollbar", Lu = {
	className: Iu,
	getElement(e) {
		return /*#__PURE__*/ (0, Z.jsx)("style", {
			nonce: e,
			href: Iu,
			precedence: "base-ui:low",
			children: `.${Iu}{scrollbar-width:none}.${Iu}::-webkit-scrollbar{display:none}`
		});
	}
}, Ru = /*#__PURE__*/ y.createContext(void 0), zu = { disableStyleElements: !1 };
function Bu() {
	return y.useContext(Ru) ?? zu;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/select/positioner/SelectPositionerCssVars.mjs
var Vu = "--transform-origin", Hu = {
	...Me,
	...ye
}, Uu = /*#__PURE__*/ y.forwardRef(function(e, t) {
	let { render: n, className: r, style: i, finalFocus: a, ...o } = e, s = Ul(), c = s.useState("multiple"), l = s.useState("readOnly"), u = s.useState("highlightItemOnHover"), d = Wl(), { side: f, align: p, alignItemWithTriggerActive: m, isPositioned: h, setControlledAlignItemWithTrigger: g } = ju(), _ = Gs(!0) != null, v = lc(), { nonce: b, disableStyleElements: x } = Bu(), S = s.useState("id"), C = s.useState("open"), w = s.useState("openMethod"), T = s.useState("mounted"), E = s.useState("popupProps"), D = s.useState("transitionStatus"), O = s.useState("triggerElement"), k = s.useState("positionerElement"), A = s.useState("listElement"), j = y.useRef(!1), M = y.useRef(!1), N = y.useRef({}), P = Cn(), F = J((e) => {
		if (!k || !s.context.popupRef.current || !M.current) return;
		let t = k.style.top === "0px", n = k.style.bottom === "0px";
		if (j.current || !m || !t && !n) {
			s.context.handleScrollArrowVisibility(e);
			return;
		}
		let r = Ku(k), i = qu(k.getBoundingClientRect().height, "y", r), a = Lt(k), o = ot(k), c = o.getComputedStyle(k), l = parseFloat(c.marginTop), u = parseFloat(c.marginBottom), d = Wu(o.getComputedStyle(s.context.popupRef.current)), f = Math.min(a.documentElement.clientHeight - l - u, d), p = e.scrollTop, h = Gu(e), g = null, _ = (e) => {
			k.style.height = `${e}px`;
		}, v = t ? h - p : p, y = Math.min(i + v, f);
		if (v <= 1) {
			let n = gu(v, 0, f - i);
			n > 0 && _(i + n), e.scrollTop = t ? h : 0, f - (i + n) <= 1 && (j.current = !0), s.context.handleScrollArrowVisibility(e);
			return;
		}
		f - y > 1 ? g = t ? Infinity : 0 : n && p < h && (g = p - (v - (i + v - f)));
		let b = Math.ceil(y);
		if (b !== 0 && _(b), g != null) {
			let t = gu(g, 0, Gu(e));
			Math.abs(e.scrollTop - t) > 1 && (e.scrollTop = t);
		}
		b >= f - 1 && (j.current = !0), s.context.handleScrollArrowVisibility(e);
	});
	y.useImperativeHandle(s.context.scrollHandlerRef, () => F, [F]), jn({
		open: C,
		ref: s.context.popupRef,
		onComplete() {
			C && s.context.onOpenChangeComplete(!0);
		}
	});
	let I = {
		open: C,
		transitionStatus: D,
		side: f,
		align: p
	};
	Y(() => {
		k && s.context.popupRef.current && !Object.keys(N.current).length && (N.current = {
			top: k.style.top || "0",
			left: k.style.left || "0",
			right: k.style.right,
			height: k.style.height,
			bottom: k.style.bottom,
			minHeight: k.style.minHeight,
			maxHeight: k.style.maxHeight,
			marginTop: k.style.marginTop,
			marginBottom: k.style.marginBottom
		});
	}, [s, k]), Y(() => {
		C || m || (M.current = !1, j.current = !1, Mu(k, N.current));
	}, [
		C,
		m,
		k
	]), Y(() => {
		let e = s.context.popupRef.current;
		if (!C || !O || !k || !e || m && !h || s.state.transitionStatus === "ending") return;
		if (M.current = !0, e.style.removeProperty(Vu), !m) {
			P.request(() => s.context.handleScrollArrowVisibility(A || e));
			return;
		}
		let t = Xu(e);
		try {
			let t = s.context.selectedItemTextRef.current;
			t?.isConnected || (t = !s.select("hasSelectedValue") && s.context.firstItemTextRef.current?.isConnected ? s.context.firstItemTextRef.current : null);
			let n = s.context.valueRef.current, r = ot(k), i = r.getComputedStyle(k), a = r.getComputedStyle(e), o = Lt(O), c = Ku(O), l = Ju(O.getBoundingClientRect(), c), d = Ju(k.getBoundingClientRect(), c), f = l.height, p = A || e, m = p.scrollHeight, h = parseFloat(a.borderBottomWidth), _ = parseFloat(i.marginTop) || 10, y = parseFloat(i.marginBottom) || 10, b = parseFloat(i.minHeight) || 100, x = Wu(a), S = o.documentElement.clientHeight - _ - y, C = o.documentElement.clientWidth, w = S - l.bottom + f, T, E = v === "rtl" ? l.right - d.width : l.left, D = 0;
			if (t && n) {
				let e = Ju(n.getBoundingClientRect(), c);
				T = Ju(t.getBoundingClientRect(), c), E = d.left + (v === "rtl" ? e.right - T.right : e.left - T.left);
				let r = e.top - l.top + e.height / 2;
				D = T.top - d.top + T.height / 2 - r;
			}
			let M = w + D + y + h, P = Math.min(S, M), F = S - _ - y, I = M - P, L = C - 5;
			k.style.left = `${gu(E, 5, L - d.width)}px`, k.style.height = `${P}px`, k.style.maxHeight = "none", k.style.marginTop = `${_}px`, k.style.marginBottom = `${y}px`, e.style.height = "100%";
			let R = Gu(p), z = I >= R - 1;
			z && (P = Math.min(S, d.height) - (I - R));
			let B = l.top < 20 || l.bottom > S - 20 || Math.ceil(P) + 1 < Math.min(m, b), ee = (r.visualViewport?.scale ?? 1) !== 1 && $t;
			if (B || ee) {
				Mu(k, N.current), g(!1);
				return;
			}
			let V = Math.max(b, P);
			if (z) {
				let e = Math.max(0, S - M);
				k.style.top = d.height >= F ? "0" : `${e}px`, k.style.height = `${P}px`, p.scrollTop = Gu(p);
			} else k.style.bottom = "0", p.scrollTop = I;
			if (T) {
				let t = d.top, n = d.height, r = T.top + T.height / 2, i = gu(n > 0 ? (r - t) / n * 100 : 50, 0, 100);
				e.style.setProperty(Vu, `50% ${i}%`);
			}
			(V === S || P >= x) && (j.current = !0), s.context.handleScrollArrowVisibility(p), u && s.state.selectedIndex === null && s.state.activeIndex === null && s.context.listRef.current[0] != null && s.set("activeIndex", 0);
		} finally {
			t();
		}
	}, [
		s,
		C,
		k,
		O,
		m,
		g,
		P,
		A,
		u,
		v,
		h
	]), y.useEffect(() => {
		if (!m || !k || !C) return;
		let e = ot(k);
		function t(e) {
			s.context.setOpen(!1, X(Ze, e));
		}
		return _r(e, "resize", t);
	}, [
		s,
		m,
		k,
		C
	]);
	let L = {
		...A ? { role: "presentation" } : {
			role: "listbox",
			"aria-multiselectable": c || void 0,
			"aria-readonly": l || void 0,
			id: `${S}-list`
		},
		onKeyDown(e) {
			_ && Ks.has(e.key) && e.stopPropagation();
		},
		onScroll(e) {
			A || F(e.currentTarget);
		},
		...m && { style: A ? { height: "100%" } : Nu },
		className: !A && m ? Lu.className : void 0
	}, R = q("div", e, {
		ref: [t, s.context.popupRef],
		state: I,
		stateAttributesMapping: Hu,
		props: [
			E,
			L,
			qs(D),
			o
		]
	});
	return /*#__PURE__*/ (0, Z.jsxs)(y.Fragment, { children: [!x && Lu.getElement(b), /*#__PURE__*/ (0, Z.jsx)(_a, {
		context: d,
		modal: !1,
		disabled: !T,
		openInteractionType: w,
		returnFocus: a,
		restoreFocus: !0,
		children: R
	})] });
});
function Wu(e) {
	let t = e.maxHeight;
	return t.endsWith("px") && parseFloat(t) || Infinity;
}
function Gu(e) {
	return _u(e.scrollHeight, e.clientHeight);
}
function Ku(e) {
	return Cs.getScale(e);
}
function qu(e, t, n) {
	return e / n[t];
}
function Ju(e, t) {
	return Zr({
		x: qu(e.x, "x", t),
		y: qu(e.y, "y", t),
		width: qu(e.width, "x", t),
		height: qu(e.height, "y", t)
	});
}
var Yu = [
	["transform", "none"],
	["scale", "1"],
	["translate", "0 0"]
];
function Xu(e) {
	let { style: t } = e, n = {};
	for (let [e, r] of Yu) n[e] = t.getPropertyValue(e), t.setProperty(e, r, "important");
	return () => {
		for (let [e] of Yu) {
			let r = n[e];
			r ? t.setProperty(e, r) : t.removeProperty(e);
		}
	};
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/select/list/SelectList.mjs
var Zu = /*#__PURE__*/ y.forwardRef(function(e, t) {
	let { render: n, className: r, style: i, ...a } = e, o = Ul(), s = o.useState("multiple"), c = o.useState("readOnly"), { alignItemWithTriggerActive: l } = ju(), u = o.useState("hasScrollArrows"), d = o.useState("openMethod"), f = {
		id: `${o.useState("id")}-list`,
		role: "listbox",
		"aria-multiselectable": s || void 0,
		"aria-readonly": c || void 0,
		onScroll(e) {
			o.context.scrollHandlerRef.current?.(e.currentTarget);
		},
		...l && { style: Nu },
		className: u && d !== "touch" ? Lu.className : void 0
	};
	return q("div", e, {
		ref: [t, o.useStateSetter("listElement")],
		props: [f, a]
	});
}), Qu = /*#__PURE__*/ y.createContext(void 0);
function $u() {
	let e = y.useContext(Qu);
	if (!e) throw Error(v(57));
	return e;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/select/item/SelectItem.mjs
var ed = /*#__PURE__*/ y.memo(/*#__PURE__*/ y.forwardRef(function(e, t) {
	let { render: n, className: r, style: i, value: a = null, label: o, disabled: s = !1, nativeButton: c = !1, ...l } = e, u = y.useRef(null), d = ln({
		guess: !0,
		label: o,
		textRef: u
	}), f = Ul(), { props: p, multiple: m, disabled: h, readOnly: g, isItemEqualToValue: _ } = f.useState("itemRoot"), v = h || s, b = f.useState("isActive", d.index), x = f.useState("open"), S = f.useState("isSelected", a), C = f.useState("isSelectedByFocus", d.index), w = d.index, T = y.useRef(null);
	Y(() => {
		let e = f.context.valuesRef.current;
		return e[w] = a, () => {
			delete e[w];
		};
	}, [
		w,
		a,
		f
	]), Y(() => {
		let e = f.state.value, t = f.state.selectedIndex, n = t, r;
		m && Array.isArray(e) ? (n = du(w, a, f.context.valuesRef.current, e, _, t), r = n === w, w === t && !r && (f.context.selectedItemTextRef.current = null)) : (r = e !== void 0 && au(a, e, _), r && (n = w)), f.set("selectedIndex", n), r && u.current && (f.context.selectedItemTextRef.current = u.current);
	}, [
		w,
		m,
		_,
		f,
		a
	]);
	let E = y.useRef("mouse"), D = y.useRef(!1), { getButtonProps: O, buttonRef: k } = zt({
		disabled: v,
		focusableWhenDisabled: !0,
		native: c,
		composite: !0
	}), A = {
		disabled: v,
		selected: S,
		highlighted: b
	};
	function j(e) {
		if (h || g) return;
		let t = f.state.value;
		if (m) {
			let n = Array.isArray(t) ? t : [], r = S ? fu(n, a, _) : [...n, a];
			f.context.setValue(r, X(Ve, e));
		} else f.context.setValue(a, X(Ve, e)), f.context.setOpen(!1, X(Ve, e));
	}
	function M() {
		f.context.selectionRef.current.dragY = 0;
	}
	let N = {
		role: "option",
		"aria-selected": S,
		tabIndex: x && b ? 0 : -1,
		onKeyDown(e) {
			f.set("activeIndex", w), e.key === " " && f.context.typingRef.current && e.preventDefault();
		},
		onClick(e) {
			let t = E.current !== "touch", n = e.nativeEvent.pointerType, r = t && Wn(e.nativeEvent) && (n !== void 0 || b), i = t && !r && !D.current;
			D.current = !1, !(v || i) && j(e.nativeEvent);
		},
		onPointerEnter(e) {
			E.current = e.pointerType;
		},
		onPointerMove(e) {
			if (e.pointerType === "mouse" && e.buttons === 1) {
				let t = f.context.selectionRef.current;
				t.dragY += e.movementY, t.dragY ** 2 >= 64 && (t.allowUnselectedMouseUp = !0);
			}
		},
		onPointerDown(e) {
			E.current = e.pointerType, D.current = !0, M();
		},
		onMouseUp() {
			if (M(), v || E.current === "touch" || D.current) return;
			let e = !f.context.selectionRef.current.allowSelectedMouseUp && S, t = !f.context.selectionRef.current.allowUnselectedMouseUp && !S;
			e || t || (D.current = !0, T.current?.click(), D.current = !1);
		}
	}, P = q("div", e, {
		ref: [
			k,
			t,
			d.ref,
			T
		],
		state: A,
		props: [
			p,
			N,
			l,
			O
		]
	}), F = y.useMemo(() => ({
		selected: S,
		index: w,
		textRef: u,
		selectedByFocus: C
	}), [
		S,
		w,
		u,
		C
	]);
	return /*#__PURE__*/ (0, Z.jsx)(Qu.Provider, {
		value: F,
		children: P
	});
})), td = /*#__PURE__*/ y.memo(/*#__PURE__*/ y.forwardRef(function(e, t) {
	let { render: n, className: r, style: i, keepMounted: a, selected: o, ...s } = e, c = y.useRef(null), { transitionStatus: l, setMounted: u } = wn(o), d = q("span", e, {
		ref: [t, c],
		state: {
			selected: o,
			transitionStatus: l
		},
		props: [{
			"aria-hidden": !0,
			children: "✔️"
		}, s],
		stateAttributesMapping: ye
	});
	return jn({
		batch: !0,
		enabled: !o,
		open: o,
		ref: c,
		onComplete() {
			o || u(!1);
		}
	}), d;
})), nd = /*#__PURE__*/ y.forwardRef(function(e, t) {
	let { selected: n } = $u();
	return e.keepMounted || n ? /*#__PURE__*/ (0, Z.jsx)(td, {
		...e,
		selected: n,
		ref: t
	}) : null;
}), rd = /*#__PURE__*/ y.memo(/*#__PURE__*/ y.forwardRef(function(e, t) {
	let { index: n, textRef: r, selectedByFocus: i } = $u(), a = Ul(), { render: o, className: s, style: c, ...l } = e;
	return q("div", e, {
		ref: [
			y.useCallback((e) => {
				e && (n === 0 && (a.context.firstItemTextRef.current = e), i && (a.context.selectedItemTextRef.current = e));
			}, [
				a,
				n,
				i
			]),
			t,
			r
		],
		props: l
	});
})), id = /*#__PURE__*/ y.createContext(void 0);
function ad(e) {
	let t = y.useContext(id);
	if (!e && t === void 0) throw Error(v(27));
	return t;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/dialog/backdrop/DialogBackdrop.mjs
var od = /*#__PURE__*/ y.forwardRef(function(e, t) {
	let { render: n, className: r, style: i, forceRender: a = !1, ...o } = e, s = ad(), c = s.useState("open"), l = s.useState("nested"), u = s.useState("mounted");
	return q("div", e, {
		state: {
			open: c,
			transitionStatus: s.useState("transitionStatus")
		},
		ref: [s.context.backdropRef, t],
		stateAttributesMapping: Ne,
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
}), sd = /*#__PURE__*/ y.forwardRef(function(e, t) {
	let { render: n, className: r, style: i, disabled: a = !1, nativeButton: o = !0, ...s } = e, c = ad(), l = c.useState("open"), { getButtonProps: u, buttonRef: d } = zt({
		disabled: a,
		native: o
	}), f = { disabled: a };
	function p(e) {
		l && c.setOpen(!1, X(He, e.nativeEvent));
	}
	return q("button", e, {
		state: f,
		ref: [t, d],
		props: [
			{ onClick: p },
			s,
			u
		]
	});
}), cd = /*#__PURE__*/ y.forwardRef(function(e, t) {
	let { render: n, className: r, style: i, id: a, ...o } = e, s = ad(), c = hn(a);
	return s.useSyncedValueWithCleanup("descriptionElementId", c), q("p", e, {
		ref: t,
		props: [{ id: c }, o]
	});
}), ld = /*#__PURE__*/ y.createContext(void 0);
function ud() {
	let e = y.useContext(ld);
	if (e === void 0) throw Error(v(26));
	return e;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/dialog/popup/DialogPopupCssVars.mjs
var dd = "--nested-dialogs", fd = "data-nested-dialog-open", pd = {
	...Me,
	...ye,
	nestedDialogOpen(e) {
		return e ? { [fd]: "" } : null;
	}
}, md = /*#__PURE__*/ y.forwardRef(function(e, t) {
	let { render: n, className: r, style: i, finalFocus: a, initialFocus: o, ...s } = e, c = ad(), l = c.useState("descriptionElementId"), u = c.useState("disablePointerDismissal"), d = c.useState("floatingRootContext"), f = c.useState("popupProps"), p = c.useState("modal"), m = c.useState("mounted"), h = c.useState("nested"), g = c.useState("nestedOpenDialogCount"), _ = c.useState("open"), v = c.useState("openMethod"), y = c.useState("titleElementId"), b = c.useState("transitionStatus"), x = c.useState("role"), S = d.useState("floatingId");
	ud(), jn({
		open: _,
		ref: c.context.popupRef,
		onComplete() {
			_ && c.context.onOpenChangeComplete?.(!0);
		}
	});
	let C = o === void 0 ? Ta(c.context.popupRef) : o, w = g > 0, T = c.useStateSetter("popupElement"), E = q("div", e, {
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
				...wa,
				hidden: !m,
				onKeyDown(e) {
					Ks.has(e.key) && e.stopPropagation();
				},
				style: { [dd]: g }
			},
			s
		],
		ref: [
			t,
			c.context.popupRef,
			T
		],
		stateAttributesMapping: pd
	});
	return /*#__PURE__*/ (0, Z.jsx)(_a, {
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
}), hd = /*#__PURE__*/ y.forwardRef(function(e, t) {
	let { keepMounted: n = !1, ...r } = e, i = ad(), a = i.useState("mounted"), o = i.useState("modal"), s = i.useState("open");
	return a || n ? /*#__PURE__*/ (0, Z.jsx)(ld.Provider, {
		value: n,
		children: /*#__PURE__*/ (0, Z.jsxs)($i, {
			ref: t,
			...r,
			children: [a && o === !0 && /*#__PURE__*/ (0, Z.jsx)(Nc, {
				ref: i.context.internalBackdropRef,
				inert: oc(!s)
			}), e.children]
		})
	}) : null;
});
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/dialog/root/useDialogRoot.mjs
function gd({ store: e, parentContext: t, isDrawer: n }) {
	let r = e.useState("open"), i = e.useState("mounted"), a = e.useState("disablePointerDismissal"), o = e.useState("modal"), s = e.useState("popupElement"), c = e.useState("floatingRootContext"), [l, u] = y.useState(0), [d, f] = y.useState(0), p = l === 0, m = xa(c, {
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
			let n = Xn(t);
			if (p && !a) {
				if (o) {
					let t = e.context.internalBackdropRef.current, r = e.context.backdropRef.current;
					return t || r ? t === n || r === n || Q(n, s) && !n?.hasAttribute("data-base-ui-portal") : !0;
				}
				return !0;
			}
			return !1;
		},
		escapeKey: p
	});
	return Kc(r && o === !0, s), e.useContextCallback("onNestedDialogOpen", (t, n) => {
		(e.select("open") || e.select("mounted")) && (u(t), f(n));
	}), Y(() => {
		!r && !i && (u(0), f(0));
	}, [r, i]), Y(() => (t?.onNestedDialogOpen && r && t.onNestedDialogOpen(l + 1, d + +!!n), () => {
		t?.onNestedDialogOpen && r && t.onNestedDialogOpen(0, 0);
	}), [
		n,
		r,
		l,
		d,
		t
	]), Fa(e, {
		activeTriggerProps: m.reference,
		inactiveTriggerProps: m.trigger,
		popupProps: m.floating,
		nestedOpenDialogCount: l,
		nestedOpenDrawerCount: d
	}), null;
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/dialog/store/DialogStore.mjs
var _d = {
	...po,
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
}, vd = class extends ro {
	constructor(e, t, n) {
		let r = new La(), i = yd(e, r, t, n);
		super(i, bd(r), _d);
	}
	setOpen = (e, t) => {
		t.preventUnmountOnClose = () => {
			this.set("preventUnmountingOnClose", !0);
		}, !e && t.trigger == null && this.state.activeTriggerId != null && (t.trigger = this.state.activeTriggerElement ?? void 0), this.context.onOpenChange?.(e, t), !t.isCanceled && (this.state.floatingRootContext.dispatchOpenChange(e, t), this.update(Aa(this.state, e, t.trigger)));
	};
};
function yd(e, t, n, r = !1) {
	return {
		...oo(t, n, r),
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
function bd(e) {
	return {
		popupRef: /*#__PURE__*/ y.createRef(),
		backdropRef: /*#__PURE__*/ y.createRef(),
		internalBackdropRef: /*#__PURE__*/ y.createRef(),
		outsidePressEnabledRef: { current: !0 },
		triggerElements: e,
		onOpenChange: void 0,
		onOpenChangeComplete: void 0
	};
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/dialog/root/useRenderDialogRoot.mjs
function xd(e, t) {
	let { children: n, open: r, defaultOpen: i = !1, onOpenChange: a, onOpenChangeComplete: o, disablePointerDismissal: s = !1, modal: c = !0, actionsRef: l, handle: u, triggerId: d, defaultTriggerId: f = null } = t, p = e === "drawer", m = e === "alert-dialog", h = m ? !0 : c, g = m || s, _ = m ? "alertdialog" : "dialog", v = ad(!0), b = {
		modal: h,
		disablePointerDismissal: g,
		nested: v != null,
		role: _
	}, x = Ea((e, t) => new vd({
		open: i,
		openProp: r,
		activeTriggerId: f,
		triggerIdProp: d,
		...b
	}, e, t), !0);
	x.useControlledProp("openProp", r), x.useControlledProp("triggerIdProp", d), x.useSyncedValues(b), x.useContextCallback("onOpenChange", a), x.useContextCallback("onOpenChangeComplete", o);
	let S = x.useState("open"), C = x.useState("mounted"), w = x.useState("payload");
	Ia(x, S), Na(x);
	let { forceUnmount: T } = Pa(S, x);
	y.useImperativeHandle(l, () => ({
		unmount: T,
		close: () => x.setOpen(!1, X(Xe))
	}), [T, x]);
	let E = S || C || u != null;
	return /*#__PURE__*/ (0, Z.jsxs)(id.Provider, {
		value: x,
		children: [
			u && /*#__PURE__*/ (0, Z.jsx)(Da, {
				handle: u,
				store: x
			}),
			E && /*#__PURE__*/ (0, Z.jsx)(gd, {
				store: x,
				parentContext: v?.context,
				isDrawer: p
			}),
			typeof n == "function" ? n({ payload: w }) : n
		]
	});
}
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/dialog/root/DialogRoot.mjs
var Sd = Ka(function(e) {
	return xd("dialog", e);
}), Cd = /*#__PURE__*/ y.forwardRef(function(e, t) {
	let { render: n, className: r, style: i, children: a, ...o } = e, s = ud(), c = ad(), l = c.useState("open"), u = c.useState("nested"), d = c.useState("transitionStatus"), f = c.useState("nestedOpenDialogCount"), p = c.useState("mounted"), m = c.useStateSetter("viewportElement");
	return q("div", e, {
		enabled: s || p,
		state: {
			open: l,
			nested: u,
			transitionStatus: d,
			nestedDialogOpen: f > 0
		},
		ref: [t, m],
		stateAttributesMapping: pd,
		props: [{
			role: "presentation",
			hidden: !p,
			style: { pointerEvents: l ? void 0 : "none" },
			children: a
		}, o]
	});
}), wd = /*#__PURE__*/ y.forwardRef(function(e, t) {
	let { render: n, className: r, style: i, id: a, ...o } = e, s = ad(), c = hn(a);
	return s.useSyncedValueWithCleanup("titleElementId", c), q("h2", e, {
		ref: t,
		props: [{ id: c }, o]
	});
});
//#endregion
//#region node_modules/.pnpm/@base-ui+react@1.9.0_@types+react@19.3.0_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@base-ui/react/alert-dialog/root/AlertDialogRoot.mjs
function Td(e) {
	return xd("alert-dialog", e);
}
//#endregion
//#region design/air/collection-model.ts
var Ed = g();
function Dd(e = 5) {
	let t = [
		"A little more room.",
		"Morning light",
		"Quiet blue",
		"Notes for a slower Sunday — the complete, unabridged title",
		"Paper"
	], n = [
		"Text",
		"Image",
		"Shape",
		"Text",
		"Shape"
	];
	return {
		history: [{
			label: "Original layers",
			rows: Array.from({ length: e }, (e, r) => ({
				id: `layer-${r + 1}`,
				name: t[r] ?? `Study layer ${r + 1}`,
				kind: n[r % 5],
				visible: !0
			}))
		}],
		cursor: 0,
		selected: []
	};
}
function Od(e, t) {
	if (t.type === "reset") return Dd(t.count);
	let n = e.history[e.cursor].rows;
	if (t.type === "select") {
		let r = new Set(n.map((e) => e.id)), i = new Set(e.selected);
		for (let e of t.ids) t.checked && r.has(e) ? i.add(e) : i.delete(e);
		return {
			...e,
			selected: [...i]
		};
	}
	if (t.type === "jump") {
		if (t.cursor < 0 || t.cursor >= e.history.length) return e;
		let n = new Set(e.history[t.cursor].rows.map((e) => e.id));
		return {
			...e,
			cursor: t.cursor,
			selected: e.selected.filter((e) => n.has(e))
		};
	}
	let r = n, i = "";
	if (t.type === "remove") {
		let a = new Set(t.ids);
		if (r = n.filter((e) => !a.has(e.id)), r.length === n.length) return e;
		i = `Removed ${n.length - r.length} ${n.length - r.length === 1 ? "layer" : "layers"}`;
	} else {
		let a = n.findIndex((e) => e.id === t.id);
		if (a < 0) return e;
		let o = n[a];
		if (t.type === "rename") {
			let a = t.name.trim();
			if (!a || a.length > 160 || a === o.name) return e;
			r = n.map((e) => e.id === o.id ? {
				...e,
				name: a
			} : e), i = `Renamed ${a}`;
		} else if (t.type === "visibility") r = n.map((e) => e.id === o.id ? {
			...e,
			visible: !e.visible
		} : e), i = `${o.visible ? "Hid" : "Showed"} ${o.name}`;
		else if (t.type === "move") {
			let s = t.edge === "top" ? 0 : t.edge === "bottom" ? n.length - 1 : Math.max(0, Math.min(n.length - 1, a + (t.edge === "up" ? -1 : 1)));
			if (s === a) return e;
			r = [...n], r.splice(a, 1), r.splice(s, 0, o), i = `Moved ${o.name} to position ${s + 1}`;
		}
	}
	let a = [...e.history.slice(0, e.cursor + 1), {
		label: i,
		rows: r
	}];
	return {
		history: a,
		cursor: a.length - 1,
		selected: e.selected.filter((e) => r.some((t) => t.id === e))
	};
}
//#endregion
//#region design/air/collections.tsx
var kd = {
	sideOffset: 8,
	collisionPadding: 16,
	positionMethod: "fixed"
}, Ad = [
	"All layers",
	"Text",
	"Image",
	"Shape"
], jd = Ad.map((e) => ({
	value: e,
	label: e
}));
function Md({ type: e }) {
	return /* @__PURE__ */ (0, Z.jsx)("svg", {
		width: "18",
		height: "18",
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: "1.6",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		"aria-hidden": "true",
		children: e === "more" ? /* @__PURE__ */ (0, Z.jsxs)(Z.Fragment, { children: [
			/* @__PURE__ */ (0, Z.jsx)("circle", {
				cx: "5",
				cy: "12",
				r: "1"
			}),
			/* @__PURE__ */ (0, Z.jsx)("circle", {
				cx: "12",
				cy: "12",
				r: "1"
			}),
			/* @__PURE__ */ (0, Z.jsx)("circle", {
				cx: "19",
				cy: "12",
				r: "1"
			})
		] }) : e === "eye" ? /* @__PURE__ */ (0, Z.jsxs)(Z.Fragment, { children: [/* @__PURE__ */ (0, Z.jsx)("path", { d: "M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z" }), /* @__PURE__ */ (0, Z.jsx)("circle", {
			cx: "12",
			cy: "12",
			r: "3"
		})] }) : /* @__PURE__ */ (0, Z.jsx)("path", { d: e === "down" ? "m6 9 6 6 6-6" : e === "right" ? "m9 6 6 6-6 6" : "m5 12 4 4L19 6" })
	});
}
function Nd({ focusOnMount: e }) {
	let [t, n] = (0, y.useReducer)(Od, void 0, () => Dd()), [r, i] = (0, y.useState)(""), [a, o] = (0, y.useState)("All layers"), [s, c] = (0, y.useState)("Local layer study. No files are changed."), [l, u] = (0, y.useState)(null), [d, f] = (0, y.useState)(""), [p, m] = (0, y.useState)(!1), [h, g] = (0, y.useState)(!1), [_, v] = (0, y.useState)(!1), b = (0, y.useRef)(null), x = (0, y.useRef)(null), S = (0, y.useRef)(null), C = (0, y.useRef)(null), w = (0, y.useRef)(null), T = (0, y.useRef)(null), E = (0, y.useRef)(null), D = (0, y.useRef)(!1), O = (0, y.useRef)(!1), k = (0, y.useRef)(!1), A = t.history[t.cursor].rows, j = A.filter((e) => (a === "All layers" || e.kind === a) && e.name.toLocaleLowerCase().includes(r.trim().toLocaleLowerCase())), M = j.filter((e) => t.selected.includes(e.id)).length, N = !!r.trim() || a !== "All layers";
	(0, y.useLayoutEffect)(() => {
		b.current && (b.current.indeterminate = M > 0 && M < j.length);
	}, [M, j.length]), (0, y.useLayoutEffect)(() => {
		k.current &&= (w.current?.focus(), !1);
	}, [t.cursor]);
	function P(e) {
		let r = Od(t, e);
		e.type === "remove" && r !== t && (k.current = !0), n(e), r !== t && c(e.type === "jump" ? `Viewing: ${r.history[r.cursor].label}.` : `${r.history[r.cursor].label}. Undo is available.`);
	}
	function F(e) {
		n({
			type: "reset",
			count: e
		}), i(""), o("All layers"), c(`${e} sample layers loaded. The local study history was reset.`);
	}
	return /* @__PURE__ */ (0, Z.jsxs)(Z.Fragment, { children: [
		/* @__PURE__ */ (0, Z.jsxs)("div", {
			className: "air-collection-layout",
			children: [/* @__PURE__ */ (0, Z.jsxs)("section", {
				"aria-labelledby": "air-layers-title",
				children: [
					/* @__PURE__ */ (0, Z.jsxs)("div", {
						className: "air-collection-heading",
						children: [/* @__PURE__ */ (0, Z.jsxs)("div", { children: [/* @__PURE__ */ (0, Z.jsx)("h2", {
							id: "air-layers-title",
							children: "Layers"
						}), /* @__PURE__ */ (0, Z.jsx)("p", {
							className: "air-help",
							children: "Topmost first. Every move can be undone."
						})] }), /* @__PURE__ */ (0, Z.jsxs)("span", {
							className: "air-collection-count",
							children: [A.length, " total"]
						})]
					}),
					/* @__PURE__ */ (0, Z.jsxs)("div", {
						className: "air-collection-filters",
						children: [/* @__PURE__ */ (0, Z.jsxs)("label", {
							className: "air-label",
							children: ["Find a layer", /* @__PURE__ */ (0, Z.jsx)("input", {
								className: "air-field",
								type: "search",
								name: "layer-search",
								ref: T,
								autoFocus: e,
								placeholder: "Search by name…",
								value: r,
								onChange: (e) => i(e.target.value)
							})]
						}), /* @__PURE__ */ (0, Z.jsxs)("div", { children: [/* @__PURE__ */ (0, Z.jsx)("label", {
							className: "air-label",
							id: "air-kind-label",
							children: "Show"
						}), /* @__PURE__ */ (0, Z.jsxs)(yu, {
							value: a,
							onValueChange: (e) => {
								e && o(e);
							},
							items: jd,
							children: [/* @__PURE__ */ (0, Z.jsxs)(Tu, {
								className: "air-field air-select-trigger",
								"aria-labelledby": "air-kind-label",
								id: "air-kind",
								children: [/* @__PURE__ */ (0, Z.jsx)(Du, {}), /* @__PURE__ */ (0, Z.jsx)(Ou, {
									className: "air-select-icon",
									children: /* @__PURE__ */ (0, Z.jsx)(Md, { type: "down" })
								})]
							}), /* @__PURE__ */ (0, Z.jsx)(ku, { children: /* @__PURE__ */ (0, Z.jsx)(Fu, {
								...kd,
								className: "air-floating-positioner",
								align: "start",
								alignItemWithTrigger: !1,
								children: /* @__PURE__ */ (0, Z.jsx)(Uu, {
									className: "air-menu air-select-popup",
									children: /* @__PURE__ */ (0, Z.jsx)(Zu, { children: Ad.map((e) => /* @__PURE__ */ (0, Z.jsxs)(ed, {
										className: "air-menu-item",
										value: e,
										children: [/* @__PURE__ */ (0, Z.jsx)(rd, { children: e }), /* @__PURE__ */ (0, Z.jsx)(nd, {
											className: "air-menu-check",
											children: /* @__PURE__ */ (0, Z.jsx)(Md, { type: "check" })
										})]
									}, e)) })
								})
							}) })]
						})] })]
					}),
					/* @__PURE__ */ (0, Z.jsxs)("div", {
						className: "air-collection-selection",
						children: [/* @__PURE__ */ (0, Z.jsxs)("label", {
							className: "air-check-label",
							children: [/* @__PURE__ */ (0, Z.jsx)("input", {
								ref: b,
								className: "air-check",
								type: "checkbox",
								checked: j.length > 0 && M === j.length,
								disabled: !j.length,
								onChange: (e) => n({
									type: "select",
									ids: j.map((e) => e.id),
									checked: e.target.checked
								})
							}), "Select visible"]
						}), /* @__PURE__ */ (0, Z.jsxs)("p", {
							className: "air-help",
							role: "status",
							children: [
								t.selected.length,
								" selected",
								t.selected.length > M ? ` · ${t.selected.length - M} outside this view` : ""
							]
						})]
					}),
					/* @__PURE__ */ (0, Z.jsxs)("div", {
						className: "air-collection-actions",
						children: [
							/* @__PURE__ */ (0, Z.jsx)("button", {
								className: "air-button",
								disabled: !t.selected.length,
								onClick: () => {
									n({
										type: "select",
										ids: t.selected,
										checked: !1
									}), j.length ? b.current?.focus() : T.current?.focus();
								},
								children: "Clear selection"
							}),
							/* @__PURE__ */ (0, Z.jsxs)("button", {
								className: "air-button",
								disabled: !t.selected.length,
								onClick: () => {
									P({
										type: "remove",
										ids: t.selected
									});
								},
								children: [
									"Remove selected (",
									t.selected.length,
									")"
								]
							}),
							N && /* @__PURE__ */ (0, Z.jsx)("button", {
								className: "air-button air-button--quiet",
								onClick: () => {
									i(""), o("All layers"), T.current?.focus();
								},
								children: "Clear filters"
							})
						]
					}),
					N && /* @__PURE__ */ (0, Z.jsxs)("p", {
						className: "air-help",
						children: [j.length, " matching layers. Clear filters to change the stacking order."]
					}),
					/* @__PURE__ */ (0, Z.jsx)("ul", {
						className: "air-collection-list",
						"aria-label": "Layer stack",
						"data-long": A.length > 50,
						children: j.map((e) => {
							let r = A.findIndex((t) => t.id === e.id);
							return /* @__PURE__ */ (0, Z.jsxs)("li", {
								className: "air-collection-row",
								"data-selected": t.selected.includes(e.id),
								children: [/* @__PURE__ */ (0, Z.jsxs)("label", {
									className: "air-collection-choice",
									children: [
										/* @__PURE__ */ (0, Z.jsx)("input", {
											className: "air-check",
											type: "checkbox",
											checked: t.selected.includes(e.id),
											onChange: (t) => n({
												type: "select",
												ids: [e.id],
												checked: t.target.checked
											})
										}),
										/* @__PURE__ */ (0, Z.jsx)("span", {
											className: "air-layer-mark",
											"data-kind": e.kind,
											"aria-hidden": "true",
											children: e.kind === "Text" ? "Aa" : e.kind === "Image" ? /* @__PURE__ */ (0, Z.jsx)(Md, { type: "eye" }) : "◯"
										}),
										/* @__PURE__ */ (0, Z.jsxs)("span", {
											className: "air-collection-name",
											children: [/* @__PURE__ */ (0, Z.jsx)("span", { children: e.name }), /* @__PURE__ */ (0, Z.jsxs)("span", {
												className: "air-help",
												children: [
													e.kind,
													" · ",
													e.visible ? "Visible" : "Hidden"
												]
											})]
										})
									]
								}), /* @__PURE__ */ (0, Z.jsxs)("div", {
									className: "air-collection-row-actions",
									children: [/* @__PURE__ */ (0, Z.jsx)("button", {
										className: "air-icon-button air-button--quiet",
										"aria-label": `${e.visible ? "Hide" : "Show"} ${e.name}`,
										onClick: () => P({
											type: "visibility",
											id: e.id
										}),
										children: /* @__PURE__ */ (0, Z.jsx)(Md, { type: "eye" })
									}), /* @__PURE__ */ (0, Z.jsxs)(dl, { children: [/* @__PURE__ */ (0, Z.jsx)(Sl, {
										className: "air-icon-button air-button--quiet",
										"aria-label": `Actions for ${e.name}`,
										id: `actions-${e.id}`,
										children: /* @__PURE__ */ (0, Z.jsx)(Md, { type: "more" })
									}), /* @__PURE__ */ (0, Z.jsx)(ac, { children: /* @__PURE__ */ (0, Z.jsx)(Yc, {
										...kd,
										className: "air-floating-positioner",
										align: "end",
										children: /* @__PURE__ */ (0, Z.jsx)(nc, {
											className: "air-menu",
											finalFocus: () => D.current ? !1 : document.getElementById(`actions-${e.id}`) ?? w.current,
											children: /* @__PURE__ */ (0, Z.jsxs)(Fn, { children: [
												/* @__PURE__ */ (0, Z.jsx)(In, {
													className: "air-menu-label",
													children: "Layer actions"
												}),
												/* @__PURE__ */ (0, Z.jsx)(Rn, {
													className: "air-menu-item",
													onClick: (t) => {
														E.current = document.getElementById(`actions-${e.id}`), D.current = !0, O.current = !1, f(e.name), m(!1), v(t.detail > 0), u(e);
													},
													children: "Rename…"
												}),
												/* @__PURE__ */ (0, Z.jsxs)(pl, { children: [/* @__PURE__ */ (0, Z.jsxs)(Al, {
													className: "air-menu-item",
													disabled: N,
													openOnHover: !1,
													children: ["Arrange", /* @__PURE__ */ (0, Z.jsx)(Md, { type: "right" })]
												}), /* @__PURE__ */ (0, Z.jsx)(ac, { children: /* @__PURE__ */ (0, Z.jsx)(Yc, {
													...kd,
													className: "air-floating-positioner",
													children: /* @__PURE__ */ (0, Z.jsx)(nc, {
														className: "air-menu",
														children: [
															["up", "Move up"],
															["down", "Move down"],
															["top", "Move to top"],
															["bottom", "Move to bottom"]
														].map(([t, n]) => /* @__PURE__ */ (0, Z.jsx)(Rn, {
															className: "air-menu-item",
															disabled: t === "up" || t === "top" ? r === 0 : r === A.length - 1,
															onClick: () => P({
																type: "move",
																id: e.id,
																edge: t
															}),
															children: n
														}, t))
													})
												}) })] }),
												/* @__PURE__ */ (0, Z.jsx)(El, { className: "air-menu-separator" }),
												/* @__PURE__ */ (0, Z.jsx)(Rn, {
													className: "air-menu-item",
													onClick: () => P({
														type: "remove",
														ids: [e.id]
													}),
													children: "Remove layer"
												})
											] })
										})
									}) })] })]
								})]
							}, e.id);
						})
					}),
					!j.length && /* @__PURE__ */ (0, Z.jsxs)("div", {
						className: "air-collection-empty",
						children: [
							/* @__PURE__ */ (0, Z.jsx)("h3", { children: A.length ? "Nothing matches yet." : "A little room to begin again." }),
							/* @__PURE__ */ (0, Z.jsx)("p", {
								className: "air-help",
								children: A.length ? "Try another name or clear the filters. Your layers are still here." : "Undo brings your layers back, including their names and stacking order."
							}),
							!A.length && /* @__PURE__ */ (0, Z.jsx)("button", {
								className: "air-button",
								onClick: () => P({
									type: "jump",
									cursor: t.cursor - 1
								}),
								disabled: !t.cursor,
								children: "Undo removal"
							})
						]
					})
				]
			}), /* @__PURE__ */ (0, Z.jsxs)("aside", {
				className: "air-collection-history",
				"aria-labelledby": "air-history-title",
				children: [
					/* @__PURE__ */ (0, Z.jsx)("h2", {
						id: "air-history-title",
						children: "Your way back."
					}),
					/* @__PURE__ */ (0, Z.jsx)("p", {
						className: "air-help",
						children: "Return to any step. A new edit replaces the steps ahead of it."
					}),
					/* @__PURE__ */ (0, Z.jsxs)("div", {
						className: "air-collection-actions",
						children: [/* @__PURE__ */ (0, Z.jsx)("button", {
							className: "air-button",
							ref: w,
							"aria-disabled": !t.cursor,
							onClick: () => P({
								type: "jump",
								cursor: t.cursor - 1
							}),
							children: "Undo"
						}), /* @__PURE__ */ (0, Z.jsx)("button", {
							className: "air-button",
							"aria-disabled": t.cursor === t.history.length - 1,
							onClick: () => P({
								type: "jump",
								cursor: t.cursor + 1
							}),
							children: "Redo"
						})]
					}),
					/* @__PURE__ */ (0, Z.jsx)("ol", {
						className: "air-history-list",
						"aria-label": "Edit history",
						children: t.history.map((e, n) => /* @__PURE__ */ (0, Z.jsx)("li", { children: /* @__PURE__ */ (0, Z.jsxs)("button", {
							className: "air-history-step",
							"aria-current": t.cursor === n ? "step" : void 0,
							onClick: () => P({
								type: "jump",
								cursor: n
							}),
							children: [/* @__PURE__ */ (0, Z.jsx)("span", {
								className: "air-history-dot",
								"aria-hidden": "true"
							}), /* @__PURE__ */ (0, Z.jsxs)("span", { children: [e.label, /* @__PURE__ */ (0, Z.jsx)("span", {
								className: "air-help",
								children: n === t.cursor ? "Current step" : n > t.cursor ? "Ahead of current step" : `Step ${n + 1}`
							})] })]
						}) }, n))
					})
				]
			})]
		}),
		/* @__PURE__ */ (0, Z.jsx)("p", {
			className: "air-collection-status air-help",
			role: "status",
			children: s
		}),
		/* @__PURE__ */ (0, Z.jsxs)("details", {
			className: "air-contents air-collection-scenarios",
			children: [
				/* @__PURE__ */ (0, Z.jsx)("summary", { children: "Try a longer list" }),
				/* @__PURE__ */ (0, Z.jsx)("p", {
					className: "air-help",
					children: "Replace this local sample and reset its history."
				}),
				/* @__PURE__ */ (0, Z.jsxs)("div", {
					className: "air-collection-actions",
					children: [/* @__PURE__ */ (0, Z.jsx)("button", {
						className: "air-button",
						onClick: () => F(100),
						children: "Load 100 layers"
					}), /* @__PURE__ */ (0, Z.jsx)("button", {
						className: "air-button",
						onClick: () => F(5),
						children: "Reset sample"
					})]
				})
			]
		}),
		/* @__PURE__ */ (0, Z.jsx)(Sd, {
			open: !!l,
			onOpenChange: (e, t) => {
				v("detail" in t.event && Number(t.event.detail) > 0), e || (l && d !== l.name ? (t.cancel(), g(!0)) : u(null));
			},
			onOpenChangeComplete: (e) => {
				e || (D.current = !1);
			},
			children: /* @__PURE__ */ (0, Z.jsxs)(hd, { children: [/* @__PURE__ */ (0, Z.jsx)(od, { className: "air-modal-backdrop" }), /* @__PURE__ */ (0, Z.jsx)(Cd, {
				className: "air-modal-viewport",
				children: /* @__PURE__ */ (0, Z.jsxs)(md, {
					className: "air-modal",
					id: "air-layer-rename",
					ref: S,
					"data-air-motion": _ ? "pointer" : "immediate",
					initialFocus: (e) => e === "touch" || matchMedia("(pointer: coarse)").matches ? S.current : x.current,
					finalFocus: () => E.current?.isConnected ? E.current : w.current,
					children: [
						/* @__PURE__ */ (0, Z.jsx)(wd, {
							className: "air-floating-title",
							children: "A name that feels right."
						}),
						/* @__PURE__ */ (0, Z.jsx)(cd, {
							className: "air-help",
							children: "Rename this layer. The rest of your work stays in place."
						}),
						/* @__PURE__ */ (0, Z.jsxs)("form", {
							className: "air-modal-form",
							noValidate: !0,
							onSubmit: (e) => {
								if (e.preventDefault(), !d.trim()) {
									m(!0), x.current?.focus();
									return;
								}
								l && P({
									type: "rename",
									id: l.id,
									name: d
								}), u(null);
							},
							children: [
								/* @__PURE__ */ (0, Z.jsx)("label", {
									className: "air-label",
									htmlFor: "air-layer-name",
									children: "Layer name · required"
								}),
								/* @__PURE__ */ (0, Z.jsx)("input", {
									className: "air-field",
									id: "air-layer-name",
									name: "layer-name",
									autoComplete: "off",
									value: d,
									ref: x,
									maxLength: 160,
									required: !0,
									"aria-invalid": p,
									"aria-describedby": "air-layer-error",
									onChange: (e) => {
										f(e.target.value), m(!1);
									}
								}),
								/* @__PURE__ */ (0, Z.jsx)("p", {
									className: "air-help air-help--error",
									id: "air-layer-error",
									role: "status",
									children: p ? "Enter a name before saving." : ""
								}),
								/* @__PURE__ */ (0, Z.jsxs)("div", {
									className: "air-floating-actions",
									children: [/* @__PURE__ */ (0, Z.jsx)(sd, {
										className: "air-button",
										type: "button",
										children: "Cancel"
									}), /* @__PURE__ */ (0, Z.jsx)("button", {
										className: "air-button air-button--primary",
										type: "submit",
										onClick: (e) => v(e.detail > 0),
										children: "Save name"
									})]
								})
							]
						}),
						/* @__PURE__ */ (0, Z.jsx)(Td, {
							open: h,
							onOpenChange: g,
							children: /* @__PURE__ */ (0, Z.jsxs)(hd, { children: [/* @__PURE__ */ (0, Z.jsx)(od, {
								className: "air-modal-backdrop",
								"data-air-layer": "nested",
								forceRender: !0
							}), /* @__PURE__ */ (0, Z.jsx)(Cd, {
								className: "air-modal-viewport",
								"data-air-layer": "nested",
								children: /* @__PURE__ */ (0, Z.jsxs)(md, {
									className: "air-modal",
									id: "air-layer-discard",
									initialFocus: C,
									finalFocus: () => !O.current && x.current,
									children: [
										/* @__PURE__ */ (0, Z.jsx)(wd, {
											className: "air-floating-title",
											children: "Leave this name behind?"
										}),
										/* @__PURE__ */ (0, Z.jsx)(cd, {
											className: "air-help",
											children: "Your draft will be discarded. The layer keeps its current name."
										}),
										/* @__PURE__ */ (0, Z.jsxs)("div", {
											className: "air-floating-actions",
											children: [/* @__PURE__ */ (0, Z.jsx)(sd, {
												className: "air-button",
												ref: C,
												children: "Keep editing"
											}), /* @__PURE__ */ (0, Z.jsx)("button", {
												className: "air-button air-button--danger",
												onClick: () => {
													O.current = !0, g(!1), u(null);
												},
												children: "Discard name"
											})]
										})
									]
								})
							})] })
						})
					]
				})
			})] })
		})
	] });
}
function Pd(e, t = !1) {
	let n = (0, Ed.createRoot)(e);
	return n.render(/* @__PURE__ */ (0, Z.jsx)(Nd, { focusOnMount: t })), () => n.unmount();
}
//#endregion
export { Pd as mountCollectionStudy };
