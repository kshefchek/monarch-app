/* This script document contains functions relating to general Monarch pages. */

function initMonarchPage(){
    bbop.monarch.remove_equivalent_ids = remove_equivalent_ids;
    bbop.monarch.filter_equivalents = filter_equivalents;

    // Feedback form
    jQuery('#feedback-window-container #feedback-trigger').on('click', function(event) {
      event.preventDefault();
      event.stopPropagation();
      jQuery(this).parent().siblings().removeClass('open');
      jQuery(this).parent().toggleClass('open');

      if (jQuery('#feedback-window-container').hasClass('open')) {
        jQuery('#alert_template button').click(function(e) {
                jQuery('#alert_template').fadeOut('slow');
            });

        jQuery('#feedback-window-container .feedback-close').click(function(e) {
          jQuery('#feedback-window-container').removeClass('open');
        });
      }
      else {
      }
    });

    jQuery('#feedback-window-container #feedback-submit-button').click(function(){
        var feedbackUrl = '/feedback';
        var goalText = jQuery('#feedback-window-container #feedback-goal').val();
        var improveText = jQuery('#feedback-window-container #feedback-improve').val();
        var OKQuoteText = jQuery('#feedback-window-container #feedback-OKQuote').is(':checked');
        var OKFollowupText = jQuery('#feedback-window-container #feedback-OKFollowup').is(':checked');
        var emailText = jQuery('#feedback-window-container #feedback-email').val();
        var additionalText = jQuery('#feedback-window-container #feedback-additional').val();
        var now = new Date();
        var params = {
            'feedback-form-metadata': {
                'version':        '1',
                'href':           window.location.href,
                'time-utc':       now.toUTCString(),
                'time-local':     now.toLocaleString()
            },
            'feedback-form-response': {
                'goal':                         goalText,
                'improve':                      improveText,
                'OKQuote':                      OKQuoteText,
                'OKFollowup':                   OKFollowupText,
                'email':                        emailText,
                'additional':                   additionalText
            }
        };

        console.log('FEEDBACK:', params);
        jQuery.ajax({
            type : 'POST',
            url : feedbackUrl,
            data : params,
            dataType: "json",
            error: function(){
                console.log('ERROR: posting feedback to: ', feedbackUrl);
            },
            success: function(data) {
                jQuery('#feedback-window-container').removeClass('open');

                // window.setTimeout(function() {
                //         jQuery('#alert_template').fadeOut('slow');
                //         jQuery("#alert_template span").remove();
                //     },
                //     13000);
                jQuery("#alert_template #feedback-response").text('Thanks for your feedback');
                jQuery('#alert_template').fadeIn('slow');
            }
        });
    });

    jQuery("#feedback-window-container #simple-menu").draggable({
        handle: "#feedback-handle"
    });

    /* This displays the help text about the annotation sufficiency score upon
     * hovering over the blue question mark box. */
    jQuery('#annotationscore > span.annotatequestion').hover(function() {
        jQuery('#annotationscore > span.annotatehelp').css({'display': 'block'});
    }, function() {
        jQuery('#annotationscore > span.annotatehelp').css({'display': 'none'});
    });


    /* Annotate Marked Up Text */

    /* This displays the box of found terms upon hovering over a highlighted/linked
     * term. An example is located in the Text Annotater (found on the Annotate Text
     * tab of the main drop-down navigation menu). */
    jQuery('.linkedspan').hover(function() {
        jQuery(this).find('.linkedterms').css({'display': 'block'});
    }, function() {
        jQuery(this).find('.linkedterms').css({'display': 'none'});
    });


    /* Show/Hide items */
    /* Used when a "more..." kind of functionality is desired */
    jQuery('.fewitems').click(function(event) {
        jQuery(this).hide();
        jQuery(this).parent().find('.moreitems').show();
        jQuery(this).parent().find('.hideitems').show();
    });

    jQuery('.hideitems').click(function(event) {
        jQuery(this).hide();
        jQuery(this).parent().find('.moreitems').hide();
        jQuery(this).parent().find('.hideitems').hide();
        jQuery(this).parent().find('.fewitems').show();
    });
}

