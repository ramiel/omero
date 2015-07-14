var fs = require('fs'),
    Coverage = require('./coverage'),
    estraverse = require('estraverse'),
    Descriptor;
/**
 * Descript a single src file
 * @param {string} path Absolute path to the source file
 * @param {string} name Readable name for this source
 */
Descriptor = function(path, name) {
    this.path = path;
    this.tree = null;
    this.name = name || 'TODO';
    this.code = null;
    this.coverage = new Coverage(this);
};

Descriptor.prototype.read = function(callback) {
    fs.readFile(this.path, function(err, data) {
        if (err)
            return callback(err);
        this.code = data.toString();
        callback(null);
    }.bind(this));
};

function notTheSame(n1, n2) {
    return n1.loc.start.line !== n2.loc.start.line;
}

Descriptor.prototype.geNodeDocumentation = function(node) {

    var c = null,
        codeLine = node.loc.start.line,
        comments = this.tree.comments;
    for (var i in comments) {
        if (comments[i].loc.end.line < codeLine) {
            if (c && c.loc.end.line > comments[i].loc.end.line) {
                continue;
            }

            c = comments[i];
        }
    }

    if (c) {
        var codeBetween = 0;
        estraverse.traverse(this.tree,
            {
                enter: function(k, parent) {
                    if (notTheSame(k, node) &&
                        k.loc.start.line > c.loc.start.line && // sta dopo il commento
                        k.loc.start.line < node.loc.start.line // e prima del nodo esaminato
                    ) {
                        codeBetween++;
                    }
                }
            }
        );
        if (codeBetween > 0) {
            c = null;
        }
    }

    return c;
};

Descriptor.prototype.getDocumentationCoverage = function(rule) {
    var possibleDocNodes = [];
    estraverse.traverse(this.tree,
        {
            enter: function(node, parent) {
                if (rule(node)) {
                    possibleDocNodes.push(node);
                }
            }
        });

    for (var i in possibleDocNodes) {
        commentBlock = this.geNodeDocumentation(possibleDocNodes[i]);
        this.coverage.addBlock(possibleDocNodes[i].type, possibleDocNodes[i].loc, commentBlock || false);
    }

    this.coverage.generateStatistic();

    return this.coverage;
};

module.exports = Descriptor;
