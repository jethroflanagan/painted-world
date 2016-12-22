function Themer (opts) {
    var ctx = opts.ctx;
    var canvasWidth = opts.width;
    var canvasHeight = opts.height;

    // cater for rotation possibly cutting images off
    var methods = {
        setup: function () {
        },
        changeHue
        hueShiftCanvas: function(subjectCanvasContext, shift){ //performs the operation in-place
        	var cw = subjectCanvasContext.canvas.width;
        	var ch = subjectCanvasContext.canvas.height;
        	var sdat = subjectCanvasContext.getImageData(0,0,cw,ch);
        	this.hueShiftCanvasOperation(sdat, sdat, cw, ch, shift);
        	subjectCanvasContext.putImageData(sdat,0,0);
        }

        hueShiftCanvasOperation: function(outData, inData, cw, ch, shift){
        	//configure hue rotation matrix:
        	var ma, mb, mc;
        	var md, me, mf;
        	var mg, mh, mi;
        	var h = (shift % 1 + 1) % 1; //wraps the angle to unit interval, even when negative
        	var th = h*3;
        	var thr = Math.floor(th);
        	var d = th - thr;
        	var b = 1 - d;
        	switch(thr){
        		case 0:
        			ma=b; mb=0; mc=d;
        			md=d; me=b; mf=0;
        			mg=0; mh=d; mi=b;
        		break;
        		case 1:
        			ma=0; mb=d; mc=b;
        			md=b; me=0; mf=d;
        			mg=d; mh=b; mi=0;
        		break;
        		case 2:
        			ma=d; mb=b; mc=0;
        			md=0; me=d; mf=b;
        			mg=b; mh=0; mi=d;
        		break;
        		default: throw new Error("h shouldn't be able to be 1.");
        	}
        	//do the pixels
        	var place=0;
        	for(var y=0; y<ch; ++y){
        		for(var x=0; x<cw; ++x){
        			place = 4*(y*cw + x);

        			var ir = inData[place+0];
        			var ig = inData[place+1];
        			var ib = inData[place+2];

        			outData[place+0] = Math.floor(ma*ir + mb*ig + mc*ib);
        			outData[place+1] = Math.floor(md*ir + me*ig + mf*ib);
        			outData[place+2] = Math.floor(mg*ir + mh*ig + mi*ib);
        			outData[place+3] = inData[place+3];
        		}
        	}
        }
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
    Themer,
}
