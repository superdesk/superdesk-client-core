/* tslint:disable: max-line-length */

import * as React from 'react';
import * as Layout from 'superdesk-ui-framework/react/components/Layouts';
import * as Form from 'superdesk-ui-framework/react/components/Form';
import * as Nav from 'superdesk-ui-framework/react/components/Navigation';
import {
    SubNav,
    ButtonGroup,
    Button,
    Divider,
    Dropdown,
    NavButton,
    Tooltip,
    IconButton,
    Input,
    Select,
    BoxedList,
    BoxedListItem,
    Icon,
    BoxedListContentRow,
    AvatarWrapper,
    AvatarContentText,
    EmptyState,
    SimpleList,
    SimpleListItem,
    Switch,
    Text,
    Option,
} from 'superdesk-ui-framework/react';

interface IProps {
    children?: React.ReactNode;
}

interface IState {
    theme: 'dark' | 'light' | string;
    itemType: string;
    dropDownState: string;
    itemSelected1: boolean;
    itemSelected2: boolean;
    itemSelected3: boolean;
    value1: boolean;
    value2: boolean;
    value3: boolean;
    leftPanelOpen: boolean;
    rightPanelOpen: boolean;
    rightPanelPinned: boolean;
    sideOverlayOpen: boolean;
    activeTab: string;
    activeTab2: string;
}

