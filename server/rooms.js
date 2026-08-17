// ==================================================
// ROOMS.JS
// مسؤول عن إنشاء وإدارة الغرف
// ==================================================


const {
    createPlayer
} = require("./players");


// ========================================
// الغرف
// ========================================

const rooms = {};


// ========================================
// إنشاء رمز الغرفة
// ========================================

function generateRoomCode() {

    let roomCode;

    do {

        roomCode = Math.floor(
            10000 + Math.random() * 90000
        ).toString();

    } while (rooms[roomCode]);

    return roomCode;
}


// ========================================
// إنشاء غرفة
// ========================================

function createRoom(
    hostSocketId,
    playerName
) {

    const roomCode =
        generateRoomCode();


    const player =
        createPlayer(
            hostSocketId,
            playerName
        );


    rooms[roomCode] = {

        code: roomCode,

        hostId: hostSocketId,

        players: [
            player
        ],

        gameStarted: false,

        phase: null,

        round: 0,

        mafiaTarget: null,

        doctorTarget: null,

        detectiveTarget: null,

        votes: {},

        readyPlayers: new Set(),

        timer: null

    };


    return rooms[roomCode];

}


// ========================================
// الحصول على غرفة
// ========================================

function getRoom(
    roomCode
) {

    return rooms[roomCode];

}


// ========================================
// حذف غرفة
// ========================================

function deleteRoom(
    roomCode
) {

    if (
        rooms[roomCode]
    ) {

        if (
            rooms[roomCode].timer
        ) {

            clearInterval(
                rooms[roomCode].timer
            );

        }

        delete rooms[roomCode];

    }

}


// ========================================
// إضافة لاعب
// ========================================

function addPlayerToRoom(
    roomCode,
    playerId,
    playerName
) {

    const room =
        getRoom(
            roomCode
        );

    if (!room) {
        return null;
    }


    const player =
        createPlayer(
            playerId,
            playerName
        );


    room.players.push(
        player
    );


    return player;

}


// ========================================
// إزالة لاعب
// ========================================

function removePlayerFromRoom(
    roomCode,
    playerId
) {

    const room =
        getRoom(
            roomCode
        );

    if (!room) {
        return null;
    }


    const index =
        room.players.findIndex(
            player =>
                player.id === playerId
        );


    if (index === -1) {
        return null;
    }


    const removed =
        room.players.splice(
            index,
            1
        )[0];


    return removed;

}


// ========================================
// عدد اللاعبين
// ========================================

function getPlayerCount(
    roomCode
) {

    const room =
        getRoom(
            roomCode
        );

    if (!room) {
        return 0;
    }


    return room.players.length;

}


// ========================================
// هل الغرفة موجودة؟
// ========================================

function roomExists(
    roomCode
) {

    return !!rooms[roomCode];

}


// ========================================
// تغيير الـ Host
// ========================================

function changeHost(
    roomCode
) {

    const room =
        getRoom(
            roomCode
        );

    if (!room) {
        return null;
    }


    if (
        room.players.length === 0
    ) {

        room.hostId = null;

        return null;

    }


    room.hostId =
        room.players[0].id;


    return room.hostId;

}


// ========================================
// إعادة ضبط اللعبة
// ========================================

function resetRoomGame(
    room
) {

    if (!room) {
        return;
    }


    room.gameStarted = false;

    room.phase = null;

    room.round = 0;

    room.mafiaTarget = null;

    room.doctorTarget = null;

    room.detectiveTarget = null;

    room.votes = {};

    room.readyPlayers =
        new Set();


    if (room.timer) {

        clearInterval(
            room.timer
        );

        room.timer = null;

    }

}


// ========================================
// تصدير
// ========================================

module.exports = {

    rooms,

    generateRoomCode,

    createRoom,

    getRoom,

    deleteRoom,

    addPlayerToRoom,

    removePlayerFromRoom,

    getPlayerCount,

    roomExists,

    changeHost,

    resetRoomGame

};