function newModExp(name) {
    switch (name.toLowerCase()) {
        case "direct":
            return LocalModExp
        case "split":
            return SplitModExp
        case "wasm":
            return WasmModExp
        default:
            log("WRONG MODEXP NAME -- FAILURE OF THE UNIVERSE");
    }
}

class ModExp {
    // integers is a map with the following keys:
    // copies: the number of copies of the modular exp. one must performs
    // base: the base biginteger
    // exp: the exponent as biginteger
    // mod: the modulo as biginteger
    constructor(integers) {
        this.base = integers.base;
        this.exp = integers.exp;
        this.mod = integers.modulo;
        this.copies = integers.copies;
        
    }

    getInfo() {
        let str =  "Base: " + this.base.toString(16) + "\n";
        str += "Exp: " + this.exp.toString(16) + "\n";
        str += "Mod: " + this.mod.toString(16) + "\n";
        str += "Expected: " + this.modexp().toString(16) + "\n";
        return str
    }

    modexp() {
        return this.base.modPow(this.exp,this.mod);
    }

    name() {
        throw new Error("name should be overriden")
    }

    run(deferred) {
        throw new Error("Abstract ModExp can't be ran")
    }
}

class LocalModExp extends ModExp {
    constructor(integers) {
        super(integers);
    }

    name() {
        return "local computation with jsbn";
    }

    run(deferred) {
        log("local modexp running with " + this.copies + " copies");
        var res = null;
        for(var count = 0; count < this.copies; count++) {
            res = this.base.modPow(this.exp,this.mod);
        }
        log("local --> base = " + this.base.toString(16));
        log("local --> exp = " + this.exp.toString(16));
        log("local --> mod = " + this.mod.toString(16));
        //log("local --> res = " + res.toString(16));
        deferred.resolve();
    }
}

var wasmInitDone = false;
var wasmModExpFn = null;
var wasmModExpMatrix = null;
Module['onRuntimeInitialized'] = function() { 
    wasmModExpFn = Module.cwrap("modexp",null,['number','number','number']);
    wasmModExpMatrix = Module.cwrap("modexpMatrix",null,['number','number']);
    printIntMatrix = Module.cwrap("printIntMatrix",null,['number','number']);
    wasmInitDone = true
};


class WasmModExp extends ModExp {
    constructor(config) {
        if (!wasmInitDone) {
            throw new Error("wasn init not done! exit.");
        }
        super(config);
    }

    name() {
        return "WebAssembly w/ GMP compiled";
    }

    run(deferred) {
        console.log("Test: wasm matrix START");
        // pairs of (base,exp) + modulo
        var nbData = this.copies * 2 + 1;
        var dataPtr = allocate(4*nbData,'i32',ALLOC_NORMAL);
       
        var allPtrs = new Uint32Array(this.copies * 2);
        Module.setValue(dataPtr + 4 * 1,this.i2wasm(this.mod.toString(16)),"i32");
        for(var i =0; i < this.copies; i++) {
            // first the base
            var baseIdx = i*2;
            allPtrs[baseIdx] = this.i2wasm(this.base.toString(16));
            Module.setValue(dataPtr + 4 * baseIdx,allPtrs[baseIdx],"i32");
            // then the exp 
            var expIdx = (i*2) + 1;
            allPtrs[expIdx] = this.i2wasm(this.exp.toString(16));
            Module.setValue(dataPtr + 4 * expIdx,allPtrs[expIdx],"i32");
        }

        // copy modulo as last element
        var modPtr = this.i2wasm(this.mod.toString(16));
        Module.setValue(dataPtr + 4 * (nbData-1),modPtr,"i32");
        
        //printIntMatrix(dataPtr,nbData)
        wasmModExpMatrix(dataPtr,nbData)

        for(var i = 0; i < this.copies; i++) {
            Module._free(allPtrs[i*2]);
            Module._free(allPtrs[(i*2)+1]);
        }
        Module._free(dataPtr.byteOffset);
        console.log("Test: wasm matrix END");
        deferred.resolve()
    }

