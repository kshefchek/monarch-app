/* 
 * Package: dovechart.js
 * 
 * Namespace: monarch.dovechart
 * 
 */

// Module and namespace checking.
if (typeof monarch == 'undefined') { var monarch = {};}

monarch.dovechart = function(config, tree, html_div, tree_builder){
    self = this;
    if (config == null || typeof config == 'undefined'){
        self.config = self.getDefaultConfig();
    } else {
        self.config = config;
    }
    
    //Check individual properties and set to default if null/undefined
    Object.keys(self).forEach(function(r) {
        if(self[r] == null){
            self[r] = self.getDefaultConfig()[r];
        }
    });
    
    self.setPolygonCoordinates();
    
    //Tooltip offsetting
    self.config.arrowOffset = {height: 21, width: -100};
    self.config.barOffset = {
                 grouped:{
                    height: 100,
                    width: 10
                  },
                  stacked:{
                    height: 85
                  }
    };
    
    if (self.config.isDynamicallyResized){
        self.config.graphSizingRatios = self.setSizingRatios();
    }

    self.level = 0; //Do away with this and just use self.parents.length
    self.config.initialHeight = config.height;
    self.parents = [];
    self.parents.push(tree.getRootID());
    self.html_div = html_div;
    self.tree = tree;
    self.tree_builder = tree_builder;

    self.tooltip = d3.select(self.html_div)
        .append("div")
        .attr("class", "tip");
        
    self.init = function(html_div, tree){
        var data = tree.getFirstSiblings();
        data = self.sortDataByGroupCount(data);
        self.groups = self.getGroups(data);
        var svg_class = "chart";
        self.makeGraphDOM(html_div, data, svg_class); 
        var histogram = new monarch.chart.heatmap(config, html_div, svg_class);
        var isFirstGraph = true;
        self.drawGraph(histogram, false, undefined, isFirstGraph);
    };
    
    self.init(html_div, tree);
};

//Uses JQuery to create the DOM for the dovechart
monarch.dovechart.prototype.makeGraphDOM = function(html_div, data, svg_class){
      var self = this;
      var config = self.config;
      var groups = self.groups;
      
      //Create html structure
      //Add graph title
      jQuery(html_div).append( "<div class=title"+
              " style=text-indent:" + config.title['text-indent'] +
              ";text-align:" + config.title['text-align'] +
              ";background-color:" + config.title['background-color'] +
              ";border-bottom-color:" + config.title['border-bottom-color'] +
              ";font-size:" + config.title['font-size'] +
              ";font-weight:" + config.title['font-weight'] +
              "; >"+config.chartTitle+"</div>" );
      jQuery(html_div).append( "<div class=interaction></div>" );
      jQuery(html_div+" .interaction").append( "<li></li>" );
         
      //Override breadcrumb config if subgraphs exist
      config.useCrumb = self.checkForChildren(data);
      
      //add breadcrumb div
      if (config.useCrumb){
          jQuery(html_div+" .interaction li").append("<div class=breadcrumbs></div>");
          d3.select(html_div).select(".breadcrumbs")
              .append("svg")
              .attr("height",(config.bread.height+2))
              .attr("width",config.bcWidth);
      }
      
      jQuery(html_div+" .interaction li").append("<div class=settings></div>");
      
      //Add stacked/grouped form if more than one group
      if (groups.length >1){
          self.makeGroupedStackedForm(html_div);
      }
      
      self.makeLogScaleCheckBox(html_div);
      
      jQuery(html_div+" .interaction li .settings").append(" <form class=zero"+
              " style=font-size:" + config.settingsFontSize + "; >" +
              "<label><input type=\"checkbox\" name=\"zero\"" +
              " value=\"remove\" checked> Remove Empty Groups</label> " +
              "</form> ");
      
      // Ajax spinner
      // TODO replace with a font awesome spinner
      jQuery(html_div+" .interaction li .settings").append("<div class=\"ajax-spinner\">"+
                          "<div class=\"ortholog-spinner\" > " +
                            "<div class=\"spinner-container container1\">" +
                              "<div class=\"circle1\"></div>" +
                              "<div class=\"circle2\"></div>" +
                              "<div class=\"circle3\"></div>" +
                              "<div class=\"circle4\"></div>" +
                            "</div>" +
                            "<div class=\"spinner-container container2\"> " +
                              "<div class=\"circle1\"></div>" +
                              "<div class=\"circle2\"></div>" +
                              "<div class=\"circle3\"></div>" +
                              "<div class=\"circle4\"></div>" +
                            "</div>" +
                            "<div class=\"spinner-container container3\">" +
                              "<div class=\"circle1\"></div>" +
                              "<div class=\"circle2\"></div>" +
                              "<div class=\"circle3\"></div>" +
                              "<div class=\"circle4\"></div>" +
                            "</div>" +
                          "</div>" +
                          "<div class='fetching'>Fetching Data...</div></div>" +
                          "<div class='error-msg'>Error Fetching Data</div>" +
                          "<div class='leaf-msg'></div>");
      
      d3.select(html_div).append("svg")
          .attr("class", svg_class)
          .attr("width", config.width + config.margin.left + config.margin.right)
          .attr("height", config.height + config.margin.top + config.margin.bottom)
          .append("g")
          .attr("transform", "translate(" + config.margin.left + "," + config.margin.top + ")");
      
      
      //jQuery(".ajax-spinner").show();
      //Update tooltip positioning
      if (!config.useCrumb && groups.length>1){
          config.arrowOffset.height = 14;
          config.barOffset.grouped.height = 102;
          config.barOffset.stacked.height = 81;
      } else if (!config.useCrumb){
          config.arrowOffset.height = -10;
          config.barOffset.grouped.height = 71;
          config.barOffset.stacked.height = 50;
      }
};

monarch.dovechart.prototype.makeLogScaleCheckBox = function (html_div){
    var config = this.config;
    jQuery(html_div+" .interaction li .settings").append("<span class=\"options\">Settings</span> <form class=scale"+
        " style=font-size:" + config.settingsFontSize + "; >" +
        "<label><input type=\"checkbox\" name=\"scale\"" +
        " value=\"log\"> Log Scale</label> " +
        "</form> ");
}

monarch.dovechart.prototype.makeGroupedStackedForm = function(html_div){
    var config = this.config;
    jQuery(html_div+" .interaction li .settings").append("<span class=\"layout\">Layout</span>" +
        " <form class=configure"+
        " style=font-size:" + config.settingsFontSize + "; >" +
        "<label><input id=\"stack\" type=\"radio\" name=\"mode\"" +
        " value=\"stacked\"> Stacked Barchart</label><br> " +
        "<label><input id=\"group\" type=\"radio\" name=\"mode\"" +
        " value=\"grouped\"> Grouped Barchart</label><br>" +
        "<label><input id=\"heatmap\" type=\"radio\" name=\"mode\"" +
        " value=\"heatmap\" checked > Heatmap</label>" +
        "</form>");
}

