# Briefdesk branding branch

This branch (`hg/briefdesk-branding`) makes the Superdesk client present itself as **Briefdesk**, a security and risk intelligence product, for an internal demo. It is a deliberate hack: the product name, the logo, the favicon and the palette are hard-coded. It exists to answer "what would this look like as its own product?" quickly, not to be merged. The proposal at the bottom is what the same result should look like as configuration.

Everything reachable by the `langOverride` translation mechanism (any string wrapped in `gettext` or the `translate` filter or directive) is handled in the distribution's `client/superdesk.config.js`, not here. This branch only covers what `langOverride` cannot reach.

Brand: ink navy `#10243E`, green `#1FB57A`, white. Analyst firm in the fiction: Halden Risk Intelligence.

## What changed

### Assets

| File | Change |
|---|---|
| `images/superdesk-logo.svg` | Replaced with the Briefdesk logo for light backgrounds (navy wordmark). Same `154x48` viewBox as before, so nothing needed resizing. Currently referenced nowhere, kept so the pair stays complete. |
| `images/superdesk-logo_white.svg` | Replaced with the Briefdesk logo for dark backgrounds (white wordmark, green mark). |
| `images/favicon.ico` | Replaced with the Briefdesk mark (16x16 and 32x32). |

Every place the client drew a logo sits on a dark background, so all four call sites now point at the `_white` variant:

- `scripts/core/auth/login-modal.html`
- `scripts/core/auth/secure-login.html`
- `scripts/core/auth/reset-password.html`
- `scripts/core/menu/styles/menu.scss` (the `.icon-superdesk` rule in the main menu footer)

`styles/sass/modals.scss` (the About modal header) already used the `_white` variant and was left alone; the theme file recolours that header from Superdesk green to navy so the white logo still reads.

`images/SF_logo.svg` is the Sourcefabric logo shown in the About modal body. Left untouched on purpose: it is part of the attribution.

### Product name

| File | Change |
|---|---|
| `index.html.js` | `<title>Superdesk</title>` to `Briefdesk`. |
| `scripts/core/services/pageTitle.ts` | The service's title prefix, used for every `document.title` update. |
| `scripts/apps/search/controllers/SearchMenuController.ts` | `SUPERDESK_PROVIDER.name`, the label of the local repo in the search provider dropdown. |
| `scripts/apps/search/views/repo-dropdown.html` | The hard-coded `'Superdesk'` fallback next to it. |
| `scripts/core/menu/views/menu.html` | "Powered by Superdesk technology" to "Built on Superdesk technology", "About Superdesk" to "About Briefdesk", and the logo's `aria-label`. |
| `scripts/core/menu/views/about.html` | Rewritten, see below. |

The About modal now says: Briefdesk, by Halden Risk Intelligence (demo), what the product does, then "Built on Superdesk, the open-source platform by Sourcefabric z.u.". The AGPLv3 notice, the copyright line and a link to the source stay, because the client is AGPL and this build is shown to people outside the team. The news-specific copy ("end-to-end news creation ... software for journalism") and the Superdesk support links (forum, user manual, support mailbox) are gone; a Briefdesk user has no business being sent to the Superdesk forum.

### Colours

`styles/sass/briefdesk-theme.scss`, imported from `scripts/index.ts` immediately after `superdesk-ui-framework/dist/superdesk-ui.bundle.css` so it can override that bundle's custom properties. That import position is load-bearing: the comment at the top of `scripts/index.ts` is where the project puts styles that must land first or last.

The ui-framework ships as a precompiled CSS bundle, so its SCSS variables are not reachable. Its custom properties are. Each colour ramp is derived from one hue/saturation pair (`--sd-colour-interactive-hs` and friends, in `app/styles/deprecate/_new-colors.scss`), and the newer token layer derives every `--brand-primary-NNN` shade from a single `--brand-primary` with relative `lch()`. So the whole palette moves with about a dozen declarations:

