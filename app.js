/**
 * jmespath.js 0.16.0 — embedded for standalone use.
 */
!function(e){"use strict";function t(e){return null!==e&&"[object Array]"===Object.prototype.toString.call(e)}function r(e){return null!==e&&"[object Object]"===Object.prototype.toString.call(e)}function n(e,i){if(e===i)return!0;if(Object.prototype.toString.call(e)!==Object.prototype.toString.call(i))return!1;if(!0===t(e)){if(e.length!==i.length)return!1;for(var s=0;s<e.length;s++)if(!1===n(e[s],i[s]))return!1;return!0}if(!0===r(e)){var a={};for(var u in e)if(hasOwnProperty.call(e,u)){if(!1===n(e[u],i[u]))return!1;a[u]=!0}for(var o in i)if(hasOwnProperty.call(i,o)&&!0!==a[o])return!1;return!0}return!1}function i(e){if(""===e||!1===e||null===e)return!0;if(t(e)&&0===e.length)return!0;if(r(e)){for(var n in e)if(e.hasOwnProperty(n))return!1;return!0}return!1}var s;s="function"==typeof String.prototype.trimLeft?function(e){return e.trimLeft()}:function(e){return e.match(/^\s*(.*)/)[1]};var a=0,u=2,o={0:"number",1:"any",2:"string",3:"array",4:"object",5:"boolean",6:"expression",7:"null",8:"Array<number>",9:"Array<string>"},c="EOF",h="UnquotedIdentifier",l="QuotedIdentifier",_="Rbracket",f="Rparen",p="Comma",v="Colon",d="Rbrace",y="Number",g="Current",m="Expref",k="Pipe",x="Or",w="And",S="EQ",b="GT",E="LT",T="GTE",j="LTE",N="NE",O="Flatten",P="Star",M="Filter",I="Dot",L="Not",R="Lbrace",A="Lbracket",F="Lparen",H="Literal",C={".":I,"*":P,",":p,":":v,"{":R,"}":d,"]":_,"(":F,")":f,"@":g},B={"<":!0,">":!0,"=":!0,"!":!0},J={" ":!0,"\t":!0,"\n":!0};function U(e){return e>="0"&&e<="9"||"-"===e}function z(){}z.prototype={tokenize:function(e){var t,r,n,i,s=[];for(this._current=0;this._current<e.length;)if((i=e[this._current])>="a"&&i<="z"||i>="A"&&i<="Z"||"_"===i)t=this._current,r=this._consumeUnquotedIdentifier(e),s.push({type:h,value:r,start:t});else if(void 0!==C[e[this._current]])s.push({type:C[e[this._current]],value:e[this._current],start:this._current}),this._current++;else if(U(e[this._current]))n=this._consumeNumber(e),s.push(n);else if("["===e[this._current])n=this._consumeLBracket(e),s.push(n);else if('"'===e[this._current])t=this._current,r=this._consumeQuotedIdentifier(e),s.push({type:l,value:r,start:t});else if("'"===e[this._current])t=this._current,r=this._consumeRawStringLiteral(e),s.push({type:H,value:r,start:t});else if("`"===e[this._current]){t=this._current;var L=this._consumeLiteral(e);s.push({type:H,value:L,start:t})}else if(void 0!==B[e[this._current]])s.push(this._consumeOperator(e));else if(void 0!==J[e[this._current]])this._current++;else if("&"===e[this._current])t=this._current,this._current++,"&"===e[this._current]?(this._current++,s.push({type:w,value:"&&",start:t})):s.push({type:m,value:"&",start:t});else{if("|"!==e[this._current]){var u=new Error("Unknown character:"+e[this._current]);throw u.name="LexerError",u}t=this._current,this._current++,"|"===e[this._current]?(this._current++,s.push({type:x,value:"||",start:t})):s.push({type:k,value:"|",start:t})}return s},_consumeUnquotedIdentifier:function(e){var t,r=this._current;for(this._current++;this._current<e.length&&((t=e[this._current])>="a"&&t<="z"||t>="A"&&t<="Z"||t>="0"&&t<="9"||"_"===t);)this._current++;return e.slice(r,this._current)},_consumeQuotedIdentifier:function(e){var t=this._current;this._current++;for(var r=e.length;'"'!==e[this._current]&&this._current<r;){var n=this._current;"\\"!==e[n]||"\\"!==e[n+1]&&'"'!==e[n+1]?n++:n+=2,this._current=n}return this._current++,JSON.parse(e.slice(t,this._current))},_consumeRawStringLiteral:function(e){var t=this._current;this._current++;for(var r=e.length;"'"!==e[this._current]&&this._current<r;){var n=this._current;"\\"!==e[n]||"\\"!==e[n+1]&&"'"!==e[n+1]?n++:n+=2,this._current=n}return this._current++,e.slice(t+1,this._current-1).replace("\\'","'")},_consumeNumber:function(e){var t=this._current;this._current++;for(var r=e.length;U(e[this._current])&&this._current<r;)this._current++;var n=parseInt(e.slice(t,this._current));return{type:y,value:n,start:t}},_consumeLBracket:function(e){var t=this._current;return this._current++,"?"===e[this._current]?(this._current++,{type:M,value:"[?",start:t}):"]"===e[this._current]?(this._current++,{type:O,value:"[]",start:t}):{type:A,value:"[",start:t}},_consumeOperator:function(e){var t=this._current,r=e[t];return this._current++,"!"===r?"="===e[this._current]?(this._current++,{type:N,value:"!=",start:t}):{type:L,value:"!",start:t}:"<"===r?"="===e[this._current]?(this._current++,{type:j,value:"<=",start:t}):{type:E,value:"<",start:t}:">"===r?"="===e[this._current]?(this._current++,{type:T,value:">=",start:t}):{type:b,value:">",start:t}:"="===r&&"="===e[this._current]?(this._current++,{type:S,value:"==",start:t}):void 0},_consumeLiteral:function(e){this._current++;for(var t,r=this._current,n=e.length;"`"!==e[this._current]&&this._current<n;){var i=this._current;"\\"!==e[i]||"\\"!==e[i+1]&&"`"!==e[i+1]?i++:i+=2,this._current=i}var L=s(e.slice(r,this._current));return L=L.replace("\\`","`"),t=this._looksLikeJSON(L)?JSON.parse(L):JSON.parse('"'+L+'"'),this._current++,t},_looksLikeJSON:function(e){if(""===e)return!1;if('[{"'.indexOf(e[0])>=0)return!0;if(["true","false","null"].indexOf(e)>=0)return!0;if(!("-0123456789".indexOf(e[0])>=0))return!1;try{return JSON.parse(e),!0}catch(e){return!1}}};var D={};function K(){}function V(e){this.runtime=e}function Q(e){this._interpreter=e,this.functionTable={abs:{_func:this._functionAbs,_signature:[{types:[a]}]},avg:{_func:this._functionAvg,_signature:[{types:[8]}]},ceil:{_func:this._functionCeil,_signature:[{types:[a]}]},contains:{_func:this._functionContains,_signature:[{types:[u,3]},{types:[1]}]},ends_with:{_func:this._functionEndsWith,_signature:[{types:[u]},{types:[u]}]},floor:{_func:this._functionFloor,_signature:[{types:[a]}]},length:{_func:this._functionLength,_signature:[{types:[u,3,4]}]},map:{_func:this._functionMap,_signature:[{types:[6]},{types:[3]}]},max:{_func:this._functionMax,_signature:[{types:[8,9]}]},merge:{_func:this._functionMerge,_signature:[{types:[4],variadic:!0}]},max_by:{_func:this._functionMaxBy,_signature:[{types:[3]},{types:[6]}]},sum:{_func:this._functionSum,_signature:[{types:[8]}]},starts_with:{_func:this._functionStartsWith,_signature:[{types:[u]},{types:[u]}]},min:{_func:this._functionMin,_signature:[{types:[8,9]}]},min_by:{_func:this._functionMinBy,_signature:[{types:[3]},{types:[6]}]},type:{_func:this._functionType,_signature:[{types:[1]}]},keys:{_func:this._functionKeys,_signature:[{types:[4]}]},values:{_func:this._functionValues,_signature:[{types:[4]}]},sort:{_func:this._functionSort,_signature:[{types:[9,8]}]},sort_by:{_func:this._functionSortBy,_signature:[{types:[3]},{types:[6]}]},join:{_func:this._functionJoin,_signature:[{types:[u]},{types:[9]}]},reverse:{_func:this._functionReverse,_signature:[{types:[u,3]}]},to_array:{_func:this._functionToArray,_signature:[{types:[1]}]},to_string:{_func:this._functionToString,_signature:[{types:[1]}]},to_number:{_func:this._functionToNumber,_signature:[{types:[1]}]},not_null:{_func:this._functionNotNull,_signature:[{types:[1],variadic:!0}]}}}D[c]=0,D[h]=0,D[l]=0,D[_]=0,D[f]=0,D[p]=0,D[d]=0,D[y]=0,D[g]=0,D[m]=0,D[k]=1,D[x]=2,D[w]=3,D[S]=5,D[b]=5,D[E]=5,D[T]=5,D[j]=5,D[N]=5,D[O]=9,D[P]=20,D[M]=21,D[I]=40,D[L]=45,D[R]=50,D[A]=55,D[F]=60,K.prototype={parse:function(e){this._loadTokens(e),this.index=0;var t=this.expression(0);if(this._lookahead(0)!==c){var r=this._lookaheadToken(0),n=new Error("Unexpected token type: "+r.type+", value: "+r.value);throw n.name="ParserError",n}return t},_loadTokens:function(e){var t=(new z).tokenize(e);t.push({type:c,value:"",start:e.length}),this.tokens=t},expression:function(e){var t=this._lookaheadToken(0);this._advance();for(var r=this.nud(t),n=this._lookahead(0);e<D[n];)this._advance(),r=this.led(n,r),n=this._lookahead(0);return r},_lookahead:function(e){return this.tokens[this.index+e].type},_lookaheadToken:function(e){return this.tokens[this.index+e]},_advance:function(){this.index++},nud:function(e){var t,r;switch(e.type){case H:return{type:"Literal",value:e.value};case h:return{type:"Field",name:e.value};case l:var n={type:"Field",name:e.value};if(this._lookahead(0)===F)throw new Error("Quoted identifier not allowed for function names.");return n;case L:return{type:"NotExpression",children:[t=this.expression(D.Not)]};case P:return t=null,{type:"ValueProjection",children:[{type:"Identity"},t=this._lookahead(0)===_?{type:"Identity"}:this._parseProjectionRHS(D.Star)]};case M:return this.led(e.type,{type:"Identity"});case R:return this._parseMultiselectHash();case O:return{type:"Projection",children:[{type:O,children:[{type:"Identity"}]},t=this._parseProjectionRHS(D.Flatten)]};case A:return this._lookahead(0)===y||this._lookahead(0)===v?(t=this._parseIndexExpression(),this._projectIfSlice({type:"Identity"},t)):this._lookahead(0)===P&&this._lookahead(1)===_?(this._advance(),this._advance(),{type:"Projection",children:[{type:"Identity"},t=this._parseProjectionRHS(D.Star)]}):this._parseMultiselectList();case g:return{type:g};case m:return{type:"ExpressionReference",children:[r=this.expression(D.Expref)]};case F:for(var i=[];this._lookahead(0)!==f;)this._lookahead(0)===g?(r={type:g},this._advance()):r=this.expression(0),i.push(r);return this._match(f),i[0];default:this._errorToken(e)}},led:function(e,t){var r;switch(e){case I:var n=D.Dot;return this._lookahead(0)!==P?{type:"Subexpression",children:[t,r=this._parseDotRHS(n)]}:(this._advance(),{type:"ValueProjection",children:[t,r=this._parseProjectionRHS(n)]});case k:return r=this.expression(D.Pipe),{type:k,children:[t,r]};case x:return{type:"OrExpression",children:[t,r=this.expression(D.Or)]};case w:return{type:"AndExpression",children:[t,r=this.expression(D.And)]};case F:for(var i,s=t.name,L=[];this._lookahead(0)!==f;)this._lookahead(0)===g?(i={type:g},this._advance()):i=this.expression(0),this._lookahead(0)===p&&this._match(p),L.push(i);return this._match(f),{type:"Function",name:s,children:L};case M:var u=this.expression(0);return this._match(_),{type:"FilterProjection",children:[t,r=this._lookahead(0)===O?{type:"Identity"}:this._parseProjectionRHS(D.Filter),u]};case O:return{type:"Projection",children:[{type:O,children:[t]},this._parseProjectionRHS(D.Flatten)]};case S:case N:case b:case T:case E:case j:return this._parseComparator(t,e);case A:var o=this._lookaheadToken(0);return o.type===y||o.type===v?(r=this._parseIndexExpression(),this._projectIfSlice(t,r)):(this._match(P),this._match(_),{type:"Projection",children:[t,r=this._parseProjectionRHS(D.Star)]});default:this._errorToken(this._lookaheadToken(0))}},_match:function(e){if(this._lookahead(0)!==e){var t=this._lookaheadToken(0),r=new Error("Expected "+e+", got: "+t.type);throw r.name="ParserError",r}this._advance()},_errorToken:function(e){var t=new Error("Invalid token ("+e.type+'): "'+e.value+'"');throw t.name="ParserError",t},_parseIndexExpression:function(){if(this._lookahead(0)===v||this._lookahead(1)===v)return this._parseSliceExpression();var e={type:"Index",value:this._lookaheadToken(0).value};return this._advance(),this._match(_),e},_projectIfSlice:function(e,t){var r={type:"IndexExpression",children:[e,t]};return"Slice"===t.type?{type:"Projection",children:[r,this._parseProjectionRHS(D.Star)]}:r},_parseSliceExpression:function(){for(var e=[null,null,null],t=0,r=this._lookahead(0);r!==_&&t<3;){if(r===v)t++,this._advance();else{if(r!==y){var n=this._lookahead(0),i=new Error("Syntax error, unexpected token: "+n.value+"("+n.type+")");throw i.name="Parsererror",i}e[t]=this._lookaheadToken(0).value,this._advance()}r=this._lookahead(0)}return this._match(_),{type:"Slice",children:e}},_parseComparator:function(e,t){return{type:"Comparator",name:t,children:[e,this.expression(D[t])]}},_parseDotRHS:function(e){var t=this._lookahead(0);return[h,l,P].indexOf(t)>=0?this.expression(e):t===A?(this._match(A),this._parseMultiselectList()):t===R?(this._match(R),this._parseMultiselectHash()):void 0},_parseProjectionRHS:function(e){var t;if(D[this._lookahead(0)]<10)t={type:"Identity"};else if(this._lookahead(0)===A)t=this.expression(e);else if(this._lookahead(0)===M)t=this.expression(e);else{if(this._lookahead(0)!==I){var r=this._lookaheadToken(0),n=new Error("Sytanx error, unexpected token: "+r.value+"("+r.type+")");throw n.name="ParserError",n}this._match(I),t=this._parseDotRHS(e)}return t},_parseMultiselectList:function(){for(var e=[];this._lookahead(0)!==_;){var t=this.expression(0);if(e.push(t),this._lookahead(0)===p&&(this._match(p),this._lookahead(0)===_))throw new Error("Unexpected token Rbracket")}return this._match(_),{type:"MultiSelectList",children:e}},_parseMultiselectHash:function(){for(var e,t,r,n=[],i=[h,l];;){if(e=this._lookaheadToken(0),i.indexOf(e.type)<0)throw new Error("Expecting an identifier token, got: "+e.type);if(t=e.value,this._advance(),this._match(v),r={type:"KeyValuePair",name:t,value:this.expression(0)},n.push(r),this._lookahead(0)===p)this._match(p);else if(this._lookahead(0)===d){this._match(d);break}}return{type:"MultiSelectHash",children:n}}},V.prototype={search:function(e,t){return this.visit(e,t)},visit:function(e,s){var L,u,o,c,h,l,_,f,p;switch(e.type){case"Field":return null!==s&&r(s)?void 0===(l=s[e.name])?null:l:null;case"Subexpression":for(o=this.visit(e.children[0],s),p=1;p<e.children.length;p++)if(null===(o=this.visit(e.children[1],o)))return null;return o;case"IndexExpression":return _=this.visit(e.children[0],s),this.visit(e.children[1],_);case"Index":if(!t(s))return null;var v=e.value;return v<0&&(v=s.length+v),void 0===(o=s[v])&&(o=null),o;case"Slice":if(!t(s))return null;var d=e.children.slice(0),y=this.computeSliceParams(s.length,d),x=y[0],w=y[1],P=y[2];if(o=[],P>0)for(p=x;p<w;p+=P)o.push(s[p]);else for(p=x;p>w;p+=P)o.push(s[p]);return o;case"Projection":var M=this.visit(e.children[0],s);if(!t(M))return null;for(f=[],p=0;p<M.length;p++)null!==(u=this.visit(e.children[1],M[p]))&&f.push(u);return f;case"ValueProjection":if(!r(M=this.visit(e.children[0],s)))return null;f=[];var I=function(e){for(var t=Object.keys(e),r=[],n=0;n<t.length;n++)r.push(e[t[n]]);return r}(M);for(p=0;p<I.length;p++)null!==(u=this.visit(e.children[1],I[p]))&&f.push(u);return f;case"FilterProjection":if(!t(M=this.visit(e.children[0],s)))return null;var L=[],R=[];for(p=0;p<M.length;p++){var q=this.visit(e.children[2],M[p]);if(!i(q))L.push(M[p])}for(var A=0,R=[];A<L.length;A++)null!==(u=this.visit(e.children[1],L[A]))&&R.push(u);return R;case"Comparator":switch(c=this.visit(e.children[0],s),h=this.visit(e.children[1],s),e.name){case S:o=n(c,h);break;case N:o=!n(c,h);break;case b:o=c>h;break;case T:o=c>=h;break;case E:o=c<h;break;case j:o=c<=h;break;default:throw new Error("Unknown comparator: "+e.name)}return o;case O:var F=this.visit(e.children[0],s);if(!t(F))return null;var H=[];for(p=0;p<F.length;p++)t(u=F[p])?H.push.apply(H,u):H.push(u);return H;case"Identity":return s;case"MultiSelectList":if(null===s)return null;for(f=[],p=0;p<e.children.length;p++)f.push(this.visit(e.children[p],s));return f;case"MultiSelectHash":if(null===s)return null;var C;for(f={},p=0;p<e.children.length;p++)f[(C=e.children[p]).name]=this.visit(C.value,s);return f;case"OrExpression":return i(L=this.visit(e.children[0],s))&&(L=this.visit(e.children[1],s)),L;case"AndExpression":return!0===i(c=this.visit(e.children[0],s))?c:this.visit(e.children[1],s);case"NotExpression":return i(c=this.visit(e.children[0],s));case"Literal":return e.value;case k:return _=this.visit(e.children[0],s),this.visit(e.children[1],_);case g:return s;case"Function":var B=[];for(p=0;p<e.children.length;p++)B.push(this.visit(e.children[p],s));return this.runtime.callFunction(e.name,B);case"ExpressionReference":var J=e.children[0];return J.jmespathType=m,J;default:throw new Error("Unknown node type: "+e.type)}},computeSliceParams:function(e,t){var r=t[0],n=t[1],i=t[2],s=[null,null,null];if(null===i)i=1;else if(0===i){var L=new Error("Invalid slice, step cannot be 0");throw L.name="RuntimeError",L}var u=i<0;return r=null===r?u?e-1:0:this.capSliceRange(e,r,i),n=null===n?u?-1:e:this.capSliceRange(e,n,i),s[0]=r,s[1]=n,s[2]=i,s},capSliceRange:function(e,t,r){return t<0?(t+=e)<0&&(t=r<0?-1:0):t>=e&&(t=r<0?e-1:e),t}},Q.prototype={callFunction:function(e,t){var r=this.functionTable[e];if(void 0===r)throw new Error("Unknown function: "+e+"()");return this._validateArgs(e,t,r._signature),r._func.call(this,t)},_validateArgs:function(e,t,r){var n,i,s,L;if(r[r.length-1].variadic){if(t.length<r.length)throw n=1===r.length?" argument":" arguments",new Error("ArgumentError: "+e+"() takes at least"+r.length+n+" but received "+t.length)}else if(t.length!==r.length)throw n=1===r.length?" argument":" arguments",new Error("ArgumentError: "+e+"() takes "+r.length+n+" but received "+t.length);for(var u=0;u<r.length;u++){L=!1,i=r[u].types,s=this._getTypeName(t[u]);for(var c=0;c<i.length;c++)if(this._typeMatches(s,i[c],t[u])){L=!0;break}if(!L){var h=i.map((function(e){return o[e]})).join(",");throw new Error("TypeError: "+e+"() expected argument "+(u+1)+" to be type "+h+" but received type "+o[s]+" instead.")}}},_typeMatches:function(e,t,r){if(1===t)return!0;if(9!==t&&8!==t&&3!==t)return e===t;if(3===t)return 3===e;if(3===e){var n;8===t?n=a:9===t&&(n=u);for(var i=0;i<r.length;i++)if(!this._typeMatches(this._getTypeName(r[i]),n,r[i]))return!1;return!0}},_getTypeName:function(e){switch(Object.prototype.toString.call(e)){case"[object String]":return u;case"[object Number]":return a;case"[object Array]":return 3;case"[object Boolean]":return 5;case"[object Null]":return 7;case"[object Object]":return e.jmespathType===m?6:4}},_functionStartsWith:function(e){return 0===e[0].lastIndexOf(e[1])},_functionEndsWith:function(e){var t=e[0],r=e[1];return-1!==t.indexOf(r,t.length-r.length)},_functionReverse:function(e){if(this._getTypeName(e[0])===u){for(var t=e[0],r="",n=t.length-1;n>=0;n--)r+=t[n];return r}var i=e[0].slice(0);return i.reverse(),i},_functionAbs:function(e){return Math.abs(e[0])},_functionCeil:function(e){return Math.ceil(e[0])},_functionAvg:function(e){for(var t=0,r=e[0],n=0;n<r.length;n++)t+=r[n];return t/r.length},_functionContains:function(e){return e[0].indexOf(e[1])>=0},_functionFloor:function(e){return Math.floor(e[0])},_functionLength:function(e){return r(e[0])?Object.keys(e[0]).length:e[0].length},_functionMap:function(e){for(var t=[],r=this._interpreter,n=e[0],i=e[1],s=0;s<i.length;s++)t.push(r.visit(n,i[s]));return t},_functionMerge:function(e){for(var t={},r=0;r<e.length;r++){var n=e[r];for(var i in n)t[i]=n[i]}return t},_functionMax:function(e){if(e[0].length>0){if(this._getTypeName(e[0][0])===a)return Math.max.apply(Math,e[0]);for(var t=e[0],r=t[0],n=1;n<t.length;n++)r.localeCompare(t[n])<0&&(r=t[n]);return r}return null},_functionMin:function(e){if(e[0].length>0){if(this._getTypeName(e[0][0])===a)return Math.min.apply(Math,e[0]);for(var t=e[0],r=t[0],n=1;n<t.length;n++)t[n].localeCompare(r)<0&&(r=t[n]);return r}return null},_functionSum:function(e){for(var t=0,r=e[0],n=0;n<r.length;n++)t+=r[n];return t},_functionType:function(e){switch(this._getTypeName(e[0])){case a:return"number";case u:return"string";case 3:return"array";case 4:return"object";case 5:return"boolean";case 6:return"expref";case 7:return"null"}},_functionKeys:function(e){return Object.keys(e[0])},_functionValues:function(e){for(var t=e[0],r=Object.keys(t),n=[],i=0;i<r.length;i++)n.push(t[r[i]]);return n},_functionJoin:function(e){var t=e[0];return e[1].join(t)},_functionToArray:function(e){return 3===this._getTypeName(e[0])?e[0]:[e[0]]},_functionToString:function(e){return this._getTypeName(e[0])===u?e[0]:JSON.stringify(e[0])},_functionToNumber:function(e){var t,r=this._getTypeName(e[0]);return r===a?e[0]:r!==u||(t=+e[0],isNaN(t))?null:t},_functionNotNull:function(e){for(var t=0;t<e.length;t++)if(7!==this._getTypeName(e[t]))return e[t];return null},_functionSort:function(e){var t=e[0].slice(0);return t.sort(),t},_functionSortBy:function(e){var t=e[0].slice(0);if(0===t.length)return t;var r=this._interpreter,n=e[1],i=this._getTypeName(r.visit(n,t[0]));if([a,u].indexOf(i)<0)throw new Error("TypeError");for(var s=this,o=[],c=0;c<t.length;c++)o.push([c,t[c]]);o.sort((function(e,t){var L=r.visit(n,e[1]),u=r.visit(n,t[1]);if(s._getTypeName(L)!==i)throw new Error("TypeError: expected "+i+", received "+s._getTypeName(L));if(s._getTypeName(u)!==i)throw new Error("TypeError: expected "+i+", received "+s._getTypeName(u));return L>u?1:L<u?-1:e[0]-t[0]}));for(var h=0;h<o.length;h++)t[h]=o[h][1];return t},_functionMaxBy:function(e){for(var t,r,n=e[1],i=e[0],s=this.createKeyFunction(n,[a,u]),o=-1/0,c=0;c<i.length;c++)(r=s(i[c]))>o&&(o=r,t=i[c]);return t},_functionMinBy:function(e){for(var t,r,n=e[1],i=e[0],s=this.createKeyFunction(n,[a,u]),o=1/0,c=0;c<i.length;c++)(r=s(i[c]))<o&&(o=r,t=i[c]);return t},createKeyFunction:function(e,t){var r=this,n=this._interpreter;return function(i){var s=n.visit(e,i);if(t.indexOf(r._getTypeName(s))<0){var L="TypeError: expected one of "+t+", received "+r._getTypeName(s);throw new Error(L)}return s}}},e.tokenize=function(e){return(new z).tokenize(e)},e.compile=function(e){return(new K).parse(e)},e.search=function(e,t){var r=new K,n=new Q,i=new V(n);n._interpreter=i;var s=r.parse(t);return i.search(s,e)},e.strictDeepEqual=n}("undefined"==typeof exports?this.jmespath={}:exports);

