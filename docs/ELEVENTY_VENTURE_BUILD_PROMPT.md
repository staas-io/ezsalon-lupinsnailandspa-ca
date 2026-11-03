# Prompt: Build a Salon/Spa Website with Eleventy using Venture Template

You are tasked with rebuilding a static website (like a salon/spa) using [Eleventy (11ty)](https://www.11ty.dev/) v3, inspired by the [CloudCannon Venture Eleventy Template](https://github.com/CloudCannon/venture-eleventy-template).

## Goal
Create a lightweight Eleventy site with:
- Clean, responsive design suitable for a service business
- Dynamic content loading via AJAX from third-party APIs
- Services, contact information, and business hours loaded dynamically with fallbacks
- Multiple pages (Home, Services, About, Contact, Gallery, etc.)

## Steps

### 1. Project Setup
- Create `.eleventy.js` configuration with EleventyHtmlBasePlugin, passthrough copies for CSS/JS/images, input `src/`, output `_site/`
- Create `package.json` with build/start/dev scripts
- Create directory structure under `src/`

### 2. Base Layout
Create `src/_includes/layouts/base.liquid` with header/nav, `{{ content }}`, footer with placeholders (`#footer-address`, `#footer-phone`, `#footer-email`, `#footer-hours`), body data attributes for APIs, and script includes.

### 3. Styling & JS
Add CSS in `src/assets/css/style.css`, nav toggle in `src/assets/js/main.js`, AJAX loader in `src/assets/js/dynamic-content.js` with fallbacks and support for different API response formats.

### 4. Pages
Create Liquid/HTML pages in `src/pages/` with frontmatter layout/title/permalink.

### 5. Build
Run `npm run build` to generate `_site/`, serve with `npm run serve`.
