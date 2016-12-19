// console.log(aggregate);
let _aggregate = {};
let _groups = {};
function organiseCategories (aggregate) {
    // var groups = {
    //     'Housing & Utilities': ['Rental', 'Bond repayment', 'Home & garden', 'Home utilities & service'],
    //     'Food': ['Eating out & take outs', 'Groceries'],
    //     'Transportation': ['Transport & fuel', 'Vehicle expenses', 'Vehicle repayments'],
    //     'Investments & RA’s': ['Investments', 'Saving'],
    //     'Entertainment': ['Entertainment', 'Leisure & sport'],
    //     'Healthcare': ['Health & medical'],
    //     'Insurance': ['Insurance'],
    //     'Fashion & Beauty': ['Personal care', 'Clothing  & shoes'],
    //     'Internet & phone': ['Cellphone', 'Internet & phone'],
    //     'Bank Fees & Interest': ['Banks charges & fees'],
    //     'Holidays & travel': ['Holidays & travel'],
    //     'Debt Repayments': ['Card payments', 'Loans'],
    //     'Gifts & Donations':  [ 'Gifts', 'Donations to charity'],
    //     'ATM & Cash': ['ATM & Cash'],
    // };
    // var reversed = {};
    // // rewrite for simpler lookups
    // _.map(groups, function (categories, key) {
    //     _.map(categories, function (cat) {
    //         reversed[cat] = key;
    //     });
    //
    //     return categories;
    //
    // });
    // console.log(JSON.stringify(reversed, null, '    '));

    var categoryLookup = {
        "Rental": "Housing & Utilities",
        "Bond repayment": "Housing & Utilities",
        "Home & garden": "Housing & Utilities",
        "Home utilities & service": "Housing & Utilities",
        "Eating out & take outs": "Food",
        "Groceries": "Food",
        "Transport & fuel": "Transportation",
        "Vehicle expenses": "Transportation",
        "Vehicle repayments": "Transportation",
        "Investments": "Investments & RA’s",
        "Saving": "Investments & RA’s",
        "Entertainment": "Entertainment",
        "Leisure & sport": "Entertainment",
        "Health & medical": "Healthcare",
        "Insurance": "Insurance",
        "Personal care": "Fashion & Beauty",
        "Clothing  & shoes": "Fashion & Beauty",
        "Cellphone": "Internet & phone",
        "Internet & phone": "Internet & phone",
        "Banks charges & fees": "Bank Fees & Interest",
        "Holidays & travel": "Holidays & travel",
        "Card payments": "Debt Repayments",
        "Loans": "Debt Repayments",
        "Gifts": "Gifts & Donations",
        "Donations to charity": "Gifts & Donations",
        "ATM & Cash": "ATM & Cash",
    };
    var now = new Date();
    // TODO start of 12 months ago
    var yearStart = new Date(now.getFullYear(), 0, 1).getTime();
    var groups = {};
    _.map(aggregate.transactions, function (txn) {
        var group = categoryLookup[txn.categoryName];
        if (!group) {
            group = 'Other';
            // return;
        }
        if (txn.transactionDate < yearStart) {
            return;
        }
        if (!groups.hasOwnProperty(group)) {
            groups[group] = [txn];
        }
        else {
            groups[group].push(txn);
        }
    });

    var allGroupsTotal = 0;

    _.map(groups, function (group, name) {
        var total = _.reduce(group, function (subtotal, txn) {
            if (txn.amount.debitOrCredit === 'debit')
                return subtotal + txn.amount.amount;
            return subtotal;
        }, 0);
        allGroupsTotal += total;
        groups[name] = {
            total: total,
        };
    });

    _.map(groups, function (group, name) {
        groups[name].percent = Math.round(groups[name].total / allGroupsTotal * 100);
    });

    return groups;
}

const aggregateService = {
    load: () => {
        return $.getJSON('data/aggregate.json')
            .success((res) => {
                console.log('Loaded',res);
                _groups = organiseCategories(res);
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
