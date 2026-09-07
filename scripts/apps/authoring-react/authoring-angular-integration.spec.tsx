import {IArticle, IExposedFromAuthoring} from 'superdesk-api';
import {getInlineToolbarActions} from './authoring-angular-integration';
import {
    SendCorrectionComponent,
    SendKillActionComponent,
    SendTakedownActionComponent,
} from './toolbar-components/angular-integration';

describe('getInlineToolbarActions', () => {
    const exposed = {
        item: {state: 'published'},
        hasUnsavedChanges: () => false,
    } as unknown as IExposedFromAuthoring<IArticle>;

    it('includes a send action for each of kill, correct and takedown modes', () => {
        const testCases = [
            {action: 'kill', component: SendKillActionComponent},
            {action: 'correct', component: SendCorrectionComponent},
            {action: 'takedown', component: SendTakedownActionComponent},
        ] as const;

        for (const {action, component} of testCases) {
            const options = getInlineToolbarActions(exposed, action);

            expect(options.readOnly).toBe(false);
            expect(options.actions.map((widget) => widget.component)).toContain(component);
        }
    });
});
