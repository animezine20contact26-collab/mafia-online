        let currentPlayerName = "";
        let currentAccountUsername = "";
        let currentRoomCode = "";
        let currentRoomType = "public";

        let currentHostId = null;
        

        let currentRole = null;
        let currentPhase = null;
        let currentGamePlayers = [];
        

        let currentRoundRoles = [];
        let lawyerHasProtected = false;

        let sheikhHasChecked = false;

        let hasVoted = false;
        let detectiveHasChecked = false;

        let detectiveResults = {};

let sheikhResultPlayerId = null;
let sheikhResultIsEvil = null;

let pendingGameRequests = [];


        const socket = io();

        console.log(
            "✅ script.js خدام"
        );


        // ========================================
        // الاتصال
        // ========================================

        socket.on(
            "connect",
            () => {

                console.log(
                    "✅ Connected:",
                    socket.id
                );

            }
        );


        // ========================================
        // إنشاء غرفة
        // ========================================

        function createRoom(
    roomType = "public"
) {

    const playerName =
        currentAccountUsername;

    if (!playerName) {

        document
            .getElementById(
                "homeMessage"
            )
            .textContent =
            "يجب تسجيل الدخول أولًا.";

        return;
    }

    socket.emit(
        "createRoom",
        {
            playerName,
            roomType
        }
    );
}

function showSuggestionBox() {

    document
        .getElementById(
            "createRoomOptions"
        )
        .style.display =
            "none";

    document
        .getElementById(
            "friendsSection"
        )
        .style.display =
            "none";

    document
        .getElementById(
            "readyRoomsSection"
        )
        .style.display =
            "none";

    document
        .getElementById(
            "suggestionBox"
        )
        .style.display =
            "block";

    document
        .getElementById(
            "suggestionMessage"
        )
        .textContent = "";
}

function closeSuggestionBox() {

    document
        .getElementById(
            "suggestionBox"
        )
        .style.display =
            "none";
}

function sendSuggestion() {

    const category =
        document
            .getElementById(
                "suggestionCategory"
            )
            .value;

    const text =
        document
            .getElementById(
                "suggestionText"
            )
            .value
            .trim();

    if (!text) {

        document
            .getElementById(
                "suggestionMessage"
            )
            .textContent =
                "اكتب اقتراحك أولًا.";

        return;
    }

    socket.emit(
        "sendSuggestion",
        {
            username:
                currentAccountUsername,

            category,

            text
        }
    );
}

socket.on(
    "suggestionResult",
    result => {

        const message =
            document
                .getElementById(
                    "suggestionMessage"
                );

        if (
            !result.success
        ) {

            message.textContent =
                result.message;

            return;
        }

        message.textContent =
            "✅ تم إرسال اقتراحك بنجاح.";

        document
            .getElementById(
                "suggestionText"
            )
            .value = "";
    }
);

function showCreateRoomOptions() {

    document
        .getElementById(
            "createRoomOptions"
        )
        .style.display = "block";

    document
        .getElementById(
            "friendsSection"
        )
        .style.display = "none";

    document
        .getElementById(
            "readyRoomsSection"
        )
        .style.display = "none";
}

function showFriendsRooms() {

    document
        .getElementById(
            "createRoomOptions"
        )
        .style.display = "none";

    document
        .getElementById(
            "readyRoomsSection"
        )
        .style.display = "none";

    const section =
        document.getElementById(
            "friendsSection"
        );

    section.style.display =
        "block";

    socket.emit(
        "getFriends"
    );

    socket.emit(
        "getFriendsRooms"
    );
}

function showReadyRooms() {

    document
        .getElementById(
            "createRoomOptions"
        )
        .style.display = "none";

    document
        .getElementById(
            "friendsSection"
        )
        .style.display = "none";

    const section =
        document.getElementById(
            "readyRoomsSection"
        );

    section.style.display =
        "block";

    document
        .getElementById(
            "readyRoomsList"
        )
        .style.display = "none";
}

function showReadyRoomList() {

    const list =
        document.getElementById(
            "readyRoomsList"
        );

    list.style.display =
        "block";

    socket.emit(
        "getReadyRooms"
    );
}

socket.on(
    "readyRoomsData",
    data => {

        const container =
    document.getElementById(
        "readyRoomsSection"
    );

        if (!container) {
            return;
        }

        container.style.display =
            "block";

        

        const list =
            document.getElementById(
                "readyRoomsList"
            );

        if (
            !data.rooms ||
            data.rooms.length === 0
        ) {

            list.innerHTML =
                "<p>لا توجد غرف جاهزة حاليًا.</p>";

            return;
        }

        list.innerHTML = "";

        data.rooms.forEach(
            room => {

                const div =
                    document.createElement(
                        "div"
                    );

                div.innerHTML = `
                    <div>
                        🏠 غرفة ${escapeHtml(
                            room.hostName
                        )}

                        <span>
                            ${room.playerCount}/10
                        </span>
                    </div>

                    <button
                        onclick="joinReadyRoom('${room.roomCode}')"
                    >
                        🚪 انضمام
                    </button>
                `;

                list.appendChild(
                    div
                );
            }
        );
    }
);

function joinReadyRoom(
    roomCode
) {

    if (
        !currentAccountUsername
    ) {

        alert(
            "يجب تسجيل الدخول أولًا."
        );

        return;
    }

    currentPlayerName =
        currentAccountUsername;

    socket.emit(
        "joinRoom",
        {
            playerName:
                currentAccountUsername,

            roomCode:
                roomCode
        }
    );
}

function sendFriendRequest() {

    const username =
        document
            .getElementById(
                "friendUsername"
            )
            .value
            .trim();

    if (!username) {
        return;
    }

    socket.emit(
        "sendFriendRequest",
        {
            username
        }
    );
}

function renderGameRequests() {

    const requests =
        document.getElementById(
            "friendRequestsList"
        );

    if (!requests) {
        return;
    }

    pendingGameRequests.forEach(
        username => {

            const exists =
                requests.querySelector(
                    `[data-game-request="${CSS.escape(username)}"]`
                );

            if (exists) {
                return;
            }

            const div =
                document.createElement(
                    "div"
                );

            div.dataset.gameRequest =
                username;

            div.innerHTML = `
                <span>
                    🎮 ${escapeHtml(
                        username
                    )} يريد اللعب معك
                </span>

                <button
                    onclick="acceptGameRequest('${escapeHtml(username)}')"
                >
                    قبول اللعب
                </button>
            `;

            requests.appendChild(
                div
            );
        }
    );
}

socket.on(
    "gameRequest",
    data => {

        if (
            !data ||
            !data.username
        ) {
            return;
        }

        if (
            !pendingGameRequests.includes(
                data.username
            )
        ) {
            pendingGameRequests.push(
                data.username
            );
        }

        renderGameRequests();
    }
);

function acceptGameRequest(
    username
) {

    socket.emit(
        "acceptGameRequest",
        {
            username
        }
    );

    pendingGameRequests =
        pendingGameRequests.filter(
            name =>
                name !== username
        );

    renderGameRequests();
}

socket.on(
    "friendsData",
    data => {

        updateGameFriends(
    data.friends || []
);

        const requests =
            document.getElementById(
                "friendRequestsList"
            );

        const friends =
            document.getElementById(
                "friendsList"
            );

            

            

        requests.innerHTML = "";
        friends.innerHTML = "";

        (data.requests || [])
            .forEach(
                username => {

                    const div =
                        document.createElement(
                            "div"
                        );

                    div.innerHTML = `
                        <span>
                            ${escapeHtml(username)}
                        </span>

                        <button
                            onclick="acceptFriend('${escapeHtml(username)}')"
                        >
                            قبول
                        </button>

                        <button
                            onclick="rejectFriend('${escapeHtml(username)}')"
                        >
                            رفض
                        </button>
                    `;

                    requests.appendChild(
                        div
                    );
                }
            );

        (data.friends || [])
    .forEach(
        friend => {

            const div =
                document.createElement(
                    "div"
                );

            div.innerHTML = `
                <span>
                    👤 ${escapeHtml(
                        friend.username
                    )}
                </span>

                <span
                    class="${
                        friend.online
                            ? "friend-online"
                            : "friend-offline"
                    }"
                >
                    ${
                        friend.online
                            ? "🟢 متصل"
                            : "⚫ غير متصل"
                    }
                </span>
            `;

            friends.appendChild(
                div
            );
        }
    );

    renderGameRequests();

    }
);

function acceptFriend(
    username
) {

    socket.emit(
        "acceptFriendRequest",
        {
            username
        }
    );
}

function rejectFriend(
    username
) {

    socket.emit(
        "rejectFriendRequest",
        {
            username
        }
    );
}

socket.on(
    "friendRequestResult",
    result => {

        alert(
            result.message
        );

        if (result.success) {
            socket.emit(
                "getFriends"
            );
        }
    }
);

