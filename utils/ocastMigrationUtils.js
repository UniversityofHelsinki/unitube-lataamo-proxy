/**
 * Helpers for Opencast version update changes
 *
 * Opencast version 5 -> 6
 *   - split contributors if multiple found in one string value
 *
 */



const MIGRATION_ACTIVE = true; // whether or not to use the tools

/***
 * Checks contributors attribute from given list of series.
 * Splits contributors to separate contributor entries in contributor list when needed.
 *
 * Example 1
 * ----------------------------------------------------------------------------
 * Input:
 *    contributors : 'joppe', 'duunari', 'grp-best_group_of_all', 'jappu, jummi'
 * Output:
 *    contributors : 'joppe', 'duunari', 'grp-best_group_of_all', 'jappu', 'jummi'
 *
 *
 * Example 2
 * ----------------------------------------------------------------------------
 * Input:
 *    contributors : 'ehpo', 'jahpola', 'grp-best_group_of_all'
 * Output:
 *    contributors : 'ehpo', 'jahpola', 'grp-best_group_of_all'
 *
 *
 * Example 3
 * ----------------------------------------------------------------------------
 * Input:
 *    contributors : 'grp-best_group_of_all, molly, grp-not_so_best', 'gavin'
 * Output:
 *    contributors : 'grp-best_group_of_all', 'molly', 'grp-not_so_best', 'gavin'
 *
 *
 *
 * @param userSeries one series
 * @returns series with modified contributors
 */
exports.splitContributorsFromSeries = (userSeries) => {
    let hackedSeries;

    if (!MIGRATION_ACTIVE) {
        return userSeries;
    }

    try {
        if (userSeries) {
            let resolvedContributors = [];
            for (const contributor of userSeries.contributors){
                if(contributor.includes(',')){
                    // split and trim and concat to existing contributors
                    resolvedContributors =
                        resolvedContributors.concat(contributor.split(',').map(s => s.trim()));
                }else{
                    resolvedContributors.push(contributor);
                }
            }
            let uniqueContributors = [...new Set(resolvedContributors)];
            userSeries.contributors = uniqueContributors;
            hackedSeries = userSeries;
        } else {
            console.log('ERROR splitContributorsFromSeries: userSeries was undefined');
            return {};
        }
    } catch (e) {
        console.log('ERROR splitContributorsFromSeries', e);
        throw Error('Failed to resolve contributors');
    }
    return hackedSeries;
};

/***
 * Checks contributors attribute from given list of series.
 * Splits contributors to separate contributor entries in contributor list when needed.
 *
 * Example 1
 * ----------------------------------------------------------------------------
 * Input:
 *    contributors : 'joppe', 'duunari', 'grp-best_group_of_all', 'jappu, jummi'
 * Output:
 *    contributors : 'joppe', 'duunari', 'grp-best_group_of_all', 'jappu', 'jummi'
 *
 *
 * Example 2
 * ----------------------------------------------------------------------------
 * Input:
 *    contributors : 'ehpo', 'jahpola', 'grp-best_group_of_all'
 * Output:
 *    contributors : 'ehpo', 'jahpola', 'grp-best_group_of_all'
 *
 *
 * Example 3
 * ----------------------------------------------------------------------------
 * Input:
 *    contributors : 'grp-best_group_of_all, molly, grp-not_so_best', 'gavin'
 * Output:
 *    contributors : 'grp-best_group_of_all', 'molly', 'grp-not_so_best', 'gavin'
 *
 *
 *
 * @param userSeries List of series
 * @returns {[]} list of series
 */
exports.splitContributorsFromSeriesList = (listOfSeries) => {
    const hackedSeries = [];

    if (!MIGRATION_ACTIVE) {
        return listOfSeries;
    }

    try {
        if (listOfSeries && Array.isArray(listOfSeries)) {
            for (const series of listOfSeries) {
                let resolvedContributors = [];
                for (const contributor of series.contributors){
                    if(contributor.includes(',')){
                        resolvedContributors =
                            // split and trim and concat to existing contributors
                            resolvedContributors.concat(contributor.split(',').map(s => s.trim()));
                    }else{
                        resolvedContributors.push(contributor);
                    }
                }
                series.contributors = resolvedContributors;
                hackedSeries.push(series);
            }
        } else {
            console.log('ERROR splitContributorsFromSeriesList: listOfSeries was no array');
            return [];
        }
    } catch (e) {
        console.log('ERROR splitContributorsFromSeriesList', e);
        throw Error('Failed to resolve contributors');
    }

    return hackedSeries;
};


