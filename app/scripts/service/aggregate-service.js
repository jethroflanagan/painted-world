import { EventBus, AGGREGATE_EVENT } from '../event-bus';

let _aggregate = {};
let _groups = {};

const aggregateService = {
    load: function (el) {
        return {
            // setup like getJSON from jquery
            success: function (cb) {
                console.log('success');
                this.listen();
                cb();
            }.bind(this)
        };
    },
    listen: function (el) {
        console.log('LISTEN');
        document.addEventListener('data', function (res) {
            if (res.detail.transactions.length == 0) {
                return;
            }
            console.log('data', res);
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
