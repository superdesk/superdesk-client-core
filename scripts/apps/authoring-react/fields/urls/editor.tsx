import React from 'react';
import {IEditorComponentProps} from 'superdesk-api';
import {IUrlsFieldValueOperational, IUrlsFieldConfig, IUrlsFieldUserPreferences, IUrlObject} from './interfaces';
import {Button, IconButton, Input} from 'superdesk-ui-framework/react';
import {SpacerBlock, Spacer} from 'core/ui/components/Spacer';
import {gettext} from 'core/utils';

type IProps = IEditorComponentProps<IUrlsFieldValueOperational, IUrlsFieldConfig, IUrlsFieldUserPreferences>;

export class Editor extends React.PureComponent<IProps> {
    constructor(props: IProps) {
        super(props);

        this.handleUrlUpdate = this.handleUrlUpdate.bind(this);
    }

    handleUrlUpdate(index, urlToUpdate: IUrlObject) {
        const urls = this.props.value ?? [];

        this.props.onChange(
            urls.map((urlObj, i) => i === index ? urlToUpdate : urlObj),
        );
    }

    render() {
        const Container = this.props.container;
        const urls = this.props.value ?? [];
        const {readOnly} = this.props;

        return (
            <Container>
                {
                    urls.map((urlObj, i) => (
                        <Spacer h gap="16" justifyContent="space-between" noWrap key={i}>
                            <div style={{flexGrow: 1}}>
                                <Input
                                    type="text"
                                    label=""
                                    inlineLabel
                                    labelHidden
                                    value={urlObj.url}
                                    onChange={(val) => {
                                        this.handleUrlUpdate(i, {...urlObj, url: val});
                                    }}
                                    disabled={readOnly}
                                />

                                <SpacerBlock v gap="8" />

                                <textarea
                                    value={urlObj.description}
                                    onChange={(event) => {
                                        this.handleUrlUpdate(i, {...urlObj, description: event.target.value});
                                    }}
                                    placeholder={gettext('Description')}
                                    readOnly={readOnly}
                                    style={{resize: 'vertical'}}
                                />
                            </div>

                            {
                                !readOnly && (
                                    <div>
                                        <IconButton
                                            icon="remove-sign"
                                            ariaValue={gettext('Remove')}
                                            onClick={() => {
                                                this.props.onChange(urls.filter((_, j) => j !== i));
                                            }}
                                            disabled={readOnly}
                                        />
                                    </div>
                                )
                            }
                        </Spacer>
                    ))
                }

                {
                    !readOnly && (
                        <div>
                            <SpacerBlock v gap="16" />

                            <Button
                                text={gettext('Add url')}
                                onClick={() => {
                                    this.props.onChange(urls.concat({url: 'https://', description: ''}));
                                }}
                                type="primary"
                            />
                        </div>
                    )
                }
            </Container>
        );
    }
}