socket.on(
    "friendActionResult",
    result => {

        if (!result.success) {
            alert(
                result.message
            );

            return;
        }

        socket.emit(
            "getFriends"
        );
    }
);


        // ========================================
        // الانضمام
        // ========================================

        function joinRoom() {

            const playerName =
                document
                    .getElementById("playerName")
                    .value
                    .trim();

            const roomCode =
                document
                    .getElementById("roomCode")
                    .value
                    .trim();

            if (!playerName) {

                alert(
                    "اكتب اسم اللاعب أولًا."
                );

                return;
            }

            if (!roomCode) {

                alert(
                    "اكتب رمز الغرفة."
                );

                return;
            }

            currentPlayerName =
                playerName;

            socket.emit(
                "joinRoom",
                {
                    playerName:
                        playerName,

                    roomCode:
                        roomCode
                }
            );
        }


        // ========================================
        // 🏠 إنشاء الغرفة
        // ========================================

        socket.on("roomCreated", data => {

            currentRoomCode =
                data.roomCode || "";

                currentRoomType =
    data.roomType || "public";

            currentHostId =
                data.hostId || null;

            const homePage =
                document.getElementById(
                    "homePage"
                );

            const roomPage =
                document.getElementById(
                    "roomPage"
                );

            const roomCodeDisplay =
                document.getElementById(
                    "roomCodeDisplay"
                );

            const currentPlayer =
                document.getElementById(
                    "currentPlayerName"
                );

            if (homePage) {
                homePage.style.display = "none";
            }

            if (roomPage) {
                roomPage.style.display = "flex";
            }

            if (roomCodeDisplay) {
                roomCodeDisplay.textContent =
                    currentRoomCode;
            }

            if (currentPlayer) {
                currentPlayer.textContent =
                    currentPlayerName;
            }

            updatePlayers(
                data.players || []
            );

        });


        // ========================================
        // 🚪 الانضمام للغرفة
        // ========================================

        socket.on("joinedRoom", data => {

            currentRoomCode =
    data.roomCode || "";

currentRoomType =
    data.roomType || "public";

currentHostId =
    data.hostId || null;

            const homePage =
                document.getElementById(
                    "homePage"
                );

            const roomPage =
                document.getElementById(
                    "roomPage"
                );

            const roomCodeDisplay =
                document.getElementById(
                    "roomCodeDisplay"
                );

            const currentPlayer =
                document.getElementById(
                    "currentPlayerName"
                );

            if (homePage) {
                homePage.style.display = "none";
            }

            if (roomPage) {
                roomPage.style.display = "flex";
            }

            if (roomCodeDisplay) {
                roomCodeDisplay.textContent =
                    currentRoomCode;
            }

            if (currentPlayer) {
                currentPlayer.textContent =
                    currentPlayerName;
            }

            updatePlayers(
                data.players || []
            );

        });


        // ========================================
        // خطأ
        // ========================================

        socket.on(
            "joinError",
            message => {

                alert(
                    "⚠️ " + message
                );

            }
        );


        // ========================================
        // تحديث اللاعبين في غرفة الانتظار
        // ========================================

        function updatePlayers(players) {

            const list =
                document.getElementById(
                    "playersList"
                );

            const count =
                document.getElementById(
                    "playersCount"
                );

            if (!list) {
                return;
            }

            list.innerHTML = "";

            if (count) {
                count.textContent =
                    players.length;
            }

            players.forEach(
                player => {

                    const li =
                        document.createElement(
                            "li"
                        );

                    const isMe =
                        player.id ===
                        socket.id;

                    const isHost =
                        player.id ===
                        currentHostId;

                    const isAlive =
                        player.alive !== false;

                    li.innerHTML = `

                        <div
                            class="player-card
                            ${isMe ? "me" : ""}
                            ${!isAlive ? "dead" : ""}"
                        >

                            <div class="player-avatar">

                                ${
                                    isAlive
                                        ? "👤"
                                        : "☠️"
                                }

                            </div>

                            <div class="player-info">

                                <div class="player-name">

                                    ${escapeHtml(
                                        player.name
                                    )}

                                    ${
                                        isHost
                                            ? `<span class="host-badge">
                                                👑 Host
                                            </span>`
                                            : ""
                                    }

                                    ${
                                        isMe
                                            ? `<span class="you-badge">
                                                أنت
                                            </span>`
                                            : ""
                                    }

                                </div>

                                <div class="player-status">

                                    ${
                                        isAlive
                                            ? "🟢 حي"
                                            : "☠️ خرج من اللعبة"
                                    }

                                </div>

                            </div>

                            ${
                                socket.id ===
                                    currentHostId &&
                                player.id !==
                                    currentHostId
                                    ? `

                                    <button
                                        class="kick-button"
                                        onclick="kickPlayer(
                                            '${player.id}',
                                            '${escapeHtml(player.name)}'
                                        )"
                                    >
                                        👢 طرد
                                    </button>

                                    `
                                    : ""
                            }

                        </div>
                    `;

                    list.appendChild(li);

                }
            );

            updateHostControls();
        }


        // ========================================
        // بدء اللعبة
        // ========================================

        function startGame() {

            if (
                socket.id !==
                currentHostId
            ) {

                alert(
                    "👑 فقط صاحب الغرفة يستطيع بدء اللعبة."
                );

                return;
            }

            const players =
                document.querySelectorAll(
                    "#playersList li"
                );

            if (
                players.length < 4
            ) {

                alert(
                    "⚠️ يجب أن يكون هناك 4 لاعبين على الأقل."
                );

                return;
            }

            const roomCode =
                getCurrentRoomCode();

            if (!roomCode) {

                alert(
                    "⚠️ رمز الغرفة غير موجود."
                );

                return;
            }

            socket.emit(
                "startGame",
                roomCode
            );
        }


        // ========================================
        // صلاحيات الـ Host
        // ========================================

        function updateHostControls() {

            const section =
                document.getElementById(
                    "startGameSection"
                );

            const button =
                document.getElementById(
                    "startGameButton"
                );

            const message =
                document.getElementById(
                    "startGameMessage"
                );

            if (
                !section ||
                !button ||
                !message
            ) {
                return;
            }

            const playerCount =
                document.querySelectorAll(
                    "#playersList li"
                ).length;

                const roomMessage =
    document.getElementById(
        "roomMessage"
    );

if (roomMessage) {

    roomMessage.textContent =
        currentRoomType === "ready"
            ? "يجب أن يكون هناك 10 لاعبين في هذه الغرفة."
            : "يجب أن يكون هناك 4 لاعبين على الأقل.";
}

            const isHost =
                socket.id ===
                currentHostId;

            if (!isHost) {

                section.style.display =
                    "none";

                return;
            }

            section.style.display =
                "block";

            const requiredPlayers =
    currentRoomType === "ready"
        ? 10
        : 4;

if (
    playerCount <
    requiredPlayers
) {

    const remaining =
        requiredPlayers -
        playerCount;

    button.disabled =
        true;

    button.textContent =
        "🔒 انتظار اللاعبين";

    message.className =
        "start-game-message waiting";

    message.textContent =
        `⚠️ تحتاج إلى ${remaining} لاعبين إضافيين.`;

    return;
}

            button.disabled =
                false;

            button.textContent =
                "🎮 بدء اللعبة";

            message.className =
                "start-game-message ready";

            message.textContent =
                `✅ اللعبة جاهزة — ${playerCount} لاعبين.`;
        }


        // ========================================
        // طرد لاعب
        // ========================================

        function kickPlayer(
            targetId,
            targetName
        ) {

            if (
                socket.id !==
                currentHostId
            ) {

                alert(
                    "👑 فقط صاحب الغرفة يستطيع طرد اللاعبين."
                );

                return;
            }

            const roomCode =
                getCurrentRoomCode();

            if (!roomCode) {
                return;
            }

            const confirmed =
                confirm(
                    `هل تريد طرد اللاعب "${targetName}"؟`
                );

            if (!confirmed) {
                return;
            }

            socket.emit(
                "kickPlayer",
                {
                    roomCode:
                        roomCode,

                    targetId:
                        targetId
                }
            );
        }


        // ========================================
        // تم طردي
        // ========================================

        socket.on(
            "playerKicked",
            data => {

                alert(
                    data.message ||
                    "👢 تم طردك من الغرفة."
                );

                showOnlyPage(
                    "homePage"
                );

                currentHostId =
                    null;

                currentPlayerName =
                    "";

            }
        );


        // ========================================
        // تحديث اللاعبين
        // ========================================

        socket.on(
            "playersUpdated",
            data => {

                currentHostId =
                    data.hostId;

                updatePlayers(
                    data.players
                );

            }
        );


        // ========================================
        // نسخ الرمز
        // ========================================

        function copyRoomCode() {

    const codeElement =
        document.getElementById("roomCodeDisplay");

    const code =
        codeElement.textContent.trim();

    if (
        !code ||
        code === "------"
    ) {
        return;
    }

    navigator.clipboard.writeText(code)
        .then(() => {

            // إنشاء رسالة النسخ
            let message =
                document.getElementById("copyMessage");

            if (!message) {

                message =
                    document.createElement("div");

                message.id =
                    "copyMessage";

                message.className =
                    "copy-message";

                document.body.appendChild(
                    message
                );
            }

            message.textContent =
                "✓ تم نسخ رمز الغرفة";

            message.classList.add("show");

            // إخفاء الرسالة بعد ثانيتين
            setTimeout(() => {

                message.classList.remove("show");

            }, 2000);

        })
        .catch(() => {

            // بدون alert
            console.log(
                "تعذر نسخ رمز الغرفة."
            );

        });
}


        // ========================================
        // 🎭 استلام الدور
        // ========================================

        socket.on("yourRole", data => {

            console.log(
                "🎭 دور اللاعب:",
                data.role
            );

            currentRole = data.role;

            currentRoundRoles =
                data.roundRoles || [];

            // إعادة حالة الجاهزية
            hasVoted = false;

            // إخفاء الصفحات الأخرى
            hideAllPages();

            // إظهار صفحة الدور
            const rolePage =
                document.getElementById("rolePage");

            if (!rolePage) {
                console.error(
                    "❌ rolePage غير موجود"
                );
                return;
            }

            rolePage.style.display = "flex";

            

            // ========================================
            // عرض الدور الشخصي
            // ========================================

            renderMyRole(
                data.role
            );

            // ========================================
            // عرض أدوار الجولة
            // ========================================

            renderRoundRoles(
                currentRoundRoles
            );

            // ========================================
            // إعادة حالة الصفحة
            // ========================================

            const button =
                document.getElementById(
                    "hideRoleButton"
                );

            const message =
                document.getElementById(
                    "hiddenRoleMessage"
                );

            const warning =
                document.querySelector(
                    ".secret-warning"
                );

            if (button) {

                button.style.display =
                    "inline-flex";

                button.disabled = false;

            }

            if (message) {

                message.style.display =
                    "none";

            }

            if (warning) {

                warning.style.display =
                    "block";

            }

        });


        // ========================================
