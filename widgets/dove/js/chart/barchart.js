/* 
 * Package: barchart.js
 * 
 * Namespace: monarch.chart.barchart
 * 
 */

// Module and namespace checking.
if (typeof monarch == 'undefined') { var monarch = {};}
if (typeof monarch.chart == 'undefined') { monarch.chart = {};}

monarch.chart.barchart = function(config, html_div, svg_class) {
    var self = this;
    monarch.chart.call(this, config, html_div, svg_class);
    
    //Bar colors
    barColors = config.color.bars;
    self.color = d3.scale.ordinal()
        .range(Object.keys(barColors).map(function(k) { return barColors[k] }));
}

//barchart extends chart
monarch.chart.barchart.prototype = Object.create(monarch.chart.prototype);

/*
 * Makes svg rectangles in a grouped bar layout
 * Args
 *   - barGroup: d3.selection of each svg g element to hold the bars, with
 *               data bound to each element
 *               for example the output from chart.setGroupPositioning()
 * 
 * Returns d3.selection
 */
monarch.chart.barchart.prototype.makeHorizontalGroupedBars = function(barGroup, htmlClass) {
    var self = this;
    
    //The g elements do not yet exists, selectAll creates
    // a place holder
    var barSelection = barGroup.selectAll('g')
        .data(function(d) { return d.counts; })
        .enter().append("rect")
        .attr("class", htmlClass)
        .attr("height", self.y1.rangeBand())
        .attr("y", function(d) { return self.y1(d.name); })
        .attr("x", 1)
        .attr("width", 0);
    
    return barSelection;
};

/*
 * Makes horizontal svg rectangles in a stacked bar layout
 * Args
 *   - barGroup: d3.selection of each svg g element to hold the bars, with
 *               data bound to each element
 *               for example the output from chart.setGroupPositioning()
 * 
 * Returns d3.selection
 */
monarch.chart.barchart.prototype.makeHorizontalStackedBars = function(barGroup, htmlClass) {
    var self = this;
    
    //The g elements do not yet exists, selectAll creates
    // a place holder
    var barSelection = barGroup.selectAll('g')
        .data(function(d) { return d.counts; })
          .enter().append("rect")
          .attr("class", htmlClass)
          .attr("x", 1)
          .attr("width", 0)
          .attr("height", self.y0.rangeBand())
          .attr("y", function(d) { return self.y1(d.name); });
    
    return barSelection;
};

