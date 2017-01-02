// import { colors } from './../../config';
import { aggregateService } from '../../service/aggregate-service';
import { Painter } from './painter';
import { Labeler } from './labeler';

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
    // var now = moment();
    // TODO start of 12 months ago
    var yearStart = +moment().subtract(12, 'months').startOf('year');
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

    groups = _.filter(groups, function (group, name) {
        group.name = name;
        return group.total > 1;
    });


    _.map(groups, function (group) {
        group.percent = Math.round(group.total / allGroupsTotal * 100);
    });
    // _.map(groups, function (g) {
    //     console.log(g.name, '=', g.percent);
    // });
    console.log('GROUPS', groups);
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
var INTERACTION_OFFSET_Y = 70;
var PAINT_TIME = 2000;
var PaintedWorld = Vue.component('painted-world', {

    template: `
        <div class="Painting">
            <div class="js-painted-world">
            <button class="Button Button--reset js-reset">
                Paint another
            </button>
            <button class="Button Button--download js-download">
                Download
            </button>
            </div>
        </div>
    `,
    props: [
        'data',
        'target',
    ],
    data() {
        return {
            graphId: generateUUID(),
            ctx: null,
            labelCtx: null,
            previewCtx: null,
            images: {
                paintMasks: [],
                invertedPaintMasks: [],
                labels: [],
                colorThemes: [],
                canvases: [],
            },
            painter: null,
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

        reset: function () {
            this.createLayout();
            this.paint();
        },

        setInteractionAllowed: function (isAllowed) {
            document.querySelector('.js-reset')
                .disabled = !isAllowed;
            document.querySelector('.js-download')
                .disabled = !isAllowed;
        },

        paint: function () {
            this.setInteractionAllowed(false);
            this.labeler.cleanup();
            var ctx = this.ctx;
            var width = this.width;
            var height = this.height
            var nodes = this.nodes;

            ctx.clearRect(0, 0, width, height);
            var i = 0;
            var colorIndex = Math.floor(Math.random() * this.images.colorThemes.length);
            var colorTheme = this.images.colorThemes[colorIndex];
            console.log('nodes', nodes.length);
            var canvasTheme = this.images.canvases[Math.floor(Math.random() * this.images.canvases.length)];
            var count = nodes.length;
            var onCompletePaint = function () {
                if (--count <= 0) {
                //     ctx.globalCompositeOperation = 'multiply';
                //     ctx.drawImage(canvasTheme, 0, 0, this.width, this.height);
                //     ctx.globalCompositeOperation = 'source-over';
                    this.setInteractionAllowed(true);
                }
            }.bind(this);

            // draw canvas at start so it's not so empty while things process
            this.ctx.drawImage(canvasTheme, 0, 0, this.width, this.height);

            for (i = 0; i < nodes.length; i++) {
                var d = nodes[i];
                setTimeout((function (d) {
                    return function () {
                        this.painter.paint(
                            {
                                cx: d.x,
                                cy: d.y,
                                radius: d.r,
                                colorTheme: colorTheme,
                            },
                            onCompletePaint
                        );

                        this.labeler.write({
                            group: {
                                name: d.name,
                                amount: d.size,
                                percent: d.percent,
                            },
                            x: d.x,
                            y: d.y - INTERACTION_OFFSET_Y,
                            radius: d.r,
                        });
                    }
                })(d).bind(this), Math.random() * PAINT_TIME);
                console.log('loading', Math.floor((i + 1) / nodes.length  * 100));
            }

            this.speckleCanvas(colorTheme);
        },

        speckleCanvas: function (colorTheme) {
            var numSplatters = Math.floor(Math.random() * 40) + 5;
            for (var i = 0; i < numSplatters; i++) {
                setTimeout(function () {
                    var size = Math.random() * 6 + 1;

                    this.painter.paint(
                        {
                            cx: Math.random() * this.width,
                            cy: Math.random() * this.height,
                            radius: size,
                            colorTheme: colorTheme,
                            opacity: size < 3
                                ? Math.random() * 0.3 + 0.5
                                : Math.random() * 0.3 + 0.1,
                        }
                    );
                }.bind(this), Math.random() * PAINT_TIME / 2);
                // console.log('loading', Math.floor((i + 1) / nodes.length  * 100));
            }
        },

        createLayout: function () {
            var PACK_PADDING = 30;
            var PADDING = 80;
            var width = this.width;
            var height = this.height;
            var groups = organiseCategories(aggregateService.data, false);
            var data = {
                name : 'root',
                children : _.map(groups, function(group, i) {
                    var node = {};
                    node.name = group.name;
                    node.size = group.total;
                    node.percent = group.percent;
                    node.offset = {
                        angle: Math.random() * Math.PI * 2,
                    };
                    return node;
                }),
            };
            shuffle(data.children);

            var nodes = d3.layout.pack()
                .sort(null)
                // .shuffle()//(a,b)=>b.size-a.size)
                .size([width - PADDING * 2, height - PADDING * 2])
                .padding(PACK_PADDING)
                .value(function (d) {
                    return d.size;
                })
                .nodes(data)

            // remove root
            _.remove(nodes, { name: 'root' });

            // offset the circle within padded area for more randomness
            var getPosition = function (d, axis) {
                var trig = Math.sin;
                if (axis === 'x')
                    trig = Math.cos;
                return d[axis] + PACK_PADDING * 0.3 * trig(d.offset.angle);
            }
            _.map(nodes, function (node) {
                node.x = getPosition(node, 'x') + PADDING;
                node.y = getPosition(node, 'y') + PADDING;
            });
            this.nodes = nodes;
        },

        setup: function () {

            var target = this.target;
            var width = 700;//document.documentElement.clientWidth - margin.left - margin.right;
            var height = 700;

            var paintedWorld = d3.select('.js-painted-world');
            var previewCtx = paintedWorld
                .append('canvas')
                    .attr({
                        width: width,
                        height: height,
                    })
                    .style({
                        position: 'absolute',
                        top: 0,
                        left: 0,
                    })
                    .node().getContext('2d');
            var dom = paintedWorld
                .append('canvas')
                    .attr({
                        width: width,
                        height: height,
                    })
                    .style({
                        position: 'absolute',
                        top: 0,
                        left: 0,
                    })
                    .node().getContext('2d');

            var labelEl = paintedWorld
                .append('div')
                    .attr({
                    })
                    .style({
                        position: 'absolute',
                        top: INTERACTION_OFFSET_Y + 'px',
                        left: 0,
                        // border: '1px solid #000',
                        width: width + 'px',
                        height: height + 'px',
                        // left: 200,
                        // display: 'none',
                    })
                    .node();
            var labelInteractionEl = paintedWorld
                .append('div')
                    .attr({
                    })
                    .style({
                        position: 'absolute',
                        top: INTERACTION_OFFSET_Y + 'px',
                        left: 0,
                        // border: '1px solid #0c0',
                        width: width + 'px',
                        height: (height-INTERACTION_OFFSET_Y) + 'px',
                        // left: 200,
                    })
                    .node();

            var offscreenEl = paintedWorld
                .append('div')
                .style({
                    position: 'absolute',
                    top: 0,
                    left: width + 'px',
                    display: 'none',
                    // border: '1px solid #000',
                    // left: 200,
                });
            //     .append('canvas')
            //         .attr({
            //             width: width,
            //             height: height,
            //         })
            //         .style({
            //             position: 'absolute',
            //             top: 0,
            //             // border: '1px solid #000',
            //             // left: 200,
            //         })
            //         .node().getContext('2d');
            var offscreenLabelCtx = paintedWorld
                .append('canvas')
                    .attr({
                        width: width,
                        height: height,
                    })
                    .style({
                        position: 'absolute',
                        bottom: 0,
                        display: 'none',
                        // border: '1px solid #000',
                        // left: 200,
                    })
                    .node().getContext('2d');
                // .append('dom')
                //     .attr('width', width + margin.left + margin.right)
                //     .attr('height', height + margin.top + margin.bottom)
                // .append('g')
                //     .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');


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
            this.ctx = dom;
            this.previewCtx = previewCtx;
            this.createLayout();
            // this.offscreenCtx = offscreenCtx;

            this.painter = new Painter({
                outputCtx: dom,
                offscreenEl: offscreenEl,
                width: width,
                height: height,
                brushMasks: this.images.paintMasks,
            });

            this.labeler = new Labeler({
                outputEl: labelEl,
                ctx: offscreenLabelCtx,
                interactionEl: labelInteractionEl,
                width: width,
                height: height,
                labelImages: this.images.labels,
            });
        },


        loadAll: function () {
            var _this = this;
            var promise = Q.all([
                // canvases
                this.loadImage('canvases/canvas1.jpg'),
                this.loadImage('canvases/canvas2.jpg'),
                this.loadImage('canvases/canvas3.jpg'),
                this.loadImage('canvases/canvas4.jpg'),

                // themes
                this.loadImage('colors/color1.jpg'),
                this.loadImage('colors/color2.jpg'),
                this.loadImage('colors/color3.jpg'),
                // this.loadImage('colors/color4.jpg'), // pure flat color for debug

                // labels
                // this.loadImage('label/label1.png'),
                // this.loadImage('label/label2.png'),
                // this.loadImage('label/label3.png'),
                // this.loadImage('label/label4.png'),
                // this.loadImage('label/label5.png'),
                this.loadImage('label.png'),

                // brushes
                this.loadImage('brushes/outline01.png'),
                this.loadImage('brushes/outline02.png'),
                this.loadImage('brushes/outline03.png'),
                this.loadImage('brushes/outline04.png'),
                this.loadImage('brushes/outline05.png'),
                this.loadImage('brushes/outline06.png'),
                this.loadImage('brushes/outline07.png'),
                this.loadImage('brushes/outline08.png'),
                this.loadImage('brushes/outline09.png'),
                this.loadImage('brushes/outline10.png'),
                this.loadImage('brushes/outline11.png'),
                this.loadImage('brushes/outline12.png'),
                this.loadImage('brushes/outline13.png'),
                this.loadImage('brushes/outline14.png'),
                this.loadImage('brushes/outline15.png'),
                this.loadImage('brushes/outline16.png'),

            ])
                .then(function (images) {
                    // console.log('done', images);
                    var i = 0;
                    for (i = 0; i < 4; i++) {
                        _this.images.canvases.push(images[i]);
                    }
                    var num = i + 3;
                    for (; i < num; i++) {
                        _this.images.colorThemes.push(images[i]);
                    }
                    var num = i + 1;
                    for (; i < num; i++) {
                        _this.images.labels.push('images/label.png');
                        // _this.images.labels.push(images[i]);
                    }
                    for (; i < images.length; i++) {
                        _this.images.paintMasks.push(images[i]);
                    }
                    return true;
                })
                .then(this.setup)
                .then(this.paint)
                .catch(function (e) {
                    console.error(e);
                });

            return promise;
        },
    },
    mounted: function () {
        // var data = this.data;
        // console.log(data);
        document.querySelector('.js-reset')
            .addEventListener('mousedown', function (e) {
                this.reset();
            }.bind(this));

        this.loadAll();
    },
});

export {
    PaintedWorld,
}
