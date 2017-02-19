var osmtogeojson = require("../");
var exec = require('child_process').exec;

var test = require('tape');

function testCLI(test, command, cb) {
  exec(command, function(error, stdout, stderr) {
    var geojson;

    if (error) {
      test.fail("unable to execute test");
      console.error(error, stderr.toString());
      return;
    }
    try {
      geojson = JSON.parse(stdout.toString());
    } catch(e) {
      test.fail("result is not GeoJSON");
      console.error(stdout.toString());
      return;
    }

    cb(geojson);
  });
}

// ==== piped data ==== //

test('empty piped osm', function (t) {

  testCLI(t,
    'echo "<osm/>" | ./osmtogeojson',
    function (geojson) {
      t.equal(geojson.features.length, 0);
      t.end();
  });

});

test('empty piped json', function (t) {

  testCLI(t,
    'echo "{\\"elements\\":[]}" | ./osmtogeojson',
    function (geojson) {
      t.equal(geojson.features.length, 0);
      t.end();
  });

});

test('piped osm', function (t) {

  var node = "<osm><node id='1' lat='1.234' lon='4.321' /></osm>";
  var way = "<osm><way id='1'><nd ref='2' /><nd ref='3' /><nd ref='4' /></way><node id='2' lat='0.0' lon='1.0' /><node id='3' lat='0.0' lon='1.1' /><node id='4' lat='0.1' lon='1.2' /></osm>";
  var relation = "<osm><relation id='1'><tag k='type' v='multipolygon' /><member type='way' ref='2' role='outer' /><member type='way' ref='3' role='inner' /></relation><way id='2'><tag k='area' v='yes' /><nd ref='4' /><nd ref='5' /><nd ref='6' /><nd ref='7' /><nd ref='4' /></way><way id='3'><nd ref='8' /><nd ref='9' /><nd ref='10' /><nd ref='8' /></way><node id='4' lat='-1.0' lon='-1.0' /><node id='5' lat='-1.0' lon='1.0' /><node id='6' lat='1.0' lon='1.0' /><node id='7' lat='1.0' lon='-1.0' /><node id='8' lat='-0.5' lon='0.0' /><node id='9' lat='0.5' lon='0.0' /><node id='10' lat='0.0' lon='0.5' /></osm>";

  t.plan(6);
  testCLI(t,
    'echo "'+node+'" | ./osmtogeojson',
    function (geojson) {
      t.equal(geojson.features.length, 1);
      t.equal(geojson.features[0].geometry.type, 'Point');
  });
  testCLI(t,
    'echo "'+way+'" | ./osmtogeojson',
    function (geojson) {
      t.equal(geojson.features.length, 1);
      t.equal(geojson.features[0].geometry.type, 'LineString');
  });
  testCLI(t,
    'echo "'+relation+'" | ./osmtogeojson',
    function (geojson) {
      t.equal(geojson.features.length, 1);
      t.equal(geojson.features[0].geometry.type, 'Polygon');
  });

});

test('piped json', function (t) {

  var node = '{"elements":[{"type":"node","id":1,"lat":1.234,"lon":4.321}]}';
  var way = '{"elements":[{"type":"way","id":1,"nodes":[2,3,4]},{"type":"node","id":2,"lat":0,"lon":1},{"type":"node","id":3,"lat":0,"lon":1.1},{"type":"node","id":4,"lat":0.1,"lon":1.2}]}';
  var relation = '{"elements":[{"type":"relation","id":1,"tags":{"type":"multipolygon"},"members":[{"type":"way","ref":2,"role":"outer"},{"type":"way","ref":3,"role":"inner"}]},{"type":"way","id":2,"nodes":[4,5,6,7,4],"tags":{"area":"yes"}},{"type":"way","id":3,"nodes":[8,9,10,8]},{"type":"node","id":4,"lat":-1,"lon":-1},{"type":"node","id":5,"lat":-1,"lon":1},{"type":"node","id":6,"lat":1,"lon":1},{"type":"node","id":7,"lat":1,"lon":-1},{"type":"node","id":8,"lat":-0.5,"lon":0},{"type":"node","id":9,"lat":0.5,"lon":0},{"type":"node","id":10,"lat":0,"lon":0.5}]}';

  t.plan(6);
  testCLI(t,
    "echo '"+node+"' | ./osmtogeojson",
    function (geojson) {
      t.equal(geojson.features.length, 1);
      t.equal(geojson.features[0].geometry.type, 'Point');
  });
  testCLI(t,
    "echo '"+way+"' | ./osmtogeojson",
    function (geojson) {
      t.equal(geojson.features.length, 1);
      t.equal(geojson.features[0].geometry.type, 'LineString');
  });
  testCLI(t,
    "echo '"+relation+"' | ./osmtogeojson",
    function (geojson) {
      t.equal(geojson.features.length, 1);
      t.equal(geojson.features[0].geometry.type, 'Polygon');
  });

});

