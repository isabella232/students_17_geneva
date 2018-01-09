BigInteger = jsbn.BigInteger;
Random = jsbn.SecureRandom;


$(function() {
    var modExp = new ModExp("base","exp","Modulus");
    // console.log(modExp.getInfo());
    setDefaultValues();
    linkage();
    //$("#btn-calculate").click();
});

// runAllBenchmarks instantiate every demos from the config (one for each "copies"
// number) and run a benchmark for each of them.
function runAllBenchmarks() {
    var method = $("#select-method").find(":selected").val();
    log("A new demo has been requested => " + method);
    $("#result-title").text("Results for benchmark: " + method);
    var modexp = newModExp(method);
    var conf = getConfig();
    var globalPromise = new Promise((res,rej) => { res() });
   
    // set the header line of the csv
    $("#div-no-results").hide();
    $("#div-results").show();
    $("#results-all").text("number of copies, samples, average, deviation, rme (%)\n");
    var nbRows = conf.copies.length + 2;
    $("#results-all").attr("rows",nbRows.toString());
    // helper functions binding the demo & config of the current iteration
    var demoBenchmarkPromiseFn = function(config,demo) {
        return function() { 
            log("Demo " + method +": benchmark for " + 
                config.copies  + " exponentiations STARTING");
            return demoBenchmarkPromise(demo);
        }
    }
    var showResultFn = function(config) {
        return function(results) {
            log("Demo " + method +": benchmark for " + config.copies  + " exponentiations FINISHED");
             appendDemoResult(config,results);
        }
     }
    for(var i = 0; i < conf.copies.length; i++) {
        var demoConfig = {  
                        base: conf.base, 
                        exp: conf.exp, 
                        modulo: conf.modulo, 
                        copies: conf.copies[i],
                     };
        var demo = new modexp(demoConfig);
        globalPromise = globalPromise.then(demoBenchmarkPromiseFn(demoConfig,demo))
        .then(showResultFn(demoConfig));
    }
    log("Out of the loop!");
    globalPromise.then(function() {
        log("Simulation DONE");
    });
}


function demoBenchmarkPromise(demo) {
    return new Promise((resolve,reject) => {
        demoBenchmark(demo,resolve);
    });
}

// demoBenchmark runs the given demo in a benchmark suite from benchmark.js
// Once finished, it calls deferCb.resolve(results)
function demoBenchmark(demo,cb) {
        var suite = new Benchmark.Suite;
        suite.add(demo.name(), {
            defer: true,
            fn(deferred) {
                demo.run(deferred);
            },
        })
        .on("cycle", function(event) {
            //log("benchmark for " + String(event.target.name) + " finished !")
            cb(event.target);
        })
        .on("complete",function() {
            //log("Benchmark complete! ");
        }).run({"async":true});
}

function appendDemoResult(config, results) {
    var text = $("#results-all").text();
    var newline = [
        config.copies,
        results.stats.sample.length,
        results.stats.mean,
        results.stats.deviation,
        results.stats.rme,
    ].map(e => e.toString()).join(", ");
    $("#results-all").text(text + "\n" + newline);
}

// linkage links the UI HTML elements with their respective functions
// For the moment, it simply activates the "Calculate" button to start the demo.
function linkage() {
    $("#btn-calculate").click(function() {
        runAllBenchmarks();
    });
    $("#btn-onetime").click(function() {
        var method = $("#select-method").find(":selected").val();
        var modexp = newModExp(method);
        var conf = getConfig();
        var demo = new modexp(conf);
        log("Running demo " + demo.name() + " ONCE");

        var def = new $.Deferred();
        demo.run(def);
        def.promise().done(function() {
            log("ONETIME finished.");
        });
    });
}

// getConfig returns the base, exponent and modulo from the HTML fields as
// BigInteger, and the numbers of copies as an array. If the exponent field is
// empty, it generates a new one, writes it in the DOM and returns that value in
// the config.
function getConfig() {
    var base = new BigInteger($("#input-base").val(),16);
    if ($("#input-modulo").val().length  == 0) {
        throw new Error("Modulo Empty !!");
    }
    var modulo = new BigInteger($("#input-modulo").val(),16);

    var exp = new BigInteger($("#input-exponent").val(),16);
    if ($("#input-exponent").val().length == 0) {
        exp = randomInteger(modulo.bitLength())
        $("#input-exponent").val(exp.toString(16));
    }
    var copies = $("#input-copies").val().split(" ").map(v => parseInt(v));
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
    // XXX to be avoided if possible since it seems it uses seed = time ...
    var exponent = randomInteger(2048);

    // set default values
    $("#input-copies").val(default_copies);
    $("#input-base").val(default_base);
    //$("#input-exponent").val(exponent.toString(16));
    $("#input-modulo").val(default_q);
    log("MODULO SIZE : " + new BigInteger($("#input-modulo").val(),16).bitLength());

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

/*// showResults takes a Benchmark object (from the event given in cycle).*/
//// + writes the name of the benchmark
//// + writes general statistics about the benchmark
//// + write the whole list of individual time measurements in the text area
//function showAllResults(results) {
    //$("#result-title").text("Results for benchmark: " + results.name);
    //// write general stats
    //let html = "";
    //html += "<p> <bold> Samples: </bold> " + results.stats.sample.length + " times </p>";
    //html += "<p> <bold> Average: </bold> " + results.stats.mean + " s </p>";
    //html += "<p> <bold> Deviation: </bold> " + results.stats.deviation + " s </p>";
    //html += "<p> <bold> Relative margin of error: </bold> " + results.stats.rme + " % </p>";
    //$("#results-stats").html(html);
    //// write all individual measurements
    //$("#results-all").text(results.stats.sample.join(" ")); 
    //$("#div-no-results").hide();
    //$("#div-results").show();
/*}*/


