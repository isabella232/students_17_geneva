var allModexps = {};

// registerModExp saves the mapping from a name to a constructor method.
// It is useful to dynamically instantiate modular exp. methods.
function registerModExp(name, newMethod,description) {
    allModexps[name] = {
        newMethod: newMethod,
        description: description,
    };
}

// NewModExp returns a new instance of a modular exponentiation class selected
// from the given name, and constructed with the given arguments.
function NewModExp(name, ...args) {
    return new allModexps[name].newMethod(...args)
}

// ModExpNames returns all names corresponding to modular exponentiation classes
// that are registered.
function ModExpNames() {
    return Object.keys(allModexps);
}

function ModExpDescription(name) {
    return allModexps[name].description;
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


