import {ignoreInternalAnnotationFields} from '../store';
import inputJson from './editor3CustomData.snapshot.input.json';
import outputJson from './editor3CustomData.snapshot.output.json';
import {convertFromRaw} from 'draft-js';

import {getAnnotationsFromContentState} from './editor3CustomData';

it('should generate ids for annotations in order they appear in the content', () => {
    const contentState = convertFromRaw(inputJson);
    const result = getAnnotationsFromContentState(contentState);

    expect(
        JSON.stringify(ignoreInternalAnnotationFields(result)),
    ).toBe(
        JSON.stringify(ignoreInternalAnnotationFields(outputJson)),
    );
});
