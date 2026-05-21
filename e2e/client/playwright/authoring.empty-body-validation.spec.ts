import {test} from '@playwright/test';
import {Monitoring} from './page-object-models/monitoring';
import {restoreDatabaseSnapshot, s, waitForToastMessage} from './utils';

// FLAKY: clearing the editor3 body via Control/Meta+A then Backspace does not
// reliably wipe the field's content under draft-js / authoring-react; the
// publish step then succeeds instead of producing the expected validation
// toast. Needs an editor3-aware clear helper before this can be enabled.
test.skip('publishing an item with empty body_html shows a validation error toast', async ({page}) => {
    await restoreDatabaseSnapshot();

    const monitoring = new Monitoring(page);

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');

    await page.locator(
        s('monitoring-group=Sports / Working Stage', 'article-item=test sports story'),
    ).dblclick();

    const body = page.locator(s('authoring', 'authoring-field=body_html')).getByRole('textbox');

    // Focus the editor3 body field then clear its contents with the platform-aware
    // ControlOrMeta+a so it works on both Linux/CI and macOS. Using Backspace rather
    // than Delete because draft-js doesn't always treat forward-delete as a removal.
    await body.click();
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.press('Backspace');

    const saveBtn = page.locator(s('authoring-topbar', 'save'));

    // Save may be disabled because the empty body fails validation; either way
    // the publish below is the action that surfaces the validation toast.
    if (await saveBtn.isEnabled()) {
        await saveBtn.click();
    }

    await page.locator(s('authoring', 'open-send-publish-pane')).click();
    await page.locator(s('authoring', 'interactive-actions-panel', 'publish')).click();

    await waitForToastMessage(page, 'error', 'BODY HTML empty values not allowed');
});
