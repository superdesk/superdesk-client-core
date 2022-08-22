import * as React from 'react';
import {noop} from 'lodash';
import * as Layout from 'superdesk-ui-framework/react/components/Layouts';

import {
    ButtonGroup,
    NavButton,
    SubNav,
    Dropdown,
    CreateButton,
} from 'superdesk-ui-framework/react';

import {ManageRundownTemplates} from './shows/rundowns/manage-rundown-templates';
import {CreateShowModal} from './shows/create-show';

import {showModal} from '@superdesk/common';

import {superdesk} from './superdesk';
import {CreateRundownFromTemplate} from './shows/rundowns/create-rundown-from-template';
import {RundownsList} from './shows/rundowns/rundowns-list';
import {RundownViewEdit} from './shows/rundowns/rundown-view-edit';

const {gettext} = superdesk.localization;

type IProps = {};

interface IState {
    rundownIdInEditMode: string | null;
}

export class RundownsPage extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            rundownIdInEditMode: null,
        };
    }

    render() {
        return (
            <div style={{marginTop: 'var(--top-navigation-height)', width: '100%', height: 'calc(100% - 32px)'}}>
                <div style={{height: '100%', display: 'flex'}}>
                    <Layout.LayoutContainer>
                        <Layout.HeaderPanel>
                            <SubNav zIndex={2}>
                                <div style={{width: 600}} /> {/** FIXME: use automatic width */}
                                {/* <SearchBar placeholder='Search media'></SearchBar> */}
                                <ButtonGroup align="end" spaces="no-space">
                                    <Dropdown
                                        items={[
                                            {
                                                type: 'group',
                                                label: gettext('Settings'),
                                                items: [
                                                    'divider',
                                                    {
                                                        icon: 'switches',
                                                        label: gettext('Manage Rundown Templates'),
                                                        onSelect: () => {
                                                            showModal(({closeModal}) => (
                                                                <ManageRundownTemplates
                                                                    dialogTitle={gettext('Manage rundown templates')}
                                                                    closeModal={closeModal}
                                                                />
                                                            ));
                                                        },
                                                    },
                                                ],
                                            },
                                        ]}
                                    >
                                        <NavButton icon="settings" onClick={() => false} />
                                    </Dropdown>

                                    <Dropdown
                                        header={[
                                            {
                                                type: 'group',
                                                label: gettext('Create new'),
                                                items: [
                                                    {
                                                        icon: 'rundown',
                                                        label: gettext('Rundown'),
                                                        onSelect: () => {
                                                            showModal(({closeModal}) => (
                                                                <CreateRundownFromTemplate
                                                                    onClose={closeModal}
                                                                />
                                                            ));
                                                        },
                                                    },
                                                ],
                                            },
                                        ]}
                                        items={[]}
                                        footer={[
                                            {
                                                type: 'group',
                                                items: [
                                                    {
                                                        icon: 'rundown',
                                                        label: gettext('Create new Show'),
                                                        onSelect: () => {
                                                            showModal(CreateShowModal);
                                                        },
                                                    },
                                                ],
                                            },
                                        ]}
                                    >

                                        <CreateButton
                                            ariaValue={gettext('Create')}
                                            onClick={noop}
                                        />
                                    </Dropdown>
                                </ButtonGroup>
                            </SubNav>
                            {/* <SubNav zIndex={1}>
                                <ButtonGroup align="start">
                                    <NavButton icon="filter-large" onClick={noop} />
                                </ButtonGroup>
                                <ButtonGroup align="end">
                                    <ButtonGroup align="sub" padded={true} >
                                        <Button
                                            size="normal"
                                            icon="chevron-left-thin"
                                            text="Previous" shape="round"
                                            iconOnly={true}
                                            disabled onClick={() => false}
                                        />
                                        <Button
                                            text="Today"
                                            style="hollow"
                                            onClick={() => false}
                                        />

                                        <Button
                                            size="normal"
                                            icon="chevron-right-thin"
                                            text="Next"
                                            shape="round"
                                            iconOnly={true}
                                            onClick={() => false}
                                        />
                                    </ButtonGroup>

                                    <RadioButtonGroup
                                        options={[
                                            {value: 'test10', label: 'D'},
                                            {value: 'test11', label: 'W'},
                                            {value: 'test12', label: 'M'},
                                        ]}
                                        group={{padded: false}}
                                        value={'z'}
                                        onChange={(value) => this.setState({itemType: value})}
                                    />

                                    <ButtonGroup align="sub" spaces="no-space">
                                        <Dropdown
                                            items={[
                                                {
                                                    type: 'group', label: 'Chose a theme', items: [
                                                        'divider',
                                                        {
                                                            label: 'Light',
                                                            icon: 'adjust',
                                                            onSelect: () => noop,
                                                        },
                                                    ],
                                                },
                                            ]}>
                                            <NavButton type="default" icon="adjust" onClick={() => false} />
                                        </Dropdown>
                                        <Dropdown
                                            items={[
                                                {
                                                    type: 'group', label: 'Actions', items: [
                                                        'divider',
                                                        {label: 'Action one', onSelect: () => noop},
                                                    ]
                                                }]}>
                                            <NavButton icon="dots-vertical" onClick={() => false} />
                                        </Dropdown>
                                    </ButtonGroup>
                                </ButtonGroup>
                            </SubNav> */}
                        </Layout.HeaderPanel>
                        {/* TOOLBAR HEADER */}

                        {/* <Layout.LeftPanel open={true}>
                            <Layout.Panel side="left" background="grey">
                                <Layout.PanelHeader title="Advanced filters" onClose={noop} />
                                <Layout.PanelContent>
                                    <Layout.PanelContentBlock>
                                        <Form.FormGroup>
                                            <Form.FormItem>
                                                <Select
                                                    label="Shows"
                                                    labelHidden={true}
                                                    value="This is some value"
                                                    error="This is error message"
                                                    info="This is some hint message"
                                                    required={true}
                                                    disabled={false}
                                                    invalid={false}
                                                    onChange={noop}>
                                                    <Option>Marker</Option>
                                                    <Option>Tabu</Option>
                                                </Select>
                                            </Form.FormItem>
                                        </Form.FormGroup>
                                        <div className="form__group">
                                            <div className="form__item">
                                                <Input label="Title"
                                                    error="This is error message"
                                                    type="text"
                                                    value="Title"
                                                    inlineLabel={false}
                                                    disabled={false}
                                                    invalid={false}
                                                    onChange={noop} />
                                            </div>
                                        </div>
                                        <div className="form__group">
                                            <div className="form__item">
                                                <Select label="Source"
                                                    value="Select ingest source..."
                                                    error="This is error message"
                                                    inlineLabel={false}
                                                    disabled={false}
                                                    invalid={false}
                                                    onChange={noop}>
                                                    <Option value="option-1">Select ingest source...</Option>
                                                    <Option value="option-2">Associated Press</Option>
                                                    <Option value="option-3">Reuters</Option>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="form__group">
                                            <div className="form__item">
                                                <Input label="Keyword"
                                                    error="This is error message"
                                                    type="text"
                                                    value="Keyword"
                                                    inlineLabel={false}
                                                    disabled={false}
                                                    invalid={false}
                                                    onChange={noop} />
                                            </div>
                                        </div>

                                        <div className="form__group">
                                            <div className="form__item">
                                                <Select label="Usage right"
                                                    value="--- Not selected ---"
                                                    error="This is error message"
                                                    info="Dolor in hendrerit."
                                                    inlineLabel={false}
                                                    disabled={false}
                                                    invalid={false}
                                                    onChange={noop}>
                                                    <Option value="">--- Not selected ---</Option>
                                                    <Option value="single">Single usage</Option>
                                                    <Option value="time">Time restricted</Option>
                                                    <Option value="bananas">Indefinite usage</Option>
                                                    <Option value="indefinite">Pears</Option>
                                                </Select>
                                            </div>
                                        </div>
                                    </Layout.PanelContentBlock>
                                </Layout.PanelContent>
                                <Layout.PanelFooter>
                                    <Button text="Clear" style="hollow" onClick={() => false} />
                                    <Button text="Submit" type="primary" onClick={() => false} />
                                </Layout.PanelFooter>
                            </Layout.Panel>
                        </Layout.LeftPanel> */}

                        <Layout.MainPanel>

                            {/* <GridList size="small" gap="medium" margin="3">
                                {dummy_items.map((item, index) =>
                                    <GridElements.GridItem
                                        locked={item.locked}
                                        status={item.status}
                                        onClick={this.handlePreview}
                                        itemtype={item.type} key={index}
                                    >
                                        <GridElements.GridItemCheckWrapper>
                                            <Checkbox
                                                checked={item.selected}
                                                label={{text:''}}
                                                onChange={(value) => {
                                                    item.selected = value;
                                                    this.changeStatus(item, 'selected');
                                                }}
                                            />
                                        </GridElements.GridItemCheckWrapper>

                                        <GridElements.GridItemTopActions>
                                            <IconButton
                                                icon="fullscreen"
                                                ariaValue="More actions"
                                                onClick={()=> false}
                                            />
                                        </GridElements.GridItemTopActions>

                                        <GridElements.GridItemMedia>
                                            { item.image ? <img src={item.image} alt={item.imageAlt}/> : null }
                                        </GridElements.GridItemMedia>

                                        <GridElements.GridItemContent>
                                            <GridElements.GridItemTime time={item.date} />
                                            <GridElements.GridItemTitle>
                                                {item.title}
                                            </GridElements.GridItemTitle>
                                            <GridElements.GridItemText>
                                                {item.description}
                                            </GridElements.GridItemText>
                                        </GridElements.GridItemContent>

                                        <GridElements.GridItemFooter>
                                            <GridElements.GridItemFooterBlock align="left">
                                                <Icon name={item.type} className="sd-grid-item__type-icn" />
                                                <Badge text={item.urgency} color={item.urgencyColor} />

                                                <Badge
                                                    text={item.priority}
                                                    shape="square"
                                                    color={item.priorityColor}
                                                />
                                            </GridElements.GridItemFooterBlock>
                                            <GridElements.GridItemFooterActions>
                                                <IconButton
                                                    icon="dots-vertical"
                                                    ariaValue="More actions"
                                                    onClick={()=> this.changeStatus(item, 'archived')}
                                                />
                                            </GridElements.GridItemFooterActions>
                                        </GridElements.GridItemFooter>
                                    </GridElements.GridItem>
                                )}
                            </GridList> */}

                            <RundownsList
                                inEditMode={this.state.rundownIdInEditMode}
                                onEditModeChange={(rundownIdInEditMode) => {
                                    this.setState({rundownIdInEditMode});
                                }}
                            />

                        </Layout.MainPanel>

                        {/* <Layout.RightPanel open={true}>
                            <Layout.Panel side="right">
                                <Layout.PanelHeader title="Item preview" onClose={noop} />
                                <Layout.PanelContent>
                                    <Layout.PanelContentBlock flex={true}>
                                        <Container direction="column" gap="x-small">
                                            <Container direction="row" gap="small">
                                                <Text color="light">Created 09.06.2022 by </Text>
                                                <Text weight="medium">Mika Karapet</Text>
                                            </Container>
                                            <Container direction="row" gap="small">
                                                <Text color="light">Updated 3 hours ago by </Text>
                                                <Text weight="medium">John Doe</Text>
                                            </Container>
                                        </Container>
                                        <Container className="sd-margin-s--auto sd-flex--items-center">
                                            <Dropdown
                                                align="right"
                                                append={true}
                                                items={[
                                                    {
                                                        type: 'group', label: 'Actions', items: [
                                                            'divider',
                                                            {
                                                                label: 'Edit',
                                                                icon: 'pencil',
                                                                onSelect: () => noop,
                                                            },
                                                        ],
                                                    }]}>
                                                <IconButton
                                                    ariaValue="dropdown-more-options"
                                                    icon="dots-vertical"
                                                    onClick={() => false}
                                                />
                                            </Dropdown>
                                        </Container>
                                    </Layout.PanelContentBlock>

                                    <Layout.PanelContentBlock>
                                        <Container direction="row" gap="large" className="sd-margin-b--3">
                                            <Label size="large" text="Tabu" color="blue--800" />
                                            <Container direction="row" gap="small">
                                                <Text color="light" size="small" style="italic" >Template:</Text>
                                                <Text size="small" style="italic" weight="medium">Tabu daily</Text>
                                            </Container>
                                        </Container>

                                        <Container direction="column" className="sd-margin-y--2">
                                            <FormLabel text="Title" />
                                            <Heading type="h2">Tabu // 01.06.2022</Heading>
                                        </Container>
                                        <ButtonGroup>
                                            <IconLabel
                                                style="translucent"
                                                innerLabel="Airtime:"
                                                text="19:45 - 20:45"
                                                type="primary"
                                            />

                                            <IconLabel
                                                style="translucent"
                                                innerLabel="Duration:"
                                                text="00:56"
                                                type="warning"
                                            />

                                            <Text color="light" size="small" className="sd-margin--0">OF</Text>
                                            <IconLabel style="translucent" innerLabel="Planned:" text="01:00" />
                                        </ButtonGroup>
                                    </Layout.PanelContentBlock>
                                </Layout.PanelContent>
                            </Layout.Panel>
                        </Layout.RightPanel> */}

                        <Layout.OverlayPanel />
                    </Layout.LayoutContainer>
                    <Layout.ContentSplitter visible={true} />
                    <Layout.AuthoringContainer open={this.state.rundownIdInEditMode != null}>
                        {
                            this.state.rundownIdInEditMode != null && (
                                <RundownViewEdit rundownId={this.state.rundownIdInEditMode} readOnly={false} />
                            )
                        }
                    </Layout.AuthoringContainer>
                </div>
            </div>
        );
    }
}
