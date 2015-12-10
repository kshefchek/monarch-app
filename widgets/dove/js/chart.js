/* 
 * Package: chart.js
 * 
 * Namespace: monarch.chart
 * 
 * Generic chart class, a chart being defined as a chart
 * with an x and y axis (so ruling out some chart types
 * such as pie charts)
 * 
 * Defaults are set for horizontal charts,
 * y0 and x are d3 scales which convert
 * a series of data points to a position
 * on the graph axes, and y1 which converts
 * a series of groups to a position within
 * a single y axis tick mark (for grouped barcharts)
 * using domain and range functions
 * API docs for these functions/objects can be found here
 * https://github.com/mbostock/d3/wiki/Quantitative-Scales
 * https://github.com/mbostock/d3/wiki/Ordinal-Scales
 * 
 * Subclasses: barchart.js
 */

// Module and namespace checking.
if (typeof monarch == 'undefined') { var monarch = {};}

monarch.chart = function(config, html_div, svg_class){
    var self = this;


    
    
    /* self.y0
     * initialized as a scale object,
     * for example a d3.scale.ordinal(), 
     * which manages a set of discrete values
     * 
     * y0 is used to set the y axis domain
     * and positioning of elements such as 
     * horizontal bars
     */
    self.y0 = d3.scale.ordinal()
        .rangeRoundBands([0,config.height], .1);
    
    /* self.y1
     * initialized as a scale object,
     * for example a d3.scale.ordinal()
     * 
     * y1 is used for setting positioning within a single group
     * in a grouped barchart view, 
     * see monarch.chart.barchart.setXYDomains() and 
     * monarch.chart.barchart.makeHorizontalGroupedBars() and
     */
    self.y1 = d3.scale.ordinal();
    
    // Lower value of the x axis domain
    // Defaults to 0, and is set to .1 for log scales
    self.x0 = 0;

    /* self.x is a scale object, as
     * a default a d3.scale.linear which is both
     * an object and a function,
     * for example, this is used to set
     * the domain and range of the x axis and convert
     * count values to rect width attributes in barcharts
     */ 
    self.x = d3.scale.linear()
        .range([self.x0, config.width]);

    self.xAxis = d3.svg.axis()
        .scale(self.x)
        .orient("top")
        .tickFormat(d3.format(".2s"));

    self.yAxis = d3.svg.axis()
        .scale(self.y0)
        .orient("left");
    
    self.html_div = html_div;

    /* Selects the g element for the entire chart, 
     * the direct child of the svg element
     * this requires setting up a DOM with the structure
     *  <div class="html_div">
     *    <svg>
     *      <g>
     *      
     * TODO: initialize DOM if this fails
     */
    self.svg = d3.select(html_div).select('.'+svg_class).select('g');
};

/* 
 * Initialize/set X ordinal scale
 */
monarch.chart.prototype.setXOrdinalDomain = function (groups, width) {
    var self = this;
    
    self.x = d3.scale.ordinal()
        .domain(groups)
        .rangeRoundBands([0,width], .1);
    
    self.xAxis = d3.svg.axis()
        .scale(self.x)
        .orient("top");
}

monarch.chart.prototype.setXTicks = function(config) {
    var self = this;
    //Set x axis tick marks
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

monarch.chart.prototype.setYTicks = function() {
    var self = this;
    //Set Y axis tick marks
    self.svg.append("g")
        .attr("class", "y axis")
        .call(self.yAxis);
    
    return self;
}

monarch.chart.prototype.setLinearXScale = function(width) {
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

monarch.chart.prototype.setLogXScale = function(width) {
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

monarch.chart.prototype.transitionYAxisToNewScale = function(duration) {
    var self = this;
    self.svg.transition().duration(duration)
        .select(".y.axis").call(self.yAxis);
};

monarch.chart.prototype.transitionXAxisToNewScale = function(duration) {
    var self = this;
    self.svg.transition()
        .duration(duration).select(".x.axis").call(self.xAxis);
};

//Adjusts the y axis labels in relation to axis ticks
monarch.chart.prototype.setYAxisTextSpacing = function(dx){
    var self = this;
    self.svg.select(".y.axis")
      .selectAll("text")
      .attr("dx", dx);
};

//Adjusts the y axis labels in relation to axis ticks
monarch.chart.prototype.setXAxisLabels = function(degreesRotation, x, y, fontSize){
    var self = this;
    self.svg.select('.x.axis')
        .selectAll('text')
        .attr("transform", "rotate(" + degreesRotation + ")" )
        .attr("x", x )
        .attr("y", y )
        .style("font-size", fontSize) //Set the same size as y axis
        .style("text-anchor", "start");
};

/*
 * Create a svg g element for each y axis tick mark
 * On a concrete level this is used to group rectangles for
 * different views (stacked/grouped bars, heatmaps)
 * 
 * Returns: d3.selection
 */
monarch.chart.prototype.setGroupPositioning = function (data, config, htmlClass) {
    var self = this;

    var groupPos = self.svg.selectAll()
       .data(data)
       .enter().append("svg:g")
       .attr("class", htmlClass)
       .attr("transform", function(d) { return "translate(0," + self.y0(d.id) + ")"; })
       .on("click", function(d){
           if (config.isYLabelURL){
               document.location.href = config.yLabelBaseURL + d.id;
           }
       });
    return groupPos;
};

/* Get X Axis limit for grouped configuration
 * Could be refactored into a class that defines
 * a group of siblings
 */
monarch.chart.prototype.getGroupMax = function(data){
    return d3.max(data, function(d) { 
        return d3.max(d.counts, function(d) { return d.value; });
    });
};

/* Get X Axis limit for stacked configuration
 * Could be refactored into a class that defines
 * a group of siblings
 */
monarch.chart.prototype.getStackMax = function(data){
    return d3.max(data, function(d) { 
        return d3.max(d.counts, function(d) { return d.x1; });
    }); 
};

monarch.chart.prototype.getGroups = function(data) {
    var groups = [];
    var unique = {};
    for (var i=0, len=data.length; i<len; i++) { 
        for (var j=0, cLen=data[i].counts.length; j<cLen; j++) { 
            unique[ data[i].counts[j].name ] =1;
        }
    }
    groups = Object.keys(unique);
    return groups;
};