// 🎭 الحصول على صورة الدور
// ========================================

function getRoleImage(role) {

    switch (role) {

        case "🕵️ مافيا":
            return "assets/roles/mafia.png";

        case "👮 محقق":
            return "assets/roles/detective.png";

        case "❤️ طبيب":
            return "assets/roles/doctor.png";

        case "⚖️ محامي":
            return "assets/roles/lawyer.png";

            case "🧓 شيخ": return "assets/roles/sheikh.png";

            case "💤 منوِّم":
    return "assets/roles/sleeper.png";

        case "👤 مدني":
            return "assets/roles/civilian.png";

        default:
            console.warn(
                "⚠️ دور غير معروف:",
                role
            );

            return "assets/mystery.png";
    }
}


        // ========================================
        // 🎭 عرض الدور الشخصي
        // ========================================

        function renderMyRole(role) {

            const container =
                document.getElementById(
                    "myRoleImage"
                );

                const roleName =
    document.getElementById(
        "myRoleName"
    );

const roleDescription =
    document.getElementById(
        "myRoleDescription"
    );


if (roleName) {

    roleName.textContent =
        getRoleDisplayName(
            currentRole
        );

}


if (roleDescription) {

    roleDescription.textContent =
        getRoleDescription(
            currentRole
        );

}

            if (!container) {
                console.error(
                    "❌ myRoleImage غير موجود"
                );
                return;
            }

            // تنظيف المحتوى القديم
            container.innerHTML = "";

            // حالة مؤقتة أثناء تحميل الصورة
            container.classList.remove(
                "role-hidden"
            );

            // إنشاء صورة الدور
            const img =
                document.createElement(
                    "img"
                );

            img.src =
                getRoleImage(role);

            img.alt =
                "دوري";

            img.className =
                "role-image personal-role-image";

            // إذا فشلت الصورة
            img.onerror = () => {

                img.onerror = null;

                img.src =
                    "assets/mystery.png";

            };

            container.appendChild(
                img
            );
        }


        // ========================================
        // 🎭 عرض أدوار الجولة بدون دور اللاعب
        // ========================================

        function renderRoundRoles(roles) {

            const container =
                document.getElementById(
                    "roundRolesList"
                );

            if (!container) {
                console.error(
                    "❌ roundRolesList غير موجود"
                );
                return;
            }

            container.innerHTML = "";

            if (!Array.isArray(roles)) {
                return;
            }

            // إزالة دور اللاعب الحالي من القائمة
            const otherRoles =
                [...roles];

            const myIndex =
                otherRoles.indexOf(
                    currentRole
                );

            if (myIndex !== -1) {
                otherRoles.splice(
                    myIndex,
                    1
                );
            }

            // عرض باقي الأدوار فقط
            otherRoles.forEach(role => {

                const button =
                    document.createElement(
                        "button"
                    );

                button.type =
                    "button";

                button.className =
                    "round-role-button";

                const img =
                    document.createElement(
                        "img"
                    );

                img.src =
                    getRoleImage(role);

                img.alt =
                    "";

                img.className =
                    "role-image";

                img.onerror = () => {

                    img.onerror = null;

                    img.src =
                        "assets/mystery.png";

                };

                button.appendChild(
                    img
                );

                button.disabled =
                    true;

                container.appendChild(
                    button
                );

            });
        }


        // ========================================
        // 🙈 إخفاء الدور والاستعداد
        // ========================================

        function hideRole() {

            const personalRole =
                document.getElementById(
                    "myRoleImage"
                );

            const warning =
                document.querySelector(
                    ".secret-warning"
                );

            const button =
                document.getElementById(
                    "hideRoleButton"
                );

            const message =
                document.getElementById(
                    "hiddenRoleMessage"
                );


            // ========================================
            // منع الضغط أكثر من مرة
            // ========================================

            if (button && button.disabled) {
                return;
            }


            // ========================================
            // التأكد من رمز الغرفة
            // ========================================

            const roomCode =
                currentRoomCode ||
                getCurrentRoomCode();

            if (!roomCode) {

                console.error(
                    "❌ رمز الغرفة غير موجود."
                );

                return;
            }


            // ========================================
            // تعطيل الزر مباشرة
            // ========================================

            if (button) {

                button.disabled = true;

                button.style.display =
                    "none";

            }


            // ========================================
            // إخفاء صورة الدور
            // ========================================

            if (personalRole) {

                personalRole.classList.add(
                    "role-hidden"
                );

            }


            // ========================================
            // إخفاء التحذير
            // ========================================

            if (warning) {

                warning.style.display =
                    "none";

            }


            // ========================================
            // إظهار رسالة الانتظار
            // ========================================

            if (message) {

                message.style.display =
                    "flex";

                message.textContent =
                    "🔒 تم إخفاء الدور — ⏳ في انتظار باقي اللاعبين...";
            }


            // ========================================
            // اللاعب أصبح جاهزًا
            // ========================================

            console.log(
                "✅ أصبحت جاهزًا:",
                socket.id
            );


            socket.emit(
                "readyForGame",
                {
                    roomCode: roomCode
                }
            );

        }


        // ========================================
        // عرض الغرفة الرئيسية
        // ========================================

        function showGamePage() {

            hideAllPages();

            const gamePage =
                document.getElementById(
                    "gamePage"
                );

            if (gamePage) {

                gamePage.style.display =
                    "flex";
            }

            // إذا كانت اللعبة لم تبدأ المرحلة بعد
            if (
                !currentPhase
            ) {

                const title =
                    document.getElementById(
                        "gameStatusTitle"
                    );

                const message =
                    document.getElementById(
                        "gameStatusMessage"
                    );

                if (title) {
                    title.textContent =
                        "استعد للعبة";
                }

                if (message) {
                    message.textContent =
                        "🌙 ستبدأ مرحلة الليل قريبًا.";
                }
            }
        }

        // ========================================
// 👥 أصدقاء غرفة اللعب
// ========================================

function updateGameFriends(
    friends
) {

    const list =
        document.getElementById(
            "gameFriendsList"
        );

    if (!list) {
        return;
    }

    list.innerHTML = "";

    (friends || [])
        .forEach(
            friend => {

                const div =
                    document.createElement(
                        "div"
                    );

                div.className =
                    "game-friend-card";

                div.innerHTML = `
                    <div
                        class="game-friend-info"
                    >

                        <strong>
                            👤 ${escapeHtml(
                                friend.username
                            )}
                        </strong>

                        <span
                            class="${
                                friend.online
                                    ? "friend-online"
                                    : "friend-offline"
                            }"
                        >
                            ${
                                friend.online
                                    ? "🟢 متصل"
                                    : "⚫ غير متصل"
                            }
                        </span>

                    </div>

                    ${
                        friend.online
                            ? `
                                <button
                                    type="button"
                                    onclick="sendGameRequest('${escapeHtml(
                                        friend.username
                                    )}')"
                                >
                                    🎮 طلب لعب
                                </button>
                              `
                            : ""
                    }
                `;

                list.appendChild(
                    div
                );
            }
        );
}

function sendGameRequest(
    username
) {

    socket.emit(
        "sendGameRequest",
        {
            username
        }
    );
}


        // ========================================
        // ترتيب اللاعبين يمين ويسار
        // ========================================

        function updateGamePlayers(players) {

            currentGamePlayers = players || [];

            const left =
                document.getElementById(
                    "leftPlayers"
                );

            const right =
                document.getElementById(
                    "rightPlayers"
                );

            if (!left || !right) {
                return;
            }

            left.innerHTML = "";
            right.innerHTML = "";

            // ========================================
            // اللاعب الحالي
            // ========================================

            const me =
                currentGamePlayers.find(
                    player =>
                        player.id === socket.id
                );

            // ========================================
            // باقي اللاعبين
            // ========================================

            const otherPlayers =
                currentGamePlayers.filter(
                    player =>
                        player.id !== socket.id
                );

            // ========================================
            // تقسيم اللاعبين بالتساوي
            // ========================================

            const middle =
                Math.ceil(
                    otherPlayers.length / 2
                );

            const leftPlayers =
                otherPlayers.slice(
                    0,
                    middle
                );

            const rightPlayers =
                otherPlayers.slice(
                    middle
                );

            // ========================================
            // اللاعب الحالي في اليمين
            // ========================================

            if (me) {

                renderSidePlayer(
                    me,
                    right,
                    true
                );

            }

            // ========================================
            // لاعبو اليمين
            // ========================================

            rightPlayers.forEach(
                player => {

                    renderSidePlayer(
                        player,
                        right,
                        false
                    );

                }
            );

            // ========================================
            // لاعبو اليسار
            // ========================================

            leftPlayers.forEach(
                player => {

                    renderSidePlayer(
                        player,
                        left,
                        false
                    );

                }
            );
        }

        


        // ========================================
// 👤 بطاقة لاعب في اللعبة
// ========================================