test('piped osm (subformats)', function (t) {

  var xml = '<osm version="0.6" generator="OpenStreetMap server" copyright="OpenStreetMap and contributors" attribution="http://www.openstreetmap.org/copyright" license="http://opendatacommons.org/licenses/odbl/1-0/">'+
    '<relation id="4294968148" visible="true" timestamp="2013-05-14T10:33:05Z" version="1" changeset="23123" user="tyrTester06" uid="1178">'+
      '<member type="way" ref="4295032195" role="line"/>'+
      '<member type="node" ref="4295668179" role="point"/>'+
      '<member type="node" ref="4295668178" role=""/>'+
      '<member type="way" ref="4295032194" role=""/>'+
      '<member type="way" ref="4295032193" role=""/>'+
      '<member type="node" ref="4295668174" role="foo"/>'+
      '<member type="node" ref="4295668175" role="bar"/>'+
      '<tag k="type" v="fancy"/>'+
    '</relation>'+
    '<way id="4295032195" visible="true" timestamp="2013-05-14T10:33:05Z" version="1" changeset="23123" user="tyrTester06" uid="1178">'+
      '<nd ref="4295668174"/>'+
      '<nd ref="4295668172"/>'+
      '<nd ref="4295668171"/>'+
      '<nd ref="4295668170"/>'+
      '<nd ref="4295668173"/>'+
      '<nd ref="4295668175"/>'+
      '<tag k="highway" v="residential"/>'+
    '</way>'+
    '<way id="4295032194" visible="true" timestamp="2013-05-14T10:33:05Z" version="1" changeset="23123" user="tyrTester06" uid="1178">'+
      '<nd ref="4295668177"/>'+
      '<nd ref="4295668178"/>'+
      '<nd ref="4295668180"/>'+
      '<tag k="highway" v="service"/>'+
    '</way>'+
    '<way id="4295032193" visible="true" timestamp="2013-05-14T10:33:04Z" version="1" changeset="23123" user="tyrTester06" uid="1178">'+
      '<nd ref="4295668181"/>'+
      '<nd ref="4295668178"/>'+
      '<nd ref="4295668176"/>'+
      '<tag k="highway" v="service"/>'+
    '</way>'+
    '<node id="4295668172" version="1" changeset="23123" lat="46.4910906" lon="11.2735763" user="tyrTester06" uid="1178" visible="true" timestamp="2013-05-14T10:33:04Z">'+
      '<tag k="highway" v="crossing"/>'+
    '</node>'+
    '<node id="4295668173" version="1" changeset="23123" lat="46.4911004" lon="11.2759498" user="tyrTester06" uid="1178" visible="true" timestamp="2013-05-14T10:33:04Z">'+
      '<tag k="created_by" v="foo"/>'+
    '</node>'+
    '<node id="4295668170" version="1" changeset="23123" lat="46.4909732" lon="11.2753813" user="tyrTester06" uid="1178" visible="true" timestamp="2013-05-14T10:33:04Z"/>'+
    '<node id="4295668171" version="1" changeset="23123" lat="46.4909781" lon="11.2743295" user="tyrTester06" uid="1178" visible="true" timestamp="2013-05-14T10:33:04Z"/>'+
    '<node id="4295668174" version="1" changeset="23123" lat="46.4914820" lon="11.2731001" user="tyrTester06" uid="1178" visible="true" timestamp="2013-05-14T10:33:04Z"/>'+
    '<node id="4295668175" version="1" changeset="23123" lat="46.4915603" lon="11.2765254" user="tyrTester06" uid="1178" visible="true" timestamp="2013-05-14T10:33:04Z"/>'+
    '<node id="4295668176" version="1" changeset="23123" lat="46.4919468" lon="11.2756726" user="tyrTester06" uid="1178" visible="true" timestamp="2013-05-14T10:33:04Z"/>'+
    '<node id="4295668177" version="1" changeset="23123" lat="46.4919664" lon="11.2753031" user="tyrTester06" uid="1178" visible="true" timestamp="2013-05-14T10:33:04Z"/>'+
    '<node id="4295668178" version="1" changeset="23123" lat="46.4921083" lon="11.2755021" user="tyrTester06" uid="1178" visible="true" timestamp="2013-05-14T10:33:04Z"/>'+
    '<node id="4295668179" version="1" changeset="23123" lat="46.4921327" lon="11.2742229" user="tyrTester06" uid="1178" visible="true" timestamp="2013-05-14T10:33:04Z"/>'+
    '<node id="4295668180" version="1" changeset="23123" lat="46.4922893" lon="11.2757152" user="tyrTester06" uid="1178" visible="true" timestamp="2013-05-14T10:33:04Z"/>'+
    '<node id="4295668181" version="1" changeset="23123" lat="46.4923235" lon="11.2752747" user="tyrTester06" uid="1178" visible="true" timestamp="2013-05-14T10:33:04Z"/>'+
  '</osm>';

  t.plan(5);
  var first_result = undefined;
  function compare_results(geojson) {
    if (first_result === undefined)
      first_result = JSON.stringify(geojson);
    else
      t.equal(JSON.stringify(geojson), first_result);
  }
  testCLI(t, "echo '"+xml+"' | ./osmtogeojson",              compare_results);
  testCLI(t, "echo '"+xml+"' | ./osmtogeojson -f osm",       compare_results);
  testCLI(t, "echo '"+xml+"' | ./osmtogeojson -f xml",       compare_results);
  testCLI(t, "echo '"+xml+"' | ./osmtogeojson -f xmldom",    compare_results);
  testCLI(t, "echo '"+xml+"' | ./osmtogeojson -f fastxml",   compare_results);
  testCLI(t, "echo '"+xml+"' | ./osmtogeojson -f streamxml", compare_results);

});

