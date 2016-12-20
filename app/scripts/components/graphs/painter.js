function Painter (opts) {
    var outputCtx = opts.outputCtx;
    var ctx = opts.ctx;
    var canvasWidth = opts.width;
    var canvasHeight = opts.height;
    var brushMasks = opts.brushMasks;
    var invertedBrushMasks;

    var methods = {
        setup: function () {
            var _this = this;
            invertedBrushMasks = _.map(brushMasks, function (mask) {
                return _this.getInverted(mask);
            });
            console.log(invertedBrushMasks);
        },

        // TODO paint at actual scale to improve performance
        paint: function (brush) {
            this.reset();
            ctx.save();
            var radius = brush.radius;
            var diameter = radius * 2;
            var x = brush.cx - radius;
            var y = brush.cy - radius;

            var brushIndex = Math.floor(Math.random() * brushMasks.length);

            var mask = brushMasks[brushIndex];
            var invertedMask = invertedBrushMasks[brushIndex];
            // var invertedMask = brush.invertedMask;
            var color = brush.color;
            canvasWidth = diameter;
            canvasHeight = diameter;
            ctx.canvas.width = canvasWidth;
            ctx.canvas.height = canvasHeight;

            ctx.clearRect(0, 0, canvasWidth, canvasHeight);

            // ctx.save();
            // ctx.translate(canvasWidth/2,canvasHeight/2);
            // // rotate the canvas to the specified degrees
            // ctx.rotate(Math.random() *  Math.PI * 2);

            ctx.drawImage(mask, 0, 0, canvasWidth, canvasHeight);
            // ctx.restore();
            // ctx.save();

            // color
            ctx.globalCompositeOperation = 'source-atop';

            var scaledColorWidth = color.naturalWidth //* canvasWidth / diameter;
            var scaledColorHeight = color.naturalHeight// * canvasHeight / diameter;

            var colorX = -Math.random() * (scaledColorWidth - canvasWidth);
            var colorY = -Math.random() * (scaledColorHeight - canvasHeight);

            ctx.drawImage(color, colorX, colorY, scaledColorWidth, scaledColorHeight);

            // ctx.
            // ctx.drawImage(color, x, y, diameter, diameter);
            var base = this.saveLayer();

            ctx.restore();
            ctx.save();
            // this.clear();

            // draw Edge and mask it
            // ctx.globalCompositeOperation = 'source-in';
            this.paintEdge(invertedMask, canvasWidth, canvasHeight);


            // ctx.restore();

            var edge = this.saveLayer();
            this.reset();

            ctx.drawImage(base, 0, 0, canvasWidth, canvasHeight);
            ctx.globalCompositeOperation = 'overlay';
            ctx.drawImage(edge, 0, 0, canvasWidth, canvasHeight);

            var composite = this.saveLayer();

            this.reset();

            this.paintRotated(composite, canvasWidth, canvasHeight);
            composite = this.saveLayer();
            // ctx.restore();

            // render
            outputCtx.drawImage(composite, x, y, canvasWidth, canvasHeight);
        },

        paintRotated: function (img, canvasWidth, canvasHeight) {
            ctx.save();
            var angle = Math.random() * 2;

            ctx.translate(canvasWidth / 2, canvasHeight / 2);
            ctx.rotate(angle);
            ctx.drawImage(img, -canvasWidth / 2, -canvasHeight / 2, canvasWidth, canvasHeight);

            ctx.restore();
        },

        paintEdge: function (invertedMask, canvasWidth, canvasHeight) {
            // ctx
            ctx.shadowColor = 'rgba(0,0,0,1)';
            ctx.shadowBlur = 10;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;

            ctx.drawImage(invertedMask, 0, 0, canvasWidth, canvasHeight);

            ctx.shadowColor = 'rgba(0,0,0,0)';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        },

        saveLayer: function () {
            var layer = document.createElement('img');
            layer.src = ctx.canvas.toDataURL('image/png');
            return layer;
        },

        reset: function () {
            this.clear();
            ctx.shadowColor = 'rgba(0,0,0,0)';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            // ctx.restore();
            ctx.globalCompositeOperation = 'source-over';
        },

        clear: function () {
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        },


        getInverted: function (img) {
            // offscreen.clearRect(0, 0, this.width, this.height);
            this.reset();
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            ctx.globalCompositeOperation = 'destination-out';
            ctx.drawImage(img, 0, 0, canvasWidth - 40, canvasHeight-40);
            ctx.restore();
            return this.saveLayer();
        },
    };

    var _this = methods;
    _.map(methods, function (fn, name) {
        methods[name] = fn.bind(_this);
    });

    methods.setup();

    return {
        paint: methods.paint,
    };
}


export {
    Painter,
}