function renderSidePlayer(
    player,
    container,
    isMe
) {

    const card =
        document.createElement("div");

    card.className =
        "side-player-card";

        // 🧓 الحفاظ على لون نتيجة الشيخ

if (
    sheikhResultPlayerId === player.id
) {

    if (sheikhResultIsEvil) {

        card.classList.add(
            "sheikh-evil"
        );

    } else {

        card.classList.add(
            "sheikh-good"
        );

    }

}

    card.dataset.playerId =
        player.id;

    const detectedRole =
    detectiveResults[player.id] || null;

const isDetectedByMe =
    currentRole &&
    currentRole.includes("محقق") &&
    !!detectedRole;


    // ========================================
    // ☠️ اللاعب الميت
    // ========================================

    if (!player.alive) {

        card.classList.add(
            "dead"
        );

    }


    // ========================================
    // 👤 اللاعب الحالي
    // ========================================

    if (isMe) {

        card.classList.add(
            "current-player"
        );

    }


    // ========================================
    // اسم اللاعب — فوق الصورة
    // ========================================

    const name =
        document.createElement("strong");

    name.className =
        "side-player-name";

    name.textContent =
        player.name;


    // ========================================
    // 🖼️ صورة اللاعب
    // ========================================

    const image =
        document.createElement("img");


    // ========================================
    // 🖼️ تحديد صورة اللاعب
    // ========================================

    if (isMe) {

        image.src =
            getRoleImage(currentRole);

        image.alt =
            getRoleDisplayName(currentRole);

    } else if (isDetectedByMe) {

    image.src =
        getRoleImage(
            detectedRole
        );

    image.alt =
        getRoleDisplayName(
            detectedRole
        );

} else {

        image.src =
            "assets/mystery.png";

        image.alt =
            player.name;

    }


    image.className =
        "side-player-image";


    image.onerror = () => {

        image.onerror = null;

        image.src =
            "assets/mystery.png";

    };


    // ========================================
    // 🎭 الأدوار الخاصة
    // ========================================

    const isMafia =
        currentRole &&
        currentRole.includes("مافيا");

    const isDoctor =
        currentRole &&
        currentRole.includes("طبيب");

    const isDetective =
        currentRole &&
        currentRole.includes("محقق");

    const isLawyer =
        currentRole &&
        currentRole.includes("محامي");

        const isSheikh =
    currentRole &&
    currentRole.includes("شيخ");

    const isSleeper =
    currentRole &&
    currentRole.includes("منوِّم");


    // ========================================
    // 🌙 اختيار لاعب في الليل
    // ========================================

    const canSelectAtNight =
    currentPhase === "night" &&
    (
        isMafia ||
        isDoctor ||
        (
            isDetective &&
            !detectiveHasChecked
        ) ||
        (
            isLawyer &&
            !lawyerHasProtected
        ) ||
        (
            isSheikh &&
            !sheikhHasChecked
        )||
isSleeper
    ) &&
    !isMe &&
    player.alive;


    // ========================================
    // ☀️ التصويت في النهار
    // ========================================

    const canVoteAtDay =
        currentPhase === "day" &&
        !isMe &&
        player.alive &&
        !hasVoted;


    // ========================================
    // 🎯 هل الصورة قابلة للضغط؟
    // ========================================

    const meAlive =
    currentGamePlayers.find(
        p => p.id === socket.id
    )?.alive !== false;
    
    const canSelect =
    meAlive &&
    (
        canSelectAtNight ||
        canVoteAtDay
    );


    if (canSelect) {

        image.classList.add(
            "role-selectable"
        );

        image.style.cursor =
            "pointer";


        // ========================================
        // 🖱️ الضغط على الصورة
        // ========================================

        image.addEventListener(
            "click",
            () => {


                // ========================================
                // 🛑 التصويت في النهار
                // ========================================

                if (
                    currentPhase === "day"
                ) {

                    if (hasVoted) {
                        return;
                    }


                    if (
                        player.id ===
                        socket.id
                    ) {
                        return;
                    }


                    // إزالة التصويت السابق
                    document
                        .querySelectorAll(
                            ".vote-selected"
                        )
                        .forEach(
                            selected => {

                                selected.classList.remove(
                                    "vote-selected"
                                );

                            }
                        );


                    // تحديد اللاعب
                    image.classList.add(
                        "vote-selected"
                    );


                    console.log(
                        "🗳️ تم التصويت على:",
                        player.name
                    );


                    // إرسال التصويت
                    socket.emit(
                        "votePlayer",
                        {
                            roomCode:
                                getCurrentRoomCode(),

                            targetId:
                                player.id
                        }
                    );


                    return;
                }


                // ========================================
                // 🕵️ المافيا
                // ========================================

                if (isMafia) {

                    document
    .querySelectorAll(
        ".mafia-selected"
    )
    .forEach(
        selected => {

            selected.classList.remove(
                "mafia-selected"
            );

        }
    );


image.classList.add(
    "mafia-selected"
);


                    console.log(
                        "🕵️ المافيا اختارت:",
                        player.name
                    );


                    socket.emit(
                        "mafiaKill",
                        {
                            roomCode:
                                getCurrentRoomCode(),

                            targetId:
                                player.id
                        }
                    );


                    return;
                }


                // ========================================
                // ❤️ الطبيب
                // ========================================

                if (isDoctor) {

                    document
                        .querySelectorAll(
                            ".role-selected"
                        )
                        .forEach(
                            selected => {

                                selected.classList.remove(
                                    "role-selected"
                                );

                            }
                        );


                    image.classList.add(
                        "role-selected"
                    );


                    console.log(
                        "❤️ الطبيب اختار:",
                        player.name
                    );


                    socket.emit(
                        "doctorSave",
                        {
                            roomCode:
                                getCurrentRoomCode(),

                            targetId:
                                player.id
                        }
                    );


                    return;
                }


                // ========================================
                // 👮 المحقق
                // ========================================

                if (isDetective) {

                    // منع التحقيق مرة ثانية
                    if (
                        detectiveHasChecked
                    ) {
                        return;
                    }


                    // إزالة الاختيار السابق
                    document
                        .querySelectorAll(
                            ".role-selected"
                        )
                        .forEach(
                            selected => {

                                selected.classList.remove(
                                    "role-selected"
                                );

                            }
                        );


                    // تحديد الصورة
                    image.classList.add(
                        "role-selected"
                    );


                    // إرسال التحقيق
                    socket.emit(
                        "detectiveCheck",
                        {
                            roomCode:
                                getCurrentRoomCode(),

                            targetId:
                                player.id
                        }
                    );


                    // منع تحقيق آخر
                    detectiveHasChecked =
                        true;


                    document
                        .querySelectorAll(
                            ".role-selectable"
                        )
                        .forEach(
                            selectableImage => {

                                selectableImage.style.pointerEvents =
                                    "none";

                                selectableImage.style.cursor =
                                    "default";

                            }
                        );


                    console.log(
                        "🔎 المحقق اختار:",
                        player.name
                    );


                    return;
                }


                // ========================================
                // ⚖️ المحامي
                // ========================================

                if (isLawyer) {

                    // منع الحماية مرة ثانية
                    if (
                        lawyerHasProtected
                    ) {
                        return;
                    }


                    // إزالة اختيار المحامي السابق
                    document
                        .querySelectorAll(
                            ".lawyer-selected"
                        )
                        .forEach(
                            selected => {

                                selected.classList.remove(
                                    "lawyer-selected"
                                );

                            }
                        );

                        


                    // 🟢 تحديد اللاعب باللون الأخضر
                    image.classList.add(
                        "lawyer-selected"
                    );


                    // تسجيل أن المحامي اختار
                    lawyerHasProtected =
                        true;


                    // منع اختيار لاعب آخر
                    document
                        .querySelectorAll(
                            ".role-selectable"
                        )
                        .forEach(
                            selectableImage => {

                                selectableImage.style.pointerEvents =
                                    "none";

                                selectableImage.style.cursor =
                                    "default";

                            }
                        );


                    console.log(
                        "⚖️ المحامي اختار:",
                        player.name
                    );


                    // إرسال الحماية للسيرفر
                    lawyerProtect(
                        player.id,
                        player.name
                    );


                    return;
                }

                // ========================================
// 💤 المنوِّم
// ========================================

if (isSleeper) {

    image.classList.add(
        "role-selected"
    );

    socket.emit(
        "sleepPlayer",
        {
            roomCode:
                getCurrentRoomCode(),

            targetId:
                player.id
        }
    );

    document
        .querySelectorAll(
            ".role-selectable"
        )
        .forEach(
            selectableImage => {
                selectableImage.style.pointerEvents =
                    "none";

                selectableImage.style.cursor =
                    "default";
            }
        );

    return;
}

                // ========================================
// 🧓 الشيخ
// ========================================

if (isSheikh) {

    // منع التحقق مرة ثانية
    if (sheikhHasChecked) {
        return;
    }

    // إزالة الاختيار السابق
    document
        .querySelectorAll(".role-selected")
        .forEach(selected => {

            selected.classList.remove(
                "role-selected"
            );

        });

    // تحديد اللاعب المختار
    image.classList.add(
        "role-selected"
    );

    console.log(
        "🧓 الشيخ اختار:",
        player.name
    );

    // إرسال التحقق للسيرفر
    socket.emit(
        "sheikhCheck",
        {
            roomCode:
                getCurrentRoomCode(),

            targetId:
                player.id
        }
    );

    // منع تحقق آخر هذه الليلة
    sheikhHasChecked = true;

    // تعطيل باقي الصور
    document
        .querySelectorAll(
            ".role-selectable"
        )
        .forEach(
            selectableImage => {

                selectableImage.style.pointerEvents =
                    "none";

                selectableImage.style.cursor =
                    "default";

            }
        );

    return;
}

            }
        );

    }


    // ========================================
    // 🎭 الدور
    // يظهر للاعب نفسه فقط
    // ========================================

    const role =
        document.createElement("span");

    role.className =
        "my-role-badge";


    if (isMe) {

        role.textContent =
            getRoleDisplayName(
                currentRole
            );

    } else {

        role.textContent =
            "🎭 دور مخفي";

    }


    // ========================================
    // ترتيب البطاقة
    // ========================================

    card.appendChild(
        name
    );


    // ========================================
    // الصورة + رقم التصويت
    // ========================================

    const imageBox =
        document.createElement("div");

    imageBox.className =
        "side-player-image-box";


    // ========================================
    // 🗳️ رقم الأصوات فوق صورة اللاعب
    // ========================================

    if (
        currentPhase === "day"
    ) {

        const voteBadge =
            document.createElement("span");

        voteBadge.className =
            "side-vote-badge";

        voteBadge.textContent =
            "0";

        voteBadge.style.display =
            "none";

        imageBox.appendChild(
            voteBadge
        );

    }


    imageBox.appendChild(
        image
    );

    card.appendChild(
        imageBox
    );

    card.appendChild(
        role
    );


    // ========================================
    // ☠️ اللاعب الميت
    // ========================================

    if (!player.alive) {

        const dead =
            document.createElement("small");

        dead.textContent =
            "☠️ خرج من اللعبة";

        card.appendChild(
            dead
        );

    }


    // ========================================
    // إضافة البطاقة
    // ========================================

    container.appendChild(
        card
    );
}




        // ========================================
        // اسم الدور للاعب نفسه فقط
        // ========================================

        function getRoleDisplayName(role) {

    if (role === "🕵️ مافيا") {
        return "🕵️ مافيا";
    }

    if (role === "❤️ طبيب") {
        return "❤️ طبيب";
    }

    if (role === "👮 محقق") {
        return "👮 محقق";
    }

    if (role === "⚖️ محامي") {
        return "⚖️ محامي";
    }

    if (role === "🧓 شيخ") { return "🧓 شيخ"; }

    if (role === "💤 منوِّم") {
    return "💤 منوِّم";
}

    if (role === "👤 مدني") {
        return "👤 مدني";
    }

    return "🎭 دور مخفي";
}


        // ========================================
        // 🌙 بداية الليل
        // ========================================

        socket.on(
            "nightStarted",
            () => {

                console.log("🌙 بدأ الليل");

                // ========================================
            // 🔎 إعادة السماح للمحقق بالتحقيق
            // في هذه الليلة الجديدة
            // ========================================

            detectiveHasChecked = false;
lawyerHasProtected = false;
sheikhHasChecked = false;

                showGamePage();

                updateGamePhase(
                    "night"
                );

                // ========================================
                // إخفاء صندوق التصويت أثناء الليل
                // ========================================

                const votingArea =
                    document.getElementById(
                        "votingArea"
                    );

                if (votingArea) {
                    votingArea.style.display =
                        "none";
                }

                // ========================================
                // عناصر حالة اللعبة
                // ========================================

                const icon =
                    document.getElementById(
                        "gameStatusIcon"
                    );

                const title =
                    document.getElementById(
                        "gameStatusTitle"
                    );

                const message =
                    document.getElementById(
                        "gameStatusMessage"
                    );

                const actions =
                    document.getElementById(
                        "gameActionArea"
                    );

                if (icon) {
                    icon.textContent =
                        "🌙";
                }

                if (title) {
                    title.textContent =
                        "بدأ الليل";
                }

                if (message) {
                    message.textContent =
                        "انتظر التعليمات الخاصة بدورك.";
                }

                if (actions) {
                    actions.innerHTML =
                        "";
                }

            }
        );

        // ========================================
        // 🌙 تعليمات الليل
        // ========================================

        socket.on(
            "nightAction",
            data => {

            

                // ========================================
                // ☠️ اللاعب الميت
                // ========================================

                if (data.alive === false) {

                    const message =
                        document.getElementById(
                            "gameStatusMessage"
                        );

                    const actions =
                        document.getElementById(
                            "gameActionArea"
                        );

                    if (message) {

                        message.textContent =
                            "☠️ أنت خرجت من اللعبة.";

                    }

                    if (actions) {

                        actions.innerHTML = "";

                    }

                    return;
                }

                // ========================================
                // الدور الحالي
                // ========================================

                currentRole =
                    data.role;

                // ========================================
                // تحديث اللاعبين يمين ويسار
                // ========================================

                updateGamePlayers(
                    data.players || []
                );

                const icon =
                    document.getElementById(
                        "gameStatusIcon"
                    );

                const title =
                    document.getElementById(
                        "gameStatusTitle"
                    );

                const message =
                    document.getElementById(
                        "gameStatusMessage"
                    );

                const actions =
                    document.getElementById(
                        "gameActionArea"
                    );

                // ========================================
                // تنظيف منطقة الإجراءات
                // ========================================

                if (actions) {

                    actions.innerHTML = "";

                }

                // ========================================
                // 🕵️ المافيا
                // ========================================

                if (
                    data.role === "🕵️ مافيا"
                ) {

                    if (icon) {

                        icon.textContent =
                            "🕵️";

                    }

                    if (title) {

                        title.textContent =
                            "دور المافيا";

                    }

                    if (message) {

                        message.textContent =
                            "اضغط على صورة اللاعب الذي تريد قتله.";

                    }

                }

                // ========================================
                // ❤️ الطبيب
                // ========================================

                else if (
                    data.role === "❤️ طبيب"
                ) {

                    if (icon) {

                        icon.textContent =
                            "❤️";

                    }

                    if (title) {

                        title.textContent =
                            "دور الطبيب";

                    }

                    if (message) {

                        message.textContent =
                            "اضغط على صورة اللاعب الذي تريد إنقاذه.";

                    }

                }

                // ========================================
                // 👮 المحقق
                // ========================================

                else if (
                    data.role === "👮 محقق"
                ) {

                    if (icon) {

                        icon.textContent =
                            "👮";

                    }

                    if (title) {

                        title.textContent =
                            "دور المحقق";

                    }

                    if (message) {

                        message.textContent =
                            "اضغط على صورة اللاعب الذي تريد التحقيق معه.";

                    }

                }

                // ========================================
                // 👤 محامي
                // ========================================

                else if (
    data.role === "⚖️ محامي"
) {

    if (icon) {
        icon.textContent = "⚖️";
    }

    if (title) {
        title.textContent = "دور المحامي";
    }

    if (message) {
        message.textContent =
            "اضغط على صورة اللاعب الذي تريد حمايته هذه الليلة.";
    }
}

// ========================================
// 💤 المنوِّم
// ========================================

else if (
    data.role === "💤 منوِّم"
) {

    if (icon) {
        icon.textContent =
            "💤";
    }

    if (title) {
        title.textContent =
            "دور المنوِّم";
    }

    if (message) {
        message.textContent =
            "اضغط على صورة اللاعب الذي تريد تعطيل دوره الليلي.";
    }
}

                // ========================================
                // 👤 المدني
                // ========================================

                else {

                    if (icon) {

                        icon.textContent =
                            "👤";

                    }

                    if (title) {

                        title.textContent =
                            "أنت مدني";

                    }

                    if (message) {

                        message.textContent =
                            "ليس لديك إجراء في الليل. انتظر حتى الصباح.";

                    }

                }

            }
        );


        // ========================================
        // ☀️ بداية النهار
        // ========================================

        socket.on("dayStarted", data => {

            console.log(
                "☀️ بدأ النهار:",
                data
            );

            // ========================================
            // إعادة حالة التصويت
            // ========================================

            hasVoted = false;

            // ========================================
            // إظهار صفحة اللعبة
            // ========================================

            showOnlyPage(
                "gamePage"
            );

            // ========================================
            // تحديث المرحلة
            // ========================================

            updateGamePhase(
                "day"
            );

            // ========================================
            // تحديث اللاعبين في الجانبين
            // ========================================

            updateGamePlayers(
                data.players || []
            );

            // ========================================
            // إظهار صندوق التصويت في الوسط
            // ========================================

            const votingArea =
                document.getElementById(
                    "votingArea"
                );

            if (votingArea) {

                votingArea.style.display =
                    "block";

            }

            const sheikhWasiyaBtn =
    document.getElementById("sheikhSuspectBtn");

const sheikhNoSuspectBtn =
    document.getElementById("sheikhNoSuspectBtn");

if (sheikhWasiyaBtn) {
    sheikhWasiyaBtn.style.display = "none";
}

if (sheikhNoSuspectBtn) {
    sheikhNoSuspectBtn.style.display = "none";
}

            // ========================================
            // تنظيف قائمة التصويت القديمة
            // ========================================

            const votingList =
                document.getElementById(
                    "votingList"
                );

            if (votingList) {

                votingList.innerHTML =
                    "";

            }

        });


        // ========================================
        // إضافة زر إجراء
        // ========================================

        function addActionButton(
            container,
            text,
            callback
        ) {

            const button =
                document.createElement(
                    "button"
                );

            button.className =
                "game-action-button";

            button.textContent =
                text;

            button.onclick =
                callback;

            container.appendChild(
                button
            );
        }


        // ========================================
        // تحديث المرحلة
        // ========================================

        function updateGamePhase(
            phase
        ) {

            currentPhase =
                phase;

            const title =
                document.getElementById(
                    "gamePhaseTitle"
                );

            if (!title) {
                return;
            }

            if (
                phase === "night"
            ) {

                title.textContent =
                    "🌙 الليل";

            }

            else if (
                phase === "day"
            ) {

                title.textContent =
                    "☀️ النهار";

            }
        }


        // ========================================
        // Timer
        // ========================================

        socket.on(
            "phaseTimer",
            data => {

                const timer =
                    document.getElementById(
                        "gameTimer"
                    );

                if (!timer) {
                    return;
                }

                timer.textContent =
                    data.seconds;

                updateGamePhase(
                    data.phase
                );

                let remaining =
                    data.seconds;

                clearInterval(
                    window.gameTimerInterval
                );

                window.gameTimerInterval =
                    setInterval(
                        () => {

                            remaining--;

                            if (
                                remaining < 0
                            ) {
                                remaining = 0;
                            }

                            timer.textContent =
                                remaining;

                            if (
                                remaining <= 0
                            ) {

                                clearInterval(
                                    window.gameTimerInterval
                                );

                            }

                        },
                        1000
                    );
            }
        );


        // ========================================