- `--sd-colour-interactive-hs`, `--sd-colour-primary-hs`, `--sd-colour-superdesk-hs` set to `156, 71%` (the logo green's hue and saturation). This carries links, focus rings, selection, active states and toggles.
- `--sd-colour-interactive-l--50` pinned to 42% lightness, which is exactly `#1FB57A`. The ramp's default step is 50%, which would have been a brighter mint.
- `--brand-primary` set to `#1FB57A` for the newer token layer.
- `--sd-colour-top-menu` and `--sd-colour-top-menu__btn` set to navy. The top bar is already dark in both themes, so navy is a drop-in.
- `#main-menu, .main-menu` background set to navy directly. `menu.scss` paints it with `--sd-colour-bg--02`, which is shared with panels and list item backgrounds, so overriding the token would have repainted far more than the menu.
- `.login-screen` redefines `--sd-colour-bg--02` (its own background) and `--sd-colour-bg--04` (its inputs) on itself, plus a faint green radial gradient. Redefining the properties on the element sidesteps the deep selectors in `auth.scss` instead of fighting their specificity.

Contrast, measured as WCAG 2.1 relative-luminance ratios:

| Pair | Ratio | |
|---|---|---|
| White on navy `#10243E` | 15.63 | AAA |
| Green `#1FB57A` on navy | 5.91 | AA |
| Navy on green `#1FB57A` | 5.91 | AA |
| White on green `#1FB57A` | 2.64 | **fails** |
| White on `#007F49` | 5.08 | AA |
| White on `#006A36` | 6.74 | AA |
| `#168357` (interactive text, light theme) on white | 4.75 | AA |
| Footer "Built on Superdesk" grey on navy | 5.28 | AA |

So filled buttons (`.btn--primary`, `.btn--sd-green`), which keep the framework's white label, use `#007F49` with `#006A36` for hover and active rather than the logo green. The one exception is the login button: on the navy login screen it uses the full-strength logo green with a navy label (5.91), because that screen is the first thing in the demo and the CTA should be the brand colour.

`accessible-light-ui` and `contrast-light-ui` are deliberately not touched. Their interactive ramp is `241, 100%`, tuned for contrast rather than brand, and overriding it would make an accessibility theme worse.

## Not done, and why

Strings that still say "Superdesk" but are wrapped in `gettext` or `translate`, so the distribution's `langOverride` can reach them without a code change:

- `scripts/apps/contacts/controllers/ContactsController.ts` "Superdesk Contacts Management"
- `scripts/core/menu/views/superdesk-view.html` "Superdesk is experiencing network connection issues:/"
- `scripts/apps/users/views/edit-form.html` "Help us translate Superdesk"
- `scripts/apps/users/views/settings-roles.html`, `scripts/apps/desks/views/desk-config-modal.html`, `scripts/apps/products/views/products-config-modal.html`, `scripts/apps/users/views/user-preferences.html` line 258, `scripts/core/directives/views/phone-home-modal-directive.html` (several, including the only "newsroom" in the client)

Note that several of those are multi-line `translate` blocks, so the `langOverride` key is the whole normalised paragraph, not just the word.

Not translated and not fixed, because it is a settings sub-page no demo beat opens:

- `scripts/apps/users/views/user-preferences.html` line 45, "Select the prefered default view format for specific areas of Superdesks interface."

Nothing here was built or run: no `npm install` was allowed on this worktree. Validation was reading plus `sass` compiling `briefdesk-theme.scss` standalone and an XML parse of both SVGs. The colour result has not been seen in a browser.

## The real solution

A `branding` block on `ISuperdeskGlobalConfig`, set per instance in `superdesk.config.js`, with sensible Superdesk defaults so an unconfigured instance looks exactly as it does today.

```ts
interface IBrandingConfig {
    productName?: string;              // default 'Superdesk'
    logoUrl?: string;                  // light backgrounds
    logoInverseUrl?: string;           // dark backgrounds
    faviconUrl?: string;
    about?: {
        tagline?: string;              // replaces the product paragraph
        vendorName?: string;
        vendorUrl?: string;
        supportLinks?: Array<{label: string; href: string}>;
        // The AGPL notice, the copyright line and the source link are not
        // configurable. They are a licence obligation, not branding.
    };
    theme?: {
        // Written to the document root as custom properties. Names are the
        // ui-framework's, so no new indirection layer is introduced.
        [customProperty: string]: string;
    };
}
```

Files that block would need to touch, based on what this branch edited:

| File | Work |
|---|---|
| `scripts/core/superdesk-api.d.ts` | Add `branding?: IBrandingConfig` to `ISuperdeskGlobalConfig` and the interface itself. |
| `webpack.config.js` | Defaults for `branding` in `getDefaults` / `applyDefaults`, so `appConfig.branding` is always populated. |
| `index.html.js` | `<title>` and the favicon `href` from the config. `buildIndex` already receives an options object, so this is a parameter, not a new mechanism. |
| `scripts/index.ts` | On startup, write `branding.theme` onto `document.documentElement.style` as custom properties. That replaces `styles/sass/briefdesk-theme.scss` entirely for the palette; the handful of hard-coded selectors in that file (`#main-menu`, `.modal__header--about`, `.login-screen`) should instead be changed upstream to read tokens that the theme block can set, for example a `--sd-colour-main-menu` and a `--sd-colour-login-bg`. |
| `scripts/core/services/pageTitle.ts` | Read the product name from `appConfig.branding` instead of the literal. |
| `scripts/core/auth/login-modal.html`, `secure-login.html`, `reset-password.html` | `ng-src` bound to the inverse logo, `alt` bound to the product name. Needs the auth scope to expose `appConfig`. |
| `scripts/core/menu/views/menu.html` | Product name in the About link; keep "Built on Superdesk technology" non-configurable. |
| `scripts/core/menu/views/about.html` | Product name, tagline, vendor and support links from the config. The "Built on Superdesk" line, the AGPL notice and the source link stay hard-coded. |
| `scripts/core/menu/styles/menu.scss`, `styles/sass/modals.scss` | Replace `url(~images/superdesk-logo*.svg)` with a custom property, for example `background-image: var(--sd-branding-logo-inverse)`, defaulting to the bundled asset. |
| `scripts/apps/search/controllers/SearchMenuController.ts`, `scripts/apps/search/views/repo-dropdown.html` | Local repo label from the product name. |
| `images/` | Keep the Superdesk assets as the defaults. Instance assets are served by the distribution, not committed here. |

Two things are worth deciding before building it. First, whether `theme` takes raw ui-framework custom property names (cheap, but it couples instance config to the framework's internals) or a small named set such as `primaryColour` and `chromeColour` that the client expands into the framework's properties (more work, but it survives a token rename). Second, a validation pass: a config that sets a brand colour with no contrast checking will produce unreadable buttons, exactly the trap documented in the contrast table above. At minimum the expansion should derive button backgrounds at a lightness that keeps the label legible, rather than using the brand colour as-is.
