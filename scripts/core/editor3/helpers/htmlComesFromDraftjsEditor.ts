export const htmlComesFromDraftjsEditor = (html: string) => new DOMParser().parseFromString(html, 'text/html')
    .body.querySelector('[data-offset-key]') != null;
