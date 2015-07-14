var esprima = require('esprima'),
    fs = require('fs'),
    TreeModel = require('tree-model'),
    nodes = require('nodes');

var code = fs.readFileSync('../router.js/src/router.js').toString();
// var code = fs.readFileSync('./test.js').toString();

var e_opt = {
    comment:true
    ,loc:true
};
var parsed = esprima.parse(code, e_opt);

fs.writeFileSync('./parsed.json',JSON.stringify(parsed,null, 2));
var root = nodes.build(parsed);

var toDocumet = root.search('#Function');
console.log(toDocumet[0].toString());
return;
var tree = new TreeModel({
        childrenPropertyName: 'body'
    }),
    root = tree.parse(parsed),
    comments = parsed.comments;

function isFunctionDeclaration(node){
    return node.model.type === 'FunctionDeclaration';
}

function isExpressionStatementWithFunction(node){
    return node.model.type === 'ExpressionStatement' 
            && node.model.expression.right 
            && node.model.expression.right.type === 'FunctionExpression';
}

function needsDocumentation(node){
    return isFunctionDeclaration(node) || isExpressionStatementWithFunction(node);
}

// var different_root_start = false;
// for(var j in comments){
//     if( /\s*\/\*\*\s*doc\s*:\s*root\s*\*\//i.test(comments[j].value)){
//         different_root_start = comments[j].loc.start.line;
//         break;   
//     }
// }
// if(different_root_start !== false){
//     inner_root  = root.first(function(n){
//         n.
//     });
// }

var functions = root.all(function(n){
    return needsDocumentation(n);
});

function notTheSame(n1,n2){
    return n1.model.loc.start.line !== n2.model.loc.start.line;
}

function findDocBlock(n){
    var c = null,
        codeLine = n.model.loc.start.line
    for(var i in comments){
        if(comments[i].loc.end.line < codeLine){
            if(c && c.loc.end.line > comments[i].loc.end.line){
                continue;
            }
            c = comments[i];
        }
    }
    if(c){
        var codeBetween = root.all(function(k){
            return notTheSame(k,n) 
                && k.model.loc.start.line > c.loc.start.line //sta dopo il commento
                && k.model.loc.start.line < n.model.loc.start.line; // e prima del nodo esaminato
        }).length;
        if(codeBetween > 0){
            c = null;
        }
    }
    return c;
}

// console.log(functions);
functions.forEach(function(f){
    f.doc = findDocBlock(f);
});

var missing = functions.filter(function(f){return f.doc === null;});

console.log(functions, 100 - ((missing.length*100)/functions.length),functions.length,missing.length);

