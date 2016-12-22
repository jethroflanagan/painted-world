function Painter (opts) {
    var outputCtx = opts.outputCtx;
    var ctx = opts.ctx;
    var canvasWidth = opts.width;
    var canvasHeight = opts.height;
    var brushMasks = opts.brushMasks;
    var invertedBrushMasks;

    // cater for rotation possibly cutting images off
    var CANVAS_PADDING = 20;
    var brushOffset = {
        x: CANVAS_PADDING,
        y: CANVAS_PADDING,
    };
    var methods = {
        setup: function () {
            // var _this = this;
            // invertedBrushMasks = _.map(brushMasks, function (mask) {
            //     return _this.getInverted(mask, brushOffset, canvasWidth - brushOffset.x * 2, canvasHeight - brushOffset.y * 2);
            // });
            // console.log(invertedBrushMasks);
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

            // var invertedMask = brush.invertedMask;
            var colorTheme = brush.colorTheme;

            var brushWidth = diameter;
            var brushHeight = diameter;
            canvasWidth = brushWidth + CANVAS_PADDING * 2;
            canvasHeight = brushHeight + CANVAS_PADDING * 2;

            ctx.canvas.width = canvasWidth;
            ctx.canvas.height = canvasHeight;

            ctx.clearRect(0, 0, canvasWidth, canvasHeight);

            var mask = brushMasks[brushIndex];
            this.reset();
            this.paintInverted(mask, brushOffset, brushWidth, brushHeight);
            var invertedMask = this.saveLayer();
            this.reset();
            // ctx.save();
            // ctx.translate(canvasWidth/2,canvasHeight/2);
            // // rotate the canvas to the specified degrees
            // ctx.rotate(Math.random() *  Math.PI * 2);

            ctx.drawImage(mask, brushOffset.x, brushOffset.y, brushWidth, brushHeight);
            // ctx.restore();
            // ctx.save();

            // color
            ctx.globalCompositeOperation = 'source-atop';
            // var scale = 1.5;
            var colorX = /*-x * scale;//*/-Math.random() * (colorTheme.naturalWidth - brushWidth) + brushOffset.x;
            var colorY = /*-y * scale;//*/-Math.random() * (colorTheme.naturalHeight - brushHeight) + brushOffset.y;

            ctx.drawImage(colorTheme, colorX, colorY, colorTheme.naturalWidth, colorTheme.naturalHeight);

            // ctx.
            // ctx.drawImage(color, x, y, diameter, diameter);
            var base = this.saveLayer();

            this.reset();

            // draw Edge and mask it
            ctx.globalCompositeOperation = 'source-over';
            ctx.drawImage(base, 0, 0, canvasWidth, canvasHeight);
            ctx.globalCompositeOperation = 'source-in';
            this.paintEdge(invertedMask);
            var edge = this.saveLayer();

            this.reset();
            ctx.drawImage(mask, brushOffset.x, brushOffset.y, brushWidth, brushHeight);
            ctx.globalCompositeOperation = 'source-in';
            ctx.drawImage(edge, 0, 0, canvasWidth, canvasHeight);
            ctx.globalCompositeOperation = 'source-over';

            // this.reset();
            // ctx.globalCompositeOperation = 'source-over';


            // ctx.restore();

            edge = this.saveLayer();
            // this.reset();
            //
            // // use full canvas otherwise it scales image down. The full canvas is saved, so draw the full canvas
            ctx.drawImage(base, 0, 0, canvasWidth, canvasHeight);
            ctx.globalCompositeOperation = 'overlay';
            ctx.drawImage(edge, 0, 0, canvasWidth, canvasHeight);
            ctx.globalCompositeOperation = 'source-over';

            var composite = this.saveLayer();
            //
            this.reset();

            this.paintRotated(composite, brushOffset);
            composite = this.saveLayer();
            ctx.restore();

            // render
            outputCtx.globalAlpha = brush.opacity || 1;
            outputCtx.drawImage(composite, 0, 0, canvasWidth, canvasHeight,
                                           x - brushOffset.x, y - brushOffset.y, canvasWidth, canvasHeight);
            outputCtx.globalAlpha = 1;
        },

        paintRotated: function (img, brushOffset) {
            ctx.save();
            var angle = Math.random() * 2;

            ctx.translate(canvasWidth / 2, canvasHeight / 2);
            ctx.rotate(angle);
            ctx.drawImage(img, -canvasWidth / 2, -canvasHeight / 2, canvasWidth, canvasHeight);

            ctx.restore();
        },

        paintEdge: function (invertedMask) {
            // ctx
            // ctx.shadowColor = 'rgba(0,0,0,1)';
            // ctx.shadowBlur = 30;
            // ctx.shadowOffsetX = 0;
            // ctx.shadowOffsetY = 0;

            ctx.filter = 'blur(8px)';
            // for (var i = 0; i < 5; i++)
            ctx.drawImage(invertedMask, 0, 0, canvasWidth, canvasWidth);
            ctx.filter = 'none';
            // ctx.shadowColor = 'rgba(0,0,0,0)';
            // ctx.shadowBlur = 0;
            // ctx.shadowOffsetX = 0;
            // ctx.shadowOffsetY = 0;
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


        paintInverted: function (img, brushOffset, brushWidth, brushHeight) {
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            ctx.globalCompositeOperation = 'destination-out';
            ctx.drawImage(img, brushOffset.x, brushOffset.y, brushWidth, brushHeight);
            ctx.globalCompositeOperation = 'source-over';
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