test('piped json (subformats)', function (t) {

  var json = '{"version": 0.6,"generator": "Overpass API","osm3s": {"timestamp_osm_base": "2014-03-13T11:55:01Z","copyright": "The data included in this document is from www.openstreetmap.org. The data is made available under ODbL."},"elements": [{"type": "node","id": 375952270,"lat": 46.4551482,"lon": 11.2578535,"timestamp": "2011-03-24T11:28:19Z","version": 2,"changeset": 7654992,"user": "tyr_asd","uid": 115612},{"type": "node","id": 386073971,"lat": 46.4549719,"lon": 11.2571261,"timestamp": "2013-01-13T22:56:07Z","version": 5,"changeset": 14642447,"user": "tyr_asd","uid": 115612},{"type": "node","id": 386073973,"lat": 46.4549942,"lon": 11.2574846,"timestamp": "2013-01-13T22:56:07Z","version": 5,"changeset": 14642447,"user": "tyr_asd","uid": 115612},{"type": "node","id": 386073976,"lat": 46.4550395,"lon": 11.2574786,"timestamp": "2013-01-13T22:56:07Z","version": 5,"changeset": 14642447,"user": "tyr_asd","uid": 115612},{"type": "node","id": 386073978,"lat": 46.4550453,"lon": 11.2575715,"timestamp": "2013-01-13T22:56:07Z","version": 5,"changeset": 14642447,"user": "tyr_asd","uid": 115612},{"type": "node","id": 386073980,"lat": 46.4551715,"lon": 11.257641,"timestamp": "2013-01-13T22:56:07Z","version": 5,"changeset": 14642447,"user": "tyr_asd","uid": 115612},{"type": "node","id": 386073982,"lat": 46.4551787,"lon": 11.2577565,"timestamp": "2013-01-13T22:56:07Z","version": 5,"changeset": 14642447,"user": "tyr_asd","uid": 115612},{"type": "node","id": 386073990,"lat": 46.4551937,"lon": 11.2572168,"timestamp": "2013-01-13T22:56:07Z","version": 4,"changeset": 14642447,"user": "tyr_asd","uid": 115612},{"type": "node","id": 386073991,"lat": 46.4550776,"lon": 11.2572332,"timestamp": "2013-01-13T22:56:07Z","version": 4,"changeset": 14642447,"user": "tyr_asd","uid": 115612},{"type": "node","id": 386073992,"lat": 46.4550871,"lon": 11.2573757,"timestamp": "2013-01-13T22:56:07Z","version": 4,"changeset": 14642447,"user": "tyr_asd","uid": 115612},{"type": "node","id": 386073998,"lat": 46.4552032,"lon": 11.2573593,"timestamp": "2013-01-13T22:56:07Z","version": 4,"changeset": 14642447,"user": "tyr_asd","uid": 115612},{"type": "node","id": 386074028,"lat": 46.4551564,"lon": 11.2578379,"timestamp": "2009-04-27T17:28:44Z","version": 1,"changeset": 993143,"user": "tyr_asd","uid": 115612},{"type": "node","id": 1215837458,"lat": 46.4550251,"lon": 11.2580442,"timestamp": "2013-01-13T22:55:50Z","version": 2,"changeset": 14642447,"user": "tyr_asd","uid": 115612},{"type": "node","id": 1215837587,"lat": 46.4549282,"lon": 11.2579603,"timestamp": "2013-01-13T22:55:50Z","version": 2,"changeset": 14642447,"user": "tyr_asd","uid": 115612},{"type": "node","id": 1215837728,"lat": 46.4551715,"lon": 11.2579094,"timestamp": "2013-01-13T22:55:50Z","version": 2,"changeset": 14642447,"user": "tyr_asd","uid": 115612},{"type": "node","id": 1215838041,"lat": 46.4550159,"lon": 11.2579365,"timestamp": "2013-01-13T22:55:51Z","version": 2,"changeset": 14642447,"user": "tyr_asd","uid": 115612},{"type": "node","id": 1215838214,"lat": 46.4548633,"lon": 11.2580035,"timestamp": "2013-01-13T22:55:51Z","version": 2,"changeset": 14642447,"user": "tyr_asd","uid": 115612},{"type": "node","id": 1215838405,"lat": 46.4551816,"lon": 11.2580235,"timestamp": "2013-01-13T22:55:52Z","version": 2,"changeset": 14642447,"user": "tyr_asd","uid": 115612},{"type": "node","id": 1215838572,"lat": 46.454835,"lon": 11.2579312,"timestamp": "2011-03-24T11:27:39Z","version": 1,"changeset": 7654992,"user": "tyr_asd","uid": 115612},{"type": "node","id": 1215838582,"lat": 46.455107,"lon": 11.2580498,"timestamp": "2013-01-13T22:55:52Z","version": 2,"changeset": 14642447,"user": "tyr_asd","uid": 115612},{"type": "node","id": 2109846233,"lat": 46.4550506,"lon": 11.2576569,"timestamp": "2013-01-13T22:55:28Z","version": 1,"changeset": 14642447,"user": "tyr_asd","uid": 115612},{"type": "node","id": 2109846237,"lat": 46.4551126,"lon": 11.2580278,"timestamp": "2013-01-13T22:55:28Z","version": 1,"changeset": 14642447,"user": "tyr_asd","uid": 115612},{"type": "node","id": 2109846238,"lat": 46.4551161,"lon": 11.2580373,"timestamp": "2013-01-13T22:55:28Z","version": 1,"changeset": 14642447,"user": "tyr_asd","uid": 115612},{"type": "node","id": 2517666750,"lat": 46.4549454,"lon": 11.2577552,"timestamp": "2013-11-02T18:28:20Z","version": 1,"changeset": 18679226,"user": "Skombi","uid": 1380953},{"type": "node","id": 2517666751,"lat": 46.4548927,"lon": 11.2569027,"timestamp": "2013-11-02T18:28:20Z","version": 1,"changeset": 18679226,"user": "Skombi","uid": 1380953},{"type": "node","id": 372777376,"lat": 46.4555026,"lon": 11.2574519,"timestamp": "2013-04-26T07:39:34Z","version": 4,"changeset": 15868943,"user": "tyr_asd","uid": 115612},{"type": "node","id": 372777383,"lat": 46.4555129,"lon": 11.2576358,"timestamp": "2013-01-13T22:56:04Z","version": 3,"changeset": 14642447,"user": "tyr_asd","uid": 115612},{"type": "node","id": 372777415,"lat": 46.4556058,"lon": 11.2576677,"timestamp": "2009-04-11T18:43:37Z","version": 1,"changeset": 409620,"user": "tyr_asd","uid": 115612},{"type": "node","id": 375952276,"lat": 46.4554286,"lon": 11.2578714,"timestamp": "2011-03-24T11:28:17Z","version": 2,"changeset": 7654992,"user": "tyr_asd","uid": 115612},{"type": "node","id": 386073958,"lat": 46.4553814,"lon": 11.2573601,"timestamp": "2013-01-13T22:56:07Z","version": 5,"changeset": 14642447,"user": "tyr_asd","uid": 115612},{"type": "node","id": 386073961,"lat": 46.4553036,"lon": 11.2573703,"timestamp": "2013-01-13T22:56:07Z","version": 5,"changeset": 14642447,"user": "tyr_asd","uid": 115612},{"type": "node","id": 386073962,"lat": 46.4552827,"lon": 11.2570345,"timestamp": "2013-01-13T22:56:07Z","version": 5,"changeset": 14642447,"user": "tyr_asd","uid": 115612},{"type": "node","id": 386073964,"lat": 46.4552155,"lon": 11.2570433,"timestamp": "2013-01-13T22:56:07Z","version": 5,"changeset": 14642447,"user": "tyr_asd","uid": 115612},{"type": "node","id": 386073969,"lat": 46.4552187,"lon": 11.2570937,"timestamp": "2013-01-13T22:56:07Z","version": 5,"changeset": 14642447,"user": "tyr_asd","uid": 115612},{"type": "node","id": 386073984,"lat": 46.4553249,"lon": 11.2577374,"timestamp": "2013-01-13T22:56:07Z","version": 5,"changeset": 14642447,"user": "tyr_asd","uid": 115612},{"type": "node","id": 386073986,"lat": 46.4553143,"lon": 11.257567,"timestamp": "2013-01-13T22:56:07Z","version": 5,"changeset": 14642447,"user": "tyr_asd","uid": 115612},{"type": "node","id": 386073988,"lat": 46.4553937,"lon": 11.2575566,"timestamp": "2013-01-13T22:56:07Z","version": 5,"changeset": 14642447,"user": "tyr_asd","uid": 115612},{"type": "node","id": 386074000,"lat": 46.4554875,"lon": 11.2572652,"timestamp": "2013-01-13T22:56:07Z","version": 2,"changeset": 14642447,"user": "tyr_asd","uid": 115612},{"type": "node","id": 386074004,"lat": 46.455501,"lon": 11.2568351,"timestamp": "2013-01-13T22:56:07Z","version": 2,"changeset": 14642447,"user": "tyr_asd","uid": 115612},{"type": "node","id": 386074030,"lat": 46.4553983,"lon": 11.257834,"timestamp": "2013-01-13T22:56:07Z","version": 3,"changeset": 14642447,"user": "tyr_asd","uid": 115612},{"type": "node","id": 386074045,"lat": 46.4555897,"lon": 11.2571616,"timestamp": "2013-01-13T22:56:07Z","version": 4,"changeset": 14642447,"user": "tyr_asd","uid": 115612},{"type": "node","id": 386074059,"lat": 46.4555443,"lon": 11.2574237,"timestamp": "2013-01-13T22:56:08Z","version": 3,"changeset": 14642447,"user": "tyr_asd","uid": 115612},{"type": "node","id": 1215838118,"lat": 46.4552576,"lon": 11.2579036,"timestamp": "2013-01-13T22:55:51Z","version": 2,"changeset": 14642447,"user": "tyr_asd","uid": 115612},{"type": "node","id": 1222907472,"lat": 46.4554532,"lon": 11.256879,"timestamp": "2013-01-13T22:55:53Z","version": 2,"changeset": 14642447,"user": "tyr_asd","uid": 115612},{"type": "node","id": 1222907542,"lat": 46.4553667,"lon": 11.2572186,"timestamp": "2013-01-13T22:55:53Z","version": 2,"changeset": 14642447,"user": "tyr_asd","uid": 115612},{"type": "node","id": 1222907573,"lat": 46.4553232,"lon": 11.2569928,"timestamp": "2013-01-13T22:55:53Z","version": 2,"changeset": 14642447,"user": "tyr_asd","uid": 115612},{"type": "node","id": 1222907621,"lat": 46.4553349,"lon": 11.2572833,"timestamp": "2013-01-13T22:55:54Z","version": 2,"changeset": 14642447,"user": "tyr_asd","uid": 115612},{"type": "node","id": 1222907836,"lat": 46.4554554,"lon": 11.2570586,"timestamp": "2013-01-13T22:55:55Z","version": 2,"changeset": 14642447,"user": "tyr_asd","uid": 115612},{"type": "node","id": 1222908013,"lat": 46.4554415,"lon": 11.2573066,"timestamp": "2013-01-13T22:55:55Z","version": 2,"changeset": 14642447,"user": "tyr_asd","uid": 115612},{"type": "node","id": 1222908102,"lat": 46.4554992,"lon": 11.2568826,"timestamp": "2013-01-13T22:55:56Z","version": 2,"changeset": 14642447,"user": "tyr_asd","uid": 115612},{"type": "node","id": 1222908185,"lat": 46.4553857,"lon": 11.2570496,"timestamp": "2013-01-13T22:55:56Z","version": 2,"changeset": 14642447,"user": "tyr_asd","uid": 115612},{"type": "node","id": 1222908278,"lat": 46.4555039,"lon": 11.2570676,"timestamp": "2013-01-13T22:55:56Z","version": 2,"changeset": 14642447,"user": "tyr_asd","uid": 115612},{"type": "node","id": 1222908564,"lat": 46.4555155,"lon": 11.2573247,"timestamp": "2013-01-13T22:55:58Z","version": 2,"changeset": 14642447,"user": "tyr_asd","uid": 115612},{"type": "node","id": 2109846268,"lat": 46.4553699,"lon": 11.2578919,"timestamp": "2013-01-13T22:55:29Z","version": 1,"changeset": 14642447,"user": "tyr_asd","uid": 115612},{"type": "node","id": 2109846277,"lat": 46.4554036,"lon": 11.2579014,"timestamp": "2013-01-13T22:55:29Z","version": 1,"changeset": 14642447,"user": "tyr_asd","uid": 115612},{"type": "node","id": 2109846278,"lat": 46.455408,"lon": 11.2578309,"timestamp": "2013-01-13T22:55:29Z","version": 1,"changeset": 14642447,"user": "tyr_asd","uid": 115612},{"type": "node","id": 2109846280,"lat": 46.4554127,"lon": 11.2578065,"timestamp": "2013-01-13T22:55:29Z","version": 1,"changeset": 14642447,"user": "tyr_asd","uid": 115612},{"type": "node","id": 2109846281,"lat": 46.4554127,"lon": 11.2578166,"timestamp": "2013-01-13T22:55:29Z","version": 1,"changeset": 14642447,"user": "tyr_asd","uid": 115612},{"type": "node","id": 2109846289,"lat": 46.4554651,"lon": 11.2580121,"timestamp": "2013-01-13T22:55:29Z","version": 1,"changeset": 14642447,"user": "tyr_asd","uid": 115612},{"type": "node","id": 2109846312,"lat": 46.4555072,"lon": 11.2580266,"timestamp": "2013-01-13T22:55:29Z","version": 1,"changeset": 14642447,"user": "tyr_asd","uid": 115612},{"type": "node","id": 2109846319,"lat": 46.4555492,"lon": 11.2576431,"timestamp": "2013-01-13T22:55:29Z","version": 1,"changeset": 14642447,"user": "tyr_asd","uid": 115612},{"type": "node","id": 2109846323,"lat": 46.4555607,"lon": 11.2571676,"timestamp": "2013-01-13T22:55:30Z","version": 1,"changeset": 14642447,"user": "tyr_asd","uid": 115612},{"type": "node","id": 2109846326,"lat": 46.4555719,"lon": 11.2577161,"timestamp": "2013-01-13T22:55:30Z","version": 1,"changeset": 14642447,"user": "tyr_asd","uid": 115612},{"type": "node","id": 2281802885,"lat": 46.45542,"lon": 11.2579495,"timestamp": "2013-04-26T07:39:31Z","version": 1,"changeset": 15868943,"user": "tyr_asd","uid": 115612},{"type": "node","id": 2281802888,"lat": 46.4554764,"lon": 11.2576008,"timestamp": "2013-04-26T07:39:31Z","version": 1,"changeset": 15868943,"user": "tyr_asd","uid": 115612},{"type": "node","id": 2281802890,"lat": 46.4555422,"lon": 11.2579605,"timestamp": "2013-04-26T07:39:31Z","version": 1,"changeset": 15868943,"user": "tyr_asd","uid": 115612,"tags": {"crossing": "uncontrolled","highway": "crossing"}},{"type": "node","id": 2281802893,"lat": 46.4555554,"lon": 11.2575984,"timestamp": "2013-04-26T07:39:31Z","version": 1,"changeset": 15868943,"user": "tyr_asd","uid": 115612},{"type": "node","id": 2281802895,"lat": 46.4555623,"lon": 11.2579618,"timestamp": "2013-04-26T07:39:31Z","version": 1,"changeset": 15868943,"user": "tyr_asd","uid": 115612},{"type": "node","id": 2281802897,"lat": 46.4555668,"lon": 11.257524,"timestamp": "2013-04-26T07:39:31Z","version": 1,"changeset": 15868943,"user": "tyr_asd","uid": 115612,"tags": {"amenity": "fountain"}},{"type": "node","id": 2281802899,"lat": 46.4555997,"lon": 11.2574683,"timestamp": "2013-04-26T07:39:31Z","version": 1,"changeset": 15868943,"user": "tyr_asd","uid": 115612},{"type": "node","id": 2281802901,"lat": 46.4556258,"lon": 11.2575528,"timestamp": "2013-04-26T07:39:32Z","version": 1,"changeset": 15868943,"user": "tyr_asd","uid": 115612},{"type": "way","id": 33200366,"timestamp": "2011-03-24T11:28:17Z","version": 2,"changeset": 7654992,"user": "tyr_asd","uid": 115612,"nodes": [375952252,376426609,375952259,1215838572,375952270,375952276],"tags": {"bicycle": "no","highway": "pedestrian"}},{"type": "way","id": 33748706,"timestamp": "2013-03-27T21:58:57Z","version": 3,"changeset": 15520809,"user": "tyr_asd","uid": 115612,"nodes": [386073969,386073971,386073973,386073976,386073978,2109846233,386073980,386073982,386073984,386073986,386073988,386073958,386073961,386073962,386073964,386073969],"tags": {"amenity": "place_of_worship","building": "yes","denomination": "catholic","name": "Pfarrkirche Sankt Michael","old_name": "Kapuzinerkirche zur Heimsuchung Mariens","religion": "christian","wheelchair": "yes"}},{"type": "way","id": 33748708,"timestamp": "2013-11-02T18:28:24Z","version": 3,"changeset": 18679226,"user": "Skombi","uid": 1380953,"nodes": [1222908102,386074004,386074006,386074008,386074010,386074012,2517666751,2109846195,386074014,386074016,386074018,386074020,386074025,386074028,386074030,2109846278,2109846281,2109846280],"tags": {"barrier": "wall"}},{"type": "way","id": 105582287,"timestamp": "2013-01-13T22:55:42Z","version": 2,"changeset": 14642447,"user": "tyr_asd","uid": 115612,"nodes": [1215837934,1215838582,2109846236,1215837668,1215837761,2109846241,2109846242,1215838036,1215837934],"tags": {"building": "yes"}},{"type": "way","id": 33748707,"timestamp": "2013-01-13T22:55:49Z","version": 3,"changeset": 14642447,"user": "tyr_asd","uid": 115612,"nodes": [386073990,386073998,386073992,386073991,386073990]},{"type": "way","id": 105582211,"timestamp": "2013-01-13T22:55:41Z","version": 2,"changeset": 14642447,"user": "tyr_asd","uid": 115612,"nodes": [1215838041,1215837728,1215838405,2109846238,2109846237,1215837458,1215838041],"tags": {"building": "yes"}},{"type": "way","id": 105582213,"timestamp": "2011-03-24T11:27:44Z","version": 1,"changeset": 7654992,"user": "tyr_asd","uid": 115612,"nodes": [1215838214,1215837784,1215838448,1215837546,1215838214],"tags": {"building": "yes"}},{"type": "way","id": 201032335,"timestamp": "2013-01-13T22:55:36Z","version": 1,"changeset": 14642447,"user": "tyr_asd","uid": 115612,"nodes": [1215838041,1215837458,1215838546,1215838270,2109846218,1215838496,1215837587,1215838041],"tags": {"building": "yes"}},{"type": "way","id": 244451208,"timestamp": "2013-11-02T18:28:20Z","version": 1,"changeset": 18679226,"user": "Skombi","uid": 1380953,"nodes": [2517666753,1222907767,386073938,386074018,386074016,386074014,2109846195,2517666751,2517666750,2517666757,373239864,373239869,373239873,373239876,2517666753],"tags": {"landuse": "orchard"}},{"type": "way","id": 33052937,"timestamp": "2013-04-26T07:39:33Z","version": 5,"changeset": 15868943,"user": "tyr_asd","uid": 115612,"nodes": [372777380,2109846355,2109846344,2109846319,372777383,2109846289,2109846312,2109846301,372777387,372777390,2109846367,2109846368,2109846370,2109846374,372777380],"tags": {"amenity": "parking","capacity:disabled": "2","fee": "yes","type": "surface"}},{"type": "way","id": 33189032,"timestamp": "2013-09-06T15:43:42Z","version": 8,"changeset": 17705306,"user": "tyr_asd","uid": 115612,"nodes": [383041771,1215838260,1215837519,376426577,2281802885,375952276,2281802888,372777376],"tags": {"bicycle": "yes","highway": "pedestrian","name": "Kapuzinerstraße - via Cappuccini","name:de": "Kapuzinerstraße","name:it": "via Cappuccini"}},{"type": "way","id": 33748709,"timestamp": "2013-11-02T18:28:24Z","version": 5,"changeset": 18679226,"user": "Skombi","uid": 1380953,"nodes": [386074038,386074040,2109846362,2109846361,2109846346,2109846347,386074045,2109846333,386074050,386074052,2109846354,2109846353,386074054,386074055,386074038],"tags": {"building": "school"}},{"type": "way","id": 33748710,"timestamp": "2013-09-20T03:07:49Z","version": 5,"changeset": 17933081,"user": "mcheckimport","uid": 893327,"nodes": [386074046,2109846331,2109846338,2109846343,386074060,2109846369,386074062,2109846371,386074064,386074065,2109846376,386074057,386074066,386074059,2109846323,386074046],"tags": {"amenity": "school","barrier": "wall","name": "Volksschule"}},{"type": "way","id": 105582312,"timestamp": "2013-01-13T22:55:40Z","version": 2,"changeset": 14642447,"user": "tyr_asd","uid": 115612,"nodes": [1215838230,1215837826,1215838118,2109846268,1215838230],"tags": {"building": "yes"}},{"type": "way","id": 106227173,"timestamp": "2013-01-13T22:55:47Z","version": 3,"changeset": 14642447,"user": "tyr_asd","uid": 115612,"nodes": [1222908564,1222908013,1222907621,1222907573],"tags": {"access": "private","highway": "service","service": "driveway"}},{"type": "way","id": 106227181,"timestamp": "2013-01-13T22:55:42Z","version": 2,"changeset": 14642447,"user": "tyr_asd","uid": 115612,"nodes": [1222908278,386074000,1222907542,1222908185,1222907836,1222907472,1222908102,1222908278],"tags": {"building": "yes"}},{"type": "way","id": 201032299,"timestamp": "2013-01-13T22:55:35Z","version": 1,"changeset": 14642447,"user": "tyr_asd","uid": 115612,"nodes": [1215838230,2109846266,2109846277,2109846268,1215838230],"tags": {"building": "terrace"}},{"type": "way","id": 201032366,"timestamp": "2013-04-26T07:39:33Z","version": 2,"changeset": 15868943,"user": "tyr_asd","uid": 115612,"nodes": [372777397,372777401,2281802903,372777405,372777409,2109846313,2281802890,2109846326,372777415,372777401],"tags": {"highway": "service","oneway": "yes","service": "parking_aisle"}},{"type": "way","id": 218973695,"timestamp": "2013-04-26T07:39:32Z","version": 1,"changeset": 15868943,"user": "tyr_asd","uid": 115612,"nodes": [2281802888,2281802893,2281802901,386074069],"tags": {"highway": "pedestrian"}},{"type": "way","id": 218973696,"timestamp": "2013-04-26T07:39:32Z","version": 1,"changeset": 15868943,"user": "tyr_asd","uid": 115612,"nodes": [2281802922,2281802918,2281802915,2281802909,2281802907,2281802903,2281802895,2281802890,2281802885],"tags": {"highway": "footway"}},{"type": "way","id": 236856462,"timestamp": "2013-09-06T15:43:42Z","version": 2,"changeset": 17705306,"user": "tyr_asd","uid": 115612,"nodes": [2448201583,386074069,2281802899,372777376],"tags": {"bicycle": "yes","highway": "pedestrian","name": "Hans Weber Tyrol Platz - piazza Hans Weber Tyrol","name:de": "Hans Weber Tyrol Platz","name:it": "piazza Hans Weber Tyrol"}},{"type": "way","id": 236856817,"timestamp": "2013-09-06T15:43:40Z","version": 1,"changeset": 17705306,"user": "tyr_asd","uid": 115612,"nodes": [372777376,1222908564,376051225,376051237],"tags": {"bicycle": "yes","highway": "pedestrian","name": "Kapuzinerstraße - via Cappuccini","name:de": "Kapuzinerstraße","name:it": "via Cappuccini"}},{"type": "relation","id": 2385566,"timestamp": "2013-09-06T20:38:45Z","version": 6,"changeset": 17709634,"user": "tyr_asd","uid": 115612,"members": [{"type": "way","ref": 236856462,"role": ""},{"type": "way","ref": 236856817,"role": ""},{"type": "way","ref": 236856463,"role": ""},{"type": "way","ref": 236856464,"role": ""},{"type": "way","ref": 105582208,"role": ""},{"type": "way","ref": 236856821,"role": ""},{"type": "way","ref": 33264971,"role": ""},{"type": "way","ref": 50074872,"role": ""},{"type": "way","ref": 236856819,"role": ""},{"type": "way","ref": 50074870,"role": ""},{"type": "way","ref": 48581911,"role": ""},{"type": "way","ref": 35128592,"role": ""},{"type": "way","ref": 35128593,"role": ""},{"type": "way","ref": 50074868,"role": ""},{"type": "way","ref": 35203131,"role": ""},{"type": "way","ref": 35203132,"role": ""},{"type": "way","ref": 51353021,"role": ""},{"type": "way","ref": 35203163,"role": ""},{"type": "way","ref": 178708361,"role": ""},{"type": "way","ref": 49713945,"role": ""},{"type": "way","ref": 49713937,"role": ""},{"type": "way","ref": 49713940,"role": ""},{"type": "way","ref": 48509163,"role": ""},{"type": "way","ref": 50988555,"role": ""},{"type": "way","ref": 125483406,"role": ""},{"type": "way","ref": 217836826,"role": ""}],"tags": {"network": "lwn","ref": "540","route": "hiking","type": "route"}},{"type": "relation","id": 121733,"timestamp": "2009-04-27T17:28:49Z","version": 1,"changeset": 993143,"user": "tyr_asd","uid": 115612,"members": [{"type": "way","ref": 33748707,"role": "inner"},{"type": "way","ref": 33748706,"role": "outer"}],"tags": {"type": "multipolygon"}},{"type": "relation","id": 1165342,"timestamp": "2014-02-01T16:48:10Z","version": 8,"changeset": 20319634,"user": "Skombi","uid": 1380953,"members": [{"type": "way","ref": 244451208,"role": "inner"},{"type": "way","ref": 244451209,"role": "inner"},{"type": "way","ref": 244451210,"role": "inner"},{"type": "way","ref": 259380818,"role": "outer"},{"type": "way","ref": 76179006,"role": "inner"},{"type": "way","ref": 152450182,"role": "inner"},{"type": "way","ref": 76179002,"role": "inner"},{"type": "way","ref": 33200348,"role": "inner"},{"type": "way","ref": 33265457,"role": "inner"},{"type": "way","ref": 152450197,"role": "inner"},{"type": "way","ref": 152450228,"role": "inner"},{"type": "way","ref": 244445045,"role": "inner"},{"type": "way","ref": 201079957,"role": "inner"},{"type": "way","ref": 33748710,"role": "inner"}],"tags": {"description": "St. Michael Eppan: residential area","landuse": "residential","type": "multipolygon"}}]}';

  t.plan(3);
  var first_result = undefined;
  function compare_results(geojson) {
    if (first_result === undefined)
      first_result = JSON.stringify(geojson);
    else
      t.equal(JSON.stringify(geojson), first_result);
  }
  testCLI(t, "echo '"+json+"' | ./osmtogeojson",               compare_results);
  testCLI(t, "echo '"+json+"' | ./osmtogeojson -f json",       compare_results);
  testCLI(t, "echo '"+json+"' | ./osmtogeojson -f nativejson", compare_results);
  testCLI(t, "echo '"+json+"' | ./osmtogeojson -f streamjson", compare_results);

});

