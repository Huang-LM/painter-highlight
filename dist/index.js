(function(f,n){typeof exports=="object"&&typeof module!="undefined"?module.exports=n(require("highlight.js"),require("painter-kernel")):typeof define=="function"&&define.amd?define(["highlight.js","painter-kernel"],n):(f=typeof globalThis!="undefined"?globalThis:f||self).phl=n(f.hljs,f.painter)})(this,function(f,n){"use strict";function j(o){return o&&typeof o=="object"&&"default"in o?o:{default:o}}var k=j(f);return function(o,R,s,O,v){let r=[],_={default:{color:"#55b5db"},property:{color:"#a074c4"},comment:{color:"#41535b"},literal:{color:"#ee3300ef"},doctag:{color:"#ff7b72"},built_in:{color:"#55b5db"},keyword:{color:"#e6cd69"},"template-tag":{color:"#ff7b72"},"template-variable":{color:"#9fca56"},type:{color:"#9fca56"},string:{color:"#55b5db"},attr:{color:"#ff7b72"},number:{color:"#cd3f45"},params:{color:"#55b5db"},"variable.language":{color:"#55b5db"},"variable.constant":{color:"#55b5db"},subst:{color:"Purple"},title:{color:"#d2a8ff"},"title.class":{color:"#df88df"},"title.class.inherited":{color:"#dda8ff"},"title.function":{color:"#a074c4"},deletion:{color:"#ffdcd7",backgroundColor:"#67060c"},addition:{color:"#aff5b4",backgroundColor:"#033a16"},strong:{color:"#c9d1d9",fontWeight:"bold"},emphasis:{color:"#c9d1d9",fontStyle:"italic"},sign:{color:"#eee"},attribute:{color:"#9fca56"}};const p=new Map(Object.entries(_));let c=[];const a=RegExp(/\n/g),g=RegExp(/([^\s])/g),y=RegExp(/([\s])/g),u=RegExp(/\t/g);let x=0,m=0,d=0,w=0,b=0,A=O.split(`
`).map((e,l)=>{let i;if(i=e.match(g)?.length+e.match(y)?.length+(e.match(u)?.length?e.match(u)?.length:0),b<i&&(b=i||0),e.match(y)&&e.match(g)?.length){let h=e.indexOf(e.match(g)[0]);e=e.slice(0,h)+e.slice(0,h)+e.slice(h)}return w++,e}).join(`
`),t=k.default.highlight(A,{language:v})._emitter.root.children;for(let e=0;e<t.length;e++)if(typeof t[e]=="string")if(t[e].match(a)&&t[e].match(g)){let l=t[e],i=t[e].match(a);if(t[e].match(/\)/)){let h=t[e].indexOf(")");c.push(t[e].slice(0,h)),l=t[e].slice(h)}for(;i.length;){let h=l.indexOf(i[0]);l.slice(0,h)&&c.push(l.slice(0,h)),c.push(l.slice(h,h+1)),l=l.slice(h+1),i.shift()}c.push(l)}else if(t[e].match(/\]/)){let l=t[e].indexOf("]");if(t[e].match(/\)/)){let i=t[e].indexOf(")");c.push(t[e].slice(0,l)),c.push(t[e].slice(l,i)),c.push(t[e].slice(i))}else c.push(t[e].slice(0,l)),c.push(t[e].slice(l))}else if(t[e].match(/\)/)){let l=t[e].indexOf(")");c.push(t[e].slice(0,l)),c.push(t[e].slice(l))}else c.push(t[e]);else if(t[e].kind==="comment")c.push(t[e]);else if(t[e].kind==="property"&&t[e].children[0].children)c.push(t[e].children[0].children[0]);else if(t[e].children.length>1){let l=t[e].children;for(let i of l)c.push(i)}else c.push(t[e]);let E=[];c.forEach(e=>{e!==""&&E.push(e)}),t=E;for(let e=0;e<t.length;e++){let l={id:"hl0_"+e,text:"",type:"text",css:{top:"calc(hl0_"+(e-1)+".top)",left:"calc(hl0_"+(e-1)+".right)",color:_.default.color,fontSize:"16px"}};if(typeof t[e]=="object"){let i;t[e].children.length?(l.text=t[e].children.join(""),l.css.left="calc(hl0_"+(e-1)+".right + 1px)",i=p.get(t[e].kind)):(l.text=t[e].children,l.css.left="calc(hl0_"+(e-1)+".right - 5px)",i=p.get(t[e].kind)),d&&(l.css.left="calc(hl0_"+(e-1)+".right - 5px)",d=0),t[e].children.length&&t[e].children[0].match!==null&&t[e].children[0]?.match(/\/\*\*/g)&&(m+=t[e].children[0].match(a)?.length?t[e].children[0].match(a)?.length:0),l.css.color=i?i.color:p.get("default").color}else typeof t[e]=="string"&&(l.text=t[e],t[e].match(RegExp(/[a-zA-Z]/g))?l.css.color=p.get("string").color:t[e].match(RegExp(/=/g))?l.css.color=p.get("attribute").color:l.css.color=p.get("sign").color,l.css.left="calc(hl0_"+(e-1)+".right + 2px)",d&&(l.css.left="calc(hl0_"+(e-1)+".right - 8px)",d=0),t[e].match(a)&&!t[e].match(/\`/g)?x=t[e].match(a).length:t[e]===" "?l.css.left="calc(hl0_"+(e-1)+".right - 8px)":(t[e].match(/\(/)||t[e].match(/\[/))&&(l.css.left="calc(hl0_"+(e-1)+".right + 4px)",d=1));x&&(l.css.top="calc(hl0_"+(e-1)+".top +"+20*(x+m)+" px)",l.css.left="0",t[e].match(a)&&t[e].slice(2)&&(l.css.left="calc(hl0_0.right)"),x=0,m=0),typeof t[e]=="string"&&t[e].match(u)&&(l.css.left="calc(hl0_"+e+".right + "+18*t[e].match(u).length+"px)"),r.push(l)}r[0].css.top="55px",r[1].css.left="calc(hl0_0.right + 0px)",r[0].css.left="0",r.unshift({id:"hl1_3",type:"rect",css:{top:"18px",left:"58px",height:"12px",width:"12px",color:"#1AAB29",borderRadius:"50%"}}),r.unshift({id:"hl1_1",type:"rect",css:{top:"18px",left:"38px",height:"12px",width:"12px",color:"#DEA123",borderRadius:"50%"}}),r.unshift({id:"hl1_0",type:"rect",css:{top:"18px",left:"18px",height:"12px",width:"12px",color:"#E0443E",borderRadius:"50%"}}),s.height=="auto"&&(s.height=20*w+60+"px"),s.width=="auto"&&(s.width=10.5*b+"px"),o.width=n.toPx(s.width),o.height=n.toPx(s.height),s.views=r,new n.Pen(R,s).paint()}});
