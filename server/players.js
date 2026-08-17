    // ==================================================
    // PLAYERS.JS
    // مسؤول عن إدارة اللاعبين
    // ==================================================


    // ========================================
    // إنشاء لاعب
    // ========================================

    function createPlayer(
        id,
        name
    ) {

        return {

            id: id,

            name: name,

            role: null,

            alive: true,

            ready: false,

            voted: false,

            voteTarget: null

        };

    }


    // ========================================
    // البحث عن لاعب
    // ========================================

    function findPlayer(
        players,
        playerId
    ) {

        return players.find(
            player =>
                player.id === playerId
        );

    }


    // ========================================
    // حذف لاعب
    // ========================================

    function removePlayer(
        players,
        playerId
    ) {

        return players.filter(
            player =>
                player.id !== playerId
        );

    }


    // ========================================
    // عدد اللاعبين الأحياء
    // ========================================

    function getAlivePlayers(
        players
    ) {

        return players.filter(
            player =>
                player.alive !== false
        );

    }


    // ========================================
    // عدد اللاعبين الأحياء
    // ========================================

    function getAliveCount(
        players
    ) {

        return getAlivePlayers(
            players
        ).length;

    }


    // ========================================
    // قتل لاعب
    // ========================================

    function killPlayer(
        players,
        playerId
    ) {

        const player =
            findPlayer(
                players,
                playerId
            );

        if (!player) {
            return null;
        }

        player.alive = false;

        player.voted = false;

        player.voteTarget = null;


        return player;

    }


    // ========================================
    // إحياء لاعب
    // ========================================

    function revivePlayer(
        players,
        playerId
    ) {

        const player =
            findPlayer(
                players,
                playerId
            );

        if (!player) {
            return null;
        }

        player.alive = true;


        return player;

    }


    // ========================================
    // تصفير التصويت
    // ========================================

    function resetVotes(
        players
    ) {

        players.forEach(
            player => {

                player.voted = false;

                player.voteTarget = null;

            }
        );

    }


    // ========================================
    // تصفير Ready
    // ========================================

    function resetReady(
        players
    ) {

        players.forEach(
            player => {

                player.ready = false;

            }
        );

    }


    // ========================================
    // تعيين الدور
    // ========================================

    function setPlayerRole(
        player,
        role
    ) {

        if (!player) {
            return;
        }

        player.role = role;

    }


    // ========================================
    // البحث حسب الدور
    // ========================================

    function getPlayersByRole(
        players,
        role
    ) {

        return players.filter(
            player =>
                player.role === role
        );

    }


    // ========================================
    // تصدير
    // ========================================

    module.exports = {

        createPlayer,

        findPlayer,

        removePlayer,

        getAlivePlayers,

        getAliveCount,

        killPlayer,

        revivePlayer,

        resetVotes,

        resetReady,

        setPlayerRole,

        getPlayersByRole

    };