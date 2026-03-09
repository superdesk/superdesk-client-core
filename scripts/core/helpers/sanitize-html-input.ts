import DOMPurify from 'dompurify';

export function sanitizeHtmlInput(value: string): string {
    return DOMPurify.sanitize(value || '', {
        FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'base', 'form', 'meta', 'link'],
        FORBID_ATTR: ['srcdoc'],
    });
}
