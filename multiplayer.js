(function () {
	var multiplayer = {
		mode: "idle",
		started: false,
		roomCode: "",
		localSeat: 1,
		peer: null,
		hostConnection: null,
		connections: {},
		seatAssignments: {},
		latestDice: { die1: null, die2: null },
		currentSnapshot: null,
		broadcastTimer: null,
		observer: null
	};

	var playerDefaults = [];
	var setupMounted = false;

	function byId(id) {
		return document.getElementById(id);
	}

	function saveProfileName(name) {
		if (name) {
			localStorage.setItem("monopoly-profile-name", name);
		}
	}

	function loadProfileName() {
		return localStorage.getItem("monopoly-profile-name") || "Player 1";
	}

	function randomRoomCode() {
		var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
		var code = "";
		for (var i = 0; i < 6; i++) {
			code += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		return code;
	}

	function getUrlRoomCode() {
		try {
			return new URLSearchParams(window.location.search).get("room") || "";
		} catch (error) {
			return "";
		}
	}

	function updateShareUrl() {
		var code = multiplayer.roomCode || "";
		var url = new URL(window.location.href);
		if (code) {
			url.searchParams.set("room", code);
		} else {
			url.searchParams.delete("room");
		}
		window.history.replaceState({}, "", url.toString());
	}

	function setLobbyMessage(text, tone) {
		var el = byId("lobby-message");
		if (!el) {
			return;
		}
		el.textContent = text;
		el.setAttribute("data-tone", tone || "neutral");
	}

	function setStatus(text, detail) {
		var title = byId("table-status-title");
		var meta = byId("table-status-meta");
		if (title) {
			title.textContent = text;
		}
		if (meta) {
			meta.textContent = detail || "";
		}
		updateBoardHud();
	}

	function seatLabel(seat) {
		return "Seat " + seat;
	}

	function buildShell() {
		if (byId("app-shell")) {
			return;
		}

		document.body.classList.add("tabletop-body");

		var appShell = document.createElement("div");
		appShell.id = "app-shell";

		var hero = document.createElement("section");
		hero.id = "table-hero";
		hero.innerHTML =
			"<div class='hero-copy'>" +
			"<p class='eyebrow'>Tabletop Edition</p>" +
			"<h1>Monopoly, rebuilt for live rooms.</h1>" +
			"<p class='hero-text'>Create a room, share a code or link, and play on a polished board with synced turns across browsers.</p>" +
			"</div>" +
			"<div id='table-status-card'>" +
			"<div id='table-status-title'>Choose a room mode</div>" +
			"<div id='table-status-meta'>Host a table or join one with a code.</div>" +
			"</div>";

		var main = document.createElement("main");
		main.id = "experience-shell";

		var lobby = document.createElement("section");
		lobby.id = "lobby-screen";
		lobby.innerHTML =
			"<div class='lobby-column mode-column'>" +
			"<div class='panel-card'>" +
			"<div class='panel-kicker'>Room setup</div>" +
			"<h2>Play together from anywhere</h2>" +
			"<p class='panel-copy'>The host runs the room and shares a code or invite link. Everyone else joins a seat and the board stays in sync.</p>" +
			"<div class='stack-actions'>" +
			"<button id='create-room-button' class='primary-action'>Create room</button>" +
			"<button id='local-game-button' class='secondary-action'>Play on one device</button>" +
			"</div>" +
			"<div class='join-panel'>" +
			"<label class='field-label' for='join-room-code'>Room code</label>" +
			"<input id='join-room-code' class='text-field code-field' maxlength='12' placeholder='ABC123' />" +
			"<label class='field-label' for='join-player-name'>Your name</label>" +
			"<input id='join-player-name' class='text-field' maxlength='16' placeholder='Player name' />" +
			"<label class='field-label' for='join-seat-select'>Preferred seat</label>" +
			"<select id='join-seat-select' class='text-field'></select>" +
			"<button id='join-room-button' class='ghost-action'>Join room</button>" +
			"</div>" +
			"<div id='lobby-message' class='lobby-message' data-tone='neutral'>Create a room to become the host, or join one with a room code.</div>" +
			"</div>" +
			"</div>" +
			"<div class='lobby-column config-column'>" +
			"<div class='panel-card'>" +
			"<div class='panel-kicker'>Table config</div>" +
			"<div class='room-heading'>" +
			"<div>" +
			"<h2>Seats and invites</h2>" +
			"<p class='panel-copy'>Tune player slots, colors, and AI seats before the host starts the match.</p>" +
			"</div>" +
			"<div id='share-strip' class='share-strip hidden'>" +
			"<div><span class='share-label'>Room</span><strong id='room-code-display'>------</strong></div>" +
			"<button id='copy-room-link-button' class='mini-action'>Copy invite</button>" +
			"</div>" +
			"</div>" +
			"<div id='setup-mount'></div>" +
			"<div class='panel-divider'></div>" +
			"<div id='room-roster' class='room-roster'></div>" +
			"<div class='stack-actions compact-actions'>" +
			"<button id='start-room-button' class='primary-action' disabled='disabled'>Start room</button>" +
			"</div>" +
			"</div>" +
			"</div>";

		var gameShell = document.createElement("section");
		gameShell.id = "game-shell";

		var boardStage = document.createElement("div");
		boardStage.id = "board-stage";
		boardStage.innerHTML = "" +
			"<div id='board-hud'>" +
			"<div class='board-chip'><span class='chip-label'>Mode</span><strong id='hud-mode'>Lobby</strong></div>" +
			"<div class='board-chip'><span class='chip-label'>Room</span><strong id='hud-room-code'>Local</strong></div>" +
			"<div class='board-chip'><span class='chip-label'>Seat</span><strong id='hud-seat'>Seat 1</strong></div>" +
			"<div class='board-chip highlight-chip'><span class='chip-label'>Turn</span><strong id='hud-turn'>Waiting</strong></div>" +
			"</div>" +
			"<div id='board-centerpiece'>" +
			"<div class='centerpiece-badge'>Live Table</div>" +
			"<div class='centerpiece-title'>Build. Trade. Bankrupt the board.</div>" +
			"<div class='centerpiece-subtitle'>Multiplayer rooms, private invites, and the full classic economy.</div>" +
			"</div>" +
			"<div id='board-frame'></div>";

		var sidebarStage = document.createElement("div");
		sidebarStage.id = "sidebar-stage";
		sidebarStage.innerHTML = "" +
			"<section id='sidebar-summary' class='sidebar-card'>" +
			"<div class='sidebar-card-label'>Table pulse</div>" +
			"<div class='sidebar-summary-grid'>" +
			"<div class='summary-item'><span>Room</span><strong id='sidebar-room-code'>Local</strong></div>" +
			"<div class='summary-item'><span>Your seat</span><strong id='sidebar-seat'>Seat 1</strong></div>" +
			"<div class='summary-item wide'><span>Status</span><strong id='sidebar-status'>Waiting in lobby</strong></div>" +
			"</div>" +
			"</section>" +
			"<section id='sidebar-money-panel' class='sidebar-card'><div class='sidebar-card-label'>Players</div></section>" +
			"<section id='sidebar-control-panel' class='sidebar-card'><div class='sidebar-card-label'>Actions</div></section>" +
			"<section id='sidebar-trade-panel' class='sidebar-card'><div class='sidebar-card-label'>Trade desk</div></section>";

		main.appendChild(lobby);
		main.appendChild(gameShell);
		gameShell.appendChild(boardStage);
		gameShell.appendChild(sidebarStage);

		appShell.appendChild(hero);
		appShell.appendChild(main);

		document.body.insertBefore(appShell, document.body.firstChild);

		var mount = byId("setup-mount");
		var setup = byId("setup");
		if (mount && setup && !setupMounted) {
			mount.appendChild(setup);
			setupMounted = true;
		}

		byId("board-frame").appendChild(byId("board"));
		byId("sidebar-money-panel").appendChild(byId("moneybarwrap"));
		byId("sidebar-control-panel").appendChild(byId("control"));
		byId("sidebar-trade-panel").appendChild(byId("trade"));

		byId("refresh").classList.add("floating-note");
		byId("noscript").classList.add("floating-note");
		byId("share-strip").classList.add("hidden");
		gameShell.style.display = "none";
		refreshJoinSeatOptions();
		updateBoardHud();
	}

	function updateBoardHud() {
		var modeEl = byId("hud-mode");
		var roomEl = byId("hud-room-code");
		var seatEl = byId("hud-seat");
		var turnEl = byId("hud-turn");
		var sideRoomEl = byId("sidebar-room-code");
		var sideSeatEl = byId("sidebar-seat");
		var sideStatusEl = byId("sidebar-status");
		var roomText = multiplayer.roomCode || "Local";
		var seatText = seatLabel(multiplayer.localSeat || 1);
		var modeText = multiplayer.started ? "In game" : multiplayer.mode === "host" ? "Hosting" : multiplayer.mode === "client" ? "Joined" : multiplayer.mode === "local" ? "Hotseat" : "Lobby";
		var turnText = "Waiting";
		var sideStatusText = "Waiting in lobby";

		if (multiplayer.started && typeof turn !== "undefined" && typeof player !== "undefined" && player[turn]) {
			turnText = player[turn].name ? player[turn].name + " to play" : seatLabel(turn) + " to play";
			sideStatusText = turnText;
		} else if (multiplayer.mode === "host") {
			sideStatusText = "Invite players and start when the table is ready";
		} else if (multiplayer.mode === "client") {
			sideStatusText = "Seat locked in. Waiting for the host";
		} else if (multiplayer.mode === "local") {
			sideStatusText = "Hotseat match ready on this device";
		}

		if (modeEl) {
			modeEl.textContent = modeText;
		}
		if (roomEl) {
			roomEl.textContent = roomText;
		}
		if (seatEl) {
			seatEl.textContent = seatText;
		}
		if (turnEl) {
			turnEl.textContent = turnText;
		}
		if (sideRoomEl) {
			sideRoomEl.textContent = roomText;
		}
		if (sideSeatEl) {
			sideSeatEl.textContent = seatText;
		}
		if (sideStatusEl) {
			sideStatusEl.textContent = sideStatusText;
		}
	}

	function refreshJoinSeatOptions() {
		var select = byId("join-seat-select");
		if (!select) {
			return;
		}
		select.innerHTML = "";
		for (var seat = 2; seat <= 8; seat++) {
			var option = document.createElement("option");
			option.value = String(seat);
			option.textContent = seatLabel(seat);
			select.appendChild(option);
		}
	}

	function playerConfig(seat) {
		return {
			name: byId("player" + seat + "name").value,
			color: byId("player" + seat + "color").value,
			ai: byId("player" + seat + "ai").value
		};
	}

	function getHumanSeatCount() {
		return parseInt(byId("playernumber").value, 10);
	}

	function syncJoinFields() {
		var hostName = loadProfileName();
		byId("join-player-name").value = hostName;
		if (byId("player1name").value === "Player 1") {
			byId("player1name").value = hostName;
		}
	}

	function buildRosterState() {
		var seats = [];
		var count = getHumanSeatCount();
		for (var seat = 1; seat <= count; seat++) {
			var config = playerConfig(seat);
			var occupant = multiplayer.seatAssignments[seat] || null;
			seats.push({
				seat: seat,
				name: config.name,
				color: config.color,
				ai: config.ai,
				occupied: !!occupant,
				occupantName: occupant ? occupant.name : "",
				isHost: occupant ? occupant.role === "host" : false,
				isYou: occupant ? occupant.peerId === getLocalPeerId() || occupant.role === "host" && multiplayer.mode === "host" : false
			});
		}
		return { count: count, seats: seats };
	}

	function renderRoster(state) {
		var roster = byId("room-roster");
		if (!roster || !state) {
			return;
		}

		var html = "";
		for (var i = 0; i < state.seats.length; i++) {
			var seat = state.seats[i];
			var badge = seat.ai === "1" && !seat.occupied ? "AI" : seat.occupied ? seat.isHost ? "Host" : "Joined" : "Open";
			var liveName = seat.occupied ? seat.occupantName : seat.name;
			html +=
				"<article class='seat-card'>" +
				"<div class='seat-swatch' style='background:" + seat.color + ";'></div>" +
				"<div class='seat-meta'>" +
				"<div class='seat-line'><strong>" + seatLabel(seat.seat) + "</strong><span class='seat-badge'>" + badge + "</span></div>" +
				"<div class='seat-name'>" + escapeHtml(liveName) + "</div>" +
				"</div>" +
				"</article>";
		}
		roster.innerHTML = html;
	}

	function escapeHtml(text) {
		return String(text)
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#39;");
	}

	function setLobbyEnabled(isHost) {
		var disabled = !isHost;
		var count = getHumanSeatCount();
		for (var seat = 1; seat <= 8; seat++) {
			byId("player" + seat + "name").disabled = disabled || byId("player" + seat + "ai").value !== "0";
			byId("player" + seat + "color").disabled = disabled;
			byId("player" + seat + "ai").disabled = disabled || seat === 1;
		}
		byId("playernumber").disabled = disabled;
		byId("start-room-button").disabled = !isHost;
		for (var hideSeat = count + 1; hideSeat <= 8; hideSeat++) {
			byId("player" + hideSeat + "input").style.display = "none";
		}
	}

	function updateLobbyUI() {
		renderRoster(buildRosterState());
		var shareStrip = byId("share-strip");
		var roomCodeDisplay = byId("room-code-display");
		if (multiplayer.roomCode) {
			shareStrip.classList.remove("hidden");
			roomCodeDisplay.textContent = multiplayer.roomCode;
		} else {
			shareStrip.classList.add("hidden");
			roomCodeDisplay.textContent = "------";
		}
	}

	function getLocalPeerId() {
		if (multiplayer.mode === "host") {
			return multiplayer.roomCode || "";
		}
		return multiplayer.peer ? multiplayer.peer.id : "";
	}

	function lobbySnapshot() {
		return {
			stage: "lobby",
			roomCode: multiplayer.roomCode,
			mode: "hosted",
			localSeat: multiplayer.localSeat,
			seats: buildRosterState().seats,
			playerCount: getHumanSeatCount(),
			started: multiplayer.started
		};
	}

	function broadcastLobbyState() {
		if (multiplayer.mode !== "host") {
			return;
		}
		updateLobbyUI();
		var payload = { type: "lobby-state", snapshot: lobbySnapshot() };
		eachConnection(function (conn) {
			sendSafe(conn, payload);
		});
	}

	function eachConnection(callback) {
		var ids = Object.keys(multiplayer.connections);
		for (var i = 0; i < ids.length; i++) {
			callback(multiplayer.connections[ids[i]], ids[i]);
		}
	}

	function sendSafe(connection, payload) {
		if (connection && connection.open) {
			connection.send(payload);
		}
	}

	function createHostPeer(code, retries) {
		retries = retries || 0;
		multiplayer.peer = new Peer(code);

		multiplayer.peer.on("open", function (id) {
			multiplayer.mode = "host";
			multiplayer.roomCode = id;
			multiplayer.localSeat = 1;
			multiplayer.seatAssignments = {
				1: { name: byId("player1name").value, role: "host", peerId: id }
			};
			updateShareUrl();
			setLobbyEnabled(true);
			updateLobbyUI();
			renderRoster(buildRosterState());
			setLobbyMessage("Room " + id + " is live. Share the invite and start when your table is ready.", "good");
			setStatus("Hosting room " + id, "Share the code or invite link, then start when everyone is seated.");
			broadcastLobbyState();
		});

		multiplayer.peer.on("connection", function (connection) {
			multiplayer.connections[connection.peer] = connection;
			connection.on("data", function (message) {
				handleHostMessage(connection, message);
			});
			connection.on("close", function () {
				removeSeatByPeer(connection.peer);
				delete multiplayer.connections[connection.peer];
				broadcastLobbyState();
			});
		});

		multiplayer.peer.on("error", function (error) {
			if (error && error.type === "unavailable-id" && retries < 3) {
				createHostPeer(randomRoomCode(), retries + 1);
				return;
			}
			setLobbyMessage("Could not create the room. Please try again.", "bad");
			console.error(error);
		});
	}

	function removeSeatByPeer(peerId) {
		var keys = Object.keys(multiplayer.seatAssignments);
		for (var i = 0; i < keys.length; i++) {
			var seat = parseInt(keys[i], 10);
			var assignment = multiplayer.seatAssignments[seat];
			if (assignment && assignment.peerId === peerId && seat !== 1) {
				delete multiplayer.seatAssignments[seat];
				if (byId("player" + seat + "name")) {
					byId("player" + seat + "name").value = "Player " + seat;
				}
			}
		}
		updateLobbyUI();
	}

	function applyRemoteSeat(seat, name) {
		byId("player" + seat + "name").value = name;
		byId("player" + seat + "ai").value = "0";
		byId("player" + seat + "name").disabled = true;
	}

	function handleHostMessage(connection, message) {
		if (!message || !message.type) {
			return;
		}
		if (message.type === "join-request") {
			var seat = parseInt(message.seat, 10);
			if (!seat || seat < 2 || seat > getHumanSeatCount()) {
				sendSafe(connection, { type: "join-denied", reason: "That seat is not available." });
				return;
			}
			if (multiplayer.seatAssignments[seat]) {
				sendSafe(connection, { type: "join-denied", reason: "That seat is already taken." });
				return;
			}
			multiplayer.seatAssignments[seat] = {
				name: (message.name || ("Player " + seat)).slice(0, 16),
				role: "guest",
				peerId: connection.peer
			};
			connection.seat = seat;
			applyRemoteSeat(seat, multiplayer.seatAssignments[seat].name);
			sendSafe(connection, {
				type: "join-accepted",
				seat: seat,
				roomCode: multiplayer.roomCode,
				snapshot: lobbySnapshot()
			});
			broadcastLobbyState();
			setLobbyMessage(multiplayer.seatAssignments[seat].name + " joined " + seatLabel(seat) + ".", "good");
			return;
		}

		if (message.type === "dom-action" && multiplayer.started) {
			if (!connection.seat) {
				return;
			}
			if (!canSeatControlAction(connection.seat, message.action)) {
				return;
			}
			applyRemoteDomAction(message.action);
			return;
		}
	}

	function canSeatControlAction(seat, action) {
		if (!action) {
			return false;
		}
		var id = action.id || "";
		if (id === "viewstats" || id === "statsclose") {
			return true;
		}
		return seat === turn;
	}

	function attachLobbyEvents() {
		byId("create-room-button").addEventListener("click", function () {
			if (multiplayer.peer) {
				return;
			}
			saveProfileName(byId("player1name").value);
			setLobbyMessage("Creating your room and reserving the host seat.", "neutral");
			createHostPeer(randomRoomCode());
		});

		byId("local-game-button").addEventListener("click", function () {
			multiplayer.mode = "local";
			multiplayer.roomCode = "";
			multiplayer.localSeat = 1;
			multiplayer.started = false;
			updateShareUrl();
			setLobbyEnabled(true);
			setLobbyMessage("Local hotseat mode is ready. Start when you want.", "good");
			setStatus("Local hotseat mode", "All turns are played on this device.");
		});

		byId("join-room-button").addEventListener("click", function () {
			joinHostedRoom();
		});

		byId("copy-room-link-button").addEventListener("click", function () {
			var url = window.location.href;
			if (navigator.clipboard && navigator.clipboard.writeText) {
				navigator.clipboard.writeText(url);
				setLobbyMessage("Invite link copied. Send it to the table.", "good");
				return;
			}
			window.prompt("Copy this invite link:", url);
		});

		byId("start-room-button").addEventListener("click", function () {
			if (multiplayer.mode === "host" || multiplayer.mode === "local" || multiplayer.mode === "idle") {
				startGameFromLobby();
			}
		});

		byId("join-room-code").value = getUrlRoomCode().toUpperCase();
		syncJoinFields();

		byId("playernumber").addEventListener("change", function () {
			if (typeof playernumber_onchange === "function") {
				playernumber_onchange();
			}
			updateLobbyUI();
			broadcastLobbyState();
		});

		for (var seat = 1; seat <= 8; seat++) {
			wireSeatField(seat);
		}
	}

	function wireSeatField(seat) {
		byId("player" + seat + "name").addEventListener("input", function () {
			if (seat === 1) {
				saveProfileName(this.value);
			}
			updateLobbyUI();
			broadcastLobbyState();
		});
		byId("player" + seat + "color").addEventListener("change", function () {
			updateLobbyUI();
			broadcastLobbyState();
		});
		byId("player" + seat + "ai").addEventListener("change", function () {
			byId("player" + seat + "name").disabled = this.value !== "0" || multiplayer.mode !== "host" && multiplayer.mode !== "local" && multiplayer.mode !== "idle";
			updateLobbyUI();
			broadcastLobbyState();
		});
	}

	function joinHostedRoom() {
		var roomCode = byId("join-room-code").value.toUpperCase().trim();
		var playerName = byId("join-player-name").value.trim() || "Guest";
		var preferredSeat = parseInt(byId("join-seat-select").value, 10);

		if (!roomCode) {
			setLobbyMessage("Enter a room code to join the table.", "bad");
			return;
		}

		saveProfileName(playerName);
		setLobbyMessage("Connecting to room " + roomCode + ".", "neutral");
		setStatus("Joining room " + roomCode, "Waiting for the host to accept your seat request.");

		multiplayer.mode = "client";
		multiplayer.roomCode = roomCode;
		multiplayer.localSeat = preferredSeat;
		multiplayer.peer = new Peer();
		multiplayer.peer.on("open", function () {
			multiplayer.hostConnection = multiplayer.peer.connect(roomCode, { reliable: true });
			multiplayer.hostConnection.on("open", function () {
				sendSafe(multiplayer.hostConnection, {
					type: "join-request",
					seat: preferredSeat,
					name: playerName
				});
			});
			multiplayer.hostConnection.on("data", handleClientMessage);
			multiplayer.hostConnection.on("close", function () {
				setLobbyMessage("The host disconnected.", "bad");
				setStatus("Room closed", "Reconnect with a new invite if the host restarts the table.");
			});
		});
		multiplayer.peer.on("error", function (error) {
			setLobbyMessage("Could not join the room. Check the code and try again.", "bad");
			console.error(error);
		});
	}

	function handleClientMessage(message) {
		if (!message || !message.type) {
			return;
		}
		if (message.type === "join-accepted") {
			multiplayer.localSeat = message.seat;
			updateShareUrl();
			setLobbyMessage("You joined " + seatLabel(message.seat) + ". Waiting for the host to start the game.", "good");
			setStatus("Joined room " + message.roomCode, "Your seat is locked in. The board will appear when the host starts.");
			renderRemoteLobby(message.snapshot);
			return;
		}
		if (message.type === "join-denied") {
			setLobbyMessage(message.reason || "The host could not assign that seat.", "bad");
			setStatus("Join denied", "Pick a different seat or ask the host to reopen the slot.");
			return;
		}
		if (message.type === "lobby-state") {
			renderRemoteLobby(message.snapshot);
			return;
		}
		if (message.type === "snapshot") {
			applySnapshot(message.snapshot);
		}
	}

	function renderRemoteLobby(snapshot) {
		if (!snapshot) {
			return;
		}
		multiplayer.currentSnapshot = snapshot;
		var roster = byId("room-roster");
		var html = "";
		for (var i = 0; i < snapshot.seats.length; i++) {
			var seat = snapshot.seats[i];
			var badge = seat.occupied ? seat.isHost ? "Host" : "Joined" : seat.ai === "1" ? "AI" : "Open";
			var displayName = seat.occupied ? seat.occupantName : seat.name;
			html +=
				"<article class='seat-card'>" +
				"<div class='seat-swatch' style='background:" + seat.color + ";'></div>" +
				"<div class='seat-meta'>" +
				"<div class='seat-line'><strong>" + seatLabel(seat.seat) + "</strong><span class='seat-badge'>" + badge + "</span></div>" +
				"<div class='seat-name'>" + escapeHtml(displayName) + "</div>" +
				"</div>" +
				"</article>";
		}
		roster.innerHTML = html;
		if (snapshot.roomCode) {
			byId("share-strip").classList.remove("hidden");
			byId("room-code-display").textContent = snapshot.roomCode;
		}
		setLobbyEnabled(false);
		updateBoardHud();
	}

	function hideLobbyShowGame() {
		byId("table-hero").style.display = "none";
		byId("lobby-screen").style.display = "none";
		byId("game-shell").style.display = "grid";
		updateBoardHud();
	}

	function resetBoardState() {
		for (var i = 1; i <= 8; i++) {
			player[i].name = "";
			player[i].color = "";
			player[i].money = 1500;
			player[i].position = 0;
			player[i].jail = false;
			player[i].jailroll = 0;
			player[i].communityChestJailCard = false;
			player[i].chanceJailCard = false;
			player[i].bidding = true;
			player[i].human = true;
			player[i].creditor = 0;
			player[i].lost = false;
			player[i].index = i;
			player[i].AI = null;
		}

		for (var squareIndex = 0; squareIndex < 40; squareIndex++) {
			square[squareIndex].owner = 0;
			square[squareIndex].mortgage = false;
			square[squareIndex].house = 0;
			square[squareIndex].hotel = 0;
			square[squareIndex].landcount = 0;
		}

		turn = 0;
		doublecount = 0;
		communityChestCards.index = 0;
		chanceCards.index = 0;
		communityChestCards.deck = [];
		chanceCards.deck = [];
		for (var deckIndex = 0; deckIndex < 16; deckIndex++) {
			communityChestCards.deck[deckIndex] = deckIndex;
			chanceCards.deck[deckIndex] = deckIndex;
		}
		chanceCards.deck.sort(function () { return Math.random() - 0.5; });
		communityChestCards.deck.sort(function () { return Math.random() - 0.5; });
		$("#alert, #landed, #owned, #buildings, #statstext, #popuptext").empty();
		$("#trade").hide();
		$("#popupwrap, #popupbackground, #statswrap, #statsbackground").hide();
	}

	function customSetup() {
		resetBoardState();
		pcount = parseInt(byId("playernumber").value, 10);

		for (var seat = 1; seat <= pcount; seat++) {
			var currentPlayer = player[seat];
			currentPlayer.color = byId("player" + seat + "color").value.toLowerCase();
			if (byId("player" + seat + "ai").value === "1") {
				currentPlayer.human = false;
				currentPlayer.AI = new AITest(currentPlayer);
			} else {
				currentPlayer.name = byId("player" + seat + "name").value;
				currentPlayer.human = true;
			}
		}

		$("#board, #moneybar, #control").show();
		$("#setup").hide();
		$("#trade").hide();

		if (pcount === 2) {
			byId("stats").style.width = "454px";
		} else if (pcount === 3) {
			byId("stats").style.width = "686px";
		} else {
			byId("stats").style.width = "";
		}

		byId("stats").style.top = "0px";
		byId("stats").style.left = "0px";

		hideLobbyShowGame();
		play();
	}

	function startGameFromLobby() {
		if (multiplayer.mode === "client") {
			setLobbyMessage("Only the host can start the room.", "bad");
			return;
		}

		if (multiplayer.mode === "host") {
			for (var seat = 2; seat <= getHumanSeatCount(); seat++) {
				if (byId("player" + seat + "ai").value === "0" && !multiplayer.seatAssignments[seat]) {
					byId("player" + seat + "ai").value = "1";
				}
			}
		}

		multiplayer.started = true;
		customSetup();
		scheduleBroadcast();
		setStatus("Game in progress", "Share decisions from your seat. The host keeps the room authoritative.");
		updateBoardHud();
	}

	function patchGameHooks() {
		var methods = ["next", "auctionBid", "auctionPass", "auctionExit", "proposeTrade", "acceptTrade", "cancelTrade", "resign", "bankruptcy", "bankruptcyUnmortgage"];
		for (var i = 0; i < methods.length; i++) {
			if (typeof game[methods[i]] === "function") {
				wrapObjectMethod(game, methods[i], scheduleBroadcast);
			}
		}

		var globals = [
			"popup",
			"showStats",
			"buy",
			"mortgage",
			"unmortgage",
			"buyHouse",
			"sellHouse",
			"addamount",
			"subtractamount",
			"gotojail",
			"gobackthreespaces",
			"payeachplayer",
			"collectfromeachplayer",
			"advance",
			"advanceToNearestUtility",
			"advanceToNearestRailroad",
			"streetrepairs",
			"payfifty",
			"useJailCard",
			"land",
			"roll",
			"play"
		];

		for (var g = 0; g < globals.length; g++) {
			if (typeof window[globals[g]] === "function") {
				wrapGlobalFunction(globals[g], scheduleBroadcast);
			}
		}

		if (typeof game.rollDice === "function") {
			var originalRollDice = game.rollDice;
			game.rollDice = function () {
				var result = originalRollDice.apply(this, arguments);
				multiplayer.latestDice.die1 = game.getDie(1);
				multiplayer.latestDice.die2 = game.getDie(2);
				return result;
			};
		}
	}

	function wrapGlobalFunction(name, callback) {
		var original = window[name];
		window[name] = function () {
			var result = original.apply(this, arguments);
			callback();
			if (name === "popup") {
				window.setTimeout(callback, 450);
			}
			return result;
		};
	}

	function wrapObjectMethod(obj, name, callback) {
		var original = obj[name];
		obj[name] = function () {
			var result = original.apply(obj, arguments);
			callback();
			return result;
		};
	}

	function observeHostUi() {
		if (multiplayer.observer) {
			multiplayer.observer.disconnect();
		}
		multiplayer.observer = new MutationObserver(function () {
			scheduleBroadcast();
		});
		var targets = ["board", "moneybarwrap", "control", "trade", "popupwrap", "popupbackground", "statswrap", "statsbackground"];
		for (var i = 0; i < targets.length; i++) {
			var el = byId(targets[i]);
			if (el) {
				multiplayer.observer.observe(el, { childList: true, subtree: true, attributes: true, characterData: true });
			}
		}
	}

	function scheduleBroadcast() {
		if (multiplayer.mode !== "host" || !multiplayer.started) {
			return;
		}
		window.clearTimeout(multiplayer.broadcastTimer);
		multiplayer.broadcastTimer = window.setTimeout(function () {
			broadcastSnapshot();
		}, 60);
	}

	function serializePlayerState(playerState) {
		return {
			name: playerState.name,
			color: playerState.color,
			money: playerState.money,
			position: playerState.position,
			jail: playerState.jail,
			jailroll: playerState.jailroll,
			communityChestJailCard: playerState.communityChestJailCard,
			chanceJailCard: playerState.chanceJailCard,
			human: playerState.human,
			index: playerState.index,
			creditor: playerState.creditor,
			lost: playerState.lost,
			bidding: playerState.bidding
		};
	}

	function serializeSquareState(squareState) {
		return {
			owner: squareState.owner,
			mortgage: squareState.mortgage,
			house: squareState.house,
			hotel: squareState.hotel,
			landcount: squareState.landcount
		};
	}

	function createSnapshot() {
		return {
			stage: "game",
			roomCode: multiplayer.roomCode,
			lobby: lobbySnapshot(),
			state: {
				pcount: pcount,
				turn: turn,
				doublecount: doublecount,
				players: player.map(serializePlayerState),
				squares: square.map(serializeSquareState),
				chanceIndex: chanceCards.index,
				chanceDeck: chanceCards.deck.slice(),
				communityIndex: communityChestCards.index,
				communityDeck: communityChestCards.deck.slice(),
				dice: {
					die1: multiplayer.latestDice.die1,
					die2: multiplayer.latestDice.die2
				}
			},
			ui: {
				moneybarHtml: byId("moneybarwrap").innerHTML,
				controlHtml: byId("control").innerHTML,
				controlDisplay: byId("control").style.display,
				tradeHtml: byId("trade").innerHTML,
				tradeDisplay: byId("trade").style.display,
				popupTextHtml: byId("popuptext").innerHTML,
				popupWrapDisplay: byId("popupwrap").style.display,
				popupBackgroundDisplay: byId("popupbackground").style.display,
				statsTextHtml: byId("statstext").innerHTML,
				statsWrapDisplay: byId("statswrap").style.display,
				statsBackgroundDisplay: byId("statsbackground").style.display,
				boardDisplay: byId("board").style.display
			}
		};
	}

	function broadcastSnapshot() {
		if (multiplayer.mode !== "host") {
			return;
		}
		var snapshot = createSnapshot();
		eachConnection(function (conn) {
			sendSafe(conn, { type: "snapshot", snapshot: snapshot });
		});
	}

	function applySnapshot(snapshot) {
		if (!snapshot) {
			return;
		}
		multiplayer.currentSnapshot = snapshot;
		if (snapshot.stage === "lobby") {
			renderRemoteLobby(snapshot);
			return;
		}
		multiplayer.started = true;
		hideLobbyShowGame();
		byId("board").style.display = snapshot.ui.boardDisplay || "table";
		byId("control").style.display = snapshot.ui.controlDisplay || "block";
		byId("trade").style.display = snapshot.ui.tradeDisplay || "none";
		byId("moneybarwrap").innerHTML = snapshot.ui.moneybarHtml;
		byId("control").innerHTML = snapshot.ui.controlHtml;
		byId("trade").innerHTML = snapshot.ui.tradeHtml;
		byId("popuptext").innerHTML = snapshot.ui.popupTextHtml;
		byId("popupwrap").style.display = snapshot.ui.popupWrapDisplay || "none";
		byId("popupbackground").style.display = snapshot.ui.popupBackgroundDisplay || "none";
		byId("statstext").innerHTML = snapshot.ui.statsTextHtml;
		byId("statswrap").style.display = snapshot.ui.statsWrapDisplay || "none";
		byId("statsbackground").style.display = snapshot.ui.statsBackgroundDisplay || "none";
		applyGameState(snapshot.state);
		renderBoardState();
		setStatus("Room live: " + snapshot.roomCode, "You are " + seatLabel(multiplayer.localSeat) + ". Controls unlock during your turn.");
		updateBoardHud();
	}

	function applyGameState(state) {
		pcount = state.pcount;
		turn = state.turn;
		doublecount = state.doublecount;
		for (var playerIndex = 0; playerIndex < state.players.length; playerIndex++) {
			var sourcePlayer = state.players[playerIndex];
			if (!sourcePlayer || !player[playerIndex]) {
				continue;
			}
			for (var playerKey in sourcePlayer) {
				if (sourcePlayer.hasOwnProperty(playerKey)) {
					player[playerIndex][playerKey] = sourcePlayer[playerKey];
				}
			}
		}
		for (var squareIndex = 0; squareIndex < state.squares.length; squareIndex++) {
			var sourceSquare = state.squares[squareIndex];
			for (var squareKey in sourceSquare) {
				if (sourceSquare.hasOwnProperty(squareKey)) {
					square[squareIndex][squareKey] = sourceSquare[squareKey];
				}
			}
		}
		chanceCards.index = state.chanceIndex;
		chanceCards.deck = state.chanceDeck.slice();
		communityChestCards.index = state.communityIndex;
		communityChestCards.deck = state.communityDeck.slice();
		multiplayer.latestDice = state.dice || { die1: null, die2: null };
	}

	function renderBoardState() {
		for (var i = 0; i < 40; i++) {
			var ownerBar = byId("cell" + i + "owner");
			if (ownerBar) {
				if (square[i].groupNumber && square[i].owner > 0) {
					ownerBar.style.display = "block";
					ownerBar.style.backgroundColor = player[square[i].owner].color;
					ownerBar.title = player[square[i].owner].name;
				} else if (ownerBar) {
					ownerBar.style.display = "none";
				}
			}
		}

		byId("jail").style.border = "1px solid rgba(125, 94, 48, 0.5)";
		byId("jailpositionholder").innerHTML = "";
		for (var cell = 0; cell < 40; cell++) {
			byId("cell" + cell).style.border = "1px solid rgba(125, 94, 48, 0.35)";
			byId("cell" + cell + "positionholder").innerHTML = "";
		}

		for (var x = 0; x < 40; x++) {
			var left = 0;
			var top = 0;
			for (var y = turn; y <= pcount; y++) {
				if (player[y].position === x && !player[y].jail) {
					byId("cell" + x + "positionholder").innerHTML += tokenMarkup(player[y], left, top);
					if (left === 36) {
						left = 0;
						top = 12;
					} else {
						left += 12;
					}
				}
			}
			for (var z = 1; z < turn; z++) {
				if (player[z].position === x && !player[z].jail) {
					byId("cell" + x + "positionholder").innerHTML += tokenMarkup(player[z], left, top);
					if (left === 36) {
						left = 0;
						top = 12;
					} else {
						left += 12;
					}
				}
			}
		}

		var jailLeft = 0;
		var jailTop = 53;
		for (var playerSeat = turn; playerSeat <= pcount; playerSeat++) {
			if (player[playerSeat].jail) {
				byId("jailpositionholder").innerHTML += tokenMarkup(player[playerSeat], jailLeft, jailTop);
				if (jailLeft === 36) {
					jailLeft = 0;
					jailTop = 41;
				} else {
					jailLeft += 12;
				}
			}
		}
		for (var otherSeat = 1; otherSeat < turn; otherSeat++) {
			if (player[otherSeat].jail) {
				byId("jailpositionholder").innerHTML += tokenMarkup(player[otherSeat], jailLeft, jailTop);
				if (jailLeft === 36) {
					jailLeft = 0;
					jailTop = 41;
				} else {
					jailLeft += 12;
				}
			}
		}
		renderRemoteDice();
		updateBoardHud();
	}

	function tokenMarkup(playerState, left, top) {
		return "<div class='cell-position' title='" + escapeHtml(playerState.name) + "' style='background-color:" + playerState.color + "; left:" + left + "px; top:" + top + "px;'></div>";
	}

	function renderRemoteDice() {
		var dieIds = ["die0", "die1"];
		var values = [multiplayer.latestDice.die1, multiplayer.latestDice.die2];
		for (var i = 0; i < dieIds.length; i++) {
			var die = byId(dieIds[i]);
			if (!die || !values[i]) {
				continue;
			}
			die.classList.remove("die-no-img");
			die.title = "Die (" + values[i] + " spots)";
			if (!die.firstChild) {
				die.appendChild(document.createElement("img"));
			}
			die.firstChild.src = "images/Die_" + values[i] + ".png";
			die.firstChild.alt = String(values[i]);
		}
	}

	function attachClientActionRelay() {
		document.addEventListener("click", function (event) {
			if (multiplayer.mode !== "client" || !multiplayer.started) {
				return;
			}
			var actionable = event.target.closest("#control input, #control a, #trade input, #trade button, #moneybarwrap input, #popupwrap input, #statswrap img");
			if (!actionable) {
				return;
			}
			if (!canClientInteract(actionable)) {
				event.preventDefault();
				return;
			}
			event.preventDefault();
			sendClientAction({
				kind: "click",
				id: actionable.id || "",
				path: buildElementPath(actionable)
			});
		}, true);

		document.addEventListener("change", function (event) {
			if (multiplayer.mode !== "client" || !multiplayer.started) {
				return;
			}
			var field = event.target.closest("#control input, #control select, #trade input, #trade select");
			if (!field || !canClientInteract(field)) {
				return;
			}
			sendClientAction({
				kind: "change",
				id: field.id || "",
				path: buildElementPath(field),
				value: field.value,
				checked: !!field.checked
			});
		}, true);
	}

	function canClientInteract(element) {
		var id = element.id || "";
		if (id === "viewstats" || id === "statsclose") {
			return true;
		}
		return multiplayer.currentSnapshot && multiplayer.currentSnapshot.state && multiplayer.currentSnapshot.state.turn === multiplayer.localSeat;
	}

	function sendClientAction(action) {
		if (multiplayer.hostConnection && multiplayer.hostConnection.open) {
			multiplayer.hostConnection.send({ type: "dom-action", action: action });
		}
	}

	function buildElementPath(element) {
		var path = [];
		var current = element;
		while (current && current !== document.body) {
			var parent = current.parentNode;
			if (!parent) {
				break;
			}
			path.unshift(Array.prototype.indexOf.call(parent.children, current));
			current = parent;
		}
		return path;
	}

	function resolveElementPath(path) {
		var current = document.body;
		for (var i = 0; i < path.length; i++) {
			if (!current || !current.children[path[i]]) {
				return null;
			}
			current = current.children[path[i]];
		}
		return current;
	}

	function applyRemoteDomAction(action) {
		if (!action) {
			return;
		}
		var element = action.id ? byId(action.id) : null;
		if (!element && action.path) {
			element = resolveElementPath(action.path);
		}
		if (!element) {
			return;
		}
		window.__monopolyRemoteActionInProgress = true;
		try {
			if (action.kind === "change") {
				if (typeof action.checked === "boolean" && element.type === "checkbox") {
					element.checked = action.checked;
				}
				if (typeof action.value !== "undefined") {
					element.value = action.value;
				}
				element.dispatchEvent(new Event("change", { bubbles: true }));
				return;
			}
			element.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
		} finally {
			window.__monopolyRemoteActionInProgress = false;
		}
	}

	function initDefaults() {
		for (var i = 1; i <= 8; i++) {
			playerDefaults[i] = {
				name: byId("player" + i + "name").value,
				color: byId("player" + i + "color").value,
				ai: byId("player" + i + "ai").value
			};
		}
	}

	window.addEventListener("load", function () {
		buildShell();
		initDefaults();
		attachLobbyEvents();
		attachClientActionRelay();
		patchGameHooks();
		observeHostUi();
		setLobbyEnabled(true);
		updateLobbyUI();
		setStatus("Choose a room mode", "Host a table or join one with a code.");
		if (typeof playernumber_onchange === "function") {
			playernumber_onchange();
		}
		var queryRoom = getUrlRoomCode();
		if (queryRoom) {
			byId("join-room-code").value = queryRoom.toUpperCase();
			setLobbyMessage("Room code detected in the link. Enter your name and join when you're ready.", "neutral");
		}
		window.setup = customSetup;
	});
})();
