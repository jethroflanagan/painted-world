// console.log(aggregate);
let _aggregate = {};
let _groups = {};

const aggregateService = {
    load: () => {
        return $.getJSON('data/aggregate.json')
            .success((res) => {
                console.log('Loaded',res);
                _.merge(_aggregate, res);
            })
            .error((err) => {
                console.log('Whoops', err);
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
