import {gettext} from 'core/utils';

export type IEditorThemeColor = 'default' | 'dark' | 'blue' | 'turquoise' | 'military' | 'natural';
export type IEditorThemeFont = 'sans' | 'serif' | 'mono';
export type IFontSizeOption = 'small' | 'medium' | 'large';

/**
 * A theme in the `editor:theme` preference, shared by both authoring implementations.
 * Values are keys, never CSS: angular turns each one into an `sd-editor--<name>-<value>` class.
 */
export interface IEditorTheme {
    font: IEditorThemeFont;
    theme: IEditorThemeColor;
    headline: IFontSizeOption;
    abstract: IFontSizeOption;
    body: IFontSizeOption;
}

export interface IEditorThemeColorOption {
    key: IEditorThemeColor;
    label: string;

    // what angular's `sd-editor--theme-*` classes (superdesk-ui-framework `_editor-themes.scss`)
    // resolve to, so a theme looks the same in both editors
    color: string;
    secondaryColor: string;
    textColor: string;
}

export interface IEditorThemeFontOption {
    key: IEditorThemeFont;
    label: string;
    fontFamily: string;
}

export const EDITOR_THEME_DEFAULT: Readonly<IEditorTheme> = {
    font: 'sans',
    theme: 'default',
    headline: 'medium',
    abstract: 'medium',
    body: 'medium',
};

export function getEditorThemeColors(): Array<IEditorThemeColorOption> {
    return [
        {
            key: 'default',
            label: gettext('Default'),
            color: '#ffffff',
            secondaryColor: '#f3f5f6',
            textColor: 'var(--color-text-onlight)',
        },
        {
            key: 'dark',
            label: gettext('Dark'),
            color: '#1b1e23',
            secondaryColor: '#101419',
            textColor: 'var(--color-text-ondark)',
        },
        {
            key: 'blue',
            label: gettext('Blue'),
            color: '#042b58',
            secondaryColor: '#00214c',
            textColor: 'var(--color-text-ondark)',
        },
        {
            key: 'turquoise',
            label: gettext('Turquoise'),
            color: '#7ad1d0',
            secondaryColor: '#6cc4c2',
            textColor: 'var(--color-text-onlight)',
        },
        {
            key: 'military',
            label: gettext('Military'),
            color: '#b5bc8f',
            secondaryColor: '#a8ae82',
            textColor: 'var(--color-text-onlight)',
        },
        {
            key: 'natural',
            label: gettext('Natural'),
            color: '#f1edd5',
            secondaryColor: '#e3dfc7',
            textColor: 'var(--color-text-onlight)',
        },
    ];
}

export function getEditorThemeFonts(): Array<IEditorThemeFontOption> {
    return [
        {
            key: 'sans',
            label: gettext('Sans-serif (Roboto)'),
            fontFamily: '"Roboto", Helvetica, Arial, sans-serif',
        },
        {
            key: 'serif',
            label: gettext('Serif (Merriweather)'),
            fontFamily: '"Merriweather", Georgia, "Times New Roman", Times, serif',
        },
        {
            key: 'mono',
            label: gettext('Monospace (Roboto Mono)'),
            fontFamily: '"Roboto Mono", "Consolas", "monaco", monospace',
        },
    ];
}

/**
 * Background colours authoring-react used to store in `theme` before it stored keys.
 */
const LEGACY_THEME_COLORS: {[color: string]: IEditorThemeColor} = {
    '#ffffff': 'default',
    '#1b1e19': 'dark',
    '#06356a': 'blue',
    '#00ced1': 'turquoise',
    '#959f60': 'military',
    '#efe9c5': 'natural',
};

const FONT_SIZES: Array<IFontSizeOption> = ['small', 'medium', 'large'];

function normalizeFontFamily(fontFamily: string): string {
    return fontFamily.replace(/["'\s]/g, '').toLowerCase();
}

function getThemeColor(value: unknown): IEditorThemeColor {
    if (typeof value !== 'string') {
        return EDITOR_THEME_DEFAULT.theme;
    }

    const byKey = getEditorThemeColors().find(({key}) => key === value);

    if (byKey != null) {
        return byKey.key;
    }

    const color = value.toLowerCase();

    return LEGACY_THEME_COLORS[color]
        ?? getEditorThemeColors().find((option) => option.color === color)?.key
        ?? EDITOR_THEME_DEFAULT.theme;
}

function getThemeFont(font: unknown, fontFamily: unknown): IEditorThemeFont {
    const fonts = getEditorThemeFonts();

    // authoring-react stored its choice in `fontFamily` and left a stale `font` beside it
    if (typeof fontFamily === 'string') {
        const byFamily = fonts.find((option) =>
            normalizeFontFamily(option.fontFamily) === normalizeFontFamily(fontFamily));

        if (byFamily != null) {
            return byFamily.key;
        }
    }

    return fonts.find(({key}) => key === font)?.key ?? EDITOR_THEME_DEFAULT.font;
}

function getFontSize(value: unknown, fallback: IFontSizeOption): IFontSizeOption {
    return FONT_SIZES.find((size) => size === value) ?? fallback;
}

/**
 * Reads a theme stored by either authoring implementation, as a JSON string or an object.
 * Anything missing or not recognised falls back to the default theme's value.
 */
export function normalizeEditorTheme(value: unknown): IEditorTheme {
    let parsed: unknown = value;

    if (typeof value === 'string') {
        try {
            parsed = JSON.parse(value);
        } catch (e) {
            parsed = null;
        }
    }

    if (parsed == null || typeof parsed !== 'object') {
        return {...EDITOR_THEME_DEFAULT};
    }

    const stored = parsed as {[key: string]: unknown};

    return {
        font: getThemeFont(stored.font, stored.fontFamily),
        theme: getThemeColor(stored.theme),
        headline: getFontSize(stored.headline, EDITOR_THEME_DEFAULT.headline),
        abstract: getFontSize(stored.abstract, EDITOR_THEME_DEFAULT.abstract),
        body: getFontSize(stored.body, EDITOR_THEME_DEFAULT.body),
    };
}

export function getEditorThemeColor(theme: IEditorTheme): IEditorThemeColorOption {
    const colors = getEditorThemeColors();

    return colors.find(({key}) => key === theme.theme) ?? colors[0];
}

export function getEditorThemeStyle(theme: IEditorTheme): {
    backgroundColor: string;
    backgroundColorSecondary: string;
    textColor: string;
    fontFamily: string;
} {
    const color = getEditorThemeColor(theme);
    const fonts = getEditorThemeFonts();

    return {
        backgroundColor: color.color,
        backgroundColorSecondary: color.secondaryColor,
        textColor: color.textColor,
        fontFamily: (fonts.find(({key}) => key === theme.font) ?? fonts[0]).fontFamily,
    };
}
