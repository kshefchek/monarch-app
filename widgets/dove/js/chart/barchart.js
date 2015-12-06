/* 
 * Package: barchart.js
 * 
 * Namespace: monarch.chart.barchart
 * 
 */

// Module and namespace checking.
if (typeof monarch == 'undefined') { var monarch = {};}
if (typeof monarch.chart == 'undefined') { monarch.chart = {};}

monarch.chart.barchart = function(config, html_div, svg_class){
    var self = this;

    //Define scales
    // Lower value of a bar vertically
    self.y0 = d3.scale.ordinal()
        .rangeRoundBands([0,config.height], .1);
    
    //Upper value of a bar vertically
    self.y1 = d3.scale.ordinal();
    
    // Lower value of a bar horizontally
    self.x0 = 0;

    // Upper value of a bar horizontally
    self.x = d3.scale.linear()
        .range([self.x0, config.width]);
  
    //Bar colors
    barColors = config.color.bars;
    self.color = d3.scale.ordinal()
        .range(Object.keys(barColors).map(function(k) { return barColors[k] }));

    self.xAxis = d3.svg.axis()
        .scale(self.x)
        .orient("top")
        .tickFormat(d3.format(".2s"));

    self.yAxis = d3.svg.axis()
        .scale(self.y0)
        .orient("left");

    // Selects the g element for the entire chart, 
    // the direct child of the svg element
    self.svg = d3.select(html_div).select('.'+svg_class).select('g');
};

monarch.chart.barchart.prototype.setXTicks = function(config) {
    var self = this;
    //Set x axis ticks
    self.svg.append("g")
        .attr("class", "x axis")
        .call(self.xAxis)
        .style("font-size", config.xFontSize)
        .append("text")
        .attr("transform", "rotate(0)")
        .attr("y", config.xAxisPos.y)
        .attr("dx", config.xAxisPos.dx)
        .attr("dy", "0em")
        .style("text-anchor", "end")
        .style("font-size",config.xLabelFontSize)
        .text(config.xAxisLabel);
    
    return self;
};

monarch.chart.barchart.prototype.setYTicks = function() {
    var self = this;
    //Set Y axis ticks and labels
    self.svg.append("g")
        .attr("class", "y axis")
        .call(self.yAxis);
    
    return self;
}

monarch.chart.barchart.prototype.setLinearScale = function(width) {
    var self = this;
    self.x0 = 0;
    
    self.x = d3.scale.linear()
        .range([self.x0, width]);

    self.xAxis = d3.svg.axis()
        .scale(self.x)
        .orient("top")
        .tickFormat(d3.format(".2s"));
    
    return self;
};

monarch.chart.barchart.prototype.setLogScale = function(width) {
    var self = this;
    self.x0 = .1;
    
    self.x = d3.scale.log()
        .range([self.x0, width]);

    self.xAxis = d3.svg.axis()
        .scale(self.x)
        .orient("top")
        .ticks(5);
    
    return self;
};

monarch.chart.barchart.prototype.transitionYAxisToNewScale = function(duration) {
    var self = this;
    self.svg.transition().duration(duration)
        .select(".y.axis").call(self.yAxis);
};

monarch.chart.barchart.prototype.transitionXAxisToNewScale = function(duration) {
    var self = this;
    self.svg.transition()
        .duration(duration).select(".x.axis").call(self.xAxis);
};

//Adjusts the y axis labels in relation to axis ticks
monarch.chart.barchart.prototype.setYAxisTextSpacing = function(dx){
    var self = this;
    self.svg.select(".y.axis")
      .selectAll("text")
      .attr("dx", dx);
};