export const htmlComesFromDraftjsEditor = (html) => new DOMParser().parseFromString(html, 'text/html')
    .body.querySelector('[data-offset-key]') != null;
