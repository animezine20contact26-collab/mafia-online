// ==================================================
// GAME.JS
// مسؤول عن منطق اللعبة
// ==================================================

const {
    ROLES,
    createRoles,
    isMafia,
    isDetective,
    isDoctor
} = require("./roles");

const {
    findPlayer,
    getAlivePlayers,
    killPlayer,
    resetVotes,
    resetReady,
    setPlayerRole
} = require("./players");

// ========================================
// الإعدادات
// ========================================

const MIN_PLAYERS = 4;

// ========================================
// أدوات داخلية
// ========================================

function ensureNightState(room) {

    if (!room) {
        return;
    }

    if (!Array.isArray(room.mafiaTargets)) {
        room.mafiaTargets = [];
    }

    if (!Array.isArray(room.mafiaVotes)) {
        room.mafiaVotes = [];
    }

    if (!room.mafiaActions) {
        room.mafiaActions = {};
    }

    if (!room.doctorActions) {
        room.doctorActions = {};
    }

    if (!room.detectiveActions) {
        room.detectiveActions = {};
    }
}

// ========================================
// تصفير حالة الليل
// ========================================

function resetNightActions(room) {

    if (!room) {
        return;
    }

    room.mafiaTargets = [];

    room.mafiaVotes = [];

    room.mafiaActions = {};

    room.doctorActions = {};

    room.detectiveActions = {};

    // التوافق مع الكود القديم
    room.mafiaTarget = null;
    room.doctorTarget = null;
    room.detectiveTarget = null;
}

// ========================================
// بداية اللعبة
// ========================================

function startGame(room) {

    if (!room) {
        return {
            success: false,
            message: "الغرفة غير موجودة."
        };
    }

    if (!Array.isArray(room.players)) {
        return {
            success: false,
            message: "قائمة اللاعبين غير صالحة."
        };
    }

    if (room.players.length < MIN_PLAYERS) {
        return {
            success: false,
            message:
                `يجب أن يكون هناك ${MIN_PLAYERS} لاعبين على الأقل.`
        };
    }

    if (room.gameStarted) {
        return {
            success: false,
            message: "اللعبة بدأت بالفعل."
        };
    }

    const roles =
        createRoles(
            room.players.length
        );

    if (
        roles.length !==
        room.players.length
    ) {
        return {
            success: false,
            message: "تعذر توزيع الأدوار."
        };
    }

    room.players.forEach(
        (player, index) => {

            setPlayerRole(
                player,
                roles[index]
            );

            player.alive = true;

            player.ready = false;

            player.voted = false;

            player.voteTarget = null;
        }
    );

    room.gameStarted = true;

    room.phase = "role";

    room.round = 1;

    room.votes = {};

    room.readyPlayers =
        new Set();

    resetNightActions(room);

    return {

        success: true,

        roles: roles,

        round:
            room.round
    };
}

// ========================================
// بداية الليل
// ========================================

function startNight(room) {

    if (!room) {
        return false;
    }

    room.phase = "night";

    resetNightActions(room);

    resetReady(
        room.players
    );

    resetVotes(
        room.players
    );

    room.votes = {};

    room.readyPlayers =
        new Set();

    return true;
}

// ========================================
// بداية النهار
// ========================================

function startDay(room) {

    if (!room) {
        return false;
    }

    room.phase = "day";

    resetVotes(
        room.players
    );

    room.votes = {};

    return true;
}

// ========================================
// تجهيز الجولة التالية
// ========================================

function prepareNextRound(room) {

    if (!room) {
        return false;
    }

    room.round++;

    resetNightActions(room);

    room.votes = {};

    room.readyPlayers =
        new Set();

    resetVotes(
        room.players
    );

    resetReady(
        room.players
    );

    return true;
}

// ========================================
// تسجيل لاعب Ready
// ========================================

function playerReady(
    room,
    playerId
) {

    if (!room) {
        return false;
    }

    const player =
        findPlayer(
            room.players,
            playerId
        );

    if (!player) {
        return false;
    }

    if (!player.alive) {
        return false;
    }

    player.ready = true;

    if (!room.readyPlayers) {
        room.readyPlayers =
            new Set();
    }

    room.readyPlayers.add(
        playerId
    );

    return true;
}

// ========================================
// هل كل اللاعبين الأحياء جاهزون؟
// ========================================

