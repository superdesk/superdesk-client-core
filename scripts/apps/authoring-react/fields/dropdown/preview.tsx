import {SpacerInline} from 'core/ui/components/Spacer';
import * as React from 'react';
import {IPreviewComponentProps} from 'superdesk-api';
import {IDropdownValue, IDropdownConfig} from '.';
import {DropdownItemTemplate} from './dropdown-item-template';
import {getOptions} from './get-options';

type IProps = IPreviewComponentProps<IDropdownValue, IDropdownConfig>;

export class Preview extends React.PureComponent<IProps> {
    render() {
        const {config, value} = this.props;
        const options = getOptions(config);
        const optionsToPreview =
            (Array.isArray(value) ? value : [value])
                .map((val) => options.find((_option) => _option.id === val));

        return (
            <div>
                {
                    optionsToPreview.map((option, i) => (
                        <span key={i}>
                            {
                                i !== 0 && (
                                    <SpacerInline h gap="4" />
                                )
                            }
                            <DropdownItemTemplate option={option} config={config} />
                        </span>
                    ))
                }
            </div>
        );
    }
}
