function Labeler (opts) {
    var outputCtx = opts.outputCtx;
    var ctx = opts.ctx;
    // var ctx = opts.ctx;
    var canvasWidth = opts.width;
    var canvasHeight = opts.height;
    var nodes = opts.nodes;

    // cater for rotation possibly cutting images off
    var methods = {
        setup: function () {
        },
        write: function (opts) {
            this.clear();
            var message = opts.message;
            var bounds = opts.bounds;
            var x = opts.x;
            var y = opts.y;

            ctx.fontSize = '16px';
            ctx.fontFamily = 'sans-serif';
            ctx.textAlign = 'start';
            ctx.textBaseline = 'top';
            var measurements = ctx.measureText(opts.message);
            console.log(measurements);
            ctx.fillText(opts.message, 0, 0);
            outputCtx.drawImage(this.saveLayer(), x, y);
        },

        createDummyText: function () {
            // function bboxText( svgDocument, string ) {
//     var data = svgDocument.createTextNode( string );
//
//     var svgElement = svgDocument.createElementNS( svgns, "text" );
//     svgElement.appendChild(data);
//
//     svgDocument.documentElement.appendChild( svgElement );
//
//     var bbox = svgElement.getBBox();
//
//     svgElement.parentNode.removeChild(svgElement);
//
//     return bbox;
// }
        },

        saveLayer: function () {
            var layer = document.createElement('img');
            layer.src = ctx.canvas.toDataURL('image/png');
            return layer;
        },

        clear: function () {
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        },
    };

    var _this = methods;
    _.map(methods, function (fn, name) {
        methods[name] = fn.bind(_this);
    });

    methods.setup();

    return {
        write: methods.write,
    };
}


export {
    Labeler,
}
