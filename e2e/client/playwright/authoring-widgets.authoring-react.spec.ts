import {test, expect, type Page} from '@playwright/test';
import {AuthoringReact} from './page-object-models/authoring-react';
import {Monitoring} from './page-object-models/monitoring';
import {getUnreadNotificationsBadge, newSession, restoreDatabaseSnapshot} from './utils';
import {mentionUser, setEditor3FieldValue} from './utils/editor3';
import {getStorageState} from './utils/storage-state';

/**
 * Authoring widgets QA cases on authoring-react: Find and replace, Info (the "Metadata" widget),
 * Packages and Comments. Versioning is in `article-versions.authoring-react.spec.ts`, Related
 * items in `related-items-widget.authoring-react.spec.ts`.
 */
test.use({storageState: getStorageState({}, {authoringReact: true})});

test.setTimeout(60000);

async function openArticle(page: Page, headline: string): Promise<AuthoringReact> {
    const monitoring = new Monitoring(page);
    const authoring = new AuthoringReact(page);

    await monitoring.openMonitoringForDesk('Sports');
    await monitoring.editItem(
        monitoring.getGroupedArticleLocator('Sports / Working Stage', headline),
        page.getByTestId('authoring'),
    );
    await authoring.waitUntilOpen();

    return authoring;
}

test.describe('find and replace widget (authoring-react)', () => {
    const ORIGINAL_BODY = 'one apple two apple three apple four';

    // Match spans have no id; the draft-js background is the only signal, the opaque one marks the selected match.
    const MATCH_BACKGROUND = 'rgba(255, 235, 59';
    const SELECTED_MATCH_BACKGROUND = 'rgba(255, 235, 59, 0.8)';

    async function openWidgetOnBody(page: Page) {
        const authoring = await openArticle(page, 'test sports story');
        const bodyField = authoring.fieldContainer('body_html');
        const body = bodyField.getByRole('textbox');

        await setEditor3FieldValue(body, ORIGINAL_BODY);

        return {
            body,
            widget: await authoring.openWidgetByIcon('find-replace'),
            matches: bodyField.locator(`span[style*="${MATCH_BACKGROUND}"]`),
            selectedMatch: bodyField.locator(`span[style*="${SELECTED_MATCH_BACKGROUND}"]`),
        };
    }

    test('Replace right after Find replaces the first occurrence', {
        annotation: [
            {type: 'confluence', description: '1310294123 complete'}, // Find and replace
        ],
    }, async ({page}) => {
        await restoreDatabaseSnapshot();

        const {body, widget, matches} = await openWidgetOnBody(page);

        await widget.getByLabel('Find', {exact: true}).fill('apple');
        await expect(matches).toHaveCount(3);

        await widget.getByLabel('Replace with').fill('orange');
        await widget.getByRole('button', {name: 'Replace', exact: true}).click();

        await expect(body).toHaveText('one orange two apple three apple four');
    });

    test('replaces the selected occurrence, and the rest at once', {
        annotation: [
            {type: 'confluence', description: '1310294123 complete'}, // Find and replace
        ],
    }, async ({page}) => {
        await restoreDatabaseSnapshot();

        const {body, widget, matches, selectedMatch} = await openWidgetOnBody(page);

        await widget.getByLabel('Find', {exact: true}).fill('apple');
        await expect(matches).toHaveCount(3);
        await expect(selectedMatch).toHaveCount(1);
        await expect(matches.nth(0)).toHaveCSS('background-color', SELECTED_MATCH_BACKGROUND);

        await widget.getByLabel('Replace with').fill('orange');
        await widget.getByRole('button', {name: 'Replace', exact: true}).click();

        await expect(body).toHaveText('one orange two apple three apple four');
        await expect(matches).toHaveCount(2);

        await widget.getByRole('button', {name: 'Replace all'}).click();

        await expect(body).toHaveText('one orange two orange three orange four');
        await expect(matches).toHaveCount(0);
    });
});

