// ==================================================
// ROLES.JS
// مسؤول عن الأدوار فقط
// ==================================================

// ========================================
// أسماء الأدوار
// ========================================

const ROLES = {
    MAFIA: "🕵️ مافيا",
    DETECTIVE: "👮 محقق",
    DOCTOR: "❤️ طبيب",
    CIVILIAN: "👤 مدني"
};

// ========================================
// حساب عدد المافيا
// ========================================

function getMafiaCount(playerCount) {

    if (playerCount >= 13) {
        return 4;
    }

    if (playerCount >= 9) {
        return 3;
    }

    if (playerCount >= 6) {
        return 2;
    }

    return 1;
}

// ========================================
// إنشاء أدوار اللاعبين
// ========================================

function createRoles(playerCount) {

    if (!Number.isInteger(playerCount) || playerCount < 1) {
        return [];
    }

    const roles = [];

    const mafiaCount =
        getMafiaCount(playerCount);

    // ========================================
    // إضافة المافيا
    // ========================================

    for (let i = 0; i < mafiaCount; i++) {
        roles.push(ROLES.MAFIA);
    }

    // ========================================
    // إضافة المحقق
    // ========================================

    if (roles.length < playerCount) {
        roles.push(ROLES.DETECTIVE);
    }

    // ========================================
    // إضافة الطبيب
    // ========================================

    if (roles.length < playerCount) {
        roles.push(ROLES.DOCTOR);
    }

    // ========================================
    // باقي اللاعبين مدنيون
    // ========================================

    while (roles.length < playerCount) {
        roles.push(ROLES.CIVILIAN);
    }

    // ========================================
    // خلط الأدوار
    // ========================================

    shuffleArray(roles);

    return roles;
}

// ========================================
// خلط Array
// Fisher-Yates Shuffle
// ========================================

function shuffleArray(array) {

    for (
        let i = array.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() * (i + 1)
            );

        [
            array[i],
            array[j]
        ] = [
            array[j],
            array[i]
        ];
    }

    return array;
}

// ========================================
// التحقق من الدور
// ========================================

function isMafia(role) {
    return role === ROLES.MAFIA;
}

function isDetective(role) {
    return role === ROLES.DETECTIVE;
}

function isDoctor(role) {
    return role === ROLES.DOCTOR;
}

function isCivilian(role) {
    return role === ROLES.CIVILIAN;
}

// ========================================
// تصدير
// ========================================

module.exports = {

    ROLES,

    getMafiaCount,

    createRoles,

    shuffleArray,

    isMafia,

    isDetective,

    isDoctor,

    isCivilian

};