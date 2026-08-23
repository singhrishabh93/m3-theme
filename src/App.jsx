import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Hct, SchemeTonalSpot, argbFromHex, hexFromArgb } from "@material/material-color-utilities";
import Shell from "./Shell.jsx";
import "./App.css";

const ROLES = [
  "primary",
  "onPrimary",
  "primaryContainer",
  "onPrimaryContainer",
  "secondary",
  "onSecondary",
  "secondaryContainer",
  "onSecondaryContainer",
  "tertiary",
  "onTertiary",
  "tertiaryContainer",
  "onTertiaryContainer",
  "error",
  "onError",
  "errorContainer",
  "onErrorContainer",
  "surface",
  "onSurface",
  "surfaceContainerHighest",
  "onSurfaceVariant",
  "outline",
  "outlineVariant",
  "inverseSurface",
  "onInverseSurface",
  "inversePrimary",
];
const PAGE_ROLES = ["surfaceContainerLowest", "surfaceContainerLow", "surfaceContainer", "surfaceContainerHigh"];
const LIB_KEY = { onInverseSurface: "inverseOnSurface" };
const TILE_TEXT = { outline: "surface", outlineVariant: "onSurface", inversePrimary: "inverseSurface" };
const TONES = [10, 20, 30, 40, 50, 60, 70, 80, 90, 95];

const PRESETS = ["#4F46E5", "#6750A4", "#02569B", "#0EA5E9", "#10B981", "#F59E0B", "#EF4444", "#EC4899"];
const HEX_RE = /^#[0-9a-f]{6}$/i;

function buildScheme(seed, isDark) {
  const scheme = new SchemeTonalSpot(Hct.fromInt(argbFromHex(seed)), isDark, 0, "2021");
  const colors = Object.fromEntries(
    [...ROLES, ...PAGE_ROLES].map((name) => [name, hexFromArgb(scheme[LIB_KEY[name] ?? name])]),
  );
  colors.tones = TONES.map((t) => hexFromArgb(scheme.primaryPalette.tone(t)));
  return colors;
}

function tileText(name) {
  if (TILE_TEXT[name]) return TILE_TEXT[name];
  if (name === "surfaceContainerHighest") return "onSurfaceVariant";
  if (name === "onSurfaceVariant") return "surfaceContainerHighest";
  if (name.startsWith("on")) return name[2].toLowerCase() + name.slice(3);
  return `on${name[0].toUpperCase()}${name.slice(1)}`;
}

const dartColor = (hex) => `Color(0xFF${hex.slice(1).toUpperCase()})`;

function dartScheme(varName, brightness, colors) {
  const lines = ROLES.map((name) => `  ${name}: ${dartColor(colors[name])},`);
  return `const ${varName} = ColorScheme(\n  brightness: Brightness.${brightness},\n${lines.join("\n")}\n);`;
}