monarch.dovechart.prototype.makeLegend = function(histogram, barGroup){
    var self = this;
    var config = self.config;
    var data = self.tree.getDescendants(self.parents);
    
    //Set legend
    // The legend (g) elements do not yet exist,
    // selectAll creates a place holder
    var legend = histogram.svg.selectAll('.legend')
       .data(self.groups.slice())
       .enter().append("g")
       .attr("class", "legend")
       //.attr("class", function(d) {return "legend-"+d; })
       .style("opacity", function(d) {
           if (self.config.category_filter_list.indexOf(d) > -1) {
               return '.5';
           } else {
               return '1';
           }
       })
       .on("mouseover", function(){
           d3.select(this)
             .style("cursor", "pointer")
           d3.select(this).selectAll("rect")
             .style("stroke", histogram.color)
             .style("stroke-width", '2');
           d3.select(this).selectAll("text")
           .style('font-weight', 'bold');
        })
        .on("mouseout", function(){
           d3.select(this).selectAll("rect")
             .style("fill", histogram.color)
             .style("stroke", 'none');
           d3.select(this).selectAll("text")
             .style('fill', 'black')
             .style('font-weight', 'normal');
        })
        .on("click", function(d){
            if (self.config.category_filter_list.indexOf(d) > -1) {
                //Bring data back
                var index = self.config.category_filter_list.indexOf(d);
                self.config.category_filter_list.splice(index,1);
                
                self.transitionToNewGraph(histogram, data, barGroup);

                d3.select(this).style("opacity", '1');
                
            } else {
                self.config.category_filter_list.push(d);
                self.transitionToNewGraph(histogram, data, barGroup);
                d3.select(this).style("opacity", '.4');
            }
        })
       .attr("transform", function(d, i) { return "translate(0," + i * (config.legend.height+7) + ")"; });

    legend.append("rect")
       .attr("x", config.width+config.legend.width+45)//HARDCODE
       .attr("y", 6)
       .attr("width", config.legend.width)
       .attr("height", config.legend.height)
       .style("fill", histogram.color);

    legend.append("text")
       .attr("x", config.width+config.legend.width+40)
       .attr("y", 14)
       .attr("dy", config.legendText.height)
       .attr("font-size",config.legendFontSize)
       .style("text-anchor", "end")
       .text(function(d) { return d; });
};

monarch.dovechart.prototype.makeNavArrow = function(data, navigate, triangleDim, barGroup, bar, histogram){
    var self = this;
    var config = self.config;
    
    var arrow = navigate.selectAll(".tick")
        .data(data)
        .append("svg:polygon")
        .attr("class", "wedge")
        .attr("points",triangleDim)
        .attr("fill", config.color.arrow.fill)
        .attr("display", function(d){
            if (d.children && d.children[0]){ //TODO use tree API
                return "initial";
            } else {
                return "none";
            }
        })
        .on("mouseover", function(d){        
           if (d.children && d.children[0]){ //TODO use tree api
               self.displaySubClassTip(self.tooltip,this)
           } 
        })
        .on("mouseout", function(){
            d3.select(this)
              .style("fill",config.color.arrow.fill);
            self.tooltip.style("display", "none");
        })
        .on("click", function(d){
            if (d.children && d.children[0]){ //TODO use tree api
                self.transitionToNewGraph(histogram,d,
                        barGroup,bar, d.id);
            }
        });
};

monarch.dovechart.prototype.transitionToNewGraph = function(histogram, data, barGroup, bar, parent){
    self = this;
    config = self.config;
    self.tooltip.style("display", "none");
    if (histogram._is_a === 'barchart') {
        histogram.svg.selectAll(".tick").remove();
    } else {
        histogram.svg.select('.y.axis').selectAll(".tick").remove();
    }
    
    
    if (typeof bar === 'undefined') {
        var barClass = '.bar' + (self.parents.length-1);
        bar = d3.select(self.html_div).selectAll(barClass).selectAll('rect');
    }
    
    if (typeof parent != 'undefined'){
        self.level++;
        self.drawGraph(histogram, false, parent);
        self.removeSVGWithSelection(barGroup,650,60,1e-6);
        self.removeSVGWithSelection(bar,650,60,1e-6);
    } else {
        self.drawGraph(histogram);
        self.removeSVGWithSelection(barGroup,650,60,1e-6);
        self.removeSVGWithSelection(bar,650,60,1e-6);
        return;
    }
    //remove old bars
    self.removeSVGWithSelection(barGroup,650,60,1e-6);
    self.removeSVGWithSelection(bar,650,60,1e-6);
    
    if (config.useCrumb){
        self.makeBreadcrumb(histogram,data.label,self.groups,
                bar,barGroup,data.fullLabel);
    }
};

monarch.dovechart.prototype.removeSVGWithSelection = function(select, duration, y, opacity){
    select.transition()
        .duration(duration)
        .attr("y", y)
        .style("fill-opacity", opacity)
        .remove();
};

monarch.dovechart.prototype.removeSVGWithClass = function(histogram, htmlClass, duration, y, opacity){
    d3.select(self.html_div+' .chart').selectAll(htmlClass).transition()
        .duration(duration)
        .attr("y", y)
        .style("fill-opacity", opacity)
        .remove();
};

monarch.dovechart.prototype.removeRectInGroup = function(histogram, barGroup, duration, y, opacity){
    d3.select(self.html_div+' .chart').selectAll(barGroup).selectAll("rect").transition()
        .duration(duration)
        .attr("y", y)
        .style("fill-opacity", opacity)
        .remove();
};

monarch.dovechart.prototype.displaySubClassTip = function(tooltip, d3Selection){
    var self = this;
    var config = self.config;
    d3.select(d3Selection)
      .style("fill", config.color.arrow.hover);

    var coords = d3.transform(d3.select(d3Selection.parentNode)
            .attr("transform")).translate;
    var h = coords[1];
    var w = coords[0];
    
    tooltip.style("display", "block")
      .html('Click&nbsp;to&nbsp;see&nbsp;subclasses')
      .style("top",h+config.margin.top+config.bread.height+
             config.arrowOffset.height+"px")
      .style("left",w+config.margin.left+config.arrowOffset.width+"px");
};

monarch.dovechart.prototype.getCountMessage = function(value, name){
    return "Counts: "+"<span style='font-weight:bold'>"+value+"</span>"+"<br/>"
            +"Organism: "+ "<span style='font-weight:bold'>"+name;
};