test.describe('metadata widget (authoring-react)', () => {
    const USAGE_TERMS = 'internal briefing only';
    const UNIQUE_NAME = 'infowidgetstory';

    test('lists the article identifiers and persists edits to Usage terms, Language and Unique name', {
        annotation: [
            {type: 'confluence', description: '1310294120 partial'}, // Info button
        ],
    }, async ({page}) => {
        await restoreDatabaseSnapshot();

        const authoring = await openArticle(page, 'test sports story');
        let widget = await authoring.openWidgetByIcon('metadata');

        await expect(widget.getByTestId('metadata-item').and(page.locator('[data-test-value="GUID"]')))
            .toContainText(/urn:newsml:/);

        await widget.getByLabel('USAGE TERMS').fill(USAGE_TERMS);
        await widget.getByLabel('LANGUAGE').selectOption({label: 'Deutsch'});
        await widget.getByLabel('UNIQUE NAME').fill(UNIQUE_NAME);

        await authoring.saveAndGetRequest();
        await authoring.close();
        await openArticle(page, 'test sports story');

        widget = await authoring.openWidgetByIcon('metadata');

        await expect(widget.getByLabel('USAGE TERMS')).toHaveValue(USAGE_TERMS);
        await expect(widget.getByLabel('LANGUAGE').locator('option:checked')).toHaveText('Deutsch');
        await expect(widget.getByLabel('UNIQUE NAME')).toHaveValue(UNIQUE_NAME);
    });

    test('Not For Publication and Legal tag the item, and only Not For Publication hides Publish', {
        annotation: [
            {type: 'confluence', description: '1310294120 partial'}, // Info button
        ],
    }, async ({page}) => {
        await restoreDatabaseSnapshot();

        const monitoring = new Monitoring(page);
        const authoring = await openArticle(page, 'test sports story');
        const row = monitoring.getGroupedArticleLocator('Sports / Working Stage', 'test sports story');
        const widget = await authoring.openWidgetByIcon('metadata');
        const notForPublication = widget.getByTestId('not-for-publication').getByRole('checkbox');
        const legal = widget.getByTestId('legal').getByRole('checkbox');

        await expect(notForPublication).not.toBeChecked();
        await expect(legal).not.toBeChecked();

        await notForPublication.click();
        await legal.click();

        await expect(notForPublication).toBeChecked();
        await expect(legal).toBeChecked();

        await authoring.saveAndGetRequest();

        await expect(row).toContainText('Not For Publication');
        await expect(row).toContainText('Legal');

        let panel = await authoring.openActionsPanel();

        await expect(panel.getByRole('tab', {name: 'Send to'})).toBeVisible();
        await expect(panel.getByRole('tab', {name: 'Publish'})).toHaveCount(0);
        await panel.getByTestId('close').click();
        await expect(panel).toBeHidden();

        await authoring.openWidgetByIcon('metadata');
        await notForPublication.click();
        await expect(notForPublication).not.toBeChecked();
        await authoring.saveAndGetRequest();

        await expect(row).not.toContainText('Not For Publication');
        await expect(row).toContainText('Legal');

        panel = await authoring.openActionsPanel();
        await expect(panel.getByRole('tab', {name: 'Publish'})).toBeVisible();
    });
});

test.describe('packages widget (authoring-react)', () => {
    test('names the package the open article belongs to', {
        annotation: [
            {type: 'confluence', description: '1310294130 complete'}, // Packages info
        ],
    }, async ({page}) => {
        await restoreDatabaseSnapshot();

        const authoring = await openArticle(page, 'Story 3');
        const widget = await authoring.openWidgetByIcon('packages');
        const entries = widget.getByTestId('packages-list-item');

        await expect(entries).toHaveCount(1);
        await expect(entries).toContainText('Package Highlight 1');
    });

    test('lists nothing for an article that belongs to no package', async ({page}) => {
        await restoreDatabaseSnapshot();

        const authoring = await openArticle(page, 'story 2');
        const widget = await authoring.openWidgetByIcon('packages');

        await expect(widget.getByText('Article is not linked to any packages')).toBeVisible();
        await expect(widget.getByTestId('packages-list-item')).toHaveCount(0);
    });
});

test.describe('comments widget (authoring-react)', () => {
    test('a comment mentioning a user is listed and notifies that user', {
        annotation: [
            {type: 'confluence', description: '1344443904 partial'}, // Comments
        ],
    }, async ({page, browser}) => {
        await restoreDatabaseSnapshot();

        const authoring = await openArticle(page, 'test sports story');
        const widget = await authoring.openWidgetByIcon('comments');
        const input = widget.getByPlaceholder('Type your comment...');

        // the first `@Sam` sometimes opens no suggestion list, so the entry is retried
        await expect(async () => {
            await input.fill('');
            await mentionUser(page, input, '@Sam', 'Sam Gamgee', {timeout: 2000});
        }).toPass({timeout: 15000});
        await input.pressSequentially('hello');
        await widget.getByRole('button', {name: 'post'}).click();

        await expect(input).toHaveValue('');
        await expect(widget.getByText('hello', {exact: true})).toBeVisible();

        const mentioned = await newSession(browser, {username: 'samgamgee', password: 'samgamgee'});

        try {
            const unreadBadge = getUnreadNotificationsBadge(mentioned.page);

            await expect(unreadBadge).toBeVisible({timeout: 10000});
            await expect(unreadBadge).toHaveText('1');
        } finally {
            await mentioned.context.close();
        }
    });
});

test.describe('related items widget search (authoring-react)', () => {
    // The widget only lists items updated today; only `authoring-header` has one ("Story 3 sibling", dated 2099).
    test('lists same-slugline items and re-lists them from a keyword typed in the search box', {
        annotation: [
            {type: 'confluence', description: '1310294133 complete'}, // Related items
        ],
    }, async ({page}) => {
        await restoreDatabaseSnapshot({snapshotName: 'authoring-header'});

        const authoring = await openArticle(page, 'Story 3');
        const panel = await authoring.openWidgetByIcon('related-item');
        const widget = panel.getByTestId('related-items-widget');
        const searchInput = widget.getByTestId('related-items-search-input');
        const searchButton = widget.getByTestId('related-items-search-button');
        const results = widget.getByTestId('related-item');

        await expect(searchInput).toHaveValue('Story 3');
        await expect(results).toHaveCount(1);
        await expect(results).toContainText('Story 3 sibling');

        await searchInput.fill('slugline nothing shares');
        await searchButton.click();
        await expect(widget.getByTestId('related-items-empty-state')).toBeVisible();
        await expect(results).toHaveCount(0);

        await searchInput.fill('Story 3');
        await searchButton.click();
        await expect(results).toHaveCount(1);
        await expect(results).toContainText('Story 3 sibling');
    });
});
