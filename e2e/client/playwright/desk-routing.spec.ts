import {test, expect} from '@playwright/test';
import {DeskRouting} from './page-object-models/desk-routing';
import {restoreDatabaseSnapshot} from './utils';

/**
 * QA case "Desk routing" (1311834332). The case body carries no steps of its own,
 * it points at SDANSA-153 ("Workflow of the desk(s) routing") and SDANSA-325
 * ("Improvements in the desk routing") for the requirements.
 *
 * Covered here: the client half of the feature. Through the "Desk Router" dashboard
 * widget a desk is closed onto another one, several desks are closed onto the same
 * target, a desk that is already a target is closed on in turn, and a closed desk is
 * reopened; the top-menu indicator reports the direction from either end.
 *
 * Uncovered documented expected results, and why:
 *
 * - What the routing does to content (the second half of SDANSA-153 AC 1 and 3-6,
 *   and all of SDANSA-325: incoming items on the closed desk reach the target desk,
 *   a chain lands them on the last desk only, stopping routing withdraws them). The
 *   case's own note says this needs the Desk Routing macro configured on the incoming
 *   and outgoing stages of every desk in the chain. The e2e backend serves four
 *   macros (`usd_to_cad`, `populate_abstract`, `Extract Html Macro`,
 *   `Validate for Publish`), none of them a desk routing macro, and no stage in
 *   the `main` snapshot has `incoming_macro` or `outgoing_macro` set. Fixture
 *   blocker: it needs a backend that ships the macro.
 *
 * - Publishing from the target desk publishes the item as from the original desk
 *   (SDANSA-153 AC 7). Depends on the same macro to get an item onto the target
 *   desk in the first place.
 *
 * - A user without the `desk_routing` privilege cannot start or stop routing.
 *   The widget gates on it (`RoutingWidgetController.canManage`), but the state
 *   cannot be reached: the `main` snapshot's only non-admin user, `janedoe`, has
 *   no documented password, and the admin cannot be demoted in-test because the
 *   backend grants an `administrator` every privilege regardless of the ones set
 *   on the user record. Fixture blocker: it needs a snapshot user with a known
 *   password and no `desk_routing` privilege.
 */
test.describe('desk routing', {
    annotation: [
        {type: 'confluence', description: '1311834332 partial'}, // Desk routing
    ],
}, () => {
    test('closes a desk onto another one and reports the direction on both', async ({page}) => {
        const deskRouting = new DeskRouting(page);

        await restoreDatabaseSnapshot();
        await deskRouting.openOn('Sports');

        await expect(deskRouting.destinationSelect).toBeEnabled();
        await expect(deskRouting.startButton).toBeDisabled();
        await deskRouting.expectNoRoutingIndicated();

        await deskRouting.selectDestination('Education');
        await expect(deskRouting.startButton).toBeEnabled();

        await deskRouting.startRouting();

        await expect(deskRouting.startButton).toHaveCount(0);
        await expect(deskRouting.infoRoutingTo).toHaveText('Education');
        await expect(deskRouting.infoRoutedFrom).toBeHidden();

        await deskRouting.openOn('Education');

        await expect(deskRouting.infoRoutedFrom).toHaveText('Sports');
        await expect(deskRouting.infoRoutingTo).toBeHidden();
        await expect(deskRouting.routedFromItem('Sports')).toBeVisible();
    });

    test('keeps the desk closed across a reload and reopens it on stop', async ({page}) => {
        const deskRouting = new DeskRouting(page);

        await restoreDatabaseSnapshot();
        await deskRouting.routeTo('Sports', 'Education');

        await page.reload();

        await expect(deskRouting.stopButton).toBeVisible();
        await expect(deskRouting.selectedDestination).toHaveText('Education');
        await expect(deskRouting.infoRoutingTo).toHaveText('Education');

        await deskRouting.stopRouting();

        await expect(deskRouting.stopButton).toHaveCount(0);
        await deskRouting.expectNoRoutingIndicated();

        /*
         * Stopping only reopens the desk: `toggle()` sends `is_closed` and
         * nothing else, so the destination stays configured and routing can be
         * resumed without picking it again.
         */
        await expect(deskRouting.selectedDestination).toHaveText('Education');
        await expect(deskRouting.startButton).toBeEnabled();

        await deskRouting.openOn('Education');

        await deskRouting.expectNoRoutingIndicated();
    });

    test('routes a desk that is already a routing target on to a third desk', async ({page}) => {
        const deskRouting = new DeskRouting(page);

        await restoreDatabaseSnapshot();
        await deskRouting.routeTo('Sports', 'Education');

        await deskRouting.openOn('Education');

        await expect(deskRouting.routedFromItem('Sports')).toBeVisible();
        await expect(deskRouting.startButton).toBeVisible();

        await deskRouting.selectDestination('Finance');
        await deskRouting.startRouting();

        /*
         * The indicator reports one direction at a time: `TopMenuInfoDirective`
         * computes "Routed from" only for a desk that is not itself closed, so
         * Education reports its own destination and not Sports any more.
         */
        await expect(deskRouting.infoRoutingTo).toHaveText('Finance');
        await expect(deskRouting.infoRoutedFrom).toBeHidden();

        await deskRouting.openOn('Finance');

        await expect(deskRouting.infoRoutedFrom).toHaveText('Education');

        /*
         * Only the desk routing straight to Finance is listed. Sports routes to
         * Education, and the widget lists direct sources
         * (`closed_destination === this.desk._id`), not the whole chain.
         */
        await expect(deskRouting.routedFromItem('Education')).toBeVisible();
        await expect(deskRouting.routedFromItem('Sports')).toHaveCount(0);
    });

    test('lists every desk that routes to the same target desk', async ({page}) => {
        const deskRouting = new DeskRouting(page);

        await restoreDatabaseSnapshot();
        await deskRouting.routeTo('Sports', 'Finance');
        await deskRouting.routeTo('Education', 'Finance');

        await deskRouting.openOn('Finance');

        await expect(deskRouting.routedFromItem('Sports')).toBeVisible();
        await expect(deskRouting.routedFromItem('Education')).toBeVisible();

        /*
         * The indicator joins the source desk names in the order the desks
         * service holds them, which `DesksFactory.fetchDesks` sorts by name.
         */
        await expect(deskRouting.infoRoutedFrom).toHaveText('Education, Sports');
    });
});
