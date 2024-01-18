import HtmlDiff from 'htmldiff-js';

export function generateHtmlDiff(html1: string, html2: string): string {
    return `<div class="html-diff">${HtmlDiff.execute(html1, html2)}</div>`;
}
