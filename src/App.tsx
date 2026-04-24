import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import "./App.css";
import { JsonFormatter } from "./tools/JsonFormatter";
import { DiffTool } from "./tools/DiffTool";
import { JsonToClass } from "./tools/JsonToClass";
import { JwtDecoder } from "./tools/JwtDecoder";
import { Base64Tool } from "./tools/Base64Tool";
import { RegexTester } from "./tools/RegexTester";
import { SqlFormatter } from "./tools/SqlFormatter";
import { UuidGenerator } from "./tools/UuidGenerator";
import { LogPrettifier } from "./tools/LogPrettifier";
import { AdUnit } from "./components/AdUnit";
import { ToolGuide } from "./components/ToolGuide";
import { InfoPage } from "./components/InfoPage";
import { CookieConsent } from "./components/CookieConsent";

type Tool =
  | "formatter"
  | "diff"
  | "converter"
  | "jwt"
  | "base64"
  | "regex"
  | "sql"
  | "uuid"
  | "logs";

type InfoPageKey = "privacy" | "terms" | "about" | "contact";

type Route =
  | { kind: "tool"; tool: Tool }
  | { kind: "page"; page: InfoPageKey };

const toolsConfig: {
  id: Tool;
  icon: string;
  key: string;
  slug: string;
}[] = [
  { id: "logs", icon: "☰", key: "1", slug: "log-prettifier" },
  { id: "formatter", icon: "{ }", key: "2", slug: "json-formatter" },
  { id: "converter", icon: "⬡", key: "3", slug: "json-to-class" },
  { id: "sql", icon: "⊞", key: "4", slug: "sql-formatter" },
  { id: "diff", icon: "< >", key: "5", slug: "text-diff" },
  { id: "jwt", icon: "⚿", key: "6", slug: "jwt-decoder" },
  { id: "base64", icon: "⇌", key: "7", slug: "base64-encoder-decoder" },
  { id: "regex", icon: ".*", key: "8", slug: "regex-tester" },
  { id: "uuid", icon: "#", key: "9", slug: "uuid-generator" },
];

const infoPagesConfig: { id: InfoPageKey; slug: string }[] = [
  { id: "privacy", slug: "privacy" },
  { id: "terms", slug: "terms" },
  { id: "about", slug: "about" },
  { id: "contact", slug: "contact" },
];

const SITE_ORIGIN = "https://www.multidev.tools";

function getRouteFromPath(pathname: string): Route {
  const slug = pathname.replace(/^\//, "").replace(/\/$/, "");
  if (!slug) return { kind: "tool", tool: toolsConfig[0].id };
  const tool = toolsConfig.find((t) => t.slug === slug);
  if (tool) return { kind: "tool", tool: tool.id };
  const page = infoPagesConfig.find((p) => p.slug === slug);
  if (page) return { kind: "page", page: page.id };
  return { kind: "tool", tool: toolsConfig[0].id };
}

function updateMeta(
  title: string,
  description: string,
  canonicalUrl: string,
  lang: string,
) {
  document.title = title;
  document.documentElement.lang = lang;

  const meta = document.querySelector('meta[name="description"]');
  if (meta) meta.setAttribute("content", description);

  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) canonical.setAttribute("href", canonicalUrl);

  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute("content", title);

  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) ogDesc.setAttribute("content", description);

  const ogUrl = document.querySelector('meta[property="og:url"]');
  if (ogUrl) ogUrl.setAttribute("content", canonicalUrl);

  const ogLocale = document.querySelector('meta[property="og:locale"]');
  if (ogLocale)
    ogLocale.setAttribute("content", lang === "es" ? "es_ES" : "en_US");
}

