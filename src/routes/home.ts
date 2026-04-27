import { type FastifyInstance } from 'fastify';

function renderHomePage(): string {
  return `<!DOCTYPE html>
<html lang="pt-PT">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Painel de Chegadas</title>
    <meta
      id="pageDescription"
      name="description"
      content="Ver chegadas de voos sem mexer na API."
    />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=IBM+Plex+Mono:wght@400;500&family=Manrope:wght@400;500;600;700;800&display=swap"
      rel="stylesheet"
    />
    <style>
      :root {
        --accent: #fe3a4d;
        --accent-deep: #ce2137;
        --ink: #111322;
        --ink-soft: #384053;
        --paper: #fff8f2;
        --paper-strong: #fffdf8;
        --board: #171a24;
        --board-soft: rgba(23, 26, 36, 0.78);
        --line: rgba(17, 19, 34, 0.1);
        --success: #157f5f;
        --warning: #c27812;
        --danger: #b42318;
        --shadow: 0 28px 80px rgba(17, 19, 34, 0.16);
      }

      * {
        box-sizing: border-box;
      }

      html {
        min-height: 100%;
        background:
          radial-gradient(circle at top left, rgba(254, 58, 77, 0.24), transparent 32%),
          radial-gradient(circle at 85% 15%, rgba(254, 58, 77, 0.12), transparent 24%),
          linear-gradient(135deg, #fff8f2 0%, #fffcf9 45%, #fff1ed 100%);
      }

      body {
        margin: 0;
        min-height: 100vh;
        color: var(--ink);
        font-family: 'Manrope', sans-serif;
        background:
          linear-gradient(90deg, rgba(17, 19, 34, 0.04) 1px, transparent 1px) 0 0 / 72px 72px,
          linear-gradient(rgba(17, 19, 34, 0.04) 1px, transparent 1px) 0 0 / 72px 72px,
          linear-gradient(135deg, rgba(255, 255, 255, 0.85), rgba(255, 248, 242, 0.92));
      }

      body::before {
        content: '';
        position: fixed;
        inset: 0;
        pointer-events: none;
        opacity: 0.18;
        background-image:
          radial-gradient(circle at 20% 20%, rgba(254, 58, 77, 0.28) 0 2px, transparent 2px),
          radial-gradient(circle at 80% 70%, rgba(17, 19, 34, 0.16) 0 1px, transparent 1px);
        background-size: 26px 26px, 18px 18px;
        mix-blend-mode: multiply;
      }

      a {
        color: inherit;
      }

      .page {
        width: min(1180px, calc(100vw - 32px));
        margin: 0 auto;
        padding: 32px 0 48px;
      }

      .masthead {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
        margin-bottom: 18px;
        opacity: 0;
        transform: translateY(14px);
        animation: rise 600ms ease forwards;
      }

      .brand {
        display: inline-flex;
        align-items: center;
        gap: 12px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .brand-mark {
        width: 38px;
        height: 38px;
        border-radius: 12px;
        display: grid;
        place-items: center;
        background: var(--accent);
        color: white;
        box-shadow: 0 16px 28px rgba(254, 58, 77, 0.35);
      }

      .masthead-note {
        padding: 10px 14px;
        border-radius: 999px;
        border: 1px solid rgba(17, 19, 34, 0.1);
        background: rgba(255, 255, 255, 0.62);
        color: var(--ink-soft);
        font-size: 0.92rem;
      }

      .masthead-tools {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
        justify-content: flex-end;
      }

      .locale-toggle {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px;
        border-radius: 999px;
        background: rgba(17, 19, 34, 0.08);
        border: 1px solid rgba(17, 19, 34, 0.08);
      }

      .locale-button {
        min-width: 54px;
        padding: 9px 12px;
        border: none;
        border-radius: 999px;
        background: transparent;
        color: var(--ink-soft);
        font-family: 'IBM Plex Mono', monospace;
        font-size: 0.8rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        cursor: pointer;
        transition: background 160ms ease, color 160ms ease, transform 160ms ease;
      }

      .locale-button:hover {
        transform: translateY(-1px);
      }

      .locale-button.is-active {
        background: var(--accent);
        color: white;
        box-shadow: 0 12px 24px rgba(254, 58, 77, 0.28);
      }

      .workspace {
        display: grid;
        grid-template-columns: minmax(320px, 410px) minmax(0, 1fr);
        gap: 24px;
        align-items: stretch;
      }

      .panel,
      .results-shell {
        position: relative;
        overflow: hidden;
        border-radius: 32px;
        box-shadow: var(--shadow);
      }

      .control-panel {
        height: 100%;
        padding: 28px;
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(255, 252, 248, 0.9));
        border: 1px solid rgba(255, 255, 255, 0.8);
        opacity: 0;
        transform: translateY(14px);
        animation: rise 650ms ease 100ms forwards;
      }

      .control-panel::before,
      .control-panel::after {
        content: '';
        position: absolute;
        inset: 0 auto 0 0;
        width: 14px;
        background:
          radial-gradient(circle at right center, transparent 0 9px, rgba(255, 248, 242, 1) 9px 10px, transparent 10px 100%);
        background-size: 14px 28px;
        opacity: 0.88;
      }

      .control-panel::after {
        inset: 0 0 0 auto;
        transform: scaleX(-1);
      }

      .ticket-tag,
      .results-header-label {
        font-family: 'IBM Plex Mono', monospace;
        text-transform: uppercase;
        letter-spacing: 0.18em;
        font-size: 0.76rem;
      }

      .ticket-tag {
        display: inline-flex;
        padding: 8px 12px;
        border-radius: 999px;
        background: rgba(254, 58, 77, 0.12);
        color: var(--accent-deep);
        margin-bottom: 16px;
      }

      .panel h1 {
        margin: 0 0 12px;
        font-family: 'Fraunces', serif;
        font-size: clamp(2.6rem, 5vw, 3.9rem);
        line-height: 0.96;
        letter-spacing: -0.04em;
      }

      .panel h1 strong {
        color: var(--accent-deep);
      }

      .panel-copy {
        margin: 0 0 24px;
        color: var(--ink-soft);
        line-height: 1.65;
      }

      .form-grid {
        display: grid;
        gap: 16px;
      }

      label {
        display: grid;
        gap: 8px;
      }

      .field-label {
        font-size: 0.92rem;
        font-weight: 700;
      }

      input,
      button {
        font: inherit;
      }

      input {
        width: 100%;
        padding: 14px 16px;
        border-radius: 18px;
        border: 1px solid rgba(17, 19, 34, 0.12);
        background: var(--paper-strong);
        color: var(--ink);
        transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
      }

      input:focus {
        outline: none;
        border-color: rgba(254, 58, 77, 0.7);
        box-shadow: 0 0 0 4px rgba(254, 58, 77, 0.12);
        transform: translateY(-1px);
      }

      .flight-entry-shell {
        display: grid;
        gap: 14px;
        padding: 18px;
        border-radius: 24px;
        background: rgba(17, 19, 34, 0.04);
        border: 1px solid rgba(17, 19, 34, 0.08);
      }

      .entry-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 12px;
        align-items: center;
      }

      .entry-input {
        text-transform: uppercase;
        letter-spacing: 0.12em;
      }

      .entry-button {
        padding: 14px 16px;
        border-radius: 18px;
        border: none;
        background: rgba(254, 58, 77, 0.12);
        color: var(--accent-deep);
        font-weight: 800;
        cursor: pointer;
        transition: transform 160ms ease, background 160ms ease;
      }

      .entry-button:hover {
        transform: translateY(-1px);
        background: rgba(254, 58, 77, 0.18);
      }

      .flight-list {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        min-height: 56px;
        padding: 0;
        margin: 0;
        list-style: none;
      }

      .flight-list-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
      }

      .flight-list-label {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 0.76rem;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        color: var(--ink-soft);
      }

      .flight-list-clear {
        padding: 10px 14px;
        border: 1px solid rgba(17, 19, 34, 0.1);
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.7);
        color: var(--ink);
        font-size: 0.84rem;
        font-weight: 700;
        cursor: pointer;
        transition: transform 160ms ease, background 160ms ease, opacity 160ms ease;
      }

      .flight-list-clear:hover {
        transform: translateY(-1px);
        background: rgba(255, 255, 255, 0.94);
      }

      .flight-list-clear:disabled {
        cursor: not-allowed;
        opacity: 0.45;
        transform: none;
      }

      .flight-chip {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px 10px 14px;
        border-radius: 999px;
        background: white;
        border: 1px solid rgba(17, 19, 34, 0.08);
        box-shadow: 0 10px 18px rgba(17, 19, 34, 0.06);
        animation: ticket-pop 220ms ease;
      }

      .flight-chip-code {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 0.9rem;
        letter-spacing: 0.12em;
      }

      .chip-remove {
        width: 28px;
        height: 28px;
        border-radius: 999px;
        border: none;
        background: rgba(17, 19, 34, 0.08);
        color: var(--ink);
        font-weight: 800;
        cursor: pointer;
      }

      .flight-list-empty {
        width: 100%;
        padding: 16px;
        border-radius: 18px;
        border: 1px dashed rgba(17, 19, 34, 0.14);
        color: var(--ink-soft);
      }

      .field-hint {
        color: var(--ink-soft);
        font-size: 0.88rem;
        line-height: 1.5;
      }

      .actions {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
        justify-content: center;
      }

      .primary-button,
      .secondary-button {
        border: none;
        cursor: pointer;
        transition: transform 160ms ease, box-shadow 160ms ease, opacity 160ms ease;
      }

      .primary-button {
        min-width: 194px;
        padding: 16px 20px;
        border-radius: 18px;
        background: linear-gradient(135deg, var(--accent), #ff5d59);
        color: white;
        font-weight: 800;
        box-shadow: 0 18px 30px rgba(254, 58, 77, 0.3);
      }

      .secondary-button {
        padding: 12px 14px;
        border-radius: 14px;
        background: rgba(17, 19, 34, 0.08);
        color: var(--ink);
        font-weight: 700;
      }

      .primary-button:hover,
      .secondary-button:hover {
        transform: translateY(-2px);
      }

      .primary-button:disabled,
      .secondary-button:disabled {
        cursor: wait;
        opacity: 0.72;
        transform: none;
      }

      .status-line {
        min-height: 24px;
        font-size: 0.92rem;
        color: var(--ink-soft);
      }

      .results-shell {
        display: grid;
        align-content: start;
        gap: 18px;
        min-height: 100%;
        padding: 30px 30px 32px;
        scroll-margin-top: 18px;
        background: linear-gradient(180deg, rgba(17, 19, 34, 0.98), rgba(20, 23, 34, 0.96));
        color: white;
        isolation: isolate;
        opacity: 0;
        transform: translateY(14px);
        animation: rise 700ms ease 180ms forwards;
      }

      .results-shell::before,
      .results-shell::after {
        content: '';
        position: absolute;
        border-radius: 999px;
        pointer-events: none;
        z-index: 0;
      }

      .results-shell::before {
        width: 260px;
        height: 260px;
        top: -120px;
        right: -80px;
        background: radial-gradient(circle, rgba(254, 58, 77, 0.26), transparent 68%);
      }

      .results-shell::after {
        width: 340px;
        height: 340px;
        bottom: -180px;
        left: -140px;
        background: radial-gradient(circle, rgba(255, 255, 255, 0.08), transparent 72%);
      }

      .results-shell > * {
        position: relative;
        z-index: 1;
      }

      .results-loading {
        position: absolute;
        inset: 0;
        z-index: 3;
        display: grid;
        place-items: center;
        padding: 30px;
        background: rgba(10, 12, 18, 0.68);
        backdrop-filter: blur(8px);
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
        transition:
          opacity 180ms ease,
          visibility 0s linear 180ms;
      }

      .results-loading.is-visible {
        opacity: 1;
        visibility: visible;
        pointer-events: auto;
        transition: opacity 180ms ease;
      }

      .results-loading-panel {
        display: grid;
        justify-items: center;
        gap: 14px;
        min-width: min(100%, 320px);
        padding: 24px 26px;
        border-radius: 24px;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.24);
        text-align: center;
      }

      .results-spinner {
        width: 44px;
        height: 44px;
        border-radius: 999px;
        border: 3px solid rgba(255, 255, 255, 0.18);
        border-top-color: var(--accent);
        box-shadow: 0 0 24px rgba(254, 58, 77, 0.2);
        animation: spin 820ms linear infinite;
      }

      .results-loading-text {
        margin: 0;
        color: rgba(255, 255, 255, 0.86);
        line-height: 1.6;
        max-width: 28ch;
      }

      .output-panel {
        margin-top: 24px;
        padding: 20px;
        background: linear-gradient(180deg, rgba(17, 19, 34, 0.96), rgba(10, 12, 18, 0.98));
        color: white;
        opacity: 0;
        transform: translateY(14px);
        animation: rise 700ms ease 240ms forwards;
      }

      .results-topline {
        display: grid;
        gap: 10px;
        align-content: start;
        margin: 2px 0 0;
      }

      .results-title {
        margin: 0;
        font-family: 'Fraunces', serif;
        font-size: clamp(2.25rem, 4vw, 3.2rem);
        line-height: 1.01;
      }

      .results-subtitle {
        margin: 0;
        color: rgba(255, 255, 255, 0.72);
        line-height: 1.6;
        margin-top: 5px;
      }

      .summary-strip {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
      }

      .summary-card {
        display: grid;
        gap: 10px;
        align-content: center;
        min-height: 118px;
        padding: 16px 18px;
        border-radius: 20px;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.06);
      }

      .summary-card strong {
        display: block;
        font-size: 1.75rem;
        font-family: 'Fraunces', serif;
      }

      .results-grid {
        display: grid;
        align-content: start;
        gap: 16px;
      }

      .result-card {
        position: relative;
        display: grid;
        grid-template-columns: minmax(0, 1.2fr) auto auto;
        gap: 12px 16px;
        align-items: stretch;
        padding: 16px 18px;
        border-radius: 20px;
        background:
          linear-gradient(90deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02)),
          rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.06);
        transform-origin: center;
        animation: ticket-pop 300ms ease;
      }

      .result-card::before {
        content: '';
        position: absolute;
        inset: 14px auto 14px 10px;
        width: 3px;
        border-radius: 999px;
        background: linear-gradient(180deg, rgba(254, 58, 77, 0.9), rgba(254, 58, 77, 0.22));
        box-shadow: 0 0 18px rgba(254, 58, 77, 0.18);
      }

      .result-lead {
        display: flex;
        align-items: center;
        align-content: center;
        flex-wrap: wrap;
        gap: 8px 12px;
        min-width: 0;
        padding-left: 10px;
      }

      .flight-code {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 1rem;
        letter-spacing: 0.1em;
        line-height: 1;
      }

      .result-meta {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }

      .result-date {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 10px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.06);
        color: rgba(255, 255, 255, 0.82);
        font-size: 0.78rem;
      }

      .result-date-label {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 0.62rem;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: rgba(255, 255, 255, 0.58);
      }

      .result-date-value {
        font-weight: 700;
      }

      .result-message {
        margin: 0;
        flex-basis: 100%;
        color: rgba(255, 255, 255, 0.72);
        font-size: 0.82rem;
        line-height: 1.45;
        max-width: 36ch;
      }

      .pill {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 6px 10px;
        border-radius: 999px;
        font-family: 'IBM Plex Mono', monospace;
        font-size: 0.68rem;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }

      .pill-success {
        background: rgba(21, 127, 95, 0.14);
        color: #93eccf;
      }

      .pill-warning {
        background: rgba(194, 120, 18, 0.14);
        color: #ffd48a;
      }

      .pill-danger {
        background: rgba(180, 35, 24, 0.18);
        color: #ffb6ad;
      }

      .pill-neutral {
        background: rgba(255, 255, 255, 0.08);
        color: rgba(255, 255, 255, 0.86);
      }

      .timings {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        align-items: stretch;
        justify-content: flex-start;
        justify-self: start;
        align-self: center;
      }

      .timing {
        display: grid;
        align-content: center;
        gap: 4px;
        min-width: 104px;
        min-height: 64px;
        padding: 10px 12px;
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.05);
      }

      .timing-label {
        display: block;
        font-family: 'IBM Plex Mono', monospace;
        font-size: 0.62rem;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: rgba(255, 255, 255, 0.56);
      }

      .timing-value {
        font-size: 0.98rem;
        font-weight: 800;
      }

      .result-actions {
        display: flex;
        align-items: stretch;
        justify-content: flex-end;
      }

      .source-link {
        min-width: 132px;
        min-height: 64px;
        padding: 10px 14px;
        border-radius: 12px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: white;
        text-decoration: none;
        text-align: center;
        white-space: nowrap;
        font-size: 0.92rem;
        background: rgba(254, 58, 77, 0.1);
        border: 1px solid rgba(254, 58, 77, 0.2);
      }

      .empty-state,
      .error-banner,
      .json-panel {
        border-radius: 24px;
      }

      .empty-state {
        padding: 22px;
        border: 1px dashed rgba(255, 255, 255, 0.16);
        color: rgba(255, 255, 255, 0.74);
      }

      .error-banner {
        display: none;
        margin-bottom: 16px;
        padding: 16px 18px;
        background: rgba(180, 35, 24, 0.16);
        color: #ffd2cc;
        border: 1px solid rgba(255, 128, 117, 0.18);
      }

      .json-panel {
        padding: 18px;
        background: rgba(6, 8, 14, 0.55);
        border: 1px solid rgba(255, 255, 255, 0.08);
      }

      .json-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
      }

      pre {
        margin: 14px 0 0;
        overflow: auto;
        font-family: 'IBM Plex Mono', monospace;
        font-size: 0.85rem;
        line-height: 1.7;
        color: #ffdeda;
        white-space: pre-wrap;
        word-break: break-word;
      }

      .visually-hidden {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }

      @keyframes rise {
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes ticket-pop {
        from {
          transform: scale(0.98) translateY(6px);
          opacity: 0;
        }

        to {
          transform: scale(1) translateY(0);
          opacity: 1;
        }
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      @media (max-width: 960px) {
        .workspace {
          grid-template-columns: 1fr;
        }

        .result-card {
          grid-template-columns: minmax(0, 1fr) auto;
        }

        .result-actions {
          justify-content: flex-start;
        }
      }

      @media (max-width: 720px) {
        .page {
          width: min(100vw - 20px, 1180px);
          padding: 18px 0 28px;
        }

        .masthead {
          align-items: start;
          flex-direction: column;
        }

        .control-panel,
        .results-shell,
        .output-panel {
          border-radius: 24px;
        }

        .control-panel,
        .results-shell,
        .output-panel {
          padding: 22px;
        }

        .entry-row,
        .summary-strip {
          grid-template-columns: 1fr;
        }

        .result-card {
          grid-template-columns: 1fr;
        }

        .timings,
        .result-actions {
          justify-self: stretch;
        }

        .source-link {
          width: 100%;
          min-width: 0;
        }

        .panel h1 {
          font-size: clamp(2.4rem, 12vw, 3.4rem);
        }
      }
    </style>
  </head>
  <body>
    <div class="page">
      <header class="masthead">
        <div class="brand">
          <span class="brand-mark">A</span>
          <span id="brandName">Painel de Chegadas</span>
        </div>
        <div class="masthead-tools">
          <div id="mastheadNote" class="masthead-note">Consultas Aviability em direto, pensadas para pessoas.</div>
          <div class="locale-toggle" aria-label="Seletor de idioma">
            <button id="localeTogglePt" class="locale-button is-active" type="button" aria-pressed="true">PT</button>
            <button id="localeToggleEn" class="locale-button" type="button" aria-pressed="false">EN</button>
          </div>
        </div>
      </header>

      <main class="workspace">
        <section class="panel control-panel" aria-labelledby="arrivals-form-title">
          <span id="ticketTag" class="ticket-tag">Consulta de chegadas em lote</span>
          <h1 id="arrivals-form-title">Um lote curto. Um quadro claro.</h1>
          <p id="panelCopy" class="panel-copy">
            Escolha a data, adicione os voos um a um e acompanhe o quadro de chegadas e o JSON no
            mesmo ecrã.
          </p>

          <form id="arrivals-form" class="form-grid">
            <label>
              <span id="arrivalDateLabel" class="field-label">Data de chegada</span>
              <input id="arrivalDate" name="arrivalDate" type="date" required />
            </label>

            <div class="flight-entry-shell">
              <label for="flightNumberEntry">
                <span id="flightNumbersLabel" class="field-label">Números de voo</span>
              </label>
              <div class="entry-row">
                <input
                  id="flightNumberEntry"
                  class="entry-input"
                  type="text"
                  placeholder="Escreva um número de voo e prima Enter"
                  autocomplete="off"
                />
                <button class="entry-button" id="addFlightButton" type="button">
                  Adicionar voo
                </button>
              </div>
              <span id="flightFieldHint" class="field-hint">
                Prima Enter para adicionar o voo atual. Use o X de qualquer etiqueta para o
                remover. Voos duplicados e equivalentes continuam a ser tratados em segurança no
                backend.
              </span>
              <div class="flight-list-toolbar">
                <span id="flightListLabel" class="flight-list-label">Lote atual</span>
                <button id="clearFlightsButton" class="flight-list-clear" type="button" disabled>
                  Limpar tudo
                </button>
              </div>
              <ul id="flightNumberList" class="flight-list" aria-live="polite"></ul>
            </div>

              <div class="actions">
                <button class="primary-button" id="submitButton" type="submit">
                  Ver chegadas
                </button>
            </div>

            <p id="statusLine" class="status-line" role="status" aria-live="polite"></p>
          </form>
        </section>

        <section class="results-shell" aria-labelledby="results-title">
          <div id="resultsLoading" class="results-loading" aria-hidden="true">
            <div class="results-loading-panel" role="status" aria-live="polite">
              <div class="results-spinner" aria-hidden="true"></div>
              <p id="resultsLoadingText" class="results-loading-text">
                A consultar a Aviability e a montar o quadro de chegadas...
              </p>
            </div>
          </div>
          <div class="results-topline">
            <div>
              <span id="resultsHeaderLabel" class="results-header-label">Resultados</span>
              <h2 class="results-title" id="results-title">O seu quadro de chegadas</h2>
              <p id="resultsSubtitle" class="results-subtitle">
                Os voos resolvidos mostram horários e ligações diretas para a Aviability. Falhas e
                bloqueios continuam visíveis em vez de desaparecerem.
              </p>
            </div>
          </div>

          <div id="errorBanner" class="error-banner" role="alert"></div>

          <div class="summary-strip" id="summaryStrip">
            <div class="summary-card">
              <span id="requestedLabel">Pedidos</span>
              <strong id="requestedCount">0</strong>
            </div>
            <div class="summary-card">
              <span id="resolvedLabel">Resolvidos</span>
              <strong id="resolvedCount">0</strong>
            </div>
            <div class="summary-card">
              <span id="failedLabel">Falhados</span>
              <strong id="failedCount">0</strong>
            </div>
          </div>

          <div id="resultsGrid" class="results-grid">
            <div id="resultsEmptyState" class="empty-state">Envie um lote acima e os cartões das chegadas aparecem aqui.</div>
          </div>
        </section>
      </main>

      <section class="panel output-panel json-panel" aria-labelledby="json-title">
        <div class="json-header">
          <div>
            <span id="jsonLabel" class="results-header-label">JSON formatado</span>
            <h3 id="json-title">JSON bruto</h3>
          </div>
          <button class="secondary-button" id="copyJsonButton" type="button">
            Copiar JSON
          </button>
        </div>
        <pre id="jsonOutput">{}</pre>
      </section>
    </div>

    <script>
      const arrivalsForm = document.getElementById('arrivals-form');
      const pageDescription = document.getElementById('pageDescription');
      const brandName = document.getElementById('brandName');
      const mastheadNote = document.getElementById('mastheadNote');
      const ticketTag = document.getElementById('ticketTag');
      const panelTitle = document.getElementById('arrivals-form-title');
      const panelCopy = document.getElementById('panelCopy');
      const arrivalDateLabel = document.getElementById('arrivalDateLabel');
      const flightNumbersLabel = document.getElementById('flightNumbersLabel');
      const flightFieldHint = document.getElementById('flightFieldHint');
      const arrivalDateInput = document.getElementById('arrivalDate');
      const flightNumberEntry = document.getElementById('flightNumberEntry');
      const addFlightButton = document.getElementById('addFlightButton');
      const flightListLabel = document.getElementById('flightListLabel');
      const clearFlightsButton = document.getElementById('clearFlightsButton');
      const flightNumberList = document.getElementById('flightNumberList');
      const submitButton = document.getElementById('submitButton');
      const localeTogglePt = document.getElementById('localeTogglePt');
      const localeToggleEn = document.getElementById('localeToggleEn');
      const statusLine = document.getElementById('statusLine');
      const resultsHeaderLabel = document.getElementById('resultsHeaderLabel');
      const resultsTitle = document.getElementById('results-title');
      const resultsSubtitle = document.getElementById('resultsSubtitle');
      const resultsShell = document.querySelector('.results-shell');
      const resultsLoading = document.getElementById('resultsLoading');
      const resultsLoadingText = document.getElementById('resultsLoadingText');
      const requestedLabel = document.getElementById('requestedLabel');
      const requestedCount = document.getElementById('requestedCount');
      const resolvedLabel = document.getElementById('resolvedLabel');
      const resolvedCount = document.getElementById('resolvedCount');
      const failedLabel = document.getElementById('failedLabel');
      const failedCount = document.getElementById('failedCount');
      const resultsGrid = document.getElementById('resultsGrid');
      const resultsEmptyState = document.getElementById('resultsEmptyState');
      const jsonLabel = document.getElementById('jsonLabel');
      const jsonTitle = document.getElementById('json-title');
      const jsonOutput = document.getElementById('jsonOutput');
      const copyJsonButton = document.getElementById('copyJsonButton');
      const errorBanner = document.getElementById('errorBanner');
      const urlSearchParams = new URLSearchParams(window.location.search);
      const FIXED_AIRPORT_CODE = String.fromCharCode(70, 78, 67);
      const flightNumbers = [];
      let activeLocale = 'pt';
      let isBusy = false;
      let hasSubmitted = false;
      let lastResponse = null;
      let currentStatusState = null;
      let currentErrorState = null;

      const translations = {
        pt: {
          documentLanguage: 'pt-PT',
          documentTitle: 'Painel de Chegadas',
          documentDescription: 'Ver chegadas de voos.',
          brandName: 'Painel de Chegadas',
          mastheadNote: 'Consultas Aviability em direto.',
          ticketTag: 'Consulta de chegadas em lote',
          panelTitle: 'Um lote. Um quadro.',
          panelCopy:
            'Escolha a data, adicione os voos e veja o quadro de chegadas.',
          arrivalDateLabel: 'Data de chegada',
          flightNumbersLabel: 'Números de voo',
          flightEntryPlaceholder: 'U27631',
          addFlightButton: 'Adicionar voo',
          flightFieldHint:
            'Prima Enter para adicionar o voo. Use o X de qualquer etiqueta para remover.',
          flightListLabel: 'Lote atual',
          clearFlightsButton: 'Limpar tudo',
          submitButton: 'Ver chegadas',
          submitButtonBusy: 'A verificar chegadas...',
          resultsLoadingText: 'A consultar a Aviability e a montar o quadro de chegadas...',
          resultsHeaderLabel: 'Resultados',
          resultsTitle: 'O seu quadro de chegadas',
          resultsSubtitle:
            'Os voos mostram horários e links para a Aviability.',
          requestedLabel: 'Pedidos',
          resolvedLabel: 'Resolvidos',
          failedLabel: 'Falhados',
          resultsEmptyState: 'Insira um lote e os cartões das chegadas aparecem aqui.',
          emptyResponse: 'Nenhum voo foi devolvido nesta resposta.',
          emptyFlightList: 'Ainda não adicionou nenhum voo. Escreva um número de voo e prima Enter.',
          jsonLabel: 'JSON formatado',
          jsonTitle: 'JSON bruto',
          copyJsonButton: 'Copiar JSON',
          openSource: 'Abrir origem',
          timingScheduled: 'Programado',
          timingEstimated: 'Estimado',
          timingActual: 'Real',
          timingStatus: 'Estado',
          flightDateLabel: 'Data',
          statusNeedFlightEntry: 'Escreva um número de voo antes de premir Enter.',
          statusAddedOne: 'Voo adicionado ao lote.',
          statusAddedMany: 'Voos adicionados ao lote.',
          statusRemoved: 'Removido {flightNumber}.',
          statusClearedAll: 'Todos os voos foram removidos do lote.',
          statusJsonCopied: 'JSON copiado.',
          statusCopyFailed: 'Falhou a cópia. Pode selecionar o JSON manualmente.',
          statusNeedDateAndFlights: 'Escolha uma data e adicione pelo menos um voo.',
          statusUrlDateInvalid: 'O parâmetro date é inválido. Use o formato YYYY-MM-DD.',
          statusUrlFlightsInvalid: 'O parâmetro flights não inclui voos válidos para carregar.',
          statusUrlFlightsPartial: 'Alguns voos do parâmetro flights foram ignorados.',
          statusChecking: 'A consultar a Aviability...',
          statusRequestFailed: 'O pedido não foi concluído.',
          statusUpdated: 'Quadro de chegadas atualizado.',
          statusConnectionFailed: 'Falha de ligação.',
          errorRequestFailedGeneric: 'O pedido falhou.',
          errorConnectionFailed: 'O frontend não conseguiu comunicar com a API. Confirme que este servidor continua a correr.',
          errorBadRequest: 'O pedido é inválido. Confirme a data e os voos.',
          errorBusy: 'Já existe outro lote a ser processado. Tente de novo dentro de momentos.',
          errorServiceUnavailable: 'O perfil do browser para a Aviability ainda não está pronto.',
          errorPillLabels: {
            not_found: 'sem correspondência',
            ambiguous_match: 'ambíguo',
            blocked_by_aviability: 'bloqueado',
            parse_failed: 'falha de leitura',
          },
          errorMessages: {
            not_found: 'Voo não encontrado',
            ambiguous_match: 'Foram encontradas vários resultados para este voo.',
            blocked_by_aviability: 'A Aviability bloqueou esta pesquisa.',
            parse_failed: 'Não foi possível interpretar os dados deste voo.',
          },
          statusLabels: {
            planned: 'Planeado',
            scheduled: 'Programado',
            arrived: 'Chegou',
            delayed: 'Atrasado',
            estimated: 'Estimado',
            cancelled: 'Cancelado',
            unknown: 'Desconhecido',
          },
        },
        en: {
          documentLanguage: 'en',
          documentTitle: 'Arrival Desk',
          documentDescription: 'Check flight arrivals without touching the API.',
          brandName: 'Arrival Desk',
          mastheadNote: 'Live Aviability checks, shaped for humans.',
          ticketTag: 'Batch arrival lookup',
          panelTitle: 'One short batch. One clear board.',
          panelCopy:
            'Pick the date, add flights one by one, and keep the arrivals board plus JSON on the same screen.',
          arrivalDateLabel: 'Arrival date',
          flightNumbersLabel: 'Flight numbers',
          flightEntryPlaceholder: 'U27631',
          addFlightButton: 'Add flight',
          flightFieldHint:
            'Press Enter to add the current flight. Use the X on any chip to remove it. Duplicate and equivalent flights are still handled safely by the backend.',
          flightListLabel: 'Current batch',
          clearFlightsButton: 'Clear all',
          submitButton: 'Check arrivals',
          submitButtonBusy: 'Checking arrivals...',
          resultsLoadingText: 'Checking Aviability and building the arrivals board...',
          resultsHeaderLabel: 'Results',
          resultsTitle: 'Your arrivals board',
          resultsSubtitle:
            'Resolved flights show schedule data and direct Aviability links. Misses and blocks stay visible instead of disappearing.',
          requestedLabel: 'Requested',
          resolvedLabel: 'Resolved',
          failedLabel: 'Failed',
          resultsEmptyState: 'Submit a batch above and the arrival cards will appear here.',
          emptyResponse: 'No flights came back in this response.',
          emptyFlightList: 'No flights added yet. Type a flight number and press Enter.',
          jsonLabel: 'Formatted payload',
          jsonTitle: 'Raw JSON',
          copyJsonButton: 'Copy JSON',
          openSource: 'Open source',
          timingScheduled: 'Scheduled',
          timingEstimated: 'Estimated',
          timingActual: 'Actual',
          timingStatus: 'Status',
          flightDateLabel: 'Date',
          statusNeedFlightEntry: 'Type a flight number before pressing Enter.',
          statusAddedOne: 'Flight added to the batch.',
          statusAddedMany: 'Flights added to the batch.',
          statusRemoved: 'Removed {flightNumber}.',
          statusClearedAll: 'All flights were removed from the batch.',
          statusJsonCopied: 'JSON copied to the clipboard.',
          statusCopyFailed: 'Clipboard copy failed. You can still select the JSON manually.',
          statusNeedDateAndFlights: 'Pick a date and add at least one flight number.',
          statusUrlDateInvalid: 'The date parameter is invalid. Use YYYY-MM-DD.',
          statusUrlFlightsInvalid: 'The flights parameter does not contain any valid flights to load.',
          statusUrlFlightsPartial: 'Some flights from the flights parameter were skipped.',
          statusChecking: 'Checking Aviability and building the arrivals board...',
          statusRequestFailed: 'The request did not complete.',
          statusUpdated: 'Arrivals board updated.',
          statusConnectionFailed: 'Connection failed.',
          errorRequestFailedGeneric: 'The request failed.',
          errorConnectionFailed: 'The frontend could not reach the API. Make sure this server is still running.',
          errorBadRequest: 'The request is invalid. Check the date and flight numbers.',
          errorBusy: 'Another batch is already running. Try again in a moment.',
          errorServiceUnavailable: 'The Aviability browser profile is not ready yet.',
          errorPillLabels: {
            not_found: 'no match',
            ambiguous_match: 'ambiguous',
            blocked_by_aviability: 'blocked',
            parse_failed: 'parse failed',
          },
          errorMessages: {
            not_found: 'No match found for this flight.',
            ambiguous_match: 'Multiple matches were found for this flight.',
            blocked_by_aviability: 'Aviability blocked this lookup.',
            parse_failed: 'The flight data could not be parsed.',
          },
          statusLabels: {
            planned: 'Planned',
            scheduled: 'Scheduled',
            arrived: 'Arrived',
            delayed: 'Delayed',
            estimated: 'Estimated',
            cancelled: 'Cancelled',
            unknown: 'Unknown',
          },
        },
      };

      function localeStrings() {
        return translations[activeLocale];
      }

      function formatMessage(template, params = {}) {
        let formatted = template;

        for (const [key, value] of Object.entries(params)) {
          formatted = formatted.replace('{' + key + '}', String(value));
        }

        return formatted;
      }

      function prettifyLabel(value) {
        return String(value || '')
          .replace(/[_-]+/g, ' ')
          .replace(/\\b\\w/g, (character) => character.toUpperCase());
      }

      function renderStatus() {
        if (!currentStatusState) {
          statusLine.textContent = '';
          return;
        }

        statusLine.textContent = formatMessage(
          localeStrings()[currentStatusState.key],
          currentStatusState.params,
        );
      }

      function setStatus(key, params = {}) {
        currentStatusState = {
          key,
          params,
        };
        renderStatus();
      }

      function clearStatus() {
        currentStatusState = null;
        renderStatus();
      }

      function getRequestErrorMessage(data, statusCode) {
        const strings = localeStrings();

        if (statusCode === 400) {
          return strings.errorBadRequest;
        }

        if (statusCode === 429) {
          return strings.errorBusy;
        }

        if (statusCode === 503) {
          return strings.errorServiceUnavailable;
        }

        return data?.message || strings.errorRequestFailedGeneric;
      }

      function renderError() {
        if (!currentErrorState) {
          errorBanner.style.display = 'none';
          errorBanner.textContent = '';
          return;
        }

        errorBanner.style.display = 'block';

        if (currentErrorState.type === 'request') {
          errorBanner.textContent = getRequestErrorMessage(
            currentErrorState.data,
            currentErrorState.statusCode,
          );
          return;
        }

        errorBanner.textContent = localeStrings()[currentErrorState.key];
      }

      function clearError() {
        currentErrorState = null;
        renderError();
      }

      function setRequestError(data, statusCode) {
        currentErrorState = {
          type: 'request',
          data,
          statusCode,
        };
        renderError();
      }

      function setError(key) {
        currentErrorState = {
          type: 'message',
          key,
        };
        renderError();
      }

      function formatStatusLabel(status) {
        const normalized = String(status || 'unknown').trim().toLowerCase();
        return localeStrings().statusLabels[normalized] || prettifyLabel(status);
      }

      function formatErrorPill(errorCode) {
        return localeStrings().errorPillLabels[errorCode] || prettifyLabel(errorCode);
      }

      function formatErrorMessage(error) {
        if (!error) {
          return '';
        }

        return localeStrings().errorMessages[error.code] || error.message;
      }

      function getTodayInputValue() {
        const now = new Date();
        const offset = now.getTimezoneOffset() * 60_000;
        return new Date(now.getTime() - offset).toISOString().slice(0, 10);
      }

      function isValidArrivalDate(value) {
        const match = String(value || '').match(/^(\\d{4})-(\\d{2})-(\\d{2})$/);

        if (!match) {
          return false;
        }

        const [, year, month, day] = match;
        const parsed = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));

        return (
          parsed.getUTCFullYear() === Number(year) &&
          parsed.getUTCMonth() === Number(month) - 1 &&
          parsed.getUTCDate() === Number(day)
        );
      }

      function splitFlightNumbers(value) {
        return value
          .split(/[\\s,]+/)
          .map((flightNumber) => flightNumber.trim().toUpperCase())
          .filter(Boolean);
      }

      function parseBootstrapFlights(value) {
        if (typeof value !== 'string') {
          return {
            validFlightNumbers: [],
            invalidEntries: 0,
          };
        }

        const rawEntries = value.split(',');
        const validFlightNumbers = [];
        let invalidEntries = 0;

        for (const rawEntry of rawEntries) {
          const parsedFlights = splitFlightNumbers(rawEntry);

          if (parsedFlights.length === 0) {
            invalidEntries += 1;
            continue;
          }

          validFlightNumbers.push(...parsedFlights);
        }

        return {
          validFlightNumbers,
          invalidEntries,
        };
      }

      function renderFlightNumberList() {
        flightNumberList.replaceChildren();
        clearFlightsButton.disabled = isBusy || flightNumbers.length === 0;

        if (flightNumbers.length === 0) {
          const emptyItem = document.createElement('li');
          emptyItem.className = 'flight-list-empty';
          emptyItem.textContent = localeStrings().emptyFlightList;
          flightNumberList.append(emptyItem);
          return;
        }

        flightNumbers.forEach((flightNumber, index) => {
          const item = document.createElement('li');
          item.className = 'flight-chip';

          const code = document.createElement('span');
          code.className = 'flight-chip-code';
          code.textContent = flightNumber;

          const removeButton = document.createElement('button');
          removeButton.className = 'chip-remove';
          removeButton.type = 'button';
          removeButton.setAttribute(
            'aria-label',
            activeLocale === 'pt' ? 'Remover ' + flightNumber : 'Remove ' + flightNumber,
          );
          removeButton.textContent = '×';
          removeButton.addEventListener('click', () => {
            flightNumbers.splice(index, 1);
            renderFlightNumberList();
            setStatus('statusRemoved', { flightNumber });
          });

          item.append(code, removeButton);
          flightNumberList.append(item);
        });
      }

      function addFlightNumber(value) {
        const parsedFlightNumbers = splitFlightNumbers(value);

        if (parsedFlightNumbers.length === 0) {
          return false;
        }

        flightNumbers.push(...parsedFlightNumbers);
        renderFlightNumberList();
        return true;
      }

      function addFlightNumberFromEntry() {
        const wasAdded = addFlightNumber(flightNumberEntry.value);

        if (!wasAdded) {
          setStatus('statusNeedFlightEntry');
          return;
        }

        const addedCount = splitFlightNumbers(flightNumberEntry.value).length;
        flightNumberEntry.value = '';
        flightNumberEntry.focus();
        setStatus(addedCount === 1 ? 'statusAddedOne' : 'statusAddedMany');
      }

      function clearAllFlights() {
        if (flightNumbers.length === 0) {
          return;
        }

        flightNumbers.length = 0;
        renderFlightNumberList();
        setStatus('statusClearedAll');
        flightNumberEntry.focus();
      }

      function setBusyState(nextBusy) {
        isBusy = Boolean(nextBusy);
        submitButton.disabled = isBusy;
        addFlightButton.disabled = isBusy;
        flightNumberEntry.disabled = isBusy;
        clearFlightsButton.disabled = isBusy || flightNumbers.length === 0;
        resultsLoading.classList.toggle('is-visible', isBusy);
        resultsLoading.setAttribute('aria-hidden', String(!isBusy));
        submitButton.textContent = isBusy
          ? localeStrings().submitButtonBusy
          : localeStrings().submitButton;
      }

      function setSummary(summary) {
        requestedCount.textContent = String(summary.requested ?? 0);
        resolvedCount.textContent = String(summary.resolved ?? 0);
        failedCount.textContent = String(summary.failed ?? 0);
      }

      function getPillClass(result) {
        if (result.error) {
          return 'pill pill-danger';
        }

        const normalized = String(result.status || '').toLowerCase();
        if (normalized.includes('arriv')) {
          return 'pill pill-success';
        }

        if (normalized.includes('delay')) {
          return 'pill pill-warning';
        }

        return 'pill pill-neutral';
      }

      function createTiming(label, value) {
        const timing = document.createElement('div');
        timing.className = 'timing';

        const timingLabel = document.createElement('span');
        timingLabel.className = 'timing-label';
        timingLabel.textContent = label;

        const timingValue = document.createElement('span');
        timingValue.className = 'timing-value';
        timingValue.textContent = value;

        timing.append(timingLabel, timingValue);
        return timing;
      }

      function formatDisplayDate(dateString) {
        const match = String(dateString || '').match(/^(\\d{4})-(\\d{2})-(\\d{2})$/);

        if (!match) {
          return String(dateString || '');
        }

        const [, year, month, day] = match;
        return day + '/' + month + '/' + year;
      }

      function renderResults(results) {
        resultsGrid.replaceChildren();

        if (!Array.isArray(results) || results.length === 0) {
          const emptyState = document.createElement('div');
          emptyState.className = 'empty-state';
          emptyState.textContent = hasSubmitted
            ? localeStrings().emptyResponse
            : localeStrings().resultsEmptyState;
          resultsGrid.append(emptyState);
          return;
        }

        for (const result of results) {
          const card = document.createElement('article');
          card.className = 'result-card';

          const left = document.createElement('div');
          left.className = 'result-lead';
          const flightCode = document.createElement('div');
          flightCode.className = 'flight-code';
          flightCode.textContent = result.flightNumber;

          const meta = document.createElement('div');
          meta.className = 'result-meta';

          const pill = document.createElement('span');
          pill.className = getPillClass(result);
          pill.textContent = result.error
            ? formatErrorPill(result.error.code)
            : formatStatusLabel(result.status);
          meta.append(pill);

          const dateLabel = document.createElement('span');
          dateLabel.className = 'result-date-label';
          dateLabel.textContent = localeStrings().flightDateLabel;

          const dateValue = document.createElement('span');
          dateValue.className = 'result-date-value';
          dateValue.textContent = formatDisplayDate(arrivalDateInput.value);

          const dateBadge = document.createElement('span');
          dateBadge.className = 'result-date';
          dateBadge.append(dateLabel, dateValue);
          meta.append(dateBadge);

          if (result.error) {
            const message = document.createElement('p');
            message.className = 'result-message';
            message.textContent = formatErrorMessage(result.error);
            left.append(flightCode, meta, message);
          } else {
            left.append(flightCode, meta);
          }

          const middle = document.createElement('div');
          middle.className = 'timings';

          if (result.scheduledArrivalLocal) {
            middle.append(createTiming(localeStrings().timingScheduled, result.scheduledArrivalLocal));
          }

          if (result.estimatedArrivalLocal) {
            middle.append(createTiming(localeStrings().timingEstimated, result.estimatedArrivalLocal));
          }

          if (result.actualArrivalLocal) {
            middle.append(createTiming(localeStrings().timingActual, result.actualArrivalLocal));
          }

          if (!result.error && middle.childElementCount === 0) {
            middle.append(createTiming(localeStrings().timingStatus, formatStatusLabel(result.status || 'unknown')));
          }

          const right = document.createElement('div');
          right.className = 'result-actions';
          if (result.sourceUrl) {
            const sourceLink = document.createElement('a');
            sourceLink.className = 'source-link';
            sourceLink.href = result.sourceUrl;
            sourceLink.target = '_blank';
            sourceLink.rel = 'noreferrer';
            sourceLink.textContent = localeStrings().openSource;
            right.append(sourceLink);
          }

          card.append(left, middle, right);
          resultsGrid.append(card);
        }
      }

      function renderResponse(payload) {
        lastResponse = payload;
        setSummary(payload.summary || {});
        renderResults(payload.results || []);
        jsonOutput.textContent = JSON.stringify(payload, null, 2);
      }

      function applyLocale(locale) {
        activeLocale = locale === 'en' ? 'en' : 'pt';

        const strings = localeStrings();
        document.documentElement.lang = strings.documentLanguage;
        document.title = strings.documentTitle;
        pageDescription.setAttribute('content', strings.documentDescription);

        brandName.textContent = strings.brandName;
        mastheadNote.textContent = strings.mastheadNote;
        ticketTag.textContent = strings.ticketTag;
        panelTitle.textContent = strings.panelTitle;
        panelCopy.textContent = strings.panelCopy;
        arrivalDateLabel.textContent = strings.arrivalDateLabel;
        flightNumbersLabel.textContent = strings.flightNumbersLabel;
        flightNumberEntry.placeholder = strings.flightEntryPlaceholder;
        addFlightButton.textContent = strings.addFlightButton;
        flightFieldHint.textContent = strings.flightFieldHint;
        flightListLabel.textContent = strings.flightListLabel;
        clearFlightsButton.textContent = strings.clearFlightsButton;
        resultsLoadingText.textContent = strings.resultsLoadingText;
        resultsHeaderLabel.textContent = strings.resultsHeaderLabel;
        resultsTitle.textContent = strings.resultsTitle;
        resultsSubtitle.textContent = strings.resultsSubtitle;
        requestedLabel.textContent = strings.requestedLabel;
        resolvedLabel.textContent = strings.resolvedLabel;
        failedLabel.textContent = strings.failedLabel;
        resultsEmptyState.textContent = strings.resultsEmptyState;
        jsonLabel.textContent = strings.jsonLabel;
        jsonTitle.textContent = strings.jsonTitle;
        copyJsonButton.textContent = strings.copyJsonButton;

        localeTogglePt.classList.toggle('is-active', activeLocale === 'pt');
        localeTogglePt.setAttribute('aria-pressed', String(activeLocale === 'pt'));
        localeToggleEn.classList.toggle('is-active', activeLocale === 'en');
        localeToggleEn.setAttribute('aria-pressed', String(activeLocale === 'en'));

        setBusyState(isBusy);
        renderStatus();
        renderError();
        renderFlightNumberList();

        if (lastResponse) {
          renderResults(lastResponse.results || []);
        } else {
          renderResults([]);
        }
      }

      function scrollToResultsBoard() {
        if (!resultsShell) {
          return;
        }

        requestAnimationFrame(() => {
          resultsShell.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        });
      }

      async function copyJson() {
        try {
          await navigator.clipboard.writeText(jsonOutput.textContent || '{}');
          setStatus('statusJsonCopied');
        } catch (error) {
          setStatus('statusCopyFailed');
        }
      }

      async function submitArrivalsLookup() {
        clearError();
        hasSubmitted = true;
        lastResponse = null;

        const payload = {
          airportCode: FIXED_AIRPORT_CODE,
          arrivalDate: arrivalDateInput.value,
          flightNumbers: [...flightNumbers],
        };

        if (!payload.arrivalDate || payload.flightNumbers.length === 0) {
          setStatus('statusNeedDateAndFlights');
          return;
        }

        setBusyState(true);
        setStatus('statusChecking');

        try {
          const response = await fetch('/arrivals', {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
            },
            body: JSON.stringify(payload),
          });

          const data = await response.json();
          jsonOutput.textContent = JSON.stringify(data, null, 2);

          if (!response.ok) {
            setSummary({
              requested: payload.flightNumbers.length,
              resolved: 0,
              failed: payload.flightNumbers.length,
            });
            renderResults([]);
            setRequestError(data, response.status);
            setStatus('statusRequestFailed');
            scrollToResultsBoard();
            return;
          }

          renderResponse(data);
          setStatus('statusUpdated');
          scrollToResultsBoard();
        } catch (error) {
          lastResponse = null;
          setSummary({
            requested: 0,
            resolved: 0,
            failed: 0,
          });
          renderResults([]);
          setError('errorConnectionFailed');
          setStatus('statusConnectionFailed');
        } finally {
          setBusyState(false);
        }
      }

      function applyBootstrapParams() {
        const bootstrapFlightsValue = urlSearchParams.get('flights');
        const bootstrapDateValue = urlSearchParams.get('date');
        let hasBootstrapIssue = false;

        if (bootstrapDateValue !== null) {
          if (isValidArrivalDate(bootstrapDateValue)) {
            arrivalDateInput.value = bootstrapDateValue;
          } else {
            hasBootstrapIssue = true;
            setStatus('statusUrlDateInvalid');
          }
        }

        if (bootstrapFlightsValue !== null) {
          const bootstrapFlights = parseBootstrapFlights(bootstrapFlightsValue);

          if (bootstrapFlights.validFlightNumbers.length > 0) {
            flightNumbers.length = 0;
            addFlightNumber(bootstrapFlights.validFlightNumbers.join(','));
          }

          if (bootstrapFlights.invalidEntries > 0) {
            hasBootstrapIssue = true;
            setStatus('statusUrlFlightsPartial');
          }

          if (bootstrapFlights.validFlightNumbers.length === 0) {
            hasBootstrapIssue = true;
            setStatus('statusUrlFlightsInvalid');
          }
        }

        if (
          !hasBootstrapIssue &&
          bootstrapFlightsValue !== null &&
          bootstrapDateValue !== null &&
          flightNumbers.length > 0 &&
          isValidArrivalDate(arrivalDateInput.value)
        ) {
          void submitArrivalsLookup();
        }
      }

      addFlightButton.addEventListener('click', () => {
        addFlightNumberFromEntry();
      });

      clearFlightsButton.addEventListener('click', () => {
        clearAllFlights();
      });

      flightNumberEntry.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter') {
          return;
        }

        event.preventDefault();
        addFlightNumberFromEntry();
      });

      localeTogglePt.addEventListener('click', () => {
        applyLocale('pt');
      });

      localeToggleEn.addEventListener('click', () => {
        applyLocale('en');
      });

      copyJsonButton.addEventListener('click', () => {
        void copyJson();
      });

      arrivalsForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        await submitArrivalsLookup();
      });

      arrivalDateInput.value = getTodayInputValue();
      applyLocale(activeLocale);
      applyBootstrapParams();
    </script>
  </body>
</html>`;
}

export function registerHomeRoute(app: FastifyInstance): void {
  app.get('/', async (_request, reply) => reply.type('text/html; charset=utf-8').send(renderHomePage()));
}
