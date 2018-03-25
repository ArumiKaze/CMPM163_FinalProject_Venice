let fs = require('fs');
let xml2js = require('xml2js');
let earcut = require('earcut');
let xmlparser = new xml2js.Parser();

let topleft = [12.297, 45.451];
let botright = [12.371, 45.423];
let buildingadjust = [0.00, 0.00, 0.00];
let objfixed = 6; // obj precision

fs.readFile('buildings.xml', function (err, ff) {

  xmlparser.parseString(ff, function (err, data) {

    // Debug print for insuring OSM data structure validity.
    console.log(data.osm.node[0].$);
    console.log(data.osm.way[0]);
    console.log(data.osm.way[0].nd[0]);
    console.log(data.osm.way[0].tag[0]);

    let nodes = {};

    // Copy all latitudinal and longitudinal vertices.
    console.log('Copying vertex values...');
    for (let i = 0; i < data.osm.node.length; i++) {
      nodes[data.osm.node[i].$.id] = data.osm.node[i].$;
    }

    let bvertices = [];
    let bindices = [];
    let bnormals = [[0, 0, 1]];
    let btex = [];

    let windices = [];
    let wnormals = [];
    let wtex = [];

    console.log('Number of buildings = ' + data.osm.way.length);
    console.log('Generating buildings...');

    let tagTypes = [];
    let buildingTypes = [];

    for (let i = 0; i < data.osm.way.length; i++) {
      if (typeof data.osm.way[i].tag !== 'undefined') {
        for (let j = 0; j < data.osm.way[i].tag.length; j++) {
          tagTypes.push(data.osm.way[i].tag[j].$.k);
          if (data.osm.way[i].tag[j].$.k == "building") {
            buildingTypes.push(data.osm.way[i].tag[j].$.v);
          }
        }
      }
    }
    buildingTypes = buildingTypes.filter(function(item, pos) {
      return buildingTypes.indexOf(item) == pos;
    });
    tagTypes = tagTypes.filter(function(item, pos) {
      return tagTypes.indexOf(item) == pos;
    });
    console.log(buildingTypes);
    console.log(tagTypes);

    let buildingInfo = [[ {} ]];
    for (let i = 0; i < buildingTypes.length; i++) {
      buildingInfo.push([]);
    }

    let cw = true; // ??
    let track = 0;

    // For all buildings...
    for (let i = 0; i < data.osm.way.length; i++) {

      let valid = true;

      let ttags = [];

      if (typeof data.osm.way[i].tag !== 'undefined') {
        for (let j = 0; j < data.osm.way[i].tag.length; j++) {
          let t = data.osm.way[i].tag[j].$.k;
          let u = data.osm.way[i].tag[j].$.v;

          if (t == 'barrier' || t == 'highway' || t == 'landuse' ||
            t == 'layer' || t == 'waterway' || t == 'area' || t == 'fixme' || u == 'pipeline'
            || t == 'surface' || t == 'natural' || t == 'power' || t == 'route'
            || t == 'bicycle' || t == 'access' || t == 'mooring' || t == 'railway'
            || u == 'islet' || u == 'island' || u == 'neighbourhood' || t == 'amenity' || t == 'leisure'
            || (t == 'man_made' && data.osm.way[i].tag.length == 1 && data.osm.way[i].nd.length != 4)) {
            valid = false;
            break;
          } else {
            ttags.push(t);
          }

          // flat = landuse, area, amenity, leisure u = islet, island
        }

      } else {
        valid = false;
      }

      if (data.osm.way[i].nd.length <= 2) valid = false;

      /*
      ttags = ttags.filter(function(item, pos) {
        return ttags.indexOf(item) == pos;
      });

      if (valid) {
        console.log(data.osm.way[i]);
        console.log(data.osm.way[i].tag);
        console.log(ttags);
      }
      */

      if (!valid) continue;

      let origvertices = [];
      let shoelace = 0;
      let del = false;

      let percent = Math.round(100*i/data.osm.way.length);
      if (percent != track) {
        console.log( track + '% completed.');
        track = percent;
      }

      // For all building vertices.
      for (let j = 0; j < data.osm.way[i].nd.length; j++) {

        let ref = nodes[data.osm.way[i].nd[j].$.ref];
        let bx = parseFloat(ref.lon);
        let by = parseFloat(ref.lat);

        // For all but the last vertex pair, calculate shoelace theorem.
        if (j != data.osm.way[i].nd.length - 1) {
          let ref2 = nodes[data.osm.way[i].nd[j+1].$.ref];
          let bx2 = parseFloat(ref2.lon);
          let by2 = parseFloat(ref2.lat);
          shoelace += (bx2 - bx) * (by2  + by);
        }

        // Delete buildings that cross over the edge.
        if (bx > botright[0] || bx < topleft[0]) del = true;
        if (by > topleft[1] || by < botright[1]) del = true;

        origvertices.push(bx);
        origvertices.push(by);

      }

      if (del) continue; // Commit to delete for overflow buildings.

      // clockwise vertices or not (utilizing shoelace algorithm)
      if (shoelace > 0) cw = true;
      else cw = false;

      let flatvertices = [];
      let height = 12 + Math.random()*8; // set to 3-4 for lowelev

      // flatvertices - every two vertices represent the top and bottom corner of wall vertex
      for (let j = 0; j < origvertices.length; j += 2) {
        let z = 20;
        flatvertices.push([
          (origvertices[j] - topleft[0] + buildingadjust[0])*97200,
          (topleft[1] - origvertices[j+1] + buildingadjust[1])*97200,
          height
        ]);
        flatvertices.push([
          (origvertices[j] - topleft[0] + buildingadjust[0])*97200,
          (topleft[1] - origvertices[j+1] + buildingadjust[1])*97200,
          0
        ]);
      }

      // generate earcut for roof
      let earcutindices = earcut(origvertices);
      let baseindex = bvertices.length;

      // we're using flatvertices, which is double in size
      for (let j = 0; j < earcutindices.length; j++) {
        earcutindices[j] *= 2;
        earcutindices[j] += baseindex;
      }

      let wallindices = [];

      // for every wall edge
      for (let j = 0; j < flatvertices.length - 2; j += 2) {

        let wx = flatvertices[j+2][1] - flatvertices[j][1];
        let wy = flatvertices[j+2][0] - flatvertices[j][0];
        let wdist = Math.sqrt((wx*wx) + (wy*wy));

        if (cw) wnormals.push([ -1 * wx/wdist, wy/wdist, 0 ])
        else wnormals.push([ wx/wdist, -1 * wy/wdist, 0 ])

        wtex.push([wdist, height, cw]);

        if (cw) wallindices.push(j, j+1, j+3, j, j+3, j+2);
        else wallindices.push(j, j+3, j+1, j, j+2, j+3);

      }

      for (let j = 0; j < wallindices.length; j++) {
        wallindices[j] += baseindex;
      }

      bvertices = bvertices.concat(flatvertices);
      bindices = bindices.concat(earcutindices);
      windices = windices.concat(wallindices);

      // debug only one building
      //if (valid) break;

    }

    for (let i = 0; i < bvertices.length; i++) {
      bvertices[i][0] = -1 * bvertices[i][0].toFixed(objfixed);
      bvertices[i][1] = bvertices[i][1].toFixed(objfixed);
      bvertices[i][2] = bvertices[i][2].toFixed(objfixed);
    }

    for (let i = 0; i < wnormals.length; i++) {
      wnormals[i][0] = wnormals[i][0].toFixed(objfixed);
      wnormals[i][1] = wnormals[i][1].toFixed(objfixed);
      wnormals[i][2] = wnormals[i][2].toFixed(objfixed);
    }

    let filestring = '';

    for (let i = 0; i < bvertices.length; i++) {
      filestring += 'v ' + bvertices[i].join(' ') + '\n';
    }

    for (let i = 0; i < bnormals.length; i++) {
      filestring += 'vn ' + bnormals[i].join(' ') + '\n';
    }

    for (let i = 0; i < wnormals.length; i++) {
      filestring += 'vn ' + wnormals[i].join(' ') + '\n';
    }

    console.log(wtex);

    filestring += 'vt 0 0\n';
    /*
    filestring += 'vt 1 0\n';
    filestring += 'vt 1 1\n';
    filestring += 'vt 0 1\n';
    */
    for (let i = 0; i < wtex.length; i++) {
      filestring += 'vt ' + Math.max(Math.round(wtex[i][0]/3), 1) + ' 0\n';
      filestring += 'vt ' + Math.max(Math.round(wtex[i][0]/3), 1) + ' ' + Math.max(Math.round(wtex[i][1]/3), 1) + '\n';
      filestring += 'vt 0 ' + Math.max(Math.round(wtex[i][1]/3), 1) + '\n';
    }

    for (let i = 0; i < bindices.length; i += 3) {

      bindices[i] += 1;
      bindices[i+1] += 1;
      bindices[i+2] += 1;

      filestring += 'f ' + bindices[i] + '/1/1' + ' ' +
                          bindices[i+1] + '/1/1' + ' ' +
                          bindices[i+2] + '/1/1' + '\n';

    }

    for (let i = 0; i < windices.length; i += 6) {

      for (let j = i; j < i + 6; j++) {
        windices[j] += 1;
      }

      let nindex = (i/6)*3 + 1 + bnormals.length;
      let windex = i/6 + 1;
      let cw = wtex[i/6][2];

      if (!cw) {

        filestring += 'f ' + windices[i] + '/' + (1) + '/' + nindex + ' ' +
                            windices[i+2] + '/' + (windex+2) + '/' + nindex + ' ' +
                            windices[i+1] + '/' + (windex+1) + '/' + nindex + '\n';

        filestring += 'f ' + windices[i+3] + '/' + (windex+3) + '/' + nindex + ' ' +
                            windices[i+5] + '/' + (windex+2) + '/' + nindex + ' ' +
                            windices[i+4] + '/' + (1) + '/' + nindex + '\n';

      } else {

        filestring += 'f ' + windices[i] + '/' + (windex+3) + '/' + nindex + ' ' +
                            windices[i+2] + '/' + (windex+1) + '/' + nindex + ' ' +
                            windices[i+1] + '/' + (windex+2) + '/' + nindex + '\n';

        filestring += 'f ' + windices[i+3] + '/' + (windex+3) + '/' + nindex + ' ' +
                            windices[i+5] + '/' + (1) + '/' + nindex + ' ' +
                            windices[i+4] + '/' + (windex+1) + '/' + nindex + '\n';

      }

    }

    fs.writeFile('venice.obj', filestring, (err) => {
        if (err) return console.log(err);
        console.log('OBJ generated.');
    });

  });

});