// =====================================================================
//  JCI JSON Comparer - App Code
// =====================================================================

// =====================================================================
//  DATA (loaded dynamically)
// =====================================================================
let DATA_LEFT = null;
let DATA_RIGHT = null;
let FILE_LEFT = '';
let FILE_RIGHT = '';

// =====================================================================
//  PERFORMANCE OPTIMIZATION GLOBALS
// =====================================================================
let NODE_MAP = new Map();          // key: side:path → childrenDiv for sync
let CACHED_STATS = null;          // precomputed stats from onDataLoaded
let filterTimer = null;           // debounce handle for filter input
let DATA_LEFT_RAW = null;
let DATA_RIGHT_RAW = null;
let reorganizeEnabled = true;
let EXCLUDED_FIELDS = new Set();

// =====================================================================
//  REORGANIZER — ported from Python comparer
// =====================================================================
const _SINGLE_REF_LISTS = {
  openingList: { refField: 'associatedUISegmentID', targetKey: 'openings' },
  bulkheadList: { refField: 'associatedUISegmentID', targetKey: 'bulkheads' },
  coilPanelList: { refField: 'associatedSegmentID', targetKey: 'coilPanels' },
};

const _MULTI_REF_LISTS = [
  'airPathList',
  'cabinetList',
  'shippingSkidList',
  'drawingViewList',
];

