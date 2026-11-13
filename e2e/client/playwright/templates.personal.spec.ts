import {expect, test} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {TemplateSettings} from './page-object-models/template-settings';
import {loginAs, restoreDatabaseSnapshot} from './utils';

/**
 * Case 1344443537 "Templates privilege" is a requirements page, split over the two
 * `partial` tests. Not covered:
 * - Hiding the "desk template" tick box when saving an article as a template: no `main`
 *   snapshot user can open an editor without also holding `content_templates`
 *   (`frodobaggins` has no privileges, so `POST /api/archive` is 403). Needs a user
 *   with `archive` and without `content_templates`.
 * - "Manage other users private templates": states no actor or expected result.
 *
 * The case calls the toggle a "Make public checkbox"; the product renders an `sd-switch`.
 */

// Database restore plus login-form logins do not fit the 30s default.
test.setTimeout(90000);

const PUBLIC_TEMPLATE = 'story 2';

/** Public, assigned to Sports, so it stays visible to every Sports member. */
const ANCHOR_TEMPLATE = 'story';

const SECOND_ACTOR = {username: 'samgamgee', password: 'samgamgee'};
// No privileges, so it lands on the app shell instead of the dashboard.
const NO_PRIVILEGE_ACTOR = {username: 'frodobaggins', password: 'frodobaggins', landsOn: 'top-menu'};

test('turning a public template personal keeps it listed, marks it grey and hides it from other users', {
    annotation: [
        {type: 'confluence', description: '1311834132 complete'}, // Change public template to personal template
    ],
}, async ({page, browser}) => {
    const templates = new TemplateSettings(page);
    const monitoring = new Monitoring(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/settings/templates');

    const header = templates.getCardHeader(PUBLIC_TEMPLATE);

    await expect(header).toBeVisible();
    await expect(header).not.toHaveClass(/card-box__header--dark/);

    // Cancel must discard the toggle: the template stays public.
    await templates.openEditor(PUBLIC_TEMPLATE);
    await templates.expectMakePublic(true);
    await templates.toggleMakePublic();
    await templates.expectMakePublic(false);
    await templates.cancel();

    await expect(header).toBeVisible();
    await expect(header).not.toHaveClass(/card-box__header--dark/);

    await templates.makePersonal(PUBLIC_TEMPLATE);

    await expect(header).toBeVisible();
    await expect(header).toHaveClass(/card-box__header--dark/);

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');

    const ownerDropdown = await monitoring.openMoreTemplates();

    await expect(ownerDropdown.getByRole('button', {name: PUBLIC_TEMPLATE, exact: true})).toBeVisible();

    // Naming `storageState` (even as undefined) keeps this context out of the committed
    // admin session; Playwright only inherits project options for keys not mentioned.
    const secondContext = await browser.newContext({storageState: undefined});

    try {
        const secondPage = await secondContext.newPage();
        const secondMonitoring = new Monitoring(secondPage);

        await loginAs(secondPage, SECOND_ACTOR.username, SECOND_ACTOR.password);

        await secondPage.goto('/#/workspace/monitoring');
        await secondMonitoring.selectDeskOrWorkspace('Sports');

        const otherDropdown = await secondMonitoring.openMoreTemplates();

        // Anchor: proves the list loaded before asserting the absence.
        await expect(otherDropdown.getByRole('button', {name: ANCHOR_TEMPLATE, exact: true})).toBeVisible();
        await expect(otherDropdown.getByRole('button', {name: PUBLIC_TEMPLATE, exact: true})).toHaveCount(0);
    } finally {
        await secondContext.close();
    }
});

test.describe('without the content_templates privilege', () => {
    // Empty state, not `undefined`: `undefined` inherits the committed admin session.
    test.use({storageState: {cookies: [], origins: []}});

    test('settings lists and edits only the user\'s own personal templates', {
        annotation: [
            {type: 'confluence', description: '1344443537 partial'}, // Templates privilege
        ],
    }, async ({page}) => {
        const templates = new TemplateSettings(page);

        await restoreDatabaseSnapshot();
        await loginAs(page, NO_PRIVILEGE_ACTOR.username, NO_PRIVILEGE_ACTOR.password, {
            landsOn: NO_PRIVILEGE_ACTOR.landsOn,
        });

        await page.goto('/#/settings/templates');

        // The page itself carries no privilege gate, so it opens for this user.
        await expect(page.getByTestId('template-header')).toBeVisible();

        await templates.startNewTemplate();
        await expect(templates.getEditor().getByPlaceholder('template name')).toBeVisible();
        await expect(templates.getMakePublicSwitch()).toHaveCount(0);

        await templates.setName('frodo personal');
        await templates.setProfile('Story');
        await templates.save('POST');

        await expect(templates.getCardHeader('frodo personal')).toHaveClass(/card-box__header--dark/);

        // The snapshot's other templates are all public and admin's.
        await expect(page.getByTestId('content-template')).toHaveCount(1);

        await templates.openEditor('frodo personal');
        await templates.setName('frodo personal renamed');
        await templates.save('PATCH');

        await expect(templates.getCard('frodo personal renamed')).toBeVisible();
        await expect(page.getByTestId('content-template')).toHaveCount(1);
    });
});

test('the content_templates privilege still allows both desk and personal templates', {
    annotation: [
        {type: 'confluence', description: '1344443537 partial'}, // Templates privilege
    ],
}, async ({page}) => {
    const templates = new TemplateSettings(page);

    await restoreDatabaseSnapshot();
    await page.goto('/#/settings/templates');

    await templates.startNewTemplate();

    await templates.expectMakePublic(true);

    await templates.setName('admin desk template');
    await templates.setProfile('Story');
    await templates.getEditor().getByTestId('desks').getByTestId('desk--Sports').click();
    await templates.save('POST');

    await expect(templates.getCardHeader('admin desk template')).toBeVisible();
    await expect(templates.getCardHeader('admin desk template')).not.toHaveClass(/card-box__header--dark/);

    await templates.startNewTemplate();
    await templates.toggleMakePublic();
    await templates.expectMakePublic(false);

    await templates.setName('admin personal template');
    await templates.setProfile('Story');
    await templates.save('POST');

    await expect(templates.getCardHeader('admin personal template')).toHaveClass(/card-box__header--dark/);
});
