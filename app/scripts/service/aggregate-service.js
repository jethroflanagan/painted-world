import { EventBus, AGGREGATE_EVENT } from '../event-bus';

let _aggregate = {};
let _groups = {};

const aggregateService = {
    load: function (el) {
        return {
            // setup like getJSON from jquery
            success: function (cb) {
                this.listen();
                cb();
            }.bind(this)
        };
    },
    listen: function (el) {
        el.addEventListener('component-painted-world-data', function (res) {
            if (res.detail.transactions.length == 0) {
                return;
            }
            _.merge(_aggregate, res.detail);
            EventBus.$emit(AGGREGATE_EVENT, _aggregate);
        });
    },
    // data: aggregate,
    get data () {
        return _.cloneDeep(_aggregate);
    },
    get groups () {
        return _.cloneDeep(_groups);
    }
    // calculate

};
export {
    aggregateService
}
