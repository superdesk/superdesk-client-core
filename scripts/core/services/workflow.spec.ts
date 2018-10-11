

describe('Workflow Service', () => {
    beforeEach(window.module('superdesk.core.workflow'));

    beforeEach(inject((preferencesService, $q, workflowService) => {
        var actions = [
            {
                name: 'spike',
                exclude_states: ['spiked', 'published', 'killed'],
                privileges: ['spike'],
            },
            {
                name: 'fetch_from_ingest',
                include_states: ['ingested'],
                privileges: ['fetch'],
            },
        ];

        workflowService.setActions(actions);
    }));

    it('can perform actions', inject((workflowService, $rootScope) => {
        expect(workflowService.isActionAllowed({state: 'fetched'}, 'spike')).toBe(true);
        expect(workflowService.isActionAllowed({state: 'spiked'}, 'spike')).toBe(false);
        expect(workflowService.isActionAllowed({state: 'ingested'}, 'fetch_from_ingest')).toBe(true);
        expect(workflowService.isActionAllowed({state: 'draft'}, 'fetch_from_ingest')).toBe(false);
    }));
});
