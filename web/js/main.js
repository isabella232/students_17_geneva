BigInteger = jsbn.BigInteger;
Random = jsbn.SecureRandom;


$(function() {
    var modExp = new ModExp("base","exp","Modulus");
    // console.log(modExp.getInfo());
    setDefaultValues();
    linkage();
    $("#btn-calculate").click();
});

// demoBenchmark runs the given demo in a benchmark suite from benchmark.js
function demoBenchmark(demo) {
    log("Benchmark requested for demo ",demo.name());
    var suite = new Benchmark.Suite;
    suite.add(demo.name(), {
        defer: true,
        fn(deferred) {
            demo.run(deferred);
        },
    })
    .on("cycle", function(event) {
        log("benchmark for " + String(event.target.name) + " finished !")
        showResults(event.target);
    })
    .on("complete",function() {
        log("Benchmark complete! ");
    }).run({"async":true});
}

// getDemo simply reads the parameters and instantiate the correct demo
function getDemo() {
    var method = $("#select-method").find(":selected").val();
    log("A new demo has been requested => " + method);
    modexp = newModExp(method);
    var i = getIntegers();
    return new modexp(i);
}

// showResults takes a Benchmark object (from the event given in cycle).
// + writes the name of the benchmark
// + writes general statistics about the benchmark
// + write the whole list of individual time measurements in the text area
function showResults(results) {
    $("#result-title").text("Results for benchmark: " + results.name);
    // write general stats
    let html = "";
    html += "<p> <bold> Samples: </bold> " + results.stats.sample.length + " times </p>";
    html += "<p> <bold> Average: </bold> " + results.stats.mean + " s </p>";
    html += "<p> <bold> Deviation: </bold> " + results.stats.deviation + " s </p>";
    html += "<p> <bold> Relative margin of error: </bold> " + results.stats.rme + " % </p>";
    $("#results-stats").html(html);
    // write all individual measurements
    $("#results-all").text(results.stats.sample.join(" ")); 
    $("#div-no-results").hide();
    $("#div-results").show();
}

// linkage links the UI HTML elements with their respective functions
// For the moment, it simply activates the "Calculate" button to start the demo.
function linkage() {
    $("#btn-calculate").click(function() {
        var demo = getDemo();
        demoBenchmark(demo);
        /*log("Running demo " + demo.name() + " ONCE");*/
        //var def = new $.Deferred();
        //demo.run(def);
        //def.promise().done(function() {
            //log("DEMO FINISHED");
        /*});*/
    });
}

// getIntegers returns the base, exponent and modulo from the HTML fields as
// BigInteger.
function getIntegers() {
    var base = new BigInteger($("#input-base").val(),16);
    var exp = new BigInteger($("#input-exponent").val(),16);
    var modulo = new BigInteger($("#input-modulo").val(),16);
    var copies = parseInt($("#input-copies").val());
    return {base: base, exp: exp,modulo: modulo,copies: copies}
}

// defaultValues does the following:
// + set the default algorithm
// + generates a random exponent of 2048 bits
// + sets the strings values of the base, exponent and modulo to their
// respective fields
// + hides the result part of the html
function setDefaultValues() {
    // select default algorithm
    $('#select-method option[value="split"]').attr("selected",true);
    // val because input elements
    $("#input-servers").val(default_servers);

    // random exponent
    var arr = new Array(2048/8);
    // XXX to be avoided if possible since it seems it uses seed = time ...
    var exponent = randomInteger();

    // set default values
    $("#input-copies").val(default_copies);
    $("#input-base").val(default_base);
    $("#input-exponent").val(exponent.toString(16));
    $("#input-modulo").val(default_q);

    // hide results
    $("#div-results").hide();
}

function log(txt) {
    console.log(txt);
}

const default_servers = "127.0.0.1:8000 127.0.0.1:8001 127.0.0.1:8002";
//const default_servers = "127.0.0.1:8000 127.0.0.1:8001";
// section 8.2.3 of the geneva specs, in base 16
const default_copies = 3;
const default_base = "2"; 
const default_q = "800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000AD3AF";
