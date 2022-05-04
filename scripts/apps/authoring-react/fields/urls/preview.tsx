import React from 'react';
import {IPreviewComponentProps} from 'superdesk-api';
import {IUrlsFieldValueOperational, IUrlsFieldConfig} from './interfaces';
import {Spacer} from 'core/ui/components/Spacer';

type IProps = IPreviewComponentProps<IUrlsFieldValueOperational, IUrlsFieldConfig>;

export class Preview extends React.PureComponent<IProps> {
    render() {
        if (this.props.value == null || this.props.value.length < 1) {
            return null;
        }

        return (
            <Spacer v gap="16">
                {
                    this.props.value.map(({url, description}, i) => (
                        <Spacer v gap="4" key={i}>
                            <div>{url}</div>

                            {
                                description.length > 0 && (
                                    <div>{description}</div>
                                )
                            }
                        </Spacer>
                    ))
                }
            </Spacer>
        );
    }
}
