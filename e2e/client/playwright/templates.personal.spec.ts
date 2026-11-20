import {expect, test} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {TemplateSettings} from './page-object-models/template-settings';
import {loginAs, restoreDatabaseSnapshot} from './utils';

/**
 * Case 1344443537 "Templates privilege" is split over the two `partial` tests.
 * Not covered: save as template from editing for a user without `content_templates`.
 * No `main` snapshot user holds `archive` without it, so no such user can open an editor.
 *
 * The case says checkbox; the product renders an `sd-switch`.
 */

const PUBLIC_TEMPLATE = 'story 2';

/** Public, assigned to Sports, so it stays visible to every Sports member. */
const ANCHOR_TEMPLATE = 'story';

const OWNER = {username: 'samgamgee', password: 'samgamgee'};
// No privileges, so it lands on the app shell instead of the dashboard.
const NO_PRIVILEGE_ACTOR = {username: 'frodobaggins', password: 'frodobaggins', landsOn: 'top-menu'};

test('turning a public template personal keeps it listed, marks it grey and hides it from other users', {
    annotation: [
        {type: 'confluence', description: '1311834132 complete'}, // Change public template to personal template
    ],
}, async ({page, browser}) => {
    // Admin is the other user on purpose: it holds `personal_template`, so the server returns
    // other users' personal templates to it and only the client keeps them out of More templates.
    const adminMonitoring = new Monitoring(page);

    await restoreDatabaseSnapshot();

    await page.goto('/#/workspace/monitoring');
    await adminMonitoring.selectDeskOrWorkspace('Sports');

    const adminListBefore = await adminMonitoring.openMoreTemplates();

    await expect(adminListBefore.getByRole('button', {name: PUBLIC_TEMPLATE, exact: true})).toBeVisible();

    // Naming `storageState` stops this context inheriting the admin session.
    const ownerContext = await browser.newContext({storageState: undefined});

    try {
        const ownerPage = await ownerContext.newPage();
        const templates = new TemplateSettings(ownerPage);
        const ownerMonitoring = new Monitoring(ownerPage);

        await loginAs(ownerPage, OWNER.username, OWNER.password);
        await ownerPage.goto('/#/settings/templates');

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

        await ownerPage.goto('/#/workspace/monitoring');
        await ownerMonitoring.selectDeskOrWorkspace('Sports');

        const ownerList = await ownerMonitoring.openMoreTemplates();

        await expect(ownerList.getByRole('button', {name: PUBLIC_TEMPLATE, exact: true})).toBeVisible();
    } finally {
        await ownerContext.close();
    }

    // More templates fetches its list when it mounts, so reload for a fresh one.
    await page.reload();
    await adminMonitoring.selectDeskOrWorkspace('Sports');

    const adminListAfter = await adminMonitoring.openMoreTemplates();

    // Anchor: proves the list loaded before asserting the absence.
    await expect(adminListAfter.getByRole('button', {name: ANCHOR_TEMPLATE, exact: true})).toBeVisible();
    await expect(adminListAfter.getByRole('button', {name: PUBLIC_TEMPLATE, exact: true})).toHaveCount(0);
});

test.describe('without the content_templates privilege', () => {
    // Empty state, not `undefined`: in `test.use`, `undefined` inherits the committed admin session.
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
    await expect(templates.getCardDesks('admin desk template')).toHaveText('Sports');

    await templates.startNewTemplate();
    await templates.toggleMakePublic();
    await templates.expectMakePublic(false);

    await templates.setName('admin personal template');
    await templates.setProfile('Story');
    await templates.save('POST');

    await expect(templates.getCardHeader('admin personal template')).toHaveClass(/card-box__header--dark/);
});
