// state  // district

const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();
app.use(express.json());
const dbpath = path.join(__dirname, "covid19India.db");
let db = null;

const initializationDBandServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running ar http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializationDBandServer();

//
const convertIntoCamel = (eachState) => {
  return {
    stateId: eachState.state_id,
    stateName: eachState.state_name,
    population: eachState.population,
  };
};

const convertIntoCamel2 = (eachDistrict) => {
  return {
    districtId: eachDistrict.district_id,
    districtName: eachDistrict.district_name,
    stateId: eachDistrict.state_id,
    cases: eachDistrict.cases,
    cured: eachDistrict.cured,
    active: eachDistrict.active,
    deaths: eachDistrict.deaths,
  };
};

// API 1
app.get("/states/", async (request, response) => {
  const selectAllStates = `SELECT * FROM state`;
  const dbresponse = await db.all(selectAllStates);
  response.send(dbresponse.map((eachState) => convertIntoCamel(eachState)));
});

// API 2
app.get("/states/:stateId", async (request, response) => {
  const { stateId } = request.params;
  const selectStateId = `SELECT * FROM state WHERE state_id = ${stateId}`;
  const dbresponse = await db.get(selectStateId);
  response.send(convertIntoCamel(dbresponse));
});

// API 3
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const insertIntoDistricts = `INSERT INTO district (district_name, state_id, cases, cured, active, deaths)
      VALUES ('${districtName}',${stateId},${cases},${cured},${active},${deaths})`;
  const dbresponse = await db.run(insertIntoDistricts);
  response.send("District Successfully Added");
});

// API 4
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const selectDistrictId = `SELECT * FROM district WHERE district_id = ${districtId}`;
  const dbresponse = await db.get(selectDistrictId);
  response.send(convertIntoCamel2(dbresponse));
});

// API 5
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrict = `DELETE FROM district WHERE district_id = ${districtId}`;
  const dbresponse = await db.run(deleteDistrict);
  response.send("District Removed");
});

// API 6
app.put("/districts/:districtId/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const { districtId } = request.params;
  const updateDistricts = `
    UPDATE district SET 
    district_name = '${districtName}',state_id = ${stateId},cases = ${cases},cured = ${cured},active = ${active},deaths = ${deaths}
    WHERE district_id = ${districtId}`;
  const dbresponse = await db.run(updateDistricts);
  response.send("District Details Updated");
});

// API 7
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const createTableOf = `
    SELECT 
        SUM(cases),
        SUM(cured),
        SUM(active),
        SUM(deaths)
    FROM district
    WHERE state_id = ${stateId}`;
  const stats = await db.get(createTableOf);
  console.log(stats);
  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

// API 8
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const selectStateName = `
    SELECT state_id FROM district WHERE district_id = ${districtId}`;
  const dbresponse = await db.get(selectStateName);

  const selectState = `
    SELECT state_name as stateName FROM state WHERE state_id = ${dbresponse.state_id}`;
  const dbresponse2 = await db.get(selectState);
  response.send(dbresponse2);
});

//
module.exports = app;
