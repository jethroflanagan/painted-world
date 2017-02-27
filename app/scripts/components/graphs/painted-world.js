import { aggregateService } from '../../service/aggregate-service';
import { Painter } from './painter';
import { Labeler } from './labeler';
import { PaintControls } from './paint-controls';
import { applyCssModule } from '../../helpers';

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
    var OTHER_PERCENT = 0; // groups below this are moved into other
    var OTHER_GROUP_NAME = 'Other'; // groups below this are moved into other
    var categoryMapping = {
        'Housing & Utilities': ['Rental', 'Bond repayment', 'Home & garden', 'Home utilities & service'],
        'Food': ['Eating out & take outs', 'Groceries'],
        'Transportation': ['Transport & fuel', 'Vehicle expenses', 'Vehicle repayments'],
        'Investments & RA’s': ['Investments', 'Saving'],
        'Entertainment': ['Entertainment', 'Leisure & sport'],
        'Healthcare': ['Health & medical'],
        'Insurance': ['Insurance'],
        'Fashion & Beauty': ['Personal care', 'Clothing  & shoes'],
        'Internet & phone': ['Cellphone', 'Internet & phone'],
        'Bank Fees & Interest': ['Banks charges & fees'],
        'Holidays & travel': ['Holidays & travel'],
        'Debt Repayments': ['Card payments', 'Loans'],
        'Gifts & Donations':  [ 'Gifts', 'Donations to charity'],
        'ATM & Cash': ['ATM & Cash'],
    };
    var categoryLookup = {};
    
    // rewrite for simpler lookups. 
    // Hashmap with txn category as key, name of lookup as value e.g.
    // `{"Rental": "Housing & Utilities", "Bond repayment": "Housing & Utilities"}`
    _.map(categoryMapping, function (categories, key) {
        _.map(categories, function (cat) {
            categoryLookup[cat] = key;
        });
    
        return categories;
    
    });
    
    var groups = {};
    var categorize = function (groups, groupName, txn) {
        if (txn.spendingGroupName === 'Transfers') {
            return;
        }
        if (!groups.hasOwnProperty(groupName)) {
            groups[groupName] = [txn];
        }
        else {
            groups[groupName].push(txn);
        }
    };

    if (isLimited) {
        _.map(aggregate.transactions, function (txn) {
            var groupName = categoryLookup[txn.categoryName];
            if (!groupName) {
                groupName = OTHER_GROUP_NAME;
                // return;
            }
            categorize(groups, groupName, txn);
            // groups[groupName].contains.push(txn.categoryName);
        });
    }
    else {
        _.map(aggregate.transactions, function (txn) {
            var groupName = txn.categoryName;
            categorize(groups, groupName, txn);
        });
    }

    var allGroupsTotal = 0;

    _.map(groups, function (group, name) {
        var total = _.reduce(group, function (subtotal, txn) {
            if (txn.amount.debitOrCredit === 'debit') {
                return subtotal + txn.amount.amount;
            }
            return subtotal;
        }, 0);
        allGroupsTotal += total;

        // just grab first transaction to get rest of names in group
        var contains = categoryLookup[group[0].categoryName];
        // get list from mapping
        contains = categoryMapping[contains];

        groups[name] = {
            name: name,
            total: total,
            contains: contains,
        };
    });
    _.map(groups, function (group) {
        group.percent = Math.round(group.total / allGroupsTotal * 100);
        if (group.percent <= OTHER_PERCENT) {
            if (!groups.hasOwnProperty(OTHER_GROUP_NAME)) {
                groups[OTHER_GROUP_NAME] = {
                    name: OTHER_GROUP_NAME,
                    total: group.total,
                    percent: group.percent,
                };
            }
            else {
                groups[OTHER_GROUP_NAME].total += group.total;
                groups[OTHER_GROUP_NAME].percent += group.percent;
            }
            delete groups[group.name];
        }
    });

    groups = _.filter(groups, function (group) {
        return group.total > 0 || group.name === OTHER_GROUP_NAME;
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
var INTERACTION_OFFSET_Y = 70;
var PAINT_TIME = 2000;
var MAX_LOGGED_ITEMS = 16;
var WIDTH = 900;
var HEIGHT = 800;
var PaintedWorld = Vue.component('painted-world', {
    // inline style needs to be forced for text decoration to handle :visited for some reason
    template: applyCssModule(`
        <div class="Painting">
            <div class="slidedsadasdas js-painted-world PaintedWorld">
                <div class="Offscreen js-offscreen"></div>
                <div class="js-canvas"></div>
                <paint-controls
                    :reset="reset"
                    :download="download"
                    :showLog="showLog"
                    :isGrouped="isGrouped"
                    :isEnabled="canInteract"
                    :isLogVisible="isLogVisible"
                    :ctx="ctx"
                    v-on:grouped-updated="onGroupedUpdated"
                >
                </paint-controls>
                <div class="js-overlay"></div>
            </div>
            <div class="Log js-log"
                :class="{
                     'Log--visible': isLogVisible
                }">
                <a class="Button Button--close" @click="closeLog">Close</a>
                <div class="Log-preview js-log-preview"></div>
            </div>
        </div>
    `),
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
            isGrouped: false,
            isHueShiftAllowed: true,
            percentLoaded: 0,
            isLogVisible: false,
            repaintOnComplete: false, // for repainting on window resize
            paintOptions: {},
            lastWidth: 0, // resizing
        };
    },
    methods: {
        onGroupedUpdated: function (val) {
            this.isGrouped = val;
            this.reset();
        },

        reset: function () {
            this.paintOptions = {};
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

        saveToLog: function () {
            var imgData = this.ctx.canvas.toDataURL('image/png');
            var container = d3.select('.js-log-preview')
                .insert('div', ':first-child')
                .attr({
                    'class': 'Preview js-preview',
                });


            var img = container
                .append('img')
                .attr({
                    src: imgData,
                    'class': 'Preview-image js-preview-image',
                });

            container
                .append('a')
                .attr({
                    download: 'painted-world.png',
                    'class': 'Preview-download js-download',
                    target: '_blank',
                })
                    .append('span')
                    .attr({
                        'class': 'Preview-downloadText',
                    })
                    .text('Download');
            
            // dataURL is expensive to hover over/out (decodes image, resolves address), so only add the url on click
            var downloadBtn = container.select('.js-download')
            downloadBtn.on('click', function () {
                downloadBtn.attr({
                    'href': imgData,
                });
                // turn it off again to regain performance
                setTimeout(function () {
                    downloadBtn.attr({
                        'href': '',
                    });
                }, 1);
            });

            var previewElList = document.querySelectorAll('.js-preview');
            if (previewElList.length > MAX_LOGGED_ITEMS) {
                var previewEl = previewElList[previewElList.length - 1];
                container.select('.js-download').on('click', null);
                previewEl.remove();
            }
        },

        paint: function (repaintPrevious) {
            var opts = this.paintOptions;
            opts.brushes = this.paintOptions.brushes || [];

            var scale = Math.min(WIDTH, document.body.clientWidth) / WIDTH;
            this.lastWidth = document.body.clientWidth; // update for resize

            var heightOffset = (HEIGHT - scale * HEIGHT) / 2;
            this.setInteractionAllowed(false);
            this.labeler.cleanup();
            var ctx = this.ctx;
            var width = this.width;
            var height = this.height
            var nodes = this.nodes;

            ctx.clearRect(0, 0, width, height);
            var i = 0;
            var colorIndex = opts.colorIndex != null ? opts.colorIndex : Math.floor(Math.random() * this.images.colorThemes.length);
            var colorTheme = opts.colorTheme || this.images.colorThemes[colorIndex].image;
            var hues = opts.hues || this.images.colorThemes[colorIndex].hues;
            var hueShift = 0;
            if (this.isHueShiftAllowed) {
                hueShift = opts.hueShift != null ? opts.hueShift : hues[Math.floor(Math.random() * hues.length)];
            }
            var canvasTheme = opts.canvasTheme || this.images.canvases[Math.floor(Math.random() * this.images.canvases.length)];
            var count = nodes.length;

            opts.colorIndex = colorIndex;
            opts.colorTheme = colorTheme;
            opts.hues = hues;
            opts.hueShift = hueShift;
            opts.canvasTheme = canvasTheme;

            var onCompletePaint = function () {
                if (--count <= 0) {
                    if (this.repaintOnComplete) {
                        // this.reset();
                        this.repaintOnComplete = false;
                        this.paint(true);
                        return;
                    }

                    this.setInteractionAllowed(true);

                    // save to log
                    if (!repaintPrevious) {
                        this.saveToLog();
                    }
                }
            }.bind(this);

            // draw canvas at start so it's not so empty while things process
            this.ctx.drawImage(canvasTheme, 0, 0, this.width, this.height);

            // move canvas left to keep painting at center
            var scalePositionOffset = {
                x: (WIDTH - WIDTH * scale) / 2,
            };
            d3.select(this.ctx.canvas).style({left: -scalePositionOffset.x + 'px'});

            for (i = 0; i < nodes.length; i++) {
                var d = nodes[i];
                setTimeout((function (d, i) {
                    var savedBrush = opts.brushes[i] || {};
                    return function () {
                        this.painter.paint(
                            {
                                cx: d.x * scale + scalePositionOffset.x, // offset painting to keep it in center for small resizes
                                cy: d.y * scale + heightOffset,
                                radius: d.r * scale,
                                colorTheme: colorTheme,
                                hueShift: hueShift,
                                colorX: savedBrush.colorX,
                                colorY: savedBrush.colorY,
                                brushIndex: savedBrush.brushIndex,
                                brushAngle: savedBrush.brushAngle,
                            },
                            onCompletePaint
                        )
                            .then(function (brushOptions) {
                                this.paintOptions.brushes[i] = brushOptions;
                            }.bind(this));

                        this.labeler.write({
                            group: {
                                name: d.name,
                                amount: d.size,
                                percent: d.percent,
                                contains: d.contains,
                            },
                            scale: scale,
                            x: d.x * scale,
                            y: d.y * scale - INTERACTION_OFFSET_Y + heightOffset,
                            radius: d.r * scale,
                        });

                    }
                })(d,i).bind(this), repaintPrevious ? 0 : Math.random() * PAINT_TIME);
                // console.log('loading', Math.floor((i + 1) / nodes.length  * 100));
            }
            this.speckleCanvas(colorTheme, hueShift, repaintPrevious);
        },

        speckleCanvas: function (colorTheme, hueShift, repaintPrevious) {
            var scale = Math.min(WIDTH, document.body.clientWidth) / WIDTH;
            var numSplatters = Math.floor(Math.random() * 40) + 5;
            for (var i = 0; i < numSplatters; i++) {
                setTimeout(function () {
                    var size = Math.random() * 6 + 1;

                    this.painter.paint(
                        {
                            cx: Math.random() * this.width * scale,
                            cy: Math.random() * this.height,
                            radius: size,
                            hueShift: hueShift,
                            colorTheme: colorTheme,
                            opacity: size < 3
                                ? Math.random() * 0.3 + 0.5
                                : Math.random() * 0.3 + 0.1,
                        }
                    );
                }.bind(this), repaintPrevious ? 0 : Math.random() * PAINT_TIME / 2);
                // console.log('loading', Math.floor((i + 1) / nodes.length  * 100));
            }
        },

        createLayout: function () {
            var PACK_PADDING = 30;
            var PADDING = 80;
            var width = this.width;
            var height = this.height;
            var groups = organiseCategories(aggregateService.data, this.isGrouped);
            var data = {
                name : 'root',
                children : _.map(groups, function(group, i) {
                    var node = {};
                    node.name = group.name;
                    node.size = group.total;
                    node.percent = group.percent;
                    node.contains = group.contains;
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
            var width = WIDTH;//document.documentElement.clientWidth - margin.left - margin.right;
            var height = HEIGHT;

            var paintedWorld = d3.select('.js-painted-world');
            var canvasContainer = paintedWorld.select('.js-canvas');
            var overlayContainer = paintedWorld.select('.js-overlay');
            var offscreenContainer = paintedWorld.select('.js-offscreen');

            var dom = canvasContainer
                .append('canvas')
                    .attr({
                        width: width,
                        height: height,
                        'class': 'Canvas',
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

        closeLog: function () {
            this.isLogVisible = false;
        },
        showLog: function () {
            this.isLogVisible = true;
        },
    },
    mounted: function () {
        // var data = this.data;
        // console.log(data);
        // this.loadAll();

        this.setup();
        this.createLayout();
        this.paint();

        //https://davidwalsh.name/javascript-debounce-function
        var debounce = function(func, wait, immediate) {
            var timeout;
            return function() {
                var context = this, args = arguments;
                var later = function() {
                    timeout = null;
                    if (!immediate) func.apply(context, args);
                };
                var callNow = immediate && !timeout;
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
                if (callNow) func.apply(context, args);
            };
        };

        d3.select(window).on('resize', debounce(function () {
            if ((document.body.clientWidth >= WIDTH && this.lastWidth >= WIDTH) || this.lastWidth === document.body.clientWidth) return;
            if (this.canInteract) {
                this.paint(true);
            }
            else {
                this.repaintOnComplete = true;
            }
        }, 300).bind(this));
    },
});

export {
    PaintedWorld,
}