// 🔎 نتيجة المحقق — داخل المساحة الوسطى
// ========================================

socket.on(
    "detectiveResult",
    data => {

        // ========================================
        // 💾 حفظ نتيجة التحقيق
        // ========================================

        detectiveResults[data.playerId] =
    data.role;


        const icon =
            document.getElementById(
                "gameStatusIcon"
            );

        const title =
            document.getElementById(
                "gameStatusTitle"
            );

        const message =
            document.getElementById(
                "gameStatusMessage"
            );

        const actions =
            document.getElementById(
                "gameActionArea"
            );


        // ========================================
        // 🖼️ تغيير صورة اللاعب الذي تم التحقيق معه
        // ========================================

        const card =
            document.querySelector(
                `.side-player-card[data-player-id="${data.playerId}"]`
            );

        if (card) {

            const image =
                card.querySelector(
                    ".side-player-image"
                );

            if (image) {

                image.src =
                    getRoleImage(
                        data.role
                    );

                image.alt =
                    getRoleDisplayName(
                        data.role
                    );

                image.classList.add(
                    "detective-result"
                );

            }


            // ========================================
            // 🎭 إظهار الدور الحقيقي للمحقق فقط
            // ========================================

            const roleBadge =
                card.querySelector(
                    ".my-role-badge"
                );

            if (roleBadge) {

                roleBadge.textContent =
                    getRoleDisplayName(
                        data.role
                    );

            }

        }


        // ========================================
        // 🔎 الأيقونة
        // ========================================

        if (icon) {

            icon.textContent =
                data.isMafia
                    ? "🕵️"
                    : "👤";

        }


        // ========================================
        // 🔎 العنوان
        // ========================================

        if (title) {

            title.textContent =
                "🔎 نتيجة التحقيق";

        }


        // ========================================
        // 🔎 الرسالة
        // ========================================

        if (message) {

            if (data.isMafia) {

                message.textContent =
                    `${data.playerName} هو 🕵️ مافيا!`;

            } else {

                message.textContent =
                    `${data.playerName} ليس مافيا.`;

            }

        }


        // ========================================
        // 🚫 إزالة أزرار الاختيار
        // ========================================

        if (actions) {

            actions.innerHTML = `
                <div class="detective-result-message">
                    ${
                        data.isMafia
                            ? "🕵️ تم اكتشاف المافيا."
                            : "👤 اللاعب ليس مافيا."
                    }
                </div>
            `;

        }

    }
);

