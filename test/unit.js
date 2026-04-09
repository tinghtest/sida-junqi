// 四国大战 v4 单元测试
// 测试核心逻辑

console.log("=== 四国大战 v4 单元测试 ===\n");

let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
    try {
        fn();
        console.log("✅ " + name);
        testsPassed++;
    } catch(e) {
        console.log("❌ " + name + ": " + e.message);
        testsFailed++;
    }
}

function assert(condition, message) {
    if (!condition) throw new Error(message || "Assertion failed");
}

// === 模拟游戏常量 ===
const U = 34;
const W = 720, H = 720;
const CX = W/2, CY = H/2;

// === 1. 坐标系统测试 ===
console.log("\n--- 坐标系统 ---");

function pos(g, row, col) {
    const x = (col - 2) * U;
    const y = (0.8 + row) * U;
    const rot = (r, c) => {
        if(g===0) return [CX+r, CY+c];
        if(g===1) return [CX-c, CY+r];
        if(g===2) return [CX-r, CY-c];
        return [CX+c, CY-r];
    };
    return rot(x, y);
}

test("南zone在画布内", () => {
    const [x,y] = pos(0, 0, 0);
    assert(x >= 0 && x <= W && y >= 0 && y <= W, `坐标(${x},${y})超出`);
});

test("北zone在画布内", () => {
    const [x,y] = pos(2, 0, 0);
    assert(x >= 0 && x <= W && y >= 0 && y <= W, `坐标(${x},${y})超出`);
});

test("东zone在画布内", () => {
    const [x,y] = pos(1, 0, 0);
    assert(x >= 0 && x <= W && y >= 0 && y <= W, `坐标(${x},${y})超出`);
});

test("西zone在画布内", () => {
    const [x,y] = pos(3, 0, 0);
    assert(x >= 0 && x <= W && y >= 0 && y <= W, `坐标(${x},${y})超出`);
});

// === 2. 吃子规则测试 ===
console.log("\n--- 吃子规则 ---");

function resolve(spRank, tpRank) {
    if(spRank===0 || tpRank===0) return 'draw'; // 炸弹
    if(tpRank===1) return spRank===2 ? 'win' : 'lose'; // 地雷
    if(tpRank===11) return 'flag'; // 军旗
    if(spRank > tpRank) return 'win';
    if(spRank < tpRank) return 'lose';
    return 'draw';
}

test("司令吃军长", () => assert(resolve(10,9) === 'win'));
test("军长吃司令", () => assert(resolve(9,10) === 'lose'));
test("同级互吃", () => assert(resolve(5,5) === 'draw'));
test("炸弹 vs 司令 = 同归", () => assert(resolve(10,0) === 'draw'));
test("炸弹 vs 炸弹 = 同归", () => assert(resolve(0,0) === 'draw'));
test("工兵排雷", () => assert(resolve(2,1) === 'win'));
test("非工兵碰雷", () => assert(resolve(3,1) === 'lose'));
test("吃军旗", () => assert(resolve(2,11) === 'flag'));

// === 3. 棋子配置测试 ===
console.log("\n--- 棋子配置 ---");

const INIT_COUNTS = [
  [10,1], [9,1], [8,2], [7,2], [6,2], [5,2],
  [4,3], [3,3], [2,3], [0,2], [1,3], [11,1]
];

test("每人25子", () => {
    let total = 0;
    for(const [r,c] of INIT_COUNTS) total += c;
    assert(total === 25, "总数="+total);
});

test("司令唯一", () => assert(INIT_COUNTS[0][0]===10 && INIT_COUNTS[0][1]===1));
test("军旗唯一", () => assert(INIT_COUNTS[11][0]===11 && INIT_COUNTS[11][1]===1));

// === 4. 邻接表构建测试 ===
console.log("\n--- 邻接表 ---");

// 简化的邻接测试
const adj = {};

function link(a, b) {
    if(!adj[a]) adj[a] = [];
    if(!adj[b]) adj[b] = [];
    if(!adj[a].includes(b)) adj[a].push(b);
    if(!adj[b].includes(a)) adj[b].push(a);
}

// 每个zone 5x5格子，编号 g*100+r*10+c
// 南(0): 内部连接
for(let r=0; r<5; r++) {
    for(let c=0; c<5; c++) {
        const id = 0*100 + r*10 + c;
        if(c < 4) link(id, id+1);
        if(r < 4) link(id, id+10);
    }
}

test("zone内部水平连接", () => assert(adj[0].includes(1)));
test("zone内部垂直连接", () => assert(adj[0].includes(10)));

// 铁路列
for(let r=0; r<4; r++) {
    link(0*100+r*10+0, 0*100+(r+1)*10+0);
}

test("铁路列垂直连接", () => assert(adj[0*100+0*10+0].includes(0*100+1*10+0)));

// === 5. 铁路判定测试 ===
console.log("\n--- 铁路判定 ---");

const RAIL_COLS = [0, 4];
const RAIL_ROWS = [0, 4];

function isRailAdj(id1, id2) {
    const g1 = Math.floor(id1/100), r1 = Math.floor((id1%100)/10), c1 = id1%10;
    const g2 = Math.floor(id2/100), r2 = Math.floor((id2%100)/10), c2 = id2%10;
    if(g1 !== g2) return false;
    if(c1 === c2 && RAIL_COLS.includes(c1)) return true;
    if(r1 === r2 && RAIL_ROWS.includes(r1)) return true;
    return false;
}

test("外列是铁路", () => assert(isRailAdj(0, 10))); // col 0
test("外行是铁路", () => assert(isRailAdj(0, 1)));  // row 0
test("内列非铁路", () => {
    // 使用 row 1 (非铁路行) + col 1,2 (非铁路列)
    const id1 = 0*100 + 1*10 + 1;
    const id2 = 0*100 + 1*10 + 2;
    assert(!isRailAdj(id1, id2));
});

// === 结果汇总 ===
console.log("\n=== 测试结果 ===");
console.log("通过: " + testsPassed);
console.log("失败: " + testsFailed);
if(testsFailed === 0) {
    console.log("\n🎉 所有测试通过！");
} else {
    console.log("\n⚠️ 有测试失败，需要修复！");
    process.exit(1);
}