function allAlivePlayersReady(room) {

    if (!room) {
        return false;
    }

    const alivePlayers =
        getAlivePlayers(
            room.players
        );

    if (alivePlayers.length === 0) {
        return false;
    }

    return alivePlayers.every(
        player =>
            player.ready === true
    );
}

// ========================================
// قتل لاعب
// ========================================

function eliminatePlayer(
    room,
    playerId
) {

    if (!room) {
        return null;
    }

    return killPlayer(
        room.players,
        playerId
    );
}

// ========================================
// فحص نهاية اللعبة
// ========================================

function checkWinner(room) {

    if (!room) {
        return null;
    }

    const alivePlayers =
        getAlivePlayers(
            room.players
        );

    const mafiaCount =
        alivePlayers.filter(
            player =>
                isMafia(
                    player.role
                )
        ).length;

    const nonMafiaCount =
        alivePlayers.filter(
            player =>
                !isMafia(
                    player.role
                )
        ).length;

    // ========================================
    // لا توجد مافيا
    // المدنيون يفوزون
    // ========================================

    if (mafiaCount === 0) {
        return "civilians";
    }

    // ========================================
    // المافيا وصلت للتعادل أو التفوق
    // ========================================

    if (
        mafiaCount >=
        nonMafiaCount
    ) {
        return "mafia";
    }

    return null;
}

// ========================================
// المافيا الأحياء
// ========================================

function getAliveMafia(room) {

    if (!room) {
        return [];
    }

    return getAlivePlayers(
        room.players
    ).filter(
        player =>
            isMafia(
                player.role
            )
    );
}

// ========================================
// هل كل المافيا اختارت؟
// ========================================

function allMafiaActed(room) {

    if (!room) {
        return false;
    }

    const mafia =
        getAliveMafia(room);

    if (mafia.length === 0) {
        return false;
    }

    ensureNightState(room);

    return mafia.every(
        player =>
            room.mafiaActions[
                player.id
            ] === true
    );
}

// ========================================
// تسجيل اختيار المافيا
// ========================================

function setMafiaTarget(
    room,
    targetId,
    mafiaPlayerId = null
) {

    if (!room) {
        return null;
    }

    if (room.phase !== "night") {
        return null;
    }

    const target =
        findPlayer(
            room.players,
            targetId
        );

    if (!target) {
        return null;
    }

    if (!target.alive) {
        return null;
    }

    // المافيا لا تقتل نفسها
    if (
        mafiaPlayerId &&
        mafiaPlayerId === targetId
    ) {
        return null;
    }

    ensureNightState(room);

    // ========================================
    // إذا لم يتم تمرير معرف المافيا
    // نحافظ على التوافق مع الكود القديم
    // ========================================

    if (!mafiaPlayerId) {

        room.mafiaTarget =
            targetId;

        room.mafiaTargets = [
            targetId
        ];

        return target;
    }

    const mafia =
        findPlayer(
            room.players,
            mafiaPlayerId
        );

    if (!mafia) {
        return null;
    }

    if (!mafia.alive) {
        return null;
    }

    if (!isMafia(mafia.role)) {
        return null;
    }

    // منع المافيا من الاختيار مرتين
    if (
        room.mafiaActions[
            mafiaPlayerId
        ]
    ) {
        return null;
    }

    room.mafiaActions[
        mafiaPlayerId
    ] = true;

    room.mafiaVotes.push({

        mafiaId:
            mafiaPlayerId,

        targetId:
            targetId
    });

    room.mafiaTargets.push(
        targetId
    );

    return target;
}

// ========================================
// حساب هدف المافيا النهائي
// ========================================

function getMafiaFinalTarget(room) {

    if (!room) {
        return null;
    }

    ensureNightState(room);

    const aliveMafia =
        getAliveMafia(room);

    if (aliveMafia.length === 0) {
        return null;
    }

    // ========================================
    // توافق مع النظام القديم
    // ========================================

    if (
        room.mafiaVotes.length === 0 &&
        room.mafiaTarget
    ) {
        return room.mafiaTarget;
    }

    // ========================================
    // لا يوجد اختيار
    // ========================================

    if (
        room.mafiaVotes.length === 0
    ) {
        return null;
    }

    const counts = {};

    room.mafiaVotes.forEach(
        vote => {

            if (!counts[vote.targetId]) {
                counts[vote.targetId] = 0;
            }

            counts[vote.targetId]++;
        }
    );

    let maxVotes = 0;

    let selectedTarget = null;

    Object.entries(
        counts
    ).forEach(
        ([targetId, votes]) => {

            if (
                votes > maxVotes
            ) {

                maxVotes =
                    votes;

                selectedTarget =
                    targetId;
            }
        }
    );

    return selectedTarget;
}

