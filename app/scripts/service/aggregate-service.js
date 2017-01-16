// console.log(aggregate);
let _aggregate = {};
let _groups = {};

const aggregateService = {
    load: function (el) {
        return {
            // setup like getJSON from jquery
            success: function (cb) {
                el.addEventListener('data', function (res) {
                    console.log('data', res);
                    _.merge(_aggregate, res.detail);
                    cb();
                });
            }
        };
        // window.addEventListener
        // return $.getJSON('data/aggregate.json')
        //     .success((res) => {
        //         console.log('Loaded',res);
        //         _.merge(_aggregate, res);
        //     })
        //     .error((err) => {
        //         console.log('Whoops', err);
        //     });
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
