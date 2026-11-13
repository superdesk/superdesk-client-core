import {test, expect} from '@playwright/test';
import {DeskRouting} from './page-object-models/desk-routing';
import {restoreDatabaseSnapshot} from './utils';

// QA case "Desk routing" (1311834332). Covers the client half: closing a desk onto another,
// chaining, several sources on one target, reopening, and the top-menu indicator.
// Not covered, both fixture blockers:
// - What routing does to content (SDANSA-153 AC 1, 3-6 and 7, SDANSA-325): needs the Desk
//   Routing macro on stage incoming/outgoing macros, and neither the e2e backend nor the
//   `main` snapshot has one.
// - A user without `desk_routing` cannot start or stop routing: the snapshot has no such
//   user with a known password, and an administrator gets every privilege regardless.
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

        // Stop only sends `is_closed`, so the destination stays configured.
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

        // `TopMenuInfoDirective` computes "Routed from" only for a desk that is not itself closed.
        await expect(deskRouting.infoRoutingTo).toHaveText('Finance');
        await expect(deskRouting.infoRoutedFrom).toBeHidden();

        await deskRouting.openOn('Finance');

        await expect(deskRouting.infoRoutedFrom).toHaveText('Education');

        // The widget lists direct sources only, not the whole chain.
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

        // Names come in the order `DesksFactory.fetchDesks` sorts them, by name.
        await expect(deskRouting.infoRoutedFrom).toHaveText('Education, Sports');
    });
});