// ==== data in files ==== //

test('empty osm file', function (t) {

  testCLI(t,
    './osmtogeojson test-cli/data/empty.osm',
    function (geojson) {
      t.equal(geojson.features.length, 0);
      t.end();
  });

});

test('empty json file', function (t) {

  testCLI(t,
    './osmtogeojson test-cli/data/empty.json',
    function (geojson) {
      t.equal(geojson.features.length, 0);
      t.end();
  });

});

test('osm file', function (t) {

  t.plan(6);
  testCLI(t,
    './osmtogeojson test-cli/data/node.osm',
    function (geojson) {
      t.equal(geojson.features.length, 1);
      t.equal(geojson.features[0].geometry.type, 'Point');
  });
  testCLI(t,
    './osmtogeojson test-cli/data/way.osm',
    function (geojson) {
      t.equal(geojson.features.length, 1);
      t.equal(geojson.features[0].geometry.type, 'LineString');
  });
  testCLI(t,
    './osmtogeojson test-cli/data/relation.osm',
    function (geojson) {
      t.equal(geojson.features.length, 1);
      t.equal(geojson.features[0].geometry.type, 'Polygon');
  });

});

test('json file', function (t) {

  t.plan(6);
  testCLI(t,
    './osmtogeojson test-cli/data/node.json',
    function (geojson) {
      t.equal(geojson.features.length, 1);
      t.equal(geojson.features[0].geometry.type, 'Point');
  });
  testCLI(t,
    './osmtogeojson test-cli/data/way.json',
    function (geojson) {
      t.equal(geojson.features.length, 1);
      t.equal(geojson.features[0].geometry.type, 'LineString');
  });
  testCLI(t,
    './osmtogeojson test-cli/data/relation.json',
    function (geojson) {
      t.equal(geojson.features.length, 1);
      t.equal(geojson.features[0].geometry.type, 'Polygon');
  });

});