/**
 * Remove from series list all series that have only partial contributor match
 * Reason: Opencast /series API returns also partial matches when searched with contributor.
 *         contributor "grp-a01830-arkisto" can return two series with contributor
 *         grp-a01830-arkisto and grp-a01830-arkisto-yleinen
 *
 *
 * Example
 *    transformedSeriesList has two series: series1 and series2
 *    contributorValue: grp-omenapuu
 *
 *    series1
 *    contributor: ['grp-omenapuu', 'tunnus-2' 'grp-omenapuu-3', 'tunnus-2', 'tunnus-21434']
 *
 *    series2
 *    contributor: ['grp-omenapuu-3', 'tunnus-2', 'tunnus-21434']
 *
 *    Result:
 *    series2 will be filtered out because it doesn't have "grp-omenapuu" in it's contributor list
 *
 * @param transformedSeriesList
 * @param contributorValue
 * @returns {*[]}
 */
exports.filterCorrectSeriesWithCorrectContributors = (transformedSeriesList, contributorValue) => {
    let returnedSeriesList = [];
    transformedSeriesList.forEach((transformedSeries) => {
        let seriesWithSplittedContributors = this.splitContributorsFromSeries(transformedSeries);
        seriesWithSplittedContributors.contributors.forEach((contributor) => {
            if (contributor === contributorValue) {
                returnedSeriesList.push(seriesWithSplittedContributors);
            }
        });
    });
    return returnedSeriesList;
};


