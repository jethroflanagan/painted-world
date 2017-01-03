import './painted-world';

var AssetLoader = Vue.component('asset-loader', {
    // inline style needs to be forced for text decoration to handle :visited for some reason
    template: `
        <div>
            <div class="AssetLoader" v-if="!isLoaded">
                <div>Loading... </div>
                <div>{{percentLoaded}}%</div>
            </div>

            <painted-world v-if="isLoaded"
                :images="images"
            ></painted-world>
        </div>
    `,
    props: [
    ],
    data() {
        return {
            isLoaded: false,
            percentLoaded: 0,
            images: {
                paintMasks: [],
                invertedPaintMasks: [],
                labels: [],
                colorThemes: [],
                canvases: [],
            },
        };
    },
    methods: {
        createLayout: function () {
            var PACK_PADDING = 30;
            var PADDING = 80;
            var width = 500;
            var height = 500;
            var groups = d3.range(20)
                .map(function () {
                    return {
                        name: group.name,
                        size: group.total,
                    };
                });
            var data = {
                name : 'root',
                children : groups,
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

            return nodes;
        },

        draw: function (nodes) {
            for (i = 0; i < nodes.length; i++) {
                var d = nodes[i];

            }
        },

        loadImage: function (path, cb) {
            var deferred = Q.defer();
            var img = new Image();   // Create new img element
            img.addEventListener("load", function() {
                if (cb) cb();
                deferred.resolve(img);
            }.bind(this), false);
            img.src = './images/' + path;
            return deferred.promise;
        },

        trackProgress: function (numAssets, onUpdate) {
            var loadCount = 0;
            var percentLoaded = 0;
            return function () {
                loadCount++;
                onUpdate(loadCount / numAssets);
            }.bind(this);
        },

        onUpdateMain: function (percent) {
            this.percentLoaded = Math.floor(percent * 100);
            console.log('p', this.percentLoaded);
        },

        loadAll: function () {
            var imagesToLoad = [
                // canvases
                'canvases/canvas1.jpg',
                'canvases/canvas2.jpg',
                'canvases/canvas3.jpg',
                'canvases/canvas4.jpg',

                // themes
                'colors/color1.jpg',
                'colors/color2.jpg',
                'colors/color3.jpg',
                // 'colors/color4.jpg'), // pure flat color for debg

                // labels
                // 'label/label1.png',
                // 'label/label2.png',
                // 'label/label3.png',
                // 'label/label4.png',
                // 'label/label5.png',
                'label.png',

                // brushes
                'brushes/outline01.png',
                'brushes/outline02.png',
                'brushes/outline03.png',
                'brushes/outline04.png',
                'brushes/outline05.png',
                'brushes/outline06.png',
                'brushes/outline07.png',
                'brushes/outline08.png',
                'brushes/outline09.png',
                'brushes/outline10.png',
                'brushes/outline11.png',
                'brushes/outline12.png',
                'brushes/outline13.png',
                'brushes/outline14.png',
                'brushes/outline15.png',
                'brushes/outline16.png',
            ];

            var onProgress = this.trackProgress(imagesToLoad.length, this.onUpdateMain);

            var promise = Q.all(
                _.map(imagesToLoad, function (path) {
                    return this.loadImage(path, onProgress);
                }.bind(this))
            )
                .then(function (images) {
                    // console.log('done', images);
                    var i = 0;
                    var incr = 4;
                    for (i = 0; i < incr; i++) {
                        this.images.canvases.push(images[i]);
                    }
                    incr = 3;
                    var num = i + incr;
                    for (; i < num; i++) {
                        var hues = [];
                        switch (i - num + incr) {
                            case 0:
                                hues = [0, -70, 180];
                                break;
                            case 1:
                                hues = [0, -130, -65];
                                break;
                            case 2:
                                hues = [0, 180, 20];
                                break;
                        }
                        this.images.colorThemes.push({
                            image: images[i],
                            hues: hues,
                        });
                    }
                    incr = 1;
                    var num = i + incr;
                    for (; i < num; i++) {
                        this.images.labels.push('images/label.png');
                        // this.images.labels.push(images[i]);
                    }
                    for (; i < images.length; i++) {
                        this.images.paintMasks.push(images[i]);
                    }
                    return true;
                }.bind(this))
                .then(this.onComplete)
                .catch(function (e) {
                    console.error(e);
                });

            return promise;
        },
        onComplete: function () {
            this.isLoaded = true;
        },
    },
    mounted: function () {
        this.loadAll();
    },
});

export {
    AssetLoader,
}