monarch.dovechart.prototype.displayCountTip = function(tooltip, value, name, d3Selection, barLayout){
    var self = this;
    var config = self.config;
    var coords = d3.transform(d3.select(d3Selection.parentNode)
            .attr("transform")).translate;
    var w = coords[0];
    var h = coords[1];
    var heightOffset = d3Selection.getBBox().y;
    var widthOffset = d3Selection.getBBox().width;
    
    tooltip.style("display", "block")
    .html(self.getCountMessage(value,name));
    if (barLayout == 'grouped'){
        tooltip.style("top",h+heightOffset+config.barOffset.grouped.height+"px")
        .style("left",w+config.barOffset.grouped.width+widthOffset+
                config.margin.left+"px");
    } else if (barLayout == 'stacked'){
        tooltip.style("top",h+heightOffset+config.barOffset.stacked.height+"px")
        .style("left",w+config.barOffset.grouped.width+widthOffset+
                config.margin.left+"px");
    }
};

monarch.dovechart.prototype.makeBar = function (barGroup, histogram, barLayout, isFirstGraph) {
    var bar;
    var self = this;
    var config = self.config;
    //Class for each svg rectangle element
    var htmlClass = "rect" + self.level;
    var scale = 'linear';
    if ( jQuery(self.html_div + ' input[name=scale]:checked').val() === 'log' ) {
        scale = 'log';
    }
    
    //Create bars 
    if (barLayout == 'grouped'){
        bar = histogram.makeHorizontalGroupedBars(barGroup, htmlClass, scale);
        
        //Mouseover/out events
        bar.on("mouseover", function(d){
            d3.select(this)
              .style("fill", config.color.bar.fill);
              self.displayCountTip(self.tooltip, d.value, d.name, this, 'grouped');
          })
          .on("mouseout", function(){
            d3.select(this)
              .style("fill", function(d) { return histogram.color(d.name); });
            self.tooltip.style("display", "none");
          })
          
        
        if (isFirstGraph){
            bar.attr("width", 0);
            self.transitionFromZero(bar,histogram,barLayout);
        }
        
    } else if (barLayout == 'stacked') {
        bar = histogram.makeHorizontalStackedBars(barGroup, htmlClass);
  
        bar.on("mouseover", function(d){
            d3.select(this)
              .style("fill", config.color.bar.fill);
            self.displayCountTip(self.tooltip,d.value,d.name,this,'stacked');

          })
          .on("mouseout", function(){
            d3.select(this)
              .style("fill", function(d) { return histogram.color(d.name); });
            self.tooltip.style("display", "none");
          })
        
        if (isFirstGraph){
            bar.attr("width", 0)
                .attr("x", 1);
            self.transitionFromZero(bar,histogram,barLayout);
        }
    }
    return bar;
};

//Transition bars from a width of 0 to their respective positions
monarch.dovechart.prototype.transitionFromZero = function (bar, histogram, barLayout) {
    var self = this;
    if (barLayout == 'grouped'){
        bar.transition()
        .duration(800)
        .delay(function(d, i, j) { return j * 20; })
        // Note theres some duplication of code here and in
        // barchart.makeHorizontalGroupedBars
        .attr("x", 1)
        .attr("width", function(d) { 
        if (( jQuery(self.html_div + ' input[name=scale]:checked').val() === 'log' )
                && ( d.value == 0 )){
          return 1;
      } else {
          return histogram.x(d.value); 
      }
        });     
    } else if (barLayout == 'stacked') {
        bar.transition()
        .duration(800)
        .delay(function(d, i, j) { return j * 20; })
        // Note theres some duplication of code here and in
        // barchart.makeHorizontalStackedBars
        .attr("x", function(d){
            if (d.x0 == 0){
                return 1;
            } else { 
                return histogram.x(d.x0);
            } 
        })
        .attr("width", function(d) { 
            if (d.x0 == 0 && d.x1 != 0){
                return histogram.x(d.x1); 
            } else if (( jQuery(self.html_div + ' input[name=scale]:checked').val() === 'log' ) &&
                 ( histogram.x(d.x1) - histogram.x(d.x0) == 0 )){
                return 1;  
            } else {
                return histogram.x(d.x1) - histogram.x(d.x0); 
            }
        });
    }
};

monarch.dovechart.prototype.transitionGrouped = function (histogram, data, groups, bar) {
    var self = this;
    var config = self.config;
    histogram.setXYDomains(data, groups, 'grouped');
    histogram.transitionXAxisToNewScale(750);
          
    bar.transition()
      .duration(500)
      .delay(function(d, i, j) { return j * 30; })
      .attr("height", histogram.y1.rangeBand())
      .attr("y", function(d) { return histogram.y1(d.name); })  
      .transition()
      .attr("x", 1)
      .attr("width", function(d) { 
          if (( jQuery(self.html_div + ' input[name=scale]:checked').val() === 'log' ) &&
              ( d.value == 0 )){
              return 1;
          } else {
              return histogram.x(d.value); 
          }
      });
          
    bar.on("mouseover", function(d){
            
        d3.select(this)
        .style("fill", config.color.bar.fill);
        self.displayCountTip(self.tooltip,d.value,d.name,this,'grouped');
    })
    .on("mouseout", function(){
        self.tooltip.style("display", "none")
        d3.select(this)
        .style("fill", function(d) { return histogram.color(d.name); });
    })
};

monarch.dovechart.prototype.transitionStacked = function (histogram, data, groups, bar) {
    var self = this;
    var config = self.config;
    histogram.setXYDomains(data, groups, 'stacked');
    histogram.transitionXAxisToNewScale(750);
         
    bar.transition()
      .duration(500)
      .delay(function(d, i, j) { return j * 30; })
      .attr("x", function(d){
              if (d.x0 == 0){
                  return 1;
              } else { 
                return histogram.x(d.x0);
              } 
      })
      .attr("width", function(d) { 
          if (d.x0 == 0 && d.x1 != 0){
              return histogram.x(d.x1); 
          } else if (( jQuery(self.html_div + ' input[name=scale]:checked').val() === 'log' ) &&
                     ( histogram.x(d.x1) - histogram.x(d.x0) == 0 )){
              return 1;  
          } else {
              return histogram.x(d.x1) - histogram.x(d.x0); 
          }
      })
      .transition()
      .attr("height", histogram.y0.rangeBand())
      .attr("y", function(d) { return histogram.y1(d.name); })
      
    bar.on("mouseover", function(d){
            
        d3.select(this)
            .style("fill", config.color.bar.fill);
                self.displayCountTip(self.tooltip,d.value,d.name,this,'stacked');
    })
    .on("mouseout", function(){
        self.tooltip.style("display", "none");
        d3.select(this)
        .style("fill", function(d) { return histogram.color(d.name); });
    })
};