// ========================================
// 🧓 نتيجة الشيخ
// ========================================

socket.on(
    "sheikhResult",
    data => {

        // ========================================
        // 💾 حفظ النتيجة
        // ========================================

        sheikhResultPlayerId =
            data.targetId;

        sheikhResultIsEvil =
            data.isEvil;

        


        // ========================================
        // 🎯 العثور على بطاقة اللاعب
        // ========================================

        const card =
            document.querySelector(
                `.side-player-card[data-player-id="${data.targetId}"]`
            );


        // ========================================
        // 🖼️ تغيير صورة اللاعب
        // ========================================

        if (card) {

    card.classList.remove(
        "sheikh-evil",
        "sheikh-good"
    );

    card.classList.add(
        data.isEvil
            ? "sheikh-evil"
            : "sheikh-good"
    );
}


        // ========================================
        // 📢 عرض النتيجة
        // ========================================

        const icon =
            document.getElementById(
                "gameStatusIcon"
            );

        const title =
            document.getElementById(
                "gameStatusTitle"
            );

        const message =
            document.getElementById(
                "gameStatusMessage"
            );

        const actions =
            document.getElementById(
                "gameActionArea"
            );


        // ========================================
        // 🧓 الأيقونة
        // ========================================

        if (icon) {

            icon.textContent =
                data.isEvil
                    ? "🔴"
                    : "🟢";

        }


        // ========================================
        // 🧓 العنوان
        // ========================================

        if (title) {

            title.textContent =
                "🧓 نتيجة الشيخ";

        }


        // ========================================
        // 🧓 الرسالة
        // ========================================

        if (message) {

            if (data.isEvil) {

                message.textContent =
                    `${data.targetName} شرير 🔴`;

            } else {

                message.textContent =
                    `${data.targetName} ليس شريرًا 🟢`;

            }

        }


        
// ========================================
// 🧓 اختيارات وصية الشيخ
// ========================================

if (actions) {

    actions.innerHTML = `
        <div class="sheikh-wasiya-actions">

            ${
                data.isEvil
                    ? `
                        <button
    class="game-action-btn sheikh-wasiya-btn"
    id="sheikhSuspectBtn"
>
    🧓 <span>وصيتي الليلية</span>
    <small>أنا أشك في ${data.targetName}</small>
</button>
                    `
                    : `
                        <button
    class="game-action-btn sheikh-wasiya-btn"
    id="sheikhNoSuspectBtn"
>
    🧓 <span>وصيتي الليلية</span>
    <small>أنا لا أشك في أحد</small>
</button>
                    `
            }

        </div>
    `;


    const suspectBtn =
        document.getElementById(
            "sheikhSuspectBtn"
        );


    if (suspectBtn) {

        suspectBtn.onclick = () => {

            socket.emit(
                "sheikhWasiya",
                {
                    roomCode:
                        getCurrentRoomCode(),

                    choice:
                        "suspect",

                    targetId:
                        data.targetId,

                    targetName:
                        data.targetName
                }
            );


            suspectBtn.disabled = true;


            suspectBtn.textContent =
                `🕵️ وصيتي: أنا أشك في ${data.targetName}`;

        };

    }


    const noSuspectBtn =
        document.getElementById(
            "sheikhNoSuspectBtn"
        );


    if (noSuspectBtn) {

        noSuspectBtn.onclick = () => {

            socket.emit(
                "sheikhWasiya",
                {
                    roomCode:
                        getCurrentRoomCode(),

                    choice:
                        "noSuspect"
                }
            );


            noSuspectBtn.disabled = true;


            noSuspectBtn.textContent =
                "👤 وصيتي: أنا لا أشك في أحد";

        };

    }

}




        console.log(
            "🧓 نتيجة الشيخ:",
            data.targetName,
            "→",
            data.isEvil
                ? "شرير"
                : "ليس شريرًا"
        );

    }
);


        // ========================================
        // نتيجة الليل
        // ========================================

        socket.on(
            "nightResult",
            data => {

                const icon =
                    document.getElementById(
                        "gameStatusIcon"
                    );

                const title =
                    document.getElementById(
                        "gameStatusTitle"
                    );

                const message =
                    document.getElementById(
                        "gameStatusMessage"
                    );

                if (data.killed) {

                    if (icon) {
                        icon.textContent =
                            "☠️";
                    }

                    if (title) {
                        title.textContent =
                            "حدثت جريمة";
                    }

                    if (message) {

                        message.textContent =
                            "تم القضاء على " +
                            data.playerName;
                    }

                } else {

                    if (icon) {
                        icon.textContent =
                            "❤️";
                    }

                    if (title) {
                        title.textContent =
                            "نجا الجميع";
                    }

                    if (message) {

                        message.textContent =
                            "الطبيب أنقذ الضحية.";
                    }
                }
            }
        );


        // ========================================
        // 🗳️ تحديث التصويت
        // ========================================

        socket.on("voteUpdated", data => {

            console.log(
                "🗳️ Vote Updated:",
                data
            );

            // ========================================
            // تحديث حالة التصويت العامة
            // ========================================

            updateVoteStatus(
                data.count || 0,
                data.total || 0
            );

            // ========================================
            // تحديث عدد الأصوات فوق كل لاعب
            // ========================================

            const votes =
                data.votes || {};

            document
                .querySelectorAll(
                    ".side-player-card"
                )
                .forEach(card => {

                    const playerId =
                        card.dataset.playerId;

                    const badge =
                        card.querySelector(
                            ".side-vote-badge"
                        );

                    if (!badge) {
                        return;
                    }

                    const playerVotes =
                        Number(
                            votes[playerId] || 0
                        );

                    badge.textContent =
                        playerVotes;

                    // إظهار الرقم فقط إذا كان هناك تصويت
                    if (playerVotes > 0) {

                        badge.style.display =
                            "flex";

                    } else {

                        badge.style.display =
                            "none";

                    }

                });

            // ========================================
            // تصويت اللاعب الحالي
            // ========================================

            if (
                data.voterId ===
                socket.id
            ) {

                hasVoted = true;

                // منع باقي صور التصويت
                document
                    .querySelectorAll(
                        ".vote-selectable"
                    )
                    .forEach(image => {

                        image.style.pointerEvents =
                            "none";

                        image.style.cursor =
                            "default";

                    });

                // تحديد اللاعب الذي صوتنا عليه
                const selectedCard =
                    document.querySelector(
                        `.side-player-card[data-player-id="${data.targetId}"]`
                    );

                if (selectedCard) {

                    const selectedImage =
                        selectedCard.querySelector(
                            ".side-player-image"
                        );

                    if (selectedImage) {

                        selectedImage.classList.add(
                            "vote-selected"
                        );

                    }

                }

            }

        });

        // ========================================
        // خطأ التصويت
        // ========================================

        socket.on(
            "voteError",
            message => {

                console.log(
                    "❌ خطأ التصويت:",
                    message
                );


                alert(
                    message
                );

            }
        );

        // ========================================
        // لاعب خرج
        // ========================================

        socket.on(
            "playerEliminated",
            data => {

                console.log(
                    "☠️ تم إقصاء:",
                    data.playerName
                );


                hasVoted = false;

                if (
    currentRole &&
    currentRole.includes("شيخ") &&
    data.playerId === socket.id
) {

    sheikhResultPlayerId =
        null;

    sheikhResultIsEvil =
        null;

}


                const message =
                    document.getElementById(
                        "gameStatusMessage"
                    );


                if (message) {

                    message.textContent =
                        `☠️ تم إقصاء ${data.playerName} من اللعبة.`;

                }


                // تحديث حالة اللاعب
const player =
    currentGamePlayers.find(
        player =>
            player.id === data.playerId
    );

if (player) {

    player.alive = false;

}

updateGamePlayers(
    currentGamePlayers
);

            }
        );


        // ========================================
        // تعادل
        // ========================================

        socket.on(
            "voteTie",
            data => {

                console.log(
                    "⚖️ حدث تعادل:",
                    data
                );


                hasVoted = false;


                const names =
                    (data.players || [])
                        .map(
                            player =>
                                player.name
                        )
                        .join(" و ");


                const message =
                    document.getElementById(
                        "gameStatusMessage"
                    );


                if (message) {

                    message.textContent =
                        `⚖️ تعادل بين ${names}. لم يتم إقصاء أي لاعب.`;

                }


                // تصفير أرقام الأصوات
                document
                    .querySelectorAll(
                        ".vote-badge"
                    )
                    .forEach(
                        badge => {

                            badge.textContent =
                                "0";

                        }
                    );


                // إزالة حالة التصويت
                document
                    .querySelectorAll(
                        ".vote-player-card"
                    )
                    .forEach(
                        card => {

                            card.classList.remove(
                                "vote-disabled"
                            );

                            card.classList.remove(
                                "my-vote"
                            );

                        }
                    );

            }
        );


        // ========================================
        // تأكيد المافيا
        // ========================================

        socket.on(
            "mafiaKillConfirmed",
            data => {

                const actions =
                    document.getElementById(
                        "gameActionArea"
                    );

                if (actions) {

                    actions.innerHTML =
                        `<p>
                            ☠️ اخترت قتل:
                            ${escapeHtml(data.targetName)}
                        </p>`;
                }
            }
        );


        // ========================================
        // تأكيد الطبيب
        // ========================================

        socket.on(
            "doctorSaveConfirmed",
            data => {

                const actions =
                    document.getElementById(
                        "gameActionArea"
                    );

                if (actions) {

                    actions.innerHTML =
                        `<p>
                            ❤️ اخترت إنقاذ:
                            ${escapeHtml(data.targetName)}
                        </p>`;
                }
            }
        );


        // ========================================
        // GAME OVER
        // ========================================

        socket.on(
            "gameOver",
            data => {

                hideAllPages();

                const page =
                    document.getElementById(
                        "gameOverPage"
                    );

                if (page) {
                    page.style.display =
                        "flex";
                }

                const winner =
                    document.getElementById(
                        "winnerMessage"
                    );

                if (winner) {

                    if (
                        data.winner ===
                        "mafia"
                    ) {

                        winner.innerHTML = `

                            <div class="winner-mafia">

                                <div class="winner-icon">
                                    🕵️
                                </div>

                                <h2>
                                    فازت المافيا!
                                </h2>

                                <p>
                                    تمكنت المافيا من السيطرة على المدينة.
                                </p>

                            </div>

                        `;

                    } else {

                        winner.innerHTML = `

                            <div class="winner-civilians">

                                <div class="winner-icon">
                                    👥
                                </div>

                                <h2>
                                    فاز المدنيون!
                                </h2>

                                <p>
                                    تم القضاء على جميع أفراد المافيا.
                                </p>

                            </div>

                        `;
                    }
                }

                const finalList =
                    document.getElementById(
                        "finalPlayersList"
                    );

                if (finalList) {

                    finalList.innerHTML =
                        "";

                    (data.players || [])
                        .forEach(
                            player => {

                                const div =
                                    document.createElement(
                                        "div"
                                    );

                                div.className =
                                    "final-player";

                                div.innerHTML = `

                                    <span>

                                        ${
                                            player.alive === false
                                                ? "☠️"
                                                : "🟢"
                                        }

                                        ${escapeHtml(
                                            player.name
                                        )}

                                    </span>

                                    <strong>
                                        ${escapeHtml(
                                            player.role || "—"
                                        )}
                                    </strong>

                                `;

                                finalList.appendChild(
                                    div
                                );

                            }
                        );
                }

            }
        );


        // ========================================
        // إعادة اللعبة
        // ========================================

        function restartGame() {

            if (
                socket.id !==
                currentHostId
            ) {

                alert(
                    "👑 فقط الـHost يستطيع بدء جولة جديدة."
                );

                return;
            }

            const roomCode =
                getCurrentRoomCode();

            if (!roomCode) {
                return;
            }

            socket.emit(
                "restartGame",
                roomCode
            );
        }


        // ========================================
        // إعادة اللعبة
        // ========================================

        socket.on(
            "gameRestarted",
            data => {

                currentRole =
                    null;

                currentPhase =
                    null;

                currentRoundRoles =
                    [];

                    detectiveHasChecked = false;
lawyerHasProtected = false;
detectiveResultPlayerId = null;
detectiveResultRole = null;

                hideAllPages();

                const roomPage =
                    document.getElementById(
                        "roomPage"
                    );

                if (roomPage) {

                    roomPage.style.display =
                        "flex";
                }

                currentHostId =
                    data.hostId;

                updatePlayers(
                    data.players
                );

            }
        );


        // ========================================
        // 🏠 الحصول على رمز الغرفة
        // ========================================

        function getCurrentRoomCode() {

            if (currentRoomCode) {
                return currentRoomCode;
            }

            const element =
                document.getElementById(
                    "roomCodeDisplay"
                );

            if (!element) {
                return "";
            }

            const code =
                element.textContent.trim();

            if (code) {
                currentRoomCode = code;
            }

            return currentRoomCode;
        }


        // ========================================
        // 🔄 إخفاء جميع الصفحات
        // ========================================

        function hideAllPages() {

            const pages = [
                "homePage",
                "roomPage",
                "waitingPage",
                "rolePage",
                "gamePage",
                "gameOverPage"
            ];

            pages.forEach(id => {

                const page =
                    document.getElementById(id);

                if (page) {

                    page.style.display =
                        "none";

                }

            });
        }


        // ========================================
        // إظهار صفحة واحدة
        // ========================================

        function showOnlyPage(
            pageId
        ) {

            hideAllPages();

            const page =
                document.getElementById(
                    pageId
                );

            if (page) {

                page.style.display =
                    "flex";
            }
        }


        // ========================================
        // حماية النصوص
        // ========================================

        function escapeHtml(
            value
        ) {

            return String(value)
                .replace(
                    /&/g,
                    "&amp;"
                )
                .replace(
                    /</g,
                    "&lt;"
                )
                .replace(
                    />/g,
                    "&gt;"
                )
                .replace(
                    /"/g,
                    "&quot;"
                )
                .replace(
                    /'/g,
                    "&#039;"
                );
        }

        // ==================================================
        // VOTING
        // ==================================================


        // ========================================
        // بدء التصويت
        // ========================================

        function setupVoting(players) {

            hasVoted = false;

            const votingList =
                document.getElementById(
                    "votingList"
                );

            if (!votingList) {
                return;
            }

            votingList.innerHTML = "";


            // ========================================
            // اللاعبين الأحياء فقط
            // ========================================

            const alivePlayers =
                players.filter(
                    player =>
                        player.alive !== false
                );


            // ========================================
            // اللاعب الحالي
            // ========================================

            const me =
                alivePlayers.find(
                    player =>
                        player.id === socket.id
                );


            // ========================================
            // إنشاء البطاقات
            // ========================================

                alivePlayers.forEach(
            player => {

                const card =
                    document.createElement(
                        "div"
                    );

                card.className =
                    "vote-player-card";

                card.dataset.playerId =
                    player.id;

                // ========================================
                // منع اللاعب من التصويت لنفسه في الواجهة
                // ========================================

                


                    // ========================================
                    // هل هذا اللاعب هو أنا؟
                    // ========================================

                    const isMe =
                        player.id === socket.id;


                    if (isMe) {

                        card.classList.add(
                            "self-vote"
                        );

                    }


                    // ========================================
                    // الصورة
                    // ========================================

                    const imageBox =
                        document.createElement(
                            "div"
                        );

                    imageBox.className =
                        "vote-image-box";


                    const img =
                        document.createElement(
                            "img"
                        );


                    img.src =
                        player.image ||
                        "images/default-player.png";


                    img.alt =
                        player.name;


                    img.onerror =
                        () => {

                            img.src =
                                "images/default-player.png";

                        };


                    // ========================================
                    // رقم الأصوات
                    // ========================================

                    const badge =
                        document.createElement(
                            "div"
                        );

                    badge.className =
                        "vote-badge";

                    badge.textContent =
                        "0";


                    imageBox.appendChild(
                        badge
                    );

                    imageBox.appendChild(
                        img
                    );


                    // ========================================
                    // اسم اللاعب
                    // ========================================

                    const name =
                        document.createElement(
                            "div"
                        );

                    name.className =
                        "vote-player-name";

                    name.textContent =
                        player.name;


                    // ========================================
                    // إذا كان اللاعب هو نفسه
                    // ========================================

                    if (isMe) {

                        const selfBadge =
                            document.createElement(
                                "span"
                            );

                        selfBadge.className =
                            "self-vote-badge";

                        selfBadge.textContent =
                            "أنت";

                        name.appendChild(
                            selfBadge
                        );


                        const warning =
                            document.createElement(
                                "small"
                            );

                        warning.className =
                            "self-vote-warning";

                        warning.textContent =
                            "لا يمكنك التصويت لنفسك";

                        card.appendChild(
                            imageBox
                        );

                        card.appendChild(
                            name
                        );

                        card.appendChild(
                            warning
                        );

                    }

                    else {

                        card.appendChild(
                            imageBox
                        );

                        card.appendChild(
                            name
                        );

                    }


                    // ========================================
                    // الضغط على البطاقة
                    // ========================================

                    if (!isMe) {

                        card.addEventListener(
            "click",
            () => {

                // منع التصويت للنفس من الواجهة
                if (player.id === socket.id) {

                    return;
                }

                voteForPlayer(
                    player.id
                );

            }
        );

                    }


                    // ========================================
                    // منع الضغط على اللاعب نفسه
                    // ========================================

                    else {

                        card.style.cursor =
                            "not-allowed";

                    }


                    votingList.appendChild(
                        card
                    );

                }
            );


            updateVoteStatus(
                0,
                alivePlayers.length
            );
        }


        // ========================================
        // التصويت للاعب
        // ========================================

        function voteForPlayer(
            targetId
        ) {

            // ========================================
            // اللاعب صوت بالفعل
            // ========================================

            if (hasVoted) {
                return;
            }

            // ========================================
            // منع التصويت للنفس
            // ========================================

            if (targetId === socket.id) {

                alert(
                    "⚠️ لا يمكنك التصويت لنفسك."
                );

                return;
            }

            // ========================================
            // التحقق من رمز الغرفة
            // ========================================

            const roomCode =
                getCurrentRoomCode();

            if (!roomCode) {

                console.log(
                    "❌ رمز الغرفة غير موجود."
                );

                return;
            }

            // ========================================
            // إرسال التصويت للسيرفر
            // ========================================

            socket.emit(
                "votePlayer",
                {
                    roomCode:
                        roomCode,

                    targetId:
                        targetId
                }
            );
        }

        function updateVoteStatus(
            count,
            total
        ) {

            const status =
                document.getElementById(
                    "voteStatus"
                );

            if (!status) {
                return;
            }


            if (count === 0) {

                status.textContent =
                    "لم يصوت أحد بعد.";

                return;
            }


            status.textContent =
                `🗳️ تم التصويت من ${count} من ${total} لاعبين`;
        }

        // ==================================================
