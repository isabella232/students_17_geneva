const default_server = "127.0.0.1:8000"
BigInteger = jsbn.BigInteger;
Random = jsbn.SecureRandom;


$(function() {
    var modExp = new ModExp("base","exp","Modulus");
    // console.log(modExp.getInfo());
    setDefaultValues();
    linkage();
    // TODO
    // 2. Link UI to triggering the creation of a MedExp object
    // 3. implement the direct method using jsbn
    // 4. implement the distributed method with RESP api in Go?

});

// launchDemo get the base, exp and modulo, reads the desired simulation from
// the list and instantiate the correct modexp class.
function launchDemo() {
    var method = $("#select-method").find(":selected").text();
    log("A new demo has been requested => " + method);
    modexp = newModExp(method);
    var i = getIntegers();
    demo = new modexp(i.base,i.exp,i.modulo);
    result = demo.run();
    log("result of the demo (" + result.bitLength() + " bits): " + result.toString(16));
}

// linkage links the UI HTML elements with their respective functions
// For the moment, it simply activates the "Calculate" button to start the demo.
function linkage() {
    $("#btn-calculate").click(function() {
        launchDemo();
    });
}

// getIntegers returns the base, exponent and modulo from the HTML fields as
// BigInteger.
function getIntegers() {
    var base = new BigInteger($("#input-base").val(),16);
    var exp = new BigInteger($("#input-exponent").val(),16);
    var modulo = new BigInteger($("#input-modulo").val(),16);
    return {base: base, exp: exp,modulo: modulo}
}

// defaultValues does the following:
// + set the default algorithm
// + generates a random exponent of 2048 bits
// + sets the strings values of the base, exponent and modulo to their
// respective fields
function setDefaultValues() {
    // select default algorithm
    $('#select-method option[value="direct"]').attr("selected",true);
    $("#input-server").val(default_server);

    // random exponent
    var arr = new Array(2048/8);
    var r = new Random();
    r.nextBytes(arr);
    var exponent = new BigInteger(arr);

    // set default values
    $("#input-base").val(default_base);
    $("#input-exponent").val(exponent.toString(16));
    $("#input-modulo").val(default_q);
}

function log(txt) {
    console.log(txt);
}

// section 8.2.3 of the geneva specs, in base 16
const default_base = "2"; 
const default_q = "800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000AD3AF";
