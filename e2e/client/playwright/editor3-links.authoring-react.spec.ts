import {test, expect, type Locator, type Page} from '@playwright/test';
import {Authoring} from './page-object-models/authoring';
import {AuthoringReact} from './page-object-models/authoring-react';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot} from './utils';
import {getStorageState} from './utils/storage-state';
import {pressRepeatedly} from './utils/editor3';
import {openArticleFromList} from './scenarios/authoring-react-article';

/**
 * Links in the body on authoring-react: add from the toolbar, then open, edit and delete through
 * the link controls editor3 shows while the caret is inside a link. No snapshot carries a linked
 * article, so the edit, open and delete cases add their link through the add flow first.
 */

test.use({storageState: getStorageState({}, {authoringReact: true})});

test.setTimeout(90000);

const ARTICLE = 'test sports story';
const URL = 'https://example.com/sourcefabric';
const EDITED_URL = 'https://example.org/superdesk';
const LINK_TEXT = 'linked words';

function getBody(page: Page): Locator {
    return new AuthoringReact(page).fieldContainer('body_html');
}

async function reopenArticle(page: Page): Promise<void> {
    const authoring = await openArticleFromList(page, ARTICLE);

    await expect(authoring.input('body_html')).toBeVisible();
}

async function openArticle(page: Page): Promise<void> {
    await new Monitoring(page).openMonitoringForDesk('Sports');
    await reopenArticle(page);
}

/** The link popup's URL input, filled and verified as one unit because the popup can re-render and drop the value. */
async function fillLinkUrl(page: Page, url: string): Promise<Locator> {
    const form = page.getByTestId('link-url');
    const urlInput = form.getByRole('textbox');

    await expect(async () => {
        await urlInput.fill(url);
        await expect(urlInput).toHaveValue(url, {timeout: 1000});
    }).toPass();

    return form;
}

/** Types `LINK_TEXT` at the end of the body and links it to `URL` from the toolbar. */
async function addLink(page: Page): Promise<void> {
    const body = getBody(page);

    await body.getByRole('textbox').click();
    await page.keyboard.type(LINK_TEXT);
    await pressRepeatedly(page, 'Shift+ArrowLeft', LINK_TEXT.length);

    await body.getByTestId('toolbar').getByRole('button', {name: 'Link (Ctrl+K)'}).click();

    const form = await fillLinkUrl(page, URL);

    await form.getByRole('button', {name: 'Insert'}).click();
    await expect(form).toBeHidden();
    await expect(body.getByRole('textbox').locator(`a[href="${URL}"]`)).toHaveText(LINK_TEXT);
}

/**
 * Adds the link, saves, closes and reopens. An edit made right after an authoring-react save can
 * go untracked (the Save button stays disabled), so the cases that edit a saved link reopen first.
 */
async function addSavedLink(page: Page): Promise<void> {
    await addLink(page);
    await new AuthoringReact(page).saveAndClose();
    await reopenArticle(page);
}

/** Puts the caret inside the link, which is what shows the link controls. */
async function openLinkControls(page: Page, href: string): Promise<Locator> {
    const controls = getBody(page).getByTestId('link-toolbar');

    await expect(async () => {
        await getBody(page).getByRole('textbox').locator(`a[href="${href}"]`).click();
        await expect(controls.getByTestId('link-edit')).toBeVisible({timeout: 2000});
    }).toPass({timeout: 15000});

    return controls;
}

test.describe('links in the body (authoring-react)', () => {
    test('a URL link added from the toolbar is saved and survives reopen', {
        annotation: [{type: 'confluence', description: '1327759495 complete'}], // Add link to Body Editor3
    }, async ({page}) => {
        await restoreDatabaseSnapshot();
        await openArticle(page);

        const authoring = new AuthoringReact(page);
        const link = getBody(page).getByRole('textbox').locator(`a[href="${URL}"]`);

        await expect(getBody(page).getByRole('textbox').locator('a')).toHaveCount(0);

        await addLink(page);

        const {response} = await authoring.saveAndGetRequest();

        expect(response.body_html).toContain(`<a href="${URL}">${LINK_TEXT}</a>`);

        await authoring.close();
        await reopenArticle(page);

        await expect(link).toHaveText(LINK_TEXT);
    });

    test('the link controls open the link target in a new tab', {
        annotation: [{type: 'confluence', description: '1327759497 complete'}], // Open link from Body Editor3
    }, async ({page, context}) => {
        await restoreDatabaseSnapshot();

        // the link target is external; serve it locally so the test does not depend on the network
        await context.route(`${URL}**`, (route) => route.fulfill({contentType: 'text/html', body: '<p>target</p>'}));

        await openArticle(page);
        await addLink(page);

        const controls = await openLinkControls(page, URL);
        const open = controls.getByTestId('link-open');

        await expect(open).toHaveAttribute('target', '_blank');

        const [opened] = await Promise.all([
            context.waitForEvent('page'),
            open.click(),
        ]);

        await expect(opened).toHaveURL(URL);
        await opened.close();

        await expect(getBody(page).getByRole('textbox').locator(`a[href="${URL}"]`)).toHaveText(LINK_TEXT);
    });

    test('editing a link from the link controls changes its URL, and the edit survives reopen', {
        annotation: [{type: 'confluence', description: '1327759499 complete'}], // Edit link in Body Editor3
    }, async ({page}) => {
        await restoreDatabaseSnapshot();
        await openArticle(page);

        const authoring = new Authoring(page);
        const text = getBody(page).getByRole('textbox');

        await addSavedLink(page);

        const controls = await openLinkControls(page, URL);

        await controls.getByTestId('link-edit').click();

        const form = page.getByTestId('link-url');

        await expect(form.getByRole('textbox')).toHaveValue(URL);
        await fillLinkUrl(page, EDITED_URL);
        await form.getByRole('button', {name: 'Insert'}).click();
        await expect(form).toBeHidden();

        await expect(text.locator(`a[href="${EDITED_URL}"]`)).toHaveText(LINK_TEXT);
        await expect(text.locator(`a[href="${URL}"]`)).toHaveCount(0);

        const {response} = await authoring.saveAndGetRequest();

        expect(response.body_html).toContain(`<a href="${EDITED_URL}">${LINK_TEXT}</a>`);
        expect(response.body_html).not.toContain(URL);

        await authoring.close();
        await reopenArticle(page);

        await expect(text.locator(`a[href="${EDITED_URL}"]`)).toHaveText(LINK_TEXT);
    });

    test('deleting a link from the link controls keeps its text, and the removal survives reopen', {
        annotation: [{type: 'confluence', description: '1327759501 complete'}], // Delete link from Body Editor3
    }, async ({page}) => {
        await restoreDatabaseSnapshot();
        await openArticle(page);

        const authoring = new AuthoringReact(page);
        const text = getBody(page).getByRole('textbox');

        await addSavedLink(page);

        const controls = await openLinkControls(page, URL);

        await controls.getByTestId('link-delete').click();

        await expect(text.locator('a')).toHaveCount(0);
        await expect(text).toContainText(LINK_TEXT);

        const {response} = await authoring.saveAndGetRequest();

        expect(response.body_html).not.toContain('<a ');
        expect(response.body_html).toContain(LINK_TEXT);

        await authoring.close();
        await reopenArticle(page);

        await expect(text).toContainText(LINK_TEXT);
        await expect(text.locator('a')).toHaveCount(0);
    });
});