function App() {
  const { t, i18n } = useTranslation();

  const [route, setRoute] = useState<Route>(() =>
    getRouteFromPath(window.location.pathname),
  );
  const [toast, setToast] = useState<string | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  const tools = toolsConfig.map((tool) => ({
    ...tool,
    label: t(`tools.${tool.id}.label`),
    title: t(`tools.${tool.id}.title`),
    description: t(`tools.${tool.id}.description`),
  }));

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const rackRef = useRef<HTMLElement>(null);

  const checkScroll = useCallback(() => {
    if (rackRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = rackRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth + 2) < scrollWidth);
    }
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [checkScroll]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1500);
  }, []);

  const navigateToTool = useCallback((toolId: Tool) => {
    setRoute({ kind: "tool", tool: toolId });
    const tool = toolsConfig.find((t) => t.id === toolId)!;
    window.history.pushState(null, "", `/${tool.slug}`);
    window.scrollTo(0, 0);
  }, []);

  const navigateToPage = useCallback((pageId: InfoPageKey) => {
    setRoute({ kind: "page", page: pageId });
    const page = infoPagesConfig.find((p) => p.id === pageId)!;
    window.history.pushState(null, "", `/${page.slug}`);
    window.scrollTo(0, 0);
  }, []);

  // Sync title, meta, and canonical with active route
  useEffect(() => {
    if (route.kind === "tool") {
      const tool = tools.find((t) => t.id === route.tool)!;
      const isRootAndDefault =
        window.location.pathname === "/" && tool.id === toolsConfig[0].id;
      const canonicalUrl = isRootAndDefault
        ? `${SITE_ORIGIN}/`
        : `${SITE_ORIGIN}/${tool.slug}`;
      updateMeta(tool.title, tool.description, canonicalUrl, i18n.language);

      if (!isRootAndDefault && window.location.pathname !== `/${tool.slug}`) {
        window.history.replaceState(null, "", `/${tool.slug}`);
      }
    } else {
      const page = infoPagesConfig.find((p) => p.id === route.page)!;
      const title = t(`pages.${page.id}.title`);
      const heading = t(`pages.${page.id}.heading`);
      const canonicalUrl = `${SITE_ORIGIN}/${page.slug}`;
      updateMeta(title, heading, canonicalUrl, i18n.language);
    }
  }, [route, tools, i18n.language, t]);

  // Handle browser back / forward
  useEffect(() => {
    const onPopState = () => {
      setRoute(getRouteFromPath(window.location.pathname));
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // Keyboard shortcuts (only on tool routes)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (route.kind !== "tool") return;
      if (
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLInputElement
      )
        return;
      if (e.altKey || e.metaKey || e.ctrlKey) return;
      const tool = tools.find((t) => t.key === e.key);
      if (tool) {
        e.preventDefault();
        navigateToTool(tool.id);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigateToTool, tools, route.kind]);

  const isToolRoute = route.kind === "tool";
  const activeToolData = isToolRoute
    ? tools.find((t) => t.id === route.tool)!
    : null;
  const showHero =
    isToolRoute &&
    window.location.pathname === "/" &&
    route.tool === toolsConfig[0].id &&
    !isDismissed;

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <div className="logo-icon">
              <p
                style={{ fontSize: "large", cursor: "pointer" }}
                onClick={() => {
                  window.history.pushState(null, "", "/");
                  setRoute({ kind: "tool", tool: toolsConfig[0].id });
                  window.scrollTo(0, 0);
                }}
              >
                ⚒️
              </p>
            </div>
          </div>

          <div className="tool-rack-container">
            {canScrollLeft && (
              <button
                className="scroll-btn scroll-btn-left"
                onClick={() =>
                  rackRef.current?.scrollBy({ left: -200, behavior: "smooth" })
                }
                aria-label="Scroll left"
              >
                ‹
              </button>
            )}

            <nav className="tool-rack" ref={rackRef} onScroll={checkScroll}>
              {tools.map((tool) => (
                <button
                  key={tool.id}
                  className={`tool-tab${
                    isToolRoute && route.tool === tool.id ? " active" : ""
                  }`}
                  onClick={() => navigateToTool(tool.id)}
                >
                  <span className="tab-icon">{tool.icon}</span>
                  {tool.label}
                  <span className="tab-key">{tool.key}</span>
                </button>
              ))}
            </nav>

            {canScrollRight && (
              <button
                className="scroll-btn scroll-btn-right"
                onClick={() =>
                  rackRef.current?.scrollBy({ left: 200, behavior: "smooth" })
                }
                aria-label="Scroll right"
              >
                ›
              </button>
            )}
          </div>

          <button
            className="btn btn-ghost"
            onClick={() => {
              const nextLang = i18n.language === "en" ? "es" : "en";
              i18n.changeLanguage(nextLang);
              localStorage.setItem("app_lang", nextLang);
            }}
            style={{ marginLeft: "10px", minWidth: "40px" }}
            title="Toggle Language"
          >
            {i18n.language === "en" ? "ES" : "EN"}
          </button>
        </div>
      </header>

      {showHero && (
        <section className="hero" style={{ position: "relative" }}>
          <button
            onClick={() => setIsDismissed(true)}
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              fontSize: "16px",
              background: "none",
              border: "none",
              color: "var(--ink-muted)",
              cursor: "pointer",
            }}
            title="Close"
          >
            ✕
          </button>
          <div className="hero-inner" style={{ paddingRight: "40px" }}>
            <h1>{t("header.title")}</h1>
            <p>{t("header.description")}</p>
          </div>
        </section>
      )}

      <main className="main">
        {isToolRoute && activeToolData ? (
          <>
            <div className="tool-description">
              <h2>
                {activeToolData.icon} {activeToolData.label}
              </h2>
              <p>{activeToolData.description}</p>
            </div>

            <div className="tool-panel" key={route.tool}>
              {route.tool === "formatter" && (
                <JsonFormatter onCopy={showToast} />
              )}
              {route.tool === "diff" && <DiffTool onCopy={showToast} />}
              {route.tool === "converter" && (
                <JsonToClass onCopy={showToast} />
              )}
              {route.tool === "jwt" && <JwtDecoder onCopy={showToast} />}
              {route.tool === "base64" && <Base64Tool onCopy={showToast} />}
              {route.tool === "regex" && <RegexTester onCopy={showToast} />}
              {route.tool === "sql" && <SqlFormatter onCopy={showToast} />}
              {route.tool === "uuid" && <UuidGenerator onCopy={showToast} />}
              {route.tool === "logs" && <LogPrettifier onCopy={showToast} />}
            </div>

            <ToolGuide toolId={route.tool} />

            <div className="ad-bottom">
              <AdUnit
                key={`ad-${route.tool}`}
                slot="bottomDesktop"
                format="horizontal"
              />
            </div>
          </>
        ) : route.kind === "page" ? (
          <InfoPage pageKey={route.page} />
        ) : null}
      </main>

      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-about">
            <h3>{t("footer.about_title")}</h3>
            <p>{t("footer.about_text")}</p>
          </div>
          <div className="footer-tools">
            <h3>{t("footer.tools_title")}</h3>
            <ul>
              {tools.map((tool) => (
                <li key={tool.id}>
                  <button onClick={() => navigateToTool(tool.id)}>
                    {tool.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="footer-info">
            <h3>{t("footer.info_title")}</h3>
            <ul>
              {infoPagesConfig.map((page) => (
                <li key={page.id}>
                  <button onClick={() => navigateToPage(page.id)}>
                    {t(`nav.${page.id}`)}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="footer-bottom">
            <p>
              {t("footer.copyright").replace(
                "{{year}}",
                new Date().getFullYear().toString(),
              )}
            </p>
          </div>
        </div>
      </footer>

      <CookieConsent onNavigate={(slug) => navigateToPage(slug as InfoPageKey)} />

      {toast && <div className="copied-toast">{toast}</div>}
    </div>
  );
}

export default App;
