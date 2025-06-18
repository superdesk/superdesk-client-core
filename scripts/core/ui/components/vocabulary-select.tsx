import * as React from 'react';
import {notNullOrUndefined} from '@sourcefabric/common';
import {arrayToTree} from 'core/helpers/tree';
import {getVocabularyItemNameTranslated} from 'core/utils';
import {keyBy} from 'lodash';
import {IPropsVocabularySelect} from 'superdesk-api';
import {TreeSelect} from 'superdesk-ui-framework/react';

export class VocabularySelect extends React.PureComponent<IPropsVocabularySelect> {
    render() {
        const optionsFlat = this.props.getOptions();
        const optionsKeyed = keyBy(optionsFlat, ({qcode}) => qcode);

        const value = this.props.value
            .map((qcode) => optionsKeyed[qcode])
            .filter(notNullOrUndefined); // in case vocabulary item was removed

        return (
            <TreeSelect
                kind="synchronous"
                inlineLabel={this.props.label.hidden === true || this.props.label.position === 'left'}
                labelHidden={this.props.label.hidden === true}
                label={this.props.label.text}
                value={value}
                getId={(item) => item.qcode}
                getLabel={(item) => getVocabularyItemNameTranslated(item)}
                getOptions={() => {
                    return arrayToTree(
                        optionsFlat,
                        ({qcode}) => qcode,
                        ({parent}) => parent,
                    ).result;
                }}
                onChange={(nextTags) => {
                    this.props.onChange(nextTags.map(({qcode}) => qcode));
                }}
                allowMultiple={this.props.multiple}
                fullWidth={this.props.fullWidth}
                disabled={this.props.disabled}
                selectBranchWithChildren={this.props.selectBranchWithChildren}
                data-test-id={this.props['data-test-id']}
                inputWrapper={this.props.inputWrapper}
            />
        );
    }
}