// 📜 سجل أحداث اللعبة
// ==================================================

function addGameEvent(message, type = "") {

    const list =
        document.getElementById("gameEventsList");

    if (!list) return;

    // حذف الرسالة الأولى
    // "لا توجد أحداث بعد..."
    const empty =
        list.querySelector(".game-event.empty");

    if (empty) {
        empty.remove();
    }

    const event =
        document.createElement("div");

    event.className =
        `game-event ${type}`;

    event.textContent =
        message;

    list.appendChild(event);

    // النزول لآخر حدث
    list.scrollTop =
        list.scrollHeight;
}

// ==================================================
// 📜 أحداث مراحل اللعبة
// ==================================================

socket.on("nightStarted", () => {
    addGameEvent("🌙 بدأ الليل.", "night");
});

socket.on("dayStarted", () => {
    addGameEvent("☀️ بدأ النهار.", "day");
});

socket.on("gameEvent", ({ message, type }) => {
    addGameEvent(message, type);
});


// ========================================
// 🧓 وصية الشيخ في سجل الأحداث
// ========================================

socket.on(
    "sheikhWasiyaResult",
    data => {

        const message =
            data.choice === "suspect"
                ? `🧓 وصية ${data.playerName}: أنا أشك في ${data.targetName}`
                : `🧓 وصية ${data.playerName}: أنا لا أشك في أحد`;

        addGameEvent(
            message,
            "night"
        );

        console.log(
            "🧓 وصية الشيخ:",
            message
        );

    }
);



