import {expect, test} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {TemplateSettings} from './page-object-models/template-settings';
import {loginAs, restoreDatabaseSnapshot} from './utils';

/**
 * Personal (non-public) content templates: turning a public one personal, and what a
 * user without the `content_templates` privilege may do with templates.
 *
 * Case 1311834132 "Change public template to personal template" is covered end to end
 * by the first test, including the Cancel step, so it is annotated `complete`.
 *
 * Case 1344443537 "Templates privilege" is a requirements page rather than a step
 * list. Its bullets are split over the two remaining tests, each annotated `partial`.
 * Two of them are not covered:
 *
 * - "from story editing (both in Personal space and Monitoring views) using the
 *   'save as template' action.... Users without the 'Templates' privilege will not see
 *   the 'desk template' tick box". Blocker: no `main` snapshot user can put an article
 *   in the editor without also holding `content_templates`, and there is no article to
 *   save as a template without one. `frodobaggins` holds no privileges at all, so
 *   `POST /api/archive` answers 403 (`apps/archive/archive.py` declares
 *   `privileges = {"POST": "archive", ...}` on the archive resource) and no editor ever
 *   opens; `samgamgee`'s `Sub Editor` role grants `archive` but also
 *   `content_templates`, so it is not a user without the privilege. Covering this needs
 *   a snapshot user holding `archive` and not `content_templates`.
 * - "Manage other users private templates", the trailing line of the page. It states no
 *   actor, no entry point and no expected result, so there is nothing to assert.
 *
 * Wording note: the case calls the toggle "Make public checkbox"; the product renders
 * an `sd-switch` labelled "Make Public", which is what the assertions read.
 */

// Every test here restores the database, and two of them additionally authenticate
// through the login form, the first inside a second browser context. None of that fits
// the 30s default.
test.setTimeout(90000);

const PUBLIC_TEMPLATE = 'story 2';

/** Public, assigned to Sports, so it stays visible to every Sports member. */
const ANCHOR_TEMPLATE = 'story';

const SECOND_ACTOR = {username: 'samgamgee', password: 'samgamgee'};
/**
 * Holds no privileges at all, so it lands on the app shell rather than the dashboard:
 * `/workspace` is declared with `privileges: {dashboard: 1}`.
 */
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

    // A second session, because the personal template must be absent for everyone
    // except the user who made it personal. Playwright copies the project's context
    // options onto a `browser.newContext()` call only for keys the call does not
    // mention at all, so naming `storageState` here (even as undefined) is what keeps
    // this context out of the committed admin session.
    const secondContext = await browser.newContext({storageState: undefined});

    try {
        const secondPage = await secondContext.newPage();
        const secondMonitoring = new Monitoring(secondPage);

        await loginAs(secondPage, SECOND_ACTOR.username, SECOND_ACTOR.password);

        await secondPage.goto('/#/workspace/monitoring');
        await secondMonitoring.selectDeskOrWorkspace('Sports');

        const otherDropdown = await secondMonitoring.openMoreTemplates();

        // The public template anchors the list as loaded before the absence is read.
        await expect(otherDropdown.getByRole('button', {name: ANCHOR_TEMPLATE, exact: true})).toBeVisible();
        await expect(otherDropdown.getByRole('button', {name: PUBLIC_TEMPLATE, exact: true})).toHaveCount(0);
    } finally {
        await secondContext.close();
    }
});

test.describe('without the content_templates privilege', () => {
    // The test below drives `frodobaggins` through the login form, so the context must
    // not start in the committed admin session. An explicitly empty state is used
    // rather than `undefined`, which Playwright reads as "inherit the project value".
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

        // The snapshot's other five templates are all public and owned by admin, so a
        // list of exactly one is the whole "only their Personal templates" claim.
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

    // Public is the default for a privileged user: `$scope.edit` seeds the new template
    // with `is_public: true` and only forces it false when the privilege is missing.
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
