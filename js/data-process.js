const TeamNumberTypeStats = [
  "no",
  "W",
  "L",
  "W/L%",
  "MOV",
  "ORtg",
  "DRtg",
  "NRtg",
  "MOV/A",
  "ORtg/A",
  "DRtg/A",
  "NRtg/A",
  "lat",
  "lon",
  "rank",
  "winrate",
];

const PlayerNumberTypeStats = [
  "Age",
  "GP",
  "GS",
  "MIN",
  "FG",
  "PIE",
  "FG%",
  "3P",
  "3PA",
  "3P%",
  "2P",
  "2PA",
  "2P%",
  "TS%",
  "FT",
  "FTA",
  "FTP%",
  "ORB",
  "DRB",
  "REB",
  "AST",
  "STL",
  "BLK",
  "TOV",
  "PF",
  "PTS",
];

const toNumber = (str) => (str.trim() !== "" ? str.trim() * 1 : undefined);

const dataTypeConvert = (raw, numberTypeStats) =>
  raw.map((d) => ({
    ...d,
    ...numberTypeStats
      .map((stat) => ({
        [stat]: toNumber(d[stat]),
      }))
      .reduce((prev, curr) => ({ ...prev, ...curr }), {}),
  }));

function dataProcess({
  rawTeams = [],
  rawPlayers = [],
  rawGeo = {},
  usStates,
}) {
  //data type convert
  const teams = dataTypeConvert(rawTeams, TeamNumberTypeStats);
  const players = dataTypeConvert(rawPlayers, PlayerNumberTypeStats);

  //
  const usStatesInfo = usStates.reduce((prev, curr) => {
    prev[curr.state] = curr;
    return prev;
  }, {});

  //add usStatesInfo to geo json
  rawGeo.features.forEach((feature) => {
    const name = feature.properties.name;
    if (usStatesInfo[name]) {
      feature.properties["EASTorWEST"] = usStatesInfo[name]["EASTorWEST"];
    }
  });

  return { teams, players, geo: rawGeo };
}

export default dataProcess;
