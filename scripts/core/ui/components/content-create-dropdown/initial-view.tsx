/* eslint-disable react/no-multi-comp */

import React from 'react';
import ng from 'core/services/ng';
import {IArticle, IDesk, ITemplate} from 'superdesk-api';
import {openArticle} from 'core/get-superdesk-api-implementation';
import {assertNever} from 'core/helpers/typescript-helpers';
import {gettext} from 'core/utils';
import {DropdownOption} from './dropdown-option';
import {MoreTemplates} from './more-templates';
import {sdApi} from 'api';

type IItemCreationAction =
    { kind: 'plain-text'}
    | {kind: 'from-template'; template: ITemplate}
    | {kind: 'create-package'}
    | {kind: 'upload-media'}
;

interface IProps {
    closePopup(): void;
    initializeAsUpdated: boolean;
    customButton?: React.ComponentType<{onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void}>;
    onCreate?(items: Array<IArticle>): void;
}

interface IStateLoaded {
    loading: false;
    mode: 'initial' | 'all-templates';
    defaultTemplate: ITemplate;
    recentTemplates: Array<ITemplate>;
    searchString: string;
}

interface IStateLoading {
    loading: true;
}

type IState = IStateLoading | IStateLoaded;

export class InitialView extends React.PureComponent<IProps, IState> {
    private rootEl: HTMLDivElement;

    constructor(props: IProps) {
        super(props);

        this.state = {
            loading: true,
        };

        this.create = this.create.bind(this);
        this.loadRecentTemplates = this.loadRecentTemplates.bind(this);
    }

    componentDidMount() {
        const currentDesk: IDesk = ng.get('desks').getCurrentDesk();

        Promise.all([
            ng.get('templates').find(currentDesk.default_content_template),
            this.loadRecentTemplates(),
        ]).then(([defaultTemplate, recentTemplates]) => {
            const state: IStateLoaded = {
                loading: false,
                mode: 'initial',
                defaultTemplate: defaultTemplate,
                recentTemplates: recentTemplates ?? [],
                searchString: '',
            };

            this.setState(state);
        });
    }

    getCurrentDesk(): IDesk {
        return ng.get('desks').getCurrentDesk();
    }

    loadRecentTemplates(): Promise<Array<ITemplate>> {
        return ng.get('templates').getRecentTemplates(this.getCurrentDesk()._id, 5).then(({_items}) => _items);
    }

    create(action: IItemCreationAction) {
        const {initializeAsUpdated} = this.props;
        const {onCreate} = this.props;

        this.props.closePopup();

        (() => {
            if (action.kind === 'plain-text') {
                return ng.get('content').createItem('text', initializeAsUpdated);
            } else if (action.kind === 'from-template') {
                return ng.get('content')
                    .createItemFromTemplate(action.template, initializeAsUpdated);
            } else if (action.kind === 'create-package') {
                return ng.get('packages').createEmptyPackage(undefined, initializeAsUpdated);
            } else if (action.kind === 'upload-media') {
                return ng.get('superdesk').intent('upload', 'media', {deskSelectionAllowed: true});
            } else {
                assertNever(action);
            }
        })().then((result: IArticle | Array<IArticle>) => {
            if (typeof onCreate === 'function') {
                onCreate(Array.isArray(result) ? result : [result]);
            }

            if (action.kind !== 'upload-media' && !Array.isArray(result)) {
                openArticle(result._id, 'edit');
            }
        });
    }

    render() {
        const {state} = this;

        if (state.loading === true) {
            return null;
        }

        const {defaultTemplate, recentTemplates} = state;

        return (
            <div
                className="content-create-dropdown"
                data-test-id="content-create-dropdown"
                ref={(el) => this.rootEl = el}
            >
                {(() => {
                    if (state.mode === 'initial') {
                        return (
                            <React.Fragment>
                                <div>
                                    <div className="form-label content-create-dropdown--section-label">
                                        {gettext('Default desk template')}
                                    </div>

                                    <DropdownOption
                                        label={defaultTemplate.template_name}
                                        icon={{name: 'plus-sign', color: 'var(--sd-colour-primary)'}}
                                        onClick={() => {
                                            this.create({kind: 'from-template', template: defaultTemplate});
                                        }}
                                    />
                                </div>

                                {
                                    recentTemplates.length > 0 && (
                                        <React.Fragment>
                                            <div className="content-create-dropdown--spacer" />

                                            <div>
                                                <div className="form-label content-create-dropdown--section-label">
                                                    {gettext('Recent templates')}
                                                </div>
                                            </div>

                                            <div style={{flexShrink: 1, overflow: 'auto'}}>
                                                {
                                                    recentTemplates.map((template, i) => (
                                                        <DropdownOption
                                                            key={i}
                                                            label={template.template_name}
                                                            privateTag={template.is_public !== true}
                                                            icon={{
                                                                name: 'plus-sign',
                                                                color: 'var(--sd-colour-primary)',
                                                            }}
                                                            onClick={() => {
                                                                this.create({kind: 'from-template', template});
                                                            }}
                                                        />
                                                    ))
                                                }
                                            </div>
                                        </React.Fragment>
                                    )
                                }

                                <div>
                                    <div className="content-create-dropdown--spacer" />

                                    <DropdownOption
                                        label={gettext('More templates...')}
                                        onClick={() => {
                                            const nextState: IStateLoaded = {
                                                ...state,
                                                mode: 'all-templates',
                                            };

                                            this.setState(nextState);
                                        }}
                                    />
                                </div>

                                <div className="content-create-dropdown--spacer" />

                                <div>
                                    {
                                        sdApi.navigation.getPath() !== '/workspace/personal' && (
                                            <DropdownOption
                                                label={gettext('Create package')}
                                                icon={{name: 'package-plus'}}
                                                onClick={() => {
                                                    this.create({kind: 'create-package'});
                                                }}
                                            />
                                        )
                                    }

                                    <DropdownOption
                                        label={gettext('Upload media')}
                                        icon={{name: 'upload'}}
                                        onClick={() => {
                                            this.create({kind: 'upload-media'});
                                        }}
                                    />
                                </div>
                            </React.Fragment>
                        );
                    } else if (state.mode === 'all-templates') {
                        return (
                            <MoreTemplates
                                onSelect={(template) => {
                                    this.create({kind: 'from-template', template});
                                }}
                                back={() => {
                                    const nextState: IStateLoaded = {
                                        ...state,
                                        mode: 'initial',
                                    };

                                    this.setState(nextState);
                                }}
                            />
                        );
                    } else {
                        assertNever(state.mode);
                    }
                })()}
            </div>
        );
    }
}
