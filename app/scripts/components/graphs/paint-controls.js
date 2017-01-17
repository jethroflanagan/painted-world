import { TextInput } from './text-input';

var PaintControls = Vue.component('paint-controls', {
    // inline style needs to be forced for text decoration to handle :visited for some reason
    template: `
        <div class="PaintControls" :class="{ 'PaintControls--disabled': !isEnabled }">
            <a class="Button Button--reset js-reset" :class="{ 'Button--disabled': !isEnabled }">
                Paint another
            </a>
            <a class="Button Button--download js-download" download="painted-world.png" style="text-decoration:none" :class="{ 'Button--disabled': !isEnabled }">
                Download
            </a>
            <label class="Checkbox Checkbox--grouped"
                for="grouped"
                :class="{ 'Checkbox--disabled': !isEnabled }"
            >
                <input class="Checkbox-field" type="checkbox" id="grouped"
                    @click="updateGrouped"
                    checked>
                <span class="Checkbox-box"></span>
                <span class="Checkbox-label"><span>Group</span> <span>similar</span> <span>categories</span></span>
            </label>
        </div>
    `,
    props: [
        'reset',
        'download',
        'isEnabled',
        'ctx',
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
        this.resetBtn = document.querySelector('.js-reset');
        this.downloadBtn = document.querySelector('.js-download');

        this.resetBtn.addEventListener('mousedown', this.runCb(this.reset));
        this.downloadBtn.addEventListener('mousedown', this.runCb(this.download));
    },
});

export {
    PaintControls,
}
