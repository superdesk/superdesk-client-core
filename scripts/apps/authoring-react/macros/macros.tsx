import React from 'react';
import {IArticle, IArticleSideWidget, IBaseRestApiResponse, IExtensionActivationResult, IRestApiResponse} from 'superdesk-api';
import {gettext} from 'core/utils';
import {AuthoringWidgetHeading} from 'apps/dashboard/widget-heading';
import {AuthoringWidgetLayout} from 'apps/dashboard/widget-layout';
import {httpRequestJsonLocal} from 'core/helpers/network';
import {IMacro} from 'superdesk-interfaces/Macro';
import _, {extend, filter, forEach, forOwn, groupBy, isEmpty, isString, sortBy} from 'lodash';
import {Button} from 'superdesk-ui-framework/react/components/Button';
import {convertFromRaw} from 'draft-js';
import {OrderedMap} from 'immutable';
import {setHtmlFromTansa} from 'core/editor3/actions/editor3';
import {sdApi} from 'api';
import {dispatchInternalEvent} from 'core/internal-events';
import {generatePatch} from 'core/patch';
import {ToggleBox} from 'superdesk-ui-framework/react/components/Togglebox';
import {Switch} from 'superdesk-ui-framework/react/components/Switch';

type IProps = React.ComponentProps<
    IExtensionActivationResult['contributions']['authoringSideWidgets'][0]['component']
>;

const getLabel = () => gettext('Macros widget');

interface IState {
    macros: IMacro[] | null;
    article: {
        saved: IArticle | null,
        autosaved: IArticle | null,
    },
    displayGrouped: boolean;
}

const META_FIELD_NAME = 'fields_meta';
const fieldsMetaKeys = {
    draftjsState: 'draftjsState',
};

function overwriteArticle(currentArticle: IArticle, patch: Partial<IArticle>): Promise<void> {
    patch.fields_meta = {};

    Object.keys(patch).filter((x) => x !== '_links' && x !== '_status' && x !== 'fields_meta').map((value) => value).forEach((val) => {
        patch.fields_meta[val] = {};
    });

    return sdApi.article.patch(
        currentArticle,
        patch,
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
            this.setState({
                macros: macros._items,
                article: article,
            });
        });
    }

    prepareMacrosList(macros: IMacro[]) {
        // TODO: test on CP instance to see if groups work
        const groupedMacros = groupBy(filter(macros, 'group'), 'group');

        groupedMacros ?? this.setState({displayGrouped: true});
        const quickList = filter(macros, 'order');
        const miscMacros = filter(macros, (o) => o.group === undefined);

        let ordered = {};

        Object.keys(groupedMacros)
            .sort().forEach((key) => {
                ordered[key] = sortBy(groupedMacros[key], 'label');
            });

        return {
            quickList,
            miscMacros,
            groupedMacros,
        };
    }

    getAllMacros(page = 1): Promise<IRestApiResponse<IMacro>> {
        return httpRequestJsonLocal<IRestApiResponse<IMacro>>({
            method: 'GET',
            path: '/macros',
            urlParams: {
                backend: false,
                desk: 'desk1', // TODO: Remove hardcoded stuff
                max_results: 200,
                page: 1,
            },
        });
    }

    getFieldMetadata(item: IArticle, fieldKey, contentKey) {
        if (Object.keys(fieldsMetaKeys).includes(contentKey) === false) {
            throw new Error(`Invalid key '${contentKey}'`);
        }

        if (item == null || item[META_FIELD_NAME] == null || item[META_FIELD_NAME][fieldKey] == null) {
            return null;
        }

        if (Array.isArray(item[META_FIELD_NAME][fieldKey][contentKey]) === false) {
            return null;
        }

        return item[META_FIELD_NAME][fieldKey][contentKey][0];
    }

    runMacro(macro: IMacro) {
        const useReplace = macro.replace_type === 'simple-replace' || macro.replace_type === 'keep-style-replace';
        const isSimpleReplace = macro.replace_type === 'simple-replace';
        const item = extend({}, this.state.article.saved);

        return httpRequestJsonLocal({
            method: 'POST',
            path: '/macros',
            payload: {
                macro: macro.name,
                item,
            },
        }).then((res: IMacro) => {
            let ignoreFields = ['_etag', 'fields_meta'];
            const fieldsState = OrderedMap<string, unknown>();
            const patch = generatePatch(this.props.article, res.item);

            overwriteArticle(this.props.article, patch);

            // return res;

            // if (macro.replace_type === 'editor_state') {
            //     // overwriteArticle(patch);

            //     Object.keys(res.item.fields_meta).forEach((field) => {
            //         // add these fields to fieldsState
            //         // fieldsState.set(convertFromRaw(this.getFieldMetadata(item, field, fieldsMetaKeys.draftjsState)))

            //         const asd = convertFromRaw(this.getFieldMetadata(item, field, fieldsMetaKeys.draftjsState));

            //         console.log(asd);
            //         return convertFromRaw(this.getFieldMetadata(item, field, fieldsMetaKeys.draftjsState));
            //     });
            // } else {
            //     ignoreFields.push('body_html');

            //     if (res.diff == null && useReplace === true && item.body_html !== res.item.body_html) {
            //         // move this method here
            //         setHtmlFromTansa(res.item.body_html, isSimpleReplace);
            //     }

            //     Object.keys(res.item || {}).forEach((field) => {
            //         if (isString(res.item[field]) === false || field === 'body_html') {
            //             return;
            //         }
            //         ignoreFields.push(field);
            //         if (res.item[field] !== item[field]) {
            //             (field, res.item[field]);
            //         }
            //     });
            // }

            // if (isEditor3 || res.diff == null) {
            //     angular.extend($scope.item, _.omit(res.item, ignoreFields));
            //     $scope.autosave($scope.item);
            // }

            // if (res.diff != null) {
            //     $rootScope.$broadcast('macro:diff', res.diff);
            // }
            // return res;
        });
    }

    render() {
        if (this.state.macros == null) {
            return null;
        }

        const {groupedMacros, miscMacros, quickList} = this.prepareMacrosList(this.state.macros);

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
                        {/* TODO: display switch only when this.state.groupedMacros are not null */}
                        <Switch label={{text: gettext('Group Macros')}} value={this.state.displayGrouped} onChange={() => this.setState({displayGrouped: !this.state.displayGrouped})} />
                        {/* TODO: make if else based on this.state.displayGrouped */}
                        <ul>
                            {
                                quickList ? (
                                    <ToggleBox initiallyOpen title={'Quck list'}>
                                        {
                                            quickList?.map((x) => {
                                                return (
                                                    <div key={x.name} style={{paddingTop: 4}}>
                                                        <Button style="hollow" onClick={() => this.runMacro(x)} text={x.label} />
                                                    </div>
                                                );
                                            })
                                        }
                                    </ToggleBox>
                                ) : null
                            }
                            {
                                miscMacros ? (
                                    <ToggleBox title={'Misc'}>
                                        {
                                            miscMacros?.map((x) => {
                                                return (
                                                    <div key={x.name} style={{paddingTop: 4}}>
                                                        <Button style="hollow" onClick={() => this.runMacro(x)} text={x.label} />
                                                    </div>
                                                );
                                            })
                                        }
                                    </ToggleBox>
                                ) : null
                            }
                        </ul>
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
        icon: 'unspike',
        component: MacrosWidget,
    };

    return metadataWidget;
}