export class EditorTest extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);
        this.state = {
            theme: 'light',
            itemType: 'itemtype01',
            dropDownState: '',
            itemSelected1: false,
            itemSelected2: false,
            itemSelected3: false,
            value1: false,
            value2: false,
            value3: false,
            leftPanelOpen: false,
            rightPanelOpen: false,
            rightPanelPinned: false,
            sideOverlayOpen: false,
            activeTab: null,
            activeTab2: null,
        };
        this.handleTheme = this.handleTheme.bind(this);
    }

    handleTheme(newTheme: string) {
        this.setState({
            theme: newTheme,
        });
    }

    changeStatus(item: any, status: string) {
        if (item.status.includes(status)) {
            item.status.splice(item.status.indexOf(status), 1);
        } else {
            item.status.push(status);
        }
    }

    render() {
        return (
            <Layout.AuthoringFrame
                header={(
                    <SubNav>
                        <ButtonGroup align="end">
                            <Button
                                text="Open pinned"
                                style="hollow"
                                onClick={() => this.setState({'rightPanelOpen': !this.state.rightPanelOpen})}
                            />

                            <Divider size="mini" />

                            <ButtonGroup subgroup={true} spaces="no-space">
                                <Dropdown
                                    items={[
                                        {
                                            type: 'group',
                                            label: 'Chose a theme',
                                            items: [
                                                'divider',
                                                {label: 'Light', onSelect: () => this.handleTheme('light-ui')},
                                                {label: 'Dark', onSelect: () => this.handleTheme('dark-ui')},
                                            ],
                                        },
                                    ]}
                                >
                                    <NavButton type="default" icon="adjust" onClick={() => false} />
                                </Dropdown>

                                <Tooltip text="Minimize" flow="left">
                                    <NavButton type="default" icon="minimize" iconSize="big" text="Minimize" onClick={() => false} />
                                </Tooltip>

                                <Tooltip text="More actions" flow="left">
                                    <NavButton type="default" icon="dots-vertical" text="More actions" onClick={() => false} />
                                </Tooltip>

                                <Tooltip text="Send to / Publish" flow="left">
                                    <NavButton type="highlight" icon="send-to" iconSize="big" text="Send to / Publish" onClick={() => false} />
                                </Tooltip>
                            </ButtonGroup>
                        </ButtonGroup>
                    </SubNav>
                )}
                leftPanel={(
                    <Nav.SideBarTabs
                        onActiveTabChange={(val) => {
                            this.setState({
                                activeTab: val,
                            });
                        }}
                        activeTab={this.state.activeTab}
                        items={[
                            {icon: 'semantics', size: 'big', tooltip: 'Semantics', onClick: () => this.setState({'sideOverlayOpen': !this.state.sideOverlayOpen}), id: 'Semantics'},
                            {icon: 'create-list', size: 'big', tooltip: 'Create list', onClick: () => this.setState({'sideOverlayOpen': !this.state.sideOverlayOpen}), id: 'Create list'},
                            {icon: 'picture', size: 'big', tooltip: 'Pictures', onClick: () => this.setState({'sideOverlayOpen': !this.state.sideOverlayOpen}), id: 'Pictures'},
                            {icon: 'annotation', size: 'big', tooltip: 'Annotations', onClick: () => this.setState({'sideOverlayOpen': !this.state.sideOverlayOpen}), id: 'Annotations'},
                            {icon: 'export', size: 'big', tooltip: 'Export', onClick: () => this.setState({'sideOverlayOpen': !this.state.sideOverlayOpen}), id: 'Export'}]
                        }
                    />
                )}
                main={(
                    <Layout.AuthoringMain
                        toolBar={(
                            <React.Fragment>
                                <div className="sd-editor-toolbar__content">
                                    <dl>
                                        <dt>Created</dt>
                                        <dd><time title="July 29, 2021 3:58 PM">07/29</time></dd>
                                        <dt>by</dt>
                                        <dt>Nareg Asmarian</dt>
                                    </dl>
                                    <dl>
                                        <dt>Modified</dt>
                                        <dd><time title="July 29, 2021 3:58 PM">07/29</time></dd>
                                    </dl>
                                </div>
                                <ButtonGroup align="end">
                                    <IconButton icon="preview-mode" ariaValue="Print preview" onClick={() => false} />
                                    <IconButton icon="adjust" ariaValue="Toggle theme" onClick={() => false} />
                                    <IconButton icon="switches" ariaValue="Theme settings" onClick={() => false} />
                                </ButtonGroup>
                            </React.Fragment>
                        )}
                        authoringHeader={(
                            <React.Fragment>
                                <Form.FormGroup inlineLabel={true}>
                                    <Form.FormItem>
                                        <Input
                                            type="text"
                                            label="Slugline"
                                            value="This is some value"
                                            maxLength={30}
                                            error="This is error message"
                                            info="This is some hint message"
                                            required={false}
                                            disabled={false}
                                            invalid={false}
                                            onChange={(value) => ({})}
                                        />
                                    </Form.FormItem>
                                </Form.FormGroup>
                                <Form.FormGroup inlineLabel={true}>
                                    <Form.FormItem>
                                        <Input
                                            type="text"
                                            label="Genre"
                                            value="This is some value"
                                            maxLength={30}
                                            error="This is error message"
                                            info="This is some hint message"
                                            required={false}
                                            disabled={false}
                                            invalid={false}
                                            onChange={(value) => ({})}
                                        />
                                    </Form.FormItem>
                                </Form.FormGroup>
                                <Form.FormGroup marginBottom="0" inlineLabel={true}>
                                    <Form.FormItem>
                                        <Input
                                            type="text"
                                            label="Subject"
                                            value="This is some value"
                                            maxLength={30}
                                            error="This is error message"
                                            info="This is some hint message"
                                            required={true}
                                            disabled={false}
                                            invalid={false}
                                            onChange={(value) => ({})}
                                        />
                                    </Form.FormItem>
                                    <Form.FormItem autoWidth={true}>
                                        <Form.FormText>Just testing:</Form.FormText>
                                    </Form.FormItem>
                                    <Form.FormItem>
                                        <Select
                                            label="Categories"
                                            labelHidden={true}
                                            value="This is some value"
                                            error="This is error message"
                                            info="This is some hint message"
                                            required={true}
                                            disabled={false}
                                            invalid={false}
                                            onChange={(value) => ({})}
                                        >
                                            <Option>Option 1</Option>
                                            <Option>Option 2</Option>
                                        </Select>
                                    </Form.FormItem>
                                    <Form.FormItem autoWidth={true}>
                                        <ButtonGroup>
                                            <IconButton ariaValue="Submit" icon="picture" onClick={() => false} />
                                            <Button text="Cancel" onClick={() => false} type="default" style="hollow" />
                                            <Button text="Submit" onClick={() => false} type="primary" />
                                        </ButtonGroup>
                                    </Form.FormItem>
                                </Form.FormGroup>
                            </React.Fragment>
                        )}
                        authoringBookmarks={(
                            <Nav.QuickNavBar
                                items={[
                                    {icon: 'heading-1', tooltip: 'Headline', onClick: () => false},
                                    {icon: 'align-left', tooltip: 'Body', onClick: () => false},
                                    {icon: 'picture', tooltip: 'Media', onClick: () => false},
                                    {icon: 'attachment-large', tooltip: 'Attachments', onClick: () => false}]}
                            />
                        )}
                    >
                        <p className="sd-margin-b--3">Maecenas sed diam eget risus varius blandit sit amet non magna. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas faucibus mollis interdum.
                            Cras justo odio, dapibus ac facilisis in, egestas eget quam. Aenean lacinia bibendum nulla sed consectetur. Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
                        <p className="sd-margin-b--3">Aenean lacinia bibendum nulla sed consectetur. Etiam porta sem malesuada magna mollis euismod. Aenean eu leo quam. Pellentesque ornare sem lacinia quam venenatis
                            vestibulum. Nullam quis risus eget urna mollis ornare vel eu leo. Curabitur blandit tempus porttitor. Aenean lacinia bibendum nulla sed consectetur. Morbi leo
                            risus, porta ac consectetur ac, vestibulum at eros.</p>
                        <p className="sd-margin-b--3">Nullam quis risus eget urna mollis ornare vel eu leo. Maecenas sed diam eget risus varius blandit sit amet non magna. Aenean eu leo quam. Pellentesque ornare sem lacinia quam venenatis
                            vestibulum. Nullam quis risus eget urna mollis ornare vel eu leo. Donec ullamcorper nulla non metus auctor fringilla. Donec id elit non mi porta gravida at eget metus. Morbi leo risus, porta ac consectetur ac,
                            vestibulum at eros. Curabitur blandit tempus porttitor. Vestibulum id ligula porta felis euismod semper. Maecenas sed diam eget risus varius blandit sit amet non magna.</p>
                        <p>Curabitur blandit tempus porttitor. Nullam quis risus eget urna mollis ornare vel eu leo. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla vitae elit libero, a pharetra
                            augue. Cras mattis consectetur purus sit amet fermentum. Maecenas faucibus mollis interdum. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Vivamus
                            sagittis lacus vel augue laoreet rutrum faucibus dolor auctor. Duis mollis, est non commodo luctus, nisi erat porttitor ligula, eget lacinia odio sem nec elit. Cras mattis consectetur
                            purus sit amet fermentum.</p>
                        <Layout.Container gap="large" className="sd-border--medium sd-font-size--medium sd-padding--2 sd-radius--large">
                            <span>Curabitur blandit tempus porttitor.</span>
                            <Button text="Test button" type="primary" onClick={() => false} />
                            <Button text="Test button" type="highlight" onClick={() => false} />
                            <ButtonGroup align="end">
                                <Button text="Cancel" onClick={() => false} type="default" style="hollow" />
                                <Button text="Submit" onClick={() => false} type="primary" />
                            </ButtonGroup>
                        </Layout.Container>
                    </Layout.AuthoringMain>
                )}
                sidePanelPinned={this.state.rightPanelOpen}
                sidePanel={(
                    <Layout.Panel side="right" background="grey" open={this.state.rightPanelOpen} size="x-small">
                        <Layout.PanelHeader title="Pinned content" onClose={() => this.setState({'rightPanelOpen': false})}>
                        </Layout.PanelHeader>
                        <Layout.PanelContent>
                            <Layout.PanelContentBlock>
                                <BoxedList>
                                    <BoxedListItem
                                        type="success"
                                        clickable={true}
                                        media={(
                                            <Icon name="slideshow" />
                                        )}
                                        actions={(
                                            <IconButton icon="dots-vertical" ariaValue="More actions" onClick={() => false} />
                                        )}
                                    >
                                        <BoxedListContentRow>
                                            Maecenas sed diam eget risus varius blandit sit amet non magna. Vestibulum id ligula porta felis euismod semper.
                                        </BoxedListContentRow>
                                        <BoxedListContentRow>
                                            Praesent commodo cursus magna, vel scelerisque nisl consectetur et.
                                        </BoxedListContentRow>
                                    </BoxedListItem>

                                    <BoxedListItem
                                        type="warning"
                                        media={(
                                            <AvatarWrapper
                                                size="medium"
                                            >
                                                <AvatarContentText text="JL" tooltipText="Jeffrey Lebowski" />
                                            </AvatarWrapper>
                                        )}
                                        footer={(
                                            <ButtonGroup align="end">
                                                <Button text="cancel" size="small" style="hollow" onClick={() => false} />
                                                <Button text="yes" size="small" style="hollow" type="primary" onClick={() => false} />
                                            </ButtonGroup>
                                        )}
                                        actions={(
                                            <IconButton icon="dots-vertical" ariaValue="More actions" onClick={() => false} />
                                        )}
                                    >
                                        <BoxedListContentRow>
                                            Maecenas sed diam eget risus varius blandit sit amet magna.
                                        </BoxedListContentRow>
                                    </BoxedListItem>

                                    <BoxedListItem
                                        selected={true}
                                        actions={(
                                            <IconButton icon="dots-vertical" ariaValue="More actions" onClick={() => false} />
                                        )}
                                    >
                                        <BoxedListContentRow>
                                            Maecenas sed diam eget risus varius blandit sit amet magna. Vestibulum id ligula porta felis euismod semper.
                                        </BoxedListContentRow>
                                    </BoxedListItem>
                                </BoxedList>
                            </Layout.PanelContentBlock>
                        </Layout.PanelContent>
                    </Layout.Panel>
                )}
                sideOverlayOpen={this.state.sideOverlayOpen}
                sideOverlay={(
                    <Layout.Panel background="light" open={this.state.sideOverlayOpen} size="x-small">
                        <Layout.PanelHeader title="Overlay Panel content" onClose={() => this.setState({'sideOverlayOpen': false})}>
                        </Layout.PanelHeader>
                        <Layout.PanelContent
                            empty={false}
                            emptyTemplate={(
                                <EmptyState title="test" />
                            )}
                        >
                            <Layout.PanelContentBlock>
                                <SimpleList border={true}>
                                    <SimpleListItem justify="space-between">
                                        <Switch value={this.state.value1} label={{text: 'My label'}} onChange={(value) => this.setState(() => ({value1: value}))} />
                                    </SimpleListItem>
                                    <SimpleListItem justify="space-between">
                                        <Switch value={this.state.value2} label={{text: 'My label'}} onChange={(value) => this.setState(() => ({value2: value}))} />
                                    </SimpleListItem>
                                    <SimpleListItem stacked={true}>
                                        <Form.FormLabel text="Label two" />
                                        <Text size="small" weight="light">Cras justo odio, dapibus ac facilisis in, egestas eget quam. Vestibulum id ligula porta felis euismod semper. Nullam quis risus eget urna mollis ornare vel eu leo.</Text>
                                    </SimpleListItem>
                                </SimpleList>
                            </Layout.PanelContentBlock>
                        </Layout.PanelContent>
                    </Layout.Panel>
                )}
                sideBar={(
                    <Nav.SideBarTabs
                        activeTab={this.state.activeTab2}
                        onActiveTabChange={(val) => {
                            this.setState({
                                activeTab2: val,
                            });
                        }}
                        items={[
                            {icon: 'info', size: 'big', tooltip: 'Info', onClick: () => this.setState({'sideOverlayOpen': !this.state.sideOverlayOpen}), id: 'Info'},
                            {icon: 'chat', size: 'big', tooltip: 'Comments', onClick: () => this.setState({'sideOverlayOpen': !this.state.sideOverlayOpen}), id: 'Comments'},
                            {icon: 'history', size: 'big', tooltip: 'History', onClick: () => this.setState({'sideOverlayOpen': !this.state.sideOverlayOpen}), id: 'History'},
                            {icon: 'package', size: 'big', tooltip: 'Packages', onClick: () => this.setState({'sideOverlayOpen': !this.state.sideOverlayOpen}), id: 'Packages'},
                            {icon: 'attachment', size: 'big', tooltip: 'Attachments', onClick: () => this.setState({'sideOverlayOpen': !this.state.sideOverlayOpen}), id: 'Attachments'},
                            {icon: 'comments', size: 'big', tooltip: 'Inline Comments', onClick: () => this.setState({'sideOverlayOpen': !this.state.sideOverlayOpen}), id: 'Inline Comments'},
                            {icon: 'suggestion', size: 'big', tooltip: 'Suggestions', onClick: () => this.setState({'sideOverlayOpen': !this.state.sideOverlayOpen}), id: 'Suggestions'},
                        ]}
                    />
                )}
                overlayPanel={(
                    <div />
                )}
            />
        );
    }
}
