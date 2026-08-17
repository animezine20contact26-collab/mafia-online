// ============================================================
// 🕵️ MAFIA ONLINE — SERVER.JS
// ============================================================

const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");


const {
    createAccount,
    loginAccount,
    getAccount,
    getAccountStats,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest
} = require("./accounts");

// ============================================================
// ⚙️ إعداد السيرفر
// ============================================================

const app = express();

app.use(cors());
app.use(express.json());


app.get(
    "/admin.html",
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                "admin.html"
            )
        );

    }
);

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = 3000;

// ============================================================
// 🏠 الغرف
// ============================================================

const rooms = {};

const onlineUsers = new Map();

const fs = require("fs");
const path = require("path");

const suggestionsFile =
    path.join(
        __dirname,
        "suggestions.json"
    );

let suggestions = [];

if (
    fs.existsSync(
        suggestionsFile
    )
) {
    try {
        suggestions =
            JSON.parse(
                fs.readFileSync(
                    suggestionsFile,
                    "utf8"
                )
            );
    } catch {
        suggestions = [];
    }
}

suggestions =
    suggestions.map(
        (suggestion, index) => ({
            ...suggestion,
            id:
                suggestion.id ||
                `${suggestion.date || "suggestion"}-${index}`
        })
    );

saveSuggestions();

function saveSuggestions() {

    fs.writeFileSync(
        suggestionsFile,
        JSON.stringify(
            suggestions,
            null,
            2
        )
    );
}

// ============================================================
// ⏱️ إعدادات اللعبة
// ============================================================

const MIN_PLAYERS = 4;

const NIGHT_DURATION = 30;
const DAY_DURATION = 45;

// ============================================================
// 🆔 إنشاء رمز الغرفة
// ============================================================

function generateRoomCode() {

    let code;

    do {

        code =
            Math.floor(
                10000 +
                Math.random() * 90000
            ).toString();

    } while (rooms[code]);

    return code;
}



// ============================================================
// 🔀 خلط المصفوفة
// ============================================================

function shuffle(array) {

    const result = [...array];

    for (
        let i = result.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() * (i + 1)
            );

        [
            result[i],
            result[j]
        ] = [
            result[j],
            result[i]
        ];
    }

    return result;
}

// ============================================================
// 🎭 إنشاء الأدوار
// ============================================================

function createRoles(playerCount) {

    const roles = [];

    // ----------------------------------------
    // 4 - 6 لاعبين
    // ----------------------------------------

    if (playerCount <= 6) {

        roles.push("🕵️ مافيا");
        roles.push("👮 محقق");
        roles.push("❤️ طبيب");
        roles.push("💤 منوِّم");

    }

    // ----------------------------------------
    // 7 - 9 لاعبين
    // ----------------------------------------

    else if (playerCount <= 9) {

        roles.push("🕵️ مافيا");
        roles.push("💤 منوِّم");
        roles.push("👮 محقق");
        roles.push("❤️ طبيب");
        roles.push("⚖️ محامي");
        roles.push("🧓 شيخ");

    }

    // ----------------------------------------
    // 10 لاعبين فأكثر
    // ----------------------------------------

    else {

        roles.push("🕵️ مافيا");
        roles.push("💤 منوِّم");
        roles.push("👮 محقق");
        roles.push("❤️ طبيب");
        roles.push("⚖️ محامي");
        roles.push("🧓 شيخ");

    }

    // ----------------------------------------
    // الباقي مدنيون
    // ----------------------------------------

    while (
        roles.length <
        playerCount
    ) {

        roles.push("👤 مدني");
    }

    return shuffle(roles);
}

// ============================================================
// 👥 اللاعبين القابلين للإرسال للعميل
// ============================================================

function getPublicPlayers(room) {

    return room.players.map(
        player => ({
            id: player.id,
            name: player.name,
            alive:
                player.alive !== false,

            sheikhResult:
                room.sheikhTarget === player.id
                    ? room.sheikhResult
                    : null
        })
    );
}

// ============================================================
// 🎭 اللاعبين مع الأدوار
// يستخدم فقط في Game Over
// ============================================================

function getFinalPlayers(room) {

    return room.players.map(
        player => ({

            id: player.id,

            name: player.name,

            alive:
                player.alive !== false,

            role:
                player.role || "👤 مدني"

        })
    );
}

// ============================================================
// 👑 إيجاد الـ Host
// ============================================================

function getHost(room) {

    return room.players.find(
        player =>
            player.id === room.hostId
    );
}

// ============================================================
// 🔎 إيجاد لاعب
// ============================================================

function findPlayer(
    room,
    playerId
) {

    return room.players.find(
        player =>
            player.id === playerId
    );
}

// ============================================================
// ❤️ إرسال حدث عام إلى الغرفة
// ============================================================

function sendGameEvent(
    room,
    message,
    type = ""
) {

    io.to(room.code).emit(
        "gameEvent",
        {
            message,
            type
        }
    );
}

// ============================================================
// 📢 تحديث اللاعبين في الغرفة
// ============================================================

function broadcastPlayers(room) {

    io.to(room.code).emit(
        "playersUpdated",
        {
            players:
                getPublicPlayers(room),

            hostId:
                room.hostId
        }
    );
}

// ============================================================
// 🎮 حساب عدد المافيا
// ============================================================

function getAliveMafia(room) {

    return room.players.filter(
        player =>
            player.alive !== false &&
            player.role === "🕵️ مافيا"
    );
}

// ============================================================
// 👥 اللاعبين الأحياء
// ============================================================

function getAlivePlayers(room) {

    return room.players.filter(
        player =>
            player.alive !== false
    );
}

// ============================================================
// 🏆 فحص نهاية اللعبة
// ============================================================

function checkGameOver(room) {

    if (!room.gameStarted) {
        return false;
    }

    const alivePlayers =
        getAlivePlayers(room);

    const mafiaCount =
        alivePlayers.filter(
            player =>
                player.role === "🕵️ مافيا"
        ).length;

    const civilianCount =
        alivePlayers.length -
        mafiaCount;

    // ----------------------------------------
    // لا توجد مافيا
    // المدنيون يفوزون
    // ----------------------------------------

    if (mafiaCount === 0) {

        endGame(
            room,
            "civilians"
        );

        return true;
    }

    // ----------------------------------------
    // المافيا أصبحت مساوية أو أكثر
    // ----------------------------------------

    if (
        mafiaCount >=
        civilianCount
    ) {

        endGame(
            room,
            "mafia"
        );

        return true;
    }

    return false;
}

// ============================================================
// 🏆 نهاية اللعبة
// ============================================================

function endGame(
    room,
    winner
) {

    if (room.gameOver) {
        return;
    }

    room.gameOver = true;
    room.gameStarted = false;
    room.phase = null;

    clearRoomTimers(room);

    const players =
        getFinalPlayers(room);

    sendGameEvent(
        room,
        winner === "mafia"
            ? "🏆 فازت المافيا."
            : "🏆 فاز المدنيون.",
        "gameover"
    );

    io.to(room.code).emit(
        "gameOver",
        {
            winner,

            players
        }
    );

    console.log(
        `🏆 انتهت اللعبة: ${room.code} — ${winner}`
    );
}

// ============================================================
// ⏱️ تنظيف المؤقتات
// ============================================================

function clearRoomTimers(room) {

    if (
        room.phaseTimerInterval
    ) {

        clearInterval(
            room.phaseTimerInterval
        );

        room.phaseTimerInterval =
            null;
    }

    if (
        room.phaseTimeout
    ) {

        clearTimeout(
            room.phaseTimeout
        );

        room.phaseTimeout =
            null;
    }
}

// ============================================================
// ⏱️ تشغيل مؤقت المرحلة
// ============================================================

