
var ANIMATION_DELAY = 1500;

function ViewModel(){
  var self = this;
  self.pointString = ko.observable("25,50\n50,75\n75,25");
  self.svg = null;

  self.hullEdges = ko.observableArray();
  self.steps = ko.observableArray([]);

  self.points = ko.computed(function(){
    return self.pointString().split('\n')
                .map(function(line){
                  return line.split(',')
                          .map(function(num){
                            return parseFloat(num);
                          });
                }).map(function(arr){
                  return {
                    x: arr[0],
                    y: arr[1]
                  }
                });
  });



  self.pointString.subscribe(function(oldValue, newValue){
    self.hullEdges([]);
    self.steps([]);
    self.draw();
  });

  self.add20RandomPoints = function(){
    var points = [];
    for(var i = 0; i < 20; i++){
      var theta = Math.random() * Math.PI * 2;
      var r = Math.random() * 50;
      var x = r * Math.cos(theta);
      var y = r * Math.sin(theta);
      x = Math.round(x);
      y = Math.round(y);
      points.push(
        [ x, y ]
      );
    }
    var pointString = points.map(function(d){
      return d.join(',');
    }).join('\n');
    self.pointString(self.pointString() + '\n' +  pointString );
    self.draw();
  }



  self.draw = function(){

    var width = $("#vis").width();
    var height = $(window).height() * 0.8;
    var radius = 5;
    self.svg.attr('width', width).attr('height', height);

    var data = self.points();

    var xMin = d3.min(data, function(d){return d.x});
    var xMax = d3.max(data, function(d){return d.x});
    var yMin = d3.min(data, function(d){return d.y});
    var yMax = d3.max(data, function(d){return d.y});
    var xRange = xMax - xMin;
    var yRange = yMax - yMin;
    var yMargin = 0.1 * yRange + 50;
    var xMargin = 0.1 * xRange + 50;




    var points = self.svg.selectAll('.point')
                         .data(self.points());

    points.enter().append("circle");

    points.attr('cy', function(d, i){
      return (d.y - yMin) / ((yMax - yMin) || 1) * (height - 2*yMargin) + yMargin;
    })
      .attr('class', 'point')
      .attr('r', radius)
      .attr('cx', function(d, i){
        return (d.x - xMin) / ((xMax - xMin) || 1) * (width - 2*xMargin) + xMargin;
      });

    points.exit().remove();

    var edges = self.svg.selectAll('.edges')
                         .data(self.hullEdges());

    edges.enter().append("line");

    edges.attr('x1', function(d){
      return (d[0] - xMin) / ((xMax - xMin) || 1) * (width - 2*xMargin) + xMargin;
    }).attr('y1', function(d){
      return (d[1] - yMin) / ((yMax - yMin) || 1) * (height - 2*yMargin) + yMargin;
    }).attr('x2', function(d){
      return (d[2] - xMin) / ((xMax - xMin) || 1) * (width - 2*xMargin) + xMargin;
    }).attr('y2', function(d){
      return (d[3] - yMin) / ((yMax - yMin) || 1) * (height - 2*yMargin) + yMargin;
    }).attr("stroke-width", 2).attr("stroke", "black").attr('class', 'edges');

    edges.exit().remove();


    self.svg.selectAll('.animation-edges').remove();
    self.svg.selectAll('.animation-points').remove();


    self.steps().forEach(function(step, stepIndex){
      var animationEdges = self.svg.selectAll('.animation-edges')
                           .data(step);
      animationEdges.enter().append("line");
      animationEdges.exit().remove();

      animationEdges = animationEdges.attr("stroke-width", 2).attr("stroke", "red")
      .transition().duration(ANIMATION_DELAY).delay(ANIMATION_DELAY*(stepIndex + 1));

      if(stepIndex < self.steps().length - 1){ animationEdges = animationEdges.remove(); }

      animationEdges.attr('x1', function(d){
        return (d[0] - xMin) / ((xMax - xMin) || 1) * (width - 2*xMargin) + xMargin;
      }).attr('y1', function(d){
        return (d[1] - yMin) / ((yMax - yMin) || 1) * (height - 2*yMargin) + yMargin;
      }).attr('x2', function(d){
        return (d[2] - xMin) / ((xMax - xMin) || 1) * (width - 2*xMargin) + xMargin;
      }).attr('y2', function(d){
        return (d[3] - yMin) / ((yMax - yMin) || 1) * (height - 2*yMargin) + yMargin;
      }).attr("stroke-width", 2).attr('class', 'animation-edges');


      var animationPoints = self.svg.selectAll('.animation-points').data(step);
      animationPoints.enter().append("circle");

      animationPoints.transition().duration(ANIMATION_DELAY).delay(ANIMATION_DELAY*stepIndex)
                      .attr("cx",function(d){
                        return (d[0] - xMin) / ((xMax - xMin) || 1) * (width - 2*xMargin) + xMargin;
                      }).attr("cy", function(d){
                        return (d[1] - yMin) / ((yMax - yMin) || 1) * (height - 2*yMargin) + yMargin;
                      }).attr("r", radius)
                      .attr("class", "animation-points")
                      .style("fill", "red");

    animationPoints.exit().remove();


    });


  };

  self.getConvexHull = function(){

    var xhttp = new XMLHttpRequest();
    var url = 'https://upxfqmcp10.execute-api.us-east-1.amazonaws.com/prod/quickconvexhull';

    if(xhttp) {
      xhttp.open('POST', url, true);

      //invocation.withCredentials = false;
      xhttp.onreadystatechange = function(){
        if(xhttp.readyState === XMLHttpRequest.DONE && xhttp.status === 200){
          var response = xhttp.responseText.replace(/\"/g, "");
          console.log(response);
          var hullEdges = response.split(';')
            .map(function(pointString){
            return pointString.split(",").map(function(d){return parseFloat(d);});
          });

          self.hullEdges(hullEdges);
          self.steps([]);
          self.draw();

        }

      };
      var message = "\"" + self.pointString().replace(/\n/g, ";") + "\"";
      xhttp.send(message);
    }

    };



    self.getConvexHullAnimation = function(){

      var xhttp = new XMLHttpRequest();
      var url = 'https://upxfqmcp10.execute-api.us-east-1.amazonaws.com/prod/quickconvexhull';

      if(xhttp) {
      xhttp.open('POST', url, true);

      //invocation.withCredentials = false;
      xhttp.onreadystatechange = function(){
      if(xhttp.readyState === XMLHttpRequest.DONE && xhttp.status === 200){
      var response = xhttp.responseText.replace(/\"/g, "");
      console.log(response);


      var steps = response.split('@')
                          .map(function(hullString){
                            return hullString.split(';')
                              .map(function(pointString){
                                return pointString.split(",").map(function(d){return parseFloat(d);});
                              });
                          });



      self.steps(steps);
      self.hullEdges([]);
      self.draw();

      }

      };
      var message = "\"" + "animate" + self.pointString().replace(/\n/g, ";") + "\"";
      xhttp.send(message);
      }

      };

  }



$(function(){
  var viewModel = new ViewModel();
  viewModel.svg = d3.select("#vis").append('svg');
  viewModel.draw();
  ko.applyBindings(viewModel);
})
