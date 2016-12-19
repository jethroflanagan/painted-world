import * as config from './config';
import { router } from './router';
import { aggregateService } from './service/aggregate-service';
import './filters';

aggregateService.load()
    .success((res) => {
        new Vue({
            router,
            el: '.App',
            data: {},
            created: function () {
                router.push({ name: 'graph' });
            },
        })
    });
