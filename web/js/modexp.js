function newModExp(name) {
    switch (name.toLowerCase()) {
        case "direct":
            return LocalModExp
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
        let str =  "Base: " + this.base + "\n";
        str += "Exp: " + this.exp + "\n";
        str += "Mod: " + this.mod  + "\n";
        return str
    }

    name() {
        throw new Error("name should be overriden")
    }

    run() {
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

    run() {
        //log("local modexp running with " + this.copies + " copies");
        for(var count = 0; count < this.copies; count++) {
            this.base.modPow(this.exp,this.mod);
        }
    }
}
