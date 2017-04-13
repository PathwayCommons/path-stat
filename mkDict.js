const Promise = require('bluebird');
const fetch = require('node-fetch');
fetch.Promise = Promise;

const datasource = (source) => `datasource=${source}`;
const datasources = `&${datasource('reactome')}&${datasource('pid')}&${datasource('smpdb')}&${datasource('humancyc')}&${datasource('inoh')}&${datasource('panther')}&${datasource('kegg')}&${datasource('netpath')}&${datasource('wikipathways')}`;

const baseUrlSearch = 'http://beta.pathwaycommons.org/pc2/search.json?q=*&type=pathway' + datasources;

const getNumPages = fetch(baseUrlSearch)
  .then(result => result.json())
  .then(resultObj => {
    return Math.floor((resultObj.numHits - 1) / resultObj.maxHitsPerPage) + 1;
  });

function fetchSearch(baseUrl, pageNumber) {
  return new Promise(function(resolve, reject) {
    var wrappedFetch = function(numTries) {
      if (numTries >= 0) {
        fetch(`${baseUrlSearch}&page=${pageNumber}`)
          .then(res => res.json())
          .then(searchObj => {
            if (typeof searchObj === 'object') {
              return searchObj.searchHit;
            } else {
              throw new Error();
            }
          })
          .then(resolvable => resolve(resolvable))
          .catch((e) => {
            wrappedFetch(--numTries);
          });
      }
    };
    wrappedFetch(5);
  });
}

const pathwayPages = getNumPages
  .then(numPages => [...Array(numPages).keys()])
  .map(pageNumber => fetchSearch(baseUrlSearch, pageNumber))
  .then(arrayList => [].concat(...arrayList))
  .catch((e) => console.log(e));

const pathwaySbgn = pathwayPages.then(pg => {
  return pg.map(pathway => pathway.uri);
});

pathwaySbgn.then(output => console.log(JSON.stringify(output, null, 2)));


// Promise.all([pathway_array, pathway_list]).then(promiseArray => {
//   console.log('');
//   console.log('Processing completed');
//   console.log(Object.keys(promiseArray[1]).length + ' pathways found');
//   console.log('');
// });
//
// function writeToFile(file_name, output) {
//   var path = __dirname + '/output/' + file_name;
//   try {
//     fs.mkdirSync(__dirname + '/output');
//   } catch (e) {}
//   fsp.remove(path + '.min.json').then(() => {
//     fsp.writeFile(path + '.min.json', JSON.stringify(output));
//   });
//   fsp.remove(path + '.json').then(() => {
//     fsp.writeFile(path + '.json', JSON.stringify(output, null, 2));
//   });
// }
//
// // Write pathway_array to file
// pathway_array.then(output => {
//   var file_name = "pathway_array";
//   writeToFile(file_name, output);
// });
//
// // Write pathway_weighted to file
// pathway_list.then(output => {
//   var file_name = "pathway_list";
//   writeToFile(file_name, output);
// });
