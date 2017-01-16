import * as config from './config';
import { aggregateService } from './service/aggregate-service';
import './filters';
import './components/graphs/asset-loader';

aggregateService.load()
    .success((res) => {
        new Vue({
            el: '.App',
            data: {},
            created: function () {
            },
        })
    });
