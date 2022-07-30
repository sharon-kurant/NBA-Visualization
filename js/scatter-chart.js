import getColor from "./color-scheme.js";
import { axisLeft, axisBottom } from "./axis.js";
import tooltip from "./tooltip.js";

//size
const margin = { top: 20, right: 40, bottom: 40, left: 40 };
const width = 1400;
const height = 400 * 1.5;
const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;

//dot radius
const radius = 6 * 1.2;

//axis options
const AxisOptions = ["REB", "PTS", "TOV", "AST", "BLK", "STL"];

function createScatterChart(container, { players }) {
  var data = [];
  var teamsSelection = [];

  //current axis option
  var axisOption = { x: AxisOptions[0], y: AxisOptions[1] };

  //initial hide the chart
  container.style("visibility", "hidden");

  //create axis-options dropdown
  container
    .selectAll("div.axis-options")
    .data([
      { key: "x", options: AxisOptions },
      { key: "y", options: AxisOptions },
    ])
    .enter()
    .append("div")
    .attr("class", "axis-options")
    .call((options) => {
      //label
      options.append("span").text((d) => d.key.toUpperCase() + " axis");

      //dropdown
      options
        .append("select")
        .selectAll("option")
        .data((d) => d.options.map((dd) => ({ key: d.key, option: dd })))
        .join("option")
        .attr("value", (d) => d.value)
        .property("selected", (d) => axisOption[d.key] == d.option)
        .text((d) => d.option);

      //event
      options.select("select").on("change", (e, d) => {
        axisOption[d.key] = e.target.value;
        update();
      });
    });

  //svg
  const svg = container
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("overflow", "visible");

  const gYAxis = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const gXAxis = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top + innerHeight})`);

  const gMark = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  //scale
  const xScale = d3.scaleLinear().range([0, innerWidth]);
  const yScale = d3.scaleLinear().range([innerHeight, 0]);

  return { setTeams };

  function setTeams(teamAbbList) {
    //current selected teams
    teamsSelection = teamAbbList;

    //get the players from the selected teams
    data = players
      .filter((f) => teamAbbList.includes(f.team))
      .map((d, i) => ({ ...d, index: i }));

    //draw the chart
    update();
  }

  function update() {
    //there is no selected team, hide the chart
    if (teamsSelection.length == 0) {
      container.style("visibility", "hidden");
      return;
    }

    //make the chart visible
    container.style("visibility", "visible");

    //x axis option, y axis option
    const { x, y } = axisOption;

    //team color scale
    const teamColor = getColor(teamsSelection);

    //x scale
    xScale.domain(d3.extent(data, (d) => d[x])).nice();

    //y scale
    yScale.domain(d3.extent(data, (d) => d[y])).nice();

    //palyer group
    const player = gMark.selectAll("g.player").data(data, (d) => d.player);
    const playerEnter = player.enter().append("g").attr("class", "player");
    const playerUpdate = player.merge(playerEnter);
    player.exit().remove();

    playerEnter.attr(
      "transform",
      (d) => `translate(${xScale(d[x])},${innerHeight})`
    );
    playerEnter.append("circle");

    playerUpdate
      .transition()
      .attr("transform", (d) => `translate(${xScale(d[x])},${yScale(d[y])})`);

    //player dot
    playerUpdate
      .selectAll("circle")
      .attr("fill", (d) => teamColor(d.team))
      .attr("opacity", 0.9)
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .attr("r", radius);

    //event
    playerUpdate
      .on("mouseover", handleMouseover)
      .on("mouseout", handleMouseout);

    //handler
    function handleMouseover(e, d) {
      //raise the dot to the layer top
      d3.select(this).raise();

      //change the style of the dot
      d3.select(this)
        .selectAll("circle")
        .attr("opacity", 1)
        .attr("stroke", "black");

      //mouse position
      const pos = d3.pointer(e, container.node());

      //tooltip content
      const html = `<div class="name">${d.player}<span class="team">${d.team}</span></div><div class="item">${x} ${d[x]}</div><div>${y} ${d[y]}</div>`;
      
      //show tooltip
      tooltip(container, {
        isShow: true,
        x: pos[0],
        y: pos[1],
        html,
      });
    }

    function handleMouseout(e, d) {
      //change the style of the dot
      d3.select(this)
        .selectAll("circle")
        .attr("opacity", 0.9)
        .attr("stroke", "white");

      //hide tooltip
      tooltip(container);
    }

    //draw y axis
    gYAxis.call(axisLeft, {
      scale: yScale,
      innerHeight,
      innerWidth,
      axisLabel: y,
    });

    //draw x axis
    gXAxis.call(axisBottom, {
      scale: xScale,
      innerWidth,
      innerHeight,
      axisLabel: x,
    });
  }
}

export default createScatterChart;