monarch.dovechart.prototype.drawGraph = function (histogram, isFromCrumb, parent, isFirstGraph) {
    var self = this;
    var config = self.config;
    
    if (typeof parent != 'undefined'){
      //  self.parents.push(parent);
    }
    
    var data = self.tree.getDescendants(self.parents);

    self.checkData(data);
    data = self.setDataPerSettings(data);
    
    if (!isFromCrumb){
        data = self.addEllipsisToLabel(data,config.maxLabelSize);
    }

    if (data.length > 25 && self.config.height == self.config.initialHeight){
        self.config.height = data.length * 14.05;
        d3.select(self.html_div+' .chart')
            .attr("height", self.config.height + config.margin.top + config.margin.bottom);
    } else if (data.length > 25 && self.config.height != self.config.initialHeight){
        self.config.height = data.length * 14.05;
        d3.select(self.html_div+' .chart')
            .attr("height", self.config.height + config.margin.top + config.margin.bottom);
    } else if (data.length <= 25 && self.config.height != self.config.initialHeight ) {
        self.config.height = self.config.initialHeight;
        d3.select(self.html_div+' .chart')
            .attr("height", self.config.height + config.margin.top + config.margin.bottom);
    }
    
    data = self.getStackedStats(data);
    // This needs to be above the removeCategories() call to avoid
    // Y axis labels reordering when adding/removing categories
    data = self.sortDataByGroupCount(data);
    
    if (self.config.category_filter_list.length > 0 ) {
        data = self.removeCategories(data, self.config.category_filter_list);
    }

    if (self.groups.length == 1 && isFirstGraph){
        config.barOffset.grouped.height = config.barOffset.grouped.height+8;
        config.barOffset.stacked.height = config.barOffset.stacked.height+8;
    }

    var height = self.resizeChart(data);
    //reset d3 config after changing height
    histogram.y0 = d3.scale.ordinal()
        .rangeRoundBands([0,height], .1);
            
    histogram.yAxis = d3.svg.axis()
        .scale(histogram.y0)
        .orient("left");
    
    self.changeScalePerSettings(histogram);
    
    var layout = self.getValueOfCheckbox('mode');
    
    histogram.setXYDomains(data, self.groups, layout);
    
    if (histogram._is_a === 'heatmap') {
        // Set ordinal scale
        var width = config.width - 55; //Hack to have chart form an even grid
        histogram.setXOrdinalDomain(self.groups, width);
        
        //Set tick size to 0 (removes tick marks)
        histogram.yAxis.tickSize(0);
        histogram.xAxis.tickSize(0);
        
    }
    
    if (isFirstGraph){
        histogram.setXTicks(config).setYTicks();
    }
    
    //Dynamically decrease font size for large labels
    var yFontSize = self.adjustYAxisElements(data.length);
    
    histogram.transitionYAxisToNewScale(1000);
    
    if (histogram._is_a === 'heatmap') {
        // Adjust x axis labels, font size same as y labels
        // setXAxisLabels(degreesRotation, x, y, fontSize)
        histogram.setXAxisLabels(-50, 2, -1, yFontSize);
        
        // Remove axis lines/paths
        histogram.svg.selectAll(".axis").select("path")
        .style('display', 'none');
    }
    
    //Create SVG:G element that holds groups
    var htmlClass = "bar" + self.level;
    var yAxisGroup = histogram.setGroupPositioning(data, self.config, htmlClass);
    
    // showTransition controls if a new view results in bars expanding
    // from zero to their respective positions
    var showTransition = false;
    if (isFirstGraph) {
        showTransition = true;
    }
    //Make legend
    if (isFirstGraph && histogram._is_a === 'barchart'){
        //Create legend
        if (config.useLegend){
            self.makeLegend(histogram, yAxisGroup);
        }
    }
    
    if (histogram._is_a === 'barchart') {
        //TODO rename this variable, are these selections?
        var bar = self.setBarConfigPerCheckBox(histogram,data,self.groups,yAxisGroup,showTransition);
        
    } else if (histogram._is_a === 'heatmap') {
        var bar = histogram.makeColorWells(yAxisGroup, htmlClass);
    }
    
    self.setYAxisHandlers(histogram, data, yAxisGroup, bar, yFontSize);
    
    //Create navigation arrow
    var navigate = histogram.svg.selectAll(".y.axis");
    /*self.makeNavArrow(data,navigate,config.arrowDim,
                           yAxisGroup,bar,histogram);
    if (!self.checkForChildren(data)){
        histogram.setYAxisTextSpacing(0);
        histogram.svg.selectAll("polygon.wedge").remove();
    }*/
    // We're just going to remove the wedges for now
    histogram.setYAxisTextSpacing(0);
    //histogram.svg.selectAll("polygon.wedge").remove();
    
    //Make first breadcrumb
    if (config.useCrumb && isFirstGraph){
        self.makeBreadcrumb(histogram,self.tree.getRootLabel(),
                                 self.groups,bar,yAxisGroup);
    }
    
    // Some functions to controll the configurations box
    d3.select(self.html_div).select('.configure')
      .on("change",function(){
          self.changeBarConfig(histogram,data,self.groups,bar);});
    
    d3.select(self.html_div).select('.scale')
    .on("change",function(){
        self.changeScalePerSettings(histogram);
        if (self.groups.length > 1){
            //reuse change bar config
            self.changeBarConfig(histogram,data,self.groups,bar);
        } else {
            self.transitionGrouped(histogram,data,self.groups,bar);
        }
    });
    
    d3.select(self.html_div).select('.zero')
    .on("change",function(){
        self.transitionToNewGraph(histogram,data,yAxisGroup,bar);
    });
};

//
monarch.dovechart.prototype.setDataPerSettings = function(data){
    var self = this;
    if (self.checkValueOfCheckbox('zero','remove')){
        data = self.removeZeroCounts(data);
    }
    data = self.removeIdWithoutLabel(data);
    return data;
}
// Generic function to check the value of a checkbox given it's name
// and value
monarch.dovechart.prototype.checkValueOfCheckbox = function(name,value){
    var self = this;
    if (jQuery(self.html_div + ' input[name='+name+']:checked').val() === value){
        return true;
    } else if (typeof jQuery(self.html_div + ' input[name=zero]:checked').val() === 'undefined'){
        return false;
    }
};

//Generic function to get the value of a checkbox given it's name
monarch.dovechart.prototype.getValueOfCheckbox = function(name){
    var self = this;
    if (jQuery(self.html_div + ' input[name='+name+']:checked').val() != null){
        return jQuery(self.html_div + ' input[name='+name+']:checked').val();
    } else {
        return false;
    }
};

