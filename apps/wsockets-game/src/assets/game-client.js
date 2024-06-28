let game = null;

const playersContainer = document.getElementById('players');
const playerTemplate = document.getElementById('player-template');
const startBtn = document.getElementById('start-button');

function createMessage(message) {
    return new Blob([JSON.stringify(message, null, 2)], {
        type: 'application/json',
    });
}

function handleMessage(message) {
    console.log('Message from server ', message);
    if (message.type === 'gameNotFound' || message.type === 'playerNotFound') {
        window.location.pathname = '/not-found';
        return;
    } else if (message.type === 'joinGame') {
        game = message.game;

        game.players.forEach((p) => {
            const playerView = playersContainer.querySelector(
                `[data-player="${p.name}"]`
            );
            if (playerView) {
                return;
            }

            const newPlayerView = playerTemplate.content.cloneNode(true);
            const firstChild = newPlayerView.children[0];
            firstChild.setAttribute('data-player', p.name);
            firstChild.querySelector('span').textContent = p.name;
            firstChild.querySelector('div > div').style.backgroundColor =
                p.color;
            playersContainer.appendChild(newPlayerView);
        });

        document.querySelectorAll('[data-tile]').forEach((tile, idx) => {
            const field = game.fields[idx];
            if (!field.owned) {
                return;
            }

            const player = game.players.find((p) => p.name === field.owned);
            tile.style.backgroundColor = player.color;
        });
    } else if (message.type === 'gameStarted') {
        startBtn.remove();
    } else if (message.type === 'playerLeft') {
        playersContainer
            .querySelector(`[data-player="${message.player}"]`)
            ?.remove();
    } else if (message.type === 'updateGamePosition') {
        if (!game) {
            return;
        }

        const tile = document.querySelector(
            `[data-tile="${message.field.row},${message.field.column}"]`
        );
        if (!tile) {
            return;
        }

        const player = game.players.find((p) => p.name === message.field.owned);
        tile.style.backgroundColor = player.color;
    }
}

function createSocket(hostName, player, gameId) {
    const socket = new WebSocket(`ws://${hostName}`, 'echo-protocol');

    socket.addEventListener('open', () => {
        socket.send(createMessage({ type: 'join', player, gameId }));
    });

    socket.addEventListener('message', async (event) => {
        console.log(event);
        const message = await event.data.text();
        const jsonMessage = JSON.parse(message);

        handleMessage(jsonMessage);
    });

    return socket;
}

function tileClicked(e, gameId, player, socket) {
    const [x, y] = e.target
        .getAttribute('data-tile')
        .split(',')
        .map((positionPart) => Number(positionPart));

    socket.send(createMessage({ type: 'playPosition', player, gameId, x, y }));
}

(() => {
    const gameId = window.location.pathname.split('/').at(-1);
    const searchParams = new URLSearchParams(window.location.search);
    const player = searchParams.get('player');

    const socket = createSocket(window.location.host, player, gameId);

    startBtn?.addEventListener('click', () => {
        const obj = { type: 'startGame', player, gameId };
        const message = new Blob([JSON.stringify(obj, null, 2)], {
            type: 'application/json',
        });

        socket.send(message);
    });

    document.querySelectorAll('[data-tile]').forEach((tile) => {
        tile.addEventListener('click', (e) =>
            tileClicked(e, gameId, player, socket)
        );
    });
})();