function getRoleDescription(role) {

    if (!role) {
        return "";
    }

    if (role.includes("مافيا")) {

        return "اقضِ على اللاعبين الأبرياء سرًا، وحاول ألا يكتشف اللاعبون حقيقتك.";
    }

    if (role.includes("طبيب")) {

        return "اختر لاعبًا كل ليلة لإنقاذه من القتل. ساعد الأبرياء على البقاء حتى النهاية.";
    }

    if (role.includes("محقق")) {

        return "حقق مع لاعب واحد كل ليلة لمعرفة ما إذا كان من المافيا.";
    }

    if (role.includes("محامي")) {

    return "احمِ لاعبًا أثناء الليل وساعد فريق المدنيين على كشف المافيا.";
}

if (role.includes("شيخ")) { return "تحقق من لاعب واحد كل ليلة لمعرفة ما إذا كان شريرًا."; }

if (role.includes("منوِّم")) {
    return "اختر لاعبًا كل ليلة لتعطيل دوره الليلي. وفي النهار يستطيع التصويت بشكل عادي.";
}

    if (role.includes("مدني")) {

        return "ساعد في اكتشاف المافيا من خلال النقاش والتصويت، وحاول البقاء على قيد الحياة.";
    }

    return "";
}

// ========================================
// ⚖️ حماية لاعب بواسطة المحامي
// ========================================

function lawyerProtect(targetId, targetName) {

    const roomCode =
        getCurrentRoomCode();

    if (!roomCode) {

        console.error(
            "❌ رمز الغرفة غير موجود."
        );

        return;
    }

    // إرسال اختيار المحامي إلى السيرفر
    socket.emit(
        "lawyerProtect",
        {
            roomCode:
                roomCode,

            targetId:
                targetId
        }
    );

    // منطقة إجراءات الليل
    const actions =
        document.getElementById(
            "gameActionArea"
        );

    if (actions) {

        actions.innerHTML = `
            <div class="action-confirmed">
                ⚖️ تم اختيار اللاعب
                <strong>
                    ${escapeHtml(targetName)}
                </strong>
                للحماية هذه الليلة.
            </div>
        `;

    }

    console.log(
        "⚖️ المحامي اختار حماية:",
        targetName
    );
}

socket.on(
    "lawyerProtectConfirmed",
    data => {

        const actions =
            document.getElementById(
                "gameActionArea"
            );

        if (actions) {

            actions.innerHTML = `
                <div class="action-confirmed">
                    ⚖️ تم اختيار
                    <strong>
                        ${escapeHtml(
                            data.targetName
                        )}
                    </strong>
                    للحماية من الإقصاء.
                </div>
            `;
        }
    }
);

function register() {

    const username =
        document
            .getElementById(
                "accountUsername"
            )
            .value
            .trim();

    const password =
        document
            .getElementById(
                "accountPassword"
            )
            .value;

    socket.emit(
        "register",
        {
            username,
            password
        }
    );
}

function login() {

    const username =
        document
            .getElementById(
                "accountUsername"
            )
            .value
            .trim();

    const password =
        document
            .getElementById(
                "accountPassword"
            )
            .value;

    socket.emit(
        "login",
        {
            username,
            password
        }
    );
}

socket.on(
    "registerResult",
    result => {

        const message =
            document
                .getElementById(
                    "accountMessage"
                );

        if (
            !result.success
        ) {
            message.textContent =
                result.message;

            return;
        }

        message.textContent =
            "✅ تم إنشاء الحساب. يمكنك الآن تسجيل الدخول.";
    }
);

socket.on(
    "loginResult",
    result => {

        const message =
            document
                .getElementById(
                    "accountMessage"
                );

        if (
            !result.success
        ) {
            message.textContent =
                result.message;

            return;
        }

        if (result.isAdmin) {
    window.location.href = "admin.html";
    return;
}

        currentAccountUsername =
            result.account.username;

        currentPlayerName =
            result.account.username;

            if (
    result.isAdmin
) {
    window.location.href =
        "/admin.html";

    return;
}

            document
    .getElementById(
        "homeMenu"
    )
    .style.display =
        "block";

            document
    .getElementById(
        "playerName"
    )
    .value =
    currentAccountUsername;

        document
            .getElementById(
                "accountSection"
            )
            .style.display =
                "none";

        document
            .getElementById(
                "homeMessage"
            )
            .textContent =
                `مرحبًا ${currentAccountUsername}`;
    }
);

socket.on(
    "friendsRoomsData",
    data => {

        const container =
            document.getElementById(
                "friendsRoomsList"
            );

        if (!container) {
            return;
        }

        container.innerHTML = "";

        if (
            !data.rooms ||
            data.rooms.length === 0
        ) {

            container.innerHTML =
                "<p>لا توجد غرف أصدقاء جاهزة حاليًا.</p>";

            return;
        }

        data.rooms.forEach(
            room => {

                const div =
                    document.createElement(
                        "div"
                    );

                div.innerHTML = `
                    <div>
                        🏠 غرفة ${escapeHtml(
                            room.hostName
                        )}

                        <span>
                            ${room.playerCount}/15
                        </span>
                    </div>

                    <button
                        onclick="joinReadyRoom('${room.roomCode}')"
                    >
                        🚪 انضمام
                    </button>
                `;

                container.appendChild(
                    div
                );
            }
        );
    }
);

function leaveCurrentRoom() {

    if (
        currentRoomCode
    ) {

        socket.emit(
            "leaveRoom",
            {
                roomCode:
                    currentRoomCode
            }
        );
    }

    socket.emit(
    "getFriends"
);

socket.emit(
    "getFriendsRooms"
);

    const roomPage =
        document.getElementById(
            "roomPage"
        );

    const homePage =
        document.getElementById(
            "homePage"
        );

    if (roomPage) {
        roomPage.style.display =
            "none";
    }

    if (homePage) {
        homePage.style.display =
            "flex";
    }

    const readyRoomsList =
        document.getElementById(
            "readyRoomsList"
        );

    if (readyRoomsList) {
        readyRoomsList.innerHTML =
            "";
    }

    currentRoomCode = "";
    currentHostId = null;
}



