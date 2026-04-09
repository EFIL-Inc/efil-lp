# EFIL AIコンサルティング LP - デザイントークン

Editorial-style B2B consulting site. Restrained luxury, typographic-led hierarchy, generous whitespace, dark navy base with gold accent.

---

## 1. カラーパレット

| Token | Hex | 用途 |
|---|---|---|
| `navy.900` | `#0D1B2A` | 背景メイン（ヒーロー、ダークセクション） |
| `navy.800` | `#1B2A4A` | 背景サブ（セクション交互、ダーク内のブロック） |
| `white` | `#FFFFFF` | カード背景、ライトセクション、ダーク上テキスト |
| `gold.500` | `#C9A84C` | アクセント（CTAボタン、ホバー下線、強調線） |
| `gold.600` | `#B2923A` | ゴールドホバー時の暗色 |
| `ink.900` | `#1A1A2E` | テキスト本文（ライト背景上） |
| `ink.500` | `#6B7A99` | テキスト補足（キャプション、ラベル） |
| `line.200` | `#E5E7EB` | 罫線、区切り線（ライト背景上） |
| `line.700` | `#2A3A5C` | 罫線、区切り線（ダーク背景上） |

---

## 2. タイポグラフィ

- **見出し系**：`Noto Serif JP`（700）
- **本文・UI**：`Noto Sans JP`（400 / 600）

| Token | Size | Weight | Line-height | Letter-spacing | 用途 |
|---|---|---|---|---|---|
| `display` | 52px | 700 | 1.25 | -0.02em | h1（Serif） |
| `h2` | 36px | 700 | 1.35 | -0.01em | セクション見出し（Serif） |
| `h3` | 18px | 600 | 1.5 | 0 | カード見出し（Sans） |
| `body` | 16px | 400 | 1.85 | 0 | 本文（Sans） |
| `small` | 14px | 400 | 1.7 | 0.02em | 補足テキスト（Sans） |
| `label` | 12px | 600 | 1.4 | 0.15em | ラベル・番号（Sans, uppercase） |

本文エリア最大幅：`680px`（中央揃え）。

---

## 3. スペーシング

4px グリッドを基準。

| Token | px |
|---|---|
| `1` | 4 |
| `2` | 8 |
| `3` | 12 |
| `4` | 16 |
| `6` | 24 |
| `8` | 32 |
| `12` | 48 |
| `16` | 64 |
| `20` | 80 |
| `section` | 120（セクション縦余白・最低値） |
| `section-lg` | 160（広めのセクション） |

---

## 4. ブレークポイント

Tailwind デフォルトに準拠。モバイルファースト。

| Token | min-width |
|---|---|
| `sm` | 640px |
| `md` | 768px |
| `lg` | 1024px |
| `xl` | 1280px |
| `2xl` | 1536px |

コンテナ最大幅：`container-narrow` = 1120px、本文 = 680px。

---

## 5. Tailwind config（CDN版 theme.extend）

```html
<script>
  tailwind.config = {
    theme: {
      extend: {
        colors: {
          navy: {
            900: '#0D1B2A',
            800: '#1B2A4A',
          },
          gold: {
            500: '#C9A84C',
            600: '#B2923A',
          },
          ink: {
            900: '#1A1A2E',
            500: '#6B7A99',
          },
          line: {
            200: '#E5E7EB',
            700: '#2A3A5C',
          },
        },
        fontFamily: {
          serif: ['"Noto Serif JP"', 'serif'],
          sans: ['"Noto Sans JP"', 'sans-serif'],
        },
        fontSize: {
          // [size, { lineHeight, letterSpacing }]
          display: ['52px', { lineHeight: '1.25', letterSpacing: '-0.02em' }],
          h2:      ['36px', { lineHeight: '1.35', letterSpacing: '-0.01em' }],
          h3:      ['18px', { lineHeight: '1.5' }],
          body:    ['16px', { lineHeight: '1.85' }],
          small:   ['14px', { lineHeight: '1.7',  letterSpacing: '0.02em' }],
          label:   ['12px', { lineHeight: '1.4',  letterSpacing: '0.15em' }],
        },
        spacing: {
          'section':    '120px',
          'section-lg': '160px',
        },
        maxWidth: {
          'narrow':  '680px',
          'content': '1120px',
        },
        letterSpacing: {
          tightest: '-0.02em',
          label:    '0.15em',
        },
      },
    },
  };
</script>
```

