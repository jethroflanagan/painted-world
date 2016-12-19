// import { colors } from './../../config';
import { aggregateService } from '../../service/aggregate-service';

const generateUUID = () => {
    var d = new Date().getTime();
    if(window.performance && typeof window.performance.now === "function"){
        d += performance.now(); //use high-precision timer if available
    }
    // var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var uuid = 'axxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
};

const PaintedWorld = Vue.component('painted-world', {

    template: `
        <div class="painted-world"></div>
    `,
    props: [
        'data',
        'target',
    ],
    data() {
        return {
            graphId: generateUUID(),
            leftLabel: '',
            rightLabel: '',
        };
    },
    methods: {
    },
    mounted: function () {
        // var data = this.data;
        // console.log(data);
        var target = this.target;
        var margin = {top: 20, right: 20, bottom: 20, left: 20};
        var width = document.documentElement.clientWidth - margin.left - margin.right;
        var height = 500 - margin.top - margin.bottom;

        var svg = d3.select('.painted-world')
            .append('svg')
                .attr('width', width + margin.left + margin.right)
                .attr('height', height + margin.top + margin.bottom)
            .append('g')
                .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
        var data = {
            name : 'root',
            children : _.map(aggregateService.groups, function(group, name, i) {
                var node = {};
                node.name = name;
                node.size = group.total;
                return node;
            }),
        };
        var nodes = d3.layout.pack()
            .size([width, height])
            // .sort(null)
            .padding(10)
            .value(function (d) {
                return d.size;
            })
            .nodes(data)

        // remove root
        // nodes.shift();

        var getColor = d3.scale.category10();

        console.log(nodes);
        svg.selectAll('.group')
            .data(nodes)
            .enter()
                .append('circle')
                // .style('transform', function (d) {
                //     return 'translate(' + d.x + 'px ' + d.y + 'px)';
                // })
                .attr({
                    cx: function (d) { return d.x },
                    cy: function (d) { return d.y },
                    r: function (d) { return d.r },
                    fill: function (d, i) {
                        return getColor(i);
                    }
                })


    },
});

export {
    PaintedWorld,
}
