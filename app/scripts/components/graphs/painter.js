function Painter (opts) {
    var outputCtx = opts.outputCtx;
    var ctx = opts.ctx;
    var canvasWidth = opts.width;
    var canvasHeight = opts.height;
    var brushMasks = opts.brushMasks;

    var methods = {
        paint: function (brush) {
            ctx.save();
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);

            var radius = brush.radius;
            var diameter = radius * 2;
            var x = brush.cx - radius;
            var y = brush.cy - radius;

            var mask = brushMasks[0];
            // var invertedMask = brush.invertedMask;
            var color = brush.color;

            ctx.drawImage(mask, 0, 0, canvasWidth, canvasHeight);


            // color
            ctx.globalCompositeOperation = 'source-atop';
            console.log(color.clientWidth);
            ctx.drawImage(color, 0, 0, color.clientWidth, color.clientHeight);
            ctx.globalCompositeOperation = 'source-over';

            // ctx.
            // ctx.drawImage(color, x, y, diameter, diameter);
            var layer = this.saveLayer();

            ctx.restore();

            outputCtx.drawImage(layer, x, y, diameter, diameter);
        },

        saveLayer: function () {
            var layer = document.createElement('img');
            layer.src = ctx.canvas.toDataURL('image/png');
            return layer;
        },

        reset: function () {
            this.clear();
            ctx.restore();
        },

        clear: function () {
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        },


        getInverted: function (img) {
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
    };

    var _this = methods;
    _.map(methods, function (fn, name) {
        methods[name] = fn.bind(_this);
    });
// console.log('THIS', this);
    return {
        paint: methods.paint,
    };
}


export {
    Painter,
}
