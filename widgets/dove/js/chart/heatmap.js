/* 
 * Package: heatmap.js
 * 
 * Namespace: monarch.chart.heatmap
 * 
 * Class to create heatmaps
 * 
 * Parents: chart.js
 */

// Module and namespace checking.
if (typeof monarch == 'undefined') { var monarch = {};}
if (typeof monarch.chart == 'undefined') { monarch.chart = {};}

monarch.chart.heatmap = function(config, html_div, svg_class) {
    var self = this;
    monarch.chart.call(this, config, html_div, svg_class);
    
    self._is_a = 'heatmap';
    self.x = d3.scale.ordinal()
        .rangeRoundBands([0,config.width], .1);
    
    self.xAxis = d3.svg.axis()
        .scale(self.x)
        .orient("top");
    
    //grid color range, hardcode for now
    var gridColors = ['#a5d9d1', '#93d2c8', '#81cabf', '#6fc3b5',
                      '#5dbbac', '#4bb4a3', '#44A293']; //5% darker: 3c9082
    self.color = d3.scale.linear()
        .range(gridColors);
}

//heatmap extends chart
monarch.chart.heatmap.prototype = Object.create(monarch.chart.prototype);

//Sets domains for y0 (y axis) and y1 (subdomain of a single tick/group)
monarch.chart.heatmap.prototype.setXYDomains = function (data, groups, layout) {
    var self = this;
    
    self.y0.domain(data.map(function(d) { return d.id; }));
    self.y1.domain(groups).rangeRoundBands([0,0]);
    
    var xGroupMax = self.getGroupMax(data);
    self.color.domain([self.x0, xGroupMax]);
};

// Adds svg:rect element for each color well in the matrix
//monarch.chart.heatmap.prototype.makeColorWells = function (barGroup, htmlClass, scale) {
monarch.chart.heatmap.prototype.makeHorizontalStackedBars = function (barGroup, htmlClass, scale) {
    var self = this;

    //The g elements do not yet exist, selectAll creates
    // a place holder
    var barSelection = barGroup.selectAll('g')
          .data(function(d) { return d.counts; })
          .enter().append("rect")
          .attr("class", htmlClass)
           .style("fill", function(d) { return self.color(d.value); })
          .attr("height", self.y0.rangeBand()-2)
          .attr("y", function(d) { return self.y1(d.name); })
          .attr("x", function(d){
                return self.x(d.name)+2;
           })
           .attr("width", 11);
    
    return barSelection;
}