    runAll(deferred) { 
        log("wasm modexp running with " + this.copies + " copies");
        //
        // allocate space for enough exp + base pairs
        // the modulo il placed at the end of the array
        var matrixLen = this.copies * 2 + 1;
        var matrix = new Uint32Array(matrixLen);

        // allocate space for the modulo
        var modStr = this.mod.toString(16);
        var modLen = Module.lengthBytesUTF8(modStr);
        var modBuff = Module._malloc(modLen+1);
        Module.stringToUTF8(modStr,modBuff,modLen+1);
        // save the modulo at the end
        matrix[matrixLen-1] = modBuff;

        for(var count = 0; count < this.copies; count += 2) {
            // copy the base and exp into buffers
            var baseStr = this.base.toString(16);
            var baseBuff = Module._malloc(modLen+1);
            Module.stringToUTF8(baseStr,baseBuff,modLen+1);
            var expStr = this.exp.toString(16);
            var expBuff = Module._malloc(modLen+1);
            Module.stringToUTF8(expStr,expBuff,modLen+1);
        
            // store the buffer in the matrix
            matrix[count*2] = baseBuff;
            matrix[count*2 +1] = expBuff;
        }
        
        // copy matrix to heap
        var nMatrixBytes = matrix.length * matrix.BYTES_PER_ELEMENT;
        var matrixBuff = Module._malloc(nMatrixBytes);
        var matrixHeap = new Uint8Array(Module.HEAP8.buffer,matrixBuff,nMatrixBytes);
        console.log("matrixLen = " + matrixLen);
        console.log("matrixHeap.length = " + matrixHeap.length);
        console.log("nMatrixBytes = " + nMatrixBytes);
        console.log("matrix.length = "+ matrix.length);
        console.log("matrixLen.BYTES_PER_ELEMENT = " +matrix.BYTES_PER_ELEMENT);
        console.log("new Uint8Array(matrix.buffer) " + new Uint8Array(matrix.buffer).length);
        matrixHeap.set(new Uint8Array(matrix.buffer));
        console.log("matrixHeap[0] = ");
        console.log(matrixHeap[0]);
        console.log(matrixHeap[1]);
        console.log(matrixHeap[2]);
        console.log(matrixHeap[3]);
        console.log("matrix[0] = " + matrix[0]);
        wasmModExpMatrix(matrixHeap,matrixLen);
        
        // free up stuff
        Module._free(modBuff);
        for (var count = 0; count < matrixLen; count++) {
            Module._free(matrix[count]);
        }
        Module._free(matrixBuff);
        Module._free(matrixHeap);
    }

    runSeuential(deferred) {
        log("wasm modexp running with " + this.copies + " copies");
        // Allocate three buffers on the heap
        // and copy the right value for exp and base at each iteration, while
        // keeping the modulo fixed.
        var modStr = this.mod.toString(16);
        var modLen = Module.lengthBytesUTF8(modStr);
        var modBuff = Module._malloc(modLen+1);
        Module.stringToUTF8(modStr,modBuff,modLen+1);

        var baseStr = this.base.toString(16);
        var baseBuff = Module._malloc(modLen+1);

        var expStr = this.exp.toString(16);
        var expBuff = Module._malloc(modLen+1);
        
        for(var count = 0; count < this.copies; count++) {
            Module.stringToUTF8(baseStr,baseBuff,modLen+1);
            Module.stringToUTF8(expStr,expBuff,modLen+1);
            wasmModExpFn(baseBuff,expBuff,modBuff);
        }
        
        Module._free(modBuff);
        Module._free(baseBuff);
        Module._free(expBuff);
        
        deferred.resolve();
    }

    i2wasm(integer) {
        return allocate(intArrayFromString(integer),'i8',ALLOC_NORMAL);
    }
}

class SplitModExp extends ModExp {
    constructor(integers) {
        super(integers)
        // read the address of the servers
        this.servers = $("#input-servers").val().split(" ");
        if (this.servers.length < 2) {
            throw new Error("split mod exp can't use less than 2 servers"); 
        }
        var v1 = new BigInteger("1");
        this.modulo_1 = new BigInteger();
        this.mod.copyTo(this.modulo_1);
        // modulo - 1 for exponents
        this.modulo_1 = this.modulo_1.subtract(v1);
    }

    name() {
        return "remote computation - split secrets in n shares";
    }

