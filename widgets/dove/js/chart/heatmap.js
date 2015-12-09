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
    
    self.x = d3.scale.ordinal()
    .range([self.x0, config.width]);
    
    //grid color range, hardcode for now
    var gridColors = ['#a5d9d1', '#93d2c8', '#81cabf', '#6fc3b5',
                      '#5dbbac', '#4bb4a3', '#44A293']; //5% darker: 3c9082
    self.color = d3.scale.linear()
        .range(gridColors);
}

//heatmap extends chart
monarch.chart.heatmap.prototype = Object.create(monarch.chart.prototype);

//Adds svg:rect element for each color well in the matrix
monarch.chart.heatmap.prototype.setXYDomains = function (data, groups, facets) {
    var self = this;
    //Set y0 domain
    histogram.y0.domain(data.map(function(d) { return d.id; }));
    histogram.x.domain([histogram.x0, xGroupMax]);
    histogram.y1.domain(groups).rangeRoundBands([0, histogram.y0.rangeBand()]);
}

// Adds svg:rect element for each color well in the matrix
monarch.chart.heatmap.prototype.makeColorWell = function (barGroup, htmlClass, scale) {
    var self = this;

    //The g elements do not yet exists, selectAll creates
    // a place holder
    var barSelection = barGroup.selectAll('g')
          .data(function(d) { return d.counts; })
          .enter().append("rect")
          .attr("class", htmlClass)
          .attr("height", self.y0.rangeBand())
          .attr("y", function(d) { return self.y1(d.name); })
          .attr("x", function(d, i){
                return self.x( (i*15) + 10 );
           })
           .attr("width", 15);
    
    return barSelection;
}