test('osm file (subformats)', function (t) {

  t.plan(5);
  var first_result = undefined;
  function compare_results(geojson) {
    if (first_result === undefined)
      first_result = JSON.stringify(geojson);
    else
      t.equal(JSON.stringify(geojson), first_result);
  }
  testCLI(t, "./osmtogeojson ./test-cli/data/map.osm",              compare_results);
  testCLI(t, "./osmtogeojson ./test-cli/data/map.osm -f osm",       compare_results);
  testCLI(t, "./osmtogeojson ./test-cli/data/map.osm -f xml",       compare_results);
  testCLI(t, "./osmtogeojson ./test-cli/data/map.osm -f xmldom",    compare_results);
  testCLI(t, "./osmtogeojson ./test-cli/data/map.osm -f fastxml",   compare_results);
  testCLI(t, "./osmtogeojson ./test-cli/data/map.osm -f streamxml", compare_results);

});

test('json file (subformats)', function (t) {

  t.plan(3);
  var first_result = undefined;
  function compare_results(geojson) {
    if (first_result === undefined)
      first_result = JSON.stringify(geojson);
    else
      t.equal(JSON.stringify(geojson), first_result);
  }
  testCLI(t, "./osmtogeojson ./test-cli/data/map.json",               compare_results);
  testCLI(t, "./osmtogeojson ./test-cli/data/map.json -f json",       compare_results);
  testCLI(t, "./osmtogeojson ./test-cli/data/map.json -f nativejson", compare_results);
  testCLI(t, "./osmtogeojson ./test-cli/data/map.json -f streamjson", compare_results);

});

