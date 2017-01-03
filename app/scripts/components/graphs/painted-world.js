// import { colors } from './../../config';
import { aggregateService } from '../../service/aggregate-service';
import { Painter } from './painter';
import { Labeler } from './labeler';
import { PaintControls } from './paint-controls';

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
    // console.log('GROUPS', groups);
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
    // inline style needs to be forced for text decoration to handle :visited for some reason
    template: `
        <div class="Painting">
            <div class="js-painted-world PaintedWorld">
                <div class="Offscreen js-offscreen"></div>
                <div class="js-canvas"></div>
                <paint-controls
                    :reset="reset"
                    :download="download"
                    :isEnabled="canInteract"
                    :ctx="ctx"
                    v-on:messy-updated="onMessyUpdated"
                    v-on:hue-updated="onHueUpdated"
                >
                </paint-controls>
                <div class="js-overlay"></div>
            </div>
            <div class="Log js-log"></div>
        </div>
    `,
    props: [
        'data',
        'images',
    ],
    data() {
        return {
            graphId: generateUUID(),
            ctx: null,
            labelCtx: null,
            // previewCtx: null,
            canInteract: false,
            // images: {
            //     paintMasks: [],
            //     invertedPaintMasks: [],
            //     labels: [],
            //     colorThemes: [],
            //     canvases: [],
            // },
            painter: null,
            isMessy: true,
            isHueShiftAllowed: true,
            percentLoaded: 0,
        };
    },
    methods: {
        onMessyUpdated: function (val) {
            this.isMessy = val;
        },

        onHueUpdated: function (val) {
            console.log('isHueShiftAllowed', val);
            this.isHueShiftAllowed = val;
        },

        reset: function () {
            this.createLayout();
            this.paint();
        },

        download: function (e) {
            var dataUrl = this.ctx.canvas.toDataURL('image/png');
            d3.select('.js-download')
                .attr({
                    'href': dataUrl,
                });
        },

        setInteractionAllowed: function (isAllowed) {
            this.canInteract = isAllowed;
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
            var colorTheme = this.images.colorThemes[colorIndex].image;
            var hues = this.images.colorThemes[colorIndex].hues;
            var hueShift = 0;
            if (this.isHueShiftAllowed) {
                hueShift = hues[Math.floor(Math.random() * hues.length)];
            }
            // console.log('nodes', nodes.length);
            var canvasTheme = this.images.canvases[Math.floor(Math.random() * this.images.canvases.length)];
            var count = nodes.length;
            var onCompletePaint = function () {
                if (--count <= 0) {
                //     ctx.globalCompositeOperation = 'multiply';
                //     ctx.drawImage(canvasTheme, 0, 0, this.width, this.height);
                //     ctx.globalCompositeOperation = 'source-over';
                    this.setInteractionAllowed(true);

                    // save to log
                    var imgData = this.ctx.canvas.toDataURL('image/png');
                    var container = d3.select('.js-log')
                        .append('div')
                        .attr({
                            'class': 'Preview',
                        });

                    container
                        .append('img')
                        .attr({
                            src: imgData,
                            'class': 'Preview-image',
                        });
                    container
                        .append('div')
                        .attr({
                            'class': 'Preview-stats',
                        })
                        .text('color: ' + (colorIndex+1) + ', hue: ' + hueShift + 'deg');
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
                                hueShift: hueShift,
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
                // console.log('loading', Math.floor((i + 1) / nodes.length  * 100));
            }
            if (this.isMessy) {
                this.speckleCanvas(colorTheme, hueShift);
            }
        },

        speckleCanvas: function (colorTheme, hueShift) {
            var numSplatters = Math.floor(Math.random() * 40) + 5;
            for (var i = 0; i < numSplatters; i++) {
                setTimeout(function () {
                    var size = Math.random() * 6 + 1;

                    this.painter.paint(
                        {
                            cx: Math.random() * this.width,
                            cy: Math.random() * this.height,
                            radius: size,
                            hueShift: hueShift,
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
            var width = 900;//document.documentElement.clientWidth - margin.left - margin.right;
            var height = 800;

            var paintedWorld = d3.select('.js-painted-world');
            var canvasContainer = paintedWorld.select('.js-canvas');
            var overlayContainer = paintedWorld.select('.js-overlay');
            var offscreenContainer = paintedWorld.select('.js-offscreen');

            var dom = canvasContainer
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

            // var previewCtx = canvasContainer
            //     .append('canvas')
            //         .attr({
            //             width: width,
            //             height: height,
            //         })
            //         .style({
            //             position: 'absolute',
            //             top: 0,
            //             left: 0,
            //             'mix-blend-mode': 'multiply',
            //         })
            //         .node().getContext('2d');

            var labelEl = overlayContainer
                .append('div')
                    .attr({
                    })
                    .style({
                        position: 'absolute',
                        top: INTERACTION_OFFSET_Y + 'px',
                        left: 0,
                        // border: '1px solid #000',
                        width: width + 'px',
                        height: (height-INTERACTION_OFFSET_Y) + 'px',
                        // left: 200,
                        // display: 'none',
                    })
                    .node();
            var labelInteractionEl = overlayContainer
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

            var offscreenEl = offscreenContainer
                .append('div')
                .style({
                    position: 'absolute',
                    top: 0,
                    left: width + 'px',
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
            var offscreenLabelCtx = offscreenContainer
                .append('canvas')
                    .attr({
                        width: width,
                        height: height,
                    })
                    .style({
                        position: 'absolute',
                        bottom: 0,
                        // border: '1px solid #000',
                        // left: 200,
                    })
                    .node().getContext('2d');

            this.width = width;
            this.height = height;
            this.ctx = dom;
            // this.previewCtx = previewCtx;
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

    },
    mounted: function () {
        // var data = this.data;
        // console.log(data);
        // this.loadAll();

        this.setup();
        this.createLayout();
        this.paint();
    },
});

export {
    PaintedWorld,
}
