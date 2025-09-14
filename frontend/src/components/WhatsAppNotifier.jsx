import React, { useState, useEffect } from 'react';

const WhatsAppNotifier = ({ match, tournamentName, onComplete }) => {
    const [playersToNotify, setPlayersToNotify] = useState([]);
    const [notifiedPlayers, setNotifiedPlayers] = useState([]);
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        if (match) {
            const players = [
                ...(match.teamA?.players || []),
                ...(match.teamB?.players || [])
            ].filter(p => p.phoneNumber); // Solo jugadores con teléfono
            setPlayersToNotify(players);
        }
    }, [match]);

    const formatPhoneNumber = (phone) => {
        // Limpia el número de caracteres no numéricos
        const cleaned = ('' + phone).replace(/\D/g, '');
        // Asume que si no empieza con 54, es un número local de Argentina
        if (cleaned.length === 10 && !cleaned.startsWith('54')) {
            return '549' + cleaned;
        }
        if (cleaned.startsWith('549')) {
            return cleaned;
        }
        // Devuelve el número limpiado si no coincide con los formatos esperados
        return cleaned;
    };

    const handleNotify = (player) => {
        if (!player || !player.phoneNumber) {
            alert('Este jugador no tiene un número de teléfono válido.');
            return;
        }

        const formattedPhone = formatPhoneNumber(player.phoneNumber);
        const date = match.matchTime ? new Date(match.matchTime).toLocaleDateString('es-AR') : 'Fecha a confirmar';
        const time = match.matchTime ? new Date(match.matchTime).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : 'Hora a confirmar';

        const message = `¡Hola ${player.playerName}! Te informamos los datos de tu próximo partido del torneo "${tournamentName}":
-  соперник: ${match.teamA.teamName} vs ${match.teamB.teamName}
- Lugar: ${match.matchPlace || 'A confirmar'}
- Fecha: ${date}
- Hora: ${time} hs

¡Mucha suerte!`;

        const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;

        // Abrir WhatsApp en una nueva pestaña
        window.open(whatsappUrl, '_blank');

        // Marcar al jugador como notificado
        setNotifiedPlayers([...notifiedPlayers, player._id]);

        // Preguntar si desea continuar
        if (playersToNotify.length > notifiedPlayers.length + 1) {
            if (!window.confirm('¡Mensaje preparado! Cuando vuelvas a esta ventana, ¿quieres notificar al siguiente jugador?')) {
                // Si el usuario cancela, detenemos el proceso
                setPlayersToNotify([]); // Limpiamos la cola para detener
            }
        } else {
            // Era el último jugador
            alert('Todos los jugadores han sido notificados.');
            onComplete();
        }
    };

    if (!playersToNotify.length) {
        return null;
    }

    const currentPlayer = playersToNotify[notifiedPlayers.length];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-8 shadow-xl border border-gray-700 max-w-lg w-full">
                <h3 className="text-2xl font-bold text-white mb-4">Notificar Jugadores</h3>
                <p className="text-gray-300 mb-6">
                    Se abrirá WhatsApp para enviar los detalles del partido. Vuelve a esta pestaña para continuar con el siguiente jugador.
                </p>

                {currentPlayer ? (
                    <div className="text-center">
                        <p className="text-lg text-gray-400 mb-2">Siguiente jugador a notificar:</p>
                        <p className="text-xl font-semibold text-green-400 mb-6">{currentPlayer.playerName}</p>
                        <button
                            onClick={() => handleNotify(currentPlayer)}
                            className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition duration-300 ease-in-out transform hover:scale-105"
                        >
                            <i className="fab fa-whatsapp mr-2"></i> Notificar a {currentPlayer.playerName}
                        </button>
                    </div>
                ) : (
                    <p className="text-green-400 text-center">¡Todos los jugadores han sido notificados!</p>
                )}


                <button
                    onClick={onComplete}
                    className="w-full mt-4 bg-gray-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-gray-700 transition"
                >
                    Finalizar
                </button>
            </div>
        </div>
    );
};

export default WhatsAppNotifier;