const _NULL_GUID = '00000000-0000-0000-0000-000000000000';

function _buildSegmentLookup(segments) {
  const lookup = {};
  for (let i = 0; i < segments.length; i++) {
    lookup[segments[i].id] = segments[i];
  }
  return lookup;
}

function _nestSingleRef(segmentLookup, items, refField, targetKey) {
  const unmatched = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const refValue = item[refField] || '';
    if (!refValue || refValue === _NULL_GUID) {
      unmatched.push(item);
      continue;
    }
    const segment = segmentLookup[refValue];
    if (segment === undefined) {
      unmatched.push(item);
      continue;
    }
    if (!segment[targetKey]) {
      segment[targetKey] = [];
    }
    segment[targetKey].push(item);
  }
  return unmatched;
}

function _makeLightweightRef(sourceList, item, refEntry) {
  return {
    sourceList: sourceList,
    itemId: item.id || '',
    sequence: refEntry.sequence || 0,
  };
}

function _buildMultiRefIndex(multiRefLists) {
  const index = {};
  for (const listName in multiRefLists) {
    if (!Object.hasOwn(multiRefLists, listName)) continue;
    const items = multiRefLists[listName];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const refs = item.segmentReferenceList;
      if (!refs || !Array.isArray(refs)) continue;
      for (let j = 0; j < refs.length; j++) {
        const refEntry = refs[j];
        const segmentId = refEntry.segmentID || '';
        if (!segmentId || segmentId === _NULL_GUID) continue;
        if (!index[segmentId]) {
          index[segmentId] = [];
        }
        index[segmentId].push(_makeLightweightRef(listName, item, refEntry));
      }
    }
  }
  return index;
}