    run(deferred) {
        // prepare the splitting
        // s = secret to share = exponent
        // create n-1 random numbers r_i
        // create last share r_n = s - SUM(r_i)
        var n = this.servers.length;
        var n_1 = n - 1;
        var splitCopies = new Array(this.copies);
        for (var i = 0; i < this.copies; i++) {
            splitCopies[i] = this.split();             
            //log("SPLIT for i = " + i);
            //log(splitCopies[i]);
        }
        var modStr = this.mod.toString(16);
        var baseStr = this.base.toString(16);
        //log(this.getInfo());
        //log("modulo - 1 : " + this.modulo_1.toString(16)); 
        //log("Modexp - SPLIT : " + this.copies + " operations");
        var promises = [];
        for(const [i,server] of this.servers.entries()) {
            var url = "http://" + server + "/modexp/split";
            var modexps = new Array(this.copies);
            for(var j = 0; j < this.copies; j++) {
                var modexp = { 
                    "base": baseStr, 
                    "exp": splitCopies[j][i].toString(16) 
                };
                modexps[j] = modexp
            }
            var data = {
                "modulo": modStr,
                "modexps": modexps,
            }
            //log("Requesting modexp at url " + url);
            //log(data);
            //log(JSON.stringify(data));
            promises.push($.ajax({
                type: "POST",
                url: url, 
                crossDomain: true,
                data: JSON.stringify(data),
                contentType: "application/json",
                dataType: "json",
            }));
        }
        
        var that = this;
        $.when.apply($,promises).done(function() {
            var results = new Array(arguments.length);
            for(var i = 0; i < arguments.length; i++) {
                results[i] =  arguments[i][0].Results; 
            }
            //log(results);
            that.aggregate(results);
            //log("splitmodexp - finish");
            deferred.resolve();
        })
        .fail(function(error) {
            log(error);
        });
    }

    split() {
       var n = this.servers.length;
       var n_1 = this.servers.length-1;
       var splits = new Array(n); 
       var acc = new BigInteger("0");
       //log("Split mod demo:");
       for(var i = 0; i < n_1; i++) { 
           splits[i] = randomInteger(this.modulo_1.bitLength()).mod(this.modulo_1);
           acc = acc.add(splits[i]).mod(this.modulo_1);
       };
       var last = new BigInteger("0");
       this.exp.copyTo(last);
       // r_n = s - SUM(r_i)
       splits[n_1] = last.subtract(acc).mod(this.modulo_1);
       //this.verifySplit(splits)
       return splits
    }

    aggregate(results) {
        for(var i = 0; i < this.copies;  i++) {
            var acc = new BigInteger("1");
            for(var j = 0; j < this.servers.length; j++) {
                // take the i'th response from the j's servers
                var r_i = new BigInteger(results[j][i],16);
                acc = acc.multiply(r_i).mod(this.mod);
                //log("-- Result["+ i + "] : " + data[0]);
                //log("-- acc = " + acc.toString(16));
            }
            //log("final result: " + acc.toString(16));
            //log("expected result : " + this.modexp().toString(16));
        }
        //log("SPlitModExp Aggregate done");
    }

    verifySplit(splits) {
        // just to check if we retrieve the same exponent after
        var res = new BigInteger("0");
        // res = SUM(r_i) + r_n = SUM(r_i) + s - SUM(r_i)
        var finalResult = new BigInteger("1");
        for(var i = 0; i < splits.length; i++ ) { 
            // compute SUM(r_i)
            res = res.add(splits[i]).mod(this.modulo_1);
            // compute compute = base^r_i mod q
            var compute = new BigInteger("0");
            this.base.copyTo(compute);
            //log("VERIFY --> Base["+i+"] = " + compute.toString(16));
            //log("VERIFY --> Exp["+i+"] = " + splits[i].toString(16));
            //log("VERIFY --> Mod["+i+"] = " + this.mod.toString(16));
            compute = compute.modPow(splits[i],this.mod);
            //log("VERIFY --> Computation[" + i + "] = " + compute.toString(16));
            // compute MULTIPLY(base^r_i)
            finalResult = finalResult.multiply(compute).mod(this.mod);
        }
        var resStr = res.toString(16);
        var expStr = this.exp.toString(16);
        if (resStr != expStr) {
            throw new Error("exponent splitting is weird");
        }
        var finalStr = finalResult.toString(16);
        var expectedStr = this.base.modPow(this.exp,this.mod).toString(16);
        //log("VERIFY --> Final result: " + finalStr);
        //log("VERIFY --> Expected result: " + expectedStr);
        if (finalStr != expectedStr) {
            throw new Error("modular exponentiation does not work?");
        }
        //log("Splitting has been done correctly");
        return true;
    }
}

function randomInteger(bitLength) {
    var arr = new Array(bitLength/8);
    var r = new Random();
    r.nextBytes(arr);
    return new BigInteger(arr).abs();
}

