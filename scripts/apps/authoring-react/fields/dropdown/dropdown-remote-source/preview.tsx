import {SpacerInlineFlex} from 'core/ui/components/Spacer';
import * as React from 'react';
import {IPreviewComponentProps, IDropdownValue, IDropdownConfigRemoteSource} from 'superdesk-api';
import {getValueTemplate} from './get-value-template';

type IProps = IPreviewComponentProps<IDropdownValue, IDropdownConfigRemoteSource>;

export class PreviewRemoteSource extends React.PureComponent<IProps> {
    render() {
        const {config, value} = this.props;
        const optionsToPreview =
            (Array.isArray(value) ? value : [value]);

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
