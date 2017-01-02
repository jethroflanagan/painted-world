var Options = Vue.component('text-input', {
    // inline style needs to be forced for text decoration to handle :visited for some reason
    template: `
        <div class="TextInput">
            <label class="TextInput-label">{{label}}</label>
            <input class="TextInput-field" :type="type" :value="value">
        </div>
    `,
    props: [
        'value',
        'type',
        'label',
    ],
    data() {
        return {
        };
    },
    methods: {
    },
    mounted: function () {
    },
});

export {
    TextInput,
}
