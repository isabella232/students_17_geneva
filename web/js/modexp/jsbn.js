class JsbnModExp extends ModExp {
    constructor(integers) {
        super(integers);
    }

    name() {
        return "local computation with jsbn";
    }

    run(deferred) {
        var res = null;
        for(var count = 0; count < this.copies; count++) {
            res = this.base.modPow(this.exp,this.mod);
        }
        deferred.resolve();
    }
}

registerModExp("jsbn",JsbnModExp, "Uses the JSBN native JS library to perform the computations");