function getAnnotationScore() {
    var isLoading = false;
    jQuery('#categories a[href="#phenotypes"]').click(function(event) {
        if (isLoading == false){
            isLoading = true;
            getPhenotypesAndScore();
        }
    });
    
    // Trigger a click event if we're loading the page on an href
    if ( window && window.location && window.location.hash
            && window.location.hash != "" && window.location.hash == "#phenotypes"
            && isLoading == false){
        isLoading = true;
        getPhenotypesAndScore();
    }
    
    function getPhenotypesAndScore(){
        jQuery('.stars').hide();
        var spinner_class = 'ui-score-spinner';
        jQuery('.score-spinner').addClass(spinner_class);
    
        var id = window.location.pathname;
        var slash_idx = id.indexOf('/');
        id = id.substring(slash_idx+1);
    
        var query = '/' + id + '/phenotype_list.json';
    
        jQuery.ajax({
            url : query,
            dataType: "json",
            error: function(){
                console.log('ERROR: looking at: ' + query);
            },
            success: function(data) {
            
                var score_query = '/score';
                var profile = JSON.stringify({features:data.phenotype_list});
                var params = {'annotation_profile' : profile};
                jQuery.ajax({
                    type : 'POST',
                    url : score_query,
                    data : params,
                    dataType: "json",
                    error: function(){
                        console.log('ERROR: looking at: ' + score_query);
                    },
                    success: function(successData) {
                        jQuery('.score-spinner').removeClass(spinner_class);
                        var score = (5 * successData.scaled_score);
                        jQuery(".stars").text(score);
                    
                        /* This displays the stars used to denote annotation sufficiency. For example,
                         * annotation sufficiency scores are currently located on the phenotype tab
                         * of the disease page. */
                        jQuery.fn.stars = function() {
                            return this.each(function(i,e){
                                jQuery(e).html(jQuery('<span/>').width(jQuery(e).text()*16));
                            });
                        };
                        jQuery('.stars').stars();
                        jQuery('.stars').show();
                    }
                });
            }
            
        });
    }    
}

/*
 * Function: filter_equivalents
 * 
 * Arguments: 
 *    : eq_graph - raw json in the structure of a bbop.model.graph
 *                 containing equivalency mapping
 *
 *    : map - list of objects containing the properties id, label,
 *            category (optional), and tag (optional)
 *            for example:
 *             [
 *               {
 *                 "id":"NCBIGene:30269","label":"shh",
 *                 "category":"gene","tag":"Zebra Fish""
 *                },
 *               {
 *                 "id":"NCBIGene:100512749","label":"SHH",
 *                 "category":"gene","tag":"Swine"
 *               }
 *             ]
 *
 * Returns: Updated map with equivalents filtered out
 */
function filter_equivalents(eq_graph, map) {
    var equivalent_graph = new bbop.model.graph();
    equivalent_graph.load_json(eq_graph);
    
    //TODO remove this once we enable the monarch API on the client side
    equivalent_graph.get_descendent_subgraph = function(obj_id, pred){   
        var anchor = this;
        var edge_list = new Array();
        var descendent_graph = new bbop.model.graph();
        if (typeof anchor.seen_node_list === 'undefined') {
            anchor.seen_node_list = [obj_id];
        }
        
        anchor.get_child_nodes(obj_id, pred).forEach( function(sub_node) {
            var sub_id = sub_node.id();
            if (anchor.seen_node_list.indexOf(sub_id) > -1){
                return;
            }
            anchor.seen_node_list.push(sub_id);
            descendent_graph.add_edge(anchor.get_edge(sub_id, obj_id, pred));
            descendent_graph.add_node(anchor.get_node(sub_id));
            descendent_graph.add_node(anchor.get_node(obj_id));
            descendent_graph.merge_in(anchor.get_descendent_subgraph(sub_id, pred));
        });
            
        return descendent_graph; 
    }
    
    for (var i=0; i < map.length; i++) {
        var id = map[i]['id'];
        var eq_node_list = [];
        
        //Get all equivalent nodes of v[i][0]
        var equivalent_nodes = 
            equivalent_graph.get_ancestor_subgraph(id, 'equivalentClass')
                            .all_nodes();
        var other_eq_nodes = 
            equivalent_graph.get_descendent_subgraph(id, 'equivalentClass')
                            .all_nodes();
        
        eq_node_list = equivalent_nodes.map(function(i){return i.id();});
        var temp_list = other_eq_nodes.map(function(i){return i.id();});
        
        eq_node_list.push.apply(eq_node_list, temp_list);
        
        for (var k=i+1; k < map.length; k++) {
            var node_id = map[k]['id'];
            if (node_id) {
                if (eq_node_list.indexOf(node_id) > -1){
                    
                    // cliqueLeaders have priority
                    if ('types' in equivalent_graph.get_node(id).metadata() 
                            && (equivalent_graph.get_node(id).metadata()['types'].indexOf('cliqueLeader') > -1)) {
                        map.splice(k, 1);
                        k--;
                        continue;
                    }
                    else {
                        map.splice(i,1)
                        i--;
                        break;
                    }
                }
            }
    
        }
    }
    return map;
};