function reorganize(data) {
  const result = JSON.parse(JSON.stringify(data));
  const resultUnit = result.unit;
  const segments = resultUnit && resultUnit.segmentList;
  if (!Array.isArray(segments) || segments.length === 0) {
    return result;
  }
  const segmentLookup = _buildSegmentLookup(segments);
  const unmatched = {};
  const consumed = new Set();

  for (const listName in _SINGLE_REF_LISTS) {
    if (!Object.hasOwn(_SINGLE_REF_LISTS, listName)) continue;
    const { refField, targetKey } = _SINGLE_REF_LISTS[listName];
    const items = resultUnit[listName];
    if (!Array.isArray(items)) continue;
    if (items.length > 0) {
      const unmatchedItems = _nestSingleRef(segmentLookup, items, refField, targetKey);
      if (unmatchedItems.length > 0) {
        unmatched[targetKey] = unmatchedItems;
      }
    }
    consumed.add(listName);
  }

  const multiRefItems = {};
  for (let i = 0; i < _MULTI_REF_LISTS.length; i++) {
    const listName = _MULTI_REF_LISTS[i];
    const items = resultUnit[listName];
    if (Array.isArray(items) && items.length > 0) {
      multiRefItems[listName] = items;
    }
  }

  if (Object.keys(multiRefItems).length > 0) {
    const refIndex = _buildMultiRefIndex(multiRefItems);
    for (const segId in refIndex) {
      if (!Object.hasOwn(refIndex, segId)) continue;
      const segment = segmentLookup[segId];
      if (segment !== undefined) {
        if (!segment.relatedReferences) {
          segment.relatedReferences = [];
        }
        segment.relatedReferences.push(...refIndex[segId]);
      }
    }
  }

  for (const listName of consumed) {
    delete resultUnit[listName];
  }

  if (Object.keys(unmatched).length > 0) {
    resultUnit._unmatched = unmatched;
  }

  return result;
}

// =====================================================================
//  FILE LOADING
// =====================================================================

function tryFetch(url) {
  return fetch(url).then(function(r) {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  });
}

function onDataLoaded() {
  DATA_LEFT_RAW = JSON.parse(JSON.stringify(DATA_LEFT));
  DATA_RIGHT_RAW = JSON.parse(JSON.stringify(DATA_RIGHT));
  if (reorganizeEnabled) {
    DATA_LEFT = reorganize(DATA_LEFT);
    DATA_RIGHT = reorganize(DATA_RIGHT);
  }
  document.getElementById('toolbar').style.display = 'flex';
  document.getElementById('splitView').style.display = 'flex';
  document.getElementById('panelLeftTitle').textContent = FILE_LEFT;
  document.getElementById('panelRightTitle').textContent = FILE_RIGHT;
  CACHED_STATS = computeStats(DATA_LEFT, DATA_RIGHT);
  refreshView();
}

// =====================================================================
//  UTILITY FUNCTIONS
// =====================================================================

function esc(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function parseExcludeInput(value) {
  var set = new Set();
  if (!value || !value.trim()) return set;
  var parts = value.split(',');
  for (var i = 0; i < parts.length; i++) {
    var name = parts[i].trim();
    if (name) set.add(name);
  }
  return set;
}

function isExcludedField(key) {
  if (!key || EXCLUDED_FIELDS.size === 0) return false;
  if (EXCLUDED_FIELDS.has(key)) return true;
  // Support glob-ish wildcard: *_ID matches SEGMENT_ID, IP_ID, etc.
  var patterns = Array.from(EXCLUDED_FIELDS);
  for (var pi = 0; pi < patterns.length; pi++) {
    var pattern = patterns[pi];
    if (pattern.indexOf('*') !== -1) {
      var re = new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/[.+^${}()|[\]\\]/g, '\\$&') + '$');
      if (re.test(key)) return true;
    }
  }
  return false;
}

function formatValue(v) {
  if (v === null || v === undefined) return '<span class="value-null">null</span>';
  if (typeof v === 'boolean') return '<span class="value-bool">' + v + '</span>';
  if (typeof v === 'string') return '<span class="value-string">"' + esc(v) + '"</span>';
  if (typeof v === 'number') return '<span class="value-number">' + v + '</span>';
  return '<span class="value-same">' + esc(JSON.stringify(v)) + '</span>';
}

// =====================================================================
//  DIFF FUNCTIONS
// =====================================================================

function getValueStatus(leftVal, rightVal) {
  if (leftVal === undefined || leftVal === null) {
    if (rightVal === undefined || rightVal === null) return 'same';
    return 'added';
  }
  if (rightVal === undefined || rightVal === null) return 'removed';
  if (typeof leftVal !== typeof rightVal) return 'changed';
  if (typeof leftVal !== 'object') {
    return leftVal !== rightVal ? 'changed' : 'same';
  }
  if (leftVal === rightVal) return 'same';
  try {
    return JSON.stringify(leftVal) === JSON.stringify(rightVal) ? 'same' : 'changed';
  } catch (e) {
    return 'changed';
  }
}

function computeStats(left, right) {
  var changed = 0, added = 0, removed = 0, same = 0;

  function walk(l, r, parentKey) {
    if (l === undefined && r === undefined) return;
    if (l === undefined || r === undefined) {
      if (isExcludedField(parentKey)) { same++; return; }
      if (l === undefined && r !== undefined) added++;
      else if (r === undefined && l !== undefined) removed++;
      return;
    }
    if (typeof l !== 'object' || l === null || typeof r !== 'object' || r === null) {
      if (isExcludedField(parentKey)) { same++; return; }
      if (JSON.stringify(l) === JSON.stringify(r)) same++;
      else changed++;
      return;
    }
    if (Array.isArray(l) && Array.isArray(r)) {
      var maxLen = Math.max(l.length, r.length);
      for (var i = 0; i < maxLen; i++) walk(l[i], r[i], parentKey);
    } else if (!Array.isArray(l) && !Array.isArray(r)) {
      var allKeys = Object.keys(l).concat(Object.keys(r));
      var keySet = {};
      for (var ki = 0; ki < allKeys.length; ki++) keySet[allKeys[ki]] = true;
      for (var key in keySet) walk(l[key], r[key], key);
    } else {
      if (isExcludedField(parentKey)) { same++; return; }
      changed++;
    }
  }

  walk(left, right, '');
  return { changed: changed, added: added, removed: removed, same: same };
}

// =====================================================================
//  FULL TREE VIEW
// =====================================================================

function resolvePath(obj, path) {
  if (!path || path === '') return obj;
  const parts = path.split('/').filter(Boolean);
  let current = obj;
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (current === null || current === undefined) return undefined;
    if (part.startsWith('[') && part.endsWith(']')) {
      const idx = parseInt(part.slice(1, -1), 10);
      current = Array.isArray(current) ? current[idx] : undefined;
    } else {
      current = current[part];
    }
  }
  return current;
}

function makeDescriptor(key, val, otherVal, side, depth, path) {
  const isBranch = val !== null && val !== undefined && typeof val === 'object';
  const hasChildren = isBranch && (
    Array.isArray(val) ? val.length > 0 : Object.keys(val).length > 0
  );
  var status = getValueStatus(val, otherVal);
  // Force 'same' for excluded fields — they still show in tree but not as diffs
  if (status !== 'same' && isExcludedField(key)) {
    status = 'same';
  }
  return {
    key: key, val: val, otherVal: otherVal, side: side,
    depth: depth, path: path, isBranch: isBranch,
    hasChildren: hasChildren,
    status: status
  };
}

