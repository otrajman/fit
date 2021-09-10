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

const distance_meters = distance ? `<DistanceMeters>${distance}</DistanceMeters>` : '';
const time = timestamp ? `<Time>${timestamp}</Time>` : '';
const position = latitude && longitude ? `<Position>
                <LatitudeDegrees>${latitude}</LatitudeDegrees>
                <LongitudeDegrees>${longitude}</LongitudeDegrees>
              </Position>` : '';
const altitude_meters = altitude ? `<AltitudeMeters>${altitude}</AltitudeMeters>` : '';
const heart_rate = hrm ? `<HeartRateBpm>
                  <Value>${hrm}</Value>
              </HeartRateBpm>` : '';


const trackpoints = [];

const trackpoint = `
          <Trackpoint>
            ${distance_meters} 
            ${time}
            ${position}
            ${altitude_meters} 
            ${heart_rate}
          </Trackpoint>`

const track = `
        <Track>
${trackpoints.join('')}
        </Track>
`
 
const activity =  `
  <Activities>
    <Activity Sport="${type}">
      <Id>${timestamp}</Id>
      <Lap StartTime="${start_time}">
        ${tracks}
        ${summary}
      </Lap>
    </Activity>
  </Activities>
`

const tcx = `${header}${activity}${footer}`;
 
for (let i = 0, ii = data.exercises[0].samples.recordedRoute.length; i < ii; i++) {
  const trackPoint = data.exercises[0].samples.recordedRoute[i];
  const lat = trackPoint.latitude;
  const lon = trackPoint.longitude;
  const ele = trackPoint.altitude;
  const hrm = 0; // data.exercises[0].samples.heartRate[i].value; // trackPoint.heart_rate;
  const time = trackPoint.dateTime + "Z";
  gpx += '<trkpt lat="' + lat + '" lon="' + lon + '">' + '<ele>' + ele + '</ele>' + '<time>' + time + '</time>' + ( hrm ? '<extensions><gpxtpx:TrackPointExtension><gpxtpx:hr>' + hrm + '</gpxtpx:hr></gpxtpx:TrackPointExtension></extensions>' : '' ) + '</trkpt>';
}

gpx += '</trkseg>' + '</trk>' + '</gpx>';

// console.log(gpx);
fs.writeFileSync(outfile, gpx);
