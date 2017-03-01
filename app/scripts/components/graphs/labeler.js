import { resolveClasses } from '../../helpers';

function Labeler (opts) {
    var outputEl = opts.outputEl;
    var interactionEl = opts.interactionEl;
    var ctx = opts.ctx;
    var canvasWidth = opts.width;
    var canvasHeight = opts.height;
    var nodes = opts.nodes;
    var labelImages = opts.labelImages;
    var elements = [];

    // cater for rotation possibly cutting images off
    var methods = {
        setup: function () {
        },

        cleanup: function () {
            _.map(elements, function (el) {
                el.remove();
            });
            elements = [];
        },

        write: function (opts) {
            var group = opts.group;
            var radius = opts.radius;

            var rotationVariance = 10;
            var variation = 0;
            var yOffset = -radius * 0.75;
            var xOffset = -3;
            var x = Math.round(opts.x + Math.random() * variation - variation / 2 + xOffset);
            var y = Math.round(opts.y + Math.random() * variation - variation / 2 + yOffset);

            var label = this.addLayer(null, 'Label');
            var isFlipped = x > canvasWidth / 2 * opts.scale;
            label.setAttribute('style', [
                'left:' + x + 'px',
                'top:' + y + 'px',
                // 'transform: rotate(' + Math.round(Math.random() * 10 - 5) + 'deg)',
            ].join(';'));

            var labelContainer = this.addLayer(label, 'Label-rotate');
            labelContainer.setAttribute('style', [
                'transform: rotate(' + Math.round(Math.random() * rotationVariance - rotationVariance / 2) + 'deg)',
            ].join(';'));


            var labelBackground = this.addLayer(labelContainer, 'LabelText-background' + (isFlipped ? ' LabelText-background--flip' : ''));

            var hasGroupList = group.contains;
            if (hasGroupList && group.contains.length === 1 && group.contains[0] === group.name) {
                hasGroupList = false;
            }
            var labelText = this.addLayer(labelContainer, 'LabelText' + (isFlipped ? ' LabelText--flip' : '') + (hasGroupList ? ' LabelText--grouped': ''));

            this.addLayer(labelText, 'LabelText-name', group.name);
            if (hasGroupList) {
                this.addLayer(labelText, 'LabelText-groups', group.contains.join(', '));
            }

            var percent = Math.round(group.percent);
            if (percent === 0) {
                percent = 'less than 1%';
            }
            else {
                percent += '%';
            }
            this.addLayer(labelText, 'LabelText-percent', percent);
            this.addLayer(labelText, 'LabelText-amount', '(' + this.formatMoney(group.amount) + ')');

            this.createInteractionLayer(opts.x, opts.y, radius, label);

            elements.push(label);
            outputEl.appendChild(label);

        },

        createInteractionLayer: function (x, y, radius, label) {
            var hitlayer = this.addLayer(interactionEl, 'Label-hit')

            hitlayer.setAttribute('style', [
                'left:' + (x - radius) + 'px',
                'top:' + (y - radius) + 'px',
                'width:' + radius * 2 + 'px',
                'height:' + radius * 2 + 'px',
            ].join(';'));

            hitlayer.addEventListener('mouseover', function (e) {
                label.setAttribute('class', resolveClasses('Label Label--show'));
            });
            hitlayer.addEventListener('mouseout', function (e) {
                label.setAttribute('class', resolveClasses('Label Label--hide'));
            });
            elements.push(hitlayer);
            // hitlayer.addEventListener('touchstart', function (e) {
            //
            //     label.setAttribute('class', 'Label Label--show');
            // });
            // hitlayer.addEventListener('touchend', function (e) {
            //     label.setAttribute('class', 'Label');
            // });
        },

        formatMoney: function (val) {
            val = '' + Math.round(val);
            var rgx = /(\d+)(\d{3})/;
            while (rgx.test(val)) {
                val = val.replace(rgx, '$1' + ',' + '$2');
            }
            return 'R' + val;
        },

        addLayer: function (parent, className, text) {
            var layer = document.createElement('span');
            layer.setAttribute('class', resolveClasses(className));
            if (parent) {
                parent.appendChild(layer);
            }
            if (text) {
                layer.innerHTML = text;
            }
            return layer;
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
        cleanup: methods.cleanup,
    };
}


export {
    Labeler,
}
