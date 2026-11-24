import {test, expect} from '@playwright/test';
import {AuthoringReact} from './page-object-models/authoring-react';
import {Monitoring} from './page-object-models/monitoring';
import {DeskSettings} from './page-object-models/settings/desks';
import {restoreDatabaseSnapshot} from './utils';
import {getStorageState} from './utils/storage-state';

test.use({storageState: getStorageState({}, {authoringReact: true})});

test('a desk\'s default content template is offered first and prefills the new article', {
    annotation: [
        {type: 'confluence', description: '10542284955 complete'}, // default value saved in templates
    ],
}, async ({page}) => {
    await restoreDatabaseSnapshot();

    const monitoring = new Monitoring(page);
    const authoring = new AuthoringReact(page);
    const desks = new DeskSettings(page);

    await desks.open();
    await desks.openEdit('Sports');
    await desks.modal.getByTestId('field--default-content-template').selectOption({label: 'story 2'});
    await desks.saveAndClose();

    await page.goto('/#/workspace/monitoring');
    await monitoring.selectDeskOrWorkspace('Sports');

    const dropdown = await monitoring.openContentCreateDropdown();

    await expect(dropdown.getByTestId('default-desk-template')).toHaveText('story 2');
    await dropdown.getByTestId('default-desk-template').click();
    await authoring.waitUntilOpen();

    // "story 2" carries the slugline "article 1"; the desk's own default template ("story") has none
    await expect(authoring.input('slugline')).toHaveText('article 1');
});
