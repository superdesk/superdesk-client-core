import ng from 'core/services/ng';
import {desks} from './desks';

function mockDesksService(desksService: any) {
    spyOn(ng, 'get').and.callFake((name: string) => {
        if (name === 'desks') {
            return desksService;
        }

        throw new Error(`unexpected ng.get('${name}') in this test`);
    });
}

describe('sdApi.desks.getDeskStages', () => {
    it('returns the stages of the given desk', () => {
        mockDesksService({
            deskStages: {
                desk1: [{_id: 'stage1', name: 'Working'}, {_id: 'stage2', name: 'Incoming'}],
            },
        });

        const stages = desks.getDeskStages('desk1');

        expect(stages.size).toBe(2);
        expect(stages.get('stage2').name).toBe('Incoming');
    });

    it('returns an empty map when the desk has no entry in deskStages', () => {
        mockDesksService({deskStages: {desk1: [{_id: 'stage1'}]}});

        expect(desks.getDeskStages('a-desk-the-user-can-not-see').size).toBe(0);
    });

    it('returns an empty map when deskStages is not loaded yet', () => {
        mockDesksService({deskStages: undefined});

        expect(desks.getDeskStages('desk1').size).toBe(0);
    });

    it('returns an empty map for a null desk id', () => {
        mockDesksService({deskStages: {desk1: [{_id: 'stage1'}]}});

        expect(desks.getDeskStages(null).size).toBe(0);
    });
});

describe('sdApi.desks.getAllDesks', () => {
    it('returns the loaded desks', () => {
        mockDesksService({desks: {_items: [{_id: 'desk1', name: 'Sports'}]}});

        expect(desks.getAllDesks().get('desk1').name).toBe('Sports');
    });

    it('returns an empty map when desks are not loaded yet', () => {
        mockDesksService({desks: {}});

        expect(desks.getAllDesks().size).toBe(0);
    });
});