monarch.dovechart.prototype.changeScalePerSettings = function(histogram){
    var self = this;
    if (histogram._is_a === 'barchart') {
        if (self.checkValueOfCheckbox('scale','log')){
            histogram.setLogXScale(self.config.width);
        } else {
            histogram.setLinearXScale(self.config.width);
        }
    } else if (histogram._is_a === 'heatmap') {
        //not implemented
    }
};

monarch.dovechart.prototype.changeBarConfig = function(histogram, data, groups, bar){
    var self = this;
    if (typeof bar === 'undefined') {
        var barClass = '.bar' + (self.parents.length-1);
        bar = d3.select(self.html_div).selectAll(barClass).selectAll('rect');
    }
    if (self.checkValueOfCheckbox('mode','grouped')){
        self.transitionGrouped(histogram,data,groups,bar);
    } else if (self.checkValueOfCheckbox('mode','stacked')) {
        self.transitionStacked(histogram,data,groups,bar);
    }
};

//Resize height of chart after transition
monarch.dovechart.prototype.resizeChart = function(data){
    var self = this;
    var config = self.config;
    var height = config.height;

    if (data.length < 25){
         height = data.length*26; 
         if (height > config.height){
             height = config.height;
         }
    }
    return height;
};

monarch.dovechart.prototype.pickUpBreadcrumb = function(histogram, index, groups, bar, barGroup) {
    var self = this;
    var config = self.config;
    var isFromCrumb = true;
    var barClass = ".bar"+self.level;
    //set global level
    self.level = index;
    var parentLen = self.parents.length;
    
    jQuery(self.html_div+" .leaf-msg").hide();

    // Remove all elements following (index+1).
    // parentLen is greater than the number of elements remaining, but that's OK with splice()
    self.parents.splice(index + 1,(parentLen));

    d3.select(self.html_div+' .chart').selectAll(".tick").remove();
    self.drawGraph(histogram,isFromCrumb);

    for (var i=(index+1); i <= parentLen; i++){
        d3.select(self.html_div).select(".bread"+i).remove();
    }
    self.removeSVGWithClass(histogram,barClass,750,60,1e-6);
    self.removeRectInGroup(histogram,barClass,750,60,1e-6);
    
    //Deactivate top level crumb
    if (config.useCrumbShape){
        d3.select(self.html_div).select(".poly"+index)
          .attr("fill", config.color.crumb.top)
          .on("mouseover", function(){})
          .on("mouseout", function(){
              d3.select(this)
                .attr("fill", config.color.crumb.top);
          })
          .on("click", function(){});
        
        d3.select(self.html_div).select(".text"+index)
        .on("mouseover", function(){})
        .on("mouseout", function(){
             d3.select(this.parentNode)
             .select("polygon")
             .attr("fill", config.color.crumb.top);
        })
        .on("click", function(){});
    } else {
        d3.select(self.html_div).select(".text"+index)
          .style("fill",config.color.crumbText)
          .on("mouseover", function(){})
          .on("mouseout", function(){})
          .on("click", function(){});
    }
};

monarch.dovechart.prototype.makeBreadcrumb = function(histogram, label, groups, bar, phenoDiv, fullLabel) {
    var self = this;
    var config = self.config;
    var html_div = self.html_div;
    var index = self.level;
    
    if (!label){
        label = config.firstCrumb;
    }
    var lastIndex = (index-1);
    var phenLen = label.length;
    var fontSize = config.crumbFontSize;

    //Change color of previous crumb
    if (lastIndex > -1){
        if (config.useCrumbShape){
            d3.select(html_div).select(".poly"+lastIndex)
                .attr("fill", config.color.crumb.bottom)
                .on("mouseover", function(){
                d3.select(this)
                  .attr("fill", config.color.crumb.hover);
            })
            .on("mouseout", function(){
                d3.select(this)
               .attr("fill", config.color.crumb.bottom);
            })
            .on("click", function(){
                self.pickUpBreadcrumb(histogram,lastIndex,groups,bar,phenoDiv);
            });
        }
        
        d3.select(html_div).select(".text"+lastIndex)
          .on("mouseover", function(){
              d3.select(this.parentNode)
               .select("polygon")
               .attr("fill", config.color.crumb.hover);
              
              if (!config.useCrumbShape){
                  d3.select(this)
                    .style("fill",config.color.crumb.hover);
              }
          })
          .on("mouseout", function(){
              d3.select(this.parentNode)
               .select("polygon")
               .attr("fill", config.color.crumb.bottom);
              if (!config.useCrumbShape){
                  d3.select(this)
                    .style("fill",config.color.crumbText);
              }
          })
          .on("click", function(){
                self.pickUpBreadcrumb(histogram,lastIndex,groups,bar,phenoDiv);
          });
    }
    
    d3.select(html_div).select(".breadcrumbs")
    .select("svg")
    .append("g")  
    .attr("class",("bread"+index))
    .attr("transform", "translate(" + index*(config.bread.offset+config.bread.space) + ", 0)");
    
    if (config.useCrumbShape){
        
        d3.select(html_div).select((".bread"+index))
        .append("svg:polygon")
        .attr("class",("poly"+index))
        .attr("points",index ? config.trailCrumbs : config.firstCr)
        .attr("fill", config.color.crumb.top);
        
    } 
    
    //This creates the hover tooltip
    if (fullLabel){
        d3.select(html_div).select((".bread"+index))
            .append("svg:title")
            .text(fullLabel);
    } else { 
        d3.select(html_div).select((".bread"+index))
            .append("svg:title")
            .text(label);
    }
           
    d3.select(html_div).select((".bread"+index))
        .append("text")
        .style("fill",config.color.crumbText)
        .attr("class",("text"+index))
        .attr("font-size", fontSize)
        .each(function () {
            var words = label.split(/\s|\/|\-/);
            var len = words.length;
            if (len > 2 && !label.match(/head and neck/i)){
                words.splice(2,len);
                words[1]=words[1]+"...";
            }
            len = words.length;
            for (i = 0;i < len; i++) {
                if (words[i].length > 12){
                    fontSize = ((1/words[i].length)*150);
                    var reg = new RegExp("(.{"+8+"})(.+)");
                    words[i] = words[i].replace(reg,"$1...");
                }
            }
            //Check that we haven't increased over the default
            if (fontSize > config.crumbFontSize){
                fontSize = config.crumbFontSize;
            }
            for (i = 0;i < len; i++) {
                d3.select(this).append("tspan")
                    .text(words[i])
                    .attr("font-size",fontSize)
                    .attr("x", (config.bread.width)*.45)
                    .attr("y", (config.bread.height)*.42)
                    .attr("dy", function(){
                        if (i === 0 && len === 1){
                            return ".55em";
                        } else if (i === 0){
                            return ".1em";
                        } else if (i < 2 && len > 2 
                                   && words[i].match(/and/i)){
                            return ".1em";;
                        } else {
                            return "1.2em";
                        }
                    })
                    .attr("dx", function(){
                        if (index === 0){
                            return ".1em";
                        }
                        if (i === 0 && len === 1){
                            return ".2em";
                        } else if (i == 0 && len >2
                                   && words[1].match(/and/i)){
                            return "-1.2em";
                        } else if (i === 0){
                            return ".3em";
                        } else if (i === 1 && len > 2
                                   && words[1].match(/and/i)){
                            return "1.2em";
                        } else {
                            return ".25em";
                        }
                    })
                    .attr("text-anchor", "middle")
                    .attr("class", "tspan" + i);
            }
        });
};

