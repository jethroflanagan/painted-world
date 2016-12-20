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



// Fisher-Yates https://www.frankmitchell.org/2015/01/fisher-yates/
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
            canvas: null,
            offscreen: null,
            images: {
                paintMasks: [],
                invertedPaintMasks: [],
                backgrounds: [],
            },
        };
    },
    methods: {
        loadImage: function (path, cb) {
            var deferred = Q.defer();
            var img = new Image();   // Create new img element
            img.addEventListener("load", function() {
                // cb();
                deferred.resolve(img);
            }, false);
            img.src = '/images/' + path;
            return deferred.promise;
        },
        paint: function () {
            var canvas = this.canvas;
            var width = this.width;
            var height = this.height
            var nodes = this.nodes;

            canvas.clearRect(0, 0, width, height);
            // canvas.beginPath();
            var paintMasks = this.images.paintMasks;
            var backgroundImages = this.images.backgrounds;
            var i = 0;
            canvas.save();

            for (i = 0; i < nodes.length; i++) {
                var d = nodes[i];
                var cx = d.x;
                var cy = d.y;
                var paintMask = paintMasks[0];
                // canvas.moveTo(cx, cy);
                // canvas.arc(cx, cy, d.r, 0, Math.PI * 2);
                var radius = d.r;
                var diameter = radius * 2;
                canvas.drawImage(paintMask, cx - radius, cy - radius, diameter, diameter);


            }
            // canvas.fill();
            canvas.restore();

            // canvas.save();
            canvas.globalCompositeOperation = 'source-atop';
            canvas.drawImage(backgroundImages[0], 0, 0, width, height);
            canvas.globalCompositeOperation = 'source-over';
            // canvas.restore();

            canvas.shadowColor = 'rgba(0,0,0,0.6)';
            canvas.shadowBlur = 15
            canvas.shadowOffsetX = 0;
            canvas.shadowOffsetY = 0;
            canvas.globalCompositeOperation = 'source-atop';

            for (i = 0; i < nodes.length; i++) {
                var d = nodes[i];
                var cx = d.x;
                var cy = d.y;
                var paintMask = this.images.invertedPaintMasks[0];
                // canvas.moveTo(cx, cy);
                // canvas.arc(cx, cy, d.r, 0, Math.PI * 2);
                var radius = d.r;
                var diameter = radius * 2;
                canvas.drawImage(paintMask, cx - radius, cy - radius, diameter, diameter);
            }
            canvas.restore();
        },

        setup: function () {
            var PADDING = 30;

            var groups = organiseCategories(aggregateService.data);

            var target = this.target;
            var margin = {top: 20, right: 20, bottom: 20, left: 20};
            var width = document.documentElement.clientWidth - margin.left - margin.right;
            var height = 800 - margin.top - margin.bottom;

            var dom = d3.select('.painted-world')
                .append('canvas')
                    .attr({
                        width: width - margin.left - margin.right,
                        height: height - margin.top - margin.bottom,
                    })
                    .style({
                        'transform': 'translate(' + margin.left + ',' + margin.top + ')'
                    })
                    .node().getContext('2d');
            var offscreen = d3.select('.painted-world')
                .append('canvas')
                    .attr({
                        width: width - margin.left - margin.right,
                        height: height - margin.top - margin.bottom,
                    })
                    .style({
                        'transform': 'translate(' + margin.left + ',' + margin.top + ')',
                        display: 'none',
                    })
                    .node().getContext('2d');
                // .append('dom')
                //     .attr('width', width + margin.left + margin.right)
                //     .attr('height', height + margin.top + margin.bottom)
                // .append('g')
                //     .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
            var data = {
                name : 'root',
                children : _.map(groups, function(group, name, i) {
                    var node = {};
                    node.name = name;
                    node.size = group.total;
                    node.offset = {
                        angle: Math.random() * Math.PI * 2,
                        radius: Math.random() * PADDING / 2,
                    };
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
                var trig = Math.sin;
                if (axis === 'x')
                    trig = Math.cos;
                return d[axis] + PADDING* 0.4 * trig(d.offset.angle);
            }
            _.map(nodes, function (node) {
                node.x = getPosition(node, 'x');
                node.y = getPosition(node, 'y');
            });
            console.log(nodes);

            // dom.selectAll('.group')
            //     .data(nodes)
            //     .enter()
            //         .append('circle')
            //         // .style('transform', function (d) {
            //         //     return 'translate(' + d.x + 'px ' + d.y + 'px)';
            //         // })
            //         .attr({
            //             cx: function (d, i) {
            //                 return getPosition(d,'x');
            //             },
            //             cy: function (d, i) {
            //                 return getPosition(d, 'y')
            //             },
            //             r: function (d) { return d.r },
            //             fill: function (d, i) {
            //                 return getColor(i);
            //             },
            //         })

            this.width = width;
            this.height = height;
            this.canvas = dom;
            this.offscreen = offscreen;
            this.nodes = nodes;
        },

        getInverted: function (img) {
            var offscreen = this.offscreen;
            // offscreen.clearRect(0, 0, this.width, this.height);
            offscreen.save();
            offscreen.fillRect(0, 0, this.width, this.height);
            offscreen.globalCompositeOperation = 'destination-out';
            offscreen.drawImage(img, 0, 0, this.width - 40, this.height-40);
            // var inverted = offscreen.getImageData(0, 0, this.width, this.height);
            var imgEl = document.createElement("img");
            imgEl.src = offscreen.canvas.toDataURL("image/png");
            // inverted = offscreen.toDataURL('image/png');
            offscreen.restore();
            return imgEl;
        },

        loadAll: function () {
            var _this = this;
            var promise = Q.all([
                this.loadImage('background1.jpg'),
                this.loadImage('mask1.png'),
            ])
                .spread(function (background1, mask1) {
                    console.log('done', background1, mask1);
                    _this.images.backgrounds.push(background1);
                    _this.images.paintMasks.push(mask1);
                    // _this.getInverted(mask1)
                    var invertedPaintMask = _this.getInverted(mask1);
                    _this.images.invertedPaintMasks.push(invertedPaintMask);
                    return true;
                })
                .then(this.paint);

            return promise;
        },
    },
    mounted: function () {
        // var data = this.data;
        // console.log(data);

        this.setup();
        this.loadAll();
    },
});

export {
    PaintedWorld,
}
