import{$ as e,C as t,H as n,Q as r,T as i,V as a,nt as o,z as s}from"../chunks/CKVVjNg5.js";import"../chunks/xihTtKlq.js";import{t as c}from"../chunks/D3AP2jjQ.js";var l=[{name:`计算员工平均工资`,description:`DECLARE + SET + SELECT INTO + 简单算术`,body:`DECLARE 总工资 INT DEFAULT 0;
DECLARE 平均工资 DECIMAL(10,2) DEFAULT 0;
DECLARE 人数 INT DEFAULT 0;

SELECT SUM(工资) INTO 总工资 FROM 员工;
SELECT COUNT(*) INTO 人数 FROM 员工;
SET 平均工资 = 总工资 / 人数;
SELECT 平均工资 AS 结果;`,callArgs:[]},{name:`按职称分类涨工资`,description:`IF / ELSEIF / ELSE 分支 + 变量更新`,body:`DECLARE 职称 VARCHAR(20) DEFAULT '工程师';
DECLARE 涨幅 INT DEFAULT 0;

SET 职称 = '高级工程师';

IF 职称 = '工程师' THEN
  SET 涨幅 = 500;
ELSEIF 职称 = '高级工程师' THEN
  SET 涨幅 = 800;
ELSE
  SET 涨幅 = 300;
END IF;

SELECT 职称, 涨幅 AS 涨工资额;`,callArgs:[]},{name:`累加求 1~N 和`,description:`WHILE 循环 + 变量累加`,body:`DECLARE N INT DEFAULT 5;
DECLARE i INT DEFAULT 1;
DECLARE 总和 INT DEFAULT 0;

WHILE i <= N DO
  SET 总和 = 总和 + i;
  SET i = i + 1;
END WHILE;

SELECT N, 总和 AS 结果;`,callArgs:[]},{name:`内层过程调用`,description:`CALL 嵌套过程演示调用栈`,body:`DECLARE x INT DEFAULT 10;
DECLARE y INT DEFAULT 20;
DECLARE 结果 INT DEFAULT 0;

SET 结果 = x + y;

CALL 打印结果(结果);

SELECT 结果 AS 最终值;`,callArgs:[]}],u=[{type:`choose-next`,stepIndex:2,prompt:`DECLARE 语句的作用是什么？`,options:[`声明局部变量`,`给变量赋值`,`调用存储过程`,`定义游标`],correctAnswer:`声明局部变量`,hint:`DECLARE 在存储过程体内声明局部变量并可选指定默认值。`,explanation:`DECLARE 用于在存储过程体内声明局部变量，必须放在过程体的开头（任何其他语句之前）。`},{type:`choose-next`,stepIndex:5,prompt:`WHILE 循环在什么条件下继续执行？`,options:[`条件为 TRUE`,`条件为 FALSE`,`循环次数固定`,`直到 BREAK`],correctAnswer:`条件为 TRUE`,hint:`WHILE 先判断条件，为真时执行循环体。`,explanation:`WHILE 循环在执行前先评估条件，只有条件为 TRUE 时才进入循环体；条件为 FALSE 时退出循环。`}],d=class{name=`存储过程`;renderType=`pseudocode`;pseudocode=[];practiceQuestions=u;demoScript=[{type:`init`,narration:`存储过程（Stored Procedure）是预编译的 SQL 语句集，带参数、变量、控制流，可重复调用。`},{type:`compare`,narration:`调用存储过程时，数据库执行过程体：先声明变量，再逐语句执行，分支和循环改变执行顺序。`},{type:`complete`,narration:`存储过程把业务逻辑封装在数据库层，减少网络往返，但调试比应用层代码复杂。`}];presets=l.map(e=>({name:e.name,description:e.description}));_steps=[];_stepId=0;steps=[];totalSteps=0;playbackPos=0;getCurrentStep(){return this.steps[Math.min(Math.floor(this.playbackPos),this.steps.length-1)]}getProgress(){return this.playbackPos}init(e){this.pseudocode=e.body.split(`
`).filter(e=>e.trim().length>0),this._build(e)}applyPreset(e){let t=l.find(t=>t.name===e);if(!t)throw Error(`未知预设：${e}`);this.init({name:t.name,params:[],body:t.body,callArgs:t.callArgs})}applyCustom(e){let t=(e.body??``).trim();if(!t)throw Error(`过程体不能为空`);this.init({name:`自定义`,params:[],body:t,callArgs:[]})}reset(){this.playbackPos=0}setProgress(e){this.playbackPos=e}_build(e){this.steps=[],this._stepId=0;let t=e.body.split(`
`).filter(e=>e.trim().length>0),n=this._parseBody(t),r={procedureName:e.name,vars:{},programCounter:0,lines:t,callStackText:e.name},i=()=>Object.values(r.vars).map(e=>`${e.name} = ${e.value}`).join(`；`),a=()=>r.callStackText;this._emit(`init`,`调用存储过程 ${e.name}(${e.callArgs.join(`, `)})。进入过程体，初始化局部变量。`,[],[],[],0);for(let e=0;e<n.length;e++){let t=n[e],a=this._executeStmt(r,t,i);this._emit(`compare`,a,[],[],[{type:`current`,indices:[e]}],e+1)}this._emit(`complete`,`存储过程 ${e.name} 执行完毕。最终变量：${i()}。调用栈：${a()}。`,[],[],[],n.length+1),this.totalSteps=this.steps.length}_parseBody(e){let t=[];for(let n of e){let e=n.trim();if(e.length===0)continue;let r=n.length-n.trimStart().length,i=e.toUpperCase();if(i.startsWith(`DECLARE`)){let n=e.match(/DECLARE\s+([^\s]+)\s+(INT|DECIMAL|VARCHAR\([^)]+\)|DATE)\s*(?:DEFAULT\s+(.+))?/i);t.push({type:`declare`,text:e,indent:r,branches:n?[[n[1],n[2],n[3]??``]]:[]})}else if(i.startsWith(`SET`)){let n=e.replace(/^SET\s+/i,``).trim();t.push({type:`set`,text:e,indent:r,branches:[[n]]})}else if(i.startsWith(`SELECT`)&&i.includes(`INTO`)){let n=e.match(/SELECT\s+(.+?)\s+INTO\s+([^\s]+)\s+FROM\s+([^\s]+)(?:\s+WHERE\s+(.+))?/i);t.push({type:`selectInto`,text:e,indent:r,branches:n?[[n[1],n[2],n[3],n[4]??``]]:[]})}else if(i.startsWith(`IF`)){let n=e.replace(/^IF\s+/i,``).replace(/\s+THEN\s*$/i,``).trim();t.push({type:`if`,text:e,indent:r,condition:n,branches:[[n]]})}else if(i.startsWith(`ELSEIF`)){let n=e.replace(/^ELSEIF\s+/i,``).replace(/\s+THEN\s*$/i,``).trim();t.push({type:`elseif`,text:e,indent:r,condition:n,branches:[[n]]})}else if(i===`ELSE`)t.push({type:`else`,text:e,indent:r,branches:[[]]});else if(i===`END IF`)t.push({type:`endif`,text:e,indent:r,branches:[[]]});else if(i.startsWith(`WHILE`)){let n=e.replace(/^WHILE\s+/i,``).replace(/\s+DO\s*$/i,``).trim();t.push({type:`while`,text:e,indent:r,condition:n,branches:[[n]]})}else if(i===`END WHILE`)t.push({type:`endwhile`,text:e,indent:r,branches:[[]]});else if(i.startsWith(`CALL`)){let n=e.match(/CALL\s+([^\s(]+)(?:\(([^)]*)\))?/i)?.[2]?.split(`,`).map(e=>e.trim())??[];t.push({type:`call`,text:e,indent:r,branches:[n]})}else if(i.startsWith(`SELECT`)){let n=e.match(/SELECT\s+(.+?)\s+AS\s+(\S+)/i);t.push({type:`select`,text:e,indent:r,branches:n?[[n[1],n[2]]]:[[e]]})}}return t}_executeStmt(e,t,n){switch(t.type){case`declare`:{let r=t.branches?.[0]??[],[i,,a]=r,o=String(a??``).trim().replace(/;+$/,``),s=o.replace(/^['"]|['"]$/g,``),c=parseFloat(s);return e.vars[i]={name:i,type:`INT`,value:!isNaN(c)&&s!==``?c:s},`DECLARE ${i} ${r[1]??`INT`}${o===``?``:` DEFAULT ${o}`}。当前变量：${n()}`}case`set`:{let r=String(t.condition??``).trim(),i=r.match(/^([^\s=]+)\s*=\s*(.+)$/);if(i){let t=i[1].trim(),n=i[2].trim(),r=this._evalExpr(e,n);e.vars[t]={name:t,type:`INT`,value:r}}return`SET ${r}。当前变量：${n()}`}case`selectInto`:{let[r,i]=t.branches?.[0]??[],a=0;return r===`工资`||r===`成绩`||r===`涨幅`?a=5e3:r===`总工资`||r===`结果`||r===`最终值`?a=100:(r===`人数`||r===`N`)&&(a=5),e.vars[i]={name:i,type:`INT`,value:a},`SELECT ${r} INTO ${i}。当前变量：${n()}`}case`if`:{let r=t.condition??``,i=this._evalCondition(e,r);return`IF ${r} THEN → 条件为 ${i?`TRUE`:`FALSE`}。${i?`执行 THEN 分支。`:`跳过 THEN 分支。`} 当前变量：${n()}`}case`elseif`:{let r=t.condition??``,i=this._evalCondition(e,r);return`ELSEIF ${r} THEN → 条件为 ${i?`TRUE`:`FALSE`}。${i?`执行 ELSEIF 分支。`:`跳过 ELSEIF 分支。`} 当前变量：${n()}`}case`else`:return`ELSE → 执行 ELSE 分支。当前变量：${n()}`;case`endif`:return`END IF → 条件分支结束。当前变量：${n()}`;case`while`:{let r=t.condition??``,i=this._evalCondition(e,r);return`WHILE ${r} DO → 条件为 ${i?`TRUE`:`FALSE`}。${i?`进入循环体。`:`退出循环。`} 当前变量：${n()}`}case`endwhile`:return`END WHILE → 循环结束。当前变量：${n()}`;case`call`:{let r=(t.branches?.[0]??[]).map(t=>String(this._evalExpr(e,t))).join(`, `);return e.callStackText+=` → ${t.text.replace(/^CALL\s+/i,``).split(`(`)[0]}`,`CALL ${t.text.replace(/^CALL\s+/i,``)}(${r})。调用栈：${e.callStackText}。当前变量：${n()}`}case`select`:return`SELECT ${(t.branches?.[0]??[]).join(` `)}。当前变量：${n()}`;default:return t.text}}_evalExpr(e,t){let n=t.trim();if(/^['"]/.test(n))return n.replace(/^['"]|['"]$/g,``);let r=parseFloat(n);if(!isNaN(r)&&/^-?\d+(\.\d+)?$/.test(n))return r;if(n.includes(`+`)||n.includes(`-`)||n.includes(`*`)||n.includes(`/`))try{let t=n.replace(/([a-zA-Z_]\w*)/g,(t,n)=>{let r=e.vars[n];return r===void 0?n:String(r.value)}),r=Function(`return ${t}`)();return typeof r==`number`?r:String(r)}catch{return n}let i=e.vars[n];return i===void 0?n:i.value}_evalCondition(e,t){let n=t.match(/^(.+?)\s*(=|!=|>|<|>=|<=)\s*(.+)$/);if(!n)return!1;let r=this._evalExpr(e,n[1].trim()),i=this._evalExpr(e,n[3].trim()),a=n[2].trim(),o=String(r),s=String(i);switch(a){case`=`:return o===s;case`!=`:return o!==s;case`>`:return Number(r)>Number(i);case`<`:return Number(r)<Number(i);case`>=`:return Number(r)>=Number(i);case`<=`:return Number(r)<=Number(i);default:return!1}}_emit(e,t,n,r,i,a=0){this.steps.push({id:this._stepId++,type:e,description:t,data:n,highlights:[...r,...i],pseudocodeLine:a})}},f=i(`<div class="page svelte-17ng6qa"><div class="section-header svelte-17ng6qa"><div class="section-label svelte-17ng6qa"><span class="section-num svelte-17ng6qa">§11</span> <span class="section-name">数据库对象</span></div> <h1 class="page-title svelte-17ng6qa">存储过程</h1> <p class="page-desc svelte-17ng6qa">存储过程（Stored Procedure）是预编译在数据库端的<b>SQL 语句集</b>，支持参数、局部变量、条件分支与循环。调用时减少网络往返，适合封装高频业务逻辑。逐步播放，观察 <span class="mono svelte-17ng6qa">DECLARE / SET / IF / WHILE / CALL</span> 的执行顺序与变量状态变化。</p></div> <div class="player-wrap svelte-17ng6qa"><!></div></div>`);function p(i,l){e(l,!0);let u={name:`计算员工平均工资`,body:`DECLARE 总工资 INT DEFAULT 0;
DECLARE 平均工资 DECIMAL(10,2) DEFAULT 0;
DECLARE 人数 INT DEFAULT 0;

SELECT SUM(工资) INTO 总工资 FROM 员工;
SELECT COUNT(*) INTO 人数 FROM 员工;
SET 平均工资 = 总工资 / 人数;
SELECT 平均工资 AS 结果;`,callArgs:[]};function p(e){let t=new d,n={name:e.name,params:[],body:e.body,callArgs:e.callArgs};return t.init(n),t}let m=n(p(u));var h=f(),g=a(s(h),2),_=s(g);c(_,{get engine(){return m},topicId:`procedures`,topicName:`存储过程`}),o(g),o(h),t(i,h),r()}export{p as component};