function startPhaseTimer(
    room,
    phase,
    seconds
) {

    clearRoomTimers(room);

    room.phase = phase;

    let remaining =
        seconds;

    io.to(room.code).emit(
        "phaseTimer",
        {
            phase,

            seconds:
                remaining
        }
    );

    room.phaseTimerInterval =
        setInterval(
            () => {

                remaining--;

                if (
                    remaining < 0
                ) {

                    remaining = 0;
                }

                io.to(room.code).emit(
                    "phaseTimer",
                    {
                        phase,

                        seconds:
                            remaining
                    }
                );

                if (
                    remaining <= 0
                ) {

                    clearInterval(
                        room.phaseTimerInterval
                    );

                    room.phaseTimerInterval =
                        null;
                }

            },
            1000
        );

    room.phaseTimeout =
        setTimeout(
            () => {

                if (
                    !rooms[room.code]
                ) {
                    return;
                }

                if (
                    room.phase !== phase
                ) {
                    return;
                }

                if (
                    phase === "night"
                ) {

                    resolveNight(
                        room.code
                    );

                }

                else if (
                    phase === "day"
                ) {

                    resolveVoting(
                        room.code
                    );

                }

            },
            seconds * 1000
        );
}

// ============================================================
// 🎮 بدء اللعبة
// ============================================================

function startGameForRoom(room) {

    if (
        room.gameStarted
    ) {

        return;
    }

    if (
        room.players.length <
        MIN_PLAYERS
    ) {

        return;
    }

    room.gameStarted = true;
    room.gameOver = false;
    room.phase = "role";

    room.round = 0;

    room.readyPlayers = new Set();

    room.votes = {};

    room.mafiaTarget = null;

    room.doctorTarget = null;

    room.detectiveChecked = new Set();

    // ----------------------------------------
    // 🎭 توزيع الأدوار
    // ----------------------------------------

    const roles =
        createRoles(
            room.players.length
        );

    room.players.forEach(
        (player, index) => {

            player.role =
                roles[index];

            player.alive = true;

        }
    );

    console.log(
        `🎮 بدأت اللعبة: ${room.code}`
    );

    sendGameEvent(
        room,
        "🎮 بدأت اللعبة.",
        "game"
    );

    // ----------------------------------------
    // إشعار بدء اللعبة
    // ----------------------------------------

    io.to(room.code).emit(
        "gameStarted",
        {
            roomCode:
                room.code,

            players:
                getPublicPlayers(room)
        }
    );

    // ----------------------------------------
    // إعطاء كل لاعب دوره
    // ----------------------------------------

    room.players.forEach(
        player => {

            io.to(player.id).emit(
                "yourRole",
                {
                    role:
                        player.role,

                    roundRoles:
                        [...roles]
                }
            );

        }
    );
}

// ============================================================
// 🚀 بدء أول ليلة بعد جاهزية الجميع
// ============================================================

function startFirstNight(room) {

    if (
        !room.gameStarted
    ) {
        return;
    }

    room.round = 1;

    startNight(room);
}

// ============================================================
// 🌙 بدء الليل
// ============================================================

function startNight(room) {

    if (
        !room.gameStarted ||
        room.gameOver
    ) {

        return;
    }

    // ----------------------------------------
    // فحص نهاية اللعبة قبل الليل
    // ----------------------------------------

    if (
        checkGameOver(room)
    ) {

        return;
    }

    room.phase = "night";

    // 🧓 إعادة قدرة الشيخ مع بداية كل ليلة

room.players.forEach(player => {

    if (
        player.role &&
        player.role.includes("شيخ")
    ) {
        player.sheikhHasChecked = false;
    }

});

    room.mafiaTarget = null;

    room.doctorTarget = null;

    room.detectiveChecked = new Set();

room.nightResolved = false;

room.mafiaTarget = null;
room.doctorTarget = null;
room.lawyerTarget = null;
room.sheikhTarget = null;
room.sheikhResult = null;
room.sheikhLastSuspect = null;
room.sleepTarget = null;


room.detectiveChecked = new Set();

    // ----------------------------------------
    // إرسال بداية الليل
    // ----------------------------------------

    io.to(room.code).emit(
        "nightStarted"
    );

    

    sendGameEvent(
        room,
        `🌙 بدأ الليل — الجولة ${room.round}.`,
        "night"
    );

    // ----------------------------------------
    // إرسال تعليمات خاصة لكل لاعب
    // ----------------------------------------

    room.players.forEach(
        player => {

            if (
                player.alive === false
            ) {

                io.to(player.id).emit(
                    "nightAction",
                    {
                        alive: false,

                        role:
                            player.role,

                        players:
                            getPublicPlayers(room)
                    }
                );

                return;
            }

            io.to(player.id).emit(
                "nightAction",
                {
                    alive: true,

                    role:
                        player.role,

                    players:
                        getPublicPlayers(room)
                }
            );

        }
    );

    startPhaseTimer(
        room,
        "night",
        NIGHT_DURATION
    );
}

// ============================================================
// 🌙 هل اكتملت أفعال الليل؟
// ============================================================

function canResolveNight(room) {

    const alive =
        getAlivePlayers(room);

    const mafia =
        alive.find(
            player =>
                player.role ===
                "🕵️ مافيا"
        );

    const doctor =
        alive.find(
            player =>
                player.role ===
                "❤️ طبيب"
        );

    // المافيا يجب أن تختار
    if (
        mafia &&
        !room.mafiaTarget
    ) {
        return false;
    }

    // الطبيب يجب أن يختار
    if (
        doctor &&
        !room.doctorTarget
    ) {
        return false;
    }

    // المحامي لا يدخل في اكتمال الليل
    return true;
}

// ============================================================
// 🌙 تنفيذ نتيجة الليل
// ============================================================

function resolveNight(roomCode) {

    const room =
        rooms[roomCode];

    if (!room) {
        return;
    }

    if (
        room.phase !== "night"
    ) {
        return;
    }

    // منع إنهاء الليل أكثر من مرة
    if (room.nightResolved) {
        return;
    }

    room.nightResolved = true;

    clearRoomTimers(room);

    // ========================================
    // 👥 اللاعبون الأحياء
    // ========================================

    const alive =
        getAlivePlayers(room);

    // ========================================
    // 🕵️ المافيا
    // ========================================

    const mafia =
        alive.find(
            player =>
                player.role ===
                "🕵️ مافيا"
        );

    // ========================================
    // ❤️ الطبيب
    // ========================================

    const doctor =
        alive.find(
            player =>
                player.role ===
                "❤️ طبيب"
        );

    // ========================================
    // ⚖️ المحامي
    // ========================================

    const lawyer =
        alive.find(
            player =>
                player.role ===
                "⚖️ محامي"
        );

        // ========================================
// 💤 المنوِّم
// ========================================

const sleeper =
    alive.find(
        player =>
            player.role ===
            "💤 منوِّم"
    );

const sleepTarget =
    sleeper &&
    room.sleepTarget
        ? findPlayer(
            room,
            room.sleepTarget
        )
        : null;

        // ========================================
// 💤 تعطيل فعل اللاعب المختار
// ========================================

const isSleeping =
    playerId =>
        sleepTarget &&
        sleepTarget.id ===
            playerId;

    // ========================================
    // 🕵️ المافيا لم تختَر
    // ========================================

    if (
        mafia &&
        !room.mafiaTarget
    ) {

        const possibleTargets =
            alive.filter(
                player =>
                    player.id !==
                    mafia.id
            );

        if (
            possibleTargets.length
        ) {

            const randomTarget =
                possibleTargets[
                    Math.floor(
                        Math.random() *
                        possibleTargets.length
                    )
                ];

            room.mafiaTarget =
                randomTarget.id;
        }
    }

    // ========================================
    // ❤️ الطبيب لم يختر
    // ========================================

    if (
        doctor &&
        !room.doctorTarget
    ) {

        room.doctorTarget =
            null;
    }

    // ========================================
    // ⚖️ المحامي لم يختر
    // ========================================

    if (
        lawyer &&
        !room.lawyerTarget
    ) {

        room.lawyerTarget =
            null;
    }

    // ========================================
    // 🎯 ضحية المافيا
    // ========================================

    const victim =
    room.mafiaTarget
        ? findPlayer(
            room,
            room.mafiaTarget
        )
        : null;

const mafiaDisabled =
    mafia &&
    isSleeping(mafia.id);

const doctorDisabled =
    doctor &&
    isSleeping(doctor.id);

    // ========================================
    // ❤️ هل الطبيب أنقذ الضحية؟
    // ========================================

    const saved =
    victim &&
    !doctorDisabled &&
    room.doctorTarget ===
    victim.id;

    let killedPlayer =
        null;

    // ========================================
    // ☠️ تنفيذ القتل
    // ========================================

    if (mafiaDisabled) {
    room.mafiaTarget = null;
}

    if (
        victim &&
        victim.alive !== false &&
        !saved
    ) {

        victim.alive =
            false;

        killedPlayer =
            victim;

            if (
    killedPlayer &&
    killedPlayer.role &&
    killedPlayer.role.includes("شيخ")
) {
    room.sheikhWasiya = null;
}

        sendGameEvent(
            room,
            `☠️ حدثت جريمة خلال الليل.`,
            "death"
        );

    }

    // ========================================
    // ❤️ الطبيب أنقذ الضحية
    // ========================================

    else if (
        victim &&
        saved
    ) {

        sendGameEvent(
            room,
            "❤️ الطبيب أنقذ ضحية الليلة.",
            "doctor"
        );

    }

    // ========================================
    // 🌙 لم تحدث جريمة
    // ========================================

    else {

        sendGameEvent(
            room,
            "🌙 مرّ الليل دون ضحية.",
            "night"
        );
    }

    // ========================================
    // 🌅 نتيجة الليل
    // ========================================

    io.to(room.code).emit(
        "nightResult",
        {
            killed:
                !!killedPlayer,

            playerName:
                killedPlayer
                    ? killedPlayer.name
                    : null
        }
    );

    // ========================================
    // تحديث اللاعبين
    // ========================================

    broadcastPlayers(room);

    // ========================================
    // فحص نهاية اللعبة
    // ========================================

    if (
        checkGameOver(room)
    ) {

        return;
    }

    // ========================================
    // ☀️ الانتقال إلى النهار
    // ========================================

    startDay(room);
}