test('overpass geometry types', function (t) {

  var xml,json;
  t.plan(3*2+3*2+4*2+5*2);

  // center output mode (xml)
  xml =
    '<osm>'+
      '<way id="89227521"><center lat="49.2491429" lon="6.6639613"/></way>'+
      '<relation id="19227521"><center lat="19.2491429" lon="1.6639613"/></relation>'+
    '</osm>';

  testCLI(t,
    'echo \''+xml+'\' | ./osmtogeojson',
    function (geojson) {
      t.equal(geojson.features.length, 2);
      t.equal(geojson.features[0].geometry.type, 'Point');
      t.equal(geojson.features[1].geometry.type, 'Point');
  });
  // center output mode (json)
  json =
    '{ "elements": ['+
      '{"type":"way", "id":"1", "center":{"lat":1.23,"lon":3.21} },'+
      '{"type":"relation", "id":"2", "center":{"lat":5.23,"lon":6.21} }'+
    '] }';

  testCLI(t,
    'echo \''+json+'\' | ./osmtogeojson',
    function (geojson) {
      t.equal(geojson.features.length, 2);
      t.equal(geojson.features[0].geometry.type, 'Point');
      t.equal(geojson.features[1].geometry.type, 'Point');
  });

  // bounds output mode (xml)
  xml =
    '<osm>'+
      '<way id="89227521"><bounds minlat="49.2490528" minlon="6.6638484" maxlat="49.2492329" maxlon="6.6640742"/></way>'+
      '<relation id="19227521"><bounds minlat="19.2490528" minlon="1.6638484" maxlat="19.2492329" maxlon="1.6640742"/></relation>'+
    '</osm>';

  testCLI(t,
    'echo \''+xml+'\' | ./osmtogeojson',
    function (geojson) {
      t.equal(geojson.features.length, 2);
      t.equal(geojson.features[0].geometry.type, 'Polygon');
      t.equal(geojson.features[1].geometry.type, 'Polygon');
  });
  // bounds output mode (json)
  json =
    '{ "elements": ['+
      '{"type":"way", "id":"1", "bounds":{"minlat":1.23,"minlon":3.21,"maxlat":11.23,"maxlon":13.21} },'+
      '{"type":"relation", "id":"2", "bounds":{"minlat":5.23,"minlon":6.21,"maxlat":15.23,"maxlon":16.21} }'+
    '] }';

  testCLI(t,
    'echo \''+json+'\' | ./osmtogeojson',
    function (geojson) {
      t.equal(geojson.features.length, 2);
      t.equal(geojson.features[0].geometry.type, 'Polygon');
      t.equal(geojson.features[1].geometry.type, 'Polygon');
  });

  // full geometry (xml)
  xml =
    '<osm>' +
      '<way id="89227521"><nd ref="1" lat="0" lon="0" /><nd ref="2" lat="1" lon="1" /><nd ref="3" lat="2" lon="2" /></way>'+
      '<relation id="1"><bounds minlat="0" minlon="0" maxlat="1" maxlon="1"/><member type="way" ref="1" role="outer"><nd lat="0" lon="0" /><nd lat="0" lon="1" /><nd lat="1" lon="1" /><nd lat="1" lon="0" /><nd lat="0" lon="0" /></member><member type="way" ref="2" role="outer"><nd lat="0.1" lon="0.1" /><nd lat="0.1" lon="0.2" /><nd lat="0.2" lon="0.2" /><nd lat="0.1" lon="0.1" /></member><tag k="type" v="boundary" /></relation>'+
    '</osm>';

  testCLI(t,
    'echo "'+xml+'" | ./osmtogeojson',
    function (geojson) {
      t.equal(geojson.features.length, 2);
      t.equal(geojson.features[0].geometry.type, 'MultiPolygon');
      t.equal(geojson.features[1].geometry.type, 'LineString');
      t.equal(geojson.features[1].geometry.coordinates.length, 3);
  });
  // full geometry (json)
  json =
    '{ "elements": ['+
      '{"type":"way", "id":"1", "nodes": [1,2,3], "geometry": [{"lat":0,"lon":0}, {"lat":1,"lon":1}, {"lat":2,"lon":2}] },'+
      '{"type":"relation", "id":"2", "tags": {"type": "multipolygon"}, "members": [{"type": "way", "ref": "3", "role":"outer", "geometry": [{"lat":0,"lon":0},{"lat":0,"lon":1},{"lat":1,"lon":1}] }, {"type": "way", "ref": "4", "role":"outer", "geometry": [{"lat":1,"lon":1},{"lat":0,"lon":0}] } ] }'+
    '] }';
  testCLI(t,
    'echo \''+json+'\' | ./osmtogeojson',
    function (geojson) {
      t.equal(geojson.features.length, 2);
      t.equal(geojson.features[0].geometry.type, 'Polygon');
      t.equal(geojson.features[1].geometry.type, 'LineString');
      t.equal(geojson.features[1].geometry.coordinates.length, 3);
  });

  // full geometry, tainted (xml)
  xml =
    '<osm>' +
      '<way id="89227521"><nd ref="1" lat="0" lon="0" /><nd ref="2" lat="1" lon="1" /><nd /></way>'+
      '<relation id="1"><member type="way" ref="1" role="outer"><nd lat="0" lon="0" /><nd lat="0" lon="1" /><nd lat="1" lon="1" /><nd /><nd lat="0" lon="0" /></member><tag k="type" v="multipolygon" /></relation>'+
      '<relation id="2"><member type="way" ref="1" role="outer"><nd lat="0" lon="0" /><nd lat="0" lon="1" /><nd lat="1" lon="1" /><nd lat="1" lon="0"/><nd lat="0" lon="0" /></member><member type="way" ref="777" role="inner" /><tag k="type" v="multipolygon" /></relation>'+
      '<relation id="3"><member type="way" ref="1" role="outer"><nd lat="0" lon="0" /><nd lat="0" lon="1" /><nd lat="1" lon="1" /><nd lat="1" lon="0"/><nd lat="0" lon="0" /></member><member type="node" ref="9" role="" /><tag k="type" v="multipolygon" /></relation>'+
    '</osm>';

  testCLI(t,
    'echo "'+xml+'" | ./osmtogeojson -e',
    function (geojson) {
      t.equal(geojson.features.length, 4);
      t.equal(geojson.features[0].properties.tainted, true);
      t.equal(geojson.features[1].properties.tainted, true);
      t.equal(geojson.features[2].properties.tainted, true);
      t.equal(geojson.features[3].properties.tainted, true);
  });
  // full geometry, tainted (json)
  json =
    '{ "elements": ['+
      '{"type":"way", "id":"1", "nodes": [1,2,3], "geometry": [{"lat":0,"lon":0}, {"lat":1,"lon":1}, null] },'+
      '{"type":"relation", "id":"2", "tags": {"type": "multipolygon"}, "members": [{"type": "way", "ref": "3", "role":"outer", "geometry": [{"lat":0,"lon":0},{"lat":0,"lon":1},null,{"lat":1,"lon":0},{"lat":0,"lon":0}] } ] },'+
      '{"type":"relation", "id":"3", "tags": {"type": "multipolygon"}, "members": [{"type": "way", "ref": "3", "role":"outer", "geometry": [{"lat":0,"lon":0},{"lat":0,"lon":1},{"lat":1,"lon":1},{"lat":1,"lon":0},{"lat":0,"lon":0}] }, { "type": "way", "ref": 777, "role": "inner", "geometry": null } ] },'+
      '{"type":"relation", "id":"4", "tags": {"type": "multipolygon"}, "members": [{"type": "way", "ref": "3", "role":"outer", "geometry": [{"lat":0,"lon":0},{"lat":0,"lon":1},{"lat":1,"lon":1},{"lat":1,"lon":0},{"lat":0,"lon":0}] }, { "type": "node", "ref": 9, "role": "" } ] }'+
    '] }';
  testCLI(t,
    'echo \''+json+'\' | ./osmtogeojson -e',
    function (geojson) {
      t.equal(geojson.features.length, 4);
      t.equal(geojson.features[0].properties.tainted, true);
      t.equal(geojson.features[1].properties.tainted, true);
      t.equal(geojson.features[2].properties.tainted, true);
      t.equal(geojson.features[3].properties.tainted, true);
  });
});

