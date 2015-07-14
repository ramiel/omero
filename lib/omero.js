var esprima = require('esprima'),
    async = require('async'),
    Omero;

Omero = function(options) {
    this._options = options || {};
    this._srcDescriptors = null;
    this._esprimaOpt = {comment:true, loc:true};
    this._rules = null;
};

/**
 * Load source file and generate code trees
 * @param  {Descriptor|Descriptor[]} descriptors Dexcriptor of source file
 */
Omero.prototype.loadDescriptors = function(descriptors, callback) {
    descriptors = Array.isArray(descriptors) ? descriptors : [descriptors];
    async.each(
        descriptors,

        function(desc, cb) {
            desc.read(cb);
        },

        function(err) {
            if (err) {
                return callback(err);
            }

            this._srcDescriptors = descriptors.map(function(desc) {
                desc.tree = esprima.parse(desc.code, this._esprimaOpt);
                return desc;
            }.bind(this));
            callback(null);
        }.bind(this)
    );
};

Omero.prototype._getRules = function() {
    if (!this._rules) {
        // TODO: use options to generate them and improve
        this._rules = function(node, parent) {
            return node.type.toLowerCase().indexOf('function') >= 0;
        };
    }

    return this._rules;
};

Omero.prototype.getDescriptorCoverage = function(descriptor) {
    var rules = this._getRules();
    return descriptor.getDocumentationCoverage(rules);
};

Omero.prototype.getDocumentationCoverage = function() {
    var coverage = {
        documents: [],
        overall: null
    };
    for (var i in this._srcDescriptors) {
        coverage.documents.push(this.getDescriptorCoverage(this._srcDescriptors[i]));
    }

    coverage.overall = coverage.documents.map(function(a) {return a.coveragePercentage;}).reduce(function(a, b) {
        return a + b;
    }) / coverage.documents.length;
    return coverage;
};

module.exports = Omero;

var Descriptor = require('./descriptor');
var testfile = new Descriptor(__dirname + '/../test.js');
var routerfile = new Descriptor(__dirname + '/../../router.js/src/router.js');
var omerofile = new Descriptor(__dirname + '/./omero.js');
var omero = new Omero({});

omero.loadDescriptors([omerofile], function(err) {
    if (err)
        return console.log(err);
    var coverage = omero.getDocumentationCoverage(omero._srcDescriptors[0]);
    console.log(JSON.stringify(coverage, null, 2));
});