// ========================================
// تسجيل اختيار الطبيب
// ========================================

function setDoctorTarget(
    room,
    targetId,
    doctorPlayerId = null
) {

    if (!room) {
        return null;
    }

    if (room.phase !== "night") {
        return null;
    }

    const target =
        findPlayer(
            room.players,
            targetId
        );

    if (!target) {
        return null;
    }

    if (!target.alive) {
        return null;
    }

    ensureNightState(room);

    // ========================================
    // النظام الجديد
    // ========================================

    if (doctorPlayerId) {

        const doctor =
            findPlayer(
                room.players,
                doctorPlayerId
            );

        if (!doctor) {
            return null;
        }

        if (!doctor.alive) {
            return null;
        }

        if (!isDoctor(doctor.role)) {
            return null;
        }

        if (
            room.doctorActions[
                doctorPlayerId
            ]
        ) {
            return null;
        }

        room.doctorActions[
            doctorPlayerId
        ] = true;

        room.doctorTarget =
            targetId;

        return target;
    }

    // ========================================
    // توافق مع النظام القديم
    // ========================================

    room.doctorTarget =
        targetId;

    return target;
}

// ========================================
// تسجيل اختيار المحقق
// ========================================

function setDetectiveTarget(
    room,
    targetId,
    detectivePlayerId = null
) {

    if (!room) {
        return null;
    }

    if (room.phase !== "night") {
        return null;
    }

    const target =
        findPlayer(
            room.players,
            targetId
        );

    if (!target) {
        return null;
    }

    if (!target.alive) {
        return null;
    }

    ensureNightState(room);

    // ========================================
    // النظام الجديد
    // ========================================

    if (detectivePlayerId) {

        const detective =
            findPlayer(
                room.players,
                detectivePlayerId
            );

        if (!detective) {
            return null;
        }

        if (!detective.alive) {
            return null;
        }

        if (
            !isDetective(
                detective.role
            )
        ) {
            return null;
        }

        if (
            room.detectiveActions[
                detectivePlayerId
            ]
        ) {
            return null;
        }

        room.detectiveActions[
            detectivePlayerId
        ] = true;

        room.detectiveTarget =
            targetId;

        return target;
    }

    // ========================================
    // توافق مع النظام القديم
    // ========================================

    room.detectiveTarget =
        targetId;

    return target;
}

// ========================================
// نتيجة الليل
// ========================================

function resolveNight(room) {

    if (!room) {
        return {
            killed: false,
            saved: false,
            player: null
        };
    }

    ensureNightState(room);

    const killedId =
        getMafiaFinalTarget(room);

    const savedId =
        room.doctorTarget;

    let killedPlayer = null;

    let saved = false;

    // ========================================
    // لا يوجد هدف للمافيا
    // ========================================

    if (!killedId) {

        resetNightActions(room);

        return {
            killed: false,
            saved: false,
            player: null
        };
    }

    const target =
        findPlayer(
            room.players,
            killedId
        );

    if (
        target &&
        target.alive
    ) {

        // ========================================
        // الطبيب أنقذ اللاعب
        // ========================================

        if (
            killedId === savedId
        ) {

            saved = true;

        }

        // ========================================
        // تنفيذ القتل
        // ========================================

        else {

            killedPlayer =
                eliminatePlayer(
                    room,
                    killedId
                );
        }
    }

    // ========================================
    // تنظيف Night State
    // ========================================

    resetNightActions(room);

    return {

        killed:
            !!killedPlayer,

        saved:
            saved,

        player:
            killedPlayer
    };
}

// ========================================
// تسجيل التصويت
// ========================================