test('parameters: -n', function (t) {

  var xml = "<osm><node id='1' lat='1.234' lon='4.321'><tag k='num' v='2' /></node></osm>";

  t.plan(2);
  testCLI(t,
    'echo "'+xml+'" | ./osmtogeojson',
    function (geojson) {
      t.equal(geojson.features[0].properties.num, '2');
  });
  testCLI(t,
    'echo "'+xml+'" | ./osmtogeojson -n',
    function (geojson) {
      t.equal(geojson.features[0].properties.num, 2);
  });

});

test('parameters: -e', function (t) {

  var xml = "<osm><node id='1' version='2' lat='1.234' lon='4.321'><tag k='k' v='v' /></node></osm>";

  t.plan(6);
  testCLI(t,
    'echo "'+xml+'" | ./osmtogeojson',
    function (geojson) {
      t.equal(geojson.features[0].properties.k, 'v');
      t.equal(geojson.features[0].properties.version, '2');
  });
  testCLI(t,
    'echo "'+xml+'" | ./osmtogeojson -e',
    function (geojson) {
      t.equal(geojson.features[0].properties.tags.k, 'v');
      t.equal(geojson.features[0].properties.meta.version, '2');
  });
  testCLI(t,
    'echo "'+xml+'" | ./osmtogeojson -en',
    function (geojson) {
      t.equal(geojson.features[0].properties.tags.k, 'v');
      t.equal(geojson.features[0].properties.meta.version, 2);
  });

});

