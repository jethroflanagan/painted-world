import './painted-world';
import { EventBus, AGGREGATE_EVENT } from '../../event-bus';
import { applyCssModule, d3El, domEl, domElAll } from '../../helpers';

var AssetLoader = Vue.component('asset-loader', {
    // inline style needs to be forced for text decoration to handle :visited for some reason
    template: applyCssModule(`
        <div>
            <div class="AssetLoader" v-if="!isLoaded">
                <div class="AssetLoader-content" v-if="percentLoaded < 100">
                    <div>Loading... </div>
                    <div>{{percentLoaded}}%</div>
                </div>
                <div class="AssetLoader-content" v-if="percentLoaded === 100">
                    <div>Set your filter to make a painting</div>
                </div>
            </div>
            <painted-world v-if="isLoaded"
            :images="images"
            ></painted-world>
        </div>
    `),
    replace: true,
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
        draw: function (nodes) {
            for (i = 0; i < nodes.length; i++) {
                var d = nodes[i];
            }
        },

        loadImage: function (path, cb) {
            var img = new Image();   // Create new img element
            var deferred = (function (resolve, reject) {
                img.addEventListener("load", function() {
                    if (cb) cb();
                    resolve(img);
                }.bind(this), false);
            }).bind(this);
            var promise = new Promise(deferred);
            img.src = path;
            return promise;
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
        },

        loadAll: function () {
            // need to get references to the rev'd images from the webapp. Paths are solved automatically with those refs
            var imageRefList = _.map(domElAll('.js-image-ref img'), (img) => {
                return img.src;
            });
            var imagesToLoad = [
                // canvases
                'canvas1.jpg',
                'canvas2.jpg',
                'canvas3.jpg',
                'canvas4.jpg',
                // themes
                'color1.jpg',
                'color2.jpg',
                'color3.jpg',
                'label.png',
                // brushes
                'outline01.png',
                'outline02.png',
                'outline03.png',
                'outline04.png',
                'outline05.png',
                'outline06.png',
                'outline07.png',
                'outline08.png',
                'outline09.png',
                'outline10.png',
                'outline11.png',
                'outline12.png',
                'outline13.png',
                'outline14.png',
                'outline15.png',
                'outline16.png',
            ].map((path) => {
                // handle revving of assets
                var name = path.split('/').pop();
                for (var i = 0; i < imageRefList.length; i++) {
                    if (imageRefList[i].indexOf(name) === -1) continue;
                    return imageRefList[i];
                }
                return path;
            });
            // remove el so images aren't trying to load.
            domEl('.js-image-ref').remove();

            var onProgress = this.trackProgress(imagesToLoad.length, this.onUpdateMain).bind(this);

            var promise = Promise.all(
                _.map(imagesToLoad, function (path) {
                    return this.loadImage(path, onProgress);
                }.bind(this))
            )
                .then(function (images) {
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
                    num = i + incr;
                    for (; i < num; i++) {
                        this.images.labels.push(images[i]);
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
            // this.isLoaded = true;
        },
    },
    mounted: function () {
        EventBus.$on(AGGREGATE_EVENT, (e) => {

            // sigh
            setTimeout(() => {
                this.isLoaded = true;
            }, 300);
        });

        this.loadAll();
    },
});

export {
    AssetLoader,
}
