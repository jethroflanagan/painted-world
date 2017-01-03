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
            <label class="Checkbox Checkbox--messy"
                for="messy"
                :class="{ 'Checkbox--disabled': !isEnabled }"
            >
                <input class="Checkbox-field" type="checkbox" id="messy"
                    @click="updateMessy"
                    checked>
                <span class="Checkbox-box"></span>
                <span class="Checkbox-label">Messy</span>
            </label>
            <label class="Checkbox Checkbox--hue"
                for="hue"
                :class="{ 'Checkbox--disabled': !isEnabled }"
            >
                <input class="Checkbox-field" type="checkbox" id="hue"
                    @click="updateHue"
                    checked>
                <span class="Checkbox-box"></span>
                <span class="Checkbox-label">More colours</span>
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
            isMessy: true,
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
        updateMessy: function (e) {
            this.$emit('messy-updated', e.target.checked);
        },
        updateHue: function (e) {
            this.$emit('hue-updated', e.target.checked);
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
