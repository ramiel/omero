var Coverage = function(descriptor) {
    this.path = descriptor.path;
    this.name = descriptor.name;
    this.blocks = [];
    this.coveragePercentage = null;
};

Coverage.prototype.addBlock = function(type, loc, doc) {
    this.blocks.push({
        type: type,
        loc: loc,
        doc: doc
    });
};

Coverage.prototype.generateStatistic = function() {
    var missing = this.blocks.filter(function(b) {
        return b.doc === false;
    });
    this.coveragePercentage = 100 - ((missing.length * 100) / this.blocks.length);
    return this.coveragePercentage;
};

Coverage.prototype.getMissingDocs = function() {
    return this.blocks.filter(function(b) {
        return b.doc === false;
    });
};

module.exports = Coverage;

// {
//     loc : {
//         ...
//     }
//     type: "FunctionCacchi",
//     doc: false ||  {
//         loc: {
//             ...
//         }
//     }
// }
