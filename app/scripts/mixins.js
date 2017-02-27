var prefix = 'paint-by-spending-';
var cssMixin = {
  methods: {
    resolveClasses: function (list) {
       list.split(' ').map(function (name) {
            return name.indexOf('js-') === -1
                ? prefix + name
                : name;
        }).join(' ');
    },
    updated: function () {
        console.log(this.template);
    },
  }
}

export default {
    cssMixin: cssMixin,
};
