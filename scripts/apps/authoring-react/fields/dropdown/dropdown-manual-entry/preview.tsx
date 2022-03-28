import {SpacerInlineFlex} from 'core/ui/components/Spacer';
import * as React from 'react';
import {IPreviewComponentProps} from 'superdesk-api';
import {IDropdownValue, IDropdownConfigManualSource} from '..';
import {DropdownItemTemplate} from '../dropdown-item-template';

type IProps = IPreviewComponentProps<IDropdownValue, IDropdownConfigManualSource>;

export class PreviewManualEntry extends React.PureComponent<IProps> {
    render() {
        const {config, value} = this.props;
        const options = config.options;
        const optionsToPreview =
            (Array.isArray(value) ? value : [value])
                .map((val) => options.find((_option) => _option.id === val));

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