// ============================================================
// ☀️ بدء النهار
// ============================================================

function startDay(room) {

    if (
        !room.gameStarted ||
        room.gameOver
    ) {

        return;
    }

    room.phase = "day";

    room.votes = {};

    room.voteStarted = true;

    sendGameEvent(
        room,
        "☀️ بدأ النهار.",
        "day"
    );

    // ----------------------------------------
    // إشعار اللاعبين
    // ----------------------------------------

    io.to(room.code).emit(
        "dayStarted",
        {
            players:
                getPublicPlayers(room)
        }
    );

    // ----------------------------------------
    // إعادة التصويت
    // ----------------------------------------

    io.to(room.code).emit(
        "voteUpdated",
        {
            votes: {},

            count: 0,

            total:
                getAlivePlayers(room)
                    .length
        }
    );

    // ----------------------------------------
    // تشغيل مؤقت النهار
    // ----------------------------------------

    startPhaseTimer(
        room,
        "day",
        DAY_DURATION
    );
}

// ============================================================
// 🗳️ حساب الأصوات
// ============================================================

function calculateVotes(room) {

    const counts = {};

    Object.values(
        room.votes
    ).forEach(
        targetId => {

            if (
                !targetId
            ) {
                return;
            }

            counts[targetId] =
                (
                    counts[targetId] ||
                    0
                ) + 1;

        }
    );

    return counts;
}

// ============================================================
// 🗳️ هل جميع الأحياء صوتوا؟
// ============================================================

function allAlivePlayersVoted(room) {

    const alive =
        getAlivePlayers(room);

    return alive.every(
        player =>
            !!room.votes[
                player.id
            ]
    );
}

// ============================================================
// 🗳️ تنفيذ نتيجة التصويت
// ============================================================

function resolveVoting(
    roomCode
) {

    const room =
        rooms[roomCode];

    if (!room) {
        return;
    }

    if (
        room.phase !== "day"
    ) {

        return;
    }

    clearRoomTimers(room);

    const alive =
        getAlivePlayers(room);

    const counts =
        calculateVotes(room);

    // ----------------------------------------
    // إذا لم يصوت أحد
    // ----------------------------------------

    if (
        Object.keys(counts)
            .length === 0
    ) {

        sendGameEvent(
            room,
            "🗳️ لم يصوت أحد. لم يتم إقصاء أي لاعب.",
            "vote"
        );

        startNextNight(room);

        return;
    }

    // ----------------------------------------
    // أعلى عدد أصوات
    // ----------------------------------------

    const maxVotes =
        Math.max(
            ...Object.values(counts)
        );

    const leaders =
        alive.filter(
            player =>
                counts[player.id] ===
                maxVotes
        );

    // ----------------------------------------
    // تعادل
    // ----------------------------------------

    if (
        leaders.length > 1
    ) {

        sendGameEvent(
            room,
            `⚖️ حدث تعادل بين ${leaders
                .map(player => player.name)
                .join(" و ")}.`,
            "tie"
        );

        io.to(room.code).emit(
            "voteTie",
            {
                players:
                    leaders.map(
                        player => ({
                            id:
                                player.id,

                            name:
                                player.name
                        })
                    )
            }
        );

        // ----------------------------------------
        // نبدأ ليلة جديدة
        // ----------------------------------------

        startNextNight(room);

        return;
    }

    

    // ----------------------------------------
    // اللاعب المقصى
    // ----------------------------------------

    const eliminated =
        leaders[0];

        // ========================================
// ⚖️ حماية المحامي
// ========================================

if (
    room.lawyerTarget ===
    eliminated.id
) {

    sendGameEvent(
        room,
        `⚖️ المحامي أنقذ ${eliminated.name} من الإقصاء.`,
        "lawyer"
    );

    io.to(room.code).emit(
        "lawyerSavedPlayer",
        {
            playerId:
                eliminated.id,

            playerName:
                eliminated.name
        }
    );

    // إزالة الحماية بعد استعمالها
    room.lawyerTarget =
        null;

    // اللاعب يبقى حيًا
    broadcastPlayers(room);

    // الانتقال لليلة التالية
    startNextNight(room);

    return;
}

    eliminated.alive =
        false;

        if (
    eliminated.role &&
    eliminated.role.includes("شيخ") &&
    room.sheikhWasiya
) {

    io.to(room.code).emit(
        "sheikhWasiyaResult",
        {
            playerName:
                eliminated.name,

            choice:
                room.sheikhWasiya.choice,

            targetName:
                room.sheikhWasiya.targetName
        }
    );

    room.sheikhWasiya =
    null;

}

    sendGameEvent(
        room,
        `☠️ تم إقصاء ${eliminated.name} من اللعبة.`,
        "elimination"
    );

    io.to(room.code).emit(
        "playerEliminated",
        {
            playerId:
                eliminated.id,

            playerName:
                eliminated.name
        }
    );

    broadcastPlayers(room);

    // ----------------------------------------
    // فحص الفوز
    // ----------------------------------------

    if (
        checkGameOver(room)
    ) {

        return;
    }

    // ----------------------------------------
    // ليلة جديدة
    // ----------------------------------------

    startNextNight(room);
}

// ============================================================
// 🌙 الانتقال للجولة الليلية التالية
// ============================================================

function startNextNight(room) {

    room.round++;

    room.votes = {};

    room.mafiaTarget = null;

room.doctorTarget = null;
room.lawyerTarget = null;


room.detectiveChecked =
    new Set();

room.nightResolved = false;

    setTimeout(
        () => {

            if (
                !room.gameStarted ||
                room.gameOver
            ) {

                return;
            }

            startNight(room);

        },
        1500
    );
}



// ============================================================
// 🏠 إنشاء غرفة
// ============================================================