monarch.dovechart.prototype.setBarConfigPerCheckBox = function(histogram, data, groups, barGroup, isFirstGraph) {
    self = this;
    var layout = self.getValueOfCheckbox('mode');

    if (layout === 'grouped' || groups.length === 1) {
        if (!isFirstGraph) {
            histogram.setXYDomains(data, groups, layout);
            histogram.transitionXAxisToNewScale(1000);
        }
        return self.makeBar(barGroup,histogram,layout,isFirstGraph);
    } else if (layout === 'stacked')  {     
        if (!isFirstGraph) {
            histogram.setXYDomains(data,groups, layout);
            histogram.transitionXAxisToNewScale(1000);
        }
        return self.makeBar(barGroup, histogram, layout, isFirstGraph);
    } else if (layout === 'heatmap') {
        return self.makeBar(barGroup, histogram, layout, isFirstGraph);
    }
};

monarch.dovechart.prototype.setYAxisHandlers= function(histogram, data, barGroup, bar, yFont){
    var self = this;
    config = self.config;
    
    histogram.svg.select(".y.axis")
    .selectAll("text")
    .data(data)
    .text(function(d){ return self.getIDLabel(d.id,data) })
    .attr("font-size", yFont)
    .on("mouseover", function(){
        d3.select(this).style("cursor", "pointer");
        d3.select(this).style("fill", config.color.yLabel.hover);
        d3.select(this).style("text-decoration", "underline");
        self.displaySubClassTip(self.tooltip,this)
    })
    .on("mouseout", function(){
        d3.select(this).style("fill", config.color.yLabel.fill );
        d3.select(this).style("text-decoration", "none");
        self.tooltip.style("display", "none");
    })
    .on("click", function(d){
        self.getDataAndTransitionOnClick(d, histogram, data, barGroup, bar);
    })
    .style("text-anchor", "end")
    .attr("dx", config.yOffset)
    .append("svg:title")
    .text(function(d){
        if (/\.\.\./.test(self.getIDLabel(d.id,data))){
            var fullLabel = self.getFullLabel(d.id, data);
            var title = fullLabel +" (" + d.id.replace(/(.*):(.*)/, "$1") + ")";
              return title;  
        } else if (yFont < 12) {//HARDCODE alert
            var label = self.getIDLabel(d.id,data);
            var title = label +" (" + d.id.replace(/(.*):(.*)/, "$1") + ")";
            return title;
        }
    });
};


monarch.dovechart.prototype.disableYAxisText = function(histogram, data, barGroup, bar){
    self = this;
    config = self.config;
    
    histogram.svg.select(".y.axis")
    .selectAll("text")
    .on("mouseover", function(){
        d3.select(this).style("cursor", "arrow");
    })
    .on("mouseout", function(){
        d3.select(this).style("fill", config.color.yLabel.fill );
        d3.select(this).style("text-decoration", "none");
        self.tooltip.style("display", "none");
    })
    .on("click", function(d){
    });
    
};

monarch.dovechart.prototype.activateYAxisText = function(histogram, data, barGroup, bar){
    self = this;
    config = self.config;
    
    histogram.svg.select(".y.axis")
    .selectAll("text")
    .on("mouseover", function(){
        if (config.isYLabelURL){
            d3.select(this).style("cursor", "pointer");
            d3.select(this).style("fill", config.color.yLabel.hover);
            d3.select(this).style("text-decoration", "underline");
            self.displaySubClassTip(self.tooltip,this)
        }
    })
    .on("mouseout", function(){
        d3.select(this).style("fill", config.color.yLabel.fill );
        d3.select(this).style("text-decoration", "none");
        self.tooltip.style("display", "none");
    })
    .on("click", function(d){
        self.getDataAndTransitionOnClick(d, histogram, data, barGroup, bar);
    });
    
};

monarch.dovechart.prototype.getDataAndTransitionOnClick = function(node, histogram, data, barGroup, bar){
    var self = this;
    // Clear these in case they haven't faded out
    jQuery(self.html_div+" .leaf-msg").hide();
    jQuery(self.html_div+" .error-msg").hide();
    
    if (!self.tree_builder){
        self.parents.push(node.id);
        if (node.children && node.children[0]){ //TODO use tree api
            self.transitionToNewGraph(histogram,node,
                barGroup,bar, node.id);
        }
    } else {
        self.disableYAxisText(histogram,data, barGroup, bar);
        self.parents.push(node.id);
        jQuery(self.html_div+" .ajax-spinner").show();
        var transitionToGraph = function(){
            jQuery(self.html_div+" .ajax-spinner").hide();
            self.tree = self.tree_builder.tree;
            // Check if we've found a new class
            if (!self.tree.checkDescendants(self.parents)){
                self.parents.pop();
                jQuery(self.html_div+" .leaf-msg").html('There are no subclasses of <br/>'+node.fullLabel);
                jQuery(self.html_div+" .leaf-msg").show().delay(3000).fadeOut();
                self.activateYAxisText(histogram,data, barGroup, bar);
                // Scroll to top of chart
                if (jQuery(window).scrollTop() - jQuery(self.html_div).offset().top > 100) {
                    jQuery('html, body').animate({ scrollTop: jQuery(self.html_div).offset().top - 50 }, 0);
                }
            } else {
                self.transitionToNewGraph(histogram, node, barGroup,bar, node.id);
                if (jQuery(window).scrollTop() - jQuery(self.html_div).offset().top > 100) {
                    jQuery('html, body').animate({ scrollTop: jQuery(self.html_div).offset().top - 50 }, 0);
                }
            }
        };
    
        var showErrorMessage = function(){
            self.parents.pop();
            jQuery(self.html_div+" .ajax-spinner").hide();
            self.activateYAxisText(histogram,data, barGroup, bar);
            jQuery(self.html_div+" .error-msg").show().delay(3000).fadeOut();
        };
    
        self.tree_builder.build_tree(self.parents, transitionToGraph, showErrorMessage);
    }
    
};

////////////////////////////////////////////////////////////////////
//
//Data object manipulation
//
//The functions below manipulate the data object for
//various functionality
//

