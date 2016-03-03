(function() {
    'use strict';

    angular.module('superdesk.search.react', [])
        .directive('sdItemsList', [
            '$location',
            '$document',
            '$timeout',
            '$injector',
            'packages',
            'asset',
            'api',
            'search',
            'session',
            'moment',
            'gettext',
            'superdesk',
            'workflowService',
            'archiveService',
            'activityService',
            'multi',
            'desks',
            'familyService',
            'Keys',
            'dragitem',
            'highlightsService',
        function(
            $location,
            $document,
            $timeout,
            $injector,
            packages,
            asset,
            api,
            search,
            session,
            moment,
            gettext,
            superdesk,
            workflowService,
            archiveService,
            activityService,
            multi,
            desks,
            familyService,
            Keys,
            dragitem,
            highlightsService
        ) {
            return {
                controllerAs: 'listController',
                controller: ['$q', 'ingestSources', 'desks', 'highlightsService',
                function($q, ingestSources, desks, highlightsService) {
                    var self = this;
                    self.ready = $q.all({
                        ingestProvidersById: ingestSources.initialize().then(function() {
                            self.ingestProvidersById = ingestSources.providersLookup;
                        }),
                        desksById: desks.initialize().then(function() {
                            self.desksById = desks.deskLookup;
                        }),
                        highlightsById: highlightsService.get().then(function(result) {
                            self.highlightsById = {};
                            result._items.forEach(function(item) {
                                self.highlightsById[item._id] = item;
                            });
                        }),
                        // populates cache for mark for highlights activity dropdown
                        deskHighlights: highlightsService.get(desks.getCurrentDeskId())
                    });
                }],
                link: function(scope, elem) {
                    /**
                     * Test if an item has thumbnail
                     *
                     * @return {Boolean}
                     */
                    function hasThumbnail(item) {
                        return item.type === 'picture' && item.renditions.thumbnail;
                    }

                    /**
                     * Media Preview - renders item thumbnail
                     */
                    var MediaPreview = function(props) {
                        var item = props.item;
                        var headline = item.headline || item.slugline || item.type;
                        var preview;

                        if (hasThumbnail(props.item)) {
                            preview = React.createElement(
                                'img',
                                {src: props.item.renditions.thumbnail.href}
                            );
                        }

                        return React.createElement(
                            'div',
                            {className: 'media multi'},
                            preview ? React.createElement(
                                'figure',
                                null,
                                preview
                            ) : null,
                            React.createElement(
                                'span',
                                {className: 'text'},
                                React.createElement(
                                    'small',
                                    {title: headline},
                                    headline.substr(0, 90)
                                ),
                                React.createElement(ItemContainer, {item: item, desk: props.desk})
                            ),
                            React.createElement(SelectBox, {item: item, onMultiSelect: props.onMultiSelect})
                        );
                    };

                    var SelectBox = React.createClass({
                        toggle: function(event) {
                            event.stopPropagation();
                            var selected = !this.props.item.selected;
                            this.props.onMultiSelect(this.props.item, selected);
                        },

                        render: function() {
                            return React.createElement(
                                'div',
                                {className: 'selectbox', onClick: this.toggle},
                                React.createElement(
                                    'span',
                                    {className: 'sd-checkbox' + (this.props.item.selected ? ' checked' : '')}
                                )
                            );
                        }
                    });

                    var ItemContainer = function(props) {
                        var item = props.item;
                        var desk = props.desk || null;
                        var label, value;

                        if (item._type !== 'ingest') {
                            if (desk) {
                                label = gettext('desk:');
                                value = desk.name;
                            } else {
                                if (item._type === 'archive') {
                                    label = gettext('location:');
                                    value = gettext('workspace');
                                } else {
                                    if (item._type === 'published' && item.allow_post_publish_actions === false) {
                                        label = '';
                                        value = gettext('archived');
                                    }
                                }
                            }
                        }

                        return React.createElement(
                            'span',
                            {className: 'container', title: value ? label + ' ' + value : null},
                            React.createElement(
                                'span',
                                {className: 'location-desk-label'},
                                label
                            ),
                            value
                        );
                    };

                    /**
                     * Media Info - renders item metadata
                     */
                    var MediaInfo = function(props) {
                        var item = props.item;
                        var meta = [];

                        if (props.ingestProvider) {
                            meta.push(
                                React.createElement('dt', {key: 1}, gettext('source')),
                                React.createElement('dd', {key: 2, className: 'provider'}, props.ingestProvider.name)
                            );
                        }

                        meta.push(
                            React.createElement('dt', {key: 3}, gettext('updated')),
                            React.createElement('dd', {key: 4}, moment(item.versioncreated).fromNow())
                        );

                        if (item.is_spiked) {
                            meta.push(React.createElement('dt', {key: 5}, gettext('expires')));
                            meta.push(React.createElement('dd', {key: 6}, moment(item.expiry).fromNow()));
                        }

                        var info = [];
                        var flags = item.flags || {};

                        info.push(React.createElement(
                            'h5',
                            {key: 1},
                            item.slugline || item.type
                        ));

                        info.push(React.createElement(
                            'dl',
                            {key: 2},
                            meta
                        ));

                        if (flags.marked_for_not_publication) {
                            info.push(React.createElement(
                                'div',
                                {key: 3, className: 'state-label not-for-publication'},
                                gettext('Not for publication')
                            ));
                        }

                        if (flags.marked_for_legal) {
                            info.push(React.createElement(
                                'div',
                                {key: 4, className: 'state-label legal'},
                                gettext('Legal')
                            ));
                        }

                        if (item.archived) {
                            info.push(React.createElement(
                                'div',
                                {className: 'fetched-desk', key: 5},
                                React.createElement(FetchedDesksInfo, {item: item})
                            ));
                        }

                        return React.createElement('div', {className: 'media-info'}, info);
                    };

                    /**
                     * Type icon component
                     */
                    var TypeIcon = function(props) {
                        return React.createElement('i', {className: 'filetype-icon-' + props.type});
                    };

                    var GridTypeIcon = function(props) {
                        return React.createElement(
                            'span',
                            {className: 'type-icon'},
                            React.createElement(TypeIcon, {type: props.item.type})
                        );
                    };

                    var ListTypeIcon = React.createClass({
                        getInitialState: function() {
                            return {hover: false};
                        },

                        setHover: function() {
                            this.setState({hover: true});
                        },

                        unsetHover: function() {
                            if (this.state.hover) {
                                this.setState({hover: false});
                            }
                        },

                        render: function() {
                            var showSelect = this.state.hover || this.props.item.selected;
                            return React.createElement(
                                'div',
                                {className: 'list-field type-icon', onMouseEnter: this.setHover, onMouseLeave: this.unsetHover},
                                showSelect ?
                                    React.createElement(SelectBox, {item: this.props.item, onMultiSelect: this.props.onMultiSelect}) :
                                    React.createElement(TypeIcon, {type: this.props.item.type})
                            );
                        }
                    });

                    var ItemPriority = function(props) {
                        var priority = props.priority || 3;
                        return React.createElement(
                            'span',
                            {className: 'priority-label priority-label--' + priority},
                            priority
                        );
                    };

                    var ListPriority = function(props) {
                        var item = props.item;
                        return React.createElement(
                            'div',
                            {className: 'list-field urgency'},
                            item.priority ?
                                React.createElement(
                                    'span',
                                    {className: 'priority-label priority-label--' + item.priority},
                                    item.priority
                                ) :
                                React.createElement(
                                    'span',
                                    {className: 'output-item-label label-' + item.urgency},
                                    item.urgency
                                )
                        );
                    };

                    var HighlightsList = React.createClass({
                        removeHighlight: function(highlight) {
                            return function(event) {
                                event.stopPropagation();
                                highlightsService.markItem(highlight._id, this.props.item._id);
                            }.bind(this);
                        },
                        render: function() {
                            var highlights = this.props.highlights;
                            var highlightsById = this.props.highlightsById;

                            var createHighlight = function(id) {
                                var highlight = highlightsById[id];
                                return React.createElement(
                                    'li',
                                    {key: 'item-highlight-' + highlight._id},
                                    highlight.name,
                                    React.createElement(
                                        'button',
                                        {className: 'btn btn-mini', onClick: this.removeHighlight(highlight)},
                                        gettext('REMOVE')
                                    )
                                );
                            }.bind(this);

                            var items = [
                                React.createElement(
                                    'li',
                                    {key: 'item-highlight-label'},
                                    React.createElement(
                                        'div',
                                        {className: 'menu-label'},
                                        gettext('Marked For')
                                    )
                                )
                            ];

                            return React.createElement(
                                'ul',
                                {className: 'dropdown dropdown-menu highlights-list-menu open'},
                                items.concat(highlights.map(createHighlight))
                            );
                        }
                    });

                    var HighlightsInfo = React.createClass({

                        getInitialState: function() {
                            return {open: false};
                        },

                        open: function() {
                            $timeout.cancel(this.closeTimeout);
                            this.closeTimeout = null;
                            if (!this.state.open) {
                                this.setState({open: true});
                            }
                        },

                        close: function() {
                            if (this.state.open && !this.closeTimeout) {
                                this.closeTimeout = $timeout(function() {
                                    this.closeTimeout = null;
                                    this.setState({open: false});
                                }.bind(this), 200, false);
                            }
                        },

                        componentWillUnmount: function() {
                            $timeout.cancel(this.closeTimeout);
                            this.closeTimeout = null;
                        },

                        stopClick: function(event) {
                            event.stopPropagation();
                        },

                        render: function() {
                            var item = this.props.item.archive_item || this.props.item;
                            var highlights = item.highlights || [];
                            return React.createElement(
                                'div',
                                {
                                    className: 'highlights-box',
                                    onMouseEnter: this.open,
                                    onMouseLeave: this.close,
                                    onClick: this.stopClick
                                },
                                highlights.length ? React.createElement(
                                    'div',
                                    {className: 'highlights-list dropdown' + (this.state.open ? ' open' : '')},
                                    React.createElement(
                                        'button',
                                        {className: 'dropdown-toggle'},
                                        React.createElement('i', {
                                            className: classNames({
                                                'icon-star red': highlights.length === 1,
                                                'icon-multi-star red': highlights.length > 1
                                            })
                                        })

                                    ),
                                    this.state.open ? React.createElement(HighlightsList, {
                                        item: item,
                                        highlights: highlights,
                                        highlightsById: this.props.highlightsById
                                    }) : null
                                ) : null
                            );
                        }
                    });

                    var DesksDropdown = React.createClass({
                        getInitialState: function() {
                            return {open: false};
                        },

                        toggle: function(event) {
                            event.stopPropagation();
                            this.setState({open: !this.state.open});
                        },

                        render: function() {
                            var desks = this.props.desks.map(function(desk, index) {
                                return React.createElement(
                                    'li',
                                    {key: 'desk' + index},
                                    React.createElement(
                                        'a',
                                        {disabled: !desk.isUserDeskMember, onClick: this.props.openDesk(desk)},
                                        desk.desk.name + ' (' + desk.count + ')'
                                    )
                                );
                            }.bind(this));

                            return React.createElement(
                                'dd',
                                {className: 'dropdown dropup more-actions'},
                                React.createElement(
                                    'button',
                                    {className: 'dropdown-toggle', onClick: this.toggle},
                                    React.createElement('i', {className: 'icon-dots'})
                                ),
                                React.createElement(
                                    'div',
                                    {className: 'dropdown-menu'},
                                    React.createElement('ul', {}, desks)
                                )
                            );
                        }
                    });

                    var FetchedDesksInfo = React.createClass({
                        getInitialState: function() {
                            return {desks: []};
                        },

                        componentDidMount: function() {
                            familyService.fetchDesks(this.props.item, false)
                                .then(function(fetchedDesks) {
                                    this.setState({desks: fetchedDesks});
                                }.bind(this));
                        },

                        formatDeskName: function(name) {
                            return name.substr(0, 10) + (name.length > 10 ? '...' : '');
                        },

                        openDesk: function(desk) {
                            return function(event) {
                                event.stopPropagation();
                                if (desk.isUserDeskMember) {
                                    desks.setCurrentDeskId(desk.desk._id);
                                    $location.url('/workspace/monitoring');
                                    if (desk.count === 1) {
                                        superdesk.intent('edit', 'item', desk.item);
                                    }
                                }
                            };
                        },

                        render: function() {
                            var items = [];
                            items.push(React.createElement('dt', {key: 'dt', style: {paddingRight:'5px'}}, gettext('fetched in')));

                            if (this.state.desks.length) {
                                var desk = this.state.desks[0];
                                var name = this.formatDeskName(desk.desk.name);
                                items.push(React.createElement('dd', {key: 'dd1'}, desk.isUserDeskMember ?
                                    React.createElement('a', {onClick: this.openDesk(desk)}, name) :
                                    React.createElement('span', {className: 'container'}, name)
                                ));

                                if (this.state.desks.length > 1) {
                                    items.push(React.createElement(DesksDropdown, {
                                        key: 'dd2',
                                        desks: this.state.desks,
                                        openDesk: this.openDesk
                                    }));
                                }
                            }

                            return React.createElement('div', {},
                                React.createElement(
                                    'dl',
                                    {},
                                    items
                                )
                            );
                        }
                    });

                    var ListItemInfo = function(props) {
                        var item = props.item;
                        var flags = item.flags || {};
                        var anpa = item.anpa_category || {};
                        var broadcast = item.broadcast || {};
                        var provider = props.ingestProvider || {name: null};
                        return React.createElement(
                            'div',
                            {className: 'item-info'},
                            React.createElement('div', {className: 'line'},
                                React.createElement('span', {className: 'word-count'}, item.word_count),
                                item.slugline ? React.createElement('span', {className: 'keyword'}, item.slugline.substr(0, 40)) : null,
                                React.createElement(HighlightsInfo, {item: item, highlightsById: props.highlightsById}),
                                React.createElement('span', {className: 'item-heading'}, item.headline ?
                                    item.headline.substr(0, 90) :
                                    item.type),
                                React.createElement('time', {}, moment(item.versioncreated).fromNow())
                            ),
                            React.createElement('div', {className: 'line'},
                                React.createElement('div', {className: 'state-label state-' + item.state}, item.state),
                                item.anpa_take_key ?
                                    React.createElement('div', {className: 'takekey'}, item.anpa_take_key) :
                                    null,
                                item.signal ?
                                    React.createElement('span', {className: 'signal'}, item.signal) :
                                    null,
                                broadcast.status ?
                                    React.createElement('span', {className: 'broadcast-status', tooltip: broadcast.status}, '!') :
                                    null,
                                flags.marked_for_not_publication ?
                                    React.createElement('div', {className: 'state-label not-for-publication'},
                                        gettext('Not for Publication')) :
                                    null,
                                flags.marked_for_legal ?
                                    React.createElement('div', {className: 'state-label legal'}, gettext('Legal')) :
                                    null,
                                anpa.name ?
                                    React.createElement('div', {className: 'category'}, anpa.name) :
                                    null,
                                React.createElement('span', {className: 'provider'}, provider.name),
                                item.is_spiked ?
                                    React.createElement('div', {className: 'expires'},
                                        gettext('expires') + ' ' + moment(item.expiry).fromNow()) :
                                    null,
                                item.archived ? React.createElement(FetchedDesksInfo, {item: item}) : null,
                                React.createElement(ItemContainer, {item: item, desk: props.desk})
                            )
                        );
                    };

                    var ItemUrgency = function(props) {
                        var urgency = props.urgency || 3;
                        return React.createElement(
                            'span',
                            {className: 'urgency-label urgency-label--' + urgency},
                            urgency
                        );
                    };

                    var BroadcastStatus = function(props) {
                        var broadcast = props.broadcast || {};
                        return React.createElement(
                            'span',
                            {className: 'broadcast-status', tooltip: broadcast.status},
                            '!'
                        );
                    };

                    var ActionsMenu = React.createClass({
                        toggle: function(event) {
                            this.setState({open: !this.state.open});
                            this.stopEvent(event);
                        },

                        stopEvent: function(event) {
                            event.stopPropagation();
                        },

                        getInitialState: function() {
                            return {open: false};
                        },

                        getActions: function() {
                            var item = this.props.item;
                            var type = this.getType();
                            var intent = {action: 'list', type: type};
                            var groups = {};
                            superdesk.findActivities(intent, item).forEach(function(activity) {
                                if (workflowService.isActionAllowed(item, activity.action)) {
                                    var group = activity.group || 'default';
                                    groups[group] = groups[group] || [];
                                    groups[group].push(activity);
                                }
                            });
                            return groups;
                        },

                        getType: function() {
                            return archiveService.getType(this.props.item);
                        },

                        groups: [
                            {_id: 'default', label: gettext('Actions')},
                            {_id: 'packaging', label: gettext('Packaging')},
                            {_id: 'highlights', label: gettext('Highlights')},
                            {_id: 'corrections', label: gettext('Corrections')}
                        ],

                        render: function() {
                            var menu = [];
                            var item = this.props.item;

                            var createAction = function(activity) {
                                return React.createElement(ActionsMenu.Item, {
                                    item: item,
                                    activity: activity,
                                    key: activity._id
                                });
                            }.bind(this);

                            if (this.state.open) {
                                var actions = this.getActions();
                                this.groups.map(function(group) {
                                    if (actions[group._id]) {
                                        menu.push(
                                            React.createElement(ActionsMenu.Label, {
                                                label: group.label,
                                                key: 'group-label-' + group._id
                                            }),
                                            React.createElement(ActionsMenu.Divider, {
                                                key: 'group-divider-' + group._id
                                            })
                                        );

                                        menu.push.apply(menu, actions[group._id].map(createAction));
                                    }
                                });
                            }

                            return React.createElement(
                                'div',
                                {className: 'item-right toolbox'},
                                React.createElement(
                                    'div',
                                    {className: 'item-actions-menu dropdown-big open'},
                                    React.createElement(
                                        'button',
                                        {
                                            className: 'more-activity-toggle condensed dropdown-toggle',
                                            onClick: this.toggle,
                                            onDblClick: this.stopEvent
                                        },
                                        React.createElement('i', {className: 'icon-dots-vertical'})
                                    ),
                                    React.createElement(
                                        'ul',
                                        {
                                            className: 'dropdown dropdown-menu more-activity-menu open',
                                            style: {top: '66%', left: -150, display: this.state.open ? 'block' : 'none', minWidth: 200}
                                        },
                                        menu
                                    )
                                )
                            );
                        }
                    });

                    ActionsMenu.Label = function(props) {
                        return React.createElement(
                            'li',
                            null,
                            React.createElement('div', {className: 'menu-label'}, props.label)
                        );
                    };

                    ActionsMenu.Divider = function() {
                        return React.createElement('li', {className: 'divider'});
                    };

                    ActionsMenu.Item = React.createClass({
                        run: function(event) {
                            // Stop event propagation so that click on item action
                            // won't select that item for preview/authoring.
                            event.stopPropagation();
                            activityService.start(this.props.activity, {data: {item: this.props.item}});
                        },

                        getInitialState: function() {
                            return {open: false};
                        },

                        open: function() {
                            $timeout.cancel(this.closeTimeout);
                            this.closeTimeout = null;
                            if (!this.state.open) {
                                this.setState({open: true});
                            }
                        },

                        close: function() {
                            if (this.state.open && !this.closeTimeout) {
                                this.closeTimeout = $timeout(function() {
                                    this.closeTimeout = null;
                                    this.setState({open: false});
                                }.bind(this), 100, false);
                            }
                        },

                        componentWillUnmount: function() {
                            $timeout.cancel(this.closeTimeout);
                            this.closeTimeout = null;
                        },

                        render: function() {
                            var activity = this.props.activity;
                            if (activity.dropdown) {
                                return React.createElement(
                                    'li',
                                    {onMouseEnter: this.open, onMouseLeave: this.close},
                                    React.createElement(
                                        'div',
                                        {className: 'dropdown dropdown-noarrow' + (this.state.open ? ' open' : '')},
                                        React.createElement(
                                            'a',
                                            {className: 'dropdown-toggle', title: activity.label},
                                            activity.icon ? React.createElement('i', {className: 'icon-' + activity.icon}, '') : null,
                                            activity.label,
                                            React.createElement('i', {className: 'icon-chevron-right-thin submenu-icon'})
                                        ),
                                        this.state.open ?
                                            React.createElement(
                                                'ul',
                                                {className: 'dropdown-menu right-submenu'},
                                                $injector.invoke(activity.dropdown, activity, {item: this.props.item})
                                            ) : null
                                    )
                                );
                            } else {
                                return React.createElement(
                                    'li',
                                    null,
                                    React.createElement(
                                        'a',
                                        {title: gettext(activity.label), onClick: this.run},
                                        React.createElement('i', {className: 'icon-' + activity.icon}),
                                        React.createElement('span', {style: {display: 'inline'}}, gettext(activity.label))
                                    )
                                );
                            }
                        }
                    });

                    var ProgressBar = function(props) {
                        return React.createElement('div', {className: 'archiving-progress', style: {width: props.completed + '%'}});
                    };

                    var ErrorBox = function(props) {
                        return React.createElement('div', {className: 'error-box'},
                            React.createElement('p', {className: 'message'}, gettext('There was an error archiving this item')),
                            React.createElement('div', {className: 'buttons'})
                        );
                    };

                    /**
                     * Item component
                     */
                    var Item = React.createClass({
                        shouldComponentUpdate: function(nextProps, nextState) {
                            return nextProps.item !== this.props.item ||
                                nextProps.view !== this.props.view ||
                                nextProps.flags.selected !== this.props.flags.selected ||
                                nextState !== this.state;
                        },

                        select: function() {
                            this.props.onSelect(this.props.item);
                        },

                        getInitialState: function() {
                            return {hover: false};
                        },

                        setHoverState: function() {
                            this.setState({hover: true});
                        },

                        unsetHoverState: function() {
                            this.setState({hover: false});
                        },

                        onDragStart: function(event) {
                            dragitem.start(event, this.props.item);
                        },

                        render: function() {
                            var item = this.props.item;
                            var broadcast = item.broadcast || {};
                            var contents = [
                                'div',
                                {
                                    className: classNames(
                                        'media-box',
                                        'media-' + item.type,
                                        {
                                            locked: item.lock_user && item.lock_session,
                                            selected: this.props.flags.selected,
                                            archived: item.archived || item.created
                                        }
                                    )

                                }
                            ];

                            if (item._progress) {
                                contents.push(React.createElement(ProgressBar, {completed: item._progress}));
                            }

                            if (this.props.view === 'mgrid') {
                                contents.push(
                                    item.archiveError ? React.createElement(ErrorBox) : null,
                                    React.createElement(MediaPreview, {
                                        item: item,
                                        desk: this.props.desk,
                                        onMultiSelect: this.props.onMultiSelect
                                    }),
                                    React.createElement(MediaInfo, {item: item, ingestProvider: this.props.ingestProvider}),
                                    React.createElement(GridTypeIcon, {item: item}),
                                    item.priority ? React.createElement(ItemPriority, {priority: item.priority}) : null,
                                    item.urgency ? React.createElement(ItemUrgency, {urgency: item.urgency}) : null,
                                    broadcast.status ? React.createElement(BroadcastStatus, {broadcast: broadcast}) : null,
                                    this.state.hover ? React.createElement(ActionsMenu, {item: item}) : null
                                );
                            } else {
                                contents.push(
                                    React.createElement('span', {className: 'state-border'}),
                                    React.createElement(ListTypeIcon, {
                                        item: item,
                                        onMultiSelect: this.props.onMultiSelect
                                    }),
                                    React.createElement(ListPriority, {item: item}),
                                    React.createElement(ListItemInfo, {
                                        item: item,
                                        desk: this.props.desk,
                                        ingestProvider: this.props.ingestProvider,
                                        highlightsById: this.props.highlightsById
                                    }),
                                    this.state.hover ? React.createElement(ActionsMenu, {item: item}) : null
                                );
                            }

                            return React.createElement(
                                'li',
                                {
                                    id: item._id,
                                    key: item._id,
                                    className: classNames('list-item-view', {active: this.props.flags.selected}),
                                    onMouseEnter: this.setHoverState,
                                    onMouseLeave: this.unsetHoverState,
                                    onDragStart: this.onDragStart,
                                    onClick: this.select,
                                    draggable: true
                                },
                                React.createElement.apply(null, contents)
                            );
                        }
                    });

                    /**
                     * Item list component
                     */
                    var ItemList = React.createClass({
                        getInitialState: function() {
                            return {itemsList: [], itemsById: {}, selected: null, view: 'mgrid'};
                        },

                        multiSelect: function(item, selected) {
                            var itemsById = angular.extend({}, this.state.itemsById);
                            itemsById[item._id] = angular.extend({}, item, {selected: selected});
                            this.setState({itemsById: itemsById});
                            multi.toggle(itemsById[item._id]);
                        },

                        select: function(item) {
                            $timeout.cancel(this.updateTimeout);
                            this.updateTimeout = $timeout(function() {
                                scope.$apply(function() {
                                    scope.preview(item);
                                });
                            }, 100, false);
                            this.setState({
                                selected: item ? item._id : null
                            });
                        },

                        updateItem: function(itemId, changes) {
                            var item = this.state.itemsById[itemId] || null;
                            if (item) {
                                var itemsById = angular.extend({}, this.state.itemsById);
                                itemsById[itemId] = angular.extend({}, item, changes);
                                this.setState({itemsById: itemsById});
                            }
                        },

                        getSelectedItem: function() {
                            var selected = this.state.selected;
                            return this.state.itemsById[selected];
                        },

                        handleKey: function(event) {
                            var diff;

                            switch (event.keyCode) {
                                case Keys.right:
                                case Keys.down:
                                    diff = 1;
                                    break;

                                case Keys.left:
                                case Keys.up:
                                    diff = -1;
                                    break;

                                case Keys.enter:
                                    if (this.state.selected) {
                                        this.select(this.getSelectedItem());
                                    }

                                    event.stopPropagation();
                                    return;
                            }

                            if (diff != null) {
                                event.preventDefault();
                                event.stopPropagation();
                                if (this.state.selected) {
                                    for (var i = 0; i < this.state.itemsList.length; i++) {
                                        if (this.state.itemsList[i] === this.state.selected) {
                                            var next = Math.min(this.state.itemsList.length - 1, Math.max(0, i + diff));
                                            this.select(this.state.itemsById[this.state.itemsList[next]]);
                                            return;
                                        }
                                    }
                                } else {
                                    this.select(this.state.itemsById[this.state.itemsList[0]]);
                                }
                            }
                        },

                        componentDidMount: function() {
                            ReactDOM.findDOMNode(this).focus();
                        },

                        render: function render() {
                            var createItem = function createItem(itemId) {
                                var item = this.state.itemsById[itemId];
                                var task = item.task || {desk: null};
                                return React.createElement(Item, {
                                    key: item._id,
                                    item: item,
                                    view: this.state.view,
                                    flags: {selected: this.state.selected === item._id},
                                    onSelect: this.select,
                                    onMultiSelect: this.multiSelect,
                                    ingestProvider: this.props.ingestProvidersById[item.ingest_provider] || null,
                                    desk: this.props.desksById[task.desk] || null,
                                    highlightsById: this.props.highlightsById
                                });
                            }.bind(this);

                            return React.createElement(
                                'ul',
                                {
                                    className: this.state.view + '-view list-view',
                                    tabIndex: '0'
                                },
                                this.state.itemsList.map(createItem)
                            );
                        }
                    });

                    scope.listController.ready.then(function() { // we can init
                        var itemList = React.createElement(ItemList, {
                            desksById: scope.listController.desksById,
                            highlightsById: scope.listController.highlightsById,
                            ingestProvidersById: scope.listController.ingestProvidersById
                        });

                        var listComponent = ReactDOM.render(itemList, elem[0]);

                        $document.on('keydown', function(event) {
                            listComponent.handleKey(event);
                        });

                        scope.$on('$destroy', function() {
                            $document.off('keydown', listComponent.handleKey);
                        });

                        /**
                         * Test if item a equals to item b
                         *
                         * @param {Object} a
                         * @param {Object} b
                         * @return {Boolean}
                         */
                        function isSameVersion(a, b) {
                            return a._etag === b._etag && a._current_version === b._current_version;
                        }

                        scope.$watch('items', function(items) {
                            if (!items) {
                                return;
                            }

                            var itemsList = [];
                            var currentItems = {};
                            var itemsById = angular.extend({}, listComponent.state.itemsById);

                            items._items.forEach(function(item) {
                                if (!itemsById[item._id] || !isSameVersion(itemsById[item._id], item)) {
                                    itemsById[item._id] = item;
                                }

                                if (!currentItems[item._id]) { // filter out possible duplicates
                                    currentItems[item._id] = true;
                                    itemsList.push(item._id);
                                }
                            });

                            listComponent.setState({
                                itemsList: itemsList,
                                itemsById: itemsById,
                                view: scope.view
                            });
                        });

                        scope.$watch('view', function(newValue, oldValue) {
                            if (newValue !== oldValue) {
                                listComponent.setState({view: newValue});
                            }
                        });

                        scope.$on('item:lock', function(_e, data) {
                            listComponent.updateItem(data.item, {
                                lock_user: data.user,
                                lock_session: data.lock_session,
                                lock_time: data.lock_time
                            });
                        });

                        scope.$on('item:highlight', function(_e, data) {
                            var item = listComponent.state.itemsById[data.item_id];
                            if (item) {
                                var highlights = item.highlights || [];
                                if (data.marked) {
                                    highlights = highlights.concat([data.highlight_id]);
                                } else {
                                    highlights = highlights.filter(function(highlight) {
                                        return highlight !== data.highlight_id;
                                    });
                                }

                                listComponent.updateItem(data.item_id, {highlights: highlights});
                            }
                        });

                        scope.$on('item:unlock', function(_e, data) {
                            listComponent.updateItem(data.item, {
                                lock_user: null,
                                lock_session: null,
                                lock_time: null
                            });
                        });

                        scope.$on('multi:reset', function(e, data) {
                            var itemsById = angular.extend({}, listComponent.state.itemsById);
                            var ids = data.ids || [];
                            ids.forEach(function(id) {
                                itemsById[id] = angular.extend({}, itemsById[id], {
                                    selected: false
                                });
                            });

                            listComponent.setState({itemsById: itemsById});
                        });
                    });
                }
            };
        }]);
})();
