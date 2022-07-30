const tickLineColor = "rgba(0,0,0,0.1)";
const tickTextColor = "grey";

//
function axisLeft(g, { scale, innerWidth, innerHeight, axisLabel }) {
  //create axis
  g.call(d3.axisLeft(scale));

  //remove domain line
  g.selectAll(".domain").remove();

  //tick text style
  g.selectAll("text").attr("fill", tickTextColor);

  //tick line
  g.selectAll("line")
    .attr("stroke", tickLineColor)
    .attr("x1", 0)
    .attr("x2", innerWidth)
    .attr("y1", 0)
    .attr("y2", 0);

  //create axis label
  if (axisLabel)
    g.selectAll("text.label")
      .data([""])
      .join("text")
      .attr("class", "label")
      .attr("dominant-baseline", "hanging")
      .attr("text-anchor", "end")
      .attr("fill", "black")
      .attr("font-size", 14)
      .attr("font-weight", "bold")
      .attr("transform", `translate(${-40},${innerHeight / 2}) rotate(270)`)
      .text(axisLabel);
}

function axisBottom(g, { scale, innerWidth, innerHeight, axisLabel }) {
  //create axis
  g.call(d3.axisBottom(scale));

  //remove domain line
  g.selectAll(".domain").remove();

  //tick text style
  g.selectAll("text").attr("fill", tickTextColor);

  //tick line
  g.selectAll("line")
    .attr("stroke", tickLineColor)
    .attr("x1", 0)
    .attr("x2", 0)
    .attr("y1", 0)
    .attr("y2", -1 * innerHeight);

  //create axis label
  if (axisLabel) {
    g.selectAll("text.label")
      .data([""])
      .join("text")
      .attr("class", "label")
      .attr("dominant-baseline", "hanging")
      .attr("text-anchor", "end")
      .attr("fill", "black")
      .attr("font-size", 14)
      .attr("font-weight", "bold")
      .attr("transform", `translate(${innerWidth / 2},${30})`)
      .text(axisLabel);
  }
}

function axisTop(g, { scale, innerWidth, innerHeight, axisLabel }) {
  //create axis
  g.call(d3.axisTop(scale));

  //remove domain line
  g.selectAll(".domain").remove();

  //tick text style
  g.selectAll("text").attr("fill", tickTextColor);

  //tick line
  g.selectAll("line")
    .attr("stroke", tickLineColor)
    .attr("x1", 0)
    .attr("x2", 0)
    .attr("y1", 0)
    .attr("y2", innerHeight);

  //create axis label
  if (axisLabel) {
    g.selectAll("text.label")
      .data([""])
      .join("text")
      .attr("class", "label")
      .attr("dominant-baseline", "hanging")
      .attr("text-anchor", "end")
      .attr("fill", "black")
      .attr("font-size", 14)
      .attr("font-weight", "bold")
      .attr("transform", `translate(${innerWidth / 2},${-20})`)
      .text(axisLabel);
  }
}

export { axisLeft, axisBottom, axisTop };