//get largest Y axis label for font resizing
monarch.dovechart.prototype.getYMax = function(data){
      return d3.max(data, function(d) { 
          return d.label.length;
      });
};
  
monarch.dovechart.prototype.checkForChildren = function(data){
     for (i = 0;i < data.length; i++) {
          if ((Object.keys(data[i]).indexOf('children') >= 0 ) &&
             ( typeof data[i]['children'][0] != 'undefined' )){
              return true;
          } 
     }
     return false;
};
  
monarch.dovechart.prototype.getStackedStats = function(data){
      //Add x0,x1 values for stacked barchart
      data.forEach(function (r){
          var count = 0;
          r.counts.forEach(function (i){
               i["x0"] = count;
               i["x1"] = i.value+count;
               if (i.value > 0){
                   count = i["x1"];
               }
           });
      });
      return data;
};

monarch.dovechart.prototype.sortDataByGroupCount = function(data){
    var self = this;
    //Check if total counts have been calculated via getStackedStats()
    if (!data[0] || !data[0].counts ||  !data[0].counts[0] || data[0].counts[0].x1 == null){
        data = self.getStackedStats(data);
    }
    
    data.sort(function(obj1, obj2) {
        var obj2LastElement = obj2.counts.length - 1;
        var obj1LastElement = obj1.counts.length - 1;
        if ((obj2.counts[obj2LastElement])&&(obj1.counts[obj1LastElement])){
            return obj2.counts[obj2LastElement].x1 - obj1.counts[obj1LastElement].x1;
        } else {
            return 0;
        }
    });
    return data;
};

