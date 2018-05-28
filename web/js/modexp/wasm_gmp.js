var wasmInitDone = false;
var wasmModExpFn = null;
var wasmModExpMatrix = null;
Module['onRuntimeInitialized'] = function() {
    wasmModExpFn = Module.cwrap("modexp",null,['number','number','number']);
    wasmModExpMatrix = Module.cwrap("modexpMatrix",null,['number','number']);
    printIntMatrix = Module.cwrap("printIntMatrix",null,['number','number']);
    wasmInitDone = true
};


class WasmGMPModExp extends ModExp {
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

        wasmModExpMatrix(dataPtr,nbData)

        for(var i = 0; i < this.copies; i++) {
            Module._free(allPtrs[i*2]);
            Module._free(allPtrs[(i*2)+1]);
        }
        Module._free(dataPtr.byteOffset);
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

    runSequential(deferred) {
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

registerModExp("wasm_gmp",WasmGMPModExp, "Uses the GMP library compiled with emscripten to WebAssembly")
