import getColor from "./color-scheme.js";
import tooltip from "./tooltip.js";

//size
const width = 400;
const height = 400;

//scale: rank score to radius
const minRadius = 30;
const maxRadius = Math.min(width, height) / 2 - 30;

const radius = d3
  .scaleLinear()
  .domain([-50, 150])
  .nice()
  .range([minRadius, maxRadius]);

//Metrics on the chart
const Metrics = [
  { text: "Points", key: "PTS" },
  { text: "Blocks", key: "BLK" },
  { text: "Assists", key: "AST" },
  { text: "Steals", key: "STL" },
  { text: "Rebounds", key: "REB" },
  { text: "Turnovers", key: "TOV" },
];

//calculate the angle on the chart of every metrics
Metrics.forEach((d, i) => {
  d.angle = (i * Math.PI * 2) / Metrics.length;
});

//get x y positon from distance and angle.
//angle start from 12'oclock direction
const angleDistX = (dist, angle) => dist * Math.sin(angle);
const angleDistY = (dist, angle) => dist * Math.cos(angle) * -1;

function createRadarChart(container, { players, teams }) {
  //calculate the sum of every metrics, grouped by team
  const stats = d3
    .rollups(
      players,
      (v) =>
        Metrics.map((m, i) => ({
          ...m,
          index: i,
          value: d3.sum(v, (d) => d[m.key]),
        })),
      (d) => d.team
    )
    .map((d) => ({ team: d[0], data: d[1] }));

  //rank map to score [0,100]
  const mapping = d3
    .scaleLinear()
    .domain([teams.length - 1, 0])
    .range([0, 100]);

  //calclate the rank score for every metrics every team
  Metrics.forEach((m) => {
    //get all values of teams of the metrics
    const values = stats
      .map((d) => d.data.find((f) => f.key == m.key))
      .map((d) => d.value);

    //get rank scores for every team
    const scores = d3.rank(values, d3.descending).map((d) => mapping(d));

    //assign the rank score to stats
    stats.forEach((d, i) => {
      const item = d.data.find((f) => f.key == m.key);
      item.valueScore = scores[i];
    });
  });

  return { setTeams };

  function setTeams(teamAbbArr) {
    //teamAbbArr is undefined remove all
    if (!teamAbbArr) {
      container.selectAll("*").remove();
      return;
    }

    //get team color scale
    const teamColor = getColor(teamAbbArr);

    //get the data of selected teams
    const data = teamAbbArr.map((abb) => stats.find((f) => f.team == abb));

    //the spider area generator
    const area = d3
      .areaRadial()
      .angle((d) => d.angle)
      .innerRadius(0)
      .outerRadius((d) => radius(d.valueScore));

    //the spider line generator
    const line = d3
      .lineRadial()
      .radius((d) => radius(d.valueScore))
      .angle((d) => d.angle);

    //svg
    const svg = container
      .selectAll("svg")
      .data(["svg"])
      .join("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("overflow", "visible");

    //legend
    svg
      .selectAll("g.legend")
      .data([""])
      .join("g")
      .attr("class", "legend")
      .attr("transform", `translate(${width + 40},${0})`)
      .call(legend, data);

    //
    const gInner = svg
      .selectAll("g.inner")
      .data(["inner"])
      .join("g")
      .attr("class", "inner")
      .attr("transform", `translate(${40 + width / 2},${height / 2})`);

    //the spider grid
    const ticks = radius
      .ticks(4)
      .map((d) => [
        ...Metrics.map((t) => ({ angle: t.angle, valueScore: d })),
        { angle: Metrics[0].angle, valueScore: d },
      ]);

    //the spider grid polygon
    gInner
      .selectAll("path.tick")
      .data(ticks)
      .join("path")
      .attr("class", "tick")
      .attr("stroke", "lightgrey")
      .attr("stroke-width", 1)
      .attr("fill", "none")
      .attr("d", line);

    //the spider grid line
    gInner
      .selectAll("line.axis")
      .data(Metrics)
      .join("line")
      .attr("class", "axis")
      .attr("stroke", "lightgrey")
      .attr("stroke-width", 1)
      .attr("x1", 0)
      .attr("x2", (d) => angleDistX(radius.range()[1], d.angle))
      .attr("y1", 0)
      .attr("y2", (d) => angleDistY(radius.range()[1], d.angle));

    //the spider grid metrics label
    gInner
      .selectAll("text.axis-label")
      .data(Metrics)
      .join("text")
      .attr("class", "axis-label")
      .attr("dominant-baseline", (d) =>
        d.angle == (Math.PI * 3) / 2 || d.angle == Math.PI / 2
          ? "middle"
          : d.angle < Math.PI / 2 || d.angle > (Math.PI * 3) / 2
          ? "auto"
          : "hanging"
      )
      .attr("text-anchor", (d) =>
        d.angle == 0 || d.angle == Math.PI
          ? "middle"
          : d.angle < Math.PI
          ? "start"
          : "end"
      )
      .attr("fill", "black")
      .attr("font-size", 14)
      .attr("x", (d) => angleDistX(radius.range()[1] + 5, d.angle))
      .attr("y", (d) => angleDistY(radius.range()[1] + 5, d.angle))
      .text((d) => d.key);

    //teams
    const team = gInner.selectAll("g.team").data(data, (d) => d.team);
    const teamEnter = team.enter().append("g").attr("class", "team");
    const teamUpdate = team.merge(teamEnter);
    team.exit().remove();

    //team color
    teamEnter
      .attr("stroke", (d) => teamColor(d.team))
      .attr("fill", (d) => teamColor(d.team));

    //team area
    teamEnter
      .append("path")
      .attr("class", "area")
      .attr("stroke", "none")
      .attr("fill-opacity", 0.3);

    //team area border
    teamEnter
      .append("path")
      .attr("class", "border")
      .attr("stroke-width", 2)
      .attr("fill", "none");

    //area shape
    teamUpdate
      .select("path.area")
      .datum((d) => [...d.data, d.data[0]])
      .attr("d", area);

    //border shape
    teamUpdate
      .select("path.border")
      .datum((d) => [...d.data, d.data[0]])
      .attr("d", line);

    //team dots
    teamUpdate
      .selectAll("circle")
      .data((d) => d.data)
      .join("circle")
      .attr("cx", (d) => angleDistX(radius(d.valueScore), d.angle))
      .attr("cy", (d) => angleDistY(radius(d.valueScore), d.angle))
      .attr("r", 4);

    //event
    teamUpdate.on("mousemove", handleMousemove).on("mouseout", handleMouseout);

    function handleMousemove(e, d) {
      //raise it to top
      d3.select(this).raise();

      //make all of team area opacity 0
      teamUpdate.selectAll("path.area").attr("opacity", 0);

      //make it opacity 0.8
      d3.select(this).select("path.area").attr("opacity", 0.8);

      //show tooltip
      tooltipShow(e, d);
    }

    function handleMouseout(e, d) {
      //make all of team area opacity 0.3
      teamUpdate.selectAll("path.area").attr("opacity", 0.3);

      //hide tooltip
      tooltipHide();
    }
  }

  function legend(g, data) {
    //
    const teamColor = getColor(data.map((d) => d.team));

    //legend symbol rect
    const rectWidth = 15;
    const rectHeight = 10;

    //legend item
    g.selectAll("g.legend-item")
      .data(data)
      .join("g")
      .attr("class", "legend-item")
      .each(function () {
        //item symbol
        d3.select(this)
          .selectAll("rect")
          .data(data)
          .join("rect")
          .attr("fill", (d) => teamColor(d.team))
          .attr("stroke", "none")
          .attr("x", 0)
          .attr("y", (d, i) => i * (rectHeight + 10))
          .attr("width", rectWidth)
          .attr("height", rectHeight)
          .on("mousemove", handleMousemove)
          .on("mouseout", handleMouseout);

        //item text
        d3.select(this)
          .selectAll("text")
          .data(data)
          .join("text")
          .attr("dominant-baseline", "middle")
          .attr("text-anchor", "start")
          .attr("fill", "grey")
          .attr("font-size", 14)
          .attr("x", rectWidth + 5)
          .attr("y", (d, i) => i * (rectHeight + 10) + rectHeight * 0.5 + 1)
          .text((d) => d.team)
          .on("mousemove", handleMousemove)
          .on("mouseout", handleMouseout);
      });

    function handleMousemove(e, d) {
      //find the team
      const team = container
        .selectAll("g.team")
        .filter((f) => f.team == d.team);

      //raise it to the layer top
      team.raise();

      //style change
      container.selectAll("path.area").attr("opacity", 0);
      team.select("path.area").attr("opacity", 0.9);

      //show tooltip
      tooltipShow(e, d);
    }

    function handleMouseout() {
      //style change
      container.selectAll("path.area").attr("opacity", 0.3);

      //hide tooltip
      tooltipHide();
    }
  }

  function tooltipShow(e, d) {
    //position
    const [x, y] = d3.pointer(e, container.node());

    //tooltip content
    const html = `<div class="name">${d.team}</div><div>${d.data
      .map(
        (dd) =>
          `<span class="item ${
            e.srcElement.__data__.key == dd.key ? "selected" : ""
          }"><span class="value">${
            Math.round(dd.value * 10) / 10
          }</span><span class="key">${dd.key}</span></span>`
      )
      .join("|")}</div>`;

    //tooltip show
    tooltip(container, { isShow: true, x, y, html });
  }

  function tooltipHide() {
    //tooltip hide
    tooltip(container);
  }
}

export default createRadarChart;
