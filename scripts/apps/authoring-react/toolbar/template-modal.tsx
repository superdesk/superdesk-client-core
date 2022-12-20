import {sdApi} from 'api';
import {Spacer} from 'core/ui/components/Spacer';
import {gettext} from 'core/utils';
import React from 'react';
import {IArticle, ITemplate} from 'superdesk-api';
import {Alert, Button, Checkbox, Input, Modal, Option, Select} from 'superdesk-ui-framework/react';
import {canEdit, wasRenamed} from './template-helpers';

interface IProps {
    item: IArticle;
    closeModal: () => void;
}

interface IStateLoading {
    initialized: false;
}

interface IStateLoaded {
    initialized: true;
    templateName: string | null;
    isDeskTemplate: boolean;
    responseError: string | null;
    deskId: string | null;
    template: ITemplate | null;
}

type IState = IStateLoaded | IStateLoading;

export class TemplateModal extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            initialized: false,
        };
    }

    componentDidMount(): void {
        sdApi.templates.getById(this.props.item.template).then((res) => {
            this.setState({
                initialized: true,
                template: res,
                templateName: res.template_name,
                isDeskTemplate: true,
                responseError: null,
                deskId: res.template_desks[0],
            });
        });
    }

    render(): JSX.Element {
        const availableDesks = sdApi.desks.getAllDesks().toArray();

        if (!this.state.initialized) {
            return null;
        }

        const state = this.state;

        return (
            <Modal
                visible
                onHide={() => this.props.closeModal()}
                size="medium"
                zIndex={1050}
                headerTemplate={gettext('Save as template')}
            >
                <Spacer v gap="16">
                    <Input
                        type="text"
                        label={gettext('Template name')}
                        value={state.templateName}
                        onChange={(value) => this.setState({
                            ...state,
                            templateName: value,
                        })}
                    />
                    {
                        state.responseError != null && (
                            <Alert
                                margin="none"
                                size="small"
                                type="alert"
                            >
                                {state.responseError}
                            </Alert>
                        )
                    }
                    {
                        /**
                         * If the input template name differs from the fetched template name
                         * a new template will be created
                         *
                         * Or if the initially fetched template from the article is null a new
                         * template will also be created
                         *
                         * Or if the initially fetched template from the article can't be edited
                         * a new template will be created
                         */
                        wasRenamed(state.template, state.templateName)
                            || state.template == null
                            || canEdit(state.template, state.deskId != null) !== true
                            ? (
                                <Alert
                                    margin="none"
                                    size="small"
                                    type="warning"
                                    style="hollow"
                                >
                                    {gettext('A new template will be created')}
                                </Alert>
                            )
                            : (
                                <Alert
                                    margin="none"
                                    size="small"
                                    type="warning"
                                    style="hollow"
                                >
                                    {gettext('Template will be updated')}
                                </Alert>
                            )
                    }
                    {
                        availableDesks != null && state.template.is_public &&
                        (
                            <>
                                <Checkbox
                                    label={{text: gettext('Desk template')}}
                                    checked={state.isDeskTemplate}
                                    onChange={() => this.setState({
                                        ...state,
                                        deskId: state.isDeskTemplate ? null : state.deskId,
                                        isDeskTemplate: !state.isDeskTemplate,
                                    })}
                                />
                                {
                                    state.isDeskTemplate && (
                                        <Select
                                            label={gettext('Desks')}
                                            value={state.deskId}
                                            onChange={(value) => {
                                                this.setState({...state, deskId: value});
                                            }}
                                        >
                                            <Option />
                                            {
                                                availableDesks.map(({_id, name}) => (
                                                    <Option key={_id} value={_id}>{name}</Option>
                                                ))
                                            }
                                        </Select>
                                    )
                                }
                            </>
                        )
                    }
                    <Spacer h gap="8" justifyContent="end" noGrow>
                        <Button
                            text={gettext('Cancel')}
                            onClick={() => this.props.closeModal()}
                        />
                        <Button
                            type="primary"
                            text={gettext('Save')}
                            onClick={() => {
                                sdApi.templates.createTemplateFromArticle(
                                    this.props.item,
                                    state.templateName,
                                    state.deskId,
                                )
                                    .then(() => {
                                        this.props.closeModal();
                                    })
                                    .catch((error) => {
                                        this.setState({...state, responseError: error._issues.is_public});
                                    });
                            }}
                        />
                    </Spacer>

                </Spacer>
            </Modal>
        );
    }
}
