var express = require('express');
var path = require('path');
var anyToJSON = require('anytojson');
var crossfilter = require('crossfilter');
var d3 = require('d3');


var app = express();
app.listen(3000, () => console.log('Listening at Port 3000'));
app.use(express.static('public'));



var dimensions = {};
var groups = {};

app.get("/se", function(req, res, next) {
  // var index = require('./public/index.html');
  // if(!req.param("filter")) return res.send('ABCD');
  var results = {};
  filter = req.param("filter") ? JSON.parse(req.param("filter")) : {}
  console.log(filter);
  for (dimension in dimensions) {
    console.log("Dimension: " + dimension);
    if (filter[dimension]) {
      // In this example the only string variables in the filter are dates
      if ((filter[dimension]).length > 1){
        console.log(filter);
        dimensions[dimension].filterFunction(function (d) {
          var filters = (filter[dimension]);
            for (var i = 1; i < filters.length; i++) {

                var filter = filters[i];
                if (filter.isFiltered && filter.isFiltered(d)) {
                    return true;
                } else if (filter <= d && filter >= d) {
                    return true;
                }
            }
            return false;
        });
      }
      else{
      console.log(filter[dimension]);
      dimensions[dimension].filter(filter_value(filter[dimension]));
      }
    } else {
      dimensions[dimension].filterAll()
    }
  }
  // Assemble group results and and the maximum value for each group

  for (dimension in groups) {
    console.log("Group: " + dimension);
    var group = groups[dimension];
    results[dimension] = {
      values: group.all(),
      top: group.top(1)[0].value
    };
  }
  res.writeHead(200, {
    'content-type': 'application/json'
  });
  res.end((JSON.stringify(results)));

});


function filter_value(dir) {
  console.log( "dfsk");
  if ((dir).length === 1) {
    return dir[0];
  } else if ((dir).length === 0) {
    return null
  }
}

anyToJSON.csv({
  path: "data/summary.csv"
}, function(data) {

  //console.log(data);


  var ndx = crossfilter(data);
  var all = ndx.groupAll();
  console.log("...");
  var dimension = ndx.dimension(function(d) {
    return d.time
  });
  var group = dimension.group();
  data.forEach(function(d) {
    d.subunit = d["Sub Unit"];
  })


  var unit_dim = ndx.dimension(function(d) {
    return [d.Unit, d["Sub Unit"]];
  });
  var category_dim = ndx.dimension(function(d) {
    return [d.reporting_category, d.reporting_category_2];
  });
  var time_month_dim = ndx.dimension(function(d) {
    return d.time;
  });
  var stone_family_dim = ndx.dimension(function(d) {
    return d["Stone Family"];
  });
  var stage_dim = ndx.dimension(function(d) {
    return d.Stage;
  });
  // var subunit_table_dim = ndx.dimension(function(d){ return d.subunit; });
  var month_dim_line = ndx.dimension(function(d) {
    return d.time;
  });
  var location_dim = ndx.dimension(function(d) {
    return d.Location;
  })

  var location_dim_group = location_dim.group();
  var unit_dim_group = unit_dim.group().reduceSum(function(d) {
    return d.stock_value;
  });
  var category_dim_group = category_dim.group().reduceSum(function(d) {
    return d.stock_value;
  });
  var time_month_group_stock = time_month_dim.group().reduceSum(function(d) {
    return d.stock_value / 1000000;
  });
  var time_month_group_book = time_month_dim.group().reduceSum(function(d) {
    return d.book_value / 1000000;
  });
  var stone_family_group = stone_family_dim.group().reduceSum(function(d) {
    return d.stock_value;
  });
  var stage_group = stage_dim.group().reduceSum(function(d) {
    return d.stock_value;
  });
  var month_dim_line_group_stock = month_dim_line.group().reduceSum(function(d) {
    return d.stock_value;
  });
  var month_dim_line_group_book = month_dim_line.group().reduceSum(function(d) {
    return d.book_value;
  });
  var month_dim_line_group_devaluation = month_dim_line.group().reduceSum(function(d) {
    return d.Devaluation;
  });
  // var subunit_table_group = subunit_table_dim.group().reduce(
  //   function (p, v){
  //     ++p.number;
  //     p.subunit = v.subunit;
  //     p.book_value += +Number(v.book_value);
  //     p.stock_value += +Number(v.stock_value);
  //     return p;
  //   },
  //   function(p,v){
  //     --p.number;
  //     p.subunit = v.subunit;
  //     p.book_value -= +Number(v.book_value);
  //     p.stock_value -= +Number(v.stock_value);
  //     return p;
  //   },
  //   function(){
  //     return {number: 0, subunit:'', book_value:0, stock_value:0}
  //   }
  //   );

  console.log(dimension);
  dimensions.unit_dim = unit_dim;
  dimensions.category_dim = category_dim;
  dimensions.time_month_dim = time_month_dim;
  dimensions.stone_family_dim = stone_family_dim;
  dimensions.stage_dim = stage_dim;
  // dimensions.subunit_table_dim = subunit_table_dim;
  dimensions.month_dim_line = month_dim_line;
  dimensions.location_dim = location_dim;


  groups.location_dim_group = location_dim_group;
  groups.unit_dim_group = unit_dim_group;
  groups.category_dim_group = category_dim_group;
  groups.time_month_group_stock = time_month_group_stock;
  groups.time_month_group_book = time_month_group_book;
  groups.stone_family_group = stone_family_group;
  groups.stage_group = stage_group;
  groups.month_dim_line_group_stock = month_dim_line_group_stock;
  groups.month_dim_line_group_book = month_dim_line_group_book;
  groups.month_dim_line_group_devaluation = month_dim_line_group_devaluation;
  // groups.subunit_table_group = subunit_table_group;


});
module.exports = app;
