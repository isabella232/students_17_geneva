function newModExp(name) {
    switch (name.toLowerCase()) {
        case "direct":
            return LocalModExp
        default:
            log("WRONG MODEXP NAME -- FAILURE OF THE UNIVERSE");
    }
}

class ModExp {
    constructor(base,exp,modulo) {
        this.base = base;
        this.exp = exp;
        this.mod = modulo;
    }

    getInfo() {
        let str =  "Base: " + this.base + "\n";
        str += "Exp: " + this.exp + "\n";
        str += "Mod: " + this.mod  + "\n";
        return str
    }

    run() {
        throw new Error("Abstract ModExp can't be ran")
    }
}

class LocalModExp extends ModExp {
    constructor(base,exp,modulo) {
        super(base,exp,modulo);
    }

    run() {
        log("Running local modexp demo")
        return this.base.modPow(this.exp,this.mod)
    }
}
