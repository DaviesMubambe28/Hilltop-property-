import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import type { Plugin } from 'vite';

const propertyRoutes = {
  name: 'property-routes',
  configureServer(server: { middlewares: { use: (handler: (request: { url?: string }, response: unknown, next: () => void) => void) => void } }) {
    server.middlewares.use((request, _response, next) => { if (request.url?.startsWith('/property/')) request.url = '/property.html'; next(); });
  },
  configurePreviewServer(server: { middlewares: { use: (handler: (request: { url?: string }, response: unknown, next: () => void) => void) => void } }) {
    server.middlewares.use((request, _response, next) => { if (request.url?.startsWith('/property/')) request.url = '/property.html'; next(); });
  },
};

const publicPages = new Set(['index.html','properties.html','property.html','about.html','contact.html','sell.html','resources.html','compare.html']);
const companyContact = { phoneUri: '+260979972019', phoneLabel: '+260 979 972 019', email: 'probbymalyango@gmail.com' };
const componentsDirectory = resolve(import.meta.dirname, 'src/components');
const accountIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="9" r="3"/><path d="M6 18c1-4 11-4 12 0"/></svg>`;
const homepageAccountControl = `<button class="button button-dark account-button hilltop-login" type="button" data-account-entry disabled>${accountIcon}<span data-account-label>Login</span></button>`;
const publicAccountControl = `<a class="button button-dark account-button hilltop-login" href="/?account=required">${accountIcon}<span>Login</span></a>`;
const homepageCalculators = `<details class="footer-calculators" id="tools"><summary>Calculators</summary><div class="footer-calculator-links"><button type="button" data-tool="mortgage">Mortgage calculator</button><button type="button" data-tool="affordability">Affordability calculator</button><button type="button" data-tool="rental">Rental yield calculator</button><button type="button" data-tool="cost">Buying cost estimator</button></div></details>`;

function readComponent(name: string): string {
  return readFileSync(resolve(componentsDirectory, name), 'utf8');
}

function fillComponent(template: string, replacements: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(replacements)) {
    result = result.replaceAll(`{{${key}}}`, () => value);
  }
  if (/\{\{[A-Z_]+\}\}/.test(result)) throw new Error('Unresolved Hilltop component placeholder.');
  return result;
}

function sharedSiteComponents(): Plugin {
  return {
    name: 'hilltop-shared-site-components',
    configureServer(server) {
      server.watcher.add(componentsDirectory);
      server.watcher.on('change', file => {
        if (file.startsWith(componentsDirectory) && file.endsWith('.html')) {
          server.ws.send({ type: 'full-reload', path: '*' });
        }
      });
    },
    transformIndexHtml: {
      order: 'pre',
      handler(html, context) {
        const filename = basename(context.filename);
        if (!publicPages.has(filename)) return html;
        const isHomepage = filename === 'index.html';
        const headerMarker = '<!-- HILLTOP_SHARED_HEADER -->';
        const footerMarker = '<!-- HILLTOP_SHARED_FOOTER -->';
        if (html.split(headerMarker).length !== 2 || html.split(footerMarker).length !== 2) {
          throw new Error(`Invalid shared component markers in ${filename}`);
        }
        const socialLinks = readComponent('social-links.html');
        const common = { PHONE_URI: companyContact.phoneUri, PHONE_LABEL: companyContact.phoneLabel, EMAIL: companyContact.email, SOCIAL_LINKS: socialLinks };
        const header = fillComponent(readComponent('site-header.html'), { ...common, ACCOUNT_CONTROL: isHomepage ? homepageAccountControl : publicAccountControl });
        const footer = fillComponent(readComponent('site-footer.html'), {
          ...common,
          YEAR: String(new Date().getFullYear()),
          ALERT_ID: isHomepage ? 'id="contact"' : '',
          ALERT_HREF: isHomepage ? '#properties' : '/#properties',
          CALCULATORS: isHomepage ? homepageCalculators : '<a href="/#tools">Calculators</a>'
        });
        return html.replace(headerMarker, () => header).replace(footerMarker, () => footer);
      }
    }
  };
}

export default defineConfig({
  plugins: [propertyRoutes, sharedSiteComponents()],
  server: { port: 4173, watch: { ignored: ['**/work/**', '**/docs/screenshots/**', '**/test-results/**', '**/playwright-report/**'] } },
  preview: { port: 4173 },
  build: { target: 'es2022', sourcemap: true, rollupOptions: { input: { main: resolve(import.meta.dirname, 'index.html'), resources: resolve(import.meta.dirname, 'resources.html'), properties: resolve(import.meta.dirname, 'properties.html'), sell: resolve(import.meta.dirname, 'sell.html'), about: resolve(import.meta.dirname, 'about.html'), contact: resolve(import.meta.dirname, 'contact.html'), admin: resolve(import.meta.dirname, 'admin.html'), account: resolve(import.meta.dirname, 'account.html'), property: resolve(import.meta.dirname, 'property.html'), compare: resolve(import.meta.dirname, 'compare.html') } } },
});
