import { getLanguage } from './actions.js';
import About from './components/About';
import RequestAccount from './components/RequestAccount';

/**
The init function of Mist

@method mistInit
*/
mistInit = () => {
    console.info('Initialise Mist Interface');

    EthBlocks.init();
    const ethBlocksInterval = setInterval(() => {
        if (_.isEmpty(EthBlocks.latest)) {
            EthBlocks.init();
        } else {
            clearInterval(ethBlocksInterval);
        }
    }, 500);

    Tabs.onceSynced.then(() => {
        if (location.search.indexOf('reset-tabs') >= 0) {
            console.info('Resetting UI tabs');

            Tabs.remove({});
        }

        if (!Tabs.findOne('browser')) {
            console.debug('Insert tabs');

            Tabs.insert({
                _id: 'browser',
                url: 'https://ethereum.org',
                redirect: 'https://ethereum.org',
                position: 0
            });
        } else {
            Tabs.upsert(
                { _id: 'browser' },
                {
                    $set: { position: 0 }
                }
            );
        }

        // overwrite wallet on start again, but use $set to dont remove titles
        Tabs.upsert(
            { _id: 'wallet' },
            {
                $set: {
                    url: 'https://wallet.ethereum.org',
                    redirect: 'https://wallet.ethereum.org',
                    position: 1,
                    permissions: {
                        admin: true
                    }
                }
            });

        // Sets browser as default tab if:
        // 1) there's no record of selected tab
        // 2) data is corrupted (no saved tab matches localstore)
        if (!LocalStore.get('selectedTab') || !Tabs.findOne(LocalStore.get('selectedTab'))) {
            LocalStore.set('selectedTab', 'wallet');
        }
    });
};

function renderReactComponent(locationHash) {
    // NOTE: when adding new React components, remember to skip meteor template in templates/index.js

    // Example hash: '#about'. Manipulate string to return 'About'.
    const componentName = locationHash.charAt(1).toUpperCase() + locationHash.slice(2);
    console.log('∆∆∆ componentName', componentName);

    // JSX can't evaluate an expression or string, so map imported components here
    const components = {
        About,
        RequestAccount,
    };

    // Only render a component if it exists
    if (!!components[componentName]) {
        const Component = components[componentName];

        render(<Component />, document.getElementById('react-entry'));
    }
}

Meteor.startup(() => {
    console.info('Meteor starting up...');

    // TODO: update language when redux updates
    // 18n.changeLanguage(lang);

    if (!location.hash) {  // Main window
        EthAccounts.init();
        mistInit();
    }

    renderReactComponent(location.hash);

    store.dispatch(getLanguage());

    // change moment and numeral language, when language changes
    Tracker.autorun(() => {
        if (_.isString(TAPi18n.getLanguage())) {
            const lang = TAPi18n.getLanguage().substr(0, 2);
            moment.locale(lang);
            try {
                numeral.language(lang);
            } catch (err) {
                console.warn(`numeral.js couldn't set number formating: ${err.message}`);
            }
            EthTools.setLocale(lang);
        }
    });
});
