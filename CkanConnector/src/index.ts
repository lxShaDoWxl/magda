import { AspectDefinition, AspectDefinitionsApi } from './generated/registry/api';
import retry from './retry';
import Ckan from './Ckan';
import CkanConnector, { AspectBuilder } from './CkanConnector';
import Registry from './Registry';
import * as fs from 'fs';
import * as request from 'request';
import formatServiceError from './formatServiceError';
import * as URI from 'urijs';
import * as moment from 'moment';

/*
const start = Date.now();
for (var i = 0; i < 10000; ++i) {
    const d = parseDateTimeString('2016-01-12T12:00');
    const foo = getPrecisionFromMoment(d);
    // console.log(d.format());
    // console.log(foo.toJSON());
}
const end = Date.now();
console.log(end - start);
// console.log(d.format());
// console.log(d.creationData().format);
// console.log(moment.ISO_8601);

process.exit();
*/

const ckan = new Ckan({
    baseUrl: 'https://data.gov.au/',
    pageSize: 10
});

const registry = new Registry({
    baseUrl: 'http://localhost:6100/'
});

const aspectBuilders: AspectBuilder[] = [
    {
        aspectDefinition: {
            id: 'ckan-dataset',
            name: 'CKAN Dataset',
            jsonSchema: require('../../registry-aspects/ckan-dataset.schema.json')
        },
        builderFunctionString: fs.readFileSync('aspect-templates/ckan-dataset.js', 'utf8')
    },
    {
        aspectDefinition: {
            id: 'dcat-dataset-strings',
            name: 'DCAT Dataset properties as strings',
            jsonSchema: require('../../registry-aspects/dcat-dataset-strings.schema.json')
        },
        builderFunctionString: fs.readFileSync('aspect-templates/dcat-dataset-strings.js', 'utf8')
    },
    {
        aspectDefinition: {
            id: 'source',
            name: 'Source',
            jsonSchema: require('../../registry-aspects/source.schema.json')
        },
        builderFunctionString: fs.readFileSync('aspect-templates/source.js', 'utf8')
    },
    {
        aspectDefinition: {
            id: 'temporal-coverage',
            name: 'Temporal Coverage',
            jsonSchema: require('../../registry-aspects/temporal-coverage.schema.json')
        },
        setupFunctionString: fs.readFileSync('aspect-templates/temporal-coverage-setup.js', 'utf8'),
        builderFunctionString: fs.readFileSync('aspect-templates/temporal-coverage.js', 'utf8')
    }
];

const connector = new CkanConnector({
    ckan: ckan,
    registry: registry,
    aspectBuilders: aspectBuilders
});

connector.run().then(result => {
    console.log('Aspect Definitions Connected: ' + result.aspectDefinitionsConnected);
    console.log('Datasets Connected: ' + result.datasetsConnected);

    if (result.errors.length > 0) {
        console.log('Errors:\n' + result.errors.map(error => error.toString()).join('\n'));
    }
});
