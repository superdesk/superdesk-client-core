import {intersection} from 'lodash';
import {appConfig} from 'appConfig';

SearchController.$inject = ['$location', 'searchProviderService'];
export function SearchController($location, searchProviderService) {
    const SUPERDESK = 'local';
    const INTERNAL = ['archive', 'published', 'ingest', 'archived'];
    const DEFAULT_CONFIG = Object.assign({}, {
        ingest: true,
        archive: true,
        published: true,
        archived: true,
        search: SUPERDESK,
    }, appConfig.defaultSearch);

    this.hideNested = appConfig.features.nestedItemsInOutputStage;

    const getActiveRepos = () => INTERNAL.filter((name) => this.repo[name]);
    const resetInternalRepo = () => this.repo = Object.assign({}, DEFAULT_CONFIG);

    resetInternalRepo();

    // init based on $location
    if ($location.search().repo && !intersection($location.search().repo.split(','), INTERNAL).length) {
        this.repo.search = $location.search().repo;
    }

    // init search providers
    searchProviderService.getActiveSearchProviders()
        .then((providers) => {
            this.providers = providers;

            // init selected/default provider
            if (this.providers.length) {
                const selectedProvider = this.providers.find((provider) =>
                    provider.search_provider === $location.search().repo || provider._id === $location.search().repo,
                );
                const defaultProvider = $location.search().repo === undefined &&
                                        this.providers.find((provider) => provider.is_default);

                this.activeProvider = selectedProvider || defaultProvider;
                if (this.activeProvider) {
                    this.toggleProvider(this.activeProvider);
                    return;
                }
            }

            // internal search - init repos
            const repos = ($location.search().repo || '').split(',').filter((repo) => !!repo);

            INTERNAL.forEach((repo) => {
                this.repo[repo] = repos.length === 0 ? DEFAULT_CONFIG[repo] : repos.indexOf(repo) >= 0;
            });
        });

    /**
     * Toggle internal repo
     * @param {string} repoName
     */
    this.toggleRepo = (repoName) => {
        this.repo[repoName] = !this.repo[repoName];
        let active = getActiveRepos();

        if (active.length === 0) {
            // if no active repo then reset the state of the all repo buttons to active.
            resetInternalRepo();
            active = getActiveRepos();
        }

        $location.search('repo', active.join(','));
    };

    /**
     * Toggle search provider
     * @param {Object} provider
     */
    this.toggleProvider = (provider) => {
        this.activeProvider = provider || null;
        this.providerType = provider ? provider.search_provider : null;
        if (provider) {
            $location.search('repo', provider._id);
            this.repo = {search: provider._id};
        } else {
            $location.search('repo', '');
            resetInternalRepo();
        }
    };
}
