import React from 'react';
import {gettext} from 'core/utils';
import {IArticle, IArticleSideWidget, IExtensionActivationResult, IRestApiResponse} from 'superdesk-api';
import {httpRequestJsonLocal} from 'core/helpers/network';
import {openArticle} from 'core/get-superdesk-api-implementation';
import {AuthoringWidgetHeading} from 'apps/dashboard/widget-heading';
import {AuthoringWidgetLayout} from 'apps/dashboard/widget-layout';
import {Label, Text, BoxedList, BoxedListItem, IconButton} from 'superdesk-ui-framework/react';
import {Spacer} from 'core/ui/components/Spacer';
import Icon from 'core/ui/components/Icon';
import {DateTime} from 'core/ui/components/DateTime';

interface IState {
    packages: Array<IArticle> | null |'no-packages';
}

type IProps = React.ComponentProps<
    IExtensionActivationResult['contributions']['authoringSideWidgets'][0]['component']
>;

const getLabel = () => gettext('Packages');

function openPackage(packageItem: IArticle): void {
    if (packageItem._type === 'published') {
        openArticle(packageItem._id, 'view');
    } else {
        openArticle(packageItem._id, 'edit');
    }
}

class PackagesWidget extends React.Component<IProps, IState> {
    constructor(props) {
        super(props);

        this.state = {
            packages: null,
        };
    }

    componentDidMount(): void {
        this.fetchPackages();
    }

    fetchPackages(): void {
        const filter: Array<string> = (this.props.article.linked_in_packages ?? []).map((x) => x.package);

        httpRequestJsonLocal<IRestApiResponse<IArticle>>({
            method: 'GET',
            path: '/search',
            urlParams: {
                repo: 'archive,published',
                source: {
                    'query': {
                        'filtered': {
                            'filter': {
                                'and': [{
                                    'terms': {'guid': filter},
                                }],
                            },
                        },
                    },
                    'sort': [{'versioncreated': 'desc'}],
                },
            },
        }).then((res) => {
            this.setState({
                packages: res._items.length > 0 ? res._items : 'no-packages',
            });
        });
    }

    render(): JSX.Element {
        // loading
        if (this.state.packages == null) {
            return null;
        }

        return (
            <AuthoringWidgetLayout
                header={(
                    <AuthoringWidgetHeading
                        widgetName={getLabel()}
                        editMode={false}
                    />
                )}
                body={this.state.packages !== 'no-packages'
                    ? (
                        <BoxedList>
                            {
                                this.state.packages.map((packageItem) => (
                                    <BoxedListItem key={packageItem._id}>
                                        <Spacer h gap="16" noWrap>
                                            <Icon icon="big-icon--package" />
                                            <Spacer v gap="4">
                                                <DateTime dateTime={packageItem.versioncreated} />
                                                <Text>
                                                    {packageItem.headline || packageItem.slugline}
                                                </Text>
                                            </Spacer>
                                            <IconButton
                                                ariaValue={gettext('Open package')}
                                                icon="pencil"
                                                onClick={() => openPackage(packageItem)}
                                            />
                                        </Spacer>
                                    </BoxedListItem>
                                ))
                            }
                        </BoxedList>
                    )
                    : <Label text={gettext('Article is not linked to any packages')} />
                }
            />
        );
    }
}

export function getPackagesWidget() {
    const metadataWidget: IArticleSideWidget = {
        _id: 'packages-widget',
        label: getLabel(),
        order: 2,
        icon: 'package',
        component: PackagesWidget,
    };

    return metadataWidget;
}