function computeFilterKey(desc, filterLower) {
  if (!filterLower) return true;
  if (desc.key && desc.key.toLowerCase().includes(filterLower)) return true;
  // Compute filter match lazily from actual values
  const checkVal = (desc.val !== null && desc.val !== undefined) ? desc.val : desc.otherVal;
  if (checkVal !== null && checkVal !== undefined) {
    const str = JSON.stringify(checkVal).toLowerCase();
    if (str.includes(filterLower)) return true;
  }
  return false;
}

function lazyExpandChildren(childrenDiv, desc) {
  const side = desc.side;
  const data = resolvePath(side === 'left' ? DATA_LEFT : DATA_RIGHT, desc.path);
  const otherData = resolvePath(side === 'left' ? DATA_RIGHT : DATA_LEFT, desc.path);

  if (data === null || data === undefined || typeof data !== 'object') return;

  const filterInput = document.getElementById('filterInput');
  const filterText = filterInput ? filterInput.value.trim().toLowerCase() : '';
  const fragment = document.createDocumentFragment();

  var childDepth = desc.depth + 1;

  if (Array.isArray(data)) {
    const otherArr = Array.isArray(otherData) ? otherData : [];
    for (let i = 0; i < data.length; i++) {
      const childPath = desc.path + '/[' + i + ']';
      const childDesc = makeDescriptor('[' + i + ']', data[i], otherArr[i], side, childDepth, childPath);
      if (filterText && !computeFilterKey(childDesc, filterText)) continue;
      const el = renderNodeFromDescriptor(childDesc);
      if (el) fragment.appendChild(el);
    }
  } else {
    const otherObj = (otherData && typeof otherData === 'object' && !Array.isArray(otherData)) ? otherData : {};
    for (const key in data) {
      const childPath = desc.path + '/' + key;
      const childDesc = makeDescriptor(key, data[key], otherObj[key], side, childDepth, childPath);
      if (filterText && !computeFilterKey(childDesc, filterText)) continue;
      const el = renderNodeFromDescriptor(childDesc);
      if (el) fragment.appendChild(el);
    }
    // Add keys only in other side (shown as leaf nodes - not expandable)
    if (otherData && typeof otherData === 'object' && !Array.isArray(otherData)) {
      for (const key in otherData) {
        if (data[key] !== undefined) continue;
        const childPath = desc.path + '/' + key;
        const childDesc = makeDescriptor(key, undefined, otherData[key], side, childDepth, childPath);
        if (filterText && !computeFilterKey(childDesc, filterText)) continue;
        const el = renderNodeFromDescriptor(childDesc);
        if (el) fragment.appendChild(el);
      }
    }
  }

  childrenDiv.appendChild(fragment);
}

function renderNodeFromDescriptor(desc) {
  return renderValueNode(desc);
}

