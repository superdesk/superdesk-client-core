import {OrderedMap} from 'immutable';
import {sdApi} from 'api';
import {getOptions} from './get-options';

describe('dropdown vocabulary options', () => {
    it('has no options when the vocabulary does not exist', () => {
        spyOn(sdApi.vocabularies, 'getAll').and.returnValue(OrderedMap());

        const options = getOptions({source: 'vocabulary', vocabularyId: 'missing-vocabulary', multiple: false});

        expect(options.nodes).toEqual([]);
    });
});
