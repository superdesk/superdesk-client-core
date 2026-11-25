import {Page, expect} from '@playwright/test';
import {AuthoringReact} from '../page-object-models/authoring-react';
import {Monitoring} from '../page-object-models/monitoring';
import {SUPERDESK_API_URL} from '../utils';

/**
 * Creates an article on Sports from the desk's default template and gives it `headline`, which is
 * what `reopenArticle` finds it by. Waiting for a fixture item to be listed and for `headline` to
 * be absent gates on the restore having reached the search index, so a rerun cannot pick up the
 * article an earlier run created.
 */
export async function createArticle(page: Page, headline: string): Promise<void> {
    const monitoring = new Monitoring(page);
    const authoring = new AuthoringReact(page);

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');
    await expect(monitoring.getArticleLocator('test sports story')).toBeVisible();
    await expect(monitoring.getArticleLocator(headline)).toHaveCount(0);

    await monitoring.createArticleFromDefaultTemplate();
    await authoring.waitUntilOpen();
    await authoring.replaceEditor3FieldText(authoring.input('headline'), headline);
}

/** Creates an article from `template` ("More templates...") in the monitoring view of `deskOrWorkspace`. */
export async function createArticleFromTemplate(
    page: Page,
    template: string,
    deskOrWorkspace: string = 'Sports',
): Promise<{monitoring: Monitoring; authoring: AuthoringReact}> {
    const monitoring = new Monitoring(page);
    const authoring = new AuthoringReact(page);

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace(deskOrWorkspace);
    await monitoring.createArticleFromTemplate(template);
    await authoring.waitUntilOpen();

    return {monitoring, authoring};
}

/**
 * Opens `label` from Sports / Working Stage with the Edit action and waits for the lock it takes to
 * reach the list: the send / publish panel acts on the monitoring copy of the item until then.
 */
export async function editArticle(
    page: Page,
    label: string,
): Promise<{monitoring: Monitoring; authoring: AuthoringReact}> {
    const monitoring = new Monitoring(page);
    const authoring = new AuthoringReact(page);
    const item = monitoring.getGroupedArticleLocator('Sports / Working Stage', label);

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');
    await monitoring.executeActionOnMonitoringItem(item, 'Edit');
    await authoring.waitUntilOpen();
    await expect(item.getByTestId('article-item-locked')).toHaveCount(1);

    return {monitoring, authoring};
}

/** Opens an article listed in the monitoring view by its label, and waits for authoring-react. */
export async function openArticleFromList(page: Page, label: string): Promise<AuthoringReact> {
    const authoring = new AuthoringReact(page);

    await new Monitoring(page).getArticleLocator(label).dblclick();
    await authoring.waitUntilOpen();

    return authoring;
}

/** Reopens the article `createArticle` made, from the monitoring view that closing it returned to. */
export async function reopenArticle(page: Page, headline: string): Promise<void> {
    const authoring = await openArticleFromList(page, headline);

    await expect(authoring.input('headline')).toHaveText(headline);
}

/**
 * Saves, closes and reopens the article. Reopening also matters for a following edit: an edit
 * made right after an authoring-react save can go untracked.
 */
export async function saveCloseAndReopen(page: Page, headline: string): Promise<void> {
    await new AuthoringReact(page).saveAndClose();
    await reopenArticle(page, headline);
}

/** The id of the article open in the editor, read from the `item` URL parameter. */
export function openArticleId(page: Page): string {
    const match = page.url().match(/[?&]item=([^&]+)/);

    if (match == null) {
        throw new Error(`no article is open in ${page.url()}`);
    }

    return decodeURIComponent(match[1]);
}

/** The status `GET /archive/<id>` answers with: 404 once the article is gone, whatever the list shows. */
export async function archiveStatus(page: Page, articleId: string): Promise<number> {
    const token = await page.evaluate(() => window.localStorage.getItem('sess:token'));
    const response = await page.request.get(`${SUPERDESK_API_URL}/archive/${articleId}`, {
        headers: {Authorization: token ?? ''},
        failOnStatusCode: false,
    });

    return response.status();
}
