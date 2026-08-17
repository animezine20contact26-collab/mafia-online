const fs = require("fs");
const path = require("path");

const accountsFile =
    path.join(__dirname, "accounts.json");

let accounts = {};

if (fs.existsSync(accountsFile)) {
    try {
        accounts =
            JSON.parse(
                fs.readFileSync(
                    accountsFile,
                    "utf8"
                )
            );
    } catch {
        accounts = {};
    }
}

function saveAccounts() {
    fs.writeFileSync(
        accountsFile,
        JSON.stringify(
            accounts,
            null,
            2
        )
    );
}

function createAccount(
    username,
    password
) {

    username =
        String(username || "")
            .trim();

    password =
        String(password || "");

    if (
        !username ||
        !password
    ) {
        return {
            success: false,
            message:
                "أدخل اسم المستخدم وكلمة المرور."
        };
    }

    if (
        accounts[username]
    ) {
        return {
            success: false,
            message:
                "اسم المستخدم مستخدم بالفعل."
        };
    }

    accounts[username] = {
    username,
    password,
    friends: [],
    createdAt:
        new Date().toISOString()
};

    saveAccounts();

    return {
        success: true,
        account:
            accounts[username]
    };
}

function loginAccount(
    username,
    password
) {

    username =
        String(username || "")
            .trim();

    password =
        String(password || "");

    const account =
        accounts[username];

    if (
        !account ||
        account.password !==
            password
    ) {
        return {
            success: false,
            message:
                "اسم المستخدم أو كلمة المرور غير صحيحة."
        };
    }

    return {
        success: true,
        account
    };
}

function getAccount(
    username
) {
    return accounts[username] || null;
}


function getAccountStats() {

    const allAccounts =
        Object.values(accounts);

    const today =
        new Date()
            .toISOString()
            .slice(0, 10);

    const registeredToday =
        allAccounts.filter(
            account =>
                account.createdAt &&
                account.createdAt
                    .slice(0, 10) ===
                    today
        ).length;

    return {
        total:
            allAccounts.length,

        today:
            registeredToday
    };
}

module.exports = {
    createAccount,
    loginAccount,
    getAccount,
    getAccountStats,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest
};

function sendFriendRequest(
    fromUsername,
    toUsername
) {

    const from =
        accounts[fromUsername];

    const to =
        accounts[toUsername];

    if (!from || !to) {
        return {
            success: false,
            message:
                "الحساب غير موجود."
        };
    }

    if (
        fromUsername ===
        toUsername
    ) {
        return {
            success: false,
            message:
                "لا يمكنك إضافة نفسك."
        };
    }

    if (
        from.friends.includes(
            toUsername
        )
    ) {
        return {
            success: false,
            message:
                "هذا اللاعب صديقك بالفعل."
        };
    }

    if (
        !Array.isArray(
            to.friendRequests
        )
    ) {
        to.friendRequests = [];
    }

    if (
        to.friendRequests.includes(
            fromUsername
        )
    ) {
        return {
            success: false,
            message:
                "طلب الصداقة موجود بالفعل."
        };
    }

    to.friendRequests.push(
        fromUsername
    );

    saveAccounts();

    return {
        success: true,
        message:
            "تم إرسال طلب الصداقة."
    };
}

function acceptFriendRequest(
    username,
    friendUsername
) {

    const account =
        accounts[username];

    const friend =
        accounts[friendUsername];

    if (
        !account ||
        !friend
    ) {
        return {
            success: false,
            message:
                "الحساب غير موجود."
        };
    }

    if (
        !Array.isArray(
            account.friendRequests
        ) ||
        !account.friendRequests.includes(
            friendUsername
        )
    ) {
        return {
            success: false,
            message:
                "طلب الصداقة غير موجود."
        };
    }

    if (
        !account.friends.includes(
            friendUsername
        )
    ) {
        account.friends.push(
            friendUsername
        );
    }

    if (
        !friend.friends.includes(
            username
        )
    ) {
        friend.friends.push(
            username
        );
    }

    account.friendRequests =
        account.friendRequests.filter(
            name =>
                name !==
                friendUsername
        );

    saveAccounts();

    return {
        success: true
    };
}

function rejectFriendRequest(
    username,
    friendUsername
) {

    const account =
        accounts[username];

    if (!account) {
        return {
            success: false,
            message:
                "الحساب غير موجود."
        };
    }

    account.friendRequests =
        (
            account.friendRequests ||
            []
        ).filter(
            name =>
                name !==
                friendUsername
        );

    saveAccounts();

    return {
        success: true
    };
}