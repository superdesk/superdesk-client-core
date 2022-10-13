import React from 'react';
import {
    IArticle,
    IArticleSideWidget,
    IExtensionActivationResult,
    IFieldsV2,
    IRestApiResponse,
} from 'superdesk-api';
import {gettext} from 'core/utils';
import {AuthoringWidgetHeading} from 'apps/dashboard/widget-heading';
import {AuthoringWidgetLayout} from 'apps/dashboard/widget-layout';
import {httpRequestJsonLocal} from 'core/helpers/network';
import {IMacro} from 'superdesk-interfaces/Macro';
import {groupBy} from 'lodash';
import {Button} from 'superdesk-ui-framework/react/components/Button';
import {sdApi} from 'api';
import {dispatchInternalEvent} from 'core/internal-events';
import {generatePatch} from 'core/patch';
import {ToggleBox} from 'superdesk-ui-framework/react/components/Togglebox';
import {Switch} from 'superdesk-ui-framework/react/components/Switch';
import {omitFields} from '../data-layer';
import {Spacer} from 'core/ui/components/Spacer';
import {nameof} from 'core/helpers/typescript-helpers';

type IProps = React.ComponentProps<
    IExtensionActivationResult['contributions']['authoringSideWidgets'][0]['component']
>;

const getLabel = () => gettext('Macros widget');

interface IState {
    macros: Array<IMacro> | null;
    article: {
        saved: IArticle | null,
        autosaved: IArticle | null,
    };
    displayGrouped: boolean | null;
}

const EDITOR_3_FIELD_TYPE = 'editor3';

function overwriteArticle(
    currentArticle: IArticle,
    patch: Partial<IArticle>,
    contentProfileFields: IFieldsV2,
): Promise<void> {
    const patchCopy = omitFields({...patch, fields_meta: {}});

    Object.keys(patchCopy).forEach((fieldKey) => {
        const currentField = contentProfileFields.get(fieldKey);

        if (currentField != null && currentField.fieldType === EDITOR_3_FIELD_TYPE) {
            patchCopy.fields_meta[currentField.name.toLowerCase()] = {};
        }
    });

    return sdApi.article.patch(
        currentArticle,
        patchCopy,
        {patchDirectlyAndOverwriteAuthoringValues: true},
    ).then(() => {
        dispatchInternalEvent('dangerouslyForceReloadAuthoring', null);
    });
}

class MacrosWidget extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            macros: null,
            article: {
                saved: null,
                autosaved: null,
            },
            displayGrouped: false,
        };
    }

    componentDidMount(): void {
        Promise.all([
            this.getAllMacros(),
            this.props.authoringStorage.getEntity(this.props.article._id),
        ]).then(([macros, article]) => {
            const groupedMacros = groupBy(macros._items.filter((x) => x.group != null), nameof<IMacro>('group'));

            this.setState({
                macros: macros._items,
                article: article,
                displayGrouped: Object.keys(groupedMacros).length > 0 ? true : null,
            });
        });
    }

    getAllMacros(page = 1): Promise<IRestApiResponse<IMacro>> {
        return httpRequestJsonLocal<IRestApiResponse<IMacro>>({
            method: 'GET',
            path: '/macros',
            urlParams: {
                backend: false,
                desk: sdApi.desks.getCurrentDeskId(),
                max_results: 200,
                page: page,
            },
        });
    }

    runMacro(macro: IMacro) {
        return httpRequestJsonLocal({
            method: 'POST',
            path: '/macros',
            payload: {
                macro: macro.name,
                item: this.state.article.saved,
            },
        }).then((res: IMacro) => {
            const patch = generatePatch(this.props.article, res.item);
            const isEmpty = Object.keys(patch).length < 1;

            if (!isEmpty) {
                overwriteArticle(this.props.article, patch, this.props.contentProfile.content);
            }
        });
    }

    render() {
        if (this.state.macros == null) {
            return null;
        }

        const groupedOrdered: Dictionary<string, Array<IMacro>> = {};

        if (this.state.displayGrouped != null) {
            groupedOrdered['Quick List'] = this.state.macros.filter((m) => m.order != null);
            const groupedMacros = groupBy(this.state.macros.filter((m) => m.group != null), nameof<IMacro>('group'));

            Object.keys(groupedMacros).sort().forEach((key) => {
                groupedOrdered[key] = groupedMacros[key].sort((a, b) => a.label.localeCompare(b.label));
            });
            groupedOrdered['Miscallaneous'] = this.state.macros.filter((x) => x.group == null);
        }

        const RunMacroButton = (macro: IMacro) => {
            return (
                <div key={macro.name} style={{paddingTop: 4}}>
                    <Button
                        expand
                        style="hollow"
                        onClick={() => this.runMacro(macro)}
                        text={macro.label}
                    />
                </div>
            );
        };

        return (
            <AuthoringWidgetLayout
                header={(
                    <AuthoringWidgetHeading
                        widgetName={getLabel()}
                        editMode={false}
                    />
                )}
                body={(
                    <Spacer v gap="8">
                        {this.state.displayGrouped != null && (
                            <Switch
                                label={{text: gettext('Group Macros')}}
                                value={this.state.displayGrouped != null ? this.state.displayGrouped : null}
                                onChange={() => this.setState({displayGrouped: !this.state.displayGrouped})}
                            />
                        )}
                        {
                            this.state.displayGrouped ? (
                                <React.Fragment>
                                    {
                                        Object.entries(groupedOrdered).map((entry, i) => {
                                            return (
                                                <ToggleBox
                                                    key={i}
                                                    initiallyOpen={entry[0] === 'Quick List' && true}
                                                    title={entry[0]}
                                                >
                                                    {entry[1].map((macro) => RunMacroButton(macro))}
                                                </ToggleBox>
                                            );
                                        })
                                    }
                                </React.Fragment>
                            ) : (
                                <React.Fragment>
                                    {this.state.macros.map((macro) => RunMacroButton(macro))}
                                </React.Fragment>
                            )
                        }
                    </Spacer>
                )}
            />
        );
    }
}

export function getMacrosWidget() {
    const metadataWidget: IArticleSideWidget = {
        _id: 'macros-widget',
        label: getLabel(),
        order: 2,
        icon: 'macro',
        component: MacrosWidget,
    };

    return metadataWidget;
}
