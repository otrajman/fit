#!/usr/bin/env node
fs = require('fs')
infile = process.argv[2]
outfile = process.argv[3]

console.log(`${infile} => ${outfile}`)

const rawData = fs.readFileSync(infile);
const data = JSON.parse(rawData);
// data = eval(rawData.replace(/\n/g, '')),
// const lastTrkPt = data[data.length-1],
const date = new Date(data.startTime).toISOString(); // lastTrkPt.timestamp.replace(" ", "T") + 'Z',
const shortDate = date.split("T")[0];

const header = `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase
    xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2"
    xmlns:ns2="http://www.garmin.com/xmlschemas/UserProfile/v2"
    xmlns:ns3="http://www.garmin.com/xmlschemas/ActivityExtension/v2"
    xmlns:ns4="http://www.garmin.com/xmlschemas/ProfileExtension/v1"
    xmlns:ns5="http://www.garmin.com/xmlschemas/ActivityGoals/v1"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2 http://www.garmin.com/xmlschemas/TrainingCenterDatabasev2.xsd">
    <Author xsi:type="Application_t">
      <Name>Polar Flow</Name>
      <Build>
          <Version>
              <VersionMajor>0</VersionMajor>
              <VersionMinor>0</VersionMinor>
              <BuildMajor>0</BuildMajor>
              <BuildMinor>0</BuildMinor>
          </Version>
      </Build>
      <LangID>en</LangID>
      <PartNumber>000-00000-00</PartNumber>
    </Author>`


const footer = `</TrainingCenterDatabase>`

const total_distance = data.distance;
const total_time = data.duration.slice(2);
const calories = data.kiloCalories;
const avg_hrm = data.averageHeartRate;
const max_hrm = data.maximumHeartRate;

const summary = `
        <DistanceMeters>${total_distance}</DistanceMeters>
        <TotalTimeSeconds>${total_time}</TotalTimeSeconds>
        <Calories>${calories}</Calories>
        <AverageHeartRateBpm>
            <Value>${avg_hrm}</Value>
        </AverageHeartRateBpm>
        <MaximumHeartRateBpm>
            <Value>${max_hrm}</Value>
        </MaximumHeartRateBpm>
        <Intensity>Active</Intensity>
        <TriggerMethod>Manual</TriggerMethod>
`

const samples = [];

for (const alt of data.exercises[0].samples.altitude) {
  samples.push({date: new Date(alt.dateTime), altitude: alt.value });
}

for (const hrm of data.exercises[0].samples.heartRate) {
  samples.push({date: new Date(hrm.dateTime), heartrate: hrm.value });
}

for (const dist of data.exercises[0].samples.distance) {
  samples.push({date: new Date(dist.dateTime), altitude: dist.value });
}

for (const rr of data.exercises[0].samples.recordedRoute) {
  samples.push({date: new Date(rr.dateTime), altitude: rr.altitude, longitude: rr.longitude, latitude: rr.latitude });
}

// data.samples.speed
// data.samples.candence
// data.samples.temperature
// data.samples.leftPedalCrankBasedPower

samples.sort((a,b) => a.date.getTime() - b.date.getTime());

const trackpoints = [];

for (let i = 0; i < samples.length; ) {
  let s = samples[i];
  let d = s.date;
  let distance_meters = '';
  let time = '';
  let position = '';
  let altitude_meters = '';
  let heart_rate = '';

  while (s && d.getTime() === s.date.getTime()) {
    if (s.distance) distance_meters = `<DistanceMeters>${s.distance}</DistanceMeters>`;
    if (s.date) time = `<Time>${s.date.toISOString()}</Time>`;
    if (s.latitude && s.longitude) position = `<Position>
                <LatitudeDegrees>${s.latitude}</LatitudeDegrees>
                <LongitudeDegrees>${s.longitude}</LongitudeDegrees>
              </Position>`;
    if (s.altitude) altitude_meters = `<AltitudeMeters>${s.altitude}</AltitudeMeters>`;
    if (s.heartrate) heart_rate = `<HeartRateBpm>
                 <Value>${s.heartrate}</Value>
               </HeartRateBpm>`;

    i++;
    s = samples[i];
  }

  const trackpoint = `
            <Trackpoint>
              ${distance_meters} 
              ${time}
              ${position}
              ${altitude_meters} 
              ${heart_rate}
            </Trackpoint>`

  trackpoints.push(trackpoint);
}

const track = `
        <Track>
${trackpoints.join('')}
        </Track>
`

const atype = data.exercises[0].sport;
const timestamp = new Date(data.exercises[0].startTime).toISOString();
const start_time = new Date(data.exercises[0].startTime).toISOString();
 
const activity =  `
  <Activities>
    <Activity Sport="${atype}">
      <Id>${timestamp}</Id>
      <Lap StartTime="${start_time}">
        ${track}
        ${summary}
      </Lap>
    </Activity>
  </Activities>
`

const tcx = `${header}${activity}${footer}`;

/*
for (let i = 0, ii = data.exercises[0].samples.recordedRoute.length; i < ii; i++) {
  const trackPoint = data.exercises[0].samples.recordedRoute[i];
  const lat = trackPoint.latitude;
  const lon = trackPoint.longitude;
  const ele = trackPoint.altitude;
  const hrm = 0; // data.exercises[0].samples.heartRate[i].value; // trackPoint.heart_rate;
  const time = trackPoint.dateTime + "Z";
  gpx += '<trkpt lat="' + lat + '" lon="' + lon + '">' + '<ele>' + ele + '</ele>' + '<time>' + time + '</time>' + ( hrm ? '<extensions><gpxtpx:TrackPointExtension><gpxtpx:hr>' + hrm + '</gpxtpx:hr></gpxtpx:TrackPointExtension></extensions>' : '' ) + '</trkpt>';
}

gpx += '</trkseg>' + '</trk>' + '</gpx>'; */

// console.log(gpx);
fs.writeFileSync(outfile, tcx);
