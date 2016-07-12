(function() {
    'use strict';

    var DEFAULT_LIST_CONFIG = {
        'priority': [
            'priority',
            'urgency'
        ],
        'firstLine': [
            'wordcount',
            'slugline',
            'highlights',
            'headline',
            'versioncreated'
        ],
        'secondLine': [
            'profile',
            'state',
            'embargo',
            'update',
            'takekey',
            'takepackage',
            'signal',
            'broadcast',
            'flags',
            'updated',
            'category',
            'provider',
            'expiry',
            'desk'
        ]
    };

    /**
     * Monitoring state - keeps information required to render lists.
     */
    MonitoringState.$inject = ['$q', '$rootScope', 'ingestSources', 'desks', 'highlightsService', 'content', 'metadata'];
    function MonitoringState($q, $rootScope, ingestSources, desks, highlightsService, content, metadata) {
        this.init = init;
        this.state = {};
        this.setState = setState;
        this.moveActiveGroup = moveActiveGroup;

        // reset state on every page change
        $rootScope.$on('$routeChangeSuccess', reset);

        var self = this;
        var ready;

        /**
         * Update state
         *
         * @param {Object} updates
         */
        function setState(updates) {
            self.state = angular.extend({}, self.state, updates);
        }

        /**
         * Reset monitoring state
         */
        function reset() {
            self.state = {};
            ready = null;
        }

        /**
         * Init state for react rendering
         */
        function init() {
            if (!ready) {
                ready = $q.all({
                    ingestProvidersById: ingestSources.initialize().then(function() {
                        setState({ingestProvidersById: ingestSources.providersLookup});
                    }),
                    desksById: desks.initialize().then(function() {
                        setState({desksById: desks.deskLookup});
                    }),
                    highlightsById: highlightsService.get().then(function(result) {
                        var highlightsById = {};
                        result._items.forEach(function(item) {
                            highlightsById[item._id] = item;
                        });
                        setState({highlightsById: highlightsById});
                    }),
                    profilesById: content.getTypesLookup().then(function(profilesLookup) {
                        setState({profilesById: profilesLookup});
                    }),

                    // populates cache for mark for highlights activity dropdown
                    deskHighlights: highlightsService.get(desks.getCurrentDeskId()),

                    metadata: metadata.initialize()
                });
            }

            return ready;
        }

        /**
         * Move active group up/down
         *
         * @param {Integer} diff
         */
        function moveActiveGroup(diff) {
            var groups = self.state.groups;
            var next = groups.indexOf(self.state.activeGroup) + diff;
            if (next >= groups.length) {
                next = 0;
            } else if (next < 0) {
                next = groups.length - 1;
            }

            setState({activeGroup: groups[next]});
        }
    }

    angular.module('superdesk.search.react', [
        'superdesk.highlights',
        'superdesk.datetime',
        'superdesk.authoring.metadata'
    ])
        .service('monitoringState', MonitoringState)
        .directive('sdItemsList', [
            '$location',
            '$timeout',
            '$injector',
            '$filter',
            'packages',
            'asset',
            'api',
            'search',
            'session',
            'datetime',
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
            'monitoringState',
            'authoringWorkspace',
            'gettextCatalog',
            '$rootScope',
            'config',
            '$interpolate',
            'metadata',
        function(
            $location,
            $timeout,
            $injector,
            $filter,
            packages,
            asset,
            api,
            search,
            session,
            datetime,
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
            highlightsService,
            monitoringState,
            authoringWorkspace,
            gettextCatalog,
            $rootScope,
            config,
            $interpolate,
            metadata
        ) {

            var listConfig = config.list || DEFAULT_LIST_CONFIG;

            function getSpecStyle(spec) {
                var style = {};

                if (spec.color) {
                    style.backgroundColor = spec.color;
                }

                return style;
            }

            function getSpecTitle(spec, title) {
                return spec.name || title;
            }

            function getSpecValue(spec, value) {
                return spec.short || value;
            }

            var ItemPriority = function(props) {
                var priority = props.priority || 3;
                var spec = metadata.priorityByValue(priority);

                if (spec) {
                    return React.createElement(
                        'span',
                        {
                            className: 'priority-label priority-label--' + priority,
                            style: getSpecStyle(spec),
                            title: getSpecTitle(spec, gettext('Priority')),
                            key: 'priority'
                        },
                        getSpecValue(spec, priority)
                    );
                }

                return React.createElement(
                    'span',
                    {className: 'priority-label priority-label--' + priority, title: gettext('Priority'), key: 'priority'},
                    priority
                );
            };

            var ItemUrgency = function(props) {
                var urgency = props.urgency || 3;
                var spec = metadata.urgencyByValue(urgency);

                if (spec) {
                    return React.createElement(
                        'span',
                        {
                            className: 'urgency-label urgency-label--' + urgency,
                            title: getSpecTitle(spec, gettextCatalog.getString('Urgency')),
                            style: getSpecStyle(spec),
                            key: 'urgency'
                        },
                        getSpecValue(spec, urgency)
                    );
                }

                return React.createElement(
                    'span',
                    {className: 'urgency-label urgency-label--' + urgency, title: gettextCatalog.getString('Urgency'), key: 'urgency'},
                    urgency
                );
            };

            return {
                link: function(scope, elem) {

                    elem.attr('tabindex', 0);

                    var menuHolderElem = document.getElementById('react-placeholder');
                    var closeActionsMenu = function() {
                        ReactDOM.unmountComponentAtNode(menuHolderElem);
                    };

                    var getViewType = function() {
                        return scope.viewType;
                    };

                    var groupId = scope.$id;
                    var groups = monitoringState.state.groups || [];
                    monitoringState.setState({
                        groups: groups.concat(scope.$id),
                        activeGroup: monitoringState.state.activeGroup || groupId
                    });

                    scope.$watch(function() {
                        return monitoringState.state.activeGroup;
                    }, function(activeGroup) {
                        if (activeGroup === groupId) {
                            elem.focus();
                        }
                    });

                    /**
                     * Render element close to target, but append to body
                     *
                     * Used for dropdown menus that would be only partialy visible if rendered
                     * within parent which has overflow: hidden that is required for scrolling
                     *
                     * @param {Object} elem React element
                     * @param {Node} target DOM node
                     */
                    function renderToBody(elem, target) {
                        // first render it somewhere not visible
                        menuHolderElem.style.zIndex = -1;
                        var node = ReactDOM.findDOMNode(ReactDOM.render(elem, menuHolderElem));
                        // make sure it's rendered
                        node.style.display = 'block';
                        var rect = node.getBoundingClientRect();
                        var width = rect.width;
                        var height = rect.height;

                        var ACTION_MENU_FROM_TOP = 150; // 150 = top-menu + search bar
                        var MENU_MARGIN_HEIGHT = 16;
                        var LEFT_BAR_WIDTH = 48;
                        var BOTTOM_BAR_HEIGHT = 30;
                        var BUFFER = 5;

                        // get target position
                        var targetRect = target.getBoundingClientRect();

                        // get workspace
                        var workspace = document.getElementById('main-container');

                        // compute menu position
                        var top = targetRect.top + targetRect.height;
                        var left = targetRect.left + targetRect.width - width;

                        // menu goes off on the right side
                        if (left + width + BUFFER > workspace.clientWidth) {
                            left -= width;
                            left += targetRect.width;
                        }

                        // menu goes off on the left side
                        if (left - LEFT_BAR_WIDTH < 0) {
                            left = targetRect.left;
                        }

                        // menu goes out on the bottom side
                        if (top + height + BOTTOM_BAR_HEIGHT + BUFFER > workspace.clientHeight) {
                            top -= height;
                            top -= targetRect.height;
                            top -= MENU_MARGIN_HEIGHT;
                            top = top < ACTION_MENU_FROM_TOP ? ACTION_MENU_FROM_TOP : top;
                        }

                        node.style.top = top.toFixed() + 'px';
                        node.style.left = left.toFixed() + 'px';
                        node.style.position = 'absolute';
                        menuHolderElem.style.zIndex = 1000;
                    }

                    /**
                     * Test if an item has thumbnail
                     *
                     * @return {Boolean}
                     */
                    function hasThumbnail(item) {
                        return item.renditions && item.renditions.thumbnail;
                    }

                    /**
                     * Test if an multi-selection allowed
                     *
                     * @return {Boolean}
                     */
                    function isCheckAllowed(item) {
                        return !(item.state === 'killed' || (item._type === 'published' && !item.last_published_version));
                    }

                    /**
                     * Time element
                     */
                    var TimeElem = function(props) {
                        return React.createElement(
                            'time',
                            {title: datetime.longFormat(props.date)},
                            datetime.shortFormat(props.date)
                        );
                    };

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
                            if (isCheckAllowed(this.props.item))
                            {
                                var selected = !this.props.item.selected;
                                this.props.onMultiSelect(this.props.item, selected);
                            }
                        },

                        render: function() {
                            if (this.props.item.selected) {
                                this.props.item.selected = isCheckAllowed(this.props.item);
                            }
                            return React.createElement(
                                'div',
                                {className: 'selectbox', title: isCheckAllowed(this.props.item) ? null : 'selection not allowed',
                                    onClick: this.toggle},
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
                                    if (item._type === 'archived') {
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
                        var source = item.source ? item.source :
                            (props.ingestProvider ? props.ingestProvider.source : '');
                        if (source) {
                            meta.push(
                                React.createElement('dt', {key: 1}, gettextCatalog.getString('source')),
                                React.createElement('dd', {key: 2, className: 'provider'}, source)
                            );
                        }

                        meta.push(
                            React.createElement('dt', {key: 3}, gettextCatalog.getString('updated')),
                            React.createElement('dd', {key: 4}, datetime.shortFormat(item.versioncreated))
                        );

                        if (item.is_spiked) {
                            meta.push(React.createElement('dt', {key: 5}, gettextCatalog.getString('expires')));
                            meta.push(React.createElement('dd', {key: 6}, datetime.shortFormat(item.expiry)));
                        }

                        var info = [];
                        var flags = item.flags || {};

                        info.push(React.createElement(
                            'h5',
                            {key: 1},
                            item.headline || item.slugline || item.type
                        ));

                        info.push(React.createElement(
                            'dl',
                            {key: 2},
                            meta
                        ));

                        if (flags.marked_for_legal) {
                            info.push(React.createElement(
                                'div',
                                {key: 3, className: 'state-label legal'},
                                gettext('Legal')
                            ));
                        }

                        if (item.archived) {
                            info.push(React.createElement(
                                'div',
                                {className: 'fetched-desk', key: 4},
                                React.createElement(FetchedDesksInfo, {item: item})
                            ));
                        }

                        return React.createElement('div', {className: 'media-info'}, info);
                    };

                    /**
                     * Type icon component
                     */
                    var TypeIcon = function(props) {
                        if (props.package_type) {
                            return React.createElement('i', {className: 'filetype-icon-takes-pack'});
                        } else if (props.type === 'composite' && props.highlight) {
                            return React.createElement('i', {className: 'filetype-icon-highlight-pack'});
                        } else {
                            return React.createElement('i', {className: 'filetype-icon-' + props.type});
                        }
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
                                    React.createElement(
                                        TypeIcon,
                                        {type: this.props.item.type,
                                        package_type: this.props.item.package_type,
                                        highlight: this.props.item.highlight}
                                    )
                            );
                        }
                    });

                    var ListPriority = function(props) {
                        var css = {className: 'list-field urgency'};
                        return renderArea('priority', props, css) || React.createElement('div', css);
                    };

                    var HighlightsList = React.createClass({
                        removeHighlight: function(highlight) {
                            return function(event) {
                                event.stopPropagation();
                                highlightsService.markItem(highlight._id, this.props.item);

                                if (getViewType() === 'highlights' && this.props.item.highlights.length === 1) {
                                    $rootScope.$broadcast('multi:remove', this.props.item._id);
                                }
                            }.bind(this);
                        },

                        componentDidMount: function() {
                            this.timeout = null;
                        },

                        componentWillUnmount: function() {
                            this.stopTimeout();
                        },

                        stopTimeout: function() {
                            this.timeout = $timeout.cancel(this.timeout);
                        },

                        close: function() {
                            this.timeout = $timeout(closeActionsMenu, 2000, false);
                        },

                        render: function() {
                            var highlights = this.props.highlights;
                            var highlightsById = this.props.highlightsById || {};

                            var createHighlight = function(id) {
                                var highlight = highlightsById[id];
                                if (highlight) {
                                    return React.createElement(
                                        'li',
                                        {key: 'item-highlight-' + highlight._id},
                                        highlight.name,
                                        highlightsService.hasMarkItemPrivilege() ? React.createElement(
                                            'button',
                                            {className: 'btn btn-mini', onClick: this.removeHighlight(highlight)},
                                            gettext('REMOVE')
                                        ):null
                                    );
                                }
                            }.bind(this);

                            var items = [
                                React.createElement(
                                    'li',
                                    {key: 'item-highlight-label'},
                                    React.createElement(
                                        'div',
                                        {className: 'menu-label'},
                                        gettext('Marked For')
                                    ),
                                    React.createElement(
                                        'button',
                                        {className: 'close-button', onClick: closeActionsMenu},
                                        React.createElement(
                                            'i',
                                            {className: 'icon-close-small icon-white'}
                                        )
                                    )
                                )
                            ];

                            return React.createElement(
                                'ul',
                                {
                                    className: 'dropdown dropdown-menu highlights-list-menu open',
                                    onMouseEnter: this.stopTimeout,
                                    onMouseLeave: this.close
                                },
                                items.concat(highlights.map(createHighlight))
                            );
                        }
                    });

                    var HighlightsInfo = React.createClass({
                        toggle: function(event) {
                            if (event) {
                                event.stopPropagation();
                            }

                            closeActionsMenu();
                            this.renderDropdown();
                        },

                        /**
                         * Checks if the given item is in the daterange of the highlights
                         * for every highlight given
                         *
                         * @param {array} highlights
                         * @param {Object} item
                         * @return {Object}
                         */
                        getHighlightStatuses: function(highlights, item) {
                            var highlightStatuses = {};
                            var highlightsById = this.props.highlightsById;
                            _.forEach(highlights, function(highlight) {
                                var hours = $filter('hoursFromNow')(item.versioncreated);
                                highlightStatuses[highlight] = highlightsService.isInDateRange(highlightsById[highlight], hours);
                            });

                            return highlightStatuses;
                        },

                        getHighlights: function() {
                            var itemHighlights = [];
                            if (isCheckAllowed(this.props.item)) {
                                if (this.props.item.archive_item && this.props.item.archive_item.highlights &&
                                    this.props.item.archive_item.highlights.length) {
                                    itemHighlights = this.props.item.archive_item.highlights;
                                } else {
                                    itemHighlights = this.props.item.highlights || [];
                                }
                            }

                            return itemHighlights;
                        },

                        render: function() {
                            var highlights = this.getHighlights();

                            var hasActiveHighlight = (function() {
                                var statuses = this.getHighlightStatuses(highlights, this.props.item);

                                if ($location.path() === '/workspace/highlights') {
                                    return statuses[$location.search().highlight];
                                }

                                return highlights.some(function(h) {
                                    return statuses[h];
                                });
                            }).call(this);

                            return React.createElement(
                                'div',
                                {
                                    className: 'highlights-box',
                                    onClick: this.toggle
                                },
                                highlights.length ? React.createElement(
                                    'div',
                                    {className: 'highlights-list dropdown'},
                                    React.createElement(
                                        'button',
                                        {className: 'dropdown-toggle'},
                                        React.createElement('i', {
                                            className: classNames({
                                                'icon-star': highlights.length === 1,
                                                'icon-multi-star': highlights.length > 1,
                                                'red': hasActiveHighlight
                                            })
                                        })
                                    )
                                ) : null
                            );
                        },

                        renderDropdown: function() {
                            var elem = React.createElement(HighlightsList, {
                                item: this.props.item,
                                highlights: this.getHighlights(),
                                highlightsById: this.props.highlightsById
                            });

                            var icon = ReactDOM.findDOMNode(this).getElementsByClassName('icon-star')[0] ||
                            ReactDOM.findDOMNode(this).getElementsByClassName('icon-multi-star')[0];

                            renderToBody(elem, icon);
                        }
                    });

                    var closeTimeout;
                    var DesksDropdown = React.createClass({
                        getInitialState: function() {
                            return {open: false};
                        },

                        close: function (cancel) {
                            if (cancel === true && closeTimeout) {
                                $timeout.cancel(closeTimeout);
                            } else {
                                closeTimeout = $timeout(function() {
                                    closeActionsMenu();
                                }, 200, false);
                            }
                        },

                        toggle: function (event) {
                            if (event) {
                                event.stopPropagation();
                            }

                            this.close(true);
                            this.renderDropdown();
                        },

                        render: function () {
                            return React.createElement('dd',
                                    {className: 'dropdown dropup more-actions'},
                                    React.createElement('button', {
                                        className: 'dropdown-toggle',
                                        onMouseOver: this.toggle,
                                        onMouseLeave: this.close
                                    },
                                    React.createElement('i',
                                            {className: 'icon-dots'})
                                    ));
                        },

                        renderDropdown: function () {
                            var desks = this.props.desks.map(function (desk, index) {
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

                            var elem = React.createElement('div',
                                    {
                                        className: 'dropdown-menu more-activity-menu',
                                        onMouseOver: this.toggle,
                                        onMouseLeave: this.close
                                    },
                                    React.createElement('ul', {}, desks)
                                    );

                            var icon = ReactDOM.findDOMNode(this).getElementsByClassName('dropdown-toggle')[0];

                            renderToBody(elem, icon);
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

                        componentDidUpdate: function(prevProps, prevState) {
                            if (prevProps.item !== this.props.item) {
                                familyService.fetchDesks(this.props.item, false)
                                .then(function(fetchedDesks) {
                                    this.setState({desks: fetchedDesks});
                                }.bind(this));
                            }
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
                        return React.createElement(
                            'div',
                            {className: 'item-info'},
                            renderArea('firstLine', props, {className: 'line'}),
                            renderArea('secondLine', props, {className: 'line'})
                        );
                    };

                    function renderArea(area, itemProps, props) {
                        var specs = listConfig[area] || [];
                        var contents = specs.map(function(field) {
                            if (fields[field]) {
                                return fields[field](itemProps);
                            } else {
                                console.warn('missing field in list: ' + field);
                            }
                        }).filter(angular.identity);
                        var elemProps = angular.extend({key: area}, props);
                        return contents.length ? React.createElement('div', elemProps, contents) : null;
                    }

                    /**
                     * Fields specified via list config
                     */
                    var fields = {
                        headline: function(props) {
                            return React.createElement(
                                'span',
                                {className: 'item-heading', key: 'headline'},
                                props.item.headline ?
                                    props.item.headline.substr(0, 90) :
                                    props.item.type
                            );
                        },

                        slugline: function(props) {
                            if (props.item.slugline) {
                                return React.createElement(
                                    'span',
                                    {className: 'keyword', key: 'slugline'},
                                    props.item.slugline.substr(0, 40)
                                );
                            }
                        },

                        wordcount: function(props) {
                            return React.createElement(
                                'span',
                                {className: 'word-count', key: 'wordcount'},
                                props.item.word_count
                            );
                        },

                        highlights: function(props) {
                            return React.createElement(HighlightsInfo, angular.extend({key: 'highlights'}, props));
                        },

                        versioncreated: function(props) {
                            return React.createElement(
                                TimeElem,
                                {date: props.item.versioncreated, key: 'versioncreated'}
                            );
                        },

                        profile: function(props) {
                            if (props.item.profile) {
                                return React.createElement(
                                    'div',
                                    {className: 'label label--' + props.item.profile, key: 'profile'},
                                    props.profilesById[props.item.profile] ?
                                        props.profilesById[props.item.profile].label :
                                        props.item.profile
                                );
                            }
                        },

                        state: function(props) {
                            return React.createElement(
                                'span',
                                {
                                    title: $filter('removeLodash')(props.item.state),
                                    className: 'state-label state-' + props.item.state,
                                    key: 'state'
                                },
                                $filter('removeLodash')(gettextCatalog.getString(props.item.state))
                            );
                        },

                        embargo: function(props) {
                            if (props.item.embargo) {
                                return React.createElement(
                                    'span',
                                    {className: 'state-label state_embargo', title: gettext('embargo'), key: 'embargo'},
                                    gettext('embargo')
                                );
                            }
                        },

                        update: function(props) {
                            if (props.item.correction_sequence) {
                                return React.createElement(
                                    'div',
                                    {className: 'provider', key: 'update', title: gettextCatalog.getString('correction sequence')},
                                    $interpolate(gettextCatalog.getString('Update {{ seq }}'))({seq: props.item.correction_sequence})
                                );
                            }
                        },

                        updated: function(props) {

                            var selectUpdate = function(event) {
                                event.stopPropagation();
                                props.selectUpdate();
                            };

                            if (props.item.rewritten_by) {
                                return React.createElement(
                                    'div',
                                    {className: 'state-label updated', key: 'updated', onClick: selectUpdate},
                                    gettextCatalog.getString('Updated')
                                );
                            }
                        },

                        takekey: function(props) {
                            if (props.item.anpa_take_key) {
                                return React.createElement('div', {className: 'takekey', key: 'takekey'},
                                    gettextCatalog.getString(props.item.anpa_take_key));
                            }
                        },

                        signal: function(props) {
                            if (props.item.signal) {
                                return React.createElement('span', {className: 'signal', key: 'signal'}, props.item.signal);
                            }
                        },

                        broadcast: function(props) {
                            var broadcast = props.item.broadcast || {};
                            if (broadcast.status) {
                                return React.createElement(
                                    'span',
                                    {className: 'broadcast-status', title: broadcast.status, key: 'broadcast'},
                                    '!'
                                );
                            }
                        },

                        flags: function(props) {
                            var flags = props.item.flags || {};
                            var elems = [
                                flags.marked_for_not_publication ?
                                    React.createElement(
                                        'div', {
                                            className: 'state-label not-for-publication',
                                            title: gettext('Not For Publications'),
                                            key: 'not-for-publication'
                                        }, gettext('Not For Publications'))
                                    : null,
                                flags.marked_for_legal ?
                                    React.createElement(
                                        'div', {
                                            className: 'state-label legal',
                                            title: gettext('Legal'),
                                            key: 'legal'
                                        }, gettext('Legal'))
                                    : null,
                                flags.marked_for_sms ?
                                    React.createElement(
                                        'div', {
                                            className: 'state-label sms',
                                            key: 'sms'},
                                        gettext('Sms'))
                                    : null
                            ].filter(angular.identity);
                            return elems.length ? React.createElement('div', {key: 'flags'}, elems) : null;
                        },

                        takepackage: function(props) {
                            var item = props.item;
                            var isTake = _.contains(['text'], item.type) && item.takes && item.takes.sequence > 1;

                            var selectTakesPackage = function(event) {
                                event.stopPropagation();
                                props.selectTakesPackage();
                            };

                            if (isTake) {
                                return React.createElement(
                                    'div',
                                    {className: 'state-label takes', onClick: selectTakesPackage, key: 'takepackage'},
                                    gettext('Takes')
                                );
                            }
                        },

                        category: function(props) {
                            var anpa = props.item.anpa_category || {};
                            if (anpa.name) {
                                return React.createElement('div', {className: 'category', key: 'category'}, anpa.name);
                            }
                        },

                        provider: function(props) {
                            var provider = props.item.source ?
                                props.item.source
                                : (props.ingestProvider ? props.ingestProvider.source : '');
                            if (provider) {
                                return React.createElement('span', {className: 'provider', key: 'provider'}, provider);
                            }
                        },

                        expiry: function(props) {
                            if (props.item.is_spiked) {
                                return React.createElement(
                                    'div',
                                    {className: 'expires', key: 'expiry'},
                                    gettext('expires') + ' ' + datetime.shortFormat(props.item.expiry)
                                );
                            }
                        },

                        desk: function(props) {
                            if (props.item.archived) {
                                return React.createElement(FetchedDesksInfo, {item: props.item, key: 'desk'});
                            } else {
                                return React.createElement(ItemContainer, {item: props.item, desk: props.desk, key: 'desk'});
                            }
                        },

                        priority: function(props) {
                            return props.item.priority ?
                                React.createElement(ItemPriority, angular.extend({key: 'priority'}, props.item))
                                : null;
                        },

                        urgency: function(props) {
                            return props.item.urgency ?
                                React.createElement(ItemUrgency, angular.extend({key: 'urgency'}, props.item))
                                : null;
                        }
                    };

                    var ActionsMenu = React.createClass({
                        toggle: function(event) {
                            this.stopEvent(event);
                            closeActionsMenu();
                            var icon = ReactDOM.findDOMNode(this)
                                .getElementsByClassName('icon-dots-vertical')[0];

                            renderToBody(this.renderMenu(), icon);
                        },

                        stopEvent: function(event) {
                            event.stopPropagation();
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

                        renderMenu: function() {
                            var menu = [];
                            var item = this.props.item;

                            var createAction = function(activity) {
                                return React.createElement(ActionsMenu.Item, {
                                    item: item,
                                    activity: activity,
                                    key: activity._id
                                });
                            }.bind(this);

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

                            return React.createElement(
                                'ul',
                                {
                                    className: 'dropdown dropdown-menu more-activity-menu open',
                                    style: {display: 'block', minWidth: 200}
                                },
                                menu
                            );
                        },

                        render: function() {
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
                                            onDoubleClick: this.stopEvent
                                        },
                                        React.createElement('i', {className: 'icon-dots-vertical'})
                                    )
                                )
                            );
                        }
                    });

                    ActionsMenu.Label = function(props) {
                        return React.createElement(
                            'li',
                            null,
                            React.createElement('div', {className: 'menu-label'}, gettextCatalog.getString(props.label),
                                props.label === 'Actions' ? React.createElement(
                                    'button',
                                    {className: 'close-button', onClick: closeActionsMenu},
                                    React.createElement(
                                        'i',
                                        {className: 'icon-close-small'}
                                    )
                                ) : null
                            )
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
                            scope.$apply(function() {
                                $rootScope.$broadcast('broadcast:preview', {'item': null}); // closes preview if already opened
                                activityService.start(this.props.activity, {data: {item: this.props.item}});
                            }.bind(this));

                            closeActionsMenu();
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

                        closeMenu: function(event) {
                            // called by the onclick event of the submenu dropdown to close actions menu.
                            event.stopPropagation();
                            closeActionsMenu();
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
                                    {onMouseEnter: this.open, onMouseLeave: this.close, onClick: this.closeMenu},
                                    React.createElement(
                                        'div',
                                        {className: 'dropdown dropdown-noarrow' + (this.state.open ? ' open' : '')},
                                        React.createElement(
                                            'a',
                                            {className: 'dropdown-toggle', title: gettextCatalog.getString(activity.label)},
                                            activity.icon ? React.createElement('i', {className: 'icon-' + activity.icon}, '') : null,
                                            gettextCatalog.getString(activity.label),
                                            React.createElement('i', {className: 'icon-chevron-right-thin submenu-icon'})
                                        ),
                                        this.state.open ? $injector.invoke(activity.dropdown, activity, {
                                            item: this.props.item,
                                            className: 'dropdown-menu right-submenu upward',
                                            translatedLabel: gettextCatalog.getString('No available highlights')
                                        }) : null
                                    )
                                );
                            } else {
                                return React.createElement(
                                    'li',
                                    null,
                                    React.createElement(
                                        'a',
                                        {title: gettextCatalog.getString(activity.label), onClick: this.run},
                                        React.createElement('i', {className: 'icon-' + activity.icon}),
                                        React.createElement('span', {style: {display: 'inline'}}, gettextCatalog.getString(activity.label))
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
                            React.createElement('p', {className: 'message'},
                            gettextCatalog.getString('There was an error archiving this item')),
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
                            if (!this.props.item.gone) {
                                this.props.onSelect(this.props.item);
                            }
                        },

                        selectTakesPackage: function() {
                            this.props.onSelect(this.props.item.takes);
                        },

                        selectUpdate: function() {
                            authoringWorkspace.edit({_id: this.props.item.rewritten_by}, 'view');
                        },

                        edit: function(event) {
                            if (!this.props.item.gone) {
                                this.props.onEdit(this.props.item);
                            }
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

                        componentDidUpdate: function() {
                            if (this.props.flags.selected) {
                                var elem = ReactDOM.findDOMNode(this);
                                var list = elem.offsetParent;
                                var factor = this.props.view === 'mgrid' ? 1 : 3;

                                if (elem.offsetTop < list.scrollTop) {
                                    // move up
                                    if (list.scrollTop - elem.offsetTop <= elem.clientHeight) {
                                        // only a bit
                                        list.scrollTop -= elem.clientHeight * factor;
                                    } else {
                                        // we need more, put it on top
                                        list.scrollTop = elem.offsetTop;
                                    }
                                }

                                if (elem.offsetTop + elem.offsetHeight > list.scrollTop + list.clientHeight) {
                                    // move down
                                    if (elem.offsetTop + elem.offsetHeight - list.scrollTop - list.clientHeight <= elem.clientHeight) {
                                        // only a bit
                                        list.scrollTop += elem.clientHeight * factor;
                                    } else {
                                        // put it on top
                                        list.scrollTop = elem.offsetTop;
                                    }
                                }

                                this.props.setSelectedComponent(this);
                            }
                        },

                        render: function() {
                            var item = this.props.item;
                            var contents = [
                                'div',
                                {
                                    className: classNames(
                                        'media-box',
                                        'media-' + item.type,
                                        {
                                            locked: item.lock_user && item.lock_session,
                                            selected: this.props.flags.selected,
                                            archived: item.archived || item.created,
                                            gone: item.gone
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
                                    item.priority ? React.createElement(ItemPriority, item) : null,
                                    item.urgency ? React.createElement(ItemUrgency, item) : null,
                                    fields.broadcast({item: item}),
                                    this.state.hover && !item.gone ? React.createElement(ActionsMenu, {item: item}) : null
                                );
                            } else {
                                contents.push(
                                    React.createElement('span', {className: 'state-border'}),
                                    React.createElement(ListTypeIcon, {
                                        item: item,
                                        onMultiSelect: this.props.onMultiSelect
                                    }),
                                    (item.priority || item.urgency) ? React.createElement(ListPriority, {item: item}) : null,
                                    React.createElement(ListItemInfo, {
                                        item: item,
                                        selectTakesPackage: this.selectTakesPackage,
                                        selectUpdate: this.selectUpdate,
                                        desk: this.props.desk,
                                        ingestProvider: this.props.ingestProvider,
                                        highlightsById: this.props.highlightsById,
                                        profilesById: this.props.profilesById
                                    }),
                                    this.state.hover && !item.gone ? React.createElement(ActionsMenu, {item: item}) : null
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
                                    onDoubleClick: this.edit,
                                    draggable: true,
                                    tabIndex: '0'
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
                            var itemId = search.generateTrackByIdentifier(item);
                            var itemsById = angular.extend({}, this.state.itemsById);
                            itemsById[itemId] = angular.extend({}, item, {selected: selected});
                            this.setState({itemsById: itemsById});
                            scope.$applyAsync(function() {
                                multi.toggle(itemsById[itemId]);
                            });
                        },

                        select: function(item) {
                            this.setSelectedItem(item);
                            $timeout.cancel(this.updateTimeout);
                            this.updateTimeout = $timeout(function() {
                                if (item && scope.preview) {
                                    scope.$apply(function() {
                                        scope.preview(item);
                                    });
                                }
                            }, 500, false);
                        },

                        edit: function(item) {
                            this.setSelectedItem(item);
                            $timeout.cancel(this.updateTimeout);
                            if (item && scope.edit) {
                                scope.$apply(function() {
                                    scope.edit(item);
                                });
                            } else if (item) {
                                scope.$apply(function() {
                                    authoringWorkspace.open(item);
                                });
                            }
                        },

                        updateAllItems: function(itemId, changes) {
                            var itemsById = angular.extend({}, this.state.itemsById);
                            _.forOwn(itemsById, function(value, key) {
                                if (_.startsWith(key, itemId)) {
                                    itemsById[key] = angular.extend({}, value, changes);
                                }
                            });

                            this.setState({itemsById: itemsById});
                        },

                        findItemByPrefix: function(prefix) {
                            var item;

                            _.forOwn(this.state.itemsById, function(val, key) {
                                if (_.startsWith(key, prefix)) {
                                    item = val;
                                }
                            });

                            return item;
                        },

                        setSelectedItem: function(item) {
                            this.setState({selected: item ? search.generateTrackByIdentifier(item) : null});
                        },

                        getSelectedItem: function() {
                            var selected = this.state.selected;
                            return this.state.itemsById[selected];
                        },

                        updateItem: function(itemId, changes) {
                            var item = this.state.itemsById[itemId] || null;
                            if (item) {
                                var itemsById = angular.extend({}, this.state.itemsById);
                                itemsById[itemId] = angular.extend({}, item, changes);
                                this.setState({itemsById: itemsById});
                            }
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
                                        this.edit(this.getSelectedItem());
                                    }

                                    event.stopPropagation();
                                    return;

                                case Keys.pageup:
                                case Keys.pagedown:
                                    event.preventDefault();
                                    event.stopPropagation();
                                    this.select(); // deselect active item
                                    scope.$applyAsync(function() {
                                        monitoringState.moveActiveGroup(event.keyCode === Keys.pageup ? -1 : 1);
                                    });
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

                        closeActionsMenu: closeActionsMenu,

                        componentWillUnmount: function() {
                            this.closeActionsMenu();
                        },

                        componentWillUpdate: function() {
                            this.closeActionsMenu();
                        },

                        setSelectedComponent: function(com) {
                            this.selectedCom = com;
                        },

                        render: function render() {
                            var createItem = function createItem(itemId) {
                                var item = this.state.itemsById[itemId];
                                var task = item.task || {desk: null};
                                return React.createElement(Item, {
                                    key: itemId,
                                    item: item,
                                    view: this.state.view,
                                    flags: {selected: this.state.selected === itemId},
                                    onEdit: this.edit,
                                    onSelect: this.select,
                                    onMultiSelect: this.multiSelect,
                                    ingestProvider: this.props.ingestProvidersById[item.ingest_provider] || null,
                                    desk: this.props.desksById[task.desk] || null,
                                    highlightsById: this.props.highlightsById,
                                    profilesById: this.props.profilesById,
                                    setSelectedComponent: this.setSelectedComponent
                                });
                            }.bind(this);
                            var isEmpty = !this.state.itemsList.length;
                            return React.createElement(
                                'ul',
                                {
                                    className: classNames(
                                        'list-view',
                                        this.state.view + '-view',
                                        {'list-without-items': isEmpty}
                                    ),
                                    onClick: this.closeActionsMenu,
                                },
                                isEmpty && !scope.loading ?
                                    React.createElement(
                                        'li',
                                        {onClick: this.closeActionsMenu},
                                        gettextCatalog.getString('There are currently no items')
                                    ) : this.state.itemsList.map(createItem)
                            );
                        }
                    });

                    monitoringState.init().then(function() {
                        var itemList = React.createElement(ItemList, monitoringState.state);
                        var listComponent = ReactDOM.render(itemList, elem[0]);

                        /**
                         * Test if item a equals to item b
                         *
                         * @param {Object} a
                         * @param {Object} b
                         * @return {Boolean}
                         */
                        function isSameVersion(a, b) {
                            return a._etag === b._etag && a._current_version === b._current_version &&
                                a._updated === b._updated;
                        }

                        /**
                         * Test if archive_item of a equals to archive_item of b
                         *
                         * @param {Object} a
                         * @param {Object} b
                         * @return {Boolean}
                         */
                        function isArchiveItemSameVersion(a, b) {
                            if (!a.archive_item && !b.archive_item) {
                                return true;
                            }

                            if (a.archive_item && b.archive_item) {

                                if (b.archive_item.takes) {
                                    return false;   //take package of the new item might have changed
                                }

                                return (a.archive_item._current_version === b.archive_item._current_version &&
                                a.archive_item._updated === b.archive_item._updated);
                            }

                            return false;
                        }

                        scope.$watch('items', function(items) {
                            if (!items) {
                                return;
                            }

                            var offsetTop = 0;
                            var itemsList = [];
                            var currentItems = {};
                            var itemsById = angular.extend({}, listComponent.state.itemsById);
                            var selected = listComponent.selectedCom;

                            if (selected) {
                                try {
                                    offsetTop = ReactDOM.findDOMNode(selected).offsetTop;
                                } catch (err) {
                                    selected = null;
                                }
                            }

                            items._items.forEach(function(item) {
                                var itemId = search.generateTrackByIdentifier(item);
                                var oldItem = itemsById[itemId] || null;

                                if (!oldItem || !isSameVersion(oldItem, item) || !isArchiveItemSameVersion(oldItem, item)) {
                                    itemsById[itemId] = angular.extend({}, oldItem, item);
                                }

                                if (!currentItems[itemId]) { // filter out possible duplicates
                                    currentItems[itemId] = true;
                                    itemsList.push(itemId);
                                }
                            });

                            listComponent.setState({
                                itemsList: itemsList,
                                itemsById: itemsById,
                                view: scope.view
                            }, function() {
                                if (selected) {
                                    // maintain selected items position
                                    try {
                                        var selectedNode = ReactDOM.findDOMNode(selected);
                                        elem[0].scrollTop += selectedNode.offsetTop - offsetTop;
                                    } catch (err) {
                                        // pass - selected item is not in list anymore
                                    }
                                }

                                scope.rendering = scope.loading = false;
                            });
                        });

                        scope.$watch('view', function(newValue, oldValue) {
                            if (newValue !== oldValue) {
                                listComponent.setState({view: newValue});
                            }
                        });

                        scope.$on('item:lock', function(_e, data) {
                            var itemId = search.getTrackByIdentifier(data.item, data.item_version);
                            listComponent.updateItem(itemId, {
                                lock_user: data.user,
                                lock_session: data.lock_session,
                                lock_time: data.lock_time
                            });
                        });

                        scope.$on('item:unlock', function(_e, data) {
                            listComponent.updateAllItems(data.item, {
                                lock_user: null,
                                lock_session: null,
                                lock_time: null
                            });
                        });

                        scope.$on('item:expired', function(_e, data) {
                            var itemsById = angular.extend({}, listComponent.state.itemsById);
                            var shouldUpdate = false;
                            _.forOwn(itemsById, function(item, key) {
                                if (data.items[item._id]) {
                                    itemsById[key] = angular.extend({gone: true}, item);
                                    shouldUpdate = true;
                                }
                            });

                            if (shouldUpdate) {
                                listComponent.setState({itemsById: itemsById});
                            }
                        });

                        scope.$on('item:highlight', function(_e, data) {
                            var item = listComponent.findItemByPrefix(data.item_id);
                            if (item) {
                                var itemId = search.generateTrackByIdentifier(item);
                                var highlights = item.highlights || [];
                                if (data.marked) {
                                    highlights = highlights.concat([data.highlight_id]);
                                } else {
                                    highlights = highlights.filter(function(highlight) {
                                        return highlight !== data.highlight_id;
                                    });
                                }

                                listComponent.updateItem(itemId, {highlights: highlights});
                            }
                        });

                        scope.$on('multi:reset', function(e, data) {
                            var ids = data.ids || [];
                            var shouldUpdate = false;
                            var itemsById = angular.extend({}, listComponent.state.itemsById);
                            _.forOwn(itemsById, function(value, key) {
                                ids.forEach(function(id) {
                                    if (_.startsWith(key, id)) {
                                        shouldUpdate = true;
                                        itemsById[key] = angular.extend({}, value, {selected: null});
                                    }
                                });
                            });

                            if (shouldUpdate) {
                                listComponent.setState({itemsById: itemsById});
                            }
                        });

                        var updateTimeout;

                        /**
                         * Function for creating small delay,
                         * before activating render function
                         */
                        function handleScroll($event) {
                            if (scope.rendering) { // ignore
                                $event.preventDefault();
                                return;
                            }

                            // only scroll the list, not its parent
                            $event.stopPropagation();

                            listComponent.closeActionsMenu();
                            $timeout.cancel(updateTimeout);
                            updateTimeout = $timeout(renderIfNeeded, 100, false);
                        }

                        /**
                         * Trigger render in case user scrolls to the very end of list
                         */
                        function renderIfNeeded() {
                            if (!scope.items) {
                                return; // automatic scroll after removing items
                            }

                            if (isListEnd(elem[0]) && !scope.rendering) {
                                scope.rendering = scope.loading = true;
                                scope.fetchNext(listComponent.state.itemsList.length);
                            }
                        }

                        /**
                         * Check if we reached end of the list elem
                         *
                         * @param {Element} elem
                         * @return {Boolean}
                         */
                        function isListEnd(elem) {
                            return elem.scrollTop + elem.offsetHeight + 200 >= elem.scrollHeight;
                        }

                        elem.on('keydown', listComponent.handleKey);
                        elem.on('scroll', handleScroll);

                        // remove react elem on destroy
                        scope.$on('$destroy', function() {
                            elem.off();
                            ReactDOM.unmountComponentAtNode(elem[0]);
                        });
                    });
                }
            };
        }]);
})();
