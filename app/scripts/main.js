import { aggregateService } from './service/aggregate-service';
import './filters';
import './components/graphs/asset-loader';


window.createPaintedWorld = function () {
    var el = document.querySelector('.js-painting');
    aggregateService.listen(el)
    new Vue({
        el: '.js-painting',
        data: {},
        created: function () {
        },
    });
    return true;
};
