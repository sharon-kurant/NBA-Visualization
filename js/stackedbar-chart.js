import tooltip from "./tooltip.js";

//Metrics on the chart
const Metrics = [
  { text: "Points", key: "PTS" },
  { text: "Blocks", key: "BLK" },
  { text: "Assists", key: "AST" },
  { text: "Steals", key: "STL" },
  { text: "Rebounds", key: "REB" },
  { text: "Turnovers", key: "TOV" },
];

//bar color
const color = d3
  .scaleOrdinal()
  .domain(Metrics.map((d) => d.key))
  .range(["#06d6a0", "#f78c6b", "#118ab2", "#073b4c", "#ffd166", "#ef476f"]);

//size
const margin = { top: 20, right: 0, bottom: 0, left: 200 };
const width = 650;
const height = 600;
const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;

function createStackedbarChart(container, { players }) {
  //calculate total of every player
  players.forEach((d) => {
    d.Total = d3.sum(Metrics.map((m) => d[m.key]));
  });

  //make the data stacked
  const stacked = d3
    .stack()
    .keys(Metrics.map((d) => d.key))(players)
    .map((s) =>
      s.map((d) => {
        d.data = { ...d.data, key: s.key };
        return d;
      })
    );

  return { setTeam };

  function setTeam(teamAbb) {
    //teamAbb is undefined, remove all
    if (!teamAbb) {
      container.selectAll("*").remove();
      return;
    }

    //get the selected team data
    const data = stacked.flat().filter((d) => d.data.team == teamAbb);

    //Chart Stacked x scale
    const stackedXScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d[1])])
      .range([0, innerWidth]);

    //Chart multiples x scale
    const multiXScale = {};
    Metrics.forEach((m, i, a) => {
      const domain = [
        0,
        d3.max(
          data.filter((f) => f.data.key == m.key),
          (d) => d.data[d.data.key]
        ),
      ];

      const scale = d3
        .scaleLinear()
        .domain(domain)
        .nice()
        .range([0, innerWidth / Metrics.length - 10]);

      const x = (i * innerWidth) / a.length;

      multiXScale[m.key] = {
        x,
        scale,
      };
    });

    //Chart options
    const options = ["Stacked", "Multiples"];
    //current option
    var option = options[1];

    //create options radio button
    const form = container
      .selectAll("form")
      .data(["form"])
      .enter()
      .append("form");

    options.forEach((d) => {
      form.append("label").attr("for", d).text(d);

      form
        .append("input")
        .attr("name", "option")
        .attr("type", "radio")
        .attr("id", d)
        .attr("value", d)
        .property("checked", d == option)
        .on("change", (e) => {
          option = d;
          update();
        });
    });

    //Chart sorted-by option
    var sortedByOption = "Total";

    //create sorted-by dropdown
    form.append("label").attr("class", "sortby").text("Sorted by");
    form
      .append("select")
      .call((select) =>
        select
          .selectAll("option")
          .data(["Total", ...Metrics.map((d) => d.key)])
          .join("option")
          .text((d) => d)
      )
      .on("change", (e) => {
        sortedByOption = e.target.value;
        update();
      });

    //draw the chart
    update();

    function update() {
      //get players from the selected team
      const teamPlayers = players.filter((d) => d.team == teamAbb);

      //sort by the sorted-by option
      teamPlayers.sort((a, b) => b[sortedByOption] - a[sortedByOption]);

      //y scale
      const yScale = d3
        .scaleBand()
        .domain(teamPlayers.map((d) => d.player))
        .range([0, innerHeight])
        .padding(0.2);

      //svg
      const svg = container
        .selectAll("svg")
        .data(["svg"])
        .join("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("overflow", "visible");

      //a axis
      svg
        .selectAll("g.x-axis")
        .data(["x-axis"])
        .join("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(${margin.left},${margin.top})`)
        .call(xAxis);

      //y axis
      svg
        .selectAll("g.y-axis")
        .data(["y-axis"])
        .join("g")
        .attr("class", "y-axis")
        .attr("transform", `translate(${margin.left},${margin.top})`)
        .call((g) => {
          //
          const tick = g.selectAll("text.tick").data(teamPlayers);
          const tickEnter = tick.enter().append("text").attr("class", "tick");
          const tickUpdate = tick.merge(tickEnter);
          tick.exit().remove();

          tickEnter
            .attr("dominant-baseline", "middle")
            .attr("text-anchor", "end")
            .attr("fill", "black")
            .attr("font-size", 15)
            .attr("x", -3)
            .attr("y", (d) => yScale(d.player) + yScale.bandwidth() / 2);

          tickUpdate.text((d) => d.player);

          tickUpdate
            .transition()
            .attr("y", (d) => yScale(d.player) + yScale.bandwidth() / 2);
        });

      //draw bars
      svg
        .selectAll("g.mark")
        .data(["mark"])
        .join("g")
        .attr("class", "mark")
        .attr("transform", `translate(${margin.left},${margin.top})`)
        .call(option == "Stacked" ? stackedBars : multiBars);

      //Chart multiples: draw bars
      function multiBars(g) {
        //
        const bar = g
          .selectAll("rect.bar")
          .data(data, (d) => d.data.player + d.data.key);
        const barEnter = bar.enter().append("rect").attr("class", "bar");
        const barUpdate = bar.merge(barEnter);
        bar.exit().remove();

        //
        barEnter
          .attr("stroke", "none")
          .attr("stroke-width", 2)
          .attr("fill", (d) => color(d.data.key))
          .attr("y", (d) => yScale(d.data.player))
          .attr("width", 0)
          .attr("height", yScale.bandwidth());

        barUpdate
          .transition()
          .attr("x", (d) => multiXScale[d.data.key].x)
          .attr("y", (d) => yScale(d.data.player))
          .attr("width", (d) => {
            const scale = multiXScale[d.data.key].scale;
            const value = d.data[d.data.key];
            return scale(value);
          });

        barUpdate
          .on("mouseover", handleMouseover)
          .on("mouseout", handleMouseout);
      }

      //Chart stacked: draw bars
      function stackedBars(g) {
        const bar = g
          .selectAll("rect.bar")
          .data(data, (d) => d.data.player + d.data.key);
        const barEnter = bar.enter().append("rect").attr("class", "bar");
        const barUpdate = bar.merge(barEnter);
        bar.exit().remove();

        //
        barEnter
          .attr("stroke", "none")
          .attr("stroke-width", 2)
          .attr("fill", (d) => color(d.data.key))
          .attr("x", 0)
          .attr("y", (d) => yScale(d.data.player))
          .attr("width", 0)
          .attr("height", yScale.bandwidth());

        barUpdate
          .transition()
          .attr("y", (d) => yScale(d.data.player))
          .attr("x", (d) => stackedXScale(d[0]))
          .attr("width", (d) => stackedXScale(d[1]) - stackedXScale(d[0]));

        barUpdate
          .on("mouseover", handleMouseover)
          .on("mouseout", handleMouseout);
      }

      function xAxis(g) {
        if (option == "Stacked") {
          g.selectAll("*").remove();
          return;
        }

        //metrics text position
        const xPostion = Metrics.map(
          (m, i, a) => ((i + 0.5) * innerWidth) / a.length
        );

        //create metrics text group
        const item = g.selectAll("g.item").data(
          Metrics.map((m) => ({
            ...m,
            Total: d3.sum(
              data.filter((f) => f.data.key == m.key),
              (d) => d.data[m.key]
            ),
          }))
        );
        const itemEnter = item.enter().append("g").attr("class", "item");
        const itemUpdate = item.merge(itemEnter);
        item.exit().remove();

        //
        itemEnter
          .attr("dominant-baseline", "middle")
          .attr("text-anchor", "middle")
          .attr("fill", "black")
          .attr("font-size", 15);

        // create metrics text
        itemEnter.append("text").attr("class", "stat").attr("y", -15);

        // create total text
        itemEnter.append("text").attr("class", "total").attr("y", -2);

        //
        itemUpdate.select("text.stat").text((d) => d.text);

        itemUpdate
          .select("text.total")
          .text((d) => Math.round(d.Total * 10) / 10);

        //x position
        itemUpdate
          .transition()
          .attr("transform", (d, i) => `translate(${xPostion[i]},${0})`);
      }

      function handleMouseover(e, d) {
        //change style of the target bar
        d3.select(this).attr("stroke", "black");

        //mouse position
        const [x, y] = d3.pointer(e, container.node());

        //tooltip content
        const html = `<div class="name">${
          d.data.player
        }</div><div>${Metrics.map(
          (m) =>
            `<span class="item ${
              m.key == d.data.key ? "selected" : ""
            }"><span class="value">${d.data[m.key]}</span><span class="key">${
              m.key
            }</span></span>`
        ).join("|")}</div>`;

        //show tooltip
        tooltip(container, {
          isShow: true,
          x,
          y,
          html,
        });
      }

      function handleMouseout() {
        //change style of the target bar
        d3.select(this).attr("stroke", "none");

        //hide tooltip
        tooltip(container);
      }
    }
  }
}

export default createStackedbarChart;
