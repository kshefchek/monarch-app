/* 
 * Package: barchart.js
 * 
 * Namespace: monarch.chart.barchart
 * 
 * Class to create different types of barcharts,
 * horizontal stacked, grouped, and simple barcharts
 * are implemented
 * 
 * Parents: chart.js
 */

// Module and namespace checking.
if (typeof monarch == 'undefined') { var monarch = {};}
if (typeof monarch.chart == 'undefined') { monarch.chart = {};}

monarch.chart.barchart = function(config, html_div, svg_class) {
    var self = this;
    monarch.chart.call(this, config, html_div, svg_class);
    
    self._is_a = 'barchart';
    
    //Bar colors
    var barColors = config.color.bars;
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
monarch.chart.barchart.prototype.makeHorizontalGroupedBars = function(barGroup, htmlClass, scale) {
    var self = this;
    
    //The g elements do not yet exists, selectAll creates
    // a place holder
    var barSelection = barGroup.selectAll('g')
        .data(function(d) { return d.counts; })
        .enter().append("rect")
        .attr("class", htmlClass)
        .style("fill", function(d) { return self.color(d.name); })
        .attr("height", self.y1.rangeBand())
        .attr("y", function(d) { return self.y1(d.name); })
        .attr("x", 1)
        .attr("width", function(d) { 
            if ((scale === 'log' ) && ( d.value == 0 )){
              return 1;
            } else {
              return self.x(d.value); 
            }
         });
    
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
monarch.chart.barchart.prototype.makeHorizontalStackedBars = function(barGroup, htmlClass, scale) {
    var self = this;
    
    //The g elements do not yet exists, selectAll creates
    // a place holder
    var barSelection = barGroup.selectAll('g')
        .data(function(d) { return d.counts; })
          .enter().append("rect")
          .attr("class", htmlClass)
          .style("fill", function(d) { return self.color(d.name); })
          .attr("height", self.y0.rangeBand())
          .attr("y", function(d) { return self.y1(d.name); })
          .attr("x", function(d){
                if (d.x0 == 0){
                    return 1;
                } else { 
                  return self.x(d.x0);
                } 
           })
           .attr("width", function(d) { 
               if (d.x0 == 0 && d.x1 != 0){
                   return self.x(d.x1); 
               } else if ( ( scale === 'log' ) 
                       && ( self.x(d.x1) - self.x(d.x0) == 0 )) {
                   return 1;  
               } else {
                   return self.x(d.x1) - self.x(d.x0); 
               }
           });
    
    return barSelection;
};

monarch.chart.barchart.prototype.setXYDomains = function (data, groups, layout) {
    var self = this;
    //Set y0 domain
    self.y0.domain(data.map(function(d) { return d.id; }));
    
    if (typeof layout === 'undefined') {
        //fallback in case this option has not been passed
        layout = jQuery(self.html_div + ' input[name=mode]:checked').val();
    }
    
    //TODO improve checking of stacked/grouped configuration
    if (layout === 'grouped' || groups.length === 1){
        var xGroupMax = self.getGroupMax(data);
        self.x.domain([self.x0, xGroupMax]);
        self.y1.domain(groups)
            .rangeRoundBands([0, self.y0.rangeBand()]);
    } else if (layout === 'stacked'){
        var xStackMax = self.getStackMax(data);
        self.x.domain([self.x0, xStackMax]);
        self.y1.domain(groups).rangeRoundBands([0,0]);
    } else {
        self.y1.domain(groups)
            .rangeRoundBands([0, self.y0.rangeBand()]);
    }
};