monarch.dovechart.prototype.getGroups = function(data) {
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

//TODO improve checking
monarch.dovechart.prototype.checkData = function(data){  
    if (typeof data === 'undefined'){
        throw new Error ("Data object is undefined");
    }
    
    data.forEach(function (r){
        //Check ID
        if (r.id == null){
            throw new Error ("ID is not defined in data object");
        }
        if (r.label == null){
            r.label = r.id;
        }
        if (r.counts == null){
            throw new Error ("No statistics for "+r.id+" in data object");
        }
        r.counts.forEach(function (i){
            if (i.value == null){
                r.value = 0;
            }
        });
        // Make sure counts are always in same order
        var orderedCounts = [];
        //Check that we're not missing any group member
        self.groups.forEach(function (val, index){
            if (r.counts.map(function(i){return i.name;}).indexOf(val) == -1){
                var count = {'name': val, 'value': 0};
                orderedCounts.push(count);
            } else {
                var i = r.counts.map(function(i){return i.name;}).indexOf(val);
                orderedCounts[index] = (r['counts'][i]);
            }   
        });
        r.counts = orderedCounts;
        
    });
    return data;
};
  
//remove zero length bars
monarch.dovechart.prototype.removeZeroCounts = function(data){
      trimmedGraph = [];
      trimmedGraph = data.filter(function (r){
          var count = 0;
          r.counts.forEach(function (i){
               count += i.value;
           });
          return (count > 0);
      });
      return trimmedGraph;
};

/* Remove a category from the view
 * removeCategory pushes the category to 
 * the self.config.category_filter_list instance variable
 */
monarch.dovechart.prototype.removeCategory = function(data, category){
      trimmedGraph = [];
      trimmedGraph = data.map(function (r){
          var group = JSON.parse(JSON.stringify(r)); //make copy
          group.counts = r.counts.filter(function (i){
               return (i.name !== category);
           });
          return group;
      });
      
      if (trimmedGraph.length === 0) {
          // Reset original as a backup
          trimmedGraph = data;
      }
      //recalculate stacked stats
      trimmedGraph = self.getStackedStats(trimmedGraph);
      self.config.category_filter_list.push(category);
      return trimmedGraph;
};

/*
 * Remove a list of categories
 * This is not simply a wrapper for removeCategory since
 * we do not want to push these values to the 
 * self.config.category_filter_list
*/
monarch.dovechart.prototype.removeCategories = function(data, categories){
      trimmedGraph = [];
      
          trimmedGraph = data.map(function (r){
              var group = JSON.parse(JSON.stringify(r)); //make copy
              group.counts = r.counts.filter(function (i){
                  return (categories.indexOf(i.name) === -1);
              });
              return group;
          });
      
      //recalculate stacked stats
      trimmedGraph = self.getStackedStats(trimmedGraph);
      return trimmedGraph;
};

//remove classes without labels, see https://github.com/monarch-initiative/monarch-app/issues/894
monarch.dovechart.prototype.removeIdWithoutLabel = function(data){
      trimmedGraph = [];
      trimmedGraph = data.filter(function (r){
          return (r.label != null && r.id != r.label);
      });
      return trimmedGraph;
};

monarch.dovechart.prototype.addEllipsisToLabel = function(data, max){
    var reg = new RegExp("(.{"+max+"})(.+)");
    var ellipsis = new RegExp('\\.\\.\\.$');
    data.forEach(function (r){
        if ((r.label.length > max) && (!ellipsis.test(r.label))){
            r.fullLabel = r.label;
            r.label = r.label.replace(reg,"$1...");      
        } else {
            r.fullLabel = r.label;
        }
    });
    return data;
};

monarch.dovechart.prototype.getFullLabel = function (id, data){
    for (var i=0, len=data.length; i < len; i++){
        if (data[i].id === id){
            var fullLabel = data[i].fullLabel;
            return fullLabel;
        }
    }
};

monarch.dovechart.prototype.getGroupID = function (id, data){
    for (var i=0, len=data.length; i < len; i++){
        if (data[i].label === id){
            monarchID = data[i].id;
            return monarchID;
        }
    }
};

monarch.dovechart.prototype.getIDLabel = function (id, data){
    for (var i=0, len=data.length; i < len; i++){
        if (data[i].id === id){
            label = data[i].label;
            return label;
        }
    }
};
////////////////////////////////////////////////////////////////////
//End data object functions
////////////////////////////////////////////////////////////////////

//Log given base x
function getBaseLog(x, y) {
    return Math.log(y) / Math.log(x);
};

//Adjust Y label font, arrow size, and spacing
//when transitioning
//this is getting funky with graph resizing, maybe should do away
monarch.dovechart.prototype.adjustYAxisElements = function(len){
   
   var conf = this.config;
   var h = conf.height;
   var density = h/len;
   var isUpdated = false;
   
   var yFont = conf.yFontSize;
   var yOffset = conf.yOffset;
   var arrowDim = conf.arrowDim;
   
   //Check for density BETA
   if (density < 15 && density < yFont ){
       yFont = density+2;
       //yOffset = "-2em";
       //arrowDim = "-20,-3, -11,1 -20,5";
       isUpdated = true;
   }
    
   if (isUpdated && yFont > conf.yFontSize){
       yFont = conf.yFontSize;
   }
   return yFont;
};
///////////////////////////////////
//Setters for sizing configurations

monarch.dovechart.prototype.setWidth = function(w){
    this.config.width = w;
    return this.config.width;
};

monarch.dovechart.prototype.setHeight = function(h){
    this.config.height = h;
    return this.config.height;
};

monarch.dovechart.prototype.setYFontSize = function(fSize){
    this.config.yFontSize = fSize;
    return this.config.yFontSize;
};

monarch.dovechart.prototype.setxFontSize = function(fSize){
    this.config.xFontSize = fSize;
    return this.config.xFontSize;
};

monarch.dovechart.prototype.setXLabelFontSize = function(fSize){
    this.config.xLabelFontSize = fSize;
    return this.config.xLabelFontSize;
};

monarch.dovechart.prototype.setXAxisPos = function(w,h){
    this.config.xAxisPos = {dx:w,y:h};
    return this.config.xAxisPos;
};

// Some dead code for implementing dynamic resizing of charts
// TODO move to some dev branch
/*
 * setSizeConfiguration and setSizingRatios() are from an incompleted attempt
 * to create dynamically resized charts.  If implementing something like this
 * could be added to the init function:
 * 
 *   if (config.isDynamicallyResized){
     
         if (jQuery(window).width() < (config.benchmarkWidth) || jQuery(window).height() < (config.benchmarkHeight)){
             self.setSizeConfiguration(config.graphSizingRatios);
             //init
         } else {
             //init
         }
     
         window.addEventListener('resize', function(event){
  
             if (jQuery(window).width() < (config.benchmarkWidth) || jQuery(window).height() < (config.benchmarkHeight)){
                 jQuery(html_div).children().remove();
                 self.setSizeConfiguration(config.graphSizingRatios);
                //init
             }
         });
     }
 


monarch.dovechart.prototype.setSizeConfiguration = function(graphRatio){
    var self = this;
    var w = jQuery(window).width();
    var h = jQuery(window).height();
    var total = w+h;
    
    self.setWidth( ((w*graphRatio.width) / getBaseLog(12,w)) * 3);
    self.setHeight( ((h*graphRatio.height) / getBaseLog(12,h)) *3.5);
    self.setYFontSize( ((total*(graphRatio.yFontSize))/ getBaseLog(20,total)) * 3);
};

monarch.dovechart.prototype.setSizingRatios = function(){
    var config = this.config;
    var graphRatio = {};
    
    if (!config.benchmarkHeight || !config.benchmarkWidth){
        console.log("Dynamic sizing set without "+
                    "setting benchmarkHeight and/or benchmarkWidth");
    }
    
    graphRatio.width = config.width / config.benchmarkWidth;
    graphRatio.height = config.height / config.benchmarkHeight;
    graphRatio.yFontSize = (config.yFontSize / (config.benchmarkHeight+config.benchmarkWidth));
    
    return graphRatio;
};

*/

//dovechart default SVG Coordinates
monarch.dovechart.prototype.setPolygonCoordinates = function(){
    
    //Nav arrow (now triangle) 
    if (this.config.arrowDim == null || typeof this.config.arrowDim == 'undefined'){
        this.config.arrowDim = "-23,-6, -12,0 -23,6";
    }
    
    //Breadcrumb dimensions
    if (this.config.firstCr == null || typeof this.config.firstCr == 'undefined'){
        this.config.firstCr = "0,0 0,30 90,30 105,15 90,0";
    }
    if (this.config.trailCrumbs == null || typeof this.config.trailCrumbs == 'undefined'){
        this.config.trailCrumbs = "0,0 15,15 0,30 90,30 105,15 90,0";
    }
    
    //Polygon dimensions
    if (this.config.bread == null || typeof this.config.bread == 'undefined'){
        this.config.bread = {width:105, height: 30, offset:90, space: 1};
    }
    
    //breadcrumb div dimensions
    this.config.bcWidth = 700;
    
    //Y axis positioning when arrow present
    if (this.config.yOffset == null || typeof this.config.yOffset == 'undefined'){
        this.config.yOffset = "-1.48em";
    }
    
    //Check that breadcrumb width is valid
    /*if (this.config.bcWidth > this.config.width+this.config.margin.right+this.config.margin.left){
        this.config.bcWidth = this.config.bread.width+(this.config.bread.offset*5)+5;
    }*/
};

//dovechart default configurations
monarch.dovechart.prototype.getDefaultConfig = function(){
    
    var defaultConfiguration = {
            
            category_filter_list :[],
            
            //Chart margins    
            margin : {top: 40, right: 140, bottom: 5, left: 255},
            
            width : 375,
            height : 400,
            
            //X Axis Label
            xAxisLabel : "Some Metric",
            xLabelFontSize : "14px",
            xFontSize : "14px",
            xAxisPos : {dx:"20em",y:"-29"},
            
            //Chart title and first breadcrumb
            chartTitle : "Chart Title",
            
            //Title size/font settings
            title : {
                      'text-align': 'center',
                      'text-indent' : '0px',
                      'font-size' : '20px',
                      'font-weight': 'bold',
                      'background-color' : '#E8E8E8',
                      'border-bottom-color' : '#000000'
            },
            
            //Yaxis links
            yFontSize : 'default',
            isYLabelURL : true,
            yLabelBaseURL : "/phenotype/",
            
            //Font sizes
            settingsFontSize : '14px',
            
            //Maximum label length before adding an ellipse
            maxLabelSize : 31,
            
            //Turn on/off legend
            useLegend : true,
            
            //Fontsize
            legendFontSize : 14,
            //Legend dimensions
            legend : {width:18,height:18},
            legendText : {height:".35em"},
            
            //Colors set in the order they appear in the JSON object
            color : { 
                     first  : '#44A293',
                     second : '#A4D6D4',
                     third  : '#EA763B',
                     fourth : '#496265',
                     fifth  : '#44A293',
                     sixth  : '#A4D6D4',
                       
                     yLabel : { 
                       fill  : '#000000',
                       hover : '#EA763B'
                     },
                     arrow : {
                       fill  : "#496265",
                       hover : "#EA763B"
                     },
                     bar : {
                       fill  : '#EA763B'
                     },
                     crumb : {
                       top   : '#496265',
                       bottom: '#3D6FB7',
                       hover : '#EA763B'
                     },
                     crumbText : '#FFFFFF'
            },
            
            //Turn on/off breadcrumbs
            useCrumb : false,
            crumbFontSize : 10,
            
            //Turn on/off breadcrumb shapes
            useCrumbShape : true
    };
    return defaultConfiguration;
};