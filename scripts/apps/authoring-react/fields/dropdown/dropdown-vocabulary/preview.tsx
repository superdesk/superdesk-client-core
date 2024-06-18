import {notNullOrUndefined} from 'core/helpers/typescript-helpers';
import {SpacerInlineFlex} from 'core/ui/components/Spacer';
import * as React from 'react';
import {IPreviewComponentProps, IDropdownValue, IDropdownConfigVocabulary} from 'superdesk-api';
import {DropdownItemTemplate} from '../dropdown-item-template';
import {getOptions} from './get-options';

type IProps = IPreviewComponentProps<IDropdownValue, IDropdownConfigVocabulary>;

export class PreviewVocabulary extends React.PureComponent<IProps> {
    render() {
        const {config, value} = this.props;
        const options = getOptions(config);
        const optionsToPreview =
            (Array.isArray(value) ? value : [value])
                .map((val) => options.lookup[val]?.value)
                .filter(notNullOrUndefined);
        const noPadding = optionsToPreview.every(({color}) => color == null);

        return (
            <SpacerInlineFlex h gap="8" gapSecondary="8">
                {
                    optionsToPreview.map((option, i) => (
                        <DropdownItemTemplate key={i} option={option} config={config} noPadding={noPadding} />
                    ))
                }
            </SpacerInlineFlex>
        );
    }
}