function addVote(
    room,
    voterId,
    targetId
) {

    if (!room) {
        return {
            success: false,
            message: "الغرفة غير موجودة."
        };
    }

    if (room.phase !== "day") {
        return {
            success: false,
            message:
                "التصويت متاح فقط أثناء النهار."
        };
    }

    const voter =
        findPlayer(
            room.players,
            voterId
        );

    const target =
        findPlayer(
            room.players,
            targetId
        );

    if (!voter) {
        return {
            success: false,
            message:
                "اللاعب غير موجود."
        };
    }

    if (!target) {
        return {
            success: false,
            message:
                "اللاعب المستهدف غير موجود."
        };
    }

    if (!voter.alive) {
        return {
            success: false,
            message:
                "اللاعب الميت لا يستطيع التصويت."
        };
    }

    if (!target.alive) {
        return {
            success: false,
            message:
                "لا يمكنك التصويت على لاعب ميت."
        };
    }

    if (voter.id === target.id) {
        return {
            success: false,
            message:
                "لا يمكنك التصويت لنفسك."
        };
    }

    if (voter.voted) {
        return {
            success: false,
            message:
                "لقد قمت بالتصويت بالفعل."
        };
    }

    if (!room.votes) {
        room.votes = {};
    }

    voter.voted = true;

    voter.voteTarget =
        target.id;

    if (!room.votes[target.id]) {
        room.votes[target.id] = 0;
    }

    room.votes[target.id]++;

    return {

        success: true,

        voter: voter,

        target: target,

        targetId:
            target.id,

        votes:
            room.votes[target.id]
    };
}

// ========================================
// هل كل اللاعبين الأحياء صوتوا؟
// ========================================

function allAlivePlayersVoted(room) {

    if (!room) {
        return false;
    }

    const alivePlayers =
        getAlivePlayers(
            room.players
        );

    if (alivePlayers.length === 0) {
        return false;
    }

    return alivePlayers.every(
        player =>
            player.voted === true
    );
}

// ========================================
// حساب نتيجة التصويت
// ========================================

function resolveVotes(room) {

    if (!room) {
        return {
            type: "none",
            player: null,
            votes: 0
        };
    }

    if (
        !room.votes ||
        Object.keys(room.votes).length === 0
    ) {

        resetVotes(
            room.players
        );

        return {
            type: "none",
            player: null,
            votes: 0
        };
    }

    const entries =
        Object.entries(
            room.votes
        );

    let maxVotes = 0;

    let winners = [];

    entries.forEach(
        ([playerId, votes]) => {

            const player =
                findPlayer(
                    room.players,
                    playerId
                );

            if (
                !player ||
                !player.alive
            ) {
                return;
            }

            if (
                votes > maxVotes
            ) {

                maxVotes =
                    votes;

                winners = [
                    playerId
                ];

            }

            else if (
                votes === maxVotes
            ) {

                winners.push(
                    playerId
                );
            }
        }
    );

    // ========================================
    // لا توجد نتيجة
    // ========================================

    if (
        winners.length === 0
    ) {

        resetVotes(
            room.players
        );

        room.votes = {};

        return {
            type: "none",
            player: null,
            votes: 0
        };
    }

    // ========================================
    // تعادل
    // ========================================

    if (
        winners.length > 1
    ) {

        const tiedPlayers =
            winners
                .map(
                    playerId =>
                        findPlayer(
                            room.players,
                            playerId
                        )
                )
                .filter(Boolean);

        resetVotes(
            room.players
        );

        room.votes = {};

        return {

            type: "tie",

            player: null,

            votes:
                maxVotes,

            tiedPlayers:
                tiedPlayers
        };
    }

    // ========================================
    // اللاعب الذي سيخرج
    // ========================================

    const eliminatedPlayer =
        findPlayer(
            room.players,
            winners[0]
        );

    if (!eliminatedPlayer) {

        resetVotes(
            room.players
        );

        room.votes = {};

        return {
            type: "none",
            player: null,
            votes: 0
        };
    }

    eliminatePlayer(
        room,
        eliminatedPlayer.id
    );

    resetVotes(
        room.players
    );

    room.votes = {};

    return {

        type: "eliminated",

        player:
            eliminatedPlayer,

        votes:
            maxVotes
    };
}

// ========================================
// التصدير
// ========================================

module.exports = {

    MIN_PLAYERS,

    startGame,

    startNight,

    startDay,

    prepareNextRound,

    playerReady,

    allAlivePlayersReady,

    eliminatePlayer,

    checkWinner,

    getAliveMafia,

    allMafiaActed,

    setMafiaTarget,

    getMafiaFinalTarget,

    setDoctorTarget,

    setDetectiveTarget,

    resolveNight,

    addVote,

    allAlivePlayersVoted,

    resolveVotes
};