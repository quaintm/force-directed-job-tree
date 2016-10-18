// d3.js force-directed graph definitions

// dynamic rescaling of svg graphic
var svg = d3.select("div#container")
  .append("svg")
  .attr("preserveAspectRatio", "xMinYMin meet")
  .attr("viewBox", "0 0 1200 800")
  .classed("svg-content", true);

// expanded d3 color scheme set
var color = d3.scaleOrdinal(d3.schemeSet2);

// dynamic rescaling of body force based on graph width and height
var w = window,
  d = document,
  e = d.documentElement,
  g = d.getElementsByTagName('body')[0],
  x = w.innerWidth || e.clientWidth || g.clientWidth,
  y = w.innerHeight || e.clientHeight || g.clientHeight;

var realWidth = width;
var width = x;
var height = y;
var img_w = 24;
var img_h = 24;
var radius = 6;
var k = Math.sqrt(40 / (width * height));

var simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function(d) { return d.id; }).distance(20))
    .force("charge", d3.forceManyBody().strength(-4 / k))
    .force("center", d3.forceCenter(width / 2, height / 2));

// force graph attributes
d3.json("job-tree.json", function(error, graph) {
  if (error) throw error;

  //links
  var link = svg.append("g")
      .attr("class", "links")
    .selectAll("line")
    .data(graph.links)
    .enter().append("line")
      .attr("stroke-width", 1)
      .style("marker-end",  "url(#suit)") //arrows
      ;

  //arrows
  svg.append("defs").selectAll("marker")
    .data(["suit", "licensing", "resolved"])
  .enter().append("marker")
    .attr("id", function(d) { return d; })
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 25)
    .attr("refY", 0)
    .attr("markerWidth", 10)
    .attr("markerHeight", 6)
    .attr("orient", "auto")
  .append("path")
    .attr("d", "M0,-5L10,0L0,5 L10,0 L0, -5")
    .style("stroke", "#4679BD")
    .style("opacity", "0.9");

  //node groups
  var gnodes = svg.selectAll('g.gnode')
    .data(graph.nodes)
    .enter()
    .append('g')
    .classed('gnode', true)
    .call(d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      // .on("end", dragended)
      )
    .on('dblclick', connectedNodes);
    ;

  // node circles
  var node = gnodes.append("circle")
    .attr("class", "node")
    .attr("r", 8)
    .style("fill", function(d) { return color((d.modularity)); })
    .style("stroke", color(7))

  // labels
  var labels = gnodes.append("text")
    .attr("class", "node")
    .text(function(d) { return d.name; });

  //defining layout params
  simulation
      .nodes(graph.nodes)
      .on("tick", ticked)

  simulation.force("link")
      .links(graph.links);

  function ticked() {
    link
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    // Translate node groups back to nodes
    // TODO: bind node position by svg height / width
    gnodes
        .attr("transform", function(d) { 
          return 'translate(' + [d.x, d.y] + ')'; 
          })
      .each(collide(0.5))
      ;
  }

  // doubleclick to identify neighbors
  var toggle = 0;
  //Create an array logging first-order connections
  var linkedByIndex = {};
  for (i = 0; i < graph.nodes.length; i++) {
      linkedByIndex[i + "," + i] = 1;
  };
  graph.links.forEach(function (d) {
      linkedByIndex[d.source.index + "," + d.target.index] = 1;
  });

    //looks up whether a pair are neighbours
  function neighboring(a, b) {
      return linkedByIndex[a.index + "," + b.index];
  }

  function connectedNodes() {
      if (toggle == 0) {
          //Reduce opacity of all but neighbour nodes
          d = d3.select(this).node().__data__;
          node.style("opacity", function (o) {
              return neighboring(d, o) | neighboring(o, d) ? 1 : 0.1;
          });
          labels.style("opacity", function (o) {
              return neighboring(d, o) | neighboring(o, d) ? 1 : 0.1;
          });
          link.style("opacity", function (o) {
              return d.index==o.source.index | d.index==o.target.index ? 1 : 0.1;
          });
          toggle = 1;
      } else {
          //Put them back to opacity=1
          node.style("opacity", 1);
          labels.style("opacity", 1)
          link.style("opacity", 1);
          toggle = 0;
      }
  }

  //collison handling with quadtree
  var padding = 2, // separation between circles
      radius=10;
  function collide(alpha) {
    var quadtree = d3.quadtree(graph.nodes);
    return function(d) {
      var rb = 2*radius + padding,
          nx1 = d.x - rb,
          nx2 = d.x + rb,
          ny1 = d.y - rb,
          ny2 = d.y + rb;
      quadtree.visit(function(quad, x1, y1, x2, y2) {
        if (quad.point && (quad.point !== d)) {
          var x = d.x - quad.point.x,
              y = d.y - quad.point.y,
              l = Math.sqrt(x * x + y * y);
            if (l < rb) {
            l = (l - rb) / l * alpha;
            d.x -= x *= l;
            d.y -= y *= l;
            quad.point.x += x;
            quad.point.y += y;
          }
        }
        return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
      });
    };
  }

  // jquery search functionality
  var optArray = [];
  for (var i = 0; i < graph.nodes.length - 1; i++) {
    optArray.push(graph.nodes[i].name);
  }
  optArray = optArray.sort();

  $(function () {
      $("#search").autocomplete({
          source: optArray
      });

      $("#submitSearch").on("click",function(){
        var selectedVal = document.getElementById('search').value;
        var node = svg.selectAll(".node");
        if (selectedVal == "none") {
            node.style("stroke", "white").style("stroke-width", "1");
        } else {
            var selected = node.filter(function (d, i) {
                return d.name != selectedVal;
            });
            selected.style("opacity", "0");
            var link = svg.selectAll(".link")
            link.style("opacity", "0");
            d3.selectAll(".node, .link").transition()
                .duration(5000)
                .style("opacity", 1);
          };
      });
  });

});

// drag to pin
function dragstarted(d) {
  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(d) {
  d.fx = d3.event.x;
  d.fy = d3.event.y;
}

// function dragended(d) {
//   if (!d3.event.active) simulation.alphaTarget(0);
//   d.fx = null;
//   d.fy = null;
// }
