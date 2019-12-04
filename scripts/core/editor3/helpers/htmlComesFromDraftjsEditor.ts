export const htmlComesFromDraftjsEditor = (html: string) =>
    new DOMParser().parseFromString(html, 'text/html').querySelector('[data-offset-key]') != null;