function buildDart(seed, light, dark) {
  return [
    "import 'package:flutter/material.dart';",
    dartScheme("lightColorScheme", "light", light),
    dartScheme("darkColorScheme", "dark", dark),
    "ThemeData lightTheme = ThemeData(useMaterial3: true, colorScheme: lightColorScheme);\nThemeData darkTheme = ThemeData(useMaterial3: true, colorScheme: darkColorScheme);",
    `final seededColorScheme = ColorScheme.fromSeed(seedColor: ${dartColor(seed)});`,
  ].join("\n\n") + "\n";
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function Preview() {
  return (
    <div className="phone" role="img" aria-label="sample app screen using the current scheme">
      <div className="phone-bar">
        <span className="phone-icon" aria-hidden="true">☰</span>
        <span className="phone-title">inbox</span>
        <span className="phone-avatar" aria-hidden="true">r</span>
      </div>
      <div className="phone-body">
        <div className="phone-chips">
          <span className="phone-chip phone-chip-on">✓ all</span>
          <span className="phone-chip">unread</span>
          <span className="phone-chip">starred</span>
        </div>
        <div className="phone-card">
          <div className="phone-card-title">weekly sync</div>
          <div className="phone-card-text">notes from monday are ready. two items need your review.</div>
          <div className="phone-actions">
            <span className="phone-btn phone-btn-outlined">later</span>
            <span className="phone-btn phone-btn-filled">open</span>
          </div>
        </div>
        <div className="phone-card phone-card-tertiary">
          <div className="phone-card-title">tip</div>
          <div className="phone-card-text">tertiary container for accents.</div>
        </div>
      </div>
      <span className="phone-fab" aria-hidden="true">+</span>
    </div>
  );
}

export default function App() {
  const [seed, setSeed] = useState("#4F46E5");
  const [hexInput, setHexInput] = useState("#4F46E5");
  const [dark, setDark] = useState(() => window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false);
  const [status, setStatus] = useState("");
  const timer = useRef(0);

  const light = useMemo(() => buildScheme(seed, false), [seed]);
  const darkColors = useMemo(() => buildScheme(seed, true), [seed]);
  const colors = dark ? darkColors : light;
  const dart = useMemo(() => buildDart(seed, light, darkColors), [seed, light, darkColors]);
  const hexValid = HEX_RE.test(hexInput);

  useLayoutEffect(() => {
    const root = document.documentElement;
    for (const name of [...ROLES, ...PAGE_ROLES]) root.style.setProperty(`--${name}`, colors[name]);
    root.style.colorScheme = dark ? "dark" : "light";
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", colors.surface);
  }, [colors, dark]);

  const pick = (hex) => {
    const value = hex.toUpperCase();
    setSeed(value);
    setHexInput(value);
  };

  const onHex = (raw) => {
    const value = raw.trim().startsWith("#") ? raw.trim() : `#${raw.trim()}`;
    setHexInput(value);
    if (HEX_RE.test(value)) setSeed(value.toUpperCase());
  };

  const flash = async (text, label) => {
    setStatus((await copyText(text)) ? `copied ${label}` : "copy failed — select and copy manually");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus(""), 1800);
  };

  const download = () => {
    const url = URL.createObjectURL(new Blob([dart], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "theme.dart";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Shell
      name="m3 theme"
      tag="flutter, material 3"
      description="pick a seed color, preview a material 3 color scheme and copy the flutter theme code."
      repo="m3-theme"
      hero={
        <div className="tones" aria-hidden="true">
          {colors.tones.map((t, i) => (
            <span key={TONES[i]} style={{ background: t }} />
          ))}
        </div>
      }
    >
      <div className="layout">
        <aside className="side">
          <section className="card" aria-labelledby="seed-title">
            <h2 id="seed-title" className="card-title">seed color</h2>
            <div className="seed-row">
              <label className="seed-picker" style={{ background: seed }}>
                <span className="sr-only">pick seed color</span>
                <input type="color" value={seed.toLowerCase()} onChange={(e) => pick(e.target.value)} />
              </label>
              <div className="text-field">
                <label htmlFor="seed-hex">hex</label>
                <input
                  id="seed-hex"
                  value={hexInput}
                  maxLength={7}
                  spellCheck={false}
                  autoComplete="off"
                  aria-invalid={!hexValid}
                  aria-describedby={hexValid ? undefined : "hex-error"}
                  onChange={(e) => onHex(e.target.value)}
                />
              </div>
            </div>
            {!hexValid ? (
              <p id="hex-error" className="field-error">
                use #RRGGBB, e.g. #4F46E5
              </p>
            ) : null}
            <div className="presets" role="group" aria-label="preset seeds">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  className="preset"
                  style={{ background: p }}
                  aria-label={`use ${p}`}
                  aria-pressed={p === seed}
                  onClick={() => pick(p)}
                />
              ))}
            </div>
            <div className="segmented" role="group" aria-label="brightness">
              {[false, true].map((isDark) => (
                <button key={String(isDark)} type="button" aria-pressed={dark === isDark} onClick={() => setDark(isDark)}>
                  {dark === isDark ? <span aria-hidden="true">✓ </span> : null}
                  {isDark ? "dark" : "light"}
                </button>
              ))}
            </div>
          </section>

          <section className="card" aria-labelledby="preview-title">
            <h2 id="preview-title" className="card-title">preview</h2>
            <Preview />
          </section>
        </aside>

        <div className="main">
          <section className="card" aria-labelledby="roles-title">
            <div className="card-head">
              <h2 id="roles-title" className="card-title">color roles · {dark ? "dark" : "light"}</h2>
              <p className="card-hint">tap a tile to copy its hex</p>
            </div>
            <div className="tiles">
              {ROLES.map((name) => (
                <button
                  key={name}
                  type="button"
                  className="tile"
                  style={{ background: colors[name], color: colors[tileText(name)] }}
                  aria-label={`copy ${name} ${colors[name]}`}
                  onClick={() => flash(colors[name], `${name} ${colors[name]}`)}
                >
                  <span className="tile-name">{name}</span>
                  <span className="tile-hex">{colors[name].toUpperCase()}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="card" aria-labelledby="code-title">
            <div className="card-head">
              <h2 id="code-title" className="card-title">theme.dart</h2>
              <div className="actions">
                <button type="button" className="btn btn-filled" onClick={() => flash(dart, "theme.dart")}>
                  copy
                </button>
                <button type="button" className="btn btn-tonal" onClick={download}>
                  download theme.dart
                </button>
              </div>
            </div>
            <pre className="code" tabIndex={0} aria-label="generated dart code">
              {dart}
            </pre>
          </section>
        </div>
      </div>
      <p className={`snackbar${status ? " snackbar-on" : ""}`} role="status" aria-live="polite">
        {status}
      </p>
    </Shell>
  );
}
