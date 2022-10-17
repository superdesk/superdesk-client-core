import React from 'react';
import {
    IArticle,
    IArticleSideWidget,
    IContentProfileV2,
    IExtensionActivationResult,
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
import {nameof} from 'core/helpers/typescript-helpers';
import {EDITOR_3_FIELD_TYPE} from '../fields/editor3';
import {dispatchEditorEvent} from '../authoring-react-editor-events';
import {InteractiveMacrosDisplay} from './interactive-macros-display';
import {editorId} from '../article-widgets/find-and-replace';

// POTENTIAL-IMPROVEMENTS: don't allow replacing the same thing twice
// -> body_html: $101 (CAD 13) -> click replace again -> $101 (CAD 13) (CAD 13)

type IProps = React.ComponentProps<
    IExtensionActivationResult['contributions']['authoringSideWidgets'][0]['component']
>;

const getLabel = () => gettext('Macros widget');

interface IState {
    macros: Array<IMacro> | null;

    // not-supported when there are no groups
    displayGrouped: boolean | 'not-supported';
    currentMacro: IMacro | null;
}

interface IMacroGroup {
    initiallyOpen: boolean;
    macros: Array<IMacro>;
    groupName: string;
}

function getAllMacros(): Promise<IRestApiResponse<IMacro>> {
    return httpRequestJsonLocal<IRestApiResponse<IMacro>>({
        method: 'GET',
        path: '/macros',
        urlParams: {
            backend: false,
            desk: sdApi.desks.getCurrentDeskId(),
            max_results: 200,
            page: 1,
        },
    });
}

export function highlightDistinctMatches(diff: {[key: string]: string}) {
    dispatchEditorEvent('find_and_replace__find_distinct', {
        editorId,
        matches: Object.keys(diff),
        caseSensitive: false,
    });
}

// TODO: Reimplement overwriting
function overwriteArticle(
    currentArticle: IArticle,
    patch: Partial<IArticle>,
    profile: IContentProfileV2,
): Promise<void> {
    const patchCopy = omitFields({...patch, fields_meta: {}});
    const allFields = profile.header.merge(profile.content);

    Object.keys(patchCopy).forEach((fieldKey) => {
        const currentField = allFields.get(fieldKey);

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
            displayGrouped: false,
            currentMacro: null,
        };
    }

    componentDidMount(): void {
        getAllMacros().then((macros) => {
            const groupedMacros = groupBy(macros._items.filter((x) => x.group != null), nameof<IMacro>('group'));

            this.setState({
                macros: macros._items,
                displayGrouped: Object.keys(groupedMacros).length > 0 ? true : null,
            });
        });
    }

    runMacro(macro: IMacro) {
        return httpRequestJsonLocal({
            method: 'POST',
            path: '/macros',
            payload: {
                macro: macro.name,
                item: this.props.article,
            },
        }).then((res: IMacro) => {
            const patch = generatePatch(this.props.article, res.item);
            const isEmpty = Object.keys(patch).length < 1;

            if (!isEmpty) {
                overwriteArticle(this.props.article, patch, this.props.contentProfile);
            }
        });
    }

    runInteractiveMacro(macro: IMacro) {
        return httpRequestJsonLocal({
            method: 'POST',
            path: '/macros',
            payload: {
                macro: macro.name,
                item: this.props.article,
            },
        }).then((res: IMacro) => {
            this.setState({currentMacro: {...res, label: macro.label}});
            highlightDistinctMatches(res.diff);
        });
    }

    render() {
        if (this.state.macros == null) {
            return null;
        }

        const groupedOrdered: Array<IMacroGroup> = [];

        if (this.state.displayGrouped !== 'not-supported') {
            groupedOrdered.push({
                groupName: gettext('Quick List'),
                initiallyOpen: true,
                macros: this.state.macros.filter((m) => m.order != null),
            });
            const groupedMacros = groupBy(this.state.macros.filter((m) => m.group != null), nameof<IMacro>('group'));

            Object.entries(groupedMacros).forEach(([groupName, _]) => {
                groupedOrdered.push({
                    groupName: groupName,
                    initiallyOpen: false,
                    macros: groupedMacros[groupName].sort((a, b) => a.label.localeCompare(b.label)),
                });
            });
            groupedOrdered.push({
                groupName: gettext('Miscellaneous'),
                initiallyOpen: false,
                macros: this.state.macros
                    .filter((m) => m.group == null)
                    .sort((a, b) => a.label.localeCompare(b.label)),
            });
        }

        const RunMacroButton: React.ComponentType<{macro: IMacro}> = ({macro}) => {
            return (
                <div style={{paddingTop: 4}}>
                    <Button
                        expand
                        style="hollow"
                        onClick={() => {
                            macro.action_type !== 'interactive'
                                ? this.runMacro(macro)
                                : this.runInteractiveMacro(macro);
                        }}
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
                    <>
                        {
                            this.state.currentMacro?.diff == null ?
                                (
                                    <>
                                        {this.state.displayGrouped !== 'not-supported' && (
                                            <Switch
                                                label={{text: gettext('Group Macros')}}
                                                value={this.state.displayGrouped}
                                                onChange={() =>
                                                    this.setState({displayGrouped: !this.state.displayGrouped})
                                                }
                                            />
                                        )}
                                        {
                                            this.state.displayGrouped ? (
                                                groupedOrdered.map((group, i) => {
                                                    return (
                                                        <ToggleBox
                                                            key={i}
                                                            initiallyOpen={group.initiallyOpen}
                                                            title={group.groupName}
                                                        >
                                                            {group.macros.map((macro) => (
                                                                <RunMacroButton
                                                                    key={macro.name}
                                                                    macro={macro}
                                                                />
                                                            ))}
                                                        </ToggleBox>
                                                    );
                                                })
                                            ) : this.state.macros.map((macro) => (
                                                <RunMacroButton
                                                    key={macro.name}
                                                    macro={macro}
                                                />
                                            ))
                                        }
                                    </>
                                ) : (
                                    <>
                                        <InteractiveMacrosDisplay
                                            currentMacro={this.state.currentMacro}
                                        />
                                    </>
                                )
                        }
                    </>
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