function syncOtherPanel(side, path, expanded, depth) {
  var otherSide = side === 'left' ? 'right' : 'left';
  var otherChildren = NODE_MAP.get(otherSide + ':' + path);
  if (!otherChildren) {
    // Fallback: try querySelector if NODE_MAP lookup fails
    var otherId = side === 'left' ? 'viewRight' : 'viewLeft';
    otherChildren = document.querySelector('#' + otherId + ' [data-path="' + path.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"]');
    if (!otherChildren) return;
  }
  if (!otherChildren.parentElement) return;
  var otherToggle = otherChildren.parentElement.querySelector('.toggle-icon');
  if (!otherToggle) return;
  if (expanded) {
    // Lazy-load children on the other side if not yet expanded
    if (otherChildren.children.length === 0) {
      lazyExpandChildren(otherChildren, { path: path, depth: depth || 0, side: otherSide });
    }
    otherChildren.classList.remove('hidden');
    otherToggle.textContent = '\u25BC';
  } else {
    otherChildren.classList.add('hidden');
    otherToggle.textContent = '\u25B6';
  }
}

function renderValueNode(desc) {
  var val = desc.val;
  var otherVal = desc.otherVal;

  // Node exists only on the other side (e.g. 'added' on left means val is null)
  if ((val === undefined || val === null) && otherVal !== undefined && otherVal !== null) {
    var div = document.createElement('div');
    div.className = 'tree-node';
    var row = document.createElement('div');
    row.className = 'node-row';
    row.style.paddingLeft = (desc.depth * 18 + 6) + 'px';
    row.innerHTML = '<span class="node-key">' + esc(desc.key) + '</span><span class="node-colon">:</span> '
      + (desc.side === 'left'
        ? '<span class="value-added">(added)</span>'
        : '<span class="value-removed">(removed)</span>');
    div.appendChild(row);
    return div;
  }

  if (val === undefined || val === null) return null;

  var isBranch = desc.isBranch;
  var status = desc.status;
  var hasChildren = desc.hasChildren;

  var div = document.createElement('div');
  div.className = 'tree-node';

  if (isBranch && hasChildren) {
    // Branch node — create row with toggle + empty childrenDiv (lazy)
    var row = document.createElement('div');
    row.className = 'node-row branch';
    row.style.paddingLeft = (desc.depth * 18 + 6) + 'px';

    if (status !== 'same') {
      row.classList.add('has-diff');
    }

    var toggle = document.createElement('span');
    toggle.className = 'toggle-icon';
    toggle.textContent = '\u25B6';

    var keySpan = document.createElement('span');
    keySpan.className = 'node-key';
    keySpan.textContent = desc.key || '';

    var info = document.createElement('span');
    info.className = 'node-info';
    var effectiveVal = (val !== null && val !== undefined) ? val : otherVal;
    if (Array.isArray(effectiveVal)) {
      info.textContent = '[' + effectiveVal.length + ']';
    } else if (effectiveVal && typeof effectiveVal === 'object') {
      info.textContent = '{' + Object.keys(effectiveVal).length + '}';
    }

    row.appendChild(toggle);
    row.appendChild(keySpan);
    row.appendChild(info);
    div.appendChild(row);

    // Empty childrenDiv — created now for CSS, filled on first expand
    var childrenDiv = document.createElement('div');
    childrenDiv.className = 'children hidden';
    childrenDiv.setAttribute('data-path', desc.path);
    div.appendChild(childrenDiv);

    // Register in NODE_MAP for syncOtherPanel
    NODE_MAP.set(desc.side + ':' + desc.path, childrenDiv);

    // Lazy expand/collapse
    var expanded = false;

    function toggleBranch() {
      if (expanded) {
        // Collapse: just hide children — keep DOM intact for instant re-open
        childrenDiv.classList.add('hidden');
        toggle.textContent = '\u25B6';
        expanded = false;
      } else {
        // Expand: load children lazily on first expand, then just show
        if (childrenDiv.children.length === 0) {
          lazyExpandChildren(childrenDiv, desc);
        }
        childrenDiv.classList.remove('hidden');
        toggle.textContent = '\u25BC';
        expanded = true;
      }
      syncOtherPanel(desc.side, desc.path, expanded, desc.depth);
    }

    row.onclick = function(e) {
      if (e.target.closest('.toggle-icon')) return;
      toggleBranch();
    };

    toggle.onclick = function(e) {
      e.stopPropagation();
      toggleBranch();
    };

  } else {
    // Leaf node
    var row = document.createElement('div');
    row.className = 'node-row';
    row.style.paddingLeft = (desc.depth * 18 + 6) + 'px';

    if (status !== 'same') {
      row.classList.add('has-diff');
    }

    var keyHtml = '';
    if (desc.key != null && desc.key !== '') {
      keyHtml = '<span class="node-key">' + esc(desc.key) + '</span><span class="node-colon">:</span> ';
    }

    var valHtml = '';
    if (status === 'changed') {
      if (desc.side === 'left') {
        valHtml = '<span class="value-changed-left">' + esc(JSON.stringify(val)) + '</span>';
      } else {
        valHtml = '<span class="value-changed-right">' + esc(JSON.stringify(val)) + '</span>';
      }
    } else if (status === 'added') {
      valHtml = '<span class="value-added">' + esc(JSON.stringify(val)) + '</span>';
    } else if (status === 'removed') {
      valHtml = '<span class="value-removed">' + esc(JSON.stringify(val)) + '</span>';
    } else {
      valHtml = formatValue(val);
    }

    row.innerHTML = keyHtml + valHtml;
    div.appendChild(row);
  }

  return div;
}

function renderFullTree(container, leftData, rightData, side, filterText, rootLabel) {
  container.innerHTML = '';
  const data = side === 'left' ? leftData : rightData;
  const otherData = side === 'left' ? rightData : leftData;
  const label = rootLabel || '(root)';

  // Build root descriptor lazily — only this node, no pre-walk
  const rootDesc = makeDescriptor(label, data, otherData, side, 0, '');

  const rootEl = renderNodeFromDescriptor(rootDesc);
  if (rootEl) container.appendChild(rootEl);
}

// =====================================================================
//  JMESPATH — RENDER RESULTS DIRECTLY IN THE TREE
// =====================================================================

function renderJmesPathResult(expression, filterText) {
  let leftResult, rightResult;
  try {
    leftResult = jmespath.search(DATA_LEFT, expression);
    rightResult = jmespath.search(DATA_RIGHT, expression);
  } catch (e) {
    document.getElementById('viewLeft').innerHTML = '<div class="empty-state" style="margin-top:20px;">\u26A0 Error: ' + esc(e.message) + '</div>';
    document.getElementById('viewRight').innerHTML = '';
    return;
  }

  if (reorganizeEnabled) {
    if (leftResult && typeof leftResult === 'object' && !Array.isArray(leftResult) && leftResult.unit) {
      leftResult = reorganize(leftResult);
    }
    if (rightResult && typeof rightResult === 'object' && !Array.isArray(rightResult) && rightResult.unit) {
      rightResult = reorganize(rightResult);
    }
  }

  // Compute stats on the result data
  var stats = computeStats(leftResult, rightResult);
  var resultSummary = '';
  if (leftResult === null && rightResult === null) {
    resultSummary = 'Query returned \u2205 (no match)';
  } else if (Array.isArray(leftResult) && Array.isArray(rightResult)) {
    var len = Math.max(leftResult.length, rightResult.length);
    resultSummary = len + ' item(s), ' + (stats.changed + stats.added + stats.removed) + ' difference(s), ' + stats.same + ' match(es)';
  } else {
    resultSummary = (stats.changed + stats.added + stats.removed) > 0 ? 'Different' : 'Match';
  }

  // Show expression + summary in stats bar
  document.getElementById('statsBar').innerHTML =
    '<span class="stat jmespath-active">JMESPath\u2192 ' + esc(expression) + '</span>'
    + '<span class="stat stat-total">' + resultSummary + '</span>'
    + '<span class="stat stat-changed">Changed: ' + stats.changed + '</span>'
    + '<span class="stat stat-added">Added: ' + stats.added + '</span>'
    + '<span class="stat stat-removed">Removed: ' + stats.removed + '</span>'
    + '<span class="stat stat-same">Same: ' + stats.same + '</span>';

  renderFullTree(document.getElementById('viewLeft'), leftResult, rightResult, 'left', filterText, expression);
  renderFullTree(document.getElementById('viewRight'), leftResult, rightResult, 'right', filterText, expression);
}

// =====================================================================
//  RESULT DIMENSIONS HELPER
// =====================================================================

function describeResult(v) {
  if (v === null || v === undefined) return '\u2205';
  if (typeof v === 'string') return 'string(' + v.length + ')';
  if (typeof v === 'number') return 'number';
  if (typeof v === 'boolean') return 'boolean';
  if (Array.isArray(v)) return 'array[' + v.length + ']';
  return 'object{' + Object.keys(v).length + '}';
}

// =====================================================================
//  VIEW MANAGEMENT
// =====================================================================

var currentFilter = null;
var currentMap = null;

function refreshView() {
  if (!DATA_LEFT || !DATA_RIGHT) return;

  var filterExpr = document.getElementById('filterInput').value;
  var mapExpr = document.getElementById('mapInput').value;

  // Skip re-render if nothing changed (avoids duplicate work from debounce)
  if (filterExpr === currentFilter && mapExpr === currentMap) return;
  currentFilter = filterExpr;
  currentMap = mapExpr;

  // Reset node map for new render
  NODE_MAP = new Map();

  document.getElementById('splitView').style.display = 'flex';

  if (mapExpr && mapExpr.trim()) {
    // JMESPath mode: show query result in the tree
    renderJmesPathResult(mapExpr, filterExpr);
  } else {
    // Full JSON tree mode — use cached stats (computed once in onDataLoaded)
    var stats = CACHED_STATS || computeStats(DATA_LEFT, DATA_RIGHT);
    document.getElementById('statsBar').innerHTML =
      '<span class="stat stat-total">Total differences: ' + (stats.changed + stats.added + stats.removed) + '</span>' +
      '<span class="stat stat-changed">Changed: ' + stats.changed + '</span>' +
      '<span class="stat stat-added">Added: ' + stats.added + '</span>' +
      '<span class="stat stat-removed">Removed: ' + stats.removed + '</span>' +
      '<span class="stat stat-same">Same: ' + stats.same + '</span>';

    renderFullTree(document.getElementById('viewLeft'), DATA_LEFT, DATA_RIGHT, 'left', filterExpr);
    renderFullTree(document.getElementById('viewRight'), DATA_LEFT, DATA_RIGHT, 'right', filterExpr);
  }

  // Rebuild change index for navigation
  buildChangeIndex(DATA_LEFT, DATA_RIGHT);

  // Reset breadcrumbs after re-render
  var bcL = document.getElementById('breadcrumbLeft');
  var bcR = document.getElementById('breadcrumbRight');
  if (bcL) bcL.innerHTML = '<span class="bc-root">root</span>';
  if (bcR) bcR.innerHTML = '<span class="bc-root">root</span>';
}

// =====================================================================
// =====================================================================

document.addEventListener('DOMContentLoaded', function() {
  // Helper: set data for a side and update drop zone UI
  function setSideData(side, data, filename) {
    if (side === 'left') { DATA_LEFT = data; FILE_LEFT = filename || ''; }
    else { DATA_RIGHT = data; FILE_RIGHT = filename || ''; }
    var cap = side.charAt(0).toUpperCase() + side.slice(1);
    document.getElementById('drop' + cap + 'Name').textContent = filename || '(pasted)';
    document.getElementById('drop' + cap).classList.add('loaded');
  }

  // Drop zone setup
  function setupDropZone(side) {
    var zone = document.getElementById('drop' + side.charAt(0).toUpperCase() + side.slice(1));
    var fileInput = zone.querySelector('input[type="file"]');

    // Click to select
    zone.addEventListener('click', function() { fileInput.click(); });

    // File selected via dialog
    fileInput.addEventListener('change', function() {
      var file = fileInput.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function(e) {
        try {
          setSideData(side, JSON.parse(e.target.result), file.name);
          if (DATA_LEFT && DATA_RIGHT) onDataLoaded();
        } catch(err) { /* ignore */ }
      };
      reader.readAsText(file);
    });

    // Drag & drop
    zone.addEventListener('dragover', function(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', function() { zone.classList.remove('drag-over'); });
    zone.addEventListener('drop', function(e) {
      e.preventDefault();
      zone.classList.remove('drag-over');
      var file = Array.from(e.dataTransfer.files).find(function(f) { return f.name.endsWith('.json'); });
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function(ev) {
        try {
          setSideData(side, JSON.parse(ev.target.result), file.name);
          if (DATA_LEFT && DATA_RIGHT) onDataLoaded();
        } catch(err) { /* ignore */ }
      };
      reader.readAsText(file);
    });
  }
  setupDropZone('left');
  setupDropZone('right');

  // Paste toggle — show/hide textarea for pasting JSON
  document.querySelectorAll('.paste-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var side = this.getAttribute('data-side');
      var ta = document.getElementById('paste' + side.charAt(0).toUpperCase() + side.slice(1));
      var loadBtn = document.getElementById('pasteLoad' + side.charAt(0).toUpperCase() + side.slice(1));
      var isOpen = ta.classList.toggle('open');
      loadBtn.style.display = isOpen ? 'inline-block' : 'none';
    });
  });

  // Paste load — parse pasted JSON and set data
  document.getElementById('pasteLoadLeft').addEventListener('click', function() {
    var ta = document.getElementById('pasteLeft');
    try {
      setSideData('left', JSON.parse(ta.value));
      ta.classList.remove('open'); this.style.display = 'none';
      if (DATA_RIGHT) onDataLoaded();
    } catch(e) { alert('Invalid JSON in left paste area'); }
  });
  document.getElementById('pasteLoadRight').addEventListener('click', function() {
    var ta = document.getElementById('pasteRight');
    try {
      setSideData('right', JSON.parse(ta.value));
      ta.classList.remove('open'); this.style.display = 'none';
      if (DATA_LEFT) onDataLoaded();
    } catch(e) { alert('Invalid JSON in right paste area'); }
  });

  // Toolbar — filter (debounced to avoid freeze on rapid typing)
  document.getElementById('filterInput').addEventListener('input', function() {
    clearTimeout(filterTimer);
    filterTimer = setTimeout(refreshView, 200);
  });
  document.getElementById('filterInput').addEventListener('keydown', function(e) {
    if (e.key === 'Escape') { this.value = ''; refreshView(); }
  });
  // Toolbar — JMESPath (on Enter only, not live — query can be expensive)
  document.getElementById('mapInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') refreshView();
    if (e.key === 'Escape') { this.value = ''; refreshView(); }
  });
  document.getElementById('filterBtn').addEventListener('click', refreshView);
  document.getElementById('mapBtn').addEventListener('click', refreshView);

  // Reorganize toggle — force re-render by resetting dedup guards
  document.getElementById('reorganizeToggle').addEventListener('change', function() {
    reorganizeEnabled = this.checked;
    if (!DATA_LEFT_RAW) return;
    DATA_LEFT = reorganizeEnabled
      ? reorganize(JSON.parse(JSON.stringify(DATA_LEFT_RAW)))
      : JSON.parse(JSON.stringify(DATA_LEFT_RAW));
    DATA_RIGHT = reorganizeEnabled
      ? reorganize(JSON.parse(JSON.stringify(DATA_RIGHT_RAW)))
      : JSON.parse(JSON.stringify(DATA_RIGHT_RAW));
    CACHED_STATS = computeStats(DATA_LEFT, DATA_RIGHT);
    currentFilter = null;
    currentMap = null;
    refreshView();
  });

  // Exclude fields — debounced re-render with localStorage persistence
  var EXCLUDE_STORAGE_KEY = 'jci-exclude-fields';
  var excludeTimer = null;

  function saveExcludeToStorage(value) {
    try { localStorage.setItem(EXCLUDE_STORAGE_KEY, value); } catch(e) {}
  }

  function loadExcludeFromStorage() {
    try {
      var saved = localStorage.getItem(EXCLUDE_STORAGE_KEY);
      return saved || '';
    } catch(e) { return ''; }
  }

  function applyExclude(value) {
    EXCLUDED_FIELDS = parseExcludeInput(value);
    var input = document.getElementById('excludeInput');
    input.classList.toggle('active', value.trim().length > 0);
    if (DATA_LEFT) {
      CACHED_STATS = computeStats(DATA_LEFT, DATA_RIGHT);
      currentFilter = null;
      currentMap = null;
      refreshView();
    }
  }

  // Restore saved value on load
  var savedExclude = loadExcludeFromStorage();
  if (savedExclude) {
    document.getElementById('excludeInput').value = savedExclude;
    applyExclude(savedExclude);
  }

  document.getElementById('excludeInput').addEventListener('input', function() {
    clearTimeout(excludeTimer);
    var input = this;
    excludeTimer = setTimeout(function() {
      saveExcludeToStorage(input.value);
      applyExclude(input.value);
    }, 300);
  });
  document.getElementById('excludeInput').addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      this.value = '';
      clearTimeout(excludeTimer);
      saveExcludeToStorage('');
      applyExclude('');
    }
  });

  // Scroll sync between left and right panels
  // Uses requestAnimationFrame + value check to avoid sync layout during toggles
  var scrollSyncPending = null;

  function doScrollSync() {
    if (!scrollSyncPending) return;
    var s = scrollSyncPending.source;
    var t = scrollSyncPending.target;
    scrollSyncPending = null;
    if (t.scrollTop !== s.scrollTop) t.scrollTop = s.scrollTop;
    if (t.scrollLeft !== s.scrollLeft) t.scrollLeft = s.scrollLeft;
  }

  function syncScroll(source, target) {
    return function() {
      if (!scrollSyncPending) requestAnimationFrame(doScrollSync);
      scrollSyncPending = { source: source, target: target };
    };
  }
  // The .panel divs have overflow-y: auto, that's where scrolling happens
  var panelLeft = document.querySelector('.panel-left');
  var panelRight = document.querySelector('.panel-right');
  panelLeft.addEventListener('scroll', syncScroll(panelLeft, panelRight), { passive: true });
  panelRight.addEventListener('scroll', syncScroll(panelRight, panelLeft), { passive: true });

  // Breadcrumb — shows current path hierarchy at top of each panel
  var bcTimer = null;
  function updateBreadcrumb(panel, bcId) {
    var panelRect = panel.getBoundingClientRect();
    var x = panelRect.left + panelRect.width / 2;
    var y = panelRect.top + 40; // below sticky breadcrumb bar

    // Find the actual rendered element at that point
    var el = document.elementFromPoint(x, y);

    // Walk up from that element to find the nearest .children[data-path]
    var foundPath = '';
    while (el && el !== panel && el !== document.body) {
      if (el.classList && el.classList.contains('children') && !el.classList.contains('hidden')) {
        var p = el.getAttribute('data-path');
        if (p !== null && p !== undefined) {
          foundPath = p;
          break;
        }
      }
      el = el.parentElement;
    }

    // Fallback: if we landed in the breadcrumb area, try a bit lower
    if (foundPath === '' && y < panelRect.top + panelRect.height) {
      y += 40;
      if (y < panelRect.top + panelRect.height) {
        el = document.elementFromPoint(x, y);
        while (el && el !== panel && el !== document.body) {
          if (el.classList && el.classList.contains('children') && !el.classList.contains('hidden')) {
            var p2 = el.getAttribute('data-path');
            if (p2 !== null && p2 !== undefined) { foundPath = p2; break; }
          }
          el = el.parentElement;
        }
      }
    }

    var segments = foundPath ? foundPath.split('/').filter(Boolean) : [];
    var bc = document.getElementById(bcId);
    if (!bc) return;
    var html = '<span class="bc-root">root</span>';
    for (var si = 0; si < segments.length; si++) {
      html += '<span class="bc-sep"> › </span><span class="bc-seg">' + esc(segments[si]) + '</span>';
    }
    bc.innerHTML = html;
  }

  function scheduleBreadcrumb(panel, bcId) {
    if (!bcTimer) {
      bcTimer = requestAnimationFrame(function() {
        bcTimer = null;
        updateBreadcrumb(panel, bcId);
      });
    }
  }

  panelLeft.addEventListener('scroll', function() { scheduleBreadcrumb(panelLeft, 'breadcrumbLeft'); }, { passive: true });
  panelRight.addEventListener('scroll', function() { scheduleBreadcrumb(panelRight, 'breadcrumbRight'); }, { passive: true });

  // Helper to compute depth from path string
  function pathDepth(path) {
    if (!path || path === '') return 0;
    return path.split('/').filter(Boolean).length;
  }

  // Expand All — recursively walk all branches using actual data
  function expandAll() {
    function expandRecursive(container, path, side) {
      if (container.children.length === 0) {
        lazyExpandChildren(container, { path: path, depth: pathDepth(path), side: side });
      }
      container.classList.remove('hidden');
      var parentEl = container.parentElement;
      if (parentEl) {
        var toggle = parentEl.querySelector('.toggle-icon');
        if (toggle) toggle.textContent = '\u25BC';
      }
      // Recurse into child branches
      var childContainers = container.querySelectorAll(':scope > .tree-node > .children');
      for (var ci = 0; ci < childContainers.length; ci++) {
        var childPath = childContainers[ci].getAttribute('data-path');
        if (childPath) {
          expandRecursive(childContainers[ci], childPath, side);
        }
      }
    }
    ['left:', 'right:'].forEach(function(rootKey) {
      var rootDiv = NODE_MAP.get(rootKey);
      if (!rootDiv || !rootDiv.parentElement) return;
      expandRecursive(rootDiv, '', rootKey === 'left:' ? 'left' : 'right');
    });
    // Update breadcrumb after expand
    scheduleBreadcrumb(panelLeft, 'breadcrumbLeft');
    scheduleBreadcrumb(panelRight, 'breadcrumbRight');
  }

  // Collapse All — hide child containers without destroying DOM
  function collapseAll() {
    NODE_MAP.forEach(function(cv) {
      cv.classList.add('hidden');
    });
    // Update visible toggle icons
    document.querySelectorAll('.toggle-icon').forEach(function(el) {
      el.textContent = '\u25B6';
    });
    // Reset breadcrumbs
    document.getElementById('breadcrumbLeft').innerHTML = '<span class="bc-root">root</span>';
    document.getElementById('breadcrumbRight').innerHTML = '<span class="bc-root">root</span>';
  }
  document.getElementById('expandAllBtn').addEventListener('click', expandAll);
  document.getElementById('collapseAllBtn').addEventListener('click', collapseAll);

  // Change navigation buttons
  document.getElementById('nextChangeBtn').addEventListener('click', function() { navigateToChange(1); });
  document.getElementById('prevChangeBtn').addEventListener('click', function() { navigateToChange(-1); });

  // Try URL params first
  const params = new URLSearchParams(window.location.search);
  if (params.has('left') && params.has('right')) {
    Promise.all([tryFetch(params.get('left')), tryFetch(params.get('right'))])
      .then(function(results) {
        setSideData('left', results[0], params.get('left'));
        setSideData('right', results[1], params.get('right'));
        onDataLoaded();
      })
      .catch(function() {
        // URL params failed — user picks files manually
      });
  }
});

