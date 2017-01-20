import { TextInput } from './text-input';

var PaintControls = Vue.component('paint-controls', {
    // inline style needs to be forced for text decoration to handle :visited for some reason
    template: `
        <div class="PaintControls" :class="{ 'PaintControls--disabled': !isEnabled }">
            <a class="Button Button--reset js-resetBtn" 
                :class="{ 'Button--disabled': !isEnabled }"
            >
                <span>Paint another</span>
            </a>
            <a class="Button Button--download js-downloadBtn" 
                download="painted-world.png" 
                style="text-decoration:none" 
                :class="{ 
                    'Button--disabled': !isEnabled,
                    'Button--hidden': isLogVisible,
                }"
                
            >
                <span>Download</span>
            </a>
            <label class="Checkbox Checkbox--grouped"
                for="grouped"
                :class="{ 'Checkbox--disabled': !isEnabled }"
            >
                <input class="Checkbox-field" type="checkbox" id="grouped"
                    @click="updateGrouped"
                    checked>
                <span class="Checkbox-box"></span>
                <span class="Checkbox-label">Group similar <span>categories</span></span>
            </label>
        </div>
    `,
    props: [
        'reset',
        'download',
        'showLog',
        'isEnabled',
        'ctx',
        'isLogVisible',
    ],
    data() {
        return {
            resetBtn: null,
            downloadBtn: null,
            isGrouped: true,
            get width () {
                if (!this.ctx) return 0;
                return this.ctx.canvas.width;
            },
            get height () {
                if (!this.ctx) return 0;
                return this.ctx.canvas.width;
            },
        };
    },
    methods: {
        runCb: function (cb) {
            return function () {
                if (this.isEnabled) {
                    cb();
                }
            }.bind(this);
        },
        updateGrouped: function (e) {
            this.$emit('grouped-updated', e.target.checked);
        },
    },
    mounted: function () {
        this.resetBtn = document.querySelector('.js-resetBtn');
        this.downloadBtn = document.querySelector('.js-downloadBtn');
        // this.logBtn = document.querySelector('.js-logBtn');

        this.resetBtn.addEventListener('mousedown', this.runCb(this.reset));
        this.downloadBtn.addEventListener('mousedown', this.runCb(this.showLog));
        // this.logBtn.addEventListener('mousedown', this.runCb(this.showLog));
    },
});

export {
    PaintControls,
}