io.on(
    "connection",
    socket => {

        console.log(
            "🔌 لاعب متصل:",
            socket.id
        );

        // ====================================================
// 💡 اقتراح لاعب
// ====================================================

socket.on(
    "sendSuggestion",
    ({
        category,
        text
    }) => {

        const username =
            socket.accountUsername;

        if (
            !username ||
            !text ||
            !String(text).trim()
        ) {

            socket.emit(
                "suggestionResult",
                {
                    success: false,
                    message:
                        "الاقتراح غير صالح."
                }
            );

            return;
        }

        suggestions.push({
    id:
        `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    username,
    category,
    text:
        String(text).trim(),
    date:
        new Date().toISOString()
});

        saveSuggestions();

        socket.emit(
            "suggestionResult",
            {
                success: true,
                message:
                    "تم إرسال اقتراحك بنجاح."
            }
        );
    }
);


// ====================================================
// 🛡️ بيانات Admin
// ====================================================

socket.on(
    "getAdminData",
    () => {

        if (
            !socket.isAdmin
        ) {
            return;
        }

        const stats =
            getAccountStats();

        socket.emit(
            "adminData",
            {
                totalAccounts:
                    stats.total,

                registeredToday:
                    stats.today,

                onlineNow:
                    onlineUsers.size,

                suggestions:
                    suggestions
            }
        );
    }
);

// ====================================================
// 💡 إدارة اقتراحات اللاعبين
// ====================================================

socket.on(
    "suggestionAction",
    ({
        suggestionId,
        action
    }) => {

        if (
            !socket.isAdmin
        ) {
            return;
        }

        const index =
            suggestions.findIndex(
                suggestion =>
                    suggestion.id ===
                    suggestionId
            );

        if (
            index === -1
        ) {
            return;
        }

        if (
            action === "delete"
        ) {

            suggestions.splice(
                index,
                1
            );

        } else if (
            action === "progress"
        ) {

            suggestions[index].status =
                "progress";

        } else if (
            action === "done"
        ) {

            suggestions[index].status =
                "done";

        } else {
            return;
        }

        saveSuggestions();

        socket.emit(
            "adminData",
            {
                totalAccounts:
                    getAccountStats().total,

                registeredToday:
                    getAccountStats().today,

                onlineNow:
                    onlineUsers.size,

                suggestions:
                    suggestions
            }
        );

    }
);

        // ====================================================
// 👤 الحسابات
// ====================================================

socket.on(
    "register",
    ({
        username,
        password
    }) => {

        const result =
            createAccount(
                username,
                password
            );

        socket.emit(
            "registerResult",
            result
        );
    }
);


socket.on(
    "login",
    ({
        username,
        password
    }) => {

        if (
            username === "Admin" &&
            password === "Hicham@1990"
        ) {

            socket.isAdmin = true;

            socket.emit(
                "loginResult",
                {
                    success: true,
                    isAdmin: true,
                    account: {
                        username:
                            "Admin"
                    }
                }
            );

            return;
        }

        const result =
            loginAccount(
                username,
                password
            );

        if (
            result.success
        ) {
            socket.accountUsername =
                result.account.username;

            if (
                !onlineUsers.has(
                    socket.accountUsername
                )
            ) {
                onlineUsers.set(
                    socket.accountUsername,
                    new Set()
                );
            }

            onlineUsers
                .get(
                    socket.accountUsername
                )
                .add(
                    socket.id
                );
        }

        socket.emit(
            "loginResult",
            result
        );
    }
);

socket.on(
    "getFriends",
    () => {

        const username =
            socket.accountUsername;

        const account =
            getAccount(
                username
            );

        if (!account) {
            return;
        }

        const friends =
            (
                account.friends ||
                []
            ).map(
                friendUsername => ({
                    username:
                        friendUsername,

                    online:
                        onlineUsers.has(
                            friendUsername
                        )
                })
            );

        socket.emit(
            "friendsData",
            {
                friends,

                requests:
                    account.friendRequests ||
                    []
            }
        );
    }
);

socket.on(
    "sendFriendRequest",
    ({
        username
    }) => {

        const result =
            sendFriendRequest(
                socket.accountUsername,
                username
            );

        socket.emit(
            "friendRequestResult",
            result
        );
    }
);

socket.on(
    "acceptFriendRequest",
    ({
        username
    }) => {

        const currentUsername =
            socket.accountUsername;

        const result =
            acceptFriendRequest(
                currentUsername,
                username
            );

        if (
            result.success
        ) {

            const currentAccount =
                getAccount(
                    currentUsername
                );

            const friendAccount =
                getAccount(
                    username
                );

            if (
                currentAccount &&
                friendAccount
            ) {

                if (
                    !Array.isArray(
                        currentAccount.friends
                    )
                ) {
                    currentAccount.friends =
                        [];
                }

                if (
                    !Array.isArray(
                        friendAccount.friends
                    )
                ) {
                    friendAccount.friends =
                        [];
                }

                if (
                    !currentAccount.friends.includes(
                        username
                    )
                ) {
                    currentAccount.friends.push(
                        username
                    );
                }

                if (
                    !friendAccount.friends.includes(
                        currentUsername
                    )
                ) {
                    friendAccount.friends.push(
                        currentUsername
                    );
                }
            }
        }

        socket.emit(
            "friendActionResult",
            result
        );

        // تحديث لائحة الصديق الآخر مباشرة
        if (
            result.success &&
            onlineUsers.has(username)
        ) {

            const friendSockets =
                onlineUsers.get(
                    username
                );

            friendSockets.forEach(
                socketId => {

                    io.to(
                        socketId
                    ).emit(
                        "friendsDataRefresh"
                    );
                }
            );
        }
    }
);

socket.on(
    "rejectFriendRequest",
    ({
        username
    }) => {

        const result =
            rejectFriendRequest(
                socket.accountUsername,
                username
            );

        socket.emit(
            "friendActionResult",
            result
        );
    }
);

// ====================================================
// 🎮 طلب اللعب
// ====================================================

socket.on(
    "sendGameRequest",
    ({
        username
    }) => {

        const senderUsername =
            socket.accountUsername;

        if (
            !senderUsername ||
            !username
        ) {
            return;
        }

        if (
            senderUsername ===
            username
        ) {
            socket.emit(
                "gameRequestResult",
                {
                    success: false,
                    message:
                        "لا يمكنك إرسال طلب لعب لنفسك."
                }
            );

            return;
        }

        if (
            !onlineUsers.has(
                username
            )
        ) {
            socket.emit(
                "gameRequestResult",
                {
                    success: false,
                    message:
                        "هذا اللاعب غير متصل حاليًا."
                }
            );

            return;
        }

        const friendSockets =
            onlineUsers.get(
                username
            );

        friendSockets.forEach(
            socketId => {

                io.to(
                    socketId
                ).emit(
                    "gameRequest",
                    {
                        username:
                            senderUsername
                    }
                );
            }
        );

        socket.emit(
            "gameRequestResult",
            {
                success: true,
                message:
                    "تم إرسال طلب اللعب."
            }
        );
    }
);

// ====================================================
// 🎮 قبول طلب اللعب
// ====================================================

socket.on(
    "acceptGameRequest",
    ({
        username
    }) => {

        const currentUsername =
            socket.accountUsername;

        if (
            !currentUsername ||
            !username
        ) {
            return;
        }

        let targetRoom = null;

        // البحث عن الغرفة التي يوجد فيها
        // اللاعب الذي أرسل طلب اللعب
        for (
            const roomCode in rooms
        ) {

            const room =
                rooms[roomCode];

            const player =
                room.players.find(
                    player =>
                        player.name ===
                        username
                );

            if (player) {
                targetRoom = room;
                break;
            }
        }

        if (!targetRoom) {

            socket.emit(
                "gameRequestResult",
                {
                    success: false,
                    message:
                        "اللاعب لم يعد داخل غرفة."
                }
            );

            return;
        }

        if (
            targetRoom.gameStarted
        ) {

            socket.emit(
                "gameRequestResult",
                {
                    success: false,
                    message:
                        "اللعبة بدأت بالفعل."
                }
            );

            return;
        }

        if (
            targetRoom.players.length >=
            15
        ) {

            socket.emit(
                "gameRequestResult",
                {
                    success: false,
                    message:
                        "الغرفة ممتلئة."
                }
            );

            return;
        }

        const alreadyJoined =
            targetRoom.players.some(
                player =>
                    player.name ===
                    currentUsername
            );

        if (
            alreadyJoined
        ) {

            socket.emit(
                "gameRequestResult",
                {
                    success: false,
                    message:
                        "أنت موجود بالفعل في هذه الغرفة."
                }
            );

            return;
        }

        const player = {
            id:
                socket.id,

            name:
                currentUsername,

            role:
                null,

            alive:
                true
        };

        targetRoom.players.push(
            player
        );

        socket.join(
            targetRoom.code
        );

        socket.emit(
            "joinedRoom",
            {
                roomCode:
                    targetRoom.code,

                hostId:
                    targetRoom.hostId,

                players:
                    getPublicPlayers(
                        targetRoom
                    )
            }
        );

        broadcastPlayers(
            targetRoom
        );

        socket.emit(
            "gameRequestResult",
            {
                success: true,
                message:
                    "تم قبول طلب اللعب."
            }
        );

        console.log(
            `🎮 ${currentUsername} انضم إلى غرفة ${targetRoom.code} عن طريق طلب لعب من ${username}`
        );
    }
);

        // ====================================================
        // 🏠 إنشاء غرفة
        // ====================================================

        socket.on(
    "createRoom",
    ({
        playerName,
        roomType
    }) => {

                playerName =
                    String(
                        playerName || ""
                    ).trim();

                if (
                    !playerName
                ) {

                    socket.emit(
                        "joinError",
                        "اسم اللاعب غير صالح."
                    );

                    return;
                }

                const roomCode =
                    generateRoomCode();

                const player = {

                    id:
                        socket.id,

                    name:
                        playerName,

                    role:
                        null,

                    alive:
                        true
                };

                rooms[roomCode] = {

                    code:
                        roomCode,

                    hostId:
                        socket.id,

                        roomType:
    roomType === "friends"
        ? "friends"
        : roomType === "ready"
            ? "ready"
            : "public",

ownerUsername:
    socket.accountUsername || null,

                    players:
                        [player],

                    gameStarted:
                        false,

                    gameOver:
                        false,

                    phase:
                        null,

                    round:
                        0,

                    readyPlayers:
                        new Set(),

                    votes:
                        {},

                    mafiaTarget:
                        null,

                    doctorTarget:
                        null,

                        lawyerTarget: null,

sheikhTarget: null,

sleepTarget: null,

sheikhResult: null,

sheikhLastSuspect: null,

sheikhWasiya: null,

detectiveChecked: new Set(),

                    phaseTimerInterval:
                        null,

                    phaseTimeout:
                        null
                };

                socket.join(
                    roomCode
                );

                

                socket.emit(
                    "roomCreated",
                    {
                        roomCode,

                        hostId:
    rooms[roomCode].hostId,

    roomType:
    rooms[roomCode].roomType,

players:
    getPublicPlayers(
        rooms[roomCode]
    )
                    }
                );

                console.log(
                    `🏠 تم إنشاء الغرفة: ${roomCode}`
                );
            }
        );

        

        // ====================================================
        // 🚪 الانضمام
        // ====================================================

        socket.on(
            "joinRoom",
            ({
                playerName,
                roomCode
            }) => {

                playerName =
                    String(
                        playerName || ""
                    ).trim();

                roomCode =
                    String(
                        roomCode || ""
                    ).trim();

                if (
                    !playerName
                ) {

                    socket.emit(
                        "joinError",
                        "اكتب اسم اللاعب."
                    );

                    return;
                }

                if (
                    !roomCode
                ) {

                    socket.emit(
                        "joinError",
                        "اكتب رمز الغرفة."
                    );

                    return;
                }

                const room =
                    rooms[roomCode];

                if (!room) {

                    socket.emit(
                        "joinError",
                        "الغرفة غير موجودة."
                    );

                    return;
                }

                if (
    room.roomType ===
        "friends"
) {

    const username =
        socket.accountUsername;

    if (!username) {

        socket.emit(
            "joinError",
            "يجب تسجيل الدخول أولًا."
        );

        return;
    }

    const owner =
        getAccount(
            room.ownerUsername
        );

    if (
    username !==
        room.ownerUsername &&
    (
        !owner ||
        !Array.isArray(
            owner.friends
        ) ||
        !owner.friends.includes(
            username
        )
    )
) {

        socket.emit(
            "joinError",
            "هذه الغرفة مخصصة لأصدقاء صاحب الغرفة فقط."
        );

        return;
    }
}

                if (
                    room.gameStarted
                ) {

                    socket.emit(
                        "joinError",
                        "اللعبة بدأت بالفعل."
                    );

                    return;
                }

                if (
    room.players.length >=
    (
        room.roomType === "ready"
            ? 10
            : 15
    )
) {

                    socket.emit(
                        "joinError",
                        "الغرفة ممتلئة."
                    );

                    return;
                }

                const duplicateName =
                    room.players.some(
                        player =>
                            player.name
                                .toLowerCase() ===
                            playerName
                                .toLowerCase()
                    );

                    const isRoomOwner =
    room.ownerUsername &&
    socket.accountUsername ===
        room.ownerUsername;

                if (
    duplicateName &&
    !isRoomOwner
) {

                    socket.emit(
                        "joinError",
                        "هذا الاسم مستخدم بالفعل."
                    );

                    return;
                }

                const player = {

                    id:
                        socket.id,

                    name:
                        playerName,

                    role:
                        null,

                    alive:
                        true
                };

                room.players.push(
    player
);

if (
    isRoomOwner
) {
    room.hostId =
        socket.id;
}

socket.join(
    roomCode
);

                socket.emit(
                    "joinedRoom",
                    {
                        roomCode,

                        hostId:
                            room.hostId,

                            roomType:
    room.roomType,

                        players:
                            getPublicPlayers(
                                room
                            )
                    }
                );

                broadcastPlayers(
                    room
                );

                console.log(
                    `🚪 ${playerName} انضم إلى ${roomCode}`
                );
            }
        );

        // ====================================================
        // 🎮 بدء اللعبة
        // ====================================================

        socket.on(
            "startGame",
            roomCode => {

                const room =
                    rooms[roomCode];

                if (!room) {

                    socket.emit(
                        "joinError",
                        "الغرفة غير موجودة."
                    );

                    return;
                }

                if (
                    socket.id !==
                    room.hostId
                ) {

                    socket.emit(
                        "joinError",
                        "فقط صاحب الغرفة يستطيع بدء اللعبة."
                    );

                    return;
                }

                if (
    room.roomType === "ready"
        ? room.players.length !== 10
        : room.players.length < MIN_PLAYERS
) {

                    socket.emit(
                        "joinError",
                        room.roomType === "ready"
    ? "يجب أن يكون عدد اللاعبين 10 بالضبط."
    : `يجب أن يكون هناك ${MIN_PLAYERS} لاعبين على الأقل.`
                    );

                    return;
                }

                if (
                    room.gameStarted
                ) {

                    return;
                }

                startGameForRoom(
                    room
                );
            }
        );

        // ====================================================
        // 🙈 اللاعب أخفى دوره
        // ====================================================

        socket.on(
            "readyForGame",
            ({
                roomCode
            }) => {

                const room =
                    rooms[roomCode];

                if (!room) {
                    return;
                }

                if (
                    !room.gameStarted
                ) {
                    return;
                }

                const player =
                    findPlayer(
                        room,
                        socket.id
                    );

                if (!player) {
                    return;
                }

                room.readyPlayers.add(
                    socket.id
                );

                console.log(
                    `✅ ${player.name} أصبح جاهزًا في ${roomCode}`
                );

                // ----------------------------------------
                // هل الجميع جاهز؟
                // ----------------------------------------

                const allReady =
                    room.players.every(
                        player =>
                            room.readyPlayers.has(
                                player.id
                            )
                    );

                if (
                    allReady
                ) {

                    sendGameEvent(
                        room,
                        "🎭 جميع اللاعبين جاهزون.",
                        "game"
                    );

                    startFirstNight(
                        room
                    );
                }
            }
        );

        // ====================================================
        // 🕵️ المافيا تقتل
        // ====================================================

        socket.on(
            "mafiaKill",
            ({
                roomCode,
                targetId
            }) => {

                const room =
                    rooms[roomCode];

                if (!room) {
                    return;
                }

                if (
    room.sleepTarget ===
    socket.id
) {
    socket.emit(
        "mafiaKillConfirmed",
        {
            targetName: null
        }
    );

    return;
}

                if (
                    room.phase !==
                    "night"
                ) {

                    socket.emit(
                        "joinError",
                        "لا يمكنك تنفيذ هذا الإجراء الآن."
                    );

                    return;
                }

                const mafia =
                    findPlayer(
                        room,
                        socket.id
                    );

                if (
                    !mafia ||
                    mafia.alive === false ||
                    mafia.role !==
                        "🕵️ مافيا"
                ) {

                    return;
                }

                const target =
                    findPlayer(
                        room,
                        targetId
                    );

                if (
                    !target ||
                    target.alive === false ||
                    target.id === socket.id
                ) {

                    return;
                }

                room.mafiaTarget =
                    target.id;

                socket.emit(
                    "mafiaKillConfirmed",
                    {
                        targetName:
                            target.name
                    }
                );

                // ----------------------------------------
                // الحدث العام لا يكشف اسم الضحية
                // ----------------------------------------

                sendGameEvent(
                    room,
                    "🕵️ المافيا اتخذت قرارها.",
                    "mafia"
                );

                if (
                    canResolveNight(room)
                ) {

                    
                }
            }
        );

        // ====================================================
        // ❤️ الطبيب ينقذ
        // ====================================================

        socket.on(
            "doctorSave",
            ({
                roomCode,
                targetId
            }) => {

                const room =
                    rooms[roomCode];

                if (!room) {
                    return;
                }

                if (
    room.sleepTarget ===
    socket.id
) {
    socket.emit(
        "doctorSaveConfirmed",
        {
            targetName: null
        }
    );

    return;
}

                if (
                    room.phase !==
                    "night"
                ) {

                    return;
                }

                const doctor =
                    findPlayer(
                        room,
                        socket.id
                    );

                if (
                    !doctor ||
                    doctor.alive === false ||
                    doctor.role !==
                        "❤️ طبيب"
                ) {

                    return;
                }

                const target =
                    findPlayer(
                        room,
                        targetId
                    );

                if (
                    !target ||
                    target.alive === false
                ) {

                    return;
                }

                room.doctorTarget =
                    target.id;

                socket.emit(
                    "doctorSaveConfirmed",
                    {
                        targetName:
                            target.name
                    }
                );

                sendGameEvent(
                    room,
                    "❤️ الطبيب اتخذ قرار الإنقاذ.",
                    "doctor"
                );

                if (
                    canResolveNight(room)
                ) {

                    
                }
            }
        );

       // ====================================================
// ⚖️ المحامي يختار لاعبًا لحمايته من الإقصاء بالتصويت
// ====================================================

socket.on(
    "lawyerProtect",
    ({
        roomCode,
        targetId
    }) => {

        const room =
            rooms[roomCode];

        if (!room) {
            return;
        }

        if (
    room.sleepTarget ===
    socket.id
) {
    return;
}

        if (
            room.phase !==
            "night"
        ) {
            return;
        }

        const lawyer =
            findPlayer(
                room,
                socket.id
            );

        if (
            !lawyer ||
            lawyer.alive === false ||
            lawyer.role !==
                "⚖️ محامي"
        ) {
            return;
        }

        // اختيار واحد فقط في الليلة
        if (room.lawyerTarget) {
            return;
        }

        const target =
            findPlayer(
                room,
                targetId
            );

        if (
            !target ||
            target.alive === false ||
            target.id === socket.id
        ) {
            return;
        }

        // حفظ اللاعب الذي سيحميه المحامي
        room.lawyerTarget =
            target.id;

        socket.emit(
            "lawyerProtectConfirmed",
            {
                targetId:
                    target.id,

                targetName:
                    target.name
            }
        );

        sendGameEvent(
            room,
            "⚖️ المحامي اختار لاعبًا لحمايته.",
            "lawyer"
        );

        console.log(
            `⚖️ المحامي ${lawyer.name} يحمي ${target.name} من الإقصاء بالتصويت.`
        );
    }
);

// ========================================
// 🧓 الشيخ — التحقق من لاعب
// ========================================

socket.on(
    "sheikhCheck",
    ({
        roomCode,
        targetId
    }) => {

        const room =
            rooms[roomCode];

        if (!room) {
            return;
        }

        if (
    room.sleepTarget ===
    socket.id
) {
    return;
}

        // ----------------------------------------
        // التأكد أن اللعبة في الليل
        // ----------------------------------------

        if (
            room.phase !== "night"
        ) {
            return;
        }


        // ----------------------------------------
        // البحث عن الشيخ
        // ----------------------------------------

        const sheikh =
            room.players.find(
                player =>
                    player.id === socket.id &&
                    player.role &&
                    player.role.includes("شيخ")
            );

        if (!sheikh) {
            return;
        }


        // ----------------------------------------
        // منع الشيخ من التحقق مرتين
        // ----------------------------------------

        if (
            sheikh.sheikhHasChecked
        ) {
            return;
        }


        // ----------------------------------------
        // البحث عن اللاعب المختار
        // ----------------------------------------

        const target =
            room.players.find(
                player =>
                    player.id === targetId
            );

        if (!target) {
            return;
        }


        // ----------------------------------------
        // منع الشيخ من اختيار نفسه
        // ----------------------------------------

        if (
            target.id ===
            sheikh.id
        ) {
            return;
        }


        // ----------------------------------------
        // منع اختيار لاعب ميت
        // ----------------------------------------

        if (
            !target.alive
        ) {
            return;
        }


        // ----------------------------------------
        // هل اللاعب شرير؟
        // ----------------------------------------

        const isEvil =
            target.role &&
            (
                target.role.includes("مافيا") ||
                target.role.includes("محامي")
            );


        // ----------------------------------------
        // حفظ اختيار الشيخ
        // ----------------------------------------

        room.sheikhTarget =
            target.id;

        room.sheikhResult =
            isEvil;


        room.sheikhLastSuspect =
            target.name;

            sendGameEvent(
    room,
    "🧓 الشيخ يتحقق من أحد اللاعبين.",
    "night"
);


        // ----------------------------------------
        // منع تحقق آخر
        // ----------------------------------------

        sheikh.sheikhHasChecked =
            true;


        // ----------------------------------------
        // إرسال النتيجة للشيخ فقط
        // ----------------------------------------

        socket.emit(
            "sheikhResult",
            {
                targetId:
                    target.id,

                targetName:
                    target.name,

                isEvil:
                    isEvil
            }
        );


        console.log(
            "🧓 الشيخ تحقق من:",
            target.name,
            "→",
            isEvil
                ? "شرير"
                : "ليس شريرًا"
        );

    }
);


// =======================================
// 🧓 وصية الشيخ
// ========================================

socket.on(
    "sheikhWasiya",
    ({
        roomCode,
        choice,
        targetId,
        targetName
    }) => {

        const room =
            rooms[roomCode];

        if (!room) {
            return;
        }

        // ----------------------------------------
        // التأكد أن اللعبة في الليل
        // ----------------------------------------

        if (
            room.phase !== "night"
        ) {
            return;
        }


        // ----------------------------------------
        // البحث عن الشيخ
        // ----------------------------------------

        const sheikh =
            room.players.find(
                player =>
                    player.id === socket.id &&
                    player.role &&
                    player.role.includes("شيخ")
            );

        if (!sheikh) {
            return;
        }


        // ----------------------------------------
        // التأكد أن الشيخ قام بالتحقيق
        // ----------------------------------------

        if (
            !sheikh.sheikhHasChecked
        ) {
            return;
        }


        // ----------------------------------------
        // منع تغيير الوصية
        // ----------------------------------------

        if (
            room.sheikhWasiya
        ) {
            return;
        }


        // ----------------------------------------
        // وصية الشيخ
        // ----------------------------------------

        if (
            choice === "suspect"
        ) {

            if (
                !targetId ||
                !targetName
            ) {
                return;
            }

            room.sheikhWasiya = {
                choice:
                    "suspect",

                targetId:
                    targetId,

                targetName:
                    targetName
            };

        }

        else if (
            choice === "noSuspect"
        ) {

            room.sheikhWasiya = {
                choice:
                    "noSuspect",

                targetId:
                    null,

                targetName:
                    null
            };

        }

        else {
            return;
        }


        console.log(
            "🧓 وصية الشيخ:",
            room.sheikhWasiya
        );

    }
);

// ====================================================
// 💤 المنوِّم
// ====================================================

socket.on(
    "sleepPlayer",
    ({
        roomCode,
        targetId
    }) => {

        const room =
            rooms[roomCode];

        if (!room) {
            return;
        }

        if (
            room.phase !==
            "night"
        ) {
            return;
        }

        const sleeper =
            findPlayer(
                room,
                socket.id
            );

        if (
            !sleeper ||
            sleeper.alive === false ||
            sleeper.role !==
                "💤 منوِّم"
        ) {
            return;
        }

        if (
            room.sleepTarget
        ) {
            return;
        }

        const target =
            findPlayer(
                room,
                targetId
            );

        if (
            !target ||
            target.alive === false ||
            target.id ===
                socket.id
        ) {
            return;
        }

        room.sleepTarget =
            target.id;

        socket.emit(
            "sleepPlayerConfirmed",
            {
                targetName:
                    target.name
            }
        );

        sendGameEvent(
            room,
            "💤 المنوِّم قام باختيار لاعب.",
            "sleep"
        );
    }
);


        // ====================================================
        // 👮 المحقق
        // ====================================================

        socket.on(
            "detectiveCheck",
            ({
                roomCode,
                targetId
            }) => {

                const room =
                    rooms[roomCode];

                if (!room) {
                    return;
                }

                if (
    room.sleepTarget ===
    socket.id
) {
    return;
}

                if (
                    room.phase !==
                    "night"
                ) {

                    return;
                }

                const detective =
                    findPlayer(
                        room,
                        socket.id
                    );

                if (
                    !detective ||
                    detective.alive === false ||
                    detective.role !==
                        "👮 محقق"
                ) {

                    return;
                }

                // ----------------------------------------
                // منع التحقيق مرتين
                // ----------------------------------------

                if (
                    room.detectiveChecked.has(
                        socket.id
                    )
                ) {

                    return;
                }

                const target =
                    findPlayer(
                        room,
                        targetId
                    );

                if (
                    !target ||
                    target.alive === false ||
                    target.id === socket.id
                ) {

                    return;
                }

                room.detectiveChecked.add(
                    socket.id
                );

                const isMafia =
                    target.role ===
                    "🕵️ مافيا";

                // ----------------------------------------
                // النتيجة سرية للمحقق فقط
                // ----------------------------------------

                socket.emit(
    "detectiveResult",
    {
        playerId:
            target.id,

        playerName:
            target.name,

        role:
            target.role,

        isMafia
    }
);
                // ----------------------------------------
                // السجل العام لا يقول من تم التحقيق معه
                // ----------------------------------------

                sendGameEvent(
                    room,
                    "🔎 المحقق قام بالتحقيق.",
                    "detective"
                );

                console.log(
                    `🔎 المحقق ${detective.name} حقق مع ${target.name}`
                );
            }
        );

        

        // ====================================================
        // 🗳️ التصويت
        // ====================================================

        socket.on(
            "votePlayer",
            ({
                roomCode,
                targetId
            }) => {

                const room =
                    rooms[roomCode];

                if (!room) {
                    return;
                }

                if (
                    room.phase !==
                    "day"
                ) {

                    socket.emit(
                        "voteError",
                        "التصويت غير متاح الآن."
                    );

                    return;
                }

                const voter =
                    findPlayer(
                        room,
                        socket.id
                    );

                const target =
                    findPlayer(
                        room,
                        targetId
                    );

                if (
                    !voter ||
                    voter.alive === false
                ) {

                    socket.emit(
                        "voteError",
                        "لا يمكنك التصويت لأنك خرجت من اللعبة."
                    );

                    return;
                }

                if (
                    !target ||
                    target.alive === false
                ) {

                    socket.emit(
                        "voteError",
                        "هذا اللاعب لم يعد في اللعبة."
                    );

                    return;
                }

                if (
                    voter.id ===
                    target.id
                ) {

                    socket.emit(
                        "voteError",
                        "لا يمكنك التصويت لنفسك."
                    );

                    return;
                }

                // ----------------------------------------
                // منع التصويت مرتين
                // ----------------------------------------

                if (
                    room.votes[
                        voter.id
                    ]
                ) {

                    socket.emit(
                        "voteError",
                        "لقد صوت بالفعل."
                    );

                    return;
                }

                room.votes[
                    voter.id
                ] =
                    target.id;

                const counts =
                    calculateVotes(room);

                const count =
                    Object.keys(
                        room.votes
                    ).length;

                const total =
                    getAlivePlayers(room)
                        .length;

                // ----------------------------------------
                // إرسال تحديث الأصوات
                // ----------------------------------------

                io.to(room.code).emit(
                    "voteUpdated",
                    {
                        votes:
                            counts,

                        count,

                        total,

                        voterId:
                            voter.id,

                        targetId:
                            target.id
                    }
                );

                // ----------------------------------------
                // سجل عام
                // ----------------------------------------

                sendGameEvent(
                    room,
                    `🗳️ ${voter.name} صوّت.`,
                    "vote"
                );

                // ----------------------------------------
                // إذا صوت الجميع
                // ----------------------------------------

                if (
                    allAlivePlayersVoted(
                        room
                    )
                ) {

                    resolveVoting(
                        roomCode
                    );
                }
            }
        );

        // ====================================================
        // 👢 طرد لاعب
        // ====================================================

        socket.on(
            "kickPlayer",
            ({
                roomCode,
                targetId
            }) => {

                const room =
                    rooms[roomCode];

                if (!room) {
                    return;
                }

                if (
                    socket.id !==
                    room.hostId
                ) {

                    return;
                }

                if (
                    targetId ===
                    room.hostId
                ) {

                    return;
                }

                const target =
                    findPlayer(
                        room,
                        targetId
                    );

                if (!target) {
                    return;
                }

                // ----------------------------------------
                // إخراج اللاعب من الغرفة
                // ----------------------------------------

                room.players =
                    room.players.filter(
                        player =>
                            player.id !==
                            targetId
                    );

                const targetSocket =
                    io.sockets.sockets.get(
                        targetId
                    );

                if (
                    targetSocket
                ) {

                    targetSocket.leave(
                        roomCode
                    );

                    targetSocket.emit(
                        "playerKicked",
                        {
                            message:
                                "👢 تم طردك من الغرفة."
                        }
                    );
                }

                // ----------------------------------------
                // إذا كان الـHost لا يزال موجودًا
                // ----------------------------------------

                broadcastPlayers(
                    room
                );

                console.log(
                    `👢 تم طرد ${target.name} من ${roomCode}`
                );

                // ----------------------------------------
                // حذف الغرفة إذا أصبحت فارغة
                // ----------------------------------------

                if (
                    room.players.length === 0
                ) {

                    clearRoomTimers(
                        room
                    );

                    delete rooms[
                        roomCode
                    ];
                }
            }
        );

        // ====================================================
        // 🔄 إعادة اللعبة
        // ====================================================

        socket.on(
            "restartGame",
            roomCode => {

                const room =
                    rooms[roomCode];

                if (!room) {
                    return;
                }

                if (
                    socket.id !==
                    room.hostId
                ) {

                    socket.emit(
                        "joinError",
                        "فقط صاحب الغرفة يستطيع بدء جولة جديدة."
                    );

                    return;
                }

                clearRoomTimers(
                    room
                );

                room.gameStarted =
                    false;

                room.gameOver =
                    false;

                room.phase =
                    null;

                room.round =
                    0;

                room.readyPlayers =
                    new Set();

                room.votes =
                    {};

                room.mafiaTarget =
                    null;

                room.doctorTarget =
                    null;

                    room.lawyerTarget =
    null;

    room.sheikhTarget = null;
room.sheikhResult = null;
room.sheikhLastSuspect = null;
room.sleepTarget = null;

                room.detectiveChecked =
                    new Set();

                // ----------------------------------------
                // تصفير الأدوار والحياة
                // ----------------------------------------

                room.players.forEach(
                    player => {

                        player.role =
                            null;

                        player.alive =
                            true;

                    }
                );

                // ----------------------------------------
                // إشعار الجميع
                // ----------------------------------------

                sendGameEvent(
                    room,
                    "🔄 تم تجهيز جولة جديدة.",
                    "game"
                );

                io.to(room.code).emit(
                    "gameRestarted",
                    {
                        hostId:
                            room.hostId,

                        players:
                            getPublicPlayers(
                                room
                            )
                    }
                );

                console.log(
                    `🔄 إعادة اللعبة: ${roomCode}`
                );
            }
        );

        socket.on(
    "getReadyRooms",
    () => {

        const readyRooms =
            Object.values(rooms)
                .filter(
                    room =>
                        room.roomType ===
    "ready" &&
!room.gameStarted &&
room.players.length <
    10
                )
                .map(
                    room => ({
                        roomCode:
                            room.code,

                        hostName:
                            room.players[0]
                                ?.name || "",

                        playerCount:
                            room.players.length
                    })
                );

        socket.emit(
            "readyRoomsData",
            {
                rooms:
                    readyRooms
            }
        );
    }
);

socket.on(
    "getFriendsRooms",
    () => {

        const username =
            socket.accountUsername;

        const account =
            getAccount(
                username
            );

        if (!account) {

            socket.emit(
                "friendsRoomsData",
                {
                    rooms: []
                }
            );

            return;
        }

        const roomsList =
            Object.values(rooms)
                .filter(
                    room =>
                        room.roomType ===
                            "friends" &&
                        !room.gameStarted &&
                        room.players.length > 0 &&
                        room.players.length <
                            15 &&
                        room.ownerUsername &&
(
    room.ownerUsername ===
        username ||
    (
        account.friends ||
        []
    ).includes(
        room.ownerUsername
    )
)
                )
                .map(
                    room => ({
                        roomCode:
                            room.code,

                        hostName:
                            room.players[0]
                                ?.name || "",

                        playerCount:
                            room.players.length
                    })
                );

        socket.emit(
            "friendsRoomsData",
            {
                rooms:
                    roomsList
            }
        );
    }
);

// ====================================================
// 🚪 خروج اللاعب من غرفة الانتظار
// ====================================================

socket.on(
    "leaveRoom",
    ({
        roomCode
    }) => {

        const room =
            rooms[roomCode];

        if (!room) {
            return;
        }

        const player =
            room.players.find(
                player =>
                    player.id ===
                    socket.id
            );

        if (!player) {
            return;
        }

        room.players =
            room.players.filter(
                player =>
                    player.id !==
                    socket.id
            );

        socket.leave(
            roomCode
        );

        // إذا أصبحت الغرفة فارغة
        if (
            room.players.length === 0
        ) {

            clearRoomTimers(
                room
            );

            delete rooms[
                roomCode
            ];

            console.log(
                `🗑️ تم حذف الغرفة الفارغة: ${roomCode}`
            );

            return;
        }

        // إذا كان الخارج هو الـHost
        if (
            room.hostId ===
            socket.id
        ) {

            room.hostId =
                room.players[0].id;
        }

        broadcastPlayers(
            room
        );

        console.log(
            `🚪 ${player.name} خرج من الغرفة ${roomCode}`
        );
    }
);

        // ====================================================
        // 🔌 انقطاع اللاعب
        // ====================================================

        socket.on(
            "disconnect",
            () => {

                const username =
    socket.accountUsername;

if (
    username &&
    onlineUsers.has(username)
) {

    const sockets =
        onlineUsers.get(
            username
        );

    sockets.delete(
        socket.id
    );

    if (
        sockets.size === 0
    ) {
        onlineUsers.delete(
            username
        );
    }
}

                console.log(
                    "🔌 لاعب خرج:",
                    socket.id
                );

                

                // ----------------------------------------
                // البحث عن الغرفة
                // ----------------------------------------

                let foundRoom =
                    null;

                for (
                    const roomCode
                    in rooms
                ) {

                    const room =
                        rooms[
                            roomCode
                        ];

                    const player =
                        room.players.find(
                            player =>
                                player.id ===
                                socket.id
                        );

                    if (player) {

                        foundRoom =
                            room;

                        break;
                    }
                }

                if (!foundRoom) {
                    return;
                }

                const room =
                    foundRoom;

                const leavingPlayer =
                    findPlayer(
                        room,
                        socket.id
                    );

                // ----------------------------------------
                // أثناء انتظار الغرفة
                // ----------------------------------------

                if (
                    !room.gameStarted
                ) {

                    room.players =
                        room.players.filter(
                            player =>
                                player.id !==
                                socket.id
                        );

                    // ------------------------------------
                    // إذا كان الـHost خرج
                    // نعطي الـHost للاعب التالي
                    // ------------------------------------

                    if (
                        room.hostId ===
                        socket.id
                    ) {

                        if (
                            room.players.length
                        ) {

                            room.hostId =
                                room.players[0]
                                    .id;

                            sendGameEvent(
                                room,
                                `👑 أصبح ${room.players[0].name} صاحب الغرفة الجديد.`,
                                "host"
                            );

                        }

                        else {

                            clearRoomTimers(
                                room
                            );

                            delete rooms[
                                room.code
                            ];

                            return;
                        }
                    }

                    broadcastPlayers(
                        room
                    );

                    return;
                }

                // ----------------------------------------
// أثناء اللعبة
// حذف اللاعب نهائيًا من الغرفة
// ----------------------------------------

if (
    leavingPlayer
) {

    room.players =
        room.players.filter(
            player =>
                player.id !==
                socket.id
        );

    // إذا أصبحت الغرفة فارغة
    if (
        room.players.length === 0
    ) {

        clearRoomTimers(
            room
        );

        delete rooms[
            room.code
        ];

        console.log(
            `🗑️ تم حذف الغرفة الفارغة: ${room.code}`
        );

        return;
    }

    // إذا كان الخارج هو الـHost
    if (
        room.hostId ===
        socket.id
    ) {

        room.hostId =
            room.players[0].id;

        sendGameEvent(
            room,
            `👑 أصبح ${room.players[0].name} صاحب الغرفة الجديد.`,
            "host"
        );
    }

    broadcastPlayers(
        room
    );
}
            }
        );
    }
);



// ============================================================
// 🌐 Route اختبار
// ============================================================

app.use(
    express.static(
        path.join(__dirname, "../client")
    )
);

app.get(
    "/",
    (req, res) => {
        res.sendFile(
            path.join(
                __dirname,
                "../client/index.html"
            )
        );
    }
);

// ============================================================
// 🚀 تشغيل السيرفر
// ============================================================

server.listen(
    PORT,
    () => {

        console.log(
            "========================================"
        );

        console.log(
            "🕵️ Mafia Online Server"
        );

        console.log(
            `🚀 Server running on http://localhost:${PORT}`
        );

        console.log(
            "========================================"
        );
    }
);