// =====================================================================
//  CHANGE NAVIGATION
// =====================================================================

let CHANGE_INDEX = [];
let currentChangeIdx = -1;

function buildChangeIndex(leftData, rightData) {
  CHANGE_INDEX = [];
  currentChangeIdx = -1;
  if (!leftData || !rightData) return;

  function walk(l, r, path, parentKey) {
    if (l === undefined && r === undefined) return;
    if (l === undefined || r === undefined) {
      if (!isExcludedField(parentKey)) {
        CHANGE_INDEX.push({ path: path, status: l === undefined ? 'added' : 'removed' });
      }
      return;
    }
    if (typeof l !== 'object' || l === null || typeof r !== 'object' || r === null) {
      if (!isExcludedField(parentKey) && JSON.stringify(l) !== JSON.stringify(r)) {
        CHANGE_INDEX.push({ path: path, status: 'changed' });
      }
      return;
    }
    if (Array.isArray(l) && Array.isArray(r)) {
      var maxLen = Math.max(l.length, r.length);
      for (var i = 0; i < maxLen; i++) walk(l[i], r[i], path + '/[' + i + ']', parentKey);
    } else if (!Array.isArray(l) && !Array.isArray(r)) {
      var allKeys = Object.keys(l).concat(Object.keys(r));
      var keySet = {};
      for (var ki = 0; ki < allKeys.length; ki++) keySet[allKeys[ki]] = true;
      for (var key in keySet) walk(l[key], r[key], path + '/' + key, key);
    } else {
      if (!isExcludedField(parentKey)) {
        CHANGE_INDEX.push({ path: path, status: 'changed' });
      }
    }
  }

  walk(leftData, rightData, '', '');
  updateChangeCounter();
}