---

## 6. カスタムクラス（@layer components）

CLAUDE.md の禁止事項を反映：
- `box-shadow` は **使わない**（`.btn-cta` のフォーカスリングも `outline` で表現）
- 背景グラデーション **なし**
- アニメーションは `fadeIn` のみ（スクロール連動）
- アイコンライブラリ不使用（SVG直書き前提、トークンには含めない）

```html
<style type="text/tailwindcss">
  @layer base {
    html {
      scroll-behavior: smooth;
    }
    body {
      @apply font-sans text-body text-ink-900 bg-white antialiased;
    }
    h1, h2, h3 {
      @apply font-serif;
    }
  }

  @layer components {
    /* Layout */
    .container-narrow {
      @apply mx-auto w-full max-w-content px-6 md:px-10;
    }
    .container-text {
      @apply mx-auto w-full max-w-narrow px-6 md:px-0;
    }
    .section {
      @apply py-section;
    }
    .section-dark {
      @apply bg-navy-900 text-white;
    }
    .section-sub {
      @apply bg-navy-800 text-white;
    }

    /* Headings */
    .heading-serif {
      @apply font-serif font-bold text-h2 tracking-tightest;
    }
    .heading-display {
      @apply font-serif font-bold text-display tracking-tightest;
    }
    .heading-card {
      @apply font-sans font-semibold text-h3;
    }
    .label-eyebrow {
      @apply font-sans text-label uppercase text-gold-500;
    }

    /* CTA */
    .btn-cta {
      @apply inline-flex items-center justify-center
             px-10 py-4
             bg-gold-500 text-navy-900
             font-sans font-semibold text-[15px]
             tracking-wide
             border border-gold-500
             transition-colors duration-200
             hover:bg-gold-600 hover:border-gold-600
             focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-gold-500;
    }
    .btn-cta-ghost {
      @apply inline-flex items-center justify-center
             px-10 py-4
             bg-transparent text-gold-500
             font-sans font-semibold text-[15px]
             border border-gold-500
             transition-colors duration-200
             hover:bg-gold-500 hover:text-navy-900;
    }

    /* Cards */
    .card {
      @apply bg-white text-ink-900 p-8 md:p-10 border border-line-200;
    }
    .card-dark {
      @apply bg-navy-800 text-white p-8 md:p-10 border border-line-700;
    }

    /* Dividers / accents */
    .rule-gold {
      @apply block w-12 h-px bg-gold-500;
    }

    /* Forms */
    .form-input {
      @apply w-full px-4 py-3
             bg-white text-ink-900
             border border-line-200
             font-sans text-body
             transition-colors duration-200
             focus:outline-none focus:border-gold-500;
    }
    .form-label {
      @apply block font-sans text-small font-semibold text-ink-900 mb-2;
    }

    /* FAQ */
    .faq-item {
      @apply border-b border-line-200;
    }
    .faq-question {
      @apply w-full flex items-center justify-between
             py-6 text-left
             font-sans font-semibold text-h3 text-ink-900
             transition-colors duration-200
             hover:text-gold-500;
    }
    .faq-answer {
      @apply pb-6 text-body text-ink-500 leading-relaxed;
    }
  }

  @layer utilities {
    /* The ONLY allowed animation: scroll-triggered fade-in */
    .fade-in {
      opacity: 0;
      transform: translateY(16px);
      transition: opacity 0.8s ease-out, transform 0.8s ease-out;
    }
    .fade-in.is-visible {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
```

---

## 7. 禁止事項チェック

- [x] `box-shadow` クラスを一切定義していない
- [x] `bg-gradient-*` を一切使用していない
- [x] Font Awesome など外部アイコン不使用（SVG直書き前提）
- [x] ヒーロー用の抽象グラフィック背景トークンなし
- [x] SaaS系青×白配色なし（ネイビー×ゴールドのみ）
- [x] アニメーションは `.fade-in` の1種のみ
