import {htmlComesFromDraftjsEditor} from './htmlComesFromDraftjsEditor';
import input from './htmlComesFromDraftjsEditor.snapshot.input.html';

it('should detect HTML coming from draft-js editor for text copied within single block', () => {
    expect(htmlComesFromDraftjsEditor(input)).toBe(true);
});