test('parameters: -m', function (t) {

  var xml = "<osm><node id='1' version='2' lat='1.234' lon='4.321'><tag k='k' v='v' /></node></osm>";

  function testCLI_raw(test, command, cb) {
    exec(command, function(error, stdout, stderr) {
      if (error) {
        test.fail("unable to execute test");
        console.error(error, stderr.toString());
        return;
      }
      cb(stdout.toString());
    });
  }

  t.plan(2);
  testCLI_raw(t,
    'echo "'+xml+'" | ./osmtogeojson',
    function (text) {
      t.equal(text.match(/\n/g).length, 21);
  });
  testCLI_raw(t,
    'echo "'+xml+'" | ./osmtogeojson -m',
    function (text) {
      t.equal(text.match(/\n/g), null);
  });

});

test('parameters: --ndjson', function (t) {

  var xml = "<osm><node id='1' version='1' lat='0' lon='0'></node><node id='2' version='1' lat='1' lon='1'></node></osm>";

  function testCLI_raw(test, command, cb) {
    exec(command, function(error, stdout, stderr) {
      if (error) {
        test.fail("unable to execute test");
        console.error(error, stderr.toString());
        return;
      }
      cb(stdout.toString());
    });
  }

  t.plan(1);
  testCLI_raw(t,
    'echo "'+xml+'" | ./osmtogeojson --ndjson',
    function (text) {
      t.equal(text.match(/\n/g).length, 2);
  });

});
