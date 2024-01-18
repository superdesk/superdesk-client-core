import * as React from 'react';
import {IPreviewComponentProps, IDropdownValue, IDropdownTreeConfig} from 'superdesk-api';
import {SpacerInlineFlex} from 'core/ui/components/Spacer';
import {getValueTemplate} from './get-value-template';

type IProps = IPreviewComponentProps<IDropdownValue, IDropdownTreeConfig>;

export class PreviewDropdownTree extends React.PureComponent<IProps> {
    render() {
        const {config, value} = this.props;

        const optionsToPreview = (() => {
            if (value == null) {
                return [];
            } else if (Array.isArray(value)) {
                return value;
            } else {
                return [value];
            }
        })();

        const Template = getValueTemplate(config);

        return (
            <SpacerInlineFlex h gap="8" gapSecondary="8">
                {
                    optionsToPreview.map((option, i) => (
                        <Template key={i} item={option} />
                    ))
                }
            </SpacerInlineFlex>
        );
    }
}
