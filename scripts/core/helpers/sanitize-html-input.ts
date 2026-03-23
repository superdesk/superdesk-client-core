import DOMPurify from 'dompurify';

export function sanitizeHtmlContent(value: string): string {
    return DOMPurify.sanitize(value || '', {USE_PROFILES: {html: true}});
}
