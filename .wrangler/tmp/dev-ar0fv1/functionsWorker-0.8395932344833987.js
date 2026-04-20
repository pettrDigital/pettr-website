var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// ../.wrangler/tmp/pages-olIUHW/functionsWorker-0.8395932344833987.mjs
import { Writable } from "node:stream";
import { EventEmitter } from "node:events";
var __defProp2 = Object.defineProperty;
var __name2 = /* @__PURE__ */ __name((target, value) => __defProp2(target, "name", { value, configurable: true }), "__name");
// @__NO_SIDE_EFFECTS__
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
__name(createNotImplementedError, "createNotImplementedError");
__name2(createNotImplementedError, "createNotImplementedError");
// @__NO_SIDE_EFFECTS__
function notImplemented(name) {
  const fn = /* @__PURE__ */ __name2(() => {
    throw /* @__PURE__ */ createNotImplementedError(name);
  }, "fn");
  return Object.assign(fn, { __unenv__: true });
}
__name(notImplemented, "notImplemented");
__name2(notImplemented, "notImplemented");
// @__NO_SIDE_EFFECTS__
function notImplementedClass(name) {
  return class {
    __unenv__ = true;
    constructor() {
      throw new Error(`[unenv] ${name} is not implemented yet!`);
    }
  };
}
__name(notImplementedClass, "notImplementedClass");
__name2(notImplementedClass, "notImplementedClass");
var _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
var _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
var nodeTiming = {
  name: "node",
  entryType: "node",
  startTime: 0,
  duration: 0,
  nodeStart: 0,
  v8Start: 0,
  bootstrapComplete: 0,
  environment: 0,
  loopStart: 0,
  loopExit: 0,
  idleTime: 0,
  uvMetricsInfo: {
    loopCount: 0,
    events: 0,
    eventsWaiting: 0
  },
  detail: void 0,
  toJSON() {
    return this;
  }
};
var PerformanceEntry = class {
  static {
    __name(this, "PerformanceEntry");
  }
  static {
    __name2(this, "PerformanceEntry");
  }
  __unenv__ = true;
  detail;
  entryType = "event";
  name;
  startTime;
  constructor(name, options) {
    this.name = name;
    this.startTime = options?.startTime || _performanceNow();
    this.detail = options?.detail;
  }
  get duration() {
    return _performanceNow() - this.startTime;
  }
  toJSON() {
    return {
      name: this.name,
      entryType: this.entryType,
      startTime: this.startTime,
      duration: this.duration,
      detail: this.detail
    };
  }
};
var PerformanceMark = class PerformanceMark2 extends PerformanceEntry {
  static {
    __name(this, "PerformanceMark2");
  }
  static {
    __name2(this, "PerformanceMark");
  }
  entryType = "mark";
  constructor() {
    super(...arguments);
  }
  get duration() {
    return 0;
  }
};
var PerformanceMeasure = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceMeasure");
  }
  static {
    __name2(this, "PerformanceMeasure");
  }
  entryType = "measure";
};
var PerformanceResourceTiming = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceResourceTiming");
  }
  static {
    __name2(this, "PerformanceResourceTiming");
  }
  entryType = "resource";
  serverTiming = [];
  connectEnd = 0;
  connectStart = 0;
  decodedBodySize = 0;
  domainLookupEnd = 0;
  domainLookupStart = 0;
  encodedBodySize = 0;
  fetchStart = 0;
  initiatorType = "";
  name = "";
  nextHopProtocol = "";
  redirectEnd = 0;
  redirectStart = 0;
  requestStart = 0;
  responseEnd = 0;
  responseStart = 0;
  secureConnectionStart = 0;
  startTime = 0;
  transferSize = 0;
  workerStart = 0;
  responseStatus = 0;
};
var PerformanceObserverEntryList = class {
  static {
    __name(this, "PerformanceObserverEntryList");
  }
  static {
    __name2(this, "PerformanceObserverEntryList");
  }
  __unenv__ = true;
  getEntries() {
    return [];
  }
  getEntriesByName(_name, _type) {
    return [];
  }
  getEntriesByType(type) {
    return [];
  }
};
var Performance = class {
  static {
    __name(this, "Performance");
  }
  static {
    __name2(this, "Performance");
  }
  __unenv__ = true;
  timeOrigin = _timeOrigin;
  eventCounts = /* @__PURE__ */ new Map();
  _entries = [];
  _resourceTimingBufferSize = 0;
  navigation = void 0;
  timing = void 0;
  timerify(_fn, _options) {
    throw /* @__PURE__ */ createNotImplementedError("Performance.timerify");
  }
  get nodeTiming() {
    return nodeTiming;
  }
  eventLoopUtilization() {
    return {};
  }
  markResourceTiming() {
    return new PerformanceResourceTiming("");
  }
  onresourcetimingbufferfull = null;
  now() {
    if (this.timeOrigin === _timeOrigin) {
      return _performanceNow();
    }
    return Date.now() - this.timeOrigin;
  }
  clearMarks(markName) {
    this._entries = markName ? this._entries.filter((e) => e.name !== markName) : this._entries.filter((e) => e.entryType !== "mark");
  }
  clearMeasures(measureName) {
    this._entries = measureName ? this._entries.filter((e) => e.name !== measureName) : this._entries.filter((e) => e.entryType !== "measure");
  }
  clearResourceTimings() {
    this._entries = this._entries.filter((e) => e.entryType !== "resource" || e.entryType !== "navigation");
  }
  getEntries() {
    return this._entries;
  }
  getEntriesByName(name, type) {
    return this._entries.filter((e) => e.name === name && (!type || e.entryType === type));
  }
  getEntriesByType(type) {
    return this._entries.filter((e) => e.entryType === type);
  }
  mark(name, options) {
    const entry = new PerformanceMark(name, options);
    this._entries.push(entry);
    return entry;
  }
  measure(measureName, startOrMeasureOptions, endMark) {
    let start;
    let end;
    if (typeof startOrMeasureOptions === "string") {
      start = this.getEntriesByName(startOrMeasureOptions, "mark")[0]?.startTime;
      end = this.getEntriesByName(endMark, "mark")[0]?.startTime;
    } else {
      start = Number.parseFloat(startOrMeasureOptions?.start) || this.now();
      end = Number.parseFloat(startOrMeasureOptions?.end) || this.now();
    }
    const entry = new PerformanceMeasure(measureName, {
      startTime: start,
      detail: {
        start,
        end
      }
    });
    this._entries.push(entry);
    return entry;
  }
  setResourceTimingBufferSize(maxSize) {
    this._resourceTimingBufferSize = maxSize;
  }
  addEventListener(type, listener, options) {
    throw /* @__PURE__ */ createNotImplementedError("Performance.addEventListener");
  }
  removeEventListener(type, listener, options) {
    throw /* @__PURE__ */ createNotImplementedError("Performance.removeEventListener");
  }
  dispatchEvent(event) {
    throw /* @__PURE__ */ createNotImplementedError("Performance.dispatchEvent");
  }
  toJSON() {
    return this;
  }
};
var PerformanceObserver = class {
  static {
    __name(this, "PerformanceObserver");
  }
  static {
    __name2(this, "PerformanceObserver");
  }
  __unenv__ = true;
  static supportedEntryTypes = [];
  _callback = null;
  constructor(callback) {
    this._callback = callback;
  }
  takeRecords() {
    return [];
  }
  disconnect() {
    throw /* @__PURE__ */ createNotImplementedError("PerformanceObserver.disconnect");
  }
  observe(options) {
    throw /* @__PURE__ */ createNotImplementedError("PerformanceObserver.observe");
  }
  bind(fn) {
    return fn;
  }
  runInAsyncScope(fn, thisArg, ...args) {
    return fn.call(thisArg, ...args);
  }
  asyncId() {
    return 0;
  }
  triggerAsyncId() {
    return 0;
  }
  emitDestroy() {
    return this;
  }
};
var performance = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance();
if (!("__unenv__" in performance)) {
  const proto = Performance.prototype;
  for (const key of Object.getOwnPropertyNames(proto)) {
    if (key !== "constructor" && !(key in performance)) {
      const desc = Object.getOwnPropertyDescriptor(proto, key);
      if (desc) {
        Object.defineProperty(performance, key, desc);
      }
    }
  }
}
globalThis.performance = performance;
globalThis.Performance = Performance;
globalThis.PerformanceEntry = PerformanceEntry;
globalThis.PerformanceMark = PerformanceMark;
globalThis.PerformanceMeasure = PerformanceMeasure;
globalThis.PerformanceObserver = PerformanceObserver;
globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
globalThis.PerformanceResourceTiming = PerformanceResourceTiming;
var noop_default = Object.assign(() => {
}, { __unenv__: true });
var _console = globalThis.console;
var _ignoreErrors = true;
var _stderr = new Writable();
var _stdout = new Writable();
var log = _console?.log ?? noop_default;
var info = _console?.info ?? log;
var trace = _console?.trace ?? info;
var debug = _console?.debug ?? log;
var table = _console?.table ?? log;
var error = _console?.error ?? log;
var warn = _console?.warn ?? error;
var createTask = _console?.createTask ?? /* @__PURE__ */ notImplemented("console.createTask");
var clear = _console?.clear ?? noop_default;
var count = _console?.count ?? noop_default;
var countReset = _console?.countReset ?? noop_default;
var dir = _console?.dir ?? noop_default;
var dirxml = _console?.dirxml ?? noop_default;
var group = _console?.group ?? noop_default;
var groupEnd = _console?.groupEnd ?? noop_default;
var groupCollapsed = _console?.groupCollapsed ?? noop_default;
var profile = _console?.profile ?? noop_default;
var profileEnd = _console?.profileEnd ?? noop_default;
var time = _console?.time ?? noop_default;
var timeEnd = _console?.timeEnd ?? noop_default;
var timeLog = _console?.timeLog ?? noop_default;
var timeStamp = _console?.timeStamp ?? noop_default;
var Console = _console?.Console ?? /* @__PURE__ */ notImplementedClass("console.Console");
var _times = /* @__PURE__ */ new Map();
var _stdoutErrorHandler = noop_default;
var _stderrErrorHandler = noop_default;
var workerdConsole = globalThis["console"];
var {
  assert,
  clear: clear2,
  // @ts-expect-error undocumented public API
  context,
  count: count2,
  countReset: countReset2,
  // @ts-expect-error undocumented public API
  createTask: createTask2,
  debug: debug2,
  dir: dir2,
  dirxml: dirxml2,
  error: error2,
  group: group2,
  groupCollapsed: groupCollapsed2,
  groupEnd: groupEnd2,
  info: info2,
  log: log2,
  profile: profile2,
  profileEnd: profileEnd2,
  table: table2,
  time: time2,
  timeEnd: timeEnd2,
  timeLog: timeLog2,
  timeStamp: timeStamp2,
  trace: trace2,
  warn: warn2
} = workerdConsole;
Object.assign(workerdConsole, {
  Console,
  _ignoreErrors,
  _stderr,
  _stderrErrorHandler,
  _stdout,
  _stdoutErrorHandler,
  _times
});
var console_default = workerdConsole;
globalThis.console = console_default;
var hrtime = /* @__PURE__ */ Object.assign(/* @__PURE__ */ __name2(/* @__PURE__ */ __name(function hrtime2(startTime) {
  const now = Date.now();
  const seconds = Math.trunc(now / 1e3);
  const nanos = now % 1e3 * 1e6;
  if (startTime) {
    let diffSeconds = seconds - startTime[0];
    let diffNanos = nanos - startTime[0];
    if (diffNanos < 0) {
      diffSeconds = diffSeconds - 1;
      diffNanos = 1e9 + diffNanos;
    }
    return [diffSeconds, diffNanos];
  }
  return [seconds, nanos];
}, "hrtime2"), "hrtime"), { bigint: /* @__PURE__ */ __name2(/* @__PURE__ */ __name(function bigint() {
  return BigInt(Date.now() * 1e6);
}, "bigint"), "bigint") });
var ReadStream = class {
  static {
    __name(this, "ReadStream");
  }
  static {
    __name2(this, "ReadStream");
  }
  fd;
  isRaw = false;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  setRawMode(mode) {
    this.isRaw = mode;
    return this;
  }
};
var WriteStream = class {
  static {
    __name(this, "WriteStream");
  }
  static {
    __name2(this, "WriteStream");
  }
  fd;
  columns = 80;
  rows = 24;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  clearLine(dir3, callback) {
    callback && callback();
    return false;
  }
  clearScreenDown(callback) {
    callback && callback();
    return false;
  }
  cursorTo(x, y, callback) {
    callback && typeof callback === "function" && callback();
    return false;
  }
  moveCursor(dx, dy, callback) {
    callback && callback();
    return false;
  }
  getColorDepth(env2) {
    return 1;
  }
  hasColors(count3, env2) {
    return false;
  }
  getWindowSize() {
    return [this.columns, this.rows];
  }
  write(str, encoding, cb) {
    if (str instanceof Uint8Array) {
      str = new TextDecoder().decode(str);
    }
    try {
      console.log(str);
    } catch {
    }
    cb && typeof cb === "function" && cb();
    return false;
  }
};
var NODE_VERSION = "22.14.0";
var Process = class _Process extends EventEmitter {
  static {
    __name(this, "_Process");
  }
  static {
    __name2(this, "Process");
  }
  env;
  hrtime;
  nextTick;
  constructor(impl) {
    super();
    this.env = impl.env;
    this.hrtime = impl.hrtime;
    this.nextTick = impl.nextTick;
    for (const prop of [...Object.getOwnPropertyNames(_Process.prototype), ...Object.getOwnPropertyNames(EventEmitter.prototype)]) {
      const value = this[prop];
      if (typeof value === "function") {
        this[prop] = value.bind(this);
      }
    }
  }
  // --- event emitter ---
  emitWarning(warning, type, code) {
    console.warn(`${code ? `[${code}] ` : ""}${type ? `${type}: ` : ""}${warning}`);
  }
  emit(...args) {
    return super.emit(...args);
  }
  listeners(eventName) {
    return super.listeners(eventName);
  }
  // --- stdio (lazy initializers) ---
  #stdin;
  #stdout;
  #stderr;
  get stdin() {
    return this.#stdin ??= new ReadStream(0);
  }
  get stdout() {
    return this.#stdout ??= new WriteStream(1);
  }
  get stderr() {
    return this.#stderr ??= new WriteStream(2);
  }
  // --- cwd ---
  #cwd = "/";
  chdir(cwd2) {
    this.#cwd = cwd2;
  }
  cwd() {
    return this.#cwd;
  }
  // --- dummy props and getters ---
  arch = "";
  platform = "";
  argv = [];
  argv0 = "";
  execArgv = [];
  execPath = "";
  title = "";
  pid = 200;
  ppid = 100;
  get version() {
    return `v${NODE_VERSION}`;
  }
  get versions() {
    return { node: NODE_VERSION };
  }
  get allowedNodeEnvironmentFlags() {
    return /* @__PURE__ */ new Set();
  }
  get sourceMapsEnabled() {
    return false;
  }
  get debugPort() {
    return 0;
  }
  get throwDeprecation() {
    return false;
  }
  get traceDeprecation() {
    return false;
  }
  get features() {
    return {};
  }
  get release() {
    return {};
  }
  get connected() {
    return false;
  }
  get config() {
    return {};
  }
  get moduleLoadList() {
    return [];
  }
  constrainedMemory() {
    return 0;
  }
  availableMemory() {
    return 0;
  }
  uptime() {
    return 0;
  }
  resourceUsage() {
    return {};
  }
  // --- noop methods ---
  ref() {
  }
  unref() {
  }
  // --- unimplemented methods ---
  umask() {
    throw /* @__PURE__ */ createNotImplementedError("process.umask");
  }
  getBuiltinModule() {
    return void 0;
  }
  getActiveResourcesInfo() {
    throw /* @__PURE__ */ createNotImplementedError("process.getActiveResourcesInfo");
  }
  exit() {
    throw /* @__PURE__ */ createNotImplementedError("process.exit");
  }
  reallyExit() {
    throw /* @__PURE__ */ createNotImplementedError("process.reallyExit");
  }
  kill() {
    throw /* @__PURE__ */ createNotImplementedError("process.kill");
  }
  abort() {
    throw /* @__PURE__ */ createNotImplementedError("process.abort");
  }
  dlopen() {
    throw /* @__PURE__ */ createNotImplementedError("process.dlopen");
  }
  setSourceMapsEnabled() {
    throw /* @__PURE__ */ createNotImplementedError("process.setSourceMapsEnabled");
  }
  loadEnvFile() {
    throw /* @__PURE__ */ createNotImplementedError("process.loadEnvFile");
  }
  disconnect() {
    throw /* @__PURE__ */ createNotImplementedError("process.disconnect");
  }
  cpuUsage() {
    throw /* @__PURE__ */ createNotImplementedError("process.cpuUsage");
  }
  setUncaughtExceptionCaptureCallback() {
    throw /* @__PURE__ */ createNotImplementedError("process.setUncaughtExceptionCaptureCallback");
  }
  hasUncaughtExceptionCaptureCallback() {
    throw /* @__PURE__ */ createNotImplementedError("process.hasUncaughtExceptionCaptureCallback");
  }
  initgroups() {
    throw /* @__PURE__ */ createNotImplementedError("process.initgroups");
  }
  openStdin() {
    throw /* @__PURE__ */ createNotImplementedError("process.openStdin");
  }
  assert() {
    throw /* @__PURE__ */ createNotImplementedError("process.assert");
  }
  binding() {
    throw /* @__PURE__ */ createNotImplementedError("process.binding");
  }
  // --- attached interfaces ---
  permission = { has: /* @__PURE__ */ notImplemented("process.permission.has") };
  report = {
    directory: "",
    filename: "",
    signal: "SIGUSR2",
    compact: false,
    reportOnFatalError: false,
    reportOnSignal: false,
    reportOnUncaughtException: false,
    getReport: /* @__PURE__ */ notImplemented("process.report.getReport"),
    writeReport: /* @__PURE__ */ notImplemented("process.report.writeReport")
  };
  finalization = {
    register: /* @__PURE__ */ notImplemented("process.finalization.register"),
    unregister: /* @__PURE__ */ notImplemented("process.finalization.unregister"),
    registerBeforeExit: /* @__PURE__ */ notImplemented("process.finalization.registerBeforeExit")
  };
  memoryUsage = Object.assign(() => ({
    arrayBuffers: 0,
    rss: 0,
    external: 0,
    heapTotal: 0,
    heapUsed: 0
  }), { rss: /* @__PURE__ */ __name2(() => 0, "rss") });
  // --- undefined props ---
  mainModule = void 0;
  domain = void 0;
  // optional
  send = void 0;
  exitCode = void 0;
  channel = void 0;
  getegid = void 0;
  geteuid = void 0;
  getgid = void 0;
  getgroups = void 0;
  getuid = void 0;
  setegid = void 0;
  seteuid = void 0;
  setgid = void 0;
  setgroups = void 0;
  setuid = void 0;
  // internals
  _events = void 0;
  _eventsCount = void 0;
  _exiting = void 0;
  _maxListeners = void 0;
  _debugEnd = void 0;
  _debugProcess = void 0;
  _fatalException = void 0;
  _getActiveHandles = void 0;
  _getActiveRequests = void 0;
  _kill = void 0;
  _preload_modules = void 0;
  _rawDebug = void 0;
  _startProfilerIdleNotifier = void 0;
  _stopProfilerIdleNotifier = void 0;
  _tickCallback = void 0;
  _disconnect = void 0;
  _handleQueue = void 0;
  _pendingMessage = void 0;
  _channel = void 0;
  _send = void 0;
  _linkedBinding = void 0;
};
var globalProcess = globalThis["process"];
var getBuiltinModule = globalProcess.getBuiltinModule;
var workerdProcess = getBuiltinModule("node:process");
var unenvProcess = new Process({
  env: globalProcess.env,
  hrtime,
  // `nextTick` is available from workerd process v1
  nextTick: workerdProcess.nextTick
});
var { exit, features, platform } = workerdProcess;
var {
  _channel,
  _debugEnd,
  _debugProcess,
  _disconnect,
  _events,
  _eventsCount,
  _exiting,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _handleQueue,
  _kill,
  _linkedBinding,
  _maxListeners,
  _pendingMessage,
  _preload_modules,
  _rawDebug,
  _send,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  arch,
  argv,
  argv0,
  assert: assert2,
  availableMemory,
  binding,
  channel,
  chdir,
  config,
  connected,
  constrainedMemory,
  cpuUsage,
  cwd,
  debugPort,
  disconnect,
  dlopen,
  domain,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exitCode,
  finalization,
  getActiveResourcesInfo,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getMaxListeners,
  getuid,
  hasUncaughtExceptionCaptureCallback,
  hrtime: hrtime3,
  initgroups,
  kill,
  listenerCount,
  listeners,
  loadEnvFile,
  mainModule,
  memoryUsage,
  moduleLoadList,
  nextTick,
  off,
  on,
  once,
  openStdin,
  permission,
  pid,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  reallyExit,
  ref,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  send,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setMaxListeners,
  setSourceMapsEnabled,
  setuid,
  setUncaughtExceptionCaptureCallback,
  sourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  throwDeprecation,
  title,
  traceDeprecation,
  umask,
  unref,
  uptime,
  version,
  versions
} = unenvProcess;
var _process = {
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  hasUncaughtExceptionCaptureCallback,
  setUncaughtExceptionCaptureCallback,
  loadEnvFile,
  sourceMapsEnabled,
  arch,
  argv,
  argv0,
  chdir,
  config,
  connected,
  constrainedMemory,
  availableMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  disconnect,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exit,
  finalization,
  features,
  getBuiltinModule,
  getActiveResourcesInfo,
  getMaxListeners,
  hrtime: hrtime3,
  kill,
  listeners,
  listenerCount,
  memoryUsage,
  nextTick,
  on,
  off,
  once,
  pid,
  platform,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  setMaxListeners,
  setSourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  title,
  throwDeprecation,
  traceDeprecation,
  umask,
  uptime,
  version,
  versions,
  // @ts-expect-error old API
  domain,
  initgroups,
  moduleLoadList,
  reallyExit,
  openStdin,
  assert: assert2,
  binding,
  send,
  exitCode,
  channel,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getuid,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setuid,
  permission,
  mainModule,
  _events,
  _eventsCount,
  _exiting,
  _maxListeners,
  _debugEnd,
  _debugProcess,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _kill,
  _preload_modules,
  _rawDebug,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  _disconnect,
  _handleQueue,
  _pendingMessage,
  _channel,
  _send,
  _linkedBinding
};
var process_default = _process;
globalThis.process = process_default;
async function onRequest(context2) {
  const { env: env2 } = context2;
  return new Response(JSON.stringify({
    googleMapsApiKey: env2.GOOGLE_MAPS_API_KEY
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
__name(onRequest, "onRequest");
__name2(onRequest, "onRequest");
var SYDNEY_POSTCODES = /* @__PURE__ */ new Set([
  // Sydney CBD & Inner
  2e3,
  2001,
  2002,
  2003,
  2004,
  2006,
  2007,
  2008,
  2009,
  2010,
  2011,
  2015,
  2016,
  2017,
  2018,
  2019,
  2020,
  2021,
  // Inner West
  2022,
  2023,
  2024,
  2025,
  2026,
  2027,
  2028,
  2029,
  2030,
  2031,
  2032,
  2033,
  2034,
  2035,
  2036,
  2037,
  2038,
  2039,
  2040,
  2041,
  2042,
  2043,
  2044,
  2045,
  2046,
  2047,
  2048,
  2049,
  2050,
  // North Shore / Northern Beaches
  2060,
  2061,
  2062,
  2063,
  2064,
  2065,
  2066,
  2067,
  2068,
  2069,
  2070,
  2071,
  2072,
  2073,
  2074,
  2075,
  2076,
  2077,
  2079,
  2080,
  2081,
  2082,
  2083,
  2084,
  2085,
  2086,
  2087,
  2088,
  2089,
  2090,
  2092,
  2093,
  2094,
  2095,
  2096,
  2097,
  2098,
  2099,
  2100,
  2101,
  2102,
  2103,
  2104,
  2105,
  2106,
  2107,
  2108,
  2109,
  2110,
  2111,
  2112,
  2113,
  2114,
  2115,
  2116,
  2117,
  2118,
  2119,
  2120,
  2121,
  2122,
  2123,
  // Hills / Hawkesbury
  2124,
  2125,
  2126,
  2127,
  2128,
  2129,
  2130,
  2131,
  2132,
  2133,
  2134,
  2135,
  2136,
  2137,
  2138,
  2139,
  2140,
  2141,
  2142,
  2143,
  2144,
  2145,
  2146,
  2147,
  2148,
  2150,
  2151,
  2152,
  2153,
  2154,
  2155,
  2156,
  2157,
  2158,
  2159,
  2160,
  2161,
  2162,
  2163,
  2164,
  2165,
  2166,
  2167,
  2168,
  2170,
  2171,
  2172,
  2173,
  2174,
  2175,
  2176,
  2177,
  2178,
  2179,
  // South / Sutherland Shire
  2190,
  2191,
  2192,
  2193,
  2194,
  2195,
  2196,
  2197,
  2198,
  2199,
  2200,
  2203,
  2204,
  2205,
  2206,
  2207,
  2208,
  2209,
  2210,
  2211,
  2212,
  2213,
  2214,
  2216,
  2217,
  2218,
  2219,
  2220,
  2221,
  2222,
  2223,
  2224,
  2225,
  2226,
  2227,
  2228,
  2229,
  2230,
  2231,
  2232,
  2233,
  2234,
  2560,
  2563,
  2564,
  2565,
  2566,
  2567,
  2568,
  2569,
  2570,
  // Western Sydney / Parramatta / Penrith
  2745,
  2747,
  2748,
  2749,
  2750,
  2751,
  2752,
  2753,
  2754,
  2755,
  2756,
  2757,
  2758,
  2759,
  2760,
  2761,
  2762,
  2763,
  2765,
  2766,
  2767,
  2768,
  2769,
  2770,
  2773,
  2774,
  2775,
  2776,
  2777,
  2778,
  2779,
  2780,
  2782,
  2783,
  2784,
  2785,
  2786,
  2787,
  2790,
  // South-West / Campbelltown / Liverpool
  2557,
  2558,
  2559,
  2561,
  2562,
  2571,
  2572,
  2573,
  2574,
  2575,
  2576
]);
function isInServiceArea(postcodeRaw) {
  const pc = parseInt(String(postcodeRaw).replace(/\D/g, ""), 10);
  return !isNaN(pc) && SYDNEY_POSTCODES.has(pc);
}
__name(isInServiceArea, "isInServiceArea");
__name2(isInServiceArea, "isInServiceArea");
var retellSetupDone = false;
async function setupRetellFunctions(env2) {
  if (retellSetupDone) return;
  retellSetupDone = true;
  const apiKey = env2.RETELL_API_KEY;
  const outboundAgentId = "agent_ae39eceb83f12b6a4fcdfd4c89";
  if (!apiKey) return;
  try {
    const functions = [
      {
        name: "get_available_slots",
        description: "Get available appointment slots for a given trade",
        parameters: {
          type: "object",
          properties: {
            trade: { type: "string", enum: ["plumbing", "electrical"] }
          },
          required: ["trade"]
        }
      },
      {
        name: "create_afterhours_job",
        description: "Create an emergency after-hours job",
        parameters: {
          type: "object",
          properties: {
            caller_phone: { type: "string" },
            first_name: { type: "string" },
            last_name: { type: "string" },
            trade: { type: "string", enum: ["plumbing", "electrical"] },
            description: { type: "string" },
            street_address: { type: "string" },
            suburb: { type: "string" },
            postcode: { type: "string" },
            client_id: { type: "string", nullable: true }
          },
          required: ["caller_phone", "first_name", "last_name", "trade", "description", "street_address", "suburb", "postcode"]
        }
      },
      {
        name: "create_standard_job",
        description: "Create a standard business hours job",
        parameters: {
          type: "object",
          properties: {
            caller_phone: { type: "string" },
            first_name: { type: "string" },
            last_name: { type: "string" },
            trade: { type: "string", enum: ["plumbing", "electrical"] },
            description: { type: "string" },
            street_address: { type: "string" },
            suburb: { type: "string" },
            postcode: { type: "string" },
            client_id: { type: "string", nullable: true },
            scheduled_date: { type: "string", nullable: true },
            scheduled_time: { type: "string", nullable: true }
          },
          required: ["caller_phone", "first_name", "last_name", "trade", "description", "street_address", "suburb", "postcode"]
        }
      }
    ];
    await fetch(`https://api.retellai.com/v2/agents/${outboundAgentId}`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ functions })
    }).catch((err) => console.warn("Retell setup warning:", err.message));
  } catch (err) {
    console.warn("Retell function setup failed:", err.message);
  }
}
__name(setupRetellFunctions, "setupRetellFunctions");
__name2(setupRetellFunctions, "setupRetellFunctions");
async function onRequest2(context2) {
  await setupRetellFunctions(context2.env);
  const { request, env: env2 } = context2;
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  try {
    const formData = await request.formData();
    const requestType = formData.get("requestType");
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      address: formData.get("address"),
      postcode: formData.get("postcode"),
      suburb: formData.get("suburb"),
      message: formData.get("message"),
      requestType
    };
    if (!data.name || !data.phone || !data.address || !data.postcode || !data.suburb || !data.message || !requestType) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    if ((requestType === "callback" || requestType === "bookNow") && !data.email) {
      return new Response(JSON.stringify({ error: "Email is required for this request type" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    if (requestType === "bookNow") {
      const serviceType = formData.get("bookNowServiceType");
      const urgency = formData.get("bookNowUrgency");
      const ownership = formData.get("bookNowOwnership");
      const appliance = formData.get("bookNowAppliance");
      const slot = formData.get("bookNowSlot");
      if (!serviceType || !urgency || !ownership || !appliance) {
        return new Response(JSON.stringify({ error: "Missing booking details" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
      if (urgency === "standard" && !slot) {
        return new Response(JSON.stringify({ error: "Time slot is required for standard bookings" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
      data.bookNowServiceType = serviceType;
      data.bookNowUrgency = urgency;
      data.bookNowOwnership = ownership;
      data.bookNowAppliance = appliance;
      if (slot) {
        data.bookNowSlot = JSON.parse(slot);
      }
    }
    if (!isInServiceArea(data.postcode)) {
      return new Response(JSON.stringify({ error: "Sorry, we do not service that postcode. Please visit service-areas.html to view our service areas." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    if (data.requestType === "callback") {
      const suburb = data.suburb ? `, ${escapeHtml(data.suburb)}` : "";
      const emailHtml = `
        <h2>New Quote Request - Call Back</h2>
        <p><strong>Name:</strong> ${escapeHtml(data.name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(data.email)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(data.phone)}</p>
        <p><strong>Address:</strong> ${escapeHtml(data.address)}${suburb} ${escapeHtml(data.postcode)}</p>
        <p><strong>Message:</strong> ${escapeHtml(data.message).replace(/\n/g, "<br>")}</p>
      `;
      await sendEmail(env2, {
        from: "webform@plumberandelectrician.com.au",
        to: env2.QUOTE_EMAIL,
        subject: `New Quote Request from ${data.name}`,
        html: emailHtml
      });
      console.log("Triggering Retell callback for:", data.phone);
      const trade = data.message.toLowerCase().includes("electrical") ? "electrical" : "plumbing";
      await triggerRetellCallback(env2, {
        phone: data.phone,
        name: data.name,
        address: data.address,
        suburb: data.suburb,
        postcode: data.postcode,
        message: data.message,
        trade
      });
    } else if (data.requestType === "bookNow") {
      console.log("=== INSTANT BOOKING INITIATED ===");
      const trade = data.bookNowServiceType;
      const suburbStr = data.suburb ? ` ${data.suburb}` : "";
      if (data.bookNowUrgency === "tonight") {
        const smsMessage = `Hi ${data.name}, emergency ${trade} booking received at ${data.address}${suburbStr} ${data.postcode}. A tech will call you back within 5-10 minutes. Thanks!`;
        await sendBookingSMS(env2, {
          phone: data.phone,
          message: smsMessage
        });
        console.log("Emergency booking receipt SMS sent to:", data.phone);
      } else {
        const slot = data.bookNowSlot;
        const smsMessage = `Hi ${data.name}, your ${trade} booking is confirmed!

Time: ${slot.day} ${slot.start_time}-${slot.end_time}
Address: ${data.address}${suburbStr} ${data.postcode}
Issue: ${data.message}

Tech will call 30min before arrival.`;
        await sendBookingSMS(env2, {
          phone: data.phone,
          message: smsMessage
        });
        console.log("Standard booking confirmation SMS sent to:", data.phone);
      }
      const suburbDisplay = data.suburb ? `, ${escapeHtml(data.suburb)}` : "";
      let emailHtml = `
        <h2>New Instant Booking</h2>
        <p><strong>Name:</strong> ${escapeHtml(data.name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(data.email)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(data.phone)}</p>
        <p><strong>Address:</strong> ${escapeHtml(data.address)}${suburbDisplay} ${escapeHtml(data.postcode)}</p>
        <p><strong>Issue:</strong> ${escapeHtml(data.message)}</p>
        <p><strong>Service Type:</strong> ${escapeHtml(trade)}</p>
        <p><strong>Urgency:</strong> ${data.bookNowUrgency === "tonight" ? "Emergency - $549 call our fee including first 1/2 hour labour" : "Standard Business Hours"}</p>
        <p><strong>Homeowner/Tenant:</strong> ${data.bookNowOwnership}</p>
        <p><strong>Appliance Type:</strong> ${data.bookNowAppliance}</p>
      `;
      if (data.bookNowSlot) {
        const slot = data.bookNowSlot;
        emailHtml += `
        <p><strong>Booked Slot:</strong> ${slot.day} ${slot.start_time}-${slot.end_time}</p>
        `;
      }
      emailHtml += `</div>`;
      await sendEmail(env2, {
        from: "webform@plumberandelectrician.com.au",
        to: "fergusg@mrwasher.com.au",
        subject: `New Instant Booking - ${data.name}`,
        html: emailHtml
      });
      console.log("Booking email sent to support");
    }
    return new Response(JSON.stringify({ success: true, message: "Quote request submitted. We will call you shortly!" }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (error3) {
    console.error("Error:", error3);
    return new Response(JSON.stringify({ error: error3.message || "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequest2, "onRequest2");
__name2(onRequest2, "onRequest");
async function sendEmail(env2, { from, to, subject, html }) {
  const apiKey = env2.SMTP2GO_API_KEY;
  console.log("=== EMAIL DEBUG ===");
  console.log("To address:", to);
  console.log("From address:", from);
  console.log("Subject:", subject);
  const requestBody = {
    api_key: apiKey,
    to: [to],
    sender: from,
    subject,
    html_body: html
  };
  console.log("Request body:", JSON.stringify(requestBody));
  const response = await fetch("https://api.smtp2go.com/v3/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody)
  });
  const responseText = await response.text();
  console.log("SMTP2Go response:", responseText);
  if (!response.ok) {
    throw new Error(`SMTP2Go error: ${response.status} ${responseText}`);
  }
  return JSON.parse(responseText);
}
__name(sendEmail, "sendEmail");
__name2(sendEmail, "sendEmail");
async function triggerRetellCallback(env2, { phone, name, address, suburb, postcode, message, trade }) {
  console.log("=== RETELL CALLBACK ===");
  console.log("Phone:", phone);
  console.log("Name:", name);
  console.log("Address:", address);
  console.log("Suburb:", suburb);
  console.log("Postcode:", postcode);
  console.log("Message:", message);
  console.log("Trade:", trade);
  const retellApiKey = env2.RETELL_API_KEY;
  const retellAgentId = env2.RETELL_AGENT_ID;
  const retellFromNumber = env2.RETELL_FROM_NUMBER;
  console.log("Env check:", {
    hasApiKey: !!retellApiKey,
    hasAgentId: !!retellAgentId,
    hasFromNumber: !!retellFromNumber,
    fromNumberValue: retellFromNumber
  });
  if (!retellApiKey || !retellAgentId || !retellFromNumber) {
    throw new Error(`Retell config missing: apiKey=${!!retellApiKey}, agentId=${!!retellAgentId}, fromNumber=${!!retellFromNumber}, fromNumberValue="${retellFromNumber}"`);
  }
  let toNumber = phone.replace(/\D/g, "");
  let fromNumber = retellFromNumber;
  console.log("Raw phone input:", phone);
  console.log("toNumber after removing non-digits:", toNumber);
  if (toNumber.startsWith("0")) {
    toNumber = "61" + toNumber.slice(1);
  }
  if (!toNumber.startsWith("+")) {
    toNumber = "+" + toNumber;
  }
  if (!fromNumber.startsWith("+")) {
    fromNumber = "+" + fromNumber;
  }
  console.log("Calling from:", fromNumber, "to:", toNumber);
  const payload = {
    agent_id: retellAgentId,
    from_number: fromNumber,
    to_number: toNumber,
    variables: {
      first_name: name ? name.split(" ")[0] : "",
      last_name: name ? name.split(" ").slice(1).join(" ") : "",
      phone,
      street_address: address || "",
      suburb: suburb || "",
      postcode: postcode || "",
      description: message || "",
      trade: trade || ""
    }
  };
  console.log("Payload:", JSON.stringify(payload));
  const response = await fetch("https://api.retellai.com/v2/create-phone-call", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${retellApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  const responseText = await response.text();
  console.log("Retell response status:", response.status);
  console.log("Retell response text:", responseText);
  let result;
  try {
    result = JSON.parse(responseText);
  } catch (e) {
    console.log("Failed to parse Retell response as JSON");
    throw new Error(`Retell API error: ${response.status} - ${responseText}`);
  }
  if (!response.ok) {
    throw new Error(`Retell API error: ${response.status} - payload: ${JSON.stringify(payload)} - response: ${JSON.stringify(result)}`);
  }
  return result;
}
__name(triggerRetellCallback, "triggerRetellCallback");
__name2(triggerRetellCallback, "triggerRetellCallback");
async function sendBookingSMS(env2, { phone, message }) {
  console.log("=== SENDING BOOKING SMS ===");
  console.log("To:", phone);
  console.log("Message length:", message.length);
  const apiKey = env2.TRANSMITSMS_API_KEY;
  const apiSecret = env2.TRANSMITSMS_API_SECRET;
  console.log("API Key present:", !!apiKey);
  console.log("API Secret present:", !!apiSecret);
  if (!apiKey || !apiSecret) {
    console.error("SMS credentials not configured");
    throw new Error("SMS credentials not configured");
  }
  const credentials = btoa(`${apiKey}:${apiSecret}`);
  const formData = new URLSearchParams();
  formData.append("to", phone);
  formData.append("message", message);
  formData.append("countrycode", "au");
  console.log("Sending to Transmit SMS API...");
  const response = await fetch("https://api.transmitsms.com/send-sms.json", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "text/plain"
    },
    body: formData.toString()
  });
  const responseText = await response.text();
  console.log("SMS response status:", response.status);
  console.log("SMS response:", responseText.substring(0, 200));
  if (!response.ok) {
    console.error("SMS error - status:", response.status);
    console.error("SMS error - body:", responseText);
    throw new Error(`SMS error: ${response.status}`);
  }
  console.log("SMS sent successfully");
  return responseText;
}
__name(sendBookingSMS, "sendBookingSMS");
__name2(sendBookingSMS, "sendBookingSMS");
function escapeHtml(text) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
__name(escapeHtml, "escapeHtml");
__name2(escapeHtml, "escapeHtml");
async function onRequest3(context2) {
  const { request } = context2;
  console.log("=== SLOTS API REQUEST ===");
  console.log("Method:", request.method);
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  try {
    const { trade } = await request.json();
    console.log("Trade:", trade);
    if (!trade || !["plumbing", "electrical"].includes(trade)) {
      return new Response(JSON.stringify({ error: "Invalid trade" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    console.log("Fetching slots from AroFlo for trade:", trade);
    const response = await fetch("https://us-central1-pettrdashboards.cloudfunctions.net/aroFloAgent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "get_available_slots",
        arguments: { trade }
      })
    });
    console.log("AroFlo response status:", response.status);
    const responseText = await response.text();
    console.log("AroFlo response body:", responseText.substring(0, 500));
    if (!response.ok) {
      console.error("AroFlo API error:", response.status, responseText);
      return new Response(JSON.stringify({ slots: [], error: "Unable to fetch available slots" }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
    const data = JSON.parse(responseText);
    console.log("Slots found:", data.slots?.length || 0);
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error3) {
    console.error("=== SLOTS API ERROR ===");
    console.error("Error message:", error3.message);
    console.error("Error stack:", error3.stack);
    return new Response(JSON.stringify({ slots: [], error: error3.message }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequest3, "onRequest3");
__name2(onRequest3, "onRequest");
async function onRequest4(context2) {
  const { request, env: env2 } = context2;
  console.log("=== SMS WEBHOOK RECEIVED ===");
  console.log("Method:", request.method);
  if (request.method !== "POST") {
    console.log("Not POST, rejecting");
    return new Response("Method not allowed", { status: 405 });
  }
  try {
    const json = await request.json();
    console.log("Webhook payload:", JSON.stringify(json));
    let message, phone;
    if (json.event_type === "SMS_INBOUND" && json.mo) {
      message = json.mo.message;
      phone = json.mo.sender;
    } else {
      message = json.message || json.mo?.message;
      phone = json.phone || json.sender || json.mo?.sender;
    }
    console.log("Parsed - Phone:", phone, "Message:", message);
    if (!message || !phone) {
      console.log("Missing message or phone");
      return new Response(JSON.stringify({ error: "Missing message or phone" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    console.log("=== INBOUND SMS RECEIVED ===");
    console.log("Phone:", phone);
    console.log("Message:", message);
    console.log("Timestamp:", (/* @__PURE__ */ new Date()).toISOString());
    if (!env2.FIREBASE_API_KEY || !env2.FIREBASE_PROJECT_ID) {
      console.error("Firebase configuration incomplete");
      return new Response(JSON.stringify({ error: "Firebase not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
    console.log("Checking for active booking flow...");
    const bookingFlow = await getFirestoreDoc(env2, "booking_flows", phone);
    if (bookingFlow && bookingFlow.step) {
      console.log("Found active booking flow, step:", bookingFlow.step);
      return handleOutboundBookingFlow(env2, phone, message, bookingFlow);
    }
    console.log("Fetching conversation for phone:", phone);
    const conversationData = await getFirestoreDoc(env2, "conversations", phone);
    console.log("Conversation data:", conversationData);
    const messages = conversationData?.messages || [];
    messages.push({
      role: "user",
      text: message,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
    console.log("Fetching available slots...");
    const trade = conversationData?.problem?.toLowerCase().includes("electrical") ? "electrical" : "plumbing";
    const availableSlots = await getAvailableSlots(trade);
    console.log("Available slots:", availableSlots.length);
    console.log("Calling Claude API...");
    const claudeResponse = await callClaude(env2, {
      name: conversationData?.name || "Customer",
      problem: conversationData?.problem || "Not specified",
      address: conversationData?.address || "",
      postcode: conversationData?.postcode || "",
      trade,
      availableSlots: availableSlots.slice(0, 3),
      // Top 3 slots
      messages: messages.map((m) => ({ role: m.role, content: m.text }))
    });
    console.log("Claude response:", claudeResponse);
    messages.push({
      role: "assistant",
      text: claudeResponse,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
    await updateFirestoreDoc(env2, "conversations", phone, {
      messages,
      lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
    });
    await sendSMS(env2, {
      phone,
      message: claudeResponse
    });
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error3) {
    console.error("Webhook error:", error3);
    return new Response(JSON.stringify({ error: error3.message || "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequest4, "onRequest4");
__name2(onRequest4, "onRequest");
async function handleOutboundBookingFlow(env2, phone, message, bookingFlow) {
  const step = bookingFlow.step;
  const isYes = message.toLowerCase().trim() === "yes";
  addMessageToConversation(env2, phone, "user", message).catch((err) => console.error("Failed to save user message:", err));
  try {
    if (step === "message_1_sent") {
      const choice = message.toLowerCase().trim();
      if (choice === "tonight") {
        const responseMsg = `After-hours booking confirmed. Tech will call back within 5-10 mins. Call-out fee $549. Confirm? YES/NO`;
        await sendOutboundSMS(env2, { phone, message: responseMsg });
        addMessageToConversation(env2, phone, "assistant", responseMsg).catch((err) => console.error("Failed to save assistant message:", err));
        await updateBookingFlowStep(env2, phone, "emergency_confirm_sent");
        return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json" } });
      } else if (choice === "standard") {
        const slots = await getAvailableSlots(bookingFlow.trade);
        if (slots.length === 0) {
          await sendOutboundSMS(env2, {
            phone,
            message: `No slots available right now. The team will call you between 7-9:30am tomorrow to lock in a time.`
          });
          await updateBookingFlowStep(env2, phone, "standard_confirm_sent");
          return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json" } });
        }
        const slot = slots[0];
        await sendOutboundSMS(env2, {
          phone,
          message: `${slot.day} ${slot.start_time}-${slot.end_time} - available? Reply YES or give alternate time`
        });
        await updateBookingFlowStep(env2, phone, "standard_slots_offered", { selectedSlot: JSON.stringify(slot) });
        return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json" } });
      } else {
        await sendOutboundSMS(env2, {
          phone,
          message: `Thanks for letting us know. Please reply with the correct details and reply TONIGHT or STANDARD when ready.`
        });
        return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
    } else if (step === "emergency_confirm_sent") {
      if (isYes) {
        await createEmergencyJob(env2, bookingFlow);
        const confirmMsg = `Emergency booking confirmed! Tech will call back shortly.`;
        addMessageToConversation(env2, phone, "assistant", confirmMsg).catch((err) => console.error("Failed to save assistant message:", err));
        const conversationData = await getFirestoreDoc(env2, "conversations", phone);
        const allMessages = conversationData?.messages || [];
        sendBookingConfirmationEmail(env2, { phone, bookingFlow, messages: allMessages }).catch((err) => console.error("Failed to send email:", err));
        await updateBookingFlowStep(env2, phone, "emergency_booked");
        return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
    } else if (step === "standard_slots_offered") {
      if (isYes) {
        const slot = JSON.parse(bookingFlow.selectedSlot || "{}");
        await createStandardJob(env2, bookingFlow, slot);
        const confirmMsg = `Booked for ${slot.day} ${slot.start_time}-${slot.end_time}. Tech calls 30min before.`;
        await sendOutboundSMS(env2, { phone, message: confirmMsg });
        addMessageToConversation(env2, phone, "assistant", confirmMsg).catch((err) => console.error("Failed to save assistant message:", err));
        const conversationData = await getFirestoreDoc(env2, "conversations", phone);
        const allMessages = conversationData?.messages || [];
        sendBookingConfirmationEmail(env2, { phone, bookingFlow, messages: allMessages }).catch((err) => console.error("Failed to send email:", err));
        await updateBookingFlowStep(env2, phone, "standard_booked");
        return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json" } });
      } else {
        await sendOutboundSMS(env2, {
          phone,
          message: `Got it. The team will call between 7-9:30am tomorrow to find a time that suits you.`
        });
        await updateBookingFlowStep(env2, phone, "standard_confirm_sent");
        return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
    } else if (step === "standard_confirm_sent") {
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ error: "Unknown booking flow step" }), { status: 400, headers: { "Content-Type": "application/json" } });
  } catch (error3) {
    console.error("Booking flow error:", error3);
    return new Response(JSON.stringify({ error: error3.message || "Booking flow error" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
__name(handleOutboundBookingFlow, "handleOutboundBookingFlow");
__name2(handleOutboundBookingFlow, "handleOutboundBookingFlow");
async function updateBookingFlowStep(env2, phone, step, extras = {}) {
  const apiKey = env2.FIREBASE_API_KEY;
  const projectId = env2.FIREBASE_PROJECT_ID;
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/booking_flows/${phone}?key=${apiKey}`;
  const updateData = {
    step: { stringValue: step },
    lastUpdated: { stringValue: (/* @__PURE__ */ new Date()).toISOString() },
    ...Object.entries(extras).reduce((acc, [key, val]) => {
      acc[key] = typeof val === "string" ? { stringValue: val } : val;
      return acc;
    }, {})
  };
  try {
    await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields: updateData })
    });
  } catch (error3) {
    console.error("Error updating booking flow step:", error3);
  }
}
__name(updateBookingFlowStep, "updateBookingFlowStep");
__name2(updateBookingFlowStep, "updateBookingFlowStep");
async function addMessageToConversation(env2, phone, role, text) {
  try {
    const conversationData = await getFirestoreDoc(env2, "conversations", phone);
    const messages = conversationData?.messages || [];
    messages.push({ role, text, timestamp: (/* @__PURE__ */ new Date()).toISOString() });
    await updateFirestoreDoc(env2, "conversations", phone, { messages, lastUpdated: (/* @__PURE__ */ new Date()).toISOString() });
    console.log("Message saved to conversation:", phone);
  } catch (error3) {
    console.error("Error saving message to conversation:", error3);
  }
}
__name(addMessageToConversation, "addMessageToConversation");
__name2(addMessageToConversation, "addMessageToConversation");
async function createEmergencyJob(env2, bookingFlow) {
  console.log("Creating emergency job for:", bookingFlow.phone);
}
__name(createEmergencyJob, "createEmergencyJob");
__name2(createEmergencyJob, "createEmergencyJob");
async function createStandardJob(env2, bookingFlow, slot) {
  console.log("Creating standard job for:", bookingFlow.phone, "slot:", slot);
}
__name(createStandardJob, "createStandardJob");
__name2(createStandardJob, "createStandardJob");
async function sendOutboundSMS(env2, { phone, message }) {
  console.log("=== SENDING OUTBOUND SMS ===");
  console.log("To:", phone);
  console.log("Message:", message);
  const apiKey = env2.TRANSMITSMS_API_KEY;
  const apiSecret = env2.TRANSMITSMS_API_SECRET;
  const credentials = btoa(`${apiKey}:${apiSecret}`);
  const formData = new URLSearchParams();
  formData.append("message", message);
  formData.append("list_id", "10962457");
  formData.append("countrycode", "au");
  const response = await fetch("https://api.transmitsms.com/send-sms.json", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "text/plain"
    },
    body: formData.toString()
  });
  const responseText = await response.text();
  console.log("SMS response status:", response.status);
  console.log("SMS response:", responseText);
  if (!response.ok) {
    console.error("SMS error:", response.status);
  }
}
__name(sendOutboundSMS, "sendOutboundSMS");
__name2(sendOutboundSMS, "sendOutboundSMS");
async function getFirestoreDoc(env2, collection, docId) {
  const apiKey = env2.FIREBASE_API_KEY;
  if (!apiKey) {
    console.error("FIREBASE_API_KEY not configured");
    return null;
  }
  const projectId = env2.FIREBASE_PROJECT_ID;
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}/${docId}?key=${apiKey}`;
  const response = await fetch(url);
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    console.error("Firestore fetch error:", response.status);
    return null;
  }
  const data = await response.json();
  return firestoreToObject(data.fields);
}
__name(getFirestoreDoc, "getFirestoreDoc");
__name2(getFirestoreDoc, "getFirestoreDoc");
async function updateFirestoreDoc(env2, collection, docId, data) {
  const apiKey = env2.FIREBASE_API_KEY;
  if (!apiKey) {
    console.error("FIREBASE_API_KEY not configured");
    throw new Error("Firebase API key not configured");
  }
  const projectId = env2.FIREBASE_PROJECT_ID;
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}/${docId}?key=${apiKey}`;
  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      fields: objectToFirestore(data)
    })
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error("Firestore update error:", response.status, errorText);
    throw new Error(`Failed to update Firestore: ${response.status}`);
  }
  return response.json();
}
__name(updateFirestoreDoc, "updateFirestoreDoc");
__name2(updateFirestoreDoc, "updateFirestoreDoc");
function objectToFirestore(obj) {
  const fields = {};
  for (const [key, value] of Object.entries(obj)) {
    fields[key] = valueToFirestore(value);
  }
  return fields;
}
__name(objectToFirestore, "objectToFirestore");
__name2(objectToFirestore, "objectToFirestore");
function valueToFirestore(value) {
  if (value === null) {
    return { nullValue: null };
  }
  if (typeof value === "string") {
    return { stringValue: value };
  }
  if (typeof value === "number") {
    if (Number.isInteger(value)) {
      return { integerValue: value };
    }
    return { doubleValue: value };
  }
  if (typeof value === "boolean") {
    return { booleanValue: value };
  }
  if (Array.isArray(value)) {
    return {
      arrayValue: {
        values: value.map((v) => valueToFirestore(v))
      }
    };
  }
  if (typeof value === "object") {
    return {
      mapValue: {
        fields: objectToFirestore(value)
      }
    };
  }
  return { stringValue: String(value) };
}
__name(valueToFirestore, "valueToFirestore");
__name2(valueToFirestore, "valueToFirestore");
function firestoreToObject(fields) {
  const obj = {};
  for (const [key, field] of Object.entries(fields)) {
    obj[key] = firestoreValueToJs(field);
  }
  return obj;
}
__name(firestoreToObject, "firestoreToObject");
__name2(firestoreToObject, "firestoreToObject");
function firestoreValueToJs(field) {
  if (field.stringValue !== void 0) return field.stringValue;
  if (field.integerValue !== void 0) return parseInt(field.integerValue);
  if (field.doubleValue !== void 0) return field.doubleValue;
  if (field.booleanValue !== void 0) return field.booleanValue;
  if (field.nullValue !== void 0) return null;
  if (field.arrayValue) {
    return field.arrayValue.values.map((v) => firestoreValueToJs(v));
  }
  if (field.mapValue) {
    return firestoreToObject(field.mapValue.fields);
  }
  return null;
}
__name(firestoreValueToJs, "firestoreValueToJs");
__name2(firestoreValueToJs, "firestoreValueToJs");
async function getAvailableSlots(trade) {
  try {
    const response = await fetch("https://us-central1-pettrdashboards.cloudfunctions.net/aroFloAgent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: "get_available_slots",
        arguments: {
          trade
        }
      })
    });
    if (!response.ok) {
      console.error("AroFlo API error:", response.status);
      return [];
    }
    const data = await response.json();
    return data.slots || [];
  } catch (error3) {
    console.error("Error fetching available slots:", error3.message);
    return [];
  }
}
__name(getAvailableSlots, "getAvailableSlots");
__name2(getAvailableSlots, "getAvailableSlots");
async function callClaude(env2, { name, problem, address, postcode, trade, availableSlots, messages }) {
  const apiKey = env2.CLAUDE_API_KEY;
  if (!apiKey) {
    throw new Error("CLAUDE_API_KEY not configured");
  }
  const slotsText = availableSlots && availableSlots.length > 0 ? `

Available appointment slots:
${availableSlots.map((slot) => `- ${slot.day}, ${slot.start_time}-${slot.end_time} (${slot.tech})`).join("\n")}` : "";
  const systemPrompt = `You are a helpful booking assistant for Plumber & Electrician to the Rescue.

Customer Details:
- Name: ${name}
- Address: ${address} ${postcode}
- Issue: ${problem}
- Service: ${trade}

Pricing:
- Standard Hours (7am-3pm): FREE call-out and quote
- Emergency/After-Hours: $549 call-out fee inclusive of 1/2 hour of labour.
- Licensed & insured with 35+ years experience

Your role: Help them confirm the booking and offer available appointment slots. If they ask about fees or how we work, explain the pricing above. Be friendly, professional, and brief - keep responses to 1-2 sentences for SMS.${slotsText}`;
  console.log("Claude request - Name:", name, "Problem:", problem, "Messages:", messages.length);
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "claude-opus-4-7",
      max_tokens: 1024,
      system: systemPrompt,
      messages
    })
  });
  console.log("Claude response status:", response.status);
  if (!response.ok) {
    const errorText = await response.text();
    console.error("Claude error:", errorText);
    throw new Error(`Claude API error: ${response.status} ${errorText}`);
  }
  const result = await response.json();
  return result.content[0].text;
}
__name(callClaude, "callClaude");
__name2(callClaude, "callClaude");
async function sendSMS(env2, { phone, message }) {
  const apiKey = env2.TRANSMITSMS_API_KEY;
  const apiSecret = env2.TRANSMITSMS_API_SECRET;
  const credentials = btoa(`${apiKey}:${apiSecret}`);
  const formData = new URLSearchParams();
  formData.append("message", message);
  formData.append("list_id", "10962457");
  formData.append("countrycode", "au");
  const response = await fetch("https://api.transmitsms.com/send-sms.json", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "text/plain"
    },
    body: formData.toString()
  });
  const responseText = await response.text();
  console.log("SMS response:", responseText);
  if (!response.ok) {
    throw new Error(`SMS error: ${response.status} ${responseText}`);
  }
  return responseText;
}
__name(sendSMS, "sendSMS");
__name2(sendSMS, "sendSMS");
async function sendBookingConfirmationEmail(env2, { phone, bookingFlow, messages }) {
  try {
    const apiKey = env2.SMTP2GO_API_KEY;
    if (!apiKey) {
      console.error("SMTP2GO_API_KEY not configured");
      return;
    }
    const conversationHtml = messages.map((m) => `<p><strong>${m.role === "user" ? "Customer" : "System"}:</strong> ${m.text}</p>`).join("");
    const emailHtml = `
      <h2>Booking Confirmed</h2>
      <p><strong>Name:</strong> ${bookingFlow.name}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <p><strong>Address:</strong> ${bookingFlow.address} ${bookingFlow.postcode}</p>
      <p><strong>Issue:</strong> ${bookingFlow.problem}</p>
      <p><strong>Service Type:</strong> ${bookingFlow.trade}</p>
      <h3>SMS Conversation</h3>
      ${conversationHtml}
    `;
    const response = await fetch("https://api.smtp2go.com/v3/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        to: ["fergusg@mrwasher.com.au"],
        sender: "webform@plumberandelectrician.com.au",
        subject: `Booking Confirmed - ${bookingFlow.name}`,
        html_body: emailHtml
      })
    });
    if (!response.ok) {
      console.error("Email send failed:", response.status);
      return;
    }
    console.log("Booking confirmation email sent");
  } catch (error3) {
    console.error("Error sending booking confirmation email:", error3);
  }
}
__name(sendBookingConfirmationEmail, "sendBookingConfirmationEmail");
__name2(sendBookingConfirmationEmail, "sendBookingConfirmationEmail");
var routes = [
  {
    routePath: "/api/config",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest]
  },
  {
    routePath: "/api/quote",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest2]
  },
  {
    routePath: "/api/slots",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest3]
  },
  {
    routePath: "/api/sms-webhook",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest4]
  }
];
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count3 = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count3--;
          if (count3 === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count3++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count3)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
__name2(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name2(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name2(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name2(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name2(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name2(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
__name2(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
__name2(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name2(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
__name2(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
__name2(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
__name2(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
__name2(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
__name2(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
__name2(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
__name2(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");
__name2(pathToRegexp, "pathToRegexp");
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
__name2(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env2, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name2(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context2 = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env: env2,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name2(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context2);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env2["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error3) {
      if (isFailOpen) {
        const response = await env2["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error3;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name2((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");
var drainBody = /* @__PURE__ */ __name2(async (request, env2, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env2);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
__name2(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name2(async (request, env2, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env2);
  } catch (e) {
    const error3 = reduceError(e);
    return Response.json(error3, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
__name2(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env2, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env2, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
__name2(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env2, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env2, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");
__name2(__facade_invoke__, "__facade_invoke__");
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  static {
    __name(this, "___Facade_ScheduledController__");
  }
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name2(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name2(function(request, env2, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env2, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env2, ctx) {
      const dispatcher = /* @__PURE__ */ __name2(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env2, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env2, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
__name2(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name2((request, env2, ctx) => {
      this.env = env2;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name2((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
__name2(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;

// ../../../usr/local/lib/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody2 = /* @__PURE__ */ __name(async (request, env2, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env2);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default2 = drainBody2;

// ../../../usr/local/lib/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError2(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError2(e.cause)
  };
}
__name(reduceError2, "reduceError");
var jsonError2 = /* @__PURE__ */ __name(async (request, env2, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env2);
  } catch (e) {
    const error3 = reduceError2(e);
    return Response.json(error3, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default2 = jsonError2;

// .wrangler/tmp/bundle-CCN84m/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__2 = [
  middleware_ensure_req_body_drained_default2,
  middleware_miniflare3_json_error_default2
];
var middleware_insertion_facade_default2 = middleware_loader_entry_default;

// ../../../usr/local/lib/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__2 = [];
function __facade_register__2(...args) {
  __facade_middleware__2.push(...args.flat());
}
__name(__facade_register__2, "__facade_register__");
function __facade_invokeChain__2(request, env2, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__2(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env2, ctx, middlewareCtx);
}
__name(__facade_invokeChain__2, "__facade_invokeChain__");
function __facade_invoke__2(request, env2, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__2(request, env2, ctx, dispatch, [
    ...__facade_middleware__2,
    finalMiddleware
  ]);
}
__name(__facade_invoke__2, "__facade_invoke__");

// .wrangler/tmp/bundle-CCN84m/middleware-loader.entry.ts
var __Facade_ScheduledController__2 = class ___Facade_ScheduledController__2 {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__2)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler2(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env2, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env2, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env2, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__2(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env2, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__2(request, env2, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler2, "wrapExportedHandler");
function wrapWorkerEntrypoint2(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env2, ctx) => {
      this.env = env2;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__2(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__2(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint2, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY2;
if (typeof middleware_insertion_facade_default2 === "object") {
  WRAPPED_ENTRY2 = wrapExportedHandler2(middleware_insertion_facade_default2);
} else if (typeof middleware_insertion_facade_default2 === "function") {
  WRAPPED_ENTRY2 = wrapWorkerEntrypoint2(middleware_insertion_facade_default2);
}
var middleware_loader_entry_default2 = WRAPPED_ENTRY2;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__2 as __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default2 as default
};
//# sourceMappingURL=functionsWorker-0.8395932344833987.js.map
