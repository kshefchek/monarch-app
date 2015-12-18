Feature: Phenogrid Works
 The several places where Phenogrid appears are properly loaded.

 ## No Background necessary.

@ui
Scenario: Phenotype Analysis Phenogrid works
    Given I go to slow page "/disease/OMIM:105830" and wait for id "phen_vis_svg"
      then the title should be "Monarch Disease: Angelman syndrome (OMIM:105830)"
      and the document should contain "Phenotype Similarity Comparison"

@ui
Scenario: Documentation example phenogrid appears
   Given I go to page "/page/phenogrid"
    then the title should be "Monarch Phenotype Grid Widget"

@ui
Scenario: Loading the iframe content for Monarch Phenotype Grid Widget loads a page with the correct title
   Given I go to slow page "/node_modules/phenogrid/index.html" and wait for id "phenogrid_container1_svg"
     then the title should be "Monarch Phenotype Grid Widget"
     and the document should contain "Phenogrid is a Javascript component that visualizes"
     and the document should contain "Phenotype Similarity Comparison"
     and the document should contain "Homo sapiens"
     and the document should contain "Danio rerio"

