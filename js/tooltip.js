const tooltip = (container, props = {}) => {
  const { isShow = false, html = "", x = 0, y = 0 } = props;

  //create tooltip
  container
    .selectAll("div.tooltip")
    .data(["tooltip"])
    .join("div")
    .attr("class", "tooltip")
    .html(html)
    .style("visibility", isShow ? "visible" : "hidden")
    .style("left", x + 18 + "px")
    .style("top", y + -10 + "px");
};

export default tooltip;
