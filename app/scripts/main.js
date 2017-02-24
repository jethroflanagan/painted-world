import * as config from './config';
import { aggregateService } from './service/aggregate-service';
import './filters';
import './components/graphs/asset-loader';

var el = document.querySelector('.js-painting');
var hasLoaded = false;
aggregateService.load(el)
    .success(function (res) {
        if (hasLoaded) {
            return;
        }
        hasLoaded = true;
        new Vue({
            el: '.js-painting',
            data: {},
            created: function () {
            },
        })
    });
