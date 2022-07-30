//size
const width = 750;
const height = 500;

//team logo size
const imageWidth = 200;
const imageHeight = 200;

//Define map projection
const projection = d3.geoAlbersUsa().translate([350, 250]);

//Define path generator
const geoPath = d3.geoPath().projection(projection);

//
const ConferenceColor = {
  West: { text: "West", color: "#FFB6C1" },
  East: { text: "East", color: "#C6E2FF" },
};

//symbol dot style scale
const winExtent = [0, 82];
const radius = d3.scaleLinear().domain(winExtent).range([4, 22]);
const fontSize = d3.scaleLinear().domain(winExtent).range([12, 20]);
const opacity = d3.scaleLinear().domain(winExtent).range([0.4, 0.9]);

const teamLabelAnchorEnd = ["PHI", "BKN"];
const teamLabelDx = (d) =>
  teamLabelAnchorEnd.includes(d.abb) ? radius(d.W) * -1 : radius(d.W);

function createMap(container, { teams, geo }) {
  //team selection
  var selection = [];

  //team selection change callback
  var selectionChangeCallback = () => {};

  //svg
  const svg = container
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("overflow", "visible");

  const gMap = svg.append("g").attr("class", "map");
  const gTeam = svg.append("g").attr("class", "team");

  //clear selection button
  const btnClear = container
    .append("button")
    .attr("class", "clear")
    .style("visibility", "hidden")
    .text("Clear selection")
    .on("click", () => {
      selection = []; //make selection empty
      handleSelectionChange();
    });

  //create legend
  legend(container);

  //state shapes
  gMap
    .selectAll("path.feature")
    .data(geo.features)
    .enter()
    .append("path")
    .attr("class", "feature")
    .attr("stroke", "white")
    .attr("stroke-width", 2)
    .attr("fill", (d) =>
      !d.properties.EASTorWEST
        ? "#CCCCCC"
        : ConferenceColor[d.properties.EASTorWEST].color
    )
    .attr("d", geoPath);

  //team
  const team = gTeam.selectAll("g.team").data(teams);
  const teamEnter = team.enter().append("g").attr("class", "team");

  teamEnter.attr(
    "transform",
    (d) =>
      `translate(${projection([d.lon, d.lat])[0]},${
        projection([d.lon, d.lat])[1]
      })`
  );

  //team dot
  teamEnter
    .append("circle")
    .attr("fill", (d) => (d.EASTorWEST == "East" ? "blue" : "red"))
    .style("opacity", (d) => opacity(d.W))
    .attr("stroke", "white")
    .style("cursor", "pointer")
    .attr("r", (d) => radius(d.W));

  //team text
  teamEnter
    .append("text")
    .attr("text-anchor", (d) =>
      teamLabelAnchorEnd.includes(d.abb) ? "end" : "start"
    )
    .attr("dx", (d) => teamLabelDx(d) + 1)
    .attr("dy", ".3em")
    .attr("y", 1)
    .attr("font-size", (d) => fontSize(d.W) + "px")
    .style("fill", "#888888")
    .style("font-weight", "bold")
    .style("cursor", "default")
    .text((d) => d.abb);

  //team event
  teamEnter.on("mouseover", handleMouseover).on("mouseout", handleMouseout);

  //team dot event
  teamEnter.selectAll("circle").on("click", handleClick);

  return {
    onSelectionChange: (handler) => {
      selectionChangeCallback = handler;
    },
  };

  //
  function handleMouseover(_, d) {
    //raise it to the layer top
    d3.select(this).raise();

    //dot style change
    d3.select(this)
      .select("circle")
      .transition()
      .duration(200)
      .attr("r", (d) => 1.5 * radius(d.W))
      .style("opacity", 1)
      .style("stroke-width", "2px");

    //text style change
    d3.select(this)
      .select("text")
      .transition()
      .duration(200)
      .attr("dx", (d) => teamLabelDx(d) * 1.5)
      .style("fill", "#000000")
      .text((d) => `${d.abb} ${d.W}(W)-${d.L}(L)`);

    //Append the logo of the team
    d3.select(this)
      .append("image")
      .attr("xlink:href", `../FinalProject/asset/${d.abb}_logo.svg`)
      .attr("width", imageWidth + "px")
      .attr("height", imageHeight + "px")
      .attr("x", (d) =>
        projection([d.lon, d.lat])[0] + imageWidth > width
          ? -15 - imageWidth
          : 15
      )
      .attr(
        "y",
        projection([d.lon, d.lat])[1] + imageHeight > height
          ? 0 - imageHeight
          : 5
      );
  }

  function handleMouseout() {
    //make the dot to the normal style
    d3.select(this)
      .select("circle")
      .transition()
      .duration(200)
      .attr("r", (d) => radius(d.W))
      .style("opacity", (d) => opacity(d.W))
      .style("stroke-width", "1px");

    //make the text to the normal style
    d3.select(this)
      .select("text")
      .transition()
      .duration(200)
      .attr("dx", (d) => teamLabelDx(d))
      .style("fill", "#888888")
      .text((d) => d.abb);

    //remove the logo
    d3.select(this).select("image").remove();
  }

  function handleClick(e, d) {
    if (selection.includes(d.abb)) {
      //deselect
      selection = selection.filter((f) => f !== d.abb);
    } else {
      //select
      selection.push(d.abb);
    }

    handleSelectionChange();
  }

  function handleSelectionChange() {
    //team circle color
    teamEnter
      .selectAll("circle")
      .attr("fill", (d) =>
        selection.includes(d.abb)
          ? "orange"
          : d.EASTorWEST == "East"
          ? "blue"
          : "red"
      );

    //clear button visibility
    btnClear.style("visibility", selection.length > 1 ? "visible" : "hidden");

    //callback
    selectionChangeCallback(selection);
  }
}

function legend(container) {
  //
  container
    .append("div")
    .attr("class", "legend")
    .call((div) => {

      //legend title
      div.append("div").text("Conference");

      //legend item
      const item = div
        .selectAll("div.item")
        .data(Object.values(ConferenceColor))
        .enter()
        .append("div")
        .attr("class", "item");

      item
        .append("span")
        .attr("class", "symbol")
        .style("background-color", (d) => d.color);

      item
        .append("span")
        .attr("class", "label")
        .text((d) => d.text);
    });
}

export default createMap;