function remove_equivalent_ids(map, id_list, response) {
    //TODO pass server in using puptent var
      var ids = id_list.join('&id=');
      // Global scigraph data url passed in from webapp.js addCoreRenderers
      var qurl = global_scigraph_url + "graph/neighbors?id=" 
          + ids + "&depth=3&blankNodes=false&relationshipType=equivalentClass"
          + "&direction=BOTH&project=%2A";
      jQuery.ajax({
          url: qurl,
          dataType:"json",
          error: function (){
              console.log('error fetching equivalencies');
              response(map);
          },
          success: function ( data ){
              map = filter_equivalents(data, map);
              response(map);  
          }
      });
};

function add_species_to_autocomplete(data, map, gene_ids) {
    var graph = new bbop.model.graph();
    graph.load_json(data);
    gene_ids.forEach(function (id) {
        var label = '';
        var taxon_list = graph.get_parent_nodes(id, 'http://purl.obolibrary.org/obo/RO_0002162');
        if (taxon_list && taxon_list.length > 0){
            label = taxon_list[0].label();
            var meta = taxon_list[0].metadata();
            if (meta && meta['synonym']){
                label = meta['synonym'][0];
            }
            label = label.replace(/\b[a-z]/g, function() {
                return arguments[0].toUpperCase();
            });
        }
        for (var i = 0; i < map.length; i++){
            if (map[i]['id'] == id) {
                if (label) {
                    map[i]['tag'] = label;
                }
            }
        }
    });
    return map;
}


function makeSpinnerDiv(args){
 // Details for spinner
    
    var default_args = {'generate_id': true,
                        'class':
                        'progress progress-striped active',
                        'style': 'width: 3em; position:absolute; display:inline-block; margin-top:3px; margin-left:10px;'
    };
    if (!args){
        args = default_args;
    }
    var inspan = new bbop.html.tag('span', {'class': 'sr-only'}, '...');
    var indiv = new bbop.html.tag('div', {'class': 'progress-bar',
                      'role': 'progressbar',
                      'aria-valuenow': '100',
                      'aria-valuemin': '0',
                      'aria-valuemax': '100',
                      'style': 'width: 100%;'},
                  inspan);
    var spinner_div =
    new bbop.html.tag('div',
              args,
              indiv);
    
    return spinner_div;
}

if (typeof exports === 'object') {
    exports.initMonarchPage = initMonarchPage;
    exports.getAnnotationScore = getAnnotationScore;
    exports.remove_equivalent_ids = remove_equivalent_ids;
    exports.makeSpinnerDiv = makeSpinnerDiv;
    exports.add_species_to_autocomplete = add_species_to_autocomplete;
}
if (typeof(loaderGlobals) === 'object') {
    loaderGlobals.initMonarchPage = initMonarchPage;
    loaderGlobals.remove_equivalent_ids = remove_equivalent_ids;
    loaderGlobals.makeSpinnerDiv = makeSpinnerDiv;
    loaderGlobals.add_species_to_autocomplete = add_species_to_autocomplete;
}