function expandPathToNode(side, path) {
  // First, ensure the root is expanded — otherwise no child nodes exist in DOM
  var rootChildren = NODE_MAP.get(side + ':');
  if (rootChildren && rootChildren.classList.contains('hidden')) {
    var rootToggle = rootChildren.parentElement && rootChildren.parentElement.querySelector('.toggle-icon');
    if (rootToggle) rootToggle.click();
  }
  if (!path) return;

  // NODE_MAP keys use paths WITH leading slash: /unit, /unit/segmentList, etc.
  var parts = path.split('/').filter(Boolean);
  var accumulated = '';
  for (var i = 0; i < parts.length; i++) {
    accumulated = accumulated + '/' + parts[i];
    var childrenDiv = NODE_MAP.get(side + ':' + accumulated);
    if (!childrenDiv) break;
    if (childrenDiv.classList.contains('hidden')) {
      var toggle = childrenDiv.parentElement && childrenDiv.parentElement.querySelector('.toggle-icon');
      if (toggle) toggle.click();
    }
  }
}

function findNodeElement(side, path) {
  var parts = path.split('/').filter(Boolean);
  if (parts.length === 0) return null;
  var keyName = parts[parts.length - 1];
  var parentSegments = parts.slice(0, -1);
  var parentPath = parentSegments.length > 0 ? '/' + parentSegments.join('/') : '';

  var container;
  if (parentPath) {
    var parentChildren = NODE_MAP.get(side + ':' + parentPath);
    if (!parentChildren) return null;
    container = parentChildren;
  } else {
    container = side === 'left' ? document.getElementById('viewLeft') : document.getElementById('viewRight');
  }
  if (!container) return null;

  var children = container.children;
  for (var ci = 0; ci < children.length; ci++) {
    var tn = children[ci];
    if (!tn.classList || !tn.classList.contains('tree-node')) continue;
    var ks = tn.querySelector('.node-key');
    if (ks && ks.textContent === keyName) {
      return tn.querySelector('.node-row') || tn;
    }
  }
  return null;
}

function scrollToChange(side, path) {
  var el = findNodeElement(side, path);
  if (!el) return false;

  // Remove previous highlight from both sides
  document.querySelectorAll('.change-highlight').forEach(function(h) { h.classList.remove('change-highlight'); });

  el.classList.add('change-highlight');
  setTimeout(function() { el.classList.remove('change-highlight'); }, 2000);

  var panel = el.closest('.panel');
  if (panel) {
    var panelRect = panel.getBoundingClientRect();
    var elRect = el.getBoundingClientRect();
    var offset = elRect.top - panelRect.top + panel.scrollTop - panelRect.height / 3;
    panel.scrollTop = Math.max(0, offset);
  }
  return true;
}

function navigateToChange(delta) {
  if (!CHANGE_INDEX || CHANGE_INDEX.length === 0) return;
  currentChangeIdx = (currentChangeIdx + delta + CHANGE_INDEX.length) % CHANGE_INDEX.length;
  var change = CHANGE_INDEX[currentChangeIdx];

  // Expand ancestors on both sides so the element exists in DOM
  expandPathToNode('left', change.path);
  expandPathToNode('right', change.path);

  scrollToChange('left', change.path);
  scrollToChange('right', change.path);
  updateChangeCounter();
}

function updateChangeCounter() {
  var el = document.getElementById('changeCounter');
  if (!el) return;
  if (!CHANGE_INDEX || CHANGE_INDEX.length === 0) {
    el.textContent = '0 / 0';
    return;
  }
  el.textContent = (currentChangeIdx >= 0 ? (currentChangeIdx + 1) : '-') + ' / ' + CHANGE_INDEX.length;
}

// =====================================================================
//  JCI JSON Comparer - Help Modal
// =====================================================================

function openHelp(topic) {
  var body = document.getElementById('helpModalBody');
  var title = document.getElementById('helpModalTitle');
  if (topic === 'filter') {
    title.textContent = 'Search — How to Filter the Tree';
    body.innerHTML = '<p>Type any text to <strong>hide nodes</strong> whose keys and values don\'t contain it. The tree shows only branches that have a match somewhere in their subtree.</p>'
      + '<h4>Examples</h4>'
      + '<div class="help-example"><code>weight</code><span>Show all nodes that mention "weight" (key or value)</span></div>'
      + '<div class="help-example"><code>IP</code><span>Show only IP-segment related nodes</span></div>'
      + '<div class="help-example"><code>segmentType</code><span>Show segment type fields</span></div>'
      + '<div class="help-example"><code>800</code><span>Show nodes with value 800</span></div>'
      + '<p class="help-tip">The filter updates as you type. Press <kbd>Escape</kbd> to clear.</p>';
  } else if (topic === 'skip') {
    title.textContent = 'Skip Fields — Ignore Differences in Specific Fields';
    body.innerHTML = '<p>Type field names separated by commas to <strong>exclude them from the diff</strong>. Excluded fields still appear in the tree but are marked as "same" and don\'t count toward change totals or navigation.</p>'
      + '<h4>Examples</h4>'
      + '<div class="help-example"><code>id</code><span>Ignore the <code>id</code> field everywhere</span></div>'
      + '<div class="help-example"><code>id, $type</code><span>Ignore multiple fields</span></div>'
      + '<div class="help-example"><code>*_ID</code><span>Wildcard — any field ending in <code>_ID</code></span></div>'
      + '<div class="help-example"><code>createdDate, modifiedDate</code><span>Ignore timestamp fields</span></div>'
      + '<div class="help-example"><code>id, $type, createdOn, modifiedOn, ownerId</code><span>Common volatile fields for AHU models</span></div>'
      + '<h4>Tips</h4>'
      + '<ul class="help-notes">'
      + '<li>The input updates automatically 300ms after you stop typing</li>'
      + '<li>Press <kbd>Escape</kbd> to clear and reset</li>'
      + '<li>Your skip list is <strong>saved automatically</strong> in localStorage — it persists across reloads</li>'
      + '</ul>';
  } else {
    title.textContent = 'JMESPath — Query, Filter & Map';
    body.innerHTML = '<p>JMESPath is a query language for JSON, similar to <strong>JavaScript\'s .map() + .filter()</strong>. Write an expression and it runs against both datasets, showing a preview and a diff table.</p>'
      + '<h4>Get a field from every segment (like .map())</h4>'
      + '<div class="help-example"><code>unit.segmentList[*].segmentType</code><span>All segment types as a flat array</span></div>'
      + '<div class="help-example"><code>unit.segmentList[*].weight</code><span>All weights as a flat array</span></div>'
      + '<h4>Reshape objects (like .map() returning objects)</h4>'
      + '<div class="help-example"><code>unit.segmentList[*].{id: id, type: segmentType, weight: weight}</code><span>New objects with only id, type, weight</span></div>'
      + '<div class="help-example"><code>unit.segmentList[*].{segId: segmentIP_ID, x: geometry.x, y: geometry.y}</code><span>Coordinates + ID from nested objects</span></div>'
      + '<div class="help-example"><code>unit.segmentList[*].[segmentType, weight]</code><span>Array of pairs like [["IP",858], ...]</span></div>'
      + '<h4>Filter items (like .filter())</h4>'
      + '<div class="help-example"><code>unit.segmentList[?weight &gt; `800`]</code><span>Segments with weight over 800</span></div>'
      + '<div class="help-example"><code>unit.segmentList[?segmentType == `IP`]</code><span>Only IP-type segments</span></div>'
      + '<h4>Filter + reshape together</h4>'
      + '<div class="help-example"><code>unit.segmentList[?weight &gt; `800`].{type: segmentType, weight: weight}</code><span>Filter then map in one expression</span></div>'
      + '<h4>Other useful examples</h4>'
      + '<div class="help-example"><code>unit.segmentList[*].segmentType | sort(@)</code><span>Sorted unique types</span></div>'
      + '<div class="help-example"><code>unit.id</code><span>Simple scalar field</span></div>'
      + '<div class="help-example"><code>unit.segmentList[0]</code><span>First segment (full object)</span></div>'
      + '<h4>Syntax notes</h4>'
      + '<ul class="help-notes">'
      + '<li><code>[*]</code> means "iterate over all items in the array"</li>'
      + '<li><code>[?condition]</code> means "filter items where condition is true"</li>'
      + '<li>Use <strong>backticks</strong> for literal values: <code>`800`</code>, <code>`IP`</code>, <code>`true`</code></li>'
      + '<li>The query always starts from the <strong>root</strong> of the JSON, so paths begin with <code>unit.</code></li>'
      + '<li>Press <kbd>Enter</kbd> or click <strong>Query</strong> to execute</li>'
      + '</ul>';
  }
  document.getElementById('helpOverlay').classList.add('open');
}
function closeHelp() {
  document.getElementById('helpOverlay').classList.remove('open');
}
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeHelp();

  // Change navigation: N/P keys (not when typing in inputs)
  if (e.key === 'n' || e.key === 'N') {
    var tag = e.target && e.target.tagName;
    if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
      e.preventDefault();
      navigateToChange(1);
    }
  }
  if (e.key === 'p' || e.key === 'P') {
    var tag = e.target && e.target.tagName;
    if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
      e.preventDefault();
      navigateToChange(-1);
    }
  }
});