/**
 Transform series data for current Lataamo UI implementation

 ------------------------------------------------------------------------------
 This is the currently supported data structure returned to UI:
 ------------------------------------------------------------------------------

 [
 {
    identifier: '28ed5c64-5de5-4c0a-8edd-a536c857d847',
    license: '',
    creator: 'Opencast Project Administrator',
    created: '2021-04-06T10:30:57Z',
    subjects: [ 'Lataamo-trash' ],
    organizers: [ 'Lataamo-proxy-service', 'tzrasane' ],
    description: 'Lataamo-trash series for tzrasane',
    publishers: [ 'tzrasane' ],
    language: 'en',
    contributors: [ 'tzrasane' ],
    title: 'trash tzrasane',
    rightsholder: 'tzrasane'
  },
 {
    identifier: '06bd63f5-4a66-45c5-826f-e5a195c364ad',
    license: '',
    creator: 'Opencast Project Administrator',
    created: '2021-04-06T10:30:59Z',
    subjects: [ 'Lataamo-inbox' ],
    organizers: [ 'Lataamo-proxy-service', 'tzrasane' ],
    description: 'Lataamo-inbox series for tzrasane',
    publishers: [ 'tzrasane' ],
    language: 'en',
    contributors: [ 'tzrasane' ],
    title: 'inbox tzrasane',
    rightsholder: 'tzrasane'
  },
 {
    identifier: '74ee8056-385a-4e6d-bad8-a05569fa38ee',
    license: '',
    creator: 'Opencast Project Administrator',
    created: '2021-04-06T10:33:08Z',
    subjects: [],
    organizers: [],
    description: 'Kontributor kontribuutio',
    publishers: [],
    language: '',
    contributors: [ 'tzrasane', 'jesbu', 'grp-oppuroomu' ],
    title: 'Hesbu sarja',
    rightsholder: ''
  }
 ]

 ------------------------------------------------------------------------------
 This is the data structure returned by Opencast:
 ------------------------------------------------------------------------------

 {
  "catalogs": [
    {
      "http://purl.org/dc/terms/": {
        "identifier": [
          {
            "value": "74ee8056-385a-4e6d-bad8-a05569fa38ee"
          }
        ],
        "contributor": [
          {
            "value": "tzrasane"
          },
          {
            "value": "jesbu"
          },
          {
            "value": "grp-oppuroomu"
          }
        ],
        "created": [
          {
            "type": "dcterms:W3CDTF",
            "value": "2021-04-06T10:33:08Z"
          }
        ],
        "description": [
          {
            "value": "Kontributor kontribuutio"
          }
        ],
        "title": [
          {
            "value": "Hesbu sarja"
          }
        ]
      }
    },
    {
      "http://purl.org/dc/terms/": {
        "rightsHolder": [
          {
            "value": "tzrasane"
          }
        ],
        "identifier": [
          {
            "value": "06bd63f5-4a66-45c5-826f-e5a195c364ad"
          }
        ],
        "creator": [
          {
            "value": "Lataamo-proxy-service"
          },
          {
            "value": "tzrasane"
          }
        ],
        "contributor": [
          {
            "value": "tzrasane"
          }
        ],
        "created": [
          {
            "type": "dcterms:W3CDTF",
            "value": "2021-04-06T10:30:59Z"
          }
        ],
        "subject": [
          {
            "value": "Lataamo-inbox"
          }
        ],
        "description": [
          {
            "value": "Lataamo-inbox series for tzrasane"
          }
        ],
        "publisher": [
          {
            "value": "tzrasane"
          }
        ],
        "language": [
          {
            "value": "en"
          }
        ],
        "title": [
          {
            "value": "inbox tzrasane"
          }
        ]
      }
    },
    {
      "http://purl.org/dc/terms/": {
        "identifier": [
          {
            "value": "3fa9cfad-0888-4a84-9325-1bff86933dec"
          }
        ],
        "contributor": [
          {
            "value": "grp-4apis, tzrasane, konttine"
          }
        ],
        "created": [
          {
            "type": "dcterms:W3CDTF",
            "value": "2021-04-06T11:33:23Z"
          }
        ],
        "description": [
          {
            "value": "testisarja"
          }
        ],
        "title": [
          {
            "value": "orbu dorbu"
          }
        ]
      }
    },
    {
      "http://purl.org/dc/terms/": {
        "rightsHolder": [
          {
            "value": "tzrasane"
          }
        ],
        "identifier": [
          {
            "value": "28ed5c64-5de5-4c0a-8edd-a536c857d847"
          }
        ],
        "creator": [
          {
            "value": "Lataamo-proxy-service"
          },
          {
            "value": "tzrasane"
          }
        ],
        "contributor": [
          {
            "value": "tzrasane"
          }
        ],
        "created": [
          {
            "type": "dcterms:W3CDTF",
            "value": "2021-04-06T10:30:57Z"
          }
        ],
        "subject": [
          {
            "value": "Lataamo-trash"
          }
        ],
        "description": [
          {
            "value": "Lataamo-trash series for tzrasane"
          }
        ],
        "publisher": [
          {
            "value": "tzrasane"
          }
        ],
        "language": [
          {
            "value": "en"
          }
        ],
        "title": [
          {
            "value": "trash tzrasane"
          }
        ]
      }
    }
  ],
  "totalCount": "4"
}
 */
exports.transformResponseData = (data) => {
    const transformedData = [];
    const THE_KEY = 'http://purl.org/dc/terms/';

    function digObjectValuesFromArray(dataArr){
        const values = [];

        if (!dataArr) {
            return [];
        }

        dataArr.forEach((item) => {
            values.push(item.value);
        });
        return values;
    }


    data.forEach((series) => {
        transformedData.push({
            identifier: series[THE_KEY].identifier[0].value,
            license: '',
            creator: 'Opencast Project Administrator',
            created: series[THE_KEY].created[0].value,
            subjects: (typeof series[THE_KEY].subject !== 'undefined') ? [series[THE_KEY].subject[0].value] : [],
            organizers: digObjectValuesFromArray(series[THE_KEY].creator),  // this is in creator attribute in inbox and trash series
            description: series[THE_KEY].description[0].value,
            publishers: (typeof series[THE_KEY].publisher !== 'undefined')? [series[THE_KEY].publisher[0].value] : [],
            language: (typeof series[THE_KEY].language !== 'undefined') ? series[THE_KEY].language[0].value : '',
            contributors: digObjectValuesFromArray(series[THE_KEY].contributor),
            title: series[THE_KEY].title[0].value, //'Hesbu sarja',
            rightsholder: (typeof series[THE_KEY].rightsHolder !== 'undefined') ? series[THE_KEY].rightsHolder[0].value : ''
        });
    });
    return transformedData;
};
