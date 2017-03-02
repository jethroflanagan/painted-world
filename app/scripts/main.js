import { aggregateService } from './service/aggregate-service';
import { namespace } from './helpers';
import './filters';
import './components/graphs/asset-loader';


window.createPaintedWorld = function () {
    var el = document;//.querySelector('.js-painting');
    aggregateService.listen(el)
    new Vue({
        el: namespace,
        data: {},
        created: function () {
        },
    });
    return true;
};
