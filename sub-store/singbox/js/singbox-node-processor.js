function toBoolean(value, defaultValue) {
  if (value === undefined || value === null || value === "") return defaultValue;
  if (typeof value === "boolean") return value;
  return String(value).toLowerCase() === "true";
}

function getArgs(context) {
  if (context && context.arguments && typeof context.arguments === "object") return context.arguments;
  if (typeof $arguments !== "undefined" && $arguments && typeof $arguments === "object") return $arguments;
  return {};
}

function createMatcher(filterText) {
  if (!filterText) {
    return () => true;
  }

  const text = String(filterText).trim();
  if (!text) {
    return () => true;
  }

  if (text.startsWith("/") && text.lastIndexOf("/") > 0) {
    const splitIndex = text.lastIndexOf("/");
    const body = text.slice(1, splitIndex);
    const flags = text.slice(splitIndex + 1) || "i";
    const reg = new RegExp(body, flags);
    return (proxy) => reg.test(String(proxy.name || "")) || reg.test(String(proxy.server || ""));
  }

  const keyword = text.toLowerCase();
  return (proxy) => {
    const source = `${String(proxy.name || "")} ${String(proxy.server || "")}`.toLowerCase();
    return source.includes(keyword);
  };
}

function normalizeName(name) {
  const raw = String(name || "").trim() || "UNNAMED";
  const map = [
    { icon: "🇭🇰", keys: ["香港", "hk", "hong kong"] },
    { icon: "🇹🇼", keys: ["台湾", "台灣", "tw", "taiwan"] },
    { icon: "🇯🇵", keys: ["日本", "jp", "japan"] },
    { icon: "🇸🇬", keys: ["新加坡", "狮城", "sg", "singapore"] },
    { icon: "🇺🇸", keys: ["美国", "美國", "us", "usa", "united states"] },
    { icon: "🇰🇷", keys: ["韩国", "韓國", "kr", "korea"] },
    { icon: "🇬🇧", keys: ["英国", "英國", "uk", "britain", "london"] },
    { icon: "🇩🇪", keys: ["德国", "德國", "de", "germany"] },
    { icon: "🇫🇷", keys: ["法国", "法國", "fr", "france"] }
  ];

  const lower = raw.toLowerCase();
  const matched = map.find((item) => item.keys.some((key) => lower.includes(String(key).toLowerCase())));
  if (!matched) return raw;
  if (raw.includes(matched.icon)) return raw;
  return `${matched.icon} ${raw}`;
}

function getFingerprint(proxy) {
  return [
    proxy.type || "",
    proxy.server || "",
    proxy.port || "",
    proxy.uuid || "",
    proxy.password || "",
    proxy.method || ""
  ].join("|");
}

function operator(proxies = [], targetPlatform, context) {
  const args = getArgs(context);
  const filter = args.filter || "";
  const exclude = args.exclude || "";
  const onlyUdp = toBoolean(args.onlyUdp, false);

  const includeMatcher = createMatcher(filter);
  const excludeMatcher = createMatcher(exclude);
  const unique = new Set();

  return proxies
    .filter((proxy) => proxy && proxy.server && proxy.port)
    .filter((proxy) => includeMatcher(proxy))
    .filter((proxy) => !exclude || !excludeMatcher(proxy))
    .filter((proxy) => !onlyUdp || proxy.udp === true)
    .map((proxy) => {
      const next = { ...proxy };
      next.name = normalizeName(proxy.name);
      return next;
    })
    .filter((proxy) => {
      const fp = getFingerprint(proxy);
      if (unique.has(fp)) return false;
      unique.add(fp);
      return true;
    });
}

if (typeof module !== "undefined") module.exports = operator;
if (typeof exports !== "undefined") exports.operator = operator;
