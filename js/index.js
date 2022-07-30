import dataProcess from "./data-process.js";
import createMap from "./map.js";
import createScatterChart from "./scatter-chart.js";
import createRadarChart from "./radar-chart.js";
import createStackedbarChart from "./stackedbar-chart.js";

Promise.all([
  d3.csv("./data/NBA-teams.csv"),
  d3.csv("./data/players.csv"),
  d3.json("./data/US-geo.json"),
  d3.csv("./data/US-states.csv"),
]).then((raw) => {
  //data process
  const data = dataProcess({
    rawTeams: raw[0],
    rawPlayers: raw[1],
    rawGeo: raw[2],
    usStates: raw[3],
  });

  //create viz
  const map = createMap(d3.select(".map"), data);
  const stackedbarChart = createStackedbarChart(d3.select(".team-chart"), data);
  const radarChart = createRadarChart(d3.select(".team-chart"), data);
  const scatterChart = createScatterChart(d3.select(".player-chart"), data);

  //event: team selection change
  map.onSelectionChange((selection) => {
    switch (selection.length) {
      case 0:
        stackedbarChart.setTeam(); //show nothing
        radarChart.setTeams(); //show nothing
        break;
      case 1:
        radarChart.setTeams(); //show nothing
        stackedbarChart.setTeam(selection[0]); //show the only team
        break;
      case 2:
        stackedbarChart.setTeam(); //show nothing
        radarChart.setTeams(selection); //show teams
        break;
      default:
        radarChart.setTeams(selection);
        break;
    }

    scatterChart.setTeams(selection); //show teams
  });
});
