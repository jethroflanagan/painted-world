// import { colors } from './../../config';
import { aggregateService } from '../../service/aggregate-service';

const generateUUID = () => {
    var d = new Date().getTime();
    if(window.performance && typeof window.performance.now === "function"){
        d += performance.now(); //use high-precision timer if available
    }
    // var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var uuid = 'axxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
};

function organiseCategories (aggregate, isLimited) {
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

    if (isLimited) {
        _.map(aggregate.transactions, function (txn) {
            var group = categoryLookup[txn.categoryName];
            if (txn.spendingGroupName === 'Transfers') {
                return;
            }
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
    }
    else {
        _.map(aggregate.transactions, function (txn) {
            var group = txn.categoryName;
            if (txn.spendingGroupName === 'Transfers') {
                return;
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
    }

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

function shuffle (array) {
    var i = 0
    var j = 0
    var temp = null

    for (i = array.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1))
        temp = array[i]
        array[i] = array[j]
        array[j] = temp
    }
}

const PaintedWorld = Vue.component('painted-world', {

    template: `
        <div class="painted-world"></div>
    `,
    props: [
        'data',
        'target',
    ],
    data() {
        return {
            graphId: generateUUID(),
            leftLabel: '',
            rightLabel: '',
        };
    },
    methods: {
    },
    mounted: function () {
        // var data = this.data;
        // console.log(data);
        var PADDING = 30;

        var groups = organiseCategories(aggregateService.data);

        var target = this.target;
        var margin = {top: 20, right: 20, bottom: 20, left: 20};
        var width = document.documentElement.clientWidth - margin.left - margin.right;
        var height = 500 - margin.top - margin.bottom;

        var svg = d3.select('.painted-world')
            .append('svg')
                .attr('width', width + margin.left + margin.right)
                .attr('height', height + margin.top + margin.bottom)
            .append('g')
                .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
        var data = {
            name : 'root',
            children : _.map(groups, function(group, name, i) {
                var node = {};
                node.name = name;
                node.size = group.total;
                return node;
            }),
        };
        shuffle(data.children);

        var nodes = d3.layout.pack()
            .sort(null)
            // .shuffle()//(a,b)=>b.size-a.size)
            .size([width, height])
            .padding(PADDING)
            .value(function (d) {
                return d.size;
            })
            .nodes(data)

        // remove root
        // nodes.shift();
        _.remove(nodes, { name: 'root' });

        var getColor = d3.scale.category10();

        // offset the circle within padded area for more randomness
        var getPosition = function (d, axis) {
            var angle = Math.random() * Math.PI * 2;
            var trig = Math.cos;
            if (axis === 'x')
                trig = Math.sin;
            return d[axis] + Math.random() * PADDING / 2 * trig(angle);
        }

        console.log(nodes);
        svg.selectAll('.group')
            .data(nodes)
            .enter()
                .append('circle')
                // .style('transform', function (d) {
                //     return 'translate(' + d.x + 'px ' + d.y + 'px)';
                // })
                .attr({
                    cx: function (d) {
                        return getPosition(d, 'x');
                    },
                    cy: function (d) { return getPosition(d, 'y') },
                    r: function (d) { return d.r },
                    fill: function (d, i) {
                        return getColor(i);
                    },
                })


    },
});

export {
    PaintedWorld,
}
